import { afterEach, describe, expect, it } from 'bun:test'
import { mkdtemp, readFile, readdir, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

import { listDramaProjectFiles, recordDramaProjectFile } from '../project-files.ts'

const tempRoots: string[] = []

async function tempWorkspace(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'drama-project-files-'))
  tempRoots.push(root)
  return root
}

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

describe('recordDramaProjectFile', () => {
  it('creates a root project directory and appends a new source file per record', async () => {
    const workspaceRoot = await tempWorkspace()

    const first = await recordDramaProjectFile({
      workspaceRoot,
      now: () => 1200,
      request: {
        projectId: 'Novel One',
        source: 'plm',
        type: 'plm.novel.created',
        title: 'Novel One',
        summary: { chapterCount: 0 },
        payload: { id: 'novel-1' },
      },
    })
    const second = await recordDramaProjectFile({
      workspaceRoot,
      now: () => 1200,
      request: {
        projectId: 'Novel One',
        source: 'plm',
        type: 'plm.novel.updated',
        payload: { title: 'Novel One Updated' },
      },
    })

    expect(first.projectDir).toBe(join(workspaceRoot, 'drama-projects', 'Novel-One'))
    expect(second.projectDir).toBe(first.projectDir)
    expect(first.filePath).not.toBe(second.filePath)

    const entries = await readdir(join(workspaceRoot, 'drama-projects', 'Novel-One', 'plm'))
    expect(entries).toHaveLength(2)
    expect(entries[0]).toContain('plm.novel.')

    const record = JSON.parse(await readFile(first.filePath, 'utf8')) as Record<string, unknown>
    expect(record).toMatchObject({
      schema: 'drama.project_file_event.v1',
      projectId: 'Novel One',
      source: 'plm',
      type: 'plm.novel.created',
      title: 'Novel One',
      summary: { chapterCount: 0 },
      payload: { id: 'novel-1' },
    })
  })

  it('sanitizes project and source names before writing', async () => {
    const workspaceRoot = await tempWorkspace()

    const result = await recordDramaProjectFile({
      workspaceRoot,
      now: () => 1300,
      request: {
        projectId: '..\\bad/project',
        source: '../graph',
        type: 'graph.created',
      },
    })

    expect(result.projectDir).toBe(join(workspaceRoot, 'drama-projects', '..-bad-project'))
    expect(result.filePath.startsWith(join(result.projectDir, '..-graph'))).toBe(true)
  })

  it('lists project files newest first with source, type prefix, and limit filters', async () => {
    const workspaceRoot = await tempWorkspace()

    await recordDramaProjectFile({
      workspaceRoot,
      now: () => 2100,
      request: {
        projectId: 'Novel One',
        source: 'plm',
        type: 'plm.storageCard.prompt.saved',
        title: 'Prompt A',
        payload: { id: 'prompt-a', template: 'A' },
      },
    })
    await recordDramaProjectFile({
      workspaceRoot,
      now: () => 2200,
      request: {
        projectId: 'Novel One',
        source: 'plm',
        type: 'plm.storageCard.prompt.saved',
        title: 'Prompt B',
        payload: { id: 'prompt-b', template: 'B' },
      },
    })
    await recordDramaProjectFile({
      workspaceRoot,
      now: () => 2300,
      request: {
        projectId: 'Novel One',
        source: 'plm',
        type: 'plm.chapter.generated',
        title: 'Chapter',
        payload: { id: 'chapter-1' },
      },
    })

    const result = await listDramaProjectFiles({
      workspaceRoot,
      request: {
        projectId: 'Novel One',
        source: 'plm',
        typePrefix: 'plm.storageCard.prompt.',
        limit: 1,
      },
    })

    expect(result.projectDir).toBe(join(workspaceRoot, 'drama-projects', 'Novel-One'))
    expect(result.files).toHaveLength(1)
    expect(result.files[0]).toMatchObject({
      projectId: 'Novel One',
      source: 'plm',
      type: 'plm.storageCard.prompt.saved',
      title: 'Prompt B',
      payload: { id: 'prompt-b', template: 'B' },
    })
  })
})
