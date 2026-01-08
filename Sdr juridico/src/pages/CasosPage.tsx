import * as React from 'react'
import { ChevronDown, ChevronLeft, Filter, Search, X } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import heroLight from '@/assets/hero-light.svg'
import { PageState } from '@/components/PageState'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Caso } from '@/types/domain'
import { cn } from '@/utils/cn'
import { useCasos } from '@/hooks/useCasos'
import { useCurrentUser } from '@/hooks/useCurrentUser'

const resolveStatus = (
  value: string | null,
): 'loading' | 'empty' | 'error' | 'ready' => {
  if (value === 'loading' || value === 'empty' || value === 'error') {
    return value
  }
  return 'ready'
}

const statusLabel = (status: Caso['status']) => {
  if (status === 'suspenso') return 'Suspenso'
  if (status === 'encerrado') return 'Encerrado'
  return 'Em andamento'
}

const slaTone = (sla: Caso['slaRisk']) => {
  if (sla === 'critico') return 'bg-[#F26C6C]'
  if (sla === 'atencao') return 'bg-[#F5B361]'
  return 'bg-[#6BC5B3]'
}

const slaPercentByRisk = (sla: Caso['slaRisk']) => {
  if (sla === 'critico') return 85
  if (sla === 'atencao') return 55
  return 25
}

const areaPill = (area: Caso['area']) => {
  if (area === 'Trabalhista') {
    return 'bg-[#E8F0FF] text-[#2F6BFF] border-[#D7E2FF]'
  }
  if (area === 'Previdenciario') {
    return 'bg-[#E6F3FF] text-[#3371D8] border-[#D6E8FF]'
  }
  if (area === 'Empresarial') {
    return 'bg-[#E8F7EF] text-[#2F7A5C] border-[#D2F0E2]'
  }
  return 'bg-[#F1F3F8] text-[#6B7280] border-[#E4E8F0]'
}

const heatPill = (heat: Caso['heat']) => {
  if (heat === 'quente') {
    return 'bg-[#FDE2E2] text-[#D14949] border-[#F7CFCF]'
  }
  if (heat === 'morno') {
    return 'bg-[#FFE9C2] text-[#B88220] border-[#F5D8A0]'
  }
  return 'bg-[#E5EEFF] text-[#4C6FFF] border-[#D6E2FF]'
}

export const CasosPage = () => {
  const { casos, loading, error } = useCasos()
  const { displayName } = useCurrentUser()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const status = resolveStatus(params.get('state'))
  const [query, setQuery] = React.useState('')
  const [areaFilter, setAreaFilter] = React.useState('todos')
  const [heatFilter, setHeatFilter] = React.useState('todos')

  const filtered = React.useMemo(() => {
    const term = query.trim().toLowerCase()
    return casos.filter((caso) => {
      const matchesQuery =
        !term ||
        caso.cliente.toLowerCase().includes(term) ||
        caso.area.toLowerCase().includes(term)
      const matchesArea = areaFilter === 'todos' || caso.area === areaFilter
      const matchesHeat = heatFilter === 'todos' || caso.heat === heatFilter
      return matchesQuery && matchesArea && matchesHeat
    })
  }, [query, areaFilter, heatFilter, casos])

  const chips = [
    { id: 'chip-1', label: 'Trabalhista', tone: 'bg-[#DFF1F0] text-[#2F7A5C]' },
    { id: 'chip-2', label: 'Quente', tone: 'bg-[#FDE2E2] text-[#D14949]' },
    { id: 'chip-3', label: 'Empresarial', tone: 'bg-[#FFE9C2] text-[#B88220]' },
    { id: 'chip-4', label: 'e-mails', tone: 'bg-[#E5EEFF] text-[#4C6FFF]' },
  ]

  const baseState = loading
    ? 'loading'
    : error
      ? 'error'
      : filtered.length
        ? 'ready'
        : 'empty'
  const pageState = status !== 'ready' ? status : baseState

  return (
    <div className="space-y-6">
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
          <div className="flex items-center gap-3 text-sm text-text-muted">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white">
              <ChevronLeft className="h-4 w-4 text-text-subtle" />
            </span>
            <span>Bom dia, {displayName}</span>
          </div>
          <h2 className="font-display text-2xl text-text">Casos</h2>
        </div>
      </header>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-1 flex-wrap items-center gap-3">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar casos..."
                  className="h-11 w-full rounded-full border border-border bg-white pl-10 pr-3 text-sm text-text shadow-soft focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-11 rounded-full px-4 text-sm"
              >
                <Filter className="h-4 w-4" />
                Filtros
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white px-4 py-3 shadow-soft">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {chips.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium',
                    chip.tone,
                  )}
                >
                  {chip.label}
                  <X className="h-3 w-3 text-current/70" />
                </button>
              ))}
              <button
                type="button"
                className="ml-2 text-xs text-text-subtle hover:text-text"
                onClick={() => {
                  setQuery('')
                  setAreaFilter('todos')
                  setHeatFilter('todos')
                }}
              >
                Limpar filtros
              </button>
            </div>
            <Button
              variant="primary"
              size="sm"
              className="h-11 rounded-full bg-[#5BB9B6] px-5 text-sm font-semibold hover:brightness-95"
            >
              + Novo Caso
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="ml-auto flex items-center gap-2 text-xs text-text-subtle">
              <span>Area</span>
              <select
                value={areaFilter}
                onChange={(event) => setAreaFilter(event.target.value)}
                className="h-8 rounded-full border border-border bg-white px-3 text-xs text-text shadow-soft"
              >
                <option value="todos">Todos</option>
                {Array.from(new Set(casos.map((caso) => caso.area))).map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
              <span>Calor</span>
              <select
                value={heatFilter}
                onChange={(event) => setHeatFilter(event.target.value)}
                className="h-8 rounded-full border border-border bg-white px-3 text-xs text-text shadow-soft"
              >
                <option value="todos">Todos</option>
                {Array.from(new Set(casos.map((caso) => caso.heat))).map((heat) => (
                  <option key={heat} value={heat}>
                    {heat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <PageState
            status={pageState}
            emptyTitle="Nenhum caso encontrado"
            emptyDescription="Ajuste os filtros para localizar um caso."
          >
            <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-soft">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-surface-2 text-[11px] uppercase tracking-[0.22em] text-text-subtle">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Area juridica</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Calor</th>
                    <th className="px-4 py-3">SLA</th>
                    <th className="px-4 py-3 text-right">Acoes Rapidas</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((caso) => {
                    const percent = slaPercentByRisk(caso.slaRisk)
                    const initials = caso.cliente
                      .split(' ')
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join('')
                    return (
                      <tr
                        key={caso.id}
                        className="border-t border-border hover:bg-surface-2/70"
                        onClick={() => navigate(`/app/caso/${caso.id}`)}
                      >
                        <td className="px-4 py-3 text-xs text-text-subtle">
                          #{caso.id.replace('caso-', '')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                              {initials}
                            </div>
                            <span className="text-sm font-semibold text-text">
                              {caso.cliente}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium',
                              areaPill(caso.area),
                            )}
                          >
                            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-semibold">
                              1
                            </span>
                            {caso.area}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'text-sm',
                              caso.slaRisk === 'critico' && 'text-danger',
                            )}
                          >
                            {statusLabel(caso.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex rounded-full border px-3 py-1 text-xs font-medium',
                              heatPill(caso.heat),
                            )}
                          >
                            {caso.heat}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-28 overflow-hidden rounded-full bg-surface-2">
                              <div
                                className={cn('h-full', slaTone(caso.slaRisk))}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <span className="text-xs text-text-subtle">
                              {percent}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              navigate(`/app/caso/${caso.id}`)
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white text-text-subtle hover:text-text"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div className="flex items-center justify-between border-t border-border bg-surface-2 px-4 py-3 text-xs text-text-subtle">
                <span>
                  Mostrando {filtered.length} de {casos.length} casos
                </span>
                <div className="flex items-center gap-2">
                  {['1', '2', '4', '5'].map((page) => (
                    <button
                      key={page}
                      type="button"
                      className="h-7 w-7 rounded-lg border border-border bg-white text-xs text-text-subtle hover:text-text"
                    >
                      {page}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </PageState>
        </CardContent>
      </Card>
    </div>
  )
}
