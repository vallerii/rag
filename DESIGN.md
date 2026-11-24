# RAG — Stil «Recto» (Startseite → ganze Website)

Quelle: Branch `codex/rag-style-exploration` (Vorschau rag-style-exploration.vercel.app), Startseite ab 18.11.2026.
Code: `src/home/` (Startseite), `src/home/home.css` (alle Startseiten-Stile), `src/index.css` (globale Tokens + Unterseiten).
Diese Datei beschreibt, **wie** die Seite aussieht und sich bewegt, damit neue Seiten und Blöcke dazu passen.

---

## 1. Haltung

Ruhig, warm, redaktionell. Viel Luft, wenige starke Headlines, echte Menschen auf Fotos.
Kein «Agentur-Blau», keine Verläufe als Dekoration, keine Icons in bunten Kacheln.
Eine einzige Akzentfarbe (Orange) — sparsam, fast nur für das kursive Wort in der Headline,
den Bestell-Button und kleine Signale (Punkt im Logo, Häkchen, Glow).
Der Rest ist Schwarz/Grau auf warmem Papier.

## 2. Farben

| Token | Hell | Dunkel (`data-theme=dark`, KI-Sektion) | Wofür |
|---|---|---|---|
| `--rx-bg` | `#f7f6f4` warmes Papier | `#0c0c0d` | Seitenhintergrund |
| `--rx-surface` | `#ffffff` | `#161618` | Karten, Formulare |
| `--rx-inset` | `#eeedea` | `#1d1d20` | Vertiefte Flächen, Bild-Platzhalter |
| `--rx-warm` | `#f0eeea` | `#151517` | Weiche Bänder |
| `--rx-ink` | `#101114` | `#f3f2ef` | Text, Primär-Button |
| `--rx-muted` | `#5d6068` | `#a5a6ab` | Fließtext, Labels |
| `--rx-border` | `#10111414` (ink 8 %) | `#ffffff17` | Haarlinien 1 px |
| `--rx-accent` | `#ff5b2e` | `#ff5b2e` | Akzent (Orange) |
| Hover Akzent | `#ee4b20` | | Bestell-Button hover |

Ampel (nur Messwerte, Sichtbarkeitsindex): rot `#d93838` < 30 · gelb `#F2B800` 30–69 · grün `#26935b` ≥ 70.
Markenfarben (Google, Maps, Instagram …) nur in den Original-Logos, nie als Flächen.

**Unterseiten:** Die alten Variablen werden global auf die Recto-Palette umgebogen
(`--ink`→ink, `--electric`→ink (Primär = Schwarz), `--bone`→Papier, `--brand-soft`→`#f0eeea`,
neu `--accent`→Orange). Damit übernehmen alle bestehenden Komponenten (Check, Kabinett,
Leistungsseiten, Preise, Ratgeber) den Stil ohne Logikänderung.

## 3. Schrift

- **Recto Geist** (Geist, selbst gehostet `/recto/geist-*.woff2`, 400 + 500–700) — alles.
  Kyrillisch fällt auf `RAG Cyrillic Sans` (Manrope) zurück.
- **Recto Serif** (Instrument Serif *Italic*, `/recto/instrument-serif-italic.woff2`) — **nur** für
  das betonte Wort/den Halbsatz in Headlines (`<em>` in h1/h2), immer in `--rx-accent`, `font-size: 1.1em`,
  `letter-spacing: -.025em`. Nie für Fließtext, nie fett.
- Gewichte: Headlines **500** (nie 700/800), Fließtext 400, Buttons/Labels 500.
- Laufweite: Headlines eng (`-0.04em` … `-0.048em`), Wortmarke `-1.4px`.

| Rolle | Größe | Zeilenhöhe |
|---|---|---|
| H1 (Hero) | `clamp(42px, 6.1vw, 80px)` | 1.04 |
| H2 (Sektion) | `clamp(34px, 4vw, 52px)` (mobil 37px) | 1.06–1.08 |
| H3 (Karte) | 22–28px | 1.15 |
| Lead | 18px (mobil 15px), `--rx-muted` | 1.6 |
| Fließtext | 15px, `--rx-muted` | 1.7–1.8 |
| Label/Kicker | 12px, `--rx-muted` | — |
| Buttons | 12–14px, 500 | — |

Headline-Muster: zwei Zeilen, zweite Zeile kursiv-orange.
«Ihre Kunden suchen / *an vielen Orten.*» · «Gute Fragen. / *Klare Antworten.*»

## 4. Raster & Abstände

- **Eine Linie für alles:** Text und Blöcke beginnen dort, wo die Wortmarke beginnt. Seitenrand `--rx-edge` 48px (≤1100px: 28px, ≤640px: 16px), Inhaltsbreite `min(1280px, 100%) − 2 × Rand` (max. 1184px) — `.rx-container`, `SHELL` in App.tsx, Kopfzeile, Footer. Ausnahmen mit eigener Bühne: Google Maps (über die ganze Breite skaliert) und die zentrierte Google-Search-Szene.
- Sektionen: 64–112px vertikal (mobil ~68px). Zwischen Headline und Text 32px (`--rx-heading-copy-gap`), in Karten 20px.
- Zweispaltig: Text links / Bild rechts mit 64–80px Spalt; FAQ 0.8fr / 1.2fr, linke Spalte sticky.
- Breakpoints: 1100 · 1000 · 880 (Menü in zweite Zeile) · 760 (Scroll-Szenen werden statisch) · 640.

## 5. Formen & Flächen

- Radien: Karten 22px, Formular 19px, Fotos 16px, Eingabe 14–16px, Buttons/Pillen **999px**.
- Linien statt Schatten: 1px `--rx-border`. Schatten nur weich und tief, z. B.
  `0 24px 48px -22px #10111473` (Fotos), `0 25px 45px -30px #ff5b2e40` (Karte hover).
- Geräte-Rahmen (iPad) für Beispiele: 1px Rahmen, Radius 26px, Kamera-Punkt oben.
- Glas nur für die zurückkehrende Kopfzeile: `blur(22px) saturate(160%)`, weißer Verlauf 80→50 %.
- Dunkle Sektion (KI) setzt die Tokens lokal auf Dunkel um — kein Extra-CSS je Element nötig.

## 6. Bausteine

- **Wortmarke** `RAG<em>.</em>` — Geist 29px/500, Punkt in Recto Serif orange.
- **Kopfzeile**: Wortmarke links · Menü-Insel («Wo man Sie sucht» als Aufklappmenü mit den vier Leistungen + Überblick, Preise, Ratgeber) · Aktions-Insel
  (DE/RU, schwarzer Pill-Button «Sichtbarkeitsindex prüfen», Login-Icon).
- **Buttons**: `rx-primary` = Ink-Pill (schwarz, Text Papier), hover orange; `rx-secondary` = weiß mit Haarlinie;
  Bestellen = orange Pill `#ff5b2e`. Mindesthöhe 52px (mobil 46px), Padding 14×30.
- **Textlink**: 13px/500 mit Unterstrich-Linie `--rx-border` und Pfeil, hover Linie in Ink.
- **Kanal-Karte** (Overview): weiß, 22px, 28px Innenabstand, Eyebrow oben, H3, Text, unten «Mehr erfahren» + runder Pfeil.
- **Suchfeld** (Check): Fläche Papier, 1px Linie, Eingabe + schwarzer Pill-Button, darunter «Kostenlos & unverbindlich» 10px.
- **FAQ**: `<details name>` (immer nur eine offen), Trennlinien, «+» rechts.
- **Abschluss-Karte**: weiß, zentriert, orangefarbenes Glühen dahinter.
- **Aufklappmenü**: weißes Panel 22px, Haarlinie, Zeilen mit 40px-Icon-Kachel (`--rx-inset`, hover orange getönt); öffnet per Hover/Fokus/Tippen, Esc schließt, .22s Fade + leichtes Absenken.
- **404**: «4 📍 4» — Ziffern in Instrument Serif kursiv, in der Mitte schwebt der Google-Maps-Pin (3.6s), darunter die gesuchte Adresse als Suchfeld-Pille mit «0 Ergebnisse», vier Wegweiser-Karten und der Sichtbarkeits-Check.
- **Footer**: eine Zeile — Wortmarke · Links · Hell/Dunkel-Schalter.

## 7. Bewegung

Grundsatz: Bewegung erklärt (Scroll-Geschichte), sie dekoriert nicht. Alles respektiert
`prefers-reduced-motion` (dann statisch bzw. Endzustand).

| Element | Verhalten | Werte |
|---|---|---|
| Halo im Hero | atmet | `rx-breathe` 9s ease-in-out ∞ |
| Porträt-Fächer | Klick/←→ dreht den Fächer | transform .7s `cubic-bezier(.2,.8,.2,1)`, ±7°/Schritt |
| Primär-Buttons (Hero, Kopfzeile) | leiser oranger Lichtstreif | `soft-sweep` + `soft-breathe` 12s, Hero +1.5s versetzt |
| Kopfzeile | bleibt immer oben fixiert; ab 16px Scroll werden Menü- und Aktions-Insel zu Glas | Wortmarke Schwarz/Weiß nach Hintergrund-Helligkeit (< 0.48 → weiß) |
| Plattform-Leiste | springt beim Einblenden einzeln auf | `rx-platform-pop`, Index-versetzt, Schwelle 35 % |
| Kanal-Karten | Licht folgt Maus (`--mx/--my`), hover −4px + oranger Rand | .25s |
| KI-Check | Licht folgt Maus (`--rx-glow-x`), Orbits der KI-Marken | — |
| Google Maps | Profil-Fächer spreizt sich mit Scroll (`--spread` 0→1); Artikelkarte läuft linear mit, blendet weich ein/aus | Desktop > 760px, Zoom auf 1228.8px-Raster |
| 149-€-Band | Auslöser statt Scroll-Kopplung: steigt die Band-Mitte über 60 % der Fensterhöhe, fährt es in einer Bewegung zur kompakten Leiste unten, sein Platz schließt sich gleichzeitig (nächster Abschnitt rückt nach); zurück genauso; vor dem Seitenende ausgeblendet | 650 ms, ease-in-out-cubic, 40 px Hysterese |
| Google Search | gepinnte Szene: Suchfeld → G-Logo wächst ×20 → 5 Karten blättern (±3px/9px/1.2° je Tiefe) → CTA | Phasen 0–12 % / 12–80 % / ≥ 80 % |
| Social Media | Instagram-Feed scrollt mit, rechts Text-Wechsel (Menschen → Arbeit → Ergebnis → Artikel) | Feed bis 70 %, Artikel ab 80.5 % |
| Kanal-Geschichte | gepinnt, 13 Prüfpunkte in 4 Kanälen, Häkchen werden gesetzt, Fortschritt + «Weiter: …» unten | statisch bei ≤ 640px Höhe |
| Szenen-Übergänge | Ende einer gepinnten Szene (Search-CTA, Social-Artikel, letzter Kanal-Punkt) + ein Scroll nach unten → Seite gleitet zum nächsten Block (Search → Social → Kanal-Geschichte → Sichtbarkeitsindex); währenddessen Eingaben gesperrt; nur Desktop > 760px | 520–900 ms, ease-in-out-cubic |
| Sichtbarkeitsindex | iPad wechselt alle 4s, Zahlen/Ring zählen hoch | 1350ms, ease-out-cubic, Ampelfarben |

Easing-Standard: `cubic-bezier(.2,.7,.2,1)` (weich raus). Hover-Dauer .18–.25s. Nie Bounce außer beim Plattform-Pop.

## 8. Interaktion & Zugänglichkeit

- Fokus: 2px Outline in Ink, Offset 5px.
- Karussell: Punkte mit `aria-current`, Region `aria-roledescription="Karussell"`.
- Szenen-Ebenen, die gerade nicht sichtbar sind: `inert` + `aria-hidden`.
- Dialoge (Ratgeber-Vorschau) als `<dialog>`: Klick daneben oder × schließt.
- Alle Bewegungs-Effekte laufen nur im Browser; der Prerender liefert den statischen Endzustand (SEO).

## 9. Bilder

Warme, natürliche Porträts von Betriebsinhabern/Teams (Handwerk, Praxis, Studio), quadratisch, `object-fit: cover`,
Radius 16px. Beispiele sind immer als «Fiktives Beispiel» gekennzeichnet. Marken-Logos nur zur Kennzeichnung.

## 10. Regeln für neue Seiten

1. Kopfzeile `SiteHeader`, Fußzeile im Recto-Stil (`Footer` in App.tsx).
2. Headline 500, betonter Schluss in `<em>` → wird automatisch kursiv-orange (`.display em`, `.rx h2 em`).
   Für Texte aus Daten: `accent()` aus `src/home/accent.tsx` — `accent('Pflicht für *lokale Unternehmen*')`
   markiert explizit, ohne Sternchen wird der Teil nach «,»/«:»/«–» bzw. die letzten zwei Wörter betont.
   Gilt für H1 und Sektions-H2; nicht für Karten-, Produkt- und Artikel-Zwischenüberschriften.
3. Farben nur über Variablen (`var(--ink)`, `var(--muted)`, `var(--accent)` …), keine Hex-Werte im JSX.
4. Primäre Aktion = schwarze Pill; Kauf/Bestellung = orange Pill; sonst Textlink.
5. Pro Bildschirm höchstens ein oranger Akzent außer der Headline.
