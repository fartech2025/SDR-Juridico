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
import {
  agendaItems,
  casos,
  documentos,
  kpis,
  leads,
  notifications,
  timelineEvents,
} from '@/data/mock'
import { formatDateTime } from '@/utils/format'
import { cn } from '@/utils/cn'

const resolveStatus = (
  value: string | null,
): 'loading' | 'empty' | 'error' | 'ready' => {
  if (value === 'loading' || value === 'empty' || value === 'error') {
    return value
  }
  return 'ready'
}

const slaBadgeClass = (value: string) => {
  if (value === 'critico') return 'border-[#FFE1E1] bg-[#FFE1E1] text-[#9B3B3B]'
  if (value === 'atencao') return 'border-[#FDE2E2] bg-[#FDE2E2] text-[#B24B4B]'
  return 'border-[#E6F7EF] bg-[#E6F7EF] text-[#2F7A5C]'
}

const stageBadgeClass = (value: string) => {
  if (value === 'em_andamento') {
    return 'border-[#E8E4FF] bg-[#E8E4FF] text-[#5A52B5]'
  }
  if (value === 'negociacao') {
    return 'border-[#DDEBFF] bg-[#DDEBFF] text-[#2F6BFF]'
  }
  return 'border-[#EDF0F7] bg-[#EDF0F7] text-[#6B7280]'
}

const categoryBadgeClass = (value: string) => {
  const label = value.toLowerCase()
  if (label === 'juridico') {
    return 'border-[#E8E4FF] bg-[#E8E4FF] text-[#5A52B5]'
  }
  if (label === 'comercial') {
    return 'border-[#DDEBFF] bg-[#DDEBFF] text-[#2F6BFF]'
  }
  if (label === 'agenda') {
    return 'border-[#E6F7EF] bg-[#E6F7EF] text-[#2F7A5C]'
  }
  return 'border-[#EDF0F7] bg-[#EDF0F7] text-[#6B7280]'
}

export const DashboardPage = () => {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const status = resolveStatus(params.get('state'))

  const leadHot = React.useMemo(
    () =>
      leads.find((lead) => lead.heat === 'quente' && lead.status !== 'ganho') ??
      leads[0],
    [],
  )
  const docPending = React.useMemo(
    () => documentos.find((doc) => doc.status === 'pendente') ?? documentos[0],
    [],
  )
  const criticalEvents = React.useMemo(
    () =>
      [...timelineEvents]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 4),
    [],
  )
  const agendaToday = React.useMemo(() => agendaItems.slice(0, 3), [])
  const nextCase = casos[0]

  return (
    <div className="space-y-6">
      <header
        className="relative overflow-hidden rounded-2xl border border-border bg-white p-7 shadow-soft"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(255,255,255,0.94) 70%, rgba(255,216,232,0.3) 100%), url(${heroLight})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right center',
          backgroundSize: '560px',
        }}
      >
        <div className="relative z-10 space-y-2">
          <p className="text-[11px] uppercase tracking-[0.32em] text-text-subtle">
            Dashboard
          </p>
          <h2 className="font-display text-2xl text-text">Resumo executivo</h2>
          <p className="text-sm text-text-muted">
            Foco em caso critico, produtividade e agenda juridica.
          </p>
        </div>
      </header>

      <PageState status={status}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.slice(0, 4).map((item) => (
            <StatCard
              key={item.id}
              label={item.label}
              value={item.value}
              delta={item.delta}
              trend={item.trend}
              period={item.period}
            />
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[2.2fr_1fr]">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <ActionCard
                title="Lead quente aguardando retorno"
                description={`Contato pendente: ${leadHot.name} (${leadHot.area}).`}
                priority="P0"
                actionLabel="Acelerar lead"
                href="/app/leads"
              />
              <ActionCard
                title="Documento pendente de validacao"
                description={`${docPending.title} para ${docPending.cliente}.`}
                priority="P1"
                actionLabel="Validar agora"
                href="/app/documentos"
                secondaryActionLabel="Abrir dossie"
                secondaryHref={`/app/caso/${docPending.casoId ?? 'caso-1001'}`}
              />
            </div>

            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0 px-6 pt-6 pb-2">
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-warning" />
                  <CardTitle className="text-sm">Eventos criticos hoje</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    navigate(`/app/caso/${criticalEvents[0]?.casoId ?? 'caso-1001'}`)
                  }
                  className="px-0 text-primary hover:text-primary"
                >
                  Ver caso
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3 px-6 pb-6">
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
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0 px-6 pt-6 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">Proxima melhor acao</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 px-6 pb-6 text-sm text-text-muted">
                <div className="rounded-2xl border border-border bg-white px-4 py-4 shadow-[0_8px_20px_rgba(18,38,63,0.06)]">
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
                <p className="text-xs text-text-muted">
                  Atualize o dossie e registre as pendencias prioritarias.
                </p>
                <div className="flex justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/app/caso/${nextCase.id}`)}
                    className="rounded-full px-4"
                  >
                    Abrir dossie
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <NotificationCenter notifications={notifications.slice(0, 6)} />

            <Card>
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
        </div>
      </PageState>
    </div>
  )
}
