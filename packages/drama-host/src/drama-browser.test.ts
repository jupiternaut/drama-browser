import { describe, expect, test } from 'bun:test'

import * as rootHostExports from './index.ts'
import { assertHostCapabilities, getMissingHostCapabilities } from './index.ts'
import { createDramaBrowserHostApi } from './drama-browser.ts'

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

function testFetcher(handler: (input: RequestInfo | URL, init?: RequestInit) => Response | Promise<Response>): typeof fetch {
  return handler as unknown as typeof fetch
}

describe('createDramaBrowserHostApi', () => {
  test('creates the production Gecko host, not a legacy Electron host', () => {
    const host = createDramaBrowserHostApi({
      runtimeBaseUrl: 'http://127.0.0.1:3198',
      fetcher: testFetcher(async () => jsonResponse({ ok: true, data: {} })),
    })

    expect(host.getInfo().kind).toBe('gecko')
    expect(host.getInfo().name).toBe('Drama Browser Gecko Host')
    expect(host.getCapabilities()['runtime.status']).toBe(true)
    expect(host.getCapabilities()['sessions.command']).toBe(true)
    expect(host.getCapabilities()['basicMemory.search']).toBe(true)
    expect(getMissingHostCapabilities(host, ['runtime.status', 'sessions.command', 'basicMemory.search'])).toEqual([])
    assertHostCapabilities(host, ['runtime.status', 'sessions.command', 'basicMemory.search'])
  })

  test('routes production session commands through Drama Runtime RPC', async () => {
    const calls: Array<{ url: string; body: string | null }> = []
    const host = createDramaBrowserHostApi({
      runtimeBaseUrl: 'http://127.0.0.1:3198',
      fetcher: testFetcher(async (input, init) => {
        calls.push({ url: String(input), body: typeof init?.body === 'string' ? init.body : null })
        return jsonResponse({ ok: true, data: { accepted: true } })
      }),
    })

    await expect(host.sessions.command('session-1', { type: 'setLabels', labels: ['draft'] })).resolves.toEqual({
      accepted: true,
    })
    expect(calls[0]).toEqual({
      url: 'http://127.0.0.1:3198/runtime/rpc',
      body: JSON.stringify({
        channel: 'sessions:command',
        payload: {
          sessionId: 'session-1',
          command: { type: 'setLabels', labels: ['draft'] },
        },
      }),
    })
  })

  test('does not export the legacy Electron adapter from the root host contract', () => {
    expect('createLegacyElectronHostApi' in rootHostExports).toBe(false)
  })
})
