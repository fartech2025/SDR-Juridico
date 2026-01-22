import * as React from 'react'
import { createPortal } from 'react-dom'
import { Mail, MessageSquare, Phone, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import heroLight from '@/assets/hero-light.svg'
import { Button } from '@/components/ui/button'
import type { Caso, Lead } from '@/types/domain'
import { formatDate, formatDateTime, formatPhone } from '@/utils/format'
import { useMensagens } from '@/hooks/useMensagens'
import { useTarefas } from '@/hooks/useTarefas'

export interface LeadDrawerProps {
  open: boolean
  lead: Lead | null
  relatedCase?: Caso
  onClose: () => void
}

export const LeadDrawer = ({ open, lead, relatedCase, onClose }: LeadDrawerProps) => {
  const navigate = useNavigate()
  const { mensagens, loading } = useMensagens(lead?.id)
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
    if (!open || !lead?.id) return
    fetchTarefasByEntidade('lead', lead.id).catch(() => null)
  }, [open, lead?.id, fetchTarefasByEntidade])

  if (!open || !lead) return null

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-[rgba(17,24,39,0.35)]"
        style={{ backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />
      <aside
        className="absolute right-0 top-0 flex h-full w-full max-w-[460px] flex-col rounded-l-2xl border-l border-border bg-white shadow-[0_18px_50px_rgba(18,38,63,0.18)]"
      >
        <div
          className="relative overflow-hidden border-b border-border px-6 py-6"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.96) 70%, rgba(255,216,232,0.22) 100%), url(${heroLight})`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right top',
            backgroundSize: '320px',
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.32em] text-text-subtle">
                Lead
              </p>
              <h3 className="font-display text-2xl text-text">{lead.name}</h3>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex rounded-full border border-[#D6E4FF] bg-[#E6F0FF] px-3 py-1 text-xs font-semibold text-[#1D4ED8]">
                  {lead.status}
                </span>
                <span className="inline-flex rounded-full border border-[#F5C2C2] bg-[#FFE1E1] px-3 py-1 text-xs font-semibold text-[#B42318]">
                  {lead.heat}
                </span>
                <span className="inline-flex rounded-full border border-[#D6E4FF] bg-[#EEF4FF] px-3 py-1 text-xs font-semibold text-[#2F6BFF]">
                  {lead.area}
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
            <p className="text-xs uppercase tracking-[0.2em] text-text-subtle">
              Resumo
            </p>
            <div className="rounded-2xl border border-border bg-white px-4 py-4 shadow-soft">
              Lead originado via {lead.origin}. Atendimento conduzido por {lead.owner}.
              Proxima acao: confirmar documentacao e proposta final.
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-text-subtle">
              Contato
            </p>
            <div className="rounded-2xl border border-border bg-white px-4 py-4 shadow-soft">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-text-subtle" />
                <span>{lead.email}</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Phone className="h-4 w-4 text-text-subtle" />
                <span>{formatPhone(lead.phone)}</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <UserRound className="h-4 w-4 text-text-subtle" />
                <span>{lead.owner}</span>
              </div>
            </div>
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
                  Nenhuma tarefa vinculada a este lead.
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

          <section className="space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-text-subtle">
              Ultimas mensagens
            </p>
            <div className="space-y-2">
              {loading && (
                <div className="rounded-2xl border border-border bg-white px-4 py-3 text-xs text-text-subtle shadow-soft">
                  Carregando mensagens...
                </div>
              )}
              {!loading && mensagens.length === 0 && (
                <div className="rounded-2xl border border-border bg-white px-4 py-3 text-xs text-text-subtle shadow-soft">
                  Nenhuma mensagem registrada ainda.
                </div>
              )}
              {mensagens.map((message) => (
                <div
                  key={message.id}
                  className="rounded-2xl border border-border bg-white px-4 py-3 shadow-soft transition hover:bg-surface-2"
                >
                  <div className="flex items-center justify-between text-xs text-text-subtle">
                    <span
                      className={
                        message.author === 'SDR'
                          ? 'inline-flex rounded-full border border-[#D6E4FF] bg-[#E6F0FF] px-2.5 py-0.5 text-[11px] font-semibold text-[#1D4ED8]'
                          : 'inline-flex rounded-full border border-[#F5D6B2] bg-[#FFF1E3] px-2.5 py-0.5 text-[11px] font-semibold text-[#B45309]'
                      }
                    >
                      {message.author}
                    </span>
                    <span>{formatDateTime(message.date)}</span>
                  </div>
                  <p className="mt-2 text-sm text-text">{message.content}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="border-t border-border bg-white/95 px-6 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/app/leads')}
              className="rounded-full"
            >
              <MessageSquare className="h-4 w-4" />
              Enviar mensagem
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => relatedCase && navigate(`/app/caso/${relatedCase.id}`)}
              disabled={!relatedCase}
              className="flex-1 rounded-full justify-center"
            >
              Abrir dossie
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Fechar
            </Button>
          </div>
          {!relatedCase && (
            <p className="mt-2 text-xs text-text-subtle">
              Nenhum dossie vinculado a este lead.
            </p>
          )}
        </div>
      </aside>
    </div>,
    document.body,
  )
}
