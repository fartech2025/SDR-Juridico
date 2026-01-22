// Permissions Service - RBAC management
// Date: 2026-01-13

import { supabase } from '@/lib/supabaseClient'
import { AppError } from '@/utils/errors'
import type {
  Permission,
  PermissionCheck,
  PermissionResult,
  UserWithRole,
  Resource,
  PermissionAction,
} from '@/types/permissions'
import {
  getPermissionsByRole,
  FARTECH_ADMIN_PERMISSIONS,
} from '@/types/permissions'
import { ensureUsuario } from '@/services/usuariosService'
import { telemetryService } from '@/services/telemetryService'

const resolveRoleFromPermissoes = (permissoes: string[], memberRole?: string | null) => {
  if (permissoes.includes('fartech_admin')) {
    return 'fartech_admin'
  }
  if (memberRole && ['admin', 'gestor', 'org_admin'].includes(memberRole)) {
    return 'org_admin'
  }
  if (permissoes.includes('gestor') || permissoes.includes('org_admin')) {
    return 'org_admin'
  }
  return 'user'
}

let currentUserPromise: Promise<UserWithRole | null> | null = null

export const permissionsService = {
  /**
   * Get current user with role information
   */
  async getCurrentUser(): Promise<UserWithRole | null> {
    if (currentUserPromise) {
      return currentUserPromise
    }

    currentUserPromise = (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null

        const { usuario, missingUsuariosTable, seed } = await ensureUsuario(user)

        const fallbackName =
          (user.user_metadata && (user.user_metadata as { nome_completo?: string }).nome_completo) ||
          user.email ||
          'Usuario'
        const baseName = usuario?.nome_completo || seed?.nome_completo || fallbackName
        const baseEmail = usuario?.email || seed?.email || user.email || ''
        const permissoes = usuario?.permissoes || seed?.permissoes || []
        const isFartechAdmin = permissoes.includes('fartech_admin') || seed?.is_fartech_admin === true

        console.log('[PermissionsService] Dados do usuario:', { usuario, seed })
        console.log('[PermissionsService] Permissoes do usuario:', permissoes)
        console.log('[PermissionsService] isFartechAdmin:', isFartechAdmin)

        if (missingUsuariosTable) {
          console.log('[PermissionsService] usuarios table missing, using fallback')
        }

        const { data: memberData } = await supabase
          .from('org_members')
          .select('org_id, role')
          .eq('user_id', user.id)
          .eq('ativo', true)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle()

        const membershipRole = memberData?.role || seed?.role || null
        const role = resolveRoleFromPermissoes(permissoes, membershipRole)

        console.log('[PermissionsService] Role final:', role, 'membershipRole:', membershipRole)

        return {
          id: user.id,
          email: baseEmail,
          name: baseName,
          role,
          org_id: memberData?.org_id || seed?.org_id || null,
          is_fartech_admin: isFartechAdmin,
        } as UserWithRole
      } catch (error) {
        console.error('Error getting current user:', error)
        return null
      }
    })()

    try {
      return await currentUserPromise
    } finally {
      currentUserPromise = null
    }
  },

  /**
   * Check if user has permission
   */
  async checkPermission(check: PermissionCheck): Promise<PermissionResult> {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        return { allowed: false, reason: 'Usuário não autenticado' }
      }

      // Fartech admins have all permissions
      if (user.is_fartech_admin) {
        return { allowed: true }
      }

      // Get permissions for user's role
      const permissions = getPermissionsByRole(user.role)

      // Check if permission exists
      const hasPermission = permissions.some(
        (p) =>
          p.resource === check.resource &&
          (p.action === check.action || p.action === 'manage')
      )

      if (!hasPermission) {
        return { 
          allowed: false, 
          reason: `Usuário não tem permissão para ${check.action} em ${check.resource}` 
        }
      }

      // For cross-org operations, verify org_id
      if (check.target_org_id && !user.is_fartech_admin) {
        return { 
          allowed: false, 
          reason: 'Operação não permitida em outra organização' 
        }
      }

      return { allowed: true }
    } catch (error) {
      console.error('Error checking permission:', error)
      return { 
        allowed: false, 
        reason: 'Erro ao verificar permissão' 
      }
    }
  },

  /**
   * Check multiple permissions at once
   */
  async checkPermissions(checks: PermissionCheck[]): Promise<Record<string, PermissionResult>> {
    const results: Record<string, PermissionResult> = {}

    for (const check of checks) {
      const key = `${check.resource}:${check.action}`
      results[key] = await this.checkPermission(check)
    }

    return results
  },

  /**
   * Get all permissions for current user
   */
  async getUserPermissions(): Promise<Permission[]> {
    try {
      const user = await this.getCurrentUser()
      if (!user) return []

      if (user.is_fartech_admin) {
        return FARTECH_ADMIN_PERMISSIONS
      }

      return getPermissionsByRole(user.role)
    } catch (error) {
      console.error('Error getting user permissions:', error)
      return []
    }
  },

  /**
   * Check if user can access resource
   */
  async canAccess(resource: Resource, action: PermissionAction = 'read'): Promise<boolean> {
    const result = await this.checkPermission({ resource, action })
    return result.allowed
  },

  /**
   * Check if user is Fartech admin
   */
  async isFartechAdmin(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser()
      return user?.is_fartech_admin || false
    } catch (error) {
      return false
    }
  },

  /**
   * Check if user is org admin
   */
  async isOrgAdmin(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser()
      return user?.role === 'org_admin' || user?.is_fartech_admin || false
    } catch (error) {
      return false
    }
  },

  /**
   * Check if user can manage users in their org
   */
  async canManageUsers(): Promise<boolean> {
    return this.canAccess('users', 'manage')
  },

  /**
   * Check if user can manage organization settings
   */
  async canManageOrg(): Promise<boolean> {
    return this.canAccess('organizations', 'manage')
  },

  /**
   * Check if user can access billing
   */
  async canAccessBilling(): Promise<boolean> {
    return this.canAccess('billing', 'read')
  },

  /**
   * Get user's organization ID
   */
  async getUserOrgId(): Promise<string | null> {
    try {
      const user = await this.getCurrentUser()
      return user?.org_id || null
    } catch (error) {
      return null
    }
  },

  /**
   * Get user's organization membership with role
   */
  async getUserOrgMembership(_orgId: string): Promise<{ role: string; org_id: string } | null> {
    try {
      void _orgId
      return null
    } catch (error) {
      console.error('Error getting user org membership:', error)
      return null
    }
  },

  /**
   * Validate if user can perform action on specific org
   */
  async validateOrgAccess(_targetOrgId: string): Promise<boolean> {
    try {
      void _targetOrgId
      const user = await this.getCurrentUser()
      if (!user) return false

      // Fartech admins can access any org
      if (user.is_fartech_admin) return true

      // Other users can only access their own org
      return false
    } catch (error) {
      return false
    }
  },

  /**
   * Check if user can perform action on resource within their org
   */
  async canAccessInOrg(
    resource: Resource,
    action: PermissionAction,
    targetOrgId: string
  ): Promise<PermissionResult> {
    // First check basic permission
    const permissionResult = await this.checkPermission({ resource, action })
    if (!permissionResult.allowed) return permissionResult

    // Then check org access
    const hasOrgAccess = await this.validateOrgAccess(targetOrgId)
    if (!hasOrgAccess) {
      return {
        allowed: false,
        reason: 'Acesso negado para esta organização',
      }
    }

    return { allowed: true }
  },

  /**
   * Log permission check for audit
   */
  async logPermissionCheck(
    check: PermissionCheck,
    result: PermissionResult,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const user = await this.getCurrentUser()
      if (!user) return
      if (!user.org_id) return

      // Only log if explicitly enabled or for sensitive operations
      const sensitiveResources: Resource[] = ['organizations', 'users', 'billing']
      if (!sensitiveResources.includes(check.resource)) return

      await telemetryService.logAuditEvent({
        org_id: user.org_id,
        actor_user_id: user.id,
        action: check.action,
        entity: check.resource,
        entity_id: metadata?.resource_id || null,
        details: {
          ...metadata,
          success: result.allowed,
          reason: result.reason,
        },
      })
    } catch (error) {
      console.error('Error logging permission check:', error)
      // Don't throw - logging should not break functionality
    }
  },

  /**
   * Require permission (throws if not allowed)
   */
  async requirePermission(check: PermissionCheck): Promise<void> {
    const result = await this.checkPermission(check)
    if (!result.allowed) {
      throw new AppError(
        result.reason || 'Permissão negada',
        'permission_denied'
      )
    }
  },

  /**
   * Require Fartech admin role (throws if not)
   */
  async requireFartechAdmin(): Promise<void> {
    const isFartech = await this.isFartechAdmin()
    if (!isFartech) {
      throw new AppError(
        'Esta operação requer permissões de administrador Fartech',
        'permission_denied'
      )
    }
  },

  /**
   * Require org admin role (throws if not)
   */
  async requireOrgAdmin(): Promise<void> {
    const isAdmin = await this.isOrgAdmin()
    if (!isAdmin) {
      throw new AppError(
        'Esta operação requer permissões de administrador da organização',
        'permission_denied'
      )
    }
  },
}
