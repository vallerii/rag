// POST { checkId, force? }  (Authorization: Bearer <Sitzung des Kunden oder eines Team-Mitglieds>)
// Ищет готовый анализ компании для новой проверки (docs/lead-flow.md, «Как найти строку компании»):
//   1) другая проверка той же компании с готовым анализом → копия;
//   2) строка в подключённых таблицах лидов (lead_sheets) с анализом Grok → копия;
//   3) ничего → analysis_status = 'pending' (анализ сделают Grok / вручную).
// Клиенту в checks.analysis попадают только колонки анализа; полная строка (Belege, заметки) — в check_analysis_private.
// Google не ответил → статус остаётся 'lookup' (analysis_error), повтор позже.
// Отчёт из анализа собирает следующий шаг (этап 3), здесь только поиск и копирование.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { handler, json } from '../_shared/http.ts'
import { bestMatch, clientColumns, hasAnalysis, keysOfPlace, keysOfRow, rowDate, sameCompany, type Candidate } from '../_shared/leadkey.ts'
import { parseServiceAccount, readTab, SheetError, type Tab } from '../_shared/sheets.ts'

const SERVER_KEY = Deno.env.get('SB_SECRET_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const db = createClient(Deno.env.get('SUPABASE_URL')!, SERVER_KEY, { auth: { persistSession: false } })

type Check = { id: string; user_id: string; place_id: string | null; place: Record<string, string | null> | null; analysis_status: string; analysis_source: string | null }
type Sheet = { id: string; spreadsheet_id: string; gid: number; title: string | null; tab_title: string | null }
type Result = { status: 'done' | 'pending' | 'retry' | string; source?: string | null; detail?: string }

async function isStaff(uid: string): Promise<boolean> {
  const { data } = await db.from('profiles').select('role').eq('id', uid).maybeSingle()
  return data?.role === 'admin' || data?.role === 'manager'
}

/** Тот же анализ уже есть у другой проверки этой компании. */
async function fromOtherCheck(check: Check, keys: string[]): Promise<Result | null> {
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

/** Строка компании в подключённых таблицах лидов. */
async function fromSheets(check: Check, keys: string[]): Promise<Result> {
  const { data: sheets } = await db.from('lead_sheets').select('id, spreadsheet_id, gid, title, tab_title').eq('active', true)
  if (!sheets?.length) return pending(check, null)
  let sa
  try { sa = parseServiceAccount(Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON')) }
  catch (e) { return retry(check, (e as Error).message) }

  const read = await Promise.allSettled((sheets as Sheet[]).map(s => readTab(sa, s.spreadsheet_id, Number(s.gid))))
  const list: Candidate[] = [], where = new Map<string, { sheet: Sheet; tab: Tab; n: number }>(), errors: string[] = []
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
  if (errors.length) return retry(check, errors.join('; '))
  if (best) {
    const w = where.get(best.ref)!
    return pending(check, `Zeile ohne Analyse: ${w.tab.title} / ${w.tab.tabTitle}, Zeile ${w.n}`)
  }
  return pending(check, null)
}

async function pending(check: Check, note: string | null): Promise<Result> {
  await db.from('checks').update({ analysis_status: 'pending', analysis_error: note }).eq('id', check.id).eq('analysis_status', check.analysis_status)
  return { status: 'pending', detail: note ?? undefined }
}
async function retry(check: Check, error: string): Promise<Result> {
  await db.from('checks').update({ analysis_error: error.slice(0, 500) }).eq('id', check.id)
  return { status: 'retry', detail: error }
}

Deno.serve(handler(20, async (req, body) => {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  const { data: auth } = await db.auth.getUser(token)
  if (!auth?.user) return json(req, { error: 'auth' }, 401)
  const { data: check } = await db.from('checks').select('id, user_id, place_id, place, analysis_status, analysis_source').eq('id', String(body.checkId ?? '')).maybeSingle()
  if (!check) return json(req, { error: 'not_found' }, 404)
  const staff = await isStaff(auth.user.id)
  if (check.user_id !== auth.user.id && !staff) return json(req, { error: 'not_found' }, 404)
  // Team darf die Suche wiederholen (z. B. nachdem eine Tabelle freigegeben wurde) — außer der Analyse ist schon da.
  const again = staff && body.force === true && ['lookup', 'pending'].includes(check.analysis_status)
  if (check.analysis_status !== 'lookup' && !again) return json(req, { status: check.analysis_status, source: check.analysis_source })

  const keys = keysOfPlace({ ...(check.place ?? {}), id: check.place_id })
  await db.from('checks').update({ company_keys: keys, analysis_tried_at: new Date().toISOString() }).eq('id', check.id)
  if (!keys.length) return json(req, await pending(check as Check, 'Keine Merkmale zum Suchen (Name + PLZ, Website, Telefon, Google-Karte)'))
  const found = await fromOtherCheck(check as Check, keys)
  return json(req, found ?? await fromSheets(check as Check, keys))
}))
