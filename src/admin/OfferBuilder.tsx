// Konstruktor für Angebotspositionen — derselbe im Bericht (Schritt 4) und im Reiter «Angebot».
import { useState } from 'react'
import { CATALOG, totals, type OfferItem, type Unit } from './catalog'

const ink = 'var(--ink)', muted = 'var(--muted)'
const input: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '9px 11px', border: '1px solid rgba(7,7,12,0.16)', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', color: ink, backgroundColor: '#fff', outline: 'none' }
const small: React.CSSProperties = { fontSize: 12.5, color: muted }

export default function OfferBuilder({ items, onChange }: { items: OfferItem[]; onChange: (items: OfferItem[]) => void }) {
  const [custom, setCustom] = useState({ name: '', description: '', price: '', unit: 'pro Monat' as Unit })
  const has = (id: string) => items.some(i => i.id === id)
  const toggle = (c: OfferItem) => onChange(has(c.id) ? items.filter(x => x.id !== c.id) : [...items, { id: c.id, name: c.name, price: c.price, unit: c.unit }])
  const setPrice = (id: string, price: string) => onChange(items.map(x => (x.id === id ? { ...x, price: Number(price) || 0 } : x)))
  const priceOf = (id: string) => items.find(i => i.id === id)?.price ?? 0
  const addCustom = () => {
    if (!custom.name.trim()) return
    onChange([...items, { id: 'custom-' + Date.now().toString(36), name: custom.name.trim(), description: custom.description.trim() || undefined, price: Number(custom.price) || 0, unit: custom.unit, custom: true }])
    setCustom({ name: '', description: '', price: '', unit: 'pro Monat' })
  }
  const groups = [...new Set(CATALOG.map(c => c.group))]
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '6px 24px' }}>
        {groups.map(g => (
          <div key={g}>
            <p style={{ ...small, fontWeight: 700, margin: '0 0 4px' }}>{g}</p>
            {CATALOG.filter(c => c.group === g).map(c => (
              <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, minHeight: 38 }}>
                <input type="checkbox" checked={has(c.id)} onChange={() => toggle(c)} style={{ width: 18, height: 18, accentColor: '#2600FF' }} />
                <span style={{ flex: 1 }}>{c.name}</span>
                {has(c.id)
                  ? <input type="number" value={priceOf(c.id)} onChange={e => setPrice(c.id, e.target.value)} style={{ ...input, width: 90, padding: '5px 8px' }} aria-label={`Preis ${c.name}`} />
                  : <span style={small}>{c.price} €</span>}
                <span style={{ ...small, width: 52 }}>{c.unit === 'einmalig' ? 'einmalig' : '/Monat'}</span>
              </label>
            ))}
          </div>
        ))}
      </div>
      {items.filter(i => i.custom).map(i => (
        <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
          <span style={{ flex: 1 }}><strong data-no-translate>{i.name}</strong>{i.description ? <span style={small} data-no-translate> — {i.description}</span> : null}</span>
          <input type="number" value={i.price} onChange={e => setPrice(i.id, e.target.value)} style={{ ...input, width: 90, padding: '5px 8px' }} aria-label={`Preis ${i.name}`} />
          <span style={{ ...small, width: 52 }}>{i.unit === 'einmalig' ? 'einmalig' : '/Monat'}</span>
          <button type="button" onClick={() => onChange(items.filter(x => x.id !== i.id))} style={{ border: 0, background: 'none', cursor: 'pointer', color: '#B3261E', minWidth: 36, minHeight: 36 }} aria-label="Position löschen">✕</button>
        </div>
      ))}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 6, padding: 10, borderRadius: 12, backgroundColor: 'var(--bone)' }}>
        <input style={input} placeholder="Eigene Position: Bezeichnung" value={custom.name} onChange={e => setCustom(c => ({ ...c, name: e.target.value }))} />
        <input style={input} placeholder="Beschreibung" value={custom.description} onChange={e => setCustom(c => ({ ...c, description: e.target.value }))} />
        <input style={input} type="number" placeholder="Preis, €" value={custom.price} onChange={e => setCustom(c => ({ ...c, price: e.target.value }))} />
        <select style={input} value={custom.unit} onChange={e => setCustom(c => ({ ...c, unit: e.target.value as Unit }))} aria-label="Abrechnung"><option value="pro Monat">pro Monat</option><option value="einmalig">einmalig</option></select>
        <button type="button" onClick={addCustom} disabled={!custom.name.trim()} className="btn btn-sm btn-outline-light" style={{ gridColumn: '1 / -1' }}>+ Position hinzufügen</button>
      </div>
      <p style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Summe: {totals(items)}</p>
    </div>
  )
}

/** Für Kundenbereich / PDF: eine Zeile als «Empfehlung» aus mehreren Positionen. */
export function recommendedFrom(items: OfferItem[], why: string) {
  if (!items.length) return null
  const monthly = items.filter(i => i.unit !== 'einmalig').reduce((a, i) => a + (Number(i.price) || 0), 0)
  const once = items.filter(i => i.unit === 'einmalig').reduce((a, i) => a + (Number(i.price) || 0), 0)
  const one = items.length === 1 ? items[0] : null
  return {
    id: one?.id ?? 'bundle', name: items.map(i => i.name).join(' + '),
    price: one ? one.price : monthly || once, unit: (one ? one.unit : monthly ? 'pro Monat' : 'einmalig') as Unit,
    ...(why.trim() ? { why: why.trim() } : {}),
  }
}
