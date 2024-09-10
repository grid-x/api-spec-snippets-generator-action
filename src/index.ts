/**
 * The entrypoint for the action.
 */
import { run } from './main'
import * as core from '@actions/core'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
const discourseUrl: string = core.getInput('discourse_url')
const discoursePostId: string = core.getInput('discourse_post_id')
const discourseApiKey: string = core.getInput('discourse_api_key')
const discourseUser: string = core.getInput('discourse_user')
const commit: string = core.getInput('github_sha')

const specFile: string = core.getInput('spec_file')
run(
  discourseUrl,
  discoursePostId,
  discourseApiKey,
  discourseUser,
  commit,
  specFile
)
