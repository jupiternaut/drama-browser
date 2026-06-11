import * as React from 'react'
import {
  Activity,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  FileText,
  Layers,
  ListChecks,
  Loader2,
  PenLine,
  Play,
  Plus,
  Power,
  RotateCw,
  Save,
  ScrollText,
  Sparkles,
  Square,
  Terminal,
} from 'lucide-react'

import { PanelHeader } from '@/components/app-shell/PanelHeader'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

export type PlotPilotRuntimeState = 'offline' | 'starting' | 'ready' | 'error'
export type PlotPilotWorkspaceSurface = 'bible' | 'beats' | 'chapters'

export interface PlotPilotRuntimeStatus {
  state: PlotPilotRuntimeState
  message?: string
  endpoint?: string
  updatedAt?: string
  activeJob?: PlotPilotGenerationJob | null
}

export interface PlotPilotGenerationJob {
  id: string
  label: string
  phase?: string
  progress?: number
  detail?: string
}

export interface PlotPilotNovel {
  id: string
  title: string
  subtitle?: string
  author?: string
  status?: string
  wordCount?: number
  chapterCount?: number
  beatCount?: number
  updatedAt?: string
  bible?: PlotPilotBibleSummary | null
  beats?: PlotPilotBeatSummary[]
  chapters?: PlotPilotChapterSummary[]
}

export interface PlotPilotBibleSummary {
  logline?: string
  world?: string
  themes?: string[]
  characters?: string[]
  constraints?: string[]
  updatedAt?: string
}

export interface PlotPilotBeatSummary {
  id: string
  title: string
  status?: string
  summary?: string
}

export interface PlotPilotChapterSummary {
  id: string
  number?: number
  title: string
  status?: string
  wordCount?: number
  updatedAt?: string
  generationHint?: string
}

export interface PlotPilotChapterEditor {
  novelId: string
  chapterNumber: number
  chapterId?: string
  title: string
  status?: string
  wordCount?: number
  content: string
  generationHint?: string
  dirty?: boolean
  loading?: boolean
}

export interface PlotPilotLogEntry {
  id: string
  level?: 'info' | 'success' | 'warning' | 'error'
  time?: string
  message: string
}

export interface PlotPilotNativeHandlers {
  onStartEngine?: () => void
  onRestartEngine?: () => void
  onCreateNovel?: () => void
  onImportStorylet?: () => void
  onSelectNovel?: (novelId: string) => void
  onGenerateBible?: (novelId: string) => void
  onGenerateBeat?: (novelId: string) => void
  onGenerateChapter?: (novelId: string, chapterNumber?: number) => void
  onPrepareFirstChapter?: (novelId: string) => void
  onRefreshChapters?: (novelId: string) => void
  onWriteBackChapter?: (novelId: string, chapterNumber?: number) => void
  onChangeChapterDraft?: (content: string) => void
  onSaveChapter?: (novelId: string, chapterNumber: number, content: string) => void
  onOpenBible?: (novelId: string) => void
  onOpenBeat?: (novelId: string, beatId: string) => void
  onOpenChapter?: (novelId: string, chapterNumber: number) => void
  onStopGeneration?: (jobId: string) => void
}

export interface PlotPilotNativePageProps {
  runtimeStatus?: PlotPilotRuntimeStatus
  novels?: PlotPilotNovel[]
  selectedNovel?: PlotPilotNovel | null
  chapterEditor?: PlotPilotChapterEditor | null
  handlers?: PlotPilotNativeHandlers
  logs?: PlotPilotLogEntry[]
  className?: string
}

const DEFAULT_RUNTIME_STATUS: PlotPilotRuntimeStatus = {
  state: 'offline',
  message: 'PLM engine offline',
  endpoint: undefined,
}

const runtimeMeta: Record<
  PlotPilotRuntimeState,
  {
    label: string
    title: string
    body: string
    dotClassName: string
    icon: React.ComponentType<{ className?: string }>
  }
> = {
  offline: {
    label: '离线',
    title: 'Engine offline',
    body: '本地 PLM runtime 尚未接入 Drama shell。',
    dotClassName: 'bg-destructive',
    icon: Power,
  },
  starting: {
    label: '启动中',
    title: 'Engine starting',
    body: '正在等待 PlotPilot runtime 返回可用状态。',
    dotClassName: 'bg-info',
    icon: Loader2,
  },
  ready: {
    label: '就绪',
    title: 'Engine ready',
    body: 'Bible、beat 和章节工作区可以接收生成任务。',
    dotClassName: 'bg-success',
    icon: CheckCircle2,
  },
  error: {
    label: '错误',
    title: 'Engine error',
    body: 'PLM runtime 返回错误，需要重启或查看日志。',
    dotClassName: 'bg-destructive',
    icon: AlertTriangle,
  },
}

const surfaces: Array<{
  id: PlotPilotWorkspaceSurface
  label: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  { id: 'bible', label: 'Bible', icon: BookOpen },
  { id: 'beats', label: 'Beat', icon: ListChecks },
  { id: 'chapters', label: '章节', icon: FileText },
]

const idleLogs: PlotPilotLogEntry[] = [
  { id: 'idle', level: 'info', time: 'runtime', message: '等待 PLM runtime 事件。' },
]

export function PlotPilotNativePage({
  runtimeStatus = DEFAULT_RUNTIME_STATUS,
  novels = [],
  selectedNovel,
  chapterEditor,
  handlers,
  logs = idleLogs,
  className,
}: PlotPilotNativePageProps) {
  const [surface, setSurface] = React.useState<PlotPilotWorkspaceSurface>('bible')
  const novel = selectedNovel ?? novels[0] ?? null
  const meta = runtimeMeta[runtimeStatus.state]
  const ready = runtimeStatus.state === 'ready'
  const busy = Boolean(runtimeStatus.activeJob) || runtimeStatus.state === 'starting'

  return (
    <div className={cn('flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#07080d] text-white', className)}>
      <PanelHeader
        title="Drama PLM"
        badge={<RuntimeBadge state={runtimeStatus.state} />}
        className="border-b border-white/[0.07] bg-[#0b0c12]/95 text-white"
        actions={
          <div className="flex items-center gap-1.5">
            {runtimeStatus.state === 'offline' ? (
              <Button
                size="sm"
                onClick={handlers?.onStartEngine}
                disabled={!handlers?.onStartEngine}
                className="h-7 bg-white px-2.5 text-[11px] text-[#07080d] hover:bg-white/90"
              >
                <Play className="size-3.5" />
                开始
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={handlers?.onRestartEngine}
                disabled={runtimeStatus.state === 'starting' || !handlers?.onRestartEngine}
                className="h-7 border-white/[0.12] bg-white/[0.045] px-2.5 text-[11px] text-white hover:bg-white/[0.08]"
              >
                {runtimeStatus.state === 'starting' ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <RotateCw className="size-3.5" />
                )}
                重启
              </Button>
            )}
          </div>
        }
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <aside className="flex min-h-0 flex-col border-b border-white/[0.07] bg-[#090a0f] lg:border-b-0 lg:border-r">
          <RuntimeCard status={runtimeStatus} meta={meta} />
          <BookList novels={novels} selectedNovel={novel} handlers={handlers} ready={ready} busy={busy} />
        </aside>

        <main className="flex min-h-0 flex-col overflow-hidden bg-[#07080d]">
          <WorkspaceHeader novel={novel} surface={surface} onSurfaceChange={setSurface} />
          <section className="min-h-0 flex-1 overflow-y-auto p-3 md:p-4">
            {surface === 'bible' ? <BibleWorkspace novel={novel} handlers={handlers} ready={ready} busy={busy} /> : null}
            {surface === 'beats' ? <BeatWorkspace novel={novel} handlers={handlers} ready={ready} busy={busy} /> : null}
            {surface === 'chapters' ? (
              <ChapterWorkspace
                novel={novel}
                chapterEditor={chapterEditor}
                handlers={handlers}
                ready={ready}
                busy={busy}
              />
            ) : null}
          </section>
        </main>

        <aside className="hidden min-h-0 flex-col border-l border-white/[0.07] bg-[#090a0f] xl:flex">
          <GenerationPanel status={runtimeStatus} logs={logs} onStopGeneration={handlers?.onStopGeneration} />
        </aside>
      </div>
    </div>
  )
}

function RuntimeBadge({ state }: { state: PlotPilotRuntimeState }) {
  const meta = runtimeMeta[state]

  return (
    <span className="hidden items-center gap-1 rounded-[4px] border border-white/[0.08] bg-white/[0.045] px-1.5 py-0.5 font-mono text-[10px] font-medium text-white/58 sm:inline-flex">
      <span className={cn('size-1.5 rounded-full', meta.dotClassName)} />
      {meta.label}
    </span>
  )
}

function RuntimeCard({
  status,
  meta,
}: {
  status: PlotPilotRuntimeStatus
  meta: (typeof runtimeMeta)[PlotPilotRuntimeState]
}) {
  const Icon = meta.icon

  return (
    <div className="border-b border-white/[0.07] p-3">
      <div className="rounded-[8px] border border-white/[0.08] bg-white/[0.035] p-3 shadow-minimal">
        <div className="flex items-start gap-2.5">
          <div
            className={cn(
              'grid size-9 shrink-0 place-items-center rounded-[7px] border border-white/[0.08] bg-white/[0.045]',
              status.state === 'error' && 'bg-destructive/10 text-destructive',
              status.state === 'ready' && 'bg-success/10 text-success',
            )}
          >
            <Icon className={cn('size-4', status.state === 'starting' && 'animate-spin')} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className={cn('size-1.5 shrink-0 rounded-full', meta.dotClassName)} />
              <h2 className="truncate text-sm font-semibold text-white">{meta.title}</h2>
            </div>
            <p className="mt-1 text-xs leading-5 text-white/55">{status.message || meta.body}</p>
          </div>
        </div>
        <div className="mt-3 flex min-w-0 items-center gap-1.5 rounded-[6px] border border-white/[0.07] bg-black/20 px-2 py-1.5 font-mono text-[10px] text-white/48">
          <Terminal className="size-3.5 shrink-0" />
          <span className="truncate">{status.endpoint ?? 'runtime endpoint pending'}</span>
        </div>
      </div>
    </div>
  )
}

function BookList({
  novels,
  selectedNovel,
  handlers,
  ready,
  busy,
}: {
  novels: PlotPilotNovel[]
  selectedNovel: PlotPilotNovel | null
  handlers?: PlotPilotNativeHandlers
  ready: boolean
  busy: boolean
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/[0.07] px-3 py-2">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/38">书目</div>
          <div className="mt-0.5 font-mono text-[10px] text-white/32">{novels.length} novels</div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={handlers?.onCreateNovel}
            disabled={!ready || busy || !handlers?.onCreateNovel}
            className="h-7 border-white/[0.1] bg-white/[0.04] px-2 text-[11px] text-white hover:bg-white/[0.08]"
          >
            <Plus className="size-3.5" />
            新建
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handlers?.onImportStorylet}
            disabled={!ready || busy || !handlers?.onImportStorylet}
            className="h-7 border-white/[0.1] bg-white/[0.04] px-2 text-[11px] text-white hover:bg-white/[0.08]"
          >
            <Layers className="size-3.5" />
            Storylet
          </Button>
        </div>
      </div>

      {novels.length > 0 ? (
        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          <div className="space-y-1">
            {novels.map((novel) => (
              <NovelButton
                key={novel.id}
                novel={novel}
                selected={selectedNovel?.id === novel.id}
                onSelect={handlers?.onSelectNovel}
              />
            ))}
          </div>
        </div>
      ) : (
        <EmptyPanel
          icon={Layers}
          title="暂无书目"
          body="可以新建书目，也可以从当前 Storylet 图谱导入状态机上下文。"
          action={
            <div className="mt-4 flex justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handlers?.onCreateNovel}
                disabled={!ready || busy || !handlers?.onCreateNovel}
                className="h-7 border-white/[0.1] bg-white/[0.04] px-2.5 text-[11px] text-white hover:bg-white/[0.08]"
              >
                <Plus className="size-3.5" />
                新建书目
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handlers?.onImportStorylet}
                disabled={!ready || busy || !handlers?.onImportStorylet}
                className="h-7 border-white/[0.1] bg-white/[0.04] px-2.5 text-[11px] text-white hover:bg-white/[0.08]"
              >
                <Layers className="size-3.5" />
                导入 Storylet
              </Button>
            </div>
          }
        />
      )}
    </div>
  )
}

function NovelButton({
  novel,
  selected,
  onSelect,
}: {
  novel: PlotPilotNovel
  selected: boolean
  onSelect?: (novelId: string) => void
}) {
  return (
    <button
      type="button"
      aria-current={selected ? 'page' : undefined}
      className={cn(
        'group relative flex w-full items-start gap-2 rounded-md px-2 py-2 text-left outline-none transition-colors focus-visible:ring-1 focus-visible:ring-white/30',
        selected ? 'bg-white/[0.075] text-white' : 'text-white/78 hover:bg-white/[0.045]',
      )}
      onClick={() => onSelect?.(novel.id)}
    >
      {selected ? <span className="absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-success/80" /> : null}
      <span
        className={cn(
          'grid size-8 shrink-0 place-items-center rounded-md border transition-colors',
          selected
            ? 'border-success/20 bg-success/10 text-success'
            : 'border-white/[0.07] bg-white/[0.04] text-white/45 group-hover:text-white/70',
        )}
      >
        <BookOpen className="size-4" />
      </span>
      <span className="min-w-0 flex-1 pt-0.5">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-sm font-semibold leading-4">{novel.title}</span>
          {novel.status ? (
            <span className="shrink-0 rounded-[4px] bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/42">
              {novel.status}
            </span>
          ) : null}
        </span>
        <span className="mt-1 block truncate text-xs text-white/45">{novel.subtitle ?? '未生成简介'}</span>
        <span className="mt-1 flex min-w-0 items-center gap-1.5 font-mono text-[10px] text-white/34">
          <span>{formatCount(novel.chapterCount, 'chapters')}</span>
          <span className="text-white/16">/</span>
          <span>{formatCount(novel.wordCount, 'words')}</span>
        </span>
      </span>
    </button>
  )
}

function WorkspaceHeader({
  novel,
  surface,
  onSurfaceChange,
}: {
  novel: PlotPilotNovel | null
  surface: PlotPilotWorkspaceSurface
  onSurfaceChange: (surface: PlotPilotWorkspaceSurface) => void
}) {
  return (
    <div className="flex shrink-0 flex-col gap-3 border-b border-white/[0.07] bg-[#0a0b10] px-4 py-3 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid size-7 shrink-0 place-items-center rounded-[6px] border border-white/[0.08] bg-white/[0.045] text-white/70">
            <ScrollText className="size-3.5" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-white">{novel?.title ?? '未选择书目'}</h2>
            <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-white/42">
              <span>{novel?.subtitle ?? 'PLM native workspace scaffold'}</span>
              {novel?.author ? <span>by {novel.author}</span> : null}
            </div>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 rounded-[7px] border border-white/[0.08] bg-black/20 p-1">
        {surfaces.map((item) => {
          const Icon = item.icon
          const active = surface === item.id

          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={active}
              className={cn(
                'inline-flex h-7 items-center gap-1.5 rounded-[5px] px-2 text-xs outline-none transition-colors focus-visible:ring-1 focus-visible:ring-white/30',
                active
                  ? 'bg-white/[0.1] text-white shadow-minimal'
                  : 'text-white/48 hover:bg-white/[0.055] hover:text-white/72',
              )}
              onClick={() => onSurfaceChange(item.id)}
            >
              <Icon className="size-3.5" />
              {item.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function BibleWorkspace({
  novel,
  handlers,
  ready,
  busy,
}: {
  novel: PlotPilotNovel | null
  handlers?: PlotPilotNativeHandlers
  ready: boolean
  busy: boolean
}) {
  if (!novel) {
    return <WorkspacePlaceholder icon={BookOpen} title="Bible placeholder" body="选择或创建书目后显示 story bible。" />
  }

  const bible = novel.bible

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
      <PanelShell>
        <SectionTitle
          icon={BookOpen}
          title="Story bible"
          detail={bible?.updatedAt ? `updated ${bible.updatedAt}` : 'baseline'}
          action={
            <div className="flex items-center gap-1.5">
              <SmallAction onClick={() => handlers?.onOpenBible?.(novel.id)} disabled={!handlers?.onOpenBible}>
                打开
              </SmallAction>
              <SmallAction onClick={() => handlers?.onGenerateBible?.(novel.id)} disabled={!ready || busy || !handlers?.onGenerateBible}>
                <Sparkles className="size-3.5" />
                生成
              </SmallAction>
            </div>
          }
        />
        {bible ? (
          <div className="mt-4 space-y-3">
            <ContentBlock label="Logline" value={bible.logline} fallback="等待 PlotPilot 返回 logline。" />
            <ContentBlock label="World" value={bible.world} fallback="世界观、时代、空间规则占位。" />
            <TokenList label="Themes" values={bible.themes} fallback="主题尚未归档" />
            <TokenList label="Constraints" values={bible.constraints} fallback="生成约束尚未归档" />
          </div>
        ) : (
          <WorkspacePlaceholder
            icon={BookOpen}
            title="Bible 尚未生成"
            body="这里会承载 logline、世界观、人物和长上下文约束。"
            compact
          />
        )}
      </PanelShell>

      <PanelShell>
        <SectionTitle icon={PenLine} title="角色索引" detail="cast" />
        {bible?.characters?.length ? (
          <div className="mt-3 space-y-2">
            {bible.characters.map((character) => (
              <div key={character} className="rounded-[6px] border border-white/[0.07] bg-white/[0.035] px-2.5 py-2 text-xs text-white/68">
                {character}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 rounded-[6px] border border-dashed border-white/[0.1] bg-white/[0.025] px-3 py-6 text-center text-xs text-white/38">
            人物卡片占位
          </div>
        )}
      </PanelShell>
    </div>
  )
}

function BeatWorkspace({
  novel,
  handlers,
  ready,
  busy,
}: {
  novel: PlotPilotNovel | null
  handlers?: PlotPilotNativeHandlers
  ready: boolean
  busy: boolean
}) {
  if (!novel) {
    return <WorkspacePlaceholder icon={ListChecks} title="Beat placeholder" body="选择书目后显示 beat sheet。" />
  }

  const beats = novel.beats ?? []

  return (
    <PanelShell>
      <SectionTitle
        icon={ListChecks}
        title="Beat sheet"
        detail={formatCount(novel.beatCount ?? beats.length, 'beats')}
        action={
          <SmallAction onClick={() => handlers?.onGenerateBeat?.(novel.id)} disabled={!ready || busy || !handlers?.onGenerateBeat}>
            <Sparkles className="size-3.5" />
            生成 beat
          </SmallAction>
        }
      />
      {beats.length > 0 ? (
        <div className="mt-4 grid gap-2">
          {beats.map((beat, index) => (
            <button
              key={beat.id}
              type="button"
              disabled={!handlers?.onOpenBeat}
              className="group flex min-w-0 items-start gap-3 rounded-[7px] border border-white/[0.07] bg-black/20 px-3 py-2.5 text-left outline-none transition-colors hover:bg-white/[0.04] focus-visible:ring-1 focus-visible:ring-white/30 disabled:cursor-default disabled:hover:bg-black/20"
              onClick={() => handlers?.onOpenBeat?.(novel.id, beat.id)}
            >
              <span className="mt-0.5 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-[4px] bg-white/[0.06] font-mono text-[10px] text-white/42">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-sm font-semibold text-white/82">{beat.title}</span>
                  {beat.status ? <StatusPill>{beat.status}</StatusPill> : null}
                </span>
                <span className="mt-1 block truncate text-xs text-white/45">{beat.summary ?? 'beat 摘要占位'}</span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <WorkspacePlaceholder
          icon={ListChecks}
          title="Beat 尚未生成"
          body="这里会显示节拍、转折点和章节生成前的结构计划。"
          compact
        />
      )}
    </PanelShell>
  )
}

function ChapterWorkspace({
  novel,
  chapterEditor,
  handlers,
  ready,
  busy,
}: {
  novel: PlotPilotNovel | null
  chapterEditor?: PlotPilotChapterEditor | null
  handlers?: PlotPilotNativeHandlers
  ready: boolean
  busy: boolean
}) {
  if (!novel) {
    return <WorkspacePlaceholder icon={FileText} title="Chapter placeholder" body="选择书目后显示章节列表。" />
  }

  const chapters = novel.chapters ?? []
  const activeEditor = chapterEditor?.novelId === novel.id ? chapterEditor : null
  const activeChapter = activeEditor
    ? chapters.find((chapter) => chapter.number === activeEditor.chapterNumber)
    : chapters[0]
  const selectedChapterNumber = activeEditor?.chapterNumber ?? activeChapter?.number
  const writebackChapter = activeChapter
  const draftTextSize = activeEditor ? countDraftText(activeEditor.content) : 0
  const canWriteBack = Boolean(
    ready
    && !busy
    && handlers?.onWriteBackChapter
    && writebackChapter
    && ((writebackChapter.wordCount ?? 0) > 0 || draftTextSize > 0)
    && !activeEditor?.dirty,
  )
  const canGenerate = Boolean(ready && !busy && handlers?.onGenerateChapter && (selectedChapterNumber || chapters.length === 0))

  return (
    <PanelShell>
      <SectionTitle
        icon={FileText}
        title="章节工作区"
        detail={formatCount(novel.chapterCount ?? chapters.length, 'chapters')}
        action={
          <div className="flex items-center gap-1.5">
            <SmallAction onClick={() => handlers?.onRefreshChapters?.(novel.id)} disabled={!ready || busy || !handlers?.onRefreshChapters}>
              <RotateCw className="size-3.5" />
              刷新
            </SmallAction>
            {chapters.length === 0 ? (
              <SmallAction onClick={() => handlers?.onPrepareFirstChapter?.(novel.id)} disabled={!ready || busy || !handlers?.onPrepareFirstChapter}>
                <Plus className="size-3.5" />
                准备第1章
              </SmallAction>
            ) : (
              <>
                <SmallAction
                  onClick={() => handlers?.onWriteBackChapter?.(novel.id, writebackChapter?.number)}
                  disabled={!canWriteBack}
                  title={
                    activeEditor?.dirty
                      ? '先保存编辑区正文再回写'
                      : !writebackChapter || ((writebackChapter.wordCount ?? 0) <= 0 && draftTextSize <= 0)
                        ? '当前章节还没有正文，不能回写'
                        : undefined
                  }
                >
                  <Layers className="size-3.5" />
                  {writebackChapter?.number ? `回写第${writebackChapter.number}章` : '回写章节'}
                </SmallAction>
                <SmallAction onClick={() => handlers?.onGenerateChapter?.(novel.id, selectedChapterNumber)} disabled={!canGenerate}>
                  <Sparkles className="size-3.5" />
                  生成章节
                </SmallAction>
              </>
            )}
          </div>
        }
      />
      {chapters.length > 0 ? (
        <div className="mt-4 grid min-h-[520px] gap-3 xl:grid-cols-[300px_minmax(0,1fr)]">
          <div className="min-h-0 rounded-[8px] border border-white/[0.07] bg-black/20 p-2">
            <div className="mb-2 flex items-center justify-between px-1">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/34">Chapter list</div>
              <div className="font-mono text-[10px] text-white/28">{chapters.length}</div>
            </div>
            <div className="max-h-[620px] space-y-1 overflow-y-auto pr-1">
              {chapters.map((chapter) => {
                const chapterNumber = chapter.number
                const active = chapterNumber !== undefined && chapterNumber === selectedChapterNumber

                return (
                  <button
                    key={chapter.id}
                    type="button"
                    disabled={!handlers?.onOpenChapter || chapterNumber === undefined}
                    className={cn(
                      'group w-full min-w-0 rounded-[7px] border px-2.5 py-2.5 text-left outline-none transition-colors focus-visible:ring-1 focus-visible:ring-white/30 disabled:cursor-default',
                      active
                        ? 'border-success/20 bg-success/10 text-white'
                        : 'border-white/[0.07] bg-white/[0.025] text-white/72 hover:bg-white/[0.045]',
                    )}
                    onClick={() => chapterNumber !== undefined && handlers?.onOpenChapter?.(novel.id, chapterNumber)}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <FileText className={cn('size-4 shrink-0', active ? 'text-success' : 'text-white/38 group-hover:text-white/62')} />
                      <span className="truncate text-sm font-semibold">{chapter.title}</span>
                    </div>
                    <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] text-white/34">
                      {chapter.status ? <span>{chapter.status}</span> : null}
                      <span>{formatCount(chapter.wordCount, 'words')}</span>
                      {chapter.generationHint ? <span>hint</span> : null}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <ChapterEditorPane
            novel={novel}
            chapter={activeChapter ?? null}
            editor={activeEditor}
            handlers={handlers}
            ready={ready}
            busy={busy}
          />
        </div>
      ) : (
        <div className="mt-4 rounded-[8px] border border-dashed border-white/[0.1] bg-white/[0.02] p-6 text-center">
          <FileText className="mx-auto size-6 text-white/35" />
          <div className="mt-3 text-sm font-semibold text-white/72">还没有章节记录</div>
          <div className="mx-auto mt-1 max-w-sm text-xs leading-5 text-white/42">
            先在 PlotPilot 状态库里建立第 1 章，后续 beat sheet 和正文生成都会绑定到这个章节 ID。
          </div>
          <SmallAction
            className="mx-auto mt-4"
            onClick={() => handlers?.onPrepareFirstChapter?.(novel.id)}
            disabled={!ready || busy || !handlers?.onPrepareFirstChapter}
          >
            <Plus className="size-3.5" />
            准备第1章
          </SmallAction>
        </div>
      )}
    </PanelShell>
  )
}

function ChapterEditorPane({
  novel,
  chapter,
  editor,
  handlers,
  ready,
  busy,
}: {
  novel: PlotPilotNovel
  chapter: PlotPilotChapterSummary | null
  editor: PlotPilotChapterEditor | null
  handlers?: PlotPilotNativeHandlers
  ready: boolean
  busy: boolean
}) {
  if (!editor) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-[8px] border border-dashed border-white/[0.1] bg-white/[0.02] px-6 py-12 text-center">
        <div className="max-w-[360px]">
          <div className="mx-auto grid size-10 place-items-center rounded-[7px] border border-white/[0.08] bg-white/[0.045] text-white/42">
            <FileText className="size-5" />
          </div>
          <h2 className="mt-3 text-sm font-semibold text-white/82">选择章节</h2>
          <p className="mt-1 text-xs leading-5 text-white/42">点击左侧章节后，可以读取正文、编辑、保存，并回写到 Drama Graph。</p>
        </div>
      </div>
    )
  }

  const contentSize = countDraftText(editor.content)
  const canSave = Boolean(ready && !busy && handlers?.onSaveChapter && editor.dirty && !editor.loading)
  const canGenerate = Boolean(ready && !busy && handlers?.onGenerateChapter && !editor.loading)
  const canWriteBack = Boolean(
    ready
    && !busy
    && handlers?.onWriteBackChapter
    && !editor.dirty
    && !editor.loading
    && contentSize > 0,
  )

  return (
    <div className="flex min-h-0 flex-col rounded-[8px] border border-white/[0.07] bg-black/20">
      <div className="flex shrink-0 flex-col gap-3 border-b border-white/[0.07] px-3 py-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid size-7 shrink-0 place-items-center rounded-[6px] border border-white/[0.08] bg-white/[0.045] text-white/58">
              <ScrollText className="size-3.5" />
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-white">
                第{editor.chapterNumber}章 · {editor.title}
              </h3>
              <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] text-white/34">
                <span>{editor.status ?? chapter?.status ?? 'draft'}</span>
                <span>{formatCount(editor.wordCount ?? chapter?.wordCount ?? contentSize, 'words')}</span>
                {editor.dirty ? <span className="text-warning">unsaved</span> : <span>saved</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          <SmallAction
            onClick={() => handlers?.onGenerateChapter?.(novel.id, editor.chapterNumber)}
            disabled={!canGenerate}
          >
            <Sparkles className="size-3.5" />
            生成
          </SmallAction>
          <SmallAction
            onClick={() => handlers?.onSaveChapter?.(novel.id, editor.chapterNumber, editor.content)}
            disabled={!canSave}
          >
            <Save className="size-3.5" />
            保存
          </SmallAction>
          <SmallAction
            onClick={() => handlers?.onWriteBackChapter?.(novel.id, editor.chapterNumber)}
            disabled={!canWriteBack}
            title={editor.dirty ? '先保存编辑区正文再回写' : undefined}
          >
            <Layers className="size-3.5" />
            回写 Graph
          </SmallAction>
        </div>
      </div>

      {editor.generationHint ? (
        <div className="shrink-0 border-b border-white/[0.07] px-3 py-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/30">Generation hint</div>
          <div className="mt-1 line-clamp-3 text-xs leading-5 text-white/48">{editor.generationHint}</div>
        </div>
      ) : null}

      <div className="relative min-h-0 flex-1 p-3">
        {editor.loading ? (
          <div className="absolute inset-3 z-10 grid place-items-center rounded-[7px] border border-white/[0.07] bg-[#08090d]/85">
            <div className="flex items-center gap-2 text-xs text-white/52">
              <Loader2 className="size-4 animate-spin" />
              正在读取章节正文
            </div>
          </div>
        ) : null}
        <Textarea
          value={editor.content}
          onChange={(event) => handlers?.onChangeChapterDraft?.(event.currentTarget.value)}
          disabled={editor.loading || busy || !handlers?.onChangeChapterDraft}
          placeholder="章节正文会出现在这里。可以先点“生成”，也可以手动写入后保存。"
          className="min-h-[420px] resize-none border-white/[0.08] bg-[#08090d] font-sans text-sm leading-6 text-white/76 placeholder:text-white/24 focus-visible:border-white/20 focus-visible:ring-white/12"
        />
        <div className="mt-2 flex items-center justify-between gap-2 font-mono text-[10px] text-white/30">
          <span>{contentSize.toLocaleString()} chars in editor</span>
          <span>{editor.chapterId ?? `chapter-${editor.chapterNumber}`}</span>
        </div>
      </div>
    </div>
  )
}

function GenerationPanel({
  status,
  logs,
  onStopGeneration,
}: {
  status: PlotPilotRuntimeStatus
  logs: PlotPilotLogEntry[]
  onStopGeneration?: (jobId: string) => void
}) {
  const job = status.activeJob ?? null

  return (
    <>
      <div className="border-b border-white/[0.07] px-3 py-3">
        <SectionTitle icon={Activity} title="生成状态" detail={job ? 'active' : 'idle'} />
        {job ? (
          <div className="mt-3 rounded-[8px] border border-white/[0.08] bg-white/[0.035] p-3">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-[6px] border border-info/20 bg-info/10 text-info">
                <Loader2 className="size-4 animate-spin" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-white">{job.label}</div>
                <div className="mt-1 truncate text-xs text-white/45">{job.phase ?? 'running'}</div>
              </div>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
              <div className="h-full rounded-full bg-info" style={{ width: `${clampProgress(job.progress)}%` }} />
            </div>
            {job.detail ? <p className="mt-2 text-xs leading-5 text-white/48">{job.detail}</p> : null}
            <SmallAction className="mt-3" onClick={() => onStopGeneration?.(job.id)} disabled={!onStopGeneration}>
              <Square className="size-3" />
              停止
            </SmallAction>
          </div>
        ) : (
          <div className="mt-3 rounded-[8px] border border-dashed border-white/[0.1] bg-white/[0.02] p-4 text-center">
            <Sparkles className="mx-auto size-5 text-white/38" />
            <div className="mt-2 text-sm font-semibold text-white/70">无生成任务</div>
            <div className="mt-1 text-xs text-white/38">等待 bible、beat 或章节生成。</div>
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.07] px-3 py-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/38">Runtime log</div>
          <div className="font-mono text-[10px] text-white/32">{logs.length} events</div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <div className="space-y-2">
            {logs.map((entry) => (
              <LogEntry key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

function LogEntry({ entry }: { entry: PlotPilotLogEntry }) {
  const level = entry.level ?? 'info'

  return (
    <div className="rounded-[7px] border border-white/[0.07] bg-black/20 px-2.5 py-2">
      <div className="flex min-w-0 items-center gap-1.5">
        <span
          className={cn(
            'size-1.5 shrink-0 rounded-full',
            level === 'success' && 'bg-success',
            level === 'warning' && 'bg-warning',
            level === 'error' && 'bg-destructive',
            level === 'info' && 'bg-info',
          )}
        />
        <span className="truncate font-mono text-[10px] text-white/34">{entry.time ?? 'now'}</span>
      </div>
      <div className="mt-1 text-xs leading-5 text-white/62">{entry.message}</div>
    </div>
  )
}

function PanelShell({ children }: { children: React.ReactNode }) {
  return <div className="rounded-[8px] border border-white/[0.08] bg-white/[0.035] p-4">{children}</div>
}

function SectionTitle({
  icon: Icon,
  title,
  detail,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  detail?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className="grid size-7 shrink-0 place-items-center rounded-[6px] border border-white/[0.08] bg-white/[0.045] text-white/58">
          <Icon className="size-3.5" />
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-white">{title}</h3>
          {detail ? <div className="mt-0.5 truncate font-mono text-[10px] text-white/34">{detail}</div> : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

function ContentBlock({ label, value, fallback }: { label: string; value?: string; fallback: string }) {
  return (
    <div className="rounded-[7px] border border-white/[0.07] bg-black/20 px-3 py-2.5">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/34">{label}</div>
      <div className="mt-1 text-sm leading-6 text-white/72">{value || fallback}</div>
    </div>
  )
}

function TokenList({ label, values, fallback }: { label: string; values?: string[]; fallback: string }) {
  return (
    <div className="rounded-[7px] border border-white/[0.07] bg-black/20 px-3 py-2.5">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/34">{label}</div>
      {values?.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {values.map((value) => (
            <span key={value} className="rounded-[4px] border border-white/[0.08] bg-white/[0.045] px-2 py-1 text-xs text-white/64">
              {value}
            </span>
          ))}
        </div>
      ) : (
        <div className="mt-1 text-sm leading-6 text-white/42">{fallback}</div>
      )}
    </div>
  )
}

function WorkspacePlaceholder({
  icon: Icon,
  title,
  body,
  compact,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  body: string
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-[8px] border border-dashed border-white/[0.1] bg-white/[0.02] text-center',
        compact ? 'mt-4 px-4 py-12' : 'min-h-[360px] px-6 py-12',
      )}
    >
      <div className="max-w-[360px]">
        <div className="mx-auto grid size-10 place-items-center rounded-[7px] border border-white/[0.08] bg-white/[0.045] text-white/42">
          <Icon className="size-5" />
        </div>
        <h2 className="mt-3 text-sm font-semibold text-white/82">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-white/42">{body}</p>
      </div>
    </div>
  )
}

function EmptyPanel({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  body: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-8">
      <div className="w-full rounded-[8px] border border-dashed border-white/[0.12] bg-white/[0.025] p-4 text-center">
        <div className="mx-auto grid size-10 place-items-center rounded-[7px] border border-white/[0.08] bg-white/[0.045] text-white/50">
          <Icon className="size-5" />
        </div>
        <h2 className="mt-3 text-sm font-semibold text-white">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-white/45">{body}</p>
        {action}
      </div>
    </div>
  )
}

function SmallAction({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Button
      size="sm"
      variant="outline"
      className={cn('h-7 border-white/[0.1] bg-white/[0.04] px-2 text-[11px] text-white hover:bg-white/[0.08]', className)}
      {...props}
    />
  )
}

function StatusPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="shrink-0 rounded-[4px] bg-white/[0.055] px-1.5 py-0.5 text-[10px] text-white/42">
      {children}
    </span>
  )
}

function formatCount(value: number | undefined, unit: string) {
  if (typeof value !== 'number') return `0 ${unit}`
  return `${value.toLocaleString()} ${unit}`
}

function countDraftText(value: string | undefined) {
  const text = value?.trim() ?? ''
  return text.length
}

function clampProgress(value: number | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0
  return Math.min(100, Math.max(0, value))
}
