import * as core from '@actions/core'
import OASNormalize from 'oas-normalize';
import Oas from 'oas'
import { OASDocument } from 'oas/types';
import { HTTPSnippet } from '@readme/httpsnippet';


import { writeFile } from 'node:fs/promises'
import oasToSnippet from '@readme/oas-to-snippet';
import oasToHar from '@readme/oas-to-har';

import { Language, SupportedLanguages } from '@readme/oas-to-snippet/languages';

const DEFAULT_LANGUAGES: Language[] = ['go', 'python', 'shell', 'java', 'kotlin', 'swift']

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(
  commit: string,
  specFile: string,
  languages?: Language[]
): Promise<void> {
  try {
    const spec = new OASNormalize(specFile, { enablePaths: true });
    const version = await spec.version()

    if (version.specification !== 'openapi') {
      throw new Error(`Only OpenAPI versions > 3 are supported. You used ${version.specification}`)
    }
    spec
      .validate({ convertToLatest: true })
      .then(definition => definition as OASDocument)  // we validate it's not legacy swagger above and exit otherwise
      .then(definition => new Oas(definition))
      .then(oas => {
        // generate and add snippets

        // add snippet for each operation
        Object.entries(oas.getPaths()).forEach(([path, operations]) => {
          Object.entries(operations).forEach(async ([verb, operation]) => {
            const data = new HTTPSnippet(oasToHar(oas,operation).log.entries[0].request)
            console.log(JSON.stringify(data,null,2))

            await Promise.all([(languages?.length ? languages : DEFAULT_LANGUAGES)
              .forEach(lang => {
               // console.log(JSON.stringify(operation.getParameters(), null, 2))
                const snippet = oasToSnippet(
                  oas,
                  operation,
                  {},
                  {},
                  lang,
                );
                //console.log(path, verb, operation.getOperationId())
                if (snippet.code)
                  return writeFile("snippets/" + operation.getOperationId() + "." + lang, snippet.code)
                else return undefined
              })]);


            const samples = oas.getExtension("x-codeSamples", operation)

          })

        });
        return oas
      })
      .then(oas => writeFile(specFile + ".mod.json", JSON.stringify(oas.api)))
      .catch(err => {
        console.log(err);
      })

  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}

