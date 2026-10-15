// Druckfertige Briefe (DIN 5008, Form B — Anschrift im Fenster eines DIN-lang-Umschlags).
// Öffnet ein Druckfenster: drucken oder im Druckdialog «Als PDF speichern».
// Leads: Kurzanalyse aus den automatischen Prüfungen. Anfragen: veröffentlichter Prüfbericht.
import { COMPANY, fill } from '../company'
import type { ProspectFull } from './api'

type Mark = 'ok' | 'warn' | 'bad'
const CHAN_DE: [string, string][] = [['maps', 'Google Maps'], ['search', 'Website & Google-Suche'], ['social', 'Social Media'], ['ai', 'KI-Suche']]
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
const today = () => new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
export const siteUrl = () => ((import.meta.env.VITE_SITE_URL as string | undefined) || window.location.origin).replace(/\/+$/, '')
const shortUrl = (u: string) => u.replace(/^https?:\/\//, '')

type QrLib = (t: number, l: string) => { addData: (s: string) => void; make: () => void; createSvgTag: (o: { cellSize: number; margin: number; scalable?: boolean }) => string }
let qrLib: Promise<QrLib> | null = null
async function qrSvg(text: string): Promise<string> {
  // QR-Code-Erzeuger nur im Admin, bei Bedarf vom CDN geladen (keine zusätzliche Abhängigkeit im Projekt).
  const src: string = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/+esm'
  qrLib ??= (import(/* @vite-ignore */ src) as Promise<{ default?: QrLib }>).then(m => (m.default ?? m) as QrLib)
  try {
    const q = (await qrLib)(0, 'M')
    q.addData(text); q.make()
    return q.createSvgTag({ cellSize: 4, margin: 0, scalable: true })
  } catch { return '' }
}

/** «Kemperpl. 1, 10785 Berlin, Deutschland» → ['Kemperpl. 1', '10785 Berlin'] */
function addressLines(address: string | null, city: string | null): string[] {
  const parts = (address ?? '').split(',').map(s => s.trim()).filter(s => s && !/^(Deutschland|Germany)$/i.test(s))
  if (parts.length >= 2) return [parts[0], parts[parts.length - 1]]
  if (parts.length === 1) return city && !parts[0].includes(city) ? [parts[0], city] : [parts[0]]
  return city ? [city] : []
}

const markIcon = (m: Mark) => `<span class="mk ${m}">${m === 'ok' ? '&#10003;' : m === 'warn' ? '!' : '&times;'}</span>`
const sender = () => `${esc(COMPANY.legalName || 'RAG Regionale Agentur')} · ${esc(fill(COMPANY.street, 'Straße'))} · ${esc(fill(COMPANY.zip, 'PLZ'))} ${esc(fill(COMPANY.city, 'Ort'))}`
const footer = () => `
  <div class="foot">
    <div><b>${esc(COMPANY.legalName || COMPANY.brand)}</b><br>${esc(fill(COMPANY.street, 'Straße'))}<br>${esc(fill(COMPANY.zip, 'PLZ'))} ${esc(fill(COMPANY.city, 'Ort'))}</div>
    <div>Tel. ${esc(fill(COMPANY.phone, 'Telefon'))}<br>${esc(COMPANY.email)}<br>${esc(shortUrl(siteUrl()))}</div>
    <div>${COMPANY.representative ? `Geschäftsführung: ${esc(COMPANY.representative)}<br>` : '[Geschäftsführung]<br>'}${COMPANY.registerNumber ? `${esc(COMPANY.registerCourt)} ${esc(COMPANY.registerNumber)}<br>` : '[Handelsregister]<br>'}${COMPANY.vatId ? `USt-IdNr. ${esc(COMPANY.vatId)}` : COMPANY.smallBusiness ? 'Kleinunternehmer § 19 UStG' : '[USt-IdNr.]'}</div>
  </div>`

const CSS = `
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
body { margin: 0; font-family: Manrope, 'Helvetica Neue', Arial, sans-serif; color: #0B0B1A; font-size: 9.6pt; line-height: 1.42; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.page { width: 210mm; height: 297mm; position: relative; overflow: hidden; page-break-after: always; background: #fff; }
.page.flow { height: auto; min-height: 297mm; overflow: visible; padding-bottom: 30mm; }
.logo { position: absolute; top: 14mm; right: 20mm; font-weight: 800; font-size: 20pt; letter-spacing: -0.02em; }
.logo i { color: #2600FF; font-style: normal; }
.logo small { display: block; font-size: 7.5pt; font-weight: 500; color: #4A4A63; letter-spacing: 0; text-align: right; }
.fold { position: absolute; left: 0; width: 5mm; border-top: 0.3pt solid #999; }
.ret { position: absolute; top: 50mm; left: 25mm; width: 85mm; font-size: 7pt; color: #4A4A63; border-bottom: 0.3pt solid #999; padding-bottom: 0.5mm; white-space: nowrap; overflow: hidden; }
.addr { position: absolute; top: 62.7mm; left: 25mm; width: 80mm; font-size: 10.5pt; line-height: 1.35; }
.info { position: absolute; top: 50mm; left: 125mm; width: 65mm; font-size: 8.5pt; color: #4A4A63; line-height: 1.6; }
.info b { color: #0B0B1A; font-weight: 600; }
.body { position: absolute; top: 98.5mm; left: 25mm; right: 20mm; }
.flow .body { position: static; padding: 98.5mm 20mm 0 25mm; }
h1 { font-size: 12pt; margin: 0 0 4mm; font-weight: 800; line-height: 1.3; }
p { margin: 0 0 2.5mm; }
.scores { display: grid; grid-template-columns: repeat(5, 1fr); gap: 2mm; margin: 3mm 0 4mm; }
.sc { border: 0.4pt solid #D6D5E3; border-radius: 2mm; padding: 2mm 2.5mm; }
.sc span { display: block; font-size: 7pt; color: #4A4A63; line-height: 1.2; min-height: 2.4em; }
.sc b { font-size: 15pt; }
.sc.total { background: #0B0B1A; color: #fff; border-color: #0B0B1A; }
.sc.total span { color: #C9C8DA; }
ul.iss { list-style: none; margin: 0 0 4mm; padding: 0; }
ul.iss li { display: flex; gap: 2.5mm; align-items: flex-start; margin-bottom: 1.1mm; }
.mk { flex: none; width: 4.2mm; height: 4.2mm; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 7.5pt; font-weight: 800; margin-top: 0.4mm; }
.mk.bad { background: #FBE3E0; color: #9C1F17; } .mk.warn { background: #FFF1D6; color: #8A4B00; } .mk.ok { background: #E3F4EA; color: #17663A; }
.cta { display: flex; gap: 5mm; align-items: center; border: 0.6pt solid #2600FF; border-radius: 3mm; padding: 3mm 4mm; margin: 4mm 0; }
.cta svg { width: 23mm; height: 23mm; flex: none; }
.cta b { font-size: 10.5pt; }
.cta .url { font-weight: 700; color: #2600FF; font-size: 10.5pt; }
.small { font-size: 7.5pt; color: #4A4A63; }
.foot { position: absolute; left: 25mm; right: 20mm; bottom: 10mm; display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; font-size: 7pt; color: #4A4A63; border-top: 0.3pt solid #D6D5E3; padding-top: 2mm; line-height: 1.4; }
.flow .foot { position: static; margin: 10mm 20mm 0 25mm; }
.ch { break-inside: avoid; margin-bottom: 5mm; }
.ch h2 { font-size: 10.5pt; margin: 0 0 1.5mm; }
.hint { position: fixed; top: 0; left: 0; right: 0; background: #2600FF; color: #fff; padding: 10px 16px; font: 14px Arial, sans-serif; text-align: center; }
@media print { .hint { display: none; } }
@media screen { body { background: #E6E5F0; } .page { margin: 50px auto 20px; box-shadow: 0 4px 24px rgba(0,0,0,.15); } }
`

function scoreCells(channels: Record<string, { score: number | null } | undefined> | undefined) {
  const cells = CHAN_DE.filter(([k]) => typeof channels?.[k]?.score === 'number')
  const vals = cells.map(([k]) => channels![k]!.score as number)
  const total = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null
  return `<div class="scores" style="grid-template-columns: repeat(${cells.length + 1}, 1fr)">
    <div class="sc total"><span>Gesamt</span><b>${total ?? '—'}</b><small>/100</small></div>
    ${cells.map(([k, t]) => `<div class="sc"><span>${t}</span><b>${channels![k]!.score}</b><small>/100</small></div>`).join('')}
  </div>`
}

const frame = (inner: string) => `<span class="fold" style="top:105mm"></span><span class="fold" style="top:148.5mm;width:7mm"></span><span class="fold" style="top:210mm"></span>
  <div class="logo">RAG<i>.</i><small>Regionale Agentur</small></div>${inner}${footer()}`

async function leadLetter(p: ProspectFull): Promise<string> {
  const link = `${siteUrl()}/check?c=${p.code}`
  const qr = await qrSvg(link)
  const comp = p.audit?.competitors
  const issues = (p.issues ?? []).slice(0, 5)
  // Steht die Position schon in den Problemen («Bei «…» …»), nicht doppelt erwähnen.
  const rankLine = comp?.query && !issues.some(i => i.text.startsWith('Bei «'))
    ? comp.rank && comp.rank <= 3 ? '' : `<p>Wer in Ihrer Region bei Google Maps nach «${esc(comp.query)}» sucht, findet Sie ${comp.rank ? `erst auf Platz ${comp.rank}` : 'nicht unter den ersten Treffern'} — die ersten drei Einträge bekommen die meisten Anrufe.</p>`
    : ''
  return `<section class="page">${frame(`
    <div class="ret">${sender()}</div>
    <div class="addr">${esc(p.name)}<br>${addressLines(p.address, p.city).map(esc).join('<br>')}</div>
    <div class="info">Datum: <b>${today()}</b><br>Ihr Code: <b>${esc(p.code)}</b><br>Ansprechpartner: <b>RAG-Team</b></div>
    <div class="body">
      <h1>Kostenlose Kurzanalyse: Wie gut wird ${esc(p.name)} online gefunden?</h1>
      <p>Sehr geehrte Damen und Herren,</p>
      <p>wir haben uns angesehen, wie Ihr Unternehmen bei Google Maps, in der Google-Suche und in Social Media erscheint — dort, wo Kunden heute nach ${esc(p.category || 'Anbietern')} in ${esc(p.city || 'Ihrer Region')} suchen. Das Ergebnis in Kürze:</p>
      ${scoreCells(p.report_draft?.channels)}
      ${issues.length ? `<p><b>Was uns aufgefallen ist:</b></p><ul class="iss">${issues.slice(0, rankLine ? 4 : 5).map(i => `<li>${markIcon(i.mark)}<span>${esc(i.text)}</span></li>`).join('')}</ul>` : ''}
      ${rankLine}
      <div class="cta">${qr}<div><b>Ihre ausführliche Analyse — kostenlos und unverbindlich</b><br>Code scannen oder im Browser öffnen:<br><span class="url">${esc(shortUrl(link))}</span><br><span class="small">Dort sehen Sie zusätzlich Ihre Wettbewerber, Ihre Sichtbarkeit in KI-Assistenten wie ChatGPT und konkrete nächste Schritte.</span></div></div>
      <p>Mit freundlichen Grüßen<br><b>Ihr RAG-Team</b></p>
      <p class="small">Grundlage sind öffentlich zugängliche Daten (Google-Unternehmensprofil, Ihre Website), Stand ${today()}. Möchten Sie keine weiteren Schreiben von uns erhalten, genügt eine kurze Nachricht an ${esc(COMPANY.email)}.</p>
    </div>`)}</section>`
}

/** Prüfbericht einer Anfrage (veröffentlichte Version) — mehrseitig im Fluss. */
export type ReportForPrint = {
  company: string; address: string | null; city: string | null; no: number; date: string
  channels: Record<string, { score: number | null; summary: string; points: [Mark, string][] } | undefined>
  recommendations: [string, string, string][]; recommended?: { name: string; price: number; unit: string; why?: string } | null
  /** Positionen des Angebots (mehrere möglich). */
  items?: { name: string; description?: string; price: number; unit: string }[] | null
  /** Kurzanalyse (Entwurf) statt veröffentlichtem Bericht. */
  draft?: boolean
}
function reportDoc(r: ReportForPrint): string {
  return `<section class="page flow">${frame(`
    <div class="ret">${sender()}</div>
    <div class="addr">${esc(r.company)}<br>${addressLines(r.address, r.city).map(esc).join('<br>')}</div>
    <div class="info">Datum: <b>${esc(r.date)}</b><br>${r.draft ? 'Kurzanalyse' : `Bericht: <b>Nr. ${r.no}</b>`}</div>
    <div class="body">
      <h1>${r.draft ? 'Kurzanalyse' : 'Sichtbarkeits-Check'}: ${esc(r.company)}</h1>
      ${scoreCells(r.channels)}
      ${CHAN_DE.filter(([k]) => r.channels[k]).map(([k, t]) => {
        const c = r.channels[k]!
        return `<div class="ch"><h2>${t} · ${c.score ?? '—'}/100</h2><p>${esc(c.summary)}</p><ul class="iss">${c.points.map(([m, x]) => `<li>${markIcon(m)}<span>${esc(x)}</span></li>`).join('')}</ul></div>`
      }).join('')}
      ${r.recommendations.length ? `<div class="ch"><h2>Unsere Empfehlungen</h2>${r.recommendations.map(([p, h, x]) => `<p><span class="small">${esc(p)}</span><br><b>${esc(h)}</b> — ${esc(x)}</p>`).join('')}</div>` : ''}
      ${r.items?.length ? `<div class="ch"><h2>Unser Angebot</h2><ul class="iss">${r.items.map(i => `<li><span style="flex:1"><b>${esc(i.name)}</b>${i.description ? ` — ${esc(i.description)}` : ''}</span><span>${i.price} € ${i.unit === 'einmalig' ? 'einmalig' : 'pro Monat'}</span></li>`).join('')}</ul>${r.recommended?.why ? `<p>${esc(r.recommended.why)}</p>` : ''}<p class="small">Annehmen können Sie das Angebot in Ihrem Kundenbereich: ${esc(shortUrl(siteUrl()))}/kabinett</p></div>`
        : r.recommended ? `<div class="ch"><h2>Empfohlenes Paket</h2><p><b>${esc(r.recommended.name)}</b> · ${r.recommended.price} € ${r.recommended.unit === 'einmalig' ? 'einmalig' : 'pro Monat'}${r.recommended.why ? `<br>${esc(r.recommended.why)}` : ''}</p></div>` : ''}
      <p>Mit freundlichen Grüßen<br><b>Ihr RAG-Team</b></p>
    </div>`)}</section>`
}

function openPrint(title: string): Window | null {
  const w = window.open('', '_blank')
  if (!w) { alert('Das Druckfenster wurde blockiert — bitte Pop-ups für diese Seite erlauben.'); return null }
  w.document.write(`<!doctype html><html lang="de"><head><meta charset="utf-8"><title>${esc(title)}</title></head><body style="font:16px Arial;padding:40px">Wird vorbereitet…</body></html>`)
  return w
}
function fillPrint(w: Window, title: string, pages: string) {
  w.document.open()
  w.document.write(`<!doctype html><html lang="de"><head><meta charset="utf-8"><title>${esc(title)}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>${CSS}</style></head><body>
    <div class="hint">Drucken: Strg+P · Als Datei: im Druckdialog «Als PDF speichern» · Format A4, Ränder «Keine», Hintergrundgrafiken an</div>
    ${pages}
    <script>document.fonts && document.fonts.ready.then(function(){ setTimeout(function(){ window.print() }, 300) })</script>
    </body></html>`)
  w.document.close()
}

/** Briefe für Leads — eine Seite pro Unternehmen, alle in einem Dokument. */
export async function printLeadLetters(load: () => Promise<ProspectFull[]>): Promise<number> {
  const title = `RAG Briefe ${today()}`
  const w = openPrint(title)
  if (!w) return 0
  const list = (await load()).filter(p => p.report_draft)
  const pages = (await Promise.all(list.map(leadLetter))).join('')
  fillPrint(w, title, pages || '<p style="padding:40px">Keine geprüften Leads ausgewählt.</p>')
  return list.length
}

export async function printReport(r: ReportForPrint) {
  const title = `Sichtbarkeits-Check ${r.company}`
  const w = openPrint(title)
  if (w) fillPrint(w, title, reportDoc(r))
}
