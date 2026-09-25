import { useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import CompanySearch from './CompanySearch'
import {
  DEMO, SOURCE_ORDER, createCheck, discoverSources, getCompany, newSessionToken, searchCompanies,
  type Contact, type Place, type Source, type Suggestion,
} from './data'
import AccountStep from './AccountStep'

// /check — Onboarding nach der Unternehmenssuche (Prototyp «rag_client_cabinet_v1», 25.09.2026).
// Reihenfolge: 1 Unternehmen suchen (Trefferliste) und bestätigen → 2 Konto anlegen oder anmelden
// → Kundenbereich. Website und Social-Profile bestätigt der Kunde dort.

type Step = 'find' | 'confirm' | 'contact'

export function useNoindex(title: string) {
  useEffect(() => {
    document.title = title
    let robots = document.head.querySelector('meta[name="robots"]') as HTMLMetaElement | null
    if (!robots) { robots = document.createElement('meta'); robots.name = 'robots'; document.head.appendChild(robots) }
    robots.content = 'noindex'
  }, [title])
}

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <a href="/" style={{ fontWeight: 800, fontSize: 21, color: dark ? '#fff' : 'var(--ink)', letterSpacing: '-0.05em', textDecoration: 'none' }}>
      RAG<span style={{ color: 'var(--electric)' }}>.</span>
    </a>
  )
}

export function StarsRow({ rating }: { rating: number }) {
  return (
    <span aria-hidden="true" style={{ display: 'inline-flex', gap: 2, color: '#F5B400', fontSize: 15, letterSpacing: 1 }}>
      {[1, 2, 3, 4, 5].map(i => <span key={i} style={{ opacity: rating >= i - 0.25 ? 1 : 0.25 }}>★</span>)}
    </span>
  )
}

export function DemoNote({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 12.5, lineHeight: 1.55, color: '#5B4A00', backgroundColor: '#FFF6D6', border: '1px solid #F2E2A6', borderRadius: 12, padding: '9px 12px' }}>
      <strong style={{ flexShrink: 0 }}>Demo</strong><span>{children}</span>
    </div>
  )
}



function StepHead({ n, title, sub }: { n: string; title: string; sub: string }) {
  return (
    <>
      <p className="eyebrow" style={{ color: 'var(--electric)', marginBottom: 12 }}>{n}</p>
      <h1 className="display" style={{ fontSize: 'clamp(26px, 3vw, 36px)', lineHeight: 1.08, margin: '0 0 12px' }}>{title}</h1>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--muted)', margin: '0 0 26px', maxWidth: 520 }}>{sub}</p>
    </>
  )
}

function Spinner({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '26px 0', color: 'var(--muted)', fontSize: 14.5 }}>
      <span className="ck-spin" aria-hidden="true" />{label}
    </div>
  )
}

function CompanyCard({ place }: { place: Place }) {
  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 20, padding: 'clamp(18px, 2.4vw, 24px)', display: 'flex', gap: 18, alignItems: 'flex-start', backgroundColor: '#fff' }}>
      <span style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: 'var(--electric)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p className="display" style={{ fontSize: 21, lineHeight: 1.2, margin: '2px 0 6px', letterSpacing: '-0.025em' }}>{place.name}</p>
        <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 4px', lineHeight: 1.55 }}>{place.address}</p>
        <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0, lineHeight: 1.55 }}>{place.category}{place.website ? ` · ${place.website}` : ''}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line-soft)', flexWrap: 'wrap' }}>
          {place.rating !== null ? (
            <>
              <StarsRow rating={place.rating} />
              <strong style={{ fontSize: 14 }}>{place.rating.toLocaleString('de-DE', { minimumFractionDigits: 1 })}</strong>
              <span style={{ fontSize: 14, color: 'var(--muted)' }}>· {place.reviews} Bewertungen</span>
            </>
          ) : <span style={{ fontSize: 14, color: 'var(--muted)' }}>Noch keine Bewertungen gefunden</span>}
        </div>
      </div>
    </div>
  )
}

export default function CheckPage() {
  useNoindex('Kostenloser Sichtbarkeits-Check | RAG')
  const params = new URLSearchParams(window.location.search)
  const initialPlace = params.get('place')
  const initialQ = params.get('q') ?? ''

  const [step, setStep] = useState<Step>(initialPlace ? 'confirm' : 'find')
  const [place, setPlace] = useState<Place | null>(null)
  const [loadingPlace, setLoadingPlace] = useState(!!initialPlace)
  const [notFound, setNotFound] = useState(false)
  // Website + Social-Profile werden im Hintergrund gesucht, während das Konto angelegt wird.
  // Bestätigt werden sie danach im Kundenbereich.
  const discovery = useRef<Promise<Source[]> | null>(null)
  const [query, setQuery] = useState(initialQ)
  const [results, setResults] = useState<Suggestion[] | null>(null)
  const [searching, setSearching] = useState(false)
  const token = useRef(newSessionToken())
  const topRef = useRef<HTMLDivElement>(null)

  // Suche erst nach Klick auf «Finden» (keine Vorschläge beim Tippen): eine Anfrage pro Suche.
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) { setResults(null); return }
    let alive = true
    setSearching(true)
    searchCompanies(q, token.current)
      .then(r => { if (alive) setResults(r) })
      .catch(() => { if (alive) setResults([]) })
      .finally(() => { if (alive) setSearching(false) })
    return () => { alive = false }
  }, [query]) // eslint-disable-line react-hooks/exhaustive-deps

  const newSearch = (q: string) => {
    const sp = new URLSearchParams(window.location.search)
    sp.set('q', q); sp.delete('place')
    history.replaceState(null, '', `/check?${sp.toString()}`)
    setStep('find'); setQuery(q)
  }

  const loadPlace = (id: string) => {
    setStep('confirm'); setLoadingPlace(true); setNotFound(false)
    getCompany(id, token.current)
      .then(p => { setPlace(p); setNotFound(!p) })
      .catch(() => setNotFound(true))
      .finally(() => setLoadingPlace(false))
  }

  useEffect(() => { if (initialPlace) loadPlace(initialPlace) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { topRef.current?.scrollIntoView({ block: 'start' }) }, [step])

  const goContact = () => {
    if (!place) return
    discovery.current = discoverSources(place).catch(() => [])
    setStep('contact')
  }

  // Nach Registrierung/Anmeldung: Check anlegen und in den Kundenbereich.
  const createAndGo = async (_user: User, contact: Contact): Promise<string | null> => {
    if (!place) return 'Bitte wählen Sie zuerst Ihr Unternehmen.'
    // Nicht länger als 4 s auf die Quellen warten — sonst leer anlegen und im Kundenbereich ergänzen.
    const empty: Source[] = SOURCE_ORDER.map(key => ({ key, value: '', found: false }))
    const found = await Promise.race([discovery.current ?? Promise.resolve(empty), new Promise<Source[]>(r => setTimeout(() => r(empty), 4000))])
    const id = await createCheck({
      place, region: `${place.city} + 30 km`, sources: found.length ? found : empty, contact,
      sourcePage: params.get('from'),
    })
    if (!id) return 'Das Speichern hat nicht geklappt. Bitte versuchen Sie es noch einmal.'
    window.location.href = '/kabinett?welcome=1'
    return null
  }

  const stepIdx = step === 'find' || step === 'confirm' ? 0 : 1
  const STEPS = [['Unternehmen', 'Profil bei Google finden und bestätigen'], ['Kundenbereich', 'Konto anlegen — danach Website und Profile bestätigen']]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bone)' }}>
      <header style={{ borderBottom: '1px solid var(--line)', backgroundColor: 'rgba(241,240,235,0.9)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 clamp(20px, 4vw, 48px)', height: 66, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <Logo />
          <p className="eyebrow ck-hide-sm" style={{ color: 'var(--muted)' }}>Kostenloser Sichtbarkeits-Check</p>
          <a href="/" className="ul" style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>Abbrechen</a>
        </div>
        {(
          <div style={{ height: 3, backgroundColor: 'var(--line-soft)' }}>
            <div style={{ height: '100%', width: `${((stepIdx + 1) / 2) * 100}%`, backgroundColor: 'var(--electric)', transition: 'width 0.6s var(--ease)' }} />
          </div>
        )}
      </header>

      <div ref={topRef} style={{ scrollMarginTop: 80 }} />
      <main id="inhalt" className="ck-grid" style={{ maxWidth: 1240, margin: '0 auto', padding: 'clamp(28px, 5vw, 64px) clamp(20px, 4vw, 48px) 96px' }}>
        <aside className="ck-aside" style={{ backgroundColor: 'var(--ink)', color: '#fff', borderRadius: 26, padding: 'clamp(24px, 3vw, 34px)', position: 'sticky', top: 96, alignSelf: 'start', overflow: 'hidden' }}>
          <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.6, pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <p className="eyebrow" style={{ color: 'var(--electric-2)', marginBottom: 14 }}>Sichtbarkeits-Check</p>
            <p className="display" style={{ fontSize: 26, lineHeight: 1.12, margin: '0 0 26px' }}>So sehen Google und KI<br /><span className="serif italic-serif">Ihr Unternehmen.</span></p>
            <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {STEPS.map(([t, s], i) => {
                const state = i < stepIdx ? 'done' : i === stepIdx ? 'now' : 'next'
                return (
                  <li key={t} style={{ display: 'flex', gap: 14, padding: '14px 0', borderTop: '1px solid var(--line-dark)', opacity: state === 'next' ? 0.45 : 1 }}>
                    <span style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, backgroundColor: state === 'next' ? 'transparent' : 'var(--electric)', border: state === 'next' ? '1px solid var(--line-dark)' : 'none' }}>
                      {state === 'done' ? '✓' : `0${i + 1}`}
                    </span>
                    <span>
                      <span style={{ display: 'block', fontWeight: 600, fontSize: 15 }}>{t}</span>
                      <span style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{s}</span>
                    </span>
                  </li>
                )
              })}
            </ol>
            <p style={{ fontSize: 12.5, lineHeight: 1.6, color: 'rgba(255,255,255,0.55)', margin: '18px 0 0' }}>Kostenlos und unverbindlich. Den Bericht prüft ein Mensch aus unserem Team, nicht nur ein Tool.</p>
          </div>
        </aside>

        <section style={{ backgroundColor: '#fff', borderRadius: 26, padding: 'clamp(24px, 4vw, 48px)', boxShadow: '0 30px 70px rgba(7,7,12,0.06)', minWidth: 0 }}>

          {step === 'find' && (
            <>
              <StepHead n="Schritt 1 von 2" title="Welches Unternehmen sollen wir prüfen?" sub="Geben Sie den Namen oder die Adresse ein und klicken Sie auf «Mein Unternehmen finden». Danach wählen Sie Ihr Unternehmen aus der Liste." />
              <CompanySearch variant="plain" initial={initialQ} autoFocus={!initialQ} onSubmitQuery={newSearch} />
              <div style={{ marginTop: 22 }}>
                {searching && <Spinner label="Wir suchen bei Google…" />}
                {!searching && results && results.length > 0 && (
                  <>
                    <p style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 10px' }}>Treffer</p>
                    <div style={{ border: '1px solid var(--line)', borderRadius: 20, overflow: 'hidden' }}>
                      {results.map((r, i) => (
                        <button key={r.id} type="button" onClick={() => loadPlace(r.id)} className="ck-result"
                          style={{ display: 'flex', gap: 14, alignItems: 'center', width: '100%', padding: '15px 18px', border: 'none', borderTop: i ? '1px solid var(--line-soft)' : 'none', backgroundColor: '#fff', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', color: 'var(--ink)' }}>
                          <span style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#EEEBFF', color: 'var(--electric)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
                          </span>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ display: 'block', fontWeight: 600, fontSize: 15, lineHeight: 1.35 }}>{r.main}</span>
                            <span style={{ display: 'block', fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{r.secondary}</span>
                          </span>
                          <span className="ck-hide-sm" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--electric)', whiteSpace: 'nowrap' }}>Auswählen →</span>
                        </button>
                      ))}
                    </div>
                    {DEMO && <div style={{ marginTop: 12 }}><DemoNote>Die Google-Anbindung ist noch nicht aktiv. Angezeigt werden Beispieldaten.</DemoNote></div>}
                  </>
                )}
                {!searching && results && results.length === 0 && (
                  <p style={{ fontSize: 15, lineHeight: 1.7, margin: 0 }}>Dazu haben wir nichts gefunden. Versuchen Sie es mit dem Namen und dem Ort, z. B. «Elektro Becker Siegen».</p>
                )}
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--muted)', margin: '26px 0 0' }}>
                Ihr Unternehmen ist noch nicht bei Google?{' '}
                <a href="/#maps" className="ul" style={{ color: 'var(--electric)', fontWeight: 600 }}>Wir erstellen Ihr Google-Profil →</a>
              </p>
            </>
          )}

          {step === 'confirm' && (
            <>
              <StepHead n="Schritt 1 von 2" title="Ist das Ihr Unternehmen?" sub="Bitte prüfen Sie, ob wir das richtige Profil gefunden haben. Diese Daten sind die Grundlage für Ihren Bericht." />
              {loadingPlace && <Spinner label="Wir laden das Profil…" />}
              {!loadingPlace && notFound && (
                <>
                  <p style={{ fontSize: 15, lineHeight: 1.7, margin: '0 0 18px' }}>Dieses Profil konnten wir nicht laden. Bitte suchen Sie noch einmal.</p>
                  <button type="button" className="btn btn-md btn-ink" onClick={() => setStep('find')}>Neu suchen</button>
                </>
              )}
              {!loadingPlace && place && (
                <>
                  <CompanyCard place={place} />
                  {DEMO && <div style={{ marginTop: 14 }}><DemoNote>Die Google-Anbindung ist noch nicht aktiv. Angezeigt werden Beispieldaten.</DemoNote></div>}
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 26 }}>
                    <button type="button" className="btn btn-lg btn-electric" onClick={goContact}>Ja, das ist mein Unternehmen <span className="arw">→</span></button>
                    <button type="button" className="btn btn-lg btn-outline-light" onClick={() => setStep('find')}>Anderes Unternehmen</button>
                  </div>
                </>
              )}
            </>
          )}

          {step === 'contact' && (
            <>
              <StepHead n="Schritt 2 von 2" title="Ihr Kundenbereich" sub="Legen Sie ein Konto an oder melden Sie sich an. Währenddessen suchen wir Website und Social-Media-Profile — im Kundenbereich bestätigen Sie sie und sehen später den Bericht." />
              <AccountStep submitLabel="Weiter zum Kundenbereich" onAuthed={createAndGo} onBack={() => setStep('confirm')} />
            </>
          )}
        </section>
      </main>
    </div>
  )
}
