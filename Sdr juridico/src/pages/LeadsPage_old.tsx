import * as React from 'react'
import { Search, TrendingUp, DollarSign, Clock, Zap, Phone, Mail, MessageSquare, ArrowUpRight } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

import { LeadDrawer } from '@/components/LeadDrawer'
import { PageState } from '@/components/PageState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import heroLight from '@/assets/hero-light.svg'
import type { Lead } from '@/types/domain'
import { formatDateTime, formatPhone } from '@/utils/format'
import { useLeads } from '@/hooks/useLeads'
import { useCasos } from '@/hooks/useCasos'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/utils/cn'

const resolveStatus = (
  value: string | null,
): 'loading' | 'empty' | 'error' | 'ready' => {
  if (value === 'loading' || value === 'empty' || value === 'error') {
    return value
  }
  return 'ready'
}

const statusPill = (status: Lead['status']) => {
  if (status === 'ganho') return 'border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
  if (status === 'perdido') return 'border-red-500/30 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
  if (status === 'proposta') return 'border-amber-500/30 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
  if (status === 'qualificado') return 'border-blue-500/30 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
  if (status === 'em_contato') return 'border-purple-500/30 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400'
  return 'border-slate-300 bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
}

const heatPill = (heat: Lead['heat']) => {
  if (heat === 'quente') return 'border-red-500/50 bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/20'
  if (heat === 'morno') return 'border-yellow-500/50 bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-lg shadow-yellow-500/20'
  return 'border-blue-500/50 bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/20'
}

export const LeadsPage = () => {
  const { leads, loading, error } = useLeads()
  const { casos } = useCasos()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [params] = useSearchParams()
  const [query, setQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('todos')
  const [heatFilter, setHeatFilter] = React.useState('todos')
  const [areaFilter, setAreaFilter] = React.useState('todos')
  const [originFilter, setOriginFilter] = React.useState('todos')
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null)
  const [activeTab, setActiveTab] = React.useState('Todos')

  const tabs = ['Todos', 'Quentes', 'Em Negociação', 'Fechados']

  // Métricas do pipeline de vendas
  const metrics = React.useMemo(() => {
    const total = leads.length
    const quentes = leads.filter(l => l.heat === 'quente').length
    const emNegociacao = leads.filter(l => ['proposta', 'qualificado'].includes(l.status)).length
    const ganhos = leads.filter(l => l.status === 'ganho').length
    const taxaConversao = total > 0 ? ((ganhos / total) * 100).toFixed(1) : '0'
    
    return { total, quentes, emNegociacao, ganhos, taxaConversao }
  }, [leads])

  const filters = React.useMemo(
    () => ({
      status: Array.from(new Set(leads.map((lead) => lead.status))),
      heat: Array.from(new Set(leads.map((lead) => lead.heat))),
      area: Array.from(new Set(leads.map((lead) => lead.area))),
      origin: Array.from(new Set(leads.map((lead) => lead.origin))),
    }),
    [leads],
  )

  const filteredLeads = React.useMemo(() => {
    const term = query.trim().toLowerCase()
    return leads.filter((lead) => {
      const matchesQuery =
        !term ||
        lead.name.toLowerCase().includes(term) ||
        lead.area.toLowerCase().includes(term) ||
        lead.phone.replace(/\D/g, '').includes(term.replace(/\D/g, ''))
      const matchesStatus = statusFilter === 'todos' || lead.status === statusFilter
      const matchesHeat = heatFilter === 'todos' || lead.heat === heatFilter
      const matchesArea = areaFilter === 'todos' || lead.area === areaFilter
      const matchesOrigin = originFilter === 'todos' || lead.origin === originFilter
      return matchesQuery && matchesStatus && matchesHeat && matchesArea && matchesOrigin
    })
  }, [query, statusFilter, heatFilter, areaFilter, originFilter, leads])

  const forcedState = resolveStatus(params.get('state'))
  const baseState = loading
    ? 'loading'
    : error
      ? 'error'
      : filteredLeads.length === 0
        ? 'empty'
        : 'ready'
  const pageState = forcedState !== 'ready' ? forcedState : baseState

  const relatedCase = selectedLead
    ? casos.find((caso) => caso.leadId === selectedLead.id)
    : undefined

  const resetFilters = () => {
    setQuery('')
    setStatusFilter('todos')
    setHeatFilter('todos')
    setAreaFilter('todos')
    setOriginFilter('todos')
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
              Leads
            </p>
            <h2 className={cn('font-display text-2xl', isDark ? 'text-slate-100' : 'text-[#2a1400]')}>
              Triagem juridica
            </h2>
            <p className={cn('text-sm', isDark ? 'text-slate-300' : 'text-[#7a4a1a]')}>
              Busque por nome, telefone ou area e filtre por status.
            </p>
          </div>
        </header>

        <Card
          className={cn(
            'border',
            isDark ? 'border-slate-800 bg-slate-900/70' : 'border-[#f0d9b8] bg-white/95',
          )}
        >
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Lista de leads</CardTitle>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-text-subtle">
              <span>Total: {leads.length}</span>
              <span>Exibindo: {filteredLeads.length}</span>
            </div>
          </div>
          <Button variant="outline" size="sm" className="h-10 rounded-full px-4">
            Adicionar evento
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={cn(
              'flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-3 py-2 shadow-soft',
              isDark ? 'border-slate-800 bg-slate-900/70' : 'border-[#f0d9b8] bg-white/95',
            )}
          >
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${
                    activeTab === tab
                      ? isDark
                        ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300'
                        : 'border-emerald-500/60 bg-emerald-500/10 text-emerald-600'
                      : isDark
                        ? 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
                        : 'border-[#f0d9b8] bg-white text-[#7a4a1a] hover:bg-[#fff3e0] hover:text-[#2a1400]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <button
              type="button"
              className={cn(
                'text-xs',
                isDark ? 'text-slate-300 hover:text-slate-100' : 'text-[#7a4a1a] hover:text-[#2a1400]',
              )}
              onClick={resetFilters}
            >
              Limpar filtros
            </button>
          </div>

          <div className="grid gap-3 lg:grid-cols-[2fr_repeat(4,1fr)]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
              <input
                className={cn(
                  'h-11 w-full rounded-full border pl-11 pr-4 text-sm shadow-soft focus:outline-none focus:ring-2',
                  isDark
                    ? 'border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-emerald-500/20'
                    : 'border-[#f0d9b8] bg-[#fff3e0] text-[#2a1400] placeholder:text-[#9a5b1e] focus:border-emerald-400 focus:ring-emerald-200',
                )}
                placeholder="Buscar por nome, telefone ou area"
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
              value={heatFilter}
              onChange={(event) => setHeatFilter(event.target.value)}
            >
              <option value="todos">Calor</option>
              {filters.heat.map((heat) => (
                <option key={heat} value={heat}>
                  {heat}
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
              value={originFilter}
              onChange={(event) => setOriginFilter(event.target.value)}
            >
              <option value="todos">Origem</option>
              {filters.origin.map((origin) => (
                <option key={origin} value={origin}>
                  {origin}
                </option>
              ))}
            </select>
          </div>

          <PageState
            status={pageState}
            emptyTitle="Nenhum lead encontrado"
            emptyDescription="Ajuste os filtros ou tente outra busca."
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
                    <th className="px-4 py-3">Lead</th>
                    <th className="px-4 py-3">Area</th>
                    <th className="px-4 py-3">Origem</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Calor</th>
                    <th className="px-4 py-3">Contato</th>
                    <th className="px-4 py-3">Responsavel</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => {
                    const initials = lead.name
                      .split(' ')
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join('')
                    return (
                      <tr
                        key={lead.id}
                        className={cn(
                          'border-t text-text',
                          isDark
                            ? 'border-slate-800 hover:bg-slate-800/60'
                            : 'border-[#f0d9b8] hover:bg-[#fff3e0]/60',
                        )}
                        onClick={() => setSelectedLead(lead)}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border border-border bg-white text-primary"
                            onClick={(event) => event.stopPropagation()}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                              {initials}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-text">
                                {lead.name}
                              </div>
                              <div className="text-xs text-text-subtle">
                                {lead.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-text">{lead.area}</td>
                        <td className="px-4 py-3 text-sm text-text">{lead.origin}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium capitalize ${statusPill(
                              lead.status,
                            )}`}
                          >
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium capitalize ${heatPill(
                              lead.heat,
                            )}`}
                          >
                            {lead.heat}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-text">
                            {formatPhone(lead.phone)}
                          </div>
                          <div className="text-xs text-text-subtle">
                            {lead.lastContactAt
                              ? formatDateTime(lead.lastContactAt)
                              : 'Sem contato'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-text">
                          {lead.owner}
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

      <LeadDrawer
        open={Boolean(selectedLead)}
        lead={selectedLead}
        relatedCase={relatedCase}
        onClose={() => setSelectedLead(null)}
      />
    </div>
    </div>
  )
}
