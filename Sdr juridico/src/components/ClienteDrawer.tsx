import * as React from 'react'
import { Briefcase, ShieldCheck, UserRound, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Modal } from '@/components/ui/modal'
import type { Cliente } from '@/types/domain'
import { formatDate, formatDateTime } from '@/utils/format'
import { stripChecklistPrefix } from '@/utils/checklist'
import { useTarefas } from '@/hooks/useTarefas'
import { CaseIntelligencePanel } from '@/components/CaseIntelligence'

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
  const navigate = useNavigate()
  const { tarefas, loading: tarefasLoading, fetchTarefasByEntidade } = useTarefas()

  React.useEffect(() => {
    if (!open || !cliente?.id) return
    fetchTarefasByEntidade('cliente', cliente.id).catch(() => null)
  }, [open, cliente?.id, fetchTarefasByEntidade])

  return (
    <Modal noPadding open={open && !!cliente} onClose={onClose} maxWidth="34rem">
      {cliente && (
        <div style={{ display: 'flex', flexDirection: 'column', borderRadius: 16, overflow: 'hidden', maxHeight: '82vh' }}>

          {/* Header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
            <div>
              <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.32em', color: '#9ca3af', margin: 0, marginBottom: 6 }}>
                Cliente
              </p>
              <h3 style={{ fontSize: 22, fontWeight: 600, color: '#111827', margin: 0, lineHeight: 1.3 }}>
                {cliente.name}
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusPill(cliente.status)}`}>
                  {cliente.status}
                </span>
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${healthPill(cliente.health)}`}>
                  {cliente.health}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="hover:bg-gray-100 transition-colors"
              style={{ padding: 8, borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', color: '#6b7280', flexShrink: 0, marginTop: -4 }}
            >
              <X style={{ width: 20, height: 20 }} />
            </button>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', minHeight: 0 }} className="space-y-6 text-sm">

            {/* Resumo */}
            <section className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-text-subtle">Resumo</p>
              <div className="rounded-xl border border-gray-100 bg-white px-4 py-4 shadow-sm">
                <div className="flex items-center gap-2 text-text-muted">
                  <Briefcase className="h-4 w-4 text-text-subtle" />
                  <span>{cliente.area}</span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-text-muted">
                  <UserRound className="h-4 w-4 text-text-subtle" />
                  <span>{cliente.owner}</span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-text-muted">
                  <ShieldCheck className="h-4 w-4 text-text-subtle" />
                  <span>{cliente.caseCount} casos vinculados</span>
                </div>
              </div>
              <p className="text-xs text-text-subtle">
                Atualizado em {formatDateTime(cliente.lastUpdate)}
              </p>
            </section>

            {/* Inteligência Preditiva — só para pessoa física com CPF */}
            {cliente.cpf && (
              <section className="space-y-3">
                <CaseIntelligencePanel
                  cpf={cliente.cpf}
                  clienteId={cliente.id}
                  colapsado={true}
                  onConfigureClick={() => { onClose(); navigate('/app/config') }}
                />
              </section>
            )}

            {/* Tarefas */}
            <section className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-text-subtle">Tarefas</p>
              <div className="space-y-2">
                {tarefasLoading && (
                  <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 text-xs text-text-subtle shadow-sm">
                    Carregando tarefas...
                  </div>
                )}
                {!tarefasLoading && tarefas.length === 0 && (
                  <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 text-xs text-text-subtle shadow-sm">
                    Nenhuma tarefa vinculada a este cliente.
                  </div>
                )}
                {tarefas.map((tarefa) => (
                  <div
                    key={tarefa.id}
                    className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm transition hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase text-gray-600">
                        {tarefa.status.replace('_', ' ')}
                      </span>
                      {tarefa.dueDate && <span>Vence em {formatDate(tarefa.dueDate)}</span>}
                    </div>
                    <p className="mt-2 text-sm text-gray-900">{stripChecklistPrefix(tarefa.title)}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Footer */}
          <div style={{ borderTop: '1px solid #e5e7eb', padding: '16px 24px', display: 'flex', gap: 12, flexShrink: 0, backgroundColor: '#ffffff' }}>
            <button
              onClick={onClose}
              className="hover:bg-gray-50 transition-colors"
              style={{
                padding: '8px 20px', borderRadius: 8,
                border: '1px solid #e5e7eb', backgroundColor: '#ffffff',
                color: '#374151', fontSize: 14, fontWeight: 500, cursor: 'pointer',
              }}
            >
              Fechar
            </button>
          </div>

        </div>
      )}
    </Modal>
  )
}
