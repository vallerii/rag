// Prerender: schreibt für jede öffentliche Seite statisches HTML nach dist/.
// So sehen Google, Bing, ChatGPT/Perplexity-Crawler und Link-Vorschauen in
// WhatsApp/LinkedIn den Inhalt und die Meta-Tags, ohne JavaScript auszuführen.
// Ablauf: vite build → vite build --ssr src/entry-server.tsx → dieses Skript.
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const root = process.cwd()
const dist = path.join(root, 'dist')
const SITE_URL = (process.env.VITE_SITE_URL || process.env.SITE_URL || 'https://rag-agentur.de').replace(/\/+$/, '')
const OG_IMAGE = `${SITE_URL}/og-image.png`
const SITE_NAME = 'RAG — Regionale Agentur'

const { render, prerenderRoutes, organizationJsonLd, COMPANY } = await import(pathToFileURL(path.join(root, 'dist-ssr', 'entry-server.js')).href)

const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')

// Leere SPA-Hülle für Kabinett, Login, Check, Admin (dynamisch, nicht indexiert).
fs.writeFileSync(path.join(dist, 'app.html'), template)

const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function page(route, html, meta) {
  const url = SITE_URL + (route === '/' ? '/' : route)
  let out = template
    // Statische Meta-Angaben aus site.json entfernen — sie werden pro Seite neu gesetzt.
    .replace(/\s*<meta (name|property)="(description|robots|og:[a-z_:]+|twitter:[a-z_:]+)"[^>]*>/g, '')
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(meta.title)}</title>`)
  const head = [
    `<meta name="description" content="${esc(meta.description)}" />`,
    meta.noindex ? `<meta name="robots" content="noindex" />` : `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:type" content="${meta.ogType}" />`,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:site_name" content="${esc(SITE_NAME)}" />`,
    `<meta property="og:locale" content="de_DE" />`,
    `<meta property="og:image" content="${OG_IMAGE}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(meta.title)}" />`,
    `<meta name="twitter:description" content="${esc(meta.description)}" />`,
    `<meta name="twitter:image" content="${OG_IMAGE}" />`,
    `<script type="application/ld+json">${JSON.stringify(organizationJsonLd(SITE_URL)).replace(/</g, '\\u003c')}</script>`,
  ].join('\n    ')
  out = out.replace('</head>', `    ${head}\n  </head>`)
  out = out.replace('<div id="root"></div>', `<div id="root">${html}</div>`)
  // Platzhalter-Domain in JSON-LD / Links durch die echte ersetzen.
  out = out.split('https://rag-agentur.de').join(SITE_URL)
  return out
}

if (!COMPANY.ready) console.warn('\n⚠  src/company.ts: Firmendaten noch nicht vollständig (ready: false) — Impressum zeigt Platzhalter.\n')
if (/rag-agentur\.de/.test(SITE_URL)) console.warn('⚠  VITE_SITE_URL nicht gesetzt — Canonical/Sitemap verwenden die Platzhalter-Domain rag-agentur.de.\n')

const routes = prerenderRoutes()
let count = 0
for (const route of routes) {
  const { html, meta } = render(route, SITE_URL)
  if (!meta) throw new Error(`Keine Meta-Angaben für ${route} (usePageMeta fehlt?)`)
  const file = route === '/' ? path.join(dist, 'index.html') : path.join(dist, route, 'index.html')
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, page(route, html, meta))
  count++
}

// Echte 404-Seite (HTTP 404 statt Startseite mit Status 200).
{
  const { html, meta } = render('/__404__', SITE_URL)
  fs.writeFileSync(path.join(dist, '404.html'), page('/404', html, meta))
}

// Sitemap und robots.txt aus derselben Routenliste — immer aktuell.
const today = new Date().toISOString().slice(0, 10)
const prio = r => (r === '/' ? '1.0' : /^\/(services|preise)/.test(r) ? '0.8' : r.startsWith('/ratgeber') ? '0.7' : '0.5')
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(r => `  <url><loc>${SITE_URL}${r === '/' ? '/' : r}</loc><lastmod>${today}</lastmod><priority>${prio(r)}</priority></url>`).join('\n')}
</urlset>
`
fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap)
const robotsFile = path.join(dist, 'robots.txt')
if (fs.existsSync(robotsFile)) {
  fs.writeFileSync(robotsFile, fs.readFileSync(robotsFile, 'utf8').replace(/https:\/\/rag-agentur\.de/g, SITE_URL))
}

fs.rmSync(path.join(root, 'dist-ssr'), { recursive: true, force: true })
console.log(`Prerender: ${count} Seiten + 404 → dist/ (Domain ${SITE_URL})`)
