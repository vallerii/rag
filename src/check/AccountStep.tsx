import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { authErrorText, currentUser, loadMyContact, saveMyContact, signIn, signInWithGoogle, signOut, signUp, type AuthError, type Contact } from './data'

// Schritt «Kundenbereich»: Registrieren ODER Anmelden — umschaltbar, dazu Anmeldung mit Google.
// Wird im Sichtbarkeits-Check (/check) und bei Paket-Anfragen (/anfrage) verwendet.
// Nach erfolgreicher Anmeldung ruft der Schritt onAuthed auf; die Seite legt dann
// Check bzw. Anfrage an und leitet in den Kundenbereich weiter.
// googleNext: Pfad, zu dem Google nach der Anmeldung zurückleitet. Ohne Angabe gibt es keinen Google-Knopf.

type Mode = 'register' | 'login'

const field: React.CSSProperties = { width: '100%', minHeight: 54, boxSizing: 'border-box', padding: '15px 16px', border: '1px solid rgba(7,7,12,0.14)', borderRadius: 12, fontSize: 14.5, fontFamily: 'inherit', outline: 'none', color: 'var(--ink)', backgroundColor: '#fff' }
const labelSt: React.CSSProperties = { display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 10, color: 'var(--ink)' }
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
  loggedInLabel?: string
  onAuthed: (user: User, contact: Contact) => Promise<string | null>
  onBack?: () => void
  googleNext?: string
  onBeforeGoogle?: () => void
}) {
  const [mode, setMode] = useState<Mode>('register')
  const [emailOpen, setEmailOpen] = useState(!googleNext)
  const [user, setUser] = useState<User | null>(null)
  const [checked, setChecked] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [okTips, setOkTips] = useState(false)
  const [privacyOk, setPrivacyOk] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const u = await currentUser()
        if (!active) return
        if (u) {
          const c = await loadMyContact(u)
          if (!active) return
          setUser(u); setName(c.name); setPhone(c.phone)
        }
      } catch {
        if (active) setError('Ihr Konto konnte nicht geladen werden. Bitte versuchen Sie es erneut.')
      } finally {
        if (active) setChecked(true)
      }
    }
    void load()
    return () => { active = false }
  }, [])

  const switchTo = (m: Mode) => { setMode(m); setEmailOpen(true); setError(''); setNotice('') }
  const validPhone = /^[+\d\s()./-]+$/.test(phone.trim()) && phone.replace(/\D/g, '').length >= 7 && phone.replace(/\D/g, '').length <= 15
  const validContact = name.trim().length > 0 && validPhone
  const needsPrivacy = user ? !user.user_metadata?.privacy_accepted_at : mode === 'register'
  const showFields = !!user || emailOpen
  const canSubmit = user
    ? validContact && (!needsPrivacy || privacyOk)
    : emailOpen && emailRe.test(email.trim()) && (mode === 'register'
      ? password.length >= 8 && validContact && privacyOk
      : password.length > 0)

  const contactFrom = (u: User): Contact => ({
    name: name.trim(), phone: phone.trim(), email: u.email ?? email.trim(), okEmail: true, okPhone: false,
  })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || busy) return
    setBusy(true); setError(''); setNotice('')
    try {
      let u = user
      if (!u) {
        const r = mode === 'register'
          ? await signUp(email, password, name, phone, okTips)
          : await signIn(email, password)
        if (r.error === 'exists') {
          switchTo('login'); setNotice(authErrorText('exists')); return
        }
        if (r.error || !r.user) { setError(authErrorText(r.error ?? 'other')); return }
        u = r.user
        // Nach der E-Mail-Anmeldung Kontaktdaten prüfen, bevor ein Check angelegt wird.
        if (mode === 'login') {
          const c = await loadMyContact(u)
          setUser(u); setName(c.name); setPhone(c.phone)
          setPassword(''); setNotice('Bitte prüfen Sie Ihre Kontaktdaten.'); return
        }
        // Bei einem Speicherfehler bleibt die neue Sitzung sichtbar; kein zweites Konto anlegen.
        setUser(u)
      } else {
        const saved = await saveMyContact({ name: name.trim(), phone: phone.trim() }, { privacy: needsPrivacy && privacyOk, marketing: needsPrivacy && okTips })
        if (!saved) { setError('Ihre Kontaktdaten konnten nicht gespeichert werden. Bitte versuchen Sie es erneut.'); return }
      }
      const err = await onAuthed(u, contactFrom(u))
      if (err) setError(err)
    } catch {
      setError('Das hat gerade nicht geklappt. Bitte versuchen Sie es erneut.')
    } finally {
      setBusy(false)
    }
  }

  // Google liefert die Sitzung; danach werden Name und Telefonnummer ergänzt.
  const google = async () => {
    if (!googleNext || busy) return
    setBusy(true); setError(''); setNotice('')
    try {
      onBeforeGoogle?.()
      const err = await signInWithGoogle(googleNext)
      if (err) setError(authErrorText(err))
    } catch {
      setError('Die Anmeldung mit Google ist gerade nicht erreichbar. Bitte versuchen Sie es erneut.')
    } finally {
      setBusy(false)
    }
  }

  const logoutHere = async () => {
    if (busy) return
    setBusy(true); setError('')
    try {
      await signOut()
      setUser(null); setName(''); setPhone(''); setEmail(''); setPassword('')
      setPrivacyOk(false); setOkTips(false); setNotice(''); setMode('register'); setEmailOpen(!googleNext)
    } catch { setError('Abmelden ist gerade nicht möglich. Bitte versuchen Sie es erneut.') }
    finally { setBusy(false) }
  }

  if (!checked) return <p role="status" style={{ fontSize: 14.5, color: 'var(--muted)' }}>Ihr Konto wird geladen…</p>

  return (
    <form onSubmit={submit} aria-busy={busy}>
      {user ? (
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '20px', borderRadius: 14, backgroundColor: '#F7F6FF', border: '1px solid #E4DFFF', fontSize: 14.5 }}>
            <span style={{ overflowWrap: 'anywhere' }}>Angemeldet als <strong>{user.email}</strong></span>
            <button type="button" onClick={logoutHere} disabled={busy} className="ul" style={{ background: 'none', border: 'none', padding: 0, color: 'var(--muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Anderes Konto</button>
          </div>
          <p style={{ margin: '24px 0 0', color: 'var(--muted)', fontSize: 14.5, lineHeight: 1.65 }}>Fast geschafft. Unter welcher Telefonnummer erreichen wir Sie für Rückfragen zu Ihrer Anfrage?</p>
        </div>
      ) : googleNext ? (
        <div style={{ display: 'grid', gap: 20, marginBottom: emailOpen ? 36 : 0 }}>
          <button type="button" onClick={google} disabled={busy} className="btn btn-lg btn-electric"
            style={{ width: '100%', minHeight: 56, justifyContent: 'center', gap: 12 }}>
            <span style={{ display: 'inline-flex', backgroundColor: '#fff', borderRadius: '50%', padding: 6 }}><GoogleG /></span>
            Mit Google fortfahren
          </button>
          <button type="button" onClick={() => { setEmailOpen(v => !v); setError(''); setNotice('') }} disabled={busy} aria-expanded={emailOpen} aria-controls="acc-email-fields" className="btn btn-lg btn-outline-light"
            style={{ width: '100%', minHeight: 56, justifyContent: 'center' }}>
            {mode === 'register' ? 'Mit E-Mail registrieren' : 'Mit E-Mail anmelden'}
          </button>
        </div>
      ) : null}

      {notice && <div role="status" style={{ margin: '24px 0', padding: '16px', borderRadius: 12, backgroundColor: '#F7F6FF', border: '1px solid #E4DFFF', fontSize: 14, lineHeight: 1.55 }}>{notice}</div>}

      {showFields && (
        <div id="acc-email-fields" style={{ display: 'grid', gap: 28 }}>
          {(user || mode === 'register') && (
            <div>
              <label style={labelSt} htmlFor="acc-name">Ihr Name</label>
              <input id="acc-name" style={field} value={name} onChange={e => setName(e.target.value)} autoComplete="name" maxLength={120} required placeholder="Vor- und Nachname" />
            </div>
          )}
          {!user && (
            <div>
              <label style={labelSt} htmlFor="acc-email">E-Mail</label>
              <input id="acc-email" type="email" style={field} value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required placeholder="name@firma.de" />
            </div>
          )}
          {(user || mode === 'register') && (
            <div>
              <label style={labelSt} htmlFor="acc-phone">Telefonnummer</label>
              <input id="acc-phone" type="tel" style={field} value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" maxLength={40} required placeholder="+49 …" aria-describedby="acc-phone-hint" />
              <p id="acc-phone-hint" style={{ fontSize: 12.5, margin: '10px 2px 0', color: 'var(--muted)', lineHeight: 1.6 }}>Für Rückfragen zu Ihrer Anfrage. Bitte mit Vorwahl angeben.</p>
            </div>
          )}
          {!user && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                <label style={labelSt} htmlFor="acc-password">Passwort</label>
                {mode === 'login' && <a href={`/passwort-vergessen${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ''}`} target="_blank" rel="noopener" className="ul" style={{ fontSize: 12.5, color: 'var(--electric)', fontWeight: 600 }}>Passwort vergessen?</a>}
              </div>
              <PasswordField value={password} onChange={setPassword} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} />
              {mode === 'register' && <p style={{ fontSize: 12.5, margin: '10px 2px 0', color: password.length >= 8 ? '#0F7A3E' : 'var(--muted)' }}>{password.length >= 8 ? '✓ Passwort ist lang genug' : 'Mindestens 8 Zeichen'}</p>}
            </div>
          )}
          {needsPrivacy && (
            <div style={{ display: 'grid', gap: 18, marginTop: 4 }}>
              <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 13.5, lineHeight: 1.6, cursor: 'pointer', fontWeight: 600 }}>
                <input type="checkbox" required checked={privacyOk} onChange={() => setPrivacyOk(v => !v)} style={{ width: 18, height: 18, marginTop: 2, accentColor: '#2600FF', flexShrink: 0 }} />
                <span>Ich habe die <a href="/datenschutz" target="_blank" rel="noopener" className="ul">Datenschutzerklärung</a> gelesen und stimme ihr zu.</span>
              </label>
              <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 13.5, lineHeight: 1.6, cursor: 'pointer' }}>
                <input type="checkbox" checked={okTips} onChange={() => setOkTips(v => !v)} style={{ width: 18, height: 18, marginTop: 2, accentColor: '#2600FF', flexShrink: 0 }} />
                <span>Ich möchte gelegentlich Tipps zur lokalen Sichtbarkeit per E-Mail und Telefon erhalten. Abmeldung jederzeit möglich.</span>
              </label>
            </div>
          )}
        </div>
      )}

      {error && <div role="alert" style={{ marginTop: 24, padding: '16px', borderRadius: 12, backgroundColor: '#FDECEC', color: '#A21C22', fontSize: 14, lineHeight: 1.55 }}>{error}</div>}

      {showFields && (
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 32 }}>
          <button type="submit" className="btn btn-lg btn-electric" disabled={!canSubmit || busy} style={{ opacity: canSubmit ? 1 : 0.45, cursor: canSubmit && !busy ? 'pointer' : 'default' }}>
            {busy ? 'Einen Moment…' : user && loggedInLabel ? loggedInLabel : !user && mode === 'login' ? 'Anmelden' : submitLabel} <span className="arw">→</span>
          </button>
        </div>
      )}
      {!user && (
        <button type="button" onClick={() => switchTo(mode === 'register' ? 'login' : 'register')} disabled={busy} className="ul"
          style={{ display: 'block', marginTop: 22, background: 'none', border: 'none', padding: 0, color: 'var(--electric)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          {mode === 'register' ? 'Ich habe schon ein Konto' : 'Neu hier? Konto anlegen'}
        </button>
      )}
      {onBack && <button type="button" className="ul" onClick={onBack} disabled={busy} style={{ marginTop: 16, background: 'none', border: 0, padding: 0, fontFamily: 'inherit', color: 'var(--muted)', cursor: 'pointer', fontSize: 13.5 }}>Zurück</button>}
      <p style={{ fontSize: 12, lineHeight: 1.7, color: 'var(--muted)', margin: '16px 0 0' }}>
        Wir nutzen Ihre Angaben nur für Ihre Anfrage und die Rückmeldung dazu. Details in der <a href="/datenschutz" target="_blank" rel="noopener" className="ul">Datenschutzerklärung</a>.
      </p>
    </form>
  )
}
