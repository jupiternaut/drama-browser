import type { DramaHostApi, DramaHostCapabilities, DramaHostInfo } from './index.ts'

export interface CreateLegacyElectronHostApiOptions {
  electronApi: {
    openUrl?: (url: string) => Promise<unknown> | unknown
    openFile?: (path: string) => Promise<unknown> | unknown
    showInFolder?: (path: string) => Promise<unknown> | unknown
    invokeOnServer?: <TResponse = unknown>(...args: unknown[]) => Promise<TResponse>
  }
  name?: string
  version?: string
  platform?: string
}

const legacyElectronCapabilities: DramaHostCapabilities = {
  'shell.openUrl': true,
  'shell.openFile': true,
  'shell.showInFolder': true,
  'rpc.request': true,
}

export function createLegacyElectronHostApi(options: CreateLegacyElectronHostApiOptions): DramaHostApi {
  const info: DramaHostInfo = {
    kind: 'electron',
    name: options.name ?? 'Legacy Electron Host',
    version: options.version,
    platform: options.platform,
  }

  return {
    getInfo: () => info,
    getCapabilities: () => ({ ...legacyElectronCapabilities }),
    shell: {
      async openUrl(url) {
        try {
          await options.electronApi.openUrl?.(url)
          return { ok: true }
        } catch (error) {
          return { ok: false, error: error instanceof Error ? error.message : String(error) }
        }
      },
      async openFile(path) {
        try {
          await options.electronApi.openFile?.(path)
          return { ok: true }
        } catch (error) {
          return { ok: false, error: error instanceof Error ? error.message : String(error) }
        }
      },
      async showInFolder(path) {
        try {
          await options.electronApi.showInFolder?.(path)
          return { ok: true }
        } catch (error) {
          return { ok: false, error: error instanceof Error ? error.message : String(error) }
        }
      },
    },
    rpc: {
      request: async (channel, payload) => {
        if (!options.electronApi.invokeOnServer) {
          throw new Error('Legacy Electron host does not provide invokeOnServer.')
        }
        return options.electronApi.invokeOnServer(channel, payload)
      },
    },
  }
}

