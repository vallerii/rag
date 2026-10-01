// HTTP-Helfer für die Edge Functions (Deno): CORS, erlaubte Domains, einfache Drossel.

const ALLOWED = (Deno.env.get('ALLOWED_ORIGINS') ?? '').split(',').map(s => s.trim()).filter(Boolean)

function allowOrigin(origin: string | null): string {
  if (!origin) return '*'
  if (!ALLOWED.length) return origin                             // nicht konfiguriert → alles erlauben (Test)
  if (ALLOWED.includes(origin)) return origin
  if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return origin  // lokale Entwicklung
  return ''
}

export function cors(req: Request): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': allowOrigin(req.headers.get('origin')) || 'null',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

export function json(req: Request, data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { ...cors(req), 'Content-Type': 'application/json' } })
}

// Sehr einfache Drossel pro IP und Instanz (schützt vor Skripten, ersetzt kein CAPTCHA).
const hits = new Map<string, number[]>()
function limited(req: Request, perMinute: number): boolean {
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown'
  const now = Date.now()
  const list = (hits.get(ip) ?? []).filter(t => now - t < 60_000)
  list.push(now)
  hits.set(ip, list)
  return list.length > perMinute
}

/** Gemeinsamer Rahmen: OPTIONS, nur POST, Domain-Prüfung, Drossel, Fehler als JSON. */
export function handler(perMinute: number, fn: (req: Request, body: Record<string, unknown>) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) })
    if (req.method !== 'POST') return json(req, { error: 'method' }, 405)
    if (req.headers.get('origin') && !allowOrigin(req.headers.get('origin'))) return json(req, { error: 'origin' }, 403)
    if (limited(req, perMinute)) return json(req, { error: 'rate' }, 429)
    try {
      const body = await req.json().catch(() => ({}))
      return await fn(req, body)
    } catch (e) {
      console.error(e)
      const status = (e as { status?: number }).status
      return json(req, { error: e instanceof Error ? e.message : 'error' }, status && status < 500 ? 502 : 500)
    }
  }
}

export function placesKey(): string {
  const key = Deno.env.get('GOOGLE_PLACES_KEY')
  if (!key) throw new Error('GOOGLE_PLACES_KEY fehlt (Supabase → Edge Functions → Secrets)')
  return key
}
