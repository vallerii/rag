// POST { query } → Suggestion[]  — Trefferliste für /check («Mein Unternehmen finden»).
import { handler, json, placesKey } from '../_shared/http.ts'
import { searchPlaces } from '../_shared/google.ts'

Deno.serve(handler(20, async (req, body) => {
  const query = String(body.query ?? body.input ?? '').trim().slice(0, 120)
  if (query.length < 2) return json(req, [])
  return json(req, await searchPlaces(placesKey(), query))
}))
