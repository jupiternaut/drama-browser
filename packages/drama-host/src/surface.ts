import type { DramaHostKind } from './index.ts'

export type DramaPlmSurfaceClassification =
  | 'product-zen-panel'
  | 'dev-localhost'
  | 'browser-fallback'
  | 'legacy-electron'

export type DramaPlmReadinessTier =
  | 'shell-ready'
  | 'runtime-ready'
  | 'plm-sidecar-ready'
  | 'ai-ready'
  | 'workflow-preview-ready'
  | 'plotpilot-parity-ready'

export type DramaPlmReadinessState = 'ready' | 'pending' | 'blocked'

export interface DramaPlmReadinessStatus {
  tier: DramaPlmReadinessTier
  state: DramaPlmReadinessState
  message: string
}

export interface DramaPlmSurfaceClassificationInput {
  url?: string | URL | null
  hostKind?: DramaHostKind | string | null
  userAgent?: string | null
  expectedSurface?: 'start' | 'plm' | 'graph' | 'crew'
}

export interface DramaPlmSurfaceClassificationResult {
  classification: DramaPlmSurfaceClassification
  productPath: boolean
  currentUrl: string
  reason: string
}

const PRODUCT_CHROME_PROTOCOL = 'chrome:'
const PRODUCT_CHROME_HOST = 'browser'
const PRODUCT_CHROME_PATH = '/content/drama/app/index.html'

function normalizeUrl(value: string | URL | null | undefined): URL | null {
  if (!value) return null
  if (value instanceof URL) return value
  try {
    return new URL(value)
  } catch {
    return null
  }
}

function isLocalhost(hostname: string): boolean {
  return hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '::1'
}

function surfaceLabel(surface: string): string {
  if (surface === 'start') return 'Zen Start'
  if (surface === 'graph') return 'Graph'
  if (surface === 'crew') return 'Skill Crew'
  return 'PLM'
}

export function isZenDramaProductPath(url: string | URL | null | undefined, expectedSurface = 'plm'): boolean {
  const parsed = normalizeUrl(url)
  if (!parsed) return false
  return parsed.protocol === PRODUCT_CHROME_PROTOCOL
    && parsed.hostname === PRODUCT_CHROME_HOST
    && parsed.pathname === PRODUCT_CHROME_PATH
    && parsed.searchParams.get('host') === 'zen'
    && parsed.searchParams.get('surface') === expectedSurface
}

export function classifyDramaPlmSurface(
  input: DramaPlmSurfaceClassificationInput = {},
): DramaPlmSurfaceClassificationResult {
  const expectedSurface = input.expectedSurface ?? 'plm'
  const parsed = normalizeUrl(input.url)
  const currentUrl = parsed?.href ?? String(input.url ?? '')
  const hostKind = input.hostKind ?? ''
  const userAgent = input.userAgent ?? ''

  if (hostKind === 'electron' || /\bElectron\//.test(userAgent)) {
    return {
      classification: 'legacy-electron',
      productPath: false,
      currentUrl,
      reason: 'PLM is running in the legacy Electron compatibility surface.',
    }
  }

  if (isZenDramaProductPath(parsed, expectedSurface)) {
    return {
      classification: 'product-zen-panel',
      productPath: true,
      currentUrl,
      reason: `${surfaceLabel(expectedSurface)} is loaded from the Zen chrome-resource product path.`,
    }
  }

  if (parsed && (parsed.protocol === 'http:' || parsed.protocol === 'https:') && isLocalhost(parsed.hostname)) {
    return {
      classification: 'dev-localhost',
      productPath: false,
      currentUrl,
      reason: `${surfaceLabel(expectedSurface)} is running through the localhost developer compatibility route.`,
    }
  }

  return {
    classification: 'browser-fallback',
    productPath: false,
    currentUrl,
    reason: `${surfaceLabel(expectedSurface)} is running outside the Zen chrome-resource product panel.`,
  }
}
