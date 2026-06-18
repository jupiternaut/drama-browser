#!/usr/bin/env bun
import { execFile } from 'node:child_process'
import { existsSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { promisify } from 'node:util'

type Surface = 'graph' | 'plm' | 'crew'

interface Options {
  zenApp: string
  launcher: string
  runtimeUrl: string
  surface: Surface
  attempts: number
  timeoutMs: number
  output: string | null
}

const execFileAsync = promisify(execFile)

function usage(): never {
  console.log(`Usage: bun run scripts/verify-zen-concurrent-launch.ts --zen-app PATH [options]

Options:
  --launcher PATH             Launcher script. Default: scripts/launch-zen-drama-mac.sh
  --runtime-url URL           Drama runtime URL. Default: http://127.0.0.1:3198
  --surface graph|plm|crew    Surface to open concurrently. Default: plm
  --attempts N                Concurrent launch attempts. Default: 5
  --timeout-ms MS             Per-launch timeout. Default: 60000
  --output PATH               Optional JSON output path.
`)
  process.exit(0)
}

function parseSurface(value: string): Surface {
  if (value === 'graph' || value === 'plm' || value === 'crew') return value
  throw new Error(`Invalid surface: ${value}`)
}

function parseArgs(argv: string[]): Options {
  const options: Options = {
    zenApp: process.env.ZEN_APP ?? '',
    launcher: 'scripts/launch-zen-drama-mac.sh',
    runtimeUrl: process.env.DRAMA_RUNTIME_URL ?? 'http://127.0.0.1:3198',
    surface: 'plm',
    attempts: 5,
    timeoutMs: 60_000,
    output: null,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--zen-app') {
      options.zenApp = argv[index + 1] ?? ''
      index += 1
    } else if (arg === '--launcher') {
      options.launcher = argv[index + 1] ?? options.launcher
      index += 1
    } else if (arg === '--runtime-url') {
      options.runtimeUrl = argv[index + 1] ?? options.runtimeUrl
      index += 1
    } else if (arg === '--surface') {
      options.surface = parseSurface(argv[index + 1] ?? 'plm')
      index += 1
    } else if (arg === '--attempts') {
      options.attempts = Number(argv[index + 1] ?? options.attempts)
      index += 1
    } else if (arg === '--timeout-ms') {
      options.timeoutMs = Number(argv[index + 1] ?? options.timeoutMs)
      index += 1
    } else if (arg === '--output') {
      options.output = argv[index + 1] ?? null
      index += 1
    } else if (arg === '-h' || arg === '--help') {
      usage()
    } else {
      throw new Error(`Unknown option: ${arg}`)
    }
  }

  options.zenApp = resolve(options.zenApp)
  options.launcher = resolve(options.launcher)
  if (options.output) options.output = resolve(options.output)
  if (!existsSync(options.zenApp)) throw new Error(`Zen app was not found: ${options.zenApp}`)
  if (!existsSync(options.launcher)) throw new Error(`Launcher was not found: ${options.launcher}`)
  if (!Number.isInteger(options.attempts) || options.attempts < 1) throw new Error('--attempts must be a positive integer.')
  return options
}

async function execCapture(file: string, args: string[], timeoutMs = 10_000) {
  const started = performance.now()
  try {
    const { stdout, stderr } = await execFileAsync(file, args, {
      timeout: timeoutMs,
      maxBuffer: 2 * 1024 * 1024,
    })
    return {
      ok: true,
      code: 0,
      durationMs: Math.round(performance.now() - started),
      stdout: String(stdout),
      stderr: String(stderr),
    }
  } catch (error) {
    const failed = error as {
      stdout?: string | Buffer
      stderr?: string | Buffer
      code?: number | string | null
      message?: string
    }
    return {
      ok: false,
      code: failed.code ?? null,
      durationMs: Math.round(performance.now() - started),
      stdout: String(failed.stdout ?? ''),
      stderr: String(failed.stderr ?? ''),
      error: failed.message,
    }
  }
}

async function fetchJson(url: string, timeoutMs = 2_000) {
  const started = performance.now()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { signal: controller.signal })
    const body = await response.json().catch(() => null)
    return {
      ok: response.ok,
      status: response.status,
      durationMs: Math.round(performance.now() - started),
      body,
    }
  } catch (error) {
    return {
      ok: false,
      durationMs: Math.round(performance.now() - started),
      body: null,
      error: error instanceof Error ? error.message : String(error),
    }
  } finally {
    clearTimeout(timeout)
  }
}

async function countListeners(port: number) {
  const result = await execCapture('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN'], 5_000)
  const lines = result.stdout.split(/\r?\n/).filter(Boolean)
  const entries = lines[0]?.startsWith('COMMAND') ? lines.slice(1) : lines
  return {
    port,
    count: entries.length,
    entries,
    ok: result.ok || entries.length === 0,
    error: result.ok ? undefined : result.error,
  }
}

function runtimePort(runtimeUrl: string): number {
  const parsed = new URL(runtimeUrl)
  if (parsed.port) return Number(parsed.port)
  return parsed.protocol === 'https:' ? 443 : 80
}

function sidecarPort(sidecarStatus: unknown): number {
  if (sidecarStatus && typeof sidecarStatus === 'object' && 'port' in sidecarStatus) {
    const value = Number((sidecarStatus as { port?: unknown }).port)
    if (Number.isFinite(value)) return value
  }
  return 8005
}

function ensureOutput(path: string, body: unknown): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(body, null, 2)}\n`)
}

const options = parseArgs(process.argv.slice(2))
const startedAt = new Date()
const launches = await Promise.all(Array.from({ length: options.attempts }, async (_item, index) => ({
  attempt: index + 1,
  ...await execCapture('bash', [
    options.launcher,
    '--zen-app',
    options.zenApp,
    '--surface',
    options.surface,
    '--runtime-url',
    options.runtimeUrl,
    '--internal-app',
    'auto',
  ], options.timeoutMs),
})))

await new Promise((resolveWait) => setTimeout(resolveWait, 1_000))
const runtimeStatus = await fetchJson(`${options.runtimeUrl.replace(/\/+$/, '')}/runtime/status`)
const sidecarStatus = await fetchJson(`${options.runtimeUrl.replace(/\/+$/, '')}/plm/runtime/status?checkHealth=true`, 5_000)
const runtimeListeners = await countListeners(runtimePort(options.runtimeUrl))
const plotPilotListeners = await countListeners(sidecarPort(sidecarStatus.body))
const runtimeReady = (runtimeStatus.body as { state?: unknown } | null)?.state === 'ready'
const sidecarHealthy = (sidecarStatus.body as { healthy?: unknown } | null)?.healthy === true
const ok = launches.every((launch) => launch.ok)
  && runtimeReady
  && sidecarHealthy
  && runtimeListeners.count === 1
  && plotPilotListeners.count === 1

const output = {
  ok,
  schema: 'zen-concurrent-launch-verification.v1',
  startedAt: startedAt.toISOString(),
  generatedAt: new Date().toISOString(),
  attempts: options.attempts,
  surface: options.surface,
  zenApp: options.zenApp,
  runtimeUrl: options.runtimeUrl,
  launches,
  runtimeStatus,
  sidecarStatus,
  listenerCounts: {
    runtime: runtimeListeners,
    plotPilot: plotPilotListeners,
  },
  failureReasons: [
    ...launches.filter((launch) => !launch.ok).map((launch) => `launch ${launch.attempt} failed: ${launch.error ?? launch.stderr}`),
    ...(runtimeReady ? [] : ['Drama runtime is not ready after concurrent launch attempts.']),
    ...(sidecarHealthy ? [] : ['PlotPilot sidecar is not healthy after concurrent launch attempts.']),
    ...(runtimeListeners.count === 1 ? [] : [`Expected one Drama runtime listener, found ${runtimeListeners.count}.`]),
    ...(plotPilotListeners.count === 1 ? [] : [`Expected one PlotPilot listener, found ${plotPilotListeners.count}.`]),
  ],
}

if (options.output) ensureOutput(options.output, output)
console.log(JSON.stringify(output, null, 2))
if (!ok) process.exit(1)
