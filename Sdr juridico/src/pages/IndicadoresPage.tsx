import * as React from 'react'
import { TrendingUp } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { PageState } from '@/components/PageState'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import heroLight from '@/assets/hero-light.svg'
import { cn } from '@/utils/cn'
import { useLeads } from '@/hooks/useLeads'
import { useCasos } from '@/hooks/useCasos'
import type { FunnelStage, Goal, Insight, MonthlyMetric } from '@/types/domain'

const resolveStatus = (
  value: string | null,
): 'loading' | 'empty' | 'error' | 'ready' => {
  if (value === 'loading' || value === 'empty' || value === 'error') {
    return value
  }
  return 'ready'
}

const trendVariant = (
  trend: string,
): 'success' | 'danger' | 'info' => {
  if (trend === 'up') return 'success'
  if (trend === 'down') return 'danger'
  return 'info'
}

const monthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const toMonthKey = (value: Date) => `${value.getFullYear()}-${value.getMonth()}`

const buildMonthlyMetrics = (dates: string[]): MonthlyMetric[] => {
  const now = new Date()
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now)
    date.setMonth(date.getMonth() - (5 - index))
    return date
  })

  const counts = new Map<string, number>()
  dates.forEach((item) => {
    const date = new Date(item)
    const key = toMonthKey(date)
    counts.set(key, (counts.get(key) || 0) + 1)
  })

  return months.map((date) => {
    const key = toMonthKey(date)
    return {
      month: monthLabels[date.getMonth()],
      leads: counts.get(key) || 0,
      closed: 0,
    }
  })
}

export const IndicadoresPage = () => {
  const [params] = useSearchParams()
  const state = resolveStatus(params.get('state'))
  const { leads, loading: leadsLoading, error: leadsError } = useLeads()
  const { casos, loading: casosLoading, error: casosError } = useCasos()

  const monthlyMetrics = React.useMemo(() => {
    const createdDates = leads.map((lead) => lead.createdAt)
    const metrics = buildMonthlyMetrics(createdDates)
    const closedCounts = new Map<string, number>()
    leads
      .filter((lead) => lead.status === 'ganho')
      .forEach((lead) => {
        const date = new Date(lead.createdAt)
        const key = toMonthKey(date)
        closedCounts.set(key, (closedCounts.get(key) || 0) + 1)
      })
    return metrics.map((metric, index) => {
      const monthDate = new Date()
      monthDate.setMonth(monthDate.getMonth() - (5 - index))
      const key = toMonthKey(monthDate)
      return { ...metric, closed: closedCounts.get(key) || 0 }
    })
  }, [leads])

  const funnelStages = React.useMemo((): FunnelStage[] => {
    const stages: Array<{ label: string; status: string }> = [
      { label: 'Captacao', status: 'novo' },
      { label: 'Triagem', status: 'em_contato' },
      { label: 'Qualificacao', status: 'qualificado' },
      { label: 'Proposta', status: 'proposta' },
      { label: 'Fechamento', status: 'ganho' },
    ]
    return stages.map((stage, index) => ({
      id: `fn-${index + 1}`,
      label: stage.label,
      value: leads.filter((lead) => lead.status === stage.status).length,
    }))
  }, [leads])

  const insights = React.useMemo((): Insight[] => {
    const totalLeads = leads.length
    const qualificados = leads.filter((lead) => lead.status === 'qualificado').length
    const convertidos = leads.filter((lead) => lead.status === 'ganho').length
    const conversao = totalLeads ? Math.round((convertidos / totalLeads) * 100) : 0
    const casosAtivos = casos.filter((caso) => caso.status === 'ativo').length

    return [
      {
        id: 'ins-1',
        title: 'Leads qualificados',
        description: `${qualificados} leads em fase de qualificacao.`,
        trend: qualificados > 0 ? 'up' : 'flat',
        value: `${qualificados}`,
      },
      {
        id: 'ins-2',
        title: 'Taxa de conversao',
        description: `Conversao atual em ${conversao}%.`,
        trend: conversao >= 30 ? 'up' : 'down',
        value: `${conversao}%`,
      },
      {
        id: 'ins-3',
        title: 'Casos ativos',
        description: `${casosAtivos} casos em andamento na operacao.`,
        trend: casosAtivos > 0 ? 'up' : 'flat',
        value: `${casosAtivos}`,
      },
    ]
  }, [casos, leads])

  const goals = React.useMemo((): Goal[] => {
    const leadQualificados = leads.filter((lead) => lead.status === 'qualificado').length
    const contratos = leads.filter((lead) => lead.status === 'ganho').length
    const casosEmDia = casos.filter((caso) => caso.slaRisk !== 'critico').length
    const casosTotal = casos.length || 1
    const slaPercent = Math.round((casosEmDia / casosTotal) * 100)

    return [
      { id: 'goal-1', label: 'Leads qualificados', progress: leadQualificados, target: 60 },
      { id: 'goal-2', label: 'Contratos assinados', progress: contratos, target: 25 },
      { id: 'goal-3', label: 'SLA em dia', progress: slaPercent, target: 95, unit: '%' },
    ]
  }, [casos, leads])

  const baseState =
    leadsLoading || casosLoading
      ? 'loading'
      : leadsError || casosError
        ? 'error'
        : leads.length === 0
          ? 'empty'
          : 'ready'
  const pageState = state !== 'ready' ? state : baseState

  return (
    <div
      className={cn(
        'min-h-screen',
        'bg-base text-text',
      )}
      style={{ padding: '20px' }}
    >
      <div className="space-y-5">
        <header
          className={cn(
            'relative overflow-hidden rounded-3xl border p-6 shadow-[0_28px_60px_-48px_rgba(15,23,42,0.35)]','border-border bg-linear-to-br from-brand-primary-subtle via-surface to-surface-alt',
          )}
        >
          <div
            className={cn(
              'absolute inset-0 bg-no-repeat bg-right bg-size-[520px]',
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
              Indicadores
            </p>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" />
              <h2 className={cn('font-display text-2xl', 'text-text')}>
                Gestao central
              </h2>
            </div>
            <p className={cn('text-sm', 'text-text-muted')}>
              Leitura consolidada do funil juridico e metas.
            </p>
          </div>
        </header>

      <PageState status={pageState} emptyTitle="Sem indicadores disponiveis">
        <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
          <Card
            className={cn(
              'border',
              'border-border bg-surface/90',
            )}
          >
            <CardHeader>
              <CardTitle className="text-base">
                Leads x Fechamentos (mes)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-80 pt-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyMetrics}>
                  <CartesianGrid stroke="var(--color-border-soft)" strokeDasharray="4 6" />
                  <XAxis
                    dataKey="month"
                    stroke="var(--color-text-subtle)"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--color-text-subtle)"
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                      borderRadius: '12px',
                      boxShadow: '0 10px 30px rgba(18, 38, 63, 0.08)',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: '12px', color: 'var(--color-text-muted)' }}
                  />
                  <Line type="monotone" dataKey="leads" stroke="var(--color-primary)" strokeWidth={2} />
                  <Line type="monotone" dataKey="closed" stroke="var(--color-accent)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card
            className={cn(
              'border',
              'border-border bg-surface/90',
            )}
          >
            <CardHeader>
              <CardTitle className="text-base">Funil de etapas</CardTitle>
            </CardHeader>
            <CardContent className="h-80 pt-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelStages} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid stroke="var(--color-border-soft)" strokeDasharray="4 6" />
                  <XAxis
                    type="number"
                    stroke="var(--color-text-subtle)"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    dataKey="label"
                    type="category"
                    stroke="var(--color-text-subtle)"
                    width={90}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                      borderRadius: '12px',
                      boxShadow: '0 10px 30px rgba(18, 38, 63, 0.08)',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="value" fill="var(--color-primary)" radius={[8, 8, 8, 8]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {insights.map((insight) => (
            <Card
              key={insight.id}
              className={cn(
                'border',
                'border-border bg-surface/90',
              )}
            >
              <CardHeader className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">{insight.title}</CardTitle>
                <Badge variant={trendVariant(insight.trend)}>{insight.value}</Badge>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-text-muted">
                {insight.description}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card
          className={cn(
            'border',
            'border-border bg-surface/90',
          )}
        >
          <CardHeader>
            <CardTitle className="text-base">Metas da operacao</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-text-muted">
            {goals.map((goal) => {
              const progressValue = goal.progress / goal.target
              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-text-subtle">
                    <span>{goal.label}</span>
                    <span>
                      {goal.progress}
                      {goal.unit ?? ''} / {goal.target}
                      {goal.unit ?? ''}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-2">
                    <div
                      className={cn('h-full rounded-full bg-primary')}
                      style={{ width: `${Math.min(progressValue * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </PageState>
      </div>
    </div>
  )
}
