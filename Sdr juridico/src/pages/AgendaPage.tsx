import * as React from 'react'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Phone, 
  Video, 
  Users, 
  Gavel, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  BarChart3,
  Filter
} from 'lucide-react'
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
import { useGoogleCalendarCreate } from '@/hooks/useGoogleCalendarCreate'

const resolveStatus = (
  value: string | null,
): 'loading' | 'empty' | 'error' | 'ready' => {
  if (value === 'loading' || value === 'empty' || value === 'error') {
    return value
  }
  return 'ready'
}

const weekDayLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex']
const monthDayLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const timeSlots = Array.from({ length: 9 }, (_, index) => {
  const hour = String(9 + index).padStart(2, '0')
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

// Ícones por tipo de evento
const tipoIcons: Record<string, React.ReactNode> = {
  reuniao: <Users className="h-3.5 w-3.5" />,
  ligacao: <Phone className="h-3.5 w-3.5" />,
  videochamada: <Video className="h-3.5 w-3.5" />,
  audiencia: <Gavel className="h-3.5 w-3.5" />,
  prazo: <Clock className="h-3.5 w-3.5" />,
  default: <Calendar className="h-3.5 w-3.5" />,
}

// Ícones por status
const statusIcons: Record<AgendaStatus, React.ReactNode> = {
  confirmado: <CheckCircle2 className="h-3.5 w-3.5" />,
  pendente: <AlertCircle className="h-3.5 w-3.5" />,
  cancelado: <XCircle className="h-3.5 w-3.5" />,
  concluido: <CheckCircle2 className="h-3.5 w-3.5" />,
}

const statusLabels: Record<AgendaStatus, string> = {
  confirmado: 'Confirmada',
  pendente: 'Pendente',
  cancelado: 'Cancelada',
  concluido: 'Concluida',
}

const statusStyles: Record<
  AgendaStatus,
  { container: string; badge: string; button: string }
> = {
  confirmado: {
    container: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 text-blue-900',
    badge: 'bg-blue-100 border-blue-200 text-blue-700',
    button: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100:bg-blue-800',
  },
  pendente: {
    container: 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-300 text-amber-900',
    badge: 'bg-amber-100 border-amber-200 text-amber-700',
    button: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100:bg-amber-800',
  },
  cancelado: {
    container: 'bg-gradient-to-br from-red-50 to-red-100 border-red-300 text-red-900',
    badge: 'bg-red-100 border-red-200 text-red-700',
    button: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100:bg-red-800',
  },
  concluido: {
    container: 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-300 text-emerald-900',
    badge: 'bg-emerald-100 border-emerald-200 text-emerald-700',
    button: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100:bg-emerald-800',
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
  const [activeFilter, setActiveFilter] = React.useState<string>('all')
  const [agendaAberta, setAgendaAberta] = React.useState(true)
  const [horariosAlmoco, setHorariosAlmoco] = React.useState<{ inicio: string; fim: string }>({ 
    inicio: '12:00', 
    fim: '13:00' 
  })
  const [formState, setFormState] = React.useState<EditorFormState>(() =>
    buildFormState(),
  )
  const { createMeeting, error: meetError } = useGoogleCalendarCreate()
  const [isCreatingGoogleMeet, setIsCreatingGoogleMeet] = React.useState(false)

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
    return Array.from({ length: 5 }, (_, index) => {
      // Começar na segunda-feira (dia 1 da semana)
      const date = addDays(weekStart, index + 1)
      const iso = toIsoDate(date)
      return {
        label: weekDayLabels[index],
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
    const filteredItems = activeFilter === 'all' 
      ? agendaItems 
      : agendaItems.filter(item => item.tipo === activeFilter)
    
    filteredItems.forEach((item) => {
      const list = map.get(item.date) ?? []
      list.push(item)
      map.set(item.date, list)
    })
    map.forEach((list) => list.sort((a, b) => toMinutes(a.time) - toMinutes(b.time)))
    return map
  }, [agendaItems, activeFilter])

  const calendarEvents = React.useMemo(() => {
    const weekDates = new Set(weekDays.map((day) => day.iso))
    const filteredItems = activeFilter === 'all' 
      ? agendaItems 
      : agendaItems.filter(item => item.tipo === activeFilter)
    
    return filteredItems
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
  }, [agendaItems, weekDays, activeFilter])

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

  // Métricas
  const metrics = React.useMemo(() => {
    const now = new Date()
    const weekStart = startOfWeek(now)
    const weekEnd = addDays(weekStart, 7)
    
    const thisWeekEvents = agendaItems.filter(item => {
      const eventDate = new Date(item.date)
      return eventDate >= weekStart && eventDate < weekEnd
    })
    
    const totalMinutes = thisWeekEvents.reduce((sum, item) => sum + (item.durationMinutes || 30), 0)
    const hoursScheduled = Math.round(totalMinutes / 60 * 10) / 10
    
    const confirmed = agendaItems.filter(e => e.status === 'confirmado').length
    const total = agendaItems.length
    const confirmationRate = total > 0 ? Math.round((confirmed / total) * 100) : 0
    
    return {
      hoursScheduled,
      eventsThisWeek: thisWeekEvents.length,
      confirmationRate
    }
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
    if (!agendaAberta) {
      alert('A agenda está fechada para novos agendamentos.')
      return
    }
    
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

  const handleCreateLunchBreak = async () => {
    if (!user) return
    
    const today = toIsoDate(new Date())
    const startAt = new Date(`${today}T${horariosAlmoco.inicio}:00`)
    const endAt = new Date(startAt)
    endAt.setMinutes(endAt.getMinutes() + 60)
    
    try {
      await createEvento({
        titulo: 'Horario de Almoco',
        data_inicio: startAt.toISOString(),
        data_fim: endAt.toISOString(),
        local: 'Escritorio',
        descricao: null,
        cliente_id: null,
        caso_id: null,
        responsavel: displayName || 'Sistema',
        tipo: 'interno',
        status: 'confirmado',
        cliente_nome: null,
        duracao_minutos: 60,
        observacoes: null,
      })
      alert('Horário de almoço bloqueado com sucesso!')
    } catch (err) {
      alert('Erro ao bloquear horário de almoço.')
    }
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
      if (editorMode === 'edit' && editingItem) {
        await updateEvento(editingItem.id, {
          titulo: title,
          data_inicio: startAt.toISOString(),
          data_fim: endAt.toISOString(),
          local: formState.location.trim() || null,
          tipo: editingItem.type || 'reuniao',
          status: formState.status,
          duracao_minutos: duration,
        })
      } else {
        await createEvento({
          titulo: title,
          data_inicio: startAt.toISOString(),
          data_fim: endAt.toISOString(),
          local: formState.location.trim() || null,
          descricao: null,
          cliente_id: null,
          caso_id: null,
          responsavel: displayName || 'Sistema',
          tipo: editingItem?.type || 'reuniao',
          status: formState.status,
          cliente_nome: null,
          duracao_minutos: duration,
          observacoes: null,
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
        'bg-base text-text',
      )}
    >
      <div className="space-y-6">
        <header
          className={cn(
            'relative overflow-hidden rounded-3xl border p-6 shadow-[0_28px_60px_-48px_rgba(15,23,42,0.35)]','border-border bg-gradient-to-br from-brand-primary-subtle via-surface to-surface-alt',
          )}
        >
          <div
            className={cn(
              'absolute inset-0 bg-no-repeat bg-right bg-[length:420px]',
              'opacity-90',
            )}
            style={{ backgroundImage: `url(${heroLight})` }}
          />
          <div className="relative z-10 space-y-2">
            <p
              className={cn(
                'text-[11px] uppercase tracking-[0.32em]',
                'text-text-muted',
              )}
            >
              Agenda juridica
            </p>
            <h2
              className={cn(
                'font-display text-3xl',
                'text-text',
              )}
            >
              Agenda juridica
            </h2>
            <p
              className={cn(
                'text-sm',
                'text-black',
              )}
            >
              Bom dia, {displayName}
            </p>
          </div>
        </header>

        <PageState status={pageState} emptyTitle="Nenhum compromisso encontrado">
          <Card
            className={cn(
              'border','border-border bg-white/95',
            )}
            style={{
              backgroundColor: 'var(--agenda-card)',
              borderColor: 'var(--agenda-border)',
              boxShadow: 'var(--agenda-shadow)',
            }}
          >
            <CardContent className="space-y-4">
              {/* Métricas */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-4 shadow-sm">
                  <div className="rounded-xl bg-blue-500 p-2">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-700">{metrics.hoursScheduled}h</p>
                    <p className="text-xs text-blue-600">Esta semana</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-4 shadow-sm">
                  <div className="rounded-xl bg-green-500 p-2">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-700">{metrics.eventsThisWeek}</p>
                    <p className="text-xs text-green-600">Eventos</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 p-4 shadow-sm">
                  <div className="rounded-xl bg-purple-500 p-2">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-700">{metrics.confirmationRate}%</p>
                    <p className="text-xs text-purple-600">Taxa confirmação</p>
                  </div>
                </div>
              </div>

              {/* Filtros */}
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="h-4 w-4 text-black" />
                <button
                  onClick={() => setActiveFilter('all')}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                    activeFilter === 'all'
                      ? 'border-emerald-600 bg-emerald-600 text-white shadow-md hover:bg-emerald-700'
                      : 'border-slate-200 bg-white text-black hover:bg-slate-50'
                  )}
                >
                  Todos
                </button>
                <button
                  onClick={() => setActiveFilter('reuniao')}
                  className={cn(
                    'flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-all',
                    activeFilter === 'reuniao'
                      ? 'border-primary bg-primary text-white shadow-md hover:bg-primary/90'
                      : 'border-slate-200 bg-white text-black hover:bg-slate-50'
                  )}
                >
                  <Users className="h-3 w-3" />
                  Reunião
                </button>
                <button
                  onClick={() => setActiveFilter('ligacao')}
                  className={cn(
                    'flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-all',
                    activeFilter === 'ligacao'
                      ? 'border-primary bg-primary text-white shadow-md hover:bg-primary/90'
                      : 'border-slate-200 bg-white text-black hover:bg-slate-50'
                  )}
                >
                  <Phone className="h-3 w-3" />
                  Ligação
                </button>
                <button
                  onClick={() => setActiveFilter('audiencia')}
                  className={cn(
                    'flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-all',
                    activeFilter === 'audiencia'
                      ? 'border-primary bg-primary text-white shadow-md hover:bg-primary/90'
                      : 'border-slate-200 bg-white text-black hover:bg-slate-50'
                  )}
                >
                  <Gavel className="h-3 w-3" />
                  Audiência
                </button>
              </div>

              {/* Controles da Agenda */}
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAgendaAberta(!agendaAberta)}
                    className={cn(
                      'flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all',
                      agendaAberta
                        ? 'border-green-300 bg-green-100 text-green-700'
                        : 'border-red-300 bg-red-100 text-red-700'
                    )}
                  >
                    {agendaAberta ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    {agendaAberta ? 'Agenda Aberta' : 'Agenda Fechada'}
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-black" />
                  <span className="text-xs text-black">Almoço:</span>
                  <select
                    value={horariosAlmoco.inicio}
                    onChange={(e) => setHorariosAlmoco(prev => ({ ...prev, inicio: e.target.value }))}
                    className="rounded-lg border border-slate-300 bg-white text-black px-2 py-1 text-xs"
                  >
                    <option value="12:00">12:00</option>
                    <option value="12:30">12:30</option>
                    <option value="13:00">13:00</option>
                  </select>
                  <span className="text-xs text-black">até</span>
                  <select
                    value={horariosAlmoco.fim}
                    onChange={(e) => setHorariosAlmoco(prev => ({ ...prev, fim: e.target.value }))}
                    className="rounded-lg border border-slate-300 bg-white text-black px-2 py-1 text-xs"
                  >
                    <option value="13:00">13:00</option>
                    <option value="13:30">13:30</option>
                    <option value="14:00">14:00</option>
                  </select>
                  <button
                    onClick={handleCreateLunchBreak}
                    className="flex items-center gap-1 rounded-lg border border-amber-500 bg-amber-500 px-3 py-1 text-xs font-semibold text-white transition-all hover:bg-amber-600:bg-amber-700 shadow-sm"
                  >
                    <Clock className="h-3 w-3" />
                    Bloquear Almoço
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-text">
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      'border','border-slate-300 bg-slate-50 text-black hover:bg-white',
                    )}
                    onClick={() => handleNavigate('prev')}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      'border','border-slate-300 bg-slate-50 text-black hover:bg-white',
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
                  <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs">
                    <button
                      type="button"
                      className={cn(
                        'rounded-lg px-3 py-1.5 font-medium transition-all',
                        viewMode === 'week'
                          ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                          : 'text-black hover:text-slate-900:text-slate-200',
                      )}
                      onClick={() => setViewMode('week')}
                    >
                      Semana
                    </button>
                    <button
                      type="button"
                      className={cn(
                        'rounded-lg px-3 py-1.5 font-medium transition-all',
                        viewMode === 'month'
                          ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                          : 'text-black hover:text-slate-900:text-slate-200',
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
                  className="rounded-3xl border border-slate-200 bg-white p-4"
                >
                  {viewMode === 'week' ? (
                    <div className="space-y-2">
                      {/* Header com dias da semana */}
                      <div className="grid grid-cols-[60px_repeat(5,1fr)] gap-2">
                        <div className="text-xs font-medium text-black"></div>
                        {weekDays.map((day) => (
                          <div
                            key={day.iso}
                            className={cn(
                              'rounded-xl py-2 text-center text-sm font-semibold',
                              day.isToday 
                                ? 'bg-emerald-500 text-white' 
                                : 'bg-slate-100 text-black'
                            )}
                          >
                            <div className="text-xs opacity-80">{day.label}</div>
                            <div className="text-base">{day.date}</div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Grid de horários */}
                      <div className="space-y-1">
                        {timeSlots.map((slot) => (
                          <div key={slot} className="grid grid-cols-[60px_repeat(5,1fr)] gap-2">
                            <div className="text-right pr-3 pt-2 font-bold" style={{ height: '6rem', color: 'rgb(0, 0, 0)', fontSize: '0.875rem', WebkitTextFillColor: 'rgb(0, 0, 0)' } as React.CSSProperties}>
                              {slot}
                            </div>
                            {weekDays.map((day) => {
                              // Encontrar eventos para este dia e horário
                              const slotEvents = calendarEvents.filter(
                                e => e.dayIndex === weekDays.findIndex(d => d.iso === day.iso) && 
                                     timeSlots[e.slotIndex] === slot
                              )
                              
                              return (
                                <div key={`${day.iso}-${slot}`} className="relative" style={{ height: '6rem' }}>
                                  <button
                                    type="button"
                                    className="absolute inset-0 rounded-xl border border-slate-200 bg-slate-50 transition hover:bg-slate-100 hover:shadow-sm group"
                                    onClick={() => handleSlotCreate(day.iso, slot)}
                                  >
                                    <span className="absolute inset-0 flex items-center justify-center text-2xl font-light text-black opacity-0 group-hover:opacity-100 transition-opacity">
                                      +
                                    </span>
                                  </button>
                                  
                                  {slotEvents.map((event) => {
                                    const styles = statusStyles[event.item.status] ?? statusStyles.pendente
                                    const tipoIcon = tipoIcons[event.item.tipo || 'default'] || tipoIcons.default
                                    const statusIcon = statusIcons[event.item.status]
                                    
                                    return (
                                      <div
                                        key={event.id}
                                        role="button"
                                        tabIndex={0}
                                        className={cn(
                                          'absolute inset-1 z-10 cursor-pointer rounded-xl border px-2 py-2 text-left shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl overflow-hidden',
                                          styles.container,
                                        )}
                                        style={{
                                          height: event.span > 1 ? `calc(${event.span * 6}rem + ${(event.span - 1) * 0.25}rem - 0.5rem)` : 'calc(100% - 0.5rem)'
                                        }}
                                        onClick={() => openEditor('edit', event.item)}
                                        onKeyDown={(eventKey) => {
                                          if (eventKey.key === 'Enter' || eventKey.key === ' ') {
                                            openEditor('edit', event.item)
                                          }
                                        }}
                                      >
                                        <div className="flex items-center justify-between text-[0.625rem] font-semibold mb-1">
                                          <div className="flex items-center gap-1">
                                            {tipoIcon}
                                            <span>{event.item.time}</span>
                                          </div>
                                          <span className="rounded-full bg-white/50 px-1.5 py-0.5 text-[0.5625rem]">
                                            {event.item.durationMinutes || 30}min
                                          </span>
                                        </div>
                                        <div className="text-[0.75rem] font-bold leading-tight truncate">
                                          {event.item.title}
                                        </div>
                                        <div className="text-[0.625rem] mt-0.5 opacity-90 truncate">
                                          {event.item.cliente}
                                        </div>
                                        <div className="mt-1 flex items-center gap-1 flex-wrap">
                                          <span className={cn('inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[0.5625rem] font-semibold', styles.badge)}>
                                            {statusIcon}
                                            <span className="hidden sm:inline">{statusLabels[event.item.status]}</span>
                                          </span>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-black">
                        {monthDayLabels.map((label, index) => (
                          <span key={`${label}-${index}`}>{label}</span>
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
                                'min-h-[110px] rounded-2xl border border-border bg-surface p-2 transition hover:bg-surface-hover',
                                isSelected && 'border-primary/40',
                              )}
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
                                    'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                                    isToday && 'bg-primary/15 text-primary',
                                    isSelected && 'bg-primary text-white',
                                  )}
                                >
                                  {day.number}
                                </span>
                                {dayEvents.length > 0 && (
                                  <span className="text-[10px] font-medium text-black">
                                    {dayEvents.length} eventos
                                  </span>
                                )}
                              </div>
                              <div className="mt-2 space-y-1">
                                {dayEvents.slice(0, 3).map((event) => (
                                  <button
                                    key={event.id}
                                    type="button"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2 py-1 text-left text-[11px] text-black shadow-sm hover:bg-slate-100 transition"
                                    onClick={(eventClick) => {
                                      eventClick.stopPropagation()
                                      openEditor('edit', event)
                                    }}
                                  >
                                    <div className="truncate font-semibold">
                                      {event.title}
                                    </div>
                                    <div className="text-[10px] text-black font-medium">
                                      {event.time}
                                    </div>
                                  </button>
                                ))}
                                {dayEvents.length > 3 && (
                                  <div className="text-[10px] font-medium text-black">
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
                    className="border border-slate-200 bg-white"
                  >
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-sm text-slate-900">
                        <span className="font-semibold">Calendario</span>
                        <span className="text-xs text-black font-medium">{monthLabel}</span>
                      </div>
                      <div className="grid grid-cols-7 gap-2 text-center text-xs text-black font-medium">
                        {monthDayLabels.map((label, index) => (
                          <span key={`${label}-${index}`}>{label}</span>
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
                                'relative rounded-full py-1 text-xs font-medium transition hover:bg-emerald-50:bg-emerald-900/30',
                                isSelected && 'bg-emerald-600 text-white font-bold',
                                !isSelected && isToday && 'bg-emerald-100 text-emerald-700 font-bold ring-2 ring-emerald-300',
                                hasEvents && !isSelected && !isToday && 'font-semibold text-black',
                                !hasEvents && !isSelected && !isToday && 'text-black',
                              )}
                              onClick={() => setCurrentDate(day.date)}
                            >
                              {day.number}
                              {hasEvents && (
                                <span className={cn(
                                  "absolute -bottom-0.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full",
                                  isSelected ? "bg-white" : "bg-emerald-600"
                                )} />
                              )}
                            </button>
                          )
                        })}
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-black font-medium">
                          <div className="flex h-3 w-3 items-center justify-center rounded-full bg-blue-500">
                            <CheckCircle2 className="h-2 w-2 text-white" />
                          </div>
                          <span>Confirmada</span>
                        </div>
                        <div className="flex items-center gap-2 text-black font-medium">
                          <div className="flex h-3 w-3 items-center justify-center rounded-full bg-amber-500">
                            <AlertCircle className="h-2 w-2 text-white" />
                          </div>
                          <span>Pendente</span>
                        </div>
                        <div className="flex items-center gap-2 text-black font-medium">
                          <div className="flex h-3 w-3 items-center justify-center rounded-full bg-red-500">
                            <XCircle className="h-2 w-2 text-white" />
                          </div>
                          <span>Cancelada</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card
                    className="border border-slate-200 bg-white"
                  >
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-sm text-slate-900">
                        <span className="font-semibold">Proximas reunioes</span>
                        <button
                          type="button"
                          className="text-xs font-medium text-emerald-600 hover:underline"
                          onClick={() => navigate('/app/agenda')}
                        >
                          Ver todos
                        </button>
                      </div>
                      {upcomingItems.length === 0 ? (
                        <p className="text-xs text-black font-medium">
                          Nenhum compromisso agendado.
                        </p>
                      ) : (
                        upcomingItems.slice(0, 4).map((item) => {
                          const itemDate = new Date(`${item.date}T${item.time}:00`)
                          const now = new Date()
                          const diff = itemDate.getTime() - now.getTime()
                          const hours = Math.floor(diff / (1000 * 60 * 60))
                          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
                          const timeUntil = hours > 24 
                            ? `em ${Math.floor(hours / 24)} dias`
                            : hours > 0 
                              ? `em ${hours}h ${minutes}min`
                              : `em ${minutes}min`
                          
                          const tipoIcon = tipoIcons[item.tipo || 'default'] || tipoIcons.default
                          const styles = statusStyles[item.status] || statusStyles.pendente
                          
                          return (
                            <button
                              key={item.id}
                              type="button"
                              className={cn(
                                "w-full rounded-2xl border p-3 text-left transition-all hover:scale-[1.02] hover:shadow-lg",
                                styles.container
                              )}
                              onClick={() => openEditor('edit', item)}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    {tipoIcon}
                                    <p className="font-semibold text-sm leading-tight text-slate-900">{item.title}</p>
                                  </div>
                                  <p className="text-xs opacity-90 text-black">
                                    {item.time} • {item.cliente || 'Sem cliente'}
                                  </p>
                                  {diff < 2 * 60 * 60 * 1000 && diff > 0 && (
                                    <p className="text-xs font-semibold mt-1 opacity-90">
                                      ⏰ {timeUntil}
                                    </p>
                                  )}
                                </div>
                                {statusIcons[item.status]}
                              </div>
                            </button>
                          )
                        })
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
                <span className="text-xs uppercase tracking-wide font-semibold text-black">
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
                <span className="text-xs uppercase tracking-wide font-semibold text-black">
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
                <span className="text-xs uppercase tracking-wide font-semibold text-black">
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
                <span className="text-xs uppercase tracking-wide font-semibold text-black">
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
                <span className="text-xs uppercase tracking-wide font-semibold text-black">
                  Status
                </span>
                <select
                  className="h-10 w-full rounded-2xl border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-soft focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-wide font-semibold text-black">
                    Local
                  </span>
                  {formState.title && formState.date && formState.time && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        setIsCreatingGoogleMeet(true)
                        try {
                          const startTime = new Date(`${formState.date}T${formState.time}`)
                          const endTime = new Date(startTime.getTime() + formState.durationMinutes * 60 * 1000)
                          
                          const result = await createMeeting({
                            title: formState.title,
                            startTime,
                            endTime,
                            videoConference: true,
                          })
                          
                          // Extrair link do Google Meet
                          const meetLink = result.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === 'video')?.uri || ''
                          
                          if (meetLink) {
                            setFormState((prev) => ({
                              ...prev,
                              location: meetLink,
                            }))
                            // Copiar para clipboard
                            navigator.clipboard.writeText(meetLink).catch(() => {})
                          }
                        } catch (err) {
                          console.error('Erro ao criar Google Meet:', err)
                        } finally {
                          setIsCreatingGoogleMeet(false)
                        }
                      }}
                      disabled={isCreatingGoogleMeet}
                      className="gap-1.5"
                    >
                      {isCreatingGoogleMeet ? (
                        <>
                          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent" />
                          <span className="text-xs">Gerando...</span>
                        </>
                      ) : (
                        <>
                          <Video className="h-3.5 w-3.5" />
                          <span className="text-xs">Gerar Google Meet</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>
                <Input
                  value={formState.location}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      location: event.target.value,
                    }))
                  }
                  placeholder="Clique em 'Gerar Google Meet' ou digite um local"
                />
                {meetError && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs space-y-2">
                    <p className="font-semibold">⚠️ Erro ao gerar Google Meet</p>
                    <p>{meetError.message}</p>
                    {meetError.message.includes('não está conectado') && (
                      <div className="bg-red-100 p-2 rounded mt-2 space-y-2">
                        <p className="font-medium">🚀 Conectar Google Calendar:</p>
                        <p className="text-xs text-red-600">Execute no terminal:</p>
                        <code className="block bg-red-900/20 p-1 rounded font-mono text-red-900 break-all">npm run connect:google</code>
                        <p className="text-xs text-red-600 mt-1">Depois autorize no Google e está pronto! ✨</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}
