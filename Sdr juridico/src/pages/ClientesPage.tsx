import * as React from 'react'
import { Search } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

import { PageState } from '@/components/PageState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import heroLight from '@/assets/hero-light.svg'
import type { Cliente } from '@/types/domain'
import { cn } from '@/utils/cn'
import { formatDateTime } from '@/utils/format'
import { useClientes } from '@/hooks/useClientes'
import { useTheme } from '@/contexts/ThemeContext'

const resolveStatus = (
  value: string | null,
): 'loading' | 'empty' | 'error' | 'ready' => {
  if (value === 'loading' || value === 'empty' || value === 'error') {
    return value
  }
  return 'ready'
}

const statusPill = (status: Cliente['status']) => {
  if (status === 'inativo') {
    return 'border-[#E2E8F0] bg-[#EEF2F7] text-[#475569]'
  }
  if (status === 'em_risco') {
    return 'border-[#F5C2C2] bg-[#FFE1E1] text-[#B42318]'
  }
  return 'border-[#CFEBD8] bg-[#E8F7EE] text-[#167A3D]'
}

const healthPill = (health: Cliente['health']) => {
  if (health === 'critico') {
    return 'border-[#F5C2C2] bg-[#FFE1E1] text-[#B42318]'
  }
  if (health === 'atencao') {
    return 'border-[#F1D28A] bg-[#FFF1CC] text-[#8A5A00]'
  }
  return 'border-[#CFEBD8] bg-[#E8F7EE] text-[#167A3D]'
}

export const ClientesPage = () => {
  const { clientes, loading, error } = useClientes()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [params] = useSearchParams()
  const [query, setQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('todos')
  const [healthFilter, setHealthFilter] = React.useState('todos')
  const [areaFilter, setAreaFilter] = React.useState('todos')
  const [ownerFilter, setOwnerFilter] = React.useState('todos')
  const [activeTab, setActiveTab] = React.useState('Todos')

  const tabs = [
    'Todos',
    'Docs',
    'Agenda',
    'Comercial',
    'Juridico',
    'Automacao',
  ]

  const filters = React.useMemo(
    () => ({
      status: Array.from(new Set(clientes.map((cliente) => cliente.status))),
      health: Array.from(new Set(clientes.map((cliente) => cliente.health))),
      area: Array.from(new Set(clientes.map((cliente) => cliente.area))),
      owner: Array.from(new Set(clientes.map((cliente) => cliente.owner))),
    }),
    [clientes],
  )

  const filteredClientes = React.useMemo(() => {
    const term = query.trim().toLowerCase()
    return clientes.filter((cliente) => {
      const matchesQuery = !term || cliente.name.toLowerCase().includes(term)
      const matchesStatus =
        statusFilter === 'todos' || cliente.status === statusFilter
      const matchesHealth =
        healthFilter === 'todos' || cliente.health === healthFilter
      const matchesArea = areaFilter === 'todos' || cliente.area === areaFilter
      const matchesOwner =
        ownerFilter === 'todos' || cliente.owner === ownerFilter
      return (
        matchesQuery && matchesStatus && matchesHealth && matchesArea && matchesOwner
      )
    })
  }, [query, statusFilter, healthFilter, areaFilter, ownerFilter, clientes])

  const forcedState = resolveStatus(params.get('state'))
  const baseState = loading
    ? 'loading'
    : error
      ? 'error'
      : filteredClientes.length === 0
        ? 'empty'
        : 'ready'
  const pageState = forcedState !== 'ready' ? forcedState : baseState

  const resetFilters = () => {
    setQuery('')
    setStatusFilter('todos')
    setHealthFilter('todos')
    setAreaFilter('todos')
    setOwnerFilter('todos')
  }

  return (
    <div
      className={cn(
        'min-h-screen pb-12',
        isDark ? 'bg-[#0e1116] text-slate-100' : 'bg-[#fff6e9] text-[#1d1d1f]',
      )}
    >
      <div className="space-y-5">
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
            <p
              className={cn(
                'text-xs uppercase tracking-[0.3em]',
                isDark ? 'text-emerald-200' : 'text-[#9a5b1e]',
              )}
            >
              Clientes
            </p>
            <h2 className={cn('font-display text-2xl', isDark ? 'text-slate-100' : 'text-[#2a1400]')}>
              Carteira ativa
            </h2>
            <p className={cn('text-sm', isDark ? 'text-slate-300' : 'text-[#7a4a1a]')}>
              Carteira ativa com indicadores de risco e status.
            </p>
          </div>
        </header>

        <Card
          className={cn(
            'border',
            isDark ? 'border-slate-800 bg-slate-900/70' : 'border-[#f0d9b8] bg-white/95',
          )}
        >
        <CardHeader className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Registros ativos</CardTitle>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-text-subtle">
                <span>Total: {clientes.length}</span>
                <span>Exibindo: {filteredClientes.length}</span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="h-10 rounded-full px-4">
              Gerenciar carteira
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'rounded-full border px-4 py-1.5 text-xs font-medium transition',
                  activeTab === tab
                    ? isDark
                      ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300'
                      : 'border-emerald-500/60 bg-emerald-500/10 text-emerald-600'
                    : isDark
                      ? 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
                      : 'border-[#f0d9b8] bg-white text-[#7a4a1a] hover:bg-[#fff3e0] hover:text-[#2a1400]',
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="grid gap-3 lg:grid-cols-[2fr_repeat(4,1fr)_auto]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
              <input
                className={cn(
                  'h-11 w-full rounded-full border pl-11 pr-4 text-sm shadow-soft focus:outline-none focus:ring-2',
                  isDark
                    ? 'border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-emerald-500/20'
                    : 'border-[#f0d9b8] bg-[#fff3e0] text-[#2a1400] placeholder:text-[#9a5b1e] focus:border-emerald-400 focus:ring-emerald-200',
                )}
                placeholder="Buscar cliente"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <select
              className={cn(
                'h-11 rounded-full border px-3 text-sm shadow-soft focus:outline-none focus:ring-2',
                isDark
                  ? 'border-slate-700 bg-slate-900 text-slate-100 focus:border-emerald-400 focus:ring-emerald-500/20'
                  : 'border-[#f0d9b8] bg-white text-[#2a1400] focus:border-emerald-400 focus:ring-emerald-200',
              )}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="todos">Status</option>
              {filters.status.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <select
              className={cn(
                'h-11 rounded-full border px-3 text-sm shadow-soft focus:outline-none focus:ring-2',
                isDark
                  ? 'border-slate-700 bg-slate-900 text-slate-100 focus:border-emerald-400 focus:ring-emerald-500/20'
                  : 'border-[#f0d9b8] bg-white text-[#2a1400] focus:border-emerald-400 focus:ring-emerald-200',
              )}
              value={healthFilter}
              onChange={(event) => setHealthFilter(event.target.value)}
            >
              <option value="todos">Saude</option>
              {filters.health.map((health) => (
                <option key={health} value={health}>
                  {health}
                </option>
              ))}
            </select>
            <select
              className={cn(
                'h-11 rounded-full border px-3 text-sm shadow-soft focus:outline-none focus:ring-2',
                isDark
                  ? 'border-slate-700 bg-slate-900 text-slate-100 focus:border-emerald-400 focus:ring-emerald-500/20'
                  : 'border-[#f0d9b8] bg-white text-[#2a1400] focus:border-emerald-400 focus:ring-emerald-200',
              )}
              value={areaFilter}
              onChange={(event) => setAreaFilter(event.target.value)}
            >
              <option value="todos">Area</option>
              {filters.area.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
            <select
              className={cn(
                'h-11 rounded-full border px-3 text-sm shadow-soft focus:outline-none focus:ring-2',
                isDark
                  ? 'border-slate-700 bg-slate-900 text-slate-100 focus:border-emerald-400 focus:ring-emerald-500/20'
                  : 'border-[#f0d9b8] bg-white text-[#2a1400] focus:border-emerald-400 focus:ring-emerald-200',
              )}
              value={ownerFilter}
              onChange={(event) => setOwnerFilter(event.target.value)}
            >
              <option value="todos">Responsavel</option>
              {filters.owner.map((owner) => (
                <option key={owner} value={owner}>
                  {owner}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={cn(
                'h-11 text-xs',
                isDark ? 'text-slate-300 hover:text-slate-100' : 'text-[#7a4a1a] hover:text-[#2a1400]',
              )}
              onClick={resetFilters}
            >
              Limpar filtros
            </button>
          </div>

          <PageState
            status={pageState}
            emptyTitle="Nenhum cliente encontrado"
            emptyDescription="Ajuste os filtros para localizar a carteira."
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
                    <th className="px-4 py-3" />
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Saude</th>
                    <th className="px-4 py-3">Casos</th>
                    <th className="px-4 py-3">Responsavel</th>
                    <th className="px-4 py-3 text-right">Atualizacao</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClientes.map((cliente) => {
                    const initials = cliente.name
                      .split(' ')
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join('')
                    return (
                      <tr
                        key={cliente.id}
                        className={cn(
                          'border-t',
                          isDark
                            ? 'border-slate-800 hover:bg-slate-800/60'
                            : 'border-[#f0d9b8] hover:bg-[#fff3e0]/60',
                        )}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border border-border bg-white text-primary"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                              {initials}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-text">
                                {cliente.name}
                              </div>
                              <div className="text-xs text-text-subtle">
                                {cliente.area}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex rounded-full border px-3 py-1 text-xs font-medium capitalize',
                              statusPill(cliente.status),
                            )}
                          >
                            {cliente.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex rounded-full border px-3 py-1 text-xs font-medium capitalize',
                              healthPill(cliente.health),
                            )}
                          >
                            {cliente.health}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-text">
                          {cliente.caseCount}
                        </td>
                        <td className="px-4 py-3 text-sm text-text">
                          {cliente.owner}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-text-subtle">
                          {formatDateTime(cliente.lastUpdate)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </PageState>
        </CardContent>
      </Card>
    </div>
    </div>
  )
}
