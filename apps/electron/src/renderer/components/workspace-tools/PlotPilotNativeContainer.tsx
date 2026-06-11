import * as React from 'react'

import { createPlotPilotClient, PlotPilotHttpError, type PlotPilotClient } from '@/lib/plotpilot-client'

import {
  PlotPilotNativePage,
  type PlotPilotGenerationJob,
  type PlotPilotChapterEditor,
  type PlotPilotLogEntry as PlotPilotUiLogEntry,
  type PlotPilotNativeHandlers,
  type PlotPilotNovel,
  type PlotPilotRuntimeStatus as PlotPilotUiRuntimeStatus,
} from './PlotPilotNativePage'
import type {
  DramaDraft,
  DramaGraph,
} from '../../../shared/drama-graph'
import type {
  BibleDTO,
  ChapterDTO,
  NovelDTO,
  PlmLogEntry,
  PlotPilotRuntimeStatus,
} from '../../../shared/plotpilot'

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

const DRAMA_PLM_OPEN_REQUEST_KEY = 'drama.plm.openRequest.v1'

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

function isRuntimeReady(status: PlotPilotRuntimeStatus): boolean {
  return status.healthy === true
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function reportPlotPilotError(error: unknown) {
  window.alert(errorMessage(error))
}

function consumeDramaPlmOpenRequest(): DramaPlmOpenRequest | null {
  const raw = window.sessionStorage.getItem(DRAMA_PLM_OPEN_REQUEST_KEY)
  if (!raw) return null
  window.sessionStorage.removeItem(DRAMA_PLM_OPEN_REQUEST_KEY)
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

function toUiNovel(novel: NovelDTO, bible?: BibleDTO | null): PlotPilotNovel {
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
  options: { dirty?: boolean; loading?: boolean; novelId?: string } = {},
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

  const result = await window.electronAPI.upsertDramaGraphDraft({
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
  })
  args.setGraph(result.graph)
  return true
}

function toUiLogs(logs: PlmLogEntry[]): PlotPilotUiLogEntry[] {
  return logs.slice(-160).map((entry, index) => ({
    id: `${entry.timestamp ?? index}:${index}`,
    level: entry.stream === 'stderr' ? 'warning' : 'info',
    time: entry.timestamp,
    message: entry.message ?? entry.line ?? '',
  }))
}

export function PlotPilotNativeContainer() {
  const [runtimeStatus, setRuntimeStatus] = React.useState<PlotPilotRuntimeStatus>(EMPTY_RUNTIME_STATUS)
  const [runtimeLogs, setRuntimeLogs] = React.useState<PlmLogEntry[]>([])
  const [novels, setNovels] = React.useState<NovelDTO[]>([])
  const [selectedNovelId, setSelectedNovelId] = React.useState<string | null>(null)
  const [selectedBible, setSelectedBible] = React.useState<BibleDTO | null>(null)
  const [chapterEditor, setChapterEditor] = React.useState<PlotPilotChapterEditor | null>(null)
  const [activeJob, setActiveJob] = React.useState<PlotPilotGenerationJob | null>(null)
  const [dramaGraph, setDramaGraph] = React.useState<DramaGraph | null>(null)
  const pendingOpenRequestRef = React.useRef<DramaPlmOpenRequest | null>(null)

  const client = React.useMemo(() => {
    return runtimeStatus.baseUrl ? createPlotPilotClient({ baseUrl: runtimeStatus.baseUrl }) : null
  }, [runtimeStatus.baseUrl])

  const selectedNovel = React.useMemo(
    () => novels.find((novel) => novel.id === selectedNovelId) ?? novels[0] ?? null,
    [novels, selectedNovelId],
  )

  const refreshLogs = React.useCallback(async () => {
    try {
      setRuntimeLogs(await window.electronAPI.getPlotPilotRuntimeLogs())
    } catch {
      setRuntimeLogs([])
    }
  }, [])

  const refreshRuntime = React.useCallback(async () => {
    try {
      const status = await window.electronAPI.getPlotPilotRuntimeStatus()
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
      const status = await window.electronAPI.startPlotPilotRuntime()
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
      const status = await window.electronAPI.restartPlotPilotRuntime()
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
    return createPlotPilotClient({ baseUrl })
  }, [client, startEngine])

  const loadNovels = React.useCallback(async () => {
    if (!client) return
    try {
      const nextNovels = await client.listNovels()
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

  const loadCurrentDramaGraph = React.useCallback(async () => {
    try {
      const result = await window.electronAPI.loadDramaGraph()
      setDramaGraph(result.graph)
      return result.graph
    } catch {
      setDramaGraph(null)
      return null
    }
  }, [])

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
      setChapterEditor(toChapterEditor(chapter, { novelId }))
    } catch (error) {
      setChapterEditor((current) => (
        current?.novelId === novelId && current.chapterNumber === chapterNumber
          ? { ...current, loading: false }
          : current
      ))
      reportPlotPilotError(error)
    }
  }, [ensureRuntimeClient])

  const saveChapter = React.useCallback(async (novelId: string, chapterNumber: number, content: string) => {
    setActiveJob({
      id: `chapter:save:${novelId}:${chapterNumber}`,
      label: `保存第${chapterNumber}章`,
      phase: 'save',
      detail: `${countDraftText(content)} chars`,
    })
    try {
      const activeClient = await ensureRuntimeClient()
      const chapter = await activeClient.updateChapter(novelId, chapterNumber, { content })
      setNovels((current) => current.map((novel) => (
        novel.id === novelId ? upsertNovelChapter(novel, chapter) : novel
      )))
      setChapterEditor(toChapterEditor(chapter, { novelId }))
      await writeChapterDraftToDramaGraph({
        graph: dramaGraph,
        loadGraph: loadCurrentDramaGraph,
        setGraph: setDramaGraph,
        novelId,
        chapter,
        source: 'manual',
      })
    } catch (error) {
      reportPlotPilotError(error)
    } finally {
      setActiveJob(null)
    }
  }, [dramaGraph, ensureRuntimeClient, loadCurrentDramaGraph])

  const generateChapter = React.useCallback(async (novelId: string, chapterNumber?: number) => {
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
      setActiveJob((current) => current ? {
        ...current,
        phase: 'planning',
        detail: outline.length > 120 ? `${outline.slice(0, 120)}...` : outline,
      } : current)

      let generatedContent = ''
      for await (const event of activeClient.generateChapterStream(novelId, {
        chapter_number: resolvedChapterNumber,
        outline,
        allow_evolution_gate_bypass: true,
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

      if (!generatedContent.trim()) {
        throw new Error('章节生成完成，但没有返回正文。')
      }

      const savedChapter = await activeClient.updateChapter(novelId, resolvedChapterNumber, {
        content: generatedContent,
      })
      setNovels((current) => current.map((item) => (
        item.id === novelId ? upsertNovelChapter(item, savedChapter) : item
      )))
      setChapterEditor(toChapterEditor(savedChapter, { novelId }))
      await writeChapterDraftToDramaGraph({
        graph: dramaGraph,
        loadGraph: loadCurrentDramaGraph,
        setGraph: setDramaGraph,
        novelId,
        chapter: savedChapter,
        source: 'plotpilot',
      })
      setActiveJob((current) => current ? {
        ...current,
        phase: 'done',
        progress: 1,
        detail: `${savedChapter.word_count ?? countDraftText(generatedContent)} words`,
      } : current)
    } catch (error) {
      reportPlotPilotError(error)
    } finally {
      setActiveJob(null)
    }
  }, [chapterEditor, dramaGraph, ensureRuntimeClient, loadCurrentDramaGraph, novels, selectedNovel])

  const createNovel = React.useCallback(async () => {
    const activeClient = await ensureRuntimeClient()
    const title = window.prompt('书名', 'Drama 长篇项目')
    if (!title) return
    const id = title.trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, '-')
      .replace(/^-+|-+$/g, '') || `novel-${Date.now()}`
    const novel = await activeClient.createNovel({
      novel_id: id,
      title,
      author: 'Drama',
      target_chapters: 30,
      premise: '',
      target_words_per_chapter: 2500,
    })
    setNovels((current) => [novel, ...current.filter((item) => item.id !== novel.id)])
    setSelectedNovelId(novel.id)
  }, [ensureRuntimeClient])

  const importStorylet = React.useCallback(async () => {
    setActiveJob({
      id: 'storylet:import',
      label: '导入 Storylet',
      phase: 'read_graph',
      detail: '读取 Storylet 当前图状态。',
    })
    try {
      const activeClient = await ensureRuntimeClient()
      const snapshot = await window.electronAPI.loadStoryletBridgeSnapshot()
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
      await loadSelectedBible(novel.id)
      void loadNovels()
    } catch (error) {
      reportPlotPilotError(error)
    } finally {
      setActiveJob(null)
    }
  }, [ensureRuntimeClient, loadNovels, loadSelectedBible])

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
    } catch (error) {
      reportPlotPilotError(error)
    } finally {
      setActiveJob(null)
    }
  }, [ensureRuntimeClient])

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
        graph: dramaGraph,
        loadGraph: loadCurrentDramaGraph,
        setGraph: setDramaGraph,
        novelId,
        chapter,
        source: 'plotpilot',
      })
      let storyletMessage = ''
      try {
        const result = await window.electronAPI.writeStoryletChapterFromPlotPilot({ chapter })
        storyletMessage = `\n兼容 Storylet JSON：${result.summary.updatedSceneCount} 个场景，备份：${result.backupPath}`
      } catch {
        storyletMessage = '\nStorylet JSON 兼容写回未执行；Drama Graph 已作为主数据保存。'
      }
      window.alert(wroteDramaGraph
        ? `已回写 Drama Graph。${storyletMessage}`
        : `没有找到匹配的 Drama 章节节点，未写入 Drama Graph。${storyletMessage}`)
    } catch (error) {
      reportPlotPilotError(error)
    } finally {
      setActiveJob(null)
    }
  }, [chapterEditor, dramaGraph, ensureRuntimeClient, loadCurrentDramaGraph])

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
    } catch (error) {
      reportPlotPilotError(error)
    } finally {
      setActiveJob(null)
    }
  }, [ensureRuntimeClient, loadNovels, loadSelectedBible])

  const selectNovel = React.useCallback((novelId: string) => {
    setSelectedNovelId(novelId)
    setChapterEditor((current) => current?.novelId === novelId ? current : null)
  }, [])

  const resolveOpenRequestNovelId = React.useCallback(async (request: DramaPlmOpenRequest): Promise<string | null> => {
    const activeClient = request.chapterId ? await ensureRuntimeClient() : null
    let candidateNovels = novels

    if (activeClient && candidateNovels.length === 0) {
      const remoteNovels = await activeClient.listNovels()
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
    onCreateNovel: () => void createNovel().catch(reportPlotPilotError),
    onImportStorylet: () => void importStorylet(),
    onSelectNovel: selectNovel,
    onGenerateBible: (novelId) => void generateBible(novelId),
    onGenerateChapter: (novelId, chapterNumber) => void generateChapter(novelId, chapterNumber),
    onPrepareFirstChapter: (novelId) => void prepareFirstChapter(novelId),
    onRefreshChapters: (novelId) => void refreshChapters(novelId).catch(reportPlotPilotError),
    onWriteBackChapter: (novelId, chapterNumber) => void writeBackChapter(novelId, chapterNumber),
    onOpenChapter: (novelId, chapterNumber) => void openChapter(novelId, chapterNumber),
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
    onSaveChapter: (novelId, chapterNumber, content) => void saveChapter(novelId, chapterNumber, content),
  }), [
    createNovel,
    generateBible,
    generateChapter,
    importStorylet,
    openChapter,
    prepareFirstChapter,
    refreshChapters,
    restartEngine,
    saveChapter,
    selectNovel,
    startEngine,
    writeBackChapter,
  ])

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
    if (!isRuntimeReady(runtimeStatus) || !client) return
    void loadNovels()
  }, [client, loadNovels, runtimeStatus.state, runtimeStatus.healthy])

  React.useEffect(() => {
    if (!selectedNovel?.id) {
      setSelectedBible(null)
      return
    }
    void loadSelectedBible(selectedNovel.id)
  }, [loadSelectedBible, selectedNovel?.id])

  React.useEffect(() => {
    const request = pendingOpenRequestRef.current
    if (!request || !isRuntimeReady(runtimeStatus)) return
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
  }, [openChapter, novels, resolveOpenRequestNovelId, runtimeStatus, selectedNovel?.id])

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      void refreshRuntime()
    }, 5_000)
    return () => window.clearInterval(timer)
  }, [refreshRuntime])

  const uiNovels = React.useMemo(
    () => novels.map((novel) => toUiNovel(novel, novel.id === selectedNovel?.id ? selectedBible : null)),
    [novels, selectedBible, selectedNovel?.id],
  )
  const uiSelectedNovel = uiNovels.find((novel) => novel.id === selectedNovel?.id) ?? uiNovels[0] ?? null

  return (
    <PlotPilotNativePage
      runtimeStatus={toUiRuntimeStatus(runtimeStatus, activeJob)}
      novels={uiNovels}
      selectedNovel={uiSelectedNovel}
      chapterEditor={chapterEditor}
      handlers={handlers}
      logs={toUiLogs(runtimeLogs)}
    />
  )
}
