import * as React from 'react'

import { cn } from '@/utils/cn'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border-transparent bg-primary text-white shadow-primary hover:brightness-95 active:brightness-90',
  secondary:
    'border-border bg-white text-primary hover:bg-[var(--brand-primary-50)] hover:border-primary',
  outline:
    'border-border bg-white text-text hover:bg-surface-2 hover:border-[var(--color-gray-400)]',
  ghost:
    'border-transparent bg-transparent text-text-muted hover:bg-surface-2 hover:text-text',
  danger:
    'border-transparent bg-danger text-white shadow-soft hover:brightness-95 active:brightness-90',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4 text-sm',
  lg: 'h-10 px-5 text-sm',
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl border text-[13px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  ),
)
Button.displayName = 'Button'
