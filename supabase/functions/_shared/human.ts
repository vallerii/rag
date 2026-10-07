// Schutz der kostenpflichtigen Google-Abfragen vor Bots: Cloudflare Turnstile (unsichtbar).
//
// Ablauf: Der Browser löst einmal ein Turnstile-Token und schickt es als Header `x-turnstile`.
// Wir prüfen es bei Cloudflare und geben einen eigenen, signierten «Pass» zurück (Header `x-rag-pass`,
// 30 Minuten gültig). Weitere Anfragen derselben Sitzung schicken nur noch den Pass —
// so muss Turnstile nicht bei jedem Klick neu laufen (ein Turnstile-Token gilt nur einmal).
//
// Secrets (Supabase → Edge Functions → Secrets):
//   TURNSTILE_SECRET  — Secret Key aus Cloudflare → Turnstile
//   HUMAN_PASS_SECRET — beliebige lange Zufallszeichenkette (z. B. `openssl rand -hex 32`)
// Solange TURNSTILE_SECRET fehlt, ist die Prüfung aus (lokale Entwicklung, Demo).

const TURNSTILE_SECRET = Deno.env.get('TURNSTILE_SECRET') ?? ''
const PASS_SECRET = Deno.env.get('HUMAN_PASS_SECRET') ?? TURNSTILE_SECRET
const PASS_TTL_MS = 30 * 60_000

const enc = new TextEncoder()
let keyPromise: Promise<CryptoKey> | null = null
function hmacKey() {
  keyPromise ??= crypto.subtle.importKey('raw', enc.encode(PASS_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
  return keyPromise
}
const b64url = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

async function signPass(): Promise<string> {
  const exp = String(Date.now() + PASS_TTL_MS)
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(), enc.encode(exp))
  return `${exp}.${b64url(sig)}`
}

async function passValid(pass: string): Promise<boolean> {
  const [exp, sig] = pass.split('.')
  if (!exp || !sig || Number(exp) < Date.now()) return false
  const expected = b64url(await crypto.subtle.sign('HMAC', await hmacKey(), enc.encode(exp)))
  return expected.length === sig.length && expected === sig
}

async function turnstileValid(token: string, ip: string): Promise<boolean> {
  const form = new FormData()
  form.append('secret', TURNSTILE_SECRET)
  form.append('response', token)
  if (ip) form.append('remoteip', ip)
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form })
  const data = await res.json().catch(() => ({}))
  return data?.success === true
}

/**
 * Prüft, ob die Anfrage von einem Menschen kommt.
 * Ergebnis: `null` → abgelehnt; sonst Header, die an die Antwort gehängt werden (ggf. neuer Pass).
 */
export async function humanCheck(req: Request): Promise<Record<string, string> | null> {
  if (!TURNSTILE_SECRET) return {}
  const pass = req.headers.get('x-rag-pass') ?? ''
  if (pass && (await passValid(pass))) return {}
  const token = req.headers.get('x-turnstile') ?? ''
  if (!token) return null
  const ip = (req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim()
  if (!(await turnstileValid(token, ip))) return null
  return { 'x-rag-pass': await signPass() }
}
