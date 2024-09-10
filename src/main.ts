import * as core from '@actions/core'
import OASNormalize from 'oas-normalize';
import Oas from 'oas'
import { OASDocument } from 'oas/types';

import { writeFile } from 'node:fs/promises'

//import httpsnippetClientAPIPlugin from 'httpsnippet-client-api';



/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(
  commit: string,
  specFile: string
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
      .then(oas => writeFile(specFile+".mod.json", JSON.stringify(oas.getDefinition())))
      .catch(err => {
        console.log(err);
      })

  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}

