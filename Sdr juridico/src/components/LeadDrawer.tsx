import * as React from 'react'
import {
  Mail, Phone, UserRound, X, History, MessageSquare,
  Building2, MapPin, Calendar, Flame, Sun, Snowflake,
  CheckCircle2, Clock, FileText
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Modal } from '@/components/ui/modal'
import type { Caso, Lead } from '@/types/domain'
import { stripChecklistPrefix } from '@/utils/checklist'
import { formatDate, formatDateTime, formatPhone } from '@/utils/format'
import { useMensagens } from '@/hooks/useMensagens'
import { useTarefas } from '@/hooks/useTarefas'
import { supabase } from '@/lib/supabaseClient'
import { cn } from '@/utils/cn'

export interface LeadDrawerProps {
  open: boolean
  lead: Lead | null
  relatedCase?: Caso
  onClose: () => void
}

type TabType = 'detalhes' | 'historico' | 'tarefas' | 'mensagens'

const STATUS_LABELS: Record<string, string> = {
  novo: 'Novo',
  em_contato: 'Em Contato',
  qualificado: 'Qualificado',
  proposta: 'Proposta',
  ganho: 'Ganho',
  perdido: 'Perdido',
}

const STATUS_COLORS: Record<string, string> = {
  novo: 'bg-slate-100 text-slate-800 border-slate-200',
  em_contato: 'bg-blue-100 text-blue-800 border-blue-200',
  qualificado: 'bg-amber-100 text-amber-800 border-amber-200',
  proposta: 'bg-purple-100 text-purple-800 border-purple-200',
  ganho: 'bg-green-100 text-green-800 border-green-200',
  perdido: 'bg-red-100 text-red-800 border-red-200',
}

const HEAT_LABELS: Record<string, string> = {
  quente: 'Quente',
  morno: 'Morno',
  frio: 'Frio',
}

const HEAT_COLORS: Record<string, string> = {
  quente: 'bg-red-100 text-red-700 border-red-200',
  morno: 'bg-amber-100 text-amber-700 border-amber-200',
  frio: 'bg-sky-100 text-sky-700 border-sky-200',
}

const heatIcon = (heat: string) => {
  if (heat === 'quente') return <Flame className="w-3 h-3" />
  if (heat === 'morno') return <Sun className="w-3 h-3" />
  return <Snowflake className="w-3 h-3" />
}

interface HistoryEntry {
  id: string
  created_at: string
  status_anterior: string | null
  status_novo: string | null
  heat_anterior: string | null
  heat_novo: string | null
  changed_by: string | null
  changed_by_name: string | null
  motivo: string | null
}

export const LeadDrawer = ({ open, lead, relatedCase, onClose }: LeadDrawerProps) => {
  const navigate = useNavigate()
  const { mensagens, loading: mensagensLoading } = useMensagens(lead?.id)
  const { tarefas, loading: tarefasLoading, fetchTarefasByEntidade } = useTarefas()

  const [activeTab, setActiveTab] = React.useState<TabType>('detalhes')
  const [history, setHistory] = React.useState<HistoryEntry[]>([])
  const [historyLoading, setHistoryLoading] = React.useState(false)

  const fetchHistory = React.useCallback(async (leadId: string) => {
    setHistoryLoading(true)
    try {
      const { data, error } = await supabase
        .from('lead_status_history')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setHistory(data || [])
    } catch (err) {
      console.error('Erro ao buscar histórico:', err)
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (!open || !lead?.id) return
    fetchTarefasByEntidade('lead', lead.id).catch(() => null)
    fetchHistory(lead.id)
  }, [open, lead?.id, fetchTarefasByEntidade, fetchHistory])

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'detalhes', label: 'Detalhes', icon: <FileText className="h-4 w-4" /> },
    { key: 'historico', label: 'Histórico', icon: <History className="h-4 w-4" /> },
    { key: 'tarefas', label: 'Tarefas', icon: <CheckCircle2 className="h-4 w-4" /> },
    { key: 'mensagens', label: 'Mensagens', icon: <MessageSquare className="h-4 w-4" /> },
  ]

  return (
    <Modal noPadding open={open && !!lead} onClose={onClose} maxWidth="36rem">
      {lead && (
        <div style={{ display: 'flex', flexDirection: 'column', borderRadius: 16, overflow: 'hidden', maxHeight: '82vh' }}>

          {/* Header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <UserRound style={{ width: 20, height: 20, color: '#6b7280' }} />
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111827', margin: 0, lineHeight: 1.3 }}>
                  {lead.name}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full border',
                    STATUS_COLORS[lead.status] || 'bg-gray-100 text-gray-700 border-gray-200'
                  )}>
                    {STATUS_LABELS[lead.status] || lead.status}
                  </span>
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full border flex items-center gap-1',
                    HEAT_COLORS[lead.heat] || 'bg-gray-100 text-gray-700 border-gray-200'
                  )}>
                    {heatIcon(lead.heat)}
                    {HEAT_LABELS[lead.heat] || lead.heat}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="hover:bg-gray-100 transition-colors"
              style={{ padding: 8, borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <X style={{ width: 20, height: 20 }} />
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb', flexShrink: 0 }}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '12px 8px',
                  fontSize: 13, fontWeight: 500,
                  border: 'none',
                  borderBottom: activeTab === tab.key
                    ? '2px solid var(--brand-primary, #721011)'
                    : '2px solid transparent',
                  backgroundColor: activeTab === tab.key ? '#ffffff' : 'transparent',
                  color: activeTab === tab.key ? 'var(--brand-primary, #721011)' : '#6b7280',
                  cursor: 'pointer',
                  transition: 'all 150ms',
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', minHeight: 0 }}>

            {/* Tab: Detalhes */}
            {activeTab === 'detalhes' && (
              <div className="space-y-6">
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Informações de Contato
                  </h3>
                  <div className="space-y-2">
                    {lead.email && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">E-mail</p>
                          <p className="text-sm font-medium">{lead.email}</p>
                        </div>
                      </div>
                    )}
                    {lead.phone && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Phone className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Telefone</p>
                          <p className="text-sm font-medium">{formatPhone(lead.phone)}</p>
                        </div>
                      </div>
                    )}
                    {lead.company && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Building2 className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Empresa</p>
                          <p className="text-sm font-medium">{lead.company}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Informações Comerciais
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Origem</p>
                        <p className="text-sm font-medium capitalize">{lead.origin}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Área de Interesse</p>
                        <p className="text-sm font-medium">{lead.area}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <UserRound className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Responsável</p>
                        <p className="text-sm font-medium">{lead.owner}</p>
                      </div>
                    </div>
                  </div>
                </section>

                {lead.notes && (
                  <section className="space-y-3">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Observações
                    </h3>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.notes}</p>
                    </div>
                  </section>
                )}

                <section className="space-y-2 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>Criado em: {formatDateTime(lead.createdAt)}</span>
                  </div>
                  {lead.lastContactAt && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>Último contato: {formatDateTime(lead.lastContactAt)}</span>
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* Tab: Histórico */}
            {activeTab === 'historico' && (
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Timeline de Alterações
                </h3>

                {historyLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-brand-primary border-t-transparent" />
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <History className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p>Nenhum histórico registrado</p>
                    <p className="text-xs mt-1">Alterações de status e temperatura aparecerão aqui</p>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />
                    <div className="space-y-4">
                      {history.map((entry, index) => (
                        <div key={entry.id} className="relative pl-8">
                          <div className={cn(
                            'absolute left-0 w-6 h-6 rounded-full border-2 flex items-center justify-center bg-white',
                            index === history.length - 1 ? 'border-brand-primary' : 'border-gray-300'
                          )}>
                            <div className={cn(
                              'w-2 h-2 rounded-full',
                              index === history.length - 1 ? 'bg-brand-primary' : 'bg-gray-400'
                            )} />
                          </div>

                          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-gray-500">
                                {formatDateTime(entry.created_at)}
                              </span>
                              {entry.changed_by_name && (
                                <span className="text-xs text-gray-400">
                                  por {entry.changed_by_name}
                                </span>
                              )}
                            </div>

                            {entry.status_novo && (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-600">Status:</span>
                                {entry.status_anterior && (
                                  <>
                                    <span className={cn('px-2 py-0.5 rounded text-xs', STATUS_COLORS[entry.status_anterior] || 'bg-gray-100')}>
                                      {STATUS_LABELS[entry.status_anterior] || entry.status_anterior}
                                    </span>
                                    <span className="text-gray-400">→</span>
                                  </>
                                )}
                                <span className={cn('px-2 py-0.5 rounded text-xs font-medium', STATUS_COLORS[entry.status_novo] || 'bg-gray-100')}>
                                  {STATUS_LABELS[entry.status_novo] || entry.status_novo}
                                </span>
                              </div>
                            )}

                            {entry.heat_novo && (
                              <div className="flex items-center gap-2 text-sm mt-1">
                                <span className="text-gray-600">Temperatura:</span>
                                {entry.heat_anterior && (
                                  <>
                                    <span className={cn('px-2 py-0.5 rounded text-xs border', HEAT_COLORS[entry.heat_anterior] || 'bg-gray-100')}>
                                      {HEAT_LABELS[entry.heat_anterior] || entry.heat_anterior}
                                    </span>
                                    <span className="text-gray-400">→</span>
                                  </>
                                )}
                                <span className={cn('px-2 py-0.5 rounded text-xs font-medium border', HEAT_COLORS[entry.heat_novo] || 'bg-gray-100')}>
                                  {HEAT_LABELS[entry.heat_novo] || entry.heat_novo}
                                </span>
                              </div>
                            )}

                            {entry.motivo && (
                              <p className="text-xs text-gray-500 mt-2 italic">
                                "{entry.motivo}"
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

            {/* Tab: Tarefas */}
            {activeTab === 'tarefas' && (
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Tarefas Vinculadas
                </h3>

                {tarefasLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-brand-primary border-t-transparent" />
                  </div>
                ) : tarefas.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p>Nenhuma tarefa vinculada</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tarefas.map((tarefa) => (
                      <div
                        key={tarefa.id}
                        className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded-full font-medium',
                            tarefa.status === 'concluida' ? 'bg-green-100 text-green-700' :
                            tarefa.status === 'em_andamento' ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-100 text-gray-700'
                          )}>
                            {tarefa.status.replace('_', ' ')}
                          </span>
                          {tarefa.dueDate && (
                            <span className="text-xs text-gray-500">
                              Vence: {formatDate(tarefa.dueDate)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {stripChecklistPrefix(tarefa.title)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Mensagens */}
            {activeTab === 'mensagens' && (
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Histórico de Mensagens
                </h3>

                {mensagensLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-brand-primary border-t-transparent" />
                  </div>
                ) : mensagens.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p>Nenhuma mensagem registrada</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mensagens.map((msg) => (
                      <div
                        key={msg.id}
                        className="p-3 bg-gray-50 rounded-lg border border-gray-100"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded-full font-medium',
                            msg.author === 'SDR'
                              ? 'bg-sky-100 text-sky-700'
                              : 'bg-amber-100 text-amber-700'
                          )}>
                            {msg.author}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDateTime(msg.date)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ borderTop: '1px solid #e5e7eb', padding: '16px 24px', display: 'flex', gap: 12, flexShrink: 0, backgroundColor: '#ffffff' }}>
            {lead.phone && (
              <button
                onClick={() => {
                  const phoneNumber = lead.phone?.replace(/\D/g, '')
                  window.open(`https://wa.me/55${phoneNumber}`, '_blank')
                }}
                className="hover:bg-gray-50 transition-colors"
                style={{
                  flex: 1, padding: '8px 16px', borderRadius: 8,
                  border: '1px solid #e5e7eb', backgroundColor: '#ffffff',
                  color: '#374151', fontSize: 14, fontWeight: 500,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <MessageSquare style={{ width: 16, height: 16 }} />
                Enviar WhatsApp
              </button>
            )}
            {relatedCase ? (
              <button
                onClick={() => navigate(`/app/caso/${relatedCase.id}`)}
                className="hover:opacity-90 transition-opacity"
                style={{
                  flex: 1, padding: '8px 16px', borderRadius: 8, border: 'none',
                  backgroundColor: 'var(--brand-primary, #721011)', color: '#ffffff',
                  fontSize: 14, fontWeight: 500, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                Abrir dossiê
              </button>
            ) : (
              <button
                onClick={() => navigate(`/app/leads?convert=${lead.id}`)}
                className="hover:opacity-90 transition-opacity"
                style={{
                  flex: 1, padding: '8px 16px', borderRadius: 8, border: 'none',
                  backgroundColor: 'var(--brand-primary, #721011)', color: '#ffffff',
                  fontSize: 14, fontWeight: 500, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                Converter em caso
              </button>
            )}
          </div>

        </div>
      )}
    </Modal>
  )
}
