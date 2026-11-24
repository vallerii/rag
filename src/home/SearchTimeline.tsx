import { useEffect, useRef } from 'react'
import { mountSearchTimeline } from './motion'

// «Google Search schaut nicht nur auf Ihre Website.» — gepinnte Szene: Suchfeld, das Google-G wächst,
// fünf Quellen-Karten blättern durch, am Ende der Bestell-Link.
export default function SearchTimeline() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => (ref.current ? mountSearchTimeline(ref.current) : undefined), [])
  return (
    <>
      <div id="approved-search" ref={ref}>
        <svg className="svg-library" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <symbol id="i-update" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="16" rx="3" />
            <path d="M3 9h18M7 6.5h.01M10 6.5h.01M12 12v5m-2.5-2.5h5" />
          </symbol>
          <symbol id="i-project" viewBox="0 0 24 24">
            <path d="m4 10 8-6 8 6v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM9 4V2h6v2" />
            <path d="m8 14 3 3 5-6" />
          </symbol>
          <symbol id="i-social" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <path d="M17.5 6.5h.01" />
          </symbol>
          <symbol id="i-reviews" viewBox="0 0 24 24">
            <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" />
            <path d="m12.5 6.7 1.1 2.2 2.4.4-1.7 1.7.4 2.4-2.2-1.1-2.2 1.1.4-2.4L9 9.3l2.4-.4z" />
          </symbol>
          <symbol id="i-directory" viewBox="0 0 24 24">
            <path d="M4 4h6v16H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1ZM10 4h10a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H10M14 8h3M14 12h3M14 16h3" />
          </symbol>
          <symbol id="i-search" viewBox="0 0 24 24">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m15.5 15.5 5 5" />
          </symbol>
          <symbol id="i-check" viewBox="0 0 24 24">
            <path d="m5 12 4 4L19 6" />
          </symbol>
          <symbol id="i-pin" viewBox="0 0 24 24">
            <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
            <circle cx="12" cy="10" r="2.5" />
          </symbol>
        </svg>
        <section className="google-search-section" id="website" aria-labelledby="search-title">
          <section className="search-timeline" aria-label="Google Search und Ihre Sichtbarkeit im Netz">
            <div className="search-scene" data-phase="search">
              <header className="scene-heading">
                <h2 id="search-title">
                  <span>Google Search schaut</span>
                  <span>
                    nicht nur auf <em>Ihre Website.</em>
                  </span>
                </h2>
              </header>
              <div className="scene-stage">
                <div className="google-backdrop" aria-hidden="true">
                  <svg className="google-backdrop-mark" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
                    <path
                      fill="#4285f4"
                      d="M43.61 24.46c0-1.36-.12-2.66-.35-3.92H24v7.41h11a9.4 9.4 0 0 1-4.08 6.17v5h6.6c3.87-3.56 6.09-8.81 6.09-14.66Z"
                    />
                    <path
                      fill="#34a853"
                      d="M24 44c5.4 0 9.93-1.79 13.23-4.88l-6.6-5c-1.83 1.23-4.17 1.97-6.63 1.97-5.22 0-9.65-3.52-11.24-8.26H5.94v5.15A20 20 0 0 0 24 44Z"
                    />
                    <path
                      fill="#fbbc05"
                      d="M12.76 27.83A12 12 0 0 1 12.13 24c0-1.32.23-2.6.63-3.83v-5.15H5.94A20 20 0 0 0 4 24c0 3.23.76 6.28 1.94 8.98l6.82-5.15Z"
                    />
                    <path
                      fill="#ea4335"
                      d="M24 11.91c2.9 0 5.5 1 7.55 2.98l5.66-5.66A19 19 0 0 0 24 4 20 20 0 0 0 5.94 15.02l6.82 5.15c1.59-4.74 6.02-8.26 11.24-8.26Z"
                    />
                  </svg>
                </div>
                <div className="scene-layer search-layer is-visible">
                  <div className="search-light" aria-label="Gestaltungsbeispiel einer Google-Suche">
                    <div className="search-row">
                      <svg className="google-mark" viewBox="0 0 48 48" aria-label="Google" role="img">
                        <path
                          fill="#4285f4"
                          d="M43.61 24.46c0-1.36-.12-2.66-.35-3.92H24v7.41h11a9.4 9.4 0 0 1-4.08 6.17v5h6.6c3.87-3.56 6.09-8.81 6.09-14.66Z"
                        />
                        <path
                          fill="#34a853"
                          d="M24 44c5.4 0 9.93-1.79 13.23-4.88l-6.6-5c-1.83 1.23-4.17 1.97-6.63 1.97-5.22 0-9.65-3.52-11.24-8.26H5.94v5.15A20 20 0 0 0 24 44Z"
                        />
                        <path
                          fill="#fbbc05"
                          d="M12.76 27.83A12 12 0 0 1 12.13 24c0-1.32.23-2.6.63-3.83v-5.15H5.94A20 20 0 0 0 4 24c0 3.23.76 6.28 1.94 8.98l6.82-5.15Z"
                        />
                        <path
                          fill="#ea4335"
                          d="M24 11.91c2.9 0 5.5 1 7.55 2.98l5.66-5.66A19 19 0 0 0 24 4 20 20 0 0 0 5.94 15.02l6.82 5.15c1.59-4.74 6.02-8.26 11.24-8.26Z"
                        />
                      </svg>
                      <div className="search-field">
                        <span>Elektriker in Stuttgart</span>
                        <svg className="icon" aria-hidden="true">
                          <use href="#i-search" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="scene-layer cards-layer">
                  <h3 className="source-eyebrow" id="sources-title">
                    Google schaut <strong>ins ganze Netz.</strong>
                  </h3>
                  <div className="card-stack">
                    <article className="source-card" data-card="0" aria-label="Regelmäßige Updates auf Ihrer Website">
                      <figure
                        className="card-photo"
                        style={{ '--photo-position': '50% 33%', '--mobile-photo-position': '50% 24%' } as React.CSSProperties}
                      >
                        <img
                          src="/rag-photos/beratung.webp"
                          width="600"
                          height="600"
                          alt="Unternehmerin in ihrem Büro"
                          decoding="async"
                          fetchPriority="high"
                        />
                        <figcaption className="photo-note">
                          <svg className="icon">
                            <use href="#i-update" />
                          </svg>
                          <span>
                            <strong>Neu auf unserer Website</strong>
                            <small>Aktuelles aus dem Betrieb</small>
                          </span>
                        </figcaption>
                      </figure>
                      <div className="card-copy">
                        <p className="card-category">
                          <svg className="icon">
                            <use href="#i-update" />
                          </svg>
                          Ihre Website
                        </p>
                        <h3>
                          Regelmäßige
                          <br />
                          Updates.
                        </h3>
                        <p className="card-description">
                          Neue Leistungen, aktuelle Informationen und frische Inhalte auf Ihrer Website zeigen, was in Ihrem Betrieb
                          passiert.
                        </p>
                      </div>
                    </article>
                    <article className="source-card" data-card="1" aria-label="Abgeschlossene Projekte auf Ihrer Website">
                      <figure
                        className="card-photo"
                        style={{ '--photo-position': '48% 38%', '--mobile-photo-position': '50% 33%' } as React.CSSProperties}
                      >
                        <img
                          src="/rag-photos/sanierung.webp"
                          width="600"
                          height="600"
                          alt="Handwerkerteam bei einem abgeschlossenen Renovierungsprojekt"
                          decoding="async"
                        />
                        <figcaption className="photo-note">
                          <svg className="icon">
                            <use href="#i-check" />
                          </svg>
                          <span>
                            <strong>Projekt abgeschlossen</strong>
                            <small>Ein Ergebnis, das sich sehen lässt</small>
                          </span>
                        </figcaption>
                      </figure>
                      <div className="card-copy">
                        <p className="card-category">
                          <svg className="icon">
                            <use href="#i-project" />
                          </svg>
                          Ihre Projekte
                        </p>
                        <h3>
                          Gute Arbeit.
                          <br />
                          Sichtbar gemacht.
                        </h3>
                        <p className="card-description">
                          Zeigen Sie Ihre abgeschlossenen Arbeiten: mit Fotos, dem Ort und einer klaren Beschreibung Ihrer Leistung.
                        </p>
                      </div>
                    </article>
                    <article className="source-card" data-card="2" aria-label="Aktuelle Beiträge in sozialen Netzwerken">
                      <figure
                        className="card-photo"
                        style={{ '--photo-position': '50% 40%', '--mobile-photo-position': '50% 27%' } as React.CSSProperties}
                      >
                        <img
                          src="/rag-photos/kosmetik.webp"
                          width="600"
                          height="600"
                          alt="Inhaberin eines lokalen Studios bei der Arbeit"
                          decoding="async"
                        />
                        <figcaption className="photo-note">
                          <svg className="icon">
                            <use href="#i-social" />
                          </svg>
                          <span>
                            <strong>Ein Blick hinter die Kulissen</strong>
                            <small>Menschen. Arbeit. Alltag.</small>
                          </span>
                        </figcaption>
                      </figure>
                      <div className="card-copy">
                        <p className="card-category">
                          <svg className="icon">
                            <use href="#i-social" />
                          </svg>
                          Ihre sozialen Netzwerke
                        </p>
                        <h3>
                          Einblicke aus
                          <br />
                          Ihrem Alltag.
                        </h3>
                        <p className="card-description">
                          Regelmäßige Beiträge zeigen Ihr Team, Ihre Arbeit und die Menschen hinter Ihrem Betrieb. Auch außerhalb Ihrer
                          Website.
                        </p>
                      </div>
                    </article>
                    <article className="source-card" data-card="3" aria-label="Google Maps, Bewertungen und Suchbegriffe in Rezensionen">
                      <figure
                        className="card-photo"
                        style={{ '--photo-position': '50% 32%', '--mobile-photo-position': '50% 25%' } as React.CSSProperties}
                      >
                        <img
                          src="/rag-photos/dentist.webp"
                          width="600"
                          height="600"
                          alt="Zahnarzt in einer lokalen Praxis"
                          decoding="async"
                        />
                        <figcaption className="photo-note">
                          <svg className="icon">
                            <use href="#i-reviews" />
                          </svg>
                          <span>
                            <strong>Echte Erfahrungen. Konkrete Worte.</strong>
                            <small>Was Ihre Kunden über Sie erzählen</small>
                          </span>
                        </figcaption>
                      </figure>
                      <div className="card-copy">
                        <p className="card-category">
                          <svg className="icon">
                            <use href="#i-reviews" />
                          </svg>
                          Google Maps & Bewertungen
                        </p>
                        <h3>
                          Was andere
                          <br />
                          über Sie sagen.
                        </h3>
                        <p className="card-description">
                          Ihr Google-Profil, echte Bewertungen und ihre Texte. Auch die Leistungen und Schlüsselwörter, die Ihre Kunden
                          darin nennen, gehören zum Bild Ihres Betriebs.
                        </p>
                      </div>
                    </article>
                    <article className="source-card" data-card="4" aria-label="Einträge in lokalen Verzeichnissen und Branchenbüchern">
                      <figure
                        className="card-photo"
                        style={{ '--photo-position': '50% 39%', '--mobile-photo-position': '50% 29%' } as React.CSSProperties}
                      >
                        <img
                          src="/rag-photos/handwerk.webp"
                          width="600"
                          height="600"
                          alt="Lokaler Handwerksbetrieb vor einem Haus in der Region"
                          decoding="async"
                        />
                        <figcaption className="photo-note">
                          <svg className="icon">
                            <use href="#i-pin" />
                          </svg>
                          <span>
                            <strong>Hier in Ihrer Region</strong>
                            <small>Ein Betrieb. Klare Informationen.</small>
                          </span>
                        </figcaption>
                      </figure>
                      <div className="card-copy">
                        <p className="card-category">
                          <svg className="icon">
                            <use href="#i-directory" />
                          </svg>
                          Lokale Verzeichnisse
                        </p>
                        <h3>
                          Auch in Ihrer
                          <br />
                          Nachbarschaft.
                        </h3>
                        <p className="card-description">
                          Lokale Branchenbücher und regionale Verzeichnisse: Ihr Name, Ihre Kontaktdaten und Ihr Angebot sollten überall
                          zusammenpassen.
                        </p>
                      </div>
                    </article>
                  </div>
                </div>
                <div className="scene-layer cta-layer">
                  <a className="order-link" href="/anfrage?pkg=profile&from=%2F">
                    <span>Google Optimierung</span>
                    <span>jetzt bestellen</span>
                  </a>
                </div>
              </div>
              <p className="sr-only" id="card-status" role="status" aria-live="polite" aria-atomic="true" />
            </div>
          </section>
          <div className="scene-exit" aria-hidden="true" />
        </section>
      </div>
    </>
  )
}
