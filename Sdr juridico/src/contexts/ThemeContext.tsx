/**
 * Contexto para controle de tema (Light/Dark)
 * Permite usuários alternar entre temas claros e escuros
 * Persiste preferência em localStorage
 */

import type { ReactNode } from 'react'
import { useEffect, useState, useCallback, createContext, useContext } from 'react'

export type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [isMounted, setIsMounted] = useState(false)

  // Carregar preferência do localStorage na montagem
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sdr-theme')
      
      if (saved === 'light' || saved === 'dark') {
        setThemeState(saved)
        applyTheme(saved)
      } else {
        // Detectar preferência do sistema
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        const initialTheme = prefersDark ? 'dark' : 'light'
        setThemeState(initialTheme)
        applyTheme(initialTheme)
      }
    } catch {
      console.warn('Erro ao carregar preferência de tema')
    }
    setIsMounted(true)
  }, [])

  const applyTheme = (newTheme: Theme) => {
    const html = document.documentElement
    
    if (newTheme === 'dark') {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    applyTheme(newTheme)
    localStorage.setItem('sdr-theme', newTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }, [theme, setTheme])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {isMounted && children}
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
