// Kundenbereich: Ansprechpartner, Angebot des Teams, «Ihr nächster Schritt».
import { useState } from 'react'
import { BOOKING_READY, BOOKING_URL } from '../config'
import { acceptOffer, initials, orderTotal, type ClientOffer, type Manager } from './data'

const card: React.CSSProperties = { backgroundColor: '#fff', borderRadius: 22, border: '1px solid var(--line-soft)', padding: 'clamp(20px, 2.6vw, 28px)' }
const kick = (t: string, color = 'var(--electric)') => <p className="kick" style={{ fontSize: 12, color, marginBottom: 10 }}>{t}</p>

/** Terminlink: eigener Link des Ansprechpartners, sonst der allgemeine (src/config.ts). */
export function bookingLink(m: Manager | null): string | null {
  if (m?.booking_url && /^https?:\/\//.test(m.booking_url)) return m.booking_url
  return BOOKING_READY ? BOOKING_URL : null
}

export function ManagerCard({ manager, onWrite }: { manager: Manager | null; onWrite: () => void }) {
  const link = bookingLink(manager)
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
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {link && <a href={link} target="_blank" rel="noopener noreferrer" className="btn btn-md btn-electric">Termin vereinbaren <span className="arw">→</span></a>}
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

export type NextStep = { title: string; text: React.ReactNode; action?: { label: string; href?: string; onClick?: () => void } }

export function NextStepCard({ step }: { step: NextStep }) {
  return (
    <section style={{ ...card, borderLeft: '4px solid var(--electric)', display: 'flex', gap: 20, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
      <div style={{ maxWidth: 640 }}>
        {kick('Ihr nächster Schritt')}
        <p className="display" style={{ fontSize: 'clamp(20px, 2.2vw, 26px)', lineHeight: 1.2, margin: '0 0 8px' }}>{step.title}</p>
        <p style={{ fontSize: 14.5, lineHeight: 1.65, color: 'var(--muted)', margin: 0 }}>{step.text}</p>
      </div>
      {step.action && (step.action.href
        ? <a href={step.action.href} target="_blank" rel="noopener noreferrer" className="btn btn-md btn-electric">{step.action.label} <span className="arw">→</span></a>
        : <button type="button" onClick={step.action.onClick} className="btn btn-md btn-electric">{step.action.label} <span className="arw">→</span></button>)}
    </section>
  )
}
