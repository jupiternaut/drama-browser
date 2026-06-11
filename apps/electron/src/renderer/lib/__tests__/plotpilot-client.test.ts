import { describe, expect, it } from 'bun:test'
import { createPlotPilotClient } from '../plotpilot-client'

type FetchCall = {
  url: string
  init: RequestInit | undefined
}

function createFetchStub(
  responder: (url: string, init: RequestInit | undefined) => Response | Promise<Response>,
): { fetch: typeof fetch; calls: FetchCall[] } {
  const calls: FetchCall[] = []
  const fetchStub = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url
    calls.push({ url, init })
    return responder(url, init)
  }
  return { fetch: fetchStub as typeof fetch, calls }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function streamResponse(body: string, contentType: string): Response {
  const encoder = new TextEncoder()
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(body))
        controller.close()
      },
    }),
    { headers: { 'Content-Type': contentType } },
  )
}

describe('createPlotPilotClient', () => {
  it('derives /health from an API v1 base URL and keeps API calls under /api/v1', async () => {
    const { fetch, calls } = createFetchStub((url) => {
      if (url.endsWith('/health')) {
        return jsonResponse({
          status: 'healthy',
          version: '4.5.1',
          build_id: 'dev',
          uptime_seconds: 12,
          daemon_process: { running: true, pid: 1234 },
        })
      }
      return jsonResponse([])
    })
    const client = createPlotPilotClient({
      baseUrl: 'http://127.0.0.1:8123/api/v1',
      fetch,
    })

    await expect(client.health()).resolves.toMatchObject({ status: 'healthy' })
    await expect(client.listNovels()).resolves.toEqual([])

    expect(calls.map(call => call.url)).toEqual([
      'http://127.0.0.1:8123/health',
      'http://127.0.0.1:8123/api/v1/novels/',
    ])
  })

  it('accepts a port target for JSON create/read calls', async () => {
    const createdNovel = {
      id: 'novel-1',
      title: 'Test Novel',
      author: 'Tester',
      target_chapters: 12,
      stage: 'planning',
      premise: '',
      chapters: [],
      total_word_count: 0,
    }
    const { fetch, calls } = createFetchStub((url) => {
      if (url.endsWith('/novels/')) return jsonResponse(createdNovel, 201)
      return jsonResponse({
        id: 'bible-1',
        novel_id: 'novel 1',
        characters: [],
        world_settings: [],
        locations: [],
        timeline_notes: [],
        style_notes: [],
      })
    })
    const client = createPlotPilotClient({ port: 8005, fetch })

    await expect(client.createNovel({
      novel_id: 'novel-1',
      title: 'Test Novel',
      author: 'Tester',
      target_chapters: 12,
    })).resolves.toEqual(createdNovel)
    await expect(client.getBible('novel 1')).resolves.toMatchObject({ novel_id: 'novel 1' })

    expect(calls[0]).toMatchObject({
      url: 'http://127.0.0.1:8005/api/v1/novels/',
      init: { method: 'POST' },
    })
    expect(calls[0]?.init?.body).toBe(JSON.stringify({
      novel_id: 'novel-1',
      title: 'Test Novel',
      author: 'Tester',
      target_chapters: 12,
    }))
    expect(calls[1]?.url).toBe('http://127.0.0.1:8005/api/v1/bible/novels/novel%201/bible')
  })

  it('covers chapter, bible status, and beat sheet JSON endpoints', async () => {
    const chapter = {
      id: 'chapter-novel-1-1',
      number: 1,
      title: '第一章',
      content: '',
      word_count: 0,
      novel_id: 'novel-1',
      status: 'draft',
    }
    const beatSheet = {
      id: 'beat-1',
      chapter_id: chapter.id,
      scenes: [{
        title: '便利店门口',
        goal: '压缩 token 债务危机',
        pov_character: '顾临川',
        location: '便利店',
        tone: '压迫',
        estimated_words: 900,
        order_index: 0,
      }],
      total_scenes: 1,
      total_estimated_words: 900,
    }
    const { fetch, calls } = createFetchStub((url, init) => {
      if (url.endsWith('/bible/status')) return jsonResponse({ exists: true, ready: true, novel_id: 'novel-1' })
      if (url.endsWith('/chapters') && init?.method === 'GET') return jsonResponse([chapter])
      if (url.endsWith('/chapters/1') && init?.method === 'GET') return jsonResponse(chapter)
      if (url.endsWith('/chapters/1/ensure')) return jsonResponse(chapter)
      if (url.endsWith('/chapters/1/micro-beats')) return jsonResponse({ ok: true, chapter_number: 1, count: 1 })
      if (url.endsWith('/chapters/1') && init?.method === 'PUT') return jsonResponse({ ...chapter, content: '正文', word_count: 2 })
      if (url.endsWith('/beat-sheets/generate')) return jsonResponse(beatSheet)
      if (url.endsWith(`/beat-sheets/${chapter.id}`)) return jsonResponse(beatSheet)
      return jsonResponse({})
    })
    const client = createPlotPilotClient({ port: 8005, fetch })

    await expect(client.getBibleStatus('novel-1')).resolves.toEqual({ exists: true, ready: true, novel_id: 'novel-1' })
    await expect(client.listChapters('novel-1')).resolves.toEqual([chapter])
    await expect(client.getChapter('novel-1', 1)).resolves.toEqual(chapter)
    await expect(client.ensureChapter('novel-1', 1, { title: '第一章' })).resolves.toEqual(chapter)
    await expect(client.updateChapter('novel-1', 1, { content: '正文' })).resolves.toMatchObject({ content: '正文' })
    await expect(client.updateChapterMicroBeats('novel-1', 1, {
      micro_beats: [{ description: '门口欠费单', target_words: 900 }],
    })).resolves.toMatchObject({ ok: true, count: 1 })
    await expect(client.generateBeatSheet({
      chapter_id: chapter.id,
      outline: '顾临川在便利店门口看见欠费单。',
    })).resolves.toEqual(beatSheet)
    await expect(client.getBeatSheet(chapter.id)).resolves.toEqual(beatSheet)

    expect(calls.map(call => `${call.init?.method ?? 'GET'} ${call.url}`)).toEqual([
      'GET http://127.0.0.1:8005/api/v1/bible/novels/novel-1/bible/status',
      'GET http://127.0.0.1:8005/api/v1/novels/novel-1/chapters',
      'GET http://127.0.0.1:8005/api/v1/novels/novel-1/chapters/1',
      'POST http://127.0.0.1:8005/api/v1/novels/novel-1/chapters/1/ensure',
      'PUT http://127.0.0.1:8005/api/v1/novels/novel-1/chapters/1',
      'PUT http://127.0.0.1:8005/api/v1/novels/novel-1/chapters/1/micro-beats',
      'POST http://127.0.0.1:8005/api/v1/beat-sheets/generate',
      `GET http://127.0.0.1:8005/api/v1/beat-sheets/${chapter.id}`,
    ])
    expect(calls[3]?.init?.body).toBe(JSON.stringify({ title: '第一章' }))
    expect(calls[4]?.init?.body).toBe(JSON.stringify({ content: '正文' }))
    expect(calls[6]?.init?.body).toBe(JSON.stringify({
      chapter_id: chapter.id,
      outline: '顾临川在便利店门口看见欠费单。',
    }))
  })

  it('parses Bible generation SSE events', async () => {
    const sse = [
      'event: phase',
      'data: {"phase":"init","message":"start"}',
      '',
      'event: data',
      'data: {"type":"style_chunk","chunk":"hello"}',
      '',
      'event: done',
      'data: {"novel_id":"novel-1","message":"ok"}',
      '',
      '',
    ].join('\n')
    const { fetch, calls } = createFetchStub(() => streamResponse(sse, 'text/event-stream'))
    const client = createPlotPilotClient({ origin: 'http://127.0.0.1:8005', fetch })

    const events = []
    for await (const event of client.generateBibleStream('novel-1', { stage: 'worldbuilding' })) {
      events.push(event)
    }

    expect(calls[0]).toMatchObject({
      url: 'http://127.0.0.1:8005/api/v1/bible/novels/novel-1/generate-stream?stage=worldbuilding',
      init: { method: 'POST' },
    })
    expect(events).toEqual([
      { type: 'phase', phase: 'init', message: 'start' },
      { type: 'data', data_type: 'style_chunk', chunk: 'hello' },
      { type: 'done', novel_id: 'novel-1', message: 'ok' },
    ])
  })

  it('posts and parses chapter generation SSE events', async () => {
    const sse = [
      'data: {"type":"phase","phase":"planning","message":"准备上下文"}',
      '',
      'data: {"type":"llm_chunk","stage":"outline_partition","text":"[{\\"description\\":\\"开场\\"}]"}',
      '',
      'data: {"type":"beats_generated","beats":[{"description":"便利店门口","target_words":900,"focus":"conflict"}]}',
      '',
      'data: {"type":"chunk","text":"第一段正文","stats":{"chars":5,"chunks":1,"estimated_tokens":3}}',
      '',
      'data: {"type":"done","content":"第一段正文","consistency_report":{"issues":[],"warnings":[],"suggestions":["ok"]},"token_count":3,"output_tokens":3,"total_tokens":9,"chars":5}',
      '',
      '',
    ].join('\n')
    const { fetch, calls } = createFetchStub(() => streamResponse(sse, 'text/event-stream'))
    const client = createPlotPilotClient({ origin: 'http://127.0.0.1:8005', fetch })

    const events = []
    for await (const event of client.generateChapterStream('novel-1', {
      chapter_number: 1,
      outline: '顾临川在便利店门口看见欠费单。',
    })) {
      events.push(event)
    }

    expect(calls[0]).toMatchObject({
      url: 'http://127.0.0.1:8005/api/v1/novels/novel-1/generate-chapter-stream',
      init: { method: 'POST' },
    })
    expect(calls[0]?.init?.body).toBe(JSON.stringify({
      chapter_number: 1,
      outline: '顾临川在便利店门口看见欠费单。',
    }))
    expect(events).toEqual([
      { type: 'phase', phase: 'planning', message: '准备上下文' },
      { type: 'llm_chunk', stage: 'outline_partition', text: '[{"description":"开场"}]' },
      {
        type: 'beats_generated',
        beats: [{ description: '便利店门口', target_words: 900, focus: 'conflict' }],
      },
      {
        type: 'chunk',
        text: '第一段正文',
        stats: { chars: 5, chunks: 1, estimated_tokens: 3 },
      },
      {
        type: 'done',
        content: '第一段正文',
        consistency_report: { issues: [], warnings: [], suggestions: ['ok'] },
        token_count: 3,
        output_tokens: 3,
        total_tokens: 9,
        chars: 5,
      },
    ])
  })

  it('parses Bible generation NDJSON events', async () => {
    const ndjson = [
      JSON.stringify({ type: 'phase', phase: 'init', message: 'start' }),
      JSON.stringify({ type: 'data', data_type: 'worldbuilding_field', dimension: 'core_rules', field: 'rule', value: 'cost' }),
      JSON.stringify({ type: 'done', novel_id: 'novel-1' }),
    ].join('\n')
    const { fetch } = createFetchStub(() => streamResponse(`${ndjson}\n`, 'application/x-ndjson'))
    const client = createPlotPilotClient({ port: 8005, fetch })

    const events = []
    for await (const event of client.generateBibleStream('novel-1')) {
      events.push(event)
    }

    expect(events).toEqual([
      { type: 'phase', phase: 'init', message: 'start' },
      {
        type: 'data',
        data_type: 'worldbuilding_field',
        dimension: 'core_rules',
        field: 'rule',
        value: 'cost',
      },
      { type: 'done', novel_id: 'novel-1' },
    ])
  })
})
