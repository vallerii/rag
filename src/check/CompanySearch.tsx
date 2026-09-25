import { useState } from 'react'

// Suchfeld «Unternehmen in Google finden» — Startseite (BusinessCheck), Leistungsseiten und /check.
// Keine Vorschläge beim Tippen: erst «Finden» klicken → /check?q=<text> mit Trefferliste.
// So entsteht genau eine Google-Anfrage pro Suche.

export function goToCheck(params: { place?: string; q?: string }) {
  const sp = new URLSearchParams()
  if (params.place) sp.set('place', params.place)
  if (params.q) sp.set('q', params.q)
  // Woher kam die Anfrage (Startseite oder eine Leistungsseite)? Wird im Check gespeichert.
  const from = window.location.pathname
  if (from !== '/check') sp.set('from', from)
  window.location.href = `/check?${sp.toString()}`
}

export default function CompanySearch({ variant = 'hero', initial = '', autoFocus = false, onSubmitQuery }: {
  variant?: 'hero' | 'plain'
  initial?: string
  autoFocus?: boolean
  /** Ohne Angabe: Weiterleitung nach /check?q=… */
  onSubmitQuery?: (q: string) => void
}) {
  const [query, setQuery] = useState(initial)
  const hero = variant === 'hero'
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (q.length < 2) return
    if (onSubmitQuery) onSubmitQuery(q)
    else goToCheck({ q })
  }
  return (
    <form onSubmit={submit} className="bc-form" role="search"
      style={{ display: 'flex', gap: 8, maxWidth: hero ? 560 : undefined, backgroundColor: '#fff', borderRadius: 999, padding: 6, border: hero ? 'none' : '1px solid var(--line)' }}>
      <label htmlFor={`cs-${variant}`} style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Unternehmen in Google finden</label>
      <input id={`cs-${variant}`} value={query} autoFocus={autoFocus} onChange={e => setQuery(e.target.value)}
        placeholder="Unternehmen in Google finden" autoComplete="organization" enterKeyHint="search"
        style={{ flex: 1, minWidth: 0, border: 0, outline: 'none', background: 'transparent', fontSize: 15, fontFamily: 'inherit', color: 'var(--ink)', padding: '0 18px' }} />
      <button type="submit" className={`btn btn-md ${hero ? 'btn-ink' : 'btn-electric'}`} style={{ flexShrink: 0 }}>Mein Unternehmen finden</button>
    </form>
  )
}
