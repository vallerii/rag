// POST { checkId, force? }  (Authorization: Bearer <Sitzung des Kunden oder eines Team-Mitglieds>)
// Sucht die fertige Analyse einer Prüfung (andere Prüfung derselben Firma → Lead-Tabellen) und veröffentlicht
// den Bericht sofort (Logik: _shared/lookup.ts, docs/lead-flow.md). Der Kundenbereich ruft das über audit-collect auf;
// diese Function ist für das Team («erneut suchen», z. B. nachdem eine Tabelle freigegeben wurde) und später den Zeitplan.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { handler, json } from '../_shared/http.ts'
import { findAnalysis, publishAnalysis } from '../_shared/lookup.ts'

const SERVER_KEY = Deno.env.get('SB_SECRET_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const db = createClient(Deno.env.get('SUPABASE_URL')!, SERVER_KEY, { auth: { persistSession: false } })

Deno.serve(handler(20, async (req, body) => {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  const { data: auth } = await db.auth.getUser(token)
  if (!auth?.user) return json(req, { error: 'auth' }, 401)
  const { data: check } = await db.from('checks').select('id, user_id, place_id, place, status, analysis_status, analysis_source').eq('id', String(body.checkId ?? '')).maybeSingle()
  if (!check) return json(req, { error: 'not_found' }, 404)
  const { data: prof } = await db.from('profiles').select('role').eq('id', auth.user.id).maybeSingle()
  const staff = prof?.role === 'admin' || prof?.role === 'manager'
  if (check.user_id !== auth.user.id && !staff) return json(req, { error: 'not_found' }, 404)

  // Fertige Analyse, Bericht aber noch nicht veröffentlicht (z. B. Fehler beim ersten Mal) → nur veröffentlichen.
  if (check.analysis_status === 'done') return json(req, { status: 'done', source: check.analysis_source, published: await publishAnalysis(db, check.id) })
  // Team darf die Suche für «wartet» wiederholen (z. B. nachdem eine Tabelle freigegeben wurde).
  const again = staff && body.force === true && check.analysis_status === 'pending'
  if (check.analysis_status !== 'lookup' && !again) return json(req, { status: check.analysis_status })
  return json(req, await findAnalysis(db, check, Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON')))
}))
