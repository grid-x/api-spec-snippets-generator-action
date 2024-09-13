import { run } from './main'

//const specFile = './solution-api.yaml'
//const outFile = './solution-api.mod.json'

const specFile = './der-controlling.yaml'
const outFile = './der-controlling.mod.json'

run(specFile, outFile, ['go', 'python', 'shell', 'java', 'kotlin', 'swift'])
