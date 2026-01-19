/**
 * Contexto para controle de tamanho de fonte
 * SOLUÇÃO ULTRA AGRESSIVA: Aplica zoom diretamente no body via JS
 */

import type { ReactNode } from 'react'
import { useEffect, useState, useCallback, createContext, useContext, useRef } from 'react'

export type FontSize = 'xs' | 'sm' | 'md' | 'normal' | 'lg' | 'xl' | 'xxl' | 'xxxl' | 'huge' | 'mega'

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
  xs: 0.8,
  sm: 0.9,
  md: 0.95,
  normal: 1,
  lg: 1.05,
  xl: 1.2,
  xxl: 1.4,
  xxxl: 1.6,
  huge: 1.85,
  mega: 2.2,
}

const fontSizeOrder: FontSize[] = ['xs', 'sm', 'md', 'normal', 'lg', 'xl', 'xxl', 'xxxl', 'huge', 'mega']

// Aplica escala via CSS custom property - funciona com fixed elements
function applyZoom(scale: number) {
  if (typeof window === 'undefined') return

  const html = document.documentElement

  // MÉTODO DEFINITIVO: Aplicar escala via --font-scale CSS variable
  // Isso funciona com position: fixed e não depende de transform
  html.style.setProperty('--font-scale', String(scale))
  html.style.fontSize = `${16 * scale}px`
  
  // Forçar atualização de todos os elementos
  document.body?.style.setProperty('--font-scale', String(scale))

  // Escala aplicada com sucesso
}

export function FontProvider({ children }: { children: ReactNode }) {
  const [fontSize, setFontSize] = useState<FontSize>('normal')
  const [isMounted, setIsMounted] = useState(false)
  const prevScaleRef = useRef<number>(fontScales['normal'])

  // Carregar preferência do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sdr-font-size')
      if (saved && fontScales[saved as FontSize]) {
        setFontSize(saved as FontSize)
      }
    } catch {
      // ignore
    }
    setIsMounted(true)
  }, [])

  // Salvar preferência
  useEffect(() => {
    if (isMounted) {
      try {
        localStorage.setItem('sdr-font-size', fontSize)
      } catch {
        // ignore
      }
    }
  }, [fontSize, isMounted])

  // APLICAR ZOOM - Este é o efeito principal
  useEffect(() => {
    const newScale = fontScales[fontSize]
    if (prevScaleRef.current === newScale) return
    prevScaleRef.current = newScale
    applyZoom(newScale)
  }, [fontSize])

  const scale = fontScales[fontSize]

  const increaseFontSize = useCallback(() => {
    setFontSize((current) => {
      const currentIndex = fontSizeOrder.indexOf(current)
      const nextIndex = Math.min(currentIndex + 1, fontSizeOrder.length - 1)
      const next = fontSizeOrder[nextIndex]
      return next
    })
  }, [])

  const decreaseFontSize = useCallback(() => {
    setFontSize((current) => {
      const currentIndex = fontSizeOrder.indexOf(current)
      const nextIndex = Math.max(currentIndex - 1, 0)
      const next = fontSizeOrder[nextIndex]
      return next
    })
  }, [])

  const resetFontSize = useCallback(() => {
    setFontSize('normal')
  }, [])

  const value: FontContextType = {
    fontSize,
    scale,
    setFontSize,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
  }

  return (
    <FontContext.Provider value={value}>
      {children}
    </FontContext.Provider>
  )
}

export function useFont() {
  const context = useContext(FontContext)
  if (!context) {
    throw new Error('useFont deve ser usado dentro de um FontProvider')
  }
  return context
}
