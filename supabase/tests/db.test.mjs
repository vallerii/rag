// Datenbank-Tests: schema.sql + admin.sql + project.sql (+ mfa.sql) in einem echten Postgres (PGlite, im Prozess).
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
