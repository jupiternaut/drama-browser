import * as React from 'react'
import { AlertTriangle, ExternalLink, Loader2, RotateCw, Terminal } from 'lucide-react'

import { PanelHeader } from '@/components/app-shell/PanelHeader'
import { HeaderIconButton } from '@/components/ui/HeaderIconButton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { WorkspaceTool } from './workspace-tools'

const IFRAME_SANDBOX = 'allow-scripts allow-forms allow-popups allow-downloads allow-modals allow-same-origin'
const SERVICE_CHECK_TIMEOUT_MS = 5000
const FRAME_SLOW_TIMEOUT_MS = 12000

type ProjectionFrameState = 'checking' | 'loading' | 'ready' | 'slow' | 'offline'

const frameStateMeta: Record<ProjectionFrameState, { label: string; dotClassName: string; overlayLabel: string }> = {
  checking: {
    label: '检测',
    dotClassName: 'bg-muted-foreground/60',
    overlayLabel: '检查本地服务',
  },
  loading: {
    label: '加载',
    dotClassName: 'bg-muted-foreground/60',
    overlayLabel: '加载投影视图',
  },
  ready: {
    label: '就绪',
    dotClassName: 'bg-success',
    overlayLabel: '投影视图已就绪',
  },
  slow: {
    label: '等待',
    dotClassName: 'bg-info',
    overlayLabel: '等待本地服务响应',
  },
  offline: {
    label: '离线',
    dotClassName: 'bg-destructive',
    overlayLabel: '本地服务未响应',
  },
}

export interface ProjectionHostProps {
  tool: WorkspaceTool
}

export function ProjectionHost({ tool }: ProjectionHostProps) {
  const [reloadKey, setReloadKey] = React.useState(0)
  const [frameState, setFrameState] = React.useState<ProjectionFrameState>('checking')
  const [frameError, setFrameError] = React.useState<string | null>(null)
  const [shouldRenderFrame, setShouldRenderFrame] = React.useState(false)

  const frameSrc = tool.embedUrl ?? tool.url
  const externalUrl = tool.externalUrl ?? tool.url
  const healthUrl = tool.healthUrl ?? tool.url
  const isCanvasProjection = tool.id === 'storylet'

  const handleRefresh = React.useCallback(() => {
    setFrameState('checking')
    setFrameError(null)
    setShouldRenderFrame(false)
    setReloadKey((current) => current + 1)
  }, [])

  const handleOpenExternal = React.useCallback(() => {
    void window.electronAPI.openUrl(externalUrl)
  }, [externalUrl])

  React.useEffect(() => {
    let disposed = false
    let slowTimeout: number | undefined
    const controller = new AbortController()

    setFrameState('checking')
    setFrameError(null)
    setShouldRenderFrame(false)

    const checkTimeout = window.setTimeout(() => {
      controller.abort()
    }, SERVICE_CHECK_TIMEOUT_MS)

    void checkLocalService(healthUrl, controller.signal)
      .then(() => {
        if (disposed) return
        window.clearTimeout(checkTimeout)
        setShouldRenderFrame(true)
        setFrameState('loading')
        slowTimeout = window.setTimeout(() => {
          setFrameState((current) => (current === 'loading' ? 'slow' : current))
        }, FRAME_SLOW_TIMEOUT_MS)
      })
      .catch((error: unknown) => {
        if (disposed) return
        window.clearTimeout(checkTimeout)
        setShouldRenderFrame(false)
        setFrameError(getServiceErrorMessage(error))
        setFrameState('offline')
      })

    return () => {
      disposed = true
      controller.abort()
      window.clearTimeout(checkTimeout)
      if (slowTimeout !== undefined) {
        window.clearTimeout(slowTimeout)
      }
    }
  }, [healthUrl, reloadKey, tool.id])

  if (isCanvasProjection) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#07080d]">
        <PanelHeader
          title={tool.title}
          badge={<ProjectionRuntimeBadge state={frameState} />}
          className="border-b border-white/[0.07] bg-[#0b0c12]/95 text-white"
          actions={
            <div className="flex items-center gap-1">
              <HeaderIconButton
                icon={<RotateCw className="size-4" />}
                tooltip="刷新"
                aria-label={`刷新 ${tool.title}`}
                onClick={handleRefresh}
                className="text-white/55 hover:bg-white/[0.08] hover:text-white focus-visible:ring-white/30"
              />
              <HeaderIconButton
                icon={<ExternalLink className="size-4" />}
                tooltip="外部打开"
                aria-label={`外部打开 ${tool.title}`}
                onClick={handleOpenExternal}
                className="text-white/55 hover:bg-white/[0.08] hover:text-white focus-visible:ring-white/30"
              />
            </div>
          }
        />

        <div
          className="relative min-h-0 flex-1 overflow-hidden bg-[#050609]"
          style={{ contain: 'layout paint' }}
        >
          <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.045)_1px,_transparent_1px)] bg-[length:24px_24px]" />
          <CanvasRuntimeRail tool={tool} state={frameState} />

          {frameState === 'offline' ? (
            <ProjectionUnavailableState
              tool={tool}
              error={frameError}
              onRetry={handleRefresh}
              onOpenExternal={handleOpenExternal}
              variant="canvas"
            />
          ) : null}

          {frameState !== 'ready' && frameState !== 'offline' ? (
            <CanvasLoadingOverlay state={frameState} />
          ) : null}

          {shouldRenderFrame ? (
            <iframe
              key={`${tool.id}:${reloadKey}`}
              src={frameSrc}
              title={tool.title}
              className="relative z-[1] block h-full w-full border-0 bg-transparent"
              sandbox={IFRAME_SANDBOX}
              loading="eager"
              referrerPolicy="no-referrer"
              onLoad={() => setFrameState('ready')}
              onError={() => {
                setFrameError('iframe 加载失败')
                setFrameState('offline')
              }}
            />
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <PanelHeader
        title={tool.title}
        badge={<ProjectionRuntimeBadge state={frameState} />}
        actions={
          <div className="flex items-center gap-1">
            <HeaderIconButton
              icon={<RotateCw className="size-4" />}
              tooltip="刷新"
              aria-label={`刷新 ${tool.title}`}
              onClick={handleRefresh}
            />
            <HeaderIconButton
              icon={<ExternalLink className="size-4" />}
              tooltip="外部打开"
              aria-label={`外部打开 ${tool.title}`}
              onClick={handleOpenExternal}
            />
          </div>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col border-t border-border/60 bg-foreground/[0.025]">
        <ProjectionRuntimeStrip tool={tool} />

        <div
          className="relative min-h-0 flex-1 overflow-hidden bg-background"
          style={{ contain: 'layout paint' }}
        >
          {frameState === 'offline' ? (
            <ProjectionUnavailableState
              tool={tool}
              error={frameError}
              onRetry={handleRefresh}
              onOpenExternal={handleOpenExternal}
              variant="default"
            />
          ) : null}

          {frameState !== 'ready' && frameState !== 'offline' ? (
            <ProjectionLoadingOverlay state={frameState} />
          ) : null}

          {shouldRenderFrame ? (
            <iframe
              key={`${tool.id}:${reloadKey}`}
              src={frameSrc}
              title={tool.title}
              className="block h-full w-full border-0 bg-background"
              sandbox={IFRAME_SANDBOX}
              loading="eager"
              referrerPolicy="no-referrer"
              onLoad={() => setFrameState('ready')}
              onError={() => {
                setFrameError('iframe 加载失败')
                setFrameState('offline')
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}

async function checkLocalService(url: string, signal: AbortSignal): Promise<void> {
  const target = new URL(url)
  target.searchParams.set('__drama_probe', String(Date.now()))

  await fetch(target.toString(), {
    method: 'GET',
    mode: 'no-cors',
    cache: 'no-store',
    credentials: 'omit',
    signal,
  })
}

function getServiceErrorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return `检测超时（${SERVICE_CHECK_TIMEOUT_MS / 1000} 秒内没有响应）`
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return '无法连接本地服务'
}

function ProjectionRuntimeBadge({ state }: { state: ProjectionFrameState }) {
  const meta = frameStateMeta[state]

  return (
    <span className="hidden items-center gap-1 rounded-[4px] border border-border/70 bg-foreground/[0.04] px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
      <span className={cn('size-1.5 rounded-full', meta.dotClassName)} />
      {meta.label}
    </span>
  )
}

function ProjectionRuntimeStrip({ tool }: { tool: WorkspaceTool }) {
  return (
    <div className="flex min-h-9 shrink-0 items-center gap-2 border-b border-border/60 px-3 text-xs text-muted-foreground">
      <span className="inline-flex h-5 shrink-0 items-center gap-1 rounded-[4px] border border-border/70 bg-foreground/[0.06] px-1.5 font-mono text-[10px] font-semibold text-foreground/80">
        <span className="size-1.5 rounded-full bg-accent" />
        投影
      </span>
      <span className="min-w-0 truncate text-foreground/75">{tool.role}</span>
      <span className="hidden text-foreground/20 sm:inline">/</span>
      <span className="hidden min-w-0 truncate font-mono text-[11px] sm:inline">
        source: {tool.sourceName}
      </span>
      <span className="hidden text-foreground/20 md:inline">/</span>
      <span className="hidden min-w-0 truncate font-mono text-[11px] md:inline">
        runtime: {tool.endpointLabel}
      </span>
      <span className="ml-auto hidden shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/80 lg:inline">
        {tool.bridge}
      </span>
    </div>
  )
}

function CanvasRuntimeRail({ tool, state }: { tool: WorkspaceTool; state: ProjectionFrameState }) {
  const meta = frameStateMeta[state]

  return (
    <div className="pointer-events-none absolute left-3 top-3 z-10 flex max-w-[calc(100%-1.5rem)] items-center gap-2 overflow-hidden rounded-[6px] border border-white/[0.08] bg-[#0b0d13]/80 px-2 py-1 text-[11px] text-white/62 shadow-strong backdrop-blur">
      <span className="inline-flex h-5 shrink-0 items-center gap-1 rounded-[4px] border border-white/[0.08] bg-white/[0.045] px-1.5 font-mono text-[10px] font-semibold text-white/82">
        <span className={cn('size-1.5 rounded-full', meta.dotClassName)} />
        画布
      </span>
      <span className="min-w-0 truncate text-white/72">{tool.role}</span>
      <span className="text-white/20">/</span>
      <span className="hidden min-w-0 truncate font-mono text-[10px] sm:inline">
        source: {tool.sourceName}
      </span>
      <span className="hidden text-white/20 md:inline">/</span>
      <span className="hidden min-w-0 truncate font-mono text-[10px] md:inline">
        JSON Canvas 基线
      </span>
    </div>
  )
}

function CanvasLoadingOverlay({ state }: { state: ProjectionFrameState }) {
  const meta = frameStateMeta[state]

  return (
    <div className="pointer-events-none absolute left-3 top-12 z-10 inline-flex items-center gap-2 rounded-[6px] border border-white/[0.08] bg-[#0b0d13]/90 px-2.5 py-1.5 text-xs text-white/66 shadow-strong backdrop-blur">
      <Loader2 className={cn('size-3.5', state === 'loading' && 'animate-spin')} />
      <span>{meta.overlayLabel}</span>
    </div>
  )
}

function ProjectionLoadingOverlay({ state }: { state: ProjectionFrameState }) {
  const meta = frameStateMeta[state]

  return (
    <div className="pointer-events-none absolute left-3 top-3 z-local inline-flex items-center gap-2 rounded-[6px] border border-border/70 bg-background/95 px-2.5 py-1.5 text-xs text-muted-foreground shadow-minimal">
      <Loader2 className={cn('size-3.5', state === 'loading' && 'animate-spin')} />
      <span>{meta.overlayLabel}</span>
    </div>
  )
}

function ProjectionUnavailableState({
  tool,
  error,
  onRetry,
  onOpenExternal,
  variant,
}: {
  tool: WorkspaceTool
  error: string | null
  onRetry: () => void
  onOpenExternal: () => void
  variant: 'default' | 'canvas'
}) {
  const isCanvas = variant === 'canvas'

  return (
    <div
      className={cn(
        'absolute inset-0 z-[3] flex items-center justify-center p-6',
        isCanvas ? 'bg-[#050609]/88 text-white' : 'bg-background/95 text-foreground',
      )}
    >
      <div
        className={cn(
          'w-full max-w-[560px] rounded-[8px] border p-5 shadow-strong',
          isCanvas
            ? 'border-white/[0.08] bg-[#0b0d13]/95 backdrop-blur'
            : 'border-border/70 bg-background',
        )}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'grid size-10 shrink-0 place-items-center rounded-[7px] border',
              isCanvas
                ? 'border-amber-300/20 bg-amber-300/10 text-amber-200'
                : 'border-warning/20 bg-warning/10 text-warning',
            )}
          >
            <AlertTriangle className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className={cn('text-sm font-semibold', isCanvas ? 'text-white' : 'text-foreground')}>
              {tool.title} 本地服务未响应
            </h2>
            <p className={cn('mt-1 text-xs leading-5', isCanvas ? 'text-white/62' : 'text-muted-foreground')}>
              Drama 外壳已正常运行，但没有检测到 {tool.sourceName} 运行在 {tool.endpointLabel}。启动对应本地服务后点击重新检测。
            </p>
          </div>
        </div>

        <div
          className={cn(
            'mt-4 space-y-2 rounded-[6px] border px-3 py-2.5 font-mono text-[11px] leading-5',
            isCanvas
              ? 'border-white/[0.08] bg-white/[0.045] text-white/72'
              : 'border-border/70 bg-foreground/[0.035] text-muted-foreground',
          )}
        >
          <div className="flex min-w-0 items-start gap-2">
            <Terminal className="mt-0.5 size-3.5 shrink-0" />
            <div className="min-w-0">
              {tool.localProjectPath ? (
                <div className="break-all">项目：{tool.localProjectPath}</div>
              ) : null}
              {tool.startCommand ? (
                <div className="break-all">启动：{tool.startCommand}</div>
              ) : null}
              <div className="break-all">地址：{tool.url}</div>
              {error ? (
                <div className={cn('break-all', isCanvas ? 'text-amber-100/78' : 'text-warning')}>
                  诊断：{error}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={onRetry}
            className={cn(isCanvas && 'bg-white text-[#07080d] hover:bg-white/90')}
          >
            <RotateCw className="size-3.5" />
            重新检测
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenExternal}
            className={cn(isCanvas && 'border-white/[0.12] bg-white/[0.045] text-white hover:bg-white/[0.08]')}
          >
            <ExternalLink className="size-3.5" />
            外部打开
          </Button>
        </div>
      </div>
    </div>
  )
}
