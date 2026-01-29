// OrganizationsList - Complete list of all organizations for Fartech admins
// Date: 2026-01-13

import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
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
import { organizationsService } from '@/services/organizationsService'
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
  const location = useLocation()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrganizationStatus | 'all'>('all')
  const [planFilter, setPlanFilter] = useState<OrganizationPlan | 'all'>('all')
  const [sortField] = useState<SortField>('created_at')
  const [sortOrder] = useState<SortOrder>('desc')
  const [orgsWithStats, setOrgsWithStats] = useState<OrgWithStats[]>([])
  
  useEffect(() => {
    loadOrgsWithStats()
  }, [loadOrgsWithStats, location.state])

  // Load stats for each org (clientes, casos, armazenamento)
  useEffect(() => {
    const loadStats = async () => {
      if (!allOrgs) return

      try {
        const stats = await Promise.all(
          allOrgs.map(async (org) => {
            const orgStats = await organizationsService.getStats(org.id)
            const userCount = orgStats.total_users || 0
            const caseCount = orgStats.total_cases || 0
            const storageUsed = Math.round(orgStats.storage_used_percentage || 0)
            const adminCount = orgStats.admin_users || 0
            return {
              ...org,
              userCount,
              adminCount,
              caseCount,
              storageUsed,
            } as OrgWithStats
          })
        )
        setOrgsWithStats(stats)
      } catch (error) {
        console.error('Erro ao carregar estatísticas das organizações:', error)
        setOrgsWithStats(allOrgs)
      }
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
      <div className="min-h-screen pb-12" style={{ backgroundColor: '#f9fbfd', color: '#0f172a' }}>
        {/* Header */}
        <div className="border-b" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold" style={{ color: '#0f172a' }}>
                  Gestão de Organizações
                </h1>
                <p className="mt-1 text-sm" style={{ color: '#475569' }}>
                  Painel de controle Fartech - Visão geral de todas as organizações
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={exportToCSV}
                  className="inline-flex items-center rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-text transition hover:bg-surface-alt"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </button>
                
                <Link
                  to="/admin/organizations/new"
                  className="inline-flex items-center rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-strong"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Organização
                </Link>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <div
                className="group rounded-2xl border p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                style={{ backgroundColor: 'var(--brand-primary-50)', borderColor: 'var(--brand-primary-100)' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'var(--brand-primary-700)' }}>
                      Total de Organizações
                    </p>
                    <p className="mt-2 text-3xl font-bold" style={{ color: 'var(--brand-primary-900)' }}>
                      {totalOrgs}
                    </p>
                  </div>
                  <div className="rounded-xl p-2.5" style={{ backgroundColor: 'var(--brand-primary-100)' }}>
                    <Building2 className="h-6 w-6" style={{ color: 'var(--brand-primary-700)' }} />
                  </div>
                </div>
                <p className="mt-2 text-xs font-medium" style={{ color: 'var(--brand-primary-600)' }}>
                  {activeOrgs} ativas
                </p>
              </div>

              <div
                className="group rounded-2xl border p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                style={{ backgroundColor: 'var(--color-success-bg)', borderColor: 'var(--color-success-light)' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'var(--color-success-dark)' }}>
                      Total de Usuários
                    </p>
                    <p className="mt-2 text-3xl font-bold" style={{ color: 'var(--color-success-dark)' }}>
                      {totalUsers}
                    </p>
                  </div>
                  <div className="rounded-xl p-2.5" style={{ backgroundColor: '#d1fae5' }}>
                    <Users className="h-6 w-6" style={{ color: 'var(--color-success-dark)' }} />
                  </div>
                </div>
                <p className="mt-2 text-xs font-medium" style={{ color: 'var(--color-success)' }}>
                  Em todas as orgs
                </p>
              </div>

              <div
                className="group rounded-2xl border p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                style={{ backgroundColor: 'var(--color-info-bg)', borderColor: 'var(--color-info-light)' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'var(--color-info-dark)' }}>
                      Planos Enterprise
                    </p>
                    <p className="mt-2 text-3xl font-bold" style={{ color: 'var(--color-info-dark)' }}>
                      {filteredOrgs.filter(o => o.plan === 'enterprise').length}
                    </p>
                  </div>
                  <div className="rounded-xl p-2.5" style={{ backgroundColor: '#cffafe' }}>
                    <TrendingUp className="h-6 w-6" style={{ color: 'var(--color-info-dark)' }} />
                  </div>
                </div>
                <p className="mt-2 text-xs font-medium" style={{ color: 'var(--color-info)' }}>
                  Clientes premium
                </p>
              </div>

              <div
                className="group rounded-2xl border p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                style={{ backgroundColor: 'var(--color-warning-bg)', borderColor: 'var(--color-warning-light)' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'var(--color-warning-dark)' }}>
                      Atenção Requerida
                    </p>
                    <p className="mt-2 text-3xl font-bold" style={{ color: 'var(--color-warning-dark)' }}>
                      {filteredOrgs.filter(o => o.status === 'suspended').length}
                    </p>
                  </div>
                  <div className="rounded-xl p-2.5" style={{ backgroundColor: '#fef3c7' }}>
                    <AlertCircle className="h-6 w-6" style={{ color: 'var(--color-warning-dark)' }} />
                  </div>
                </div>
                <p className="mt-2 text-xs font-medium" style={{ color: 'var(--color-warning)' }}>
                  Orgs suspensas
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Filters */}
          <div className="mb-6 rounded-3xl border p-6 shadow-soft" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              {/* Search */}
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold" style={{ color: '#0f172a' }}>
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-text-muted" />
                  <input
                    type="text"
                    placeholder="Nome, slug ou CNPJ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-12 w-full rounded-2xl border px-4 pl-11 text-sm placeholder:text-text-subtle focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/15"
                    style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a' }}
                  />
                </div>
              </div>
              
              {/* Status Filter */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-text">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm text-text focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/15"
                >
                  <option value="all">Todos</option>
                  <option value="active">Ativo</option>
                  <option value="pending">Pendente</option>
                  <option value="suspended">Suspenso</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
              
              {/* Plan Filter */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-text">
                  Plano
                </label>
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value as any)}
                  className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm text-text focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/15"
                >
                  <option value="all">Todos</option>
                  <option value="trial">Trial</option>
                  <option value="basic">Basico</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Organizations Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12 text-text-muted">
              Carregando organizações...
            </div>
          ) : filteredOrgs.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {filteredOrgs.map((org) => (
                <OrgCard key={org.id} org={org} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-border bg-surface p-12 text-center shadow-soft">
              <div className="text-center">
                <Building2 className="mx-auto h-12 w-12 text-text-muted" />
                <h3 className="mt-2 text-sm font-semibold text-text">
                  Nenhuma organização encontrada
                </h3>
                <p className="mt-1 text-sm text-text-muted">
                  {searchTerm || statusFilter !== 'all' || planFilter !== 'all'
                    ? 'Tente ajustar os filtros de busca'
                    : 'Comece criando sua primeira organização'}
                </p>
                {!searchTerm && statusFilter === 'all' && planFilter === 'all' && (
                  <div className="mt-6">
                    <Link
                      to="/admin/organizations/new"
                      className="inline-flex items-center rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-strong"
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
    <div className="rounded-3xl border border-border bg-surface shadow-soft transition-shadow hover:shadow-lg">
      {/* Header */}
      <div className="border-b border-border/70 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div 
              className="w-14 h-14 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: (org.primary_color || 'var(--brand-primary)') + '20' }}
            >
              {org.logo_url ? (
                <img src={org.logo_url} alt={org.name} className="w-12 h-12 rounded" />
              ) : (
                <Building2 className="w-7 h-7" style={{ color: org.primary_color || 'var(--brand-primary)' }} />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text">
                <Link 
                  to={`/admin/organizations/${org.id}/settings`}
                  className="transition-colors hover:text-brand-primary"
                >
                  {org.name || 'Sem nome'}
                </Link>
              </h3>
              <p className="text-sm text-text-muted">{org.slug || '-'}</p>
              <p className="mt-1 text-xs text-text-subtle">
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
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary-subtle mx-auto">
            <Users className="h-5 w-5 text-brand-primary" />
          </div>
          <p className="text-2xl font-bold text-text">{org.userCount || 0}</p>
          <p className="text-xs text-text-muted">Usuários</p>
        </div>

        <div className="text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-brand-secondary-subtle">
            <ShieldCheck className="h-5 w-5 text-brand-secondary" />
          </div>
          <p className="text-2xl font-bold text-text">{org.adminCount || 0}</p>
          <p className="text-xs text-text-muted">Admins</p>
        </div>

        <div className="text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-success-bg">
            <Briefcase className="h-5 w-5 text-success" />
          </div>
          <p className="text-2xl font-bold text-text">{org.caseCount || 0}</p>
          <p className="text-xs text-text-muted">Casos</p>
        </div>

        <div className="text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-warning-bg">
            <Database className="h-5 w-5 text-warning" />
          </div>
          <p className="text-2xl font-bold text-text">{org.storageUsed || 0}%</p>
          <p className="text-xs text-text-muted">Storage</p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between border-t border-border/70 bg-surface-alt px-6 py-4">
        <div className="text-xs text-text-muted">
          Criado em {new Date(org.created_at).toLocaleDateString('pt-BR')}
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/admin/organizations/${org.id}`}
            className="inline-flex items-center rounded-xl border border-border bg-surface px-3 py-1.5 text-sm font-semibold text-text transition hover:bg-surface-alt"
          >
            <Eye className="w-4 h-4 mr-1.5" />
            Ver Detalhes
          </Link>
          <Link
            to={`/admin/organizations/${org.id}/edit`}
            className="inline-flex items-center rounded-xl bg-brand-primary px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-primary-strong"
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
    active: { label: 'Ativo', class: 'border-success-border bg-success-bg text-success' },
    suspended: { label: 'Suspenso', class: 'border-warning-border bg-warning-bg text-warning' },
    cancelled: { label: 'Cancelado', class: 'border-danger-border bg-danger-bg text-danger' },
    pending: { label: 'Pendente', class: 'border-border bg-surface-2 text-text-muted' },
  }
  
  const config = statusConfig[status] || statusConfig.pending
  
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.class}`}>
      {config.label}
    </span>
  )
}

function PlanBadge({ plan }: { plan: OrganizationPlan }) {
  const planConfig = {
    trial: { label: 'Trial', class: 'border-border bg-surface-2 text-text-muted' },
    basic: { label: 'Básico', class: 'border-brand-primary-subtle bg-brand-primary-subtle text-brand-primary' },
    professional: { label: 'Professional', class: 'border-brand-secondary-subtle bg-brand-secondary-subtle text-brand-secondary' },
    enterprise: { label: 'Enterprise', class: 'border-info-border bg-info-bg text-info' },
  }
  
  const config = planConfig[plan] || planConfig.trial
  
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.class}`}>
      {config.label}
    </span>
  )
}
