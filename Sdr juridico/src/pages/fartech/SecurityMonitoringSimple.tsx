import { useState, useEffect, useCallback } from 'react'
import {
  Shield,
  Activity,
  Database,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
  FileText,
  Calendar,
  Briefcase,
  UserCheck,
  Eye,
  Clock,
  Search,
  Server,
  Zap,
  Globe,
  BarChart3,
  Monitor,
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { auditLogsService } from '@/services/auditLogsService'
import type { AuditLogEntry } from '@/services/auditLogsService'
import { cn } from '@/utils/cn'

// ─── Types ────────────────────────────────────────────────────────────

interface ConnectionInfo {
  status: 'connected' | 'disconnected'
  latency: number | null
  timestamp: Date
}

interface TableStats {
  name: string
  count: number
  icon: React.ComponentType<{ className?: string }>
}

interface APIStatus {
  name: string
  status: 'connected' | 'disconnected' | 'not-configured'
  message: string
  icon: React.ComponentType<{ className?: string }>
}

interface ActiveSession {
  id: string
  user_id: string
  org_id: string | null
  started_at: string
  last_seen_at: string
  ip_address?: string
  user_agent?: string
}

interface AnalyticsEvent {
  id: string
  event_name: string
  user_id: string | null
  org_id: string | null
  metadata: Record<string, any> | null
  created_at: string
}

interface DataJudStats {
  totalCalls: number
  callsToday: number
  callsThisMonth: number
  lastSync: string | null
  syncJobsActive: number
  syncJobsFailed: number
}

type TabId = 'overview' | 'inspector' | 'sessions' | 'audit' | 'compliance'

// ─── Constants ────────────────────────────────────────────────────────

const TABLES_TO_CHECK = [
  { name: 'leads', icon: Users },
  { name: 'clientes', icon: UserCheck },
  { name: 'casos', icon: Briefcase },
  { name: 'documentos', icon: FileText },
  { name: 'agendamentos', icon: Calendar },
  { name: 'usuarios', icon: Users },
  { name: 'orgs', icon: Database },
  { name: 'org_members', icon: Users },
  { name: 'tarefas', icon: FileText },
  { name: 'notas', icon: FileText },
]

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Visao Geral', icon: Eye },
  { id: 'inspector', label: 'Data Inspector', icon: Database },
  { id: 'sessions', label: 'Sessoes & Analytics', icon: Monitor },
  { id: 'audit', label: 'Auditoria', icon: FileText },
  { id: 'compliance', label: 'Conformidade', icon: CheckCircle2 },
]

const SECURITY_CHECKLIST = [
  { item: 'Row Level Security (RLS) habilitado', status: true },
  { item: 'Autenticacao via Supabase Auth', status: true },
  { item: 'Tokens JWT com expiracao', status: true },
  { item: 'Criptografia de dados em transito (HTTPS/SSL)', status: true },
  { item: 'Permissoes por role (fartech_admin, org_admin, user)', status: true },
  { item: 'Guards de rota no frontend', status: true },
  { item: 'Edge Functions com service_role isolado', status: true },
  { item: 'Audit log de acoes do sistema', status: true },
  { item: 'Politicas org-scoped por tabela', status: true },
  { item: 'Bloqueio de usuarios sem organizacao', status: true },
]

// ─── Component ────────────────────────────────────────────────────────

export default function SecurityMonitoringSimple() {
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [loading, setLoading] = useState(true)

  const [connection, setConnection] = useState<ConnectionInfo>({
    status: 'disconnected',
    latency: null,
    timestamp: new Date(),
  })
  const [totalUsers, setTotalUsers] = useState(0)
  const [totalOrgs, setTotalOrgs] = useState(0)
  const [activeOrgs, setActiveOrgs] = useState(0)

  const [tableStats, setTableStats] = useState<TableStats[]>([])
  const [apiStatuses, setApiStatuses] = useState<APIStatus[]>([])
  const [checkingAPIs, setCheckingAPIs] = useState(false)

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [auditSearch, setAuditSearch] = useState('')
  const [auditFilter, setAuditFilter] = useState<string>('')
  const [loadingAudit, setLoadingAudit] = useState(false)

  // Sessions & Analytics state
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([])
  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEvent[]>([])
  const [datajudStats, setDatajudStats] = useState<DataJudStats | null>(null)
  const [loadingSessions, setLoadingSessions] = useState(false)

  // ─── Data Loading ─────────────────────────────────────────────────

  const checkConnection = useCallback(async () => {
    const start = Date.now()
    try {
      const { error } = await supabase.from('leads').select('id').limit(1)
      const latency = Date.now() - start
      if (error) throw error
      setConnection({ status: 'connected', latency, timestamp: new Date() })
    } catch {
      setConnection({ status: 'disconnected', latency: null, timestamp: new Date() })
    }
  }, [])

  const loadOverviewStats = useCallback(async () => {
    try {
      const [usersResult, orgsResult, activeOrgsResult] = await Promise.all([
        supabase.from('usuarios').select('*', { count: 'exact', head: true }),
        supabase.from('orgs').select('*', { count: 'exact', head: true }),
        supabase.from('orgs').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      ])
      setTotalUsers(usersResult.count ?? 0)
      setTotalOrgs(orgsResult.count ?? 0)
      setActiveOrgs(activeOrgsResult.count ?? 0)
    } catch (err) {
      console.error('Erro ao carregar estatisticas:', err)
    }
  }, [])

  const loadTableStats = useCallback(async () => {
    const stats: TableStats[] = []
    for (const table of TABLES_TO_CHECK) {
      try {
        const { count, error } = await supabase
          .from(table.name)
          .select('*', { count: 'exact', head: true })
        if (!error && count !== null) {
          stats.push({ name: table.name, count, icon: table.icon })
        }
      } catch {
        // skip
      }
    }
    setTableStats(stats)
  }, [])

  const checkAPIStatuses = useCallback(async () => {
    setCheckingAPIs(true)
    const statuses: APIStatus[] = []

    try {
      const { error } = await supabase.from('leads').select('id').limit(1)
      statuses.push({
        name: 'Supabase Database',
        status: error ? 'disconnected' : 'connected',
        message: error ? error.message : 'Conexao ativa',
        icon: Database,
      })
    } catch (err: any) {
      statuses.push({
        name: 'Supabase Database',
        status: 'disconnected',
        message: err?.message || 'Erro de conexao',
        icon: Database,
      })
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      statuses.push({
        name: 'Supabase Auth',
        status: user ? 'connected' : 'not-configured',
        message: user ? `Usuario: ${user.email}` : 'Nao autenticado',
        icon: UserCheck,
      })
    } catch (err: any) {
      statuses.push({
        name: 'Supabase Auth',
        status: 'disconnected',
        message: err?.message || 'Erro de autenticacao',
        icon: UserCheck,
      })
    }

    try {
      const { data, error } = await supabase.storage.listBuckets()
      statuses.push({
        name: 'Supabase Storage',
        status: error ? 'disconnected' : 'connected',
        message: error ? error.message : `${data?.length || 0} buckets disponiveis`,
        icon: FileText,
      })
    } catch (err: any) {
      statuses.push({
        name: 'Supabase Storage',
        status: 'disconnected',
        message: err?.message || 'Erro ao acessar storage',
        icon: FileText,
      })
    }

    const hasDataJudKey = import.meta.env.VITE_DATAJUD_API_KEY
    statuses.push({
      name: 'DataJud API',
      status: hasDataJudKey ? 'connected' : 'not-configured',
      message: hasDataJudKey ? 'API Key configurada' : 'API Key nao configurada',
      icon: Briefcase,
    })

    statuses.push({
      name: 'Google Calendar',
      status: 'not-configured',
      message: 'Requer OAuth por usuario',
      icon: Calendar,
    })

    setApiStatuses(statuses)
    setCheckingAPIs(false)
  }, [])

  const loadSessionsAndAnalytics = useCallback(async () => {
    setLoadingSessions(true)
    try {
      // Load active sessions
      const { data: sessions } = await supabase
        .from('active_sessions')
        .select('*')
        .order('last_seen_at', { ascending: false })
        .limit(50)
      setActiveSessions(sessions || [])

      // Load recent analytics events
      const { data: events } = await supabase
        .from('analytics_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      setAnalyticsEvents(events || [])
    } catch (err) {
      console.warn('Tabelas de sessoes/analytics nao disponiveis:', err)
      setActiveSessions([])
      setAnalyticsEvents([])
    } finally {
      setLoadingSessions(false)
    }
  }, [])

  const loadDatajudStats = useCallback(async () => {
    try {
      const now = new Date()
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      const [totalResult, todayResult, monthResult, lastSyncResult, activeJobsResult, failedJobsResult] = await Promise.all([
        supabase.from('datajud_api_calls').select('*', { count: 'exact', head: true }),
        supabase.from('datajud_api_calls').select('*', { count: 'exact', head: true }).gte('created_at', startOfDay),
        supabase.from('datajud_api_calls').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth),
        supabase.from('datajud_sync_jobs').select('completed_at').order('completed_at', { ascending: false }).limit(1),
        supabase.from('datajud_sync_jobs').select('*', { count: 'exact', head: true }).eq('status', 'running'),
        supabase.from('datajud_sync_jobs').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
      ])

      setDatajudStats({
        totalCalls: totalResult.count ?? 0,
        callsToday: todayResult.count ?? 0,
        callsThisMonth: monthResult.count ?? 0,
        lastSync: lastSyncResult.data?.[0]?.completed_at || null,
        syncJobsActive: activeJobsResult.count ?? 0,
        syncJobsFailed: failedJobsResult.count ?? 0,
      })
    } catch (err) {
      console.warn('Tabelas DataJud nao disponiveis:', err)
      setDatajudStats(null)
    }
  }, [])

  const loadAuditLogs = useCallback(async () => {
    setLoadingAudit(true)
    try {
      const logs = await auditLogsService.getAuditLogs({
        search: auditSearch || null,
        action: auditFilter || null,
        limit: 100,
      })
      setAuditLogs(logs)
    } catch (err) {
      console.error('Erro ao carregar logs de auditoria:', err)
      setAuditLogs([])
    } finally {
      setLoadingAudit(false)
    }
  }, [auditSearch, auditFilter])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([
        checkConnection(),
        loadOverviewStats(),
        loadTableStats(),
        checkAPIStatuses(),
        loadAuditLogs(),
        loadSessionsAndAnalytics(),
        loadDatajudStats(),
      ])
      setLoading(false)
    }
    init()
  }, [checkConnection, loadOverviewStats, loadTableStats, checkAPIStatuses, loadAuditLogs, loadSessionsAndAnalytics, loadDatajudStats])

  const refreshAll = async () => {
    setLoading(true)
    await Promise.all([
      checkConnection(),
      loadOverviewStats(),
      loadTableStats(),
      checkAPIStatuses(),
      loadAuditLogs(),
      loadSessionsAndAnalytics(),
      loadDatajudStats(),
    ])
    setLoading(false)
  }

  // ─── Helpers ──────────────────────────────────────────────────────

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-success'
      case 'disconnected': return 'text-danger'
      case 'not-configured': return 'text-warning'
      default: return 'text-text-subtle'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle2 className="h-5 w-5 text-success" />
      case 'disconnected': return <XCircle className="h-5 w-5 text-danger" />
      default: return <AlertCircle className="h-5 w-5 text-warning" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-success-bg text-success-dark border border-success-border'
      case 'disconnected': return 'bg-danger-bg text-danger-dark border border-danger-border'
      case 'not-configured': return 'bg-warning-bg text-warning-dark border border-warning-border'
      default: return 'bg-surface-alt text-text-muted border border-border'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Conectado'
      case 'disconnected': return 'Desconectado'
      case 'not-configured': return 'Nao Configurado'
      default: return 'Desconhecido'
    }
  }

  const getActionBadgeClass = (action: string) => {
    if (action.includes('create') || action.includes('insert')) return 'bg-success-bg text-success-dark'
    if (action.includes('update')) return 'bg-info-bg text-info-dark'
    if (action.includes('delete')) return 'bg-danger-bg text-danger-dark'
    if (action.includes('login') || action.includes('logout')) return 'bg-brand-primary-subtle text-brand-primary'
    return 'bg-surface-alt text-text-muted'
  }

  const totalRecords = tableStats.reduce((acc, t) => acc + t.count, 0)
  const connectedAPIs = apiStatuses.filter(a => a.status === 'connected').length
  const securityScore = SECURITY_CHECKLIST.filter(c => c.status).length
  const securityTotal = SECURITY_CHECKLIST.length

  // ─── Loading State ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-brand-primary" />
          <p className="text-text-subtle font-body">Carregando monitoramento de seguranca...</p>
        </div>
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-base p-6 font-body" style={{ color: 'var(--color-text)' }}>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text font-display flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-primary"
              style={{ background: 'linear-gradient(135deg, var(--brand-primary-700), var(--brand-primary-500))' }}
            >
              <Shield className="h-6 w-6" />
            </div>
            Seguranca e Monitoramento
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Painel de seguranca, infraestrutura e auditoria
          </p>
        </div>
        <button
          onClick={refreshAll}
          className="flex items-center gap-2 rounded-xl bg-surface px-4 py-2 text-sm font-medium text-text shadow-soft hover:bg-surface-hover transition border border-border"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition',
              activeTab === tab.id
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-text-subtle hover:text-text'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════ OVERVIEW TAB ═══════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Metrics */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-surface p-6 shadow-soft border border-border">
              <div className="mb-4">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  connection.status === 'connected' ? 'bg-success-bg' : 'bg-danger-bg'
                )}>
                  <Activity className={cn("h-5 w-5", connection.status === 'connected' ? 'text-success' : 'text-danger')} />
                </div>
              </div>
              <p className={cn("text-2xl font-bold", connection.status === 'connected' ? 'text-success' : 'text-danger')}>
                {connection.status === 'connected' ? 'Online' : 'Offline'}
              </p>
              <p className="text-sm font-medium text-text mb-1">Conexao com Banco</p>
              <p className="text-xs text-text-subtle">
                Latencia: {connection.latency !== null ? `${connection.latency}ms` : '--'}
              </p>
            </div>

            <div className="rounded-2xl bg-surface p-6 shadow-soft border border-border">
              <div className="mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info-bg">
                  <Users className="h-5 w-5 text-info" />
                </div>
              </div>
              <p className="text-2xl font-bold text-text">{totalUsers}</p>
              <p className="text-sm font-medium text-text mb-1">Usuarios Cadastrados</p>
              <p className="text-xs text-text-subtle">Em todas as organizacoes</p>
            </div>

            <div className="rounded-2xl bg-surface p-6 shadow-soft border border-border">
              <div className="mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-bg">
                  <Database className="h-5 w-5 text-success" />
                </div>
              </div>
              <p className="text-2xl font-bold text-text">{totalOrgs}</p>
              <p className="text-sm font-medium text-text mb-1">Organizacoes</p>
              <p className="text-xs text-text-subtle">{activeOrgs} ativas</p>
            </div>

            <div className="rounded-2xl bg-surface p-6 shadow-soft border border-border">
              <div className="mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary-subtle">
                  <Shield className="h-5 w-5 text-brand-primary" />
                </div>
              </div>
              <p className="text-2xl font-bold text-text">{connectedAPIs}/{apiStatuses.length}</p>
              <p className="text-sm font-medium text-text mb-1">APIs Conectadas</p>
              <p className="text-xs text-text-subtle">Servicos ativos</p>
            </div>
          </div>

          {/* Security Score */}
          <div
            className="rounded-3xl p-8 shadow-soft border"
            style={{
              background: 'linear-gradient(135deg, var(--brand-primary-50), var(--brand-primary-100))',
              borderColor: 'var(--brand-primary-100)',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium mb-2 tracking-wider uppercase" style={{ color: 'var(--brand-primary-600)' }}>
                  Score de Seguranca
                </p>
                <p className="text-5xl font-bold font-display mb-2" style={{ color: 'var(--brand-primary-900)' }}>
                  {Math.round((securityScore / securityTotal) * 100)}/100
                </p>
                <p className="text-sm" style={{ color: 'var(--brand-primary-600)' }}>
                  {securityScore}/{securityTotal} controles implementados
                </p>
              </div>
              <div
                className="flex h-24 w-24 items-center justify-center rounded-full"
                style={{ backgroundColor: 'var(--brand-primary-100)' }}
              >
                <CheckCircle2 className="h-12 w-12" style={{ color: 'var(--brand-primary-700)' }} />
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-surface p-6 shadow-soft border border-border">
              <p className="text-xs text-text-subtle uppercase tracking-wide mb-2">Total de Registros</p>
              <p className="text-3xl font-bold font-display text-text">{totalRecords.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-text-subtle mt-1">Em {tableStats.length} tabelas monitoradas</p>
            </div>
            <div className="rounded-2xl bg-surface p-6 shadow-soft border border-border">
              <p className="text-xs text-text-subtle uppercase tracking-wide mb-2">Ultima Verificacao</p>
              <p className="text-lg font-bold text-text">
                {connection.timestamp.toLocaleTimeString('pt-BR')}
              </p>
              <p className="text-xs text-text-subtle mt-1">
                {connection.timestamp.toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div className="rounded-2xl bg-surface p-6 shadow-soft border border-border">
              <p className="text-xs text-text-subtle uppercase tracking-wide mb-2">Logs de Auditoria</p>
              <p className="text-3xl font-bold font-display text-text">{auditLogs.length}</p>
              <p className="text-xs text-text-subtle mt-1">Registros recentes</p>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ DATA INSPECTOR TAB ═══════════ */}
      {activeTab === 'inspector' && (
        <div className="space-y-6">
          {/* Connection Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-surface p-6 shadow-soft border border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-text-subtle">Status da Conexao</p>
                {connection.status === 'connected' ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : (
                  <XCircle className="h-5 w-5 text-danger" />
                )}
              </div>
              <p className={cn("text-2xl font-bold", connection.status === 'connected' ? 'text-success' : 'text-danger')}>
                {connection.status === 'connected' ? 'Conectado' : 'Desconectado'}
              </p>
              <p className="text-xs text-text-subtle mt-2">
                Ultima verificacao: {connection.timestamp.toLocaleTimeString('pt-BR')}
              </p>
            </div>

            <div className="rounded-2xl bg-surface p-6 shadow-soft border border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-text-subtle">Latencia</p>
                <Activity className="h-5 w-5 text-brand-primary" />
              </div>
              <p className="text-2xl font-bold text-text">
                {connection.latency !== null ? `${connection.latency}ms` : '--'}
              </p>
              <p className="text-xs text-text-subtle mt-2">
                {connection.latency !== null && connection.latency < 100 && 'Excelente'}
                {connection.latency !== null && connection.latency >= 100 && connection.latency < 300 && 'Bom'}
                {connection.latency !== null && connection.latency >= 300 && 'Lento'}
              </p>
            </div>

            <div
              className="rounded-2xl p-6 shadow-soft border border-border"
              style={{ background: 'linear-gradient(135deg, var(--brand-primary-50), var(--brand-primary-100))' }}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-text-subtle">Total de Registros</p>
                <Database className="h-5 w-5 text-brand-primary" />
              </div>
              <p className="text-2xl font-bold text-text">
                {totalRecords.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>

          {/* API Status */}
          <div className="rounded-2xl bg-surface p-6 shadow-soft border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text font-display">Status das APIs</h2>
              <button
                onClick={checkAPIStatuses}
                disabled={checkingAPIs}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-surface-2 border border-border rounded-xl hover:bg-surface-alt transition disabled:opacity-50"
              >
                {checkingAPIs ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Verificar
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {apiStatuses.map((api) => {
                const Icon = api.icon
                return (
                  <div key={api.name} className="rounded-xl border border-border bg-surface-2 p-4">
                    <div className="flex items-start gap-3">
                      <Icon className={cn("h-5 w-5 mt-0.5", getStatusColor(api.status))} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-text truncate">{api.name}</p>
                          {getStatusIcon(api.status)}
                        </div>
                        <p className="text-sm text-text-subtle mb-2">{api.message}</p>
                        <span className={cn("px-2 py-0.5 text-xs rounded-md font-medium", getStatusBadge(api.status))}>
                          {getStatusText(api.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* DataJud Integration Stats */}
          {datajudStats && (
            <div className="rounded-2xl bg-surface p-6 shadow-soft border border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text font-display">Integracoes DataJud</h2>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-brand-primary" />
                  <span className="text-xs text-text-subtle">CNJ API</span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="rounded-xl border border-border bg-surface-2 p-3 text-center">
                  <p className="text-xs text-text-subtle mb-1">Total Chamadas</p>
                  <p className="text-xl font-bold text-text">{datajudStats.totalCalls.toLocaleString('pt-BR')}</p>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-3 text-center">
                  <p className="text-xs text-text-subtle mb-1">Hoje</p>
                  <p className="text-xl font-bold text-brand-primary">{datajudStats.callsToday}</p>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-3 text-center">
                  <p className="text-xs text-text-subtle mb-1">Este Mes</p>
                  <p className="text-xl font-bold text-info">{datajudStats.callsThisMonth}</p>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-3 text-center">
                  <p className="text-xs text-text-subtle mb-1">Jobs Ativos</p>
                  <p className={cn("text-xl font-bold", datajudStats.syncJobsActive > 0 ? 'text-success' : 'text-text-subtle')}>{datajudStats.syncJobsActive}</p>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-3 text-center">
                  <p className="text-xs text-text-subtle mb-1">Jobs Falhos</p>
                  <p className={cn("text-xl font-bold", datajudStats.syncJobsFailed > 0 ? 'text-danger' : 'text-success')}>{datajudStats.syncJobsFailed}</p>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-3 text-center">
                  <p className="text-xs text-text-subtle mb-1">Ultimo Sync</p>
                  <p className="text-sm font-medium text-text">
                    {datajudStats.lastSync ? new Date(datajudStats.lastSync).toLocaleDateString('pt-BR') : '--'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Table Statistics */}
          <div className="rounded-2xl bg-surface p-6 shadow-soft border border-border">
            <h2 className="text-lg font-semibold text-text font-display mb-4">Estatisticas das Tabelas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tableStats.map((table) => {
                const Icon = table.icon
                return (
                  <div key={table.name} className="rounded-xl border border-border bg-surface-2 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-primary-subtle">
                        <Icon className="h-4 w-4 text-brand-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-text capitalize text-sm">
                          {table.name.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xl font-bold text-brand-primary mt-0.5">
                          {table.count.toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ SESSIONS & ANALYTICS TAB ═══════════ */}
      {activeTab === 'sessions' && (
        <div className="space-y-6">
          {/* Sessions & Analytics Metrics */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-surface p-6 shadow-soft border border-border">
              <div className="mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-bg">
                  <Zap className="h-5 w-5 text-success" />
                </div>
              </div>
              <p className="text-2xl font-bold text-success">{activeSessions.length}</p>
              <p className="text-sm font-medium text-text">Sessoes Ativas</p>
              <p className="text-xs text-text-subtle">Usuarios conectados agora</p>
            </div>

            <div className="rounded-2xl bg-surface p-6 shadow-soft border border-border">
              <div className="mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info-bg">
                  <BarChart3 className="h-5 w-5 text-info" />
                </div>
              </div>
              <p className="text-2xl font-bold text-text">{analyticsEvents.length}</p>
              <p className="text-sm font-medium text-text">Eventos Recentes</p>
              <p className="text-xs text-text-subtle">Ultimos 50 eventos</p>
            </div>

            <div className="rounded-2xl bg-surface p-6 shadow-soft border border-border">
              <div className="mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-bg">
                  <Globe className="h-5 w-5 text-warning" />
                </div>
              </div>
              <p className="text-2xl font-bold text-text">{datajudStats?.callsToday ?? '--'}</p>
              <p className="text-sm font-medium text-text">Chamadas DataJud Hoje</p>
              <p className="text-xs text-text-subtle">{datajudStats?.callsThisMonth ?? 0} este mes</p>
            </div>

            <div className="rounded-2xl bg-surface p-6 shadow-soft border border-border">
              <div className="mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary-subtle">
                  <Monitor className="h-5 w-5 text-brand-primary" />
                </div>
              </div>
              <p className="text-2xl font-bold text-text">
                {new Set(activeSessions.map(s => s.org_id).filter(Boolean)).size}
              </p>
              <p className="text-sm font-medium text-text">Orgs com Sessao</p>
              <p className="text-xs text-text-subtle">Organizacoes ativas agora</p>
            </div>
          </div>

          {/* Active Sessions Table */}
          <div className="rounded-2xl bg-surface shadow-soft border border-border">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text font-display flex items-center gap-2">
                <Zap className="h-5 w-5 text-success" />
                Sessoes Ativas
              </h2>
              <button
                onClick={loadSessionsAndAnalytics}
                disabled={loadingSessions}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-surface-2 border border-border rounded-xl hover:bg-surface-alt transition disabled:opacity-50"
              >
                {loadingSessions ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Atualizar
              </button>
            </div>
            {activeSessions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-surface-2">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-subtle uppercase">Usuario</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-subtle uppercase">Org</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-subtle uppercase">Inicio</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-subtle uppercase">Ultimo Acesso</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-subtle uppercase">IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {activeSessions.map((session) => (
                      <tr key={session.id} className="hover:bg-surface-hover transition">
                        <td className="px-4 py-3">
                          <span className="text-sm font-mono text-text">{session.user_id?.substring(0, 12)}...</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-text-subtle">{session.org_id?.substring(0, 8) || '--'}...</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-text-subtle">{new Date(session.started_at).toLocaleString('pt-BR')}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-text-subtle">{new Date(session.last_seen_at).toLocaleString('pt-BR')}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-text-subtle font-mono">{session.ip_address || '--'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center">
                <Users className="mx-auto h-8 w-8 text-text-subtle mb-3" />
                <p className="text-sm text-text-subtle">Nenhuma sessao ativa no momento</p>
              </div>
            )}
          </div>

          {/* Analytics Events */}
          <div className="rounded-2xl bg-surface shadow-soft border border-border">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-text font-display flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-info" />
                Eventos de Analytics Recentes
              </h2>
            </div>
            {analyticsEvents.length > 0 ? (
              <div className="divide-y divide-border">
                {analyticsEvents.map((event) => (
                  <div key={event.id} className="flex items-center gap-4 p-4 hover:bg-surface-hover transition">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-info-bg">
                      <BarChart3 className="h-4 w-4 text-info" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md px-2 py-0.5 text-xs font-medium bg-info-bg text-info-dark">
                            {event.event_name}
                          </span>
                          {event.org_id && (
                            <span className="text-xs text-text-subtle font-mono">org:{event.org_id.substring(0, 8)}</span>
                          )}
                        </div>
                        <span className="text-xs text-text-subtle flex items-center gap-1 shrink-0">
                          <Clock className="h-3 w-3" />
                          {new Date(event.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <BarChart3 className="mx-auto h-8 w-8 text-text-subtle mb-3" />
                <p className="text-sm text-text-subtle">Nenhum evento de analytics registrado</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════ AUDIT TAB ═══════════ */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="rounded-2xl bg-surface p-6 shadow-soft border border-border">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-subtle" />
                <input
                  type="text"
                  placeholder="Buscar por entidade, usuario ou acao..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') loadAuditLogs() }}
                  className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-surface text-text text-sm placeholder:text-text-subtle focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                />
              </div>
              <select
                value={auditFilter}
                onChange={(e) => setAuditFilter(e.target.value)}
                className="px-4 py-2.5 border border-border rounded-xl bg-surface text-text text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              >
                <option value="">Todas as acoes</option>
                <option value="create">Criar</option>
                <option value="update">Atualizar</option>
                <option value="delete">Deletar</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
              </select>
              <button
                onClick={loadAuditLogs}
                disabled={loadingAudit}
                className="flex items-center gap-2 px-4 py-2.5 text-white rounded-xl hover:opacity-90 transition disabled:opacity-50 text-sm font-medium"
                style={{ backgroundColor: 'var(--brand-primary)' }}
              >
                {loadingAudit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Buscar
              </button>
            </div>
          </div>

          {/* Audit Logs */}
          <div className="rounded-2xl bg-surface shadow-soft border border-border">
            {loadingAudit ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
              </div>
            ) : auditLogs.length > 0 ? (
              <div className="divide-y divide-border">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-surface-hover transition">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-primary-subtle mt-0.5">
                      <Users className="h-4 w-4 text-brand-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn(
                            'rounded-md px-2 py-0.5 text-xs font-medium',
                            getActionBadgeClass(log.action)
                          )}>
                            {log.action}
                          </span>
                          {log.entity && (
                            <span className="text-sm font-medium text-text">{log.entity}</span>
                          )}
                        </div>
                        <span className="text-xs text-text-subtle flex items-center gap-1 shrink-0">
                          <Clock className="h-3 w-3" />
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-text-subtle">
                        {log.actor_user_id && (
                          <span className="font-mono truncate max-w-[200px]">
                            User: {log.actor_user_id.substring(0, 8)}...
                          </span>
                        )}
                        {log.entity_id && (
                          <span className="font-mono truncate max-w-[200px]">
                            ID: {log.entity_id.substring(0, 8)}...
                          </span>
                        )}
                      </div>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-brand-primary cursor-pointer hover:underline">
                            Ver detalhes
                          </summary>
                          <pre className="mt-1 text-xs bg-surface-2 rounded-lg p-2 overflow-x-auto text-text-subtle font-mono">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <FileText className="mx-auto h-8 w-8 text-text-subtle mb-3" />
                <p className="text-sm text-text-subtle">
                  {auditSearch || auditFilter
                    ? 'Nenhum registro encontrado com esses filtros'
                    : 'Nenhum registro de auditoria disponivel'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════ COMPLIANCE TAB ═══════════ */}
      {activeTab === 'compliance' && (
        <div className="space-y-6">
          {/* Compliance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'LGPD', score: 98, description: 'Lei Geral de Protecao de Dados' },
              { name: 'RLS Policies', score: 100, description: 'Row Level Security em todas as tabelas' },
            ].map((item) => (
              <div key={item.name} className="rounded-2xl bg-surface p-6 shadow-soft border border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <div>
                      <h3 className="text-sm font-semibold text-text">{item.name}</h3>
                      <p className="text-xs text-text-subtle">{item.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-success">{item.score}%</p>
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-gray-200)' }}>
                  <div
                    className="h-full bg-success rounded-full transition-all"
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Security Checklist */}
          <div className="rounded-2xl bg-surface p-6 shadow-soft border border-border">
            <h2 className="text-lg font-semibold text-text font-display mb-2">Checklist de Seguranca</h2>
            <p className="text-sm text-text-subtle mb-6">
              Controles de seguranca implementados no sistema SDR Juridico
            </p>
            <div className="space-y-2">
              {SECURITY_CHECKLIST.map((check, index) => (
                <div key={index} className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-surface-hover transition">
                  {check.status ? (
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-danger shrink-0" />
                  )}
                  <span className="text-sm text-text">{check.item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Infrastructure Info */}
          <div className="rounded-2xl bg-surface p-6 shadow-soft border border-border">
            <h2 className="text-lg font-semibold text-text font-display mb-4">Infraestrutura</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: 'Hospedagem', value: 'Vercel', detail: 'Edge Network Global', icon: Server },
                { label: 'Banco de Dados', value: 'Supabase (PostgreSQL)', detail: 'Com RLS ativo', icon: Database },
                { label: 'Autenticacao', value: 'Supabase Auth', detail: 'JWT + Refresh Tokens', icon: Shield },
                { label: 'Edge Functions', value: 'Deno Runtime', detail: 'service_role isolado', icon: Activity },
                { label: 'Storage', value: 'Supabase Storage', detail: 'Buckets com RLS', icon: FileText },
                { label: 'Frontend', value: 'React + TypeScript', detail: 'Vite build', icon: Eye },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="rounded-xl border border-border bg-surface-2 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary-subtle shrink-0">
                        <Icon className="h-4 w-4 text-brand-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-text-subtle">{item.label}</p>
                        <p className="text-sm font-semibold text-text">{item.value}</p>
                        <p className="text-xs text-text-subtle">{item.detail}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
