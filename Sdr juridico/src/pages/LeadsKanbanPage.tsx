import * as React from 'react'
import { Plus, Search, MoreVertical, X, User, Phone, Mail, DollarSign, Flame, Sun, Snowflake, Trash2, RotateCcw, History, MessageSquare, Calendar, Building2, List } from 'lucide-react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'

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
        'rounded-xl transition-all duration-200 border border-gray-200 bg-gray-50/50',
        isOver ? 'ring-2 ring-offset-2 shadow-lg' : 'shadow-sm',
      )}
      style={isOver ? { '--tw-ring-color': '#721011' } as React.CSSProperties : {}}
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
          <span className="flex-shrink-0 ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full bg-white/80">
            {count}
          </span>
        </div>
        <div className="space-y-2 min-h-[300px] sm:min-h-[400px] overflow-y-auto max-h-[60vh] scrollbar-thin">
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
          'border-gray-200 hover:border-gray-300',
        )}
      >
        {/* Header com nome e drag handle */}
        <div className="flex items-start gap-1 sm:gap-2">
          {/* Drag handle */}
          <span
            className="flex-shrink-0 inline-flex cursor-grab items-center rounded border border-gray-200 bg-gray-50 p-0.5 sm:p-1 text-gray-400 active:cursor-grabbing hover:bg-gray-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
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
            <p className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2 break-words">
              {lead.name}
            </p>
          </div>
        </div>

        {/* Badge de temperatura */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-semibold border transition-all',
            HEAT_BADGES[lead.heat]
          )}>
            {heatIcon(lead.heat)}
            <span className="hidden sm:inline">{HEAT_LABELS[lead.heat]}</span>
          </span>

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
            <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-500">
              <Phone className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{formatPhone(lead.phone)}</span>
            </div>
          )}
          {lead.email && (
            <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-500">
              <Mail className="h-3 w-3 flex-shrink-0" />
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
    fetchDeletedLeads,
    restoreLead,
    hardDeleteLead
  } = useLeads()

  const [query, setQuery] = React.useState('')
  const [heatFilter, setHeatFilter] = React.useState<'todos' | HeatKey>('todos')
  const [modalOpen, setModalOpen] = React.useState(false)
  const [activeLead, setActiveLead] = React.useState<Lead | null>(null)
  const [showDeleted, setShowDeleted] = React.useState(false)
  
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
    
    // Atualizar otimisticamente
    try {
      await updateLead(leadId, { status: newStatus })
      toast.success(`Lead movido para ${STATUS_LABELS[newStatus]}`)
    } catch (err) {
      toast.error('Erro ao mover lead')
      fetchLeads() // Reverter
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
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Kanban de Leads
              </h1>
              <span className="px-2 py-1 bg-[#721011] text-white text-xs font-semibold rounded-full">
                {filteredLeads.length} leads
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Botão de voltar para lista */}
              <Link
                to="/app/leads"
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-all"
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">Lista</span>
              </Link>

              {/* Busca */}
              <div className="relative flex-1 min-w-[150px] sm:w-auto">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full sm:w-48 pl-8 pr-3 py-1.5 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#721011]/20 focus:border-[#721011] transition-all"
                />
              </div>

              {/* Filtro de temperatura */}
              <select
                value={heatFilter}
                onChange={(e) => setHeatFilter(e.target.value as 'todos' | HeatKey)}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-[#721011]/20 focus:border-[#721011]"
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
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
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
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
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
              <div className="p-8 text-center text-gray-500">
                Carregando...
              </div>
            ) : deletedLeads.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Trash2 className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p>Nenhum lead na lixeira</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {deletedLeads.map((lead) => (
                  <div key={lead.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{lead.name}</p>
                      <p className="text-sm text-gray-500">{lead.email || lead.phone}</p>
                      <p className="text-xs text-gray-400 mt-1">
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
                      <p className="text-center text-xs text-gray-400 py-4">
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

      {/* Modal/Drawer do Lead */}
      {modalOpen && activeLead && (
        <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header do modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#721011] to-[#8b1415]">
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
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setDrawerTab('detalhes')}
                className={cn(
                  'flex-1 px-4 py-3 text-sm font-medium transition-colors',
                  drawerTab === 'detalhes'
                    ? 'text-[#721011] border-b-2 border-[#721011] bg-red-50/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
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
                    ? 'text-[#721011] border-b-2 border-[#721011] bg-red-50/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
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
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                      Contato
                    </h3>
                    {activeLead.email && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">E-mail</p>
                          <p className="text-sm font-medium">{activeLead.email}</p>
                        </div>
                      </div>
                    )}
                    {activeLead.phone && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Phone className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Telefone</p>
                          <p className="text-sm font-medium">{formatPhone(activeLead.phone)}</p>
                        </div>
                      </div>
                    )}
                    {activeLead.company && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Building2 className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Empresa</p>
                          <p className="text-sm font-medium">{activeLead.company}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Informações comerciais */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                      Informações Comerciais
                    </h3>
                    {activeLead.estimatedValue && (
                      <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                        <DollarSign className="h-5 w-5 text-emerald-500" />
                        <div>
                          <p className="text-xs text-gray-500">Valor Estimado</p>
                          <p className="text-sm font-bold text-emerald-700">
                            {formatCurrency(activeLead.estimatedValue)}
                          </p>
                        </div>
                      </div>
                    )}
                    {activeLead.origin && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <MessageSquare className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Origem</p>
                          <p className="text-sm font-medium capitalize">{activeLead.origin}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Observações */}
                  {activeLead.notes && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                        Observações
                      </h3>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {activeLead.notes}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Datas */}
                  <div className="space-y-2 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>Criado em: {formatDateTime(activeLead.createdAt)}</span>
                    </div>
                    {activeLead.updatedAt && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="h-4 w-4" />
                        <span>Atualizado em: {formatDateTime(activeLead.updatedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {drawerTab === 'historico' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                    Timeline de Alterações
                  </h3>
                  
                  {historyLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#721011] border-t-transparent"></div>
                    </div>
                  ) : leadHistory.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <History className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                      <p>Nenhum histórico registrado</p>
                      <p className="text-xs mt-1">Alterações de status e temperatura aparecerão aqui</p>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Linha vertical */}
                      <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />
                      
                      <div className="space-y-4">
                        {leadHistory.map((entry, index) => (
                          <div key={entry.id} className="relative pl-8">
                            {/* Círculo na timeline */}
                            <div className={cn(
                              'absolute left-0 w-6 h-6 rounded-full border-2 flex items-center justify-center bg-white',
                              index === leadHistory.length - 1 ? 'border-[#721011]' : 'border-gray-300'
                            )}>
                              <div className={cn(
                                'w-2 h-2 rounded-full',
                                index === leadHistory.length - 1 ? 'bg-[#721011]' : 'bg-gray-400'
                              )} />
                            </div>
                            
                            {/* Conteúdo */}
                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-gray-500">
                                  {formatDateTime(entry.created_at)}
                                </span>
                                {entry.changed_by_name && (
                                  <span className="text-xs text-gray-400">
                                    por {entry.changed_by_name}
                                  </span>
                                )}
                              </div>
                              
                              {/* Mudança de status */}
                              {entry.status_novo && (
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="text-gray-600">Status:</span>
                                  {entry.status_anterior && (
                                    <>
                                      <span className={cn(
                                        'px-2 py-0.5 rounded text-xs',
                                        STATUS_COLORS[entry.status_anterior as StatusKey] || 'bg-gray-100'
                                      )}>
                                        {STATUS_LABELS[entry.status_anterior as StatusKey] || entry.status_anterior}
                                      </span>
                                      <span className="text-gray-400">→</span>
                                    </>
                                  )}
                                  <span className={cn(
                                    'px-2 py-0.5 rounded text-xs font-medium',
                                    STATUS_COLORS[entry.status_novo as StatusKey] || 'bg-gray-100'
                                  )}>
                                    {STATUS_LABELS[entry.status_novo as StatusKey] || entry.status_novo}
                                  </span>
                                </div>
                              )}
                              
                              {/* Mudança de temperatura */}
                              {entry.heat_novo && (
                                <div className="flex items-center gap-2 text-sm mt-1">
                                  <span className="text-gray-600">Temperatura:</span>
                                  {entry.heat_anterior && (
                                    <>
                                      <span className={cn(
                                        'px-2 py-0.5 rounded text-xs border',
                                        HEAT_BADGES[entry.heat_anterior as HeatKey] || 'bg-gray-100'
                                      )}>
                                        {HEAT_LABELS[entry.heat_anterior as HeatKey] || entry.heat_anterior}
                                      </span>
                                      <span className="text-gray-400">→</span>
                                    </>
                                  )}
                                  <span className={cn(
                                    'px-2 py-0.5 rounded text-xs font-medium border',
                                    HEAT_BADGES[entry.heat_novo as HeatKey] || 'bg-gray-100'
                                  )}>
                                    {HEAT_LABELS[entry.heat_novo as HeatKey] || entry.heat_novo}
                                  </span>
                                </div>
                              )}
                              
                              {/* Motivo */}
                              {entry.motivo && (
                                <p className="text-xs text-gray-500 mt-2 italic">
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
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => handleSoftDelete(activeLead.id)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </button>
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
