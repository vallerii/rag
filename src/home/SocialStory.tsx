import { useEffect, useRef } from 'react'
import { mountSocialStory } from './motion'

// «Ihr Betrieb hat ein Gesicht. Zeigen Sie es.» — links ein Instagram-Feed, der beim Scrollen
// mitläuft, rechts wechseln die Texte (Menschen → Arbeit → Ergebnis → Artikel-Einladung).
// Hinweis: Die drei Beispiel-GIFs werden von giphy/tenor geladen; schlägt das fehl, erscheint das Foto.
export default function SocialStory() {
  const ref = useRef<HTMLElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => (ref.current ? mountSocialStory(ref.current) : undefined), [])
  return (
    <>
      <span className="rx-anchor-alias" id="social" aria-hidden="true" />
      <section ref={ref} aria-label="Social Media – Menschen, Arbeit, Ergebnis und Weiterlesen" className="rag-story" id="rag-story">
        <div className="rag-pin">
          <div className="rag-wrap">
            <div className="rag-columns">
              <div aria-label="Instagram-Beispiele" className="rag-ig">
                <div className="rag-ig-top">
                  <span className="rag-ig-logo">Instagram</span>
                  <div className="rag-ig-right">
                    <svg aria-hidden="true" className="rag-icon" viewBox="0 0 24 24">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" />
                    </svg>
                    <svg aria-hidden="true" className="rag-icon" viewBox="0 0 24 24">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="rag-post-window" id="rag-post-window">
                  <div className="rag-feed" id="rag-feed">
                    <article aria-label="Post: Die Menschen." className="rag-post" data-post="0">
                      <div className="rag-post-head">
                        <div className="rag-person">
                          <div className="rag-avatar">
                            <img alt="" src="/rag-photos/handwerk.webp" />
                          </div>
                          <div className="rag-person-id">
                            <strong>rheinbad.sanitaer</strong>
                            <span>Die Menschen. · Köln</span>
                          </div>
                        </div>
                        <span aria-hidden="true" className="rag-more">
                          ⋯
                        </span>
                      </div>
                      <div className="rag-media" data-gallery="0">
                        <div className="rag-gallery" data-gallery-track="0">
                          <div>
                            <img
                              alt="Die Menschen – Mitarbeiter im Betrieb"
                              data-animated-demo="true"
                              data-fallback-index="0"
                              data-fallback-src="/rag-photos/sanierung.webp"
                              decoding="async"
                              draggable="false"
                              loading="eager"
                              src="https://media.giphy.com/media/UtcFcy3RLGz7NC7qVw/giphy.gif"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="rag-post-actions">
                        <svg aria-hidden="true" className="rag-icon" viewBox="0 0 24 24">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" />
                        </svg>
                        <svg aria-hidden="true" className="rag-icon" viewBox="0 0 24 24">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        <svg aria-hidden="true" className="rag-icon" viewBox="0 0 24 24">
                          <path d="M22 2 11 13" />
                          <path d="M22 2 15 22l-4-9-9-4 20-7z" />
                        </svg>
                        <span className="rag-save">
                          <svg aria-hidden="true" className="rag-icon" viewBox="0 0 24 24">
                            <path d="M19 21 12 16 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                          </svg>
                        </span>
                      </div>
                      <div className="rag-post-caption">
                        <strong>rheinbad.sanitaer</strong> Das Gesicht hinter dem Betrieb — nahbar, echt und wiedererkennbar.
                      </div>
                    </article>
                    <article aria-label="Post: Die Arbeit." className="rag-post" data-post="1">
                      <div className="rag-post-head">
                        <div className="rag-person">
                          <div className="rag-avatar">
                            <img alt="" src="/rag-photos/beratung.webp" />
                          </div>
                          <div className="rag-person-id">
                            <strong>rheinbad.sanitaer</strong>
                            <span>Die Arbeit. · Köln</span>
                          </div>
                        </div>
                        <span aria-hidden="true" className="rag-more">
                          ⋯
                        </span>
                      </div>
                      <div className="rag-media" data-gallery="1">
                        <div className="rag-gallery" data-gallery-track="1">
                          <div>
                            <img
                              alt="Humorvolle Szene mit Werkzeugen aus einer Heimwerker-Sitcom"
                              data-animated-demo="true"
                              data-fallback-index="1"
                              data-fallback-src="/rag-photos/sanierung.webp"
                              decoding="async"
                              draggable="false"
                              loading="eager"
                              src="https://media.giphy.com/media/25JgMcsSndyuBkoaV2/giphy.gif"
                              style={{ objectFit: 'contain', background: '#eeeae5' } as React.CSSProperties}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="rag-post-actions">
                        <svg aria-hidden="true" className="rag-icon" viewBox="0 0 24 24">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" />
                        </svg>
                        <svg aria-hidden="true" className="rag-icon" viewBox="0 0 24 24">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        <svg aria-hidden="true" className="rag-icon" viewBox="0 0 24 24">
                          <path d="M22 2 11 13" />
                          <path d="M22 2 15 22l-4-9-9-4 20-7z" />
                        </svg>
                        <span className="rag-save">
                          <svg aria-hidden="true" className="rag-icon" viewBox="0 0 24 24">
                            <path d="M19 21 12 16 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                          </svg>
                        </span>
                      </div>
                      <div className="rag-post-caption">
                        <strong>rheinbad.sanitaer</strong> Ein Blick hinter die Kulissen: So entsteht Qualität Schritt für Schritt.
                      </div>
                    </article>
                    <article aria-label="Post: Das Ergebnis." className="rag-post" data-post="2">
                      <div className="rag-post-head">
                        <div className="rag-person">
                          <div className="rag-avatar">
                            <img alt="" src="/rag-photos/handwerk.webp" />
                          </div>
                          <div className="rag-person-id">
                            <strong>rheinbad.sanitaer</strong>
                            <span>Das Ergebnis. · Köln</span>
                          </div>
                        </div>
                        <span aria-hidden="true" className="rag-more">
                          ⋯
                        </span>
                      </div>
                      <div className="rag-media" data-gallery="2">
                        <div className="rag-gallery" data-gallery-track="2">
                          <div>
                            <img
                              alt="Das Ergebnis – humorvolle Fantasy-Demo: Gandalf mit Feuerwerk"
                              data-animated-demo="true"
                              data-fallback-index="2"
                              data-fallback-src="/rag-photos/sanierung.webp"
                              decoding="async"
                              draggable="false"
                              loading="eager"
                              src="https://media1.tenor.com/m/IG8vWE7O5HMAAAAd/gandalf-fireworks.gif"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="rag-post-actions">
                        <svg aria-hidden="true" className="rag-icon" viewBox="0 0 24 24">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" />
                        </svg>
                        <svg aria-hidden="true" className="rag-icon" viewBox="0 0 24 24">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        <svg aria-hidden="true" className="rag-icon" viewBox="0 0 24 24">
                          <path d="M22 2 11 13" />
                          <path d="M22 2 15 22l-4-9-9-4 20-7z" />
                        </svg>
                        <span className="rag-save">
                          <svg aria-hidden="true" className="rag-icon" viewBox="0 0 24 24">
                            <path d="M19 21 12 16 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                          </svg>
                        </span>
                      </div>
                      <div className="rag-post-caption">
                        <strong>rheinbad.sanitaer</strong> Das fertige Ergebnis schafft Klarheit und bleibt im Kopf.
                      </div>
                    </article>
                  </div>
                </div>
              </div>
              <div className="rag-copy">
                <h2>
                  <span className="rag-head-line">Ihr Betrieb hat ein Gesicht.</span>
                  <span className="rag-head-line">
                    <em>Zeigen Sie es.</em>
                  </span>
                </h2>
                <div className="rag-text-window" id="rag-text-window">
                  <div aria-hidden="false" className="rag-text-panel is-active" data-text-stage="0">
                    <h3>Die Menschen.</h3>
                    <p className="rag-description">
                      Menschen möchten sehen, <strong>mit wem sie arbeiten werden</strong>. Wer kommt zu ihnen nach Hause? Wer berät sie?
                      Genau daraus entstehen Nähe, Wiedererkennung und Vertrauen. Solche Posts machen einen lokalen Betrieb persönlicher und
                      nahbarer.
                    </p>
                  </div>
                  <div aria-hidden="true" className="rag-text-panel" data-text-stage="1">
                    <h3>Die Arbeit.</h3>
                    <p className="rag-description">
                      Zeigen Sie den <strong>Prozess Ihrer Arbeit</strong>. Solche Einblicke machen Professionalität sichtbar und geben
                      potenziellen Kunden das Gefühl, dass bei Ihnen sauber, strukturiert und zuverlässig gearbeitet wird.
                    </p>
                  </div>
                  <div aria-hidden="true" className="rag-text-panel" data-text-stage="2">
                    <h3>Das Ergebnis.</h3>
                    <p className="rag-description">
                      Am Ende möchten potenzielle Kunden vor allem <strong>Resultate</strong> sehen. Vorher, nachher, fertig umgesetzt —
                      genau solche Posts helfen bei der Entscheidung und bleiben im Kopf.
                    </p>
                  </div>
                  <div aria-hidden="true" className="rag-text-panel rag-text-panel--more" data-text-stage="3">
                    <div className="rag-related-holder">
                      <button
                        onClick={() => dialog.current?.showModal()}
                        aria-controls="rag-article-dialog"
                        aria-haspopup="dialog"
                        aria-label="Artikel lesen: Beziehungsaufbau auf Social Media für lokale Unternehmen"
                        className="rag-related-link"
                        id="rag-related-open"
                        type="button"
                      >
                        <span className="rag-related-photo">
                          <img alt="Lokales Handwerkerteam" src="/rag-photos/sanierung.webp" />
                        </span>
                        <span className="rag-related-copy">
                          <span className="rag-related-meta">
                            ARTIKEL{' '}
                            <span aria-hidden="true" className="rag-related-meta-sep">
                              ·
                            </span>{' '}
                            12 MIN. LESEZEIT
                          </span>
                          <span className="rag-related-title">Beziehungsaufbau auf Social Media für lokale Unternehmen</span>
                          <span className="rag-related-footer">Weiterlesen</span>
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <dialog
        ref={dialog}
        onClick={e => {
          if (e.target === e.currentTarget) e.currentTarget.close()
        }}
        aria-labelledby="rag-dialog-title"
        className="rag-article-dialog"
        id="rag-article-dialog"
      >
        <div className="rag-dialog-top">
          <span>RAG RATGEBER · ARTIKELVORSCHAU</span>
          <button
            aria-label="Artikel schließen"
            className="rag-dialog-close"
            id="rag-dialog-close"
            type="button"
            onClick={() => dialog.current?.close()}
          >
            ×
          </button>
        </div>
        <div className="rag-dialog-contents">
          <p className="rag-dialog-kicker">SOCIAL MEDIA FÜR LOKALE BETRIEBE</p>
          <h2 id="rag-dialog-title">Beziehungsaufbau auf Social Media für lokale Unternehmen</h2>
          <p className="rag-dialog-intro">
            Auf Instagram begegnen Menschen lokalen Unternehmen oft lange vor dem ersten Besuch. Wer sein Team, die Arbeit und echte
            Ergebnisse regelmäßig zeigt, wird in der Nachbarschaft vertraut – und kann aus Interessenten echte Fans machen.
          </p>
          <h3>1. Zeigen Sie die Menschen.</h3>
          <p>
            Vorstellung des Inhabers, des Teams und kurze Einblicke in den Alltag geben dem Betrieb ein Gesicht. Wer die Menschen hinter der
            Arbeit kennt, fasst leichter Vertrauen.
          </p>
          <h3>2. Zeigen Sie Ihre Arbeit.</h3>
          <p>
            Kurze Videos aus dem Prozess zeigen handwerkliche Sorgfalt, Arbeitsweise und Fachwissen. Authentische Momente bleiben oft
            stärker in Erinnerung als perfekt inszenierte Werbung.
          </p>
          <h3>3. Zeigen Sie Ergebnisse.</h3>
          <p>
            Vorher-Nachher-Vergleiche und fertige Projekte belegen, was Kunden erwarten können. So wird aus Interesse eine konkrete
            Vorstellung Ihrer Leistung.
          </p>
          <p>
            Regelmäßig gesehen zu werden, schafft Wiedererkennung. Die richtige Kombination aus Persönlichkeit, Prozess und Ergebnis kann
            lokale Empfehlungen und Anfragen unterstützen.
          </p>
          <div className="rag-dialog-end">
            <span>Vorschau für das RAG-Design · Artikel noch nicht veröffentlicht</span>
            <button id="rag-dialog-return" type="button" onClick={() => dialog.current?.close()}>
              Zurück zur Vorschau
            </button>
          </div>
        </div>
      </dialog>
    </>
  )
}
