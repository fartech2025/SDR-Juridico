import type { ReactNode, HTMLAttributes } from 'react'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'

export type AlertVariant = 'success' | 'warning' | 'danger' | 'info'

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant
  title?: string
  children: ReactNode
  onClose?: () => void
}

const variants: Record<AlertVariant, { bg: string; border: string; text: string; icon: ReactNode }> = {
  success: {
    bg: 'bg-success-bg',
    border: 'border-success-border',
    text: 'text-success-dark',
    icon: <CheckCircle2 className="h-5 w-5" />,
  },
  warning: {
    bg: 'bg-warning-bg',
    border: 'border-warning-border',
    text: 'text-warning-dark',
    icon: <AlertTriangle className="h-5 w-5" />,
  },
  danger: {
    bg: 'bg-danger-bg',
    border: 'border-danger-border',
    text: 'text-danger-dark',
    icon: <AlertCircle className="h-5 w-5" />,
  },
  info: {
    bg: 'bg-info-bg',
    border: 'border-info-border',
    text: 'text-info-dark',
    icon: <Info className="h-5 w-5" />,
  },
}

export function Alert({ 
  variant = 'info', 
  title, 
  children, 
  onClose,
  className = '',
  ...props 
}: AlertProps) {
  const { bg, border, text, icon } = variants[variant]

  return (
    <div
      className={`
        rounded-lg border p-4
        flex items-start gap-3
        ${bg} ${border} ${text}
        ${className}
      `}
      {...props}
    >
      <div className="flex-shrink-0 mt-0.5">
        {icon}
      </div>
      
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="font-semibold mb-1">{title}</h4>
        )}
        <div className="text-sm">{children}</div>
      </div>
      
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 ml-auto hover:opacity-70 transition-opacity"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
