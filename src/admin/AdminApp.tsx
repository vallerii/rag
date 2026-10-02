import { useEffect, useMemo, useState } from 'react'
import { useNoindex } from '../check/CheckPage'
import {
  OPEN, STAGES, acceptInvite, addNote, checkState, createInvite, currentEmail, getAssignee, isAdmin, isStaff, addAppointment, deleteAppointment, loadAll, loadClient, loadMyProfile, setAppointmentStatus, loadTeam, myId, saveMyProfile, publishReport,
  revokeInvite, saveOffer, sendStaffMessage, setAssignee, setNextContact, setRole, setStage, signInPlain, signInStaff, signOutStaff, signUpStaff, stageLabel,
  type Invite,
  type Activity, type Appointment, type Check, type Lead, type Message, type Note, type Offer, type Order, type Profile, type Request, type Stage,
} from './api'
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
const KIND: Record<Request['kind'], [string, string]> = { lead: ['Квиз', '#E8F3EC'], order: ['Пакет', '#EEEBFF'], check: ['Проверка', '#FFF3DC'] }
const STAGE_COLOR: Partial<Record<Stage, string>> = { new: '#D93A3A', won: '#1F7A4A', lost: '#8A8A8A' }

type Queue = 'mine' | 'free' | 'new' | 'quiz' | 'order' | 'check' | 'today' | 'all'
const QUEUES: [Queue, string][] = [
  ['mine', 'Мои заявки'], ['free', 'Без ответственного'], ['new', 'Новые'], ['quiz', 'Квиз → созвон'], ['order', 'Пакет → ждут созвон'], ['check', 'Проверка → ждут анализ'], ['today', 'Связаться сегодня'], ['all', 'Все заявки'],
]
const today = () => new Date().toISOString().slice(0, 10)
function inQueue(r: Request, q: Queue, me: string | null): boolean {
  if (q === 'all') return true
  if (q === 'mine') return !!me && r.assignee === me && OPEN.includes(r.stage)
  if (q === 'free') return !r.assignee && OPEN.includes(r.stage)
  if (q === 'new') return r.stage === 'new'
  if (q === 'quiz') return r.kind === 'lead' && OPEN.includes(r.stage)
  if (q === 'order') return r.kind === 'order' && ['new', 'contacted', 'call_booked'].includes(r.stage)
  if (q === 'check') return r.kind === 'check' && (r.row as Check).status !== 'ready'
  return !!r.next && r.next <= today() && OPEN.includes(r.stage) && (!r.assignee || r.assignee === me)
}
const staffName = (ps: Profile[], uid: string | null) => { const p = ps.find(x => x.id === uid); return p ? (p.name || p.email || '—') : '' }
const profileOf = (ps: Profile[], uid: string | null) => ps.find(p => p.id === uid)

export default function AdminApp() {
  useNoindex('Intern | RAG')
  if (/\/einladung\/?$/.test(window.location.pathname)) return <AcceptInvite />
  return <AdminRoot />
}

function AdminRoot() {
  const [state, setState] = useState<'loading' | 'login' | 'ok'>('loading')
  useEffect(() => { isStaff().then(ok => setState(ok ? 'ok' : 'login')).catch(() => setState('login')) }, [])
  if (state === 'loading') return <div style={{ padding: 40, color: muted }}>Загрузка…</div>
  if (state === 'login') return <Login onDone={() => setState('ok')} />
  return <Dashboard onLogout={async () => { await signOutStaff(); setState('login') }} />
}

function Login({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState(''), [pw, setPw] = useState(''), [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr('')
    const r = await signInStaff(email, pw)
    setBusy(false)
    if (r) setErr(r); else onDone()
  }
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bone)', padding: 20 }}>
      <form onSubmit={submit} style={{ ...card, width: '100%', maxWidth: 380, padding: 28, display: 'grid', gap: 12 }}>
        <p style={{ fontWeight: 800, fontSize: 20, margin: 0 }}>RAG<span style={{ color: accent }}>.</span> · вход для команды</p>
        <input style={input} type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" required />
        <input style={input} type="password" placeholder="Пароль" value={pw} onChange={e => setPw(e.target.value)} autoComplete="current-password" required />
        {err && <p role="alert" style={{ color: '#B3261E', fontSize: 14, margin: 0 }}>{err}</p>}
        <button className="btn btn-md btn-electric" disabled={busy}>{busy ? 'Вход…' : 'Войти'}</button>
      </form>
    </div>
  )
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [data, setData] = useState<{ requests: Request[]; profiles: Profile[] } | null>(null)
  const [queue, setQueue] = useState<Queue>('mine')
  const [me, setMe] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<string | null>(() => new URLSearchParams(window.location.search).get('r'))
  const [view, setView] = useState<'requests' | 'team' | 'profile'>('requests')
  const [admin, setAdmin] = useState(false)
  const reload = () => { loadAll().then(setData) }
  useEffect(() => { reload(); isAdmin().then(setAdmin); myId().then(setMe) }, [])
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    if (sel) sp.set('r', sel); else sp.delete('r')
    const qs = sp.toString()
    history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : ''))
  }, [sel])
  const list = useMemo(() => {
    if (!data) return []
    const needle = q.trim().toLowerCase()
    return data.requests.filter(r => inQueue(r, queue, me) && (!needle || `${r.title} ${r.sub} ${profileOf(data.profiles, r.userId)?.email ?? ''} ${profileOf(data.profiles, r.userId)?.name ?? ''}`.toLowerCase().includes(needle)))
  }, [data, queue, q, me])
  const current = data?.requests.find(r => `${r.kind}:${r.id}` === sel) ?? null
  const patch = (r: Request, p: Partial<Request>) => setData(d => d && { ...d, requests: d.requests.map(x => (x.kind === r.kind && x.id === r.id ? { ...x, ...p } : x)) })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bone)', color: ink }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderBottom: `1px solid ${line}`, backgroundColor: '#fff', position: 'sticky', top: 0, zIndex: 5 }}>
        <span style={{ fontWeight: 800, fontSize: 18 }}>RAG<span style={{ color: accent }}>.</span> <span style={{ fontWeight: 500, color: muted, fontSize: 14 }}>· заявки</span></span>
        <span style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {view !== 'requests' && <button type="button" onClick={() => setView('requests')} style={linkBtn}>← Заявки</button>}
          {admin && view !== 'team' && <button type="button" onClick={() => setView('team')} style={linkBtn}>Команда</button>}
          {view !== 'profile' && <button type="button" onClick={() => setView('profile')} style={linkBtn}>Мой профиль</button>}
          <button type="button" onClick={reload} style={linkBtn}>Обновить</button>
          <button type="button" onClick={onLogout} style={{ ...linkBtn, color: ink }}>Выйти</button>
        </span>
      </header>
      {view === 'profile' ? <MyProfile /> : view === 'team' ? <Team /> : <div className="adm-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 400px) minmax(0, 1fr)', gap: 20, padding: 20, alignItems: 'start' }}>
        <aside className="adm-aside" style={{ display: 'grid', gap: 12, position: 'sticky', top: 76 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {QUEUES.map(([k, label]) => {
              const n = data ? data.requests.filter(r => inQueue(r, k, me)).length : 0
              const on = k === queue
              return (
                <button key={k} type="button" onClick={() => setQueue(k)}
                  style={{ padding: '7px 11px', borderRadius: 999, border: `1px solid ${on ? accent : line}`, backgroundColor: on ? accent : '#fff', color: on ? '#fff' : ink, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {label} <span style={{ opacity: 0.7 }}>{n}</span>
                </button>
              )
            })}
          </div>
          <input style={input} placeholder="Поиск: имя, компания, e-mail" value={q} onChange={e => setQ(e.target.value)} />
          <div style={{ ...card, padding: 0, maxHeight: 'calc(100vh - 230px)', overflowY: 'auto' }}>
            {!data && <p style={{ padding: 16, color: muted, margin: 0 }}>Загрузка…</p>}
            {data && list.length === 0 && <p style={{ padding: 16, color: muted, margin: 0 }}>Пусто.</p>}
            {list.map((r, i) => {
              const key = `${r.kind}:${r.id}`
              return (
                <button key={key} type="button" onClick={() => setSel(key)}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 14px', border: 0, borderTop: i ? `1px solid ${line}` : 0, backgroundColor: key === sel ? '#F4F2FF' : '#fff', cursor: 'pointer', fontFamily: 'inherit', color: ink }}>
                  <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, padding: '2px 8px', borderRadius: 999, backgroundColor: KIND[r.kind][1] }}>{KIND[r.kind][0]}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: STAGE_COLOR[r.stage] ?? muted }}>{stageLabel(r.stage)}</span>
                  </span>
                  <span style={{ display: 'block', fontWeight: 600, fontSize: 14.5, marginTop: 6 }}>{r.title}</span>
                  <span style={{ display: 'block', ...small, marginTop: 2 }}>{r.sub}</span>
                  <span style={{ display: 'block', ...small, marginTop: 2 }}>{fmt(r.created_at)}{r.next ? ` · связаться ${r.next}` : ''} · {r.assignee ? (r.assignee === me ? 'ваша' : staffName(data?.profiles ?? [], r.assignee)) : 'свободна'}</span>
                </button>
              )
            })}
          </div>
        </aside>
        <main>
          {current && data
            ? <Detail key={sel ?? ''} r={current} all={data.requests} profiles={data.profiles} me={me} onSelect={setSel} onPatch={p => patch(current, p)} />
            : <div style={{ ...card, color: muted }}>Выберите заявку слева.</div>}
        </main>
      </div>}
      <style>{'@media (max-width: 900px) { .adm-grid { grid-template-columns: 1fr !important; } .adm-aside { position: static !important; } }'}</style>
    </div>
  )
}

function Detail({ r, all, profiles, me, onSelect, onPatch }: { r: Request; all: Request[]; profiles: Profile[]; me: string | null; onSelect: (k: string) => void; onPatch: (p: Partial<Request>) => void }) {
  const staff = profiles.filter(p => p.role === 'admin' || p.role === 'manager')
  const prof = profileOf(profiles, r.userId)
  const related = all.filter(x => x.clientKey === r.clientKey && !(x.kind === r.kind && x.id === r.id))
  const [client, setClient] = useState<Awaited<ReturnType<typeof loadClient>> | null>(null)
  const reloadClient = () => { loadClient(r.clientKey, r.userId).then(setClient) }
  useEffect(() => { reloadClient() }, [r.clientKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Erster Statuswechsel an einer freien Anfrage → sie gehört dem, der ihn macht (Trigger in der DB).
  const changeStage = async (s: Stage) => { if (await setStage(r.kind, r.id, s)) { onPatch({ stage: s, assignee: r.assignee ?? await getAssignee(r.kind, r.id) }); reloadClient() } }
  const changeAssignee = async (uid: string | null) => { if (await setAssignee(r.kind, r.id, uid)) { onPatch({ assignee: uid }); reloadClient() } }
  const changeNext = async (d: string) => { if (await setNextContact(r.kind, r.id, d)) onPatch({ next: d || null }) }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={card}>
        <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 999, backgroundColor: KIND[r.kind][1] }}>{KIND[r.kind][0]}</span>
        <h1 style={{ fontSize: 24, margin: '10px 0 4px', lineHeight: 1.2 }}>{r.title}</h1>
        <p style={{ ...small, margin: 0 }}>{r.sub} · создана {fmt(r.created_at)}</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
          <label style={{ ...small, display: 'grid', gap: 4 }}>Статус
            <select value={r.stage} onChange={e => changeStage(e.target.value as Stage)} style={{ ...input, width: 230 }}>
              {STAGES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </label>
          <label style={{ ...small, display: 'grid', gap: 4 }}>Следующий контакт
            <input type="date" value={r.next ?? ''} onChange={e => changeNext(e.target.value)} style={{ ...input, width: 180 }} />
          </label>
          <label style={{ ...small, display: 'grid', gap: 4 }}>Ответственный
            <select value={r.assignee ?? ''} onChange={e => changeAssignee(e.target.value || null)} style={{ ...input, width: 220 }}>
              <option value="">— свободна —</option>
              {staff.map(p => <option key={p.id} value={p.id}>{p.id === me ? `Я (${p.name || p.email})` : p.name || p.email}</option>)}
            </select>
          </label>
          {me && r.assignee !== me && <button type="button" className="btn btn-sm btn-outline-light" style={{ alignSelf: 'end' }} onClick={() => changeAssignee(me)}>Взять себе</button>}
        </div>
        {r.assignee && r.assignee !== me && <p style={{ ...small, margin: '10px 0 0', color: '#B26B00' }}>Заявку ведёт {staffName(profiles, r.assignee)}.</p>}
        {related.length > 0 && (
          <p style={{ ...small, margin: '14px 0 0' }}>Другие заявки клиента:{' '}
            {related.map(x => <button key={x.kind + x.id} type="button" onClick={() => onSelect(`${x.kind}:${x.id}`)} style={{ ...linkBtn, fontSize: 12.5, marginRight: 10 }}>{KIND[x.kind][0]} · {x.title}</button>)}
          </p>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 16 }}>
          <ClientCard r={r} prof={prof} />
          {r.kind === 'check' && <ReportCard c={r.row as Check} onPublished={() => { onPatch({ row: { ...(r.row as Check), status: 'ready' } }); reloadClient() }} />}
          {client && <OfferCard clientKey={r.clientKey} userId={r.userId} initial={client.offer} preset={r.kind === 'order' ? (r.row as Order).items ?? [] : []} onSaved={reloadClient} />}
        </div>
        <div style={{ display: 'grid', gap: 16 }}>
          {client && <AppointmentsCard r={r} list={client.appointments} onChanged={async added => {
            if (added && (r.stage === 'new' || r.stage === 'contacted')) await changeStage('call_booked'); else reloadClient()
          }} />}
          {client && <Chat userId={r.userId} messages={client.messages} onSent={m => setClient(c => c && { ...c, messages: [...c.messages, m] })} />}
          {client && <Notes clientKey={r.clientKey} notes={client.notes} onAdded={() => reloadClient()} />}
          {client && <History items={client.activity} profiles={profiles} />}
        </div>
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
  profile: 'Google-профиль', website: 'Сайт', social: 'Соцсети', none: 'Ничего', referral: 'Рекомендации', google: 'Google', portals: 'Порталы', unknown: 'Не знает',
  calls: 'Больше звонков', service: 'Клиенты на услугу', region: 'Новый город/район', trust: 'Солиднее конкурентов',
  few: 'до 5', some: '5–15', many: 'больше 15',
}
const ql = (v: unknown) => (Array.isArray(v) ? v : v ? [v] : []).map(x => QUIZ_LABELS[String(x)] ?? String(x)).join(', ')
const str = (v: unknown) => (v === null || v === undefined ? '' : String(v))

function ClientCard({ r, prof }: { r: Request; prof?: Profile }) {
  const rows: [string, React.ReactNode][] = [
    ['Имя', prof?.name], ['E-mail', prof?.email ? <a href={`mailto:${prof.email}`}>{prof.email}</a> : null],
    ['Телефон', prof?.phone ? <a href={`tel:${prof.phone}`}>{prof.phone}</a> : null],
  ]
  if (r.kind === 'lead') {
    const l = r.row as Lead, a = l.answers as Record<string, unknown>
    const le = str((l as Lead & { email?: string }).email || a.email)
    rows.push(['E-mail (квиз)', le ? <a href={`mailto:${le}`}>{le}</a> : ''], ['Компания', str(a.firma)], ['Сфера', str(a.branche)], ['Город', str(a.ort)], ['Что есть', ql(a.have)],
      ['Откуда клиенты', ql(a.sources)], ['Цель', ql(a.goal)], ['Ещё заказов/мес', ql(a.capacity)], ['Советы квиза', (l.recommendations ?? []).join('; ')],
      ['Откуда пришёл', l.from_page], ['Запись на созвон', l.booking_clicked_at ? `нажал «Выбрать время» ${fmt(l.booking_clicked_at)}` : 'не нажимал'])
    if (!prof) rows.push(['Аккаунт', 'нет — контакт будет в записи Google Calendar'])
  }
  if (r.kind === 'order') {
    const o = r.row as Order, d = (o.details ?? {}) as Record<string, unknown>
    rows.push(['Пакет', (o.items ?? []).map(i => `${i.name} — ${i.price} € ${i.unit === 'einmalig' ? 'разово' : '/мес'}`).join('; ')],
      ['Компания', str(d.company)], ['Сфера', str(d.industry)], ['Город', str(d.city)], ['Сайт', str(d.website)],
      ['Цели', Array.isArray(d.goals) ? d.goals.join(', ') : ''], ['Что не так', str(d.problem)], ['Когда звонить', str(d.reach)],
      ['Телефон (анкета)', str(d.phone)], ['Откуда пришёл', o.source_page])
    if (!o.details) rows.push(['Анкета', 'клиент ещё не заполнил'])
  }
  if (r.kind === 'check') {
    const c = r.row as Check, p = c.place as Record<string, unknown>
    rows.push(['Компания', str(p.name)], ['Адрес', str(p.address)], ['Сфера', str(p.category)],
      ['Google', p.manual ? 'карточки нет (данные ввёл сам)' : `${p.rating ?? '—'} ★ · ${p.reviews ?? 0} отзывов`],
      ['Карта', p.mapsUrl ? <a href={String(p.mapsUrl)} target="_blank" rel="noreferrer">открыть в Google Maps</a> : null],
      ['Сайт', str(p.website)], ['Профили', (c.sources ?? []).filter(s => s.value).map(s => `${s.key}: ${s.value}`).join(', ')],
      ['Проверка', checkState(c)], ['Откуда пришёл', c.source_page])
  }
  return <section style={card}><h3 style={h3}>Клиент и компания</h3><Rows rows={rows} /></section>
}

type Draft = { channels?: Record<string, { score: number; summary: string; points: [string, string][] }>; recommendations?: [string, string, string][] }
const CHANNEL: Record<string, string> = { ai: 'KI-Suche', maps: 'Google Maps', search: 'Website & Search', social: 'Social Media' }

function ReportCard({ c, onPublished }: { c: Check; onPublished: () => void }) {
  const draft = c.report_draft as Draft | null
  const [busy, setBusy] = useState(false)
  return (
    <section style={card}>
      <h3 style={h3}>Отчёт проверки</h3>
      <p style={{ ...small, margin: '0 0 10px' }}>{checkState(c)}{c.audited_at ? ` · данные собраны ${fmt(c.audited_at)}` : ''}</p>
      {!draft && <p style={{ fontSize: 14, margin: 0 }}>Черновика пока нет: он появится, когда клиент подтвердит сайт и профили.</p>}
      {draft?.channels && Object.entries(draft.channels).map(([k, ch]) => (
        <div key={k} style={{ padding: '8px 0', borderTop: `1px solid ${line}` }}>
          <strong>{CHANNEL[k] ?? k}: {ch.score}/100</strong> <span style={small}>— {ch.summary}</span>
          <ul style={{ margin: '4px 0 0', paddingLeft: 18, fontSize: 13.5 }}>{ch.points.map(([m, t]) => <li key={t}>{m === 'ok' ? '✓' : m === 'warn' ? '!' : '✗'} {t}</li>)}</ul>
        </div>
      ))}
      {draft?.recommendations && <p style={{ fontSize: 13.5, margin: '8px 0 0' }}><strong>Рекомендации:</strong> {draft.recommendations.map(x => x[1]).join(' · ')}</p>}
      {draft && c.status !== 'ready' && (
        <div style={{ marginTop: 12 }}>
          <p style={{ ...small, margin: '0 0 8px' }}>Блок «KI-Suche» автоматически не считается — при необходимости допишите его в Table Editor до публикации.</p>
          <button type="button" className="btn btn-md btn-electric" disabled={busy} onClick={async () => { setBusy(true); if (await publishReport(c)) onPublished(); setBusy(false) }}>Опубликовать отчёт клиенту</button>
        </div>
      )}
    </section>
  )
}

function OfferCard({ clientKey, userId, initial, preset, onSaved }: { clientKey: string; userId: string | null; initial: Offer | null; preset: OfferItem[]; onSaved: () => void }) {
  const [items, setItems] = useState<OfferItem[]>(initial?.items ?? preset)
  const [note, setNote] = useState(initial?.note ?? '')
  const [status, setStatus] = useState<Offer['status']>(initial?.status ?? 'draft')
  const [custom, setCustom] = useState({ name: '', description: '', price: '', unit: 'pro Monat' as Unit })
  const [msg, setMsg] = useState('')
  const has = (id: string) => items.some(i => i.id === id)
  const toggle = (c: OfferItem) => setItems(xs => (has(c.id) ? xs.filter(x => x.id !== c.id) : [...xs, { id: c.id, name: c.name, price: c.price, unit: c.unit }]))
  const setPrice = (id: string, price: string) => setItems(xs => xs.map(x => (x.id === id ? { ...x, price: Number(price) || 0 } : x)))
  const addCustom = () => {
    if (!custom.name.trim()) return
    setItems(xs => [...xs, { id: 'custom-' + Date.now().toString(36), name: custom.name.trim(), description: custom.description.trim() || undefined, price: Number(custom.price) || 0, unit: custom.unit, custom: true }])
    setCustom({ name: '', description: '', price: '', unit: 'pro Monat' })
  }
  const save = async (next: Offer['status']) => {
    const r = await saveOffer({ client_key: clientKey, user_id: userId, items, note: note || null, status: next })
    if (r) { setStatus(r.status); setMsg(next === 'sent' ? 'Отмечено как отправленное.' : 'Сохранено.'); onSaved() } else setMsg('Не удалось сохранить.')
  }
  const groups = [...new Set(CATALOG.map(c => c.group))]
  const priceOf = (id: string) => items.find(i => i.id === id)?.price ?? 0
  return (
    <section style={card}>
      <h3 style={h3}>Предложение {status !== 'draft' && <span style={{ color: '#1F7A4A' }}>· {status === 'sent' ? 'отправлено' : 'принято'}</span>}</h3>
      {groups.map(g => (
        <div key={g} style={{ marginBottom: 10 }}>
          <p style={{ ...small, fontWeight: 700, margin: '0 0 4px' }}>{g}</p>
          {CATALOG.filter(c => c.group === g).map(c => (
            <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, padding: '3px 0' }}>
              <input type="checkbox" checked={has(c.id)} onChange={() => toggle(c)} />
              <span style={{ flex: 1 }}>{c.name}</span>
              {has(c.id)
                ? <input type="number" value={priceOf(c.id)} onChange={e => setPrice(c.id, e.target.value)} style={{ ...input, width: 90, padding: '5px 8px' }} aria-label={`Цена ${c.name}`} />
                : <span style={small}>{c.price} €</span>}
              <span style={{ ...small, width: 52 }}>{c.unit === 'einmalig' ? 'разово' : '/мес'}</span>
            </label>
          ))}
        </div>
      ))}
      {items.filter(i => i.custom).map(i => (
        <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, padding: '3px 0' }}>
          <span style={{ flex: 1 }}><strong>{i.name}</strong>{i.description ? <span style={small}> — {i.description}</span> : null}</span>
          <input type="number" value={i.price} onChange={e => setPrice(i.id, e.target.value)} style={{ ...input, width: 90, padding: '5px 8px' }} aria-label={`Цена ${i.name}`} />
          <span style={{ ...small, width: 52 }}>{i.unit === 'einmalig' ? 'разово' : '/мес'}</span>
          <button type="button" onClick={() => setItems(xs => xs.filter(x => x.id !== i.id))} style={{ border: 0, background: 'none', cursor: 'pointer', color: '#B3261E' }} aria-label="Удалить позицию">✕</button>
        </div>
      ))}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 10, padding: 10, borderRadius: 12, backgroundColor: '#F7F6F2' }}>
        <input style={input} placeholder="Своя позиция: название" value={custom.name} onChange={e => setCustom(c => ({ ...c, name: e.target.value }))} />
        <input style={input} placeholder="Описание" value={custom.description} onChange={e => setCustom(c => ({ ...c, description: e.target.value }))} />
        <input style={input} type="number" placeholder="Цена, €" value={custom.price} onChange={e => setCustom(c => ({ ...c, price: e.target.value }))} />
        <select style={input} value={custom.unit} onChange={e => setCustom(c => ({ ...c, unit: e.target.value as Unit }))}><option value="pro Monat">в месяц</option><option value="einmalig">разово</option></select>
        <button type="button" onClick={addCustom} disabled={!custom.name.trim()} className="btn btn-sm btn-outline-light" style={{ gridColumn: '1 / -1' }}>+ Добавить позицию</button>
      </div>
      <p style={{ fontSize: 15, fontWeight: 700, margin: '12px 0 6px' }}>Итого: {totals(items)}</p>
      <textarea style={{ ...input, minHeight: 60 }} placeholder="Комментарий к предложению" value={note} onChange={e => setNote(e.target.value)} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10, alignItems: 'center' }}>
        <button type="button" className="btn btn-sm btn-outline-light" onClick={() => save('draft')}>Сохранить черновик</button>
        <button type="button" className="btn btn-sm btn-electric" onClick={() => save('sent')} disabled={!items.length}>Отметить как отправленное</button>
        {msg && <span style={small}>{msg}</span>}
      </div>
    </section>
  )
}

function Chat({ userId, messages, onSent }: { userId: string | null; messages: Message[]; onSent: (m: Message) => void }) {
  const [text, setText] = useState(''), [busy, setBusy] = useState(false)
  if (!userId) return <section style={card}><h3 style={h3}>Переписка</h3><p style={{ fontSize: 14, margin: 0 }}>У клиента нет аккаунта — переписка появится после регистрации.</p></section>
  const send = async () => {
    if (!text.trim()) return
    setBusy(true)
    const m = await sendStaffMessage(userId, text.trim())
    setBusy(false)
    if (m) { onSent(m); setText('') }
  }
  return (
    <section style={card}>
      <h3 style={h3}>Переписка</h3>
      <div style={{ display: 'grid', gap: 8, maxHeight: 360, overflowY: 'auto', marginBottom: 10 }}>
        {messages.length === 0 && <p style={small}>Сообщений нет.</p>}
        {messages.map(m => (
          <div key={m.id} style={{ justifySelf: m.author === 'rag' ? 'end' : 'start', maxWidth: '85%', padding: '8px 11px', borderRadius: 12, backgroundColor: m.author === 'rag' ? '#EEEBFF' : '#F2F1EC', fontSize: 14, whiteSpace: 'pre-wrap' }}>
            {m.body}<div style={{ ...small, fontSize: 11.5, marginTop: 3 }}>{m.author === 'rag' ? 'Команда' : 'Клиент'} · {fmt(m.created_at)}</div>
          </div>
        ))}
      </div>
      <textarea style={{ ...input, minHeight: 70 }} placeholder="Ответ клиенту — он увидит его в кабинете" value={text} onChange={e => setText(e.target.value)} />
      <button type="button" className="btn btn-sm btn-electric" style={{ marginTop: 8 }} disabled={busy || !text.trim()} onClick={send}>Отправить</button>
    </section>
  )
}

function Notes({ clientKey, notes, onAdded }: { clientKey: string; notes: Note[]; onAdded: () => void }) {
  const [text, setText] = useState('')
  const add = async () => { if (!text.trim()) return; if (await addNote(clientKey, text.trim())) { setText(''); onAdded() } }
  return (
    <section style={card}>
      <h3 style={h3}>Заметки (клиент не видит)</h3>
      <textarea style={{ ...input, minHeight: 56 }} placeholder="Например: звонить после 17:00" value={text} onChange={e => setText(e.target.value)} />
      <button type="button" className="btn btn-sm btn-outline-light" style={{ marginTop: 8 }} onClick={add} disabled={!text.trim()}>Добавить заметку</button>
      <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
        {notes.map(n => <div key={n.id} style={{ fontSize: 14, borderTop: `1px solid ${line}`, paddingTop: 8, whiteSpace: 'pre-wrap' }}>{n.body}<div style={small}>{fmt(n.created_at)}</div></div>)}
      </div>
    </section>
  )
}

const TABLE_RU: Record<string, string> = { leads: 'квиз', orders: 'пакет', checks: 'проверка' }
function activityText(a: Activity, profiles: Profile[]): string {
  const d = a.detail ?? {}
  switch (a.kind) {
    case 'lead_created': return 'Прошёл квиз'
    case 'lead_claimed': return 'Зарегистрировался — квиз привязан к аккаунту'
    case 'booking_clicked': return 'Нажал «Выбрать время» (запись на созвон)'
    case 'check_created': return `Начал проверку видимости: ${str(d.name)}`
    case 'sources_confirmed': return 'Подтвердил сайт и профили'
    case 'report_published': return 'Отчёт опубликован'
    case 'order_created': return `Заявка на пакет: ${Array.isArray(d.items) ? (d.items as { name: string }[]).map(i => i.name).join(' + ') : ''}`
    case 'order_details': return 'Заполнил анкету о компании'
    case 'message': return d.author === 'rag' ? 'Сообщение от команды' : 'Сообщение от клиента'
    case 'note': return 'Добавлена заметка'
    case 'offer_sent': return 'Предложение отмечено как отправленное'
    case 'offer_accepted': return 'Клиент принял предложение'
    case 'appointment': return `Назначена встреча: ${str(d.title)}, ${d.at ? fmtDT(str(d.at)) : ''}`
    case 'appointment_changed': return `Встреча «${str(d.title)}»: ${d.status === 'cancelled' ? 'отменена' : d.status === 'done' ? 'состоялась' : 'перенесена на ' + (d.at ? fmtDT(str(d.at)) : '')}`
    case 'assigned': return d.to ? `Ответственный (${TABLE_RU[str(d.type)] ?? ''}): ${staffName(profiles, str(d.to))}` : `Ответственный снят (${TABLE_RU[str(d.type)] ?? ''})`
    case 'stage': return `Статус (${TABLE_RU[str(d.type)] ?? ''}): ${stageLabel(d.stage as Stage)}`
    default: return a.kind
  }
}

function History({ items, profiles }: { items: Activity[]; profiles: Profile[] }) {
  return (
    <section style={card}>
      <h3 style={h3}>История</h3>
      {items.length === 0 && <p style={small}>Пока пусто.</p>}
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
        {items.map(a => <li key={a.id} style={{ fontSize: 13.5 }}><span style={small}>{fmt(a.created_at)}</span> — {activityText(a, profiles)}{a.actor ? <span style={small}> · {staffName(profiles, a.actor)}</span> : null}</li>)}
      </ul>
    </section>
  )
}


// ── Встречи с клиентом ──────────────────────────────────────────────────────
const fmtDT = (iso: string) => new Date(iso).toLocaleString('ru-RU', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
const APPT_STATUS: [Appointment['status'], string][] = [['planned', 'Запланирована'], ['done', 'Состоялась'], ['cancelled', 'Отменена']]
function AppointmentsCard({ r, list, onChanged }: { r: Request; list: Appointment[]; onChanged: (added: boolean) => void }) {
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [err, setErr] = useState('')
  const [f, setF] = useState({ when: '', duration: '30', title: 'Erstgespräch', location: '', note: '' })
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF(x => ({ ...x, [k]: e.target.value }))
  const add = async (e: React.FormEvent) => {
    e.preventDefault(); setErr('')
    if (!f.when) { setErr('Укажите дату и время.'); return }
    setBusy(true)
    const ok = await addAppointment({ client_key: r.clientKey, user_id: r.userId, starts_at: new Date(f.when).toISOString(), duration_min: Number(f.duration) || 30, title: f.title, location: f.location, note: f.note })
    setBusy(false)
    if (!ok) { setErr('Не удалось сохранить.'); return }
    setOpen(false); setF({ when: '', duration: '30', title: 'Erstgespräch', location: '', note: '' }); onChanged(true)
  }
  return (
    <section style={card}>
      <h3 style={h3}>Встречи</h3>
      {!r.userId && <p style={{ ...small, margin: '0 0 10px', color: '#B26B00' }}>У клиента ещё нет аккаунта — встречу он увидит после регистрации.</p>}
      {list.length === 0 && !open && <p style={{ ...small, margin: '0 0 10px' }}>Встреч пока нет.</p>}
      {list.map(a => (
        <div key={a.id} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', padding: '8px 0', borderTop: `1px solid ${line}`, opacity: a.status === 'cancelled' ? 0.55 : 1 }}>
          <span style={{ flex: 1, minWidth: 180, fontSize: 14 }}><strong>{fmtDT(a.starts_at)}</strong> · {a.duration_min} мин · {a.title}
            {a.location ? <><br /><span style={small}>{a.location}</span></> : null}</span>
          <select value={a.status} onChange={async e => { if (await setAppointmentStatus(a.id, e.target.value as Appointment['status'])) onChanged(false) }} style={{ ...input, width: 150, padding: '5px 8px' }}>
            {APPT_STATUS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <button type="button" style={{ ...linkBtn, fontSize: 12.5, color: '#A21C22' }} onClick={async () => { if (confirm('Удалить встречу? Клиент её больше не увидит.') && await deleteAppointment(a.id)) onChanged(false) }}>Удалить</button>
        </div>
      ))}
      {open ? (
        <form onSubmit={add} style={{ display: 'grid', gap: 8, marginTop: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: 8 }}>
            <input type="datetime-local" value={f.when} onChange={set('when')} style={input} required aria-label="Дата и время" />
            <select value={f.duration} onChange={set('duration')} style={input} aria-label="Длительность">{['15', '20', '30', '45', '60', '90'].map(m => <option key={m} value={m}>{m} мин</option>)}</select>
          </div>
          <input style={input} value={f.title} onChange={set('title')} placeholder="Название для клиента (по-немецки)" aria-label="Название" />
          <input style={input} value={f.location} onChange={set('location')} placeholder="Ссылка на видеозвонок, телефон или адрес" aria-label="Где" />
          <textarea style={{ ...input, minHeight: 60, resize: 'vertical' }} value={f.note} onChange={set('note')} placeholder="Комментарий для клиента (по-немецки, необязательно)" aria-label="Комментарий" />
          {err && <p style={{ ...small, color: '#A21C22', margin: 0 }}>{err}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-sm btn-electric" disabled={busy}>{busy ? 'Сохранение…' : 'Добавить встречу'}</button>
            <button type="button" className="btn btn-sm btn-outline-light" onClick={() => setOpen(false)}>Отмена</button>
          </div>
          <p style={{ ...small, margin: 0 }}>Клиент увидит встречу в кабинете (вкладка «Termine» и «Следующий шаг»). Статус «Новая/Связались» сменится на «Созвон назначен».</p>
        </form>
      ) : <button type="button" className="btn btn-sm btn-outline-light" style={{ marginTop: 8 }} onClick={() => setOpen(true)}>+ Назначить встречу</button>}
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
    if (!urlOk(f.photo) || !urlOk(f.booking)) { setMsg('Ссылки должны начинаться с https://'); return }
    setBusy(true); setMsg('')
    const err = await saveMyProfile(f)
    setBusy(false); setMsg(err ? `Не удалось сохранить: ${err}` : 'Сохранено. Клиенты увидят изменения при следующем входе.')
  }
  if (!loaded) return <p style={{ padding: 20, color: muted }}>Загрузка…</p>
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: 20, display: 'grid', gap: 16 }}>
      <section style={card}>
        <h3 style={h3}>Мой профиль</h3>
        <p style={{ ...small, margin: '0 0 14px' }}>Эти данные клиент видит в кабинете в карточке «Ваш менеджер» — у всех заявок, где вы ответственный.</p>
        <form onSubmit={save} style={{ display: 'grid', gap: 10 }}>
          <label style={small}>Имя<input style={input} value={f.name} onChange={set('name')} required /></label>
          <label style={small}>Должность (по-немецки, напр. «Projektleiterin»)<input style={input} value={f.title} onChange={set('title')} /></label>
          <label style={small}>Фото — ссылка на картинку (https://…)<input style={input} value={f.photo} onChange={set('photo')} placeholder="https://…" /></label>
          <label style={small}>Ссылка для записи на созвон (Calendly и т. п.). Пусто — общая ссылка сайта<input style={input} value={f.booking} onChange={set('booking')} placeholder="https://…" /></label>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-md btn-electric" disabled={busy}>{busy ? 'Сохранение…' : 'Сохранить'}</button>
            {msg && <span style={small}>{msg}</span>}
          </div>
        </form>
      </section>
      <section style={{ ...card, display: 'flex', gap: 14, alignItems: 'center' }}>
        {f.photo && urlOk(f.photo)
          ? <img src={f.photo} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }} />
          : <span style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: 'var(--brand-soft)', color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{(f.name || 'R').slice(0, 1).toUpperCase()}</span>}
        <span><span style={small}>{f.title || 'Ihr Ansprechpartner'}</span><br /><strong>{f.name || '—'}</strong></span>
        <span style={{ ...small, marginLeft: 'auto' }}>превью для клиента</span>
      </section>
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
  const create = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setLink(''); setCopied(false)
    const r = await createInvite(email, role)
    if (r.error) setErr(r.error); else { setLink(r.link!); setEmail(''); reload() }
  }
  const copy = async () => { try { await navigator.clipboard.writeText(link); setCopied(true) } catch { setCopied(false) } }
  const change = async (p: Profile, r: 'client' | 'manager' | 'admin') => {
    if (r === 'client' && !confirm(`Закрыть доступ для ${p.email}?`)) return
    const e = await setRole(p.id, r); if (e) alert(e); reload()
  }
  const inviteState = (i: Invite) => i.used_at ? `принято ${fmt(i.used_at)}` : i.revoked_at ? 'отменено' : new Date(i.expires_at) < new Date() ? 'истекло' : `действует до ${fmt(i.expires_at)}`
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: 20, display: 'grid', gap: 16 }}>
      <section style={card}>
        <h3 style={h3}>Пригласить в команду</h3>
        <form onSubmit={create} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input style={{ ...input, flex: '1 1 240px', width: 'auto' }} type="email" required placeholder="E-mail сотрудника" value={email} onChange={e => setEmail(e.target.value)} />
          <select style={{ ...input, width: 160 }} value={role} onChange={e => setRoleSel(e.target.value as 'manager' | 'admin')}><option value="manager">Менеджер</option><option value="admin">Админ</option></select>
          <button className="btn btn-md btn-electric">Создать ссылку</button>
        </form>
        <p style={{ ...small, margin: '8px 0 0' }}>Ссылка одноразовая, действует 72 часа и только для этого e-mail. Отправьте её сотруднику сами (мессенджер, почта).</p>
        {err && <p role="alert" style={{ color: '#B3261E', fontSize: 14, margin: '10px 0 0' }}>{err}</p>}
        {link && (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: '#F4F2FF', display: 'grid', gap: 8 }}>
            <code style={{ fontSize: 13, overflowWrap: 'anywhere' }}>{link}</code>
            <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button type="button" className="btn btn-sm btn-electric" onClick={copy}>{copied ? 'Скопировано ✓' : 'Скопировать ссылку'}</button>
              <span style={small}>Ссылка показывается только сейчас — потом её не восстановить, только создать новую.</span>
            </span>
          </div>
        )}
      </section>
      <section style={card}>
        <h3 style={h3}>Сотрудники</h3>
        {!team && <p style={small}>Загрузка…</p>}
        {team?.staff.map(p => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: `1px solid ${line}`, flexWrap: 'wrap' }}>
            <span style={{ flex: 1, minWidth: 200 }}><strong>{p.name || p.email}</strong><br /><span style={small}>{p.email}</span></span>
            {p.id === me ? <span style={small}>{p.role === 'admin' ? 'Админ' : 'Менеджер'} · это вы</span> : (
              <>
                <select style={{ ...input, width: 140 }} value={p.role} onChange={e => change(p, e.target.value as 'manager' | 'admin')}><option value="manager">Менеджер</option><option value="admin">Админ</option></select>
                <button type="button" onClick={() => change(p, 'client')} style={{ ...linkBtn, color: '#B3261E' }}>Закрыть доступ</button>
              </>
            )}
          </div>
        ))}
      </section>
      <section style={card}>
        <h3 style={h3}>Ссылки-приглашения</h3>
        {team && team.invites.length === 0 && <p style={small}>Пока не создавались.</p>}
        {team?.invites.map(i => (
          <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: `1px solid ${line}`, flexWrap: 'wrap', fontSize: 14 }}>
            <span style={{ flex: 1, minWidth: 200 }}>{i.email} · {i.role === 'admin' ? 'Админ' : 'Менеджер'}<br /><span style={small}>создано {fmt(i.created_at)} · {inviteState(i)}</span></span>
            {!i.used_at && !i.revoked_at && new Date(i.expires_at) > new Date() && <button type="button" onClick={async () => { await revokeInvite(i.id); reload() }} style={{ ...linkBtn, color: '#B3261E' }}>Отменить</button>}
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
      if (r === 'exists') { setMode('login'); setErr('Для этого e-mail уже есть аккаунт — войдите с его паролем.'); setBusy(false); return }
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
        <p style={{ fontWeight: 800, fontSize: 20, margin: 0 }}>RAG<span style={{ color: accent }}>.</span> · приглашение в команду</p>
        {!token && <p style={{ margin: 0 }}>В ссылке нет кода приглашения. Попросите новую ссылку.</p>}
        {token && email === undefined && <p style={small}>Загрузка…</p>}
        {token && email && (
          <>
            <p style={{ margin: 0, fontSize: 14.5 }}>Вы вошли как <strong>{email}</strong>.</p>
            <button type="button" className="btn btn-md btn-electric" disabled={busy} onClick={async () => { setBusy(true); setErr(''); await accept(); setBusy(false) }}>Принять приглашение</button>
            <button type="button" style={{ ...linkBtn, color: ink, fontSize: 13 }} onClick={async () => { await signOutStaff(); setEmailState(null) }}>Это не мой e-mail — войти под другим</button>
          </>
        )}
        {token && email === null && (
          <form onSubmit={submit} style={{ display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['new', 'login'] as const).map(m => (
                <button key={m} type="button" onClick={() => { setMode(m); setErr('') }}
                  style={{ flex: 1, padding: '8px', borderRadius: 10, border: `1px solid ${mode === m ? accent : line}`, backgroundColor: mode === m ? '#F4F2FF' : '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600 }}>
                  {m === 'new' ? 'Создать аккаунт' : 'У меня есть аккаунт'}
                </button>
              ))}
            </div>
            {mode === 'new' && <input style={input} placeholder="Имя" value={f.name} onChange={set('name')} autoComplete="name" required />}
            <input style={input} type="email" placeholder="E-mail, на который выписано приглашение" value={f.email} onChange={set('email')} autoComplete="username" required />
            <input style={input} type="password" placeholder={mode === 'new' ? 'Придумайте пароль (мин. 8 символов)' : 'Пароль'} value={f.pw} onChange={set('pw')} autoComplete={mode === 'new' ? 'new-password' : 'current-password'} minLength={mode === 'new' ? 8 : undefined} required />
            <button className="btn btn-md btn-electric" disabled={busy}>{busy ? 'Подождите…' : mode === 'new' ? 'Создать аккаунт и войти' : 'Войти и принять'}</button>
          </form>
        )}
        {err && <p role="alert" style={{ color: '#B3261E', fontSize: 14, margin: 0 }}>{err}</p>}
      </div>
    </div>
  )
}
