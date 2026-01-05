import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/utils/cn'

type Trend = 'up' | 'down' | 'flat'

export interface StatCardProps {
  label: string
  value: string | number
  delta: number
  trend: Trend
  period: string
}

const trendClasses: Record<Trend, string> = {
  up: 'text-emerald-500',
  down: 'text-text-subtle',
  flat: 'text-text-subtle',
}

const trendIcon = (trend: Trend) => {
  if (trend === 'up') return ArrowUpRight
  if (trend === 'down') return ArrowDownRight
  return Minus
}

export const StatCard = ({ label, value, delta, trend, period }: StatCardProps) => {
  const Icon = trendIcon(trend)

  return (
    <Card>
      <CardContent className="space-y-2 px-6 py-5">
        <p className="text-[10px] uppercase tracking-[0.28em] text-text-muted">
          {label}
        </p>
        <div className="flex items-start justify-between gap-3">
          <div className="text-3xl font-semibold text-text">{value}</div>
          <div
            className={cn('flex items-center gap-1 text-[11px]', trendClasses[trend])}
          >
            <Icon className="h-4 w-4" />
            <span>{delta}%</span>
          </div>
        </div>
        <p className="text-[11px] text-text-subtle">{period}</p>
      </CardContent>
    </Card>
  )
}
