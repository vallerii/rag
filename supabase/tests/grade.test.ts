// Оценки в RAG = оценки в письме Lead CRM. Эталон считает сама CRM: node scripts/grade-fixtures.mjs ../leadcrm
// Start: npm run test:fn
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { gradeAnalysis, hasFindings } from '../functions/_shared/grade.ts'
import { analysisReport } from '../functions/_shared/analysis-report.ts'

const here = new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const cases = JSON.parse(fs.readFileSync(`${here}fixtures/grade-crm.json`, 'utf8')) as {
  name: string; input: Record<string, string>; expected: { total: number | null; totalGrade: string; ranks: unknown; sections: unknown[] }
}[]

for (const c of cases) {
  test(`wie in der CRM: ${c.name}`, () => {
    const g = gradeAnalysis(c.input)
    assert.deepEqual({ total: g.total, totalGrade: g.totalGrade, ranks: g.ranks, sections: g.sections.map(s => ({ key: s.key, score: s.score, grade: s.grade, findings: s.findings })) }, c.expected)
  })
}

test('Bericht: Gesamtnote im Kundenbereich = Gesamtnote im Brief', () => {
  for (const c of cases) {
    const r = analysisReport(c.input, '2026-11-19', new Date('2026-11-26T10:00:00Z'))
    const scores = Object.values(r.channels).map(x => x?.score).filter((x): x is number => typeof x === 'number')
    const cabinet = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null
    assert.equal(cabinet, c.expected.total, c.name)
    assert.equal(r.total, c.expected.total)
  }
})

test('Bericht: Bereiche → Kanäle, ~ → warn, Datum, KI-Antworten, ohne Befund kein Kanal', () => {
  const c = cases.find(x => x.name === 'Platz-Spalten und KI-Antworten')!
  const r = analysisReport(c.input, '2026-11-19', new Date('2026-11-26T10:00:00Z'))
  assert.deepEqual(Object.keys(r.channels).sort(), ['ai', 'maps', 'search'])
  assert.equal(r.channels.search?.score, 85)
  assert.ok(r.channels.search?.points.some(([, t]) => t === 'Platz 7 in der Google-Suche bei «Heizung Frechen».'))
  assert.deepEqual(r.channels.ai?.points[0], ['warn', 'In 2 von 3 Antworten von ChatGPT genannt.'])
  assert.deepEqual(r.ai, { asked: 3, mentioned: 2, named: '' })
  assert.equal(r.collected_at, '2026-11-19'); assert.equal(r.published_at, '2026-11-26T10:00:00.000Z')
  assert.equal(r.version, 2)
})

test('Bericht: «nicht bewertet» hat einen Text, kein Google-Profil hat den eigenen Text', () => {
  const one = analysisReport({ 'Befund Social Media': '+ Instagram-Auftritt vorhanden.' }, null)
  assert.equal(one.channels.social?.score, null)
  assert.equal(one.channels.social?.summary, 'Zu wenige geprüfte Punkte für eine Bewertung.')
  const none = analysisReport({ 'Befund Google-Profil': '– Kein Google-Unternehmensprofil gefunden.' }, null)
  assert.match(none.channels.maps!.summary, /kein Google-Profil/)
})

test('Empfehlungen: aus offenen Punkten (Reihenfolge wie in der Autoprüfung) oder aus der Spalte «Empfehlungen»', () => {
  const r = analysisReport({
    'Befund Google-Profil': '– Nur 4 Google-Bewertungen.\n+ Durchschnittliche Bewertung 4,7 von 5.\n– Adresse bei Das Örtliche abweichend.',
    'Befund Website': '– Kein Impressum auffindbar.\n~ 1 Seite bei Google indexiert.',
  }, null)
  assert.deepEqual(r.recommendations.map(x => x[1]), ['Impressum ergänzen', 'Mehr Bewertungen sammeln', 'Unternehmensdaten vereinheitlichen'])
  assert.deepEqual(r.recommendations.map(x => x[0]), ['Hohe Priorität', 'Mittlere Priorität', 'Wachstumspotenzial'])
  const own = analysisReport({ 'Befund Website': '– Keine Sitemap.', 'Empfehlungen': '1. Bewertungen sammeln — nach jedem Auftrag per QR-Code\n2. Seiten pro Leistung' }, null)
  assert.deepEqual(own.recommendations, [['Hohe Priorität', 'Bewertungen sammeln', 'nach jedem Auftrag per QR-Code'], ['Mittlere Priorität', 'Seiten pro Leistung', '']])
})

test('Analyse erkannt nur mit Befund-Zeilen (wie die CRM: ohne sie kein Brief)', () => {
  assert.equal(hasFindings({ 'Befund Website': '+ Website mit HTTPS.' }), true)
  assert.equal(hasFindings({ 'Befund Website': 'nur Notiz', 'Platz Google Maps': '3' }), false)
})
