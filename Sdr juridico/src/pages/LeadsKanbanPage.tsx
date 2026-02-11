import * as React from 'react'
import { Plus, Search, MoreVertical, X, User, Phone, Mail, DollarSign, Flame, Sun, Snowflake, Trash2, RotateCcw, History, MessageSquare, Calendar, Building2, List, ArrowRightCircle, BarChart3, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { Link, useNavigate } from 'react-router-dom'

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

import { Modal } from '@/components/ui/modal'
import { LoadingState, ErrorState } from '@/components/StateComponents'
import type { Lead } from '@/types/domain'
import { cn } from '@/utils/cn'
import { formatDateTime, formatPhone } from '@/utils/format'
import { useLeads } from '@/hooks/useLeads'
import { supabase } from '@/lib/supabaseClient'

type StatusKey = Lead['status']
type HeatKey = Lead['heat']

const STATUS_LABELS: Record<StatusKey, string> = {
  novo: 'Novos',
  em_contato: 'Em Contato',
  qualificado: 'Qualificados',
  proposta: 'Proposta',
  ganho: 'Ganhos',
  perdido: 'Perdidos',
}

const STATUS_COLORS: Record<StatusKey, string> = {
  novo: 'bg-slate-100 text-slate-800 border-slate-200',
  em_contato: 'bg-blue-100 text-blue-800 border-blue-200',
  qualificado: 'bg-amber-100 text-amber-800 border-amber-200',
  proposta: 'bg-purple-100 text-purple-800 border-purple-200',
  ganho: 'bg-green-100 text-green-800 border-green-200',
  perdido: 'bg-red-100 text-red-800 border-red-200',
}

const STATUS_COLUMN_BG: Record<StatusKey, string> = {
  novo: 'bg-slate-50',
  em_contato: 'bg-blue-50',
  qualificado: 'bg-amber-50',
  proposta: 'bg-purple-50',
  ganho: 'bg-green-50',
  perdido: 'bg-red-50',
}

const HEAT_BADGES: Record<HeatKey, string> = {
  quente: 'bg-gradient-to-r from-red-100 to-orange-100 text-red-700 border-red-200',
  morno: 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border-amber-200',
  frio: 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-200',
}

const HEAT_LABELS: Record<HeatKey, string> = {
  quente: 'Quente',
  morno: 'Morno',
  frio: 'Frio',
}

const heatIcon = (heat: HeatKey) => {
  if (heat === 'quente') return <Flame className="w-3 h-3" />
  if (heat === 'morno') return <Sun className="w-3 h-3" />
  return <Snowflake className="w-3 h-3" />
}

const formatCurrency = (value: number | null | undefined) => {
  if (!value) return null
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

type DragData = {
  leadId: string
}

const isStatusKey = (value: unknown): value is StatusKey => {
  return typeof value === 'string' && value in STATUS_LABELS
}

// Componente de coluna droppable
const DroppableColumn = ({
  columnKey,
  title,
  count,
  children,
}: {
  columnKey: StatusKey
  title: string
  count: number
  children: React.ReactNode
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: columnKey })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-xl transition-all duration-200 border border-border bg-surface-alt/50',
        isOver ? 'ring-2 ring-offset-2 shadow-lg' : 'shadow-sm',
      )}
      style={isOver ? { '--tw-ring-color': 'var(--brand-primary)' } as React.CSSProperties : {}}
    >
      <div className="p-2 sm:p-3">
        {/* Header da coluna */}
        <div className={cn(
          'flex items-center justify-between mb-3 px-2 sm:px-3 py-2 rounded-lg border',
          STATUS_COLORS[columnKey]
        )}>
          <h3 className="text-xs sm:text-sm font-bold truncate">
            {title}
          </h3>
          <span className="shrink-0 ml-2 inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold rounded-full bg-white/80">
            {count}
          </span>
        </div>
        <div className="space-y-2 min-h-75 sm:min-h-100 overflow-y-auto max-h-[60vh] scrollbar-thin">
          {children}
        </div>
      </div>
    </div>
  )
}

// Componente de card draggable
const DraggableLeadCard = ({
  lead,
  onOpen,
  children,
}: {
  lead: Lead
  onOpen: () => void
  children?: React.ReactNode
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { leadId: lead.id } satisfies DragData,
  })

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
  }

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging ? 'opacity-60 scale-105' : '')}>
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          'w-full text-left rounded-lg border bg-white p-2 sm:p-3 shadow-sm hover:shadow-md transition-all group',
          'border-border hover:border-border-strong',
        )}
      >
        {/* Header com nome e drag handle */}
        <div className="flex items-start gap-1 sm:gap-2">
          {/* Drag handle */}
          <span
            className="shrink-0 inline-flex cursor-grab items-center rounded border border-border bg-surface-alt p-0.5 sm:p-1 text-text-subtle active:cursor-grabbing hover:bg-surface-alt sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            {...listeners}
            {...attributes}
            aria-label="Arrastar lead"
            title="Arrastar"
          >
            <MoreVertical className="h-3 w-3" />
          </span>
          
          {/* Nome do lead */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="text-xs sm:text-sm font-semibold text-text line-clamp-2 wrap-break-word">
              {lead.name}
            </p>
          </div>
        </div>

        {/* Badge de temperatura + score */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-semibold border transition-all',
            HEAT_BADGES[lead.heat]
          )}>
            {heatIcon(lead.heat)}
            <span className="hidden sm:inline">{HEAT_LABELS[lead.heat]}</span>
          </span>

          {/* Score numérico */}
          {lead.score != null && (
            <span className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-bold border',
              lead.score >= 67 ? 'bg-red-50 text-red-700 border-red-200' :
              lead.score >= 34 ? 'bg-amber-50 text-amber-700 border-amber-200' :
              'bg-surface-alt text-text-muted border-border'
            )}>
              {lead.score}
            </span>
          )}

          {/* Valor estimado */}
          {lead.estimatedValue && (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <DollarSign className="h-3 w-3" />
              <span className="hidden sm:inline">{formatCurrency(lead.estimatedValue)}</span>
            </span>
          )}
        </div>

        {/* Info de contato */}
        <div className="mt-2 space-y-1">
          {lead.phone && (
            <div className="flex items-center gap-1 text-[10px] sm:text-xs text-text-muted">
              <Phone className="h-3 w-3 shrink-0" />
              <span className="truncate">{formatPhone(lead.phone)}</span>
            </div>
          )}
          {lead.email && (
            <div className="flex items-center gap-1 text-[10px] sm:text-xs text-text-muted">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
        </div>

        {/* Botões de ação */}
        {children}
      </button>
    </div>
  )
}

export const LeadsKanbanPage = () => {
  const {
    leads,
    deletedLeads,
    loading,
    loadingDeleted,
    error,
    fetchLeads,
    updateLead,
    deleteLead,
    convertToCaso,
    fetchDeletedLeads,
    restoreLead,
    hardDeleteLead
  } = useLeads()
  const navigate = useNavigate()

  const [query, setQuery] = React.useState('')
  const [heatFilter, setHeatFilter] = React.useState<'todos' | HeatKey>('todos')
  const [modalOpen, setModalOpen] = React.useState(false)
  const [activeLead, setActiveLead] = React.useState<Lead | null>(null)
  const [showDeleted, setShowDeleted] = React.useState(false)
  
  // Estados para modal de conversão Lead → Caso
  const [conversionModalOpen, setConversionModalOpen] = React.useState(false)
  const [conversionLead, setConversionLead] = React.useState<Lead | null>(null)
  const [conversionForm, setConversionForm] = React.useState({ titulo: '', area: '', valor: '', descricao: '' })
  const [converting, setConverting] = React.useState(false)

  // Estados para drawer/histórico
  const [drawerTab, setDrawerTab] = React.useState<'detalhes' | 'historico'>('detalhes')
  const [leadHistory, setLeadHistory] = React.useState<Array<{
    id: string
    created_at: string
    status_anterior: string | null
    status_novo: string | null
    heat_anterior: string | null
    heat_novo: string | null
    changed_by: string | null
    changed_by_name: string | null
    motivo: string | null
  }>>([])
  const [historyLoading, setHistoryLoading] = React.useState(false)

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  )

  // Buscar histórico do lead
  const fetchLeadHistory = React.useCallback(async (leadId: string) => {
    setHistoryLoading(true)
    try {
      const { data, error: histError } = await supabase
        .from('lead_status_history')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true })
      
      if (histError) throw histError
      setLeadHistory(data || [])
    } catch (err) {
      console.error('Erro ao buscar histórico:', err)
      setLeadHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void fetchLeads()
  }, [fetchLeads])

  // Supabase Realtime: atualizar Kanban automaticamente quando leads mudam
  React.useEffect(() => {
    const channel = supabase
      .channel('leads-kanban-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        () => {
          fetchLeads()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchLeads])

  // Buscar leads deletados quando ativar filtro
  React.useEffect(() => {
    if (showDeleted) {
      fetchDeletedLeads()
    }
  }, [showDeleted, fetchDeletedLeads])

  const normalized = query.trim().toLowerCase()

  const filteredLeads = React.useMemo(() => {
    return leads.filter((lead) => {
      // Filtro de busca
      if (normalized) {
        const matchesSearch = 
          lead.name.toLowerCase().includes(normalized) ||
          (lead.email || '').toLowerCase().includes(normalized) ||
          (lead.phone || '').includes(normalized) ||
          (lead.company || '').toLowerCase().includes(normalized)
        if (!matchesSearch) return false
      }
      // Filtro de temperatura
      if (heatFilter !== 'todos' && lead.heat !== heatFilter) return false
      return true
    })
  }, [leads, normalized, heatFilter])

  // Dados do funil de conversão
  const funnelData = React.useMemo(() => {
    const novo = leads.filter(l => l.status === 'novo').length
    const emContato = leads.filter(l => l.status === 'em_contato').length
    const qualificado = leads.filter(l => l.status === 'qualificado').length
    const proposta = leads.filter(l => l.status === 'proposta').length
    const ganho = leads.filter(l => l.status === 'ganho').length
    const perdido = leads.filter(l => l.status === 'perdido').length
    const total = leads.length || 1
    return [
      { etapa: 'Novo', quantidade: novo, pct: ((novo / total) * 100).toFixed(0), color: 'var(--brand-primary)' },
      { etapa: 'Em Contato', quantidade: emContato, pct: ((emContato / total) * 100).toFixed(0), color: 'var(--color-info)' },
      { etapa: 'Qualificado', quantidade: qualificado, pct: ((qualificado / total) * 100).toFixed(0), color: 'var(--brand-accent)' },
      { etapa: 'Proposta', quantidade: proposta, pct: ((proposta / total) * 100).toFixed(0), color: 'var(--color-warning)' },
      { etapa: 'Ganho', quantidade: ganho, pct: ((ganho / total) * 100).toFixed(0), color: 'var(--color-success)' },
      { etapa: 'Perdido', quantidade: perdido, pct: ((perdido / total) * 100).toFixed(0), color: 'var(--color-danger)' },
    ]
  }, [leads])

  const taxaConversao = React.useMemo(() => {
    const total = leads.length
    const ganhos = leads.filter(l => l.status === 'ganho').length
    return total > 0 ? ((ganhos / total) * 100).toFixed(1) : '0'
  }, [leads])

  // Agrupar por status
  const byStatus = React.useMemo(() => {
    const map = new Map<StatusKey, Lead[]>()
    ;(Object.keys(STATUS_LABELS) as StatusKey[]).forEach((k) => map.set(k, []))
    filteredLeads.forEach((lead) => {
      const arr = map.get(lead.status)
      if (arr) arr.push(lead)
    })
    return map
  }, [filteredLeads])

  // Handler de drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const leadId = active.id as string
    const newStatus = over.id as StatusKey

    if (!isStatusKey(newStatus)) return

    const lead = leads.find((l) => l.id === leadId)
    if (!lead || lead.status === newStatus) return

    // Intercept drag to "ganho" → open conversion modal
    if (newStatus === 'ganho') {
      setConversionLead(lead)
      setConversionForm({
        titulo: `Caso - ${lead.name}`,
        area: lead.area !== 'Sem area' ? lead.area : '',
        valor: lead.estimatedValue ? String(lead.estimatedValue) : '',
        descricao: lead.notes || '',
      })
      setConversionModalOpen(true)
      return
    }

    // Atualizar otimisticamente
    try {
      await updateLead(leadId, { status: newStatus })
      toast.success(`Lead movido para ${STATUS_LABELS[newStatus]}`)
    } catch (err) {
      toast.error('Erro ao mover lead')
      fetchLeads() // Reverter
    }
  }

  // Handler de conversão Lead → Caso
  const handleConvertLead = async () => {
    if (!conversionLead) return
    setConverting(true)
    try {
      const result = await convertToCaso(conversionLead.id, {
        titulo: conversionForm.titulo || `Caso - ${conversionLead.name}`,
        area: conversionForm.area || undefined,
        valor: conversionForm.valor ? Number(conversionForm.valor) : undefined,
        descricao: conversionForm.descricao || undefined,
      })
      setConversionModalOpen(false)
      setConversionLead(null)
      toast.success('Lead convertido em caso!', {
        action: {
          label: 'Abrir caso',
          onClick: () => navigate(`/app/caso/${result.caso.id}`),
        },
      })
    } catch (err) {
      toast.error('Erro ao converter lead em caso')
    } finally {
      setConverting(false)
    }
  }

  // Abrir drawer do lead
  const openLeadDrawer = (lead: Lead) => {
    setActiveLead(lead)
    setDrawerTab('detalhes')
    setModalOpen(true)
    fetchLeadHistory(lead.id)
  }

  // Restaurar lead
  const handleRestore = async (leadId: string) => {
    try {
      await restoreLead(leadId)
      toast.success('Lead restaurado!')
    } catch (err) {
      toast.error('Erro ao restaurar lead')
    }
  }

  // Excluir permanentemente
  const handleHardDelete = async (leadId: string) => {
    if (!confirm('Tem certeza que deseja excluir permanentemente este lead? Esta ação não pode ser desfeita.')) return
    try {
      await hardDeleteLead(leadId)
      toast.success('Lead excluído permanentemente')
    } catch (err) {
      toast.error('Erro ao excluir lead')
    }
  }

  // Soft delete
  const handleSoftDelete = async (leadId: string) => {
    if (!confirm('Tem certeza que deseja excluir este lead?')) return
    try {
      await deleteLead(leadId)
      setModalOpen(false)
      toast.success('Lead movido para lixeira')
    } catch (err) {
      toast.error('Erro ao excluir lead')
    }
  }

  if (loading && leads.length === 0) {
    return <LoadingState message="Carregando leads..." />
  }

  if (error) {
    return <ErrorState error={error.message} onRetry={fetchLeads} />
  }

  return (
    <div className="flex flex-col h-full bg-linear-to-br from-gray-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-border shadow-sm sticky top-0 z-10">
        <div className="px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-text">
                Kanban de Leads
              </h1>
              <span className="px-2 py-1 bg-brand-primary text-white text-xs font-semibold rounded-full">
                {filteredLeads.length} leads
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Botão de voltar para lista */}
              <Link
                to="/app/leads"
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border border-border-strong bg-white text-text hover:bg-surface-alt transition-all"
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">Lista</span>
              </Link>

              {/* Busca */}
              <div className="relative flex-1 min-w-37.5 sm:w-auto">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-text-subtle" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full sm:w-48 pl-8 pr-3 py-1.5 text-sm rounded-lg border border-border-strong focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                />
              </div>

              {/* Filtro de temperatura */}
              <select
                value={heatFilter}
                onChange={(e) => setHeatFilter(e.target.value as 'todos' | HeatKey)}
                className="px-3 py-1.5 text-sm rounded-lg border border-border-strong bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              >
                <option value="todos">Todas temperaturas</option>
                <option value="quente">🔥 Quente</option>
                <option value="morno">☀️ Morno</option>
                <option value="frio">❄️ Frio</option>
              </select>

              {/* Toggle Lixeira */}
              <button
                onClick={() => setShowDeleted(!showDeleted)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border transition-all',
                  showDeleted
                    ? 'bg-red-100 text-red-700 border-red-300'
                    : 'bg-white text-text border-border-strong hover:bg-surface-alt'
                )}
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Lixeira</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 overflow-hidden p-3 sm:p-4">
        {/* Vista de Lixeira */}
        {showDeleted ? (
          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-red-50 border-b border-red-200">
              <h2 className="text-lg font-semibold text-red-800 flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Leads Excluídos ({deletedLeads.length})
              </h2>
              <p className="text-sm text-red-600 mt-1">
                Leads na lixeira serão excluídos permanentemente após 30 dias
              </p>
            </div>
            
            {loadingDeleted ? (
              <div className="p-8 text-center text-text-muted">
                Carregando...
              </div>
            ) : deletedLeads.length === 0 ? (
              <div className="p-8 text-center text-text-muted">
                <Trash2 className="h-12 w-12 mx-auto text-text-subtle mb-3" />
                <p>Nenhum lead na lixeira</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {deletedLeads.map((lead) => (
                  <div key={lead.id} className="p-4 flex items-center justify-between hover:bg-surface-alt">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-text">{lead.name}</p>
                      <p className="text-sm text-text-muted">{lead.email || lead.phone}</p>
                      <p className="text-xs text-text-subtle mt-1">
                        Status: {STATUS_LABELS[lead.status]} | Temp: {HEAT_LABELS[lead.heat]}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRestore(lead.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Restaurar
                      </button>
                      <button
                        onClick={() => handleHardDelete(lead.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Kanban Board */
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 h-full">
              {(Object.keys(STATUS_LABELS) as StatusKey[]).map((status) => {
                const leadsInColumn = byStatus.get(status) || []
                return (
                  <DroppableColumn
                    key={status}
                    columnKey={status}
                    title={STATUS_LABELS[status]}
                    count={leadsInColumn.length}
                  >
                    {leadsInColumn.length === 0 ? (
                      <p className="text-center text-xs text-text-subtle py-4">
                        Nenhum lead
                      </p>
                    ) : (
                      leadsInColumn.map((lead) => (
                        <DraggableLeadCard
                          key={lead.id}
                          lead={lead}
                          onOpen={() => openLeadDrawer(lead)}
                        />
                      ))
                    )}
                  </DroppableColumn>
                )
              })}
            </div>
          </DndContext>
        )}
      </div>

      {/* Funil de Conversão */}
      <div className="bg-surface rounded-xl border border-border p-6 mx-5 mb-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(114, 16, 17, 0.1)' }}>
            <ChevronDown className="h-5 w-5 text-brand-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text">Funil de Conversão</h2>
            <p className="text-xs text-text-muted">Pipeline de leads por etapa</p>
          </div>
        </div>
        <div className="space-y-3">
          {funnelData.map((item, idx) => {
            const maxQty = Math.max(...funnelData.map(d => d.quantidade), 1)
            const barWidth = Math.max((item.quantidade / maxQty) * 100, 4)
            const funnelWidth = 100 - (idx * (60 / (funnelData.length - 1 || 1)))
            return (
              <div key={item.etapa} className="flex items-center gap-4">
                <div className="w-24 text-right">
                  <span className="text-sm font-medium text-text">{item.etapa}</span>
                </div>
                <div className="flex-1 flex justify-center">
                  <div
                    className="relative rounded-lg overflow-hidden transition-all duration-500"
                    style={{
                      width: `${funnelWidth}%`,
                      height: 40,
                      backgroundColor: 'var(--color-surface-alt)',
                    }}
                  >
                    <div
                      className="absolute inset-y-0 left-0 rounded-lg transition-all duration-700 flex items-center justify-end pr-3"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: item.color,
                        minWidth: item.quantidade > 0 ? 40 : 0,
                        opacity: 0.85,
                      }}
                    >
                      {item.quantidade > 0 && (
                        <span className="text-white text-xs font-bold drop-shadow-sm">
                          {item.quantidade}
                        </span>
                      )}
                    </div>
                    {item.quantidade === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs text-text-subtle">0</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-14 text-left">
                  <span className="text-sm font-semibold text-text-muted">{item.pct}%</span>
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs text-text-muted">
          <span>Total no pipeline: <strong className="text-text">{leads.length}</strong> leads</span>
          <span>Taxa de conversão: <strong className="text-success">{taxaConversao}%</strong></span>
        </div>
      </div>

      {/* Modal/Drawer do Lead */}
      {modalOpen && activeLead && (
        <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header do modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-linear-to-r from-brand-primary to-brand-primary/90">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {activeLead.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      STATUS_COLORS[activeLead.status]
                    )}>
                      {STATUS_LABELS[activeLead.status]}
                    </span>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full border',
                      HEAT_BADGES[activeLead.heat]
                    )}>
                      {heatIcon(activeLead.heat)} {HEAT_LABELS[activeLead.heat]}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border">
              <button
                onClick={() => setDrawerTab('detalhes')}
                className={cn(
                  'flex-1 px-4 py-3 text-sm font-medium transition-colors',
                  drawerTab === 'detalhes'
                    ? 'text-brand-primary border-b-2 border-brand-primary bg-red-50/50'
                    : 'text-text-muted hover:text-text hover:bg-surface-alt'
                )}
              >
                <User className="h-4 w-4 inline mr-2" />
                Detalhes
              </button>
              <button
                onClick={() => setDrawerTab('historico')}
                className={cn(
                  'flex-1 px-4 py-3 text-sm font-medium transition-colors',
                  drawerTab === 'historico'
                    ? 'text-brand-primary border-b-2 border-brand-primary bg-red-50/50'
                    : 'text-text-muted hover:text-text hover:bg-surface-alt'
                )}
              >
                <History className="h-4 w-4 inline mr-2" />
                Histórico
              </button>
            </div>

            {/* Conteúdo do modal */}
            <div className="flex-1 overflow-y-auto p-6">
              {drawerTab === 'detalhes' && (
                <div className="space-y-6">
                  {/* Informações de contato */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-text uppercase tracking-wide">
                      Contato
                    </h3>
                    {activeLead.email && (
                      <div className="flex items-center gap-3 p-3 bg-surface-alt rounded-lg">
                        <Mail className="h-5 w-5 text-text-subtle" />
                        <div>
                          <p className="text-xs text-text-muted">E-mail</p>
                          <p className="text-sm font-medium">{activeLead.email}</p>
                        </div>
                      </div>
                    )}
                    {activeLead.phone && (
                      <div className="flex items-center gap-3 p-3 bg-surface-alt rounded-lg">
                        <Phone className="h-5 w-5 text-text-subtle" />
                        <div>
                          <p className="text-xs text-text-muted">Telefone</p>
                          <p className="text-sm font-medium">{formatPhone(activeLead.phone)}</p>
                        </div>
                      </div>
                    )}
                    {activeLead.company && (
                      <div className="flex items-center gap-3 p-3 bg-surface-alt rounded-lg">
                        <Building2 className="h-5 w-5 text-text-subtle" />
                        <div>
                          <p className="text-xs text-text-muted">Empresa</p>
                          <p className="text-sm font-medium">{activeLead.company}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Informações comerciais */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-text uppercase tracking-wide">
                      Informações Comerciais
                    </h3>
                    {activeLead.estimatedValue && (
                      <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                        <DollarSign className="h-5 w-5 text-emerald-500" />
                        <div>
                          <p className="text-xs text-text-muted">Valor Estimado</p>
                          <p className="text-sm font-bold text-emerald-700">
                            {formatCurrency(activeLead.estimatedValue)}
                          </p>
                        </div>
                      </div>
                    )}
                    {activeLead.origin && (
                      <div className="flex items-center gap-3 p-3 bg-surface-alt rounded-lg">
                        <MessageSquare className="h-5 w-5 text-text-subtle" />
                        <div>
                          <p className="text-xs text-text-muted">Origem</p>
                          <p className="text-sm font-medium capitalize">{activeLead.origin}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Score Detalhado */}
                  {activeLead.score != null && activeLead.scoreFactors && activeLead.scoreFactors.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-text uppercase tracking-wide flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" style={{ color: 'var(--brand-primary)' }} />
                        Score de Qualificação
                      </h3>
                      <div className="p-4 rounded-lg border border-border bg-surface-alt/50">
                        {/* Score geral */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                              style={{
                                backgroundColor: activeLead.score >= 67 ? '#dc2626' : activeLead.score >= 34 ? '#d97706' : '#6b7280',
                              }}
                            >
                              {activeLead.score}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-text">
                                {activeLead.score >= 67 ? 'Lead Quente' : activeLead.score >= 34 ? 'Lead Morno' : 'Lead Frio'}
                              </p>
                              {activeLead.scoredAt && (
                                <p className="text-[10px] text-text-subtle">
                                  Calculado em {formatDateTime(activeLead.scoredAt)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* Fatores individuais */}
                        <div className="space-y-2.5">
                          {activeLead.scoreFactors.map((factor) => (
                            <div key={factor.name}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-text-muted">{factor.label}</span>
                                <span className="text-xs font-medium text-text">
                                  {Math.round(factor.rawValue)}/100
                                  <span className="text-text-subtle ml-1">({factor.weight}%)</span>
                                </span>
                              </div>
                              <div className="w-full h-2 bg-surface-alt rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${factor.rawValue}%`,
                                    backgroundColor: factor.rawValue >= 67 ? '#dc2626' : factor.rawValue >= 34 ? '#d97706' : '#9ca3af',
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Observações */}
                  {activeLead.notes && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-text uppercase tracking-wide">
                        Observações
                      </h3>
                      <div className="p-3 bg-surface-alt rounded-lg">
                        <p className="text-sm text-text whitespace-pre-wrap">
                          {activeLead.notes}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Datas */}
                  <div className="space-y-2 pt-4 border-t border-border">
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <Calendar className="h-4 w-4" />
                      <span>Criado em: {formatDateTime(activeLead.createdAt)}</span>
                    </div>
                    {activeLead.updatedAt && (
                      <div className="flex items-center gap-2 text-xs text-text-muted">
                        <Calendar className="h-4 w-4" />
                        <span>Atualizado em: {formatDateTime(activeLead.updatedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {drawerTab === 'historico' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-text uppercase tracking-wide">
                    Timeline de Alterações
                  </h3>
                  
                  {historyLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-brand-primary border-t-transparent"></div>
                    </div>
                  ) : leadHistory.length === 0 ? (
                    <div className="text-center py-8 text-text-muted">
                      <History className="h-12 w-12 mx-auto text-text-subtle mb-3" />
                      <p>Nenhum histórico registrado</p>
                      <p className="text-xs mt-1">Alterações de status e temperatura aparecerão aqui</p>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Linha vertical */}
                      <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-surface-alt" />
                      
                      <div className="space-y-4">
                        {leadHistory.map((entry, index) => (
                          <div key={entry.id} className="relative pl-8">
                            {/* Círculo na timeline */}
                            <div className={cn(
                              'absolute left-0 w-6 h-6 rounded-full border-2 flex items-center justify-center bg-white',
                              index === leadHistory.length - 1 ? 'border-brand-primary' : 'border-border-strong'
                            )}>
                              <div className={cn(
                                'w-2 h-2 rounded-full',
                                index === leadHistory.length - 1 ? 'bg-brand-primary' : 'bg-text-subtle'
                              )} />
                            </div>
                            
                            {/* Conteúdo */}
                            <div className="bg-surface-alt rounded-lg p-3 border border-border">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-text-muted">
                                  {formatDateTime(entry.created_at)}
                                </span>
                                {entry.changed_by_name && (
                                  <span className="text-xs text-text-subtle">
                                    por {entry.changed_by_name}
                                  </span>
                                )}
                              </div>
                              
                              {/* Mudança de status */}
                              {entry.status_novo && (
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="text-text-muted">Status:</span>
                                  {entry.status_anterior && (
                                    <>
                                      <span className={cn(
                                        'px-2 py-0.5 rounded text-xs',
                                        STATUS_COLORS[entry.status_anterior as StatusKey] || 'bg-surface-alt'
                                      )}>
                                        {STATUS_LABELS[entry.status_anterior as StatusKey] || entry.status_anterior}
                                      </span>
                                      <span className="text-text-subtle">→</span>
                                    </>
                                  )}
                                  <span className={cn(
                                    'px-2 py-0.5 rounded text-xs font-medium',
                                    STATUS_COLORS[entry.status_novo as StatusKey] || 'bg-surface-alt'
                                  )}>
                                    {STATUS_LABELS[entry.status_novo as StatusKey] || entry.status_novo}
                                  </span>
                                </div>
                              )}
                              
                              {/* Mudança de temperatura */}
                              {entry.heat_novo && (
                                <div className="flex items-center gap-2 text-sm mt-1">
                                  <span className="text-text-muted">Temperatura:</span>
                                  {entry.heat_anterior && (
                                    <>
                                      <span className={cn(
                                        'px-2 py-0.5 rounded text-xs border',
                                        HEAT_BADGES[entry.heat_anterior as HeatKey] || 'bg-surface-alt'
                                      )}>
                                        {HEAT_LABELS[entry.heat_anterior as HeatKey] || entry.heat_anterior}
                                      </span>
                                      <span className="text-text-subtle">→</span>
                                    </>
                                  )}
                                  <span className={cn(
                                    'px-2 py-0.5 rounded text-xs font-medium border',
                                    HEAT_BADGES[entry.heat_novo as HeatKey] || 'bg-surface-alt'
                                  )}>
                                    {HEAT_LABELS[entry.heat_novo as HeatKey] || entry.heat_novo}
                                  </span>
                                </div>
                              )}
                              
                              {/* Motivo */}
                              {entry.motivo && (
                                <p className="text-xs text-text-muted mt-2 italic">
                                  "{entry.motivo}"
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer do modal */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-surface-alt">
              <button
                onClick={() => handleSoftDelete(activeLead.id)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </button>
              <div className="flex items-center gap-2">
                {activeLead.status !== 'ganho' && (
                  <button
                    onClick={() => {
                      setModalOpen(false)
                      setConversionLead(activeLead)
                      setConversionForm({
                        titulo: `Caso - ${activeLead.name}`,
                        area: activeLead.area !== 'Sem area' ? activeLead.area : '',
                        valor: activeLead.estimatedValue ? String(activeLead.estimatedValue) : '',
                        descricao: activeLead.notes || '',
                      })
                      setConversionModalOpen(true)
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
                    style={{ backgroundColor: 'var(--brand-primary)' }}
                  >
                    <ArrowRightCircle className="h-4 w-4" />
                    Converter em Caso
                  </button>
                )}
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-text hover:bg-surface-alt rounded-lg transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de Conversão Lead → Caso */}
      {conversionModalOpen && conversionLead && (
        <Modal open={conversionModalOpen} onClose={() => setConversionModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border" style={{ background: 'linear-gradient(135deg, #721011, #8b1415)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <ArrowRightCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Converter Lead em Caso</h2>
                  <p className="text-sm text-white/80">{conversionLead.name}</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wide text-text-muted mb-1 block">
                  Título do Caso
                </label>
                <input
                  type="text"
                  value={conversionForm.titulo}
                  onChange={(e) => setConversionForm((f) => ({ ...f, titulo: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border-strong focus:ring-2 focus:border-transparent transition-all"
                  style={{ '--tw-ring-color': 'rgba(114, 16, 17, 0.2)' } as React.CSSProperties}
                  placeholder="Caso - Nome do Lead"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wide text-text-muted mb-1 block">
                  Área Jurídica
                </label>
                <input
                  type="text"
                  value={conversionForm.area}
                  onChange={(e) => setConversionForm((f) => ({ ...f, area: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border-strong focus:ring-2 focus:border-transparent transition-all"
                  style={{ '--tw-ring-color': 'rgba(114, 16, 17, 0.2)' } as React.CSSProperties}
                  placeholder="Ex: Trabalhista, Civil, Tributário..."
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wide text-text-muted mb-1 block">
                  Valor Estimado (R$)
                </label>
                <input
                  type="number"
                  value={conversionForm.valor}
                  onChange={(e) => setConversionForm((f) => ({ ...f, valor: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border-strong focus:ring-2 focus:border-transparent transition-all"
                  style={{ '--tw-ring-color': 'rgba(114, 16, 17, 0.2)' } as React.CSSProperties}
                  placeholder="0"
                  min="0"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wide text-text-muted mb-1 block">
                  Descrição
                </label>
                <textarea
                  value={conversionForm.descricao}
                  onChange={(e) => setConversionForm((f) => ({ ...f, descricao: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border-strong focus:ring-2 focus:border-transparent transition-all resize-none"
                  style={{ '--tw-ring-color': 'rgba(114, 16, 17, 0.2)' } as React.CSSProperties}
                  rows={3}
                  placeholder="Descrição do caso (opcional)"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-surface-alt">
              <button
                onClick={() => setConversionModalOpen(false)}
                disabled={converting}
                className="px-4 py-2 text-sm font-medium text-text hover:bg-surface-alt rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConvertLead}
                disabled={converting || !conversionForm.titulo.trim()}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50"
                style={{ backgroundColor: 'var(--brand-primary)' }}
              >
                {converting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <ArrowRightCircle className="h-4 w-4" />
                )}
                {converting ? 'Convertendo...' : 'Converter'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
