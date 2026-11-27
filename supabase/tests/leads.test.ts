// Тесты поиска строки компании в таблицах лидов и чтения Google Sheets (без сети).
// Start: npm run test:fn
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  bestMatch, cidFrom, clientColumns, domainOf, duplicateGroups, hasAnalysis, keysOfPlace, keysOfRow, nameKey, phoneKey, rowDate,
  type Candidate,
} from '../functions/_shared/leadkey.ts'
import { accessToken, parseServiceAccount, parseSheetUrl, readTab, SheetError } from '../functions/_shared/sheets.ts'

// Spalten wie in der Tabelle «Köln 134» (Werte erfunden)
const H = ['Company', 'Website', 'Location', 'Address', 'Company Phone', 'Google Maps URL', 'Checked On', 'Belege', 'Notes', 'Contact Person',
  'Befund Google-Profil', 'Befund Website', 'Befund Social Media', 'Befund KI-Suche', 'Platz Google Maps']
const row = (o: Record<string, string>) => Object.fromEntries(H.map(h => [h, o[h] ?? '']))
const MUSTER = row({
  Company: 'Muster Heizung & Sanitär GmbH', Website: 'https://www.muster-heizung.de/kontakt', Location: 'Frechen',
  Address: 'Hauptstraße 1, 50226 Frechen', 'Company Phone': '+4922341234567', 'Google Maps URL': 'https://www.google.com/maps?cid=00123456789012345678',
  'Checked On': '11/19/2026', Belege: 'G1) intern', Notes: 'Chef ruft zurück', 'Contact Person': 'Max Muster',
  'Befund Google-Profil': '+ Platz 1 bei «Sanitär Frechen» in Google Maps.\n– Nur 4 Google-Bewertungen.', 'Befund Website': '+ Website mit HTTPS.',
  'Platz Google Maps': '1',
})
const cand = (ref: string, r: Record<string, string>): Candidate => ({ ref, row: r, keys: keysOfRow(r, H), date: rowDate(r, H), analysed: hasAnalysis(r) })

test('Kartennummer (cid) aus allen Google-Maps-Linkformen', () => {
  assert.equal(cidFrom('https://www.google.com/maps?cid=7250517857609394766'), '7250517857609394766')
  assert.equal(cidFrom('https://maps.google.com/?cid=7250517857609394766&g_mp=x'), '7250517857609394766')
  assert.equal(cidFrom('https://www.google.com/maps/place/X/data=!4m2!3m1!1s0x47bf25:0x649e5a8e2f1c3b4e'), BigInt('0x649e5a8e2f1c3b4e').toString())
  assert.equal(cidFrom('https://www.google.com/maps/search/?api=1&query=Frank%20Kuhl'), null) // nur eine Suche, kein Schlüssel
  assert.equal(cidFrom(''), null)
})

test('Domain: ohne www/Pfad, Netzwerke und Verzeichnisse zählen nicht', () => {
  assert.equal(domainOf('https://www.Muster-Heizung.de/kontakt?x=1'), 'muster-heizung.de')
  assert.equal(domainOf('muster.de'), 'muster.de')
  for (const u of ['https://facebook.com/muster', 'https://www.instagram.com/muster', 'https://www.dasoertliche.de/x', 'https://profimap.de/firma/x', 'https://linktr.ee/x', 'kein link'])
    assert.equal(domainOf(u), null, u)
})

test('Telefon: +49, 0049 und 0 vorne sind gleich', () => {
  const k = phoneKey('+49 2234 1234567')
  assert.equal(k, '22341234567')
  assert.equal(phoneKey('02234 / 123 45 67'), k)
  assert.equal(phoneKey('0049 2234 1234567'), k)
  assert.equal(phoneKey('123'), null)
})

test('Name + PLZ: ohne Rechtsform, Umlaute und Zeichen', () => {
  assert.equal(nameKey('Muster Heizung & Sanitär GmbH', 'Hauptstraße 1, 50226 Frechen'), nameKey('MUSTER Heizung und Sanitär', '50226 Frechen'))
  assert.equal(nameKey('Muster GmbH', 'Frechen'), null) // ohne PLZ kein Schlüssel
})

test('Schlüssel aus Google (Website RAG) und aus der Tabelle stimmen überein', () => {
  const place = keysOfPlace({ id: 'ChIJabc123def456', name: 'Muster Heizung & Sanitär GmbH', address: 'Hauptstraße 1, 50226 Frechen, Deutschland',
    website: 'http://muster-heizung.de/', phone: '02234 1234567', mapsUrl: 'https://maps.google.com/?cid=123456789012345678' })
  assert.deepEqual(place, ['place:ChIJabc123def456', 'cid:123456789012345678', 'web:muster-heizung.de', 'tel:22341234567', 'name:muster heizung sanitaer|50226'])
  const { best, others } = bestMatch(place, [cand('A2', MUSTER)])
  assert.equal(best?.ref, 'A2'); assert.equal(best?.by, 'cid'); assert.equal(others.length, 0)
  assert.deepEqual(keysOfPlace({ id: 'manual:1', name: 'X' }), [])
})

test('Verschiedene Kartennummern = verschiedene Firmen, auch bei gleichem Telefon', () => {
  const other = row({ ...MUSTER, 'Google Maps URL': 'https://www.google.com/maps?cid=999999999999' })
  assert.equal(bestMatch(keysOfRow(MUSTER, H), [cand('B2', other)]).best, null)
})

test('Mehrere Treffer: stärkerer Schlüssel, dann mit Analyse, dann neueres Datum; der Rest sind Dubletten', () => {
  const telOnly = row({ Company: 'Muster', 'Company Phone': '02234 1234567', 'Befund Website': '+ X vorhanden.', 'Checked On': '12/01/2026' })
  const noAnalysis = row({ ...MUSTER, 'Befund Google-Profil': '', 'Befund Website': '', 'Checked On': '12/02/2026' })
  const r = bestMatch(keysOfRow(MUSTER, H), [cand('T2', telOnly), cand('N3', noAnalysis), cand('M4', MUSTER)])
  assert.equal(r.best?.ref, 'M4')
  assert.deepEqual(r.others.map(o => o.ref), ['N3', 'T2'])
})

test('Dublettensuche über alle Tabellen', () => {
  const g = duplicateGroups([cand('Köln!5', MUSTER), cand('Bonn!9', row({ Company: 'Muster Heizung', Website: 'muster-heizung.de' })), cand('Köln!6', row({ Company: 'Andere', Website: 'andere.de' }))])
  assert.equal(g.length, 1)
  assert.deepEqual(g[0].map(c => c.ref).sort(), ['Bonn!9', 'Köln!5'])
})

test('Datum der Prüfung: deutsch, ISO, US (Google Sheets), Vorrang «Datum der Prüfung»', () => {
  assert.equal(rowDate({ 'Checked On': '11/19/2026' }, ['Checked On']), '2026-11-19')
  assert.equal(rowDate({ 'Checked On': '19.11.2026' }, ['Checked On']), '2026-11-19')
  assert.equal(rowDate({ 'Datum der Prüfung': '2026-11-20', 'Checked On': '11/19/2026' }, ['Checked On', 'Datum der Prüfung']), '2026-11-20')
  assert.equal(rowDate({ 'Checked On': '13/45/2026' }, ['Checked On']), null)
})

test('In die Prüfung des Kunden kommen nur Analysespalten (keine Belege, Notizen, Kontakte)', () => {
  assert.deepEqual(Object.keys(clientColumns(MUSTER)).sort(), ['Befund Google-Profil', 'Befund Website', 'Platz Google Maps'])
  assert.equal(hasAnalysis(row({ Company: 'X' })), false)
})

test('Link auf eine Registerkarte', () => {
  assert.deepEqual(parseSheetUrl('https://docs.google.com/spreadsheets/d/1BVxvlKTFsoMdHy1zwg4MEunWyY5IyUbWq6YL8GCuJFI/edit?gid=928133157#gid=928133157'),
    { spreadsheetId: '1BVxvlKTFsoMdHy1zwg4MEunWyY5IyUbWq6YL8GCuJFI', gid: 928133157 })
  assert.equal(parseSheetUrl('https://docs.google.com/spreadsheets/d/1BVxvlKTFsoMdHy1zwg4MEunWyY5IyUbWq6YL8GCuJFI/edit#gid=0').gid, 0)
  assert.throws(() => parseSheetUrl('https://docs.google.com/spreadsheets/d/1BVxvlKTFsoMdHy1zwg4MEunWyY5IyUbWq6YL8GCuJFI/edit'), /Registerkarte/)
  assert.throws(() => parseSheetUrl('https://example.com/spreadsheets/d/1BVxvlKTFsoMdHy1zwg4MEunWyY5IyUbWq6YL8GCuJFI/edit#gid=1'), SheetError)
})

// ── Google: Dienstkonto + Tabelle lesen (fetch ersetzt) ────────────────────────
async function testAccount() {
  const pair = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify'])
  const der = new Uint8Array(await crypto.subtle.exportKey('pkcs8', pair.privateKey))
  const pem = `-----BEGIN PRIVATE KEY-----\n${btoa(String.fromCharCode(...der)).match(/.{1,64}/g)!.join('\n')}\n-----END PRIVATE KEY-----\n`
  return { pair, json: JSON.stringify({ type: 'service_account', client_email: 'rag@test.iam.gserviceaccount.com', private_key: pem }) }
}
const fromB64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))

test('Dienstkonto: signiertes JWT, nur Leserecht, Token wird wiederverwendet', async () => {
  const { pair, json } = await testAccount()
  const sa = parseServiceAccount(json)
  let calls = 0
  const fake = (async (url: string, init?: RequestInit) => {
    calls++
    assert.equal(url, 'https://oauth2.googleapis.com/token')
    const jwt = new URLSearchParams(String(init?.body)).get('assertion')!
    const [h, p, s] = jwt.split('.')
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', pair.publicKey, fromB64url(s), new TextEncoder().encode(`${h}.${p}`))
    assert.ok(ok, 'Signatur')
    const payload = JSON.parse(new TextDecoder().decode(fromB64url(p)))
    assert.equal(payload.scope, 'https://www.googleapis.com/auth/spreadsheets.readonly')
    assert.equal(payload.iss, 'rag@test.iam.gserviceaccount.com')
    return new Response(JSON.stringify({ access_token: 'tok-1', expires_in: 3600 }))
  }) as typeof fetch
  assert.equal(await accessToken(sa, fake), 'tok-1')
  assert.equal(await accessToken(sa, fake), 'tok-1')
  assert.equal(calls, 1)
  assert.throws(() => parseServiceAccount('{"type":"user"}'), /Dienstkonto/)
})

test('Registerkarte lesen: Kopfzeile, Zeilennummern, leere Zeilen, doppelte Spalten, kein Zugriff', async () => {
  const { json } = await testAccount()
  const sa = parseServiceAccount(json.replace('rag@', 'rag2@')) // neues Konto → eigener Token
  const fake = (async (url: string) => {
    if (url.startsWith('https://oauth2')) return new Response(JSON.stringify({ access_token: 't', expires_in: 3600 }))
    if (url.includes('?fields=')) return new Response(JSON.stringify({ properties: { title: 'Köln 134' }, sheets: [{ properties: { sheetId: 7, title: "Companies 'neu'" } }] }))
    assert.match(decodeURIComponent(url), /'Companies ''neu'''!A1:ZZ10001/)
    return new Response(JSON.stringify({ values: [['Company', 'Website', 'Website'], ['A GmbH', 'a.de'], [], ['B GmbH', '', 'b.de']] }))
  }) as typeof fetch
  const tab = await readTab(sa, '1BVxvlKTFsoMdHy1zwg4MEunWyY5IyUbWq6YL8GCuJFI', 7, fake)
  assert.equal(tab.title, 'Köln 134'); assert.equal(tab.tabTitle, "Companies 'neu'")
  assert.deepEqual(tab.headers, ['Company', 'Website', 'Website (2)'])
  assert.deepEqual(tab.rows.map(r => r.n), [2, 4])
  assert.equal(tab.rows[1].data['Website (2)'], 'b.de')
  await assert.rejects(readTab(sa, '1BVxvlKTFsoMdHy1zwg4MEunWyY5IyUbWq6YL8GCuJFI', 8, fake), /Registerkarte/)
  const denied = (async (url: string) => url.startsWith('https://oauth2')
    ? new Response(JSON.stringify({ access_token: 't', expires_in: 3600 })) : new Response('{}', { status: 403 })) as typeof fetch
  await assert.rejects(readTab(sa, '1BVxvlKTFsoMdHy1zwg4MEunWyY5IyUbWq6YL8GCuJFI', 7, denied), /rag2@test\.iam\.gserviceaccount\.com/)
})
