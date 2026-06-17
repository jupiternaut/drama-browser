import { mkdir, readFile, readdir, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join, resolve, sep } from 'path'

import type {
  DramaProjectFileListRequest,
  DramaProjectFileListResult,
  DramaProjectFileRecordRequest,
  DramaProjectFileRecordResult,
  DramaProjectFileSource,
} from './ipc-contract.ts'

export interface RecordDramaProjectFileOptions {
  workspaceRoot: string
  request: DramaProjectFileRecordRequest
  now?: () => number
}

export interface ListDramaProjectFilesOptions {
  workspaceRoot: string
  request: DramaProjectFileListRequest
}

export const DRAMA_PROJECTS_DIR_NAME = 'drama-projects'

export async function recordDramaProjectFile(
  options: RecordDramaProjectFileOptions,
): Promise<DramaProjectFileRecordResult> {
  const now = options.now ?? Date.now
  const workspaceRoot = resolve(options.workspaceRoot)
  const projectsDir = resolve(workspaceRoot, DRAMA_PROJECTS_DIR_NAME)
  assertInside(workspaceRoot, projectsDir)

  const projectId = safeDramaProjectFileStem(options.request.projectId)
  const source = safeDramaProjectFileStem(options.request.source || 'manual') as DramaProjectFileSource
  const type = safeDramaProjectFileStem(options.request.type || 'event')
  const projectDir = resolve(projectsDir, projectId)
  const sourceDir = resolve(projectDir, source)
  assertInside(projectsDir, projectDir)
  assertInside(projectDir, sourceDir)

  await mkdir(sourceDir, { recursive: true })

  const createdAt = now()
  const filePath = resolve(sourceDir, `${timestampFilePart(createdAt)}-${type}-${uniqueFilePart()}.json`)
  assertInside(sourceDir, filePath)

  const record = {
    schema: 'drama.project_file_event.v1',
    projectId: options.request.projectId,
    source: options.request.source,
    type: options.request.type,
    title: options.request.title,
    createdAt,
    summary: options.request.summary ?? {},
    payload: options.request.payload ?? null,
  }

  await writeFile(filePath, `${JSON.stringify(record, null, 2)}\n`, 'utf8')

  return {
    projectDir,
    filePath,
  }
}

export async function listDramaProjectFiles(
  options: ListDramaProjectFilesOptions,
): Promise<DramaProjectFileListResult> {
  const workspaceRoot = resolve(options.workspaceRoot)
  const projectsDir = resolve(workspaceRoot, DRAMA_PROJECTS_DIR_NAME)
  assertInside(workspaceRoot, projectsDir)

  const projectId = safeDramaProjectFileStem(options.request.projectId)
  const projectDir = resolve(projectsDir, projectId)
  assertInside(projectsDir, projectDir)

  if (!existsSync(projectDir)) {
    return { projectDir, files: [] }
  }

  const requestedSources = options.request.source
    ? [safeDramaProjectFileStem(options.request.source)]
    : await listDirectoryNames(projectDir)
  const limit = Math.max(1, Math.min(Math.floor(options.request.limit ?? 50), 500))
  const files = []

  for (const source of requestedSources) {
    const sourceDir = resolve(projectDir, source)
    assertInside(projectDir, sourceDir)
    if (!existsSync(sourceDir)) continue

    const entries = await readdir(sourceDir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.json')) continue
      const filePath = resolve(sourceDir, entry.name)
      assertInside(sourceDir, filePath)
      files.push(filePath)
    }
  }

  const records = []
  for (const filePath of files.sort().reverse()) {
    if (records.length >= limit) break
    try {
      const raw = await readFile(filePath, 'utf8')
      const record = JSON.parse(raw) as Record<string, unknown>
      if (record.schema !== 'drama.project_file_event.v1') continue
      const type = typeof record.type === 'string' ? record.type : undefined
      if (options.request.typePrefix && !type?.startsWith(options.request.typePrefix)) continue
      records.push({
        filePath,
        schema: 'drama.project_file_event.v1' as const,
        projectId: String(record.projectId ?? ''),
        source: typeof record.source === 'string' ? record.source : undefined,
        type,
        title: typeof record.title === 'string' ? record.title : undefined,
        createdAt: typeof record.createdAt === 'number' ? record.createdAt : undefined,
        summary: isRecord(record.summary) ? record.summary : undefined,
        payload: record.payload,
      })
    } catch {
      continue
    }
  }

  return {
    projectDir,
    files: records,
  }
}

async function listDirectoryNames(path: string): Promise<string[]> {
  const entries = await readdir(path, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function safeDramaProjectFileStem(value: string): string {
  const stem = String(value)
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/^\.+$/g, '')
    .replace(/^-+|-+$/g, '')

  return stem || 'project'
}

function timestampFilePart(value: number): string {
  if (!Number.isFinite(value)) return String(Date.now())
  return String(Math.max(0, Math.floor(value))).padStart(13, '0')
}

function uniqueFilePart(): string {
  return `${process.pid}-${Math.random().toString(36).slice(2, 8)}`
}

function assertInside(parent: string, child: string): void {
  const resolvedParent = resolve(parent)
  const resolvedChild = resolve(child)
  if (resolvedChild === resolvedParent) return
  if (!resolvedChild.startsWith(`${resolvedParent}${sep}`)) {
    throw new Error(`Drama project path escaped workspace: ${resolvedChild}`)
  }
}
