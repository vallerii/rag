// Google Sheets: чтение вкладок таблиц лидов сервисным аккаунтом (только чтение), как в Lead CRM (lib/sheets.js).
// Секрет GOOGLE_SERVICE_ACCOUNT_JSON — тот же JSON, что у CRM; таблицы уже расшарены на этот аккаунт.
// Чистый TypeScript (fetch + WebCrypto): работает в Edge Functions и в тестах под Node.

export type ServiceAccount = { client_email: string; private_key: string }
export type Tab = { title: string; tabTitle: string; headers: string[]; rows: { n: number; data: Record<string, string> }[] }

export class SheetError extends Error {
  code: 'config' | 'access' | 'not_found' | 'google'
  constructor(message: string, code: SheetError['code']) { super(message); this.code = code }
}

export function parseServiceAccount(json: string | undefined | null): ServiceAccount {
  let c: Record<string, unknown>
  try { c = JSON.parse(json ?? '') } catch { throw new SheetError('GOOGLE_SERVICE_ACCOUNT_JSON fehlt oder ist kein JSON', 'config') }
  if (c.type !== 'service_account' || typeof c.client_email !== 'string' || typeof c.private_key !== 'string') {
    throw new SheetError('GOOGLE_SERVICE_ACCOUNT_JSON ist kein Dienstkonto', 'config')
  }
  return { client_email: c.client_email, private_key: c.private_key }
}

/** Ссылка на вкладку → id таблицы + gid вкладки. Ссылка без gid не принимается (нужна конкретная вкладка). */
export function parseSheetUrl(input: string): { spreadsheetId: string; gid: number } {
  let url: URL
  try { url = new URL(input.trim()) } catch { throw new SheetError('Das ist kein Link', 'not_found') }
  const m = /^\/spreadsheets\/d\/([A-Za-z0-9_-]{20,100})(?:\/|$)/.exec(url.pathname)
  if (url.protocol !== 'https:' || url.hostname !== 'docs.google.com' || !m) throw new SheetError('Nur Links auf Google-Tabellen (docs.google.com/spreadsheets/…)', 'not_found')
  const gid = url.searchParams.get('gid') ?? new URLSearchParams(url.hash.replace(/^#/, '')).get('gid')
  if (!gid || !/^\d+$/.test(gid)) throw new SheetError('Der Link muss auf eine bestimmte Registerkarte zeigen (…#gid=…)', 'not_found')
  return { spreadsheetId: m[1], gid: Number(gid) }
}

const b64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const b64urlText = (s: string) => b64url(new TextEncoder().encode(s))

async function signJwt(sa: ServiceAccount, now: number): Promise<string> {
  const pem = sa.private_key.replace(/-----[^-]+-----/g, '').replace(/\\n|\s/g, '')
  const der = Uint8Array.from(atob(pem), c => c.charCodeAt(0))
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'])
  const iat = Math.floor(now / 1000)
  const unsigned = b64urlText(JSON.stringify({ alg: 'RS256', typ: 'JWT' })) + '.' + b64urlText(JSON.stringify({
    iss: sa.client_email, scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    aud: 'https://oauth2.googleapis.com/token', iat, exp: iat + 3500,
  }))
  const sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned)))
  return unsigned + '.' + b64url(sig)
}

let cached: { email: string; token: string; until: number } | null = null
export async function accessToken(sa: ServiceAccount, fetchFn: typeof fetch = fetch, now = Date.now()): Promise<string> {
  if (cached && cached.email === sa.client_email && cached.until > now + 60_000) return cached.token
  const res = await fetchFn('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: await signJwt(sa, now) }),
  })
  const j = await res.json().catch(() => ({})) as { access_token?: string; expires_in?: number }
  if (!res.ok || !j.access_token) throw new SheetError(`Google-Anmeldung des Dienstkontos fehlgeschlagen (HTTP ${res.status})`, 'config')
  cached = { email: sa.client_email, token: j.access_token, until: now + (j.expires_in ?? 3500) * 1000 }
  return j.access_token
}

async function getJson(fetchFn: typeof fetch, url: string, token: string, email: string) {
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 20_000)
  try {
    const res = await fetchFn(url, { headers: { Authorization: `Bearer ${token}` }, signal: ctrl.signal })
    if (res.status === 403 || res.status === 404) throw new SheetError(`Kein Zugriff: Tabelle für ${email} freigeben (Betrachter)`, 'access')
    if (!res.ok) throw new SheetError(`Google Sheets antwortet nicht (HTTP ${res.status})`, 'google')
    return await res.json()
  } catch (e) {
    if (e instanceof SheetError) throw e
    throw new SheetError('Google Sheets antwortet nicht', 'google')
  } finally { clearTimeout(t) }
}

/** Вкладка целиком: заголовки из первой строки, строки с номером строки в таблице (n = 2, 3, …). */
export async function readTab(sa: ServiceAccount, spreadsheetId: string, gid: number, fetchFn: typeof fetch = fetch): Promise<Tab> {
  const token = await accessToken(sa, fetchFn)
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}`
  const meta = await getJson(fetchFn, `${base}?fields=properties.title,sheets(properties(sheetId,title))`, token, sa.client_email) as
    { properties?: { title?: string }; sheets?: { properties?: { sheetId?: number; title?: string } }[] }
  const tab = meta.sheets?.find(s => s.properties?.sheetId === gid)?.properties
  if (!tab?.title) throw new SheetError('Diese Registerkarte (gid) gibt es in der Tabelle nicht', 'not_found')
  const range = `'${tab.title.replaceAll("'", "''")}'!A1:ZZ10001`
  const data = await getJson(fetchFn, `${base}/values/${encodeURIComponent(range)}?valueRenderOption=FORMATTED_VALUE`, token, sa.client_email) as { values?: string[][] }
  const lines = data.values ?? []
  const used = new Set<string>()
  const headers = (lines[0] ?? []).map((h, i) => {
    let name = String(h ?? '').trim() || `Spalte ${i + 1}`
    for (let k = 2; used.has(name); k++) name = `${String(h).trim() || `Spalte ${i + 1}`} (${k})`
    used.add(name); return name
  })
  const rows = lines.slice(1)
    .map((line, i) => ({ n: i + 2, data: Object.fromEntries(headers.map((h, j) => [h, String(line[j] ?? '')])) }))
    .filter(r => Object.values(r.data).some(v => v.trim()))
  return { title: meta.properties?.title ?? '', tabTitle: tab.title, headers, rows }
}
