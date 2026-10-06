// ─────────────────────────────────────────────────────────────────────────────
// I18N — DE / RU language switch without separate URLs.
//
// The site copy lives in German inside App.tsx. When the visitor picks
// Russian, a MutationObserver swaps every German text node and a few
// attributes (placeholder, aria-label, title, alt) for its entry in ru.json.
// React keeps working with the German source, so logic that compares labels
// is untouched, and new German copy simply stays German until it is added to
// ru.json (key = German text with collapsed whitespace, value = Russian).
//
// The choice is stored in localStorage; ?lang=ru / ?lang=de sets it too.
// ─────────────────────────────────────────────────────────────────────────────
export type Lang = 'de' | 'ru'
const STORAGE_KEY = 'rag-lang'

export function getLang(): Lang {
  if (typeof window === 'undefined') return 'de'
  try {
    const q = new URLSearchParams(window.location.search).get('lang')
    if (q === 'ru' || q === 'de') {
      localStorage.setItem(STORAGE_KEY, q)
      return q
    }
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'ru' || v === 'de') return v
  } catch {
    /* storage blocked — fall back to German */
  }
  return 'de'
}

export function setLang(lang: Lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    /* ignore */
  }
  // Drop a ?lang= override so the stored choice wins, then re-render cleanly.
  const url = new URL(window.location.href)
  url.searchParams.delete('lang')
  window.location.replace(url.toString())
}

/** Date locale for Intl formatting (booking calendar etc.). */
export function dateLocale(): string {
  return getLang() === 'ru' ? 'ru-RU' : 'de-DE'
}

// ── translator ───────────────────────────────────────────────────────────────
let dict = new Map<string, string>()

const norm = (s: string) => s.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim()

// Admin (/rag-intern): Quelltext ist Russisch, Deutsch ist die Übersetzung (admin-de.json).
// Dort werden auch zusammengesetzte Texte übersetzt: bekannte Teile werden ersetzt (längste zuerst).
let adminMode = false
let partsRe: RegExp | null = null
const CYR = /[А-Яа-яЁё]/
const SRC_LETTERS = () => (adminMode ? CYR : /[A-Za-zÄÖÜäöüß]/)
export const isAdminPath = () => typeof window !== 'undefined' && window.location.pathname.startsWith('/rag-intern')

function lookup(key: string): string | undefined {
  const direct = dict.get(key)
  if (direct !== undefined) return direct
  if (adminMode && partsRe) {
    const out = key
      .replace(/клиент на (\d+) месте/g, 'Kunde auf Platz $1')
      .replace(/(\d+) место/g, 'Platz $1')
      .replace(/нет в топ-(\d+)/g, 'nicht in den Top $1')
      .replace(partsRe, m => dict.get(m) ?? m)
    return out !== key ? out : undefined
  }
  for (const [re, fn] of patterns) {
    const m = key.match(re)
    if (m) {
      const out = fn(m)
      if (out !== undefined) return out
    }
  }
  return undefined
}

// Strings assembled at runtime from template literals.
const patterns: [RegExp, (m: RegExpMatchArray) => string | undefined][] = [
  [/^(.+) — einfach erklärt \| RAG Glossar$/, m => { const t = dict.get(m[1]); return t === undefined ? undefined : `${t} — простыми словами | RAG Глоссарий` }],
  [/^(.+) \| RAG Ratgeber$/, m => { const t = dict.get(m[1]); return t === undefined ? undefined : `${t} | RAG Гид` }],
  [/^(.+) \| RAG$/, m => { const t = dict.get(m[1]); return t === undefined ? undefined : `${t} | RAG` }],
  [/^(\d+) Minuten Lesezeit$/, m => `${m[1]} мин. чтения`],
  [/^Fallstudie (\d+)$/, m => `Кейс ${m[1]}`],
]

function translateString(s: string): string | undefined {
  const key = norm(s)
  if (!key || !SRC_LETTERS().test(key)) return undefined
  const t = lookup(key)
  if (t === undefined) return undefined
  const lead = s.match(/^\s*/)![0]
  const trail = s.match(/\s*$/)![0]
  return lead + t + trail
}

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE'])
const ATTRS = ['placeholder', 'aria-label', 'title', 'alt']

function doText(node: Text) {
  const parent = node.parentElement
  if (parent && SKIP_TAGS.has(parent.tagName)) return
  if (parent?.closest('[data-no-translate]')) return
  // "{count} Bewertungen" renders as two text nodes; Russian needs another
  // case after a number, so ru.json may hold a "#n <key>" variant for that.
  const prev = node.previousSibling
  if (prev && prev.nodeType === Node.TEXT_NODE && /\d\s*$/.test(prev.textContent || '')) {
    const v = dict.get('#n ' + norm(node.data))
    if (v !== undefined) {
      const t = node.data.match(/^\s*/)![0] + v + node.data.match(/\s*$/)![0]
      if (t !== node.data) node.data = t
      return
    }
  }
  const t = translateString(node.data)
  if (t !== undefined && t !== node.data) node.data = t
}

function doAttr(el: Element, name: string) {
  const v = el.getAttribute(name)
  if (!v) return
  const t = translateString(v)
  if (t !== undefined && t !== v) el.setAttribute(name, t)
}

function walk(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) return doText(root as Text)
  if (root.nodeType !== Node.ELEMENT_NODE) return
  const el = root as Element
  if (SKIP_TAGS.has(el.tagName)) return
  for (const a of ATTRS) doAttr(el, a)
  const tw = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: n =>
      n.nodeType === Node.ELEMENT_NODE && SKIP_TAGS.has((n as Element).tagName)
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT,
  })
  let n: Node | null
  while ((n = tw.nextNode())) {
    if (n.nodeType === Node.TEXT_NODE) doText(n as Text)
    else for (const a of ATTRS) doAttr(n as Element, a)
  }
}

/**
 * Call once and render React after the promise resolves. German: resolves
 * immediately. Russian: loads ru.json as a separate chunk first, so German
 * visitors don't download it and Russian visitors never see a German flash.
 */
export async function startTranslator(): Promise<void> {
  if (typeof window === 'undefined') return
  // Admin: Standard Deutsch (Übersetzung aus dem Russischen), RU = Original für die Testphase.
  adminMode = isAdminPath()
  const target = adminMode ? (getLang() === 'ru' ? null : 'de') : (getLang() === 'ru' ? 'ru' : null)
  if (!target) return
  try {
    const mod = adminMode ? await import('./admin-de.json') : await import('./ru.json')
    dict = new Map(Object.entries(mod.default as Record<string, string>))
  } catch {
    return // chunk failed to load — show the original
  }
  if (adminMode) {
    const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const keys = [...dict.keys()].filter(k => CYR.test(k) && k.length >= 2).sort((a, b) => b.length - a.length)
    partsRe = new RegExp(`(?<![А-Яа-яЁё])(?:${keys.map(esc).join('|')})(?![А-Яа-яЁё])`, 'g')
  }
  const html = document.documentElement
  const lang = target
  html.lang = lang
  const observer = new MutationObserver(muts => {
    for (const m of muts) {
      if (m.type === 'characterData') doText(m.target as Text)
      else if (m.type === 'attributes') {
        if (m.attributeName === 'lang') {
          if (m.target === html && html.lang !== lang) html.lang = lang
        } else if (m.attributeName) doAttr(m.target as Element, m.attributeName)
      } else m.addedNodes.forEach(walk)
    }
  })
  observer.observe(html, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: [...ATTRS, 'lang'],
  })
  walk(html)
}
