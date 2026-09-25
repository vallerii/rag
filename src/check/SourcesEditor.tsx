import { SOURCE_LABELS, type Source } from './data'

// Liste Website + Social-Media-Profile mit Status «Gefunden / Ergänzt / Nicht gefunden».
// Wird im Kundenbereich zum Bestätigen der gefundenen Quellen verwendet.

const SOURCE_ICON: Record<string, string> = { website: 'W', instagram: 'IG', facebook: 'FB', linkedin: 'in', tiktok: 'TT' }
const field: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1px solid rgba(7,7,12,0.14)', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', outline: 'none', color: 'var(--ink)', backgroundColor: '#fff' }

export default function SourcesEditor({ sources, onChange }: { sources: Source[]; onChange: (next: Source[]) => void }) {
  const set = (i: number, value: string) => onChange(sources.map((x, j) => (j === i ? { ...x, value } : x)))
  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 20, overflow: 'hidden', backgroundColor: '#fff' }}>
      {sources.map((s, i) => (
        <div key={s.key} className="ck-source" style={{ display: 'grid', gridTemplateColumns: '40px 110px minmax(0, 1fr) auto', gap: 14, alignItems: 'center', padding: '14px 18px', borderTop: i ? '1px solid var(--line-soft)' : 'none' }}>
          <span style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: s.value ? '#EEEBFF' : 'var(--bone)', color: s.value ? 'var(--electric)' : 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>{SOURCE_ICON[s.key]}</span>
          <label htmlFor={`src-${s.key}`} style={{ fontWeight: 600, fontSize: 14.5 }}>{SOURCE_LABELS[s.key]}</label>
          <input id={`src-${s.key}`} value={s.value} onChange={e => set(i, e.target.value)} placeholder="Nicht gefunden — hier eintragen" style={field} />
          <span style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', minWidth: 112, textAlign: 'center', padding: '5px 10px', borderRadius: 999, color: s.found ? '#0F7A3E' : s.value ? 'var(--electric)' : 'var(--muted)', backgroundColor: s.found ? '#E6F6EC' : s.value ? '#EEEBFF' : 'var(--bone)' }}>
            {s.found ? 'Gefunden ✓' : s.value ? 'Ergänzt' : 'Nicht gefunden'}
          </span>
        </div>
      ))}
    </div>
  )
}
