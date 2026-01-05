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
import { funnelStages, goals, insights, monthlyMetrics } from '@/data/mock'
import { cn } from '@/utils/cn'

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

export const IndicadoresPage = () => {
  const [params] = useSearchParams()
  const state = resolveStatus(params.get('state'))
  const pageState =
    state !== 'ready' ? state : monthlyMetrics.length === 0 ? 'empty' : 'ready'

  return (
    <div className="space-y-5">
      <header
        className="relative overflow-hidden rounded-3xl border border-border bg-white p-6 shadow-soft"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(255,255,255,0.94) 72%, rgba(255,216,232,0.22) 100%), url(${heroLight})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right center',
          backgroundSize: '520px',
          backgroundColor: 'var(--agenda-card)',
          borderColor: 'var(--agenda-border)',
          boxShadow: 'var(--agenda-shadow)',
        }}
      >
        <div className="relative z-10 space-y-2">
          <p className="text-[11px] uppercase tracking-[0.32em] text-text-subtle">
            Indicadores
          </p>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" />
            <h2 className="font-display text-2xl text-text">Gestao central</h2>
          </div>
          <p className="text-sm text-text-muted">
            Leitura consolidada do funil juridico e metas.
          </p>
        </div>
      </header>

      <PageState status={pageState} emptyTitle="Sem indicadores disponiveis">
        <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Leads x Fechamentos (mes)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[320px] pt-0">
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
                      background: '#ffffff',
                      border: '1px solid #e9ecf5',
                      color: '#23263b',
                      borderRadius: '12px',
                      boxShadow: '0 10px 30px rgba(18, 38, 63, 0.08)',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: '12px', color: '#6b7280' }}
                  />
                  <Line type="monotone" dataKey="leads" stroke="var(--color-primary)" strokeWidth={2} />
                  <Line type="monotone" dataKey="closed" stroke="var(--color-accent)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Funil de etapas</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px] pt-0">
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
                      background: '#ffffff',
                      border: '1px solid #e9ecf5',
                      color: '#23263b',
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
            <Card key={insight.id}>
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

        <Card>
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
  )
}
