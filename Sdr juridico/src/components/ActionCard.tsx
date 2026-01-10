import * as React from 'react'
import { AlertTriangle, ChevronRight, Flame, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/utils/cn'

type Priority = 'P0' | 'P1' | 'P2'

export interface ActionCardProps {
  title: string
  description: string
  priority: Priority
  actionLabel?: string
  href?: string
  onAction?: () => void
  secondaryActionLabel?: string
  secondaryHref?: string
  className?: string
}

const priorityConfig: Record<
  Priority,
  {
    label: string
    badgeVariant: 'danger' | 'warning' | 'success'
    tone: string
    badgeClass: string
    cardClass: string
    icon: React.ElementType
  }
> = {
  P0: {
    label: 'P0',
    badgeVariant: 'danger',
    tone: 'text-[#6C63FF]',
    badgeClass: 'border-transparent bg-[#6C63FF] text-white',
    cardClass:
      'border-[#f0d9b8] bg-gradient-to-br from-white via-white to-[#FDE9F2] dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900',
    icon: Flame,
  },
  P1: {
    label: 'P1',
    badgeVariant: 'warning',
    tone: 'text-[#5BB9B6]',
    badgeClass: 'border-transparent bg-[#5BB9B6] text-white',
    cardClass: 'border-[#f0d9b8] bg-white/85 dark:border-slate-800 dark:bg-slate-900/70',
    icon: AlertTriangle,
  },
  P2: {
    label: 'P2',
    badgeVariant: 'success',
    tone: 'text-success',
    badgeClass: 'border-[#E6F7EF] bg-[#E6F7EF] text-[#2F7A5C]',
    cardClass: 'border-[#f0d9b8] bg-white/85 dark:border-slate-800 dark:bg-slate-900/70',
    icon: ShieldCheck,
  },
}

export const ActionCard = ({
  title,
  description,
  priority,
  actionLabel = 'Ver detalhes',
  href,
  onAction,
  secondaryActionLabel,
  secondaryHref,
  className,
}: ActionCardProps) => {
  const navigate = useNavigate()
  const config = priorityConfig[priority]
  const Icon = config.icon

  const handleAction = () => {
    if (onAction) {
      onAction()
      return
    }
    if (href) {
      navigate(href)
    }
  }

  const handleSecondary = () => {
    if (secondaryHref) {
      navigate(secondaryHref)
    }
  }

  return (
    <Card className={cn(config.cardClass, className)}>
      <CardHeader className="flex-row items-center justify-between space-y-0 px-6 pt-6 pb-2">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-4 w-4', config.tone)} />
          <CardTitle className="text-sm">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-6 pb-6 text-sm text-text-muted">
        <div>
          <Badge variant={config.badgeVariant} className={config.badgeClass}>
            {config.label}
          </Badge>
        </div>
        <p>{description}</p>
        {(actionLabel || secondaryActionLabel) && (
          <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
            {actionLabel ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAction}
                className="px-0 text-primary hover:text-primary"
              >
                {actionLabel}
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <span />
            )}
            {secondaryActionLabel && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSecondary}
                className="h-8 rounded-full px-3 text-[11px]"
              >
                {secondaryActionLabel}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
