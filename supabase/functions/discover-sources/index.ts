// POST { website } → Source[]  — liest die Website und sucht Links zu Instagram, Facebook, LinkedIn, TikTok.
import { handler, json } from '../_shared/http.ts'
import { scanSite, sourcesFrom } from '../_shared/site.ts'

Deno.serve(handler(20, async (req, body) => {
  const website = typeof body.website === 'string' && body.website.trim() ? body.website.trim().slice(0, 300) : null
  if (!website) return json(req, sourcesFrom(null, null))
  const scan = await scanSite(website, 3500) // der Client wartet höchstens 4 s
  return json(req, sourcesFrom(website, scan))
}))
