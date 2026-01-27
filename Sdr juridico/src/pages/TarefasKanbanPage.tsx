import * as React from 'react'
import { Clock, Plus, Search, MoreVertical } from 'lucide-react'

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
import { formatDate } from '@/utils/format'
import { useTarefas } from '@/hooks/useTarefas'
import { useTaskUiRole } from '@/utils/taskRole'

type ColumnKey = Tarefa['status']

const COLUMN_LABELS: Record<ColumnKey, string> = {
  pendente: 'Pendente',
  em_progresso: 'Em progresso',
  aguardando_validacao: 'Aguard. Confirmação',
  concluida: 'Concluída',
  devolvida: 'Devolvida',
}

const COLUMN_BG: Record<ColumnKey, string> = {
  pendente: 'bg-amber-50',
  em_progresso: 'bg-blue-50',
  aguardando_validacao: 'bg-purple-50',
  concluida: 'bg-green-50',
  devolvida: 'bg-gray-50',
}

const priorityBadge = (priority: Tarefa['priority']) => {
  if (priority === 'alta') return 'bg-red-50 text-red-700 border-red-200'
  if (priority === 'normal') return 'bg-gray-100 text-gray-700 border-gray-200'
  return 'bg-blue-50 text-blue-700 border-blue-200'
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
        'rounded-xl transition-all duration-200',
        isOver ? 'ring-2 ring-offset-2' : '',
        COLUMN_BG[columnKey]
      )}
      style={isOver ? { '--tw-ring-color': '#721011' } as React.CSSProperties : {}}
    >
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">
            {title} ({count})
          </h3>
        </div>
        <div className="space-y-3 min-h-[400px]">
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
    <div ref={setNodeRef} style={style} className={cn(isDragging ? 'opacity-60' : '')}>
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          'w-full text-left rounded-lg border bg-white p-3 shadow-sm hover:shadow-md transition-all',
          isOverdue(task) ? 'border-l-4' : 'border-gray-200',
        )}
        style={isOverdue(task) ? { borderLeftColor: '#ef4444' } : {}}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 line-clamp-2">{task.title}</p>
          </div>
          <div className="flex items-center gap-1">
            <span className={cn('inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium', priorityBadge(task.priority))}>
              {task.priority}
            </span>
            <span
              className="inline-flex cursor-grab items-center rounded-md border border-gray-200 bg-gray-50 px-1 py-1 text-gray-400 active:cursor-grabbing hover:bg-gray-100"
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
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-gray-500">{task.status.replace('_', ' ')}</span>
          {task.dueDate && (
            <span className="inline-flex items-center gap-1 text-gray-500">
              <Clock className="h-3 w-3" /> {formatDate(task.dueDate)}
            </span>
          )}
        </div>
        {isOverdue(task) && (
          <span className="mt-2 inline-flex text-xs font-semibold text-red-600">Atrasada</span>
        )}

        {children}
      </button>
    </div>
  )
}

export const TarefasKanbanPage = () => {
  const role = useTaskUiRole()
  const { tarefas, loading, error, fetchTarefas, createTarefa, updateTarefa, submitForConfirmation, approveTarefa, rejectTarefa } =
    useTarefas()

  const [query, setQuery] = React.useState('')
  const [modalOpen, setModalOpen] = React.useState(false)
  const [active, setActive] = React.useState<Tarefa | null>(null)
  const [rejectReason, setRejectReason] = React.useState('')
  const [assignedDraft, setAssignedDraft] = React.useState('')

  React.useEffect(() => {
    void fetchTarefas()
  }, [fetchTarefas])

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
    setAssignedDraft(((t as any).assigned_user_id as string) || '')
    setModalOpen(true)
  }

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
    await updateTarefa(t.id, { status: next })
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

    void onMove(task, next)
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
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Quadro de Tarefas</h1>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
              <span>
                Atrasadas: <span className="font-semibold text-red-600">{kpi.overdue}</span>
              </span>
              <span>
                Aguardando confirmação: <span className="font-semibold text-gray-900">{kpi.awaiting}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                className="h-10 w-[260px] rounded-lg border border-gray-200 pl-10 pr-4 text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': '#721011' } as React.CSSProperties}
                placeholder="Buscar tarefas..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            {canCreate && (
              <button
                onClick={() => createTarefa({ title: 'Nova tarefa', description: '', priority: 'normal', status: 'pendente' })}
                className="h-10 px-4 rounded-lg font-medium text-white transition-all hover:shadow-lg flex items-center gap-2"
                style={{ backgroundColor: '#721011' }}
              >
                <Plus className="h-4 w-4" />
                Nova tarefa
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid gap-4 lg:grid-cols-5">
          {(Object.keys(COLUMN_LABELS) as ColumnKey[]).map((key) => {
            const items = byStatus.get(key) || []
            return (
              <DroppableColumn columnKey={key} title={COLUMN_LABELS[key]} count={items.length} key={key}>
                {items.map((t) => (
                  <DraggableTaskCard key={t.id} task={t} onOpen={() => openTask(t)}>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {role === 'ADVOGADO' && key === 'pendente' && (
                        <button
                          className="h-7 px-3 text-xs font-medium rounded-md border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            void onMove(t, 'em_progresso')
                          }}
                        >
                          Iniciar
                        </button>
                      )}
                      {role === 'ADVOGADO' && key === 'em_progresso' && (
                        <button
                          className="h-7 px-3 text-xs font-medium rounded-md text-white transition-colors"
                          style={{ backgroundColor: '#721011' }}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            void submitForConfirmation(t.id)
                          }}
                        >
                          Enviar p/ Confirmação
                        </button>
                      )}
                      {canApprove && key === 'aguardando_validacao' && (
                        <>
                          <button
                            className="h-7 px-3 text-xs font-medium rounded-md text-white transition-colors"
                            style={{ backgroundColor: '#22c55e' }}
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              void approveTarefa(t.id)
                            }}
                          >
                            Aprovar
                          </button>
                          <button
                            className="h-7 px-3 text-xs font-medium rounded-md border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setActive(t)
                              setModalOpen(true)
                            }}
                          >
                            Devolver
                          </button>
                        </>
                      )}
                    </div>
                  </DraggableTaskCard>
                ))}
                {items.length === 0 && <div className="text-sm text-gray-400 text-center py-8">Sem tarefas</div>}
              </DroppableColumn>
            )
          })}
        </div>
      </DndContext>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={active ? active.title : 'Tarefa'}>
        {active ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="text-sm">
                <div className="text-gray-500">Status</div>
                <div className="font-medium text-gray-900">{COLUMN_LABELS[active.status]}</div>
              </div>
              <div className="text-sm">
                <div className="text-gray-500">Prazo</div>
                <div className="font-medium text-gray-900">{active.dueDate ? formatDate(active.dueDate) : '—'}</div>
              </div>
              <div className="text-sm">
                <div className="text-gray-500">Prioridade</div>
                <div className="font-medium text-gray-900">{active.priority}</div>
              </div>
              <div className="text-sm">
                <div className="text-gray-500">Descrição</div>
                <div className="mt-1 whitespace-pre-wrap text-gray-900">{active.description || '—'}</div>
              </div>
            </div>

            {canApprove && (
              <div className="space-y-2">
                <div className="text-sm text-gray-500">Reatribuir responsável (apenas Gestor/Admin)</div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    defaultValue={(active as any).assigned_user_id || ''}
                    placeholder="ID do usuário (auth.users.id)"
                    onChange={(e) => setAssignedDraft(e.target.value)}
                    className="h-10 flex-1 rounded-lg border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2"
                  />
                  <button
                    className="h-10 px-4 rounded-lg border border-gray-200 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={async () => {
                      const nextUser = assignedDraft.trim()
                      if (!nextUser) return
                      await updateTarefa(active.id, { assigned_user_id: nextUser } as any)
                      setActive({ ...(active as any), assigned_user_id: nextUser } as any)
                    }}
                  >
                    Salvar responsável
                  </button>
                </div>
              </div>
            )}

            {canApprove && active.status === 'aguardando_validacao' && (
              <div className="space-y-2">
                <div className="text-sm text-gray-500">Motivo da devolução (obrigatório)</div>
                <input
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ex.: faltou RG/CPF, revisar tese, etc."
                  className="h-10 w-full rounded-lg border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2"
                />
                <div className="flex gap-2">
                  <button
                    className="h-10 px-4 rounded-lg border border-gray-200 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={async () => {
                      const reason = rejectReason.trim()
                      if (!reason) return
                      await rejectTarefa(active.id, reason)
                      setModalOpen(false)
                    }}
                  >
                    Confirmar devolução
                  </button>
                  <button
                    className="h-10 px-4 rounded-lg font-medium text-white transition-colors"
                    style={{ backgroundColor: '#22c55e' }}
                    onClick={() => approveTarefa(active.id)}
                  >
                    Aprovar
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        input:focus { --tw-ring-color: #721011; border-color: #721011; }
      `}</style>
    </div>
  )
}
