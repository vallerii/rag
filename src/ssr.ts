// Prerender (Build-Zeit): Auf dem Server gibt es kein `window`. Die Route und die
// Seiten-Metadaten werden hier gesammelt, damit scripts/prerender.mjs für jede
// öffentliche Seite fertiges HTML mit eigenem Titel, Description und Canonical schreibt.
export type PageMeta = { title: string; description: string; ogType: 'website' | 'article'; noindex?: boolean }

export const isServer = typeof window === 'undefined'

export const ssr: { path: string; origin: string; meta: PageMeta | null } = { path: '/', origin: '', meta: null }

/** Aktueller Pfad — im Browser aus der Adresszeile, beim Prerender aus `ssr.path`. */
export function currentPath(): string {
  return isServer ? ssr.path : window.location.pathname
}

/** https://domain — im Browser aus der Adresse, beim Prerender aus VITE_SITE_URL. */
export function siteOrigin(): string {
  return isServer ? ssr.origin : window.location.origin
}
