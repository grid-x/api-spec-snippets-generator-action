import { run } from './main'

//const specFile = './solution-api.yaml'
const specFile = './petstore.yaml'
const outFile = './petstore-with-samples.json'

run(specFile, outFile, [
  'go',
  'python',
  'shell',
  'java',
  'kotlin',
  'swift',
  'csharp'
])
