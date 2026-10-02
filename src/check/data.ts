// ─────────────────────────────────────────────────────────────────────────────
// SICHTBARKEITS-CHECK — Datenschicht (Stand 25.09.2026: Demo-Modus)
//
// Alles, was später echte Dienste braucht, läuft über diese Datei:
//   • Unternehmenssuche  → Google Places API (New): Text Search + Place Details,
//                          über Supabase Edge Functions (supabase/functions/places-*),
//                          damit der API-Schlüssel nie im Browser landet.
//   • Quellen finden     → Edge Function discover-sources lädt die Website und sucht Social-Links.
//   • Analyse            → Edge Function audit-collect (nach «Analyse starten»): Google-Profil,
//                          Wettbewerber, Website-Prüfung → checks.audit + checks.report_draft.
//   • Anmeldung          → Supabase Auth: E-Mail + Passwort (ohne E-Mail-Bestätigung),
//                          «Passwort vergessen» per Link → /passwort-neu.
//   • Speichern          → Supabase-Tabellen checks + messages (Schema: supabase/schema.sql).
//
// Solange VITE_PLACES_PROXY nicht gesetzt ist, liefert die Unternehmenssuche
// Beispieldaten (DEMO). Wert: https://<projekt>.supabase.co/functions/v1 (siehe .env.example). Konto, Check und Nachrichten laufen bereits über Supabase.
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
  country?: string
  lat?: number
  lng?: number
  /** true = kein Google-Profil gefunden, Angaben hat der Kunde selbst gemacht */
  manual?: boolean
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

// ── Beispieldaten (erfundene Betriebe in DACH) ─────────────────────────────────
const DEMO_PLACES: Place[] = [
  { id: 'demo-1', name: 'Schneider Dachtechnik GmbH', address: 'Eppendorfer Weg 48, 20259 Hamburg', city: 'Hamburg', category: 'Dachdecker', rating: 4.7, reviews: 38, website: 'schneider-dachtechnik.de', phone: '040 1234500', mapsUrl: '' },
  { id: 'demo-2', name: 'Elektro Becker', address: 'Leopoldstraße 120, 80802 München', city: 'München', category: 'Elektriker', rating: 4.9, reviews: 112, website: 'elektro-becker-muenchen.de', phone: '089 2233440', mapsUrl: '' },
  { id: 'demo-3', name: 'Friseursalon Haarwerk', address: 'Mariahilfer Straße 22, 1070 Wien', city: 'Wien', category: 'Friseur', rating: 4.6, reviews: 214, website: 'haarwerk-wien.at', phone: '+43 1 9988770', mapsUrl: '' },
  { id: 'demo-4', name: 'Malerbetrieb Klein & Sohn', address: 'Badenerstrasse 70, 8004 Zürich', city: 'Zürich', category: 'Malerbetrieb', rating: 4.4, reviews: 27, website: null, phone: '+41 44 4455660', mapsUrl: '' },
  { id: 'demo-5', name: 'Physiotherapie am Ring', address: 'Hohenzollernring 5, 50672 Köln', city: 'Köln', category: 'Physiotherapeut', rating: 4.8, reviews: 96, website: 'physio-am-ring.de', phone: '0221 5566770', mapsUrl: '' },
  { id: 'demo-6', name: 'Autowerkstatt Weber', address: 'Kärntner Straße 200, 8020 Graz', city: 'Graz', category: 'Autowerkstatt', rating: 4.3, reviews: 151, website: 'kfz-weber-graz.at', phone: '+43 316 667788', mapsUrl: '' },
  { id: 'demo-7', name: 'Sanitär Hoffmann', address: 'Freiburgerstrasse 30, 4057 Basel', city: 'Basel', category: 'Sanitärinstallateur', rating: 4.5, reviews: 64, website: 'sanitaer-hoffmann.ch', phone: '+41 61 7788990', mapsUrl: '' },
  { id: 'demo-8', name: 'Gartenbau Alpenland', address: 'Amraser Straße 15, 6020 Innsbruck', city: 'Innsbruck', category: 'Garten- und Landschaftsbau', rating: 4.9, reviews: 41, website: 'gartenbau-alpenland.at', phone: '+43 512 123450', mapsUrl: '' },
]

const wait = (ms: number) => new Promise(r => setTimeout(r, ms))
const norm = (s: string) => s.toLocaleLowerCase('de-DE').replace(/\s+/g, ' ').trim()

/** Ergebnis ohne Treffer in den Beispieldaten: aus der Eingabe gebautes Unternehmen. */
function syntheticPlace(query: string): Place {
  const name = query.trim().replace(/\s+/g, ' ')
  return { id: 'demo-q:' + encodeURIComponent(name), name, address: 'Berlin, Deutschland', city: 'Berlin', category: 'Unternehmen', rating: null, reviews: 0, website: null, phone: null, mapsUrl: '' }
}

function toSuggestion(p: Place): Suggestion {
  return { id: p.id, main: p.name, secondary: `${p.category} · ${p.address}` }
}

/** Unternehmen ohne Google-Profil (nicht in der Trefferliste): Angaben des Kunden. */
export function manualPlace(input: { name: string; category: string; city: string; website: string }): Place {
  const website = input.website.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '') || null
  return {
    id: 'manual:' + newSessionToken(), name: input.name.trim(), address: input.city.trim(), city: input.city.trim(),
    category: input.category.trim() || 'Unternehmen', rating: null, reviews: 0, website, phone: null, mapsUrl: '', manual: true,
  }
}

/** Eine Such-Sitzung (Tippen → Auswahl). Google rechnet Vorschläge + Details pro Sitzung ab. */
export function newSessionToken(): string {
  try { return crypto.randomUUID() } catch { return Math.random().toString(36).slice(2) + Date.now().toString(36) }
}

/** Trefferliste nach Klick auf «Finden» (Places Text Search, Gebiet DACH). */
export async function searchCompanies(query: string, _sessionToken?: string): Promise<Suggestion[]> {
  const q = query.trim()
  if (q.length < 2) return []
  if (PROXY) {
    const res = await fetch(`${PROXY}/places-search`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q }),
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
export async function getCompany(id: string, _sessionToken?: string): Promise<Place | null> {
  if (PROXY && !id.startsWith('demo')) {
    const res = await fetch(`${PROXY}/places-details`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ placeId: id }),
    })
    if (!res.ok) return null
    return (await res.json()) as Place
  }
  await wait(350)
  if (id.startsWith('demo-q:')) return syntheticPlace(decodeURIComponent(id.slice(7)))
  return DEMO_PLACES.find(p => p.id === id) ?? null
}

/** Website + Social-Profile (Edge Function liest die Website und sucht Links). */
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

// ── Quiz-Lead mit dem Konto verbinden ────────────────────────────────────────
// Das Quiz merkt sich die Lead-ID im Tab; nach Registrierung/Anmeldung (Check oder Anfrage)
// wird der Lead dem Konto zugeordnet — im Admin erscheint dann ein Kunde statt zwei.
const LEAD_KEY = 'rag-lead'
export function rememberLead(id: string) { try { sessionStorage.setItem(LEAD_KEY, id) } catch { /* privat */ } }
export async function claimRememberedLead() {
  let id: string | null = null
  try { id = sessionStorage.getItem(LEAD_KEY) } catch { /* */ }
  if (!id) return
  const { error } = await (await getSupabase()).rpc('claim_lead', { p_lead: id })
  if (!error) { try { sessionStorage.removeItem(LEAD_KEY) } catch { /* */ } }
}

export async function createCheck(input: { place: Place; region: string; sources: Source[]; contact: Contact; sourcePage: string | null }): Promise<string | null> {
  const { data, error } = await (await getSupabase()).from('checks').insert({
    place_id: input.place.id, place: input.place, region: input.region, sources: input.sources,
    contact: input.contact, source_page: input.sourcePage,
  }).select('id').single()
  if (error) { console.error(error); return null }
  await claimRememberedLead().catch(() => undefined)
  return data.id as string
}

export async function loadLatestCheck(): Promise<CheckRow | null> {
  const { data, error } = await (await getSupabase()).from('checks')
    .select('id, email, place, region, sources, sources_confirmed, contact, status, report, created_at')
    .order('created_at', { ascending: false }).limit(1).maybeSingle()
  if (error) { console.error(error); return null }
  return data as CheckRow | null
}

/**
 * Startet die automatische Datensammlung (Edge Function audit-collect) für einen bestätigten Check.
 * Läuft im Hintergrund; der Server ignoriert Wiederholungen innerhalb von 30 Minuten.
 */
export async function runAudit(checkId: string): Promise<void> {
  if (!PROXY) return
  const { data } = await (await getSupabase()).auth.getSession()
  const token = data.session?.access_token
  if (!token) return
  await fetch(`${PROXY}/audit-collect`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ checkId }), keepalive: true,
  }).catch(() => undefined)
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
  await claimRememberedLead().catch(() => undefined)
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

// ── Ansprechpartner & Angebot (Kundenbereich) ────────────────────────────────
export type Manager = { name: string | null; title: string | null; photo_url: string | null; booking_url: string | null }
export type OfferLine = { id: string; name: string; description?: string; price: number; unit: 'einmalig' | 'pro Monat' }
export type ClientOffer = { id: string; items: OfferLine[]; note: string | null; status: 'sent' | 'accepted'; sent_at: string | null; updated_at: string }

/** Wer betreut den Kunden (Verantwortlicher im Admin). null = noch niemand zugeteilt. */
export async function loadMyManager(): Promise<Manager | null> {
  const { data, error } = await (await getSupabase()).rpc('my_manager')
  if (error || !Array.isArray(data) || !data.length) return null
  return data[0] as Manager
}
/** Vom Team gesendetes Angebot (Entwürfe sieht der Kunde nicht). */
export async function loadMyOffer(): Promise<ClientOffer | null> {
  const { data, error } = await (await getSupabase()).from('offers').select('id, items, note, status, sent_at, updated_at')
    .neq('status', 'draft').order('updated_at', { ascending: false }).limit(1).maybeSingle()
  return error ? null : (data as ClientOffer | null)
}
export async function acceptOffer(id: string): Promise<boolean> {
  const { error } = await (await getSupabase()).rpc('accept_offer', { p_id: id })
  return !error
}

// ── Termine & Konto (Kundenbereich) ─────────────────────────────────────────
export type Appointment = { id: string; starts_at: string; duration_min: number; title: string; location: string | null; note: string | null; status: 'planned' | 'done' | 'cancelled' }
export async function loadMyAppointments(): Promise<Appointment[]> {
  const { data, error } = await (await getSupabase()).from('appointments')
    .select('id, starts_at, duration_min, title, location, note, status').order('starts_at', { ascending: true })
  return error ? [] : (data as Appointment[])
}

export type MyContact = { name: string; phone: string }
/** Name und Telefon aus profiles (Fallback: Angaben aus der Registrierung). */
export async function loadMyContact(u: User): Promise<MyContact> {
  const { data } = await (await getSupabase()).from('profiles').select('name, phone').eq('id', u.id).maybeSingle()
  return {
    name: (data?.name as string | null) ?? (u.user_metadata?.name as string | undefined) ?? '',
    phone: (data?.phone as string | null) ?? (u.user_metadata?.phone as string | undefined) ?? '',
  }
}
export async function saveMyContact(c: MyContact): Promise<boolean> {
  const s = await getSupabase()
  const { error } = await s.rpc('update_my_contact', { p_name: c.name, p_phone: c.phone })
  if (error) return false
  await s.auth.updateUser({ data: { name: c.name.trim(), phone: c.phone.trim() } })
  return true
}
/** Neues Passwort — vorher das aktuelle prüfen. */
export async function changePassword(email: string, current: string, next: string): Promise<'ok' | 'wrong' | 'error'> {
  const s = await getSupabase()
  const check = await s.auth.signInWithPassword({ email, password: current })
  if (check.error) return 'wrong'
  const { error } = await s.auth.updateUser({ password: next })
  return error ? 'error' : 'ok'
}
export async function deleteMyAccount(): Promise<boolean> {
  const s = await getSupabase()
  const { error } = await s.rpc('delete_my_account')
  if (error) return false
  await s.auth.signOut()
  return true
}
