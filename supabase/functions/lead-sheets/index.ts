// POST (Authorization: Bearer <Sitzung eines Team-Mitglieds>) — Tabellen der Leads (Admin → «Lead-Tabellen»):
//   { action: 'info' }            → E-Mail des Dienstkontos (dafür muss eine Tabelle freigegeben werden)
//   { action: 'add', url }        → Registerkarte prüfen (Zugriff, Zeilen) und in lead_sheets eintragen
//   { action: 'refresh', id }     → Registerkarte neu lesen (Titel, Zeilen, Fehler)
//   { action: 'scan' }            → alle aktiven Registerkarten lesen: Zahlen je Karte + Dubletten (eine Firma in mehreren Zeilen)
// Liest nur (Dienstkonto mit spreadsheets.readonly). Kopiert keine Zeilen in die Datenbank.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { handler, json } from '../_shared/http.ts'
import { duplicateGroups, hasAnalysis, keysOfRow, rowDate, type Candidate } from '../_shared/leadkey.ts'
import { parseServiceAccount, parseSheetUrl, readTab, SheetError, type Tab } from '../_shared/sheets.ts'

const SERVER_KEY = Deno.env.get('SB_SECRET_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const db = createClient(Deno.env.get('SUPABASE_URL')!, SERVER_KEY, { auth: { persistSession: false } })

type Sheet = { id: string; spreadsheet_id: string; gid: number; url: string; title: string | null; tab_title: string | null }

function stats(tab: Tab) {
  let analysed = 0, noKey = 0
  for (const r of tab.rows) {
    const a = hasAnalysis(r.data)
    if (a) analysed++
    if (a && !keysOfRow(r.data, tab.headers).length) noKey++
  }
  return { rows: tab.rows.length, analysed, analysed_without_key: noKey }
}
const fail = (req: Request, e: unknown, status = 400) =>
  json(req, { error: e instanceof SheetError ? e.code : 'error', detail: e instanceof Error ? e.message : String(e) }, status)

Deno.serve(handler(30, async (req, body) => {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  const { data: auth } = await db.auth.getUser(token)
  if (!auth?.user) return json(req, { error: 'auth' }, 401)
  const { data: prof } = await db.from('profiles').select('role').eq('id', auth.user.id).maybeSingle()
  if (prof?.role !== 'admin' && prof?.role !== 'manager') return json(req, { error: 'forbidden' }, 403)

  let sa
  try { sa = parseServiceAccount(Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON')) }
  catch (e) { return body.action === 'info' ? json(req, { email: null, detail: (e as Error).message }) : fail(req, e, 503) }

  if (body.action === 'info') return json(req, { email: sa.client_email })

  if (body.action === 'add') {
    const url = String(body.url ?? '').trim()
    let ref
    try { ref = parseSheetUrl(url) } catch (e) { return fail(req, e) }
    const { data: dup } = await db.from('lead_sheets').select('id').eq('spreadsheet_id', ref.spreadsheetId).eq('gid', ref.gid).maybeSingle()
    if (dup) return json(req, { error: 'exists', detail: 'Diese Registerkarte ist schon verbunden' }, 409)
    let tab
    try { tab = await readTab(sa, ref.spreadsheetId, ref.gid) } catch (e) { return fail(req, e, 502) }
    const { data, error } = await db.from('lead_sheets').insert({
      spreadsheet_id: ref.spreadsheetId, gid: ref.gid, url, title: tab.title, tab_title: tab.tabTitle, row_count: tab.rows.length,
      last_read_at: new Date().toISOString(), created_by: auth.user.id,
    }).select('id').single()
    if (error) return json(req, { error: 'db', detail: error.message }, 500)
    return json(req, { id: data.id, title: tab.title, tab: tab.tabTitle, ...stats(tab) })
  }

  if (body.action === 'refresh') {
    const { data: s } = await db.from('lead_sheets').select('*').eq('id', String(body.id ?? '')).maybeSingle()
    if (!s) return json(req, { error: 'not_found' }, 404)
    try {
      const tab = await readTab(sa, s.spreadsheet_id, Number(s.gid))
      await db.from('lead_sheets').update({ title: tab.title, tab_title: tab.tabTitle, row_count: tab.rows.length, last_read_at: new Date().toISOString(), last_error: null }).eq('id', s.id)
      return json(req, { id: s.id, title: tab.title, tab: tab.tabTitle, ...stats(tab) })
    } catch (e) {
      await db.from('lead_sheets').update({ last_error: e instanceof Error ? e.message : String(e) }).eq('id', s.id)
      return fail(req, e, 502)
    }
  }

  if (body.action === 'scan') {
    const { data: sheets } = await db.from('lead_sheets').select('*').eq('active', true).order('created_at')
    const list: Candidate[] = [], label = new Map<string, { sheet: string; tab: string; n: number; name: string }>()
    const perSheet: Record<string, unknown>[] = []
    for (const s of (sheets ?? []) as Sheet[]) {
      try {
        const tab = await readTab(sa, s.spreadsheet_id, Number(s.gid))
        await db.from('lead_sheets').update({ title: tab.title, tab_title: tab.tabTitle, row_count: tab.rows.length, last_read_at: new Date().toISOString(), last_error: null }).eq('id', s.id)
        perSheet.push({ id: s.id, ...stats(tab) })
        const nameCol = tab.headers.find(h => /^(?:company|unternehmen|firma|firmenname|name|компания|название)$/i.test(h.trim()))
        for (const r of tab.rows) {
          const ref = `${s.id}#${r.n}`
          label.set(ref, { sheet: tab.title, tab: tab.tabTitle, n: r.n, name: nameCol ? r.data[nameCol] : '' })
          list.push({ ref, row: r.data, keys: keysOfRow(r.data, tab.headers), date: rowDate(r.data, tab.headers), analysed: hasAnalysis(r.data) })
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        await db.from('lead_sheets').update({ last_error: msg }).eq('id', s.id)
        perSheet.push({ id: s.id, error: msg })
      }
    }
    const duplicates = duplicateGroups(list).map(g => g.map(c => ({ ...label.get(c.ref)!, analysed: c.analysed })))
    return json(req, { sheets: perSheet, duplicates })
  }
  return json(req, { error: 'action' }, 400)
}))
