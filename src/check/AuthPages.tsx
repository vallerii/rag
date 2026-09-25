import { useEffect, useState } from 'react'
import { Logo, useNoindex } from './CheckPage'
import { authErrorText, currentUser, getSupabase, sendPasswordReset, setNewPassword, signIn, type AuthError } from './data'

// Anmeldung für Bestandskunden: /login · /passwort-vergessen · /passwort-neu
// Konto entsteht im Check (Schritt 3) — hier nur Anmelden und Passwort zurücksetzen.

const field: React.CSSProperties = { width: '100%', padding: '12px 14px', border: '1px solid rgba(7,7,12,0.14)', borderRadius: 12, fontSize: 15, fontFamily: 'inherit', outline: 'none', color: 'var(--ink)', backgroundColor: '#fff' }
const labelSt: React.CSSProperties = { display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }

/** Nur interne Pfade als Weiterleitung zulassen. */
function nextPath(): string {
  const n = new URLSearchParams(window.location.search).get('next') || '/kabinett'
  return n.startsWith('/') && !n.startsWith('//') ? n : '/kabinett'
}

function AuthShell({ eyebrow, title, sub, children }: { eyebrow: string; title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bone)', display: 'flex', flexDirection: 'column' }}>
      <header style={{ borderBottom: '1px solid var(--line)' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 clamp(20px, 4vw, 48px)', height: 66, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Logo />
          <a href="/" className="ul" style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>Zur Website</a>
        </div>
      </header>
      <main id="inhalt" style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 'clamp(40px, 8vh, 96px) 20px 80px' }}>
        <div style={{ width: '100%', maxWidth: 460, backgroundColor: '#fff', borderRadius: 26, padding: 'clamp(26px, 4vw, 40px)', boxShadow: '0 30px 70px rgba(7,7,12,0.06)' }}>
          <p className="eyebrow" style={{ color: 'var(--electric)', marginBottom: 12 }}>{eyebrow}</p>
          <h1 className="display" style={{ fontSize: 'clamp(26px, 3vw, 34px)', lineHeight: 1.08, margin: '0 0 10px' }}>{title}</h1>
          {sub && <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--muted)', margin: '0 0 24px' }}>{sub}</p>}
          {children}
        </div>
      </main>
    </div>
  )
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return <div role="alert" style={{ marginTop: 14, padding: '11px 14px', borderRadius: 12, backgroundColor: '#FDECEC', color: '#A21C22', fontSize: 14, lineHeight: 1.55 }}>{children}</div>
}

function PasswordInput({ id, value, onChange, autoComplete }: { id: string; value: string; onChange: (v: string) => void; autoComplete: string }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <input id={id} type={show ? 'text' : 'password'} style={{ ...field, paddingRight: 92 }} value={value} onChange={e => onChange(e.target.value)} autoComplete={autoComplete} />
      <button type="button" onClick={() => setShow(v => !v)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--electric)', fontWeight: 600, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit', padding: '6px 8px' }}>
        {show ? 'Verbergen' : 'Anzeigen'}
      </button>
    </div>
  )
}

export function LoginPage() {
  useNoindex('Anmelden | RAG')
  const [email, setEmail] = useState(() => new URLSearchParams(window.location.search).get('email') ?? '')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)

  // Bereits angemeldet → direkt weiter.
  useEffect(() => { currentUser().then(u => { if (u) window.location.replace(nextPath()) }) }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true); setError(null)
    const r = await signIn(email, password)
    setBusy(false)
    if (r.error) { setError(r.error); return }
    window.location.href = nextPath()
  }

  const ok = /^\S+@\S+\.\S+$/.test(email.trim()) && password.length > 0
  return (
    <AuthShell eyebrow="Kundenbereich" title="Anmelden" sub="Melden Sie sich an, um den Stand Ihres Sichtbarkeits-Checks und Ihren Bericht zu sehen.">
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div><label style={labelSt} htmlFor="li-email">E-Mail</label><input id="li-email" type="email" style={field} value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" /></div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
            <label style={labelSt} htmlFor="li-password">Passwort</label>
            <a href={`/passwort-vergessen${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ''}`} className="ul" style={{ fontSize: 12.5, color: 'var(--electric)', fontWeight: 600 }}>Passwort vergessen?</a>
          </div>
          <PasswordInput id="li-password" value={password} onChange={setPassword} autoComplete="current-password" />
        </div>
        {error && <ErrorBox>{authErrorText(error)}</ErrorBox>}
        <button type="submit" className="btn btn-lg btn-electric" disabled={!ok || busy} style={{ width: '100%', marginTop: 6, opacity: ok ? 1 : 0.45 }}>
          {busy ? 'Wird angemeldet…' : 'Anmelden'} <span className="arw">→</span>
        </button>
      </form>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--muted)', margin: '22px 0 0', paddingTop: 18, borderTop: '1px solid var(--line-soft)' }}>
        Noch kein Konto? Das Konto entsteht beim kostenlosen Check.{' '}
        <a href="/#audit-quiz" className="ul" style={{ color: 'var(--electric)', fontWeight: 600 }}>Check starten →</a>
      </p>
    </AuthShell>
  )
}

export function ForgotPasswordPage() {
  useNoindex('Passwort vergessen | RAG')
  const [email, setEmail] = useState(() => new URLSearchParams(window.location.search).get('email') ?? '')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true); setError(null)
    const err = await sendPasswordReset(email)
    setBusy(false)
    if (err) { setError(err); return }
    setSent(true)
  }

  if (sent) {
    return (
      <AuthShell eyebrow="Passwort vergessen" title="Bitte prüfen Sie Ihr Postfach." sub="Wenn es für diese Adresse ein Konto gibt, haben wir einen Link zum Zurücksetzen geschickt. Der Link ist nur kurze Zeit gültig — schauen Sie auch im Spam-Ordner nach.">
        <a href="/login" className="btn btn-lg btn-outline-light" style={{ width: '100%' }}>Zurück zur Anmeldung</a>
      </AuthShell>
    )
  }
  const ok = /^\S+@\S+\.\S+$/.test(email.trim())
  return (
    <AuthShell eyebrow="Passwort vergessen" title="Neues Passwort festlegen" sub="Geben Sie die E-Mail-Adresse Ihres Kontos ein. Wir schicken Ihnen einen Link, mit dem Sie ein neues Passwort festlegen.">
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div><label style={labelSt} htmlFor="fp-email">E-Mail</label><input id="fp-email" type="email" style={field} value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" /></div>
        {error && <ErrorBox>{authErrorText(error)}</ErrorBox>}
        <button type="submit" className="btn btn-lg btn-electric" disabled={!ok || busy} style={{ width: '100%', marginTop: 6, opacity: ok ? 1 : 0.45 }}>
          {busy ? 'Wird gesendet…' : 'Link senden'} <span className="arw">→</span>
        </button>
      </form>
      <p style={{ fontSize: 14, margin: '20px 0 0' }}><a href="/login" className="ul" style={{ color: 'var(--muted)' }}>← Zurück zur Anmeldung</a></p>
    </AuthShell>
  )
}

export function ResetPasswordPage() {
  useNoindex('Neues Passwort | RAG')
  // Der Link aus der E-Mail meldet den Nutzer an (Token in der URL). Erst danach ist das Formular nutzbar.
  const [ready, setReady] = useState<'wait' | 'ok' | 'invalid'>('wait')
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const hashError = new URLSearchParams(window.location.hash.slice(1)).get('error_code')
    if (hashError) { setReady('invalid'); return }
    let unsub = () => {}
    getSupabase().then(sb => {
      const { data } = sb.auth.onAuthStateChange((event, session) => {
        if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) setReady('ok')
      })
      unsub = () => data.subscription.unsubscribe()
    })
    // Falls die Sitzung schon vor dem Listener aus der URL gelesen wurde:
    const t = setTimeout(async () => {
      const u = await currentUser()
      setReady(r => (r === 'wait' ? (u ? 'ok' : 'invalid') : r))
    }, 1200)
    return () => { unsub(); clearTimeout(t) }
  }, [])

  const match = password.length >= 8 && password === repeat
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!match || busy) return
    setBusy(true); setError(null)
    const err = await setNewPassword(password)
    setBusy(false)
    if (err) { setError(err); return }
    setDone(true)
    setTimeout(() => { window.location.href = '/kabinett' }, 1500)
  }

  if (ready === 'invalid') {
    return (
      <AuthShell eyebrow="Passwort zurücksetzen" title="Der Link ist abgelaufen." sub="Links zum Zurücksetzen gelten nur kurze Zeit und nur einmal. Fordern Sie einfach einen neuen an.">
        <a href="/passwort-vergessen" className="btn btn-lg btn-electric" style={{ width: '100%' }}>Neuen Link anfordern <span className="arw">→</span></a>
      </AuthShell>
    )
  }
  if (done) {
    return (
      <AuthShell eyebrow="Passwort zurücksetzen" title="Passwort geändert." sub="Wir leiten Sie zu Ihrem Kundenbereich weiter …">
        <a href="/kabinett" className="btn btn-lg btn-electric" style={{ width: '100%' }}>Zum Kundenbereich <span className="arw">→</span></a>
      </AuthShell>
    )
  }
  return (
    <AuthShell eyebrow="Passwort zurücksetzen" title="Neues Passwort" sub="Mindestens 8 Zeichen. Danach sind Sie direkt angemeldet.">
      {ready === 'wait' ? <p style={{ fontSize: 14.5, color: 'var(--muted)' }}>Link wird geprüft…</p> : (
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label style={labelSt} htmlFor="rp-1">Neues Passwort</label><PasswordInput id="rp-1" value={password} onChange={setPassword} autoComplete="new-password" /></div>
          <div><label style={labelSt} htmlFor="rp-2">Passwort wiederholen</label><PasswordInput id="rp-2" value={repeat} onChange={setRepeat} autoComplete="new-password" /></div>
          {repeat.length > 0 && password !== repeat && <p style={{ fontSize: 13, color: '#A21C22', margin: 0 }}>Die Passwörter stimmen nicht überein.</p>}
          {error && <ErrorBox>{authErrorText(error)}</ErrorBox>}
          <button type="submit" className="btn btn-lg btn-electric" disabled={!match || busy} style={{ width: '100%', marginTop: 6, opacity: match ? 1 : 0.45 }}>
            {busy ? 'Wird gespeichert…' : 'Passwort speichern'} <span className="arw">→</span>
          </button>
        </form>
      )}
    </AuthShell>
  )
}
