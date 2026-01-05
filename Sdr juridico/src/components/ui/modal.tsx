import * as React from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/utils/cn'

export interface ModalProps {
  open: boolean
  title?: string
  description?: string
  onClose: () => void
  children?: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export const Modal = ({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  className,
}: ModalProps) => {
  React.useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[6px]"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-10 w-full max-w-lg rounded-2xl border border-border bg-white px-6 py-5 shadow-soft',
          className,
        )}
      >
        {(title || description) && (
          <div className="space-y-1">
            {title && (
              <h3 className="font-display text-lg text-text">{title}</h3>
            )}
            {description && (
              <p className="text-sm text-text-muted">{description}</p>
            )}
          </div>
        )}
        <div className="mt-4 text-sm text-text-muted">{children}</div>
        {footer && <div className="mt-5 flex items-center gap-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
