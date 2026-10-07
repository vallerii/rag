// Admin: Sichtbarkeits-Check bearbeiten — automatische Daten, manuelle Checkliste, Konkurrenten,
// Empfehlung, Veröffentlichen als neue Version und Verlauf der Versionen.
import { useEffect, useMemo, useState } from 'react'
import { CATALOG } from './catalog'
import { checkState, loadCheckFull, loadVersions, publishVersion, recollect, saveChecklist, type Check, type CheckFull, type Recommended, type ReportVersion } from './api'
import {
  CHANS, DIRECTORIES, ENGINES, MANUAL, autoSummary, channelItems, compose, defaultQuestions, totalScore,
  type Audit, type Chan, type Checklist, type DirState, type DraftV2, type Mark,
} from './checklist'

const ink = 'var(--ink)', muted = 'var(--muted)', line = 'var(--line)'
const card: React.CSSProperties = { backgroundColor: '#fff', border: `1px solid ${line}`, borderRadius: 16, padding: 18 }
const input: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '7px 10px', border: '1px solid rgba(7,7,12,0.16)', borderRadius: 9, fontSize: 13.5, fontFamily: 'inherit', color: ink, backgroundColor: '#fff', outline: 'none' }
const h3: React.CSSProperties = { fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: muted, margin: '0 0 12px' }
const small: React.CSSProperties = { fontSize: 12.5, color: muted }
const MARK_ICON: Record<Mark, [string, string]> = { ok: ['✓', '#0F7A3E'], warn: ['!', '#9A6200'], bad: ['✗', '#C0262D'] }
const fmt = (d: string) => new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
const PRIO = ['Hohe Priorität', 'Mittlere Priorität', 'Wachstumspotenzial']

function Icon({ m }: { m: Mark }) {
  return <strong style={{ color: MARK_ICON[m][1], width: 16, display: 'inline-block', flexShrink: 0 }}>{MARK_ICON[m][0]}</strong>
}

export default function ReportEditor({ c, onPublished }: { c: Check; onPublished: (report: object) => void }) {
  const [full, setFull] = useState<CheckFull | null>(null)
  const [cl, setCl] = useState<Checklist>({})
  const [versions, setVersions] = useState<ReportVersion[]>([])
  const [busy, setBusy] = useState<'' | 'collect' | 'save' | 'publish'>('')
  const [msg, setMsg] = useState('')
  const [dirty, setDirty] = useState(false)
  const reload = async () => {
    const f = await loadCheckFull(c.id)
    setFull(f); setCl((f?.checklist ?? {}) as Checklist); setDirty(false)
    setVersions(await loadVersions(c.id))
  }
  useEffect(() => { void reload() }, [c.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const draft = (full?.report_draft ?? null) as DraftV2 | null
  const audit = (full?.audit ?? null) as Audit | null
  const noProfile = String(full?.place_id ?? '').startsWith('manual:')
  const place = (full?.place ?? {}) as { category?: string; city?: string; name?: string }
  const report = useMemo(() => compose(draft, cl, audit, noProfile), [draft, cl, audit, noProfile])
  const published = full?.status === 'ready'
  const current = (full?.report as { recommended?: Recommended } | null)?.recommended

  const upd = (f: (x: Checklist) => Checklist) => { setCl(x => f({ ...x })); setDirty(true); setMsg('') }
  const answer = (id: string, patch: Record<string, unknown>) => upd(x => ({ ...x, answers: { ...x.answers, [id]: { ...x.answers?.[id], ...patch } } }))

  // Empfehlung (Paket)
  const [pick, setPick] = useState(''), [price, setPrice] = useState(''), [why, setWhy] = useState('')
  useEffect(() => { if (current) { setPick(current.id); setPrice(String(current.price)); setWhy(current.why ?? '') } }, [current?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const item = CATALOG.find(x => x.id === pick)

  if (!full) return <section style={card}><h3 style={h3}>Prüfbericht</h3><p style={small}>Wird geladen…</p></section>

  const collect = async () => {
    if (dirty && !(await saveChecklist(full.id, cl))) { setMsg('Checkliste konnte vor dem Sammeln nicht gespeichert werden.'); return }
    setBusy('collect'); setMsg('Daten werden gesammelt: Google, Website, PageSpeed… bis zu einer Minute.')
    const r = await recollect(full.id)
    await reload(); setBusy(''); setMsg(r.message)
  }
  const save = async () => { setBusy('save'); const ok = await saveChecklist(full.id, cl); setBusy(''); setDirty(!ok); setMsg(ok ? 'Entwurf gespeichert.' : 'Speichern fehlgeschlagen.') }
  const publish = async () => {
    if (!item) { setMsg('Wählen Sie das empfohlene Paket.'); return }
    setBusy('publish')
    await saveChecklist(full.id, cl)
    const rec: Recommended = { id: item.id, name: item.name, price: Number(price) || item.price, unit: item.unit, ...(why.trim() ? { why: why.trim() } : {}) }
    const r = await publishVersion(full, { ...report, recommended: rec, published_at: new Date().toISOString() })
    setBusy('')
    if (!r) { setMsg('Veröffentlichen fehlgeschlagen.'); return }
    setMsg(published ? 'Neue Version veröffentlicht — der Kunde sieht die Änderungen und den Vergleich mit der vorigen.' : 'Veröffentlicht. Der Kunde kann jetzt einen Termin buchen.')
    onPublished(r); await reload()
  }

  const keywords = cl.keywords ?? []
  const questions = cl.aiQuestions?.length ? cl.aiQuestions : defaultQuestions(place.category ?? '', place.city ?? '')
  const recs = cl.recs ?? draft?.recommendations ?? []
  const site = (full.audit as { site?: { url?: string } } | null)?.site

  return (
    <section style={{ ...card, display: 'grid', gap: 16 }}>
      <div>
        <h3 style={h3}>Prüfbericht</h3>
        <p style={{ ...small, margin: 0 }}>{checkState(full)}{full.audited_at ? ` · Daten erfasst ${fmt(full.audited_at)}` : ''}{published ? ` · veröffentlichte Versionen: ${versions.length}` : ''}</p>
      </div>

      {/* Datenerfassung */}
      <div style={{ display: 'grid', gap: 8, padding: 12, borderRadius: 12, backgroundColor: 'var(--bone)' }}>
        <strong style={{ fontSize: 13.5 }}>Suchbegriffe für die Position in Google Maps (bis zu 3)</strong>
        {[0, 1, 2].map(i => (
          <input key={i} style={input} value={keywords[i] ?? ''} placeholder={i === 0 ? `Standard: ${audit?.competitors?.query ?? 'Branche + Ort'}` : 'weiterer Suchbegriff, z. B. «Heizungsbau Siegen»'}
            onChange={e => upd(x => { const k = [...(x.keywords ?? [])]; k[i] = e.target.value; return { ...x, keywords: k } })} />
        ))}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-sm btn-outline-light" disabled={!!busy || !full.sources_confirmed} onClick={collect}>{busy === 'collect' ? 'Wird gesammelt…' : full.audited_at ? 'Daten neu sammeln' : 'Daten sammeln'}</button>
          <span style={small}>{full.sources_confirmed ? 'Nach der Arbeit an einem Kanal nutzen — der Bericht kann als neue Version veröffentlicht werden und zeigt den Fortschritt.' : 'Der Kunde hat Website und Profile noch nicht bestätigt.'}</span>
        </div>
      </div>
      {draft && !draft.items && <p style={{ ...small, color: '#B26B00', margin: 0 }}>Entwurf im alten Format — klicken Sie auf «Daten neu sammeln», um alle Prüfungen zu erhalten.</p>}

      {/* Wettbewerber */}
      {audit?.competitors && audit.competitors.list.length > 0 && (
        <div>
          <strong style={{ fontSize: 14 }}>Wettbewerber: «{audit.competitors.query}» — {audit.competitors.rank ? `Kunde auf ${audit.competitors.rank} Platz` : 'Kunde nicht in den Ergebnissen'}</strong>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 6 }}>
            <thead><tr style={{ color: muted, textAlign: 'left' }}><th>#</th><th>Unternehmen</th><th>★</th><th>Bewertungen</th><th>Website</th></tr></thead>
            <tbody>
              {audit.competitors.list.slice(0, 8).map((x, i) => (
                <tr key={x.id} style={{ borderTop: `1px solid ${line}`, fontWeight: i + 1 === audit.competitors!.rank ? 700 : 400, backgroundColor: i + 1 === audit.competitors!.rank ? '#EEEBFF' : undefined }}>
                  <td>{i + 1}</td><td>{x.name}</td><td>{x.rating ?? '—'}</td><td>{x.reviews}</td><td>{x.website ? 'ja' : 'nein'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(audit.ranks ?? []).map(r => <p key={r.query} style={{ ...small, margin: '6px 0 0' }}>«{r.query}»: {r.rank ? `${r.rank} Platz` : `nicht in den Top ${r.total}`}{r.top?.length ? ` · Spitzenreiter: ${r.top.slice(0, 3).join(', ')}` : ''}</p>)}
        </div>
      )}

      {/* Kanäle */}
      {CHANS.map(([ch, title]) => {
        const items = channelItems(ch, draft, cl, audit)
        const auto = draft?.items?.[ch] ?? []
        const sc = report.channels[ch]?.score ?? null
        return (
          <div key={ch} style={{ borderTop: `1px solid ${line}`, paddingTop: 12, display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <strong style={{ fontSize: 15 }}>{title}: {sc ?? '—'}/100</strong>
              <label style={{ ...small, display: 'flex', gap: 6, alignItems: 'center' }}>eigener Wert
                <input type="number" min={0} max={100} style={{ ...input, width: 70 }} value={cl.scores?.[ch] ?? ''} placeholder="auto"
                  onChange={e => upd(x => ({ ...x, scores: { ...x.scores, [ch]: e.target.value === '' ? null : Math.max(0, Math.min(100, Number(e.target.value))) } }))} />
              </label>
            </div>
            <textarea style={{ ...input, minHeight: 44, resize: 'vertical' }} value={cl.summaries?.[ch] ?? ''} placeholder={`Fazit für den Kunden (Deutsch), Standard: ${ch === 'maps' && noProfile ? 'Ihr Unternehmen hat kein Google-Profil …' : autoSummary(ch, sc) || '—'}`}
              onChange={e => upd(x => ({ ...x, summaries: { ...x.summaries, [ch]: e.target.value } }))} />

            {auto.length > 0 && <span style={small}>Automatisch:</span>}
            {auto.map(it => {
              const a = cl.answers?.[it.id]
              const shown = items.find(x => x.id === it.id)
              return (
                <div key={it.id} style={{ display: 'grid', gap: 4, fontSize: 13.5, opacity: a?.mark === 'na' ? 0.45 : 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Icon m={shown?.mark ?? it.mark} /><span style={{ flex: 1 }}>{shown?.text ?? it.text}</span>
                    <select style={{ ...input, width: 120 }} value={a?.mark ?? ''} onChange={e => answer(it.id, { mark: e.target.value || undefined })} aria-label="Korrigieren">
                      <option value="">auto</option><option value="ok">✓ ok</option><option value="warn">! teilweise</option><option value="bad">✗ schlecht</option><option value="na">ausblenden</option>
                    </select>
                  </div>
                  {a?.mark && a.mark !== 'na' && (
                    <input style={{ ...input, marginLeft: 24, width: 'calc(100% - 24px)' }} value={a.text ?? ''} placeholder={`Bewertung manuell korrigiert — bitte Text für den Kunden anpassen (Deutsch). Vorher: ${it.text}`} onChange={e => answer(it.id, { text: e.target.value })} />
                  )}
                </div>
              )
            })}

            {ch === 'search' && !auto.some(i => i.id === 'pagespeed') && (
              <div style={{ fontSize: 13.5, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ flex: 1, minWidth: 220 }}>PageSpeed (mobil) wurde nicht automatisch ermittelt{audit?.pagespeed?.error ? ` (${audit.pagespeed.error.slice(0, 80)})` : ''}. Prüfen Sie auf{' '}
                  <a href={`https://pagespeed.web.dev/analysis?url=${encodeURIComponent(site?.url ? `https://${site.url}` : '')}`} target="_blank" rel="noreferrer">pagespeed.web.dev</a> und tragen Sie den Wert ein:</span>
                <input type="number" min={0} max={100} style={{ ...input, width: 80 }} value={cl.pagespeed ?? ''} placeholder="0–100"
                  onChange={e => upd(x => ({ ...x, pagespeed: e.target.value === '' ? null : Math.max(0, Math.min(100, Number(e.target.value))) }))} />
              </div>
            )}

            {ch === 'ai' && (
              <div style={{ display: 'grid', gap: 6, padding: 10, borderRadius: 10, backgroundColor: 'var(--bone)' }}>
                <strong style={{ fontSize: 13.5 }}>KI-Antworten (manuell): Stellen Sie die Fragen in ChatGPT, Perplexity und Gemini</strong>
                {questions.map((q, qi) => (
                  <div key={qi} style={{ display: 'grid', gap: 4 }}>
                    <input style={input} value={q} onChange={e => upd(x => { const list = [...questions]; const old = list[qi]; list[qi] = e.target.value; const res = { ...x.aiResults }; if (old !== e.target.value && res[old]) { res[e.target.value] = res[old]; delete res[old] } return { ...x, aiQuestions: list, aiResults: res } })} />
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {ENGINES.map(([e, label]) => {
                        const r = cl.aiResults?.[q]?.[e]
                        return (
                          <label key={e} style={{ ...small, display: 'flex', gap: 4, alignItems: 'center' }}>{label}
                            <select style={{ ...input, width: 110, padding: '4px 6px' }} value={r?.mentioned === undefined ? '' : r.mentioned ? 'y' : 'n'}
                              onChange={ev => upd(x => ({ ...x, aiQuestions: questions, aiResults: { ...x.aiResults, [q]: { ...x.aiResults?.[q], [e]: { ...r, mentioned: ev.target.value === '' ? undefined : ev.target.value === 'y' } } } }))}>
                              <option value="">—</option><option value="y">genannt</option><option value="n">nicht genannt</option>
                            </select>
                            {r?.mentioned && <input style={{ ...input, width: 46, padding: '4px 6px' }} placeholder="№" value={r.pos ?? ''} onChange={ev => upd(x => ({ ...x, aiResults: { ...x.aiResults, [q]: { ...x.aiResults?.[q], [e]: { ...r, pos: ev.target.value } } } }))} />}
                          </label>
                        )
                      })}
                    </div>
                  </div>
                ))}
                <button type="button" className="btn btn-sm btn-outline-light" style={{ justifySelf: 'start' }} onClick={() => upd(x => ({ ...x, aiQuestions: [...questions, ''] }))}>+ Frage</button>
                <input style={input} value={cl.aiNamed ?? ''} placeholder="Wen die KI statt des Kunden nennt (kommagetrennt)" onChange={e => upd(x => ({ ...x, aiNamed: e.target.value }))} />
                <strong style={{ fontSize: 13.5, marginTop: 6 }}>Verzeichnisse</strong>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 6 }}>
                  {DIRECTORIES.map(([k, label]) => (
                    <label key={k} style={{ ...small, display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'space-between' }}>{label}
                      <select style={{ ...input, width: 140, padding: '4px 6px' }} value={cl.dirs?.[k] ?? ''} onChange={e => upd(x => ({ ...x, dirs: { ...x.dirs, [k]: e.target.value as DirState } }))}>
                        <option value="">nicht geprüft</option><option value="ok">vorhanden, korrekt</option><option value="diff">vorhanden, abweichend</option><option value="missing">nein</option>
                      </select>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {MANUAL.filter(m => m.chan === ch).length > 0 && <span style={small}>Manuell:</span>}
            {MANUAL.filter(m => m.chan === ch).map(m => {
              const a = cl.answers?.[m.id]
              const mk = a?.mark && a.mark !== 'na' ? a.mark : null
              return (
                <div key={m.id} style={{ display: 'grid', gap: 4, fontSize: 13.5 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {mk ? <Icon m={mk} /> : <span style={{ width: 16, color: muted }}>·</span>}
                    <span style={{ flex: 1 }}>{m.label}{m.hint ? <span style={small}> — {m.hint}</span> : null}</span>
                    <select style={{ ...input, width: 120 }} value={a?.mark ?? ''} onChange={e => answer(m.id, { mark: e.target.value || undefined })}>
                      <option value="">nicht geprüft</option>{(['ok', 'warn', 'bad'] as Mark[]).filter(x => m.texts[x]).map(x => <option key={x} value={x}>{x === 'ok' ? '✓ ok' : x === 'warn' ? '! teilweise' : '✗ schlecht'}</option>)}<option value="na">nicht zutreffend</option>
                    </select>
                  </div>
                  {mk && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, paddingLeft: 24 }}>
                      <input style={input} value={a?.text ?? ''} placeholder={m.texts[mk] ?? ''} onChange={e => answer(m.id, { text: e.target.value })} aria-label="Text für den Kunden" />
                      <input style={input} value={a?.note ?? ''} placeholder="Notiz / Link zum Screenshot (nur für das Team)" onChange={e => answer(m.id, { note: e.target.value })} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}

      {/* Empfehlungen */}
      <div style={{ borderTop: `1px solid ${line}`, paddingTop: 12, display: 'grid', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <strong style={{ fontSize: 14 }}>Empfehlungen für den Kunden (Deutsch)</strong>
          {cl.recs && <button type="button" className="btn btn-sm btn-outline-light" onClick={() => upd(x => ({ ...x, recs: null }))}>auf auto zurücksetzen</button>}
        </div>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 6 }}>
            <span style={small}>{PRIO[i]}</span>
            <div style={{ display: 'grid', gap: 4 }}>
              <input style={input} value={recs[i]?.[1] ?? ''} placeholder="Überschrift" onChange={e => upd(x => { const r = [...(x.recs ?? recs)].map(y => [...y] as [string, string, string]); while (r.length <= i) r.push([PRIO[r.length], '', '']); r[i] = [PRIO[i], e.target.value, r[i][2]]; return { ...x, recs: r } })} />
              <input style={input} value={recs[i]?.[2] ?? ''} placeholder="Was zu tun ist" onChange={e => upd(x => { const r = [...(x.recs ?? recs)].map(y => [...y] as [string, string, string]); while (r.length <= i) r.push([PRIO[r.length], '', '']); r[i] = [PRIO[i], r[i][1], e.target.value]; return { ...x, recs: r } })} />
            </div>
          </div>
        ))}
      </div>

      {/* Empfohlenes Paket + Veröffentlichung */}
      <div style={{ borderTop: `1px solid ${line}`, paddingTop: 12, display: 'grid', gap: 8 }}>
        <strong style={{ fontSize: 14 }}>Empfohlenes Paket {published && current ? <span style={{ ...small, fontWeight: 400 }}>· aktuell: {current.name}</span> : null}</strong>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: 8 }}>
          <select value={pick} onChange={e => { setPick(e.target.value); const it = CATALOG.find(x => x.id === e.target.value); if (it) setPrice(String(it.price)) }} style={input}>
            <option value="">— auswählen —</option>
            {CATALOG.map(x => <option key={x.id} value={x.id}>{x.name} · {x.price} € {x.unit === 'einmalig' ? 'einmalig' : '/Monat'}</option>)}
          </select>
          <input type="number" value={price} onChange={e => setPrice(e.target.value)} style={input} placeholder="€" />
        </div>
        <textarea value={why} onChange={e => setWhy(e.target.value)} style={{ ...input, minHeight: 50, resize: 'vertical' }} placeholder="Warum genau dieses — 1–2 Sätze für den Kunden, auf Deutsch (optional)" />
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-sm btn-outline-light" disabled={!!busy || !dirty} onClick={save}>{busy === 'save' ? 'Wird gespeichert…' : 'Entwurf speichern'}</button>
          <button type="button" className="btn btn-md btn-electric" disabled={!!busy || !item || !Object.keys(report.channels).length} onClick={publish}>{busy === 'publish' ? 'Wird veröffentlicht…' : published ? 'Neue Version veröffentlichen' : 'Bericht für den Kunden veröffentlichen'}</button>
          {msg && <span style={small}>{msg}</span>}
        </div>
        <p style={{ ...small, margin: 0 }}>Ergebnis für den Kunden aktuell: {totalScore(report) ?? '—'}/100 · {CHANS.map(([k, t]) => `${t} ${report.channels[k]?.score ?? '—'}`).join(' · ')}</p>
      </div>

      {/* Archiv */}
      {versions.length > 0 && (
        <div style={{ borderTop: `1px solid ${line}`, paddingTop: 12 }}>
          <strong style={{ fontSize: 14 }}>Versionsarchiv</strong>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 6 }}>
            <thead><tr style={{ color: muted, textAlign: 'left' }}><th>Datum</th><th>Gesamt</th>{CHANS.map(([k, t]) => <th key={k}>{t}</th>)}</tr></thead>
            <tbody>
              {versions.map((v, i) => {
                const prev = versions[i + 1]?.report as { channels?: Record<string, { score: number | null }> } | undefined
                const cur = v.report as { channels?: Record<string, { score: number | null }> }
                const cell = (k: string) => {
                  const a = cur.channels?.[k]?.score, b = prev?.channels?.[k]?.score
                  const d = typeof a === 'number' && typeof b === 'number' ? a - b : null
                  return <td key={k}>{a ?? '—'}{d ? <span style={{ color: d > 0 ? '#0F7A3E' : '#C0262D', fontSize: 11.5 }}> {d > 0 ? '+' : ''}{d}</span> : null}</td>
                }
                return <tr key={v.id} style={{ borderTop: `1px solid ${line}` }}><td>{fmt(v.created_at)}</td><td><strong>{totalScore(cur) ?? '—'}</strong></td>{CHANS.map(([k]) => cell(k))}</tr>
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export type { Chan }
