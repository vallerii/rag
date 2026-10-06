// Automatischer Entwurf des Berichts aus den gesammelten Daten.
// Ergebnis hat genau das Format von checks.report (siehe src/check/data.ts → Report),
// wird aber als checks.report_draft gespeichert: Das Team prüft, ergänzt «KI-Suche»
// und übernimmt ihn dann in report (status = 'ready').

import type { Competitor, GPlace } from './google.ts'
import type { SiteScan, Source } from './site.ts'

type Mark = 'ok' | 'warn' | 'bad'
export type ReportChannel = { score: number; summary: string; points: [Mark, string][] }
export type ChannelKey = 'ai' | 'maps' | 'search' | 'social'
export type Report = {
  channels: Partial<Record<ChannelKey, ReportChannel>>
  recommendations: [string, string, string][]
  /** v2: einzelne Kriterien je Kanal — der Admin kombiniert sie mit der manuellen Checkliste. */
  version?: number
  items?: Record<ChannelKey, Item[]>
}

export type AuditInput = {
  place: GPlace
  competitors: { query: string; list: Competitor[]; rank: number | null } | null
  site: SiteScan | null
  sources: Source[]
  now?: Date
  /** Kein Google-Profil gefunden — Angaben stammen vom Kunden. */
  noProfile?: boolean
  /** Google PageSpeed (mobil, 0–100); null = nicht ermittelt → Team trägt von Hand ein. */
  pagespeed?: { score: number | null; error?: string } | null
  /** Weitere Suchbegriffe (Begriff 2 und 3) für die Position bei Google Maps. */
  ranks?: { query: string; rank: number | null; total: number }[]
}

// Ein Kriterium: erreichte Punkte, Maximum, Bewertung und Text für den Kunden.
export type Item = { id: string; pts: number; max: number; mark: Mark; text: string }

function score(items: Item[]): number {
  const max = items.reduce((a, i) => a + i.max, 0)
  return max ? Math.round(items.reduce((a, i) => a + i.pts, 0) / max * 100) : 0
}
// Wichtigste zuerst: schlecht → Hinweis → gut, maximal 5 Punkte im Bericht.
function points(items: Item[]): [Mark, string][] {
  const order: Record<Mark, number> = { bad: 0, warn: 1, ok: 2 }
  const shown = [...items].sort((a, b) => order[a.mark] - order[b.mark] || b.max - a.max)
  const goods = shown.filter(i => i.mark === 'ok').slice(0, 2)
  const issues = shown.filter(i => i.mark !== 'ok').slice(0, 5 - goods.length)
  return [...goods, ...issues].map(i => [i.mark, i.text])
}
function summary(s: number, good: string, mid: string, weak: string) {
  return s >= 75 ? good : s >= 50 ? mid : weak
}
const median = (xs: number[]) => {
  if (!xs.length) return 0
  const s = [...xs].sort((a, b) => a - b), m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
const fmt = (n: number) => n.toLocaleString('de-DE', { maximumFractionDigits: 1 })

// ── 02 Google Maps ───────────────────────────────────────────────────────────
function mapsItems({ place: p, competitors: c, now = new Date(), noProfile }: AuditInput): Item[] {
  const items: Item[] = []
  if (noProfile) {
    items.push({ id: 'noprofile', pts: 0, max: 100, mark: 'bad', text: 'Kein Google-Unternehmensprofil gefunden — bei Google Maps und lokalen Suchen erscheinen Sie nicht' })
    const n = (c?.list ?? []).length
    if (c && n) items.push({ id: 'rank-noprofile', pts: 0, max: 0, mark: 'bad', text: `Bei «${c.query}» zeigt Google ${n} andere Betriebe — Sie nicht` })
    return items
  }
  const rating = p.rating ?? 0
  const reviews = p.userRatingCount ?? 0
  const others = (c?.list ?? []).filter(x => x.id !== p.id).slice(0, 5)
  const med = median(others.map(x => x.reviews))

  items.push(p.businessStatus === 'OPERATIONAL' || !p.businessStatus
    ? { id: 'status', pts: 10, max: 10, mark: 'ok', text: 'Profil ist aktiv und als geöffnet markiert' }
    : { id: 'status', pts: 0, max: 10, mark: 'bad', text: 'Profil ist als vorübergehend oder dauerhaft geschlossen markiert' })

  if (!reviews) items.push({ id: 'rating', pts: 0, max: 15, mark: 'bad', text: 'Noch keine Bewertungen' })
  else if (rating >= 4.6) items.push({ id: 'rating', pts: 15, max: 15, mark: 'ok', text: `Sehr gute Bewertung: ${fmt(rating)} ★` })
  else if (rating >= 4.2) items.push({ id: 'rating', pts: 10, max: 15, mark: 'ok', text: `Gute Bewertung: ${fmt(rating)} ★` })
  else if (rating >= 3.8) items.push({ id: 'rating', pts: 5, max: 15, mark: 'warn', text: `Bewertung ${fmt(rating)} ★ — unter dem, was Kunden bei der Auswahl erwarten` })
  else items.push({ id: 'rating', pts: 0, max: 15, mark: 'bad', text: `Niedrige Bewertung: ${fmt(rating)} ★` })

  if (reviews && others.length) {
    if (reviews >= med && reviews >= 30) items.push({ id: 'reviews', pts: 20, max: 20, mark: 'ok', text: `${reviews} Bewertungen — mehr als die meisten Wettbewerber (Median ${Math.round(med)})` })
    else if (reviews >= med * 0.5) items.push({ id: 'reviews', pts: 12, max: 20, mark: 'warn', text: `${reviews} Bewertungen — Wettbewerber in der Nähe haben im Schnitt ${Math.round(med)}` })
    else items.push({ id: 'reviews', pts: 5, max: 20, mark: 'bad', text: `Nur ${reviews} Bewertungen — Wettbewerber in der Nähe haben im Schnitt ${Math.round(med)}` })
  } else if (reviews) {
    items.push(reviews >= 30
      ? { id: 'reviews', pts: 16, max: 20, mark: 'ok', text: `${reviews} Bewertungen` }
      : { id: 'reviews', pts: 8, max: 20, mark: 'warn', text: `Erst ${reviews} Bewertungen` })
  } else items.push({ id: 'reviews', pts: 0, max: 20, mark: 'bad', text: 'Keine Bewertungen — für neue Kunden fehlt der Vertrauensbeweis' })

  // Google liefert höchstens 5 «relevanteste» Bewertungen; die neueste davon ist eine Untergrenze.
  const last = (p.reviews ?? []).map(r => r.publishTime ? Date.parse(r.publishTime) : 0).reduce((a, b) => Math.max(a, b), 0)
  if (reviews) {
    const days = last ? Math.round((now.getTime() - last) / 86_400_000) : null
    if (days !== null && days <= 60) items.push({ id: 'fresh', pts: 10, max: 10, mark: 'ok', text: 'Regelmäßig neue Bewertungen' })
    else if (days !== null && days <= 180) items.push({ id: 'fresh', pts: 5, max: 10, mark: 'warn', text: 'Die letzte sichtbare Bewertung ist einige Monate alt' })
    else items.push({ id: 'fresh', pts: 0, max: 10, mark: 'bad', text: 'Seit langem keine neuen Bewertungen' })
  }

  const photos = (p.photos ?? []).length // Google liefert maximal 10
  items.push(photos >= 10
    ? { id: 'photos', pts: 10, max: 10, mark: 'ok', text: 'Ausreichend Fotos im Profil' }
    : photos >= 5
      ? { id: 'photos', pts: 5, max: 10, mark: 'warn', text: `Nur ${photos} Fotos im Profil` }
      : { id: 'photos', pts: 0, max: 10, mark: 'bad', text: photos ? `Nur ${photos} Fotos im Profil` : 'Keine Fotos im Profil' })

  items.push(p.regularOpeningHours?.weekdayDescriptions?.length
    ? { id: 'hours', pts: 10, max: 10, mark: 'ok', text: 'Öffnungszeiten gepflegt' }
    : { id: 'hours', pts: 0, max: 10, mark: 'bad', text: 'Keine Öffnungszeiten hinterlegt' })
  items.push(p.nationalPhoneNumber
    ? { id: 'phone', pts: 5, max: 5, mark: 'ok', text: 'Telefonnummer hinterlegt' }
    : { id: 'phone', pts: 0, max: 5, mark: 'bad', text: 'Keine Telefonnummer im Profil' })
  items.push(p.websiteUri
    ? { id: 'website', pts: 10, max: 10, mark: 'ok', text: 'Website mit dem Profil verknüpft' }
    : { id: 'website', pts: 0, max: 10, mark: 'bad', text: 'Keine Website mit dem Profil verknüpft' })
  items.push((p.types ?? []).length >= 3
    ? { id: 'types', pts: 5, max: 5, mark: 'ok', text: 'Mehrere passende Kategorien' }
    : { id: 'types', pts: 2, max: 5, mark: 'warn', text: 'Wenige Kategorien — Google versteht nicht alle Leistungen' })

  if (c) {
    const q = `«${c.query}»`
    if (c.rank && c.rank <= 3) items.push({ id: 'rank', pts: 15, max: 15, mark: 'ok', text: `Bei ${q} unter den ersten 3 (Platz ${c.rank})` })
    else if (c.rank && c.rank <= 10) items.push({ id: 'rank', pts: 8, max: 15, mark: 'warn', text: `Bei ${q} auf Platz ${c.rank} — die ersten 3 bekommen die meisten Anrufe` })
    else if (c.rank) items.push({ id: 'rank', pts: 3, max: 15, mark: 'bad', text: `Bei ${q} erst auf Platz ${c.rank}` })
    else items.push({ id: 'rank', pts: 0, max: 15, mark: 'bad', text: `Bei ${q} nicht unter den ersten ${c.list.length} Treffern` })
  }
  return items
}

// ── 03 Website & Google Search ───────────────────────────────────────────────
/** Website blockiert automatische Abrufe (Bot-Schutz) — dann bewertet das Team selbst. */
export function siteBlocked(s: SiteScan | null): boolean {
  return !!s && [401, 403, 429, 503].includes(s.status ?? 0)
}

function searchItems(input: AuditInput): Item[] {
  const { place: p, site: s } = input
  if (!p.websiteUri && !s) return [{ id: 'nosite', pts: 5, max: 100, mark: 'bad', text: 'Keine Website gefunden — bei Google Search und in der KI-Suche fehlt die wichtigste Quelle' }]
  if (!s || !s.status) return [{ id: 'down', pts: 5, max: 100, mark: 'bad', text: 'Die Website war bei der Prüfung nicht erreichbar' }]
  if (!s.ok) return [{ id: 'down', pts: 5, max: 100, mark: 'bad', text: `Die Website antwortet mit einem Fehler (HTTP ${s.status})` }]
  const city = (p.addressComponents?.find(c => c.types.includes('locality'))?.longText ?? '').toLowerCase()
  const items: Item[] = []
  items.push({ id: 'reach', pts: 15, max: 15, mark: 'ok', text: 'Website ist erreichbar' })
  items.push(s.https
    ? { id: 'https', pts: 10, max: 10, mark: 'ok', text: 'Sichere Verbindung (HTTPS)' }
    : { id: 'https', pts: 0, max: 10, mark: 'bad', text: 'Keine sichere Verbindung (HTTPS) — Browser warnen Besucher' })
  items.push(s.viewport
    ? { id: 'mobile', pts: 10, max: 10, mark: 'ok', text: 'Für Smartphones eingerichtet' }
    : { id: 'mobile', pts: 0, max: 10, mark: 'bad', text: 'Nicht für Smartphones eingerichtet' })
  if (!s.title) items.push({ id: 'title', pts: 0, max: 15, mark: 'bad', text: 'Die Startseite hat keinen Seitentitel' })
  else if (city && s.title.toLowerCase().includes(city)) items.push({ id: 'title', pts: 15, max: 15, mark: 'ok', text: 'Seitentitel nennt Leistung und Ort' })
  else items.push({ id: 'title', pts: 8, max: 15, mark: 'warn', text: 'Der Seitentitel nennt den Ort nicht — wichtig für lokale Suchen' })
  items.push(s.description
    ? { id: 'desc', pts: 10, max: 10, mark: 'ok', text: 'Beschreibung für Suchergebnisse vorhanden' }
    : { id: 'desc', pts: 0, max: 10, mark: 'warn', text: 'Keine Beschreibung für die Suchergebnisse — Google wählt selbst einen Text' })
  items.push(s.h1 === 1
    ? { id: 'h1', pts: 5, max: 5, mark: 'ok', text: 'Klare Hauptüberschrift' }
    : { id: 'h1', pts: 0, max: 5, mark: 'warn', text: s.h1 ? 'Mehrere Hauptüberschriften auf der Startseite' : 'Keine Hauptüberschrift auf der Startseite' })
  const local = s.schemaTypes.some(t => /LocalBusiness|Organization|Store|Service|Contractor|Plumber|Electrician|Roofing|Dentist|Physician|HairSalon|AutoRepair|HomeAndConstruction|ProfessionalService|MedicalBusiness/i.test(t))
  items.push(local
    ? { id: 'schema', pts: 10, max: 10, mark: 'ok', text: 'Unternehmensdaten maschinenlesbar ausgezeichnet' }
    : { id: 'schema', pts: 0, max: 10, mark: 'warn', text: 'Keine maschinenlesbaren Unternehmensdaten — erschwert es Google und KI, Sie einzuordnen' })
  items.push(s.telLink
    ? { id: 'tel', pts: 10, max: 10, mark: 'ok', text: 'Telefonnummer direkt antippbar' }
    : { id: 'tel', pts: 0, max: 10, mark: 'warn', text: 'Telefonnummer ist auf dem Smartphone nicht direkt antippbar' })
  items.push(s.ms !== null && s.ms <= 2500
    ? { id: 'speed', pts: 10, max: 10, mark: 'ok', text: 'Startseite lädt schnell' }
    : { id: 'speed', pts: 3, max: 10, mark: 'warn', text: 'Startseite lädt langsam' })
  items.push(s.words >= 300
    ? { id: 'content', pts: 5, max: 5, mark: 'ok', text: 'Ausreichend Text auf der Startseite' }
    : { id: 'content', pts: 0, max: 5, mark: 'warn', text: 'Sehr wenig Text auf der Startseite — zu wenig Kontext für Google und KI' })
  if (s.noindex) items.push({ id: 'noindex', pts: 0, max: 10, mark: 'bad', text: 'Die Startseite ist für Google gesperrt (noindex)' })
  // v2: Pflichtseiten, Cookie-Banner, Sitemap, Unterseiten, Abgleich mit Google, PageSpeed
  if (s.impressum !== undefined) {
    items.push(s.impressum
      ? { id: 'impressum', pts: 8, max: 8, mark: 'ok', text: 'Impressum vorhanden' }
      : { id: 'impressum', pts: 0, max: 8, mark: 'bad', text: 'Kein Impressum gefunden — in Deutschland Pflicht und abmahnfähig' })
    items.push(s.datenschutz
      ? { id: 'datenschutz', pts: 8, max: 8, mark: 'ok', text: 'Datenschutzerklärung vorhanden' }
      : { id: 'datenschutz', pts: 0, max: 8, mark: 'bad', text: 'Keine Datenschutzerklärung gefunden — Pflicht nach DSGVO' })
    items.push(s.cookie
      ? { id: 'cookie', pts: 4, max: 4, mark: 'ok', text: 'Cookie-Hinweis eingerichtet' }
      : { id: 'cookie', pts: 1, max: 4, mark: 'warn', text: 'Kein Cookie-Hinweis erkannt — prüfen, ob Tracking oder externe Dienste eingebunden sind' })
    items.push(s.sitemap?.found
      ? { id: 'sitemap', pts: 5, max: 5, mark: 'ok', text: `Sitemap für Google vorhanden (${s.sitemap.urls} Seiten)` }
      : { id: 'sitemap', pts: 0, max: 5, mark: 'warn', text: 'Keine Sitemap gefunden — Google findet neue Seiten langsamer' })
    const n = (s.pages ?? []).filter(x => x !== '/' && !/impressum|datenschutz|privacy|kontakt|contact|agb/i.test(x)).length
    items.push(n >= 5
      ? { id: 'pages', pts: 10, max: 10, mark: 'ok', text: `Mehrere Unterseiten (${n}) — Platz für einzelne Leistungen` }
      : n >= 2
        ? { id: 'pages', pts: 5, max: 10, mark: 'warn', text: `Nur ${n} Unterseiten — eigene Seiten je Leistung fehlen` }
        : { id: 'pages', pts: 0, max: 10, mark: 'bad', text: 'Praktisch nur eine Seite — Google kann einzelne Leistungen nicht zuordnen' })
    items.push(s.form
      ? { id: 'form', pts: 4, max: 4, mark: 'ok', text: 'Kontaktformular vorhanden' }
      : { id: 'form', pts: 1, max: 4, mark: 'warn', text: 'Kein Kontaktformular — Anfragen nur per Telefon oder E-Mail' })
    const nap = napCheck(p, s)
    if (nap) items.push(nap)
  }
  if (input.pagespeed?.score != null) {
    const v = input.pagespeed.score
    items.push(v >= 90
      ? { id: 'pagespeed', pts: 10, max: 10, mark: 'ok', text: `Google PageSpeed (mobil): ${v}/100` }
      : v >= 50
        ? { id: 'pagespeed', pts: 5, max: 10, mark: 'warn', text: `Google PageSpeed (mobil): ${v}/100 — auf dem Smartphone spürbar langsam` }
        : { id: 'pagespeed', pts: 0, max: 10, mark: 'bad', text: `Google PageSpeed (mobil): ${v}/100 — sehr langsam, Besucher springen ab` })
  }
  return items
}

const digits = (x: string) => x.replace(/\D+/g, '')
/** Stimmen Name, Postleitzahl und Telefon auf der Website (Startseite + Impressum) mit Google überein? */
function napCheck(p: GPlace, s: SiteScan): Item | null {
  const hay = (s.hay ?? '').toLowerCase()
  if (!hay) return null
  const miss: string[] = []
  const phone = digits(p.nationalPhoneNumber ?? '').replace(/^0/, '')
  if (phone.length >= 6 && !digits(hay).includes(phone)) miss.push('Telefon')
  const zip = p.addressComponents?.find(c => c.types.includes('postal_code'))?.longText
  if (zip && !hay.includes(zip.toLowerCase())) miss.push('Adresse')
  const word = (p.displayName?.text ?? '').toLowerCase().split(/[^a-zäöüß0-9]+/).find(w => w.length >= 4)
  if (word && !hay.includes(word)) miss.push('Name')
  if (!phone && !zip) return null
  return miss.length
    ? { id: 'nap', pts: miss.length > 1 ? 0 : 4, max: 10, mark: miss.length > 1 ? 'bad' : 'warn', text: `Angaben auf der Website weichen von Google ab (${miss.join(', ')}) — verwirrt Google und KI` }
    : { id: 'nap', pts: 10, max: 10, mark: 'ok', text: 'Name, Adresse und Telefon stimmen mit Google überein' }
}

// ── 01 KI-Suche: automatisch prüfbare Signale (Antworten der KI prüft das Team von Hand) ──
function aiItems(input: AuditInput): Item[] {
  const { place: p, site: s, noProfile } = input
  const items: Item[] = []
  items.push(noProfile
    ? { id: 'ai_profile', pts: 0, max: 20, mark: 'bad', text: 'Kein Google-Profil — eine der wichtigsten Quellen für KI-Antworten fehlt' }
    : p.editorialSummary?.text
      ? { id: 'ai_profile', pts: 20, max: 20, mark: 'ok', text: 'Google-Profil mit Beschreibung — KI kann Ihr Angebot einordnen' }
      : { id: 'ai_profile', pts: 12, max: 20, mark: 'warn', text: 'Google-Profil ohne Beschreibung — KI weiß wenig über Ihr Angebot' })
  if (s?.ok) {
    const local = s.schemaTypes.some(t => /LocalBusiness|Organization|Store|Service|Contractor|Plumber|Electrician|Roofing|Dentist|Physician|HairSalon|AutoRepair|HomeAndConstruction|ProfessionalService|MedicalBusiness/i.test(t))
    items.push(local
      ? { id: 'ai_schema', pts: 15, max: 15, mark: 'ok', text: 'Unternehmensdaten für Maschinen lesbar ausgezeichnet' }
      : { id: 'ai_schema', pts: 0, max: 15, mark: 'warn', text: 'Keine maschinenlesbaren Unternehmensdaten auf der Website' })
    if (s.faq !== undefined) items.push(s.faq
      ? { id: 'ai_faq', pts: 15, max: 15, mark: 'ok', text: 'Antworten auf häufige Fragen auf der Website' }
      : { id: 'ai_faq', pts: 0, max: 15, mark: 'warn', text: 'Keine Antworten auf typische Kundenfragen — genau danach fragen Kunden die KI' })
    const nap = napCheck(p, s)
    if (nap) items.push({ ...nap, id: 'ai_nap', text: nap.mark === 'ok' ? 'Einheitliche Unternehmensdaten auf Website und Google' : 'Unterschiedliche Unternehmensdaten auf Website und Google — KI vertraut widersprüchlichen Angaben weniger' })
  } else {
    items.push({ id: 'ai_site', pts: 0, max: 30, mark: 'bad', text: 'Ohne erreichbare Website fehlt der KI die wichtigste Quelle' })
  }
  return items
}

// ── 04 Social Media (Aktivität prüft das Team) ───────────────────────────────
function socialItems({ sources, site }: AuditInput): Item[] {
  const found = sources.filter(s => s.key !== 'website' && s.value.trim())
  const items: Item[] = []
  const n = found.length
  const LABEL: Record<string, string> = { instagram: 'Instagram', facebook: 'Facebook', linkedin: 'LinkedIn', tiktok: 'TikTok' }
  const names = found.map(s => LABEL[s.key] ?? s.key).join(', ')
  items.push(n >= 2
    ? { id: 'profiles', pts: 55, max: 70, mark: 'ok', text: `Profile gefunden: ${names}` }
    : n === 1
      ? { id: 'profiles', pts: 35, max: 70, mark: 'warn', text: `Nur ein Profil gefunden: ${names}` }
      : { id: 'profiles', pts: 5, max: 70, mark: 'bad', text: 'Keine Social-Media-Profile gefunden' })
  if (n && site?.ok) {
    const linked = found.filter(s => site.social[s.key as keyof SiteScan['social']]).length
    items.push(linked === n
      ? { id: 'linked', pts: 15, max: 15, mark: 'ok', text: 'Profile sind auf der Website verlinkt' }
      : { id: 'linked', pts: 5, max: 15, mark: 'warn', text: 'Nicht alle Profile sind auf der Website verlinkt' })
  }
  return items
}

// ── Empfehlungen ─────────────────────────────────────────────────────────────
const RECS: Record<string, [string, string]> = {
  noprofile: ['Google-Unternehmensprofil anlegen', 'Ohne Profil erscheinen Sie weder bei Google Maps noch in lokalen Suchen. Wir richten es schlüsselfertig ein.'],
  reviews: ['Mehr Bewertungen sammeln', 'Ein fester Ablauf, um nach jedem Auftrag um eine Bewertung zu bitten — per Link oder QR-Code.'],
  fresh: ['Bewertungen regelmäßig halten', 'Neue Bewertungen jeden Monat zeigen Google und Kunden, dass Sie aktiv sind.'],
  rating: ['Bewertung verbessern', 'Auf jede Bewertung antworten, Kritik ernst nehmen und zufriedene Kunden aktiv um Feedback bitten.'],
  rank: ['In den Top 3 bei Google Maps landen', 'Profil vollständig ausfüllen, Leistungen und Kategorien ergänzen, regelmäßig Fotos und Beiträge.'],
  photos: ['Echte Fotos ins Profil', 'Team, Fahrzeuge, Werkstatt und Projekte — mindestens 10 aktuelle Fotos.'],
  hours: ['Öffnungszeiten eintragen', 'Ohne Öffnungszeiten zeigt Google Ihr Profil seltener und Kunden rufen woanders an.'],
  website: ['Website mit dem Profil verknüpfen', 'Der Link im Google-Profil bringt Besucher und stärkt die lokale Sichtbarkeit.'],
  nosite: ['Eine eigene Website', 'Eine klare Seite mit Leistungen, Region und Kontakt — Grundlage für Google Search und KI-Antworten.'],
  down: ['Website wieder erreichbar machen', 'Eine nicht erreichbare Website kostet Anfragen und Vertrauen bei Google.'],
  https: ['HTTPS aktivieren', 'Ohne sichere Verbindung warnen Browser Ihre Besucher.'],
  mobile: ['Website für Smartphones', 'Die meisten lokalen Suchen kommen vom Handy.'],
  title: ['Leistung und Ort in den Seitentitel', 'So erscheinen Sie bei Suchen wie «Leistung + Ort».'],
  schema: ['Unternehmensdaten auszeichnen', 'Strukturierte Daten helfen Google und KI-Assistenten, Sie richtig einzuordnen.'],
  profiles: ['Social-Media-Profil aufbauen', 'Ein aktives Profil mit echten Projekten und Menschen schafft Vertrauen.'],
  noindex: ['Sperre für Google entfernen', 'Die Startseite ist für Google gesperrt — sie kann so nicht gefunden werden.'],
  impressum: ['Impressum ergänzen', 'Ein fehlendes Impressum ist abmahnfähig und kostet Vertrauen bei Kunden und Google.'],
  datenschutz: ['Datenschutzerklärung ergänzen', 'Pflicht nach DSGVO — sonst drohen Abmahnungen.'],
  nap: ['Unternehmensdaten vereinheitlichen', 'Name, Adresse und Telefon überall gleich — auf Website, Google und in Verzeichnissen.'],
  pages: ['Eine Seite pro Leistung', 'Eigene Seiten je Leistung und Ort bringen Anfragen genau zu dem, was Sie anbieten.'],
  pagespeed: ['Website schneller machen', 'Auf dem Smartphone zählt jede Sekunde — langsame Seiten verlieren Anfragen.'],
  ai_faq: ['Antworten auf Kundenfragen', 'Kurze Antworten auf typische Fragen helfen Kunden, Google und KI-Assistenten.'],
}
const PRIO = ['Hohe Priorität', 'Mittlere Priorität', 'Wachstumspotenzial']
// Reihenfolge der Empfehlungen: zuerst, was am meisten Anfragen kostet.
const REC_ORDER = ['noprofile', 'nosite', 'down', 'noindex', 'impressum', 'datenschutz', 'website', 'reviews', 'rating', 'rank', 'nap', 'hours', 'pages', 'fresh', 'photos', 'https', 'mobile', 'pagespeed', 'title', 'schema', 'ai_faq', 'profiles']

export function buildReport(input: AuditInput): Report {
  const blocked = siteBlocked(input.site)
  const maps = mapsItems(input), search = blocked ? [] : searchItems(input), social = socialItems(input), ai = aiItems(input)
  // Weitere Suchbegriffe: Position bei Google Maps
  if (!input.noProfile) (input.ranks ?? []).forEach((r, i) => {
    const q = `«${r.query}»`, id = `rank${i + 2}`
    maps.push(r.rank && r.rank <= 3 ? { id, pts: 10, max: 10, mark: 'ok', text: `Bei ${q} unter den ersten 3 (Platz ${r.rank})` }
      : r.rank && r.rank <= 10 ? { id, pts: 5, max: 10, mark: 'warn', text: `Bei ${q} auf Platz ${r.rank}` }
      : { id, pts: 0, max: 10, mark: 'bad', text: r.rank ? `Bei ${q} erst auf Platz ${r.rank}` : `Bei ${q} nicht unter den ersten ${r.total} Treffern` })
  })
  const sMaps = score(maps), sSearch = score(search), sSocial = score(social)
  const open = new Set([...maps, ...search, ...social, ...ai].filter(i => i.mark !== 'ok').map(i => i.id))
  const recommendations = REC_ORDER.filter(id => open.has(id)).slice(0, 3)
    .map((id, n): [string, string, string] => [PRIO[n], RECS[id][0], RECS[id][1]])
  const channels: Report['channels'] = {
    maps: { score: sMaps, points: points(maps), summary: input.noProfile ? 'Ihr Unternehmen hat kein Google-Profil — hier verlieren Sie die meisten Anfragen.' : summary(sMaps,
      'Das Google-Profil ist stark und gepflegt.',
      'Das Profil ist eine gute Basis, hat aber einige offensichtliche Lücken.',
      'Das Profil hat deutliche Lücken — hier verlieren Sie die meisten Anfragen.') },
    // Bei Bot-Schutz bleibt «Website & Google Search» leer — das Team prüft von Hand.
    search: blocked ? undefined : { score: sSearch, points: points(search), summary: summary(sSearch,
      'Die Website ist technisch solide aufgestellt.',
      'Die Website funktioniert, verschenkt aber Sichtbarkeit bei Google.',
      'Die Website hilft bei Google und in der KI-Suche kaum weiter.') },
    social: { score: sSocial, points: points(social), summary: summary(sSocial,
      'Die wichtigsten Profile sind vorhanden.',
      'Es gibt Profile, aber noch Lücken.',
      'In Social Media sind Sie kaum zu finden.') },
    // ai (KI-Suche) ergänzt das Team.
  }
  if (!channels.search) delete channels.search
  return { channels, recommendations, version: 2, items: { ai, maps, search, social } }
}
