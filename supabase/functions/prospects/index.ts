// POST (Authorization: Bearer <Sitzung eines Team-Mitglieds>)
//   { action: 'import', csvUrl?: string, csv?: string }  → neue Zeilen aus der Google-Tabelle in prospects (ohne Dubletten)
//   { action: 'audit', id: string }                     → Kurzanalyse eines Leads (dieselben Prüfungen wie der Check)
// Leads sind potenzielle Kunden — nur das Team sieht sie (RLS auf prospects).
import { createClient } from 'npm:@supabase/supabase-js@2'
import { handler, json, placesKey } from '../_shared/http.ts'
import { competitors, defaultQuery, placeRaw, sameCompany, searchPlaces, type GPlace } from '../_shared/google.ts'
import { scanSite, sourcesFrom } from '../_shared/site.ts'
import { buildReport, type Item } from '../_shared/audit.ts'

const SERVER_KEY = Deno.env.get('SB_SECRET_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const db = createClient(Deno.env.get('SUPABASE_URL')!, SERVER_KEY, { auth: { persistSession: false } })

async function pageSpeed(url: string): Promise<{ score: number | null; error?: string }> {
  const base = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?strategy=mobile&category=performance&url=${encodeURIComponent(url)}`
  const keys = [Deno.env.get('PAGESPEED_KEY'), Deno.env.get('GOOGLE_PLACES_KEY'), undefined]
  let last = ''
  for (const k of [...new Set(keys)]) {
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 40_000)
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

// ── CSV ──────────────────────────────────────────────────────────────────────
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = [], cur = '', q = false
  const sep = (text.split('\n')[0].match(/;/g)?.length ?? 0) > (text.split('\n')[0].match(/,/g)?.length ?? 0) ? ';' : ','
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++ }
      else if (ch === '"') q = false
      else cur += ch
    } else if (ch === '"') q = true
    else if (ch === sep) { row.push(cur); cur = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(cur); cur = ''
      if (row.some(c => c.trim())) rows.push(row)
      row = []
    } else cur += ch
  }
  row.push(cur)
  if (row.some(c => c.trim())) rows.push(row)
  return rows
}
// Spaltennamen (DE / RU / EN) → Feld
const ALIASES: Record<string, string[]> = {
  name: ['firma', 'unternehmen', 'name', 'company', 'компания', 'название'],
  category: ['branche', 'kategorie', 'category', 'сфера', 'категория', 'вид бизнеса'],
  city: ['stadt', 'ort', 'city', 'город'],
  address: ['adresse', 'anschrift', 'address', 'адрес'],
  phone: ['telefon', 'phone', 'tel', 'телефон'],
  website: ['website', 'webseite', 'site', 'url', 'сайт'],
  maps_url: ['google maps', 'maps', 'maps link', 'google maps link', 'karte', 'ссылка на google maps', 'ссылка google maps', 'карта'],
  query: ['suchbegriff', 'query', 'keyword', 'запрос', 'поисковый запрос', 'запрос, по которому ищут такие компании'],
}
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()
const domain = (u: string) => u.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split(/[/?#]/)[0]

function rowsToProspects(rows: string[][]) {
  if (rows.length < 2) return []
  const head = rows[0].map(norm)
  const col: Record<string, number> = {}
  for (const [field, names] of Object.entries(ALIASES)) {
    const i = head.findIndex(h => names.includes(h) || names.some(n => h.startsWith(n)))
    if (i >= 0) col[field] = i
  }
  if (col.name === undefined) throw Object.assign(new Error('no_name_column'), { status: 400 })
  const used = new Set(Object.values(col))
  return rows.slice(1).map(r => {
    const g = (f: string) => (col[f] !== undefined ? (r[col[f]] ?? '').trim() : '')
    const extra: Record<string, string> = {}
    r.forEach((v, i) => { if (!used.has(i) && rows[0][i] && v.trim()) extra[rows[0][i].trim()] = v.trim() })
    const p = { name: g('name'), category: g('category') || null, city: g('city') || null, address: g('address') || null, phone: g('phone') || null,
      website: g('website') || null, maps_url: g('maps_url') || null, query: g('query') || null, extra }
    const dedup_key = p.website ? `web:${domain(p.website)}` : p.maps_url ? `maps:${p.maps_url.trim()}` : `name:${norm(p.name)}|${norm(p.city ?? p.address ?? '')}`
    return { ...p, dedup_key }
  }).filter(p => p.name)
}

// ── Kurzanalyse ──────────────────────────────────────────────────────────────
const ORDER: Record<string, number> = { bad: 0, warn: 1, ok: 2 }
async function audit(id: string) {
  const { data: p, error } = await db.from('prospects').select('*').eq('id', id).maybeSingle()
  if (error || !p) throw Object.assign(new Error('not_found'), { status: 404 })
  await db.from('prospects').update({ status: 'checking', error: null }).eq('id', id)
  try {
    const key = placesKey()
    let placeId: string | null = p.place_id
    if (!placeId) {
      const hits = await searchPlaces(key, [p.name, p.address || p.city].filter(Boolean).join(' '))
      // Nur übernehmen, wenn Name und Ort passen — sonst lieber nachfragen als einen fremden Betrieb anschreiben.
      placeId = hits.find(h => sameCompany(p.name, h, p.city))?.id ?? null
      if (!placeId) {
        await db.from('prospects').update({ status: 'error', error: 'not_found' }).eq('id', id)
        return { status: 'not_found' }
      }
    }
    if (placeId) {
      // Компания уже сама пришла к нам (есть проверка на сайте) — не тратим запросы и не шлём письмо.
      const { data: chk } = await db.from('checks').select('id').eq('place_id', placeId).order('created_at', { ascending: true }).limit(1)
      if (chk?.length) {
        await db.from('prospects').update({ status: 'responded', place_id: placeId, check_id: chk[0].id, responded_at: new Date().toISOString(), error: 'already_client' }).eq('id', id)
        return { status: 'already_client' }
      }
      const { data: dup } = await db.from('prospects').select('id').eq('place_id', placeId).neq('id', id).limit(1)
      if (dup?.length) {
        await db.from('prospects').update({ status: 'hidden', error: 'duplicate', place_id: null }).eq('id', id)
        return { status: 'duplicate' }
      }
    }
    const noProfile = !placeId
    const place: GPlace = placeId ? await placeRaw(key, placeId, true) : {
      id: `manual:${id}`, displayName: { text: p.name }, primaryTypeDisplayName: { text: p.category ?? '' },
      addressComponents: p.city ? [{ longText: p.city, shortText: p.city, types: ['locality'] }] : [],
      websiteUri: p.website ? (/^https?:\/\//.test(p.website) ? p.website : `https://${p.website}`) : undefined,
    }
    const website = place.websiteUri || (p.website ? (/^https?:\/\//.test(p.website) ? p.website : `https://${p.website}`) : null)
    const query = (p.query ?? '').trim() || defaultQuery(place)
    const canSearch = !noProfile
    const [comp, site, speed] = await Promise.all([
      canSearch && query ? competitors(key, place, query).catch(e => { console.error('competitors', e); return null }) : Promise.resolve(null),
      website ? scanSite(website, 6000, true).catch(() => null) : Promise.resolve(null),
      website ? pageSpeed(website) : Promise.resolve(null),
    ])
    const sources = sourcesFrom(website, site)
    const report = buildReport({ place, competitors: comp, site, sources, noProfile, pagespeed: speed, ranks: [] })
    if (site) delete (site as { hay?: string }).hay
    const scores = Object.values(report.channels).map(c => c?.score).filter((x): x is number => typeof x === 'number')
    const all: Item[] = Object.values(report.items ?? {}).flat()
    const issues = all.filter(i => i.mark !== 'ok').sort((a, b) => ORDER[a.mark] - ORDER[b.mark] || b.max - a.max).slice(0, 5).map(i => ({ mark: i.mark, text: i.text }))
    const comps = (t: string) => place.addressComponents?.find(c => c.types.includes(t))?.longText
    await db.from('prospects').update({
      status: 'checked', error: null, place_id: placeId, audited_at: new Date().toISOString(),
      audit: { place, competitors: comp, site, pagespeed: speed, keywords: [query], sources, collected_at: new Date().toISOString() },
      report_draft: report, issues,
      score: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
      category: p.category || place.primaryTypeDisplayName?.text || null,
      city: p.city || comps('locality') || comps('postal_town') || null,
      address: place.formattedAddress || p.address,
      phone: p.phone || place.nationalPhoneNumber || null,
      website: p.website || website,
      maps_url: place.googleMapsUri || p.maps_url,
      query,
    }).eq('id', id)
    return { status: 'checked' }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await db.from('prospects').update({ status: 'error', error: msg.slice(0, 300) }).eq('id', id)
    return { status: 'error', error: msg }
  }
}

Deno.serve(handler(120, async (req, body) => {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  const { data: auth } = await db.auth.getUser(token)
  if (!auth?.user) return json(req, { error: 'auth' }, 401)
  const { data: prof } = await db.from('profiles').select('role').eq('id', auth.user.id).maybeSingle()
  if (prof?.role !== 'admin' && prof?.role !== 'manager') return json(req, { error: 'forbidden' }, 403)

  if (body.action === 'audit') return json(req, await audit(String(body.id ?? '')))

  if (body.action === 'import') {
    let text = typeof body.csv === 'string' ? body.csv : ''
    if (!text) {
      const url = String(body.csvUrl ?? '')
      // Nur veröffentlichte Google-Tabellen — keine beliebigen Adressen abrufen.
      if (!/^https:\/\/docs\.google\.com\/spreadsheets\//.test(url)) return json(req, { error: 'bad_url' }, 400)
      const res = await fetch(url, { redirect: 'follow' })
      if (!res.ok) return json(req, { error: 'fetch', detail: `HTTP ${res.status}` }, 502)
      text = await res.text()
      if (/^\s*<!doctype html|<html/i.test(text)) return json(req, { error: 'not_csv' }, 400)
    }
    const items = rowsToProspects(parseCsv(text.replace(/^﻿/, '')))
    const unique = [...new Map(items.map(i => [i.dedup_key, i])).values()]
    if (!unique.length) return json(req, { added: 0, total: 0 })
    const { data, error } = await db.from('prospects').upsert(unique, { onConflict: 'dedup_key', ignoreDuplicates: true }).select('id')
    if (error) return json(req, { error: 'db', detail: error.message }, 500)
    return json(req, { added: data?.length ?? 0, total: unique.length })
  }
  return json(req, { error: 'action' }, 400)
}))
