import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from '@/App'
import { applyThemeTokens } from '@/theme/applyTokens'
import { initializeHealthChecks } from '@/lib/health'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import '@/index.css'

// Inicializar health checks automáticos
initializeHealthChecks()

// Aplicar tema
applyThemeTokens()

// Debug overlay em desenvolvimento para evitar "tela em branco"
if (import.meta.env.DEV) {
  const ensureOverlay = () => {
    let el = document.getElementById('debug-overlay') as HTMLDivElement | null
    if (!el) {
      el = document.createElement('div')
      el.id = 'debug-overlay'
      el.style.cssText = `
        position: fixed;
        bottom: 12px;
        right: 12px;
        max-width: 40vw;
        z-index: 9999;
        background: rgba(0,0,0,0.85);
        color: #fff;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 11px;
        padding: 8px 10px;
        border-radius: 6px;
        box-shadow: 0 4px 18px rgba(0,0,0,0.3);
        white-space: pre-wrap;
        line-height: 1.4;
      `
      document.body.appendChild(el)
    }
    return el
  }

  const logToOverlay = (msg: string, type: 'info' | 'error' = 'info') => {
    const el = ensureOverlay()
    el.style.background = type === 'error' ? 'rgba(220,38,38,0.9)' : 'rgba(0,0,0,0.85)'
    el.textContent = msg
  }

  // Monitorar erros não capturados
  window.addEventListener('error', (event) => {
    console.error('Erro não capturado:', event.error)
    logToOverlay(`❌ Erro: ${event.error?.message || 'desconhecido'}`, 'error')
  })

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Promise rejection não tratado:', event.reason)
    const reason = (event.reason && (event.reason.message || String(event.reason))) || 'desconhecido'
    logToOverlay(`❌ Promise: ${reason}`, 'error')
  })

  // Marca de inicialização
  queueMicrotask(() => {
    logToOverlay('⏳ App inicializando...', 'info')
    const root = document.getElementById('root')
    setTimeout(() => {
      const mounted = !!root && root.childNodes.length > 0
      if (mounted) {
        logToOverlay('✅ UI renderizada. App OK!', 'info')
      } else {
        logToOverlay('❌ Nada renderizado em #root', 'error')
      }
    }, 300)
  })
}

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Elemento root não encontrado')
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
