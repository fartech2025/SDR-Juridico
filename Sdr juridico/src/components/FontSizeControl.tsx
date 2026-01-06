/**
 * Componente para controlar tamanho de fonte
 * Botão flutuante ou integrado na navbar
 */

import { useFont } from '@/contexts/FontContext'
import { Type, RotateCcw } from 'lucide-react'

interface FontSizeControlProps {
  variant?: 'button' | 'compact' | 'menu'
  showLabel?: boolean
  className?: string
}

export function FontSizeControl({
  variant = 'button',
  showLabel = true,
  className = '',
}: FontSizeControlProps) {
  const { fontSize, increaseFontSize, decreaseFontSize, resetFontSize } = useFont()

  const fontLabels = {
    xs: 'A−−',
    sm: 'A−',
    md: 'A',
    lg: 'A+',
    normal: 'A',
    xl: 'A++',
    xxl: 'A+++',
    xxxl: 'A++++',
    huge: 'A+++++',
    mega: 'A++++++',
  }

  // Variante: Botão principal
  if (variant === 'button') {
    return (
      <div
        className={`flex items-center gap-2 rounded-lg border border-border bg-surface p-2 ${className}`}
      >
        <button
          onClick={decreaseFontSize}
          disabled={fontSize === 'xs'}
          title="Diminuir fonte"
          className="flex items-center justify-center rounded-md p-1.5 transition-all hover:bg-primary-soft disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Diminuir tamanho da fonte"
        >
          <Type className="h-4 w-4 text-text" />
          <span className="ml-0.5 text-xs font-semibold text-text-muted">−</span>
        </button>

        {showLabel && (
          <div className="flex min-w-8 flex-col items-center justify-center">
            <span className="text-xs font-medium text-text-muted">
              {fontLabels[fontSize]}
            </span>
          </div>
        )}

        <button
          onClick={increaseFontSize}
          disabled={fontSize === 'mega'}
          title="Aumentar fonte"
          className="flex items-center justify-center rounded-md p-1.5 transition-all hover:bg-primary-soft disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Aumentar tamanho da fonte"
        >
          <Type className="h-4 w-4 text-text" />
          <span className="ml-0.5 text-xs font-semibold text-text-muted">+</span>
        </button>

        {fontSize !== 'normal' && (
          <button
            onClick={resetFontSize}
            title="Resetar fonte"
            className="ml-1 rounded-md p-1.5 transition-all hover:bg-border-soft"
            aria-label="Resetar tamanho da fonte para padrão"
          >
            <RotateCcw className="h-3.5 w-3.5 text-text-muted" />
          </button>
        )}
      </div>
    )
  }

  // Variante: Compacta (apenas botões)
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <button
          onClick={decreaseFontSize}
          disabled={fontSize === 'xs'}
          title="Diminuir fonte"
          className="rounded p-1.5 transition-all hover:bg-surface-alt disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Diminuir tamanho da fonte"
        >
          <Type className="h-3.5 w-3.5 text-text-muted" />
        </button>

        <button
          onClick={increaseFontSize}
          disabled={fontSize === 'mega'}
          title="Aumentar fonte"
          className="rounded p-1.5 transition-all hover:bg-surface-alt disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Aumentar tamanho da fonte"
        >
          <Type className="h-3.5 w-3.5 text-text-muted" />
        </button>

        {fontSize !== 'normal' && (
          <button
            onClick={resetFontSize}
            title="Resetar fonte"
            className="rounded p-1.5 transition-all hover:bg-surface-alt"
            aria-label="Resetar tamanho da fonte para padrão"
          >
            <RotateCcw className="h-3.5 w-3.5 text-text-muted" />
          </button>
        )}
      </div>
    )
  }

  // Variante: Menu (para dropdown/settings)
  if (variant === 'menu') {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="text-xs font-semibold uppercase tracking-wider text-text-subtle">
          Tamanho da Fonte
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={decreaseFontSize}
            disabled={fontSize === 'xs'}
            className="flex-1 rounded-md border border-border-soft py-2 px-3 text-xs font-medium transition-all hover:bg-surface-alt disabled:opacity-50 disabled:cursor-not-allowed"
          >
            A−
          </button>
          <div className="w-12 rounded-md bg-surface-alt py-2 px-3 text-center text-xs font-medium">
            {fontLabels[fontSize]}
          </div>
          <button
            onClick={increaseFontSize}
            disabled={fontSize === 'mega'}
            className="flex-1 rounded-md border border-border-soft py-2 px-3 text-xs font-medium transition-all hover:bg-surface-alt disabled:opacity-50 disabled:cursor-not-allowed"
          >
            A+
          </button>
        </div>

        {fontSize !== 'normal' && (
          <button
            onClick={resetFontSize}
            className="w-full rounded-md border border-border-soft py-2 px-3 text-xs font-medium transition-all hover:bg-surface-alt"
          >
            Resetar Padrão
          </button>
        )}
      </div>
    )
  }

  return null
}

/**
 * Botão flutuante para controle de fonte
 * Pode ser usado na barra de navegação ou rodapé
 */
export function FontSizeButton() {
  const { fontSize, increaseFontSize, decreaseFontSize } = useFont()

  const fontLabels = {
    xs: '−−',
    sm: '−',
    md: 'A',
    lg: '+',
    normal: 'A',
    xl: '++',
    xxl: '+++',
    xxxl: '++++',
    huge: '+++++',
    mega: '++++++',
  }

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-surface px-2 py-1 shadow-soft">
      <button
        onClick={decreaseFontSize}
        disabled={fontSize === 'xs'}
        className="rounded p-1 transition-colors hover:bg-surface-alt disabled:opacity-50"
        title="Diminuir"
        aria-label="Diminuir tamanho da fonte"
      >
        <span className="text-xs font-bold text-text-muted">A</span>
      </button>
      <span className="text-xs font-semibold text-text-muted">
        {fontLabels[fontSize]}
      </span>
      <button
        onClick={increaseFontSize}
        disabled={fontSize === 'mega'}
        className="rounded p-1 transition-colors hover:bg-surface-alt disabled:opacity-50"
        title="Aumentar"
        aria-label="Aumentar tamanho da fonte"
      >
        <span className="text-xs font-bold text-text-muted">A</span>
      </button>
    </div>
  )
}
