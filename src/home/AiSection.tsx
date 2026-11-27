import CompanySearch from '../check/CompanySearch'
import { LineIcon, OutlineMark, PlatformIcon, resetGlow, trackGlow } from './icons'

// Dunkle Sektion «Ihre Kunden fragen KI. Fällt Ihr Name?» mit ChatGPT-Beispiel im iPad
// und dem KI-Sichtbarkeits-Check (Suchfeld → /check).
export default function AiSection() {
  return (
    <section className="rx-ai-section" data-theme="dark" id="ki" aria-labelledby="rx-ki-title">
      <div className="rx-container">
        <div className="rx-ai-story">
          <div className="rx-ai-copy">
            <h2 id="rx-ki-title">
              Ihre Kunden
              <br />
              fragen KI.
              <br />
              <em>Fällt Ihr Name?</em>
            </h2>
            <p>
              Die Suche verändert sich. Menschen fragen ChatGPT, Gemini, Perplexity und Claude nach dem passenden Betrieb – und bekommen
              direkt eine Empfehlung.
            </p>
            <div className="rx-ai-platforms" aria-label="KI-Plattformen">
              {[
                ['chatgpt', 'ChatGPT'] as const,
                ['googlegemini', 'Gemini'] as const,
                ['perplexity', 'Perplexity'] as const,
                ['claude', 'Claude'] as const,
              ].map(([e, t]) => (
                <span key={e}>
                  <PlatformIcon platform={e} />
                  <span>{t}</span>
                </span>
              ))}
            </div>
            <a className="rx-ai-detail-link" href="/leistungen/ki-sichtbarkeit">
              {'So entsteht KI-Sichtbarkeit '}
              <LineIcon kind="arrow" />
            </a>
          </div>
          <figure className="rx-gpt-example" aria-label="Ausschnitt eines ChatGPT-Beispiels im iPad-Mockup">
            <div className="rx-gpt-preview">
              <div className="rx-gpt-device-crop">
                <div className="rx-tablet-frame">
                  <span className="rx-tablet-camera" aria-hidden="true" />
                  <div className="rx-gpt-window">
                    <div className="rx-gpt-topbar">
                      <PlatformIcon platform="chatgpt" />
                      <strong>ChatGPT</strong>
                      <LineIcon kind="chevron" />
                    </div>
                    <div className="rx-gpt-conversation">
                      <div className="rx-gpt-question">Wer ist der beste Maler in Köln?</div>
                      <div className="rx-gpt-response">
                        <p>
                          <strong>Mein erster Tipp: Max Mustermann</strong>
                          {' – für Anstriche und Renovierungen in Köln.'}
                        </p>
                        <p>Diese drei Betriebe würde ich anfragen:</p>
                        <table className="rx-gpt-comparison">
                          <thead>
                            <tr>
                              <th scope="col">Betrieb</th>
                              <th scope="col">Schwerpunkt</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>
                                <span>Max Mustermann</span>
                              </td>
                              <td>Innenanstriche</td>
                            </tr>
                            <tr>
                              <td>
                                <span>Beispiel & Team</span>
                              </td>
                              <td>Fassaden</td>
                            </tr>
                            <tr>
                              <td>
                                <span>Farbraum Muster</span>
                              </td>
                              <td>Altbau</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="rx-gpt-preview-fade" aria-hidden="true" />
              <div className="rx-gpt-preview-action">
                <a
                  className="rx-button rx-glow-check"
                  href="#ki-check"
                  aria-label="KI-Sichtbarkeit Ihres Unternehmens prüfen"
                  onPointerEnter={trackGlow}
                  onPointerMove={trackGlow}
                  onPointerLeave={resetGlow}
                  onBlur={resetGlow}
                >
                  <span className="rx-glow-check-top" aria-hidden="true" />
                  <span className="rx-glow-check-label">
                    {'Was sagt KI über Sie? '}
                    <LineIcon kind="arrow" />
                  </span>
                </a>
              </div>
            </div>
          </figure>
        </div>
        <div className="rx-ai-check-wrap" onPointerEnter={trackGlow} onPointerMove={trackGlow} onPointerLeave={resetGlow}>
          <div className="rx-ai-check" id="ki-check" aria-labelledby="rx-ai-check-title">
            <div className="rx-ai-check-atmosphere" aria-hidden="true">
              <span className="rx-ai-orbit rx-ai-orbit-chatgpt">
                <OutlineMark platform="chatgpt" />
              </span>
              <span className="rx-ai-orbit rx-ai-orbit-gemini">
                <OutlineMark platform="googlegemini" />
              </span>
              <span className="rx-ai-orbit rx-ai-orbit-perplexity">
                <OutlineMark platform="perplexity" />
              </span>
              <span className="rx-ai-orbit rx-ai-orbit-claude">
                <OutlineMark platform="claude" />
              </span>
            </div>
            <h3 id="rx-ai-check-title">
              Ihr KI-Sichtbarkeits-Check.
              <br />
              {'Was sagt KI '}
              <em>über Sie?</em>
            </h3>
            <div
              className="rx-ai-check-search"
              onPointerEnter={trackGlow}
              onPointerMove={trackGlow}
              onPointerLeave={resetGlow}
              onBlur={resetGlow}
            >
              <CompanySearch
                variant="plain"
                buttonLabel="Unternehmen finden"
                placeholder="Ihr Firmenname und Ort"
                inputLabel="Name Ihres Unternehmens und Ort"
                sourcePage="/#ki-check"
              />
              <p className="rx-ai-check-note">Kostenlos & unverbindlich</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
