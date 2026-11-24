import { BRAND_ICONS } from '../brandIcons'

// Symbole der Startseite im Recto-Stil. Marken-Logos nur zur Kennzeichnung der Plattformen.

export const CHATGPT_PATH = "M75.91 73.628V62.232c0-.96.36-1.68 1.199-2.16l22.912-13.194c3.119-1.8 6.838-2.639 10.676-2.639 14.394 0 23.511 11.157 23.511 23.032 0 .839 0 1.799-.12 2.758l-23.752-13.914c-1.439-.84-2.879-.84-4.318 0L75.91 73.627Zm53.499 44.383v-27.23c0-1.68-.72-2.88-2.159-3.719L97.142 69.55l9.836-5.638c.839-.48 1.559-.48 2.399 0l22.912 13.195c6.598 3.839 11.035 11.995 11.035 19.912 0 9.116-5.397 17.513-13.915 20.992v.001Zm-60.577-23.99-9.836-5.758c-.84-.48-1.2-1.2-1.2-2.16v-26.39c0-12.834 9.837-22.55 23.152-22.55 5.039 0 9.716 1.679 13.676 4.678L70.993 55.516c-1.44.84-2.16 2.039-2.16 3.719v34.787-.002Zm21.173 12.234L75.91 98.339V81.546l14.095-7.917 14.094 7.917v16.793l-14.094 7.916Zm9.056 36.467c-5.038 0-9.716-1.68-13.675-4.678l23.631-13.676c1.439-.839 2.159-2.038 2.159-3.718V85.863l9.956 5.757c.84.48 1.2 1.2 1.2 2.16v26.389c0 12.835-9.957 22.552-23.27 22.552v.001Zm-28.43-26.75L47.72 102.778c-6.599-3.84-11.036-11.996-11.036-19.913 0-9.236 5.518-17.513 14.034-20.992v27.35c0 1.68.72 2.879 2.16 3.718l29.989 17.393-9.837 5.638c-.84.48-1.56.48-2.399 0Zm-1.318 19.673c-13.555 0-23.512-10.196-23.512-22.792 0-.959.12-1.919.24-2.879l23.63 13.675c1.44.84 2.88.84 4.32 0l30.108-17.392v11.395c0 .96-.361 1.68-1.2 2.16l-22.912 13.194c-3.119 1.8-6.837 2.639-10.675 2.639Zm29.748 14.274c14.515 0 26.63-10.316 29.39-23.991 13.434-3.479 22.071-16.074 22.071-28.91 0-8.396-3.598-16.553-10.076-22.43.6-2.52.96-5.039.96-7.557 0-17.153-13.915-29.99-29.989-29.99-3.239 0-6.358.48-9.477 1.56-5.398-5.278-12.835-8.637-20.992-8.637-14.515 0-26.63 10.316-29.39 23.991-13.434 3.48-22.07 16.074-22.07 28.91 0 8.396 3.598 16.553 10.075 22.431-.6 2.519-.96 5.038-.96 7.556 0 17.154 13.915 29.989 29.99 29.989 3.238 0 6.357-.479 9.476-1.559 5.397 5.278 12.835 8.637 20.992 8.637Z"

export type Platform = 'chatgpt' | 'perplexity' | 'gemini' | 'googlegemini' | 'maps' | 'google' | 'instagram' | 'tiktok' | 'claude'

/** Linien-Icon einer Plattform (Kontur, 1.1 px). */
export function PlatformIcon({ platform, className }: { platform: Platform; className?: string }) {
  const p = platform === 'googlegemini' ? 'gemini' : platform
  return (
    <svg className={className} width="32" height="32" viewBox={p === 'chatgpt' ? '24 24 132 132' : '0 0 24 24'} fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {p === 'chatgpt' && <path d={CHATGPT_PATH} vectorEffect="non-scaling-stroke" />}
      {p === 'perplexity' && <path d="M12 2v20M5 3l14 15v4l-7-6-7 6v-4L19 3v6H5V3Zm0 6H2v9h3m14-9h3v9h-3" vectorEffect="non-scaling-stroke" />}
      {p === 'gemini' && <path d="M12 2c0 5.5-4.5 10-10 10 5.5 0 10 4.5 10 10 0-5.5 4.5-10 10-10-5.5 0-10-4.5-10-10Z" vectorEffect="non-scaling-stroke" />}
      {p === 'maps' && (
        <>
          <path d="M19.5 9.5C19.5 15 12 22 12 22S4.5 15 4.5 9.5a7.5 7.5 0 0 1 15 0Z" vectorEffect="non-scaling-stroke" />
          <circle cx="12" cy="9.5" r="2.7" vectorEffect="non-scaling-stroke" />
        </>
      )}
      {p === 'google' && <path d="M19.1 5a10 10 0 1 0 2.7 8.1H12m9.8 0V12" vectorEffect="non-scaling-stroke" />}
      {p === 'instagram' && (
        <>
          <rect x="3" y="3" width="18" height="18" rx="5" vectorEffect="non-scaling-stroke" />
          <circle cx="12" cy="12" r="4.2" vectorEffect="non-scaling-stroke" />
          <circle cx="17.5" cy="6.5" r=".6" vectorEffect="non-scaling-stroke" />
        </>
      )}
      {p === 'tiktok' && <path d="M14 3v13.2a4.8 4.8 0 1 1-4.8-4.8M14 3c0 4 3.2 6.5 7 6.5" vectorEffect="non-scaling-stroke" />}
      {p === 'claude' && Array.from({ length: 12 }, (_, t) => (
        <path key={t} d={`M12 12 12 ${t % 2 ? '3.5' : '2'}`} transform={`rotate(${t * 30} 12 12)`} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  )
}

/** Dünne Umriss-Marke (Orbit im KI-Check). */
export function OutlineMark({ platform }: { platform: 'chatgpt' | 'googlegemini' | 'perplexity' | 'claude' }) {
  const isGpt = platform === 'chatgpt'
  return (
    <svg className="rx-ai-outline-mark" viewBox={isGpt ? '27 27 126 126' : '-1 -1 26 26'} fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={isGpt ? CHATGPT_PATH : BRAND_ICONS[platform].path} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

/** Pfeil nach rechts oder diagonal (↗). */
export function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {diagonal ? <path d="M6 18 18 6M6 6h12v12" /> : <path d="M4 12h16m-6-6 6 6-6 6" />}
    </svg>
  )
}

export function LineIcon({ kind }: { kind: 'arrow' | 'chevron' }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={kind === 'arrow' ? 'M5 12h14m-6-6 6 6-6 6' : 'm8 10 4 4 4-4'} />
    </svg>
  )
}

/** Farbiges Google-G. */
export function GoogleG({ size = 17 }: { size?: number }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
      <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.7-.4-4H24v7.6h11a9.4 9.4 0 0 1-4.1 6.2v5h6.6c3.9-3.6 6.1-8.8 6.1-14.8z" />
      <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.6-5a12.1 12.1 0 0 1-18-6.4H6.1v5.2A20.4 20.4 0 0 0 24 44z" />
      <path fill="#FBBC05" d="M12.9 27.8a12 12 0 0 1 0-7.6V15H6.1a20.2 20.2 0 0 0 0 18z" />
      <path fill="#EA4335" d="M24 11.8c3 0 5.8 1.1 7.9 3.1l5.9-5.9A20.1 20.1 0 0 0 6.1 15l6.8 5.2A12 12 0 0 1 24 11.8z" />
    </svg>
  )
}

/** Hell/Dunkel-Schalter im Footer. */
export function ThemeIcon({ dark }: { dark: boolean }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      {dark ? (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5" />
        </>
      ) : (
        <path d="M20.5 14.5A9 9 0 0 1 9.5 3.5a9 9 0 1 0 11 11z" />
      )}
    </svg>
  )
}

/** Sanftes Licht, das dem Mauszeiger folgt (nur Maus). */
export function trackGlow(e: React.PointerEvent<HTMLElement>) {
  if (e.pointerType !== 'mouse') return
  const el = e.currentTarget
  const r = el.getBoundingClientRect()
  const x = Math.max(8, Math.min(92, ((e.clientX - r.left) / r.width) * 100))
  el.style.setProperty('--rx-glow-x', `${x.toFixed(2)}%`)
}
export function resetGlow(e: React.SyntheticEvent<HTMLElement>) {
  e.currentTarget.style.removeProperty('--rx-glow-x')
}
