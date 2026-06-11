import { describe, expect, it } from 'bun:test'
import {
  applyPlotPilotChapterToStoryletGraph,
  buildStoryletBridgeSnapshot,
  derivePlotPilotNovelInputFromStoryletState,
  normalizeStoryletGraph,
} from '../storylet-plotpilot-bridge'

const storyletGraph = {
  id: 'proj-qwo3vb8tv',
  name: '别在输入框里说真话',
  cards: {
    world: {
      id: 'world',
      title: 'Token 续命社会',
      moduleType: 'world',
      fields: [
        { id: 'worldOverview', key: 'worldOverview', name: 'World Overview', value: '所有人用 token 续命，把脑子抵押给平台。' },
        { id: 'tone', key: 'emotionalTone', name: '情绪基调', value: '荒诞、焦虑、冷幽默' },
      ],
      position: { x: 10, y: 20 },
    },
    hero: {
      id: 'hero',
      title: '高淳程序员',
      moduleType: 'character',
      fields: [
        { id: 'role', key: 'role', name: '角色', value: '主角，被平台债务追着跑' },
      ],
    },
    s01: {
      id: 's01',
      title: 'S01',
      moduleType: 'scene',
      fields: [
        { id: 'sceneTitle', key: 'sceneTitle', name: '场景标题', value: '便利店门口的假登录' },
        { id: 'purpose', key: 'scenePurpose', name: '场景目的', value: '主角第一次发现输入框会泄露梦境。' },
        { id: 'dialogue', key: 'keyDialogue', name: '关键对白', value: '你不是没登录，你是被登录了。' },
      ],
    },
  },
  connections: {
    e1: {
      id: 'e1',
      sourceCardId: 'world',
      targetCardId: 's01',
      relationshipLabel: 'pressure',
      relationshipType: 'hostile',
    },
  },
}

describe('Storylet to PlotPilot bridge', () => {
  it('normalizes a Storylet graph into a state-machine friendly story state', () => {
    const state = normalizeStoryletGraph(storyletGraph)

    expect(state.schema).toBe('drama.storylet_state.v1')
    expect(state.graphId).toBe('proj-qwo3vb8tv')
    expect(state.graphName).toBe('别在输入框里说真话')
    expect(state.summary).toMatchObject({
      cardCount: 3,
      edgeCount: 1,
      worldCount: 1,
      characterCount: 1,
      sceneCount: 1,
    })
    expect(state.cards.find((card) => card.id === 's01')?.kind).toBe('scene')
    expect(state.edges[0]).toMatchObject({ source: 'world', target: 's01', label: 'pressure' })
  })

  it('derives a PlotPilot create-novel request from Storylet graph content', () => {
    const state = normalizeStoryletGraph(storyletGraph)
    const request = derivePlotPilotNovelInputFromStoryletState(state)

    expect(request.novel_id).toBe('storylet-proj-qwo3vb8tv')
    expect(request.title).toBe('别在输入框里说真话')
    expect(request.target_chapters).toBe(1)
    expect(request.premise).toContain('所有人用 token 续命')
    expect(request.premise).toContain('高淳程序员')
    expect(request.premise).toContain('你不是没登录')
    expect(request.world_preset).toBe('Token 续命社会')
    expect(request.story_structure).toBe('S01')
    expect(request.special_requirements).toContain('DRAMA_STORYLET_BRIDGE=')
  })

  it('accepts persisted Zustand envelopes from Storylet localStorage', () => {
    const snapshot = buildStoryletBridgeSnapshot({ state: { graph: storyletGraph } }, { sourcePath: 'storylet-current.graph.json' })

    expect(snapshot.schema).toBe('drama.storylet_plotpilot_bridge.v1')
    expect(snapshot.sourcePath).toBe('storylet-current.graph.json')
    expect(snapshot.graph.cardCount).toBe(3)
    expect(snapshot.createNovel.title).toBe('别在输入框里说真话')
  })

  it('keeps compatibility with legacy English scene field names', () => {
    const state = normalizeStoryletGraph({
      id: 'legacy',
      name: 'Legacy Graph',
      cards: [
        {
          id: 'scene',
          title: 'S04',
          templateId: 'scene',
          fields: [
            { id: 'purpose', name: 'Scene Purpose', value: 'Expose the hidden witness.' },
            { id: 'dialogue', name: 'Key Dialogue', value: 'Do not move the camera.' },
          ],
        },
      ],
      connections: [],
    })
    const request = derivePlotPilotNovelInputFromStoryletState(state)

    expect(state.summary.sceneCount).toBe(1)
    expect(request.premise).toContain('Expose the hidden witness')
    expect(request.premise).toContain('Do not move the camera')
  })

  it('writes a PlotPilot chapter draft back to Storylet chapter and scene fields', () => {
    const graph = {
      id: 'proj',
      name: '回写测试',
      cards: {
        ch1: {
          id: 'ch1',
          title: '第 1 章：便利店',
          moduleType: 'chapter',
          fields: [
            { id: 'ch1__chapterNumber', key: 'chapterNumber', name: 'Chapter Number', type: 'number', value: 1, visibility: 'public', showLabel: true },
            { id: 'ch1__chapterTitle', key: 'chapterTitle', name: 'Chapter Title', type: 'text', value: '便利店', visibility: 'public', showLabel: true },
          ],
        },
        sc1: {
          id: 'sc1',
          title: '1-0 欠费单',
          moduleType: 'scene',
          fields: [
            { id: 'sc1__sceneNumber', key: 'sceneNumber', name: 'Scene Number', type: 'text', value: '1-0', visibility: 'public', showLabel: true },
            { id: 'sc1__sceneTitle', key: 'sceneTitle', name: 'Scene Title', type: 'text', value: '欠费单', visibility: 'public', showLabel: true },
            { id: 'sc1__script', key: 'script', name: '剧本', type: 'text', value: JSON.stringify({ version: 2, meta: { lockedBy: 'human' }, agentTrace: ['director'] }), visibility: 'public', showLabel: true },
            { id: 'sc1__scriptStatus', key: 'scriptStatus', name: '剧本状态', type: 'select', value: 'empty', visibility: 'public', showLabel: true, options: ['empty', 'draft', 'review', 'approved', 'final'] },
          ],
        },
        sc2: {
          id: 'sc2',
          title: '1-1 争执',
          moduleType: 'scene',
          fields: [
            { id: 'sc2__sceneNumber', key: 'sceneNumber', name: 'Scene Number', type: 'text', value: '1-1', visibility: 'public', showLabel: true },
            { id: 'sc2__sceneTitle', key: 'sceneTitle', name: 'Scene Title', type: 'text', value: '争执', visibility: 'public', showLabel: true },
          ],
        },
      },
      connections: [
        { id: 'e1', sourceCardId: 'ch1', targetCardId: 'sc2', relationshipLabel: 'contains' },
        { id: 'e0', sourceCardId: 'ch1', targetCardId: 'sc1', relationshipLabel: 'contains' },
      ],
    }

    const result = applyPlotPilotChapterToStoryletGraph(graph, {
      id: 'chapter-storylet-proj-1',
      novel_id: 'storylet-proj',
      number: 1,
      title: '第1章',
      content: '顾临川坐在便利店门口。\n\n系统：当前账户余额不足。\n\n他把提示关掉，写下第一条铁律。',
      word_count: 42,
      status: 'draft',
    }, { now: 12345 })

    const cards = result.graph.cards as Record<string, any>
    const chapterDraft = cards.ch1.fields.find((field: any) => field.key === 'novelDraft')
    const sceneOneScript = cards.sc1.fields.find((field: any) => field.key === 'script')
    const sceneOneStatus = cards.sc1.fields.find((field: any) => field.key === 'scriptStatus')
    const sceneTwoScript = cards.sc2.fields.find((field: any) => field.key === 'script')
    const parsedSceneOne = JSON.parse(sceneOneScript.value)
    const parsedSceneTwo = JSON.parse(sceneTwoScript.value)

    expect(result.summary).toMatchObject({
      chapterCardId: 'ch1',
      updatedSceneCount: 2,
      skippedSceneCount: 0,
    })
    expect(chapterDraft.value).toContain('当前账户余额不足')
    expect(chapterDraft.lockType).toBe('dynamic')
    expect(sceneOneStatus.value).toBe('draft')
    expect(parsedSceneOne.status).toBe('draft')
    expect(parsedSceneOne.version).toBe(3)
    expect(parsedSceneOne.meta).toEqual({ lockedBy: 'human' })
    expect(parsedSceneOne.agentTrace).toEqual(['director'])
    expect(parsedSceneOne.blocks[0]).toMatchObject({ type: 'scene_heading', content: '1-0 欠费单', order: 0 })
    expect(parsedSceneOne.blocks.some((block: any) => block.type === 'dialogue' && block.characterName === '系统' && block.content === '当前账户余额不足。')).toBe(true)
    expect(parsedSceneTwo.blocks[0]).toMatchObject({ type: 'scene_heading', content: '1-1 争执', order: 0 })
    expect(parsedSceneTwo.lastGeneratedAt).toBe(12345)
  })

  it('does not treat the first non-chapter card as a chapter when PlotPilot returns chapter_number', () => {
    const graph = {
      id: 'proj',
      name: '章节号兼容测试',
      cards: {
        world: {
          id: 'world',
          title: 'Token 续命社会',
          moduleType: 'world',
          fields: [
            { id: 'world__worldOverview', key: 'worldOverview', name: 'World Overview', type: 'text', value: '不是章节卡。' },
          ],
        },
        ch1: {
          id: 'ch1',
          title: '第 1 章：低价值碰撞样本',
          fields: [
            { id: 'ch1__chapterNumber', key: 'chapterNumber', name: 'Chapter Number', type: 'number', value: 1 },
          ],
        },
        sc1: {
          id: 'sc1',
          title: '1-0 便利店门口',
          moduleType: 'scene',
          fields: [
            { id: 'sc1__sceneNumber', key: 'sceneNumber', name: 'Scene Number', type: 'text', value: '1-0' },
          ],
        },
      },
      connections: [],
    }

    const result = applyPlotPilotChapterToStoryletGraph(graph, {
      id: 'chapter-storylet-proj-1',
      novel_id: 'storylet-proj',
      chapter_number: 1,
      title: '第1章',
      content: '顾临川看见自己的项目被模型胃消化。',
      word_count: 18,
      status: 'draft',
    } as any, { now: 12345 })

    const cards = result.graph.cards as Record<string, any>
    const worldDraft = cards.world.fields.find((field: any) => field.key === 'novelDraft')
    const chapterDraft = cards.ch1.fields.find((field: any) => field.key === 'novelDraft')
    const sceneScript = cards.sc1.fields.find((field: any) => field.key === 'script')

    expect(result.summary.chapterCardId).toBe('ch1')
    expect(worldDraft).toBeUndefined()
    expect(chapterDraft.value).toContain('模型胃')
    expect(JSON.parse(sceneScript.value).blocks[0]).toMatchObject({ type: 'scene_heading', content: '1-0 便利店门口' })
  })

  it('skips chapter-outline and non-scene contains targets while accepting Korean aliases', () => {
    const graph = {
      id: 'proj',
      name: '韩文字段兼容',
      cards: {
        outline: {
          id: 'outline',
          title: 'Chapter 1 Outline',
          moduleType: 'chapter-outline',
          fields: [
            { id: 'outline__chapterNumber', key: 'chapterNumber', name: 'Chapter Number', type: 'number', value: 1 },
          ],
        },
        ch1: {
          id: 'ch1',
          title: '1장 낮은 가치 충돌',
          moduleType: 'chapter',
          fields: [
            { id: 'ch1__chapterNumber', name: '챕터 번호', type: 'number', value: 1 },
          ],
        },
        world: {
          id: 'world',
          title: '세계관 카드',
          moduleType: 'world',
          fields: [],
        },
        sc1: {
          id: 'sc1',
          title: '1-0 편의점',
          moduleType: 'scene',
          fields: [
            { id: 'sc1__sceneNumber', name: '씬 번호', type: 'text', value: '1-0' },
          ],
        },
      },
      connections: [
        { id: 'e0', sourceCardId: 'ch1', targetCardId: 'world', relationshipLabel: '包含' },
        { id: 'e1', sourceCardId: 'ch1', targetCardId: 'sc1', relationshipLabel: '포함' },
      ],
    }

    const result = applyPlotPilotChapterToStoryletGraph(graph, {
      id: 'chapter-storylet-proj-1',
      novel_id: 'storylet-proj',
      chapter_number: 1,
      title: 'Chapter 1',
      content: '系统：写入场景，而不是世界观。',
      word_count: 15,
      status: 'draft',
    } as any, { now: 12345 })

    const cards = result.graph.cards as Record<string, any>

    expect(result.summary.chapterCardId).toBe('ch1')
    expect(result.summary.skippedCardIds).toEqual(['world'])
    expect(cards.outline.fields.find((field: any) => field.key === 'novelDraft')).toBeUndefined()
    expect(cards.world.fields.find((field: any) => field.key === 'script')).toBeUndefined()
    expect(JSON.parse(cards.sc1.fields.find((field: any) => field.key === 'script').value).blocks[1]).toMatchObject({
      type: 'dialogue',
      characterName: '系统',
      content: '写入场景，而不是世界观。',
    })
  })

  it('does not clear existing drafts when PlotPilot chapter content is empty', () => {
    const graph = {
      id: 'proj',
      name: '空正文保护',
      cards: {
        ch1: {
          id: 'ch1',
          title: '第 1 章',
          moduleType: 'chapter',
          fields: [
            { id: 'ch1__chapterNumber', key: 'chapterNumber', name: 'Chapter Number', type: 'number', value: 1 },
            { id: 'ch1__novelDraft', key: 'novelDraft', name: '小说草稿', type: 'text', value: '不要被清空' },
          ],
        },
        sc1: {
          id: 'sc1',
          title: '1-0',
          moduleType: 'scene',
          fields: [
            { id: 'sc1__sceneNumber', key: 'sceneNumber', name: 'Scene Number', type: 'text', value: '1-0' },
            { id: 'sc1__script', key: 'script', name: '剧本', type: 'text', value: JSON.stringify({ version: 1, blocks: [{ type: 'narration', content: '不要被覆盖' }] }) },
          ],
        },
      },
      connections: [
        { id: 'e0', sourceCardId: 'ch1', targetCardId: 'sc1', relationshipLabel: 'contains' },
      ],
    }

    const result = applyPlotPilotChapterToStoryletGraph(graph, {
      id: 'chapter-storylet-proj-1',
      novel_id: 'storylet-proj',
      number: 1,
      title: '第1章',
      content: '   ',
      word_count: 0,
      status: 'draft',
    }, { now: 12345 })

    const cards = result.graph.cards as Record<string, any>

    expect(result.summary.updatedSceneCount).toBe(0)
    expect(result.summary.skippedSceneIds).toEqual(['sc1'])
    expect(cards.ch1.fields.find((field: any) => field.key === 'novelDraft').value).toBe('不要被清空')
    expect(JSON.parse(cards.sc1.fields.find((field: any) => field.key === 'script').value).blocks[0].content).toBe('不要被覆盖')
  })
})
