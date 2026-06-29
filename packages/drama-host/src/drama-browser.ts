import {
  type CreateBrowserHostApiOptions,
  type DramaHostApi,
  type DramaHostCapabilities,
  type DramaHostOpenResult,
} from './index.ts'
import { createDramaRuntimeClient, type DramaRuntimeClientOptions } from './runtime-client.ts'
import { createGeckoHostApi, type GeckoDramaHostApi } from './gecko.ts'

export interface DramaBrowserChromeApi {
  openUrl?(url: string): Promise<DramaHostOpenResult> | DramaHostOpenResult
  openInternalRoute?(route: string, params?: Record<string, string>): Promise<DramaHostOpenResult> | DramaHostOpenResult
  newTab?(url?: string): Promise<DramaHostOpenResult> | DramaHostOpenResult
  newWindow?(url?: string): Promise<DramaHostOpenResult> | DramaHostOpenResult
  getDiagnostics?(): Promise<unknown> | unknown
}

export interface CreateDramaBrowserHostApiOptions extends CreateBrowserHostApiOptions {
  runtimeBaseUrl: string
  fetcher?: DramaRuntimeClientOptions['fetcher']
  timeoutMs?: number
  chrome?: DramaBrowserChromeApi
}

const dramaBrowserCapabilities: DramaHostCapabilities = {
  'shell.openUrl': true,
  'navigation.openUrl': true,
  'navigation.openInternalRoute': true,
  'navigation.newTab': true,
  'navigation.newWindow': true,
  'navigation.diagnostics': true,
  'rpc.request': true,
  'runtime.status': true,
  'runtime.capabilities': true,
  'runtime.request': true,
  'sessions.command': true,
  'sessions.cancel': true,
  'plm.sidecar.status': true,
  'plm.sidecar.start': true,
  'plm.sidecar.stop': true,
  'plm.sidecar.logs': true,
  'graph.load': true,
  'graph.history': true,
  'graph.persist': true,
  'graph.backup': true,
  'skillCrew.refresh': true,
  'skillCrew.import': true,
  'skillCrew.run': true,
  'skillCrew.feedback': true,
  'basicMemory.read': true,
  'basicMemory.search': true,
  'basicMemory.write': true,
  'settings.read': true,
  'settings.write': true,
  'diagnostics.snapshot': true,
  'diagnostics.process': true,
}

function ok(): DramaHostOpenResult {
  return { ok: true }
}

function unavailable(feature: string): DramaHostOpenResult {
  return { ok: false, error: `${feature} is not available in this Drama Browser host.` }
}

export interface DramaBrowserHostApi extends GeckoDramaHostApi {
  runtime: GeckoDramaHostApi['runtime'] & NonNullable<DramaHostApi['runtime']>
  navigation: NonNullable<DramaHostApi['navigation']>
  sessions: NonNullable<DramaHostApi['sessions']>
  plm: NonNullable<DramaHostApi['plm']>
  graph: NonNullable<DramaHostApi['graph']>
  skillCrew: NonNullable<DramaHostApi['skillCrew']>
  basicMemory: NonNullable<DramaHostApi['basicMemory']>
  settings: NonNullable<DramaHostApi['settings']>
  diagnostics: NonNullable<DramaHostApi['diagnostics']>
}

export function createDramaBrowserHostApi(options: CreateDramaBrowserHostApiOptions): DramaBrowserHostApi {
  const runtime = createDramaRuntimeClient({
    baseUrl: options.runtimeBaseUrl,
    fetcher: options.fetcher,
    timeoutMs: options.timeoutMs,
  })
  const geckoHost = createGeckoHostApi({
    ...options,
    name: options.name ?? 'Drama Browser Gecko Host',
    runtimeBaseUrl: options.runtimeBaseUrl,
  })

  const request = runtime.request.bind(runtime)
  const chrome = options.chrome

  return {
    ...geckoHost,
    runtime: {
      ...runtime,
      getStatus: runtime.getStatus.bind(runtime),
      getCapabilities: runtime.getCapabilities.bind(runtime),
      request,
    },
    getInfo: () => ({
      ...geckoHost.getInfo(),
      kind: 'gecko',
      name: options.name ?? 'Drama Browser Gecko Host',
    }),
    getCapabilities: () => ({
      ...geckoHost.getCapabilities(),
      ...dramaBrowserCapabilities,
    }),
    rpc: {
      request,
    },
    navigation: {
      openUrl: async (url) => {
        if (chrome?.openUrl) return chrome.openUrl(url)
        return geckoHost.shell.openUrl(url)
      },
      openInternalRoute: async (route, params) => {
        if (!chrome?.openInternalRoute) return unavailable('Internal route navigation')
        return chrome.openInternalRoute(route, params)
      },
      newTab: async (url) => {
        if (!chrome?.newTab) return unavailable('New tab')
        return chrome.newTab(url)
      },
      newWindow: async (url) => {
        if (!chrome?.newWindow) return unavailable('New window')
        return chrome.newWindow(url)
      },
      getDiagnostics: async () => chrome?.getDiagnostics?.() ?? null,
    },
    sessions: {
      command: (sessionId, command, requestOptions) => request('sessions:command', { sessionId, command }, requestOptions),
      cancel: async (sessionId, silent, requestOptions) => {
        await request('sessions:cancel', { sessionId, silent }, requestOptions)
      },
    },
    plm: {
      getSidecarStatus: (payload, requestOptions) => request('plotpilot:runtime:status', payload, requestOptions),
      startSidecar: (payload, requestOptions) => request('plotpilot:runtime:start', payload, requestOptions),
      stopSidecar: (payload, requestOptions) => request('plotpilot:runtime:stop', payload, requestOptions),
      getSidecarLogs: (payload, requestOptions) => request('plotpilot:runtime:logs', payload, requestOptions),
    },
    graph: {
      load: (payload, requestOptions) => request('drama:graph:load', payload, requestOptions),
      history: (payload, requestOptions) => request('drama:graph:history', payload, requestOptions),
      persist: (payload, requestOptions) => request('drama:graph:persist', payload, requestOptions),
      restoreBackup: (payload, requestOptions) => request('drama:graph:restoreBackup', payload, requestOptions),
    },
    skillCrew: {
      refresh: (payload, requestOptions) => request('skill-crew:refresh-skills', payload, requestOptions),
      importSkill: (payload, requestOptions) => request('skill-crew:import-skill', payload, requestOptions),
      run: (payload, requestOptions) => request('skill-crew:run-codex-skill', payload, requestOptions),
      recordFeedback: (payload, requestOptions) => request('skill-crew:record-feedback', payload, requestOptions),
    },
    basicMemory: {
      read: (payload, requestOptions) => request('basic-memory:read', payload, requestOptions),
      search: (payload, requestOptions) => request('basic-memory:search', payload, requestOptions),
      write: (payload, requestOptions) => request('basic-memory:write', payload, requestOptions),
    },
    settings: {
      read: (key, requestOptions) => request('settings:read', { key }, requestOptions),
      write: async (key, value, requestOptions) => {
        await request('settings:write', { key, value }, requestOptions)
      },
    },
    diagnostics: {
      snapshot: (requestOptions) => request('diagnostics:snapshot', undefined, requestOptions),
      process: (requestOptions) => request('diagnostics:process', undefined, requestOptions),
    },
  }
}
