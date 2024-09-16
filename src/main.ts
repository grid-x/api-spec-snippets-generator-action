import * as core from '@actions/core'
import OASNormalize from 'oas-normalize'
import Oas from 'oas'
import { HttpMethods, OASDocument } from 'oas/types'

import { writeFile } from 'node:fs/promises'
import oasToSnippet from '@readme/oas-to-snippet'

import { SupportedTargets } from '@readme/oas-to-snippet/languages'
import { Operation } from 'oas/operation'

const DEFAULT_LANGUAGES: SupportedTargets[] = [
  'go',
  'python',
  'shell',
  'java',
  'kotlin',
  'swift'
]
type Path = string
type HttpVerb = HttpMethods
type Snippet = {
  lang: SupportedTargets
  label: string
  source: string
}
type SnippetDirectory = Record<Path, Record<HttpVerb, Snippet[]>>

const EXTENSION_TAG = 'x-code-samples'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(
  specFile: string,
  outFile: string,
  languages?: SupportedTargets[]
): Promise<void> {
  try {
    const spec = new OASNormalize(specFile, { enablePaths: true })
    const version = await spec.version()

    if (version.specification !== 'openapi') {
      throw new Error(
        `Only OpenAPI versions > 3 are supported. You used ${version.specification}`
      )
    }
    core.info(`Augmenting ${specFile} with code examples.`)
    spec
      .validate({ convertToLatest: true })
      .then(definition => definition as OASDocument) // we validate it's not legacy swagger above and exit otherwise
      .then(definition => new Oas(definition)) // parse spec
      .then(async oas =>
        generateSnippets(oas, languages?.length ? languages : DEFAULT_LANGUAGES)
      )
      .then(({ oas, snippets }) => addSnippetsToSpec(oas.api, snippets))
      .then(
        async spec => await writeFile(outFile, JSON.stringify(spec, null, 1))
      )
      .then(() => core.info(`Wrote ${outFile}.`))
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}

const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const highlighter = (lang: SupportedTargets): SupportedTargets => {
  switch (lang) {
    case 'swift':
      return 'javascript'
    case 'kotlin':
      return 'java'
    default:
      return lang
  }
}

const generateSnippets = async (
  oas: Oas,
  languages: SupportedTargets[]
): Promise<{ oas: Oas; snippets: SnippetDirectory }> => {
  await oas.dereference() // inline schemas, required to generate examples
  const snippets: SnippetDirectory = {}
  // add snippet for each operation
  Object.entries(oas.getPaths()).forEach(([path, operations]) => {
    // paths
    Object.entries(operations).forEach(async ([verb, operation]) => {
      // http verbs per path
      const method = verb as HttpMethods // need to explicitly cast here, the underlying type is off

      languages.forEach(lang => {
        core.info(`Generating ${lang} snippet for ${verb} ${path}.`)
        const snippet = oasToSnippet(
          oas,
          operation,
          { body: generateExample(operation), header: {}, path: {}, query: {} }, // needs to be revisited once/if we maintain example values in the specs
          {}, // no user/pass auth required, auth headers are in place
          lang
        )
        if (snippet.code) {
          snippets[path] = snippets[path]
            ? snippets[path]
            : ({} as Record<HttpVerb, Snippet[]>)
          snippets[path][method] = snippets[path][method]
            ? snippets[path][method]
            : []
          snippets[path][method].push({
            lang: highlighter(lang),
            label: capitalize(lang),
            source: snippet.code
          })
        } else return undefined
      })
    })
  })
  return { oas, snippets }
}

const addSnippetsToSpec = (
  spec: OASDocument,
  snippets: SnippetDirectory
): OASDocument => {
  // the OAS library we use does not offer editing the spec,
  // so we need to mangle the plain API Spec Object ¯\_(ツ)_/¯
  Object.entries(snippets).forEach(([path, operationSnippets]) => {
    Object.entries(operationSnippets).forEach(([verb, langs]) => {
      // @ts-expect-error Didn't get the HTTP Verb type right yet, but this won't fail.
      const operation = spec?.paths?.[path]?.[verb]

      if (operation) {
        core.info(`Adding samples to ${verb} ${path}.`)
        operation[EXTENSION_TAG] = Object.values(langs)
      } else {
        throw new Error(
          'Generated a snippet for a path that could not be found. This should never happen.'
        )
      }
    })
  })
  return spec
}

const generateExample = (operation: Operation): unknown => {
  // currently only picks the first explicitly defined example
  // we might want to steal rapidoc example generation at some point
  // https://github.com/rapi-doc/RapiDoc/blob/ebda9d7b3ac0d1b35ee4210c4a493a01567f4c87/src/utils/schema-utils.js#L860
  return operation.getRequestBodyExamples()?.[0]?.examples?.[0]
}
