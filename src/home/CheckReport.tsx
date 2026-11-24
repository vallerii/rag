import { useCallback, useEffect, useRef, useState } from 'react'
import CompanySearch from '../check/CompanySearch'
import { GoogleG } from './icons'

// «Wie hoch ist Ihr Sichtbarkeitsindex?» — links ein iPad mit drei fiktiven Beispielberichten
// (wechseln alle 4 s, Zahlen zählen weich hoch), rechts das Suchfeld → /check.

type Example = { name: string; category: string; rating: string; reviews: number; score: number; channels: number[]; avatar: string }
const EXAMPLES: Example[] = [
  { name: 'Max Fliesenleger', category: 'Fliesen & Badsanierung · Köln', rating: '4,8', reviews: 128, score: 62, channels: [72, 64, 44, 67], avatar: '/rx/report-278265038d.jpg' },
  { name: 'Elektro Gruppe West', category: 'Elektroinstallation · Düsseldorf', rating: '4,9', reviews: 86, score: 76, channels: [88, 75, 58, 83], avatar: '/rx/report-29129ffb9d.jpg' },
  { name: 'Studio Clara', category: 'Kosmetik & Hautpflege · Bonn', rating: '4,7', reviews: 214, score: 28, channels: [38, 24, 12, 38], avatar: '/rx/report-a649513b49.jpg' },
]
const CHANNEL_NAMES = ['Google Maps', 'Google Search', 'KI-Suche', 'Instagram']
const DURATION_MS = 1350
const AUTOPLAY_MS = 4000

/** Ampel: < 30 rot, ≥ 70 grün, dazwischen gelb. */
const metricColor = (v: number) => (v < 30 ? '#d93838' : v >= 70 ? '#26935b' : '#F2B800')

function ChannelLogo({ index }: { index: number }) {
  if (index === 0) return <img alt="" src="/rx/report-4a9012a68a.svg" />
  if (index === 1) return <GoogleG size={28} />
  if (index === 2) return <img alt="" src="/rx/report-b33929f1fc.svg" />
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <rect height="18" rx="5" width="18" x="3" y="3" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" fill="currentColor" r=".7" stroke="none" />
    </svg>
  )
}

function useAnimatedMetrics(target: Example) {
  const [shown, setShown] = useState({ values: target.channels, score: target.score })
  const current = useRef(shown)
  useEffect(() => {
    const from = current.current
    const to = { values: target.channels, score: target.score }
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      current.current = to
      setShown(to)
      return
    }
    // Startet bei den gerade angezeigten Werten — auch wenn mitten in der Animation geklickt wird.
    const begin = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - begin) / DURATION_MS))
      const e = 1 - Math.pow(1 - p, 3) // schnell, dann sichtbar langsamer
      const next = { values: from.values.map((v, i) => v + (to.values[i] - v) * e), score: from.score + (to.score - from.score) * e }
      current.current = next
      setShown(next)
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target])
  return shown
}

export default function CheckReport() {
  const [index, setIndex] = useState(0)
  const timer = useRef(0)
  const ex = EXAMPLES[index]
  const { values, score } = useAnimatedMetrics(ex)

  const restart = useCallback(() => {
    clearInterval(timer.current)
    timer.current = window.setInterval(() => {
      if (!document.hidden) setIndex(i => (i + 1) % EXAMPLES.length)
    }, AUTOPLAY_MS)
  }, [])
  useEffect(() => { restart(); return () => clearInterval(timer.current) }, [restart])

  return (
    <section className="rx-check-report-section rx-container" id="unternehmen" aria-labelledby="rx-search-title">
      <span className="rx-anchor-alias" id="audit-quiz" aria-hidden="true" />
      <div aria-label="Beispielberichte fiktiver Unternehmen" aria-roledescription="Karussell" className="rx-report-carousel" role="region">
        <div className="rx-report-tablet">
          <span aria-hidden="true" className="rx-report-camera" />
          <div aria-label={`${index + 1} von ${EXAMPLES.length}: ${ex.name}`} aria-live="off" aria-roledescription="Folie" className="rx-example-report" id="rx-report-example" role="group">
            <div className="rx-report-slide">
              <div className="rx-company-card">
                <header className="rx-report-company">
                  <span aria-hidden="true" className="rx-report-avatar"><img alt="" decoding="async" loading="eager" src={ex.avatar} /></span>
                  <div className="rx-report-company-details"><h3>{ex.name}</h3><p>{ex.category}</p></div>
                  <img alt="Google Maps" className="rx-report-maps-logo" src="/rx/report-4a9012a68a.svg" />
                </header>
                <div className="rx-report-rating">
                  <strong>{ex.rating}</strong>
                  <span aria-label={`${ex.rating} von 5 Sternen`} className="rx-report-stars">★★★★★</span>
                  <span>{ex.reviews} Bewertungen</span>
                </div>
              </div>
              <div className="rx-report-summary">
                <div aria-label={`Lokaler Sichtbarkeitsindex: ${ex.score} von 100`} className="rx-score-ring" role="img">
                  <svg aria-hidden="true" viewBox="0 0 120 120">
                    <circle className="rx-ring-track" cx="60" cy="60" r="51" />
                    <circle className="rx-ring-value" cx="60" cy="60" pathLength="100" r="51" style={{ strokeDasharray: `${score.toFixed(3)} 100`, stroke: metricColor(ex.score) }} />
                  </svg>
                  <strong>{Math.round(score)}</strong>
                </div>
                <div><h3>Lokaler<br />Sichtbarkeitsindex</h3><span>Google, KI &amp; Social Media</span></div>
              </div>
              <div className="rx-report-channels">
                <dl className="rx-report-scores">
                  {CHANNEL_NAMES.map((name, i) => {
                    const color = metricColor(ex.channels[i])
                    return (
                      <div key={name} className={ex.channels[i] < 30 ? 'needs-attention' : ''}>
                        <dt><span className="rx-score-logo"><ChannelLogo index={i} /></span>{name}</dt>
                        <dd style={{ color }}>{Math.round(values[i])}<span>/ 100</span></dd>
                        <span className="rx-score-track"><i style={{ width: `${Math.max(0, Math.min(100, values[i])).toFixed(3)}%`, backgroundColor: color }} /></span>
                      </div>
                    )
                  })}
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="rx-report-controls">
          <div aria-label="Unternehmensbeispiel wählen" className="rx-report-dots" role="group">
            {EXAMPLES.map((e, i) => (
              <button key={e.name} aria-controls="rx-report-example" aria-current={i === index ? 'true' : undefined} aria-label={`Beispiel ${i + 1}: ${e.name}`} type="button"
                onClick={() => { setIndex(i); restart() }}><span /></button>
            ))}
          </div>
        </div>
      </div>
      <div className="rx-check-report-copy">
        <h2 id="rx-search-title">Wie hoch ist Ihr<br /><em>Sichtbarkeitsindex?</em></h2>
        <div className="rx-check-report-form">
          <h3>Und wie sieht es bei Ihnen aus?</h3>
          <p>Finden Sie Ihr Unternehmen. Name oder Adresse genügt.</p>
          <CompanySearch variant="plain" buttonLabel="Mein Unternehmen prüfen" placeholder="Ihr Firmenname und Ort" inputLabel="Ihr Firmenname und Ort" />
          <small>Kostenlos &amp; unverbindlich</small>
        </div>
      </div>
    </section>
  )
}
