import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from '@/App'
import { applyThemeTokens } from '@/theme/applyTokens'
import { initializeHealthChecks } from '@/lib/health'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import '@/index.css'

// Inicializar health checks automáticos
// Os checks que requerem autenticação só serão executados
// quando setHealthCheckAuthState for chamado com authenticated=true
initializeHealthChecks()

// Aplicar tema
applyThemeTokens()

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

