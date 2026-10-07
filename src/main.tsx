import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { startTranslator } from './i18n'

// The translator must be running before the first render, so Russian visitors
// never see German copy flash. For German it resolves immediately.
// Die Seiten sind vorgerendert (scripts/prerender.mjs): Crawler lesen das statische HTML,
// im Browser rendert React die Seite danach neu (createRoot ersetzt den Inhalt von #root).
startTranslator().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
  requestAnimationFrame(() => document.documentElement.classList.remove('i18n-wait'))
})
