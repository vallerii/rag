// Admin: Analysen (docs/lead-flow.md). Firmen ohne fertige Analyse warten hier, bis Grok (später per MCP) oder das Team
// (Plan B: Aufgabe in eine KI kopieren, Antwort einfügen) sie analysiert. Unten: Stichprobe der ohne Manager veröffentlichten Berichte.
import { useCallback, useEffect, useState } from 'react'
import { analysisTask, loadAnalysisQueue, markReviewed, releaseAnalyses, retryLookup, saveAnalysisAnswer, type QueueRow } from './api'

const muted = 'var(--muted)', line = 'var(--line)', accent = 'var(--electric)'
const card: React.CSSProperties = { backgroundColor: '#fff', border: `1px solid ${line}`, borderRadius: 16, padding: 18 }
const input: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '9px 11px', border: '1px solid rgba(16,17,20,0.16)', borderRadius: 10, fontSize: 13, fontFamily: 'monospace', color: 'var(--ink)', backgroundColor: '#fff', outline: 'none' }
const small: React.CSSProperties = { fontSize: 12.5, color: muted }
const bad = '#9C1F17', good = '#17663A'
const when = (d: string | null) => (d ? new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—')
const STATUS: Record<string, [string, string]> = { lookup: ['Suche in den Tabellen', '#5D6068'], pending: ['Wartet', '#8A4B00'], in_progress: ['In Arbeit (KI)', accent] }
const SOURCE: Record<string, string> = { sheet: 'Lead-Tabelle', check: 'andere Prüfung', manual: 'manuell (KI)', grok: 'Grok' }

export default function Analyses({ onOpenRequest }: { onOpenRequest: (key: string) => void }) {
  const [rows, setRows] = useState<{ open: QueueRow[]; done: QueueRow[] } | null>(null)
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [task, setTask] = useState('')
  const [answer, setAnswer] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const reload = useCallback(async () => { setRows(await loadAnalysisQueue()) }, [])
  useEffect(() => { reload() }, [reload])
  const toggle = (id: string) => setSel(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })

  const makeTask = async () => {
    setBusy('task'); setMsg(null); setCopied(false)
    const r = await analysisTask([...sel])
    setBusy(null)
    if ('error' in r) { setMsg({ ok: false, text: r.error }); return }
    setTask(r.text); setSel(new Set()); await reload()
  }
  const copy = async () => { try { await navigator.clipboard.writeText(task); setCopied(true) } catch { setCopied(false) } }
  const save = async () => {
    setBusy('save'); setMsg(null)
    const r = await saveAnalysisAnswer(answer)
    setBusy(null)
    if ('error' in r) { setMsg({ ok: false, text: r.error }); return }
    const ok = r.saved.filter(x => x.ok).length
    const notes = [...r.errors, ...r.saved.filter(x => !x.ok || x.reason).map(x => `${x.id.slice(0, 8)}: ${x.reason}`)]
    setMsg({ ok: ok > 0 && !notes.length, text: [`Gespeichert und veröffentlicht: ${ok}`, ...notes].join(' · ') })
    if (ok) { setAnswer(''); setTask('') }
    await reload()
  }
  const release = async () => { setBusy('release'); await releaseAnalyses([...sel]); setBusy(null); setSel(new Set()); await reload() }
  const retry = async (id: string) => { setBusy(id); const t = await retryLookup(id); setBusy(null); setMsg({ ok: true, text: t }); await reload() }
  const review = async (id: string, on: boolean) => { if (await markReviewed(id, on)) await reload() }

  if (!rows) return <p style={{ padding: 24, color: muted }}>Wird geladen…</p>
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px 40px', display: 'grid', gap: 14 }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 600 }}>Analysen</h1>
        <p style={{ margin: 0, fontSize: 14, color: muted, lineHeight: 1.6 }}>Firmen, für die es keine fertige Analyse in den Lead-Tabellen gab. Der Kunde sieht schon die Ergebnisse der Autoprüfung; die vollständige Analyse ist ihm innerhalb von 24 Stunden versprochen.</p>
      </div>

      <section style={{ ...card, display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <strong style={{ fontSize: 16 }}>Warteschlange</strong>
          <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-sm btn-electric" disabled={!!busy || !sel.size} onClick={makeTask}>{busy === 'task' ? 'Wird erstellt…' : 'Aufgabe für die KI erstellen'}</button>
            <button type="button" className="btn btn-sm btn-outline-light" disabled={!!busy || !sel.size} onClick={release}>Zurück in die Warteschlange</button>
          </span>
        </div>
        {!rows.open.length ? <p style={{ ...small, margin: 0 }}>Keine Firma wartet auf eine Analyse.</p> : rows.open.map((r, i) => {
          const [label, color] = STATUS[r.analysis_status] ?? [r.analysis_status, muted]
          const late = Date.now() - new Date(r.created_at).getTime() > 20 * 3600_000
          return (
            <div key={r.id} style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr) auto', gap: 10, alignItems: 'center', padding: '10px 0', borderTop: i ? `1px solid ${line}` : 'none' }}>
              <input type="checkbox" checked={sel.has(r.id)} onChange={() => toggle(r.id)} disabled={r.analysis_status === 'lookup'} aria-label="Auswählen" style={{ width: 18, height: 18 }} />
              <div style={{ minWidth: 0, display: 'grid', gap: 2 }}>
                <button type="button" onClick={() => onOpenRequest(`check:${r.id}`)} style={{ background: 'none', border: 0, padding: 0, font: 'inherit', fontWeight: 600, fontSize: 14.5, color: 'var(--ink)', cursor: 'pointer', textAlign: 'left' }}>
                  <span data-no-translate>{r.name}</span>{r.city && <span style={{ fontWeight: 400, color: muted }}> · <span data-no-translate>{r.city}</span></span>}
                </button>
                <span style={small}><span style={{ color }}>{label}</span> · <span>registriert</span> <span>{when(r.created_at)}</span>{late && <> · <strong style={{ color: bad }}>bald 24 Stunden</strong></>}{r.analysis_taken_at && <> · <span>Aufgabe erstellt</span> <span>{when(r.analysis_taken_at)}</span></>}</span>
                {r.analysis_error && <span style={{ fontSize: 12.5, color: '#8A4B00' }}>{r.analysis_error}</span>}
              </div>
              {r.analysis_status !== 'in_progress' && <button type="button" className="btn btn-sm btn-outline-light" disabled={!!busy} onClick={() => retry(r.id)}>{busy === r.id ? 'Sucht…' : 'Erneut in den Tabellen suchen'}</button>}
            </div>
          )
        })}
      </section>

      {task && (
        <section style={{ ...card, display: 'grid', gap: 10 }}>
          <strong style={{ fontSize: 16 }}>1. Aufgabe in Grok (oder eine andere KI) kopieren</strong>
          <p style={{ ...small, margin: 0 }}>Enthält keine Kundendaten (E-Mail, Name, Telefon). Die Firmen stehen jetzt auf «In Arbeit»; ohne Ergebnis gehen sie nach 2 Stunden zurück in die Warteschlange.</p>
          <textarea readOnly value={task} style={{ ...input, minHeight: 180 }} aria-label="Aufgabe" />
          <button type="button" className="btn btn-sm btn-outline-light" style={{ justifySelf: 'start' }} onClick={copy}>{copied ? 'Kopiert ✓' : 'Kopieren'}</button>
        </section>
      )}

      <section style={{ ...card, display: 'grid', gap: 10 }}>
        <strong style={{ fontSize: 16 }}>{task ? '2. ' : ''}Antwort der KI einfügen</strong>
        <p style={{ ...small, margin: 0 }}>Das JSON aus der Antwort. RAG prüft das Format, ergänzt die Ergebnisse der Autoprüfung, veröffentlicht den Bericht und schickt dem Kunden die E-Mail «Ihre vollständige Analyse ist fertig».</p>
        <textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder='[{"id": "…", "Befund Google-Profil": "+ …", …}]' style={{ ...input, minHeight: 140 }} aria-label="Antwort der KI" />
        <button type="button" className="btn btn-sm btn-electric" style={{ justifySelf: 'start' }} disabled={!!busy || !answer.trim()} onClick={save}>{busy === 'save' ? 'Wird gespeichert…' : 'Prüfen und veröffentlichen'}</button>
        {msg && <p role="status" style={{ margin: 0, fontSize: 14, color: msg.ok ? good : bad }}>{msg.text}</p>}
      </section>

      <section style={{ ...card, display: 'grid', gap: 8 }}>
        <strong style={{ fontSize: 16 }}>Stichprobe: ohne Manager veröffentlicht</strong>
        <p style={{ ...small, margin: 0 }}>Der Kunde sieht diese Berichte schon. Öffnen, mit den Belegen vergleichen und als geprüft markieren (etwa jeden zehnten).</p>
        {!rows.done.length ? <p style={{ ...small, margin: 0 }}>Noch keine.</p> : rows.done.map((r, i) => (
          <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: i ? `1px solid ${line}` : 'none', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14 }}>
              <button type="button" onClick={() => onOpenRequest(`check:${r.id}`)} style={{ background: 'none', border: 0, padding: 0, font: 'inherit', fontWeight: 600, color: accent, cursor: 'pointer' }}><span data-no-translate>{r.name}</span></button>
              <span style={small}> · <span>{SOURCE[r.analysis_source ?? ''] ?? r.analysis_source}</span> · <span>{when(r.analysis_at)}</span></span>
            </span>
            {r.reviewed_at
              ? <span style={{ fontSize: 13, color: good }}>✓ <span>geprüft</span> <span>{when(r.reviewed_at)}</span> <button type="button" onClick={() => review(r.id, false)} style={{ background: 'none', border: 0, padding: 0, font: 'inherit', fontSize: 12.5, color: muted, cursor: 'pointer', marginLeft: 6 }}>zurücknehmen</button></span>
              : <button type="button" className="btn btn-sm btn-outline-light" onClick={() => review(r.id, true)}>Geprüft</button>}
          </div>
        ))}
      </section>
    </div>
  )
}
