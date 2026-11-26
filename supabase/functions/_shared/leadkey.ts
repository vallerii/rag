// Ключ компании: как найти строку зарегистрированной компании в таблицах лидов (docs/lead-flow.md).
// Чистый TypeScript без Deno/Node API — работает в Edge Functions и в тестах (node --experimental-strip-types).
//
// Ключи (сильные сверху):
//   place:<place_id>  — Google Place ID (если колонка есть)
//   cid:<число>       — номер карточки Google из ссылки Google Maps (…/maps?cid=…); у Places тот же номер в googleMapsUri
//   web:<домен>       — сайт без www и пути (страницы соцсетей и каталогов не считаются)
//   tel:<цифры>       — телефон без +49 / 0 в начале
//   name:<имя>|<PLZ>  — название без формы (GmbH …) + индекс из адреса, только точное совпадение

export type Row = Record<string, string>
export type KeyKind = 'place' | 'cid' | 'web' | 'tel' | 'name'
export const KEY_ORDER: KeyKind[] = ['place', 'cid', 'web', 'tel', 'name']
const kindOf = (k: string) => k.slice(0, k.indexOf(':')) as KeyKind

// Названия колонок (как в таблицах лидов и CRM; DE / EN / RU)
const COLUMNS = {
  name: /^(?:company|unternehmen|firma|firmenname|name|компания|название)$/i,
  website: /^(?:website|webseite|homepage|domain|company website|сайт)$/i,
  phone: /^(?:company phone|telefon|phone|tel|телефон)$/i,
  address: /^(?:address|adresse|anschrift|адрес)$/i,
  maps: /^(?:google maps url|google maps|google maps link|maps|ссылка на google maps)$/i,
  placeId: /^(?:google )?place[ _-]?id$/i,
  date: /^datum der prüfung$/i,
  dateFallback: /^(?:checked on|geprüft am)$/i,
}
export function column(headers: string[], kind: keyof typeof COLUMNS): string | null {
  return headers.find(h => COLUMNS[kind].test(h.trim())) ?? null
}

/** Номер карточки Google из ссылки: ?cid=…, &ludocid=…, или …!1s0x…:0x<hex> в ссылке /maps/place/. */
export function cidFrom(url: string | null | undefined): string | null {
  const s = String(url ?? '')
  const dec = /[?&](?:cid|ludocid)=(\d{5,25})\b/.exec(s)
  if (dec) return dec[1].replace(/^0+/, '')
  const hex = /0x[0-9a-f]{6,16}:0x([0-9a-f]{6,16})/i.exec(s)
  if (hex) return BigInt('0x' + hex[1]).toString()
  return null
}

// Не сайт компании: соцсети, каталоги, конструкторы-ссылки, сам Google
const NOT_OWN_SITE = /(^|\.)(facebook\.com|instagram\.com|linkedin\.com|xing\.com|youtube\.com|tiktok\.com|twitter\.com|x\.com|google\.[a-z.]+|goo\.gl|g\.page|linktr\.ee|wa\.me|gelbeseiten\.de|dasoertliche\.de|11880\.com|my-hammer\.de|kleinanzeigen\.de|cylex\.de|goyellow\.de|provenexpert\.com|yelp\.de|yelp\.com|profimap\.de|werkenntdenbesten\.de|branchenbuch[a-z0-9-]*\.de)$/i
export function domainOf(url: string | null | undefined): string | null {
  const s = String(url ?? '').trim().toLowerCase()
  if (!s || /\s/.test(s)) return null
  const host = s.replace(/^[a-z]+:\/\//, '').replace(/^www\./, '').split(/[/?#:]/)[0]
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host) || NOT_OWN_SITE.test(host)) return null
  return host
}

/** «+49 2234 52375», «02234 52375», «0049…» → «223452375». Меньше 7 цифр — не ключ. */
export function phoneKey(phone: string | null | undefined): string | null {
  const raw = String(phone ?? '').trim()
  if (!raw) return null
  let d = raw.replace(/\D/g, '')
  if (raw.startsWith('+') || d.startsWith('00')) d = d.replace(/^00/, '').replace(/^49/, '')
  else d = d.replace(/^0/, '')
  return d.length >= 7 && d.length <= 13 ? d : null
}

const LEGAL = /\b(gmbh|mbh|ug|ag|kg|ohg|gbr|e\.?\s?k\.?|e\.?\s?v\.?|co|haftungsbeschränkt|inh\.?|inhaber(?:in)?|und|&)\b/g
export function nameKey(name: string | null | undefined, address: string | null | undefined): string | null {
  const plz = /\b(\d{5})\b/.exec(String(address ?? ''))?.[1]
  const n = String(name ?? '').toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[&+]/g, ' ').replace(LEGAL, ' ').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ')
  return plz && n.length >= 3 ? `name:${n}|${plz}` : null
}

function unique(keys: (string | null)[]): string[] {
  return [...new Set(keys.filter((k): k is string => !!k))]
    .sort((a, b) => KEY_ORDER.indexOf(kindOf(a)) - KEY_ORDER.indexOf(kindOf(b)))
}

/** Ключи компании из её Google-данных на сайте (checks.place + place_id). */
export function keysOfPlace(p: { id?: string | null; name?: string | null; address?: string | null; website?: string | null; phone?: string | null; mapsUrl?: string | null }): string[] {
  const realId = p.id && !/^(manual|demo)/.test(p.id) ? p.id : null
  const cid = cidFrom(p.mapsUrl)
  const web = domainOf(p.website)
  const tel = phoneKey(p.phone)
  return unique([realId && `place:${realId}`, cid && `cid:${cid}`, web && `web:${web}`, tel && `tel:${tel}`, nameKey(p.name, p.address)])
}

/** Ключи компании из строки таблицы лидов. */
export function keysOfRow(row: Row, headers: string[]): string[] {
  const v = (k: keyof typeof COLUMNS) => { const c = column(headers, k); return c ? (row[c] ?? '').trim() : '' }
  const pid = v('placeId')
  const cid = cidFrom(v('maps'))
  const web = domainOf(v('website'))
  const tel = phoneKey(v('phone'))
  return unique([/^[\w-]{10,}$/.test(pid) ? `place:${pid}` : null, cid && `cid:${cid}`, web && `web:${web}`, tel && `tel:${tel}`, nameKey(v('name'), v('address'))])
}

/** Есть ли в строке анализ Grok (хотя бы одна колонка «Befund …»). */
export function hasAnalysis(row: Row): boolean {
  return Object.entries(row).some(([h, val]) => /^befund\s/i.test(h.trim()) && String(val ?? '').trim().length > 2)
}

/** Дата проверки строки: «Datum der Prüfung», иначе «Checked On». 19.11.2026 · 2026-11-19 · 11/19/2026 (формат Google Sheets en-US). */
export function rowDate(row: Row, headers: string[]): string | null {
  const c = column(headers, 'date') ?? column(headers, 'dateFallback')
  const s = c ? (row[c] ?? '').trim() : ''
  let m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(s)
  if (m) return iso(+m[3], +m[2], +m[1])
  m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s)
  if (m) return iso(+m[1], +m[2], +m[3])
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s)
  if (m) return iso(+m[3], +m[1], +m[2])
  return null
}
function iso(y: number, mo: number, d: number): string | null {
  const t = new Date(Date.UTC(y, mo - 1, d))
  return t.getUTCMonth() === mo - 1 && t.getUTCDate() === d && y > 2000 ? t.toISOString().slice(0, 10) : null
}

/** Две записи — одна компания: есть общий ключ и нет противоречия (у обеих есть place/cid, и они разные). */
export function sameCompany(a: string[], b: string[]): KeyKind | null {
  for (const kind of ['place', 'cid'] as KeyKind[]) {
    const x = a.find(k => kindOf(k) === kind), y = b.find(k => kindOf(k) === kind)
    if (x && y && x !== y) return null
  }
  const shared = a.filter(k => b.includes(k))
  return shared.length ? kindOf(shared[0]) : null
}

export type Candidate = { ref: string; keys: string[]; row: Row; date: string | null; analysed: boolean }
export type Match = Candidate & { by: KeyKind }

/** Лучшая строка для компании + остальные совпавшие строки (дубли). Сильнее ключ → с анализом → свежее дата. */
export function bestMatch(keys: string[], list: Candidate[]): { best: Match | null; others: Match[] } {
  const hits: Match[] = []
  for (const c of list) { const by = sameCompany(keys, c.keys); if (by) hits.push({ ...c, by }) }
  hits.sort((a, b) => KEY_ORDER.indexOf(a.by) - KEY_ORDER.indexOf(b.by)
    || Number(b.analysed) - Number(a.analysed)
    || String(b.date ?? '').localeCompare(String(a.date ?? '')))
  return { best: hits[0] ?? null, others: hits.slice(1) }
}

/** Группы дублей во всех строках (одна компания в нескольких строках / таблицах). */
export function duplicateGroups(list: Candidate[]): Candidate[][] {
  const parent = list.map((_, i) => i)
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])))
  const byKey = new Map<string, number[]>()
  list.forEach((c, i) => c.keys.forEach(k => byKey.set(k, [...(byKey.get(k) ?? []), i])))
  for (const idx of byKey.values()) {
    for (let j = 1; j < idx.length; j++) {
      if (sameCompany(list[idx[0]].keys, list[idx[j]].keys)) parent[find(idx[j])] = find(idx[0])
    }
  }
  const groups = new Map<number, Candidate[]>()
  list.forEach((c, i) => groups.set(find(i), [...(groups.get(find(i)) ?? []), c]))
  return [...groups.values()].filter(g => g.length > 1)
}

// Колонки анализа, которые копируются в проверку клиента (видит клиент).
// Всё остальное (Belege, заметки команды, контакты, приоритет) — только в закрытой таблице для команды.
const CLIENT_COLUMNS = /^(?:befund\s|platz\s|ki[- ]?antworten|mitbewerber|verzeichnisse|nap[- ]abgleich|empfehlungen|google-profil details|website details|social details|datum der prüfung|suchbegriff)/i
export function clientColumns(row: Row): Row {
  return Object.fromEntries(Object.entries(row).filter(([h, v]) => CLIENT_COLUMNS.test(h.trim()) && String(v ?? '').trim()))
}
