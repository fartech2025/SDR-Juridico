import { BellRing, Check, CheckCheck, ChevronRight } from 'lucide-react'
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
  P0: 'border-red-200 bg-red-50 text-red-700',
  P1: 'border-amber-200 bg-amber-50 text-amber-700',
  P2: 'border-green-200 bg-green-50 text-green-700',
}

export interface NotificationCenterProps {
  notifications: Notification[]
  className?: string
  onMarkRead?: (id: string) => void
  onMarkAllRead?: () => void
}

export const NotificationCenter = ({
  notifications,
  className,
  onMarkRead,
  onMarkAllRead,
}: NotificationCenterProps) => {
  const navigate = useNavigate()
  const sorted = [...notifications].sort((a, b) => {
    const priority = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (priority !== 0) return priority
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })
  const unreadCount = sorted.filter((n) => !n.read).length

  return (
    <Card className={cn('bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm', className)}>
      <CardHeader className="flex-row items-center justify-between space-y-0 px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <BellRing className="h-4 w-4 text-gray-400" />
          <CardTitle className="text-sm font-semibold text-gray-900">Notificacoes</CardTitle>
          {unreadCount > 0 && (
            <span
              className="px-2 py-0.5 text-[10px] font-bold rounded-full text-white"
              style={{ backgroundColor: '#721011' }}
            >
              {unreadCount}
            </span>
          )}
        </div>
        {onMarkAllRead && unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-80"
            style={{ color: '#721011' }}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Marcar todas lidas
          </button>
        )}
      </CardHeader>
      <CardContent className="px-5 pb-5 space-y-2">
        {sorted.length === 0 && (
          <div className="text-center py-6 text-sm text-gray-400">
            Sem notificacoes por enquanto.
          </div>
        )}
        {sorted.map((item) => (
          <div
            key={item.id}
            className={cn(
              'rounded-lg border px-4 py-3 text-xs transition-all',
              item.read
                ? 'border-gray-100 bg-gray-50/50 opacity-70'
                : 'border-gray-200 bg-white shadow-sm',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  {!item.read && (
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: '#721011' }}
                    />
                  )}
                  <Badge
                    variant={
                      item.priority === 'P0'
                        ? 'danger'
                        : item.priority === 'P1'
                          ? 'warning'
                          : 'success'
                    }
                    className={cn('text-[10px] px-1.5 py-0', priorityBadgeClass[item.priority])}
                  >
                    {item.priority}
                  </Badge>
                  <span className="text-sm font-medium text-gray-900">
                    {item.title}
                  </span>
                </div>
                <p className="text-xs text-gray-500 pl-4">
                  {item.description}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-[10px] text-gray-400 whitespace-nowrap">
                  {formatDateTime(item.date)}
                </span>
                {onMarkRead && !item.read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onMarkRead(item.id)
                    }}
                    className="p-1 rounded hover:bg-gray-100 transition-colors"
                    title="Marcar como lida"
                  >
                    <Check className="h-3.5 w-3.5 text-gray-400" />
                  </button>
                )}
              </div>
            </div>
            {item.actionLabel && item.actionHref && (
              <div className="mt-2 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(item.actionHref!)}
                  className="px-0 text-xs hover:opacity-80"
                  style={{ color: '#721011' }}
                >
                  {item.actionLabel}
                  <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
