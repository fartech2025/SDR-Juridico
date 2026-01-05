import * as React from 'react'

import { cn } from '@/utils/cn'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'h-10 w-full rounded-2xl border border-border bg-white px-3 text-sm text-text placeholder:text-text-subtle shadow-soft focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'
