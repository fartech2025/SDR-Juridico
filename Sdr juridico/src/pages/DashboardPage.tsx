import * as React from 'react'
import { CalendarDays, ChevronRight, Flag, Sparkles } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import heroLight from '@/assets/hero-light.svg'
import { ActionCard } from '@/components/ActionCard'
import { NotificationCenter } from '@/components/NotificationCenter'
import { PageState } from '@/components/PageState'
import { StatCard } from '@/components/StatCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime } from '@/utils/format'
import { cn } from '@/utils/cn'
import { useAgenda } from '@/hooks/useAgenda'
import { useCasos } from '@/hooks/useCasos'
import { useDocumentos } from '@/hooks/useDocumentos'
import { useLeads } from '@/hooks/useLeads'
import { useNotas } from '@/hooks/useNotas'
import type { KPI, Notification } from '@/types/domain'

const resolveStatus = (
  value: string | null,
): 'loading' | 'empty' | 'error' | 'ready' => {
  if (value === 'loading' || value === 'empty' || value === 'error') {
    return value
  }
  return 'ready'
}

const slaBadgeClass = (value: string) => {
  if (value === 'critico') return 'border-danger-bg bg-danger-bg text-danger'
  if (value === 'atencao') return 'border-warning-bg bg-warning-bg text-warning'
  return 'border-success-bg bg-success-bg text-success'
}

const stageBadgeClass = (value: string) => {
  if (value === 'em_andamento') {
    return 'border-info-bg bg-info-bg text-info'
  }
  if (value === 'negociacao') {
    return 'border-brand-primary-subtle bg-brand-primary-subtle text-brand-primary'
  }
  return 'border-gray-200 bg-gray-100 text-gray-600'
}

const categoryBadgeClass = (value: string) => {
  const label = value.toLowerCase()
  if (label === 'juridico') {
    return 'border-brand-secondary-subtle bg-brand-secondary-subtle text-brand-secondary'
  }
  if (label === 'comercial') {
    return 'border-brand-primary-subtle bg-brand-primary-subtle text-brand-primary'
  }
  if (label === 'agenda') {
    return 'border-success-bg bg-success-bg text-success'
  }
  return 'border-gray-200 bg-gray-100 text-gray-600'
}

const toIsoDate = (value: Date) => {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const countInRange = <T,>(
  items: T[],
  getDate: (item: T) => string | null | undefined,
  start: Date,
  end: Date
) =>
  items.filter((item) => {
    const value = getDate(item)
    if (!value) return false
    const date = new Date(value)
    return date >= start && date < end
  }).length

const buildKpi = (
  id: string,
  label: string,
  value: number,
  delta: number,
  period: string
): KPI => ({
  id,
  label,
  value,
  delta,
  trend: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat',
  period,
})

const buildNotifications = (
  leadsCount: number,
  pendingDocs: number,
  criticalCases: number,
  nextAgendaCount: number
): Notification[] => [
  {
    id: 'nt-001',
    title: 'Documentos pendentes',
    description: `${pendingDocs} documentos aguardando validacao.`,
    priority: pendingDocs > 3 ? 'P0' : 'P1',
    date: new Date().toISOString(),
    actionLabel: 'Abrir documentos',
    actionHref: '/app/documentos',
    read: false,
  },
  {
    id: 'nt-002',
    title: 'Casos em risco',
    description: `${criticalCases} casos com prioridade alta.`,
    priority: criticalCases > 0 ? 'P0' : 'P2',
    date: new Date().toISOString(),
    actionLabel: 'Ver casos',
    actionHref: '/app/casos',
    read: false,
  },
  {
    id: 'nt-003',
    title: 'Leads ativos',
    description: `${leadsCount} leads em acompanhamento.`,
    priority: 'P2',
    date: new Date().toISOString(),
    actionLabel: 'Abrir leads',
    actionHref: '/app/leads',
    read: false,
  },
  {
    id: 'nt-004',
    title: 'Agenda do dia',
    description: `${nextAgendaCount} compromissos para hoje.`,
    priority: nextAgendaCount > 5 ? 'P1' : 'P2',
    date: new Date().toISOString(),
    actionLabel: 'Ver agenda',
    actionHref: '/app/agenda',
    read: true,
  },
]

export const DashboardPage = () => {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  // Light-only app - no dark mode
  const status = resolveStatus(params.get('state'))
  const { leads, loading: leadsLoading, error: leadsError, fetchLeads } = useLeads()
  const { casos, loading: casosLoading, error: casosError, fetchCasos } = useCasos()
  const { documentos, loading: docsLoading, error: docsError, fetchDocumentos } = useDocumentos()
  const {
    eventos: agendaItems,
    loading: agendaLoading,
    error: agendaError,
    fetchEventos,
  } = useAgenda()
  const { notas, loading: notasLoading, error: notasError, fetchNotas } = useNotas()
  const [loadTimeoutReached, setLoadTimeoutReached] = React.useState(false)

  const anyLoading =
    leadsLoading || casosLoading || docsLoading || agendaLoading || notasLoading
  const anyError = leadsError || casosError || docsError || agendaError || notasError

  React.useEffect(() => {
    if (!anyLoading) {
      setLoadTimeoutReached(false)
      return
    }
    const timeoutId = window.setTimeout(() => {
      setLoadTimeoutReached(true)
    }, 10000)
    return () => window.clearTimeout(timeoutId)
  }, [anyLoading])

  const handleRetry = React.useCallback(() => {
    setLoadTimeoutReached(false)
    void Promise.allSettled([
      fetchLeads(),
      fetchCasos(),
      fetchDocumentos(),
      fetchEventos(),
      fetchNotas(),
    ])
  }, [fetchCasos, fetchDocumentos, fetchEventos, fetchLeads, fetchNotas])

  const hasData = Boolean(
    leads.length || casos.length || documentos.length || agendaItems.length || notas.length
  )
  const baseState =
    anyLoading && !loadTimeoutReached
      ? 'loading'
      : anyError || loadTimeoutReached
        ? 'error'
        : hasData
          ? 'ready'
          : 'empty'
  const pageState = status !== 'ready' ? status : baseState
  const errorMessage = loadTimeoutReached
    ? 'Tempo limite ao carregar o painel. Tente novamente.'
    : anyError?.message
  const showRetry = Boolean(anyError || loadTimeoutReached)

  const leadHot =
    leads.find((lead) => lead.heat === 'quente' && lead.status !== 'ganho') ??
    leads[0]
  const docPending =
    documentos.find((doc) => doc.status === 'pendente') ?? documentos[0]
  const criticalEvents = React.useMemo(() => {
    const caseIds = new Set(casos.map((caso) => caso.id))
    return [...notas]
      .filter((event) => caseIds.has(event.casoId))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 4)
  }, [casos, notas])
  const todayIso = toIsoDate(new Date())
  const agendaToday = React.useMemo(
    () => agendaItems.filter((item) => item.date === todayIso).slice(0, 3),
    [agendaItems, todayIso],
  )
  const nextCase = casos[0]

  const kpis = React.useMemo(() => {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - 7)
    const prevWeekStart = new Date(now)
    prevWeekStart.setDate(prevWeekStart.getDate() - 14)

    const leadsActive = leads.filter(
      (lead) => lead.status !== 'perdido' && lead.status !== 'ganho'
    )
    const currentLeads = countInRange(leadsActive, (lead) => lead.createdAt, weekStart, now)
    const prevLeads = countInRange(leadsActive, (lead) => lead.createdAt, prevWeekStart, weekStart)

    const totalLeads = leads.length
    const convertedLeads = leads.filter((lead) => lead.status === 'ganho').length
    const conversionRate = totalLeads ? Math.round((convertedLeads / totalLeads) * 100) : 0

    const casesActive = casos.filter((caso) => caso.status === 'ativo').length
    const pendingDocs = documentos.filter((doc) => doc.status === 'pendente').length

    const avgResponseHours = (() => {
      const valid = leads.filter((lead) => lead.lastContactAt)
      if (valid.length === 0) return 0
      const total = valid.reduce((acc, lead) => {
        const start = new Date(lead.createdAt).getTime()
        const end = new Date(lead.lastContactAt as string).getTime()
        const diff = Math.max(0, end - start)
        return acc + diff
      }, 0)
      return Math.round(total / valid.length / (1000 * 60 * 60))
    })()

    const receita = Math.round(
      casos.reduce((acc, caso) => acc + (Number.isFinite(caso.value) ? caso.value : 0), 0)
    )

    return [
      buildKpi('kpi-001', 'Leads ativos', leadsActive.length, currentLeads - prevLeads, 'vs semana anterior'),
      buildKpi('kpi-002', 'Taxa de conversao', conversionRate, 0, 'ultimos 30 dias'),
      buildKpi('kpi-003', 'Casos em andamento', casesActive, 0, 'mes atual'),
      buildKpi('kpi-004', 'Pendencias criticas', pendingDocs, 0, 'ultimas 24h'),
      buildKpi('kpi-005', 'Tempo medio de resposta (h)', avgResponseHours, 0, 'ultimos 7 dias'),
      buildKpi('kpi-006', 'Receita potencial', receita, 0, 'pipeline atual'),
    ]
  }, [casos, documentos, leads])

  const notifications = React.useMemo(() => {
    const pendingDocs = documentos.filter((doc) => doc.status === 'pendente').length
    const criticalCases = casos.filter((caso) => caso.slaRisk === 'critico').length
    const leadActiveCount = leads.filter(
      (lead) => lead.status !== 'perdido' && lead.status !== 'ganho'
    ).length
    const agendaCount = agendaItems.filter((item) => item.date === todayIso).length
    return buildNotifications(leadActiveCount, pendingDocs, criticalCases, agendaCount)
  }, [agendaItems, casos, documentos, leads, todayIso])

  return (
    <div className="min-h-screen pb-12 bg-base text-text">
      <div className="space-y-6">
        <header
          className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-brand-primary-subtle via-surface to-surface p-8 shadow-lg"
        >
          {/* Light mode decorative elements */}
          <div className="absolute inset-0">
            <div className="absolute -right-10 -top-10 h-52 w-52 rounded-full bg-brand-primary/8 blur-3xl" />
            <div className="absolute -bottom-16 left-12 h-64 w-64 rounded-full bg-brand-secondary/8 blur-3xl" />
          </div>
          <div
            className="absolute inset-0 bg-no-repeat bg-right bg-[length:520px] opacity-90"
            style={{ backgroundImage: `url(${heroLight})` }}
          />
          <div className="relative z-10 space-y-3">
            <p className="text-[11px] uppercase tracking-[0.32em] text-text-muted">
              Dashboard
            </p>
            <h2 className="font-display text-3xl text-text">
              Resumo executivo
            </h2>
            <p className="max-w-2xl text-sm text-text-muted">
              Foco em caso critico, produtividade e agenda juridica com uma visão clara do funil.
            </p>
          </div>
        </header>

      <PageState
        status={pageState}
        errorDescription={errorMessage}
        onRetry={showRetry ? handleRetry : undefined}
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.slice(0, 4).map((item) => (
            <StatCard
              key={item.id}
              label={item.label}
              value={item.value}
              delta={item.delta}
              trend={item.trend}
              period={item.period}
              className="border border-border bg-surface/90"
            />
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[2.2fr_1fr]">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <ActionCard
                title="Lead quente aguardando retorno"
                description={
                  leadHot
                    ? `Contato pendente: ${leadHot.name} (${leadHot.area}).`
                    : 'Nenhum lead quente identificado.'
                }
                priority="P0"
                actionLabel="Acelerar lead"
                href="/app/leads"
                className="border border-border bg-surface/95 from-surface via-surface to-surface-alt text-text"
              />
              <ActionCard
                title="Documento pendente de validacao"
                description={
                  docPending
                    ? `${docPending.title} para ${docPending.cliente}.`
                    : 'Nenhum documento pendente.'
                }
                priority="P1"
                actionLabel="Validar agora"
                href="/app/documentos"
                secondaryActionLabel="Abrir dossie"
                secondaryHref={`/app/caso/${docPending?.casoId ?? 'caso-sem-dados'}`}
                className="border border-border bg-surface/95 text-text"
              />
            </div>

            <Card
              className="border border-border bg-surface/90"
            >
              <CardHeader className="flex-row items-center justify-between space-y-0 px-6 pt-6 pb-2">
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-warning" />
                  <CardTitle className="text-sm">Eventos criticos hoje</CardTitle>
                </div>
                {criticalEvents[0]?.casoId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/app/caso/${criticalEvents[0].casoId}`)}
                    className="px-0 text-primary hover:text-primary"
                  >
                    Ver caso
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-3 px-6 pb-6">
                {criticalEvents.length === 0 && (
                  <div className="rounded-2xl border border-border bg-white px-4 py-6 text-center text-xs text-text-muted shadow-[0_8px_20px_rgba(18,38,63,0.06)]">
                    Nenhum evento critico registrado hoje.
                  </div>
                )}
                {criticalEvents.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-2xl border border-border bg-white px-4 py-4 text-xs text-text-muted shadow-[0_8px_20px_rgba(18,38,63,0.06)]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-sm font-semibold text-text">
                          {event.title}
                        </span>
                        <p className="text-xs text-text-muted">{event.description}</p>
                        <div className="flex items-center gap-2 text-xs text-text-subtle">
                          <Badge
                            className={cn('uppercase', categoryBadgeClass(event.category))}
                          >
                            {event.category}
                          </Badge>
                          <Link
                            to={`/app/caso/${event.casoId}`}
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            Abrir dossie
                            <ChevronRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                      <span className="text-[10px] text-text-subtle">
                        {formatDateTime(event.date)}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card
              className="border border-border bg-surface/90"
            >
              <CardHeader className="flex-row items-center justify-between space-y-0 px-6 pt-6 pb-2">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-accent" />
                  <CardTitle className="text-sm">Agenda do dia</CardTitle>
                </div>
                <Link
                  to="/app/agenda"
                  className="text-xs text-primary hover:underline"
                >
                  Ver todos
                </Link>
              </CardHeader>
              <CardContent className="space-y-3 px-6 pb-6">
                {agendaToday.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-white px-4 py-4 text-sm text-text-muted shadow-[0_8px_20px_rgba(18,38,63,0.06)]"
                  >
                    <div>
                      <p className="text-sm font-semibold text-text">
                        {item.title}
                      </p>
                      <p className="text-xs text-text-subtle">
                        {item.cliente} - {item.location}
                      </p>
                    </div>
                    <div className="text-right text-xs text-text-subtle">
                      <div>{item.time}</div>
                      <div>{item.durationMinutes} min</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card
              className="border border-border bg-surface/90"
            >
              <CardHeader className="flex-row items-center justify-between space-y-0 px-6 pt-6 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">Proxima melhor acao</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 px-6 pb-6 text-sm text-text-muted">
                {nextCase ? (
                  <div
                    className="rounded-2xl border border-border bg-white px-4 py-4 shadow-[0_8px_20px_rgba(18,38,63,0.06)]"
                  >
                    <p className="text-sm font-semibold text-text">
                      {nextCase.title}
                    </p>
                    <p className="text-xs text-text-subtle">
                      Cliente: {nextCase.cliente} - Area {nextCase.area}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge className={cn('uppercase', slaBadgeClass(nextCase.slaRisk))}>
                        {nextCase.slaRisk}
                      </Badge>
                      <Badge className={cn('uppercase', stageBadgeClass(nextCase.stage))}>
                        {nextCase.stage}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div
                    className="rounded-2xl border border-border bg-white px-4 py-4 text-xs text-text-muted shadow-[0_8px_20px_rgba(18,38,63,0.06)]"
                  >
                    Nenhum caso ativo encontrado.
                  </div>
                )}
                <p className="text-xs text-text-muted">
                  Atualize o dossie e registre as pendencias prioritarias.
                </p>
                <div className="flex justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => nextCase && navigate(`/app/caso/${nextCase.id}`)}
                    className="rounded-full px-4"
                    disabled={!nextCase}
                  >
                    Abrir dossie
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border bg-surface/90">
              <CardHeader className="flex-row items-center justify-between space-y-0 px-6 pt-6 pb-2">
                <CardTitle className="text-sm">Acoes rapidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-6 pb-6">
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => navigate('/app/leads')}
                >
                  Novo lead
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => navigate('/app/casos')}
                >
                  Novo caso
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => navigate('/app/tarefas')}
                >
                  Nova tarefa
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => navigate('/app/agenda')}
                >
                  Novo compromisso
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => navigate('/app/documentos')}
                >
                  Upload documento
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <NotificationCenter
              notifications={notifications.slice(0, 6)}
              className="border border-border bg-surface/95 text-text"
            />
          </div>
        </div>
      </PageState>
      </div>
    </div>
  )
}
