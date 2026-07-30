import * as core from '@actions/core'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { run } from '../src/main'

jest.mock('@actions/core', () => ({
  getInput: jest.fn(),
  info: jest.fn(),
  setFailed: jest.fn()
}))

type GeneratedOperation = {
  'x-code-samples': Array<{
    lang: string
    label: string
    source: string
  }>
}

const generateSpec = async (
  specFile: string,
  languages: Parameters<typeof run>[2]
): Promise<Record<string, unknown>> => {
  const dir = await mkdtemp(join(tmpdir(), 'api-snippets-'))
  const outFile = join(dir, 'with-samples.json')

  try {
    await run(specFile, outFile, languages)
    return JSON.parse(await readFile(outFile, 'utf8')) as Record<
      string,
      unknown
    >
  } finally {
    await rm(dir, { force: true, recursive: true })
  }
}

const operationAt = (
  spec: Record<string, unknown>,
  path: string,
  method: string
): GeneratedOperation => {
  const paths = spec.paths as Record<string, Record<string, GeneratedOperation>>
  return paths[path][method]
}

describe('run', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('writes the output before resolving', async () => {
    const spec = await generateSpec(join(process.cwd(), 'petstore.yaml'), [
      'shell'
    ])

    expect(core.setFailed).not.toHaveBeenCalled()
    expect(operationAt(spec, '/pets', 'get')['x-code-samples']).toHaveLength(1)
  })

  it('generates snippets for the Xquik search operation', async () => {
    const spec = await generateSpec(join(__dirname, 'fixtures', 'xquik.yaml'), [
      'shell',
      'python'
    ])
    const samples = operationAt(spec, '/api/v1/x/tweets/search', 'get')[
      'x-code-samples'
    ]

    expect(core.setFailed).not.toHaveBeenCalled()
    expect(samples.map(sample => sample.lang)).toEqual(['shell', 'python'])
    expect(samples.map(sample => sample.source).join('\n')).toContain(
      'https://xquik.com/api/v1/x/tweets/search'
    )
  })
})
