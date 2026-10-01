// Website laden und einfache Signale auslesen: Erreichbarkeit, HTTPS, Titel, Meta-Description,
// H1, Viewport, strukturierte Daten, Telefon-Link — und Links zu Social-Media-Profilen.
// Reines TypeScript (läuft in Deno und Node 22+).

export type SourceKey = 'website' | 'instagram' | 'facebook' | 'linkedin' | 'tiktok'
export type Source = { key: SourceKey; value: string; found: boolean }
export const SOURCE_ORDER: SourceKey[] = ['website', 'instagram', 'facebook', 'linkedin', 'tiktok']

export type SiteScan = {
  ok: boolean
  url: string            // angefragt
  finalUrl: string | null
  status: number | null
  https: boolean
  ms: number | null      // Antwortzeit inkl. HTML
  title: string | null
  description: string | null
  h1: number
  viewport: boolean
  noindex: boolean
  lang: string | null
  schemaTypes: string[]  // @type aus JSON-LD
  telLink: boolean
  words: number
  social: Partial<Record<Exclude<SourceKey, 'website'>, string>>
  error?: string
}

const UA = 'Mozilla/5.0 (compatible; RAG-Sichtbarkeits-Check/1.0; +https://rag.agency)'

function decode(s: string) {
  return s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim()
}

function meta(html: string, name: string): string | null {
  const re = new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*>`, 'i')
  const tag = html.match(re)?.[0]
  const c = tag?.match(/content=["']([^"']*)["']/i)?.[1]
  return c ? decode(c) : null
}

const SOCIAL: [Exclude<SourceKey, 'website'>, RegExp, RegExp][] = [
  ['instagram', /https?:\/\/(?:www\.)?instagram\.com\/([A-Za-z0-9_.]{2,30})\/?(?=["'?#\s<])/gi, /^(p|reel|reels|explore|stories|accounts|share)$/i],
  ['facebook', /https?:\/\/(?:[a-z]{2,3}-[a-z]{2}\.|www\.|m\.|de-de\.)?facebook\.com\/((?:profile\.php\?id=\d+)|[A-Za-z0-9.\-]{2,80})\/?(?=["'?#\s<])/gi, /^(sharer|sharer\.php|share|plugins|tr|dialog|events|groups|watch|login|policies|privacy)$/i],
  ['linkedin', /https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/((?:company|in|school)\/[A-Za-z0-9_\-%.]{2,100})\/?(?=["'?#\s<])/gi, /^(shareArticle|sharing)/i],
  ['tiktok', /https?:\/\/(?:www\.)?tiktok\.com\/(@[A-Za-z0-9_.]{2,30})\/?(?=["'?#\s<])/gi, /^$/],
]

export function socialLinks(html: string): SiteScan['social'] {
  const out: SiteScan['social'] = {}
  for (const [key, re, skip] of SOCIAL) {
    re.lastIndex = 0
    for (const m of html.matchAll(re)) {
      const handle = m[1]
      if (skip.test(handle)) continue
      out[key] = key === 'instagram' ? '@' + handle
        : key === 'facebook' ? 'facebook.com/' + handle
        : key === 'linkedin' ? 'linkedin.com/' + handle
        : handle
      break
    }
  }
  return out
}

function schemaTypes(html: string): string[] {
  const types = new Set<string>()
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    for (const t of m[1].matchAll(/"@type"\s*:\s*(\[[^\]]*\]|"[^"]+")/g)) {
      t[1].replace(/[\[\]"]/g, '').split(',').map(s => s.trim()).filter(Boolean).forEach(x => types.add(x))
    }
  }
  return [...types]
}

async function get(url: string, timeoutMs: number) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  const t0 = Date.now()
  try {
    const res = await fetch(url, { redirect: 'follow', signal: ctrl.signal, headers: { 'User-Agent': UA, 'Accept': 'text/html,*/*;q=0.8', 'Accept-Language': 'de' } })
    const html = (await res.text()).slice(0, 1_500_000)
    return { res, html, ms: Date.now() - t0 }
  } finally {
    clearTimeout(timer)
  }
}

/** Lädt die Startseite (erst https, dann http). Wirft nie — Fehler stehen in `error`. */
export async function scanSite(website: string, timeoutMs = 6000): Promise<SiteScan> {
  const bare = website.replace(/^https?:\/\//i, '').replace(/\/$/, '')
  const empty: SiteScan = { ok: false, url: bare, finalUrl: null, status: null, https: false, ms: null, title: null, description: null, h1: 0, viewport: false, noindex: false, lang: null, schemaTypes: [], telLink: false, words: 0, social: {} }
  let r: Awaited<ReturnType<typeof get>> | null = null
  let lastErr = ''
  for (const url of [`https://${bare}`, `http://${bare}`]) {
    try { r = await get(url, timeoutMs); break } catch (e) { lastErr = e instanceof Error ? e.message : String(e) }
  }
  if (!r) return { ...empty, error: lastErr || 'nicht erreichbar' }
  const { res, html, ms } = r
  const body = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
  return {
    ok: res.ok,
    url: bare,
    finalUrl: res.url || null,
    status: res.status,
    https: (res.url || '').startsWith('https://'),
    ms,
    title: title ? decode(title) || null : null,
    description: meta(html, 'description') ?? meta(html, 'og:description'),
    h1: (html.match(/<h1[\s>]/gi) ?? []).length,
    viewport: /<meta[^>]+name=["']viewport["']/i.test(html),
    noindex: /noindex/i.test(meta(html, 'robots') ?? ''),
    lang: html.match(/<html[^>]+lang=["']([^"']+)["']/i)?.[1] ?? null,
    schemaTypes: schemaTypes(html),
    telLink: /href=["']tel:/i.test(html),
    words: body.split(/\s+/).filter(w => w.length > 1).length,
    social: socialLinks(html),
    error: res.ok ? undefined : `HTTP ${res.status}`,
  }
}

/** Quellen für den Kundenbereich: Website + gefundene Profile, immer alle fünf in fester Reihenfolge. */
export function sourcesFrom(website: string | null, scan: SiteScan | null): Source[] {
  return SOURCE_ORDER.map(key => {
    if (key === 'website') return { key, value: website ?? '', found: !!website }
    const v = scan?.social[key]
    return { key, value: v ?? '', found: !!v }
  })
}
