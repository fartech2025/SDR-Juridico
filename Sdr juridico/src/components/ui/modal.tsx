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
  const [visible, setVisible] = React.useState(false)
  const [animating, setAnimating] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setVisible(true)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimating(true))
      })
    } else {
      setAnimating(false)
      const timeout = setTimeout(() => setVisible(false), 300)
      return () => clearTimeout(timeout)
    }
  }, [open])

  React.useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  React.useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [visible])

  if (!visible) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          transition: 'opacity 250ms ease-out',
          opacity: animating ? 1 : 0,
        }}
      />
      {/* Modal panel — pop-in / explode */}
      <div
        className={cn('rounded-2xl bg-white shadow-2xl', className)}
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '32rem',
          padding: '20px 24px',
          border: '1px solid #e5e7eb',
          transition: 'all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: animating ? 'scale(1) translateY(0)' : 'scale(0.75) translateY(16px)',
          opacity: animating ? 1 : 0,
        }}
      >
        {(title || description) && (
          <div style={{ marginBottom: '4px' }}>
            {title && (
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', lineHeight: 1.4 }}>
                {title}
              </h3>
            )}
            {description && (
              <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                {description}
              </p>
            )}
          </div>
        )}
        <div
          style={{
            marginTop: '16px',
            fontSize: '14px',
            color: '#374151',
            maxHeight: '65vh',
            overflowY: 'auto',
          }}
        >
          {children}
        </div>
        {footer && (
          <div
            style={{
              marginTop: '20px',
              paddingTop: '12px',
              borderTop: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
