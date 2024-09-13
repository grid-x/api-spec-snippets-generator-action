/**
 * The entrypoint for the action.
 */
import { SupportedTargets } from '@readme/oas-to-snippet/languages'
import { run } from './main'
import * as core from '@actions/core'

const specFile: string = core.getInput('spec_file')
const outFile: string = core.getInput('out_file')
const langs: SupportedTargets[] = core
  .getInput('languages')
  .split(',')
  .map(l => l as SupportedTargets)
run(specFile, outFile, langs)
