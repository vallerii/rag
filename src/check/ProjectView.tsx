// Kundenbereich nach dem angenommenen Angebot:
//   ProjectPanel — Stand des Projekts (Rechnung → Zahlung → Umsetzung → Ergebnis) und die offene Rechnung.
//   ResultView   — Tab «Ergebnis»: erste Prüfung (Ausgangslage) im Vergleich zur neuesten.
// Daten: projects (supabase/project.sql), check_reports (Versionen des Berichts).
import { COMPANY } from '../company'
import { dateLocale } from '../i18n'
import { reportTotal, type ClientProject, type Report, type ReportVersion } from './data'
import { Delta } from './ReportExtras'

const card: React.CSSProperties = { backgroundColor: '#fff', borderRadius: 22, border: '1px solid var(--line-soft)', padding: 'clamp(20px, 2.6vw, 28px)' }
const kick = (t: string) => <p className="kick" style={{ fontSize: 12, color: 'var(--electric)', marginBottom: 10 }}>{t}</p>
const fmtDate = (d: string) => new Date(d).toLocaleDateString(dateLocale(), { day: 'numeric', month: 'long', year: 'numeric' })
const fmtEur = (n: number) => n.toLocaleString(dateLocale(), { style: 'currency', currency: 'EUR' })
const fmtRating = (n: number | null | undefined) => (typeof n === 'number' ? `${n.toLocaleString(dateLocale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ★` : '—')

const STEPS: { key: ClientProject['status'][]; label: string }[] = [
  { key: ['awaiting_payment'], label: 'Rechnung' },
  { key: ['paid'], label: 'Zahlung' },
  { key: ['in_progress'], label: 'Umsetzung' },
  { key: ['result', 'support', 'done'], label: 'Ergebnis' },
]

export function projectHeadline(p: ClientProject): { title: string; text: string } {
  switch (p.status) {
    case 'awaiting_payment':
      return p.invoice_sent_at
        ? { title: 'Ihre Rechnung ist da', text: 'Sobald die Zahlung eingegangen ist, starten wir mit der Umsetzung. Rechnung und Bankverbindung finden Sie unten.' }
        : { title: 'Wir bereiten den Start vor', text: 'Danke für Ihre Zusage. Die Rechnung erhalten Sie in Kürze hier im Kundenbereich.' }
    case 'paid': return { title: 'Zahlung eingegangen — danke!', text: 'Ihr Ansprechpartner plant jetzt den Start und meldet sich, falls wir noch etwas von Ihnen brauchen.' }
    case 'in_progress': return { title: 'Wir arbeiten an Ihrer Sichtbarkeit', text: 'Nach der Umsetzung prüfen wir Ihr Unternehmen erneut und zeigen Ihnen hier den Vergleich mit der Ausgangslage.' }
    case 'support': return { title: 'Ihr Ergebnis ist da — wir bleiben dran', text: 'Im Tab «Ergebnis» sehen Sie, was sich seit der ersten Prüfung verändert hat. Die laufende Betreuung geht weiter.' }
    default: return { title: 'Ihr Ergebnis ist da', text: 'Im Tab «Ergebnis» sehen Sie, was sich seit der ersten Prüfung verändert hat.' }
  }
}

export function ProjectPanel({ project }: { project: ClientProject }) {
  const cur = STEPS.findIndex(s => s.key.includes(project.status))
  const showInvoice = !!project.invoice_sent_at && project.status === 'awaiting_payment'
  const bank = COMPANY.iban.trim()
  return (
    <section style={card}>
      {kick('Ihr Projekt')}
      <ol style={{ listStyle: 'none', margin: '0 0 4px', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
        {STEPS.map((s, i) => (
          <li key={s.label} style={{ display: 'grid', gap: 6 }}>
            <span aria-hidden style={{ height: 6, borderRadius: 999, backgroundColor: i < cur ? 'var(--electric)' : i === cur ? '#B9B0FF' : '#ECEBF3' }} />
            <span style={{ fontSize: 13, fontWeight: i === cur ? 700 : 600, color: i <= cur ? 'var(--ink)' : 'var(--muted)' }}>{i < cur ? '✓ ' : ''}{s.label}</span>
          </li>
        ))}
      </ol>

      {showInvoice && (
        <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--line-soft)' }}>
          <p className="display" style={{ fontSize: 'clamp(20px, 2.2vw, 26px)', margin: '0 0 4px' }}>
            {project.invoice_amount != null ? fmtEur(Number(project.invoice_amount)) : 'Rechnung'}
          </p>
          <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 14px' }}>
            Rechnung {project.invoice_number}{project.invoice_due ? <> · <span>zahlbar bis</span> {fmtDate(project.invoice_due)}</> : null}
          </p>
          <dl style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 160px) 1fr', gap: '6px 12px', fontSize: 14, margin: 0 }}>
            {bank ? <>
              <dt style={{ color: 'var(--muted)' }}>Empfänger</dt><dd style={{ margin: 0 }}>{COMPANY.legalName || COMPANY.brand}</dd>
              <dt style={{ color: 'var(--muted)' }}>IBAN</dt><dd style={{ margin: 0, fontFamily: 'ui-monospace, monospace', letterSpacing: '0.03em' }} data-no-translate>{COMPANY.iban}</dd>
              {COMPANY.bic && <><dt style={{ color: 'var(--muted)' }}>BIC</dt><dd style={{ margin: 0 }} data-no-translate>{COMPANY.bic}</dd></>}
              {COMPANY.bankName && <><dt style={{ color: 'var(--muted)' }}>Bank</dt><dd style={{ margin: 0 }}>{COMPANY.bankName}</dd></>}
            </> : <><dt style={{ color: 'var(--muted)' }}>Bankverbindung</dt><dd style={{ margin: 0 }}>steht auf der Rechnung</dd></>}
            <dt style={{ color: 'var(--muted)' }}>Verwendungszweck</dt><dd style={{ margin: 0, fontWeight: 700 }} data-no-translate>{project.invoice_number}</dd>
          </dl>
          {project.invoice_url && (
            <a href={project.invoice_url} target="_blank" rel="noopener noreferrer" className="btn btn-md btn-electric" style={{ marginTop: 16 }}>Rechnung öffnen (PDF) <span className="arw">→</span></a>
          )}
        </div>
      )}
      {project.note && <p style={{ fontSize: 14.5, lineHeight: 1.65, margin: '16px 0 0', padding: '12px 14px', borderRadius: 14, backgroundColor: '#F7F6FF' }}>{project.note}</p>}
    </section>
  )
}

// ── Ergebnis: Ausgangslage vs. heute ─────────────────────────────────────────
const CHANNELS: [keyof NonNullable<Report['channels']>, string][] = [['ai', 'KI-Suche'], ['maps', 'Google Maps'], ['search', 'Website & Google Search'], ['social', 'Social Media']]

function Bars({ before, after }: { before: number | null; after: number | null }) {
  const bar = (v: number | null, color: string) => (
    <span style={{ display: 'block', height: 8, borderRadius: 999, backgroundColor: '#ECEBF3', overflow: 'hidden' }}>
      <span style={{ display: 'block', height: '100%', width: `${Math.max(0, Math.min(100, v ?? 0))}%`, backgroundColor: color, borderRadius: 999 }} />
    </span>
  )
  return <span style={{ display: 'grid', gap: 4 }}>{bar(before, '#C9C5E8')}{bar(after, 'var(--electric)')}</span>
}

export function ResultView({ versions }: { versions: ReportVersion[] }) {
  if (versions.length < 2) {
    return (
      <section style={card}>
        {kick('Ihr Ergebnis')}
        <p className="display" style={{ fontSize: 'clamp(20px, 2.2vw, 26px)', margin: '0 0 8px' }}>Der Vergleich ist gleich da</p>
        <p style={{ fontSize: 14.5, color: 'var(--muted)', margin: 0, lineHeight: 1.65 }}>Sobald Ihr Ansprechpartner die neue Prüfung veröffentlicht hat, sehen Sie hier, was sich seit der Ausgangslage verändert hat.</p>
      </section>
    )
  }
  const base = versions[versions.length - 1], now = versions[0]
  const b = base.report, n = now.report
  const tb = reportTotal(b), tn = reportTotal(n)
  const score = (r: Report, k: keyof NonNullable<Report['channels']>) => r.channels?.[k]?.score ?? null
  const diff = (a: number | null | undefined, c: number | null | undefined) => (typeof a === 'number' && typeof c === 'number' ? c - a : null)
  const youB = b.competitors?.you, youN = n.competitors?.you
  const ranks = (n.ranks ?? []).map(r => ({ query: r.query, now: r.rank, before: (b.ranks ?? []).find(x => x.query === r.query)?.rank ?? null }))
  const rankText = (v: number | null) => (v ? <span>Platz {v}</span> : <span>nicht unter den ersten Treffern</span>)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <section style={{ ...card, borderLeft: '4px solid var(--electric)' }}>
        {kick('Ihr Ergebnis')}
        <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 12px' }}>Ausgangslage vom {fmtDate(base.created_at)} im Vergleich zur Prüfung vom {fmtDate(now.created_at)}</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
          <span className="display" style={{ fontSize: 'clamp(34px, 5vw, 56px)', color: 'var(--muted)' }}>{tb ?? '—'}</span>
          <span aria-hidden style={{ fontSize: 28, color: 'var(--muted)' }}>→</span>
          <span className="display" style={{ fontSize: 'clamp(34px, 5vw, 56px)', color: 'var(--electric)' }}>{tn ?? '—'}</span>
          <span style={{ fontSize: 14, color: 'var(--muted)' }}>von 100 Punkten</span>
          <Delta d={diff(tb, tn)} />
        </div>
      </section>

      <section style={card}>
        {kick('Nach Kanälen')}
        <div style={{ display: 'grid', gap: 16 }}>
          {CHANNELS.map(([k, label]) => {
            const sb = score(b, k), sn = score(n, k)
            if (sb === null && sn === null) return null
            return (
              <div key={k} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '6px 14px', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{label}</span>
                <span style={{ fontSize: 14, whiteSpace: 'nowrap' }}>{sb ?? '—'} → <strong>{sn ?? '—'}</strong><Delta d={diff(sb, sn)} /></span>
                <span style={{ gridColumn: '1 / -1' }}><Bars before={sb} after={sn} /></span>
              </div>
            )
          })}
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '14px 0 0', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <span><span aria-hidden style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, backgroundColor: '#C9C5E8', marginRight: 6 }} />Ausgangslage</span>
          <span><span aria-hidden style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, backgroundColor: 'var(--electric)', marginRight: 6 }} />Heute</span>
        </p>
      </section>

      {(youB || youN || ranks.length > 0) && (
        <section style={card}>
          {kick('Google Maps')}
          <div style={{ display: 'grid', gap: 8, fontSize: 14.5 }}>
            {(youB || youN) && <>
              <p style={{ margin: 0 }}>Bewertung: {fmtRating(youB?.rating)} → <strong>{fmtRating(youN?.rating)}</strong></p>
              <p style={{ margin: 0 }}>Anzahl der Bewertungen: {youB?.reviews ?? '—'} → <strong>{youN?.reviews ?? '—'}</strong><Delta d={diff(youB?.reviews, youN?.reviews)} /></p>
            </>}
            {ranks.map(r => (
              <p key={r.query} style={{ margin: 0 }}>«{r.query}»: {rankText(r.before)} → <strong>{rankText(r.now)}</strong></p>
            ))}
          </div>
        </section>
      )}

      {(b.ai || n.ai) && (
        <section style={card}>
          {kick('KI-Assistenten')}
          <p style={{ fontSize: 14.5, margin: 0 }}>
            Genannt in {b.ai?.mentioned ?? 0} von {b.ai?.asked ?? 0} Antworten → <strong>{n.ai?.mentioned ?? 0} von {n.ai?.asked ?? 0}</strong>
          </p>
        </section>
      )}
    </div>
  )
}
