// ─────────────────────────────────────────────────────────────────────────────
// Firmendaten — EINE Stelle für Impressum, Footer, Kontakt, JSON-LD (Google/KI) und AGB.
// Vor dem Livegang alle Felder mit «TODO» ausfüllen. Solange `ready` false ist,
// zeigt die Website Platzhalter in eckigen Klammern und der Build gibt eine Warnung aus.
// Wichtig für die eigene Sichtbarkeit: Name, Adresse, Telefon hier exakt so schreiben
// wie im Google-Unternehmensprofil und in den Verzeichnissen (NAP-Konsistenz).
// ─────────────────────────────────────────────────────────────────────────────

export const COMPANY = {
  brand: 'RAG — Regionale Agentur',
  /** TODO: Firmenname mit Rechtsform, z. B. «RAG Regionale Agentur GmbH» oder «Max Muster, RAG Regionale Agentur». */
  legalName: '',
  /** TODO: Bei GmbH/UG: Geschäftsführer. Bei Einzelunternehmen: Inhaber. */
  representative: '',
  /** TODO: ladungsfähige Anschrift (kein Postfach). */
  street: '',
  zip: '',
  city: '',
  country: 'Deutschland',
  countryCode: 'DE',
  /** TODO: Telefon im internationalen Format, z. B. +49 30 1234567 (für tel:-Links ohne Leerzeichen). */
  phone: '',
  email: 'hallo@rag-agentur.de',
  /** TODO bei GmbH/UG: z. B. «Amtsgericht Berlin-Charlottenburg» und «HRB 123456 B». Sonst leer lassen. */
  registerCourt: '',
  registerNumber: '',
  /** TODO: USt-IdNr. (DE…), falls vorhanden. Bei Kleinunternehmer (§ 19 UStG) leer lassen und `smallBusiness` = true. */
  vatId: '',
  smallBusiness: false,
  /** Verantwortlich für redaktionelle Inhalte (§ 18 Abs. 2 MStV) — meist dieselbe Person wie oben. */
  contentResponsible: '',
  /** Profile für JSON-LD `sameAs` (Google-Profil-Link, LinkedIn, Instagram, Branchenbücher) — sobald angelegt. */
  sameAs: [] as string[],
  /** Erst auf true setzen, wenn alles oben echt ausgefüllt ist. */
  ready: false,
}

// Vertragsbedingungen, die auf /preise, in den AGB und in den FAQ stehen.
// TODO Inhaber: bestätigen oder ändern (offene Fragen aus dem Projekt).
export const TERMS = {
  /** Preise sind Nettopreise zzgl. gesetzlicher USt. (B2B). */
  pricesNet: true,
  vatRate: 19,
  /** Mindestlaufzeit der Monatspakete in Monaten, danach monatlich kündbar. */
  minTermMonths: 3,
  /** Kündigungsfrist nach der Mindestlaufzeit, in Tagen zum Monatsende. */
  noticeDays: 30,
}

export function priceNote(): string {
  if (COMPANY.smallBusiness) return 'Alle Preise ohne Umsatzsteuer (Kleinunternehmer, § 19 UStG).'
  return TERMS.pricesNet ? `Alle Preise netto zzgl. ${TERMS.vatRate} % USt.` : `Alle Preise inkl. ${TERMS.vatRate} % USt.`
}

/** Platzhalter, solange ein Feld leer ist. */
export const fill = (v: string, label: string) => v.trim() || `[${label}]`

export const phoneHref = () => `tel:${COMPANY.phone.replace(/[^\d+]/g, '')}`

/** schema.org-Daten der Agentur — für Google, Bing und KI-Assistenten. Nur echte Angaben, keine Platzhalter. */
export function organizationJsonLd(siteUrl: string) {
  const c = COMPANY
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': `${siteUrl}/#organization`,
    name: c.brand,
    url: `${siteUrl}/`,
    logo: `${siteUrl}/icon-512.png`,
    image: `${siteUrl}/og-image.png`,
    description: 'System für lokale Sichtbarkeit in Deutschland, Österreich und der Schweiz: Google Maps und Unternehmensprofil, Website und Google Search, KI-Suche (ChatGPT, Perplexity, Google AI Overviews), Bewertungen und Social Media.',
    areaServed: [
      { '@type': 'Country', name: 'Deutschland' },
      { '@type': 'Country', name: 'Österreich' },
      { '@type': 'Country', name: 'Schweiz' },
    ],
    knowsLanguage: ['de', 'ru'],
    email: c.email,
  }
  if (c.legalName) data.legalName = c.legalName
  if (c.phone) data.telephone = c.phone
  if (c.street && c.zip && c.city) {
    data.address = { '@type': 'PostalAddress', streetAddress: c.street, postalCode: c.zip, addressLocality: c.city, addressCountry: c.countryCode }
  }
  if (c.vatId) data.vatID = c.vatId
  if (c.sameAs.length) data.sameAs = c.sameAs
  return data
}
