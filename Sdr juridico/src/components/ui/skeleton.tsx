import * as React from 'react'

import { cn } from '@/utils/cn'

export const Skeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'animate-pulse rounded-md bg-surface-raised/80',
      className,
    )}
    {...props}
  />
))
Skeleton.displayName = 'Skeleton'
