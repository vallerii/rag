import { useEffect, useRef } from 'react'
import LangSwitch from '../LangSwitch'
import { mountHeader } from './motion'

// Kopfzeile im Recto-Stil — auf der Startseite und allen öffentlichen Unterseiten.
// Verhalten (motion.ts → mountHeader): scrollt mit der Seite weg; beim Hochscrollen kommen
// die beiden Menü-Inseln (Glas) oben zurück. Die Wortmarke bleibt fix und wechselt je nach
// Hintergrund zwischen Schwarz und Weiß.
// [Text, Anker auf der Startseite, Leistungsseite für Unterseiten]
const NAV: [string, string, string][] = [
  ['KI-Suche', '#ki', '/services/ai-search-optimization'],
  ['Google Maps', '#maps', '/services/google-maps-business-profile'],
  ['Google Search', '#website', '/services/website-google-search'],
  ['Social Media', '#social', '/services/social-media'],
]

export default function SiteHeader({ home = false }: { home?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const page = ref.current?.closest<HTMLElement>('.rx')
    return page ? mountHeader(page) : undefined
  }, [])

  const header = (
    <div ref={ref} className="approved-block" data-approved-block="header">
      <header className="rx-header">
        <a className="rx-logo rx-wordmark" href={home ? '#sichtbarkeit' : '/'} aria-label="RAG Startseite">RAG<em>.</em></a>
        <nav className="rx-nav" aria-label="Hauptnavigation">
          {NAV.map(([label, anchor, page]) => <a key={label} href={home ? anchor : page}>{label}</a>)}
        </nav>
        <div className="rx-header-actions">
          <span className="rx-lang"><LangSwitch fg="var(--rx-ink)" border="transparent" /></span>
          <a className="rx-header-cta" href={home ? '#unternehmen' : '/#unternehmen'}>Sichtbarkeitsindex prüfen</a>
          <a className="rx-login" href="/login" aria-label="Anmelden" title="Anmelden">
            <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="3.4" /><path d="M4.75 21v-1.65a7.25 7.25 0 0 1 14.5 0V21" /></svg>
          </a>
        </div>
      </header>
    </div>
  )
  // Unterseiten: eigener .rx-Rahmen nur für die Kopfzeile (Tokens, Schrift), ohne die Seite selbst umzustylen.
  return home ? header : <div className="rx rx-chrome" data-theme="light">{header}</div>
}
