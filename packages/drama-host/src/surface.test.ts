import { describe, expect, test } from 'bun:test'

import { classifyDramaPlmSurface, isZenDramaProductPath } from './surface.ts'

describe('classifyDramaPlmSurface', () => {
  test('classifies Zen chrome-resource PLM as product path', () => {
    const url = 'chrome://browser/content/drama/app/index.html?host=zen&runtime=http%3A%2F%2F127.0.0.1%3A3198&surface=plm'
    expect(isZenDramaProductPath(url)).toBe(true)
    expect(classifyDramaPlmSurface({ url, hostKind: 'gecko' })).toEqual({
      classification: 'product-zen-panel',
      productPath: true,
      currentUrl: url,
      reason: 'PLM is loaded from the Zen chrome-resource product path.',
    })
  })

  test('classifies localhost PLM as developer compatibility even with host=zen', () => {
    const result = classifyDramaPlmSurface({
      url: 'http://127.0.0.1:3198/app/plm?host=zen&runtime=http%3A%2F%2F127.0.0.1%3A3198',
      hostKind: 'gecko',
    })
    expect(result.classification).toBe('dev-localhost')
    expect(result.productPath).toBe(false)
  })

  test('classifies non-Zen browser PLM as fallback', () => {
    const result = classifyDramaPlmSurface({
      url: 'https://example.test/app/plm?host=zen',
      hostKind: 'browser',
      userAgent: 'Mozilla/5.0 Chrome/120 Safari/537.36',
    })
    expect(result.classification).toBe('browser-fallback')
    expect(result.productPath).toBe(false)
  })

  test('classifies Electron as legacy even if URL resembles the app route', () => {
    const result = classifyDramaPlmSurface({
      url: 'http://127.0.0.1:3198/app/plm?host=zen',
      hostKind: 'electron',
    })
    expect(result.classification).toBe('legacy-electron')
    expect(result.productPath).toBe(false)
  })
})
