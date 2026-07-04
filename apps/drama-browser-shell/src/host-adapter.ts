import { createBrowserHostApi, type DramaHostApi } from '@drama/host'
import { createGeckoHostApi } from '@drama/host/gecko'

import type { DramaSkinId } from './skins'

export type DramaBrowserHostId = 'browser' | 'drama'
export type DramaBrowserHostAdapterKind = 'browser' | 'zen-gecko'

export interface CreateDramaBrowserHostApiOptions {
  runtimeBaseUrl: string
}

export interface DramaBrowserHostAdapter {
  id: DramaBrowserHostId
  adapterKind: DramaBrowserHostAdapterKind
  dataHost: string
  hostedChrome: boolean
  shellClassName?: string
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

const DRAMA_PRODUCT_HOST_MARKER = 'drama'
const LEGACY_ZEN_HOST_MARKER = 'zen'
const PRODUCT_CHROME_PROTOCOL = 'chrome:'
const PRODUCT_CHROME_HOST = 'browser'
const PRODUCT_CHROME_PATH = '/content/drama/app/index.html'

const dramaProductHostAdapter: DramaBrowserHostAdapter = {
  id: 'drama',
  adapterKind: 'zen-gecko',
  dataHost: 'drama',
  hostedChrome: true,
  shellClassName: 'zen-host',
  defaultSkinId: 'host-follow',
  displayBadge: () => 'host=drama · Zen/Gecko',
  createHostApi({ runtimeBaseUrl }) {
    return createGeckoHostApi({
      name: 'Drama Browser Gecko Adapter',
      version: '0.1.0',
      runtimeBaseUrl,
    })
  },
  appendRouteParams(params, { runtimeBaseUrl, defaultRuntimeBaseUrl }) {
    params.set('host', DRAMA_PRODUCT_HOST_MARKER)
    if (runtimeBaseUrl !== defaultRuntimeBaseUrl) params.set('runtime', runtimeBaseUrl)
  },
  applyThemeMessage(data) {
    const message = data as HostThemeMessage
    if (message?.type !== 'drama:host-theme') return false
    const variables = message.theme?.variables
    if (!variables || typeof variables !== 'object') return false
    document.documentElement.dataset.host = DRAMA_PRODUCT_HOST_MARKER
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
  adapterKind: 'browser',
  dataHost: 'browser',
  hostedChrome: false,
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

function isProductHostMarker(host: string | null): boolean {
  return host === DRAMA_PRODUCT_HOST_MARKER || host === LEGACY_ZEN_HOST_MARKER
}

function isPackagedProductLocation(location: Location): boolean {
  return location.protocol === PRODUCT_CHROME_PROTOCOL
    && location.hostname === PRODUCT_CHROME_HOST
    && location.pathname === PRODUCT_CHROME_PATH
}

export function resolveDramaBrowserHostAdapter(location: Location = globalThis.location): DramaBrowserHostAdapter {
  const params = new URLSearchParams(location.search ?? '')
  if (isProductHostMarker(params.get('host')) || isPackagedProductLocation(location)) {
    return dramaProductHostAdapter
  }
  return browserHostAdapter
}
