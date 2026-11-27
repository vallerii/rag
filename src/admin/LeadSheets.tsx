// Admin: Tabellen der Leads (docs/lead-flow.md). Hier werden die Registerkarten der Google-Tabellen verbunden,
// in denen OrtsFuchs bei einer Registrierung die fertige Analyse der Firma sucht. Leads werden NICHT kopiert:
// OrtsFuchs liest die Tabellen nur im Moment der Registrierung, für genau diese eine Firma.
import { useCallback, useEffect, useState } from 'react'
import { tr } from '../i18n'
import {
  addLeadSheet, deleteLeadSheet, leadSheetsInfo, loadDuplicateChecks, loadLeadSheets, refreshLeadSheet, scanLeadSheets, setLeadSheetActive,
  type DuplicateCheck, type LeadSheet, type SheetScan, type SheetStats,
} from './api'

const muted = 'var(--muted)', line = 'var(--line)', accent = 'var(--electric)'
const card: React.CSSProperties = { backgroundColor: '#fff', border: `1px solid ${line}`, borderRadius: 16, padding: 18 }
const input: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '9px 11px', border: '1px solid rgba(16,17,20,0.16)', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', color: 'var(--ink)', backgroundColor: '#fff', outline: 'none' }
const small: React.CSSProperties = { fontSize: 12.5, color: muted }
const bad = '#9C1F17', good = '#17663A'
const when = (d: string | null) => (d ? new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—')

function Stats({ s }: { s: SheetStats }) {
  return (
    <span style={small}>
      <span>{s.rows}</span> <span>Zeilen</span> · <span>{s.analysed}</span> <span>mit Analyse</span>
      {s.analysed_without_key > 0 && <> · <span style={{ color: '#8A4B00' }}><span>{s.analysed_without_key}</span> <span>ohne Merkmal zum Finden</span></span></>}
    </span>
  )
}

export default function LeadSheets({ onOpenRequest }: { onOpenRequest: (key: string) => void }) {
  const [list, setList] = useState<LeadSheet[] | null>(null)
  const [loadErr, setLoadErr] = useState(false)
  const [email, setEmail] = useState<string | null | undefined>(undefined)
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [stats, setStats] = useState<Record<string, SheetStats>>({})
  const [scan, setScan] = useState<SheetScan | null>(null)
  const [dupChecks, setDupChecks] = useState<DuplicateCheck[]>([])

  const reload = useCallback(async () => {
    const l = await loadLeadSheets()
    if (!l) { setLoadErr(true); return }
    setList(l); setLoadErr(false)
    setDupChecks(await loadDuplicateChecks())
  }, [])
  useEffect(() => { reload(); leadSheetsInfo().then(setEmail) }, [reload])

  const add = async () => {
    setBusy('add'); setMsg(null)
    const r = await addLeadSheet(url)
    setBusy(null)
    if ('error' in r) { setMsg({ ok: false, text: r.error }); return }
    setStats(s => ({ ...s, [r.id]: r })); setUrl('')
    setMsg({ ok: true, text: `Verbunden: ${r.title} / ${r.tab}` })
    await reload()
  }
  const refresh = async (id: string) => {
    setBusy(id); setMsg(null)
    const r = await refreshLeadSheet(id)
    setBusy(null)
    if ('error' in r) setMsg({ ok: false, text: r.error }); else setStats(s => ({ ...s, [id]: r }))
    await reload()
  }
  const toggle = async (s: LeadSheet) => { if (await setLeadSheetActive(s.id, !s.active)) await reload() }
  const remove = async (s: LeadSheet) => {
    if (!window.confirm(`${tr('Registerkarte trennen?')} «${s.title ?? ''} / ${s.tab_title ?? ''}». ${tr('Die Tabelle selbst bleibt unverändert.')}`)) return
    if (await deleteLeadSheet(s.id)) await reload()
  }
  const runScan = async () => {
    setBusy('scan'); setMsg(null)
    const r = await scanLeadSheets()
    setBusy(null)
    if ('error' in r) { setMsg({ ok: false, text: r.error }); return }
    setScan(r)
    setStats(s => ({ ...s, ...Object.fromEntries(r.sheets.filter((x): x is SheetStats & { id: string } => !('error' in x)).map(x => [x.id, x])) }))
    await reload()
  }

  if (loadErr) return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: 24 }}>
      <section style={card}><h2 style={{ marginTop: 0 }}>Lead-Tabellen</h2><p style={{ fontSize: 14 }}>Die Tabelle «lead_sheets» fehlt in der Datenbank. Bitte einmal <code>supabase/analysis.sql</code> im Supabase SQL Editor ausführen.</p></section>
    </div>
  )

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px 40px', display: 'grid', gap: 14 }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 600 }}>Lead-Tabellen</h1>
        <p style={{ margin: 0, fontSize: 14, color: muted, lineHeight: 1.6 }}>
          Registriert sich eine Firma, sucht OrtsFuchs ihre fertige Analyse in diesen Registerkarten und zeigt den Bericht sofort. Leads werden nicht kopiert.
        </p>
      </div>

      <section style={{ ...card, display: 'grid', gap: 10 }}>
        <strong style={{ fontSize: 16 }}>Registerkarte verbinden</strong>
        <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.7 }}>
          <li>
            Tabelle in Google Sheets für das Dienstkonto freigeben (Betrachter):{' '}
            {email === undefined ? <span style={small}>wird geladen…</span>
              : email ? <code data-no-translate style={{ fontSize: 13 }}>{email}</code>
              : <span style={{ color: bad }}>Dienstkonto ist nicht eingerichtet (Secret GOOGLE_SERVICE_ACCOUNT_JSON in Supabase).</span>}
          </li>
          <li>Die Registerkarte mit den Firmen öffnen und den Link aus der Adresszeile hier einfügen (mit «#gid=…»).</li>
        </ol>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input style={{ ...input, flex: '1 1 420px' }} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/…/edit#gid=…" aria-label="Link zur Registerkarte" />
          <button type="button" className="btn btn-md btn-electric" disabled={!!busy || !url.trim()} onClick={add}>{busy === 'add' ? 'Wird geprüft…' : 'Verbinden'}</button>
        </div>
        <p style={{ ...small, margin: 0 }}>Gefunden wird eine Firma über die Google-Maps-Karte (Spalte «Google Maps URL»), die Website, das Telefon oder Name + PLZ.</p>
        {msg && <p role="status" style={{ margin: 0, fontSize: 14, color: msg.ok ? good : bad }}>{msg.text}</p>}
      </section>

      <section style={{ ...card, display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <strong style={{ fontSize: 16 }}>Verbundene Registerkarten</strong>
          <button type="button" className="btn btn-sm btn-outline-light" disabled={!!busy || !list?.some(s => s.active)} onClick={runScan}>{busy === 'scan' ? 'Wird geprüft…' : 'Auf Dubletten prüfen'}</button>
        </div>
        {!list ? <p style={small}>Wird geladen…</p> : !list.length ? <p style={{ ...small, margin: 0 }}>Noch keine Registerkarte verbunden.</p> : (
          <div style={{ display: 'grid', gap: 0 }}>
            {list.map((s, i) => (
              <div key={s.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 10, alignItems: 'center', padding: '12px 0', borderTop: i ? `1px solid ${line}` : 'none', opacity: s.active ? 1 : 0.55 }}>
                <div style={{ minWidth: 0, display: 'grid', gap: 3 }}>
                  <a href={s.url} target="_blank" rel="noreferrer" style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--ink)' }}>
                    <span data-no-translate>{s.title || s.spreadsheet_id}</span> / <span data-no-translate>{s.tab_title || `gid ${s.gid}`}</span>
                  </a>
                  {stats[s.id] ? <Stats s={stats[s.id]} /> : <span style={small}><span>{s.row_count ?? '—'}</span> <span>Zeilen</span></span>}
                  <span style={small}>Zuletzt gelesen: {when(s.last_read_at)}{!s.active && <> · <span>ausgeschaltet</span></>}</span>
                  {s.last_error && <span style={{ fontSize: 13, color: bad }}>{s.last_error}</span>}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-sm btn-outline-light" disabled={!!busy} onClick={() => refresh(s.id)}>{busy === s.id ? 'Wird gelesen…' : 'Neu lesen'}</button>
                  <button type="button" className="btn btn-sm btn-outline-light" onClick={() => toggle(s)}>{s.active ? 'Ausschalten' : 'Einschalten'}</button>
                  <button type="button" className="btn btn-sm btn-outline-light" onClick={() => remove(s)}>Trennen</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {scan && (
        <section style={{ ...card, display: 'grid', gap: 10 }}>
          <strong style={{ fontSize: 16 }}>Dubletten in den Tabellen</strong>
          {!scan.duplicates.length ? <p style={{ margin: 0, fontSize: 14, color: good }}>Keine Firma steht in mehr als einer Zeile.</p> : (
            <>
              <p style={{ ...small, margin: 0 }}>Diese Firmen stehen mehrfach in den Tabellen. Bitte überflüssige Zeilen in Google Sheets löschen: bei einer Registrierung nimmt OrtsFuchs die Zeile mit Analyse und dem neuesten Prüfdatum.</p>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.7 }}>
                {scan.duplicates.map((g, i) => (
                  <li key={i}>
                    <strong data-no-translate>{g[0].name || '—'}</strong>:{' '}
                    {g.map((d, j) => <span key={j}>{j ? '; ' : ''}<span data-no-translate>{d.sheet} / {d.tab}</span>, <span>Zeile</span> <span>{d.n}</span>{d.analysed ? '' : <> (<span>ohne Analyse</span>)</>}</span>)}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {dupChecks.length > 0 && (
        <section style={{ ...card, display: 'grid', gap: 10 }}>
          <strong style={{ fontSize: 16 }}>Registrierte Firmen, die mehrfach in den Tabellen standen</strong>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.7 }}>
            {dupChecks.map(d => (
              <li key={d.check_id}>
                <button type="button" onClick={() => onOpenRequest(`check:${d.check_id}`)} style={{ background: 'none', border: 0, padding: 0, font: 'inherit', color: accent, cursor: 'pointer', fontWeight: 600 }}><span data-no-translate>{d.name}</span></button>
                {' — '}<span>übernommen aus</span> <span data-no-translate>{d.sheet}</span>, <span>Zeile</span> <span>{d.row_number}</span>; <span>auch in</span>{' '}
                {d.duplicates.map((x, j) => <span key={j}>{j ? '; ' : ''}<span data-no-translate>{x.sheet} / {x.tab}</span>, <span>Zeile</span> <span>{x.row_number}</span></span>)}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
