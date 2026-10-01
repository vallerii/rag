// Google Places API (New) — gemeinsame Helfer für Edge Functions und das Test-Skript.
// Reines TypeScript ohne Deno-/Node-spezifische APIs: läuft in Supabase Edge Functions
// und lokal mit `node --experimental-strip-types scripts/check-places.ts`.

const BASE = 'https://places.googleapis.com/v1'
const LANG = 'de'

/** Suchgebiet DACH (Deutschland, Österreich, Schweiz) — Treffer außerhalb werden ausgeschlossen. */
const DACH = { low: { latitude: 45.8, longitude: 5.8 }, high: { latitude: 55.1, longitude: 17.2 } }

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
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': mask },
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
    body: { textQuery: query, languageCode: LANG, pageSize: 8, locationRestriction: { rectangle: DACH } },
  }, MASK_SEARCH)
  return (data.places ?? []).map(p => ({
    id: p.id,
    main: p.displayName?.text ?? '',
    secondary: [p.primaryTypeDisplayName?.text, p.formattedAddress].filter(Boolean).join(' · '),
  }))
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
export async function competitors(key: string, p: GPlace): Promise<{ query: string; list: Competitor[]; rank: number | null }> {
  const city = component(p, 'locality', 'postal_town')?.longText ?? ''
  const query = [p.primaryTypeDisplayName?.text, city].filter(Boolean).join(' ')
  const body: Record<string, unknown> = { textQuery: query, languageCode: LANG, pageSize: 20 }
  if (p.location) body.locationBias = { circle: { center: p.location, radius: 15000 } }
  const data = await call<{ places?: GPlace[] }>(key, '/places:searchText', { method: 'POST', body }, MASK_COMPETITORS)
  const list = (data.places ?? []).map(x => ({
    id: x.id, name: x.displayName?.text ?? '', rating: x.rating ?? null, reviews: x.userRatingCount ?? 0, website: !!x.websiteUri,
  }))
  const idx = list.findIndex(x => x.id === p.id)
  return { query, list, rank: idx >= 0 ? idx + 1 : null }
}
