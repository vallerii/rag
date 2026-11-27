// POST { cid }  (ohne Anmeldung, mit Bot-Schutz wie die Firmensuche) — QR-Code aus dem Brief der Lead-CRM: /check?cid=…&ref=…
// Sucht die Zeile der Firma (Google-Kartennummer) in den Lead-Tabellen und gibt NUR zurück, was die Seite vor der
// Registrierung braucht: Name, Ort, Datum der Analyse und die Google Place ID (für die Firmenkarte).
// Keine Befunde, keine Kontakte, keine Notizen — die sieht der Kunde erst nach der Registrierung im Kundenbereich.
// Keine Zeile mit Analyse → { found: false }: die Seite zeigt dann die normale Firmensuche.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { handler, json, placesKey } from '../_shared/http.ts'
import { placeIdByCid } from '../_shared/google.ts'
import { bestMatch, column } from '../_shared/leadkey.ts'
import { sheetRows } from '../_shared/lookup.ts'

const SERVER_KEY = Deno.env.get('SB_SECRET_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const db = createClient(Deno.env.get('SUPABASE_URL')!, SERVER_KEY, { auth: { persistSession: false } })

Deno.serve(handler(20, async (req, body) => {
  const cid = String(body.cid ?? '').trim().replace(/^0+/, '')
  if (!/^\d{5,25}$/.test(cid)) return json(req, { error: 'cid' }, 400)

  const { list, where, errors } = await sheetRows(db, Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON'))
  const { best } = bestMatch([`cid:${cid}`], list)
  if (!best?.analysed) return json(req, { found: false, retry: errors.length > 0 })

  const { tab } = where.get(best.ref)!
  const v = (k: Parameters<typeof column>[1]) => { const c = column(tab.headers, k); return c ? (best.row[c] ?? '').trim() : '' }
  const name = v('name')
  const address = v('address')
  const cityCol = tab.headers.find(h => /^(?:location|stadt|ort|city|город)$/i.test(h.trim()))
  const city = (cityCol ? best.row[cityCol]?.trim() : '') || /\b\d{5}\s+([^,]+)/.exec(address)?.[1]?.trim() || ''
  // Google Place ID für die Firmenkarte; fehlt sie, sucht die Seite die Firma ganz normal.
  const placeId = await placeIdByCid(placesKey(), cid, [name, address || city].filter(Boolean).join(' ')).catch(e => { console.error('placeIdByCid', e); return null })
  return json(req, { found: true, name, city, date: best.date, placeId })
}, { human: true }))
