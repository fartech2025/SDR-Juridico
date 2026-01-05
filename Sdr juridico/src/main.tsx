import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from '@/App'
import { applyThemeTokens } from '@/theme/applyTokens'
import '@/index.css'

applyThemeTokens()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
