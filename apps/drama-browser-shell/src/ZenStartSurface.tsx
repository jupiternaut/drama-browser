import * as React from 'react'

const referenceSlides = [
  {
    src: 'reader-assets/brave-start-reference-street.png',
    label: 'Dark street billboard reference',
  },
  {
    src: 'reader-assets/brave-start-reference-station.png',
    label: 'Station billboard reference',
  },
]

const fallbackSlide = referenceSlides[0]!

const shortcutLabels = [
  'Immortal service',
  'Private workspace',
  'ChatGPT',
  'Media library',
  '4KHD',
  'Shopping',
  'Sign in',
]

function resolveSearchTarget(value: string): string {
  if (/^https?:\/\//i.test(value)) return value
  if (/^[^\s]+\.[^\s]+$/.test(value)) return `https://${value}`
  return `https://www.google.com/search?q=${encodeURIComponent(value)}`
}

export function ZenStartSurface() {
  const [slideIndex, setSlideIndex] = React.useState(0)
  const activeSlide = referenceSlides[slideIndex] ?? fallbackSlide

  return (
    <section className="zen-start-surface zen-start-reference-surface" aria-label="Zen Start">
      <img className="zen-start-reference-image" src={activeSlide.src} alt="" draggable={false} />

      <button className="zen-start-reference-settings" type="button" aria-label="Settings" />

      <nav className="zen-start-reference-shortcuts" aria-label="Top sites">
        {shortcutLabels.map((label) => (
          <button key={label} className="zen-start-reference-hotspot" type="button" aria-label={label} />
        ))}
      </nav>

      <form
        className="zen-start-reference-search"
        role="search"
        aria-label="Search or ask anything"
        onSubmit={(event) => {
          event.preventDefault()
          const input = event.currentTarget.elements.namedItem('zen-start-query')
          const value = input instanceof HTMLInputElement ? input.value.trim() : ''
          if (!value) return
          window.location.href = resolveSearchTarget(value)
        }}
      >
        <input
          id="zen-start-query"
          name="zen-start-query"
          aria-label="Search or ask anything"
          autoComplete="off"
        />
      </form>

      <button
        className="zen-start-reference-carousel zen-start-reference-carousel-prev"
        type="button"
        aria-label="Previous billboard"
        onClick={() => setSlideIndex((index) => (index + referenceSlides.length - 1) % referenceSlides.length)}
      />
      <button
        className="zen-start-reference-carousel zen-start-reference-carousel-next"
        type="button"
        aria-label="Next billboard"
        onClick={() => setSlideIndex((index) => (index + 1) % referenceSlides.length)}
      />

      <span className="zen-start-reference-status" aria-live="polite">
        {activeSlide.label}
      </span>
    </section>
  )
}
