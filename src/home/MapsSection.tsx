import { useEffect, useRef } from 'react'
import { mountMaps } from './motion'

// «Nicht auf Google Maps? Für viele unsichtbar.» — drei fiktive Profile fächern sich beim Scrollen auf,
// rechts läuft eine Artikelkarte mit; sie öffnet den Ratgeber-Text als Dialog.
export default function MapsSection() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => (ref.current ? mountMaps(ref.current) : undefined), [])
  return (
    <>
      <div id="approved-maps" ref={ref}>
        <section className="maps-scroll" id="maps-scroll" aria-labelledby="maps-title">
          <div className="maps-section" id="maps">
            <div className="maps-copy">
              <h2 id="maps-title">
                Nicht auf
                <br />
                Google Maps?<em>Für viele unsichtbar.</em>
              </h2>
            </div>
            <div className="maps-visual">
              <div className="profile-stack" role="group" aria-label="Drei fiktive Google-Maps-Beispielprofile">
                <article className="profile-card profile-layer-0" aria-label="Fiktives Beispiel: Max Fliesenleger">
                  <div className="profile-picture">
                    <img className="profile-photo" src="/rag-photos/handwerk.webp" alt="" width="288" height="215" />
                    <span className="maps-badge">
                      <img src="/brands/google-maps.svg" alt="Google Maps" width="23" height="32" />
                    </span>
                  </div>
                  <div className="profile-details">
                    <h3>Max Fliesenleger</h3>
                    <p>Fliesen & Badsanierung · Köln</p>
                    <div className="profile-rating">
                      <strong>4,8</strong>
                      <span className="stars" aria-label="5 Sterne">
                        ★★★★★
                      </span>
                    </div>
                    <span className="review-count">128 Bewertungen</span>
                  </div>
                </article>
                <article className="profile-card profile-layer-1" aria-label="Fiktives Beispiel: Elektro Gruppe West">
                  <div className="profile-picture">
                    <img className="profile-photo" src="/rag-photos/sanierung.webp" alt="" width="288" height="215" />
                    <span className="maps-badge">
                      <img src="/brands/google-maps.svg" alt="Google Maps" width="23" height="32" />
                    </span>
                  </div>
                  <div className="profile-details">
                    <h3>Elektro Gruppe West</h3>
                    <p>Elektroinstallation · Köln</p>
                    <div className="profile-rating">
                      <strong>4,9</strong>
                      <span className="stars" aria-label="5 Sterne">
                        ★★★★★
                      </span>
                    </div>
                    <span className="review-count">86 Bewertungen</span>
                  </div>
                </article>
                <article className="profile-card profile-layer-2" aria-label="Fiktives Beispiel: Studio Clara">
                  <div className="profile-picture">
                    <img className="profile-photo" src="/rag-photos/kosmetik.webp" alt="" width="288" height="215" />
                    <span className="maps-badge">
                      <img src="/brands/google-maps.svg" alt="Google Maps" width="23" height="32" />
                    </span>
                  </div>
                  <div className="profile-details">
                    <h3>Studio Clara</h3>
                    <p>Kosmetik & Hautpflege · Köln</p>
                    <div className="profile-rating">
                      <strong>4,9</strong>
                      <span className="stars" aria-label="5 Sterne">
                        ★★★★★
                      </span>
                    </div>
                    <span className="review-count">94 Bewertungen</span>
                  </div>
                </article>
              </div>
            </div>
            <aside className="maps-reading" aria-label="Mehr über Google-Bewertungen erfahren">
              <div className="article-motion" id="article-motion">
                <a
                  href="#review-article"
                  className="article-card"
                  data-open="review-article"
                  aria-haspopup="dialog"
                  aria-label="Artikel lesen: Warum Stichwörter in Bewertungen so wertvoll sind"
                >
                  <span className="article-copy">
                    <span className="article-meta">Artikel · 3 Min. Lesezeit</span>
                    <strong className="article-title">Warum Stichwörter in Bewertungen so wertvoll sind</strong>
                    <span className="article-read">Weiterlesen</span>
                  </span>
                </a>
              </div>
            </aside>
          </div>
        </section>
        <dialog id="review-article" aria-labelledby="article-title">
          <button className="dialog-close" type="button" aria-label="Artikel schließen" data-close="">
            ×
          </button>
          <article className="article-body">
            <span className="article-meta">Ratgeber · Google Maps · 3 Min. Lesezeit</span>
            <h2 id="article-title">Warum Stichwörter in Bewertungen so wertvoll sind</h2>
            <p>
              Eine gute Sternebewertung fällt auf. Der Text dahinter zeigt, was Kunden tatsächlich erlebt haben. Wer gerade einen Betrieb
              sucht, kann so besser einschätzen, ob dieser zu seinem eigenen Vorhaben passt.
            </p>
            <h3>Konkrete Erfahrungen machen den Unterschied</h3>
            <p>
              „Alles super“ freut jedes Team. Eine ausführlichere Bewertung erzählt zusätzlich, welche Arbeit erledigt wurde und was dabei
              überzeugt hat. Ein fiktives Beispiel:
            </p>
            <blockquote>
              „Unsere <mark>Badsanierung</mark> wurde sauber und termingerecht umgesetzt. Besonders die <mark>großformatigen Fliesen</mark>{' '}
              sind richtig schön geworden.“
            </blockquote>
            <p>
              Wer selbst ein Bad renovieren möchte, erkennt hier seine Aufgabe wieder. Die erwähnten Leistungen geben der Bewertung Kontext.
              Das ist der praktische Wert konkreter Begriffe: Menschen verstehen genauer, wofür ein Betrieb empfohlen wird.
            </p>
            <h3>Was Google dazu sagt</h3>
            <p>
              Google nennt Relevanz, Entfernung und Bekanntheit als zentrale Faktoren für lokale Suchergebnisse. Vollständige Angaben helfen
              dabei, ein Unternehmen passenden Anfragen zuzuordnen. Auch die Anzahl der Rezensionen und positive Bewertungen können das
              lokale Ranking unterstützen.
            </p>
            <p>
              Einzelne Stichwörter im Bewertungstext sind damit noch kein belegtes Rezept für bessere Positionen. Für Leser sind konkrete,
              ehrliche Beschreibungen jedoch eine wertvolle Entscheidungshilfe.
            </p>
            <h3>Ehrliches Feedback leicht machen</h3>
            <p>
              Bitte Kunden nach einem abgeschlossenen Auftrag um eine ehrliche Bewertung. Ein direkter Bewertungslink oder QR-Code verkürzt
              den Weg. Lass Kunden selbst entscheiden, was sie berichten möchten und welche Bewertung sie vergeben.
            </p>
            <p>
              Vorgegebene Suchbegriffe, fertige Lobtexte oder Belohnungen sind dafür der falsche Weg. Hilfreich ist ein einfacher Anlass:
              „Vielen Dank für dein Vertrauen. Wenn du deine Erfahrung teilen möchtest, freuen wir uns über eine ehrliche Bewertung.“
            </p>
            <h3>Das Profil muss das Versprechen einlösen</h3>
            <p>
              Ergänze deine Leistungen, aktuelle Kontaktdaten, Öffnungszeiten und aussagekräftige Fotos. Zusammen mit echten Rezensionen
              entsteht ein stimmiges Bild von deinem Betrieb. So können Interessenten den nächsten Schritt mit einem guten Gefühl machen.
            </p>
            <p className="sources">
              Weiterführend bei Google:
              <br />
              <a href="https://support.google.com/business/answer/7091?hl=de" target="_blank" rel="noopener noreferrer">
                Ranking in lokalen Suchergebnissen
              </a>
              <br />
              <a href="https://support.google.com/business/answer/3474122?hl=de" target="_blank" rel="noopener noreferrer">
                Tipps für mehr Rezensionen
              </a>
            </p>
          </article>
        </dialog>
      </div>
    </>
  )
}
