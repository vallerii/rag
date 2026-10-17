// POST { checkId, force? }  (Authorization: Bearer <Sitzung des Kunden oder eines Team-Mitglieds>)
// Sammelt die Daten für den Sichtbarkeits-Check:
//   Google-Profil (vollständig), Wettbewerber + Positionen für bis zu 3 Suchbegriffe,
//   Website-Prüfung (inkl. Impressum, Datenschutz, Sitemap, Abgleich mit Google), Google PageSpeed (mobil)
// → checks.audit (Rohdaten) und checks.report_draft (Entwurf mit Einzelkriterien, v2).
// Kunde: einmal nach der Bestätigung. Team: «Daten neu sammeln» (force) — auch nach der Veröffentlichung,
// um Fortschritt zu zeigen; der veröffentlichte Bericht bleibt, bis das Team eine neue Version freigibt.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { handler, json, placesKey } from '../_shared/http.ts'
import { competitors, defaultQuery, onlyDE, placeRaw, sameCompany, searchPlaces, toPlace, type GPlace } from '../_shared/google.ts'
import { scanSite, type Source } from '../_shared/site.ts'
import { buildReport } from '../_shared/audit.ts'

// Server-Schlüssel: neuer Secret Key (Secret SB_SECRET_KEY, falls die alten JWT-Schlüssel abgeschaltet sind), sonst service_role.
const SERVER_KEY = Deno.env.get('SB_SECRET_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const db = createClient(Deno.env.get('SUPABASE_URL')!, SERVER_KEY, { auth: { persistSession: false } })

/** Google PageSpeed (mobil). Erst mit dem Places-Schlüssel (falls die API dort aktiv ist), dann ohne Schlüssel. Wirft nie. */
async function pageSpeed(url: string): Promise<{ score: number | null; error?: string }> {
  const base = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?strategy=mobile&category=performance&url=${encodeURIComponent(url)}`
  const keys = [Deno.env.get('PAGESPEED_KEY'), Deno.env.get('GOOGLE_PLACES_KEY'), undefined]
  let last = ''
  for (const k of [...new Set(keys)]) {
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 45_000)
    try {
      const res = await fetch(base + (k ? `&key=${k}` : ''), { signal: ctrl.signal, headers: { Referer: Deno.env.get('PLACES_REFERER') ?? 'https://rag-theta-one.vercel.app/' } })
      const data = await res.json().catch(() => ({}))
      const v = data?.lighthouseResult?.categories?.performance?.score
      if (res.ok && typeof v === 'number') return { score: Math.round(v * 100) }
      last = data?.error?.message ?? `HTTP ${res.status}`
    } catch (e) { last = e instanceof Error ? e.message : String(e) } finally { clearTimeout(t) }
  }
  return { score: null, error: last.slice(0, 200) }
}

Deno.serve(handler(10, async (req, body) => {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  const { data: auth } = await db.auth.getUser(token)
  if (!auth?.user) return json(req, { error: 'auth' }, 401)

  const checkId = String(body.checkId ?? '')
  const { data: check, error: readErr } = await db.from('checks')
    .select('*')
    .eq('id', checkId).maybeSingle()
  if (readErr) { console.error('checks read', readErr); return json(req, { error: 'db', detail: readErr.message }, 500) }
  if (!check) return json(req, { error: 'not_found', detail: 'no_row' }, 404)
  let staff = false
  if (check.user_id !== auth.user.id) {
    const { data: prof } = await db.from('profiles').select('role').eq('id', auth.user.id).maybeSingle()
    staff = prof?.role === 'admin' || prof?.role === 'manager'
    if (!staff) return json(req, { error: 'not_found', detail: 'other_user' }, 404)
  } else {
    const { data: prof } = await db.from('profiles').select('role').eq('id', auth.user.id).maybeSingle()
    staff = prof?.role === 'admin' || prof?.role === 'manager'
  }
  const force = staff && body.force === true
  if (!check.sources_confirmed) return json(req, { error: 'not_confirmed' }, 409)
  if (check.status === 'ready' && !force) return json(req, { status: 'ready' })
  // «Start bei null»: nichts zu analysieren — nur auf ausdrücklichen Wunsch des Teams.
  if (check.scratch && !force) return json(req, { status: 'scratch' })
  // Höchstens einmal pro 30 Minuten (Kosten bei Google) — außer das Team erzwingt es.
  if (!force && check.audited_at && Date.now() - Date.parse(check.audited_at) < 30 * 60_000) return json(req, { status: 'cached' })
  // Анализ уже есть (из лида или другой проверки той же компании, не старше 30 дней) — не собираем заново.
  const reused = check.audit as { from_prospect?: string; from_check?: string } | null
  if (!force && (reused?.from_prospect || reused?.from_check) && check.audited_at && Date.now() - Date.parse(check.audited_at) < 30 * 86_400_000) {
    if (check.status !== 'ready') await db.from('checks').update({ status: 'in_review' }).eq('id', check.id)
    return json(req, { status: 'from_prospect' })
  }
  if (!check.place_id || String(check.place_id).startsWith('demo')) return json(req, { error: 'demo_place' }, 400)

  const key = placesKey()
  let noProfile = String(check.place_id).startsWith('manual:')
  let foundRaw: GPlace | null = null
  const p = (check.place ?? {}) as { name?: string; category?: string; city?: string; address?: string; website?: string | null; manual?: boolean }
  // Firma im Kundenbereich selbst eingetragen, Google-Profil «Ja» / «Weiß nicht»: einmal bei Google suchen.
  // Treffer nur, wenn der Name passt — sonst bleibt es bei «ohne Profil».
  let profileSearch: Record<string, unknown> | null = null
  // Team («Daten neu sammeln») darf die Suche wiederholen.
  if (noProfile && check.profile_hint && check.profile_hint !== 'no' && (force || !check.profile_searched_at) && p.name) {
    const query = [p.name, p.address || p.city].filter(Boolean).join(' ')
    let searchError = ''
    let hits = await searchPlaces(key, query).catch(e => { searchError = e instanceof Error ? e.message : String(e); return [] as Awaited<ReturnType<typeof searchPlaces>> })
    // Kein Treffer → noch einmal direkt bei Google, ohne Gebietsgrenze (nur deutsche Adressen übernehmen).
    let raw: Record<string, unknown> | null = null
    if (!hits.length) {
      try {
        const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress', 'Referer': Deno.env.get('PLACES_REFERER') ?? 'https://rag-theta-one.vercel.app/' },
          body: JSON.stringify({ textQuery: query, languageCode: 'de', regionCode: 'de', pageSize: 5 }),
        })
        const data = await res.json().catch(() => ({})) as { places?: { id: string; displayName?: { text?: string }; formattedAddress?: string }[]; error?: { message?: string } }
        raw = { status: res.status, count: data.places?.length ?? 0, address: data.places?.[0]?.formattedAddress, error: data.error?.message }
        hits = (data.places ?? []).filter(onlyDE)
          .map(x => ({ id: x.id, main: x.displayName?.text ?? '', secondary: x.formattedAddress ?? '' }))
      } catch (e) { raw = { error: e instanceof Error ? e.message : String(e) } }
    }
    const hit = hits.find(h => sameCompany(p.name!, h, p.city))
    profileSearch = { query, hits: hits.slice(0, 5).map(h => h.main), matched: hit?.main ?? null, error: searchError || undefined, raw }
    if (hit) {
      const raw = await placeRaw(key, hit.id, true).catch(e => { profileSearch!.error = 'details: ' + (e instanceof Error ? e.message : String(e)); return null })
      if (raw) {
        const found = toPlace(raw)
        // Website aus dem Google-Profil übernehmen, wenn der Kunde keine angegeben hat.
        const src = ((check.sources ?? []) as Source[]).map(x => ({ ...x }))
        const web = src.find(x => x.key === 'website')
        if (found.website && web && !web.value?.trim()) { web.value = found.website; web.found = true }
        else if (found.website && !web) src.push({ key: 'website', value: found.website, found: true } as Source)
        const { error: upErr } = await db.from('checks').update({ place_id: hit.id, place: { ...found, category: found.category || p.category }, sources: src, profile_searched_at: new Date().toISOString() }).eq('id', check.id)
        check.sources = src
        if (upErr) profileSearch.error = 'update: ' + upErr.message
        check.place_id = hit.id; check.place = found; noProfile = false; foundRaw = raw
      }
    }
    if (noProfile) await db.from('checks').update({ profile_searched_at: new Date().toISOString() }).eq('id', check.id)
  }
  const place: GPlace = noProfile
    ? { id: check.place_id, displayName: { text: p.name ?? '' }, primaryTypeDisplayName: { text: p.category ?? '' },
        addressComponents: p.city ? [{ longText: p.city, shortText: p.city, types: ['locality'] }] : [],
        websiteUri: p.website ? (/^https?:\/\//.test(p.website) ? p.website : `https://${p.website}`) : undefined }
    : foundRaw ?? await placeRaw(key, check.place_id as string, true)
  const sources = (check.sources ?? []) as Source[]
  const website = sources.find(s => s.key === 'website')?.value?.trim() || place.websiteUri || null

  // Suchbegriffe: vom Team in der Checkliste gepflegt, sonst «Branche Ort».
  const list = (check.checklist as { keywords?: string[] } | null)?.keywords
  const keywords = (Array.isArray(list) ? list : []).map(k => String(k).trim()).filter(Boolean).slice(0, 3)
  if (!keywords.length) keywords.push(defaultQuery(place))
  const canSearch = !(noProfile && !p.category)

  const [comp, extra, site, speed] = await Promise.all([
    canSearch ? competitors(key, place, keywords[0]).catch(e => { console.error('competitors', e); return null }) : Promise.resolve(null),
    canSearch ? Promise.all(keywords.slice(1).map(q => competitors(key, place, q).catch(() => null))) : Promise.resolve([]),
    website ? scanSite(website, 6000, true) : Promise.resolve(null),
    website ? pageSpeed(/^https?:\/\//.test(website) ? website : `https://${website}`) : Promise.resolve(null),
  ])
  const ranks = extra.filter((x): x is NonNullable<typeof x> => !!x).map(x => ({ query: x.query, rank: x.rank, total: x.list.length, top: x.list.slice(0, 5).map(c => c.name) }))
  const report = buildReport({ place, competitors: comp, site, sources, noProfile, pagespeed: speed, ranks })
  if (site) delete site.hay

  const patch: Record<string, unknown> = {
    audit: { place, competitors: comp, ranks, site, pagespeed: speed, keywords, profile_search: profileSearch, collected_at: new Date().toISOString() },
    report_draft: report,
    audited_at: new Date().toISOString(),
  }
  if (check.status !== 'ready') patch.status = 'in_review'
  const { error } = await db.from('checks').update(patch).eq('id', check.id)
  if (error) { console.error('checks update', error); return json(req, { error: 'db', detail: error.message }, 500) }
  return json(req, { status: check.status === 'ready' ? 'refreshed' : 'in_review', pagespeed: speed?.score ?? null })
}))
