import { useEffect, useState } from 'react'
import { DemoNote, Logo, StarsRow, useNoindex } from './CheckPage'
import {
  DEMO, SOURCE_LABELS, SOURCE_ORDER, confirmSources, currentUser, initials, loadLatestCheck, loadLatestOrder, loadMessages, sendMessage, signOut, updateSources,
  type CheckRow, type MessageRow, type OrderRow, type Source,
} from './data'
import SourcesEditor from './SourcesEditor'
import OrderPanel, { orderStatusLabel } from './OrderPanel'

/** Immer alle fünf Quellen in fester Reihenfolge — auch wenn die Suche nichts geliefert hat. */
function allSources(list: Source[] | null | undefined): Source[] {
  return SOURCE_ORDER.map(key => list?.find(s => s.key === key) ?? { key, value: '', found: false })
}

// /kabinett — Kundenbereich nach dem Check (Prototyp «rag_client_cabinet_v1», 25.09.2026).
// Tabs: Übersicht · Bericht · Unternehmen · Nachrichten. Die vier Kanäle in derselben
// Reihenfolge wie auf der Startseite: 01 KI-Suche · 02 Google Maps · 03 Website & Google Search · 04 Social Media.
// Daten aus Supabase (checks, messages). Ohne Anmeldung → /login. Den Bericht trägt das Team
// im Table Editor ein (checks.report, status = 'ready'); bis dahin gibt es einen Beispielbericht zum Ansehen.

type Tab = 'overview' | 'report' | 'company' | 'messages'
const TABS: [Tab, string][] = [['overview', 'Übersicht'], ['report', 'Bericht'], ['company', 'Unternehmen'], ['messages', 'Nachrichten']]

type Mark = 'ok' | 'warn' | 'bad'
type ChanKey = 'ai' | 'maps' | 'search' | 'social'
type Channel = { key: ChanKey; title: string; desc: string; score: number | null; summary: string; points: [Mark, string][] }
const CHANNELS: Channel[] = [
  {
    key: 'ai', title: 'KI-Suche', desc: 'Wie leicht ChatGPT, Perplexity und Google-KI Ihr Unternehmen finden und verstehen.', score: 31,
    summary: 'Bei der Suche nach Ihrem Namen werden Sie gefunden, bei allgemeinen Fragen aus der Region kaum.',
    points: [['ok', 'Name und Website werden erkannt'], ['warn', 'Wenige externe Quellen bestätigen Ihre Angaben'], ['bad', 'In Empfehlungen ohne Ihren Namen tauchen Sie selten auf']],
  },
  {
    key: 'maps', title: 'Google Maps', desc: 'Profil, Bewertungen, Vollständigkeit und lokale Präsenz.', score: 74,
    summary: 'Das Profil ist eine gute Basis, hat aber einige offensichtliche Lücken.',
    points: [['ok', 'Profil bestätigt, Öffnungszeiten gepflegt'], ['warn', 'Kaum neue Fotos in den letzten Monaten'], ['warn', 'Bewertungen kommen unregelmäßig']],
  },
  {
    key: 'search', title: 'Website & Google Search', desc: 'Aufbau der Leistungen, Verständlichkeit, Inhalte und Kontaktwege.', score: 58,
    summary: 'Die Website ist für Menschen verständlich, für mehrere Leistungen aber zu knapp aufgebaut.',
    points: [['ok', 'Schnell und für Smartphones optimiert'], ['warn', 'Keine eigenen Seiten für die wichtigsten Leistungen'], ['bad', 'Kein Ratgeber, keine Inhalte zu häufigen Fragen']],
  },
  {
    key: 'social', title: 'Social Media', desc: 'Aktive Profile, echte Projekte, Menschen und Regelmäßigkeit.', score: 49,
    summary: 'Die Profile existieren, zeigen aber selten echte Projekte, das Team und die Arbeit.',
    points: [['ok', 'Instagram und Facebook gefunden'], ['warn', 'Unregelmäßige Beiträge'], ['warn', 'Wenige Vorher-nachher-Beispiele']],
  },
]
const RECS: [string, string, string][] = [
  ['Hohe Priorität', 'Google Maps stärken', 'Mehr aktuelle Fotos, alle Leistungen im Profil und ein fester Ablauf, um nach jedem Auftrag um eine Bewertung zu bitten.'],
  ['Mittlere Priorität', 'Leistungen auf der Website trennen', 'Eigene Seiten je Leistung geben Google und der KI mehr Kontext — und Kunden eine klare Antwort.'],
  ['Wachstumspotenzial', 'In der KI-Suche sichtbar werden', 'Einträge in Verzeichnissen, einheitliche Unternehmensdaten und Inhalte zu typischen Fragen aus der Region.'],
]

const card: React.CSSProperties = { backgroundColor: '#fff', borderRadius: 22, border: '1px solid var(--line-soft)', padding: 'clamp(20px, 2.6vw, 28px)' }
const field: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid rgba(7,7,12,0.14)', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', outline: 'none', color: 'var(--ink)', backgroundColor: '#fff' }
const rowGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '120px minmax(0, 1fr)', gap: 12, padding: '12px 0', borderTop: '1px solid var(--line-soft)', fontSize: 14 }

function Eyebrow({ children, color = 'var(--electric)' }: { children: React.ReactNode; color?: string }) {
  return <p className="eyebrow" style={{ fontSize: 10, color, marginBottom: 10 }}>{children}</p>
}

function MarkIcon({ m }: { m: Mark }) {
  const c = m === 'ok' ? ['#0F7A3E', '#E6F6EC', '✓'] : m === 'warn' ? ['#9A6200', '#FFF3D6', '!'] : ['#C0262D', '#FDE8E8', '×']
  return <span aria-hidden="true" style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: c[0], backgroundColor: c[1] }}>{c[2]}</span>
}

function EmptyState({ onLogout }: { onLogout: () => void }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bone)', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '0 clamp(20px, 4vw, 48px)', height: 66, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
        <Logo />
        <button type="button" onClick={onLogout} className="ul" style={{ background: 'none', border: 'none', fontSize: 14, color: 'var(--ink)', cursor: 'pointer', fontFamily: 'inherit' }}>Abmelden</button>
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

function PendingCard({ center = false }: { center?: boolean }) {
  return (
    <div style={{ ...card, textAlign: center ? 'center' : 'left', padding: center ? 'clamp(32px, 5vw, 60px) 24px' : card.padding }}>
      <p className="display" style={{ fontSize: center ? 22 : 17, margin: '0 0 8px' }}>Der Bericht wird noch vorbereitet.</p>
      <p style={{ fontSize: 14.5, color: 'var(--muted)', margin: center ? '0 auto' : 0, maxWidth: center ? 460 : undefined, lineHeight: 1.65 }}>
        {center
          ? 'Nach der Prüfung durch unser Team finden Sie hier die Ergebnisse, konkrete Probleme und die nächsten Schritte.'
          : 'Wir schicken Ihnen eine E-Mail, sobald unser Team die Prüfung abgeschlossen hat.'}
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
  const [order, setOrder] = useState<OrderRow | null>(null)
  const [userMeta, setUserMeta] = useState<{ name: string; phone: string }>({ name: '', phone: '' })
  const [msgs, setMsgs] = useState<MessageRow[]>([])
  const [tab, setTab] = useState<Tab>(() => {
    const h = window.location.hash.slice(1) as Tab
    return TABS.some(([t]) => t === h) ? h : 'overview'
  })
  const [preview, setPreview] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [editing, setEditing] = useState(false)
  const [sourcesDraft, setSourcesDraft] = useState<Source[]>([])
  const [confirmDraft, setConfirmDraft] = useState<Source[]>([])
  const [confirming, setConfirming] = useState(false)
  const [confirmError, setConfirmError] = useState(false)
  // Direkt nach der Registrierung (/kabinett?welcome=1) begrüßen, dann den Parameter entfernen.
  const [welcome] = useState(() => new URLSearchParams(window.location.search).get('welcome') === '1')

  useEffect(() => {
    (async () => {
      const u = await currentUser()
      if (!u) { window.location.replace('/login?next=' + encodeURIComponent('/kabinett')); return }
      setUserEmail(u.email ?? '')
      setUserMeta({ name: (u.user_metadata?.name as string | undefined) ?? '', phone: (u.user_metadata?.phone as string | undefined) ?? '' })
      const [c, o, m] = await Promise.all([loadLatestCheck(), loadLatestOrder(), loadMessages()])
      setCheck(c); setOrder(o); setMsgs(m)
      if (c) setConfirmDraft(allSources(c.sources))
      setLoading(false)
    })()
  }, [])

  useEffect(() => { if (!loading) history.replaceState(null, '', tab === 'overview' ? '/kabinett' : `/kabinett#${tab}`) }, [tab, loading])

  const logout = async () => { await signOut(); window.location.href = '/' }

  if (loading) return <Loading />
  if (!check && !order) return <EmptyState onLogout={logout} />

  const ready = check?.status === 'ready'
  const confirmed = !check || check.sources_confirmed !== false
  const checkLabel = ready ? 'Bericht fertig' : confirmed ? 'Analyse läuft' : 'Bitte Quellen bestätigen'
  // Kopfzeile: die offene Aufgabe zuerst (Angaben zur Anfrage / Quellen bestätigen), sonst der neueste Vorgang.
  const orderFirst = !!order && (!check || !order.details || (confirmed && order.created_at > check.created_at))
  const statusLabel = orderFirst && order ? orderStatusLabel(order) : checkLabel
  const statusDone = orderFirst ? order?.status === 'active' || order?.status === 'closed' : ready
  const statusWaiting = orderFirst ? !order?.details : !confirmed
  const tabs = TABS.filter(([t]) => check || (t !== 'report' && t !== 'company'))
  const scored = ready || preview
  const chans: Channel[] = CHANNELS.map(c => {
    if (preview) return c
    const r = check?.report?.channels?.[c.key]
    return r ? { ...c, score: r.score, summary: r.summary, points: r.points } : { ...c, score: null, summary: '', points: [] }
  })
  const scores = chans.map(c => c.score).filter((x): x is number => typeof x === 'number')
  const total = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null
  const recs: [string, string, string][] = preview ? RECS : (check?.report?.recommendations ?? [])
  const place = check?.place
  const displayName = check?.contact.name || userMeta.name || userEmail
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
    if (await updateSources(check.id, sourcesDraft)) setCheck({ ...check, sources: sourcesDraft })
    setEditing(false)
  }

  const doConfirm = async () => {
    if (confirming || !check) return
    setConfirming(true); setConfirmError(false)
    const ok = await confirmSources(check.id, confirmDraft)
    setConfirming(false)
    if (ok) setCheck({ ...check, sources: confirmDraft, sources_confirmed: true })
    else setConfirmError(true)
  }

  const statusSteps: [boolean, string, string][] = [
    [true, 'Unternehmen bestätigt', 'Google-Profil gespeichert'],
    [confirmed, 'Website & Profile bestätigt', confirmed ? 'Öffentliche Quellen bestätigt' : 'Wartet auf Ihre Bestätigung'],
    [ready, 'Prüfung durch unser Team', ready ? 'Empfehlungen sind fertig' : confirmed ? 'Ein Spezialist bereitet die Empfehlungen vor' : 'Startet nach Ihrer Bestätigung'],
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bone)' }}>
      <header style={{ backgroundColor: 'var(--ink)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.7, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 1240, margin: '0 auto', padding: '0 clamp(20px, 4vw, 48px)' }}>
          <div style={{ height: 66, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, borderBottom: '1px solid var(--line-dark)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Logo dark />
              <span className="ck-hide-sm" style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>Kundenbereich</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: 'var(--electric)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 700 }}>{initials(displayName)}</span>
              <span className="ck-hide-sm" style={{ lineHeight: 1.3 }}>
                <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600 }}>{displayName}</span>
                <span style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{email}</span>
              </span>
              <button type="button" onClick={logout} className="ul" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', marginLeft: 6 }}>Abmelden</button>
            </div>
          </div>
          <div style={{ padding: 'clamp(28px, 4vw, 48px) 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0 }}>
              {(place || order?.details) && <Eyebrow color="var(--electric-2)">Ihr Unternehmen</Eyebrow>}
              <h1 className="display" style={{ fontSize: 'clamp(28px, 4vw, 50px)', margin: '0 0 10px' }}>{headTitle}</h1>
              {headSub && <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.6)', margin: 0 }}>{headSub}</p>}
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, padding: '8px 14px', borderRadius: 999, border: '1px solid var(--line-dark)', backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <span className={statusDone ? '' : 'blink'} style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: statusDone ? '#3DDC84' : statusWaiting ? '#F5B400' : 'var(--electric-2)' }} />
              {statusLabel}
            </span>
          </div>
          <nav aria-label="Kundenbereich" className="cab-tabs" style={{ display: 'flex', gap: 4, marginTop: 28, overflowX: 'auto' }}>
            {tabs.map(([t, l]) => (
              <button key={t} type="button" onClick={() => setTab(t)} aria-current={tab === t ? 'page' : undefined}
                style={{ background: 'none', border: 'none', fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap', padding: '14px 16px', fontSize: 14.5, fontWeight: 600, color: tab === t ? '#fff' : 'rgba(255,255,255,0.5)', borderBottom: `2px solid ${tab === t ? 'var(--electric-2)' : 'transparent'}`, transition: 'color 0.25s ease' }}>
                {l}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main id="inhalt" style={{ maxWidth: 1240, margin: '0 auto', padding: 'clamp(24px, 4vw, 44px) clamp(20px, 4vw, 48px) 96px' }}>
        {welcome && (
          <div style={{ marginBottom: 18, padding: '14px 18px', borderRadius: 16, backgroundColor: '#E6F6EC', color: '#0B5E30', fontSize: 14.5, lineHeight: 1.55 }}>
            <strong>Ihr Kundenbereich ist angelegt.</strong> Melden Sie sich künftig mit Ihrer E-Mail und Ihrem Passwort an.
          </div>
        )}

        {!confirmed && tab === 'overview' && (
          <section aria-labelledby="confirm-title" style={{ ...card, marginBottom: 18, borderLeft: '4px solid var(--electric)', padding: 'clamp(22px, 3vw, 32px)' }}>
            <Eyebrow>Ihr nächster Schritt</Eyebrow>
            <h2 id="confirm-title" className="display" style={{ fontSize: 'clamp(22px, 2.4vw, 30px)', lineHeight: 1.15, margin: '0 0 10px' }}>Sind das Ihre Website und Profile?</h2>
            <p style={{ fontSize: 14.5, lineHeight: 1.65, color: 'var(--muted)', margin: '0 0 20px', maxWidth: 640 }}>
              Diese Quellen haben wir zu Ihrem Unternehmen gefunden. Bitte prüfen Sie die Einträge und ergänzen Sie, was fehlt — danach startet unser Team die Analyse.
            </p>
            <SourcesEditor sources={confirmDraft} onChange={setConfirmDraft} />
            {DEMO && <div style={{ marginTop: 14 }}><DemoNote>Die Profile sind aus dem Namen der Website abgeleitet, nicht wirklich gesucht.</DemoNote></div>}
            {confirmError && <p role="alert" style={{ color: '#A21C22', fontSize: 14, margin: '14px 0 0' }}>Das Speichern hat nicht geklappt. Bitte versuchen Sie es noch einmal.</p>}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 22 }}>
              <button type="button" className="btn btn-lg btn-electric" onClick={doConfirm} disabled={confirming}>
                {confirming ? 'Wird gespeichert…' : 'Alles korrekt — Analyse starten'} <span className="arw">→</span>
              </button>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>Später jederzeit unter „Unternehmen“ änderbar.</span>
            </div>
          </section>
        )}

        {check && tab === 'overview' && !ready && confirmed && (
          <div style={{ marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              {preview
                ? <DemoNote>Beispielbericht: So sieht die Auswertung aus. Die Zahlen gehören nicht zu Ihrem Unternehmen.</DemoNote>
                : <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0, lineHeight: 1.6 }}>Neugierig, wie der fertige Bericht aussieht?</p>}
            </div>
            <button type="button" onClick={() => setPreview(v => !v)} className="btn btn-md btn-outline-light">{preview ? 'Beispiel ausblenden' : 'Beispielbericht ansehen'}</button>
          </div>
        )}

        {tab === 'overview' && order && (
          <div style={{ marginBottom: 18 }}>
            <OrderPanel order={order} onChange={setOrder}
              defaults={{ company: place?.name ?? '', phone: userMeta.phone, website: check?.sources.find(x => x.key === 'website')?.value ?? '', city: place?.city ?? '', industry: place?.category ?? '' }} />
          </div>
        )}

        {tab === 'overview' && !check && (
          <div style={{ ...card, display: 'flex', gap: 20, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div style={{ maxWidth: 620 }}>
              <Eyebrow>Kostenlos dazu</Eyebrow>
              <p className="display" style={{ fontSize: 'clamp(20px, 2.2vw, 26px)', lineHeight: 1.2, margin: '0 0 8px' }}>Sichtbarkeits-Check für Ihr Unternehmen</p>
              <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--muted)', margin: 0 }}>Wir prüfen Google Maps, Website, KI-Suche und Social Media — so sehen Sie den Ausgangspunkt, bevor wir starten.</p>
            </div>
            <a href="/#audit-quiz" className="btn btn-md btn-outline-light">Check starten <span className="arw">→</span></a>
          </div>
        )}

        {tab === 'overview' && check && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="cab-grid-2" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.25fr)', gap: 18 }}>
              <div style={{ ...card, backgroundColor: 'var(--electric)', color: '#fff', border: 'none' }}>
                <Eyebrow color="rgba(255,255,255,0.7)">Sichtbarkeit gesamt</Eyebrow>
                <p className="display" style={{ fontSize: 'clamp(64px, 8vw, 96px)', lineHeight: 0.95, margin: '6px 0 4px' }}>
                  {scored && total !== null ? total : '—'}<span style={{ fontSize: 22, fontWeight: 500, opacity: 0.6, letterSpacing: 0 }}> / 100</span>
                </p>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: 'rgba(255,255,255,0.78)', margin: '12px 0 0', maxWidth: 360 }}>
                  {scored
                    ? 'Kein SEO-Score, sondern ein Arbeitsbild: wo Ihr Unternehmen schon gut dasteht und wo die größten Lücken sind.'
                    : 'Wir sammeln noch Daten. Nach der Prüfung durch unser Team sehen Sie hier die Gesamtbewertung und später die Entwicklung.'}
                </p>
              </div>
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
                    <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>0{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="cab-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 18 }}>
              {chans.map((c, i) => (
                <div key={c.key} style={{ ...card, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                    <span className="display" style={{ fontSize: 38, lineHeight: 1, color: 'transparent', WebkitTextStroke: '1.4px var(--electric)' }}>0{i + 1}</span>
                    <span className="display" style={{ fontSize: 28, lineHeight: 1 }}>{scored && c.score !== null ? c.score : '—'}</span>
                  </div>
                  <p style={{ fontWeight: 700, fontSize: 16, margin: '0 0 6px', letterSpacing: '-0.01em' }}>{c.title}</p>
                  <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--muted)', margin: 0, flex: 1 }}>{c.desc}</p>
                  <div style={{ height: 5, borderRadius: 3, backgroundColor: '#EEEBFF', marginTop: 18 }}>
                    <div style={{ width: scored && c.score !== null ? `${c.score}%` : '0%', height: '100%', borderRadius: 3, backgroundColor: 'var(--electric)', transition: 'width 0.9s var(--ease)' }} />
                  </div>
                </div>
              ))}
            </div>

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
            ) : !ready && <PendingCard />}

            <div style={{ ...card, backgroundColor: 'var(--ink)', color: '#fff', border: 'none', display: 'flex', gap: 24, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div style={{ maxWidth: 620 }}>
                <Eyebrow color="var(--electric-2)">Wir können das für Sie übernehmen</Eyebrow>
                <p className="display" style={{ fontSize: 'clamp(22px, 2.4vw, 30px)', lineHeight: 1.15, margin: '0 0 10px' }}>AI Plus — <span className="serif italic-serif">alle vier Kanäle aus einer Hand.</span></p>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.65)', margin: 0 }}>Lokale Website mit Seiten für Leistungen und Orte, Google-Profil, Verzeichnisse, Inhalte für die KI-Suche und laufendes Monitoring.</p>
              </div>
              <div>
                <p className="display" style={{ fontSize: 34, margin: '0 0 12px' }}>499 €<span style={{ fontSize: 15, fontWeight: 500, opacity: 0.6, letterSpacing: 0 }}> / Monat</span></p>
                <a href="/preise" className="btn btn-md btn-paper">Pakete ansehen <span className="arw">→</span></a>
              </div>
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
              </div>
              <button type="button" className="btn btn-md btn-outline-light" disabled={!ready} style={{ opacity: ready ? 1 : 0.4, cursor: ready ? 'pointer' : 'default' }}>PDF herunterladen</button>
            </div>
            {!scored ? <PendingCard center /> : (
              <div className="cab-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18 }}>
                {chans.map((c, i) => (
                  <div key={c.key} style={card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 10 }}>
                      <p style={{ fontWeight: 700, fontSize: 17, margin: 0 }}><span style={{ color: 'var(--electric)', marginRight: 8 }}>0{i + 1}</span>{c.title}</p>
                      <span className="display" style={{ fontSize: 24 }}>{c.score ?? '—'}<span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500, letterSpacing: 0 }}> / 100</span></span>
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
          </div>
        )}

        {tab === 'company' && check && place && (
          <div className="cab-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18, alignItems: 'start' }}>
            <div style={card}>
              <Eyebrow>Grunddaten</Eyebrow>
              {([
                ['Google Maps', `${place.name} · ${place.address}`],
                ['Region', check.region || '—'],
                ['Branche', place.category],
                ['Telefon', place.phone || '—'],
              ] as const).map(([l, v]) => (
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
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <Eyebrow>Website & Social Media</Eyebrow>
                {!editing && (
                  <button type="button" onClick={() => { setSourcesDraft(allSources(check.sources)); setEditing(true) }} className="ul" style={{ background: 'none', border: 'none', color: 'var(--electric)', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10 }}>Bearbeiten</button>
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
          </div>
        )}

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
              <p style={{ fontWeight: 700, fontSize: 16, margin: '0 0 4px' }}>RAG-Team</p>
              <p style={{ fontSize: 13.5, color: 'var(--muted)', margin: '0 0 14px' }}>Regionale Agentur</p>
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
