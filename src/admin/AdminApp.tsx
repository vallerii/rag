import LangSwitch from '../LangSwitch'
import { tr } from '../i18n'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNoindex } from '../check/CheckPage'
import {
  OPEN, STAGES, acceptInvite, addNote, checkState, createInvite, currentEmail, getAssignee, isAdmin, isStaff, addAppointment, deleteAppointment, loadAll, loadClient, loadMyProfile, setAppointmentStatus, loadTeam, myId, saveMyProfile, myAccount, changeMyEmail, changeMyPassword, prospectByPlace, markMessagesRead, type Prospect, sendStaffPasswordReset, hasRecoverySession, setStaffNewPassword,
  revokeInvite, saveOffer, saveProject, projectLabel, versionTotal, sendStaffMessage, setAssignee, setNextContact, setRole, setStage, signInPlain, signInStaff, mfaEnroll, mfaState, mfaVerify, signOutStaff, signUpStaff, stageLabel,
  type Invite, type Kind, type Project, type ProjectStatus, type ReportVersionRow,
  type Activity, type Appointment, type Check, type Lead, type Message, type Note, type Offer, type Order, type Profile, type Request, type Stage,
} from './api'
import ReportEditor from './ReportEditor'
import Leads from './Leads'
import OfferBuilder from './OfferBuilder'
import { stopLive, useLive, useLiveStatus } from './live'
import { CATALOG, totals, type OfferItem, type Unit } from './catalog'

// Admin-Bereich unter einer nicht verlinkten Adresse (/rag-intern), noindex.
// Zugriff nur mit Rolle manager/admin (profiles.role) — die Daten schützt die Datenbank (RLS).

const ink = 'var(--ink)', muted = 'var(--muted)', line = 'var(--line)', accent = 'var(--electric)'
const card: React.CSSProperties = { backgroundColor: '#fff', border: `1px solid ${line}`, borderRadius: 16, padding: 18 }
const input: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '9px 11px', border: '1px solid rgba(7,7,12,0.16)', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', color: ink, backgroundColor: '#fff', outline: 'none' }
const h3: React.CSSProperties = { fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: muted, margin: '0 0 12px' }
const small: React.CSSProperties = { fontSize: 12.5, color: muted }
const linkBtn: React.CSSProperties = { background: 'none', border: 0, cursor: 'pointer', font: 'inherit', fontSize: 14, color: accent, padding: 0 }
const fmt = (d: string) => new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
const KIND: Record<Request['kind'], [string, string]> = { lead: ['Quiz', '#E8F3EC'], order: ['Paket', '#EEEBFF'], check: ['Check', '#FFF3DC'] }
const STAGE_COLOR: Partial<Record<Stage, string>> = { new: '#D93A3A', report_sent: '#5B4BDB', won: '#1F7A4A', lost: '#8A8A8A' }

type Queue = 'mine' | 'free' | 'new' | 'quiz' | 'order' | 'check' | 'today' | 'report' | 'clients' | 'all'
// Группы фильтров в списке: срочное (только если не 0), что показать, что ждёт действия.
const URGENT: [Queue, string][] = [['report', 'Monatsbericht fällig'], ['today', 'Heute kontaktieren'], ['free', 'Ohne Verantwortlichen'], ['new', 'Neu, noch nicht bearbeitet']]
const SHOW: [Queue, string][] = [['mine', 'Meine Anfragen'], ['all', 'Alle Anfragen'], ['clients', 'Kunden in Arbeit']]
const ACTION: [Queue, string][] = [['check', 'Check: Bericht erstellen'], ['quiz', 'Quiz: Gespräch vereinbaren'], ['order', 'Paket: Gespräch vereinbaren']]
const QUEUES: [Queue, string][] = [
  ['mine', 'Meine Anfragen'], ['free', 'Ohne Verantwortlichen'], ['new', 'Neu'], ['quiz', 'Quiz → Gespräch'], ['order', 'Paket → warten auf Gespräch'], ['check', 'Check → wartet auf Analyse'], ['today', 'Heute kontaktieren'], ['clients', 'Kunden (Projekt)'], ['all', 'Alle Anfragen'],
]
const today = () => new Date().toISOString().slice(0, 10)
function inQueue(r: Request, q: Queue, me: string | null): boolean {
  if (q === 'all') return true
  // Kunden mit angenommenem Angebot: Rechnung, Umsetzung, Ergebnis — fallen aus den Vertriebs-Warteschlangen heraus.
  if (q === 'clients') return r.stage === 'won'
  if (q === 'mine') return !!me && r.assignee === me && OPEN.includes(r.stage)
  if (q === 'free') return !r.assignee && OPEN.includes(r.stage)
  if (q === 'new') return r.stage === 'new'
  if (q === 'report') return !!r.reportDue
  // «Start bei null» (Quiz: nichts vorhanden) braucht keinen Bericht, sondern ein Gespräch.
  if (q === 'quiz') return (r.kind === 'lead' || (r.kind === 'check' && !!(r.row as Check).scratch)) && OPEN.includes(r.stage)
  if (q === 'order') return r.kind === 'order' && ['new', 'contacted', 'call_booked'].includes(r.stage)
  if (q === 'check') return r.kind === 'check' && (r.row as Check).status !== 'ready' && !(r.row as Check).scratch
  return !!r.next && r.next <= today() && OPEN.includes(r.stage) && (!r.assignee || r.assignee === me)
}
const staffName = (ps: Profile[], uid: string | null) => { const p = ps.find(x => x.id === uid); return p ? (p.name || p.email || '—') : '' }
const profileOf = (ps: Profile[], uid: string | null) => ps.find(p => p.id === uid)

export default function AdminApp() {
  useNoindex('Intern | RAG')
  if (/\/einladung\/?$/.test(window.location.pathname)) return <AcceptInvite />
  if (/\/passwort-neu\/?$/.test(window.location.pathname)) return <StaffResetPassword />
  return <AdminRoot />
}

const MFA_ON = (import.meta.env.VITE_ADMIN_2FA as string | undefined) === 'on'

function AdminRoot() {
  const [state, setState] = useState<'loading' | 'login' | 'mfa' | 'ok'>('loading')
  // Zwei-Faktor-Anmeldung (TOTP) erst, wenn sie eingeschaltet ist: VITE_ADMIN_2FA=on (Vercel bzw. .env.local).
  // Ohne die Variable reicht das Passwort — so sperrt sich niemand aus, bevor 2FA eingerichtet ist.
  const afterPassword = () => {
    if (!MFA_ON) { setState('ok'); return }
    mfaState().then(m => setState(m.status === 'ok' ? 'ok' : 'mfa')).catch(() => setState('login'))
  }
  useEffect(() => { isStaff().then(ok => (ok ? afterPassword() : setState('login'))).catch(() => setState('login')) }, [])
  const logout = async () => { stopLive(); await signOutStaff(); setState('login') }
  if (state === 'loading') return <div style={{ padding: 40, color: muted }}>Wird geladen…</div>
  if (state === 'login') return <Login onDone={afterPassword} />
  if (state === 'mfa') return <MfaGate onDone={() => setState('ok')} onCancel={logout} />
  return <Dashboard onLogout={logout} />
}

function MfaGate({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [mode, setMode] = useState<{ factorId: string; qr?: string; secret?: string } | null>(null)
  const [code, setCode] = useState(''), [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  useEffect(() => {
    mfaState().then(async m => {
      if (m.status === 'ok') return onDone()
      if (m.status === 'verify') return setMode({ factorId: m.factorId })
      const r = await mfaEnroll()
      if (typeof r === 'string') setErr(r)
      else setMode(r)
    })
  }, [])
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mode) return
    setBusy(true); setErr('')
    const r = await mfaVerify(mode.factorId, code)
    setBusy(false)
    if (r) setErr(r)
    else onDone()
  }
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20, backgroundColor: 'var(--bone)' }}>
      <form onSubmit={submit} style={{ ...card, width: '100%', maxWidth: 380 }}>
        <h1 style={{ fontSize: 20, margin: '0 0 8px' }}>Zwei-Faktor-Anmeldung</h1>
        {mode?.qr ? (
          <>
            <p style={{ ...small, margin: '0 0 12px', lineHeight: 1.6 }}>Einmalig: QR-Code mit Google Authenticator, 1Password oder Microsoft Authenticator scannen und den 6-stelligen Code eingeben.</p>
            <img src={mode.qr} alt="QR-Code für die Authenticator-App" width={180} height={180} style={{ display: 'block', margin: '0 auto 10px' }} />
            <p style={{ ...small, margin: '0 0 14px', wordBreak: 'break-all' }}>Schlüssel zur manuellen Eingabe: <code>{mode.secret}</code></p>
          </>
        ) : (
          <p style={{ ...small, margin: '0 0 14px' }}>Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein.</p>
        )}
        <input value={code} onChange={e => setCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" placeholder="123 456" autoFocus style={{ ...input, fontSize: 18, letterSpacing: '0.2em', textAlign: 'center' }} />
        {err && <p style={{ color: '#D93A3A', fontSize: 13.5, margin: '10px 0 0' }}>{err}</p>}
        <button type="submit" disabled={busy || !mode || code.replace(/\s/g, '').length < 6} className="btn btn-md btn-electric" style={{ width: '100%', marginTop: 14 }}>{busy ? 'Wird geprüft…' : 'Bestätigen'}</button>
        <button type="button" onClick={onCancel} style={{ ...linkBtn, marginTop: 12 }}>Abmelden</button>
      </form>
    </div>
  )
}

function Login({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<'login' | 'forgot' | 'sent'>(() => (new URLSearchParams(window.location.search).has('vergessen') ? 'forgot' : 'login'))
  const [email, setEmail] = useState(''), [pw, setPw] = useState(''), [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr('')
    if (mode === 'forgot') {
      const r = await sendStaffPasswordReset(email)
      setBusy(false)
      if (r) setErr(r); else setMode('sent')
      return
    }
    const r = await signInStaff(email, pw)
    setBusy(false)
    if (r) setErr(r); else onDone()
  }
  const switchTo = (m: 'login' | 'forgot') => { setMode(m); setErr('') }
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bone)', padding: 20 }}>
      <form onSubmit={submit} style={{ ...card, width: '100%', maxWidth: 380, padding: 28, display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}><p style={{ fontWeight: 800, fontSize: 20, margin: 0 }}>RAG<span style={{ color: accent }}>.</span> · Team-Login</p><LangSwitch /></div>
        {mode === 'sent' ? <>
          <p style={{ fontSize: 14, margin: 0, lineHeight: 1.55 }}>Wenn es für diese Adresse ein Team-Konto gibt, haben wir einen Link zum Zurücksetzen geschickt. Schauen Sie auch im Spam-Ordner nach.</p>
          <button type="button" onClick={() => switchTo('login')} style={linkBtn}>← Zurück zur Anmeldung</button>
        </> : <>
          {mode === 'forgot' && <p style={{ ...small, margin: 0 }}>Geben Sie Ihre E-Mail ein — wir schicken einen Link, mit dem Sie ein neues Passwort festlegen.</p>}
          <input style={input} type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" required autoFocus={mode === 'forgot'} />
          {mode === 'login' && <input style={input} type="password" placeholder="Passwort" value={pw} onChange={e => setPw(e.target.value)} autoComplete="current-password" required />}
          {err && <p role="alert" style={{ color: '#B3261E', fontSize: 14, margin: 0 }}>{err}</p>}
          <button className="btn btn-md btn-electric" disabled={busy}>{mode === 'forgot' ? (busy ? 'Wird gesendet…' : 'Link senden') : (busy ? 'Anmeldung…' : 'Anmelden')}</button>
          {mode === 'login'
            ? <button type="button" onClick={() => switchTo('forgot')} style={{ ...linkBtn, fontSize: 13.5, justifySelf: 'start' }}>Passwort vergessen?</button>
            : <button type="button" onClick={() => switchTo('login')} style={{ ...linkBtn, fontSize: 13.5, justifySelf: 'start' }}>← Zurück zur Anmeldung</button>}
        </>}
      </form>
    </div>
  )
}

// Разделы админки — отдельные адреса: работают «назад/вперёд», обновление страницы и ссылки.
type View = 'requests' | 'leads' | 'team' | 'profile'
const VIEW_PATH: Record<View, string> = { requests: '/rag-intern', leads: '/rag-intern/leads', team: '/rag-intern/team', profile: '/rag-intern/profil' }
const viewFromPath = (): View => { const p = window.location.pathname; return /\/profil\/?$/.test(p) ? 'profile' : /\/team\/?$/.test(p) ? 'team' : /\/leads\/?$/.test(p) ? 'leads' : 'requests' }

function NavLink({ to, onGo, style, children }: { to: View; onGo: (v: View) => void; style?: React.CSSProperties; children: React.ReactNode }) {
  return (
    <a href={VIEW_PATH[to]} style={{ ...linkBtn, textDecoration: 'none', ...style }}
      onClick={e => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); onGo(to) }}>
      {children}
    </a>
  )
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [data, setData] = useState<{ requests: Request[]; profiles: Profile[] } | null>(null)
  const [queue, setQueue] = useState<Queue>('mine')
  const [me, setMe] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<string | null>(() => new URLSearchParams(window.location.search).get('r'))
  const [view, setView] = useState<View>(viewFromPath)
  const go = (v: View, keepSel = true) => {
    if (!keepSel) setSel(null)
    const r = v === 'requests' && keepSel && sel ? `?r=${encodeURIComponent(sel)}` : ''
    history.pushState(null, '', VIEW_PATH[v] + r)
    setView(v); window.scrollTo(0, 0)
  }
  useEffect(() => {
    const onPop = () => { setView(viewFromPath()); setSel(new URLSearchParams(window.location.search).get('r')) }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  const [admin, setAdmin] = useState<boolean | null>(null)
  const reload = () => { loadAll().then(setData) }
  useEffect(() => { reload(); isAdmin().then(setAdmin); myId().then(setMe) }, [])
  // Новые заявки, смена статуса/ответственного, правки профилей — сразу, без кнопки «Обновить».
  useLive(c => c.table === 'leads' || c.table === 'orders' || c.table === 'checks' || c.table === 'profiles' || c.table === 'messages' || c.table === 'projects', reload)
  useEffect(() => {
    if (view !== 'requests') return
    const sp = new URLSearchParams(window.location.search)
    if (sel) sp.set('r', sel); else sp.delete('r')
    const qs = sp.toString()
    history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : ''))
  }, [sel, view])
  const list = useMemo(() => {
    if (!data) return []
    const needle = q.trim().toLowerCase()
    const due = (r: Request) => !!r.next && r.next <= today() && OPEN.includes(r.stage)
    const rank = (r: Request) => ((r.unanswered ?? 0) > 0 ? 0 : due(r) || r.reportDue ? 1 : r.stage === 'new' ? 2 : 3)
    return data.requests
      .filter(r => inQueue(r, queue, me) && (!needle || `${r.title} ${r.sub} ${profileOf(data.profiles, r.userId)?.email ?? ''} ${profileOf(data.profiles, r.userId)?.name ?? ''}`.toLowerCase().includes(needle)))
      .sort((a, b) => rank(a) - rank(b) || b.created_at.localeCompare(a.created_at))
  }, [data, queue, q, me])
  const count = (k: Queue) => (data ? data.requests.filter(r => inQueue(r, k, me)).length : 0)
  const open = (key: string) => { history.pushState(null, '', `${VIEW_PATH.requests}?r=${encodeURIComponent(key)}`); setSel(key); window.scrollTo(0, 0) }
  const back = () => { history.pushState(null, '', VIEW_PATH.requests); setSel(null) }
  const current = data?.requests.find(r => `${r.kind}:${r.id}` === sel) ?? null
  const patch = (r: Request, p: Partial<Request>) => setData(d => d && { ...d, requests: d.requests.map(x => (x.kind === r.kind && x.id === r.id ? { ...x, ...p } : x)) })

  const urgent = URGENT.filter(([k]) => count(k) > 0)
  const navLink = (on: boolean): React.CSSProperties => ({ fontWeight: 600, color: on ? accent : muted, backgroundColor: on ? 'var(--brand-soft)' : 'transparent', padding: '8px 12px', borderRadius: 10 })
  const QueueBtn = ({ k, label, tone }: { k: Queue; label: string; tone?: string }) => {
    const n = count(k), on = queue === k
    return (
      <button type="button" onClick={() => setQueue(k)}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', minHeight: 40, padding: '8px 12px', borderRadius: 10, border: 0, cursor: 'pointer', font: 'inherit', fontSize: 14, textAlign: 'left',
          backgroundColor: on ? accent : 'transparent', color: on ? '#fff' : n === 0 ? '#8A8AA0' : ink }}>
        {label}
        <span style={{ fontSize: 12.5, fontWeight: 700, minWidth: 22, textAlign: 'center', padding: '2px 7px', borderRadius: 999,
          backgroundColor: on ? 'rgba(255,255,255,0.22)' : tone && n ? tone : n ? '#EFEEF8' : 'transparent', color: on || (tone && n) ? '#fff' : n ? muted : '#8A8AA0' }}>{n}</span>
      </button>
    )
  }
  const group = (title: string, items: [Queue, string][], opts: { tone?: (k: Queue) => string; danger?: boolean } = {}) => (
    <section style={{ ...card, padding: 10, borderColor: opts.danger ? '#F2C9C3' : line }}>
      <p style={{ margin: '2px 4px 6px', fontSize: 11.5, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: opts.danger ? '#B3261E' : muted }}>{title}</p>
      {items.map(([k, l]) => <QueueBtn key={k} k={k} label={l} tone={opts.tone?.(k)} />)}
    </section>
  )
  const label = [...SHOW, ...URGENT, ...ACTION].find(([k]) => k === queue)?.[1] ?? ''

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bone)', color: ink }}>
      <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 24px', borderBottom: `1px solid ${line}`, backgroundColor: '#fff', position: 'sticky', top: 0, zIndex: 5 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
          <NavLink to="requests" onGo={v => { go(v, false) }} style={{ fontWeight: 800, fontSize: 19, color: ink }}>RAG<span style={{ color: accent }}>.</span></NavLink>
          <nav style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <NavLink to="requests" onGo={v => go(v, false)} style={navLink(view === 'requests')}>Anfragen</NavLink>
            <NavLink to="leads" onGo={go} style={navLink(view === 'leads')}>Leads</NavLink>
            {admin && <NavLink to="team" onGo={go} style={navLink(view === 'team')}>Team</NavLink>}
          </nav>
        </span>
        <span style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <LangSwitch />
          <LiveBadge />
          <NavLink to="profile" onGo={go} style={view === 'profile' ? { fontWeight: 700 } : undefined}>Mein Profil</NavLink>
          <button type="button" onClick={onLogout} style={{ ...linkBtn, color: ink }}>Abmelden</button>
        </span>
      </header>
      {view === 'leads' ? <Leads onOpenRequest={key => { history.pushState(null, '', `${VIEW_PATH.requests}?r=${encodeURIComponent(key)}`); setView('requests'); setSel(key) }} /> : view === 'profile' ? <MyProfile /> : view === 'team' ? (admin ? <Team /> : <p style={{ padding: 20, color: muted }}>{admin === null ? 'Wird geladen…' : 'Nur für Admins.'}</p>)
        : sel ? (current && data
          ? <Detail key={sel} r={current} all={data.requests} profiles={data.profiles} me={me} onSelect={open} onBack={back} onPatch={p => patch(current, p)} />
          : <p style={{ padding: 24, color: muted }}>{data ? 'Anfrage nicht gefunden.' : 'Wird geladen…'} <button type="button" onClick={back} style={linkBtn}>← Alle Anfragen</button></p>)
        : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, padding: 20, alignItems: 'flex-start' }}>
          <aside style={{ flex: '1 1 260px', maxWidth: 300, display: 'grid', gap: 14 }}>
            <input style={input} type="search" placeholder="Suche: Name, Unternehmen, E-Mail" value={q} onChange={e => setQ(e.target.value)} aria-label="Suche" />
            {urgent.length > 0 && group('Dringend', urgent, { danger: true, tone: k => (k === 'today' ? '#B3261E' : '#B25A00') })}
            {group('Anzeigen', SHOW)}
            {group('Wartet auf Aktion', ACTION)}
          </aside>
          <main style={{ flex: '999 1 640px', minWidth: 0, display: 'grid', gap: 12 }}>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>{label} <span style={{ color: muted, fontWeight: 600 }}>· {list.length}</span></h1>
            <div style={{ ...card, padding: 0, overflowX: 'auto' }}>
              <div style={{ minWidth: 860 }}>
                <div className="adm-row" style={{ fontSize: 11.5, fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <span>Typ</span><span>Unternehmen</span><span>Status</span><span>Nächster Kontakt</span><span>Verantwortlich</span><span>Nachrichten</span>
                </div>
                {!data && <p style={{ padding: 16, color: muted, margin: 0 }}>Wird geladen…</p>}
                {data && list.length === 0 && <p style={{ padding: 16, color: muted, margin: 0 }}>Hier ist gerade nichts.</p>}
                {list.map(r => {
                  const key = `${r.kind}:${r.id}`
                  const due = !!r.next && r.next <= today() && OPEN.includes(r.stage)
                  const n = r.unanswered ?? 0
                  return (
                    <button key={key} type="button" className="adm-row" onClick={() => open(key)}
                      style={{ width: '100%', textAlign: 'left', border: 0, borderTop: `1px solid ${line}`, backgroundColor: n ? '#FBFAFF' : '#fff', cursor: 'pointer', font: 'inherit', fontSize: 14, color: ink }}>
                      <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 999, backgroundColor: KIND[r.kind][1], justifySelf: 'start' }}>{KIND[r.kind][0]}</span>
                      <span style={{ minWidth: 0 }}><strong style={{ display: 'block' }}>{r.title}</strong><span style={small}>{r.sub}</span>{r.reportDue && <span style={{ ...small, display: 'block', color: '#B3261E', fontWeight: 700 }}>Monatsbericht fällig</span>}</span>
                      <span style={{ fontWeight: 600, color: STAGE_COLOR[r.stage] ?? ink }}>{stageLabel(r.stage)}</span>
                      <span style={{ fontWeight: due ? 700 : 400, color: due ? '#B3261E' : r.next ? ink : muted }}>{r.next ? (due ? 'heute' : fmtDay(r.next)) : '—'}</span>
                      <span style={{ color: r.assignee ? ink : '#B25A00' }}>{r.assignee ? (r.assignee === me ? 'Sie selbst' : staffName(data?.profiles ?? [], r.assignee)) : 'frei'}</span>
                      <span>{n > 0
                        ? <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center', color: accent, fontWeight: 800, fontSize: 13 }} title="Ungelesene Nachrichten des Kunden"><ChatIcon />{n}</span>
                        : <span style={small}>—</span>}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            <p style={{ ...small, margin: 0 }}>Oben: ungelesene Nachrichten von Kunden, dann «heute kontaktieren», dann neue.</p>
          </main>
        </div>
      )}
      <style>{'.btn:disabled{opacity:.45;cursor:not-allowed}.adm-row{display:grid;grid-template-columns:96px minmax(0,2fr) minmax(0,1.2fr) 110px 150px 70px;gap:12px;align-items:center;padding:13px 18px}'}</style>
    </div>
  )
}

const fmtDay = (d: string) => { const [y, m, dd] = d.split('-'); return y && m && dd ? `${dd}.${m}.` : d }
function ChatIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" /></svg>
}

const TABLE_OF: Record<Kind, string> = { lead: 'leads', order: 'orders', check: 'checks' }

function LiveBadge() {
  const st = useLiveStatus()
  const [color, label, hint] = st === 'live'
    ? ['#1F9D55', 'Live', 'Änderungen erscheinen automatisch']
    : st === 'offline'
      ? ['#B26B00', 'Offline', 'Keine Live-Verbindung — Daten werden alle 30 Sekunden neu geladen']
      : ['#9A9AA5', 'Verbinde…', 'Live-Verbindung wird aufgebaut']
  return (
    <span title={hint} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: muted }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color, boxShadow: st === 'live' ? `0 0 0 3px ${color}22` : 'none' }} />
      {label}
    </span>
  )
}

function Detail({ r, all, profiles, me, onSelect, onBack, onPatch }: { r: Request; all: Request[]; profiles: Profile[]; me: string | null; onSelect: (k: string) => void; onBack: () => void; onPatch: (p: Partial<Request>) => void }) {
  const staff = profiles.filter(p => p.role === 'admin' || p.role === 'manager')
  const prof = profileOf(profiles, r.userId)
  const related = all.filter(x => x.clientKey === r.clientKey && !(x.kind === r.kind && x.id === r.id))
  const [client, setClient] = useState<Awaited<ReturnType<typeof loadClient>> | null>(null)
  const reloadClient = () => { loadClient(r.clientKey, r.userId, r.kind, r.id).then(setClient) }
  useEffect(() => { setClient(null); reloadClient() }, [r.clientKey, r.kind, r.id]) // eslint-disable-line react-hooks/exhaustive-deps
  // Чат, заметки, история, оффер, встречи, проект, версии отчёта этого клиента — вживую.
  useLive(({ table, row }) => {
    if (Object.keys(row).length <= 1) return true // DELETE: Realtime отдаёт только id — перечитываем на всякий случай
    if (table === TABLE_OF[r.kind] && row.id === r.id) return true
    return row.client_key === r.clientKey || (!!r.userId && row.user_id === r.userId) || row.request_id === r.id || row.check_id === r.id
  }, reloadClient)

  // Erster Statuswechsel an einer freien Anfrage → sie gehört dem, der ihn macht (Trigger in der DB).
  const changeStage = async (s: Stage) => { if (await setStage(r.kind, r.id, s)) { onPatch({ stage: s, assignee: r.assignee ?? await getAssignee(r.kind, r.id) }); reloadClient() } }
  const changeAssignee = async (uid: string | null) => { if (await setAssignee(r.kind, r.id, uid)) { onPatch({ assignee: uid }); reloadClient() } }
  const changeNext = async (d: string) => { if (await setNextContact(r.kind, r.id, d)) onPatch({ next: d || null }) }

  // Та же компания в других местах: лид (письмо) и проверки других клиентов.
  const placeId = r.kind === 'check' ? (r.row as Check).place_id : null
  const samePlace = placeId ? all.filter(x => x.kind === 'check' && x.id !== r.id && (x.row as Check).place_id === placeId) : []
  const [lead, setLead] = useState<Prospect | null>(null)
  useEffect(() => { setLead(null); if (placeId && !placeId.startsWith('manual:')) prospectByPlace(placeId).then(setLead).catch(() => {}) }, [placeId])
  const fromLead = r.kind === 'check' && !!(r.row as Check).from_prospect
  type Tab = 'reports' | 'offer' | 'appointments' | 'project'
  const [tab, setTab] = useState<Tab | null>(null)
  const [panel, setPanel] = useState<'' | 'chat' | 'notes' | 'history' | 'client'>('')
  const closePanel = useCallback(() => setPanel(''), [])
  // «Start bei null»: zuerst Termin und Angebot, Bericht nur bei Bedarf.
  const scratch = r.kind === 'check' && !!(r.row as Check).scratch
  const tabs: [Tab, string][] = [
    ...(client?.project ? [['project', 'Projekt'] as [Tab, string]] : []),
    ...(scratch ? [['appointments', 'Termine'], ['offer', 'Angebot'], ['reports', 'Berichte']] as [Tab, string][]
      : [...(r.kind === 'check' ? [['reports', 'Berichte'] as [Tab, string]] : []), ['offer', 'Angebot'], ['appointments', 'Termine']] as [Tab, string][]),
  ]
  const active: Tab = tab && tabs.some(([k]) => k === tab) ? tab : tabs[0][0]
  // Сообщения клиента после последнего ответа команды.
  const msgs = client?.messages ?? []
  const hasRead = msgs.some(m => 'read_at' in m)
  let waiting = 0
  if (hasRead) waiting = msgs.filter(m => m.author !== 'rag' && !m.read_at).length
  else for (let x = msgs.length - 1; x >= 0 && msgs[x].author !== 'rag'; x--) waiting++
  // Переписка открыта → сообщения клиента прочитаны.
  useEffect(() => {
    if (panel === 'chat' && r.userId && hasRead && waiting > 0) void markMessagesRead(r.userId).then(ok => { if (ok) setClient(c => c && { ...c, messages: c.messages.map(m => (m.author !== 'rag' && !m.read_at ? { ...m, read_at: new Date().toISOString() } : m)) }) })
  }, [panel, waiting]) // eslint-disable-line react-hooks/exhaustive-deps
  const sideBtn = (key: typeof panel, text: string, icon: React.ReactNode, badge?: number, hot?: boolean) => (
    <button type="button" onClick={() => setPanel(key)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 44, padding: '0 14px', borderRadius: 12, border: `1px solid ${hot ? accent : '#D6D5E3'}`, backgroundColor: hot ? 'var(--brand-soft)' : '#fff', font: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: ink }}>
      {icon}{text}
      {!!badge && <span style={{ minWidth: 20, height: 20, padding: '0 6px', boxSizing: 'border-box', borderRadius: 999, backgroundColor: hot ? accent : '#EFEEF8', color: hot ? '#fff' : muted, fontSize: 12, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{badge}</span>}
    </button>
  )
  const ic = (d: string) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>

  return (
    <div style={{ maxWidth: 1360, margin: '0 auto', padding: '18px 24px 48px', display: 'grid', gap: 16 }}>
      <button type="button" onClick={onBack} style={{ ...linkBtn, justifySelf: 'start', fontWeight: 600 }}>← Alle Anfragen</button>
      <section style={{ ...card, padding: '20px 24px', display: 'grid', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 999, backgroundColor: KIND[r.kind][1], justifySelf: 'start' }}>{KIND[r.kind][0]}</span>
            <h1 style={{ fontSize: 28, margin: 0, lineHeight: 1.2 }}>{r.title}</h1>
            <p style={{ ...small, margin: 0 }}>{r.sub} · erstellt {fmt(r.created_at)}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {sideBtn('chat', 'Nachrichten', ic('M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z'), waiting || undefined, waiting > 0)}
            {sideBtn('notes', 'Notizen', ic('M4 4h12l4 4v12H4zM8 12h8M8 16h5'), client?.notes.length || undefined)}
            {sideBtn('history', 'Verlauf', ic('M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2'))}
            {sideBtn('client', 'Kunde', ic('M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 21c1.5-4 4.5-6 8-6s6.5 2 8 6'))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ ...small, display: 'grid', gap: 4 }}>Status
            <select value={r.stage} onChange={e => changeStage(e.target.value as Stage)} style={{ ...input, width: 230 }}>
              {STAGES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </label>
          <label style={{ ...small, display: 'grid', gap: 4 }}>Nächster Kontakt
            <input type="date" value={r.next ?? ''} onChange={e => changeNext(e.target.value)} style={{ ...input, width: 180 }} />
          </label>
          <label style={{ ...small, display: 'grid', gap: 4 }}>Verantwortlich
            <select value={r.assignee ?? ''} onChange={e => changeAssignee(e.target.value || null)} style={{ ...input, width: 220 }}>
              <option value="">— frei —</option>
              {staff.map(p => <option key={p.id} value={p.id}>{p.id === me ? `Ich (${p.name || p.email})` : p.name || p.email}</option>)}
            </select>
          </label>
          {me && r.assignee !== me && <button type="button" className="btn btn-sm btn-outline-light" onClick={() => changeAssignee(me)}>Übernehmen</button>}
        </div>
        {r.assignee && r.assignee !== me && <p style={{ ...small, margin: 0, color: '#B26B00' }}>Die Anfrage betreut {staffName(profiles, r.assignee)}.</p>}
        {(lead || samePlace.length > 0) && (
          <div style={{ display: 'grid', gap: 4, padding: '10px 14px', borderRadius: 12, backgroundColor: '#F2FAF5', border: '1px solid #CDEBD8', fontSize: 13.5 }}>
            {lead && (
              <span>
                <strong>War ein Lead</strong>{lead.printed_at ? <> · Brief gedruckt {new Date(lead.printed_at).toLocaleDateString('ru-RU')}</> : ' · noch kein Brief gedruckt'}
                {' · Code '}<span data-no-translate>{lead.code}</span>{lead.score !== null ? <> · Kurzanalyse {lead.score}/100</> : null}
                {fromLead && <> · Analyse aus dem Lead übernommen — keine neuen Google-Abfragen</>}
              </span>
            )}
            {!lead && r.kind === 'check' && (r.row as Check).from_check && <span>Analyse aus einer anderen Prüfung dieses Unternehmens übernommen — keine neuen Google-Abfragen</span>}
            {samePlace.length > 0 && (
              <span>Dieses Unternehmen hat noch {samePlace.length === 1 ? 'eine weitere Prüfung' : `${samePlace.length} weitere Prüfungen`}:{' '}
                {samePlace.map(x => <button key={x.id} type="button" onClick={() => onSelect(`check:${x.id}`)} style={{ ...linkBtn, fontSize: 13.5, marginRight: 10 }}>{(x.row as Check).email ?? x.title} · {fmt(x.created_at)}</button>)}
              </span>
            )}
          </div>
        )}
        {related.length > 0 && (
          <p style={{ ...small, margin: 0 }}>Weitere Anfragen des Kunden:{' '}
            {related.map(x => <button key={x.kind + x.id} type="button" onClick={() => onSelect(`${x.kind}:${x.id}`)} style={{ ...linkBtn, fontSize: 12.5, marginRight: 10 }}>{KIND[x.kind][0]} · {x.title}</button>)}
          </p>
        )}
        <nav style={{ display: 'flex', gap: 28, borderBottom: `1px solid ${line}`, flexWrap: 'wrap' }}>
          {tabs.map(([k, l]) => (
            <button key={k} type="button" onClick={() => setTab(k)}
              style={{ ...linkBtn, padding: '12px 2px', fontSize: 15, fontWeight: 700, color: active === k ? accent : muted, borderBottom: `3px solid ${active === k ? accent : 'transparent'}`, borderRadius: 0 }}>{l}</button>
          ))}
        </nav>
        {!client && <p style={{ color: muted, margin: 0 }}>Wird geladen…</p>}
        {client && active === 'project' && client.project && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 16, alignItems: 'start' }}>
            <InvoiceCard key={'inv' + client.project.id + client.project.status} project={client.project} offer={client.offer} onSaved={reloadClient} />
            <WorkCard key={'work' + client.project.id} project={client.project} versions={client.versions} onSaved={reloadClient}
              onGoToReport={r.kind === 'check' ? () => setTab('reports') : undefined} />
            <PlanCard key={'plan' + client.project.id} project={client.project} monthlyItems={(client.offer?.items ?? []).some(i => i.unit === 'pro Monat')} onSaved={reloadClient} />
          </div>
        )}
        {client && active === 'reports' && r.kind === 'check' && (
          <ReportEditor c={r.row as Check} onPublished={async report => { const assignee = r.assignee ?? await getAssignee(r.kind, r.id); onPatch({ assignee, row: { ...(r.row as Check), status: 'ready', report, assignee_id: assignee } }); reloadClient() }} />
        )}
        {client && active === 'offer' && <OfferCard key={r.kind + r.id} clientKey={r.clientKey} userId={r.userId} kind={r.kind} requestId={r.id} title={r.title} initial={client.offer} preset={r.kind === 'order' ? (r.row as Order).items ?? [] : r.kind === 'check' ? (r.row as Check).wish ?? [] : []} onSaved={reloadClient} />}
        {client && active === 'appointments' && <AppointmentsCard r={r} list={client.appointments} onChanged={async added => {
          if (added && ['new', 'contacted', 'report_sent'].includes(r.stage)) await changeStage('call_booked'); else reloadClient()
        }} />}
      </section>

      {panel && (
        <SidePanel title={panel === 'chat' ? 'Nachrichten mit dem Kunden' : panel === 'notes' ? 'Notizen (für den Kunden unsichtbar)' : panel === 'history' ? 'Verlauf' : 'Kunde und Unternehmen'} onClose={closePanel}>
          {panel === 'client' && <ClientCard r={r} prof={prof} />}
          {panel === 'chat' && client && <Chat userId={r.userId} messages={client.messages} onSent={m => setClient(c => c && { ...c, messages: [...c.messages, m] })} />}
          {panel === 'notes' && client && <Notes clientKey={r.clientKey} notes={client.notes} onAdded={() => reloadClient()} />}
          {panel === 'history' && client && <History items={client.activity} profiles={profiles} current={`${r.kind}:${r.id}`} />}
        </SidePanel>
      )}
    </div>
  )
}

/** Боковая панель поверх карточки: переписка, заметки, история, данные клиента. */
function SidePanel({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div role="dialog" aria-modal="true" aria-label={title} onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 40, backgroundColor: 'rgba(11,11,26,0.28)' }}>
      <div className="adm-panel" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 480, maxWidth: '100%', backgroundColor: 'var(--bone)', boxShadow: '-12px 0 40px rgba(11,11,26,0.18)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', backgroundColor: '#fff', borderBottom: `1px solid ${line}` }}>
          <strong style={{ fontSize: 17 }}>{title}</strong>
          <button type="button" onClick={onClose} aria-label="Schließen" style={{ ...linkBtn, color: muted, fontSize: 24, width: 44, height: 44 }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>{children}</div>
      </div>
    </div>
  )
}

function Rows({ rows }: { rows: [string, React.ReactNode][] }) {
  const shown = rows.filter(([, v]) => v !== null && v !== undefined && v !== '')
  return (
    <dl style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '6px 12px', fontSize: 14, margin: 0 }}>
      {shown.map(([k, v]) => [
        <dt key={k + ':k'} style={{ color: muted }}>{k}</dt>,
        <dd key={k + ':v'} style={{ margin: 0, overflowWrap: 'anywhere' }}>{v}</dd>,
      ])}
    </dl>
  )
}

const QUIZ_LABELS: Record<string, string> = {
  profile: 'Google-Profil', website: 'Website', social: 'Social Media', none: 'Nichts', referral: 'Empfehlungen', google: 'Google', portals: 'Portale', unknown: 'Weiß nicht',
  calls: 'Mehr Anrufe', service: 'Kunden für die Leistung', region: 'Neue Stadt / neuer Bezirk', trust: 'Seriöser als die Konkurrenz',
  few: 'bis 5', some: '5–15', many: 'mehr als 15',
}
const ql = (v: unknown) => (Array.isArray(v) ? v : v ? [v] : []).map(x => QUIZ_LABELS[String(x)] ?? String(x)).join(', ')
const str = (v: unknown) => (v === null || v === undefined ? '' : String(v))

function ClientCard({ r, prof }: { r: Request; prof?: Profile }) {
  const rows: [string, React.ReactNode][] = [
    ['Name', prof?.name], ['E-mail', prof?.email ? <a href={`mailto:${prof.email}`}>{prof.email}</a> : null],
    ['Telefon', prof?.phone ? <a href={`tel:${prof.phone}`}>{prof.phone}</a> : null],
  ]
  if (r.kind === 'lead') {
    const l = r.row as Lead, a = l.answers as Record<string, unknown>
    const le = str((l as Lead & { email?: string }).email || a.email)
    rows.push(['E-Mail (Quiz)', le ? <a href={`mailto:${le}`}>{le}</a> : ''], ['Unternehmen', str(a.firma)], ['Branche', str(a.branche)], ['Stadt', str(a.ort)], ['Was vorhanden ist', ql(a.have)],
      ['Woher die Kunden kommen', ql(a.sources)], ['Ziel', ql(a.goal)], ['Weitere Aufträge/Monat', ql(a.capacity)], ['Quiz-Empfehlungen', (l.recommendations ?? []).join('; ')],
      ['Herkunft', l.from_page], ['Terminbuchung', l.booking_clicked_at ? `hat «Termin wählen» geklickt ${fmt(l.booking_clicked_at)}` : 'nicht geklickt'])
    if (!prof) rows.push(['Konto', 'nein — Kontakt steht in der Google-Calendar-Buchung'])
  }
  if (r.kind === 'order') {
    const o = r.row as Order, d = (o.details ?? {}) as Record<string, unknown>
    rows.push(['Paket', (o.items ?? []).map(i => `${i.name} — ${i.price} € ${i.unit === 'einmalig' ? 'einmalig' : '/Monat'}`).join('; ')],
      ['Unternehmen', str(d.company)], ['Branche', str(d.industry)], ['Stadt', str(d.city)], ['Website', str(d.website)],
      ['Ziele', Array.isArray(d.goals) ? d.goals.join(', ') : ''], ['Was nicht passt', str(d.problem)], ['Wann anrufen', str(d.reach)],
      ['Telefon (Fragebogen)', str(d.phone)], ['Herkunft', o.source_page])
    if (!o.details) rows.push(['Fragebogen', 'Kunde hat noch nicht ausgefüllt'])
  }
  if (r.kind === 'check') {
    const c = r.row as Check, p = c.place as Record<string, unknown>
    rows.push(['Unternehmen', str(p.name)], ['Adresse', str(p.address)], ['Branche', str(p.category)],
      ['Google', p.manual ? 'kein Profil (Angaben selbst eingegeben)' : `${p.rating ?? '—'} ★ · ${p.reviews ?? 0} Bewertungen`],
      ['Karte', p.mapsUrl ? <a href={String(p.mapsUrl)} target="_blank" rel="noreferrer">in Google Maps öffnen</a> : null],
      ['Website', str(p.website)], ['Profile', (c.sources ?? []).filter(s => s.value).map(s => `${s.key}: ${s.value}`).join(', ')],
      ['Check', checkState(c)], ['Herkunft', c.source_page])
    if (p.manual) rows.push(['Google-Profil laut Kunde', ({ yes: 'ja — wird bei der Analyse gesucht', no: 'nein', unknown: 'weiß nicht — wird bei der Analyse gesucht' } as Record<string, string>)[str(c.profile_hint)] ?? ''])
    if (c.wish?.length) rows.push(['Kunde wünscht', c.wish.map(i => `${i.name} — ${i.price} € ${i.unit === 'einmalig' ? 'einmalig' : '/Monat'}`).join('; ')])
    const a = (c.quiz ?? null) as Record<string, unknown> | null
    if (a) rows.push(['Was vorhanden ist (Quiz)', ql(a.have)], ['Woher die Kunden kommen', ql(a.sources)], ['Ziel', ql(a.goal)])
  }
  return <section style={card}><h3 style={h3}>Kunde und Unternehmen</h3><Rows rows={rows} /></section>
}


function OfferCard({ clientKey, userId, kind, requestId, title, initial, preset, onSaved }: { clientKey: string; userId: string | null; kind: Kind; requestId: string; title: string; initial: Offer | null; preset: OfferItem[]; onSaved: () => void }) {
  const [items, setItems] = useState<OfferItem[]>(initial?.items ?? preset)
  const [note, setNote] = useState(initial?.note ?? '')
  const [status, setStatus] = useState<Offer['status']>(initial?.status ?? 'draft')
  const [msg, setMsg] = useState('')
  const save = async (next: Offer['status']) => {
    const r = await saveOffer({ client_key: clientKey, user_id: userId, request_kind: kind, request_id: requestId, items, note: note || null, status: next })
    if (r) { setStatus(r.status); setMsg(next === 'sent' ? 'Gesendet — der Kunde kann das Angebot im Kundenbereich annehmen.' : 'Gespeichert.'); onSaved() } else setMsg('Speichern fehlgeschlagen.')
  }
  if (status === 'accepted') return (
    <section style={card}>
      <h3 style={h3}>Angebot <span style={{ color: '#1F7A4A' }}>· angenommen</span></h3>
      <p style={{ ...small, margin: '-6px 0 10px' }}>Für <strong style={{ color: ink }}>{title}</strong>. Vom Kunden angenommen — nicht mehr änderbar. Weitere Leistungen: neue Anfrage bzw. neues Angebot.</p>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 4 }}>
        {items.map(i => <li key={i.id} style={{ display: 'flex', gap: 8, fontSize: 14 }}><span style={{ flex: 1 }}>{i.name}</span><span>{i.price} € {i.unit === 'einmalig' ? 'einmalig' : '/Monat'}</span></li>)}
      </ul>
      <p style={{ fontSize: 15, fontWeight: 700, margin: '10px 0 0' }}>Summe: {totals(items)}</p>
      {note && <p style={{ ...small, marginTop: 6 }} data-no-translate>{note}</p>}
    </section>
  )
  return (
    <section style={card}>
      <h3 style={h3}>Angebot {status !== 'draft' && <span style={{ color: '#1F7A4A' }}>· gesendet</span>}</h3>
      <p style={{ ...small, margin: '-6px 0 12px' }}>Nur für diese Anfrage: <strong style={{ color: ink }}>{title}</strong>.{kind === 'check' ? ' Wird auch mit dem Bericht (Schritt 4) zusammengestellt — dieselben Positionen.' : ''}</p>
      <OfferBuilder items={items} onChange={setItems} />
      <textarea style={{ ...input, minHeight: 60, marginTop: 10 }} placeholder="Kommentar zum Angebot (für den Kunden, Deutsch)" value={note} onChange={e => setNote(e.target.value)} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10, alignItems: 'center' }}>
        <button type="button" className="btn btn-sm btn-outline-light" onClick={() => save(status === 'sent' ? 'sent' : 'draft')}>{status === 'sent' ? 'Änderungen speichern' : 'Entwurf speichern'}</button>
        {status !== 'sent' && <button type="button" className="btn btn-sm btn-electric" onClick={() => save('sent')} disabled={!items.length}>An den Kunden senden</button>}
        {msg && <span style={small}>{msg}</span>}
      </div>
    </section>
  )
}

// ── Nach angenommenem Angebot: zwei getrennte Blöcke ─────────────────────────
// «Rechnung»: nur Rechnung und Zahlung (Wartet auf Zahlung → Bezahlt).
// «Umsetzung»: erst nach der Zahlung — Arbeit beginnen → neuen Bericht veröffentlichen → Ergebnis freigeben.
// «Ergebnis» heißt: Der Kunde sieht im Kundenbereich (Tab «Ergebnis») den Vergleich seines ersten Berichts
// mit dem neuesten. Verschickt wird nichts — die Freigabe schaltet nur diesen Tab frei.
const stepDot = (state: 'done' | 'now' | 'todo') => ({
  width: 24, height: 24, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
  color: state === 'done' ? '#fff' : state === 'now' ? accent : muted,
  backgroundColor: state === 'done' ? '#1F7A4A' : state === 'now' ? '#EEEBFF' : '#F1F1F4',
} as React.CSSProperties)

function InvoiceCard({ project, offer, onSaved }: { project: Project; offer: Offer | null; onSaved: () => void }) {
  const once = (offer?.items ?? []).filter(i => i.unit === 'einmalig').reduce((a, i) => a + i.price, 0)
  const monthly = (offer?.items ?? []).filter(i => i.unit !== 'einmalig').reduce((a, i) => a + i.price, 0)
  const paid = project.status !== 'awaiting_payment'
  const sent = !!project.invoice_sent_at
  const [edit, setEdit] = useState(!paid)
  const [f, setF] = useState({
    invoice_number: project.invoice_number ?? '',
    invoice_amount: project.invoice_amount != null ? String(project.invoice_amount) : String(once + monthly || ''),
    invoice_due: project.invoice_due ?? '',
    invoice_url: project.invoice_url ?? '',
  })
  const [msg, setMsg] = useState(''), [busy, setBusy] = useState(false)
  const urlOk = !f.invoice_url || /^https:\/\//.test(f.invoice_url)
  const ready = !!f.invoice_number.trim() && Number(f.invoice_amount) > 0 && urlOk
  const save = async (extra: Partial<Project> = {}, done = 'Gespeichert.') => {
    if (!urlOk) { setMsg('Links müssen mit https:// beginnen'); return }
    setBusy(true)
    const r = await saveProject(project.id, {
      invoice_number: f.invoice_number.trim() || null,
      invoice_amount: f.invoice_amount ? Number(f.invoice_amount) : null,
      invoice_due: f.invoice_due || null,
      invoice_url: f.invoice_url.trim() || null,
      ...extra,
    })
    setBusy(false)
    if (r) { setMsg(done); onSaved() } else setMsg('Speichern fehlgeschlagen.')
  }

  if (paid && !edit) {
    return (
      <section style={card}>
        <h3 style={h3}>Rechnung</h3>
        <p style={{ fontSize: 14.5, margin: 0, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={stepDot('done')}>✓</span>
          <span><strong>Bezahlt</strong>{project.paid_at ? ` ${fmt(project.paid_at)}` : ''} · {project.invoice_number || '—'} · {project.invoice_amount != null ? `${project.invoice_amount} €` : '—'}</span>
          <button type="button" style={{ ...linkBtn, fontSize: 13 }} onClick={() => setEdit(true)}>Ändern</button>
        </p>
      </section>
    )
  }

  return (
    <section style={card}>
      <h3 style={h3}>Rechnung</h3>
      <ol style={{ listStyle: 'none', margin: '0 0 14px', padding: 0, display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 14 }}>
        <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={stepDot(sent ? 'done' : 'now')}>{sent ? '✓' : '1'}</span>An den Kunden senden</li>
        <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={stepDot(paid ? 'done' : sent ? 'now' : 'todo')}>{paid ? '✓' : '2'}</span>Zahlung erhalten</li>
      </ol>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <label style={{ ...small, display: 'grid', gap: 3 }}>Rechnungsnummer<input style={input} value={f.invoice_number} onChange={e => setF({ ...f, invoice_number: e.target.value })} placeholder="RE-2026-001" /></label>
        <label style={{ ...small, display: 'grid', gap: 3 }}>Betrag, €<input style={input} type="number" value={f.invoice_amount} onChange={e => setF({ ...f, invoice_amount: e.target.value })} /></label>
        <label style={{ ...small, display: 'grid', gap: 3 }}>Zahlbar bis<input style={input} type="date" value={f.invoice_due} onChange={e => setF({ ...f, invoice_due: e.target.value })} /></label>
        <label style={{ ...small, display: 'grid', gap: 3 }}>Link zur Rechnung (PDF, optional)<input style={input} placeholder="https://…" value={f.invoice_url} onChange={e => setF({ ...f, invoice_url: e.target.value })} /></label>
      </div>
      <p style={{ ...small, margin: '8px 0 0' }}>Laut Angebot: {once ? `${once} € einmalig` : ''}{once && monthly ? ' + ' : ''}{monthly ? `${monthly} € pro Monat` : ''}{!once && !monthly ? '—' : ''}. Der Kunde sieht Betrag, Bankverbindung und Verwendungszweck in seinem Kundenbereich.</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12, alignItems: 'center' }}>
        {!sent && <button type="button" className="btn btn-sm btn-electric" disabled={busy || !ready} onClick={() => save({ invoice_sent_at: new Date().toISOString() }, 'Der Kunde sieht die Rechnung jetzt im Kundenbereich.')}>Rechnung an den Kunden senden</button>}
        {sent && !paid && <button type="button" className="btn btn-sm btn-electric" disabled={busy} onClick={() => save({ status: 'paid' }, 'Als bezahlt markiert.')}>Zahlung erhalten</button>}
        <button type="button" className="btn btn-sm btn-outline-light" disabled={busy} onClick={async () => { await save(); if (paid) setEdit(false) }}>Speichern</button>
        {msg && <span style={small}>{msg}</span>}
      </div>
      {!sent && !ready && <p style={{ ...small, margin: '8px 0 0' }}>Zum Senden: Rechnungsnummer und Betrag eintragen.</p>}
      {sent && !paid && <p style={{ ...small, margin: '8px 0 0' }}>Gesendet {fmt(project.invoice_sent_at!)}. Sobald das Geld auf dem Konto ist: «Zahlung erhalten».</p>}
    </section>
  )
}

// «Was wir tun»: Arbeitsplan + Neuigkeiten (sieht der Kunde unter «Ihr Projekt») und monatlicher Bericht.
function PlanCard({ project, monthlyItems, onSaved }: { project: Project; monthlyItems: boolean; onSaved: () => void }) {
  const [plan, setPlan] = useState(project.plan ?? '')
  const [news, setNews] = useState('')
  const [msg, setMsg] = useState(''), [busy, setBusy] = useState(false)
  const updates = project.updates ?? []
  const paid = project.status !== 'awaiting_payment'
  const set = async (patch: Partial<Project>, done: string) => {
    setBusy(true)
    const r = await saveProject(project.id, patch)
    setBusy(false)
    if (r) { setMsg(done); onSaved() } else setMsg('Speichern fehlgeschlagen. Ist supabase/flow.sql ausgeführt?')
  }
  const in30 = () => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10) }
  const addNews = () => { const t = news.trim(); if (!t) return; void set({ updates: [{ at: new Date().toISOString(), text: t }, ...updates] }, 'Neuigkeit veröffentlicht.').then(() => setNews('')) }
  return (
    <section style={card}>
      <h3 style={h3}>Was wir tun</h3>
      <p style={{ ...small, margin: '0 0 10px' }}>Sieht der Kunde im Kundenbereich unter «Ihr Projekt».</p>
      <label style={{ ...small, display: 'grid', gap: 4 }}>Arbeitsplan
        <textarea style={{ ...input, minHeight: 90 }} value={plan} onChange={e => setPlan(e.target.value)} placeholder="Was wir in welcher Reihenfolge machen — in eigenen Worten, auf Deutsch." />
      </label>
      <button type="button" className="btn btn-sm btn-outline-light" style={{ marginTop: 8 }} disabled={busy || plan === (project.plan ?? '')} onClick={() => set({ plan: plan.trim() || null }, 'Arbeitsplan gespeichert.')}>Arbeitsplan speichern</button>

      <p style={{ ...small, fontWeight: 700, margin: '16px 0 6px' }}>Neuigkeiten</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <input style={{ ...input, flex: 1 }} value={news} onChange={e => setNews(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addNews() }} placeholder="z. B. «Google-Profil überarbeitet, 12 neue Fotos hochgeladen»" />
        <button type="button" className="btn btn-sm btn-electric" disabled={busy || !news.trim()} onClick={addNews}>Hinzufügen</button>
      </div>
      {updates.length > 0 && (
        <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0 }}>
          {updates.map((u, i) => (
            <li key={u.at + i} style={{ display: 'flex', gap: 10, alignItems: 'baseline', padding: '8px 0', borderTop: `1px solid ${line}`, fontSize: 14 }}>
              <span style={{ ...small, whiteSpace: 'nowrap' }}>{fmtDay(u.at.slice(0, 10))}</span>
              <span style={{ flex: 1 }} data-no-translate>{u.text}</span>
              <button type="button" style={{ ...linkBtn, fontSize: 13, color: muted }} disabled={busy} onClick={() => set({ updates: updates.filter((_, j) => j !== i) }, 'Neuigkeit entfernt.')}>Entfernen</button>
            </li>
          ))}
        </ul>
      )}

      <div style={{ borderTop: `1px solid ${line}`, marginTop: 14, paddingTop: 12 }}>
        <p style={{ ...small, fontWeight: 700, margin: '0 0 6px' }}>Monatlicher Bericht</p>
        {!monthlyItems ? <p style={{ ...small, margin: 0 }}>Nur bei Angeboten mit monatlichen Leistungen.</p>
          : !paid ? <p style={{ ...small, margin: 0 }}>Verfügbar nach «Zahlung erhalten».</p>
          : (
            <>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
                <input type="checkbox" checked={!!project.monthly} disabled={busy} style={{ width: 18, height: 18, accentColor: '#2600FF' }}
                  onChange={e => set(e.target.checked ? { monthly: true, next_report_at: project.next_report_at ?? in30() } : { monthly: false, next_report_at: null }, e.target.checked ? 'Erinnerung eingeschaltet.' : 'Erinnerung ausgeschaltet.')} />
                Alle 30 Tage an einen neuen Bericht erinnern
              </label>
              {project.monthly && project.next_report_at && <>
                <p style={{ ...small, margin: '6px 0 0' }}>Nächster Bericht fällig: <strong data-no-translate>{project.next_report_at.split('-').reverse().join('.')}</strong></p>
                <p style={{ ...small, margin: '2px 0 0' }}>An diesem Tag erscheint die Anfrage unter «Dringend». Nach einer neuen Berichtsversion beginnen die 30 Tage neu.</p>
              </>}
            </>
          )}
      </div>
      {msg && <p style={{ ...small, margin: '10px 0 0' }}>{msg}</p>}
    </section>
  )
}

function WorkCard({ project, versions, onSaved, onGoToReport }: { project: Project; versions: ReportVersionRow[]; onSaved: () => void; onGoToReport?: () => void }) {
  const [msg, setMsg] = useState(''), [busy, setBusy] = useState(false)
  const [note, setNote] = useState(project.note ?? '')
  if (project.status === 'awaiting_payment') return null
  const started = project.status !== 'paid'
  const shown = ['result', 'support', 'done'].includes(project.status)
  const first = versions[0], latest = versions[versions.length - 1]
  const newReport = !!project.started_at && !!latest && new Date(latest.created_at) > new Date(project.started_at)
  const before = versionTotal(first), after = versionTotal(latest)
  const set = async (patch: Partial<Project>, done: string) => {
    setBusy(true)
    const r = await saveProject(project.id, patch)
    setBusy(false)
    if (r) { setMsg(done); onSaved() } else setMsg('Speichern fehlgeschlagen.')
  }
  const row = (state: 'done' | 'now' | 'todo', n: string, title: string, body: React.ReactNode) => (
    <li style={{ display: 'flex', gap: 12, padding: '12px 0', borderTop: `1px solid ${line}` }}>
      <span style={stepDot(state)}>{state === 'done' ? '✓' : n}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: 14.5, color: state === 'todo' ? muted : ink }}>{title}</p>
        {state === 'now' && <div style={{ marginTop: 6 }}>{body}</div>}
      </div>
    </li>
  )
  return (
    <section style={card}>
      <h3 style={h3}>Umsetzung</h3>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {row(started ? 'done' : 'now', '1', started && project.started_at ? `Arbeit begonnen ${fmt(project.started_at)}` : 'Arbeit beginnen', (
          <>
            <p style={{ ...small, margin: '0 0 8px' }}>Der Kunde sieht dann «Wir arbeiten an Ihrer Sichtbarkeit».</p>
            <button type="button" className="btn btn-sm btn-electric" disabled={busy} onClick={() => set({ status: 'in_progress' }, 'Arbeit begonnen.')}>Arbeit beginnen</button>
          </>
        ))}
        {row(!started ? 'todo' : newReport || shown ? 'done' : 'now', '2', newReport || shown ? 'Neuer Bericht veröffentlicht' : 'Nach der Arbeit: neuen Bericht veröffentlichen', (
          <>
            <p style={{ ...small, margin: '0 0 8px', lineHeight: 1.6 }}>Im Block «Prüfbericht» dieser Anfrage: «Daten neu sammeln» → Checkliste aktualisieren → «Neue Version veröffentlichen». Der Haken hier erscheint danach automatisch.</p>
            {onGoToReport && <button type="button" className="btn btn-sm btn-outline-light" onClick={onGoToReport}>Zum Prüfbericht</button>}
          </>
        ))}
        {row(shown ? 'done' : newReport ? 'now' : 'todo', '3', shown && project.result_at ? `Ergebnis für den Kunden freigegeben ${fmt(project.result_at)}` : 'Ergebnis für den Kunden freigeben', (
          <>
            <p style={{ ...small, margin: '0 0 8px', lineHeight: 1.6 }}>Der Kunde sieht im Kundenbereich den Tab «Ergebnis»: erster Bericht im Vergleich zum neuen. Verschickt wird nichts.</p>
            {before !== null && after !== null && <p style={{ fontSize: 15, margin: '0 0 10px' }}>Gesamt: {before} → <strong>{after}</strong> Punkte</p>}
            <button type="button" className="btn btn-sm btn-electric" disabled={busy} onClick={() => set({ status: 'result' }, 'Der Kunde sieht jetzt den Tab «Ergebnis».')}>Ergebnis freigeben</button>
          </>
        ))}
      </ol>
      {shown && (
        <div style={{ borderTop: `1px solid ${line}`, paddingTop: 12 }}>
          {before !== null && after !== null && <p style={{ fontSize: 15, margin: '0 0 10px' }}>Ergebnis: {before} → <strong>{after}</strong> Punkte</p>}
          {project.status === 'result' ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-sm btn-outline-light" disabled={busy} onClick={() => set({ status: 'support' }, 'Betreuung läuft.')}>Monatliche Betreuung läuft weiter</button>
              <button type="button" className="btn btn-sm btn-outline-light" disabled={busy} onClick={() => set({ status: 'done' }, 'Projekt abgeschlossen.')}>Projekt abschließen</button>
            </div>
          ) : <p style={{ ...small, margin: 0 }}>{project.status === 'support' ? 'Status: monatliche Betreuung.' : 'Projekt abgeschlossen.'}</p>}
        </div>
      )}
      <label style={{ ...small, display: 'grid', gap: 4, marginTop: 12 }}>Hinweis für den Kunden (sieht er im Kundenbereich unter «Ihr Projekt»)
        <textarea style={{ ...input, minHeight: 50 }} value={note} onChange={e => setNote(e.target.value)} placeholder="z. B. «Bitte schicken Sie uns bis Freitag Fotos Ihres Teams.»" />
      </label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
        <button type="button" className="btn btn-sm btn-outline-light" disabled={busy || note === (project.note ?? '')} onClick={() => set({ note: note.trim() || null }, 'Hinweis gespeichert.')}>Hinweis speichern</button>
        {msg && <span style={small}>{msg}</span>}
      </div>
    </section>
  )
}

function Chat({ userId, messages, onSent }: { userId: string | null; messages: Message[]; onSent: (m: Message) => void }) {
  const [text, setText] = useState(''), [busy, setBusy] = useState(false)
  if (!userId) return <section style={card}><h3 style={h3}>Nachrichten</h3><p style={{ fontSize: 14, margin: 0 }}>Der Kunde hat kein Konto — Nachrichten erscheinen nach der Registrierung.</p></section>
  const send = async () => {
    if (!text.trim()) return
    setBusy(true)
    const m = await sendStaffMessage(userId, text.trim())
    setBusy(false)
    if (m) { onSent(m); setText('') }
  }
  return (
    <section style={card}>
      <h3 style={h3}>Nachrichten</h3>
      <div style={{ display: 'grid', gap: 8, maxHeight: 360, overflowY: 'auto', marginBottom: 10 }}>
        {messages.length === 0 && <p style={small}>Keine Nachrichten.</p>}
        {messages.map(m => (
          <div key={m.id} style={{ justifySelf: m.author === 'rag' ? 'end' : 'start', maxWidth: '85%', padding: '8px 11px', borderRadius: 12, backgroundColor: m.author === 'rag' ? '#EEEBFF' : '#F2F1EC', fontSize: 14, whiteSpace: 'pre-wrap' }}>
            {/* Nachrichtentext nicht übersetzen — er ist Inhalt, keine Oberfläche */}
            <span data-no-translate>{m.body}</span><div style={{ ...small, fontSize: 11.5, marginTop: 3 }}>{m.author === 'rag' ? 'Team' : 'Kunde'} · {fmt(m.created_at)}</div>
          </div>
        ))}
      </div>
      <textarea style={{ ...input, minHeight: 70 }} placeholder="Antwort an den Kunden — er sieht sie im Kundenbereich" value={text} onChange={e => setText(e.target.value)} />
      <button type="button" className="btn btn-sm btn-electric" style={{ marginTop: 8 }} disabled={busy || !text.trim()} onClick={send}>Senden</button>
    </section>
  )
}

function Notes({ clientKey, notes, onAdded }: { clientKey: string; notes: Note[]; onAdded: () => void }) {
  const [text, setText] = useState('')
  const add = async () => { if (!text.trim()) return; if (await addNote(clientKey, text.trim())) { setText(''); onAdded() } }
  return (
    <section style={card}>
      <h3 style={h3}>Notizen (für den Kunden unsichtbar)</h3>
      <textarea style={{ ...input, minHeight: 56 }} placeholder="Zum Beispiel: nach 17:00 anrufen" value={text} onChange={e => setText(e.target.value)} />
      <button type="button" className="btn btn-sm btn-outline-light" style={{ marginTop: 8 }} onClick={add} disabled={!text.trim()}>Notiz hinzufügen</button>
      <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
        {notes.map(n => <div key={n.id} style={{ fontSize: 14, borderTop: `1px solid ${line}`, paddingTop: 8, whiteSpace: 'pre-wrap' }}><span data-no-translate>{n.body}</span><div style={small}>{fmt(n.created_at)}</div></div>)}
      </div>
    </section>
  )
}

const TABLE_RU: Record<string, string> = { leads: 'Quiz', orders: 'Paket', checks: 'Check' }
function activityText(a: Activity, profiles: Profile[]): string {
  const d = a.detail ?? {}
  switch (a.kind) {
    case 'lead_created': return 'Quiz ausgefüllt'
    case 'lead_claimed': return 'Registriert — Quiz dem Konto zugeordnet'
    case 'booking_clicked': return 'Hat «Termin wählen» geklickt (Terminbuchung)'
    case 'check_created': return `Sichtbarkeits-Check gestartet: ${str(d.name)}`
    case 'sources_confirmed': return 'Website und Profile bestätigt'
    case 'report_published': return 'Bericht veröffentlicht'
    case 'order_created': return `Paketanfrage: ${Array.isArray(d.items) ? (d.items as { name: string }[]).map(i => i.name).join(' + ') : ''}`
    case 'order_details': return 'Fragebogen zum Unternehmen ausgefüllt'
    case 'message': return d.author === 'rag' ? 'Nachricht vom Team' : 'Nachricht vom Kunden'
    case 'note': return 'Notiz hinzugefügt'
    case 'offer_sent': return 'Angebot als gesendet markiert'
    case 'offer_accepted': return 'Kunde hat das Angebot angenommen'
    case 'report_version': return 'Berichtsversion veröffentlicht'
    case 'check_deleted': return `Kunde hat das Unternehmen aus dem Kundenbereich entfernt: ${str(d.name)}`
    case 'appointment': return `Termin angelegt: ${str(d.title)}, ${d.at ? fmtDT(str(d.at)) : ''}`
    case 'appointment_changed': return `Termin «${str(d.title)}»: ${d.status === 'cancelled' ? 'abgesagt' : d.status === 'done' ? 'stattgefunden' : 'verschoben auf ' + (d.at ? fmtDT(str(d.at)) : '')}`
    case 'assigned': return d.to ? `Verantwortlich (${TABLE_RU[str(d.type)] ?? ''}): ${staffName(profiles, str(d.to))}` : `Verantwortlicher entfernt (${TABLE_RU[str(d.type)] ?? ''})`
    case 'stage': return `Status (${TABLE_RU[str(d.type)] ?? ''}): ${stageLabel(d.stage as Stage)}`
    case 'project': return `Projekt: ${projectLabel(d.status as ProjectStatus)}`
    case 'invoice_sent': return `Rechnung ${str(d.number)} für den Kunden freigegeben${d.amount != null ? ` (${str(d.amount)} €)` : ''}`
    default: return a.kind
  }
}

const NAME_IN_TEXT = new Set(['check_created', 'check_deleted'])
function History({ items, profiles, current }: { items: Activity[]; profiles: Profile[]; current: string }) {
  // Verlauf gilt für die Person; Einträge anderer Unternehmen derselben Person werden markiert und abgeblendet.
  return (
    <section style={card}>
      <h3 style={h3}>Verlauf</h3>
      <p style={{ ...small, marginTop: -4 }}>Alle Ereignisse dieser Person. Grau — andere Unternehmen.</p>
      {items.length === 0 && <p style={small}>Noch leer.</p>}
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
        {items.map(a => {
          const d = a.detail ?? {}, req = typeof d.req === 'string' ? d.req : null, name = typeof d.name === 'string' ? d.name : ''
          const other = req !== null && req !== current
          return (
            <li key={a.id} style={{ fontSize: 13.5, opacity: other ? 0.5 : 1 }}>
              <span style={small}>{fmt(a.created_at)}</span> — {activityText(a, profiles)}
              {name && !NAME_IN_TEXT.has(a.kind) ? <b data-no-translate style={{ fontWeight: 600 }}> · {name}</b> : null}
              {a.actor ? <span style={small}> · {staffName(profiles, a.actor)}</span> : null}
            </li>
          )
        })}
      </ul>
    </section>
  )
}


// ── Встречи с клиентом ──────────────────────────────────────────────────────
const fmtDT = (iso: string) => new Date(iso).toLocaleString('ru-RU', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
const APPT_STATUS: [Appointment['status'], string][] = [['planned', 'Geplant'], ['done', 'Stattgefunden'], ['cancelled', 'Abgesagt']]
function AppointmentsCard({ r, list, onChanged }: { r: Request; list: Appointment[]; onChanged: (added: boolean) => void }) {
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [err, setErr] = useState('')
  const [f, setF] = useState({ when: '', duration: '30', title: 'Erstgespräch', location: '', note: '' })
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF(x => ({ ...x, [k]: e.target.value }))
  const add = async (e: React.FormEvent) => {
    e.preventDefault(); setErr('')
    if (!f.when) { setErr('Bitte Datum und Uhrzeit angeben.'); return }
    setBusy(true)
    const ok = await addAppointment({ client_key: r.clientKey, user_id: r.userId, starts_at: new Date(f.when).toISOString(), duration_min: Number(f.duration) || 30, title: f.title, location: f.location, note: f.note })
    setBusy(false)
    if (!ok) { setErr('Speichern fehlgeschlagen.'); return }
    setOpen(false); setF({ when: '', duration: '30', title: 'Erstgespräch', location: '', note: '' }); onChanged(true)
  }
  return (
    <section style={card}>
      <h3 style={h3}>Termine</h3>
      {!r.userId && <p style={{ ...small, margin: '0 0 10px', color: '#B26B00' }}>Der Kunde hat noch kein Konto — den Termin sieht er nach der Registrierung.</p>}
      {list.length === 0 && !open && <p style={{ ...small, margin: '0 0 10px' }}>Noch keine Termine.</p>}
      {list.map(a => (
        <div key={a.id} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', padding: '8px 0', borderTop: `1px solid ${line}`, opacity: a.status === 'cancelled' ? 0.55 : 1 }}>
          <span style={{ flex: 1, minWidth: 180, fontSize: 14 }}><strong>{fmtDT(a.starts_at)}</strong> · {a.duration_min} Min. · {a.title}
            {a.location ? <><br /><span style={small}>{a.location}</span></> : null}</span>
          <select value={a.status} onChange={async e => { if (await setAppointmentStatus(a.id, e.target.value as Appointment['status'])) onChanged(false) }} style={{ ...input, width: 150, padding: '5px 8px' }}>
            {APPT_STATUS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <button type="button" style={{ ...linkBtn, fontSize: 12.5, color: '#A21C22' }} onClick={async () => { if (confirm(tr('Termin löschen? Der Kunde sieht ihn danach nicht mehr.')) && await deleteAppointment(a.id)) onChanged(false) }}>Löschen</button>
        </div>
      ))}
      {open ? (
        <form onSubmit={add} style={{ display: 'grid', gap: 8, marginTop: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: 8 }}>
            <input type="datetime-local" value={f.when} onChange={set('when')} style={input} required aria-label="Datum und Uhrzeit" />
            <select value={f.duration} onChange={set('duration')} style={input} aria-label="Dauer">{['15', '20', '30', '45', '60', '90'].map(m => <option key={m} value={m}>{m} Min.</option>)}</select>
          </div>
          <input style={input} value={f.title} onChange={set('title')} placeholder="Bezeichnung für den Kunden (auf Deutsch)" aria-label="Bezeichnung" />
          <input style={input} value={f.location} onChange={set('location')} placeholder="Link zum Videogespräch, Telefon oder Adresse" aria-label="Ort" />
          <textarea style={{ ...input, minHeight: 60, resize: 'vertical' }} value={f.note} onChange={set('note')} placeholder="Kommentar für den Kunden (auf Deutsch, optional)" aria-label="Kommentar" />
          {err && <p style={{ ...small, color: '#A21C22', margin: 0 }}>{err}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-sm btn-electric" disabled={busy}>{busy ? 'Wird gespeichert…' : 'Termin hinzufügen'}</button>
            <button type="button" className="btn btn-sm btn-outline-light" onClick={() => setOpen(false)}>Abbrechen</button>
          </div>
          <p style={{ ...small, margin: 0 }}>Der Kunde sieht den Termin im Kundenbereich («Termine» und «Ihr nächster Schritt»). Der Status «Neu/Kontaktiert» wechselt zu «Gespräch vereinbart».</p>
        </form>
      ) : <button type="button" className="btn btn-sm btn-outline-light" style={{ marginTop: 8 }} onClick={() => setOpen(true)}>+ Termin anlegen</button>}
    </section>
  )
}

// ── Мой профиль: так менеджера видит клиент в кабинете ───────────────────────
function MyProfile() {
  const [f, setF] = useState({ name: '', title: '', photo: '', booking: '' })
  const [loaded, setLoaded] = useState(false), [busy, setBusy] = useState(false), [msg, setMsg] = useState('')
  useEffect(() => { loadMyProfile().then(p => { if (p) setF({ name: p.name ?? '', title: p.title ?? '', photo: p.photo_url ?? '', booking: p.booking_url ?? '' }); setLoaded(true) }) }, [])
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF(x => ({ ...x, [k]: e.target.value }))
  const urlOk = (u: string) => !u.trim() || /^https:\/\//.test(u.trim())
  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!urlOk(f.photo) || !urlOk(f.booking)) { setMsg('Links müssen mit https:// beginnen'); return }
    setBusy(true); setMsg('')
    const err = await saveMyProfile(f)
    setBusy(false); setMsg(err ? `Speichern fehlgeschlagen: ${err}` : 'Gespeichert. Kunden sehen die Änderungen bei der nächsten Anmeldung.')
  }
  if (!loaded) return <p style={{ padding: 20, color: muted }}>Wird geladen…</p>
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: 20, display: 'grid', gap: 16 }}>
      <section style={card}>
        <h3 style={h3}>Mein Profil</h3>
        <p style={{ ...small, margin: '0 0 14px' }}>Diese Angaben sieht der Kunde im Kundenbereich in der Karte «Ihr Ansprechpartner» — bei allen Anfragen, für die Sie verantwortlich sind.</p>
        <form onSubmit={save} style={{ display: 'grid', gap: 10 }}>
          <label style={small}>Name<input style={input} value={f.name} onChange={set('name')} required /></label>
          <label style={small}>Position (auf Deutsch, z. B. «Projektleiterin»)<input style={input} value={f.title} onChange={set('title')} /></label>
          <label style={small}>Foto — Link zum Bild (https://…)<input style={input} value={f.photo} onChange={set('photo')} placeholder="https://…" /></label>
          <label style={small}>Link zur Terminbuchung (Calendly o. Ä.). Leer — allgemeiner Link der Website<input style={input} value={f.booking} onChange={set('booking')} placeholder="https://…" /></label>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-md btn-electric" disabled={busy}>{busy ? 'Wird gespeichert…' : 'Speichern'}</button>
            {msg && <span style={small}>{msg}</span>}
          </div>
        </form>
      </section>
      <section style={{ ...card, display: 'flex', gap: 14, alignItems: 'center' }}>
        {f.photo && urlOk(f.photo)
          ? <img src={f.photo} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }} />
          : <span style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: 'var(--brand-soft)', color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{(f.name || 'R').slice(0, 1).toUpperCase()}</span>}
        <span><span style={small}>{f.title || 'Ihr Ansprechpartner'}</span><br /><strong>{f.name || '—'}</strong></span>
        <span style={{ ...small, marginLeft: 'auto' }}>Vorschau für den Kunden</span>
      </section>
      <AccountCard />
    </div>
  )
}

// ── Доступы: e-mail и пароль меняются во всплывающих окнах, без писем ────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k)
    const o = document.body.style.overflow; document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = o }
  }, [onClose])
  return (
    <div role="dialog" aria-modal="true" aria-label={title} onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 50, backgroundColor: 'rgba(7,7,12,0.45)', display: 'grid', placeItems: 'center', padding: 16 }}>
      <div style={{ ...card, width: '100%', maxWidth: 420, padding: 24, boxShadow: '0 20px 60px rgba(7,7,12,0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <h2 style={{ fontSize: 19, margin: 0 }}>{title}</h2>
          <button type="button" onClick={onClose} aria-label="Schließen" style={{ ...linkBtn, color: muted, fontSize: 22, lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function EmailModal({ current, onClose, onDone }: { current: string | null; onClose: () => void; onDone: (email: string) => void }) {
  const [email, setEmail] = useState(''), [pw, setPw] = useState(''), [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const v = email.trim().toLowerCase()
    if (v === current?.toLowerCase()) { setErr('Das ist bereits Ihre E-Mail.'); return }
    setBusy(true); setErr('')
    const r = await changeMyEmail(v, pw)
    setBusy(false)
    if (r) setErr(r); else onDone(v)
  }
  return (
    <Modal title="E-Mail ändern" onClose={onClose}>
      <form onSubmit={submit} style={{ display: 'grid', gap: 10 }}>
        <p style={{ ...small, margin: 0 }}>Die neue E-Mail gilt sofort für den Login — ohne Bestätigungs-E-Mail.</p>
        <label style={small}>Neue E-Mail<input style={input} type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus /></label>
        <label style={small}>Aktuelles Passwort<input style={input} type="password" autoComplete="current-password" value={pw} onChange={e => setPw(e.target.value)} required /></label>
        {err && <p role="alert" style={{ color: '#B3261E', fontSize: 13.5, margin: 0 }}>{err}</p>}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button className="btn btn-md btn-electric" disabled={busy}>{busy ? 'Wird gespeichert…' : 'Speichern'}</button>
          <button type="button" className="btn btn-md btn-outline-light" onClick={onClose}>Abbrechen</button>
        </div>
      </form>
    </Modal>
  )
}

function PasswordModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState({ cur: '', a: '', b: '' }), [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF(x => ({ ...x, [k]: e.target.value }))
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr('')
    if (f.a.length < 8) { setErr('Passwort zu einfach — mindestens 8 Zeichen.'); return }
    if (f.a !== f.b) { setErr('Die Passwörter stimmen nicht überein.'); return }
    setBusy(true)
    const r = await changeMyPassword(f.cur, f.a)
    setBusy(false)
    if (r) setErr(r); else onDone()
  }
  return (
    <Modal title="Passwort ändern" onClose={onClose}>
      <form onSubmit={submit} style={{ display: 'grid', gap: 10 }}>
        <label style={small}>Aktuelles Passwort<input style={input} type="password" autoComplete="current-password" value={f.cur} onChange={set('cur')} required autoFocus /></label>
        <label style={small}>Neues Passwort (mindestens 8 Zeichen)<input style={input} type="password" autoComplete="new-password" value={f.a} onChange={set('a')} required minLength={8} /></label>
        <label style={small}>Neues Passwort wiederholen<input style={input} type="password" autoComplete="new-password" value={f.b} onChange={set('b')} required /></label>
        {err && <p role="alert" style={{ color: '#B3261E', fontSize: 13.5, margin: 0 }}>{err}</p>}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button className="btn btn-md btn-electric" disabled={busy}>{busy ? 'Wird gespeichert…' : 'Speichern'}</button>
          <button type="button" className="btn btn-md btn-outline-light" onClick={onClose}>Abbrechen</button>
        </div>
      </form>
    </Modal>
  )
}

function AccountCard() {
  const [acc, setAcc] = useState<{ email: string | null; pending: string | null } | null>(null)
  const [open, setOpen] = useState<'' | 'email' | 'password'>(''), [msg, setMsg] = useState('')
  useEffect(() => { myAccount().then(setAcc) }, [])
  const close = useCallback(() => setOpen(''), [])
  const row: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', flexWrap: 'wrap' }
  return (
    <section style={card}>
      <h3 style={h3}>Zugangsdaten</h3>
      <p style={{ ...small, margin: '0 0 6px' }}>E-Mail und Passwort für den Login in den Team-Bereich. Der Kunde sieht sie nicht.</p>
      <div style={row}>
        <span style={{ ...small, width: 80 }}>E-Mail</span>
        <strong data-no-translate style={{ fontSize: 14.5 }}>{acc?.email ?? '…'}</strong>
        <button type="button" onClick={() => { setMsg(''); setOpen('email') }} className="btn btn-sm btn-outline-light" style={{ marginLeft: 'auto' }}>Ändern</button>
      </div>
      <div style={{ ...row, borderTop: `1px solid ${line}` }}>
        <span style={{ ...small, width: 80 }}>Passwort</span>
        <strong style={{ fontSize: 14.5, letterSpacing: '0.15em' }}>••••••••</strong>
        <button type="button" onClick={() => { setMsg(''); setOpen('password') }} className="btn btn-sm btn-outline-light" style={{ marginLeft: 'auto' }}>Ändern</button>
      </div>
      {msg && <p role="status" style={{ ...small, color: '#1F9D55', margin: '6px 0 0' }}>{msg}</p>}
      {open === 'email' && <EmailModal current={acc?.email ?? null} onClose={close} onDone={() => { setOpen(''); myAccount().then(setAcc); setMsg('E-Mail geändert. Melden Sie sich ab jetzt mit der neuen E-Mail an.') }} />}
      {open === 'password' && <PasswordModal onClose={close} onDone={() => { setOpen(''); setMsg('Passwort geändert. Auf anderen Geräten wurden Sie abgemeldet.') }} />}
    </section>
  )
}

// ── Новый пароль по ссылке из письма: /rag-intern/passwort-neu ───────────────
function StaffResetPassword() {
  const [ready, setReady] = useState<'wait' | 'ok' | 'invalid'>('wait')
  const [f, setF] = useState({ a: '', b: '', code: '' }), [needCode, setNeedCode] = useState(false)
  const [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  useEffect(() => {
    if (new URLSearchParams(window.location.hash.slice(1)).get('error_code')) { setReady('invalid'); return }
    // Supabase liest den Token aus der URL selbst (detectSessionInUrl) — kurz warten.
    const t = setTimeout(async () => setReady((await hasRecoverySession()) ? 'ok' : 'invalid'), 900)
    return () => clearTimeout(t)
  }, [])
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF(x => ({ ...x, [k]: e.target.value }))
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr('')
    if (f.a.length < 8) { setErr('Passwort zu einfach — mindestens 8 Zeichen.'); return }
    if (f.a !== f.b) { setErr('Die Passwörter stimmen nicht überein.'); return }
    if (needCode && f.code.replace(/\s/g, '').length < 6) { setErr('Bitte den 6-stelligen Code eingeben.'); return }
    setBusy(true)
    const r = await setStaffNewPassword(f.a, needCode ? f.code : undefined)
    setBusy(false)
    if (r === 'mfa') { setNeedCode(true); setErr('Bitte zusätzlich den Code aus Ihrer Authenticator-App eingeben.'); return }
    if (r) { setErr(r); return }
    window.location.replace('/rag-intern')
  }
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bone)', padding: 20, color: ink }}>
      <form onSubmit={submit} style={{ ...card, width: '100%', maxWidth: 380, padding: 28, display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}><p style={{ fontWeight: 800, fontSize: 20, margin: 0 }}>RAG<span style={{ color: accent }}>.</span> · Neues Passwort</p><LangSwitch /></div>
        {ready === 'wait' && <p style={{ ...small, margin: 0 }}>Wird geladen…</p>}
        {ready === 'invalid' && <>
          <p style={{ fontSize: 14, margin: 0 }}>Der Link ist abgelaufen oder wurde schon benutzt.</p>
          <a href="/rag-intern?vergessen=1" className="btn btn-md btn-electric" style={{ textAlign: 'center' }}>Neuen Link anfordern</a>
        </>}
        {ready === 'ok' && <>
          <label style={small}>Neues Passwort (mindestens 8 Zeichen)<input style={input} type="password" autoComplete="new-password" value={f.a} onChange={set('a')} required minLength={8} autoFocus /></label>
          <label style={small}>Neues Passwort wiederholen<input style={input} type="password" autoComplete="new-password" value={f.b} onChange={set('b')} required /></label>
          {needCode && <label style={small}>Code aus der Authenticator-App<input style={{ ...input, letterSpacing: '0.2em' }} inputMode="numeric" autoComplete="one-time-code" value={f.code} onChange={set('code')} placeholder="123 456" /></label>}
          {err && <p role="alert" style={{ color: '#B3261E', fontSize: 14, margin: 0 }}>{err}</p>}
          <button className="btn btn-md btn-electric" disabled={busy}>{busy ? 'Wird gespeichert…' : 'Passwort speichern'}</button>
        </>}
      </form>
    </div>
  )
}

// ── Команда: сотрудники, роли, ссылки-приглашения ─────────────────────────────
function Team() {
  const [team, setTeam] = useState<{ staff: Profile[]; invites: Invite[] } | null>(null)
  const [me, setMe] = useState<string | null>(null)
  const [email, setEmail] = useState(''), [role, setRoleSel] = useState<'manager' | 'admin'>('manager')
  const [link, setLink] = useState(''), [err, setErr] = useState(''), [copied, setCopied] = useState(false)
  const reload = () => { loadTeam().then(setTeam) }
  useEffect(() => { reload(); myId().then(setMe) }, [])
  useLive(c => c.table === 'profiles' || c.table === 'staff_invites', reload)
  const create = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setLink(''); setCopied(false)
    const r = await createInvite(email, role)
    if (r.error) setErr(r.error); else { setLink(r.link!); setEmail(''); reload() }
  }
  const copy = async () => { try { await navigator.clipboard.writeText(link); setCopied(true) } catch { setCopied(false) } }
  const change = async (p: Profile, r: 'client' | 'manager' | 'admin') => {
    if (r === 'client' && !confirm(tr(`Zugang sperren für ${p.email}?`))) return
    const e = await setRole(p.id, r); if (e) alert(tr(e)); reload()
  }
  const inviteState = (i: Invite) => i.used_at ? `angenommen ${fmt(i.used_at)}` : i.revoked_at ? 'widerrufen' : new Date(i.expires_at) < new Date() ? 'abgelaufen' : `gültig bis ${fmt(i.expires_at)}`
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: 20, display: 'grid', gap: 16 }}>
      <section style={card}>
        <h3 style={h3}>Ins Team einladen</h3>
        <form onSubmit={create} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input style={{ ...input, flex: '1 1 240px', width: 'auto' }} type="email" required placeholder="E-Mail des Mitarbeiters" value={email} onChange={e => setEmail(e.target.value)} />
          <select style={{ ...input, width: 160 }} value={role} onChange={e => setRoleSel(e.target.value as 'manager' | 'admin')}><option value="manager">Manager</option><option value="admin">Admin</option></select>
          <button className="btn btn-md btn-electric">Link erstellen</button>
        </form>
        <p style={{ ...small, margin: '8px 0 0' }}>Der Link ist einmalig, 72 Stunden gültig und nur für diese E-Mail. Senden Sie ihn selbst an den Mitarbeiter (Messenger, E-Mail).</p>
        {err && <p role="alert" style={{ color: '#B3261E', fontSize: 14, margin: '10px 0 0' }}>{err}</p>}
        {link && (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: '#F4F2FF', display: 'grid', gap: 8 }}>
            <code style={{ fontSize: 13, overflowWrap: 'anywhere' }}>{link}</code>
            <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button type="button" className="btn btn-sm btn-electric" onClick={copy}>{copied ? 'Kopiert ✓' : 'Link kopieren'}</button>
              <span style={small}>Der Link wird nur jetzt angezeigt — später lässt er sich nicht wiederherstellen, nur neu erstellen.</span>
            </span>
          </div>
        )}
      </section>
      <section style={card}>
        <h3 style={h3}>Mitarbeiter</h3>
        {!team && <p style={small}>Wird geladen…</p>}
        {team?.staff.map(p => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: `1px solid ${line}`, flexWrap: 'wrap' }}>
            <span style={{ flex: 1, minWidth: 200 }}><strong>{p.name || p.email}</strong><br /><span style={small}>{p.email}</span></span>
            {p.id === me ? <span style={small}>{p.role === 'admin' ? 'Admin' : 'Manager'} · das sind Sie</span> : (
              <>
                <select style={{ ...input, width: 140 }} value={p.role} onChange={e => change(p, e.target.value as 'manager' | 'admin')}><option value="manager">Manager</option><option value="admin">Admin</option></select>
                <button type="button" onClick={() => change(p, 'client')} style={{ ...linkBtn, color: '#B3261E' }}>Zugang sperren</button>
              </>
            )}
          </div>
        ))}
      </section>
      <section style={card}>
        <h3 style={h3}>Einladungslinks</h3>
        {team && team.invites.length === 0 && <p style={small}>Noch keine erstellt.</p>}
        {team?.invites.map(i => (
          <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: `1px solid ${line}`, flexWrap: 'wrap', fontSize: 14 }}>
            <span style={{ flex: 1, minWidth: 200 }}>{i.email} · {i.role === 'admin' ? 'Admin' : 'Manager'}<br /><span style={small}>erstellt {fmt(i.created_at)} · {inviteState(i)}</span></span>
            {!i.used_at && !i.revoked_at && new Date(i.expires_at) > new Date() && <button type="button" onClick={async () => { await revokeInvite(i.id); reload() }} style={{ ...linkBtn, color: '#B3261E' }}>Widerrufen</button>}
          </div>
        ))}
      </section>
    </div>
  )
}

// ── Страница по ссылке-приглашению: /rag-intern/einladung#t=<token> ───────────
function AcceptInvite() {
  const token = new URLSearchParams(window.location.hash.slice(1)).get('t') ?? ''
  const [email, setEmailState] = useState<string | null | undefined>(undefined)
  const [mode, setMode] = useState<'new' | 'login'>('new')
  const [f, setF] = useState({ name: '', email: '', pw: '' })
  const [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  useEffect(() => { currentEmail().then(setEmailState) }, [])
  const accept = async () => {
    const r = await acceptInvite(token)
    if (r.error) { setErr(r.error); return }
    window.location.replace('/rag-intern')
  }
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr('')
    if (mode === 'new') {
      const r = await signUpStaff(f.name, f.email, f.pw)
      if (r === 'exists') { setMode('login'); setErr('Für diese E-Mail gibt es bereits ein Konto — melden Sie sich mit dessen Passwort an.'); setBusy(false); return }
      if (r) { setErr(r); setBusy(false); return }
    } else {
      const r = await signInPlain(f.email, f.pw)
      if (r) { setErr(r); setBusy(false); return }
    }
    await accept(); setBusy(false)
  }
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF(x => ({ ...x, [k]: e.target.value }))
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bone)', padding: 20, color: ink }}>
      <div style={{ ...card, width: '100%', maxWidth: 420, padding: 28, display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}><p style={{ fontWeight: 800, fontSize: 20, margin: 0 }}>RAG<span style={{ color: accent }}>.</span> · Einladung ins Team</p><LangSwitch /></div>
        {!token && <p style={{ margin: 0 }}>Der Link enthält keinen Einladungscode. Bitten Sie um einen neuen Link.</p>}
        {token && email === undefined && <p style={small}>Wird geladen…</p>}
        {token && email && (
          <>
            <p style={{ margin: 0, fontSize: 14.5 }}>Angemeldet als <strong>{email}</strong>.</p>
            <button type="button" className="btn btn-md btn-electric" disabled={busy} onClick={async () => { setBusy(true); setErr(''); await accept(); setBusy(false) }}>Einladung annehmen</button>
            <button type="button" style={{ ...linkBtn, color: ink, fontSize: 13 }} onClick={async () => { await signOutStaff(); setEmailState(null) }}>Das ist nicht meine E-Mail — mit einer anderen anmelden</button>
          </>
        )}
        {token && email === null && (
          <form onSubmit={submit} style={{ display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['new', 'login'] as const).map(m => (
                <button key={m} type="button" onClick={() => { setMode(m); setErr('') }}
                  style={{ flex: 1, padding: '8px', borderRadius: 10, border: `1px solid ${mode === m ? accent : line}`, backgroundColor: mode === m ? '#F4F2FF' : '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600 }}>
                  {m === 'new' ? 'Konto anlegen' : 'Ich habe ein Konto'}
                </button>
              ))}
            </div>
            {mode === 'new' && <input style={input} placeholder="Name" value={f.name} onChange={set('name')} autoComplete="name" required />}
            <input style={input} type="email" placeholder="E-Mail, für die die Einladung ausgestellt ist" value={f.email} onChange={set('email')} autoComplete="username" required />
            <input style={input} type="password" placeholder={mode === 'new' ? 'Passwort wählen (mind. 8 Zeichen)' : 'Passwort'} value={f.pw} onChange={set('pw')} autoComplete={mode === 'new' ? 'new-password' : 'current-password'} minLength={mode === 'new' ? 8 : undefined} required />
            <button className="btn btn-md btn-electric" disabled={busy}>{busy ? 'Bitte warten…' : mode === 'new' ? 'Konto anlegen und anmelden' : 'Anmelden und annehmen'}</button>
          </form>
        )}
        {err && <p role="alert" style={{ color: '#B3261E', fontSize: 14, margin: 0 }}>{err}</p>}
      </div>
    </div>
  )
}
