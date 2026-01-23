import * as React from 'react'
import { CalendarClock, Plus } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TimelineEvent, TimelineCategory } from '@/types/domain'
import { cn } from '@/utils/cn'
import { formatDateTime } from '@/utils/format'

type FilterValue = TimelineCategory | 'all'

const filterOptions: { label: string; value: FilterValue }[] = [
  { label: 'Tudo', value: 'all' },
  { label: 'Docs', value: 'docs' },
  { label: 'Agenda', value: 'agenda' },
  { label: 'Comercial', value: 'comercial' },
  { label: 'Juridico', value: 'juridico' },
  { label: 'Automacao', value: 'automacao' },
  { label: 'Humano', value: 'humano' },
]

const categoryBadgeVariant = (
  category: TimelineCategory,
): 'default' | 'info' | 'warning' | 'success' | 'danger' => {
  if (category === 'docs') return 'info'
  if (category === 'agenda') return 'warning'
  if (category === 'comercial') return 'success'
  if (category === 'juridico') return 'danger'
  if (category === 'automacao') return 'info'
  return 'default'
}

export interface TimelineProps {
  events: TimelineEvent[]
  onAddEvent?: () => void
}

export const Timeline = ({ events, onAddEvent }: TimelineProps) => {
  const [activeFilter, setActiveFilter] = React.useState<FilterValue>('all')

  const filteredEvents = React.useMemo(() => {
    if (activeFilter === 'all') return events
    return events.filter((event) => event.category === activeFilter)
  }, [events, activeFilter])

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-accent" />
            <CardTitle className="text-base">Linha do Tempo do Caso</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onAddEvent}
            className="h-10 rounded-full px-4"
          >
            <Plus className="h-4 w-4" />
            Adicionar nota
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setActiveFilter(option.value)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition',
                activeFilter === option.value
                  ? 'border-primary/60 bg-primary/15 text-primary'
                  : 'border-border bg-white text-text-subtle hover:bg-[#F2F5FF] hover:text-text',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {filteredEvents.length === 0 && (
          <div className="rounded-2xl border border-border bg-white px-4 py-6 text-center text-sm text-text-muted shadow-[0_8px_20px_rgba(18,38,63,0.06)]">
            Nenhum evento encontrado para este filtro.
          </div>
        )}
        {filteredEvents.map((event, index) => (
          <div
            key={event.id}
            className="relative flex gap-4 rounded-2xl border border-border bg-white px-4 py-4 text-sm text-text-muted shadow-[0_8px_20px_rgba(18,38,63,0.06)]"
          >
            <div className="flex flex-col items-center">
              <span className="h-3 w-3 rounded-full bg-primary/80" />
              {index !== filteredEvents.length - 1 && (
                <span className="mt-2 h-full w-px bg-border-soft" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant={categoryBadgeVariant(event.category)}>
                    {event.category}
                  </Badge>
                  <span className="text-sm font-semibold text-text">
                    {event.title}
                  </span>
                </div>
                <span className="text-[10px] text-text-subtle">
                  {formatDateTime(event.date)}
                </span>
              </div>
              <p className="text-xs text-text-muted">{event.description}</p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-text-subtle">
                <span>Canal: {event.channel}</span>
                <span>-</span>
                <span>Autor: {event.author}</span>
              </div>
              {event.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
