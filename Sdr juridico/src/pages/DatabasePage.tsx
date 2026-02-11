import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { 
  Database, 
  CheckCircle2, 
  XCircle, 
  Activity,
  Users,
  FileText,
  Calendar,
  Briefcase,
  UserCheck,
  RefreshCw,
  AlertCircle,
  Loader2
} from 'lucide-react'

interface TableStats {
  name: string
  count: number
  icon: any
}

interface ConnectionInfo {
  status: 'connected' | 'disconnected'
  latency: number | null
  timestamp: Date
}

interface APIStatus {
  name: string
  status: 'connected' | 'disconnected' | 'not-configured'
  message: string
  icon: any
}

export function DatabasePage() {
  const [connection, setConnection] = useState<ConnectionInfo>({
    status: 'disconnected',
    latency: null,
    timestamp: new Date()
  })
  const [tableStats, setTableStats] = useState<TableStats[]>([])
  const [loading, setLoading] = useState(true)
  const [apiStatuses, setApiStatuses] = useState<APIStatus[]>([])
  const [checkingAPIs, setCheckingAPIs] = useState(false)

  const checkConnection = async () => {
    const start = Date.now()
    try {
      const { error } = await supabase.from('leads').select('id').limit(1)
      const latency = Date.now() - start

      if (error) throw error

      setConnection({
        status: 'connected',
        latency,
        timestamp: new Date()
      })
    } catch (error) {
      setConnection({
        status: 'disconnected',
        latency: null,
        timestamp: new Date()
      })
    }
  }

  const loadTableStats = async () => {
    const tables = [
      { name: 'leads', icon: Users },
      { name: 'clientes', icon: UserCheck },
      { name: 'casos', icon: Briefcase },
      { name: 'documentos', icon: FileText },
      { name: 'agenda', icon: Calendar },
      { name: 'usuarios', icon: Users },
      { name: 'orgs', icon: Users },
      { name: 'timeline_events', icon: Activity },
      { name: 'notificacoes', icon: AlertCircle }
    ]

    const stats: TableStats[] = []

    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table.name)
          .select('*', { count: 'exact', head: true })

        if (!error && count !== null) {
          stats.push({
            name: table.name,
            count,
            icon: table.icon
          })
        }
      } catch (error) {
        console.error(`Erro ao carregar ${table.name}:`, error)
      }
    }

    setTableStats(stats)
  }

  const checkAPIStatuses = async () => {
    setCheckingAPIs(true)
    const statuses: APIStatus[] = []

    // Verifica Supabase
    try {
      const { error } = await supabase.from('leads').select('id').limit(1)
      statuses.push({
        name: 'Supabase Database',
        status: error ? 'disconnected' : 'connected',
        message: error ? error.message : 'Conexão ativa',
        icon: Database
      })
    } catch (error: any) {
      statuses.push({
        name: 'Supabase Database',
        status: 'disconnected',
        message: error?.message || 'Erro de conexão',
        icon: Database
      })
    }

    // Verifica Supabase Auth
    try {
      const { data: { user } } = await supabase.auth.getUser()
      statuses.push({
        name: 'Supabase Auth',
        status: user ? 'connected' : 'not-configured',
        message: user ? `Usuário: ${user.email}` : 'Não autenticado',
        icon: UserCheck
      })
    } catch (error: any) {
      statuses.push({
        name: 'Supabase Auth',
        status: 'disconnected',
        message: error?.message || 'Erro de autenticação',
        icon: UserCheck
      })
    }

    // Verifica Supabase Storage
    try {
      const { data, error } = await supabase.storage.listBuckets()
      statuses.push({
        name: 'Supabase Storage',
        status: error ? 'disconnected' : 'connected',
        message: error ? error.message : `${data?.length || 0} buckets disponíveis`,
        icon: FileText
      })
    } catch (error: any) {
      statuses.push({
        name: 'Supabase Storage',
        status: 'disconnected',
        message: error?.message || 'Erro ao acessar storage',
        icon: FileText
      })
    }

    // Verifica Google Calendar (integrações locais)
    try {
      statuses.push({
        name: 'Google Calendar',
        status: 'not-configured',
        message: 'Integração não disponível no schema atual',
        icon: Calendar
      })
    } catch (error: any) {
      statuses.push({
        name: 'Google Calendar',
        status: 'not-configured',
        message: 'Não configurado',
        icon: Calendar
      })
    }

    // Verifica Microsoft Teams (integrações locais)
    try {
      statuses.push({
        name: 'Microsoft Teams',
        status: 'not-configured',
        message: 'Integração não disponível no schema atual',
        icon: Activity
      })
    } catch (error: any) {
      statuses.push({
        name: 'Microsoft Teams',
        status: 'not-configured',
        message: 'Não configurado',
        icon: Activity
      })
    }

    // Verifica DataJud API (verifica variável de ambiente)
    const hasDataJudKey = import.meta.env.VITE_DATAJUD_API_KEY
    statuses.push({
      name: 'DataJud API',
      status: hasDataJudKey ? 'connected' : 'not-configured',
      message: hasDataJudKey ? 'API Key configurada' : 'API Key não configurada',
      icon: Briefcase
    })

    setApiStatuses(statuses)
    setCheckingAPIs(false)
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([
        checkConnection(),
        loadTableStats(),
        checkAPIStatuses()
      ])
      setLoading(false)
    }

    init()

    // Atualiza a cada 30 segundos
    const interval = setInterval(() => {
      checkConnection()
      loadTableStats()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-green-600'
      case 'disconnected':
        return 'text-red-600'
      case 'not-configured':
        return 'text-orange-600'
      default:
        return 'text-text-muted'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'disconnected':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'not-configured':
        return <AlertCircle className="h-5 w-5 text-orange-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-text-muted" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-700'
      case 'disconnected':
        return 'bg-red-100 text-red-700'
      case 'not-configured':
        return 'bg-orange-100 text-orange-700'
      default:
        return 'bg-surface-alt text-text'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Conectado'
      case 'disconnected':
        return 'Desconectado'
      case 'not-configured':
        return 'Não Configurado'
      default:
        return 'Desconhecido'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text">Monitor de Banco de Dados</h1>
          <p className="text-text-subtle mt-1">
            Monitoramento de conexões, estatísticas e status de APIs
          </p>
        </div>
        <button
          onClick={() => {
            checkConnection()
            loadTableStats()
            checkAPIStatuses()
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </button>
      </div>

      {/* Connection Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-text-subtle">Status da Conexão</p>
            {connection.status === 'connected' ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
          </div>
          <p className={`text-2xl font-bold ${connection.status === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
            {connection.status === 'connected' ? 'Conectado' : 'Desconectado'}
          </p>
          <p className="text-xs text-text-subtle mt-2">
            Última verificação: {connection.timestamp.toLocaleTimeString('pt-BR')}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-text-subtle">Latência</p>
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <p className="text-2xl font-bold text-text">
            {connection.latency !== null ? `${connection.latency}ms` : '--'}
          </p>
          <p className="text-xs text-text-subtle mt-2">
            {connection.latency !== null && connection.latency < 100 && 'Excelente'}
            {connection.latency !== null && connection.latency >= 100 && connection.latency < 300 && 'Bom'}
            {connection.latency !== null && connection.latency >= 300 && 'Lento'}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-gradient-to-br from-primary/10 to-primary/5 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-text-subtle">Total de Registros</p>
            <Database className="h-5 w-5 text-primary" />
          </div>
          <p className="text-2xl font-bold text-text">
            {tableStats.reduce((acc, t) => acc + t.count, 0).toLocaleString('pt-BR')}
          </p>
        </div>
      </div>

      {/* API Status */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text">Status das APIs</h2>
          <button
            onClick={checkAPIStatuses}
            disabled={checkingAPIs}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-background border border-border rounded-lg hover:bg-surface transition-colors disabled:opacity-50"
          >
            {checkingAPIs ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Verificar
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {apiStatuses.map((api) => {
            const Icon = api.icon
            return (
              <div key={api.name} className="rounded-lg border border-border bg-background p-4">
                <div className="flex items-start gap-3">
                  <Icon className={`h-5 w-5 mt-0.5 ${getStatusColor(api.status)}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-text truncate">{api.name}</p>
                      {getStatusIcon(api.status)}
                    </div>
                    <p className="text-sm text-text-subtle mb-2">{api.message}</p>
                    <span className={`px-2 py-1 text-xs rounded ${getStatusBadge(api.status)}`}>
                      {getStatusText(api.status)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Table Statistics */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-text mb-4">Estatísticas das Tabelas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tableStats.map((table) => {
            const Icon = table.icon
            return (
              <div key={table.name} className="rounded-lg border border-border bg-background p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-text capitalize">
                        {table.name.replace('_', ' ')}
                      </p>
                      <p className="text-2xl font-bold text-primary mt-1">
                        {table.count.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Credentials Information */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-lg font-semibold text-text">
          Operações que Requerem Credenciais
        </h2>
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="flex items-start gap-3">
              <Database className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-text">Supabase Database</p>
                <p className="text-sm text-text-subtle mt-1">
                  Todas as operações CRUD (leads, clientes, casos, documentos, agenda)
                </p>
                <div className="mt-2 flex gap-2 flex-wrap">
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                    VITE_SUPABASE_URL
                  </span>
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                    VITE_SUPABASE_ANON_KEY
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background p-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-text">Google Calendar</p>
                <p className="text-sm text-text-subtle mt-1">
                  Integração com Google Calendar para sincronização de eventos
                </p>
                <div className="mt-2 flex gap-2 flex-wrap">
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                    Google OAuth2
                  </span>
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                    Calendar API
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background p-4">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-text">Autenticação de Usuários</p>
                <p className="text-sm text-text-subtle mt-1">
                  Login, registro e gerenciamento de sessões via Supabase Auth
                </p>
                <div className="mt-2 flex gap-2 flex-wrap">
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                    Supabase Auth
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background p-4">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-text">Storage de Documentos</p>
                <p className="text-sm text-text-subtle mt-1">
                  Upload e download de arquivos via Supabase Storage
                </p>
                <div className="mt-2 flex gap-2 flex-wrap">
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                    Supabase Storage
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background p-4">
            <div className="flex items-start gap-3">
              <Briefcase className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-text">DataJud API</p>
                <p className="text-sm text-text-subtle mt-1">
                  Consulta de processos judiciais no CNJ (quando configurado)
                </p>
                <div className="mt-2 flex gap-2 flex-wrap">
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
                    VITE_DATAJUD_API_KEY (Opcional)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background p-4">
            <div className="flex items-start gap-3">
              <Activity className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-text">Microsoft Teams</p>
                <p className="text-sm text-text-subtle mt-1">
                  Integração com Microsoft Teams para videoconferências
                </p>
                <div className="mt-2 flex gap-2 flex-wrap">
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                    Microsoft OAuth2
                  </span>
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                    Graph API
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-blue-900">Nota de Segurança</p>
              <p className="text-sm text-blue-700 mt-1">
                As credenciais devem ser configuradas no arquivo <code className="bg-blue-100 px-1 rounded">.env</code> na raiz do projeto.
                Nunca commite o arquivo .env no Git. Use .env.example como referência.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
