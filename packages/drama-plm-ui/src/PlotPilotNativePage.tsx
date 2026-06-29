import * as React from 'react'
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Box,
  Brain,
  Brush,
  Bug,
  Captions,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Clapperboard,
  Clock3,
  CornerDownRight,
  Eraser,
  FileText,
  Film,
  FolderOpen,
  Gauge,
  GitBranch,
  GripVertical,
  Highlighter,
  Image,
  Layers,
  ListChecks,
  Loader2,
  LogIn,
  MapPin,
  MessageCircle,
  MessageSquareText,
  Music,
  Network,
  Palette,
  Pause,
  PenLine,
  Play,
  Plus,
  Power,
  Quote,
  Repeat2,
  RotateCw,
  Save,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  ScrollText,
  Sparkles,
  Square,
  SkipBack,
  SkipForward,
  Terminal,
  Trash2,
  Upload,
  UserRound,
  Users,
  Volume2,
  WandSparkles,
} from 'lucide-react'
import { Button, LiquidEther, PanelHeader, StatusBadge, cn, type StatusTone } from '@drama/ui'
import type {
  DramaPlmHostAdapter,
  DramaPlmSurfaceClassification,
} from '@drama/host'

export type PlotPilotRuntimeState = 'offline' | 'starting' | 'ready' | 'error'
export type PlotPilotWorkspaceSurface =
  | 'setup'
  | 'planning'
  | 'bible'
  | 'beats'
  | 'chapters'
  | 'review'
  | 'autopilot'
  | 'memory'
  | 'debug'

export interface PlotPilotRuntimeStatus {
  state: PlotPilotRuntimeState
  message?: string
  endpoint?: string
  updatedAt?: string
  activeJob?: PlotPilotGenerationJob | null
}

export interface PlotPilotCodexStatus {
  available: boolean
  authenticated: boolean
  requiresOpenAiAuth?: boolean
  email?: string | null
  planType?: string | null
  error?: string | null
}

export type PlotPilotIntegrationSurface = DramaPlmSurfaceClassification
export type PlotPilotCanonicalIntegrationSurface = Exclude<DramaPlmSurfaceClassification, 'product-zen-panel'>

export type PlotPilotReadinessTier =
  | 'shell-ready'
  | 'runtime-ready'
  | 'plm-sidecar-ready'
  | 'ai-ready'
  | 'workflow-preview-ready'
  | 'plotpilot-parity-ready'

export type PlotPilotReadinessState = 'ready' | 'pending' | 'blocked'

export interface PlotPilotReadinessStatus {
  tier: PlotPilotReadinessTier
  state: PlotPilotReadinessState
  message: string
}

export type PlotPilotParityCheckState = 'ready' | 'partial' | 'blocked'

export interface PlotPilotParityCheck {
  id: string
  label: string
  state: PlotPilotParityCheckState
  detail: string
  evidence?: string
}

export type PlotPilotProductionEvidenceState = 'ready' | 'partial' | 'blocked'

export interface PlotPilotProductionEvidenceItem {
  id: string
  label: string
  state: PlotPilotProductionEvidenceState
  detail: string
  evidence?: string
  updatedAt?: string
}

export interface PlotPilotProductionEvidenceSnapshot {
  fixtureName?: string
  fixtureId?: string
  projectId?: string
  projectTitle?: string
  chapterId?: string
  chapterNumber?: number
  chapterTitle?: string
  pathHints?: string[]
  generatedAt: string
  stage9Ready?: boolean
  stage9NonReady?: string[]
  items: PlotPilotProductionEvidenceItem[]
}

export interface PlotPilotIntegrationStatus {
  surface: PlotPilotIntegrationSurface
  canonicalSurface?: PlotPilotCanonicalIntegrationSurface
  hostAdapter?: DramaPlmHostAdapter
  productPath: boolean
  currentUrl?: string
  reason?: string
  tiers: PlotPilotReadinessStatus[]
  parityChecks?: PlotPilotParityCheck[]
  productionEvidence?: PlotPilotProductionEvidenceSnapshot
  parityGaps?: string[]
  workspacePathHints?: string[]
}

export interface PlotPilotProjectGuardStatus {
  writingSpecId?: string
  writingSpecTitle?: string
  writingSpecVersion?: string
  contextKey?: string
  humanizerEnabled?: boolean
  humanizerPolicy?: string
  humanizerRevisionNote?: string
  humanizerTemperature?: number
  humanizerMaxTokens?: number | null
}

export type PlotPilotHumanizerFailurePolicy = 'fallback_original' | 'fail'

export interface PlotPilotHumanizerSettingsDraft {
  enabled: boolean
  revisionNote: string
  failurePolicy: PlotPilotHumanizerFailurePolicy
  temperature: number
  maxTokens?: number | null
}

export interface PlotPilotWritingSpecFailureView {
  code: string
  message: string
  novelId: string
  chapterNumber: number
  writingSpecId?: string
  occurredAt: string
  findingCount: number
  report?: Record<string, unknown>
}

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-9 w-full rounded-[7px] border border-white/[0.08] bg-black/20 px-2.5 text-sm text-white outline-none placeholder:text-white/24 focus:border-white/20 disabled:opacity-55',
        className,
      )}
      {...props}
    />
  )
}

function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'min-h-[88px] w-full resize-none rounded-[7px] border border-white/[0.08] bg-black/20 px-2.5 py-2 text-sm leading-5 text-white outline-none placeholder:text-white/24 focus:border-white/20 disabled:opacity-55',
        className,
      )}
      {...props}
    />
  )
}

function Switch({
  checked,
  onCheckedChange,
  className,
  disabled,
  ...props
}: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> & {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-state={checked ? 'checked' : 'unchecked'}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        'relative h-5 w-9 rounded-full border border-white/[0.12] bg-white/[0.08] transition-colors disabled:opacity-55 data-[state=checked]:bg-white/70',
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          'absolute top-1/2 size-4 -translate-y-1/2 rounded-full bg-white transition-transform',
          checked ? 'translate-x-[17px]' : 'translate-x-[2px]',
        )}
      />
    </button>
  )
}

export interface PlotPilotBibleEditorData {
  id?: string
  novel_id?: string
  characters: Array<Record<string, unknown>>
  world_settings: Array<Record<string, unknown>>
  locations: Array<Record<string, unknown>>
  timeline_notes: Array<Record<string, unknown>>
  style_notes: Array<Record<string, unknown>>
  style?: string
}

export interface PlotPilotOnboardingDraft {
  title: string
  author: string
  premise: string
  genre: string
  worldPreset: string
  storyStructure: string
  pacingControl: string
  writingStyle: string
  specialRequirements: string
  lengthTier: 'short' | 'standard' | 'epic' | ''
  targetChapters: number
  targetWordsPerChapter: number
}

export interface PlotPilotWorkspaceUploadDraft {
  fileName: string
  mimeType?: string
  content: string
}

type BrowserSaveFilePickerHandle = {
  createWritable: () => Promise<{
    write: (data: Blob) => Promise<void>
    close: () => Promise<void>
  }>
}

type BrowserSaveFilePickerWindow = Window & {
  showSaveFilePicker?: (options?: {
    suggestedName?: string
    types?: Array<{
      description: string
      accept: Record<string, string[]>
    }>
  }) => Promise<BrowserSaveFilePickerHandle>
}

export interface PlotPilotOutlineDraft {
  mainStoryOverview: string
  coreConflict: string
  expectedEnding: string
  stagePlanJson: string
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
  lockedGenre?: string
  lockedWorldPreset?: string
  lockedStoryStructure?: string
  lockedPacingControl?: string
  lockedWritingStyle?: string
  lockedSpecialRequirements?: string
  targetChapters?: number
  targetWordsPerChapter?: number
  autoApproveMode?: boolean
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
  lastWritingSpecFailure?: PlotPilotWritingSpecFailureView | null
}

export interface PlotPilotLogEntry {
  id: string
  level?: 'info' | 'success' | 'warning' | 'error'
  time?: string
  message: string
}

export interface PlotPilotNativeFeatureState {
  loadingKey?: string | null
  lastMessage?: string
  plotOutline?: Record<string, unknown> | null
  mainPlotOptions?: Array<Record<string, unknown>>
  setupEvents?: Array<Record<string, unknown>>
  planningStructure?: Record<string, unknown> | null
  planningResult?: Record<string, unknown> | null
  beatSheet?: Record<string, unknown> | null
  readerReport?: Record<string, unknown> | null
  readerSimulations?: Array<Record<string, unknown>>
  churnAlerts?: Array<Record<string, unknown>>
  reviewResult?: Record<string, unknown> | null
  knowledgeStats?: Record<string, unknown> | null
  knowledgeTriples?: Array<Record<string, unknown>>
  knowledgeSearchResults?: Array<Record<string, unknown>>
  aiTraces?: Array<Record<string, unknown>>
  traceTimeline?: Record<string, unknown> | null
  traceStats?: Record<string, unknown> | null
  promptStats?: Record<string, unknown> | null
  prompts?: Array<Record<string, unknown>>
  activeInvocation?: Record<string, unknown> | null
  postChapterMemorySync?: Record<string, unknown> | null
  productionFixture?: Record<string, unknown> | null
  productionEvidence?: PlotPilotProductionEvidenceSnapshot
  autopilotStatus?: Record<string, unknown> | null
  autopilotCircuitBreaker?: Record<string, unknown> | null
  autopilotEvents?: Array<Record<string, unknown>>
  autopilotStatusEvents?: Array<Record<string, unknown>>
  autopilotChapterEvents?: Array<Record<string, unknown>>
  autopilotChapterSnapshot?: Record<string, unknown> | null
  hostedWriteEvents?: Array<Record<string, unknown>>
  hostedWriteSummary?: Record<string, unknown> | null
}

export interface PlotPilotNativeHandlers {
  onStartEngine?: () => void
  onRestartEngine?: () => void
  onStartCodexLogin?: () => void
  onCreateNovel?: () => void
  onCreateNovelFromOnboarding?: (draft: PlotPilotOnboardingDraft) => void
  onSaveNovelSetup?: (novelId: string, draft: PlotPilotOnboardingDraft) => void
  onImportStorylet?: () => void
  onImportWorkspaceFile?: (draft: PlotPilotWorkspaceUploadDraft) => void
  onSelectNovel?: (novelId: string) => void
  onGenerateBible?: (novelId: string) => void
  onSaveBible?: (novelId: string, bible: PlotPilotBibleEditorData) => void
  onRefreshSetup?: (novelId: string) => void
  onSuggestMainPlotOptions?: (novelId: string) => void
  onGeneratePlotOutline?: (novelId: string) => void
  onSavePlotOutline?: (novelId: string, outline: Record<string, unknown>) => void
  onSetAutoApproveMode?: (novelId: string, enabled: boolean) => void
  onRefreshPlanning?: (novelId: string) => void
  onGenerateMacroPlan?: (novelId: string) => void
  onContinuePlanning?: (novelId: string, currentChapter: number) => void
  onGenerateBeat?: (novelId: string) => void
  onGenerateChapter?: (novelId: string, chapterNumber?: number, revisionContext?: PlotPilotChapterRevisionContext) => void
  onHostedWrite?: (
    novelId: string,
    fromChapter: number,
    toChapter: number,
    autoSave: boolean,
    autoOutline: boolean,
    revisionContext?: PlotPilotChapterRevisionContext,
  ) => void
  onRefreshAutopilot?: (novelId: string) => void
  onStartAutopilot?: (
    novelId: string,
    maxAutoChapters: number,
    targetChapters: number,
    targetWordsPerChapter: number,
    autoApproveMode?: boolean,
  ) => void
  onStopAutopilot?: (novelId: string) => void
  onResumeAutopilot?: (novelId: string) => void
  onResetAutopilotBreaker?: (novelId: string) => void
  onReviewChapter?: (novelId: string, chapterNumber: number) => void
  onSimulateReaders?: (novelId: string, chapterNumber: number) => void
  onRefreshReview?: (novelId: string, chapterNumber?: number) => void
  onRefreshMemory?: (novelId: string) => void
  onInferKnowledgeGraph?: (novelId: string) => void
  onSearchMemory?: (novelId: string, query: string) => void
  onRefreshDebug?: (novelId: string) => void
  onLoadInvocation?: (sessionId: string) => void
  onResumeInvocation?: (sessionId: string) => void
  onRetryInvocation?: (sessionId: string) => void
  onAcceptInvocation?: (sessionId: string) => void
  onRejectInvocation?: (sessionId: string) => void
  onCommitInvocation?: (sessionId: string) => void
  onLoadTraceTimeline?: (novelId: string, traceId: string) => void
  onPrepareFirstChapter?: (novelId: string) => void
  onRefreshChapters?: (novelId: string) => void
  onWriteBackChapter?: (novelId: string, chapterNumber?: number) => void
  onChangeChapterDraft?: (content: string) => void
  onSaveChapter?: (
    novelId: string,
    chapterNumber: number,
    content: string,
    revisionContext?: PlotPilotChapterRevisionContext,
  ) => void
  onSaveChapterAnnotations?: (novelId: string, chapterNumber: number, annotations: PlotPilotChapterAnnotation[]) => void
  onBindWritingSpec?: (novelId: string, writingSpecId: string) => void
  onClearWritingSpec?: (novelId: string) => void
  onUpdateHumanizer?: (novelId: string, settings: PlotPilotHumanizerSettingsDraft) => void
  onSaveStorageCard?: (novelId: string, card: ScriptStudioStorageCardDraft) => void
  onOpenBible?: (novelId: string) => void
  onOpenBeat?: (novelId: string, beatId: string) => void
  onOpenChapter?: (novelId: string, chapterNumber: number) => void
  onStopGeneration?: (jobId: string) => void
}

const CODEX_BACKED_HANDLER_KEYS = [
  'onGenerateBible',
  'onSuggestMainPlotOptions',
  'onGeneratePlotOutline',
  'onGenerateMacroPlan',
  'onContinuePlanning',
  'onGenerateBeat',
  'onGenerateChapter',
  'onHostedWrite',
  'onStartAutopilot',
  'onResumeAutopilot',
  'onReviewChapter',
  'onSimulateReaders',
  'onInferKnowledgeGraph',
  'onResumeInvocation',
  'onRetryInvocation',
] as const satisfies ReadonlyArray<keyof PlotPilotNativeHandlers>

function isCodexReady(status?: PlotPilotCodexStatus | null): boolean {
  return status?.available === true && status.authenticated === true
}

function codexUnavailableMessage(status?: PlotPilotCodexStatus | null): string {
  if (!status) return 'Codex AI 状态尚未载入，生成动作暂时锁定。'
  if (!status.available) return status.error ?? 'Codex CLI 或 ChatGPT OAuth 不可用，生成动作暂时锁定。'
  if (!status.authenticated) return status.error ?? 'Codex 尚未登录，生成动作需要完成认证后再启用。'
  return 'Codex 已就绪。'
}

function createCodexGuardedHandlers(
  handlers: PlotPilotNativeHandlers | undefined,
  codexStatus?: PlotPilotCodexStatus | null,
): PlotPilotNativeHandlers | undefined {
  if (!handlers || isCodexReady(codexStatus)) return handlers
  const guarded: PlotPilotNativeHandlers = { ...handlers }
  for (const key of CODEX_BACKED_HANDLER_KEYS) {
    delete guarded[key]
  }
  return guarded
}

function readinessByTier(
  status: PlotPilotIntegrationStatus | undefined,
  tier: PlotPilotReadinessTier,
): PlotPilotReadinessStatus | undefined {
  return status?.tiers.find((row) => row.tier === tier)
}

export interface PlotPilotNativePageProps {
  runtimeStatus?: PlotPilotRuntimeStatus
  novels?: PlotPilotNovel[]
  selectedNovel?: PlotPilotNovel | null
  chapterEditor?: PlotPilotChapterEditor | null
  selectedBibleData?: PlotPilotBibleEditorData | null
  codexStatus?: PlotPilotCodexStatus | null
  integrationStatus?: PlotPilotIntegrationStatus
  projectGuardStatus?: PlotPilotProjectGuardStatus | null
  lastWritingSpecFailure?: PlotPilotWritingSpecFailureView | null
  chapterAnnotations?: PlotPilotChapterAnnotation[]
  featureState?: PlotPilotNativeFeatureState
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
  { id: 'setup', label: '设定', icon: WandSparkles },
  { id: 'planning', label: '规划', icon: GitBranch },
  { id: 'bible', label: 'Bible', icon: BookOpen },
  { id: 'beats', label: 'Beat', icon: ListChecks },
  { id: 'chapters', label: '章节', icon: FileText },
  { id: 'review', label: '审稿', icon: ShieldCheck },
  { id: 'autopilot', label: '连写', icon: Gauge },
  { id: 'memory', label: '记忆', icon: Brain },
  { id: 'debug', label: 'Debug', icon: Bug },
]

const idleLogs: PlotPilotLogEntry[] = [
  { id: 'idle', level: 'info', time: 'runtime', message: '等待 PLM runtime 事件。' },
]

export function PlotPilotNativePage({
  runtimeStatus = DEFAULT_RUNTIME_STATUS,
  novels = [],
  selectedNovel,
  chapterEditor,
  selectedBibleData,
  codexStatus,
  integrationStatus,
  projectGuardStatus,
  lastWritingSpecFailure,
  chapterAnnotations = [],
  featureState = {},
  handlers,
  logs = idleLogs,
  className,
}: PlotPilotNativePageProps) {
  const novel = selectedNovel ?? novels[0] ?? null
  const ready = runtimeStatus.state === 'ready'
  const busy = Boolean(runtimeStatus.activeJob) || runtimeStatus.state === 'starting'

  return (
    <ScriptStudioPlmSurface
      runtimeStatus={runtimeStatus}
      novels={novels}
      novel={novel}
      chapterEditor={chapterEditor}
      selectedBibleData={selectedBibleData}
      codexStatus={codexStatus}
      integrationStatus={integrationStatus}
      projectGuardStatus={projectGuardStatus}
      lastWritingSpecFailure={lastWritingSpecFailure}
      chapterAnnotations={chapterAnnotations}
      featureState={featureState}
      handlers={handlers}
      logs={logs}
      ready={ready}
      busy={busy}
      className={className}
    />
  )
}

type ScriptStudioMode = 'script' | 'beats' | 'outline'
type ScriptStudioExperienceMode = 'lazy' | 'pro'
type ScriptStudioPaperMode = 'edit' | 'annotate'
export type ScriptStudioAnnotationColor = 'amber' | 'mint' | 'rose' | 'sky'
type ScriptStudioWorkspaceMode =
  | 'creation'
  | 'reader'
  | 'setup'
  | 'planning'
  | 'production'
  | 'review'
  | 'debug'
type ScriptStudioNavId =
  | 'script'
  | 'beats'
  | 'characters'
  | 'props'
  | 'locations'
  | 'shots'
  | 'scenes'
  | 'assets'
  | 'design'

interface ScriptStudioChapterView {
  id: string
  number: number
  title: string
  status?: string
  wordCount?: number
  updatedAt?: string
  summary: string
  colorClassName: string
}

export interface PlotPilotReaderInkPoint {
  x: number
  y: number
}

export interface PlotPilotReaderInkStroke {
  tool: 'pen' | 'arrow'
  color: string
  width: number
  opacity?: number
  points: PlotPilotReaderInkPoint[]
}

export interface PlotPilotChapterAnnotation {
  id: string
  kind?: 'text' | 'ink'
  start: number
  end: number
  quote: string
  note: string
  color: ScriptStudioAnnotationColor
  status?: 'open' | 'resolved'
  createdAt: string
  ink?: PlotPilotReaderInkStroke
}

export type PlotPilotStoryContextKind = 'character' | 'plot' | 'world' | 'style'

export interface PlotPilotStoryContextCard {
  id: string
  kind: PlotPilotStoryContextKind
  title: string
  body: string
  source?: string
  priority?: number
}

export interface PlotPilotStoryContextBundle {
  schema: 'plotpilot.story_context.v1'
  novelId?: string
  chapterNumber?: number
  focusCardIds?: string[]
  cards: PlotPilotStoryContextCard[]
}

export interface PlotPilotChapterRevisionContext {
  annotations?: PlotPilotChapterAnnotation[]
  instruction?: string
  storyContext?: PlotPilotStoryContextBundle
}

interface ScriptStudioTextSelection {
  start: number
  end: number
  quote: string
}

interface ScriptStudioStorageCardView {
  id: string
  kind: 'character' | 'prompt'
  title: string
  subtitle: string
  body: string
  badge: string
  meta: string
  initials: string
  tone: 'sage' | 'ink' | 'gold'
  sourceIndex?: number
  sourceId?: string
  source?: 'bible' | 'summary' | 'prompt-registry' | 'fallback' | 'draft'
}

export interface ScriptStudioStorageCardDraft {
  id?: string
  kind: 'character' | 'prompt'
  title: string
  subtitle: string
  body: string
  badge?: string
  meta?: string
  tone?: 'sage' | 'ink' | 'gold'
  sourceIndex?: number
  sourceId?: string
  source?: 'bible' | 'summary' | 'prompt-registry' | 'fallback' | 'draft'
}

const scriptStudioNavItems: Array<{
  id: ScriptStudioNavId
  label: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  { id: 'script', label: '剧本', icon: FileText },
  { id: 'beats', label: '节拍', icon: ListChecks },
  { id: 'characters', label: '人物', icon: UserRound },
  { id: 'props', label: '道具', icon: Box },
  { id: 'locations', label: '地点', icon: MapPin },
  { id: 'shots', label: '分镜', icon: Film },
  { id: 'scenes', label: '场次', icon: Clapperboard },
  { id: 'assets', label: '资产', icon: Image },
  { id: 'design', label: '设计', icon: Palette },
]

const scriptStudioToolbarItems: Array<{
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  usage: string
  snippet: string
}> = [
  {
    id: 'scene',
    label: '场次',
    icon: Clapperboard,
    description: '新建一个剧本场景标题，标记内外景、地点和时间。',
    usage: '点击后在光标处插入场景头。',
    snippet: '\n\nEXT. 地点 - 日\n\n',
  },
  {
    id: 'action',
    label: '动作',
    icon: Activity,
    description: '写画面、人物动作、环境变化，不属于台词。',
    usage: '用于补充镜头里发生了什么。',
    snippet: '\n\n人物动作与画面描写。\n\n',
  },
  {
    id: 'character',
    label: '角色',
    icon: UserRound,
    description: '插入说话人，通常放在对白上一行。',
    usage: '先点角色，再点对话。',
    snippet: '\n\n                         角色名\n',
  },
  {
    id: 'parenthetical',
    label: '括号',
    icon: Quote,
    description: '给对白补充语气、停顿或小动作。',
    usage: '放在角色名和对白之间。',
    snippet: '                     （语气/动作）\n',
  },
  {
    id: 'dialogue',
    label: '对话',
    icon: MessageCircle,
    description: '插入角色真正说出口的话。',
    usage: '用于角色名下方的对白正文。',
    snippet: '              这里写对白。\n',
  },
  {
    id: 'transition',
    label: '转场',
    icon: Repeat2,
    description: '标记镜头或段落切换，例如 CUT TO。',
    usage: '通常放在一个场景结束处。',
    snippet: '\n                                                    CUT TO:\n\n',
  },
  {
    id: 'note',
    label: '注释',
    icon: MessageSquareText,
    description: '写给自己或协作者的改写备注，不属于正文。',
    usage: '用于记录待补资料、修改意图。',
    snippet: '\n\n[注释：这里记录改写意图或待补资料]\n\n',
  },
  {
    id: 'caption',
    label: '字幕',
    icon: Captions,
    description: '插入屏幕上出现的文字或旁白字幕。',
    usage: '用于片头、信息牌、画外文字。',
    snippet: '\n\n字幕：屏幕上出现的文字。\n\n',
  },
]

const scriptStudioFallbackDraft = `当前章节还没有载入正文。

请先导入文稿、打开章节，或在右侧围绕人物、情节、环境写下本章要求后生成正文。`

const scriptStudioPrimaryPill = 'var(--drama-plm-pill-primary, rgba(23,74,56,0.9))'
const scriptStudioPrimaryPillHover = 'var(--drama-plm-pill-primary-hover, #113d2f)'
const scriptStudioPrimaryPillShadow = 'var(--drama-plm-pill-primary-shadow, rgba(23,74,56,0.18))'
const scriptStudioSecondaryPill = 'var(--drama-plm-pill-secondary, #174a38)'
const scriptStudioPillInk = 'var(--drama-plm-pill-ink, #30342e)'
const scriptStudioPillSurface = 'var(--drama-plm-pill-tertiary, rgba(255,255,255,0.52))'

const scriptStudioChapterColors = [
  'bg-[#5477d4]',
  'bg-[#8b64d9]',
  'bg-[#2f9d72]',
  'bg-[#e1a52d]',
  'bg-[#ce5b50]',
  'bg-[#4c9fc3]',
]

const scriptStudioWorkspaceModes: Array<{
  id: ScriptStudioWorkspaceMode
  label: string
  detail: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  { id: 'creation', label: '创作', detail: '剧本 / 节拍 / 大纲', icon: PenLine },
  { id: 'reader', label: '阅读', detail: '版式 / 批注 / 画笔', icon: Highlighter },
  { id: 'setup', label: '设定', detail: 'Onboarding / Bible', icon: BookOpen },
  { id: 'planning', label: '规划', detail: '主线 / 宏观 / 连续规划', icon: GitBranch },
  { id: 'production', label: '生产', detail: 'Autopilot / 连写', icon: Gauge },
  { id: 'review', label: '审阅', detail: '审稿 / 读者模拟', icon: ShieldCheck },
  { id: 'debug', label: '调试', detail: 'Trace / Prompt / Memory', icon: Bug },
]

function getInitialScriptStudioWorkspaceMode(): ScriptStudioWorkspaceMode {
  const params = new URLSearchParams(globalThis.location?.search ?? '')
  const value = params.get('workspace') ?? params.get('workspaceMode') ?? params.get('plmWorkspace')
  return scriptStudioWorkspaceModes.some((item) => item.id === value)
    ? value as ScriptStudioWorkspaceMode
    : 'creation'
}

function getInitialScriptStudioExperienceMode(): ScriptStudioExperienceMode {
  const params = new URLSearchParams(globalThis.location?.search ?? '')
  const value = params.get('experience') ?? params.get('experienceMode') ?? params.get('plmExperience')
  if (value === 'pro' || value === 'tools') return 'pro'
  const workspace = getInitialScriptStudioWorkspaceMode()
  return workspace === 'creation' ? 'lazy' : 'pro'
}

type ScriptStudioAdvancedAction = {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onClick?: () => void
  disabled?: boolean
  primary?: boolean
}

type ScriptStudioAdvancedMetric = {
  label: string
  value: string
}

type ScriptStudioAdvancedCardView = {
  id: string
  title: string
  eyebrow: string
  body: string
  icon: React.ComponentType<{ className?: string }>
  tone?: 'sage' | 'ink' | 'gold' | 'rose'
  status?: string
  metrics?: ScriptStudioAdvancedMetric[]
  actions?: ScriptStudioAdvancedAction[]
}

function ScriptStudioPlmSurface({
  runtimeStatus,
  novels,
  novel,
  chapterEditor,
  selectedBibleData,
  codexStatus,
  integrationStatus,
  projectGuardStatus,
  lastWritingSpecFailure,
  chapterAnnotations,
  featureState,
  handlers: rawHandlers,
  logs,
  ready,
  busy,
  className,
}: {
  runtimeStatus: PlotPilotRuntimeStatus
  novels: PlotPilotNovel[]
  novel: PlotPilotNovel | null
  chapterEditor?: PlotPilotChapterEditor | null
  selectedBibleData?: PlotPilotBibleEditorData | null
  codexStatus?: PlotPilotCodexStatus | null
  integrationStatus?: PlotPilotIntegrationStatus
  projectGuardStatus?: PlotPilotProjectGuardStatus | null
  lastWritingSpecFailure?: PlotPilotWritingSpecFailureView | null
  chapterAnnotations?: PlotPilotChapterAnnotation[]
  featureState: PlotPilotNativeFeatureState
  handlers?: PlotPilotNativeHandlers
  logs: PlotPilotLogEntry[]
  ready: boolean
  busy: boolean
  className?: string
}) {
  const [experienceMode, setExperienceMode] = React.useState<ScriptStudioExperienceMode>(() => getInitialScriptStudioExperienceMode())
  const [mode, setMode] = React.useState<ScriptStudioMode>('script')
  const [workspaceMode, setWorkspaceMode] = React.useState<ScriptStudioWorkspaceMode>(() => getInitialScriptStudioWorkspaceMode())
  const [activeNav, setActiveNav] = React.useState<ScriptStudioNavId>('script')
  const [draft, setDraft] = React.useState(chapterEditor?.content ?? '')
  const workspaceUploadInputRef = React.useRef<HTMLInputElement | null>(null)
  const chapters = React.useMemo(
    () => createScriptStudioChapters(novel, chapterEditor),
    [novel, chapterEditor],
  )
  const activeChapterNumber = chapterEditor?.chapterNumber ?? chapters[0]?.number ?? 1
  const activeChapter = chapters.find((chapter) => chapter.number === activeChapterNumber) ?? chapters[0] ?? null
  const outlineLines = React.useMemo(
    () => createScriptStudioOutlineLines(novel, featureState),
    [novel, featureState],
  )
  const relationLines = React.useMemo(
    () => createScriptStudioRelations(novel, selectedBibleData),
    [novel, selectedBibleData],
  )
  const characterCards = React.useMemo(
    () => createScriptStudioCharacterCards(novel, selectedBibleData),
    [novel, selectedBibleData],
  )
  const promptCards = React.useMemo(
    () => createScriptStudioPromptCards(featureState),
    [featureState],
  )
  const storyContext = React.useMemo(
    () => createScriptStudioStoryContextBundle({
      novel,
      activeChapter,
      activeChapterNumber,
      chapterEditor,
      outlineLines,
      relationLines,
      characterCards,
      selectedBibleData,
    }),
    [
      activeChapter,
      activeChapterNumber,
      chapterEditor,
      characterCards,
      novel,
      outlineLines,
      relationLines,
      selectedBibleData,
    ],
  )
  const activeJob = runtimeStatus.activeJob
  const runtimeLabel = runtimeMeta[runtimeStatus.state].label
  const completedChapters = chapters.filter((chapter) => chapter.wordCount && chapter.wordCount > 0).length
  const totalChapters = novel?.targetChapters ?? novel?.chapterCount ?? chapters.length
  const progressPct = activeJob?.progress ?? (totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0)
  const canUseNovel = Boolean(novel && ready && !busy)
  const handlers = React.useMemo(
    () => createCodexGuardedHandlers(rawHandlers, codexStatus),
    [rawHandlers, codexStatus],
  )
  const canCreateOrAdd = !busy && (
    !novel
      ? Boolean(handlers?.onCreateNovel)
      : chapters.length === 0
        ? Boolean(handlers?.onPrepareFirstChapter)
        : Boolean(handlers?.onGenerateChapter)
  )
  const canImportWorkspaceFile = Boolean(ready && !busy && handlers?.onImportWorkspaceFile)

  React.useEffect(() => {
    setDraft(chapterEditor?.content ?? '')
  }, [chapterEditor?.chapterId, chapterEditor?.chapterNumber, chapterEditor?.content])

  const selectNav = (nav: ScriptStudioNavId) => {
    setWorkspaceMode('creation')
    setActiveNav(nav)
    if (nav === 'script') setMode('script')
    if (nav === 'beats') setMode('beats')
    if (nav !== 'script' && nav !== 'beats') setMode('outline')
  }

  const createOrAdd = () => {
    if (!novel) {
      handlers?.onCreateNovel?.()
      return
    }
    if (chapters.length === 0) {
      handlers?.onPrepareFirstChapter?.(novel.id)
      return
    }
    handlers?.onGenerateChapter?.(novel.id, activeChapterNumber)
  }

  const openWorkspaceUpload = () => {
    if (!canImportWorkspaceFile) return
    workspaceUploadInputRef.current?.click()
  }

  const importWorkspaceUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return

    const extension = file.name.split('.').pop()?.toLowerCase()
    if (extension !== 'md' && extension !== 'markdown' && extension !== 'txt') {
      window.alert('只支持 Markdown 或 TXT 文件。')
      return
    }

    try {
      handlers?.onImportWorkspaceFile?.({
        fileName: file.name,
        mimeType: file.type || undefined,
        content: await file.text(),
      })
    } catch (error) {
      window.alert(error instanceof Error ? error.message : String(error))
    }
  }

  const saveDraftToLocal = React.useCallback(async () => {
    if (!novel) return
    const chapterTitle = chapterEditor?.title || activeChapter?.title || `第 ${activeChapterNumber} 章`
    const fileName = [
      sanitizeMarkdownFileName(novel.title, '未命名项目'),
      `第${activeChapterNumber}章`,
      sanitizeMarkdownFileName(chapterTitle, '正文'),
    ].join('-') + '.md'
    const markdown = buildLocalChapterMarkdown({
      novel,
      chapterNumber: activeChapterNumber,
      chapterTitle,
      content: draft,
    })

    try {
      await saveMarkdownToLocalFile(fileName, markdown)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      window.alert(error instanceof Error ? error.message : String(error))
    }
  }, [activeChapter?.title, activeChapterNumber, chapterEditor?.title, draft, novel])

  return (
    <div
      className={cn(
        'relative isolate flex h-full min-h-0 flex-1 overflow-hidden bg-[#f2f1ec] text-[#22241f]',
        'font-sans antialiased',
        className,
      )}
    >
      <LiquidEther
        className="absolute inset-0 z-0"
        mouseForce={15}
        cursorSize={120}
        resolution={0.4}
        autoDemo
        autoSpeed={0.3}
        autoIntensity={1.8}
        autoResumeDelay={2000}
        opacity={1}
      />
      <input
        ref={workspaceUploadInputRef}
        type="file"
        accept=".md,.markdown,.txt,text/markdown,text/plain"
        className="sr-only"
        onChange={(event) => void importWorkspaceUpload(event)}
      />

      <aside className="relative z-10 hidden min-h-0 w-[214px] shrink-0 flex-col border-r border-[#dedbd2] bg-[#f8f7f2]/90 text-[#22241f] shadow-[inset_-1px_0_0_rgba(255,255,255,0.7)] backdrop-blur-[2px] md:flex">
        <div className="space-y-1.5 border-b border-[#e3e0d7] px-3 py-3">
          <button
            type="button"
            onClick={handlers?.onImportStorylet}
            className="flex h-8 w-full items-center justify-between rounded-[7px] border border-[#d9d6cd] bg-[#fdfcf8] px-2.5 text-left text-xs font-semibold text-[#2a2d27] shadow-[0_1px_2px_rgba(36,32,24,0.06)] outline-none transition hover:bg-white focus-visible:ring-2 focus-visible:ring-[#174a38]/20"
          >
            <span className="truncate">《{novel?.title ?? '未命名项目'}》</span>
            <ChevronDown className="size-3.5 text-[#737067]" />
          </button>
          <button
            type="button"
            onClick={openWorkspaceUpload}
            disabled={!canImportWorkspaceFile}
            className="flex h-8 w-full items-center gap-2 rounded-[7px] border border-[#d9d6cd] bg-white/55 px-2.5 text-left text-xs font-semibold text-[#315847] shadow-[0_1px_2px_rgba(36,32,24,0.04)] outline-none transition hover:bg-white focus-visible:ring-2 focus-visible:ring-[#174a38]/20 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Upload className="size-3.5 shrink-0" />
            <span className="truncate">导入文稿</span>
          </button>
        </div>

        {experienceMode === 'pro' ? (
          <>
            <nav className="space-y-1 px-3 py-3" aria-label="PLM 工作模式">
              <div className="mb-2 text-xs font-semibold text-[#68645d]">工作模式</div>
              {scriptStudioWorkspaceModes.map((item) => {
                const Icon = item.icon
                const active = workspaceMode === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setWorkspaceMode(item.id)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-[6px] px-2 py-2 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-[#174a38]/20',
                      active ? 'bg-[#e8e7e1] text-[#111411]' : 'text-[#3f433d] hover:bg-[#efeee8]',
                    )}
                  >
                    <Icon className="size-3.5 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold">{item.label}</span>
                      <span className="mt-0.5 block truncate text-[10px] text-[#817c73]">{item.detail}</span>
                    </span>
                  </button>
                )
              })}
            </nav>

            <nav className="space-y-0.5 border-t border-[#e2ded4] px-3 py-3" aria-label="PLM 创作模块">
              <div className="mb-2 text-xs font-semibold text-[#68645d]">创作模块</div>
              {scriptStudioNavItems.map((item) => {
                const Icon = item.icon
                const active = workspaceMode === 'creation' && activeNav === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectNav(item.id)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex h-8 w-full items-center gap-2 rounded-[6px] px-2 text-left text-xs font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-[#174a38]/20',
                      active ? 'bg-[#e8e7e1] text-[#111411]' : 'text-[#3f433d] hover:bg-[#efeee8]',
                    )}
                  >
                    <Icon className="size-3.5 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </nav>
          </>
        ) : (
          <ScriptStudioLazySidebar
            novel={novel}
            activeChapterNumber={activeChapterNumber}
            activeJob={activeJob}
            ready={ready}
            busy={busy}
            storyContext={storyContext}
            canImportWorkspaceFile={canImportWorkspaceFile}
            onImportWorkspaceFile={openWorkspaceUpload}
            onSave={() => void saveDraftToLocal()}
          />
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
          <div className="mb-2 mt-1 text-xs font-semibold text-[#68645d]">节拍</div>
          <div className="space-y-1">
            {chapters.map((chapter) => (
              <button
                key={chapter.id}
                type="button"
                onClick={() => novel ? handlers?.onOpenChapter?.(novel.id, chapter.number) : undefined}
                className={cn(
                  'group flex h-8 w-full items-center gap-1.5 rounded-[6px] border border-transparent bg-[#fdfcf8] px-2 text-left text-[11px] text-[#3a3d37] shadow-[0_1px_2px_rgba(36,32,24,0.045)] outline-none transition',
                  chapter.number === activeChapterNumber
                    ? 'border-[#d1cdc1] bg-white'
                    : 'hover:border-[#dfdbd0] hover:bg-white',
                )}
              >
                <GripVertical className="size-3 shrink-0 text-[#b7b3aa]" />
                <span className={cn('size-1.5 shrink-0 rounded-full', chapter.colorClassName)} />
                <span className="truncate">{chapter.number} {chapter.title}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-[#e2ded4] px-3 py-3">
          <ScriptStudioExperienceSwitch value={experienceMode} onChange={setExperienceMode} />
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-full bg-[#d9d3c6] text-xs font-bold text-[#284235]">
              诗
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-[#2a2d27]">shizhi</div>
              <div className="text-[10px] text-[#817c73]">Master</div>
            </div>
            <ChevronDown className="size-3.5 text-[#817c73]" />
          </div>
        </div>
      </aside>

      <main className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-[#e0ddd4] bg-[#fbfaf6]/96 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="text-sm font-semibold text-[#2a2d27]">
              {scriptStudioWorkspaceModes.find((item) => item.id === workspaceMode)?.label ?? '创作'}
            </div>
            <div className="rounded-[5px] bg-[#f0eee7] px-2 py-1 font-mono text-xs text-[#4f514b]">
              {novel?.chapterCount ?? chapters.length}
            </div>
          </div>

          {experienceMode === 'pro' ? (
            <div className="hidden max-w-[680px] items-center gap-1 overflow-x-auto rounded-[7px] border border-[#e3e0d8] bg-[#f7f6f1] p-1 shadow-[0_1px_2px_rgba(36,32,24,0.04)] sm:flex">
              {scriptStudioWorkspaceModes.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setWorkspaceMode(item.id)}
                    aria-pressed={workspaceMode === item.id}
                    className={cn(
                      'flex h-7 items-center gap-1.5 rounded-[5px] px-2.5 text-xs font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-[#174a38]/20',
                      workspaceMode === item.id ? 'bg-white text-[#1c241f] shadow-[0_1px_2px_rgba(36,32,24,0.08)]' : 'text-[#858077] hover:text-[#3d4039]',
                    )}
                  >
                    <Icon className="size-3.5" />
                    {item.label}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="hidden items-center gap-2 rounded-full border border-[#dfe3d8] px-3 py-1 text-xs font-semibold text-[#315847] shadow-[0_1px_2px_rgba(36,32,24,0.04)] sm:flex" style={{ backgroundColor: 'rgba(255,255,255,0.48)' }}>
              <WandSparkles className="size-3.5" />
              写作模式
            </div>
          )}

          {experienceMode === 'pro' ? (
            <div className={cn(
              'hidden items-center gap-1 rounded-[7px] border border-[#e3e0d8] bg-[#f7f6f1] p-1 shadow-[0_1px_2px_rgba(36,32,24,0.04)] lg:flex',
              workspaceMode !== 'creation' && 'opacity-50',
            )}>
              {([
                ['script', '编辑', PenLine],
                ['beats', '节拍', ListChecks],
                ['outline', '大纲', ScrollText],
              ] as const).map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setWorkspaceMode('creation')
                    setMode(id)
                  }}
                  aria-pressed={workspaceMode === 'creation' && mode === id}
                  className={cn(
                    'flex h-7 items-center gap-1.5 rounded-[5px] px-2.5 text-xs font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-[#174a38]/20',
                    workspaceMode === 'creation' && mode === id ? 'bg-white text-[#1c241f] shadow-[0_1px_2px_rgba(36,32,24,0.08)]' : 'text-[#858077] hover:text-[#3d4039]',
                  )}
                >
                  <Icon className="size-3.5" />
                  {label}
                </button>
              ))}
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <IntegrationBadge status={integrationStatus} />
            <RuntimeBadge state={runtimeStatus.state} />
            <button
              type="button"
              onClick={createOrAdd}
              disabled={!canCreateOrAdd}
              className="flex h-8 items-center gap-1.5 rounded-[7px] bg-[#174a38] px-3 text-xs font-semibold text-white shadow-[0_2px_5px_rgba(23,74,56,0.18)] outline-none transition hover:bg-[#113d2f] focus-visible:ring-2 focus-visible:ring-[#174a38]/25 disabled:cursor-not-allowed disabled:opacity-45"
              style={{
                background: `linear-gradient(180deg, ${scriptStudioPrimaryPill}, ${scriptStudioPrimaryPillHover})`,
                boxShadow: `0 2px 8px ${scriptStudioPrimaryPillShadow}`,
              }}
            >
              <Plus className="size-3.5" />
              添加
            </button>
          </div>
        </header>

        <section className="min-h-0 flex-1 overflow-auto bg-transparent px-3 py-4 lg:px-6">
          <ScriptStudioLayerFailureBanner
            runtimeStatus={runtimeStatus}
            integrationStatus={integrationStatus}
            codexStatus={codexStatus}
            handlers={rawHandlers}
            busy={busy}
          />
          {experienceMode === 'lazy' ? (
            <ScriptStudioLazyWorkspace
              novel={novel}
              activeChapterNumber={activeChapterNumber}
              activeChapterTitle={chapterEditor?.title ?? activeChapter?.title ?? novel?.title ?? '新剧本'}
              draft={draft}
              onDraftChange={setDraft}
              ready={ready}
              busy={busy}
              handlers={handlers}
              activeJob={activeJob}
              completedChapters={completedChapters}
              totalChapters={totalChapters}
              progressPct={progressPct}
              codexStatus={codexStatus}
              projectGuardStatus={projectGuardStatus}
              lastWritingSpecFailure={lastWritingSpecFailure}
              chapterAnnotations={chapterAnnotations}
              storyContext={storyContext}
              onOpenPro={() => setExperienceMode('pro')}
            />
          ) : workspaceMode === 'creation' ? (
            <div className="grid min-h-full w-full min-w-[720px] grid-cols-[minmax(0,1fr)_264px] gap-5 xl:grid-cols-[minmax(0,1fr)_284px]">
              <div className="min-w-0">
                {mode === 'script' ? (
                  <ScriptStudioPaper
                    title="剧本"
                    subtitle={chapterEditor?.title ?? activeChapter?.title ?? novel?.title ?? '新剧本'}
                    draft={draft}
                    placeholder={scriptStudioFallbackDraft}
                    onDraftChange={setDraft}
                    novel={novel}
                    chapterNumber={activeChapterNumber}
                    ready={ready}
                    busy={busy}
                    handlers={handlers}
                  />
                ) : null}

                {mode === 'beats' ? (
                  <ScriptStudioBeatPaper
                    novel={novel}
                    chapters={chapters}
                    activeChapterNumber={activeChapterNumber}
                    onOpenChapter={(chapterNumber) => novel ? handlers?.onOpenChapter?.(novel.id, chapterNumber) : undefined}
                  />
                ) : null}

                {mode === 'outline' ? (
                  <ScriptStudioOutlinePaper
                    novel={novel}
                    outlineLines={outlineLines}
                    featureState={featureState}
                    ready={ready}
                    busy={busy}
                    handlers={handlers}
                  />
                ) : null}

                <div className="mx-auto mt-4 flex max-w-[420px] items-center gap-3 text-sm font-semibold text-[#315847]">
                  <span className={mode === 'outline' ? 'text-[#174a38]' : 'text-[#8a867c]'}>大纲</span>
                  <span className="text-[#b4afa5]">→</span>
                  <span className={mode === 'beats' ? 'text-[#174a38]' : 'text-[#8a867c]'}>节拍</span>
                  <span className="text-[#b4afa5]">→</span>
                  <span className={mode === 'script' ? 'text-[#174a38]' : 'text-[#8a867c]'}>剧本</span>
                  <span className="h-px min-w-12 flex-1 bg-[#dad6cc]" />
                  <span className="font-mono text-lg text-[#315847]">
                    {String(Math.min(activeChapterNumber, 99)).padStart(2, '0')} / {String(Math.max(totalChapters, 1)).padStart(2, '0')}
                  </span>
                </div>
              </div>

            <ScriptStudioRightRail
              mode={mode}
              logs={logs}
              outlineLines={outlineLines}
              relationLines={relationLines}
              characterCards={characterCards}
              promptCards={promptCards}
              activeJob={activeJob}
              canUseNovel={canUseNovel}
              runtimeLabel={runtimeLabel}
              progressPct={progressPct}
              completedChapters={completedChapters}
              totalChapters={totalChapters}
              draft={draft}
              novel={novel}
              codexStatus={codexStatus}
              integrationStatus={integrationStatus}
              projectGuardStatus={projectGuardStatus}
              lastWritingSpecFailure={lastWritingSpecFailure}
              handlers={handlers}
            />
          </div>
          ) : workspaceMode === 'reader' ? (
            <ScriptStudioMagazineReaderWorkspace
              novel={novel}
              chapterNumber={activeChapterNumber}
              title={chapterEditor?.title ?? activeChapter?.title ?? novel?.title ?? '阅读批注'}
              draft={draft}
              placeholder={scriptStudioFallbackDraft}
              chapterAnnotations={chapterAnnotations}
              handlers={handlers}
              ready={ready}
              busy={busy}
            />
          ) : (
            <ScriptStudioAdvancedWorkspace
              workspaceMode={workspaceMode}
              runtimeStatus={runtimeStatus}
              logs={logs}
              novels={novels}
              novel={novel}
              chapterEditor={chapterEditor}
              selectedBibleData={selectedBibleData}
              featureState={featureState}
              handlers={handlers}
              ready={ready}
              busy={busy}
              codexStatus={codexStatus}
              integrationStatus={integrationStatus}
              projectGuardStatus={projectGuardStatus}
              lastWritingSpecFailure={lastWritingSpecFailure}
            />
          )}
        </section>
      </main>
    </div>
  )
}

function ScriptStudioExperienceSwitch({
  value,
  onChange,
}: {
  value: ScriptStudioExperienceMode
  onChange: (value: ScriptStudioExperienceMode) => void
}) {
  return (
    <div className="mb-3 rounded-[9px] border border-[#dedbd2] p-1" style={{ backgroundColor: 'rgba(255,255,255,0.48)' }}>
      <div className="grid grid-cols-2 gap-1">
        {([
          ['lazy', '写作', WandSparkles],
          ['pro', '工具', SlidersHorizontal],
        ] as const).map(([id, label, Icon]) => {
          const active = value === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-pressed={active}
              className="flex h-7 items-center justify-center gap-1 rounded-[7px] text-[11px] font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-[#174a38]/20"
              style={{
                backgroundColor: active ? scriptStudioPrimaryPill : 'transparent',
                color: active ? '#fff' : '#555a51',
                boxShadow: active ? `0 5px 14px ${scriptStudioPrimaryPillShadow}` : 'none',
              }}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ScriptStudioLazySidebar({
  novel,
  activeChapterNumber,
  activeJob,
  ready,
  busy,
  storyContext,
  canImportWorkspaceFile,
  onImportWorkspaceFile,
  onSave,
}: {
  novel: PlotPilotNovel | null
  activeChapterNumber: number
  activeJob?: PlotPilotGenerationJob | null
  ready: boolean
  busy: boolean
  storyContext: PlotPilotStoryContextBundle
  canImportWorkspaceFile: boolean
  onImportWorkspaceFile: () => void
  onSave: () => void
}) {
  const disabled = !ready || busy
  const triadCards = storyContext.cards.filter((card) => card.kind !== 'style')

  return (
    <div className="border-b border-[#e2ded4] px-3 py-3">
      <div className="mb-2 text-xs font-semibold text-[#68645d]">小说三要素</div>
      <div className="space-y-1.5">
        {triadCards.map((card) => {
          const meta = storyContextMeta(card.kind)
          const Icon = meta.icon
          return (
            <div
              key={card.id}
              className="rounded-[8px] border border-[#e1ddd2] px-2.5 py-2"
              style={{ backgroundColor: 'rgba(255,255,255,0.46)' }}
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: meta.color }}>
                <Icon className="size-3.5" />
                {meta.label}
              </div>
              <div className="mt-1 line-clamp-2 text-[11px] leading-4 text-[#6f6b63]">{card.body}</div>
            </div>
          )
        })}
      </div>

      <div className="mt-3 space-y-1.5">
        <button
          type="button"
          onClick={onImportWorkspaceFile}
          disabled={!canImportWorkspaceFile}
          className="flex h-9 w-full items-center gap-2 rounded-[8px] px-2 text-left text-xs font-semibold outline-none transition hover:opacity-90 disabled:opacity-45"
          style={{
            backgroundColor: scriptStudioPrimaryPill,
            boxShadow: `0 12px 24px ${scriptStudioPrimaryPillShadow}`,
            color: '#fff',
          }}
        >
          <Upload className="size-3.5" />
          导入文稿
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={disabled || !novel}
          className="flex h-9 w-full items-center gap-2 rounded-[8px] px-2 text-left text-xs font-semibold outline-none transition hover:opacity-90 disabled:opacity-45"
          style={{
            backgroundColor: scriptStudioPrimaryPill,
            boxShadow: `0 12px 24px ${scriptStudioPrimaryPillShadow}`,
            color: '#fff',
          }}
        >
          <Save className="size-3.5" />
          保存到本地
        </button>
      </div>
      <div className="mt-3 rounded-[8px] border border-[#e1ddd2] px-2.5 py-2" style={{ backgroundColor: 'rgba(255,255,255,0.38)' }}>
        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7c766b]">当前</div>
        <div className="mt-1 truncate text-xs font-semibold text-[#2a2d27]">
          第 {activeChapterNumber} 章
        </div>
        <div className="mt-1 truncate text-[11px] text-[#6f6b63]">
          {activeJob?.label ?? (ready ? '准备好了' : '正在准备')}
        </div>
      </div>
    </div>
  )
}

function ScriptStudioLazyWorkspace({
  novel,
  activeChapterNumber,
  activeChapterTitle,
  draft,
  onDraftChange,
  ready,
  busy,
  handlers,
  activeJob,
  codexStatus,
  projectGuardStatus,
  lastWritingSpecFailure,
  chapterAnnotations,
  storyContext,
  onOpenPro,
}: {
  novel: PlotPilotNovel | null
  activeChapterNumber: number
  activeChapterTitle: string
  draft: string
  onDraftChange: (value: string) => void
  ready: boolean
  busy: boolean
  handlers?: PlotPilotNativeHandlers
  activeJob?: PlotPilotGenerationJob | null
  completedChapters: number
  totalChapters: number
  progressPct: number
  codexStatus?: PlotPilotCodexStatus | null
  projectGuardStatus?: PlotPilotProjectGuardStatus | null
  lastWritingSpecFailure?: PlotPilotWritingSpecFailureView | null
  chapterAnnotations?: PlotPilotChapterAnnotation[]
  storyContext: PlotPilotStoryContextBundle
  onOpenPro: () => void
}) {
  const [chatPrompt, setChatPrompt] = React.useState('')
  const [annotations, setAnnotations] = React.useState<PlotPilotChapterAnnotation[]>(chapterAnnotations ?? [])
  const [chatAnnotationIds, setChatAnnotationIds] = React.useState<string[]>([])
  const [chatStoryContextIds, setChatStoryContextIds] = React.useState<string[]>([])
  const canUseNovel = Boolean(novel && ready && !busy)
  const canSave = Boolean(canUseNovel && handlers?.onSaveChapter)
  const canContinue = Boolean((novel && ready && !busy && handlers?.onGenerateChapter) || (!novel && !busy && handlers?.onCreateNovel))
  const canCheck = Boolean(canUseNovel && handlers?.onReviewChapter)
  const wordCount = countDraftText(draft)
  const chatAnnotations = React.useMemo(
    () => chatAnnotationIds
      .map((annotationId) => annotations.find((annotation) => annotation.id === annotationId))
      .filter((annotation): annotation is PlotPilotChapterAnnotation => Boolean(annotation)),
    [annotations, chatAnnotationIds],
  )
  const chatStoryContextCards = React.useMemo(
    () => chatStoryContextIds
      .map((cardId) => storyContext.cards.find((card) => card.id === cardId))
      .filter((card): card is PlotPilotStoryContextCard => Boolean(card)),
    [chatStoryContextIds, storyContext.cards],
  )
  const storyContextForRequest = React.useMemo<PlotPilotStoryContextBundle>(() => ({
    ...storyContext,
    focusCardIds: chatStoryContextIds,
  }), [chatStoryContextIds, storyContext])
  const revisionContext = React.useMemo<PlotPilotChapterRevisionContext>(() => ({
    annotations,
    storyContext: storyContextForRequest,
  }), [annotations, storyContextForRequest])

  React.useEffect(() => {
    setAnnotations(chapterAnnotations ?? [])
  }, [chapterAnnotations, novel?.id, activeChapterNumber])

  React.useEffect(() => {
    setChatAnnotationIds((current) => current.filter((annotationId) => (
      annotations.some((annotation) => annotation.id === annotationId)
    )))
  }, [annotations])

  React.useEffect(() => {
    setChatStoryContextIds((current) => current.filter((cardId) => (
      storyContext.cards.some((card) => card.id === cardId)
    )))
  }, [storyContext.cards])

  const updateAnnotations = React.useCallback((nextAnnotations: PlotPilotChapterAnnotation[]) => {
    setAnnotations(nextAnnotations)
    if (novel) {
      handlers?.onSaveChapterAnnotations?.(novel.id, activeChapterNumber, nextAnnotations)
    }
  }, [activeChapterNumber, handlers, novel])

  const addAnnotationToChat = React.useCallback((annotationId: string) => {
    setChatAnnotationIds((current) => current.includes(annotationId) ? current : [...current, annotationId])
  }, [])

  const removeAnnotationFromChat = React.useCallback((annotationId: string) => {
    setChatAnnotationIds((current) => current.filter((item) => item !== annotationId))
  }, [])

  const toggleStoryContextFocus = React.useCallback((cardId: string) => {
    setChatStoryContextIds((current) => (
      current.includes(cardId)
        ? current.filter((item) => item !== cardId)
        : [...current, cardId]
    ))
  }, [])

  const removeStoryContextFocus = React.useCallback((cardId: string) => {
    setChatStoryContextIds((current) => current.filter((item) => item !== cardId))
  }, [])

  const saveDraft = () => {
    if (!novel) return
    handlers?.onSaveChapter?.(novel.id, activeChapterNumber, draft, revisionContext)
  }

  const continueWriting = () => {
    if (!novel) {
      handlers?.onCreateNovel?.()
      return
    }
    handlers?.onGenerateChapter?.(novel.id, activeChapterNumber, revisionContext)
  }

  const checkChapter = () => {
    if (!novel) return
    handlers?.onReviewChapter?.(novel.id, activeChapterNumber)
  }

  const submitChatPrompt = () => {
    const instruction = chatPrompt.trim()
    if (!instruction && chatAnnotations.length === 0 && chatStoryContextCards.length === 0) return
    if (!novel) {
      handlers?.onCreateNovel?.()
      return
    }
    handlers?.onGenerateChapter?.(novel.id, activeChapterNumber, {
      annotations: chatAnnotations,
      instruction,
      storyContext: storyContextForRequest,
    })
    setChatPrompt('')
    setChatAnnotationIds([])
    setChatStoryContextIds([])
  }

  return (
    <div
      data-plm-lazy-layout="reader-left-controls-right"
      className="mx-auto grid min-h-full w-full max-w-[1180px] gap-5 lg:grid-cols-[minmax(0,1fr)_320px]"
    >
      <ScriptStudioLazyPaper
        title={activeChapterTitle}
        chapterNumber={activeChapterNumber}
        draft={draft}
        placeholder={scriptStudioFallbackDraft}
        annotations={annotations}
        chatAnnotationIds={chatAnnotationIds}
        onAnnotationsChange={updateAnnotations}
        onAddAnnotationToChat={addAnnotationToChat}
        onDraftChange={(value) => {
          onDraftChange(value)
          handlers?.onChangeChapterDraft?.(value)
        }}
      />

      <aside
        data-plm-control-rail="true"
        className="h-fit overflow-x-visible rounded-[20px] border p-3 shadow-[0_24px_70px_rgba(43,38,27,0.14)] backdrop-blur-2xl lg:sticky lg:top-4 lg:max-h-[calc(100vh-132px)] lg:overflow-y-auto"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.62), rgba(246,244,238,0.28))',
          borderColor: 'rgba(255,255,255,0.62)',
          WebkitBackdropFilter: 'blur(26px) saturate(1.32)',
          backdropFilter: 'blur(26px) saturate(1.32)',
        }}
      >
        <section
          className="relative overflow-hidden rounded-[18px] border border-[#d9d2c3] p-3 shadow-[0_16px_34px_rgba(43,38,27,0.11)]"
          style={{
            background: [
              'radial-gradient(circle at 10px 10px, rgba(80,74,61,0.13) 1.7px, transparent 1.8px)',
              'linear-gradient(135deg, rgba(255,255,255,0.88), rgba(237,234,224,0.62))',
            ].join(', '),
            backgroundSize: '15px 15px, auto',
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#315847]">
                <WandSparkles className="size-3.5" />
                写作卡组
              </div>
              <h2 className="mt-1 truncate text-xl font-semibold text-[#20241f]">AI 写作助手</h2>
              <div className="mt-1 text-[11px] leading-5 text-[#6f6b63]">
                {activeJob?.label ?? (ready ? '可以开始写' : '正在准备写作环境')}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                title="保存当前章"
                aria-label="保存当前章"
                onClick={saveDraft}
                disabled={!canSave}
                className="grid size-8 place-items-center rounded-[9px] border border-[#ded9cd] text-[#70766d] outline-none transition hover:bg-white/72 hover:text-[#174a38] disabled:cursor-not-allowed disabled:opacity-35"
                style={{ backgroundColor: 'rgba(255,255,255,0.62)' }}
              >
                <Save className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={onOpenPro}
                className="grid size-8 place-items-center rounded-[9px] border border-[#ded9cd] text-[#555a51] outline-none transition hover:bg-white/72 hover:text-[#174a38]"
                style={{ backgroundColor: 'rgba(255,255,255,0.62)' }}
                title="更多工具"
                aria-label="更多工具"
              >
                <SlidersHorizontal className="size-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <ScriptStudioLazyMetric label="章节" value={`第 ${activeChapterNumber} 章`} />
            <ScriptStudioLazyMetric label="字数" value={`${wordCount || novel?.wordCount || 0} 字`} />
            <ScriptStudioLazyMetric label="批注" value={`${annotations.length} 条`} />
          </div>

          <div className="mt-3 rounded-[12px] border border-[#e2ddd2] px-3 py-2.5" style={{ backgroundColor: 'rgba(255,255,255,0.52)' }}>
            <div className="flex items-center justify-between gap-2 text-[11px] leading-5 text-[#6f6b63]">
              <span>AI {codexStatus?.authenticated ? '已连接' : '未连接'}</span>
              <span>WritingSpec {projectGuardStatus?.writingSpecId ? 'on' : '未设置'}</span>
            </div>
          </div>
        </section>

        {lastWritingSpecFailure ? (
          <div className="mt-3 rounded-[10px] border border-[#ead7a0] px-3 py-2 text-xs leading-5 text-[#6d540b]" style={{ backgroundColor: 'rgba(255,249,232,0.72)' }}>
            {lastWritingSpecFailure.message}
          </div>
        ) : null}

        <ScriptStudioStoryContextPanel
          storyContext={storyContext}
          focusCardIds={chatStoryContextIds}
          onToggleFocus={toggleStoryContextFocus}
        />

        <section
          className="mt-3 overflow-hidden rounded-[18px] border p-3 text-white shadow-[0_18px_38px_rgba(43,38,27,0.18)]"
          style={{
            ...storyContextComicBackground('character', chatPrompt.trim().length > 0 || chatStoryContextCards.length > 0 || chatAnnotations.length > 0),
            borderColor: 'rgba(103,126,113,0.48)',
          }}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-white">Agent 对话卡</div>
              <div className="mt-0.5 text-[11px] text-white/76">人物、情节、环境、批注一起发送</div>
            </div>
            <span className="grid size-9 place-items-center rounded-full bg-white/18 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.24)]">
              <MessageSquareText className="size-4" />
            </span>
          </div>

          {chatStoryContextCards.length > 0 || chatAnnotations.length > 0 ? (
            <div className="mb-3 grid gap-1.5">
              {chatStoryContextCards.map((card) => {
                const meta = storyContextMeta(card.kind)
                const Icon = meta.icon
                return (
                  <button
                    key={card.id}
                    type="button"
                    title="从对话移除"
                    onClick={() => removeStoryContextFocus(card.id)}
                    className="group flex min-h-10 w-full items-center gap-2 rounded-[12px] border border-[#d7e1d9] bg-[#f7fffa]/70 px-2 text-left outline-none transition hover:bg-white/82"
                  >
                    <span className="grid size-7 shrink-0 place-items-center rounded-[9px]" style={{ backgroundColor: meta.bg, color: meta.color }}>
                      <Icon className="size-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-[#315847]">{card.title}</span>
                      <span className="block truncate text-[10px] text-[#7b8d81]">{meta.label} context</span>
                    </span>
                    <span className="text-[#8aa093] group-hover:text-[#65776d]" aria-hidden="true">×</span>
                  </button>
                )
              })}
              {chatAnnotations.map((annotation, index) => (
                <button
                  key={annotation.id}
                  type="button"
                  title="从对话移除"
                  onClick={() => removeAnnotationFromChat(annotation.id)}
                  className="group flex min-h-10 w-full items-center gap-2 rounded-[12px] border border-[#ded8ca] bg-white/62 px-2 text-left outline-none transition hover:bg-white/82"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-[9px] bg-[#f6efd9] text-[#7b5b19]">
                    <Quote className="size-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-[#4c554c]">批注 {index + 1}</span>
                    <span className="block truncate text-[10px] text-[#8a867c]">{annotation.quote}</span>
                  </span>
                  <span className="text-[#9a948a] group-hover:text-[#7b766c]" aria-hidden="true">×</span>
                </button>
              ))}
            </div>
          ) : null}

          <label className="block rounded-[16px] bg-white/94 p-3 text-[#28241e] shadow-[0_10px_24px_rgba(43,38,27,0.14)]">
            <span className="text-xs font-semibold text-[#4d554c]">你想让它怎么写？</span>
            <textarea
              value={chatPrompt}
              onChange={(event) => setChatPrompt(event.currentTarget.value)}
              placeholder="比如：围绕人物关系改甜一点；情节别提前开挂；环境多一点高淳潮热和小镇闲话"
              className="mt-2 min-h-24 w-full resize-none rounded-[14px] border border-[#ded9cd] px-3 py-2 text-sm leading-6 text-[#28241e] shadow-inner outline-none placeholder:text-[#9a948a] focus:border-[#174a38]/45"
              style={{ backgroundColor: 'rgba(250,249,245,0.9)' }}
            />
          </label>
          <button
            type="button"
            onClick={submitChatPrompt}
            disabled={!ready || busy || (!chatPrompt.trim() && chatAnnotations.length === 0 && chatStoryContextCards.length === 0)}
            className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-[14px] border border-white/34 bg-white/22 px-3 py-2 text-sm font-semibold text-white outline-none transition hover:bg-white/28 disabled:cursor-not-allowed disabled:opacity-45"
            style={{
              background: `linear-gradient(180deg, ${scriptStudioSecondaryPill}, ${scriptStudioPrimaryPill})`,
              boxShadow: `0 14px 28px ${scriptStudioPrimaryPillShadow}`,
            }}
          >
            <Sparkles className="size-4" />
            发送给 Agent
          </button>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <ScriptStudioLazyActionButton
              icon={Sparkles}
              label={novel ? '续写本章' : '新建一本书'}
              detail={novel ? '快捷继续' : '创建项目'}
              onClick={continueWriting}
              disabled={!canContinue}
            />
            <ScriptStudioLazyActionButton icon={ShieldCheck} label="检查节奏" detail="看问题" onClick={checkChapter} disabled={!canCheck} />
          </div>
        </section>

        <ScriptStudioMusicPlayer className="mt-3" />
      </aside>
    </div>
  )
}

function ScriptStudioLazyMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] border border-[#e2ddd2] px-3 py-2" style={{ backgroundColor: 'rgba(255,255,255,0.42)' }}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#8a867c]">{label}</div>
      <div className="mt-1 truncate text-sm font-semibold text-[#252822]">{value}</div>
    </div>
  )
}

function storyContextMeta(kind: PlotPilotStoryContextKind) {
  switch (kind) {
    case 'character':
      return { label: '人物', icon: UserRound, color: '#315847', bg: 'rgba(234,246,239,0.68)', short: '人' }
    case 'plot':
      return { label: '情节', icon: GitBranch, color: '#4d5685', bg: 'rgba(237,240,252,0.68)', short: '节' }
    case 'world':
      return { label: '环境', icon: MapPin, color: '#6a4a17', bg: 'rgba(255,247,229,0.68)', short: '境' }
    case 'style':
      return { label: '文风', icon: Palette, color: '#6b3f5f', bg: 'rgba(252,238,248,0.68)', short: '风' }
  }
}

function storyContextComicBackground(kind: PlotPilotStoryContextKind, active: boolean) {
  const palette: Record<PlotPilotStoryContextKind, { from: string; to: string; dot: string; border: string }> = {
    character: {
      from: 'var(--drama-plm-card-character-from, rgba(168,185,173,0.96))',
      to: 'var(--drama-plm-card-character-to, rgba(122,142,130,0.9))',
      dot: 'var(--drama-plm-card-character-dot, rgba(45,61,52,0.24))',
      border: 'var(--drama-plm-card-character-border, rgba(103,126,113,0.45))',
    },
    plot: {
      from: 'var(--drama-plm-card-plot-from, rgba(163,171,207,0.96))',
      to: 'var(--drama-plm-card-plot-to, rgba(104,114,162,0.9))',
      dot: 'var(--drama-plm-card-plot-dot, rgba(41,49,91,0.24))',
      border: 'var(--drama-plm-card-plot-border, rgba(94,105,153,0.45))',
    },
    world: {
      from: 'var(--drama-plm-card-world-from, rgba(202,181,131,0.96))',
      to: 'var(--drama-plm-card-world-to, rgba(151,126,70,0.9))',
      dot: 'var(--drama-plm-card-world-dot, rgba(80,60,22,0.22))',
      border: 'var(--drama-plm-card-world-border, rgba(139,111,53,0.45))',
    },
    style: {
      from: 'var(--drama-plm-card-style-from, rgba(205,166,195,0.96))',
      to: 'var(--drama-plm-card-style-to, rgba(149,96,134,0.9))',
      dot: 'var(--drama-plm-card-style-dot, rgba(91,44,80,0.22))',
      border: 'var(--drama-plm-card-style-border, rgba(139,88,126,0.45))',
    },
  }
  const color = palette[kind]
  const glow = active ? 'radial-gradient(circle at 78% 10%, rgba(255,255,255,0.38), transparent 34%)' : 'radial-gradient(circle at 78% 10%, rgba(255,255,255,0.18), transparent 32%)'
  return {
    background: [
      `radial-gradient(circle at 8px 8px, ${color.dot} 1.8px, transparent 2px)`,
      glow,
      `linear-gradient(145deg, ${color.from}, ${color.to})`,
    ].join(', '),
    backgroundSize: '15px 15px, auto, auto',
    borderColor: color.border,
  }
}

function ScriptStudioStoryContextPanel({
  storyContext,
  focusCardIds,
  onToggleFocus,
}: {
  storyContext: PlotPilotStoryContextBundle
  focusCardIds: string[]
  onToggleFocus: (cardId: string) => void
}) {
  return (
    <section className="mt-3 overflow-visible">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-[#252822]">小说三要素</div>
          <div className="mt-0.5 text-[11px] text-[#817c73]">Story cards</div>
        </div>
        <div className="text-[10px] font-semibold text-[#8a867c]">向左展开</div>
      </div>
      <div className="-mx-1 overflow-x-auto overflow-y-visible pb-2">
        <div className="flex min-w-max flex-row-reverse justify-end gap-2 px-1">
        {storyContext.cards.map((card) => {
          const meta = storyContextMeta(card.kind)
          const Icon = meta.icon
          const active = focusCardIds.includes(card.id)
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onToggleFocus(card.id)}
              aria-pressed={active}
              className={cn(
                'group relative h-[176px] shrink-0 overflow-hidden rounded-[18px] border p-3 text-left text-white shadow-[0_18px_36px_rgba(43,38,27,0.16)] outline-none transition-[width,transform,box-shadow] duration-300 hover:-translate-x-1 focus-visible:ring-2 focus-visible:ring-[#174a38]/25',
                active
                  ? 'w-[286px]'
                  : 'w-[232px] hover:w-[286px]',
              )}
              style={storyContextComicBackground(card.kind, active)}
            >
              <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white/86">
                    <Icon className="size-3.5" />
                    {meta.label}
                  </div>
                  <div className="mt-1 line-clamp-1 text-base font-semibold text-white">{card.title}</div>
                  <div className="mt-0.5 text-[11px] text-white/72">{card.kind}.profile</div>
                </div>
                <span className="shrink-0 rounded-full bg-white/22 px-2 py-1 text-[10px] font-semibold text-white">
                  {active ? '已加入' : '加入'}
                </span>
              </div>
              <p className="relative z-10 mt-3 line-clamp-3 text-xs leading-5 text-white/86">{card.body}</p>
              <div className="absolute inset-x-3 bottom-3 z-10 flex h-12 items-center gap-2 rounded-[14px] bg-white/94 px-3 text-[#555a51] shadow-[0_10px_22px_rgba(43,38,27,0.14)]">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#f4f2eb] text-sm font-semibold text-[#31352f]">{meta.short}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-[#2f332d]">{meta.label}</span>
                  <span className="block truncate text-[10px] text-[#7f7a70]">加入 Agent 对话</span>
                </span>
                <ChevronDown className="size-4 shrink-0 text-[#7f7a70]" />
              </div>
            </button>
          )
        })}
        </div>
      </div>
    </section>
  )
}

function ScriptStudioLazyActionButton({
  icon: Icon,
  label,
  detail,
  onClick,
  disabled,
  primary = false,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  detail?: string
  onClick: () => void
  disabled?: boolean
  primary?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-10 items-center justify-center gap-2 rounded-[10px] border px-3 py-2 text-sm font-semibold outline-none transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
      style={{
        background: primary ? `linear-gradient(180deg, ${scriptStudioPrimaryPill}, ${scriptStudioPrimaryPillHover})` : scriptStudioPillSurface,
        borderColor: primary ? scriptStudioPrimaryPill : '#ded9cd',
        color: primary ? '#fff' : scriptStudioPillInk,
        boxShadow: primary ? `0 12px 26px ${scriptStudioPrimaryPillShadow}` : '0 8px 18px rgba(43,38,27,0.06)',
      }}
    >
      <Icon className="size-4" />
      <span className="min-w-0 text-left leading-tight">
        <span className="block truncate">{label}</span>
        {detail ? <span className={primary ? 'block truncate text-[11px] font-medium text-white/72' : 'block truncate text-[11px] font-medium text-[#7b766c]'}>{detail}</span> : null}
      </span>
    </button>
  )
}

const scriptStudioAnnotationColorClassNames: Record<ScriptStudioAnnotationColor, string> = {
  amber: 'bg-[#f8d676]/50 ring-[#d9aa2b]/22',
  mint: 'bg-[#9edfc4]/42 ring-[#2f8b68]/22',
  rose: 'bg-[#f4a4a4]/38 ring-[#b95252]/22',
  sky: 'bg-[#9fb8ef]/42 ring-[#4775bf]/22',
}

const scriptStudioAnnotationColors: ScriptStudioAnnotationColor[] = ['rose', 'mint', 'sky', 'amber']

function createScriptStudioAnnotationId() {
  return `ann-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function isScriptStudioInkAnnotation(
  annotation: PlotPilotChapterAnnotation,
): annotation is PlotPilotChapterAnnotation & { ink: PlotPilotReaderInkStroke } {
  return annotation.kind === 'ink' && Array.isArray(annotation.ink?.points) && annotation.ink.points.length > 0
}

function isScriptStudioTextAnnotation(annotation: PlotPilotChapterAnnotation): boolean {
  return !isScriptStudioInkAnnotation(annotation)
}

function getScriptStudioTextSelection(container: HTMLElement): ScriptStudioTextSelection | null {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null

  const range = selection.getRangeAt(0)
  if (!container.contains(range.startContainer) || !container.contains(range.endContainer)) return null

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
  let runningOffset = 0
  let start = -1
  let end = -1
  let node = walker.nextNode()

  while (node) {
    const textLength = node.textContent?.length ?? 0
    if (node === range.startContainer) start = runningOffset + range.startOffset
    if (node === range.endContainer) end = runningOffset + range.endOffset
    runningOffset += textLength
    if (start >= 0 && end >= 0) break
    node = walker.nextNode()
  }

  if (start < 0 || end < 0) return null

  const selectionStart = Math.min(start, end)
  const selectionEnd = Math.max(start, end)
  const quote = container.textContent?.slice(selectionStart, selectionEnd) ?? range.toString()

  if (!quote.trim()) return null

  return {
    start: selectionStart,
    end: selectionEnd,
    quote,
  }
}

function renderScriptStudioAnnotatedText({
  text,
  annotations,
  activeAnnotationId,
  onSelectAnnotation,
}: {
  text: string
  annotations: PlotPilotChapterAnnotation[]
  activeAnnotationId: string | null
  onSelectAnnotation: (id: string) => void
}) {
  const sortedAnnotations = annotations
    .filter((annotation) => (
      isScriptStudioTextAnnotation(annotation)
      && annotation.start >= 0
      && annotation.end <= text.length
      && annotation.end > annotation.start
    ))
    .sort((a, b) => a.start - b.start)
  const nodes: React.ReactNode[] = []
  let cursor = 0

  for (const annotation of sortedAnnotations) {
    if (annotation.end <= cursor) continue
    const start = Math.max(annotation.start, cursor)
    if (start > cursor) nodes.push(text.slice(cursor, start))

    const selectedText = text.slice(start, annotation.end)
    const active = activeAnnotationId === annotation.id
    nodes.push(
      <mark
        key={annotation.id}
        role="button"
        tabIndex={0}
        title={annotation.note}
        onClick={() => onSelectAnnotation(annotation.id)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onSelectAnnotation(annotation.id)
          }
        }}
        className={cn(
          'cursor-pointer rounded-[5px] px-0.5 text-[#272923] ring-1 transition hover:ring-[#174a38]/30 focus:outline-none focus:ring-2 focus:ring-[#174a38]/34',
          scriptStudioAnnotationColorClassNames[annotation.color],
          active && 'shadow-[0_0_0_2px_rgba(23,74,56,0.16)]',
        )}
      >
        {selectedText}
      </mark>,
    )
    cursor = annotation.end
  }

  if (cursor < text.length) nodes.push(text.slice(cursor))

  return nodes.length ? nodes : text
}

function ScriptStudioLazyPaper({
  title,
  chapterNumber,
  draft,
  placeholder,
  annotations,
  chatAnnotationIds,
  onAnnotationsChange,
  onAddAnnotationToChat,
  onDraftChange,
}: {
  title: string
  chapterNumber: number
  draft: string
  placeholder: string
  annotations: PlotPilotChapterAnnotation[]
  chatAnnotationIds: string[]
  onAnnotationsChange: (annotations: PlotPilotChapterAnnotation[]) => void
  onAddAnnotationToChat: (annotationId: string) => void
  onDraftChange: (value: string) => void
}) {
  const [paperMode, setPaperMode] = React.useState<ScriptStudioPaperMode>('edit')
  const [selectionDraft, setSelectionDraft] = React.useState<ScriptStudioTextSelection | null>(null)
  const [annotationNote, setAnnotationNote] = React.useState('')
  const [activeAnnotationId, setActiveAnnotationId] = React.useState<string | null>(null)
  const textLayerRef = React.useRef<HTMLDivElement | null>(null)
  const visibleText = draft.trim().length > 0 ? draft : placeholder
  const canAnnotate = visibleText.trim().length > 0
  const activeAnnotation = activeAnnotationId ? annotations.find((annotation) => annotation.id === activeAnnotationId) ?? null : null

  React.useEffect(() => {
    const filteredAnnotations = annotations.filter((annotation) => (
      isScriptStudioInkAnnotation(annotation)
      || (annotation.end <= visibleText.length && visibleText.slice(annotation.start, annotation.end) === annotation.quote)
    ))
    if (filteredAnnotations.length !== annotations.length) {
      onAnnotationsChange(filteredAnnotations)
    }
  }, [annotations, onAnnotationsChange, visibleText])

  const captureAnnotationSelection = React.useCallback(() => {
    if (!canAnnotate || paperMode !== 'annotate') return

    const container = textLayerRef.current
    if (!container) return

    const nextSelection = getScriptStudioTextSelection(container)
    if (!nextSelection) return

    setSelectionDraft(nextSelection)
    setActiveAnnotationId(null)
  }, [canAnnotate, paperMode])

  const saveAnnotation = React.useCallback(() => {
    const note = annotationNote.trim()
    if (!selectionDraft || !note) return

    const id = createScriptStudioAnnotationId()
    onAnnotationsChange([
      ...annotations,
      {
        id,
        kind: 'text',
        start: selectionDraft.start,
        end: selectionDraft.end,
        quote: selectionDraft.quote,
        note,
        color: scriptStudioAnnotationColors[annotations.length % scriptStudioAnnotationColors.length] ?? 'amber',
        status: 'open',
        createdAt: new Date().toISOString(),
      },
    ])
    setActiveAnnotationId(id)
    setSelectionDraft(null)
    setAnnotationNote('')
    window.getSelection()?.removeAllRanges()
  }, [annotationNote, annotations, onAnnotationsChange, selectionDraft])

  const removeAnnotation = React.useCallback((annotationId: string) => {
    onAnnotationsChange(annotations.filter((annotation) => annotation.id !== annotationId))
    setActiveAnnotationId((current) => current === annotationId ? null : current)
  }, [annotations, onAnnotationsChange])

  return (
    <div
      data-plm-reader-module="true"
      className="mx-auto flex w-full max-w-[748px] flex-col items-center gap-3 xl:flex-row xl:items-start xl:justify-center"
    >
      <article
        className="w-full max-w-[430px] overflow-hidden rounded-[18px] border border-[#dedbd2]/88 shadow-[0_26px_72px_rgba(43,38,27,0.15)]"
        style={{ backgroundColor: 'rgba(253,252,248,0.94)' }}
      >
        <div className="flex min-h-[72px] items-center justify-between gap-3 border-b border-[#e5e1d8] px-5 py-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-[#8b867d]">第 {chapterNumber} 章</div>
            <h2 className="mt-1 truncate text-base font-semibold text-[#252822]">{title}</h2>
          </div>
          <div
            className="flex shrink-0 items-center gap-1 rounded-[10px] border border-white/60 p-1 backdrop-blur-2xl"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.58), rgba(248,246,240,0.28))',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.76), 0 8px 20px rgba(43,38,27,0.08)',
            }}
          >
            {([
              ['edit', '编辑', PenLine],
              ['annotate', '批注', MessageSquareText],
            ] as const).map(([mode, label, Icon]) => {
              const active = paperMode === mode
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaperMode(mode)}
                  className={cn(
                    'flex h-7 items-center gap-1 rounded-[7px] px-2 text-xs font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-[#174a38]/20',
                    active ? 'text-[#242821]' : 'text-[#777268] hover:text-[#242821]',
                  )}
                  style={{ backgroundColor: active ? 'rgba(255,255,255,0.76)' : 'transparent' }}
                >
                  <Icon className="size-3.5" />
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {paperMode === 'edit' ? (
          <textarea
            value={draft}
            onChange={(event) => onDraftChange(event.currentTarget.value)}
            placeholder={placeholder}
            spellCheck={false}
            className={cn(
              'min-h-[760px] w-full resize-none px-8 py-7',
              'font-serif text-[14px] leading-[2.08] text-[#28241e] outline-none',
              'placeholder:whitespace-pre-wrap placeholder:text-[#2f2b25]/72',
            )}
            style={{ backgroundColor: 'transparent' }}
          />
        ) : (
          <div className="min-h-[760px] px-8 py-7">
            <div
              ref={textLayerRef}
              role="document"
              aria-label="章节批注文本"
              onMouseUp={captureAnnotationSelection}
              onKeyUp={captureAnnotationSelection}
              className={cn(
                'min-h-[704px] select-text whitespace-pre-wrap font-serif text-[14px] leading-[2.08] outline-none',
                canAnnotate ? 'text-[#28241e]' : 'text-[#2f2b25]/42',
              )}
              tabIndex={0}
            >
              {canAnnotate
                ? renderScriptStudioAnnotatedText({
                    text: visibleText,
                    annotations,
                    activeAnnotationId,
                    onSelectAnnotation: setActiveAnnotationId,
                  })
                : visibleText}
            </div>
          </div>
        )}
      </article>

      {paperMode === 'annotate' ? (
        <aside
          className="w-full max-w-[270px] rounded-[18px] border border-white/58 p-3 shadow-[0_22px_58px_rgba(43,38,27,0.14)] backdrop-blur-2xl"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.44), rgba(246,244,238,0.22))',
            WebkitBackdropFilter: 'blur(26px) saturate(1.42)',
            backdropFilter: 'blur(26px) saturate(1.42)',
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#252822]">
              <MessageSquareText className="size-4" />
              批注
            </div>
            <span className="rounded-full border border-white/48 px-2 py-1 text-[11px] font-semibold text-[#60655d]">
              {annotations.length}
            </span>
          </div>

          <div className="mt-3 rounded-[12px] border border-white/52 p-3" style={{ backgroundColor: 'rgba(255,255,255,0.42)' }}>
            {selectionDraft ? (
              <>
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#777268]">Selected</div>
                <blockquote className="mt-2 line-clamp-4 rounded-[9px] bg-[#fffdf7]/62 px-3 py-2 text-xs leading-5 text-[#343831]">
                  {selectionDraft.quote}
                </blockquote>
                <textarea
                  value={annotationNote}
                  onChange={(event) => setAnnotationNote(event.currentTarget.value)}
                  placeholder="写批注..."
                  className="mt-3 min-h-24 w-full resize-none rounded-[10px] border border-[#ded9cd]/82 bg-white/58 px-3 py-2 text-xs leading-5 text-[#28241e] outline-none placeholder:text-[#9a948a] focus:border-[#174a38]/42"
                />
                <button
                  type="button"
                  onClick={saveAnnotation}
                  disabled={!annotationNote.trim()}
                  className="mt-2 flex h-8 w-full items-center justify-center gap-1.5 rounded-[9px] bg-[#174a38] px-3 text-xs font-semibold text-white outline-none transition hover:bg-[#1f5b46] disabled:cursor-not-allowed disabled:opacity-45"
                  style={{
                    background: `linear-gradient(180deg, ${scriptStudioPrimaryPill}, ${scriptStudioPrimaryPillHover})`,
                    boxShadow: `0 10px 20px ${scriptStudioPrimaryPillShadow}`,
                  }}
                >
                  <Save className="size-3.5" />
                  保存批注
                </button>
              </>
            ) : activeAnnotation ? (
              <>
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#777268]">Active</div>
                <blockquote className="mt-2 line-clamp-4 rounded-[9px] bg-[#fffdf7]/62 px-3 py-2 text-xs leading-5 text-[#343831]">
                  {activeAnnotation.quote}
                </blockquote>
                <p className="mt-3 rounded-[9px] bg-white/48 px-3 py-2 text-xs leading-5 text-[#30342e]">{activeAnnotation.note}</p>
              </>
            ) : (
              <div className="rounded-[10px] bg-white/42 px-3 py-5 text-center text-xs leading-5 text-[#6e746b]">
                {canAnnotate ? '选择正文后写批注' : '先写入正文'}
              </div>
            )}
          </div>

          <div className="mt-3 space-y-2">
            {annotations.map((annotation) => (
              <div
                key={annotation.id}
                role="button"
                tabIndex={0}
                onClick={() => setActiveAnnotationId(annotation.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setActiveAnnotationId(annotation.id)
                  }
                }}
                className={cn(
                  'group w-full rounded-[12px] border p-3 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-[#174a38]/20',
                  activeAnnotationId === annotation.id ? 'border-[#174a38]/30 bg-white/62' : 'border-white/44 bg-white/34 hover:bg-white/52',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={cn('mt-1 h-2.5 w-2.5 shrink-0 rounded-full ring-1', scriptStudioAnnotationColorClassNames[annotation.color])} />
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 text-xs font-semibold leading-5 text-[#30342e]">{annotation.quote}</div>
                    <div className="mt-1 line-clamp-2 text-[11px] leading-4 text-[#687068]">{annotation.note}</div>
                  </div>
                  <button
                    type="button"
                    title={chatAnnotationIds.includes(annotation.id) ? '已加入对话' : '加入对话'}
                    aria-label={chatAnnotationIds.includes(annotation.id) ? '已加入对话' : '加入对话'}
                    onClick={(event) => {
                      event.stopPropagation()
                      onAddAnnotationToChat(annotation.id)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        event.stopPropagation()
                        onAddAnnotationToChat(annotation.id)
                      }
                    }}
                    className={cn(
                      'flex h-7 shrink-0 items-center gap-1 rounded-[8px] px-2 text-[10px] font-semibold outline-none transition',
                      chatAnnotationIds.includes(annotation.id)
                        ? 'bg-[#174a38]/10 text-[#174a38]'
                        : 'text-[#6d746b] opacity-0 hover:bg-white/58 hover:text-[#174a38] group-hover:opacity-100',
                    )}
                  >
                    {chatAnnotationIds.includes(annotation.id) ? <CheckCircle2 className="size-3.5" /> : <Plus className="size-3.5" />}
                    Chat
                  </button>
                  <button
                    type="button"
                    title="删除批注"
                    onClick={(event) => {
                      event.stopPropagation()
                      removeAnnotation(annotation.id)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        event.stopPropagation()
                        removeAnnotation(annotation.id)
                      }
                    }}
                    className="grid size-7 shrink-0 place-items-center rounded-[8px] text-[#8a867d] opacity-0 transition hover:bg-[#fff8f2] hover:text-[#8e3b2f] group-hover:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>
      ) : null}
    </div>
  )
}

type ScriptStudioReaderTool = 'highlight' | 'pen' | 'arrow' | 'eraser'

interface ScriptStudioReaderInkStroke extends PlotPilotReaderInkStroke {
  id: string
}

const scriptStudioReaderPalette: Array<{
  id: ScriptStudioAnnotationColor
  label: string
  hex: string
  ink: string
}> = [
  { id: 'rose', label: '粉', hex: '#f2a7bb', ink: '#8d3650' },
  { id: 'mint', label: '绿', hex: '#cdeea5', ink: '#54731d' },
  { id: 'sky', label: '蓝', hex: '#aac3f4', ink: '#3f64a8' },
  { id: 'amber', label: '黄', hex: '#f4dc87', ink: '#8a6818' },
]

const scriptStudioReaderToolItems: Array<{
  id: ScriptStudioReaderTool
  label: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  { id: 'highlight', label: '荧光笔', icon: Highlighter },
  { id: 'pen', label: '画笔', icon: Brush },
  { id: 'arrow', label: '箭头', icon: CornerDownRight },
  { id: 'eraser', label: '橡皮', icon: Eraser },
]

const scriptStudioReaderToolHints: Record<ScriptStudioReaderTool, string> = {
  highlight: '荧光笔：选中正文后自动染色并保存。',
  pen: '画笔：在纸页上拖动，松手自动保存。',
  arrow: '箭头：拖出方向线，松手自动保存。',
  eraser: '橡皮：点一下纸页，撤销最后一条手写批注。',
}

const scriptStudioReaderFigureAssets = [
  {
    src: '/reader-assets/pixel-forest.png',
    caption: 'Fig. 1  像素横版场景 / platform forest sample',
  },
  {
    src: '/reader-assets/pixel-stage.png',
    caption: 'Fig. 2  16-bit 舞台场景 / stage sample',
  },
]

function createScriptStudioReaderStrokeId() {
  return `stroke-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function getScriptStudioReaderPaletteColor(color: ScriptStudioAnnotationColor) {
  return scriptStudioReaderPalette.find((item) => item.id === color) ?? {
    id: 'rose',
    label: '粉',
    hex: '#f2a7bb',
    ink: '#8d3650',
  }
}

function createScriptStudioReaderParagraphs(text: string) {
  const cleaned = text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  const paragraphs = cleaned
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter(Boolean)

  if (paragraphs.length >= 4) return paragraphs
  if (!cleaned) return []

  const chunks = cleaned.match(/[^。！？!?]{18,90}[。！？!?]?/g)
  return chunks?.map((chunk) => chunk.trim()).filter(Boolean).slice(0, 12) ?? [cleaned]
}

function getScriptStudioReaderPoint(event: React.PointerEvent<SVGSVGElement>): PlotPilotReaderInkPoint {
  const rect = event.currentTarget.getBoundingClientRect()
  return {
    x: ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 1000,
    y: ((event.clientY - rect.top) / Math.max(rect.height, 1)) * 1414,
  }
}

function renderScriptStudioReaderPath(points: PlotPilotReaderInkPoint[]) {
  if (points.length === 0) return ''
  return points.reduce((path, point, index) => (
    index === 0 ? `M ${point.x.toFixed(1)} ${point.y.toFixed(1)}` : `${path} L ${point.x.toFixed(1)} ${point.y.toFixed(1)}`
  ), '')
}

function createScriptStudioInkAnnotation(
  stroke: ScriptStudioReaderInkStroke,
  color: ScriptStudioAnnotationColor,
  colorLabel: string,
): PlotPilotChapterAnnotation {
  const toolLabel = stroke.tool === 'arrow' ? '箭头' : '画笔'
  return {
    id: createScriptStudioAnnotationId(),
    kind: 'ink',
    start: 0,
    end: 0,
    quote: `手写批注：${toolLabel}`,
    note: `${colorLabel}色${toolLabel}，${stroke.points.length} 个点。`,
    color,
    status: 'open',
    createdAt: new Date().toISOString(),
    ink: {
      tool: stroke.tool,
      color: stroke.color,
      width: stroke.width,
      opacity: stroke.opacity,
      points: stroke.points,
    },
  }
}

function annotationToScriptStudioReaderStroke(annotation: PlotPilotChapterAnnotation): ScriptStudioReaderInkStroke | null {
  if (!isScriptStudioInkAnnotation(annotation)) return null
  return {
    id: annotation.id,
    tool: annotation.ink.tool,
    color: annotation.ink.color,
    width: annotation.ink.width,
    opacity: annotation.ink.opacity,
    points: annotation.ink.points,
  }
}

function ScriptStudioMagazineReaderWorkspace({
  novel,
  chapterNumber,
  title,
  draft,
  placeholder,
  chapterAnnotations,
  handlers,
  ready,
  busy,
}: {
  novel: PlotPilotNovel | null
  chapterNumber: number
  title: string
  draft: string
  placeholder: string
  chapterAnnotations?: PlotPilotChapterAnnotation[]
  handlers?: PlotPilotNativeHandlers
  ready: boolean
  busy: boolean
}) {
  const [tool, setTool] = React.useState<ScriptStudioReaderTool>('highlight')
  const [color, setColor] = React.useState<ScriptStudioAnnotationColor>('rose')
  const [inkWidth, setInkWidth] = React.useState(5)
  const [inkOpacity, setInkOpacity] = React.useState(0.82)
  const [annotations, setAnnotations] = React.useState<PlotPilotChapterAnnotation[]>(chapterAnnotations ?? [])
  const [activeAnnotationId, setActiveAnnotationId] = React.useState<string | null>(null)
  const [chatAnnotationIds, setChatAnnotationIds] = React.useState<string[]>([])
  const [agentInstruction, setAgentInstruction] = React.useState('')
  const [draftStroke, setDraftStroke] = React.useState<ScriptStudioReaderInkStroke | null>(null)
  const textLayerRef = React.useRef<HTMLDivElement | null>(null)
  const visibleText = draft.trim().length > 0 ? draft : placeholder
  const paragraphs = React.useMemo(() => createScriptStudioReaderParagraphs(visibleText), [visibleText])
  const abstractText = paragraphs.slice(0, 2).join(' ')
  const bodyText = paragraphs.length > 2 ? paragraphs.slice(2).join('\n\n') : visibleText
  const activePaletteColor = getScriptStudioReaderPaletteColor(color)
  const activeAnnotation = activeAnnotationId ? annotations.find((annotation) => annotation.id === activeAnnotationId) ?? null : null
  const inkStrokes = React.useMemo(
    () => annotations
      .map(annotationToScriptStudioReaderStroke)
      .filter((stroke): stroke is ScriptStudioReaderInkStroke => Boolean(stroke)),
    [annotations],
  )
  const toolHint = scriptStudioReaderToolHints[tool]
  const chatAnnotations = React.useMemo(
    () => chatAnnotationIds
      .map((annotationId) => annotations.find((annotation) => annotation.id === annotationId))
      .filter((annotation): annotation is PlotPilotChapterAnnotation => Boolean(annotation)),
    [annotations, chatAnnotationIds],
  )

  React.useEffect(() => {
    setAnnotations(chapterAnnotations ?? [])
    setChatAnnotationIds([])
    setActiveAnnotationId(null)
  }, [chapterAnnotations, novel?.id, chapterNumber])

  const updateAnnotations = React.useCallback((nextAnnotations: PlotPilotChapterAnnotation[]) => {
    setAnnotations(nextAnnotations)
    if (novel) {
      handlers?.onSaveChapterAnnotations?.(novel.id, chapterNumber, nextAnnotations)
    }
  }, [chapterNumber, handlers, novel])

  const addSelectionHighlight = React.useCallback(() => {
    if (tool !== 'highlight') return
    const container = textLayerRef.current
    if (!container) return
    const selection = getScriptStudioTextSelection(container)
    if (!selection) return

    const id = createScriptStudioAnnotationId()
    const nextAnnotations = [
      ...annotations,
      {
        id,
        kind: 'text' as const,
        start: selection.start,
        end: selection.end,
        quote: selection.quote,
        note: `${activePaletteColor.label}色荧光标记`,
        color,
        status: 'open' as const,
        createdAt: new Date().toISOString(),
      },
    ]
    updateAnnotations(nextAnnotations)
    setActiveAnnotationId(id)
    window.getSelection()?.removeAllRanges()
  }, [activePaletteColor.label, annotations, color, tool, updateAnnotations])

  const removeAnnotation = React.useCallback((annotationId: string) => {
    updateAnnotations(annotations.filter((annotation) => annotation.id !== annotationId))
    setActiveAnnotationId((current) => current === annotationId ? null : current)
    setChatAnnotationIds((current) => current.filter((id) => id !== annotationId))
  }, [annotations, updateAnnotations])

  const toggleAnnotationForChat = React.useCallback((annotationId: string) => {
    setChatAnnotationIds((current) => (
      current.includes(annotationId)
        ? current.filter((id) => id !== annotationId)
        : [...current, annotationId]
    ))
  }, [])

  const sendAnnotationsToAgent = React.useCallback(() => {
    if (!novel || !handlers?.onGenerateChapter) return
    handlers.onGenerateChapter(novel.id, chapterNumber, {
      annotations: chatAnnotations.length ? chatAnnotations : annotations,
      instruction: agentInstruction.trim() || '请根据这些阅读批注，指出正文节奏、信息密度和文风问题，并给出可直接改写的建议。',
    })
    setAgentInstruction('')
  }, [agentInstruction, annotations, chapterNumber, chatAnnotations, handlers, novel])

  const onInkPointerDown = React.useCallback((event: React.PointerEvent<SVGSVGElement>) => {
    if (tool === 'highlight') return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    if (tool === 'eraser') {
      const lastInkAnnotation = [...annotations].reverse().find(isScriptStudioInkAnnotation)
      if (lastInkAnnotation) removeAnnotation(lastInkAnnotation.id)
      return
    }
    const point = getScriptStudioReaderPoint(event)
    setDraftStroke({
      id: createScriptStudioReaderStrokeId(),
      tool,
      color: activePaletteColor.ink,
      width: inkWidth,
      opacity: inkOpacity,
      points: [point],
    })
  }, [activePaletteColor.ink, annotations, inkOpacity, inkWidth, removeAnnotation, tool])

  const onInkPointerMove = React.useCallback((event: React.PointerEvent<SVGSVGElement>) => {
    if (!draftStroke || tool === 'highlight' || tool === 'eraser') return
    event.preventDefault()
    const point = getScriptStudioReaderPoint(event)
    setDraftStroke((current) => current ? { ...current, points: [...current.points, point] } : current)
  }, [draftStroke, tool])

  const finishInkStroke = React.useCallback(() => {
    setDraftStroke((current) => {
      if (!current || current.points.length < 2) return null
      const nextAnnotation = createScriptStudioInkAnnotation(current, color, activePaletteColor.label)
      updateAnnotations([...annotations, nextAnnotation])
      setActiveAnnotationId(nextAnnotation.id)
      return null
    })
  }, [activePaletteColor.label, annotations, color, updateAnnotations])

  return (
    <div className="mx-auto grid min-h-full w-full min-w-[1120px] grid-cols-[minmax(0,1fr)_96px] gap-5">
      <div className="flex justify-center overflow-visible pb-10">
        <article
          className="relative h-[1320px] w-[940px] overflow-hidden border border-[#d4d1ca] bg-[#fffefd] text-[#171713] shadow-[0_34px_80px_rgba(35,31,24,0.22)]"
          style={{
            backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,1), rgba(252,250,245,1))',
          }}
        >
          <header className="absolute inset-x-[54px] top-[34px] h-[126px] border-b-2 border-[#171713]">
            <div className="flex items-start justify-between gap-8">
              <div className="min-w-0">
                <div className="text-[24px] font-light tracking-[0.01em] text-[#333333]">PLM Reading Workshop</div>
                <h1 className="mt-2 text-[34px] font-light tracking-[0.04em] text-[#9b5960]">
                  章节视觉批注与风格校样
                </h1>
                <div className="mt-2 text-[13px] font-semibold text-[#2c2c2c]">
                  {novel?.title ?? '未命名项目'} · 第 {chapterNumber} 章 · {title}
                </div>
                <div className="mt-1 text-[10px] text-[#353535]">
                  Source: PlotPilot / Drama Browser PLM · Reader annotation proof
                </div>
              </div>
              <div className="flex items-center gap-3 pt-1 text-right">
                <div className="text-[15px] font-semibold leading-tight text-[#171713]">PLM×<br />阅读工坊</div>
                <div className="grid size-[62px] place-items-center bg-[#0f0f0f] text-[30px] font-semibold text-white">R</div>
              </div>
            </div>
          </header>

          <section className="absolute left-[54px] top-[185px] w-[458px]">
            <div className="text-center text-[14px] font-semibold text-[#4c8495]">章节视觉批注稿</div>
            <div className="mt-4 text-[12px] font-semibold text-[#171713]">{novel?.author ?? 'PlotPilot Author'}</div>
            <p className="mt-3 text-[11px] leading-[1.75] text-[#4c4c4c]">
              校样页把正文、批注、图片和读者反馈压到同一张纸面上。它不是传统编辑器，而是给作者看的视觉证据板。
            </p>
            <div className="mt-4 text-[11px] leading-[1.75]">
              <span className="font-semibold text-[#1c1c1c]">关键词：</span>
              <mark className="rounded-sm bg-[#d9f09d]/70 px-1 text-[#34470c]">章节节奏</mark>
              <mark className="ml-1 rounded-sm bg-[#d9f09d]/70 px-1 text-[#34470c]">人物声线</mark>
              <mark className="ml-1 rounded-sm bg-[#d9f09d]/70 px-1 text-[#34470c]">环境细节</mark>
              <mark className="ml-1 rounded-sm bg-[#d9f09d]/70 px-1 text-[#34470c]">AI 腔检查</mark>
            </div>
            <div className="mt-6 flex items-start gap-3">
              <span className="mt-1 size-0 border-y-[8px] border-l-[13px] border-y-transparent border-l-[#ee79a4]" />
              <p className="text-[11px] leading-[1.78] text-[#333333]">
                本页将正文拆成论文式阅读材料，方便一眼看到“哪里需要加温度，哪里信息过密，哪里句子像模型总结”。
              </p>
            </div>
          </section>

          <figure className="absolute right-[54px] top-[208px] w-[320px]">
            <img src={scriptStudioReaderFigureAssets[0]?.src} alt="像素森林场景示意" className="h-[198px] w-full object-cover" />
            <figcaption className="mt-2 text-[9px] leading-[1.25] text-[#2c2c2c]">{scriptStudioReaderFigureAssets[0]?.caption}</figcaption>
          </figure>

          <div className="absolute left-[54px] top-[392px] w-[458px]">
            <h2 className="text-center text-[14px] font-semibold text-[#4c8495]">摘要</h2>
            <p className="mt-3 rounded-sm bg-[#f2a7bb]/28 px-2 py-1 text-[11px] leading-[1.82] text-[#333333]">
              {abstractText || '这一页会提取当前章节前两段作为摘要，用高亮和边注辅助判断正文的读者感受。'}
            </p>
          </div>

          <div className="absolute right-[54px] top-[440px] w-[320px]">
            <div className="rounded-sm border border-[#d6c3c8] bg-[#fbfbfb] px-2 py-1 text-[11px] leading-[1.62] text-[#343434]">
              <mark className="bg-[#adc7f4]/62 px-1 text-[#203c6c]">蓝色批注用于结构问题。</mark>
              右侧工具栏切到荧光笔后，选择正文即可染色；切到画笔或箭头，可直接在纸页上手写。
            </div>
          </div>

          <figure className="absolute right-[54px] top-[570px] w-[320px]">
            <img src={scriptStudioReaderFigureAssets[1]?.src} alt="像素舞台场景示意" className="h-[178px] w-full object-cover" />
            <figcaption className="mt-2 text-[9px] leading-[1.25] text-[#2c2c2c]">{scriptStudioReaderFigureAssets[1]?.caption}</figcaption>
          </figure>

          <section className="absolute inset-x-[54px] bottom-[92px] top-[515px]">
            <div className="h-full columns-2 gap-[36px] text-[11px] leading-[1.76] text-[#2d2d2d]">
              <div
                ref={textLayerRef}
                onMouseUp={addSelectionHighlight}
                onKeyUp={addSelectionHighlight}
                tabIndex={0}
                className={cn(
                  'min-h-[670px] whitespace-pre-wrap outline-none',
                  tool === 'highlight' ? 'cursor-text select-text' : 'select-none',
                )}
              >
                {renderScriptStudioAnnotatedText({
                  text: bodyText,
                  annotations,
                  activeAnnotationId,
                  onSelectAnnotation: setActiveAnnotationId,
                })}
              </div>
            </div>
          </section>

          <div className="absolute left-[54px] right-[54px] bottom-[34px] flex items-end justify-between border-t border-[#191919] pt-2 text-[10px] text-[#2e2e2e]">
            <div>Reader proof · annotations {annotations.length} · ink {inkStrokes.length}</div>
            <div className="text-[24px] font-light text-[#6d6d6d]">/Page {String(chapterNumber).padStart(2, '0')}</div>
          </div>

          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[480px] top-[260px] rotate-[-7deg] text-[12px] font-semibold leading-5 text-[#7b8a19]">
              重点看这里<br />是否太像总结
            </div>
            <div className="absolute left-[445px] top-[300px] h-[45px] w-[84px] rounded-[50%] border border-[#7b8a19]" />
            <div className="absolute right-[40px] top-[510px] text-[11px] leading-4 text-[#a25c70]">
              这里可以放<br />节奏边注
            </div>
            <div className="absolute left-[68px] bottom-[68px] text-[11px] leading-5 text-[#a25c70]">
              读者感受：<br />这一段是否太密？
            </div>
          </div>

          <svg
            className={cn(
              'absolute inset-0 z-20 size-full touch-none',
              tool === 'highlight' ? 'pointer-events-none' : 'pointer-events-auto',
            )}
            viewBox="0 0 1000 1414"
            preserveAspectRatio="none"
            onPointerDown={onInkPointerDown}
            onPointerMove={onInkPointerMove}
            onPointerUp={finishInkStroke}
            onPointerCancel={finishInkStroke}
          >
            <defs>
              <marker id="reader-arrow-head" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto" markerUnits="strokeWidth">
                <path d="M 0 0 L 8 4.5 L 0 9 z" fill={activePaletteColor.ink} />
              </marker>
            </defs>
            {[...inkStrokes, ...(draftStroke ? [draftStroke] : [])].map((stroke) => {
              const path = renderScriptStudioReaderPath(stroke.points)
              if (!path) return null
              return (
                <path
                  key={stroke.id}
                  d={path}
                  fill="none"
                  stroke={stroke.color}
                  strokeWidth={stroke.width}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={stroke.opacity ?? inkOpacity}
                  markerEnd={stroke.tool === 'arrow' ? 'url(#reader-arrow-head)' : undefined}
                />
              )
            })}
          </svg>
        </article>
      </div>

      <aside className="sticky top-4 h-fit rounded-[28px] border border-[#ded8ca] bg-[#fffbf2]/92 p-2 shadow-[0_18px_44px_rgba(43,38,27,0.14)]">
        <div className="grid gap-2">
          {scriptStudioReaderToolItems.map((item) => {
            const Icon = item.icon
            const active = tool === item.id
            return (
              <button
                key={item.id}
                type="button"
                title={item.label}
                aria-label={item.label}
                onClick={() => setTool(item.id)}
                className={cn(
                  'grid size-12 place-items-center rounded-[18px] border outline-none transition focus-visible:ring-2 focus-visible:ring-[#174a38]/25',
                  active ? 'border-[#2c2c2c] bg-[#2d2c2a] text-white shadow-[0_10px_22px_rgba(44,44,42,0.18)]' : 'border-[#e1daca] bg-white text-[#3d3b36] hover:bg-[#f3eee3]',
                )}
              >
                <Icon className="size-5" />
              </button>
            )
          })}
        </div>

        <div className="mt-3 rounded-[16px] border border-[#e5ddcf] bg-white px-2 py-2 text-[10px] font-semibold leading-4 text-[#6d675d]">
          {toolHint}
        </div>

        <div className="mt-4 grid gap-2">
          {scriptStudioReaderPalette.map((item) => (
            <button
              key={item.id}
              type="button"
              title={`${item.label}色`}
              aria-label={`${item.label}色`}
              onClick={() => setColor(item.id)}
              className={cn(
                'mx-auto size-10 rounded-full border outline-none transition focus-visible:ring-2 focus-visible:ring-[#174a38]/25',
                color === item.id ? 'scale-105 border-[#1c1c1c] shadow-[0_8px_18px_rgba(43,38,27,0.18)]' : 'border-white/70',
              )}
              style={{ backgroundColor: item.hex }}
            />
          ))}
        </div>

        <label className="mt-4 block rounded-[16px] border border-[#e5ddcf] bg-white px-2 py-3 text-center text-[10px] font-semibold text-[#6d675d]">
          粗细
          <input
            type="range"
            min={2}
            max={12}
            value={inkWidth}
            onChange={(event) => setInkWidth(Number(event.currentTarget.value))}
            className="mt-2 w-full accent-[#873d24]"
          />
        </label>

        <label className="mt-2 block rounded-[16px] border border-[#e5ddcf] bg-white px-2 py-3 text-center text-[10px] font-semibold text-[#6d675d]">
          透明
          <input
            type="range"
            min={0.3}
            max={1}
            step={0.05}
            value={inkOpacity}
            onChange={(event) => setInkOpacity(Number(event.currentTarget.value))}
            className="mt-2 w-full accent-[#873d24]"
          />
        </label>

        <button
          type="button"
          onClick={() => {
            const nextAnnotations = annotations.filter((annotation) => !isScriptStudioInkAnnotation(annotation))
            const nextIds = new Set(nextAnnotations.map((annotation) => annotation.id))
            updateAnnotations(nextAnnotations)
            setActiveAnnotationId((current) => current && nextIds.has(current) ? current : null)
            setChatAnnotationIds((current) => current.filter((id) => nextIds.has(id)))
            setDraftStroke(null)
          }}
          disabled={inkStrokes.length === 0}
          className="mt-2 grid size-12 place-items-center rounded-[18px] border border-[#e1daca] bg-white text-[#8d3650] outline-none transition hover:bg-[#fff2f5] disabled:cursor-not-allowed disabled:opacity-35 focus-visible:ring-2 focus-visible:ring-[#8d3650]/25"
          title="清除手写"
          aria-label="清除手写"
        >
          <Trash2 className="size-5" />
        </button>

        <div className="mt-4 border-t border-[#e5ddcf] pt-3">
          <div className="text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a8276]">Notes</div>
          <div className="mt-2 max-h-[220px] space-y-2 overflow-y-auto pr-1">
            {annotations.length ? annotations.map((annotation) => {
              const palette = getScriptStudioReaderPaletteColor(annotation.color)
              const inChat = chatAnnotationIds.includes(annotation.id)
              return (
                <button
                  key={annotation.id}
                  type="button"
                  onClick={() => {
                    setActiveAnnotationId(annotation.id)
                    toggleAnnotationForChat(annotation.id)
                  }}
                  className={cn(
                    'w-full rounded-[14px] border px-2 py-2 text-left text-[10px] leading-4 outline-none transition focus-visible:ring-2 focus-visible:ring-[#174a38]/25',
                    inChat ? 'border-[#32312f] bg-[#fff8ee]' : 'border-[#e2dacb] bg-white hover:bg-[#fffaf2]',
                  )}
                >
                  <span className="mb-1 block h-1.5 rounded-full" style={{ backgroundColor: palette.hex }} />
                  <span className="line-clamp-2 font-semibold text-[#31312d]">{annotation.quote}</span>
                  <span className="mt-1 block text-[#8a8276]">{inChat ? '已加入 Agent' : annotation.note}</span>
                </button>
              )
            }) : (
              <div className="rounded-[14px] border border-[#e2dacb] bg-white px-2 py-4 text-center text-[10px] leading-4 text-[#8a8276]">
                {toolHint}
              </div>
            )}
          </div>
        </div>

        <textarea
          value={agentInstruction}
          onChange={(event) => setAgentInstruction(event.currentTarget.value)}
          placeholder="给 Agent 的批注要求"
          className="mt-3 h-24 w-full resize-none rounded-[16px] border border-[#e2dacb] bg-white px-2 py-2 text-[10px] leading-4 text-[#2f2d29] outline-none placeholder:text-[#aaa296] focus:border-[#873d24]/45"
        />
        <button
          type="button"
          onClick={sendAnnotationsToAgent}
          disabled={!ready || busy || !novel || annotations.length === 0 || !handlers?.onGenerateChapter}
          className="mt-2 flex h-10 w-full items-center justify-center gap-1.5 rounded-[16px] bg-[#2d2c2a] px-2 text-[11px] font-semibold text-white outline-none transition hover:bg-[#873d24] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Sparkles className="size-3.5" />
          给 Agent
        </button>
      </aside>
    </div>
  )
}

function ScriptStudioAdvancedWorkspace({
  workspaceMode,
  runtimeStatus,
  logs,
  novels,
  novel,
  chapterEditor,
  selectedBibleData,
  featureState,
  handlers,
  ready,
  busy,
  codexStatus,
  integrationStatus,
  projectGuardStatus,
  lastWritingSpecFailure,
}: {
  workspaceMode: Exclude<ScriptStudioWorkspaceMode, 'creation' | 'reader'>
  runtimeStatus: PlotPilotRuntimeStatus
  logs: PlotPilotLogEntry[]
  novels: PlotPilotNovel[]
  novel: PlotPilotNovel | null
  chapterEditor?: PlotPilotChapterEditor | null
  selectedBibleData?: PlotPilotBibleEditorData | null
  featureState: PlotPilotNativeFeatureState
  handlers?: PlotPilotNativeHandlers
  ready: boolean
  busy: boolean
  codexStatus?: PlotPilotCodexStatus | null
  integrationStatus?: PlotPilotIntegrationStatus
  projectGuardStatus?: PlotPilotProjectGuardStatus | null
  lastWritingSpecFailure?: PlotPilotWritingSpecFailureView | null
}) {
  const currentSurface: PlotPilotWorkspaceSurface =
    workspaceMode === 'setup'
      ? 'setup'
      : workspaceMode === 'planning'
        ? 'planning'
        : workspaceMode === 'production'
          ? 'autopilot'
          : workspaceMode === 'review'
            ? 'review'
            : 'debug'
  const title = scriptStudioWorkspaceModes.find((item) => item.id === workspaceMode)?.label ?? 'PLM'
  const detail = scriptStudioWorkspaceModes.find((item) => item.id === workspaceMode)?.detail ?? ''
  const cards = createScriptStudioAdvancedCards({
    workspaceMode,
    runtimeStatus,
    logs,
    novels,
    novel,
    chapterEditor,
    selectedBibleData,
    featureState,
    handlers,
    ready,
    busy,
    codexStatus,
    projectGuardStatus,
    lastWritingSpecFailure,
  })

  return (
    <div className="min-h-full min-w-[960px]">
      <div className="mb-4 rounded-[12px] border border-[#dedbd2] bg-[#fffefd]/94 shadow-[0_18px_44px_rgba(43,38,27,0.10)] backdrop-blur-[2px]">
        <div className="flex min-h-14 items-center justify-between gap-3 border-b border-[#e7e2d7] px-4 py-3">
          <div className="min-w-0">
            <div className="text-base font-semibold text-[#252822]">{title}</div>
            <div className="mt-0.5 truncate text-xs text-[#817c73]">{detail}</div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <IntegrationBadge status={integrationStatus} />
            <RuntimeBadge state={runtimeStatus.state} />
            <span className="rounded-[6px] border border-[#e4e0d6] bg-[#f7f6f1] px-2 py-1 font-mono text-[10px] text-[#68645d]">
              {novels.length} novels
            </span>
          </div>
        </div>
        <div className="space-y-4 bg-[#f8f7f2] p-4">
          <ScriptStudioIntegrationPanel status={integrationStatus} />
          <ScriptStudioProductionEvidencePanel snapshot={integrationStatus?.productionEvidence} />
          <ScriptStudioAdvancedOverview cards={cards} />
          <ScriptStudioAdvancedDetail
            workspaceMode={workspaceMode}
            runtimeStatus={runtimeStatus}
            logs={logs}
            novel={novel}
            chapterEditor={chapterEditor}
            selectedBibleData={selectedBibleData}
            featureState={featureState}
            handlers={handlers}
            ready={ready}
            busy={busy}
            projectGuardStatus={projectGuardStatus}
            lastWritingSpecFailure={lastWritingSpecFailure}
          />

          <details className="group overflow-hidden rounded-[10px] border border-[#d9d4c8] bg-[#fffefd] shadow-[0_10px_28px_rgba(43,38,27,0.08)]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-left outline-none transition hover:bg-[#faf9f4] focus-visible:ring-2 focus-visible:ring-[#174a38]/20">
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-[#282b25]">兼容控制台</span>
                <span className="mt-0.5 block truncate text-xs text-[#817c73]">
                  旧 PlotPilot 深色工作区暂时保留，未迁完的细表单和 trace 操作都能从这里进入。
                </span>
              </span>
              <ChevronDown className="size-4 shrink-0 text-[#817c73] transition group-open:rotate-180" />
            </summary>
            <div className="bg-[#08090d] p-3 text-white">
              <WorkspaceHeader
                novel={novel}
                surface={currentSurface}
                projectGuardStatus={projectGuardStatus}
                onSurfaceChange={() => undefined}
              />
              <div className="min-h-[640px] bg-[#0a0b10] p-3">
                {workspaceMode === 'setup' ? (
                  <div className="space-y-3">
                    <SetupWorkspace
                      novel={novel}
                      featureState={featureState}
                      handlers={handlers}
                      ready={ready}
                      busy={busy}
                    />
                    <BibleWorkspace
                      novel={novel}
                      bibleData={selectedBibleData}
                      handlers={handlers}
                      ready={ready}
                      busy={busy}
                    />
                  </div>
                ) : null}

                {workspaceMode === 'planning' ? (
                  <div className="space-y-3">
                    <PlanningWorkspace
                      novel={novel}
                      chapterEditor={chapterEditor}
                      featureState={featureState}
                      handlers={handlers}
                      ready={ready}
                      busy={busy}
                    />
                    <BeatWorkspace
                      novel={novel}
                      featureState={featureState}
                      handlers={handlers}
                      ready={ready}
                      busy={busy}
                    />
                  </div>
                ) : null}

                {workspaceMode === 'production' ? (
                  <div className="space-y-3">
                    <AutopilotWorkspace
                      novel={novel}
                      featureState={featureState}
                      handlers={handlers}
                      ready={ready}
                      busy={busy}
                    />
                    <ChapterWorkspace
                      novel={novel}
                      chapterEditor={chapterEditor}
                      handlers={handlers}
                      ready={ready}
                      busy={busy}
                    />
                  </div>
                ) : null}

                {workspaceMode === 'review' ? (
                  <ReviewWorkspace
                    novel={novel}
                    chapterEditor={chapterEditor}
                    featureState={featureState}
                    handlers={handlers}
                    ready={ready}
                    busy={busy}
                  />
                ) : null}

                {workspaceMode === 'debug' ? (
                  <div className="space-y-3">
                    <DebugWorkspace
                      novel={novel}
                      featureState={featureState}
                      handlers={handlers}
                      ready={ready}
                      busy={busy}
                    />
                    <MemoryWorkspace
                      novel={novel}
                      featureState={featureState}
                      handlers={handlers}
                      ready={ready}
                      busy={busy}
                    />
                    <GenerationPanel
                      status={runtimeStatus}
                      novel={novel}
                      projectGuardStatus={projectGuardStatus}
                      lastWritingSpecFailure={lastWritingSpecFailure}
                      logs={logs}
                      handlers={handlers}
                    />
                    <RuntimeCard
                      status={runtimeStatus}
                      meta={runtimeMeta[runtimeStatus.state]}
                      codexStatus={codexStatus}
                      onStartCodexLogin={handlers?.onStartCodexLogin}
                      busy={busy}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}

function createScriptStudioAdvancedCards({
  workspaceMode,
  runtimeStatus,
  logs,
  novels,
  novel,
  chapterEditor,
  selectedBibleData,
  featureState,
  handlers,
  ready,
  busy,
  codexStatus,
  integrationStatus,
  projectGuardStatus,
  lastWritingSpecFailure,
}: {
  workspaceMode: Exclude<ScriptStudioWorkspaceMode, 'creation' | 'reader'>
  runtimeStatus: PlotPilotRuntimeStatus
  logs: PlotPilotLogEntry[]
  novels: PlotPilotNovel[]
  novel: PlotPilotNovel | null
  chapterEditor?: PlotPilotChapterEditor | null
  selectedBibleData?: PlotPilotBibleEditorData | null
  featureState: PlotPilotNativeFeatureState
  handlers?: PlotPilotNativeHandlers
  ready: boolean
  busy: boolean
  codexStatus?: PlotPilotCodexStatus | null
  integrationStatus?: PlotPilotIntegrationStatus
  projectGuardStatus?: PlotPilotProjectGuardStatus | null
  lastWritingSpecFailure?: PlotPilotWritingSpecFailureView | null
}): ScriptStudioAdvancedCardView[] {
  const hasNovel = Boolean(novel)
  const activeChapter = chapterEditor?.chapterNumber ?? novel?.chapters?.[0]?.number ?? 1
  const runtimeReady = ready && runtimeStatus.state === 'ready'
  const disabled = !hasNovel || !runtimeReady || busy
  const novelId = novel?.id ?? ''
  const activeInvocation = asUiRecord(featureState.activeInvocation)
  const invocationSessionId = readUiString(activeInvocation, ['sessionId', 'session_id', 'id'])
  const totalChapters = novel?.targetChapters ?? novel?.chapterCount ?? 0
  const writtenChapters = (novel?.chapters ?? []).filter((chapter) => (chapter.wordCount ?? 0) > 0).length
  const bibleCharacterCount = selectedBibleData?.characters?.length ?? novel?.bible?.characters?.length ?? 0
  const bibleLocationCount = selectedBibleData?.locations?.length ?? 0
  const worldCount = selectedBibleData?.world_settings?.length ?? (novel?.bible?.world ? 1 : 0)
  const autoStatus = readUiString(asUiRecord(featureState.autopilotStatus), ['state', 'status', 'phase'])
  const breakerStatus = readUiString(asUiRecord(featureState.autopilotCircuitBreaker), ['state', 'status'])

  if (workspaceMode === 'setup') {
    return [
      {
        id: 'setup-onboarding',
        title: '书籍向导',
        eyebrow: 'Onboarding',
        body: '恢复 PlotPilot 的类型、世界观、结构、节奏和文风入口。当前白色层先承载创建、刷新和设定确认。',
        icon: WandSparkles,
        tone: 'sage',
        status: novel ? (novel.status ?? '已选择') : '未创建',
        metrics: [
          { label: '书目', value: novels.length.toLocaleString() },
          { label: '目标章节', value: String(totalChapters || 0) },
        ],
        actions: [
          { label: novel ? '刷新设定' : '新建书目', icon: novel ? RotateCw : Plus, onClick: novel ? () => handlers?.onRefreshSetup?.(novel.id) : handlers?.onCreateNovel, disabled: novel ? disabled || !handlers?.onRefreshSetup : !runtimeReady || busy || !handlers?.onCreateNovel, primary: true },
          { label: '导入 Storylet', icon: GitBranch, onClick: handlers?.onImportStorylet, disabled: !runtimeReady || busy || !handlers?.onImportStorylet },
        ],
      },
      {
        id: 'setup-bible',
        title: 'Bible 全量编辑',
        eyebrow: 'World / Character / Location',
        body: '把角色卡、地点、世界观、时间线、风格规范归入设定模式；深色兼容区仍保留完整表单。',
        icon: BookOpen,
        tone: 'ink',
        status: selectedBibleData ? '已载入' : '待生成',
        metrics: [
          { label: '人物', value: String(bibleCharacterCount) },
          { label: '地点', value: String(bibleLocationCount) },
          { label: '世界观', value: String(worldCount) },
          { label: '风格', value: selectedBibleData?.style ? '已写入' : '未写入' },
        ],
        actions: [
          { label: '生成 Bible', icon: Sparkles, onClick: novel ? () => handlers?.onGenerateBible?.(novel.id) : undefined, disabled: disabled || !handlers?.onGenerateBible, primary: true },
          { label: '打开 Bible', icon: BookOpen, onClick: novel ? () => handlers?.onOpenBible?.(novel.id) : undefined, disabled: disabled || !handlers?.onOpenBible },
        ],
      },
      {
        id: 'setup-guard',
        title: 'WritingSpec 与 Humanizer',
        eyebrow: 'Quality Guard',
        body: '绑定写作规范、Humanizer 策略和失败报告，后续生成失败会继续写入 Graph event。',
        icon: ShieldCheck,
        tone: 'gold',
        status: projectGuardStatus?.writingSpecId ? '已绑定' : '未绑定',
        metrics: [
          { label: 'Codex', value: codexStatus?.authenticated ? '已登录' : '未登录' },
          { label: 'Humanizer', value: projectGuardStatus?.humanizerEnabled ? (projectGuardStatus.humanizerPolicy ?? 'on') : 'off' },
        ],
        actions: [
          { label: 'Codex 登录', icon: LogIn, onClick: handlers?.onStartCodexLogin, disabled: busy || !handlers?.onStartCodexLogin },
          { label: '清除规范', icon: Trash2, onClick: novel ? () => handlers?.onClearWritingSpec?.(novel.id) : undefined, disabled: disabled || !projectGuardStatus?.writingSpecId || !handlers?.onClearWritingSpec },
        ],
      },
    ]
  }

  if (workspaceMode === 'planning') {
    return [
      {
        id: 'planning-main-plot',
        title: '主线候选',
        eyebrow: 'Main Plot Options',
        body: '恢复 PlotPilot 的主线候选生成与选择入口，先把候选数和生成动作放进新白色层。',
        icon: GitBranch,
        tone: 'sage',
        status: featureState.mainPlotOptions?.length ? '已有候选' : '待生成',
        metrics: [
          { label: '候选', value: String(featureState.mainPlotOptions?.length ?? 0) },
          { label: 'Auto approve', value: novel?.autoApproveMode ? 'on' : 'off' },
        ],
        actions: [
          { label: '生成候选', icon: Sparkles, onClick: novel ? () => handlers?.onSuggestMainPlotOptions?.(novel.id) : undefined, disabled: disabled || !handlers?.onSuggestMainPlotOptions, primary: true },
          { label: novel?.autoApproveMode ? '关闭自动确认' : '开启自动确认', icon: CheckCircle2, onClick: novel ? () => handlers?.onSetAutoApproveMode?.(novel.id, !novel.autoApproveMode) : undefined, disabled: disabled || !handlers?.onSetAutoApproveMode },
        ],
      },
      {
        id: 'planning-outline',
        title: 'Plot Outline',
        eyebrow: 'Outline Stream / Save',
        body: '把 plot-outline 流式生成、保存和回退继续向白色大纲面板迁移；兼容区保留原始 JSON。',
        icon: ListChecks,
        tone: 'ink',
        status: featureState.plotOutline ? '已生成' : '空',
        metrics: [
          { label: '阶段', value: featureState.planningStructure ? '已有结构' : '未载入' },
          { label: '事件', value: String(featureState.setupEvents?.length ?? 0) },
        ],
        actions: [
          { label: '生成大纲', icon: Sparkles, onClick: novel ? () => handlers?.onGeneratePlotOutline?.(novel.id) : undefined, disabled: disabled || !handlers?.onGeneratePlotOutline, primary: true },
          { label: '刷新规划', icon: RotateCw, onClick: novel ? () => handlers?.onRefreshPlanning?.(novel.id) : undefined, disabled: disabled || !handlers?.onRefreshPlanning },
        ],
      },
      {
        id: 'planning-macro',
        title: '宏观与连续规划',
        eyebrow: 'Macro / Continuous',
        body: '承载幕、卷、章节结构规划，支持从当前章节继续规划下一段。',
        icon: Network,
        tone: 'gold',
        status: featureState.planningResult ? '有结果' : '待规划',
        metrics: [
          { label: '当前章', value: String(activeChapter) },
          { label: '节拍', value: String(novel?.beatCount ?? 0) },
        ],
        actions: [
          { label: '生成宏观规划', icon: Layers, onClick: novel ? () => handlers?.onGenerateMacroPlan?.(novel.id) : undefined, disabled: disabled || !handlers?.onGenerateMacroPlan, primary: true },
          { label: '继续规划', icon: Repeat2, onClick: novel ? () => handlers?.onContinuePlanning?.(novel.id, activeChapter) : undefined, disabled: disabled || !handlers?.onContinuePlanning },
          { label: '生成 Beat', icon: ListChecks, onClick: novel ? () => handlers?.onGenerateBeat?.(novel.id) : undefined, disabled: disabled || !handlers?.onGenerateBeat },
        ],
      },
    ]
  }

  if (workspaceMode === 'production') {
    return [
      {
        id: 'production-chapter',
        title: '章节生成与回写',
        eyebrow: 'Chapter Runtime',
        body: '章节正文、保存、回写 Graph 的主入口；确保生成结果不再停留在旧深色面板。',
        icon: FileText,
        tone: 'sage',
        status: chapterEditor?.dirty ? '未保存' : (chapterEditor?.status ?? 'ready'),
        metrics: [
          { label: '当前章', value: String(activeChapter) },
          { label: '字数', value: formatCount(chapterEditor?.wordCount, 'words') },
        ],
        actions: [
          { label: '生成章节', icon: Sparkles, onClick: novel ? () => handlers?.onGenerateChapter?.(novel.id, activeChapter) : undefined, disabled: disabled || !handlers?.onGenerateChapter, primary: true },
          { label: '保存正文', icon: Save, onClick: novel && chapterEditor ? () => handlers?.onSaveChapter?.(novel.id, activeChapter, chapterEditor.content) : undefined, disabled: disabled || !chapterEditor || !handlers?.onSaveChapter },
          { label: '回写 Graph', icon: GitBranch, onClick: novel ? () => handlers?.onWriteBackChapter?.(novel.id, activeChapter) : undefined, disabled: disabled || !handlers?.onWriteBackChapter },
        ],
      },
      {
        id: 'production-autopilot',
        title: 'Autopilot 连写',
        eyebrow: 'Hosted Write / Batch',
        body: '多章连写、暂停、恢复、失败恢复从右侧控制器迁到生产模式。',
        icon: Gauge,
        tone: 'ink',
        status: autoStatus || 'idle',
        metrics: [
          { label: '完成章节', value: `${writtenChapters}/${totalChapters || 0}` },
          { label: 'Breaker', value: breakerStatus || 'normal' },
        ],
        actions: [
          { label: '启动', icon: Play, onClick: novel ? () => handlers?.onStartAutopilot?.(novel.id, 3, novel.targetChapters ?? 3, novel.targetWordsPerChapter ?? 2500, novel.autoApproveMode) : undefined, disabled: disabled || !handlers?.onStartAutopilot, primary: true },
          { label: '暂停', icon: Pause, onClick: novel ? () => handlers?.onStopAutopilot?.(novel.id) : undefined, disabled: !hasNovel || !runtimeReady || !handlers?.onStopAutopilot },
          { label: '恢复', icon: Repeat2, onClick: novel ? () => handlers?.onResumeAutopilot?.(novel.id) : undefined, disabled: disabled || !handlers?.onResumeAutopilot },
          { label: '重置失败', icon: RotateCw, onClick: novel ? () => handlers?.onResetAutopilotBreaker?.(novel.id) : undefined, disabled: disabled || !handlers?.onResetAutopilotBreaker },
        ],
      },
      {
        id: 'production-hosted-write',
        title: 'Hosted Write',
        eyebrow: 'Range Generation',
        body: '批量章节保存与失败恢复先做成可见入口，后续会补每章流式进度。',
        icon: Clapperboard,
        tone: 'gold',
        status: runtimeStatus.activeJob?.label ?? '待命',
        metrics: [
          { label: 'Runtime', value: runtimeMeta[runtimeStatus.state].label },
          { label: '进度', value: `${Math.round(runtimeStatus.activeJob?.progress ?? 0)}%` },
        ],
        actions: [
          { label: '连写 3 章', icon: Play, onClick: novel ? () => handlers?.onHostedWrite?.(novel.id, activeChapter, activeChapter + 2, true, true) : undefined, disabled: disabled || !handlers?.onHostedWrite, primary: true },
          { label: '刷新状态', icon: RotateCw, onClick: novel ? () => handlers?.onRefreshAutopilot?.(novel.id) : undefined, disabled: disabled || !handlers?.onRefreshAutopilot },
        ],
      },
    ]
  }

  if (workspaceMode === 'review') {
    return [
      {
        id: 'review-writing-spec',
        title: 'WritingSpec 报告',
        eyebrow: 'Quality Report',
        body: lastWritingSpecFailure?.message || '审阅模式会集中显示写作规范、失败报告和生成阻断原因。',
        icon: ShieldCheck,
        tone: 'rose',
        status: lastWritingSpecFailure ? '有失败报告' : '正常',
        metrics: [
          { label: 'Spec', value: projectGuardStatus?.writingSpecTitle ?? projectGuardStatus?.writingSpecId ?? '未绑定' },
          { label: '章节', value: String(activeChapter) },
        ],
        actions: [
          { label: '审阅章节', icon: ShieldCheck, onClick: novel ? () => handlers?.onReviewChapter?.(novel.id, activeChapter) : undefined, disabled: disabled || !handlers?.onReviewChapter, primary: true },
          { label: '刷新审阅', icon: RotateCw, onClick: novel ? () => handlers?.onRefreshReview?.(novel.id, activeChapter) : undefined, disabled: disabled || !handlers?.onRefreshReview },
        ],
      },
      {
        id: 'review-readers',
        title: '读者模拟',
        eyebrow: 'Reader Simulation',
        body: '把读者模拟、反 AI、俗套扫描、人设 OOC 统一收进审阅模式。',
        icon: Users,
        tone: 'sage',
        status: featureState.readerReport || featureState.readerSimulations?.length ? '已有反馈' : '待模拟',
        metrics: [
          { label: '模拟读者', value: String(featureState.readerSimulations?.length ?? 0) },
          { label: '俗套警报', value: String(featureState.churnAlerts?.length ?? 0) },
        ],
        actions: [
          { label: '模拟读者', icon: Users, onClick: novel ? () => handlers?.onSimulateReaders?.(novel.id, activeChapter) : undefined, disabled: disabled || !handlers?.onSimulateReaders, primary: true },
        ],
      },
      {
        id: 'review-humanizer',
        title: '反 AI 与声线',
        eyebrow: 'Humanizer / Voice',
        body: 'Humanizer、角色声线、OOC 检查会继续写入 Graph event，避免审阅结果散落。',
        icon: Palette,
        tone: 'gold',
        status: projectGuardStatus?.humanizerEnabled ? 'Humanizer on' : 'Humanizer off',
        metrics: [
          { label: '审阅结果', value: featureState.reviewResult ? '已生成' : '无' },
          { label: '失败事件', value: String(logs.filter((entry) => entry.level === 'error').length) },
        ],
        actions: [
          { label: '打开报告', icon: FileText, onClick: novel ? () => handlers?.onRefreshReview?.(novel.id, activeChapter) : undefined, disabled: disabled || !handlers?.onRefreshReview },
        ],
      },
    ]
  }

  return [
    {
      id: 'debug-prompts',
      title: 'Prompt Registry',
      eyebrow: 'Prompt / Trace',
      body: '提示词注册表、变量、输出绑定和调用记录进入开发者抽屉。',
      icon: Terminal,
      tone: 'ink',
      status: featureState.promptStats ? '已载入' : '待刷新',
      metrics: [
        { label: 'Prompts', value: String(featureState.prompts?.length ?? 0) },
        { label: 'AI traces', value: String(featureState.aiTraces?.length ?? 0) },
      ],
      actions: [
        { label: '刷新 Debug', icon: RotateCw, onClick: novel ? () => handlers?.onRefreshDebug?.(novel.id) : undefined, disabled: disabled || !handlers?.onRefreshDebug, primary: true },
        { label: '加载 Timeline', icon: Clock3, onClick: novel ? () => handlers?.onLoadTraceTimeline?.(novel.id, readUiString(asUiRecord(featureState.traceTimeline), ['traceId', 'trace_id', 'id']) || 'latest') : undefined, disabled: disabled || !handlers?.onLoadTraceTimeline },
      ],
    },
    {
      id: 'debug-invocation',
      title: 'Invocation 审阅流',
      eyebrow: 'Accept / Retry / Commit',
      body: '生成前后审阅、accept、retry、resume、commit 不再只藏在 trace JSON 里。',
      icon: Activity,
      tone: 'rose',
      status: invocationSessionId ? 'active' : 'none',
      metrics: [
        { label: 'Session', value: invocationSessionId || '-' },
        { label: 'Trace stats', value: featureState.traceStats ? '有' : '无' },
      ],
      actions: [
        { label: '加载', icon: Search, onClick: invocationSessionId ? () => handlers?.onLoadInvocation?.(invocationSessionId) : undefined, disabled: !invocationSessionId || busy || !handlers?.onLoadInvocation },
        { label: '接受', icon: CheckCircle2, onClick: invocationSessionId ? () => handlers?.onAcceptInvocation?.(invocationSessionId) : undefined, disabled: !invocationSessionId || busy || !handlers?.onAcceptInvocation, primary: true },
        { label: '重试', icon: RotateCw, onClick: invocationSessionId ? () => handlers?.onRetryInvocation?.(invocationSessionId) : undefined, disabled: !invocationSessionId || busy || !handlers?.onRetryInvocation },
        { label: '提交', icon: Save, onClick: invocationSessionId ? () => handlers?.onCommitInvocation?.(invocationSessionId) : undefined, disabled: !invocationSessionId || busy || !handlers?.onCommitInvocation },
      ],
    },
    {
      id: 'debug-memory',
      title: 'Memory Graph',
      eyebrow: 'Knowledge / RAG',
      body: '实体、三元组、伏笔和章节后置同步结果会在这里可视化，作为 Graph 与 PLM 的记忆桥。',
      icon: Brain,
      tone: 'sage',
      status: featureState.knowledgeStats ? '已索引' : '未索引',
      metrics: [
        { label: 'Triples', value: String(featureState.knowledgeTriples?.length ?? 0) },
        { label: 'Logs', value: String(logs.length) },
      ],
      actions: [
        { label: '刷新记忆', icon: RotateCw, onClick: novel ? () => handlers?.onRefreshMemory?.(novel.id) : undefined, disabled: disabled || !handlers?.onRefreshMemory, primary: true },
        { label: '推断图谱', icon: Network, onClick: novel ? () => handlers?.onInferKnowledgeGraph?.(novel.id) : undefined, disabled: disabled || !handlers?.onInferKnowledgeGraph },
      ],
    },
  ]
}

function ScriptStudioAdvancedDetail({
  workspaceMode,
  runtimeStatus,
  logs,
  novel,
  chapterEditor,
  selectedBibleData,
  featureState,
  handlers,
  ready,
  busy,
  projectGuardStatus,
  lastWritingSpecFailure,
}: {
  workspaceMode: Exclude<ScriptStudioWorkspaceMode, 'creation' | 'reader'>
  runtimeStatus: PlotPilotRuntimeStatus
  logs: PlotPilotLogEntry[]
  novel: PlotPilotNovel | null
  chapterEditor?: PlotPilotChapterEditor | null
  selectedBibleData?: PlotPilotBibleEditorData | null
  featureState: PlotPilotNativeFeatureState
  handlers?: PlotPilotNativeHandlers
  ready: boolean
  busy: boolean
  projectGuardStatus?: PlotPilotProjectGuardStatus | null
  lastWritingSpecFailure?: PlotPilotWritingSpecFailureView | null
}) {
  if (workspaceMode === 'setup') {
    return (
      <ScriptStudioSetupDetail
        novel={novel}
        selectedBibleData={selectedBibleData}
        featureState={featureState}
        handlers={handlers}
        ready={ready}
        busy={busy}
        projectGuardStatus={projectGuardStatus}
      />
    )
  }

  if (workspaceMode === 'planning') {
    return (
      <ScriptStudioPlanningDetail
        novel={novel}
        chapterEditor={chapterEditor}
        featureState={featureState}
        handlers={handlers}
        ready={ready}
        busy={busy}
      />
    )
  }

  if (workspaceMode === 'production') {
    return (
      <ScriptStudioProductionDetail
        runtimeStatus={runtimeStatus}
        novel={novel}
        chapterEditor={chapterEditor}
        featureState={featureState}
        handlers={handlers}
        ready={ready}
        busy={busy}
      />
    )
  }

  if (workspaceMode === 'review') {
    return (
      <ScriptStudioReviewDetail
        logs={logs}
        novel={novel}
        chapterEditor={chapterEditor}
        featureState={featureState}
        handlers={handlers}
        ready={ready}
        busy={busy}
        projectGuardStatus={projectGuardStatus}
        lastWritingSpecFailure={lastWritingSpecFailure}
      />
    )
  }

  if (workspaceMode === 'debug') {
    return (
      <ScriptStudioDebugDetail
        logs={logs}
        novel={novel}
        featureState={featureState}
        handlers={handlers}
        ready={ready}
        busy={busy}
      />
    )
  }

  return (
    <ScriptStudioModeMapDetail
      workspaceMode={workspaceMode}
      novel={novel}
      featureState={featureState}
      handlers={handlers}
      ready={ready}
      busy={busy}
    />
  )
}

function ScriptStudioSetupDetail({
  novel,
  selectedBibleData,
  featureState,
  handlers,
  ready,
  busy,
  projectGuardStatus,
}: {
  novel: PlotPilotNovel | null
  selectedBibleData?: PlotPilotBibleEditorData | null
  featureState: PlotPilotNativeFeatureState
  handlers?: PlotPilotNativeHandlers
  ready: boolean
  busy: boolean
  projectGuardStatus?: PlotPilotProjectGuardStatus | null
}) {
  const [draft, setDraft] = React.useState<PlotPilotOnboardingDraft>(() => onboardingDraftFromNovel(novel))
  const [bibleDraft, setBibleDraft] = React.useState<PlotPilotBibleEditorData | null>(selectedBibleData ?? null)
  const [writingSpecId, setWritingSpecId] = React.useState(projectGuardStatus?.writingSpecId ?? '')

  React.useEffect(() => {
    setDraft(onboardingDraftFromNovel(novel))
  }, [novel?.id])

  React.useEffect(() => {
    setBibleDraft(selectedBibleData ?? null)
  }, [selectedBibleData])

  React.useEffect(() => {
    setWritingSpecId(projectGuardStatus?.writingSpecId ?? '')
  }, [projectGuardStatus?.writingSpecId])

  const updateDraft = (patch: Partial<PlotPilotOnboardingDraft>) => {
    setDraft((current) => ({ ...current, ...patch }))
  }
  const canCreate = Boolean(!novel && ready && !busy && draft.title.trim() && handlers?.onCreateNovelFromOnboarding)
  const canSave = Boolean(novel && ready && !busy && draft.title.trim() && handlers?.onSaveNovelSetup)
  const canSaveBible = Boolean(novel && ready && !busy && bibleDraft && handlers?.onSaveBible)

  return (
    <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_380px]">
      <ScriptStudioLightPanel
        icon={WandSparkles}
        title="书籍向导"
        detail="类型、世界观、结构、节奏和文风"
        action={
          <div className="flex flex-wrap gap-2">
            {!novel ? (
              <ScriptStudioLightAction
                onClick={() => handlers?.onCreateNovelFromOnboarding?.(draft)}
                disabled={!canCreate}
                primary
              >
                <Plus className="size-3.5" />
                创建书目
              </ScriptStudioLightAction>
            ) : (
              <>
                <ScriptStudioLightAction
                  onClick={() => handlers?.onSaveNovelSetup?.(novel.id, draft)}
                  disabled={!canSave}
                  primary
                >
                  <Save className="size-3.5" />
                  保存设定
                </ScriptStudioLightAction>
                <ScriptStudioLightAction
                  onClick={() => handlers?.onRefreshSetup?.(novel.id)}
                  disabled={!ready || busy || !handlers?.onRefreshSetup}
                >
                  <RotateCw className="size-3.5" />
                  刷新
                </ScriptStudioLightAction>
              </>
            )}
            <ScriptStudioLightAction
              onClick={handlers?.onImportStorylet}
              disabled={!ready || busy || !handlers?.onImportStorylet}
            >
              <GitBranch className="size-3.5" />
              导入 Storylet
            </ScriptStudioLightAction>
          </div>
        }
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <ScriptStudioLightTextInput label="书名" value={draft.title} onChange={(title) => updateDraft({ title })} />
          <ScriptStudioLightTextInput label="作者" value={draft.author} onChange={(author) => updateDraft({ author })} />
          <ScriptStudioLightTextarea
            className="lg:col-span-2"
            label="Premise"
            value={draft.premise}
            onChange={(premise) => updateDraft({ premise })}
            placeholder="核心人物、冲突、世界规则和主要承诺。"
            minRows={5}
          />
          <ScriptStudioLightTextInput label="类型" value={draft.genre} onChange={(genre) => updateDraft({ genre })} placeholder="悬疑 / 科幻 / 都市 / 奇幻" />
          <ScriptStudioLightTextInput label="世界观预设" value={draft.worldPreset} onChange={(worldPreset) => updateDraft({ worldPreset })} />
          <ScriptStudioLightTextInput label="故事结构" value={draft.storyStructure} onChange={(storyStructure) => updateDraft({ storyStructure })} />
          <ScriptStudioLightTextInput label="节奏控制" value={draft.pacingControl} onChange={(pacingControl) => updateDraft({ pacingControl })} />
          <ScriptStudioLightSelect
            label="篇幅"
            value={draft.lengthTier}
            onChange={(lengthTier) => updateDraft({ lengthTier: lengthTier as PlotPilotOnboardingDraft['lengthTier'] })}
            options={[
              ['', '自定义'],
              ['short', '短篇'],
              ['standard', '标准长篇'],
              ['epic', '史诗长篇'],
            ]}
          />
          <ScriptStudioLightNumberInput label="目标章节" value={draft.targetChapters} min={1} onChange={(targetChapters) => updateDraft({ targetChapters })} />
          <ScriptStudioLightNumberInput label="单章字数" value={draft.targetWordsPerChapter} min={300} onChange={(targetWordsPerChapter) => updateDraft({ targetWordsPerChapter })} />
          <ScriptStudioLightTextarea
            className="lg:col-span-2"
            label="文风"
            value={draft.writingStyle}
            onChange={(writingStyle) => updateDraft({ writingStyle })}
            minRows={3}
          />
          <ScriptStudioLightTextarea
            className="lg:col-span-2"
            label="特殊要求"
            value={draft.specialRequirements}
            onChange={(specialRequirements) => updateDraft({ specialRequirements })}
            minRows={3}
          />
        </div>
      </ScriptStudioLightPanel>

      <div className="space-y-4">
        <ScriptStudioLightPanel
          icon={BookOpen}
          title="Bible 原生编辑"
          detail="人物、世界观、地点、时间线、风格"
          action={
            novel ? (
              <div className="flex flex-wrap gap-2">
                <ScriptStudioLightAction
                  onClick={() => handlers?.onGenerateBible?.(novel.id)}
                  disabled={!ready || busy || !handlers?.onGenerateBible}
                  primary
                >
                  <Sparkles className="size-3.5" />
                  生成
                </ScriptStudioLightAction>
                <ScriptStudioLightAction
                  onClick={() => bibleDraft && handlers?.onSaveBible?.(novel.id, bibleDraft)}
                  disabled={!canSaveBible}
                >
                  <Save className="size-3.5" />
                  保存
                </ScriptStudioLightAction>
              </div>
            ) : null
          }
        >
          {bibleDraft ? (
            <div className="space-y-3">
              <ScriptStudioLightMetricGrid
                metrics={[
                  { label: '人物', value: String(bibleDraft.characters.length) },
                  { label: '世界观', value: String(bibleDraft.world_settings.length) },
                  { label: '地点', value: String(bibleDraft.locations.length) },
                  { label: '文风', value: String(bibleDraft.style_notes.length) },
                ]}
              />
              <ScriptStudioLightBibleRows
                title="人物卡"
                rows={bibleDraft.characters}
                fields={[
                  ['name', '姓名'],
                  ['role', '角色'],
                  ['description', '描述'],
                ]}
                onRowsChange={(characters) => setBibleDraft((current) => current ? { ...current, characters } : current)}
                createRow={() => ({ id: createDraftId('character'), name: '新角色', role: '', description: '' })}
              />
              <ScriptStudioLightBibleRows
                title="世界观"
                rows={bibleDraft.world_settings}
                fields={[
                  ['name', '名称'],
                  ['setting_type', '类型'],
                  ['description', '描述'],
                ]}
                onRowsChange={(world_settings) => setBibleDraft((current) => current ? { ...current, world_settings } : current)}
                createRow={() => ({ id: createDraftId('world'), name: '新设定', setting_type: 'rule', description: '' })}
              />
              <ScriptStudioLightBibleRows
                title="地点"
                rows={bibleDraft.locations}
                fields={[
                  ['name', '名称'],
                  ['location_type', '类型'],
                  ['description', '描述'],
                ]}
                onRowsChange={(locations) => setBibleDraft((current) => current ? { ...current, locations } : current)}
                createRow={() => ({ id: createDraftId('location'), name: '新地点', location_type: 'place', description: '' })}
              />
            </div>
          ) : (
            <ScriptStudioLightEmpty
              compact
              icon={BookOpen}
              title="Bible 尚未载入"
              body="生成或打开 Bible 后，可以在白色工作台内编辑主要设定。完整字段仍保留在兼容控制台。"
            />
          )}
        </ScriptStudioLightPanel>

        <ScriptStudioLightPanel icon={ShieldCheck} title="写作守门" detail="Codex / WritingSpec / Humanizer">
          <div className="space-y-3">
            <ScriptStudioLightStatusBlock label="WritingSpec" value={projectGuardStatus?.writingSpecTitle ?? projectGuardStatus?.writingSpecId ?? '未绑定'} />
            <ScriptStudioLightStatusBlock label="Humanizer" value={projectGuardStatus?.humanizerEnabled ? (projectGuardStatus.humanizerPolicy ?? 'on') : 'off'} />
            <ScriptStudioLightTextInput
              label="WritingSpec ID"
              value={writingSpecId}
              onChange={setWritingSpecId}
              placeholder="输入 writing spec id"
            />
            <div className="flex flex-wrap gap-2">
              <ScriptStudioLightAction
                onClick={() => novel && handlers?.onBindWritingSpec?.(novel.id, writingSpecId.trim())}
                disabled={!novel || !ready || busy || !writingSpecId.trim() || !handlers?.onBindWritingSpec}
                primary
              >
                <ShieldCheck className="size-3.5" />
                绑定
              </ScriptStudioLightAction>
              <ScriptStudioLightAction
                onClick={() => novel && handlers?.onClearWritingSpec?.(novel.id)}
                disabled={!novel || !ready || busy || !projectGuardStatus?.writingSpecId || !handlers?.onClearWritingSpec}
              >
                <Trash2 className="size-3.5" />
                清除
              </ScriptStudioLightAction>
            </div>
          </div>
        </ScriptStudioLightPanel>
      </div>
    </div>
  )
}

function ScriptStudioPlanningDetail({
  novel,
  chapterEditor,
  featureState,
  handlers,
  ready,
  busy,
}: {
  novel: PlotPilotNovel | null
  chapterEditor?: PlotPilotChapterEditor | null
  featureState: PlotPilotNativeFeatureState
  handlers?: PlotPilotNativeHandlers
  ready: boolean
  busy: boolean
}) {
  const [outlineDraft, setOutlineDraft] = React.useState<PlotPilotOutlineDraft>(() => outlineDraftFromValue(featureState.plotOutline))

  React.useEffect(() => {
    setOutlineDraft(outlineDraftFromValue(featureState.plotOutline))
  }, [featureState.plotOutline])

  if (!novel) {
    return (
      <ScriptStudioLightEmpty
        icon={GitBranch}
        title="还没有可规划的书目"
        body="先完成设定或导入 Storylet，再生成主线候选、Plot Outline 和连续规划。"
      />
    )
  }

  const currentChapter = chapterEditor?.novelId === novel.id
    ? chapterEditor.chapterNumber
    : novel.chapters?.[0]?.number ?? 1
  const loading = featureState.loadingKey === 'planning' || featureState.loadingKey === 'setup'
  const mainPlotOptions = featureState.mainPlotOptions ?? []
  const beatScenes = Array.isArray(featureState.beatSheet?.scenes)
    ? featureState.beatSheet.scenes as Array<Record<string, unknown>>
    : []

  return (
    <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_380px]">
      <ScriptStudioLightPanel
        icon={GitBranch}
        title="Plot Outline"
        detail="主线、冲突、结局和阶段规划"
        action={
          <div className="flex flex-wrap gap-2">
            <ScriptStudioLightAction
              onClick={() => handlers?.onSuggestMainPlotOptions?.(novel.id)}
              disabled={!ready || busy || loading || !handlers?.onSuggestMainPlotOptions}
            >
              <GitBranch className="size-3.5" />
              主线候选
            </ScriptStudioLightAction>
            <ScriptStudioLightAction
              onClick={() => handlers?.onGeneratePlotOutline?.(novel.id)}
              disabled={!ready || busy || loading || !handlers?.onGeneratePlotOutline}
              primary
            >
              {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
              生成大纲
            </ScriptStudioLightAction>
            <ScriptStudioLightAction
              onClick={() => handlers?.onSavePlotOutline?.(novel.id, outlineDraftToPayload(outlineDraft))}
              disabled={!ready || busy || !handlers?.onSavePlotOutline}
            >
              <Save className="size-3.5" />
              保存
            </ScriptStudioLightAction>
          </div>
        }
      >
        <ScriptStudioLightOutlineEditor draft={outlineDraft} onChange={setOutlineDraft} />
      </ScriptStudioLightPanel>

      <div className="space-y-4">
        <ScriptStudioLightPanel icon={ListChecks} title="主线候选" detail={`${mainPlotOptions.length} options`}>
          {mainPlotOptions.length ? (
            <div className="space-y-2">
              {mainPlotOptions.slice(0, 5).map((option, index) => (
                <div key={String(option.id ?? index)} className="rounded-[9px] border border-[#e2ddd2] bg-[#faf9f4] p-3">
                  <div className="text-xs font-semibold text-[#242821]">{String(option.title ?? `候选 ${index + 1}`)}</div>
                  <div className="mt-1 line-clamp-3 text-xs leading-5 text-[#666b62]">
                    {String(option.logline ?? option.core_conflict ?? option.summary ?? '暂无摘要')}
                  </div>
                  <div className="mt-2 font-mono text-[10px] text-[#8b8579]">{String(option.type ?? 'main_plot')}</div>
                </div>
              ))}
            </div>
          ) : (
            <ScriptStudioLightEmpty compact icon={GitBranch} title="暂无候选" body="点击“主线候选”生成多个可选主线方向。" />
          )}
        </ScriptStudioLightPanel>

        <ScriptStudioLightPanel icon={Network} title="宏观 / 连续规划" detail={`当前断点 第${currentChapter}章`}>
          <div className="space-y-3">
            <ScriptStudioLightMetricGrid
              metrics={[
                { label: '章节', value: String(novel.chapterCount ?? 0) },
                { label: 'Beat', value: String(novel.beatCount ?? beatScenes.length) },
                { label: '结构', value: featureState.planningStructure ? 'loaded' : 'pending' },
                { label: '结果', value: featureState.planningResult ? 'ready' : 'empty' },
              ]}
            />
            <div className="flex flex-wrap gap-2">
              <ScriptStudioLightAction
                onClick={() => handlers?.onGenerateMacroPlan?.(novel.id)}
                disabled={!ready || busy || !handlers?.onGenerateMacroPlan}
                primary
              >
                <Network className="size-3.5" />
                宏观规划
              </ScriptStudioLightAction>
              <ScriptStudioLightAction
                onClick={() => handlers?.onContinuePlanning?.(novel.id, currentChapter)}
                disabled={!ready || busy || !handlers?.onContinuePlanning}
              >
                <Repeat2 className="size-3.5" />
                继续规划
              </ScriptStudioLightAction>
              <ScriptStudioLightAction
                onClick={() => handlers?.onGenerateBeat?.(novel.id)}
                disabled={!ready || busy || !handlers?.onGenerateBeat}
              >
                <ListChecks className="size-3.5" />
                生成 Beat
              </ScriptStudioLightAction>
            </div>
            <ScriptStudioLightJson value={featureState.planningResult ?? featureState.planningStructure ?? '暂无规划结果。'} />
          </div>
        </ScriptStudioLightPanel>
      </div>
    </div>
  )
}

function ScriptStudioProductionDetail({
  runtimeStatus,
  novel,
  chapterEditor,
  featureState,
  handlers,
  ready,
  busy,
}: {
  runtimeStatus: PlotPilotRuntimeStatus
  novel: PlotPilotNovel | null
  chapterEditor?: PlotPilotChapterEditor | null
  featureState: PlotPilotNativeFeatureState
  handlers?: PlotPilotNativeHandlers
  ready: boolean
  busy: boolean
}) {
  const chapters = novel?.chapters ?? []
  const activeChapterNumber = chapterEditor?.chapterNumber ?? chapters[0]?.number ?? 1
  const activeChapter = chapters.find((chapter) => chapter.number === activeChapterNumber) ?? chapters[0] ?? null
  const [hostedFrom, setHostedFrom] = React.useState(activeChapterNumber)
  const [hostedTo, setHostedTo] = React.useState(activeChapterNumber + 2)
  const [hostedAutoSave, setHostedAutoSave] = React.useState(true)
  const [hostedAutoOutline, setHostedAutoOutline] = React.useState(true)
  const [maxAutoChapters, setMaxAutoChapters] = React.useState(3)
  const [autoApprove, setAutoApprove] = React.useState(Boolean(novel?.autoApproveMode))

  React.useEffect(() => {
    if (!novel) return
    const nextStart = chapterEditor?.chapterNumber ?? Math.max(1, (novel.chapters?.length ?? 0) + 1)
    setHostedFrom(nextStart)
    setHostedTo(Math.max(nextStart, nextStart + 2))
    setMaxAutoChapters(3)
    setAutoApprove(Boolean(novel.autoApproveMode))
  }, [chapterEditor?.chapterNumber, novel?.autoApproveMode, novel?.chapters?.length, novel?.id])

  if (!novel) {
    return (
      <ScriptStudioLightEmpty
        icon={FileText}
        title="还没有可生产的书目"
        body="先从设定模式创建书目或导入 Storylet，再进入章节生成、连写和 Graph 回写。"
      />
    )
  }

  const editorContentSize = countDraftText(chapterEditor?.content)
  const canGenerate = Boolean(ready && !busy && handlers?.onGenerateChapter)
  const canSave = Boolean(ready && !busy && chapterEditor && handlers?.onSaveChapter && (chapterEditor.dirty || editorContentSize > 0))
  const canWriteBack = Boolean(ready && !busy && handlers?.onWriteBackChapter && !chapterEditor?.dirty && (editorContentSize > 0 || (activeChapter?.wordCount ?? 0) > 0))
  const autoStatus = asUiRecord(featureState.autopilotStatus)
  const breakerStatus = asUiRecord(featureState.autopilotCircuitBreaker)
  const autopilotEvents = featureState.autopilotEvents ?? []
  const autopilotStatusEvents = featureState.autopilotStatusEvents ?? []
  const autopilotChapterEvents = featureState.autopilotChapterEvents ?? []
  const autopilotChapterSnapshot = asUiRecord(featureState.autopilotChapterSnapshot)
  const hostedWriteEvents = featureState.hostedWriteEvents ?? []
  const hostedWriteSummary = asUiRecord(featureState.hostedWriteSummary)
  const activeJobProgress = Number(runtimeStatus.activeJob?.progress ?? 0)
  const progress = Math.round(activeJobProgress > 0 && activeJobProgress <= 1 ? activeJobProgress * 100 : activeJobProgress)
  const autoProgress = normalizeProgressPercent(Number(autoStatus.progress_pct ?? progress))
  const hostedTotal = Number(hostedWriteSummary.totalChapters ?? Math.max(1, hostedTo - hostedFrom + 1))
  const hostedSaved = Number(hostedWriteSummary.savedCount ?? 0)
  const hostedProgress = hostedTotal > 0 ? Math.round((hostedSaved / hostedTotal) * 100) : 0
  const autopilotState = readUiString(autoStatus, ['autopilot_status', 'state', 'status', 'phase']) || 'idle'
  const currentStage = readUiString(autoStatus, ['current_stage', 'last_stable_stage', 'stage']) || 'unknown'
  const breakerState = readUiString(breakerStatus, ['state', 'status']) || 'normal'
  const breakerErrorCount = Number(breakerStatus.error_count ?? breakerStatus.errorCount ?? 0)
  const needsReview = Boolean(autoStatus.needs_review || autoStatus.requires_ai_review || autoStatus.has_active_invocation)
  const activeInvocationId = readUiString(autoStatus, ['invocation_session_id', 'active_invocation_session_id', 'session_id'])
    || readUiString(asUiRecord(featureState.activeInvocation), ['sessionId', 'session_id', 'id'])
  const canHostedWrite = Boolean(ready && !busy && handlers?.onHostedWrite && hostedFrom > 0 && hostedTo >= hostedFrom)
  const canStartAutopilot = Boolean(
    ready
    && !busy
    && handlers?.onStartAutopilot
    && maxAutoChapters > 0
    && (novel.targetChapters ?? 0) > 0
    && (novel.targetWordsPerChapter ?? 0) > 0,
  )
  const productionEvents = buildProductionTimelineEvents({
    autopilotEvents,
    autopilotStatusEvents,
    autopilotChapterEvents,
    hostedWriteEvents,
  })

  return (
    <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_340px]">
      <ScriptStudioLightPanel
        icon={FileText}
        title="章节生产台"
        detail="生成、编辑、保存和回写 Graph 的白色原生入口"
        action={
          <div className="flex flex-wrap gap-2">
            {chapters.length === 0 ? (
              <ScriptStudioLightAction
                onClick={() => handlers?.onPrepareFirstChapter?.(novel.id)}
                disabled={!ready || busy || !handlers?.onPrepareFirstChapter}
                primary
              >
                <Plus className="size-3.5" />
                准备第1章
              </ScriptStudioLightAction>
            ) : null}
            <ScriptStudioLightAction
              onClick={() => handlers?.onGenerateChapter?.(novel.id, activeChapterNumber)}
              disabled={!canGenerate}
              primary
            >
              <Sparkles className="size-3.5" />
              生成第{activeChapterNumber}章
            </ScriptStudioLightAction>
            <ScriptStudioLightAction
              onClick={() => chapterEditor && handlers?.onSaveChapter?.(novel.id, chapterEditor.chapterNumber, chapterEditor.content)}
              disabled={!canSave}
            >
              <Save className="size-3.5" />
              保存正文
            </ScriptStudioLightAction>
            <ScriptStudioLightAction
              onClick={() => handlers?.onWriteBackChapter?.(novel.id, activeChapterNumber)}
              disabled={!canWriteBack}
              title={chapterEditor?.dirty ? '先保存正文再回写 Graph' : undefined}
            >
              <GitBranch className="size-3.5" />
              回写 Graph
            </ScriptStudioLightAction>
          </div>
        }
      >
        <div className="grid min-h-[520px] gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
          <div className="min-h-0 rounded-[10px] border border-[#e2ddd2] bg-[#faf9f4] p-2">
            <div className="flex items-center justify-between px-2 py-1.5">
              <div className="text-xs font-semibold text-[#4d534a]">章节目录</div>
              <div className="font-mono text-[10px] text-[#8b8579]">{chapters.length} chapters</div>
            </div>
            <div className="max-h-[612px] space-y-1 overflow-y-auto pr-1">
              {chapters.length ? chapters.map((chapter) => {
                const active = chapter.number === activeChapterNumber
                return (
                  <button
                    key={chapter.id}
                    type="button"
                    disabled={!handlers?.onOpenChapter || chapter.number === undefined}
                    onClick={() => chapter.number !== undefined && handlers?.onOpenChapter?.(novel.id, chapter.number)}
                    className={cn(
                      'w-full rounded-[8px] border px-3 py-2.5 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-[#174a38]/20 disabled:cursor-default',
                      active
                        ? 'border-[#174a38]/35 bg-white text-[#20251f] shadow-[0_4px_12px_rgba(43,38,27,0.08)]'
                        : 'border-transparent bg-transparent text-[#565b52] hover:border-[#e2ddd2] hover:bg-white',
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full border border-[#ded9cd] bg-[#f5f3ec] font-mono text-[10px] text-[#5f655a]">
                        {chapter.number ?? '-'}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-xs font-semibold">{chapter.title}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5 font-mono text-[10px] text-[#8b8579]">
                      <span>{chapter.status ?? 'draft'}</span>
                      <span>{formatCount(chapter.wordCount, 'words')}</span>
                    </div>
                  </button>
                )
              }) : (
                <div className="rounded-[8px] border border-dashed border-[#ded9cd] bg-white px-3 py-8 text-center text-xs text-[#8b8579]">
                  尚未建立章节。
                </div>
              )}
            </div>
          </div>

          <div className="flex min-h-0 flex-col rounded-[10px] border border-[#e2ddd2] bg-white">
            <div className="flex shrink-0 flex-col gap-3 border-b border-[#e8e3d8] px-4 py-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#969085]">Chapter editor</div>
                <h3 className="mt-1 truncate text-sm font-semibold text-[#22271f]">
                  第{activeChapterNumber}章 · {chapterEditor?.title ?? activeChapter?.title ?? '未载入正文'}
                </h3>
              </div>
              <div className="flex flex-wrap gap-1.5 font-mono text-[10px] text-[#7d796f]">
                <span className="rounded-full border border-[#e0dbd0] bg-[#f8f7f2] px-2 py-1">{chapterEditor?.status ?? activeChapter?.status ?? 'draft'}</span>
                <span className="rounded-full border border-[#e0dbd0] bg-[#f8f7f2] px-2 py-1">{editorContentSize.toLocaleString()} chars</span>
                {chapterEditor?.dirty ? <span className="rounded-full border border-[#e5c978] bg-[#fff6d5] px-2 py-1 text-[#7a5b00]">未保存</span> : null}
              </div>
            </div>

            {chapterEditor?.generationHint ? (
              <div className="border-b border-[#eee9dd] bg-[#fbfaf6] px-4 py-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#969085]">生成提示</div>
                <div className="mt-1 line-clamp-3 text-xs leading-5 text-[#666b62]">{chapterEditor.generationHint}</div>
              </div>
            ) : null}

            {chapterEditor?.lastWritingSpecFailure ? (
              <div className="border-b border-[#eee9dd] bg-[#fff8ed] px-4 py-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#9a6b00]" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#5b3f00]">WritingSpec 阻断</div>
                    <div className="mt-1 text-xs leading-5 text-[#745a23]">{chapterEditor.lastWritingSpecFailure.message}</div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="min-h-0 flex-1 p-4">
              <textarea
                value={chapterEditor?.content ?? ''}
                onChange={(event) => handlers?.onChangeChapterDraft?.(event.currentTarget.value)}
                disabled={!chapterEditor || chapterEditor.loading || busy || !handlers?.onChangeChapterDraft}
                placeholder="章节正文会出现在这里。可以生成、手写、保存，再回写 Drama Graph。"
                className="min-h-[390px] w-full resize-none rounded-[9px] border border-[#ded9cd] bg-[#fdfcf8] px-4 py-3 text-sm leading-7 text-[#2c3029] outline-none placeholder:text-[#aaa398] focus:border-[#174a38]/45 focus:ring-2 focus:ring-[#174a38]/10 disabled:opacity-60"
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#817c73]">
                <span>保存后写入 PlotPilot runtime；回写后同步到 Drama Graph draft/script 字段。</span>
                <span className="font-mono">{chapterEditor?.chapterId ?? activeChapter?.id ?? 'no-chapter-id'}</span>
              </div>
            </div>
          </div>
        </div>
      </ScriptStudioLightPanel>

      <div className="space-y-4">
        <ScriptStudioLightPanel icon={Gauge} title="Autopilot 控制器" detail={`${autopilotState} / ${currentStage}`}>
          <div className="space-y-3">
            <ScriptStudioLightMetricGrid
              metrics={[
                { label: '状态', value: autopilotState },
                { label: '阶段', value: currentStage },
                { label: '当前章', value: String(autoStatus.current_chapter_number ?? autoStatus.current_chapter_in_act ?? '-') },
                { label: '进度', value: `${autoProgress}%` },
              ]}
            />
            <ScriptStudioLightProgressBar value={autoProgress} tone={needsReview ? 'warning' : 'green'} />
            <div className="grid gap-3 sm:grid-cols-2">
              <ScriptStudioLightNumberInput
                label="保护上限"
                min={1}
                value={maxAutoChapters}
                onChange={setMaxAutoChapters}
              />
              <ScriptStudioLightStatusBlock label="当前任务" value={runtimeStatus.activeJob?.label ?? 'none'} />
            </div>
            <ScriptStudioLightToggle
              label="全自动跳过审阅"
              checked={autoApprove}
              onCheckedChange={(checked) => {
                setAutoApprove(checked)
                handlers?.onSetAutoApproveMode?.(novel.id, checked)
              }}
              disabled={!ready || busy || !handlers?.onSetAutoApproveMode}
            />
            <div className="flex flex-wrap gap-2">
              <ScriptStudioLightAction
                onClick={() => handlers?.onStartAutopilot?.(
                  novel.id,
                  maxAutoChapters,
                  novel.targetChapters ?? 3,
                  novel.targetWordsPerChapter ?? 2500,
                  autoApprove,
                )}
                disabled={!canStartAutopilot}
                primary
              >
                <Play className="size-3.5" />
                启动
              </ScriptStudioLightAction>
              <ScriptStudioLightAction
                onClick={() => handlers?.onStopAutopilot?.(novel.id)}
                disabled={!ready || !handlers?.onStopAutopilot}
              >
                <Pause className="size-3.5" />
                暂停
              </ScriptStudioLightAction>
              <ScriptStudioLightAction
                onClick={() => handlers?.onResumeAutopilot?.(novel.id)}
                disabled={!ready || busy || !handlers?.onResumeAutopilot}
              >
                <Repeat2 className="size-3.5" />
                恢复
              </ScriptStudioLightAction>
              <ScriptStudioLightAction
                onClick={() => handlers?.onRefreshAutopilot?.(novel.id)}
                disabled={!ready || busy || !handlers?.onRefreshAutopilot}
              >
                <RotateCw className="size-3.5" />
                刷新
              </ScriptStudioLightAction>
            </div>
          </div>
        </ScriptStudioLightPanel>

        <ScriptStudioLightPanel icon={Film} title="Hosted Write" detail="多章批量生成 / 保存确认">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <ScriptStudioLightNumberInput label="From" min={1} value={hostedFrom} onChange={setHostedFrom} />
              <ScriptStudioLightNumberInput label="To" min={hostedFrom} value={hostedTo} onChange={setHostedTo} />
            </div>
            <div className="grid gap-2">
              <ScriptStudioLightToggle label="自动保存" checked={hostedAutoSave} onCheckedChange={setHostedAutoSave} />
              <ScriptStudioLightToggle label="自动大纲" checked={hostedAutoOutline} onCheckedChange={setHostedAutoOutline} />
            </div>
            <ScriptStudioLightProgressBar value={hostedProgress} tone={hostedProgress >= 100 ? 'green' : 'neutral'} />
            <ScriptStudioLightMetricGrid
              metrics={[
                { label: '保存章节', value: `${hostedSaved}/${hostedTotal}` },
                { label: '流式块', value: String(hostedWriteSummary.chunkCount ?? 0) },
                { label: '字符', value: String(hostedWriteSummary.charCount ?? 0) },
                { label: '状态', value: String(hostedWriteSummary.lastType ?? 'idle') },
              ]}
            />
            <ScriptStudioLightAction
              onClick={() => handlers?.onHostedWrite?.(novel.id, hostedFrom, hostedTo, hostedAutoSave, hostedAutoOutline)}
              disabled={!canHostedWrite}
              primary
            >
              <Play className="size-3.5" />
              连写 {hostedFrom}-{hostedTo}
            </ScriptStudioLightAction>
          </div>
        </ScriptStudioLightPanel>

        <ScriptStudioLightPanel icon={ShieldCheck} title="失败恢复" detail={`${breakerState} / ${breakerErrorCount} errors`}>
          <div className="space-y-3">
            <div className="rounded-[10px] border border-[#e2ddd2] bg-[#faf9f4] p-3">
              <div className="flex items-start gap-2">
                {breakerErrorCount > 0 || needsReview ? (
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#9a6b00]" />
                ) : (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#2f6b46]" />
                )}
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#2f352f]">
                    {needsReview ? '等待 AI Invocation 审阅' : breakerErrorCount > 0 ? '存在失败，可重置后恢复' : '暂无阻断'}
                  </div>
                  <div className="mt-1 text-[11px] leading-5 text-[#6f6a60]">
                    {activeInvocationId
                      ? `Session ${activeInvocationId}`
                      : String(breakerStatus.last_error ?? breakerStatus.message ?? '生产链路可继续。')}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <ScriptStudioLightAction
                onClick={() => handlers?.onResumeAutopilot?.(novel.id)}
                disabled={!ready || busy || !handlers?.onResumeAutopilot}
              >
                <Repeat2 className="size-3.5" />
                恢复
              </ScriptStudioLightAction>
              <ScriptStudioLightAction
                onClick={() => handlers?.onResetAutopilotBreaker?.(novel.id)}
                disabled={!ready || busy || !handlers?.onResetAutopilotBreaker}
              >
                <RotateCw className="size-3.5" />
                重置失败
              </ScriptStudioLightAction>
              {activeInvocationId ? (
                <ScriptStudioLightAction
                  onClick={() => handlers?.onLoadInvocation?.(activeInvocationId)}
                  disabled={!ready || busy || !handlers?.onLoadInvocation}
                >
                  <Search className="size-3.5" />
                  打开审阅
                </ScriptStudioLightAction>
              ) : null}
            </div>
          </div>
        </ScriptStudioLightPanel>

        <ScriptStudioLightPanel
          icon={FileText}
          title="章节流"
          detail={`chapter ${String(autopilotChapterSnapshot.chapterNumber ?? autoStatus.current_chapter_number ?? '-')}`}
        >
          <div className="space-y-3">
            <ScriptStudioLightMetricGrid
              metrics={[
                { label: '章节', value: String(autopilotChapterSnapshot.chapterNumber ?? '-') },
                { label: 'Beat', value: String(autopilotChapterSnapshot.beatIndex ?? '-') },
                { label: '字数', value: String(autopilotChapterSnapshot.wordCount ?? '-') },
                { label: '事件', value: String(autopilotChapterEvents.length) },
              ]}
            />
            <div className="max-h-52 overflow-auto rounded-[10px] border border-[#e2ddd2] bg-[#fbfaf6] p-3 text-xs leading-6 text-[#565b52]">
              {String(autopilotChapterSnapshot.content ?? autopilotChapterSnapshot.chunk ?? '等待章节正文流。')}
            </div>
          </div>
        </ScriptStudioLightPanel>

        <ScriptStudioLightPanel icon={Activity} title="生产事件" detail={`${productionEvents.length} events`}>
          <ScriptStudioProductionTimeline events={productionEvents} />
        </ScriptStudioLightPanel>

        <ScriptStudioLightPanel icon={GitBranch} title="Graph event 闭环" detail="生产动作必须成为可追踪事件">
          <ScriptStudioGraphEventNotice
            items={[
              'plm.hostedWrite.session/chapter_start/saved/session_done',
              'plm.autopilot.started/stopped/resumed/breakerReset',
              'plm.autopilot.error/beat_error/paused_for_review',
              'plm.chapter.writeback.completed -> graph event',
            ]}
          />
        </ScriptStudioLightPanel>
      </div>
    </div>
  )
}

function ScriptStudioReviewDetail({
  logs,
  novel,
  chapterEditor,
  featureState,
  handlers,
  ready,
  busy,
  projectGuardStatus,
  lastWritingSpecFailure,
}: {
  logs: PlotPilotLogEntry[]
  novel: PlotPilotNovel | null
  chapterEditor?: PlotPilotChapterEditor | null
  featureState: PlotPilotNativeFeatureState
  handlers?: PlotPilotNativeHandlers
  ready: boolean
  busy: boolean
  projectGuardStatus?: PlotPilotProjectGuardStatus | null
  lastWritingSpecFailure?: PlotPilotWritingSpecFailureView | null
}) {
  const chapterNumber = chapterEditor?.chapterNumber ?? novel?.chapters?.[0]?.number ?? 1
  const failure = lastWritingSpecFailure ?? chapterEditor?.lastWritingSpecFailure ?? null

  return (
    <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_340px]">
      <ScriptStudioLightPanel
        icon={ShieldCheck}
        title="审阅工作台"
        detail="WritingSpec、读者模拟、反 AI、人设 OOC 的统一入口"
        action={
          novel ? (
            <div className="flex flex-wrap gap-2">
              <ScriptStudioLightAction
                onClick={() => handlers?.onReviewChapter?.(novel.id, chapterNumber)}
                disabled={!ready || busy || !handlers?.onReviewChapter}
                primary
              >
                <ShieldCheck className="size-3.5" />
                审阅第{chapterNumber}章
              </ScriptStudioLightAction>
              <ScriptStudioLightAction
                onClick={() => handlers?.onSimulateReaders?.(novel.id, chapterNumber)}
                disabled={!ready || busy || !handlers?.onSimulateReaders}
              >
                <Users className="size-3.5" />
                读者模拟
              </ScriptStudioLightAction>
            </div>
          ) : null
        }
      >
        <div className="grid gap-3 md:grid-cols-3">
          <ScriptStudioLightStatusBlock label="WritingSpec" value={projectGuardStatus?.writingSpecTitle ?? projectGuardStatus?.writingSpecId ?? '未绑定'} />
          <ScriptStudioLightStatusBlock label="Humanizer" value={projectGuardStatus?.humanizerEnabled ? (projectGuardStatus.humanizerPolicy ?? 'on') : 'off'} />
          <ScriptStudioLightStatusBlock label="读者模拟" value={`${featureState.readerSimulations?.length ?? 0} reports`} />
        </div>

        {failure ? (
          <div className="mt-4 rounded-[10px] border border-[#ead7a0] bg-[#fff9e8] p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#8a6400]" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[#5c4404]">最近失败报告</div>
                <div className="mt-1 text-xs leading-5 text-[#705a23]">{failure.message}</div>
                <div className="mt-2 flex flex-wrap gap-2 font-mono text-[10px] text-[#8a784d]">
                  <span>{failure.code}</span>
                  <span>chapter {failure.chapterNumber}</span>
                  <span>{failure.findingCount} findings</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <ScriptStudioLightEmpty
            compact
            icon={CheckCircle2}
            title="没有阻断报告"
            body="审阅结果、读者反馈、反 AI 和 OOC 检查会显示在这里。"
          />
        )}

        <ScriptStudioLightJson value={featureState.reviewResult ?? featureState.readerReport ?? '暂无审阅 JSON。'} />
      </ScriptStudioLightPanel>

      <ScriptStudioLightPanel icon={GitBranch} title="审阅事件流" detail="审阅结果写回 Graph event">
        <ScriptStudioGraphEventNotice
          items={[
            'plm.review.requested -> chapter',
            'plm.review.completed -> report',
            'plm.readerSimulation.completed -> reader report',
            'plm.writingSpec.failed -> graph event',
          ]}
        />
        <div className="mt-4 space-y-2">
          {logs.slice(0, 5).map((entry) => (
            <ScriptStudioLightLog key={entry.id} entry={entry} />
          ))}
        </div>
      </ScriptStudioLightPanel>
    </div>
  )
}

function ScriptStudioDebugDetail({
  logs,
  novel,
  featureState,
  handlers,
  ready,
  busy,
}: {
  logs: PlotPilotLogEntry[]
  novel: PlotPilotNovel | null
  featureState: PlotPilotNativeFeatureState
  handlers?: PlotPilotNativeHandlers
  ready: boolean
  busy: boolean
}) {
  const activeInvocation = asUiRecord(featureState.activeInvocation)
  const invocationSessionId = readUiString(activeInvocation, ['sessionId', 'session_id', 'id'])

  return (
    <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_340px]">
      <ScriptStudioLightPanel
        icon={Terminal}
        title="开发者抽屉"
        detail="Prompt registry、Invocation trace、Memory graph"
        action={
          novel ? (
            <div className="flex flex-wrap gap-2">
              <ScriptStudioLightAction
                onClick={() => handlers?.onRefreshDebug?.(novel.id)}
                disabled={!ready || busy || !handlers?.onRefreshDebug}
                primary
              >
                <RotateCw className="size-3.5" />
                刷新 Debug
              </ScriptStudioLightAction>
              <ScriptStudioLightAction
                onClick={() => handlers?.onRefreshMemory?.(novel.id)}
                disabled={!ready || busy || !handlers?.onRefreshMemory}
              >
                <Brain className="size-3.5" />
                刷新记忆
              </ScriptStudioLightAction>
            </div>
          ) : null
        }
      >
        <div className="grid gap-3 md:grid-cols-4">
          <ScriptStudioLightStatusBlock label="Prompts" value={String(featureState.prompts?.length ?? 0)} />
          <ScriptStudioLightStatusBlock label="AI traces" value={String(featureState.aiTraces?.length ?? 0)} />
          <ScriptStudioLightStatusBlock label="Triples" value={String(featureState.knowledgeTriples?.length ?? 0)} />
          <ScriptStudioLightStatusBlock label="Invocation" value={invocationSessionId || 'none'} />
        </div>
        <div className="mt-4 grid gap-3 xl:grid-cols-2">
          <ScriptStudioLightJson title="Trace timeline" value={featureState.traceTimeline ?? featureState.traceStats ?? '暂无 trace timeline。'} />
          <ScriptStudioLightMemoryGraphPanel
            novel={novel}
            featureState={featureState}
            handlers={handlers}
            ready={ready}
            busy={busy}
          />
        </div>
      </ScriptStudioLightPanel>

      <ScriptStudioLightInvocationReview
        featureState={featureState}
        handlers={handlers}
        ready={ready}
        busy={busy}
        logs={logs}
      />
    </div>
  )
}

function ScriptStudioLightInvocationReview({
  featureState,
  handlers,
  ready,
  busy,
  logs,
}: {
  featureState: PlotPilotNativeFeatureState
  handlers?: PlotPilotNativeHandlers
  ready: boolean
  busy: boolean
  logs: PlotPilotLogEntry[]
}) {
  const invocation = asUiRecord(featureState.activeInvocation)
  const session = asUiRecord(invocation.session)
  const attempt = asUiRecord(invocation.attempt)
  const decision = asUiRecord(invocation.decision)
  const commit = asUiRecord(invocation.commit)
  const promptParts = resolvePromptParts(session)
  const variablePlan = asUiRecord(session.variable_plan ?? invocation.variable_plan)
  const variableBindings = asUiRecordArray(variablePlan.bindings ?? session.variable_bindings)
  const outputBindings = asUiRecordArray(session.output_bindings ?? invocation.output_bindings)
  const [sessionId, setSessionId] = React.useState(readInvocationSessionId(invocation, session))
  const resolvedSessionId = readInvocationSessionId(invocation, session) || sessionId.trim()
  const attemptId = readUiString(attempt, ['id', 'attempt_id'])
  const decisionId = readUiString(decision, ['id', 'decision_id'])
  const canOperate = Boolean(ready && !busy && resolvedSessionId)

  React.useEffect(() => {
    const nextSessionId = readInvocationSessionId(invocation, session)
    if (nextSessionId && nextSessionId !== sessionId) setSessionId(nextSessionId)
  }, [invocation, session, sessionId])

  return (
    <ScriptStudioLightPanel
      icon={Activity}
      title="Invocation 审阅"
      detail={readUiString(session, ['status']) || readUiString(invocation, ['next_action']) || 'accept / retry / resume / commit'}
      action={
        <ScriptStudioLightAction
          onClick={() => handlers?.onLoadInvocation?.(sessionId.trim())}
          disabled={!ready || busy || !sessionId.trim() || !handlers?.onLoadInvocation}
        >
          <Search className="size-3.5" />
          读取
        </ScriptStudioLightAction>
      }
    >
      <div className="grid gap-4">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_240px]">
          <div className="space-y-3">
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8b8579]">Session ID</span>
              <input
                value={sessionId}
                onChange={(event) => setSessionId(event.currentTarget.value)}
                placeholder="ai invocation session id"
                className="mt-1 h-9 w-full rounded-[8px] border border-[#ded8ca] bg-[#fffdf8] px-3 font-mono text-xs text-[#32362f] outline-none placeholder:text-[#aaa498] focus:border-[#174a38]"
              />
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              <ScriptStudioLightStatusBlock label="operation" value={readUiString(session, ['operation']) || '-'} />
              <ScriptStudioLightStatusBlock label="node" value={readUiString(session, ['node_key', 'nodeKey']) || '-'} />
              <ScriptStudioLightStatusBlock label="policy" value={readUiString(session, ['policy']) || '-'} />
              <ScriptStudioLightStatusBlock label="next" value={readUiString(invocation, ['next_action', 'nextAction']) || '-'} />
            </div>
          </div>
          <div className="rounded-[10px] border border-[#e2ddd2] bg-[#faf9f4] p-3">
            <div className="text-xs font-semibold text-[#33372f]">审阅动作</div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <ScriptStudioLightAction
                onClick={() => handlers?.onResumeInvocation?.(resolvedSessionId)}
                disabled={!canOperate || !handlers?.onResumeInvocation}
              >
                <Repeat2 className="size-3.5" />
                Resume
              </ScriptStudioLightAction>
              <ScriptStudioLightAction
                onClick={() => handlers?.onRetryInvocation?.(resolvedSessionId)}
                disabled={!canOperate || !handlers?.onRetryInvocation}
              >
                <RotateCw className="size-3.5" />
                Retry
              </ScriptStudioLightAction>
              <ScriptStudioLightAction
                onClick={() => handlers?.onAcceptInvocation?.(resolvedSessionId)}
                disabled={!canOperate || !attemptId || !handlers?.onAcceptInvocation}
                primary
              >
                <CheckCircle2 className="size-3.5" />
                Accept
              </ScriptStudioLightAction>
              <ScriptStudioLightAction
                onClick={() => handlers?.onRejectInvocation?.(resolvedSessionId)}
                disabled={!canOperate || !attemptId || !handlers?.onRejectInvocation}
              >
                <Square className="size-3.5" />
                Reject
              </ScriptStudioLightAction>
              <ScriptStudioLightAction
                className="col-span-2 justify-center"
                onClick={() => handlers?.onCommitInvocation?.(resolvedSessionId)}
                disabled={!canOperate || !decisionId || !handlers?.onCommitInvocation}
              >
                <Save className="size-3.5" />
                Commit decision
              </ScriptStudioLightAction>
            </div>
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-2">
          <ScriptStudioLightContentBlock title="System Prompt" value={promptParts.system} fallback="当前 session 没有 system prompt snapshot。" />
          <ScriptStudioLightContentBlock title="User Prompt" value={promptParts.user} fallback="当前 session 没有 user prompt snapshot。" />
        </div>

        <div className="grid gap-3 xl:grid-cols-2">
          <ScriptStudioLightBindingList
            title="Variable Plan"
            detail={`${variableBindings.length} bindings`}
            bindings={variableBindings}
            fallback="暂无变量绑定计划。"
          />
          <ScriptStudioLightBindingList
            title="Output Bindings"
            detail={`${outputBindings.length} outputs`}
            bindings={outputBindings}
            fallback="暂无输出绑定。"
          />
        </div>

        <div className="grid gap-3 xl:grid-cols-2">
          <ScriptStudioLightContentBlock
            title="Attempt Output"
            value={String(attempt.content ?? attempt.error ?? '')}
            fallback="当前 session 还没有模型输出。"
          />
          <ScriptStudioLightJson
            title="Decision / Commit"
            value={{
              attempt: pickRecord(attempt, ['id', 'status', 'error']),
              decision: pickRecord(decision, ['id', 'decision', 'status']),
              commit: pickRecord(commit, ['id', 'status', 'error']),
            }}
          />
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
          <ScriptStudioLightJson title="Raw Invocation" value={featureState.activeInvocation ?? '暂无 active invocation。'} className="max-h-[420px]" />
          <div className="space-y-2">
            {logs.slice(0, 6).map((entry) => (
              <ScriptStudioLightLog key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      </div>
    </ScriptStudioLightPanel>
  )
}

function ScriptStudioModeMapDetail({
  workspaceMode,
  novel,
  featureState,
  handlers,
  ready,
  busy,
}: {
  workspaceMode: 'setup' | 'planning'
  novel: PlotPilotNovel | null
  featureState: PlotPilotNativeFeatureState
  handlers?: PlotPilotNativeHandlers
  ready: boolean
  busy: boolean
}) {
  const isSetup = workspaceMode === 'setup'
  return (
    <ScriptStudioLightPanel
      icon={isSetup ? BookOpen : GitBranch}
      title={isSetup ? '设定模式映射' : '规划模式映射'}
      detail={isSetup ? 'Onboarding / Bible / WritingSpec' : 'Main plot / Macro plan / Continuous planning'}
      action={
        novel ? (
          <div className="flex flex-wrap gap-2">
            {isSetup ? (
              <>
                <ScriptStudioLightAction onClick={() => handlers?.onGenerateBible?.(novel.id)} disabled={!ready || busy || !handlers?.onGenerateBible} primary>
                  <Sparkles className="size-3.5" />
                  生成 Bible
                </ScriptStudioLightAction>
                <ScriptStudioLightAction onClick={() => handlers?.onRefreshSetup?.(novel.id)} disabled={!ready || busy || !handlers?.onRefreshSetup}>
                  <RotateCw className="size-3.5" />
                  刷新设定
                </ScriptStudioLightAction>
              </>
            ) : (
              <>
                <ScriptStudioLightAction onClick={() => handlers?.onGeneratePlotOutline?.(novel.id)} disabled={!ready || busy || !handlers?.onGeneratePlotOutline} primary>
                  <Sparkles className="size-3.5" />
                  生成大纲
                </ScriptStudioLightAction>
                <ScriptStudioLightAction onClick={() => handlers?.onGenerateMacroPlan?.(novel.id)} disabled={!ready || busy || !handlers?.onGenerateMacroPlan}>
                  <Network className="size-3.5" />
                  宏观规划
                </ScriptStudioLightAction>
              </>
            )}
          </div>
        ) : null
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <ScriptStudioLightJson
          title={isSetup ? 'Onboarding / Bible 状态' : 'Plot outline'}
          value={isSetup ? (novel?.bible ?? featureState.setupEvents ?? '暂无设定数据。') : (featureState.plotOutline ?? '暂无大纲。')}
        />
        <ScriptStudioLightJson
          title={isSetup ? 'Setup events' : 'Planning result'}
          value={isSetup ? (featureState.setupEvents ?? '暂无 setup events。') : (featureState.planningResult ?? featureState.planningStructure ?? '暂无规划结果。')}
        />
      </div>
    </ScriptStudioLightPanel>
  )
}

function ScriptStudioAdvancedOverview({ cards }: { cards: ScriptStudioAdvancedCardView[] }) {
  return (
    <div className="grid gap-3 xl:grid-cols-2 2xl:grid-cols-3">
      {cards.map((card) => (
        <ScriptStudioAdvancedCard key={card.id} card={card} />
      ))}
    </div>
  )
}

function ScriptStudioLightPanel({
  icon: Icon,
  title,
  detail,
  action,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  detail?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[12px] border border-[#ddd8cd] bg-[#fffefd]/96 shadow-[0_16px_38px_rgba(43,38,27,0.10)]">
      <div className="flex flex-col gap-3 border-b border-[#e8e3d8] px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-[9px] border border-[#e0dbd0] bg-[#f7f5ee] text-[#2f493d]">
            <Icon className="size-4" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-[#242821]">{title}</h3>
            {detail ? <div className="mt-0.5 truncate text-xs text-[#817c73]">{detail}</div> : null}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

function ScriptStudioLightAction({
  className,
  primary,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-[7px] border px-2.5 text-xs font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-[#174a38]/20 disabled:cursor-not-allowed disabled:opacity-45',
        primary
          ? 'border-[#174a38] bg-[#174a38] text-white hover:bg-[#1f5b46]'
          : 'border-[#ded9cd] bg-[#f8f7f2] text-[#343831] hover:bg-white',
        className,
      )}
      {...props}
    />
  )
}

function ScriptStudioLightToggle({
  label,
  checked,
  onCheckedChange,
  disabled,
}: {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <label className={cn(
      'flex items-center justify-between gap-3 rounded-[9px] border border-[#e2ddd2] bg-[#faf9f4] px-3 py-2.5',
      disabled ? 'opacity-55' : '',
    )}>
      <span className="text-xs font-semibold text-[#343831]">{label}</span>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="data-[state=checked]:bg-[#174a38]"
      />
    </label>
  )
}

function ScriptStudioLightTextInput({
  label,
  value,
  onChange,
  placeholder,
  className,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <label className={cn('block', className)}>
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8b8579]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder={placeholder}
        className="mt-1 h-9 w-full rounded-[8px] border border-[#ded9cd] bg-[#fdfcf8] px-3 text-sm text-[#2c3029] outline-none placeholder:text-[#aaa398] focus:border-[#174a38]/45 focus:ring-2 focus:ring-[#174a38]/10"
      />
    </label>
  )
}

function ScriptStudioLightNumberInput({
  label,
  value,
  min,
  onChange,
}: {
  label: string
  value: number
  min: number
  onChange: (value: number) => void
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8b8579]">{label}</span>
      <input
        type="number"
        min={min}
        step={1}
        value={String(value)}
        onChange={(event) => {
          const next = Number(event.currentTarget.value)
          if (Number.isFinite(next)) onChange(next)
        }}
        className="mt-1 h-9 w-full rounded-[8px] border border-[#ded9cd] bg-[#fdfcf8] px-3 text-sm text-[#2c3029] outline-none focus:border-[#174a38]/45 focus:ring-2 focus:ring-[#174a38]/10"
      />
    </label>
  )
}

function ScriptStudioLightSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: Array<[string, string]>
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8b8579]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        className="mt-1 h-9 w-full rounded-[8px] border border-[#ded9cd] bg-[#fdfcf8] px-3 text-sm text-[#2c3029] outline-none focus:border-[#174a38]/45 focus:ring-2 focus:ring-[#174a38]/10"
      >
        {options.map(([optionValue, labelText]) => (
          <option key={optionValue || 'empty'} value={optionValue}>{labelText}</option>
        ))}
      </select>
    </label>
  )
}

function ScriptStudioLightTextarea({
  label,
  value,
  onChange,
  placeholder,
  minRows = 4,
  className,
  mono,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minRows?: number
  className?: string
  mono?: boolean
}) {
  return (
    <label className={cn('block', className)}>
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8b8579]">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder={placeholder}
        rows={minRows}
        className={cn(
          'mt-1 w-full resize-y rounded-[8px] border border-[#ded9cd] bg-[#fdfcf8] px-3 py-2 text-sm leading-6 text-[#2c3029] outline-none placeholder:text-[#aaa398] focus:border-[#174a38]/45 focus:ring-2 focus:ring-[#174a38]/10',
          mono && 'font-mono text-[11px] leading-5',
        )}
      />
    </label>
  )
}

function ScriptStudioLightBibleRows({
  title,
  rows,
  fields,
  onRowsChange,
  createRow,
}: {
  title: string
  rows: Array<Record<string, unknown>>
  fields: Array<[string, string]>
  onRowsChange: (rows: Array<Record<string, unknown>>) => void
  createRow: () => Record<string, unknown>
}) {
  const updateRow = (index: number, key: string, value: string) => {
    onRowsChange(rows.map((row, rowIndex) => (
      rowIndex === index ? { ...row, [key]: value } : row
    )))
  }

  return (
    <div className="rounded-[10px] border border-[#e2ddd2] bg-[#faf9f4] p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold text-[#343831]">{title}</div>
        <button
          type="button"
          onClick={() => onRowsChange([...rows, createRow()])}
          className="inline-flex h-7 items-center gap-1.5 rounded-[7px] border border-[#ded9cd] bg-white px-2 text-[11px] font-semibold text-[#343831] outline-none transition hover:bg-[#fdfcf8] focus-visible:ring-2 focus-visible:ring-[#174a38]/20"
        >
          <Plus className="size-3" />
          新增
        </button>
      </div>
      <div className="mt-3 space-y-2">
        {rows.slice(0, 5).map((row, index) => (
          <div key={String(row.id ?? index)} className="rounded-[8px] border border-[#e6e1d6] bg-white p-2.5">
            <div className="grid gap-2">
              {fields.map(([key, label]) => {
                const value = formatDraftFieldValue(row[key])
                const multiline = key.includes('description') || key.includes('profile')
                return multiline ? (
                  <ScriptStudioLightTextarea
                    key={key}
                    label={label}
                    value={value}
                    onChange={(next) => updateRow(index, key, next)}
                    minRows={2}
                  />
                ) : (
                  <ScriptStudioLightTextInput
                    key={key}
                    label={label}
                    value={value}
                    onChange={(next) => updateRow(index, key, next)}
                  />
                )
              })}
            </div>
          </div>
        ))}
        {rows.length > 5 ? (
          <div className="rounded-[8px] border border-dashed border-[#ded9cd] bg-[#fdfcf8] px-3 py-2 text-xs text-[#817c73]">
            还有 {rows.length - 5} 条在完整兼容控制台中编辑。
          </div>
        ) : null}
        {rows.length === 0 ? (
          <div className="rounded-[8px] border border-dashed border-[#ded9cd] bg-white px-3 py-6 text-center text-xs text-[#8b8579]">
            暂无条目。
          </div>
        ) : null}
      </div>
    </div>
  )
}

function ScriptStudioLightOutlineEditor({
  draft,
  onChange,
}: {
  draft: PlotPilotOutlineDraft
  onChange: (draft: PlotPilotOutlineDraft) => void
}) {
  const update = (patch: Partial<PlotPilotOutlineDraft>) => onChange({ ...draft, ...patch })
  return (
    <div className="grid gap-4">
      <ScriptStudioLightTextarea
        label="主线概述"
        value={draft.mainStoryOverview}
        onChange={(mainStoryOverview) => update({ mainStoryOverview })}
        minRows={5}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <ScriptStudioLightTextarea
          label="核心冲突"
          value={draft.coreConflict}
          onChange={(coreConflict) => update({ coreConflict })}
          minRows={4}
        />
        <ScriptStudioLightTextarea
          label="预期结局"
          value={draft.expectedEnding}
          onChange={(expectedEnding) => update({ expectedEnding })}
          minRows={4}
        />
      </div>
      <ScriptStudioLightTextarea
        label="阶段规划 JSON"
        value={draft.stagePlanJson}
        onChange={(stagePlanJson) => update({ stagePlanJson })}
        minRows={8}
        mono
      />
    </div>
  )
}

function ScriptStudioLightMetricGrid({ metrics }: { metrics: ScriptStudioAdvancedMetric[] }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {metrics.map((metric) => (
        <ScriptStudioLightStatusBlock key={metric.label} label={metric.label} value={metric.value} />
      ))}
    </div>
  )
}

function ScriptStudioLightStatusBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[9px] border border-[#e2ddd2] bg-[#faf9f4] px-3 py-2.5">
      <div className="text-[10px] font-semibold text-[#8b8579]">{label}</div>
      <div className="mt-1 truncate text-xs font-semibold text-[#2c3029]">{value}</div>
    </div>
  )
}

function ScriptStudioLightProgressBar({
  value,
  tone = 'green',
}: {
  value: number
  tone?: 'green' | 'warning' | 'neutral'
}) {
  const color = tone === 'warning'
    ? 'bg-[#b88719]'
    : tone === 'neutral'
      ? 'bg-[#8a9488]'
      : 'bg-[#174a38]'
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-[#e5e1d7]">
      <div className={cn('h-full rounded-full transition-[width] duration-300', color)} style={{ width: `${clampProgress(value)}%` }} />
    </div>
  )
}

interface ScriptStudioProductionTimelineEvent {
  id: string
  source: string
  type: string
  message: string
  timestamp: string
  sortKey: string
  tone: 'info' | 'success' | 'warning' | 'error'
}

function ScriptStudioProductionTimeline({ events }: { events: ScriptStudioProductionTimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="rounded-[10px] border border-dashed border-[#ddd7ca] bg-[#faf9f4] px-3 py-6 text-center text-xs leading-5 text-[#817c73]">
        暂无生产事件。启动 Hosted Write 或 Autopilot 后会在这里显示章节流、保存确认和失败恢复点。
      </div>
    )
  }

  return (
    <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
      {events.slice(0, 36).map((event) => (
        <div key={event.id} className="rounded-[9px] border border-[#e2ddd2] bg-[#faf9f4] px-3 py-2.5">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={cn(
                  'size-1.5 shrink-0 rounded-full',
                  event.tone === 'success' && 'bg-[#2f6b46]',
                  event.tone === 'warning' && 'bg-[#b88719]',
                  event.tone === 'error' && 'bg-[#b64c43]',
                  event.tone === 'info' && 'bg-[#7d8b79]',
                )}
              />
              <div className="truncate font-mono text-[10px] uppercase tracking-[0.08em] text-[#5f655a]">
                {event.source} / {event.type}
              </div>
            </div>
            <div className="shrink-0 font-mono text-[10px] text-[#9a9488]">{event.timestamp}</div>
          </div>
          <div className="mt-1 line-clamp-2 text-xs leading-5 text-[#3f453d]">{event.message}</div>
        </div>
      ))}
    </div>
  )
}

function ScriptStudioLightJson({
  title,
  value,
  className,
}: {
  title?: string
  value: unknown
  className?: string
}) {
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2)

  return (
    <div className={cn('rounded-[10px] border border-[#e2ddd2] bg-[#faf9f4]', className)}>
      {title ? (
        <div className="border-b border-[#e6e1d6] px-3 py-2 text-xs font-semibold text-[#3f453d]">{title}</div>
      ) : null}
      <pre className="max-h-[360px] overflow-auto p-3 font-mono text-[10px] leading-5 text-[#5f655a]">
        {text || 'empty'}
      </pre>
    </div>
  )
}

function ScriptStudioLightContentBlock({
  title,
  value,
  fallback,
}: {
  title: string
  value?: string
  fallback: string
}) {
  return (
    <div className="rounded-[10px] border border-[#e2ddd2] bg-[#faf9f4]">
      <div className="border-b border-[#e6e1d6] px-3 py-2 text-xs font-semibold text-[#3f453d]">{title}</div>
      <div className="max-h-[300px] overflow-auto whitespace-pre-wrap break-words p-3 text-xs leading-6 text-[#555b50]">
        {value?.trim() || fallback}
      </div>
    </div>
  )
}

function ScriptStudioLightBindingList({
  title,
  detail,
  bindings,
  fallback,
}: {
  title: string
  detail: string
  bindings: Array<Record<string, unknown>>
  fallback: string
}) {
  return (
    <div className="rounded-[10px] border border-[#e2ddd2] bg-[#faf9f4]">
      <div className="flex items-center justify-between gap-3 border-b border-[#e6e1d6] px-3 py-2">
        <div className="text-xs font-semibold text-[#3f453d]">{title}</div>
        <div className="font-mono text-[10px] text-[#8b8579]">{detail}</div>
      </div>
      <div className="max-h-[260px] overflow-auto p-3">
        {bindings.length ? (
          <div className="space-y-2">
            {bindings.map((binding, index) => {
              const name = readUiString(binding, ['name', 'key', 'variable', 'target', 'path']) || `binding ${index + 1}`
              const source = readUiString(binding, ['source', 'source_type', 'kind', 'type'])
              const value = formatBindingValue(binding)
              return (
                <div key={`${name}-${index}`} className="rounded-[8px] border border-[#e3ded2] bg-white px-2.5 py-2">
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <div className="truncate text-xs font-semibold text-[#2f352f]">{name}</div>
                    {source ? <div className="shrink-0 rounded-full bg-[#eef1ea] px-2 py-0.5 font-mono text-[10px] text-[#62705f]">{source}</div> : null}
                  </div>
                  {value ? <div className="mt-1 line-clamp-2 break-words text-[11px] leading-5 text-[#6f6a60]">{value}</div> : null}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-[8px] border border-dashed border-[#ddd7ca] bg-white/70 px-3 py-4 text-xs leading-5 text-[#817c73]">
            {fallback}
          </div>
        )}
      </div>
    </div>
  )
}

function ScriptStudioLightMemoryGraphPanel({
  novel,
  featureState,
  handlers,
  ready,
  busy,
}: {
  novel: PlotPilotNovel | null
  featureState: PlotPilotNativeFeatureState
  handlers?: PlotPilotNativeHandlers
  ready: boolean
  busy: boolean
}) {
  const [query, setQuery] = React.useState('')
  const triples = featureState.knowledgeTriples ?? []
  const searchResults = featureState.knowledgeSearchResults ?? []
  const stats = asUiRecord(featureState.knowledgeStats)
  const postSync = asUiRecord(featureState.postChapterMemorySync)
  const entities = extractMemoryEntities(triples)
  const canSearch = Boolean(novel && ready && !busy && query.trim() && handlers?.onSearchMemory)

  return (
    <div className="rounded-[10px] border border-[#e2ddd2] bg-[#faf9f4]">
      <div className="flex flex-col gap-3 border-b border-[#e6e1d6] px-3 py-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs font-semibold text-[#3f453d]">Memory graph</div>
          <div className="mt-0.5 font-mono text-[10px] text-[#8b8579]">{triples.length} triples / {entities.length} entities</div>
        </div>
        {novel ? (
          <div className="flex flex-wrap gap-1.5">
            <ScriptStudioLightAction
              onClick={() => handlers?.onRefreshMemory?.(novel.id)}
              disabled={!ready || busy || !handlers?.onRefreshMemory}
            >
              <RotateCw className="size-3.5" />
              刷新
            </ScriptStudioLightAction>
            <ScriptStudioLightAction
              onClick={() => handlers?.onInferKnowledgeGraph?.(novel.id)}
              disabled={!ready || busy || !handlers?.onInferKnowledgeGraph}
              primary
            >
              <Network className="size-3.5" />
              推断
            </ScriptStudioLightAction>
          </div>
        ) : null}
      </div>

      <div className="space-y-3 p-3">
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            if (novel && canSearch) handlers?.onSearchMemory?.(novel.id, query.trim())
          }}
        >
          <input
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="检索人物、伏笔、地点或章节状态"
            className="min-w-0 flex-1 rounded-[8px] border border-[#ded9cd] bg-white px-3 text-xs text-[#2c3029] outline-none placeholder:text-[#aaa398] focus:border-[#174a38]/45 focus:ring-2 focus:ring-[#174a38]/10"
          />
          <ScriptStudioLightAction disabled={!canSearch} primary>
            <Search className="size-3.5" />
            搜索
          </ScriptStudioLightAction>
        </form>

        <ScriptStudioLightMetricGrid
          metrics={[
            { label: '实体', value: String(entities.length) },
            { label: '关系', value: String(triples.length) },
            { label: '检索结果', value: String(searchResults.length) },
            { label: '章后同步', value: readUiString(postSync, ['chapterNumber', 'chapter_number']) || '-' },
          ]}
        />

        {Object.keys(postSync).length ? (
          <div
            data-plm-post-chapter-memory-sync="true"
            className="rounded-[8px] border border-[#dce5d6] bg-white px-3 py-2"
          >
            <div className="flex min-w-0 items-center justify-between gap-2">
              <div className="truncate text-xs font-semibold text-[#2f4f3a]">
                最近章后同步
              </div>
              <div className="shrink-0 font-mono text-[10px] text-[#6b7867]">
                {readUiString(postSync, ['source']) || 'chapter'}
              </div>
            </div>
            <div className="mt-1 line-clamp-2 text-[11px] leading-5 text-[#687063]">
              chapter {readUiString(postSync, ['chapterNumber', 'chapter_number']) || '-'} / triples {readUiString(postSync, ['tripleCount', 'triple_count']) || '0'} / {readUiString(stats, ['version', 'updated_at', 'updatedAt']) || 'stats refreshed'}
            </div>
          </div>
        ) : null}

        <div>
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8b8579]">实体索引</div>
          {entities.length ? (
            <div className="flex max-h-24 flex-wrap gap-1.5 overflow-auto">
              {entities.slice(0, 24).map((entity) => (
                <span
                  key={entity.id}
                  className="rounded-full border border-[#dfe5dc] bg-white px-2 py-1 text-[11px] font-semibold text-[#3f573f]"
                >
                  {entity.label} <span className="font-mono text-[#8b9484]">{entity.count}</span>
                </span>
              ))}
            </div>
          ) : (
            <div className="rounded-[8px] border border-dashed border-[#ddd7ca] bg-white/70 px-3 py-3 text-xs text-[#817c73]">
              暂无实体。先刷新或推断知识图谱。
            </div>
          )}
        </div>

        <div>
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8b8579]">关系三元组</div>
          <div className="max-h-[220px] space-y-2 overflow-auto pr-1">
            {triples.slice(0, 12).map((triple, index) => (
              <ScriptStudioLightMemoryRelation key={String(triple.id ?? index)} record={triple} />
            ))}
            {triples.length === 0 ? (
              <div className="rounded-[8px] border border-dashed border-[#ddd7ca] bg-white/70 px-3 py-3 text-xs text-[#817c73]">
                还没有三元组。
              </div>
            ) : null}
          </div>
        </div>

        {searchResults.length ? (
          <div>
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8b8579]">检索结果</div>
            <div className="max-h-[180px] space-y-2 overflow-auto pr-1">
              {searchResults.slice(0, 8).map((result, index) => (
                <ScriptStudioLightMemoryRelation key={String(result.id ?? index)} record={result} result />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function ScriptStudioLightMemoryRelation({
  record,
  result,
}: {
  record: Record<string, unknown>
  result?: boolean
}) {
  const subject = readUiString(record, ['subject', 'subject_id', 'source', 'head']) || 'subject'
  const predicate = readUiString(record, ['predicate', 'relation', 'type']) || 'relates'
  const object = readUiString(record, ['object', 'object_id', 'target', 'tail']) || 'object'
  const score = readUiString(record, ['score', 'confidence', 'weight'])
  const description = readUiString(record, ['description', 'summary', 'evidence', 'text'])

  return (
    <div className="rounded-[8px] border border-[#e3ded2] bg-white px-3 py-2">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="min-w-0 truncate text-xs font-semibold text-[#2f352f]">
          {subject} <span className="text-[#7c8578]">{' -> '}{predicate}{' -> '}</span> {object}
        </div>
        {score ? <span className="shrink-0 rounded-full bg-[#eef1ea] px-2 py-0.5 font-mono text-[10px] text-[#62705f]">{score}</span> : null}
      </div>
      {description ? <div className="mt-1 line-clamp-2 text-[11px] leading-5 text-[#6f6a60]">{description}</div> : null}
      {result ? <div className="mt-1 font-mono text-[10px] text-[#8b8579]">retrieved memory</div> : null}
    </div>
  )
}

function ScriptStudioGraphEventNotice({ items }: { items: string[] }) {
  return (
    <div className="rounded-[10px] border border-[#dfe5dc] bg-[#f4f8f1] p-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-[#274735]">
        <GitBranch className="size-3.5" />
        Graph event contract
      </div>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item} className="rounded-[7px] border border-[#dfe5dc] bg-white px-2.5 py-2 font-mono text-[10px] text-[#536258]">
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}

function ScriptStudioLightLog({ entry }: { entry: PlotPilotLogEntry }) {
  const tone =
    entry.level === 'error'
      ? 'border-[#e8c0bc] bg-[#fff1ef] text-[#7d2e27]'
      : entry.level === 'warning'
        ? 'border-[#ead7a0] bg-[#fff9e8] text-[#6d540b]'
        : entry.level === 'success'
          ? 'border-[#cfe0cd] bg-[#f3faf0] text-[#31573a]'
          : 'border-[#e2ddd2] bg-[#faf9f4] text-[#5f655a]'

  return (
    <div className={cn('rounded-[8px] border px-3 py-2', tone)}>
      <div className="font-mono text-[10px] opacity-70">{entry.time ?? 'now'}</div>
      <div className="mt-1 text-xs leading-5">{entry.message}</div>
    </div>
  )
}

function ScriptStudioLightEmpty({
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
        'grid place-items-center rounded-[12px] border border-dashed border-[#ded9cd] bg-[#fffefd]/90 px-6 text-center',
        compact ? 'py-8' : 'min-h-[240px] py-12 shadow-[0_12px_28px_rgba(43,38,27,0.08)]',
      )}
    >
      <div className="max-w-[360px]">
        <div className="mx-auto grid size-10 place-items-center rounded-[9px] border border-[#e2ddd2] bg-[#f7f5ee] text-[#5b6258]">
          <Icon className="size-5" />
        </div>
        <div className="mt-3 text-sm font-semibold text-[#242821]">{title}</div>
        <div className="mt-1 text-xs leading-5 text-[#777268]">{body}</div>
      </div>
    </div>
  )
}

function ScriptStudioAdvancedCard({ card }: { card: ScriptStudioAdvancedCardView }) {
  const Icon = card.icon
  const toneClassName =
    card.tone === 'gold'
      ? 'bg-[#c4a86a] text-[#2e2718]'
      : card.tone === 'rose'
        ? 'bg-[#b98c84] text-[#2b1c1a]'
        : card.tone === 'ink'
          ? 'bg-[#1e211d] text-white'
          : 'bg-[#9ead99] text-[#162319]'

  return (
    <article className="min-h-[214px] rounded-[12px] border border-[#ddd8cd] bg-[#fffefd]/96 p-4 shadow-[0_16px_38px_rgba(43,38,27,0.10)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className={cn('grid size-9 shrink-0 place-items-center rounded-[9px]', toneClassName)}>
            <Icon className="size-4" />
          </span>
          <div className="min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8b8579]">{card.eyebrow}</div>
            <h3 className="mt-1 truncate text-sm font-semibold text-[#242821]">{card.title}</h3>
          </div>
        </div>
        {card.status ? (
          <span className="shrink-0 rounded-full border border-[#dfdacd] bg-[#f7f5ee] px-2 py-1 text-[11px] font-semibold text-[#5f655a]">
            {card.status}
          </span>
        ) : null}
      </div>

      <p className="mt-3 min-h-[44px] text-xs leading-5 text-[#63665f]">{card.body}</p>

      {card.metrics?.length ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {card.metrics.map((metric) => (
            <div key={metric.label} className="rounded-[8px] border border-[#e4dfd4] bg-[#faf9f4] px-3 py-2">
              <div className="text-[10px] font-semibold text-[#8b8579]">{metric.label}</div>
              <div className="mt-0.5 truncate text-xs font-semibold text-[#2c3029]">{metric.value}</div>
            </div>
          ))}
        </div>
      ) : null}

      {card.actions?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {card.actions.map((action) => {
            const ActionIcon = action.icon
            return (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                disabled={action.disabled || !action.onClick}
                className={cn(
                  'inline-flex h-8 items-center gap-1.5 rounded-[7px] border px-2.5 text-xs font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-[#174a38]/20 disabled:cursor-not-allowed disabled:opacity-45',
                  action.primary
                    ? 'border-[#174a38] bg-[#174a38] text-white hover:bg-[#1f5b46]'
                    : 'border-[#ded9cd] bg-[#f8f7f2] text-[#343831] hover:bg-white',
                )}
              >
                {ActionIcon ? <ActionIcon className="size-3.5" /> : null}
                {action.label}
              </button>
            )
          })}
        </div>
      ) : null}
    </article>
  )
}

function ScriptStudioPaper({
  title,
  subtitle,
  draft,
  placeholder,
  onDraftChange,
  novel,
  chapterNumber,
  ready,
  busy,
  handlers,
}: {
  title: string
  subtitle: string
  draft: string
  placeholder: string
  onDraftChange: (value: string) => void
  novel: PlotPilotNovel | null
  chapterNumber: number
  ready: boolean
  busy: boolean
  handlers?: PlotPilotNativeHandlers
}) {
  const disabled = !novel || !ready || busy
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null)
  const [activeToolId, setActiveToolId] = React.useState<string | null>(null)
  const activeTool = activeToolId ? scriptStudioToolbarItems.find((item) => item.id === activeToolId) : null

  const insertScriptSnippet = React.useCallback((snippet: string) => {
    const textarea = textareaRef.current
    const selectionStart = textarea?.selectionStart ?? draft.length
    const selectionEnd = textarea?.selectionEnd ?? draft.length
    const prefix = draft.slice(0, selectionStart)
    const suffix = draft.slice(selectionEnd)
    const nextDraft = `${prefix}${snippet}${suffix}`
    const nextCursor = selectionStart + snippet.length

    onDraftChange(nextDraft)
    handlers?.onChangeChapterDraft?.(nextDraft)
    globalThis.requestAnimationFrame?.(() => {
      textarea?.focus()
      textarea?.setSelectionRange(nextCursor, nextCursor)
    })
  }, [draft, handlers, onDraftChange])

  return (
    <>
      <div
        className="sticky top-3 z-20 mx-auto mb-3 flex w-full max-w-[420px] justify-center px-2"
        onMouseLeave={() => setActiveToolId(null)}
      >
        <div
          role="toolbar"
          aria-label="剧本结构插入工具"
          className="relative flex w-fit max-w-full items-center gap-1 overflow-visible rounded-[22px] border px-2 py-2 backdrop-blur-2xl"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.34), rgba(246,244,238,0.16))',
            borderColor: 'rgba(255,255,255,0.64)',
            boxShadow: '0 22px 54px rgba(38,34,25,0.16), inset 0 1px 0 rgba(255,255,255,0.78), inset 0 -1px 0 rgba(255,255,255,0.24)',
            WebkitBackdropFilter: 'blur(28px) saturate(1.46)',
            backdropFilter: 'blur(28px) saturate(1.46)',
          }}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-4 top-1 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.92), transparent)' }}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -left-8 top-0 h-full w-16 -skew-x-12"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)' }}
          />
          {scriptStudioToolbarItems.map((item) => {
            const Icon = item.icon
            const active = activeToolId === item.id
            return (
              <button
                key={item.id}
                type="button"
                aria-label={`插入${item.label}`}
                title={`${item.label}：${item.description}`}
                onClick={() => insertScriptSnippet(item.snippet)}
                onFocus={() => setActiveToolId(item.id)}
                onMouseEnter={() => setActiveToolId(item.id)}
                className="relative grid h-10 min-w-10 place-items-center gap-0.5 rounded-[13px] border px-1 text-[10px] font-semibold text-[#252822] outline-none transition duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#174a38]/20"
                style={{
                  backgroundColor: active ? 'rgba(255,255,255,0.54)' : 'rgba(255,255,255,0.14)',
                  borderColor: active ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.28)',
                  boxShadow: active
                    ? '0 10px 22px rgba(37,40,34,0.13), inset 0 1px 0 rgba(255,255,255,0.82)'
                    : 'inset 0 1px 0 rgba(255,255,255,0.42)',
                }}
              >
                <Icon className="size-3.5" />
                <span>{item.label}</span>
              </button>
            )
          })}
          {activeTool ? (
            <div
              className="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] z-30 w-[320px] -translate-x-1/2 rounded-[14px] border px-3 py-2 text-left shadow-[0_18px_42px_rgba(38,34,25,0.16)]"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.72), rgba(248,246,240,0.42))',
                borderColor: 'rgba(255,255,255,0.64)',
                WebkitBackdropFilter: 'blur(24px) saturate(1.35)',
                backdropFilter: 'blur(24px) saturate(1.35)',
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#252822]">{activeTool.label}</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6b7167]">插入</span>
              </div>
              <div className="mt-1 text-[11px] leading-4 text-[#444941]">{activeTool.description}</div>
              <div className="mt-1 text-[10px] leading-4 text-[#73786f]">{activeTool.usage}</div>
            </div>
          ) : null}
        </div>
      </div>

      <article
        className="mx-auto w-full max-w-[420px] overflow-hidden rounded-[16px] border border-[#dedbd2]/88 shadow-[0_24px_64px_rgba(43,38,27,0.16)] backdrop-blur-[1px]"
        style={{ backgroundColor: 'rgba(253, 252, 248, 0.94)' }}
      >
        <div className="flex min-h-11 items-center justify-between gap-2 border-b border-[#e5e1d8] px-4">
          <h1 className="text-sm font-semibold text-[#252822]">{title}</h1>
          <div
            className="flex shrink-0 items-center gap-1 rounded-[7px] border border-[#e5e1d8] p-1"
            style={{ backgroundColor: 'rgba(247,246,241,0.72)' }}
          >
            <button
              type="button"
              className="flex h-7 items-center gap-1.5 rounded-[5px] px-2 text-xs font-semibold text-[#2e332d] shadow-[0_1px_2px_rgba(36,32,24,0.06)]"
              style={{ backgroundColor: 'rgba(255,255,255,0.72)' }}
            >
              <FileText className="size-3.5" />
              剧本
            </button>
            <button type="button" className="flex h-7 items-center gap-1.5 rounded-[5px] px-2 text-xs font-semibold text-[#9a948a]">
              <Image className="size-3.5" />
              封面
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-[352px] px-4 pb-5 pt-5">
          <div className="mb-3 flex flex-col gap-3">
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold text-[#8b867d]">第 {chapterNumber} 章</div>
              <div className="mt-0.5 truncate text-sm font-semibold text-[#252822]">{subtitle}</div>
            </div>
            <div className="flex shrink-0 items-center justify-end gap-1.5">
              <button
                type="button"
                title="根据当前大纲、节拍和项目设定生成本章草稿。"
                onClick={() => novel ? handlers?.onGenerateChapter?.(novel.id, chapterNumber) : undefined}
                disabled={disabled || !handlers?.onGenerateChapter}
                className="flex h-8 items-center gap-1 rounded-[7px] border border-[#d9d5ca] px-2 text-xs font-semibold text-[#353832] outline-none transition hover:opacity-80 disabled:opacity-45"
                style={{ backgroundColor: 'rgba(255,255,255,0.72)' }}
              >
                <Sparkles className="size-3.5" />
                生成
              </button>
              <button
                type="button"
                title="保存当前章节草稿到 PlotPilot 项目。"
                onClick={() => novel ? handlers?.onSaveChapter?.(novel.id, chapterNumber, draft) : undefined}
                disabled={disabled || !handlers?.onSaveChapter}
                className="flex h-8 items-center gap-1 rounded-[7px] border border-[#d9d5ca] px-2 text-xs font-semibold text-[#353832] outline-none transition hover:opacity-80 disabled:opacity-45"
                style={{ backgroundColor: 'rgba(255,255,255,0.72)' }}
              >
                <Save className="size-3.5" />
                保存
              </button>
              <button
                type="button"
                title="把当前章节写回生产链路，用于后续证据、记忆和项目文件同步。"
                onClick={() => novel ? handlers?.onWriteBackChapter?.(novel.id, chapterNumber) : undefined}
                disabled={disabled || !handlers?.onWriteBackChapter}
                className="flex h-8 items-center gap-1 rounded-[7px] px-2 text-xs font-semibold outline-none transition hover:opacity-90 disabled:opacity-45"
                style={{
                  background: `linear-gradient(180deg, ${scriptStudioPrimaryPill}, ${scriptStudioPrimaryPillHover})`,
                  boxShadow: `0 8px 18px ${scriptStudioPrimaryPillShadow}`,
                  color: '#fff',
                }}
              >
                <GitBranch className="size-3.5" />
                回写
              </button>
            </div>
          </div>

          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(event) => {
              onDraftChange(event.currentTarget.value)
              handlers?.onChangeChapterDraft?.(event.currentTarget.value)
            }}
            placeholder={placeholder}
            spellCheck={false}
            className={cn(
              'min-h-[720px] w-full resize-none px-6 pb-8 pt-4',
              'font-serif text-[14px] leading-[2.05] text-[#28241e] outline-none',
              'placeholder:whitespace-pre-wrap placeholder:text-[#2f2b25]/72',
            )}
            style={{ backgroundColor: 'transparent' }}
          />
        </div>
      </article>
    </>
  )
}

function ScriptStudioBeatPaper({
  novel,
  chapters,
  activeChapterNumber,
  onOpenChapter,
}: {
  novel: PlotPilotNovel | null
  chapters: ScriptStudioChapterView[]
  activeChapterNumber: number
  onOpenChapter?: (chapterNumber: number) => void
}) {
  return (
    <article className="rounded-[12px] border border-[#dedbd2] bg-[#fdfcf8] p-6 shadow-[0_22px_54px_rgba(43,38,27,0.12)]">
      <div className="mb-6">
        <div className="text-sm font-semibold text-[#252822]">节拍编辑</div>
        <div className="mt-1 text-xs text-[#8a867c]">{novel?.updatedAt ?? '26/05/27'}</div>
      </div>
      <ol className="space-y-5">
        {chapters.map((chapter) => (
          <li key={chapter.id} className="grid grid-cols-[18px_34px_minmax(0,1fr)] gap-3">
            <span className="mt-1 size-1.5 rounded-full bg-[#bdb7ad]" />
            <button
              type="button"
              onClick={() => onOpenChapter?.(chapter.number)}
              className={cn(
                'font-mono text-sm outline-none',
                activeChapterNumber === chapter.number ? 'text-[#174a38]' : 'text-[#8a867c] hover:text-[#2f332d]',
              )}
            >
              {chapter.number}.
            </button>
            <div>
              <h2 className="text-sm font-semibold text-[#282b25]">{chapter.title}</h2>
              <p className="mt-2 max-w-[760px] text-sm leading-7 text-[#5d5d56]">{chapter.summary}</p>
            </div>
          </li>
        ))}
      </ol>
    </article>
  )
}

function ScriptStudioOutlinePaper({
  novel,
  outlineLines,
  featureState,
  ready,
  busy,
  handlers,
}: {
  novel: PlotPilotNovel | null
  outlineLines: string[]
  featureState: PlotPilotNativeFeatureState
  ready: boolean
  busy: boolean
  handlers?: PlotPilotNativeHandlers
}) {
  const disabled = !novel || !ready || busy

  return (
    <article className="rounded-[12px] border border-[#dedbd2] bg-[#fdfcf8] p-6 shadow-[0_22px_54px_rgba(43,38,27,0.12)]">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-[#252822]">《{novel?.title ?? '未命名项目'}》</h1>
          <div className="mt-1 text-xs text-[#8a867c]">26/05/27</div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => novel ? handlers?.onSuggestMainPlotOptions?.(novel.id) : undefined}
            disabled={disabled || !handlers?.onSuggestMainPlotOptions}
            className="flex h-8 items-center gap-1.5 rounded-[7px] border border-[#d9d5ca] bg-white px-2.5 text-xs font-semibold text-[#353832] outline-none transition hover:bg-[#f7f6f1] disabled:opacity-45"
          >
            <GitBranch className="size-3.5" />
            主线
          </button>
          <button
            type="button"
            onClick={() => novel ? handlers?.onGeneratePlotOutline?.(novel.id) : undefined}
            disabled={disabled || !handlers?.onGeneratePlotOutline}
            className="flex h-8 items-center gap-1.5 rounded-[7px] bg-[#174a38] px-2.5 text-xs font-semibold text-white outline-none transition hover:bg-[#113d2f] disabled:opacity-45"
            style={{
              background: `linear-gradient(180deg, ${scriptStudioPrimaryPill}, ${scriptStudioPrimaryPillHover})`,
              boxShadow: `0 8px 18px ${scriptStudioPrimaryPillShadow}`,
            }}
          >
            <Sparkles className="size-3.5" />
            生成大纲
          </button>
        </div>
      </div>
      <div className="space-y-5">
        {outlineLines.map((line, index) => (
          <div key={`${line}-${index}`} className="grid grid-cols-[18px_minmax(0,1fr)] gap-3">
            <span className="mt-2 size-1.5 rounded-full bg-[#bdb7ad]" />
            <div>
              <div className="mb-1 font-mono text-xs text-[#8b867d]">
                {index === 0 ? '序幕' : `转折点 ${index}`}
              </div>
              <p className="max-w-[760px] text-sm leading-7 text-[#4e514b]">{line}</p>
            </div>
          </div>
        ))}
      </div>
      {featureState.mainPlotOptions?.length ? (
        <div className="mt-6 rounded-[8px] border border-[#e4e0d6] bg-[#f8f7f2] p-3">
          <div className="mb-2 text-xs font-semibold text-[#68645d]">主线候选</div>
          <div className="space-y-2">
            {featureState.mainPlotOptions.slice(0, 3).map((option, index) => (
              <div key={String(option.id ?? index)} className="text-xs leading-5 text-[#4d504a]">
                {String(option.title ?? option.logline ?? `候选 ${index + 1}`)}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  )
}

function ScriptStudioRightRail({
  mode,
  logs,
  outlineLines,
  relationLines,
  characterCards,
  promptCards,
  activeJob,
  canUseNovel,
  runtimeLabel,
  progressPct,
  completedChapters,
  totalChapters,
  draft,
  novel,
  codexStatus,
  integrationStatus,
  projectGuardStatus,
  lastWritingSpecFailure,
  handlers,
}: {
  mode: ScriptStudioMode
  logs: PlotPilotLogEntry[]
  outlineLines: string[]
  relationLines: string[]
  characterCards: ScriptStudioStorageCardView[]
  promptCards: ScriptStudioStorageCardView[]
  activeJob?: PlotPilotGenerationJob | null
  canUseNovel: boolean
  runtimeLabel: string
  progressPct: number
  completedChapters: number
  totalChapters: number
  draft: string
  novel: PlotPilotNovel | null
  codexStatus?: PlotPilotCodexStatus | null
  integrationStatus?: PlotPilotIntegrationStatus
  projectGuardStatus?: PlotPilotProjectGuardStatus | null
  lastWritingSpecFailure?: PlotPilotWritingSpecFailureView | null
  handlers?: PlotPilotNativeHandlers
}) {
  const canEditCards = Boolean(novel && canUseNovel && handlers?.onSaveStorageCard)
  const saveStorageCard = (card: ScriptStudioStorageCardDraft) => {
    if (!novel) return
    handlers?.onSaveStorageCard?.(novel.id, card)
  }

  return (
    <aside className="sticky top-0 flex h-[calc(100vh-92px)] min-h-[640px] flex-col gap-3 overflow-y-auto pr-1">
      <ScriptStudioFloatingCard
        title={mode === 'outline' ? '历史对话' : '完整剧本大纲内容'}
        icon={mode === 'outline' ? Clock3 : ScrollText}
      >
        {mode === 'outline' ? (
          <div className="space-y-2">
            {logs.slice(0, 4).map((log) => (
              <div key={log.id} className="rounded-[6px] bg-[#f7f6f1] px-2.5 py-2">
                <div className="line-clamp-2 text-xs font-semibold text-[#2d302b]">{log.message}</div>
                <div className="mt-0.5 text-[10px] text-[#8a867c]">{log.time ?? log.level ?? 'runtime'}</div>
              </div>
            ))}
          </div>
        ) : (
          <ol className="space-y-2 text-xs leading-5 text-[#4d504a]">
            {outlineLines.slice(0, 5).map((line, index) => (
              <li key={`${line}-${index}`} className="grid grid-cols-[18px_minmax(0,1fr)] gap-1">
                <span className="font-mono text-[#868177]">{index + 1}.</span>
                <span className="line-clamp-2">{line}</span>
              </li>
            ))}
          </ol>
        )}
      </ScriptStudioFloatingCard>

      <ScriptStudioFloatingCard title="核心人物关系链" icon={Users}>
        <div className="rounded-[8px] bg-[#22231f] p-3 text-xs leading-5 text-[#f7f4ec] shadow-[0_8px_18px_rgba(36,32,24,0.16)]">
          {relationLines.slice(0, 6).map((line, index) => (
            <div key={`${line}-${index}`} className="truncate">{line}</div>
          ))}
        </div>
      </ScriptStudioFloatingCard>

      <ScriptStudioFloatingCard title="当前进度总表" icon={Gauge}>
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-[7px] border border-[#e3dfd4] bg-[#fbfaf6] px-2.5 py-2">
            <span className="size-1.5 rounded-full bg-[#174a38]" />
            <div className="min-w-0 flex-1 text-xs font-semibold text-[#343832]">
              {activeJob?.label ?? (canUseNovel ? '章节草稿工作中' : '等待 runtime 就绪')}
            </div>
            <span className="font-mono text-[10px] text-[#8a867c]">{runtimeLabel}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#e7e3d8]">
            <div
              className="h-full rounded-full bg-[#174a38]"
              style={{ width: `${clampProgress(progressPct)}%` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <ScriptStudioMetric label="章节" value={`${completedChapters}/${Math.max(totalChapters, 1)}`} />
            <ScriptStudioMetric label="字数" value={formatCount(novel?.wordCount ?? countDraftText(draft), 'words')} />
          </div>
          {lastWritingSpecFailure ? (
            <div className="rounded-[7px] border border-[#ead7bd] bg-[#fff8eb] px-2.5 py-2 text-xs leading-5 text-[#6a4a17]">
              {lastWritingSpecFailure.message}
            </div>
          ) : null}
          <div className="rounded-[7px] bg-[#f7f6f1] px-2.5 py-2 text-[11px] leading-5 text-[#777268]">
            Codex {codexStatus?.authenticated ? '已登录' : '未登录'} · WritingSpec {projectGuardStatus?.writingSpecId ? '已绑定' : '未绑定'} · Humanizer {projectGuardStatus?.humanizerEnabled ? 'on' : 'off'}
          </div>
        </div>
      </ScriptStudioFloatingCard>

      <ScriptStudioProductionEvidencePanel snapshot={integrationStatus?.productionEvidence} compact />

      <ScriptStudioIntegrationPanel status={integrationStatus} compact />

      <ScriptStudioStorageDeck
        title="人设存储"
        detail="Bible character cards"
        kind="character"
        cards={characterCards}
        disabled={!canEditCards}
        onSave={saveStorageCard}
      />

      <ScriptStudioStorageDeck
        title="提示词存储"
        detail="Prompt registry"
        kind="prompt"
        cards={promptCards}
        disabled={!canEditCards}
        onSave={saveStorageCard}
      />

      <ScriptStudioMusicPlayer className="mt-auto" />
    </aside>
  )
}

interface WindowWithWebkitAudio extends Window {
  webkitAudioContext?: typeof AudioContext
}

function ScriptStudioMusicPlayer({ className }: { className?: string }) {
  const tracks = React.useMemo(() => [
    { title: '海雾写作', detail: '64 bpm · ambient pad', scale: [196, 246.94, 293.66, 329.63] },
    { title: '夜航节拍', detail: '72 bpm · low pulse', scale: [174.61, 220, 261.63, 329.63] },
    { title: '纸页白噪', detail: '58 bpm · soft drone', scale: [146.83, 196, 246.94, 293.66] },
  ], [])
  const [trackIndex, setTrackIndex] = React.useState(0)
  const [playing, setPlaying] = React.useState(false)
  const [volume, setVolume] = React.useState(0.38)
  const audioRef = React.useRef<{
    context: AudioContext
    master: GainNode
    drone: OscillatorNode
    timer: number
  } | null>(null)
  const track = tracks[trackIndex] ?? tracks[0]

  const stopAudio = React.useCallback(() => {
    const current = audioRef.current
    audioRef.current = null
    if (!current) return
    window.clearInterval(current.timer)
    current.drone.stop()
    current.context.close().catch(() => undefined)
  }, [])

  const startAudio = React.useCallback(async () => {
    if (!track) return
    stopAudio()
    const AudioCtor = window.AudioContext ?? (window as WindowWithWebkitAudio).webkitAudioContext
    if (!AudioCtor) return
    const context = new AudioCtor()
    const master = context.createGain()
    const filter = context.createBiquadFilter()
    const drone = context.createOscillator()
    const droneGain = context.createGain()

    master.gain.value = volume
    filter.type = 'lowpass'
    filter.frequency.value = 920
    drone.type = 'sine'
    drone.frequency.value = track.scale[0] ?? 196
    droneGain.gain.value = 0.18
    drone.connect(droneGain)
    droneGain.connect(filter)
    filter.connect(master)
    master.connect(context.destination)
    drone.start()

    let step = 0
    const timer = window.setInterval(() => {
      const note = track.scale[step % track.scale.length] ?? 220
      const osc = context.createOscillator()
      const gain = context.createGain()
      osc.type = step % 3 === 0 ? 'triangle' : 'sine'
      osc.frequency.value = note * (step % 4 === 3 ? 2 : 1)
      gain.gain.setValueAtTime(0, context.currentTime)
      gain.gain.linearRampToValueAtTime(0.13, context.currentTime + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 1.1)
      osc.connect(gain)
      gain.connect(master)
      osc.start()
      osc.stop(context.currentTime + 1.15)
      step += 1
    }, 920)

    audioRef.current = { context, master, drone, timer }
    setPlaying(true)
  }, [stopAudio, track, volume])

  React.useEffect(() => {
    if (audioRef.current) audioRef.current.master.gain.value = volume
  }, [volume])

  React.useEffect(() => () => stopAudio(), [stopAudio])

  const toggle = () => {
    if (playing) {
      stopAudio()
      setPlaying(false)
      return
    }
    void startAudio()
  }

  const switchTrack = (direction: -1 | 1) => {
    stopAudio()
    setPlaying(false)
    setTrackIndex((current) => (current + direction + tracks.length) % tracks.length)
  }

  return (
    <section
      className={cn('overflow-hidden rounded-[18px] border p-3 text-white shadow-[0_18px_38px_rgba(43,38,27,0.18)]', className)}
      style={{
        ...storyContextComicBackground('style', playing),
        borderColor: 'rgba(139,88,126,0.48)',
      }}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/18 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.24)]">
            <Music className="size-4" />
          </span>
          <span className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-white">音乐播放器</h2>
            <span className="mt-0.5 block truncate text-[11px] text-white/76">Writing ambience</span>
          </span>
        </div>
        <span className={cn('size-2 rounded-full shadow-[0_0_0_3px_rgba(255,255,255,0.16)]', playing ? 'bg-white' : 'bg-white/42')} />
      </div>
      <div className="rounded-[16px] bg-white/94 p-3 text-[#28241e] shadow-[0_10px_24px_rgba(43,38,27,0.14)]">
        <div className="truncate text-sm font-semibold text-[#2d302b]">{track?.title ?? 'Ambient'}</div>
        <div className="mt-0.5 text-[11px] text-[#8a867c]">{track?.detail ?? 'browser audio'}</div>
        <div className="mt-3 flex items-center justify-center gap-2">
          <button
            type="button"
            aria-label="上一首"
            onClick={() => switchTrack(-1)}
            className="grid size-9 place-items-center rounded-full border border-[#ddd8cc] bg-white text-[#3d4039] shadow-[0_4px_10px_rgba(43,38,27,0.08)] outline-none transition hover:bg-[#f1efe8] focus-visible:ring-2 focus-visible:ring-[#174a38]/20"
          >
            <SkipBack className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label={playing ? '暂停音乐' : '播放音乐'}
            onClick={toggle}
            className="grid size-12 place-items-center rounded-full bg-[#174a38] text-white shadow-[0_8px_18px_rgba(23,74,56,0.24)] outline-none transition hover:bg-[#113d2f] focus-visible:ring-2 focus-visible:ring-[#174a38]/25"
            style={{
              background: `linear-gradient(180deg, ${scriptStudioSecondaryPill}, ${scriptStudioPrimaryPill})`,
              boxShadow: `0 8px 18px ${scriptStudioPrimaryPillShadow}`,
            }}
          >
            {playing ? <Pause className="size-4" /> : <Play className="size-4 translate-x-px" />}
          </button>
          <button
            type="button"
            aria-label="下一首"
            onClick={() => switchTrack(1)}
            className="grid size-9 place-items-center rounded-full border border-[#ddd8cc] bg-white text-[#3d4039] shadow-[0_4px_10px_rgba(43,38,27,0.08)] outline-none transition hover:bg-[#f1efe8] focus-visible:ring-2 focus-visible:ring-[#174a38]/20"
          >
            <SkipForward className="size-3.5" />
          </button>
        </div>
        <label className="mt-3 flex items-center gap-2 rounded-full bg-[#f4f2eb] px-2 py-1.5">
          <Volume2 className="size-3.5 text-[#6d6a62]" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(event) => setVolume(Number(event.currentTarget.value))}
            aria-label="音乐音量"
            className="h-1.5 w-full accent-[#174a38]"
            style={{ accentColor: scriptStudioPrimaryPill }}
          />
        </label>
      </div>
    </section>
  )
}

function ScriptStudioStorageDeck({
  title,
  detail,
  kind,
  cards,
  disabled,
  onSave,
}: {
  title: string
  detail: string
  kind: 'character' | 'prompt'
  cards: ScriptStudioStorageCardView[]
  disabled?: boolean
  onSave?: (card: ScriptStudioStorageCardDraft) => void
}) {
  const [creating, setCreating] = React.useState(false)
  const draftCard = React.useMemo<ScriptStudioStorageCardView>(() => ({
    id: `new-${kind}`,
    kind,
    title: kind === 'character' ? '新人物' : '新提示词',
    subtitle: kind === 'character' ? '角色设定' : 'prompt asset',
    body: kind === 'character'
      ? '写入人物目标、弱点、声线、秘密和关系。'
      : '写入系统提示、用户提示、变量约束或审阅策略。',
    badge: kind === 'character' ? '人设' : 'Prompt',
    meta: kind === 'character' ? 'Bible' : 'registry',
    initials: kind === 'character' ? '新' : 'P',
    tone: kind === 'character' ? 'sage' : 'ink',
    source: 'draft',
  }), [kind])
  const visibleCards = creating ? [draftCard, ...cards] : cards

  return (
    <section className="rounded-[10px] border border-[#dedbd2] bg-[#fffefd]/96 p-3 shadow-[0_14px_30px_rgba(43,38,27,0.12)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-[#282b25]">{title}</h2>
          <div className="mt-0.5 text-[10px] font-medium text-[#8a867c]">{detail}</div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="rounded-full border border-[#e0dccf] bg-[#f7f6f1] px-2 py-0.5 font-mono text-[10px] text-[#5f635c]">
            {cards.length}
          </span>
          <button
            type="button"
            aria-label={`新增${title}`}
            title={`新增${title}`}
            onClick={() => setCreating(true)}
            disabled={disabled || creating}
            className="grid size-7 place-items-center rounded-full border border-[#ded9cc] bg-[#174a38] text-white outline-none transition hover:bg-[#123d2f] focus-visible:ring-2 focus-visible:ring-[#174a38]/20 disabled:cursor-not-allowed disabled:opacity-45"
            style={{
              background: `linear-gradient(180deg, ${scriptStudioSecondaryPill}, ${scriptStudioPrimaryPill})`,
              boxShadow: `0 8px 18px ${scriptStudioPrimaryPillShadow}`,
            }}
          >
            <Plus className="size-3.5" />
          </button>
        </div>
      </div>
      <div className="space-y-2.5">
        {visibleCards.map((card) => (
          <ScriptStudioFancyStorageCard
            key={card.id}
            card={card}
            disabled={disabled}
            forceEditing={card.source === 'draft'}
            onCancelDraft={card.source === 'draft' ? () => setCreating(false) : undefined}
            onSave={(draft) => {
              onSave?.(draft)
              if (card.source === 'draft') setCreating(false)
            }}
          />
        ))}
      </div>
    </section>
  )
}

function ScriptStudioFancyStorageCard({
  card,
  disabled,
  forceEditing,
  onCancelDraft,
  onSave,
}: {
  card: ScriptStudioStorageCardView
  disabled?: boolean
  forceEditing?: boolean
  onCancelDraft?: () => void
  onSave?: (card: ScriptStudioStorageCardDraft) => void
}) {
  const [editing, setEditing] = React.useState(Boolean(forceEditing))
  const [draft, setDraft] = React.useState<ScriptStudioStorageCardDraft>(() => toStorageCardDraft(card))
  const tone = {
    sage: {
      root: 'var(--drama-plm-card-world-from, #98a295)',
      dot: 'rgba(36, 45, 36, .28)',
      glow: 'rgba(255, 255, 255, .28)',
      ink: '#f7f8f4',
      chip: 'rgba(255, 255, 255, .34)',
    },
    ink: {
      root: 'var(--drama-plm-pill-secondary, #303432)',
      dot: 'rgba(255, 255, 255, .16)',
      glow: 'rgba(187, 221, 199, .18)',
      ink: '#f7f6ee',
      chip: 'rgba(255, 255, 255, .16)',
    },
    gold: {
      root: 'var(--drama-plm-card-style-from, #b49a63)',
      dot: 'rgba(52, 39, 18, .20)',
      glow: 'rgba(255, 255, 255, .25)',
      ink: '#fffaf0',
      chip: 'rgba(255, 255, 255, .26)',
    },
  }[card.tone]

  React.useEffect(() => {
    setDraft(toStorageCardDraft(card))
    setEditing(Boolean(forceEditing))
  }, [card.id, card.title, card.subtitle, card.body, card.meta, card.badge, forceEditing])

  const updateDraft = (patch: Partial<ScriptStudioStorageCardDraft>) => {
    setDraft((current) => ({ ...current, ...patch }))
  }

  const saveDraft = () => {
    const clean = {
      ...draft,
      title: draft.title.trim() || card.title,
      subtitle: draft.subtitle.trim() || card.subtitle,
      body: draft.body.trim() || card.body,
      meta: draft.meta?.trim() || card.meta,
      badge: draft.badge?.trim() || card.badge,
    }
    onSave?.(clean)
    setEditing(false)
  }

  return (
    <article
      className="relative overflow-hidden rounded-[14px] border border-white/35 p-3 shadow-[0_14px_30px_rgba(43,38,27,0.18),inset_0_1px_0_rgba(255,255,255,0.28)]"
      style={{
        color: tone.ink,
        background:
          `linear-gradient(145deg, rgba(255,255,255,.22), rgba(255,255,255,0) 42%),
           radial-gradient(circle at 1px 1px, ${tone.dot} 1px, transparent 1.7px),
           radial-gradient(circle at 82% 0%, ${tone.glow}, transparent 34%),
           ${tone.root}`,
        backgroundSize: 'auto, 10px 10px, auto, auto',
      }}
    >
      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[13px] font-bold leading-4">{card.title}</div>
          <div className="mt-0.5 truncate text-[10px] font-medium opacity-75">{card.subtitle}</div>
        </div>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{ background: tone.chip }}
        >
          {card.badge}
        </span>
      </div>
      <p className="relative z-10 mt-2 line-clamp-3 text-[11px] leading-[1.35] opacity-90">{card.body}</p>
      {editing ? (
        <div className="relative z-10 mt-3 space-y-2 rounded-[8px] bg-white/[0.94] p-2 text-[#3d423c] shadow-[0_8px_20px_rgba(36,38,31,.16)]">
          <input
            aria-label="卡片标题"
            value={draft.title}
            onChange={(event) => updateDraft({ title: event.currentTarget.value })}
            className="h-8 w-full rounded-[6px] border border-[#ded8ca] bg-[#fffdf8] px-2 text-xs font-semibold outline-none focus:border-[#174a38]"
          />
          <input
            aria-label="卡片分类"
            value={draft.subtitle}
            onChange={(event) => updateDraft({ subtitle: event.currentTarget.value })}
            className="h-8 w-full rounded-[6px] border border-[#ded8ca] bg-[#fffdf8] px-2 text-xs outline-none focus:border-[#174a38]"
          />
          <textarea
            aria-label="卡片正文"
            value={draft.body}
            onChange={(event) => updateDraft({ body: event.currentTarget.value })}
            rows={4}
            className="min-h-20 w-full resize-none rounded-[6px] border border-[#ded8ca] bg-[#fffdf8] px-2 py-1.5 text-xs leading-5 outline-none focus:border-[#174a38]"
          />
          <input
            aria-label="卡片索引"
            value={draft.meta ?? ''}
            onChange={(event) => updateDraft({ meta: event.currentTarget.value })}
            className="h-8 w-full rounded-[6px] border border-[#ded8ca] bg-[#fffdf8] px-2 text-xs outline-none focus:border-[#174a38]"
          />
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => {
                setDraft(toStorageCardDraft(card))
                if (onCancelDraft) onCancelDraft()
                else setEditing(false)
              }}
              className="rounded-[6px] border border-[#dcd6c9] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#5d5f58] outline-none hover:bg-[#f5f3ec] focus-visible:ring-2 focus-visible:ring-[#174a38]/20"
            >
              取消
            </button>
            <button
              type="button"
              onClick={saveDraft}
              disabled={disabled || !onSave}
              className="inline-flex items-center gap-1 rounded-[6px] bg-[#174a38] px-2.5 py-1 text-[11px] font-semibold text-white outline-none hover:bg-[#123d2f] focus-visible:ring-2 focus-visible:ring-[#174a38]/25 disabled:cursor-not-allowed disabled:opacity-45"
              style={{
                background: `linear-gradient(180deg, ${scriptStudioPrimaryPill}, ${scriptStudioPrimaryPillHover})`,
                boxShadow: `0 8px 18px ${scriptStudioPrimaryPillShadow}`,
              }}
            >
              <Save className="size-3" />
              保存
            </button>
          </div>
        </div>
      ) : null}
      <button
        type="button"
        aria-label={`编辑${card.title}`}
        title={`编辑${card.title}`}
        onClick={() => setEditing((current) => !current)}
        className="relative z-10 mt-3 grid w-full grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-2 rounded-[8px] bg-white/[0.92] p-2 text-left text-[#4b514b] shadow-[0_8px_20px_rgba(36,38,31,.16)] outline-none transition hover:bg-white focus-visible:ring-2 focus-visible:ring-white/45"
      >
        <div className="grid size-8 place-items-center rounded-full bg-[#f0eee8] font-serif text-[13px] font-bold text-[#26342d]">
          {card.initials}
        </div>
        <div className="min-w-0">
          <div className="truncate text-xs font-bold">{card.meta}</div>
          <div className="truncate text-[10px] text-[#7c776d]">{card.kind === 'character' ? 'character profile' : 'prompt asset'}</div>
        </div>
        <ChevronDown className={cn('size-3.5 text-[#777268] transition', editing ? 'rotate-180' : '')} />
      </button>
    </article>
  )
}

function toStorageCardDraft(card: ScriptStudioStorageCardView): ScriptStudioStorageCardDraft {
  return {
    id: card.id,
    kind: card.kind,
    title: card.title,
    subtitle: card.subtitle,
    body: card.body,
    badge: card.badge,
    meta: card.meta,
    tone: card.tone,
    sourceIndex: card.sourceIndex,
    sourceId: card.sourceId,
    source: card.source,
  }
}

function ScriptStudioFloatingCard({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[10px] border border-[#dedbd2] bg-[#fffefd]/96 p-3 shadow-[0_14px_30px_rgba(43,38,27,0.12)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className="size-3.5 shrink-0 text-[#4d514a]" />
          <h2 className="truncate text-sm font-semibold text-[#282b25]">{title}</h2>
        </div>
        <ChevronLeft className="size-3.5 text-[#8a867c]" />
      </div>
      {children}
    </section>
  )
}

function ScriptStudioMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[7px] border border-[#e3dfd4] bg-[#fbfaf6] px-2.5 py-2">
      <div className="text-[10px] text-[#8a867c]">{label}</div>
      <div className="mt-0.5 truncate text-xs font-semibold text-[#333630]">{value}</div>
    </div>
  )
}

function createScriptStudioChapters(
  novel: PlotPilotNovel | null,
  editor?: PlotPilotChapterEditor | null,
): ScriptStudioChapterView[] {
  const source = novel?.chapters?.length
    ? novel.chapters
    : editor
      ? [{
          id: editor.chapterId ?? `${editor.novelId}-${editor.chapterNumber}`,
          number: editor.chapterNumber,
          title: editor.title,
          status: editor.status,
          wordCount: editor.wordCount,
          updatedAt: undefined,
          generationHint: editor.generationHint,
        }]
      : []
  const chapters = source.map((chapter, index) => ({
    id: chapter.id,
    number: chapter.number ?? index + 1,
    title: chapter.title || `第 ${index + 1} 章`,
    status: chapter.status,
    wordCount: chapter.wordCount,
    updatedAt: chapter.updatedAt,
    summary: chapter.generationHint || `${chapter.title || `第 ${index + 1} 章`} 的节拍、冲突和人物推进将在这里展开。`,
    colorClassName: scriptStudioChapterColors[index % scriptStudioChapterColors.length] ?? 'bg-[#5477d4]',
  }))

  if (chapters.length > 0) return chapters

  return [
    {
      id: 'fallback-1',
      number: 1,
      title: '第 1 章',
      summary: '等待导入正文、章节大纲或生成提示。这里不再显示跨项目示例稿。',
      colorClassName: scriptStudioChapterColors[0] ?? 'bg-[#5477d4]',
    },
    {
      id: 'fallback-2',
      number: 2,
      title: '第 2 章',
      summary: '等待章节规划。建议先确认人物、情节、环境三要素。',
      colorClassName: scriptStudioChapterColors[1] ?? 'bg-[#8b64d9]',
    },
    {
      id: 'fallback-3',
      number: 3,
      title: '第 3 章',
      summary: '等待前后文。导入样稿后这里会显示真实章节。',
      colorClassName: scriptStudioChapterColors[2] ?? 'bg-[#2f9d72]',
    },
  ]
}

function createScriptStudioOutlineLines(
  novel: PlotPilotNovel | null,
  featureState: PlotPilotNativeFeatureState,
) {
  const outline = asUiRecord(featureState.plotOutline)
  const stagePlan = outline.stage_plan ?? outline.stagePlan ?? outline.acts ?? outline.chapters
  const stageLines = Array.isArray(stagePlan)
    ? stagePlan.map((item, index) => {
        const record = asUiRecord(item)
        return String(record.title ?? record.summary ?? record.description ?? item ?? `第 ${index + 1} 阶段`)
      })
    : []
  const directLines = [
    outline.main_story_overview,
    outline.mainStoryOverview,
    outline.core_conflict,
    outline.coreConflict,
    outline.expected_ending,
    outline.expectedEnding,
    novel?.bible?.logline,
    novel?.subtitle,
  ].filter(Boolean).map(String)

  const lines = [...directLines, ...stageLines].filter((line) => line.trim().length > 0)
  if (lines.length > 0) return lines

  return [
    '尚未载入大纲。请先导入项目大纲，或在情节面板写下当前章目标。',
    '生成前应至少确认：前章结尾、本章目标、人物推进和章末钩子。',
    '远景设定只做回声，不能抢当前阶段主线。',
  ]
}

function createScriptStudioRelations(
  novel: PlotPilotNovel | null,
  bibleData?: PlotPilotBibleEditorData | null,
) {
  const bibleCharacters = novel?.bible?.characters ?? []
  const editorCharacters = bibleData?.characters?.map((character, index) => {
    const record = asUiRecord(character)
    return String(record.name ?? record.title ?? record.id ?? `人物 ${index + 1}`)
  }) ?? []
  const characters = [...bibleCharacters, ...editorCharacters].filter(Boolean)

  if (characters.length >= 2) {
    return characters.slice(0, 7).map((character, index) => {
      const target = characters[(index + 1) % characters.length] ?? '主线'
      return `${character} → ${target}（冲突 / 盟约）`
    })
  }

  return [
    '尚未载入人物关系。请先补人物卡、声线和当前关系状态。',
    '人物关系会影响对白、行动边界和本章情绪推进。',
  ]
}

function createScriptStudioCharacterCards(
  novel: PlotPilotNovel | null,
  bibleData?: PlotPilotBibleEditorData | null,
): ScriptStudioStorageCardView[] {
  const editorCharacters = bibleData?.characters?.map((character, index) => {
    const record = asUiRecord(character)
    const name = firstNonEmptyString(record, ['name', 'title', 'id']) || `人物 ${index + 1}`
    const role = firstNonEmptyString(record, ['role', 'archetype', 'type', 'status']) || '角色设定'
    const body = firstNonEmptyString(record, ['summary', 'description', 'motivation', 'secret', 'voice'])
      || '人物动机、声线、秘密与关系链会存储在这张卡里。'
    return {
      id: `character-editor-${String(record.id ?? index)}`,
      kind: 'character' as const,
      title: name,
      subtitle: role,
      body,
      badge: '人设',
      meta: firstNonEmptyString(record, ['faction', 'relationship', 'arc']) || 'Bible',
      initials: name.slice(0, 2),
      tone: index % 2 === 0 ? 'sage' as const : 'gold' as const,
      sourceIndex: index,
      sourceId: String(record.id ?? ''),
      source: 'bible' as const,
    }
  }) ?? []

  const summaryCharacters = novel?.bible?.characters?.map((character, index) => ({
    id: `character-summary-${index}`,
    kind: 'character' as const,
    title: character,
    subtitle: 'Bible summary',
    body: `${character} 的人设卡会承载目标、弱点、声线、秘密和与章节状态机的绑定。`,
    badge: '人设',
    meta: novel.title,
    initials: character.slice(0, 2),
    tone: index % 2 === 0 ? 'sage' as const : 'gold' as const,
    sourceIndex: index,
    sourceId: character,
    source: 'summary' as const,
  })) ?? []

  const cards = [...editorCharacters, ...summaryCharacters]
  if (cards.length > 0) return cards.slice(0, 3)

  return [
    {
      id: 'character-fallback-protagonist',
      kind: 'character',
      title: '主角',
      subtitle: '人物卡未载入',
      body: '请补充目标、弱点、声线、秘密、当前状态和本章行动边界。',
      badge: '人设',
      meta: '待完善',
      initials: '主',
      tone: 'sage',
      source: 'fallback',
    },
    {
      id: 'character-fallback-mentor',
      kind: 'character',
      title: '关键关系人',
      subtitle: '人物关系未载入',
      body: '请补充与主角的关系、冲突、帮助方式和不能越界的地方。',
      badge: '人设',
      meta: '待完善',
      initials: '关',
      tone: 'gold',
      source: 'fallback',
    },
  ]
}

function createScriptStudioPromptCards(featureState: PlotPilotNativeFeatureState): ScriptStudioStorageCardView[] {
  const promptCards = (featureState.prompts ?? []).map((prompt, index) => {
    const record = asUiRecord(prompt)
    const title = firstNonEmptyString(record, ['name', 'title', 'id', 'key']) || `Prompt ${index + 1}`
    const subtitle = firstNonEmptyString(record, ['scope', 'kind', 'type', 'stage']) || 'PlotPilot prompt'
    const body = firstNonEmptyString(record, ['description', 'summary', 'template', 'system', 'user'])
      || '用于记录生成章节、审稿、改写或角色声线的提示词模板。'
    return {
      id: `prompt-${String(record.id ?? record.key ?? index)}`,
      kind: 'prompt' as const,
      title,
      subtitle,
      body,
      badge: 'Prompt',
      meta: firstNonEmptyString(record, ['version', 'model', 'provider']) || 'registry',
      initials: 'P',
      tone: index % 2 === 0 ? 'ink' as const : 'sage' as const,
      sourceIndex: index,
      sourceId: String(record.id ?? record.key ?? ''),
      source: 'prompt-registry' as const,
    }
  })

  if (promptCards.length > 0) return promptCards.slice(0, 3)

  return [
    {
      id: 'prompt-fallback-chapter',
      kind: 'prompt',
      title: '章节正文生成',
      subtitle: 'chapter draft',
      body: '读取 story_state、章节节拍、人物声线与长上下文，生成可回写到 Drama Graph 的正文。',
      badge: 'Prompt',
      meta: 'PLM runtime',
      initials: '章',
      tone: 'ink',
      source: 'fallback',
    },
    {
      id: 'prompt-fallback-voice',
      kind: 'prompt',
      title: '人物声线校准',
      subtitle: 'character voice',
      body: '约束角色口吻、禁用漂移表达，并把 OOC 风险写入审稿报告。',
      badge: 'Prompt',
      meta: 'WritingSpec',
      initials: '声',
      tone: 'sage',
      source: 'fallback',
    },
  ]
}

function createScriptStudioStoryContextBundle(args: {
  novel: PlotPilotNovel | null
  activeChapter?: ScriptStudioChapterView | null
  activeChapterNumber: number
  chapterEditor?: PlotPilotChapterEditor | null
  outlineLines: string[]
  relationLines: string[]
  characterCards: ScriptStudioStorageCardView[]
  selectedBibleData?: PlotPilotBibleEditorData | null
}): PlotPilotStoryContextBundle {
  const bibleWorld = args.novel?.bible?.world?.trim()
  const bibleThemes = args.novel?.bible?.themes?.filter(Boolean).slice(0, 5) ?? []
  const bibleConstraints = args.novel?.bible?.constraints?.filter(Boolean).slice(0, 5) ?? []
  const editorWorld = args.selectedBibleData?.world_settings?.slice(0, 4).map((item) => {
    const record = asUiRecord(item)
    return [record.name, record.description].filter(Boolean).map(String).join('：')
  }).filter(Boolean) ?? []
  const editorLocations = args.selectedBibleData?.locations?.slice(0, 4).map((item) => {
    const record = asUiRecord(item)
    return [record.name, record.description].filter(Boolean).map(String).join('：')
  }).filter(Boolean) ?? []
  const editorTimeline = args.selectedBibleData?.timeline_notes?.slice(0, 4).map((item) => {
    const record = asUiRecord(item)
    return [record.time_point, record.event].filter(Boolean).map(String).join('：')
  }).filter(Boolean) ?? []
  const styleNotes = args.selectedBibleData?.style_notes?.slice(0, 5).map((item) => {
    const record = asUiRecord(item)
    return firstNonEmptyString(record, ['content', 'description', 'note'])
  }).filter(Boolean) ?? []

  const characterBody = [
    ...args.characterCards.slice(0, 4).map((card) => `${card.title}：${card.body}`),
    ...args.relationLines.slice(0, 5).map((line) => `关系：${line}`),
  ].join('\n')
  const plotBody = [
    args.activeChapter ? `当前章：第 ${args.activeChapter.number} 章《${args.activeChapter.title}》` : `当前章：第 ${args.activeChapterNumber} 章`,
    args.activeChapter?.summary ? `本章摘要：${args.activeChapter.summary}` : '',
    ...args.outlineLines.slice(0, 6).map((line) => `大纲：${line}`),
  ].filter(Boolean).join('\n')
  const worldBody = [
    bibleWorld ? `世界：${bibleWorld}` : '',
    ...editorWorld.map((line) => `世界规则：${line}`),
    ...editorLocations.map((line) => `地点：${line}`),
    ...editorTimeline.map((line) => `时间线：${line}`),
    ...bibleConstraints.map((line) => `约束：${line}`),
  ].filter(Boolean).join('\n')
  const styleBody = [
    args.novel?.lockedWritingStyle ? `锁定文风：${args.novel.lockedWritingStyle}` : '',
    ...bibleThemes.map((line) => `主题：${line}`),
    ...styleNotes.map((line) => `风格：${line}`),
    '生成时必须遵守已成正文事实、当前章目标、角色声线、文风规则、远景设定后置的优先级。',
  ].filter(Boolean).join('\n')

  const cards: PlotPilotStoryContextCard[] = [
    {
      id: 'story-context-characters',
      kind: 'character',
      title: '人物',
      body: characterBody || '人物卡尚未载入。生成前应补充主角、关键关系人、声线、当前关系状态和不能越界的地方。',
      source: 'bible.characters',
      priority: 3,
    },
    {
      id: 'story-context-plot',
      kind: 'plot',
      title: '情节',
      body: plotBody || '章节大纲尚未载入。生成前应确认前章结尾、本章目标、人物推进和章末钩子。',
      source: 'chapter_plan',
      priority: 2,
    },
    {
      id: 'story-context-world',
      kind: 'world',
      title: '环境',
      body: worldBody || '环境资料尚未载入。生成前应补充时代背景、地点气味、社会规则和本章可触摸的物件。',
      source: 'bible.world',
      priority: 4,
    },
    {
      id: 'story-context-style',
      kind: 'style',
      title: '文风',
      body: styleBody,
      source: 'style_guide',
      priority: 5,
    },
  ]

  return {
    schema: 'plotpilot.story_context.v1',
    novelId: args.novel?.id,
    chapterNumber: args.activeChapterNumber,
    cards,
  }
}

function firstNonEmptyString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  }
  return ''
}

function RuntimeBadge({ state }: { state: PlotPilotRuntimeState }) {
  const meta = runtimeMeta[state]
  const toneByState: Record<PlotPilotRuntimeState, StatusTone> = {
    offline: 'danger',
    starting: 'info',
    ready: 'success',
    error: 'danger',
  }

  return (
    <StatusBadge
      className="hidden h-5 px-1.5 py-0.5 sm:inline-flex"
      tone={toneByState[state]}
      dot
    >
      {meta.label}
    </StatusBadge>
  )
}

function canonicalIntegrationSurface(surface: PlotPilotIntegrationSurface): PlotPilotCanonicalIntegrationSurface {
  return surface === 'product-zen-panel' ? 'product-drama-browser' : surface
}

function integrationSurfaceLabel(surface: PlotPilotIntegrationSurface): string {
  if (surface === 'product-drama-browser') return 'Drama Browser product path'
  if (surface === 'product-zen-panel') return 'Drama Browser product path (legacy alias product-zen-panel)'
  if (surface === 'dev-localhost') return 'dev-localhost'
  if (surface === 'legacy-electron') return 'legacy-electron'
  return 'browser-fallback'
}

function integrationHostAdapterLabel(status: PlotPilotIntegrationStatus): string | null {
  const adapter = status.hostAdapter
    ?? (status.currentUrl?.includes('host=zen') || status.productPath ? 'zen-gecko' : undefined)
  if (adapter === 'zen-gecko') return 'Zen/Gecko adapter'
  if (adapter === 'browser') return 'browser adapter'
  if (adapter === 'electron') return 'legacy Electron adapter'
  return null
}

function integrationSurfaceDetail(status: PlotPilotIntegrationStatus): string {
  const canonicalSurface = status.canonicalSurface ?? canonicalIntegrationSurface(status.surface)
  const adapterLabel = integrationHostAdapterLabel(status)
  if (canonicalSurface === 'product-drama-browser' && adapterLabel) {
    return `${integrationSurfaceLabel(status.surface)} · ${adapterLabel}`
  }
  return integrationSurfaceLabel(status.surface)
}

function readinessTierLabel(tier: PlotPilotReadinessTier): string {
  if (tier === 'shell-ready') return 'Shell'
  if (tier === 'runtime-ready') return 'Runtime'
  if (tier === 'plm-sidecar-ready') return 'PLM sidecar'
  if (tier === 'ai-ready') return 'Codex AI'
  if (tier === 'workflow-preview-ready') return 'Workflow'
  return 'PlotPilot parity'
}

function readinessStateClassName(state: PlotPilotReadinessState): string {
  if (state === 'ready') return 'border-[#bddbcf] bg-[#edf8f2] text-[#245342]'
  if (state === 'pending') return 'border-[#ded2a2] bg-[#fff8df] text-[#6a5417]'
  return 'border-[#ebc6bc] bg-[#fff2ee] text-[#7a3327]'
}

function parityStateClassName(state: PlotPilotParityCheckState): string {
  if (state === 'ready') return 'border-[#bddbcf] bg-[#edf8f2] text-[#245342]'
  if (state === 'partial') return 'border-[#ded2a2] bg-[#fff8df] text-[#6a5417]'
  return 'border-[#ebc6bc] bg-[#fff2ee] text-[#7a3327]'
}

function productionEvidenceStateClassName(state: PlotPilotProductionEvidenceState): string {
  if (state === 'ready') return 'border-[#bddbcf] bg-[#edf8f2] text-[#245342]'
  if (state === 'partial') return 'border-[#ded2a2] bg-[#fff8df] text-[#6a5417]'
  return 'border-[#ebc6bc] bg-[#fff2ee] text-[#7a3327]'
}

function IntegrationBadge({ status }: { status?: PlotPilotIntegrationStatus }) {
  if (!status) return null
  return (
    <span
      title={status.reason}
      className={cn(
        'hidden h-5 items-center rounded-[6px] border px-1.5 py-0.5 font-mono text-[10px] font-semibold sm:inline-flex',
        status.productPath
          ? 'border-[#bddbcf] bg-[#edf8f2] text-[#245342]'
          : 'border-[#ded2a2] bg-[#fff8df] text-[#6a5417]',
      )}
    >
      {integrationSurfaceLabel(status.surface)}
    </span>
  )
}

function ScriptStudioLayerFailureBanner({
  runtimeStatus,
  integrationStatus,
  codexStatus,
  handlers,
  busy,
}: {
  runtimeStatus: PlotPilotRuntimeStatus
  integrationStatus?: PlotPilotIntegrationStatus
  codexStatus?: PlotPilotCodexStatus | null
  handlers?: PlotPilotNativeHandlers
  busy?: boolean
}) {
  const runtimeTier = readinessByTier(integrationStatus, 'runtime-ready')
  const sidecarTier = readinessByTier(integrationStatus, 'plm-sidecar-ready')
  const aiTier = readinessByTier(integrationStatus, 'ai-ready')
  const workspaceTier = readinessByTier(integrationStatus, 'workflow-preview-ready')
  const runtimeBlocked = runtimeTier?.state === 'blocked'
  const sidecarBlocked = !runtimeBlocked && (
    sidecarTier?.state === 'blocked'
    || runtimeStatus.state === 'offline'
    || runtimeStatus.state === 'error'
  )
  const aiBlocked = aiTier?.state === 'blocked' || (codexStatus ? !isCodexReady(codexStatus) : false)
  const workspaceBlocked = workspaceTier?.state === 'blocked'
  const cards: Array<{
    id: string
    icon: React.ComponentType<{ className?: string }>
    title: string
    body: string
    tone: 'red' | 'amber' | 'neutral'
    className?: string
    actions?: React.ReactNode
    meta?: React.ReactNode
  }> = []

  const copyDiagnostics = () => {
    const diagnostics = {
      runtime: {
        state: runtimeStatus.state,
        message: runtimeStatus.message,
        endpoint: runtimeStatus.endpoint,
      },
      integration: integrationStatus,
      codex: codexStatus,
    }
    void globalThis.navigator?.clipboard?.writeText(JSON.stringify(diagnostics, null, 2))
  }

  if (runtimeBlocked) {
    cards.push({
      id: 'runtime-unavailable',
      icon: Power,
      title: 'Runtime unavailable',
      body: runtimeTier?.message ?? runtimeStatus.message ?? 'Drama runtime 尚未连上，PLM 只能显示本地壳和诊断信息。',
      tone: 'red',
      actions: (
        <>
          <button
            type="button"
            onClick={handlers?.onStartEngine}
            disabled={busy || !handlers?.onStartEngine}
            className="h-7 rounded-[6px] border border-[#d9c6bd] bg-white px-2 text-[11px] font-semibold text-[#6d3326] disabled:cursor-not-allowed disabled:opacity-45"
          >
            启动
          </button>
          <button
            type="button"
            onClick={handlers?.onRestartEngine}
            disabled={busy || !handlers?.onRestartEngine}
            className="h-7 rounded-[6px] border border-[#d9c6bd] bg-white px-2 text-[11px] font-semibold text-[#6d3326] disabled:cursor-not-allowed disabled:opacity-45"
          >
            重试
          </button>
          <button
            type="button"
            onClick={copyDiagnostics}
            className="h-7 rounded-[6px] border border-[#d9c6bd] bg-white px-2 text-[11px] font-semibold text-[#6d3326]"
          >
            复制诊断
          </button>
        </>
      ),
      meta: runtimeStatus.endpoint ? (
        <div className="mt-2 break-all rounded-[6px] bg-white/70 px-2 py-1 font-mono text-[10px] text-[#7a4a3e]">
          {runtimeStatus.endpoint}
        </div>
      ) : null,
    })
  }

  if (sidecarBlocked) {
    cards.push({
      id: 'plotpilot-sidecar-unavailable',
      icon: AlertTriangle,
      title: 'PlotPilot sidecar unavailable',
      body: sidecarTier?.message ?? runtimeStatus.message ?? 'Drama runtime 在线，但 PlotPilot-compatible sidecar 未通过健康检查。',
      tone: 'amber',
      actions: (
        <button
          type="button"
          onClick={handlers?.onRestartEngine}
          disabled={busy || !handlers?.onRestartEngine}
          className="h-7 rounded-[6px] border border-[#d8c690] bg-white px-2 text-[11px] font-semibold text-[#6f5614] disabled:cursor-not-allowed disabled:opacity-45"
        >
          重试 sidecar
        </button>
      ),
    })
  }

  if (aiBlocked) {
    cards.push({
      id: 'codex-unavailable',
      icon: LogIn,
      title: 'Codex auth required',
      body: aiTier?.message ?? codexUnavailableMessage(codexStatus),
      tone: 'amber',
      actions: (
        <button
          type="button"
          onClick={handlers?.onStartCodexLogin}
          disabled={busy || !codexStatus?.available || !handlers?.onStartCodexLogin}
          className="h-7 rounded-[6px] border border-[#d8c690] bg-white px-2 text-[11px] font-semibold text-[#6f5614] disabled:cursor-not-allowed disabled:opacity-45"
        >
          登录 Codex
        </button>
      ),
    })
  }

  if (workspaceBlocked) {
    const pathHints = integrationStatus?.workspacePathHints?.filter(Boolean) ?? []
    cards.push({
      id: 'workspace-missing',
      icon: FolderOpen,
      title: 'Workspace missing',
      body: workspaceTier?.message ?? '尚未选择可用项目，项目相关 PLM 面板保持锁定。',
      tone: 'neutral',
      className: 'lg:col-span-2',
      actions: (
        <>
          <button
            type="button"
            onClick={handlers?.onCreateNovel}
            disabled={busy || !handlers?.onCreateNovel}
            className="h-7 rounded-[6px] border border-[#d7d0c2] bg-white px-2 text-[11px] font-semibold text-[#353932] disabled:cursor-not-allowed disabled:opacity-45"
          >
            新建项目
          </button>
          <button
            type="button"
            onClick={handlers?.onImportStorylet}
            disabled={busy || !handlers?.onImportStorylet}
            className="h-7 rounded-[6px] border border-[#d7d0c2] bg-white px-2 text-[11px] font-semibold text-[#353932] disabled:cursor-not-allowed disabled:opacity-45"
          >
            从 Graph 导入
          </button>
          <button
            type="button"
            onClick={copyDiagnostics}
            className="h-7 rounded-[6px] border border-[#d7d0c2] bg-white px-2 text-[11px] font-semibold text-[#353932]"
          >
            复制诊断
          </button>
        </>
      ),
      meta: (
        <div
          data-plm-workspace-missing-panel="true"
          className="mt-3 grid gap-2 md:grid-cols-[1fr_1.2fr_1fr]"
        >
          <div className="rounded-[7px] border border-[#ded9cd] bg-[#fbfaf6] p-2">
            <div className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#7c766b]">Blocked surfaces</div>
            <ul className="mt-1.5 space-y-1 text-[11px] leading-4 text-[#4c5048]">
              <li>Hosted Write / Autopilot</li>
              <li>章节保存与回写</li>
              <li>Memory Graph 写入</li>
            </ul>
          </div>
          <div className="rounded-[7px] border border-[#ded9cd] bg-[#fbfaf6] p-2">
            <div className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#7c766b]">Detected paths</div>
            {pathHints.length ? (
              <div className="mt-1.5 max-h-28 overflow-auto font-mono text-[10px] leading-4 text-[#5b5d56]">
                {pathHints.map((path) => (
                  <div key={path} className="break-all">{path}</div>
                ))}
              </div>
            ) : (
              <div className="mt-1.5 text-[11px] leading-4 text-[#5b5d56]">
                runtime 未返回 projectRoot/dataDir；先重启 runtime 或创建项目。
              </div>
            )}
          </div>
          <div className="rounded-[7px] border border-[#ded9cd] bg-[#fbfaf6] p-2">
            <div className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#7c766b]">Recovery</div>
            <div className="mt-1.5 text-[11px] leading-4 text-[#4c5048]">
              先新建或导入一个小说项目。完成后 Script Studio 会解锁章节纸张、storage cards 和生成链路。
            </div>
          </div>
        </div>
      ),
    })
  }

  if (cards.length === 0) return null

  return (
    <div className="mb-4 grid gap-2 lg:grid-cols-2">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.id}
            data-plm-failure={card.id}
            className={cn(
              'rounded-[10px] border px-3 py-2.5 shadow-[0_10px_24px_rgba(43,38,27,0.08)] backdrop-blur-[2px]',
              card.tone === 'red' && 'border-[#e4bfb4] bg-[#fff1ed]/94 text-[#673026]',
              card.tone === 'amber' && 'border-[#e6d39a] bg-[#fff8df]/94 text-[#684f12]',
              card.tone === 'neutral' && 'border-[#d8d3c8] bg-[#fffefd]/94 text-[#343831]',
              card.className,
            )}
          >
            <div className="flex items-start gap-2.5">
              <div className="grid size-8 shrink-0 place-items-center rounded-[7px] border border-current/15 bg-white/55">
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{card.title}</div>
                <div className="mt-0.5 text-xs leading-5 opacity-80">{card.body}</div>
                {card.meta}
                {card.actions ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">{card.actions}</div>
                ) : null}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ScriptStudioProductionEvidencePanel({
  snapshot,
  compact = false,
}: {
  snapshot?: PlotPilotProductionEvidenceSnapshot
  compact?: boolean
}) {
  if (!snapshot) return null
  const stateFor = (id: string) => snapshot.items.find((item) => item.id === id)?.state
  const content = (
    <div
      data-plm-production-evidence="true"
      data-plm-production-project-id={snapshot.projectId ?? ''}
      data-plm-production-chapter-id={snapshot.chapterId ?? ''}
      data-plm-production-chapter-number={snapshot.chapterNumber ?? ''}
      data-plm-stage9-ready={snapshot.stage9Ready ? 'true' : 'false'}
      data-plm-stage9-non-ready={(snapshot.stage9NonReady ?? []).join(',')}
      data-plm-hosted-write-evidence={stateFor('hosted-write') ?? ''}
      data-plm-prompt-evidence={stateFor('prompt') ?? ''}
      data-plm-memory-evidence={stateFor('memory') ?? ''}
      data-plm-autopilot-evidence={stateFor('autopilot') ?? ''}
      className="space-y-2"
    >
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="min-w-0 rounded-[7px] border border-[#e3dfd4] bg-[#fbfaf6] px-2.5 py-2">
          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#817c73]">Project</div>
          <div className="mt-1 truncate text-xs font-semibold text-[#30362f]">{snapshot.projectTitle ?? 'No project'}</div>
          <div className="mt-1 truncate font-mono text-[10px] text-[#777268]">{snapshot.projectId ?? snapshot.fixtureId ?? 'pending'}</div>
        </div>
        <div className="min-w-0 rounded-[7px] border border-[#e3dfd4] bg-[#fbfaf6] px-2.5 py-2">
          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#817c73]">Chapter</div>
          <div className="mt-1 truncate text-xs font-semibold text-[#30362f]">
            {snapshot.chapterNumber ? `第${snapshot.chapterNumber}章` : 'No chapter'}
          </div>
          <div className="mt-1 truncate font-mono text-[10px] text-[#777268]">{snapshot.chapterId ?? 'pending'}</div>
        </div>
      </div>
      <div className={compact ? 'space-y-1.5' : 'grid gap-2 md:grid-cols-2 xl:grid-cols-3'}>
        {snapshot.items.map((item) => (
          <div
            key={item.id}
            data-plm-production-evidence-item={item.id}
            data-state={item.state}
            className={cn('min-w-0 rounded-[7px] border px-2.5 py-2', productionEvidenceStateClassName(item.state))}
          >
            <div className="flex min-w-0 items-center justify-between gap-2">
              <span className="truncate text-xs font-semibold">{item.label}</span>
              <span className="font-mono text-[10px] uppercase">{item.state}</span>
            </div>
            <div className="mt-1 line-clamp-2 text-[11px] leading-4 opacity-80">{item.detail}</div>
            {item.evidence ? (
              <div className="mt-1 truncate font-mono text-[10px] opacity-70">{item.evidence}</div>
            ) : null}
          </div>
        ))}
      </div>
      {snapshot.pathHints?.length ? (
        <div className="space-y-1 rounded-[7px] border border-[#e3dfd4] bg-[#fbfaf6] px-2.5 py-2">
          {snapshot.pathHints.slice(0, 3).map((path, index) => (
            <div
              key={`${path}-${index}`}
              className="min-w-0 break-all font-mono text-[10px] leading-4 text-[#6f6a61]"
            >
              {path}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )

  if (compact) {
    return (
      <ScriptStudioFloatingCard title="Production Evidence" icon={Activity}>
        {content}
      </ScriptStudioFloatingCard>
    )
  }

  return (
    <ScriptStudioLightPanel
      icon={Activity}
      title="PLM Production Evidence"
      detail={snapshot.fixtureName ?? 'macOS happy path'}
    >
      {content}
    </ScriptStudioLightPanel>
  )
}

function ScriptStudioIntegrationPanel({
  status,
  compact = false,
}: {
  status?: PlotPilotIntegrationStatus
  compact?: boolean
}) {
  if (!status) return null
  const rows = status.tiers
  const blockedRows = rows.filter((row) => row.state === 'blocked')
  const content = (
    <div className="space-y-2">
      {!status.productPath ? (
        <div className="rounded-[7px] border border-[#ead7bd] bg-[#fff8eb] px-2.5 py-2 text-xs leading-5 text-[#6a4a17]">
          {status.reason ?? '当前不是 Drama Browser product path。'}
        </div>
      ) : null}
      <div className={compact ? 'space-y-1.5' : 'grid gap-2 md:grid-cols-2 xl:grid-cols-3'}>
        {rows.map((row) => (
          <div
            key={row.tier}
            className={cn(
              'min-w-0 rounded-[7px] border px-2.5 py-2',
              readinessStateClassName(row.state),
            )}
          >
            <div className="flex min-w-0 items-center justify-between gap-2">
              <span className="truncate text-xs font-semibold">{readinessTierLabel(row.tier)}</span>
              <span className="font-mono text-[10px] uppercase">{row.state}</span>
            </div>
            <div className="mt-1 line-clamp-2 text-[11px] leading-4 opacity-80">{row.message}</div>
          </div>
        ))}
      </div>
      {status.currentUrl ? (
        <div className="truncate rounded-[6px] border border-[#e3dfd4] bg-[#fbfaf6] px-2 py-1.5 font-mono text-[10px] text-[#6f6a61]">
          {status.currentUrl}
        </div>
      ) : null}
      {status.parityGaps?.length ? (
        <div className="rounded-[7px] border border-[#ded9cd] bg-[#f8f7f2] px-2.5 py-2 text-[11px] leading-5 text-[#68645d]">
          <span className="font-semibold text-[#343831]">Parity gaps:</span>{' '}
          {status.parityGaps.join(' / ')}
        </div>
      ) : null}
      {status.parityChecks?.length ? (
        <div
          data-plm-parity-matrix="true"
          className={compact ? 'space-y-1.5' : 'grid gap-2 md:grid-cols-2'}
        >
          {status.parityChecks.map((check) => (
            <div
              key={check.id}
              className={cn('min-w-0 rounded-[7px] border px-2.5 py-2', parityStateClassName(check.state))}
            >
              <div className="flex min-w-0 items-center justify-between gap-2">
                <span className="truncate text-xs font-semibold">{check.label}</span>
                <span className="font-mono text-[10px] uppercase">{check.state}</span>
              </div>
              <div className="mt-1 line-clamp-2 text-[11px] leading-4 opacity-80">{check.detail}</div>
              {check.evidence ? (
                <div className="mt-1 truncate font-mono text-[10px] opacity-70">{check.evidence}</div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
      {blockedRows.length ? (
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9a5547]">
          {blockedRows.length} blocked readiness tier{blockedRows.length === 1 ? '' : 's'}
        </div>
      ) : null}
    </div>
  )

  if (compact) {
    return (
      <ScriptStudioFloatingCard title="Integration Contract" icon={ShieldCheck}>
        {content}
      </ScriptStudioFloatingCard>
    )
  }

  return (
    <ScriptStudioLightPanel
      icon={ShieldCheck}
      title="Drama Browser PLM Integration Contract"
      detail={integrationSurfaceDetail(status)}
    >
      {content}
    </ScriptStudioLightPanel>
  )
}

function RuntimeCard({
  status,
  meta,
  codexStatus,
  onStartCodexLogin,
  busy,
}: {
  status: PlotPilotRuntimeStatus
  meta: (typeof runtimeMeta)[PlotPilotRuntimeState]
  codexStatus?: PlotPilotCodexStatus | null
  onStartCodexLogin?: () => void
  busy?: boolean
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
        <div className="mt-2 flex min-w-0 items-center justify-between gap-2 rounded-[6px] border border-white/[0.07] bg-black/20 px-2 py-1.5">
          <div className="min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/30">Codex OAuth</div>
            <div className="mt-0.5 truncate text-xs text-white/56">
              {codexStatus?.authenticated
                ? codexStatus.email || codexStatus.planType || '已登录'
                : codexStatus?.error
                  ? codexStatus.error
                  : '未登录 ChatGPT'}
            </div>
          </div>
          {!codexStatus?.authenticated ? (
            <Button
              size="sm"
              variant="outline"
              onClick={onStartCodexLogin}
              disabled={busy || !codexStatus?.available || !onStartCodexLogin}
              className="h-7 shrink-0 border-white/[0.1] bg-white/[0.04] px-2 text-[11px] text-white hover:bg-white/[0.08]"
            >
              <LogIn className="size-3.5" />
              登录
            </Button>
          ) : null}
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
  projectGuardStatus,
  onSurfaceChange,
}: {
  novel: PlotPilotNovel | null
  surface: PlotPilotWorkspaceSurface
  projectGuardStatus?: PlotPilotProjectGuardStatus | null
  onSurfaceChange: (surface: PlotPilotWorkspaceSurface) => void
}) {
  return (
    <div className="flex shrink-0 flex-col gap-3 border-b border-white/[0.07] bg-[#0a0b10] px-4 py-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid size-7 shrink-0 place-items-center rounded-[6px] border border-white/[0.08] bg-white/[0.045] text-white/70">
            <ScrollText className="size-3.5" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-white">{novel?.title ?? '未选择书目'}</h2>
            <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-white/42">
              <span className="min-w-0 break-words">{novel?.subtitle ?? 'PLM native workspace scaffold'}</span>
              {novel?.author ? <span>by {novel.author}</span> : null}
              {projectGuardStatus?.writingSpecId ? (
                <StatusPill>{projectGuardStatus.writingSpecTitle || projectGuardStatus.writingSpecId}</StatusPill>
              ) : null}
              {projectGuardStatus?.humanizerEnabled ? (
                <StatusPill>Humanizer {projectGuardStatus.humanizerPolicy ?? 'on'}</StatusPill>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="flex max-w-full shrink-0 flex-wrap items-center gap-1 rounded-[7px] border border-white/[0.08] bg-black/20 p-1">
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

function SetupWorkspace({
  novel,
  featureState,
  handlers,
  ready,
  busy,
}: {
  novel: PlotPilotNovel | null
  featureState: PlotPilotNativeFeatureState
  handlers?: PlotPilotNativeHandlers
  ready: boolean
  busy: boolean
}) {
  const [step, setStep] = React.useState(0)
  const [draft, setDraft] = React.useState<PlotPilotOnboardingDraft>(() => onboardingDraftFromNovel(novel))
  const [outlineDraft, setOutlineDraft] = React.useState<PlotPilotOutlineDraft>(() => outlineDraftFromValue(featureState.plotOutline))
  const [autoApprove, setAutoApprove] = React.useState(Boolean(novel?.autoApproveMode))
  const outline = featureState.plotOutline
  const mainPlotOptions = featureState.mainPlotOptions ?? []
  const setupEvents = featureState.setupEvents ?? []
  const loading = featureState.loadingKey === 'setup'
  const canCreate = Boolean(!novel && ready && !busy && handlers?.onCreateNovelFromOnboarding && draft.title.trim())
  const canSave = Boolean(novel && ready && !busy && handlers?.onSaveNovelSetup && draft.title.trim())
  const canSaveOutline = Boolean(novel && ready && !busy && handlers?.onSavePlotOutline)

  React.useEffect(() => {
    setDraft(onboardingDraftFromNovel(novel))
    setAutoApprove(Boolean(novel?.autoApproveMode))
    setStep(0)
  }, [novel?.id, novel?.autoApproveMode])

  React.useEffect(() => {
    setOutlineDraft(outlineDraftFromValue(featureState.plotOutline))
  }, [featureState.plotOutline])

  const updateDraft = (patch: Partial<PlotPilotOnboardingDraft>) => {
    setDraft((current) => ({ ...current, ...patch }))
  }

  const steps = [
    { title: '基础', detail: '书名、作者、梗概' },
    { title: '类型', detail: '赛道、世界观、篇幅' },
    { title: '结构', detail: '节奏、文风、要求' },
    { title: '确认', detail: '总纲、Bible、规划' },
  ]

  return (
    <div className="grid gap-3 2xl:grid-cols-[minmax(0,1fr)_340px]">
      <PanelShell>
        <SectionTitle
          icon={WandSparkles}
          title="Onboarding"
          detail={novel ? (novel.status ?? 'setup') : 'new novel'}
          action={
            <div className="flex items-center gap-1.5">
              <SmallAction onClick={() => novel && handlers?.onRefreshSetup?.(novel.id)} disabled={!novel || !ready || busy || !handlers?.onRefreshSetup}>
                <RotateCw className="size-3.5" />
                刷新
              </SmallAction>
              {novel ? (
                <SmallAction onClick={() => handlers?.onGeneratePlotOutline?.(novel.id)} disabled={!ready || busy || loading || !handlers?.onGeneratePlotOutline}>
                  {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                  总纲
                </SmallAction>
              ) : (
                <SmallAction onClick={() => handlers?.onCreateNovelFromOnboarding?.(draft)} disabled={!canCreate}>
                  <Plus className="size-3.5" />
                  创建
                </SmallAction>
              )}
              {novel ? (
                <SmallAction onClick={() => handlers?.onSaveNovelSetup?.(novel.id, draft)} disabled={!canSave}>
                  <Save className="size-3.5" />
                  保存
                </SmallAction>
              ) : null}
            </div>
          }
        />

        <div className="mt-4 grid gap-2 md:grid-cols-4">
          {steps.map((item, index) => (
            <button
              key={item.title}
              type="button"
              onClick={() => setStep(index)}
              className={cn(
                'rounded-[7px] border px-3 py-2 text-left transition-colors',
                step === index
                  ? 'border-white/[0.18] bg-white/[0.08] text-white'
                  : 'border-white/[0.07] bg-black/20 text-white/46 hover:bg-white/[0.045]',
              )}
            >
              <div className="font-mono text-[10px] text-white/34">0{index + 1}</div>
              <div className="mt-1 text-sm font-semibold">{item.title}</div>
              <div className="mt-0.5 truncate text-xs text-white/34">{item.detail}</div>
            </button>
          ))}
        </div>

        <div className="mt-4">
          {step === 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              <SetupTextField label="书名" value={draft.title} onChange={(title) => updateDraft({ title })} />
              <SetupTextField label="作者" value={draft.author} onChange={(author) => updateDraft({ author })} />
              <label className="block md:col-span-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/30">Premise</span>
                <Textarea
                  value={draft.premise}
                  onChange={(event) => updateDraft({ premise: event.currentTarget.value })}
                  className="mt-1 min-h-[132px] border-white/[0.08] bg-black/20 text-sm leading-6 text-white/72 placeholder:text-white/24"
                  placeholder="一句话或几段话描述核心人物、冲突、世界规则。"
                />
              </label>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="grid gap-3 md:grid-cols-2">
              <SetupTextField label="类型" value={draft.genre} onChange={(genre) => updateDraft({ genre })} placeholder="悬疑 / 科幻 / 都市 / 奇幻" />
              <SetupTextField label="世界观预设" value={draft.worldPreset} onChange={(worldPreset) => updateDraft({ worldPreset })} />
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/30">篇幅</span>
                <select
                  value={draft.lengthTier}
                  onChange={(event) => updateDraft({ lengthTier: event.currentTarget.value as PlotPilotOnboardingDraft['lengthTier'] })}
                  className="mt-1 h-8 w-full rounded-[6px] border border-white/[0.08] bg-[#08090d] px-2 text-xs text-white/72 outline-none focus:border-white/20"
                >
                  <option value="">自定义</option>
                  <option value="short">短篇</option>
                  <option value="standard">标准长篇</option>
                  <option value="epic">史诗长篇</option>
                </select>
              </label>
              <SetupNumberField label="目标章节" value={draft.targetChapters} min={1} onChange={(targetChapters) => updateDraft({ targetChapters })} />
              <SetupNumberField label="单章字数" value={draft.targetWordsPerChapter} min={300} onChange={(targetWordsPerChapter) => updateDraft({ targetWordsPerChapter })} />
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-3 md:grid-cols-2">
              <SetupTextField label="故事结构" value={draft.storyStructure} onChange={(storyStructure) => updateDraft({ storyStructure })} />
              <SetupTextField label="节奏控制" value={draft.pacingControl} onChange={(pacingControl) => updateDraft({ pacingControl })} />
              <label className="block md:col-span-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/30">文风</span>
                <Textarea
                  value={draft.writingStyle}
                  onChange={(event) => updateDraft({ writingStyle: event.currentTarget.value })}
                  className="mt-1 min-h-[96px] border-white/[0.08] bg-black/20 text-sm leading-6 text-white/72 placeholder:text-white/24"
                />
              </label>
              <label className="block md:col-span-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/30">特殊要求</span>
                <Textarea
                  value={draft.specialRequirements}
                  onChange={(event) => updateDraft({ specialRequirements: event.currentTarget.value })}
                  className="mt-1 min-h-[96px] border-white/[0.08] bg-black/20 text-sm leading-6 text-white/72 placeholder:text-white/24"
                />
              </label>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid gap-3 md:grid-cols-2">
              <FieldLine label="书名" value={draft.title || '未命名'} />
              <FieldLine label="目标" value={`${draft.targetChapters} 章 × ${draft.targetWordsPerChapter} 字`} />
              <FieldLine label="类型" value={draft.genre || novel?.lockedGenre || '未锁定'} />
              <FieldLine label="世界观" value={draft.worldPreset || novel?.lockedWorldPreset || '未锁定'} />
              <div className="flex flex-wrap gap-1.5 md:col-span-2">
                {!novel ? (
                  <SmallAction onClick={() => handlers?.onCreateNovelFromOnboarding?.(draft)} disabled={!canCreate}>
                    <Plus className="size-3.5" />
                    创建书目
                  </SmallAction>
                ) : (
                  <>
                    <SmallAction onClick={() => handlers?.onSaveNovelSetup?.(novel.id, draft)} disabled={!canSave}>
                      <Save className="size-3.5" />
                      保存设定
                    </SmallAction>
                    <SmallAction onClick={() => handlers?.onGeneratePlotOutline?.(novel.id)} disabled={!ready || busy || loading || !handlers?.onGeneratePlotOutline}>
                      {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                      生成总纲
                    </SmallAction>
                    <SmallAction onClick={() => handlers?.onSuggestMainPlotOptions?.(novel.id)} disabled={!ready || busy || loading || !handlers?.onSuggestMainPlotOptions}>
                      <GitBranch className="size-3.5" />
                      主线候选
                    </SmallAction>
                    <SmallAction onClick={() => handlers?.onGenerateBible?.(novel.id)} disabled={!ready || busy || !handlers?.onGenerateBible}>
                      <BookOpen className="size-3.5" />
                      生成 Bible
                    </SmallAction>
                    <SmallAction onClick={() => handlers?.onGenerateMacroPlan?.(novel.id)} disabled={!ready || busy || !handlers?.onGenerateMacroPlan}>
                      <GitBranch className="size-3.5" />
                      生成规划
                    </SmallAction>
                  </>
                )}
              </div>
              <div className="md:col-span-2">
                <ContentBlock label="Premise" value={draft.premise} fallback="尚未写入 premise。" />
              </div>
              {novel ? (
                <div className="md:col-span-2">
                  <ToggleRow
                    label="全自动审阅"
                    checked={autoApprove}
                    onCheckedChange={(checked) => {
                      setAutoApprove(checked)
                      handlers?.onSetAutoApproveMode?.(novel.id, checked)
                    }}
                    disabled={!ready || busy || !handlers?.onSetAutoApproveMode}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </PanelShell>

      <PanelShell>
        <SectionTitle
          icon={GitBranch}
          title="剧情总纲"
          detail={outline ? 'loaded' : 'empty'}
          action={novel ? (
            <div className="flex items-center gap-1.5">
              <SmallAction onClick={() => handlers?.onSuggestMainPlotOptions?.(novel.id)} disabled={!ready || busy || loading || !handlers?.onSuggestMainPlotOptions}>
                <GitBranch className="size-3.5" />
                主线
              </SmallAction>
              <SmallAction onClick={() => handlers?.onGeneratePlotOutline?.(novel.id)} disabled={!ready || busy || loading || !handlers?.onGeneratePlotOutline}>
                {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                生成
              </SmallAction>
              <SmallAction
                onClick={() => handlers?.onSavePlotOutline?.(novel.id, outlineDraftToPayload(outlineDraft))}
                disabled={!canSaveOutline}
              >
                <Save className="size-3.5" />
                保存
              </SmallAction>
            </div>
          ) : undefined}
        />
        <PlotOutlineEditor draft={outlineDraft} onChange={setOutlineDraft} />
        {mainPlotOptions.length > 0 ? (
          <div className="mt-4 space-y-2">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/30">主线候选</div>
            {mainPlotOptions.slice(0, 4).map((option, index) => (
              <div key={String(option.id ?? index)} className="rounded-[7px] border border-white/[0.07] bg-black/20 px-3 py-2">
                <div className="truncate text-sm font-semibold text-white/78">{String(option.title ?? `候选 ${index + 1}`)}</div>
                <div className="mt-1 text-xs leading-5 text-white/48">{String(option.logline ?? option.core_conflict ?? '')}</div>
                <div className="mt-2 flex flex-wrap gap-2 font-mono text-[10px] text-white/34">
                  <span>{String(option.type ?? 'main')}</span>
                  <span>{String(option.forbidden_drift ?? 'no drift')}</span>
                </div>
              </div>
            ))}
          </div>
        ) : null}
        {setupEvents.length > 0 ? (
          <JsonPreview value={setupEvents.slice(0, 8)} className="mt-3 max-h-40" />
        ) : (
          <JsonPreview value={featureState.lastMessage ?? '暂无 setup 事件。'} className="mt-3 max-h-32" />
        )}
        {novel ? (
          <div className="mt-3 grid gap-2">
            <FieldLine label="状态" value={novel.status ?? 'setup'} />
            <FieldLine label="当前锁定类型" value={novel.lockedGenre || '未锁定'} />
            <FieldLine label="当前锁定结构" value={novel.lockedStoryStructure || '未锁定'} />
            <FieldLine label="自动审阅" value={autoApprove ? '开启' : '关闭'} />
          </div>
        ) : (
          <WorkspacePlaceholder icon={WandSparkles} title="尚未创建书目" body="填写左侧向导后创建 PlotPilot 书目。" compact />
        )}
      </PanelShell>
    </div>
  )
}

function SetupTextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/30">{label}</span>
      <Input
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder={placeholder}
        className="mt-1 h-8 border-white/[0.08] bg-black/20 text-white/72 placeholder:text-white/24"
      />
    </label>
  )
}

function SetupNumberField({
  label,
  value,
  min,
  onChange,
}: {
  label: string
  value: number
  min: number
  onChange: (value: number) => void
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/30">{label}</span>
      <Input
        type="number"
        min={min}
        step={1}
        value={String(value)}
        onChange={(event) => {
          const next = Number(event.currentTarget.value)
          if (Number.isFinite(next)) onChange(next)
        }}
        className="mt-1 h-8 border-white/[0.08] bg-black/20 text-white/72"
      />
    </label>
  )
}

function outlineDraftFromValue(value: unknown): PlotPilotOutlineDraft {
  const record = asUiRecord(value)
  const stagePlan = Array.isArray(record.stage_plan) ? record.stage_plan : []
  return {
    mainStoryOverview: String(record.main_story_overview ?? ''),
    coreConflict: String(record.core_conflict ?? ''),
    expectedEnding: String(record.expected_ending ?? ''),
    stagePlanJson: stagePlan.length > 0 ? JSON.stringify(stagePlan, null, 2) : '[]',
  }
}

function parseStagePlanJson(value: string): Array<Record<string, unknown>> {
  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is Record<string, unknown> => (
      item !== null && typeof item === 'object' && !Array.isArray(item)
    ))
  } catch {
    return []
  }
}

function outlineDraftToPayload(draft: PlotPilotOutlineDraft): Record<string, unknown> {
  return {
    main_story_overview: draft.mainStoryOverview,
    core_conflict: draft.coreConflict,
    expected_ending: draft.expectedEnding,
    stage_plan: parseStagePlanJson(draft.stagePlanJson),
  }
}

function PlotOutlineEditor({
  draft,
  onChange,
}: {
  draft: PlotPilotOutlineDraft
  onChange: (draft: PlotPilotOutlineDraft) => void
}) {
  const update = (patch: Partial<PlotPilotOutlineDraft>) => onChange({ ...draft, ...patch })

  return (
    <div className="mt-3 space-y-3">
      <label className="block">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/30">主线概述</span>
        <Textarea
          value={draft.mainStoryOverview}
          onChange={(event) => update({ mainStoryOverview: event.currentTarget.value })}
          className="mt-1 min-h-[88px] border-white/[0.08] bg-black/20 text-xs leading-5 text-white/70"
        />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/30">核心冲突</span>
          <Textarea
            value={draft.coreConflict}
            onChange={(event) => update({ coreConflict: event.currentTarget.value })}
            className="mt-1 min-h-[72px] border-white/[0.08] bg-black/20 text-xs leading-5 text-white/70"
          />
        </label>
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/30">预期结局</span>
          <Textarea
            value={draft.expectedEnding}
            onChange={(event) => update({ expectedEnding: event.currentTarget.value })}
            className="mt-1 min-h-[72px] border-white/[0.08] bg-black/20 text-xs leading-5 text-white/70"
          />
        </label>
      </div>
      <label className="block">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/30">阶段规划 JSON</span>
        <Textarea
          value={draft.stagePlanJson}
          onChange={(event) => update({ stagePlanJson: event.currentTarget.value })}
          className="mt-1 min-h-[132px] border-white/[0.08] bg-[#08090d] font-mono text-[11px] leading-5 text-white/64"
        />
      </label>
    </div>
  )
}

function PlanningWorkspace({
  novel,
  chapterEditor,
  featureState,
  handlers,
  ready,
  busy,
}: {
  novel: PlotPilotNovel | null
  chapterEditor?: PlotPilotChapterEditor | null
  featureState: PlotPilotNativeFeatureState
  handlers?: PlotPilotNativeHandlers
  ready: boolean
  busy: boolean
}) {
  if (!novel) {
    return <WorkspacePlaceholder icon={GitBranch} title="Planning placeholder" body="选择书目后显示宏观规划和连续规划。" />
  }

  const currentChapter = chapterEditor?.novelId === novel.id
    ? chapterEditor.chapterNumber
    : novel.chapters?.[0]?.number ?? 1
  const loading = featureState.loadingKey === 'planning'

  return (
    <div className="grid gap-3 2xl:grid-cols-[minmax(0,1fr)_300px]">
      <PanelShell>
        <SectionTitle
          icon={GitBranch}
          title="宏观规划"
          detail={featureState.planningStructure ? 'structure loaded' : 'structure pending'}
          action={
            <div className="flex items-center gap-1.5">
              <SmallAction onClick={() => handlers?.onRefreshPlanning?.(novel.id)} disabled={!ready || busy || !handlers?.onRefreshPlanning}>
                <RotateCw className="size-3.5" />
                结构
              </SmallAction>
              <SmallAction onClick={() => handlers?.onGenerateMacroPlan?.(novel.id)} disabled={!ready || busy || loading || !handlers?.onGenerateMacroPlan}>
                {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                生成
              </SmallAction>
            </div>
          }
        />
        <JsonPreview value={featureState.planningStructure ?? featureState.planningResult ?? '还没有宏观结构树。'} className="mt-4 max-h-[620px]" />
      </PanelShell>

      <PanelShell>
        <SectionTitle icon={Network} title="连续规划" detail={`chapter ${currentChapter}`} />
        <div className="mt-4 space-y-3">
          <ContentBlock label="当前断点" value={`第 ${currentChapter} 章`} fallback="无断点" />
          <SmallAction
            onClick={() => handlers?.onContinuePlanning?.(novel.id, currentChapter)}
            disabled={!ready || busy || !handlers?.onContinuePlanning}
          >
            <GitBranch className="size-3.5" />
            续规划
          </SmallAction>
          <JsonPreview value={featureState.planningResult ?? '暂无连续规划结果。'} className="max-h-72" />
        </div>
      </PanelShell>
    </div>
  )
}

function BibleWorkspace({
  novel,
  bibleData,
  handlers,
  ready,
  busy,
}: {
  novel: PlotPilotNovel | null
  bibleData?: PlotPilotBibleEditorData | null
  handlers?: PlotPilotNativeHandlers
  ready: boolean
  busy: boolean
}) {
  const [draft, setDraft] = React.useState<PlotPilotBibleEditorData | null>(bibleData ?? null)

  React.useEffect(() => {
    setDraft(bibleData ?? null)
  }, [bibleData])

  if (!novel) {
    return <WorkspacePlaceholder icon={BookOpen} title="Bible placeholder" body="选择或创建书目后显示 story bible。" />
  }

  const bible = novel.bible
  const canSave = Boolean(ready && !busy && draft && handlers?.onSaveBible)

  return (
    <div className="grid gap-3 2xl:grid-cols-[minmax(0,1fr)_380px]">
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
              <SmallAction onClick={() => draft && handlers?.onSaveBible?.(novel.id, draft)} disabled={!canSave}>
                <Save className="size-3.5" />
                保存
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

      {draft ? (
        <div className="space-y-3">
          <BibleEntityEditor
            title="人物卡"
            detail={`${draft.characters.length} characters`}
            icon={Users}
            rows={draft.characters}
            fields={[
              ['name', '姓名'],
              ['role', '角色'],
              ['description', '描述'],
              ['core_motivation', '核心动机'],
              ['inner_lack', '内在缺口'],
              ['mental_state', '心理状态'],
              ['verbal_tic', '口癖'],
              ['idle_behavior', '惯常动作'],
              ['core_belief', '核心信念'],
              ['public_profile', '公开信息'],
              ['hidden_profile', '隐藏信息'],
              ['voice_profile', '声线 JSON'],
              ['moral_taboos', '禁忌 JSON'],
              ['active_wounds', '伤口 JSON'],
              ['relationships', '关系 JSON'],
              ['reveal_chapter', '揭示章节'],
            ]}
            onRowsChange={(rows) => setDraft((current) => current ? { ...current, characters: rows } : current)}
            createRow={() => ({ id: createDraftId('character'), name: '新角色', description: '', relationships: [] })}
          />
          <BibleEntityEditor
            title="世界观"
            detail={`${draft.world_settings.length} settings`}
            icon={Network}
            rows={draft.world_settings}
            fields={[
              ['name', '名称'],
              ['setting_type', '类型'],
              ['description', '描述'],
            ]}
            onRowsChange={(rows) => setDraft((current) => current ? { ...current, world_settings: rows } : current)}
            createRow={() => ({ id: createDraftId('world'), name: '新设定', setting_type: 'rule', description: '' })}
          />
          <BibleEntityEditor
            title="地点"
            detail={`${draft.locations.length} locations`}
            icon={Layers}
            rows={draft.locations}
            fields={[
              ['name', '名称'],
              ['location_type', '类型'],
              ['parent_id', '父地点'],
              ['description', '描述'],
            ]}
            onRowsChange={(rows) => setDraft((current) => current ? { ...current, locations: rows } : current)}
            createRow={() => ({ id: createDraftId('location'), name: '新地点', location_type: 'place', description: '', parent_id: null })}
          />
          <BibleEntityEditor
            title="时间线"
            detail={`${draft.timeline_notes.length} notes`}
            icon={GitBranch}
            rows={draft.timeline_notes}
            fields={[
              ['time_point', '时间点'],
              ['event', '事件'],
              ['description', '描述'],
            ]}
            onRowsChange={(rows) => setDraft((current) => current ? { ...current, timeline_notes: rows } : current)}
            createRow={() => ({ id: createDraftId('timeline'), time_point: 'TBD', event: '新事件', description: '' })}
          />
          <BibleEntityEditor
            title="文风规范"
            detail={`${draft.style_notes.length} notes`}
            icon={PenLine}
            rows={draft.style_notes}
            fields={[
              ['category', '类别'],
              ['content', '内容'],
            ]}
            onRowsChange={(rows) => setDraft((current) => current ? { ...current, style_notes: rows } : current)}
            createRow={() => ({ id: createDraftId('style'), category: 'style', content: '' })}
          />
        </div>
      ) : (
        <PanelShell>
          <WorkspacePlaceholder icon={BookOpen} title="Bible 尚未载入" body="刷新或生成 Bible 后可编辑人物、世界观、地点、时间线和文风。" compact />
        </PanelShell>
      )}
    </div>
  )
}

function BibleEntityEditor({
  title,
  detail,
  icon,
  rows,
  fields,
  onRowsChange,
  createRow,
}: {
  title: string
  detail: string
  icon: React.ComponentType<{ className?: string }>
  rows: Array<Record<string, unknown>>
  fields: Array<[string, string]>
  onRowsChange: (rows: Array<Record<string, unknown>>) => void
  createRow: () => Record<string, unknown>
}) {
  const updateRow = (index: number, key: string, value: string) => {
    onRowsChange(rows.map((row, rowIndex) => (
      rowIndex === index ? { ...row, [key]: value } : row
    )))
  }
  const removeRow = (index: number) => {
    onRowsChange(rows.filter((_, rowIndex) => rowIndex !== index))
  }

  return (
    <PanelShell>
      <SectionTitle
        icon={icon}
        title={title}
        detail={detail}
        action={
          <SmallAction onClick={() => onRowsChange([...rows, createRow()])}>
            <Plus className="size-3.5" />
            新增
          </SmallAction>
        }
      />
      <div className="mt-3 space-y-3">
        {rows.map((row, index) => (
          <div key={String(row.id ?? index)} className="rounded-[7px] border border-white/[0.07] bg-black/20 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/30">
                {String(row.id ?? `row-${index + 1}`)}
              </div>
              <SmallAction className="h-6 px-1.5" onClick={() => removeRow(index)} title="删除">
                <Trash2 className="size-3.5" />
              </SmallAction>
            </div>
            <div className="grid gap-2">
              {fields.map(([key, label]) => {
                const value = formatDraftFieldValue(row[key])
                const multiline = key.includes('description') ||
                  key.includes('profile') ||
                  key.includes('motivation') ||
                  key.includes('state') ||
                  key.includes('belief') ||
                  key === 'relationships' ||
                  key === 'voice_profile' ||
                  key === 'moral_taboos' ||
                  key === 'active_wounds' ||
                  key === 'content'

                return (
                  <label key={key} className="block">
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/30">{label}</span>
                    {multiline ? (
                      <textarea
                        value={value}
                        onChange={(event) => updateRow(index, key, event.currentTarget.value)}
                        className="mt-1 min-h-[64px] w-full resize-y rounded-[6px] border border-white/[0.08] bg-[#08090d] px-2 py-2 text-xs leading-5 text-white/70 outline-none placeholder:text-white/24 focus:border-white/20"
                      />
                    ) : (
                      <Input
                        value={value}
                        onChange={(event) => updateRow(index, key, event.currentTarget.value)}
                        className="mt-1 h-8 border-white/[0.08] bg-[#08090d] px-2 text-xs text-white/70"
                      />
                    )}
                  </label>
                )
              })}
            </div>
          </div>
        ))}
        {rows.length === 0 ? (
          <div className="rounded-[7px] border border-dashed border-white/[0.1] bg-white/[0.02] px-3 py-6 text-center text-xs text-white/38">
            暂无条目。
          </div>
        ) : null}
      </div>
    </PanelShell>
  )
}

function BeatWorkspace({
  novel,
  featureState,
  handlers,
  ready,
  busy,
}: {
  novel: PlotPilotNovel | null
  featureState: PlotPilotNativeFeatureState
  handlers?: PlotPilotNativeHandlers
  ready: boolean
  busy: boolean
}) {
  if (!novel) {
    return <WorkspacePlaceholder icon={ListChecks} title="Beat placeholder" body="选择书目后显示 beat sheet。" />
  }

  const beats = novel.beats ?? []
  const beatSheetScenes = Array.isArray(featureState.beatSheet?.scenes)
    ? featureState.beatSheet.scenes as Array<Record<string, unknown>>
    : []

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
      {beatSheetScenes.length > 0 ? (
        <div className="mt-4 grid gap-2">
          {beatSheetScenes.map((scene, index) => (
            <div
              key={`${String(scene.title ?? 'scene')}:${index}`}
              className="rounded-[7px] border border-white/[0.07] bg-black/20 px-3 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-[4px] bg-white/[0.06] font-mono text-[10px] text-white/42">
                  {index + 1}
                </span>
                <span className="truncate text-sm font-semibold text-white/82">{String(scene.title ?? `Scene ${index + 1}`)}</span>
              </div>
              <div className="mt-2 text-xs leading-5 text-white/48">{String(scene.goal ?? scene.summary ?? '')}</div>
              <div className="mt-2 flex flex-wrap gap-2 font-mono text-[10px] text-white/34">
                <span>{String(scene.pov_character ?? scene.pov ?? 'pov')}</span>
                <span>{String(scene.location ?? 'location')}</span>
                <span>{String(scene.estimated_words ?? 0)} words</span>
              </div>
            </div>
          ))}
        </div>
      ) : beats.length > 0 ? (
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
        <div className="mt-4 grid min-h-[520px] gap-3 2xl:grid-cols-[300px_minmax(0,1fr)]">
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

      {editor.lastWritingSpecFailure ? (
        <div className="shrink-0 border-b border-white/[0.07] px-3 py-3">
          <WritingSpecFailurePanel failure={editor.lastWritingSpecFailure} />
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

function ReviewWorkspace({
  novel,
  chapterEditor,
  featureState,
  handlers,
  ready,
  busy,
}: {
  novel: PlotPilotNovel | null
  chapterEditor?: PlotPilotChapterEditor | null
  featureState: PlotPilotNativeFeatureState
  handlers?: PlotPilotNativeHandlers
  ready: boolean
  busy: boolean
}) {
  if (!novel) {
    return <WorkspacePlaceholder icon={ShieldCheck} title="Review placeholder" body="选择书目后显示审稿和读者模拟。" />
  }

  const chapterNumber = chapterEditor?.novelId === novel.id
    ? chapterEditor.chapterNumber
    : novel.chapters?.[0]?.number ?? 1
  const loading = featureState.loadingKey === 'review'

  return (
    <div className="grid gap-3 2xl:grid-cols-[minmax(0,1fr)_320px]">
      <PanelShell>
        <SectionTitle
          icon={ShieldCheck}
          title="章节审稿"
          detail={`chapter ${chapterNumber}`}
          action={
            <div className="flex items-center gap-1.5">
              <SmallAction onClick={() => handlers?.onRefreshReview?.(novel.id, chapterNumber)} disabled={!ready || busy || !handlers?.onRefreshReview}>
                <RotateCw className="size-3.5" />
                报告
              </SmallAction>
              <SmallAction onClick={() => handlers?.onReviewChapter?.(novel.id, chapterNumber)} disabled={!ready || busy || loading || !handlers?.onReviewChapter}>
                {loading ? <Loader2 className="size-3.5 animate-spin" /> : <ShieldCheck className="size-3.5" />}
                审稿
              </SmallAction>
              <SmallAction onClick={() => handlers?.onSimulateReaders?.(novel.id, chapterNumber)} disabled={!ready || busy || loading || !handlers?.onSimulateReaders}>
                <Users className="size-3.5" />
                读者
              </SmallAction>
            </div>
          }
        />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <JsonPreview value={featureState.reviewResult ?? '暂无 AI 审稿结果。'} className="max-h-[440px]" />
          <JsonPreview value={featureState.readerReport ?? '暂无读者模拟报告。'} className="max-h-[440px]" />
        </div>
      </PanelShell>

      <PanelShell>
        <SectionTitle icon={AlertTriangle} title="劝退风险" detail={`${featureState.churnAlerts?.length ?? 0} alerts`} />
        <div className="mt-3 space-y-2">
          {(featureState.churnAlerts ?? []).slice(0, 8).map((alert, index) => (
            <div key={String(alert.chapter_number ?? index)} className="rounded-[7px] border border-white/[0.07] bg-black/20 px-3 py-2">
              <div className="font-mono text-[10px] text-white/34">chapter {String(alert.chapter_number ?? index + 1)}</div>
              <div className="mt-1 text-sm font-semibold text-white/74">risk {String(alert.avg_churn_risk ?? '-')}</div>
              <div className="mt-1 line-clamp-3 text-xs leading-5 text-white/46">{String(alert.pacing_verdict ?? '')}</div>
            </div>
          ))}
          {featureState.churnAlerts?.length ? null : (
            <div className="rounded-[7px] border border-dashed border-white/[0.1] bg-white/[0.02] px-3 py-6 text-center text-xs text-white/38">
              暂无劝退风险告警。
            </div>
          )}
        </div>
      </PanelShell>
    </div>
  )
}

function AutopilotWorkspace({
  novel,
  featureState,
  handlers,
  ready,
  busy,
}: {
  novel: PlotPilotNovel | null
  featureState: PlotPilotNativeFeatureState
  handlers?: PlotPilotNativeHandlers
  ready: boolean
  busy: boolean
}) {
  const [fromChapter, setFromChapter] = React.useState('1')
  const [toChapter, setToChapter] = React.useState('3')
  const [autoSave, setAutoSave] = React.useState(true)
  const [autoOutline, setAutoOutline] = React.useState(true)
  const [maxAutoChapters, setMaxAutoChapters] = React.useState('8')
  const [autoApprove, setAutoApprove] = React.useState(Boolean(novel?.autoApproveMode))

  React.useEffect(() => {
    if (!novel) return
    const nextStart = Math.max(1, (novel.chapters?.length ?? 0) + 1)
    setFromChapter(String(nextStart))
    setToChapter(String(nextStart))
    setAutoApprove(Boolean(novel.autoApproveMode))
  }, [novel?.id, novel?.autoApproveMode])

  if (!novel) {
    return <WorkspacePlaceholder icon={Gauge} title="Autopilot placeholder" body="选择书目后显示多章连写控制台。" />
  }

  const from = Number(fromChapter)
  const to = Number(toChapter)
  const maxAuto = Number(maxAutoChapters)
  const autopilotStatus = asUiRecord(featureState.autopilotStatus)
  const circuitBreaker = asUiRecord(featureState.autopilotCircuitBreaker)
  const autopilotEvents = featureState.autopilotEvents ?? []
  const autopilotStatusEvents = featureState.autopilotStatusEvents ?? []
  const autopilotChapterEvents = featureState.autopilotChapterEvents ?? []
  const autopilotChapterSnapshot = asUiRecord(featureState.autopilotChapterSnapshot)
  const autopilotState = String(autopilotStatus.autopilot_status ?? autopilotStatus.status ?? novel.status ?? 'stopped')
  const currentStage = String(autopilotStatus.current_stage ?? autopilotStatus.last_stable_stage ?? 'unknown')
  const needsReview = Boolean(autopilotStatus.needs_review || autopilotStatus.requires_ai_review || autopilotStatus.has_active_invocation)
  const canStart = Boolean(
    ready
    && !busy
    && handlers?.onHostedWrite
    && Number.isInteger(from)
    && Number.isInteger(to)
    && from > 0
    && to >= from,
  )
  const canStartAutopilot = Boolean(
    ready
    && !busy
    && handlers?.onStartAutopilot
    && Number.isInteger(maxAuto)
    && maxAuto > 0
    && (novel.targetChapters ?? 0) > 0
    && (novel.targetWordsPerChapter ?? 0) > 0,
  )
  const isAutopilotRunning = autopilotState === 'running'

  return (
    <div className="grid gap-3 2xl:grid-cols-[380px_minmax(0,1fr)]">
      <div className="space-y-3">
        <PanelShell>
          <SectionTitle icon={Gauge} title="Autopilot" detail={autopilotState} />
          <div className="mt-4 grid gap-3">
            <div className="grid grid-cols-2 gap-2">
              <FieldLine label="阶段" value={currentStage} />
              <FieldLine label="当前章" value={String(autopilotStatus.current_chapter_number ?? autopilotStatus.current_chapter_in_act ?? '-')} />
              <FieldLine label="目标章节" value={String(autopilotStatus.target_chapters ?? novel.targetChapters ?? '-')} />
              <FieldLine label="单章字数" value={String(autopilotStatus.target_words_per_chapter ?? novel.targetWordsPerChapter ?? '-')} />
            </div>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/30">保护上限</span>
              <Input
                type="number"
                min={1}
                value={maxAutoChapters}
                onChange={(event) => setMaxAutoChapters(event.currentTarget.value)}
                className="mt-1 h-8 border-white/[0.08] bg-black/20 text-white/72"
              />
            </label>
            <ToggleRow
              label="全自动跳过审阅"
              checked={autoApprove}
              onCheckedChange={(checked) => {
                setAutoApprove(checked)
                handlers?.onSetAutoApproveMode?.(novel.id, checked)
              }}
              disabled={!ready || busy || !handlers?.onSetAutoApproveMode}
            />
            <div className="grid grid-cols-2 gap-1.5">
              <SmallAction onClick={() => handlers?.onRefreshAutopilot?.(novel.id)} disabled={!ready || busy || !handlers?.onRefreshAutopilot}>
                <RotateCw className="size-3.5" />
                刷新
              </SmallAction>
              <SmallAction
                onClick={() => handlers?.onStartAutopilot?.(
                  novel.id,
                  maxAuto,
                  novel.targetChapters ?? 30,
                  novel.targetWordsPerChapter ?? 2500,
                  autoApprove,
                )}
                disabled={!canStartAutopilot || isAutopilotRunning}
              >
                <Play className="size-3.5" />
                启动
              </SmallAction>
              <SmallAction onClick={() => handlers?.onResumeAutopilot?.(novel.id)} disabled={!ready || busy || !handlers?.onResumeAutopilot || !needsReview}>
                <Play className="size-3.5" />
                恢复
              </SmallAction>
              <SmallAction onClick={() => handlers?.onStopAutopilot?.(novel.id)} disabled={!ready || !handlers?.onStopAutopilot || !isAutopilotRunning}>
                <Square className="size-3.5" />
                停止
              </SmallAction>
            </div>
            <SmallAction onClick={() => handlers?.onResetAutopilotBreaker?.(novel.id)} disabled={!ready || busy || !handlers?.onResetAutopilotBreaker}>
              <ShieldCheck className="size-3.5" />
              重置熔断器
            </SmallAction>
          </div>
        </PanelShell>

        <PanelShell>
          <SectionTitle icon={Gauge} title="Hosted Write" detail="range stream" />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/30">From</span>
              <Input
                type="number"
                min={1}
                value={fromChapter}
                onChange={(event) => setFromChapter(event.currentTarget.value)}
                className="mt-1 h-8 border-white/[0.08] bg-black/20 text-white/72"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/30">To</span>
              <Input
                type="number"
                min={1}
                value={toChapter}
                onChange={(event) => setToChapter(event.currentTarget.value)}
                className="mt-1 h-8 border-white/[0.08] bg-black/20 text-white/72"
              />
            </label>
          </div>
          <div className="mt-4 space-y-3">
            <ToggleRow label="自动保存" checked={autoSave} onCheckedChange={setAutoSave} />
            <ToggleRow label="自动大纲" checked={autoOutline} onCheckedChange={setAutoOutline} />
          </div>
          <SmallAction
            className="mt-4"
            onClick={() => handlers?.onHostedWrite?.(novel.id, from, to, autoSave, autoOutline)}
            disabled={!canStart}
          >
            <Play className="size-3.5" />
            启动连写
          </SmallAction>
        </PanelShell>
      </div>

      <div className="space-y-3">
        <PanelShell>
          <SectionTitle
            icon={Activity}
            title="自动驾驶状态"
            detail={featureState.loadingKey === 'autopilot' ? 'streaming' : autopilotState}
          />
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <FieldLine label="审阅门" value={needsReview ? '等待确认' : '通过'} />
            <FieldLine label="熔断器" value={String(circuitBreaker.status ?? 'unknown')} />
            <FieldLine label="失败数" value={String(circuitBreaker.error_count ?? 0)} />
            <FieldLine label="进度" value={`${String(autopilotStatus.progress_pct ?? 0)}%`} />
            <FieldLine label="已完成" value={String(autopilotStatus.completed_chapters ?? 0)} />
            <FieldLine label="累计字数" value={String(autopilotStatus.total_words ?? 0)} />
          </div>
          <JsonPreview value={autopilotStatus} className="mt-3 max-h-72" />
        </PanelShell>

        <PanelShell>
          <SectionTitle
            icon={FileText}
            title="章节流"
            detail={String(autopilotChapterSnapshot.chapterNumber ?? autopilotStatus.current_chapter_number ?? '-')}
          />
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <FieldLine label="章节" value={String(autopilotChapterSnapshot.chapterNumber ?? '-')} />
            <FieldLine label="Beat" value={String(autopilotChapterSnapshot.beatIndex ?? '-')} />
            <FieldLine label="字数" value={String(autopilotChapterSnapshot.wordCount ?? '-')} />
          </div>
          <div className="mt-3 max-h-64 overflow-auto rounded-[7px] border border-white/[0.07] bg-black/25 p-3 text-xs leading-6 text-white/62">
            {String(autopilotChapterSnapshot.content ?? autopilotChapterSnapshot.chunk ?? '等待章节正文流。')}
          </div>
          {autopilotChapterEvents.length > 0 ? (
            <JsonPreview value={autopilotChapterEvents.slice(0, 8)} className="mt-3 max-h-40" />
          ) : null}
        </PanelShell>

        <PanelShell>
          <SectionTitle icon={Terminal} title="事件时间线" detail={`${autopilotEvents.length} events`} />
          <div className="mt-4 space-y-2">
            {autopilotEvents.slice(0, 40).map((event, index) => (
              <div key={String(event.id ?? event.seq ?? index)} className="rounded-[7px] border border-white/[0.07] bg-black/20 px-3 py-2">
                <div className="flex min-w-0 items-center justify-between gap-2">
                  <div className="truncate font-mono text-[11px] text-white/62">{String(event.type ?? 'event')}</div>
                  <div className="shrink-0 font-mono text-[10px] text-white/32">{String(event.timestamp ?? event.seq ?? '')}</div>
                </div>
                <div className="mt-1 text-xs leading-5 text-white/50">{String(event.message ?? event.detail ?? '')}</div>
              </div>
            ))}
            {autopilotEvents.length ? null : (
              <JsonPreview value={featureState.lastMessage ?? '暂无 Autopilot 事件。'} className="max-h-72" />
            )}
          </div>
        </PanelShell>

        <PanelShell>
          <SectionTitle icon={Activity} title="状态流" detail={`${autopilotStatusEvents.length} snapshots`} />
          <JsonPreview value={autopilotStatusEvents.length ? autopilotStatusEvents.slice(0, 8) : '暂无状态流快照。'} className="mt-3 max-h-56" />
        </PanelShell>
      </div>
    </div>
  )
}

function MemoryWorkspace({
  novel,
  featureState,
  handlers,
  ready,
  busy,
}: {
  novel: PlotPilotNovel | null
  featureState: PlotPilotNativeFeatureState
  handlers?: PlotPilotNativeHandlers
  ready: boolean
  busy: boolean
}) {
  if (!novel) {
    return <WorkspacePlaceholder icon={Brain} title="Memory placeholder" body="选择书目后显示知识图谱和记忆检索。" />
  }

  return (
    <div className="grid gap-3 2xl:grid-cols-[320px_minmax(0,1fr)]">
      <PanelShell>
        <SectionTitle
          icon={Brain}
          title="Knowledge Graph"
          detail={`${featureState.knowledgeTriples?.length ?? 0} triples`}
          action={
            <div className="flex items-center gap-1.5">
              <SmallAction onClick={() => handlers?.onRefreshMemory?.(novel.id)} disabled={!ready || busy || !handlers?.onRefreshMemory}>
                <RotateCw className="size-3.5" />
                刷新
              </SmallAction>
              <SmallAction onClick={() => handlers?.onInferKnowledgeGraph?.(novel.id)} disabled={!ready || busy || !handlers?.onInferKnowledgeGraph}>
                <Network className="size-3.5" />
                推断
              </SmallAction>
            </div>
          }
        />
        <JsonPreview value={featureState.knowledgeStats ?? '暂无 KG 统计。'} className="mt-4 max-h-80" />
      </PanelShell>

      <PanelShell>
        <SectionTitle icon={Search} title="记忆三元组" detail="retrieval substrate" />
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {(featureState.knowledgeTriples ?? []).slice(0, 24).map((triple, index) => (
            <div key={String(triple.id ?? index)} className="rounded-[7px] border border-white/[0.07] bg-black/20 px-3 py-2">
              <div className="truncate text-sm font-semibold text-white/76">
                {String(triple.subject ?? triple.subject_id ?? 'subject')} → {String(triple.object ?? triple.object_id ?? 'object')}
              </div>
              <div className="mt-1 flex items-center gap-2 font-mono text-[10px] text-white/34">
                <span>{String(triple.predicate ?? 'relation')}</span>
                <span>{String(triple.confidence ?? '')}</span>
              </div>
              <div className="mt-1 line-clamp-2 text-xs leading-5 text-white/44">{String(triple.description ?? '')}</div>
            </div>
          ))}
        </div>
        {featureState.knowledgeTriples?.length ? null : (
          <WorkspacePlaceholder icon={Brain} title="暂无三元组" body="运行推断或刷新后会显示 PLM memory graph。" compact />
        )}
      </PanelShell>
    </div>
  )
}

function DebugWorkspace({
  novel,
  featureState,
  handlers,
  ready,
  busy,
}: {
  novel: PlotPilotNovel | null
  featureState: PlotPilotNativeFeatureState
  handlers?: PlotPilotNativeHandlers
  ready: boolean
  busy: boolean
}) {
  if (!novel) {
    return <WorkspacePlaceholder icon={Bug} title="Debug placeholder" body="选择书目后显示 Prompt 和 Trace。" />
  }

  return (
    <div className="grid gap-3 2xl:grid-cols-2">
      <div className="xl:col-span-2">
        <InvocationReviewPanel featureState={featureState} handlers={handlers} ready={ready} busy={busy} />
      </div>
      <PanelShell>
        <SectionTitle
          icon={Terminal}
          title="AI Trace"
          detail={`${featureState.aiTraces?.length ?? 0} traces`}
          action={
            <SmallAction onClick={() => handlers?.onRefreshDebug?.(novel.id)} disabled={!ready || busy || !handlers?.onRefreshDebug}>
              <RotateCw className="size-3.5" />
              刷新
            </SmallAction>
          }
        />
        <div className="mt-4 space-y-2">
          {(featureState.aiTraces ?? []).slice(0, 12).map((trace, index) => (
            <button
              key={String(trace.trace_id ?? index)}
              type="button"
              className="w-full rounded-[7px] border border-white/[0.07] bg-black/20 px-3 py-2 text-left outline-none transition-colors hover:bg-white/[0.04] focus-visible:ring-1 focus-visible:ring-white/30"
              onClick={() => {
                const traceId = String(trace.trace_id ?? '')
                if (traceId) handlers?.onLoadTraceTimeline?.(novel.id, traceId)
              }}
              disabled={!handlers?.onLoadTraceTimeline}
            >
              <div className="truncate font-mono text-[11px] text-white/64">{String(trace.trace_id ?? 'trace')}</div>
              <div className="mt-1 flex flex-wrap gap-2 font-mono text-[10px] text-white/34">
                <span>{String(trace.operation ?? 'ai_call')}</span>
                <span>{String(trace.span_count ?? 0)} spans</span>
                <span>{String(trace.error_count ?? 0)} errors</span>
              </div>
            </button>
          ))}
          {featureState.aiTraces?.length ? null : <JsonPreview value={featureState.traceStats ?? '暂无 trace。'} />}
        </div>
        {featureState.traceTimeline ? (
          <JsonPreview value={featureState.traceTimeline} className="mt-3 max-h-72" />
        ) : null}
      </PanelShell>

      <PanelShell>
        <SectionTitle icon={Bug} title="Prompt Registry" detail="llm-control" />
        <JsonPreview value={{ stats: featureState.promptStats ?? null, prompts: featureState.prompts ?? [] }} className="mt-4 max-h-[620px]" />
      </PanelShell>
    </div>
  )
}

function InvocationReviewPanel({
  featureState,
  handlers,
  ready,
  busy,
}: {
  featureState: PlotPilotNativeFeatureState
  handlers?: PlotPilotNativeHandlers
  ready: boolean
  busy: boolean
}) {
  const [sessionId, setSessionId] = React.useState('')
  const invocation = featureState.activeInvocation
  const session = asUiRecord(invocation?.session)
  const attempt = asUiRecord(invocation?.attempt)
  const decision = asUiRecord(invocation?.decision)
  const commit = asUiRecord(invocation?.commit)
  const resolvedSessionId = String(session.id ?? sessionId).trim()
  const canOperate = Boolean(ready && !busy && resolvedSessionId)

  React.useEffect(() => {
    const nextSessionId = String(session.id ?? '')
    if (nextSessionId && nextSessionId !== sessionId) setSessionId(nextSessionId)
  }, [session.id])

  return (
    <PanelShell>
      <SectionTitle
        icon={ShieldCheck}
        title="AI Invocation Review"
        detail={String(session.status ?? invocation?.next_action ?? 'idle')}
        action={
          <SmallAction
            onClick={() => handlers?.onLoadInvocation?.(sessionId.trim())}
            disabled={!ready || busy || !sessionId.trim() || !handlers?.onLoadInvocation}
          >
            <Search className="size-3.5" />
            读取
          </SmallAction>
        }
      />
      <div className="mt-4 grid gap-3 2xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-3">
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/30">Session ID</span>
            <Input
              value={sessionId}
              onChange={(event) => setSessionId(event.currentTarget.value)}
              placeholder="ai invocation session id"
              className="mt-1 h-8 border-white/[0.08] bg-black/20 font-mono text-xs text-white/72 placeholder:text-white/24"
            />
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <SmallAction onClick={() => handlers?.onResumeInvocation?.(resolvedSessionId)} disabled={!canOperate || !handlers?.onResumeInvocation}>
              <Play className="size-3.5" />
              Resume
            </SmallAction>
            <SmallAction onClick={() => handlers?.onRetryInvocation?.(resolvedSessionId)} disabled={!canOperate || !handlers?.onRetryInvocation}>
              <RotateCw className="size-3.5" />
              Retry
            </SmallAction>
            <SmallAction onClick={() => handlers?.onAcceptInvocation?.(resolvedSessionId)} disabled={!canOperate || !attempt.id || !handlers?.onAcceptInvocation}>
              <CheckCircle2 className="size-3.5" />
              Accept
            </SmallAction>
            <SmallAction onClick={() => handlers?.onRejectInvocation?.(resolvedSessionId)} disabled={!canOperate || !attempt.id || !handlers?.onRejectInvocation}>
              <Square className="size-3.5" />
              Reject
            </SmallAction>
            <SmallAction className="col-span-2" onClick={() => handlers?.onCommitInvocation?.(resolvedSessionId)} disabled={!canOperate || !decision.id || !handlers?.onCommitInvocation}>
              <Save className="size-3.5" />
              Commit
            </SmallAction>
          </div>
          <JsonPreview
            value={{
              session: pickRecord(session, ['id', 'operation', 'node_key', 'policy', 'status']),
              next_action: invocation?.next_action,
              attempt: pickRecord(attempt, ['id', 'status', 'error']),
              decision: pickRecord(decision, ['id', 'decision']),
              commit: pickRecord(commit, ['id', 'status', 'error']),
            }}
            className="max-h-72"
          />
        </div>
        <div className="grid gap-3 2xl:grid-cols-2">
          <ContentBlock
            label="Prompt"
            value={resolvePromptPreview(session)}
            fallback="当前 session 没有 prompt snapshot。"
          />
          <ContentBlock
            label="Attempt"
            value={String(attempt.content ?? attempt.error ?? '')}
            fallback="当前 session 还没有模型输出。"
          />
        </div>
      </div>
    </PanelShell>
  )
}

function GenerationPanel({
  status,
  novel,
  projectGuardStatus,
  lastWritingSpecFailure,
  logs,
  handlers,
}: {
  status: PlotPilotRuntimeStatus
  novel: PlotPilotNovel | null
  projectGuardStatus?: PlotPilotProjectGuardStatus | null
  lastWritingSpecFailure?: PlotPilotWritingSpecFailureView | null
  logs: PlotPilotLogEntry[]
  handlers?: PlotPilotNativeHandlers
}) {
  const job = status.activeJob ?? null
  const ready = status.state === 'ready'
  const busy = Boolean(job) || status.state === 'starting'

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
            <SmallAction className="mt-3" onClick={() => handlers?.onStopGeneration?.(job.id)} disabled={!handlers?.onStopGeneration}>
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

      <ProjectSettingsPanel
        novel={novel}
        status={projectGuardStatus}
        failure={lastWritingSpecFailure}
        handlers={handlers}
        ready={ready}
        busy={busy}
      />

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

function ProjectSettingsPanel({
  novel,
  status,
  failure,
  handlers,
  ready,
  busy,
}: {
  novel: PlotPilotNovel | null
  status?: PlotPilotProjectGuardStatus | null
  failure?: PlotPilotWritingSpecFailureView | null
  handlers?: PlotPilotNativeHandlers
  ready: boolean
  busy: boolean
}) {
  const [writingSpecId, setWritingSpecId] = React.useState(status?.writingSpecId ?? '')
  const [humanizerEnabled, setHumanizerEnabled] = React.useState(Boolean(status?.humanizerEnabled))
  const [revisionNote, setRevisionNote] = React.useState(status?.humanizerRevisionNote ?? '')
  const [failurePolicy, setFailurePolicy] = React.useState<PlotPilotHumanizerFailurePolicy>(
    normalizeFailurePolicy(status?.humanizerPolicy),
  )
  const [temperature, setTemperature] = React.useState(String(status?.humanizerTemperature ?? 0.65))
  const [maxTokens, setMaxTokens] = React.useState(status?.humanizerMaxTokens == null ? '' : String(status.humanizerMaxTokens))

  React.useEffect(() => {
    setWritingSpecId(status?.writingSpecId ?? '')
    setHumanizerEnabled(Boolean(status?.humanizerEnabled))
    setRevisionNote(status?.humanizerRevisionNote ?? '')
    setFailurePolicy(normalizeFailurePolicy(status?.humanizerPolicy))
    setTemperature(String(status?.humanizerTemperature ?? 0.65))
    setMaxTokens(status?.humanizerMaxTokens == null ? '' : String(status.humanizerMaxTokens))
  }, [
    novel?.id,
    status?.contextKey,
    status?.humanizerEnabled,
    status?.humanizerMaxTokens,
    status?.humanizerPolicy,
    status?.humanizerRevisionNote,
    status?.humanizerTemperature,
    status?.writingSpecId,
  ])

  if (!novel) {
    return (
      <div className="border-b border-white/[0.07] px-3 py-3">
        <SectionTitle icon={SlidersHorizontal} title="项目策略" detail="no novel" />
        <div className="mt-3 rounded-[8px] border border-dashed border-white/[0.1] bg-white/[0.02] p-4 text-center text-xs leading-5 text-white/38">
          选择书目后绑定 WritingSpec 和 Humanizer。
        </div>
      </div>
    )
  }

  const parsedTemperature = Number(temperature)
  const parsedMaxTokens = maxTokens.trim() ? Number(maxTokens) : null
  const canSaveWritingSpec = Boolean(ready && !busy && handlers?.onBindWritingSpec)
  const canSaveHumanizer = Boolean(
    ready
    && !busy
    && handlers?.onUpdateHumanizer
    && Number.isFinite(parsedTemperature)
    && parsedTemperature >= 0
    && parsedTemperature <= 2
    && (parsedMaxTokens === null || (Number.isInteger(parsedMaxTokens) && parsedMaxTokens > 0)),
  )

  const applyHumanizer = () => {
    if (!canSaveHumanizer) return
    handlers?.onUpdateHumanizer?.(novel.id, {
      enabled: humanizerEnabled,
      revisionNote,
      failurePolicy,
      temperature: parsedTemperature,
      maxTokens: parsedMaxTokens,
    })
  }

  return (
    <div className="border-b border-white/[0.07] px-3 py-3">
      <SectionTitle icon={SlidersHorizontal} title="项目策略" detail={status?.contextKey ?? novel.id} />
      <div className="mt-3 space-y-3">
        <div className="rounded-[8px] border border-white/[0.08] bg-white/[0.035] p-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-white/44" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-white/78">WritingSpec</div>
              <div className="mt-0.5 truncate font-mono text-[10px] text-white/34">
                {status?.writingSpecTitle || status?.writingSpecVersion || '未绑定'}
              </div>
            </div>
          </div>
          <div className="mt-3 flex gap-1.5">
            <Input
              value={writingSpecId}
              onChange={(event) => setWritingSpecId(event.currentTarget.value)}
              disabled={!ready || busy}
              placeholder="writing_spec_id"
              className="h-7 border-white/[0.08] bg-black/20 px-2 font-mono text-[11px] text-white/70 placeholder:text-white/24"
            />
            <SmallAction
              onClick={() => handlers?.onBindWritingSpec?.(novel.id, writingSpecId.trim())}
              disabled={!canSaveWritingSpec}
            >
              绑定
            </SmallAction>
          </div>
          <SmallAction
            className="mt-2"
            onClick={() => handlers?.onClearWritingSpec?.(novel.id)}
            disabled={!ready || busy || !status?.writingSpecId || !handlers?.onClearWritingSpec}
          >
            清除 WritingSpec
          </SmallAction>
        </div>

        <div className="rounded-[8px] border border-white/[0.08] bg-white/[0.035] p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white/78">Humanizer</div>
              <div className="mt-0.5 font-mono text-[10px] text-white/34">{failurePolicy}</div>
            </div>
            <Switch
              checked={humanizerEnabled}
              onCheckedChange={setHumanizerEnabled}
              disabled={!ready || busy}
              aria-label="Humanizer"
              className="data-[state=checked]:bg-success"
            />
          </div>
          <textarea
            value={revisionNote}
            onChange={(event) => setRevisionNote(event.currentTarget.value)}
            disabled={!ready || busy}
            placeholder="Humanizer 策略说明"
            className="mt-3 min-h-[64px] w-full resize-none rounded-[7px] border border-white/[0.08] bg-black/20 px-2 py-2 text-xs leading-5 text-white/68 outline-none placeholder:text-white/24 focus:border-white/20"
          />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/30">Failure</span>
              <select
                value={failurePolicy}
                onChange={(event) => setFailurePolicy(normalizeFailurePolicy(event.currentTarget.value))}
                disabled={!ready || busy}
                className="mt-1 h-7 w-full rounded-[6px] border border-white/[0.08] bg-[#08090d] px-2 text-[11px] text-white/70 outline-none focus:border-white/20"
              >
                <option value="fallback_original">fallback</option>
                <option value="fail">fail</option>
              </select>
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/30">Temp</span>
              <Input
                type="number"
                min={0}
                max={2}
                step={0.05}
                value={temperature}
                onChange={(event) => setTemperature(event.currentTarget.value)}
                disabled={!ready || busy}
                className="mt-1 h-7 border-white/[0.08] bg-black/20 px-2 text-[11px] text-white/70"
              />
            </label>
          </div>
          <label className="mt-2 block">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/30">Max tokens</span>
            <Input
              type="number"
              min={1}
              step={1}
              value={maxTokens}
              onChange={(event) => setMaxTokens(event.currentTarget.value)}
              disabled={!ready || busy}
              placeholder="auto"
              className="mt-1 h-7 border-white/[0.08] bg-black/20 px-2 text-[11px] text-white/70 placeholder:text-white/24"
            />
          </label>
          <SmallAction className="mt-3" onClick={applyHumanizer} disabled={!canSaveHumanizer}>
            保存 Humanizer
          </SmallAction>
        </div>

        {failure ? <WritingSpecFailurePanel failure={failure} compact /> : null}
      </div>
    </div>
  )
}

function WritingSpecFailurePanel({
  failure,
  compact,
}: {
  failure: PlotPilotWritingSpecFailureView
  compact?: boolean
}) {
  return (
    <div className="rounded-[8px] border border-destructive/20 bg-destructive/10 p-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-white">WritingSpec 未通过</div>
          <div className="mt-1 text-xs leading-5 text-white/58">{failure.message}</div>
          <div className="mt-2 flex flex-wrap gap-1.5 font-mono text-[10px] text-white/38">
            <span>chapter {failure.chapterNumber}</span>
            <span>{failure.findingCount} findings</span>
            {failure.writingSpecId ? <span>{failure.writingSpecId}</span> : null}
          </div>
        </div>
      </div>
      {failure.report ? (
        <pre
          className={cn(
            'mt-3 overflow-auto rounded-[6px] border border-white/[0.08] bg-black/30 p-2 font-mono text-[10px] leading-4 text-white/52',
            compact ? 'max-h-36' : 'max-h-52',
          )}
        >
          {JSON.stringify(failure.report, null, 2)}
        </pre>
      ) : null}
    </div>
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
      <div className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-white/72">{value || fallback}</div>
    </div>
  )
}

function FieldLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[7px] border border-white/[0.07] bg-black/20 px-3 py-2.5">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/30">{label}</div>
      <div className="mt-1 truncate text-sm font-semibold text-white/72">{value}</div>
    </div>
  )
}

function ToggleRow({
  label,
  checked,
  onCheckedChange,
  disabled = false,
}: {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <label className={cn(
      'flex items-center justify-between gap-3 rounded-[7px] border border-white/[0.07] bg-black/20 px-3 py-2',
      disabled ? 'opacity-55' : '',
    )}>
      <span className="text-sm font-semibold text-white/70">{label}</span>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="data-[state=checked]:bg-success"
      />
    </label>
  )
}

function JsonPreview({ value, className }: { value: unknown; className?: string }) {
  const text = typeof value === 'string'
    ? value
    : JSON.stringify(value, null, 2)

  return (
    <pre className={cn('overflow-auto rounded-[7px] border border-white/[0.07] bg-black/25 p-3 font-mono text-[10px] leading-5 text-white/52', className)}>
      {text || 'empty'}
    </pre>
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

function createDraftId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function formatDraftFieldValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value, null, 2)
}

function asUiRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function asUiRecordArray(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value)
    ? value.map(asUiRecord).filter((record) => Object.keys(record).length > 0)
    : []
}

function readUiString(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  }
  return ''
}

function pickRecord(record: Record<string, unknown>, keys: string[]) {
  return keys.reduce<Record<string, unknown>>((result, key) => {
    if (record[key] !== undefined) result[key] = record[key]
    return result
  }, {})
}

function resolvePromptPreview(session: Record<string, unknown>): string {
  const parts = resolvePromptParts(session)
  return [parts.system, parts.user].filter(Boolean).join('\n\n')
}

function resolvePromptParts(session: Record<string, unknown>): { system: string; user: string } {
  const promptSnapshot = asUiRecord(session.prompt_snapshot)
  const prompt = asUiRecord(promptSnapshot.prompt)
  const draftPrompt = asUiRecord(promptSnapshot.draft_prompt)
  const templatePrompt = asUiRecord(promptSnapshot.template_prompt)
  const system = String(prompt.system ?? draftPrompt.system ?? templatePrompt.system ?? '')
  const user = String(prompt.user ?? draftPrompt.user ?? templatePrompt.user ?? '')
  return { system, user }
}

function readInvocationSessionId(invocation: Record<string, unknown>, session: Record<string, unknown>): string {
  return readUiString(session, ['id', 'session_id'])
    || readUiString(invocation, ['sessionId', 'session_id', 'id'])
}

function formatBindingValue(binding: Record<string, unknown>): string {
  const keys = ['value', 'preview', 'text', 'resolved_value', 'default', 'path', 'target']
  for (const key of keys) {
    const value = binding[key]
    if (value === null || value === undefined) continue
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    if (typeof value === 'object') return JSON.stringify(value)
  }
  return ''
}

function onboardingDraftFromNovel(novel: PlotPilotNovel | null): PlotPilotOnboardingDraft {
  return {
    title: novel?.title ?? 'Drama 长篇项目',
    author: novel?.author ?? 'Drama',
    premise: novel?.subtitle ?? '',
    genre: novel?.lockedGenre ?? '',
    worldPreset: novel?.lockedWorldPreset ?? '',
    storyStructure: novel?.lockedStoryStructure ?? '',
    pacingControl: novel?.lockedPacingControl ?? '',
    writingStyle: novel?.lockedWritingStyle ?? '',
    specialRequirements: novel?.lockedSpecialRequirements ?? '',
    lengthTier: '',
    targetChapters: novel?.targetChapters ?? novel?.chapterCount ?? 30,
    targetWordsPerChapter: novel?.targetWordsPerChapter ?? 2500,
  }
}

function buildProductionTimelineEvents(input: {
  autopilotEvents: Array<Record<string, unknown>>
  autopilotStatusEvents: Array<Record<string, unknown>>
  autopilotChapterEvents: Array<Record<string, unknown>>
  hostedWriteEvents: Array<Record<string, unknown>>
}): ScriptStudioProductionTimelineEvent[] {
  const events: ScriptStudioProductionTimelineEvent[] = []
  input.hostedWriteEvents.forEach((event, index) => {
    events.push(toProductionTimelineEvent('hosted', event, index))
  })
  input.autopilotEvents.forEach((event, index) => {
    events.push(toProductionTimelineEvent('autopilot', event, index))
  })
  input.autopilotStatusEvents.forEach((event, index) => {
    events.push(toProductionTimelineEvent('status', event, index))
  })
  input.autopilotChapterEvents.forEach((event, index) => {
    events.push(toProductionTimelineEvent('chapter', event, index))
  })

  return events
    .sort((left, right) => right.sortKey.localeCompare(left.sortKey))
    .slice(0, 80)
}

function toProductionTimelineEvent(
  source: string,
  event: Record<string, unknown>,
  index: number,
): ScriptStudioProductionTimelineEvent {
  const type = readUiString(event, ['type']) || 'event'
  const metadata = asUiRecord(event.metadata)
  const chapter = readUiString(event, ['chapter_number', 'chapter']) || readUiString(metadata, ['chapter_number', 'chapter'])
  const message = readUiString(event, ['message', 'detail'])
    || readUiString(metadata, ['message'])
    || (chapter ? `chapter ${chapter}` : type)
  const timestamp = readUiString(event, ['timestamp', 'updatedAt', 'created_at'])
    || new Date().toISOString()
  const tone: ScriptStudioProductionTimelineEvent['tone'] =
    type === 'error' || type === 'beat_error'
      ? 'error'
      : type === 'approval_required' || type === 'paused_for_review'
        ? 'warning'
        : type === 'saved' || type === 'session_done' || type === 'autopilot_complete'
          ? 'success'
          : 'info'

  return {
    id: `${source}:${type}:${String(event.id ?? event.seq ?? index)}:${timestamp}`,
    source,
    type,
    message,
    timestamp: formatTimelineTimestamp(timestamp),
    sortKey: timestamp,
    tone,
  }
}

function formatTimelineTimestamp(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.slice(0, 16)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function extractMemoryEntities(triples: Array<Record<string, unknown>>): Array<{ id: string; label: string; count: number }> {
  const counts = new Map<string, { label: string; count: number }>()
  for (const triple of triples) {
    const candidates = [
      readUiString(triple, ['subject', 'subject_id', 'source', 'head']),
      readUiString(triple, ['object', 'object_id', 'target', 'tail']),
    ]
    for (const candidate of candidates) {
      const label = candidate.trim()
      if (!label) continue
      const id = label.toLowerCase()
      const current = counts.get(id)
      counts.set(id, {
        label,
        count: (current?.count ?? 0) + 1,
      })
    }
  }
  return Array.from(counts.entries())
    .map(([id, value]) => ({ id, ...value }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
}

function countDraftText(value: string | undefined) {
  const text = value?.trim() ?? ''
  return text.length
}

function sanitizeMarkdownFileName(value: string | undefined, fallback: string) {
  const normalized = value
    ?.trim()
    .replace(/[\\/:*?"<>|#\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return (normalized || fallback).slice(0, 96)
}

function buildLocalChapterMarkdown(args: {
  novel: PlotPilotNovel | null
  chapterNumber: number
  chapterTitle?: string
  content: string
}) {
  const novelTitle = args.novel?.title?.trim() || '未命名项目'
  const chapterTitle = args.chapterTitle?.trim() || `第 ${args.chapterNumber} 章`
  const body = args.content.trimEnd()
  const lines = [
    '---',
    `novel: ${novelTitle}`,
    `chapter: ${args.chapterNumber}`,
    `title: ${chapterTitle}`,
    `exported_at: ${new Date().toISOString()}`,
    '---',
    '',
    `# ${chapterTitle}`,
    '',
    body || '> 当前章节暂无正文。',
    '',
  ]
  return lines.join('\n')
}

async function saveMarkdownToLocalFile(fileName: string, markdown: string) {
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
  const picker = (window as BrowserSaveFilePickerWindow).showSaveFilePicker

  if (picker) {
    const handle = await picker({
      suggestedName: fileName,
      types: [
        {
          description: 'Markdown 文稿',
          accept: { 'text/markdown': ['.md'] },
        },
      ],
    })
    const writable = await handle.createWritable()
    await writable.write(blob)
    await writable.close()
    return
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
}

function normalizeProgressPercent(value: number | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0
  return clampProgress(value > 0 && value <= 1 ? value * 100 : value)
}

function clampProgress(value: number | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0
  return Math.min(100, Math.max(0, value))
}

function normalizeFailurePolicy(value: string | undefined): PlotPilotHumanizerFailurePolicy {
  return value === 'fail' ? 'fail' : 'fallback_original'
}
