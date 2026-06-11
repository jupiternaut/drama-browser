import type { ChapterDTO, CreateNovelRequest } from './plotpilot'

export type StoryletCardKind =
  | 'story'
  | 'world'
  | 'character'
  | 'location'
  | 'plot'
  | 'chapter'
  | 'scene'
  | 'other'

export interface StoryletFieldState {
  id?: string
  key?: string
  name?: string
  value: unknown
  text: string
}

export interface StoryletCardState {
  id: string
  title: string
  kind: StoryletCardKind
  templateId?: string
  moduleType?: string
  description?: string
  fields: StoryletFieldState[]
  position?: { x: number; y: number }
}

export interface StoryletEdgeState {
  id: string
  source: string
  target: string
  label?: string
  type?: string
}

export interface StoryletStoryState {
  schema: 'drama.storylet_state.v1'
  source: 'storylet'
  graphId: string
  graphName: string
  cards: StoryletCardState[]
  edges: StoryletEdgeState[]
  summary: {
    cardCount: number
    edgeCount: number
    worldCount: number
    characterCount: number
    locationCount: number
    chapterCount: number
    sceneCount: number
  }
}

export interface StoryletBridgeSnapshot {
  schema: 'drama.storylet_plotpilot_bridge.v1'
  sourcePath?: string
  graph: {
    id: string
    name: string
    cardCount: number
    connectionCount: number
  }
  createNovel: CreateNovelRequest
  storyState: StoryletStoryState
}

export interface StoryletBridgeOptions {
  sourcePath?: string
  novelIdPrefix?: string
}

export interface StoryletBridgeLoadOptions {
  path?: string
  novelIdPrefix?: string
}

export interface StoryletWritebackOptions {
  now?: number | (() => number)
  scriptStatus?: 'draft' | 'review' | 'approved' | 'final'
}

export interface StoryletWritebackSummary {
  schema: 'drama.storylet_writeback.v1'
  chapterCardId?: string
  chapterNumber: number
  chapterTitle: string
  updatedSceneIds: string[]
  skippedSceneIds: string[]
  skippedCardIds: string[]
  updatedSceneCount: number
  skippedSceneCount: number
  updatedAt: number
}

export interface StoryletWritebackResult<TGraph = unknown> {
  graph: TGraph
  summary: StoryletWritebackSummary
}

export interface StoryletChapterWritebackRequest extends StoryletWritebackOptions {
  path?: string
  chapter: ChapterDTO
}

export interface StoryletChapterWritebackFileResult {
  path: string
  backupPath: string
  summary: StoryletWritebackSummary
}

type StoryletGraphLike = {
  id?: unknown
  name?: unknown
  cards?: unknown
  connections?: unknown
}

type StoryletCardLike = {
  id?: unknown
  title?: unknown
  description?: unknown
  fields?: unknown
  position?: unknown
  templateId?: unknown
  moduleType?: unknown
}

type StoryletFieldLike = {
  id?: unknown
  key?: unknown
  name?: unknown
  value?: unknown
}

type StoryletConnectionLike = {
  id?: unknown
  sourceCardId?: unknown
  targetCardId?: unknown
  source?: unknown
  target?: unknown
  relationshipLabel?: unknown
  relationshipType?: unknown
  label?: unknown
}

type StoryletMutableField = Record<string, unknown> & {
  id?: string
  key?: string
  name?: string
  type?: string
  value?: unknown
}

type StoryletMutableCard = Record<string, unknown> & {
  id?: string
  title?: string
  fields?: StoryletMutableField[]
}

type StoryletMutableGraph = Record<string, unknown> & {
  cards?: unknown
  connections?: unknown
}

const FIELD_ALIASES = {
  title: ['title', 'name', 'sceneTitle', 'chapterTitle', 'plotTitle', 'storyTitle', '标题', '名称', '场景标题', '章节标题'],
  premise: ['premise', 'logline', 'concept', 'storyPremise', 'worldOverview', 'description', '核心设定', '故事前提', '世界概览', '简介'],
  genre: ['genre', 'genreMood', 'lockedGenre', '类型', '题材', '类型/氛围'],
  world: ['worldOverview', 'worldbuilding', 'setting', 'background', 'scale', 'techLevel', '世界观', '世界概览', '背景'],
  role: ['role', 'jobRole', 'characterRole', '角色', '人物定位'],
  location: ['location', 'primaryLocation', 'place', '地点', '场所'],
  time: ['time', 'timePeriod', 'storyTime', '时间', '时代'],
  scenePurpose: ['scenePurpose', 'purpose', 'goal', 'Scene Purpose', '场景目的', '场景目标'],
  keyDialogue: ['keyDialogue', 'dialogue', 'Key Dialogue', '关键对白', '关键台词'],
  tone: ['tone', 'emotionalTone', 'mood', 'Emotional Tone', '情绪基调', '语气'],
  conflict: ['conflict', 'conflictElement', 'Conflict Element', '冲突元素', '矛盾'],
  script: ['script', 'novelDraft', 'draft', '正文', '小说草稿', '剧本', '대본', '초안'],
  scriptStatus: ['scriptStatus', '剧本状态', '대본 상태'],
  sceneNumber: ['sceneNumber', '场景编号', '씬 번호', '장면 번호'],
  chapterNumber: ['chapterNumber', '章节编号', '챕터 번호', '장 번호'],
} as const

const KIND_ORDER: StoryletCardKind[] = ['story', 'world', 'character', 'location', 'plot', 'chapter', 'scene', 'other']

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function stringValue(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return fallback
}

function normalizeKey(value: unknown): string {
  return stringValue(value)
    .trim()
    .toLowerCase()
    .replace(/[\s_/-]+/g, '')
}

function valueText(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    return value.map(valueText).filter(Boolean).join(', ')
  }
  if (isRecord(value)) {
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }
  return String(value)
}

function compactText(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function clampText(value: string, maxLength: number): string {
  const compact = compactText(value)
  return compact.length > maxLength ? `${compact.slice(0, Math.max(0, maxLength - 1))}…` : compact
}

function hashString(value: string): string {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

function stableNovelId(graphId: string, graphName: string, prefix: string): string {
  const raw = `${prefix}-${graphId || graphName || 'storylet'}`
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
  if (raw && raw !== prefix) return raw
  return `${prefix}-${hashString(graphName || graphId || 'storylet')}`
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function toCardArray(cards: unknown): StoryletCardLike[] {
  if (Array.isArray(cards)) return cards.filter(isRecord) as StoryletCardLike[]
  if (isRecord(cards)) return Object.values(cards).filter(isRecord) as StoryletCardLike[]
  return []
}

function toConnectionArray(connections: unknown): StoryletConnectionLike[] {
  if (Array.isArray(connections)) return connections.filter(isRecord) as StoryletConnectionLike[]
  if (isRecord(connections)) return Object.values(connections).filter(isRecord) as StoryletConnectionLike[]
  return []
}

function toMutableCardEntries(cards: unknown): Array<{ key?: string; card: StoryletMutableCard }> {
  if (Array.isArray(cards)) {
    return cards.filter(isRecord).map((card) => ({ card: card as StoryletMutableCard }))
  }
  if (isRecord(cards)) {
    return Object.entries(cards)
      .filter(([, value]) => isRecord(value))
      .map(([key, card]) => ({ key, card: card as StoryletMutableCard }))
  }
  return []
}

function getGraphReference(root: unknown): StoryletMutableGraph {
  if (!isRecord(root)) {
    throw new Error('Storylet bridge requires a graph object')
  }
  if (isRecord(root.state) && isRecord(root.state.graph)) return root.state.graph as StoryletMutableGraph
  if (isRecord(root.graph)) return root.graph as StoryletMutableGraph
  return root as StoryletMutableGraph
}

function normalizeField(field: StoryletFieldLike): StoryletFieldState {
  return {
    id: stringValue(field.id) || undefined,
    key: stringValue(field.key) || undefined,
    name: stringValue(field.name) || undefined,
    value: field.value,
    text: valueText(field.value),
  }
}

function fieldMatches(field: StoryletFieldState, aliases: readonly string[]): boolean {
  const normalizedAliases = aliases.map(normalizeKey)
  const keys = [field.key, field.name, field.id].map(normalizeKey)
  return keys.some((key) => key && normalizedAliases.includes(key))
}

function fieldRecordMatches(field: StoryletMutableField, aliases: readonly string[]): boolean {
  const normalizedAliases = aliases.map(normalizeKey)
  const keys = [field.key, field.name, field.id].map(normalizeKey)
  return keys.some((key) => key && normalizedAliases.includes(key))
}

function mutableFields(card: StoryletMutableCard): StoryletMutableField[] {
  if (!Array.isArray(card.fields)) card.fields = []
  return card.fields
}

function findMutableField(card: StoryletMutableCard, aliases: readonly string[]): StoryletMutableField | undefined {
  return mutableFields(card).find((field) => isRecord(field) && fieldRecordMatches(field, aliases))
}

function firstMutableFieldText(card: StoryletMutableCard, aliases: readonly string[]): string | undefined {
  const field = findMutableField(card, aliases)
  const text = field ? valueText(field.value) : ''
  return text || undefined
}

function ensureMutableField(
  card: StoryletMutableCard,
  key: string,
  name: string,
  type: string,
  value: unknown,
  options: { now: number; selectOptions?: string[] },
): StoryletMutableField {
  const fields = mutableFields(card)
  const existing = findMutableField(card, [key, name])
  if (existing) {
    existing.value = value
    return existing
  }

  const field: StoryletMutableField = {
    id: `${stringValue(card.id, 'card')}__${key}`,
    key,
    name,
    type,
    value,
    visibility: 'public',
    showLabel: true,
    layer: 'surface',
    lockType: 'dynamic',
    priority: 'recommended',
    lockedAt: options.now,
  }
  if (options.selectOptions) field.options = options.selectOptions
  fields.push(field)
  return field
}

function numberFieldValue(card: StoryletMutableCard, aliases: readonly string[]): number | undefined {
  const text = firstMutableFieldText(card, aliases)
  if (!text) return undefined
  const parsed = Number(text)
  return Number.isFinite(parsed) ? parsed : undefined
}

function firstFieldText(card: Pick<StoryletCardState, 'fields'>, aliases: readonly string[]): string | undefined {
  return card.fields.find((field) => fieldMatches(field, aliases) && field.text)?.text
}

function classifyCard(card: StoryletCardLike, fields: StoryletFieldState[]): StoryletCardKind {
  const moduleType = normalizeKey(card.moduleType)
  const templateId = normalizeKey(card.templateId)
  const title = normalizeKey(card.title)
  const fieldKeys = fields.map((field) => `${normalizeKey(field.key)} ${normalizeKey(field.name)}`).join(' ')
  const haystack = `${moduleType} ${templateId} ${title} ${fieldKeys}`

  if (haystack.includes('skeleton') || haystack.includes('story')) return 'story'
  if (haystack.includes('world') || haystack.includes('世界')) return 'world'
  if (haystack.includes('character') || haystack.includes('角色') || haystack.includes('人物')) return 'character'
  if (haystack.includes('location') || haystack.includes('place') || haystack.includes('地点') || haystack.includes('场所')) return 'location'
  if (haystack.includes('plot') || haystack.includes('剧情') || haystack.includes('章纲')) return 'plot'
  if (haystack.includes('chapter') || haystack.includes('章节')) return 'chapter'
  if (haystack.includes('scene') || haystack.includes('场景') || haystack.includes('keydialogue')) return 'scene'
  return 'other'
}

function normalizePosition(value: unknown): { x: number; y: number } | undefined {
  if (!isRecord(value)) return undefined
  const x = typeof value.x === 'number' ? value.x : undefined
  const y = typeof value.y === 'number' ? value.y : undefined
  if (x === undefined || y === undefined) return undefined
  return { x, y }
}

function normalizeCard(raw: StoryletCardLike, index: number): StoryletCardState {
  const fields = Array.isArray(raw.fields)
    ? (raw.fields.filter(isRecord) as StoryletFieldLike[]).map(normalizeField)
    : []
  const provisional = {
    fields,
  }
  const title = stringValue(raw.title)
    || firstFieldText(provisional, FIELD_ALIASES.title)
    || `Storylet Card ${index + 1}`
  const description = stringValue(raw.description) || firstFieldText(provisional, FIELD_ALIASES.premise)
  const kind = classifyCard(raw, fields)

  return {
    id: stringValue(raw.id, `card-${index + 1}`),
    title,
    kind,
    templateId: stringValue(raw.templateId) || undefined,
    moduleType: stringValue(raw.moduleType) || undefined,
    description: description || undefined,
    fields,
    position: normalizePosition(raw.position),
  }
}

function normalizeConnection(raw: StoryletConnectionLike, index: number): StoryletEdgeState | null {
  const source = stringValue(raw.sourceCardId ?? raw.source)
  const target = stringValue(raw.targetCardId ?? raw.target)
  if (!source || !target) return null
  const label = stringValue(raw.relationshipLabel ?? raw.label) || undefined
  const type = stringValue(raw.relationshipType) || undefined
  return {
    id: stringValue(raw.id, `edge-${index + 1}`),
    source,
    target,
    label,
    type,
  }
}

function unwrapStoryletGraph(input: unknown): StoryletGraphLike {
  if (!isRecord(input)) {
    throw new Error('Storylet bridge requires a graph object')
  }
  if (isRecord(input.state) && isRecord(input.state.graph)) return input.state.graph
  if (isRecord(input.graph)) return input.graph
  return input
}

export function normalizeStoryletGraph(input: unknown): StoryletStoryState {
  const graph = unwrapStoryletGraph(input)
  const graphId = stringValue(graph.id, `storylet-${hashString(JSON.stringify(input).slice(0, 10_000))}`)
  const graphName = stringValue(graph.name, 'Storylet Project')
  const cards = toCardArray(graph.cards)
    .map(normalizeCard)
    .sort((left, right) => KIND_ORDER.indexOf(left.kind) - KIND_ORDER.indexOf(right.kind))
  const edges = toConnectionArray(graph.connections)
    .map(normalizeConnection)
    .filter((edge): edge is StoryletEdgeState => edge !== null)

  const countKind = (kind: StoryletCardKind) => cards.filter((card) => card.kind === kind).length

  return {
    schema: 'drama.storylet_state.v1',
    source: 'storylet',
    graphId,
    graphName,
    cards,
    edges,
    summary: {
      cardCount: cards.length,
      edgeCount: edges.length,
      worldCount: countKind('world'),
      characterCount: countKind('character'),
      locationCount: countKind('location'),
      chapterCount: countKind('chapter'),
      sceneCount: countKind('scene'),
    },
  }
}

function cardBrief(card: StoryletCardState, aliases: readonly string[], fallback?: string): string {
  return clampText(firstFieldText(card, aliases) || card.description || fallback || '', 260)
}

function joinSection(title: string, lines: string[]): string {
  const content = lines.map(compactText).filter(Boolean)
  return content.length ? `${title}\n${content.join('\n')}` : ''
}

function buildPremise(storyState: StoryletStoryState): string {
  const cardsByKind = (kind: StoryletCardKind) => storyState.cards.filter((card) => card.kind === kind)
  const storyCards = cardsByKind('story')
  const worldCards = cardsByKind('world')
  const characterCards = cardsByKind('character')
  const locationCards = cardsByKind('location')
  const sceneCards = cardsByKind('scene')

  const storyPremise = storyCards
    .slice(0, 3)
    .map((card) => `${card.title}: ${cardBrief(card, FIELD_ALIASES.premise)}`)
  const worlds = worldCards
    .slice(0, 4)
    .map((card) => `${card.title}: ${cardBrief(card, FIELD_ALIASES.world, card.description)}`)
  const cast = characterCards
    .slice(0, 8)
    .map((card) => `${card.title}${cardBrief(card, FIELD_ALIASES.role) ? ` - ${cardBrief(card, FIELD_ALIASES.role)}` : ''}`)
  const locations = locationCards
    .slice(0, 6)
    .map((card) => `${card.title}: ${cardBrief(card, FIELD_ALIASES.location, card.description)}`)
  const scenes = sceneCards
    .slice(0, 10)
    .map((card) => {
      const purpose = cardBrief(card, FIELD_ALIASES.scenePurpose, card.description)
      const dialogue = cardBrief(card, FIELD_ALIASES.keyDialogue)
      return `${card.title}: ${[purpose, dialogue].filter(Boolean).join(' / ')}`
    })

  return clampText([
    `Storylet 图谱《${storyState.graphName}》导入 Drama PLM。`,
    joinSection('核心设定', storyPremise),
    joinSection('世界与背景', worlds),
    joinSection('角色', cast),
    joinSection('地点', locations),
    joinSection('场景链', scenes),
  ].filter(Boolean).join('\n\n'), 3_000)
}

function firstNonEmpty(...values: Array<string | undefined>): string | undefined {
  return values.map((value) => value?.trim()).find(Boolean)
}

export function derivePlotPilotNovelInputFromStoryletState(
  storyState: StoryletStoryState,
  options: StoryletBridgeOptions = {},
): CreateNovelRequest {
  const storyCards = storyState.cards.filter((card) => card.kind === 'story')
  const worldCards = storyState.cards.filter((card) => card.kind === 'world')
  const sceneCards = storyState.cards.filter((card) => card.kind === 'scene')
  const chapterCards = storyState.cards.filter((card) => card.kind === 'chapter')
  const allCards = storyState.cards
  const findField = (aliases: readonly string[]) => {
    for (const card of allCards) {
      const value = firstFieldText(card, aliases)
      if (value) return value
    }
    return undefined
  }

  const targetChapters = Math.max(1, chapterCards.length || sceneCards.length || 30)
  const bridgeNote = {
    schema: storyState.schema,
    graphId: storyState.graphId,
    counts: storyState.summary,
    preservedIds: true,
  }

  return {
    novel_id: stableNovelId(storyState.graphId, storyState.graphName, options.novelIdPrefix ?? 'storylet'),
    title: storyState.graphName || firstNonEmpty(storyCards[0]?.title, worldCards[0]?.title) || 'Storylet Import',
    author: 'Drama',
    target_chapters: targetChapters,
    premise: buildPremise(storyState),
    genre: findField(FIELD_ALIASES.genre),
    world_preset: worldCards.slice(0, 3).map((card) => card.title).join(' / ') || undefined,
    story_structure: sceneCards.slice(0, 12).map((card) => card.title).join(' -> ') || undefined,
    pacing_control: `Storylet graph projection: ${storyState.summary.sceneCount} scenes, ${storyState.summary.edgeCount} edges.`,
    writing_style: findField(FIELD_ALIASES.tone),
    special_requirements: `保持 Storylet 状态机 ID、因果边和角色/地点引用可追踪。DRAMA_STORYLET_BRIDGE=${JSON.stringify(bridgeNote)}`,
    target_words_per_chapter: 2500,
  }
}

export function buildStoryletBridgeSnapshot(
  input: unknown,
  options: StoryletBridgeOptions = {},
): StoryletBridgeSnapshot {
  const storyState = normalizeStoryletGraph(input)
  return {
    schema: 'drama.storylet_plotpilot_bridge.v1',
    sourcePath: options.sourcePath,
    graph: {
      id: storyState.graphId,
      name: storyState.graphName,
      cardCount: storyState.summary.cardCount,
      connectionCount: storyState.summary.edgeCount,
    },
    createNovel: derivePlotPilotNovelInputFromStoryletState(storyState, options),
    storyState,
  }
}

function scriptStatusValue(chapter: Pick<ChapterDTO, 'status'>, options: StoryletWritebackOptions): 'draft' | 'review' | 'approved' | 'final' {
  if (options.scriptStatus) return options.scriptStatus
  if (chapter.status === 'review' || chapter.status === 'approved' || chapter.status === 'final') return chapter.status
  return 'draft'
}

function isContainsEdge(edge: StoryletConnectionLike): boolean {
  const label = normalizeKey(edge.relationshipLabel ?? edge.label)
  const type = normalizeKey(edge.relationshipType)
  const containsAliases = ['contains', 'containsscene', '包含', '포함']
  return containsAliases.includes(label) || containsAliases.includes(type)
}

function edgeSource(edge: StoryletConnectionLike): string {
  return stringValue(edge.sourceCardId ?? edge.source)
}

function edgeTarget(edge: StoryletConnectionLike): string {
  return stringValue(edge.targetCardId ?? edge.target)
}

function sceneSortKey(card: StoryletMutableCard): number {
  const sceneNumber = firstMutableFieldText(card, FIELD_ALIASES.sceneNumber) || stringValue(card.title)
  const parts = sceneNumber.match(/\d+/g)?.map((part) => Number(part)) ?? []
  if (parts.length >= 2) return parts[0] * 1000 + parts[1]
  if (parts.length === 1) return parts[0] * 1000
  return Number.MAX_SAFE_INTEGER
}

function chapterNumberValue(chapter: ChapterDTO): number {
  const fallback = (chapter as ChapterDTO & { chapter_number?: unknown }).chapter_number
  const raw = chapter.number ?? fallback
  const parsed = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(parsed)) {
    throw new Error('PlotPilot chapter is missing a valid chapter number')
  }
  return parsed
}

function looksLikeChapterCard(card: StoryletMutableCard): boolean {
  const title = stringValue(card.title)
  const haystack = normalizeKey([
    card.moduleType,
    card.templateId,
    title,
    mutableFields(card).map((field) => `${field.key ?? ''} ${field.name ?? ''}`).join(' '),
  ].map((value) => stringValue(value)).join(' '))

  if (
    haystack.includes('chapteroutline')
    || haystack.includes('outline')
    || haystack.includes('plot')
    || haystack.includes('章纲')
    || haystack.includes('大纲')
  ) {
    return false
  }
  if (looksLikeSceneCard(card)) return false
  if (numberFieldValue(card, FIELD_ALIASES.chapterNumber) !== undefined) return true
  if (findMutableField(card, ['chapterTitle', '章节标题'])) return true
  return haystack.includes('chapter')
    || haystack.includes('章节')
    || /^第\s*\d+\s*章/.test(title.trim())
    || /^chapter\s*\d+/i.test(title.trim())
    || /^\d+\s*장/.test(title.trim())
    || /^챕터\s*\d+/i.test(title.trim())
}

function looksLikeSceneCard(card: StoryletMutableCard): boolean {
  if (firstMutableFieldText(card, FIELD_ALIASES.sceneNumber)) return true
  if (findMutableField(card, ['sceneTitle', '场景标题', '장면 제목'])) return true
  const haystack = normalizeKey([
    card.moduleType,
    card.templateId,
    card.title,
    mutableFields(card).map((field) => `${field.key ?? ''} ${field.name ?? ''}`).join(' '),
  ].map((value) => stringValue(value)).join(' '))
  return haystack.includes('scene') || haystack.includes('场景') || haystack.includes('장면')
}

function findChapterCard(cards: StoryletMutableCard[], chapterNumber: number): StoryletMutableCard | undefined {
  const chapterCandidates = cards.filter(looksLikeChapterCard)
  return chapterCandidates.find((card) => numberFieldValue(card, FIELD_ALIASES.chapterNumber) === chapterNumber)
    ?? chapterCandidates.find((card) => {
      const title = compactText(`${stringValue(card.title)} ${firstMutableFieldText(card, FIELD_ALIASES.title) ?? ''}`)
      return title.includes(`第${chapterNumber}章`)
        || title.includes(`第 ${chapterNumber} 章`)
        || new RegExp(`chapter\\s*${chapterNumber}\\b`, 'i').test(title)
        || new RegExp(`\\b${chapterNumber}\\s*장`, 'i').test(title)
        || new RegExp(`챕터\\s*${chapterNumber}\\b`, 'i').test(title)
    })
}

function findChapterSceneCards(
  graph: StoryletMutableGraph,
  cards: StoryletMutableCard[],
  chapterCard: StoryletMutableCard | undefined,
  chapterNumber: number,
): { sceneCards: StoryletMutableCard[]; skippedCardIds: string[] } {
  const cardById = new Map(cards.map((card) => [stringValue(card.id), card]))
  const connections = toConnectionArray(graph.connections)
  const containsTargets = chapterCard
    ? connections
      .filter((edge) => isContainsEdge(edge) && edgeSource(edge) === stringValue(chapterCard.id))
      .map((edge) => cardById.get(edgeTarget(edge)))
      .filter((card): card is StoryletMutableCard => card !== undefined)
    : []
  const fromContainsEdges = containsTargets.filter(looksLikeSceneCard)
  const skippedCardIds = containsTargets
    .filter((card) => !looksLikeSceneCard(card))
    .map((card) => stringValue(card.id))

  const fallbackPrefix = `${chapterNumber}-`
  const sceneCards = fromContainsEdges.length > 0
    ? fromContainsEdges
    : cards.filter((card) => looksLikeSceneCard(card) && (firstMutableFieldText(card, FIELD_ALIASES.sceneNumber) ?? '').startsWith(fallbackPrefix))

  return {
    sceneCards: [...sceneCards].sort((left, right) => sceneSortKey(left) - sceneSortKey(right)),
    skippedCardIds,
  }
}

function splitChapterContent(content: string, count: number): string[] {
  if (count <= 0) return []
  const paragraphs = content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
  if (paragraphs.length === 0) return Array.from({ length: count }, () => '')

  const chunkSize = Math.max(1, Math.ceil(paragraphs.length / count))
  return Array.from({ length: count }, (_, index) => {
    const start = index * chunkSize
    const end = index === count - 1 ? paragraphs.length : start + chunkSize
    return paragraphs.slice(start, end).join('\n\n')
  })
}

function parseExistingScriptVersion(value: unknown): number {
  if (typeof value !== 'string' || !value.trim()) return 0
  try {
    const parsed = JSON.parse(value) as { version?: unknown }
    return typeof parsed.version === 'number' && Number.isFinite(parsed.version) ? parsed.version : 0
  } catch {
    return 0
  }
}

function parseExistingScriptData(value: unknown): Record<string, unknown> | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined
  try {
    const parsed = JSON.parse(value)
    return isRecord(parsed) ? parsed : undefined
  } catch {
    return undefined
  }
}

function blockForParagraph(sceneId: string, paragraph: string, order: number): Record<string, unknown> {
  const dialogue = paragraph.match(/^([^：:\n]{1,20})[：:]\s*(.+)$/)
  if (dialogue) {
    return {
      id: `${sceneId}_plm_${order}`,
      type: 'dialogue',
      content: dialogue[2].trim(),
      characterName: dialogue[1].trim(),
      rawContent: paragraph,
      order,
    }
  }

  return {
    id: `${sceneId}_plm_${order}`,
    type: 'narration',
    content: paragraph,
    order,
  }
}

function buildScriptDataForScene(
  scene: StoryletMutableCard,
  content: string,
  status: 'draft' | 'review' | 'approved' | 'final',
  now: number,
): Record<string, unknown> {
  const sceneId = stringValue(scene.id, 'scene')
  const existingScript = findMutableField(scene, FIELD_ALIASES.script)
  const existingScriptData = parseExistingScriptData(existingScript?.value)
  const preserved = existingScriptData
    ? Object.fromEntries(
      Object.entries(existingScriptData).filter(([key]) => ![
        'blocks',
        'wordCount',
        'estimatedReadTime',
        'version',
        'status',
        'lastGeneratedAt',
        'lastEditedAt',
      ].includes(key)),
    )
    : {}
  const paragraphs = content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
  const blocks = [
    {
      id: `${sceneId}_plm_heading`,
      type: 'scene_heading',
      content: stringValue(scene.title, sceneId),
      order: 0,
    },
    ...paragraphs.map((paragraph, index) => blockForParagraph(sceneId, paragraph, index + 1)),
  ]
  const wordCount = blocks.reduce((total, block) => total + stringValue(block.content).length, 0)
  return {
    ...preserved,
    blocks,
    wordCount,
    estimatedReadTime: Math.ceil(wordCount / 400),
    version: parseExistingScriptVersion(existingScript?.value) + 1,
    status,
    lastGeneratedAt: now,
    lastEditedAt: now,
  }
}

export function applyPlotPilotChapterToStoryletGraph<TGraph>(
  input: TGraph,
  chapter: ChapterDTO,
  options: StoryletWritebackOptions = {},
): StoryletWritebackResult<TGraph> {
  const root = deepClone(input)
  const graph = getGraphReference(root)
  const now = typeof options.now === 'function' ? options.now() : options.now ?? Date.now()
  const status = scriptStatusValue(chapter, options)
  const chapterNumber = chapterNumberValue(chapter)
  const chapterContent = stringValue(chapter.content)
  const cardEntries = toMutableCardEntries(graph.cards)
  const cards = cardEntries.map((entry) => entry.card)
  const chapterCard = findChapterCard(cards, chapterNumber)
  const { sceneCards, skippedCardIds } = findChapterSceneCards(graph, cards, chapterCard, chapterNumber)

  if (chapterContent.trim() && chapterCard) {
    ensureMutableField(
      chapterCard,
      'novelDraft',
      '小说草稿',
      'text',
      chapterContent,
      { now },
    )
  }

  const chunks = chapterContent.trim() ? splitChapterContent(chapterContent, sceneCards.length) : []
  const updatedSceneIds: string[] = []
  const skippedSceneIds: string[] = []
  sceneCards.forEach((scene, index) => {
    const content = chunks[index] ?? ''
    if (!content.trim()) {
      skippedSceneIds.push(stringValue(scene.id))
      return
    }
    const scriptData = buildScriptDataForScene(scene, content, status, now)
    ensureMutableField(scene, 'script', '剧本', 'text', JSON.stringify(scriptData, null, 2), { now })
    ensureMutableField(
      scene,
      'scriptStatus',
      '剧本状态',
      'select',
      status,
      { now, selectOptions: ['empty', 'draft', 'review', 'approved', 'final'] },
    )
    updatedSceneIds.push(stringValue(scene.id))
  })

  return {
    graph: root,
    summary: {
      schema: 'drama.storylet_writeback.v1',
      chapterCardId: chapterCard ? stringValue(chapterCard.id) : undefined,
      chapterNumber,
      chapterTitle: chapter.title,
      updatedSceneIds,
      skippedSceneIds,
      skippedCardIds,
      updatedSceneCount: updatedSceneIds.length,
      skippedSceneCount: skippedSceneIds.length,
      updatedAt: now,
    },
  }
}
