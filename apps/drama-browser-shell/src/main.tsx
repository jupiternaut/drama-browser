import * as React from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App'
import { markProductPath, startDramaStartupResponsivenessMonitor } from './performance'
import './styles.css'

function markShellDocumentLoad() {
  markProductPath('shell-document-load', {
    state: document.readyState,
    url: globalThis.location?.href ?? '',
  })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', markShellDocumentLoad, { once: true })
} else {
  markShellDocumentLoad()
}
startDramaStartupResponsivenessMonitor()

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
