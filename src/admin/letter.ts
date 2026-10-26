// Druckfertige Briefe im Stil eines sachlichen Amtsschreibens (DIN 5008, Form B — Anschrift im Fenster eines DIN-lang-Umschlags).
// Öffnet ein Druckfenster: drucken oder im Druckdialog «Als PDF speichern».
// Leads: Kurzanalyse aus den automatischen Prüfungen. Anfragen: veröffentlichter Prüfbericht.
// Bewusst ohne Hoheitszeichen, Behördennamen oder Zahlungsaufforderung: Absender ist immer klar RAG (UWG § 5).
import { COMPANY, TERMS, fill } from '../company'
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

/** Befund in Worten — wie in einem Prüfprotokoll, ohne farbige Symbole. */
const MARK_DE: Record<Mark, string> = { ok: 'erfüllt', warn: 'teilweise', bad: 'nicht erfüllt' }
/** Punkte → Bewertung nach Schulnoten-Logik (in Deutschland sofort verständlich). */
function grade(score: number | null | undefined): string {
  if (typeof score !== 'number') return '—'
  return score >= 90 ? 'sehr gut' : score >= 75 ? 'gut' : score >= 60 ? 'befriedigend' : score >= 45 ? 'ausreichend' : score >= 25 ? 'mangelhaft' : 'ungenügend'
}
const eur = (n: number) => n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const brandName = () => esc(COMPANY.legalName || 'RAG Regionale Agentur')
const sender = () => `${brandName()} · ${esc(fill(COMPANY.street, 'Straße'))} · ${esc(fill(COMPANY.zip, 'PLZ'))} ${esc(fill(COMPANY.city, 'Ort'))}`
const footer = () => `
  <div class="foot">
    <div><u>Anschrift</u><br>${brandName()}<br>${esc(fill(COMPANY.street, 'Straße'))}<br>${esc(fill(COMPANY.zip, 'PLZ'))} ${esc(fill(COMPANY.city, 'Ort'))}</div>
    <div><u>Kontakt</u><br>Telefon ${esc(fill(COMPANY.phone, 'Telefon'))}<br>${esc(COMPANY.email)}<br>${esc(shortUrl(siteUrl()))}</div>
    <div><u>Angaben zum Unternehmen</u><br>${COMPANY.representative ? `Geschäftsführung: ${esc(COMPANY.representative)}<br>` : '[Geschäftsführung]<br>'}${COMPANY.registerNumber ? `${esc(COMPANY.registerCourt)} ${esc(COMPANY.registerNumber)}<br>` : '[Handelsregister]<br>'}${COMPANY.vatId ? `USt-IdNr. ${esc(COMPANY.vatId)}` : '[USt-IdNr.]'}</div>
    ${COMPANY.iban ? `<div><u>Bankverbindung</u><br>${esc(COMPANY.bankName)}<br>IBAN ${esc(COMPANY.iban)}<br>BIC ${esc(COMPANY.bic)}</div>` : ''}
  </div>`

const CSS = `
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
body { margin: 0; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; color: #000; font-size: 10pt; line-height: 1.38; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.page { width: 210mm; height: 297mm; position: relative; overflow: hidden; page-break-after: always; background: #fff; }
.page.flow { height: auto; overflow: visible; }
.mono { font-family: 'Courier Prime', 'Courier New', Courier, monospace; }

/* Kopf: Absender wie bei einer Dienststelle — kurzer Balken, Name, Abteilung */
.head { position: absolute; top: 12mm; left: 25mm; right: 20mm; display: flex; justify-content: space-between; align-items: flex-start; }
.org { border-left: 1.6mm solid #000; padding-left: 3mm; line-height: 1.25; }
.org b { display: block; font-size: 13pt; letter-spacing: 0.01em; }
.org span { display: block; font-size: 9pt; }
.head .ref { font-size: 8pt; text-align: right; line-height: 1.45; }

.fold { position: absolute; left: 0; width: 5mm; border-top: 0.4pt solid #000; }
.ret { position: absolute; top: 47mm; left: 25mm; width: 85mm; font-size: 7pt; border-bottom: 0.4pt solid #000; padding-bottom: 0.5mm; white-space: nowrap; overflow: hidden; }
.qr { position: absolute; top: 27mm; left: 93mm; width: 16mm; height: 16mm; }
.qr svg { width: 100%; height: 100%; display: block; }
.qr-cap { position: absolute; top: 43.6mm; left: 93mm; width: 16mm; font-size: 5.5pt; text-align: center; letter-spacing: 0.03em; }
.addr { position: absolute; top: 55mm; left: 25mm; width: 80mm; font-size: 10.5pt; line-height: 1.38; }

/* Informationsblock: umrandete Felder wie «Auskunft erteilt» */
.info { position: absolute; top: 47mm; left: 125mm; width: 65mm; font-size: 8.5pt; line-height: 1.4; }
.box { border: 0.6pt solid #000; padding: 1mm 2mm 1.2mm; }
.box + .box { border-top: 0; }
.box small { display: block; font-size: 7pt; }
.box b { font-size: 9.5pt; }
.info dl { margin: 2.5mm 0 0; display: grid; grid-template-columns: auto 1fr; gap: 0.4mm 2mm; }
.info dt { white-space: nowrap; }
.info dd { margin: 0; font-weight: 700; }
.info .note { grid-column: 1 / -1; font-size: 7pt; font-weight: 400; margin-top: -0.6mm; }

.body { position: absolute; top: 98.5mm; left: 25mm; right: 20mm; }
.flow .body { position: static; padding: 98.5mm 20mm 0 25mm; }
.subj { font-weight: 700; font-size: 10.5pt; margin: 0 0 6mm; line-height: 1.35; }
.subj span { display: block; font-weight: 400; font-size: 9.5pt; }
p { margin: 0 0 2.6mm; }
h2 { font-size: 10pt; margin: 6mm 0 2mm; font-weight: 700; }
h2 .r { float: right; font-weight: 400; }

/* Tabellen im Stil eines Kontoauszugs / Prüfprotokolls */
table.t { width: 100%; border-collapse: collapse; margin: 2mm 0 3.5mm; font-size: 9pt; }
.t th, .t td { border: 0.6pt solid #000; padding: 1mm 2mm; vertical-align: top; text-align: left; }
.t thead th { font-family: Arial, sans-serif; font-weight: 700; font-size: 8.5pt; background: #EDEDED; }
.t td.mono, .t th.mono { font-size: 9.2pt; }
.t .num { text-align: right; white-space: nowrap; }
.t .res { white-space: nowrap; width: 27mm; }
.t .res.bad { font-weight: 700; }
.t tfoot td { font-weight: 700; border-top: 1.2pt solid #000; }
.t caption { caption-side: top; text-align: left; font-weight: 700; font-size: 9pt; padding-bottom: 1mm; }
.t .cap { display: flex; justify-content: space-between; }

ol.rec { margin: 0 0 3mm; padding-left: 6mm; }
ol.rec li { margin-bottom: 2mm; padding-left: 1mm; }
ol.rec small { font-size: 8pt; }

.hinw { border: 0.6pt solid #000; padding: 2.5mm 3mm; margin: 4mm 0; display: flex; gap: 4mm; align-items: center; }
.hinw svg { width: 20mm; height: 20mm; flex: none; }
.hinw .k { font-weight: 700; display: block; margin-bottom: 1mm; }
.hinw .url { font-weight: 700; }
.small { font-size: 7.8pt; line-height: 1.4; }
.sig { margin-top: 5mm; }
.mach { font-size: 8pt; margin-top: 3mm; }

.foot { position: absolute; left: 25mm; right: 20mm; bottom: 9mm; display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 4mm; font-size: 6.8pt; border-top: 0.6pt solid #000; padding-top: 1.6mm; line-height: 1.42; }
.foot u { text-decoration: none; font-weight: 700; }
.flow .foot { position: static; margin: 10mm 20mm 0 25mm; break-inside: avoid; }
.ch { margin-bottom: 4mm; }
.ch h2 { break-after: avoid; }
.t tr { break-inside: avoid; }

/* Werbebrief muss auf eine Seite passen */
.lead { font-size: 9.4pt; line-height: 1.33; }
.lead .subj { margin-bottom: 4mm; }
.lead p { margin-bottom: 2mm; }
.lead table.t { margin: 1.5mm 0 2.5mm; font-size: 8.6pt; }
.lead .t th, .lead .t td { padding: 0.6mm 2mm; }
.lead .hinw { margin: 3mm 0; padding: 2mm 3mm; }
.lead .sig { margin-top: 3mm; }
.lead .small { font-size: 7.2pt; }
.keep { break-inside: avoid; }
.hint { position: fixed; top: 0; left: 0; right: 0; background: #000; color: #fff; padding: 10px 16px; font: 14px Arial, sans-serif; text-align: center; z-index: 9; }
@media print { .hint { display: none; } }
@media screen { body { background: #D9D9D9; } .page { margin: 50px auto 20px; box-shadow: 0 2px 14px rgba(0,0,0,.18); } .page.flow { min-height: 297mm; padding-bottom: 12mm; } }
`

const ROWS_CH = (channels: Record<string, { score: number | null } | undefined> | undefined) =>
  CHAN_DE.filter(([k]) => typeof channels?.[k]?.score === 'number').map(([k, t]) => ({ k, t, s: channels![k]!.score as number }))

/** Übersicht wie «Stand Ihres Kontos»: Prüfbereich, Bewertung, Punkte — unten die Gesamtbewertung. */
function scoreTable(channels: Record<string, { score: number | null } | undefined> | undefined, date: string) {
  const rows = ROWS_CH(channels)
  const total = rows.length ? Math.round(rows.reduce((a, r) => a + r.s, 0) / rows.length) : null
  return `<table class="t">
    <thead><tr><th>Prüfbereich</th><th style="width:34mm">Bewertung</th><th class="num" style="width:30mm">Punkte</th></tr></thead>
    <tbody>${rows.map((r, i) => `<tr><td>${i + 1}. ${esc(r.t)}</td><td class="mono">${grade(r.s)}</td><td class="mono num">${r.s} / 100</td></tr>`).join('')}</tbody>
    <tfoot><tr><td>Gesamtbewertung (Stand ${esc(date)})</td><td class="mono">${grade(total)}</td><td class="mono num">${total ?? '—'} / 100</td></tr></tfoot>
  </table>`
}

function findings(points: [Mark, string][], head = 'Prüfpunkt') {
  return `<table class="t"><thead><tr><th style="width:9mm">Nr.</th><th>${head}</th><th class="res">Ergebnis</th></tr></thead><tbody>
    ${points.map(([m, x], i) => `<tr><td class="mono">${i + 1}</td><td>${esc(x)}</td><td class="mono res ${m}">${MARK_DE[m]}</td></tr>`).join('')}
  </tbody></table>`
}

type Head = { ref: string; refNote?: string; date: string; kind: string; qr: string; qrCap: string; recipient: string; address: string[] }
const frame = (h: Head, inner: string) => `<span class="fold" style="top:105mm"></span><span class="fold" style="top:148.5mm;width:7mm"></span><span class="fold" style="top:210mm"></span>
  <div class="head">
    <div class="org"><b>${esc(COMPANY.brand.replace(/\s*—\s*/, ' · '))}</b><span>Prüfstelle für digitale Sichtbarkeit</span></div>
    <div class="ref">${esc(h.kind)}<br><span class="mono">${esc(h.ref)}</span></div>
  </div>
  ${h.qr ? `<div class="qr">${h.qr}</div><div class="qr-cap mono">${esc(h.qrCap)}</div>` : ''}
  <div class="ret">${sender()}</div>
  <div class="addr">${esc(h.recipient)}<br>${h.address.map(esc).join('<br>')}</div>
  <div class="info">
    <div class="box"><small>Auskunft erteilt:</small><b>RAG-Prüfteam</b></div>
    <div class="box"><small>Telefon / E-Mail:</small><b>${esc(fill(COMPANY.phone, 'Telefon'))}</b><br>${esc(COMPANY.email)}</div>
    <dl><dt>Aktenzeichen:</dt><dd class="mono">${esc(h.ref)}</dd>${h.refNote ? `<dd class="note">${esc(h.refNote)}</dd>` : ''}<dt>Datum:</dt><dd>${esc(h.date)}</dd></dl>
  </div>
  ${inner}${footer()}`

const MACH = '<p class="mach">Dieses Schreiben wurde maschinell erstellt und ist ohne Unterschrift gültig.</p>'

async function leadLetter(p: ProspectFull): Promise<string> {
  const link = `${siteUrl()}/check?c=${p.code}`
  const qr = await qrSvg(link)
  const comp = p.audit?.competitors
  const issues = (p.issues ?? []).slice(0, 5)
  // Steht die Position schon in den Problemen («Bei «…» …»), nicht doppelt erwähnen.
  const rankLine = comp?.query && !issues.some(i => i.text.startsWith('Bei «'))
    ? comp.rank && comp.rank <= 3 ? '' : `<p>Wer in Ihrer Region bei Google Maps nach «${esc(comp.query)}» sucht, findet Sie ${comp.rank ? `erst auf Platz ${comp.rank}` : 'nicht unter den ersten Treffern'}. Die ersten drei Einträge bekommen die meisten Anrufe.</p>`
    : ''
  const ref = `KA-${String(p.code).toUpperCase()}`
  return `<section class="page lead">${frame({ ref, refNote: '(Bitte bei Rückfragen angeben)', date: today(), kind: 'Kurzanalyse', qr, qrCap: 'ONLINE ABRUFEN', recipient: p.name, address: addressLines(p.address, p.city) }, `
    <div class="body">
      <div class="subj">Kurzanalyse Ihrer Sichtbarkeit bei Google, Google Maps und Social Media<span>Unternehmen: ${esc(p.name)}${p.city ? `, ${esc(p.city)}` : ''}</span></div>
      <p>Sehr geehrte Damen und Herren,</p>
      <p>wir haben geprüft, wie Ihr Unternehmen bei Google Maps, in der Google-Suche und in Social Media erscheint, dort, wo Kunden heute nach ${esc(p.category || 'Anbietern')} in ${esc(p.city || 'Ihrer Region')} suchen. Das Ergebnis im Überblick:</p>
      ${scoreTable(p.report_draft?.channels, today())}
      ${issues.length ? findings(issues.slice(0, rankLine ? 4 : 5).map(i => [i.mark, i.text] as [Mark, string]), 'Feststellung') : ''}
      ${rankLine}
      <div class="hinw"><div><span class="k">Abruf Ihrer ausführlichen Analyse (kostenlos und unverbindlich)</span>QR-Code oben im Anschriftfeld scannen oder im Browser eingeben: <span class="url mono">${esc(shortUrl(link))}</span><br><span class="small">Dort finden Sie zusätzlich Ihre Wettbewerber, Ihre Sichtbarkeit in KI-Assistenten wie ChatGPT und konkrete nächste Schritte.</span></div></div>
      <p class="sig">Mit freundlichen Grüßen<br>Ihr RAG-Prüfteam</p>
      <p class="small">Grundlage sind öffentlich zugängliche Daten (Google-Unternehmensprofil, Ihre Website), Stand ${today()}. Dies ist ein Schreiben eines privaten Dienstleisters, keine behördliche Mitteilung. Möchten Sie keine weiteren Schreiben erhalten, genügt eine kurze Nachricht an ${esc(COMPANY.email)}.</p>
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
  /** Kurzer Bezug für das Aktenzeichen (z. B. Anfang der Check-ID). */
  ref?: string
}

function reportRef(r: ReportForPrint) {
  const y = r.date.slice(-4)
  return `SC-${/^\d{4}$/.test(y) ? y : new Date().getFullYear()}-${(r.ref || 'X').slice(0, 8).toUpperCase()}${r.draft ? '' : `/${r.no}`}`
}

async function reportDoc(r: ReportForPrint): Promise<string> {
  const ref = reportRef(r)
  const qr = await qrSvg(`${siteUrl()}/kabinett`)
  const chans = CHAN_DE.filter(([k]) => r.channels[k])
  const once = (u: string) => u === 'einmalig'
  const items = r.items?.length ? r.items : r.recommended ? [{ name: r.recommended.name, description: '', price: r.recommended.price, unit: r.recommended.unit }] : []
  const sumOnce = items.filter(i => once(i.unit)).reduce((a, i) => a + i.price, 0)
  const sumMonth = items.filter(i => !once(i.unit)).reduce((a, i) => a + i.price, 0)
  const vat = TERMS.pricesNet ? `Alle Beträge netto zzgl. ${TERMS.vatRate} % USt.` : `Alle Beträge inkl. ${TERMS.vatRate} % USt.`
  return `<section class="page flow">${frame({ ref, refNote: '(Bitte bei Rückfragen angeben)', date: r.date, kind: r.draft ? 'Kurzanalyse (Entwurf)' : `Prüfbericht · Fassung ${r.no}`, qr, qrCap: 'KUNDENBEREICH', recipient: r.company, address: addressLines(r.address, r.city) }, `
    <div class="body">
      <div class="subj">${r.draft ? 'Kurzanalyse' : 'Prüfbericht'} zur digitalen Sichtbarkeit Ihres Unternehmens<span>Unternehmen: ${esc(r.company)}${r.draft ? '' : ` · Fassung ${r.no} vom ${esc(r.date)}`}</span></div>
      <p>Sehr geehrte Damen und Herren,</p>
      <p>wir haben die Auffindbarkeit Ihres Unternehmens in ${chans.length} Prüfbereichen untersucht. Nachstehend erhalten Sie das Ergebnis im Überblick, die Feststellungen je Prüfbereich und unsere Empfehlungen.</p>
      ${scoreTable(r.channels, r.date)}
      ${chans.map(([k, t], n) => {
        const c = r.channels[k]!
        return `<div class="ch"><h2>${n + 1}. ${t}<span class="r mono">${c.score ?? '—'} / 100 · ${grade(c.score)}</span></h2>${c.summary ? `<p>${esc(c.summary)}</p>` : ''}${c.points.length ? findings(c.points) : ''}</div>`
      }).join('')}
      ${r.recommendations.length ? `<div class="ch"><h2>${chans.length + 1}. Empfehlungen</h2><ol class="rec">${r.recommendations.map(([p, h, x]) => `<li><b>${esc(h)}</b>${p ? ` <small>(${esc(p)})</small>` : ''}<br>${esc(x)}</li>`).join('')}</ol></div>` : ''}
      ${items.length ? `<div class="ch"><h2>${chans.length + (r.recommendations.length ? 2 : 1)}. ${r.items?.length ? 'Unser Angebot' : 'Empfohlenes Paket'}</h2>
        <table class="t"><thead><tr><th style="width:11mm">Pos.</th><th>Leistung</th><th style="width:22mm">Turnus</th><th class="num" style="width:26mm">Betrag EUR</th></tr></thead>
        <tbody>${items.map((i, n) => `<tr><td class="mono">${n + 1}</td><td><b>${esc(i.name)}</b>${i.description ? `<br><span class="small">${esc(i.description)}</span>` : ''}</td><td class="mono">${once(i.unit) ? 'einmalig' : 'monatlich'}</td><td class="mono num">${eur(i.price)}</td></tr>`).join('')}</tbody>
        <tfoot>${sumOnce ? `<tr><td></td><td colspan="2">Summe einmalig</td><td class="mono num">${eur(sumOnce)}</td></tr>` : ''}${sumMonth ? `<tr><td></td><td colspan="2">Summe monatlich</td><td class="mono num">${eur(sumMonth)}</td></tr>` : ''}</tfoot></table>
        <p class="small">${vat}${r.recommended?.why ? ` ${esc(r.recommended.why)}` : ''}</p>
        <p class="small">Annehmen können Sie das Angebot in Ihrem Kundenbereich (QR-Code oben): ${esc(shortUrl(siteUrl()))}/kabinett</p></div>` : ''}
      <div class="keep"><p class="sig">Mit freundlichen Grüßen<br>Ihr RAG-Prüfteam</p>
      ${MACH}</div>
      <div class="ch keep"><h2>Hinweise</h2><p class="small">Grundlage der Prüfung sind öffentlich zugängliche Daten (Google-Unternehmensprofil, Google-Suche und Google Maps, Ihre Website, Social-Media-Profile, Antworten von KI-Assistenten) zum Stand ${esc(r.date)}. Die Punkte je Prüfbereich (0–100) ergeben sich aus den aufgeführten Prüfpunkten; die Gesamtbewertung ist ihr Durchschnitt. Ergebnisse können sich durch Änderungen bei Google und den Plattformen jederzeit ändern. Dies ist ein Bericht eines privaten Dienstleisters, keine behördliche Mitteilung.</p></div>
    </div>`)}</section>`
}

/** Folgeseiten des Berichts: Kopfzeile mit Aktenzeichen, Seitenzahl unten (Chrome-Seitenränder). */
const flowPageCss = (ref: string) => `
@page { size: A4; margin: 16mm 0 16mm 0;
  @top-right { content: "Aktenzeichen ${ref.replace(/["\\]/g, '')}"; font: 8pt Arial, sans-serif; padding-right: 20mm; padding-bottom: 4mm; vertical-align: bottom; }
  @bottom-right { content: "Seite " counter(page) " von " counter(pages); font: 8pt Arial, sans-serif; padding-right: 20mm; vertical-align: top; } }
@page :first { margin: 0 0 16mm 0; @top-right { content: none; } }`

function openPrint(title: string): Window | null {
  const w = window.open('', '_blank')
  if (!w) { alert('Das Druckfenster wurde blockiert. Bitte Pop-ups für diese Seite erlauben.'); return null }
  w.document.write(`<!doctype html><html lang="de"><head><meta charset="utf-8"><title>${esc(title)}</title></head><body style="font:16px Arial;padding:40px">Wird vorbereitet…</body></html>`)
  return w
}
function fillPrint(w: Window, title: string, pages: string, extraCss = '') {
  w.document.open()
  w.document.write(`<!doctype html><html lang="de"><head><meta charset="utf-8"><title>${esc(title)}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap" rel="stylesheet">
    <style>${CSS}${extraCss}</style></head><body>
    <div class="hint">Drucken: Strg+P · Als Datei: im Druckdialog «Als PDF speichern» · Format A4, Ränder «Standard», Hintergrundgrafiken an</div>
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
  const title = `Prüfbericht ${r.company}`
  const w = openPrint(title)
  if (w) fillPrint(w, title, await reportDoc(r), flowPageCss(reportRef(r)))
}

/** Nur für Vorschau/Tests. */
export const __preview = { leadLetter, reportDoc, CSS, flowPageCss, reportRef }
