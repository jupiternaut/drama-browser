import { describe, expect, it } from 'bun:test'

import { normalizeStoryletGraph } from '../storylet-plotpilot-bridge'
import { buildStoryletNativeGraphModel } from '../storylet-native-graph'

const graph = {
  id: 'native-graph',
  name: '原生画布测试',
  cards: {
    world: {
      id: 'world',
      title: 'Token 续命社会',
      moduleType: 'world',
      position: { x: 40, y: 80 },
      fields: [
        { id: 'overview', key: 'worldOverview', name: '世界观', value: '所有输入都会被模型胃消化。' },
      ],
    },
    hero: {
      id: 'hero',
      title: '顾临川',
      moduleType: 'character',
      fields: [
        { id: 'role', key: 'role', name: '角色', value: '重生创业者' },
      ],
    },
    scene: {
      id: 'scene',
      title: 'S01',
      moduleType: 'scene',
      fields: [
        { id: 'purpose', key: 'scenePurpose', name: '场景目的', value: '主角发现 token 欠费单。' },
      ],
    },
  },
  connections: {
    e1: { id: 'e1', sourceCardId: 'world', targetCardId: 'scene', relationshipLabel: 'pressure' },
    broken: { id: 'broken', sourceCardId: 'world', targetCardId: 'missing', relationshipLabel: 'lost' },
  },
}

describe('buildStoryletNativeGraphModel', () => {
  it('preserves card identity, card kind, and existing Storylet positions', () => {
    const model = buildStoryletNativeGraphModel(normalizeStoryletGraph(graph))
    const world = model.nodes.find((node) => node.id === 'world')

    expect(model.schema).toBe('drama.storylet_native_graph.v1')
    expect(model.graphId).toBe('native-graph')
    expect(world).toMatchObject({
      id: 'world',
      title: 'Token 续命社会',
      kind: 'world',
      x: 40,
      y: 80,
    })
    expect(world?.summary).toContain('所有输入')
  })

  it('lays out cards without saved positions and filters dangling edges', () => {
    const model = buildStoryletNativeGraphModel(normalizeStoryletGraph(graph))
    const hero = model.nodes.find((node) => node.id === 'hero')
    const scene = model.nodes.find((node) => node.id === 'scene')

    expect(hero?.x).toBeGreaterThanOrEqual(0)
    expect(hero?.y).toBeGreaterThanOrEqual(0)
    expect(scene?.x).toBeGreaterThanOrEqual(0)
    expect(scene?.y).toBeGreaterThanOrEqual(0)
    expect(model.edges).toEqual([
      expect.objectContaining({ id: 'e1', source: 'world', target: 'scene', label: 'pressure' }),
    ])
  })

  it('computes a canvas bounds rectangle for fit-view and minimap usage', () => {
    const model = buildStoryletNativeGraphModel(normalizeStoryletGraph(graph))

    expect(model.bounds.width).toBeGreaterThan(0)
    expect(model.bounds.height).toBeGreaterThan(0)
    expect(model.summary).toMatchObject({ cardCount: 3, edgeCount: 1 })
  })
})
