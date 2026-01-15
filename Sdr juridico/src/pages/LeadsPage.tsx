import * as React from 'react'
import { Search, TrendingUp, DollarSign, Clock, Zap, Phone, Mail, MessageSquare, ArrowUpRight, Filter, ArrowLeft, Save, User, MapPin, Briefcase } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

import { LeadDrawer } from '@/components/LeadDrawer'
import { PageState } from '@/components/PageState'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import heroLight from '@/assets/hero-light.svg'
import type { Lead } from '@/types/domain'
import { formatDateTime, formatPhone } from '@/utils/format'
import { useLeads } from '@/hooks/useLeads'
import { useCasos } from '@/hooks/useCasos'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/utils/cn'
import type { LeadRow } from '@/lib/supabaseClient'

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
  const { leads, loading, error, createLead } = useLeads()
  const { casos } = useCasos()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [params] = useSearchParams()
  const [query, setQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('todos')
  const [heatFilter, setHeatFilter] = React.useState('todos')
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null)
  const [activeTab, setActiveTab] = React.useState('Todos')
  const [showNewLeadForm, setShowNewLeadForm] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  // Estado do formulário de novo lead
  const [formData, setFormData] = React.useState({
    nome: '',
    email: '',
    telefone: '',
    empresa: '',
    area: '',
    origem: '',
    status: 'novo' as LeadRow['status'],
    heat: 'frio' as LeadRow['heat'],
    observacoes: '',
  })

  const tabs = ['Todos', 'Quentes 🔥', 'Em Negociação 💰', 'Fechados ✅']

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
      
      // Filtro por aba
      if (activeTab === 'Quentes 🔥') return matchesQuery && matchesStatus && lead.heat === 'quente'
      if (activeTab === 'Em Negociação 💰') return matchesQuery && matchesHeat && ['proposta', 'qualificado'].includes(lead.status)
      if (activeTab === 'Fechados ✅') return matchesQuery && matchesHeat && ['ganho', 'perdido'].includes(lead.status)
      
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

  const relatedCase = selectedLead
    ? casos.find((caso) => caso.leadId === selectedLead.id)
    : undefined

  const resetFilters = () => {
    setQuery('')
    setStatusFilter('todos')
    setHeatFilter('todos')
  }

  const handleSaveLead = async () => {
    if (!formData.nome || !formData.email || !formData.telefone) {
      alert('Por favor, preencha os campos obrigatórios: Nome, Email e Telefone')
      return
    }

    setSaving(true)
    try {
      await createLead({
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        empresa: formData.empresa || null,
        area: formData.area || null,
        origem: formData.origem || null,
        status: formData.status,
        heat: formData.heat,
        ultimo_contato: null,
        responsavel: null,
        observacoes: formData.observacoes || null,
      })
      
      // Resetar formulário e voltar para lista
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        empresa: '',
        area: '',
        origem: '',
        status: 'novo',
        heat: 'frio',
        observacoes: '',
      })
      setShowNewLeadForm(false)
    } catch (error) {
      alert('Erro ao salvar lead. Tente novamente.')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  // Se está mostrando formulário de novo lead
  if (showNewLeadForm) {
    return (
      <div
        className={cn(
          'min-h-screen pb-12',
          isDark ? 'bg-[#0e1116] text-slate-100' : 'bg-[#fff6e9] text-[#1d1d1f]',
        )}
      >
        <div className="space-y-6">
          {/* Header */}
          <header
            className={cn(
              'relative overflow-hidden rounded-3xl border p-8 shadow-2xl',
              isDark
                ? 'border-slate-800 bg-gradient-to-br from-[#141820] via-[#1a1f2e] to-[#0b0f14]'
                : 'border-[#f3c988] bg-gradient-to-br from-[#ffedd5] via-[#fff3e0] to-[#ffe0b2]',
            )}
          >
            <div
              className={cn(
                'absolute inset-0 bg-no-repeat bg-right bg-[length:520px]',
                isDark ? 'opacity-10' : 'opacity-50',
              )}
              style={{ backgroundImage: `url(${heroLight})` }}
            />
            <div className="relative z-10">
              <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'rounded-full p-2',
                      isDark ? 'bg-emerald-500/10' : 'bg-emerald-500/20'
                    )}>
                      <Zap className={cn('h-5 w-5', isDark ? 'text-emerald-400' : 'text-emerald-600')} />
                    </div>
                    <p
                      className={cn(
                        'text-xs font-bold uppercase tracking-[0.3em]',
                        isDark ? 'text-emerald-300' : 'text-emerald-700',
                      )}
                    >
                      Novo Lead
                    </p>
                  </div>
                  <h2 className={cn('font-display text-4xl font-bold', isDark ? 'text-slate-100' : 'text-[#2a1400]')}>
                    Adicionar Oportunidade
                  </h2>
                  <p className={cn('text-base', isDark ? 'text-slate-400' : 'text-[#7a4a1a]')}>
                    Preencha os dados do novo lead para adicionar ao pipeline
                  </p>
                </div>
                <Button 
                  onClick={() => setShowNewLeadForm(false)}
                  variant="outline"
                  className={cn(
                    'h-14 rounded-full px-8 font-bold shadow-lg transition-all hover:scale-105',
                    isDark 
                      ? 'border-slate-700 hover:bg-slate-800'
                      : 'border-[#f3c988] hover:bg-[#fff3e0]'
                  )}
                >
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Voltar
                </Button>
              </div>
            </div>
          </header>

          {/* Formulário */}
          <Card
            className={cn(
              'border',
              isDark ? 'border-slate-800 bg-slate-900/70' : 'border-[#f0d9b8] bg-white/95',
            )}
          >
            <CardContent className="p-8">
              <form className="space-y-6">
                {/* Informações Pessoais */}
                <div>
                  <h3 className={cn('mb-4 text-lg font-bold', isDark ? 'text-slate-100' : 'text-[#2a1400]')}>
                    Informações do Lead
                  </h3>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className={cn('text-sm font-semibold', isDark ? 'text-slate-300' : 'text-slate-700')}>
                        Nome Completo *
                      </label>
                      <div className="relative">
                        <User className={cn('absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-slate-400')} />
                        <input
                          type="text"
                          required
                          value={formData.nome}
                          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                          className={cn(
                            'h-12 w-full rounded-xl border-2 pl-12 pr-4 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-4',
                            isDark
                              ? 'border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20'
                              : 'border-[#f0d9b8] bg-white text-[#2a1400] placeholder:text-[#9a5b1e] focus:border-emerald-500 focus:ring-emerald-200',
                          )}
                          placeholder="Digite o nome completo"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className={cn('text-sm font-semibold', isDark ? 'text-slate-300' : 'text-slate-700')}>
                        Email *
                      </label>
                      <div className="relative">
                        <Mail className={cn('absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-slate-400')} />
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className={cn(
                            'h-12 w-full rounded-xl border-2 pl-12 pr-4 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-4',
                            isDark
                              ? 'border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20'
                              : 'border-[#f0d9b8] bg-white text-[#2a1400] placeholder:text-[#9a5b1e] focus:border-emerald-500 focus:ring-emerald-200',
                          )}
                          placeholder="email@exemplo.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className={cn('text-sm font-semibold', isDark ? 'text-slate-300' : 'text-slate-700')}>
                        Telefone *
                      </label>
                      <div className="relative">
                        <Phone className={cn('absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-slate-400')} />
                        <input
                          type="tel"
                          required
                          value={formData.telefone}
                          onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                          className={cn(
                            'h-12 w-full rounded-xl border-2 pl-12 pr-4 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-4',
                            isDark
                              ? 'border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20'
                              : 'border-[#f0d9b8] bg-white text-[#2a1400] placeholder:text-[#9a5b1e] focus:border-emerald-500 focus:ring-emerald-200',
                          )}
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className={cn('text-sm font-semibold', isDark ? 'text-slate-300' : 'text-slate-700')}>
                        Empresa
                      </label>
                      <div className="relative">
                        <Briefcase className={cn('absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-slate-400')} />
                        <input
                          type="text"
                          value={formData.empresa}
                          onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                          className={cn(
                            'h-12 w-full rounded-xl border-2 pl-12 pr-4 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-4',
                            isDark
                              ? 'border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20'
                              : 'border-[#f0d9b8] bg-white text-[#2a1400] placeholder:text-[#9a5b1e] focus:border-emerald-500 focus:ring-emerald-200',
                          )}
                          placeholder="Nome da empresa"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className={cn('text-sm font-semibold', isDark ? 'text-slate-300' : 'text-slate-700')}>
                        Origem
                      </label>
                      <div className="relative">
                        <MapPin className={cn('absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-slate-400')} />
                        <input
                          type="text"
                          value={formData.origem}
                          onChange={(e) => setFormData({ ...formData, origem: e.target.value })}
                          className={cn(
                            'h-12 w-full rounded-xl border-2 pl-12 pr-4 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-4',
                            isDark
                              ? 'border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20'
                              : 'border-[#f0d9b8] bg-white text-[#2a1400] placeholder:text-[#9a5b1e] focus:border-emerald-500 focus:ring-emerald-200',
                          )}
                          placeholder="Ex: Website, Indicação, Redes Sociais"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detalhes do Lead */}
                <div>
                  <h3 className={cn('mb-4 text-lg font-bold', isDark ? 'text-slate-100' : 'text-[#2a1400]')}>
                    Detalhes da Oportunidade
                  </h3>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className={cn('text-sm font-semibold', isDark ? 'text-slate-300' : 'text-slate-700')}>
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as LeadRow['status'] })}
                        className={cn(
                          'h-12 w-full rounded-xl border-2 px-4 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-4',
                          isDark
                            ? 'border-slate-700 bg-slate-800 text-slate-100 focus:border-emerald-500 focus:ring-emerald-500/20'
                            : 'border-[#f0d9b8] bg-white text-[#2a1400] focus:border-emerald-500 focus:ring-emerald-200',
                        )}
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
                      <label className={cn('text-sm font-semibold', isDark ? 'text-slate-300' : 'text-slate-700')}>
                        Temperatura
                      </label>
                      <select
                        value={formData.heat}
                        onChange={(e) => setFormData({ ...formData, heat: e.target.value as LeadRow['heat'] })}
                        className={cn(
                          'h-12 w-full rounded-xl border-2 px-4 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-4',
                          isDark
                            ? 'border-slate-700 bg-slate-800 text-slate-100 focus:border-emerald-500 focus:ring-emerald-500/20'
                            : 'border-[#f0d9b8] bg-white text-[#2a1400] focus:border-emerald-500 focus:ring-emerald-200',
                        )}
                      >
                        <option value="frio">Frio</option>
                        <option value="morno">Morno</option>
                        <option value="quente">Quente</option>
                      </select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className={cn('text-sm font-semibold', isDark ? 'text-slate-300' : 'text-slate-700')}>
                        Area de Interesse
                      </label>
                      <div className="relative">
                        <Briefcase className={cn('absolute left-4 top-4 h-5 w-5', isDark ? 'text-slate-500' : 'text-slate-400')} />
                        <input
                          type="text"
                          value={formData.area}
                          onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                          className={cn(
                            'h-12 w-full rounded-xl border-2 pl-12 pr-4 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-4',
                            isDark
                              ? 'border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20'
                              : 'border-[#f0d9b8] bg-white text-[#2a1400] placeholder:text-[#9a5b1e] focus:border-emerald-500 focus:ring-emerald-200',
                          )}
                          placeholder="Ex: Consultoria jurídica, Contrato empresarial"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className={cn('text-sm font-semibold', isDark ? 'text-slate-300' : 'text-slate-700')}>
                        Resumo / Observações
                      </label>
                      <textarea
                        value={formData.observacoes}
                        onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                        rows={4}
                        className={cn(
                          'w-full rounded-xl border-2 p-4 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-4',
                          isDark
                            ? 'border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20'
                            : 'border-[#f0d9b8] bg-white text-[#2a1400] placeholder:text-[#9a5b1e] focus:border-emerald-500 focus:ring-emerald-200',
                        )}
                        placeholder="Descreva informações adicionais sobre o lead..."
                      />
                    </div>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex flex-wrap gap-4 pt-4">
                  <Button
                    type="button"
                    onClick={handleSaveLead}
                    disabled={saving}
                    className={cn(
                      'h-14 flex-1 rounded-xl px-8 font-bold shadow-xl transition-all hover:scale-105 disabled:opacity-50',
                      isDark 
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600'
                    )}
                  >
                    <Save className="mr-2 h-5 w-5" />
                    {saving ? 'Salvando...' : 'Salvar Lead'}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowNewLeadForm(false)}
                    variant="outline"
                    className={cn(
                      'h-14 rounded-xl border-2 px-8 font-bold transition-all hover:scale-105',
                      isDark
                        ? 'border-slate-700 hover:bg-slate-800'
                        : 'border-[#f0d9b8] hover:bg-[#fff3e0]'
                    )}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'min-h-screen pb-12',
        isDark ? 'bg-[#0e1116] text-slate-100' : 'bg-[#fff6e9] text-[#1d1d1f]',
      )}
    >
      <div className="space-y-6">
        {/* Header com gradiente moderno voltado para vendas */}
        <header
          className={cn(
            'relative overflow-hidden rounded-3xl border p-8 shadow-2xl',
            isDark
              ? 'border-slate-800 bg-gradient-to-br from-[#141820] via-[#1a1f2e] to-[#0b0f14]'
              : 'border-[#f3c988] bg-gradient-to-br from-[#ffedd5] via-[#fff3e0] to-[#ffe0b2]',
          )}
        >
          <div
            className={cn(
              'absolute inset-0 bg-no-repeat bg-right bg-[length:520px]',
              isDark ? 'opacity-10' : 'opacity-50',
            )}
            style={{ backgroundImage: `url(${heroLight})` }}
          />
          <div className="relative z-10">
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'rounded-full p-2',
                    isDark ? 'bg-emerald-500/10' : 'bg-emerald-500/20'
                  )}>
                    <TrendingUp className={cn('h-5 w-5', isDark ? 'text-emerald-400' : 'text-emerald-600')} />
                  </div>
                  <p
                    className={cn(
                      'text-xs font-bold uppercase tracking-[0.3em]',
                      isDark ? 'text-emerald-300' : 'text-emerald-700',
                    )}
                  >
                    Pipeline de Vendas
                  </p>
                </div>
                <h2 className={cn('font-display text-4xl font-bold', isDark ? 'text-slate-100' : 'text-[#2a1400]')}>
                  Gestão de Leads
                </h2>
                <p className={cn('text-base', isDark ? 'text-slate-400' : 'text-[#7a4a1a]')}>
                  Acompanhe oportunidades e impulsione suas vendas
                </p>
              </div>
              <Button 
                onClick={() => setShowNewLeadForm(true)}
                className={cn(
                  'group h-14 rounded-full px-8 font-bold shadow-xl transition-all hover:scale-105 hover:shadow-2xl',
                  isDark 
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600'
                )}
              >
                <Zap className="mr-2 h-5 w-5 transition-transform group-hover:rotate-12" />
                Novo Lead
                <ArrowUpRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </Button>
            </div>
          </div>
        </header>

        {/* Cards de métricas - estilo CRM de vendas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className={cn(
            'group border transition-all duration-300 hover:scale-105 hover:shadow-xl',
            isDark ? 'border-slate-800 bg-slate-900/70 hover:border-blue-500/50' : 'border-[#f0d9b8] bg-white hover:border-blue-500/30'
          )}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className={cn('text-sm font-semibold', isDark ? 'text-slate-400' : 'text-slate-600')}>
                    Total Pipeline
                  </p>
                  <p className="text-4xl font-bold tracking-tight">{metrics.total}</p>
                  <p className={cn('text-xs font-medium', isDark ? 'text-slate-500' : 'text-slate-500')}>
                    oportunidades ativas
                  </p>
                </div>
                <div className={cn(
                  'rounded-2xl p-4 transition-colors',
                  isDark ? 'bg-blue-500/10 group-hover:bg-blue-500/20' : 'bg-blue-50 group-hover:bg-blue-100'
                )}>
                  <TrendingUp className={cn('h-8 w-8', isDark ? 'text-blue-400' : 'text-blue-600')} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(
            'group border transition-all duration-300 hover:scale-105 hover:shadow-xl',
            isDark ? 'border-slate-800 bg-slate-900/70 hover:border-red-500/50' : 'border-[#f0d9b8] bg-white hover:border-red-500/30'
          )}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className={cn('text-sm font-semibold', isDark ? 'text-slate-400' : 'text-slate-600')}>
                    Leads Quentes
                  </p>
                  <p className="text-4xl font-bold tracking-tight text-red-500">{metrics.quentes}</p>
                  <p className={cn('text-xs font-medium uppercase', isDark ? 'text-red-400' : 'text-red-600')}>
                    🔥 Ação Imediata
                  </p>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-red-500/10 to-orange-500/10 p-4 group-hover:from-red-500/20 group-hover:to-orange-500/20">
                  <Zap className="h-8 w-8 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(
            'group border transition-all duration-300 hover:scale-105 hover:shadow-xl',
            isDark ? 'border-slate-800 bg-slate-900/70 hover:border-amber-500/50' : 'border-[#f0d9b8] bg-white hover:border-amber-500/30'
          )}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className={cn('text-sm font-semibold', isDark ? 'text-slate-400' : 'text-slate-600')}>
                    Em Negociação
                  </p>
                  <p className="text-4xl font-bold tracking-tight text-amber-500">{metrics.emNegociacao}</p>
                  <p className={cn('text-xs font-medium', isDark ? 'text-amber-400' : 'text-amber-600')}>
                    💰 propostas ativas
                  </p>
                </div>
                <div className={cn(
                  'rounded-2xl p-4 transition-colors',
                  'bg-amber-500/10 group-hover:bg-amber-500/20'
                )}>
                  <Clock className={cn('h-8 w-8', isDark ? 'text-amber-400' : 'text-amber-600')} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(
            'group border transition-all duration-300 hover:scale-105 hover:shadow-xl',
            isDark ? 'border-slate-800 bg-slate-900/70 hover:border-emerald-500/50' : 'border-[#f0d9b8] bg-white hover:border-emerald-500/30'
          )}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className={cn('text-sm font-semibold', isDark ? 'text-slate-400' : 'text-slate-600')}>
                    Taxa de Conversão
                  </p>
                  <p className="text-4xl font-bold tracking-tight text-emerald-500">{metrics.taxaConversao}%</p>
                  <p className={cn('text-xs font-medium', isDark ? 'text-emerald-400' : 'text-emerald-600')}>
                    ✅ {metrics.ganhos} fechamentos
                  </p>
                </div>
                <div className={cn(
                  'rounded-2xl p-4 transition-colors',
                  'bg-emerald-500/10 group-hover:bg-emerald-500/20'
                )}>
                  <DollarSign className={cn('h-8 w-8', isDark ? 'text-emerald-400' : 'text-emerald-600')} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Leads - Design Moderno */}
        <Card
          className={cn(
            'border',
            isDark ? 'border-slate-800 bg-slate-900/70' : 'border-[#f0d9b8] bg-white/95',
          )}
        >
          <CardContent className="p-6 space-y-5">
            {/* Tabs e Filtros */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      'rounded-full border-2 px-6 py-2.5 text-sm font-bold transition-all',
                      activeTab === tab
                        ? isDark
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-lg shadow-emerald-500/20'
                          : 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-lg shadow-emerald-500/10'
                        : isDark
                          ? 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
                          : 'border-[#f0d9b8] bg-white text-[#7a4a1a] hover:border-emerald-400 hover:bg-[#fff3e0]'
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                {/* Barra de Busca */}
                <div className="relative flex-1 min-w-[300px]">
                  <Search className={cn(
                    'absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2',
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  )} />
                  <input
                    className={cn(
                      'h-12 w-full rounded-xl border-2 pl-12 pr-4 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-4',
                      isDark
                        ? 'border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20'
                        : 'border-[#f0d9b8] bg-white text-[#2a1400] placeholder:text-[#9a5b1e] focus:border-emerald-500 focus:ring-emerald-200',
                    )}
                    placeholder="Buscar por nome, telefone ou área..."
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>

                {/* Filtros */}
                <select
                  className={cn(
                    'h-12 rounded-xl border-2 px-4 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-4',
                    isDark
                      ? 'border-slate-700 bg-slate-800 text-slate-100 focus:border-emerald-500 focus:ring-emerald-500/20'
                      : 'border-[#f0d9b8] bg-white text-[#2a1400] focus:border-emerald-500 focus:ring-emerald-200',
                  )}
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="todos">📊 Todos Status</option>
                  {filters.status.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>

                <select
                  className={cn(
                    'h-12 rounded-xl border-2 px-4 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-4',
                    isDark
                      ? 'border-slate-700 bg-slate-800 text-slate-100 focus:border-emerald-500 focus:ring-emerald-500/20'
                      : 'border-[#f0d9b8] bg-white text-[#2a1400] focus:border-emerald-500 focus:ring-emerald-200',
                  )}
                  value={heatFilter}
                  onChange={(event) => setHeatFilter(event.target.value)}
                >
                  <option value="todos">🌡️ Temperatura</option>
                  {filters.heat.map((heat) => (
                    <option key={heat} value={heat}>
                      {heat}
                    </option>
                  ))}
                </select>

                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className={cn(
                    'h-12 rounded-xl border-2 px-6 font-semibold',
                    isDark
                      ? 'border-slate-700 hover:bg-slate-800'
                      : 'border-[#f0d9b8] hover:bg-[#fff3e0]'
                  )}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Limpar
                </Button>
              </div>
            </div>

            {/* Lista de Leads - Cards Modernos */}
            <PageState
              status={pageState}
              emptyTitle="Nenhum lead encontrado"
              emptyDescription="Ajuste os filtros ou adicione novos leads ao pipeline."
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
                      className={cn(
                        'group cursor-pointer rounded-2xl border-2 p-5 transition-all hover:scale-[1.01] hover:shadow-xl',
                        isDark
                          ? 'border-slate-800 bg-slate-800/50 hover:border-emerald-500/50 hover:bg-slate-800'
                          : 'border-[#f0d9b8] bg-white hover:border-emerald-400 hover:bg-emerald-50/30',
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-4">
                        {/* Avatar */}
                        <div className={cn(
                          'flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-bold shadow-lg transition-transform group-hover:scale-110',
                          isDark
                            ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white'
                            : 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white'
                        )}>
                          {initials}
                        </div>

                        {/* Informações */}
                        <div className="flex-1 min-w-[200px]">
                          <div className="flex items-center gap-2">
                            <h3 className={cn(
                              'text-lg font-bold',
                              isDark ? 'text-slate-100' : 'text-[#2a1400]'
                            )}>
                              {lead.name}
                            </h3>
                            <span
                              className={cn(
                                'inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-bold',
                                heatPill(lead.heat)
                              )}
                            >
                              {lead.heat === 'quente' ? '🔥' : lead.heat === 'morno' ? '⚡' : '❄️'}
                              {lead.heat}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
                            <span className={cn('flex items-center gap-1', isDark ? 'text-slate-400' : 'text-slate-600')}>
                              <Mail className="h-4 w-4" />
                              {lead.email}
                            </span>
                            <span className={cn('flex items-center gap-1', isDark ? 'text-slate-400' : 'text-slate-600')}>
                              <Phone className="h-4 w-4" />
                              {formatPhone(lead.phone)}
                            </span>
                          </div>
                        </div>

                        {/* Status e Ações */}
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span
                              className={cn(
                                'inline-flex rounded-xl border-2 px-4 py-1.5 text-sm font-bold capitalize',
                                statusPill(lead.status)
                              )}
                            >
                              {lead.status}
                            </span>
                            <p className={cn('mt-1 text-xs font-medium', isDark ? 'text-slate-500' : 'text-slate-500')}>
                              {lead.area}
                            </p>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <Button
                              size="sm"
                              className={cn(
                                'h-9 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 font-semibold shadow-md hover:from-emerald-500 hover:to-teal-500'
                              )}
                              onClick={(e) => {
                                e.stopPropagation()
                                // Ação de contato
                              }}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Rodapé do Card */}
                      {lead.lastContactAt && (
                        <div className={cn(
                          'mt-3 flex items-center gap-2 border-t pt-3 text-xs font-medium',
                          isDark ? 'border-slate-700 text-slate-500' : 'border-slate-200 text-slate-500'
                        )}>
                          <Clock className="h-3.5 w-3.5" />
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
          </CardContent>
        </Card>
      </div>

      <LeadDrawer
        open={Boolean(selectedLead)}
        lead={selectedLead}
        relatedCase={relatedCase}
        onClose={() => setSelectedLead(null)}
      />
    </div>
  )
}
