// Sichtbarkeits-Check v2: Katalog der manuellen Prüfpunkte und Zusammenbau des Berichts.
// Automatische Punkte liefert audit-collect (checks.report_draft.items), manuelle Punkte und Korrekturen
// pflegt das Team in checks.checklist. Aus beidem entsteht der Bericht, den der Kunde sieht (checks.report).
// Texte für den Kunden: Deutsch. Beschriftungen im Admin: Russisch.

export type Mark = 'ok' | 'warn' | 'bad'
export type Chan = 'ai' | 'maps' | 'search' | 'social'
export const CHANS: [Chan, string][] = [['ai', 'KI-Suche'], ['maps', 'Google Maps'], ['search', 'Website & Google Search'], ['social', 'Social Media']]
const FACTOR: Record<Mark, number> = { ok: 1, warn: 0.5, bad: 0 }

export type Item = { id: string; pts: number; max: number; mark: Mark; text: string }
export type Answer = { mark?: Mark | 'na'; text?: string; note?: string; evidence?: string }
export type AiRes = { mentioned?: boolean; pos?: string }
export type Engine = 'chatgpt' | 'perplexity' | 'gemini'
export const ENGINES: [Engine, string][] = [['chatgpt', 'ChatGPT'], ['perplexity', 'Perplexity'], ['gemini', 'Gemini']]
export type DirState = '' | 'ok' | 'diff' | 'missing'
export type Checklist = {
  keywords?: string[]
  answers?: Record<string, Answer>
  summaries?: Partial<Record<Chan, string>>
  scores?: Partial<Record<Chan, number | null>>
  recs?: [string, string, string][] | null
  aiQuestions?: string[]
  aiResults?: Record<string, Partial<Record<Engine, AiRes>>>
  aiNamed?: string
  dirs?: Record<string, DirState>
  pagespeed?: number | null
}

export type ManualDef = { id: string; chan: Chan; label: string; weight: number; texts: Partial<Record<Mark, string>>; hint?: string }
export const MANUAL: ManualDef[] = [
  { id: 'maps_claimed', chan: 'maps', label: 'Profil vom Inhaber bestätigt', weight: 10, hint: 'In Google Maps fehlt der Button «Inhaber dieses Unternehmens?»',
    texts: { ok: 'Profil ist vom Inhaber bestätigt', bad: 'Profil ist nicht vom Inhaber bestätigt — Dritte können Änderungen vorschlagen' } },
  { id: 'maps_desc', chan: 'maps', label: 'Profilbeschreibung', weight: 8,
    texts: { ok: 'Beschreibung im Profil gepflegt', warn: 'Beschreibung zu kurz oder ohne Leistungen und Ort', bad: 'Keine Beschreibung im Profil' } },
  { id: 'maps_services', chan: 'maps', label: 'Leistungen / Produkte im Profil', weight: 8,
    texts: { ok: 'Leistungen im Profil eingetragen', warn: 'Nur wenige Leistungen eingetragen', bad: 'Keine Leistungen im Profil eingetragen' } },
  { id: 'maps_posts', chan: 'maps', label: 'Beiträge (Updates) im Profil', weight: 8, hint: 'ok — Beitrag in den letzten 30 Tagen',
    texts: { ok: 'Regelmäßige Beiträge im Profil', warn: 'Letzter Beitrag ist älter als einen Monat', bad: 'Keine Beiträge im Profil' } },
  { id: 'maps_replies', chan: 'maps', label: 'Antworten auf Bewertungen', weight: 8,
    texts: { ok: 'Auf Bewertungen wird geantwortet', warn: 'Nur auf einen Teil der Bewertungen geantwortet', bad: 'Auf Bewertungen wird nicht geantwortet' } },
  { id: 'search_positions', chan: 'search', label: 'Positionen in der normalen Google-Suche für wichtige Suchbegriffe', weight: 15, hint: 'Im Inkognito-Modus prüfen, in der Notiz: Suchbegriff und Platz',
    texts: { ok: 'Bei wichtigen Suchanfragen auf Seite 1 bei Google', warn: 'Bei wichtigen Suchanfragen nur auf Seite 2–3', bad: 'Bei wichtigen Suchanfragen nicht unter den ersten 30 Treffern' } },
  { id: 'search_firstscreen', chan: 'search', label: 'Erster Bildschirm: klar, was, wo und wie erreichbar', weight: 8,
    texts: { ok: 'Auf den ersten Blick klar: was, wo und wie erreichbar', warn: 'Angebot und Region erst nach dem Scrollen erkennbar', bad: 'Unklar, was angeboten wird und wo' } },
  { id: 'social_bio', chan: 'social', label: 'Profilgestaltung (Beschreibung, Ort, Link, Buttons)', weight: 10,
    texts: { ok: 'Profil vollständig: Beschreibung mit Leistung, Ort und Link', warn: 'Profil unvollständig — Leistung, Ort oder Link fehlen', bad: 'Profil ohne Beschreibung und Kontakt' } },
  { id: 'social_active', chan: 'social', label: 'Regelmäßigkeit der Beiträge', weight: 15, hint: 'In der Notiz: Datum des letzten Beitrags, Beiträge in 30 Tagen',
    texts: { ok: 'Regelmäßige Beiträge (mehrmals pro Woche)', warn: 'Unregelmäßige Beiträge', bad: 'Seit über einem Monat keine Beiträge' } },
  { id: 'social_real', chan: 'social', label: 'Echte Inhalte: Projekte, Team, Menschen', weight: 10,
    texts: { ok: 'Echte Projekte, Team und Menschen', warn: 'Kaum eigene Fotos — überwiegend Stockbilder oder Werbung', bad: 'Keine eigenen Inhalte' } },
  { id: 'social_consistent', chan: 'social', label: 'Einheitlicher Name und Logo überall', weight: 5,
    texts: { ok: 'Name und Logo überall einheitlich', warn: 'Name oder Logo nicht einheitlich' } },
]

export const DIRECTORIES: [string, string][] = [
  ['gelbeseiten', 'Gelbe Seiten'], ['dasoertliche', 'Das Örtliche'], ['11880', '11880.com'], ['goyellow', 'GoYellow'],
  ['cylex', 'Cylex'], ['bing', 'Bing Places'], ['apple', 'Apple Maps'], ['provenexpert', 'ProvenExpert'], ['branche', 'Branchenverzeichnis'],
]

export function defaultQuestions(category: string, city: string): string[] {
  const c = category || 'Firma', o = city || 'meiner Nähe'
  return [`Wer ist ein guter ${c} in ${o}?`, `Welchen ${c} in ${o} kannst du empfehlen?`, `Ich brauche einen ${c} in ${o} — wen soll ich anrufen?`]
}

const pct = (items: Item[]) => {
  const max = items.reduce((a, i) => a + i.max, 0)
  return max ? Math.round(items.reduce((a, i) => a + i.pts, 0) / max * 100) : null
}
const ORDER: Record<Mark, number> = { bad: 0, warn: 1, ok: 2 }

const SUMMARY: Record<Chan, [string, string, string]> = {
  ai: ['KI-Assistenten finden und empfehlen Ihr Unternehmen.', 'KI-Assistenten kennen Sie, empfehlen aber oft andere.', 'In KI-Antworten tauchen Sie kaum auf — Kunden bekommen andere Empfehlungen.'],
  maps: ['Das Google-Profil ist stark und gepflegt.', 'Das Profil ist eine gute Basis, hat aber einige offensichtliche Lücken.', 'Das Profil hat deutliche Lücken — hier verlieren Sie die meisten Anfragen.'],
  search: ['Die Website ist technisch solide aufgestellt.', 'Die Website funktioniert, verschenkt aber Sichtbarkeit bei Google.', 'Die Website hilft bei Google und in der KI-Suche kaum weiter.'],
  social: ['Die wichtigsten Profile sind vorhanden und aktiv.', 'Es gibt Profile, aber noch Lücken.', 'In Social Media sind Sie kaum zu finden.'],
}
export const autoSummary = (ch: Chan, s: number | null) => s === null ? '' : s >= 75 ? SUMMARY[ch][0] : s >= 50 ? SUMMARY[ch][1] : SUMMARY[ch][2]

export type DraftV2 = { version?: number; items?: Partial<Record<Chan, Item[]>>; channels?: Partial<Record<Chan, { score: number; summary: string; points: [Mark, string][] }>>; recommendations?: [string, string, string][] }
export type Audit = {
  place?: { displayName?: { text?: string }; rating?: number; userRatingCount?: number; websiteUri?: string; primaryTypeDisplayName?: { text?: string }; addressComponents?: { longText: string; types: string[] }[] }
  competitors?: { query: string; rank: number | null; list: { id: string; name: string; rating: number | null; reviews: number; website: boolean }[] } | null
  ranks?: { query: string; rank: number | null; total: number; top?: string[] }[]
  pagespeed?: { score: number | null; error?: string } | null
  keywords?: string[]
  collected_at?: string
}

/** Punkte der KI-Antworten (manuell) zusammenfassen. */
export function aiStats(cl: Checklist) {
  const qs = (cl.aiQuestions ?? []).filter(q => q.trim())
  let asked = 0, mentioned = 0
  qs.forEach(q => ENGINES.forEach(([e]) => { const r = cl.aiResults?.[q]?.[e]; if (r && r.mentioned !== undefined) { asked++; if (r.mentioned) mentioned++ } }))
  return { asked, mentioned }
}

/** Alle Punkte eines Kanals: automatische (ggf. korrigiert) + manuelle. */
export function channelItems(ch: Chan, draft: DraftV2 | null, cl: Checklist, audit: Audit | null): (Item & { source: 'auto' | 'manual'; label?: string })[] {
  const out: (Item & { source: 'auto' | 'manual'; label?: string })[] = []
  const auto = draft?.items?.[ch] ?? []
  for (const it of auto) {
    const a = cl.answers?.[it.id]
    if (a?.mark === 'na') continue
    const mark = (a?.mark as Mark | undefined) ?? it.mark
    out.push({ ...it, mark, pts: a?.mark ? it.max * FACTOR[mark] : it.pts, text: a?.text?.trim() || it.text, source: 'auto' })
  }
  for (const d of MANUAL.filter(m => m.chan === ch)) {
    const a = cl.answers?.[d.id]
    if (!a?.mark || a.mark === 'na') continue
    const text = a.text?.trim() || d.texts[a.mark] || d.texts.warn || d.label
    out.push({ id: d.id, max: d.weight, pts: d.weight * FACTOR[a.mark], mark: a.mark, text, source: 'manual', label: d.label })
  }
  if (ch === 'search' && !auto.some(i => i.id === 'pagespeed') && typeof cl.pagespeed === 'number') {
    const v = cl.pagespeed
    const mark: Mark = v >= 90 ? 'ok' : v >= 50 ? 'warn' : 'bad'
    out.push({ id: 'pagespeed', max: 10, pts: 10 * FACTOR[mark], mark, source: 'manual', text: `Google PageSpeed (mobil): ${v}/100${mark === 'bad' ? ' — sehr langsam, Besucher springen ab' : mark === 'warn' ? ' — auf dem Smartphone spürbar langsam' : ''}` })
  }
  if (ch === 'ai') {
    const { asked, mentioned } = aiStats(cl)
    if (asked) {
      const share = mentioned / asked
      const mark: Mark = share >= 0.5 ? 'ok' : share > 0 ? 'warn' : 'bad'
      out.push({ id: 'ai_answers', max: 40, pts: 40 * share, mark, source: 'manual', text: `In ${mentioned} von ${asked} Antworten von ChatGPT, Perplexity und Gemini genannt` })
    }
    const states = DIRECTORIES.map(([k]) => cl.dirs?.[k] ?? '').filter(Boolean)
    if (states.length) {
      const ok = states.filter(s => s === 'ok').length, diff = states.filter(s => s === 'diff').length
      const share = (ok + diff * 0.5) / states.length
      const mark: Mark = share >= 0.75 ? 'ok' : share >= 0.4 ? 'warn' : 'bad'
      out.push({ id: 'ai_dirs', max: 20, pts: 20 * share, mark, source: 'manual', text: `In ${ok + diff} von ${states.length} wichtigen Verzeichnissen eingetragen${diff ? `, davon ${diff} mit abweichenden Daten` : ''}` })
    }
  }
  void audit
  return out.sort((a, b) => ORDER[a.mark] - ORDER[b.mark] || b.max - a.max)
}

export type PublishedReport = {
  version: 2
  channels: Partial<Record<Chan, { score: number | null; summary: string; points: [Mark, string][] }>>
  recommendations: [string, string, string][]
  competitors?: { query: string; rank: number | null; you: { name: string; rating: number | null; reviews: number; website: boolean }; list: { name: string; rating: number | null; reviews: number; website: boolean }[] }
  ranks?: { query: string; rank: number | null; total: number }[]
  ai?: { asked: number; mentioned: number; named: string }
  collected_at?: string
  recommended?: unknown
}

/** Bericht für den Kunden aus Entwurf + Checkliste. */
export function compose(draft: DraftV2 | null, cl: Checklist, audit: Audit | null, noProfile: boolean): PublishedReport {
  const channels: PublishedReport['channels'] = {}
  for (const [ch] of CHANS) {
    const items = channelItems(ch, draft, cl, audit)
    const auto = pct(items)
    const ov = cl.scores?.[ch]
    const score = typeof ov === 'number' ? ov : auto
    if (score === null && !items.length) continue
    channels[ch] = { score, summary: cl.summaries?.[ch]?.trim() || (ch === 'maps' && noProfile ? 'Ihr Unternehmen hat kein Google-Profil — hier verlieren Sie die meisten Anfragen.' : autoSummary(ch, score)), points: items.map(i => [i.mark, i.text]) }
  }
  const c = audit?.competitors
  const p = audit?.place
  const competitors = c && c.list.length ? {
    query: c.query, rank: c.rank,
    you: { name: p?.displayName?.text ?? '', rating: p?.rating ?? null, reviews: p?.userRatingCount ?? 0, website: !!p?.websiteUri },
    list: c.list.filter((_, i) => i !== (c.rank ?? 0) - 1).slice(0, 5).map(x => ({ name: x.name, rating: x.rating, reviews: x.reviews, website: x.website })),
  } : undefined
  const ranks = [...(c ? [{ query: c.query, rank: c.rank, total: c.list.length }] : []), ...(audit?.ranks ?? []).map(r => ({ query: r.query, rank: r.rank, total: r.total }))]
  const ai = aiStats(cl)
  return {
    version: 2, channels,
    recommendations: (cl.recs?.filter(r => r[1].trim()) as [string, string, string][] | undefined)?.length ? cl.recs!.filter(r => r[1].trim()) : (draft?.recommendations ?? []),
    competitors, ranks: noProfile ? [] : ranks,
    ai: ai.asked ? { ...ai, named: cl.aiNamed?.trim() ?? '' } : undefined,
    collected_at: audit?.collected_at,
  }
}

export const totalScore = (r: { channels?: Record<string, { score: number | null } | undefined> } | null | undefined): number | null => {
  const v = Object.values(r?.channels ?? {}).map(c => c?.score).filter((x): x is number => typeof x === 'number')
  return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null
}
