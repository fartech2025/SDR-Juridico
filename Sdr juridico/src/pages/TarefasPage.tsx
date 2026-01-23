import * as React from 'react'
import { CheckCircle, Clock, ListTodo, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

import { PageState } from '@/components/PageState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
  if (status === 'concluida') return 'border-success-border bg-success-bg text-success'
  if (status === 'em_progresso') return 'border-warning-border bg-warning-bg text-warning'
  return 'border-border bg-surface-2 text-text-muted'
}

const priorityBadge = (priority: Tarefa['priority']) => {
  if (priority === 'alta') return 'border-danger-border bg-danger-bg text-danger'
  if (priority === 'normal') return 'border-info-border bg-info-bg text-info'
  return 'border-border bg-surface-2 text-text-muted'
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
  const { tarefas, loading, error, createTarefa, updateTarefa, deleteTarefa } = useTarefas()
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

  return (
    <div className="min-h-screen bg-base pb-12 text-text">
      <div className="space-y-6">
        <header className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-brand-primary-subtle via-surface to-surface-alt p-6 shadow-card">
          <div className="relative z-10 space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Tarefas</p>
            <h2 className="font-display text-2xl text-text">Rotinas e lembretes internos</h2>
            <p className="text-sm text-text-muted">
              Planeje atividades por lead, cliente ou caso. Lembretes somente no app.
            </p>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border bg-white/90 shadow-soft">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs text-text-subtle">Pendentes</p>
                <p className="text-2xl font-semibold text-text">{summary.pending}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning-bg text-warning">
                <Clock className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-white/90 shadow-soft">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs text-text-subtle">Atrasadas</p>
                <p className="text-2xl font-semibold text-text">{summary.overdue}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-danger-bg text-danger">
                <Clock className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-white/90 shadow-soft">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs text-text-subtle">Concluidas</p>
                <p className="text-2xl font-semibold text-text">{summary.done}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success-bg text-success">
                <CheckCircle className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border bg-white/90">
          <CardHeader className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>Lista de tarefas</CardTitle>
              <p className="text-xs text-text-subtle">Organize por prioridade e vencimento.</p>
            </div>
            <Button onClick={openCreateModal} className="h-10 rounded-full px-4">
              <Plus className="mr-2 h-4 w-4" />
              Nova tarefa
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[260px]">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
                <Input
                  className="h-11 rounded-full border border-border bg-surface pl-11 text-sm text-text placeholder:text-text-subtle"
                  placeholder="Buscar tarefas..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <select
                className="h-11 rounded-full border border-border bg-white px-4 text-sm text-text"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
              >
                <option value="todos">Status</option>
                <option value="pendente">Pendente</option>
                <option value="em_progresso">Em progresso</option>
                <option value="concluida">Concluida</option>
              </select>
              <select
                className="h-11 rounded-full border border-border bg-white px-4 text-sm text-text"
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value as typeof priorityFilter)}
              >
                <option value="todos">Prioridade</option>
                <option value="baixa">Baixa</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
              </select>
              <select
                className="h-11 rounded-full border border-border bg-white px-4 text-sm text-text"
                value={linkFilter}
                onChange={(event) => setLinkFilter(event.target.value as typeof linkFilter)}
              >
                <option value="todos">Vinculo</option>
                <option value="lead">Lead</option>
                <option value="cliente">Cliente</option>
                <option value="caso">Caso</option>
              </select>
              {linkFilter !== 'todos' && (
                <input
                  className="h-11 rounded-full border border-border bg-white px-4 text-sm text-text"
                  placeholder="ID do vinculo"
                  value={linkIdFilter}
                  onChange={(event) => setLinkIdFilter(event.target.value)}
                />
              )}
            </div>

            <PageState status={pageState} emptyTitle="Nenhuma tarefa encontrada">
              <div className="space-y-3">
                {sortedTarefas.map((task) => {
                  const displayTitle = stripChecklistPrefix(task.title)
                  const isOverdue =
                    task.dueDate && task.status !== 'concluida' && task.dueDate < todayIso
                  return (
                    <div
                      key={task.id}
                      className={cn(
                        'flex flex-wrap items-center gap-4 rounded-2xl border p-4 shadow-soft',
                        'border-border bg-white'
                      )}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <ListTodo className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-text">{displayTitle}</p>
                          <span
                            className={cn(
                              'inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase',
                              statusBadge(task.status),
                            )}
                          >
                            {task.status.replace('_', ' ')}
                          </span>
                          <span
                            className={cn(
                              'inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase',
                              priorityBadge(task.priority),
                            )}
                          >
                            {task.priority}
                          </span>
                          {isOverdue && (
                            <span className="rounded-full border border-danger-border bg-danger-bg px-2.5 py-0.5 text-[10px] font-semibold uppercase text-danger">
                              atrasada
                            </span>
                          )}
                        </div>
                        {task.description && (
                          <p className="mt-1 text-xs text-text-subtle">{task.description}</p>
                        )}
                        <div className="mt-2 text-xs text-text-subtle">
                          {resolveLinkLabel(task)}
                          {task.dueDate && (
                            <span className="ml-3">Vence em {formatDate(task.dueDate)}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 rounded-full px-3"
                          onClick={() => handleToggleStatus(task)}
                        >
                          {task.status === 'concluida' ? 'Reabrir' : 'Concluir'}
                        </Button>
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-muted hover:text-text"
                          onClick={() => openEditModal(task)}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-muted hover:text-danger"
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
          </CardContent>
        </Card>
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingTask ? 'Editar tarefa' : 'Nova tarefa'}
        description="Registre tarefas e lembretes internos."
        footer={
          <>
            <Button variant="ghost" onClick={closeModal} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar tarefa'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && (
            <div className="rounded-2xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
              {formError}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-text-subtle">Titulo</label>
            <Input
              value={formState.title}
              onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Ex: Checar prazos do projeto"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-text-subtle">Descricao</label>
            <textarea
              className="min-h-[120px] w-full rounded-2xl border border-border bg-white px-3 py-2 text-sm text-text"
              value={formState.description}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="Detalhes da tarefa"
            />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-text-subtle">Prioridade</label>
              <select
                className="h-10 w-full rounded-2xl border border-border bg-white px-3 text-sm text-text"
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
              <label className="text-xs uppercase tracking-wide text-text-subtle">Status</label>
              <select
                className="h-10 w-full rounded-2xl border border-border bg-white px-3 text-sm text-text"
                value={formState.status}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    status: event.target.value as Tarefa['status'],
                  }))
                }
              >
                <option value="pendente">Pendente</option>
                <option value="em_progresso">Em progresso</option>
                <option value="concluida">Concluida</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-text-subtle">Vencimento</label>
              <Input
                type="date"
                value={formState.dueDate}
                onChange={(event) => setFormState((prev) => ({ ...prev, dueDate: event.target.value }))}
              />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-text-subtle">Vinculo</label>
              <select
                className="h-10 w-full rounded-2xl border border-border bg-white px-3 text-sm text-text"
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
              <label className="text-xs uppercase tracking-wide text-text-subtle">Selecionar</label>
              <select
                className="h-10 w-full rounded-2xl border border-border bg-white px-3 text-sm text-text"
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
    </div>
  )
}
