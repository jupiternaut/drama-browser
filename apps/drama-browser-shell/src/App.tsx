import * as React from 'react'
import {
  Activity,
  Bot,
  BookOpenText,
  CheckCircle2,
  Clock3,
  Compass,
  Database,
  FolderOpen,
  GitBranch,
  ListChecks,
  MessageSquareText,
  Network,
  Palette,
  Radio,
  RefreshCw,
  RotateCcw,
  ScrollText,
  ShieldCheck,
  TriangleAlert,
  UsersRound,
} from 'lucide-react'

import { createSkillCrewAgentOutputEvent, createSkillCrewSuggestionEvent, inferSkillCrewRoomId } from '@drama/crew'
import { StoryletNativeGraphContainer } from '@drama/graph-ui'
import {
  classifyDramaPlmSurface,
  createDramaRuntimeClient,
  type DramaPlmReadinessStatus,
  type DramaPlmSurfaceClassificationResult,
  type DramaRuntimeStatus,
} from '@drama/host'
import {
  PlotPilotNativeContainer,
  type PlotPilotIntegrationStatus,
  type PlotPilotNativeApi,
} from '@drama/plm-ui'
import { Button, StatusBadge, WorkbenchToolButton, type StatusTone } from '@drama/ui'

import { fallbackGraphApi } from './fallback-graph-api'
import { markProductPath, setDramaReadySignal } from './performance'
import { createRuntimeBackedGraphApi } from './runtime-graph-api'
import {
  applyDramaSkin,
  DRAMA_SKINS,
  getInitialDramaSkinId,
  persistDramaSkinId,
  resolveDramaSkinId,
  type DramaSkin,
  type DramaSkinId,
} from './skins'
import { BasicMemorySurface } from './BasicMemorySurface'
import { resolveDramaBrowserHostAdapter } from './host-adapter'
import { ZenStartSurface } from './ZenStartSurface'

type Surface = 'start' | 'graph' | 'plm' | 'crew' | 'memory'
type StyleReadiness = 'checking' | 'ready' | 'missing'
type ShellStateId =
  | 'booting-shell'
  | 'runtime-connecting'
  | 'runtime-ready'
  | 'runtime-unavailable'
  | 'sidecar-starting'
  | 'sidecar-ready'
  | 'sidecar-unavailable'
  | 'ai-unavailable'
  | 'workspace-missing'
  | 'parity-blocked'

interface ShellState {
  id: ShellStateId
  label: string
  message: string
  tone: StatusTone
}

interface SurfaceDescriptor {
  id: Surface
  title: string
  shortLabel: string
  subtitle: string
  source: string
  Icon: React.ComponentType<{ className?: string }>
}

const surfaces: SurfaceDescriptor[] = [
  { id: 'start', title: 'Zen Start', shortLabel: 'Start', subtitle: '启动看板', source: '搜索 / 快捷入口 / 看板', Icon: Compass },
  { id: 'graph', title: 'Drama Graph', shortLabel: 'Graph', subtitle: '状态机画布', source: '画布 / 状态机 / 剧情结构', Icon: Network },
  { id: 'plm', title: 'Drama PLM', shortLabel: 'PLM', subtitle: '长上下文生成', source: '章节 / Bible / 草稿回写', Icon: ScrollText },
  { id: 'crew', title: 'Skill Crew', shortLabel: 'Crew', subtitle: '导演控场', source: 'Agent / Task / Graph Events', Icon: UsersRound },
  { id: 'memory', title: 'Basic Memory', shortLabel: 'Memory', subtitle: '本地知识库', source: 'Markdown / 搜索 / 编辑', Icon: BookOpenText },
]

const PRODUCT_NAME = 'Drama Browser'

function isSurfaceId(value: string | null | undefined): value is Surface {
  return value === 'start' || value === 'plm' || value === 'crew' || value === 'graph' || value === 'memory'
}

function getInitialSurface(): Surface {
  const params = new URLSearchParams(globalThis.location?.search ?? '')
  const surfaceParam = params.get('surface')
  if (isSurfaceId(surfaceParam)) return surfaceParam

  const hashSurface = globalThis.location?.hash?.replace(/^#\/?/, '').split(/[/?&]/)[0]
  if (isSurfaceId(hashSurface)) return hashSurface

  const segments = globalThis.location?.pathname?.replace(/^\/+/, '').split('/').filter(Boolean) ?? []
  const path = segments[0] === 'app' ? segments[1] : segments[0]
  if (isSurfaceId(path)) return path
  return 'start'
}

function isInternalChromeShell(): boolean {
  return globalThis.location?.protocol === 'chrome:'
    || globalThis.location?.pathname?.includes('/drama/app/index.html') === true
}

function getShellBasePath(): string {
  if (isInternalChromeShell()) {
    return globalThis.location?.pathname ?? '/content/drama/app/index.html'
  }
  return '/app'
}

function normalizeShellLocation(surface: Surface): void {
  if (isInternalChromeShell()) return

  const pathname = globalThis.location?.pathname ?? '/'
  const segments = pathname.replace(/^\/+/, '').split('/').filter(Boolean)
  const alreadyAppRoute = segments[0] === 'app'
  const nakedSurfaceRoute = segments.length === 1 && isSurfaceId(segments[0])
  if (alreadyAppRoute || !nakedSurfaceRoute) return

  const nextPath = `${getShellBasePath()}/${surface}${globalThis.location?.search ?? ''}${globalThis.location?.hash ?? ''}`
  globalThis.history?.replaceState?.({}, '', nextPath)
}

function currentDocumentUrl(): string {
  return globalThis.location?.href ?? ''
}

function getRuntimeBaseUrl(): string {
  return new URLSearchParams(globalThis.location?.search ?? '').get('runtime')
    ?? import.meta.env.VITE_DRAMA_RUNTIME_BASE_URL
    ?? 'http://127.0.0.1:3198'
}

function shouldBootstrapPlmProductionFixture(): boolean {
  const params = new URLSearchParams(globalThis.location?.search ?? '')
  const value = params.get('productionFixture') ?? params.get('plmProductionFixture')
  return value === '1' || value === 'true' || value === 'yes'
}

function offlineRuntimeStatus(message = 'Drama standalone runtime is not reachable.'): DramaRuntimeStatus {
  return {
    state: 'offline',
    message,
    updatedAt: new Date().toISOString(),
  }
}

type PlotPilotNativeRuntimeStatus = Awaited<ReturnType<PlotPilotNativeApi['getPlotPilotRuntimeStatus']>>

function withRuntimeProxyBaseUrl(
  status: PlotPilotNativeRuntimeStatus,
  runtimeBaseUrl: string,
): PlotPilotNativeRuntimeStatus {
  if (!status.healthy) return status
  const proxyBaseUrl = `${runtimeBaseUrl.replace(/\/+$/, '')}/plm/proxy`
  return {
    ...status,
    baseUrl: proxyBaseUrl,
    apiBaseUrl: `${proxyBaseUrl}/api/v1`,
    url: proxyBaseUrl,
  }
}

function markPlotPilotSidecarStatus(status: PlotPilotNativeRuntimeStatus): void {
  setDramaReadySignal('dramaSidecarReady', status.healthy === true ? 'ready' : status.state ?? 'blocked')
  if (status.healthy !== true) return
  markProductPath('sidecar-ready', {
    surface: 'plm',
    state: status.state ?? 'ready',
    detail: {
      port: status.port,
      pid: status.pid,
      adopted: status.adopted,
      owned: status.owned,
      baseUrl: status.baseUrl,
    },
  })
}

function useStyleReadiness() {
  const cssProbeRef = React.useRef<HTMLDivElement>(null)
  const tailwindProbeRef = React.useRef<HTMLDivElement>(null)
  const [styleReadiness, setStyleReadiness] = React.useState<StyleReadiness>('checking')

  React.useLayoutEffect(() => {
    let disposed = false
    let retryTimer = 0

    const check = () => {
      if (disposed) return
      const cssProbe = cssProbeRef.current
      const tailwindProbe = tailwindProbeRef.current
      if (!cssProbe || !tailwindProbe) {
        setStyleReadiness('missing')
        return
      }

      const cssReady = window.getComputedStyle(cssProbe).getPropertyValue('--drama-css-ready').trim() === 'ready'
      const tailwindReady = window.getComputedStyle(tailwindProbe).display === 'flex'
      const ready = cssReady && tailwindReady
      document.documentElement.dataset.dramaStyles = ready ? 'ready' : 'missing'
      setStyleReadiness(ready ? 'ready' : 'missing')
    }

    check()
    retryTimer = window.setTimeout(check, 120)

    return () => {
      disposed = true
      window.clearTimeout(retryTimer)
    }
  }, [])

  return { cssProbeRef, tailwindProbeRef, styleReadiness }
}

function StyleReadinessProbes({
  cssProbeRef,
  tailwindProbeRef,
}: {
  cssProbeRef: React.RefObject<HTMLDivElement>
  tailwindProbeRef: React.RefObject<HTMLDivElement>
}) {
  const probeStyle: React.CSSProperties = {
    position: 'fixed',
    left: -10000,
    top: -10000,
    width: 1,
    height: 1,
    opacity: 0,
    pointerEvents: 'none',
  }

  return (
    <>
      <div ref={cssProbeRef} className="drama-css-probe" style={probeStyle} aria-hidden="true" />
      <div ref={tailwindProbeRef} className="drama-tailwind-probe flex" style={probeStyle} aria-hidden="true" />
    </>
  )
}

function StyleFailurePanel({ state }: { state: StyleReadiness }) {
  const isChecking = state === 'checking'
  return (
    <main className="drama-critical-fallback" data-drama-style-state={state}>
      <section className="drama-critical-card" role="status" aria-live="polite">
        <div className="drama-critical-mark">D</div>
        <div className="drama-critical-copy">
          <p className="drama-critical-kicker">{PRODUCT_NAME}</p>
          <h1>{isChecking ? '正在校验工作台样式' : '工作台样式未完整加载'}</h1>
          <p>
            {isChecking
              ? '正在确认 Drama/Warp 样式和 Tailwind 原子类是否已加载。'
              : '为避免显示默认 HTML 或裸组件，Drama 已停止渲染当前页面。请刷新或重新构建 browser shell。'}
          </p>
          {!isChecking ? (
            <button type="button" onClick={() => window.location.reload()} className="drama-critical-button">
              重新加载
            </button>
          ) : null}
        </div>
      </section>
    </main>
  )
}

function RuntimeChip({
  status,
  stateLabel,
}: {
  status: DramaRuntimeStatus
  stateLabel: string
}) {
  const toneByState: Record<DramaRuntimeStatus['state'], StatusTone> = {
    starting: 'info',
    ready: 'success',
    error: 'danger',
    offline: 'danger',
  }
  return (
    <StatusBadge
      className={['drama-runtime-chip', `runtime-status-${status.state}`].join(' ')}
      tone={toneByState[status.state] ?? 'neutral'}
      dot
      role="status"
      aria-live="polite"
      title={status.message}
    >
      <span>{stateLabel}</span>
    </StatusBadge>
  )
}

function surfaceClassificationLabel(result: DramaPlmSurfaceClassificationResult): string {
  if (result.classification === 'product-zen-panel') return 'Zen panel'
  if (result.classification === 'dev-localhost') return 'dev-localhost'
  if (result.classification === 'legacy-electron') return 'legacy'
  return 'fallback'
}

function surfaceClassificationTone(result: DramaPlmSurfaceClassificationResult): StatusTone {
  if (result.classification === 'product-zen-panel') return 'success'
  if (result.classification === 'dev-localhost') return 'warning'
  if (result.classification === 'legacy-electron') return 'neutral'
  return 'warning'
}

function createShellReadinessTiers(
  surfaceClassification: DramaPlmSurfaceClassificationResult,
  runtimeStatus: DramaRuntimeStatus,
): DramaPlmReadinessStatus[] {
  return [
    {
      tier: 'shell-ready',
      state: surfaceClassification.productPath ? 'ready' : 'blocked',
      message: surfaceClassification.productPath
        ? 'Loaded from Zen chrome-resource PLM panel.'
        : surfaceClassification.reason,
    },
    {
      tier: 'runtime-ready',
      state: runtimeStatus.state === 'ready' ? 'ready' : runtimeStatus.state === 'starting' ? 'pending' : 'blocked',
      message: runtimeStatus.message ?? `Drama runtime is ${runtimeStatus.state}.`,
    },
  ]
}

function toPlmIntegrationStatus(
  surfaceClassification: DramaPlmSurfaceClassificationResult,
  runtimeStatus: DramaRuntimeStatus,
): PlotPilotIntegrationStatus {
  const runtimeReady = runtimeStatus.state === 'ready'
  return {
    surface: surfaceClassification.classification,
    productPath: surfaceClassification.productPath,
    currentUrl: surfaceClassification.currentUrl,
    reason: surfaceClassification.reason,
    tiers: createShellReadinessTiers(surfaceClassification, runtimeStatus),
    parityChecks: [
      {
        id: 'prompt-registry-writes',
        label: 'Prompt registry writes',
        state: runtimeReady ? 'partial' : 'blocked',
        detail: runtimeReady
          ? 'PlotPilot Prompt Plaza write API is available through the PLM bridge; save a prompt card to produce write evidence.'
          : 'Waiting for Drama runtime and PlotPilot sidecar.',
        evidence: 'PUT/POST /llm-control/prompts',
      },
      {
        id: 'post-chapter-memory-sync',
        label: 'Post-chapter memory sync',
        state: 'blocked',
        detail: 'Chapter save/writeback must refresh Knowledge Graph evidence before this parity check is ready.',
      },
      {
        id: 'agentos-crew-parity',
        label: 'AgentOS / Crew parity',
        state: 'partial',
        detail: 'Crew surface and Graph event writes are visible; full PlotPilot AgentOS parity remains open.',
        evidence: 'Crew runtime preview',
      },
      {
        id: 'advanced-graph-canvas-parity',
        label: 'Advanced Graph canvas',
        state: 'partial',
        detail: 'Drama Graph restores canvas, minimap, and inspector; advanced PlotPilot canvas affordances remain open.',
        evidence: 'React Flow canvas + minimap + inspector',
      },
    ],
    parityGaps: [
      'Prompt registry writes',
      'Post-chapter memory sync',
      'AgentOS / Crew parity',
      'Advanced Graph canvas',
    ],
  }
}

function findReadinessTier(status: PlotPilotIntegrationStatus, tier: string) {
  return status.tiers.find((item) => item.tier === tier)
}

function deriveShellState({
  styleReadiness,
  runtimeStatus,
  surface,
  plmIntegrationStatus,
}: {
  styleReadiness: StyleReadiness
  runtimeStatus: DramaRuntimeStatus
  surface: Surface
  plmIntegrationStatus: PlotPilotIntegrationStatus
}): ShellState {
  if (styleReadiness !== 'ready') {
    return {
      id: 'booting-shell',
      label: '工作台启动中',
      message: styleReadiness === 'checking' ? '正在校验 shell 和样式。' : '样式或 token bridge 未完整加载。',
      tone: styleReadiness === 'checking' ? 'info' : 'danger',
    }
  }

  if (surface === 'start') {
    return {
      id: 'runtime-ready',
      label: 'Zen Start ready',
      message: 'Zen Start 启动看板已加载。',
      tone: 'success',
    }
  }

  if (runtimeStatus.state === 'starting') {
    return {
      id: 'runtime-connecting',
      label: '连接 runtime',
      message: runtimeStatus.message ?? '正在连接 Drama standalone runtime。',
      tone: 'info',
    }
  }

  if (runtimeStatus.state === 'offline' || runtimeStatus.state === 'error') {
    return {
      id: 'runtime-unavailable',
      label: 'runtime 不可用',
      message: runtimeStatus.message ?? 'Drama runtime 暂不可用。',
      tone: 'danger',
    }
  }

  if (surface !== 'plm') {
    return {
      id: 'runtime-ready',
      label: 'runtime ready',
      message: 'Drama runtime 已就绪。',
      tone: 'success',
    }
  }

  const sidecar = findReadinessTier(plmIntegrationStatus, 'plm-sidecar-ready')
  if (sidecar?.state === 'pending') {
    return {
      id: 'sidecar-starting',
      label: 'PLM 启动中',
      message: sidecar.message,
      tone: 'info',
    }
  }
  if (sidecar?.state === 'blocked') {
    return {
      id: 'sidecar-unavailable',
      label: 'PLM 不可用',
      message: sidecar.message,
      tone: 'danger',
    }
  }

  const ai = findReadinessTier(plmIntegrationStatus, 'ai-ready')
  if (ai?.state === 'blocked') {
    return {
      id: 'ai-unavailable',
      label: 'AI 不可用',
      message: ai.message,
      tone: 'warning',
    }
  }

  const workflow = findReadinessTier(plmIntegrationStatus, 'workflow-preview-ready')
  if (workflow?.state === 'blocked') {
    return {
      id: 'workspace-missing',
      label: '工作区缺失',
      message: workflow.message,
      tone: 'warning',
    }
  }

  const parity = findReadinessTier(plmIntegrationStatus, 'plotpilot-parity-ready')
  if (parity?.state === 'blocked') {
    return {
      id: 'parity-blocked',
      label: 'Parity blocked',
      message: parity.message,
      tone: 'warning',
    }
  }

  return {
    id: 'sidecar-ready',
    label: 'PLM ready',
    message: sidecar?.message ?? 'PlotPilot sidecar 已就绪。',
    tone: 'success',
  }
}

function DramaRuntimeRecoveryPanel({
  status,
}: {
  status: DramaRuntimeStatus
}) {
  const stateLabel = status.state === 'error' ? 'error' : 'offline'
  return (
    <section className="drama-runtime-recovery" role="status" aria-live="polite">
      <div className="drama-runtime-recovery-card">
        <div className="drama-runtime-recovery-mark" aria-hidden="true">D</div>
        <div className="drama-runtime-recovery-copy">
          <p className="drama-runtime-recovery-kicker">Drama Runtime</p>
          <h1>后台运行时未就绪</h1>
          <p>
            Drama 工作台已经作为 Zen 内部资源加载，但本地 runtime 暂时不可用。请重新加载面板，或重新双击桌面 Drama 启动完整应用。
          </p>
          <div className="drama-runtime-recovery-state">
            <span>{stateLabel}</span>
            <strong>{status.updatedAt ? new Date(status.updatedAt).toLocaleTimeString() : 'pending'}</strong>
          </div>
          <button type="button" className="drama-runtime-recovery-button" onClick={() => window.location.reload()}>
            <RotateCcw className="drama-runtime-recovery-button-icon" />
            重新加载
          </button>
        </div>
      </div>
    </section>
  )
}

function SurfaceButton({
  item,
  active,
  onClick,
}: {
  item: SurfaceDescriptor
  active: boolean
  onClick: () => void
}) {
  const Icon = item.Icon
  return (
    <WorkbenchToolButton
      onClick={onClick}
      active={active}
      data-drama-surface-button={item.id}
      title={`${item.title} - ${item.subtitle}`}
      label={item.title}
      icon={<Icon className="drama-workbench-tool-button-svg" />}
    />
  )
}

function SkinSwitcher({
  skins,
  activeSkinId,
  onSkinChange,
}: {
  skins: DramaSkin[]
  activeSkinId: DramaSkinId
  onSkinChange: (skinId: DramaSkinId) => void
}) {
  const activeSkin = skins.find((skin) => skin.id === activeSkinId) ?? skins[0]

  return (
    <label className="drama-skin-control" title={activeSkin?.description ?? 'Drama skin'}>
      <Palette className="drama-skin-control-icon" aria-hidden="true" />
      <span className="drama-skin-control-label">Skin</span>
      <select
        className="drama-skin-select"
        aria-label="Drama skin"
        value={activeSkinId}
        onChange={(event) => onSkinChange(resolveDramaSkinId(event.currentTarget.value))}
      >
        {skins.map((skin) => (
          <option key={skin.id} value={skin.id}>
            {skin.shortLabel}
          </option>
        ))}
      </select>
    </label>
  )
}

function DramaWorkbenchShell({
  surface,
  surfaces,
  skins,
  activeSurface,
  activeSkinId,
  zenHost,
  dataHost,
  hostKind,
  hostBadgeLabel,
  surfaceClassification,
  runtimeStatus,
  runtimeStateLabel,
  shellState,
  onSwitchSurface,
  onSkinChange,
  children,
}: {
  surface: Surface
  surfaces: SurfaceDescriptor[]
  skins: DramaSkin[]
  activeSurface: SurfaceDescriptor
  activeSkinId: DramaSkinId
  zenHost: boolean
  dataHost: string
  hostKind: string
  hostBadgeLabel: string
  surfaceClassification: DramaPlmSurfaceClassificationResult
  runtimeStatus: DramaRuntimeStatus
  runtimeStateLabel: string
  shellState: ShellState
  onSwitchSurface: (surface: Surface) => void
  onSkinChange: (skinId: DramaSkinId) => void
  children: React.ReactNode
}) {
  const surfaceIcon = activeSurface.Icon
  const ShellSurfaceIcon = surfaceIcon

  return (
    <div
      className={['drama-shell', zenHost ? 'zen-host' : ''].filter(Boolean).join(' ')}
      data-drama-shell="workbench"
      data-drama-shell-state={shellState.id}
      data-drama-active-skin={activeSkinId}
      data-host={dataHost}
    >
      {!zenHost ? (
        <aside className="drama-sidebar">
          <div className="drama-sidebar-brand">
            <div className="drama-mark" aria-hidden="true">D</div>
            <div>
              <div className="drama-sidebar-kicker">Drama</div>
              <div className="drama-sidebar-title">Workspace</div>
            </div>
          </div>

          <nav className="drama-sidebar-nav" aria-label="Drama surfaces">
            {surfaces.map((item) => (
              <SurfaceButton
                key={item.id}
                item={item}
                active={surface === item.id}
                onClick={() => onSwitchSurface(item.id)}
              />
            ))}
          </nav>

          <div className="drama-sidebar-status">
            <span className={['runtime-status-dot', `runtime-status-dot-${runtimeStatus.state}`].join(' ')} />
            <span>{hostKind}</span>
          </div>
        </aside>
      ) : null}

      <main className="drama-main" data-drama-surface={surface}>
        <header className="drama-workbench-bar">
          <div className="drama-workbench-left">
            {zenHost ? <div className="drama-mark drama-mark-inline" aria-hidden="true">D</div> : null}
            <nav className="drama-tool-switcher" aria-label="Drama workspace surfaces">
              {surfaces.map((item) => (
                <SurfaceButton
                  key={item.id}
                  item={item}
                  active={surface === item.id}
                  onClick={() => onSwitchSurface(item.id)}
                />
              ))}
            </nav>
          </div>

          <div className="drama-surface-title">
            <span className="drama-surface-title-icon" aria-hidden="true">
              <ShellSurfaceIcon />
            </span>
            <span className="drama-surface-title-copy">
              <span className="drama-surface-title-primary">{PRODUCT_NAME}</span>
              <span className="drama-surface-title-secondary">{activeSurface.title}</span>
            </span>
            <span className="drama-mode-pill" title={activeSurface.source}>{activeSurface.subtitle}</span>
          </div>

          <div className="drama-workbench-meta">
            <SkinSwitcher
              skins={skins}
              activeSkinId={activeSkinId}
              onSkinChange={onSkinChange}
            />
            <StatusBadge
              className="drama-surface-classification-badge"
              tone={surfaceClassificationTone(surfaceClassification)}
              title={surfaceClassification.reason}
            >
              {surfaceClassificationLabel(surfaceClassification)}
            </StatusBadge>
            <span className="drama-host-badge">{hostBadgeLabel}</span>
            <RuntimeChip status={runtimeStatus} stateLabel={runtimeStateLabel} />
            <StatusBadge
              className="drama-shell-state-badge"
              tone={shellState.tone}
              dot
              title={shellState.message}
            >
              {shellState.label}
            </StatusBadge>
          </div>
        </header>

        <section className="drama-surface-frame" data-surface={surface}>
          {surface !== 'start' && (runtimeStatus.state === 'offline' || runtimeStatus.state === 'error') ? (
            <DramaRuntimeRecoveryPanel status={runtimeStatus} />
          ) : children}
        </section>
      </main>
    </div>
  )
}

export function App() {
  const [surface, setSurface] = React.useState<Surface>(getInitialSurface)
  const [hostAdapter, setHostAdapter] = React.useState(resolveDramaBrowserHostAdapter)
  const zenHost = hostAdapter.id === 'zen'
  const [activeSkinId, setActiveSkinId] = React.useState<DramaSkinId>(() => (
    getInitialDramaSkinId(resolveDramaBrowserHostAdapter().defaultSkinId)
  ))
  React.useLayoutEffect(() => {
    applyDramaSkin(activeSkinId)
    persistDramaSkinId(activeSkinId)
    setDramaReadySignal('dramaActiveSkin', activeSkinId)
  }, [activeSkinId])
  const { cssProbeRef, tailwindProbeRef, styleReadiness } = useStyleReadiness()
  const runtimeBaseUrl = React.useMemo(getRuntimeBaseUrl, [])
  const runtimeClient = React.useMemo(() => createDramaRuntimeClient({ baseUrl: runtimeBaseUrl }), [runtimeBaseUrl])
  const [runtimeStatus, setRuntimeStatus] = React.useState<DramaRuntimeStatus>({
    state: 'starting',
    message: 'Connecting to Drama standalone runtime.',
    updatedAt: new Date().toISOString(),
  })
  const [resolvedPlmIntegrationStatus, setResolvedPlmIntegrationStatus] = React.useState<PlotPilotIntegrationStatus | undefined>()
  const [crewWriteStatus, setCrewWriteStatus] = React.useState<string>('尚未写入 runtime')
  const browserHost = React.useMemo(() => hostAdapter.createHostApi({ runtimeBaseUrl }), [hostAdapter, runtimeBaseUrl])
  const graphApi = React.useMemo(() => createRuntimeBackedGraphApi({
    runtime: runtimeClient,
    fallback: fallbackGraphApi,
    onRuntimeStatus: setRuntimeStatus,
  }), [runtimeClient])
  const plmApi = React.useMemo<PlotPilotNativeApi>(() => ({
    async getPlotPilotRuntimeLogs() {
      return runtimeClient.request('plotpilot:runtime:logs', { limit: 80 })
    },
    async getPlotPilotRuntimeStatus() {
      const status = withRuntimeProxyBaseUrl(
        await runtimeClient.request('plotpilot:runtime:status', { checkHealth: true }),
        runtimeBaseUrl,
      )
      markPlotPilotSidecarStatus(status)
      return status
    },
    async startPlotPilotRuntime() {
      const status = withRuntimeProxyBaseUrl(
        await runtimeClient.request('plotpilot:runtime:start', { preferExisting: true }),
        runtimeBaseUrl,
      )
      markPlotPilotSidecarStatus(status)
      return status
    },
    async restartPlotPilotRuntime() {
      const status = withRuntimeProxyBaseUrl(
        await runtimeClient.request('plotpilot:runtime:restart', { preferExisting: false }),
        runtimeBaseUrl,
      )
      markPlotPilotSidecarStatus(status)
      return status
    },
    async openUrl(url: string) {
      await browserHost.shell.openUrl(url)
    },
    recordDramaProjectFile(request) {
      return runtimeClient.request('drama:projectFile:record', request)
    },
    listDramaProjectFiles(request) {
      return runtimeClient.request('drama:projectFile:list', request)
    },
    loadDramaGraph() {
      return runtimeClient.request('drama:graph:load', { importStoryletIfMissing: false })
    },
    upsertDramaGraphDraft(request) {
      return runtimeClient.request('drama:graph:upsertDraft', request)
    },
    recordDramaGraphEvent(request) {
      return runtimeClient.request('drama:graph:recordEvent', request)
    },
    async loadStoryletBridgeSnapshot() {
      throw new Error('Storylet JSON compatibility import is not available in the Zen/browser host. Use Drama Graph as the primary source.')
    },
    async writeStoryletChapterFromPlotPilot() {
      throw new Error('Storylet JSON compatibility writeback is disabled in the Zen/browser host. Drama Graph writeback remains enabled.')
    },
  }), [browserHost, runtimeBaseUrl, runtimeClient])
  const crewRoom = inferSkillCrewRoomId({
    slug: 'screenplay-director',
    path: 'C:/Users/gengr/.codex/skills/screenplay-director',
    metadata: {
      name: '导演控场',
      description: 'screenplay graph state director',
    },
  })
  const crewSuggestion = {
    nodeId: 'chapter-runtime',
    agentId: 'screenplay-director',
    title: '章节节奏建议',
    body: '第 1 章应先建立开源黄金年代，再进入 AgentOS 的状态机工作台。',
    patch: {
      fields: [{ key: 'pacing', text: '先历史叙事，再技术转场' }],
    },
  }
  const crewEvent = createSkillCrewSuggestionEvent(crewSuggestion)
  const crewAgentOutputEvent = createSkillCrewAgentOutputEvent({
    nodeId: 'chapter-runtime',
    agentId: 'screenplay-director',
    roomId: crewRoom,
    title: '导演控场输出',
    body: crewSuggestion.body,
    outputType: 'proposal',
    artifacts: [
      {
        type: 'graph.patch',
        patch: crewSuggestion.patch,
      },
    ],
  })
  const crewChannels = [
    { label: '现压', count: 0, tone: 'muted' },
    { label: '待办', count: 0, tone: 'muted' },
    { label: '待审查', count: 3, tone: 'warn' },
    { label: '完成', count: 1, tone: 'done' },
  ]
  const crewAgents = [
    { id: '@screenplay-director', label: '导演控场', detail: '读取当前 graph state，拆解章节节奏', Icon: Bot, active: true },
    { id: '@story-state', label: '状态机记录', detail: '把 agent 输出写入 graph event', Icon: GitBranch, active: false },
    { id: '@continuity-reader', label: '连续性读者', detail: '检查人物、伏笔和章节断链', Icon: ShieldCheck, active: false },
    { id: '@plm-bridge', label: 'PLM 桥接', detail: '把章节建议同步到长上下文生成', Icon: ScrollText, active: false },
  ]
  const crewMoments = [
    {
      id: 'moment-director',
      agent: '@screenplay-director',
      time: 'runtime',
      level: 'high',
      visibility: '公开',
      title: crewSuggestion.title,
      body: crewSuggestion.body,
      source: 'drama.graph.current_state',
      chips: ['graph event', 'chapter-runtime', 'pacing'],
      patchLabel: crewSuggestion.patch.fields[0]?.text ?? 'pending patch',
    },
    {
      id: 'moment-state',
      agent: '@story-state',
      time: 'queued',
      level: 'medium',
      visibility: '内部',
      title: '状态机缺口',
      body: 'Graph 里已有章节与人物节点，但 Crew 输出需要优先绑定到 chapter_next_gap，避免散文本漂在面板里。',
      source: 'drama.graph.diagnostics',
      chips: ['state machine', 'binding', 'diagnostics'],
      patchLabel: '新增 crew.taskBinding.upserted 事件',
    },
  ]
  const crewDirectorQueue = [
    { state: '完成', label: '读取当前 Drama Graph', Icon: CheckCircle2 },
    { state: '风险', label: '章节链 next 仍有缺口', Icon: TriangleAlert },
    { state: '待审', label: '把建议写回 graph event', Icon: Clock3 },
    { state: '观察', label: '等待 PLM 章节生成状态', Icon: Activity },
  ]
  const activeSurface = surfaces.find((item) => item.id === surface) ?? surfaces[0]!

  React.useEffect(() => {
    normalizeShellLocation(surface)
  }, [surface])

  React.useEffect(() => {
    document.title = surface === 'start' ? PRODUCT_NAME : `${activeSurface.title} - ${PRODUCT_NAME}`
    setDramaReadySignal('dramaShellMounted', 'true')
    setDramaReadySignal('dramaSurface', surface)
    setDramaReadySignal('dramaHost', zenHost ? 'zen' : 'browser')
  }, [activeSurface.title, surface, zenHost])

  React.useEffect(() => {
    const handlePopState = () => {
      const nextHostAdapter = resolveDramaBrowserHostAdapter()
      setSurface(getInitialSurface())
      setHostAdapter(nextHostAdapter)
      setActiveSkinId(getInitialDramaSkinId(nextHostAdapter.defaultSkinId))
    }
    globalThis.addEventListener?.('popstate', handlePopState)
    return () => globalThis.removeEventListener?.('popstate', handlePopState)
  }, [])

  React.useEffect(() => {
    let disposed = false
    let interval: ReturnType<typeof globalThis.setInterval> | undefined
    let activeController: AbortController | undefined
    const pollerState = globalThis as typeof globalThis & { __DRAMA_RUNTIME_STATUS_POLLER_COUNT__?: number }
    pollerState.__DRAMA_RUNTIME_STATUS_POLLER_COUNT__ = (pollerState.__DRAMA_RUNTIME_STATUS_POLLER_COUNT__ ?? 0) + 1
    setDramaReadySignal('dramaRuntimePollers', String(pollerState.__DRAMA_RUNTIME_STATUS_POLLER_COUNT__))

    const refresh = async () => {
      activeController?.abort()
      const controller = new AbortController()
      activeController = controller
      try {
        const status = await runtimeClient.getStatus({ signal: controller.signal, timeoutMs: 2_000 })
        if (!disposed) {
          setRuntimeStatus(status)
          setDramaReadySignal('dramaRuntimeReady', status.state)
          if (status.state === 'ready') {
            markProductPath('runtime-ready', {
              surface,
              state: status.state,
              detail: {
                runtimeBaseUrl,
                workspaceRoot: (status as DramaRuntimeStatus & { workspaceRoot?: string }).workspaceRoot,
              },
            })
          }
        }
      } catch (error) {
        const cancelled = error instanceof Error && error.message.includes('cancelled')
        if (!disposed) {
          if (cancelled) return
          setRuntimeStatus(offlineRuntimeStatus(error instanceof Error ? error.message : String(error)))
          setDramaReadySignal('dramaRuntimeReady', 'offline')
        }
      }
    }

    void refresh()
    interval = globalThis.setInterval(refresh, 5000)
    return () => {
      disposed = true
      activeController?.abort()
      pollerState.__DRAMA_RUNTIME_STATUS_POLLER_COUNT__ = Math.max(0, (pollerState.__DRAMA_RUNTIME_STATUS_POLLER_COUNT__ ?? 1) - 1)
      setDramaReadySignal('dramaRuntimePollers', String(pollerState.__DRAMA_RUNTIME_STATUS_POLLER_COUNT__))
      if (interval !== undefined) globalThis.clearInterval(interval)
    }
  }, [crewRoom, runtimeBaseUrl, runtimeClient, surface])

  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      hostAdapter.applyThemeMessage(event.data)
    }
    globalThis.addEventListener?.('message', handleMessage)
    return () => globalThis.removeEventListener?.('message', handleMessage)
  }, [hostAdapter])

  const switchSurface = React.useCallback((next: Surface) => {
    setSurface(next)
    const params = new URLSearchParams()
    hostAdapter.appendRouteParams(params, { runtimeBaseUrl, defaultRuntimeBaseUrl: 'http://127.0.0.1:3198' })
    if (isInternalChromeShell()) params.set('surface', next)
    const search = params.toString() ? `?${params.toString()}` : ''
    const nextUrl = isInternalChromeShell()
      ? `${getShellBasePath()}${search}`
      : `${getShellBasePath()}/${next}${search}`
    globalThis.history?.pushState?.({}, '', nextUrl)
  }, [hostAdapter, runtimeBaseUrl])

  const writeCrewSuggestion = React.useCallback(() => {
    void (async () => {
      try {
        await runtimeClient.request('drama:crew:suggestionCreate', {
          nodeId: 'story-thesis',
          agentId: 'screenplay-director',
          title: '章节节奏建议',
          body: '第 1 章应先建立开源黄金年代，再进入 AgentOS 的状态机工作台。',
          patch: {
            fields: [{ key: 'pacing', text: '先历史叙事，再技术转场' }],
          },
        })
        await runtimeClient.request('drama:crew:agentOutputRecord', {
          nodeId: 'story-thesis',
          agentId: 'screenplay-director',
          roomId: crewRoom,
          title: '导演控场输出',
          body: '第 1 章应先建立开源黄金年代，再进入 AgentOS 的状态机工作台。',
          outputType: 'proposal',
          artifacts: [
            {
              type: 'graph.patch',
              patch: {
                fields: [{ key: 'pacing', text: '先历史叙事，再技术转场' }],
              },
            },
          ],
        })
        setCrewWriteStatus(`已写入 ${new Date().toLocaleTimeString()}`)
      } catch (error) {
        setCrewWriteStatus(`写入失败：${error instanceof Error ? error.message : String(error)}`)
      }
    })()
  }, [runtimeClient])

  const runtimeStateLabel = runtimeStatus.state === 'ready' ? 'ready' : runtimeStatus.state
  const hostKind = browserHost.getInfo().kind
  const hostBadgeLabel = hostAdapter.displayBadge(hostKind)
  const surfaceClassification = React.useMemo(() => classifyDramaPlmSurface({
    url: currentDocumentUrl(),
    hostKind,
    userAgent: browserHost.getInfo().userAgent,
    expectedSurface: surface,
  }), [hostKind, surface])
  const plmIntegrationStatus = React.useMemo(
    () => toPlmIntegrationStatus(surfaceClassification, runtimeStatus),
    [runtimeStatus, surfaceClassification],
  )
  const effectivePlmIntegrationStatus = resolvedPlmIntegrationStatus ?? plmIntegrationStatus
  const productionFixture = React.useMemo(() => shouldBootstrapPlmProductionFixture(), [])
  const shellState = React.useMemo(
    () => deriveShellState({
      styleReadiness,
      runtimeStatus,
      surface,
      plmIntegrationStatus: effectivePlmIntegrationStatus,
    }),
    [effectivePlmIntegrationStatus, runtimeStatus, styleReadiness, surface],
  )
  const handlePlmIntegrationStatusChange = React.useCallback((status: PlotPilotIntegrationStatus | undefined) => {
    setResolvedPlmIntegrationStatus(status)
  }, [])

  const probes = (
    <StyleReadinessProbes
      cssProbeRef={cssProbeRef}
      tailwindProbeRef={tailwindProbeRef}
    />
  )

  React.useEffect(() => {
    setDramaReadySignal('dramaShellState', shellState.id)
  }, [shellState.id])

  React.useEffect(() => {
    if (styleReadiness !== 'ready') return
    setDramaReadySignal('dramaFirstStyledViewport', 'ready')
    markProductPath('first-styled-viewport', {
      surface,
      state: 'ready',
      detail: {
        activeSkinId,
      },
    })
    markProductPath('route-ready', {
      surface,
      state: 'ready',
      detail: {
        hostKind,
        productPath: surfaceClassification.productPath,
        activeSkinId,
      },
    }, { once: false })
  }, [activeSkinId, hostKind, shellState.id, styleReadiness, surface, surfaceClassification.productPath])

  if (styleReadiness !== 'ready') {
    return (
      <>
        {probes}
        <StyleFailurePanel state={styleReadiness} />
      </>
    )
  }

  return (
    <>
      {probes}
      <DramaWorkbenchShell
        surface={surface}
        surfaces={surfaces}
        skins={DRAMA_SKINS}
        activeSurface={activeSurface}
        activeSkinId={activeSkinId}
        zenHost={zenHost}
        dataHost={hostAdapter.dataHost}
        hostKind={hostKind}
        hostBadgeLabel={hostBadgeLabel}
        surfaceClassification={surfaceClassification}
        runtimeStatus={runtimeStatus}
        runtimeStateLabel={runtimeStateLabel}
        shellState={shellState}
        onSwitchSurface={switchSurface}
        onSkinChange={setActiveSkinId}
      >
        {surface === 'start' ? (
          <ZenStartSurface />
        ) : null}

        {surface === 'graph' ? (
          <StoryletNativeGraphContainer
            tool={{
              title: 'Drama Graph',
              url: `${runtimeBaseUrl}/app/graph`,
            }}
            api={graphApi}
            onOpenPlmChapter={() => {
              switchSurface('plm')
            }}
          />
        ) : null}

        {surface === 'plm' ? (
          <PlotPilotNativeContainer
            api={plmApi}
            integrationStatus={plmIntegrationStatus}
            onIntegrationStatusChange={handlePlmIntegrationStatusChange}
            productionFixture={productionFixture}
          />
        ) : null}

        {surface === 'memory' ? (
          <BasicMemorySurface runtime={runtimeClient} />
        ) : null}

        {surface === 'crew' ? (
          <section className="drama-crew-surface">
            <aside className="drama-crew-rail" aria-label="Skill Crew navigation">
              <Button variant="outline" size="sm" className="drama-crew-new-chat">
                <MessageSquareText className="drama-crew-inline-icon" />
                新建会话
              </Button>

              <div className="drama-crew-nav-block">
                <div className="drama-panel-kicker">所有会话</div>
                <div className="drama-crew-channel-list">
                  {crewChannels.map((item) => (
                    <button key={item.label} type="button" className="drama-crew-channel" data-tone={item.tone}>
                      <span>{item.label}</span>
                      <strong>{item.count}</strong>
                    </button>
                  ))}
                </div>
              </div>

              <div className="drama-crew-nav-block">
                <div className="drama-panel-kicker">数据源</div>
                <div className="drama-crew-source-row">
                  <Database className="drama-crew-inline-icon" />
                  <span>Drama Graph</span>
                </div>
                <div className="drama-crew-source-row">
                  <FolderOpen className="drama-crew-inline-icon" />
                  <span>.drama / graph-events</span>
                </div>
              </div>

              <div className="drama-crew-nav-block drama-crew-tree-block">
                <div className="drama-panel-kicker">Crew Tree</div>
                <div className="drama-crew-room">{crewRoom}</div>
                <div className="drama-crew-agent-list">
                  {crewAgents.map((agent) => {
                    const AgentIcon = agent.Icon
                    return (
                      <button key={agent.id} type="button" className="drama-crew-agent-card" data-active={agent.active ? 'true' : 'false'}>
                        <AgentIcon className="drama-crew-agent-icon" />
                        <span>
                          <span className="drama-crew-agent-name">{agent.id}</span>
                          <span className="drama-crew-agent-detail">{agent.detail}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </aside>

            <main className="drama-crew-stage" aria-label="Skill Crew moment feed">
              <header className="drama-crew-stage-header">
                <div className="drama-crew-room-title">
                  <span>#screenplay</span>
                  <small>导演控场 / graph state room</small>
                </div>
                <div className="drama-crew-stage-actions">
                  <Button variant="outline" size="sm" className="drama-crew-ghost-button">
                    <Radio className="drama-crew-inline-icon" />
                    导演控场
                  </Button>
                  <Button size="sm" onClick={writeCrewSuggestion} className="drama-primary-button">
                    <GitBranch className="drama-crew-inline-icon" />
                    写入 Event
                  </Button>
                </div>
              </header>

              <nav className="drama-crew-tabs" aria-label="Crew views">
                <Button variant="ghost" size="xs">聊天</Button>
                <Button variant="ghost" size="xs" data-active="true">朋友圈</Button>
                <Button variant="ghost" size="xs">AgentOS</Button>
              </nav>

              <div className="drama-crew-feed">
                {crewMoments.map((moment) => (
                  <article key={moment.id} className="drama-crew-event-card" data-level={moment.level}>
                    <div className="drama-crew-event-avatar">
                      <Bot className="drama-crew-inline-icon" />
                    </div>
                    <div className="drama-crew-event-body">
                      <div className="drama-crew-event-header">
                        <span>{moment.agent}</span>
                        <span>{moment.time}</span>
                        <span className="drama-crew-event-chip">{moment.visibility}</span>
                      </div>
                      <h3>{moment.title}</h3>
                      <p>{moment.body}</p>
                      <div className="drama-crew-source-pill">
                        <Network className="drama-crew-inline-icon" />
                        {moment.source}
                      </div>
                      <div className="drama-crew-event-patch">
                        <div className="drama-crew-event-field">
                          <span>graph patch</span>
                          <strong>{moment.patchLabel}</strong>
                        </div>
                      </div>
                      <div className="drama-crew-chip-row">
                        {moment.chips.map((chip) => <span key={chip}>{chip}</span>)}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </main>

            <aside className="drama-crew-control" aria-label="Director control panel">
              <section className="drama-crew-control-card">
                <div className="drama-crew-control-title">
                  <Radio className="drama-crew-inline-icon" />
                  <span>AgentOS 状态</span>
                  <StatusBadge
                    tone={runtimeStatus.state === 'ready' ? 'success' : runtimeStatus.state === 'starting' ? 'info' : 'danger'}
                    dot
                    title={runtimeStatus.message}
                  >
                    {runtimeStateLabel}
                  </StatusBadge>
                </div>
                <div className="drama-crew-control-subtitle">{crewWriteStatus}</div>
                <div className="drama-crew-director-list">
                  {crewDirectorQueue.map((item) => {
                    const ItemIcon = item.Icon
                    return (
                      <div key={item.label} className="drama-crew-director-item" data-state={item.state}>
                        <ItemIcon className="drama-crew-inline-icon" />
                        <span>{item.state}</span>
                        <strong>{item.label}</strong>
                      </div>
                    )
                  })}
                </div>
              </section>

              <section className="drama-crew-control-card drama-crew-panel-code">
                <div className="drama-crew-control-title">
                  <ListChecks className="drama-crew-inline-icon" />
                  <span>Graph Event Trace</span>
                </div>
                <div className="drama-crew-trace-actions">
                  <RefreshCw className="drama-crew-trace-icon" />
                  <span>structured event preview</span>
                </div>
                <pre>{JSON.stringify({ suggestion: crewEvent, agentOutput: crewAgentOutputEvent }, null, 2)}</pre>
              </section>
            </aside>
          </section>
        ) : null}
      </DramaWorkbenchShell>
    </>
  )
}
