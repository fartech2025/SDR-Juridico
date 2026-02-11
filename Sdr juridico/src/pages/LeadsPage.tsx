import * as React from 'react'
import { Search, TrendingUp, DollarSign, Clock, Zap, Phone, Mail, MessageSquare, ArrowUpRight, Filter, ArrowLeft, Save, User, MapPin, Briefcase, Pencil, Trash2, Flame, Sun, Snowflake, ArrowRight, CheckCircle2, XCircle, Users, LayoutGrid, List } from 'lucide-react'
import { toast } from 'sonner'
import { useSearchParams, Link } from 'react-router-dom'

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

// Badges de status - Visual Corporativo (tons cinza)
const statusBadge = (status: Lead['status']) => {
  const badges: Record<Lead['status'], string> = {
    novo: 'bg-surface-alt text-text border border-border',
    em_contato: 'bg-surface-alt text-text border border-border',
    qualificado: 'bg-surface-alt text-text border border-border-strong',
    proposta: 'bg-surface-alt text-text border border-border-strong',
    ganho: 'bg-brand-primary text-white border border-border-strong',
    perdido: 'bg-text-subtle text-white border border-border-strong',
  }
  return badges[status] || badges.novo
}

const statusLabel = (status: Lead['status']) => {
  const labels: Record<Lead['status'], string> = {
    novo: 'Novo',
    em_contato: 'Em Contato',
    qualificado: 'Qualificado',
    proposta: 'Proposta',
    ganho: 'Ganho',
    perdido: 'Perdido',
  }
  return labels[status] || status
}

// Badges de temperatura (heat) - Cores vibrantes
const heatBadge = (heat: Lead['heat']) => {
  const badges: Record<Lead['heat'], string> = {
    quente: 'bg-gradient-to-r from-red-100 to-orange-100 text-red-700 border border-red-200',
    morno: 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border border-amber-200',
    frio: 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border border-blue-200',
  }
  return badges[heat] || badges.frio
}

const heatIcon = (heat: Lead['heat']) => {
  if (heat === 'quente') return <Flame className="w-3 h-3" />
  if (heat === 'morno') return <Sun className="w-3 h-3" />
  return <Snowflake className="w-3 h-3" />
}

const heatLabel = (heat: Lead['heat']) => {
  const labels: Record<Lead['heat'], string> = {
    quente: 'Quente',
    morno: 'Morno',
    frio: 'Frio',
  }
  return labels[heat] || heat
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
          last_contact_at: null,
          assigned_user_id: null,
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
      <div className="bg-surface-alt" style={{ fontFamily: "'DM Sans', sans-serif", padding: '20px' }}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text">
                {isEditing ? 'Editar Lead' : 'Novo Lead'}
              </h1>
              <p className="text-sm text-text-muted mt-1">
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
          <div className="bg-white rounded-xl border border-border p-6">
            <form className="space-y-6">
              {/* Informações Pessoais */}
              <div>
                <h3 className="text-lg font-semibold text-text mb-4">
                  Informações do Lead
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text">
                      Nome Completo *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-subtle" />
                      <input
                        type="text"
                        required
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        className="h-10 w-full rounded-lg border border-border pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50"
                        style={{ focusRingColor: 'var(--brand-primary)' } as React.CSSProperties}
                        placeholder="Digite o nome completo"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text">
                      Email *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-subtle" />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="h-10 w-full rounded-lg border border-border pl-10 pr-4 text-sm focus:outline-none focus:ring-2"
                        placeholder="email@exemplo.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text">
                      Telefone *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-subtle" />
                      <input
                        type="tel"
                        required
                        value={formData.telefone}
                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                        className="h-10 w-full rounded-lg border border-border pl-10 pr-4 text-sm focus:outline-none focus:ring-2"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text">
                      Empresa
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-subtle" />
                      <input
                        type="text"
                        value={formData.empresa}
                        onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                        className="h-10 w-full rounded-lg border border-border pl-10 pr-4 text-sm focus:outline-none focus:ring-2"
                        placeholder="Nome da empresa"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text">
                      Área de Interesse
                    </label>
                    <input
                      type="text"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      className="h-10 w-full rounded-lg border border-border px-4 text-sm focus:outline-none focus:ring-2"
                      placeholder="Ex: Família, Trabalhista"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text">
                      Origem
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-subtle" />
                      <input
                        type="text"
                        value={formData.origem}
                        onChange={(e) => setFormData({ ...formData, origem: e.target.value })}
                        className="h-10 w-full rounded-lg border border-border pl-10 pr-4 text-sm focus:outline-none focus:ring-2"
                        placeholder="Ex: Website, Indicação"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as LeadRow['status'] })}
                      className="h-10 w-full rounded-lg border border-border px-4 text-sm focus:outline-none focus:ring-2"
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
                    <label className="text-sm font-medium text-text">
                      Temperatura
                    </label>
                    <select
                      value={formData.heat}
                      onChange={(e) => setFormData({ ...formData, heat: e.target.value as LeadRow['heat'] })}
                      className="h-10 w-full rounded-lg border border-border px-4 text-sm focus:outline-none focus:ring-2"
                    >
                      <option value="frio">Frio</option>
                      <option value="morno">Morno</option>
                      <option value="quente">Quente</option>
                    </select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-text">
                      Observações
                    </label>
                    <textarea
                      value={formData.observacoes}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                      rows={4}
                      className="w-full rounded-lg border border-border p-4 text-sm focus:outline-none focus:ring-2"
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
                  style={{ backgroundColor: 'var(--brand-primary)' }}
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
                  className="px-6 h-10 rounded-lg border border-border font-medium text-text hover:bg-surface-alt transition-colors"
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
            --tw-ring-color: 'var(--brand-primary)';
            border-color: 'var(--brand-primary)';
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-alt" style={{ fontFamily: "'DM Sans', sans-serif", padding: '20px' }}>
      <div className="space-y-5">
        {/* Header */}
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(114, 16, 17, 0.1)' }}>
                  <TrendingUp className="h-5 w-5" style={{ color: 'var(--brand-primary)' }} />
                </div>
                <span className="text-xs font-semibold text-text-subtle uppercase tracking-wider">
                  Pipeline de Vendas
                </span>
              </div>
              <h1 className="text-2xl font-bold text-text">Gestão de Leads</h1>
              <p className="text-sm text-text-muted mt-1">
                Acompanhe oportunidades e gerencie conversões
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/app/leads/kanban"
                className="h-10 px-4 rounded-lg border border-border font-medium text-text-muted hover:bg-surface-alt hover:border-border-strong transition-all flex items-center gap-2"
              >
                <LayoutGrid className="h-4 w-4" />
                Kanban
              </Link>
              <button
                onClick={() => void fetchLeads()}
                disabled={loading}
                className="h-10 px-4 rounded-lg border border-border font-medium text-text-muted hover:bg-surface-alt hover:border-border-strong transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <ArrowUpRight className="h-4 w-4" />
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
                className="h-10 px-5 rounded-lg font-semibold text-white transition-all disabled:opacity-50 flex items-center gap-2"
                style={{ backgroundColor: 'var(--brand-primary)' }}
              >
                <Zap className="h-4 w-4" />
                Novo Lead
              </button>
            </div>
          </div>
        </div>

        {/* Métricas - Design Corporativo Discreto */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Pipeline */}
          <div className="group bg-white rounded-xl p-5 border border-border hover:border-border hover:shadow-sm transition-all duration-200">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(114, 16, 17, 0.1)' }}>
                <Users className="w-5 h-5" style={{ color: 'var(--brand-primary)' }} />
              </div>
              <span className="text-[10px] font-medium text-text-subtle uppercase tracking-wider">Pipeline</span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold text-text">{metrics.total}</div>
              <div className="text-sm text-text-muted mt-1">Total de Leads</div>
            </div>
          </div>

          {/* Leads Quentes */}
          <div className="group bg-white rounded-xl p-5 border border-border hover:border-orange-200 hover:shadow-sm transition-all duration-200">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-orange-50 border border-orange-200">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-orange-50 text-orange-600 border border-orange-200">
                Prioridade
              </span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold text-text">{metrics.quentes}</div>
              <div className="text-sm text-text-muted mt-1">Leads Quentes</div>
            </div>
          </div>

          {/* Em Negociação */}
          <div className="group bg-white rounded-xl p-5 border border-border hover:border-blue-200 hover:shadow-sm transition-all duration-200">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-50 border border-blue-200">
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-[10px] font-medium text-text-subtle uppercase tracking-wider">Ativos</span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold text-text">{metrics.emNegociacao}</div>
              <div className="text-sm text-text-muted mt-1">Em Negociação</div>
            </div>
          </div>

          {/* Taxa de Conversão */}
          <div className="group bg-white rounded-xl p-5 border border-border hover:border-emerald-200 hover:shadow-sm transition-all duration-200">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-emerald-50 border border-emerald-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-[10px] font-medium text-text-subtle uppercase tracking-wider">Sucesso</span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold text-text">{metrics.taxaConversao}%</div>
              <div className="text-sm text-text-muted mt-1">Taxa de Conversão</div>
              <div className="text-xs text-text-subtle mt-0.5">{metrics.ganhos} fechamentos</div>
            </div>
          </div>
        </div>
        {/* Lista de Leads */}
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="p-5 space-y-4">
            {/* Tabs e Filtros */}
            <div className="space-y-4">
              {/* Tabs com estilo corporativo */}
              <div className="flex flex-wrap gap-1 p-1 bg-surface-alt rounded-lg w-fit">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      'px-4 py-2 rounded-md font-medium text-sm transition-all duration-150',
                      activeTab === tab
                        ? 'text-white shadow-sm'
                        : 'text-text-muted hover:text-text hover:bg-surface-alt'
                    )}
                    style={activeTab === tab ? { backgroundColor: 'var(--brand-primary)' } : undefined}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Filtros */}
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[300px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
                  <input
                    className="h-10 w-full rounded-lg border border-border pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-border-strong transition-all bg-white"
                    placeholder="Buscar por nome, telefone ou área..."
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>

                <select
                  className="h-10 rounded-lg border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-border-strong bg-white min-w-[140px]"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="todos">Todos status</option>
                  {filters.status.map((status) => (
                    <option key={status} value={status}>
                      {statusLabel(status as Lead['status'])}
                    </option>
                  ))}
                </select>

                <select
                  className="h-10 rounded-lg border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-border-strong bg-white min-w-[140px]"
                  value={heatFilter}
                  onChange={(event) => setHeatFilter(event.target.value)}
                >
                  <option value="todos">Temperatura</option>
                  <option value="quente">Quente</option>
                  <option value="morno">Morno</option>
                  <option value="frio">Frio</option>
                </select>

                <button
                  onClick={resetFilters}
                  className="h-10 px-4 rounded-lg border border-border font-medium text-text-muted hover:bg-surface-alt hover:border-border-strong transition-all flex items-center gap-2"
                >
                  <XCircle className="h-4 w-4" />
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
              <div className="space-y-2">
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
                      className="group cursor-pointer rounded-lg border border-border p-4 transition-all duration-150 hover:shadow-md hover:border-border-strong bg-white"
                    >
                      <div className="flex flex-wrap items-center gap-4">
                        {/* Avatar */}
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-lg text-sm font-bold text-white shadow-md transition-transform group-hover:scale-105"
                          style={{ backgroundColor: 'var(--brand-primary)' }}
                        >
                          {initials}
                        </div>

                        {/* Info Principal */}
                        <div className="flex-1 min-w-[200px]">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-semibold text-text">
                              {lead.name}
                            </h3>
                            {/* Badge de Temperatura */}
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium',
                                heatBadge(lead.heat)
                              )}
                            >
                              {heatIcon(lead.heat)} {heatLabel(lead.heat)}
                            </span>
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                            <span className="flex items-center gap-1.5 bg-surface-alt px-2 py-1 rounded">
                              <Mail className="h-3.5 w-3.5 text-text-subtle" />
                              {lead.email}
                            </span>
                            <span className="flex items-center gap-1.5 bg-surface-alt px-2 py-1 rounded">
                              <Phone className="h-3.5 w-3.5 text-text-subtle" />
                              {formatPhone(lead.phone)}
                            </span>
                            {lead.area && (
                              <span className="flex items-center gap-1.5 bg-surface-alt text-text-muted px-2 py-1 rounded font-medium">
                                <Briefcase className="h-3.5 w-3.5" />
                                {lead.area}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status e Ações */}
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span
                              className={cn(
                                'inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-medium min-w-[90px]',
                                statusBadge(lead.status)
                              )}
                            >
                              {statusLabel(lead.status)}
                            </span>
                            {lead.origin && (
                              <p className="mt-1.5 text-xs text-text-subtle flex items-center gap-1 justify-end">
                                <MapPin className="h-3 w-3" />
                                {lead.origin}
                              </p>
                            )}
                          </div>

                          {/* Botões de Ação */}
                          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {canManageLeads && (
                              <>
                                <button
                                  type="button"
                                  className="h-8 w-8 flex items-center justify-center rounded-lg border border-border bg-white text-text-muted hover:bg-surface-alt hover:text-text hover:border-border-strong transition-all"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    void handleEditLead(lead.id)
                                  }}
                                  title="Editar lead"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  className="h-8 w-8 flex items-center justify-center rounded-lg border border-border bg-white text-text-muted hover:bg-surface-alt hover:text-text hover:border-border-strong transition-all"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    void handleDeleteLead(lead.id, lead.name)
                                  }}
                                  title="Excluir lead"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Seção de Encaminhar */}
                      {canManageLeads && assigningLeadId === lead.id && (
                        <div
                          className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-border-strong bg-surface-alt px-4 py-3"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <span className="text-xs font-semibold text-text">Encaminhar para:</span>
                          <select
                            className="h-9 rounded-lg border border-border px-3 text-sm bg-white focus:border-border-strong focus:ring-2 focus:ring-gray-200"
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
                            className="h-9 px-4 rounded-lg text-sm font-semibold text-white transition-all"
                            style={{ backgroundColor: 'var(--brand-primary)' }}
                            onClick={(event) => {
                              event.stopPropagation()
                              void handleEncaminharLead(lead.id)
                            }}
                          >
                            <ArrowRight className="inline mr-1.5 h-4 w-4" />
                            Encaminhar
                          </button>
                          <button
                            className="h-9 px-4 rounded-xl border border-border text-sm font-medium text-text hover:bg-white transition-colors"
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

                      {/* Último Contato */}
                      {lead.lastContactAt && (
                        <div className="mt-3 flex items-center gap-2 border-t border-border pt-3 text-xs text-text-muted">
                          <Clock className="h-3.5 w-3.5 text-text-subtle" />
                          <span>Último contato: <strong>{formatDateTime(lead.lastContactAt)}</strong></span>
                          {lead.owner && (
                            <>
                              <span className="mx-1 text-text-subtle">•</span>
                              <User className="h-3.5 w-3.5 text-text-subtle" />
                              <span>Responsável: <strong>{lead.owner}</strong></span>
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
          --tw-ring-color: 'var(--brand-primary)';
          border-color: 'var(--brand-primary)';
        }

        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  )
}
