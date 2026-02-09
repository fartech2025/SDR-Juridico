// Organization Context - Multi-tenant organization management
// Date: 2026-01-13

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { organizationsService } from '@/services/organizationsService'
import { permissionsService } from '@/services/permissionsService'
import { setHealthCheckAuthState } from '@/lib/health'
import { supabase } from '@/lib/supabaseClient'
import type {
  Organization,
  OrganizationSettings,
  OrganizationStats,
  OrganizationUsage,
} from '@/types/organization'

interface OrganizationContextValue {
  // Current organization
  currentOrg: Organization | null
  loading: boolean
  error: Error | null
  
  // Stats and usage
  stats: OrganizationStats | null
  usage: OrganizationUsage | null
  
  // User permissions
  isFartechAdmin: boolean
  currentRole: string | null
  isLoading: boolean
  
  // Actions
  refreshOrg: () => Promise<void>
  refreshStats: () => Promise<void>
  switchOrg: (orgId: string) => Promise<void>
  
  // Fartech admin - multiple orgs
  allOrgs: Organization[]
  loadAllOrgs: () => Promise<void>
}

const OrganizationContext = createContext<OrganizationContextValue | undefined>(undefined)

const DEFAULT_ORGANIZATION_SETTINGS: OrganizationSettings = {
  status: 'active',
  activated_at: null,
  suspended_at: null,
  cancelled_at: null,
  enable_api_access: false,
  enable_white_label: false,
  enable_custom_domain: false,
  enable_sso: false,
  apis: [],
  integrations: [],
  features: {},
  notifications: {},
  business_hours: {},
  customization: {},
  security: {},
}

const createFallbackOrganization = (orgId: string | null): Organization => ({
  id: orgId || 'org-fallback',
  name: 'Organização',
  slug: 'org',
  cnpj: null,
  email: 'org@example.com',
  phone: null,
  address: null,
  plan: 'trial',
  max_users: 100,
  max_storage_gb: 10,
  max_cases: null,
  status: 'active',
  billing_email: null,
  billing_cycle: 'monthly',
  next_billing_date: null,
  logo_url: null,
  primary_color: '#721011',
  secondary_color: null,
  custom_domain: null,
  settings: { ...DEFAULT_ORGANIZATION_SETTINGS },
  metadata: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  activated_at: null,
  suspended_at: null,
  cancelled_at: null,
  provisioned_by: null,
  managed_by: null,
})

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [stats, setStats] = useState<OrganizationStats | null>(null)
  const [usage, setUsage] = useState<OrganizationUsage | null>(null)
  const [allOrgs, setAllOrgs] = useState<Organization[]>([])
  const [isFartechAdmin, setIsFartechAdmin] = useState(false)
  const [currentRole, setCurrentRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load current user's organization and permissions
  const loadCurrentOrg = useCallback(async () => {
    try {
      setLoading(true)
      setIsLoading(true)
      setError(null)

      console.log('🔍 [OrgContext] Iniciando loadCurrentOrg...')
      const user = await permissionsService.getCurrentUser()
      console.log('🔍 [OrgContext] User from permissionsService:', user)
      
      // If no user, they're not logged in - just finish loading
      if (!user) {
        console.log('⚠️ [OrgContext] Nenhum usuário encontrado')
        setIsFartechAdmin(false)
        setCurrentRole(null)
        setCurrentOrg(null)
        setLoading(false)
        setIsLoading(false)
        return
      }
      
      const isFartech = user.is_fartech_admin
      setIsFartechAdmin(isFartech)
      
      setCurrentRole(user.role || null)
      console.log('🔍 [OrgContext] user.org_id:', user.org_id, '| isFartech:', isFartech, '| role:', user.role)

      if (user.org_id) {
        try {
          console.log('🔍 [OrgContext] Buscando org:', user.org_id)
          const org = await organizationsService.getById(user.org_id)
          console.log('🔍 [OrgContext] Org encontrada:', org?.id, org?.name)
          
          // Se não encontrar, criar org genérica para não travar
          if (!org) {
            console.warn('⚠️ Organização não encontrada, usando fallback:', user.org_id)
            const fallbackOrg = createFallbackOrganization(user.org_id)
            setCurrentOrg(fallbackOrg)
          } else {
            setCurrentOrg(org)
            await loadStats(org.id)
          }
        } catch (err) {
        console.error('❌ Erro ao carregar organização:', err)
        // Fallback mesmo em caso de erro
        const fallbackOrg = createFallbackOrganization(user.org_id)
        setCurrentOrg(fallbackOrg)
      }
      } else {
        console.warn('⚠️ [OrgContext] user.org_id é null/undefined!')
        setCurrentOrg(null)
      }
    } catch (err) {
      console.error('❌ Error loading organization:', err)
      setError(err instanceof Error ? err : new Error('Failed to load organization'))
      // Don't throw - let the app continue
    } finally {
      setLoading(false)
      setIsLoading(false)
    }
  }, [])

  // Sincronizar estado de auth com health checks
  useEffect(() => {
    const hasUser = !!currentOrg || isFartechAdmin
    const hasOrg = !!currentOrg && currentOrg.status === 'active'
    setHealthCheckAuthState(hasUser, hasOrg)
  }, [currentOrg, isFartechAdmin])

  // Load organization stats
  const loadStats = async (orgId: string) => {
    try {
      const [statsData, usageData] = await Promise.all([
        organizationsService.getStats(orgId),
        organizationsService.getUsage(orgId),
      ])
      setStats(statsData)
      setUsage(usageData)
    } catch (err) {
      console.error('Error loading stats:', err)
    }
  }

  // Refresh current organization
  const refreshOrg = useCallback(async () => {
    if (currentOrg) {
      const updated = await organizationsService.getById(currentOrg.id)
      setCurrentOrg(updated)
    } else {
      await loadCurrentOrg()
    }
  }, [currentOrg, loadCurrentOrg])

  // Refresh stats
  const refreshStats = useCallback(async () => {
    if (currentOrg) {
      await loadStats(currentOrg.id)
    }
  }, [currentOrg])

  // Switch organization (Fartech admin only)
  const switchOrg = useCallback(async (orgId: string) => {
    try {
      const canSwitch = isFartechAdmin || await permissionsService.isFartechAdmin()
      if (!canSwitch) {
        throw new Error('Only Fartech admins can switch organizations')
      }

      setLoading(true)
      const org = await organizationsService.getById(orgId)
      setCurrentOrg(org)

      if (org) {
        await loadStats(org.id)
      }
    } catch (err) {
      console.error('Error switching organization:', err)
      setError(err instanceof Error ? err : new Error('Failed to switch organization'))
    } finally {
      setLoading(false)
    }
  }, [isFartechAdmin])

  // Load all organizations (Fartech admin only)
  const loadAllOrgs = useCallback(async () => {
    try {
      const canLoad = isFartechAdmin || await permissionsService.isFartechAdmin()
      if (!canLoad) return

      const orgs = await organizationsService.getAll()
      setAllOrgs(orgs)
    } catch (err) {
      console.error('Error loading all organizations:', err)
    }
  }, [isFartechAdmin])

  // Load on mount
  useEffect(() => {
    loadCurrentOrg()
  }, [loadCurrentOrg])

  // Escutar mudanças de autenticação para recarregar org
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 [OrgContext] Auth state changed:', event, !!session?.user)
      
      // Recarregar organização quando:
      // - Usuário faz login (SIGNED_IN)
      // - Token é atualizado (TOKEN_REFRESHED) 
      // - Usuário troca de conta (USER_UPDATED)
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        // Pequeno delay para garantir que o token está sincronizado
        setTimeout(() => {
          console.log('🔄 [OrgContext] Recarregando organização...')
          loadCurrentOrg()
        }, 100)
      }
      
      // Limpar estado quando usuário faz logout
      if (event === 'SIGNED_OUT') {
        setCurrentOrg(null)
        setIsFartechAdmin(false)
        setCurrentRole(null)
        setStats(null)
        setUsage(null)
        setAllOrgs([])
      }
    })

    return () => {
      authListener?.subscription?.unsubscribe?.()
    }
  }, [loadCurrentOrg])

  const value: OrganizationContextValue = {
    currentOrg,
    loading,
    error,
    stats,
    usage,
    isFartechAdmin,
    currentRole,
    isLoading,
    refreshOrg,
    refreshStats,
    switchOrg,
    allOrgs,
    loadAllOrgs,
  }

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganizationContext() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    return {
      currentOrg: null,
      loading: false,
      error: null,
      stats: null,
      usage: null,
      isFartechAdmin: false,
      currentRole: null,
      isLoading: false,
      refreshOrg: async () => undefined,
      refreshStats: async () => undefined,
      switchOrg: async () => undefined,
      allOrgs: [],
      loadAllOrgs: async () => undefined,
    }
  }
  return context
}

// Export also as useOrganization for convenience
export const useOrganization = useOrganizationContext
