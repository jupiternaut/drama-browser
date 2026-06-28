import { describe, expect, test } from 'bun:test'

import {
  classifyDramaPlmSurface,
  isDramaBrowserProductPath,
  isZenDramaProductPath,
  normalizeDramaPlmSurfaceClassification,
} from './surface.ts'

describe('classifyDramaPlmSurface', () => {
  test('classifies Drama Browser chrome-resource PLM as product path', () => {
    const url = 'chrome://browser/content/drama/app/index.html?host=drama&runtime=http%3A%2F%2F127.0.0.1%3A3198&surface=plm'
    expect(isDramaBrowserProductPath(url)).toBe(true)
    expect(isZenDramaProductPath(url)).toBe(false)
    expect(classifyDramaPlmSurface({ url, hostKind: 'gecko' })).toEqual({
      classification: 'product-drama-browser',
      canonicalClassification: 'product-drama-browser',
      hostAdapter: 'zen-gecko',
      productPath: true,
      currentUrl: url,
      reason: 'PLM is loaded from the Drama Browser product path.',
    })
  })

  test('keeps legacy Zen chrome-resource PLM as product path alias input', () => {
    const url = 'chrome://browser/content/drama/app/index.html?host=zen&runtime=http%3A%2F%2F127.0.0.1%3A3198&surface=plm'
    expect(isDramaBrowserProductPath(url)).toBe(true)
    expect(isZenDramaProductPath(url)).toBe(true)
    expect(classifyDramaPlmSurface({ url, hostKind: 'gecko' })).toEqual({
      classification: 'product-drama-browser',
      canonicalClassification: 'product-drama-browser',
      hostAdapter: 'zen-gecko',
      productPath: true,
      currentUrl: url,
      reason: 'PLM is loaded from the Drama Browser product path.',
    })
    expect(normalizeDramaPlmSurfaceClassification('product-zen-panel')).toBe('product-drama-browser')
  })

  test('classifies localhost PLM as developer compatibility even with host=zen', () => {
    const result = classifyDramaPlmSurface({
      url: 'http://127.0.0.1:3198/app/plm?host=zen&runtime=http%3A%2F%2F127.0.0.1%3A3198',
      hostKind: 'gecko',
    })
    expect(result.classification).toBe('dev-localhost')
    expect(result.canonicalClassification).toBe('dev-localhost')
    expect(result.hostAdapter).toBe('zen-gecko')
    expect(result.productPath).toBe(false)
  })

  test('classifies non-Zen browser PLM as fallback', () => {
    const result = classifyDramaPlmSurface({
      url: 'https://example.test/app/plm?host=zen',
      hostKind: 'browser',
      userAgent: 'Mozilla/5.0 Chrome/120 Safari/537.36',
    })
    expect(result.classification).toBe('browser-fallback')
    expect(result.canonicalClassification).toBe('browser-fallback')
    expect(result.hostAdapter).toBe('browser')
    expect(result.productPath).toBe(false)
  })

  test('classifies Electron as legacy even if URL resembles the app route', () => {
    const result = classifyDramaPlmSurface({
      url: 'http://127.0.0.1:3198/app/plm?host=zen',
      hostKind: 'electron',
    })
    expect(result.classification).toBe('legacy-electron')
    expect(result.canonicalClassification).toBe('legacy-electron')
    expect(result.hostAdapter).toBe('electron')
    expect(result.productPath).toBe(false)
  })
})
