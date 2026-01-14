// OrganizationsList - Complete list of all organizations for Fartech admins
// Date: 2026-01-13

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Building2, 
  Search, 
  Plus,
  Eye,
  Edit,
  Download,
  Users,
  ShieldCheck,
  Briefcase,
  Database,
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import { useFartechAdmin } from '@/hooks/useFartechAdmin'
import { FartechGuard } from '@/components/guards'
import type { Organization, OrganizationStatus, OrganizationPlan } from '@/types/organization'

type SortField = 'name' | 'created_at' | 'plan' | 'status'
type SortOrder = 'asc' | 'desc'

interface OrgWithStats extends Organization {
  userCount?: number
  adminCount?: number
  caseCount?: number
  storageUsed?: number
}

export default function OrganizationsList() {
  const { allOrgs, loadOrgsWithStats, loading } = useFartechAdmin()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrganizationStatus | 'all'>('all')
  const [planFilter, setPlanFilter] = useState<OrganizationPlan | 'all'>('all')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [orgsWithStats, setOrgsWithStats] = useState<OrgWithStats[]>([])
  
  useEffect(() => {
    loadOrgsWithStats()
  }, [])

  // Load user stats for each org
  useEffect(() => {
    const loadStats = async () => {
      if (!allOrgs) return
      
      // Mock stats - em produção viria do banco
      const withStats = allOrgs.map(org => ({
        ...org,
        userCount: Math.floor(Math.random() * 20) + 3,
        adminCount: Math.floor(Math.random() * 3) + 1,
        caseCount: Math.floor(Math.random() * 50) + 5,
        storageUsed: Math.floor(Math.random() * 80) + 10,
      }))
      setOrgsWithStats(withStats)
    }
    
    loadStats()
  }, [allOrgs])
  
  // Filter and sort organizations
  const filteredOrgs = (orgsWithStats || [])
    .filter(org => {
      const matchesSearch = 
        org.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.cnpj?.includes(searchTerm) || false
      
      const matchesStatus = statusFilter === 'all' || org.status === statusFilter
      const matchesPlan = planFilter === 'all' || org.plan === planFilter
      
      return matchesSearch && matchesStatus && matchesPlan
    })
    .sort((a, b) => {
      let comparison = 0
      
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
        case 'plan':
          comparison = a.plan.localeCompare(b.plan)
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

  // Calculate totals
  const totalUsers = filteredOrgs.reduce((sum, org) => sum + (org.userCount || 0), 0)
  const totalOrgs = filteredOrgs.length
  const activeOrgs = filteredOrgs.filter(org => org.status === 'active').length
  
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }
  
  const exportToCSV = () => {
    if (!filteredOrgs || filteredOrgs.length === 0) return
    
    const csv = [
      ['Nome', 'Slug', 'CNPJ', 'Plano', 'Status', 'Criado em'].join(','),
      ...filteredOrgs.map(org => [
        org.name,
        org.slug,
        org.cnpj || '',
        org.plan,
        org.status,
        new Date(org.created_at).toLocaleDateString('pt-BR')
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `organizacoes-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }
  
  return (
    <FartechGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Gestão de Organizações
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Painel de controle Fartech - Visão geral de todas as organizações
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={exportToCSV}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </button>
                
                <Link
                  to="/fartech/organizations/new"
                  className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Organização
                </Link>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-100">Total de Organizações</p>
                    <p className="text-3xl font-bold mt-1">{totalOrgs}</p>
                  </div>
                  <Building2 className="w-10 h-10 text-blue-200" />
                </div>
                <p className="text-xs text-blue-100 mt-2">{activeOrgs} ativas</p>
              </div>

              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-100">Total de Usuários</p>
                    <p className="text-3xl font-bold mt-1">{totalUsers}</p>
                  </div>
                  <Users className="w-10 h-10 text-emerald-200" />
                </div>
                <p className="text-xs text-emerald-100 mt-2">Across all orgs</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-100">Planos Enterprise</p>
                    <p className="text-3xl font-bold mt-1">
                      {filteredOrgs.filter(o => o.plan === 'enterprise').length}
                    </p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-purple-200" />
                </div>
                <p className="text-xs text-purple-100 mt-2">Premium clients</p>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-100">Atenção Requerida</p>
                    <p className="text-3xl font-bold mt-1">
                      {filteredOrgs.filter(o => o.status === 'suspended').length}
                    </p>
                  </div>
                  <AlertCircle className="w-10 h-10 text-orange-200" />
                </div>
                <p className="text-xs text-orange-100 mt-2">Orgs suspensas</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Nome, slug ou CNPJ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">Todos</option>
                  <option value="active">Ativo</option>
                  <option value="trial">Trial</option>
                  <option value="suspended">Suspenso</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
              
              {/* Plan Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Plano
                </label>
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">Todos</option>
                  <option value="starter">Starter</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Organizations Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500 dark:text-gray-400">Carregando organizações...</div>
            </div>
          ) : filteredOrgs.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredOrgs.map((org) => (
                <OrgCard key={org.id} org={org} />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12">
              <div className="text-center">
                <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  Nenhuma organização encontrada
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {searchTerm || statusFilter !== 'all' || planFilter !== 'all'
                    ? 'Tente ajustar os filtros de busca'
                    : 'Comece criando sua primeira organização'}
                </p>
                {!searchTerm && statusFilter === 'all' && planFilter === 'all' && (
                  <div className="mt-6">
                    <Link
                      to="/fartech/organizations/new"
                      className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Organização
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </FartechGuard>
  )
}

// Organization Card Component
function OrgCard({ org }: { org: OrgWithStats }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div 
              className="w-14 h-14 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: (org.primary_color || '#10b981') + '20' }}
            >
              {org.logo_url ? (
                <img src={org.logo_url} alt={org.name} className="w-12 h-12 rounded" />
              ) : (
                <Building2 className="w-7 h-7" style={{ color: org.primary_color || '#10b981' }} />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                <Link 
                  to={`/admin/organizations/${org.id}/settings`}
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  {org.name || 'Sem nome'}
                </Link>
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{org.slug || '-'}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {org.cnpj || 'CNPJ não cadastrado'}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            {org.status && <StatusBadge status={org.status} />}
            {org.plan && <PlanBadge plan={org.plan} />}
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center w-10 h-10 mx-auto rounded-full bg-blue-100 dark:bg-blue-900/20 mb-2">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{org.userCount || 0}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Usuários</p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center w-10 h-10 mx-auto rounded-full bg-purple-100 dark:bg-purple-900/20 mb-2">
            <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{org.adminCount || 0}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Admins</p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center w-10 h-10 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/20 mb-2">
            <Briefcase className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{org.caseCount || 0}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Casos</p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center w-10 h-10 mx-auto rounded-full bg-orange-100 dark:bg-orange-900/20 mb-2">
            <Database className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{org.storageUsed || 0}%</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Storage</p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Criado em {new Date(org.created_at).toLocaleDateString('pt-BR')}
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/fartech/organizations/${org.id}`}
            className="inline-flex items-center px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Eye className="w-4 h-4 mr-1.5" />
            Ver Detalhes
          </Link>
          <Link
            to={`/fartech/organizations/${org.id}/edit`}
            className="inline-flex items-center px-3 py-1.5 text-sm text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Edit className="w-4 h-4 mr-1.5" />
            Editar
          </Link>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: OrganizationStatus }) {
  const statusConfig = {
    active: { label: 'Ativo', class: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' },
    trial: { label: 'Trial', class: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300' },
    suspended: { label: 'Suspenso', class: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300' },
    cancelled: { label: 'Cancelado', class: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300' },
    pending: { label: 'Pendente', class: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300' },
  }
  
  const config = statusConfig[status] || statusConfig.pending
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`}>
      {config.label}
    </span>
  )
}

function PlanBadge({ plan }: { plan: OrganizationPlan }) {
  const planConfig = {
    trial: { label: 'Trial', class: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300' },
    basic: { label: 'Básico', class: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300' },
    professional: { label: 'Professional', class: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300' },
    enterprise: { label: 'Enterprise', class: 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300' },
  }
  
  const config = planConfig[plan] || planConfig.trial
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`}>
      {config.label}
    </span>
  )
}
