// POST { checkId }  (Authorization: Bearer <Sitzung des Kunden>)
// Läuft, sobald der Kunde im Kundenbereich Website + Profile bestätigt hat:
// Google-Profil (vollständig), Wettbewerber, Website-Prüfung → checks.audit (Rohdaten)
// und checks.report_draft (Berichtsentwurf). Status → 'in_review'. Den fertigen Bericht
// gibt das Team frei: report = report_draft (+ KI-Suche), status = 'ready'.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { handler, json, placesKey } from '../_shared/http.ts'
import { competitors, placeRaw } from '../_shared/google.ts'
import { scanSite, type Source } from '../_shared/site.ts'
import { buildReport } from '../_shared/audit.ts'

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })

Deno.serve(handler(10, async (req, body) => {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  const { data: auth } = await db.auth.getUser(token)
  if (!auth?.user) return json(req, { error: 'auth' }, 401)

  const checkId = String(body.checkId ?? '')
  const { data: check } = await db.from('checks')
    .select('id, user_id, place_id, sources, sources_confirmed, status, audited_at')
    .eq('id', checkId).maybeSingle()
  if (!check || check.user_id !== auth.user.id) return json(req, { error: 'not_found' }, 404)
  if (!check.sources_confirmed) return json(req, { error: 'not_confirmed' }, 409)
  if (check.status === 'ready') return json(req, { status: 'ready' })
  // Höchstens einmal pro 30 Minuten (Kosten bei Google).
  if (check.audited_at && Date.now() - Date.parse(check.audited_at) < 30 * 60_000) return json(req, { status: 'cached' })
  if (!check.place_id || String(check.place_id).startsWith('demo')) return json(req, { error: 'demo_place' }, 400)

  const key = placesKey()
  const place = await placeRaw(key, check.place_id, true)
  const sources = (check.sources ?? []) as Source[]
  const website = sources.find(s => s.key === 'website')?.value?.trim() || place.websiteUri || null
  const [comp, site] = await Promise.all([
    competitors(key, place).catch(e => { console.error('competitors', e); return null }),
    website ? scanSite(website) : Promise.resolve(null),
  ])
  const report = buildReport({ place, competitors: comp, site, sources })

  const { error } = await db.from('checks').update({
    audit: { place, competitors: comp, site, collected_at: new Date().toISOString() },
    report_draft: report,
    audited_at: new Date().toISOString(),
    status: 'in_review',
  }).eq('id', check.id)
  if (error) throw error
  return json(req, { status: 'in_review' })
}))
