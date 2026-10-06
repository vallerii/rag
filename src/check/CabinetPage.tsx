import LangSwitch from '../LangSwitch'
import { useEffect, useState } from 'react'
import { dateLocale } from '../i18n'
import { Logo, StarsRow, useNoindex } from './CheckPage'
import {
  SOURCE_LABELS, SOURCE_ORDER, confirmSources, currentUser, initials, loadLatestOrder, loadMyChecks, loadMessages, deleteMyCheck, loadReportVersions, loadMyAppointments, loadMyContact, loadMyManager, loadMyOffer, runAudit, sendMessage, signOut, updateSources,
  type Appointment, type CheckRow, type ReportVersion, type ClientOffer, type MyContact, type Manager, type MessageRow, type OrderRow, type Source,
} from './data'
import SourcesEditor from './SourcesEditor'
import OrderPanel, { orderStatusLabel } from './OrderPanel'
import { AccountPanel, AppointmentsPanel, ConfirmDialog, ContactForm, fmtWhen, upcoming } from './CabinetAccount'
import { AiCard, CompetitorsCard, Delta, HistoryCard, deltas } from './ReportExtras'
import { CompanySwitcher, ManagerCard, RecommendedCard, NextStepCard, OfferPanel, bookingLink, type NextStep } from './CabinetExtras'

/** Immer alle fünf Quellen in fester Reihenfolge — auch wenn die Suche nichts geliefert hat. */
function allSources(list: Source[] | null | undefined): Source[] {
  return SOURCE_ORDER.map(key => list?.find(s => s.key === key) ?? { key, value: '', found: false })
}

// /kabinett — Kundenbereich nach dem Check (Prototyp «rag_client_cabinet_v1», 25.09.2026).
// Tabs: Übersicht · Bericht · Unternehmen · Nachrichten. Die vier Kanäle in derselben
// Reihenfolge wie auf der Startseite: 01 KI-Suche · 02 Google Maps · 03 Website & Google Search · 04 Social Media.
// Daten aus Supabase (checks, messages). Ohne Anmeldung → /login. Den Bericht trägt das Team
// im Table Editor ein (checks.report, status = 'ready'); bis dahin gibt es einen Beispielbericht zum Ansehen.

type Tab = 'overview' | 'offer' | 'report' | 'company' | 'termine' | 'messages' | 'konto'
const TABS: [Tab, string][] = [['overview', 'Übersicht'], ['offer', 'Angebot'], ['report', 'Bericht'], ['company', 'Unternehmen'], ['termine', 'Termine'], ['messages', 'Nachrichten'], ['konto', 'Konto']]

type Mark = 'ok' | 'warn' | 'bad'
type ChanKey = 'ai' | 'maps' | 'search' | 'social'
type Channel = { key: ChanKey; title: string; desc: string; score: number | null; summary: string; points: [Mark, string][] }
// Die vier Kanäle — Bewertung, Zusammenfassung und Punkte kommen aus dem veröffentlichten Bericht (checks.report).
const CHANNELS: Channel[] = [
  { key: 'ai', title: 'KI-Suche', desc: 'Wie leicht ChatGPT, Perplexity und Google-KI Ihr Unternehmen finden und verstehen.', score: null, summary: '', points: [] },
  { key: 'maps', title: 'Google Maps', desc: 'Profil, Bewertungen, Vollständigkeit und lokale Präsenz.', score: null, summary: '', points: [] },
  { key: 'search', title: 'Website & Google Search', desc: 'Aufbau der Leistungen, Verständlichkeit, Inhalte und Kontaktwege.', score: null, summary: '', points: [] },
  { key: 'social', title: 'Social Media', desc: 'Aktive Profile, echte Projekte, Menschen und Regelmäßigkeit.', score: null, summary: '', points: [] },
]

const card: React.CSSProperties = { backgroundColor: '#fff', borderRadius: 22, border: '1px solid var(--line-soft)', padding: 'clamp(20px, 2.6vw, 28px)' }
const field: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid rgba(7,7,12,0.14)', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', outline: 'none', color: 'var(--ink)', backgroundColor: '#fff' }
const cardHead: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, minHeight: 28 }
const rowGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '150px minmax(0, 1fr)', gap: 12, padding: '12px 0', borderTop: '1px solid var(--line-soft)', fontSize: 14 }

function Eyebrow({ children, color = 'var(--electric)' }: { children: React.ReactNode; color?: string }) {
  return <p className="kick" style={{ fontSize: 12, color, marginBottom: 10 }}>{children}</p>
}


// Kanal-Icons statt Nummern (Stil D) — gleiche Reihenfolge wie CHANNELS: KI, Maps, Search, Social.
const icoProps = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
const CHAN_ICON: React.ReactNode[] = [
  <svg key="ki" {...icoProps}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /></svg>,
  <svg key="maps" {...icoProps}><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>,
  <svg key="search" {...icoProps}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></svg>,
  <svg key="social" {...icoProps}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" /></svg>,
]

function MarkIcon({ m }: { m: Mark }) {
  const c = m === 'ok' ? ['#0F7A3E', '#E6F6EC', '✓'] : m === 'warn' ? ['#9A6200', '#FFF3D6', '!'] : ['#C0262D', '#FDE8E8', '×']
  return <span aria-hidden="true" style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: c[0], backgroundColor: c[1] }}>{c[2]}</span>
}

function EmptyState({ onLogout, onKonto }: { onLogout: () => void; onKonto: () => void }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bone)', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '0 clamp(20px, 4vw, 48px)', height: 66, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
        <Logo />
        <span style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
          <LangSwitch />
          <button type="button" onClick={onKonto} className="ul" style={{ background: 'none', border: 'none', fontSize: 14, color: 'var(--ink)', cursor: 'pointer', fontFamily: 'inherit' }}>Konto & Einstellungen</button>
          <button type="button" onClick={onLogout} className="ul" style={{ background: 'none', border: 'none', fontSize: 14, color: 'var(--ink)', cursor: 'pointer', fontFamily: 'inherit' }}>Abmelden</button>
        </span>
      </header>
      <main id="inhalt" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
        <div style={{ ...card, maxWidth: 520, textAlign: 'center', padding: 'clamp(28px, 4vw, 44px)' }}>
          <Eyebrow>Kundenbereich</Eyebrow>
          <h1 className="display" style={{ fontSize: 30, lineHeight: 1.1, margin: '0 0 12px' }}>Noch kein Check gestartet</h1>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--muted)', margin: '0 0 24px' }}>Finden Sie Ihr Unternehmen — danach sehen Sie hier den Stand der Prüfung und Ihren Bericht.</p>
          <a href="/#audit-quiz" className="btn btn-lg btn-electric">Sichtbarkeits-Check starten <span className="arw">→</span></a>
        </div>
      </main>
    </div>
  )
}

function PendingCard({ assigned }: { assigned: boolean }) {
  return (
    <div style={{ ...card, textAlign: 'center', padding: 'clamp(32px, 5vw, 60px) 24px' }}>
      <p className="display" style={{ fontSize: 22, margin: '0 0 8px' }}>{assigned ? 'Ihr Ansprechpartner erstellt den Bericht.' : 'Ihre Anfrage ist eingegangen.'}</p>
      <p style={{ fontSize: 14.5, color: 'var(--muted)', margin: '0 auto', maxWidth: 460, lineHeight: 1.65 }}>
        {assigned
          ? 'Sobald die Analyse fertig ist, finden Sie hier die Ergebnisse, konkrete Probleme und unsere Empfehlung.'
          : 'Ihr persönlicher Ansprechpartner übernimmt sie in der Regel innerhalb von 1 Werktag und startet dann die Analyse.'}
      </p>
    </div>
  )
}

function Loading() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bone)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--muted)', fontSize: 15 }}>
      <span className="ck-spin" aria-hidden="true" />Kundenbereich wird geladen…
    </div>
  )
}

export default function CabinetPage() {
  useNoindex('Kundenbereich | RAG')
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')
  const [check, setCheck] = useState<CheckRow | null>(null)
  const [checks, setChecks] = useState<CheckRow[]>([])
  const [order, setOrder] = useState<OrderRow | null>(null)
  const [contact, setContact] = useState<MyContact>({ name: '', phone: '' })
  const [appts, setAppts] = useState<Appointment[]>([])
  const [versions, setVersions] = useState<ReportVersion[]>([])
  const [msgs, setMsgs] = useState<MessageRow[]>([])
  const [manager, setManager] = useState<Manager | null>(null)
  const [offer, setOffer] = useState<ClientOffer | null>(null)
  const [tab, setTab] = useState<Tab>(() => {
    const h = window.location.hash.slice(1) as Tab
    return TABS.some(([t]) => t === h) ? h : 'overview'
  })
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [editing, setEditing] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [sourcesDraft, setSourcesDraft] = useState<Source[]>([])
  const [confirmDraft, setConfirmDraft] = useState<Source[]>([])
  const [confirming, setConfirming] = useState(false)
  const [confirmError, setConfirmError] = useState(false)
  // Direkt nach der Registrierung (/kabinett?welcome=1) begrüßen, dann den Parameter entfernen.
  const [notice] = useState<'welcome' | 'neu' | 'bereits' | null>(() => {
    const q = new URLSearchParams(window.location.search)
    return q.get('welcome') === '1' ? 'welcome' : q.get('neu') === '1' ? 'neu' : q.get('bereits') === '1' ? 'bereits' : null
  })

  useEffect(() => {
    (async () => {
      const u = await currentUser()
      if (!u) { window.location.replace('/login?next=' + encodeURIComponent('/kabinett')); return }
      setUserEmail(u.email ?? '')
      const [c, o, m, mg, of, ap, ct] = await Promise.all([loadMyChecks(), loadLatestOrder(), loadMessages(), loadMyManager(), loadMyOffer(), loadMyAppointments(), loadMyContact(u)])
      // Gewählte Firma: ?firma=<id>, sonst die zuletzt geprüfte.
      const want = new URLSearchParams(window.location.search).get('firma')
      const sel = c.find(x => x.id === want) ?? c[0] ?? null
      setChecks(c); setCheck(sel); setOrder(o); setMsgs(m); setManager(mg); setOffer(of); setAppts(ap); setContact(ct)
      if (sel) setConfirmDraft(allSources(sel.sources))
      // Bestätigt, aber noch nicht analysiert (z. B. Tab geschlossen) → Datensammlung nachholen.
      for (const x of c) if (x.sources_confirmed && x.status === 'submitted') void runAudit(x.id)
      setLoading(false)
    })()
  }, [])

  // Versionen des Berichts (Verlauf, Vergleich mit der vorigen Prüfung)
  useEffect(() => {
    setVersions([])
    if (check?.id && check.status === 'ready') void loadReportVersions(check.id).then(setVersions)
  }, [check?.id, check?.status])

  useEffect(() => {
    if (loading) return
    const q = checks.length > 1 && check ? `?firma=${check.id}` : ''
    history.replaceState(null, '', `/kabinett${q}${tab === 'overview' ? '' : `#${tab}`}`)
  }, [tab, loading, check, checks.length])

  // Geänderten Check in Auswahl und Liste übernehmen.
  const putCheck = (c: CheckRow) => { setCheck(c); setChecks(list => list.map(x => (x.id === c.id ? c : x))) }
  const removeCheck = async (): Promise<boolean> => {
    if (!check) return false
    if (!(await deleteMyCheck(check.id))) return false
    const rest = checks.filter(x => x.id !== check.id)
    setChecks(rest); setRemoving(false); setEditing(false)
    const next = rest[0] ?? null
    setCheck(next); if (next) setConfirmDraft(allSources(next.sources))
    setTab('overview')
    return true
  }
  const selectCheck = (id: string) => {
    const c = checks.find(x => x.id === id)
    if (!c || c.id === check?.id) return
    setCheck(c); setConfirmDraft(allSources(c.sources)); setEditing(false); setConfirmError(false)
    if (tab === 'report' || tab === 'company' || tab === 'overview') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const logout = async () => { await signOut(); window.location.href = '/' }

  if (loading) return <Loading />
  if (!check && !order && !offer && tab !== 'konto') return <EmptyState onLogout={logout} onKonto={() => setTab('konto')} />

  const ready = check?.status === 'ready'
  const confirmed = !check || check.sources_confirmed !== false
  const checkLabel = ready ? 'Bericht fertig' : !confirmed ? 'Bitte Quellen bestätigen' : !check?.assignee_id ? 'Anfrage eingegangen' : 'Analyse läuft'
  // Kopfzeile: die offene Aufgabe zuerst (Angaben zur Anfrage / Quellen bestätigen), sonst der neueste Vorgang.
  const orderFirst = !!order && (!check || !order.details || (confirmed && order.created_at > check.created_at))
  const statusLabel = orderFirst && order ? orderStatusLabel(order) : checkLabel
  const statusDone = orderFirst ? order?.status === 'active' || order?.status === 'closed' : ready
  const statusWaiting = orderFirst ? !order?.details : !confirmed
  const tabs = TABS.filter(([t]) => t !== 'konto' && (t === 'offer' ? !!offer : check || (t !== 'report' && t !== 'company')))
  const scored = ready
  const chans: Channel[] = CHANNELS.map(c => {
    const r = check?.report?.channels?.[c.key]
    return r ? { ...c, score: r.score, summary: r.summary, points: r.points } : { ...c, score: null, summary: '', points: [] }
  })
  const scores = chans.map(c => c.score).filter((x): x is number => typeof x === 'number')
  const diff = deltas(check?.report, versions[1]?.report)
  const total = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null
  const recs: [string, string, string][] = check?.report?.recommendations ?? []
  const place = check?.place
  const displayName = check?.contact.name || contact.name || userEmail
  const email = check?.email || userEmail
  const headTitle = place?.name || order?.details?.company || 'Ihr Kundenbereich'
  const headSub = place ? `${place.category}${check?.region ? ` · ${check.region}` : ''}` : (order ? order.items.map(i => i.name).join(' + ') : '')

  const send = async () => {
    const text = draft.trim()
    if (!text || sending) return
    setSending(true)
    const m = await sendMessage(text)
    setSending(false)
    if (m) { setMsgs(list => [...list, m]); setDraft('') }
  }
  const saveSources = async () => {
    if (!check) return
    if (await updateSources(check.id, sourcesDraft)) putCheck({ ...check, sources: sourcesDraft })
    setEditing(false)
  }

  const doConfirm = async () => {
    if (confirming || !check) return
    setConfirming(true); setConfirmError(false)
    const ok = await confirmSources(check.id, confirmDraft)
    setConfirming(false)
    if (ok) { putCheck({ ...check, sources: confirmDraft, sources_confirmed: true }); void runAudit(check.id) }
    else setConfirmError(true)
  }

  // Ablauf: Anfrage eingegangen → Ansprechpartner übernimmt → Analyse → Bericht + Empfehlung → Termin.
  // Termine erst, wenn ein Ansprechpartner zugeteilt ist (und bei einem Check: wenn der Bericht fertig ist).
  const assigned = check ? !!check.assignee_id : order ? !!order.assignee_id : !!manager
  const rec = ready ? check?.report?.recommended ?? null : null
  const nextAppt = upcoming(appts)
  const canBook = !!offer || !!nextAppt || (assigned && (!check || ready))
  const lockedHint = !assigned ? 'Verfügbar, sobald Ihr Ansprechpartner die Anfrage übernommen hat.' : 'Verfügbar, sobald Ihr Bericht fertig ist.'
  const book = canBook ? bookingLink(manager) : null
  const write = () => setTab('messages')
  const chat = { label: 'Im Chat schreiben', onClick: write }
  const nextStep: NextStep | null = !confirmed || (order && !order.details) ? null
    : offer?.status === 'sent' ? { title: 'Ihr Angebot ist da', text: 'Wir haben ein Angebot für Ihr Unternehmen zusammengestellt. Sehen Sie es sich in Ruhe an — Fragen klären wir gern im Gespräch.', links: [{ label: 'Angebot ansehen', onClick: () => setTab('offer') }] }
    : nextAppt ? { title: 'Ihr nächster Termin', text: <><strong style={{ color: 'var(--ink)' }}>{fmtWhen(nextAppt.starts_at)}</strong> · {nextAppt.title}</>, links: [nextAppt.location && /^https?:\/\//.test(nextAppt.location) ? { label: 'Zum Videogespräch', href: nextAppt.location } : { label: 'Termine ansehen', onClick: () => setTab('termine') }] }
    : offer?.status === 'accepted' ? { title: 'Wir bereiten den Start vor', text: 'Danke für Ihre Zusage. Ihr Ansprechpartner meldet sich mit den nächsten Schritten und den Unterlagen, die wir von Ihnen brauchen.', links: [chat] }
    : !assigned ? { title: 'Ihre Anfrage ist eingegangen', text: check ? 'Ihr persönlicher Ansprechpartner übernimmt sie in der Regel innerhalb von 1 Werktag und analysiert dann Ihr Unternehmen. Fragen können Sie uns schon jetzt im Chat stellen.' : 'Ihr persönlicher Ansprechpartner übernimmt sie in der Regel innerhalb von 1 Werktag. Fragen können Sie uns schon jetzt im Chat stellen.', links: [chat] }
    : check && !ready ? { title: 'Ihr Ansprechpartner analysiert Ihr Unternehmen', text: 'Wir prüfen Google Maps, Website, KI-Suche und Social Media. Den Bericht sehen Sie hier, meist innerhalb von 1–2 Werktagen.', links: [chat] }
    : check ? { title: 'Ihr Bericht ist fertig', text: rec ? <>Unsere Empfehlung: <strong style={{ color: 'var(--ink)' }}>{rec.name}</strong>. <span>Vereinbaren Sie einen Termin mit Ihrem Ansprechpartner — wir besprechen den Bericht in einem kurzen Gespräch.</span></> : 'Vereinbaren Sie einen Termin mit Ihrem Ansprechpartner — in 20 Minuten gehen wir die Ergebnisse durch.', links: [{ label: 'Bericht ansehen', onClick: () => setTab('report') }] }
    : { title: 'Erstgespräch vereinbaren', text: 'Ihr Ansprechpartner hat Ihre Anfrage übernommen. Vereinbaren Sie einen Termin — wir besprechen Ihre Ziele und den Ablauf.', links: [chat] }

  const statusSteps: [boolean, string, string][] = [
    [true, 'Unternehmen bestätigt', place?.manual ? 'Angaben gespeichert' : 'Google-Profil gespeichert'],
    [confirmed, 'Website & Profile bestätigt', confirmed ? 'Öffentliche Quellen bestätigt' : 'Wartet auf Ihre Bestätigung'],
    [assigned, 'Ansprechpartner übernimmt', assigned ? (manager?.name || 'Ihr Ansprechpartner ist zugeteilt') : confirmed ? 'In der Regel innerhalb von 1 Werktag' : 'Nach Ihrer Bestätigung'],
    [ready, 'Analyse & Bericht', ready ? 'Bericht und Empfehlung sind fertig' : assigned ? 'Ihr Ansprechpartner analysiert Ihr Unternehmen' : 'Startet, sobald die Anfrage übernommen ist'],
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bone)' }}>
      <header style={{ backgroundColor: 'var(--brand-soft)', color: 'var(--ink)', position: 'relative', zIndex: 5 }}>
        {/* Punkte im eigenen Rahmen beschneiden — der Header selbst darf nicht clippen (Firmen-Menü ragt heraus). */}
        <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div className="d-dots" style={{ position: 'absolute', right: -40, top: -40, width: 360, height: 360, opacity: 0.8 }} />
        </div>
        <div style={{ position: 'relative', maxWidth: 1240, margin: '0 auto', padding: '0 clamp(20px, 4vw, 48px)' }}>
          <div style={{ height: 66, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, borderBottom: '1px solid #DAD8F5' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Logo />
              <span className="ck-hide-sm" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--muted)' }}>Kundenbereich</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <LangSwitch />
              <button type="button" onClick={() => setTab('konto')} title="Konto & Einstellungen" aria-label="Konto & Einstellungen" aria-current={tab === 'konto' ? 'page' : undefined}
                className="cab-profile" style={{ display: 'flex', alignItems: 'center', gap: 10, background: tab === 'konto' ? '#fff' : 'none', border: 'none', borderRadius: 999, padding: '4px 12px 4px 4px', cursor: 'pointer', fontFamily: 'inherit', color: 'inherit', textAlign: 'left' }}>
                <span style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: 'var(--electric)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{initials(displayName)}</span>
                <span className="ck-hide-sm" style={{ lineHeight: 1.3 }}>
                  <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600 }}>{displayName}</span>
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--muted)' }}>{email}</span>
                </span>
              </button>
              <button type="button" onClick={logout} className="ul" style={{ background: 'none', border: 'none', color: 'var(--muted)', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', marginLeft: 6 }}>Abmelden</button>
            </div>
          </div>
          {tab === 'konto' ? (
            <div style={{ padding: 'clamp(28px, 4vw, 48px) 0 24px' }}>
              <button type="button" onClick={() => setTab('overview')} className="ul" style={{ background: 'none', border: 'none', padding: 0, color: 'var(--electric)', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 18 }}>← Zurück zum Kundenbereich</button>
              <Eyebrow>Ihr Konto</Eyebrow>
              <h1 className="display" style={{ fontSize: 'clamp(28px, 4vw, 50px)', margin: 0 }}>Konto & Einstellungen</h1>
            </div>
          ) : (<>
          <div style={{ padding: 'clamp(28px, 4vw, 48px) 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0 }}>
              {(place || order?.details) && <Eyebrow>{checks.length > 1 ? 'Ihre Firmen' : 'Ihr Unternehmen'}</Eyebrow>}
              <CompanySwitcher checks={checks} current={check} onSelect={selectCheck} title={headTitle} />
              {headSub && <p style={{ fontSize: 15, color: 'var(--muted)', margin: 0 }}>{headSub}</p>}
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, padding: '8px 14px', borderRadius: 999, border: '1px solid var(--border)', backgroundColor: '#fff' }}>
              <span className={statusDone ? '' : 'blink'} style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: statusDone ? '#3DDC84' : statusWaiting ? '#F5B400' : 'var(--electric-2)' }} />
              {statusLabel}
            </span>
          </div>
          <nav aria-label="Kundenbereich" className="cab-tabs" style={{ display: 'flex', gap: 4, marginTop: 28, overflowX: 'auto' }}>
            {tabs.map(([t, l]) => (
              <button key={t} type="button" onClick={() => setTab(t)} aria-current={tab === t ? 'page' : undefined}
                style={{ background: 'none', border: 'none', fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap', padding: '14px 16px', fontSize: 14.5, fontWeight: 600, color: tab === t ? 'var(--electric)' : 'var(--muted)', borderBottom: `2px solid ${tab === t ? 'var(--electric)' : 'transparent'}`, transition: 'color 0.25s ease' }}>
                {l}
              </button>
            ))}
          </nav>
          </>)}
        </div>
      </header>

      <main id="inhalt" style={{ maxWidth: 1240, margin: '0 auto', padding: 'clamp(24px, 4vw, 44px) clamp(20px, 4vw, 48px) 96px' }}>
        {notice === 'neu' && (
          <div style={{ marginBottom: 18, padding: '14px 18px', borderRadius: 16, backgroundColor: '#E6F6EC', color: '#0B5E30', fontSize: 14.5, lineHeight: 1.55 }}>
            <strong>Weitere Firma hinzugefügt.</strong> Oben über dem Namen wechseln Sie zwischen Ihren Firmen.
          </div>
        )}
        {notice === 'bereits' && (
          <div style={{ marginBottom: 18, padding: '14px 18px', borderRadius: 16, backgroundColor: '#EEEBFF', color: 'var(--ink)', fontSize: 14.5, lineHeight: 1.55 }}>
            <strong>Diese Firma prüfen wir bereits.</strong> Hier sehen Sie den aktuellen Stand — ein zweiter Check ist nicht nötig.
          </div>
        )}
        {notice === 'welcome' && (
          <div style={{ marginBottom: 18, padding: '14px 18px', borderRadius: 16, backgroundColor: '#E6F6EC', color: '#0B5E30', fontSize: 14.5, lineHeight: 1.55 }}>
            <strong>Ihr Kundenbereich ist angelegt.</strong> Melden Sie sich künftig mit Ihrer E-Mail und Ihrem Passwort an.
          </div>
        )}

        {tab === 'offer' && offer && <OfferPanel offer={offer} onAccepted={setOffer} />}

        {tab === 'overview' && (
          <div className={check ? 'cab-overview' : undefined} style={check ? { display: 'grid', gridTemplateColumns: 'minmax(260px, 340px) minmax(0, 1fr)', gap: 18, alignItems: 'start' } : undefined}>
            {check && (
              <aside style={{ position: 'sticky', top: 20 }}>
              <div style={card}>
                <Eyebrow>Stand der Prüfung</Eyebrow>
                <p className="display" style={{ fontSize: 22, margin: '0 0 16px' }}>{statusLabel}</p>
                {statusSteps.map(([done, t, s], i) => (
                  <div key={t} style={{ display: 'flex', gap: 14, padding: '12px 0', borderTop: '1px solid var(--line-soft)' }}>
                    <span style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: done ? '#fff' : 'var(--electric)', backgroundColor: done ? 'var(--electric)' : '#EEEBFF' }}>
                      {done ? '✓' : <span className="blink">•</span>}
                    </span>
                    <span>
                      <span style={{ display: 'block', fontWeight: 600, fontSize: 14.5 }}>{t}</span>
                      <span style={{ display: 'block', fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{s}</span>
                    </span>
                  </div>
                ))}
              </div>
              </aside>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
            {!confirmed && (
          <section aria-labelledby="confirm-title" style={{ ...card, borderLeft: '4px solid var(--electric)', padding: 'clamp(22px, 3vw, 32px)' }}>
            <Eyebrow>Ihr nächster Schritt</Eyebrow>
            <h2 id="confirm-title" className="display" style={{ fontSize: 'clamp(22px, 2.4vw, 30px)', lineHeight: 1.15, margin: '0 0 10px' }}>Sind das Ihre Website und Profile?</h2>
            <p style={{ fontSize: 14.5, lineHeight: 1.65, color: 'var(--muted)', margin: '0 0 20px', maxWidth: 640 }}>
              Diese Quellen haben wir zu Ihrem Unternehmen gefunden. Bitte prüfen Sie die Einträge und ergänzen Sie, was fehlt — danach startet unser Team die Analyse.
            </p>
            <SourcesEditor sources={confirmDraft} onChange={setConfirmDraft} />
            {confirmError && <p role="alert" style={{ color: '#A21C22', fontSize: 14, margin: '14px 0 0' }}>Das Speichern hat nicht geklappt. Bitte versuchen Sie es noch einmal.</p>}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 22 }}>
              <button type="button" className="btn btn-lg btn-electric" onClick={doConfirm} disabled={confirming}>
                {confirming ? 'Wird gespeichert…' : 'Alles korrekt — Analyse starten'} <span className="arw">→</span>
              </button>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>Später jederzeit unter „Unternehmen“ änderbar.</span>
            </div>
          </section>
            )}
            {nextStep && <NextStepCard step={nextStep} />}
            {offer?.status === 'sent' && <OfferPanel offer={offer} onAccepted={setOffer} />}
            <ManagerCard manager={manager} onWrite={write} canBook={canBook} lockedHint={lockedHint} />
            {order && (
          <div>
            <OrderPanel order={order} onChange={setOrder}
              defaults={{ company: place?.name ?? '', phone: contact.phone, website: check?.sources.find(x => x.key === 'website')?.value ?? '', city: place?.city ?? '', industry: place?.category ?? '' }} />
          </div>
            )}
            {ready && (
              <div style={{ ...card, backgroundColor: 'var(--electric)', color: '#fff', border: 'none' }}>
                <Eyebrow color="rgba(255,255,255,0.7)">Sichtbarkeit gesamt</Eyebrow>
                <p className="display" style={{ fontSize: 'clamp(64px, 8vw, 96px)', lineHeight: 0.95, margin: '6px 0 4px' }}>
                  {scored && total !== null ? total : '—'}<span style={{ fontSize: 22, fontWeight: 500, opacity: 0.6, letterSpacing: 0 }}> / 100</span><Delta d={diff.total} />
                </p>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: 'rgba(255,255,255,0.78)', margin: '12px 0 0', maxWidth: 360 }}>
                  {scored
                    ? 'Kein SEO-Score, sondern ein Arbeitsbild: wo Ihr Unternehmen schon gut dasteht und wo die größten Lücken sind.'
                    : 'Wir sammeln noch Daten. Nach der Prüfung durch unser Team sehen Sie hier die Gesamtbewertung und später die Entwicklung.'}
                </p>
              </div>
            )}
            {ready && (
            <div className="cab-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18 }}>
              {chans.map((c, i) => (
                <div key={c.key} style={{ ...card, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                    <span className="d-tile d-tile-sm" aria-hidden>{CHAN_ICON[i] ?? CHAN_ICON[0]}</span>
                    <span className="display" style={{ fontSize: 28, lineHeight: 1 }}>{scored && c.score !== null ? c.score : '—'}<Delta d={diff.ch(c.key)} /></span>
                  </div>
                  <p style={{ fontWeight: 700, fontSize: 16, margin: '0 0 6px', letterSpacing: '-0.01em' }}>{c.title}</p>
                  <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--muted)', margin: 0, flex: 1 }}>{c.desc}</p>
                  <div style={{ height: 5, borderRadius: 3, backgroundColor: '#EEEBFF', marginTop: 18 }}>
                    <div style={{ width: scored && c.score !== null ? `${c.score}%` : '0%', height: '100%', borderRadius: 3, backgroundColor: 'var(--electric)', transition: 'width 0.9s var(--ease)' }} />
                  </div>
                </div>
              ))}
            </div>
            )}
            {scored && recs.length > 0 ? (
              <div style={card}>
                <Eyebrow>Was wir zuerst empfehlen</Eyebrow>
                <div className="cab-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 18, marginTop: 8 }}>
                  {recs.map(([p, t, d], i) => (
                    <div key={t} style={{ paddingTop: 16, borderTop: `2px solid ${i === 0 ? 'var(--electric)' : 'var(--line)'}` }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? 'var(--electric)' : 'var(--muted)', margin: '0 0 8px' }}>{p}</p>
                      <p style={{ fontWeight: 700, fontSize: 16.5, margin: '0 0 8px', letterSpacing: '-0.01em' }}>{t}</p>
                      <p style={{ fontSize: 13.5, lineHeight: 1.65, color: 'var(--muted)', margin: 0 }}>{d}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {rec && <RecommendedCard rec={rec} booking={book} onWrite={write} />}
            {!check && (
          <div style={{ ...card, display: 'flex', gap: 20, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div style={{ maxWidth: 620 }}>
              <Eyebrow>Kostenlos dazu</Eyebrow>
              <p className="display" style={{ fontSize: 'clamp(20px, 2.2vw, 26px)', lineHeight: 1.2, margin: '0 0 8px' }}>Sichtbarkeits-Check für Ihr Unternehmen</p>
              <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--muted)', margin: 0 }}>Wir prüfen Google Maps, Website, KI-Suche und Social Media — so sehen Sie den Ausgangspunkt, bevor wir starten.</p>
            </div>
            <a href="/#audit-quiz" className="btn btn-md btn-outline-light">Check starten <span className="arw">→</span></a>
          </div>
            )}
            </div>
          </div>
        )}

        {tab === 'report' && check && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <Eyebrow>Bericht</Eyebrow>
                <p className="display" style={{ fontSize: 26, margin: '0 0 6px' }}>Sichtbarkeits-Check</p>
                <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0 }}>Detaillierte Auswertung in vier Bereichen.</p>
                {ready && versions[0] && <p style={{ fontSize: 13, color: 'var(--muted)', margin: '6px 0 0' }}><span>Stand:</span> <span>{new Date(versions[0].created_at).toLocaleDateString(dateLocale(), { day: 'numeric', month: 'long', year: 'numeric' })}</span>{versions.length > 1 && <> · <span>Version</span> <span>{versions.length}</span></>}</p>}
              </div>
            </div>
            {!scored ? <PendingCard assigned={assigned} /> : (
              <div className="cab-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18 }}>
                {chans.map((c, i) => (
                  <div key={c.key} style={card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 10 }}>
                      <p style={{ fontWeight: 800, fontSize: 17, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}><span className="d-tile d-tile-sm" aria-hidden>{CHAN_ICON[i] ?? CHAN_ICON[0]}</span>{c.title}</p>
                      <span className="display" style={{ fontSize: 24 }}>{c.score ?? '—'}<span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500, letterSpacing: 0 }}> / 100</span><Delta d={diff.ch(c.key)} /></span>
                    </div>
                    <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--muted)', margin: '0 0 14px' }}>{c.summary}</p>
                    {c.points.map(([m, t]) => (
                      <div key={t} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '9px 0', borderTop: '1px solid var(--line-soft)', fontSize: 14, lineHeight: 1.5 }}>
                        <MarkIcon m={m} /><span>{t}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
            {scored && check.report && <CompetitorsCard report={check.report} />}
            {scored && check.report && <AiCard report={check.report} />}
            <HistoryCard versions={versions} />
            {rec && <RecommendedCard rec={rec} booking={book} onWrite={write} />}
          </div>
        )}

        {tab === 'company' && check && place && (
          <div className="cab-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18, alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
              <div style={card}>
                <div style={cardHead}><Eyebrow>Grunddaten</Eyebrow></div>
                {(place.manual
                  ? [['Firma', place.name], ['Google Maps', 'Kein Google-Profil'], ['Region', check.region || '—'], ['Branche', place.category]]
                  : [['Google Maps', `${place.name} · ${place.address}`], ['Region', check.region || '—'], ['Branche', place.category], ['Telefon', place.phone || '—']]
                ).map(([l, v]) => (
                  <div key={l} style={rowGrid}>
                    <span style={{ color: 'var(--muted)' }}>{l}</span><span style={{ fontWeight: 500, overflowWrap: 'anywhere' }}>{v}</span>
                  </div>
                ))}
                {place.rating !== null && (
                  <div style={rowGrid}>
                    <span style={{ color: 'var(--muted)' }}>Bewertungen</span>
                    <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <StarsRow rating={place.rating} /><strong>{place.rating.toLocaleString('de-DE', { minimumFractionDigits: 1 })}</strong><span style={{ color: 'var(--muted)' }}>· {place.reviews}</span>
                    </span>
                  </div>
                )}
              </div>
              <ContactForm contact={contact} onSaved={setContact} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
              <div style={card}>
                <div style={cardHead}>
                  <Eyebrow>Website & Social Media</Eyebrow>
                  {!editing && (
                    <button type="button" onClick={() => { setSourcesDraft(allSources(check.sources)); setEditing(true) }} className="ul" style={{ background: 'none', border: 'none', padding: 0, color: 'var(--electric)', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit' }}>Bearbeiten</button>
                  )}
                </div>
                {(editing ? sourcesDraft : allSources(check.sources)).map((s, i) => (
                  <div key={s.key} style={{ ...rowGrid, alignItems: 'center', padding: editing ? '8px 0' : '12px 0' }}>
                    <span style={{ color: 'var(--muted)' }}>{SOURCE_LABELS[s.key]}</span>
                    {editing
                      ? <input aria-label={SOURCE_LABELS[s.key]} style={field} value={s.value} onChange={e => setSourcesDraft(d => d.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
                      : <span style={{ fontWeight: 500, color: s.value ? 'var(--ink)' : 'var(--muted)', overflowWrap: 'anywhere' }}>{s.value || 'nicht hinterlegt'}</span>}
                  </div>
                ))}
                {editing && (
                  <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                    <button type="button" className="btn btn-md btn-electric" onClick={saveSources}>Speichern</button>
                    <button type="button" className="btn btn-md btn-outline-light" onClick={() => setEditing(false)}>Abbrechen</button>
                  </div>
                )}
              </div>
              <div style={{ ...card, borderColor: '#F3C7C9' }}>
                <div style={cardHead}><Eyebrow color="#A21C22">Firma entfernen</Eyebrow></div>
                <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 16px' }}>Entfernt diese Firma mit Check und Bericht aus Ihrem Kundenbereich. Nachrichten, Termine und Ihr Konto bleiben erhalten.</p>
                <button type="button" className="btn btn-md btn-outline-danger" onClick={() => setRemoving(true)}>Firma entfernen…</button>
              </div>
            </div>
            {removing && (
              <ConfirmDialog title="Firma entfernen?" confirmLabel="Entfernen" busyLabel="Wird entfernt…"
                errorText="Das hat nicht geklappt. Bitte versuchen Sie es noch einmal." onConfirm={removeCheck} onClose={() => setRemoving(false)}>
                <p style={{ margin: 0 }}><strong style={{ color: 'var(--ink)' }}>{place.name}</strong> <span>wird mit Check und Bericht aus Ihrem Kundenbereich entfernt. Das lässt sich nicht rückgängig machen.</span></p>
              </ConfirmDialog>
            )}
          </div>
        )}


        {tab === 'termine' && <AppointmentsPanel list={appts} booking={book} locked={canBook ? undefined : lockedHint} onWrite={write} />}

        {tab === 'konto' && <AccountPanel email={userEmail} contact={contact} onContact={setContact} />}

        {tab === 'messages' && (
          <div className="cab-grid-msg" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 18, alignItems: 'start' }}>
            <div style={card}>
              <Eyebrow>Nachrichten</Eyebrow>
              <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 18px', lineHeight: 1.6 }}>Fragen zum Bericht und nächste Schritte besprechen wir hier. Wichtige Nachrichten kommen zusätzlich per E-Mail.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {msgs.map(m => {
                  const mine = m.author === 'client'
                  return (
                    <div key={m.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '82%', padding: '12px 16px', borderRadius: 18, fontSize: 14.5, lineHeight: 1.6, whiteSpace: 'pre-wrap', backgroundColor: mine ? 'var(--electric)' : 'var(--bone)', color: mine ? '#fff' : 'var(--ink)', borderBottomRightRadius: mine ? 6 : 18, borderBottomLeftRadius: mine ? 18 : 6 }}>
                      {m.body}
                      <span style={{ display: 'block', fontSize: 11, opacity: 0.6, marginTop: 4 }}>{new Date(m.created_at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )
                })}
                {msgs.length === 0 && <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0 }}>Noch keine Nachrichten.</p>}
              </div>
              <form onSubmit={e => { e.preventDefault(); send() }} style={{ display: 'flex', gap: 8, marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--line-soft)' }}>
                <input aria-label="Nachricht" value={draft} onChange={e => setDraft(e.target.value)} placeholder="Ihre Nachricht…" style={{ ...field, flex: 1, borderRadius: 999, padding: '11px 16px' }} />
                <button type="submit" className="btn btn-md btn-ink" disabled={!draft.trim() || sending} style={{ opacity: draft.trim() ? 1 : 0.4 }}>{sending ? '…' : 'Senden'}</button>
              </form>
            </div>
            <div style={card}>
              <Eyebrow>Ihr Kontakt</Eyebrow>
              <p style={{ fontWeight: 700, fontSize: 16, margin: '0 0 4px' }}>{manager?.name || 'RAG-Team'}</p>
              <p style={{ fontSize: 13.5, color: 'var(--muted)', margin: '0 0 14px' }}>{manager ? (manager.title || 'Ihr Ansprechpartner') : 'Regionale Agentur'}</p>
              {book && <a href={book} target="_blank" rel="noopener noreferrer" className="btn btn-md btn-electric" style={{ marginBottom: 14 }}>Termin vereinbaren</a>}
              <br />
              <a href="mailto:hallo@rag-agentur.de" className="ul" style={{ fontSize: 14, color: 'var(--electric)', fontWeight: 600 }}>hallo@rag-agentur.de</a>
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--line-soft)', fontSize: 13.5, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Status</span><strong>{ready ? 'Bericht fertig' : confirmed ? 'Check aktiv' : 'Bestätigung offen'}</strong>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
