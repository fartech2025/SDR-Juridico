import * as React from 'react'
import { createPortal } from 'react-dom'
import { Briefcase, ShieldCheck, UserRound } from 'lucide-react'

import heroLight from '@/assets/hero-light.svg'
import { Button } from '@/components/ui/button'
import type { Cliente } from '@/types/domain'
import { formatDate, formatDateTime } from '@/utils/format'
import { useTarefas } from '@/hooks/useTarefas'

export interface ClienteDrawerProps {
  open: boolean
  cliente: Cliente | null
  onClose: () => void
}

const statusPill = (status: Cliente['status']) => {
  if (status === 'inativo') return 'border-border bg-surface-2 text-text-muted'
  if (status === 'em_risco') return 'border-danger-border bg-danger-bg text-danger'
  return 'border-success-border bg-success-bg text-success'
}

const healthPill = (health: Cliente['health']) => {
  if (health === 'critico') return 'border-danger-border bg-danger-bg text-danger'
  if (health === 'atencao') return 'border-warning-border bg-warning-bg text-warning'
  return 'border-success-border bg-success-bg text-success'
}

export const ClienteDrawer = ({ open, cliente, onClose }: ClienteDrawerProps) => {
  const { tarefas, loading: tarefasLoading, fetchTarefasByEntidade } = useTarefas()

  React.useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  React.useEffect(() => {
    if (!open || !cliente?.id) return
    fetchTarefasByEntidade('cliente', cliente.id).catch(() => null)
  }, [open, cliente?.id, fetchTarefasByEntidade])

  if (!open || !cliente) return null

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-[rgba(17,24,39,0.35)]"
        style={{ backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[480px] flex-col rounded-l-2xl border-l border-border bg-white shadow-[0_18px_50px_rgba(18,38,63,0.18)]">
        <div
          className="relative overflow-hidden border-b border-border px-6 py-6"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.96) 70%, rgba(215,236,255,0.3) 100%), url(${heroLight})`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right top',
            backgroundSize: '320px',
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.32em] text-text-subtle">
                Cliente
              </p>
              <h3 className="font-display text-2xl text-text">{cliente.name}</h3>
              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusPill(cliente.status)}`}>
                  {cliente.status}
                </span>
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${healthPill(cliente.health)}`}>
                  {cliente.health}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="text-sm text-text-subtle hover:text-text"
              onClick={onClose}
              aria-label="Fechar"
            >
              Fechar
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5 text-sm text-text-muted">
          <section className="space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-text-subtle">Resumo</p>
            <div className="rounded-2xl border border-border bg-white px-4 py-4 shadow-soft">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-text-subtle" />
                <span>{cliente.area}</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <UserRound className="h-4 w-4 text-text-subtle" />
                <span>{cliente.owner}</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-text-subtle" />
                <span>{cliente.caseCount} casos vinculados</span>
              </div>
            </div>
            <p className="text-xs text-text-subtle">
              Atualizado em {formatDateTime(cliente.lastUpdate)}
            </p>
          </section>

          <section className="space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-text-subtle">
              Tarefas
            </p>
            <div className="space-y-2">
              {tarefasLoading && (
                <div className="rounded-2xl border border-border bg-white px-4 py-3 text-xs text-text-subtle shadow-soft">
                  Carregando tarefas...
                </div>
              )}
              {!tarefasLoading && tarefas.length === 0 && (
                <div className="rounded-2xl border border-border bg-white px-4 py-3 text-xs text-text-subtle shadow-soft">
                  Nenhuma tarefa vinculada a este cliente.
                </div>
              )}
              {tarefas.map((tarefa) => (
                <div
                  key={tarefa.id}
                  className="rounded-2xl border border-border bg-white px-4 py-3 shadow-soft transition hover:bg-surface-2"
                >
                  <div className="flex items-center justify-between text-xs text-text-subtle">
                    <span className="inline-flex rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-[11px] font-semibold uppercase text-text-muted">
                      {tarefa.status.replace('_', ' ')}
                    </span>
                    {tarefa.dueDate && <span>Vence em {formatDate(tarefa.dueDate)}</span>}
                  </div>
                  <p className="mt-2 text-sm text-text">{tarefa.title}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="border-t border-border bg-white/95 px-6 py-4">
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-full">
            Fechar
          </Button>
        </div>
      </aside>
    </div>,
    document.body,
  )
}
