import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { authErrorText, currentUser, signIn, signInWithGoogle, signOut, signUp, type AuthError, type Contact } from './data'

// Schritt «Kundenbereich»: Registrieren ODER Anmelden — umschaltbar, dazu Anmeldung mit Google.
// Wird im Sichtbarkeits-Check (/check) und bei Paket-Anfragen (/anfrage) verwendet.
// Nach erfolgreicher Anmeldung ruft der Schritt onAuthed auf; die Seite legt dann
// Check bzw. Anfrage an und leitet in den Kundenbereich weiter.
// googleNext: Pfad, zu dem Google nach der Anmeldung zurückleitet. Ohne Angabe gibt es keinen Google-Knopf.

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

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.5l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.9 6.1C12.4 13.5 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-10 7.1-17.5z" />
      <path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-2.9-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C.9 16.6 0 20.2 0 24s.9 7.4 2.6 10.7l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.2-13.5-9.9l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  )
}

export default function AccountStep({ submitLabel, loggedInLabel, onAuthed, onBack, googleNext, onBeforeGoogle }: {
  submitLabel: string
  /** Text des Knopfs, wenn schon angemeldet (Standard: submitLabel) */
  loggedInLabel?: string
  /** Legt Check/Anfrage an und leitet weiter. Gibt einen Fehlertext zurück, wenn etwas schiefging. */
  onAuthed: (user: User, contact: Contact) => Promise<string | null>
  onBack?: () => void
  /** Pfad (innerhalb der Website), zu dem Google nach der Anmeldung zurückleitet. */
  googleNext?: string
  /** Wird direkt vor der Weiterleitung zu Google aufgerufen (z. B. um Eingaben zu sichern). */
  onBeforeGoogle?: () => void
}) {
  const [mode, setMode] = useState<Mode>('register')
  const [user, setUser] = useState<User | null>(null)
  const [checked, setChecked] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [okTips, setOkTips] = useState(false) // Werbe-Einwilligung: nie vorausgewählt (DSGVO/UWG)
  const [privacyOk, setPrivacyOk] = useState(false) // Pflicht: Datenschutzerklärung gelesen
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => { currentUser().then(u => { setUser(u); setChecked(true) }) }, [])

  const switchTo = (m: Mode) => { setMode(m); setError(''); setNotice('') }

  const canSubmit = user
    ? true
    : mode === 'register'
      ? emailRe.test(email.trim()) && password.length >= 8 && privacyOk
      : emailRe.test(email.trim()) && password.length > 0

  const contactFrom = (u: User): Contact => ({
    name: mode === 'register' && !user ? name.trim() : (((u.user_metadata?.name ?? u.user_metadata?.full_name) as string | undefined) ?? ''),
    phone: mode === 'register' && !user ? phone.trim() : ((u.user_metadata?.phone as string | undefined) ?? ''),
    email: u.email ?? email.trim(),
    okEmail: true,
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
          ? await signUp(email, password, name, phone, okTips)
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

  // Google leitet die Seite weg und kommt mit einer Sitzung zurück; der Knopf «Vollständige Analyse starten» folgt dann wie gewohnt.
  const google = async () => {
    if (!googleNext || busy) return
    setError(''); setNotice('')
    onBeforeGoogle?.()
    const err = await signInWithGoogle(googleNext)
    if (err) setError(authErrorText(err))
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
          {googleNext && (
            <>
              <button type="button" onClick={google} disabled={busy}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '13px 16px', borderRadius: 14, border: '1px solid rgba(7,7,12,0.14)', backgroundColor: '#fff', color: 'var(--ink)', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, cursor: busy ? 'default' : 'pointer' }}>
                <GoogleG />Mit Google fortfahren
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '14px 0', color: 'var(--muted)', fontSize: 13 }}>
                <span style={{ flex: 1, height: 1, backgroundColor: 'var(--line)' }} />oder mit E-Mail<span style={{ flex: 1, height: 1, backgroundColor: 'var(--line)' }} />
              </div>
            </>
          )}

          {notice && <div role="status" style={{ marginBottom: 16, padding: '11px 14px', borderRadius: 12, backgroundColor: '#F7F6FF', border: '1px solid #E4DFFF', fontSize: 14, lineHeight: 1.55 }}>{notice}</div>}

          {/* Reihenfolge: E-Mail, Telefon (nur Registrierung, optional), Passwort. Der Platz bleibt beim Anmelden erhalten, damit nichts springt. */}
          <div className="ck-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelSt} htmlFor="acc-email">E-Mail</label>
              <input id="acc-email" type="email" style={field} value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" placeholder="name@firma.de" />
            </div>
            <div style={{ visibility: mode === 'register' ? 'visible' : 'hidden' }}>
              <label style={labelSt} htmlFor="acc-phone">Telefon (optional)</label>
              <input id="acc-phone" type="tel" style={field} value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" placeholder="+49 …" tabIndex={mode === 'register' ? 0 : -1} />
              <p style={{ fontSize: 12.5, margin: '6px 2px 0', color: 'var(--muted)' }}>Für Rückfragen zu Ihrem Bericht</p>
            </div>
          </div>
          <div className="ck-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                <label style={labelSt} htmlFor="acc-password">Passwort</label>
                {mode === 'login' && (
                  <a href={`/passwort-vergessen${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ''}`} target="_blank" rel="noopener" className="ul" style={{ fontSize: 12.5, color: 'var(--electric)', fontWeight: 600 }}>Passwort vergessen?</a>
                )}
              </div>
              <PasswordField value={password} onChange={setPassword} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} />
              <p style={{ fontSize: 12.5, minHeight: 18, margin: '6px 2px 0', color: password.length >= 8 ? '#0F7A3E' : 'var(--muted)' }}>
                {mode === 'register' ? (password.length >= 8 ? '✓ Passwort ist lang genug' : 'Mindestens 8 Zeichen') : ''}
              </p>
            </div>
            <div />
          </div>

          <button type="button" onClick={() => switchTo(mode === 'register' ? 'login' : 'register')} className="ul"
            style={{ marginTop: 8, background: 'none', border: 'none', padding: 0, color: 'var(--electric)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            {mode === 'register' ? 'Ich habe schon ein Konto' : 'Neu hier? Konto anlegen'}
          </button>

          {mode === 'register' && (
            <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
              <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13.5, lineHeight: 1.5, cursor: 'pointer', fontWeight: 600 }}>
                <input type="checkbox" checked={privacyOk} onChange={() => setPrivacyOk(v => !v)} style={{ width: 18, height: 18, marginTop: 1, accentColor: '#2600FF', flexShrink: 0 }} />
                <span>Ich habe die Datenschutzerklärung gelesen und stimme ihr zu.</span>
              </label>
              <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13.5, lineHeight: 1.5, cursor: 'pointer' }}>
                <input type="checkbox" checked={okTips} onChange={() => setOkTips(v => !v)} style={{ width: 18, height: 18, marginTop: 1, accentColor: '#2600FF', flexShrink: 0 }} />
                <span>Ich möchte gelegentlich Tipps zur lokalen Sichtbarkeit per E-Mail und Telefon erhalten. Abmeldung jederzeit möglich.</span>
              </label>
            </div>
          )}
        </>
      )}

      {error && <div role="alert" style={{ marginTop: 18, padding: '12px 14px', borderRadius: 12, backgroundColor: '#FDECEC', color: '#A21C22', fontSize: 14, lineHeight: 1.55 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
        <button type="submit" className="btn btn-lg btn-electric" disabled={!canSubmit || busy} style={{ opacity: canSubmit ? 1 : 0.45, cursor: canSubmit && !busy ? 'pointer' : 'default' }}>
          {busy ? 'Einen Moment…' : user && loggedInLabel ? loggedInLabel : submitLabel} <span className="arw">→</span>
        </button>
        {onBack && <button type="button" className="btn btn-lg btn-outline-light" onClick={onBack}>Zurück</button>}
      </div>
      <p style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--muted)', margin: '18px 0 0' }}>
        Wir nutzen Ihre Angaben nur für Ihre Anfrage und die Rückmeldung dazu. Details in der <a href="/datenschutz" target="_blank" rel="noopener" className="ul">Datenschutzerklärung</a>.
      </p>
    </form>
  )
}
