import * as React from 'react'

const referenceSlides = [
  {
    src: 'reader-assets/brave-start-reference-street.png',
    label: 'Dark street billboard reference',
    imageWidth: '152%',
    anchorTranslateX: '-51.57%',
    anchorTranslateY: '-55.66%',
  },
  {
    src: 'reader-assets/brave-start-reference-station.png',
    label: 'Station billboard reference',
    imageWidth: '141%',
    anchorTranslateX: '-50.3%',
    anchorTranslateY: '-57.2%',
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
  const wheelGestureRef = React.useRef({ deltaX: 0, lastSwitchAt: 0 })
  const pointerStartXRef = React.useRef<number | null>(null)

  const switchSlide = React.useCallback((direction: 1 | -1) => {
    setSlideIndex((index) => (index + direction + referenceSlides.length) % referenceSlides.length)
  }, [])

  const handleWheel = React.useCallback((event: React.WheelEvent<HTMLElement>) => {
    if (Math.abs(event.deltaX) < Math.abs(event.deltaY) * 1.15 || Math.abs(event.deltaX) < 8) return

    event.preventDefault()
    const gesture = wheelGestureRef.current
    gesture.deltaX += event.deltaX

    const now = Date.now()
    if (Math.abs(gesture.deltaX) < 72 || now - gesture.lastSwitchAt < 520) return

    switchSlide(gesture.deltaX > 0 ? 1 : -1)
    gesture.deltaX = 0
    gesture.lastSwitchAt = now
  }, [switchSlide])

  const handlePointerDown = React.useCallback((event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return
    pointerStartXRef.current = event.clientX
  }, [])

  const handlePointerUp = React.useCallback((event: React.PointerEvent<HTMLElement>) => {
    const startX = pointerStartXRef.current
    pointerStartXRef.current = null
    if (startX === null) return

    const deltaX = event.clientX - startX
    if (Math.abs(deltaX) < 72) return
    switchSlide(deltaX < 0 ? 1 : -1)
  }, [switchSlide])

  const slideStyle = {
    '--start-image-width': activeSlide.imageWidth,
    '--start-anchor-translate-x': activeSlide.anchorTranslateX,
    '--start-anchor-translate-y': activeSlide.anchorTranslateY,
  } as React.CSSProperties

  return (
    <section
      className="zen-start-surface zen-start-reference-surface"
      style={slideStyle}
      aria-label="Zen Start"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
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
        onClick={() => switchSlide(-1)}
      />
      <button
        className="zen-start-reference-carousel zen-start-reference-carousel-next"
        type="button"
        aria-label="Next billboard"
        onClick={() => switchSlide(1)}
      />

      <span className="zen-start-reference-status" aria-live="polite">
        {activeSlide.label}
      </span>
    </section>
  )
}
