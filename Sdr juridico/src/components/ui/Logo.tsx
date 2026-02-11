import * as React from 'react'

import { cn } from '@/utils/cn'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  collapsed?: boolean
  className?: string
}

const LOGO_IMG = 'https://xocqcoebreoiaqxoutar.supabase.co/storage/v1/object/public/Imagens%20Page/Imagens%20pagina/talent%20jud%2003.png'

const imgDimensions = {
  sm: { height: 32 },
  md: { height: 40 },
  lg: { height: 56 },
}

export const Logo = React.forwardRef<HTMLDivElement, LogoProps>(
  ({ size = 'md', collapsed = false, className }, ref) => {
    return (
      <div ref={ref} className={cn('flex items-center gap-3 overflow-visible', className)}>
        <img
          src={LOGO_IMG}
          alt="TalentJUD Logo"
          style={{ height: imgDimensions[size].height, width: 'auto', objectFit: 'contain', transform: 'scale(4)', transformOrigin: 'left center' }}
        />
      </div>
    )
  }
)
Logo.displayName = 'Logo'
