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
import { useTheme } from '@/contexts/ThemeContext'

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
  const { theme } = useTheme()
  const isDark = theme === 'dark'
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
    <div
      className={cn(
        'min-h-screen pb-12',
        isDark ? 'bg-[#0e1116] text-slate-100' : 'bg-[#fff6e9] text-[#1d1d1f]',
      )}
    >
      <div className="space-y-6">
        <header
          className={cn(
            'relative overflow-hidden rounded-3xl border p-6 shadow-[0_28px_60px_-48px_rgba(199,98,0,0.8)]',
            isDark
              ? 'border-slate-800 bg-gradient-to-br from-[#141820] via-[#10141b] to-[#0b0f14]'
              : 'border-[#f3c988] bg-gradient-to-br from-[#ffedd5] via-[#fff3e0] to-[#f7caaa]',
          )}
        >
          <div
            className={cn(
              'absolute inset-0 bg-no-repeat bg-right bg-[length:520px]',
              isDark ? 'opacity-20' : 'opacity-80',
            )}
            style={{ backgroundImage: `url(${heroLight})` }}
          />
          <div className="relative z-10 space-y-2">
            <div className={cn('flex items-center gap-3 text-sm', isDark ? 'text-slate-300' : 'text-[#7a4a1a]')}>
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border',
                  isDark ? 'border-slate-700 bg-slate-900' : 'border-[#f0d9b8] bg-white',
                )}
              >
                <ChevronLeft className={cn('h-4 w-4', isDark ? 'text-slate-300' : 'text-[#9a5b1e]')} />
              </span>
              <span>Bom dia, {displayName}</span>
            </div>
            <h2 className={cn('font-display text-2xl', isDark ? 'text-slate-100' : 'text-[#2a1400]')}>
              Casos
            </h2>
          </div>
        </header>

        <Card
          className={cn(
            'border',
            isDark ? 'border-slate-800 bg-slate-900/70' : 'border-[#f0d9b8] bg-white/95',
          )}
        >
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-1 flex-wrap items-center gap-3">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar casos..."
                  className={cn(
                    'h-11 w-full rounded-full border pl-10 pr-3 text-sm shadow-soft focus:outline-none focus:ring-2',
                    isDark
                      ? 'border-slate-700 bg-slate-900 text-slate-100 focus:border-emerald-400 focus:ring-emerald-500/20'
                      : 'border-[#f0d9b8] bg-white text-[#2a1400] focus:border-emerald-400 focus:ring-emerald-200',
                  )}
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

          <div
            className={cn(
              'flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 shadow-soft',
              isDark ? 'border-slate-800 bg-slate-900/70' : 'border-[#f0d9b8] bg-white',
            )}
          >
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
                className={cn(
                  'ml-2 text-xs',
                  isDark ? 'text-slate-300 hover:text-slate-100' : 'text-[#7a4a1a] hover:text-[#2a1400]',
                )}
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
              className="h-11 rounded-full bg-[#1f8a4c] px-5 text-sm font-semibold text-white shadow-[0_12px_20px_-12px_rgba(31,138,76,0.8)] hover:brightness-95 dark:bg-emerald-500"
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
                className={cn(
                  'h-8 rounded-full border px-3 text-xs shadow-soft',
                  isDark
                    ? 'border-slate-700 bg-slate-900 text-slate-100'
                    : 'border-[#f0d9b8] bg-white text-[#2a1400]',
                )}
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
                className={cn(
                  'h-8 rounded-full border px-3 text-xs shadow-soft',
                  isDark
                    ? 'border-slate-700 bg-slate-900 text-slate-100'
                    : 'border-[#f0d9b8] bg-white text-[#2a1400]',
                )}
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
            <div
              className={cn(
                'overflow-hidden rounded-2xl border shadow-soft',
                isDark ? 'border-slate-800 bg-slate-900/70' : 'border-[#f0d9b8] bg-white',
              )}
            >
              <table className="w-full border-collapse text-left text-sm">
                <thead
                  className={cn(
                    'text-[11px] uppercase tracking-[0.22em]',
                    isDark ? 'bg-slate-800 text-slate-300' : 'bg-[#fff3e0] text-[#9a5b1e]',
                  )}
                >
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
                        className={cn(
                          'border-t',
                          isDark
                            ? 'border-slate-800 hover:bg-slate-800/60'
                            : 'border-[#f0d9b8] hover:bg-[#fff3e0]/60',
                        )}
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
                            className={cn(
                              'inline-flex h-8 w-8 items-center justify-center rounded-full border',
                              isDark
                                ? 'border-slate-700 bg-slate-900 text-slate-300 hover:text-slate-100'
                                : 'border-[#f0d9b8] bg-white text-[#7a4a1a] hover:text-[#2a1400]',
                            )}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div
                className={cn(
                  'flex items-center justify-between border-t px-4 py-3 text-xs',
                  isDark
                    ? 'border-slate-800 bg-slate-800 text-slate-300'
                    : 'border-[#f0d9b8] bg-[#fff3e0] text-[#9a5b1e]',
                )}
              >
                <span>
                  Mostrando {filtered.length} de {casos.length} casos
                </span>
                <div className="flex items-center gap-2">
                  {['1', '2', '4', '5'].map((page) => (
                    <button
                      key={page}
                      type="button"
                      className={cn(
                        'h-7 w-7 rounded-lg border text-xs',
                        isDark
                          ? 'border-slate-700 bg-slate-900 text-slate-300 hover:text-slate-100'
                          : 'border-[#f0d9b8] bg-white text-[#7a4a1a] hover:text-[#2a1400]',
                      )}
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
    </div>
  )
}
