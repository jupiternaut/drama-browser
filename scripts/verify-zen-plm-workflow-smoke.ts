#!/usr/bin/env bun

interface Options {
  runtimeUrl: string
  projectId: string
  title: string
}

function parseArgs(argv: string[]): Options {
  const options: Options = {
    runtimeUrl: process.env.DRAMA_RUNTIME_URL ?? 'http://127.0.0.1:3198',
    projectId: `zen-plm-v4-smoke-${Date.now()}`,
    title: 'Zen PLM v4 workflow smoke prompt',
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--runtime-url') {
      options.runtimeUrl = argv[index + 1] ?? options.runtimeUrl
      index += 1
    } else if (arg === '--project-id') {
      options.projectId = argv[index + 1] ?? options.projectId
      index += 1
    } else if (arg === '--title') {
      options.title = argv[index + 1] ?? options.title
      index += 1
    } else if (arg === '-h' || arg === '--help') {
      console.log('Usage: bun run scripts/verify-zen-plm-workflow-smoke.ts [--runtime-url URL] [--project-id ID] [--title TITLE]')
      process.exit(0)
    } else {
      throw new Error(`Unknown option: ${arg}`)
    }
  }

  return options
}

async function runtimeRpc<T>(runtimeUrl: string, channel: string, payload?: unknown): Promise<T> {
  const response = await fetch(`${runtimeUrl.replace(/\/+$/, '')}/runtime/rpc`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ channel, payload }),
  })
  const body = await response.json() as { ok?: boolean; data?: T; error?: { message?: string } }
  if (!response.ok || !body.ok) {
    throw new Error(body.error?.message ?? `Runtime RPC ${channel} returned HTTP ${response.status}.`)
  }
  return body.data as T
}

async function readRuntimeStatus(runtimeUrl: string): Promise<Record<string, unknown>> {
  const response = await fetch(`${runtimeUrl.replace(/\/+$/, '')}/runtime/status`)
  if (!response.ok) throw new Error(`Runtime status returned HTTP ${response.status}.`)
  return await response.json() as Record<string, unknown>
}

const options = parseArgs(process.argv.slice(2))
const runtimeStatus = await readRuntimeStatus(options.runtimeUrl)
if (runtimeStatus.state !== 'ready') {
  throw new Error(`Drama runtime is ${String(runtimeStatus.state ?? 'unknown')}; expected ready.`)
}

const recordPayload = {
  projectId: options.projectId,
  source: 'plm',
  type: 'plm.storageCard.prompt.saved',
  title: options.title,
  summary: {
    surface: 'zen-plm',
    verification: 'workflow-smoke',
  },
  payload: {
    promptKey: 'chapter.generate.prose',
    templatePreview: 'Use story_state, beat sheet, character voice, and long context.',
    savedAt: new Date().toISOString(),
  },
}
const recordResult = await runtimeRpc<Record<string, unknown>>(options.runtimeUrl, 'drama:projectFile:record', recordPayload)
const listResult = await runtimeRpc<{ files?: Array<Record<string, unknown>>; projectDir?: string }>(
  options.runtimeUrl,
  'drama:projectFile:list',
  {
    projectId: options.projectId,
    source: 'plm',
    typePrefix: 'plm.storageCard.prompt',
    limit: 10,
  },
)
const matchedRecord = (listResult.files ?? []).find((record) => record.title === options.title)
const ok = typeof recordResult.filePath === 'string' && Boolean(matchedRecord)

console.log(JSON.stringify({
  ok,
  runtimeStatus: {
    state: runtimeStatus.state,
    workspaceRoot: runtimeStatus.workspaceRoot,
  },
  projectId: options.projectId,
  recordResult,
  listResult: {
    projectDir: listResult.projectDir,
    fileCount: listResult.files?.length ?? 0,
    matchedRecord,
  },
}, null, 2))

if (!ok) process.exit(1)
