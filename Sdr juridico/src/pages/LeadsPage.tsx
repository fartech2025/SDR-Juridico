import * as React from 'react'
import { Search } from 'lucide-react'
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

const resolveStatus = (
  value: string | null,
): 'loading' | 'empty' | 'error' | 'ready' => {
  if (value === 'loading' || value === 'empty' || value === 'error') {
    return value
  }
  return 'ready'
}

const statusPill = (status: Lead['status']) => {
  if (status === 'ganho') return 'border-[#CFEBD8] bg-[#E8F7EE] text-[#167A3D]'
  if (status === 'perdido') return 'border-[#F5C2C2] bg-[#FFE1E1] text-[#B42318]'
  if (status === 'proposta')
    return 'border-[#F8D2A8] bg-[#FFF1E3] text-[#B45309]'
  if (status === 'qualificado')
    return 'border-[#D6E4FF] bg-[#E6F0FF] text-[#1D4ED8]'
  if (status === 'em_contato')
    return 'border-[#E6D6FF] bg-[#F2E9FF] text-[#6B21A8]'
  return 'border-[#E7E9F2] bg-[#F2F4FA] text-[#6B7280]'
}

const heatPill = (heat: Lead['heat']) => {
  if (heat === 'quente') return 'border-[#F5C2C2] bg-[#FFE1E1] text-[#B42318]'
  if (heat === 'morno') return 'border-[#F1D28A] bg-[#FFF1CC] text-[#8A5A00]'
  return 'border-[#D6E4FF] bg-[#E6F0FF] text-[#1D4ED8]'
}

export const LeadsPage = () => {
  const { leads, loading, error } = useLeads()
  const { casos } = useCasos()
  const [params] = useSearchParams()
  const [query, setQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('todos')
  const [heatFilter, setHeatFilter] = React.useState('todos')
  const [areaFilter, setAreaFilter] = React.useState('todos')
  const [originFilter, setOriginFilter] = React.useState('todos')
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null)
  const [activeTab, setActiveTab] = React.useState('Todos')

  const tabs = ['Todos', 'Docs', 'Agenda', 'Comercial', 'Juridico', 'Automacao']

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
          <p className="text-xs uppercase tracking-[0.3em] text-text-subtle">
            Leads
          </p>
          <h2 className="font-display text-2xl text-text">Triagem juridica</h2>
          <p className="text-sm text-text-muted">
            Busque por nome, telefone ou area e filtre por status.
          </p>
        </div>
      </header>

      <Card>
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
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white px-3 py-2 shadow-soft">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${
                    activeTab === tab
                      ? 'border-primary/60 bg-primary/15 text-primary'
                      : 'border-border bg-white text-text-subtle hover:bg-[#F2F5FF] hover:text-text'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="text-xs text-text-subtle hover:text-text"
              onClick={resetFilters}
            >
              Limpar filtros
            </button>
          </div>

          <div className="grid gap-3 lg:grid-cols-[2fr_repeat(4,1fr)]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
              <input
                className="h-11 w-full rounded-full border border-border bg-[#EEF4FF] pl-11 pr-4 text-sm text-text placeholder:text-text-subtle shadow-soft focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Buscar por nome, telefone ou area"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <select
              className="h-11 rounded-full border border-border bg-white px-3 text-sm text-text shadow-soft focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
              className="h-11 rounded-full border border-border bg-white px-3 text-sm text-text shadow-soft focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
              className="h-11 rounded-full border border-border bg-white px-3 text-sm text-text shadow-soft focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
              className="h-11 rounded-full border border-border bg-white px-3 text-sm text-text shadow-soft focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
            <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-soft">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-surface-2 text-[11px] uppercase tracking-[0.22em] text-text-subtle">
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
                        className="border-t border-border text-text hover:bg-surface-2/70"
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
  )
}
