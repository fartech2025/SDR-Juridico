import * as React from 'react'
import { CheckCircle, Clock, ListTodo, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

import { PageState } from '@/components/PageState'
import type { Tarefa } from '@/types/domain'
import { cn } from '@/utils/cn'
import { ensureChecklistPrefix, hasChecklistPrefix, stripChecklistPrefix } from '@/utils/checklist'
import { formatDate } from '@/utils/format'
import { useTarefas } from '@/hooks/useTarefas'
import { useLeads } from '@/hooks/useLeads'
import { useClientes } from '@/hooks/useClientes'
import { useCasos } from '@/hooks/useCasos'
import {
  TarefaFormModal,
  buildDefaultValues,
  type TarefaFormValues,
} from '@/components/tarefas/TarefaFormModal'

const statusBadge = (status: Tarefa['status']) => {
  if (status === 'concluida') return 'bg-green-50 text-green-700 border-green-200'
  if (status === 'aguardando_validacao') return 'bg-purple-50 text-purple-700 border-purple-200'
  if (status === 'devolvida') return 'bg-red-50 text-red-700 border-red-200'
  if (status === 'em_andamento') return 'bg-blue-50 text-blue-700 border-blue-200'
  return 'bg-surface-alt text-text border-border'
}

const priorityBadge = (priority: Tarefa['priority']) => {
  if (priority === 'alta') return 'bg-red-50 text-red-700 border-red-200'
  if (priority === 'normal') return 'bg-surface-alt text-text border-border'
  return 'bg-blue-50 text-blue-700 border-blue-200'
}

export const TarefasPage = () => {
  const { tarefas, loading, error, fetchTarefas, createTarefa, updateTarefa, deleteTarefa } = useTarefas()
  const { leads }    = useLeads()
  const { clientes } = useClientes()
  const { casos }    = useCasos()

  const [params] = useSearchParams()
  const [query, setQuery]               = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<'todos' | Tarefa['status']>('todos')
  const [priorityFilter, setPriorityFilter] = React.useState<'todos' | Tarefa['priority']>('todos')
  const [linkFilter, setLinkFilter]         = React.useState<'todos' | 'lead' | 'cliente' | 'caso'>('todos')
  const [linkIdFilter, setLinkIdFilter]     = React.useState('')

  // Modal state
  const [modalOpen, setModalOpen]       = React.useState(false)
  const [editingTask, setEditingTask]   = React.useState<Tarefa | null>(null)
  const [formInitial, setFormInitial]   = React.useState<Partial<TarefaFormValues>>(buildDefaultValues())

  // URL params → filters
  React.useEffect(() => {
    const casoId    = params.get('casoId')
    const clienteId = params.get('clienteId')
    const leadId    = params.get('leadId')
    if (casoId)    { setLinkFilter('caso');    setLinkIdFilter(casoId);    return }
    if (clienteId) { setLinkFilter('cliente'); setLinkIdFilter(clienteId); return }
    if (leadId)    { setLinkFilter('lead');    setLinkIdFilter(leadId);    return }
    setLinkFilter('todos')
    setLinkIdFilter('')
  }, [params])

  // Entity name maps for display
  const leadMap    = React.useMemo(() => new Map(leads.map((l) => [l.id, l.name])), [leads])
  const clienteMap = React.useMemo(() => new Map(clientes.map((c) => [c.id, c.name])), [clientes])
  const casoMap    = React.useMemo(
    () => new Map(casos.map((c) => [c.id, c.numero_processo ?? `${c.title} — ${c.cliente}`])),
    [casos],
  )

  const resolveLinkLabel = (task: Tarefa) => {
    if (task.casoId)    return `Caso: ${casoMap.get(task.casoId) ?? task.casoId}`
    if (task.clienteId) return `Cliente: ${clienteMap.get(task.clienteId) ?? task.clienteId}`
    if (task.leadId)    return `Lead: ${leadMap.get(task.leadId) ?? task.leadId}`
    return 'Sem vínculo'
  }

  // Filtering + sorting
  const normalizedQuery = query.trim().toLowerCase()
  const filteredTarefas = React.useMemo(() => {
    return tarefas.filter((tarefa) => {
      const matchesQuery =
        !normalizedQuery ||
        tarefa.title.toLowerCase().includes(normalizedQuery) ||
        (tarefa.description || '').toLowerCase().includes(normalizedQuery)
      const matchesStatus   = statusFilter   === 'todos' || tarefa.status   === statusFilter
      const matchesPriority = priorityFilter === 'todos' || tarefa.priority === priorityFilter
      if (linkFilter === 'lead')    { if (!tarefa.leadId)    return false; if (linkIdFilter && tarefa.leadId    !== linkIdFilter) return false }
      if (linkFilter === 'cliente') { if (!tarefa.clienteId) return false; if (linkIdFilter && tarefa.clienteId !== linkIdFilter) return false }
      if (linkFilter === 'caso')    { if (!tarefa.casoId)    return false; if (linkIdFilter && tarefa.casoId    !== linkIdFilter) return false }
      return matchesQuery && matchesStatus && matchesPriority
    })
  }, [tarefas, normalizedQuery, statusFilter, priorityFilter, linkFilter, linkIdFilter])

  const sortedTarefas = React.useMemo(() => {
    return [...filteredTarefas].sort((a, b) => {
      const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Infinity
      const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Infinity
      if (aTime === bTime) return a.title.localeCompare(b.title)
      return aTime - bTime
    })
  }, [filteredTarefas])

  const todayIso = new Date().toISOString().slice(0, 10)
  const summary  = React.useMemo(() => {
    const pending = tarefas.filter((t) => t.status !== 'concluida').length
    const done    = tarefas.filter((t) => t.status === 'concluida').length
    const overdue = tarefas.filter((t) => t.dueDate && t.status !== 'concluida' && t.dueDate < todayIso).length
    return { pending, done, overdue }
  }, [tarefas, todayIso])

  // Modal open helpers
  const openCreateModal = () => {
    setEditingTask(null)
    setFormInitial(buildDefaultValues())
    setModalOpen(true)
  }

  const openEditModal = (task: Tarefa) => {
    const linkType =
      task.casoId    ? 'caso'    :
      task.clienteId ? 'cliente' :
      task.leadId    ? 'lead'    : 'none'
    const linkId =
      linkType === 'caso'    ? task.casoId    ?? '' :
      linkType === 'cliente' ? task.clienteId ?? '' :
      linkType === 'lead'    ? task.leadId    ?? '' : ''
    setEditingTask(task)
    setFormInitial({
      title:       stripChecklistPrefix(task.title),
      description: task.description || '',
      priority:    task.priority,
      status:      task.status,
      dueDate:     task.dueDate || '',
      linkType,
      linkId,
      ownerId:     task.ownerId || '',
    })
    setModalOpen(true)
  }

  // Save handler — called by TarefaFormModal
  const handleSave = async (values: TarefaFormValues) => {
    const linkPayload = {
      leadId:     values.linkType === 'lead'    ? values.linkId || null : null,
      clienteId:  values.linkType === 'cliente' ? values.linkId || null : null,
      casoId:     values.linkType === 'caso'    ? values.linkId || null : null,
    }
    if (editingTask) {
      const savedTitle = hasChecklistPrefix(editingTask.title)
        ? ensureChecklistPrefix(values.title)
        : values.title
      await updateTarefa(editingTask.id, {
        title:       savedTitle.trim(),
        description: values.description.trim() || null,
        priority:    values.priority,
        status:      values.status,
        dueDate:     values.dueDate || null,
        ownerId:     values.ownerId || undefined,
        ...linkPayload,
      })
    } else {
      await createTarefa({
        title:       values.title.trim(),
        description: values.description.trim() || null,
        priority:    values.priority,
        status:      values.status,
        dueDate:     values.dueDate || null,
        ownerId:     values.ownerId || undefined,
        ...linkPayload,
      })
    }
  }

  const handleToggleStatus = async (task: Tarefa) => {
    const nextStatus = task.status === 'concluida' ? 'pendente' : 'concluida'
    await updateTarefa(task.id, {
      status:      nextStatus,
      completedAt: nextStatus === 'concluida' ? new Date().toISOString() : null,
    })
  }

  const handleDelete = async (task: Tarefa) => {
    const displayTitle = stripChecklistPrefix(task.title)
    const confirmed    = window.confirm(`Excluir a tarefa "${displayTitle}"?`)
    if (!confirmed) return
    await deleteTarefa(task.id)
  }

  const pageState = loading ? 'loading' : error ? 'error' : sortedTarefas.length ? 'ready' : 'empty'
  const emptyAction = (
    <button
      onClick={openCreateModal}
      className="h-10 px-4 rounded-lg font-medium text-white flex items-center gap-2"
      style={{ backgroundColor: 'var(--brand-primary)' }}
    >
      <Plus className="h-4 w-4" />
      Nova tarefa
    </button>
  )

  return (
    <div className="space-y-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div className="bg-white rounded-xl border border-border p-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-text-subtle uppercase tracking-wider">T A R E F A S</p>
          <h2 className="text-lg font-bold text-text">Rotinas e lembretes internos</h2>
          <p className="text-sm text-text-muted">
            Planeje atividades por lead, cliente ou caso. Lembretes somente no app.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white rounded-xl border border-border p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-text-muted">Pendentes</p>
            <p className="text-2xl font-bold text-text">{summary.pending}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50">
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-text-muted">Atrasadas</p>
            <p className="text-2xl font-bold text-text">{summary.overdue}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
            <Clock className="h-5 w-5 text-red-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-text-muted">Concluídas</p>
            <p className="text-2xl font-bold text-text">{summary.done}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
        </div>
      </div>

      {/* Tasks List Card */}
      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-semibold text-text">Lista de tarefas</h3>
            <p className="text-sm text-text-muted">Organize por prioridade e vencimento.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void fetchTarefas()}
              disabled={loading}
              className="h-10 px-4 rounded-lg border border-border font-medium text-text hover:bg-surface-alt transition-colors disabled:opacity-50"
            >
              Atualizar
            </button>
            <button
              onClick={openCreateModal}
              className="h-10 px-4 rounded-lg font-medium text-white flex items-center gap-2"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            >
              <Plus className="h-4 w-4" />
              Nova tarefa
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-65">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
            <input
              className="h-10 w-full rounded-lg border border-border pl-10 pr-4 text-sm focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': 'rgba(114, 16, 17, 0.2)' } as React.CSSProperties}
              placeholder="Buscar tarefas..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select
            className="h-10 rounded-lg border border-border px-4 text-sm text-text focus:outline-none focus:ring-2"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          >
            <option value="todos">Status</option>
            <option value="pendente">Pendente</option>
            <option value="em_andamento">Em andamento</option>
            <option value="concluida">Concluída</option>
          </select>
          <select
            className="h-10 rounded-lg border border-border px-4 text-sm text-text focus:outline-none focus:ring-2"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as typeof priorityFilter)}
          >
            <option value="todos">Prioridade</option>
            <option value="baixa">Baixa</option>
            <option value="normal">Normal</option>
            <option value="alta">Alta</option>
          </select>
          <select
            className="h-10 rounded-lg border border-border px-4 text-sm text-text focus:outline-none focus:ring-2"
            value={linkFilter}
            onChange={(e) => setLinkFilter(e.target.value as typeof linkFilter)}
          >
            <option value="todos">Vínculo</option>
            <option value="lead">Lead</option>
            <option value="cliente">Cliente</option>
            <option value="caso">Caso</option>
          </select>
        </div>

        {/* Task List */}
        <PageState
          status={pageState}
          emptyTitle="Nenhuma tarefa encontrada"
          emptyAction={emptyAction}
          onRetry={error ? fetchTarefas : undefined}
        >
          <div className="space-y-3">
            {sortedTarefas.map((task) => {
              const displayTitle = stripChecklistPrefix(task.title)
              const isOverdue    = task.dueDate && task.status !== 'concluida' && task.dueDate < todayIso
              return (
                <div
                  key={task.id}
                  className="flex flex-wrap items-center gap-4 rounded-xl border border-border p-4 hover:shadow-md transition-shadow"
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg shrink-0"
                    style={{ backgroundColor: 'rgba(114, 16, 17, 0.1)', color: '#721011' }}
                  >
                    <ListTodo className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-50">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-text">{displayTitle}</p>
                      <span className={cn('inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase', statusBadge(task.status))}>
                        {task.status.replace('_', ' ')}
                      </span>
                      <span className={cn('inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase', priorityBadge(task.priority))}>
                        {task.priority}
                      </span>
                      {isOverdue && (
                        <span className="rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-red-700">
                          atrasada
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p className="mt-1 text-xs text-text-muted">{task.description}</p>
                    )}
                    <div className="mt-2 text-xs text-text-muted">
                      {resolveLinkLabel(task)}
                      {task.dueDate && (
                        <span className="ml-3">Vence em {formatDate(task.dueDate)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => void handleToggleStatus(task)}
                      className="h-9 px-4 rounded-lg border border-border text-sm font-medium text-text hover:bg-surface-alt transition-colors"
                    >
                      {task.status === 'concluida' ? 'Reabrir' : 'Concluir'}
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-muted hover:text-text hover:bg-surface-alt transition-colors"
                      onClick={() => openEditModal(task)}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                      onClick={() => void handleDelete(task)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </PageState>
      </div>

      {/* Shared create/edit modal */}
      <TarefaFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initialValues={formInitial}
        title={editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
        showStatus={!!editingTask}
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        select:focus { --tw-ring-color: #721011; border-color: #721011; }
      `}</style>
    </div>
  )
}
