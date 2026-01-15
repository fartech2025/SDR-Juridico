// Organizations Service - Multi-tenant management
// Date: 2026-01-13

import { supabase } from '@/lib/supabaseClient'
import { AppError } from '@/utils/errors'
import type {
  Organization,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  UpdateOrganizationPlanInput,
  UpdateOrganizationStatusInput,
  OrganizationStats,
  OrganizationUsage,
} from '@/types/organization'

// Helper to map database columns to TypeScript types
function mapDbToOrg(dbOrg: any): Organization {
  return {
    ...dbOrg,
    name: dbOrg.name || 'Sem nome',
    slug: dbOrg.slug || dbOrg.name?.toLowerCase().replace(/\s+/g, '-') || 'sem-slug',
    status: dbOrg.status || 'pending',
    plan: dbOrg.plan || 'trial',
    primary_color: dbOrg.primary_color || '#10b981',
    max_users: dbOrg.max_users || 10,
    max_storage_gb: dbOrg.max_storage_gb || 5,
    billing_cycle: dbOrg.billing_cycle || 'monthly',
    settings: dbOrg.settings || {},
    metadata: dbOrg.metadata || {},
  }
}

export const organizationsService = {
  /**
   * Get all organizations (Fartech admin only)
   */
  async getAll(): Promise<Organization[]> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw new AppError(error.message, 'database_error')
      return (data || []).map(mapDbToOrg)
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao buscar organizações',
        'database_error'
      )
    }
  },

  /**
   * Get organization by ID
   */
  async getById(id: string): Promise<Organization | null> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw new AppError(error.message, 'database_error')
      }
      return data ? mapDbToOrg(data) : null
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao buscar organização',
        'database_error'
      )
    }
  },

  /**
   * Get organization by slug
   */
  async getBySlug(slug: string): Promise<Organization | null> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw new AppError(error.message, 'database_error')
      }
      return data ? mapDbToOrg(data) : null
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao buscar organização',
        'database_error'
      )
    }
  },

  /**
   * Create new organization (Fartech admin only)
   */
  async create(input: CreateOrganizationInput): Promise<Organization> {
    try {
      // Get current user (should be fartech admin)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new AppError('Usuário não autenticado', 'auth_error')

      const { data, error } = await supabase
        .from('organizations')
        .insert({
          name: input.name,
          slug: input.slug,
          cnpj: input.cnpj || null,
          email: input.email,
          phone: input.phone || null,
          address: input.address || null,
          plan: input.plan,
          max_users: input.max_users || 5,
          max_storage_gb: input.max_storage_gb || 10,
          billing_email: input.billing_email || input.email,
          billing_cycle: input.billing_cycle || 'monthly',
          status: 'pending',
          provisioned_by: user.id,
        })
        .select()
        .single()

      if (error) throw new AppError(error.message, 'database_error')
      return data
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao criar organização',
        'database_error'
      )
    }
  },

  /**
   * Update organization
   */
  async update(id: string, input: UpdateOrganizationInput): Promise<Organization> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .update(input)
        .eq('id', id)
        .select()
        .single()

      if (error) throw new AppError(error.message, 'database_error')
      return data
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao atualizar organização',
        'database_error'
      )
    }
  },

  /**
   * Update organization plan
   */
  async updatePlan(id: string, input: UpdateOrganizationPlanInput): Promise<Organization> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .update({
          plan: input.plan,
          max_users: input.max_users,
          max_storage_gb: input.max_storage_gb,
          max_cases: input.max_cases,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw new AppError(error.message, 'database_error')
      return data
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao atualizar plano',
        'database_error'
      )
    }
  },

  /**
   * Update organization status
   */
  async updateStatus(id: string, input: UpdateOrganizationStatusInput): Promise<Organization> {
    try {
      const updates: any = { status: input.status }
      
      if (input.status === 'active') {
        updates.activated_at = new Date().toISOString()
      } else if (input.status === 'suspended') {
        updates.suspended_at = new Date().toISOString()
      } else if (input.status === 'cancelled') {
        updates.cancelled_at = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw new AppError(error.message, 'database_error')
      return data
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao atualizar status',
        'database_error'
      )
    }
  },

  /**
   * Delete organization (soft delete by setting status to cancelled)
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw new AppError(error.message, 'database_error')
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao deletar organização',
        'database_error'
      )
    }
  },

  /**
   * Get organization statistics
   */
  async getStats(orgId: string): Promise<OrganizationStats> {
    try {
      const totalUsers = 0
      const activeUsers = 0

      // Get client count
      const { count: totalClients } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)

      // Get case counts
      const { count: totalCases } = await supabase
        .from('casos')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)

      const { count: activeCases } = await supabase
        .from('casos')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', 'ativo')

      // TODO: Calculate storage used
      const storageUsedGb = 0

      return {
        total_users: totalUsers || 0,
        active_users: activeUsers || 0,
        total_clients: totalClients || 0,
        total_cases: totalCases || 0,
        active_cases: activeCases || 0,
        storage_used_gb: storageUsedGb,
        storage_used_percentage: 0,
      }
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao buscar estatísticas',
        'database_error'
      )
    }
  },

  /**
   * Get organization usage metrics
   */
  async getUsage(orgId: string): Promise<OrganizationUsage> {
    try {
      const org = await this.getById(orgId)
      if (!org) throw new AppError('Organização não encontrada', 'not_found')

      const stats = await this.getStats(orgId)

      return {
        users: {
          current: stats.total_users,
          limit: org.max_users,
          percentage: (stats.total_users / org.max_users) * 100,
        },
        storage: {
          current_gb: stats.storage_used_gb,
          limit_gb: org.max_storage_gb,
          percentage: (stats.storage_used_gb / org.max_storage_gb) * 100,
        },
        cases: {
          current: stats.total_cases,
          limit: org.max_cases,
          percentage: org.max_cases 
            ? (stats.total_cases / org.max_cases) * 100 
            : null,
        },
      }
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao calcular uso',
        'database_error'
      )
    }
  },

  /**
   * Check if slug is available
   */
  async isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('organizations')
        .select('id')
        .eq('slug', slug)

      if (excludeId) {
        query = query.neq('id', excludeId)
      }

      const { data, error } = await query

      if (error) throw new AppError(error.message, 'database_error')
      return !data || data.length === 0
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao verificar slug',
        'database_error'
      )
    }
  },

  /**
   * Activate organization (when admin completes setup)
   */
  async activate(orgId: string, adminUserId: string): Promise<Organization> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .update({
          status: 'active',
          activated_at: new Date().toISOString(),
          managed_by: adminUserId,
        })
        .eq('id', orgId)
        .select()
        .single()

      if (error) throw new AppError(error.message, 'database_error')
      return data
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao ativar organização',
        'database_error'
      )
    }
  },
}
