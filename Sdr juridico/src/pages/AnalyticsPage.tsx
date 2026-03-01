import * as React from 'react'
import {
  AlertTriangle,
  BarChart3,
  BriefcaseBusiness,
  CircleDollarSign,
  ShieldCheck,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { UpgradeWall } from '@/components/UpgradeWall'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useOrganizationContext } from '@/contexts/OrganizationContext'
import { useClientes } from '@/hooks/useClientes'
import { useCasos } from '@/hooks/useCasos'
import { useFinanceiro } from '@/hooks/useFinanceiro'
import { useLeads } from '@/hooks/useLeads'
import { useIsFartechAdmin, useIsOrgAdmin } from '@/hooks/usePermissions'
import { usePlan } from '@/hooks/usePlan'
import { supabase } from '@/lib/supabaseClient'
import { resolveOrgScope } from '@/services/orgScope'
import { cn } from '@/utils/cn'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)

type OrgMemberAnalytics = {
  id: string
  nome: string
  role: 'gestor' | 'advogado' | 'outro'
}

export default function AnalyticsPage() {
  const navigate = useNavigate()
  const isOrgAdmin = useIsOrgAdmin()
  const isFartechAdmin = useIsFartechAdmin()
  const { canUseAnalytics } = usePlan()
  const { stats: orgStats } = useOrganizationContext()
  const isSolo = (orgStats?.total_users ?? 2) <= 1
  const [orgMembers, setOrgMembers] = React.useState<OrgMemberAnalytics[]>([])
  const [membersLoading, setMembersLoading] = React.useState(true)

  const { leads, loading: leadsLoading } = useLeads()
  const { casos, loading: casosLoading } = useCasos()
  const { clientes, loading: clientesLoading } = useClientes()
  const {
    loading: financeiroLoading,
    snapshot,
    cashflowSeries,
    carteiraMetrics,
    contasReceber,
    contasPagar,
    carteiraPorResponsavel,
  } = useFinanceiro(leads, casos)

  const loading = leadsLoading || casosLoading || financeiroLoading || clientesLoading || membersLoading
  const canViewExecutive = isOrgAdmin || isFartechAdmin

  React.useEffect(() => {
    const loadMembers = async () => {
      setMembersLoading(true)
      try {
        const { orgId } = await resolveOrgScope()
        if (!orgId) {
          setOrgMembers([])
          return
        }

        const { data: membersData, error: membersError } = await supabase
          .from('org_members')
          .select('user_id, role')
          .eq('org_id', orgId)
          .eq('ativo', true)

        if (membersError) throw membersError
        const userIds = (membersData || []).map((item) => item.user_id).filter(Boolean)
        if (userIds.length === 0) {
          setOrgMembers([])
          return
        }

        const { data: usersData, error: usersError } = await supabase
          .from('usuarios')
          .select('id, nome_completo')
          .in('id', userIds)

        if (usersError) throw usersError
        const nameMap = new Map((usersData || []).map((item) => [item.id, item.nome_completo || 'Usuario']))

        const normalized = (membersData || []).map((item) => ({
          id: item.user_id,
          nome: nameMap.get(item.user_id) || 'Usuario',
          role:
            item.role === 'advogado'
              ? ('advogado' as const)
              : item.role === 'gestor' || item.role === 'admin'
                ? ('gestor' as const)
                : ('outro' as const),
        }))
        setOrgMembers(normalized)
      } catch {
        setOrgMembers([])
      } finally {
        setMembersLoading(false)
      }
    }

    void loadMembers()
  }, [])

  // ── Operacional ────────────────────────────────────────────────────────────
  const contratosMes = React.useMemo(() => {
    const now = new Date()
    return leads.filter((lead) => {
      if (lead.status !== 'ganho') return false
      const date = new Date(lead.updatedAt || lead.createdAt)
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
    }).length
  }, [leads])

  const leadsConvertidos = React.useMemo(
    () => leads.filter((lead) => lead.status === 'ganho').length,
    [leads],
  )

  const taxaConversao = React.useMemo(
    () => (leads.length > 0 ? Math.round((leadsConvertidos / leads.length) * 100) : 0),
    [leads.length, leadsConvertidos],
  )

  const leadsEmPipeline = React.useMemo(
    () => leads.filter((l) => !['ganho', 'perdido'].includes(l.status)).length,
    [leads],
  )

  const casosPorStatus = React.useMemo(
    () => ({
      ativo:     casos.filter((c) => c.status === 'ativo').length,
      suspenso:  casos.filter((c) => c.status === 'suspenso').length,
      encerrado: casos.filter((c) => c.status === 'encerrado').length,
    }),
    [casos],
  )

  const casosCriticos = React.useMemo(
    () => casos.filter((c) => c.slaRisk === 'critico' || c.prioridade === 'critica').length,
    [casos],
  )

  const leadsHeat = React.useMemo(
    () => ({
      quente: leads.filter((l) => l.heat === 'quente').length,
      morno:  leads.filter((l) => l.heat === 'morno').length,
      frio:   leads.filter((l) => l.heat === 'frio').length,
    }),
    [leads],
  )

  const clientesSaude = React.useMemo(
    () => ({
      ok:      clientes.filter((c) => c.health === 'ok').length,
      atencao: clientes.filter((c) => c.health === 'atencao').length,
      critico: clientes.filter((c) => c.health === 'critico').length,
    }),
    [clientes],
  )

  // ── Funil de leads ─────────────────────────────────────────────────────────
  const leadsFunil = React.useMemo(
    () => [
      { etapa: 'Novo',        count: leads.filter((l) => l.status === 'novo').length },
      { etapa: 'Em contato',  count: leads.filter((l) => l.status === 'em_contato').length },
      { etapa: 'Qualificado', count: leads.filter((l) => l.status === 'qualificado').length },
      { etapa: 'Proposta',    count: leads.filter((l) => l.status === 'proposta').length },
      { etapa: 'Ganho',       count: leads.filter((l) => l.status === 'ganho').length },
      { etapa: 'Perdido',     count: leads.filter((l) => l.status === 'perdido').length },
    ],
    [leads],
  )

  // ── Área jurídica ──────────────────────────────────────────────────────────
  const areaPortfolio = React.useMemo(() => {
    const grouped = new Map<string, number>()
    casos.forEach((caso) => {
      const current = grouped.get(caso.area) || 0
      grouped.set(caso.area, current + (caso.value || 0))
    })
    return [...grouped.entries()]
      .map(([area, valor]) => ({ area, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 6)
  }, [casos])

  // ── Equipe ─────────────────────────────────────────────────────────────────
  const teamStats = React.useMemo(() => ({
    usuariosAtivos: orgMembers.length,
    gestores:  orgMembers.filter((m) => m.role === 'gestor').length,
    advogados: orgMembers.filter((m) => m.role === 'advogado').length,
  }), [orgMembers])

  const performanceEquipe = React.useMemo(() => {
    return orgMembers
      .map((member) => {
        const leadsDoResponsavel = leads.filter(
          (lead) => lead.owner === member.id || lead.owner === member.nome,
        )
        const convertidos = leadsDoResponsavel.filter((lead) => lead.status === 'ganho').length
        const casosAtivos = casos.filter(
          (caso) =>
            caso.status === 'ativo' &&
            (caso.responsavel === member.nome || caso.responsavel === member.id),
        ).length
        const financeiro = carteiraPorResponsavel.find(
          (item) => item.id === member.id || item.nome === member.nome,
        )
        const taxaConv = leadsDoResponsavel.length > 0
          ? Math.round((convertidos / leadsDoResponsavel.length) * 100)
          : 0
        return {
          nome: member.nome,
          role: member.role,
          leads: leadsDoResponsavel.length,
          convertidos,
          taxaConv,
          casosAtivos,
          saldoFinanceiro: financeiro?.saldo || 0,
        }
      })
      .sort((a, b) => b.convertidos - a.convertidos)
      .slice(0, 10)
  }, [orgMembers, leads, casos, carteiraPorResponsavel])

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-28 rounded-2xl" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!canViewExecutive) {
    return (
      <div className="p-6">
        <Card className="border-border bg-surface/90">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4" />
              Acesso restrito
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-text-muted">
            <p>Este painel é destinado a administradores e gestores para leitura executiva do escritório.</p>
            <Button variant="primary" onClick={() => navigate('/app/dashboard')}>Voltar para o dashboard</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!canUseAnalytics) {
    return <UpgradeWall feature="Analytics Executivo" minPlan="Profissional" />
  }

  return (
    <div className="space-y-6 p-6">

      {/* ── HEADER ───────────────────────────────────────────────────────────── */}
      <header className="rounded-2xl border border-border bg-surface p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-text-subtle">Analytics Executivo</p>
        <h1 className="mt-2 text-3xl font-bold text-text">Visão global do negócio</h1>
        <p className="mt-1 text-sm text-text-muted">
          Panorama completo do escritório — operacional, financeiro e desempenho da equipe em uma leitura única.
        </p>
      </header>

      {/* ── ROW 1 — KPI OPERACIONAL ──────────────────────────────────────────── */}
      <div>
        <p className="mb-3 text-xs uppercase tracking-wide text-text-subtle">Operacional</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {/* Casos ativos */}
          <Card className="border-border bg-surface/90">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Casos ativos</CardTitle>
              <BriefcaseBusiness className="h-4 w-4 text-text-subtle" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-text">{casosPorStatus.ativo}</p>
              <div className="mt-1 flex items-center gap-2">
                {casosCriticos > 0 ? (
                  <span className="flex items-center gap-1 text-xs text-red-600">
                    <AlertTriangle className="h-3 w-3" />
                    {casosCriticos} em risco
                  </span>
                ) : (
                  <span className="text-xs text-text-subtle">
                    {casosPorStatus.suspenso} suspensos · {casosPorStatus.encerrado} encerrados
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Leads em pipeline */}
          <Card className="border-border bg-surface/90">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Leads em pipeline</CardTitle>
              <Target className="h-4 w-4 text-text-subtle" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-text">{leadsEmPipeline}</p>
              <p className="mt-1 text-xs text-text-subtle">
                Conversão geral: {taxaConversao}% · {leadsConvertidos} ganhos
              </p>
            </CardContent>
          </Card>

          {/* Contratos fechados no mês */}
          <Card className="border-border bg-surface/90">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Contratos fechados (mês)</CardTitle>
              <Target className="h-4 w-4" style={{ color: '#721011' }} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-text">{contratosMes}</p>
              <p className="mt-1 text-xs text-text-subtle">
                {carteiraMetrics.ticketMedio > 0
                  ? `Ticket médio: ${formatCurrency(carteiraMetrics.ticketMedio)}`
                  : 'Ganhos no mês corrente'}
              </p>
            </CardContent>
          </Card>

          {/* Clientes */}
          <Card className="border-border bg-surface/90">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Clientes</CardTitle>
              <Users className="h-4 w-4 text-text-subtle" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-text">{clientesSaude.ok + clientesSaude.atencao}</p>
              <div className="mt-1 flex items-center gap-2">
                {clientesSaude.critico > 0 ? (
                  <span className="flex items-center gap-1 text-xs text-red-600">
                    <AlertTriangle className="h-3 w-3" />
                    {clientesSaude.critico} em risco
                  </span>
                ) : (
                  <span className="text-xs text-text-subtle">{clientes.length} total cadastrados</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── ROW 2 — KPI FINANCEIRO ───────────────────────────────────────────── */}
      <div>
        <p className="mb-3 text-xs uppercase tracking-wide text-text-subtle">Financeiro — mês atual</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {/* Receita */}
          <Card className="border-border bg-surface/90">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Receita realizada</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(snapshot.receitaRealizadaMes)}</p>
              <p className="mt-1 text-xs text-text-subtle">
                Carteira ativa: {formatCurrency(carteiraMetrics.carteiraAtiva)}
              </p>
            </CardContent>
          </Card>

          {/* Despesa */}
          <Card className="border-border bg-surface/90">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Despesa realizada</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-700">{formatCurrency(snapshot.despesaRealizadaMes)}</p>
              <p className="mt-1 text-xs text-text-subtle">
                Pipeline: {formatCurrency(carteiraMetrics.pipeline)}
              </p>
            </CardContent>
          </Card>

          {/* Resultado */}
          <Card className={cn('border-border bg-surface/90', snapshot.resultadoMes >= 0 ? 'border-green-100' : 'border-red-100')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Resultado operacional</CardTitle>
              <BarChart3 className="h-4 w-4" style={{ color: '#721011' }} />
            </CardHeader>
            <CardContent>
              <p className={cn('text-2xl font-bold', snapshot.resultadoMes >= 0 ? 'text-green-700' : 'text-red-700')}>
                {formatCurrency(snapshot.resultadoMes)}
              </p>
              <p className="mt-1 text-xs text-text-subtle">Margem {snapshot.margemOperacional}%</p>
            </CardContent>
          </Card>

          {/* Inadimplência */}
          <Card className={cn('border-border bg-surface/90', snapshot.inadimplencia > 20 ? 'border-amber-200' : '')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Inadimplência</CardTitle>
              {snapshot.inadimplencia > 20
                ? <AlertTriangle className="h-4 w-4 text-amber-600" />
                : <Wallet className="h-4 w-4" style={{ color: '#721011' }} />
              }
            </CardHeader>
            <CardContent>
              <p className={cn('text-2xl font-bold', snapshot.inadimplencia > 20 ? 'text-amber-700' : 'text-text')}>
                {snapshot.inadimplencia}%
              </p>
              <p className="mt-1 text-xs text-text-subtle">
                {formatCurrency(snapshot.receitasAtrasadas)} em atraso
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── FUNIL DE LEADS ───────────────────────────────────────────────────── */}
      <Card className="border-border bg-surface/90">
        <CardHeader>
          <CardTitle className="text-base">Funil de Leads</CardTitle>
          <p className="text-xs text-text-subtle">{leads.length} leads no total · {leadsConvertidos} convertidos · {leads.filter(l => l.status === 'perdido').length} perdidos</p>
        </CardHeader>
        <CardContent className="h-64 pt-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={leadsFunil} layout="vertical" margin={{ left: 8, right: 24 }}>
              <CartesianGrid stroke="var(--color-border-soft)" strokeDasharray="4 6" horizontal={false} />
              <XAxis type="number" tickLine={false} axisLine={false} stroke="var(--color-text-subtle)" />
              <YAxis dataKey="etapa" type="category" tickLine={false} axisLine={false} stroke="var(--color-text-subtle)" width={88} />
              <Tooltip formatter={(value: number) => [`${value} leads`, 'Quantidade']} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                {leadsFunil.map((entry, index) => {
                  const colors: Record<string, string> = {
                    Ganho:        '#2E7D32',
                    Proposta:     '#721011',
                    Qualificado:  '#8A1314',
                    'Em contato': '#A66029',
                    Novo:         '#C3BFB9',
                    Perdido:      '#E2E0DC',
                  }
                  return <Cell key={index} fill={colors[entry.etapa] || '#721011'} />
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── SAÚDE OPERACIONAL ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Casos por status */}
        <Card className="border-border bg-surface/90">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Casos por status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            <div className="flex items-center justify-between rounded-lg bg-surface-alt px-3 py-2">
              <span className="text-xs text-text-subtle">Ativos</span>
              <span className="text-sm font-semibold text-text">{casosPorStatus.ativo}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-surface-alt px-3 py-2">
              <span className="text-xs text-text-subtle">Suspensos</span>
              <span className="text-sm font-semibold text-text">{casosPorStatus.suspenso}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-surface-alt px-3 py-2">
              <span className="text-xs text-text-subtle">Encerrados</span>
              <span className="text-sm font-semibold text-text">{casosPorStatus.encerrado}</span>
            </div>
          </CardContent>
        </Card>

        {/* Casos em risco de SLA */}
        <Card className={cn('border-border bg-surface/90', casosCriticos > 0 ? 'border-red-200' : '')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Casos em risco (SLA)</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-3">
              {casosCriticos > 0 ? (
                <AlertTriangle className="h-8 w-8 text-red-600" />
              ) : (
                <ShieldCheck className="h-8 w-8 text-green-600" />
              )}
              <div>
                <p className={cn('text-3xl font-bold', casosCriticos > 0 ? 'text-red-700' : 'text-green-700')}>
                  {casosCriticos}
                </p>
                <p className="text-xs text-text-subtle">
                  {casosCriticos === 0 ? 'Todos dentro do prazo' : 'casos com SLA crítico ou prioridade crítica'}
                </p>
              </div>
            </div>
            <Badge
              className="mt-3"
              variant={casosCriticos === 0 ? 'success' : casosCriticos <= 3 ? 'warning' : 'danger'}
            >
              {casosCriticos === 0 ? 'Saudável' : casosCriticos <= 3 ? 'Atenção' : 'Crítico'}
            </Badge>
          </CardContent>
        </Card>

        {/* Leads por temperatura */}
        <Card className="border-border bg-surface/90">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Leads por temperatura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            <div className="flex items-center justify-between rounded-lg bg-surface-alt px-3 py-2">
              <span className="flex items-center gap-2 text-xs text-text-subtle">
                <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                Quente
              </span>
              <span className="text-sm font-semibold text-text">{leadsHeat.quente}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-surface-alt px-3 py-2">
              <span className="flex items-center gap-2 text-xs text-text-subtle">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
                Morno
              </span>
              <span className="text-sm font-semibold text-text">{leadsHeat.morno}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-surface-alt px-3 py-2">
              <span className="flex items-center gap-2 text-xs text-text-subtle">
                <span className="inline-block h-2 w-2 rounded-full bg-gray-400" />
                Frio
              </span>
              <span className="text-sm font-semibold text-text">{leadsHeat.frio}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── FLUXO DE CAIXA + RISCO FINANCEIRO ───────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
        <Card className="border-border bg-surface/90">
          <CardHeader>
            <CardTitle className="text-base">Receita × Despesa × Saldo (6 meses)</CardTitle>
          </CardHeader>
          <CardContent className="h-80 pt-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cashflowSeries}>
                <CartesianGrid stroke="var(--color-border-soft)" strokeDasharray="4 6" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} stroke="var(--color-text-subtle)" />
                <YAxis tickLine={false} axisLine={false} stroke="var(--color-text-subtle)" />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend iconType="circle" />
                <Line type="monotone" dataKey="receita" stroke="#2E7D32" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="despesa" stroke="#721011" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="saldo" stroke="#5B4FCF" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border bg-surface/90">
          <CardHeader>
            <CardTitle className="text-base">Risco financeiro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="rounded-lg bg-surface-alt p-3">
              <p className="text-xs text-text-subtle">Contas a receber</p>
              <p className="text-lg font-semibold text-text">{formatCurrency(snapshot.contasReceber)}</p>
              <p className="text-xs text-text-muted">{contasReceber.length} títulos pendentes</p>
            </div>
            <div className="rounded-lg bg-surface-alt p-3">
              <p className="text-xs text-text-subtle">Contas a pagar</p>
              <p className="text-lg font-semibold text-text">{formatCurrency(snapshot.contasPagar)}</p>
              <p className="text-xs text-text-muted">{contasPagar.length} títulos pendentes</p>
            </div>
            <div className="rounded-lg bg-surface-alt p-3">
              <p className="text-xs text-text-subtle">Inadimplência</p>
              <p className="text-lg font-semibold text-text">{snapshot.inadimplencia}%</p>
              <p className="text-xs text-text-muted">{formatCurrency(snapshot.receitasAtrasadas)} em atraso</p>
            </div>
            <div className="rounded-lg bg-surface-alt p-3">
              <p className="text-xs text-text-subtle">Status da margem</p>
              <Badge variant={snapshot.margemOperacional >= 25 ? 'success' : snapshot.margemOperacional >= 10 ? 'warning' : 'danger'}>
                {snapshot.margemOperacional >= 25 ? 'Saudável' : snapshot.margemOperacional >= 10 ? 'Atenção' : 'Crítico'}
              </Badge>
            </div>
            <Button variant="primary" className="w-full" onClick={() => navigate('/app/financeiro')}>
              Abrir módulo financeiro
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ── CARTEIRA POR ÁREA + PENDÊNCIAS ──────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
        <Card className="border-border bg-surface/90">
          <CardHeader>
            <CardTitle className="text-base">Carteira por área jurídica</CardTitle>
            <p className="text-xs text-text-subtle">Valor consolidado de casos ativos por especialidade</p>
          </CardHeader>
          <CardContent className="h-80 pt-0">
            {areaPortfolio.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-text-muted">Nenhum caso com valor cadastrado.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={areaPortfolio} layout="vertical" margin={{ left: 12 }}>
                  <CartesianGrid stroke="var(--color-border-soft)" strokeDasharray="4 6" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} stroke="var(--color-text-subtle)" tickFormatter={(v) => formatCurrency(v)} />
                  <YAxis dataKey="area" type="category" tickLine={false} axisLine={false} stroke="var(--color-text-subtle)" width={110} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="valor" fill="#721011" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-surface/90">
          <CardHeader>
            <CardTitle className="text-base">Pendências financeiras</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            <div className="rounded-lg border border-border px-3 py-3">
              <p className="text-xs text-text-subtle">Títulos a receber</p>
              <p className="text-2xl font-bold text-text">{contasReceber.length}</p>
              <p className="text-xs text-text-muted">{formatCurrency(snapshot.contasReceber)} no total</p>
            </div>
            <div className="rounded-lg border border-border px-3 py-3">
              <p className="text-xs text-text-subtle">Títulos a pagar</p>
              <p className="text-2xl font-bold text-text">{contasPagar.length}</p>
              <p className="text-xs text-text-muted">{formatCurrency(snapshot.contasPagar)} no total</p>
            </div>
            <div className="rounded-lg border border-border px-3 py-3">
              <p className="text-xs text-text-subtle">Equipe</p>
              <p className="text-lg font-semibold text-text">{teamStats.usuariosAtivos} usuários</p>
              <p className="text-xs text-text-muted">
                {teamStats.gestores} gestores · {teamStats.advogados} advogados
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── DESEMPENHO DA EQUIPE (oculto para advogado solo) ────────────────── */}
      {!isSolo && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
          <Card className="border-border bg-surface/90">
            <CardHeader>
              <CardTitle className="text-base">Desempenho por colaborador</CardTitle>
              <p className="text-xs text-text-subtle">Leads convertidos e casos ativos por membro da equipe</p>
            </CardHeader>
            <CardContent className="h-80 pt-0">
              {performanceEquipe.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-text-muted">Sem dados de desempenho.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceEquipe} margin={{ left: 12, bottom: 32 }}>
                    <CartesianGrid stroke="var(--color-border-soft)" strokeDasharray="4 6" />
                    <XAxis
                      dataKey="nome"
                      tickLine={false}
                      axisLine={false}
                      stroke="var(--color-text-subtle)"
                      tick={{ fontSize: 11 }}
                      angle={-30}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis tickLine={false} axisLine={false} stroke="var(--color-text-subtle)" />
                    <Tooltip />
                    <Legend iconType="circle" />
                    <Bar dataKey="convertidos" name="Leads convertidos" fill="#2E7D32" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="casosAtivos" name="Casos ativos" fill="#5B4FCF" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-surface/90">
            <CardHeader>
              <CardTitle className="text-base">Ranking do time</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {performanceEquipe.length === 0 ? (
                <p className="text-sm text-text-muted">Sem dados de desempenho por usuário.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="pb-2 text-left font-medium text-text-subtle">Nome</th>
                        <th className="pb-2 text-right font-medium text-text-subtle">Conv.</th>
                        <th className="pb-2 text-right font-medium text-text-subtle">Taxa</th>
                        <th className="pb-2 text-right font-medium text-text-subtle">Casos</th>
                        <th className="pb-2 text-right font-medium text-text-subtle">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {performanceEquipe.map((item, index) => (
                        <tr key={item.nome} className="group">
                          <td className="py-2 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-text-subtle">{index + 1}.</span>
                              <div>
                                <p className="font-medium text-text leading-tight">{item.nome}</p>
                                <Badge
                                  variant={item.role === 'gestor' ? 'warning' : 'info'}
                                  className="text-[10px]"
                                >
                                  {item.role}
                                </Badge>
                              </div>
                            </div>
                          </td>
                          <td className="py-2 text-right font-semibold text-text">{item.convertidos}</td>
                          <td className="py-2 text-right text-text-subtle">{item.taxaConv}%</td>
                          <td className="py-2 text-right text-text-subtle">{item.casosAtivos}</td>
                          <td className={cn('py-2 text-right font-medium', item.saldoFinanceiro >= 0 ? 'text-green-700' : 'text-red-700')}>
                            {formatCurrency(item.saldoFinanceiro)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  )
}
