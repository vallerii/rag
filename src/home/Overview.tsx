import { useEffect, useRef } from 'react'
import { PlatformIcon, type Platform } from './icons'

// «Ihre Kunden suchen an vielen Orten.» — Plattform-Leiste (springt beim Einblenden auf)
// und vier Kanal-Karten mit Licht, das dem Mauszeiger folgt.
function useLaunchpadReveal() {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const bar = ref.current?.querySelector<HTMLElement>('.platform-launchpad')
    if (!bar || matchMedia('(prefers-reduced-motion: reduce)').matches || bar.getBoundingClientRect().bottom <= 0) return
    bar.dataset.reveal = 'pending'
    const io = new IntersectionObserver(
      entries => {
        if (entries.some(en => en.isIntersecting)) {
          bar.dataset.reveal = 'shown'
          io.disconnect()
        }
      },
      { threshold: 0.35 },
    )
    io.observe(bar)
    return () => io.disconnect()
  }, [])
  return ref
}

function trackPointer(e: React.PointerEvent<HTMLElement>) {
  if (e.pointerType !== 'mouse' || matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const el = e.currentTarget
  const r = el.getBoundingClientRect()
  el.style.setProperty('--mx', `${e.clientX - r.left}px`)
  el.style.setProperty('--my', `${e.clientY - r.top}px`)
}
function resetPointer(e: React.PointerEvent<HTMLElement>) {
  e.currentTarget.style.removeProperty('--mx')
  e.currentTarget.style.removeProperty('--my')
}

const PLATFORMS: [string, Platform][] = [
  ['ChatGPT', 'chatgpt'],
  ['Perplexity', 'perplexity'],
  ['Gemini', 'gemini'],
  ['Google Maps', 'maps'],
  ['Google', 'google'],
  ['Instagram', 'instagram'],
  ['TikTok', 'tiktok'],
]

export default function Overview() {
  const ref = useLaunchpadReveal()
  return (
    <section ref={ref} className="rx-overview rx-container" id="leistungen" aria-labelledby="rx-visibility-overview-title">
      <svg className="svg-library" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="rx-overview-gemini-colors" x1="0" y1="1" x2="1" y2="0">
            <stop stopColor="#4785e9" />
            <stop offset=".45" stopColor="#8185ef" />
            <stop offset="1" stopColor="#bf83d5" />
          </linearGradient>
        </defs>
        <symbol id="rx-overview-brand-chatgpt" viewBox="27 27 126 126" fill="currentColor">
          <path d="M75.91 73.628V62.232c0-.96.36-1.68 1.199-2.16l22.912-13.194c3.119-1.8 6.838-2.639 10.676-2.639 14.394 0 23.511 11.157 23.511 23.032 0 .839 0 1.799-.12 2.758l-23.752-13.914c-1.439-.84-2.879-.84-4.318 0L75.91 73.627Zm53.499 44.383v-27.23c0-1.68-.72-2.88-2.159-3.719L97.142 69.55l9.836-5.638c.839-.48 1.559-.48 2.399 0l22.912 13.195c6.598 3.839 11.035 11.995 11.035 19.912 0 9.116-5.397 17.513-13.915 20.992v.001Zm-60.577-23.99-9.836-5.758c-.84-.48-1.2-1.2-1.2-2.16v-26.39c0-12.834 9.837-22.55 23.152-22.55 5.039 0 9.716 1.679 13.676 4.678L70.993 55.516c-1.44.84-2.16 2.039-2.16 3.719v34.787-.002Zm21.173 12.234L75.91 98.339V81.546l14.095-7.917 14.094 7.917v16.793l-14.094 7.916Zm9.056 36.467c-5.038 0-9.716-1.68-13.675-4.678l23.631-13.676c1.439-.839 2.159-2.038 2.159-3.718V85.863l9.956 5.757c.84.48 1.2 1.2 1.2 2.16v26.389c0 12.835-9.957 22.552-23.27 22.552v.001Zm-28.43-26.75L47.72 102.778c-6.599-3.84-11.036-11.996-11.036-19.913 0-9.236 5.518-17.513 14.034-20.992v27.35c0 1.68.72 2.879 2.16 3.718l29.989 17.393-9.837 5.638c-.84.48-1.56.48-2.399 0Zm-1.318 19.673c-13.555 0-23.512-10.196-23.512-22.792 0-.959.12-1.919.24-2.879l23.63 13.675c1.44.84 2.88.84 4.32 0l30.108-17.392v11.395c0 .96-.361 1.68-1.2 2.16l-22.912 13.194c-3.119 1.8-6.837 2.639-10.675 2.639Zm29.748 14.274c14.515 0 26.63-10.316 29.39-23.991 13.434-3.479 22.071-16.074 22.071-28.91 0-8.396-3.598-16.553-10.076-22.43.6-2.52.96-5.039.96-7.557 0-17.153-13.915-29.99-29.989-29.99-3.239 0-6.358.48-9.477 1.56-5.398-5.278-12.835-8.637-20.992-8.637-14.515 0-26.63 10.316-29.39 23.991-13.434 3.48-22.07 16.074-22.07 28.91 0 8.396 3.598 16.553 10.075 22.431-.6 2.519-.96 5.038-.96 7.556 0 17.154 13.915 29.989 29.99 29.989 3.238 0 6.357-.479 9.476-1.559 5.397 5.278 12.835 8.637 20.992 8.637Z" />
        </symbol>
        <symbol id="rx-overview-brand-gemini" viewBox="-1 -1 26 26" fill="url(#rx-overview-gemini-colors)">
          <path d="M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81" />
        </symbol>
        <symbol id="rx-overview-brand-perplexity" viewBox="-1 -1 26 26" fill="currentColor">
          <path d="M22.3977 7.0896h-2.3106V.0676l-7.5094 6.3542V.1577h-1.1554v6.1966L4.4904 0v7.0896H1.6023v10.3976h2.8882V24l6.932-6.3591v6.2005h1.1554v-6.0469l6.9318 6.1807v-6.4879h2.8882V7.0896zm-3.4657-4.531v4.531h-5.355l5.355-4.531zm-13.2862.0676 4.8691 4.4634H5.6458V2.6262zM2.7576 16.332V8.245h7.8476l-6.1149 6.1147v1.9723H2.7576zm2.8882 5.0404v-3.8852h.0001v-2.6488l5.7763-5.7764v7.0111l-5.7764 5.2993zm12.7086.0248-5.7766-5.1509V9.0618l5.7766 5.7766v6.5588zm2.8882-5.0652h-1.733v-1.9723L13.3948 8.245h7.8478v8.087z" />
        </symbol>
        <symbol id="rx-overview-brand-instagram" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077" />
        </symbol>
        <symbol id="rx-overview-brand-tiktok" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </symbol>
        <symbol id="rx-overview-brand-google" viewBox="0 0 48 48">
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
        </symbol>
        <symbol
          id="rx-overview-arrow-up-right"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 18 18 6M6 6h12v12" />
        </symbol>
      </svg>
      <div className="platform-launchpad" role="list" aria-label="Plattformen, auf denen Ihre Kunden suchen">
        {PLATFORMS.map(([e, t], n) => (
          <div
            key={t}
            className={`platform-mark platform-mark-${t}`}
            role="listitem"
            aria-label={e}
            style={{ '--platform-index': n } as React.CSSProperties}
          >
            <PlatformIcon platform={t} />
          </div>
        ))}
      </div>
      <div className="intro">
        <h2 id="rx-visibility-overview-title">
          Ihre Kunden suchen
          <br />
          <em>an vielen Orten.</em>
        </h2>
        <div className="intro-copy">
          <p>Heute suchen sie bei Google, auf Google Maps, mit ChatGPT und Perplexity — und in sozialen Netzwerken.</p>
          <p className="promise">Wir machen Sie und Ihr Angebot überall dort sichtbar. Gleichzeitig.</p>
        </div>
      </div>
      <div className="channels">
        <a
          className="channel channel-maps"
          onPointerMove={trackPointer}
          onPointerLeave={resetPointer}
          href="#maps"
          aria-label="Mehr über Google Maps erfahren"
        >
          <p className="eyebrow">Google Maps</p>
          <div className="channel-visual" aria-hidden="true">
            <div className="maps-art">
              <div className="map-grid" />
              <div className="map-park" />
              <div className="map-river" />
              <img className="maps-logo" src="/brands/google-maps.svg" width="67" height="67" alt="" />
              <span className="map-location">Leistung + Nähe = Sie</span>
            </div>
          </div>
          <h3>
            Ganz in der Nähe.
            <br />
            Genau richtig.
          </h3>
          <p className="description">
            In der Nähe gefunden werden, Bewertungen lesen und direkt Kontakt aufnehmen. Ihr Profil macht den Weg zu Ihnen einfach.
          </p>
          <span className="channel-link">
            Mehr erfahren
            <span className="arrow-circle">
              <svg>
                <use href="#rx-overview-arrow-up-right" />
              </svg>
            </span>
          </span>
        </a>
        <a
          className="channel channel-ai"
          onPointerMove={trackPointer}
          onPointerLeave={resetPointer}
          href="#ki"
          aria-label="Mehr über KI-Suche erfahren"
        >
          <p className="eyebrow">KI-Suche</p>
          <div className="channel-visual" aria-hidden="true">
            <div className="ai-orbit" />
            <div className="logo-tile gpt">
              <svg>
                <use href="#rx-overview-brand-chatgpt" />
              </svg>
            </div>
            <div className="logo-tile perplexity">
              <svg>
                <use href="#rx-overview-brand-perplexity" />
              </svg>
            </div>
            <div className="logo-tile gemini">
              <svg>
                <use href="#rx-overview-brand-gemini" />
              </svg>
            </div>
          </div>
          <h3>
            Auch die KI sollte
            <br />
            Sie kennen.
          </h3>
          <p className="description">
            Wenn Menschen nach Ihrer Leistung fragen, sollten KI-Systeme wissen, wer Sie sind und was Sie anbieten.
          </p>
          <span className="channel-link">
            Mehr erfahren
            <span className="arrow-circle">
              <svg>
                <use href="#rx-overview-arrow-up-right" />
              </svg>
            </span>
          </span>
        </a>
        <a
          className="channel channel-search"
          onPointerMove={trackPointer}
          onPointerLeave={resetPointer}
          href="#website"
          aria-label="Mehr über Website und Google Search erfahren"
        >
          <p className="eyebrow">Google Search</p>
          <div className="channel-visual" aria-hidden="true">
            <div className="google-art">
              <svg className="google-g" viewBox="0 0 48 48">
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
              <div className="search-pill">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="10" cy="10" r="6" />
                  <path d="m15 15 5 5" />
                </svg>
              </div>
            </div>
          </div>
          <h3>
            Ihre Leistung.
            <br />
            Klar gefunden.
          </h3>
          <p className="description">
            Was bieten Sie an? Wo sind Sie tätig? Eine klare Website hilft Menschen und Google, Ihr Angebot zu verstehen.
          </p>
          <span className="channel-link">
            Mehr erfahren
            <span className="arrow-circle">
              <svg>
                <use href="#rx-overview-arrow-up-right" />
              </svg>
            </span>
          </span>
        </a>
        <a
          className="channel channel-social"
          onPointerMove={trackPointer}
          onPointerLeave={resetPointer}
          href="#social"
          aria-label="Mehr über Social Media erfahren"
        >
          <p className="eyebrow">Social Media</p>
          <div className="channel-visual" aria-hidden="true">
            <div className="social-art">
              <div className="social-dotted-line" />
              <div className="logo-tile instagram">
                <svg>
                  <use href="#rx-overview-brand-instagram" />
                </svg>
              </div>
              <div className="logo-tile tiktok">
                <svg>
                  <use href="#rx-overview-brand-tiktok" />
                </svg>
              </div>
            </div>
          </div>
          <h3>
            Ein Gesicht.
            <br />
            Ein gutes Gefühl.
          </h3>
          <p className="description">
            Menschen, echte Arbeit und lebendige Einblicke machen Sie vertraut. Schon bevor jemand zum ersten Mal anruft.
          </p>
          <span className="channel-link">
            Mehr erfahren
            <span className="arrow-circle">
              <svg>
                <use href="#rx-overview-arrow-up-right" />
              </svg>
            </span>
          </span>
        </a>
      </div>
    </section>
  )
}
