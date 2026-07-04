#!/usr/bin/env bun
import { execFile } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { promisify } from 'node:util'

import { classifyDramaPlmSurface } from '../packages/drama-host/src/index.ts'

type Surface = 'graph' | 'plm' | 'crew' | 'memory'
type DetectorState = 'pass' | 'fail' | 'not-run'
type ReadinessState = 'ready' | 'pending' | 'blocked'

interface Options {
  zenApp?: string
  runtimeUrl: string
  surfaces: Surface[]
  output: string
  screenshotDir: string
  capture: boolean
  capturePreflight: boolean
  waitMs: number
  strict: boolean
  screenshotPaths: Map<Surface, string>
  textSnapshotPaths: Map<Surface, string>
}

interface CommandResult {
  ok: boolean
  stdout: string
  stderr: string
  code?: number | string | null
  message?: string
}

interface EndpointRead {
  ok: boolean
  url: string
  status?: number
  durationMs: number
  body: unknown
  error?: string
}

interface DetectorResult {
  name: string
  state: DetectorState
  reason: string
  metrics?: Record<string, number | string | boolean | null>
}

interface ScreenshotAnalysis {
  path: string
  exists: boolean
  width?: number
  height?: number
  fileSize?: number
  meanLuma?: number
  lumaStdDev?: number
  blackRatio?: number
  whiteRatio?: number
  error?: string
}

const execFileAsync = promisify(execFile)
const SURFACES: Surface[] = ['graph', 'plm', 'crew', 'memory']
const DEFAULT_RUNTIME_URL = 'http://127.0.0.1:3198'
const DEFAULT_ZEN_APP = '/Users/gengrf/drama-browser/dist/zen-drama-mac-sourcebuilt/Zen Browser.app'
const OMNI_RESOURCE_PATH = 'chrome/browser/content/browser/drama/app/index.html'

function usage(): never {
  console.log(`Usage: bun run scripts/verify-zen-native-port.ts [options]

Options:
  --zen-app PATH                 Zen Browser.app to inspect or launch.
  --runtime-url URL              Drama runtime base URL. Default: ${DEFAULT_RUNTIME_URL}
  --surface graph|plm|crew|memory|all
                                  Surface to verify. Repeatable. Default: all.
  --output PATH                  JSON output path.
  --screenshot-dir PATH          Directory for captured screenshots.
  --capture                      Open Zen and capture macOS screenshots.
  --capture-preflight            Capture a Finder/desktop control screenshot to detect macOS capture blocks.
  --wait-ms MS                   Wait after opening each surface before screenshot. Default: 2500.
  --screenshot surface=PATH      Reuse a screenshot for a surface.
  --text-snapshot surface=PATH   Analyze DOM/AX/text evidence for a surface.
  --strict                       Exit non-zero when detectors or readiness gates fail.
`)
  process.exit(0)
}

function timestampSlug(date = new Date()): string {
  return date.toISOString().replace(/[:.]/g, '-')
}

function expandHome(path: string): string {
  if (path === '~') return process.env.HOME ?? path
  if (path.startsWith('~/')) return join(process.env.HOME ?? '', path.slice(2))
  return path
}

function parseSurface(value: string): Surface {
  if (value === 'graph' || value === 'plm' || value === 'crew' || value === 'memory') return value
  throw new Error(`Invalid surface: ${value}`)
}

function parseSurfacePath(value: string): [Surface, string] {
  const separator = value.indexOf('=')
  if (separator <= 0) throw new Error(`Expected surface=PATH, got: ${value}`)
  return [parseSurface(value.slice(0, separator)), resolve(expandHome(value.slice(separator + 1)))]
}

function parseArgs(argv: string[]): Options {
  const timestamp = timestampSlug()
  const options: Options = {
    zenApp: process.env.ZEN_APP,
    runtimeUrl: process.env.DRAMA_RUNTIME_URL ?? DEFAULT_RUNTIME_URL,
    surfaces: [],
    output: `docs/verification/zen-native-port-baseline-${timestamp}.json`,
    screenshotDir: `docs/verification/zen-native-port-${timestamp}`,
    capture: false,
    capturePreflight: false,
    waitMs: Number(process.env.DRAMA_VERIFY_WAIT_MS ?? 2500),
    strict: false,
    screenshotPaths: new Map(),
    textSnapshotPaths: new Map(),
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--zen-app') {
      options.zenApp = argv[index + 1]
      index += 1
    } else if (arg === '--runtime-url') {
      options.runtimeUrl = argv[index + 1] ?? options.runtimeUrl
      index += 1
    } else if (arg === '--surface') {
      const value = argv[index + 1] ?? 'all'
      options.surfaces.push(...(value === 'all' ? SURFACES : [parseSurface(value)]))
      index += 1
    } else if (arg === '--output') {
      options.output = argv[index + 1] ?? options.output
      index += 1
    } else if (arg === '--screenshot-dir') {
      options.screenshotDir = argv[index + 1] ?? options.screenshotDir
      index += 1
    } else if (arg === '--capture') {
      options.capture = true
    } else if (arg === '--capture-preflight') {
      options.capturePreflight = true
    } else if (arg === '--wait-ms') {
      options.waitMs = Number(argv[index + 1] ?? options.waitMs)
      index += 1
    } else if (arg === '--screenshot') {
      const [surface, path] = parseSurfacePath(argv[index + 1] ?? '')
      options.screenshotPaths.set(surface, path)
      index += 1
    } else if (arg === '--text-snapshot' || arg === '--dom') {
      const [surface, path] = parseSurfacePath(argv[index + 1] ?? '')
      options.textSnapshotPaths.set(surface, path)
      index += 1
    } else if (arg === '--strict') {
      options.strict = true
    } else if (arg === '-h' || arg === '--help') {
      usage()
    } else {
      throw new Error(`Unknown option: ${arg}`)
    }
  }

  if (options.surfaces.length === 0) options.surfaces = [...SURFACES]
  options.surfaces = Array.from(new Set(options.surfaces))
  options.output = resolve(expandHome(options.output))
  options.screenshotDir = resolve(expandHome(options.screenshotDir))
  if (options.zenApp) options.zenApp = resolve(expandHome(options.zenApp))
  return options
}

async function execCapture(file: string, args: string[], timeoutMs = 5000): Promise<CommandResult> {
  try {
    const { stdout, stderr } = await execFileAsync(file, args, {
      timeout: timeoutMs,
      maxBuffer: 4 * 1024 * 1024,
    })
    return { ok: true, stdout: String(stdout), stderr: String(stderr), code: 0 }
  } catch (error) {
    const failed = error as {
      stdout?: string | Buffer
      stderr?: string | Buffer
      code?: number | string | null
      message?: string
    }
    return {
      ok: false,
      stdout: String(failed.stdout ?? ''),
      stderr: String(failed.stderr ?? ''),
      code: failed.code,
      message: failed.message,
    }
  }
}

function round(value: number): number {
  return Math.round(value * 10) / 10
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms))
}

function ensureParent(path: string): void {
  mkdirSync(dirname(path), { recursive: true })
}

function findZenApp(explicitPath?: string): string | null {
  const candidates = [
    explicitPath,
    process.env.ZEN_APP,
    DEFAULT_ZEN_APP,
    '/Applications/Zen Browser.app',
    `${process.env.HOME ?? ''}/Applications/Zen Browser.app`,
  ].filter((candidate): candidate is string => Boolean(candidate))

  return candidates.find((candidate) => existsSync(candidate)) ?? null
}

async function locateChromeResource(zenApp: string | null) {
  if (!zenApp) {
    return {
      ok: false,
      path: null,
      package: null,
      reason: 'Zen Browser.app was not found.',
    }
  }

  const loosePath = join(zenApp, 'Contents/Resources/browser/chrome/browser/content/browser/drama/app/index.html')
  const omniPath = join(zenApp, 'Contents/Resources/browser/omni.ja')
  if (existsSync(omniPath)) {
    const zip = await execCapture('zipinfo', ['-1', omniPath], 8000)
    if (zip.ok && zip.stdout.split(/\r?\n/).includes(OMNI_RESOURCE_PATH)) {
      return {
        ok: true,
        path: `${omniPath}!/${OMNI_RESOURCE_PATH}`,
        package: 'browser/omni.ja',
        reason: 'Drama chrome-resource index is installed in browser/omni.ja.',
      }
    }
  }

  if (existsSync(loosePath)) {
    return {
      ok: true,
      path: loosePath,
      package: 'loose-browser-resource',
      reason: 'Drama chrome-resource index is installed as a loose browser resource.',
    }
  }

  return {
    ok: false,
    path: null,
    package: null,
    reason: `Drama chrome-resource index was not found in ${omniPath} or ${loosePath}.`,
  }
}

function buildDocumentUri(runtimeUrl: string, surface: Surface): string {
  const encodedRuntime = encodeURIComponent(runtimeUrl)
  return `chrome://browser/content/drama/app/index.html?host=zen&runtime=${encodedRuntime}&surface=${surface}`
}

async function fetchJson(url: string, init: RequestInit = {}, timeoutMs = 2000): Promise<EndpointRead> {
  const started = performance.now()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        ...init.headers,
      },
    })
    const text = await response.text()
    let body: unknown = text
    try {
      body = text ? JSON.parse(text) : null
    } catch {
      body = text
    }
    return {
      ok: response.ok,
      url,
      status: response.status,
      durationMs: round(performance.now() - started),
      body,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    }
  } catch (error) {
    return {
      ok: false,
      url,
      durationMs: round(performance.now() - started),
      body: null,
      error: error instanceof Error ? error.message : String(error),
    }
  } finally {
    clearTimeout(timer)
  }
}

function runtimePath(runtimeUrl: string, path: string): string {
  return `${runtimeUrl.replace(/\/+$/, '')}${path}`
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function nestedRecord(value: unknown, key: string): Record<string, unknown> {
  return asRecord(asRecord(value)[key])
}

function readState(value: unknown): string {
  return typeof value === 'string' ? value : 'unknown'
}

function readBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function portFromRuntimeUrl(runtimeUrl: string): number {
  const parsed = new URL(runtimeUrl)
  if (parsed.port) return Number(parsed.port)
  return parsed.protocol === 'https:' ? 443 : 80
}

function portFromStatus(status: EndpointRead, fallback: number): number {
  const body = asRecord(status.body)
  return readNumber(body.port)
    ?? readNumber(nestedRecord(status.body, 'plmRuntime').port)
    ?? fallback
}

async function listListeners(port: number) {
  const result = await execCapture('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN'], 5000)
  const lines = result.stdout.split(/\r?\n/).filter(Boolean)
  const entries = lines[0]?.startsWith('COMMAND') ? lines.slice(1) : lines
  return {
    port,
    count: entries.length,
    entries,
    ok: result.ok || entries.length === 0,
    error: result.ok ? undefined : result.message,
  }
}

async function listProcesses(pattern: string) {
  const result = await execCapture('pgrep', ['-fl', pattern], 5000)
  const entries = result.stdout.split(/\r?\n/).filter(Boolean)
  return {
    pattern,
    count: entries.length,
    entries,
    ok: result.ok || entries.length === 0,
    error: result.ok ? undefined : result.message,
  }
}

async function captureMacScreenshot(zenApp: string, documentUri: string, screenshotPath: string, waitMs: number) {
  const started = performance.now()
  ensureParent(screenshotPath)
  const openResult = await execCapture('open', ['-a', zenApp, documentUri], 10000)
  await sleep(waitMs)
  const captureResult = await execCapture('screencapture', ['-x', screenshotPath], 15000)
  return {
    path: screenshotPath,
    durationMs: round(performance.now() - started),
    open: openResult,
    capture: captureResult,
    ok: openResult.ok && captureResult.ok && existsSync(screenshotPath),
  }
}

async function capturePreflightScreenshot(screenshotPath: string) {
  const started = performance.now()
  ensureParent(screenshotPath)
  const openResult = await execCapture('open', ['-a', 'Finder'], 5000)
  await sleep(1_000)
  const captureResult = await execCapture('screencapture', ['-x', screenshotPath], 15000)
  const screenshot = await analyzeScreenshot(screenshotPath)
  const blocked = screenshot?.exists === true
    && (screenshot.blackRatio ?? 0) > 0.98
    && (screenshot.meanLuma ?? 255) < 2
  return {
    path: screenshotPath,
    durationMs: round(performance.now() - started),
    open: openResult,
    capture: captureResult,
    screenshot,
    blocked,
    ok: openResult.ok && captureResult.ok && existsSync(screenshotPath) && !blocked,
  }
}

async function analyzeScreenshot(path: string | null): Promise<ScreenshotAnalysis | null> {
  if (!path) return null
  if (!existsSync(path)) {
    return { path, exists: false, error: 'Screenshot file does not exist.' }
  }

  try {
    const sharpModule = await import('sharp') as { default: (input: string) => any }
    const image = sharpModule.default(path).ensureAlpha()
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true })
    const pixelCount = info.width * info.height
    const step = Math.max(1, Math.floor(pixelCount / 60000))
    let sampled = 0
    let black = 0
    let white = 0
    let sum = 0
    let sumSq = 0

    for (let pixel = 0; pixel < pixelCount; pixel += step) {
      const offset = pixel * 4
      const alpha = data[offset + 3] ?? 255
      if (alpha < 8) continue
      const red = data[offset] ?? 0
      const green = data[offset + 1] ?? 0
      const blue = data[offset + 2] ?? 0
      const luma = (0.2126 * red) + (0.7152 * green) + (0.0722 * blue)
      sampled += 1
      sum += luma
      sumSq += luma * luma
      if (luma < 18) black += 1
      if (luma > 246) white += 1
    }

    const mean = sampled > 0 ? sum / sampled : 0
    const variance = sampled > 0 ? Math.max(0, (sumSq / sampled) - (mean * mean)) : 0
    return {
      path,
      exists: true,
      width: info.width,
      height: info.height,
      fileSize: statSync(path).size,
      meanLuma: round(mean),
      lumaStdDev: round(Math.sqrt(variance)),
      blackRatio: sampled > 0 ? round(black / sampled) : 0,
      whiteRatio: sampled > 0 ? round(white / sampled) : 0,
    }
  } catch (error) {
    return {
      path,
      exists: true,
      fileSize: statSync(path).size,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

function readTextSnapshot(path: string | null): string | null {
  if (!path || !existsSync(path)) return null
  return readFileSync(path, 'utf8')
}

function detector(
  name: string,
  state: DetectorState,
  reason: string,
  metrics?: Record<string, number | string | boolean | null>,
): DetectorResult {
  return { name, state, reason, metrics }
}

function runDetectors(analysis: ScreenshotAnalysis | null, text: string | null): DetectorResult[] {
  const results: DetectorResult[] = []
  if (!analysis) {
    results.push(detector('black-screen', 'not-run', 'No screenshot was provided.'))
    results.push(detector('blank-viewport', 'not-run', 'No screenshot was provided.'))
  } else if (!analysis.exists || analysis.error) {
    results.push(detector('black-screen', 'fail', analysis.error ?? 'Screenshot file is missing.'))
    results.push(detector('blank-viewport', 'fail', analysis.error ?? 'Screenshot file is missing.'))
  } else {
    const metrics = {
      width: analysis.width ?? null,
      height: analysis.height ?? null,
      fileSize: analysis.fileSize ?? null,
      meanLuma: analysis.meanLuma ?? null,
      lumaStdDev: analysis.lumaStdDev ?? null,
      blackRatio: analysis.blackRatio ?? null,
      whiteRatio: analysis.whiteRatio ?? null,
    }
    const blackScreen = (analysis.blackRatio ?? 0) > 0.72 && (analysis.meanLuma ?? 255) < 45
    const blankViewport = ((analysis.whiteRatio ?? 0) > 0.86)
      || ((analysis.lumaStdDev ?? 999) < 3.5 && (analysis.fileSize ?? 0) < 45000)
    results.push(detector(
      'black-screen',
      blackScreen ? 'fail' : 'pass',
      blackScreen ? 'Screenshot is mostly black.' : 'Screenshot is not mostly black.',
      metrics,
    ))
    results.push(detector(
      'blank-viewport',
      blankViewport ? 'fail' : 'pass',
      blankViewport ? 'Screenshot is mostly blank or too visually uniform.' : 'Screenshot is not mostly blank.',
      metrics,
    ))
  }

  if (!text) {
    results.push(detector('browser-default-error', 'not-run', 'No DOM or text snapshot was provided.'))
    results.push(detector('raw-json', 'not-run', 'No DOM or text snapshot was provided.'))
    results.push(detector('raw-stack-trace', 'not-run', 'No DOM or text snapshot was provided.'))
    results.push(detector('first-run-prompt', 'not-run', 'No DOM or text snapshot was provided.'))
    return results
  }

  const normalized = text.replace(/\s+/g, ' ').trim()
  const startsLikeJson = /^[\[{]/.test(normalized)
    || /<pre[^>]*>\s*[\[{]/i.test(text)
    || /<body[^>]*>\s*[\[{]/i.test(text)
  const stackTrace = /Unhandled Runtime Error|ReferenceError|SyntaxError|TypeError:|Stack trace|\bat\s+\S+\s+\([^)]*:\d+:\d+\)/i.test(text)
  const browserDefault = /about:neterror|Problem loading page|Server Not Found|Hmm\. We.re having trouble|This site can.t be reached|404 Not Found|Index of \/|File not found/i.test(text)
  const firstRunPrompt = /default browser|set as default|make .* default|welcome to zen|import bookmarks|get started|first run|默认浏览器|设为默认|欢迎使用/i.test(text)

  results.push(detector(
    'browser-default-error',
    browserDefault ? 'fail' : 'pass',
    browserDefault ? 'Text snapshot contains browser-default error UI.' : 'Text snapshot does not contain browser-default error UI.',
  ))
  results.push(detector(
    'raw-json',
    startsLikeJson ? 'fail' : 'pass',
    startsLikeJson ? 'Text snapshot looks like raw JSON.' : 'Text snapshot does not look like raw JSON.',
  ))
  results.push(detector(
    'raw-stack-trace',
    stackTrace ? 'fail' : 'pass',
    stackTrace ? 'Text snapshot contains a raw stack trace.' : 'Text snapshot does not contain a raw stack trace.',
  ))
  results.push(detector(
    'first-run-prompt',
    firstRunPrompt ? 'fail' : 'pass',
    firstRunPrompt ? 'Text snapshot contains a first-run or default-browser prompt.' : 'Text snapshot does not contain a first-run or default-browser prompt.',
  ))
  return results
}

function readinessTier(tier: string, state: ReadinessState, message: string) {
  return { tier, state, message }
}

function buildReadiness(resourceOk: boolean, runtimeStatus: EndpointRead, sidecarStatus: EndpointRead, detectors: DetectorResult[]) {
  const runtimeBody = asRecord(runtimeStatus.body)
  const sidecarBody = asRecord(sidecarStatus.body)
  const runtimeState = readState(runtimeBody.state)
  const sidecarState = readState(sidecarBody.state)
  const sidecarHealthy = readBoolean(sidecarBody.healthy)
  const visualFailed = detectors.some((item) => item.state === 'fail')
  const visualNotRun = detectors.some((item) => item.state === 'not-run')

  return [
    readinessTier(
      'shell-ready',
      resourceOk ? 'ready' : 'blocked',
      resourceOk ? 'Drama chrome-resource index is installed.' : 'Drama chrome-resource index is missing.',
    ),
    readinessTier(
      'first-viewport',
      visualFailed ? 'blocked' : visualNotRun ? 'pending' : 'ready',
      visualFailed
        ? 'First viewport failed visual detectors.'
        : visualNotRun
          ? 'First viewport visual evidence is incomplete.'
          : 'First viewport passed visual detectors.',
    ),
    readinessTier(
      'runtime-ready',
      runtimeState === 'ready' ? 'ready' : runtimeState === 'starting' ? 'pending' : 'blocked',
      runtimeStatus.ok ? `Drama runtime is ${runtimeState}.` : runtimeStatus.error ?? 'Drama runtime status request failed.',
    ),
    readinessTier(
      'plm-sidecar-ready',
      sidecarHealthy === true ? 'ready' : sidecarState === 'starting' ? 'pending' : 'blocked',
      sidecarStatus.ok
        ? sidecarHealthy === true
          ? 'PlotPilot sidecar is healthy.'
          : `PlotPilot sidecar is ${sidecarState}.`
        : sidecarStatus.error ?? 'PlotPilot sidecar status request failed.',
    ),
  ]
}

async function verifySurface(options: Options, zenApp: string | null, resource: Awaited<ReturnType<typeof locateChromeResource>>, surface: Surface, runtimeStatus: EndpointRead, sidecarStatus: EndpointRead) {
  const documentUri = buildDocumentUri(options.runtimeUrl, surface)
  const screenshotPath = options.screenshotPaths.get(surface)
    ?? (options.capture ? join(options.screenshotDir, `zen-native-${surface}.png`) : null)
  const textPath = options.textSnapshotPaths.get(surface) ?? null
  const capture = options.capture && zenApp && screenshotPath
    ? await captureMacScreenshot(zenApp, documentUri, screenshotPath, options.waitMs)
    : null
  const screenshot = await analyzeScreenshot(screenshotPath)
  const textSnapshot = readTextSnapshot(textPath)
  const detectors = runDetectors(screenshot, textSnapshot)
  const failureReasons = detectors
    .filter((item) => item.state === 'fail')
    .map((item) => `${item.name}: ${item.reason}`)
  const classification = classifyDramaPlmSurface({
    url: documentUri,
    hostKind: 'gecko',
    expectedSurface: surface,
  })
  const readiness = buildReadiness(resource.ok, runtimeStatus, sidecarStatus, detectors)

  return {
    surface,
    requestedUri: documentUri,
    activeUri: documentUri,
    surfaceClassification: classification,
    resourcePath: resource.path,
    screenshotPath,
    textSnapshotPath: textPath,
    screenshot,
    detectors,
    failureReasons,
    readiness,
    timings: {
      screenshotCaptureMs: capture?.durationMs ?? null,
      runtimeStatusMs: runtimeStatus.durationMs,
      sidecarStatusMs: sidecarStatus.durationMs,
    },
    capture,
    ok: resource.ok && failureReasons.length === 0 && readiness.every((item) => item.state === 'ready' || item.tier === 'plm-sidecar-ready'),
  }
}

async function main() {
  const startedAt = new Date()
  const options = parseArgs(process.argv.slice(2))
  const zenApp = findZenApp(options.zenApp)
  const resource = await locateChromeResource(zenApp)
  const runtimeStatus = await fetchJson(runtimePath(options.runtimeUrl, '/runtime/status'), {}, 2000)
  const sidecarStatus = await fetchJson(runtimePath(options.runtimeUrl, '/plm/runtime/status?checkHealth=true'), {}, 5000)
  const runtimePort = portFromRuntimeUrl(options.runtimeUrl)
  const sidecarPort = portFromStatus(sidecarStatus, 8005)
  const [runtimeListeners, sidecarListeners, zenProcesses, runtimeProcesses, sidecarProcesses] = await Promise.all([
    listListeners(runtimePort),
    listListeners(sidecarPort),
    listProcesses('Zen Browser'),
    listProcesses('runtime-entry-3198|drama-runtime|apps/drama-runtime'),
    listProcesses('plotpilot|PlotPilot'),
  ])

  mkdirSync(options.screenshotDir, { recursive: true })
  const capturePreflight = options.capture && options.capturePreflight
    ? await capturePreflightScreenshot(join(options.screenshotDir, 'screen-capture-preflight.png'))
    : null
  const surfaces = []
  for (const surface of options.surfaces) {
    surfaces.push(await verifySurface(options, zenApp, resource, surface, runtimeStatus, sidecarStatus))
  }

  const endedAt = new Date()
  const failedSurfaces = surfaces.filter((surface) => !surface.ok)
  const output = {
    ok: resource.ok && failedSurfaces.length === 0,
    schema: 'zen-native-port-verification.v1',
    generatedAt: endedAt.toISOString(),
    startedAt: startedAt.toISOString(),
    durationMs: endedAt.getTime() - startedAt.getTime(),
    strict: options.strict,
    zenApp,
    runtimeUrl: options.runtimeUrl,
    chromeResource: resource,
    runtimeStatus,
    sidecarStatus,
    counts: {
      listeners: {
        runtime: runtimeListeners,
        sidecar: sidecarListeners,
      },
      processes: {
        zen: zenProcesses,
        runtime: runtimeProcesses,
        sidecar: sidecarProcesses,
      },
    },
    capturePreflight,
    surfaces,
    failureReasons: surfaces.flatMap((surface) => (
      surface.failureReasons.map((reason) => `${surface.surface}: ${reason}`)
    )).concat(capturePreflight?.blocked ? ['capture-preflight: macOS screencapture returned an all-black control screenshot.'] : []),
  }

  ensureParent(options.output)
  writeFileSync(options.output, `${JSON.stringify(output, null, 2)}\n`)
  console.log(JSON.stringify(output, null, 2))

  if (options.strict && !output.ok) process.exit(1)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error))
  process.exit(1)
})
