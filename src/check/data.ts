// ─────────────────────────────────────────────────────────────────────────────
// SICHTBARKEITS-CHECK — Datenschicht (Stand 25.09.2026: Demo-Modus)
//
// Alles, was später echte Dienste braucht, läuft über diese Datei:
//   • Unternehmenssuche  → Google Places API (New): Autocomplete + Place Details,
//                          über einen eigenen Proxy (Supabase Edge Function), damit
//                          der API-Schlüssel nie im Browser landet.
//   • Quellen finden     → Edge Function lädt die Website und sucht Social-Links.
//   • Anmeldung          → Supabase Auth: E-Mail + Passwort (ohne E-Mail-Bestätigung),
//                          «Passwort vergessen» per Link → /passwort-neu.
//   • Speichern          → Supabase-Tabellen checks + messages (Schema: supabase/schema.sql).
//
// Solange VITE_PLACES_PROXY nicht gesetzt ist, liefert die Unternehmenssuche
// Beispieldaten (DEMO). Konto, Check und Nachrichten laufen bereits über Supabase.
// ─────────────────────────────────────────────────────────────────────────────

import type { User } from '@supabase/supabase-js'
// Supabase erst bei Bedarf laden — die Startseite (Suchfeld) bleibt so klein.
export const getSupabase = () => import('./supabase').then(m => m.supabase)

export type Suggestion = { id: string; main: string; secondary: string }

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
}

export type SourceKey = 'website' | 'instagram' | 'facebook' | 'linkedin' | 'tiktok'
export type Source = { key: SourceKey; value: string; found: boolean }

export type Contact = { name: string; email: string; phone: string; role?: string; okEmail: boolean; okPhone: boolean }
export type CheckStatus = 'submitted' | 'in_review' | 'ready'


const PROXY = (import.meta.env.VITE_PLACES_PROXY as string | undefined)?.replace(/\/$/, '')

/** true, solange keine echte Google-Anbindung konfiguriert ist. */
export const DEMO = !PROXY

export const SOURCE_LABELS: Record<SourceKey, string> = {
  website: 'Website', instagram: 'Instagram', facebook: 'Facebook', linkedin: 'LinkedIn', tiktok: 'TikTok',
}
export const SOURCE_ORDER: SourceKey[] = ['website', 'instagram', 'facebook', 'linkedin', 'tiktok']

// ── Beispieldaten (erfundene Betriebe in Siegen) ───────────────────────────────
const DEMO_PLACES: Place[] = [
  { id: 'demo-1', name: 'Schneider Dachtechnik GmbH', address: 'Sandstraße 48, 57072 Siegen', city: 'Siegen', category: 'Dachdecker', rating: 4.7, reviews: 38, website: 'schneider-dachtechnik.de', phone: '0271 123450', mapsUrl: '' },
  { id: 'demo-2', name: 'Elektro Becker', address: 'Weidenauer Straße 120, 57076 Siegen', city: 'Siegen', category: 'Elektriker', rating: 4.9, reviews: 112, website: 'elektro-becker-siegen.de', phone: '0271 223344', mapsUrl: '' },
  { id: 'demo-3', name: 'Friseursalon Haarwerk', address: 'Kölner Straße 22, 57072 Siegen', city: 'Siegen', category: 'Friseur', rating: 4.6, reviews: 214, website: 'haarwerk-siegen.de', phone: '0271 998877', mapsUrl: '' },
  { id: 'demo-4', name: 'Malerbetrieb Klein & Sohn', address: 'Hagener Straße 70, 57072 Siegen', city: 'Siegen', category: 'Malerbetrieb', rating: 4.4, reviews: 27, website: null, phone: '0271 445566', mapsUrl: '' },
  { id: 'demo-5', name: 'Physiotherapie am Obergraben', address: 'Obergraben 5, 57072 Siegen', city: 'Siegen', category: 'Physiotherapeut', rating: 4.8, reviews: 96, website: 'physio-obergraben.de', phone: '0271 556677', mapsUrl: '' },
  { id: 'demo-6', name: 'Autowerkstatt Weber', address: 'Leimbachstraße 200, 57074 Siegen', city: 'Siegen', category: 'Autowerkstatt', rating: 4.3, reviews: 151, website: 'kfz-weber-siegen.de', phone: '0271 667788', mapsUrl: '' },
  { id: 'demo-7', name: 'Sanitär Hoffmann', address: 'Freudenberger Straße 300, 57072 Siegen', city: 'Siegen', category: 'Sanitärinstallateur', rating: 4.5, reviews: 64, website: 'sanitaer-hoffmann.de', phone: '0271 778899', mapsUrl: '' },
  { id: 'demo-8', name: 'Gartenbau Siegerland', address: 'Netphener Straße 15, 57223 Kreuztal', city: 'Kreuztal', category: 'Garten- und Landschaftsbau', rating: 4.9, reviews: 41, website: 'gartenbau-siegerland.de', phone: '02732 12345', mapsUrl: '' },
]

const wait = (ms: number) => new Promise(r => setTimeout(r, ms))
const norm = (s: string) => s.toLocaleLowerCase('de-DE').replace(/\s+/g, ' ').trim()

/** Ergebnis ohne Treffer in den Beispieldaten: aus der Eingabe gebautes Unternehmen. */
function syntheticPlace(query: string): Place {
  const name = query.trim().replace(/\s+/g, ' ')
  return { id: 'demo-q:' + encodeURIComponent(name), name, address: 'Siegen, Deutschland', city: 'Siegen', category: 'Unternehmen', rating: null, reviews: 0, website: null, phone: null, mapsUrl: '' }
}

function toSuggestion(p: Place): Suggestion {
  return { id: p.id, main: p.name, secondary: `${p.category} · ${p.address}` }
}

/** Eine Such-Sitzung (Tippen → Auswahl). Google rechnet Vorschläge + Details pro Sitzung ab. */
export function newSessionToken(): string {
  try { return crypto.randomUUID() } catch { return Math.random().toString(36).slice(2) + Date.now().toString(36) }
}

/** Vorschläge während der Eingabe (Places Autocomplete). */
export async function searchCompanies(query: string, sessionToken: string): Promise<Suggestion[]> {
  const q = query.trim()
  if (q.length < 2) return []
  if (PROXY) {
    const res = await fetch(`${PROXY}/places-autocomplete`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: q, sessionToken }),
    })
    if (!res.ok) throw new Error('search failed')
    return (await res.json()) as Suggestion[]
  }
  await wait(220)
  const nq = norm(q)
  const hits = DEMO_PLACES.filter(p => norm(`${p.name} ${p.category} ${p.address}`).includes(nq))
  return (hits.length ? hits : [syntheticPlace(q)]).slice(0, 5).map(toSuggestion)
}

/** Details zum gewählten Unternehmen (Places Details). */
export async function getCompany(id: string, sessionToken: string): Promise<Place | null> {
  if (PROXY) {
    const res = await fetch(`${PROXY}/places-details`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ placeId: id, sessionToken }),
    })
    if (!res.ok) return null
    return (await res.json()) as Place
  }
  await wait(350)
  if (id.startsWith('demo-q:')) return syntheticPlace(decodeURIComponent(id.slice(7)))
  return DEMO_PLACES.find(p => p.id === id) ?? null
}

/** Website + Social-Profile (später: Edge Function liest die Website und sucht Links). */
export async function discoverSources(place: Place): Promise<Source[]> {
  if (PROXY) {
    const res = await fetch(`${PROXY}/discover-sources`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ website: place.website }),
    })
    if (res.ok) return (await res.json()) as Source[]
  }
  await wait(900)
  const handle = place.website ? place.website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('.')[0].replace(/-/g, '') : ''
  return SOURCE_ORDER.map(key => {
    if (key === 'website') return { key, value: place.website ?? '', found: !!place.website }
    if (handle && key === 'instagram') return { key, value: '@' + handle, found: true }
    if (handle && key === 'facebook') return { key, value: 'facebook.com/' + handle, found: true }
    return { key, value: '', found: false }
  })
}

// ── Konto (Supabase Auth: E-Mail + Passwort) ─────────────────────────────────
export type AuthError = 'exists' | 'invalid' | 'weak' | 'rate' | 'network' | 'other'

function mapAuthError(e: { code?: string; message?: string; status?: number } | null): AuthError {
  const code = e?.code ?? ''
  const msg = (e?.message ?? '').toLowerCase()
  if (code === 'user_already_exists' || code === 'email_exists' || msg.includes('already registered')) return 'exists'
  if (code === 'invalid_credentials' || msg.includes('invalid login')) return 'invalid'
  if (code === 'weak_password' || msg.includes('password should')) return 'weak'
  if (code.includes('rate_limit') || e?.status === 429) return 'rate'
  if (msg.includes('fetch')) return 'network'
  return 'other'
}

export function authErrorText(e: AuthError): string {
  switch (e) {
    case 'exists': return 'Für diese E-Mail gibt es schon ein Konto. Bitte melden Sie sich an.'
    case 'invalid': return 'E-Mail oder Passwort ist nicht korrekt.'
    case 'weak': return 'Das Passwort ist zu schwach. Bitte mindestens 8 Zeichen verwenden.'
    case 'rate': return 'Zu viele Versuche. Bitte warten Sie einen Moment.'
    case 'network': return 'Keine Verbindung. Bitte prüfen Sie Ihre Internetverbindung.'
    default: return 'Etwas ist schiefgelaufen. Bitte versuchen Sie es noch einmal.'
  }
}

export async function currentUser(): Promise<User | null> {
  const { data } = await (await getSupabase()).auth.getSession()
  return data.session?.user ?? null
}

/** Neues Konto (ohne E-Mail-Bestätigung). Existiert die E-Mail schon → error 'exists'. */
export async function signUp(email: string, password: string, name: string, phone: string): Promise<{ user: User | null; error?: AuthError }> {
  const { data, error } = await (await getSupabase()).auth.signUp({
    email: email.trim(), password, options: { data: { name: name.trim(), phone: phone.trim() } },
  })
  if (error) return { user: null, error: mapAuthError(error) }
  // Je nach Supabase-Einstellung kommt bei vorhandener Adresse kein Fehler, aber auch keine Sitzung.
  if (!data.session) return { user: null, error: 'exists' }
  return { user: data.user }
}

export async function signIn(email: string, password: string): Promise<{ user: User | null; error?: AuthError }> {
  const { data, error } = await (await getSupabase()).auth.signInWithPassword({ email: email.trim(), password })
  return error ? { user: null, error: mapAuthError(error) } : { user: data.user }
}

export async function sendPasswordReset(email: string): Promise<AuthError | null> {
  const { error } = await (await getSupabase()).auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/passwort-neu` })
  return error ? mapAuthError(error) : null
}

export async function setNewPassword(password: string): Promise<AuthError | null> {
  const { error } = await (await getSupabase()).auth.updateUser({ password })
  return error ? mapAuthError(error) : null
}

export async function signOut() {
  await (await getSupabase()).auth.signOut()
}

// ── Check + Nachrichten (Supabase-Tabellen) ──────────────────────────────────
export type ReportChannel = { score: number; summary: string; points: ['ok' | 'warn' | 'bad', string][] }
export type Report = {
  channels?: Partial<Record<'ai' | 'maps' | 'search' | 'social', ReportChannel>>
  recommendations?: [string, string, string][]
}

export type CheckRow = {
  id: string
  email: string | null
  place: Place
  region: string | null
  sources: Source[]
  sources_confirmed: boolean
  contact: Contact
  status: CheckStatus
  report: Report | null
  created_at: string
}
export type MessageRow = { id: string; author: 'client' | 'rag'; body: string; created_at: string }

export async function createCheck(input: { place: Place; region: string; sources: Source[]; contact: Contact; sourcePage: string | null }): Promise<string | null> {
  const { data, error } = await (await getSupabase()).from('checks').insert({
    place_id: input.place.id, place: input.place, region: input.region, sources: input.sources,
    contact: input.contact, source_page: input.sourcePage,
  }).select('id').single()
  if (error) { console.error(error); return null }
  return data.id as string
}

export async function loadLatestCheck(): Promise<CheckRow | null> {
  const { data, error } = await (await getSupabase()).from('checks')
    .select('id, email, place, region, sources, sources_confirmed, contact, status, report, created_at')
    .order('created_at', { ascending: false }).limit(1).maybeSingle()
  if (error) { console.error(error); return null }
  return data as CheckRow | null
}

/** Kunde bestätigt Website + Profile im Kundenbereich → Analyse kann starten. */
export async function confirmSources(checkId: string, sources: Source[]): Promise<boolean> {
  const { error } = await (await getSupabase()).from('checks').update({ sources, sources_confirmed: true }).eq('id', checkId)
  return !error
}

export async function updateSources(checkId: string, sources: Source[]): Promise<boolean> {
  const { error } = await (await getSupabase()).from('checks').update({ sources }).eq('id', checkId)
  return !error
}

// Ein Nachrichtenverlauf pro Kunde (egal ob Check oder Paket-Anfrage).
export async function loadMessages(): Promise<MessageRow[]> {
  const { data } = await (await getSupabase()).from('messages').select('id, author, body, created_at')
    .order('created_at', { ascending: true })
  return (data ?? []) as MessageRow[]
}

export async function sendMessage(body: string): Promise<MessageRow | null> {
  const { data, error } = await (await getSupabase()).from('messages').insert({ body, author: 'client' })
    .select('id, author, body, created_at').single()
  return error ? null : (data as MessageRow)
}

// ── Paket-Anfragen (Tabelle orders) ──────────────────────────────────────────
export type OrderItem = { id: string; name: string; price: number; unit: 'einmalig' | 'pro Monat' }
export type OrderDetails = {
  company: string
  industry: string
  city: string
  website: string
  goals: string[]
  problem: string
  reach: string
  phone: string
}
export type OrderStatus = 'new' | 'contacted' | 'active' | 'closed'
export type OrderRow = {
  id: string
  items: OrderItem[]
  details: OrderDetails | null
  status: OrderStatus
  created_at: string
}

export async function createOrder(items: OrderItem[], sourcePage: string | null): Promise<string | null> {
  const { data, error } = await (await getSupabase()).from('orders').insert({ items, source_page: sourcePage }).select('id').single()
  if (error) { console.error(error); return null }
  return data.id as string
}

export async function loadLatestOrder(): Promise<OrderRow | null> {
  const { data, error } = await (await getSupabase()).from('orders')
    .select('id, items, details, status, created_at')
    .order('created_at', { ascending: false }).limit(1).maybeSingle()
  if (error) { console.error(error); return null }
  return data as OrderRow | null
}

export async function saveOrderDetails(orderId: string, details: OrderDetails): Promise<boolean> {
  const { error } = await (await getSupabase()).from('orders').update({ details }).eq('id', orderId)
  return !error
}

/** Summe getrennt nach einmalig / monatlich, z. B. «149 € einmalig + 199 € pro Monat». */
export function orderTotal(items: OrderItem[]): string {
  const once = items.filter(i => i.unit === 'einmalig').reduce((a, i) => a + i.price, 0)
  const monthly = items.filter(i => i.unit === 'pro Monat').reduce((a, i) => a + i.price, 0)
  return [once ? `${once} € einmalig` : '', monthly ? `${monthly} € pro Monat` : ''].filter(Boolean).join(' + ')
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || 'R'
}
