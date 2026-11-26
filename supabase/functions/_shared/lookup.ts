// Поиск готового анализа для новой проверки и публикация отчёта системой (docs/lead-flow.md).
// Используют: Edge Function audit-collect (кабинет клиента сразу после регистрации) и analysis-lookup (команда, повтор).
//   1) другая проверка той же компании с готовым анализом → копия;
//   2) строка в подключённых таблицах лидов (lead_sheets) с анализом Grok → копия;
//   3) ничего → analysis_status = 'pending' (дальше Places + Grok / вручную).
// Клиенту в checks.analysis — только колонки анализа; полная строка (Belege, заметки) — в check_analysis_private.
// Google не ответил → статус остаётся 'lookup' (analysis_error), повтор позже.
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { bestMatch, clientColumns, hasAnalysis, keysOfPlace, keysOfRow, rowDate, sameCompany, type Candidate } from './leadkey.ts'
import { parseServiceAccount, readTab, SheetError, type Tab } from './sheets.ts'
import { analysisReport } from './analysis-report.ts'

export type LookupCheck = { id: string; place_id: string | null; place: Record<string, unknown> | null; analysis_status: string }
export type LookupResult = { status: 'done' | 'pending' | 'retry'; source?: 'check' | 'sheet'; detail?: string; published?: boolean }
type Sheet = { id: string; spreadsheet_id: string; gid: number; title: string | null; tab_title: string | null }
type Db = SupabaseClient

/** Отчёт из готового анализа (таблица / другая проверка) публикует система: без менеджера, без письма. */
export async function publishAnalysis(db: Db, checkId: string): Promise<boolean> {
  const { data: c } = await db.from('checks').select('analysis, analysis_at, analysis_status, analysis_source, status, report').eq('id', checkId).maybeSingle()
  // Schon veröffentlicht — außer es ist nur der Teilbericht der Autoprüfung (partial), den die fertige Analyse ersetzt.
  const partial = !!(c?.report as { partial?: boolean } | null)?.partial
  if (!c || c.analysis_status !== 'done' || (c.status === 'ready' && !partial) || !['sheet', 'check'].includes(c.analysis_source)) return false
  const columns = (c.analysis as { columns?: Record<string, string> } | null)?.columns ?? {}
  const report = analysisReport(columns, c.analysis_at ? String(c.analysis_at).slice(0, 10) : null)
  if (!Object.keys(report.channels).length) return false
  const { data, error } = await db.rpc('publish_system_report', { p_check: checkId, p_report: report })
  if (error) throw error
  return data === true
}

async function fromOtherCheck(db: Db, check: LookupCheck, keys: string[]): Promise<LookupResult | null> {
  const { data } = await db.from('checks').select('id, company_keys, analysis, analysis_source, analysis_at')
    .eq('analysis_status', 'done').in('analysis_source', ['sheet', 'grok', 'manual', 'check'])
    .neq('id', check.id).overlaps('company_keys', keys)
    .order('analysis_at', { ascending: false, nullsFirst: false }).limit(10)
  const other = (data ?? []).find(o => sameCompany(keys, o.company_keys ?? []))
  if (!other) return null
  const { data: priv } = await db.from('check_analysis_private').select('*').eq('check_id', other.id).maybeSingle()
  const { error } = await db.from('checks').update({
    analysis: other.analysis, analysis_source: 'check', analysis_at: other.analysis_at, analysis_status: 'done', analysis_error: null,
  }).eq('id', check.id).eq('analysis_status', check.analysis_status)
  if (error) throw error
  await db.from('check_analysis_private').upsert({
    check_id: check.id, source: 'check', from_check: other.id, lead_sheet_id: priv?.lead_sheet_id ?? null, sheet: priv?.sheet ?? null,
    row_number: priv?.row_number ?? null, matched_by: sameCompany(keys, other.company_keys), row: priv?.row ?? null, duplicates: priv?.duplicates ?? [],
  })
  return { status: 'done', source: 'check' }
}

export type SheetRows = { list: Candidate[]; where: Map<string, { sheet: Sheet; tab: Tab; n: number }>; errors: string[]; configError?: string; none?: boolean }
/** Все строки активных вкладок (читаются сейчас, параллельно). Ошибки чтения — в lead_sheets.last_error. */
export async function sheetRows(db: Db, serviceAccount: string | undefined): Promise<SheetRows> {
  const list: Candidate[] = [], where = new Map<string, { sheet: Sheet; tab: Tab; n: number }>(), errors: string[] = []
  const { data: sheets } = await db.from('lead_sheets').select('id, spreadsheet_id, gid, title, tab_title').eq('active', true)
  if (!sheets?.length) return { list, where, errors, none: true }
  let sa
  try { sa = parseServiceAccount(serviceAccount) } catch (e) { return { list, where, errors, configError: (e as Error).message } }
  const read = await Promise.allSettled((sheets as Sheet[]).map(s => readTab(sa, s.spreadsheet_id, Number(s.gid))))
  await Promise.all(read.map(async (r, i) => {
    const sheet = (sheets as Sheet[])[i]
    if (r.status === 'rejected') {
      const msg = r.reason instanceof SheetError ? r.reason.message : 'Google Sheets antwortet nicht'
      errors.push(`${sheet.title ?? sheet.spreadsheet_id}: ${msg}`)
      await db.from('lead_sheets').update({ last_error: msg }).eq('id', sheet.id)
      return
    }
    const tab = r.value
    await db.from('lead_sheets').update({ title: tab.title, tab_title: tab.tabTitle, row_count: tab.rows.length, last_read_at: new Date().toISOString(), last_error: null }).eq('id', sheet.id)
    for (const row of tab.rows) {
      const ref = `${sheet.id}#${row.n}`
      where.set(ref, { sheet, tab, n: row.n })
      list.push({ ref, row: row.data, keys: keysOfRow(row.data, tab.headers), date: rowDate(row.data, tab.headers), analysed: hasAnalysis(row.data) })
    }
  }))
  return { list, where, errors }
}

async function fromSheets(db: Db, check: LookupCheck, keys: string[], serviceAccount: string | undefined): Promise<LookupResult> {
  const { list, where, errors, configError, none } = await sheetRows(db, serviceAccount)
  if (none) return pending(db, check, null)
  if (configError) return retry(db, check, configError)

  const { best, others } = bestMatch(keys, list)
  if (best?.analysed) {
    const at = where.get(best.ref)!
    const duplicates = others.map(o => { const w = where.get(o.ref)!; return { sheet: w.tab.title, tab: w.tab.tabTitle, row_number: w.n, by: o.by, analysed: o.analysed } })
    const { error } = await db.from('checks').update({
      analysis: { columns: clientColumns(best.row) }, analysis_source: 'sheet', analysis_at: best.date, analysis_status: 'done', analysis_error: null,
    }).eq('id', check.id).eq('analysis_status', check.analysis_status)
    if (error) throw error
    await db.from('check_analysis_private').upsert({
      check_id: check.id, source: 'sheet', lead_sheet_id: at.sheet.id, row_number: at.n, matched_by: best.by, row: best.row, duplicates,
      sheet: { spreadsheet_id: at.sheet.spreadsheet_id, gid: at.sheet.gid, title: at.tab.title, tab_title: at.tab.tabTitle }, from_check: null,
    })
    return { status: 'done', source: 'sheet' }
  }
  // Не нашли, но часть таблиц не прочиталась — ответа «нет» дать нельзя, попробуем ещё раз позже.
  if (errors.length) return retry(db, check, errors.join('; '))
  if (best) {
    const w = where.get(best.ref)!
    return pending(db, check, `Zeile ohne Analyse: ${w.tab.title} / ${w.tab.tabTitle}, Zeile ${w.n}`)
  }
  return pending(db, check, null)
}

async function pending(db: Db, check: LookupCheck, note: string | null): Promise<LookupResult> {
  await db.from('checks').update({ analysis_status: 'pending', analysis_error: note }).eq('id', check.id).eq('analysis_status', check.analysis_status)
  return { status: 'pending', detail: note ?? undefined }
}
async function retry(db: Db, check: LookupCheck, error: string): Promise<LookupResult> {
  await db.from('checks').update({ analysis_error: error.slice(0, 500) }).eq('id', check.id)
  return { status: 'retry', detail: error }
}

/** Найти готовый анализ, скопировать и сразу опубликовать отчёт. Вызывать для analysis_status 'lookup' (команда — и для 'pending'). */
export async function findAnalysis(db: Db, check: LookupCheck, serviceAccount: string | undefined): Promise<LookupResult> {
  const keys = keysOfPlace({ ...(check.place ?? {}), id: check.place_id } as Parameters<typeof keysOfPlace>[0])
  await db.from('checks').update({ company_keys: keys, analysis_tried_at: new Date().toISOString() }).eq('id', check.id)
  if (!keys.length) return pending(db, check, 'Keine Merkmale zum Suchen (Name + PLZ, Website, Telefon, Google-Karte)')
  const r = (await fromOtherCheck(db, check, keys)) ?? (await fromSheets(db, check, keys, serviceAccount))
  if (r.status === 'done') r.published = await publishAnalysis(db, check.id)
  return r
}
