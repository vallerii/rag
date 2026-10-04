// Kundenbereich: Ansprechpartner, Angebot des Teams, «Ihr nächster Schritt».
import { useEffect, useRef, useState } from 'react'
import { BOOKING_READY, BOOKING_URL } from '../config'
import { acceptOffer, initials, orderTotal, type CheckRow, type ClientOffer, type Manager, type Report } from './data'

const card: React.CSSProperties = { backgroundColor: '#fff', borderRadius: 22, border: '1px solid var(--line-soft)', padding: 'clamp(20px, 2.6vw, 28px)' }
const kick = (t: string, color = 'var(--electric)') => <p className="kick" style={{ fontSize: 12, color, marginBottom: 10 }}>{t}</p>

/** Terminlink: eigener Link des Ansprechpartners, sonst der allgemeine (src/config.ts). */
export function bookingLink(m: Manager | null): string | null {
  if (m?.booking_url && /^https?:\/\//.test(m.booking_url)) return m.booking_url
  return BOOKING_READY ? BOOKING_URL : null
}

/** Termin-Button, solange die Buchung noch nicht offen ist: sichtbar, aber gesperrt, mit Hinweis warum. */
export function LockedBooking({ hint, size = 'md' }: { hint: string; size?: 'md' | 'lg' }) {
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
      <button type="button" disabled aria-disabled="true" className={`btn btn-${size} btn-electric`} style={{ opacity: 0.4, cursor: 'not-allowed', boxShadow: 'none' }}>Termin vereinbaren</button>
      <span style={{ fontSize: 12.5, color: 'var(--muted)', maxWidth: 260, lineHeight: 1.45 }}>{hint}</span>
    </span>
  )
}

export function ManagerCard({ manager, onWrite, canBook, lockedHint }: { manager: Manager | null; onWrite: () => void; canBook: boolean; lockedHint: string }) {
  const link = canBook ? bookingLink(manager) : null
  const name = manager?.name || 'Ihr RAG-Team'
  return (
    <section style={{ ...card, display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
      {manager?.photo_url
        ? <img src={manager.photo_url} alt="" width={64} height={64} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
        : <span aria-hidden style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'var(--brand-soft)', color: 'var(--electric)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20, flexShrink: 0 }}>{manager?.name ? initials(manager.name) : 'R'}</span>}
      <div style={{ flex: 1, minWidth: 200 }}>
        {kick(manager ? (manager.title || 'Ihr Ansprechpartner') : 'Ihr Ansprechpartner')}
        <p className="display" style={{ fontSize: 20, margin: '0 0 4px' }}>{name}</p>
        <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0, lineHeight: 1.55 }}>
          {manager ? 'Betreut Ihr Projekt persönlich — von der Analyse bis zur Umsetzung.' : 'Sobald sich jemand aus dem Team Ihrer Anfrage annimmt, sehen Sie hier Ihren persönlichen Ansprechpartner.'}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {link ? <a href={link} target="_blank" rel="noopener noreferrer" className="btn btn-md btn-electric">Termin vereinbaren <span className="arw">→</span></a>
          : !canBook && <LockedBooking hint={lockedHint} />}
        <button type="button" onClick={onWrite} className="btn btn-md btn-outline-light">Nachricht schreiben</button>
      </div>
    </section>
  )
}

export function OfferPanel({ offer, onAccepted }: { offer: ClientOffer; onAccepted: (o: ClientOffer) => void }) {
  const [busy, setBusy] = useState(false), [err, setErr] = useState(false)
  const accepted = offer.status === 'accepted'
  const accept = async () => {
    setBusy(true); setErr(false)
    const ok = await acceptOffer(offer.id)
    setBusy(false)
    if (ok) onAccepted({ ...offer, status: 'accepted' }); else setErr(true)
  }
  return (
    <section style={{ ...card, borderLeft: accepted ? '4px solid #3DDC84' : '4px solid var(--electric)' }}>
      {kick(accepted ? 'Angebot angenommen' : 'Ihr Angebot')}
      <h2 className="display" style={{ fontSize: 'clamp(22px, 2.4vw, 30px)', lineHeight: 1.15, margin: '0 0 16px' }}>
        {accepted ? 'Danke — wir starten mit der Umsetzung.' : 'Das schlagen wir Ihnen vor'}
      </h2>
      <div>
        {offer.items.map(i => (
          <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '12px 0', borderTop: '1px solid var(--line-soft)' }}>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontWeight: 600, fontSize: 15 }}>{i.name}</span>
              {i.description && <span style={{ display: 'block', fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.5 }}>{i.description}</span>}
            </span>
            <span style={{ whiteSpace: 'nowrap', fontWeight: 600, fontSize: 15 }}>{i.price} € <span style={{ fontWeight: 400, fontSize: 13, color: 'var(--muted)' }}>{i.unit}</span></span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '14px 0 0', borderTop: '1px solid var(--line)', fontWeight: 700, fontSize: 16 }}>
          <span>Gesamt</span><span>{orderTotal(offer.items)}</span>
        </div>
      </div>
      {offer.note && <p style={{ fontSize: 14.5, lineHeight: 1.65, color: 'var(--muted)', margin: '16px 0 0', whiteSpace: 'pre-wrap' }}>{offer.note}</p>}
      {!accepted && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 20 }}>
          <button type="button" className="btn btn-lg btn-electric" onClick={accept} disabled={busy}>{busy ? 'Einen Moment…' : 'Angebot annehmen'} <span className="arw">→</span></button>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>Fragen dazu? Schreiben Sie uns oder vereinbaren Sie einen Termin.</span>
        </div>
      )}
      {err && <p role="alert" style={{ color: '#A21C22', fontSize: 14, margin: '12px 0 0' }}>Das hat nicht geklappt. Bitte versuchen Sie es noch einmal.</p>}
    </section>
  )
}

type StepAction = { label: string; href?: string; onClick?: () => void }
/** «Ihr nächster Schritt»: nur Text + Textlinks. Buttons (Termin, Nachricht) sitzen in der Karte des Ansprechpartners. */
export type NextStep = { title: string; text: React.ReactNode; links?: StepAction[] }

const linkStyle: React.CSSProperties = { background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14.5, fontWeight: 600, color: 'var(--electric)', display: 'inline-flex', alignItems: 'center', gap: 6 }

export function NextStepCard({ step }: { step: NextStep }) {
  return (
    <section style={{ ...card, borderLeft: '4px solid var(--electric)' }}>
      {kick('Ihr nächster Schritt')}
      <p className="display" style={{ fontSize: 'clamp(20px, 2.2vw, 26px)', lineHeight: 1.2, margin: '0 0 8px' }}>{step.title}</p>
      <p style={{ fontSize: 14.5, lineHeight: 1.65, color: 'var(--muted)', margin: 0, maxWidth: 680 }}>{step.text}</p>
      {!!step.links?.length && (
        <p style={{ display: 'flex', gap: 22, flexWrap: 'wrap', margin: '14px 0 0' }}>
          {step.links.map(a => a.href
            ? <a key={a.label} href={a.href} target="_blank" rel="noopener noreferrer" className="ul" style={linkStyle}>{a.label} <span aria-hidden className="arw">→</span></a>
            : <button key={a.label} type="button" onClick={a.onClick} className="ul" style={linkStyle}>{a.label} <span aria-hidden className="arw">→</span></button>)}
        </p>
      )}
    </section>
  )
}

/** Empfehlung des Ansprechpartners aus dem Bericht: womit starten. */
export function RecommendedCard({ rec, booking, onWrite }: { rec: NonNullable<Report['recommended']>; booking: string | null; onWrite: () => void }) {
  return (
    <section className="on-brand" style={{ ...card, backgroundColor: 'var(--electric)', color: '#fff', border: 'none', display: 'flex', gap: 24, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
      <div style={{ maxWidth: 640 }}>
        {kick('Unsere Empfehlung für den Start', '#C9C2FF')}
        <p className="display" style={{ fontSize: 'clamp(22px, 2.4vw, 30px)', lineHeight: 1.15, margin: '0 0 10px' }}>{rec.name}</p>
        {(rec.why || rec.description) && <p style={{ fontSize: 14.5, lineHeight: 1.7, color: '#DCD8FF', margin: 0, whiteSpace: 'pre-wrap' }}>{rec.why || rec.description}</p>}
      </div>
      <div>
        <p className="display" style={{ fontSize: 30, margin: '0 0 12px' }}>{rec.price} €<span style={{ fontSize: 15, fontWeight: 500, opacity: 0.6, letterSpacing: 0 }}> {rec.unit === 'einmalig' ? 'einmalig' : '/ Monat'}</span></p>
        {booking
          ? <a href={booking} target="_blank" rel="noopener noreferrer" className="btn btn-md btn-on-brand">Im Gespräch besprechen <span className="arw">→</span></a>
          : <button type="button" onClick={onWrite} className="btn btn-md btn-on-brand">Fragen dazu stellen <span className="arw">→</span></button>}
      </div>
    </section>
  )
}

/** Status eines Checks in einem Wort — für den Firmen-Umschalter. */
export function checkStatusText(c: CheckRow): string {
  return c.status === 'ready' ? 'Bericht fertig' : c.sources_confirmed === false ? 'Bitte Quellen bestätigen' : !c.assignee_id ? 'Anfrage eingegangen' : 'Analyse läuft'
}

/** Kopfzeile: Firmenname mit Umschalter, wenn das Konto mehrere Firmen hat; immer «+ Weitere Firma prüfen». */
export function CompanySwitcher({ checks, current, onSelect, title }: { checks: CheckRow[]; current: CheckRow | null; onSelect: (id: string) => void; title: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close); document.addEventListener('keydown', close)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', close) }
  }, [open])
  const h1: React.CSSProperties = { fontSize: 'clamp(28px, 4vw, 50px)', margin: '0 0 10px' }
  const addLink = <a href="/check" className="ul" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--electric)' }}>+ Weitere Firma prüfen</a>
  if (checks.length < 2) return <><h1 className="display" style={h1}>{title}</h1>{checks.length === 1 && <p style={{ margin: '0 0 10px' }}>{addLink}</p>}</>
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)} aria-haspopup="listbox" aria-expanded={open}
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', color: 'inherit', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 className="display" style={{ ...h1, margin: 0 }}>{title}</h1>
        <span aria-hidden style={{ flexShrink: 0, width: 34, height: 34, borderRadius: '50%', border: '1px solid var(--border)', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
        </span>
      </button>
      <div style={{ height: 10 }} />
      {open && (
        <div role="listbox" aria-label="Ihre Firmen" style={{ position: 'absolute', zIndex: 30, top: '100%', left: 0, marginTop: 6, minWidth: 'min(360px, 86vw)', backgroundColor: '#fff', borderRadius: 18, border: '1px solid var(--line-soft)', boxShadow: '0 18px 40px rgba(7,7,12,0.12)', padding: 8 }}>
          {checks.map(c => {
            const active = c.id === current?.id
            return (
              <button key={c.id} type="button" role="option" aria-selected={active} onClick={() => { onSelect(c.id); setOpen(false) }}
                style={{ display: 'block', width: '100%', textAlign: 'left', background: active ? 'var(--brand-soft)' : 'none', border: 'none', borderRadius: 12, padding: '10px 12px', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--ink)' }}>
                <span style={{ display: 'block', fontWeight: 700, fontSize: 15 }}>{c.place?.name || '—'}</span>
                <span style={{ display: 'block', fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>
                  <span>{[c.place?.category, c.place?.city].filter(Boolean).join(' · ')}</span>{' · '}<span>{checkStatusText(c)}</span>
                </span>
              </button>
            )
          })}
          <div style={{ borderTop: '1px solid var(--line-soft)', margin: '6px 4px 0', padding: '10px 8px 4px' }}>{addLink}</div>
        </div>
      )}
    </div>
  )
}
