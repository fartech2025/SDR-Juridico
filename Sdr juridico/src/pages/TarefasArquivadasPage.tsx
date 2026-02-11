import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { useAuth } from '../contexts/AuthContext'
import { 
  Archive, 
  RotateCcw, 
  Trash2, 
  Calendar, 
  User, 
  Clock,
  AlertCircle,
  CheckCircle,
  Search,
  Filter
} from 'lucide-react'
import { formatDate, formatDateTime } from '@/utils/format'

interface TarefaArquivada {
  id: string
  titulo: string
  descricao: string | null
  status: string
  prioridade: string
  data_vencimento: string | null
  deleted_at: string
  deleted_by: string | null
  deleted_by_name?: string
  lead_id: string | null
  lead?: {
    nome: string
  } | null
  responsavel_id: string | null
  responsavel?: {
    nome: string
  } | null
}

export default function TarefasArquivadasPage() {
  const { orgId } = useCurrentUser()
  const { user } = useAuth()
  const userId = user?.id
  const [tarefas, setTarefas] = useState<TarefaArquivada[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [restoring, setRestoring] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (orgId) {
      fetchTarefasArquivadas()
    }
  }, [orgId])

  const fetchTarefasArquivadas = async () => {
    try {
      setLoading(true)
      
      // Busca tarefas com deleted_at preenchido
      const { data, error } = await supabase
        .from('tarefas')
        .select(`
          id,
          titulo,
          descricao,
          status,
          prioridade,
          data_vencimento,
          deleted_at,
          deleted_by,
          lead_id,
          responsavel_id,
          leads:lead_id (nome),
          usuarios:responsavel_id (nome)
        `)
        .eq('org_id', orgId)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })

      if (error) throw error

      // Busca os nomes de quem deletou
      const tarefasFormatadas = await Promise.all(
        (data || []).map(async (t: any) => {
          let deletedByName = null
          if (t.deleted_by) {
            const { data: userData } = await supabase
              .from('usuarios')
              .select('nome')
              .eq('id', t.deleted_by)
              .single()
            deletedByName = userData?.nome
          }

          return {
            ...t,
            deleted_by_name: deletedByName,
            lead: t.leads,
            responsavel: t.usuarios
          }
        })
      )

      setTarefas(tarefasFormatadas)
    } catch (error) {
      console.error('Erro ao buscar tarefas arquivadas:', error)
      showToast('Erro ao carregar tarefas arquivadas', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleRestore = async (tarefa: TarefaArquivada) => {
    try {
      setRestoring(tarefa.id)

      // Restaura a tarefa (remove deleted_at e deleted_by)
      const { error } = await supabase
        .from('tarefas')
        .update({ 
          deleted_at: null, 
          deleted_by: null 
        })
        .eq('id', tarefa.id)

      if (error) throw error

      // Registra no histórico
      await supabase.from('tarefa_status_history').insert({
        tarefa_id: tarefa.id,
        org_id: orgId,
        status_anterior: 'arquivada',
        status_novo: tarefa.status,
        changed_by: userId,
        motivo: 'Tarefa restaurada do arquivo'
      })

      setTarefas(prev => prev.filter(t => t.id !== tarefa.id))
      showToast('Tarefa restaurada com sucesso!', 'success')
    } catch (error) {
      console.error('Erro ao restaurar tarefa:', error)
      showToast('Erro ao restaurar tarefa', 'error')
    } finally {
      setRestoring(null)
    }
  }

  const handlePermanentDelete = async (tarefa: TarefaArquivada) => {
    if (!confirm('Tem certeza que deseja excluir permanentemente esta tarefa? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      setDeleting(tarefa.id)

      // Exclui permanentemente
      const { error } = await supabase
        .from('tarefas')
        .delete()
        .eq('id', tarefa.id)

      if (error) throw error

      setTarefas(prev => prev.filter(t => t.id !== tarefa.id))
      showToast('Tarefa excluída permanentemente', 'success')
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error)
      showToast('Erro ao excluir tarefa', 'error')
    } finally {
      setDeleting(null)
    }
  }

  const filteredTarefas = tarefas.filter(t => 
    t.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'alta': return 'bg-red-100 text-red-700 border-red-200'
      case 'media': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'baixa': return 'bg-green-100 text-green-700 border-green-200'
      default: return 'bg-surface-alt text-text border-border'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluida': return 'bg-green-100 text-green-700'
      case 'em_andamento': return 'bg-blue-100 text-blue-700'
      case 'pendente': return 'bg-yellow-100 text-yellow-700'
      case 'cancelada': return 'bg-red-100 text-red-700'
      default: return 'bg-surface-alt text-text'
    }
  }

  const formatStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      'pendente': 'Pendente',
      'em_andamento': 'Em Andamento',
      'concluida': 'Concluída',
      'cancelada': 'Cancelada'
    }
    return statusMap[status] || status
  }

  return (
    <div className="min-h-screen bg-surface-alt">
      {/* Header */}
      <div className="bg-white border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-surface-alt rounded-lg">
              <Archive className="w-6 h-6 text-text-muted" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text">Tarefas Arquivadas</h1>
              <p className="text-sm text-text-muted">
                {tarefas.length} tarefa{tarefas.length !== 1 ? 's' : ''} no arquivo
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-6 py-4 bg-white border-b border-border">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-subtle" />
          <input
            type="text"
            placeholder="Buscar tarefas arquivadas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border-strong rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredTarefas.length === 0 ? (
          <div className="text-center py-12">
            <Archive className="w-16 h-16 text-text-subtle mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text mb-2">
              {searchTerm ? 'Nenhuma tarefa encontrada' : 'Nenhuma tarefa arquivada'}
            </h3>
            <p className="text-text-muted">
              {searchTerm 
                ? 'Tente buscar por outro termo'
                : 'As tarefas arquivadas aparecerão aqui'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredTarefas.map((tarefa) => (
              <div
                key={tarefa.id}
                className="bg-white rounded-xl border border-border p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Título e badges */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-semibold text-text truncate">
                        {tarefa.titulo}
                      </h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(tarefa.status)}`}>
                        {formatStatus(tarefa.status)}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getPrioridadeColor(tarefa.prioridade)}`}>
                        {tarefa.prioridade}
                      </span>
                    </div>

                    {/* Descrição */}
                    {tarefa.descricao && (
                      <p className="text-sm text-text-muted mb-3 line-clamp-2">
                        {tarefa.descricao}
                      </p>
                    )}

                    {/* Meta info */}
                    <div className="flex items-center gap-4 text-sm text-text-muted flex-wrap">
                      {tarefa.lead && (
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {tarefa.lead.nome}
                        </span>
                      )}
                      {tarefa.data_vencimento && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(tarefa.data_vencimento)}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-red-500">
                        <Clock className="w-4 h-4" />
                        Arquivada em {formatDateTime(tarefa.deleted_at)}
                        {tarefa.deleted_by_name && ` por ${tarefa.deleted_by_name}`}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleRestore(tarefa)}
                      disabled={restoring === tarefa.id}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {restoring === tarefa.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      ) : (
                        <RotateCcw className="w-4 h-4" />
                      )}
                      Restaurar
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(tarefa)}
                      disabled={deleting === tarefa.id}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {deleting === tarefa.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {toast.message}
        </div>
      )}
    </div>
  )
}
