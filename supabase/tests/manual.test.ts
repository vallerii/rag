// План B: задание для ИИ, разбор ответа, объединение с автопроверкой. Start: npm run test:fn
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildTask, mergeColumns, parseResults, placesLines, type QueueCheck } from '../functions/_shared/manual.ts'
import { gradeAnalysis } from '../functions/_shared/grade.ts'

const ID = '0f8fad5b-d9cb-469f-a165-70867728950e'
const check: QueueCheck = {
  id: ID, analysis_status: 'pending',
  place: { name: 'Muster Dach GmbH', category: 'Dachdecker', city: 'Pulheim', address: 'Hauptstr. 1, 50259 Pulheim', website: 'https://muster-dach.de', phone: '02238 123456', email: 'kunde@privat.de' },
  report_draft: { items: {
    maps: [{ mark: 'ok', text: '47 Google-Bewertungen' }, { mark: 'warn', text: 'Bei «Dachdecker Pulheim» auf Platz 6' }],
    search: [{ mark: 'bad', text: 'Kein Impressum gefunden' }],
  } },
  audit: { keywords: ['Dachdecker Pulheim'], competitors: { query: 'Dachdecker Pulheim', rank: 6, list: [1, 2, 3, 4, 5] } },
}

test('Aufgabe: Regeln, Firma, schon geprüfte Punkte — ohne E-Mail, Name und Telefon des Kunden', () => {
  const t = buildTask([check])
  assert.match(t, /Muster Dach GmbH/)
  assert.match(t, /\+ 47 Google-Bewertungen/)
  assert.match(t, /~ Bei «Dachdecker Pulheim» auf Platz 6/)
  assert.match(t, /– Kein Impressum gefunden/)
  assert.match(t, new RegExp(ID))
  assert.doesNotMatch(t, /kunde@privat\.de|02238/)
  assert.match(buildTask([{ ...check, report_draft: null }]), /bitte ALLE Punkte prüfen/)
})

test('Antwort der KI: JSON im Text, Belege getrennt, ungültige Einträge mit Grund', () => {
  const text = `Hier das Ergebnis:\n\`\`\`json\n[
    {"id": "${ID}", "Befund Google-Profil": "+ Google-Profil vom Inhaber bestätigt.\\n– Adresse bei Das Örtliche abweichend.", "Befund KI-Suche": "– In keiner von 3 Antworten genannt.", "Platz Google-Suche": "nicht unter den ersten 10", "Belege": "G1) https://…"},
    {"id": "kaputt", "Befund Website": "+ x"},
    {"id": "1b4e28ba-2fa1-11d2-883f-0016d3cca427", "Befund Website": "nur Text ohne Zeichen"}
  ]\n\`\`\``
  const { results, errors } = parseResults(text)
  assert.equal(results.length, 1)
  assert.equal(results[0].belege, 'G1) https://…')
  assert.ok(!('Belege' in results[0].columns))
  assert.equal(errors.length, 2)
  assert.match(errors[0], /keine gültige id/); assert.match(errors[1], /keine Zeile/)
  assert.deepEqual(parseResults('kein json').errors, ['Die Antwort ist kein JSON-Array'])
})

test('Zusammenführen: Zeilen der Autoprüfung zuerst, dann KI; Platz Maps aus Google; dieselbe Notenformel', () => {
  const { results } = parseResults(JSON.stringify([{ id: ID, 'Befund Google-Profil': '+ Google-Profil vom Inhaber bestätigt.', 'Befund Website': '– Keine eigenen Seiten für einzelne Leistungen.', 'Platz Google-Suche': '4' }]))
  const cols = mergeColumns(check, results[0].columns, '2026-11-26')
  assert.equal(cols['Befund Google-Profil'], '+ 47 Google-Bewertungen\n~ Bei «Dachdecker Pulheim» auf Platz 6\n+ Google-Profil vom Inhaber bestätigt.')
  assert.equal(cols['Befund Website'], '– Kein Impressum gefunden\n– Keine eigenen Seiten für einzelne Leistungen.')
  assert.equal(cols['Platz Google Maps'], '6'); assert.equal(cols['Suchbegriff'], 'Dachdecker Pulheim'); assert.equal(cols['Datum der Prüfung'], '2026-11-26')
  const g = gradeAnalysis(cols)
  assert.equal(g.sections.find(s => s.key === 'maps')?.score, 83) // (1 + 0,5 + 1) / 3
  // Website: 0 von 2 Punkten (70 %) + Platz 4 in der Google-Suche (0,5 × 30 %) = 15
  assert.equal(g.sections.find(s => s.key === 'website')?.score, 15)
  assert.deepEqual(Object.keys(placesLines({ report_draft: null })), ['maps', 'search', 'social', 'ai'])
})
