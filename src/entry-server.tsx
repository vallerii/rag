// Einstieg für den Prerender (vite build --ssr). Rendert eine Route zu HTML.
import { renderToString } from 'react-dom/server'
import App, { prerenderRoutes } from './App'
import { ssr } from './ssr'

export function render(path: string, origin: string) {
  ssr.path = path
  ssr.origin = origin
  ssr.meta = null
  const html = renderToString(<App />)
  return { html, meta: ssr.meta }
}

export { prerenderRoutes }
export { organizationJsonLd, COMPANY } from './company'
