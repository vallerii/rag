// ─────────────────────────────────────────────────────────────────────────────
// Rechtstexte: Impressum (§ 5 DDG), Datenschutzerklärung (DSGVO), AGB (nur B2B).
// Stand 07.10.2026 — Entwurf auf Basis der tatsächlich eingesetzten Dienste.
// Vor dem Livegang: Firmendaten in src/company.ts ausfüllen und die Texte
// einmal von Anwalt/Rechtstext-Dienst (z. B. IT-Recht Kanzlei, eRecht24) prüfen lassen.
// Wenn ein neuer Dienst dazukommt (Analyse, Newsletter-Tool, Chat …) → Datenschutz ergänzen.
// ─────────────────────────────────────────────────────────────────────────────
import { COMPANY, TERMS, fill, phoneHref, priceNote } from '../company'

export const LEGAL_UPDATED = '07.10.2026'

const h2: React.CSSProperties = { fontSize: 'clamp(19px, 1.8vw, 24px)', lineHeight: 1.25, margin: '40px 0 12px', fontWeight: 700 }
const h3: React.CSSProperties = { fontSize: 16.5, lineHeight: 1.35, margin: '24px 0 8px', fontWeight: 700 }
const p: React.CSSProperties = { fontSize: 15.5, lineHeight: 1.8, color: 'var(--muted)', margin: '0 0 12px' }
const ul: React.CSSProperties = { ...p, paddingLeft: 22 }

function Todo({ v, label }: { v: string; label: string }) {
  return v.trim() ? <>{v}</> : <mark style={{ backgroundColor: '#FFF3C4', color: 'inherit', padding: '0 4px', borderRadius: 4 }}>{fill(v, label)}</mark>
}

function Address() {
  const c = COMPANY
  return (
    <p style={p}>
      <Todo v={c.legalName} label="Firmenname mit Rechtsform" /><br />
      <Todo v={c.street} label="Straße und Hausnummer" /><br />
      <Todo v={c.zip} label="PLZ" /> <Todo v={c.city} label="Ort" /><br />
      {c.country}
    </p>
  )
}

// ── Impressum ────────────────────────────────────────────────────────────────
export function ImpressumBody() {
  const c = COMPANY
  return (
    <>
      <h2 style={{ ...h2, marginTop: 0 }}>Angaben gemäß § 5 DDG</h2>
      <Address />
      <p style={p}>Vertreten durch: <Todo v={c.representative} label="Geschäftsführer/Inhaber" /></p>

      <h2 style={h2}>Kontakt</h2>
      <p style={p}>
        Telefon: {c.phone ? <a href={phoneHref()} className="ul">{c.phone}</a> : <Todo v="" label="Telefonnummer" />}<br />
        E-Mail: <a href={`mailto:${c.email}`} className="ul">{c.email}</a>
      </p>

      {(c.registerCourt || c.registerNumber || !c.ready) && (
        <>
          <h2 style={h2}>Registereintrag</h2>
          <p style={p}>
            Registergericht: <Todo v={c.registerCourt} label="Amtsgericht — nur bei GmbH/UG, sonst Abschnitt entfernen" /><br />
            Registernummer: <Todo v={c.registerNumber} label="HRB …" />
          </p>
        </>
      )}

      <h2 style={h2}>Umsatzsteuer</h2>
      <p style={p}>
        {c.smallBusiness
          ? 'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung).'
          : <>Umsatzsteuer-Identifikationsnummer gemäß § 27 a UStG: <Todo v={c.vatId} label="DE…" /></>}
      </p>

      <h2 style={h2}>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
      <p style={p}><Todo v={c.contentResponsible || c.representative} label="Name" />, Anschrift wie oben</p>

      <h2 style={h2}>Verbraucherstreitbeilegung</h2>
      <p style={p}>Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen. Unsere Leistungen richten sich ausschließlich an Unternehmen.</p>

      <h2 style={h2}>Haftung für Inhalte und Links</h2>
      <p style={p}>Wir erstellen die Inhalte dieser Website mit Sorgfalt. Für Inhalte externer Websites, auf die wir verlinken, sind deren Betreiber verantwortlich. Werden uns Rechtsverletzungen bekannt, entfernen wir die betroffenen Inhalte oder Links umgehend.</p>
    </>
  )
}

// ── Datenschutzerklärung ─────────────────────────────────────────────────────
export function DatenschutzBody() {
  const c = COMPANY
  return (
    <>
      <p style={p}>Hier erklären wir, welche personenbezogenen Daten wir auf dieser Website und in Ihrem Kundenbereich verarbeiten, wozu und auf welcher Rechtsgrundlage. Wir verwenden keine Werbe- oder Tracking-Cookies und geben keine Daten zu Werbezwecken weiter.</p>

      <h2 style={h2}>1. Verantwortlicher</h2>
      <Address />
      <p style={p}>E-Mail: <a href={`mailto:${c.email}`} className="ul">{c.email}</a>{c.phone ? <> · Telefon: {c.phone}</> : null}</p>
      <p style={p}>Einen Datenschutzbeauftragten müssen wir nach § 38 BDSG nicht benennen. Für alle Fragen zum Datenschutz erreichen Sie uns unter der E-Mail-Adresse oben.</p>

      <h2 style={h2}>2. Aufruf der Website (Hosting)</h2>
      <p style={p}>Die Website wird bei Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA gehostet. Beim Aufruf verarbeitet Vercel technisch notwendige Daten: IP-Adresse, Datum und Uhrzeit, aufgerufene Seite, Referrer, Browser und Betriebssystem. Das ist nötig, um die Seite auszuliefern und vor Angriffen zu schützen (Art. 6 Abs. 1 lit. f DSGVO). Server-Logs werden nach spätestens 30 Tagen gelöscht. Vercel ist unter dem EU-US Data Privacy Framework zertifiziert; zusätzlich besteht ein Auftragsverarbeitungsvertrag mit Standardvertragsklauseln.</p>

      <h2 style={h2}>3. Speicher im Browser (keine Tracking-Cookies)</h2>
      <p style={p}>Wir speichern im lokalen Speicher Ihres Browsers nur, was für die von Ihnen gewünschten Funktionen unbedingt nötig ist (§ 25 Abs. 2 Nr. 2 TDDDG):</p>
      <ul style={ul}>
        <li>Ihre Sprachwahl (Deutsch/Russisch),</li>
        <li>Ihre Anmeldung im Kundenbereich (Sitzungs-Token), solange Sie angemeldet sind,</li>
        <li>während eines Sichtbarkeits-Checks: einen vorübergehenden Prüf-Pass des Bot-Schutzes (Abschnitt 6).</li>
      </ul>
      <p style={p}>Eine Einwilligung (Cookie-Banner) ist dafür nicht erforderlich. Sie können den Speicher jederzeit in Ihrem Browser löschen.</p>

      <h2 style={h2}>4. Schriften</h2>
      <p style={p}>Die Schrift «Manrope» wird von unserem eigenen Server geladen. Es wird keine Verbindung zu Google Fonts oder anderen Schriftanbietern aufgebaut.</p>

      <h2 style={h2}>5. Sichtbarkeits-Check und Kundenbereich</h2>
      <h3 style={h3}>Unternehmenssuche</h3>
      <p style={p}>Wenn Sie Ihr Unternehmen suchen, senden wir den Suchbegriff von unserem Server an die Google Places API (Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland). Ihre IP-Adresse wird dabei nicht an Google übermittelt. Zurück kommen öffentliche Angaben aus dem Google-Unternehmensprofil (Name, Adresse, Bewertungen usw.).</p>
      <h3 style={h3}>Konto und Prüfung</h3>
      <p style={p}>Für den Check legen Sie ein Konto an. Wir speichern E-Mail-Adresse, Passwort (nur als verschlüsselter Hash), Name, Telefonnummer, das gewählte Unternehmen, die angegebenen Website- und Social-Media-Adressen, Ihre Nachrichten an uns, Termine, Angebote und den Prüfbericht. Für den Bericht rufen wir Ihre Website ab, prüfen öffentliche Angaben (z. B. Impressum, Datenschutz, Sitemap) und messen die Ladezeit über Google PageSpeed Insights. Rechtsgrundlage ist die Durchführung des von Ihnen angefragten Checks bzw. Vertrags (Art. 6 Abs. 1 lit. b DSGVO).</p>
      <p style={p}>Datenbank und Anmeldung betreibt Supabase Inc. (970 Toa Payoh North #07-04, Singapur) als Auftragsverarbeiter; die Daten liegen auf Servern in der EU (Frankfurt am Main). Ein Auftragsverarbeitungsvertrag mit Standardvertragsklauseln besteht.</p>
      <h3 style={h3}>Speicherdauer</h3>
      <p style={p}>Kontodaten speichern wir, bis Sie Ihr Konto löschen — das geht jederzeit selbst unter «Konto» im Kundenbereich. Kommt kein Vertrag zustande, löschen wir Anfragen spätestens 24 Monate nach dem letzten Kontakt. Daten, die wir aus steuer- und handelsrechtlichen Gründen aufbewahren müssen (Rechnungen, Verträge), löschen wir nach Ablauf der gesetzlichen Fristen (6 bzw. 10 Jahre).</p>

      <h2 style={h2}>6. Schutz vor Bots (Cloudflare Turnstile)</h2>
      <p style={p}>Unternehmenssuche, Registrierung, Anmeldung und «Passwort vergessen» schützen wir mit Cloudflare Turnstile (Cloudflare, Inc., 101 Townsend St., San Francisco, CA 94107, USA). Turnstile prüft anhand technischer Merkmale Ihres Browsers und Ihrer IP-Adresse, ob ein Mensch die Seite nutzt — ohne Bilderrätsel und ohne Cookies zu Werbezwecken. Zweck ist der Schutz vor Missbrauch und automatisierten Anfragen, die uns Kosten verursachen (Art. 6 Abs. 1 lit. f DSGVO). Cloudflare ist unter dem EU-US Data Privacy Framework zertifiziert. Mehr: <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener" className="ul">cloudflare.com/privacypolicy</a>.</p>

      <h2 style={h2}>7. Terminbuchung</h2>
      <p style={p}>Für Termine verlinken wir auf die Terminbuchung von Google Kalender. Erst wenn Sie den Link öffnen, verarbeitet Google Ihre Angaben (Name, E-Mail, gewählter Termin) nach der Datenschutzerklärung von Google. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Anbahnung eines Vertrags).</p>

      <h2 style={h2}>8. Kontakt per E-Mail und Telefon</h2>
      <p style={p}>Wenn Sie uns schreiben oder anrufen, verarbeiten wir Ihre Angaben, um die Anfrage zu beantworten (Art. 6 Abs. 1 lit. b bzw. f DSGVO). Systemmails (Bestätigung, Passwort zurücksetzen, Bericht ist fertig) versenden wir über unseren E-Mail-Dienst als Auftragsverarbeiter.</p>

      <h2 style={h2}>9. Tipps per E-Mail (nur mit Einwilligung)</h2>
      <p style={p}>Gelegentliche Tipps zur lokalen Sichtbarkeit schicken wir nur, wenn Sie das bei der Registrierung ausdrücklich angekreuzt haben (Art. 6 Abs. 1 lit. a DSGVO, § 7 Abs. 2 UWG). Wir speichern dazu Zeitpunkt und Inhalt Ihrer Einwilligung. Sie können sie jederzeit ohne Angabe von Gründen widerrufen — per Abmeldelink in jeder E-Mail oder formlos an {c.email}.</p>

      <h2 style={h2}>10. Bewertungsanfragen für unsere Kunden</h2>
      <p style={p}>Wenn wir für ein Kundenunternehmen dessen Kunden um eine Bewertung bitten (Link oder QR-Code), handeln wir im Auftrag dieses Unternehmens (Art. 28 DSGVO). Verantwortlich ist dann das Kundenunternehmen; es stellt sicher, dass für Anfragen per E-Mail oder SMS eine Einwilligung vorliegt.</p>

      <h2 style={h2}>11. Webanalyse</h2>
      <p style={p}>Derzeit setzen wir keine Webanalyse ein. Sollte sich das ändern, informieren wir hier vorab und holen — wo nötig — Ihre Einwilligung ein.</p>

      <h2 style={h2}>12. Ihre Rechte</h2>
      <p style={p}>Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) sowie auf Widerruf erteilter Einwilligungen mit Wirkung für die Zukunft (Art. 7 Abs. 3). Eine E-Mail an {c.email} genügt.</p>
      <p style={{ ...p, fontWeight: 600, color: 'var(--ink)' }}>Widerspruchsrecht: Verarbeiten wir Daten auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO, können Sie aus Gründen, die sich aus Ihrer besonderen Situation ergeben, jederzeit widersprechen (Art. 21 DSGVO).</p>
      <p style={p}>Sie können sich außerdem bei einer Datenschutz-Aufsichtsbehörde beschweren, z. B. in dem Bundesland, in dem Sie wohnen oder in dem wir unseren Sitz haben (Art. 77 DSGVO).</p>
      <p style={p}>Eine automatisierte Entscheidungsfindung im Sinne von Art. 22 DSGVO findet nicht statt. Den Prüfbericht erstellt unser Team; automatisch gesammelte Werte sind nur Grundlage dafür.</p>
    </>
  )
}

// ── AGB ──────────────────────────────────────────────────────────────────────
export function AgbBody() {
  const c = COMPANY
  const n = (k: number, t: string) => <h2 style={h2}>§ {k} {t}</h2>
  return (
    <>
      <p style={p}>Allgemeine Geschäftsbedingungen von <Todo v={c.legalName} label="Firmenname mit Rechtsform" /> («RAG», «wir») für Leistungen rund um lokale Sichtbarkeit.</p>

      {n(1, 'Geltungsbereich')}
      <p style={p}>(1) Diese AGB gelten für alle Verträge zwischen uns und unseren Kunden. Unsere Leistungen richten sich ausschließlich an Unternehmer im Sinne von § 14 BGB, juristische Personen des öffentlichen Rechts und öffentlich-rechtliche Sondervermögen — nicht an Verbraucher.</p>
      <p style={p}>(2) Abweichende Bedingungen des Kunden gelten nur, wenn wir ihnen ausdrücklich in Textform zustimmen.</p>

      {n(2, 'Vertragsschluss')}
      <p style={p}>(1) Eine Anfrage über die Website, den Sichtbarkeits-Check oder den Kundenbereich ist noch kein Auftrag. Nach einem Gespräch erhält der Kunde ein Angebot im Kundenbereich oder in Textform.</p>
      <p style={p}>(2) Der Vertrag kommt zustande, wenn der Kunde das Angebot annimmt — per Klick auf «Angebot annehmen» im Kundenbereich oder in Textform — und wir die Annahme bestätigen. Der kostenlose Sichtbarkeits-Check begründet keine Zahlungspflicht.</p>

      {n(3, 'Leistungen')}
      <p style={p}>(1) Umfang und Inhalt der Leistungen ergeben sich aus dem angenommenen Angebot und der Paketbeschreibung auf <a href="/preise" className="ul">/preise</a> zum Zeitpunkt der Annahme.</p>
      <p style={p}>(2) Wir schulden die vereinbarte Arbeit, nicht einen bestimmten Erfolg. Insbesondere garantieren wir keine bestimmten Platzierungen bei Google, Google Maps, in KI-Assistenten (ChatGPT, Perplexity, Gemini u. a.) oder sozialen Netzwerken, keine Anzahl an Bewertungen, Anrufen oder Aufträgen. Diese Systeme werden von Dritten betrieben, die ihre Regeln jederzeit ändern können.</p>
      <p style={p}>(3) Wir dürfen Subunternehmer und technische Dienstleister einsetzen. Wir bleiben gegenüber dem Kunden verantwortlich.</p>

      {n(4, 'Mitwirkung des Kunden')}
      <p style={p}>(1) Der Kunde stellt rechtzeitig die nötigen Informationen, Zugänge (z. B. zum Google-Unternehmensprofil), Fotos und Freigaben bereit. Verzögert sich die Mitwirkung, verschieben sich Termine entsprechend; die Vergütung für laufende Pakete bleibt geschuldet.</p>
      <p style={p}>(2) Der Kunde versichert, dass er an den übergebenen Inhalten (Texte, Fotos, Logos) die nötigen Rechte hat und dass abgebildete Personen einverstanden sind. Er stellt uns von Ansprüchen Dritter frei, die auf einer Verletzung dieser Pflicht beruhen.</p>
      <p style={p}>(3) Der Kunde prüft Inhalte vor der Freigabe auf fachliche und rechtliche Richtigkeit (z. B. Preise, Leistungsversprechen, Pflichtangaben seiner Branche).</p>

      {n(5, 'Bewertungen')}
      <p style={p}>(1) Wir helfen, echte Bewertungen von echten Kunden zu erhalten (z. B. per Link oder QR-Code). Wir kaufen, erfinden oder filtern keine Bewertungen und bitten nicht nur zufriedene Kunden um eine Bewertung. Gegenleistungen für Bewertungen (Rabatte, Geschenke) bietet der Kunde nicht an.</p>
      <p style={p}>(2) Bewertungsanfragen per E-Mail, SMS oder Messenger an Kunden des Kunden versenden wir nur, wenn der Kunde zusichert, dass dafür eine Einwilligung des Empfängers vorliegt (§ 7 UWG). Für die Rechtmäßigkeit der Kontaktdaten ist der Kunde verantwortlich.</p>

      {n(6, 'Preise und Zahlung')}
      <p style={p}>(1) Es gelten die Preise des angenommenen Angebots. {priceNote()}</p>
      <p style={p}>(2) Einmalige Leistungen (z. B. Google-Profil schlüsselfertig) werden nach Fertigstellung berechnet. Monatspakete werden monatlich im Voraus berechnet, erstmals ab dem Monat, in dem wir mit der Arbeit beginnen.</p>
      <p style={p}>(3) Rechnungen sind innerhalb von 14 Tagen ohne Abzug zahlbar. Kosten Dritter, die der Kunde ausdrücklich beauftragt (z. B. Werbebudgets, Fotografen, Druck), trägt er direkt oder sie werden gesondert abgerechnet.</p>

      {n(7, 'Laufzeit und Kündigung')}
      <p style={p}>(1) Monatspakete (Websites, Social-Media-Betreuung) haben eine Mindestlaufzeit von {TERMS.minTermMonths} Monaten. Danach laufen sie auf unbestimmte Zeit und können von beiden Seiten mit einer Frist von {TERMS.noticeDays} Tagen zum Monatsende gekündigt werden.</p>
      <p style={p}>(2) Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt, z. B. bei Zahlungsverzug von mehr als zwei Monatsbeiträgen.</p>
      <p style={p}>(3) Kündigungen bedürfen der Textform (E-Mail genügt).</p>

      {n(8, 'Was dem Kunden gehört — auch nach Vertragsende')}
      <p style={p}>(1) <strong>Google-Unternehmensprofil und Social-Media-Konten</strong> gehören dem Kunden. Der Kunde ist bzw. bleibt Inhaber; wir arbeiten mit einem eigenen Verwalter-Zugang, den wir bei Vertragsende abgeben.</p>
      <p style={p}>(2) <strong>Domain:</strong> Domains, die wir für den Kunden registrieren, werden auf den Namen des Kunden registriert. Bei Vertragsende übertragen wir die Domain auf Wunsch kostenlos (Auth-Code bzw. Providerwechsel). Laufende Registrierungsgebühren bis dahin sind im Paket enthalten.</p>
      <p style={p}>(3) <strong>Inhalte:</strong> Texte, Fotos und Logos, die der Kunde liefert oder die wir für ihn erstellen und die er bezahlt hat, darf er nach Vertragsende uneingeschränkt weiter nutzen. Auf Wunsch übergeben wir sie gesammelt als Dateien.</p>
      <p style={p}>(4) <strong>Website:</strong> Die Website läuft während der Vertragslaufzeit auf unserer Technik (Vorlagen, Hosting, Wartung). Bei Vertragsende erhält der Kunde auf Wunsch einen Export der Website mit allen Inhalten als statische Dateien, die bei jedem Hoster betrieben werden können. Ein Anspruch auf unsere Quellcode-Vorlagen und Werkzeuge besteht nicht.</p>

      {n(9, 'Haftung')}
      <p style={p}>(1) Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit, für Schäden aus der Verletzung von Leben, Körper oder Gesundheit sowie nach dem Produkthaftungsgesetz.</p>
      <p style={p}>(2) Bei leicht fahrlässiger Verletzung wesentlicher Vertragspflichten haften wir begrenzt auf den vertragstypischen, vorhersehbaren Schaden, höchstens auf die Vergütung der letzten zwölf Monate. Im Übrigen ist die Haftung für leichte Fahrlässigkeit ausgeschlossen.</p>
      <p style={p}>(3) Für Entscheidungen, Ausfälle oder Regeländerungen von Google, Meta, KI-Anbietern und anderen Plattformen sowie für Sperrungen, die auf Angaben des Kunden beruhen, haften wir nicht.</p>

      {n(10, 'Datenschutz und Auftragsverarbeitung')}
      <p style={p}>Soweit wir im Auftrag des Kunden personenbezogene Daten verarbeiten (z. B. Kontaktdaten seiner Kunden für Bewertungsanfragen), schließen wir einen Vertrag zur Auftragsverarbeitung nach Art. 28 DSGVO. Im Übrigen gilt unsere <a href="/datenschutz" className="ul">Datenschutzerklärung</a>.</p>

      {n(11, 'Referenzen')}
      <p style={p}>Wir nennen den Kunden nur mit seiner ausdrücklichen Zustimmung als Referenz oder in Fallbeispielen.</p>

      {n(12, 'Schlussbestimmungen')}
      <p style={p}>(1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.</p>
      <p style={p}>(2) Gerichtsstand für alle Streitigkeiten ist unser Sitz (<Todo v={c.city} label="Ort" />), soweit der Kunde Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen ist.</p>
      <p style={p}>(3) Sollte eine Bestimmung unwirksam sein, bleibt der Vertrag im Übrigen wirksam.</p>
    </>
  )
}

/** Kurzfassung für /preise («Gut zu wissen»). */
export const PRICE_FACTS: [string, string][] = [
  ['Preise', priceNote() + ' Unsere Angebote richten sich an Unternehmen.'],
  ['Laufzeit', `Monatspakete: Mindestlaufzeit ${TERMS.minTermMonths} Monate, danach monatlich kündbar (${TERMS.noticeDays} Tage zum Monatsende). Das Google-Profil ist eine Einmalzahlung — ohne Abo.`],
  ['Ihr Eigentum', 'Google-Profil, Social-Media-Konten und Domain laufen auf Ihren Namen. Kündigen Sie, nehmen Sie alles mit — die Website auf Wunsch als Export.'],
]
