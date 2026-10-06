import { useRef, useState } from 'react'
import { DEMO, searchCompanies, type Suggestion } from './data'

// Suchfeld «Unternehmen in Google finden» — Startseite (BusinessCheck), Leistungsseiten und /check.
// Keine Vorschläge beim Tippen: erst «Finden» klicken → eine Google-Anfrage pro Suche.
// Startseite/Leistungsseiten (06.10.2026): Treffer erscheinen direkt unter dem Feld.
//   Treffer wählen → /check?place=<id> → sofort Schritt 2 (Kundenbereich).
//   «Mein Unternehmen ist nicht in der Liste» → /check?q=<text>&manual=1 → Formular ohne Google-Profil.

export function goToCheck(params: { place?: string; q?: string; manual?: boolean }) {
  const sp = new URLSearchParams()
  if (params.place) sp.set('place', params.place)
  if (params.q) sp.set('q', params.q)
  if (params.manual) sp.set('manual', '1')
  // Woher kam die Anfrage (Startseite oder eine Leistungsseite)? Wird im Check gespeichert.
  const from = window.location.pathname
  if (from !== '/check') sp.set('from', from)
  window.location.href = `/check?${sp.toString()}`
}

const PinIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
)

export default function CompanySearch({ variant = 'hero', initial = '', autoFocus = false, onSubmitQuery, buttonLabel = 'Mein Unternehmen finden', placeholder = 'Unternehmen in Google finden' }: {
  variant?: 'hero' | 'plain'
  /** Platzhalter im Eingabefeld */
  placeholder?: string
  /** Text des Buttons, z. B. je Leistungsseite anders */
  buttonLabel?: string
  initial?: string
  autoFocus?: boolean
  /** Ohne Angabe: Treffer als Liste unter dem Feld (Startseite, Leistungsseiten) */
  onSubmitQuery?: (q: string) => void
}) {
  const [query, setQuery] = useState(initial)
  const [results, setResults] = useState<Suggestion[] | null>(null)
  const [searched, setSearched] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const run = useRef(0)
  const hero = variant === 'hero'

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (q.length < 2) return
    if (onSubmitQuery) { onSubmitQuery(q); return }
    if (q === searched && results) return
    const id = ++run.current
    setBusy(true); setError(false)
    searchCompanies(q)
      .then(r => { if (id === run.current) { setResults(r); setSearched(q) } })
      .catch(err => { console.error('places-search', err); if (id === run.current) { setResults(null); setError(true) } })
      .finally(() => { if (id === run.current) setBusy(false) })
  }

  const notListed = () => goToCheck({ q: searched || query.trim(), manual: true })
  const linkBtn: React.CSSProperties = { background: 'none', border: 0, padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, color: 'var(--electric)', textAlign: 'left' }

  return (
    <div style={{ maxWidth: hero ? 580 : undefined }}>
      <form onSubmit={submit} className="bc-form" role="search"
        style={{ display: 'flex', gap: 8, backgroundColor: '#fff', borderRadius: 16, padding: 6, border: hero ? 'none' : '1px solid var(--border)', boxShadow: hero ? '0 12px 30px rgba(11,11,26,.18)' : 'var(--shadow-float)' }}>
        <label htmlFor={`cs-${variant}`} style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Unternehmen in Google finden</label>
        <input id={`cs-${variant}`} value={query} autoFocus={autoFocus} onChange={e => setQuery(e.target.value)}
          placeholder={placeholder} autoComplete="organization" enterKeyHint="search"
          aria-controls={onSubmitQuery ? undefined : `cs-${variant}-list`} aria-expanded={onSubmitQuery ? undefined : !!results}
          style={{ flex: 1, minWidth: 0, border: 0, outline: 'none', background: 'transparent', fontSize: 15, fontFamily: 'inherit', color: 'var(--ink)', padding: '0 18px' }} />
        <button type="submit" disabled={busy} className={`btn btn-md ${hero ? 'btn-ink' : 'btn-electric'}`} style={{ flexShrink: 0 }}>
          {busy ? 'Wir suchen…' : buttonLabel}
        </button>
      </form>

      {!onSubmitQuery && (error || results) && (
        <div id={`cs-${variant}-list`} role="region" aria-live="polite"
          style={{ marginTop: 8, backgroundColor: '#fff', color: 'var(--ink)', borderRadius: 16, border: hero ? 'none' : '1px solid var(--border)', boxShadow: '0 18px 40px rgba(11,11,26,.18)', overflow: 'hidden', textAlign: 'left' }}>
          {error && (
            <p role="alert" style={{ fontSize: 14, lineHeight: 1.6, margin: 0, padding: '14px 18px', color: '#B3261E' }}>Die Suche ist gerade nicht erreichbar. Bitte versuchen Sie es in einer Minute noch einmal.</p>
          )}
          {!error && results && results.length === 0 && (
            <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0, padding: '14px 18px 4px', color: 'var(--muted)' }}>Dazu haben wir bei Google nichts gefunden.</p>
          )}
          {!error && results && results.map((r, i) => (
            <button key={r.id} type="button" onClick={() => goToCheck({ place: r.id })} className="ck-result"
              style={{ display: 'flex', gap: 12, alignItems: 'center', width: '100%', padding: '12px 16px', border: 'none', borderTop: i ? '1px solid var(--line-soft)' : 'none', backgroundColor: '#fff', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', color: 'var(--ink)' }}>
              <span style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#EEEBFF', color: 'var(--electric)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><PinIcon /></span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 600, fontSize: 14.5, lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.main}</span>
                <span style={{ display: 'block', fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.45, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.secondary}</span>
              </span>
              <span className="ck-hide-sm" style={{ fontSize: 13, fontWeight: 600, color: 'var(--electric)', whiteSpace: 'nowrap' }}>Auswählen →</span>
            </button>
          ))}
          {!error && results && (
            <div style={{ padding: '12px 16px 14px', borderTop: results.length ? '1px solid var(--line-soft)' : 'none', backgroundColor: results.length ? '#FAFAFD' : '#fff' }}>
              <button type="button" onClick={notListed} className="ul" style={linkBtn}>Mein Unternehmen ist nicht in der Liste</button>
              {DEMO && <p style={{ fontSize: 12, color: 'var(--muted)', margin: '6px 0 0' }}>Demo: Die Google-Anbindung ist noch nicht aktiv, angezeigt werden Beispieldaten.</p>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
