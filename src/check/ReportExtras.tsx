// Kundenbereich, Bericht v2: Vergleich mit Wettbewerbern, KI-Antworten, Verlauf der Versionen.
import { dateLocale } from '../i18n'
import { reportTotal, type Report, type ReportVersion } from './data'

const card: React.CSSProperties = { backgroundColor: '#fff', borderRadius: 22, border: '1px solid var(--line-soft)', padding: 'clamp(20px, 2.6vw, 28px)' }
const kick = (t: string) => <p className="kick" style={{ fontSize: 12, color: 'var(--electric)', marginBottom: 10 }}>{t}</p>
const th: React.CSSProperties = { textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--muted)', padding: '0 8px 8px 0' }
const td: React.CSSProperties = { padding: '10px 8px 10px 0', borderTop: '1px solid var(--line-soft)', fontSize: 14 }
const fmtDate = (d: string) => new Date(d).toLocaleDateString(dateLocale(), { day: 'numeric', month: 'long', year: 'numeric' })

export function Delta({ d }: { d: number | null }) {
  if (!d) return null
  return <span style={{ fontSize: 12.5, fontWeight: 700, padding: '2px 8px', borderRadius: 999, marginLeft: 8, color: d > 0 ? '#0B5E30' : '#A21C22', backgroundColor: d > 0 ? '#E6F6EC' : '#FDE8E8', letterSpacing: 0, verticalAlign: 'middle' }}>{d > 0 ? '+' : ''}{d}</span>
}

/** Differenz zur vorigen Version je Kanal und gesamt. */
export function deltas(cur: Report | null | undefined, prev: Report | null | undefined) {
  const ch = (k: string) => {
    const a = cur?.channels?.[k as 'ai']?.score, b = prev?.channels?.[k as 'ai']?.score
    return typeof a === 'number' && typeof b === 'number' ? a - b : null
  }
  const t = reportTotal(cur), p = reportTotal(prev)
  return { ch, total: t !== null && p !== null ? t - p : null }
}

export function CompetitorsCard({ report }: { report: Report }) {
  const c = report.competitors
  if (!c) return null
  const rows = [...c.list.map(x => ({ ...x, me: false })), { ...c.you, me: true }]
    .sort((a, b) => (b.reviews - a.reviews) || ((b.rating ?? 0) - (a.rating ?? 0)))
  return (
    <section style={card}>
      {kick('Sie im Vergleich')}
      <p className="display" style={{ fontSize: 'clamp(20px, 2.2vw, 26px)', lineHeight: 1.2, margin: '0 0 6px' }}>
        <span>Bei Google Maps</span> «{c.query}»: {c.rank ? <span>Platz {c.rank}</span> : <span>nicht unter den ersten Treffern</span>}
      </p>
      <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 14px', lineHeight: 1.6 }}>So stehen Sie im Vergleich zu den Betrieben, die Kunden bei dieser Suche zuerst sehen.</p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420 }}>
          <thead><tr><th style={th}>Unternehmen</th><th style={th}>Bewertung</th><th style={th}>Bewertungen</th><th style={th}>Website</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ backgroundColor: r.me ? '#EEEBFF' : undefined }}>
                <td style={{ ...td, fontWeight: r.me ? 700 : 500, paddingLeft: r.me ? 8 : 0 }}>{r.name}{r.me && <span style={{ fontSize: 12, color: 'var(--electric)', marginLeft: 6 }}>Sie</span>}</td>
                <td style={td}>{r.rating !== null ? `${r.rating.toLocaleString(dateLocale(), { minimumFractionDigits: 1 })} ★` : '—'}</td>
                <td style={td}>{r.reviews}</td>
                <td style={td}>{r.website ? '✓' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(report.ranks ?? []).length > 1 && (
        <div style={{ marginTop: 14 }}>
          {report.ranks!.map(r => (
            <p key={r.query} style={{ fontSize: 14, margin: '6px 0 0' }}>«{r.query}»: <strong>{r.rank ? <span>Platz {r.rank}</span> : <span>nicht unter den ersten Treffern</span>}</strong></p>
          ))}
        </div>
      )}
    </section>
  )
}

export function AiCard({ report }: { report: Report }) {
  const a = report.ai
  if (!a) return null
  return (
    <section style={card}>
      {kick('Was KI-Assistenten antworten')}
      <p className="display" style={{ fontSize: 'clamp(20px, 2.2vw, 26px)', lineHeight: 1.2, margin: '0 0 8px' }}>
        <span>{a.mentioned}</span> <span>von</span> <span>{a.asked}</span> <span>Antworten nennen Ihr Unternehmen</span>
      </p>
      <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0, lineHeight: 1.6 }}>Wir haben ChatGPT, Perplexity und Gemini die Fragen gestellt, die Ihre Kunden stellen würden.</p>
      {a.named && <p style={{ fontSize: 14, margin: '12px 0 0' }}><span style={{ color: 'var(--muted)' }}>Stattdessen empfohlen:</span> <strong>{a.named}</strong></p>}
    </section>
  )
}

export function HistoryCard({ versions }: { versions: ReportVersion[] }) {
  if (versions.length < 2) return null
  return (
    <section style={card}>
      {kick('Verlauf')}
      <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 12px', lineHeight: 1.6 }}>Nach jeder Arbeitsphase prüfen wir erneut — so sehen Sie, was sich verbessert hat.</p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
          <thead><tr><th style={th}>Datum</th><th style={th}>Gesamt</th><th style={th}>KI-Suche</th><th style={th}>Google Maps</th><th style={th}>Website</th><th style={th}>Social Media</th></tr></thead>
          <tbody>
            {versions.map((v, i) => {
              const d = deltas(v.report, versions[i + 1]?.report)
              const cell = (k: string) => <td style={td}>{v.report.channels?.[k as 'ai']?.score ?? '—'}<Delta d={d.ch(k)} /></td>
              return (
                <tr key={v.id}>
                  <td style={{ ...td, whiteSpace: 'nowrap' }}>{fmtDate(v.created_at)}</td>
                  <td style={{ ...td, fontWeight: 700 }}>{reportTotal(v.report) ?? '—'}<Delta d={d.total} /></td>
                  {cell('ai')}{cell('maps')}{cell('search')}{cell('social')}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
