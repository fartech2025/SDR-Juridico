import * as React from 'react'
import { createPortal } from 'react-dom'

export interface ModalProps {
  open: boolean
  title?: string
  description?: string
  onClose: () => void
  children?: React.ReactNode
  footer?: React.ReactNode
  className?: string
  maxWidth?: string
  noPadding?: boolean
}

export const Modal = ({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  className,
  maxWidth,
  noPadding,
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
      {/* Modal panel — 100% inline styles to resist force-light.css */}
      <div
        data-modal-panel=""
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: maxWidth || '32rem',
          boxSizing: 'border-box' as const,
          padding: noPadding ? '0' : '20px 24px',
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 4px 16px rgba(0, 0, 0, 0.08)',
          transition: 'all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: animating ? 'scale(1) translateY(0)' : 'scale(0.75) translateY(16px)',
          opacity: animating ? 1 : 0,
          color: '#1f2937',
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        {(title || description) && (
          <div style={{ marginBottom: '4px' }}>
            {title && (
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', lineHeight: 1.4, margin: 0, fontFamily: 'inherit' }}>
                {title}
              </h3>
            )}
            {description && (
              <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px', marginBottom: 0, fontFamily: 'inherit' }}>
                {description}
              </p>
            )}
          </div>
        )}
        <div
          style={{
            marginTop: noPadding ? '0' : '16px',
            fontSize: '14px',
            color: '#374151',
            maxHeight: noPadding ? undefined : '65vh',
            overflowY: noPadding ? undefined : 'auto',
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
