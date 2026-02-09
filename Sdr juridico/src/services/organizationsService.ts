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

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/**
 * Generates a unique slug by appending a numeric suffix if the base slug is taken.
 */
const ensureUniqueSlug = async (baseSlug: string): Promise<string> => {
  // Check if base slug exists
  const { data: existing } = await supabase
    .from('orgs')
    .select('slug')
    .eq('slug', baseSlug)
    .maybeSingle()

  if (!existing) return baseSlug

  // Slug taken — try -2, -3, ... up to -20
  for (let i = 2; i <= 20; i++) {
    const candidate = `${baseSlug}-${i}`
    const { data: taken } = await supabase
      .from('orgs')
      .select('slug')
      .eq('slug', candidate)
      .maybeSingle()
    if (!taken) return candidate
  }

  // Fallback: append random suffix
  const rnd = Math.random().toString(36).slice(2, 7)
  return `${baseSlug}-${rnd}`
}

const normalizePlan = (value?: string | null): Organization['plan'] => {
  if (!value) return 'trial'
  const lowered = value.toLowerCase()
  if (lowered === 'starter') return 'basic'
  if (lowered === 'pro') return 'professional'
  if (lowered === 'enterprise') return 'enterprise'
  if (lowered === 'basic') return 'basic'
  if (lowered === 'professional') return 'professional'
  return 'trial'
}

const normalizeStatus = (
  value?: string | null,
  ativo?: boolean | null
): Organization['status'] => {
  if (!value) {
    if (ativo === null || ativo === undefined) return 'pending'
    return ativo ? 'active' : 'suspended'
  }
  const lowered = value.toLowerCase()
  if (lowered === 'active' || lowered === 'ativo') return 'active'
  if (lowered === 'suspended' || lowered === 'suspenso') return 'suspended'
  if (lowered === 'cancelled' || lowered === 'cancelado' || lowered === 'canceled') return 'cancelled'
  if (lowered === 'pending' || lowered === 'pendente') return 'pending'
  if (lowered === 'trial') return 'active'
  return 'pending'
}

const resolveStatus = (
  ativo?: boolean | null,
  settings?: Record<string, any>,
  rawStatus?: string | null
) => {
  const statusValue = rawStatus || (settings?.status as string | undefined)
  return normalizeStatus(statusValue, ativo)
}

const buildAddressFromSettings = (settings?: Record<string, any>) => {
  const address = settings?.address
  if (!address || typeof address !== 'object') return null
  return address as Organization['address']
}

const resolveAddress = (dbAddress?: Record<string, any> | null, settings?: Record<string, any>) => {
  if (dbAddress && typeof dbAddress === 'object') {
    return dbAddress as Organization['address']
  }
  return buildAddressFromSettings(settings)
}

const buildSettingsFromInput = (
  input: Record<string, any>,
  existing: Record<string, any> = {}
) => {
  const incomingSettings =
    input.settings && typeof input.settings === 'object' ? input.settings : {}
  const next: Record<string, any> = { ...existing, ...incomingSettings }

  if ((input as any).plan) next.plan = (input as any).plan
  if (input.slug) next.slug = input.slug
  if (input.email) next.email = input.email
  if (input.phone) next.phone = input.phone
  if (input.billing_email) next.billing_email = input.billing_email
  if (input.billing_cycle) next.billing_cycle = input.billing_cycle
  if (input.logo_url) next.logo_url = input.logo_url
  if (input.primary_color) next.primary_color = input.primary_color
  if (input.secondary_color) next.secondary_color = input.secondary_color
  if (input.custom_domain) next.custom_domain = input.custom_domain
  if ((input as any).admin_email) next.admin_email = (input as any).admin_email
  if ((input as any).admin_name) next.admin_name = (input as any).admin_name
  if ((input as any).responsavel_email) next.responsavel_email = (input as any).responsavel_email
  if (input.max_users !== undefined) next.max_users = input.max_users
  if (input.max_storage_gb !== undefined) next.max_storage_gb = input.max_storage_gb
  if (input.max_cases !== undefined) next.max_cases = input.max_cases

  if (input.address) {
    next.address = input.address
  } else {
    const address = {
      street: input.address_street,
      number: input.address_number,
      complement: input.address_complement,
      neighborhood: input.address_neighborhood,
      city: input.address_city,
      state: input.address_state,
      zip_code: input.address_postal_code,
      country: input.address_country,
    }
    const hasAnyAddress = Object.values(address).some((value) => value)
    if (hasAnyAddress) {
      next.address = { ...next.address, ...address }
    }
  }

  if (input.status) next.status = input.status

  return next
}

// Helper to map database columns to TypeScript types (orgs table)
function mapDbToOrg(dbOrg: any): Organization {
  const settings = dbOrg.settings || {}
  const name = dbOrg.nome || dbOrg.name || 'Sem nome'
  const slug = dbOrg.slug || settings.slug || slugify(name) || 'sem-slug'
  const rawStatus =
    (typeof dbOrg.status === 'string' && dbOrg.status) ||
    (typeof settings.status === 'string' && settings.status) ||
    null
  const rawPlan =
    (typeof dbOrg.plano === 'string' && dbOrg.plano) ||
    (typeof dbOrg.plan === 'string' && dbOrg.plan) ||
    (typeof settings.plan === 'string' && settings.plan) ||
    (rawStatus === 'trial' ? 'trial' : undefined)
  const plan = normalizePlan(rawPlan)
  const status = resolveStatus(dbOrg.ativo ?? dbOrg.active ?? null, settings, rawStatus)
  const address = resolveAddress(dbOrg.address, settings)
  const email = dbOrg.email || settings.email || settings.billing_email || ''
  const phone = dbOrg.phone || settings.phone || null

  return {
    id: dbOrg.id,
    name,
    slug,
    cnpj: dbOrg.cnpj || null,
    email,
    phone,
    address,
    address_street: address?.street || '',
    address_number: address?.number || '',
    address_complement: address?.complement || '',
    address_neighborhood: address?.neighborhood || '',
    address_city: address?.city || '',
    address_state: address?.state || '',
    address_postal_code: address?.zip_code || '',
    address_country: address?.country || '',
    plan,
    max_users: dbOrg.max_users || settings.max_users || 5,
    max_storage_gb: dbOrg.max_storage_gb || settings.max_storage_gb || 10,
    max_cases: dbOrg.max_cases ?? settings.max_cases ?? null,
    status,
    billing_email: settings.billing_email || null,
    billing_cycle: settings.billing_cycle || 'monthly',
    next_billing_date: settings.next_billing_date || null,
    logo_url: settings.logo_url || null,
    primary_color: settings.primary_color || '#059669',
    secondary_color: settings.secondary_color || null,
    custom_domain: settings.custom_domain || null,
    settings,
    metadata: settings.metadata || {},
    created_at: dbOrg.created_at,
    updated_at: dbOrg.updated_at || dbOrg.created_at,
    activated_at: settings.activated_at || null,
    suspended_at: settings.suspended_at || null,
    cancelled_at: settings.cancelled_at || null,
    provisioned_by: settings.provisioned_by || null,
    managed_by: settings.managed_by || null,
  }
}

export const organizationsService = {
  /**
   * Get all organizations (Fartech admin only)
   */
  async getAll(): Promise<Organization[]> {
    try {
      const { data, error } = await supabase
        .from('orgs')
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
        .from('orgs')
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
      const { data: byColumn, error: columnError } = await supabase
        .from('orgs')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()

      if (columnError) throw new AppError(columnError.message, 'database_error')
      if (byColumn) return mapDbToOrg(byColumn)

      const { data, error } = await supabase
        .from('orgs')
        .select('*')
        .filter('settings->>slug', 'eq', slug)
        .maybeSingle()

      if (error) throw new AppError(error.message, 'database_error')
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

      const settings = buildSettingsFromInput(input as Record<string, any>, {
        status: 'active',
        provisioned_by: user.id,
      })

      const orgName = input.name
      const rawSlug = input.slug || settings.slug || slugify(orgName)
      const orgSlug = await ensureUniqueSlug(rawSlug)
      const orgPlan = (input as Record<string, any>).plan || settings.plan || 'trial'
      const orgStatus = (settings.status as Organization['status']) || 'active'
      const orgAddress = input.address || settings.address || null

      // Build base payload (without the name/nome key)
      // IMPORTANT: only include cnpj when non-empty to avoid unique constraint on NULLs
      const trimmedCnpj = (input.cnpj || '').trim()
      const basePayload: Record<string, any> = {
        slug: orgSlug,
        email: input.email,
        phone: input.phone || null,
        address: orgAddress,
        plan: orgPlan,
        status: orgStatus,
        max_users: input.max_users ?? (settings.max_users as number | undefined),
        max_storage_gb: input.max_storage_gb ?? (settings.max_storage_gb as number | undefined),
        max_cases: (input as Record<string, any>).max_cases ?? settings.max_cases ?? null,
        billing_email: input.billing_email ?? settings.billing_email ?? null,
        billing_cycle: input.billing_cycle ?? settings.billing_cycle ?? 'monthly',
        settings,
      }
      if (trimmedCnpj) {
        basePayload.cnpj = trimmedCnpj
      }

      // Insert with both nome + name columns (remote DB has both)
      const insertPayload: Record<string, any> = { nome: orgName, name: orgName, ...basePayload }

      const { data, error } = await supabase
        .from('orgs')
        .insert(insertPayload)
        .select()
        .single()

      if (error) {
        // Handle duplicate CNPJ
        if (error.message.includes('orgs_cnpj_uq') || error.message.includes('cnpj')) {
          throw new AppError(
            `Já existe uma organização com este CNPJ (${trimmedCnpj}). Verifique o CNPJ informado.`,
            'database_error'
          )
        }
        // Handle duplicate slug (retry with suffix)
        if (error.message.includes('slug')) {
          const rnd = Math.random().toString(36).slice(2, 7)
          insertPayload.slug = `${orgSlug}-${rnd}`
          const { data: data2, error: error2 } = await supabase
            .from('orgs')
            .insert(insertPayload)
            .select()
            .single()
          if (error2) throw new AppError(error2.message, 'database_error')
          return mapDbToOrg(data2)
        }
        throw new AppError(error.message, 'database_error')
      }
      return mapDbToOrg(data)
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
      const existing = await this.getById(id)
      const settings = buildSettingsFromInput(input as Record<string, any>, existing?.settings || {})
      const nextName = input.name ?? existing?.name
      const nextSlug = input.slug ?? existing?.slug
      const nextEmail = input.email ?? existing?.email
      const nextPhone = input.phone ?? existing?.phone
      const nextAddress = input.address || settings.address || existing?.address || null
      const nextPlan = (input as Record<string, any>).plan ?? existing?.plan
      const nextStatus = settings.status || existing?.status || 'active'

      // Build base update payload (without name/nome)
      const trimmedCnpj = (input.cnpj || existing?.cnpj || '').toString().trim()
      const updateBase: Record<string, any> = {
        slug: nextSlug,
        email: nextEmail,
        phone: nextPhone,
        address: nextAddress,
        plan: nextPlan,
        status: nextStatus,
        settings,
      }
      if (trimmedCnpj) {
        updateBase.cnpj = trimmedCnpj
      }

      // Update with both nome + name columns (remote DB has both)
      const { data, error } = await supabase
        .from('orgs')
        .update({ nome: nextName, name: nextName, ...updateBase })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        if (error.message.includes('orgs_cnpj_uq') || error.message.includes('cnpj')) {
          throw new AppError(
            `Já existe outra organização com este CNPJ (${trimmedCnpj}).`,
            'database_error'
          )
        }
        throw new AppError(error.message, 'database_error')
      }
      return mapDbToOrg(data)
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
      const existing = await this.getById(id)
      const settings = buildSettingsFromInput(input as Record<string, any>, existing?.settings || {})

      const { data, error } = await supabase
        .from('orgs')
        .update({
          plan: input.plan,
          settings: {
            ...settings,
            max_users: input.max_users ?? settings.max_users,
            max_storage_gb: input.max_storage_gb ?? settings.max_storage_gb,
            max_cases: input.max_cases ?? settings.max_cases,
            plan: input.plan,
            status: settings.status || (existing?.status ?? 'active'),
          },
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw new AppError(error.message, 'database_error')
      return mapDbToOrg(data)
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
      const existing = await this.getById(id)
      const nextSettings = {
        ...(existing?.settings || {}),
        status: input.status,
      }

      if (input.status === 'active') {
        nextSettings.activated_at = new Date().toISOString()
      } else if (input.status === 'suspended') {
        nextSettings.suspended_at = new Date().toISOString()
      } else if (input.status === 'cancelled') {
        nextSettings.cancelled_at = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('orgs')
        .update({
          status: input.status,
          settings: nextSettings,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw new AppError(error.message, 'database_error')
      return mapDbToOrg(data)
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
      const existing = await this.getById(id)
      const { error } = await supabase
        .from('orgs')
        .update({
          status: 'cancelled',
          settings: {
            ...(existing?.settings || {}),
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
          },
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
      const { count: totalUsers, error: usersError } = await supabase
        .from('org_members')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)

      const { count: activeUsers, error: activeUsersError } = await supabase
        .from('org_members')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('ativo', true)

      const { count: adminUsers, error: adminUsersError } = await supabase
        .from('org_members')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('role', 'admin')

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
        .in('status', ['triagem', 'negociacao', 'contrato', 'andamento'])

      // TODO: Calculate storage used
      const org = await this.getById(orgId)
      const storageUsedGb =
        (org?.settings && (org.settings as { storage_used_gb?: number }).storage_used_gb) || 0
      const maxStorageGb = org?.max_storage_gb || 0
      const storageUsedPercentage =
        maxStorageGb > 0 ? Math.min(100, Math.round((storageUsedGb / maxStorageGb) * 100)) : 0

      if (usersError || activeUsersError || adminUsersError) {
        console.warn('Erro ao carregar membros da org:', usersError || activeUsersError || adminUsersError)
      }

      return {
        total_users: totalUsers || 0,
        active_users: activeUsers || 0,
        admin_users: adminUsers || 0,
        total_clients: totalClients || 0,
        total_cases: totalCases || 0,
        active_cases: activeCases || 0,
        storage_used_gb: storageUsedGb,
        storage_used_percentage: storageUsedPercentage,
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
        .from('orgs')
        .select('id')
        .filter('settings->>slug', 'eq', slug)

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
      const existing = await this.getById(orgId)
      const settings = {
        ...(existing?.settings || {}),
        status: 'active',
        activated_at: new Date().toISOString(),
        managed_by: adminUserId,
      }

      const { data, error } = await supabase
        .from('orgs')
        .update({
          ativo: true,
          settings,
        })
        .eq('id', orgId)
        .select()
        .single()

      if (error) throw new AppError(error.message, 'database_error')
      return mapDbToOrg(data)
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao ativar organização',
        'database_error'
      )
    }
  },
}
