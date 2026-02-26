import * as React from 'react'
import {
  AlertTriangle,
  BarChart3,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  Eye,
  FileText,
  Flame,
  ListChecks,
  Minus,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { PageState } from '@/components/PageState'
import { useOrganizationContext } from '@/contexts/OrganizationContext'
import { useAgenda } from '@/hooks/useAgenda'
import { useCasos } from '@/hooks/useCasos'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useDocumentos } from '@/hooks/useDocumentos'
import { useFinanceiro } from '@/hooks/useFinanceiro'
import { useLeads } from '@/hooks/useLeads'
import { useNotas } from '@/hooks/useNotas'
import { usePlan } from '@/hooks/usePlan'
import { useTarefas } from '@/hooks/useTarefas'
import type { KPI, Tarefa } from '@/types/domain'
import { cn } from '@/utils/cn'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)

const resolveStatus = (
  value: string | null,
): 'loading' | 'empty' | 'error' | 'ready' => {
  if (value === 'loading' || value === 'empty' || value === 'error') {
    return value
  }
  return 'ready'
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
  end: Date,
) =>
  items.filter((item) => {
    const value = getDate(item)
    if (!value) return false
    const date = new Date(value)
    return date >= start && date < end
  }).length

const weekDayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

const toDayKey = (value: Date) => {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const buildKpi = (
  id: string,
  label: string,
  value: number,
  delta: number,
  period: string,
): KPI => ({
  id,
  label,
  value,
  delta,
  trend: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat',
  period,
})

const parseDate = (value?: string | null) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date
}

const isTaskOpen = (status: Tarefa['status']) => status !== 'concluida' && status !== 'cancelada'

const formatDateLabel = (value?: string | null) => {
  const date = parseDate(value)
  if (!date) return 'sem prazo'
  return date.toLocaleDateString('pt-BR')
}

const StatsCard = ({
  icon: Icon,
  label,
  value,
  change,
  changeType,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  change?: string
  changeType?: 'up' | 'down' | 'neutral'
  color: string
}) => (
  <div className="bg-surface rounded-xl p-5 border border-border hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${color}15`, color }}
      >
        <Icon className="h-5 w-5" />
      </div>
      {change && (
        <span
          className={cn(
            'text-xs font-medium px-2 py-1 rounded-full',
            changeType === 'up'
              ? 'bg-success-bg text-success'
              : changeType === 'down'
                ? 'bg-danger-bg text-danger'
                : 'bg-surface-alt text-text-muted',
          )}
        >
          {changeType === 'up' ? (
            <TrendingUp className="h-3.5 w-3.5 inline" />
          ) : changeType === 'down' ? (
            <TrendingDown className="h-3.5 w-3.5 inline" />
          ) : (
            <Minus className="h-3.5 w-3.5 inline" />
          )}{' '}
          {change}
        </span>
      )}
    </div>
    <div className="mt-4">
      <div className="text-2xl font-bold text-text">{value}</div>
      <div className="text-sm text-text-muted mt-1">{label}</div>
    </div>
  </div>
)

const TaskCard = ({
  icon: Icon,
  title,
  description,
  status,
  buttonText,
  color,
  onClick,
}: {
  icon: React.ElementType
  title: string
  description: string
  status: string
  buttonText: string
  color: string
  onClick: () => void
}) => (
  <div className="bg-surface rounded-xl border border-border p-5 hover:shadow-md transition-all">
    <div className="flex items-start gap-4">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}15`, color }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-text mb-1">{title}</h3>
        <p className="text-sm text-text-muted mb-3">{description}</p>
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-surface-alt text-text-muted">
            {status}
          </span>
          <button
            onClick={onClick}
            className="text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all text-brand-primary"
          >
            {buttonText}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
)

export const DashboardPage = () => {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const status = resolveStatus(params.get('state'))
  const { shortName, roleLabel, role, memberRole, user } = useCurrentUser()
  const { stats: orgStats } = useOrganizationContext()
  const { canUseFinanceiro, canUseAnalytics } = usePlan()

  const isLeitura    = memberRole === 'leitura'
  const isAdvogado   = memberRole === 'advogado'
  const isGestorDash = role === 'org_admin'
  const isSolo = isGestorDash && (orgStats?.total_users ?? 2) <= 1

  const { leads, loading: leadsLoading, error: leadsError, fetchLeads } = useLeads()
  const { casos, loading: casosLoading, error: casosError, fetchCasos } = useCasos()
  const { documentos, loading: docsLoading, error: docsError, fetchDocumentos } = useDocumentos()
  const { tarefas, loading: tarefasLoading, error: tarefasError, fetchTarefas } = useTarefas()
  const {
    eventos: agendaItems,
    loading: agendaLoading,
    error: agendaError,
    fetchEventos,
  } = useAgenda()
  const { notas, loading: notasLoading, error: notasError, fetchNotas } = useNotas()
  const { snapshot: finSnapshot, loading: finLoading } = useFinanceiro(leads, casos)
  const [loadTimeoutReached, setLoadTimeoutReached] = React.useState(false)
  const [planTab, setPlanTab] = React.useState<'pendentes' | 'concluidas'>('pendentes')

  const anyLoading =
    leadsLoading || casosLoading || docsLoading || tarefasLoading || agendaLoading || notasLoading
  const anyError = leadsError || casosError || docsError || tarefasError || agendaError || notasError

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
      fetchTarefas(),
      fetchEventos(),
      fetchNotas(),
    ])
  }, [fetchCasos, fetchDocumentos, fetchTarefas, fetchEventos, fetchLeads, fetchNotas])

  const hasData = Boolean(
    leads.length || casos.length || documentos.length || tarefas.length || agendaItems.length || notas.length,
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

  const now = React.useMemo(() => new Date(), [])
  const todayStart = React.useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  }, [])
  const tomorrowStart = React.useMemo(() => {
    const date = new Date(todayStart)
    date.setDate(date.getDate() + 1)
    return date
  }, [todayStart])
  const todayIso = React.useMemo(() => toIsoDate(todayStart), [todayStart])

  const criticalEvents = React.useMemo(() => {
    const caseIds = new Set(casos.map((caso) => caso.id))
    return [...notas]
      .filter((event) => caseIds.has(event.casoId))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 4)
  }, [casos, notas])

  const agendaToday = React.useMemo(
    () => agendaItems.filter((item) => item.date === todayIso).slice(0, 6),
    [agendaItems, todayIso],
  )

  const openTasks = React.useMemo(() => tarefas.filter((task) => isTaskOpen(task.status)), [tarefas])

  const overdueTasks = React.useMemo(
    () =>
      openTasks.filter((task) => {
        const dueDate = parseDate(task.dueDate)
        return Boolean(dueDate && dueDate < todayStart)
      }),
    [openTasks, todayStart],
  )

  const dueTodayTasks = React.useMemo(
    () =>
      openTasks.filter((task) => {
        const dueDate = parseDate(task.dueDate)
        return Boolean(dueDate && dueDate >= todayStart && dueDate < tomorrowStart)
      }),
    [openTasks, todayStart, tomorrowStart],
  )

  const awaitingValidationCount = React.useMemo(
    () => tarefas.filter((task) => task.status === 'aguardando_validacao').length,
    [tarefas],
  )

  const inProgressCount = React.useMemo(
    () => tarefas.filter((task) => task.status === 'em_andamento').length,
    [tarefas],
  )

  const pendingDocsCount = React.useMemo(
    () => documentos.filter((doc) => doc.status === 'pendente').length,
    [documentos],
  )

  // Filtered views for advogado role
  const meusCasos = React.useMemo(
    () =>
      isAdvogado
        ? casos.filter((c) => c.responsavel === shortName || c.responsavel === user?.id)
        : casos,
    [casos, isAdvogado, shortName, user?.id],
  )

  const meusLeads = React.useMemo(
    () =>
      isAdvogado
        ? leads.filter((l) => l.owner === user?.id || l.owner === shortName)
        : leads,
    [leads, isAdvogado, user?.id, shortName],
  )

  const criticalCasesCount = React.useMemo(
    () =>
      meusCasos.filter((caso) => caso.slaRisk === 'critico' || caso.prioridade === 'critica').length,
    [meusCasos],
  )

  const hotLeadsCount = React.useMemo(
    () => meusLeads.filter((lead) => lead.heat === 'quente' && lead.status !== 'ganho').length,
    [meusLeads],
  )

  const kpis = React.useMemo(() => {
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - 7)
    const prevWeekStart = new Date(now)
    prevWeekStart.setDate(prevWeekStart.getDate() - 14)

    const completedWeek = countInRange(tarefas, (task) => task.completedAt, weekStart, now)
    const completedPrevWeek = countInRange(tarefas, (task) => task.completedAt, prevWeekStart, weekStart)
    const dueToday = dueTodayTasks.length + agendaToday.length

    return [
      buildKpi(
        'kpi-001',
        'Urgencias do perfil',
        overdueTasks.length + criticalCasesCount + criticalEvents.length,
        0,
        'hoje',
      ),
      buildKpi('kpi-002', 'Tarefas abertas', openTasks.length, 0, 'carteira atual'),
      buildKpi('kpi-003', 'Entregas e agenda hoje', dueToday, 0, 'dia atual'),
      buildKpi(
        'kpi-004',
        'Concluidas na semana',
        completedWeek,
        completedWeek - completedPrevWeek,
        'vs semana anterior',
      ),
    ]
  }, [
    now,
    tarefas,
    dueTodayTasks.length,
    agendaToday.length,
    overdueTasks.length,
    criticalCasesCount,
    criticalEvents.length,
    openTasks.length,
  ])

  const weeklyTaskSeries = React.useMemo(() => {
    const today = new Date()
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today)
      date.setDate(today.getDate() - (6 - index))
      return date
    })

    const createdCount = new Map<string, number>()
    const completedCount = new Map<string, number>()

    tarefas.forEach((task) => {
      const createdAt = parseDate(task.createdAt)
      if (createdAt) {
        const key = toDayKey(createdAt)
        createdCount.set(key, (createdCount.get(key) || 0) + 1)
      }

      const completedAt = parseDate(task.completedAt)
      if (completedAt) {
        const key = toDayKey(completedAt)
        completedCount.set(key, (completedCount.get(key) || 0) + 1)
      }
    })

    return days.map((day) => {
      const key = toDayKey(day)
      return {
        day: weekDayLabels[day.getDay()],
        criadas: createdCount.get(key) || 0,
        concluidas: completedCount.get(key) || 0,
      }
    })
  }, [tarefas])

  const urgencyBreakdown = React.useMemo(
    () => [
      { name: 'Tarefas atrasadas', value: overdueTasks.length, color: '#721011' },
      { name: 'Aguardando validacao', value: awaitingValidationCount, color: '#BF6F32' },
      { name: 'Casos criticos', value: criticalCasesCount, color: '#6B5E58' },
      { name: 'Eventos criticos', value: criticalEvents.length, color: '#2E7D32' },
    ],
    [overdueTasks.length, awaitingValidationCount, criticalCasesCount, criticalEvents.length],
  )

  const urgencyChartData = React.useMemo(
    () =>
      urgencyBreakdown.some((item) => item.value > 0)
        ? urgencyBreakdown
        : [{ name: 'Sem urgencias', value: 1, color: '#C7CED6' }],
    [urgencyBreakdown],
  )

  const profilePriorities = React.useMemo(
    () => [
      {
        id: 'priority-overdue',
        icon: AlertTriangle,
        title: 'Tarefas atrasadas',
        description:
          overdueTasks.length > 0
            ? `${overdueTasks.length} tarefas com prazo vencido.`
            : 'Sem tarefas atrasadas no momento.',
        status: overdueTasks.length > 0 ? 'P0' : 'OK',
        buttonText: 'Abrir tarefas',
        color: '#721011',
        onClick: () => navigate('/app/tarefas'),
      },
      {
        id: 'priority-agenda',
        icon: Clock,
        title: 'Compromissos de hoje',
        description:
          agendaToday.length > 0
            ? `${agendaToday.length} compromissos para acompanhar no dia.`
            : 'Nenhum compromisso marcado para hoje.',
        status: agendaToday.length > 0 ? 'Acompanhar' : 'Livre',
        buttonText: 'Ver agenda',
        color: '#BF6F32',
        onClick: () => navigate('/app/agenda'),
      },
      {
        id: 'priority-validation',
        icon: FileText,
        title: 'Validacoes pendentes',
        description:
          awaitingValidationCount > 0
            ? `${awaitingValidationCount} tarefas aguardando validacao.`
            : 'Nenhuma validacao pendente agora.',
        status: awaitingValidationCount > 0 ? 'P1' : 'OK',
        buttonText: 'Ir para tarefas',
        color: '#2E7D32',
        onClick: () => navigate('/app/tarefas'),
      },
    ],
    [overdueTasks.length, agendaToday.length, awaitingValidationCount, navigate],
  )

  const urgencyFeed = React.useMemo(() => {
    const taskItems = overdueTasks.slice(0, 3).map((task) => ({
      id: `task-${task.id}`,
      title: task.title,
      detail: `Tarefa atrasada (${formatDateLabel(task.dueDate)})`,
      route: '/app/tarefas',
      badge: 'P0',
    }))

    const eventItems = criticalEvents.slice(0, 2).map((event) => ({
      id: `event-${event.id}`,
      title: event.title,
      detail: 'Evento critico relacionado a caso',
      route: '/app/casos',
      badge: 'P1',
    }))

    const agendaItemsToday = agendaToday
      .filter((item) => item.status === 'pendente')
      .slice(0, 2)
      .map((item) => ({
        id: `agenda-${item.id}`,
        title: `${item.time} - ${item.title}`,
        detail: item.cliente ? `Cliente: ${item.cliente}` : 'Agenda do dia',
        route: '/app/agenda',
        badge: 'Hoje',
      }))

    return [...taskItems, ...eventItems, ...agendaItemsToday].slice(0, 6)
  }, [overdueTasks, criticalEvents, agendaToday])

  const todayTaskQueue = React.useMemo(
    () =>
      openTasks
        .filter((task) => {
          const dueDate = parseDate(task.dueDate)
          return Boolean(dueDate && dueDate < tomorrowStart)
        })
        .sort((a, b) => {
          const aDate = parseDate(a.dueDate)?.getTime() || Number.MAX_SAFE_INTEGER
          const bDate = parseDate(b.dueDate)?.getTime() || Number.MAX_SAFE_INTEGER
          return aDate - bDate
        })
        .slice(0, 6),
    [openTasks, tomorrowStart],
  )

  // ── Plano do dia ──────────────────────────────────────────────────────────
  const completedToday = React.useMemo(
    () =>
      tarefas.filter((task) => {
        if (!task.completedAt) return false
        const completed = parseDate(task.completedAt)
        return Boolean(completed && completed >= todayStart && completed < tomorrowStart)
      }),
    [tarefas, todayStart, tomorrowStart],
  )

  const planTodayQueue = React.useMemo(
    () =>
      [
        ...overdueTasks.sort((a, b) => (parseDate(a.dueDate)?.getTime() || 0) - (parseDate(b.dueDate)?.getTime() || 0)),
        ...dueTodayTasks.sort((a, b) => (parseDate(a.dueDate)?.getTime() || 0) - (parseDate(b.dueDate)?.getTime() || 0)),
      ].slice(0, 12),
    [overdueTasks, dueTodayTasks],
  )

  const planDayTotal = overdueTasks.length + dueTodayTasks.length + completedToday.length

  const planDayProgress = planDayTotal > 0 ? Math.round((completedToday.length / planDayTotal) * 100) : 100

  // ── Rendimento ────────────────────────────────────────────────────────────
  const weeklyCompletedCount = React.useMemo(() => {
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - 7)
    return tarefas.filter((task) => {
      const completed = parseDate(task.completedAt)
      return Boolean(completed && completed >= weekStart && completed <= now)
    }).length
  }, [tarefas, now])

  const weeklyCompletionRate = React.useMemo(() => {
    const total = tarefas.filter((t) => t.status !== 'cancelada').length
    return total > 0 ? Math.round((weeklyCompletedCount / total) * 100) : 0
  }, [tarefas, weeklyCompletedCount])

  const dailyAvgCompleted = Math.round((weeklyCompletedCount / 7) * 10) / 10

  const onTimeRate = React.useMemo(() => {
    const completed = tarefas.filter((t) => t.status === 'concluida' && t.completedAt && t.dueDate)
    if (completed.length === 0) return 100
    const onTime = completed.filter((t) => {
      const done = parseDate(t.completedAt)
      const due = parseDate(t.dueDate)
      return Boolean(done && due && done <= due)
    }).length
    return Math.round((onTime / completed.length) * 100)
  }, [tarefas])

  const dashTitle = isSolo
    ? `${shortName}, seu escritório`
    : isGestorDash
      ? `${shortName}, visão gerencial`
      : isAdvogado
        ? `${shortName}, seu dia`
        : isLeitura
          ? `${shortName}, visão geral`
          : `${shortName}, painel administrativo`

  return (
    <div className="min-h-screen bg-surface-alt" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <PageState
        status={pageState}
        errorDescription={errorMessage}
        onRetry={showRetry ? handleRetry : undefined}
      >
        <div className="p-6">
          {/* Banner modo leitura */}
          {isLeitura && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
              <Eye className="h-4 w-4 shrink-0" />
              Você está em <strong className="ml-1">modo leitura</strong> — nenhuma ação pode ser realizada neste perfil.
            </div>
          )}

          <div className="mb-6 rounded-2xl border border-border bg-surface p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-text-subtle">Painel do perfil</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold text-text">{dashTitle}</h1>
              {isSolo ? (
                <span
                  className="rounded-full px-2.5 py-1 text-xs font-semibold"
                  style={{ backgroundColor: 'rgba(114,16,17,0.12)', color: '#721011' }}
                >
                  Solo
                </span>
              ) : (
                <span
                  className="rounded-full px-3 py-1.5 text-xs font-medium"
                  style={
                    isGestorDash
                      ? { backgroundColor: 'rgba(114,16,17,0.1)', color: '#721011' }
                      : { backgroundColor: 'var(--color-surface-alt)', color: 'var(--color-text-muted)' }
                  }
                >
                  {roleLabel}
                </span>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-surface-alt px-3 py-1.5 text-text-muted">
                {todayStart.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 xl:grid-cols-4">
            <StatsCard
              icon={Flame}
              label={kpis[0]?.label || 'Urgencias do perfil'}
              value={kpis[0]?.value || 0}
              change={kpis[0]?.delta ? `${Math.abs(kpis[0].delta)}` : undefined}
              changeType={
                kpis[0]?.trend === 'up' ? 'up' : kpis[0]?.trend === 'down' ? 'down' : 'neutral'
              }
              color="#721011"
            />
            <StatsCard
              icon={ListChecks}
              label={kpis[1]?.label || 'Tarefas abertas'}
              value={kpis[1]?.value || 0}
              change={kpis[1]?.delta ? `${Math.abs(kpis[1].delta)}` : undefined}
              changeType={
                kpis[1]?.trend === 'up' ? 'up' : kpis[1]?.trend === 'down' ? 'down' : 'neutral'
              }
              color="#BF6F32"
            />
            <StatsCard
              icon={Clock}
              label={kpis[2]?.label || 'Entregas e agenda hoje'}
              value={kpis[2]?.value || 0}
              change={kpis[2]?.delta ? `${Math.abs(kpis[2].delta)}` : undefined}
              changeType={
                kpis[2]?.trend === 'up' ? 'up' : kpis[2]?.trend === 'down' ? 'down' : 'neutral'
              }
              color="#6B5E58"
            />
            <StatsCard
              icon={Briefcase}
              label={kpis[3]?.label || 'Concluidas na semana'}
              value={kpis[3]?.value || 0}
              change={kpis[3]?.delta ? `${Math.abs(kpis[3].delta)}` : undefined}
              changeType={
                kpis[3]?.trend === 'up' ? 'up' : kpis[3]?.trend === 'down' ? 'down' : 'neutral'
              }
              color="#2E7D32"
            />
          </div>

          {/* ── MINI-CARD FINANCEIRO (org_admin only) ───────────────────────── */}
          {isGestorDash && canUseFinanceiro && !finLoading && (
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs text-text-subtle">Receita realizada (mês)</p>
                <p className="text-xl font-bold text-green-700">{formatCurrency(finSnapshot.receitaRealizadaMes)}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs text-text-subtle">Resultado operacional</p>
                <p className={cn('text-xl font-bold', finSnapshot.resultadoMes >= 0 ? 'text-green-700' : 'text-red-700')}>
                  {formatCurrency(finSnapshot.resultadoMes)}
                </p>
                <p className="text-xs text-text-subtle">Margem {finSnapshot.margemOperacional}%</p>
              </div>
              {canUseAnalytics && (
                <button
                  onClick={() => navigate('/app/analytics')}
                  className="flex items-center justify-between rounded-xl border border-border bg-surface p-4 text-left hover:shadow-md transition-shadow"
                >
                  <div>
                    <p className="text-xs text-text-subtle">Painel executivo</p>
                    <p className="text-sm font-semibold text-text">Ver Analytics completo</p>
                  </div>
                  <BarChart3 className="h-5 w-5" style={{ color: '#721011' }} />
                </button>
              )}
            </div>
          )}
          {isGestorDash && !canUseFinanceiro && (
            <div className="mb-6 rounded-xl border border-dashed border-border bg-surface/60 p-4 text-center text-sm text-text-muted">
              Módulo financeiro disponível no plano <strong>Profissional</strong>.{' '}
              <button
                className="font-medium underline"
                style={{ color: '#721011' }}
                onClick={() => navigate('/app/config')}
              >
                Ver planos
              </button>
            </div>
          )}

          {/* ── PLANO DO DIA ─────────────────────────────────────────────────── */}
          <div className="mb-6 rounded-xl border border-border bg-surface p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-text">Plano do Dia</h3>
                <p className="text-xs text-text-subtle">
                  {completedToday.length > 0
                    ? `${completedToday.length} de ${planDayTotal} tarefas concluídas hoje`
                    : planDayTotal > 0
                      ? `${planDayTotal} tarefas planejadas — nenhuma concluída ainda`
                      : 'Nenhuma tarefa planejada para hoje'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-44">
                  <div className="mb-1.5 flex justify-between text-xs text-text-subtle">
                    <span>Progresso do dia</span>
                    <span className="font-semibold text-text">{planDayProgress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-alt">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ width: `${planDayProgress}%`, backgroundColor: '#721011' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Summary chips */}
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                onClick={() => setPlanTab('pendentes')}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  planTab === 'pendentes' ? 'text-white' : 'bg-surface-alt text-text-muted hover:bg-border/40',
                )}
                style={planTab === 'pendentes' ? { backgroundColor: '#721011' } : undefined}
              >
                <AlertTriangle className="h-3 w-3" />
                {overdueTasks.length} atrasadas
              </button>
              <span className="flex items-center gap-1.5 rounded-full bg-surface-alt px-3 py-1 text-xs font-medium text-text-muted">
                <Clock className="h-3 w-3" />
                {dueTodayTasks.length} para hoje
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-surface-alt px-3 py-1 text-xs font-medium text-text-muted">
                <Calendar className="h-3 w-3" />
                {agendaToday.length} na agenda
              </span>
              <button
                onClick={() => setPlanTab('concluidas')}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  planTab === 'concluidas' ? 'text-white' : 'bg-surface-alt text-text-muted hover:bg-border/40',
                )}
                style={planTab === 'concluidas' ? { backgroundColor: '#2E7D32' } : undefined}
              >
                <CheckCircle2 className="h-3 w-3" />
                {completedToday.length} concluídas
              </button>
            </div>

            {/* Tabs */}
            <div className="mb-3 flex gap-1 border-b border-border">
              <button
                onClick={() => setPlanTab('pendentes')}
                className={cn(
                  'px-4 py-2 text-xs font-medium transition-colors border-b-2',
                  planTab === 'pendentes' ? 'text-text' : 'border-transparent text-text-subtle hover:text-text',
                )}
                style={planTab === 'pendentes' ? { borderColor: '#721011' } : undefined}
              >
                Para fazer ({overdueTasks.length + dueTodayTasks.length})
              </button>
              <button
                onClick={() => setPlanTab('concluidas')}
                className={cn(
                  'px-4 py-2 text-xs font-medium transition-colors border-b-2',
                  planTab === 'concluidas' ? 'text-text' : 'border-transparent text-text-subtle hover:text-text',
                )}
                style={planTab === 'concluidas' ? { borderColor: '#2E7D32' } : undefined}
              >
                Concluídas hoje ({completedToday.length})
              </button>
            </div>

            {/* Task list */}
            <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
              {planTab === 'pendentes' ? (
                planTodayQueue.length === 0 ? (
                  <div className="py-8 text-center text-sm text-text-subtle">
                    Nenhuma tarefa pendente para hoje. Ótimo trabalho!
                  </div>
                ) : (
                  planTodayQueue.map((task) => {
                    const isOverdue = overdueTasks.some((t) => t.id === task.id)
                    return (
                      <button
                        key={task.id}
                        onClick={() => navigate('/app/tarefas')}
                        className="flex w-full items-center justify-between rounded-lg bg-surface-alt px-3 py-2.5 text-left hover:bg-border/30 transition-colors"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          {isOverdue
                            ? <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-600" />
                            : <Circle className="h-3.5 w-3.5 shrink-0 text-text-subtle" />
                          }
                          <span className={cn('truncate text-sm', isOverdue ? 'font-medium text-red-700' : 'text-text')}>
                            {task.title}
                          </span>
                        </div>
                        <div className="ml-3 flex shrink-0 items-center gap-2">
                          <span className="text-xs text-text-muted capitalize">{task.priority}</span>
                          <span className={cn('text-xs', isOverdue ? 'font-medium text-red-600' : 'text-text-subtle')}>
                            {formatDateLabel(task.dueDate)}
                          </span>
                        </div>
                      </button>
                    )
                  })
                )
              ) : (
                completedToday.length === 0 ? (
                  <div className="py-8 text-center text-sm text-text-subtle">
                    Nenhuma tarefa concluída hoje ainda.
                  </div>
                ) : (
                  completedToday.slice(0, 12).map((task) => (
                    <button
                      key={task.id}
                      onClick={() => navigate('/app/tarefas')}
                      className="flex w-full items-center justify-between rounded-lg bg-surface-alt px-3 py-2.5 text-left hover:bg-border/30 transition-colors"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-600" />
                        <span className="truncate text-sm text-text-muted line-through">{task.title}</span>
                      </div>
                      <span className="ml-3 shrink-0 text-xs font-medium text-green-600">concluída</span>
                    </button>
                  ))
                )
              )}
            </div>

            {(planTodayQueue.length >= 12 || completedToday.length > 12) && (
              <button
                onClick={() => navigate('/app/tarefas')}
                className="mt-3 flex w-full items-center justify-center gap-1 text-xs font-medium text-brand-primary hover:gap-2 transition-all"
              >
                Ver todas as tarefas
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 mb-6 xl:grid-cols-3">
            <div className="xl:col-span-2 rounded-xl border border-border bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-text">Ritmo de tarefas na semana</h3>
                <span className="text-xs text-text-subtle">Criadas x concluidas</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyTaskSeries}>
                    <CartesianGrid stroke="var(--color-border-soft)" strokeDasharray="4 6" />
                    <XAxis
                      dataKey="day"
                      tickLine={false}
                      axisLine={false}
                      stroke="var(--color-text-subtle)"
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      stroke="var(--color-text-subtle)"
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '12px',
                        color: 'var(--color-text)',
                        boxShadow: '0 10px 30px rgba(18, 38, 63, 0.08)',
                        fontSize: '12px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="criadas"
                      name="Criadas"
                      stroke="#BF6F32"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#BF6F32' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="concluidas"
                      name="Concluidas"
                      stroke="#721011"
                      strokeWidth={3}
                      dot={{ r: 3, fill: '#721011' }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="mb-4">
                <h3 className="font-semibold text-text">Mapa de urgencias</h3>
                <p className="text-xs text-text-subtle">Itens que exigem resposta rapida</p>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={urgencyChartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={76}
                      paddingAngle={4}
                    >
                      {urgencyChartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '12px',
                        color: 'var(--color-text)',
                        boxShadow: '0 10px 30px rgba(18, 38, 63, 0.08)',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                {urgencyBreakdown.map((item) => (
                  <div key={item.name} className="rounded-lg bg-surface-alt px-2 py-2 text-center">
                    <div className="font-semibold text-text">{item.value}</div>
                    <div className="text-text-subtle">{item.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2 space-y-6">
              {profilePriorities.map((priority) => (
                <TaskCard
                  key={priority.id}
                  icon={priority.icon}
                  title={priority.title}
                  description={priority.description}
                  status={priority.status}
                  buttonText={priority.buttonText}
                  color={priority.color}
                  onClick={priority.onClick}
                />
              ))}

              <div className="bg-surface rounded-xl border border-border p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-text">Urgencias do perfil</h3>
                  <button
                    onClick={() => navigate('/app/tarefas')}
                    className="text-sm font-medium text-brand-primary"
                  >
                    Abrir fila completa
                  </button>
                </div>
                <div className="space-y-3">
                  {urgencyFeed.length === 0 && (
                    <div className="text-center py-6 text-sm text-text-subtle">
                      Sem urgencias registradas no momento.
                    </div>
                  )}
                  {urgencyFeed.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.route)}
                      className="w-full flex items-center justify-between rounded-lg border border-border bg-surface-alt px-3 py-3 text-left hover:bg-border/30 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text truncate">{item.title}</p>
                        <p className="text-xs text-text-subtle">{item.detail}</p>
                      </div>
                      <span className="ml-3 rounded-full bg-surface px-2 py-1 text-xs font-medium text-text-muted">
                        {item.badge}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-surface rounded-xl border border-border p-5">
                <h3 className="font-semibold text-text mb-4">Fila de tarefas de hoje</h3>
                <div className="space-y-3">
                  {todayTaskQueue.length === 0 && (
                    <div className="text-center py-6 text-sm text-text-subtle">
                      Nenhuma tarefa para vencer hoje.
                    </div>
                  )}
                  {todayTaskQueue.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => navigate('/app/tarefas')}
                      className="w-full flex items-center justify-between rounded-lg bg-surface-alt px-3 py-2 text-left hover:bg-border/40 transition-colors"
                    >
                      <div className="min-w-0">
                        <span className="text-sm text-text line-clamp-1">{task.title}</span>
                        <p className="text-xs text-text-subtle">Prazo: {formatDateLabel(task.dueDate)}</p>
                      </div>
                      <span className="text-xs font-medium text-text-muted ml-2">{task.priority}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-surface rounded-xl border border-border p-5">
                <h3 className="font-semibold text-text mb-4">Rendimento da semana</h3>
                <div className="space-y-4">
                  {/* Taxa de conclusão */}
                  <div>
                    <div className="mb-1.5 flex justify-between text-xs">
                      <span className="text-text-subtle">Taxa de conclusão</span>
                      <span className="font-semibold text-text">{weeklyCompletionRate}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-alt">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ width: `${weeklyCompletionRate}%`, backgroundColor: '#721011' }}
                      />
                    </div>
                  </div>
                  {/* Entregas no prazo */}
                  <div>
                    <div className="mb-1.5 flex justify-between text-xs">
                      <span className="text-text-subtle">Entregas no prazo</span>
                      <span
                        className={cn(
                          'font-semibold',
                          onTimeRate >= 80 ? 'text-green-700' : onTimeRate >= 60 ? 'text-amber-700' : 'text-red-700',
                        )}
                      >
                        {onTimeRate}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-alt">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${onTimeRate}%`,
                          backgroundColor: onTimeRate >= 80 ? '#2E7D32' : onTimeRate >= 60 ? '#BF6F32' : '#721011',
                        }}
                      />
                    </div>
                  </div>
                  {/* Métricas em grid */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="rounded-lg bg-surface-alt px-3 py-2.5 text-center">
                      <p className="text-xl font-bold text-text">{completedToday.length}</p>
                      <p className="text-xs text-text-subtle">concluídas hoje</p>
                    </div>
                    <div className="rounded-lg bg-surface-alt px-3 py-2.5 text-center">
                      <p className="text-xl font-bold text-text">{weeklyCompletedCount}</p>
                      <p className="text-xs text-text-subtle">na semana</p>
                    </div>
                    <div className="rounded-lg bg-surface-alt px-3 py-2.5 text-center">
                      <p className="text-xl font-bold text-text">{dailyAvgCompleted}</p>
                      <p className="text-xs text-text-subtle">média/dia</p>
                    </div>
                    <div className="rounded-lg bg-surface-alt px-3 py-2.5 text-center">
                      <p className={cn('text-xl font-bold', overdueTasks.length > 0 ? 'text-red-700' : 'text-green-700')}>
                        {overdueTasks.length}
                      </p>
                      <p className="text-xs text-text-subtle">em atraso</p>
                    </div>
                  </div>
                  {/* Links rápidos */}
                  <div className="space-y-2 border-t border-border pt-2">
                    <button
                      onClick={() => navigate('/app/tarefas')}
                      className="w-full flex items-center justify-between rounded-lg bg-surface-alt px-3 py-2 text-left hover:bg-border/40 transition-colors"
                    >
                      <span className="text-sm text-text">Em andamento</span>
                      <span className="text-sm font-semibold text-text">{inProgressCount}</span>
                    </button>
                    <button
                      onClick={() => navigate('/app/documentos')}
                      className="w-full flex items-center justify-between rounded-lg bg-surface-alt px-3 py-2 text-left hover:bg-border/40 transition-colors"
                    >
                      <span className="text-sm text-text">Docs pendentes</span>
                      <span className="text-sm font-semibold text-text">{pendingDocsCount}</span>
                    </button>
                    <button
                      onClick={() => navigate('/app/casos')}
                      className="w-full flex items-center justify-between rounded-lg bg-surface-alt px-3 py-2 text-left hover:bg-border/40 transition-colors"
                    >
                      <span className="text-sm text-text">Casos críticos</span>
                      <span className="text-sm font-semibold text-text">{criticalCasesCount}</span>
                    </button>
                    <button
                      onClick={() => navigate('/app/leads')}
                      className="w-full flex items-center justify-between rounded-lg bg-surface-alt px-3 py-2 text-left hover:bg-border/40 transition-colors"
                    >
                      <span className="text-sm text-text">Leads quentes</span>
                      <span className="text-sm font-semibold text-text">{hotLeadsCount}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageState>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
      `}</style>
    </div>
  )
}
