// SecurityMonitoring - Painel de Monitoramento de Segurança Nível Bancário
// Date: 2026-01-19

import { useState, useEffect } from 'react'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Eye,
  Lock,
  Key,
  Server,
  Activity,
  FileText,
  Users,
  Database,
  Wifi,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle,
  Download,
  RefreshCw
} from 'lucide-react'
import { FartechGuard } from '@/components/guards'
import { cn } from '@/utils/cn'

interface SecurityAlert {
  id: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  timestamp: Date
  status: 'active' | 'resolved' | 'investigating'
  category: 'auth' | 'data' | 'network' | 'access' | 'compliance'
}

interface SecurityMetric {
  label: string
  value: string | number
  trend?: 'up' | 'down' | 'stable'
  status: 'good' | 'warning' | 'critical'
  icon: any
  description: string
}

export default function SecurityMonitoring() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([])
  const [metrics, setMetrics] = useState<SecurityMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'audit' | 'compliance'>('overview')

  useEffect(() => {
    loadSecurityData()
  }, [])

  const loadSecurityData = async () => {
    setLoading(true)
    
    // Simular carregamento de dados de segurança
    // Em produção, buscar do backend
    setTimeout(() => {
      setMetrics([
        {
          label: 'Taxa de Autenticação',
          value: '99.8%',
          trend: 'stable',
          status: 'good',
          icon: Lock,
          description: 'Tentativas de login bem-sucedidas'
        },
        {
          label: 'Sessões Ativas',
          value: 247,
          trend: 'up',
          status: 'good',
          icon: Users,
          description: 'Usuários conectados no momento'
        },
        {
          label: 'Tentativas Bloqueadas',
          value: 12,
          trend: 'down',
          status: 'good',
          icon: Shield,
          description: 'Acessos maliciosos bloqueados (24h)'
        },
        {
          label: 'Vulnerabilidades',
          value: 0,
          trend: 'stable',
          status: 'good',
          icon: AlertTriangle,
          description: 'Vulnerabilidades críticas detectadas'
        },
        {
          label: 'Compliance Score',
          value: '98%',
          trend: 'up',
          status: 'good',
          icon: CheckCircle,
          description: 'Conformidade com LGPD e padrões bancários'
        },
        {
          label: 'Tempo Resposta',
          value: '45ms',
          trend: 'stable',
          status: 'good',
          icon: Activity,
          description: 'Latência média do sistema'
        },
        {
          label: 'Backup Status',
          value: 'OK',
          trend: 'stable',
          status: 'good',
          icon: Database,
          description: 'Último backup: há 2 horas'
        },
        {
          label: 'Certificados SSL',
          value: 'Válido',
          trend: 'stable',
          status: 'good',
          icon: Key,
          description: 'Expira em: 89 dias'
        }
      ])

      setAlerts([
        {
          id: '1',
          severity: 'low',
          title: 'Acesso fora do horário comercial',
          description: 'Usuário admin@fartech acessou o sistema às 23:45',
          timestamp: new Date(Date.now() - 3600000),
          status: 'resolved',
          category: 'access'
        },
        {
          id: '2',
          severity: 'medium',
          title: 'Múltiplas tentativas de login',
          description: '5 tentativas falhadas do IP 192.168.1.100',
          timestamp: new Date(Date.now() - 7200000),
          status: 'investigating',
          category: 'auth'
        }
      ])

      setLoading(false)
    }, 800)
  }

  const getSeverityColor = (severity: SecurityAlert['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusColor = (status: SecurityAlert['status']) => {
    switch (status) {
      case 'active': return 'bg-red-500'
      case 'investigating': return 'bg-yellow-500'
      case 'resolved': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getMetricStatusColor = (status: SecurityMetric['status']) => {
    switch (status) {
      case 'good': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <FartechGuard>
        <div className="flex h-screen items-center justify-center bg-[#f7f8fc]">
          <div className="text-center">
            <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
            <p className="text-text-subtle">Carregando monitoramento de segurança...</p>
          </div>
        </div>
      </FartechGuard>
    )
  }

  return (
    <FartechGuard>
      <div className="min-h-screen bg-[#f7f8fc] p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 text-white shadow-lg">
                <Shield className="h-6 w-6" />
              </div>
              Monitoramento de Segurança
            </h1>
            <p className="mt-1 text-sm text-text-subtle">
              Painel de segurança nível bancário - Atualizado em tempo real
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={loadSecurityData}
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-text shadow-sm hover:bg-gray-50 transition"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </button>
            <button className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 transition">
              <Download className="h-4 w-4" />
              Exportar Relatório
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-border">
          {[
            { id: 'overview', label: 'Visão Geral', icon: Eye },
            { id: 'alerts', label: 'Alertas', icon: AlertTriangle },
            { id: 'audit', label: 'Auditoria', icon: FileText },
            { id: 'compliance', label: 'Conformidade', icon: CheckCircle }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-subtle hover:text-text'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Security Metrics Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {metrics.map((metric, index) => (
                <div
                  key={index}
                  className="rounded-2xl bg-white p-6 shadow-sm border border-border hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl",
                      metric.status === 'good' ? 'bg-green-100' :
                      metric.status === 'warning' ? 'bg-yellow-100' :
                      'bg-red-100'
                    )}>
                      <metric.icon className={cn(
                        "h-5 w-5",
                        getMetricStatusColor(metric.status)
                      )} />
                    </div>
                    {metric.trend && (
                      <div className={cn(
                        "flex items-center gap-1 text-xs",
                        metric.trend === 'up' ? 'text-green-600' :
                        metric.trend === 'down' ? 'text-red-600' :
                        'text-gray-600'
                      )}>
                        {metric.trend === 'up' && <TrendingUp className="h-3 w-3" />}
                        {metric.trend === 'down' && <TrendingDown className="h-3 w-3" />}
                        {metric.trend === 'stable' && <Activity className="h-3 w-3" />}
                      </div>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-text mb-1">{metric.value}</p>
                  <p className="text-sm font-medium text-text mb-1">{metric.label}</p>
                  <p className="text-xs text-text-subtle">{metric.description}</p>
                </div>
              ))}
            </div>

            {/* Security Score Card */}
            <div className="rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-8 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90 mb-2">Score de Segurança Geral</p>
                  <p className="text-5xl font-bold mb-2">98/100</p>
                  <p className="text-sm opacity-90">Excelente - Sistema protegido e em conformidade</p>
                </div>
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                  <CheckCircle className="h-12 w-12" />
                </div>
              </div>
            </div>

            {/* Recent Alerts */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-border">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text">Alertas Recentes</h2>
                <button
                  onClick={() => setActiveTab('alerts')}
                  className="text-sm text-primary hover:underline"
                >
                  Ver todos
                </button>
              </div>
              <div className="space-y-3">
                {alerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-4 rounded-xl border border-border p-4 hover:bg-gray-50 transition"
                  >
                    <div className={cn("mt-1 h-2 w-2 rounded-full", getStatusColor(alert.status))} />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "rounded-lg px-2 py-0.5 text-xs font-medium border",
                            getSeverityColor(alert.severity)
                          )}>
                            {alert.severity.toUpperCase()}
                          </span>
                          <h3 className="text-sm font-medium text-text">{alert.title}</h3>
                        </div>
                        <span className="text-xs text-text-subtle flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(alert.timestamp).toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-text-subtle">{alert.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-border">
            <h2 className="text-lg font-semibold text-text mb-4">Todos os Alertas de Segurança</h2>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-4 rounded-xl border border-border p-4 hover:bg-gray-50 transition"
                >
                  <div className={cn("mt-1 h-2 w-2 rounded-full", getStatusColor(alert.status))} />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "rounded-lg px-2 py-0.5 text-xs font-medium border",
                          getSeverityColor(alert.severity)
                        )}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <h3 className="text-sm font-medium text-text">{alert.title}</h3>
                      </div>
                      <span className="text-xs text-text-subtle flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(alert.timestamp).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-sm text-text-subtle mb-2">{alert.description}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-subtle">Status:</span>
                      <span className={cn(
                        "rounded px-2 py-0.5 text-xs font-medium",
                        alert.status === 'active' ? 'bg-red-100 text-red-700' :
                        alert.status === 'investigating' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      )}>
                        {alert.status === 'active' ? 'Ativo' :
                         alert.status === 'investigating' ? 'Investigando' :
                         'Resolvido'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audit Tab */}
        {activeTab === 'audit' && (
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-border">
            <h2 className="text-lg font-semibold text-text mb-4">Log de Auditoria</h2>
            <p className="text-sm text-text-subtle mb-6">
              Registro completo de todas as ações de segurança e acesso ao sistema
            </p>
            <div className="space-y-2">
              {[
                { time: '14:32', user: 'admin@fartech', action: 'Login bem-sucedido', ip: '192.168.1.50' },
                { time: '14:15', user: 'gestor@org1', action: 'Alterou configurações da organização', ip: '192.168.1.102' },
                { time: '13:58', user: 'user@org2', action: 'Visualizou documento confidencial', ip: '192.168.1.205' },
                { time: '13:45', user: 'admin@fartech', action: 'Criou nova organização', ip: '192.168.1.50' },
                { time: '13:30', user: 'user@org1', action: 'Tentativa de acesso negada', ip: '192.168.1.150' },
              ].map((log, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-xl border border-border p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-text-subtle font-mono">{log.time}</span>
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text">{log.action}</p>
                      <p className="text-xs text-text-subtle">{log.user}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wifi className="h-3 w-3 text-text-subtle" />
                    <span className="text-xs text-text-subtle font-mono">{log.ip}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Compliance Tab */}
        {activeTab === 'compliance' && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-border">
              <h2 className="text-lg font-semibold text-text mb-4">Conformidade Regulatória</h2>
              <div className="space-y-4">
                {[
                  { name: 'LGPD', status: 'compliant', score: 98, description: 'Lei Geral de Proteção de Dados' },
                  { name: 'ISO 27001', status: 'compliant', score: 95, description: 'Gestão de Segurança da Informação' },
                  { name: 'PCI DSS', status: 'compliant', score: 97, description: 'Padrão de Segurança de Dados de Cartão' },
                  { name: 'SOC 2', status: 'compliant', score: 96, description: 'Controles de Segurança Organizacional' }
                ].map((compliance, index) => (
                  <div key={index} className="rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <h3 className="text-sm font-semibold text-text">{compliance.name}</h3>
                          <p className="text-xs text-text-subtle">{compliance.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">{compliance.score}%</p>
                        <p className="text-xs text-text-subtle">Conformidade</p>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-600 rounded-full transition-all"
                        style={{ width: `${compliance.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Checklist */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-border">
              <h2 className="text-lg font-semibold text-text mb-4">Checklist de Segurança</h2>
              <div className="space-y-3">
                {[
                  { item: 'Backup automático diário', status: true },
                  { item: 'Criptografia de dados em repouso', status: true },
                  { item: 'Autenticação de dois fatores', status: true },
                  { item: 'Logs de auditoria habilitados', status: true },
                  { item: 'Certificados SSL válidos', status: true },
                  { item: 'Firewall configurado', status: true },
                  { item: 'Monitoramento 24/7', status: true },
                  { item: 'Plano de recuperação de desastres', status: true }
                ].map((check, index) => (
                  <div key={index} className="flex items-center gap-3">
                    {check.status ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="text-sm text-text">{check.item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </FartechGuard>
  )
}
