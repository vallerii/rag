import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { authErrorText, currentUser, signIn, signOut, signUp, type AuthError, type Contact } from './data'

// Schritt «Kundenbereich»: Registrieren ODER Anmelden — umschaltbar.
// Wird im Sichtbarkeits-Check (/check) und bei Paket-Anfragen (/anfrage) verwendet.
// Nach erfolgreicher Anmeldung ruft der Schritt onAuthed auf; die Seite legt dann
// Check bzw. Anfrage an und leitet in den Kundenbereich weiter.

type Mode = 'register' | 'login'

const field: React.CSSProperties = { width: '100%', padding: '12px 14px', border: '1px solid rgba(7,7,12,0.14)', borderRadius: 12, fontSize: 14.5, fontFamily: 'inherit', outline: 'none', color: 'var(--ink)', backgroundColor: '#fff' }
const labelSt: React.CSSProperties = { display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6, color: 'var(--ink)' }
const emailRe = /^\S+@\S+\.\S+$/

function PasswordField({ value, onChange, autoComplete }: { value: string; onChange: (v: string) => void; autoComplete: string }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <input id="acc-password" type={show ? 'text' : 'password'} style={{ ...field, paddingRight: 92 }} value={value} onChange={e => onChange(e.target.value)} autoComplete={autoComplete} />
      <button type="button" onClick={() => setShow(v => !v)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--electric)', fontWeight: 600, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit', padding: '6px 8px' }}>
        {show ? 'Verbergen' : 'Anzeigen'}
      </button>
    </div>
  )
}

export default function AccountStep({ submitLabel, onAuthed, onBack }: {
  submitLabel: string
  /** Legt Check/Anfrage an und leitet weiter. Gibt einen Fehlertext zurück, wenn etwas schiefging. */
  onAuthed: (user: User, contact: Contact) => Promise<string | null>
  onBack?: () => void
}) {
  const [mode, setMode] = useState<Mode>('register')
  const [user, setUser] = useState<User | null>(null)
  const [checked, setChecked] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [okEmail, setOkEmail] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => { currentUser().then(u => { setUser(u); setChecked(true) }) }, [])

  const switchTo = (m: Mode) => { setMode(m); setError(''); setNotice('') }

  const canSubmit = user
    ? true
    : mode === 'register'
      ? name.trim() !== '' && emailRe.test(email.trim()) && password.length >= 8
      : emailRe.test(email.trim()) && password.length > 0

  const contactFrom = (u: User): Contact => ({
    name: mode === 'register' && !user ? name.trim() : ((u.user_metadata?.name as string | undefined) ?? ''),
    phone: mode === 'register' && !user ? phone.trim() : ((u.user_metadata?.phone as string | undefined) ?? ''),
    email: u.email ?? email.trim(),
    okEmail: mode === 'register' && !user ? okEmail : true,
    okPhone: false,
  })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || busy) return
    setBusy(true); setError(''); setNotice('')
    try {
      let u = user
      if (!u) {
        const r: { user: User | null; error?: AuthError } = mode === 'register'
          ? await signUp(email, password, name, phone)
          : await signIn(email, password)
        if (r.error === 'exists') {
          setMode('login'); setNotice(authErrorText('exists')); return
        }
        if (r.error || !r.user) { setError(authErrorText(r.error ?? 'other')); return }
        u = r.user
      }
      const err = await onAuthed(u, contactFrom(u))
      if (err) setError(err)
    } finally {
      setBusy(false)
    }
  }

  const logoutHere = async () => { await signOut(); setUser(null) }

  if (!checked) return <p style={{ fontSize: 14.5, color: 'var(--muted)' }}>…</p>

  return (
    <form onSubmit={submit}>
      {user ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '14px 16px', borderRadius: 14, backgroundColor: '#F7F6FF', border: '1px solid #E4DFFF', fontSize: 14.5 }}>
          <span>Angemeldet als <strong>{user.email}</strong></span>
          <button type="button" onClick={logoutHere} className="ul" style={{ background: 'none', border: 'none', padding: 0, color: 'var(--muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Anderes Konto</button>
        </div>
      ) : (
        <>
          <div role="tablist" aria-label="Konto" className="acc-switch" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, padding: 4, borderRadius: 999, backgroundColor: 'var(--bone)', marginBottom: 22 }}>
            {([['register', 'Neu hier — Konto anlegen'], ['login', 'Ich habe schon ein Konto']] as const).map(([m, l]) => (
              <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => switchTo(m)}
                style={{ border: 'none', borderRadius: 999, padding: '11px 14px', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', backgroundColor: mode === m ? '#fff' : 'transparent', color: mode === m ? 'var(--ink)' : 'var(--muted)', boxShadow: mode === m ? '0 2px 8px rgba(7,7,12,0.08)' : 'none', transition: 'all 0.2s ease' }}>
                {l}
              </button>
            ))}
          </div>

          {notice && <div role="status" style={{ marginBottom: 16, padding: '11px 14px', borderRadius: 12, backgroundColor: '#F7F6FF', border: '1px solid #E4DFFF', fontSize: 14, lineHeight: 1.55 }}>{notice}</div>}

          {mode === 'register' ? (
            <div className="ck-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div><label style={labelSt} htmlFor="acc-name">Name</label><input id="acc-name" style={field} value={name} onChange={e => setName(e.target.value)} autoComplete="name" placeholder="Vor- und Nachname" /></div>
              <div><label style={labelSt} htmlFor="acc-phone">Telefon <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(optional)</span></label><input id="acc-phone" type="tel" style={field} value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" placeholder="Für Rückfragen" /></div>
              <div><label style={labelSt} htmlFor="acc-email">E-Mail</label><input id="acc-email" type="email" style={field} value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" placeholder="name@firma.de" /></div>
              <div>
                <label style={labelSt} htmlFor="acc-password">Passwort</label>
                <PasswordField value={password} onChange={setPassword} autoComplete="new-password" />
                <p style={{ fontSize: 12.5, margin: '6px 2px 0', color: password.length >= 8 ? '#0F7A3E' : 'var(--muted)' }}>
                  {password.length >= 8 ? '✓ Passwort ist lang genug' : 'Mindestens 8 Zeichen'}
                </p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16, maxWidth: 420 }}>
              <div><label style={labelSt} htmlFor="acc-email">E-Mail</label><input id="acc-email" type="email" style={field} value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" /></div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                  <label style={labelSt} htmlFor="acc-password">Passwort</label>
                  <a href={`/passwort-vergessen${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ''}`} target="_blank" rel="noopener" className="ul" style={{ fontSize: 12.5, color: 'var(--electric)', fontWeight: 600 }}>Passwort vergessen?</a>
                </div>
                <PasswordField value={password} onChange={setPassword} autoComplete="current-password" />
              </div>
            </div>
          )}

          {mode === 'register' && (
            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, lineHeight: 1.5, cursor: 'pointer', marginTop: 18 }}>
              <input type="checkbox" checked={okEmail} onChange={() => setOkEmail(v => !v)} style={{ width: 18, height: 18, marginTop: 1, accentColor: '#2600FF', flexShrink: 0 }} />
              <span>Ergebnisse und Empfehlungen dürfen per E-Mail kommen.</span>
            </label>
          )}
        </>
      )}

      {error && <div role="alert" style={{ marginTop: 18, padding: '12px 14px', borderRadius: 12, backgroundColor: '#FDECEC', color: '#A21C22', fontSize: 14, lineHeight: 1.55 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 24 }}>
        <button type="submit" className="btn btn-lg btn-electric" disabled={!canSubmit || busy} style={{ opacity: canSubmit ? 1 : 0.45, cursor: canSubmit && !busy ? 'pointer' : 'default' }}>
          {busy ? 'Einen Moment…' : submitLabel} <span className="arw">→</span>
        </button>
        {onBack && <button type="button" className="btn btn-lg btn-outline-light" onClick={onBack}>Zurück</button>}
      </div>
      <p style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--muted)', margin: '18px 0 0' }}>
        Wir nutzen Ihre Angaben nur für Ihre Anfrage und die Rückmeldung dazu. Details in der Datenschutzerklärung.
      </p>
    </form>
  )
}
