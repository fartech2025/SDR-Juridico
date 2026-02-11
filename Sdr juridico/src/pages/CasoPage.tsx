import * as React from 'react'
import { createPortal } from 'react-dom'
import {
  ChevronDown,
  ChevronLeft,
  Filter,
  FileText,
  KeyRound,
  Search,
  ShieldCheck,
  Plus,
  Folder,
  Clock,
  Lightbulb,
  Phone,
  Pencil,
  Trash2,
  Copy,
  Scale,
  Newspaper,
  RefreshCw,
  ExternalLink,
  Link2,
  Unlink,
  Eye,
  Settings2,
  BookOpen,
} from 'lucide-react'
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom'

import { PageState } from '@/components/PageState'
import { Timeline } from '@/components/Timeline'
import { Modal } from '@/components/ui/modal'
import type { Caso, Tarefa, TimelineCategory, TimelineEvent, DOUPublicacao } from '@/types/domain'
import { cn } from '@/utils/cn'
import { formatDate, formatDateTime } from '@/utils/format'
import { useCasos } from '@/hooks/useCasos'
import { useLeads } from '@/hooks/useLeads'
import { useDocumentos } from '@/hooks/useDocumentos'
import { useNotas } from '@/hooks/useNotas'
import { useAgenda } from '@/hooks/useAgenda'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useTarefas } from '@/hooks/useTarefas'
import { useDatajudTimeline } from '@/hooks/useDatajudTimeline'
import { CasoDataJudSection } from '@/components/CasoDetail/CasoDataJudSection'
import { CasoDouSection } from '@/features/dou'
import { useDOU } from '@/hooks/useDOU'

const resolveStatus = (
  value: string | null,
): 'loading' | 'empty' | 'error' | 'ready' => {
  if (value === 'loading' || value === 'empty' || value === 'error') {
    return value
  }
  return 'ready'
}

const tabs = [
  'Tudo',
  'Documentos',
  'Agenda',
  'Tarefas',
  'Comercial',
  'Juridico',
  'Automacao',
  'Humano',
] as const
type TabKey = (typeof tabs)[number]

const CHECKLIST_PREFIX = '[Checklist] '

const categoryMap: Record<TabKey, string | null> = {
  Tudo: null,
  Documentos: 'docs',
  Agenda: 'agenda',
  Tarefas: null,
  Comercial: 'comercial',
  Juridico: 'juridico',
  Automacao: 'automacao',
  Humano: 'humano',
}

const eventCategoryOptions: { label: string; value: TimelineCategory }[] = [
  { label: 'Docs', value: 'docs' },
  { label: 'Agenda', value: 'agenda' },
  { label: 'Comercial', value: 'comercial' },
  { label: 'Juridico', value: 'juridico' },
  { label: 'Automacao', value: 'automacao' },
  { label: 'Humano', value: 'humano' },
]

const statusBadgeVariant = (status: Caso['status']) => {
  if (status === 'encerrado') return 'danger'
  if (status === 'suspenso') return 'warning'
  return 'success'
}

const normalizeChecklistTitle = (title: string) => {
  const trimmed = title.trim()
  if (trimmed.startsWith(CHECKLIST_PREFIX)) {
    return trimmed.slice(CHECKLIST_PREFIX.length).trim()
  }
  return trimmed
}

const buildChecklistTitle = (title: string) => {
  const trimmed = title.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith(CHECKLIST_PREFIX)) return trimmed
  return `${CHECKLIST_PREFIX}${trimmed}`
}

const toDateInput = (value?: string | null) => (value ? value.slice(0, 10) : '')

const taskStatusPill = (status: Tarefa['status']) => {
  if (status === 'concluida') return 'border-green-200 bg-green-50 text-green-700'
  if (status === 'em_andamento') return 'border-orange-200 bg-orange-50 text-orange-700'
  return 'border-border bg-surface-alt text-text-muted'
}

const taskPriorityPill = (priority: Tarefa['priority']) => {
  if (priority === 'alta') return 'border-red-200 bg-red-50 text-red-700'
  if (priority === 'normal') return 'border-blue-200 bg-blue-50 text-blue-700'
  return 'border-border bg-surface-alt text-text-muted'
}

const FALLBACK_CASO: Caso = {
  id: 'caso-sem-dados',
  title: 'Sem caso',
  cliente: 'Sem cliente',
  area: 'Geral',
  status: 'ativo',
  heat: 'morno',
  stage: 'triagem',
  value: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  tags: [],
  slaRisk: 'ok',
}

// Badge Component
const Badge = ({
  children,
  variant = 'default',
}: {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'primary' | 'accent'
}) => {
  const variants = {
    default: 'bg-surface-alt text-text',
    primary: 'bg-red-50 text-red-800',
    accent: 'bg-amber-50 text-amber-700',
    success: 'bg-green-50 text-green-700',
    warning: 'bg-orange-50 text-orange-700',
    danger: 'bg-red-50 text-red-700',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
        variants[variant]
      )}
    >
      {children}
    </span>
  )
}

// Tab Button Component
const TabButton = ({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: React.ReactNode
  onClick: () => void
}) => (
  <button
    onClick={onClick}
    type="button"
    className={cn(
      'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
      active
        ? 'bg-white text-text shadow-sm'
        : 'text-text-muted hover:text-text hover:bg-white/50'
    )}
  >
    {children}
  </button>
)

// Filter Chip Component
const FilterChip = ({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: React.ReactNode
  onClick: () => void
}) => (
  <button
    onClick={onClick}
    type="button"
    className={cn(
      'px-3 py-1.5 text-sm font-medium rounded-full border transition-all duration-200',
      active
        ? 'border-red-200 bg-red-50 text-red-800'
        : 'border-border bg-white text-text-muted hover:border-border-strong'
    )}
    style={
      active
        ? {
            borderColor: 'rgba(114, 16, 17, 0.2)',
            backgroundColor: 'rgba(114, 16, 17, 0.05)',
            color: 'var(--brand-primary)',
          }
        : {}
    }
  >
    {children}
  </button>
)

// Task Item Component
const TaskItem = ({
  title,
  status,
  onEdit,
  onDelete,
}: {
  title: string
  status: string
  onEdit: () => void
  onDelete: () => void
}) => (
  <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
    <span className="text-sm text-text">{title}</span>
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="h-7 w-7 flex items-center justify-center rounded-lg border border-border bg-white text-text-muted hover:bg-surface-alt hover:text-text hover:border-border-strong transition-all"
        onClick={onEdit}
        title="Editar tarefa"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        className="h-7 w-7 flex items-center justify-center rounded-lg border border-border bg-white text-text-muted hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
        onClick={onDelete}
        title="Excluir tarefa"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
      <Badge variant={status === 'PENDENTE' || status === 'pendente' ? 'warning' : 'success'}>
        {status.toUpperCase()}
      </Badge>
    </div>
  </div>
)

// Helper to build DOU timeline events from publications
function buildDouTimelineEvents(publicacoes: DOUPublicacao[], casoId: string): TimelineEvent[] {
  return publicacoes.map((pub) => ({
    id: `dou-${pub.id}`,
    casoId,
    title: pub.titulo || 'Publicacao DOU',
    category: 'juridico' as TimelineCategory,
    channel: 'Diario Oficial',
    date: pub.data_publicacao
      ? new Date(pub.data_publicacao + 'T12:00:00').toISOString()
      : new Date().toISOString(),
    description: [
      pub.tipo_publicacao ? pub.tipo_publicacao.charAt(0).toUpperCase() + pub.tipo_publicacao.slice(1) : '',
      pub.orgao_publicador || '',
      pub.termo_encontrado ? `Termo: ${pub.termo_encontrado}` : '',
    ]
      .filter(Boolean)
      .join(' - '),
    tags: ['dou', pub.tipo_publicacao || 'publicacao'],
    author: 'Diario Oficial',
  }))
}

export const CasoPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { casos, loading: casosLoading, error: casosError } = useCasos()
  const { leads, loading: leadsLoading, error: leadsError } = useLeads()
  const { documentos, loading: docsLoading, error: docsError, fetchByCaso } = useDocumentos()
  const { eventos: agendaItems, loading: agendaLoading, error: agendaError } = useAgenda()
  const {
    notas,
    loading: notasLoading,
    error: notasError,
    fetchNotasByEntidade,
    createNota,
  } = useNotas()
  const {
    tarefas,
    loading: tarefasLoading,
    error: tarefasError,
    fetchTarefasByEntidade,
    createTarefa,
    updateTarefa,
    deleteTarefa,
  } = useTarefas()
  const {
    eventos: datajudEvents,
    loading: datajudLoading,
    error: datajudError,
    fetchByCaso: fetchDatajudByCaso,
  } = useDatajudTimeline()
  const { displayName, user, orgId } = useCurrentUser()
  const status = resolveStatus(params.get('state'))
  const [activeTab, setActiveTab] = React.useState<TabKey>('Tudo')
  const [modalOpen, setModalOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [filtersOpen, setFiltersOpen] = React.useState(false)
  const [dateRange, setDateRange] = React.useState<'all' | '7d' | '30d' | '90d'>('all')
  const [sortOrder, setSortOrder] = React.useState<'recent' | 'oldest'>('recent')
  const [taskDrawerOpen, setTaskDrawerOpen] = React.useState(false)
  const [taskDrawerMode, setTaskDrawerMode] = React.useState<'create' | 'edit'>('create')
  const [taskDrawerTask, setTaskDrawerTask] = React.useState<Tarefa | null>(null)
  const [taskDrawerForm, setTaskDrawerForm] = React.useState({
    title: '',
    description: '',
    status: 'pendente' as Tarefa['status'],
    priority: 'normal' as Tarefa['priority'],
    dueDate: '',
  })
  const [taskDrawerError, setTaskDrawerError] = React.useState<string | null>(null)
  const [taskDrawerSaving, setTaskDrawerSaving] = React.useState(false)
  const [eventForm, setEventForm] = React.useState<{
    title: string
    category: TimelineCategory
    description: string
  }>({
    title: '',
    category: 'juridico',
    description: '',
  })
  const [eventError, setEventError] = React.useState<string | null>(null)
  const [eventSaving, setEventSaving] = React.useState(false)
  const timelineRef = React.useRef<HTMLDivElement | null>(null)
  const [selectedCaso, setSelectedCaso] = React.useState<Caso>(FALLBACK_CASO)

  const caso = selectedCaso

  // DOU hook for timeline integration
  const {
    publicacoes: douPublicacoes,
    naoLidas: douNaoLidas,
  } = useDOU(caso?.id !== FALLBACK_CASO.id ? caso?.id : undefined)

  React.useEffect(() => {
    const resolvedCaso =
      casos.find((item) => item.id === id) ?? casos[0] ?? FALLBACK_CASO
    setSelectedCaso(resolvedCaso)
  }, [casos, id])
  const lead = leads.find((item) => item.id === caso?.leadId)
  const caseDocs = React.useMemo(
    () => documentos.filter((doc) => doc.casoId === caso?.id),
    [documentos, caso?.id]
  )
  const caseAgenda = React.useMemo(
    () => agendaItems.filter((event) => event.casoId === caso?.id),
    [agendaItems, caso?.id]
  )
  const caseNotas = React.useMemo(
    () => notas.filter((event) => event.casoId === caso?.id),
    [notas, caso?.id]
  )
  const recentNotas = React.useMemo(() => {
    return [...caseNotas]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3)
  }, [caseNotas])
  const caseTasks = React.useMemo(
    () => tarefas.filter((task) => task.casoId === caso?.id),
    [tarefas, caso?.id]
  )
  const checklistItems = React.useMemo(
    () =>
      caseTasks
        .filter((task) => {
          const hasPrefix = task.title.trim().startsWith(CHECKLIST_PREFIX)
          return hasPrefix
        })
        .map((task) => ({
          id: task.id,
          label: normalizeChecklistTitle(task.title),
          status: task.status === 'concluida' ? 'ok' : 'pendente',
          task,
        })),
    [caseTasks]
  )

  // DOU timeline events
  const douEvents = React.useMemo<TimelineEvent[]>(
    () => buildDouTimelineEvents(douPublicacoes, caso.id),
    [douPublicacoes, caso.id]
  )

  const docEvents = React.useMemo<TimelineEvent[]>(
    () =>
      caseDocs.map((doc) => ({
        id: `doc-${doc.id}`,
        casoId: doc.casoId || caso.id,
        title: doc.title,
        category: 'docs',
        channel: 'Documentos',
        date: doc.updatedAt || doc.createdAt,
        description: `${doc.type} - ${doc.status}`,
        tags: doc.tags || [],
        author: doc.requestedBy || 'Sistema',
      })),
    [caseDocs, caso.id]
  )
  const agendaEvents = React.useMemo<TimelineEvent[]>(
    () =>
      caseAgenda.map((event) => ({
        id: `agenda-${event.id}`,
        casoId: event.casoId || caso.id,
        title: event.title,
        category: 'agenda',
        channel: event.type || 'Agenda',
        date: new Date(`${event.date}T${event.time}:00`).toISOString(),
        description: `${event.time} - ${event.location || 'Sem local'}`,
        tags: [],
        author: event.owner || 'Sistema',
      })),
    [caseAgenda, caso.id]
  )

  // Combined events now include DOU publications
  const caseEvents = React.useMemo(() => {
    const combined = [...caseNotas, ...docEvents, ...agendaEvents, ...datajudEvents, ...douEvents]
    if (user?.id && displayName) {
      return combined.map((event) =>
        event.author === user.id ? { ...event, author: displayName } : event
      )
    }
    return combined
  }, [caseNotas, docEvents, agendaEvents, datajudEvents, douEvents, user?.id, displayName])

  const normalizedSearch = searchTerm.trim().toLowerCase()
  const timelineEvents = React.useMemo(() => {
    let events = caseEvents
    if (normalizedSearch) {
      events = events.filter((event) => {
        const haystack = [
          event.title,
          event.description,
          event.author,
          event.channel,
          event.category,
          ...(event.tags || []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return haystack.includes(normalizedSearch)
      })
    }
    if (dateRange !== 'all') {
      const days =
        dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 0
      if (days > 0) {
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
        events = events.filter((event) => {
          const eventTime = new Date(event.date).getTime()
          return Number.isNaN(eventTime) ? false : eventTime >= cutoff
        })
      }
    }
    const sorted = [...events].sort((a, b) => {
      const aTime = new Date(a.date).getTime()
      const bTime = new Date(b.date).getTime()
      if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0
      if (Number.isNaN(aTime)) return 1
      if (Number.isNaN(bTime)) return -1
      return sortOrder === 'recent' ? bTime - aTime : aTime - bTime
    })
    return sorted
  }, [caseEvents, normalizedSearch, dateRange, sortOrder])
  const filteredEvents = React.useMemo(() => {
    const category = categoryMap[activeTab]
    if (!category) return timelineEvents
    return timelineEvents.filter((event) => event.category === category)
  }, [timelineEvents, activeTab])

  React.useEffect(() => {
    const targetCaseId = id || caso.id
    if (!targetCaseId) return
    fetchNotasByEntidade('caso', targetCaseId).catch(() => null)
  }, [id, caso.id, fetchNotasByEntidade])

  React.useEffect(() => {
    const targetCaseId = id || caso.id
    if (!targetCaseId) return
    fetchByCaso(targetCaseId).catch(() => null)
  }, [id, caso.id, fetchByCaso])

  React.useEffect(() => {
    const targetCaseId = id || caso.id
    if (!targetCaseId) return
    fetchTarefasByEntidade('caso', targetCaseId).catch(() => null)
  }, [id, caso.id, fetchTarefasByEntidade])

  React.useEffect(() => {
    const targetCaseId = id || caso.id
    if (!targetCaseId) return
    fetchDatajudByCaso(targetCaseId).catch(() => null)
  }, [id, caso.id, fetchDatajudByCaso])

  const baseState =
    casosLoading ||
    leadsLoading ||
    docsLoading ||
    agendaLoading ||
    notasLoading ||
    tarefasLoading ||
    datajudLoading
      ? 'loading'
      : casosError ||
          leadsError ||
          docsError ||
          agendaError ||
          notasError ||
          tarefasError ||
          datajudError
        ? 'error'
        : casos.length
          ? 'ready'
          : 'empty'
  const pageState = status !== 'ready' ? status : baseState

  const highlights = [
    {
      id: 'high-1',
      label: 'Resumo gerado por IA',
      content:
        'Carlos Martins, ex-empregado da ACME Ltda, solicitou revisao de horas extras e verbas rescisorias.',
    },
    {
      id: 'high-2',
      label: 'Pontos relevantes',
      content:
        'Testemunha chave Joao Silva mencionada na ultima conversa; pagamento de horas extras em aberto.',
    },
  ]

  const resetFilters = () => {
    setDateRange('all')
    setSortOrder('recent')
  }

  const resetEventForm = () => {
    setEventForm({
      title: '',
      category: 'juridico',
      description: '',
    })
    setEventError(null)
  }

  const resetTaskDrawerForm = () => {
    setTaskDrawerTask(null)
    setTaskDrawerMode('create')
    setTaskDrawerForm({
      title: '',
      description: '',
      status: 'pendente',
      priority: 'normal',
      dueDate: '',
    })
    setTaskDrawerError(null)
  }

  const openChecklistDrawer = (task: Tarefa) => {
    setTaskDrawerTask(task)
    setTaskDrawerMode('edit')
    setTaskDrawerForm({
      title: normalizeChecklistTitle(task.title),
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: toDateInput(task.dueDate),
    })
    setTaskDrawerError(null)
    setTaskDrawerOpen(true)
  }

  const openChecklistDrawerForCreate = () => {
    setTaskDrawerTask(null)
    setTaskDrawerMode('create')
    setTaskDrawerForm({
      title: '',
      description: '',
      status: 'pendente',
      priority: 'normal',
      dueDate: '',
    })
    setTaskDrawerError(null)
    setTaskDrawerOpen(true)
  }

  const openModal = () => {
    resetEventForm()
    setModalOpen(true)
  }

  const closeModal = () => {
    if (eventSaving) return
    setModalOpen(false)
    resetEventForm()
  }

  const closeTaskDrawer = () => {
    if (taskDrawerSaving) return
    setTaskDrawerOpen(false)
    resetTaskDrawerForm()
  }

  React.useEffect(() => {
    if (!taskDrawerOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeTaskDrawer()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [taskDrawerOpen, closeTaskDrawer])

  const handleScrollToTimeline = () => {
    timelineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleSaveEvent = async () => {
    if (!caso?.id) {
      setEventError('Caso nao encontrado.')
      return
    }
    const title = eventForm.title.trim()
    if (!title) {
      setEventError('Informe um titulo para a nota.')
      return
    }
    setEventSaving(true)
    setEventError(null)
    try {
      const description = eventForm.description.trim()
      const texto = description ? `${title}\n\n${description}` : title
      await createNota({
        entidade: 'caso',
        entidadeId: caso.id,
        texto,
        createdBy: user?.id || null,
        tags: [eventForm.category],
      })
      setModalOpen(false)
      resetEventForm()
    } catch (error) {
      setEventError(error instanceof Error ? error.message : 'Erro ao salvar nota')
    } finally {
      setEventSaving(false)
    }
  }

  const handleSaveTaskDrawer = async () => {
    const title = buildChecklistTitle(taskDrawerForm.title)
    if (!title) {
      setTaskDrawerError('Informe o titulo da tarefa.')
      return
    }
    setTaskDrawerSaving(true)
    setTaskDrawerError(null)
    try {
      if (taskDrawerMode === 'create') {
        if (!caso?.id) {
          setTaskDrawerError('Caso nao encontrado.')
          return
        }
        await createTarefa({
          title,
          description: taskDrawerForm.description.trim() || null,
          priority: taskDrawerForm.priority,
          status: taskDrawerForm.status,
          dueDate: taskDrawerForm.dueDate || null,
          casoId: caso.id,
        })
      } else if (taskDrawerTask) {
        const completedAt =
          taskDrawerForm.status === 'concluida'
            ? taskDrawerTask.completedAt || new Date().toISOString()
            : null
        await updateTarefa(taskDrawerTask.id, {
          title,
          description: taskDrawerForm.description.trim() || null,
          priority: taskDrawerForm.priority,
          status: taskDrawerForm.status,
          dueDate: taskDrawerForm.dueDate || null,
          completedAt,
        })
      }
      setTaskDrawerOpen(false)
      resetTaskDrawerForm()
    } catch (error) {
      setTaskDrawerError(error instanceof Error ? error.message : 'Erro ao salvar tarefa')
    } finally {
      setTaskDrawerSaving(false)
    }
  }

  const handleDeleteChecklist = async (taskId: string) => {
    const confirmed = window.confirm('Excluir esta tarefa?')
    if (!confirmed) return
    try {
      await deleteTarefa(taskId)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Erro ao excluir tarefa')
    }
  }

  const clientInitials = caso.cliente
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  // Stats for the info bar
  const totalEvents = timelineEvents.length
  const datajudCount = datajudEvents.length
  const douCount = douPublicacoes.length

  return (
    <div
      className="min-h-screen bg-surface-alt pb-12"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="p-6">
        {/* Header Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="flex items-center gap-2 text-text-muted hover:text-text transition-colors"
              onClick={() => navigate('/app/casos')}
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Voltar</span>
            </button>
            <div className="h-6 w-px bg-surface-alt" />
            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-alt rounded-lg">
              <span className="text-xs text-text-muted font-mono">
                #{caso.id.slice(0, 20)}
              </span>
              <button
                type="button"
                className="text-text-subtle hover:text-text-muted"
                onClick={() => navigator.clipboard.writeText(caso.id)}
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Case Header */}
        <div className="bg-white rounded-xl border border-border p-6 mb-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-text mb-3">{caso.cliente}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={statusBadgeVariant(caso.status)}>
                  {caso.status.charAt(0).toUpperCase() + caso.status.slice(1)}
                </Badge>
                <Badge variant="primary">{caso.area}</Badge>
                <Badge variant="accent">{caso.stage}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium text-text hover:bg-surface-alt transition-colors"
              >
                <Pencil className="w-4 h-4" />
                Editar Caso
              </button>
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                style={{ backgroundColor: 'var(--brand-primary)' }}
                onClick={openModal}
              >
                <Plus className="w-5 h-5" />
                Nova Acao
              </button>
            </div>
          </div>

          {/* Inline DataJud/DOU status indicators */}
          {(caso.numero_processo || douCount > 0) && (
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
              {caso.numero_processo && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100">
                  <Scale className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-700">
                    Processo: {caso.numero_processo}
                  </span>
                  {caso.tribunal && (
                    <span className="text-xs text-blue-500">({caso.tribunal.toUpperCase()})</span>
                  )}
                </div>
              )}
              {douCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-100">
                  <Newspaper className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-medium text-amber-700">
                    {douCount} publicacao{douCount !== 1 ? 'es' : ''} DOU
                  </span>
                  {douNaoLidas > 0 && (
                    <span className="inline-flex items-center rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
                      {douNaoLidas} nova{douNaoLidas !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <PageState status={pageState}>
          {/* Main Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Column - Main Content */}
            <div className="xl:col-span-2 space-y-6">
              {/* Main Tabs */}
              <div className="bg-surface-alt/50 rounded-xl p-1.5 inline-flex gap-1 flex-wrap">
                {tabs.map((tab) => (
                  <TabButton
                    key={tab}
                    active={activeTab === tab}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </TabButton>
                ))}
              </div>

              {/* Search and Filter */}
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle">
                    <Search className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar eventos..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                    style={
                      {
                        '--tw-ring-color': 'rgba(114, 16, 17, 0.2)',
                      } as React.CSSProperties
                    }
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-text hover:bg-surface-alt transition-colors bg-white"
                  onClick={() => setFiltersOpen((prev) => !prev)}
                >
                  <Filter className="w-5 h-5" />
                  Filtros
                </button>
              </div>

              {/* Filters Panel */}
              {filtersOpen && (
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 text-xs text-text shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-text-muted">Periodo</span>
                    <select
                      className="h-9 rounded-lg border border-border bg-surface-alt px-3 text-xs text-text focus:border-red-800 focus:outline-none focus:ring-2 focus:ring-red-800/25"
                      value={dateRange}
                      onChange={(e) =>
                        setDateRange(e.target.value as 'all' | '7d' | '30d' | '90d')
                      }
                    >
                      <option value="all">Todos</option>
                      <option value="7d">Ultimos 7 dias</option>
                      <option value="30d">Ultimos 30 dias</option>
                      <option value="90d">Ultimos 90 dias</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-text-muted">Ordenacao</span>
                    <select
                      className="h-9 rounded-lg border border-border bg-surface-alt px-3 text-xs text-text focus:border-red-800 focus:outline-none focus:ring-2 focus:ring-red-800/25"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as 'recent' | 'oldest')}
                    >
                      <option value="recent">Mais recentes</option>
                      <option value="oldest">Mais antigos</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    className="ml-auto text-xs text-text-muted hover:text-text"
                    onClick={resetFilters}
                  >
                    Limpar filtros
                  </button>
                </div>
              )}

              {/* AI Summary Section */}
              {activeTab === 'Tudo' && (
                <>
                  <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b border-border flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(114, 16, 17, 0.1)', color: 'var(--brand-primary)' }}
                      >
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-text">Dossie Juridico</h3>
                        <p className="text-xs text-text-muted">Resumo gerado e pontos relevantes</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
                      {/* AI Summary */}
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-5 border border-border">
                        <div className="flex items-center gap-2 mb-3">
                          <div
                            className="w-6 h-6 rounded-md flex items-center justify-center"
                            style={{ backgroundColor: 'rgba(114, 16, 17, 0.1)', color: 'var(--brand-primary)' }}
                          >
                            <Lightbulb className="w-4 h-4" />
                          </div>
                          <h4 className="text-sm font-semibold text-text">
                            Resumo gerado por IA
                          </h4>
                        </div>
                        <p className="text-sm text-text-muted leading-relaxed">
                          {highlights[0]?.content}
                        </p>
                      </div>

                      {/* Key Points */}
                      <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/30 rounded-xl p-5 border border-amber-100/50">
                        <div className="flex items-center gap-2 mb-3">
                          <div
                            className="w-6 h-6 rounded-md flex items-center justify-center"
                            style={{ backgroundColor: 'rgba(191, 111, 50, 0.15)', color: '#BF6F32' }}
                          >
                            <KeyRound className="w-4 h-4" />
                          </div>
                          <h4 className="text-sm font-semibold text-text">Pontos relevantes</h4>
                        </div>
                        <p className="text-sm text-text-muted leading-relaxed">
                          {highlights[1]?.content}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="w-full py-3 text-sm font-medium text-text-muted hover:text-text hover:bg-surface-alt transition-colors flex items-center justify-center gap-1 border-t border-border"
                      onClick={handleScrollToTimeline}
                    >
                      Ver linha do tempo completa
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Fontes de Dados - Integrated compact cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* DataJud Card */}
                    <CasoDataJudSection
                      caso={caso}
                      clienteName={caso.cliente}
                      orgId={orgId}
                      onProcessoLinked={(updatedCaso) => {
                        setSelectedCaso(updatedCaso)
                      }}
                      onTimelineRefresh={() => {
                        const targetCaseId = id || caso.id
                        if (targetCaseId) fetchDatajudByCaso(targetCaseId).catch(() => null)
                      }}
                    />

                    {/* DOU Card */}
                    <CasoDouSection
                      caso={caso}
                      orgId={orgId}
                    />
                  </div>

                  {/* Timeline Section */}
                  <div
                    ref={timelineRef}
                    className="bg-white rounded-xl border border-border overflow-hidden shadow-sm"
                  >
                    <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: 'rgba(107, 94, 88, 0.1)', color: '#6B5E58' }}
                        >
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-text">Linha do Tempo</h3>
                          <p className="text-xs text-text-muted">
                            {totalEvents} evento{totalEvents !== 1 ? 's' : ''}
                            {datajudCount > 0 && (
                              <span style={{ color: 'var(--brand-primary)' }}> · {datajudCount} DataJud</span>
                            )}
                            {douCount > 0 && (
                              <span className="text-amber-600"> · {douCount} DOU</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-surface-alt"
                        style={{ color: 'var(--brand-primary)' }}
                        onClick={openModal}
                      >
                        <Plus className="w-5 h-5" />
                        Adicionar nota
                      </button>
                    </div>

                    <div className="px-5 py-4 border-b border-border">
                      <div className="flex items-center gap-2 flex-wrap">
                        {['Tudo', 'Docs', 'Agenda', 'Comercial', 'Juridico', 'Automacao', 'Humano'].map(
                          (tab) => (
                            <FilterChip
                              key={tab}
                              active={
                                activeTab === 'Tudo'
                                  ? tab === 'Tudo'
                                  : tab.toLowerCase() === categoryMap[activeTab]
                              }
                              onClick={() => {
                                if (tab === 'Tudo') {
                                  setActiveTab('Tudo')
                                } else {
                                  const mapped = tabs.find(
                                    (t) => categoryMap[t]?.toLowerCase() === tab.toLowerCase()
                                  )
                                  if (mapped) setActiveTab(mapped)
                                }
                              }}
                            >
                              {tab}
                            </FilterChip>
                          )
                        )}
                      </div>
                    </div>

                    {timelineEvents.length > 0 ? (
                      <div className="p-5">
                        <Timeline events={timelineEvents} onAddEvent={openModal} />
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <div className="w-12 h-12 rounded-full bg-surface-alt flex items-center justify-center mx-auto mb-3">
                          <FileText className="w-5 h-5 text-text-subtle" />
                        </div>
                        <p className="text-sm text-text-muted">
                          Nenhum evento encontrado para este filtro.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Tarefas Tab */}
              {activeTab === 'Tarefas' && (
                <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-text">Tarefas do caso</h3>
                      <p className="text-xs text-text-muted">
                        Atividades vinculadas a este dossie.
                      </p>
                    </div>
                    <Link
                      to={`/app/tarefas?casoId=${caso.id}`}
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-white px-4 text-xs font-semibold text-text shadow-sm hover:bg-surface-alt"
                    >
                      Abrir tarefas
                    </Link>
                  </div>
                  <div className="p-5 space-y-3">
                    {caseTasks.length ? (
                      caseTasks.map((task) => (
                        <div
                          key={task.id}
                          className="rounded-xl border border-border bg-surface-alt/50 p-4"
                        >
                          <div className="flex items-center justify-between gap-3 text-xs text-text-muted">
                            <span
                              className={cn(
                                'inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase',
                                taskStatusPill(task.status)
                              )}
                            >
                              {task.status.replace('_', ' ')}
                            </span>
                            {task.dueDate && <span>Vence em {formatDate(task.dueDate)}</span>}
                          </div>
                          <p className="mt-2 text-sm font-semibold text-text">
                            {normalizeChecklistTitle(task.title)}
                          </p>
                          {task.description && (
                            <p className="mt-1 text-xs text-text-muted">{task.description}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border border-border bg-surface-alt/50 p-4 text-sm text-text-muted">
                        Nenhuma tarefa vinculada a este caso.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Other tabs */}
              {activeTab !== 'Tudo' && activeTab !== 'Tarefas' && (
                <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                    <h3 className="font-semibold text-text">{activeTab}</h3>
                    <button
                      type="button"
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-white px-4 text-xs font-semibold text-text shadow-sm hover:bg-surface-alt"
                      onClick={openModal}
                    >
                      Adicionar nota
                    </button>
                  </div>
                  <div className="p-5 space-y-3">
                    {filteredEvents.length ? (
                      filteredEvents.map((event) => (
                        <div
                          key={event.id}
                          className="rounded-xl border border-border bg-surface-alt/50 p-4"
                        >
                          <p className="text-sm font-semibold text-text">{event.title}</p>
                          <p className="text-xs text-text-muted">{event.description}</p>
                          <p className="mt-2 text-[11px] text-text-subtle">
                            {formatDateTime(event.date)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border border-border bg-surface-alt/50 p-4 text-sm text-text-muted">
                        Sem eventos para esta categoria.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Client Info & Tasks */}
            <div className="space-y-6">
              {/* Client Card */}
              <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
                <div className="p-5 border-b border-border">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white"
                      style={{ backgroundColor: 'var(--brand-primary)' }}
                    >
                      {clientInitials}
                    </div>
                    <div>
                      <h3 className="font-semibold text-text">{caso.cliente}</h3>
                      <p className="text-sm text-text-muted">{lead?.email ?? 'cliente@email.com'}</p>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-3 text-sm text-text-muted">
                    <Phone className="w-5 h-5" />
                    <span>{lead?.phone ?? '+55 31 99999-0000'}</span>
                  </div>
                </div>
              </div>

              {/* Tasks Card */}
              <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold text-text">Tarefas</h3>
                  <button
                    type="button"
                    className="text-sm font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-surface-alt transition-colors"
                    onClick={openChecklistDrawerForCreate}
                  >
                    Adicionar tarefa
                  </button>
                </div>

                <div className="px-5 py-2">
                  {checklistItems.length === 0 ? (
                    <div className="py-4 text-center text-sm text-text-muted">
                      Nenhuma tarefa cadastrada para este caso.
                    </div>
                  ) : (
                    checklistItems.map((item) => (
                      <TaskItem
                        key={item.id}
                        title={item.label}
                        status={item.status === 'ok' ? 'OK' : 'PENDENTE'}
                        onEdit={() => openChecklistDrawer(item.task)}
                        onDelete={() => handleDeleteChecklist(item.id)}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Notes Card */}
              <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold text-text">Notas do caso</h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="text-sm font-medium hover:underline"
                      style={{ color: 'var(--brand-primary)' }}
                      onClick={handleScrollToTimeline}
                    >
                      Ver linha do tempo
                    </button>
                    <button
                      type="button"
                      className="text-sm font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-surface-alt transition-colors"
                      onClick={openModal}
                    >
                      Adicionar nota
                    </button>
                  </div>
                </div>

                <div className="p-5">
                  {recentNotas.length ? (
                    <div className="space-y-3">
                      {recentNotas.map((nota) => (
                        <div
                          key={nota.id}
                          className="rounded-xl border border-border bg-surface-alt/50 p-3"
                        >
                          <div className="text-sm font-semibold text-text">{nota.title}</div>
                          {nota.description && (
                            <div className="mt-1 text-xs text-text-muted">{nota.description}</div>
                          )}
                          <div className="mt-2 text-[11px] text-text-subtle">
                            {formatDateTime(nota.date)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-sm text-text-muted">
                      Nenhuma nota registrada para este caso.
                    </p>
                  )}
                </div>
              </div>

              {/* Recent Documents Card */}
              <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold text-text">Documentos recentes</h3>
                  <Link
                    to="/app/documentos"
                    className="text-sm font-medium hover:underline"
                    style={{ color: 'var(--brand-primary)' }}
                  >
                    Ver documentos
                  </Link>
                </div>

                <div className="p-5">
                  {caseDocs.length > 0 ? (
                    <div className="space-y-3">
                      {caseDocs.slice(0, 3).map((doc) => (
                        <div
                          key={doc.id}
                          className="rounded-xl border border-border bg-surface-alt/50 p-3"
                        >
                          <div className="text-sm font-semibold text-text">{doc.title}</div>
                          <div className="text-xs text-text-muted">{doc.status}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-surface-alt flex items-center justify-center mx-auto mb-3">
                        <Folder className="w-5 h-5 text-text-subtle" />
                      </div>
                      <p className="text-sm text-text-muted">Nenhum documento anexado.</p>
                      <button
                        type="button"
                        className="mt-3 text-sm font-medium flex items-center gap-1 mx-auto hover:gap-2 transition-all"
                        style={{ color: 'var(--brand-primary)' }}
                      >
                        <Plus className="w-5 h-5" />
                        Adicionar documento
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </PageState>
      </div>

      {/* Modal for adding notes */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title="Adicionar nota"
        description="Registre uma nova nota do caso."
        footer={
          <>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-text hover:bg-surface-alt rounded-lg transition-colors"
              onClick={closeModal}
              disabled={eventSaving}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-70"
              style={{ backgroundColor: 'var(--brand-primary)' }}
              onClick={handleSaveEvent}
              disabled={eventSaving}
            >
              {eventSaving ? 'Salvando...' : 'Salvar nota'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {eventError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {eventError}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-text-muted">Titulo</label>
            <input
              type="text"
              placeholder="Descreva a nota"
              className="w-full h-10 px-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': 'rgba(114, 16, 17, 0.2)' } as React.CSSProperties}
              value={eventForm.title}
              onChange={(e) => setEventForm((prev) => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-text-muted">Categoria</label>
            <select
              className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm text-text focus:border-red-800 focus:outline-none focus:ring-2 focus:ring-red-800/25"
              value={eventForm.category}
              onChange={(e) =>
                setEventForm((prev) => ({
                  ...prev,
                  category: e.target.value as TimelineCategory,
                }))
              }
            >
              {eventCategoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-text-muted">Descricao</label>
            <textarea
              className="min-h-[120px] w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-text focus:border-red-800 focus:outline-none focus:ring-2 focus:ring-red-800/25"
              placeholder="Detalhes da nota"
              value={eventForm.description}
              onChange={(e) =>
                setEventForm((prev) => ({ ...prev, description: e.target.value }))
              }
            />
          </div>
        </div>
      </Modal>

      {/* Task Drawer */}
      {taskDrawerOpen &&
        createPortal(
          <div className="fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/30"
              style={{ backdropFilter: 'blur(4px)' }}
              onClick={closeTaskDrawer}
            />
            <aside className="absolute right-0 top-0 flex h-full w-full max-w-[480px] flex-col bg-white shadow-xl">
              <div className="border-b border-border px-6 py-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-[0.32em] text-text-subtle">
                      Tarefa
                    </p>
                    <h3 className="text-2xl font-bold text-text">
                      {taskDrawerMode === 'create' ? 'Nova tarefa' : taskDrawerForm.title || 'Tarefa'}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex rounded-full border border-border bg-surface-alt px-3 py-1 text-xs font-semibold text-text-muted">
                        Tarefa do caso
                      </span>
                      <span
                        className={cn(
                          'inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase',
                          taskStatusPill(taskDrawerForm.status)
                        )}
                      >
                        {taskDrawerForm.status.replace('_', ' ')}
                      </span>
                      <span
                        className={cn(
                          'inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase',
                          taskPriorityPill(taskDrawerForm.priority)
                        )}
                      >
                        {taskDrawerForm.priority}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-sm text-text-subtle hover:text-text"
                    onClick={closeTaskDrawer}
                    aria-label="Fechar"
                  >
                    Fechar
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5 text-sm text-text-muted">
                {taskDrawerError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                    {taskDrawerError}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wide text-text-muted">Titulo</label>
                  <input
                    type="text"
                    placeholder="Descreva a tarefa"
                    className="w-full h-10 px-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': 'rgba(114, 16, 17, 0.2)' } as React.CSSProperties}
                    value={taskDrawerForm.title}
                    onChange={(e) =>
                      setTaskDrawerForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wide text-text-muted">Status</label>
                    <select
                      className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm text-text focus:border-red-800 focus:outline-none focus:ring-2 focus:ring-red-800/25"
                      value={taskDrawerForm.status}
                      onChange={(e) =>
                        setTaskDrawerForm((prev) => ({
                          ...prev,
                          status: e.target.value as Tarefa['status'],
                        }))
                      }
                    >
                      <option value="pendente">Pendente</option>
                      <option value="em_andamento">Em andamento</option>
                      <option value="concluida">Concluida</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wide text-text-muted">
                      Prioridade
                    </label>
                    <select
                      className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm text-text focus:border-red-800 focus:outline-none focus:ring-2 focus:ring-red-800/25"
                      value={taskDrawerForm.priority}
                      onChange={(e) =>
                        setTaskDrawerForm((prev) => ({
                          ...prev,
                          priority: e.target.value as Tarefa['priority'],
                        }))
                      }
                    >
                      <option value="baixa">Baixa</option>
                      <option value="normal">Normal</option>
                      <option value="alta">Alta</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wide text-text-muted">Prazo</label>
                  <input
                    type="date"
                    className="w-full h-10 px-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': 'rgba(114, 16, 17, 0.2)' } as React.CSSProperties}
                    value={taskDrawerForm.dueDate}
                    onChange={(e) =>
                      setTaskDrawerForm((prev) => ({ ...prev, dueDate: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wide text-text-muted">
                    Descricao
                  </label>
                  <textarea
                    className="min-h-[120px] w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-text focus:border-red-800 focus:outline-none focus:ring-2 focus:ring-red-800/25"
                    placeholder="Detalhes da tarefa"
                    value={taskDrawerForm.description}
                    onChange={(e) =>
                      setTaskDrawerForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="rounded-xl border border-border bg-surface-alt px-4 py-3 text-xs text-text-muted">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-text-subtle">Vinculo</p>
                  <p className="mt-2 text-sm text-text">
                    Caso: {caso.title} - {caso.cliente}
                  </p>
                  {taskDrawerTask ? (
                    <p className="mt-1 text-[11px] text-text-subtle">
                      Criada em {formatDateTime(taskDrawerTask.createdAt)}
                    </p>
                  ) : (
                    <p className="mt-1 text-[11px] text-text-subtle">
                      O item sera criado para este caso.
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t border-border bg-white px-6 py-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-text hover:bg-surface-alt rounded-lg transition-colors"
                    onClick={closeTaskDrawer}
                    disabled={taskDrawerSaving}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-70"
                    style={{ backgroundColor: 'var(--brand-primary)' }}
                    onClick={handleSaveTaskDrawer}
                    disabled={taskDrawerSaving}
                  >
                    {taskDrawerSaving ? 'Salvando...' : 'Salvar tarefa'}
                  </button>
                </div>
              </div>
            </aside>
          </div>,
          document.body
        )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

        input:focus, select:focus, textarea:focus {
          --tw-ring-color: rgba(114, 16, 17, 0.2);
          box-shadow: 0 0 0 2px var(--tw-ring-color);
          border-color: #721011;
        }

        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: #E0E0E0;
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #BDBDBD;
        }
      `}</style>
    </div>
  )
}
