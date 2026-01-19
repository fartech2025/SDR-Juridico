/**
 * Contexto para controle de tema - Light Mode Only
 * Aplicação jurídica profissional com paleta clara
 */

import type { ReactNode } from 'react'
import { createContext, useContext } from 'react'

export type Theme = 'light'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme: Theme = 'light'

  const toggleTheme = () => {
    // Light mode only - sem toggle
  }

  const setTheme = () => {
    // Light mode only - sem mudanças
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider')
  }
  return context
}
