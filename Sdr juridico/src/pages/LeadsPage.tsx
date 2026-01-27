import * as React from 'react'
import { Search, TrendingUp, DollarSign, Clock, Zap, Phone, Mail, MessageSquare, ArrowUpRight, Filter, ArrowLeft, Save, User, MapPin, Briefcase, Pencil, Trash2, Flame } from 'lucide-react'
import { toast } from 'sonner'
import { useSearchParams } from 'react-router-dom'

import { LeadDrawer } from '@/components/LeadDrawer'
import { PageState } from '@/components/PageState'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Lead } from '@/types/domain'
import { formatDateTime, formatPhone } from '@/utils/format'
import { useLeads } from '@/hooks/useLeads'
import { useCasos } from '@/hooks/useCasos'
import { useOrganization } from '@/hooks/useOrganization'
import { useAdvogados } from '@/hooks/useAdvogados'
import { cn } from '@/utils/cn'
import type { LeadRow } from '@/lib/supabaseClient'
import { leadsService } from '@/services/leadsService'

const resolveStatus = (
  value: string | null,
): 'loading' | 'empty' | 'error' | 'ready' => {
  if (value === 'loading' || value === 'empty' || value === 'error') {
    return value
  }
  return 'ready'
}

const statusPill = (status: Lead['status']) => {
  if (status === 'ganho') return 'bg-green-50 text-green-700 border-green-200'
  if (status === 'perdido') return 'bg-red-50 text-red-700 border-red-200'
  if (status === 'proposta') return 'bg-amber-50 text-amber-700 border-amber-200'
  if (status === 'qualificado') return 'bg-blue-50 text-blue-700 border-blue-200'
  if (status === 'em_contato') return 'bg-purple-50 text-purple-700 border-purple-200'
  return 'bg-gray-50 text-gray-700 border-gray-200'
}

const heatPill = (heat: Lead['heat']) => {
  if (heat === 'quente') return 'bg-red-50 text-red-700 border-red-200'
  if (heat === 'morno') return 'bg-amber-50 text-amber-700 border-amber-200'
  return 'bg-blue-50 text-blue-700 border-blue-200'
}

export const LeadsPage = () => {
  const { leads, loading, error, fetchLeads, createLead, updateLead, deleteLead, assignLeadAdvogado } = useLeads()
  const { casos } = useCasos()
  const { currentRole, isFartechAdmin, currentOrg } = useOrganization()
  const canManageLeads = isFartechAdmin || ['org_admin', 'gestor', 'admin'].includes(currentRole || '')
  const { advogados } = useAdvogados(currentOrg?.id || null, canManageLeads)
  const [params] = useSearchParams()
  const [query, setQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('todos')
  const [heatFilter, setHeatFilter] = React.useState('todos')
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null)
  const [activeTab, setActiveTab] = React.useState('Todos')
  const [showNewLeadForm, setShowNewLeadForm] = React.useState(false)
  const [editingLeadId, setEditingLeadId] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [assigningLeadId, setAssigningLeadId] = React.useState<string | null>(null)
  const [selectedAdvogadoId, setSelectedAdvogadoId] = React.useState('')

  const initialFormData = React.useMemo(() => ({
    nome: '',
    email: '',
    telefone: '',
    empresa: '',
    area: '',
    origem: '',
    status: 'novo' as LeadRow['status'],
    heat: 'frio' as LeadRow['heat'],
    observacoes: '',
  }), [])

  const [formData, setFormData] = React.useState(initialFormData)
  const isEditing = Boolean(editingLeadId)

  const tabs = ['Todos', 'Quentes', 'Em negociacao', 'Fechados']

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

      if (activeTab === 'Quentes') return matchesQuery && matchesStatus && lead.heat === 'quente'
      if (activeTab === 'Em negociacao') {
        return matchesQuery && matchesHeat && ['proposta', 'qualificado'].includes(lead.status)
      }
      if (activeTab === 'Fechados') {
        return matchesQuery && matchesHeat && ['ganho', 'perdido'].includes(lead.status)
      }

      return matchesQuery && matchesStatus && matchesHeat
    })
  }, [query, statusFilter, heatFilter, activeTab, leads])

  const forcedState = resolveStatus(params.get('state'))
  const baseState = loading
    ? 'loading'
    : error
      ? 'error'
      : filteredLeads.length === 0
        ? 'empty'
        : 'ready'
  const pageState = forcedState !== 'ready' ? forcedState : baseState
  const emptyAction = canManageLeads ? (
    <Button
      variant="primary"
      size="sm"
      onClick={() => {
        resetLeadForm()
        setShowNewLeadForm(true)
      }}
    >
      Novo lead
    </Button>
  ) : null

  const relatedCase = selectedLead
    ? casos.find((caso) => caso.leadId === selectedLead.id)
    : undefined

  const resetFilters = () => {
    setQuery('')
    setStatusFilter('todos')
    setHeatFilter('todos')
  }

  const resetLeadForm = () => {
    setFormData(initialFormData)
    setEditingLeadId(null)
  }

  const handleEditLead = async (leadId: string) => {
    if (!canManageLeads) {
      toast.error('Apenas gestores podem editar leads.')
      return
    }
    setSaving(true)
    try {
      const lead = await leadsService.getLead(leadId)
      setFormData({
        nome: lead.nome || '',
        email: lead.email || '',
        telefone: lead.telefone || '',
        empresa: lead.empresa || '',
        area: lead.area || '',
        origem: lead.origem || '',
        status: lead.status,
        heat: lead.heat,
        observacoes: lead.observacoes || '',
      })
      setEditingLeadId(leadId)
      setShowNewLeadForm(true)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar lead para edicao'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteLead = async (leadId: string, leadName: string) => {
    if (!canManageLeads) {
      toast.error('Apenas gestores podem excluir leads.')
      return
    }
    const confirmed = window.confirm(`Excluir o lead "${leadName}"? Essa acao nao pode ser desfeita.`)
    if (!confirmed) return
    try {
      await deleteLead(leadId)
      toast.success(`Lead excluido: ${leadName}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao excluir lead'
      toast.error(message)
    }
  }

  const handleEncaminharLead = async (leadId: string) => {
    if (!selectedAdvogadoId) {
      toast.error('Selecione um advogado para encaminhar.')
      return
    }
    const advogado = advogados.find((item) => item.id === selectedAdvogadoId)
    if (!advogado) {
      toast.error('Advogado nao encontrado.')
      return
    }
    try {
      await assignLeadAdvogado(leadId, advogado.id, advogado.nome)
      toast.success(`Lead encaminhado para ${advogado.nome}`)
      setAssigningLeadId(null)
      setSelectedAdvogadoId('')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao encaminhar lead'
      toast.error(message)
    }
  }

  const handleSaveLead = async () => {
    if (!canManageLeads) {
      toast.error('Apenas gestores podem adicionar leads.')
      return
    }
    if (!formData.nome || !formData.email || !formData.telefone) {
      alert('Por favor, preencha os campos obrigatorios: Nome, Email e Telefone')
      return
    }

    setSaving(true)
    try {
      const payload = {
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        empresa: formData.empresa || null,
        area: formData.area || null,
        origem: formData.origem || null,
        status: formData.status,
        heat: formData.heat,
        observacoes: formData.observacoes || null,
      }

      if (editingLeadId) {
        await updateLead(editingLeadId, payload)
        toast.success('Lead atualizado com sucesso.')
      } else {
        await createLead({
          ...payload,
          ultimo_contato: null,
          responsavel: null,
        })
        toast.success('Lead criado com sucesso.')
      }

      resetLeadForm()
      setShowNewLeadForm(false)
    } catch (error) {
      alert('Erro ao salvar lead. Tente novamente.')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  if (showNewLeadForm) {
    return (
      <div className="min-h-screen bg-gray-50 p-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEditing ? 'Editar Lead' : 'Novo Lead'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {isEditing ? 'Ajuste os dados do lead' : 'Preencha os dados do novo lead'}
              </p>
            </div>
            <Button
              onClick={() => {
                resetLeadForm()
                setShowNewLeadForm(false)
              }}
              variant="outline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </div>

          {/* Formulário */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <form className="space-y-6">
              {/* Informações Pessoais */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Informações do Lead
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Nome Completo *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        className="h-10 w-full rounded-lg border border-gray-200 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50"
                        style={{ focusRingColor: '#721011' } as React.CSSProperties}
                        placeholder="Digite o nome completo"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Email *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="h-10 w-full rounded-lg border border-gray-200 pl-10 pr-4 text-sm focus:outline-none focus:ring-2"
                        placeholder="email@exemplo.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Telefone *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        required
                        value={formData.telefone}
                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                        className="h-10 w-full rounded-lg border border-gray-200 pl-10 pr-4 text-sm focus:outline-none focus:ring-2"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Empresa
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={formData.empresa}
                        onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                        className="h-10 w-full rounded-lg border border-gray-200 pl-10 pr-4 text-sm focus:outline-none focus:ring-2"
                        placeholder="Nome da empresa"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Área de Interesse
                    </label>
                    <input
                      type="text"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      className="h-10 w-full rounded-lg border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2"
                      placeholder="Ex: Família, Trabalhista"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Origem
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={formData.origem}
                        onChange={(e) => setFormData({ ...formData, origem: e.target.value })}
                        className="h-10 w-full rounded-lg border border-gray-200 pl-10 pr-4 text-sm focus:outline-none focus:ring-2"
                        placeholder="Ex: Website, Indicação"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as LeadRow['status'] })}
                      className="h-10 w-full rounded-lg border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2"
                    >
                      <option value="novo">Novo</option>
                      <option value="em_contato">Em Contato</option>
                      <option value="qualificado">Qualificado</option>
                      <option value="proposta">Proposta</option>
                      <option value="ganho">Ganho</option>
                      <option value="perdido">Perdido</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Temperatura
                    </label>
                    <select
                      value={formData.heat}
                      onChange={(e) => setFormData({ ...formData, heat: e.target.value as LeadRow['heat'] })}
                      className="h-10 w-full rounded-lg border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2"
                    >
                      <option value="frio">Frio</option>
                      <option value="morno">Morno</option>
                      <option value="quente">Quente</option>
                    </select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">
                      Observações
                    </label>
                    <textarea
                      value={formData.observacoes}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                      rows={4}
                      className="w-full rounded-lg border border-gray-200 p-4 text-sm focus:outline-none focus:ring-2"
                      placeholder="Descreva informações adicionais sobre o lead..."
                    />
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSaveLead}
                  disabled={saving}
                  className="flex-1 h-10 rounded-lg font-medium text-white transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#721011' }}
                >
                  <Save className="inline mr-2 h-4 w-4" />
                  {saving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Salvar Lead'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetLeadForm()
                    setShowNewLeadForm(false)
                  }}
                  className="px-6 h-10 rounded-lg border border-gray-200 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

          input:focus, select:focus, textarea:focus {
            --tw-ring-color: #721011;
            border-color: #721011;
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(114, 16, 17, 0.1)', color: '#721011' }}
                >
                  <TrendingUp className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Pipeline de Vendas
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Gestão de Leads</h1>
              <p className="text-sm text-gray-500 mt-1">
                Acompanhe oportunidades e impulsione suas vendas
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => void fetchLeads()}
                disabled={loading}
                className="px-4 py-2 rounded-lg border border-gray-200 font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Atualizar
              </button>
              <button
                onClick={() => {
                  if (!canManageLeads) {
                    toast.error('Apenas gestores podem adicionar leads.')
                    return
                  }
                  resetLeadForm()
                  setShowNewLeadForm(true)
                }}
                disabled={!canManageLeads}
                className="px-6 py-2 rounded-lg font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50"
                style={{ backgroundColor: '#721011' }}
              >
                <Zap className="inline mr-2 h-4 w-4" />
                Novo Lead
              </button>
            </div>
          </div>
        </div>

        {/* Métricas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'rgba(114, 16, 17, 0.15)', color: '#721011' }}
              >
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-gray-900">{metrics.total}</div>
              <div className="text-sm text-gray-500 mt-1">Total Pipeline</div>
              <div className="text-xs text-gray-400 mt-1">oportunidades ativas</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}
              >
                <Flame className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold" style={{ color: '#ef4444' }}>{metrics.quentes}</div>
              <div className="text-sm text-gray-500 mt-1">Leads Quentes</div>
              <div className="text-xs" style={{ color: '#ef4444' }}>AÇÃO IMEDIATA</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'rgba(191, 111, 50, 0.15)', color: '#BF6F32' }}
              >
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold" style={{ color: '#BF6F32' }}>{metrics.emNegociacao}</div>
              <div className="text-sm text-gray-500 mt-1">Em negociação</div>
              <div className="text-xs text-gray-400 mt-1">Propostas ativas</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}
              >
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold" style={{ color: '#22c55e' }}>{metrics.taxaConversao}%</div>
              <div className="text-sm text-gray-500 mt-1">Taxa de conversão</div>
              <div className="text-xs text-gray-400 mt-1">{metrics.ganhos} fechamentos</div>
            </div>
          </div>
        </div>

        {/* Lista de Leads */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="space-y-4">
            {/* Tabs e Filtros */}
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      'px-4 py-2 rounded-lg font-medium text-sm transition-all',
                      activeTab === tab
                        ? 'text-white shadow-md'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    )}
                    style={activeTab === tab ? { backgroundColor: '#721011' } : {}}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[300px]">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    className="h-10 w-full rounded-lg border border-gray-200 pl-10 pr-4 text-sm focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': '#721011' } as React.CSSProperties}
                    placeholder="Buscar por nome, telefone ou área..."
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>

                <select
                  className="h-10 rounded-lg border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="todos">Todos status</option>
                  {filters.status.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>

                <select
                  className="h-10 rounded-lg border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2"
                  value={heatFilter}
                  onChange={(event) => setHeatFilter(event.target.value)}
                >
                  <option value="todos">Temperatura</option>
                  {filters.heat.map((heat) => (
                    <option key={heat} value={heat}>
                      {heat}
                    </option>
                  ))}
                </select>

                <button
                  onClick={resetFilters}
                  className="h-10 px-4 rounded-lg border border-gray-200 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Filter className="inline mr-2 h-4 w-4" />
                  Limpar
                </button>
              </div>
            </div>

            {/* Lista */}
            <PageState
              status={pageState}
              emptyTitle="Nenhum lead encontrado"
              emptyDescription="Ajuste os filtros ou adicione novos leads ao pipeline."
              emptyAction={emptyAction}
              onRetry={error ? fetchLeads : undefined}
            >
              <div className="space-y-3">
                {filteredLeads.map((lead) => {
                  const initials = lead.name
                    .split(' ')
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join('')

                  return (
                    <div
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className="group cursor-pointer rounded-xl border border-gray-100 p-4 transition-all hover:shadow-md hover:border-gray-200"
                    >
                      <div className="flex flex-wrap items-center gap-4">
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold text-white"
                          style={{ backgroundColor: '#721011' }}
                        >
                          {initials}
                        </div>

                        <div className="flex-1 min-w-[200px]">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-semibold text-gray-900">
                              {lead.name}
                            </h3>
                            <span
                              className={cn(
                                'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                                heatPill(lead.heat)
                              )}
                            >
                              {lead.heat}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {lead.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {formatPhone(lead.phone)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span
                              className={cn(
                                'inline-flex rounded-lg border px-3 py-1 text-xs font-medium capitalize',
                                statusPill(lead.status)
                              )}
                            >
                              {lead.status}
                            </span>
                            <p className="mt-1 text-xs text-gray-500">{lead.area}</p>
                          </div>

                          <div className="flex gap-2">
                            {canManageLeads && (
                              <>
                                <button
                                  type="button"
                                  className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    void handleEditLead(lead.id)
                                  }}
                                >
                                  <Pencil className="h-4 w-4 text-gray-600" />
                                </button>
                                <button
                                  type="button"
                                  className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-red-50 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    void handleDeleteLead(lead.id, lead.name)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {canManageLeads && assigningLeadId === lead.id && (
                        <div
                          className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <span className="text-xs font-medium text-gray-700">Encaminhar para</span>
                          <select
                            className="h-8 rounded-lg border border-gray-200 px-3 text-xs bg-white"
                            value={selectedAdvogadoId}
                            onChange={(event) => setSelectedAdvogadoId(event.target.value)}
                          >
                            <option value="">Selecione um advogado</option>
                            {advogados.map((advogado) => (
                              <option key={advogado.id} value={advogado.id}>
                                {advogado.nome}
                              </option>
                            ))}
                          </select>
                          <button
                            className="h-8 px-4 rounded-lg text-xs font-medium text-white"
                            style={{ backgroundColor: '#721011' }}
                            onClick={(event) => {
                              event.stopPropagation()
                              void handleEncaminharLead(lead.id)
                            }}
                          >
                            Encaminhar
                          </button>
                          <button
                            className="h-8 px-4 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-white"
                            onClick={(event) => {
                              event.stopPropagation()
                              setAssigningLeadId(null)
                              setSelectedAdvogadoId('')
                            }}
                          >
                            Cancelar
                          </button>
                        </div>
                      )}

                      {lead.lastContactAt && (
                        <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          Último contato: {formatDateTime(lead.lastContactAt)}
                          {lead.owner && (
                            <>
                              <span className="mx-2">•</span>
                              Responsável: {lead.owner}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </PageState>
          </div>
        </div>
      </div>

      <LeadDrawer
        open={Boolean(selectedLead)}
        lead={selectedLead}
        relatedCase={relatedCase}
        onClose={() => setSelectedLead(null)}
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

        input:focus, select:focus, textarea:focus {
          --tw-ring-color: #721011;
          border-color: #721011;
        }

        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: #E0E0E0;
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #BDBDBD;
        }
      `}</style>
    </div>
  )
}
