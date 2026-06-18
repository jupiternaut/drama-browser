#!/usr/bin/env bun
import {
  classifyDramaPlmSurface,
  type DramaHostKind,
  type DramaPlmReadinessStatus,
} from '../packages/drama-host/src/index.ts'

interface Options {
  url: string
  hostKind: DramaHostKind | string
  runtimeUrl: string
  expectProduct: boolean
  requireRuntime: boolean
  checkPlm: boolean
  requirePlm: boolean
  simulations: Set<FailureSimulation>
  assumeRuntimeReady: boolean
  workspaceState: 'unchecked' | 'present' | 'missing'
  workspacePaths: string[]
  claimTier: ReadinessTier | null
  expectedTiers: Array<{ tier: ReadinessTier; state: ReadinessState }>
}

type ReadinessTier = DramaPlmReadinessStatus['tier']
type ReadinessState = DramaPlmReadinessStatus['state']
type FailureSimulation =
  | 'runtime-unavailable'
  | 'sidecar-unavailable'
  | 'codex-unavailable'
  | 'codex-unauthenticated'
  | 'workspace-missing'
  | 'css-token-failure'

const READINESS_ORDER: ReadinessTier[] = [
  'shell-ready',
  'runtime-ready',
  'plm-sidecar-ready',
  'ai-ready',
  'workflow-preview-ready',
  'plotpilot-parity-ready',
]

const FAILURE_SIMULATIONS: ReadonlySet<string> = new Set([
  'runtime-unavailable',
  'sidecar-unavailable',
  'codex-unavailable',
  'codex-unauthenticated',
  'workspace-missing',
  'css-token-failure',
])

function parseArgs(argv: string[]): Options {
  const options: Options = {
    url: process.env.DRAMA_VERIFY_URL
      ?? 'http://127.0.0.1:3198/app/plm?host=zen&runtime=http%3A%2F%2F127.0.0.1%3A3198',
    hostKind: process.env.DRAMA_VERIFY_HOST_KIND ?? 'browser',
    runtimeUrl: process.env.DRAMA_RUNTIME_URL ?? 'http://127.0.0.1:3198',
    expectProduct: false,
    requireRuntime: false,
    checkPlm: false,
    requirePlm: false,
    simulations: new Set(),
    assumeRuntimeReady: false,
    workspaceState: 'unchecked',
    workspacePaths: [],
    claimTier: null,
    expectedTiers: [],
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--url') {
      options.url = argv[index + 1] ?? options.url
      index += 1
    } else if (arg === '--host-kind') {
      options.hostKind = argv[index + 1] ?? options.hostKind
      index += 1
    } else if (arg === '--runtime-url') {
      options.runtimeUrl = argv[index + 1] ?? options.runtimeUrl
      index += 1
    } else if (arg === '--expect-product') {
      options.expectProduct = true
    } else if (arg === '--require-runtime') {
      options.requireRuntime = true
    } else if (arg === '--check-plm') {
      options.checkPlm = true
    } else if (arg === '--require-plm') {
      options.checkPlm = true
      options.requirePlm = true
    } else if (arg === '--simulate') {
      const values = (argv[index + 1] ?? '').split(',').map((value) => value.trim()).filter(Boolean)
      for (const value of values) {
        if (!FAILURE_SIMULATIONS.has(value)) throw new Error(`Unknown failure simulation: ${value}`)
        options.simulations.add(value as FailureSimulation)
      }
      index += 1
    } else if (arg === '--assume-runtime-ready') {
      options.assumeRuntimeReady = true
    } else if (arg === '--workspace-present') {
      options.workspaceState = 'present'
    } else if (arg === '--workspace-missing') {
      options.workspaceState = 'missing'
    } else if (arg === '--workspace-path') {
      options.workspacePaths.push(argv[index + 1] ?? '')
      index += 1
    } else if (arg === '--claim-tier') {
      options.claimTier = parseReadinessTier(argv[index + 1] ?? '')
      index += 1
    } else if (arg === '--expect-tier') {
      const [tier, state] = (argv[index + 1] ?? '').split('=')
      options.expectedTiers.push({
        tier: parseReadinessTier(tier ?? ''),
        state: parseReadinessState(state ?? ''),
      })
      index += 1
    } else if (arg === '-h' || arg === '--help') {
      console.log('Usage: bun run scripts/verify-zen-plm-contract.ts [--url URL] [--host-kind browser|gecko|electron] [--runtime-url URL] [--expect-product] [--require-runtime] [--check-plm] [--require-plm] [--simulate runtime-unavailable|sidecar-unavailable|codex-unavailable|codex-unauthenticated|workspace-missing|css-token-failure] [--assume-runtime-ready] [--workspace-present|--workspace-missing] [--workspace-path PATH] [--claim-tier TIER] [--expect-tier TIER=STATE]')
      process.exit(0)
    } else {
      throw new Error(`Unknown option: ${arg}`)
    }
  }

  return options
}

function parseReadinessTier(value: string): ReadinessTier {
  if ((READINESS_ORDER as string[]).includes(value)) return value as ReadinessTier
  throw new Error(`Invalid readiness tier: ${value}`)
}

function parseReadinessState(value: string): ReadinessState {
  if (value === 'ready' || value === 'pending' || value === 'blocked') return value
  throw new Error(`Invalid readiness state: ${value}`)
}

async function readRuntimeStatus(runtimeUrl: string): Promise<Record<string, unknown> | null> {
  try {
    const response = await fetch(`${runtimeUrl.replace(/\/+$/, '')}/runtime/status`)
    if (!response.ok) {
      return {
        state: 'error',
        message: `Runtime status returned HTTP ${response.status}.`,
      }
    }
    return await response.json() as Record<string, unknown>
  } catch (error) {
    return {
      state: 'offline',
      message: error instanceof Error ? error.message : String(error),
    }
  }
}

async function runtimeRpc<T>(runtimeUrl: string, channel: string, payload?: unknown): Promise<T | Record<string, unknown>> {
  try {
    const response = await fetch(`${runtimeUrl.replace(/\/+$/, '')}/runtime/rpc`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ channel, payload }),
    })
    const body = await response.json() as { ok?: boolean; data?: T; error?: { message?: string } }
    if (!response.ok || !body.ok) {
      return {
        error: body.error?.message ?? `Runtime RPC ${channel} returned HTTP ${response.status}.`,
      }
    }
    return body.data as T
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

function runtimeTier(runtimeStatus: Record<string, unknown> | null): DramaPlmReadinessStatus {
  const state = runtimeStatus?.state
  return {
    tier: 'runtime-ready',
    state: state === 'ready' ? 'ready' : state === 'starting' ? 'pending' : 'blocked',
    message: typeof runtimeStatus?.message === 'string'
      ? runtimeStatus.message
      : `Drama runtime is ${String(state ?? 'unknown')}.`,
  }
}

function plmSidecarTier(status: Record<string, unknown> | null): DramaPlmReadinessStatus {
  return {
    tier: 'plm-sidecar-ready',
    state: status?.healthy === true ? 'ready' : status?.state === 'starting' ? 'pending' : 'blocked',
    message: status?.healthy === true
      ? 'PlotPilot-compatible sidecar is healthy through the Drama runtime.'
      : typeof status?.error === 'string'
        ? status.error
        : `PlotPilot-compatible sidecar is ${String(status?.state ?? 'unknown')}.`,
  }
}

function aiTier(status: Record<string, unknown> | null): DramaPlmReadinessStatus {
  return {
    tier: 'ai-ready',
    state: status?.available === true && status?.authenticated === true ? 'ready' : status ? 'blocked' : 'pending',
    message: status?.available === true && status?.authenticated === true
      ? 'Codex-backed AI is available and authenticated.'
      : typeof status?.error === 'string'
        ? status.error
        : 'Codex-backed AI is unavailable or unauthenticated.',
  }
}

function workflowTier(runtimeReady: boolean, options: Options): DramaPlmReadinessStatus {
  if (options.workspaceState === 'present') {
    return {
      tier: 'workflow-preview-ready',
      state: runtimeReady ? 'ready' : 'pending',
      message: runtimeReady
        ? 'Script Studio has an active project workspace.'
        : 'Waiting for runtime before workspace can be verified.',
    }
  }

  if (options.workspaceState === 'missing') {
    return {
      tier: 'workflow-preview-ready',
      state: runtimeReady ? 'blocked' : 'pending',
      message: runtimeReady
        ? 'Workspace/project is missing; project-dependent PLM surfaces remain blocked.'
        : 'Waiting for runtime before workspace-missing state can be verified.',
    }
  }

  return {
    tier: 'workflow-preview-ready',
    state: 'pending',
    message: 'Workspace state was not checked by this contract run.',
  }
}

function simulateRuntime(status: Record<string, unknown> | null, options: Options): Record<string, unknown> | null {
  if (options.simulations.has('runtime-unavailable')) {
    return {
      state: 'offline',
      message: 'Simulated Drama runtime unavailable state.',
    }
  }
  if (options.assumeRuntimeReady) {
    return {
      ...status,
      state: 'ready',
      message: 'Assumed Drama runtime ready for isolated contract verification.',
    }
  }
  return status
}

function simulateSidecar(status: Record<string, unknown> | null, options: Options): Record<string, unknown> | null {
  if (!options.simulations.has('sidecar-unavailable')) return status
  return {
    state: 'stopped',
    healthy: false,
    error: 'Simulated PlotPilot sidecar unavailable state.',
  }
}

function simulateCodex(status: Record<string, unknown> | null, options: Options): Record<string, unknown> | null {
  if (options.simulations.has('codex-unavailable')) {
    return {
      available: false,
      authenticated: false,
      error: 'Simulated Codex unavailable state.',
    }
  }
  if (options.simulations.has('codex-unauthenticated')) {
    return {
      available: true,
      authenticated: false,
      requiresOpenAiAuth: true,
      error: 'Simulated Codex unauthenticated state.',
    }
  }
  return status
}

function highestReadyTier(readiness: DramaPlmReadinessStatus[]): ReadinessTier | null {
  let highest: ReadinessTier | null = null
  for (const tier of READINESS_ORDER) {
    const row = readiness.find((item) => item.tier === tier)
    if (row?.state !== 'ready') break
    highest = tier
  }
  return highest
}

function tierRank(tier: ReadinessTier | null): number {
  if (!tier) return -1
  return READINESS_ORDER.indexOf(tier)
}

function expectedTierResults(readiness: DramaPlmReadinessStatus[], options: Options) {
  return options.expectedTiers.map((expected) => {
    const actual = readiness.find((item) => item.tier === expected.tier)
    return {
      ...expected,
      actualState: actual?.state ?? null,
      ok: actual?.state === expected.state,
    }
  })
}

const options = parseArgs(process.argv.slice(2))
if (options.simulations.has('sidecar-unavailable') || options.simulations.has('codex-unavailable') || options.simulations.has('codex-unauthenticated')) {
  options.checkPlm = true
}
if (options.simulations.has('workspace-missing')) {
  options.workspaceState = 'missing'
}
const surface = classifyDramaPlmSurface({
  url: options.url,
  hostKind: options.hostKind,
  userAgent: process.env.DRAMA_VERIFY_USER_AGENT,
  expectedSurface: 'plm',
})
const runtimeStatus = simulateRuntime(await readRuntimeStatus(options.runtimeUrl), options)
const plmRuntimeStatus = options.checkPlm
  ? await runtimeRpc<Record<string, unknown>>(options.runtimeUrl, 'plotpilot:runtime:status', { checkHealth: true })
  : null
const codexStatus = options.checkPlm
  ? await runtimeRpc<Record<string, unknown>>(options.runtimeUrl, 'plotpilot:codex:status')
  : null
const simulatedPlmRuntimeStatus = simulateSidecar(plmRuntimeStatus, options)
const simulatedCodexStatus = simulateCodex(codexStatus, options)
const runtimeReadyTier = runtimeTier(runtimeStatus)
const runtimeReady = runtimeReadyTier.state === 'ready'
const readiness: DramaPlmReadinessStatus[] = [
  {
    tier: 'shell-ready',
    state: surface.productPath ? 'ready' : 'blocked',
    message: surface.reason,
  },
  runtimeReadyTier,
  ...(options.checkPlm ? [
    plmSidecarTier(simulatedPlmRuntimeStatus),
    aiTier(simulatedCodexStatus),
  ] : []),
  workflowTier(runtimeReady, options),
  {
    tier: 'plotpilot-parity-ready',
    state: 'blocked',
    message: 'Blocked until PlotPilot-native prompt registry writes and post-chapter memory sync visualization are complete.',
  },
]
const plmReady = readiness.find((item) => item.tier === 'plm-sidecar-ready')?.state === 'ready'
const aiReady = readiness.find((item) => item.tier === 'ai-ready')?.state === 'ready'
const expectedResults = expectedTierResults(readiness, options)
const expectedOk = expectedResults.every((result) => result.ok)
const verifiedTier = highestReadyTier(readiness)
const releaseGate = options.claimTier ? {
  claimTier: options.claimTier,
  highestVerifiedTier: verifiedTier,
  ok: tierRank(options.claimTier) <= tierRank(verifiedTier),
} : null
const ok = (!options.expectProduct || surface.productPath)
  && (!options.requireRuntime || runtimeReady)
  && (!options.requirePlm || (plmReady && aiReady))
  && expectedOk
  && (releaseGate?.ok ?? true)

console.log(JSON.stringify({
  ok,
  expectedProduct: options.expectProduct,
  requireRuntime: options.requireRuntime,
  checkPlm: options.checkPlm,
  requirePlm: options.requirePlm,
  simulations: Array.from(options.simulations),
  assumeRuntimeReady: options.assumeRuntimeReady,
  surface,
  runtimeStatus,
  plmRuntimeStatus: simulatedPlmRuntimeStatus,
  codexStatus: simulatedCodexStatus,
  workspace: {
    state: options.workspaceState,
    pathHints: options.workspacePaths,
  },
  readiness,
  expectedTierResults: expectedResults,
  releaseGate,
  styleFailure: options.simulations.has('css-token-failure')
    ? {
      layer: 'css-token-bridge',
      state: 'blocked',
      message: 'Simulated CSS/token bridge failure. Visual verification must show styled fallback instead of raw or browser-default UI.',
    }
    : null,
}, null, 2))

if (!ok) process.exit(options.expectProduct && !surface.productPath ? 2 : 1)
