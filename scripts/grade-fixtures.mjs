// Ожидаемые оценки для supabase/tests/grade.test.ts — считает сама Lead CRM (lib/letters/data.js → letterData).
// Запуск после изменения формулы в CRM:  node scripts/grade-fixtures.mjs ../leadcrm
// Входы выдуманные, по образцу колонок таблиц лидов. Результат: supabase/tests/fixtures/grade-crm.json
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const crm = path.resolve(process.argv[2] ?? '../leadcrm')
const { letterData } = await import(pathToFileURL(path.join(crm, 'lib/letters/data.js')).href)

const G = 'Befund Google-Profil', W = 'Befund Website', S = 'Befund Social Media', K = 'Befund KI-Suche'
const cases = {
  'alle Bereiche, gemischt': { [G]: '+ Platz 1 bei «Sanitär Frechen» in Google Maps.\n+ Durchschnittliche Bewertung 4,9 von 5.\n– Adresse bei Das Örtliche abweichend.', [W]: '+ Website erreichbar, PageSpeed mobil 100 von 100.\n– Keine Seitenbeschreibung (Meta-Description) für Google.', [S]: '+ Facebook-Auftritt vorhanden.', [K]: '+ In 3 von 3 Antworten von ChatGPT genannt.' },
  'teilweise (~) und Gedankenstrich-Varianten': { [G]: '~ Platz 4 bei «Elektriker Hürth» in Google Maps.\n— Nur 4 Google-Bewertungen.\n− Keine Antworten des Inhabers auf Bewertungen.', [W]: '~ Keine eigenen Seiten für einzelne Leistungen.\n- Kein Impressum auffindbar.' },
  'eine einzige erfüllte Zeile → nicht bewertet': { [S]: '+ Instagram-Auftritt vorhanden.', [G]: '+ 112 Google-Bewertungen.' },
  'ein einziger Mangel wird bewertet': { [W]: '– Keine eigene Website gefunden.', [G]: '– Kein Google-Unternehmensprofil gefunden.' },
  'Platz-Spalten und KI-Antworten': { [G]: '+ 30 Google-Bewertungen.\n– Letzte Google-Bewertung vor 14 Monaten.', [W]: '+ Website mit HTTPS.\n+ Impressum vorhanden.', 'Platz Google Maps': '6', 'Platz Google-Suche': '7', 'Suchbegriff': 'Heizung Frechen', 'KI-Antworten': 'Wen kann ich für Heizungsbau in Frechen beauftragen? — nicht genannt\nBester Heizungsbetrieb in Frechen? — Platz 2\nHeizung Frechen Empfehlung — Platz 5', [K]: '~ In 2 von 3 Antworten von ChatGPT genannt.\n– ChatGPT nennt eine veraltete Adresse.' },
  'Google-Suche nicht unter den ersten 10 (Spalte)': { [W]: '+ Website mit HTTPS.\n– Keine Sitemap.', 'Platz Google-Suche': 'nicht unter den ersten 10' },
  'Google-Suche schon als Zeile vorhanden': { [W]: '+ Website mit HTTPS.\n~ Platz 7 in der Google-Suche bei «Maler Köln».', 'Platz Google-Suche': '7' },
  'Platz aus Zeilen (ohne Spalten)': { [G]: '– Bei «Dachdecker Pulheim» nicht unter den ersten 10 in Google Maps.\n+ 4,5 von 5.', [W]: '+ Erreichbar.\n– In der Google-Suche nicht unter den ersten 10.', [K]: '– In keiner von 3 Antworten von ChatGPT genannt.' },
  'Platz «–» = nicht geprüft': { [W]: '+ Website mit HTTPS.\n+ Impressum vorhanden.', 'Platz Google-Suche': '–', 'Platz Google Maps': '–' },
  'Zeilen ohne Zeichen werden ignoriert': { [G]: 'Notiz für das Team\n+ 40 Google-Bewertungen.\n+ Öffnungszeiten vorhanden.\n+ ab', [W]: 'nur Text' },
  'sehr gut': { [G]: '+ Platz 1 bei «Zahnarzt Köln» in Google Maps.\n+ 300 Google-Bewertungen.\n+ Bewertung 4,8 von 5.', [W]: '+ HTTPS.\n+ PageSpeed 95 von 100.', 'Platz Google-Suche': '1', [S]: '+ Instagram vorhanden.\n+ Letzter Beitrag vor 1 Woche.', [K]: '+ In 3 von 3 Antworten von ChatGPT genannt.' },
  'KI nur aus Antworten-Spalte': { 'KI-Antworten': 'Frage A? — Platz 1\nFrage B? — Platz 12\nFrage C? — nicht genannt', [K]: '+ Daten in den Antworten korrekt.' },
}
const out = Object.entries(cases).map(([name, input]) => {
  const d = letterData({ name: 'Test GmbH' }, input, {}, null, {})
  return { name, input, expected: { total: d.total, totalGrade: d.totalGrade, ranks: d.ranks, sections: d.sections.map(s => ({ key: s.key, score: s.score, grade: s.grade, findings: s.findings })) } }
})
const file = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', 'supabase', 'tests', 'fixtures', 'grade-crm.json')
fs.writeFileSync(file, JSON.stringify(out, null, 1) + '\n')
console.log(`${out.length} Fälle → ${file}`)
