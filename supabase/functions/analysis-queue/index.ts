// POST (Authorization: Bearer <Sitzung eines Team-Mitglieds>) — Plan B (docs/lead-flow.md): Analyse ohne Grok-MCP.
//   { action: 'task', ids }      → Aufgabe für Grok / eine andere KI (Regeln + Firmen ohne Kundendaten + schon geprüfte Punkte);
//                                   die Prüfungen gehen auf «in_progress» (nach 2 h ohne Ergebnis zurück auf «pending»)
//   { action: 'save', text }     → Antwort der KI (JSON) prüfen, mit der Autoprüfung zusammenführen, Bericht veröffentlichen,
//                                   E-Mail «Ihre vollständige Analyse ist fertig»
//   { action: 'release', ids }   → zurück auf «pending» (Aufgabe doch nicht bearbeitet)
import { createClient } from 'npm:@supabase/supabase-js@2'
import { handler, json } from '../_shared/http.ts'
import { buildTask, parseResults, saveAnalysis, type QueueCheck } from '../_shared/manual.ts'

const SERVER_KEY = Deno.env.get('SB_SECRET_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const db = createClient(Deno.env.get('SUPABASE_URL')!, SERVER_KEY, { auth: { persistSession: false } })
const uuid = (x: unknown) => typeof x === 'string' && /^[0-9a-f-]{36}$/i.test(x)

Deno.serve(handler(30, async (req, body) => {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  const { data: auth } = await db.auth.getUser(token)
  if (!auth?.user) return json(req, { error: 'auth' }, 401)
  const { data: prof } = await db.from('profiles').select('role').eq('id', auth.user.id).maybeSingle()
  if (prof?.role !== 'admin' && prof?.role !== 'manager') return json(req, { error: 'forbidden' }, 403)

  const ids = Array.isArray(body.ids) ? (body.ids as unknown[]).filter(uuid).slice(0, 25) as string[] : []
  if (body.action === 'task') {
    if (!ids.length) return json(req, { error: 'ids' }, 400)
    const { data } = await db.from('checks').select('id, place, report_draft, audit, analysis_status').in('id', ids).in('analysis_status', ['pending', 'in_progress'])
    const list = (data ?? []) as QueueCheck[]
    if (!list.length) return json(req, { error: 'none', detail: 'Keine dieser Prüfungen wartet auf eine Analyse' }, 409)
    await db.from('checks').update({ analysis_status: 'in_progress', analysis_taken_at: new Date().toISOString() }).in('id', list.map(c => c.id))
    return json(req, { text: buildTask(list), count: list.length })
  }
  if (body.action === 'save') {
    const { results, errors } = parseResults(String(body.text ?? ''))
    const saved = []
    for (const r of results) saved.push(await saveAnalysis(db, r, 'manual'))
    return json(req, { saved, errors })
  }
  if (body.action === 'release') {
    if (!ids.length) return json(req, { error: 'ids' }, 400)
    await db.from('checks').update({ analysis_status: 'pending', analysis_taken_at: null }).in('id', ids).eq('analysis_status', 'in_progress')
    return json(req, { ok: true })
  }
  return json(req, { error: 'action' }, 400)
}))
