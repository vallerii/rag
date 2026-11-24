import { useState } from 'react'
import { GoogleG } from './icons'

// Erster Bildschirm: Fächer aus fünf Porträts (Klick oder ←/→ wählt), Headline, zwei Buttons.
const PORTRAITS = [
  { role: 'Handwerk', photo: 'handwerk', alt: 'Handwerkerteam vor dem Haus', rating: '4,9' },
  { role: 'Zahnarzt', photo: 'dentist', alt: 'Zahnarzt in seiner Praxis', rating: '4,9' },
  { role: 'Sanierung', photo: 'sanierung', alt: 'Sanierungsteam in einem Bad', rating: '5,0' },
  { role: 'Kosmetikstudio', photo: 'kosmetik', alt: 'Inhaberin eines Kosmetikstudios', rating: '4,8' },
  { role: 'Beratung', photo: 'beratung', alt: 'Beraterin im Büro', rating: '4,9' },
]

export default function Hero() {
  const [active, setActive] = useState(2)
  const n = PORTRAITS.length
  const select = (i: number) => setActive((i + n) % n)
  return (
    <section className="rx-hero" id="sichtbarkeit" aria-labelledby="rx-title">
      <div className="rx-fan" aria-label="Beispiele lokaler Unternehmen">
        <div className="rx-halo" aria-hidden="true" />
        <p className="rx-fan-badge"><span />Für die Menschen hinter dem Betrieb.</p>
        {PORTRAITS.map((p, i) => {
          const offset = ((i - active + n + 2) % n) - 2
          return (
            <button key={p.role} type="button" className={`rx-portrait${offset === 0 ? ' is-active' : ''}`}
              style={{ '--offset': offset, '--distance': Math.abs(offset), zIndex: 5 - Math.abs(offset) } as React.CSSProperties}
              aria-label={`${p.role} auswählen`} aria-pressed={offset === 0}
              onClick={() => select(i)}
              onKeyDown={e => {
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                  e.preventDefault()
                  select(active + (e.key === 'ArrowRight' ? 1 : -1))
                }
              }}>
              <img src={`/rag-photos/${p.photo}.webp`} alt={p.alt} width={800} height={800} fetchPriority={i === 2 ? 'high' : 'auto'} />
              <span className="rx-portrait-caption">
                <strong>{p.role}</strong>
                <span><GoogleG /><b>{p.rating}</b><span className="rx-stars">★★★★★</span></span>
              </span>
            </button>
          )
        })}
      </div>
      <h1 id="rx-title">Werden Sie zur <em>ersten Wahl</em><br />in Ihrer Region.</h1>
      <p className="rx-hero-copy">Sie machen gute Arbeit. Wir sorgen dafür, dass man Sie findet.<br className="rx-desktop-break" /> Bei Google, auf Maps und in den Antworten der KI.</p>
      <div className="rx-actions">
        <a className="rx-button rx-primary" href="#unternehmen">Sichtbarkeitsindex prüfen</a>
        <a className="rx-button rx-secondary" href="/preise">Google-Profil ab 149 €</a>
      </div>
    </section>
  )
}
