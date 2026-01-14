// FartechDashboard - Main dashboard for Fartech admins
// Date: 2026-01-13

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Building2, 
  Users, 
  Briefcase, 
  HardDrive, 
  TrendingUp,
  AlertTriangle,
  Plus,
  Search
} from 'lucide-react'
import { useFartechAdmin } from '@/hooks/useFartechAdmin'
import { FartechGuard } from '@/components/guards'

interface GlobalStats {
  organizations: {
    total: number
    active: number
    suspended: number
    trial: number
  }
  users: number
  clients: number
  cases: number
  storage_gb: number
}

export default function FartechDashboard() {
  const { getGlobalStats, getOrgsWithAlerts, allOrgs, loadOrgsWithStats, loading } = useFartechAdmin()
  const [stats, setStats] = useState<GlobalStats | null>(null)
  const [alerts, setAlerts] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  
  useEffect(() => {
    loadData()
  }, [])
  
  const loadData = async () => {
    try {
      await loadOrgsWithStats()
      const globalStats = await getGlobalStats()
      setStats(globalStats)
      
      const orgsWithAlerts = await getOrgsWithAlerts()
      setAlerts(orgsWithAlerts)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }
  
  const filteredOrgs = allOrgs?.filter(org => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.slug.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  return (
    <FartechGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Fartech Dashboard
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Visão geral de todas as organizações
                </p>
              </div>
              
              <Link
                to="/fartech/organizations/new"
                className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Organização
              </Link>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <StatCard
                title="Organizações"
                value={stats.organizations.total}
                subtitle={`${stats.organizations.active} ativas`}
                icon={Building2}
                color="emerald"
              />
              <StatCard
                title="Usuários"
                value={stats.users}
                subtitle="Total de usuários"
                icon={Users}
                color="blue"
              />
              <StatCard
                title="Clientes"
                value={stats.clients}
                subtitle="Cadastrados"
                icon={Briefcase}
                color="purple"
              />
              <StatCard
                title="Casos"
                value={stats.cases}
                subtitle="Em andamento"
                icon={TrendingUp}
                color="orange"
              />
              <StatCard
                title="Armazenamento"
                value={`${stats.storage_gb.toFixed(1)}GB`}
                subtitle="Total usado"
                icon={HardDrive}
                color="red"
              />
            </div>
          )}
          
          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="mb-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                <h2 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100">
                  Alertas de Limites ({alerts.length})
                </h2>
              </div>
              
              <div className="space-y-3">
                {alerts.slice(0, 5).map((org) => (
                  <div key={org.id} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{org.name}</p>
                      <div className="mt-1 space-y-1">
                        {org.alerts.map((alert: string, idx: number) => (
                          <p key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                            {alert}
                          </p>
                        ))}
                      </div>
                    </div>
                    
                    <Link
                      to={`/fartech/organizations/${org.id}`}
                      className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      Ver detalhes
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Organizations List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Organizações
                </h2>
                
                <Link
                  to="/fartech/organizations"
                  className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Ver todas
                </Link>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar organizações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Organização
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Plano
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Usuários
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Criado em
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        Carregando...
                      </td>
                    </tr>
                  ) : filteredOrgs && filteredOrgs.length > 0 ? (
                    filteredOrgs.slice(0, 10).map((org) => (
                      <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center mr-3">
                              <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{org.name}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{org.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 capitalize">
                            {org.plan}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={org.status} />
                        </td>
                        <td className="px-6 py-4 text-gray-900 dark:text-white">
                          {/* TODO: Show actual user count */}
                          -
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {new Date(org.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            to={`/fartech/organizations/${org.id}`}
                            className="text-emerald-600 dark:text-emerald-400 hover:underline text-sm"
                          >
                            Ver detalhes
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        Nenhuma organização encontrada
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </FartechGuard>
  )
}

interface StatCardProps {
  title: string
  value: number | string
  subtitle: string
  icon: any
  color: 'emerald' | 'blue' | 'purple' | 'orange' | 'red'
}

function StatCard({ title, value, subtitle, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    emerald: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    red: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      
      <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
        {value}
      </p>
      
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
        {title}
      </p>
      
      <p className="text-xs text-gray-500 dark:text-gray-500">
        {subtitle}
      </p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    active: { label: 'Ativo', class: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' },
    trial: { label: 'Trial', class: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300' },
    suspended: { label: 'Suspenso', class: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300' },
    cancelled: { label: 'Cancelado', class: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300' },
  }
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`}>
      {config.label}
    </span>
  )
}
