// POST { placeId } → Place  — Karte «Ist das Ihr Unternehmen?».
import { handler, json, placesKey } from '../_shared/http.ts'
import { placeRaw, toPlace } from '../_shared/google.ts'

Deno.serve(handler(30, async (req, body) => {
  const id = String(body.placeId ?? '').trim()
  if (!/^[A-Za-z0-9_-]{10,300}$/.test(id)) return json(req, { error: 'placeId' }, 400)
  return json(req, toPlace(await placeRaw(placesKey(), id)))
}, { human: true }))
