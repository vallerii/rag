import { useState } from 'react'
import {
  SOURCE_LABELS, SOURCE_ORDER, attachRequests, createCheck, findMyCheck, manualPlace, orderTotal, runAudit,
  type CheckRow, type OrderRow, type QuizLead, type SourceKey,
} from './data'

// Kundenbereich nach Paket-Anfrage (/preise → Konto) oder Quiz: Angaben zum Unternehmen selbst eintragen.
// Daraus entsteht eine Firma (Check) mit bestätigten Quellen; die Analyse sucht das Google-Profil selbst,
// wenn der Kunde «Ja» oder «Weiß nicht» angibt. Quiz «Noch nichts davon»: nur Name, Branche, Ort — Start bei null.

type Hint = 'yes' | 'no' | 'unknown'
const card: React.CSSProperties = { backgroundColor: '#fff', borderRadius: 22, border: '1px solid var(--line-soft)', padding: 'clamp(22px, 3vw, 32px)' }
const field: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '11px 13px', border: '1px solid rgba(7,7,12,0.14)', borderRadius: 12, fontSize: 14.5, fontFamily: 'inherit', outline: 'none', color: 'var(--ink)', backgroundColor: '#fff' }
const labelSt: React.CSSProperties = { display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }
const opt = (on: boolean): React.CSSProperties => ({ flex: 1, padding: '11px 10px', borderRadius: 12, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', border: `1px solid ${on ? 'var(--electric)' : 'var(--line)'}`, backgroundColor: on ? '#EEEBFF' : '#fff', color: on ? 'var(--electric)' : 'var(--ink)' })
const PLACEHOLDER: Record<SourceKey, string> = { website: 'z. B. meinbetrieb.de', instagram: 'instagram.com/…', facebook: 'facebook.com/…', linkedin: 'linkedin.com/company/…', tiktok: 'tiktok.com/@…' }

export function WishSummary({ items, note }: { items: OrderRow['items']; note?: string }) {
  return (
    <div style={{ ...card, padding: 'clamp(20px, 2.6vw, 28px)' }}>
      <p className="kick" style={{ fontSize: 12, marginBottom: 10 }}>Ihre Auswahl</p>
      {items.map(i => (
        <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '11px 0', borderTop: '1px solid var(--line-soft)', fontSize: 14.5 }}>
          <span style={{ fontWeight: 600 }}>{i.name}</span>
          <span style={{ whiteSpace: 'nowrap' }}><strong>{i.price} €</strong> <span style={{ color: 'var(--muted)', fontSize: 13 }}>{i.unit}</span></span>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '12px 0 0', borderTop: '1px solid var(--line)', fontSize: 14 }}>
        <span style={{ color: 'var(--muted)' }}>Gesamt</span><strong style={{ textAlign: 'right' }}>{orderTotal(items)}</strong>
      </div>
      <p style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--muted)', margin: '14px 0 0' }}>{note ?? 'Noch keine Bestellung: Nach der Analyse bekommen Sie ein Angebot auf Basis Ihrer Auswahl — Kosten entstehen erst, wenn Sie es annehmen.'}</p>
    </div>
  )
}

export default function CompanyForm({ order, quiz, checks, contact }: {
  order: OrderRow | null
  quiz: QuizLead | null
  checks: CheckRow[]
  contact: { name: string; email: string; phone: string }
}) {
  const q = quiz?.answers ?? {}
  const scratch = !order && !!q.have?.includes('none')
  const [target, setTarget] = useState<string>('new')
  const [name, setName] = useState(q.firma ?? '')
  const [category, setCategory] = useState(q.branche ?? '')
  const [city, setCity] = useState(q.ort ?? '')
  const [address, setAddress] = useState('')
  const [links, setLinks] = useState<Record<SourceKey, string>>({ website: '', instagram: '', facebook: '', linkedin: '', tiktok: '' })
  const [hint, setHint] = useState<Hint | null>(q.have ? (q.have.includes('profile') ? 'yes' : 'no') : null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const isNew = target === 'new'
  const canSend = !isNew || (name.trim().length > 1 && category.trim().length > 1 && city.trim().length > 1 && (scratch || !!hint))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSend || busy) return
    setBusy(true); setError(false)
    let id: string | null = isNew ? null : target
    let isScratch = false
    if (isNew) {
      const place = manualPlace({ name, category, city, website: links.website })
      if (address.trim()) place.address = `${address.trim()}, ${city.trim()}`
      const sources = SOURCE_ORDER.map(key => ({ key, value: links[key].trim(), found: false }))
      id = await findMyCheck(place)
      if (!id) {
        id = await createCheck({
          place, region: `${place.city} + 30 km`, sources, sourcePage: order ? 'paket' : 'quiz',
          contact: { name: contact.name, email: contact.email, phone: contact.phone, okEmail: true, okPhone: !!contact.phone },
          manual: { profileHint: scratch ? 'no' : hint ?? 'unknown', scratch },
        })
        isScratch = scratch
      }
    }
    if (!id) { setBusy(false); setError(true); return }
    await attachRequests(id, order?.id ?? null)
    if (isNew && !isScratch) await runAudit(id)
    window.location.href = `/kabinett?firma=${id}`
  }

  return (
    <div className="cab-grid-msg" style={{ display: 'grid', gridTemplateColumns: order ? 'minmax(0, 1fr) 340px' : 'minmax(0, 1fr)', gap: 18, alignItems: 'start' }}>
      <form onSubmit={submit} style={{ ...card, borderLeft: '4px solid var(--electric)' }}>
        <p className="kick" style={{ fontSize: 12, marginBottom: 10 }}>Ihr nächster Schritt</p>
        <h2 className="display" style={{ fontSize: 'clamp(22px, 2.4vw, 30px)', lineHeight: 1.15, margin: '0 0 10px' }}>{scratch ? 'Wie heißt Ihr Unternehmen?' : 'Ihr Unternehmen'}</h2>
        <p style={{ fontSize: 14.5, lineHeight: 1.65, color: 'var(--muted)', margin: '0 0 22px', maxWidth: 620 }}>
          {scratch
            ? 'Sie starten bei null — eine Analyse brauchen wir dafür nicht. Nach dem Speichern wählen Sie direkt einen Termin für das Erstgespräch.'
            : 'Damit analysieren wir Ihre Sichtbarkeit: Google, Website, KI-Suche und Social Media. Den Bericht sehen Sie danach hier im Kundenbereich.'}
        </p>

        {checks.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <span style={labelSt}>Für welches Unternehmen?</span>
            <select style={field} value={target} onChange={e => setTarget(e.target.value)}>
              {checks.map(c => <option key={c.id} value={c.id}>{c.place?.name}{c.place?.city ? ` · ${c.place.city}` : ''}</option>)}
              <option value="new">Ein anderes Unternehmen</option>
            </select>
          </div>
        )}

        {isNew && (
          <>
            <div className="ck-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div><label style={labelSt} htmlFor="cf-name">Name des Unternehmens</label><input id="cf-name" style={field} value={name} onChange={e => setName(e.target.value)} autoComplete="organization" /></div>
              <div><label style={labelSt} htmlFor="cf-cat">Branche</label><input id="cf-cat" style={field} value={category} onChange={e => setCategory(e.target.value)} placeholder="z. B. Dachdecker" /></div>
              <div><label style={labelSt} htmlFor="cf-city">Stadt oder Gemeinde</label><input id="cf-city" style={field} value={city} onChange={e => setCity(e.target.value)} placeholder="z. B. Hannover" autoComplete="address-level2" /></div>
              {!scratch && <div><label style={labelSt} htmlFor="cf-addr">Straße und Hausnummer <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(optional)</span></label><input id="cf-addr" style={field} value={address} onChange={e => setAddress(e.target.value)} autoComplete="street-address" /></div>}
            </div>

            {!scratch && (
              <>
                <p style={{ ...labelSt, margin: '22px 0 8px' }}>Haben Sie ein Google-Unternehmensprofil (Eintrag bei Google Maps)?</p>
                <div style={{ display: 'flex', gap: 6, maxWidth: 460 }}>
                  {([['yes', 'Ja'], ['no', 'Nein'], ['unknown', 'Weiß nicht']] as [Hint, string][]).map(([k, l]) => (
                    <button key={k} type="button" aria-pressed={hint === k} onClick={() => setHint(k)} style={opt(hint === k)}>{l}</button>
                  ))}
                </div>
                {hint && hint !== 'no' && <p style={{ fontSize: 13, color: 'var(--muted)', margin: '8px 0 0' }}>Wir suchen das Profil anhand von Name und Ort selbst.</p>}

                <p style={{ ...labelSt, margin: '22px 0 8px' }}>Website und Social Media <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(was vorhanden ist)</span></p>
                <div className="ck-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {SOURCE_ORDER.map(k => (
                    <div key={k}>
                      <label style={{ ...labelSt, fontWeight: 500 }} htmlFor={`cf-${k}`}>{SOURCE_LABELS[k]}</label>
                      <input id={`cf-${k}`} style={field} value={links[k]} onChange={e => setLinks(x => ({ ...x, [k]: e.target.value }))} placeholder={PLACEHOLDER[k]} inputMode="url" />
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {error && <p role="alert" style={{ color: '#A21C22', fontSize: 14, margin: '16px 0 0' }}>Das Speichern hat nicht geklappt. Bitte versuchen Sie es noch einmal.</p>}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 24 }}>
          <button type="submit" className="btn btn-lg btn-electric" disabled={!canSend || busy} style={{ opacity: canSend ? 1 : 0.45 }}>
            {busy ? 'Wird gespeichert…' : scratch ? 'Speichern und Termin wählen' : isNew ? 'Speichern und Analyse starten' : 'Zuordnen'} <span className="arw">→</span>
          </button>
          {!canSend && <span style={{ fontSize: 13, color: 'var(--muted)' }}>{scratch ? 'Name, Branche und Ort ausfüllen.' : 'Name, Branche, Ort und die Frage zum Google-Profil ausfüllen.'}</span>}
        </div>
      </form>
      {order && <WishSummary items={order.items} />}
    </div>
  )
}
