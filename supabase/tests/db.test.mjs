// Datenbank-Tests: schema.sql + admin.sql + project.sql + flow.sql + addendum.sql + analysis.sql (+ mfa.sql) in einem echten Postgres (PGlite, im Prozess).
// Prüft Rechte (RLS), Trennung mehrerer Unternehmen eines Kunden, automatische Statuswechsel, Projektablauf.
// Start: npm run test:db
import { PGlite } from '@electric-sql/pglite'
import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'

const dir = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..')
const sql = f => fs.readFileSync(path.join(dir, f), 'utf8').replace(/notify pgrst[^;]*;/g, '')

const db = new PGlite()
const A = '00000000-0000-0000-0000-00000000000a' // Kunde A (zwei Unternehmen)
const B = '00000000-0000-0000-0000-00000000000b' // Kunde B
const ADM = '00000000-0000-0000-0000-0000000000ad' // Admin
const MGR = '00000000-0000-0000-0000-0000000000ae' // Manager

async function as(uid, aal = 'aal2') {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid ?? ''}', false);
    select set_config('request.jwt.claims', '{"aal":"${aal}"}', false); ${uid ? 'set role authenticated;' : ''}`)
}
const rows = async (q, ...p) => (await db.query(q, p)).rows
const one = async (q, ...p) => (await rows(q, ...p))[0]
async function fails(q, re, ...p) {
  try { await db.query(q, p) } catch (e) { if (re) assert.match(e.message, re); return }
  assert.fail(`erwarteter Fehler blieb aus: ${q}`)
}
async function stages() {
  await as(null)
  return Object.fromEntries((await rows(`select place->>'name' n, stage from checks`)).map(r => [r.n, r.stage]))
}

let passed = 0, failed = 0
async function test(name, fn) {
  try { await fn(); passed++; console.log('  ✓', name) }
  catch (e) { failed++; console.log('  ✗', name, '\n     ', e.message) }
}

// ── Aufbau ────────────────────────────────────────────────────────────────────
await db.exec(`
create role anon nologin; create role authenticated nologin; create role service_role nologin;
grant usage on schema public to anon, authenticated, service_role;
create schema auth; grant usage on schema auth to anon, authenticated, service_role;
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;`)
await db.exec(sql('schema.sql'))
await db.exec(sql('admin.sql'))
await db.exec(sql('project.sql'))
await db.exec(sql('project.sql')) // zweimal: muss wiederholbar sein
await db.exec('create publication supabase_realtime')
await db.exec(sql('flow.sql'))
await db.exec(sql('addendum.sql'))
await db.exec(sql('addendum.sql')) // wiederholbar
await db.exec(`
insert into auth.users (id, email) values ('${A}','a@test.de'), ('${B}','b@test.de'), ('${ADM}','admin@test.de'), ('${MGR}','mgr@test.de');
insert into profiles (id, email) values ('${A}','a@test.de'), ('${B}','b@test.de'), ('${ADM}','admin@test.de'), ('${MGR}','mgr@test.de') on conflict do nothing;
update profiles set role = 'admin' where id = '${ADM}'; update profiles set role = 'manager' where id = '${MGR}';`)

// Kunde A: zwei Unternehmen + Paket-Anfrage; Kunde B: ein Unternehmen
await as(A)
const a1 = (await one(`insert into checks (place) values ('{"name":"A-Eins"}') returning id`)).id
const a2 = (await one(`insert into checks (place) values ('{"name":"A-Zwei"}') returning id`)).id
const ao = (await one(`insert into orders (items) values ('[{"id":"x","name":"Local Website","price":299,"unit":"pro Monat"}]') returning id`)).id
await as(B)
const b1 = (await one(`insert into checks (place) values ('{"name":"B-Eins"}') returning id`)).id

console.log('\nRechte')
await test('Kunde sieht nur eigene Unternehmen', async () => {
  await as(B)
  assert.deepEqual((await rows(`select id from checks`)).map(r => r.id), [b1])
})
await test('Kunde kann Status, Bericht und Checkliste nicht ändern', async () => {
  await as(A)
  await fails(`update checks set stage = 'won' where id = $1`, /not allowed/, a1)
  await fails(`update checks set report = '{}'::jsonb where id = $1`, /not allowed/, a1)
  await fails(`update checks set checklist = '{"x":1}'::jsonb where id = $1`, /not allowed/, a1)
})
await test('Kunde kann keine Angebote oder Projekte anlegen/ändern', async () => {
  await as(A)
  await fails(`insert into offers (client_key, user_id, request_kind, request_id, status) values ('user:${A}', '${A}', 'check', '${a1}', 'sent')`)
  await fails(`insert into projects (client_key, user_id) values ('user:${A}', '${A}')`)
})
await test('Manager darf keine Mitarbeiter einladen (nur Admin)', async () => {
  await as(MGR)
  await fails(`select create_staff_invite('neu@test.de', 'manager')`, /not_admin/)
})

console.log('\nBericht und Angebot je Unternehmen')
await test('Bericht veröffentlicht → nur dieses Unternehmen «Bericht gesendet»', async () => {
  await as(ADM)
  await db.query(`update checks set status = 'ready', report = '{"channels":{"maps":{"score":40}}}'::jsonb where id = $1`, [a1])
  const s = await stages()
  assert.equal(s['A-Eins'], 'report_sent'); assert.equal(s['A-Zwei'], 'new'); assert.equal(s['B-Eins'], 'new')
})
await test('Angebot-Entwurf ist für den Kunden unsichtbar', async () => {
  await as(ADM)
  await db.query(`insert into offers (client_key, user_id, request_kind, request_id, items, status) values ('user:${A}', $1, 'check', $2, '[]', 'draft')`, [A, a1])
  await as(A)
  assert.equal((await rows(`select id from offers`)).length, 0)
  const s = await stages(); assert.equal(s['A-Eins'], 'report_sent')
})
let offer1
await test('Angebot gesendet → nur dieses Unternehmen «Angebot gesendet»', async () => {
  await as(ADM)
  offer1 = (await one(`update offers set status = 'sent', sent_at = now() where request_id = $1 returning id`, a1)).id
  const s = await stages()
  assert.equal(s['A-Eins'], 'offer_sent'); assert.equal(s['A-Zwei'], 'new')
})
await test('Kunde B kann das Angebot von A weder sehen noch annehmen', async () => {
  await as(B)
  assert.equal((await rows(`select id from offers`)).length, 0)
  await fails(`select accept_offer($1)`, /not_found/, offer1)
})
await test('Annahme → nur dieses Unternehmen «Kunde» + ein Projekt', async () => {
  await as(A)
  await db.query(`select accept_offer($1)`, [offer1])
  const s = await stages()
  assert.equal(s['A-Eins'], 'won'); assert.equal(s['A-Zwei'], 'new')
  const p = await rows(`select request_id, status from projects`)
  assert.equal(p.length, 1); assert.equal(p[0].request_id, a1); assert.equal(p[0].status, 'awaiting_payment')
})
await test('Zweite Annahme desselben Angebots geht nicht', async () => {
  await as(A)
  await fails(`select accept_offer($1)`, /not_found/, offer1)
})
await test('Angenommenes Angebot kann das Team nicht mehr ändern', async () => {
  await as(ADM)
  await fails(`update offers set status = 'draft' where request_id = $1`, /offer_accepted_locked/, a1)
  await fails(`update offers set items = '[{"id":"x","price":1}]' where request_id = $1`, /offer_accepted_locked/, a1)
})
await test('Kunde liest sein Projekt, kann es aber nicht ändern', async () => {
  await as(A)
  assert.equal((await rows(`select id from projects`)).length, 1)
  await db.query(`update projects set status = 'done'`) // RLS: 0 Zeilen
  await as(null)
  assert.equal((await one(`select status from projects`)).status, 'awaiting_payment')
})

console.log('\nProjektablauf')
await test('Rechnung → bezahlt → Arbeit → Ergebnis setzt Zeitstempel', async () => {
  await as(MGR)
  await db.exec(`update projects set invoice_number = 'RE-1', invoice_amount = 299, invoice_sent_at = now();
    update projects set status = 'paid'; update projects set status = 'in_progress'; update projects set status = 'result';`)
  const p = await one(`select paid_at, started_at, result_at from projects`)
  assert.ok(p.paid_at && p.started_at && p.result_at)
})
await test('Arbeitsplan und Neuigkeiten vom Team sieht der Kunde', async () => {
  await as(MGR)
  const r = await rows(`update projects set plan = 'Schritt 1', updates = '[{"at":"2026-10-26T10:00:00Z","text":"Profil überarbeitet"}]'::jsonb where request_id = $1 returning id`, a1)
  assert.equal(r.length, 1)
  await as(A)
  const p = await one(`select plan, updates from projects where request_id = $1`, a1)
  assert.equal(p.plan, 'Schritt 1'); assert.equal(p.updates.length, 1)
})
await test('Rechnungslink nur mit https://', async () => {
  await as(ADM)
  await fails(`update projects set invoice_url = 'http://x.de/r.pdf'`)
})
await test('Zweites Unternehmen: eigenes Angebot und eigenes Projekt', async () => {
  await as(ADM)
  const o2 = (await one(`insert into offers (client_key, user_id, request_kind, request_id, items, status) values ('user:${A}', $1, 'check', $2, '[]', 'sent') returning id`, A, a2)).id
  await as(A); await db.query(`select accept_offer($1)`, [o2])
  await as(null)
  const p = await rows(`select request_id, status from projects order by created_at`)
  assert.equal(p.length, 2)
  assert.equal(p.find(x => x.request_id === a1).status, 'result')
  assert.equal(p.find(x => x.request_id === a2).status, 'awaiting_payment')
})
await test('Paket-Anfrage: Angebot → Anfrage «Kunde», Status aktiv', async () => {
  await as(ADM)
  const o3 = (await one(`insert into offers (client_key, user_id, request_kind, request_id, items, status) values ('user:${A}', $1, 'order', $2, '[]', 'sent') returning id`, A, ao)).id
  await as(A); await db.query(`select accept_offer($1)`, [o3])
  await as(null)
  const r = await one(`select stage, status from orders where id = $1`, ao)
  assert.equal(r.stage, 'won'); assert.equal(r.status, 'active')
})
await test('Kunde löscht Unternehmen → dessen Angebot und Projekt weg, andere bleiben', async () => {
  await as(A); await db.query(`select delete_my_check($1)`, [a2])
  await as(null)
  assert.equal((await rows(`select id from offers where request_id = $1`, a2)).length, 0)
  assert.equal((await rows(`select id from projects where request_id = $1`, a2)).length, 0)
  assert.equal((await rows(`select id from projects where request_id = $1`, a1)).length, 1)
})

console.log('\nZusatzangebot (Nachtrag)')
let addOffer
await test('Zweites Hauptangebot für dieselbe Anfrage geht nicht', async () => {
  await as(ADM)
  await fails(`insert into offers (client_key, user_id, request_kind, request_id, items, status) values ('user:${A}', $1, 'check', $2, '[]', 'sent')`, /duplicate|unique/, A, a1)
})
await test('Zusatzangebot zum angenommenen Angebot: Kunde sieht und nimmt an → eigenes Projekt', async () => {
  await as(ADM)
  addOffer = (await one(`insert into offers (client_key, user_id, request_kind, request_id, parent_id, items, status) values ('user:${A}', $1, 'check', $2, $3, '[{"id":"sm","name":"Social Media","price":199,"unit":"pro Monat"}]', 'sent') returning id`, A, a1, offer1)).id
  await as(A)
  assert.equal((await rows(`select id from offers where parent_id = $1`, offer1)).length, 1)
  await db.query(`select accept_offer($1)`, [addOffer])
  await as(null)
  const p = await rows(`select offer_id, status from projects where request_id = $1`, a1)
  assert.equal(p.length, 2)
  assert.equal(p.find(x => x.offer_id === offer1).status, 'result') // Hauptprojekt unverändert
  assert.equal(p.find(x => x.offer_id === addOffer).status, 'awaiting_payment')
  assert.equal((await one(`select status from offers where id = $1`, offer1)).status, 'accepted')
})
await test('Zusatzangebot nur zu angenommenem Angebot derselben Anfrage', async () => {
  await as(ADM)
  await fails(`insert into offers (client_key, user_id, request_kind, request_id, parent_id, items, status) values ('user:${A}', $1, 'check', $2, $3, '[]', 'draft')`, /addendum_invalid/, A, a2, offer1)
  await fails(`insert into offers (client_key, user_id, request_kind, request_id, parent_id, items, status) values ('user:${B}', $1, 'check', $2, $3, '[]', 'draft')`, /addendum_invalid/, B, a1, offer1)
  await fails(`insert into offers (client_key, user_id, request_kind, request_id, parent_id, items, status) values ('user:${A}', $1, 'check', $2, $3, '[]', 'draft')`, /addendum_invalid/, A, a1, addOffer)
})
await test('Höchstens ein offenes Zusatzangebot gleichzeitig', async () => {
  await as(ADM)
  await db.query(`insert into offers (client_key, user_id, request_kind, request_id, parent_id, items, status) values ('user:${A}', $1, 'check', $2, $3, '[]', 'draft')`, [A, a1, offer1])
  await fails(`insert into offers (client_key, user_id, request_kind, request_id, parent_id, items, status) values ('user:${A}', $1, 'check', $2, $3, '[]', 'draft')`, /duplicate|unique/, A, a1, offer1)
  await as(null); await db.query(`delete from offers where parent_id = $1 and status = 'draft'`, [offer1])
})
await test('Kunde B sieht das Zusatzangebot von A nicht', async () => {
  await as(B)
  assert.equal((await rows(`select id from offers where id = $1`, addOffer)).length, 0)
})

console.log('\nVerlauf')
await test('Verlauf: jedes Status-/Angebots-/Projektereignis nennt sein Unternehmen', async () => {
  await as(null)
  const r = await rows(`select kind, detail from activity where client_key = $1 and kind in ('stage','offer_sent','offer_accepted','project','invoice_sent','report_published')`, `user:${A}`)
  assert.ok(r.length > 5)
  for (const x of r) assert.ok(x.detail.req && x.detail.name, `${x.kind} ohne Unternehmen`)
  const a1Events = r.filter(x => x.detail.req === `check:${a1}`)
  assert.ok(a1Events.length > 0 && a1Events.every(x => x.detail.name === 'A-Eins'))
  assert.ok(!r.some(x => x.detail.req === `check:${a1}` && x.detail.name !== 'A-Eins'))
})

console.log('\nQuiz-Lead → Konto')
await test('Angebot zum Quiz wandert beim Registrieren ins Konto', async () => {
  await as(null)
  const lead = (await one(`insert into leads (source, answers) values ('quiz', '{}'::jsonb) returning id`)).id
  await as(ADM)
  await db.query(`insert into offers (client_key, request_kind, request_id, items, status) values ($1, 'lead', $2, '[]', 'sent')`, [`lead:${lead}`, lead])
  await as(B); await db.query(`select claim_lead($1)`, [lead])
  await as(null)
  const o = await one(`select client_key, user_id from offers where request_id = $1`, lead)
  assert.equal(o.client_key, `user:${B}`); assert.equal(o.user_id, B)
})

console.log('\nAnalyse ohne Manager (analysis.sql)')
// Alte Datenbank: Kopie der Leads aus prospects.sql (vereinfacht) — analysis.sql muss sie entfernen.
await as(null)
await db.exec(`
create table public.prospects (id uuid primary key default gen_random_uuid(), place_id text, code text);
create table public.staff_settings (key text primary key, value text);
create function public.prospect_place(p_code text) returns text language sql as $$ select place_id from prospects where code = p_code $$;
alter publication supabase_realtime add table public.prospects;`)
await db.exec(sql('analysis.sql'))
await db.exec(sql('analysis.sql')) // wiederholbar
await test('Alte Lead-Kopie ist entfernt (prospects, staff_settings, prospect_place)', async () => {
  await as(null)
  const r = await one(`select to_regclass('public.prospects') p, to_regclass('public.staff_settings') s,
    (select count(*)::int from pg_proc where proname in ('prospect_place', 'prospect_prefill', 'prospect_responded')) f,
    (select count(*)::int from pg_publication_tables where tablename = 'prospects') pub`)
  assert.deepEqual(r, { p: null, s: null, f: 0, pub: 0 })
})
await test('Bestehende Prüfungen: Analyse «none», neue: «lookup», Start bei null: «none»', async () => {
  await as(null)
  assert.equal((await one(`select analysis_status s from checks where id = $1`, a1)).s, 'none')
  await as(A)
  const n = (await one(`insert into checks (place) values ('{"name":"A-Drei"}') returning id, analysis_status`))
  assert.equal(n.analysis_status, 'lookup')
  const z = (await one(`insert into checks (place, scratch) values ('{"name":"A-Null"}', true) returning analysis_status`))
  assert.equal(z.analysis_status, 'none')
})
await test('Kunde kann keine Prüfung mit fertiger Analyse anlegen', async () => {
  await as(A)
  await fails(`insert into checks (place, analysis_status) values ('{"name":"x"}', 'done')`)
  await fails(`insert into checks (place, analysis_status) values ('{"name":"x"}', 'pending')`, /row-level security/)
  await fails(`insert into checks (place, analysis, analysis_source) values ('{"name":"x"}', '{}'::jsonb, 'sheet')`, /row-level security/)
  await fails(`insert into checks (place, reviewed_at) values ('{"name":"x"}', now())`, /row-level security/)
  await fails(`insert into checks (place, company_keys) values ('{"name":"x"}', '{cid:1}')`, /row-level security/)
})
await test('Kunde kann Analysefelder nicht ändern', async () => {
  await as(A)
  await fails(`update checks set analysis_status = 'done' where id = $1`, /permission denied/, a1)
  await fails(`update checks set analysis = '{}'::jsonb where id = $1`, /permission denied/, a1)
})
await test('«done» nur mit Analyse und Quelle', async () => {
  await as(null)
  const c = (await one(`insert into checks (user_id, place) values ($1, '{"name":"A-Vier"}') returning id`, A)).id
  await fails(`update checks set analysis_status = 'done' where id = $1`, /checks_analysis_done_chk/, c)
  await fails(`update checks set analysis_status = 'fertig' where id = $1`, /checks_analysis_status_chk/, c)
  await fails(`update checks set analysis_source = 'irgendwo' where id = $1`, /checks_analysis_source_chk/, c)
  await db.query(`update checks set analysis_status = 'done', analysis = '{"row":{}}'::jsonb, analysis_source = 'sheet' where id = $1`, [c])
  assert.equal((await one(`select analysis_status s from checks where id = $1`, c)).s, 'done')
})
await test('Bei Grok hängengebliebene Analysen (> 2 h) gehen zurück in die Warteschlange', async () => {
  await as(null)
  await db.query(`update checks set analysis_status = 'in_progress', analysis_taken_at = now() - interval '3 hours' where id = $1`, [a1])
  await db.query(`update checks set analysis_status = 'in_progress', analysis_taken_at = now() - interval '1 hour' where id = $1`, [b1])
  assert.equal((await one(`select release_stale_analyses() n`)).n, 1)
  const s = Object.fromEntries((await rows(`select id, analysis_status from checks where id in ($1, $2)`, a1, b1)).map(r => [r.id, r.analysis_status]))
  assert.deepEqual(s, { [a1]: 'pending', [b1]: 'in_progress' })
  await as(A)
  await fails(`select release_stale_analyses()`, /permission denied/)
})
await test('Tabellen der Leads: nur das Team', async () => {
  const url = 'https://docs.google.com/spreadsheets/d/1BVxvlKTFsoMdHy1zwg4MEunWyY5IyUbWq6YL8GCuJFI/edit?gid=928133157'
  await as(A)
  await fails(`insert into lead_sheets (spreadsheet_id, gid, url) values ('1BVxvlKTFsoMdHy1zwg4MEunWyY5IyUbWq6YL8GCuJFI', 928133157, $1)`, /row-level security/, url)
  await as(MGR)
  await db.query(`insert into lead_sheets (spreadsheet_id, gid, url) values ('1BVxvlKTFsoMdHy1zwg4MEunWyY5IyUbWq6YL8GCuJFI', 928133157, $1)`, [url])
  await fails(`insert into lead_sheets (spreadsheet_id, gid, url) values ('1BVxvlKTFsoMdHy1zwg4MEunWyY5IyUbWq6YL8GCuJFI', 928133157, $1)`, /duplicate key/, url)
  await fails(`insert into lead_sheets (spreadsheet_id, gid, url) values ('abc', 1, 'https://example.com/x')`, /check constraint/)
  await as(B)
  assert.equal((await rows(`select id from lead_sheets`)).length, 0)
  await as(ADM)
  assert.equal((await rows(`select id from lead_sheets`)).length, 1)
  await as(null)
})
await test('System veröffentlicht den Bericht aus fertiger Analyse: Version ohne Autor, ohne E-Mail', async () => {
  await as(null)
  const c = (await one(`insert into checks (user_id, place) values ($1, '{"name":"A-Sechs"}') returning id`, A)).id
  const rep = JSON.stringify({ version: 2, source: 'analysis', channels: { maps: { score: 50, summary: 'x', points: [] } } })
  // ohne fertige Analyse: nichts
  assert.equal((await one(`select publish_system_report($1, $2::jsonb) ok`, c, rep)).ok, false)
  await db.query(`update checks set analysis_status = 'done', analysis = '{"columns":{}}', analysis_source = 'sheet' where id = $1`, [c])
  await fails(`select publish_system_report($1, '{}'::jsonb)`, /bad_report/, c)
  assert.equal((await one(`select publish_system_report($1, $2::jsonb) ok`, c, rep)).ok, true)
  const r = await one(`select status, stage, report->>'source' src, current_setting('rag.silent', true) silent from checks where id = $1`, c)
  assert.deepEqual([r.status, r.stage, r.src], ['ready', 'report_sent', 'analysis'])
  assert.notEqual(r.silent, 'on') // nach der Funktion wieder aus
  const v = await rows(`select created_by from check_reports where check_id = $1`, c)
  assert.equal(v.length, 1); assert.equal(v[0].created_by, null)
  assert.equal((await rows(`select id from activity where client_key = $1 and kind = 'report_published' and detail->>'req' = $2`, `user:${A}`, `check:${c}`)).length, 1)
  // zweites Mal: schon veröffentlicht
  assert.equal((await one(`select publish_system_report($1, $2::jsonb) ok`, c, rep)).ok, false)
  await as(A)
  await fails(`select publish_system_report($1, $2::jsonb)`, /permission denied/, c, rep)
  await as(null)
})
await test('Ohne fertige Analyse: Teilbericht sofort, die fertige Analyse ersetzt ihn später; Team-Bericht bleibt', async () => {
  await as(null)
  const c = (await one(`insert into checks (user_id, place) values ($1, '{"name":"A-Sieben"}') returning id`, A)).id
  const places = JSON.stringify({ version: 2, channels: { maps: { score: 40, summary: 'x', points: [] } } })
  await db.query(`update checks set analysis_status = 'pending' where id = $1`, [c])
  assert.equal((await one(`select publish_partial_report($1, $2::jsonb) ok`, c, places)).ok, true)
  let r = await one(`select status, (report->>'partial')::boolean p from checks where id = $1`, c)
  assert.deepEqual([r.status, r.p], ['ready', true])
  assert.equal((await one(`select publish_partial_report($1, $2::jsonb) ok`, c, places)).ok, false) // nur einmal
  // Analyse fertig (Grok / manuell / spät gefundene Tabelle) → ersetzt den Teilbericht, neue Version
  await db.query(`update checks set analysis_status = 'done', analysis = '{"columns":{}}', analysis_source = 'sheet' where id = $1`, [c])
  const full = JSON.stringify({ version: 2, source: 'analysis', channels: { maps: { score: 70, summary: 'y', points: [] } } })
  assert.equal((await one(`select publish_system_report($1, $2::jsonb) ok`, c, full)).ok, true)
  r = await one(`select report->>'source' s, report->>'partial' p from checks where id = $1`, c)
  assert.deepEqual([r.s, r.p], ['analysis', null])
  assert.equal((await rows(`select id from check_reports where check_id = $1`, c)).length, 2)
  // vom Team veröffentlichter Bericht (nicht partial) wird nicht überschrieben
  const t = (await one(`insert into checks (user_id, place) values ($1, '{"name":"A-Acht"}') returning id`, A)).id
  await db.query(`update checks set status = 'ready', report = '{"channels":{}}', analysis_status = 'done', analysis = '{}', analysis_source = 'manual' where id = $1`, [t])
  assert.equal((await one(`select publish_system_report($1, $2::jsonb) ok`, t, full)).ok, false)
  assert.equal((await one(`select publish_partial_report($1, $2::jsonb) ok`, t, places)).ok, false)
  await as(A)
  await fails(`select publish_partial_report($1, $2::jsonb)`, /permission denied/, c, places)
  await as(null)
})
await test('Volle Tabellenzeile (Belege, Notizen) sieht nur das Team; fällt mit der Prüfung weg', async () => {
  await as(null)
  const c = (await one(`insert into checks (user_id, place) values ($1, '{"name":"A-Fünf"}') returning id`, A)).id
  await db.query(`insert into check_analysis_private (check_id, source, row, matched_by) values ($1, 'sheet', '{"Belege":"G1) intern"}', 'cid')`, [c])
  await as(A)
  assert.equal((await rows(`select check_id from check_analysis_private`)).length, 0)
  await fails(`insert into check_analysis_private (check_id, source) values ($1, 'sheet')`, /permission denied/, c)
  await as(MGR)
  assert.equal((await one(`select row->>'Belege' b from check_analysis_private where check_id = $1`, c)).b, 'G1) intern')
  await as(A); await db.query(`select delete_my_check($1)`, [c])
  await as(null)
  assert.equal((await rows(`select check_id from check_analysis_private where check_id = $1`, c)).length, 0)
})

console.log('\n2FA (mfa.sql)')
await db.exec(sql('mfa.sql'))
await test('Team ohne zweiten Faktor sieht keine Kundendaten', async () => {
  await as(ADM, 'aal1')
  assert.equal((await rows(`select id from checks`)).length, 0)
})
await test('Team mit zweitem Faktor sieht alles', async () => {
  await as(ADM, 'aal2')
  assert.ok((await rows(`select id from checks`)).length >= 2)
})

console.log(`\n${passed} bestanden, ${failed} fehlgeschlagen`)
process.exit(failed ? 1 : 0)
