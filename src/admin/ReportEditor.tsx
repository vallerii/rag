// Admin: Berichte einer Check-Anfrage.
// Liste: alle veröffentlichten Berichte (ansehen) + offener Entwurf («Weiter») + «Neuer Bericht».
// Neuer Bericht in 4 Schritten: 1 Suchbegriffe → 2 automatische Prüfung → 3 manuelle Prüfungen (optional) → 4 Ergebnis und Veröffentlichung.
import { useEffect, useMemo, useState } from 'react'
import type { OfferItem } from './catalog'
import OfferBuilder, { recommendedFrom } from './OfferBuilder'
import { printReport } from './letter'
import { loadCheckFull, loadOfferFor, loadVersions, publishVersion, recollect, saveChecklist, saveOffer, type Check, type CheckFull, type Offer, type Recommended, type ReportVersion } from './api'
import {
  CHANS, DIRECTORIES, ENGINES, MANUAL, autoSummary, channelItems, compose, defaultQuestions, totalScore,
  type Audit, type Chan, type Checklist, type DirState, type DraftV2, type Mark, type PublishedReport,
} from './checklist'

const ink = 'var(--ink)', muted = 'var(--muted)', line = 'var(--line)', accent = 'var(--electric)'
const card: React.CSSProperties = { backgroundColor: '#fff', border: `1px solid ${line}`, borderRadius: 16, padding: 18 }
const input: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '9px 11px', border: '1px solid rgba(7,7,12,0.16)', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', color: ink, backgroundColor: '#fff', outline: 'none' }
const small: React.CSSProperties = { fontSize: 12.5, color: muted }
const MARK: Record<Mark, [string, string, string]> = { ok: ['✓', '#17663A', '#E3F4EA'], warn: ['!', '#8A4B00', '#FFF1D6'], bad: ['✕', '#9C1F17', '#FBE3E0'] }
const fmt = (d: string) => new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
const fmtDay = (d: string) => new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
const PRIO = ['Hohe Priorität', 'Mittlere Priorität', 'Wachstumspotenzial']
// Zu allgemeine Google-Kategorien: Suche danach liefert fremde Branchen als «Wettbewerber».
const GENERIC = /^(dienstleist|unternehmen|firma|geschäft|betrieb|service|gewerbe|einrichtung)/i

function Badge({ m }: { m: Mark }) {
  return <span style={{ width: 24, height: 24, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: MARK[m][1], backgroundColor: MARK[m][2], flexShrink: 0 }}>{MARK[m][0]}</span>
}
function Steps({ step, go, canGo }: { step: number; go: (n: number) => void; canGo: (n: number) => boolean }) {
  const names = ['Suchbegriffe', 'Automatische Prüfung', 'Manuelle Prüfungen (optional)', 'Ergebnis und Veröffentlichung']
  return (
    <ol style={{ listStyle: 'none', margin: 0, padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: '10px 28px', backgroundColor: 'var(--bone)', borderRadius: 14 }}>
      {names.map((n, i) => {
        const k = i + 1, done = k < step, now = k === step
        return (
          <li key={n}>
            <button type="button" disabled={!canGo(k)} onClick={() => go(k)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 0, padding: 0, font: 'inherit', fontSize: 14, fontWeight: 700, cursor: canGo(k) ? 'pointer' : 'default', color: now ? accent : done ? '#17663A' : '#8A8AA0' }}>
              <span style={{ width: 28, height: 28, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800,
                border: `2px solid ${now ? accent : done ? '#17663A' : '#D6D5E3'}`, backgroundColor: now ? accent : done ? '#E3F4EA' : '#fff', color: now ? '#fff' : done ? '#17663A' : '#8A8AA0' }}>{done ? '✓' : k}</span>
              {n}
            </button>
          </li>
        )
      })}
    </ol>
  )
}
function ScoreRow({ r }: { r: { channels?: Record<string, { score: number | null } | undefined> } }) {
  const t = totalScore(r)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
      <div style={{ padding: '10px 14px', borderRadius: 12, backgroundColor: ink, color: '#fff' }}><div style={{ fontSize: 12.5, opacity: 0.75 }}>Gesamt</div><strong style={{ fontSize: 26 }}>{t ?? '—'}</strong></div>
      {CHANS.map(([k, title]) => <div key={k} style={{ padding: '10px 14px', borderRadius: 12, backgroundColor: 'var(--bone)' }}><div style={small}>{title}</div><strong style={{ fontSize: 26 }}>{r.channels?.[k]?.score ?? '—'}</strong></div>)}
    </div>
  )
}

export default function ReportEditor({ c, onPublished }: { c: Check; onPublished: (report: object) => void }) {
  const [full, setFull] = useState<CheckFull | null>(null)
  const [cl, setCl] = useState<Checklist>({})
  const [versions, setVersions] = useState<ReportVersion[]>([])
  const [busy, setBusy] = useState<'' | 'collect' | 'save' | 'publish'>('')
  const [msg, setMsg] = useState('')
  const [dirty, setDirty] = useState(false)
  const [mode, setMode] = useState<'list' | 'wizard'>('list')
  const [step, setStep] = useState(1)
  const [viewing, setViewing] = useState<ReportVersion | null>(null)
  const [fixing, setFixing] = useState<string | null>(null)
  // Angebot = Empfehlung im Bericht: dieselben Positionen wie im Reiter «Angebot».
  const [offer, setOffer] = useState<Offer | null>(null)
  const [items, setItems] = useState<OfferItem[]>([])
  const [why, setWhy] = useState('')
  const reload = async () => {
    const f = await loadCheckFull(c.id)
    const list = (f?.checklist ?? {}) as Checklist
    setFull(f); setCl(list); setDirty(false)
    setVersions(await loadVersions(c.id))
    const o = await loadOfferFor('check', c.id)
    setOffer(o)
    // Entwurf im Bericht hat Vorrang; sonst das bestehende Angebot als Ausgangspunkt.
    if (list.offerDraft) { setItems(list.offerDraft.items ?? []); setWhy(list.offerDraft.why ?? '') }
    else if (o) { setItems(o.items ?? []); setWhy(o.note ?? '') }
    // Paket von /preise: Ausgangspunkt für das Angebot («Kunde wünscht»).
    else if (c.wish?.length) setItems(c.wish.map(i => ({ ...i })))
    return f
  }
  useEffect(() => { void reload() }, [c.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const draft = (full?.report_draft ?? null) as DraftV2 | null
  const audit = (full?.audit ?? null) as Audit | null
  const noProfile = String(full?.place_id ?? '').startsWith('manual:')
  const place = (full?.place ?? {}) as { category?: string; city?: string; name?: string; address?: string }
  const report = useMemo(() => compose(draft, cl, audit, noProfile), [draft, cl, audit, noProfile])
  const published = full?.status === 'ready'
  const current = (full?.report as { recommended?: Recommended } | null)?.recommended

  const upd = (f: (x: Checklist) => Checklist) => { setCl(x => f({ ...x })); setDirty(true); setMsg('') }
  const answer = (id: string, patch: Record<string, unknown>) => upd(x => ({ ...x, answers: { ...x.answers, [id]: { ...x.answers?.[id], ...patch } } }))

  // Ältere Berichte ohne Angebot: empfohlenes Paket als Startpunkt übernehmen.
  useEffect(() => { if (!offer && current && current.id !== 'bundle' && !items.length) { setItems([{ id: current.id, name: current.name, price: current.price, unit: current.unit }]); setWhy(current.why ?? '') } }, [current?.id, offer]) // eslint-disable-line react-hooks/exhaustive-deps
  const accepted = offer?.status === 'accepted'

  if (!full) return <p style={small}>Wird geladen…</p>

  // Offener Entwurf: noch nie veröffentlicht, oder nach der Veröffentlichung «Neuer Bericht» begonnen.
  const hasDraft = !published || !!cl.draftStarted
  const needsCollect = !full.audited_at || (!!cl.draftStarted && Date.parse(full.audited_at) < Date.parse(cl.draftStarted))
  const keywords = cl.keywords ?? []
  const generic = GENERIC.test(place.category ?? '')
  const suggestion = !generic && place.category && place.city ? `${place.category} ${place.city}` : ''
  const questions = cl.aiQuestions?.length ? cl.aiQuestions : defaultQuestions(generic ? (keywords[0] ?? '').replace(new RegExp(`\\s*${place.city ?? '$^'}$`), '') : place.category ?? '', place.city ?? '')
  const recs = cl.recs ?? draft?.recommendations ?? []
  const site = (full.audit as { site?: { url?: string } } | null)?.site
  const nr = versions.length + (hasDraft ? 1 : 0)

  const save = async (quiet = false) => {
    if (!dirty) return true
    if (!quiet) setBusy('save')
    const ok = await saveChecklist(full.id, cl)
    if (!quiet) setBusy('')
    setDirty(!ok)
    if (!quiet || !ok) setMsg(ok ? 'Entwurf gespeichert.' : 'Speichern fehlgeschlagen.')
    return ok
  }
  const goStep = async (n: number) => { await save(true); setStep(n); setFixing(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const openWizard = () => { setMode('wizard'); setStep(needsCollect ? 1 : 2); setMsg('') }
  const closeWizard = async () => { await save(true); setMode('list'); setMsg('') }
  const startNew = async () => {
    const next = { ...cl, draftStarted: new Date().toISOString() }
    setBusy('save')
    const ok = await saveChecklist(full.id, next)
    setBusy('')
    if (!ok) { setMsg('Speichern fehlgeschlagen.'); return }
    setCl(next); setDirty(false); setMode('wizard'); setStep(1)
  }
  const discard = async () => {
    const next = { ...cl, draftStarted: null }
    if (await saveChecklist(full.id, next)) { await reload(); setMode('list') }
  }
  const collect = async () => {
    if (!keywords[0]?.trim()) { setMsg('Bitte zuerst den Hauptsuchbegriff eintragen.'); return }
    if (!(await save(true)) && dirty) { setMsg('Entwurf konnte vor dem Sammeln nicht gespeichert werden.'); return }
    setBusy('collect'); setMsg('')
    const r = await recollect(full.id)
    await reload(); setBusy('')
    if (r.ok) { setStep(2); setMsg('') } else setMsg(r.message)
  }
  const publish = async () => {
    const list = accepted ? offer!.items : items
    if (!list.length) { setMsg('Stellen Sie das Angebot zusammen — mindestens eine Position.'); return }
    setBusy('publish')
    const next = { ...cl, draftStarted: null, offerDraft: null }
    await saveChecklist(full.id, next)
    // Angebot gleich mitschicken: der Kunde kann es direkt aus dem Bericht annehmen.
    if (!accepted) {
      const o = await saveOffer({ client_key: `user:${full.user_id}`, user_id: full.user_id, request_kind: 'check', request_id: full.id, items, note: why.trim() || null, status: 'sent' })
      if (!o) { setBusy(''); setMsg('Angebot konnte nicht gespeichert werden.'); return }
      setOffer(o)
    }
    const rec = recommendedFrom(list, accepted ? offer?.note ?? '' : why)
    const r = await publishVersion(full, { ...report, recommended: rec, offer_items: list, published_at: new Date().toISOString() })
    setBusy('')
    if (!r) { setMsg('Veröffentlichen fehlgeschlagen.'); return }
    onPublished(r); await reload(); setMode('list')
    setMsg(published ? 'Neue Version veröffentlicht — der Kunde sieht die Änderungen und den Vergleich mit der vorigen.' : 'Veröffentlicht. Der Kunde kann jetzt einen Termin buchen.')
  }

  const pdf = (v: ReportVersion) => {
    const r = v.report as unknown as PublishedReport & { recommended?: Recommended; offer_items?: OfferItem[] }
    const no = versions.length - versions.findIndex(x => x.id === v.id)
    void printReport({ ref: full?.id, company: place.name ?? '', address: place.address ?? null, city: place.city ?? null, no, date: fmtDay(v.created_at),
      channels: r.channels as never, recommendations: r.recommendations ?? [], recommended: r.recommended ?? null, items: r.offer_items ?? null })
  }
  const pdfBtn = (v: ReportVersion) => (
    <button type="button" className="btn btn-md btn-outline-light" onClick={() => pdf(v)} title="Druckfenster: drucken oder «Als PDF speichern»">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>PDF
    </button>
  )

  // ── Ansicht eines veröffentlichten Berichts ─────────────────────────────────
  if (viewing) {
    const v = viewing.report as unknown as PublishedReport & { recommended?: Recommended; published_at?: string }
    const no = versions.length - versions.findIndex(x => x.id === viewing.id)
    return (
      <div style={{ display: 'grid', gap: 16 }}>
        <button type="button" onClick={() => setViewing(null)} style={{ background: 'none', border: 0, padding: 0, font: 'inherit', color: accent, fontWeight: 600, cursor: 'pointer', justifySelf: 'start' }}>← Alle Berichte</button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22 }}>Bericht Nr. {no}</h2>
            <p style={{ ...small, margin: '4px 0 0' }}>veröffentlicht {fmt(viewing.created_at)} · so sieht ihn der Kunde (Texte auf Deutsch)</p>
          </div>
          {pdfBtn(viewing)}
        </div>
        <ScoreRow r={v} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 14, alignItems: 'start' }}>
          {CHANS.map(([k, title]) => {
            const ch = v.channels?.[k]
            if (!ch) return null
            return (
              <section key={k} style={{ ...card, display: 'grid', gap: 8 }}>
                <strong style={{ fontSize: 16 }}>{title} · {ch.score ?? '—'}</strong>
                <p data-no-translate style={{ margin: 0, fontSize: 14, color: muted }}>{ch.summary}</p>
                {ch.points.map(([m, t], i) => <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14 }}><Badge m={m} /><span>{t}</span></div>)}
              </section>
            )
          })}
        </div>
        {v.recommendations?.length > 0 && (
          <section style={{ ...card, display: 'grid', gap: 8 }}>
            <strong style={{ fontSize: 16 }}>Empfehlungen</strong>
            {v.recommendations.map(([p, h, t], i) => <div key={i} style={{ fontSize: 14 }}><span style={small}>{p}</span><div data-no-translate><strong>{h}</strong> — {t}</div></div>)}
          </section>
        )}
        {v.recommended && <p style={{ margin: 0, fontSize: 14 }}>Empfohlenes Paket: <strong>{v.recommended.name}</strong> · {v.recommended.price} € {v.recommended.unit === 'einmalig' ? 'einmalig' : '/Monat'}</p>}
      </div>
    )
  }

  // ── Liste der Berichte ──────────────────────────────────────────────────────
  if (mode === 'list') {
    return (
      <div style={{ display: 'grid', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <p style={{ margin: 0, fontSize: 14, color: muted, maxWidth: 640 }}>Jeder veröffentlichte Bericht bleibt hier gespeichert. Der Kunde sieht den letzten und den Vergleich mit dem vorigen.</p>
          <button type="button" className="btn btn-md btn-electric" disabled={hasDraft || !!busy} onClick={startNew}
            style={{ opacity: hasDraft ? 0.45 : 1 }} title={hasDraft ? 'Erst den offenen Entwurf abschließen oder verwerfen' : undefined}>+ Neuer Bericht</button>
        </div>
        {msg && <p role="status" style={{ ...small, color: '#17663A', margin: 0 }}>{msg}</p>}
        {hasDraft && (
          <article style={{ border: '1px solid #F0D49A', backgroundColor: '#FFFBF0', borderRadius: 14, padding: '16px 18px', display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'grid', gap: 4 }}>
              <strong style={{ fontSize: 16 }}>Bericht Nr. {nr} · Entwurf</strong>
              <span style={small}>
                {!full.sources_confirmed ? 'Der Kunde hat Website und Profile nicht bestätigt. Prüfen Sie die Quellen beim Kunden und sammeln Sie die Daten trotzdem.'
                  : needsCollect ? 'Nächster Schritt: Suchbegriffe festlegen und Daten sammeln.'
                  : `Daten erfasst ${fmt(full.audited_at!)} · nächster Schritt: Ergebnisse prüfen.`}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-md btn-electric" onClick={openWizard}>{needsCollect && !full.audited_at ? 'Beginnen' : 'Weiter'}</button>
              {published && <button type="button" className="btn btn-md btn-outline-light" onClick={discard}>Entwurf verwerfen</button>}
            </div>
          </article>
        )}
        {versions.map((v, i) => {
          const rep = v.report as unknown as PublishedReport & { recommended?: Recommended }
          return (
            <article key={v.id} style={{ border: `1px solid ${line}`, borderRadius: 14, padding: '16px 18px', display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'grid', gap: 4 }}>
                  <strong style={{ fontSize: 16 }}>Bericht Nr. {versions.length - i} · veröffentlicht {fmtDay(v.created_at)}{i === 0 ? ' · aktuell beim Kunden' : ''}</strong>
                  {rep.recommended && <span style={small}>Paket: {rep.recommended.name} · {rep.recommended.price} € {rep.recommended.unit === 'einmalig' ? 'einmalig' : '/Monat'}</span>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn btn-md btn-outline-light" onClick={() => setViewing(v)}>Öffnen</button>
                  {pdfBtn(v)}
                </div>
              </div>
              <ScoreRow r={rep} />
            </article>
          )
        })}
        {!hasDraft && versions.length === 0 && <p style={small}>Noch kein Bericht.</p>}
      </div>
    )
  }

  // ── Neuer Bericht: Schritte ─────────────────────────────────────────────────
  const canGo = (n: number) => !busy && (n === 1 || (!needsCollect && !!draft?.items))
  const footer = (left: React.ReactNode, right: React.ReactNode) => (
    <div style={{ position: 'sticky', bottom: 0, zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '12px 16px', backgroundColor: '#fff', border: `1px solid ${line}`, borderRadius: 14, boxShadow: '0 -6px 24px rgba(11,11,26,0.06)' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>{left}{msg && <span style={small}>{msg}</span>}</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{right}</div>
    </div>
  )

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'baseline', flexWrap: 'wrap' }}>
          <button type="button" onClick={closeWizard} style={{ background: 'none', border: 0, padding: 0, font: 'inherit', color: accent, fontWeight: 600, cursor: 'pointer' }}>← Alle Berichte</button>
          <strong style={{ fontSize: 18 }}>Bericht Nr. {nr}</strong>
          <span style={small}>{dirty ? 'Ungespeicherte Änderungen — werden beim Weitergehen gespeichert' : 'Entwurf gespeichert'}</span>
        </div>
      </div>
      <Steps step={step} go={goStep} canGo={canGo} />

      {/* 1 — Suchbegriffe */}
      {step === 1 && (
        <section style={{ display: 'grid', gap: 16, maxWidth: 780 }}>
          <div>
            <h2 style={{ margin: '0 0 6px', fontSize: 22 }}>Wie suchen Kunden nach so einem Unternehmen?</h2>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: muted }}>Tragen Sie ein, was jemand in Google Maps eingeben würde, um diese Leistung zu finden: Leistung + Ort, auf Deutsch. Danach prüfen wir den Platz des Unternehmens und die Wettbewerber. Mindestens ein Suchbegriff, höchstens drei.</p>
          </div>
          {generic && (
            <div role="note" style={{ padding: '12px 14px', borderRadius: 12, backgroundColor: '#FFF6E5', border: '1px solid #F0D49A', fontSize: 14, lineHeight: 1.55, color: '#5C3300' }}>
              Die Google-Kategorie «<span data-no-translate>{place.category}</span>» ist zu allgemein — damit landen fremde Branchen bei den Wettbewerbern. Tragen Sie die konkrete Leistung ein, z. B. «Marketing Agentur {place.city ?? 'Berlin'}».
            </div>
          )}
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>Hauptsuchbegriff <span style={{ color: '#B3261E' }}>*</span></span>
            <input style={{ ...input, fontSize: 16, padding: '12px 14px' }} value={keywords[0] ?? ''} placeholder={suggestion ? `z. B. ${suggestion}` : 'z. B. Heizungsbau Siegen'}
              onChange={e => upd(x => { const k = [...(x.keywords ?? [])]; k[0] = e.target.value; return { ...x, keywords: k } })} />
          </label>
          {suggestion && !keywords[0] && (
            <button type="button" onClick={() => upd(x => { const k = [...(x.keywords ?? [])]; k[0] = suggestion; return { ...x, keywords: k } })}
              style={{ justifySelf: 'start', minHeight: 38, padding: '0 14px', borderRadius: 999, border: '1px dashed #9A93FF', backgroundColor: '#fff', font: 'inherit', fontSize: 14, fontWeight: 600, color: accent, cursor: 'pointer' }}>+ {suggestion}</button>
          )}
          {[1, 2].map(i => (i === 1 || keywords[1] !== undefined) && (
            <label key={i} style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>Weiterer Suchbegriff <span style={{ ...small, fontWeight: 500 }}>optional</span></span>
              <input style={input} value={keywords[i] ?? ''} placeholder="z. B. Heizung Notdienst Siegen"
                onChange={e => upd(x => { const k = [...(x.keywords ?? [])]; while (k.length < i) k.push(''); k[i] = e.target.value; return { ...x, keywords: k } })} />
            </label>
          ))}
          {!full.sources_confirmed && <p style={{ ...small, color: '#B26B00', margin: 0 }}>Der Kunde hat Website und Profile nicht bestätigt. Prüfen Sie die Quellen beim Kunden — mit «Daten sammeln» übernehmen wir sie und starten.</p>}
          {footer(
            <span style={small}>{busy === 'collect' ? 'Daten werden gesammelt: Google, Website, PageSpeed… bis zu einer Minute.' : 'Das Sammeln dauert etwa 30 Sekunden.'}</span>,
            <>
              {!needsCollect && draft?.items && <button type="button" className="btn btn-md btn-outline-light" disabled={!!busy} onClick={() => goStep(2)}>Ohne neues Sammeln weiter</button>}
              <button type="button" className="btn btn-md btn-electric" disabled={!!busy || !keywords[0]?.trim()} onClick={collect}>{busy === 'collect' ? 'Wird gesammelt…' : 'Daten sammeln →'}</button>
            </>,
          )}
        </section>
      )}

      {/* 2 — Automatische Prüfung */}
      {step === 2 && (
        <section style={{ display: 'grid', gap: 16 }}>
          <div>
            <h2 style={{ margin: '0 0 6px', fontSize: 22 }}>Was die automatische Prüfung gefunden hat</h2>
            <p style={{ margin: 0, fontSize: 15, color: muted }}>Prüfen Sie, ob alles stimmt. Ist ein Punkt falsch — «Korrigieren». Alles andere muss nicht angefasst werden.{full.audited_at ? ` Daten vom ${fmt(full.audited_at)}.` : ''}</p>
          </div>
          <ScoreRow r={report} />
          {draft && !draft.items && <p style={{ ...small, color: '#B26B00', margin: 0 }}>Entwurf im alten Format — gehen Sie zu Schritt 1 und sammeln Sie die Daten neu.</p>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: 14, alignItems: 'start' }}>
            {CHANS.map(([ch, title]) => {
              const auto = draft?.items?.[ch] ?? []
              const shownAll = channelItems(ch, draft, cl, audit)
              const view = auto.map(it => ({ it, shown: shownAll.find(x => x.id === it.id), a: cl.answers?.[it.id] }))
              const problems = view.filter(x => x.a?.mark === 'na' || (x.shown?.mark ?? x.it.mark) !== 'ok' || x.it.id === fixing)
              const fine = view.filter(x => !problems.includes(x))
              const row = ({ it, shown, a }: (typeof view)[number]) => {
                const m = shown?.mark ?? it.mark
                const open = fixing === it.id
                return (
                  <div key={it.id} style={{ display: 'grid', gap: 8, padding: open ? 10 : '8px 0', borderTop: open ? 0 : '1px solid #F0EFF6', backgroundColor: open ? '#F7F6FF' : 'transparent', borderRadius: open ? 10 : 0, opacity: a?.mark === 'na' ? 0.5 : 1 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14 }}>
                      <Badge m={m} /><span style={{ flex: 1 }}>{shown?.text ?? it.text}{a?.mark === 'na' && <span style={small}> · für den Kunden ausgeblendet</span>}{a?.mark && a.mark !== 'na' && <span style={small}> · korrigiert</span>}</span>
                      <button type="button" onClick={() => setFixing(open ? null : it.id)} style={{ background: 'none', border: 0, font: 'inherit', fontSize: 13, fontWeight: 700, color: open ? accent : muted, cursor: 'pointer', minHeight: 36 }}>{open ? 'Fertig' : 'Korrigieren'}</button>
                    </div>
                    {open && (
                      <div style={{ display: 'grid', gap: 8, paddingLeft: 34 }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {([['', 'auto'], ['ok', '✓ ok'], ['warn', '! teilweise'], ['bad', '✕ schlecht'], ['na', 'dem Kunden nicht zeigen']] as [string, string][]).map(([k, l]) => (
                            <button key={k} type="button" onClick={() => answer(it.id, { mark: k || undefined })}
                              style={{ minHeight: 36, padding: '0 12px', borderRadius: 10, border: `1px solid ${(a?.mark ?? '') === k ? accent : '#D6D5E3'}`, backgroundColor: (a?.mark ?? '') === k ? 'var(--brand-soft)' : '#fff', font: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{l}</button>
                          ))}
                        </div>
                        {a?.mark && a.mark !== 'na' && <input style={input} value={a.text ?? ''} placeholder={`Text für den Kunden (Deutsch). Vorher: ${it.text}`} onChange={e => answer(it.id, { text: e.target.value })} />}
                      </div>
                    )}
                  </div>
                )
              }
              return (
                <section key={ch} style={{ ...card, display: 'grid', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                    <strong style={{ fontSize: 17 }}>{title} · {report.channels[ch]?.score ?? '—'}</strong>
                    <span style={small}>Prüfpunkte: {auto.length} · Probleme: {problems.length}</span>
                  </div>
                  {problems.map(row)}
                  {ch === 'search' && !auto.some(i => i.id === 'pagespeed') && (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14, padding: '8px 0', borderTop: '1px solid #F0EFF6', flexWrap: 'wrap' }}>
                      <span style={{ width: 24, height: 24, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFEEF8', color: muted, fontWeight: 800, fontSize: 13 }}>?</span>
                      <span style={{ flex: 1, minWidth: 220 }}>PageSpeed nicht ermittelt — Wert von <a href={`https://pagespeed.web.dev/analysis?url=${encodeURIComponent(site?.url ? `https://${site.url}` : '')}`} target="_blank" rel="noreferrer">pagespeed.web.dev</a> eintragen</span>
                      <input type="number" min={0} max={100} aria-label="PageSpeed" style={{ ...input, width: 90 }} value={cl.pagespeed ?? ''} placeholder="0–100"
                        onChange={e => upd(x => ({ ...x, pagespeed: e.target.value === '' ? null : Math.max(0, Math.min(100, Number(e.target.value))) }))} />
                    </div>
                  )}
                  {fine.length > 0 && (
                    <details style={{ fontSize: 14 }}>
                      <summary style={{ cursor: 'pointer', color: accent, fontWeight: 700, minHeight: 36, display: 'flex', alignItems: 'center' }}>+ {fine.length} Punkte in Ordnung</summary>
                      {fine.map(row)}
                    </details>
                  )}
                  {ch === 'maps' && audit?.competitors && audit.competitors.list.length > 0 && (
                    <details style={{ fontSize: 14 }}>
                      <summary style={{ cursor: 'pointer', color: accent, fontWeight: 700, minHeight: 36, display: 'flex', alignItems: 'center' }}>Wettbewerber: «<span data-no-translate>{audit.competitors.query}</span>»</summary>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead><tr style={{ color: muted, textAlign: 'left' }}><th>#</th><th>Unternehmen</th><th>★</th><th>Bewertungen</th><th>Website</th></tr></thead>
                        <tbody>
                          {audit.competitors.list.slice(0, 8).map((x, i) => (
                            <tr key={x.id} style={{ borderTop: `1px solid ${line}`, fontWeight: i + 1 === audit.competitors!.rank ? 700 : 400, backgroundColor: i + 1 === audit.competitors!.rank ? '#EEEBFF' : undefined }}>
                              <td>{i + 1}</td><td data-no-translate>{x.name}</td><td>{x.rating ?? '—'}</td><td>{x.reviews}</td><td>{x.website ? 'ja' : 'nein'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </details>
                  )}
                </section>
              )
            })}
          </div>
          {footer(
            <>
              <button type="button" className="btn btn-md btn-outline-light" onClick={() => goStep(1)}>← Suchbegriffe</button>
              <button type="button" className="btn btn-md btn-outline-light" title="Druckfenster: drucken oder «Als PDF speichern»"
                onClick={() => printReport({ ref: full?.id, company: place.name ?? '', address: place.address ?? null, city: place.city ?? null, no: nr, date: fmtDay(new Date().toISOString()), channels: report.channels as never, recommendations: report.recommendations ?? [], draft: true })}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>PDF Kurzanalyse
              </button>
            </>,
            <>
              <button type="button" className="btn btn-md btn-outline-light" onClick={() => goStep(4)}>Manuelle überspringen → Ergebnis</button>
              <button type="button" className="btn btn-md btn-electric" onClick={() => goStep(3)}>Weiter: manuelle Prüfungen →</button>
            </>,
          )}
        </section>
      )}

      {/* 3 — Manuelle Prüfungen */}
      {step === 3 && (
        <section style={{ display: 'grid', gap: 16 }}>
          <div>
            <h2 style={{ margin: '0 0 6px', fontSize: 22 }}>Manuelle Prüfungen</h2>
            <p style={{ margin: 0, fontSize: 15, color: muted }}>Optional — macht den Bericht genauer. Was nicht geprüft ist, kommt nicht in den Bericht.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: 14, alignItems: 'start' }}>
            {CHANS.map(([ch, title]) => {
              const defs = MANUAL.filter(m => m.chan === ch)
              if (!defs.length && ch !== 'ai') return null
              return (
                <section key={ch} style={{ ...card, display: 'grid', gap: 10 }}>
                  <strong style={{ fontSize: 17 }}>{title}</strong>
                  {defs.map(m => {
                    const a = cl.answers?.[m.id]
                    const mk = a?.mark && a.mark !== 'na' ? a.mark : null
                    return (
                      <div key={m.id} style={{ display: 'grid', gap: 6, fontSize: 14, paddingTop: 8, borderTop: '1px solid #F0EFF6' }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          {mk ? <Badge m={mk} /> : <span style={{ width: 24, textAlign: 'center', color: muted }}>·</span>}
                          <span style={{ flex: 1 }}>{m.label}{m.hint ? <span style={small}> — {m.hint}</span> : null}</span>
                          <select style={{ ...input, width: 150 }} value={a?.mark ?? ''} onChange={e => answer(m.id, { mark: e.target.value || undefined })} aria-label={m.label}>
                            <option value="">nicht geprüft</option>{(['ok', 'warn', 'bad'] as Mark[]).filter(x => m.texts[x]).map(x => <option key={x} value={x}>{x === 'ok' ? '✓ ok' : x === 'warn' ? '! teilweise' : '✗ schlecht'}</option>)}<option value="na">nicht zutreffend</option>
                          </select>
                        </div>
                        {mk && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, paddingLeft: 34 }}>
                            <input style={input} value={a?.text ?? ''} placeholder={m.texts[mk] ?? ''} onChange={e => answer(m.id, { text: e.target.value })} aria-label="Text für den Kunden" />
                            <input style={input} value={a?.note ?? ''} placeholder="Notiz / Link zum Screenshot (nur für das Team)" onChange={e => answer(m.id, { note: e.target.value })} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {ch === 'ai' && (
                    <>
                      <div style={{ display: 'grid', gap: 6, paddingTop: 8, borderTop: '1px solid #F0EFF6' }}>
                        <strong style={{ fontSize: 14 }}>KI-Antworten: Stellen Sie die Fragen in ChatGPT, Perplexity und Gemini</strong>
                        <span style={small}>Fragen bleiben auf Deutsch — so fragen Kunden in Deutschland. Frage kopieren, in ChatGPT, Perplexity und Gemini einfügen und eintragen, ob der Kunde genannt wurde.</span>
                        {questions.map((q, qi) => (
                          <div key={qi} style={{ display: 'grid', gap: 4 }}>
                            <input style={input} value={q} onChange={e => upd(x => { const list = [...questions]; const old = list[qi]; list[qi] = e.target.value; const res = { ...x.aiResults }; if (old !== e.target.value && res[old]) { res[e.target.value] = res[old]; delete res[old] } return { ...x, aiQuestions: list, aiResults: res } })} />
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                              {ENGINES.map(([e, label]) => {
                                const r = cl.aiResults?.[q]?.[e]
                                return (
                                  <label key={e} style={{ ...small, display: 'flex', gap: 4, alignItems: 'center' }}>{label}
                                    <select style={{ ...input, width: 120, padding: '5px 7px' }} value={r?.mentioned === undefined ? '' : r.mentioned ? 'y' : 'n'}
                                      onChange={ev => upd(x => ({ ...x, aiQuestions: questions, aiResults: { ...x.aiResults, [q]: { ...x.aiResults?.[q], [e]: { ...r, mentioned: ev.target.value === '' ? undefined : ev.target.value === 'y' } } } }))}>
                                      <option value="">—</option><option value="y">genannt</option><option value="n">nicht genannt</option>
                                    </select>
                                    {r?.mentioned && <input style={{ ...input, width: 50, padding: '5px 7px' }} placeholder="№" value={r.pos ?? ''} onChange={ev => upd(x => ({ ...x, aiResults: { ...x.aiResults, [q]: { ...x.aiResults?.[q], [e]: { ...r, pos: ev.target.value } } } }))} />}
                                  </label>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                        <button type="button" className="btn btn-sm btn-outline-light" style={{ justifySelf: 'start' }} onClick={() => upd(x => ({ ...x, aiQuestions: [...questions, ''] }))}>+ Frage</button>
                        <input style={input} value={cl.aiNamed ?? ''} placeholder="Wen die KI statt des Kunden nennt (kommagetrennt)" onChange={e => upd(x => ({ ...x, aiNamed: e.target.value }))} />
                      </div>
                      <div style={{ display: 'grid', gap: 6, paddingTop: 8, borderTop: '1px solid #F0EFF6' }}>
                        <strong style={{ fontSize: 14 }}>Verzeichnisse</strong>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 6 }}>
                          {DIRECTORIES.map(([k, label]) => (
                            <label key={k} style={{ ...small, display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'space-between' }}>{label}
                              <select style={{ ...input, width: 140, padding: '5px 7px' }} value={cl.dirs?.[k] ?? ''} onChange={e => upd(x => ({ ...x, dirs: { ...x.dirs, [k]: e.target.value as DirState } }))}>
                                <option value="">nicht geprüft</option><option value="ok">vorhanden, korrekt</option><option value="diff">vorhanden, abweichend</option><option value="missing">nein</option>
                              </select>
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </section>
              )
            })}
          </div>
          {footer(
            <button type="button" className="btn btn-md btn-outline-light" onClick={() => goStep(2)}>← Automatische Prüfung</button>,
            <button type="button" className="btn btn-md btn-electric" onClick={() => goStep(4)}>Weiter: Ergebnis →</button>,
          )}
        </section>
      )}

      {/* 4 — Ergebnis und Veröffentlichung */}
      {step === 4 && (
        <section style={{ display: 'grid', gap: 16 }}>
          <div>
            <h2 style={{ margin: '0 0 6px', fontSize: 22 }}>Ergebnis und Veröffentlichung</h2>
            <p style={{ margin: 0, fontSize: 15, color: muted }}>Fazit, Empfehlungen und Paket. Die Standardtexte passen meist — ändern Sie nur, was nicht stimmt. Alles für den Kunden auf Deutsch.</p>
          </div>
          <ScoreRow r={report} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: 14, alignItems: 'start' }}>
            {CHANS.map(([ch, title]) => {
              const sc = report.channels[ch]?.score ?? null
              return (
                <section key={ch} style={{ ...card, display: 'grid', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: 16 }}>{title}: {sc ?? '—'}/100</strong>
                    <label style={{ ...small, display: 'flex', gap: 6, alignItems: 'center' }}>eigener Wert
                      <input type="number" min={0} max={100} style={{ ...input, width: 76 }} value={cl.scores?.[ch] ?? ''} placeholder="auto"
                        onChange={e => upd(x => ({ ...x, scores: { ...x.scores, [ch]: e.target.value === '' ? null : Math.max(0, Math.min(100, Number(e.target.value))) } }))} />
                    </label>
                  </div>
                  <textarea style={{ ...input, minHeight: 60, resize: 'vertical' }} value={cl.summaries?.[ch] ?? ''} placeholder={`Fazit für den Kunden (Deutsch), Standard: ${ch === 'maps' && noProfile ? 'Ihr Unternehmen hat kein Google-Profil …' : autoSummary(ch, sc) || '—'}`}
                    onChange={e => upd(x => ({ ...x, summaries: { ...x.summaries, [ch]: e.target.value } }))} />
                </section>
              )
            })}
          </div>
          <section style={{ ...card, display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <strong style={{ fontSize: 16 }}>Empfehlungen für den Kunden (Deutsch)</strong>
              {cl.recs && <button type="button" className="btn btn-sm btn-outline-light" onClick={() => upd(x => ({ ...x, recs: null }))}>auf auto zurücksetzen</button>}
            </div>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '170px 1fr', gap: 8 }}>
                <span style={small}>{PRIO[i]}</span>
                <div style={{ display: 'grid', gap: 4 }}>
                  <input style={input} value={recs[i]?.[1] ?? ''} placeholder="Überschrift" onChange={e => upd(x => { const r = [...(x.recs ?? recs)].map(y => [...y] as [string, string, string]); while (r.length <= i) r.push([PRIO[r.length], '', '']); r[i] = [PRIO[i], e.target.value, r[i][2]]; return { ...x, recs: r } })} />
                  <input style={input} value={recs[i]?.[2] ?? ''} placeholder="Was zu tun ist" onChange={e => upd(x => { const r = [...(x.recs ?? recs)].map(y => [...y] as [string, string, string]); while (r.length <= i) r.push([PRIO[r.length], '', '']); r[i] = [PRIO[i], r[i][1], e.target.value]; return { ...x, recs: r } })} />
                </div>
              </div>
            ))}
          </section>
          <section style={{ ...card, display: 'grid', gap: 10 }}>
            <div>
              <strong style={{ fontSize: 16 }}>Angebot für den Kunden <span style={{ color: '#B3261E' }}>*</span></strong>
              <p style={{ ...small, margin: '4px 0 0' }}>Erscheint im Bericht als Empfehlung mit Preisen — der Kunde kann es sofort annehmen. Dieselben Positionen stehen im Reiter «Angebot» und lassen sich nach dem Gespräch noch ändern.</p>
            </div>
            {accepted ? (
              <div style={{ padding: '10px 14px', borderRadius: 12, backgroundColor: '#F2FAF5', border: '1px solid #CDEBD8', fontSize: 14 }}>
                <strong>Vom Kunden bereits angenommen</strong> — nicht mehr änderbar: {offer!.items.map(i => i.name).join(' + ')}
              </div>
            ) : (
              <>
                {!!c.wish?.length && <p style={{ ...small, margin: 0, padding: '8px 12px', borderRadius: 10, backgroundColor: '#EEEBFF', color: 'var(--ink)' }}>Kunde wünscht (Auswahl auf /preise): <strong>{c.wish.map(i => i.name).join(' + ')}</strong> — vorausgefüllt, bei Bedarf anpassen.</p>}
                <OfferBuilder items={items} onChange={x => { setItems(x); upd(y => ({ ...y, offerDraft: { items: x, why } })) }} />
                <textarea value={why} onChange={e => { const w = e.target.value; setWhy(w); upd(y => ({ ...y, offerDraft: { items, why: w } })) }} style={{ ...input, minHeight: 56, resize: 'vertical' }} placeholder="Warum genau das — 1–2 Sätze für den Kunden, auf Deutsch (optional)" />
              </>
            )}
          </section>
          {footer(
            <>
              <button type="button" className="btn btn-md btn-outline-light" onClick={() => goStep(3)}>← Manuelle Prüfungen</button>
              <button type="button" className="btn btn-md btn-outline-light" disabled={!!busy || !dirty} onClick={() => save()}>{busy === 'save' ? 'Wird gespeichert…' : 'Entwurf speichern'}</button>
            </>,
            <button type="button" className="btn btn-md btn-electric" disabled={!!busy || (!accepted && !items.length) || !Object.keys(report.channels).length} onClick={publish}>
              {busy === 'publish' ? 'Wird veröffentlicht…' : published ? 'Neue Version veröffentlichen' : 'Bericht für den Kunden veröffentlichen'}
            </button>,
          )}
        </section>
      )}
    </div>
  )
}
