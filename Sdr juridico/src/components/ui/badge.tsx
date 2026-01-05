import * as React from 'react'

import { cn } from '@/utils/cn'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

const variantClasses: Record<BadgeVariant, string> = {
  default: 'border-border bg-surface-2 text-text',
  success: 'border-success/25 bg-success/15 text-success',
  warning: 'border-warning/25 bg-warning/15 text-warning',
  danger: 'border-danger/25 bg-danger/15 text-danger',
  info: 'border-info/25 bg-info/15 text-info',
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1 rounded-pill border px-2.5 py-1 text-[11px] font-semibold',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  ),
)
Badge.displayName = 'Badge'
