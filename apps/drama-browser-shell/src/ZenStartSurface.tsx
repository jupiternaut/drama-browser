import * as React from 'react'
import {
  Activity,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleGauge,
  Command,
  FolderOpen,
  MessageSquareText,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

const heroImage = 'reader-assets/zen-start-board.png'

const shortcuts = [
  { label: 'Workspace', glyph: 'W', tone: 'cyan' },
  { label: 'ChatGPT', glyph: 'AI', tone: 'white' },
  { label: 'PLM', glyph: 'P', tone: 'gold' },
  { label: 'Graph', glyph: 'G', tone: 'blue' },
  { label: 'Crew', glyph: 'C', tone: 'green' },
  { label: 'Docs', glyph: 'D', tone: 'violet' },
  { label: 'Sign in', glyph: '*', tone: 'orange' },
]

const stats = [
  { value: '1,053', label: 'Trackers blocked', tone: 'orange' },
  { value: '30.5 MB', label: 'Bandwidth saved', tone: 'violet' },
  { value: '53s', label: 'Focus recovered', tone: 'white' },
]

export function ZenStartSurface() {
  return (
    <section className="zen-start-surface" aria-label="Zen Start">
      <div className="zen-start-backdrop" style={{ backgroundImage: `url(${heroImage})` }} aria-hidden="true" />
      <div className="zen-start-vignette" aria-hidden="true" />

      <button className="zen-start-settings" type="button" aria-label="Zen Start settings">
        <Settings />
      </button>

      <main className="zen-start-stage">
        <nav className="zen-start-shortcuts" aria-label="Zen shortcuts">
          {shortcuts.map((shortcut) => (
            <button key={shortcut.label} className="zen-start-shortcut" data-tone={shortcut.tone} type="button">
              <span className="zen-start-shortcut-icon">{shortcut.glyph}</span>
              <span className="zen-start-shortcut-label">{shortcut.label}</span>
            </button>
          ))}
        </nav>

        <div className="zen-start-page-dots" aria-hidden="true">
          <span data-active="true" />
          <span />
        </div>

        <form
          className="zen-start-search"
          role="search"
          onSubmit={(event) => {
            event.preventDefault()
            const input = event.currentTarget.elements.namedItem('zen-start-query')
            const value = input instanceof HTMLInputElement ? input.value.trim() : ''
            if (!value) return
            const target = /^https?:\/\//i.test(value)
              ? value
              : `https://www.google.com/search?q=${encodeURIComponent(value)}`
            window.location.href = target
          }}
        >
          <ShieldCheck className="zen-start-search-brand" aria-hidden="true" />
          <input id="zen-start-query" name="zen-start-query" placeholder="Search or ask anything..." autoComplete="off" />
          <button className="zen-start-search-submit" type="submit" aria-label="Search">
            <Search />
          </button>
        </form>

        <section className="zen-start-hero" aria-label="Zen Start carousel">
          <div className="zen-start-hero-copy">
            <p>ZEN START</p>
            <h1>Your data stays yours.</h1>
            <span>Private workspace, fast search, calm launch.</span>
          </div>
          <div className="zen-start-hero-brand">
            <Sparkles />
            <span>Drama Browser</span>
          </div>
          <div className="zen-start-carousel-controls" aria-hidden="true">
            <ChevronLeft />
            <span />
            <span data-active="true" />
            <span />
            <ChevronRight />
          </div>
        </section>
      </main>

      <section className="zen-start-cards" aria-label="Zen Start cards">
        <article className="zen-start-card zen-start-stats-card">
          <header>
            <span>STATS</span>
            <CircleGauge />
          </header>
          <div className="zen-start-stats-grid">
            {stats.map((item) => (
              <div key={item.label} className="zen-start-stat" data-tone={item.tone}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="zen-start-card zen-start-focus-card">
          <div className="zen-start-card-icon">
            <Command />
          </div>
          <div>
            <span className="zen-start-card-kicker">FOCUS</span>
            <h2>Turn this page into your command center</h2>
            <p>Open PLM, Graph, Crew, or a clean browser session without leaving Zen.</p>
          </div>
          <button type="button">Open command</button>
        </article>

        <article className="zen-start-card zen-start-space-card">
          <header>
            <span>DRAMA SPACES</span>
            <ShieldCheck />
          </header>
          <ul>
            <li><Activity /> Privacy and runtime status at a glance</li>
            <li><FolderOpen /> Recent workspace and project shortcuts</li>
            <li><CalendarDays /> Focus sessions and daily launch rhythm</li>
          </ul>
          <button type="button">Start free flow</button>
        </article>
      </section>

      <div className="zen-start-sponsor">
        <MessageSquareText />
        <span>Drama Browser Start</span>
      </div>
    </section>
  )
}
