import { run } from './main'
import { execSync } from 'node:child_process'

const commit: string = execSync('git rev-parse --short HEAD').toString()

const specFile = './petstore.yaml'

run(
  commit,
  specFile
)
