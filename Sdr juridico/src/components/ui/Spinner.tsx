import type { HTMLAttributes } from 'react'

export type SpinnerSize = 'sm' | 'md' | 'lg'

interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: SpinnerSize
  label?: string
}

const sizes: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-3',
}

export function Spinner({ size = 'md', label, className = '', ...props }: SpinnerProps) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`} {...props}>
      <div
        className={`
          animate-spin rounded-full 
          border-current border-t-transparent
          ${sizes[size]}
        `}
        role="status"
        aria-label={label || 'Carregando...'}
      />
      {label && <span className="text-sm text-text-muted">{label}</span>}
    </div>
  )
}
