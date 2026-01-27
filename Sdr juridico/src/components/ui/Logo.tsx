import * as React from 'react'

import { cn } from '@/utils/cn'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  collapsed?: boolean
  className?: string
}

export const Logo = React.forwardRef<HTMLDivElement, LogoProps>(
  ({ size = 'md', collapsed = false, className }, ref) => {
    const dimensions = {
      sm: { width: 32, height: 36 },
      md: { width: 40, height: 46 },
      lg: { width: 56, height: 64 },
    }

    const textSize = {
      sm: 'text-lg',
      md: 'text-xl',
      lg: 'text-2xl',
    }

    return (
      <div ref={ref} className={cn('flex items-center gap-3', className)}>
        <svg
          {...dimensions[size]}
          viewBox="0 0 56 64"
          fill="none"
          role="img"
          aria-label="TalentJUD Logo"
        >
          <path
            d="M0 8 L0 0 L28 0 L28 8 L8 8 L8 48 C8 52 12 56 20 56 L20 64 C4 64 0 56 0 48 Z"
            fill="#721011"
          />
          <path
            d="M56 8 L56 0 L28 0 L28 8 L48 8 L48 48 C48 52 44 56 36 56 L36 64 C52 64 56 56 56 48 Z"
            fill="#6B5E58"
          />
        </svg>
        {!collapsed && (
          <div className="flex items-baseline">
            <span
              className={cn('font-bold tracking-tight', textSize[size])}
              style={{ color: '#721011' }}
            >
              Talent
            </span>
            <span
              className={cn('font-bold tracking-tight', textSize[size])}
              style={{ color: '#6B5E58' }}
            >
              JUD
            </span>
          </div>
        )}
      </div>
    )
  }
)
Logo.displayName = 'Logo'
