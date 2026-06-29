export type DramaRuntimeState = 'offline' | 'starting' | 'ready' | 'error'

export interface DramaRuntimeStatus {
  state: DramaRuntimeState
  version?: string
  message?: string
  updatedAt?: string
  endpoints?: {
    graph?: string
    plm?: string
    crew?: string
    app?: string
    events?: string
  }
}

export type DramaRuntimeCapabilities = Record<string, boolean>

export interface DramaRuntimeRpcRequest<TPayload = unknown> {
  channel: string
  payload?: TPayload
}

export interface DramaRuntimeRpcResponse<TResponse = unknown> {
  ok: boolean
  data?: TResponse
  error?: {
    code: string
    message: string
    details?: unknown
  }
}

export interface DramaRuntimeRequestOptions {
  signal?: AbortSignal
  timeoutMs?: number
}

export interface DramaRuntimeClientOptions {
  baseUrl: string
  fetcher?: typeof fetch
  timeoutMs?: number
}

export class DramaRuntimeError extends Error {
  readonly code: string
  readonly status?: number
  readonly details?: unknown

  constructor(message: string, options: { code: string; status?: number; details?: unknown }) {
    super(message)
    this.name = 'DramaRuntimeError'
    this.code = options.code
    this.status = options.status
    this.details = options.details
  }
}

export interface DramaRuntimeClient {
  readonly baseUrl: string
  getStatus(options?: DramaRuntimeRequestOptions): Promise<DramaRuntimeStatus>
  getCapabilities(options?: DramaRuntimeRequestOptions): Promise<DramaRuntimeCapabilities>
  request<TResponse = unknown, TPayload = unknown>(
    channel: string,
    payload?: TPayload,
    options?: DramaRuntimeRequestOptions,
  ): Promise<TResponse>
}

const DEFAULT_RUNTIME_REQUEST_TIMEOUT_MS = 2_000

export function createDramaRuntimeClient(options: DramaRuntimeClientOptions): DramaRuntimeClient {
  const baseUrl = options.baseUrl.replace(/\/+$/, '')
  const fetcher = options.fetcher ?? globalThis.fetch?.bind(globalThis)
  if (!fetcher) {
    throw new DramaRuntimeError('This host does not provide fetch.', { code: 'FETCH_UNAVAILABLE' })
  }

  async function readJson<T>(
    path: string,
    init?: RequestInit,
    requestOptions: DramaRuntimeRequestOptions = {},
  ): Promise<T> {
    const timeoutMs = requestOptions.timeoutMs ?? options.timeoutMs ?? DEFAULT_RUNTIME_REQUEST_TIMEOUT_MS
    const controller = new AbortController()
    const upstreamSignals = [requestOptions.signal, init?.signal].filter((signal): signal is AbortSignal => Boolean(signal))
    let abortKind: 'timeout' | 'cancelled' | null = null
    const abortFromUpstream = () => {
      abortKind = 'cancelled'
      controller.abort()
    }
    for (const signal of upstreamSignals) {
      if (signal.aborted) abortFromUpstream()
      else signal.addEventListener('abort', abortFromUpstream, { once: true })
    }
    const timeout = setTimeout(() => {
      abortKind = 'timeout'
      controller.abort()
    }, timeoutMs)

    let response: Response
    try {
      response = await fetcher(`${baseUrl}${path}`, {
        ...init,
        signal: controller.signal,
        headers: {
          'content-type': 'application/json',
          ...init?.headers,
        },
      })
    } catch (error) {
      if (controller.signal.aborted) {
        throw new DramaRuntimeError(
          abortKind === 'cancelled'
            ? 'Drama runtime request was cancelled.'
            : `Drama runtime request timed out after ${timeoutMs}ms.`,
          {
            code: abortKind === 'cancelled' ? 'RUNTIME_REQUEST_CANCELLED' : 'RUNTIME_REQUEST_TIMEOUT',
            details: { path, timeoutMs },
          },
        )
      }
      throw error
    } finally {
      clearTimeout(timeout)
      for (const signal of upstreamSignals) {
        signal.removeEventListener('abort', abortFromUpstream)
      }
    }

    let body: unknown = null
    try {
      body = await response.json()
    } catch {
      body = null
    }

    if (!response.ok) {
      const maybeError = body as Partial<DramaRuntimeRpcResponse>
      throw new DramaRuntimeError(
        maybeError.error?.message ?? `Drama runtime request failed with ${response.status}.`,
        {
          code: maybeError.error?.code ?? 'RUNTIME_HTTP_ERROR',
          status: response.status,
          details: maybeError.error?.details ?? body,
        },
      )
    }

    return body as T
  }

  return {
    baseUrl,
    getStatus(options) {
      return readJson<DramaRuntimeStatus>('/runtime/status', undefined, options)
    },
    getCapabilities(options) {
      return readJson<DramaRuntimeCapabilities>('/runtime/capabilities', undefined, options)
    },
    async request<TResponse = unknown, TPayload = unknown>(
      channel: string,
      payload?: TPayload,
      options?: DramaRuntimeRequestOptions,
    ) {
      const response = await readJson<DramaRuntimeRpcResponse<TResponse>>('/runtime/rpc', {
        method: 'POST',
        body: JSON.stringify({ channel, payload } satisfies DramaRuntimeRpcRequest<TPayload>),
      }, options)
      if (!response.ok) {
        throw new DramaRuntimeError(response.error?.message ?? 'Drama runtime RPC failed.', {
          code: response.error?.code ?? 'RUNTIME_RPC_ERROR',
          details: response.error?.details,
        })
      }
      return response.data as TResponse
    },
  }
}
