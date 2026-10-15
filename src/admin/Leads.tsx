// Admin: Leads — potenzielle Kunden aus der Google-Tabelle.
// Laden → Kurzanalyse (in Paketen) → Briefe drucken (ein Dokument) → als gedruckt markieren.
// Reagiert ein Unternehmen (Check auf der Website begonnen), erscheint es als normale Anfrage.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { auditProspect, getSetting, importProspects, loadProspects, loadProspectsFull, setSetting, updateProspects, type Prospect, type ProspectStatus } from './api'
import { printLeadLetters } from './letter'
import { useLive } from './live'

const ink = 'var(--ink)', muted = 'var(--muted)', line = 'var(--line)', accent = 'var(--electric)'
const card: React.CSSProperties = { backgroundColor: '#fff', border: `1px solid ${line}`, borderRadius: 16, padding: 18 }
const input: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '9px 11px', border: '1px solid rgba(7,7,12,0.16)', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', color: ink, backgroundColor: '#fff', outline: 'none' }
const small: React.CSSProperties = { fontSize: 12.5, color: muted }
const CSV_KEY = 'leads_csv_url'

type Filter = 'all' | 'new' | 'checked' | 'printed' | 'responded' | 'hidden'
const FILTERS: [Filter, string][] = [['all', 'Alle'], ['new', 'Neue'], ['checked', 'Geprüft'], ['printed', 'Gedruckt'], ['responded', 'Reagiert'], ['hidden', 'Ausgeblendet']]
const inFilter = (p: Prospect, f: Filter) =>
  f === 'all' ? p.status !== 'hidden'
  : f === 'new' ? ['new', 'checking', 'error'].includes(p.status)
  : f === 'checked' ? p.status === 'checked'
  : p.status === f
const STATUS: Record<ProspectStatus, [string, string, string]> = {
  new: ['Neu', '#EFEEF8', '#4A4A63'], checking: ['Wird geprüft', '#ECEBFF', '#2600FF'], checked: ['Geprüft', '#E3F4EA', '#17663A'],
  error: ['Fehler', '#FBE3E0', '#9C1F17'], printed: ['Gedruckt', '#F0EFF6', '#4A4A63'], responded: ['Reagiert', '#DDF3E6', '#0F6B35'], hidden: ['Ausgeblendet', '#F0EFF6', '#8A8AA0'],
}
const scoreColor = (s: number | null) => (s === null ? muted : s < 50 ? '#9C1F17' : s < 75 ? '#8A4B00' : '#17663A')
const fmtDay = (d: string) => new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })

// Spalten der Google-Tabelle: erste Zeile = Überschriften. Russische Namen werden ebenfalls erkannt.
const COLUMNS: [string, string, boolean, string, string][] = [
  ['Firma', 'Компания', true, 'Name des Unternehmens wie bei Google', 'Müller Haustechnik GmbH'],
  ['Branche', 'Сфера', false, 'Art des Betriebs', 'Heizungsbau'],
  ['Stadt', 'Город', false, 'Stadt oder Gemeinde', 'Siegen'],
  ['Adresse', 'Адрес', false, 'Straße, PLZ, Ort — für den Brief; sonst von Google', 'Sandstraße 12, 57072 Siegen'],
  ['Telefon', 'Телефон', false, 'Nur zur Info', '0271 123456'],
  ['Website', 'Сайт', false, 'Falls bekannt', 'mueller-haustechnik.de'],
  ['Google Maps', 'Ссылка на Google Maps', false, 'Link zum Profil — hilft, das richtige Unternehmen zu finden', 'https://maps.google.com/?cid=…'],
  ['Suchbegriff', 'Запрос', false, 'Wie Kunden so einen Betrieb suchen: Leistung + Ort. Wichtig für Platz und Wettbewerber', 'Heizungsbau Siegen'],
]
function ColumnsHelp() {
  const [copied, setCopied] = useState(false)
  const copy = async () => { try { await navigator.clipboard.writeText(COLUMNS.map(c => c[1]).join('\t')); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { /* ignore */ } }
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <p style={{ margin: 0, fontSize: 14 }}>Erste Zeile der Tabelle = Spaltennamen, darunter ein Unternehmen pro Zeile. Pflicht ist nur <b>Firma</b>, die übrigen Spalten machen die Analyse genauer. Reihenfolge egal, Namen auf Deutsch oder Russisch.</p>
      <div style={{ overflowX: 'auto', border: `1px solid ${line}`, borderRadius: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 720 }}>
          <thead><tr style={{ textAlign: 'left', color: muted, backgroundColor: 'var(--bone)' }}><th style={{ padding: '8px 10px' }}>Spalte</th><th style={{ padding: '8px 10px' }}>oder</th><th style={{ padding: '8px 10px' }}>Was eintragen</th><th style={{ padding: '8px 10px' }}>Beispiel</th></tr></thead>
          <tbody>
            {COLUMNS.map(([de, ru, req, what, ex]) => (
              <tr key={de} style={{ borderTop: `1px solid ${line}` }}>
                <td style={{ padding: '7px 10px', fontWeight: 700 }} data-no-translate>{de}{req && <span style={{ color: '#B3261E' }}> *</span>}</td>
                <td style={{ padding: '7px 10px' }} data-no-translate>{ru}</td>
                <td style={{ padding: '7px 10px' }}>{what}</td>
                <td style={{ padding: '7px 10px', color: muted }} data-no-translate>{ex}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-sm btn-outline-light" onClick={copy}>{copied ? 'Kopiert ✓' : 'Spaltennamen kopieren'}</button>
        <span style={small}>…und in Google Sheets in Zelle A1 einfügen — die Namen verteilen sich auf die Spalten.</span>
      </div>
    </div>
  )
}

export default function Leads({ onOpenRequest }: { onOpenRequest: (key: string) => void }) {
  const [list, setList] = useState<Prospect[] | null>(null)
  const [loadErr, setLoadErr] = useState(false)
  const [filter, setFilter] = useState<Filter>('new')
  const [city, setCity] = useState(''), [cat, setCat] = useState(''), [q, setQ] = useState('')
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [csvUrl, setCsvUrl] = useState(''), [setup, setSetup] = useState(false), [paste, setPaste] = useState('')
  const [msg, setMsg] = useState(''), [busy, setBusy] = useState<'' | 'import' | 'audit' | 'print'>('')
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const stop = useRef(false)

  const reload = useCallback(() => { loadProspects().then(r => { if (r) { setList(r); setLoadErr(false) } else setLoadErr(true) }) }, [])
  useEffect(() => { reload(); getSetting(CSV_KEY).then(v => { setCsvUrl(v); if (!v) setSetup(true) }) }, [reload])
  useLive(c => c.table === 'prospects', reload, 800)

  const cities = useMemo(() => [...new Set((list ?? []).map(p => p.city).filter(Boolean) as string[])].sort(), [list])
  const cats = useMemo(() => [...new Set((list ?? []).map(p => p.category).filter(Boolean) as string[])].sort(), [list])
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return (list ?? []).filter(p => inFilter(p, filter) && (!city || p.city === city) && (!cat || p.category === cat)
      && (!needle || `${p.name} ${p.query ?? ''} ${p.website ?? ''}`.toLowerCase().includes(needle)))
  }, [list, filter, city, cat, q])
  const count = (f: Filter) => (list ?? []).filter(p => inFilter(p, f)).length
  const chosen = (list ?? []).filter(p => sel.has(p.id))
  const allOn = shown.length > 0 && shown.every(p => sel.has(p.id))
  const toggleAll = () => setSel(s => { const n = new Set(s); if (allOn) shown.forEach(p => n.delete(p.id)); else shown.forEach(p => n.add(p.id)); return n })
  const toggle = (id: string) => setSel(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })

  const doImport = async (src: { csvUrl?: string; csv?: string }) => {
    setBusy('import'); setMsg('')
    const r = await importProspects(src)
    setBusy('')
    if (r.error) { setMsg(r.error); return }
    setMsg(r.added ? `Neu geladen: ${r.added} (aus ${r.total} Zeilen, Dubletten übersprungen).` : `Keine neuen Unternehmen (${r.total} Zeilen, alle schon vorhanden).`)
    setFilter('new'); reload()
  }
  const saveUrl = async () => {
    const u = csvUrl.trim()
    if (!/^https:\/\/docs\.google\.com\/spreadsheets\//.test(u)) { setMsg('Das ist kein Link auf eine veröffentlichte Google-Tabelle.'); return }
    if (await setSetting(CSV_KEY, u)) { setSetup(false); await doImport({ csvUrl: u }) }
  }
  // Prüfen: drei gleichzeitig, Reihenfolge der Auswahl.
  const runAudit = async () => {
    const ids = chosen.filter(p => !['checking', 'responded'].includes(p.status)).map(p => p.id)
    if (!ids.length) return
    setBusy('audit'); setMsg(''); stop.current = false
    let done = 0, failed = 0, dup = 0, client = 0
    setProgress({ done, total: ids.length })
    const queue = [...ids]
    const worker = async () => {
      while (queue.length && !stop.current) {
        const id = queue.shift()!
        const r = await auditProspect(id)
        if (r === 'duplicate') dup++
        else if (r === 'already_client') client++
        else if (r !== 'checked') failed++
        done++; setProgress({ done, total: ids.length })
      }
    }
    await Promise.all([worker(), worker(), worker()])
    setBusy(''); setProgress(null); reload()
    setMsg([`Geprüft: ${done - failed - dup - client}`, failed ? `Fehler: ${failed}` : '', dup ? `Dubletten ausgeblendet: ${dup}` : '', client ? `schon Kunden (Anfrage vorhanden): ${client}` : '', stop.current ? 'angehalten' : ''].filter(Boolean).join(' · '))
  }
  const printable = chosen.filter(p => p.audited_at && p.status !== 'hidden')
  const doPrint = async () => {
    if (!printable.length) return
    setBusy('print')
    const n = await printLeadLetters(() => loadProspectsFull(printable.map(p => p.id)))
    setBusy('')
    if (n) setMsg(`Briefe vorbereitet: ${n}. Nach dem Drucken «Als gedruckt markieren».`)
  }
  const mark = async (patch: Partial<Prospect>, text: string) => {
    if (await updateProspects([...sel], patch)) { setMsg(text); setSel(new Set()); reload() }
  }

  if (loadErr) return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: 24 }}>
      <section style={card}><h2 style={{ marginTop: 0 }}>Leads</h2><p style={{ fontSize: 14 }}>Die Tabelle für Leads fehlt in der Datenbank. Bitte einmal <code>supabase/prospects.sql</code> im Supabase SQL Editor ausführen.</p></section>
    </div>
  )

  return (
    <div style={{ maxWidth: 1360, margin: '0 auto', padding: '20px 24px 40px', display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 800 }}>Leads</h1>
          <p style={{ margin: 0, fontSize: 14, color: muted }}>Potenzielle Kunden aus der Google-Tabelle. Sie haben uns noch nicht geschrieben.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-md btn-outline-light" onClick={() => setSetup(s => !s)}>Tabelle verbinden</button>
          <button type="button" className="btn btn-md btn-electric" disabled={!!busy || !csvUrl} onClick={() => doImport({ csvUrl })}>{busy === 'import' ? 'Wird geladen…' : 'Neue aus der Tabelle laden'}</button>
        </div>
      </div>

      {setup && (
        <section style={{ ...card, display: 'grid', gap: 10 }}>
          <strong style={{ fontSize: 16 }}>Google-Tabelle verbinden</strong>
          <ColumnsHelp />
          <strong style={{ fontSize: 14, marginTop: 4 }}>So verbinden Sie die Tabelle</strong>
          <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.7 }}>
            <li>In Google Sheets: <b>Datei → Freigeben → Im Web veröffentlichen</b>.</li>
            <li>Das Blatt mit den Unternehmen wählen und als Format <b>«Kommagetrennte Werte (.csv)»</b>.</li>
            <li>«Veröffentlichen» klicken und den Link hier einfügen.</li>
          </ol>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input style={{ ...input, flex: '1 1 420px' }} value={csvUrl} onChange={e => setCsvUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/e/…/pub?output=csv" aria-label="CSV-Link" />
            <button type="button" className="btn btn-md btn-electric" disabled={!!busy} onClick={saveUrl}>Speichern und laden</button>
          </div>
          <details>
            <summary style={{ cursor: 'pointer', color: accent, fontWeight: 600, fontSize: 14 }}>Oder Zeilen direkt einfügen (aus der Tabelle kopieren)</summary>
            <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
              <textarea style={{ ...input, minHeight: 120, fontFamily: 'monospace', fontSize: 12.5 }} value={paste} onChange={e => setPaste(e.target.value)} placeholder={'Firma;Branche;Stadt;Website;Suchbegriff\nMüller Haustechnik;Heizungsbau;Siegen;mueller-haustechnik.de;Heizungsbau Siegen'} />
              <button type="button" className="btn btn-sm btn-outline-light" style={{ justifySelf: 'start' }} disabled={!!busy || !paste.trim()} onClick={() => doImport({ csv: paste.replace(/\t/g, ';') })}>Einfügen</button>
            </div>
          </details>
        </section>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {FILTERS.map(([f, l]) => {
          const on = f === filter
          return (
            <button key={f} type="button" onClick={() => { setFilter(f); setSel(new Set()) }}
              style={{ minHeight: 38, padding: '0 14px', borderRadius: 999, border: `1px solid ${on ? ink : '#D6D5E3'}`, backgroundColor: on ? ink : '#fff', color: on ? '#fff' : f === 'responded' && count(f) ? '#0F6B35' : ink, font: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', gap: 6, alignItems: 'center' }}>
              {l} <span style={{ opacity: 0.7 }}>{count(f)}</span>
            </button>
          )
        })}
        <span style={{ flex: 1 }} />
        <input type="search" style={{ ...input, width: 200, borderRadius: 999 }} placeholder="Suche" value={q} onChange={e => setQ(e.target.value)} aria-label="Suche" />
        <select style={{ ...input, width: 'auto', borderRadius: 999 }} value={city} onChange={e => setCity(e.target.value)} aria-label="Stadt"><option value="">Alle Städte</option>{cities.map(c => <option key={c}>{c}</option>)}</select>
        <select style={{ ...input, width: 'auto', borderRadius: 999 }} value={cat} onChange={e => setCat(e.target.value)} aria-label="Branche"><option value="">Alle Branchen</option>{cats.map(c => <option key={c}>{c}</option>)}</select>
      </div>

      {sel.size > 0 && (
        <div style={{ position: 'sticky', top: 64, zIndex: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '12px 16px', backgroundColor: accent, color: '#fff', borderRadius: 14 }}>
          <strong style={{ fontSize: 15 }}>Ausgewählt: {sel.size}</strong>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {([
              ['Prüfen', runAudit, !busy],
              [`Briefe drucken (${printable.length})`, doPrint, !busy && printable.length > 0, true],
              ['Als gedruckt markieren', () => mark({ status: 'printed', printed_at: new Date().toISOString() }, 'Als gedruckt markiert.'), !busy],
              filter === 'hidden' ? ['Wieder einblenden', () => mark({ status: 'new' }, 'Wieder eingeblendet.'), !busy] : ['Ausblenden', () => mark({ status: 'hidden' }, 'Ausgeblendet.'), !busy],
              ['Auswahl aufheben', () => setSel(new Set()), true],
            ] as [string, () => void, boolean, boolean?][]).map(([l, fn, ok, strong]) => (
              <button key={l} type="button" disabled={!ok} onClick={fn}
                style={{ minHeight: 40, padding: '0 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.35)', backgroundColor: strong ? '#fff' : 'rgba(255,255,255,0.12)', color: strong ? accent : '#fff', font: 'inherit', fontSize: 14, fontWeight: 700, cursor: ok ? 'pointer' : 'not-allowed', opacity: ok ? 1 : 0.5 }}>{l}</button>
            ))}
          </div>
        </div>
      )}

      {progress && (
        <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', padding: '12px 16px' }}>
          <strong style={{ fontSize: 14 }}>Prüfung: {progress.done} von {progress.total}</strong>
          <div role="progressbar" aria-valuenow={progress.done} aria-valuemin={0} aria-valuemax={progress.total} aria-label="Fortschritt" style={{ flex: 1, minWidth: 200, height: 8, backgroundColor: '#EFEEF8', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: `${(progress.done / progress.total) * 100}%`, height: '100%', backgroundColor: accent, transition: 'width .3s' }} />
          </div>
          <span style={small}>ca. 20–40 Sekunden pro Unternehmen, drei gleichzeitig</span>
          <button type="button" className="btn btn-sm btn-outline-light" onClick={() => { stop.current = true }}>Anhalten</button>
        </div>
      )}
      {msg && <p role="status" style={{ margin: 0, fontSize: 14, color: '#17663A' }}>{msg}</p>}

      <div style={{ ...card, padding: 0, overflowX: 'auto' }}>
        <div style={{ minWidth: 1000 }}>
          <div className="lead-row" style={{ fontSize: 11.5, fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <input type="checkbox" checked={allOn} onChange={toggleAll} aria-label="Alle auswählen" style={{ width: 18, height: 18, accentColor: '#2600FF' }} />
            <span>Unternehmen</span><span>Branche · Ort</span><span>Punktzahl</span><span>Wichtigste Probleme</span><span>Status</span><span />
          </div>
          {!list && <p style={{ padding: 16, color: muted, margin: 0 }}>Wird geladen…</p>}
          {list && shown.length === 0 && <p style={{ padding: 16, color: muted, margin: 0 }}>{list.length ? 'Hier ist gerade nichts.' : 'Noch keine Leads — Tabelle verbinden und laden.'}</p>}
          {shown.map(p => {
            const [sl, sbg, sfg] = STATUS[p.status]
            return (
              <label key={p.id} className="lead-row" style={{ borderTop: `1px solid ${line}`, cursor: 'pointer', backgroundColor: sel.has(p.id) ? '#FBFAFF' : '#fff', fontSize: 14 }}>
                <input type="checkbox" checked={sel.has(p.id)} onChange={() => toggle(p.id)} style={{ width: 18, height: 18, accentColor: '#2600FF' }} />
                <span style={{ minWidth: 0 }}>
                  <strong data-no-translate style={{ display: 'block' }}>{p.name}</strong>
                  <span style={small}>{p.query ? <>Suchbegriff: <span data-no-translate>{p.query}</span></> : p.website ?? ''}</span>
                </span>
                <span data-no-translate style={small}>{[p.category, p.city].filter(Boolean).join(' · ')}</span>
                <strong style={{ fontSize: 18, color: scoreColor(p.score) }}>{p.status === 'checking' ? '…' : p.score ?? '—'}</strong>
                <span style={{ ...small, minWidth: 0 }}>
                  {p.status === 'error' ? <span style={{ color: '#9C1F17' }}>{p.error}</span>
                    : p.issues?.length ? p.issues.slice(0, 2).map(i => i.text).join(' · ')
                    : p.status === 'checking' ? 'wird geprüft' : 'noch nicht geprüft'}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 999, backgroundColor: sbg, color: sfg, justifySelf: 'start' }}>
                  {sl}{p.status === 'printed' && p.printed_at ? ` ${fmtDay(p.printed_at)}` : ''}
                </span>
                <span style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                  {p.status === 'responded' && p.check_id && <button type="button" onClick={() => onOpenRequest(`check:${p.check_id}`)} style={{ background: 'none', border: 0, padding: 0, font: 'inherit', fontSize: 13, fontWeight: 700, color: '#0F6B35', cursor: 'pointer' }}>Anfrage →</button>}
                  {p.audited_at && <button type="button" onClick={() => printLeadLetters(() => loadProspectsFull([p.id]))} style={{ background: 'none', border: 0, padding: 0, font: 'inherit', fontSize: 13, fontWeight: 700, color: accent, cursor: 'pointer' }}>Brief</button>}
                  {p.maps_url && <a href={p.maps_url} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 700 }}>Maps</a>}
                </span>
              </label>
            )
          })}
        </div>
      </div>
      <p style={{ ...small, margin: 0 }}>Wenn ein Unternehmen über den Link oder QR-Code im Brief einen Check beginnt, steht es als «Reagiert» hier und als normale Anfrage unter «Anfragen».</p>
      <style>{'.lead-row{display:grid;grid-template-columns:40px minmax(0,1.6fr) minmax(0,1fr) 70px minmax(0,2fr) 130px 150px;gap:12px;align-items:center;padding:12px 16px}'}</style>
    </div>
  )
}
