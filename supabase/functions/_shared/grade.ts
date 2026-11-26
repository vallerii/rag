// Оценки анализа — та же формула, что в Lead CRM (leadcrm/lib/letters/data.js, ветка «analysis»: колонки «Befund …»).
// Оценки на сайте должны совпадать с письмом. Менять только вместе с CRM; тест: supabase/tests/grade.test.ts
// (ожидаемые значения сгенерированы самой CRM: scripts/grade-fixtures.mjs).
// Чистый TypeScript: Edge Functions и тесты под Node.

export type Mark = 'ok' | 'partial' | 'bad'
export type Finding = { mark: Mark; text: string }
export type SectionKey = 'maps' | 'website' | 'social' | 'ai'
export type Rank = { rank: number | null; beyond?: number; missing?: boolean }
export type AiAnswer = { question: string; rank: number | null; named: boolean }
export type Ranks = { maps: Rank | null; search: Rank | null; ai: { answers: AiAnswer[]; named: number; total: number } | null }
export type Section = { key: SectionKey; findings: Finding[]; score: number | null; grade: string }
export type Graded = { sections: Section[]; total: number | null; totalGrade: string; ranks: Ranks; query: string }

export const sectionKeys: SectionKey[] = ['maps', 'website', 'social', 'ai']
const sectionHeaders: Record<SectionKey, RegExp> = {
  maps: /^befund\s+google/i,
  website: /^befund\s+website/i,
  social: /^befund\s+social/i,
  ai: /^befund\s+(?:ki|ai)\b/i,
}
const rankHeaders = { mapsRank: /^platz\s+google[- ]?maps$/i, searchRank: /^platz\s+google[- ]?suche$/i, aiAnswers: /^ki[- ]?antworten$/i }
const queryHeader = /^(?:suchbegriff|search (?:term|query)|keyword|запрос)$/i
const empty = (v: unknown) => /^(?:[-—–]|n\/?a|none|unknown|keine?|нет)$/i.test(String(v ?? '').trim())

type Payload = Record<string, string>
const findColumn = (p: Payload, re: RegExp) => Object.keys(p).find(name => re.test(name.trim())) ?? null
function column(p: Payload, re: RegExp): string {
  const hit = Object.entries(p).find(([name, value]) => re.test(name.trim()) && String(value ?? '').trim() && !empty(value))
  return hit ? String(hit[1]).trim() : ''
}

/** «+ Platz 1 …\n– Keine Sitemap» → [{mark:'ok',text},{mark:'bad',text}]. Строки без знака не читаются. */
export function parseFindings(text: unknown): Finding[] {
  const out: Finding[] = []
  for (const raw of String(text ?? '').split(/\r?\n/)) {
    const m = /^\s*([+~\-–—−✓✗])\s*(.+)$/.exec(raw)
    if (!m || m[2].trim().length < 3) continue
    const mark: Mark = m[1] === '+' || m[1] === '✓' ? 'ok' : m[1] === '~' ? 'partial' : 'bad'
    out.push({ mark, text: m[2].trim() })
  }
  return out
}

/** «4», «Platz 4» → {rank:4}; «nicht unter den ersten 10» → {rank:null,beyond:10}; «–», «nicht gefunden» → {missing}; пусто → null. */
export function parseRank(value: unknown): Rank | null {
  const text = String(value ?? '').trim()
  if (!text) return null
  const beyond = /nicht unter (?:den )?(?:ersten )?(\d+)/i.exec(text)
  if (beyond) return { rank: null, beyond: Number(beyond[1]) }
  const rank = /^(?:platz\s*)?(\d{1,3})\.?$/i.exec(text) || /platz\s*(\d{1,3})/i.exec(text)
  if (rank) return { rank: Number(rank[1]) }
  if (/^[-–—]$|nicht gefunden|nicht genannt|keine/i.test(text)) return { rank: null, missing: true }
  return null
}

/** «Wen kann ich … beauftragen? — Platz 2» построчно → [{question,rank,named}] */
export function parseAiAnswers(text: unknown): AiAnswer[] {
  const out: AiAnswer[] = []
  for (const line of String(text ?? '').split(/\r?\n/)) {
    const m = /^\s*(.+?)\s+[—–|-]\s+(.+?)\s*$/.exec(line)
    if (!m) continue
    const result = parseRank(m[2])
    if (!result) continue
    out.push({ question: m[1].replace(/^\s*(?:\d+[.)]|[-–•])\s*/, '').trim(), rank: result.rank, named: result.rank != null })
  }
  return out.slice(0, 5)
}

function rankFromFindings(lines: Finding[], re: RegExp): Rank | null {
  for (const f of lines) { const m = re.exec(f.text); if (m) return m[1] ? { rank: Number(m[1]) } : { rank: null, beyond: Number(m[2]) } }
  return null
}
function ranksOf(p: Payload, findings: Record<SectionKey, Finding[]>): Ranks {
  const value = (re: RegExp) => { const name = findColumn(p, re); return name ? p[name] : '' }
  const maps = parseRank(value(rankHeaders.mapsRank)) || rankFromFindings(findings.maps, /Platz (\d+) bei «[^»]*» in Google Maps|nicht unter den ersten (\d+) in Google Maps/i)
  const search = parseRank(value(rankHeaders.searchRank)) || rankFromFindings(findings.website, /Platz (\d+) in der Google-Suche|in der Google-Suche nicht unter den ersten (\d+)/i)
  const answers = parseAiAnswers(value(rankHeaders.aiAnswers))
  let ai: Ranks['ai'] = null
  if (answers.length) ai = { answers, named: answers.filter(a => a.named).length, total: answers.length }
  else for (const f of findings.ai) {
    const some = /In (\d+) von (\d+) Antworten/i.exec(f.text), none = /In keiner von (\d+) Antworten/i.exec(f.text)
    if (some) { ai = { answers: [], named: Number(some[1]), total: Number(some[2]) }; break }
    if (none) { ai = { answers: [], named: 0, total: Number(none[1]) }; break }
  }
  return { maps, search, ai }
}

/** Доля выполненных пунктов. Один выполненный пункт — не основание для оценки; один невыполненный — оценивается. */
export function sectionScore(findings: Finding[]): number | null {
  if (!findings.length) return null
  if (findings.length < 2 && findings[0].mark !== 'bad') return null
  const points = findings.reduce((sum, f) => sum + (f.mark === 'ok' ? 1 : f.mark === 'partial' ? 0.5 : 0), 0)
  return Math.round(points / findings.length * 100)
}
// Позиции весят больше отдельных пунктов. Топ-3 = 1, места 4–10 = 0,5, дальше или не назван = 0.
export const positionWeight = { ai: 0.7, website: 0.3 }
export function positionPoints(rank: Rank | null | { rank: number | null }): number {
  if (!rank) return 0
  if (rank.rank) return rank.rank <= 3 ? 1 : rank.rank <= 10 ? 0.5 : 0
  return 0
}
export function aiVisibility(ai: Ranks['ai']): number | null {
  if (!ai?.total) return null
  if (ai.answers?.length) return ai.answers.reduce((sum, a) => sum + (a.named ? positionPoints({ rank: a.rank }) : 0), 0) / ai.answers.length
  return ai.named / ai.total
}
const ratio = (lines: Finding[]) => lines.length ? lines.reduce((sum, f) => sum + (f.mark === 'ok' ? 1 : f.mark === 'partial' ? 0.5 : 0), 0) / lines.length : null
// KI-Suche: в основном называют ли фирму ассистенты (70 %), остальные пункты 30 %. Website: пункты 70 %, место в Google-поиске 30 %.
function weightedScore(key: SectionKey, lines: Finding[], ranks: Ranks): number | null {
  if (key === 'ai') {
    const vis = aiVisibility(ranks.ai)
    if (vis == null) return sectionScore(lines)
    const rest = ratio(lines.filter(f => !/Antworten/i.test(f.text)))
    return Math.round(100 * (rest == null ? vis : positionWeight.ai * vis + (1 - positionWeight.ai) * rest))
  }
  if (key === 'website' && ranks.search) {
    const pts = positionPoints(ranks.search)
    const rest = ratio(lines.filter(f => !/Google-Suche/i.test(f.text)))
    return Math.round(100 * (rest == null ? pts : (1 - positionWeight.website) * rest + positionWeight.website * pts))
  }
  return sectionScore(lines)
}
export function grade(score: number | null): string {
  if (typeof score !== 'number') return 'nicht geprüft'
  return score >= 90 ? 'sehr gut' : score >= 75 ? 'gut' : score >= 60 ? 'befriedigend' : score >= 45 ? 'ausreichend' : score >= 25 ? 'mangelhaft' : 'ungenügend'
}

/** Есть ли анализ (хотя бы одна находка в колонках «Befund …»). Без него CRM письмо не создаёт. */
export function hasFindings(p: Payload): boolean {
  return sectionKeys.some(key => { const name = findColumn(p, sectionHeaders[key]); return !!name && parseFindings(p[name]).length > 0 })
}

/** Области, оценки и общая оценка — как letterData() в CRM для строки с колонками анализа. */
export function gradeAnalysis(p: Payload): Graded {
  let findings = {} as Record<SectionKey, Finding[]>
  for (const key of sectionKeys) { const name = findColumn(p, sectionHeaders[key]); findings[key] = name ? parseFindings(p[name]) : [] }
  const ranks = ranksOf(p, findings)
  const query = column(p, queryHeader)
  // Место в Google-поиске входит в оценку Website — поэтому оно и строкой в области Website.
  if (ranks.search && !ranks.search.missing && !findings.website.some(f => /Google-Suche/i.test(f.text))) {
    const where = query ? ` bei «${query}»` : ''
    findings = { ...findings, website: [...findings.website, ranks.search.rank
      ? { mark: ranks.search.rank <= 3 ? 'ok' : ranks.search.rank <= 10 ? 'partial' : 'bad', text: `Platz ${ranks.search.rank} in der Google-Suche${where}.` }
      : { mark: 'bad', text: `In der Google-Suche${where} nicht unter den ersten ${ranks.search.beyond || 10}.` }] }
  }
  const sections = sectionKeys.map(key => {
    const score = weightedScore(key, findings[key], ranks)
    return { key, findings: findings[key], score, grade: findings[key].length && score == null ? 'nicht bewertet' : grade(score) }
  })
  const checked = sections.filter(x => x.score != null)
  const total = checked.length ? Math.round(checked.reduce((sum, x) => sum + (x.score as number), 0) / checked.length) : null
  return { sections, total, totalGrade: grade(total), ranks, query }
}
