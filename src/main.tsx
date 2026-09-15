import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { startTranslator } from './i18n'

// The translator must be running before the first render, so Russian visitors
// never see German copy flash. For German it resolves immediately.
startTranslator().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
})
