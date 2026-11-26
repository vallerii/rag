// Анализ проверок «ждёт анализа» вне таблиц (docs/lead-flow.md): план B (команда копирует задание в Grok / любой ИИ
// и вставляет ответ) и позже MCP для Grok. Правило «кто первый, тот и прав»: пункты автопроверки (Places, сайт,
// PageSpeed) уже есть и в задании помечены как проверенные; ИИ дописывает только остальное.
// Итоговые колонки = строки автопроверки + строки ИИ → та же формула оценок, что у CRM (grade.ts).
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { parseFindings } from './grade.ts'
import { publishAnalysis } from './lookup.ts'

type Mark = 'ok' | 'warn' | 'bad'
type Item = { mark: Mark; text: string }
type Draft = { items?: Partial<Record<'maps' | 'search' | 'social' | 'ai', Item[]>> } | null
type Audit = { competitors?: { query?: string; rank?: number | null; list?: unknown[] } | null; keywords?: string[]; pagespeed?: { score?: number | null } | null } | null
export type QueueCheck = { id: string; place: Record<string, unknown> | null; report_draft: Draft; audit: Audit; analysis_status: string }

const COLUMN = { maps: 'Befund Google-Profil', search: 'Befund Website', social: 'Befund Social Media', ai: 'Befund KI-Suche' } as const
const SIGN: Record<Mark, string> = { ok: '+', warn: '~', bad: '–' }
/** Колонки, которые принимает ответ ИИ (названия — как в таблицах лидов). */
export const RESULT_COLUMNS = ['Befund Google-Profil', 'Befund Website', 'Befund Social Media', 'Befund KI-Suche', 'Platz Google-Suche', 'KI-Antworten', 'Verzeichnisse', 'Mitbewerber Maps', 'Empfehlungen', 'Belege']

/** Строки автопроверки по областям, в формате «+ / ~ / – текст». */
export function placesLines(check: Pick<QueueCheck, 'report_draft'>): Record<keyof typeof COLUMN, string[]> {
  const items = check.report_draft?.items ?? {}
  const out = { maps: [] as string[], search: [] as string[], social: [] as string[], ai: [] as string[] }
  for (const k of Object.keys(out) as (keyof typeof COLUMN)[]) {
    for (const i of items[k] ?? []) if (i?.text && SIGN[i.mark]) out[k].push(`${SIGN[i.mark]} ${i.text}`)
  }
  return out
}

/** Данные компании для ИИ: без e-mail, имени и телефона клиента; что уже проверено автоматически. */
export function companyInfo(c: QueueCheck) {
  const p = (c.place ?? {}) as Record<string, string | null>
  const known = placesLines(c)
  const all = [...known.maps, ...known.search, ...known.social, ...known.ai]
  return {
    id: c.id, Firma: p.name ?? '', Branche: p.category ?? '', Stadt: p.city ?? '', Adresse: p.address ?? '', Website: p.website ?? '',
    Suchbegriff: c.audit?.keywords?.[0] ?? c.audit?.competitors?.query ?? '',
    // Keine Autoprüfung (z. B. Kundenbereich nie geöffnet): ausdrücklich alles prüfen lassen.
    'Schon automatisch geprüft (nicht erneut prüfen)': all.length ? all : ['nichts — bitte ALLE Punkte prüfen, auch Bewertungen, Google Maps und die Technik der Website'],
  }
}

/** Правила анализа (как промпт таблицы лидов), общие для плана B и MCP. */
export const TASK_RULES = `Ты — аналитик цифровой видимости местных фирм в Германии. Проверь каждую фирму по тем же правилам, что и строки таблицы лидов (промпт «rag-analysis-prompt»):
- только то, что ты сам увидел и можешь подтвердить ссылкой; не удалось проверить — не пиши ничего;
- в колонках «Befund …» — одна находка на строку, по-немецки, до 140 символов, каждая строка начинается со знака «+ » (выполнено), «~ » (частично) или «– » (не выполнено); записывай и хорошее, и плохое;
- сухой тон протокола, без оценочных слов, без юридических оценок, конкурентов не называть по имени («ein Mitbewerber aus [Ort]»), отзывы не цитировать;
- ссылки, даты и пометки для команды — только в «Belege».

У каждой фирмы есть список «Schon automatisch geprüft» — эти пункты (отзывы, рейтинг, место в Google Maps, конкуренты, техника сайта, PageSpeed, Impressum) уже проверены автоматически. Их НЕ проверяй и НЕ повторяй. Проверь только остальное: подтверждён ли профиль, ответы владельца на отзывы, каталоги (Gelbe Seiten, Das Örtliche, 11880, Apple Maps, Bing Places …) и совпадение названия, адреса, телефона, соцсети, ИИ-поиск, место собственного сайта в Google-поиске, страницы под услуги, ответы на вопросы клиентов. Если в списке написано, что Google-профиля или сайта нет, или что ничего не проверено, — проверь эти пункты сам.`

/** Задание для ИИ (план B): правила + компании + формат ответа. */
export function buildTask(list: QueueCheck[]): string {
  return `${TASK_RULES}

Ответь ТОЛЬКО JSON-массивом, по объекту на фирму, без текста вокруг:
[{"id": "<id из списка>", "Befund Google-Profil": "+ …\\n– …", "Befund Website": "…", "Befund Social Media": "…", "Befund KI-Suche": "…", "Platz Google-Suche": "7 | nicht unter den ersten 10 | –", "KI-Antworten": "Frage — Platz N | Frage — nicht genannt (по строке на вопрос)", "Verzeichnisse": "…", "Empfehlungen": "Titel — kurze Erklärung (3 строки)", "Belege": "…"}]
Пустые колонки можно не писать.

Фирмы:
${JSON.stringify(list.map(companyInfo), null, 1)}`
}

export type ParsedResult = { id: string; columns: Record<string, string>; belege: string }
/** Ответ ИИ → результаты. Принимает JSON-массив как есть или внутри текста / блока ```json. */
export function parseResults(text: string): { results: ParsedResult[]; errors: string[] } {
  const errors: string[] = []
  const start = text.indexOf('['), end = text.lastIndexOf(']')
  let raw: unknown
  try { raw = JSON.parse(start >= 0 && end > start ? text.slice(start, end + 1) : text) } catch { return { results: [], errors: ['Die Antwort ist kein JSON-Array'] } }
  if (!Array.isArray(raw)) return { results: [], errors: ['Die Antwort ist kein JSON-Array'] }
  const results: ParsedResult[] = []
  raw.forEach((r, i) => {
    const o = (r ?? {}) as Record<string, unknown>
    const id = String(o.id ?? '').trim()
    if (!/^[0-9a-f-]{36}$/i.test(id)) { errors.push(`Eintrag ${i + 1}: keine gültige id`); return }
    const columns: Record<string, string> = {}
    for (const c of RESULT_COLUMNS) {
      if (c === 'Belege') continue
      const v = o[c]
      if (typeof v === 'string' && v.trim()) columns[c] = v.trim().slice(0, 4000)
      else if (Array.isArray(v)) columns[c] = v.map(String).join('\n').slice(0, 4000)
    }
    const findings = (['Befund Google-Profil', 'Befund Website', 'Befund Social Media', 'Befund KI-Suche']).reduce((n, c) => n + parseFindings(columns[c]).length, 0)
    if (!findings) { errors.push(`Eintrag ${i + 1} (${id}): keine Zeile mit «+ / ~ / –» in «Befund …»`); return }
    results.push({ id, columns, belege: typeof o.Belege === 'string' ? o.Belege.slice(0, 20000) : '' })
  })
  return { results, errors }
}

/** Строки автопроверки + строки ИИ → колонки анализа (как строка таблицы лидов). */
export function mergeColumns(check: Pick<QueueCheck, 'report_draft' | 'audit'>, ai: Record<string, string>, today: string): Record<string, string> {
  const known = placesLines(check)
  const out: Record<string, string> = {}
  for (const k of Object.keys(COLUMN) as (keyof typeof COLUMN)[]) {
    const col = COLUMN[k]
    const lines = [...known[k], ...String(ai[col] ?? '').split(/\r?\n/).map(l => l.trim()).filter(Boolean)]
    if (lines.length) out[col] = lines.join('\n')
  }
  for (const c of RESULT_COLUMNS) if (!c.startsWith('Befund') && c !== 'Belege' && ai[c]) out[c] = ai[c]
  const rank = check.audit?.competitors?.rank
  if (check.audit?.competitors) out['Platz Google Maps'] = typeof rank === 'number' && rank > 0 ? String(rank) : `nicht unter den ersten ${check.audit.competitors.list?.length || 10}`
  if (check.audit?.keywords?.[0]) out['Suchbegriff'] = check.audit.keywords[0]
  out['Datum der Prüfung'] = today
  return out
}

/** Сохранить анализ (вручную / Grok) и сразу опубликовать отчёт с письмом «Analyse fertig». */
export async function saveAnalysis(db: SupabaseClient, r: ParsedResult, source: 'manual' | 'grok'): Promise<{ id: string; ok: boolean; reason?: string }> {
  const { data: check } = await db.from('checks').select('id, report_draft, audit, analysis_status').eq('id', r.id).maybeSingle()
  if (!check) return { id: r.id, ok: false, reason: 'Prüfung nicht gefunden' }
  if (!['pending', 'in_progress'].includes(check.analysis_status)) return { id: r.id, ok: false, reason: `Status «${check.analysis_status}»: wartet nicht auf eine Analyse` }
  const today = new Date().toISOString().slice(0, 10)
  const columns = mergeColumns(check as QueueCheck, r.columns, today)
  const { error } = await db.from('checks').update({
    analysis: { columns }, analysis_source: source, analysis_at: today, analysis_status: 'done', analysis_error: null, analysis_taken_at: null,
  }).eq('id', r.id).in('analysis_status', ['pending', 'in_progress'])
  if (error) return { id: r.id, ok: false, reason: error.message }
  await db.from('check_analysis_private').upsert({ check_id: r.id, source, row: { ...r.columns, Belege: r.belege }, matched_by: null, duplicates: [], from_check: null, sheet: null, row_number: null, lead_sheet_id: null })
  const published = await publishAnalysis(db, r.id)
  return { id: r.id, ok: true, reason: published ? undefined : 'gespeichert, Bericht nicht veröffentlicht (vom Team schon veröffentlicht?)' }
}
