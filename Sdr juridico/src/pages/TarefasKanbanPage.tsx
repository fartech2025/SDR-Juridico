import * as React from 'react'
import { Clock, Plus, Search, MoreVertical, X, User, Calendar, Flag, FileText, CheckCircle2, ArrowRight, MessageSquare, History, Edit3, Save, XCircle, AlertTriangle, Trash2, RotateCcw, Play, Send, RefreshCw, CornerDownLeft, ArrowUp, Minus, ArrowDown } from 'lucide-react'

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
import type { Tarefa } from '@/types/domain'
import { cn } from '@/utils/cn'
import { formatDate, formatDateTime } from '@/utils/format'
import { useTarefas } from '@/hooks/useTarefas'
import { useLeads } from '@/hooks/useLeads'
import { useClientes } from '@/hooks/useClientes'
import { useCasos } from '@/hooks/useCasos'
import { useTaskUiRole } from '@/utils/taskRole'
import { supabase } from '@/lib/supabaseClient'
import { useOrganization } from '@/contexts/OrganizationContext'
import {
  TarefaFormModal,
  buildDefaultValues,
  type TarefaFormValues,
} from '@/components/tarefas/TarefaFormModal'

type ColumnKey = Tarefa['status']

const COLUMN_LABELS: Record<ColumnKey, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  aguardando_validacao: 'Aguard. Confirmação',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
  devolvida: 'Devolvida',
}

const COLUMN_BG: Record<ColumnKey, string> = {
  pendente: 'bg-amber-50',
  em_andamento: 'bg-blue-50',
  aguardando_validacao: 'bg-purple-50',
  concluida: 'bg-green-50',
  cancelada: 'bg-red-50',
  devolvida: 'bg-surface-alt',
}

const priorityBadge = (priority: Tarefa['priority']) => {
  if (priority === 'alta')   return 'bg-red-50 text-red-700 border-red-200'
  if (priority === 'normal') return 'bg-gray-100 text-gray-600 border-gray-200'
  return 'bg-slate-50 text-slate-500 border-slate-200'
}

const PriorityIcon = ({ priority, className = 'w-3 h-3' }: { priority: Tarefa['priority']; className?: string }) => {
  if (priority === 'alta')   return <ArrowUp   className={className} />
  if (priority === 'normal') return <Minus     className={className} />
  return                            <ArrowDown className={className} />
}

const priorityLabel = (priority: Tarefa['priority']) => {
  if (priority === 'alta')   return 'Alta'
  if (priority === 'normal') return 'Normal'
  return 'Baixa'
}

const isOverdue = (t: Tarefa) => {
  if (!t.dueDate) return false
  if (t.status === 'concluida') return false
  return new Date(t.dueDate).getTime() < Date.now()
}

type DragData = {
  taskId: string
}

const isColumnKey = (value: unknown): value is ColumnKey => {
  return typeof value === 'string' && value in COLUMN_LABELS
}

const COLUMN_HEADER_COLORS: Record<ColumnKey, string> = {
  pendente:            'bg-amber-50 text-amber-700 border-amber-200',
  em_andamento:        'bg-orange-50 text-orange-700 border-orange-200',
  aguardando_validacao:'bg-purple-50 text-purple-700 border-purple-200',
  concluida:           'bg-green-50 text-green-700 border-green-200',
  cancelada:           'bg-red-50 text-red-700 border-red-200',
  devolvida:           'bg-gray-50 text-gray-600 border-gray-200',
}

const DroppableColumn = ({
  columnKey,
  title,
  count,
  children,
}: {
  columnKey: ColumnKey
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
        {/* Header da coluna com visual corporativo */}
        <div className={cn(
          'flex items-center justify-between mb-3 px-2 sm:px-3 py-2 rounded-lg border',
          COLUMN_HEADER_COLORS[columnKey]
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

const DraggableTaskCard = ({
  task,
  onOpen,
  children,
}: {
  task: Tarefa
  onOpen: () => void
  children: React.ReactNode
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { taskId: task.id } satisfies DragData,
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
          isOverdue(task) ? 'border-l-4 border-l-red-500' : 'border-border hover:border-border-strong',
        )}
      >
        {/* Header com título e controles */}
        <div className="flex items-start gap-1 sm:gap-2">
          {/* Drag handle - sempre visível em mobile, hover em desktop */}
          <span
            className="flex-shrink-0 inline-flex cursor-grab items-center rounded border border-border bg-surface-alt p-0.5 sm:p-1 text-text-subtle active:cursor-grabbing hover:bg-surface-alt sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            {...listeners}
            {...attributes}
            aria-label="Arrastar tarefa"
            title="Arrastar"
          >
            <MoreVertical className="h-3 w-3" />
          </span>
          
          {/* Título com truncamento adequado */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="text-xs sm:text-sm font-semibold text-text line-clamp-2 break-words">
              {task.title}
            </p>
          </div>
        </div>

        {/* Badges de prioridade e status */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {/* Badge de Prioridade */}
          <span className={cn(
            'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium border',
            priorityBadge(task.priority)
          )}>
            <PriorityIcon priority={task.priority} className="w-2.5 h-2.5" />
            {priorityLabel(task.priority)}
          </span>

          {/* Badge de Atrasada */}
          {isOverdue(task) && (
            <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium bg-red-50 text-red-700 border border-red-200">
              <Clock className="w-2.5 h-2.5" />
              Atrasada
            </span>
          )}
        </div>

        {/* Data de vencimento */}
        {task.dueDate && (
          <div className="mt-1.5 flex items-center gap-1 text-[10px] sm:text-xs text-text-muted">
            <Clock className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{formatDate(task.dueDate)}</span>
          </div>
        )}

        {/* Botões de ação */}
        {children}
      </button>
    </div>
  )
}

export const TarefasKanbanPage = () => {
  const role = useTaskUiRole()
  const { currentOrg } = useOrganization()
  const { tarefas, loading, error, fetchTarefas, createTarefa, updateTarefa, submitForConfirmation, approveTarefa, rejectTarefa, fetchDeletedTarefas, restoreTarefa, deleteTarefa } =
    useTarefas()
  const { leads }    = useLeads()
  const { clientes } = useClientes()
  const { casos }    = useCasos()

  const [query, setQuery] = React.useState('')
  const [modalOpen, setModalOpen] = React.useState(false)
  const [active, setActive] = React.useState<Tarefa | null>(null)
  const [rejectReason, setRejectReason] = React.useState('')
  const [assignedDraft, setAssignedDraft] = React.useState('')
  // Estados para criar/editar tarefa
  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [editMode, setEditMode] = React.useState(false)
  const [formTitle, setFormTitle] = React.useState('')
  const [formDescription, setFormDescription] = React.useState('')
  const [formPriority, setFormPriority] = React.useState<Tarefa['priority']>('normal')
  const [formDueDate, setFormDueDate] = React.useState('')
  // Estado da aba do drawer
  const [drawerTab, setDrawerTab] = React.useState<'detalhes' | 'historico' | 'comentarios'>('detalhes')
  const [taskHistory, setTaskHistory] = React.useState<Array<{
    id: string
    created_at: string
    status_anterior: string | null
    status_novo: string
    changed_by: string | null
    changed_by_name: string | null
    motivo: string | null
  }>>([])
  const [historyLoading, setHistoryLoading] = React.useState(false)
  // Estado para filtro de lixeira
  const [showDeleted, setShowDeleted] = React.useState(false)
  const [deletedTarefas, setDeletedTarefas] = React.useState<Tarefa[]>([])
  const [loadingDeleted, setLoadingDeleted] = React.useState(false)
  // Usuários da organização para seleção de responsável
  const [orgUsers, setOrgUsers] = React.useState<Array<{ id: string; nome_completo: string }>>([])
  const userNameById = React.useMemo(() => {
    const m = new Map<string, string>()
    for (const u of orgUsers) m.set(u.id, u.nome_completo)
    return m
  }, [orgUsers])

  // Entity name maps for vínculo display
  const leadMap    = React.useMemo(() => new Map(leads.map((l) => [l.id, l.name])), [leads])
  const clienteMap = React.useMemo(() => new Map(clientes.map((c) => [c.id, c.name])), [clientes])
  const casoMap    = React.useMemo(
    () => new Map(casos.map((c) => [c.id, c.numero_processo ?? `${c.title} — ${c.cliente}`])),
    [casos],
  )

  const resolveLinkLabel = React.useCallback((t: Tarefa): string | null => {
    if (t.casoId)    return `Caso: ${casoMap.get(t.casoId)    ?? t.casoId}`
    if (t.clienteId) return `Cliente: ${clienteMap.get(t.clienteId) ?? t.clienteId}`
    if (t.leadId)    return `Lead: ${leadMap.get(t.leadId)    ?? t.leadId}`
    return null
  }, [casoMap, clienteMap, leadMap])

  // Form state for the shared create modal
  const [createFormInitial, setCreateFormInitial] = React.useState<Partial<TarefaFormValues>>(buildDefaultValues())

  // Função para buscar histórico da tarefa
  const fetchTaskHistory = React.useCallback(async (taskId: string) => {
    setHistoryLoading(true)
    try {
      const { data, error: histError } = await supabase
        .from('tarefa_status_history')
        .select('*')
        .eq('tarefa_id', taskId)
        .order('created_at', { ascending: true })
      
      if (histError) throw histError
      setTaskHistory(data || [])
    } catch (err) {
      console.error('Erro ao buscar histórico:', err)
      setTaskHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void fetchTarefas()
  }, [fetchTarefas])

  // Buscar tarefas deletadas quando ativar o filtro
  React.useEffect(() => {
    if (showDeleted) {
      setLoadingDeleted(true)
      fetchDeletedTarefas()
        .then(setDeletedTarefas)
        .catch((err) => console.error('Erro ao buscar deletadas:', err))
        .finally(() => setLoadingDeleted(false))
    }
  }, [showDeleted, fetchDeletedTarefas])

  // Buscar usuários da organização para o seletor de responsável.
  // Membership is tracked in org_members; usuarios.org_id may not be populated.
  React.useEffect(() => {
    if (!currentOrg?.id) return
    const orgId = currentOrg.id
    ;(async () => {
      try {
        const { data: members } = await supabase
          .from('org_members')
          .select('user_id')
          .eq('org_id', orgId)
          .eq('ativo', true)

        const userIds = (members ?? []).map((m) => m.user_id)
        if (userIds.length === 0) return

        const { data: users } = await supabase
          .from('usuarios')
          .select('id, nome_completo')
          .in('id', userIds)
          .order('nome_completo')

        if (users) setOrgUsers(users as Array<{ id: string; nome_completo: string }>)
      } catch (err) {
        console.error('[TarefasKanbanPage] orgUsers fetch:', err)
      }
    })()
  }, [currentOrg?.id])

  const normalized = query.trim().toLowerCase()

  const visibleTarefas = React.useMemo(() => {
    return tarefas.filter((t) => {
      if (!normalized) return true
      return t.title.toLowerCase().includes(normalized) || (t.description || '').toLowerCase().includes(normalized)
    })
  }, [tarefas, normalized])

  const byStatus = React.useMemo(() => {
    const map = new Map<ColumnKey, Tarefa[]>()
    ;(Object.keys(COLUMN_LABELS) as ColumnKey[]).forEach((k) => map.set(k, []))
    for (const t of visibleTarefas) {
      const arr = map.get(t.status) || []
      arr.push(t)
      map.set(t.status, arr)
    }
    return map
  }, [visibleTarefas])

  const openTask = (t: Tarefa) => {
    setActive(t)
    setRejectReason('')
    setAssignedDraft(t.ownerId || '')
    setEditMode(false)
    setFormTitle(t.title)
    setFormDescription(t.description || '')
    setFormPriority(t.priority)
    setFormDueDate(t.dueDate?.split('T')[0] || '')
    setDrawerTab('detalhes')
    setTaskHistory([])
    setModalOpen(true)
  }

  // Buscar histórico quando a aba de histórico for selecionada
  React.useEffect(() => {
    if (drawerTab === 'historico' && active) {
      void fetchTaskHistory(active.id)
    }
  }, [drawerTab, active, fetchTaskHistory])

  const canApprove = role !== 'ADVOGADO'
  const canCreate = role !== 'ADVOGADO'

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  )

  const onMove = async (t: Tarefa, next: ColumnKey) => {
    if (role === 'ADVOGADO') {
      if (t.status === 'aguardando_validacao' || t.status === 'concluida') return
      if (next === 'concluida' || next === 'devolvida') return
    }
    try {
      await updateTarefa(t.id, { status: next })
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro ao mover tarefa'
      console.error('Erro ao atualizar status da tarefa:', errorMsg)
      // Re-throw to trigger error boundary
      throw error
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active: dragActive, over } = event
    if (!over) return
    const next = over.id
    if (!isColumnKey(next)) return

    const taskId = String(dragActive.id)
    const task = tarefas.find((t) => t.id === taskId)
    if (!task) return
    if (task.status === next) return

    void onMove(task, next).catch((error) => {
      console.error('Erro ao mover tarefa:', error)
      // Show error toast or notification
      const errorMsg = error instanceof Error ? error.message : 'Erro ao mover tarefa'
      if (errorMsg.includes('task_status')) {
        console.error(
          'ERRO DE ENUM: O banco de dados não reconhece o status. ' +
          'Verifique se o enum task_status foi criado corretamente.'
        )
      }
    })
  }

  const kpi = React.useMemo(() => {
    const overdue = tarefas.filter(isOverdue).length
    const awaiting = tarefas.filter((t) => t.status === 'aguardando_validacao').length
    return { overdue, awaiting }
  }, [tarefas])

  if (loading) return <LoadingState message="Carregando tarefas..." />
  if (error) return <ErrorState error={error.message} onRetry={fetchTarefas} />

  return (
    <div className="space-y-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-text">Quadro de Tarefas</h1>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-text-muted">
              <span>
                Atrasadas: <span className="font-semibold text-red-600">{kpi.overdue}</span>
              </span>
              <span>
                Aguardando confirmação: <span className="font-semibold text-text">{kpi.awaiting}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
              <input
                className="h-10 w-[260px] rounded-lg border border-border pl-10 pr-4 text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': 'var(--brand-primary)' } as React.CSSProperties}
                placeholder="Buscar tarefas..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            
            {/* Botão Lixeira */}
            <button
              onClick={() => setShowDeleted(!showDeleted)}
              className={cn(
                "h-10 px-4 rounded-lg font-medium transition-all flex items-center gap-2 border",
                showDeleted 
                  ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" 
                  : "bg-white text-text-muted border-border hover:bg-surface-alt"
              )}
              title={showDeleted ? "Mostrar tarefas ativas" : "Ver tarefas arquivadas"}
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">{showDeleted ? 'Ativas' : 'Lixeira'}</span>
            </button>
            
            {canCreate && !showDeleted && (
              <button
                onClick={() => {
                  setCreateFormInitial(buildDefaultValues())
                  setCreateModalOpen(true)
                }}
                className="h-10 px-4 rounded-lg font-medium text-white transition-all hover:shadow-lg flex items-center gap-2"
                style={{ backgroundColor: 'var(--brand-primary)' }}
              >
                <Plus className="h-4 w-4" />
                Nova tarefa
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Visualização: Lixeira de Tarefas Arquivadas */}
      {showDeleted && (
        <div className="bg-white rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Trash2 className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-bold text-text">Tarefas Arquivadas</h2>
            <span className="text-sm text-text-muted">({deletedTarefas.length} itens)</span>
          </div>
          
          {loadingDeleted ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
            </div>
          ) : deletedTarefas.length === 0 ? (
            <div className="text-center py-12">
              <Trash2 className="h-12 w-12 text-border mx-auto mb-3" />
              <p className="text-text-muted">Nenhuma tarefa arquivada</p>
              <p className="text-sm text-text-subtle mt-1">Tarefas excluídas aparecerão aqui</p>
            </div>
          ) : (
            <div className="space-y-2">
              {deletedTarefas.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-surface-alt hover:bg-surface-alt transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-text truncate">{t.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        COLUMN_HEADER_COLORS[t.status]
                      )}>
                        {COLUMN_LABELS[t.status]}
                      </span>
                      <span className="text-xs text-text-subtle">
                        {t.dueDate ? `Prazo: ${formatDate(t.dueDate)}` : 'Sem prazo'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        try {
                          await restoreTarefa(t.id)
                          setDeletedTarefas((prev) => prev.filter((item) => item.id !== t.id))
                        } catch (err) {
                          console.error('Erro ao restaurar:', err)
                        }
                      }}
                      className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                      title="Restaurar tarefa"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Restaurar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Kanban Board - só mostra quando NÃO estiver na lixeira */}
      {!showDeleted && (
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory lg:grid lg:grid-cols-6 lg:overflow-x-visible lg:pb-0">
          <style>{`
            .snap-x > div { scroll-snap-align: start; }
            @media (max-width: 1023px) {
              .snap-x > div { min-width: 280px; max-width: 320px; }
            }
          `}</style>
          {(Object.keys(COLUMN_LABELS) as ColumnKey[]).map((key) => {
            const items = byStatus.get(key) || []
            return (
              <DroppableColumn columnKey={key} title={COLUMN_LABELS[key]} count={items.length} key={key}>
                {items.map((t) => (
                  <DraggableTaskCard key={t.id} task={t} onOpen={() => openTask(t)}>
                    <div className="mt-2.5 pt-2 border-t border-gray-100 flex flex-wrap gap-1.5">
                      {/* Botões para ADVOGADO */}
                      {role === 'ADVOGADO' && key === 'pendente' && (
                        <button
                          className="inline-flex items-center gap-1 h-7 px-2.5 text-xs font-medium rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); void onMove(t, 'em_andamento') }}
                        >
                          <Play className="w-3 h-3" />
                          <span className="hidden sm:inline">Iniciar</span>
                        </button>
                      )}
                      {role === 'ADVOGADO' && key === 'em_andamento' && (
                        <button
                          className="inline-flex items-center gap-1 h-7 px-2.5 text-xs font-medium rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); void submitForConfirmation(t.id) }}
                        >
                          <Send className="w-3 h-3" />
                          <span className="hidden sm:inline">Enviar</span>
                        </button>
                      )}
                      {role === 'ADVOGADO' && key === 'devolvida' && (
                        <button
                          className="inline-flex items-center gap-1 h-7 px-2.5 text-xs font-medium rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); void onMove(t, 'em_andamento') }}
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span className="hidden sm:inline">Retomar</span>
                        </button>
                      )}

                      {/* Botões para GESTOR/ADMIN */}
                      {canApprove && key === 'pendente' && (
                        <button
                          className="inline-flex items-center gap-1 h-7 px-2.5 text-xs font-medium rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); void onMove(t, 'em_andamento') }}
                        >
                          <Play className="w-3 h-3" />
                          <span className="hidden sm:inline">Iniciar</span>
                        </button>
                      )}
                      {canApprove && key === 'em_andamento' && (
                        <>
                          <button
                            className="inline-flex items-center gap-1 h-7 px-2.5 text-xs font-medium rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); void submitForConfirmation(t.id) }}
                          >
                            <Send className="w-3 h-3" />
                            <span className="hidden sm:inline">Validar</span>
                          </button>
                          <button
                            className="inline-flex items-center gap-1 h-7 px-2.5 text-xs font-medium rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); void approveTarefa(t.id) }}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span className="hidden sm:inline">Concluir</span>
                          </button>
                        </>
                      )}
                      {canApprove && key === 'aguardando_validacao' && (
                        <>
                          <button
                            className="inline-flex items-center gap-1 h-7 px-2.5 text-xs font-medium rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); void approveTarefa(t.id) }}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Aprovar</span>
                          </button>
                          <button
                            className="inline-flex items-center gap-1 h-7 px-2.5 text-xs font-medium rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActive(t); setModalOpen(true) }}
                          >
                            <CornerDownLeft className="w-3 h-3" />
                            <span>Devolver</span>
                          </button>
                        </>
                      )}
                      {canApprove && key === 'devolvida' && (
                        <>
                          <button
                            className="inline-flex items-center gap-1 h-7 px-2.5 text-xs font-medium rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); void onMove(t, 'em_andamento') }}
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span className="hidden sm:inline">Reabrir</span>
                          </button>
                          <button
                            className="inline-flex items-center gap-1 h-7 px-2.5 text-xs font-medium rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); void onMove(t, 'pendente') }}
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span className="hidden sm:inline">Pendente</span>
                          </button>
                        </>
                      )}
                      {canApprove && key === 'concluida' && (
                        <button
                          className="inline-flex items-center gap-1 h-7 px-2.5 text-xs font-medium rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); void onMove(t, 'em_andamento') }}
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span className="hidden sm:inline">Reabrir</span>
                        </button>
                      )}
                    </div>
                  </DraggableTaskCard>
                ))}
                {items.length === 0 && (
                  <div className="text-xs sm:text-sm text-text-subtle text-center py-6 sm:py-8 border-2 border-dashed border-border rounded-lg">
                    Sem tarefas
                  </div>
                )}
              </DroppableColumn>
            )
          })}
        </div>
      </DndContext>
      )}

      {/* Drawer Completo de Visualização/Edição da Tarefa */}
      {modalOpen && active && (
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="42rem" noPadding>
          <div className="bg-white rounded-xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header do Drawer */}
            <div className="shrink-0 border-b border-border bg-white">
              <div className="flex items-start justify-between p-5">
                <div className="flex-1 min-w-0 pr-4">
                  {editMode ? (
                    <input
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full text-xl font-bold text-text bg-transparent border-b-2 border-brand-primary focus:outline-none pb-1"
                      placeholder="Título da tarefa"
                    />
                  ) : (
                    <h2 className="text-xl font-bold text-text truncate">{active.title}</h2>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {/* Badge de Status */}
                    <span className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold',
                      COLUMN_HEADER_COLORS[active.status]
                    )}>
                      <span className="w-2 h-2 rounded-full bg-current opacity-60" />
                      {COLUMN_LABELS[active.status]}
                    </span>
                    {/* Badge de Prioridade */}
                    <span className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border',
                      priorityBadge(active.priority)
                    )}>
                      <PriorityIcon priority={active.priority} />
                      {priorityLabel(active.priority)}
                    </span>
                    {/* Badge de Atrasada */}
                    {isOverdue(active) && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                        <AlertTriangle className="w-3 h-3" />
                        Atrasada
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex-shrink-0 p-2 rounded-lg hover:bg-surface-alt transition-colors"
                >
                  <X className="w-5 h-5 text-text-muted" />
                </button>
              </div>
              
              {/* Tabs de navegação */}
              <div className="flex gap-1 px-5 pb-0">
                <button 
                  onClick={() => setDrawerTab('detalhes')}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-t-lg transition-colors",
                    drawerTab === 'detalhes'
                      ? "text-brand-primary border-b-2 border-brand-primary bg-brand-primary-50/50"
                      : "text-text-muted hover:text-text hover:bg-surface-alt"
                  )}
                >
                  <FileText className="w-4 h-4 inline mr-1.5" />
                  Detalhes
                </button>
                <button 
                  onClick={() => setDrawerTab('historico')}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-t-lg transition-colors",
                    drawerTab === 'historico'
                      ? "text-brand-primary border-b-2 border-brand-primary bg-brand-primary-50/50"
                      : "text-text-muted hover:text-text hover:bg-surface-alt"
                  )}
                >
                  <History className="w-4 h-4 inline mr-1.5" />
                  Histórico
                </button>
                <button 
                  onClick={() => setDrawerTab('comentarios')}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-t-lg transition-colors",
                    drawerTab === 'comentarios'
                      ? "text-brand-primary border-b-2 border-brand-primary bg-brand-primary-50/50"
                      : "text-text-muted hover:text-text hover:bg-surface-alt"
                  )}
                >
                  <MessageSquare className="w-4 h-4 inline mr-1.5" />
                  Comentários
                </button>
              </div>
            </div>
            
            {/* Conteúdo Scrollável */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-5 space-y-6">
                
                {/* === ABA DETALHES === */}
                {drawerTab === 'detalhes' && (
                  <>
                {/* Seção: Informações Principais */}
                <div className="bg-surface-alt rounded-xl p-4 space-y-4">
                  <h3 className="text-sm font-semibold text-text uppercase tracking-wide flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand-primary" />
                    Informações da Tarefa
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Responsável */}
                    <div className="space-y-1">
                      <label className="text-xs text-text-muted font-medium flex items-center gap-1">
                        <User className="w-3.5 h-3.5" /> Responsável
                      </label>
                      {editMode ? (
                        <select
                          value={assignedDraft}
                          onChange={(e) => setAssignedDraft(e.target.value)}
                          className="h-9 w-full rounded-lg border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                        >
                          <option value="">Não atribuído</option>
                          {orgUsers.map((u) => (
                            <option key={u.id} value={u.id}>{u.nome_completo}</option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-sm font-medium text-text bg-white rounded-lg px-3 py-2 border border-border">
                          {active.ownerId
                            ? (userNameById.get(active.ownerId) ?? active.ownerId.slice(0, 8) + '...')
                            : 'Não atribuído'}
                        </p>
                      )}
                    </div>
                    
                    {/* Prazo */}
                    <div className="space-y-1">
                      <label className="text-xs text-text-muted font-medium flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Prazo
                      </label>
                      {editMode ? (
                        <input
                          type="date"
                          value={formDueDate}
                          onChange={(e) => setFormDueDate(e.target.value)}
                          className="h-9 w-full rounded-lg border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                        />
                      ) : (
                        <p className={cn(
                          "text-sm font-medium rounded-lg px-3 py-2 border",
                          isOverdue(active) 
                            ? "text-red-700 bg-red-50 border-red-200" 
                            : "text-text bg-white border-border"
                        )}>
                          {active.dueDate ? formatDate(active.dueDate) : 'Sem prazo definido'}
                        </p>
                      )}
                    </div>
                    
                    {/* Prioridade */}
                    <div className="space-y-1">
                      <label className="text-xs text-text-muted font-medium flex items-center gap-1">
                        <Flag className="w-3.5 h-3.5" /> Prioridade
                      </label>
                      {editMode ? (
                        <select
                          value={formPriority}
                          onChange={(e) => setFormPriority(e.target.value as Tarefa['priority'])}
                          className="h-9 w-full rounded-lg border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                        >
                          <option value="baixa">Baixa</option>
                          <option value="normal">Normal</option>
                          <option value="alta">Alta</option>
                        </select>
                      ) : (
                        <p className={cn(
                          'inline-flex items-center gap-1.5 text-sm font-medium rounded-lg px-3 py-2 border',
                          priorityBadge(active.priority),
                        )}>
                          <PriorityIcon priority={active.priority} className="w-3.5 h-3.5" />
                          {priorityLabel(active.priority)}
                        </p>
                      )}
                    </div>
                    
                    {/* Criado em */}
                    <div className="space-y-1">
                      <label className="text-xs text-text-muted font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Criado em
                      </label>
                      <p className="text-sm font-medium text-text bg-white rounded-lg px-3 py-2 border border-border">
                        {formatDate(active.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Vínculo */}
                  {(active.leadId || active.clienteId || active.casoId) && (
                    <div className="space-y-1 col-span-2">
                      <label className="text-xs text-text-muted font-medium flex items-center gap-1">
                        Vínculo
                      </label>
                      <p className="text-sm font-medium text-text bg-white rounded-lg px-3 py-2 border border-border">
                        {resolveLinkLabel(active)}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Seção: Descrição */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-text uppercase tracking-wide flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand-primary" />
                    Descrição
                  </h3>
                  {editMode ? (
                    <textarea
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      rows={4}
                      className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary resize-none"
                      placeholder="Descreva os detalhes da tarefa..."
                    />
                  ) : (
                    <div className="bg-surface-alt rounded-xl p-4 min-h-[100px]">
                      <p className="text-sm text-text whitespace-pre-wrap">
                        {active.description || (
                          <span className="text-text-subtle italic">Nenhuma descrição adicionada</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Seção: Ações Rápidas */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-text uppercase tracking-wide flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-brand-primary" />
                    Ações Rápidas
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Mover para Em Andamento */}
                    {active.status === 'pendente' && (
                      <button
                        onClick={() => {
                          void onMove(active, 'em_andamento')
                          setModalOpen(false)
                        }}
                        className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        <Play className="w-4 h-4" />
                        Iniciar Tarefa
                      </button>
                    )}

                    {/* Enviar para Validação */}
                    {active.status === 'em_andamento' && (
                      <>
                        <button
                          onClick={() => {
                            void submitForConfirmation(active.id)
                            setModalOpen(false)
                          }}
                          className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                        >
                          <Send className="w-4 h-4" />
                          Enviar p/ Validação
                        </button>
                        {canApprove && (
                          <button
                            onClick={() => {
                              void approveTarefa(active.id)
                              setModalOpen(false)
                            }}
                            className="flex items-center gap-2 p-3 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors text-sm font-medium"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Marcar Concluída
                          </button>
                        )}
                      </>
                    )}

                    {/* Aprovar / Devolver */}
                    {active.status === 'aguardando_validacao' && canApprove && (
                      <>
                        <button
                          onClick={() => {
                            void approveTarefa(active.id)
                            setModalOpen(false)
                          }}
                          className="flex items-center gap-2 p-3 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Aprovar Tarefa
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Motivo da devolução:')
                            if (reason) {
                              void rejectTarefa(active.id, reason)
                              setModalOpen(false)
                            }
                          }}
                          className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                        >
                          <XCircle className="w-4 h-4" />
                          Devolver
                        </button>
                      </>
                    )}

                    {/* Reabrir tarefa */}
                    {(active.status === 'concluida' || active.status === 'devolvida') && canApprove && (
                      <button
                        onClick={() => {
                          void onMove(active, 'em_andamento')
                          setModalOpen(false)
                        }}
                        className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Reabrir Tarefa
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Seção: Devolução (se aguardando validação) */}
                {!editMode && canApprove && active.status === 'aguardando_validacao' && (
                  <div className="space-y-3 border-t border-border pt-4">
                    <h3 className="text-sm font-semibold text-text uppercase tracking-wide flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-brand-primary" />
                      Devolver com Comentário
                    </h3>
                    <input
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Ex.: faltou RG/CPF, revisar tese, etc."
                      className="h-10 w-full rounded-xl border border-border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                    <button
                      disabled={!rejectReason.trim()}
                      onClick={async () => {
                        const reason = rejectReason.trim()
                        if (!reason) return
                        await rejectTarefa(active.id, reason)
                        setModalOpen(false)
                      }}
                      className="w-full h-10 rounded-xl border border-border font-medium text-text hover:bg-surface-alt transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Confirmar Devolução
                    </button>
                  </div>
                )}
                
                {/* Histórico de Rejeição (se devolvida) */}
                {active.status === 'devolvida' && active.rejectedReason && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                    <h4 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Motivo da Devolução
                    </h4>
                    <p className="text-sm text-amber-700">{active.rejectedReason}</p>
                  </div>
                )}
                  </>
                )}
                
                {/* === ABA HISTÓRICO === */}
                {drawerTab === 'historico' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-text uppercase tracking-wide flex items-center gap-2">
                      <History className="w-4 h-4 text-brand-primary" />
                      Timeline de Mudanças
                    </h3>
                    
                    {historyLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
                      </div>
                    ) : taskHistory.length === 0 ? (
                      <div className="bg-surface-alt rounded-xl p-6 text-center">
                        <History className="w-8 h-8 text-text-subtle mx-auto mb-2" />
                        <p className="text-sm text-text-muted">Nenhum histórico de mudanças registrado</p>
                      </div>
                    ) : (
                      <div className="relative">
                        {/* Linha vertical da timeline */}
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-surface-alt" />
                        
                        <div className="space-y-4">
                          {taskHistory.map((entry, index) => (
                            <div key={entry.id} className="relative pl-10">
                              {/* Círculo na timeline */}
                              <div className={cn(
                                "absolute left-2 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                index === taskHistory.length - 1
                                  ? "bg-brand-primary border-brand-primary"
                                  : "bg-white border-border-strong"
                              )}>
                                {index === taskHistory.length - 1 && (
                                  <div className="w-2 h-2 bg-white rounded-full" />
                                )}
                              </div>
                              
                              {/* Card do evento */}
                              <div className="bg-surface-alt rounded-lg p-3 border border-border">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <div className="flex items-center gap-2">
                                    {entry.status_anterior ? (
                                      <>
                                        <span className={cn(
                                          "text-xs px-2 py-0.5 rounded-full font-medium",
                                          COLUMN_HEADER_COLORS[entry.status_anterior as ColumnKey] || 'bg-surface-alt text-text-muted'
                                        )}>
                                          {COLUMN_LABELS[entry.status_anterior as ColumnKey] || entry.status_anterior}
                                        </span>
                                        <ArrowRight className="w-3 h-3 text-text-subtle" />
                                      </>
                                    ) : (
                                      <span className="text-xs text-text-muted">Criação:</span>
                                    )}
                                    <span className={cn(
                                      "text-xs px-2 py-0.5 rounded-full font-medium",
                                      COLUMN_HEADER_COLORS[entry.status_novo as ColumnKey] || 'bg-surface-alt text-text-muted'
                                    )}>
                                      {COLUMN_LABELS[entry.status_novo as ColumnKey] || entry.status_novo}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-text-subtle">
                                    {formatDateTime(entry.created_at)}
                                  </span>
                                </div>
                                
                                {entry.motivo && (
                                  <p className="text-xs text-text-muted mt-1 bg-white rounded px-2 py-1 border border-border">
                                    {entry.motivo}
                                  </p>
                                )}
                                
                                {entry.changed_by_name && (
                                  <p className="text-[10px] text-text-subtle mt-1 flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {entry.changed_by_name}
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
                
                {/* === ABA COMENTÁRIOS === */}
                {drawerTab === 'comentarios' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-text uppercase tracking-wide flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-brand-primary" />
                      Comentários
                    </h3>
                    <div className="bg-surface-alt rounded-xl p-6 text-center">
                      <MessageSquare className="w-8 h-8 text-text-subtle mx-auto mb-2" />
                      <p className="text-sm text-text-muted">Funcionalidade em desenvolvimento</p>
                      <p className="text-xs text-text-subtle mt-1">Em breve você poderá adicionar comentários às tarefas</p>
                    </div>
                  </div>
                )}
                
              </div>
            </div>
            
            {/* Footer do Drawer */}
            <div className="flex-shrink-0 border-t border-border bg-surface-alt p-4">
              <div className="flex items-center justify-between gap-3">
                {canApprove && !editMode && (
                  <button
                    onClick={() => {
                      setFormTitle(active.title)
                      setFormDescription(active.description || '')
                      setFormPriority(active.priority)
                      setFormDueDate(active.dueDate?.split('T')[0] || '')
                      setAssignedDraft(active.ownerId || '')
                      setEditMode(true)
                    }}
                    className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-border bg-white font-medium text-text hover:bg-surface-alt transition-colors text-sm"
                  >
                    <Edit3 className="w-4 h-4" />
                    Editar Tarefa
                  </button>
                )}
                
                {editMode && (
                  <>
                    <button
                      onClick={() => setEditMode(false)}
                      className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-border bg-white font-medium text-text hover:bg-surface-alt transition-colors text-sm"
                    >
                      <X className="w-4 h-4" />
                      Cancelar
                    </button>
                    <button
                      onClick={async () => {
                        if (!formTitle.trim()) return
                        await updateTarefa(active.id, {
                          title: formTitle.trim(),
                          description: formDescription.trim() || null,
                          priority: formPriority,
                          dueDate: formDueDate || null,
                          ownerId: assignedDraft.trim() || undefined,
                        })
                        // Sync active with updated values
                        setActive((prev) => prev ? {
                          ...prev,
                          title: formTitle.trim(),
                          description: formDescription.trim() || null,
                          priority: formPriority,
                          dueDate: formDueDate || null,
                          ownerId: assignedDraft.trim() || undefined,
                        } : prev)
                        setEditMode(false)
                      }}
                      className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-brand-primary font-medium text-white hover:bg-brand-primary-dark transition-colors text-sm"
                    >
                      <Save className="w-4 h-4" />
                      Salvar Alterações
                    </button>
                  </>
                )}
                
                {!editMode && (
                  <button
                    onClick={() => setModalOpen(false)}
                    className="ml-auto inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-brand-primary font-medium text-white hover:bg-brand-primary-dark transition-colors text-sm"
                  >
                    Fechar
                  </button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Shared create modal (unified with lista view) */}
      <TarefaFormModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSave={async (values) => {
          await createTarefa({
            title:       values.title.trim(),
            description: values.description.trim() || null,
            priority:    values.priority,
            status:      'pendente',
            dueDate:     values.dueDate || null,
            ownerId:     values.ownerId || undefined,
            leadId:      values.linkType === 'lead'    ? values.linkId || null : null,
            clienteId:   values.linkType === 'cliente' ? values.linkId || null : null,
            casoId:      values.linkType === 'caso'    ? values.linkId || null : null,
          })
        }}
        initialValues={createFormInitial}
        title="Nova Tarefa"
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        input:focus { --tw-ring-color: #721011; border-color: #721011; }
      `}</style>
    </div>
  )
}
