import * as React from 'react'
import { CheckCircle, Clock, ListTodo, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

import { PageState } from '@/components/PageState'
import { Modal } from '@/components/ui/modal'
import type { Tarefa } from '@/types/domain'
import { cn } from '@/utils/cn'
import { ensureChecklistPrefix, hasChecklistPrefix, stripChecklistPrefix } from '@/utils/checklist'
import { formatDate } from '@/utils/format'
import { useTarefas } from '@/hooks/useTarefas'
import { useLeads } from '@/hooks/useLeads'
import { useClientes } from '@/hooks/useClientes'
import { useCasos } from '@/hooks/useCasos'

type LinkType = 'none' | 'lead' | 'cliente' | 'caso'

const statusBadge = (status: Tarefa['status']) => {
  if (status === 'concluida') return 'bg-green-50 text-green-700 border-green-200'
  if (status === 'aguardando_validacao') return 'bg-purple-50 text-purple-700 border-purple-200'
  if (status === 'devolvida') return 'bg-red-50 text-red-700 border-red-200'
  if (status === 'em_andamento') return 'bg-blue-50 text-blue-700 border-blue-200'
  return 'bg-gray-100 text-gray-700 border-gray-200'
}

const priorityBadge = (priority: Tarefa['priority']) => {
  if (priority === 'alta') return 'bg-red-50 text-red-700 border-red-200'
  if (priority === 'normal') return 'bg-gray-100 text-gray-700 border-gray-200'
  return 'bg-blue-50 text-blue-700 border-blue-200'
}

const buildInitialForm = () => ({
  title: '',
  description: '',
  priority: 'normal' as Tarefa['priority'],
  status: 'pendente' as Tarefa['status'],
  dueDate: '',
  linkType: 'none' as LinkType,
  linkId: '',
})

export const TarefasPage = () => {
  const { tarefas, loading, error, fetchTarefas, createTarefa, updateTarefa, deleteTarefa } = useTarefas()
  const { leads } = useLeads()
  const { clientes } = useClientes()
  const { casos } = useCasos()
  const [params] = useSearchParams()
  const [query, setQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<'todos' | Tarefa['status']>('todos')
  const [priorityFilter, setPriorityFilter] = React.useState<'todos' | Tarefa['priority']>('todos')
  const [linkFilter, setLinkFilter] = React.useState<'todos' | 'lead' | 'cliente' | 'caso'>('todos')
  const [linkIdFilter, setLinkIdFilter] = React.useState('')
  const [modalOpen, setModalOpen] = React.useState(false)
  const [editingTask, setEditingTask] = React.useState<Tarefa | null>(null)
  const [formState, setFormState] = React.useState(buildInitialForm)
  const [formError, setFormError] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    const casoId = params.get('casoId')
    const clienteId = params.get('clienteId')
    const leadId = params.get('leadId')

    if (casoId) {
      setLinkFilter('caso')
      setLinkIdFilter(casoId)
      return
    }
    if (clienteId) {
      setLinkFilter('cliente')
      setLinkIdFilter(clienteId)
      return
    }
    if (leadId) {
      setLinkFilter('lead')
      setLinkIdFilter(leadId)
      return
    }
    setLinkFilter('todos')
    setLinkIdFilter('')
  }, [params])

  const leadMap = React.useMemo(() => new Map(leads.map((lead) => [lead.id, lead.name])), [leads])
  const clienteMap = React.useMemo(
    () => new Map(clientes.map((cliente) => [cliente.id, cliente.name])),
    [clientes],
  )
  const casoMap = React.useMemo(
    () => new Map(casos.map((caso) => [caso.id, `${caso.title} - ${caso.cliente}`])),
    [casos],
  )

  const normalizedQuery = query.trim().toLowerCase()
  const filteredTarefas = React.useMemo(() => {
    return tarefas.filter((tarefa) => {
      const matchesQuery =
        !normalizedQuery ||
        tarefa.title.toLowerCase().includes(normalizedQuery) ||
        (tarefa.description || '').toLowerCase().includes(normalizedQuery)
      const matchesStatus = statusFilter === 'todos' || tarefa.status === statusFilter
      const matchesPriority = priorityFilter === 'todos' || tarefa.priority === priorityFilter

      if (linkFilter === 'lead') {
        if (!tarefa.leadId) return false
        if (linkIdFilter && tarefa.leadId !== linkIdFilter) return false
      }
      if (linkFilter === 'cliente') {
        if (!tarefa.clienteId) return false
        if (linkIdFilter && tarefa.clienteId !== linkIdFilter) return false
      }
      if (linkFilter === 'caso') {
        if (!tarefa.casoId) return false
        if (linkIdFilter && tarefa.casoId !== linkIdFilter) return false
      }

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
  const summary = React.useMemo(() => {
    const pending = tarefas.filter((t) => t.status !== 'concluida').length
    const done = tarefas.filter((t) => t.status === 'concluida').length
    const overdue = tarefas.filter((t) => {
      if (!t.dueDate || t.status === 'concluida') return false
      return t.dueDate < todayIso
    }).length
    return { pending, done, overdue }
  }, [tarefas, todayIso])

  const resolveLinkLabel = (task: Tarefa) => {
    if (task.casoId) return `Caso: ${casoMap.get(task.casoId) || task.casoId}`
    if (task.clienteId) return `Cliente: ${clienteMap.get(task.clienteId) || task.clienteId}`
    if (task.leadId) return `Lead: ${leadMap.get(task.leadId) || task.leadId}`
    return 'Sem vinculo'
  }

  const openCreateModal = () => {
    setEditingTask(null)
    setFormState(buildInitialForm())
    setFormError(null)
    setModalOpen(true)
  }

  const openEditModal = (task: Tarefa) => {
    const displayTitle = stripChecklistPrefix(task.title)
    const linkType: LinkType = task.casoId
      ? 'caso'
      : task.clienteId
        ? 'cliente'
        : task.leadId
          ? 'lead'
          : 'none'
    const linkId =
      linkType === 'caso'
        ? task.casoId || ''
        : linkType === 'cliente'
          ? task.clienteId || ''
          : linkType === 'lead'
            ? task.leadId || ''
            : ''
    setEditingTask(task)
    setFormState({
      title: displayTitle,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate || '',
      linkType,
      linkId,
    })
    setFormError(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    if (saving) return
    setModalOpen(false)
    setEditingTask(null)
    setFormState(buildInitialForm())
    setFormError(null)
  }

  const handleSave = async () => {
    if (!formState.title.trim()) {
      setFormError('Informe o titulo da tarefa.')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      const linkPayload = {
        leadId: formState.linkType === 'lead' ? formState.linkId || null : null,
        clienteId: formState.linkType === 'cliente' ? formState.linkId || null : null,
        casoId: formState.linkType === 'caso' ? formState.linkId || null : null,
      }
      if (editingTask) {
        const savedTitle = hasChecklistPrefix(editingTask.title)
          ? ensureChecklistPrefix(formState.title)
          : formState.title
        await updateTarefa(editingTask.id, {
          title: savedTitle.trim(),
          description: formState.description.trim() || null,
          priority: formState.priority,
          status: formState.status,
          dueDate: formState.dueDate || null,
          ...linkPayload,
        })
      } else {
        await createTarefa({
          title: formState.title.trim(),
          description: formState.description.trim() || null,
          priority: formState.priority,
          status: formState.status,
          dueDate: formState.dueDate || null,
          ...linkPayload,
        })
      }
      closeModal()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Erro ao salvar tarefa')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async (task: Tarefa) => {
    const nextStatus = task.status === 'concluida' ? 'pendente' : 'concluida'
    await updateTarefa(task.id, {
      status: nextStatus,
      completedAt: nextStatus === 'concluida' ? new Date().toISOString() : null,
    })
  }

  const handleDelete = async (task: Tarefa) => {
    const displayTitle = stripChecklistPrefix(task.title)
    const confirmed = window.confirm(`Excluir a tarefa "${displayTitle}"?`)
    if (!confirmed) return
    await deleteTarefa(task.id)
  }

  const pageState = loading
    ? 'loading'
    : error
      ? 'error'
      : sortedTarefas.length
        ? 'ready'
        : 'empty'
  const emptyAction = (
    <button
      onClick={openCreateModal}
      className="h-10 px-4 rounded-lg font-medium text-white flex items-center gap-2"
      style={{ backgroundColor: '#721011' }}
    >
      <Plus className="h-4 w-4" />
      Nova tarefa
    </button>
  )

  return (
    <div className="space-y-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">T A R E F A S</p>
          <h2 className="text-lg font-bold text-gray-900">Rotinas e lembretes internos</h2>
          <p className="text-sm text-gray-500">
            Planeje atividades por lead, cliente ou caso. Lembretes somente no app.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Pendentes</p>
            <p className="text-2xl font-bold text-gray-900">{summary.pending}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <Clock className="h-5 w-5" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Atrasadas</p>
            <p className="text-2xl font-bold text-gray-900">{summary.overdue}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
            <Clock className="h-5 w-5" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Concluídas</p>
            <p className="text-2xl font-bold text-gray-900">{summary.done}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-green-600">
            <CheckCircle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Tasks List Card */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Lista de tarefas</h3>
            <p className="text-sm text-gray-500">Organize por prioridade e vencimento.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void fetchTarefas()}
              disabled={loading}
              className="h-10 px-4 rounded-lg border border-gray-200 font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Atualizar
            </button>
            <button
              onClick={openCreateModal}
              className="h-10 px-4 rounded-lg font-medium text-white flex items-center gap-2"
              style={{ backgroundColor: '#721011' }}
            >
              <Plus className="h-4 w-4" />
              Nova tarefa
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              className="h-10 w-full rounded-lg border border-gray-200 pl-10 pr-4 text-sm focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': '#721011' } as React.CSSProperties}
              placeholder="Buscar tarefas..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <select
            className="h-10 rounded-lg border border-gray-200 px-4 text-sm text-gray-700 focus:outline-none focus:ring-2"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
          >
            <option value="todos">Status</option>
            <option value="pendente">Pendente</option>
            <option value="em_andamento">Em andamento</option>
            <option value="concluida">Concluida</option>
          </select>
          <select
            className="h-10 rounded-lg border border-gray-200 px-4 text-sm text-gray-700 focus:outline-none focus:ring-2"
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value as typeof priorityFilter)}
          >
            <option value="todos">Prioridade</option>
            <option value="baixa">Baixa</option>
            <option value="normal">Normal</option>
            <option value="alta">Alta</option>
          </select>
          <select
            className="h-10 rounded-lg border border-gray-200 px-4 text-sm text-gray-700 focus:outline-none focus:ring-2"
            value={linkFilter}
            onChange={(event) => setLinkFilter(event.target.value as typeof linkFilter)}
          >
            <option value="todos">Vinculo</option>
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
              const isOverdue =
                task.dueDate && task.status !== 'concluida' && task.dueDate < todayIso
              return (
                <div
                  key={task.id}
                  className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow"
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: 'rgba(114, 16, 17, 0.1)', color: '#721011' }}
                  >
                    <ListTodo className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{displayTitle}</p>
                      <span
                        className={cn(
                          'inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase',
                          statusBadge(task.status),
                        )}
                      >
                        {task.status.replace('_', ' ')}
                      </span>
                      <span
                        className={cn(
                          'inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase',
                          priorityBadge(task.priority),
                        )}
                      >
                        {task.priority}
                      </span>
                      {isOverdue && (
                        <span className="rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-red-700">
                          atrasada
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p className="mt-1 text-xs text-gray-500">{task.description}</p>
                    )}
                    <div className="mt-2 text-xs text-gray-500">
                      {resolveLinkLabel(task)}
                      {task.dueDate && (
                        <span className="ml-3">Vence em {formatDate(task.dueDate)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleStatus(task)}
                      className="h-9 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {task.status === 'concluida' ? 'Reabrir' : 'Concluir'}
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                      onClick={() => openEditModal(task)}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                      onClick={() => handleDelete(task)}
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

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingTask ? 'Editar tarefa' : 'Nova tarefa'}
        description="Registre tarefas e lembretes internos."
        footer={
          <>
            <button
              onClick={closeModal}
              disabled={saving}
              className="h-10 px-4 rounded-lg border border-gray-200 font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="h-10 px-4 rounded-lg font-medium text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#721011' }}
            >
              {saving ? 'Salvando...' : 'Salvar tarefa'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {formError}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Titulo</label>
            <input
              value={formState.title}
              onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Ex: Checar prazos do projeto"
              className="h-10 w-full rounded-lg border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Descricao</label>
            <textarea
              className="min-h-[100px] w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2"
              value={formState.description}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="Detalhes da tarefa"
            />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Prioridade</label>
              <select
                className="h-10 w-full rounded-lg border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2"
                value={formState.priority}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    priority: event.target.value as Tarefa['priority'],
                  }))
                }
              >
                <option value="baixa">Baixa</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <select
                className="h-10 w-full rounded-lg border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2"
                value={formState.status}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    status: event.target.value as Tarefa['status'],
                  }))
                }
              >
                <option value="pendente">Pendente</option>
                <option value="em_andamento">Em andamento</option>
                <option value="concluida">Concluida</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Vencimento</label>
              <input
                type="date"
                value={formState.dueDate}
                onChange={(event) => setFormState((prev) => ({ ...prev, dueDate: event.target.value }))}
                className="h-10 w-full rounded-lg border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2"
              />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Vinculo</label>
              <select
                className="h-10 w-full rounded-lg border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2"
                value={formState.linkType}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    linkType: event.target.value as LinkType,
                    linkId: '',
                  }))
                }
              >
                <option value="none">Sem vinculo</option>
                <option value="lead">Lead</option>
                <option value="cliente">Cliente</option>
                <option value="caso">Caso</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Selecionar</label>
              <select
                className="h-10 w-full rounded-lg border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2"
                value={formState.linkId}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, linkId: event.target.value }))
                }
                disabled={formState.linkType === 'none'}
              >
                <option value="">
                  {formState.linkType === 'none' ? 'Sem vinculo' : 'Selecione'}
                </option>
                {formState.linkType === 'lead' &&
                  leads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name}
                    </option>
                  ))}
                {formState.linkType === 'cliente' &&
                  clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.name}
                    </option>
                  ))}
                {formState.linkType === 'caso' &&
                  casos.map((caso) => (
                    <option key={caso.id} value={caso.id}>
                      {caso.title} - {caso.cliente}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>
      </Modal>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        input:focus, select:focus, textarea:focus { --tw-ring-color: #721011; border-color: #721011; }
      `}</style>
    </div>
  )
}
