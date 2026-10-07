// Cloudflare Turnstile — unsichtbarer Bot-Schutz (kein Bilderrätsel für echte Besucher).
// Eingesetzt für: Unternehmenssuche (Google-Abfragen kosten Geld), Registrierung, Login, Passwort vergessen.
//
// Einrichtung:
//   1. Cloudflare → Turnstile → Widget anlegen (Modus «Invisible» oder «Managed»), Domain eintragen.
//   2. Site Key  → Vercel: VITE_TURNSTILE_SITE_KEY
//   3. Secret Key → Supabase Edge Functions Secret TURNSTILE_SECRET
//                 → Supabase Auth → Attack Protection → CAPTCHA (Turnstile) mit demselben Secret
// Ohne VITE_TURNSTILE_SITE_KEY ist alles aus — die Seite funktioniert wie bisher.

const SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined)?.trim() || ''
export const TURNSTILE_ON = !!SITE_KEY

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string
  execute: (id: string) => void
  reset: (id: string) => void
}
declare global { interface Window { turnstile?: TurnstileApi } }

let scriptPromise: Promise<TurnstileApi> | null = null
function loadScript(): Promise<TurnstileApi> {
  scriptPromise ??= new Promise((resolve, reject) => {
    if (window.turnstile) return resolve(window.turnstile)
    const s = document.createElement('script')
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    s.async = true
    s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile')))
    s.onerror = () => { scriptPromise = null; reject(new Error('turnstile')) }
    document.head.appendChild(s)
  })
  return scriptPromise
}

let queue: Promise<unknown> = Promise.resolve()

/** Frisches, einmal gültiges Token. `null`, wenn Turnstile nicht eingerichtet ist. */
export function turnstileToken(): Promise<string | null> {
  if (!TURNSTILE_ON || typeof window === 'undefined') return Promise.resolve(null)
  // Nacheinander ausführen — ein Widget liefert immer nur ein Token gleichzeitig.
  const next = queue.then(async () => {
    const ts = await loadScript()
    const host = document.createElement('div')
    host.style.cssText = 'position:fixed;bottom:12px;right:12px;z-index:2147483646'
    document.body.appendChild(host)
    try {
      return await new Promise<string>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('turnstile timeout')), 30_000)
        ts.render(host, {
          sitekey: SITE_KEY,
          appearance: 'interaction-only', // nur sichtbar, wenn Cloudflare wirklich nachfragen muss
          language: document.documentElement.lang || 'de',
          callback: (t: string) => { clearTimeout(timer); resolve(t) },
          'error-callback': () => { clearTimeout(timer); reject(new Error('turnstile')) },
        })
      })
    } finally {
      host.remove()
    }
  })
  queue = next.catch(() => undefined)
  return next
}

// ── Pass für die Edge Functions ─────────────────────────────────────────────
const PASS_KEY = 'rag-human-pass'

/** Header für Anfragen an places-search / places-details / discover-sources. */
export async function humanHeaders(): Promise<Record<string, string>> {
  if (!TURNSTILE_ON) return {}
  try {
    const pass = sessionStorage.getItem(PASS_KEY)
    if (pass && Number(pass.split('.')[0]) > Date.now() + 30_000) return { 'x-rag-pass': pass }
  } catch { /* privat */ }
  const t = await turnstileToken().catch(() => null)
  return t ? { 'x-turnstile': t } : {}
}

/** Neuen Pass aus der Antwort merken. */
export function rememberPass(res: Response) {
  const pass = res.headers.get('x-rag-pass')
  if (!pass) return
  try { sessionStorage.setItem(PASS_KEY, pass) } catch { /* privat */ }
}

/** fetch an eine geschützte Edge Function — holt bei abgelaufenem Pass einmal ein neues Token. */
export async function humanFetch(url: string, init: RequestInit): Promise<Response> {
  const go = async () => {
    const res = await fetch(url, { ...init, headers: { ...(init.headers as Record<string, string>), ...(await humanHeaders()) } })
    rememberPass(res)
    return res
  }
  const res = await go()
  if (res.status === 403 && TURNSTILE_ON) {
    try { sessionStorage.removeItem(PASS_KEY) } catch { /* privat */ }
    return go()
  }
  return res
}
