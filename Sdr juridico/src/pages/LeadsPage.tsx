import * as React from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useSearchParams, Link } from 'react-router-dom'

import { LeadDrawer } from '@/components/LeadDrawer'
import { Modal } from '@/components/ui/modal'
import { PageState } from '@/components/PageState'
import type { Lead } from '@/types/domain'
import { formatDateTime, formatPhone } from '@/utils/format'
import { useLeads } from '@/hooks/useLeads'
import { useCasos } from '@/hooks/useCasos'
import { useOrganization } from '@/hooks/useOrganization'
import { useAdvogados } from '@/hooks/useAdvogados'
import { cn } from '@/utils/cn'
import type { LeadRow } from '@/lib/supabaseClient'
import { leadsService } from '@/services/leadsService'

// suppress unused warning — formatDateTime used elsewhere in codebase pattern
void formatDateTime

const resolveStatus = (value: string | null): 'loading' | 'empty' | 'error' | 'ready' => {
  if (value === 'loading' || value === 'empty' || value === 'error') return value
  return 'ready'
}

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
    novo: 'Novo', em_contato: 'Em Contato', qualificado: 'Qualificado',
    proposta: 'Proposta', ganho: 'Ganho', perdido: 'Perdido',
  }
  return labels[status] || status
}

const heatBadge = (heat: Lead['heat']) => {
  const badges: Record<Lead['heat'], string> = {
    quente: 'bg-red-50 text-red-700 border border-red-200',
    morno: 'bg-amber-50 text-amber-700 border border-amber-200',
    frio: 'bg-blue-50 text-blue-700 border border-blue-200',
  }
  return badges[heat] || badges.frio
}

const heatLabel = (heat: Lead['heat']) => {
  const labels: Record<Lead['heat'], string> = { quente: 'Quente', morno: 'Morno', frio: 'Frio' }
  return labels[heat] || heat
}

const heatDotClass = (heat: Lead['heat']) => {
  if (heat === 'quente') return 'bg-red-500'
  if (heat === 'morno') return 'bg-amber-400'
  return 'bg-blue-400'
}

export const LeadsPage = () => {
  const { leads, loading, error, fetchLeads, createLead, updateLead, deleteLead, assignLeadAdvogado } = useLeads()
  const { casos } = useCasos()
  const { currentRole, isFartechAdmin, currentOrg } = useOrganization()
  const canManageLeads = isFartechAdmin || ['org_admin', 'gestor', 'admin'].includes(currentRole || '')
  const { advogados } = useAdvogados(currentOrg?.id || null, canManageLeads)
  const [params, setParams] = useSearchParams()
  const query        = params.get('q')      ?? ''
  const statusFilter = params.get('status') ?? 'todos'
  const heatFilter   = params.get('heat')   ?? 'todos'
  const activeTab    = params.get('tab')    ?? 'Todos'

  const setQuery        = (v: string) => setParams(p => { v ? p.set('q', v) : p.delete('q'); return p })
  const setStatusFilter = (v: string) => setParams(p => { v !== 'todos' ? p.set('status', v) : p.delete('status'); return p })
  const setHeatFilter   = (v: string) => setParams(p => { v !== 'todos' ? p.set('heat', v) : p.delete('heat'); return p })
  const setActiveTab    = (v: string) => setParams(p => { v !== 'Todos' ? p.set('tab', v) : p.delete('tab'); return p })

  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null)
  const [showNewLeadForm, setShowNewLeadForm] = React.useState(false)
  const [editingLeadId, setEditingLeadId] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [assigningLeadId, setAssigningLeadId] = React.useState<string | null>(null)
  const [selectedAdvogadoId, setSelectedAdvogadoId] = React.useState('')

  const initialFormData = React.useMemo(() => ({
    nome: '', email: '', telefone: '', empresa: '', area: '', origem: '',
    status: 'novo' as LeadRow['status'],
    heat: 'frio' as LeadRow['heat'],
    observacoes: '',
    responsavelId: '',
  }), [])

  const [formData, setFormData] = React.useState(initialFormData)
  const isEditing = Boolean(editingLeadId)

  const [emailValido, setEmailValido] = React.useState<boolean | null>(null)
  const [validandoEmail, setValidandoEmail] = React.useState(false)
  const [emailInfo, setEmailInfo] = React.useState<string | null>(null)

  const validarEmail = React.useCallback(async (email: string) => {
    if (!email || !email.includes('@') || !email.includes('.')) {
      setEmailValido(null); setEmailInfo(null); return
    }
    setValidandoEmail(true)
    try {
      const res = await fetch(`https://api.eva.pingutil.com/email?email=${encodeURIComponent(email)}`)
      const data = await res.json()
      if (data.status === 'success' && data.data) {
        const d = data.data
        const valido = d.valid_syntax && d.deliverable && !d.disposable && !d.spam
        setEmailValido(valido)
        if (!d.valid_syntax) setEmailInfo('Formato inválido')
        else if (d.disposable) setEmailInfo('E-mail temporário/descartável')
        else if (d.spam) setEmailInfo('E-mail marcado como spam')
        else if (!d.deliverable) setEmailInfo('E-mail não entregável')
        else setEmailInfo(d.webmail ? 'Webmail válido' : 'E-mail corporativo válido')
      } else { setEmailValido(null); setEmailInfo(null) }
    } catch { setEmailValido(null); setEmailInfo(null) }
    finally { setValidandoEmail(false) }
  }, [])

  const tabs = ['Todos', 'Quentes', 'Em negociacao', 'Fechados']

  const metrics = React.useMemo(() => {
    const total = leads.length
    const quentes = leads.filter(l => l.heat === 'quente').length
    const emNegociacao = leads.filter(l => ['proposta', 'qualificado'].includes(l.status)).length
    const ganhos = leads.filter(l => l.status === 'ganho').length
    const taxaConversao = total > 0 ? ((ganhos / total) * 100).toFixed(1) : '0'
    return { total, quentes, emNegociacao, ganhos, taxaConversao }
  }, [leads])

  const advogadoMap = React.useMemo(
    () => new Map(advogados.map(a => [a.id, a.nome])),
    [advogados]
  )

  const resolveOwner = React.useCallback((owner: string) => {
    if (!owner || owner === 'Nao atribuido') return '-'
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(owner)) {
      return advogadoMap.get(owner) || '-'
    }
    return owner
  }, [advogadoMap])

  const filters = React.useMemo(() => ({
    status: Array.from(new Set(leads.map(l => l.status))),
  }), [leads])

  const filteredLeads = React.useMemo(() => {
    const term = query.trim().toLowerCase()
    return leads.filter(lead => {
      const matchesQuery = !term ||
        lead.name.toLowerCase().includes(term) ||
        lead.area.toLowerCase().includes(term) ||
        lead.phone.replace(/\D/g, '').includes(term.replace(/\D/g, ''))
      const matchesStatus = statusFilter === 'todos' || lead.status === statusFilter
      const matchesHeat = heatFilter === 'todos' || lead.heat === heatFilter
      if (activeTab === 'Quentes') return matchesQuery && matchesStatus && lead.heat === 'quente'
      if (activeTab === 'Em negociacao') return matchesQuery && matchesHeat && ['proposta', 'qualificado'].includes(lead.status)
      if (activeTab === 'Fechados') return matchesQuery && matchesHeat && ['ganho', 'perdido'].includes(lead.status)
      return matchesQuery && matchesStatus && matchesHeat
    })
  }, [query, statusFilter, heatFilter, activeTab, leads])

  const forcedState = resolveStatus(params.get('state'))
  const baseState = loading ? 'loading' : error ? 'error' : filteredLeads.length === 0 ? 'empty' : 'ready'
  const pageState = forcedState !== 'ready' ? forcedState : baseState

  const emptyAction = canManageLeads ? (
    <button
      type="button"
      className="rounded-lg px-4 py-2 text-sm font-medium text-white"
      style={{ backgroundColor: 'var(--brand-primary)' }}
      onClick={() => { resetLeadForm(); setShowNewLeadForm(true) }}
    >
      Novo lead
    </button>
  ) : null

  const relatedCase = selectedLead ? casos.find(c => c.leadId === selectedLead.id) : undefined

  const resetFilters = () => setParams(p => { p.delete('q'); p.delete('status'); p.delete('heat'); p.delete('tab'); return p })
  const resetLeadForm = () => { setFormData(initialFormData); setEditingLeadId(null) }

  const handleEditLead = async (leadId: string) => {
    if (!canManageLeads) { toast.error('Apenas gestores podem editar leads.'); return }
    setSaving(true)
    try {
      const lead = await leadsService.getLead(leadId)
      setFormData({
        nome: lead.nome || '', email: lead.email || '', telefone: lead.telefone || '',
        empresa: lead.empresa || '', area: lead.area || '', origem: lead.origem || '',
        status: lead.status, heat: lead.heat, observacoes: lead.observacoes || '',
        responsavelId: lead.assigned_user_id || '',
      })
      setEditingLeadId(leadId)
      setShowNewLeadForm(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar lead para edição')
    } finally { setSaving(false) }
  }

  const handleDeleteLead = async (leadId: string, leadName: string) => {
    if (!canManageLeads) { toast.error('Apenas gestores podem excluir leads.'); return }
    if (!window.confirm(`Excluir o lead "${leadName}"? Essa ação não pode ser desfeita.`)) return
    try {
      await deleteLead(leadId)
      toast.success(`Lead excluído: ${leadName}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir lead')
    }
  }

  const handleEncaminharLead = async (leadId: string) => {
    if (!selectedAdvogadoId) { toast.error('Selecione um advogado para encaminhar.'); return }
    const advogado = advogados.find(a => a.id === selectedAdvogadoId)
    if (!advogado) { toast.error('Advogado não encontrado.'); return }
    try {
      await assignLeadAdvogado(leadId, advogado.id, advogado.nome)
      toast.success(`Lead encaminhado para ${advogado.nome}`)
      setAssigningLeadId(null)
      setSelectedAdvogadoId('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao encaminhar lead')
    }
  }

  const handleSaveLead = async () => {
    if (!canManageLeads) { toast.error('Apenas gestores podem adicionar leads.'); return }
    if (!formData.nome || !formData.email || !formData.telefone) {
      toast.error('Preencha os campos obrigatórios: Nome, Email e Telefone')
      return
    }
    setSaving(true)
    try {
      const payload = {
        nome: formData.nome, email: formData.email, telefone: formData.telefone,
        empresa: formData.empresa || null, area: formData.area || null,
        origem: formData.origem || null, status: formData.status, heat: formData.heat,
        observacoes: formData.observacoes || null,
      }

      let savedId: string
      if (editingLeadId) {
        await updateLead(editingLeadId, payload)
        savedId = editingLeadId
        toast.success('Lead atualizado com sucesso.')
      } else {
        const created = await createLead({ ...payload, ultimo_contato: null, responsavel: null, last_contact_at: null, assigned_user_id: null })
        savedId = created.id
        toast.success('Lead criado com sucesso.')
      }

      if (formData.responsavelId) {
        const adv = advogados.find(a => a.id === formData.responsavelId)
        if (adv) {
          await assignLeadAdvogado(savedId, adv.id, adv.nome)
        }
      }

      resetLeadForm()
      setShowNewLeadForm(false)
    } catch (error) {
      toast.error('Erro ao salvar lead. Tente novamente.')
      console.error(error)
    } finally { setSaving(false) }
  }

  return (
    <div className="min-h-screen bg-surface-alt p-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl border border-border p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-text-muted mb-1">CRM · Pipeline de Vendas</p>
              <h1 className="text-2xl font-bold text-text">Gestão de Leads</h1>
              <p className="text-sm text-text-muted mt-1">Acompanhe oportunidades e gerencie conversões</p>
            </div>
            <div className="flex gap-3">
              <Link to="/app/leads/kanban"
                className="px-4 py-2 rounded-lg border border-border font-medium text-text hover:bg-surface-alt transition-colors text-sm">
                Kanban
              </Link>
              <button onClick={() => void fetchLeads()} disabled={loading}
                className="px-4 py-2 rounded-lg border border-border font-medium text-text hover:bg-surface-alt transition-colors disabled:opacity-50 text-sm">
                Atualizar
              </button>
              <button
                onClick={() => {
                  if (!canManageLeads) { toast.error('Apenas gestores podem adicionar leads.'); return }
                  resetLeadForm()
                  setShowNewLeadForm(true)
                }}
                disabled={!canManageLeads}
                className="px-6 py-2 rounded-lg font-semibold text-white transition-all disabled:opacity-50 text-sm"
                style={{ backgroundColor: 'var(--brand-primary)' }}>
                Novo Lead
              </button>
            </div>
          </div>
        </div>

        {/* KPI stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-text-muted mb-3">Pipeline</p>
            <p className="text-3xl font-bold text-text">{metrics.total}</p>
            <p className="text-sm text-text-muted mt-1">Total de Leads</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-text-muted mb-3">Prioridade</p>
            <p className="text-3xl font-bold text-text">{metrics.quentes}</p>
            <p className="text-sm text-text-muted mt-1">Leads Quentes</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-text-muted mb-3">Ativos</p>
            <p className="text-3xl font-bold text-text">{metrics.emNegociacao}</p>
            <p className="text-sm text-text-muted mt-1">Em Negociação</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-text-muted mb-3">Sucesso</p>
            <p className="text-3xl font-bold text-text">{metrics.taxaConversao}%</p>
            <p className="text-sm text-text-muted mt-1">
              Taxa de Conversão{' '}
              <span className="text-text-subtle">({metrics.ganhos} fechamentos)</span>
            </p>
          </div>
        </div>

        {/* Filters + Table */}
        <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="p-6 space-y-4">
            {/* Tabs */}
            <div className="flex flex-wrap gap-1 p-1 bg-surface-alt rounded-lg w-fit">
              {tabs.map(tab => (
                <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                  className={cn('px-4 py-2 rounded-md font-medium text-sm transition-all duration-150',
                    activeTab === tab ? 'text-white shadow-sm' : 'text-text-muted hover:text-text hover:bg-white')}
                  style={activeTab === tab ? { backgroundColor: 'var(--brand-primary)' } : undefined}>
                  {tab}
                </button>
              ))}
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-3">
              <input
                className="h-10 flex-1 min-w-[280px] rounded-lg border border-border px-4 text-sm focus:outline-none focus:ring-2"
                placeholder="Buscar por nome, telefone ou área..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="h-10 rounded-lg border border-border px-4 text-sm focus:outline-none focus:ring-2">
                <option value="todos">Todos status</option>
                {filters.status.map(s => <option key={s} value={s}>{statusLabel(s as Lead['status'])}</option>)}
              </select>
              <select value={heatFilter} onChange={e => setHeatFilter(e.target.value)}
                className="h-10 rounded-lg border border-border px-4 text-sm focus:outline-none focus:ring-2">
                <option value="todos">Temperatura</option>
                <option value="quente">Quente</option>
                <option value="morno">Morno</option>
                <option value="frio">Frio</option>
              </select>
              <button onClick={resetFilters}
                className="h-10 px-4 rounded-lg border border-border font-medium text-text-muted hover:bg-surface-alt transition-colors text-sm">
                Limpar
              </button>
            </div>

            <PageState
              status={pageState}
              emptyTitle="Nenhum lead encontrado"
              emptyDescription="Ajuste os filtros ou adicione novos leads ao pipeline."
              emptyAction={emptyAction}
              onRetry={error ? fetchLeads : undefined}
            >
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-surface-alt text-xs uppercase tracking-wider text-text-muted">
                    <tr>
                      <th className="px-4 py-3">Lead</th>
                      <th className="px-4 py-3">Contato</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Temp.</th>
                      <th className="px-4 py-3">Responsável</th>
                      <th className="px-4 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map(lead => {
                      const initials = lead.name.split(' ').map(p => p[0]).slice(0, 2).join('')
                      return (
                        <React.Fragment key={lead.id}>
                          <tr className="border-t border-border hover:bg-surface-alt cursor-pointer"
                            onClick={() => setSelectedLead(lead)}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                                  style={{ backgroundColor: 'var(--brand-primary)' }}>
                                  {initials}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className={cn('w-2 h-2 rounded-full shrink-0', heatDotClass(lead.heat))} title={heatLabel(lead.heat)} />
                                    <span className="font-medium text-text truncate">{lead.name}</span>
                                  </div>
                                  <div className="text-xs text-text-muted truncate">{lead.area || lead.origin || '-'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-text">{lead.email}</div>
                              <div className="text-xs text-text-muted">{formatPhone(lead.phone)}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-medium', statusBadge(lead.status))}>
                                {statusLabel(lead.status)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-medium', heatBadge(lead.heat))}>
                                {heatLabel(lead.heat)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-text">{resolveOwner(lead.owner)}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                                {canManageLeads && (
                                  <>
                                    <button type="button"
                                      onClick={e => { e.stopPropagation(); setAssigningLeadId(cur => cur === lead.id ? null : lead.id); setSelectedAdvogadoId('') }}
                                      className="px-2 py-1 rounded text-xs font-medium text-text-muted hover:text-text hover:bg-surface-alt">
                                      Encaminhar
                                    </button>
                                    <button type="button"
                                      onClick={e => { e.stopPropagation(); void handleEditLead(lead.id) }}
                                      className="h-8 w-8 flex items-center justify-center rounded-lg border border-border text-text-muted hover:text-text hover:bg-surface-alt transition-colors">
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <button type="button"
                                      onClick={e => { e.stopPropagation(); void handleDeleteLead(lead.id, lead.name) }}
                                      className="h-8 w-8 flex items-center justify-center rounded-lg border border-border text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                          {canManageLeads && assigningLeadId === lead.id && (
                            <tr className="border-t border-border bg-surface-alt">
                              <td colSpan={6} className="px-4 py-3">
                                <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-white px-4 py-3">
                                  <span className="text-xs font-medium text-text">Encaminhar para</span>
                                  <select className="h-8 rounded-lg border border-border px-3 text-xs bg-white"
                                    value={selectedAdvogadoId} onChange={e => setSelectedAdvogadoId(e.target.value)}>
                                    <option value="">Selecione um advogado</option>
                                    {advogados.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                                  </select>
                                  <button className="h-8 px-4 rounded-lg text-xs font-medium text-white"
                                    style={{ backgroundColor: 'var(--brand-primary)' }}
                                    onClick={() => void handleEncaminharLead(lead.id)}>
                                    Encaminhar
                                  </button>
                                  <button className="h-8 px-4 rounded-lg border border-border text-xs font-medium text-text"
                                    onClick={() => { setAssigningLeadId(null); setSelectedAdvogadoId('') }}>
                                    Cancelar
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
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

      {/* ── Modal Novo/Editar Lead ─────────────────────────────────────────────── */}
      <Modal
        open={showNewLeadForm}
        title={isEditing ? 'Editar Lead' : 'Novo Lead'}
        description={isEditing ? 'Ajuste os dados do lead' : 'Preencha os dados do novo lead'}
        onClose={() => { resetLeadForm(); setShowNewLeadForm(false) }}
        maxWidth="44rem"
        footer={
          <>
            <button
              type="button"
              onClick={() => { resetLeadForm(); setShowNewLeadForm(false) }}
              className="px-6 h-10 rounded-lg border border-border font-medium text-text hover:bg-surface-alt transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveLead}
              disabled={saving}
              className="px-6 h-10 rounded-lg font-medium text-white transition-colors disabled:opacity-50 text-sm"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            >
              {saving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Salvar Lead'}
            </button>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text">Nome completo *</label>
            <input type="text" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })}
              className="h-10 w-full rounded-lg border border-border px-4 text-sm focus:outline-none focus:ring-2"
              placeholder="Nome completo" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-text">Email *</label>
              {emailValido === true && <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 border border-green-200">Verificado</span>}
              {emailValido === false && <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 border border-red-200">Inválido</span>}
              {validandoEmail && <span className="rounded-full bg-surface-alt px-2 py-0.5 text-xs font-medium text-text-muted border border-border">Validando...</span>}
            </div>
            <input type="email" value={formData.email}
              onChange={e => { setFormData({ ...formData, email: e.target.value }); setEmailValido(null); setEmailInfo(null) }}
              onBlur={() => validarEmail(formData.email)}
              className={cn('h-10 w-full rounded-lg border px-4 text-sm focus:outline-none focus:ring-2',
                emailValido === true ? 'border-green-400 focus:ring-green-500/20' :
                emailValido === false ? 'border-red-400 focus:ring-red-500/20' :
                'border-border')}
              placeholder="email@exemplo.com" />
            {emailInfo && <p className={cn('text-xs mt-1', emailValido ? 'text-green-600' : 'text-red-500')}>{emailInfo}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text">Telefone *</label>
            <input type="tel" value={formData.telefone} onChange={e => setFormData({ ...formData, telefone: e.target.value })}
              className="h-10 w-full rounded-lg border border-border px-4 text-sm focus:outline-none focus:ring-2"
              placeholder="(00) 00000-0000" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text">Empresa</label>
            <input type="text" value={formData.empresa} onChange={e => setFormData({ ...formData, empresa: e.target.value })}
              className="h-10 w-full rounded-lg border border-border px-4 text-sm focus:outline-none focus:ring-2"
              placeholder="Nome da empresa" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text">Área de interesse</label>
            <input type="text" value={formData.area} onChange={e => setFormData({ ...formData, area: e.target.value })}
              className="h-10 w-full rounded-lg border border-border px-4 text-sm focus:outline-none focus:ring-2"
              placeholder="Ex: Família, Trabalhista" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text">Origem</label>
            <input type="text" value={formData.origem} onChange={e => setFormData({ ...formData, origem: e.target.value })}
              className="h-10 w-full rounded-lg border border-border px-4 text-sm focus:outline-none focus:ring-2"
              placeholder="Ex: Website, Indicação" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text">Status</label>
            <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as LeadRow['status'] })}
              className="h-10 w-full rounded-lg border border-border px-4 text-sm focus:outline-none focus:ring-2">
              <option value="novo">Novo</option>
              <option value="em_contato">Em Contato</option>
              <option value="qualificado">Qualificado</option>
              <option value="proposta">Proposta</option>
              <option value="ganho">Ganho</option>
              <option value="perdido">Perdido</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text">Temperatura</label>
            <select value={formData.heat} onChange={e => setFormData({ ...formData, heat: e.target.value as LeadRow['heat'] })}
              className="h-10 w-full rounded-lg border border-border px-4 text-sm focus:outline-none focus:ring-2">
              <option value="frio">Frio</option>
              <option value="morno">Morno</option>
              <option value="quente">Quente</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text">Responsável</label>
            <select value={formData.responsavelId} onChange={e => setFormData({ ...formData, responsavelId: e.target.value })}
              className="h-10 w-full rounded-lg border border-border px-4 text-sm focus:outline-none focus:ring-2">
              <option value="">Sem responsável</option>
              {advogados.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-text">Observações</label>
            <textarea value={formData.observacoes} onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
              rows={3} className="w-full rounded-lg border border-border p-4 text-sm focus:outline-none focus:ring-2"
              placeholder="Informações adicionais sobre o lead..." />
          </div>
        </div>
      </Modal>
    </div>
  )
}
