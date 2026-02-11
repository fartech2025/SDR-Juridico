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
  Filter,
  Plus,
  ClipboardList,
  ListTodo
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { PageState } from '@/components/PageState'
import { Modal } from '@/components/ui/modal'
import type { AgendaItem, AgendaStatus, Tarefa } from '@/types/domain'
import { cn } from '@/utils/cn'
import { useAgenda } from '@/hooks/useAgenda'
import { useTarefas } from '@/hooks/useTarefas'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useGoogleCalendarCreate } from '@/hooks/useGoogleCalendarCreate'

// Unified calendar item type
type CalendarItemType = 'evento' | 'tarefa'
interface UnifiedCalendarItem {
  id: string
  title: string
  date: string
  time: string
  durationMinutes: number
  tipo: string
  status: AgendaStatus
  cliente?: string
  itemType: CalendarItemType
  originalItem: AgendaItem | Tarefa
}

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

const tipoIcons: Record<string, React.ReactNode> = {
  reuniao: <Users className="h-3.5 w-3.5" />,
  ligacao: <Phone className="h-3.5 w-3.5" />,
  videochamada: <Video className="h-3.5 w-3.5" />,
  audiencia: <Gavel className="h-3.5 w-3.5" />,
  prazo: <Clock className="h-3.5 w-3.5" />,
  tarefa: <ListTodo className="h-3.5 w-3.5" />,
  default: <Calendar className="h-3.5 w-3.5" />,
}

// Tarefa styles
const tarefaStyles = {
  container: 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300 text-purple-900',
  badge: 'bg-purple-100 border-purple-200 text-purple-700',
}

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
  concluido: 'Concluída',
}

const statusStyles: Record<AgendaStatus, { container: string; badge: string }> = {
  confirmado: {
    container: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 text-blue-900',
    badge: 'bg-blue-100 border-blue-200 text-blue-700',
  },
  pendente: {
    container: 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-300 text-amber-900',
    badge: 'bg-amber-100 border-amber-200 text-amber-700',
  },
  cancelado: {
    container: 'bg-gradient-to-br from-red-50 to-red-100 border-red-300 text-red-900',
    badge: 'bg-red-100 border-red-200 text-red-700',
  },
  concluido: {
    container: 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-300 text-emerald-900',
    badge: 'bg-emerald-100 border-emerald-200 text-emerald-700',
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

const buildFormState = (overrides: Partial<EditorFormState> = {}): EditorFormState => {
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
    loading: loadingAgenda,
    error: errorAgenda,
    createEvento,
    updateEvento,
    deleteEvento,
  } = useAgenda()
  const {
    tarefas,
    loading: loadingTarefas,
    error: errorTarefas,
  } = useTarefas()
  const { displayName, user } = useCurrentUser()

  const loading = loadingAgenda || loadingTarefas
  const error = errorAgenda || errorTarefas

  // Convert tarefas to unified calendar items
  const tarefasAsCalendarItems = React.useMemo((): UnifiedCalendarItem[] => {
    return tarefas
      .filter(t => t.dueDate && t.status !== 'concluida')
      .map(t => {
        const dueDate = new Date(t.dueDate!)
        const dateStr = toIsoDate(dueDate)
        const timeStr = `${String(dueDate.getHours()).padStart(2, '0')}:${String(dueDate.getMinutes()).padStart(2, '0')}`

        // Map tarefa status to agenda status for styling
        const statusMap: Record<string, AgendaStatus> = {
          pendente: 'pendente',
          em_andamento: 'confirmado',
          aguardando_validacao: 'pendente',
          concluida: 'concluido',
          devolvida: 'cancelado',
        }

        return {
          id: `tarefa-${t.id}`,
          title: t.title,
          date: dateStr,
          time: timeStr || '09:00',
          durationMinutes: 60,
          tipo: 'tarefa',
          status: statusMap[t.status] || 'pendente',
          cliente: t.casoId ? 'Vinculado a caso' : undefined,
          itemType: 'tarefa' as CalendarItemType,
          originalItem: t,
        }
      })
  }, [tarefas])

  // Convert agenda items to unified calendar items
  const agendaAsCalendarItems = React.useMemo((): UnifiedCalendarItem[] => {
    return agendaItems.map(item => ({
      id: item.id,
      title: item.title,
      date: item.date,
      time: item.time,
      durationMinutes: item.durationMinutes,
      tipo: item.tipo || item.type || 'default',
      status: item.status,
      cliente: item.cliente,
      itemType: 'evento' as CalendarItemType,
      originalItem: item,
    }))
  }, [agendaItems])

  // Combined items
  const allCalendarItems = React.useMemo(() => {
    return [...agendaAsCalendarItems, ...tarefasAsCalendarItems]
  }, [agendaAsCalendarItems, tarefasAsCalendarItems])
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
  const [formState, setFormState] = React.useState<EditorFormState>(() => buildFormState())
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
  const monthLabel = React.useMemo(() => formatMonthLabel(currentDate), [currentDate])

  const weekDays = React.useMemo(() => {
    return Array.from({ length: 5 }, (_, index) => {
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
    const map = new Map<string, UnifiedCalendarItem[]>()
    const filteredItems = activeFilter === 'all'
      ? allCalendarItems
      : allCalendarItems.filter(item => item.tipo === activeFilter)

    filteredItems.forEach((item) => {
      const list = map.get(item.date) ?? []
      list.push(item)
      map.set(item.date, list)
    })
    map.forEach((list) => list.sort((a, b) => toMinutes(a.time) - toMinutes(b.time)))
    return map
  }, [allCalendarItems, activeFilter])

  const calendarEvents = React.useMemo(() => {
    const weekDates = new Set(weekDays.map((day) => day.iso))
    const filteredItems = activeFilter === 'all'
      ? allCalendarItems
      : allCalendarItems.filter(item => item.tipo === activeFilter)

    return filteredItems
      .filter((item) => weekDates.has(item.date))
      .map((item) => {
        const dayIndex = weekDays.findIndex((day) => day.iso === item.date)
        const slotIndex = timeSlots.findIndex(
          (slot) => slot.split(':')[0] === item.time.split(':')[0],
        )
        if (dayIndex === -1 || slotIndex === -1) return null
        const span = Math.max(1, Math.ceil(item.durationMinutes / 60))
        return { id: item.id, dayIndex, slotIndex, span, item }
      })
      .filter(Boolean) as Array<{ id: string; dayIndex: number; slotIndex: number; span: number; item: UnifiedCalendarItem }>
  }, [allCalendarItems, weekDays, activeFilter])

  const upcomingItems = React.useMemo(() => {
    const now = new Date()
    return allCalendarItems
      .map((item) => ({ item, at: new Date(`${item.date}T${item.time}:00`) }))
      .filter(({ at }) => !Number.isNaN(at.getTime()) && at >= now)
      .sort((a, b) => a.at.getTime() - b.at.getTime())
      .map(({ item }) => item)
  }, [allCalendarItems])

  // Tasks without due date
  const tarefasSemPrazo = React.useMemo(() => {
    return tarefas
      .filter(t => !t.dueDate && t.status !== 'concluida')
      .sort((a, b) => a.priority === 'alta' ? -1 : b.priority === 'alta' ? 1 : 0)
  }, [tarefas])

  const metrics = React.useMemo(() => {
    const now = new Date()
    const weekStart = startOfWeek(now)
    const weekEnd = addDays(weekStart, 7)

    const thisWeekEvents = allCalendarItems.filter(item => {
      const eventDate = new Date(item.date)
      return eventDate >= weekStart && eventDate < weekEnd
    })

    const totalMinutes = thisWeekEvents.reduce((sum, item) => sum + (item.durationMinutes || 30), 0)
    const hoursScheduled = Math.round(totalMinutes / 60 * 10) / 10

    const confirmed = allCalendarItems.filter(e => e.status === 'confirmado').length
    const total = allCalendarItems.length
    const confirmationRate = total > 0 ? Math.round((confirmed / total) * 100) : 0

    const tarefasCount = tarefasAsCalendarItems.length
    const audienciasCount = allCalendarItems.filter(e => e.tipo === 'audiencia').length

    return { hoursScheduled, eventsThisWeek: thisWeekEvents.length, confirmationRate, tarefasCount, audienciasCount }
  }, [allCalendarItems, tarefasAsCalendarItems])

  const openEditor = (mode: 'create' | 'edit', item?: AgendaItem | null) => {
    if (mode === 'edit' && item) {
      setEditorMode('edit')
      setEditingItem(item)
      setFormState(buildFormState({
        title: item.title,
        date: item.date,
        time: item.time,
        durationMinutes: item.durationMinutes || 30,
        location: item.location === 'Indefinido' ? '' : item.location,
        status: item.status,
      }))
    } else {
      setEditorMode('create')
      setEditingItem(null)
      setFormState(buildFormState({ date: selectedIso }))
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
    setFormState(buildFormState({ date, time: time ?? '09:00' }))
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
        titulo: 'Horário de Almoço',
        data_inicio: startAt.toISOString(),
        data_fim: endAt.toISOString(),
        local: 'Escritório',
        descricao: null,
        cliente_id: null,
        caso_id: null,
        lead_id: null,
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
          lead_id: null,
          responsavel: displayName || 'Sistema',
          tipo: editingItem?.type || 'reuniao',
          status: formState.status,
          cliente_nome: null,
          duracao_minutos: duration,
          observacoes: null,
        })
      }

      // Sincronizar com Google Calendar (best-effort, não bloqueia o save)
      try {
        console.log('📅 Tentando sync com Google Calendar...')
        const gcResult = await createMeeting({
          title,
          startTime: startAt,
          endTime: endAt,
          location: formState.location.trim() || undefined,
          videoConference: false,
        })
        console.log('✅ Google Calendar sync OK:', gcResult)
        alert('✅ Compromisso sincronizado com Google Calendar!')
      } catch (gcErr) {
        // Google Calendar sync é opcional — não falha o save
        const gcMsg = gcErr instanceof Error ? gcErr.message : String(gcErr)
        console.warn('⚠️ Google Calendar sync falhou:', gcMsg)
        alert('⚠️ Compromisso salvo localmente, mas NÃO sincronizou com Google Calendar:\n' + gcMsg)
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
      setEditorError(err instanceof Error ? err.message : 'Erro ao excluir evento')
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
      new Date(currentDate.getFullYear(), currentDate.getMonth() + (direction === 'prev' ? -1 : 1), 1)
    )
  }

  return (
    <div className="min-h-screen bg-surface-alt p-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text">AGENDA</h1>
            <p className="mt-1 text-sm text-text-muted">
              Bom dia, {displayName}. Gerencie seus compromissos e eventos.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openEditor('create')}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          >
            <Plus className="h-4 w-4" />
            Novo Evento
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info-bg">
                <Calendar className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text">{metrics.eventsThisWeek}</p>
                <p className="text-sm text-text-muted">Eventos semana</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-accent-100">
                <ListTodo className="h-5 w-5 text-brand-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text">{metrics.tarefasCount}</p>
                <p className="text-sm text-text-muted">Tarefas</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-bg">
                <Gavel className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text">{metrics.audienciasCount}</p>
                <p className="text-sm text-text-muted">Audiências</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-bg">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text">{metrics.confirmationRate}%</p>
                <p className="text-sm text-text-muted">Taxa confirmação</p>
              </div>
            </div>
          </div>
        </div>

        <PageState status={pageState} emptyTitle="Nenhum compromisso encontrado">
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Filter className="h-4 w-4 text-text-muted" />
              <button
                onClick={() => setActiveFilter('all')}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                  activeFilter === 'all'
                    ? 'border-brand-primary bg-brand-primary text-white'
                    : 'border-border bg-surface text-text hover:bg-surface-alt'
                )}
              >
                Todos
              </button>
              <button
                onClick={() => setActiveFilter('reuniao')}
                className={cn(
                  'flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-all',
                  activeFilter === 'reuniao'
                    ? 'border-brand-primary bg-brand-primary text-white'
                    : 'border-border bg-surface text-text hover:bg-surface-alt'
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
                    ? 'border-brand-primary bg-brand-primary text-white'
                    : 'border-border bg-surface text-text hover:bg-surface-alt'
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
                    ? 'border-brand-primary bg-brand-primary text-white'
                    : 'border-border bg-surface text-text hover:bg-surface-alt'
                )}
              >
                <Gavel className="h-3 w-3" />
                Audiência
              </button>
              <button
                onClick={() => setActiveFilter('tarefa')}
                className={cn(
                  'flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-all',
                  activeFilter === 'tarefa'
                    ? 'border-brand-primary bg-brand-primary text-white'
                    : 'border-border bg-surface text-text hover:bg-surface-alt'
                )}
              >
                <ListTodo className="h-3 w-3" />
                Tarefas
              </button>
            </div>

            {/* Agenda Controls */}
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface-alt p-3 mb-4">
              <button
                onClick={() => setAgendaAberta(!agendaAberta)}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-all',
                  agendaAberta
                    ? 'border-success-border bg-success-bg text-success'
                    : 'border-danger-border bg-danger-bg text-danger'
                )}
              >
                {agendaAberta ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                {agendaAberta ? 'Agenda Aberta' : 'Agenda Fechada'}
              </button>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-text-muted" />
                <span className="text-xs text-text">Almoço:</span>
                <select
                  value={horariosAlmoco.inicio}
                  onChange={(e) => setHorariosAlmoco(prev => ({ ...prev, inicio: e.target.value }))}
                  className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-text"
                >
                  <option value="12:00">12:00</option>
                  <option value="12:30">12:30</option>
                  <option value="13:00">13:00</option>
                </select>
                <span className="text-xs text-text">até</span>
                <select
                  value={horariosAlmoco.fim}
                  onChange={(e) => setHorariosAlmoco(prev => ({ ...prev, fim: e.target.value }))}
                  className="rounded-lg border border-border-strong bg-surface px-2 py-1 text-xs text-text"
                >
                  <option value="13:00">13:00</option>
                  <option value="13:30">13:30</option>
                  <option value="14:00">14:00</option>
                </select>
                <button
                  onClick={handleCreateLunchBreak}
                  className="flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1 text-xs font-semibold text-white transition-all hover:bg-amber-600"
                >
                  <Clock className="h-3 w-3" />
                  Bloquear Almoço
                </button>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleNavigate('prev')}
                  className="rounded-lg border border-border bg-surface p-2 text-text-muted hover:bg-surface-alt"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('next')}
                  className="rounded-lg border border-border bg-surface p-2 text-text-muted hover:bg-surface-alt"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <span className="text-sm font-semibold text-text">
                  {viewMode === 'week' ? weekLabel : monthLabel}
                </span>
              </div>
              <div className="inline-flex rounded-lg border border-border bg-surface-alt p-1 text-xs">
                <button
                  type="button"
                  className={cn(
                    'rounded-md px-3 py-1.5 font-medium transition-all',
                    viewMode === 'week'
                      ? 'bg-surface text-text shadow-sm'
                      : 'text-text-muted hover:text-text'
                  )}
                  onClick={() => setViewMode('week')}
                >
                  Semana
                </button>
                <button
                  type="button"
                  className={cn(
                    'rounded-md px-3 py-1.5 font-medium transition-all',
                    viewMode === 'month'
                      ? 'bg-surface text-text shadow-sm'
                      : 'text-text-muted hover:text-text'
                  )}
                  onClick={() => setViewMode('month')}
                >
                  Mês
                </button>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[2.3fr_1fr]">
              {/* Calendar Grid */}
              <div className="rounded-xl border border-border bg-surface p-4">
                {viewMode === 'week' ? (
                  <div className="space-y-2">
                    {/* Week header */}
                    <div className="grid grid-cols-[60px_repeat(5,1fr)] gap-2">
                      <div></div>
                      {weekDays.map((day) => (
                        <div
                          key={day.iso}
                          className={cn(
                            'rounded-lg py-2 text-center text-sm font-semibold',
                            day.isToday ? 'bg-brand-primary text-white' : 'bg-surface-alt text-text'
                          )}
                        >
                          <div className="text-xs opacity-80">{day.label}</div>
                          <div className="text-base">{day.date}</div>
                        </div>
                      ))}
                    </div>

                    {/* Time slots */}
                    <div className="space-y-1">
                      {timeSlots.map((slot) => (
                        <div key={slot} className="grid grid-cols-[60px_repeat(5,1fr)] gap-2">
                          <div className="text-right pr-3 pt-2 text-sm font-bold text-text" style={{ height: '6rem' }}>
                            {slot}
                          </div>
                          {weekDays.map((day) => {
                            const slotEvents = calendarEvents.filter(
                              e => e.dayIndex === weekDays.findIndex(d => d.iso === day.iso) &&
                                   timeSlots[e.slotIndex] === slot
                            )

                            return (
                              <div key={`${day.iso}-${slot}`} className="relative" style={{ height: '6rem' }}>
                                <button
                                  type="button"
                                  className="absolute inset-0 rounded-lg border border-border bg-surface-alt transition hover:bg-surface-alt group"
                                  onClick={() => handleSlotCreate(day.iso, slot)}
                                >
                                  <span className="absolute inset-0 flex items-center justify-center text-2xl font-light text-text-subtle opacity-0 group-hover:opacity-100 transition-opacity">
                                    +
                                  </span>
                                </button>

                                {slotEvents.map((event) => {
                                  const isTarefa = event.item.itemType === 'tarefa'
                                  const styles = isTarefa ? tarefaStyles : (statusStyles[event.item.status] ?? statusStyles.pendente)
                                  const tipoIcon = tipoIcons[event.item.tipo || 'default'] || tipoIcons.default
                                  const statusIcon = statusIcons[event.item.status]

                                  const handleClick = () => {
                                    if (isTarefa) {
                                      navigate('/app/tarefas')
                                    } else {
                                      openEditor('edit', event.item.originalItem as AgendaItem)
                                    }
                                  }

                                  return (
                                    <div
                                      key={event.id}
                                      role="button"
                                      tabIndex={0}
                                      className={cn(
                                        'absolute inset-1 z-10 cursor-pointer rounded-lg border px-2 py-2 text-left shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl overflow-hidden',
                                        styles.container,
                                      )}
                                      style={{
                                        height: event.span > 1 ? `calc(${event.span * 6}rem + ${(event.span - 1) * 0.25}rem - 0.5rem)` : 'calc(100% - 0.5rem)'
                                      }}
                                      onClick={handleClick}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') handleClick()
                                      }}
                                    >
                                      <div className="flex items-center justify-between text-[0.625rem] font-semibold mb-1">
                                        <div className="flex items-center gap-1">
                                          {tipoIcon}
                                          <span>{event.item.time}</span>
                                        </div>
                                        {isTarefa ? (
                                          <span className="rounded-full bg-surface/50 px-1.5 py-0.5 text-[0.5625rem]">
                                            Tarefa
                                          </span>
                                        ) : (
                                          <span className="rounded-full bg-surface/50 px-1.5 py-0.5 text-[0.5625rem]">
                                            {event.item.durationMinutes || 30}min
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[0.75rem] font-bold leading-tight truncate">
                                        {event.item.title}
                                      </div>
                                      <div className="text-[0.625rem] mt-0.5 opacity-90 truncate">
                                        {event.item.cliente}
                                      </div>
                                      <div className="mt-1 flex items-center gap-1">
                                        <span className={cn('inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[0.5625rem] font-semibold', styles.badge)}>
                                          {statusIcon}
                                          <span className="hidden sm:inline">{isTarefa ? 'Tarefa' : statusLabels[event.item.status]}</span>
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
                    <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-text">
                      {monthDayLabels.map((label, index) => (
                        <span key={`${label}-${index}`}>{label}</span>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-2 text-xs">
                      {monthMatrix.map((day, index) => {
                        if (!day) {
                          return <div key={`empty-${index}`} className="min-h-27.5" />
                        }
                        const dayEvents = eventsByDate.get(day.iso) ?? []
                        const isToday = day.iso === todayIso
                        const isSelected = day.iso === selectedIso
                        return (
                          <div
                            key={day.iso}
                            className={cn(
                              'min-h-27.5 rounded-lg border border-border bg-surface p-2 transition hover:bg-surface-alt cursor-pointer',
                              isSelected && 'border-brand-primary/40',
                            )}
                            onClick={() => handleSlotCreate(day.iso)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') handleSlotCreate(day.iso)
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={cn(
                                  'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                                  isToday && 'bg-brand-primary/15 text-brand-primary',
                                  isSelected && 'bg-brand-primary text-white',
                                )}
                              >
                                {day.number}
                              </span>
                              {dayEvents.length > 0 && (
                                <span className="text-[10px] font-medium text-text-muted">
                                  {dayEvents.length} eventos
                                </span>
                              )}
                            </div>
                            <div className="mt-2 space-y-1">
                              {dayEvents.slice(0, 3).map((event) => {
                                const isTarefa = event.itemType === 'tarefa'
                                return (
                                  <button
                                    key={event.id}
                                    type="button"
                                    className={cn(
                                      "w-full rounded-lg border px-2 py-1 text-left text-[11px] transition",
                                      isTarefa
                                        ? "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100"
                                        : event.tipo === 'audiencia'
                                          ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                          : "border-border bg-surface-alt text-text hover:bg-surface-alt"
                                    )}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (isTarefa) {
                                        navigate('/app/tarefas')
                                      } else {
                                        openEditor('edit', event.originalItem as AgendaItem)
                                      }
                                    }}
                                  >
                                    <div className="flex items-center gap-1 truncate font-semibold">
                                      {isTarefa && <ListTodo className="h-2.5 w-2.5" />}
                                      {event.tipo === 'audiencia' && <Gavel className="h-2.5 w-2.5" />}
                                      <span className="truncate">{event.title}</span>
                                    </div>
                                    <div className="text-[10px] opacity-75">{event.time}</div>
                                  </button>
                                )
                              })}
                              {dayEvents.length > 3 && (
                                <div className="text-[10px] font-medium text-text-muted">
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

              {/* Sidebar */}
              <div className="space-y-4">
                {/* Mini Calendar */}
                <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                  <div className="flex items-center justify-between text-sm text-text mb-3">
                    <span className="font-semibold">Calendário</span>
                    <span className="text-xs text-text-muted">{monthLabel}</span>
                  </div>
                  <div className="grid grid-cols-7 gap-2 text-center text-xs text-text-muted">
                    {monthDayLabels.map((label, index) => (
                      <span key={`${label}-${index}`}>{label}</span>
                    ))}
                    {monthMatrix.map((day, index) => {
                      if (!day) {
                        return <span key={`empty-mini-${index}`} className="py-1 text-transparent">0</span>
                      }
                      const hasEvents = eventsByDate.has(day.iso)
                      const isSelected = day.iso === selectedIso
                      const isToday = day.iso === todayIso
                      return (
                        <button
                          key={day.iso}
                          type="button"
                          className={cn(
                            'relative rounded-full py-1 text-xs font-medium transition hover:bg-surface-alt',
                            isSelected && 'bg-brand-primary text-white font-bold',
                            !isSelected && isToday && 'bg-brand-primary/10 text-brand-primary font-bold ring-2 ring-brand-primary/30',
                            hasEvents && !isSelected && !isToday && 'font-semibold text-text',
                            !hasEvents && !isSelected && !isToday && 'text-text-muted',
                          )}
                          onClick={() => setCurrentDate(day.date)}
                        >
                          {day.number}
                          {hasEvents && (
                            <span className={cn(
                              "absolute -bottom-0.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full",
                              isSelected ? "bg-surface" : "bg-brand-primary"
                            )} />
                          )}
                        </button>
                      )
                    })}
                  </div>
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-text-muted">
                      <div className="flex h-3 w-3 items-center justify-center rounded-full bg-blue-500">
                        <CheckCircle2 className="h-2 w-2 text-white" />
                      </div>
                      <span>Evento confirmado</span>
                    </div>
                    <div className="flex items-center gap-2 text-text-muted">
                      <div className="flex h-3 w-3 items-center justify-center rounded-full bg-purple-500">
                        <ListTodo className="h-2 w-2 text-white" />
                      </div>
                      <span>Tarefa</span>
                    </div>
                    <div className="flex items-center gap-2 text-text-muted">
                      <div className="flex h-3 w-3 items-center justify-center rounded-full bg-amber-500">
                        <Gavel className="h-2 w-2 text-white" />
                      </div>
                      <span>Audiência</span>
                    </div>
                  </div>
                </div>

                {/* Upcoming Events */}
                <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                  <div className="flex items-center justify-between text-sm text-text mb-3">
                    <span className="font-semibold">Próximos compromissos</span>
                    <button
                      type="button"
                      className="text-xs font-medium text-brand-primary hover:underline"
                      onClick={() => navigate('/app/tarefas')}
                    >
                      Ver tarefas
                    </button>
                  </div>
                  {upcomingItems.length === 0 ? (
                    <p className="text-xs text-text-muted">Nenhum compromisso agendado.</p>
                  ) : (
                    <div className="space-y-2">
                      {upcomingItems.slice(0, 4).map((item) => {
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

                        const isTarefa = item.itemType === 'tarefa'
                        const tipoIcon = tipoIcons[item.tipo || 'default'] || tipoIcons.default
                        const styles = isTarefa ? tarefaStyles : (statusStyles[item.status] || statusStyles.pendente)

                        const handleItemClick = () => {
                          if (isTarefa) {
                            navigate('/app/tarefas')
                          } else {
                            openEditor('edit', item.originalItem as AgendaItem)
                          }
                        }

                        return (
                          <button
                            key={item.id}
                            type="button"
                            className={cn(
                              "w-full rounded-lg border p-3 text-left transition-all hover:scale-[1.02] hover:shadow-md",
                              styles.container
                            )}
                            onClick={handleItemClick}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-1.5 mb-1">
                                  {tipoIcon}
                                  <p className="font-semibold text-sm leading-tight">{item.title}</p>
                                </div>
                                <p className="text-xs opacity-90">
                                  {item.time} • {item.cliente || (isTarefa ? 'Tarefa' : 'Sem cliente')}
                                </p>
                                {diff < 2 * 60 * 60 * 1000 && diff > 0 && (
                                  <p className="text-xs font-semibold mt-1">⏰ {timeUntil}</p>
                                )}
                              </div>
                              {statusIcons[item.status]}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Tasks without due date */}
                <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                  <div className="flex items-center justify-between text-sm text-text mb-3">
                    <span className="font-semibold">Tarefas sem prazo</span>
                    <button
                      type="button"
                      className="text-xs font-medium text-brand-primary hover:underline"
                      onClick={() => navigate('/app/tarefas')}
                    >
                      Ver todas
                    </button>
                  </div>
                  {tarefasSemPrazo.length === 0 ? (
                    <p className="text-xs text-text-muted">Nenhuma tarefa sem prazo.</p>
                  ) : (
                    <div className="space-y-2">
                      {tarefasSemPrazo.slice(0, 4).map((item) => {
                        const priorityColor = {
                          alta: 'border-red-200 bg-red-50 text-red-700',
                          normal: 'border-border bg-surface-alt text-text',
                          baixa: 'border-blue-200 bg-blue-50 text-blue-700',
                        }[item.priority] || 'border-border bg-surface-alt text-text'

                        const statusColor = {
                          pendente: 'bg-amber-100 text-amber-700',
                          em_andamento: 'bg-blue-100 text-blue-700',
                          aguardando_validacao: 'bg-purple-100 text-purple-700',
                          devolvida: 'bg-surface-alt text-text',
                          cancelada: 'bg-red-100 text-red-700',
                          concluida: 'bg-green-100 text-green-700',
                        }[item.status] || 'bg-surface-alt text-text'

                        return (
                          <button
                            key={item.id}
                            type="button"
                            className={cn(
                              "w-full rounded-lg border p-3 text-left transition-all hover:scale-[1.02] hover:shadow-md",
                              priorityColor
                            )}
                            onClick={() => navigate('/app/tarefas')}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <ListTodo className="h-3.5 w-3.5" />
                                  <p className="font-semibold text-sm leading-tight">{item.title}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", statusColor)}>
                                    {item.status.replace('_', ' ')}
                                  </span>
                                  {item.casoId && (
                                    <p className="text-xs opacity-75">Vinculado a caso</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </PageState>

        {/* Modal */}
        <Modal
          open={editorOpen}
          onClose={closeEditor}
          title={editorMode === 'edit' ? 'Editar compromisso' : 'Novo compromisso'}
          description="Atualize os detalhes do compromisso."
          footer={
            <>
              <button
                type="button"
                onClick={closeEditor}
                disabled={editorBusy}
                className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text hover:bg-surface-alt disabled:opacity-50"
              >
                Fechar
              </button>
              {editorMode === 'edit' && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={editorBusy}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Excluir
                </button>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={editorBusy}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: 'var(--brand-primary)' }}
              >
                {editorMode === 'edit' ? 'Salvar' : 'Criar'}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            {editorError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {editorError}
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-text">Título</label>
                <input
                  value={formState.title}
                  onChange={(e) => setFormState((prev) => ({ ...prev, title: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text placeholder:text-text-subtle focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  placeholder="Nome do compromisso"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text">Data</label>
                <input
                  type="date"
                  value={formState.date}
                  onChange={(e) => setFormState((prev) => ({ ...prev, date: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text">Hora</label>
                <input
                  type="time"
                  value={formState.time}
                  onChange={(e) => setFormState((prev) => ({ ...prev, time: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text">Duração (min)</label>
                <input
                  type="number"
                  min={15}
                  step={15}
                  value={formState.durationMinutes}
                  onChange={(e) => setFormState((prev) => ({ ...prev, durationMinutes: Number(e.target.value) || 0 }))}
                  className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text">Status</label>
                <select
                  value={formState.status}
                  onChange={(e) => setFormState((prev) => ({ ...prev, status: e.target.value as AgendaStatus }))}
                  className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                >
                  <option value="confirmado">Confirmada</option>
                  <option value="pendente">Pendente</option>
                  <option value="cancelado">Cancelada</option>
                </select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-text">Local</label>
                  {formState.title && formState.date && formState.time && (
                    <button
                      type="button"
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

                          const meetLink = result.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === 'video')?.uri || ''

                          if (meetLink) {
                            setFormState((prev) => ({ ...prev, location: meetLink }))
                            navigator.clipboard.writeText(meetLink).catch(() => {})
                          }
                        } catch (err) {
                          console.error('Erro ao criar Google Meet:', err)
                        } finally {
                          setIsCreatingGoogleMeet(false)
                        }
                      }}
                      disabled={isCreatingGoogleMeet}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text hover:bg-surface-alt disabled:opacity-50"
                    >
                      {isCreatingGoogleMeet ? (
                        <>
                          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Video className="h-3.5 w-3.5" />
                          Gerar Google Meet
                        </>
                      )}
                    </button>
                  )}
                </div>
                <input
                  value={formState.location}
                  onChange={(e) => setFormState((prev) => ({ ...prev, location: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text placeholder:text-text-subtle focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
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
