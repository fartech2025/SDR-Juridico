import { BellRing, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Notification, NotificationPriority } from '@/types/domain'
import { cn } from '@/utils/cn'
import { formatDateTime } from '@/utils/format'

const priorityOrder: Record<NotificationPriority, number> = {
  P0: 0,
  P1: 1,
  P2: 2,
}

const priorityBadgeClass: Record<NotificationPriority, string> = {
  P0: 'border-danger-border bg-danger-bg text-danger',
  P1: 'border-warning-border bg-warning-bg text-warning',
  P2: 'border-success-border bg-success-bg text-success',
}

export interface NotificationCenterProps {
  notifications: Notification[]
  className?: string
}

export const NotificationCenter = ({ notifications, className }: NotificationCenterProps) => {
  const navigate = useNavigate()
  const sorted = [...notifications].sort((a, b) => {
    const priority = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (priority !== 0) return priority
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })
  const miniSlots = sorted.slice(0, 6).map((item) => {
    const date = new Date(item.date)
    return {
      id: item.id,
      day: `${date.getDate()}`.padStart(2, '0'),
      time: date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }
  })
  const highlightSlot = miniSlots[1]?.id ?? miniSlots[0]?.id

  return (
    <Card className={cn('border-[#f0d9b8] bg-white/85', className)}>
      <CardHeader className="flex-row items-center justify-between space-y-0 px-6 pt-6 pb-2">
        <div className="flex items-center gap-2">
          <BellRing className="h-4 w-4 text-text-subtle" />
          <CardTitle className="text-sm">Notificacoes</CardTitle>
        </div>
        <span className="text-[11px] text-text-subtle">{sorted.length} itens</span>
      </CardHeader>
      <CardContent className="space-y-3 px-6 pb-6">
        {sorted.length === 0 && (
          <div className="rounded-2xl border border-[#f0d9b8] bg-white px-4 py-4 text-sm text-text-muted shadow-soft">
            Sem notificacoes por enquanto.
          </div>
        )}
        {sorted.length > 0 && (
          <div
            className={cn(
              'flex items-center gap-2 rounded-2xl border px-3 py-2 text-[11px] shadow-[0_8px_20px_rgba(18,38,63,0.06)]','border-[#f0d9b8] bg-white text-[#7a4a1a]',
            )}
          >
            <div
              className={cn(
                'flex min-w-[56px] flex-col items-start rounded-xl px-3 py-2 text-xs font-semibold',
                'bg-[#fff3e0] text-[#2a1400]',
              )}
            >
              <span className="text-sm">{sorted.length}</span>
              <span className={cn('text-[10px]', 'text-[#9a5b1e]')}>
                itens
              </span>
            </div>
            <div className="flex flex-1 items-center gap-2 overflow-hidden">
              {miniSlots.map((slot) => (
                <div
                  key={slot.id}
                  className={cn(
                    'flex min-w-[52px] flex-col items-center rounded-xl border px-2 py-2 text-[10px] shadow-soft',
                    slot.id === highlightSlot
                      ?'border-[#f0d9b8] bg-[#fff3e0] text-[#2a1400]'
                      :'border-[#f0d9b8] bg-white text-[#7a4a1a]',
                  )}
                >
                  <span className={cn('text-[11px] font-semibold', 'text-text')}>
                    {slot.day}
                  </span>
                  <span>{slot.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {sorted.map((item) => (
          <div
            key={item.id}
            className={cn(
              'rounded-2xl border px-4 py-4 text-xs shadow-[0_8px_20px_rgba(18,38,63,0.06)]','border-[#f0d9b8] !bg-white !text-[#2a1400]',
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      item.priority === 'P0'
                        ? 'danger'
                        : item.priority === 'P1'
                          ? 'warning'
                          : 'success'
                    }
                    className={priorityBadgeClass[item.priority]}
                  >
                    {item.priority}
                  </Badge>
                  <span className={cn('text-sm font-semibold', 'text-text')}>
                    {item.title}
                  </span>
                </div>
                <p className={cn('text-xs', 'text-text-muted')}>
                  {item.description}
                </p>
              </div>
              <div className={cn('text-[10px]', 'text-[#9a5b1e]')}>
                {formatDateTime(item.date)}
              </div>
            </div>
            {item.actionLabel && item.actionHref && (
              <div className="mt-3 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(item.actionHref!)}
                  className="px-0 text-primary hover:text-primary"
                >
                  {item.actionLabel}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
