import { describe, expect, test } from 'bun:test'

import { createDramaRuntimeClient, DramaRuntimeError } from './runtime-client.ts'

function abortableNeverFetch(): typeof fetch {
  return ((_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => {
      reject(new DOMException('Aborted', 'AbortError'))
    }, { once: true })
  })) as typeof fetch
}

describe('createDramaRuntimeClient', () => {
  test('times out slow runtime status requests', async () => {
    const client = createDramaRuntimeClient({
      baseUrl: 'http://127.0.0.1:3198',
      fetcher: abortableNeverFetch(),
      timeoutMs: 5,
    })

    try {
      await client.getStatus()
      throw new Error('Expected getStatus to time out.')
    } catch (error) {
      expect(error).toBeInstanceOf(DramaRuntimeError)
      expect((error as DramaRuntimeError).code).toBe('RUNTIME_REQUEST_TIMEOUT')
    }
  })

  test('cancels runtime RPC requests with caller abort signal', async () => {
    const client = createDramaRuntimeClient({
      baseUrl: 'http://127.0.0.1:3198',
      fetcher: abortableNeverFetch(),
      timeoutMs: 1_000,
    })
    const controller = new AbortController()
    const request = client.request('plotpilot:runtime:status', { checkHealth: true }, {
      signal: controller.signal,
    })
    controller.abort()

    try {
      await request
      throw new Error('Expected request to be cancelled.')
    } catch (error) {
      expect(error).toBeInstanceOf(DramaRuntimeError)
      expect((error as DramaRuntimeError).code).toBe('RUNTIME_REQUEST_CANCELLED')
    }
  })
})
