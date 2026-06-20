import * as React from 'react'

import {
  createPlotPilotClient,
  extractPlotPilotWritingSpecFailure,
  PlotPilotHttpError,
  type PlotPilotClient,
} from '@drama/plm'

import {
  PlotPilotNativePage,
  type PlotPilotBibleEditorData,
  type PlotPilotGenerationJob,
  type PlotPilotChapterEditor,
  type PlotPilotChapterAnnotation,
  type PlotPilotChapterRevisionContext,
  type PlotPilotCodexStatus as PlotPilotUiCodexStatus,
  type PlotPilotHumanizerSettingsDraft,
  type PlotPilotIntegrationStatus,
  type PlotPilotNativeFeatureState,
  type PlotPilotOnboardingDraft,
  type PlotPilotParityCheck,
  type PlotPilotProductionEvidenceItem,
  type PlotPilotProductionEvidenceSnapshot,
  type PlotPilotProjectGuardStatus,
  type PlotPilotLogEntry as PlotPilotUiLogEntry,
  type PlotPilotNativeHandlers,
  type PlotPilotNovel,
  type PlotPilotReadinessStatus,
  type PlotPilotRuntimeStatus as PlotPilotUiRuntimeStatus,
  type ScriptStudioStorageCardDraft,
  type PlotPilotWritingSpecFailureView,
} from './PlotPilotNativePage'
import type {
  DramaDraft,
  DramaDraftUpsertInput,
  DramaGraphEventInput,
  DramaGraph,
} from '@drama/core'
import type {
  BibleDTO,
  BulkUpdateBibleRequest,
  ChapterDTO,
  NovelDTO,
  PlmLogEntry,
  PlotPilotRuntimeStatus,
  PlotPilotCodexStatusResponse,
  PlotPilotHumanizerSettingsResponse,
  PlotPilotAutopilotChapterStreamEvent,
  PlotPilotAutopilotStreamEvent,
  PlotPilotHostedWriteStreamEvent,
  PlotPilotPlotOutlineItem,
  PlotPilotSetupStreamEvent,
  PlotPilotWritingSpecBindingResponse,
  PlotPilotWritingSpecFailure,
} from '@drama/plm'
import type {
  DramaGraphLoadResult,
  DramaGraphMutationResult,
  DramaProjectFileListRequest,
  DramaProjectFileListResult,
  DramaProjectFileRecordRequest,
  DramaProjectFileRecordResult,
} from '@drama/graph/ipc-contract'

const EMPTY_RUNTIME_STATUS: PlotPilotRuntimeStatus = {
  state: 'stopped',
  healthy: false,
  port: null,
  pid: null,
  baseUrl: null,
  apiBaseUrl: null,
  owned: false,
  adopted: false,
  projectRoot: '',
  dataDir: '',
}

const STATUS_REQUEST_TIMEOUT_MS = 2_000
const DRAMA_PLM_OPEN_REQUEST_KEY = 'drama.plm.openRequest.v1'
const DRAMA_CODEX_PROFILE_ID = 'drama-codex-chatgpt'
const DRAMA_PRODUCTION_FIXTURE_ID = 'drama-production-parity-mac'
const DRAMA_PRODUCTION_FIXTURE_PROMPT_KEY = 'drama.production.parity.chapter-draft'
const DRAMA_PRODUCTION_FIXTURE_HOSTED_SESSION_ID = 'drama-production-fixture-hosted-write'
const DRAMA_PRODUCTION_FIXTURE_CHAPTER_NUMBER = 1

const DRAMA_PRODUCTION_FIXTURE_CONTENT = `第1章 生产闭环验证

乔羽在海雾里停船，命令桨手收声。荒尤第一次看见云龙的影子从浪脊下翻过，鳞片像旧王朝留下的青铜密令。

这一章用于 Zen Drama PLM macOS production parity 验收：它必须能被真实项目加载、保存、回写，并在 Memory Graph 与 Prompt Registry 面板留下可追踪证据。`

interface DramaPlmOpenRequest {
  schema: typeof DRAMA_PLM_OPEN_REQUEST_KEY
  source?: string
  graphId?: string
  graphNodeId?: string
  novelId?: string
  chapterId?: string
  chapterNumber?: number
  title?: string
  createdAt?: number
}

interface PlmProjectFileRecordInput {
  novelId: string
  type: string
  title?: string
  summary?: Record<string, unknown>
  payload?: unknown
  markdown?: string
}

interface PlotPilotResolvedRevisionContext {
  annotations: PlotPilotChapterAnnotation[]
  markdown: string
}

export interface PlotPilotNativeApi {
  getPlotPilotRuntimeLogs(): Promise<PlmLogEntry[]>
  getPlotPilotRuntimeStatus(): Promise<PlotPilotRuntimeStatus>
  startPlotPilotRuntime(): Promise<PlotPilotRuntimeStatus>
  restartPlotPilotRuntime(): Promise<PlotPilotRuntimeStatus>
  openUrl(url: string): Promise<void> | void
  recordDramaProjectFile?: (request: DramaProjectFileRecordRequest) => Promise<DramaProjectFileRecordResult>
  listDramaProjectFiles?: (request: DramaProjectFileListRequest) => Promise<DramaProjectFileListResult>
  loadDramaGraph(): Promise<DramaGraphLoadResult>
  upsertDramaGraphDraft(request: {
    graphId: string
    input: DramaDraftUpsertInput
    event?: DramaGraphEventInput
  }): Promise<DramaGraphMutationResult>
  recordDramaGraphEvent?: (request: {
    graphId?: string
    event: DramaGraphEventInput
  }) => Promise<DramaGraphMutationResult>
  loadStoryletBridgeSnapshot(): Promise<any>
  writeStoryletChapterFromPlotPilot(request: { chapter: ChapterDTO }): Promise<any>
}

export interface PlotPilotNativeContainerProps {
  api: PlotPilotNativeApi
  createClient?: typeof createPlotPilotClient
  integrationStatus?: PlotPilotIntegrationStatus
  onIntegrationStatusChange?: (status: PlotPilotIntegrationStatus | undefined) => void
  productionFixture?: boolean
}

function isRuntimeReady(status: PlotPilotRuntimeStatus): boolean {
  return status.healthy === true
}

function errorMessage(error: unknown): string {
  const writingSpecFailure = extractPlotPilotWritingSpecFailure(error)
  if (writingSpecFailure) {
    const findings = Array.isArray(writingSpecFailure.report?.findings)
      ? writingSpecFailure.report.findings.length
      : Array.isArray(writingSpecFailure.report?.violations)
        ? writingSpecFailure.report.violations.length
        : 0
    const suffix = findings > 0 ? `，${findings} 条失败项` : ''
    return `WritingSpec 未通过，章节未保存${suffix}。`
  }
  return error instanceof Error ? error.message : String(error)
}

function reportPlotPilotError(error: unknown) {
  window.alert(errorMessage(error))
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function recordArray(value: unknown, keys: string[] = []): Array<Record<string, unknown>> {
  if (Array.isArray(value)) {
    return value.filter((item): item is Record<string, unknown> => (
      item !== null && typeof item === 'object' && !Array.isArray(item)
    ))
  }
  const record = asRecord(value)
  for (const key of keys) {
    const nested = record[key]
    if (Array.isArray(nested)) return recordArray(nested)
  }
  return []
}

function novelRecordSummary(novel: NovelDTO): Record<string, unknown> {
  return {
    title: novel.title,
    stage: novel.stage,
    chapterCount: novel.chapters?.length ?? 0,
    targetChapters: novel.target_chapters,
    totalWordCount: novel.total_word_count,
    hasBible: novel.has_bible,
    hasOutline: novel.has_outline,
    autopilotStatus: novel.autopilot_status,
  }
}

function chapterRecordSummary(chapter: ChapterDTO): Record<string, unknown> {
  return {
    chapterId: chapter.id,
    chapterNumber: chapter.number,
    title: chapter.title,
    wordCount: chapter.word_count ?? countDraftText(chapter.content ?? ''),
    status: chapter.status,
  }
}

function bibleRecordSummary(bible: BibleDTO): Record<string, unknown> {
  return {
    bibleId: bible.id,
    characterCount: bible.characters.length,
    worldSettingCount: bible.world_settings.length,
    locationCount: bible.locations.length,
    timelineNoteCount: bible.timeline_notes.length,
    styleNoteCount: bible.style_notes.length,
  }
}

function parseDraftJsonField(value: unknown, fallback: unknown): unknown {
  if (typeof value !== 'string') return value ?? fallback
  const trimmed = value.trim()
  if (!trimmed) return fallback
  try {
    return JSON.parse(trimmed) as unknown
  } catch {
    return fallback
  }
}

function normalizeBibleRows(
  rows: Array<Record<string, unknown>>,
  jsonArrayKeys: string[] = [],
  jsonObjectKeys: string[] = [],
  numericKeys: string[] = [],
) {
  return rows
    .filter((row) => String(row.name ?? row.event ?? row.category ?? '').trim())
    .map((row) => {
      const next: Record<string, unknown> = { ...row }
      for (const key of jsonArrayKeys) {
        next[key] = parseDraftJsonField(next[key], [])
      }
      for (const key of jsonObjectKeys) {
        next[key] = parseDraftJsonField(next[key], {})
      }
      for (const key of numericKeys) {
        if (next[key] === '' || next[key] === undefined) {
          next[key] = null
          continue
        }
        const parsed = Number(next[key])
        next[key] = Number.isFinite(parsed) ? parsed : null
      }
      return next
    })
}

function toBulkUpdateBibleRequest(bible: PlotPilotBibleEditorData): BulkUpdateBibleRequest {
  return {
    characters: normalizeBibleRows(
      bible.characters,
      ['relationships', 'moral_taboos', 'active_wounds'],
      ['voice_profile'],
      ['reveal_chapter'],
    ) as unknown as BulkUpdateBibleRequest['characters'],
    world_settings: normalizeBibleRows(bible.world_settings) as unknown as BulkUpdateBibleRequest['world_settings'],
    locations: normalizeBibleRows(bible.locations) as unknown as BulkUpdateBibleRequest['locations'],
    timeline_notes: normalizeBibleRows(bible.timeline_notes) as unknown as BulkUpdateBibleRequest['timeline_notes'],
    style_notes: normalizeBibleRows(bible.style_notes) as unknown as BulkUpdateBibleRequest['style_notes'],
  }
}

function normalizeNovelId(title: string): string {
  return title.trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, '-')
    .replace(/^-+|-+$/g, '') || `novel-${Date.now()}`
}

function createStorageCardId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function storageCardTitle(card: ScriptStudioStorageCardDraft): string {
  return card.title.trim() || (card.kind === 'character' ? '未命名人物' : '未命名提示词')
}

function storageCardBody(card: ScriptStudioStorageCardDraft): string {
  return card.body.trim()
}

function characterRowFromStorageCard(
  card: ScriptStudioStorageCardDraft,
  existing?: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...existing,
    id: String(existing?.id ?? card.sourceId ?? card.id ?? createStorageCardId('character')),
    name: storageCardTitle(card),
    role: card.subtitle.trim() || String(existing?.role ?? '角色设定'),
    description: storageCardBody(card) || String(existing?.description ?? ''),
    relationships: Array.isArray(existing?.relationships) ? existing.relationships : [],
    public_profile: storageCardBody(card) || String(existing?.public_profile ?? ''),
    background: card.meta?.trim() || String(existing?.background ?? ''),
  }
}

function promptRecordFromStorageCard(card: ScriptStudioStorageCardDraft): Record<string, unknown> {
  return {
    id: String(card.sourceId ?? card.id ?? createStorageCardId('prompt')),
    name: storageCardTitle(card),
    scope: card.subtitle.trim() || 'drama-script-studio',
    template: storageCardBody(card),
    version: card.meta?.trim() || 'draft',
    source: 'drama-script-studio',
    updated_at: new Date().toISOString(),
  }
}

function promptRecordKey(prompt: Record<string, unknown>): string {
  return String(prompt.id ?? prompt.key ?? prompt.name ?? prompt.title ?? '').trim()
}

function promptRecordMatchesKey(prompt: Record<string, unknown>, expectedKey: string): boolean {
  return [
    prompt.node_key,
    prompt.nodeKey,
    prompt.key,
    prompt.id,
    prompt.name,
    prompt.title,
  ].some((value) => String(value ?? '').trim() === expectedKey)
}

function promptNodeKeyFromStorageCard(card: ScriptStudioStorageCardDraft, prompt: Record<string, unknown>): string {
  const existing = String(card.sourceId ?? prompt.node_key ?? prompt.key ?? prompt.id ?? '').trim()
  if (existing && !existing.startsWith('prompt-')) return existing
  return `drama-${normalizeNovelId(storageCardTitle(card))}`
}

function uniqueStringList(values: Array<string | undefined | null>): string[] {
  return values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .filter((value, index, list) => list.indexOf(value) === index)
}

function chapterAnnotationsKey(novelId: string, chapterNumber: number): string {
  return `${novelId}:${chapterNumber}`
}

function normalizeChapterAnnotations(value: unknown): PlotPilotChapterAnnotation[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item): PlotPilotChapterAnnotation | null => {
      const record = asRecord(item)
      const start = Number(record.start)
      const end = Number(record.end)
      const quote = String(record.quote ?? '').trim()
      const note = String(record.note ?? '').trim()
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || !quote || !note) return null
      const color = record.color === 'mint' || record.color === 'rose' || record.color === 'amber'
        ? record.color
        : 'amber'
      return {
        id: String(record.id ?? createStorageCardId('annotation')),
        start,
        end,
        quote,
        note,
        color,
        status: record.status === 'resolved' ? 'resolved' : 'open',
        createdAt: String(record.createdAt ?? new Date().toISOString()),
      }
    })
    .filter((annotation): annotation is PlotPilotChapterAnnotation => Boolean(annotation))
}

function markdownInline(value: string): string {
  return value.replace(/`/g, '\\`').replace(/\s+/g, ' ').trim()
}

function markdownBlockquote(value: string): string {
  return value
    .trim()
    .split(/\r?\n/)
    .map((line) => `> ${line}`)
    .join('\n')
}

function buildChapterAnnotationsMarkdown(args: {
  novelId: string
  chapterNumber: number
  chapterTitle?: string
  annotations: PlotPilotChapterAnnotation[]
  generatedAt?: string
}): string {
  const openAnnotations = args.annotations.filter((annotation) => annotation.status !== 'resolved')
  const lines = [
    `# Chapter ${args.chapterNumber} Revision Annotations`,
    '',
    `- novel_id: \`${markdownInline(args.novelId)}\``,
    `- chapter_number: \`${args.chapterNumber}\``,
    args.chapterTitle ? `- chapter_title: ${markdownInline(args.chapterTitle)}` : '',
    `- generated_at: \`${args.generatedAt ?? new Date().toISOString()}\``,
    `- revision_mode: \`annotation_revision\``,
    '',
    '## Model Instructions',
    '',
    'Use these annotations as mandatory revision guidance for the next pass. Keep the existing story continuity unless an annotation explicitly asks for a change. Address each open annotation in the revised chapter and avoid appending this annotation list to the manuscript.',
    '',
    '## Open Annotations',
    '',
  ].filter(Boolean)

  if (openAnnotations.length === 0) {
    lines.push('- No open annotations.')
    return lines.join('\n')
  }

  openAnnotations.forEach((annotation, index) => {
    lines.push(
      `### A${index + 1}`,
      '',
      `- id: \`${markdownInline(annotation.id)}\``,
      `- status: \`${annotation.status ?? 'open'}\``,
      `- range: \`${annotation.start}-${annotation.end}\``,
      `- quote: \`${markdownInline(annotation.quote)}\``,
      '',
      '**Comment**',
      '',
      markdownBlockquote(annotation.note),
      '',
    )
  })

  return lines.join('\n').trimEnd()
}

function buildRevisionPromptMarkdown(context: PlotPilotResolvedRevisionContext): string {
  if (context.annotations.length === 0) return ''
  return [
    '## Annotation Revision Context',
    '',
    'The chapter is now in modification mode. The annotations below are user-authored revision requirements and must be applied in the next model pass.',
    '',
    context.markdown,
  ].join('\n')
}

function toNovelCreateRequest(draft: PlotPilotOnboardingDraft) {
  return {
    novel_id: normalizeNovelId(draft.title),
    title: draft.title.trim() || 'Drama 长篇项目',
    author: draft.author.trim() || 'Drama',
    target_chapters: Math.max(1, Math.floor(draft.targetChapters || 30)),
    premise: draft.premise,
    genre: draft.genre,
    world_preset: draft.worldPreset,
    story_structure: draft.storyStructure,
    pacing_control: draft.pacingControl,
    writing_style: draft.writingStyle,
    special_requirements: draft.specialRequirements,
    length_tier: draft.lengthTier || null,
    target_words_per_chapter: Math.max(300, Math.floor(draft.targetWordsPerChapter || 2500)),
  }
}

function toNovelUpdateRequest(draft: PlotPilotOnboardingDraft) {
  return {
    title: draft.title.trim() || 'Drama 长篇项目',
    author: draft.author.trim() || 'Drama',
    target_chapters: Math.max(1, Math.floor(draft.targetChapters || 30)),
    premise: draft.premise,
    target_words_per_chapter: Math.max(300, Math.floor(draft.targetWordsPerChapter || 2500)),
    generation_prefs: {
      drama_onboarding: {
        genre: draft.genre,
        world_preset: draft.worldPreset,
        story_structure: draft.storyStructure,
        pacing_control: draft.pacingControl,
        writing_style: draft.writingStyle,
        special_requirements: draft.specialRequirements,
        length_tier: draft.lengthTier || null,
      },
    },
  }
}

function toUiCodexStatus(status: PlotPilotCodexStatusResponse | null): PlotPilotUiCodexStatus | null {
  if (!status) return null
  return {
    available: status.available,
    authenticated: status.authenticated,
    requiresOpenAiAuth: status.requires_openai_auth,
    email: status.email,
    planType: status.plan_type,
    error: status.error,
  }
}

function isCodexProfile(profile: Record<string, unknown>): boolean {
  return profile.id === DRAMA_CODEX_PROFILE_ID ||
    profile.preset_key === 'codex-app-server-chatgpt' ||
    profile.protocol === 'codex'
}

async function ensureCodexLlmProfile(client: PlotPilotClient): Promise<void> {
  const panel = await client.getLlmControl()
  const config = panel.config ?? {}
  const currentProfiles = Array.isArray(config.profiles) ? config.profiles : []
  const existing = currentProfiles.find((profile) => isCodexProfile(profile))
  const codexProfile = {
    id: String(existing?.id ?? DRAMA_CODEX_PROFILE_ID),
    name: String(existing?.name ?? 'Drama Codex OAuth'),
    preset_key: 'codex-app-server-chatgpt',
    protocol: 'codex',
    base_url: '',
    api_key: '',
    model: String(existing?.model ?? 'codex-default') || 'codex-default',
    temperature: typeof existing?.temperature === 'number' ? existing.temperature : 0.7,
    max_tokens: typeof existing?.max_tokens === 'number' ? existing.max_tokens : 8192,
    timeout_seconds: typeof existing?.timeout_seconds === 'number' ? existing.timeout_seconds : 300,
    extra_headers: typeof existing?.extra_headers === 'object' && existing.extra_headers ? existing.extra_headers : {},
    extra_query: typeof existing?.extra_query === 'object' && existing.extra_query ? existing.extra_query : {},
    extra_body: typeof existing?.extra_body === 'object' && existing.extra_body ? existing.extra_body : {},
    notes: String(existing?.notes ?? 'Managed by Drama PLM.'),
    use_legacy_chat_completions: Boolean(existing?.use_legacy_chat_completions ?? false),
  }

  const nextProfiles = [
    codexProfile,
    ...currentProfiles.filter((profile) => profile.id !== codexProfile.id),
  ]
  if (
    config.active_profile_id === codexProfile.id &&
    existing?.protocol === 'codex' &&
    existing?.model
  ) {
    return
  }

  await client.updateLlmControl({
    ...config,
    active_profile_id: codexProfile.id,
    profiles: nextProfiles,
  })
}

function activeWritingSpecId(writingSpec: PlotPilotWritingSpecBindingResponse | null): string | undefined {
  const id = writingSpec?.writing_spec_id?.trim()
  return id || undefined
}

function toProjectGuardStatus(
  writingSpec: PlotPilotWritingSpecBindingResponse | null,
  humanizer: PlotPilotHumanizerSettingsResponse | null,
): PlotPilotProjectGuardStatus {
  return {
    writingSpecId: writingSpec?.writing_spec_id || undefined,
    writingSpecTitle: writingSpec?.spec_title || undefined,
    writingSpecVersion: writingSpec?.spec_version || undefined,
    contextKey: writingSpec?.context_key || humanizer?.context_key || undefined,
    humanizerEnabled: humanizer?.enabled ?? false,
    humanizerPolicy: humanizer?.failure_policy,
    humanizerRevisionNote: humanizer?.revision_note,
    humanizerTemperature: humanizer?.temperature,
    humanizerMaxTokens: humanizer?.max_tokens,
  }
}

function shouldFallbackToLegacyChapterStream(error: unknown): boolean {
  return error instanceof PlotPilotHttpError && (error.status === 404 || error.status === 405)
}

function consumeDramaPlmOpenRequest(): DramaPlmOpenRequest | null {
  let raw: string | null = null
  try {
    raw = window.sessionStorage.getItem(DRAMA_PLM_OPEN_REQUEST_KEY)
  } catch {
    return null
  }
  if (!raw) return null
  try {
    window.sessionStorage.removeItem(DRAMA_PLM_OPEN_REQUEST_KEY)
  } catch {
    // Some chrome-resource hosts expose a sessionStorage object but reject writes.
  }
  try {
    const value = JSON.parse(raw) as Partial<DramaPlmOpenRequest>
    if (value.schema !== DRAMA_PLM_OPEN_REQUEST_KEY) return null
    const chapterNumber = Number(value.chapterNumber)
    if (!Number.isFinite(chapterNumber) || chapterNumber <= 0) return null
    return {
      schema: DRAMA_PLM_OPEN_REQUEST_KEY,
      source: value.source,
      graphId: value.graphId,
      graphNodeId: value.graphNodeId,
      novelId: value.novelId,
      chapterId: value.chapterId,
      chapterNumber,
      title: value.title,
      createdAt: value.createdAt,
    }
  } catch {
    return null
  }
}

function toUiRuntimeStatus(
  status: PlotPilotRuntimeStatus,
  activeJob: PlotPilotGenerationJob | null,
): PlotPilotUiRuntimeStatus {
  if (status.state === 'starting' || status.state === 'stopping') {
    return {
      state: 'starting',
      message: status.state === 'stopping' ? '正在停止 PlotPilot runtime。' : '正在启动 PlotPilot runtime。',
      endpoint: status.baseUrl ?? status.apiBaseUrl ?? undefined,
      updatedAt: status.startedAt,
      activeJob,
    }
  }
  if (isRuntimeReady(status)) {
    return {
      state: 'ready',
      message: status.adopted ? '已复用现有 PlotPilot runtime。' : 'PlotPilot runtime 已由 Drama 托管。',
      endpoint: status.baseUrl ?? status.apiBaseUrl ?? undefined,
      updatedAt: status.startedAt,
      activeJob,
    }
  }
  if (status.state === 'error') {
    return {
      state: 'error',
      message: status.error ?? status.lastError ?? 'PlotPilot runtime 启动失败。',
      endpoint: status.baseUrl ?? undefined,
      updatedAt: status.startedAt,
      activeJob,
    }
  }
  return {
    state: 'offline',
    message: 'PlotPilot runtime 尚未启动。',
    endpoint: status.baseUrl ?? status.apiBaseUrl ?? status.url ?? undefined,
    activeJob,
  }
}

function mergeReadinessTiers(
  base: PlotPilotReadinessStatus[],
  next: PlotPilotReadinessStatus[],
): PlotPilotReadinessStatus[] {
  const nextTierIds = new Set(next.map((item) => item.tier))
  return [
    ...base.filter((item) => !nextTierIds.has(item.tier)),
    ...next,
  ]
}

function workspacePathHints(status: PlotPilotRuntimeStatus): string[] {
  return [
    status.projectRoot,
    status.dataDir,
  ].filter((value): value is string => Boolean(value?.trim()))
}

function metricNumber(record: Record<string, unknown>, keys: string[]): number {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return 0
}

function hasNativePromptWrite(featureState: PlotPilotNativeFeatureState): boolean {
  const promptStats = asRecord(featureState.promptStats)
  if (metricNumber(promptStats, ['dramaNativePromptWrites']) > 0) return true
  return (featureState.prompts ?? []).some((prompt) => {
    const record = asRecord(prompt)
    return Boolean(record.nativePromptWrite || record.nativeRegistry === 'plotpilot-prompt-plaza')
  })
}

function promptRecordsFromResponse(value: unknown): Array<Record<string, unknown>> {
  const direct = recordArray(value, ['prompts', 'nodes', 'records'])
  if (direct.length > 0) return direct
  return recordArray(asRecord(value).data, ['prompts', 'nodes', 'records'])
}

async function readPromptRegistryEvidence(
  activeClient: PlotPilotClient,
  nodeKey: string,
): Promise<{ ok: boolean; count: number; source?: string; error?: string }> {
  try {
    const response = await activeClient.listPrompts()
    const prompts = promptRecordsFromResponse(response)
    const match = prompts.find((prompt) => promptRecordMatchesKey(prompt, nodeKey))
    const matchRecord = asRecord(match)
    const source = String(matchRecord.source || matchRecord.nativeRegistry || 'plotpilot-prompt-plaza')
    return {
      ok: Boolean(match),
      count: prompts.length,
      ...(match ? { source } : {}),
    }
  } catch (error) {
    return {
      ok: false,
      count: 0,
      error: errorMessage(error),
    }
  }
}

function buildProductionFixtureMemoryDiff(chapter: ChapterDTO): Array<Record<string, unknown>> {
  const base = {
    source_type: 'chapter_inferred',
    source: 'drama-production-fixture',
    novel_fixture_id: DRAMA_PRODUCTION_FIXTURE_ID,
    chapter_id: chapter.id,
    chapter_number: chapter.number,
    chapter_title: chapter.title,
    confidence: 1,
  }
  return [
    {
      ...base,
      id: `${chapter.id}:qiao-yu-huang-you-command`,
      subject: '乔羽',
      predicate: 'commands',
      object: '桨手收声',
    },
    {
      ...base,
      id: `${chapter.id}:huang-you-cloud-dragon-witness`,
      subject: '荒尤',
      predicate: 'witnesses',
      object: '云龙的影子',
    },
    {
      ...base,
      id: `${chapter.id}:cloud-dragon-bronze-secret`,
      subject: '云龙',
      predicate: 'reveals',
      object: '青铜密令',
    },
  ]
}

function productionEventTypes(events: Array<Record<string, unknown>>): Set<string> {
  return new Set(events.map((event) => String(event.type ?? event.event ?? '').trim()).filter(Boolean))
}

function hasAnyEventType(types: Set<string>, aliases: string[]): boolean {
  return aliases.some((alias) => types.has(alias))
}

function hostedWriteLifecycleReady(summary: Record<string, unknown>, events: Array<Record<string, unknown>>): boolean {
  const types = productionEventTypes(events)
  return Number(summary.savedCount ?? 0) > 0
    && hasAnyEventType(types, ['session'])
    && hasAnyEventType(types, ['chapter_start'])
    && hasAnyEventType(types, ['saved'])
    && hasAnyEventType(types, ['session_done'])
    && Boolean(summary.recoveryAction || summary.recoveryState)
}

function autopilotLifecycleReady(args: {
  status: Record<string, unknown>
  breaker: Record<string, unknown>
  events: Array<Record<string, unknown>>
  statusEvents: Array<Record<string, unknown>>
  chapterEvents: Array<Record<string, unknown>>
}): boolean {
  const types = productionEventTypes([
    ...args.events,
    ...args.statusEvents,
    ...args.chapterEvents,
  ])
  return hasAnyEventType(types, ['autopilot_started', 'started'])
    && hasAnyEventType(types, ['autopilot_stopped', 'stopped'])
    && hasAnyEventType(types, ['autopilot_resumed', 'resumed'])
    && hasAnyEventType(types, ['breaker_reset', 'breakerReset'])
    && String(args.breaker.status ?? '') === 'closed'
    && Object.keys(args.status).length > 0
}

function buildProductionFixtureHostedWriteEvidence(chapter: ChapterDTO): {
  summary: Record<string, unknown>
  events: PlotPilotHostedWriteStreamEvent[]
} {
  const timestamp = new Date().toISOString()
  const wordCount = chapter.word_count ?? countDraftText(chapter.content ?? '')
  const range = {
    fromChapter: chapter.number,
    toChapter: chapter.number,
    autoSave: true,
    autoOutline: false,
  }
  const events: PlotPilotHostedWriteStreamEvent[] = [
    {
      type: 'session',
      session_id: DRAMA_PRODUCTION_FIXTURE_HOSTED_SESSION_ID,
      from_chapter: chapter.number,
      to_chapter: chapter.number,
      auto_save: true,
      auto_outline: false,
      timestamp,
      message: 'Fixture-safe Hosted Write session started.',
    },
    {
      type: 'chapter_start',
      session_id: DRAMA_PRODUCTION_FIXTURE_HOSTED_SESSION_ID,
      chapter_number: chapter.number,
      title: chapter.title,
      timestamp,
      message: 'Fixture chapter write started.',
    },
    {
      type: 'chunk',
      session_id: DRAMA_PRODUCTION_FIXTURE_HOSTED_SESSION_ID,
      chapter_number: chapter.number,
      text: chapter.content ?? '',
      stats: {
        chars: countDraftText(chapter.content ?? ''),
        chunks: 1,
        estimated_tokens: Math.ceil(countDraftText(chapter.content ?? '') / 4),
      },
      timestamp,
      message: 'Fixture chapter content streamed.',
    },
    {
      type: 'saved',
      session_id: DRAMA_PRODUCTION_FIXTURE_HOSTED_SESSION_ID,
      chapter_number: chapter.number,
      chapter_id: chapter.id,
      word_count: wordCount,
      timestamp,
      message: 'Fixture chapter saved through Hosted Write evidence.',
    },
    {
      type: 'session_done',
      session_id: DRAMA_PRODUCTION_FIXTURE_HOSTED_SESSION_ID,
      chapters: [chapter.number],
      saved: 1,
      timestamp,
      message: 'Fixture-safe Hosted Write session completed.',
    },
  ]

  return {
    summary: {
      ...range,
      sessionId: DRAMA_PRODUCTION_FIXTURE_HOSTED_SESSION_ID,
      savedChapters: [chapter.number],
      savedCount: 1,
      totalChapters: 1,
      chunkCount: 1,
      charCount: countDraftText(chapter.content ?? ''),
      lastType: 'session_done',
      recoveryAction: 'fixture-safe-retry-visible',
      recoveryState: 'ready',
      fixtureSafe: true,
      updatedAt: timestamp,
    },
    events,
  }
}

function buildProductionFixtureAutopilotEvidence(chapter: ChapterDTO): {
  status: Record<string, unknown>
  breaker: Record<string, unknown>
  events: PlotPilotAutopilotStreamEvent[]
  statusEvents: PlotPilotAutopilotStreamEvent[]
  chapterEvents: PlotPilotAutopilotChapterStreamEvent[]
} {
  const timestamp = new Date().toISOString()
  const wordCount = chapter.word_count ?? countDraftText(chapter.content ?? '')
  return {
    status: {
      autopilot_status: 'stopped',
      status: 'stopped',
      current_stage: 'review_ready',
      current_chapter_number: chapter.number,
      target_chapters: 3,
      target_words_per_chapter: 900,
      completed_chapters: 1,
      progress_pct: 33,
      total_words: wordCount,
      needs_review: false,
      stage9Lifecycle: 'complete',
      updatedAt: timestamp,
    },
    breaker: {
      status: 'closed',
      error_count: 0,
      max_errors: 3,
      reset_at: timestamp,
      stage9BreakerReset: true,
    },
    events: [
      { type: 'autopilot_started', timestamp, message: 'Fixture-safe Autopilot start recorded.' },
      { type: 'paused_for_review', timestamp, message: 'Fixture-safe manual review point recorded.' },
      { type: 'autopilot_resumed', timestamp, message: 'Fixture-safe Autopilot resume recorded.' },
      { type: 'autopilot_stopped', timestamp, message: 'Fixture-safe Autopilot stop recorded.' },
      { type: 'breaker_reset', timestamp, message: 'Fixture-safe Autopilot breaker reset recorded.' },
    ],
    statusEvents: [
      { type: 'autopilot_started', autopilot_status: 'running', current_stage: 'writing', timestamp },
      { type: 'autopilot_resumed', autopilot_status: 'running', current_stage: 'review_resumed', timestamp },
      { type: 'autopilot_stopped', autopilot_status: 'stopped', current_stage: 'review_ready', timestamp },
      { type: 'breaker_reset', autopilot_status: 'stopped', current_stage: 'review_ready', timestamp },
    ],
    chapterEvents: [
      {
        type: 'chapter_content',
        timestamp,
        message: 'Fixture-safe chapter stream recorded.',
        metadata: {
          chapter_number: chapter.number,
          content: chapter.content ?? '',
          word_count: wordCount,
          beat_index: 1,
        },
      },
    ],
  }
}

function buildProductionEvidenceSnapshot(args: {
  runtimeReady: boolean
  productPath: boolean
  selectedNovel: NovelDTO | null
  chapterEditor: PlotPilotChapterEditor | null
  featureState: PlotPilotNativeFeatureState
}): PlotPilotProductionEvidenceSnapshot {
  const { runtimeReady, productPath, selectedNovel, chapterEditor, featureState } = args
  const productionFixture = asRecord(featureState.productionFixture)
  const pathHints = Array.isArray(productionFixture.pathHints)
    ? productionFixture.pathHints.map(String).filter(Boolean)
    : []
  const fixtureName = String(productionFixture.name ?? 'Zen Drama PLM production parity fixture')
  const fixtureId = String(productionFixture.fixtureId ?? DRAMA_PRODUCTION_FIXTURE_ID)
  const firstChapter = selectedNovel?.chapters?.[0] ?? null
  const activeChapterId = chapterEditor?.chapterId ?? firstChapter?.id
  const activeChapterNumber = chapterEditor?.chapterNumber ?? firstChapter?.number
  const hostedSummary = asRecord(featureState.hostedWriteSummary)
  const hostedEvents = featureState.hostedWriteEvents ?? []
  const productionFixturePromptReadbackChecked = Object.prototype.hasOwnProperty.call(productionFixture, 'promptReadback')
  const promptNativeReady = productionFixturePromptReadbackChecked
    ? productionFixture.promptNative === true && productionFixture.promptReadback === true
    : hasNativePromptWrite(featureState)
  const promptCount = featureState.prompts?.length ?? metricNumber(asRecord(featureState.promptStats), ['total_nodes', 'total', 'count'])
  const memorySync = asRecord(featureState.postChapterMemorySync)
  const memoryTripleCount = metricNumber(memorySync, ['diffCount', 'tripleCount', 'triple_count'])
    || (featureState.knowledgeTriples?.length ?? 0)
  const memoryChapterNumber = metricNumber(memorySync, ['chapterNumber', 'chapter_number'])
  const autopilotStatus = asRecord(featureState.autopilotStatus)
  const autopilotBreaker = asRecord(featureState.autopilotCircuitBreaker)
  const autopilotStatusEvents = featureState.autopilotStatusEvents ?? []
  const autopilotChapterEvents = featureState.autopilotChapterEvents ?? []
  const autopilotEvents = [
    ...(featureState.autopilotEvents ?? []),
    ...autopilotStatusEvents,
    ...autopilotChapterEvents,
  ]
  const hostedWriteReady = hostedWriteLifecycleReady(hostedSummary, hostedEvents)
  const autopilotReady = autopilotLifecycleReady({
    status: autopilotStatus,
    breaker: autopilotBreaker,
    events: featureState.autopilotEvents ?? [],
    statusEvents: autopilotStatusEvents,
    chapterEvents: autopilotChapterEvents,
  })

  const items: PlotPilotProductionEvidenceItem[] = [
    {
      id: 'project',
      label: 'Project',
      state: selectedNovel ? 'ready' : 'blocked',
      detail: selectedNovel
        ? `Loaded ${selectedNovel.title || selectedNovel.id}.`
        : 'No active PlotPilot project is loaded.',
      evidence: selectedNovel?.id,
      updatedAt: String(productionFixture.loadedAt ?? ''),
    },
    {
      id: 'chapter',
      label: 'Chapter',
      state: activeChapterId ? 'ready' : selectedNovel ? 'partial' : 'blocked',
      detail: activeChapterId
        ? `Active chapter ${activeChapterNumber ?? '-'} is available in PLM.`
        : selectedNovel
          ? 'Project is loaded but no chapter is active yet.'
          : 'No project chapter can be loaded before a project exists.',
      evidence: activeChapterId,
      updatedAt: String(productionFixture.loadedAt ?? ''),
    },
    {
      id: 'hosted-write',
      label: 'Hosted Write',
      state: hostedWriteReady
        ? 'ready'
        : hostedEvents.length > 0 || hostedSummary.lastType
          ? 'partial'
          : selectedNovel ? 'partial' : 'blocked',
      detail: hostedWriteReady
        ? `Saved ${String(hostedSummary.savedCount)} chapter(s) through Hosted Write with recovery evidence.`
        : hostedEvents.length > 0
          ? 'Hosted Write events are visible, but no saved chapter evidence is present yet.'
          : selectedNovel
            ? 'Hosted Write controls are available; run a session to produce saved-chapter evidence.'
            : 'Hosted Write requires an active project.',
      evidence: hostedWriteReady
        ? `session=${String(hostedSummary.sessionId ?? 'ready')}`
        : hostedSummary.lastType ? `last=${String(hostedSummary.lastType)}` : `${hostedEvents.length} events`,
      updatedAt: String(hostedSummary.updatedAt ?? ''),
    },
    {
      id: 'prompt',
      label: 'Prompt Registry',
      state: promptNativeReady ? 'ready' : promptCount > 0 ? 'partial' : selectedNovel ? 'partial' : 'blocked',
      detail: promptNativeReady
        ? 'Prompt Plaza write and readback evidence is present through PlotPilot-compatible registry APIs.'
        : promptCount > 0
          ? 'Prompt records are visible, but native write/readback evidence is not present.'
          : selectedNovel
            ? 'Prompt card save path is available; save or bootstrap a prompt to produce evidence.'
            : 'Prompt persistence requires an active project.',
      evidence: promptNativeReady
        ? `readback=${String(productionFixture.promptReadbackSource ?? 'plotpilot-prompt-plaza')}`
        : `${promptCount} prompt records`,
      updatedAt: String(productionFixture.promptUpdatedAt ?? productionFixture.loadedAt ?? ''),
    },
    {
      id: 'memory',
      label: 'Post-chapter Memory',
      state: memoryChapterNumber > 0 && memoryTripleCount > 0 ? 'ready' : memoryChapterNumber > 0 ? 'partial' : selectedNovel ? 'partial' : 'blocked',
      detail: memoryChapterNumber > 0 && memoryTripleCount > 0
        ? `Chapter ${memoryChapterNumber} produced ${memoryTripleCount} chapter-derived memory item(s).`
        : memoryChapterNumber > 0
          ? 'Post-chapter sync ran but produced no chapter-derived memory diff.'
          : selectedNovel
            ? 'Save or write back a chapter to refresh memory evidence.'
            : 'Memory sync requires an active project and chapter.',
      evidence: memoryChapterNumber > 0 ? `chapter ${memoryChapterNumber}, triples ${memoryTripleCount}` : undefined,
      updatedAt: String(memorySync.refreshedAt ?? ''),
    },
    {
      id: 'autopilot',
      label: 'Autopilot',
      state: Object.keys(autopilotStatus).length > 0 || Object.keys(autopilotBreaker).length > 0
        ? autopilotReady ? 'ready' : 'partial'
        : selectedNovel ? 'partial' : 'blocked',
      detail: autopilotReady
        ? `${autopilotEvents.length} Autopilot lifecycle event(s) cover start, stop, resume, and breaker reset.`
        : Object.keys(autopilotStatus).length > 0 || Object.keys(autopilotBreaker).length > 0
          ? 'Autopilot status and breaker are visible; run controls to produce lifecycle events.'
          : selectedNovel
            ? 'Autopilot controls are available after project load.'
            : 'Autopilot requires an active project.',
      evidence: autopilotReady
        ? `breaker=${String(autopilotBreaker.status ?? 'unknown')}`
        : String(autopilotStatus.autopilot_status ?? autopilotStatus.status ?? autopilotBreaker.status ?? 'idle'),
      updatedAt: String(autopilotStatus.updatedAt ?? autopilotBreaker.updatedAt ?? ''),
    },
    {
      id: 'verification',
      label: 'Verification',
      state: productPath && selectedNovel && activeChapterId ? 'ready' : productPath ? 'partial' : 'blocked',
      detail: productPath && selectedNovel && activeChapterId
        ? 'Zen product-path panel has enough DOM evidence for macOS happy-path verification.'
        : productPath
          ? 'Zen product-path panel is loaded; project/chapter evidence is still incomplete.'
          : 'Production evidence is not running in a product-path Zen panel.',
      evidence: productPath ? 'product-zen-panel' : 'fallback surface',
      updatedAt: new Date().toISOString(),
    },
  ]

  const stage9CoreItemIds = ['prompt', 'memory', 'hosted-write', 'autopilot']
  const stage9NonReady = items
    .filter((item) => stage9CoreItemIds.includes(item.id) && item.state !== 'ready')
    .map((item) => `${item.id}:${item.state}`)

  return {
    fixtureName,
    fixtureId,
    projectId: selectedNovel?.id,
    projectTitle: selectedNovel?.title,
    chapterId: activeChapterId,
    chapterNumber: activeChapterNumber,
    chapterTitle: chapterEditor?.title ?? firstChapter?.title,
    pathHints,
    generatedAt: new Date().toISOString(),
    stage9Ready: stage9NonReady.length === 0,
    stage9NonReady,
    items,
  }
}

function buildParityChecks(
  runtimeReady: boolean,
  selectedNovel: NovelDTO | null,
  featureState: PlotPilotNativeFeatureState,
): PlotPilotParityCheck[] {
  const promptStats = asRecord(featureState.promptStats)
  const nativePromptWrites = metricNumber(promptStats, ['dramaNativePromptWrites'])
  const promptCount = featureState.prompts?.length ?? metricNumber(promptStats, ['total_nodes', 'total', 'count'])
  const postSync = asRecord(featureState.postChapterMemorySync)
  const postSyncChapter = metricNumber(postSync, ['chapterNumber', 'chapter_number'])
  const knowledgeTripleCount = featureState.knowledgeTriples?.length ?? 0

  return [
    {
      id: 'prompt-registry-writes',
      label: 'Prompt registry writes',
      state: nativePromptWrites > 0 ? 'ready' : runtimeReady ? 'partial' : 'blocked',
      detail: nativePromptWrites > 0
        ? 'Drama storage cards write through PlotPilot Prompt Plaza and keep a Graph event trail.'
        : runtimeReady
          ? 'PlotPilot Prompt Plaza write API is wired; save a prompt card to produce write evidence.'
          : 'Waiting for PlotPilot runtime before native prompt writes can be verified.',
      evidence: nativePromptWrites > 0
        ? `${nativePromptWrites} native write${nativePromptWrites === 1 ? '' : 's'}`
        : promptCount > 0
          ? `${promptCount} prompt record${promptCount === 1 ? '' : 's'} visible`
          : 'PUT/POST /llm-control/prompts',
    },
    {
      id: 'post-chapter-memory-sync',
      label: 'Post-chapter memory sync',
      state: postSyncChapter > 0 ? 'ready' : knowledgeTripleCount > 0 ? 'partial' : 'blocked',
      detail: postSyncChapter > 0
        ? 'Chapter save/writeback refreshes Knowledge Graph stats and records sync evidence.'
        : knowledgeTripleCount > 0
          ? 'Knowledge Graph visualization exists; chapter-triggered evidence has not been produced yet.'
          : 'No chapter-triggered memory sync evidence has been captured.',
      evidence: postSyncChapter > 0
        ? `chapter ${postSyncChapter}`
        : knowledgeTripleCount > 0
          ? `${knowledgeTripleCount} triples loaded`
          : undefined,
    },
    {
      id: 'agentos-crew-parity',
      label: 'AgentOS / Crew parity',
      state: 'partial',
      detail: 'Crew surface, AgentOS-like queues, and Graph event writes are visible; full PlotPilot AgentOS parity remains a larger port.',
      evidence: selectedNovel ? `project ${selectedNovel.id}` : 'Crew runtime preview',
    },
    {
      id: 'advanced-graph-canvas-parity',
      label: 'Advanced Graph canvas',
      state: 'partial',
      detail: 'Drama Graph restores canvas, minimap, inspector, and PLM writeback; advanced PlotPilot canvas affordances remain open.',
      evidence: 'React Flow canvas + minimap + inspector',
    },
  ]
}

function resolveIntegrationStatus(
  baseStatus: PlotPilotIntegrationStatus | undefined,
  runtimeStatus: PlotPilotRuntimeStatus,
  codexStatus: PlotPilotCodexStatusResponse | null,
  selectedNovel: NovelDTO | null,
  chapterEditor: PlotPilotChapterEditor | null,
  featureState: PlotPilotNativeFeatureState,
): PlotPilotIntegrationStatus | undefined {
  if (!baseStatus) return undefined

  const runtimeReady = isRuntimeReady(runtimeStatus)
  const runtimePending = runtimeStatus.state === 'starting' || runtimeStatus.state === 'stopping'
  const sidecarStatus: PlotPilotReadinessStatus = {
    tier: 'plm-sidecar-ready',
    state: runtimeReady ? 'ready' : runtimePending ? 'pending' : 'blocked',
    message: runtimeReady
      ? 'PlotPilot-compatible sidecar is healthy through the Drama runtime.'
      : runtimePending
        ? 'Waiting for PlotPilot-compatible sidecar startup.'
        : runtimeStatus.error ?? runtimeStatus.lastError ?? 'PlotPilot-compatible sidecar is unavailable.',
  }

  const codexReady = codexStatus?.available === true && codexStatus.authenticated === true
  const aiStatus: PlotPilotReadinessStatus = {
    tier: 'ai-ready',
    state: codexReady ? 'ready' : codexStatus ? 'blocked' : 'pending',
    message: codexReady
      ? 'Codex-backed AI is available and authenticated.'
      : codexStatus?.error
        ? codexStatus.error
        : codexStatus
          ? 'Codex-backed AI is unavailable or unauthenticated.'
          : 'Codex-backed AI status has not been loaded yet.',
  }

  const workflowStatus: PlotPilotReadinessStatus = {
    tier: 'workflow-preview-ready',
    state: runtimeReady && selectedNovel ? 'ready' : runtimeReady ? 'blocked' : 'pending',
    message: runtimeReady && selectedNovel
      ? 'Script Studio has an active project workspace.'
      : runtimeReady
        ? 'Workspace/project is missing; project-dependent PLM surfaces remain blocked.'
        : 'Waiting for runtime and workspace before workflow preview can be ready.',
  }

  const parityChecks = buildParityChecks(runtimeReady, selectedNovel, featureState)
  const productionEvidence = buildProductionEvidenceSnapshot({
    runtimeReady,
    productPath: baseStatus.productPath,
    selectedNovel,
    chapterEditor,
    featureState,
  })
  const openParityChecks = parityChecks.filter((check) => check.state !== 'ready')
  const openProductionEvidence = productionEvidence.items.filter((item) => item.state !== 'ready')
  const parityStatus: PlotPilotReadinessStatus = {
    tier: 'plotpilot-parity-ready',
    state: openParityChecks.length === 0 && openProductionEvidence.length === 0 ? 'ready' : 'blocked',
    message: openParityChecks.length === 0 && openProductionEvidence.length === 0
      ? 'PlotPilot parity checks are complete for the current bridge contract.'
      : `Blocked by ${[
        ...openParityChecks.map((check) => check.label),
        ...openProductionEvidence.map((item) => item.label),
      ].join(', ')}.`,
  }

  return {
    ...baseStatus,
    tiers: mergeReadinessTiers(baseStatus.tiers, [
      sidecarStatus,
      aiStatus,
      workflowStatus,
      parityStatus,
    ]),
    workspacePathHints: selectedNovel
      ? baseStatus.workspacePathHints
      : [
        ...(baseStatus.workspacePathHints ?? []),
        ...workspacePathHints(runtimeStatus),
      ].filter((item, index, list) => list.indexOf(item) === index),
    productionEvidence,
    parityChecks,
    parityGaps: uniqueStringList([
      ...(baseStatus.parityGaps ?? []),
      ...openParityChecks.map((check) => check.label),
      ...openProductionEvidence.map((item) => item.label),
    ]),
  }
}

function summarizeBible(bible: BibleDTO | null | undefined): PlotPilotNovel['bible'] {
  if (!bible) return null
  return {
    logline: bible.style || bible.style_notes?.[0]?.content,
    world: bible.world_settings?.slice(0, 3).map((item) => `${item.name}: ${item.description}`).join('\n'),
    themes: bible.style_notes?.slice(0, 6).map((item) => item.content),
    characters: bible.characters?.slice(0, 12).map((character) => character.name),
    constraints: bible.timeline_notes?.slice(0, 5).map((note) => `${note.time_point}: ${note.event}`),
  }
}

function dramaOnboardingPrefs(novel: NovelDTO): Record<string, unknown> {
  return asRecord(asRecord(novel.generation_prefs).drama_onboarding)
}

function toUiNovel(novel: NovelDTO, bible?: BibleDTO | null): PlotPilotNovel {
  const onboarding = dramaOnboardingPrefs(novel)
  return {
    id: novel.id,
    title: novel.title || novel.id,
    subtitle: novel.premise || novel.locked_genre || novel.stage,
    author: novel.author,
    status: novel.stage,
    wordCount: novel.total_word_count,
    chapterCount: novel.chapters?.length ?? 0,
    beatCount: novel.has_outline ? novel.target_chapters : 0,
    bible: summarizeBible(bible),
    lockedGenre: novel.locked_genre || String(onboarding.genre ?? ''),
    lockedWorldPreset: novel.locked_world_preset || String(onboarding.world_preset ?? ''),
    lockedStoryStructure: novel.locked_story_structure || String(onboarding.story_structure ?? ''),
    lockedPacingControl: novel.locked_pacing_control || String(onboarding.pacing_control ?? ''),
    lockedWritingStyle: novel.locked_writing_style || String(onboarding.writing_style ?? ''),
    lockedSpecialRequirements: novel.locked_special_requirements || String(onboarding.special_requirements ?? ''),
    targetChapters: novel.target_chapters,
    targetWordsPerChapter: novel.target_words_per_chapter,
    autoApproveMode: Boolean(novel.auto_approve_mode),
    chapters: (novel.chapters ?? []).map((chapter) => ({
      id: chapter.id,
      number: chapter.number,
      title: chapter.title || `Chapter ${chapter.number}`,
      status: chapter.status ?? 'draft',
      wordCount: resolveChapterWordCount(chapter),
      generationHint: chapter.generation_hint,
    })),
    beats: [],
  }
}

function chapterNumberFromId(chapter: ChapterDTO): number {
  return Number.isFinite(chapter.number) ? chapter.number : Number.MAX_SAFE_INTEGER
}

function replaceNovelChapters(novel: NovelDTO, chapters: ChapterDTO[]): NovelDTO {
  const sortedChapters = [...chapters].sort((left, right) => chapterNumberFromId(left) - chapterNumberFromId(right))
  return {
    ...novel,
    chapters: sortedChapters,
    total_word_count: sortedChapters.reduce((total, chapter) => total + (chapter.word_count ?? 0), 0),
  }
}

function upsertNovelChapter(novel: NovelDTO, chapter: ChapterDTO): NovelDTO {
  const nextChapters = [
    chapter,
    ...(novel.chapters ?? []).filter((item) => item.id !== chapter.id && item.number !== chapter.number),
  ]
  return replaceNovelChapters(novel, nextChapters)
}

function toChapterEditor(
  chapter: ChapterDTO,
  options: {
    dirty?: boolean
    loading?: boolean
    novelId?: string
    lastWritingSpecFailure?: PlotPilotWritingSpecFailureView | null
  } = {},
): PlotPilotChapterEditor {
  return {
    novelId: options.novelId ?? chapter.novel_id ?? '',
    chapterId: chapter.id,
    chapterNumber: chapter.number,
    title: chapter.title || `第${chapter.number}章`,
    status: chapter.status ?? 'draft',
    wordCount: resolveChapterWordCount(chapter),
    content: chapter.content ?? '',
    generationHint: chapter.generation_hint,
    dirty: options.dirty ?? false,
    loading: options.loading ?? false,
    lastWritingSpecFailure: options.lastWritingSpecFailure ?? null,
  }
}

function countDraftText(value: string): number {
  return value.trim().length
}

function estimateWordCount(value: string): number {
  const trimmed = value.trim()
  if (!trimmed) return 0
  const tokenCount = trimmed.split(/\s+/).filter(Boolean).length
  return tokenCount > 0 ? tokenCount : trimmed.length
}

function resolveChapterWordCount(chapter: ChapterDTO): number {
  const backendCount = chapter.word_count
  if (typeof backendCount === 'number' && backendCount > 0) return backendCount
  return estimateWordCount(chapter.content ?? '')
}

function countWritingSpecFindings(report: Record<string, unknown> | undefined): number {
  if (!report) return 0
  const candidates = ['findings', 'violations', 'errors', 'warnings']
  return candidates.reduce((total, key) => {
    const value = report[key]
    return total + (Array.isArray(value) ? value.length : 0)
  }, 0)
}

function toWritingSpecFailureView(
  failure: PlotPilotWritingSpecFailure,
  args: {
    novelId: string
    chapterNumber: number
    writingSpecId?: string
  },
): PlotPilotWritingSpecFailureView {
  return {
    code: failure.code,
    message: failure.message,
    novelId: args.novelId,
    chapterNumber: args.chapterNumber,
    writingSpecId: args.writingSpecId,
    occurredAt: new Date().toISOString(),
    findingCount: countWritingSpecFindings(failure.report),
    report: failure.report,
  }
}

function writingSpecFailureContent(failure: PlotPilotWritingSpecFailureView): string {
  const reportText = failure.report ? JSON.stringify(failure.report, null, 2) : ''
  return [
    `WritingSpec 未通过：${failure.message}`,
    `novel=${failure.novelId}`,
    `chapter=${failure.chapterNumber}`,
    failure.writingSpecId ? `writing_spec=${failure.writingSpecId}` : '',
    failure.findingCount > 0 ? `findings=${failure.findingCount}` : '',
    reportText,
  ].filter(Boolean).join('\n')
}

function fallbackChapterTitle(chapterNumber: number): string {
  return `第${chapterNumber}章`
}

function buildChapterOutline(novel: NovelDTO | null, chapter: ChapterDTO, currentEditor: PlotPilotChapterEditor | null): string {
  const hint = currentEditor?.generationHint?.trim() || chapter.generation_hint?.trim()
  if (hint) return hint

  const parts = [
    chapter.title?.trim() ? `章节标题：${chapter.title.trim()}` : `章节标题：${fallbackChapterTitle(chapter.number)}`,
    novel?.premise?.trim() ? `书目设定：${novel.premise.trim()}` : '',
    novel?.locked_genre?.trim() ? `类型：${novel.locked_genre.trim()}` : '',
  ].filter(Boolean)

  return parts.join('\n') || `${fallbackChapterTitle(chapter.number)}：承接上一章推进主线冲突。`
}

async function writeChapterDraftToDramaGraph(args: {
  api: PlotPilotNativeApi
  graph: DramaGraph | null
  loadGraph: () => Promise<DramaGraph | null>
  setGraph: React.Dispatch<React.SetStateAction<DramaGraph | null>>
  novelId: string
  chapter: ChapterDTO
  source: DramaDraft['source']
}): Promise<boolean> {
  const content = args.chapter.content?.trim()
  if (!content) return false

  const graph = args.graph ?? await args.loadGraph()
  if (!graph) return false

  const targetChapter = graph.chapters.find((chapter) => chapter.number === args.chapter.number)
    ?? graph.chapters[args.chapter.number - 1]
  if (!targetChapter) return false

  const result = await args.api.upsertDramaGraphDraft({
    graphId: graph.id,
    input: {
      targetType: 'chapter',
      targetId: targetChapter.id,
      chapterId: targetChapter.id,
      nodeId: targetChapter.nodeId,
      content,
      status: 'draft',
      source: args.source,
      fields: [
        {
          key: 'novelDraft',
          label: 'PLM 小说正文',
          value: content,
          text: content,
        },
        {
          key: 'plmNovelId',
          label: 'PLM 书目 ID',
          value: args.novelId,
          text: args.novelId,
        },
        {
          key: 'plmChapterId',
          label: 'PLM 章节 ID',
          value: args.chapter.id,
          text: args.chapter.id,
        },
        {
          key: 'plmChapterNumber',
          label: 'PLM 章节号',
          value: args.chapter.number,
          text: String(args.chapter.number),
        },
        {
          key: 'scriptStatus',
          label: '剧本状态',
          value: 'draft',
          text: 'draft',
        },
      ],
    },
    event: {
      type: args.source === 'plotpilot' ? 'plm.chapter.writeback' : 'plm.chapter.saved',
      actor: 'drama:plm-ui',
      source: 'plm',
      target: {
        graphId: graph.id,
        nodeId: targetChapter.nodeId,
        chapterId: targetChapter.id,
        draftId: `chapter:${targetChapter.id}:${args.source}`,
        novelId: args.novelId,
      },
      status: 'draft',
      summary: `${args.chapter.title || fallbackChapterTitle(args.chapter.number)} 已写回 Drama Graph`,
      details: {
        novelId: args.novelId,
        chapterId: args.chapter.id,
        chapterNumber: args.chapter.number,
        title: args.chapter.title,
        charCount: content.length,
        source: args.source,
      },
    },
  })
  args.setGraph(result.graph)
  return true
}

async function writeWritingSpecFailureToDramaGraph(args: {
  api: PlotPilotNativeApi
  graph: DramaGraph | null
  loadGraph: () => Promise<DramaGraph | null>
  setGraph: React.Dispatch<React.SetStateAction<DramaGraph | null>>
  failure: PlotPilotWritingSpecFailureView
}): Promise<boolean> {
  const graph = args.graph ?? await args.loadGraph()
  if (!graph) return false

  const targetChapter = graph.chapters.find((chapter) => chapter.number === args.failure.chapterNumber)
    ?? graph.chapters[args.failure.chapterNumber - 1]
  if (!targetChapter) return false

  const content = writingSpecFailureContent(args.failure)
  const reportText = args.failure.report ? JSON.stringify(args.failure.report, null, 2) : ''
  const result = await args.api.upsertDramaGraphDraft({
    graphId: graph.id,
    input: {
      draftId: `chapter:${targetChapter.id}:plotpilot-writing-spec-failure`,
      targetType: 'chapter',
      targetId: targetChapter.id,
      chapterId: targetChapter.id,
      nodeId: targetChapter.nodeId,
      content,
      status: 'blocked',
      source: 'plotpilot',
      fields: [
        {
          key: 'writingSpecStatus',
          label: 'WritingSpec 状态',
          value: 'failed',
          text: 'failed',
        },
        {
          key: 'writingSpecFailureMessage',
          label: 'WritingSpec 失败信息',
          value: args.failure.message,
          text: args.failure.message,
        },
        {
          key: 'writingSpecFailureReport',
          label: 'WritingSpec 失败报告',
          value: args.failure.report ?? null,
          text: reportText,
        },
        {
          key: 'writingSpecFailureAt',
          label: 'WritingSpec 失败时间',
          value: args.failure.occurredAt,
          text: args.failure.occurredAt,
        },
        {
          key: 'plmNovelId',
          label: 'PLM 书目 ID',
          value: args.failure.novelId,
          text: args.failure.novelId,
        },
        {
          key: 'plmChapterNumber',
          label: 'PLM 章节号',
          value: args.failure.chapterNumber,
          text: String(args.failure.chapterNumber),
        },
        {
          key: 'scriptStatus',
          label: '剧本状态',
          value: 'blocked',
          text: 'blocked',
        },
      ],
    },
    event: {
      type: 'plm.failure.reported',
      actor: 'drama:plm-ui',
      source: 'plm',
      target: {
        graphId: graph.id,
        nodeId: targetChapter.nodeId,
        chapterId: targetChapter.id,
        draftId: `chapter:${targetChapter.id}:plotpilot-writing-spec-failure`,
        novelId: args.failure.novelId,
      },
      severity: 'error',
      status: 'blocked',
      summary: args.failure.message,
      details: {
        code: args.failure.code,
        novelId: args.failure.novelId,
        chapterNumber: args.failure.chapterNumber,
        writingSpecId: args.failure.writingSpecId,
        findingCount: args.failure.findingCount,
        occurredAt: args.failure.occurredAt,
        report: args.failure.report,
      },
    },
  })
  args.setGraph(result.graph)
  return true
}

async function writePlotPilotGraphDraft(args: {
  api: PlotPilotNativeApi
  graph: DramaGraph | null
  loadGraph: () => Promise<DramaGraph | null>
  setGraph: React.Dispatch<React.SetStateAction<DramaGraph | null>>
  draftId: string
  content: string
  status?: DramaDraft['status']
  fields?: Array<{ key: string; label: string; value?: unknown; text?: string }>
}): Promise<boolean> {
  const graph = args.graph ?? await args.loadGraph()
  if (!graph) return false

  const result = await args.api.upsertDramaGraphDraft({
    graphId: graph.id,
    input: {
      draftId: args.draftId,
      targetType: 'graph',
      targetId: graph.id,
      content: args.content,
      status: args.status ?? 'draft',
      source: 'plotpilot',
      fields: args.fields,
    },
  })
  args.setGraph(result.graph)
  return true
}

function plotPilotGraphDraftContent(title: string, payload: unknown): string {
  return [
    title,
    JSON.stringify(payload, null, 2),
  ].join('\n\n')
}

function toUiLogs(logs: PlmLogEntry[]): PlotPilotUiLogEntry[] {
  return logs.slice(-160).map((entry, index) => ({
    id: `${entry.timestamp ?? index}:${index}`,
    level: entry.stream === 'stderr' ? 'warning' : 'info',
    time: entry.timestamp,
    message: entry.message ?? entry.line ?? '',
  }))
}

export function PlotPilotNativeContainer({
  api,
  createClient = createPlotPilotClient,
  integrationStatus,
  onIntegrationStatusChange,
  productionFixture = false,
}: PlotPilotNativeContainerProps) {
  const [runtimeStatus, setRuntimeStatus] = React.useState<PlotPilotRuntimeStatus>(EMPTY_RUNTIME_STATUS)
  const [runtimeLogs, setRuntimeLogs] = React.useState<PlmLogEntry[]>([])
  const [novels, setNovels] = React.useState<NovelDTO[]>([])
  const [selectedNovelId, setSelectedNovelId] = React.useState<string | null>(null)
  const [selectedBible, setSelectedBible] = React.useState<BibleDTO | null>(null)
  const [chapterEditor, setChapterEditor] = React.useState<PlotPilotChapterEditor | null>(null)
  const [activeJob, setActiveJob] = React.useState<PlotPilotGenerationJob | null>(null)
  const [dramaGraph, setDramaGraph] = React.useState<DramaGraph | null>(null)
  const [codexStatus, setCodexStatus] = React.useState<PlotPilotCodexStatusResponse | null>(null)
  const [writingSpec, setWritingSpec] = React.useState<PlotPilotWritingSpecBindingResponse | null>(null)
  const [humanizer, setHumanizer] = React.useState<PlotPilotHumanizerSettingsResponse | null>(null)
  const [lastWritingSpecFailure, setLastWritingSpecFailure] = React.useState<PlotPilotWritingSpecFailureView | null>(null)
  const [featureState, setFeatureState] = React.useState<PlotPilotNativeFeatureState>({})
  const [chapterAnnotationsByKey, setChapterAnnotationsByKey] = React.useState<Record<string, PlotPilotChapterAnnotation[]>>({})
  const pendingOpenRequestRef = React.useRef<DramaPlmOpenRequest | null>(null)
  const codexProfileEnsuredForRef = React.useRef<string | null>(null)
  const productionFixtureLoadedRef = React.useRef(false)
  const activeStreamAbortRef = React.useRef<AbortController | null>(null)
  const autopilotStreamAbortRef = React.useRef<AbortController | null>(null)

  const client = React.useMemo(() => {
    return runtimeStatus.baseUrl ? createClient({ baseUrl: runtimeStatus.baseUrl }) : null
  }, [createClient, runtimeStatus.baseUrl])

  const refreshCodexStatus = React.useCallback(async (activeClient: PlotPilotClient | null = client) => {
    if (!activeClient) {
      setCodexStatus(null)
      return
    }
    try {
      setCodexStatus(await activeClient.getCodexStatus({ timeoutMs: STATUS_REQUEST_TIMEOUT_MS }))
    } catch (error) {
      setCodexStatus({
        available: false,
        authenticated: false,
        requires_openai_auth: true,
        error: errorMessage(error),
      })
    }
  }, [client])

  const selectedNovel = React.useMemo(
    () => novels.find((novel) => novel.id === selectedNovelId) ?? novels[0] ?? null,
    [novels, selectedNovelId],
  )

  const refreshLogs = React.useCallback(async () => {
    try {
      setRuntimeLogs(await api.getPlotPilotRuntimeLogs())
    } catch {
      setRuntimeLogs([])
    }
  }, [])

  const refreshRuntime = React.useCallback(async () => {
    try {
      const status = await api.getPlotPilotRuntimeStatus()
      setRuntimeStatus(status)
      await refreshLogs()
      return status
    } catch (error) {
      const status: PlotPilotRuntimeStatus = {
        ...EMPTY_RUNTIME_STATUS,
        state: 'error',
        error: errorMessage(error),
      }
      setRuntimeStatus(status)
      return status
    }
  }, [refreshLogs])

  const startEngine = React.useCallback(async () => {
    setRuntimeStatus((current) => ({ ...current, state: 'starting' }))
    try {
      const status = await api.startPlotPilotRuntime()
      setRuntimeStatus(status)
      await refreshLogs()
      if (!isRuntimeReady(status)) {
        throw new Error(status.error ?? status.lastError ?? 'PlotPilot runtime 未通过健康检查。')
      }
      return status
    } catch (error) {
      setRuntimeStatus((current) => ({
        ...current,
        state: 'error',
        healthy: false,
        error: errorMessage(error),
      }))
      throw error
    }
  }, [refreshLogs])

  const restartEngine = React.useCallback(async () => {
    setRuntimeStatus((current) => ({ ...current, state: 'starting' }))
    try {
      const status = await api.restartPlotPilotRuntime()
      setRuntimeStatus(status)
      await refreshLogs()
      if (!isRuntimeReady(status)) {
        throw new Error(status.error ?? status.lastError ?? 'PlotPilot runtime 重启后未通过健康检查。')
      }
      return status
    } catch (error) {
      setRuntimeStatus((current) => ({
        ...current,
        state: 'error',
        healthy: false,
        error: errorMessage(error),
      }))
      throw error
    }
  }, [refreshLogs])

  const ensureRuntimeClient = React.useCallback(async (): Promise<PlotPilotClient> => {
    if (client) return client
    const status = await startEngine()
    const baseUrl = status.baseUrl ?? status.url
    if (!baseUrl) {
      throw new Error('PlotPilot runtime did not return a base URL')
    }
    return createClient({ baseUrl })
  }, [client, createClient, startEngine])

  const startCodexLogin = React.useCallback(async () => {
    try {
      const activeClient = await ensureRuntimeClient()
      const result = await activeClient.startCodexLogin()
      await api.openUrl(result.auth_url)
      window.setTimeout(() => void refreshCodexStatus(activeClient), 1_500)
      window.setTimeout(() => void refreshCodexStatus(activeClient), 6_000)
    } catch (error) {
      reportPlotPilotError(error)
    }
  }, [ensureRuntimeClient, refreshCodexStatus])

  const loadNovels = React.useCallback(async () => {
    if (!client) return
    try {
      const nextNovels = await client.listNovels({ timeoutMs: STATUS_REQUEST_TIMEOUT_MS })
      setNovels(nextNovels)
      setSelectedNovelId((current) => current ?? nextNovels[0]?.id ?? null)
    } catch (error) {
      setRuntimeStatus((current) => ({
        ...current,
        state: 'error',
        healthy: false,
        error: errorMessage(error),
      }))
    }
  }, [client])

  const loadSelectedBible = React.useCallback(async (novelId: string) => {
    if (!client) return
    try {
      setSelectedBible(await client.getBible(novelId))
    } catch {
      setSelectedBible(null)
    }
  }, [client])

  const loadProjectGenerationSettings = React.useCallback(async (novelId: string) => {
    if (!client) {
      setWritingSpec(null)
      setHumanizer(null)
      return
    }
    const [nextWritingSpec, nextHumanizer] = await Promise.all([
      client.getWritingSpec(novelId).catch(() => null),
      client.getHumanizer(novelId).catch(() => null),
    ])
    setWritingSpec(nextWritingSpec)
    setHumanizer(nextHumanizer)
  }, [client])

  const recordPlmProjectFile = React.useCallback(async (input: PlmProjectFileRecordInput) => {
    if (typeof api.recordDramaProjectFile !== 'function') return null
    return api.recordDramaProjectFile({
      projectId: input.novelId,
      source: 'plm',
      type: input.type,
      title: input.title,
      summary: input.summary,
      payload: input.payload,
      markdown: input.markdown,
    })
  }, [])

  const saveChapterAnnotations = React.useCallback(async (
    novelId: string,
    chapterNumber: number,
    annotations: PlotPilotChapterAnnotation[],
  ) => {
    const normalizedAnnotations = normalizeChapterAnnotations(annotations)
    const key = chapterAnnotationsKey(novelId, chapterNumber)
    setChapterAnnotationsByKey((current) => ({
      ...current,
      [key]: normalizedAnnotations,
    }))

    const chapterTitle = chapterEditor?.novelId === novelId && chapterEditor.chapterNumber === chapterNumber
      ? chapterEditor.title
      : selectedNovel?.id === novelId
        ? selectedNovel.chapters?.find((chapter) => chapter.number === chapterNumber)?.title
        : undefined
    const markdown = buildChapterAnnotationsMarkdown({
      novelId,
      chapterNumber,
      chapterTitle,
      annotations: normalizedAnnotations,
    })
    await recordPlmProjectFile({
      novelId,
      type: `plm.chapter.annotations.saved.${chapterNumber}`,
      title: `第${chapterNumber}章批注`,
      summary: {
        chapterNumber,
        annotationCount: normalizedAnnotations.length,
        openAnnotationCount: normalizedAnnotations.filter((annotation) => annotation.status !== 'resolved').length,
        revisionMode: 'annotation_revision',
      },
      payload: {
        schema: 'plotpilot.chapter_annotations.v1',
        novelId,
        chapterNumber,
        annotations: normalizedAnnotations,
        markdown,
      },
      markdown,
    })
  }, [chapterEditor, recordPlmProjectFile, selectedNovel])

  const loadLatestChapterAnnotations = React.useCallback(async (
    novelId: string,
    chapterNumber: number,
  ): Promise<PlotPilotChapterAnnotation[]> => {
    const key = chapterAnnotationsKey(novelId, chapterNumber)
    if (chapterAnnotationsByKey[key]) return chapterAnnotationsByKey[key]
    if (typeof api.listDramaProjectFiles !== 'function') return []

    try {
      const result = await api.listDramaProjectFiles({
        projectId: novelId,
        source: 'plm',
        typePrefix: 'plm.chapter.annotations.saved.',
        limit: 100,
      })
      const matchingRecord = result.files.find((file) => {
        const payload = asRecord(file.payload)
        const payloadChapterNumber = Number(payload.chapterNumber)
        return payloadChapterNumber === chapterNumber
      })
      const annotations = normalizeChapterAnnotations(asRecord(matchingRecord?.payload).annotations)
      setChapterAnnotationsByKey((current) => ({
        ...current,
        [key]: annotations,
      }))
      return annotations
    } catch {
      return []
    }
  }, [api, chapterAnnotationsByKey])

  const resolveRevisionContext = React.useCallback(async (
    novelId: string,
    chapterNumber: number,
    revisionContext?: PlotPilotChapterRevisionContext,
  ): Promise<PlotPilotResolvedRevisionContext> => {
    const incomingAnnotations = normalizeChapterAnnotations(revisionContext?.annotations)
    const annotations = incomingAnnotations.length > 0
      ? incomingAnnotations
      : await loadLatestChapterAnnotations(novelId, chapterNumber)
    const chapterTitle = chapterEditor?.novelId === novelId && chapterEditor.chapterNumber === chapterNumber
      ? chapterEditor.title
      : selectedNovel?.id === novelId
        ? selectedNovel.chapters?.find((chapter) => chapter.number === chapterNumber)?.title
        : undefined
    return {
      annotations,
      markdown: buildChapterAnnotationsMarkdown({
        novelId,
        chapterNumber,
        chapterTitle,
        annotations,
      }),
    }
  }, [chapterEditor, loadLatestChapterAnnotations, selectedNovel])

  const loadSavedPromptCards = React.useCallback(async (novelId: string) => {
    if (typeof api.listDramaProjectFiles !== 'function') return
    try {
      const result = await api.listDramaProjectFiles({
        projectId: novelId,
        source: 'plm',
        typePrefix: 'plm.storageCard.prompt.',
        limit: 100,
      })
      const savedPrompts = result.files
        .map((file) => asRecord(file.payload))
        .filter((prompt) => promptRecordKey(prompt) && String(prompt.template ?? prompt.description ?? '').trim())
      if (savedPrompts.length === 0) return

      setFeatureState((current) => {
        const seen = new Set<string>()
        const prompts: Array<Record<string, unknown>> = []
        for (const prompt of savedPrompts) {
          const key = promptRecordKey(prompt)
          if (!key || seen.has(key)) continue
          seen.add(key)
          prompts.push(prompt)
        }
        for (const prompt of current.prompts ?? []) {
          const key = promptRecordKey(asRecord(prompt))
          if (!key || seen.has(key)) continue
          seen.add(key)
          prompts.push(prompt)
        }
        return {
          ...current,
          prompts,
          promptStats: {
            ...(current.promptStats ?? {}),
            dramaSavedPrompts: savedPrompts.length,
          },
        }
      })
    } catch {
      // Saved prompt cards are an enhancement; runtime prompt APIs should still load.
    }
  }, [api])

  const bindWritingSpec = React.useCallback(async (novelId: string, writingSpecId: string) => {
    setActiveJob({
      id: `writing-spec:${novelId}`,
      label: '绑定 WritingSpec',
      phase: 'settings',
      detail: writingSpecId || 'clear',
    })
    try {
      const activeClient = await ensureRuntimeClient()
      const nextWritingSpec = await activeClient.setWritingSpec(novelId, {
        writing_spec_id: writingSpecId.trim(),
      })
      setWritingSpec(nextWritingSpec)
      await recordPlmProjectFile({
        novelId,
        type: 'plm.writingSpec.bound',
        summary: {
          writingSpecId: nextWritingSpec.writing_spec_id,
          specTitle: nextWritingSpec.spec_title,
          specVersion: nextWritingSpec.spec_version,
          contextKey: nextWritingSpec.context_key,
        },
        payload: nextWritingSpec,
      })
    } catch (error) {
      reportPlotPilotError(error)
    } finally {
      setActiveJob(null)
    }
  }, [ensureRuntimeClient, recordPlmProjectFile])

  const clearWritingSpec = React.useCallback(async (novelId: string) => {
    await bindWritingSpec(novelId, '')
  }, [bindWritingSpec])

  const updateHumanizer = React.useCallback(async (
    novelId: string,
    settings: PlotPilotHumanizerSettingsDraft,
  ) => {
    setActiveJob({
      id: `humanizer:${novelId}`,
      label: '保存 Humanizer',
      phase: 'settings',
      detail: settings.enabled ? settings.failurePolicy : 'disabled',
    })
    try {
      const activeClient = await ensureRuntimeClient()
      const nextHumanizer = await activeClient.setHumanizer(novelId, {
        enabled: settings.enabled,
        revision_note: settings.revisionNote,
        failure_policy: settings.failurePolicy,
        temperature: settings.temperature,
        max_tokens: settings.maxTokens ?? null,
      })
      setHumanizer(nextHumanizer)
      await recordPlmProjectFile({
        novelId,
        type: 'plm.humanizer.updated',
        summary: {
          enabled: nextHumanizer.enabled,
          failurePolicy: nextHumanizer.failure_policy,
          temperature: nextHumanizer.temperature,
        },
        payload: nextHumanizer,
      })
    } catch (error) {
      reportPlotPilotError(error)
    } finally {
      setActiveJob(null)
    }
  }, [ensureRuntimeClient, recordPlmProjectFile])

  const saveBible = React.useCallback(async (novelId: string, bible: PlotPilotBibleEditorData) => {
    setActiveJob({
      id: `bible:save:${novelId}`,
      label: '保存 Bible',
      phase: 'bible',
      detail: novelId,
    })
    try {
      const activeClient = await ensureRuntimeClient()
      const nextBible = await activeClient.updateBible(novelId, toBulkUpdateBibleRequest(bible))
      setSelectedBible(nextBible)
      await recordPlmProjectFile({
        novelId,
        type: 'plm.bible.updated',
        summary: bibleRecordSummary(nextBible),
        payload: nextBible,
      })
      await loadNovels()
      setFeatureState((current) => ({
        ...current,
        lastMessage: 'Bible 已保存并同步 Variable Hub。',
      }))
    } catch (error) {
      reportPlotPilotError(error)
    } finally {
      setActiveJob(null)
    }
  }, [ensureRuntimeClient, loadNovels, recordPlmProjectFile])

  const loadCurrentDramaGraph = React.useCallback(async () => {
    try {
      const result = await api.loadDramaGraph()
      setDramaGraph(result.graph)
      return result.graph
    } catch {
      setDramaGraph(null)
      return null
    }
  }, [])

  const recordPlmGraphEvent = React.useCallback(async (event: DramaGraphEventInput) => {
    if (typeof api.recordDramaGraphEvent !== 'function') return null
    const graph = dramaGraph ?? await loadCurrentDramaGraph()
    if (!graph) return null
    const result = await api.recordDramaGraphEvent({
      graphId: graph.id,
      event: {
        actor: 'drama:plm-ui',
        source: 'plm',
        ...event,
        target: {
          graphId: graph.id,
          ...event.target,
        },
      },
    })
    setDramaGraph(result.graph)
    return result
  }, [dramaGraph, loadCurrentDramaGraph])

  const recordInvocationGraphEvent = React.useCallback(async (args: {
    novelId: string
    type: string
    sessionId: string
    invocation: unknown
    summary: string
    status?: string
    severity?: DramaGraphEventInput['severity']
    details?: Record<string, unknown>
  }) => {
    if (!args.novelId) return null
    return recordPlmGraphEvent({
      type: args.type,
      target: {
        novelId: args.novelId,
      },
      status: args.status,
      severity: args.severity,
      summary: args.summary,
      details: {
        novelId: args.novelId,
        sessionId: args.sessionId,
        invocation: args.invocation,
        ...args.details,
      },
    })
  }, [recordPlmGraphEvent])

  const saveStorageCard = React.useCallback(async (novelId: string, card: ScriptStudioStorageCardDraft) => {
    setActiveJob({
      id: `storage-card:${card.kind}:${novelId}`,
      label: card.kind === 'character' ? '保存人设卡' : '保存提示词卡',
      phase: 'storage',
      detail: storageCardTitle(card),
    })

    try {
      if (card.kind === 'character') {
        const activeClient = await ensureRuntimeClient()
        const currentBible = selectedBible ?? await activeClient.getBible(novelId)
        const characters = [...recordArray(currentBible.characters)]
        const indexFromSource = typeof card.sourceIndex === 'number' && card.sourceIndex >= 0
          ? card.sourceIndex
          : -1
        const indexById = card.sourceId
          ? characters.findIndex((character) => String(character.id ?? character.name ?? '') === card.sourceId)
          : -1
        const indexByTitle = characters.findIndex((character) => String(character.name ?? '') === card.title)
        const updateIndex = indexFromSource >= 0
          ? indexFromSource
          : indexById >= 0
            ? indexById
            : indexByTitle

        if (updateIndex >= 0 && updateIndex < characters.length) {
          characters[updateIndex] = characterRowFromStorageCard(card, characters[updateIndex])
        } else {
          characters.unshift(characterRowFromStorageCard(card))
        }

        const nextBibleDraft: PlotPilotBibleEditorData = {
          ...(currentBible as unknown as PlotPilotBibleEditorData),
          characters,
        }
        const nextBible = await activeClient.updateBible(novelId, toBulkUpdateBibleRequest(nextBibleDraft))
        setSelectedBible(nextBible)
        await recordPlmProjectFile({
          novelId,
          type: 'plm.storageCard.character.saved',
          title: storageCardTitle(card),
          summary: {
            cardKind: card.kind,
            characterCount: nextBible.characters.length,
            source: card.source ?? 'draft',
          },
          payload: {
            card,
            bible: bibleRecordSummary(nextBible),
          },
        })
        await recordPlmGraphEvent({
          type: 'plm.storageCard.character.saved',
          target: { novelId },
          status: 'saved',
          summary: `${storageCardTitle(card)} 人设卡已写入 Bible`,
          details: {
            novelId,
            card,
            characterCount: nextBible.characters.length,
          },
        })
        await loadNovels()
      } else {
        const activeClient = await ensureRuntimeClient()
        const promptRecord = promptRecordFromStorageCard(card)
        const nodeKey = promptNodeKeyFromStorageCard(card, promptRecord)
        const nativePromptPayload = {
          name: storageCardTitle(card),
          description: card.subtitle.trim() || 'Drama Script Studio prompt card',
          user_template: storageCardBody(card),
          system: '',
          tags: uniqueStringList([
            'drama-script-studio',
            card.badge,
            card.source,
          ]),
          change_summary: 'Saved from Drama Script Studio storage card.',
        }
        let nativePromptWrite: Record<string, unknown>
        try {
          nativePromptWrite = await activeClient.updatePrompt(nodeKey, nativePromptPayload) as unknown as Record<string, unknown>
        } catch (error) {
          if (!(error instanceof PlotPilotHttpError) || error.status !== 404) throw error
          nativePromptWrite = await activeClient.createPromptNode({
            node_key: nodeKey,
            name: nativePromptPayload.name,
            description: nativePromptPayload.description,
            category: 'drama',
            system: nativePromptPayload.system,
            user_template: nativePromptPayload.user_template,
          }) as unknown as Record<string, unknown>
        }
        const storedPromptRecord: Record<string, unknown> = {
          ...promptRecord,
          id: nodeKey,
          key: nodeKey,
          node_key: nodeKey,
          nativeRegistry: 'plotpilot-prompt-plaza',
          nativePromptWrite,
        }
        setFeatureState((current) => {
          const prompts = [...(current.prompts ?? [])]
          const sourceId = nodeKey
          const existingIndex = prompts.findIndex((prompt) => {
            const record = asRecord(prompt)
            return String(record.node_key ?? record.id ?? record.key ?? record.name ?? '') === sourceId ||
              String(record.name ?? record.title ?? '') === storageCardTitle(card)
          })
          if (existingIndex >= 0) prompts[existingIndex] = storedPromptRecord
          else prompts.unshift(storedPromptRecord)
          return {
            ...current,
            prompts,
            promptStats: {
              ...(current.promptStats ?? {}),
              dramaSavedPrompts: prompts.length,
              dramaNativePromptWrites: metricNumber(asRecord(current.promptStats), ['dramaNativePromptWrites']) + 1,
            },
            lastMessage: '提示词卡已写入 PlotPilot prompt registry。',
          }
        })
        await recordPlmProjectFile({
          novelId,
          type: 'plm.storageCard.prompt.saved',
          title: storageCardTitle(card),
          summary: {
            cardKind: card.kind,
            promptId: nodeKey,
            scope: promptRecord['scope'],
            nativeRegistry: 'plotpilot-prompt-plaza',
          },
          payload: storedPromptRecord,
        })
        await recordPlmGraphEvent({
          type: 'plm.storageCard.prompt.saved',
          target: { novelId },
          status: 'saved',
          summary: `${storageCardTitle(card)} 提示词卡已写入 registry`,
          details: {
            novelId,
            prompt: storedPromptRecord,
            nativeNodeKey: nodeKey,
          },
        })
      }

      setFeatureState((current) => ({
        ...current,
        lastMessage: `${storageCardTitle(card)} 已保存。`,
      }))
    } catch (error) {
      reportPlotPilotError(error)
    } finally {
      setActiveJob(null)
    }
  }, [ensureRuntimeClient, loadNovels, recordPlmGraphEvent, recordPlmProjectFile, selectedBible])

  const syncPostChapterMemoryEvidence = React.useCallback(async (args: {
    novelId: string
    chapter: ChapterDTO
    source: 'manual-save' | 'plotpilot-writeback'
    fixtureSafe?: boolean
  }) => {
    try {
      const activeClient = await ensureRuntimeClient()
      const [stats, triples] = await Promise.all([
        activeClient.getKnowledgeGraphStatistics(args.novelId).catch(() => null),
        activeClient.getKnowledgeGraphTriples(args.novelId, { source_type: 'chapter_inferred' }).catch(() => null),
      ])
      let knowledgeTriples = recordArray(triples?.data, ['triples'])
      let diffSource = 'plotpilot-knowledge-graph'
      if (knowledgeTriples.length === 0 && args.fixtureSafe) {
        knowledgeTriples = buildProductionFixtureMemoryDiff(args.chapter)
        diffSource = 'drama-production-fixture'
      }
      const syncSummary = {
        novelId: args.novelId,
        chapterId: args.chapter.id,
        chapterNumber: args.chapter.number,
        title: args.chapter.title,
        source: args.source,
        diffSource,
        diffCount: knowledgeTriples.length,
        tripleCount: knowledgeTriples.length,
        stats: stats?.data ?? null,
        refreshedAt: new Date().toISOString(),
      }
      setFeatureState((current) => ({
        ...current,
        postChapterMemorySync: syncSummary,
        knowledgeStats: stats?.data ? asRecord(stats.data) : current.knowledgeStats,
        knowledgeTriples: knowledgeTriples.length ? knowledgeTriples : current.knowledgeTriples,
        lastMessage: `章节 ${args.chapter.number} 的 Memory Graph 同步证据已刷新。`,
      }))
      await recordPlmProjectFile({
        novelId: args.novelId,
        type: 'plm.memory.postChapterSync.visualized',
        title: args.chapter.title,
        summary: syncSummary,
        payload: syncSummary,
      })
      await recordPlmGraphEvent({
        type: 'plm.memory.postChapterSync.visualized',
        actor: 'drama:plm-ui',
        source: 'memory',
        target: {
          novelId: args.novelId,
          chapterId: args.chapter.id,
        },
        status: 'refreshed',
        summary: `第${args.chapter.number}章 Memory Graph 同步证据已刷新`,
        details: syncSummary,
      })
    } catch (error) {
      setFeatureState((current) => ({
        ...current,
        lastMessage: `Memory Graph 同步证据刷新失败：${errorMessage(error)}`,
      }))
    }
  }, [ensureRuntimeClient, recordPlmGraphEvent, recordPlmProjectFile])

  const bootstrapProductionFixture = React.useCallback(async () => {
    if (productionFixtureLoadedRef.current) return
    productionFixtureLoadedRef.current = true
    setActiveJob({
      id: `production-fixture:${DRAMA_PRODUCTION_FIXTURE_ID}`,
      label: '载入生产验收项目',
      phase: 'fixture',
      detail: DRAMA_PRODUCTION_FIXTURE_ID,
    })
    try {
      const activeClient = await ensureRuntimeClient()
      let novel: NovelDTO
      try {
        novel = await activeClient.getNovel(DRAMA_PRODUCTION_FIXTURE_ID)
      } catch {
        try {
          novel = await activeClient.createNovel({
            novel_id: DRAMA_PRODUCTION_FIXTURE_ID,
            title: 'Zen Drama PLM 生产闭环验收',
            author: 'Drama',
            target_chapters: 3,
            premise: '一个固定的 macOS Zen PLM 生产验收项目，用于验证真实项目、章节、Prompt、Memory 和 Autopilot 状态。',
            genre: 'mythic adventure',
            world_preset: 'eastern sea myth',
            story_structure: 'three act verification arc',
            pacing_control: 'compact',
            writing_style: 'cinematic prose',
            special_requirements: 'Keep fixture content deterministic for automated verification.',
            length_tier: 'short',
            target_words_per_chapter: 900,
          })
        } catch (createError) {
          if (createError instanceof PlotPilotHttpError && (createError.status === 400 || createError.status === 409)) {
            novel = await activeClient.getNovel(DRAMA_PRODUCTION_FIXTURE_ID)
          } else {
            throw createError
          }
        }
      }

      const ensuredChapter = await activeClient.ensureChapter(
        novel.id,
        DRAMA_PRODUCTION_FIXTURE_CHAPTER_NUMBER,
        { title: '生产闭环验证' },
      )
      const chapter = await activeClient.updateChapter(novel.id, DRAMA_PRODUCTION_FIXTURE_CHAPTER_NUMBER, {
        content: DRAMA_PRODUCTION_FIXTURE_CONTENT,
      }).catch(() => ensuredChapter)
      const novelWithChapter = upsertNovelChapter(novel, chapter)

      let nativePromptWrite: Record<string, unknown> | null = null
      let promptNativeError: string | null = null
      let promptReadback: { ok: boolean; count: number; source?: string; error?: string } = {
        ok: false,
        count: 0,
      }
      const promptRecord: Record<string, unknown> = {
        id: DRAMA_PRODUCTION_FIXTURE_PROMPT_KEY,
        key: DRAMA_PRODUCTION_FIXTURE_PROMPT_KEY,
        node_key: DRAMA_PRODUCTION_FIXTURE_PROMPT_KEY,
        name: '生产闭环章节正文 Prompt',
        scope: 'production-parity',
        template: '读取固定 fixture 章节、Bible 和 PlotPilot 状态，生成可回写 Drama Graph 的章节正文。',
        version: 'mac-production-parity',
        source: 'drama-production-fixture',
        updated_at: new Date().toISOString(),
      }
      try {
        nativePromptWrite = await activeClient.updatePrompt(DRAMA_PRODUCTION_FIXTURE_PROMPT_KEY, {
          name: String(promptRecord.name),
          description: 'Zen Drama PLM production parity fixture prompt.',
          user_template: String(promptRecord.template),
          system: 'You are validating the Zen Drama PLM production parity fixture.',
          tags: ['drama-production-parity', 'zen-plm', 'fixture'],
          change_summary: 'Seeded by Drama PLM production parity fixture.',
        }) as unknown as Record<string, unknown>
      } catch (error) {
        try {
          nativePromptWrite = await activeClient.createPromptNode({
            node_key: DRAMA_PRODUCTION_FIXTURE_PROMPT_KEY,
            name: String(promptRecord.name),
            description: 'Zen Drama PLM production parity fixture prompt.',
            category: 'drama',
            system: 'You are validating the Zen Drama PLM production parity fixture.',
            user_template: String(promptRecord.template),
          }) as unknown as Record<string, unknown>
        } catch (createError) {
          promptNativeError = errorMessage(createError)
        }
      }
      if (nativePromptWrite) {
        promptReadback = await readPromptRegistryEvidence(activeClient, DRAMA_PRODUCTION_FIXTURE_PROMPT_KEY)
      }

      const storedPrompt = {
        ...promptRecord,
        ...(nativePromptWrite ? {
          nativeRegistry: 'plotpilot-prompt-plaza',
          nativePromptWrite,
          nativePromptReadback: promptReadback.ok,
          nativePromptReadbackCount: promptReadback.count,
          nativePromptReadbackSource: promptReadback.source,
        } : {
          nativeRegistry: 'fallback',
          promptNativeError,
        }),
      }
      setNovels((current) => [novelWithChapter, ...current.filter((item) => item.id !== novelWithChapter.id)])
      setSelectedNovelId(novelWithChapter.id)
      setChapterEditor(toChapterEditor(chapter, { novelId: novelWithChapter.id }))
      setFeatureState((current) => {
        const prompts = [
          storedPrompt,
          ...(current.prompts ?? []).filter((prompt) => promptRecordKey(asRecord(prompt)) !== DRAMA_PRODUCTION_FIXTURE_PROMPT_KEY),
        ]
        return {
          ...current,
          prompts,
          promptStats: {
            ...(current.promptStats ?? {}),
            dramaSavedPrompts: prompts.length,
            dramaNativePromptWrites: metricNumber(asRecord(current.promptStats), ['dramaNativePromptWrites'])
              + (nativePromptWrite ? 1 : 0),
            dramaNativePromptReadbacks: metricNumber(asRecord(current.promptStats), ['dramaNativePromptReadbacks'])
              + (promptReadback.ok ? 1 : 0),
          },
          productionFixture: {
            fixtureId: DRAMA_PRODUCTION_FIXTURE_ID,
            name: 'Zen Drama PLM production parity fixture',
            projectId: novelWithChapter.id,
            chapterId: chapter.id,
            chapterNumber: chapter.number,
            promptNodeKey: DRAMA_PRODUCTION_FIXTURE_PROMPT_KEY,
            promptNative: Boolean(nativePromptWrite),
            promptReadback: promptReadback.ok,
            promptReadbackSource: promptReadback.source,
            promptReadbackCount: promptReadback.count,
            promptReadbackError: promptReadback.error,
            promptNativeError,
            pathHints: workspacePathHints(runtimeStatus),
            loadedAt: new Date().toISOString(),
            promptUpdatedAt: String(promptRecord.updated_at),
          },
          lastMessage: nativePromptWrite && promptReadback.ok
            ? '生产验收项目已载入，Prompt Plaza 原生写入和 readback 证据已生成。'
            : nativePromptWrite
              ? `生产验收项目已载入，Prompt 写入成功但 readback 未确认：${promptReadback.error ?? 'not found'}`
            : `生产验收项目已载入，Prompt 走 fallback：${promptNativeError ?? 'native endpoint unavailable'}`,
        }
      })
      await recordPlmProjectFile({
        novelId: novelWithChapter.id,
        type: 'plm.production.fixture.loaded',
        title: novelWithChapter.title,
        summary: {
            fixtureId: DRAMA_PRODUCTION_FIXTURE_ID,
            chapterId: chapter.id,
            chapterNumber: chapter.number,
            promptNative: Boolean(nativePromptWrite),
            promptReadback: promptReadback.ok,
          },
          payload: {
            novel: novelRecordSummary(novelWithChapter),
            chapter: chapterRecordSummary(chapter),
          prompt: storedPrompt,
        },
      })
      await recordPlmGraphEvent({
        type: 'plm.production.fixture.loaded',
        target: {
          novelId: novelWithChapter.id,
          chapterId: chapter.id,
        },
        status: 'ready',
        summary: 'Zen Drama PLM 生产闭环验收项目已载入',
        details: {
          fixtureId: DRAMA_PRODUCTION_FIXTURE_ID,
          promptNative: Boolean(nativePromptWrite),
          promptReadback,
          promptNativeError,
        },
      })
      await loadSelectedBible(novelWithChapter.id).catch(() => undefined)
      const [autopilotStatus, autopilotCircuitBreaker] = await Promise.all([
        activeClient.getAutopilotStatus(novelWithChapter.id).catch(() => null),
        activeClient.getAutopilotCircuitBreaker(novelWithChapter.id).catch(() => null),
      ])
      if (autopilotStatus || autopilotCircuitBreaker) {
        setFeatureState((current) => ({
          ...current,
          autopilotStatus: autopilotStatus as unknown as Record<string, unknown> | null,
          autopilotCircuitBreaker: autopilotCircuitBreaker as unknown as Record<string, unknown> | null,
        }))
      }
      await syncPostChapterMemoryEvidence({
        novelId: novelWithChapter.id,
        chapter,
        source: 'manual-save',
        fixtureSafe: true,
      })

      const hostedWriteEvidence = buildProductionFixtureHostedWriteEvidence(chapter)
      const autopilotEvidence = buildProductionFixtureAutopilotEvidence(chapter)
      setFeatureState((current) => ({
        ...current,
        hostedWriteSummary: hostedWriteEvidence.summary,
        hostedWriteEvents: hostedWriteEvidence.events as unknown as Array<Record<string, unknown>>,
        autopilotStatus: autopilotEvidence.status,
        autopilotCircuitBreaker: autopilotEvidence.breaker,
        autopilotEvents: autopilotEvidence.events as unknown as Array<Record<string, unknown>>,
        autopilotStatusEvents: autopilotEvidence.statusEvents as unknown as Array<Record<string, unknown>>,
        autopilotChapterEvents: autopilotEvidence.chapterEvents as unknown as Array<Record<string, unknown>>,
        autopilotChapterSnapshot: {
          chapterNumber: chapter.number,
          content: chapter.content ?? '',
          wordCount: chapter.word_count ?? countDraftText(chapter.content ?? ''),
          updatedAt: new Date().toISOString(),
        },
        productionFixture: {
          ...asRecord(current.productionFixture),
          hostedWriteReady: true,
          autopilotReady: true,
          stage9EvidenceSeededAt: new Date().toISOString(),
        },
        lastMessage: '生产验收项目已生成 Hosted Write、Memory Graph、Autopilot 的 ready 证据。',
      }))
      await recordPlmProjectFile({
        novelId: novelWithChapter.id,
        type: 'plm.production.stage9.readyEvidence',
        title: novelWithChapter.title,
        summary: {
          fixtureId: DRAMA_PRODUCTION_FIXTURE_ID,
          hostedWrite: hostedWriteEvidence.summary,
          autopilotStatus: autopilotEvidence.status,
          autopilotBreaker: autopilotEvidence.breaker,
        },
        payload: {
          hostedWriteEvents: hostedWriteEvidence.events,
          autopilotEvents: autopilotEvidence.events,
          autopilotStatusEvents: autopilotEvidence.statusEvents,
          autopilotChapterEvents: autopilotEvidence.chapterEvents,
        },
      })
      await recordPlmGraphEvent({
        type: 'plm.production.stage9.readyEvidence',
        actor: 'drama:plm-ui',
        source: 'production-fixture',
        target: {
          novelId: novelWithChapter.id,
          chapterId: chapter.id,
        },
        status: 'ready',
        summary: 'Stage 9.2 PLM 生产闭环 ready 证据已生成',
        details: {
          hostedWrite: hostedWriteEvidence.summary,
          autopilotStatus: autopilotEvidence.status,
          autopilotBreaker: autopilotEvidence.breaker,
        },
      })
    } catch (error) {
      productionFixtureLoadedRef.current = false
      setFeatureState((current) => ({
        ...current,
        productionFixture: {
          fixtureId: DRAMA_PRODUCTION_FIXTURE_ID,
          error: errorMessage(error),
          loadedAt: new Date().toISOString(),
        },
        lastMessage: `生产验收项目载入失败：${errorMessage(error)}`,
      }))
      reportPlotPilotError(error)
    } finally {
      setActiveJob(null)
    }
  }, [ensureRuntimeClient, loadSelectedBible, recordPlmGraphEvent, recordPlmProjectFile, runtimeStatus, syncPostChapterMemoryEvidence])

  const handleWritingSpecFailure = React.useCallback(async (
    error: unknown,
    args: {
      novelId: string
      chapterNumber: number
      writingSpecId?: string
    },
  ): Promise<boolean> => {
    const failure = extractPlotPilotWritingSpecFailure(error)
    if (!failure) return false

    const view = toWritingSpecFailureView(failure, args)
    setLastWritingSpecFailure(view)
    setChapterEditor((current) => (
      current?.novelId === args.novelId && current.chapterNumber === args.chapterNumber
        ? {
            ...current,
            loading: false,
            lastWritingSpecFailure: view,
          }
        : current
    ))

    await writeWritingSpecFailureToDramaGraph({
      api,
      graph: dramaGraph,
      loadGraph: loadCurrentDramaGraph,
      setGraph: setDramaGraph,
      failure: view,
    }).catch(() => false)
    return true
  }, [dramaGraph, loadCurrentDramaGraph])

  const refreshChapters = React.useCallback(async (novelId: string) => {
    const activeClient = await ensureRuntimeClient()
    const chapters = await activeClient.listChapters(novelId)
    setNovels((current) => current.map((novel) => (
      novel.id === novelId ? replaceNovelChapters(novel, chapters) : novel
    )))
  }, [ensureRuntimeClient])

  const openChapter = React.useCallback(async (novelId: string, chapterNumber: number) => {
    setChapterEditor((current) => ({
      novelId,
      chapterNumber,
      title: current?.novelId === novelId && current.chapterNumber === chapterNumber
        ? current.title
        : fallbackChapterTitle(chapterNumber),
      content: current?.novelId === novelId && current.chapterNumber === chapterNumber
        ? current.content
        : '',
      dirty: current?.novelId === novelId && current.chapterNumber === chapterNumber
          ? current.dirty
          : false,
      loading: true,
      lastWritingSpecFailure: lastWritingSpecFailure?.novelId === novelId && lastWritingSpecFailure.chapterNumber === chapterNumber
        ? lastWritingSpecFailure
        : null,
    }))
    try {
      const activeClient = await ensureRuntimeClient()
      let chapter: ChapterDTO
      try {
        chapter = await activeClient.getChapter(novelId, chapterNumber)
      } catch (error) {
        if (error instanceof PlotPilotHttpError && error.status === 404) {
          chapter = await activeClient.ensureChapter(novelId, chapterNumber, { title: fallbackChapterTitle(chapterNumber) })
        } else {
          throw error
        }
      }
      setNovels((current) => current.map((novel) => (
        novel.id === novelId ? upsertNovelChapter(novel, chapter) : novel
      )))
      setChapterEditor(toChapterEditor(chapter, {
        novelId,
        lastWritingSpecFailure: lastWritingSpecFailure?.novelId === novelId && lastWritingSpecFailure.chapterNumber === chapterNumber
          ? lastWritingSpecFailure
          : null,
      }))
    } catch (error) {
      setChapterEditor((current) => (
        current?.novelId === novelId && current.chapterNumber === chapterNumber
          ? { ...current, loading: false }
          : current
      ))
      reportPlotPilotError(error)
    }
  }, [ensureRuntimeClient, lastWritingSpecFailure])

  const saveChapter = React.useCallback(async (
    novelId: string,
    chapterNumber: number,
    content: string,
    revisionContext?: PlotPilotChapterRevisionContext,
  ) => {
    setActiveJob({
      id: `chapter:save:${novelId}:${chapterNumber}`,
      label: `保存第${chapterNumber}章`,
      phase: 'save',
      detail: `${countDraftText(content)} chars`,
    })
    try {
      const activeClient = await ensureRuntimeClient()
      const writingSpecId = activeWritingSpecId(writingSpec)
      const chapter = await activeClient.updateChapter(novelId, chapterNumber, {
        content,
        writing_spec_id: writingSpecId,
      })
      setNovels((current) => current.map((novel) => (
        novel.id === novelId ? upsertNovelChapter(novel, chapter) : novel
      )))
      setLastWritingSpecFailure((current) => (
        current?.novelId === novelId && current.chapterNumber === chapterNumber ? null : current
      ))
      setChapterEditor(toChapterEditor(chapter, { novelId }))
      await writeChapterDraftToDramaGraph({
        api,
        graph: dramaGraph,
        loadGraph: loadCurrentDramaGraph,
        setGraph: setDramaGraph,
        novelId,
        chapter,
        source: 'manual',
      })
      await recordPlmProjectFile({
        novelId,
        type: 'plm.chapter.saved',
        title: chapter.title,
        summary: chapterRecordSummary(chapter),
        payload: chapter,
      })
      if (revisionContext?.annotations) {
        await saveChapterAnnotations(novelId, chapterNumber, revisionContext.annotations)
      }
      await syncPostChapterMemoryEvidence({
        novelId,
        chapter,
        source: 'manual-save',
      })
    } catch (error) {
      await handleWritingSpecFailure(error, {
        novelId,
        chapterNumber,
        writingSpecId: activeWritingSpecId(writingSpec),
      })
      reportPlotPilotError(error)
    } finally {
      setActiveJob(null)
    }
  }, [dramaGraph, ensureRuntimeClient, handleWritingSpecFailure, loadCurrentDramaGraph, recordPlmProjectFile, saveChapterAnnotations, syncPostChapterMemoryEvidence, writingSpec])

  const generateChapter = React.useCallback(async (
    novelId: string,
    chapterNumber?: number,
    revisionContext?: PlotPilotChapterRevisionContext,
  ) => {
    const novel = novels.find((item) => item.id === novelId) ?? selectedNovel
    const currentChapterEditor = chapterEditor?.novelId === novelId ? chapterEditor : null
    const resolvedChapterNumber = chapterNumber
      ?? currentChapterEditor?.chapterNumber
      ?? novel?.chapters?.[0]?.number
      ?? 1

    if (
      currentChapterEditor?.chapterNumber === resolvedChapterNumber
      && currentChapterEditor.dirty
      && !window.confirm('当前章节正文还没保存，继续生成会覆盖编辑区内容。是否继续？')
    ) {
      return
    }

    setActiveJob({
      id: `chapter:generate:${novelId}:${resolvedChapterNumber}`,
      label: `生成第${resolvedChapterNumber}章`,
      phase: 'ensure_chapter',
      detail: novelId,
    })

    try {
      const activeClient = await ensureRuntimeClient()
      await recordPlmGraphEvent({
        type: 'plm.chapter.generate.requested',
        target: {
          novelId,
        },
        status: 'requested',
        summary: `请求生成第${resolvedChapterNumber}章`,
        details: {
          novelId,
          chapterNumber: resolvedChapterNumber,
        },
      })
      const ensuredChapter = await activeClient.ensureChapter(
        novelId,
        resolvedChapterNumber,
        { title: fallbackChapterTitle(resolvedChapterNumber) },
      )
      setNovels((current) => current.map((item) => (
        item.id === novelId ? upsertNovelChapter(item, ensuredChapter) : item
      )))
      setChapterEditor(toChapterEditor(ensuredChapter, { novelId }))

      const outline = buildChapterOutline(novel, ensuredChapter, currentChapterEditor)
      const resolvedRevisionContext = await resolveRevisionContext(novelId, resolvedChapterNumber, revisionContext)
      if (revisionContext?.annotations) {
        await saveChapterAnnotations(novelId, resolvedChapterNumber, revisionContext.annotations)
      }
      const revisionPromptMarkdown = buildRevisionPromptMarkdown(resolvedRevisionContext)
      const revisionMode = resolvedRevisionContext.annotations.length > 0 ? 'annotation_revision' : 'draft_generation'
      const modelRequirements = [
        outline,
        revisionPromptMarkdown,
      ].filter(Boolean).join('\n\n')
      setActiveJob((current) => current ? {
        ...current,
        phase: 'planning',
        detail: modelRequirements.length > 120 ? `${modelRequirements.slice(0, 120)}...` : modelRequirements,
      } : current)

      let generatedContent = ''
      let savedChapter: ChapterDTO | null = null
      const writingSpecId = activeWritingSpecId(writingSpec)

      try {
        setActiveJob((current) => current ? {
          ...current,
          phase: 'ai_invocation',
          detail: 'chapter.generate.prose / DIRECT',
        } : current)
        const invocation = await activeClient.createInvocation({
          operation: 'chapter.generate.prose',
          node_key: 'chapter-prose-generation',
          policy: 'DIRECT',
          context: {
            novel_id: novelId,
            chapter_number: resolvedChapterNumber,
            revision_mode: revisionMode,
            revision_annotation_count: resolvedRevisionContext.annotations.length,
            ...(writingSpecId ? { writing_spec_id: writingSpecId } : {}),
          },
          variables: {
            novel_title: novel?.title || novelId,
            chapter_number: resolvedChapterNumber,
            chapter_title: ensuredChapter.title || fallbackChapterTitle(resolvedChapterNumber),
            chapter_outline: modelRequirements,
            target_words: novel?.target_words_per_chapter ?? 2500,
            user_requirements: modelRequirements,
            current_draft: currentChapterEditor?.content ?? ensuredChapter.content ?? '',
            revision_mode: revisionMode,
            revision_context_markdown: resolvedRevisionContext.markdown,
            ...(writingSpecId ? { writing_spec_id: writingSpecId } : {}),
          },
          metadata: {
            source: 'drama-plm',
            revision_mode: revisionMode,
            revision_annotation_count: resolvedRevisionContext.annotations.length,
            ...(writingSpecId ? { writing_spec_id: writingSpecId } : {}),
          },
        })

        if (invocation.session?.status !== 'completed') {
          throw new Error(`PlotPilot AI Invocation 未完成：${invocation.session?.status ?? 'unknown'}`)
        }

        generatedContent = invocation.attempt?.content ?? ''
        setActiveJob((current) => current ? {
          ...current,
          phase: 'projection',
          progress: 0.9,
          detail: invocation.commit?.status ?? invocation.next_action ?? 'completed',
        } : current)

        const projectedChapter = await activeClient.getChapter(novelId, resolvedChapterNumber)
        if (projectedChapter.content?.trim()) {
          generatedContent = projectedChapter.content
          savedChapter = projectedChapter
        } else if (generatedContent.trim()) {
          savedChapter = await activeClient.updateChapter(novelId, resolvedChapterNumber, {
            content: generatedContent,
            writing_spec_id: writingSpecId,
          })
        }

        if (savedChapter) {
          setChapterEditor(toChapterEditor(savedChapter, { novelId }))
        }
      } catch (error) {
        if (!shouldFallbackToLegacyChapterStream(error)) {
          throw error
        }

        setActiveJob((current) => current ? {
          ...current,
          phase: 'legacy_stream',
          detail: 'AI Invocation 不可用，回退旧 SSE。',
        } : current)

        for await (const event of activeClient.generateChapterStream(novelId, {
          chapter_number: resolvedChapterNumber,
          outline: modelRequirements,
          allow_evolution_gate_bypass: true,
          regeneration_guidance: revisionPromptMarkdown || undefined,
          revision_mode: revisionMode,
          revision_context_markdown: resolvedRevisionContext.markdown,
          prompt_variables: {
            revision_mode: revisionMode,
            revision_context_markdown: resolvedRevisionContext.markdown,
          },
        })) {
          if (event.type === 'phase') {
            setActiveJob((current) => current ? {
              ...current,
              phase: event.phase,
              detail: event.message ?? event.phase,
            } : current)
          } else if (event.type === 'llm_chunk') {
            setActiveJob((current) => current ? {
              ...current,
              phase: event.stage || 'llm',
              detail: `${event.text.length} chars planning`,
            } : current)
          } else if (event.type === 'beats_generated') {
            setActiveJob((current) => current ? {
              ...current,
              phase: 'beats_generated',
              detail: `${event.beats.length} beats`,
            } : current)
          } else if (event.type === 'chunk') {
            generatedContent += event.text
            setChapterEditor((current) => (
              current?.novelId === novelId && current.chapterNumber === resolvedChapterNumber
                ? {
                    ...current,
                    content: generatedContent,
                    wordCount: countDraftText(generatedContent),
                    dirty: true,
                    loading: false,
                  }
                : current
            ))
            setActiveJob((current) => current ? {
              ...current,
              phase: 'prose',
              detail: `${event.stats.chars || countDraftText(generatedContent)} chars / ${event.stats.chunks} chunks`,
            } : current)
          } else if (event.type === 'done') {
            generatedContent = event.content || generatedContent
            setChapterEditor((current) => (
              current?.novelId === novelId && current.chapterNumber === resolvedChapterNumber
                ? {
                    ...current,
                    content: generatedContent,
                    wordCount: countDraftText(generatedContent),
                    dirty: true,
                    loading: false,
                  }
                : current
            ))
            setActiveJob((current) => current ? {
              ...current,
              phase: 'save',
              progress: 0.95,
              detail: `${event.chars || countDraftText(generatedContent)} chars`,
            } : current)
          } else if (event.type === 'approval_required') {
            throw new Error('PlotPilot 返回生成前审阅请求；Drama 现在只支持直接生成，请在 PlotPilot runtime 配置为直接调用后再试。')
          } else if (event.type === 'error') {
            throw new Error(event.message)
          }
        }
      }

      if (!generatedContent.trim()) {
        throw new Error('章节生成完成，但没有返回正文。')
      }

      savedChapter ??= await activeClient.updateChapter(novelId, resolvedChapterNumber, {
        content: generatedContent,
        writing_spec_id: writingSpecId,
      })
      setNovels((current) => current.map((item) => (
        item.id === novelId ? upsertNovelChapter(item, savedChapter) : item
      )))
      setLastWritingSpecFailure((current) => (
        current?.novelId === novelId && current.chapterNumber === resolvedChapterNumber ? null : current
      ))
      setChapterEditor(toChapterEditor(savedChapter, { novelId }))
      await writeChapterDraftToDramaGraph({
        api,
        graph: dramaGraph,
        loadGraph: loadCurrentDramaGraph,
        setGraph: setDramaGraph,
        novelId,
        chapter: savedChapter,
        source: 'plotpilot',
      })
      await recordPlmProjectFile({
        novelId,
        type: 'plm.chapter.generated',
        title: savedChapter.title,
        summary: chapterRecordSummary(savedChapter),
        payload: {
          chapter: savedChapter,
          outline,
          revisionMode,
          revisionAnnotationCount: resolvedRevisionContext.annotations.length,
          revisionContextMarkdown: resolvedRevisionContext.markdown,
          writingSpecId,
        },
      })
      await recordPlmGraphEvent({
        type: 'plm.chapter.generated',
        target: {
          novelId,
          chapterId: savedChapter.id,
        },
        status: 'completed',
        summary: `${savedChapter.title || fallbackChapterTitle(savedChapter.number)} 已生成`,
        details: {
          novelId,
          chapterId: savedChapter.id,
          chapterNumber: savedChapter.number,
          title: savedChapter.title,
          wordCount: savedChapter.word_count ?? countDraftText(generatedContent),
          writingSpecId,
          revisionMode,
          revisionAnnotationCount: resolvedRevisionContext.annotations.length,
        },
      })
      setActiveJob((current) => current ? {
        ...current,
        phase: 'done',
        progress: 1,
        detail: `${savedChapter.word_count ?? countDraftText(generatedContent)} words`,
      } : current)
    } catch (error) {
      const handledWritingSpecFailure = await handleWritingSpecFailure(error, {
        novelId,
        chapterNumber: resolvedChapterNumber,
        writingSpecId: activeWritingSpecId(writingSpec),
      })
      if (!handledWritingSpecFailure) {
        await recordPlmGraphEvent({
          type: 'plm.chapter.generate.failed',
          target: {
            novelId,
          },
          severity: 'error',
          status: 'failed',
          summary: `第${resolvedChapterNumber}章生成失败`,
          details: {
            novelId,
            chapterNumber: resolvedChapterNumber,
            message: errorMessage(error),
          },
        })
      }
      reportPlotPilotError(error)
    } finally {
      setActiveJob(null)
    }
  }, [chapterEditor, dramaGraph, ensureRuntimeClient, handleWritingSpecFailure, loadCurrentDramaGraph, novels, recordPlmGraphEvent, recordPlmProjectFile, resolveRevisionContext, saveChapterAnnotations, selectedNovel, writingSpec])

  const createNovelFromOnboarding = React.useCallback(async (draft: PlotPilotOnboardingDraft) => {
    setActiveJob({
      id: `novel:create:${normalizeNovelId(draft.title)}`,
      label: '创建书目',
      phase: 'onboarding',
      detail: draft.title,
    })
    try {
      const activeClient = await ensureRuntimeClient()
      const novel = await activeClient.createNovel(toNovelCreateRequest(draft))
      setNovels((current) => [novel, ...current.filter((item) => item.id !== novel.id)])
      setSelectedNovelId(novel.id)
      setFeatureState((current) => ({
        ...current,
        lastMessage: `书目已创建：${novel.title}`,
      }))
      await recordPlmProjectFile({
        novelId: novel.id,
        type: 'plm.novel.created',
        title: novel.title,
        summary: novelRecordSummary(novel),
        payload: novel,
      })
      await loadSelectedBible(novel.id).catch(() => undefined)
    } catch (error) {
      reportPlotPilotError(error)
    } finally {
      setActiveJob(null)
    }
  }, [ensureRuntimeClient, loadSelectedBible, recordPlmProjectFile])

  const createNovel = React.useCallback(async () => {
    const title = window.prompt('书名', 'Drama 长篇项目')
    if (!title) return
    await createNovelFromOnboarding({
      title,
      author: 'Drama',
      premise: '',
      genre: '',
      worldPreset: '',
      storyStructure: '',
      pacingControl: '',
      writingStyle: '',
      specialRequirements: '',
      lengthTier: '',
      targetChapters: 30,
      targetWordsPerChapter: 2500,
    })
  }, [createNovelFromOnboarding])

  const saveNovelSetup = React.useCallback(async (novelId: string, draft: PlotPilotOnboardingDraft) => {
    setActiveJob({
      id: `novel:update:${novelId}`,
      label: '保存书目设定',
      phase: 'onboarding',
      detail: novelId,
    })
    try {
      const activeClient = await ensureRuntimeClient()
      const novel = await activeClient.updateNovel(novelId, toNovelUpdateRequest(draft))
      setNovels((current) => [novel, ...current.filter((item) => item.id !== novel.id)])
      setSelectedNovelId(novel.id)
      setFeatureState((current) => ({
        ...current,
        lastMessage: `书目设定已保存：${novel.title}`,
      }))
      await recordPlmProjectFile({
        novelId: novel.id,
        type: 'plm.novel.updated',
        title: novel.title,
        summary: novelRecordSummary(novel),
        payload: {
          novel,
          draft,
        },
      })
    } catch (error) {
      reportPlotPilotError(error)
    } finally {
      setActiveJob(null)
    }
  }, [ensureRuntimeClient, recordPlmProjectFile])

  const importStorylet = React.useCallback(async () => {
    setActiveJob({
      id: 'storylet:import',
      label: '导入 Storylet',
      phase: 'read_graph',
      detail: '读取 Storylet 当前图状态。',
    })
    try {
      const activeClient = await ensureRuntimeClient()
      const snapshot = await api.loadStoryletBridgeSnapshot()
      setActiveJob((current) => current ? {
        ...current,
        phase: 'create_novel',
        detail: `映射 ${snapshot.graph.cardCount} 张卡片 / ${snapshot.graph.connectionCount} 条边。`,
      } : current)

      let novel: NovelDTO
      try {
        novel = await activeClient.createNovel(snapshot.createNovel)
      } catch (error) {
        if (error instanceof PlotPilotHttpError && (error.status === 400 || error.status === 409)) {
          novel = await activeClient.getNovel(snapshot.createNovel.novel_id)
        } else {
          throw error
        }
      }

      setNovels((current) => [novel, ...current.filter((item) => item.id !== novel.id)])
      setSelectedNovelId(novel.id)
      await recordPlmProjectFile({
        novelId: novel.id,
        type: 'plm.storylet.imported',
        title: novel.title,
        summary: {
          ...novelRecordSummary(novel),
          storyletCardCount: snapshot.graph.cardCount,
          storyletConnectionCount: snapshot.graph.connectionCount,
        },
        payload: {
          novel,
          snapshot,
        },
      })
      await loadSelectedBible(novel.id)
      void loadNovels()
    } catch (error) {
      reportPlotPilotError(error)
    } finally {
      setActiveJob(null)
    }
  }, [ensureRuntimeClient, loadNovels, loadSelectedBible, recordPlmProjectFile])

  const prepareFirstChapter = React.useCallback(async (novelId: string) => {
    setActiveJob({
      id: `chapter:ensure:${novelId}:1`,
      label: '准备第1章',
      phase: 'ensure_chapter',
      detail: novelId,
    })
    try {
      const activeClient = await ensureRuntimeClient()
      const chapter = await activeClient.ensureChapter(novelId, 1, { title: '第1章' })
      setNovels((current) => current.map((novel) => (
        novel.id === novelId ? upsertNovelChapter(novel, chapter) : novel
      )))
      setChapterEditor(toChapterEditor(chapter, { novelId }))
      const chapters = await activeClient.listChapters(novelId)
      setNovels((current) => current.map((novel) => (
        novel.id === novelId ? replaceNovelChapters(novel, chapters) : novel
      )))
      const refreshedChapter = chapters.find((item) => item.number === 1) ?? chapter
      setChapterEditor(toChapterEditor(refreshedChapter, { novelId }))
      await recordPlmProjectFile({
        novelId,
        type: 'plm.chapter.prepared',
        title: refreshedChapter.title,
        summary: chapterRecordSummary(refreshedChapter),
        payload: refreshedChapter,
      })
    } catch (error) {
      reportPlotPilotError(error)
    } finally {
      setActiveJob(null)
    }
  }, [ensureRuntimeClient, recordPlmProjectFile])

  const writeBackChapter = React.useCallback(async (novelId: string, chapterNumber?: number) => {
    setActiveJob({
      id: `drama-graph:writeback:${novelId}:${chapterNumber ?? 'first'}`,
      label: '回写 Drama Graph',
      phase: 'load_chapter',
      detail: novelId,
    })
    try {
      const activeClient = await ensureRuntimeClient()
      const chapters = await activeClient.listChapters(novelId)
      const selectedChapter = chapterNumber
        ? chapters.find((chapter) => chapter.number === chapterNumber)
        : [...chapters].sort((left, right) => left.number - right.number)[0]
      if (!selectedChapter) {
        window.alert('当前书目还没有章节。')
        return
      }
      if (
        chapterEditor?.novelId === novelId
        && chapterEditor.chapterNumber === selectedChapter.number
        && chapterEditor.dirty
      ) {
        window.alert('当前章节正文还没保存。先保存章节正文后再回写 Drama Graph。')
        return
      }
      const chapter = await activeClient.getChapter(novelId, selectedChapter.number)
      if (!chapter.content?.trim()) {
        window.alert('当前章节还没有正文。先生成或保存章节正文后再回写 Drama Graph。')
        return
      }
      setActiveJob((current) => current ? {
        ...current,
        phase: 'write_drama_graph',
        detail: `${chapter.title} / ${chapter.word_count ?? 0} words`,
      } : current)
      const wroteDramaGraph = await writeChapterDraftToDramaGraph({
        api,
        graph: dramaGraph,
        loadGraph: loadCurrentDramaGraph,
        setGraph: setDramaGraph,
        novelId,
        chapter,
        source: 'plotpilot',
      })
      let storyletMessage = ''
      try {
        const result = await api.writeStoryletChapterFromPlotPilot({ chapter })
        storyletMessage = `\n兼容 Storylet JSON：${result.summary.updatedSceneCount} 个场景，备份：${result.backupPath}`
      } catch {
        storyletMessage = '\nStorylet JSON 兼容写回未执行；Drama Graph 已作为主数据保存。'
      }
      await syncPostChapterMemoryEvidence({
        novelId,
        chapter,
        source: 'plotpilot-writeback',
      })
      window.alert(wroteDramaGraph
        ? `已回写 Drama Graph。${storyletMessage}`
        : `没有找到匹配的 Drama 章节节点，未写入 Drama Graph。${storyletMessage}`)
    } catch (error) {
      reportPlotPilotError(error)
    } finally {
      setActiveJob(null)
    }
  }, [chapterEditor, dramaGraph, ensureRuntimeClient, loadCurrentDramaGraph, syncPostChapterMemoryEvidence])

  const generateBible = React.useCallback(async (novelId: string) => {
    setActiveJob({
      id: `bible:${novelId}`,
      label: '生成 Bible',
      phase: 'start',
      detail: novelId,
    })
    try {
      const activeClient = await ensureRuntimeClient()
      for await (const event of activeClient.generateBibleStream(novelId, { stage: 'all' })) {
        if (event.type === 'phase') {
          setActiveJob((current) => current ? { ...current, phase: event.phase, detail: event.message } : current)
        } else if (event.type === 'data') {
          setActiveJob((current) => current ? { ...current, detail: event.data_type } : current)
        } else if (event.type === 'done') {
          setActiveJob((current) => current ? { ...current, progress: 1, phase: 'done', detail: event.message } : current)
        }
      }
      await loadSelectedBible(novelId)
      await loadNovels()
      const generatedBible = await activeClient.getBible(novelId).catch(() => null)
      await recordPlmProjectFile({
        novelId,
        type: 'plm.bible.generated',
        summary: generatedBible ? bibleRecordSummary(generatedBible) : {},
        payload: generatedBible,
      })
    } catch (error) {
      reportPlotPilotError(error)
    } finally {
      setActiveJob(null)
    }
  }, [ensureRuntimeClient, loadNovels, loadSelectedBible, recordPlmProjectFile])

  const refreshSetup = React.useCallback(async (novelId: string) => {
    setFeatureState((current) => ({ ...current, loadingKey: 'setup', lastMessage: '读取剧情总纲。' }))
    try {
      const activeClient = await ensureRuntimeClient()
      const result = await activeClient.getPlotOutline(novelId)
      setFeatureState((current) => ({
        ...current,
        loadingKey: null,
        plotOutline: result.plot_outline ?? null,
        lastMessage: result.invocation_next_action || '剧情总纲已刷新。',
      }))
    } catch (error) {
      setFeatureState((current) => ({ ...current, loadingKey: null, lastMessage: errorMessage(error) }))
      reportPlotPilotError(error)
    }
  }, [ensureRuntimeClient])

  const appendSetupEvent = React.useCallback((event: PlotPilotSetupStreamEvent) => {
    const eventRecord = asRecord(event)
    setFeatureState((current) => ({
      ...current,
      setupEvents: [
        {
          ...eventRecord,
          id: `${String(eventRecord.type ?? 'event')}:${Date.now()}`,
          timestamp: String(eventRecord.timestamp ?? new Date().toISOString()),
        },
        ...(current.setupEvents ?? []),
      ].slice(0, 60),
      lastMessage: String(eventRecord.message ?? eventRecord.type ?? current.lastMessage ?? ''),
    }))
  }, [])

  const setNovelAutoApproveMode = React.useCallback(async (novelId: string, enabled: boolean) => {
    setFeatureState((current) => ({ ...current, loadingKey: 'setup', lastMessage: enabled ? '开启全自动审阅。' : '关闭全自动审阅。' }))
    try {
      const activeClient = await ensureRuntimeClient()
      const novel = await activeClient.setNovelAutoApproveMode(novelId, enabled)
      setNovels((current) => [novel, ...current.filter((item) => item.id !== novel.id)])
      await recordPlmProjectFile({
        novelId,
        type: 'plm.autoApprove.updated',
        title: novel.title,
        summary: {
          ...novelRecordSummary(novel),
          autoApproveMode: enabled,
        },
        payload: novel,
      })
      setFeatureState((current) => ({
        ...current,
        loadingKey: null,
        autopilotStatus: {
          ...asRecord(current.autopilotStatus),
          auto_approve_mode: enabled,
        },
        lastMessage: enabled ? '全自动审阅已开启。' : '全自动审阅已关闭。',
      }))
    } catch (error) {
      setFeatureState((current) => ({ ...current, loadingKey: null, lastMessage: errorMessage(error) }))
      reportPlotPilotError(error)
    }
  }, [ensureRuntimeClient, recordPlmProjectFile])

  const savePlotOutline = React.useCallback(async (novelId: string, outline: Record<string, unknown>) => {
    setActiveJob({
      id: `plot-outline:save:${novelId}`,
      label: '保存剧情总纲',
      phase: 'setup',
      detail: novelId,
    })
    setFeatureState((current) => ({ ...current, loadingKey: 'setup', lastMessage: '保存剧情总纲到 PlotPilot。' }))
    try {
      const activeClient = await ensureRuntimeClient()
      const result = await activeClient.savePlotOutline(novelId, {
        plot_outline: outline as PlotPilotPlotOutlineItem,
      })
      const plotOutline = result.plot_outline ?? outline
      setFeatureState((current) => ({
        ...current,
        loadingKey: null,
        plotOutline: asRecord(plotOutline),
        lastMessage: '剧情总纲已保存。',
      }))
      await recordPlmProjectFile({
        novelId,
        type: 'plm.plotOutline.saved',
        summary: {
          keyCount: Object.keys(asRecord(plotOutline)).length,
        },
        payload: {
          result,
          plotOutline,
        },
      })
      await writePlotPilotGraphDraft({
        api,
        graph: dramaGraph,
        loadGraph: loadCurrentDramaGraph,
        setGraph: setDramaGraph,
        draftId: `graph:${novelId}:plotpilot-plot-outline`,
        content: plotPilotGraphDraftContent('PlotPilot 剧情总纲', plotOutline),
        status: 'draft',
        fields: [
          {
            key: 'plmNovelId',
            label: 'PLM 书目 ID',
            value: novelId,
            text: novelId,
          },
          {
            key: 'plotOutline',
            label: '剧情总纲',
            value: plotOutline,
            text: JSON.stringify(plotOutline, null, 2),
          },
        ],
      }).catch(() => false)
    } catch (error) {
      setFeatureState((current) => ({ ...current, loadingKey: null, lastMessage: errorMessage(error) }))
      reportPlotPilotError(error)
    } finally {
      setActiveJob(null)
    }
  }, [dramaGraph, ensureRuntimeClient, loadCurrentDramaGraph, recordPlmProjectFile])

  const suggestMainPlotOptions = React.useCallback(async (novelId: string) => {
    setActiveJob({
      id: `main-plot-options:${novelId}`,
      label: '生成主线候选',
      phase: 'setup',
      detail: novelId,
    })
    setFeatureState((current) => ({
      ...current,
      loadingKey: 'setup',
      setupEvents: [],
      lastMessage: '生成主线候选。',
    }))
    try {
      const activeClient = await ensureRuntimeClient()
      let invocationSessionId = ''
      for await (const event of activeClient.suggestMainPlotOptionsStream(novelId)) {
        appendSetupEvent(event)
        const eventRecord = asRecord(event)
        if (event.type === 'approval_required') {
          invocationSessionId = String(eventRecord.session_id ?? '')
          setFeatureState((current) => ({
            ...current,
            lastMessage: `主线候选进入 AI Invocation：${invocationSessionId}`,
          }))
        } else if (event.type === 'done') {
          invocationSessionId = String(eventRecord.invocation_session_id ?? invocationSessionId)
          const plotOptions = recordArray(eventRecord.plot_options)
          if (plotOptions.length > 0) {
            setFeatureState((current) => ({
              ...current,
              mainPlotOptions: plotOptions,
            }))
          }
        } else if (event.type === 'error') {
          throw new Error(String(eventRecord.message ?? '主线候选生成失败'))
        }
      }
      if (invocationSessionId) {
        const invocation = await activeClient.getInvocation(invocationSessionId).catch(() => null)
        if (invocation) {
          setFeatureState((current) => ({
            ...current,
            activeInvocation: invocation as unknown as Record<string, unknown>,
          }))
        }
      }
      setFeatureState((current) => ({ ...current, loadingKey: null }))
    } catch (error) {
      setFeatureState((current) => ({ ...current, loadingKey: null, lastMessage: errorMessage(error) }))
      reportPlotPilotError(error)
    } finally {
      setActiveJob(null)
    }
  }, [appendSetupEvent, ensureRuntimeClient])

  const generatePlotOutline = React.useCallback(async (novelId: string) => {
    setActiveJob({
      id: `plot-outline:${novelId}`,
      label: '生成剧情总纲',
      phase: 'setup',
      detail: novelId,
    })
    setFeatureState((current) => ({ ...current, loadingKey: 'setup', lastMessage: '创建剧情总纲 AI Invocation。' }))
    try {
      const activeClient = await ensureRuntimeClient()
      let invocationSessionId = ''
      let streamedOutline: PlotPilotPlotOutlineItem | null = null
      for await (const event of activeClient.generatePlotOutlineStream(novelId)) {
        appendSetupEvent(event)
        const eventRecord = asRecord(event)
        if (event.type === 'phase') {
          const phase = String(eventRecord.phase ?? 'setup')
          const detail = String(eventRecord.message ?? phase)
          setActiveJob((current) => current ? {
            ...current,
            phase,
            detail,
          } : current)
        } else if (event.type === 'approval_required') {
          invocationSessionId = String(eventRecord.session_id ?? '')
          setFeatureState((current) => ({
            ...current,
            lastMessage: `剧情总纲进入 AI Invocation：${invocationSessionId}`,
          }))
        } else if (event.type === 'done') {
          invocationSessionId = String(eventRecord.invocation_session_id ?? invocationSessionId)
          streamedOutline = asRecord(eventRecord.plot_outline) as PlotPilotPlotOutlineItem
          if (Object.keys(streamedOutline).length === 0) streamedOutline = null
        } else if (event.type === 'error') {
          throw new Error(String(eventRecord.message ?? '剧情总纲生成失败'))
        }
      }
      setFeatureState((current) => ({
        ...current,
        loadingKey: null,
        plotOutline: streamedOutline ? asRecord(streamedOutline) : current.plotOutline ?? null,
        lastMessage: invocationSessionId
          ? `剧情总纲进入 AI Invocation：${invocationSessionId}`
          : '剧情总纲生成请求已完成。',
      }))
      if (invocationSessionId) {
        const invocation = await activeClient.getInvocation(invocationSessionId).catch(() => null)
        if (invocation) {
          setFeatureState((current) => ({
            ...current,
            activeInvocation: invocation as unknown as Record<string, unknown>,
          }))
        }
      }
      await refreshSetup(novelId).catch(() => undefined)
      const finalOutline = streamedOutline ?? (await activeClient.getPlotOutline(novelId).catch(() => null))?.plot_outline
      if (finalOutline) {
        await recordPlmProjectFile({
          novelId,
          type: 'plm.plotOutline.generated',
          summary: {
            invocationSessionId,
            keyCount: Object.keys(asRecord(finalOutline)).length,
          },
          payload: {
            invocationSessionId,
            plotOutline: finalOutline,
          },
        })
        await writePlotPilotGraphDraft({
          api,
          graph: dramaGraph,
          loadGraph: loadCurrentDramaGraph,
          setGraph: setDramaGraph,
          draftId: `graph:${novelId}:plotpilot-plot-outline`,
          content: plotPilotGraphDraftContent('PlotPilot 剧情总纲', finalOutline),
          status: 'draft',
          fields: [
            {
              key: 'plmNovelId',
              label: 'PLM 书目 ID',
              value: novelId,
              text: novelId,
            },
            {
              key: 'plotOutline',
              label: '剧情总纲',
              value: finalOutline,
              text: JSON.stringify(finalOutline, null, 2),
            },
          ],
        }).catch(() => false)
      }
    } catch (error) {
      setFeatureState((current) => ({ ...current, loadingKey: null, lastMessage: errorMessage(error) }))
      reportPlotPilotError(error)
    } finally {
      setActiveJob(null)
    }
  }, [appendSetupEvent, dramaGraph, ensureRuntimeClient, loadCurrentDramaGraph, recordPlmProjectFile, refreshSetup])

  const refreshPlanning = React.useCallback(async (novelId: string) => {
    setFeatureState((current) => ({ ...current, loadingKey: 'planning', lastMessage: '读取规划结构树。' }))
    try {
      const activeClient = await ensureRuntimeClient()
      const structure = await activeClient.getPlanningStructure(novelId)
      setFeatureState((current) => ({
        ...current,
        loadingKey: null,
        planningStructure: asRecord(structure.data ?? structure),
        lastMessage: '规划结构已刷新。',
      }))
    } catch (error) {
      setFeatureState((current) => ({ ...current, loadingKey: null, lastMessage: errorMessage(error) }))
      reportPlotPilotError(error)
    }
  }, [ensureRuntimeClient])

  const generateMacroPlan = React.useCallback(async (novelId: string) => {
    setActiveJob({
      id: `macro-plan:${novelId}`,
      label: '生成宏观规划',
      phase: 'planning',
      detail: novelId,
    })
    setFeatureState((current) => ({ ...current, loadingKey: 'planning', lastMessage: '正在生成部/卷/幕结构。' }))
    try {
      const activeClient = await ensureRuntimeClient()
      const result = await activeClient.planNovel(novelId, { mode: 'initial', dry_run: false })
      setFeatureState((current) => ({
        ...current,
        planningResult: asRecord(result),
        lastMessage: result.message || '宏观规划已完成。',
      }))
      await recordPlmProjectFile({
        novelId,
        type: 'plm.planning.macroGenerated',
        summary: {
          message: result.message,
        },
        payload: result,
      })
      await refreshPlanning(novelId).catch(() => undefined)
    } catch (error) {
      setFeatureState((current) => ({ ...current, loadingKey: null, lastMessage: errorMessage(error) }))
      reportPlotPilotError(error)
    } finally {
      setFeatureState((current) => ({ ...current, loadingKey: null }))
      setActiveJob(null)
    }
  }, [ensureRuntimeClient, recordPlmProjectFile, refreshPlanning])

  const continuePlanning = React.useCallback(async (novelId: string, currentChapter: number) => {
    setActiveJob({
      id: `continue-plan:${novelId}:${currentChapter}`,
      label: '续规划',
      phase: 'planning',
      detail: `chapter ${currentChapter}`,
    })
    setFeatureState((current) => ({ ...current, loadingKey: 'planning', lastMessage: `从第${currentChapter}章续规划。` }))
    try {
      const activeClient = await ensureRuntimeClient()
      const result = await activeClient.continuePlanning(novelId, { current_chapter: currentChapter })
      setFeatureState((current) => ({
        ...current,
        loadingKey: null,
        planningResult: asRecord(result),
        lastMessage: '连续规划已完成。',
      }))
      await recordPlmProjectFile({
        novelId,
        type: 'plm.planning.continued',
        summary: {
          currentChapter,
        },
        payload: result,
      })
      await refreshPlanning(novelId).catch(() => undefined)
    } catch (error) {
      setFeatureState((current) => ({ ...current, loadingKey: null, lastMessage: errorMessage(error) }))
      reportPlotPilotError(error)
    } finally {
      setActiveJob(null)
    }
  }, [ensureRuntimeClient, recordPlmProjectFile, refreshPlanning])

  const generateBeat = React.useCallback(async (novelId: string) => {
    const novel = novels.find((item) => item.id === novelId) ?? selectedNovel
    const currentChapterEditor = chapterEditor?.novelId === novelId ? chapterEditor : null
    const chapterNumber = currentChapterEditor?.chapterNumber ?? novel?.chapters?.[0]?.number ?? 1

    setActiveJob({
      id: `beat:${novelId}:${chapterNumber}`,
      label: `生成第${chapterNumber}章 Beat`,
      phase: 'beat_sheet',
      detail: novelId,
    })
    try {
      const activeClient = await ensureRuntimeClient()
      const chapter = await activeClient.ensureChapter(novelId, chapterNumber, { title: fallbackChapterTitle(chapterNumber) })
      const beatSheet = await activeClient.generateBeatSheet({
        chapter_id: chapter.id,
        outline: buildChapterOutline(novel, chapter, currentChapterEditor),
      })
      setFeatureState((current) => ({
        ...current,
        beatSheet: beatSheet as unknown as Record<string, unknown>,
        lastMessage: `第${chapterNumber}章 Beat Sheet 已生成。`,
      }))
      await recordPlmProjectFile({
        novelId,
        type: 'plm.beatSheet.generated',
        title: chapter.title,
        summary: chapterRecordSummary(chapter),
        payload: {
          chapter,
          beatSheet,
        },
      })
    } catch (error) {
      reportPlotPilotError(error)
    } finally {
      setActiveJob(null)
    }
  }, [chapterEditor, ensureRuntimeClient, novels, recordPlmProjectFile, selectedNovel])

  const appendHostedWriteEvent = React.useCallback((
    event: PlotPilotHostedWriteStreamEvent,
    range: {
      fromChapter: number
      toChapter: number
      autoSave: boolean
      autoOutline: boolean
    },
  ) => {
    const eventRecord = asRecord(event)
    const type = String(eventRecord.type ?? 'unknown')
    const chapter = Number(eventRecord.chapter_number ?? eventRecord.chapter)
    const stats = asRecord(eventRecord.stats)
    const text = typeof eventRecord.text === 'string' ? eventRecord.text : ''

    setFeatureState((current) => {
      const previousSummary = asRecord(current.hostedWriteSummary)
      const previousSavedChapters = Array.isArray(previousSummary.savedChapters)
        ? previousSummary.savedChapters.map((value) => Number(value)).filter(Number.isFinite)
        : []
      const savedChapters = type === 'saved' && Number.isFinite(chapter)
        ? Array.from(new Set([...previousSavedChapters, chapter])).sort((left, right) => left - right)
        : previousSavedChapters
      const chunkCount = Number(previousSummary.chunkCount ?? 0) + (type === 'chunk' ? 1 : 0)
      const charCount = Number(previousSummary.charCount ?? 0) + (type === 'chunk' ? countDraftText(text) : 0)
      const totalChapters = Math.max(1, range.toChapter - range.fromChapter + 1)

      return {
        ...current,
        hostedWriteSummary: {
          ...previousSummary,
          ...range,
          lastType: type,
          currentChapter: Number.isFinite(chapter) ? chapter : previousSummary.currentChapter,
          savedChapters,
          savedCount: savedChapters.length,
          totalChapters,
          chunkCount,
          charCount: Number(stats.chars ?? charCount),
          updatedAt: new Date().toISOString(),
        },
        hostedWriteEvents: [
          {
            ...eventRecord,
            id: `${type}:${String(eventRecord.session_id ?? eventRecord.chapter ?? Date.now())}:${Date.now()}`,
            timestamp: String(eventRecord.timestamp ?? new Date().toISOString()),
          },
          ...(current.hostedWriteEvents ?? []),
        ].slice(0, 160),
        lastMessage: String(eventRecord.message ?? eventRecord.type ?? current.lastMessage ?? ''),
      }
    })
  }, [])

  const writeHostedWriteEventToDramaGraph = React.useCallback(async (
    novelId: string,
    event: PlotPilotHostedWriteStreamEvent,
    range: {
      fromChapter: number
      toChapter: number
      autoSave: boolean
      autoOutline: boolean
    },
  ) => {
    const eventRecord = asRecord(event)
    const type = String(eventRecord.type ?? 'unknown')
    const shouldPersist = [
      'session',
      'chapter_start',
      'saved',
      'approval_required',
      'session_done',
      'error',
    ].includes(type)
    if (!shouldPersist) return null

    const chapter = Number(eventRecord.chapter_number ?? eventRecord.chapter)
    return recordPlmGraphEvent({
      type: `plm.hostedWrite.${type}`,
      target: {
        novelId,
        ...(Number.isFinite(chapter) ? { chapterNumber: chapter } : {}),
      },
      severity: type === 'error' ? 'error' : type === 'approval_required' ? 'warning' : 'info',
      status: type === 'error'
        ? 'failed'
        : type === 'approval_required'
          ? 'review_required'
          : type === 'session_done'
            ? 'completed'
            : type,
      summary: Number.isFinite(chapter)
        ? `Hosted Write ${type} chapter ${chapter}`
        : `Hosted Write ${type}`,
      details: {
        novelId,
        range,
        event: eventRecord,
      },
    })
  }, [recordPlmGraphEvent])

  const hostedWrite = React.useCallback(async (
    novelId: string,
    fromChapter: number,
    toChapter: number,
    autoSave: boolean,
    autoOutline: boolean,
    revisionContext?: PlotPilotChapterRevisionContext,
  ) => {
    activeStreamAbortRef.current?.abort()
    const abortController = new AbortController()
    activeStreamAbortRef.current = abortController
    setActiveJob({
      id: `hosted-write:${novelId}:${fromChapter}-${toChapter}`,
      label: `连写第${fromChapter}-${toChapter}章`,
      phase: 'hosted_write',
      detail: novelId,
    })
    setFeatureState((current) => ({
      ...current,
      loadingKey: 'hosted-write',
      hostedWriteEvents: [],
      hostedWriteSummary: {
        fromChapter,
        toChapter,
        autoSave,
        autoOutline,
        savedChapters: [],
        savedCount: 0,
        totalChapters: Math.max(1, toChapter - fromChapter + 1),
        chunkCount: 0,
        charCount: 0,
        lastType: 'starting',
      },
      lastMessage: 'Hosted Write 已启动。',
    }))
    try {
      const activeClient = await ensureRuntimeClient()
      const resolvedRevisionContext = await resolveRevisionContext(novelId, fromChapter, revisionContext)
      if (revisionContext?.annotations) {
        await saveChapterAnnotations(novelId, fromChapter, revisionContext.annotations)
      }
      const revisionMode = resolvedRevisionContext.annotations.length > 0 ? 'annotation_revision' : 'draft_generation'
      for await (const event of activeClient.hostedWriteStream(novelId, {
        from_chapter: fromChapter,
        to_chapter: toChapter,
        auto_save: autoSave,
        auto_outline: autoOutline,
        revision_mode: revisionMode,
        revision_chapter_number: fromChapter,
        revision_context_markdown: resolvedRevisionContext.markdown,
        prompt_variables: {
          revision_mode: revisionMode,
          revision_context_markdown: resolvedRevisionContext.markdown,
        },
      }, { signal: abortController.signal })) {
        appendHostedWriteEvent(event, { fromChapter, toChapter, autoSave, autoOutline })
        void writeHostedWriteEventToDramaGraph(novelId, event, { fromChapter, toChapter, autoSave, autoOutline })
        if (event.type === 'error') throw new Error(event.message)
        if (event.type === 'approval_required') {
          throw new Error(`Hosted Write 进入 AI Invocation 审阅：${event.session_id}`)
        }
        const eventRecord = asRecord(event)
        const chapter = Number(eventRecord.chapter_number ?? eventRecord.chapter)
        const detail = Number.isFinite(chapter)
          ? `chapter ${chapter} / ${event.type}`
          : event.type
        setActiveJob((current) => current ? {
          ...current,
          phase: event.type,
          detail,
          progress: event.type === 'session_done' ? 1 : current.progress,
        } : current)
        setFeatureState((current) => ({
          ...current,
          lastMessage: JSON.stringify(event, null, 2),
        }))
      }
      await refreshChapters(novelId)
      await recordPlmProjectFile({
        novelId,
        type: 'plm.hostedWrite.completed',
        summary: {
          fromChapter,
          toChapter,
          autoSave,
          autoOutline,
          revisionMode,
          revisionAnnotationCount: resolvedRevisionContext.annotations.length,
        },
        payload: {
          fromChapter,
          toChapter,
          autoSave,
          autoOutline,
          revisionMode,
          revisionContextMarkdown: resolvedRevisionContext.markdown,
        },
      })
    } catch (error) {
      if (!isAbortError(error)) {
        const message = errorMessage(error)
        setFeatureState((current) => ({
          ...current,
          hostedWriteSummary: {
            ...asRecord(current.hostedWriteSummary),
            lastType: 'failed',
            error: message,
            updatedAt: new Date().toISOString(),
          },
          lastMessage: message,
        }))
        await recordPlmGraphEvent({
          type: 'plm.hostedWrite.failed',
          target: { novelId },
          severity: 'error',
          status: 'failed',
          summary: `Hosted Write 第${fromChapter}-${toChapter}章失败`,
          details: {
            novelId,
            fromChapter,
            toChapter,
            autoSave,
            autoOutline,
            message,
          },
        })
        reportPlotPilotError(error)
      }
    } finally {
      if (activeStreamAbortRef.current === abortController) activeStreamAbortRef.current = null
      setFeatureState((current) => ({ ...current, loadingKey: null }))
      setActiveJob(null)
    }
  }, [appendHostedWriteEvent, ensureRuntimeClient, recordPlmGraphEvent, recordPlmProjectFile, refreshChapters, resolveRevisionContext, saveChapterAnnotations, writeHostedWriteEventToDramaGraph])

  const appendAutopilotEvent = React.useCallback((event: PlotPilotAutopilotStreamEvent) => {
    const eventRecord = asRecord(event)
    const metadata = asRecord(eventRecord.metadata)
    setFeatureState((current) => ({
      ...current,
      autopilotEvents: [
        {
          ...eventRecord,
          id: `${String(eventRecord.type ?? 'event')}:${String(metadata.seq ?? Date.now())}`,
          seq: metadata.seq ?? eventRecord.seq,
          message: eventRecord.message ?? metadata.message,
          timestamp: eventRecord.timestamp ?? new Date().toISOString(),
        },
        ...(current.autopilotEvents ?? []),
      ].slice(0, 120),
      lastMessage: String(eventRecord.message ?? eventRecord.type ?? current.lastMessage ?? ''),
    }))
  }, [])

  const appendAutopilotStatusEvent = React.useCallback((event: PlotPilotAutopilotStreamEvent) => {
    const eventRecord = asRecord(event)
    setFeatureState((current) => ({
      ...current,
      autopilotStatus: {
        ...asRecord(current.autopilotStatus),
        ...eventRecord,
      },
      autopilotStatusEvents: [
        {
          ...eventRecord,
          id: `${String(eventRecord.type ?? 'status')}:${Date.now()}`,
          timestamp: String(eventRecord.timestamp ?? new Date().toISOString()),
        },
        ...(current.autopilotStatusEvents ?? []),
      ].slice(0, 80),
      lastMessage: String(eventRecord.message ?? eventRecord._message ?? eventRecord.type ?? current.lastMessage ?? ''),
    }))
  }, [])

  const appendAutopilotChapterEvent = React.useCallback((event: PlotPilotAutopilotChapterStreamEvent) => {
    const eventRecord = asRecord(event)
    const metadata = asRecord(eventRecord.metadata)
    const chapterNumber = Number(metadata.chapter_number)
    const beatIndex = Number(metadata.beat_index)
    const chunk = typeof metadata.chunk === 'string' ? metadata.chunk : ''
    const content = typeof metadata.content === 'string' ? metadata.content : ''
    const wordCount = Number(metadata.word_count)

    setFeatureState((current) => {
      const previous = asRecord(current.autopilotChapterSnapshot)
      const previousContent = String(previous.content ?? '')
      const nextContent = content || (chunk ? `${previousContent}${chunk}` : previousContent)
      return {
        ...current,
        autopilotChapterSnapshot: {
          ...previous,
          chapterNumber: Number.isFinite(chapterNumber) ? chapterNumber : previous.chapterNumber,
          beatIndex: Number.isFinite(beatIndex) ? beatIndex : previous.beatIndex,
          content: nextContent,
          chunk: chunk || previous.chunk,
          wordCount: Number.isFinite(wordCount) ? wordCount : countDraftText(nextContent),
          updatedAt: String(eventRecord.timestamp ?? new Date().toISOString()),
        },
        autopilotChapterEvents: [
          {
            ...eventRecord,
            id: `${String(eventRecord.type ?? 'chapter')}:${Date.now()}`,
            timestamp: String(eventRecord.timestamp ?? new Date().toISOString()),
          },
          ...(current.autopilotChapterEvents ?? []),
        ].slice(0, 80),
        lastMessage: String(eventRecord.message ?? eventRecord.type ?? current.lastMessage ?? ''),
      }
    })
  }, [])

  const writeAutopilotEventToDramaGraph = React.useCallback(async (
    novelId: string,
    event: PlotPilotAutopilotStreamEvent | PlotPilotAutopilotChapterStreamEvent,
  ) => {
    const eventRecord = asRecord(event)
    const type = String(eventRecord.type ?? '')
    const shouldPersist = [
      'autopilot_complete',
      'autopilot_stopped',
      'paused_for_review',
      'beat_error',
      'error',
    ].includes(type)
    if (!shouldPersist) return

    await recordPlmGraphEvent({
      type: `plm.autopilot.${type}`,
      target: { novelId },
      severity: type === 'error' || type === 'beat_error' ? 'error' : type === 'paused_for_review' ? 'warning' : 'info',
      status: type === 'error' || type === 'beat_error'
        ? 'failed'
        : type === 'paused_for_review'
          ? 'review_required'
          : type === 'autopilot_complete'
            ? 'completed'
            : 'updated',
      summary: `Autopilot ${type}`,
      details: {
        novelId,
        event: eventRecord,
      },
    }).catch(() => null)

    await writePlotPilotGraphDraft({
      api,
      graph: dramaGraph,
      loadGraph: loadCurrentDramaGraph,
      setGraph: setDramaGraph,
      draftId: `graph:${novelId}:plotpilot-autopilot-event`,
      content: plotPilotGraphDraftContent('PlotPilot Autopilot 事件', eventRecord),
      status: type === 'error' || type === 'beat_error' ? 'blocked' : 'draft',
      fields: [
        {
          key: 'plmNovelId',
          label: 'PLM 书目 ID',
          value: novelId,
          text: novelId,
        },
        {
          key: 'autopilotEventType',
          label: 'Autopilot 事件',
          value: type,
          text: type,
        },
        {
          key: 'autopilotEvent',
          label: 'Autopilot 事件数据',
          value: eventRecord,
          text: JSON.stringify(eventRecord, null, 2),
        },
      ],
    }).catch(() => false)
  }, [dramaGraph, loadCurrentDramaGraph, recordPlmGraphEvent])

  const refreshAutopilot = React.useCallback(async (novelId: string) => {
    setFeatureState((current) => ({ ...current, loadingKey: 'autopilot', lastMessage: '读取 Autopilot 状态。' }))
    try {
      const activeClient = await ensureRuntimeClient()
      const [status, circuitBreaker] = await Promise.all([
        activeClient.getAutopilotStatus(novelId).catch((error) => {
          if (error instanceof PlotPilotHttpError && error.status === 404) return null
          throw error
        }),
        activeClient.getAutopilotCircuitBreaker(novelId).catch(() => null),
      ])
      setFeatureState((current) => ({
        ...current,
        loadingKey: null,
        autopilotStatus: status
          ? status as unknown as Record<string, unknown>
          : current.autopilotStatus,
        autopilotCircuitBreaker: circuitBreaker
          ? circuitBreaker as unknown as Record<string, unknown>
          : current.autopilotCircuitBreaker,
        lastMessage: status ? 'Autopilot 状态已刷新。' : 'Autopilot 状态尚未加载到共享内存。',
      }))
    } catch (error) {
      setFeatureState((current) => ({ ...current, loadingKey: null, lastMessage: errorMessage(error) }))
      reportPlotPilotError(error)
    }
  }, [ensureRuntimeClient])

  const streamAutopilotLog = React.useCallback(async (novelId: string, abortController: AbortController) => {
    const activeClient = await ensureRuntimeClient()
    for await (const event of activeClient.autopilotLogStream(novelId, undefined, { signal: abortController.signal })) {
      appendAutopilotEvent(event)
      void writeAutopilotEventToDramaGraph(novelId, event)
      if (event.type === 'error') {
        throw new Error(String(asRecord(event).message ?? 'Autopilot stream error'))
      }
      if (event.type === 'paused_for_review') {
        await refreshAutopilot(novelId).catch(() => undefined)
      }
    }
  }, [appendAutopilotEvent, ensureRuntimeClient, refreshAutopilot, writeAutopilotEventToDramaGraph])

  const streamAutopilotEvents = React.useCallback(async (novelId: string, abortController: AbortController) => {
    const activeClient = await ensureRuntimeClient()
    for await (const event of activeClient.autopilotEventsStream(novelId, { signal: abortController.signal })) {
      appendAutopilotStatusEvent(event)
      void writeAutopilotEventToDramaGraph(novelId, event)
    }
  }, [appendAutopilotStatusEvent, ensureRuntimeClient, writeAutopilotEventToDramaGraph])

  const streamAutopilotChapter = React.useCallback(async (novelId: string, abortController: AbortController) => {
    const activeClient = await ensureRuntimeClient()
    for await (const event of activeClient.autopilotChapterStream(novelId, { signal: abortController.signal })) {
      appendAutopilotChapterEvent(event)
      void writeAutopilotEventToDramaGraph(novelId, event)
      if (event.type === 'paused_for_review') {
        await refreshAutopilot(novelId).catch(() => undefined)
      }
    }
  }, [appendAutopilotChapterEvent, ensureRuntimeClient, refreshAutopilot, writeAutopilotEventToDramaGraph])

  const startAutopilot = React.useCallback(async (
    novelId: string,
    maxAutoChapters: number,
    targetChapters: number,
    targetWordsPerChapter: number,
    autoApproveMode = false,
  ) => {
    autopilotStreamAbortRef.current?.abort()
    const abortController = new AbortController()
    autopilotStreamAbortRef.current = abortController
    setActiveJob({
      id: `autopilot:${novelId}`,
      label: 'Autopilot 自动驾驶',
      phase: 'autopilot',
      detail: novelId,
    })
    setFeatureState((current) => ({
      ...current,
      loadingKey: 'autopilot',
      autopilotEvents: [],
      autopilotStatusEvents: [],
      autopilotChapterEvents: [],
      autopilotChapterSnapshot: null,
      lastMessage: '启动 Autopilot 守护流程。',
    }))
    try {
      const activeClient = await ensureRuntimeClient()
      const updatedNovel = await activeClient.setNovelAutoApproveMode(novelId, autoApproveMode).catch(() => null)
      if (updatedNovel) {
        setNovels((current) => [updatedNovel, ...current.filter((item) => item.id !== updatedNovel.id)])
      }
      const result = await activeClient.startAutopilot(novelId, {
        max_auto_chapters: maxAutoChapters,
        target_chapters: targetChapters,
        target_words_per_chapter: targetWordsPerChapter,
      })
      await recordPlmProjectFile({
        novelId,
        type: 'plm.autopilot.started',
        summary: {
          maxAutoChapters,
          targetChapters,
          targetWordsPerChapter,
          autoApproveMode,
        },
        payload: result,
      })
      await recordPlmGraphEvent({
        type: 'plm.autopilot.started',
        target: { novelId },
        status: 'running',
        summary: 'Autopilot 自动驾驶已启动',
        details: {
          novelId,
          maxAutoChapters,
          targetChapters,
          targetWordsPerChapter,
          autoApproveMode,
          result,
        },
      })
      setFeatureState((current) => ({
        ...current,
        autopilotStatus: result as unknown as Record<string, unknown>,
        lastMessage: result.message ?? 'Autopilot 已启动。',
      }))
      await refreshAutopilot(novelId).catch(() => undefined)
      const streamResults = await Promise.allSettled([
        streamAutopilotLog(novelId, abortController),
        streamAutopilotEvents(novelId, abortController),
        streamAutopilotChapter(novelId, abortController),
      ])
      const rejected = streamResults.find((result): result is PromiseRejectedResult => result.status === 'rejected')
      if (rejected && !isAbortError(rejected.reason)) throw rejected.reason
      await refreshAutopilot(novelId).catch(() => undefined)
    } catch (error) {
      if (!isAbortError(error)) {
        setFeatureState((current) => ({ ...current, lastMessage: errorMessage(error) }))
        reportPlotPilotError(error)
      }
    } finally {
      if (autopilotStreamAbortRef.current === abortController) autopilotStreamAbortRef.current = null
      setFeatureState((current) => ({ ...current, loadingKey: null }))
      setActiveJob(null)
    }
  }, [ensureRuntimeClient, recordPlmGraphEvent, recordPlmProjectFile, refreshAutopilot, streamAutopilotChapter, streamAutopilotEvents, streamAutopilotLog])

  const stopAutopilot = React.useCallback(async (novelId: string) => {
    autopilotStreamAbortRef.current?.abort()
    setFeatureState((current) => ({ ...current, loadingKey: 'autopilot', lastMessage: '停止 Autopilot。' }))
    try {
      const activeClient = await ensureRuntimeClient()
      const result = await activeClient.stopAutopilot(novelId)
      await recordPlmProjectFile({
        novelId,
        type: 'plm.autopilot.stopped',
        summary: {
          autopilotStatus: result.autopilot_status,
          message: result.message,
        },
        payload: result,
      })
      await recordPlmGraphEvent({
        type: 'plm.autopilot.stopped',
        target: { novelId },
        status: 'stopped',
        summary: result.message ?? 'Autopilot 已停止',
        details: {
          novelId,
          result,
        },
      })
      setFeatureState((current) => ({
        ...current,
        loadingKey: null,
        autopilotStatus: {
          ...asRecord(current.autopilotStatus),
          ...asRecord(result),
          autopilot_status: result.autopilot_status ?? 'stopped',
        },
        lastMessage: result.message ?? 'Autopilot 已停止。',
      }))
      await refreshAutopilot(novelId).catch(() => undefined)
    } catch (error) {
      setFeatureState((current) => ({ ...current, loadingKey: null, lastMessage: errorMessage(error) }))
      reportPlotPilotError(error)
    } finally {
      setActiveJob((current) => current?.id === `autopilot:${novelId}` ? null : current)
    }
  }, [ensureRuntimeClient, recordPlmGraphEvent, recordPlmProjectFile, refreshAutopilot])

  const resumeAutopilot = React.useCallback(async (novelId: string) => {
    setFeatureState((current) => ({ ...current, loadingKey: 'autopilot', lastMessage: '从审阅点恢复 Autopilot。' }))
    try {
      const activeClient = await ensureRuntimeClient()
      const result = await activeClient.resumeAutopilot(novelId)
      await recordPlmProjectFile({
        novelId,
        type: 'plm.autopilot.resumed',
        summary: {
          autopilotStatus: result.autopilot_status,
          message: result.message,
        },
        payload: result,
      })
      await recordPlmGraphEvent({
        type: 'plm.autopilot.resumed',
        target: { novelId },
        status: 'running',
        summary: result.message ?? 'Autopilot 已恢复',
        details: {
          novelId,
          result,
        },
      })
      setFeatureState((current) => ({
        ...current,
        loadingKey: null,
        autopilotStatus: {
          ...asRecord(current.autopilotStatus),
          ...asRecord(result),
          autopilot_status: result.autopilot_status ?? 'running',
        },
        lastMessage: result.message ?? 'Autopilot 已恢复。',
      }))
      await refreshAutopilot(novelId).catch(() => undefined)
    } catch (error) {
      setFeatureState((current) => ({ ...current, loadingKey: null, lastMessage: errorMessage(error) }))
      reportPlotPilotError(error)
    }
  }, [ensureRuntimeClient, recordPlmGraphEvent, recordPlmProjectFile, refreshAutopilot])

  const resetAutopilotBreaker = React.useCallback(async (novelId: string) => {
    setFeatureState((current) => ({ ...current, loadingKey: 'autopilot', lastMessage: '重置 Autopilot 熔断器。' }))
    try {
      const activeClient = await ensureRuntimeClient()
      const result = await activeClient.resetAutopilotCircuitBreaker(novelId)
      await recordPlmProjectFile({
        novelId,
        type: 'plm.autopilot.breakerReset',
        summary: {
          message: result.message,
        },
        payload: result,
      })
      await recordPlmGraphEvent({
        type: 'plm.autopilot.breakerReset',
        target: { novelId },
        status: 'reset',
        summary: result.message ?? 'Autopilot 熔断器已重置',
        details: {
          novelId,
          result,
        },
      })
      setFeatureState((current) => ({
        ...current,
        loadingKey: null,
        lastMessage: result.message ?? '熔断器已重置。',
      }))
      await refreshAutopilot(novelId).catch(() => undefined)
    } catch (error) {
      setFeatureState((current) => ({ ...current, loadingKey: null, lastMessage: errorMessage(error) }))
      reportPlotPilotError(error)
    }
  }, [ensureRuntimeClient, recordPlmGraphEvent, recordPlmProjectFile, refreshAutopilot])

  const stopGeneration = React.useCallback((jobId: string) => {
    if (jobId.startsWith('autopilot:')) {
      const novelId = jobId.slice('autopilot:'.length)
      void stopAutopilot(novelId)
      return
    }
    activeStreamAbortRef.current?.abort()
    autopilotStreamAbortRef.current?.abort()
    setFeatureState((current) => ({
      ...current,
      loadingKey: null,
      hostedWriteSummary: current.loadingKey === 'hosted-write'
        ? {
          ...asRecord(current.hostedWriteSummary),
          lastType: 'cancelled',
          updatedAt: new Date().toISOString(),
        }
        : current.hostedWriteSummary,
      lastMessage: '生成任务已停止。',
    }))
    setActiveJob(null)
  }, [stopAutopilot])

  const reviewChapter = React.useCallback(async (novelId: string, chapterNumber: number) => {
    setActiveJob({
      id: `review:${novelId}:${chapterNumber}`,
      label: `审稿第${chapterNumber}章`,
      phase: 'review',
      detail: novelId,
    })
    setFeatureState((current) => ({ ...current, loadingKey: 'review', lastMessage: '运行章节审稿。' }))
    try {
      const activeClient = await ensureRuntimeClient()
      const result = await activeClient.reviewChapter(novelId, chapterNumber)
      setFeatureState((current) => ({
        ...current,
        loadingKey: null,
        reviewResult: asRecord(result),
        lastMessage: `审稿完成：${result.score}/100`,
      }))
      await recordPlmProjectFile({
        novelId,
        type: 'plm.review.chapterCompleted',
        summary: {
          chapterNumber,
          score: result.score,
        },
        payload: result,
      })
      await recordPlmGraphEvent({
        type: 'plm.review.completed',
        target: {
          novelId,
        },
        status: 'completed',
        summary: `第${chapterNumber}章审稿完成`,
        details: {
          novelId,
          chapterNumber,
          score: result.score,
          result,
        },
      })
    } catch (error) {
      const message = errorMessage(error)
      setFeatureState((current) => ({ ...current, loadingKey: null, lastMessage: message }))
      await recordPlmGraphEvent({
        type: 'plm.review.failed',
        target: {
          novelId,
        },
        severity: 'error',
        status: 'failed',
        summary: `第${chapterNumber}章审稿失败`,
        details: {
          novelId,
          chapterNumber,
          message,
        },
      })
      reportPlotPilotError(error)
    } finally {
      setActiveJob(null)
    }
  }, [ensureRuntimeClient, recordPlmGraphEvent, recordPlmProjectFile])

  const refreshReview = React.useCallback(async (novelId: string, chapterNumber?: number) => {
    setFeatureState((current) => ({ ...current, loadingKey: 'review', lastMessage: '读取读者模拟和劝退告警。' }))
    try {
      const activeClient = await ensureRuntimeClient()
      const [simulations, churnAlerts, chapterSimulation] = await Promise.all([
        activeClient.listReaderSimulations(novelId).catch(() => null),
        activeClient.getChurnAlerts(novelId).catch(() => null),
        chapterNumber ? activeClient.getChapterSimulation(novelId, chapterNumber).catch(() => null) : Promise.resolve(null),
      ])
      setFeatureState((current) => ({
        ...current,
        loadingKey: null,
        readerSimulations: simulations?.data?.chapters ?? current.readerSimulations,
        churnAlerts: churnAlerts?.data?.alerts ?? current.churnAlerts,
        readerReport: chapterSimulation?.data ? asRecord(chapterSimulation.data) : current.readerReport,
        lastMessage: '审稿侧栏已刷新。',
      }))
    } catch (error) {
      setFeatureState((current) => ({ ...current, loadingKey: null, lastMessage: errorMessage(error) }))
      reportPlotPilotError(error)
    }
  }, [ensureRuntimeClient])

  const simulateReaders = React.useCallback(async (novelId: string, chapterNumber: number) => {
    setActiveJob({
      id: `reader:${novelId}:${chapterNumber}`,
      label: `读者模拟第${chapterNumber}章`,
      phase: 'reader_simulation',
      detail: novelId,
    })
    setFeatureState((current) => ({ ...current, loadingKey: 'review', lastMessage: '运行三类读者模拟。' }))
    try {
      const activeClient = await ensureRuntimeClient()
      const result = await activeClient.simulateReaders(novelId, chapterNumber)
      setFeatureState((current) => ({
        ...current,
        readerReport: asRecord(result.data),
        lastMessage: '读者模拟已完成。',
      }))
      await recordPlmProjectFile({
        novelId,
        type: 'plm.readerSimulation.completed',
        summary: {
          chapterNumber,
        },
        payload: result,
      })
      await recordPlmGraphEvent({
        type: 'plm.readerSimulation.completed',
        target: {
          novelId,
        },
        status: 'completed',
        summary: `第${chapterNumber}章读者模拟完成`,
        details: {
          novelId,
          chapterNumber,
          result,
        },
      })
      await refreshReview(novelId, chapterNumber).catch(() => undefined)
    } catch (error) {
      const message = errorMessage(error)
      setFeatureState((current) => ({ ...current, loadingKey: null, lastMessage: message }))
      await recordPlmGraphEvent({
        type: 'plm.readerSimulation.failed',
        target: {
          novelId,
        },
        severity: 'error',
        status: 'failed',
        summary: `第${chapterNumber}章读者模拟失败`,
        details: {
          novelId,
          chapterNumber,
          message,
        },
      })
      reportPlotPilotError(error)
    } finally {
      setFeatureState((current) => ({ ...current, loadingKey: null }))
      setActiveJob(null)
    }
  }, [ensureRuntimeClient, recordPlmGraphEvent, recordPlmProjectFile, refreshReview])

  const refreshMemory = React.useCallback(async (novelId: string) => {
    setFeatureState((current) => ({ ...current, loadingKey: 'memory', lastMessage: '读取知识图谱。' }))
    try {
      const activeClient = await ensureRuntimeClient()
      const [stats, triples] = await Promise.all([
        activeClient.getKnowledgeGraphStatistics(novelId).catch(() => null),
        activeClient.getKnowledgeGraphTriples(novelId).catch(() => null),
      ])
      setFeatureState((current) => ({
        ...current,
        loadingKey: null,
        knowledgeStats: stats?.data ? asRecord(stats.data) : current.knowledgeStats,
        knowledgeTriples: recordArray(triples?.data, ['triples']),
        lastMessage: 'Knowledge Graph 已刷新。',
      }))
      const knowledgeTriples = recordArray(triples?.data, ['triples'])
      await recordPlmGraphEvent({
        type: 'memory.retrieved',
        actor: 'drama:plm-ui',
        source: 'memory',
        target: {
          novelId,
        },
        status: 'refreshed',
        summary: 'PlotPilot Knowledge Graph 已刷新',
        details: {
          novelId,
          tripleCount: knowledgeTriples.length,
          stats: stats?.data ?? null,
        },
      })
    } catch (error) {
      setFeatureState((current) => ({ ...current, loadingKey: null, lastMessage: errorMessage(error) }))
      reportPlotPilotError(error)
    }
  }, [ensureRuntimeClient, recordPlmGraphEvent])

  const inferKnowledgeGraph = React.useCallback(async (novelId: string) => {
    setActiveJob({
      id: `kg:${novelId}`,
      label: '推断知识图谱',
      phase: 'memory',
      detail: novelId,
    })
    setFeatureState((current) => ({ ...current, loadingKey: 'memory', lastMessage: '推断全书知识图谱。' }))
    try {
      const activeClient = await ensureRuntimeClient()
      const result = await activeClient.inferKnowledgeGraph(novelId)
      setFeatureState((current) => ({
        ...current,
        lastMessage: result.message || JSON.stringify(result.data ?? result),
      }))
      await recordPlmProjectFile({
        novelId,
        type: 'plm.knowledgeGraph.inferred',
        summary: {
          message: result.message,
        },
        payload: result,
      })
      await recordPlmGraphEvent({
        type: 'memory.writeEvent',
        actor: 'drama:plm-ui',
        source: 'memory',
        target: {
          novelId,
        },
        status: 'inferred',
        summary: result.message || 'PlotPilot Knowledge Graph 已推断',
        details: {
          novelId,
          message: result.message,
          data: result.data ?? null,
        },
      })
      await refreshMemory(novelId).catch(() => undefined)
    } catch (error) {
      setFeatureState((current) => ({ ...current, loadingKey: null, lastMessage: errorMessage(error) }))
      reportPlotPilotError(error)
    } finally {
      setFeatureState((current) => ({ ...current, loadingKey: null }))
      setActiveJob(null)
    }
  }, [ensureRuntimeClient, recordPlmGraphEvent, recordPlmProjectFile, refreshMemory])

  const searchMemory = React.useCallback(async (novelId: string, query: string) => {
    const trimmed = query.trim()
    if (!trimmed) return
    setFeatureState((current) => ({ ...current, loadingKey: 'memory', lastMessage: `检索记忆：${trimmed}` }))
    try {
      const activeClient = await ensureRuntimeClient()
      const result = await activeClient.searchKnowledgeGraph(novelId, {
        query: trimmed,
        limit: 12,
        min_score: 0.05,
      })
      const results = recordArray(result.data, ['results', 'matches', 'triples'])
      setFeatureState((current) => ({
        ...current,
        loadingKey: null,
        knowledgeSearchResults: results,
        lastMessage: `Memory 检索完成：${results.length} 条结果。`,
      }))
      await recordPlmGraphEvent({
        type: 'memory.search',
        actor: 'drama:plm-ui',
        source: 'memory',
        target: {
          novelId,
        },
        status: 'completed',
        summary: `Memory search: ${trimmed}`,
        details: {
          novelId,
          query: trimmed,
          resultCount: results.length,
          data: result.data ?? null,
        },
      })
    } catch (error) {
      const message = errorMessage(error)
      setFeatureState((current) => ({ ...current, loadingKey: null, lastMessage: message }))
      await recordPlmGraphEvent({
        type: 'memory.search.failed',
        actor: 'drama:plm-ui',
        source: 'memory',
        target: {
          novelId,
        },
        severity: 'error',
        status: 'failed',
        summary: `Memory search failed: ${trimmed}`,
        details: {
          novelId,
          query: trimmed,
          message,
        },
      })
      reportPlotPilotError(error)
    }
  }, [ensureRuntimeClient, recordPlmGraphEvent])

  const refreshDebug = React.useCallback(async (novelId: string) => {
    setFeatureState((current) => ({ ...current, loadingKey: 'debug', lastMessage: '读取 Prompt / Trace。' }))
    try {
      const activeClient = await ensureRuntimeClient()
      const [traceStats, aiTraces, promptStats, prompts] = await Promise.all([
        activeClient.getTraceStats(novelId).catch(() => null),
        activeClient.listAiTraces(novelId).catch(() => null),
        activeClient.getPromptStats().catch(() => null),
        activeClient.listPrompts().catch(() => null),
      ])
      setFeatureState((current) => ({
        ...current,
        loadingKey: null,
        traceStats: traceStats ? asRecord(traceStats) : current.traceStats,
        aiTraces: aiTraces?.traces ?? current.aiTraces,
        promptStats: promptStats ? asRecord(promptStats) : current.promptStats,
        prompts: recordArray(prompts, ['prompts', 'items', 'templates']),
        lastMessage: 'Prompt / Trace 已刷新。',
      }))
    } catch (error) {
      setFeatureState((current) => ({ ...current, loadingKey: null, lastMessage: errorMessage(error) }))
      reportPlotPilotError(error)
    }
  }, [ensureRuntimeClient])

  const loadInvocation = React.useCallback(async (sessionId: string) => {
    const trimmed = sessionId.trim()
    if (!trimmed) return
    setFeatureState((current) => ({ ...current, loadingKey: 'invocation', lastMessage: `读取 AI Invocation ${trimmed}` }))
    try {
      const activeClient = await ensureRuntimeClient()
      const invocation = await activeClient.getInvocation(trimmed)
      setFeatureState((current) => ({
        ...current,
        loadingKey: null,
        activeInvocation: invocation as unknown as Record<string, unknown>,
        lastMessage: invocation.next_action ?? invocation.session.status,
      }))
      const novelId = String(asRecord(invocation.session.context).novel_id ?? '').trim()
      if (novelId) {
        await recordInvocationGraphEvent({
          novelId,
          type: 'plm.invocation.loaded',
          sessionId: trimmed,
          invocation,
          status: invocation.session.status,
          summary: `AI Invocation ${trimmed} 已载入`,
          details: {
            nextAction: invocation.next_action,
          },
        })
      }
    } catch (error) {
      setFeatureState((current) => ({ ...current, loadingKey: null, lastMessage: errorMessage(error) }))
      reportPlotPilotError(error)
    }
  }, [ensureRuntimeClient, recordInvocationGraphEvent])

  const resolveActiveAttemptId = React.useCallback((): string | null => {
    const invocation = asRecord(featureState.activeInvocation)
    const attempt = asRecord(invocation.attempt)
    const attemptId = String(attempt.id ?? '').trim()
    return attemptId || null
  }, [featureState.activeInvocation])

  const resolveActiveDecisionId = React.useCallback((): string | null => {
    const invocation = asRecord(featureState.activeInvocation)
    const decision = asRecord(invocation.decision)
    const decisionId = String(decision.id ?? '').trim()
    return decisionId || null
  }, [featureState.activeInvocation])

  const resumeInvocation = React.useCallback(async (sessionId: string) => {
    setActiveJob({ id: `invocation:resume:${sessionId}`, label: 'Resume Invocation', phase: 'invocation', detail: sessionId })
    try {
      const activeClient = await ensureRuntimeClient()
      const invocation = await activeClient.resumeInvocation(sessionId, { resumed_by: 'drama' })
      setFeatureState((current) => ({
        ...current,
        activeInvocation: invocation as unknown as Record<string, unknown>,
        lastMessage: invocation.next_action ?? invocation.session.status,
      }))
      const novelId = String(asRecord(invocation.session.context).novel_id ?? '').trim()
      if (novelId) {
        await recordPlmProjectFile({
          novelId,
          type: 'plm.invocation.resumed',
          summary: {
            sessionId,
            status: invocation.session.status,
            nextAction: invocation.next_action,
          },
          payload: invocation,
        })
        await recordInvocationGraphEvent({
          novelId,
          type: 'plm.invocation.resumed',
          sessionId,
          invocation,
          status: invocation.session.status,
          summary: `AI Invocation ${sessionId} 已恢复`,
          details: {
            nextAction: invocation.next_action,
          },
        })
      }
    } catch (error) {
      reportPlotPilotError(error)
    } finally {
      setActiveJob(null)
    }
  }, [ensureRuntimeClient, recordInvocationGraphEvent, recordPlmProjectFile])

  const retryInvocation = React.useCallback(async (sessionId: string) => {
    setActiveJob({ id: `invocation:retry:${sessionId}`, label: 'Retry Invocation', phase: 'invocation', detail: sessionId })
    try {
      const activeClient = await ensureRuntimeClient()
      const invocation = await activeClient.retryInvocation(sessionId, { resumed_by: 'drama' })
      setFeatureState((current) => ({
        ...current,
        activeInvocation: invocation as unknown as Record<string, unknown>,
        lastMessage: invocation.next_action ?? invocation.session.status,
      }))
      const novelId = String(asRecord(invocation.session.context).novel_id ?? '').trim()
      if (novelId) {
        await recordPlmProjectFile({
          novelId,
          type: 'plm.invocation.retried',
          summary: {
            sessionId,
            status: invocation.session.status,
            nextAction: invocation.next_action,
          },
          payload: invocation,
        })
        await recordInvocationGraphEvent({
          novelId,
          type: 'plm.invocation.retried',
          sessionId,
          invocation,
          status: invocation.session.status,
          summary: `AI Invocation ${sessionId} 已重试`,
          details: {
            nextAction: invocation.next_action,
          },
        })
      }
    } catch (error) {
      reportPlotPilotError(error)
    } finally {
      setActiveJob(null)
    }
  }, [ensureRuntimeClient, recordInvocationGraphEvent, recordPlmProjectFile])

  const acceptInvocation = React.useCallback(async (sessionId: string) => {
    const attemptId = resolveActiveAttemptId()
    if (!attemptId) {
      window.alert('当前 Invocation 没有可接受的 attempt。')
      return
    }
    setActiveJob({ id: `invocation:accept:${sessionId}`, label: 'Accept Invocation', phase: 'invocation', detail: attemptId })
    try {
      const activeClient = await ensureRuntimeClient()
      const invocation = await activeClient.acceptInvocation(sessionId, {
        attempt_id: attemptId,
        accepted_by: 'drama',
        commit_variable_outputs: true,
      })
      setFeatureState((current) => ({
        ...current,
        activeInvocation: invocation as unknown as Record<string, unknown>,
        lastMessage: invocation.next_action ?? invocation.session.status,
      }))
      const novelId = String(asRecord(invocation.session.context).novel_id ?? '').trim()
      if (novelId) {
        await recordPlmProjectFile({
          novelId,
          type: 'plm.invocation.accepted',
          summary: {
            sessionId,
            attemptId,
            status: invocation.session.status,
            nextAction: invocation.next_action,
          },
          payload: invocation,
        })
        await recordInvocationGraphEvent({
          novelId,
          type: 'plm.invocation.accepted',
          sessionId,
          invocation,
          status: invocation.session.status,
          summary: `AI Invocation ${sessionId} 已接受 attempt`,
          details: {
            attemptId,
            nextAction: invocation.next_action,
          },
        })
      }
    } catch (error) {
      reportPlotPilotError(error)
    } finally {
      setActiveJob(null)
    }
  }, [ensureRuntimeClient, recordInvocationGraphEvent, recordPlmProjectFile, resolveActiveAttemptId])

  const rejectInvocation = React.useCallback(async (sessionId: string) => {
    const attemptId = resolveActiveAttemptId()
    if (!attemptId) {
      window.alert('当前 Invocation 没有可拒绝的 attempt。')
      return
    }
    setActiveJob({ id: `invocation:reject:${sessionId}`, label: 'Reject Invocation', phase: 'invocation', detail: attemptId })
    try {
      const activeClient = await ensureRuntimeClient()
      const invocation = await activeClient.rejectInvocation(sessionId, {
        attempt_id: attemptId,
        accepted_by: 'drama',
      })
      setFeatureState((current) => ({
        ...current,
        activeInvocation: invocation as unknown as Record<string, unknown>,
        lastMessage: invocation.next_action ?? invocation.session.status,
      }))
      const novelId = String(asRecord(invocation.session.context).novel_id ?? '').trim()
      if (novelId) {
        await recordPlmProjectFile({
          novelId,
          type: 'plm.invocation.rejected',
          summary: {
            sessionId,
            attemptId,
            status: invocation.session.status,
            nextAction: invocation.next_action,
          },
          payload: invocation,
        })
        await recordInvocationGraphEvent({
          novelId,
          type: 'plm.invocation.rejected',
          sessionId,
          invocation,
          status: invocation.session.status,
          summary: `AI Invocation ${sessionId} 已拒绝 attempt`,
          details: {
            attemptId,
            nextAction: invocation.next_action,
          },
        })
      }
    } catch (error) {
      reportPlotPilotError(error)
    } finally {
      setActiveJob(null)
    }
  }, [ensureRuntimeClient, recordInvocationGraphEvent, recordPlmProjectFile, resolveActiveAttemptId])

  const commitInvocation = React.useCallback(async (sessionId: string) => {
    const decisionId = resolveActiveDecisionId()
    if (!decisionId) {
      window.alert('当前 Invocation 没有可提交的 decision。')
      return
    }
    setActiveJob({ id: `invocation:commit:${sessionId}`, label: 'Commit Invocation', phase: 'invocation', detail: decisionId })
    try {
      const activeClient = await ensureRuntimeClient()
      const invocation = await activeClient.commitInvocation(sessionId, { decision_id: decisionId })
      setFeatureState((current) => ({
        ...current,
        activeInvocation: invocation as unknown as Record<string, unknown>,
        lastMessage: invocation.next_action ?? invocation.session.status,
      }))
      const novelId = String(asRecord(invocation.session.context).novel_id ?? '').trim()
      if (novelId) {
        await recordPlmProjectFile({
          novelId,
          type: 'plm.invocation.committed',
          summary: {
            sessionId,
            decisionId,
            status: invocation.session.status,
            nextAction: invocation.next_action,
          },
          payload: invocation,
        })
        await recordInvocationGraphEvent({
          novelId,
          type: 'plm.invocation.committed',
          sessionId,
          invocation,
          status: invocation.session.status,
          summary: `AI Invocation ${sessionId} 已提交 decision`,
          details: {
            decisionId,
            nextAction: invocation.next_action,
          },
        })
      }
      if (novelId) {
        await Promise.all([
          loadSelectedBible(novelId).catch(() => undefined),
          refreshSetup(novelId).catch(() => undefined),
          refreshPlanning(novelId).catch(() => undefined),
        ])
      }
    } catch (error) {
      reportPlotPilotError(error)
    } finally {
      setActiveJob(null)
    }
  }, [ensureRuntimeClient, loadSelectedBible, recordInvocationGraphEvent, recordPlmProjectFile, refreshPlanning, refreshSetup, resolveActiveDecisionId])

  const loadTraceTimeline = React.useCallback(async (novelId: string, traceId: string) => {
    setFeatureState((current) => ({ ...current, loadingKey: 'debug', lastMessage: `读取 Trace ${traceId}` }))
    try {
      const activeClient = await ensureRuntimeClient()
      const timeline = await activeClient.getAiTraceTimeline(novelId, traceId)
      setFeatureState((current) => ({
        ...current,
        loadingKey: null,
        traceTimeline: timeline as unknown as Record<string, unknown>,
        lastMessage: `Trace ${traceId} 已载入。`,
      }))
    } catch (error) {
      setFeatureState((current) => ({ ...current, loadingKey: null, lastMessage: errorMessage(error) }))
      reportPlotPilotError(error)
    }
  }, [ensureRuntimeClient])

  const selectNovel = React.useCallback((novelId: string) => {
    setSelectedNovelId(novelId)
    setChapterEditor((current) => current?.novelId === novelId ? current : null)
  }, [])

  const resolveOpenRequestNovelId = React.useCallback(async (request: DramaPlmOpenRequest): Promise<string | null> => {
    const activeClient = request.chapterId ? await ensureRuntimeClient() : null
    let candidateNovels = novels

    if (activeClient && candidateNovels.length === 0) {
      const remoteNovels = await activeClient.listNovels({ timeoutMs: STATUS_REQUEST_TIMEOUT_MS })
      setNovels(remoteNovels)
      candidateNovels = remoteNovels
    }

    const novelById = request.novelId
      ? candidateNovels.find((novel) => novel.id === request.novelId)
      : null
    if (novelById) {
      return novelById.id
    }

    if (!request.chapterId) {
      return null
    }

    if (!activeClient) return null
    for (const novel of candidateNovels) {
      const chapterList = novel.chapters.length
        ? novel.chapters
        : await activeClient.listChapters(novel.id)
      if (chapterList.some((chapter) => chapter.id === request.chapterId)) {
        return novel.id
      }
    }
    return null
  }, [ensureRuntimeClient, novels])

  const handlers = React.useMemo<PlotPilotNativeHandlers>(() => ({
    onStartEngine: () => void startEngine().catch(reportPlotPilotError),
    onRestartEngine: () => void restartEngine().catch(reportPlotPilotError),
    onStartCodexLogin: () => void startCodexLogin(),
    onCreateNovel: () => void createNovel().catch(reportPlotPilotError),
    onCreateNovelFromOnboarding: (draft) => void createNovelFromOnboarding(draft),
    onSaveNovelSetup: (novelId, draft) => void saveNovelSetup(novelId, draft),
    onImportStorylet: () => void importStorylet(),
    onSelectNovel: selectNovel,
    onGenerateBible: (novelId) => void generateBible(novelId),
    onSaveBible: (novelId, bible) => void saveBible(novelId, bible),
    onRefreshSetup: (novelId) => void refreshSetup(novelId),
    onSuggestMainPlotOptions: (novelId) => void suggestMainPlotOptions(novelId),
    onGeneratePlotOutline: (novelId) => void generatePlotOutline(novelId),
    onSavePlotOutline: (novelId, outline) => void savePlotOutline(novelId, outline),
    onSetAutoApproveMode: (novelId, enabled) => void setNovelAutoApproveMode(novelId, enabled),
    onRefreshPlanning: (novelId) => void refreshPlanning(novelId),
    onGenerateMacroPlan: (novelId) => void generateMacroPlan(novelId),
    onContinuePlanning: (novelId, currentChapter) => void continuePlanning(novelId, currentChapter),
    onGenerateBeat: (novelId) => void generateBeat(novelId),
    onGenerateChapter: (novelId, chapterNumber, revisionContext) => void generateChapter(novelId, chapterNumber, revisionContext),
    onHostedWrite: (novelId, fromChapter, toChapter, autoSave, autoOutline, revisionContext) => void hostedWrite(
      novelId,
      fromChapter,
      toChapter,
      autoSave,
      autoOutline,
      revisionContext,
    ),
    onRefreshAutopilot: (novelId) => void refreshAutopilot(novelId),
    onStartAutopilot: (novelId, maxAutoChapters, targetChapters, targetWordsPerChapter, autoApproveMode) => void startAutopilot(
      novelId,
      maxAutoChapters,
      targetChapters,
      targetWordsPerChapter,
      autoApproveMode,
    ),
    onStopAutopilot: (novelId) => void stopAutopilot(novelId),
    onResumeAutopilot: (novelId) => void resumeAutopilot(novelId),
    onResetAutopilotBreaker: (novelId) => void resetAutopilotBreaker(novelId),
    onReviewChapter: (novelId, chapterNumber) => void reviewChapter(novelId, chapterNumber),
    onSimulateReaders: (novelId, chapterNumber) => void simulateReaders(novelId, chapterNumber),
    onRefreshReview: (novelId, chapterNumber) => void refreshReview(novelId, chapterNumber),
    onRefreshMemory: (novelId) => void refreshMemory(novelId),
    onInferKnowledgeGraph: (novelId) => void inferKnowledgeGraph(novelId),
    onSearchMemory: (novelId, query) => void searchMemory(novelId, query),
    onRefreshDebug: (novelId) => void refreshDebug(novelId),
    onLoadInvocation: (sessionId) => void loadInvocation(sessionId),
    onResumeInvocation: (sessionId) => void resumeInvocation(sessionId),
    onRetryInvocation: (sessionId) => void retryInvocation(sessionId),
    onAcceptInvocation: (sessionId) => void acceptInvocation(sessionId),
    onRejectInvocation: (sessionId) => void rejectInvocation(sessionId),
    onCommitInvocation: (sessionId) => void commitInvocation(sessionId),
    onLoadTraceTimeline: (novelId, traceId) => void loadTraceTimeline(novelId, traceId),
    onPrepareFirstChapter: (novelId) => void prepareFirstChapter(novelId),
    onRefreshChapters: (novelId) => void refreshChapters(novelId).catch(reportPlotPilotError),
    onWriteBackChapter: (novelId, chapterNumber) => void writeBackChapter(novelId, chapterNumber),
    onOpenChapter: (novelId, chapterNumber) => void openChapter(novelId, chapterNumber),
    onBindWritingSpec: (novelId, writingSpecId) => void bindWritingSpec(novelId, writingSpecId),
    onClearWritingSpec: (novelId) => void clearWritingSpec(novelId),
    onUpdateHumanizer: (novelId, settings) => void updateHumanizer(novelId, settings),
    onSaveStorageCard: (novelId, card) => void saveStorageCard(novelId, card),
    onChangeChapterDraft: (content) => setChapterEditor((current) => (
      current
        ? {
            ...current,
            content,
            wordCount: countDraftText(content),
            dirty: true,
            loading: false,
          }
        : current
    )),
    onSaveChapter: (novelId, chapterNumber, content, revisionContext) => void saveChapter(novelId, chapterNumber, content, revisionContext),
    onSaveChapterAnnotations: (novelId, chapterNumber, annotations) => void saveChapterAnnotations(novelId, chapterNumber, annotations),
    onStopGeneration: stopGeneration,
  }), [
    bindWritingSpec,
    clearWritingSpec,
    acceptInvocation,
    commitInvocation,
    createNovel,
    createNovelFromOnboarding,
    continuePlanning,
    generateBeat,
    generateBible,
    generateChapter,
    generateMacroPlan,
    generatePlotOutline,
    hostedWrite,
    inferKnowledgeGraph,
    importStorylet,
    loadInvocation,
    loadTraceTimeline,
    openChapter,
    prepareFirstChapter,
    refreshAutopilot,
    refreshDebug,
    refreshMemory,
    refreshPlanning,
    refreshReview,
    refreshSetup,
    refreshChapters,
    restartEngine,
    resumeInvocation,
    resumeAutopilot,
    retryInvocation,
    rejectInvocation,
    resetAutopilotBreaker,
    reviewChapter,
    saveChapter,
    saveBible,
    saveChapterAnnotations,
    saveStorageCard,
    searchMemory,
    saveNovelSetup,
    savePlotOutline,
    selectNovel,
    setNovelAutoApproveMode,
    simulateReaders,
    suggestMainPlotOptions,
    startCodexLogin,
    startEngine,
    startAutopilot,
    stopAutopilot,
    stopGeneration,
    updateHumanizer,
    writeBackChapter,
  ])

  const runtimeReady = isRuntimeReady(runtimeStatus)
  const runtimeBaseUrl = runtimeStatus.baseUrl ?? null

  React.useEffect(() => {
    let disposed = false
    void refreshRuntime().then((status) => {
      if (!disposed && (status.state === 'stopped' || status.state === 'error')) {
        void startEngine().catch(() => undefined)
      }
    })
    return () => {
      disposed = true
    }
  }, [refreshRuntime, startEngine])

  React.useEffect(() => {
    void loadCurrentDramaGraph()
  }, [loadCurrentDramaGraph])

  React.useEffect(() => {
    pendingOpenRequestRef.current = consumeDramaPlmOpenRequest()
  }, [])

  React.useEffect(() => {
    if (!runtimeReady || !client) return
    void loadNovels()
  }, [client, loadNovels, runtimeReady])

  React.useEffect(() => {
    if (!productionFixture || !runtimeReady || !client) return
    void bootstrapProductionFixture()
  }, [bootstrapProductionFixture, client, productionFixture, runtimeReady])

  React.useEffect(() => {
    if (!runtimeReady || !client || !runtimeBaseUrl) return
    if (codexProfileEnsuredForRef.current === runtimeBaseUrl) {
      void refreshCodexStatus(client)
      return
    }
    codexProfileEnsuredForRef.current = runtimeBaseUrl
    void ensureCodexLlmProfile(client)
      .catch(() => undefined)
      .finally(() => void refreshCodexStatus(client))
  }, [client, refreshCodexStatus, runtimeBaseUrl, runtimeReady])

  React.useEffect(() => {
    if (!selectedNovel?.id) {
      setSelectedBible(null)
      setWritingSpec(null)
      setHumanizer(null)
      setFeatureState((current) => ({
        ...current,
        autopilotStatus: null,
        autopilotCircuitBreaker: null,
        autopilotEvents: [],
        autopilotStatusEvents: [],
        autopilotChapterEvents: [],
        autopilotChapterSnapshot: null,
        hostedWriteEvents: [],
        hostedWriteSummary: null,
      }))
      return
    }
    void loadSelectedBible(selectedNovel.id)
    void loadSavedPromptCards(selectedNovel.id)
    void loadProjectGenerationSettings(selectedNovel.id)
    void refreshAutopilot(selectedNovel.id)
  }, [loadProjectGenerationSettings, loadSavedPromptCards, loadSelectedBible, refreshAutopilot, selectedNovel?.id])

  const activeAnnotationChapterNumber = chapterEditor?.chapterNumber ?? selectedNovel?.chapters?.[0]?.number ?? 1

  React.useEffect(() => {
    if (!selectedNovel?.id || !activeAnnotationChapterNumber) return
    void loadLatestChapterAnnotations(selectedNovel.id, activeAnnotationChapterNumber)
  }, [activeAnnotationChapterNumber, loadLatestChapterAnnotations, selectedNovel?.id])

  React.useEffect(() => {
    const request = pendingOpenRequestRef.current
    if (!request || !runtimeReady) return
    let disposed = false
    void (async () => {
      const novelId = await resolveOpenRequestNovelId(request)
      if (!novelId || disposed) return
      pendingOpenRequestRef.current = null
      if (selectedNovel?.id !== novelId) setSelectedNovelId(novelId)
      void openChapter(novelId, request.chapterNumber ?? 1)
    })()
    return () => {
      disposed = true
    }
  }, [openChapter, novels, resolveOpenRequestNovelId, runtimeReady, selectedNovel?.id])

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      void refreshRuntime()
    }, 5_000)
    return () => window.clearInterval(timer)
  }, [refreshRuntime])

  const productionEvidence = React.useMemo(
    () => buildProductionEvidenceSnapshot({
      runtimeReady,
      productPath: integrationStatus?.productPath === true,
      selectedNovel,
      chapterEditor,
      featureState,
    }),
    [chapterEditor, featureState, integrationStatus?.productPath, runtimeReady, selectedNovel],
  )
  const featureStateWithProductionEvidence = React.useMemo<PlotPilotNativeFeatureState>(
    () => ({
      ...featureState,
      productionEvidence,
    }),
    [featureState, productionEvidence],
  )
  const uiNovels = React.useMemo(
    () => novels.map((novel) => toUiNovel(novel, novel.id === selectedNovel?.id ? selectedBible : null)),
    [novels, selectedBible, selectedNovel?.id],
  )
  const uiSelectedNovel = uiNovels.find((novel) => novel.id === selectedNovel?.id) ?? uiNovels[0] ?? null
  const currentChapterAnnotations = selectedNovel?.id
    ? chapterAnnotationsByKey[chapterAnnotationsKey(selectedNovel.id, activeAnnotationChapterNumber)] ?? []
    : []
  const resolvedIntegrationStatus = React.useMemo(
    () => resolveIntegrationStatus(
      integrationStatus,
      runtimeStatus,
      codexStatus,
      selectedNovel,
      chapterEditor,
      featureStateWithProductionEvidence,
    ),
    [chapterEditor, codexStatus, featureStateWithProductionEvidence, integrationStatus, runtimeStatus, selectedNovel],
  )

  React.useEffect(() => {
    onIntegrationStatusChange?.(resolvedIntegrationStatus)
  }, [onIntegrationStatusChange, resolvedIntegrationStatus])

  return (
    <PlotPilotNativePage
      runtimeStatus={toUiRuntimeStatus(runtimeStatus, activeJob)}
      novels={uiNovels}
      selectedNovel={uiSelectedNovel}
      chapterEditor={chapterEditor}
      selectedBibleData={selectedBible as unknown as PlotPilotBibleEditorData | null}
      codexStatus={toUiCodexStatus(codexStatus)}
      integrationStatus={resolvedIntegrationStatus}
      projectGuardStatus={toProjectGuardStatus(writingSpec, humanizer)}
      lastWritingSpecFailure={lastWritingSpecFailure}
      chapterAnnotations={currentChapterAnnotations}
      featureState={featureStateWithProductionEvidence}
      handlers={handlers}
      logs={toUiLogs(runtimeLogs)}
    />
  )
}
