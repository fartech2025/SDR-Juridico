import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import heroLight from '@/assets/hero-light.svg'
import { PageState } from '@/components/PageState'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import type { AgendaItem, AgendaStatus } from '@/types/domain'
import { cn } from '@/utils/cn'
import { useAgenda } from '@/hooks/useAgenda'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useTheme } from '@/contexts/ThemeContext'

const resolveStatus = (
  value: string | null,
): 'loading' | 'empty' | 'error' | 'ready' => {
  if (value === 'loading' || value === 'empty' || value === 'error') {
    return value
  }
  return 'ready'
}

const weekDayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
const monthDayLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const timeSlots = Array.from({ length: 13 }, (_, index) => {
  const hour = String(8 + index).padStart(2, '0')
  return `${hour}:00`
})

const toIsoDate = (value: Date) => {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const addDays = (value: Date, amount: number) => {
  const next = new Date(value)
  next.setDate(next.getDate() + amount)
  return next
}

const startOfWeek = (value: Date) => {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - date.getDay())
  return date
}

const startOfMonth = (value: Date) =>
  new Date(value.getFullYear(), value.getMonth(), 1)

const endOfMonth = (value: Date) =>
  new Date(value.getFullYear(), value.getMonth() + 1, 0)

const toMinutes = (time: string) => {
  const [hour, minutes] = time.split(':').map((value) => Number(value) || 0)
  return hour * 60 + minutes
}

const formatMonthLabel = (value: Date) =>
  new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(
    value,
  )

const formatShortDate = (value: Date) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(
    value,
  )

const statusLabels: Record<AgendaStatus, string> = {
  confirmado: 'Confirmada',
  pendente: 'Pendente',
  cancelado: 'Cancelada',
}

const statusStyles: Record<
  AgendaStatus,
  { container: string; badge: string; button: string }
> = {
  confirmado: {
    container: 'bg-[#DDEBFF] border-[#7FB2FF] text-[#2F4D9B]',
    badge: 'bg-white/70 border-white/80 text-[#2F4D9B]',
    button: 'bg-white text-[#2F4D9B] border-white/70',
  },
  pendente: {
    container: 'bg-[#FFF1CC] border-[#FFC44D] text-[#8A6B20]',
    badge: 'bg-white/70 border-white/80 text-[#8A6B20]',
    button: 'bg-white text-[#8A6B20] border-white/70',
  },
  cancelado: {
    container: 'bg-[#FFE1E1] border-[#FF7A7A] text-[#9B3B3B]',
    badge: 'bg-white/70 border-white/80 text-[#9B3B3B]',
    button: 'bg-white text-[#9B3B3B] border-white/70',
  },
}

type EditorFormState = {
  title: string
  date: string
  time: string
  durationMinutes: number
  location: string
  status: AgendaStatus
}

const buildFormState = (
  overrides: Partial<EditorFormState> = {},
): EditorFormState => {
  const now = new Date()
  return {
    title: overrides.title ?? '',
    date: overrides.date ?? toIsoDate(now),
    time: overrides.time ?? '09:00',
    durationMinutes: overrides.durationMinutes ?? 30,
    location: overrides.location ?? '',
    status: overrides.status ?? 'pendente',
  }
}

export const AgendaPage = () => {
  const {
    eventos: agendaItems,
    loading,
    error,
    createEvento,
    updateEvento,
    deleteEvento,
  } = useAgenda()
  const { displayName, user } = useCurrentUser()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [viewMode, setViewMode] = React.useState<'week' | 'month'>('week')
  const [currentDate, setCurrentDate] = React.useState(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  })
  const [editorOpen, setEditorOpen] = React.useState(false)
  const [editorMode, setEditorMode] = React.useState<'create' | 'edit'>('create')
  const [editingItem, setEditingItem] = React.useState<AgendaItem | null>(null)
  const [editorBusy, setEditorBusy] = React.useState(false)
  const [editorError, setEditorError] = React.useState<string | null>(null)
  const [formState, setFormState] = React.useState<EditorFormState>(() =>
    buildFormState(),
  )

  const state = resolveStatus(params.get('state'))
  const baseState = loading ? 'loading' : error ? 'error' : 'ready'
  const pageState = state !== 'ready' ? state : baseState
  const todayIso = toIsoDate(new Date())
  const selectedIso = toIsoDate(currentDate)

  const weekStart = React.useMemo(() => startOfWeek(currentDate), [currentDate])
  const weekEnd = React.useMemo(() => addDays(weekStart, 6), [weekStart])
  const weekLabel = React.useMemo(
    () => `${formatShortDate(weekStart)} - ${formatShortDate(weekEnd)}`,
    [weekStart, weekEnd],
  )
  const monthLabel = React.useMemo(
    () => formatMonthLabel(currentDate),
    [currentDate],
  )

  const weekDays = React.useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(weekStart, index)
      const iso = toIsoDate(date)
      return {
        label: weekDayLabels[date.getDay()],
        date: date.getDate(),
        iso,
        isToday: iso === todayIso,
        isSelected: iso === selectedIso,
      }
    })
  }, [selectedIso, todayIso, weekStart])
  const monthMatrix = React.useMemo(() => {
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)
    const startWeekday = start.getDay()
    const totalDays = end.getDate()
    const totalCells = Math.ceil((startWeekday + totalDays) / 7) * 7

    return Array.from({ length: totalCells }, (_, index) => {
      const dayNumber = index - startWeekday + 1
      if (dayNumber < 1 || dayNumber > totalDays) return null
      const date = new Date(start.getFullYear(), start.getMonth(), dayNumber)
      return {
        date,
        iso: toIsoDate(date),
        number: dayNumber,
      }
    })
  }, [currentDate])

  const eventsByDate = React.useMemo(() => {
    const map = new Map<string, AgendaItem[]>()
    agendaItems.forEach((item) => {
      const list = map.get(item.date) ?? []
      list.push(item)
      map.set(item.date, list)
    })
    map.forEach((list) => list.sort((a, b) => toMinutes(a.time) - toMinutes(b.time)))
    return map
  }, [agendaItems])

  const calendarEvents = React.useMemo(() => {
    const weekDates = new Set(weekDays.map((day) => day.iso))
    return agendaItems
      .filter((item) => weekDates.has(item.date))
      .map((item) => {
        const dayIndex = weekDays.findIndex((day) => day.iso === item.date)
        const slotIndex = timeSlots.findIndex(
          (slot) => slot.split(':')[0] === item.time.split(':')[0],
        )
        if (dayIndex === -1 || slotIndex === -1) return null
        const span = Math.max(1, Math.ceil(item.durationMinutes / 60))
        return {
          id: item.id,
          dayIndex,
          slotIndex,
          span,
          item,
        }
      })
      .filter(Boolean) as Array<{
      id: string
      dayIndex: number
      slotIndex: number
      span: number
      item: AgendaItem
    }>
  }, [agendaItems, weekDays])

  const upcomingItems = React.useMemo(() => {
    const now = new Date()
    return agendaItems
      .map((item) => ({
        item,
        at: new Date(`${item.date}T${item.time}:00`),
      }))
      .filter(({ at }) => !Number.isNaN(at.getTime()) && at >= now)
      .sort((a, b) => a.at.getTime() - b.at.getTime())
      .map(({ item }) => item)
  }, [agendaItems])
  const openEditor = (mode: 'create' | 'edit', item?: AgendaItem | null) => {
    if (mode === 'edit' && item) {
      setEditorMode('edit')
      setEditingItem(item)
      setFormState(
        buildFormState({
          title: item.title,
          date: item.date,
          time: item.time,
          durationMinutes: item.durationMinutes || 30,
          location: item.location === 'Indefinido' ? '' : item.location,
          status: item.status,
        }),
      )
    } else {
      setEditorMode('create')
      setEditingItem(null)
      setFormState(
        buildFormState({
          date: selectedIso,
        }),
      )
    }
    setEditorError(null)
    setEditorOpen(true)
  }

  const closeEditor = () => {
    if (editorBusy) return
    setEditorOpen(false)
    setEditingItem(null)
  }

  const handleSlotCreate = (date: string, time?: string) => {
    setEditorMode('create')
    setEditingItem(null)
    setFormState(
      buildFormState({
        date,
        time: time ?? '09:00',
      }),
    )
    setEditorError(null)
    setEditorOpen(true)
  }

  const handleSave = async () => {
    setEditorBusy(true)
    setEditorError(null)
    try {
      const title = formState.title.trim() || 'Compromisso'
      const duration = Math.max(15, Number(formState.durationMinutes) || 30)
      const startAt = new Date(`${formState.date}T${formState.time}:00`)
      const endAt = new Date(startAt)
      endAt.setMinutes(endAt.getMinutes() + duration)
      const meta = {
        tipo: editingItem?.type ?? 'Compromisso',
        status: formState.status,
      }

      if (editorMode === 'edit' && editingItem) {
        await updateEvento(editingItem.id, {
          title,
          start_at: startAt.toISOString(),
          end_at: endAt.toISOString(),
          location: formState.location.trim() || null,
          meta,
        })
      } else {
        await createEvento({
          title,
          start_at: startAt.toISOString(),
          end_at: endAt.toISOString(),
          location: formState.location.trim() || null,
          description: null,
          owner_user_id: user?.id ?? null,
          lead_id: null,
          cliente_id: null,
          caso_id: null,
          external_provider: null,
          external_event_id: null,
          meta,
        })
      }

      setEditorOpen(false)
      setEditingItem(null)
    } catch (err) {
      setEditorError(err instanceof Error ? err.message : 'Erro ao salvar evento')
    } finally {
      setEditorBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!editingItem) return
    if (!window.confirm('Deseja excluir este compromisso?')) return
    setEditorBusy(true)
    setEditorError(null)
    try {
      await deleteEvento(editingItem.id)
      setEditorOpen(false)
      setEditingItem(null)
    } catch (err) {
      setEditorError(
        err instanceof Error ? err.message : 'Erro ao excluir evento',
      )
    } finally {
      setEditorBusy(false)
    }
  }

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (viewMode === 'week') {
      setCurrentDate(addDays(currentDate, direction === 'prev' ? -7 : 7))
      return
    }
    setCurrentDate(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + (direction === 'prev' ? -1 : 1),
        1,
      ),
    )
  }
  return (
    <div
      className={cn(
        'min-h-screen pb-12',
        isDark ? 'bg-[#0e1116] text-slate-100' : 'bg-[#fff6e9] text-[#1d1d1f]',
      )}
    >
      <div className="space-y-6">
        <header
          className={cn(
            'relative overflow-hidden rounded-3xl border p-6 shadow-[0_28px_60px_-48px_rgba(199,98,0,0.8)]',
            isDark
              ? 'border-slate-800 bg-gradient-to-br from-[#141820] via-[#10141b] to-[#0b0f14]'
              : 'border-[#f3c988] bg-gradient-to-br from-[#ffedd5] via-[#fff3e0] to-[#f7caaa]',
          )}
        >
          <div
            className={cn(
              'absolute inset-0 bg-no-repeat bg-right bg-[length:420px]',
              isDark ? 'opacity-20' : 'opacity-80',
            )}
            style={{ backgroundImage: `url(${heroLight})` }}
          />
          <div className="relative z-10 space-y-2">
            <p
              className={cn(
                'text-[11px] uppercase tracking-[0.32em]',
                isDark ? 'text-emerald-200' : 'text-[#9a5b1e]',
              )}
            >
              Agenda juridica
            </p>
            <h2
              className={cn(
                'font-display text-3xl',
                isDark ? 'text-slate-100' : 'text-[#2a1400]',
              )}
            >
              Agenda juridica
            </h2>
            <p
              className={cn(
                'text-sm',
                isDark ? 'text-slate-300' : 'text-[#7a4a1a]',
              )}
            >
              Bom dia, {displayName}
            </p>
          </div>
        </header>

        <PageState status={pageState} emptyTitle="Nenhum compromisso encontrado">
          <Card
            className={cn(
              'border',
              isDark
                ? 'border-slate-800 bg-slate-900/70'
                : 'border-[#f0d9b8] bg-white/95',
            )}
            style={{
              backgroundColor: 'var(--agenda-card)',
              borderColor: 'var(--agenda-border)',
              boxShadow: 'var(--agenda-shadow)',
            }}
          >
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-text">
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      'border',
                      isDark
                        ? 'border-slate-700 bg-slate-900 text-slate-100'
                        : 'border-[#f0d9b8] bg-white text-[#2a1400]',
                    )}
                    onClick={() => handleNavigate('prev')}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      'border',
                      isDark
                        ? 'border-slate-700 bg-slate-900 text-slate-100'
                        : 'border-[#f0d9b8] bg-white text-[#2a1400]',
                    )}
                    onClick={() => handleNavigate('next')}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-semibold">
                    {viewMode === 'week' ? weekLabel : monthLabel}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="rounded-2xl border bg-[#F7F8FC] p-1 text-xs"
                    style={{
                      borderColor: 'var(--agenda-border)',
                      boxShadow: 'var(--agenda-shadow-soft)',
                    }}
                  >
                    <button
                      type="button"
                      className={cn(
                        'rounded-xl px-3 py-1',
                        viewMode === 'week'
                          ? 'bg-white text-primary shadow-sm'
                          : 'text-text-subtle',
                      )}
                      onClick={() => setViewMode('week')}
                    >
                      Semana
                    </button>
                    <button
                      type="button"
                      className={cn(
                        'rounded-xl px-3 py-1',
                        viewMode === 'month'
                          ? 'bg-white text-primary shadow-sm'
                          : 'text-text-subtle',
                      )}
                      onClick={() => setViewMode('month')}
                    >
                      Mes
                    </button>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => openEditor('create')}
                  >
                    + Novo Evento
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-[2.3fr_1fr]">
                <div
                  className="rounded-3xl border bg-[#F7F8FC] p-4"
                  style={{
                    borderColor: 'var(--agenda-border)',
                    backgroundColor: 'var(--agenda-bg)',
                    boxShadow: 'var(--agenda-shadow)',
                  }}
                >
                  {viewMode === 'week' ? (
                    <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-2 text-xs text-text-muted">
                      <div />
                      {weekDays.map((day) => (
                        <div
                          key={day.iso}
                          className={cn(
                            'rounded-xl py-1 text-center text-sm text-text',
                            day.isToday && 'bg-primary/10 text-primary',
                            day.isSelected && 'border border-primary/30',
                          )}
                        >
                          {day.label} {day.date}
                        </div>
                      ))}
                      {timeSlots.map((slot) => (
                        <React.Fragment key={slot}>
                          <div className="text-right text-xs text-text-muted">
                            {slot}
                          </div>
                          {weekDays.map((day) => (
                            <button
                              key={`${day.iso}-${slot}`}
                              type="button"
                              className="h-20 rounded-xl border bg-white/70 transition hover:bg-white"
                              style={{ borderColor: 'var(--agenda-grid)' }}
                              onClick={() => handleSlotCreate(day.iso, slot)}
                            />
                          ))}
                        </React.Fragment>
                      ))}
                      {calendarEvents.map((event) => {
                        const row = event.slotIndex + 2
                        const col = event.dayIndex + 2
                        const styles =
                          statusStyles[event.item.status] ?? statusStyles.pendente
                        return (
                          <div
                            key={event.id}
                            role="button"
                            tabIndex={0}
                            className={cn(
                              'cursor-pointer rounded-2xl border px-3 py-3 text-left text-xs shadow-[0_10px_24px_rgba(18,38,63,0.12)]',
                              styles.container,
                            )}
                            style={{
                              gridColumnStart: col,
                              gridRowStart: row,
                              gridRowEnd: row + event.span,
                            }}
                            onClick={() => openEditor('edit', event.item)}
                            onKeyDown={(eventKey) => {
                              if (eventKey.key === 'Enter' || eventKey.key === ' ') {
                                openEditor('edit', event.item)
                              }
                            }}
                          >
                            <div className="flex items-center justify-between text-[10px] font-semibold">
                              <span>{event.item.time}</span>
                              <span className="rounded-full bg-white/60 px-2 py-0.5 text-[9px] text-text">
                                Agenda
                              </span>
                            </div>
                            <div className="mt-1 text-sm font-semibold text-text">
                              {event.item.title}
                            </div>
                            <div className="text-[11px] text-text-muted">
                              {event.item.cliente}
                            </div>
                            <div className="mt-2 inline-flex items-center gap-2">
                              <span
                                className={cn(
                                  'inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                                  styles.badge,
                                )}
                              >
                                {statusLabels[event.item.status]}
                              </span>
                              <button
                                type="button"
                                className={cn(
                                  'inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold',
                                  styles.button,
                                )}
                                onClick={(eventClick) => {
                                  eventClick.stopPropagation()
                                  if (event.item.casoId) {
                                    navigate(`/app/caso/${event.item.casoId}`)
                                  }
                                }}
                              >
                                Ver caso
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-7 gap-2 text-center text-xs text-text-muted">
                        {monthDayLabels.map((label) => (
                          <span key={label}>{label}</span>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-2 text-xs">
                        {monthMatrix.map((day, index) => {
                          if (!day) {
                            return (
                              <div
                                key={`empty-${index}`}
                                className="min-h-[110px] rounded-2xl border border-transparent"
                              />
                            )
                          }
                          const dayEvents = eventsByDate.get(day.iso) ?? []
                          const isToday = day.iso === todayIso
                          const isSelected = day.iso === selectedIso
                          return (
                            <div
                              key={day.iso}
                              className={cn(
                                'min-h-[110px] rounded-2xl border bg-white/80 p-2 transition hover:bg-white',
                                isSelected && 'border-primary/40',
                              )}
                              style={{ borderColor: 'var(--agenda-grid)' }}
                              onClick={() => handleSlotCreate(day.iso)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(eventKey) => {
                                if (eventKey.key === 'Enter' || eventKey.key === ' ') {
                                  handleSlotCreate(day.iso)
                                }
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <span
                                  className={cn(
                                    'rounded-full px-2 py-0.5 text-[11px]',
                                    isToday && 'bg-primary/10 text-primary',
                                    isSelected && 'bg-primary text-white',
                                  )}
                                >
                                  {day.number}
                                </span>
                                {dayEvents.length > 0 && (
                                  <span className="text-[10px] text-text-muted">
                                    {dayEvents.length} eventos
                                  </span>
                                )}
                              </div>
                              <div className="mt-2 space-y-1">
                                {dayEvents.slice(0, 3).map((event) => (
                                  <button
                                    key={event.id}
                                    type="button"
                                    className="w-full rounded-xl border bg-white px-2 py-1 text-left text-[11px] text-text shadow-soft"
                                    style={{ borderColor: 'var(--agenda-border)' }}
                                    onClick={(eventClick) => {
                                      eventClick.stopPropagation()
                                      openEditor('edit', event)
                                    }}
                                  >
                                    <div className="truncate font-semibold">
                                      {event.title}
                                    </div>
                                    <div className="text-[10px] text-text-muted">
                                      {event.time}
                                    </div>
                                  </button>
                                ))}
                                {dayEvents.length > 3 && (
                                  <div className="text-[10px] text-text-muted">
                                    +{dayEvents.length - 3} compromissos
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <Card
                    className="border bg-white"
                    style={{
                      backgroundColor: 'var(--agenda-card)',
                      borderColor: 'var(--agenda-border)',
                      boxShadow: 'var(--agenda-shadow)',
                    }}
                  >
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-sm text-text">
                        <span className="font-semibold">Calendario</span>
                        <span className="text-xs text-text-subtle">{monthLabel}</span>
                      </div>
                      <div className="grid grid-cols-7 gap-2 text-center text-xs text-text-muted">
                        {monthDayLabels.map((label) => (
                          <span key={label}>{label}</span>
                        ))}
                        {monthMatrix.map((day, index) => {
                          if (!day) {
                            return (
                              <span
                                key={`empty-mini-${index}`}
                                className="py-1 text-transparent"
                              >
                                0
                              </span>
                            )
                          }
                          const hasEvents = eventsByDate.has(day.iso)
                          const isSelected = day.iso === selectedIso
                          const isToday = day.iso === todayIso
                          return (
                            <button
                              key={day.iso}
                              type="button"
                              className={cn(
                                'relative rounded-full py-1 text-xs transition',
                                isSelected && 'bg-primary text-white',
                                !isSelected && isToday && 'bg-primary/10 text-primary',
                              )}
                              onClick={() => setCurrentDate(day.date)}
                            >
                              {day.number}
                              {hasEvents && (
                                <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
                              )}
                            </button>
                          )
                        })}
                      </div>
                      <div className="space-y-2 text-xs text-text-muted">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-[#7FB2FF]" />
                          Confirmada
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-[#FFC44D]" />
                          Pendente
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-[#FF7A7A]" />
                          Cancelada
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card
                    className="border bg-white"
                    style={{
                      backgroundColor: 'var(--agenda-card)',
                      borderColor: 'var(--agenda-border)',
                      boxShadow: 'var(--agenda-shadow)',
                    }}
                  >
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-sm text-text">
                        <span className="font-semibold">Proximas reunioes</span>
                        <button
                          type="button"
                          className="text-xs text-primary"
                          onClick={() => navigate('/app/agenda')}
                        >
                          Ver todos
                        </button>
                      </div>
                      {upcomingItems.length === 0 ? (
                        <p className="text-xs text-text-muted">
                          Nenhum compromisso agendado.
                        </p>
                      ) : (
                        upcomingItems.slice(0, 3).map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className="w-full rounded-2xl border bg-white px-3 py-3 text-left text-sm text-text hover:bg-[#F7F8FC]"
                            style={{
                              borderColor: 'var(--agenda-border)',
                              boxShadow: 'var(--agenda-shadow-soft)',
                            }}
                            onClick={() => openEditor('edit', item)}
                          >
                            <p className="font-semibold text-text">{item.title}</p>
                            <p className="text-xs text-text-muted">
                              {item.time} - {item.cliente}
                            </p>
                          </button>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </PageState>
        <Modal
          open={editorOpen}
          onClose={closeEditor}
          title={editorMode === 'edit' ? 'Editar compromisso' : 'Novo compromisso'}
          description="Atualize os detalhes do compromisso."
          footer={
            <>
              <Button variant="ghost" onClick={closeEditor} disabled={editorBusy}>
                Fechar
              </Button>
              {editorMode === 'edit' && (
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  disabled={editorBusy}
                >
                  Excluir
                </Button>
              )}
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={editorBusy}
              >
                {editorMode === 'edit' ? 'Salvar' : 'Criar'}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            {editorError && (
              <div className="rounded-2xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
                {editorError}
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <span className="text-xs uppercase tracking-wide text-text-subtle">
                  Titulo
                </span>
                <Input
                  value={formState.title}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-wide text-text-subtle">
                  Data
                </span>
                <Input
                  type="date"
                  value={formState.date}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      date: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-wide text-text-subtle">
                  Hora
                </span>
                <Input
                  type="time"
                  value={formState.time}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      time: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-wide text-text-subtle">
                  Duracao (min)
                </span>
                <Input
                  type="number"
                  min={15}
                  step={15}
                  value={formState.durationMinutes}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      durationMinutes: Number(event.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-wide text-text-subtle">
                  Status
                </span>
                <select
                  className="h-10 w-full rounded-2xl border border-border bg-white px-3 text-sm text-text shadow-soft focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={formState.status}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      status: event.target.value as AgendaStatus,
                    }))
                  }
                >
                  <option value="confirmado">Confirmada</option>
                  <option value="pendente">Pendente</option>
                  <option value="cancelado">Cancelada</option>
                </select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <span className="text-xs uppercase tracking-wide text-text-subtle">
                  Local
                </span>
                <Input
                  value={formState.location}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      location: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}
