import * as React from 'react'
import {
  BookOpenText,
  BriefcaseBusiness,
  CheckCheck,
  ChevronDown,
  Code2,
  Clock3,
  Copy,
  Download,
  FileText,
  MessageCircle,
  PanelLeft,
  Pencil,
  Plus,
  RefreshCw,
  Route,
  Save,
  Search,
  Settings2,
  Sparkles,
  Zap,
} from 'lucide-react'

import type { DramaRuntimeClient } from '@drama/host'

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

const PINNED_NOTE_TITLES = [
  '自然语言与形式语言的关系',
  '两个世界的语言困境',
  '游戏成瘾机制分析',
  'AI产品创业的三层蒸馏与未来方向',
  '九牧之野联盟博弈的最优解',
  'CS Systems Architect skill loaded',
  '大模型作为放大器的局限性',
  '认知带宽限制下的需求表达困境',
  '功能使用指南和示例',
  '对抗性决策支持系统与技术专家提示词对比',
]

type BasicMemoryMode = 'chat' | 'cowork' | 'code'

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

function noteMatchesPinnedTitle(note: BasicMemoryNoteSummary, pinnedTitle: string): boolean {
  return note.title === pinnedTitle || note.title.includes(pinnedTitle) || pinnedTitle.includes(note.title)
}

function getPinnedNotes(notes: BasicMemoryNoteSummary[]): BasicMemoryNoteSummary[] {
  return PINNED_NOTE_TITLES
    .map((title) => notes.find((note) => noteMatchesPinnedTitle(note, title)))
    .filter((note): note is BasicMemoryNoteSummary => Boolean(note))
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
  const [mode, setMode] = React.useState<BasicMemoryMode>('code')
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
        limit: 320,
      }, { timeoutMs: 8_000 })
      setList(result)
      setSelectedPath((currentPath) => {
        if (currentPath && result.notes.some((note) => note.path === currentPath)) return currentPath
        const firstConversation = result.notes.find((note) => note.path !== 'conversations/INDEX.md')
        if (nextQuery.trim()) return firstConversation?.path ?? result.notes[0]?.path ?? null
        return getPinnedNotes(result.notes)[0]?.path ?? firstConversation?.path ?? result.notes[0]?.path ?? null
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

  const notes = (list?.notes ?? []).filter((note) => note.path !== 'conversations/INDEX.md')
  const pinnedNotes = React.useMemo(() => getPinnedNotes(notes), [notes])
  const pinnedPaths = React.useMemo(() => new Set(pinnedNotes.map((note) => note.path)), [pinnedNotes])
  const visibleRecentNotes = React.useMemo(() => (
    query.trim()
      ? notes
      : notes.filter((note) => !pinnedPaths.has(note.path)).slice(0, 18)
  ), [notes, pinnedPaths, query])
  const noteCountLabel = list?.exists
    ? `${list.returned}/${list.total}`
    : 'missing'
  const saveStateLabel = hasUnsavedChanges ? 'Unsaved' : savedAt ? `Saved ${savedAt}` : 'Clean'

  const renderNoteRow = (note: BasicMemoryNoteSummary, variant: 'pinned' | 'recent') => (
    <button
      key={`${variant}-${note.path}`}
      type="button"
      className="basic-memory-note-row"
      data-active={note.path === selectedPath ? 'true' : 'false'}
      onClick={() => setSelectedPath(note.path)}
    >
      {variant === 'pinned' ? (
        <span className="basic-memory-row-dot" aria-hidden="true" />
      ) : (
        <FileText className="basic-memory-note-icon" aria-hidden="true" />
      )}
      <span>
        <strong>{note.title}</strong>
        <small>{formatDate(note.updatedAt ?? note.modifiedAt)} · {note.messageCount ?? 0} messages</small>
      </span>
    </button>
  )

  return (
    <section className="basic-memory-surface" aria-label="Basic Memory">
      <aside className="basic-memory-rail">
        <div className="basic-memory-window-chrome" aria-hidden="true">
          <span className="basic-memory-traffic basic-memory-traffic-red" />
          <span className="basic-memory-traffic basic-memory-traffic-yellow" />
          <span className="basic-memory-traffic basic-memory-traffic-green" />
          <span className="basic-memory-rail-spacer" />
          <PanelLeft className="basic-memory-chrome-icon" />
          <Search className="basic-memory-chrome-icon" />
        </div>

        <div className="basic-memory-mode-switch" role="tablist" aria-label="Basic Memory mode">
          <button type="button" data-active={mode === 'chat'} onClick={() => setMode('chat')}>
            <MessageCircle className="basic-memory-inline-icon" aria-hidden="true" />
            Chat
          </button>
          <button type="button" data-active={mode === 'cowork'} onClick={() => setMode('cowork')}>
            <CheckCheck className="basic-memory-inline-icon" aria-hidden="true" />
            Cowork
          </button>
          <button type="button" data-active={mode === 'code'} onClick={() => setMode('code')}>
            <Code2 className="basic-memory-inline-icon" aria-hidden="true" />
            Code
          </button>
        </div>

        <nav className="basic-memory-nav" aria-label="Basic Memory actions">
          <button type="button" onClick={() => {
            setQuery('')
            setSelectedPath(null)
          }}>
            <Plus className="basic-memory-nav-icon" aria-hidden="true" />
            New session
          </button>
          <button type="button" onClick={() => setQuery('workflow')}>
            <Zap className="basic-memory-nav-icon" aria-hidden="true" />
            Routines
          </button>
          <button type="button" onClick={() => setQuery('prompt')}>
            <BriefcaseBusiness className="basic-memory-nav-icon" aria-hidden="true" />
            Customize
          </button>
        </nav>

        <label className="basic-memory-search">
          <Search className="basic-memory-inline-icon" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Search restored sessions..."
            aria-label="Search local Basic Memory notes"
          />
        </label>

        <div className="basic-memory-scroll">
          <div className="basic-memory-section-heading">
            <span>{query.trim() ? 'Search results' : 'Pinned'}</span>
            <small>{noteCountLabel}</small>
          </div>

          <div className="basic-memory-list" aria-busy={loadingList}>
            {loadingList ? <div className="basic-memory-muted-row">Loading sessions...</div> : null}
            {!loadingList && list?.notes.length === 0 ? (
              <div className="basic-memory-muted-row">No matching sessions.</div>
            ) : null}
            {!query.trim() ? pinnedNotes.map((note) => renderNoteRow(note, 'pinned')) : null}
            {query.trim() ? visibleRecentNotes.map((note) => renderNoteRow(note, 'recent')) : null}
          </div>

          {!query.trim() ? (
            <>
              <div className="basic-memory-section-heading basic-memory-recents-heading">
                <span>Recents</span>
                <small>{list?.exists ? `${list.total} restored` : 'offline'}</small>
              </div>
              <div className="basic-memory-list">
                {visibleRecentNotes.map((note) => renderNoteRow(note, 'recent'))}
              </div>
            </>
          ) : null}
        </div>

        <footer className="basic-memory-account">
          <span className="basic-memory-avatar" aria-hidden="true">J</span>
          <span>
            <strong>jupiter</strong>
            <small>{list?.exists ? 'Local' : 'Missing root'}</small>
          </span>
          <ChevronDown className="basic-memory-inline-icon" aria-hidden="true" />
          <Download className="basic-memory-inline-icon basic-memory-account-download" aria-hidden="true" />
        </footer>
      </aside>

      <main className="basic-memory-reader" aria-busy={loadingNote}>
        <div className="basic-memory-stage">
          <div className="basic-memory-reader-card">
            <header className="basic-memory-reader-header">
              <div className="basic-memory-reader-title">
                <div className="basic-memory-kicker">
                  <BookOpenText className="basic-memory-inline-icon" aria-hidden="true" />
                  Drama Browser Memory
                </div>
                <h1>{activeNote?.title ?? 'Claude History restored locally'}</h1>
                <span className="basic-memory-path">{activeNote?.path ?? 'Select a recovered session from the glass sidebar'}</span>
              </div>
              <div className="basic-memory-actions">
                <button type="button" onClick={() => void refreshList(query)}>
                  <RefreshCw className="basic-memory-button-icon" aria-hidden="true" />
                  Refresh
                </button>
                <button type="button" onClick={() => setEditing((value) => !value)} disabled={!activeNote}>
                  <Pencil className="basic-memory-button-icon" aria-hidden="true" />
                  {editing ? 'Preview' : 'Edit'}
                </button>
                <button type="button" onClick={saveNote} disabled={!hasUnsavedChanges || saving}>
                  <Save className="basic-memory-button-icon" aria-hidden="true" />
                  {saving ? 'Saving' : 'Save'}
                </button>
              </div>
            </header>

            {error ? (
              <div className="basic-memory-error" role="alert">{error}</div>
            ) : null}

            <div className="basic-memory-meta-strip">
              <span>
                <Clock3 className="basic-memory-inline-icon" aria-hidden="true" />
                {formatDate(activeNote?.updatedAt ?? activeNote?.modifiedAt)}
              </span>
              <span>{activeNote?.messageCount ?? 0} messages</span>
              <span>{activeNote ? formatBytes(activeNote.size) : 'No file'}</span>
              <button type="button" onClick={copyActivePath} disabled={!activeNote}>
                <Copy className="basic-memory-inline-icon" aria-hidden="true" />
                Copy path
              </button>
              <span className="basic-memory-save-pill" data-state={hasUnsavedChanges ? 'dirty' : savedAt ? 'saved' : 'clean'}>
                {saveStateLabel}
              </span>
            </div>

            <div className="basic-memory-document">
              {loadingNote ? (
                <div className="basic-memory-empty-note">Loading session...</div>
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
          </div>
        </div>

        <aside className="basic-memory-inspector" aria-label="Session details">
          <section className="basic-memory-inspector-card">
            <div className="basic-memory-inspector-title">
              <Settings2 className="basic-memory-inline-icon" aria-hidden="true" />
              <span>Session details</span>
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
                <dt>UUID</dt>
                <dd>{activeNote?.uuid ?? 'none'}</dd>
              </div>
            </dl>
          </section>

          <section className="basic-memory-inspector-card">
            <div className="basic-memory-inspector-title">
              <Sparkles className="basic-memory-inline-icon" aria-hidden="true" />
              <span>Excerpt</span>
            </div>
            <p>{activeNote?.excerpt || 'No excerpt loaded.'}</p>
          </section>

          <section className="basic-memory-inspector-card">
            <div className="basic-memory-inspector-title">
              <Route className="basic-memory-inline-icon" aria-hidden="true" />
              <span>Local source</span>
            </div>
            <p>{list?.root ?? '/Users/gengrf/basic-memory-claude-history'}</p>
          </section>
        </aside>
      </main>
    </section>
  )
}
