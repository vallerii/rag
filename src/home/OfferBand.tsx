import { useEffect, useRef } from 'react'
import { mountOfferBand } from './motion'

// Dunkles Band «Google-Profil. Fertig eingerichtet. 149 €» — wird beim Weiterscrollen zur kompakten Leiste unten.
export default function OfferBand() {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => (ref.current ? mountOfferBand(ref.current) : undefined), [])
  return (
    <>
      <div id="approved-offer" className="approved-offer-beat">
        <section ref={ref} id="new-block" className="rx-profile-cta rx-container" aria-labelledby="rx-order-title">
          <div className="rx-order-band">
            <div className="rx-order-copy">
              <span className="rx-order-logo">
                <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" viewBox="77.3 0 357.4 512">
                  <path
                    d="M310.1 8.5c-17-5.4-35.6-8.5-54.5-8.5C201.1 0 152 24.7 119.1 63.8l84.3 70.8z"
                    style={{ fill: '#1a73e8' } as React.CSSProperties}
                  />
                  <path
                    d="M119.1 63.8C93.2 94.7 77.3 135 77.3 178.3c0 33.6 6.6 60.7 17.8 85.1l108.3-128.8z"
                    style={{ fill: '#ea4335' } as React.CSSProperties}
                  />
                  <path
                    d="M256 110.2c37.9 0 68.4 30.5 68.4 68.4 0 16.6-6.2 32.1-16.2 44.1 0 0 53.8-64.2 106.3-126.5-21.7-41.8-59.2-73.5-104.4-87.8L203.4 134.6c12.8-14.7 31.3-24.4 52.6-24.4"
                    style={{ fill: '#4285f4' } as React.CSSProperties}
                  />
                  <path
                    d="M256 246.7c-37.9 0-68.4-30.5-68.4-68.4 0-16.6 5.8-32.1 15.9-43.7L95.1 263.3c18.6 41 49.5 74.2 81.2 115.6l131.9-156.6c-12.8 15.1-31.3 24.4-52.2 24.4"
                    style={{ fill: '#fbbc04' } as React.CSSProperties}
                  />
                  <path
                    d="M305.9 422.3c59.6-93.2 128.8-135.3 128.8-243.6 0-29.8-7.3-57.6-20.1-82.4L176.3 379c10.1 13.1 20.5 28.2 30.5 43.7 36.4 56.1 26.3 89.3 49.5 89.3s13.2-33.6 49.6-89.7"
                    style={{ fill: '#34a853' } as React.CSSProperties}
                  />
                </svg>
              </span>
              <h2 id="rx-order-title">
                Google-Profil. <em>Fertig eingerichtet.</em>
              </h2>
            </div>
            <div className="rx-order-price">
              <strong>149 €</strong>
              <small>
                <span className="rx-order-once">einmalig</span>
                <span className="rx-order-tax">
                  {' '}
                  · netto
                  <br />
                  zzgl. USt.
                </span>
              </small>
            </div>
            <a
              className="rx-order-button"
              href="/anfrage?pkg=profile&from=%2F"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Google-Profil für 149 Euro netto einmalig bestellen"
            >
              Jetzt bestellen
            </a>
          </div>
        </section>
      </div>
    </>
  )
}
