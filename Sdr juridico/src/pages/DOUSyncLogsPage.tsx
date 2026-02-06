// src/pages/DOUSyncLogsPage.tsx
// Pagina para visualizar historico de sincronizacoes do DOU
import { useState, useEffect } from 'react'
import { RefreshCw, CheckCircle, XCircle, Clock, FileText, Search } from 'lucide-react'
import { douService } from '@/features/dou/services/douService'
import type { DOUSyncLog } from '@/types/domain'

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

const statusConfig = {
  sucesso: {
    icon: CheckCircle,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    label: 'Sucesso',
  },
  erro: {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    label: 'Erro',
  },
  pendente: {
    icon: Clock,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    label: 'Pendente',
  },
  em_progresso: {
    icon: RefreshCw,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    label: 'Em progresso',
  },
}

export default function DOUSyncLogsPage() {
  const [logs, setLogs] = useState<DOUSyncLog[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    casosMonitorados: 0,
    termosAtivos: 0,
    publicacoes30d: 0,
    naoLidas: 0,
    ultimoSync: null as string | null,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [logsData, statsData] = await Promise.all([
        douService.getSyncLogs(50),
        douService.getOrgDOUStats(),
      ])
      setLogs(logsData)
      setStats(statsData)
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
    } finally {
      setLoading(false)
    }
  }

  const totalSucessos = logs.filter(l => l.status === 'sucesso').length
  const totalErros = logs.filter(l => l.status === 'erro').length
  const totalPublicacoes = logs.reduce((acc, l) => acc + (l.publicacoes_encontradas || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Monitoramento DOU
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Historico de sincronizacoes e estatisticas
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.casosMonitorados}</p>
                <p className="text-xs text-gray-500">Casos monitorados</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Search className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.termosAtivos}</p>
                <p className="text-xs text-gray-500">Termos ativos</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.publicacoes30d}</p>
                <p className="text-xs text-gray-500">Publicacoes (30d)</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.naoLidas}</p>
                <p className="text-xs text-gray-500">Nao lidas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-600">{totalSucessos} sucessos</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-gray-600">{totalErros} erros</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-600">{totalPublicacoes} publicacoes encontradas</span>
              </div>
            </div>
            {stats.ultimoSync && (
              <p className="text-xs text-gray-400">
                Ultimo sync: {formatDate(stats.ultimoSync)}
              </p>
            )}
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Historico de Sincronizacoes</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-500">Carregando...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Nenhuma sincronizacao encontrada</p>
              <p className="text-xs text-gray-400 mt-1">
                O bot roda automaticamente de segunda a sexta as 9h
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {logs.map((log) => {
                const config = statusConfig[log.status as keyof typeof statusConfig] || statusConfig.pendente
                const StatusIcon = config.icon

                return (
                  <div
                    key={log.id}
                    className={`px-4 py-3 hover:bg-gray-50 ${log.status === 'erro' ? 'bg-red-50/50' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-full ${config.bg}`}>
                          <StatusIcon className={`w-4 h-4 ${config.color}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {log.data_pesquisa}
                          </p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-gray-500">
                              {log.termos_pesquisados} termos
                            </span>
                            <span className="text-xs text-gray-500">
                              {log.publicacoes_encontradas} encontradas
                            </span>
                            {log.duracao_ms && (
                              <span className="text-xs text-gray-400">
                                {formatDuration(log.duracao_ms)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color} border ${config.border}`}>
                          {config.label}
                        </span>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {formatDate(log.created_at)}
                        </p>
                      </div>
                    </div>
                    {log.erro_mensagem && (
                      <div className="mt-2 ml-10 p-2 bg-red-50 rounded border border-red-200">
                        <p className="text-xs text-red-700 font-mono">
                          {log.erro_mensagem}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Como funciona o monitoramento?</h3>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>O bot roda automaticamente de segunda a sexta-feira as 9h</li>
            <li>Busca publicacoes no DOU Secao 3 (licitacoes, editais, contratos)</li>
            <li>Compara com os termos configurados em cada caso (numero do processo, OAB, nomes)</li>
            <li>Publicacoes encontradas geram notificacoes e aparecem na timeline do caso</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
