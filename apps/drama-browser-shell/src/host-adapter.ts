import { createBrowserHostApi, type DramaHostApi } from '@drama/host'
import { createGeckoHostApi } from '@drama/host/gecko'

import type { DramaSkinId } from './skins'

export type DramaBrowserHostId = 'browser' | 'zen'

export interface CreateDramaBrowserHostApiOptions {
  runtimeBaseUrl: string
}

export interface DramaBrowserHostAdapter {
  id: DramaBrowserHostId
  dataHost: string
  defaultSkinId: DramaSkinId
  displayBadge(hostKind: string): string
  createHostApi(options: CreateDramaBrowserHostApiOptions): DramaHostApi
  appendRouteParams(params: URLSearchParams, options: { runtimeBaseUrl: string; defaultRuntimeBaseUrl: string }): void
  applyThemeMessage(data: unknown): boolean
}

interface HostThemeMessage {
  type?: unknown
  theme?: {
    variables?: Record<string, unknown>
  }
}

const zenHostAdapter: DramaBrowserHostAdapter = {
  id: 'zen',
  dataHost: 'zen',
  defaultSkinId: 'zen-follow',
  displayBadge: () => 'host=zen',
  createHostApi({ runtimeBaseUrl }) {
    return createGeckoHostApi({
      name: 'Drama Zen Browser Host',
      version: '0.1.0',
      runtimeBaseUrl,
    })
  },
  appendRouteParams(params, { runtimeBaseUrl, defaultRuntimeBaseUrl }) {
    params.set('host', 'zen')
    if (runtimeBaseUrl !== defaultRuntimeBaseUrl) params.set('runtime', runtimeBaseUrl)
  },
  applyThemeMessage(data) {
    const message = data as HostThemeMessage
    if (message?.type !== 'drama:host-theme') return false
    const variables = message.theme?.variables
    if (!variables || typeof variables !== 'object') return false
    document.documentElement.dataset.host = 'zen'
    for (const [key, value] of Object.entries(variables)) {
      if (key.startsWith('--zen-') && typeof value === 'string') {
        document.documentElement.style.setProperty(key, value.trim())
      }
    }
    return true
  },
}

const browserHostAdapter: DramaBrowserHostAdapter = {
  id: 'browser',
  dataHost: 'browser',
  defaultSkinId: 'drama-classic',
  displayBadge: (hostKind) => hostKind,
  createHostApi() {
    return createBrowserHostApi({
      name: 'Drama Browser',
      version: '0.1.0',
    })
  },
  appendRouteParams(params, { runtimeBaseUrl, defaultRuntimeBaseUrl }) {
    if (runtimeBaseUrl !== defaultRuntimeBaseUrl) params.set('runtime', runtimeBaseUrl)
  },
  applyThemeMessage() {
    return false
  },
}

export function resolveDramaBrowserHostAdapter(location: Location = globalThis.location): DramaBrowserHostAdapter {
  const params = new URLSearchParams(location.search ?? '')
  return params.get('host') === 'zen' ? zenHostAdapter : browserHostAdapter
}
