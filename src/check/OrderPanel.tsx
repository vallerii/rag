import { useState } from 'react'
import { orderTotal, saveOrderDetails, type OrderDetails, type OrderRow } from './data'

// Kundenbereich für Kunden mit Paket-Anfrage (/anfrage → Konto → hier).
// 1. Schritt im Kundenbereich: Angaben zum Unternehmen und zum Problem.
// Danach: Status der Anfrage («wir melden uns») und die gewählten Leistungen.

const card: React.CSSProperties = { backgroundColor: '#fff', borderRadius: 22, border: '1px solid var(--line-soft)', padding: 'clamp(20px, 2.6vw, 28px)' }
const field: React.CSSProperties = { width: '100%', padding: '11px 13px', border: '1px solid rgba(7,7,12,0.14)', borderRadius: 12, fontSize: 14.5, fontFamily: 'inherit', outline: 'none', color: 'var(--ink)', backgroundColor: '#fff' }
const labelSt: React.CSSProperties = { display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }

export const GOALS = [
  'Mehr Anrufe und Anfragen',
  'Besser bei Google Maps gefunden werden',
  'Mehr und bessere Bewertungen',
  'Neue oder bessere Website',
  'In ChatGPT und KI-Suche auftauchen',
  'Social Media regelmäßig bespielen',
]
const REACH = ['Vormittags', 'Nachmittags', 'Egal']

export function orderStatusLabel(o: OrderRow): string {
  if (!o.details) return 'Bitte Angaben ergänzen'
  return { new: 'Anfrage in Bearbeitung', contacted: 'Im Gespräch', active: 'In Umsetzung', closed: 'Abgeschlossen' }[o.status]
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow" style={{ fontSize: 10, color: 'var(--electric)', marginBottom: 10 }}>{children}</p>
}

function OrderSummary({ order }: { order: OrderRow }) {
  return (
    <div style={card}>
      <Eyebrow>Ihre Auswahl</Eyebrow>
      {order.items.map(i => (
        <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '11px 0', borderTop: '1px solid var(--line-soft)', fontSize: 14.5 }}>
          <span style={{ fontWeight: 600 }}>{i.name}</span>
          <span style={{ whiteSpace: 'nowrap' }}><strong>{i.price} €</strong> <span style={{ color: 'var(--muted)', fontSize: 13 }}>{i.unit}</span></span>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '12px 0 0', borderTop: '1px solid var(--line)', fontSize: 14 }}>
        <span style={{ color: 'var(--muted)' }}>Gesamt</span><strong style={{ textAlign: 'right' }}>{orderTotal(order.items)}</strong>
      </div>
      <p style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--muted)', margin: '14px 0 0' }}>Noch keine Bestellung: Wir besprechen alles persönlich mit Ihnen, bevor Kosten entstehen.</p>
    </div>
  )
}

export default function OrderPanel({ order, onChange, defaults }: {
  order: OrderRow
  onChange: (o: OrderRow) => void
  defaults: { company: string; phone: string; website: string; city: string; industry: string }
}) {
  const [d, setD] = useState<OrderDetails>({ company: defaults.company, industry: defaults.industry, city: defaults.city, website: defaults.website, goals: [], problem: '', reach: 'Egal', phone: defaults.phone })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const set = <K extends keyof OrderDetails>(k: K, v: OrderDetails[K]) => setD(x => ({ ...x, [k]: v }))
  const toggleGoal = (g: string) => set('goals', d.goals.includes(g) ? d.goals.filter(x => x !== g) : [...d.goals, g])
  const canSend = d.company.trim() !== '' && d.city.trim() !== '' && (d.goals.length > 0 || d.problem.trim() !== '')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSend || busy) return
    setBusy(true); setError(false)
    const clean = { ...d, company: d.company.trim(), city: d.city.trim(), industry: d.industry.trim(), website: d.website.trim(), problem: d.problem.trim(), phone: d.phone.trim() }
    const ok = await saveOrderDetails(order.id, clean)
    setBusy(false)
    if (ok) onChange({ ...order, details: clean }); else setError(true)
  }

  const s = order.status
  const steps: [boolean, string, string][] = [
    [true, 'Anfrage eingegangen', new Date(order.created_at).toLocaleDateString('de-DE')],
    [!!order.details, 'Angaben zum Unternehmen', order.details ? 'Vollständig' : 'Wartet auf Ihre Angaben'],
    [s !== 'new', 'Erstgespräch', s !== 'new' ? 'Erledigt' : 'Wir melden uns innerhalb eines Werktags'],
    [s === 'active' || s === 'closed', 'Start der Umsetzung', s === 'active' || s === 'closed' ? 'Läuft' : 'Nach dem Gespräch'],
  ]

  return (
    <div className="cab-grid-msg" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 18, alignItems: 'start' }}>
      {!order.details ? (
        <form onSubmit={submit} style={{ ...card, borderLeft: '4px solid var(--electric)', padding: 'clamp(22px, 3vw, 32px)' }}>
          <Eyebrow>Ihr nächster Schritt</Eyebrow>
          <h2 className="display" style={{ fontSize: 'clamp(22px, 2.4vw, 30px)', lineHeight: 1.15, margin: '0 0 10px' }}>Erzählen Sie uns von Ihrem Unternehmen</h2>
          <p style={{ fontSize: 14.5, lineHeight: 1.65, color: 'var(--muted)', margin: '0 0 22px', maxWidth: 620 }}>
            Zwei Minuten — damit wir das Erstgespräch vorbereiten können und nicht bei null anfangen.
          </p>
          <div className="ck-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div><label style={labelSt} htmlFor="od-company">Unternehmen</label><input id="od-company" style={field} value={d.company} onChange={e => set('company', e.target.value)} autoComplete="organization" /></div>
            <div><label style={labelSt} htmlFor="od-industry">Branche <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(z. B. Dachdecker)</span></label><input id="od-industry" style={field} value={d.industry} onChange={e => set('industry', e.target.value)} /></div>
            <div><label style={labelSt} htmlFor="od-city">Ort / Region</label><input id="od-city" style={field} value={d.city} onChange={e => set('city', e.target.value)} placeholder="z. B. Siegen" /></div>
            <div><label style={labelSt} htmlFor="od-website">Website <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(falls vorhanden)</span></label><input id="od-website" style={field} value={d.website} onChange={e => set('website', e.target.value)} placeholder="www.…" /></div>
          </div>

          <p style={{ ...labelSt, margin: '22px 0 10px' }}>Was soll besser werden?</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {GOALS.map(g => {
              const on = d.goals.includes(g)
              return (
                <button key={g} type="button" aria-pressed={on} onClick={() => toggleGoal(g)}
                  style={{ padding: '9px 14px', borderRadius: 999, fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', border: `1px solid ${on ? 'var(--electric)' : 'var(--line)'}`, backgroundColor: on ? '#EEEBFF' : '#fff', color: on ? 'var(--electric)' : 'var(--ink)', transition: 'all 0.15s ease' }}>
                  {on ? '✓ ' : ''}{g}
                </button>
              )
            })}
          </div>

          <label style={{ ...labelSt, margin: '22px 0 6px' }} htmlFor="od-problem">Was läuft gerade nicht gut? <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(optional)</span></label>
          <textarea id="od-problem" rows={4} style={{ ...field, resize: 'vertical', lineHeight: 1.55 }} value={d.problem} onChange={e => set('problem', e.target.value)}
            placeholder="z. B. «Die Konkurrenz steht bei Google Maps immer vor uns» oder «Wir bekommen kaum noch Anfragen über die Website»." />

          <div className="ck-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 18 }}>
            <div><label style={labelSt} htmlFor="od-phone">Telefon für das Erstgespräch</label><input id="od-phone" type="tel" style={field} value={d.phone} onChange={e => set('phone', e.target.value)} autoComplete="tel" /></div>
            <div>
              <span style={labelSt}>Am besten erreichbar</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {REACH.map(r => (
                  <button key={r} type="button" aria-pressed={d.reach === r} onClick={() => set('reach', r)}
                    style={{ flex: 1, padding: '11px 8px', borderRadius: 12, fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', border: `1px solid ${d.reach === r ? 'var(--electric)' : 'var(--line)'}`, backgroundColor: d.reach === r ? '#EEEBFF' : '#fff', color: d.reach === r ? 'var(--electric)' : 'var(--ink)' }}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && <p role="alert" style={{ color: '#A21C22', fontSize: 14, margin: '16px 0 0' }}>Das Speichern hat nicht geklappt. Bitte versuchen Sie es noch einmal.</p>}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 24 }}>
            <button type="submit" className="btn btn-lg btn-electric" disabled={!canSend || busy} style={{ opacity: canSend ? 1 : 0.45 }}>
              {busy ? 'Wird gesendet…' : 'Angaben senden'} <span className="arw">→</span>
            </button>
            {!canSend && <span style={{ fontSize: 13, color: 'var(--muted)' }}>Unternehmen, Ort und mindestens ein Ziel ausfüllen.</span>}
          </div>
        </form>
      ) : (
        <div style={card}>
          <Eyebrow>Ihre Anfrage</Eyebrow>
          <h2 className="display" style={{ fontSize: 'clamp(22px, 2.4vw, 30px)', lineHeight: 1.15, margin: '0 0 10px' }}>{s === 'new' ? 'Wir melden uns bei Ihnen.' : orderStatusLabel(order)}</h2>
          <p style={{ fontSize: 14.5, lineHeight: 1.65, color: 'var(--muted)', margin: '0 0 18px', maxWidth: 560 }}>
            {s === 'new'
              ? 'Danke für Ihre Angaben. Wir sehen uns Ihr Unternehmen an und rufen Sie innerhalb eines Werktags an, um alles Weitere zu besprechen.'
              : 'Den aktuellen Stand sehen Sie hier. Fragen können Sie jederzeit unter „Nachrichten“ stellen.'}
          </p>
          {steps.map(([done, t, sub], i) => (
            <div key={t} style={{ display: 'flex', gap: 14, padding: '12px 0', borderTop: '1px solid var(--line-soft)' }}>
              <span style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: done ? '#fff' : 'var(--electric)', backgroundColor: done ? 'var(--electric)' : '#EEEBFF' }}>
                {done ? '✓' : <span className="blink">•</span>}
              </span>
              <span>
                <span style={{ display: 'block', fontWeight: 600, fontSize: 14.5 }}>{t}</span>
                <span style={{ display: 'block', fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{sub}</span>
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>0{i + 1}</span>
            </div>
          ))}
          <div style={{ marginTop: 14, padding: '14px 16px', borderRadius: 14, backgroundColor: 'var(--bone)', fontSize: 13.5, lineHeight: 1.6 }}>
            <strong>{order.details.company}</strong>{order.details.city ? ` · ${order.details.city}` : ''}
            {order.details.goals.length > 0 && <span style={{ display: 'block', color: 'var(--muted)' }}>{order.details.goals.join(' · ')}</span>}
          </div>
        </div>
      )}
      <OrderSummary order={order} />
    </div>
  )
}
