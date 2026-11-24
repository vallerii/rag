import { memo, useEffect, useRef } from 'react'

// «Alle Kanäle sollten eine klare Geschichte über Ihr Unternehmen erzählen.»
// Gepinnte Szene: links der Satz, rechts wechseln Kanal-Bild und Prüfpunkte mit dem Scrollen
// (13 Punkte in 4 Kanälen). Unten erscheint eine Leiste mit Fortschritt und «Weiter: …».
// Bei reduzierter Bewegung oder niedrigem Fenster: statische Liste statt Scroll-Szene.

const CHANNELS = [
  { name: 'Google Maps', kind: 'maps', points: ['Anzahl der Bewertungen', 'Relevante Begriffe in den Bewertungstexten', 'Sternebewertungen'] },
  { name: 'Social Media', kind: 'social', points: ['Regelmäßige Beiträge', 'Einblicke in abgeschlossene Arbeiten', 'Follower und eine aktive Community'] },
  {
    name: 'Ihre Website', kind: 'website',
    points: ['Eigene Informationen zu jeder Leistung', 'Passende Suchbegriffe in den Leistungsbeschreibungen', 'Eine klare Seiten- und Linkstruktur', 'Regelmäßig aktualisierte Inhalte', 'Eigene Projektberichte mit Fotos und Kommentaren'],
  },
  { name: 'Lokale Verzeichnisse', kind: 'directory', points: ['Einheitlicher Name, Adresse und Kontaktdaten', 'Übereinstimmende Angaben zu Ihren Leistungen', 'Präsenz auf mehreren lokalen Ressourcen'] },
]
const STEPS = CHANNELS.flatMap((c, channel) => c.points.map((_, point) => ({ channel, point })))

// Statisches Markup der Szene; die Inhalte rechts setzt der Effekt (nicht von React verwaltet).
const MARKUP = { __html: "<section class=\"story\" id=\"rx-scroll-story\"><div class=\"pin\"><div class=\"scene\"><div class=\"left\"><h2 class=\"story-title\" id=\"rx-channel-story-title\">Alle Kanäle sollten eine <em>klare Geschichte</em> über Ihr Unternehmen erzählen.</h2></div><div class=\"right\"><h3 class=\"lead\" id=\"channel\">Google Maps</h3><div class=\"art\" aria-hidden=\"true\"><div class=\"visual active\" data-art=\"maps\"><div class=\"map\"><div class=\"river\"></div><div class=\"park\"></div><div class=\"road\"></div><div class=\"road b\"></div><div class=\"road c\"></div><div class=\"map-marker\"></div><div class=\"map-marker two\"></div></div><img class=\"map-pin\" src=\"/rx/story-4a9012a68a.svg\"><div class=\"map-pill\">Leistung + Nähe = Sie</div></div><div class=\"visual\" data-art=\"social\"><div class=\"social-glow\"></div><div class=\"social-orbit\"></div><div class=\"tile instagram\"><img src=\"/rx/story-09a85f6e3f.svg\"></div><div class=\"tile tiktok\"><img src=\"/rx/story-94023a56eb.svg\"></div></div><div class=\"visual\" data-art=\"website\"><div class=\"browser\"><div class=\"browser-top\"><span class=\"browser-dots\">•••</span>ihr-betrieb.de</div><div class=\"browser-body\"><div class=\"browser-copy\"><small>Handwerk. Mit Haltung.</small><em>Hier sind Sie richtig.</em><span>Leistungen entdecken ↗</span></div><img src=\"/recto/beauty.webp\"></div></div></div><div class=\"visual\" data-art=\"directory\"><div class=\"directory-list\"><span><img class=\"directory-logo\" src=\"/brands/werkenntdenbesten.ico\" alt=\"\" /><b>werkenntdenbesten.de</b></span><span><img class=\"directory-logo\" src=\"/brands/trustlocal.svg\" alt=\"\" /><b>trustlocal.de</b></span><span><img class=\"directory-logo\" src=\"/brands/hwk.svg\" alt=\"\" /><b>hwk-koeln.de</b></span><span><img class=\"directory-logo\" src=\"/brands/houzz.svg\" alt=\"\" /><b>houzz.de</b></span></div></div></div><div id=\"features\"><div class=\"feature active\"><h3>Anzahl der Bewertungen</h3><span class=\"dot\"></span></div><div class=\"feature future\"><h3>Relevante Begriffe in den Bewertungstexten</h3><span class=\"dot\"></span></div><div class=\"feature future\"><h3>Sternebewertungen</h3><span class=\"dot\"></span></div></div></div></div><div class=\"footer\" id=\"source-controls\" inert aria-hidden=\"true\"><span id=\"footer-label\">Google Maps</span><div class=\"progress\" id=\"progress\" aria-hidden=\"true\"></div><button id=\"next-channel\" type=\"button\">Weiter: Social Media ↘</button></div></div></section><div class=\"reduced-extra\" id=\"static-content\"></div>" }

function ChannelStory() {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const host: HTMLElement = ref.current
    const byId = (id: string) => host.querySelector<HTMLElement>(`[id="${id}"]`)!
    const story = byId('rx-scroll-story')
    const pin = host.querySelector<HTMLElement>('.pin')!
    const features = byId('features')
    const controls = byId('source-controls')
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    let channel = -1
    let frame = 0
    let reached = -1
    let step = -1
    let controlsShown: boolean | null = null
    let lastWidth = innerWidth

    const setViewport = () => host.style.setProperty('--source-viewport-height', innerHeight + 'px')
    setViewport()
    const isStatic = () => reduced.matches || (innerWidth > 760 && innerHeight <= 640)

    function show(index: number) {
      if (index === step) return
      step = index
      reached = Math.max(reached, index)
      const s = STEPS[Math.max(0, Math.min(STEPS.length - 1, index))]
      const c = CHANNELS[s.channel]
      if (channel !== s.channel) {
        channel = s.channel
        byId('channel').textContent = c.name
        byId('footer-label').textContent = c.name
        features.innerHTML = c.points.map(p => '<div class="feature"><h3>' + p + '</h3><span class="dot"></span></div>').join('')
        host.querySelectorAll<HTMLElement>('[data-art]').forEach(el => el.classList.toggle('active', el.dataset.art === c.kind))
        byId('next-channel').textContent = s.channel < CHANNELS.length - 1 ? 'Weiter: ' + CHANNELS[s.channel + 1].name + ' ↘' : 'Zum nächsten Abschnitt ↓'
      }
      features.querySelectorAll<HTMLElement>('.feature').forEach((el, i) => {
        const checked = STEPS.findIndex(x => x.channel === s.channel && x.point === i) <= reached
        el.className = 'feature ' + (i === s.point ? 'active' : 'future') + (checked ? ' checked' : '')
        if (i === s.point) el.setAttribute('aria-current', 'step')
        else el.removeAttribute('aria-current')
      })
      host.querySelectorAll('.progress i').forEach((el, i) => el.classList.toggle('on', i <= index))
    }
    function setControls(visible: boolean) {
      if (visible === controlsShown) return
      controlsShown = visible
      host.classList.toggle('controls-visible', visible)
      controls.inert = !visible
      controls.setAttribute('aria-hidden', String(!visible))
    }
    function update() {
      frame = 0
      const r = story.getBoundingClientRect()
      if (isStatic()) { setControls(false); show(0); return }
      const travel = Math.max(1, story.offsetHeight - pin.offsetHeight)
      const top = parseFloat(getComputedStyle(pin).top) || 0
      setControls(r.top <= top + 1 && r.bottom > top + pin.offsetHeight + 1)
      const progress = Math.max(0, Math.min(1, (top - r.top) / travel))
      show(Math.min(STEPS.length - 1, Math.floor(progress * STEPS.length)))
    }
    const schedule = () => { frame ||= requestAnimationFrame(update) }
    const onResize = () => {
      // Mobile Browser ändern beim Scrollen die Höhe — nur echte Breitenänderungen zählen.
      if (innerWidth <= 760 && innerWidth === lastWidth) return
      lastWidth = innerWidth
      setViewport()
      schedule()
    }
    const next = () => {
      if (isStatic()) { byId('static-content').scrollIntoView({ behavior: 'smooth' }); return }
      const target = STEPS.findIndex(x => x.channel === channel + 1)
      if (target < 0) { document.getElementById('unternehmen')?.scrollIntoView({ behavior: 'smooth' }); return }
      const top = parseFloat(getComputedStyle(pin).top) || 0
      const travel = Math.max(1, story.offsetHeight - pin.offsetHeight)
      scrollTo({ top: story.getBoundingClientRect().top + scrollY - top + (travel * (target + 0.12)) / STEPS.length, behavior: 'smooth' })
    }
    const onReduced = () => { host.classList.toggle('reduced', reduced.matches); channel = -1; step = -1; update() }

    byId('progress').innerHTML = STEPS.map(() => '<i></i>').join('')
    byId('static-content').innerHTML = CHANNELS.slice(1)
      .map(c => '<article><h2>' + c.name + '</h2><ul>' + c.points.map(p => '<li>' + p + '</li>').join('') + '</ul></article>').join('')
    byId('next-channel').addEventListener('click', next)
    addEventListener('scroll', schedule, { passive: true })
    addEventListener('resize', onResize)
    reduced.addEventListener('change', onReduced)
    onReduced()
    return () => {
      cancelAnimationFrame(frame)
      removeEventListener('scroll', schedule)
      removeEventListener('resize', onResize)
      reduced.removeEventListener('change', onReduced)
      byId('next-channel').removeEventListener('click', next)
    }
  }, [])
  return <section ref={ref} className="rx-scroll-host" id="quellen" aria-labelledby="rx-channel-story-title" dangerouslySetInnerHTML={MARKUP} />
}

export default memo(ChannelStory)
