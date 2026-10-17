// Google Places API (New) — gemeinsame Helfer für Edge Functions und das Test-Skript.
// Reines TypeScript ohne Deno-/Node-spezifische APIs: läuft in Supabase Edge Functions
// und lokal mit `node --experimental-strip-types scripts/check-places.ts`.

const BASE = 'https://places.googleapis.com/v1'
const LANG = 'de'

// Der Google-Schlüssel ist auf die Website beschränkt (HTTP-Referrer). Server senden von sich aus
// keinen Referrer — deshalb geben wir die eigene Domain mit. Überschreibbar per Secret PLACES_REFERER.
// Sauberer wäre ein eigener Server-Schlüssel ohne Referrer-Beschränkung (nur «Places API (New)»).
const REFERER = (globalThis as { Deno?: { env: { get(k: string): string | undefined } } }).Deno?.env.get('PLACES_REFERER')
  ?? (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env.PLACES_REFERER
  ?? 'https://rag-theta-one.vercel.app/'

/** Suchgebiet Deutschland. Das Rechteck schneidet Randgebiete der Nachbarländer an — die filtert onlyDE() unten heraus. */
const DE = { low: { latitude: 47.27, longitude: 5.86 }, high: { latitude: 55.06, longitude: 15.05 } }
/** Nur Treffer in Deutschland. Google hängt das Land nicht immer an (mal «Deutschland», mal «Germany», mal gar nichts) —
 *  deshalb nur Adressen mit einem Nachbarland am Ende aussortieren. */
const FOREIGN = /(^|,\s*)(Österreich|Austria|Schweiz|Switzerland|Frankreich|France|Niederlande|Netherlands|Belgien|Belgium|Luxemburg|Luxembourg|Dänemark|Denmark|Polen|Poland|Tschechien|Czechia|Liechtenstein)$/i
export const onlyDE = (p: { formattedAddress?: string }) => !p.formattedAddress || !FOREIGN.test(p.formattedAddress.trim())

export type Suggestion = { id: string; main: string; secondary: string }

/** Muss zu `Place` in src/check/data.ts passen. */
export type Place = {
  id: string
  name: string
  address: string
  city: string
  category: string
  rating: number | null
  reviews: number
  website: string | null
  phone: string | null
  mapsUrl: string
  country?: string
  lat?: number
  lng?: number
}

// Rohdaten, wie Google sie liefert (nur die Felder, die wir anfragen).
export type GPlace = {
  id: string
  displayName?: { text: string }
  formattedAddress?: string
  addressComponents?: { longText: string; shortText: string; types: string[] }[]
  location?: { latitude: number; longitude: number }
  primaryType?: string
  primaryTypeDisplayName?: { text: string }
  types?: string[]
  businessStatus?: string
  googleMapsUri?: string
  websiteUri?: string
  nationalPhoneNumber?: string
  internationalPhoneNumber?: string
  rating?: number
  userRatingCount?: number
  regularOpeningHours?: { weekdayDescriptions?: string[] }
  photos?: unknown[]
  reviews?: { rating: number; publishTime?: string; relativePublishTimeDescription?: string; text?: { text: string } }[]
  editorialSummary?: { text: string }
}

export class PlacesError extends Error {
  status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}

async function call<T>(key: string, path: string, init: { method: 'GET' | 'POST'; body?: unknown }, mask: string): Promise<T> {
  const res = await fetch(BASE + path, {
    method: init.method,
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': mask, 'Referer': REFERER },
    body: init.body ? JSON.stringify(init.body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new PlacesError(res.status, data?.error?.message ?? res.statusText)
  return data as T
}

// ── Felder je Anfrage (bestimmen den Preis bei Google) ───────────────────────
// Trefferliste: nur Name, Adresse, Branche → «Text Search Pro».
const MASK_SEARCH = 'places.id,places.displayName,places.formattedAddress,places.primaryTypeDisplayName'
// Karte «Ist das Ihr Unternehmen?»
const MASK_CARD = 'id,displayName,formattedAddress,addressComponents,location,primaryTypeDisplayName,rating,userRatingCount,websiteUri,nationalPhoneNumber,googleMapsUri'
// Analyse nach Bestätigung (Maps-Bewertung)
const MASK_AUDIT = MASK_CARD + ',primaryType,types,businessStatus,internationalPhoneNumber,regularOpeningHours,photos,reviews,editorialSummary'
// Wettbewerber in derselben Branche und Region
const MASK_COMPETITORS = 'places.id,places.displayName,places.rating,places.userRatingCount,places.websiteUri'

/** Trefferliste für /check (eine Anfrage pro Klick auf «Finden»). */
export async function searchPlaces(key: string, query: string): Promise<Suggestion[]> {
  const data = await call<{ places?: GPlace[] }>(key, '/places:searchText', {
    method: 'POST',
    body: { textQuery: query, languageCode: LANG, regionCode: 'de', pageSize: 8, locationRestriction: { rectangle: DE } },
  }, MASK_SEARCH)
  return (data.places ?? []).filter(onlyDE).map(p => ({
    id: p.id,
    main: p.displayName?.text ?? '',
    secondary: [p.primaryTypeDisplayName?.text, p.formattedAddress].filter(Boolean).join(' · '),
  }))
}

/** Passt ein Treffer zur gesuchten Firma? Mindestens die Hälfte der Namenswörter und — falls bekannt — der Ort in der Adresse.
 *  Verhindert, dass Google bei unbekannten Namen einfach «irgendeinen» Betrieb in der Nähe liefert. */
const STOP = ['gmbh', 'und', 'inh', 'der', 'die', 'das', 'ug', 'kg', 'co', 'e.k.', 'ek', 'ohg', 'gbr']
const words = (x: string) => x.toLowerCase().replace(/[^a-z0-9äöüß]+/g, ' ').split(' ').filter(w => w.length > 2 && !STOP.includes(w))
export function sameCompany(name: string, hit: Suggestion, city?: string | null): boolean {
  const want = words(name), got = words(hit.main)
  if (!want.length || want.filter(w => got.includes(w)).length < Math.ceil(want.length / 2)) return false
  const c = (city ?? '').toLowerCase().trim()
  return !c || hit.secondary.toLowerCase().includes(c)
}

export async function placeRaw(key: string, id: string, full = false): Promise<GPlace> {
  return call<GPlace>(key, `/places/${encodeURIComponent(id)}?languageCode=${LANG}`, { method: 'GET' }, full ? MASK_AUDIT : MASK_CARD)
}

/** «schneider-dach.de/kontakt» statt «https://www.schneider-dach.de/kontakt/». */
export function prettyUrl(u: string | undefined | null): string | null {
  if (!u) return null
  return u.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '') || null
}

function component(p: GPlace, ...types: string[]) {
  for (const t of types) {
    const c = p.addressComponents?.find(c => c.types.includes(t))
    if (c) return c
  }
  return undefined
}

export function toPlace(p: GPlace): Place {
  return {
    id: p.id,
    name: p.displayName?.text ?? '',
    address: p.formattedAddress ?? '',
    city: component(p, 'locality', 'postal_town', 'administrative_area_level_3', 'administrative_area_level_2')?.longText ?? '',
    category: p.primaryTypeDisplayName?.text ?? 'Unternehmen',
    rating: typeof p.rating === 'number' ? p.rating : null,
    reviews: p.userRatingCount ?? 0,
    website: prettyUrl(p.websiteUri),
    phone: p.nationalPhoneNumber ?? null,
    mapsUrl: p.googleMapsUri ?? '',
    country: component(p, 'country')?.shortText,
    lat: p.location?.latitude,
    lng: p.location?.longitude,
  }
}

export type Competitor = { id: string; name: string; rating: number | null; reviews: number; website: boolean }

/** Wer erscheint bei «<Branche> <Ort>»? Liefert die Liste und die eigene Position (1-basiert, null = nicht in den Top 20). */
export function defaultQuery(p: GPlace): string {
  const city = component(p, 'locality', 'postal_town')?.longText ?? ''
  return [p.primaryTypeDisplayName?.text, city].filter(Boolean).join(' ')
}

export async function competitors(key: string, p: GPlace, q?: string): Promise<{ query: string; list: Competitor[]; rank: number | null }> {
  const query = q?.trim() || defaultQuery(p)
  const body: Record<string, unknown> = { textQuery: query, languageCode: LANG, pageSize: 20 }
  if (p.location) body.locationBias = { circle: { center: p.location, radius: 15000 } }
  const data = await call<{ places?: GPlace[] }>(key, '/places:searchText', { method: 'POST', body }, MASK_COMPETITORS)
  const list = (data.places ?? []).map(x => ({
    id: x.id, name: x.displayName?.text ?? '', rating: x.rating ?? null, reviews: x.userRatingCount ?? 0, website: !!x.websiteUri,
  }))
  const idx = list.findIndex(x => x.id === p.id)
  return { query, list, rank: idx >= 0 ? idx + 1 : null }
}
