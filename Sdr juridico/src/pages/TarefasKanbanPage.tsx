import * as React from 'react'
import { Clock, Plus, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { PageState } from '@/components/PageState'
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

const statusBadge = (status: Tarefa['status']) => {
  if (status === 'concluida') return 'border-success-border bg-success-bg text-success'
  if (status === 'aguardando_validacao') return 'border-info-border bg-info-bg text-info'
  if (status === 'devolvida') return 'border-danger-border bg-danger-bg text-danger'
  if (status === 'em_progresso') return 'border-warning-border bg-warning-bg text-warning'
  return 'border-border bg-surface-2 text-text-muted'
}

const priorityBadge = (priority: Tarefa['priority']) => {
  if (priority === 'alta') return 'border-danger-border bg-danger-bg text-danger'
  if (priority === 'normal') return 'border-info-border bg-info-bg text-info'
  return 'border-border bg-surface-2 text-text-muted'
}

const isOverdue = (t: Tarefa) => {
  if (!t.dueDate) return false
  if (t.status === 'concluida') return false
  return new Date(t.dueDate).getTime() < Date.now()
}

export const TarefasKanbanPage = () => {
  const role = useTaskUiRole()
  const {
    tarefas,
    loading,
    error,
    fetchTarefas,
    createTarefa,
    updateTarefa,
    submitForConfirmation,
    approveTarefa,
    rejectTarefa,
  } = useTarefas()

  const [query, setQuery] = React.useState('')
  const [modalOpen, setModalOpen] = React.useState(false)
  const [active, setActive] = React.useState<Tarefa | null>(null)
  const [rejectReason, setRejectReason] = React.useState('')

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
    setModalOpen(true)
  }

  const canApprove = role !== 'ADVOGADO'
  const canCreate = role !== 'ADVOGADO'

  const onMove = async (t: Tarefa, next: ColumnKey) => {
    if (role === 'ADVOGADO') {
      // advogado não muda tarefas fora do fluxo dele
      if (t.status === 'aguardando_validacao' || t.status === 'concluida') return
      if (next === 'concluida' || next === 'devolvida') return
    }
    await updateTarefa(t.id, { status: next })
  }

  const kpi = React.useMemo(() => {
    const overdue = tarefas.filter(isOverdue).length
    const awaiting = tarefas.filter((t) => t.status === 'aguardando_validacao').length
    return { overdue, awaiting }
  }, [tarefas])

  if (loading) return <PageState title="Carregando tarefas..." description="Aguarde um momento." />
  if (error)
    return (
      <PageState
        title="Erro ao carregar tarefas"
        description={error.message}
        actionLabel="Tentar novamente"
        onAction={fetchTarefas}
      />
    )

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Quadro de Tarefas</CardTitle>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-text-muted">
              <span>
                Atrasadas: <b className="text-text">{kpi.overdue}</b>
              </span>
              <span>
                Aguardando confirmação: <b className="text-text">{kpi.awaiting}</b>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
              <Input
                className="pl-9 w-[280px]"
                placeholder="Buscar tarefas..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            {canCreate && (
              <Button
                onClick={() =>
                  createTarefa({ title: 'Nova tarefa', description: '', priority: 'normal', status: 'pendente' })
                }
              >
                <Plus className="mr-2 h-4 w-4" /> Nova tarefa
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 lg:grid-cols-5">
        {(Object.keys(COLUMN_LABELS) as ColumnKey[]).map((key) => {
          const items = byStatus.get(key) || []
          return (
            <Card key={key} className="min-h-[560px]">
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-semibold">
                  {COLUMN_LABELS[key]} ({items.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-3">
                {items.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => openTask(t)}
                    className={cn(
                      'w-full text-left rounded-xl border bg-background p-3 shadow-sm hover:bg-surface-2 transition',
                      isOverdue(t) ? 'border-danger-border' : 'border-border',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium">{t.title}</div>
                      <span
                        className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs', priorityBadge(t.priority))}
                      >
                        {t.priority}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                      <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5', statusBadge(t.status))}>
                        {t.status}
                      </span>
                      {t.dueDate && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> {formatDate(t.dueDate)}
                        </span>
                      )}
                      {isOverdue(t) && <span className="text-danger font-medium">Atrasada</span>}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {role === 'ADVOGADO' && key === 'pendente' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            void onMove(t, 'em_progresso')
                          }}
                        >
                          Iniciar
                        </Button>
                      )}
                      {role === 'ADVOGADO' && key === 'em_progresso' && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            void submitForConfirmation(t.id)
                          }}
                        >
                          Enviar p/ Confirmação
                        </Button>
                      )}
                      {canApprove && key === 'aguardando_validacao' && (
                        <>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              void approveTarefa(t.id)
                            }}
                          >
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setActive(t)
                              setModalOpen(true)
                            }}
                          >
                            Devolver
                          </Button>
                        </>
                      )}
                    </div>
                  </button>
                ))}
                {items.length === 0 && <div className="text-sm text-text-muted">Sem tarefas</div>}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={active ? active.title : 'Tarefa'}>
        {active ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="text-sm">
                <div className="text-text-muted">Status</div>
                <div className="font-medium">{COLUMN_LABELS[active.status]}</div>
              </div>
              <div className="text-sm">
                <div className="text-text-muted">Prazo</div>
                <div className="font-medium">{active.dueDate ? formatDate(active.dueDate) : '—'}</div>
              </div>
              <div className="text-sm">
                <div className="text-text-muted">Prioridade</div>
                <div className="font-medium">{active.priority}</div>
              </div>
              <div className="text-sm">
                <div className="text-text-muted">Descrição</div>
                <div className="mt-1 whitespace-pre-wrap">{active.description || '—'}</div>
              </div>
            </div>

            {canApprove && active.status === 'aguardando_validacao' && (
              <div className="space-y-2">
                <div className="text-sm text-text-muted">Motivo da devolução (obrigatório)</div>
                <Input
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ex.: faltou RG/CPF, revisar tese, etc."
                />
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      const reason = rejectReason.trim()
                      if (!reason) return
                      await rejectTarefa(active.id, reason)
                      setModalOpen(false)
                    }}
                  >
                    Confirmar devolução
                  </Button>
                  <Button onClick={() => approveTarefa(active.id)}>Aprovar</Button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
