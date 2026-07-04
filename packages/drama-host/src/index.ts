import type { DramaRuntimeRequestOptions, DramaRuntimeStatus } from './runtime-client.ts'

export type DramaHostKind = 'electron' | 'browser' | 'gecko' | 'test'

export type DramaHostCapability =
  | 'shell.openUrl'
  | 'shell.openFile'
  | 'shell.showInFolder'
  | 'navigation.openUrl'
  | 'navigation.openInternalRoute'
  | 'navigation.newTab'
  | 'navigation.newWindow'
  | 'navigation.diagnostics'
  | 'files.readTextFile'
  | 'files.readBinaryFile'
  | 'files.writeTextFile'
  | 'dialogs.confirm'
  | 'dialogs.openFile'
  | 'dialogs.saveFile'
  | 'clipboard.readText'
  | 'clipboard.writeText'
  | 'lifecycle.focusWindow'
  | 'lifecycle.quit'
  | 'notifications.show'
  | 'rpc.request'
  | 'events.subscribe'
  | 'runtime.status'
  | 'runtime.capabilities'
  | 'runtime.request'
  | 'sessions.command'
  | 'sessions.cancel'
  | 'sessions.subscribe'
  | 'plm.sidecar.status'
  | 'plm.sidecar.start'
  | 'plm.sidecar.stop'
  | 'plm.sidecar.logs'
  | 'graph.load'
  | 'graph.history'
  | 'graph.persist'
  | 'graph.backup'
  | 'skillCrew.refresh'
  | 'skillCrew.import'
  | 'skillCrew.run'
  | 'skillCrew.feedback'
  | 'basicMemory.read'
  | 'basicMemory.search'
  | 'basicMemory.write'
  | 'settings.read'
  | 'settings.write'
  | 'diagnostics.snapshot'
  | 'diagnostics.process'

export type DramaHostCapabilities = Partial<Record<DramaHostCapability, boolean>>

export interface DramaHostInfo {
  kind: DramaHostKind
  name: string
  version?: string
  platform?: string
  userAgent?: string
}

export interface DramaHostOpenResult {
  ok: boolean
  error?: string
}

export interface DramaHostFileFilter {
  name: string
  extensions: string[]
}

export interface DramaHostOpenFileDialogSpec {
  title?: string
  defaultPath?: string
  buttonLabel?: string
  allowFiles?: boolean
  allowDirectories?: boolean
  allowMultiple?: boolean
  showHiddenFiles?: boolean
  filters?: DramaHostFileFilter[]
}

export interface DramaHostSaveFileDialogSpec {
  title?: string
  defaultPath?: string
  buttonLabel?: string
  filters?: DramaHostFileFilter[]
}

export interface DramaHostConfirmDialogSpec {
  title?: string
  message: string
  detail?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
}

export interface DramaHostNotificationSpec {
  title: string
  body?: string
  silent?: boolean
}

export interface DramaHostEventEnvelope<TPayload = unknown> {
  type: string
  payload: TPayload
  createdAt: string
}

export type DramaHostUnsubscribe = () => void

export interface DramaHostShellApi {
  openUrl(url: string): Promise<DramaHostOpenResult>
  openFile?(path: string): Promise<DramaHostOpenResult>
  showInFolder?(path: string): Promise<DramaHostOpenResult>
}

export interface DramaHostFilesApi {
  readTextFile?(path: string): Promise<string>
  readBinaryFile?(path: string): Promise<Uint8Array | ArrayBuffer>
  writeTextFile?(path: string, contents: string): Promise<void>
}

export interface DramaHostDialogsApi {
  confirm?(spec: DramaHostConfirmDialogSpec): Promise<boolean>
  openFile?(spec?: DramaHostOpenFileDialogSpec): Promise<string[] | null>
  saveFile?(spec?: DramaHostSaveFileDialogSpec): Promise<string | null>
}

export interface DramaHostClipboardApi {
  readText?(): Promise<string>
  writeText?(text: string): Promise<void>
}

export interface DramaHostLifecycleApi {
  focusWindow?(): Promise<void>
  quit?(): Promise<void>
}

export interface DramaHostNotificationsApi {
  show?(spec: DramaHostNotificationSpec): Promise<void>
}

export interface DramaHostRpcApi {
  request?<TResponse = unknown, TRequest = unknown>(channel: string, payload?: TRequest): Promise<TResponse>
}

export interface DramaHostEventsApi {
  subscribe?<TPayload = unknown>(
    type: string,
    listener: (event: DramaHostEventEnvelope<TPayload>) => void,
  ): DramaHostUnsubscribe
}

export interface DramaHostNavigationApi {
  openUrl(url: string): Promise<DramaHostOpenResult>
  openInternalRoute?(route: string, params?: Record<string, string>): Promise<DramaHostOpenResult>
  newTab?(url?: string): Promise<DramaHostOpenResult>
  newWindow?(url?: string): Promise<DramaHostOpenResult>
  getDiagnostics?(): Promise<unknown>
}

export interface DramaHostRuntimeApi {
  getStatus(options?: DramaRuntimeRequestOptions): Promise<DramaRuntimeStatus>
  getCapabilities?(options?: DramaRuntimeRequestOptions): Promise<DramaHostCapabilities>
  request?<TResponse = unknown, TPayload = unknown>(
    channel: string,
    payload?: TPayload,
    options?: DramaRuntimeRequestOptions,
  ): Promise<TResponse>
}

export interface DramaHostSessionApi {
  command<TResponse = unknown, TCommand = unknown>(
    sessionId: string,
    command: TCommand,
    options?: DramaRuntimeRequestOptions,
  ): Promise<TResponse>
  cancel?(sessionId: string, silent?: boolean, options?: DramaRuntimeRequestOptions): Promise<void>
  subscribe?<TPayload = unknown>(
    sessionId: string,
    listener: (event: DramaHostEventEnvelope<TPayload>) => void,
  ): DramaHostUnsubscribe
}

export interface DramaHostPlmApi {
  getSidecarStatus<TResponse = unknown>(payload?: unknown, options?: DramaRuntimeRequestOptions): Promise<TResponse>
  startSidecar?<TResponse = unknown>(payload?: unknown, options?: DramaRuntimeRequestOptions): Promise<TResponse>
  stopSidecar?<TResponse = unknown>(payload?: unknown, options?: DramaRuntimeRequestOptions): Promise<TResponse>
  getSidecarLogs?<TResponse = unknown>(payload?: unknown, options?: DramaRuntimeRequestOptions): Promise<TResponse>
}

export interface DramaHostGraphApi {
  load<TResponse = unknown>(payload?: unknown, options?: DramaRuntimeRequestOptions): Promise<TResponse>
  history?<TResponse = unknown>(payload?: unknown, options?: DramaRuntimeRequestOptions): Promise<TResponse>
  persist?<TResponse = unknown>(payload?: unknown, options?: DramaRuntimeRequestOptions): Promise<TResponse>
  restoreBackup?<TResponse = unknown>(payload?: unknown, options?: DramaRuntimeRequestOptions): Promise<TResponse>
}

export interface DramaHostSkillCrewApi {
  refresh<TResponse = unknown>(payload?: unknown, options?: DramaRuntimeRequestOptions): Promise<TResponse>
  importSkill?<TResponse = unknown>(payload?: unknown, options?: DramaRuntimeRequestOptions): Promise<TResponse>
  run<TResponse = unknown>(payload?: unknown, options?: DramaRuntimeRequestOptions): Promise<TResponse>
  recordFeedback?<TResponse = unknown>(payload?: unknown, options?: DramaRuntimeRequestOptions): Promise<TResponse>
}

export interface DramaHostBasicMemoryApi {
  read<TResponse = unknown>(payload?: unknown, options?: DramaRuntimeRequestOptions): Promise<TResponse>
  search<TResponse = unknown>(payload?: unknown, options?: DramaRuntimeRequestOptions): Promise<TResponse>
  write<TResponse = unknown>(payload?: unknown, options?: DramaRuntimeRequestOptions): Promise<TResponse>
}

export interface DramaHostSettingsApi {
  read<TResponse = unknown>(key: string, options?: DramaRuntimeRequestOptions): Promise<TResponse>
  write<TValue = unknown>(key: string, value: TValue, options?: DramaRuntimeRequestOptions): Promise<void>
}

export interface DramaHostDiagnosticsApi {
  snapshot<TResponse = unknown>(options?: DramaRuntimeRequestOptions): Promise<TResponse>
  process?<TResponse = unknown>(options?: DramaRuntimeRequestOptions): Promise<TResponse>
}

export interface DramaHostApi {
  getInfo(): DramaHostInfo
  getCapabilities(): DramaHostCapabilities
  shell: DramaHostShellApi
  navigation?: DramaHostNavigationApi
  files?: DramaHostFilesApi
  dialogs?: DramaHostDialogsApi
  clipboard?: DramaHostClipboardApi
  lifecycle?: DramaHostLifecycleApi
  notifications?: DramaHostNotificationsApi
  rpc?: DramaHostRpcApi
  events?: DramaHostEventsApi
  runtime?: DramaHostRuntimeApi
  sessions?: DramaHostSessionApi
  plm?: DramaHostPlmApi
  graph?: DramaHostGraphApi
  skillCrew?: DramaHostSkillCrewApi
  basicMemory?: DramaHostBasicMemoryApi
  settings?: DramaHostSettingsApi
  diagnostics?: DramaHostDiagnosticsApi
}

export interface CreateBrowserHostApiOptions {
  name?: string
  version?: string
  userAgent?: string
  openUrl?: (url: string) => void | Promise<void>
  confirm?: (spec: DramaHostConfirmDialogSpec) => boolean | Promise<boolean>
  readClipboardText?: () => string | Promise<string>
  writeClipboardText?: (text: string) => void | Promise<void>
}

const browserCapabilities: DramaHostCapabilities = {
  'shell.openUrl': true,
  'dialogs.confirm': true,
  'clipboard.readText': true,
  'clipboard.writeText': true,
}

export function createBrowserHostApi(options: CreateBrowserHostApiOptions = {}): DramaHostApi {
  const userAgent = options.userAgent ?? globalThis.navigator?.userAgent
  const confirmHandler =
    options.confirm ??
    ((spec: DramaHostConfirmDialogSpec) => {
      if (typeof globalThis.confirm !== 'function') return false
      return globalThis.confirm(spec.detail ? `${spec.message}\n\n${spec.detail}` : spec.message)
    })

  const openUrl =
    options.openUrl ??
    ((url: string) => {
      globalThis.window?.open(url, '_blank', 'noopener,noreferrer')
    })

  return {
    getInfo: () => ({
      kind: 'browser',
      name: options.name ?? 'Drama Browser Host',
      version: options.version,
      userAgent,
    }),
    getCapabilities: () => ({ ...browserCapabilities }),
    shell: {
      async openUrl(url: string) {
        try {
          await openUrl(url)
          return { ok: true }
        } catch (error) {
          return { ok: false, error: error instanceof Error ? error.message : String(error) }
        }
      },
    },
    dialogs: {
      async confirm(spec: DramaHostConfirmDialogSpec) {
        return Boolean(await confirmHandler(spec))
      },
    },
    clipboard: {
      async readText() {
        if (options.readClipboardText) return options.readClipboardText()
        return globalThis.navigator?.clipboard?.readText?.() ?? ''
      },
      async writeText(text: string) {
        if (options.writeClipboardText) {
          await options.writeClipboardText(text)
          return
        }
        await globalThis.navigator?.clipboard?.writeText?.(text)
      },
    },
  }
}

export function hasHostCapability(host: DramaHostApi, capability: DramaHostCapability): boolean {
  return host.getCapabilities()[capability] === true
}

export function getMissingHostCapabilities(
  host: DramaHostApi,
  capabilities: readonly DramaHostCapability[],
): DramaHostCapability[] {
  return capabilities.filter((capability) => !hasHostCapability(host, capability))
}

export function hasHostCapabilities(
  host: DramaHostApi,
  capabilities: readonly DramaHostCapability[],
): boolean {
  return getMissingHostCapabilities(host, capabilities).length === 0
}

export function assertHostCapability(host: DramaHostApi, capability: DramaHostCapability): void {
  if (hasHostCapability(host, capability)) return
  const info = host.getInfo()
  throw new Error(`Drama host "${info.name}" (${info.kind}) does not provide ${capability}.`)
}

export function assertHostCapabilities(host: DramaHostApi, capabilities: readonly DramaHostCapability[]): void {
  const missing = getMissingHostCapabilities(host, capabilities)
  if (missing.length === 0) return
  const info = host.getInfo()
  throw new Error(`Drama host "${info.name}" (${info.kind}) does not provide: ${missing.join(', ')}.`)
}

export type {
  DramaRuntimeClient,
  DramaRuntimeClientOptions,
  DramaRuntimeCapabilities,
  DramaRuntimeRequestOptions,
  DramaRuntimeRpcRequest,
  DramaRuntimeRpcResponse,
  DramaRuntimeState,
  DramaRuntimeStatus,
} from './runtime-client.ts'
export { DramaRuntimeError, createDramaRuntimeClient } from './runtime-client.ts'
export type {
  DramaPlmReadinessState,
  DramaPlmReadinessStatus,
  DramaPlmReadinessTier,
  DramaPlmHostAdapter,
  DramaPlmSurfaceClassification,
  DramaPlmSurfaceClassificationInput,
  DramaPlmSurfaceClassificationResult,
} from './surface.ts'
export {
  classifyDramaPlmSurface,
  isDramaBrowserProductPath,
  isZenDramaProductPath,
  normalizeDramaPlmSurfaceClassification,
} from './surface.ts'
