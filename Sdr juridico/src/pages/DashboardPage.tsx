import * as React from 'react'
import { CalendarDays, ChevronRight, Flag, Sparkles, TrendingUp, TrendingDown, Minus, Clock, Briefcase, AlertTriangle, FileText, Users, Flame } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { PageState } from '@/components/PageState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

// Stats Card Component
const StatsCard = ({
  icon: Icon,
  label,
  value,
  change,
  changeType,
  color
}: {
  icon: React.ElementType
  label: string
  value: string | number
  change?: string
  changeType?: 'up' | 'down' | 'neutral'
  color: string
}) => (
  <div className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${color}15`, color }}
      >
        <Icon className="w-5 h-5" />
      </div>
      {change && (
        <span className={cn(
          'text-xs font-medium px-2 py-1 rounded-full',
          changeType === 'up' ? 'bg-green-50 text-green-700' :
          changeType === 'down' ? 'bg-red-50 text-red-700' :
          'bg-gray-50 text-gray-600'
        )}>
          {changeType === 'up' ? <TrendingUp className="w-3 h-3 inline" /> :
           changeType === 'down' ? <TrendingDown className="w-3 h-3 inline" /> :
           <Minus className="w-3 h-3 inline" />} {change}
        </span>
      )}
    </div>
    <div className="mt-4">
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  </div>
)

// Action Card Component
const ActionCard = ({
  title,
  subtitle,
  status,
  statusColor,
  client,
  area,
  onAction
}: {
  title: string
  subtitle: string
  status: string
  statusColor: 'green' | 'orange'
  client: string
  area: string
  onAction: () => void
}) => (
  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-all">
    <div className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: 'rgba(191, 111, 50, 0.1)', color: '#BF6F32' }}
        >
          <Sparkles className="w-5 h-5" />
        </div>
        <span className="text-xs font-medium text-gray-400">Próxima ação</span>
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">Cliente: {client}</p>
      <div className="flex items-center gap-2 mb-4">
        <span
          className="px-2.5 py-1 text-xs font-medium rounded-full"
          style={{
            backgroundColor: statusColor === 'green' ? '#E8F5E9' : '#FFF3E0',
            color: statusColor === 'green' ? '#2E7D32' : '#BF6F32'
          }}
        >
          {status}
        </span>
        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
          {area}
        </span>
      </div>
      <p className="text-xs text-gray-400 mb-4">{subtitle}</p>
    </div>
    <button
      onClick={onAction}
      className="w-full py-3 px-5 flex items-center justify-between text-sm font-medium border-t border-gray-100 hover:bg-gray-50 transition-colors"
      style={{ color: '#721011' }}
    >
      <span>Abrir dossiê</span>
      <ChevronRight className="w-4 h-4" />
    </button>
  </div>
)

// Task Card Component
const TaskCard = ({
  icon: Icon,
  title,
  description,
  status,
  buttonText,
  color,
  onClick
}: {
  icon: React.ElementType
  title: string
  description: string
  status: string
  buttonText: string
  color: string
  onClick: () => void
}) => (
  <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-all">
    <div className="flex items-start gap-4">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}15`, color }}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-500 mb-3">{description}</p>
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
            {status}
          </span>
          <button
            onClick={onClick}
            className="text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
            style={{ color: '#721011' }}
          >
            {buttonText}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
)

// Quick Action Button Component
const QuickActionButton = ({ icon: Icon, label, onClick }: {
  icon: React.ElementType
  label: string
  onClick: () => void
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all text-left"
  >
    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-50">
      <Icon className="w-5 h-5 text-gray-600" />
    </div>
    <span className="text-sm font-medium text-gray-700">{label}</span>
    <ChevronRight className="w-4 h-4 ml-auto text-gray-400" />
  </button>
)

// Notification Item Component
const NotificationItem = ({ title, time, isNew }: {
  title: string
  time: string
  isNew?: boolean
}) => (
  <div className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer">
    {isNew && (
      <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: '#721011' }} />
    )}
    {!isNew && <div className="w-2" />}
    <div className="flex-1 min-w-0">
      <p className="text-sm text-gray-900 truncate">{title}</p>
      <p className="text-xs text-gray-400 mt-1">{time}</p>
    </div>
  </div>
)

export const DashboardPage = () => {
  const navigate = useNavigate()
  const [params] = useSearchParams()
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

    const casesActive = casos.filter((caso) => caso.status === 'ativo').length
    const pendingDocs = documentos.filter((doc) => doc.status === 'pendente').length

    return [
      buildKpi('kpi-001', 'Leads Hoje', leadsActive.length, currentLeads - prevLeads, 'vs semana anterior'),
      buildKpi('kpi-002', 'Casos Ativos', casesActive, 0, 'mes atual'),
      buildKpi('kpi-003', 'Tarefas Pendentes', pendingDocs, 0, 'ultimas 24h'),
      buildKpi('kpi-004', 'Eventos Críticos', criticalEvents.length, 0, 'hoje'),
    ]
  }, [casos, documentos, leads, criticalEvents])

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
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <PageState
        status={pageState}
        errorDescription={errorMessage}
        onRetry={showRetry ? handleRetry : undefined}
      >
        <div className="p-6">
          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-6 mb-6">
            <StatsCard
              icon={Flame}
              label={kpis[0]?.label || 'Leads Hoje'}
              value={kpis[0]?.value || 0}
              change={kpis[0]?.delta ? `${Math.abs(kpis[0].delta)}` : undefined}
              changeType={kpis[0]?.trend === 'up' ? 'up' : kpis[0]?.trend === 'down' ? 'down' : 'neutral'}
              color="#721011"
            />
            <StatsCard
              icon={Briefcase}
              label={kpis[1]?.label || 'Casos Ativos'}
              value={kpis[1]?.value || 0}
              change={kpis[1]?.delta ? `${Math.abs(kpis[1].delta)}` : undefined}
              changeType={kpis[1]?.trend === 'up' ? 'up' : kpis[1]?.trend === 'down' ? 'down' : 'neutral'}
              color="#BF6F32"
            />
            <StatsCard
              icon={Clock}
              label={kpis[2]?.label || 'Tarefas Pendentes'}
              value={kpis[2]?.value || 0}
              change={kpis[2]?.delta ? `${Math.abs(kpis[2].delta)}` : undefined}
              changeType={kpis[2]?.trend === 'up' ? 'up' : kpis[2]?.trend === 'down' ? 'down' : 'neutral'}
              color="#6B5E58"
            />
            <StatsCard
              icon={AlertTriangle}
              label={kpis[3]?.label || 'Eventos Críticos'}
              value={kpis[3]?.value || 0}
              changeType="neutral"
              color="#2E7D32"
            />
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="col-span-2 space-y-6">
              {/* Task Cards */}
              <TaskCard
                icon={Flame}
                title="Lead quente aguardando retorno"
                description={
                  leadHot
                    ? `Contato pendente: ${leadHot.name} (${leadHot.area})`
                    : 'Nenhum lead quente identificado.'
                }
                status="P0"
                buttonText="Acelerar lead"
                color="#721011"
                onClick={() => navigate('/app/leads')}
              />

              <TaskCard
                icon={FileText}
                title="Documento pendente de validação"
                description={
                  docPending
                    ? `${docPending.title} - ${docPending.cliente}`
                    : 'Nenhum documento pendente.'
                }
                status="P1"
                buttonText="Validar agora"
                color="#BF6F32"
                onClick={() => navigate('/app/documentos')}
              />

              <TaskCard
                icon={AlertTriangle}
                title="Eventos críticos hoje"
                description={
                  criticalEvents.length > 0
                    ? `${criticalEvents.length} eventos críticos registrados hoje.`
                    : 'Nenhum evento crítico registrado hoje.'
                }
                status="OK"
                buttonText="Ver agenda"
                color="#2E7D32"
                onClick={() => navigate('/app/agenda')}
              />

              {/* Agenda */}
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Agenda do dia</h3>
                  <button
                    onClick={() => navigate('/app/agenda')}
                    className="text-sm font-medium"
                    style={{ color: '#721011' }}
                  >
                    Ver todos
                  </button>
                </div>
                <div className="space-y-3">
                  {agendaToday.length === 0 && (
                    <div className="text-center py-8 text-sm text-gray-400">
                      Nenhum compromisso agendado para hoje.
                    </div>
                  )}
                  {agendaToday.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <span className="text-sm font-mono text-gray-400 w-12">{item.time}</span>
                      <div
                        className="w-1 h-8 rounded-full"
                        style={{ backgroundColor: '#721011' }}
                      />
                      <div className="flex-1">
                        <span className="text-sm text-gray-700">{item.title}</span>
                        <p className="text-xs text-gray-400">{item.cliente}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Next Action Card */}
              {nextCase && (
                <ActionCard
                  title={nextCase.title}
                  subtitle="Atualize o dossiê e registre as pendências prioritárias."
                  status="OK"
                  statusColor="green"
                  client={nextCase.cliente}
                  area={nextCase.area}
                  onAction={() => navigate(`/app/caso/${nextCase.id}`)}
                />
              )}

              {/* Quick Actions */}
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Ações rápidas</h3>
                <div className="space-y-3">
                  <QuickActionButton icon={Flame} label="Novo lead" onClick={() => navigate('/app/leads')} />
                  <QuickActionButton icon={Briefcase} label="Novo caso" onClick={() => navigate('/app/casos')} />
                  <QuickActionButton icon={Clock} label="Nova tarefa" onClick={() => navigate('/app/tarefas')} />
                  <QuickActionButton icon={CalendarDays} label="Novo compromisso" onClick={() => navigate('/app/agenda')} />
                  <QuickActionButton icon={FileText} label="Upload documento" onClick={() => navigate('/app/documentos')} />
                </div>
              </div>

              {/* Notifications */}
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Notificações</h3>
                  <span
                    className="px-2 py-0.5 text-xs font-medium rounded-full text-white"
                    style={{ backgroundColor: '#721011' }}
                  >
                    {notifications.filter(n => !n.read).length} novos
                  </span>
                </div>
                <div className="divide-y divide-gray-100">
                  {notifications.slice(0, 4).map((notif) => (
                    <NotificationItem
                      key={notif.id}
                      title={notif.title}
                      time={formatDateTime(notif.date)}
                      isNew={!notif.read}
                    />
                  ))}
                </div>
                <Link
                  to="/app/notificacoes"
                  className="w-full py-3 text-sm font-medium border-t border-gray-100 hover:bg-gray-50 transition-colors block text-center"
                  style={{ color: '#721011' }}
                >
                  Ver todas notificações
                </Link>
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
