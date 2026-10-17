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
const missing = new Set<string>()

const norm = (s: string) => s.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim()

// Admin (/rag-intern): Quelltext ist Deutsch wie auf der ganzen Website. Russisch (admin-ru.json)
// ist nur eine Übersetzung für das Team während der Entwicklung und wird vor dem Release entfernt.
// Dort werden auch zusammengesetzte Texte übersetzt: bekannte Teile werden ersetzt (längste zuerst).
let adminMode = false
let partsRe: RegExp | null = null
const SRC_LETTERS = () => /[A-Za-zÄÖÜäöüß]/
/** Für Texte außerhalb des DOM (confirm/alert): übersetzt, wenn Russisch aktiv ist. */
export function tr(s: string): string { return (dict.size && translateString(s)) || s }
export const isAdminPath = () => typeof window !== 'undefined' && window.location.pathname.startsWith('/rag-intern')

// Admin: Texte des Prüfberichts mit Zahlen/Suchbegriffen (supabase/functions/_shared/audit.ts, admin/checklist.ts).
const PS = ' — auf dem Smartphone spürbar langsam', VS = ' — sehr langsam, Besucher springen ab'
const adminPatterns: [RegExp, (m: RegExpMatchArray, t: (x: string) => string) => string][] = [
  [/^Bei «(.+)» zeigt Google (\d+) andere Betriebe — Sie nicht$/, m => `По запросу «${m[1]}» Google показывает ${m[2]} других компаний — вас нет`],
  [/^Bei «(.+)» unter den ersten 3 \(Platz (\d+)\)$/, m => `По запросу «${m[1]}» — в топ-3 (${m[2]} место)`],
  [/^Bei «(.+)» auf Platz (\d+) — die ersten 3 bekommen die meisten Anrufe$/, m => `По запросу «${m[1]}» — ${m[2]} место, а больше всего звонков получают первые 3`],
  [/^Bei «(.+)» auf Platz (\d+)$/, m => `По запросу «${m[1]}» — ${m[2]} место`],
  [/^Bei «(.+)» erst auf Platz (\d+)$/, m => `По запросу «${m[1]}» — только ${m[2]} место`],
  [/^Bei «(.+)» nicht unter den ersten (\d+) Treffern$/, m => `По запросу «${m[1]}» — нет в первых ${m[2]} результатах`],
  [/^Sehr gute Bewertung: (.+) ★$/, m => `Очень высокий рейтинг: ${m[1]} ★`],
  [/^Gute Bewertung: (.+) ★$/, m => `Хороший рейтинг: ${m[1]} ★`],
  [/^Bewertung (.+) ★ — unter dem, was Kunden bei der Auswahl erwarten$/, m => `Рейтинг ${m[1]} ★ — ниже, чем ожидают клиенты при выборе`],
  [/^Niedrige Bewertung: (.+) ★$/, m => `Низкий рейтинг: ${m[1]} ★`],
  [/^(\d+) Bewertungen — mehr als die meisten Wettbewerber \(Median (\d+)\)$/, m => `${m[1]} отзывов — больше, чем у большинства конкурентов (медиана ${m[2]})`],
  [/^(?:Nur )?(\d+) Bewertungen — Wettbewerber in der Nähe haben im Schnitt (\d+)$/, m => `${m[0].startsWith('Nur') ? 'Всего ' : ''}${m[1]} отзывов — у конкурентов рядом в среднем ${m[2]}`],
  [/^Erst (\d+) Bewertungen$/, m => `Пока только ${m[1]} отзывов`],
  [/^(\d+) Bewertungen$/, m => `${m[1]} отзывов`],
  [/^Nur (\d+) Fotos im Profil$/, m => `Всего ${m[1]} фото в профиле`],
  [/^Die Website antwortet mit einem Fehler \(HTTP (\d+)\)$/, m => `Сайт отвечает ошибкой (HTTP ${m[1]})`],
  [/^Sitemap für Google vorhanden \((\d+) Seiten\)$/, m => `Sitemap для Google есть (${m[1]} страниц)`],
  [/^Mehrere Unterseiten \((\d+)\) — Platz für einzelne Leistungen$/, m => `Несколько подстраниц (${m[1]}) — есть место для отдельных услуг`],
  [/^Nur (\d+) Unterseiten — eigene Seiten je Leistung fehlen$/, m => `Всего ${m[1]} подстраниц — нет отдельных страниц под услуги`],
  [/^Google PageSpeed \(mobil\): (\d+)\/100(.*)$/, m => `Google PageSpeed (мобильный): ${m[1]}/100${m[2] === PS ? ' — на смартфоне заметно медленно' : m[2] === VS ? ' — очень медленно, посетители уходят' : m[2]}`],
  [/^Angaben auf der Website weichen von Google ab \((.+)\) — verwirrt Google und KI$/, (m, t) => `Данные на сайте расходятся с Google (${m[1].split(', ').map(t).join(', ')}) — это путает Google и ИИ`],
  [/^Profile gefunden: (.+)$/, m => `Найдены профили: ${m[1]}`],
  [/^Nur ein Profil gefunden: (.+)$/, m => `Найден только один профиль: ${m[1]}`],
  [/^In (\d+) von (\d+) Antworten von ChatGPT, Perplexity und Gemini genannt$/, m => `Назван в ${m[1]} из ${m[2]} ответов ChatGPT, Perplexity и Gemini`],
  [/^In (\d+) von (\d+) wichtigen Verzeichnissen eingetragen(?:, davon (\d+) mit abweichenden Daten)?$/, m => `Есть в ${m[1]} из ${m[2]} важных каталогов${m[3] ? `, из них в ${m[3]} с расхождениями в данных` : ''}`],
  [/^2FA konnte nicht eingerichtet werden \((.+)\)\.$/, m => `Не удалось включить 2FA (${m[1]}).`],
  [/^Zugang sperren für (.+)\?$/, m => `Закрыть доступ для ${m[1]}?`],
  [/^Neu geladen: (\d+) \(aus (\d+) Zeilen, Dubletten übersprungen\)\.$/, m => `Загружено новых: ${m[1]} (из ${m[2]} строк, повторы пропущены).`],
  [/^Keine neuen Unternehmen \((\d+) Zeilen, alle schon vorhanden\)\.$/, m => `Новых компаний нет (${m[1]} строк, все уже есть).`],
  [/^Briefe vorbereitet: (\d+)\. Nach dem Drucken «Als gedruckt markieren»\.$/, m => `Писем подготовлено: ${m[1]}. После печати нажмите «Отметить напечатанными».`],
  [/^Kunde hat ein anderes Paket gewählt \((.*)\): (.*)$/, m => `Клиент выбрал другой пакет (${m[1]}): ${m[2]}`],
  [/^Geprüft: (\d+)(.*)$/, m => `Проверено: ${m[1]}${m[2].replace('Fehler:', 'ошибок:').replace('Dubletten ausgeblendet:', 'повторы скрыты:').replace('angehalten', 'остановлено').replace('schon Kunden (Anfrage vorhanden):', 'уже клиенты (есть заявка):').replace('bei Google nicht gefunden:', 'не найдены в Google:')}`],
  [/^Briefe drucken \((\d+)\)$/, m => `Печать писем (${m[1]})`],
  [/^Ausgewählt: (\d+)$/, m => `Выбрано: ${m[1]}`],
  [/^Rechnung (.*) für den Kunden freigegeben(?: \((.+) €\))?$/, m => `Счёт ${m[1]} открыт клиенту${m[2] ? ` (${m[2]} €)` : ''}`],
]

function lookup(key: string): string | undefined {
  const direct = dict.get(key)
  if (direct !== undefined) return direct
  if (adminMode) {
    for (const [re, fn] of adminPatterns) {
      const m = key.match(re)
      if (m) return fn(m, x => lookup(x) ?? x)
    }
  }
  if (adminMode && partsRe) {
    const out = key
      .replace(/Kunde auf Platz (\d+)/g, 'клиент на $1 месте')
      .replace(/nicht in den Top (\d+)/g, 'нет в топ-$1')
      .replace(/Platz (\d+)/g, '$1 место')
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
  // Entwicklung: fehlende Übersetzungen im Admin in der Konsole melden (einmal pro Text).
  if (adminMode && import.meta.env.DEV && /[a-zäöüß]{3,}/.test(t ?? key) && /\b(der|die|das|und|nicht|mit|für|ist|Sie|Ihr|keine?|auf|im|zu)\b/.test(t ?? key) && !missing.has(key)) {
    missing.add(key); console.warn('[admin-ru] fehlende Übersetzung:', key)
  }
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
  if (el.tagName === 'TEXTAREA') doAttr(el, 'placeholder') // Inhalt nicht anfassen, Platzhalter schon
  if (SKIP_TAGS.has(el.tagName)) return
  for (const a of ATTRS) doAttr(el, a)
  const tw = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: n =>
      n.nodeType === Node.ELEMENT_NODE && SKIP_TAGS.has((n as Element).tagName)
        ? ((n as Element).tagName === 'TEXTAREA' && doAttr(n as Element, 'placeholder'), NodeFilter.FILTER_REJECT)
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
  // Überall Deutsch als Original; Russisch nur auf Wunsch (Umschalter) für das Team in der Entwicklung.
  adminMode = isAdminPath()
  const target = getLang() === 'ru' ? 'ru' : null
  if (!target) return
  try {
    const mod = adminMode ? await import('./admin-ru.json') : await import('./ru.json')
    dict = new Map(Object.entries(mod.default as Record<string, string>))
  } catch {
    return // chunk failed to load — show the original
  }
  if (adminMode) {
    const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const keys = [...dict.keys()].filter(k => k.length >= 2).sort((a, b) => b.length - a.length)
    partsRe = new RegExp(`(?<![A-Za-zÄÖÜäöüß])(?:${keys.map(esc).join('|')})(?![A-Za-zÄÖÜäöüß])`, 'g')
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
