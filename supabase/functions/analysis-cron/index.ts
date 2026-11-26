// POST (Header x-cron-secret = Secret ANALYSIS_CRON_SECRET) — Zeitplan (supabase/cron.sql, alle 30 Minuten):
//   1) bei Grok hängengebliebene Analysen (> 2 h «in_progress») → wieder «pending»;
//   2) Prüfungen, bei denen Google Sheets bei der Registrierung nicht geantwortet hat («lookup»), erneut suchen;
//      nach 24 Stunden ohne Antwort → «pending» (Analyse durch Grok / manuell).
import { createClient } from 'npm:@supabase/supabase-js@2'
import { findAnalysis } from '../_shared/lookup.ts'

const SERVER_KEY = Deno.env.get('SB_SECRET_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const db = createClient(Deno.env.get('SUPABASE_URL')!, SERVER_KEY, { auth: { persistSession: false } })
const SECRET = Deno.env.get('ANALYSIS_CRON_SECRET') ?? ''

Deno.serve(async req => {
  if (req.method !== 'POST') return new Response('method', { status: 405 })
  if (!SECRET || req.headers.get('x-cron-secret') !== SECRET) return new Response('forbidden', { status: 403 })
  const { data: released } = await db.rpc('release_stale_analyses')
  const since = new Date(Date.now() - 3 * 60_000).toISOString()
  const { data: open } = await db.from('checks').select('id, place_id, place, analysis_status, created_at')
    .eq('analysis_status', 'lookup').lt('created_at', since).order('created_at').limit(20)
  const results: Record<string, number> = {}
  for (const c of open ?? []) {
    const r = await findAnalysis(db, c, Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON')).catch(e => { console.error('lookup', c.id, e); return { status: 'retry' as const } })
    results[r.status] = (results[r.status] ?? 0) + 1
    if (r.status === 'retry' && Date.parse(c.created_at) < Date.now() - 24 * 3600_000) {
      await db.from('checks').update({ analysis_status: 'pending' }).eq('id', c.id).eq('analysis_status', 'lookup')
      results.gave_up = (results.gave_up ?? 0) + 1
    }
  }
  return Response.json({ released, lookup: results })
})
