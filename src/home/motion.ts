// Scroll- und Interaktionslogik der Startseite im Recto-Stil.
// Übernommen aus codex/rag-style-exploration (approved-blocks.js + Loader-Skripte) und als
// Effekte für React gekapselt: jede Funktion bekommt ihr Wurzelelement und gibt ein Cleanup zurück.
// Alles läuft nur im Browser (useEffect), der Prerender sieht den statischen Endzustand.

type Cleanup = () => void

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const smoothstep = (v: number) => { const p = clamp01(v); return p * p * (3 - 2 * p) }
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)')

// ── Kopfzeile ───────────────────────────────────────────────────────────────
// Scrollt im Fluss weg; beim Hochscrollen (≥ 7 px) kehren die Menü-Inseln fixiert zurück,
// beim erneuten Runterscrollen fahren sie um genau die Scrollstrecke nach oben heraus.
// Die Wortmarke wird als eigene fixe Ebene geklont und wechselt Schwarz/Weiß je nach Hintergrund.
export function mountHeader(page: HTMLElement): Cleanup {
  const abort = new AbortController()
  const { signal } = abort
  const cleanups: Cleanup[] = []
  const header = page.querySelector<HTMLElement>('.rx-header')
  if (!header) return () => abort.abort()
  const nav = header.querySelector<HTMLElement>('.rx-nav')!
  const actions = header.querySelector<HTMLElement>('.rx-header-actions')!

  let frame = 0
  let mode: 'flow' | 'pinned' | 'leaving' = 'flow'
  let exit = 0

  function setMode(next: typeof mode) {
    mode = next
    header!.classList.toggle('is-menu-pinned', next !== 'flow')
    header!.classList.toggle('is-menu-leaving', next === 'leaving')
    if (next !== 'leaving') exit = 0
    header!.style.setProperty('--header-scroll-offset', -exit + 'px')
    nav.inert = false
    actions.inert = false
  }
  // Kopfzeile bleibt immer sichtbar (Wunsch 24.11.): fest oben; ab 16px Scroll erscheinen die Glas-Inseln.
  function update() {
    frame = 0
    const y = Math.max(0, window.scrollY)
    if (mode !== 'pinned') setMode('pinned')
    header!.classList.toggle('is-scrolled', y > 16)
    header!.dataset.scrollMode = mode
    updateBrandTone()
  }
  window.addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(update) }, { passive: true, signal })

  const original = header.querySelector<HTMLElement>('.rx-wordmark')
  const fixed = original?.cloneNode(true) as HTMLElement | undefined
  if (original && fixed) {
    fixed.id = 'rx-fixed-brand'
    fixed.classList.add('rx-floating-wordmark')
    document.body.appendChild(fixed)
    original.classList.add('rx-brand-placeholder')
    original.setAttribute('aria-hidden', 'true')
    original.setAttribute('tabindex', '-1')
    cleanups.push(() => {
      fixed.remove()
      original.classList.remove('rx-brand-placeholder')
      original.removeAttribute('aria-hidden')
      original.removeAttribute('tabindex')
    })
  }
  function updateBrandTone() {
    if (!fixed) return
    const rect = fixed.getBoundingClientRect()
    const stack = document.elementsFromPoint(rect.left + Math.min(25, rect.width / 3), rect.top + rect.height / 2)
    let dark = page.dataset.theme === 'dark'
    for (const el of stack) {
      if (fixed.contains(el) || header!.contains(el)) continue
      const color = getComputedStyle(el).backgroundColor
      const v = color.match(/[\d.]+/g)?.map(Number)
      if (!v || v.length < 3 || (v[3] ?? 1) < 0.65) continue
      const scale = color.startsWith('color(') ? 255 : 1
      dark = ((0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]) * scale) / 255 < 0.48
      break
    }
    fixed.style.color = dark ? '#fff' : '#101114'
    fixed.dataset.onDark = String(dark)
  }
  function measure() {
    if (!original) return
    const rect = original.getBoundingClientRect()
    const top = rect.top - header!.getBoundingClientRect().top
    page.style.setProperty('--faq-sticky-top', Math.ceil(top + rect.height) + 24 + 'px')
    if (fixed) { fixed.style.left = rect.left + 'px'; fixed.style.top = top + 'px' }
    updateBrandTone()
  }
  measure()
  window.addEventListener('resize', measure, { passive: true, signal })
  document.fonts?.ready.then(() => { if (!signal.aborted) measure() })
  const themeObserver = new MutationObserver(measure)
  themeObserver.observe(page, { attributes: true, attributeFilter: ['data-theme'] })
  cleanups.push(() => themeObserver.disconnect(), () => cancelAnimationFrame(frame))
  update()
  return () => { abort.abort(); cleanups.forEach(c => c()) }
}

// ── Google Maps: Profilfächer + mitlaufende Artikelkarte + Artikel-Dialog ──────
export function mountMaps(root: HTMLElement): Cleanup {
  const abort = new AbortController()
  const { signal } = abort
  const section = root.querySelector<HTMLElement>('#maps')
  const timeline = root.querySelector<HTMLElement>('#maps-scroll')
  const motion = root.querySelector<HTMLElement>('#article-motion')
  if (!section || !timeline || !motion) return () => abort.abort()
  const article = motion.querySelector<HTMLElement>('.article-card')!
  const reading = root.querySelector<HTMLElement>('.maps-reading')!
  const reduced = reducedMotion()
  let zoom = 1
  let desktop = false
  let frame = 0

  function update() {
    frame = 0
    if (signal.aborted) return
    const bounds = timeline!.getBoundingClientRect()
    if (!desktop) {
      motion!.style.transform = 'none'
      motion!.style.opacity = '1'
      motion!.style.visibility = 'visible'
      motion!.inert = false
      section!.style.setProperty('--spread', '.45')
      return
    }
    const travel = Math.max(1, (timeline!.offsetHeight - section!.offsetHeight) * zoom)
    // Lineare Bewegung ab dem Moment, in dem die Sektion ins Bild kommt.
    const progress = clamp01((innerHeight - bounds.top) / (innerHeight + travel))
    const available = Math.max(0, reading.clientHeight - article.offsetHeight)
    const y = reduced.matches ? available : available * progress
    const fadeIn = smoothstep((innerHeight - bounds.top) / (innerHeight * 0.3))
    const fadeOut = 1 - smoothstep((progress - 0.85) / 0.15)
    const opacity = reduced.matches ? 1 : fadeIn * fadeOut
    motion!.style.transform = 'translate3d(0,' + y.toFixed(2) + 'px,0)'
    motion!.style.opacity = opacity.toFixed(4)
    motion!.style.visibility = opacity < 0.001 ? 'hidden' : 'visible'
    motion!.inert = opacity < 0.03
    motion!.dataset.progress = progress.toFixed(4)
    const fan = reduced.matches ? 0.2 : clamp01((innerHeight - bounds.top - innerHeight * 0.3) / (innerHeight * 0.9))
    section!.style.setProperty('--spread', fan.toFixed(3))
  }
  function measure() {
    const width = document.documentElement.clientWidth
    desktop = width > 760
    zoom = desktop ? width / 1228.8 : 1
    root.style.setProperty('zoom', String(zoom))
    if (desktop) {
      const stage = Math.max(540, (innerHeight - 170) / zoom)
      section!.style.height = stage + 'px'
      section!.style.minHeight = '0'
      timeline!.style.height = stage + Math.min(280, innerHeight * 0.3) / zoom + 'px'
    } else {
      section!.style.height = 'auto'
      section!.style.minHeight = '0'
      timeline!.style.height = 'auto'
    }
    update()
  }
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
  window.addEventListener('scroll', schedule, { passive: true, signal })
  window.addEventListener('resize', measure, { passive: true, signal })
  reduced.addEventListener('change', update, { signal })
  measure()
  document.fonts?.ready.then(() => { if (!signal.aborted) measure() })
  for (const link of root.querySelectorAll<HTMLElement>('[data-open]')) {
    link.addEventListener('click', e => {
      e.preventDefault()
      root.querySelector<HTMLDialogElement>('#' + link.dataset.open)?.showModal()
    }, { signal })
  }
  for (const dialog of root.querySelectorAll('dialog')) {
    dialog.querySelector('[data-close]')?.addEventListener('click', () => dialog.close(), { signal })
    dialog.addEventListener('click', e => {
      if (e.target !== dialog) return
      const r = dialog.getBoundingClientRect()
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close()
    }, { signal })
  }
  return () => { abort.abort(); cancelAnimationFrame(frame); root.style.removeProperty('zoom') }
}

// ── Google Search: Suchfeld → G-Logo wächst → 5 Karten → Bestell-CTA ────────────
export function mountSearchTimeline(root: HTMLElement): Cleanup {
  const abort = new AbortController()
  const { signal } = abort
  const q = <T extends Element = HTMLElement>(s: string) => root.querySelector<T>(s)!
  const timeline = q('.search-timeline')
  const scene = q('.search-scene')
  const search = q('.search-layer')
  const deck = q('.cards-layer')
  const cta = q('.cta-layer')
  const cards = Array.from(root.querySelectorAll<HTMLElement>('.source-card'))
  const status = q('#card-status')
  const logo = q<SVGElement>('.google-mark')
  const backdrop = q('.google-backdrop')
  const stage = q('.scene-stage')
  let current = -1
  let frame = 0

  function measureLogo() {
    const mark = logo.getBoundingClientRect()
    const area = stage.getBoundingClientRect()
    // Vektor in hoher Auflösung, damit das Skalieren scharf bleibt.
    backdrop.style.width = `${mark.width * 20}px`
    backdrop.style.height = `${mark.height * 20}px`
    backdrop.style.setProperty('--logo-x', `${mark.left + mark.width / 2 - area.left - area.width / 2}px`)
    backdrop.style.setProperty('--logo-y', `${mark.top + mark.height / 2 - area.top - area.height / 2}px`)
    logo.style.opacity = '0'
    backdrop.classList.add('is-ready')
  }
  function setLayer(layer: HTMLElement, visible: boolean, past: boolean) {
    layer.classList.toggle('is-visible', visible)
    layer.classList.toggle('is-past', past)
    layer.setAttribute('aria-hidden', String(!visible))
    layer.inert = !visible
  }
  function show(phase: number) {
    if (phase === current) return
    current = phase
    const isCard = phase > 0 && phase <= cards.length
    const index = phase - 1
    scene.dataset.phase = phase === 0 ? 'search' : isCard ? `card-${phase}` : 'cta'
    setLayer(search, phase === 0, phase > 0)
    setLayer(deck, isCard, phase > cards.length)
    setLayer(cta, phase > cards.length, false)
    backdrop.classList.toggle('is-expanded', phase > 0)
    backdrop.classList.toggle('is-exiting', phase > cards.length)
    cards.forEach((card, i) => {
      const d = i - index
      const active = isCard && d === 0
      const n = Math.max(0, d)
      card.classList.toggle('is-active', active)
      card.setAttribute('aria-hidden', String(!active))
      card.inert = !active
      card.style.zIndex = String(d < 0 ? 30 + i : 20 - d)
      card.style.opacity = isCard && d >= 0 && d <= 2 ? '1' : '0'
      card.style.transform = active
        ? 'translate3d(0,0,0) scale(1) rotate(0deg)'
        : d < 0
          ? 'translate3d(0,-35px,0) scale(.98) rotate(-2deg)'
          : `translate3d(${n * 3}px,${n * 9}px,0) scale(${1 - n * 0.027}) rotate(${n * 1.2}deg)`
    })
    status.textContent = phase === 0 ? 'Google-Suche' : isCard ? cards[index].getAttribute('aria-label') : 'Google Optimierung jetzt bestellen'
  }
  function update() {
    frame = 0
    const start = timeline.getBoundingClientRect().top + window.scrollY
    const travel = Math.max(1, timeline.offsetHeight - scene.offsetHeight)
    const progress = clamp01((window.scrollY - start) / travel)
    // Suchfeld 0–10 %, Karten 10–88 %, Bestell-CTA nur noch die letzten 12 % (vorher 20 % + leere Fläche danach).
    const phase = progress < 0.1 ? 0 : progress >= 0.88 ? cards.length + 1
      : 1 + Math.min(cards.length - 1, Math.floor((progress - 0.1) / (0.78 / cards.length)))
    show(phase)
  }
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
  window.addEventListener('scroll', schedule, { passive: true, signal })
  window.addEventListener('resize', () => { measureLogo(); schedule() }, { passive: true, signal })
  window.addEventListener('pageshow', schedule, { signal })
  measureLogo()
  update()
  return () => { abort.abort(); cancelAnimationFrame(frame) }
}

// ── 149-€-Band: liegt im Fluss bis zur Bildschirmmitte und verwandelt sich dann – rein an die
// Scrollposition gekoppelt – in die kompakte Leiste unten. Gleichzeitig schrumpft sein Platz im
// Dokument, sodass der nächste Abschnitt ohne Lücke nachrückt. Beim Hochscrollen läuft dieselbe
// Bewegung rückwärts: die Leiste wächst zurück an ihren Platz. Vor dem Seitenende (Abschluss-Karte,
// Footer) blendet die Leiste aus. Maße kommen aus versteckten Kopien (voll / kompakt).
export function mountOfferBand(section: HTMLElement): Cleanup {
  const abort = new AbortController()
  const { signal } = abort
  const band = section.querySelector<HTMLElement>('.rx-order-band')
  if (!band) return () => abort.abort()
  const motion = reducedMotion()
  const selectors = { logo: '.rx-order-logo', heading: 'h2', amount: '.rx-order-price strong', note: '.rx-order-price small', button: '.rx-order-button' } as const
  type Key = keyof typeof selectors
  type Item = { x: number; y: number; w: number; h: number; font: number; line: number }
  type Geo = { w: number; h: number; items: Record<Key, Item> }
  const parts = Object.fromEntries(Object.entries(selectors).map(([k, s]) => [k, band.querySelector<HTMLElement>(s)!])) as Record<Key, HTMLElement>
  const mix = (a: number, b: number, p: number) => a + (b - a) * p
  // Ab hier wird die kompakte Leiste ausgeblendet (sonst liegt sie über Abschluss-Karte und Footer).
  const stopAt = () => document.querySelector<HTMLElement>('.rx-closing') ?? document.querySelector<HTMLElement>('.rx-footer')
  let geometry: { full: Geo; compact: Geo } | null = null
  let frame = 0

  function snapshot(compact: boolean): Geo {
    const clone = band!.cloneNode(true) as HTMLElement
    clone.className = 'rx-order-band' + (compact ? ' is-compact-measure' : '')
    clone.removeAttribute('style')
    clone.setAttribute('aria-hidden', 'true')
    clone.inert = true
    clone.style.cssText = 'position:fixed!important;top:-10000px!important;left:0!important;visibility:hidden!important;opacity:0!important;transition:none!important;pointer-events:none!important;'
    if (!compact) clone.style.width = section.clientWidth + 'px'
    clone.querySelectorAll('[style]').forEach(el => el.removeAttribute('style'))
    clone.querySelectorAll('.rx-morph-part').forEach(el => el.classList.remove('rx-morph-part'))
    section.appendChild(clone)
    const box = clone.getBoundingClientRect()
    const items = {} as Record<Key, Item>
    for (const [key, sel] of Object.entries(selectors) as [Key, string][]) {
      const el = clone.querySelector(sel)!
      const r = el.getBoundingClientRect()
      const st = getComputedStyle(el)
      const font = parseFloat(st.fontSize) || 12
      items[key] = { x: r.left - box.left, y: r.top - box.top, w: r.width, h: r.height, font, line: parseFloat(st.lineHeight) || font * 1.25 }
    }
    clone.remove()
    return { w: box.width, h: box.height, items }
  }
  function measure() {
    geometry = { full: snapshot(false), compact: snapshot(true) }
    geometry.compact.items.heading = { ...geometry.full.items.heading, w: 0 }
    computeTarget()
    anim = null
    shown = target
    render(shown)
  }
  function show(visible: boolean) {
    band!.classList.toggle('is-scroll-hidden', !visible)
    band!.inert = !visible
    if (visible) band!.removeAttribute('aria-hidden')
    else band!.setAttribute('aria-hidden', 'true')
  }
  // Abstand unter dem Band im Ruhezustand – schrumpft beim Verwandeln mit, damit der nächste Abschnitt nachrückt.
  const gap = () => Math.round(Math.min(300, Math.max(160, innerHeight * 0.28)))
  // Ein Auslöser statt Scroll-Kopplung: überquert das Band die Bildschirmmitte, fährt es in einer
  // Bewegung (650 ms) zur Leiste unten, sein Platz schließt sich gleichzeitig; zurück genauso.
  const DURATION = 650
  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
  let shown = 0
  let target = 0
  let anim: { from: number; to: number; t0: number; dur: number } | null = null
  function computeTarget() {
    if (!geometry) return
    const top = section.getBoundingClientRect().top
    // Auslöser: Band-Mitte steigt über 60 % der Fensterhöhe (knapp unter der Mitte).
    const start = Math.max(96, innerHeight * 0.6 - geometry.full.h / 2)
    // Hysterese, damit es an der Grenze nicht hin und her springt.
    if (target === 0 && top < start) target = 1
    else if (target === 1 && top > start + 40) target = 0
  }
  function render(p: number) {
    const { full, compact } = geometry!
    const anchor = section.getBoundingClientRect()
    section.style.height = ((full.h + gap()) * (1 - p)).toFixed(2) + 'px'
    band!.classList.toggle('is-natural', p === 0)
    band!.classList.toggle('is-transforming', p > 0)
    band!.classList.toggle('is-condensed', p >= 0.6)
    if (p > 0) {
      const safeBottom = parseFloat(getComputedStyle(band!).getPropertyValue('--rx-safe-bottom')) || 0
      const bottomTop = innerHeight - compact.h - 20 - safeBottom
      const w = mix(full.w, compact.w, p)
      // Mitte: von der Mitte des Inhaltsbereichs zur Mitte des Fensters (ohne Scrollbalken).
      const cx = mix(anchor.left + anchor.width / 2, document.documentElement.clientWidth / 2, p)
      band!.style.setProperty('--morph-top', mix(anchor.top, bottomTop, p).toFixed(2) + 'px')
      band!.style.setProperty('--morph-left', (cx - w / 2).toFixed(2) + 'px')
      band!.style.setProperty('--morph-width', w.toFixed(2) + 'px')
      band!.style.setProperty('--morph-height', mix(full.h, compact.h, p).toFixed(2) + 'px')
      band!.style.setProperty('--heading-opacity', String(1 - clamp01(p * 2.4)))
      band!.style.setProperty('--tax-opacity', String(1 - clamp01(p * 2.4)))
      for (const [key, el] of Object.entries(parts) as [Key, HTMLElement][]) {
        const a = full.items[key], b = compact.items[key]
        for (const name of ['x', 'y', 'w', 'h', 'font', 'line'] as const) el.style.setProperty('--part-' + name, mix(a[name], b[name], p).toFixed(2) + 'px')
      }
    }
    parts.heading.inert = p >= 0.4
    band!.dataset.scrollState = p === 0 ? 'full' : p < 1 ? 'morph' : 'compact'
    const end = stopAt()
    show(!(p === 1 && end && end.getBoundingClientRect().top < innerHeight - 40))
  }
  function update() {
    frame = 0
    if (!geometry || signal.aborted) return
    const before = target
    computeTarget()
    if (target !== before) {
      if (motion.matches) { anim = null; shown = target }
      else anim = { from: shown, to: target, t0: performance.now(), dur: DURATION * Math.max(0.35, Math.abs(target - shown)) }
    }
    if (anim) {
      const t = clamp01((performance.now() - anim.t0) / anim.dur)
      shown = anim.from + (anim.to - anim.from) * ease(t)
      if (t >= 1) { shown = anim.to; anim = null }
    }
    render(shown)
    if (anim) frame = requestAnimationFrame(update)
  }
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
  Object.values(parts).forEach(el => el.classList.add('rx-morph-part'))
  window.addEventListener('scroll', schedule, { passive: true, signal })
  window.addEventListener('resize', measure, { passive: true, signal })
  motion.addEventListener('change', schedule, { signal })
  document.fonts?.ready.then(() => { if (!signal.aborted) measure() })
  measure()
  return () => { abort.abort(); cancelAnimationFrame(frame); section.style.removeProperty('height') }
}

// ── Social Media: Instagram-Feed scrollt mit, rechts wechseln die Texte ───────────
export function mountSocialStory(story: HTMLElement): Cleanup {
  const abort = new AbortController()
  const { signal } = abort
  const windowBox = story.querySelector<HTMLElement>('#rag-post-window')!
  const feed = story.querySelector<HTMLElement>('#rag-feed')!
  const panels = [...story.querySelectorAll<HTMLElement>('[data-text-stage]')]
  let active = 0
  let queued = false
  function setActive(index: number) {
    if (index === active) return
    active = index
    panels.forEach((panel, i) => {
      panel.classList.toggle('is-active', i === index)
      panel.setAttribute('aria-hidden', String(i !== index))
    })
  }
  function update() {
    queued = false
    const distance = Math.max(1, story.offsetHeight - innerHeight)
    const progress = clamp01(-story.getBoundingClientRect().top / distance)
    // Drei Beiträge laufen mit dem Scrollen; im vierten Takt bleibt der letzte Beitrag stehen,
    // rechts erscheint die Artikel-Einladung.
    const position = clamp01(progress / 0.7) * 2
    feed.style.transform = `translate3d(0,${-position * windowBox.clientHeight}px,0)`
    setActive(progress >= 0.805 ? 3 : position < 0.62 ? 0 : position < 1.5 ? 1 : 2)
  }
  const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(update) } }
  window.addEventListener('scroll', schedule, { passive: true, signal })
  window.addEventListener('resize', schedule, { passive: true, signal })
  update()
  // Jeder Beitrag hat ein GIF; lädt es nicht, erscheint das statische Ersatzbild.
  story.querySelectorAll<HTMLImageElement>('img[data-animated-demo]').forEach(img => {
    const frameEl = img.parentElement
    if (frameEl && img.dataset.fallbackSrc) {
      frameEl.style.backgroundImage = `url("${img.dataset.fallbackSrc}")`
      frameEl.style.backgroundSize = 'cover'
      frameEl.style.backgroundPosition = 'center'
    }
    const fail = () => {
      if (img.dataset.usedFallback || !img.dataset.fallbackSrc) return
      img.dataset.usedFallback = '1'
      img.src = img.dataset.fallbackSrc
      img.alt = 'Statisches Ersatzbild'
      img.style.objectFit = 'cover'
    }
    img.addEventListener('error', fail, { signal })
    if (img.complete && img.naturalWidth === 0) fail()
  })
  // Artikelkarte: Licht folgt dem Zeiger.
  const card = story.querySelector<HTMLElement>('#rag-related-open')
  const holder = card?.closest<HTMLElement>('.rag-related-holder')
  if (card && holder) {
    card.addEventListener('pointermove', e => {
      if (e.pointerType === 'touch') return
      const r = card.getBoundingClientRect()
      holder.style.setProperty('--rag-glow-x', `${e.clientX - r.left}px`)
      holder.style.setProperty('--rag-glow-y', `${e.clientY - r.top}px`)
    }, { passive: true, signal })
    card.addEventListener('pointerleave', () => {
      holder.style.removeProperty('--rag-glow-x')
      holder.style.removeProperty('--rag-glow-y')
    }, { passive: true, signal })
  }
  return () => abort.abort()
}

// ── Schnelle Übergänge zwischen den gepinnten Szenen ─────────────────────────────
// Ist eine Szene am Ende angekommen (Google Search: Bestell-CTA, Social Media: Artikel-Einladung),
// genügt ein Scroll nach unten: die Seite fährt in einer
// Bewegung zum Anfang des nächsten Blocks, statt den Rest der Szenenstrecke leer abzuscrollen.
// Während der Fahrt (≈700 ms) werden Mausrad/Touch/Tasten ignoriert, damit nichts ruckelt.
type Snap = { scene: string; at: number; next: string }
const SNAPS: Snap[] = [
  { scene: '#approved-search .search-timeline', at: 0.9, next: '#rag-story' },
  { scene: '#rag-story', at: 0.84, next: '#rx-scroll-story' },
]

export function mountSceneSnaps(root: HTMLElement): Cleanup {
  const abort = new AbortController()
  const { signal } = abort
  let lastY = window.scrollY
  let busy = false
  let frame = 0
  const block = (e: Event) => { if (busy) e.preventDefault() }
  const keys = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home', 'End'])
  window.addEventListener('wheel', block, { passive: false, signal })
  window.addEventListener('touchmove', block, { passive: false, signal })
  window.addEventListener('keydown', e => { if (busy && keys.has(e.key)) e.preventDefault() }, { signal })

  const topOf = (el: Element) => el.getBoundingClientRect().top + window.scrollY
  function glide(to: number) {
    const from = window.scrollY
    if (reducedMotion().matches) { window.scrollTo({ top: to, behavior: 'instant' as ScrollBehavior }); return }
    busy = true
    const dur = Math.min(900, Math.max(520, Math.abs(to - from) * 0.35))
    const t0 = performance.now()
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
    const step = (now: number) => {
      const t = clamp01((now - t0) / dur)
      window.scrollTo({ top: from + (to - from) * ease(t), behavior: 'instant' as ScrollBehavior })
      if (t < 1 && !signal.aborted) frame = requestAnimationFrame(step)
      else { busy = false; lastY = window.scrollY }
    }
    frame = requestAnimationFrame(step)
  }
  function onScroll() {
    if (busy) return
    const y = window.scrollY
    const down = y > lastY
    lastY = y
    if (!down || innerWidth <= 760) return
    for (const s of SNAPS) {
      const scene = root.querySelector<HTMLElement>(s.scene)
      const next = root.querySelector<HTMLElement>(s.next)
      if (!scene || !next) continue
      const start = topOf(scene)
      const travel = Math.max(1, scene.offsetHeight - innerHeight)
      const progress = (y - start) / travel
      const target = topOf(next)
      if (progress >= s.at && y < target - 4) { glide(target); return }
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true, signal })
  return () => { abort.abort(); cancelAnimationFrame(frame); busy = false }
}
