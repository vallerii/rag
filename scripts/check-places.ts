// Lokaler Test der Check-Logik mit echtem Google-Schlüssel — ohne Deploy, ohne Supabase.
// Nutzt exakt denselben Code wie die Edge Functions (supabase/functions/_shared).
//
//   Windows (PowerShell):  $env:GOOGLE_PLACES_KEY="AIza..."; npm run check:places -- "Elektro Becker München"
//   macOS/Linux:           GOOGLE_PLACES_KEY=AIza... npm run check:places -- "Elektro Becker München"
//   Anderen Treffer wählen: ... -- "Elektro Becker" 2
//
// Ausgabe: Trefferliste, Karte, gefundene Profile, Wettbewerber, Website-Prüfung und der Berichtsentwurf.
// Alles komplett als JSON in .tmp-check.json.

import { writeFileSync } from 'node:fs'
import { competitors, placeRaw, searchPlaces, toPlace } from '../supabase/functions/_shared/google.ts'
import { scanSite, sourcesFrom } from '../supabase/functions/_shared/site.ts'
import { buildReport } from '../supabase/functions/_shared/audit.ts'

const key = process.env.GOOGLE_PLACES_KEY
const query = process.argv[2]
const pick = Math.max(1, Number(process.argv[3] ?? 1))
if (!key || !query) {
  console.error('Bitte GOOGLE_PLACES_KEY setzen und Suchtext angeben, z. B.:\n  npm run check:places -- "Elektro Becker München"')
  process.exit(1)
}

const h = (t: string) => console.log(`\n\x1b[1m── ${t} ${'─'.repeat(Math.max(0, 60 - t.length))}\x1b[0m`)
const icon = { ok: '\x1b[32m✓\x1b[0m', warn: '\x1b[33m!\x1b[0m', bad: '\x1b[31m✗\x1b[0m' }

try {
  h(`1. Treffer für «${query}»  (places-search)`)
  const hits = await searchPlaces(key, query)
  if (!hits.length) { console.log('Keine Treffer in DE/AT/CH.'); process.exit(0) }
  hits.forEach((x, i) => console.log(`${i + 1 === pick ? '→' : ' '} ${i + 1}. ${x.main}\n     ${x.secondary}`))

  const chosen = hits[Math.min(pick, hits.length) - 1]
  h('2. Karte «Ist das Ihr Unternehmen?»  (places-details)')
  const card = toPlace(await placeRaw(key, chosen.id))
  console.log(card)

  h('3. Website & Profile  (discover-sources)')
  const t0 = Date.now()
  const quick = card.website ? await scanSite(card.website, 3500) : null
  const sources = sourcesFrom(card.website, quick)
  sources.forEach(s => console.log(`  ${s.found ? icon.ok : icon.bad} ${s.key.padEnd(10)} ${s.value || '—'}`))
  console.log(`  (${Date.now() - t0} ms — der Client wartet höchstens 4000 ms)`)

  h('4. Analyse nach «Analyse starten»  (audit-collect)')
  const full = await placeRaw(key, chosen.id, true)
  const [comp, site] = await Promise.all([competitors(key, full), card.website ? scanSite(card.website) : Promise.resolve(null)])
  console.log(`  Fotos: ${(full.photos ?? []).length}${(full.photos ?? []).length >= 10 ? '+' : ''} · Öffnungszeiten: ${full.regularOpeningHours ? 'ja' : 'nein'} · Kategorien: ${(full.types ?? []).join(', ')}`)
  console.log(`  Wettbewerber «${comp.query}»: eigene Position ${comp.rank ?? 'nicht in Top ' + comp.list.length}`)
  comp.list.slice(0, 8).forEach((c, i) => console.log(`   ${String(i + 1).padStart(2)}. ${c.id === full.id ? '\x1b[1m' : ''}${c.name}\x1b[0m — ${c.rating ?? '–'} ★, ${c.reviews} Bew.${c.website ? '' : ', keine Website'}`))
  if (site) console.log(`  Website: ${site.finalUrl ?? site.url} · HTTP ${site.status ?? '–'} · ${site.ms ?? '–'} ms · Titel: ${site.title ?? '—'}`)

  h('5. Berichtsentwurf  (checks.report_draft)')
  const report = buildReport({ place: full, competitors: comp, site, sources })
  for (const [k, ch] of Object.entries(report.channels)) {
    if (!ch) continue
    console.log(`\n  ${k.toUpperCase()}  ${ch.score}/100 — ${ch.summary}`)
    ch.points.forEach(([m, t]) => console.log(`    ${icon[m]} ${t}`))
  }
  console.log('\n  Empfehlungen:')
  report.recommendations.forEach(([p, t, d]) => console.log(`    • [${p}] ${t} — ${d}`))

  writeFileSync('.tmp-check.json', JSON.stringify({ hits, card, sources, audit: { place: full, competitors: comp, site }, report }, null, 2))
  console.log('\nAlle Rohdaten: .tmp-check.json')
} catch (e) {
  const msg = e instanceof Error ? e.message : String(e)
  console.error('\n\x1b[31mFehler:\x1b[0m', msg)
  if (/not been used|disabled/i.test(msg)) console.error('→ In Google Cloud «Places API (New)» für das Projekt dieses Schlüssels aktivieren.')
  if (/API key not valid/i.test(msg)) console.error('→ Schlüssel ist ungültig oder unvollständig kopiert.')
  if (/referer|referrer|blocked/i.test(msg)) console.error('→ Schlüssel ist eingeschränkt. Für Server-Aufrufe: Einschränkung «Keine» oder «IP-Adressen», API-Liste mit «Places API (New)».')
  if (/billing/i.test(msg)) console.error('→ Im Google-Cloud-Projekt ist keine Abrechnung aktiviert.')
  process.exit(1)
}
