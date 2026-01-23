import * as React from 'react'
import {
  ChevronDown,
  ChevronLeft,
  Filter,
  FileText,
  KeyRound,
  Search,
  ShieldCheck,
} from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import heroLight from '@/assets/hero-light.svg'
import { PageState } from '@/components/PageState'
import { Timeline } from '@/components/Timeline'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import type { Caso, TimelineCategory, TimelineEvent } from '@/types/domain'
import { cn } from '@/utils/cn'
import { formatDate, formatDateTime } from '@/utils/format'
import { useCasos } from '@/hooks/useCasos'
import { useLeads } from '@/hooks/useLeads'
import { useDocumentos } from '@/hooks/useDocumentos'
import { useNotas } from '@/hooks/useNotas'
import { useAgenda } from '@/hooks/useAgenda'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useTarefas } from '@/hooks/useTarefas'

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

const statusBadge = (status: Caso['status']) => {
  if (status === 'encerrado') return 'danger'
  if (status === 'suspenso') return 'warning'
  return 'success'
}

export const CasoPage = () => {
  const { id } = useParams()
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
  } = useTarefas()
  const { displayName, user } = useCurrentUser()
  const status = resolveStatus(params.get('state'))
  const [activeTab, setActiveTab] = React.useState<TabKey>('Tudo')
  const [modalOpen, setModalOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [filtersOpen, setFiltersOpen] = React.useState(false)
  const [dateRange, setDateRange] = React.useState<'all' | '7d' | '30d' | '90d'>('all')
  const [sortOrder, setSortOrder] = React.useState<'recent' | 'oldest'>('recent')
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

  const fallbackCaso: Caso = {
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

  const caso = casos.find((item) => item.id === id) ?? casos[0] ?? fallbackCaso
  const lead = leads.find((item) => item.id === caso?.leadId)
  const caseDocs = React.useMemo(
    () => documentos.filter((doc) => doc.casoId === caso?.id),
    [documentos, caso?.id],
  )
  const caseAgenda = React.useMemo(
    () => agendaItems.filter((event) => event.casoId === caso?.id),
    [agendaItems, caso?.id],
  )
  const caseNotas = React.useMemo(
    () => notas.filter((event) => event.casoId === caso?.id),
    [notas, caso?.id],
  )
  const caseTasks = React.useMemo(
    () => tarefas.filter((task) => task.casoId === caso?.id),
    [tarefas, caso?.id],
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
    [caseDocs, caso.id],
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
    [caseAgenda, caso.id],
  )
  const caseEvents = React.useMemo(() => {
    const combined = [...caseNotas, ...docEvents, ...agendaEvents]
    if (user?.id && displayName) {
      return combined.map((event) =>
        event.author === user.id ? { ...event, author: displayName } : event,
      )
    }
    return combined
  }, [caseNotas, docEvents, agendaEvents, user?.id, displayName])
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

  const baseState =
    casosLoading || leadsLoading || docsLoading || agendaLoading || notasLoading || tarefasLoading
      ? 'loading'
      : casosError || leadsError || docsError || agendaError || notasError || tarefasError
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

  const checklistItems = React.useMemo(
    () =>
      caseTasks.map((task) => ({
        id: task.id,
        label: task.title,
        status: task.status === 'concluida' ? 'ok' : 'pendente',
      })),
    [caseTasks],
  )

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

  const openModal = () => {
    resetEventForm()
    setModalOpen(true)
  }

  const closeModal = () => {
    if (eventSaving) return
    setModalOpen(false)
    resetEventForm()
  }

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
      setEventError('Informe um titulo para o evento.')
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
      setEventError(error instanceof Error ? error.message : 'Erro ao salvar evento')
    } finally {
      setEventSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-base pb-12 text-text">
      <div className="space-y-6">
        <header className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-brand-primary-subtle via-surface to-surface-alt p-6 shadow-card">
          <div
            className="absolute inset-0 bg-no-repeat bg-right bg-[length:520px] opacity-80"
            style={{ backgroundImage: `url(${heroLight})` }}
          />
          <div className="relative z-10 space-y-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1 text-xs text-text-muted shadow-soft"
            >
              <ChevronLeft className="h-4 w-4" />
              #{caso.id.replace('caso-', '')}
            </button>
            <h2 className="font-display text-2xl text-text">
              {caso.id.replace('caso-', '#')} - {caso.cliente}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
              <Badge variant={statusBadge(caso.status)} className="capitalize">
                {caso.status}
              </Badge>
              <Badge variant="info">{caso.area}</Badge>
              <Badge variant="default">{caso.stage}</Badge>
            </div>
          </div>
        </header>

      <PageState status={pageState}>
        <div className="grid gap-6 xl:grid-cols-[2.4fr_1fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'rounded-full border px-4 py-1.5 text-xs font-medium transition',
                    activeTab === tab
                      ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-600'
                      : 'border-border bg-white text-text-muted hover:bg-surface-2 hover:text-text',
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
                <Input
                  placeholder="Buscar eventos..."
                  className="h-11 rounded-full border border-border bg-surface-2 pl-11 text-text placeholder:text-text-subtle focus:border-emerald-400 focus:ring-emerald-200"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-11 rounded-full px-4"
                onClick={() => setFiltersOpen((prev) => !prev)}
              >
                <Filter className="h-4 w-4" />
                Filtros
              </Button>
            </div>
            {filtersOpen && (
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 text-xs text-text shadow-soft">
                <div className="flex items-center gap-2">
                  <span className="text-text-subtle">Periodo</span>
                  <select
                    className="h-9 rounded-full border border-border bg-surface px-3 text-xs text-text shadow-soft focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    value={dateRange}
                    onChange={(event) =>
                      setDateRange(event.target.value as 'all' | '7d' | '30d' | '90d')
                    }
                  >
                    <option value="all">Todos</option>
                    <option value="7d">Ultimos 7 dias</option>
                    <option value="30d">Ultimos 30 dias</option>
                    <option value="90d">Ultimos 90 dias</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-text-subtle">Ordenacao</span>
                  <select
                    className="h-9 rounded-full border border-border bg-surface px-3 text-xs text-text shadow-soft focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    value={sortOrder}
                    onChange={(event) =>
                      setSortOrder(event.target.value as 'recent' | 'oldest')
                    }
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

            {activeTab === 'Tudo' && (
              <div className="space-y-4">
                <Card className="border-border bg-white/90 shadow-soft">
                  <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-border/60 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle>Dossie Juridico</CardTitle>
                        <p className="text-xs text-text-subtle">
                          Resumo gerado e pontos relevantes.
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4 text-sm text-text">
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="flex h-full flex-col rounded-2xl border border-border bg-surface p-4 shadow-soft">
                        <div className="flex items-center gap-2 text-sm font-semibold text-text">
                          <FileText className="h-4 w-4 text-[#D36D8C]" />
                          Resumo gerado por IA
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-text">
                          {highlights[0]?.content}
                        </p>
                      </div>
                      <div className="flex h-full flex-col rounded-2xl border border-border bg-surface p-4 shadow-soft">
                        <div className="flex items-center gap-2 text-sm font-semibold text-text">
                          <KeyRound className="h-4 w-4 text-[#6BB9A8]" />
                          Pontos relevantes
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-text">
                          {highlights[1]?.content}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-center gap-2 rounded-full border-border bg-white text-text hover:bg-surface-2"
                      onClick={handleScrollToTimeline}
                    >
                      Ver linha do tempo completa
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>

                <div ref={timelineRef}>
                  <Timeline events={timelineEvents} onAddEvent={openModal} />
                </div>
              </div>
            )}

            {activeTab === 'Tarefas' && (
              <Card className="border-border bg-white/85">
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Tarefas do caso</CardTitle>
                    <p className="text-xs text-text-subtle">
                      Atividades vinculadas a este dossie.
                    </p>
                  </div>
                  <Link
                    to={`/app/tarefas?casoId=${caso.id}`}
                    className="inline-flex h-9 items-center justify-center rounded-full border border-border bg-white px-4 text-xs font-semibold text-text shadow-soft hover:bg-surface-2"
                  >
                    Abrir tarefas
                  </Link>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-text-muted">
                  {caseTasks.length ? (
                    caseTasks.map((task) => (
                      <div
                        key={task.id}
                        className="rounded-2xl border border-border bg-white p-3 shadow-[0_8px_20px_rgba(18,38,63,0.06)]"
                      >
                        <div className="flex items-center justify-between gap-3 text-xs text-text-subtle">
                          <span className="inline-flex rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-text-muted">
                            {task.status.replace('_', ' ')}
                          </span>
                          {task.dueDate && <span>Vence em {formatDate(task.dueDate)}</span>}
                        </div>
                        <p className="mt-2 text-sm font-semibold text-text">{task.title}</p>
                        {task.description && (
                          <p className="mt-1 text-xs text-text-subtle">{task.description}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-border bg-white p-4 text-sm text-text-muted shadow-[0_8px_20px_rgba(18,38,63,0.06)]">
                      Nenhuma tarefa vinculada a este caso.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab !== 'Tudo' && activeTab !== 'Tarefas' && (
              <Card className="border-border bg-white/85">
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <CardTitle>{activeTab}</CardTitle>
                  <Button variant="outline" size="sm" onClick={openModal}>
                    Adicionar evento
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-text-muted">
                  {filteredEvents.length ? (
                    filteredEvents.map((event) => (
                      <div
                        key={event.id}
                        className="rounded-2xl border border-border bg-white p-3 shadow-[0_8px_20px_rgba(18,38,63,0.06)]"
                      >
                        <p className="text-sm font-semibold text-text">{event.title}</p>
                        <p className="text-xs text-text-subtle">{event.description}</p>
                        <p className="mt-2 text-[11px] text-text-subtle">
                          {formatDateTime(event.date)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-border bg-white p-4 text-sm text-text-muted shadow-[0_8px_20px_rgba(18,38,63,0.06)]">
                      Sem eventos para esta categoria.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <aside className="space-y-4">
            <Card className="border-border bg-white/85">
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {caso.cliente
                      .split(' ')
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text">{caso.cliente}</p>
                    <p className="text-xs text-text-subtle">
                      {lead?.email ?? 'cliente@email.com'}
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-white px-3 py-2 text-xs text-text shadow-[0_8px_20px_rgba(18,38,63,0.06)]">
                  {lead?.phone ?? '(11) 99999-0000'}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-white/85">
              <CardHeader>
                <CardTitle>Checklist Processual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-text-muted">
                {checklistItems.length === 0 && (
                  <div className="rounded-2xl border border-border bg-white px-3 py-3 text-xs text-text-subtle shadow-soft">
                    Nenhum item de checklist para este caso.
                  </div>
                )}
                {checklistItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-2xl border border-border bg-white px-3 py-2 shadow-[0_8px_20px_rgba(18,38,63,0.06)]"
                  >
                    <span>{item.label}</span>
                    <span
                      className={cn(
                        'rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase',
                        item.status === 'ok'
                          ? 'border-[#CFEBD8] bg-[#E8F7EE] text-[#167A3D]'
                          : 'border-[#F1D28A] bg-[#FFF1CC] text-[#8A5A00]',
                      )}
                    >
                      {item.status === 'ok' ? 'ok' : 'pendente'}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border bg-white/85">
              <CardHeader>
                <CardTitle>Documentos recentes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-text-muted">
                {caseDocs.slice(0, 3).map((doc) => (
                  <div
                    key={doc.id}
                    className="rounded-2xl border border-border bg-white px-3 py-2 shadow-[0_8px_20px_rgba(18,38,63,0.06)]"
                  >
                    <div className="text-sm font-semibold text-text">{doc.title}</div>
                    <div className="text-xs text-text-subtle">{doc.status}</div>
                  </div>
                ))}
                <Link to="/app/documentos" className="text-xs text-primary hover:underline">
                  Ver documentos
                </Link>
              </CardContent>
            </Card>
          </aside>
        </div>
      </PageState>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title="Adicionar evento"
        description="Registre um novo evento juridico."
        footer={
          <>
            <Button variant="ghost" onClick={closeModal} disabled={eventSaving}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSaveEvent} disabled={eventSaving}>
              {eventSaving ? 'Salvando...' : 'Salvar evento'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {eventError && (
            <div className="rounded-2xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
              {eventError}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-text-subtle">
              Titulo
            </label>
            <Input
              placeholder="Descreva o evento"
              value={eventForm.title}
              onChange={(event) =>
                setEventForm((prev) => ({ ...prev, title: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-text-subtle">
              Categoria
            </label>
            <select
              className="h-10 w-full rounded-2xl border border-border bg-white px-3 text-sm text-text"
              value={eventForm.category}
              onChange={(event) =>
                setEventForm((prev) => ({
                  ...prev,
                  category: event.target.value as TimelineCategory,
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
            <label className="text-xs uppercase tracking-wide text-text-subtle">
              Descricao
            </label>
            <textarea
              className="min-h-[120px] w-full rounded-2xl border border-border bg-white px-3 py-2 text-sm text-text"
              placeholder="Detalhes do evento"
              value={eventForm.description}
              onChange={(event) =>
                setEventForm((prev) => ({ ...prev, description: event.target.value }))
              }
            />
          </div>
        </div>
      </Modal>
      </div>
    </div>
  )
}
