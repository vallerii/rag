import LangSwitch from '../LangSwitch'
import { useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import CompanySearch from './CompanySearch'
import {
  DEMO, SOURCE_LABELS, SOURCE_ORDER, createCheck, placeFromCode, discoverSources, findMyCheck, getCompany, loadMyChecks, manualPlace, newSessionToken, searchCompanies,
  type Contact, type Place, type Source, type SourceKey, type Suggestion,
} from './data'
import AccountStep from './AccountStep'

// /check — Onboarding nach der Unternehmenssuche. Drei Schritte:
// 1 Unternehmen suchen (Trefferliste) → 2 Gefundenes prüfen und direkt korrigieren («Vollständige Analyse erhalten»)
// → 3 Konto anlegen oder anmelden (E-Mail oder Google) → Kundenbereich, dort startet die Analyse.
// Treffer wählen führt direkt zu Schritt 2. ?place=<id> öffnet Schritt 2, ?place=<id>&step=3 öffnet Schritt 3
// (Rückkehr von Google). ?manual=1 öffnet Schritt 1 direkt mit dem Formular «nicht in der Liste».
// Seit 19.10.2026 gilt die Anmeldung als Bestätigung (sources_confirmed = true): die Analyse startet sofort.

type Step = 'find' | 'review' | 'account'

const DRAFT_KEY = 'rag-check-draft'
type ReturnDraft = { place: Place; sources: Source[] | null }

/** Rückkehr von Google (?step=3): Firma und Quellen aus Schritt 2 liegen noch im Browser. Wird erst beim Start der Suche verbraucht. */
function readReturnDraft(): ReturnDraft | null {
  try {
    if (new URLSearchParams(window.location.search).get('step') !== '3') return null
    const raw = sessionStorage.getItem(DRAFT_KEY)
    return raw ? (JSON.parse(raw) as ReturnDraft) : null
  } catch {
    return null
  }
}

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

function StepHead({ title, sub }: { n?: string; title: string; sub?: string }) {
  return (
    <>
      <h1 className="display" style={{ fontSize: 'clamp(24px, 2.6vw, 32px)', lineHeight: 1.08, margin: sub ? '0 0 10px' : '0 0 18px' }}>{title}</h1>
      {sub && <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--muted)', margin: '0 0 18px', maxWidth: 900 }}>{sub}</p>}
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

function StatusDot({ ok }: { ok: boolean | null }) {
  return (
    <span aria-hidden="true" style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800,
      backgroundColor: ok === null ? '#EFEEF8' : ok ? '#E3F4EA' : '#FFF1D6', color: ok === null ? 'var(--muted)' : ok ? '#17663A' : '#8A4B00' }}>{ok === null ? '…' : ok ? '✓' : '!'}</span>
  )
}

const fieldStyle: React.CSSProperties = { width: '100%', padding: '11px 14px', border: '1px solid rgba(7,7,12,0.14)', borderRadius: 12, fontSize: 14.5, fontFamily: 'inherit', outline: 'none', color: 'var(--ink)', backgroundColor: '#fff' }

/** Eine Zeile je Feld: Name, Eingabefeld, Status — alles in einer Reihe, damit die Liste kurz bleibt. Umbruch nur auf schmalen Bildschirmen. */
function FieldRow({ id, label, value, original, placeholder, type, inputMode, autoComplete, onChange }: {
  id: string; label: string; value: string; original?: string; placeholder: string; type?: string; inputMode?: 'tel' | 'url'; autoComplete?: string; onChange: (v: string) => void
}) {
  const filled = value.trim().length > 0
  const status = !filled ? 'Nicht gefunden' : value.trim() === (original ?? '').trim() ? 'Gefunden ✓' : 'Ergänzt'
  const chip = status === 'Gefunden ✓'
    ? { color: '#0F7A3E', bg: '#E6F6EC' }
    : status === 'Ergänzt' ? { color: 'var(--electric)', bg: '#EEEBFF' } : { color: 'var(--muted)', bg: 'var(--bone)' }
  return (
    <li style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <StatusDot ok={filled} />
      <label htmlFor={id} style={{ fontWeight: 600, fontSize: 14, width: 92, flexShrink: 0 }}>{label}</label>
      <input id={id} type={type ?? 'text'} inputMode={inputMode} autoComplete={autoComplete ?? 'off'} spellCheck={false} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ ...fieldStyle, width: 'auto', flex: '1 1 200px', minWidth: 0, padding: '7px 12px' }} />
      <span style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', padding: '3px 10px', borderRadius: 999, color: chip.color, backgroundColor: chip.bg }}>{status}</span>
    </li>
  )
}

/** Schritt 2: «Das haben wir schon gefunden» — Google-Profil nur zur Ansicht, Telefon, Website und Profile direkt editierbar. */
function Findings({ place, found, draft, onDraft }: { place: Place; found: Source[] | null; draft: Source[] | null; onDraft: (next: Source[]) => void }) {
  const row = (ok: boolean | null, text: React.ReactNode) => (
    <li style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13.5, lineHeight: 1.4 }}>
      <StatusDot ok={ok} /><span>{text}</span>
    </li>
  )
  const setValue = (key: SourceKey) => (value: string) => {
    if (draft) onDraft(draft.map(s => (s.key === key ? { ...s, value } : s)))
  }
  // Ausgangswert je Quelle: was wir gefunden haben (Website notfalls aus dem Google-Profil), zum Erkennen von «Ergänzt».
  const originalOf = (key: SourceKey): string | undefined => found?.find(s => s.key === key)?.value ?? (key === 'website' ? place.website ?? '' : undefined)
  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 18, padding: '14px 16px', backgroundColor: '#fff' }}>
      <p style={{ fontWeight: 700, fontSize: 15.5, margin: '0 0 2px' }}>Das haben wir schon gefunden</p>
      <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, margin: '0 0 12px' }}>Stimmt etwas nicht? Ändern oder ergänzen Sie es direkt hier.</p>
      <ul style={{ listStyle: 'none', margin: '0 0 10px', padding: 0, display: 'grid', gap: 4 }}>
        {place.manual
          ? row(false, 'Kein Google-Unternehmensprofil: bei Google Maps erscheinen Sie nicht.')
          : row(place.reviews >= 20 && (place.rating ?? 0) >= 4.2, <>Google-Profil: {place.rating !== null ? <>★ {place.rating.toLocaleString('de-DE', { minimumFractionDigits: 1 })} · </> : null}{place.reviews} Bewertungen</>)}
        {!place.manual && row(!!place.phone, place.phone ? 'Telefon im Google-Profil angegeben' : 'Kein Telefon im Google-Profil angegeben')}
      </ul>
      <ul style={{ listStyle: 'none', margin: 0, padding: '10px 0 0', borderTop: '1px solid var(--line-soft)', display: 'grid', gap: 6 }}>
        {draft === null ? (
          <li style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: 'var(--muted)' }}><span className="ck-spin" aria-hidden="true" />Wir suchen Ihre Website und Social-Media-Profile…</li>
        ) : draft.map(s => (
          <FieldRow key={s.key} id={`src-${s.key}`} label={SOURCE_LABELS[s.key]} value={s.value} original={originalOf(s.key)} placeholder="Nicht gefunden, hier eintragen" onChange={setValue(s.key)} />
        ))}
      </ul>
    </div>
  )
}

/** Gewählte Firma oben — kompakt, mit «Ändern». */
function SelectedCompany({ place, loading, onChange }: { place: Place | null; loading: boolean; onChange: () => void }) {
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'center', border: '1px solid var(--line)', borderRadius: 18, padding: '10px 14px', backgroundColor: '#FAFAFD', marginBottom: 14 }}>
      <span style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'var(--electric)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {loading || !place ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted)', fontSize: 14 }}><span className="ck-spin" aria-hidden="true" />Wir laden das Profil…</span>
        ) : (
          <>
            <span style={{ display: 'block', fontWeight: 700, fontSize: 15.5, lineHeight: 1.3 }}>{place.name}</span>
            <span style={{ display: 'block', fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
              {[place.category, place.address || place.city].filter(Boolean).join(' · ')}
              {place.rating !== null && !place.manual ? ` · ★ ${place.rating.toLocaleString('de-DE', { minimumFractionDigits: 1 })} (${place.reviews})` : ''}
            </span>
          </>
        )}
      </div>
      <button type="button" onClick={onChange} className="ul" style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, color: 'var(--electric)', flexShrink: 0 }}>Ändern</button>
    </div>
  )
}

/** «Mein Unternehmen ist nicht dabei»: genauer suchen oder ohne Google-Profil prüfen lassen. */
function NotListed({ query, nothingFound, startOpen = false, onManual }: { query: string; nothingFound: boolean; startOpen?: boolean; onManual: (p: Place) => void }) {
  const [open, setOpen] = useState(nothingFound || startOpen)
  const [f, setF] = useState({ name: query, category: '', city: '', website: '' })
  useEffect(() => { setOpen(nothingFound || startOpen); setF(x => ({ ...x, name: query })) }, [query, nothingFound, startOpen])
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF(x => ({ ...x, [k]: e.target.value }))
  const ok = f.name.trim().length > 1 && f.city.trim().length > 1
  if (!open) return (
    <button type="button" onClick={() => setOpen(true)} className="ul"
      style={{ marginTop: 14, background: 'none', border: 0, padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14.5, fontWeight: 600, color: 'var(--electric)' }}>
      Mein Unternehmen ist nicht in der Liste
    </button>
  )
  return (
    <div style={{ marginTop: 18, border: '1px solid var(--line)', borderRadius: 20, padding: 'clamp(18px, 2.4vw, 24px)', backgroundColor: '#fff' }}>
      <p style={{ fontWeight: 700, fontSize: 16, margin: '0 0 6px' }}>{nothingFound ? 'Dazu haben wir bei Google nichts gefunden.' : 'Nicht dabei?'}</p>
      <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--muted)', margin: '0 0 16px' }}>
        Suchen Sie genauer, mit Ort oder Straße im Suchfeld oben. Ist Ihr Unternehmen nicht bei Google eingetragen, prüfen wir Website und Social Media trotzdem und zeigen, was ein Google-Profil bringen würde.
      </p>
      <form onSubmit={e => { e.preventDefault(); if (ok) onManual(manualPlace(f)) }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
        <label style={{ fontSize: 13, fontWeight: 600 }}>Firmenname<input value={f.name} onChange={set('name')} required autoComplete="organization" style={{ ...fieldStyle, marginTop: 6 }} /></label>
        <label style={{ fontSize: 13, fontWeight: 600 }}>Branche<input value={f.category} onChange={set('category')} placeholder="z. B. Elektriker" style={{ ...fieldStyle, marginTop: 6 }} /></label>
        <label style={{ fontSize: 13, fontWeight: 600 }}>Ort<input value={f.city} onChange={set('city')} required placeholder="z. B. München" autoComplete="address-level2" style={{ ...fieldStyle, marginTop: 6 }} /></label>
        <label style={{ fontSize: 13, fontWeight: 600 }}>Website (falls vorhanden)<input value={f.website} onChange={set('website')} placeholder="beispiel.de" inputMode="url" style={{ ...fieldStyle, marginTop: 6 }} /></label>
        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }}>
          <button type="submit" className="btn btn-md btn-electric" disabled={!ok}>Ohne Google-Profil prüfen <span className="arw">→</span></button>
          <a href="/start?from=check" className="ul" style={{ fontSize: 14, color: 'var(--electric)', fontWeight: 600 }}>Oder: 4 kurze Fragen statt Check →</a>
        </div>
      </form>
    </div>
  )
}

export default function CheckPage() {
  useNoindex('Kostenloser Sichtbarkeits-Check | RAG')
  const params = new URLSearchParams(window.location.search)
  const initialPlace = params.get('place')
  // Code aus dem Brief (QR-Code / Link): /check?c=ABC123 → Unternehmen ist schon ausgewählt.
  const briefCode = (params.get('c') ?? '').trim().toUpperCase()
  const initialQ = params.get('q') ?? ''
  const returning = params.get('step') === '3'
  // Von der Startseite über «Mein Unternehmen ist nicht in der Liste»: Formular sofort offen, keine neue Google-Suche.
  const [manualMode, setManualMode] = useState(params.get('manual') === '1')

  const [step, setStep] = useState<Step>(initialPlace || briefCode ? (returning ? 'account' : 'review') : 'find')
  const [place, setPlace] = useState<Place | null>(null)
  const [loadingPlace, setLoadingPlace] = useState(!!initialPlace || !!briefCode)
  const [notFound, setNotFound] = useState(false)
  // Website + Social-Profile werden im Hintergrund gesucht. Bestätigt werden sie in Schritt 2.
  const discovery = useRef<Promise<Source[]> | null>(null)
  const [found, setFound] = useState<Source[] | null>(null)
  // Vom Kunden korrigierte Quellen (Schritt 2). touched = Kunde hat etwas geändert → genau so übernehmen.
  const [srcDraft, setSrcDraft] = useState<Source[] | null>(null)
  const touched = useRef(false)
  const restoreRef = useRef<ReturnDraft | null>(readReturnDraft())

  const startDiscovery = (p: Place) => {
    // Rückkehr von Google: die Korrekturen aus Schritt 2 bleiben erhalten.
    const keep = restoreRef.current?.sources ?? null
    if (restoreRef.current) { restoreRef.current = null; try { sessionStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ } }
    setFound(null); setSrcDraft(keep); touched.current = !!keep
    const job = discoverSources(p).catch(() => [] as Source[])
    discovery.current = job
    job.then(r => {
      if (discovery.current !== job) return
      setFound(r)
      if (!touched.current) setSrcDraft(SOURCE_ORDER.map(key => r.find(s => s.key === key) ?? { key, value: key === 'website' ? p.website ?? '' : '', found: false }))
    })
  }
  const editSources = (next: Source[]) => { touched.current = true; setSrcDraft(next) }
  const [query, setQuery] = useState(initialQ)
  const [results, setResults] = useState<Suggestion[] | null>(null)
  const [searching, setSearching] = useState(false)
  // Suche technisch fehlgeschlagen (z. B. Edge Function nicht deployt) — nicht als «nichts gefunden» anzeigen.
  const [searchError, setSearchError] = useState(false)
  const token = useRef(newSessionToken())
  const topRef = useRef<HTMLDivElement>(null)

  // Suche erst nach Klick auf «Finden» (keine Vorschläge beim Tippen): eine Anfrage pro Suche.
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2 || manualMode) { setResults(null); return }
    let alive = true
    setSearching(true); setSearchError(false)
    searchCompanies(q, token.current)
      .then(r => { if (alive) setResults(r) })
      .catch(e => { console.error('places-search', e); if (alive) { setResults(null); setSearchError(true) } })
      .finally(() => { if (alive) setSearching(false) })
    return () => { alive = false }
  }, [query, manualMode]) // eslint-disable-line react-hooks/exhaustive-deps

  const newSearch = (q: string) => {
    const sp = new URLSearchParams(window.location.search)
    sp.set('q', q); sp.delete('place'); sp.delete('manual')
    history.replaceState(null, '', `/check?${sp.toString()}`)
    setManualMode(false); setStep('find'); setQuery(q)
  }

  // Treffer gewählt → sofort Schritt 2; das Profil lädt dort oben, die Quellensuche startet, sobald es da ist.
  const loadPlace = (id: string, next: Step = 'review') => {
    setPlace(null); setStep(next); setLoadingPlace(true); setNotFound(false)
    // Telefon der vorherigen Firma nicht übernehmen; bei der Rückkehr von Google bleibt es erhalten.
    discovery.current = null; setFound(null)
    getCompany(id, token.current)
      .then(p => {
        setPlace(p); setNotFound(!p)
        if (p) {
          // Telefon aus dem Profil vorbelegen; bei der Rückkehr von Google gilt die Eingabe von vorher.
          startDiscovery(p)
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoadingPlace(false))
  }

  // Zurück zur Suche (z. B. «Ändern» oder «Zurück» in Schritt 2).
  const backToFind = () => {
    const sp = new URLSearchParams(window.location.search)
    sp.delete('place'); sp.delete('step')
    if (query) sp.set('q', query)
    history.replaceState(null, '', `/check?${sp.toString()}`)
    setStep('find')
  }

  useEffect(() => {
    if (initialPlace) {
      // Manuell eingetragene Firma (ohne Google-Profil) lässt sich nicht von Google neu laden → aus dem Browser übernehmen.
      const kept = restoreRef.current?.place
      if (returning && kept?.manual && kept.id === initialPlace) {
        setPlace(kept); setLoadingPlace(false); startDiscovery(kept); setStep('account')
      } else {
        loadPlace(initialPlace, returning ? 'account' : 'review')
      }
    } else if (briefCode) {
      placeFromCode(briefCode).then(id => { if (id) loadPlace(id); else { setLoadingPlace(false); setStep('find') } })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { topRef.current?.scrollIntoView({ block: 'start' }) }, [step])

  // Ohne Google-Profil: Angaben des Kunden übernehmen und direkt zu Schritt 2.
  const goManual = (p: Place) => {
    setPlace(p); setStep('review'); setLoadingPlace(false); setNotFound(false)
    startDiscovery(p)
  }

  // Ergänztes Telefon ins Firmenprofil übernehmen (landet mit dem Check in der Datenbank).
  const withPhone = (p: Place): Place => p

  // Nach Registrierung/Anmeldung: Check anlegen und in den Kundenbereich weiter.
  const createAndGo = async (user: User, contact: Contact): Promise<string | null> => {
    if (!place) return loadingPlace ? 'Das Profil lädt noch, bitte einen Moment.' : 'Bitte wählen Sie zuerst Ihr Unternehmen.'
    // Diese Firma ist im Konto schon geprüft → keinen zweiten Check anlegen, den vorhandenen öffnen.
    const existing = await findMyCheck(place).catch(() => null)
    if (existing) { window.location.href = `/kabinett?firma=${existing}&bereits=1`; return null }
    const hadChecks = (await loadMyChecks().catch(() => [])).length > 0
    // Nicht länger als 4 s auf die Quellen warten — sonst leer anlegen und im Kundenbereich ergänzen.
    const empty: Source[] = SOURCE_ORDER.map(key => ({ key, value: '', found: false }))
    const found = touched.current && srcDraft ? srcDraft
      : await Promise.race([discovery.current ?? Promise.resolve(empty), new Promise<Source[]>(r => setTimeout(() => r(empty), 4000))])
    // Anmeldung = Bestätigung der Quellen: die Analyse startet sofort (Kundenbereich ruft audit-collect auf).
    const id = await createCheck({
      place: withPhone(place), region: `${place.city} + 30 km`, sources: found.length ? found : empty, contact, confirmed: true,
      sourcePage: params.get('from') ?? (briefCode ? `brief-${briefCode}` : null),
    })
    if (!id) return 'Das Speichern hat nicht geklappt. Bitte versuchen Sie es noch einmal.'
    // Neues Konto (gerade angelegt) → Begrüßung; bestehendes Konto → Hinweis «weitere Firma hinzugefügt».
    const fresh = Date.now() - new Date(user.created_at).getTime() < 15 * 60 * 1000 && !hadChecks
    window.location.href = `/kabinett?firma=${id}&${fresh ? 'welcome=1' : 'neu=1'}`
    return null
  }

  // Adresse, zu der Google nach der Anmeldung zurückleitet: dieselbe Firma, Schritt 3.
  const googleNext = place ? (() => {
    const sp = new URLSearchParams(window.location.search)
    sp.set('place', place.id); sp.set('step', '3'); sp.delete('c'); sp.delete('manual'); sp.delete('q')
    return `/check?${sp.toString()}`
  })() : undefined
  const keepDraftForGoogle = () => {
    if (!place) return
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ place, sources: srcDraft } satisfies ReturnDraft)) } catch { /* Speicher gesperrt: Korrekturen gehen verloren, Analyse läuft trotzdem */ }
  }

  const stepIdx = step === 'find' ? 0 : step === 'review' ? 1 : 2

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bone)' }}>
      <header style={{ borderBottom: '1px solid var(--line)', backgroundColor: 'rgba(241,240,235,0.9)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 clamp(20px, 4vw, 48px)', height: 66, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <Logo />
          <p className="eyebrow ck-hide-sm" style={{ color: 'var(--muted)' }}>Kostenloser Sichtbarkeits-Check</p>
          <span style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <LangSwitch />
            <a href="/" className="ul" style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>Abbrechen</a>
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 4, height: 4 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ backgroundColor: i <= stepIdx ? 'var(--electric)' : 'var(--line-soft)', transition: 'background-color 0.4s var(--ease)' }} />
          ))}
        </div>
      </header>

      <div ref={topRef} style={{ scrollMarginTop: 80 }} />
      <main id="inhalt" style={{ maxWidth: 1240, margin: '0 auto', padding: '20px clamp(20px, 4vw, 48px) 40px' }}>
        <section className="ck-card" style={{ backgroundColor: '#fff', borderRadius: 26, padding: 'clamp(20px, 2.6vw, 30px)', boxShadow: '0 30px 70px rgba(7,7,12,0.06)', minWidth: 0 }}>

          {step === 'find' && (
            <>
              <StepHead n="Schritt 1 von 3" title="Welches Unternehmen sollen wir prüfen?" sub="Geben Sie den Namen oder die Adresse ein und klicken Sie auf «Mein Unternehmen finden». Danach wählen Sie Ihr Unternehmen aus der Liste." />
              <CompanySearch variant="plain" initial={initialQ} autoFocus={!initialQ} onSubmitQuery={newSearch} />
              <div style={{ marginTop: 22 }}>
                {manualMode && <NotListed query={query} nothingFound={false} startOpen onManual={goManual} />}
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
                    <NotListed query={query} nothingFound={false} onManual={goManual} />
                  </>
                )}
                {!searching && searchError && (
                  <p role="alert" style={{ fontSize: 15, lineHeight: 1.7, margin: 0, color: '#B3261E' }}>Die Suche ist gerade nicht erreichbar. Bitte versuchen Sie es in einer Minute noch einmal.</p>
                )}
                {!searching && results && results.length === 0 && (
                  <NotListed query={query} nothingFound onManual={goManual} />
                )}
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--muted)', margin: '26px 0 0' }}>
                Ihr Unternehmen ist noch nicht bei Google?{' '}
                <a href="/start?from=check" className="ul" style={{ color: 'var(--electric)', fontWeight: 600 }}>Beantworten Sie 4 kurze Fragen →</a>
              </p>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--muted)', margin: '18px 0 0' }}>Kostenlos und unverbindlich. Den Bericht prüft ein Mensch aus unserem Team, nicht nur ein Tool.</p>
            </>
          )}

          {step !== 'find' && !loadingPlace && notFound ? (
            <>
              <p style={{ fontSize: 15, lineHeight: 1.7, margin: '0 0 18px' }}>Dieses Profil konnten wir nicht laden. Bitte suchen Sie noch einmal.</p>
              <button type="button" className="btn btn-md btn-ink" onClick={backToFind}>Neu suchen</button>
            </>
          ) : step === 'review' ? (
            <>
              <StepHead n="Schritt 2 von 3" title="Prüfen Sie, was wir gefunden haben" />
              <SelectedCompany place={place} loading={loadingPlace} onChange={backToFind} />
              {DEMO && !place?.manual && <div style={{ margin: '-10px 0 20px' }}><DemoNote>Die Google-Anbindung ist noch nicht aktiv. Angezeigt werden Beispieldaten.</DemoNote></div>}
              {place && !loadingPlace && <Findings place={place} found={found} draft={srcDraft} onDraft={editSources} />}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
                <button type="button" className="btn btn-lg btn-electric" disabled={!place || loadingPlace} onClick={() => setStep('account')}
                  style={{ opacity: place && !loadingPlace ? 1 : 0.45, cursor: place && !loadingPlace ? 'pointer' : 'default' }}>
                  Vollständige Analyse erhalten <span className="arw">→</span>
                </button>
                <button type="button" className="btn btn-lg btn-outline-light" onClick={backToFind}>Zurück</button>
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.55, margin: '12px 0 0' }}>Die vollständige Prüfung zeigt: Ihren Platz bei Google Maps im Vergleich zu Wettbewerbern, ob ChatGPT, Perplexity und Gemini Sie empfehlen, die Technik und Smartphone-Geschwindigkeit Ihrer Website sowie Ihre Bewertungen und Einträge in wichtigen Verzeichnissen.</p>
            </>
          ) : step === 'account' ? (
            <>
              <StepHead n="Schritt 3 von 3" title="Ihr Kundenbereich" sub="In Ihrem Kundenbereich sehen Sie den Stand der Analyse und Ihren Bericht: wo Sie bei Google Maps stehen, wie Sie im Vergleich zu Wettbewerbern dastehen und was Sie an Ihrer Website verbessern können. Der Bericht ist in der Regel innerhalb von 1 Werktag fertig." />
              <AccountStep submitLabel="Analyse starten" loggedInLabel="Analyse starten" onAuthed={createAndGo} onBack={() => setStep('review')}
                googleNext={googleNext} onBeforeGoogle={keepDraftForGoogle} />
            </>
          ) : null}
        </section>
      </main>
    </div>
  )
}
