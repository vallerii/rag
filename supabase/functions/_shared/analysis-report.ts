// Отчёт клиента из готового анализа (строка таблицы лидов или анализ Grok) — формат checks.report v2,
// как в src/check/data.ts → Report. Оценки — формула CRM (grade.ts), поэтому отчёт совпадает с письмом.
// Области CRM → каналы OrtsFuchs: maps → maps, website → search, social → social, ai → ai.
import { gradeAnalysis, type Finding, type SectionKey } from './grade.ts'
import { PRIO, RECS, REC_ORDER } from './audit.ts'

type Mark = 'ok' | 'warn' | 'bad'
export type AnalysisChannel = { score: number | null; grade: string; summary: string; points: [Mark, string][] }
export type AnalysisReport = {
  version: 2
  source: 'analysis'
  channels: Partial<Record<'ai' | 'maps' | 'search' | 'social', AnalysisChannel>>
  recommendations: [string, string, string][]
  ai?: { asked: number; mentioned: number; named: string }
  total: number | null
  grade: string
  /** Дата самого анализа (из таблицы — «Datum der Prüfung» / «Checked On»). */
  collected_at: string | null
  published_at: string
}

const CHANNEL: Record<SectionKey, 'maps' | 'search' | 'social' | 'ai'> = { maps: 'maps', website: 'search', social: 'social', ai: 'ai' }
const mark = (f: Finding): Mark => (f.mark === 'partial' ? 'warn' : f.mark)

// Те же тексты, что у автопроверки (audit.ts), чтобы отчёты выглядели одинаково.
const SUMMARY: Record<SectionKey, [string, string, string]> = {
  maps: ['Das Google-Profil ist stark und gepflegt.', 'Das Profil ist eine gute Basis, hat aber einige offensichtliche Lücken.', 'Das Profil hat deutliche Lücken, hier verlieren Sie die meisten Anfragen.'],
  website: ['Die Website ist technisch solide aufgestellt.', 'Die Website funktioniert, verschenkt aber Sichtbarkeit bei Google.', 'Die Website hilft bei Google und in der KI-Suche kaum weiter.'],
  social: ['Die wichtigsten Profile sind vorhanden.', 'Es gibt Profile, aber noch Lücken.', 'In Social Media sind Sie kaum zu finden.'],
  ai: ['KI-Assistenten nennen Ihr Unternehmen regelmäßig.', 'KI-Assistenten nennen Ihr Unternehmen nur manchmal.', 'KI-Assistenten nennen Ihr Unternehmen kaum.'],
}
const NO_PROFILE = /kein google-?(?:unternehmens)?profil/i
function summary(key: SectionKey, score: number | null, findings: Finding[]): string {
  if (key === 'maps' && findings.some(f => f.mark === 'bad' && NO_PROFILE.test(f.text))) return 'Ihr Unternehmen hat kein Google-Profil, hier verlieren Sie die meisten Anfragen.'
  if (score == null) return 'Zu wenige geprüfte Punkte für eine Bewertung.'
  const [good, mid, weak] = SUMMARY[key]
  return score >= 75 ? good : score >= 50 ? mid : weak
}

// Невыполненный пункт → рекомендация из общего набора (audit.ts → RECS). Первое подходящее правило.
const RULES: Record<SectionKey, [string, RegExp][]> = {
  maps: [
    ['noprofile', NO_PROFILE],
    ['rating', /durchschnittliche bewertung/i],
    ['fresh', /letzte .*bewertung vor/i],
    ['reviews', /^(?!.*antwort).*bewertung/i],
    ['rank', /google maps|platz \d+ bei|nicht unter den ersten/i],
    ['nap', /abweichend|verzeichnis|örtliche|gelbe seiten|11880|apple maps|bing/i],
    ['hours', /öffnungszeiten/i],
    ['photos', /fotos?\b/i],
    ['website', /website|webseite/i],
  ],
  website: [
    ['nosite', /keine (?:eigene )?website/i],
    ['down', /nicht erreichbar/i],
    ['noindex', /gesperrt|noindex|robots/i],
    ['impressum', /impressum/i],
    ['datenschutz', /datenschutz/i],
    ['https', /https|nicht sicher/i],
    ['mobile', /smartphone|nicht .*mobil|handy nicht/i],
    ['pagespeed', /pagespeed|ladezeit/i],
    ['title', /meta-?description|seitenbeschreibung|seitentitel/i],
    ['schema', /strukturierte daten|json-ld|localbusiness/i],
    ['pages', /seiten für|eigene seiten|unterseiten|indexiert/i],
    ['ai_faq', /kundenfragen|faq|ratgeber/i],
  ],
  social: [['profiles', /.*/]],
  ai: [['ai_faq', /.*/]],
}

/** Рекомендации: колонка «Empfehlungen» (строка «Titel — Text»), иначе из невыполненных пунктов. */
function recommendations(columns: Record<string, string>, sections: { key: SectionKey; findings: Finding[] }[]): [string, string, string][] {
  const col = Object.keys(columns).find(h => /^empfehlungen$/i.test(h.trim()))
  const lines = col ? String(columns[col]).split(/\r?\n/).map(l => l.replace(/^\s*(?:\d+[.)]|[-–•])\s*/, '').trim()).filter(l => l.length > 3) : []
  if (lines.length) return lines.slice(0, 3).map((l, i): [string, string, string] => {
    const m = /^(.+?)\s+[—–-]\s+(.+)$/.exec(l)
    return [PRIO[i], m ? m[1] : l, m ? m[2] : '']
  })
  const open = new Set<string>()
  for (const s of sections) for (const f of s.findings) {
    if (f.mark === 'ok') continue
    const hit = RULES[s.key].find(([, re]) => re.test(f.text))
    if (hit) open.add(hit[0])
  }
  return REC_ORDER.filter(id => open.has(id)).slice(0, 3).map((id, n): [string, string, string] => [PRIO[n], RECS[id][0], RECS[id][1]])
}

export function analysisReport(columns: Record<string, string>, at: string | null, now = new Date()): AnalysisReport {
  const g = gradeAnalysis(columns)
  const channels: AnalysisReport['channels'] = {}
  for (const s of g.sections) {
    if (!s.findings.length) continue
    channels[CHANNEL[s.key]] = { score: s.score, grade: s.grade, summary: summary(s.key, s.score, s.findings), points: s.findings.map(f => [mark(f), f.text]) }
  }
  const report: AnalysisReport = {
    version: 2, source: 'analysis', channels, recommendations: recommendations(columns, g.sections),
    total: g.total, grade: g.totalGrade, collected_at: at, published_at: now.toISOString(),
  }
  if (g.ranks.ai) report.ai = { asked: g.ranks.ai.total, mentioned: g.ranks.ai.named, named: '' }
  return report
}
