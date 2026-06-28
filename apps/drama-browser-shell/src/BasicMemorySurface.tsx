import * as React from 'react'
import {
  BookOpenText,
  Clock3,
  Copy,
  FileText,
  Pencil,
  RefreshCw,
  Save,
  Search,
} from 'lucide-react'

import type { DramaRuntimeClient } from '@drama/host'
import { Button, StatusBadge } from '@drama/ui'

interface BasicMemoryNoteSummary {
  path: string
  title: string
  type?: string
  uuid?: string
  createdAt?: string
  updatedAt?: string
  messageCount?: number
  size: number
  modifiedAt: string
  excerpt: string
}

interface BasicMemoryListResponse {
  root: string
  exists: boolean
  total: number
  returned: number
  truncated: boolean
  query: string
  notes: BasicMemoryNoteSummary[]
}

interface BasicMemoryReadResponse {
  root: string
  note: BasicMemoryNoteSummary
  content: string
}

interface BasicMemorySurfaceProps {
  runtime: DramaRuntimeClient
}

function formatDate(value?: string): string {
  if (!value) return 'unknown'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / 1024 / 1024).toFixed(1)} MB`
}

function stripFrontmatter(content: string): string {
  if (!content.startsWith('---\n')) return content
  const end = content.indexOf('\n---', 4)
  if (end < 0) return content
  return content.slice(end + 4).replace(/^\r?\n/, '')
}

function MarkdownPreview({ content }: { content: string }) {
  const body = stripFrontmatter(content)
  const blocks = body.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean)

  if (blocks.length === 0) {
    return <div className="basic-memory-empty-note">这个 note 还没有正文。</div>
  }

  return (
    <article className="basic-memory-markdown">
      {blocks.map((block, index) => {
        const heading = /^(#{1,4})\s+(.+)$/.exec(block)
        if (heading) {
          const level = heading[1]?.length ?? 1
          const text = heading[2] ?? ''
          if (level === 1) return <h1 key={index}>{text}</h1>
          if (level === 2) return <h2 key={index}>{text}</h2>
          return <h3 key={index}>{text}</h3>
        }

        if (block.startsWith('```')) {
          const code = block.replace(/^```[^\n]*\n?/, '').replace(/\n?```$/, '')
          return (
            <pre key={index}>
              <code>{code}</code>
            </pre>
          )
        }

        const lines = block.split(/\r?\n/)
        if (lines.every((line) => /^[-*]\s+/.test(line.trim()))) {
          return (
            <ul key={index}>
              {lines.map((line) => (
                <li key={line}>{line.trim().replace(/^[-*]\s+/, '')}</li>
              ))}
            </ul>
          )
        }

        if (block.startsWith('>')) {
          return <blockquote key={index}>{block.replace(/^>\s?/gm, '')}</blockquote>
        }

        return (
          <p key={index}>
            {lines.map((line, lineIndex) => (
              <React.Fragment key={`${line}-${lineIndex}`}>
                {line}
                {lineIndex < lines.length - 1 ? <br /> : null}
              </React.Fragment>
            ))}
          </p>
        )
      })}
    </article>
  )
}

export function BasicMemorySurface({ runtime }: BasicMemorySurfaceProps) {
  const [query, setQuery] = React.useState('')
  const [list, setList] = React.useState<BasicMemoryListResponse | null>(null)
  const [selectedPath, setSelectedPath] = React.useState<string | null>(null)
  const [activeNote, setActiveNote] = React.useState<BasicMemoryNoteSummary | null>(null)
  const [content, setContent] = React.useState('')
  const [draft, setDraft] = React.useState('')
  const [editing, setEditing] = React.useState(false)
  const [loadingList, setLoadingList] = React.useState(true)
  const [loadingNote, setLoadingNote] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [savedAt, setSavedAt] = React.useState<string | null>(null)

  const refreshList = React.useCallback(async (nextQuery = query) => {
    setLoadingList(true)
    setError(null)
    try {
      const result = await runtime.request<BasicMemoryListResponse>('basicMemory:list', {
        query: nextQuery,
        limit: 120,
      }, { timeoutMs: 8_000 })
      setList(result)
      setSelectedPath((currentPath) => {
        if (currentPath && result.notes.some((note) => note.path === currentPath)) return currentPath
        return result.notes[0]?.path ?? null
      })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError))
    } finally {
      setLoadingList(false)
    }
  }, [query, runtime])

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshList(query)
    }, 180)
    return () => window.clearTimeout(timer)
  }, [query, refreshList])

  React.useEffect(() => {
    if (!selectedPath) {
      setActiveNote(null)
      setContent('')
      setDraft('')
      return
    }

    let disposed = false
    setLoadingNote(true)
    setError(null)
    void (async () => {
      try {
        const result = await runtime.request<BasicMemoryReadResponse>('basicMemory:read', {
          path: selectedPath,
        }, { timeoutMs: 8_000 })
        if (disposed) return
        setActiveNote(result.note)
        setContent(result.content)
        setDraft(result.content)
        setEditing(false)
        setSavedAt(null)
      } catch (requestError) {
        if (!disposed) setError(requestError instanceof Error ? requestError.message : String(requestError))
      } finally {
        if (!disposed) setLoadingNote(false)
      }
    })()

    return () => {
      disposed = true
    }
  }, [runtime, selectedPath])

  const hasUnsavedChanges = draft !== content

  const saveNote = React.useCallback(async () => {
    if (!selectedPath || !hasUnsavedChanges) return
    setSaving(true)
    setError(null)
    try {
      const result = await runtime.request<BasicMemoryReadResponse>('basicMemory:write', {
        path: selectedPath,
        content: draft,
      }, { timeoutMs: 8_000 })
      setActiveNote(result.note)
      setContent(result.content)
      setDraft(result.content)
      setSavedAt(new Date().toLocaleTimeString())
      setList((currentList) => currentList
        ? {
          ...currentList,
          notes: currentList.notes.map((note) => note.path === result.note.path ? result.note : note),
        }
        : currentList)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError))
    } finally {
      setSaving(false)
    }
  }, [content, draft, hasUnsavedChanges, runtime, selectedPath])

  const copyActivePath = React.useCallback(() => {
    if (!list || !activeNote) return
    void navigator.clipboard?.writeText(`${list.root}/${activeNote.path}`)
  }, [activeNote, list])

  const noteCountLabel = list?.exists
    ? `${list.returned}/${list.total}`
    : 'missing'

  return (
    <section className="basic-memory-surface" aria-label="Basic Memory">
      <aside className="basic-memory-rail">
        <div className="basic-memory-rail-header">
          <div className="basic-memory-product-mark" aria-hidden="true">
            <BookOpenText />
          </div>
          <div>
            <div className="basic-memory-kicker">Basic Memory</div>
            <h2>Claude History</h2>
          </div>
        </div>

        <label className="basic-memory-search">
          <Search className="basic-memory-inline-icon" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Search local notes..."
            aria-label="Search local Basic Memory notes"
          />
        </label>

        <div className="basic-memory-stat-grid">
          <div>
            <span>Notes</span>
            <strong>{noteCountLabel}</strong>
          </div>
          <div>
            <span>Root</span>
            <strong>{list?.exists ? 'local' : 'missing'}</strong>
          </div>
        </div>

        <div className="basic-memory-list" aria-busy={loadingList}>
          {loadingList ? <div className="basic-memory-muted-row">Loading notes...</div> : null}
          {!loadingList && list?.notes.length === 0 ? (
            <div className="basic-memory-muted-row">No matching notes.</div>
          ) : null}
          {list?.notes.map((note) => (
            <button
              key={note.path}
              type="button"
              className="basic-memory-note-row"
              data-active={note.path === selectedPath ? 'true' : 'false'}
              onClick={() => setSelectedPath(note.path)}
            >
              <FileText className="basic-memory-note-icon" aria-hidden="true" />
              <span>
                <strong>{note.title}</strong>
                <small>{formatDate(note.updatedAt ?? note.modifiedAt)} · {note.messageCount ?? 0} messages</small>
              </span>
            </button>
          ))}
        </div>
      </aside>

      <main className="basic-memory-reader" aria-busy={loadingNote}>
        <header className="basic-memory-reader-header">
          <div className="basic-memory-reader-title">
            <span className="basic-memory-path">{activeNote?.path ?? 'No note selected'}</span>
            <h1>{activeNote?.title ?? 'Basic Memory'}</h1>
          </div>
          <div className="basic-memory-actions">
            <Button variant="outline" size="sm" onClick={() => void refreshList(query)}>
              <RefreshCw className="basic-memory-button-icon" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => setEditing((value) => !value)} disabled={!activeNote}>
              <Pencil className="basic-memory-button-icon" />
              {editing ? 'Preview' : 'Edit'}
            </Button>
            <Button size="sm" onClick={saveNote} disabled={!hasUnsavedChanges || saving}>
              <Save className="basic-memory-button-icon" />
              {saving ? 'Saving' : 'Save'}
            </Button>
          </div>
        </header>

        {error ? (
          <div className="basic-memory-error" role="alert">{error}</div>
        ) : null}

        <div className="basic-memory-document">
          {loadingNote ? (
            <div className="basic-memory-empty-note">Loading note...</div>
          ) : editing ? (
            <textarea
              className="basic-memory-editor"
              value={draft}
              spellCheck={false}
              onChange={(event) => setDraft(event.currentTarget.value)}
              aria-label="Edit Basic Memory note"
            />
          ) : (
            <MarkdownPreview content={content} />
          )}
        </div>
      </main>

      <aside className="basic-memory-inspector">
        <section className="basic-memory-inspector-card">
          <div className="basic-memory-inspector-title">
            <Clock3 className="basic-memory-inline-icon" aria-hidden="true" />
            <span>Metadata</span>
          </div>
          <dl>
            <div>
              <dt>Updated</dt>
              <dd>{formatDate(activeNote?.updatedAt ?? activeNote?.modifiedAt)}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatDate(activeNote?.createdAt)}</dd>
            </div>
            <div>
              <dt>Size</dt>
              <dd>{activeNote ? formatBytes(activeNote.size) : 'unknown'}</dd>
            </div>
            <div>
              <dt>UUID</dt>
              <dd>{activeNote?.uuid ?? 'none'}</dd>
            </div>
          </dl>
          <button type="button" className="basic-memory-copy-path" onClick={copyActivePath} disabled={!activeNote}>
            <Copy className="basic-memory-inline-icon" aria-hidden="true" />
            Copy path
          </button>
        </section>

        <section className="basic-memory-inspector-card">
          <div className="basic-memory-inspector-title">
            <FileText className="basic-memory-inline-icon" aria-hidden="true" />
            <span>Excerpt</span>
          </div>
          <p>{activeNote?.excerpt || 'No excerpt loaded.'}</p>
        </section>

        <div className="basic-memory-save-state">
          <StatusBadge tone={hasUnsavedChanges ? 'warning' : savedAt ? 'success' : 'neutral'} dot>
            {hasUnsavedChanges ? 'Unsaved' : savedAt ? `Saved ${savedAt}` : 'Clean'}
          </StatusBadge>
        </div>
      </aside>
    </section>
  )
}
