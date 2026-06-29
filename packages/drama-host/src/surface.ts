export type DramaPlmSurfaceClassification =
  | 'product-drama-browser'
  /** @deprecated Use product-drama-browser with hostAdapter=zen-gecko. */
  | 'product-zen-panel'
  | 'dev-localhost'
  | 'browser-fallback'
  | 'legacy-electron'

export type DramaPlmHostAdapter = 'zen-gecko' | 'browser' | 'electron' | 'unknown'

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
  hostKind?: 'electron' | 'browser' | 'gecko' | 'test' | string | null
  userAgent?: string | null
  expectedSurface?: 'start' | 'plm' | 'graph' | 'crew' | 'memory'
}

export interface DramaPlmSurfaceClassificationResult {
  classification: DramaPlmSurfaceClassification
  canonicalClassification: Exclude<DramaPlmSurfaceClassification, 'product-zen-panel'>
  hostAdapter: DramaPlmHostAdapter
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
  if (surface === 'start') return 'Start'
  if (surface === 'graph') return 'Graph'
  if (surface === 'crew') return 'Skill Crew'
  if (surface === 'memory') return 'Basic Memory'
  return 'PLM'
}

function isDramaChromeProductPath(
  url: string | URL | null | undefined,
  expectedSurface = 'plm',
  allowedHosts = new Set(['drama', 'zen']),
): boolean {
  const parsed = normalizeUrl(url)
  if (!parsed) return false
  const hostParam = parsed.searchParams.get('host')
  return parsed.protocol === PRODUCT_CHROME_PROTOCOL
    && parsed.hostname === PRODUCT_CHROME_HOST
    && parsed.pathname === PRODUCT_CHROME_PATH
    && (!hostParam || allowedHosts.has(hostParam))
    && parsed.searchParams.get('surface') === expectedSurface
}

export function isDramaBrowserProductPath(url: string | URL | null | undefined, expectedSurface = 'plm'): boolean {
  return isDramaChromeProductPath(url, expectedSurface)
}

/** @deprecated Use isDramaBrowserProductPath. */
export function isZenDramaProductPath(url: string | URL | null | undefined, expectedSurface = 'plm'): boolean {
  return isDramaChromeProductPath(url, expectedSurface, new Set(['zen']))
}

export function normalizeDramaPlmSurfaceClassification(
  classification: DramaPlmSurfaceClassification,
): Exclude<DramaPlmSurfaceClassification, 'product-zen-panel'> {
  if (classification === 'product-zen-panel') return 'product-drama-browser'
  return classification
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
      canonicalClassification: 'legacy-electron',
      hostAdapter: 'electron',
      productPath: false,
      currentUrl,
      reason: 'PLM is running in the legacy Electron compatibility surface.',
    }
  }

  if (isDramaBrowserProductPath(parsed, expectedSurface)) {
    const hostParam = parsed?.searchParams.get('host')
    return {
      classification: 'product-drama-browser',
      canonicalClassification: 'product-drama-browser',
      hostAdapter: hostParam === 'zen' || hostKind === 'gecko' ? 'zen-gecko' : 'unknown',
      productPath: true,
      currentUrl,
      reason: `${surfaceLabel(expectedSurface)} is loaded from the Drama Browser product path.`,
    }
  }

  if (parsed && (parsed.protocol === 'http:' || parsed.protocol === 'https:') && isLocalhost(parsed.hostname)) {
    return {
      classification: 'dev-localhost',
      canonicalClassification: 'dev-localhost',
      hostAdapter: hostKind === 'gecko' ? 'zen-gecko' : 'browser',
      productPath: false,
      currentUrl,
      reason: `${surfaceLabel(expectedSurface)} is running through the localhost developer compatibility route.`,
    }
  }

  return {
    classification: 'browser-fallback',
    canonicalClassification: 'browser-fallback',
    hostAdapter: hostKind === 'gecko' ? 'zen-gecko' : 'browser',
    productPath: false,
    currentUrl,
    reason: `${surfaceLabel(expectedSurface)} is running outside the Drama Browser product path.`,
  }
}
