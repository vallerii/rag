// Kundenbereich: Termine, Kontaktdaten (Name/Telefon), Konto (Passwort, Löschen).
import { useState } from 'react'
import { dateLocale } from '../i18n'
import { changePassword, deleteMyAccount, saveMyContact, type Appointment, type MyContact } from './data'

const card: React.CSSProperties = { backgroundColor: '#fff', borderRadius: 22, border: '1px solid var(--line-soft)', padding: 'clamp(20px, 2.6vw, 28px)' }
const field: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1px solid rgba(7,7,12,0.14)', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', outline: 'none', color: 'var(--ink)', backgroundColor: '#fff' }
const label: React.CSSProperties = { display: 'grid', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--muted)' }
const kick = (t: string, color = 'var(--electric)') => <p className="kick" style={{ fontSize: 12, color, marginBottom: 10 }}>{t}</p>
const ok = (t: string) => <p role="status" style={{ color: '#0F7A3E', fontSize: 14, margin: 0 }}>{t}</p>
const bad = (t: string) => <p role="alert" style={{ color: '#A21C22', fontSize: 14, margin: 0 }}>{t}</p>

export const fmtWhen = (iso: string) => new Date(iso).toLocaleString(dateLocale(), { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
const isLink = (s: string | null) => !!s && /^https?:\/\//.test(s)

/** Nächster geplanter Termin in der Zukunft (oder läuft gerade). */
export function upcoming(list: Appointment[]): Appointment | null {
  const now = Date.now()
  return list.find(a => a.status === 'planned' && new Date(a.starts_at).getTime() + a.duration_min * 60000 > now) ?? null
}

function AppointmentRow({ a, highlight }: { a: Appointment; highlight?: boolean }) {
  const state = a.status === 'cancelled' ? 'Abgesagt' : a.status === 'done' ? 'Stattgefunden' : null
  return (
    <div style={{ display: 'flex', gap: 16, padding: '16px 0', borderTop: '1px solid var(--line-soft)', alignItems: 'flex-start', flexWrap: 'wrap', opacity: a.status === 'cancelled' ? 0.55 : 1 }}>
      <div style={{ flex: 1, minWidth: 220 }}>
        <p style={{ fontWeight: 700, fontSize: 16, margin: '0 0 4px', textDecoration: a.status === 'cancelled' ? 'line-through' : 'none' }}>{a.title}</p>
        <p style={{ fontSize: 14, margin: 0, color: highlight ? 'var(--electric)' : 'var(--ink)', fontWeight: 600 }}>
          <span>{fmtWhen(a.starts_at)}</span> · <span>{a.duration_min}</span> <span>Min.</span>
        </p>
        {a.location && !isLink(a.location) && <p style={{ fontSize: 13.5, color: 'var(--muted)', margin: '4px 0 0' }}>{a.location}</p>}
        {a.note && <p style={{ fontSize: 13.5, color: 'var(--muted)', margin: '6px 0 0', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{a.note}</p>}
      </div>
      {state
        ? <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{state}</span>
        : isLink(a.location) && <a href={a.location!} target="_blank" rel="noopener noreferrer" className="btn btn-md btn-electric">Zum Videogespräch <span className="arw">→</span></a>}
    </div>
  )
}

export function AppointmentsPanel({ list, booking, onWrite }: { list: Appointment[]; booking: string | null; onWrite: () => void }) {
  const next = upcoming(list)
  const later = list.filter(a => a !== next && a.status === 'planned' && new Date(a.starts_at).getTime() > Date.now())
  const past = list.filter(a => a !== next && !later.includes(a)).reverse()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <section style={card}>
        {kick('Termine')}
        {next ? (
          <>
            <p className="display" style={{ fontSize: 'clamp(22px, 2.4vw, 28px)', margin: '0 0 6px' }}>Ihr nächster Termin</p>
            <AppointmentRow a={next} highlight />
          </>
        ) : (
          <>
            <p className="display" style={{ fontSize: 'clamp(22px, 2.4vw, 28px)', margin: '0 0 8px' }}>Noch kein Termin geplant</p>
            <p style={{ fontSize: 14.5, color: 'var(--muted)', lineHeight: 1.65, margin: '0 0 18px', maxWidth: 620 }}>
              {booking ? 'Wählen Sie eine freie Zeit — der Termin erscheint danach hier.' : 'Schreiben Sie uns, wann es Ihnen passt — wir tragen den Termin hier ein.'}
            </p>
          </>
        )}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: next ? 16 : 0 }}>
          {booking && <a href={booking} target="_blank" rel="noopener noreferrer" className={next ? 'btn btn-md btn-outline-light' : 'btn btn-md btn-electric'}>{next ? 'Weiteren Termin vereinbaren' : 'Termin vereinbaren'} <span className="arw">→</span></a>}
          <button type="button" onClick={onWrite} className="btn btn-md btn-outline-light">{next ? 'Termin verschieben' : 'Nachricht schreiben'}</button>
        </div>
      </section>
      {later.length > 0 && <section style={card}>{kick('Weitere Termine', 'var(--muted)')}{later.map(a => <AppointmentRow key={a.id} a={a} />)}</section>}
      {past.length > 0 && <section style={card}>{kick('Vergangene Termine', 'var(--muted)')}{past.map(a => <AppointmentRow key={a.id} a={a} />)}</section>}
    </div>
  )
}

/** Name + Telefon — im Tab «Konto» und unter «Unternehmen». */
export function ContactForm({ contact, onSaved, title = 'Ansprechpartner' }: { contact: MyContact; onSaved: (c: MyContact) => void; title?: string }) {
  const [f, setF] = useState(contact), [busy, setBusy] = useState(false), [msg, setMsg] = useState<'ok' | 'err' | ''>('')
  const phoneOk = !f.phone.trim() || /^[+0-9][0-9 ()/.-]{5,}$/.test(f.phone.trim())
  const dirty = f.name !== contact.name || f.phone !== contact.phone
  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phoneOk || busy) return
    setBusy(true); setMsg('')
    const r = await saveMyContact(f)
    setBusy(false); setMsg(r ? 'ok' : 'err')
    if (r) onSaved({ name: f.name.trim(), phone: f.phone.trim() })
  }
  return (
    <form onSubmit={save} style={{ ...card, display: 'grid', gap: 14 }}>
      <div>{kick(title)}<p style={{ fontSize: 14, color: 'var(--muted)', margin: 0, lineHeight: 1.6 }}>Unter dieser Nummer rufen wir Sie für Rückfragen und vereinbarte Termine an.</p></div>
      <label style={label}>Ihr Name<input style={field} value={f.name} onChange={e => { setF({ ...f, name: e.target.value }); setMsg('') }} autoComplete="name" maxLength={120} /></label>
      <label style={label}>Telefon<input style={field} type="tel" value={f.phone} onChange={e => { setF({ ...f, phone: e.target.value }); setMsg('') }} autoComplete="tel" placeholder="+49 …" maxLength={40} /></label>
      {!phoneOk && bad('Bitte eine gültige Telefonnummer eingeben.')}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="submit" className="btn btn-md btn-electric" disabled={busy || !dirty || !phoneOk} style={{ opacity: dirty ? 1 : 0.5 }}>{busy ? 'Wird gespeichert…' : 'Speichern'}</button>
        {msg === 'ok' && ok('Gespeichert.')}
        {msg === 'err' && bad('Das Speichern hat nicht geklappt. Bitte versuchen Sie es noch einmal.')}
      </div>
    </form>
  )
}

export function AccountPanel({ email, contact, onContact }: { email: string; contact: MyContact; onContact: (c: MyContact) => void }) {
  const [pw, setPw] = useState({ cur: '', next: '' }), [pwBusy, setPwBusy] = useState(false), [pwMsg, setPwMsg] = useState<'' | 'ok' | 'wrong' | 'error'>('')
  const [del, setDel] = useState(false), [sure, setSure] = useState(false), [delBusy, setDelBusy] = useState(false), [delErr, setDelErr] = useState(false)
  const changePw = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pw.next.length < 8 || pwBusy) return
    setPwBusy(true); setPwMsg('')
    const r = await changePassword(email, pw.cur, pw.next)
    setPwBusy(false); setPwMsg(r)
    if (r === 'ok') setPw({ cur: '', next: '' })
  }
  const remove = async () => {
    setDelBusy(true); setDelErr(false)
    const r = await deleteMyAccount()
    if (r) { window.location.href = '/'; return }
    setDelBusy(false); setDelErr(true)
  }
  return (
    <div className="cab-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18, alignItems: 'start' }}>
      <div style={{ display: 'grid', gap: 18 }}>
        <section style={card}>
          {kick('Anmeldung')}
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 4px' }}>E-Mail</p>
          <p style={{ fontWeight: 600, fontSize: 15, margin: 0, overflowWrap: 'anywhere' }}>{email}</p>
        </section>
        <ContactForm contact={contact} onSaved={onContact} title="Kontaktdaten" />
      </div>
      <div style={{ display: 'grid', gap: 18 }}>
        <form onSubmit={changePw} style={{ ...card, display: 'grid', gap: 14 }}>
          {kick('Passwort ändern')}
          <label style={label}>Aktuelles Passwort<input style={field} type="password" value={pw.cur} onChange={e => setPw({ ...pw, cur: e.target.value })} autoComplete="current-password" required /></label>
          <label style={label}>Neues Passwort<input style={field} type="password" value={pw.next} onChange={e => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" required /></label>
          <p style={{ fontSize: 12.5, margin: '-6px 2px 0', color: pw.next.length >= 8 ? '#0F7A3E' : 'var(--muted)' }}>Mindestens 8 Zeichen</p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <button type="submit" className="btn btn-md btn-electric" disabled={pwBusy || pw.next.length < 8 || !pw.cur}>{pwBusy ? 'Wird gespeichert…' : 'Passwort ändern'}</button>
            {pwMsg === 'ok' && ok('Passwort geändert.')}
            {pwMsg === 'wrong' && bad('Das aktuelle Passwort stimmt nicht.')}
            {pwMsg === 'error' && bad('Das hat nicht geklappt. Bitte versuchen Sie es noch einmal.')}
          </div>
        </form>
        <section style={{ ...card, borderColor: '#F3C7C9' }}>
          {kick('Konto löschen', '#A21C22')}
          <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 14px' }}>Wir löschen Ihr Konto mit allen Daten: Check, Bericht, Anfragen, Nachrichten, Angebote und Termine. Das lässt sich nicht rückgängig machen.</p>
          {!del ? (
            <button type="button" className="btn btn-md btn-outline-light" onClick={() => setDel(true)}>Konto löschen…</button>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, lineHeight: 1.5, cursor: 'pointer' }}>
                <input type="checkbox" checked={sure} onChange={e => setSure(e.target.checked)} style={{ marginTop: 3 }} />
                <span>Ja, mein Konto und alle Daten endgültig löschen.</span>
              </label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button type="button" onClick={remove} disabled={!sure || delBusy} className="btn btn-md" style={{ backgroundColor: '#A21C22', color: '#fff', opacity: sure ? 1 : 0.45 }}>{delBusy ? 'Wird gelöscht…' : 'Endgültig löschen'}</button>
                <button type="button" className="btn btn-md btn-outline-light" onClick={() => { setDel(false); setSure(false) }}>Abbrechen</button>
              </div>
              {delErr && bad('Das Löschen hat nicht geklappt. Bitte schreiben Sie uns — wir erledigen das für Sie.')}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
