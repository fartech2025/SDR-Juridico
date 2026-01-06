/**
 * Contexto para controle de tamanho de fonte
 * Permite usuários aumentar/diminuir tamanho da fonte
 * Persiste preferência em localStorage
 */

import type { ReactNode } from 'react'
import { useEffect, useState, useCallback, createContext, useContext } from 'react'

export type FontSize = 'xs' | 'sm' | 'md' | 'lg' | 'normal' | 'xl' | 'xxl' | 'xxxl' | 'huge' | 'mega'

interface FontContextType {
  fontSize: FontSize
  scale: number
  setFontSize: (size: FontSize) => void
  increaseFontSize: () => void
  decreaseFontSize: () => void
  resetFontSize: () => void
}

const FontContext = createContext<FontContextType | undefined>(undefined)

const fontScales: Record<FontSize, number> = {
  xs: 0.75,
  sm: 0.85,
  md: 0.95,
  lg: 1.05,
  normal: 1,
  xl: 1.15,
  xxl: 1.3,
  xxxl: 1.45,
  huge: 1.6,
  mega: 2.5,
}

const fontSizeOrder: FontSize[] = ['xs', 'sm', 'md', 'lg', 'normal', 'xl', 'xxl', 'xxxl', 'huge', 'mega']

export function FontProvider({ children }: { children: ReactNode }) {
  const [fontSize, setFontSize] = useState<FontSize>('normal')
  const [isMounted, setIsMounted] = useState(false)

  // Carregar preferência do localStorage na montagem
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sdr-font-size')
      if (saved && fontScales[saved as FontSize]) {
        setFontSize(saved as FontSize)
      }
    } catch {
      console.warn('Erro ao carregar preferência de fonte')
    }
    setIsMounted(true)
  }, [])

  // Salvar preferência quando mudar
  useEffect(() => {
    if (isMounted) {
      try {
        localStorage.setItem('sdr-font-size', fontSize)
      } catch {
        console.warn('Erro ao salvar preferência de fonte')
      }
    }
  }, [fontSize, isMounted])

  // Aplicar escala ao document
  useEffect(() => {
    const scale = fontScales[fontSize]
    // Usar !important para garantir que sobrescreve CSS do Tailwind
    document.documentElement.style.setProperty('--font-scale', scale.toString(), 'important')
    console.log('FontScale aplicada:', fontSize, '=', scale) // Debug
  }, [fontSize])

  const increaseFontSize = useCallback(() => {
    setFontSize((current) => {
      const currentIndex = fontSizeOrder.indexOf(current)
      const nextIndex = Math.min(currentIndex + 1, fontSizeOrder.length - 1)
      return fontSizeOrder[nextIndex]
    })
  }, [])

  const decreaseFontSize = useCallback(() => {
    setFontSize((current) => {
      const currentIndex = fontSizeOrder.indexOf(current)
      const nextIndex = Math.max(currentIndex - 1, 0)
      return fontSizeOrder[nextIndex]
    })
  }, [])

  const resetFontSize = useCallback(() => {
    setFontSize('normal')
  }, [])

  const value: FontContextType = {
    fontSize,
    scale: fontScales[fontSize],
    setFontSize,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
  }

  return <FontContext.Provider value={value}>{children}</FontContext.Provider>
}

/**
 * Hook para usar o contexto de fonte
 */
export function useFont(): FontContextType {
  const context = useContext(FontContext)
  if (!context) {
    throw new Error('useFont deve ser usado dentro de FontProvider')
  }
  return context
}
