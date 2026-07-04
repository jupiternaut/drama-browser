export type DramaProductPathMarkName =
  | 'shell-document-load'
  | 'first-styled-viewport'
  | 'route-ready'
  | 'runtime-ready'
  | 'sidecar-ready'

export interface DramaProductPathMark {
  name: DramaProductPathMarkName
  markedAt: number
  url: string
  surface?: string
  state?: string
  detail?: Record<string, unknown>
}

export interface DramaStartupResponsiveness {
  startedAt: number
  endedAt: number | null
  status: 'monitoring' | 'complete'
  durationMs: number
  intervalMs: number
  thresholdMs: number
  samples: number
  supportedLongTasks: boolean
  maxLongTaskDurationMs: number
  maxEventLoopDelayMs: number
  p95EventLoopDelayMs: number
  maxStartupBlockingMs: number
  expectedSamples: number
  sampleCoverageRatio: number
  timerThrottled: boolean
}

interface DramaProductPathWindow {
  __DRAMA_PRODUCT_PATH_MARKS__?: Partial<Record<DramaProductPathMarkName, DramaProductPathMark>>
  __DRAMA_PRODUCT_PATH_EVENTS__?: DramaProductPathMark[]
  __DRAMA_PRODUCT_PATH_RESPONSIVENESS__?: DramaStartupResponsiveness
}

function getPerformanceNow(): number {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now()
}

function getDramaPerformanceState(): {
  __DRAMA_PRODUCT_PATH_MARKS__: Partial<Record<DramaProductPathMarkName, DramaProductPathMark>>
  __DRAMA_PRODUCT_PATH_EVENTS__: DramaProductPathMark[]
} {
  const target = globalThis as typeof globalThis & DramaProductPathWindow
  target.__DRAMA_PRODUCT_PATH_MARKS__ ??= {}
  target.__DRAMA_PRODUCT_PATH_EVENTS__ ??= []
  return {
    __DRAMA_PRODUCT_PATH_MARKS__: target.__DRAMA_PRODUCT_PATH_MARKS__,
    __DRAMA_PRODUCT_PATH_EVENTS__: target.__DRAMA_PRODUCT_PATH_EVENTS__,
  }
}

export function markProductPath(
  name: DramaProductPathMarkName,
  payload: Omit<DramaProductPathMark, 'name' | 'markedAt' | 'url'> & { url?: string } = {},
  options: { once?: boolean } = {},
): DramaProductPathMark {
  const once = options.once ?? name !== 'route-ready'
  const state = getDramaPerformanceState()
  const existing = state.__DRAMA_PRODUCT_PATH_MARKS__[name]
  if (once && existing) return existing

  const mark: DramaProductPathMark = {
    name,
    markedAt: getPerformanceNow(),
    url: payload.url ?? globalThis.location?.href ?? '',
    surface: payload.surface,
    state: payload.state,
    detail: payload.detail,
  }
  state.__DRAMA_PRODUCT_PATH_MARKS__[name] = mark
  state.__DRAMA_PRODUCT_PATH_EVENTS__.push(mark)

  try {
    performance.mark(`drama:${name}`, { detail: mark })
  } catch {
    try {
      performance.mark(`drama:${name}`)
    } catch {
      // Older embedded browser contexts may not expose Performance.mark.
    }
  }

  return mark
}

export function setDramaReadySignal(name: string, value: string): void {
  const documentElement = globalThis.document?.documentElement
  if (!documentElement) return
  documentElement.dataset[name] = value
}

function updateStartupBlocking(state: DramaStartupResponsiveness): void {
  const eventLoopBudgetSignal = state.supportedLongTasks || state.timerThrottled
    ? 0
    : state.p95EventLoopDelayMs
  state.maxStartupBlockingMs = Math.max(state.maxLongTaskDurationMs, eventLoopBudgetSignal)
  setDramaReadySignal('dramaStartupMaxTaskMs', String(Math.round(state.maxStartupBlockingMs)))
}

export function startDramaStartupResponsivenessMonitor({
  durationMs = 5_000,
  intervalMs = 50,
  thresholdMs = 100,
}: {
  durationMs?: number
  intervalMs?: number
  thresholdMs?: number
} = {}): DramaStartupResponsiveness {
  const target = globalThis as typeof globalThis & DramaProductPathWindow
  if (target.__DRAMA_PRODUCT_PATH_RESPONSIVENESS__?.status === 'monitoring') {
    return target.__DRAMA_PRODUCT_PATH_RESPONSIVENESS__
  }

  const state: DramaStartupResponsiveness = {
    startedAt: getPerformanceNow(),
    endedAt: null,
    status: 'monitoring',
    durationMs,
    intervalMs,
    thresholdMs,
    samples: 0,
    supportedLongTasks: false,
    maxLongTaskDurationMs: 0,
    maxEventLoopDelayMs: 0,
    p95EventLoopDelayMs: 0,
    maxStartupBlockingMs: 0,
    expectedSamples: 0,
    sampleCoverageRatio: 1,
    timerThrottled: false,
  }
  target.__DRAMA_PRODUCT_PATH_RESPONSIVENESS__ = state
  const eventLoopDelaySamples: number[] = []

  let observer: PerformanceObserver | undefined
  try {
    const supportedEntryTypes = PerformanceObserver.supportedEntryTypes ?? []
    if (supportedEntryTypes.includes('longtask')) {
      state.supportedLongTasks = true
      observer = new PerformanceObserver((entries) => {
        for (const entry of entries.getEntries()) {
          state.maxLongTaskDurationMs = Math.max(state.maxLongTaskDurationMs, entry.duration)
        }
        updateStartupBlocking(state)
      })
      observer.observe({ type: 'longtask', buffered: true })
    }
  } catch {
    state.supportedLongTasks = false
  }

  let expectedAt = getPerformanceNow() + intervalMs
  const tick = () => {
    const now = getPerformanceNow()
    const elapsed = now - state.startedAt
    const delay = Math.max(0, now - expectedAt)
    state.samples += 1
    state.expectedSamples = Math.max(1, Math.floor(elapsed / intervalMs))
    state.sampleCoverageRatio = state.samples / state.expectedSamples
    state.timerThrottled = !state.supportedLongTasks
      && elapsed >= Math.min(1_000, durationMs)
      && state.sampleCoverageRatio < 0.25
    eventLoopDelaySamples.push(delay)
    const sortedDelays = [...eventLoopDelaySamples].sort((left, right) => left - right)
    const p95Index = Math.max(0, Math.ceil(sortedDelays.length * 0.95) - 1)
    state.p95EventLoopDelayMs = sortedDelays[p95Index] ?? 0
    state.maxEventLoopDelayMs = Math.max(state.maxEventLoopDelayMs, delay)
    updateStartupBlocking(state)

    if (elapsed >= durationMs) {
      state.status = 'complete'
      state.endedAt = now
      observer?.disconnect()
      return
    }

    expectedAt = now + intervalMs
    globalThis.setTimeout(tick, intervalMs)
  }

  globalThis.setTimeout(tick, intervalMs)
  return state
}
