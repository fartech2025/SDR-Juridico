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
  // Estados para criar/editar tarefa
  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [editMode, setEditMode] = React.useState(false)
  const [formTitle, setFormTitle] = React.useState('')
  const [formDescription, setFormDescription] = React.useState('')
  const [formPriority, setFormPriority] = React.useState<Tarefa['priority']>('normal')
  const [formDueDate, setFormDueDate] = React.useState('')

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
    setAssignedDraft(t.ownerId || '')
    setEditMode(false)
    setFormTitle(t.title)
    setFormDescription(t.description || '')
    setFormPriority(t.priority)
    setFormDueDate(t.dueDate?.split('T')[0] || '')
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
                onClick={() => {
                  setFormTitle('')
                  setFormDescription('')
                  setFormPriority('normal')
                  setFormDueDate('')
                  setAssignedDraft('')
                  setCreateModalOpen(true)
                }}
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
                      {/* Botões para ADVOGADO */}
                      {role === 'ADVOGADO' && key === 'pendente' && (
                        <button
                          className="h-7 px-3 text-xs font-medium rounded-md border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            void onMove(t, 'em_andamento')
                          }}
                        >
                          Iniciar
                        </button>
                      )}
                      {role === 'ADVOGADO' && key === 'em_andamento' && (
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
                      {role === 'ADVOGADO' && key === 'devolvida' && (
                        <button
                          className="h-7 px-3 text-xs font-medium rounded-md border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            void onMove(t, 'em_andamento')
                          }}
                        >
                          Retomar
                        </button>
                      )}

                      {/* Botões para GESTOR/ADMIN */}
                      {canApprove && key === 'pendente' && (
                        <button
                          className="h-7 px-3 text-xs font-medium rounded-md border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            void onMove(t, 'em_andamento')
                          }}
                        >
                          Mover p/ Em Andamento
                        </button>
                      )}
                      {canApprove && key === 'em_andamento' && (
                        <>
                          <button
                            className="h-7 px-3 text-xs font-medium rounded-md border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              void submitForConfirmation(t.id)
                            }}
                          >
                            Enviar p/ Validação
                          </button>
                          <button
                            className="h-7 px-3 text-xs font-medium rounded-md text-white transition-colors"
                            style={{ backgroundColor: '#22c55e' }}
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              void approveTarefa(t.id)
                            }}
                          >
                            Concluir Diretamente
                          </button>
                        </>
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
                      {canApprove && key === 'devolvida' && (
                        <>
                          <button
                            className="h-7 px-3 text-xs font-medium rounded-md border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              void onMove(t, 'em_andamento')
                            }}
                          >
                            Reabrir
                          </button>
                          <button
                            className="h-7 px-3 text-xs font-medium rounded-md border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              void onMove(t, 'pendente')
                            }}
                          >
                            Voltar p/ Pendente
                          </button>
                        </>
                      )}
                      {canApprove && key === 'concluida' && (
                        <button
                          className="h-7 px-3 text-xs font-medium rounded-md border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            void onMove(t, 'em_andamento')
                          }}
                        >
                          Reabrir
                        </button>
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

      {/* Modal de Visualização/Edição */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editMode ? 'Editar Tarefa' : (active ? active.title : 'Tarefa')}>
        {active ? (
          <div className="space-y-4">
            {/* Modo de visualização */}
            {!editMode && (
              <>
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
                  <div className="text-sm col-span-2">
                    <div className="text-gray-500">Descrição</div>
                    <div className="mt-1 whitespace-pre-wrap text-gray-900">{active.description || '—'}</div>
                  </div>
                </div>

                {canApprove && (
                  <button
                    className="h-10 px-4 rounded-lg font-medium text-white transition-colors"
                    style={{ backgroundColor: '#721011' }}
                    onClick={() => setEditMode(true)}
                  >
                    Editar Tarefa
                  </button>
                )}
              </>
            )}

            {/* Modo de edição (apenas Gestor/Admin) */}
            {editMode && canApprove && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-500">Título</label>
                  <input
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2"
                    placeholder="Título da tarefa"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-500">Descrição</label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2"
                    placeholder="Descrição da tarefa"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-500">Prioridade</label>
                    <select
                      value={formPriority}
                      onChange={(e) => setFormPriority(e.target.value as Tarefa['priority'])}
                      className="h-10 w-full rounded-lg border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2"
                    >
                      <option value="baixa">Baixa</option>
                      <option value="normal">Normal</option>
                      <option value="alta">Alta</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-500">Prazo</label>
                    <input
                      type="date"
                      value={formDueDate}
                      onChange={(e) => setFormDueDate(e.target.value)}
                      className="h-10 w-full rounded-lg border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-500">Responsável (ID do usuário)</label>
                  <input
                    value={assignedDraft}
                    onChange={(e) => setAssignedDraft(e.target.value)}
                    placeholder="ID do usuário (auth.users.id)"
                    className="h-10 w-full rounded-lg border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    className="h-10 px-4 rounded-lg border border-gray-200 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setEditMode(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    className="h-10 px-4 rounded-lg font-medium text-white transition-colors"
                    style={{ backgroundColor: '#721011' }}
                    onClick={async () => {
                      if (!formTitle.trim()) return
                      await updateTarefa(active.id, {
                        title: formTitle.trim(),
                        description: formDescription.trim() || null,
                        priority: formPriority,
                        dueDate: formDueDate || null,
                        ownerId: assignedDraft.trim() || undefined,
                      })
                      setEditMode(false)
                      setModalOpen(false)
                    }}
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>
            )}

            {/* Seção de aprovação/devolução */}
            {!editMode && canApprove && active.status === 'aguardando_validacao' && (
              <div className="space-y-2 border-t pt-4">
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
                    onClick={async () => {
                      await approveTarefa(active.id)
                      setModalOpen(false)
                    }}
                  >
                    Aprovar
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* Modal de Criar Tarefa */}
      <Modal open={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Nova Tarefa">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-500">Título *</label>
            <input
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="h-10 w-full rounded-lg border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2"
              placeholder="Título da tarefa"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-500">Descrição</label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2"
              placeholder="Descrição da tarefa"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-gray-500">Prioridade</label>
              <select
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value as Tarefa['priority'])}
                className="h-10 w-full rounded-lg border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2"
              >
                <option value="baixa">Baixa</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-500">Prazo</label>
              <input
                type="date"
                value={formDueDate}
                onChange={(e) => setFormDueDate(e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-500">Atribuir para (ID do usuário)</label>
            <input
              value={assignedDraft}
              onChange={(e) => setAssignedDraft(e.target.value)}
              placeholder="Deixe vazio para atribuir a você mesmo"
              className="h-10 w-full rounded-lg border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              className="h-10 px-4 rounded-lg border border-gray-200 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancelar
            </button>
            <button
              className="h-10 px-4 rounded-lg font-medium text-white transition-colors"
              style={{ backgroundColor: '#721011' }}
              onClick={async () => {
                if (!formTitle.trim()) return
                await createTarefa({
                  title: formTitle.trim(),
                  description: formDescription.trim() || null,
                  priority: formPriority,
                  status: 'pendente',
                  dueDate: formDueDate || null,
                  ownerId: assignedDraft.trim() || undefined,
                })
                setCreateModalOpen(false)
              }}
            >
              Criar Tarefa
            </button>
          </div>
        </div>
      </Modal>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        input:focus { --tw-ring-color: #721011; border-color: #721011; }
      `}</style>
    </div>
  )
}
