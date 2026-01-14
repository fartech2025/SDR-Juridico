// Permissions Service - RBAC management
// Date: 2026-01-13

import { supabase } from '@/lib/supabaseClient'
import { AppError } from '@/utils/errors'
import type {
  UserRole,
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
  ORG_ADMIN_PERMISSIONS,
  USER_PERMISSIONS,
} from '@/types/permissions'

export const permissionsService = {
  /**
   * Get current user with role information
   */
  async getCurrentUser(): Promise<UserWithRole | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, email, nome, role, org_id, is_fartech_admin')
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        throw new AppError(error.message, 'database_error')
      }
      
      if (!data) return null
      
      // Map to UserWithRole interface
      return {
        id: data.user_id,
        email: data.email,
        name: data.nome,
        role: data.role,
        org_id: data.org_id,
        is_fartech_admin: data.is_fartech_admin || false,
      } as UserWithRole
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
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
      if (check.target_org_id && check.target_org_id !== user.org_id) {
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
  async getUserOrgMembership(orgId: string): Promise<{ role: string; org_id: string } | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('org_members')
        .select('role, org_id')
        .eq('user_id', user.id)
        .eq('org_id', orgId)
        .single()

      if (error) return null
      return data
    } catch (error) {
      console.error('Error getting user org membership:', error)
      return null
    }
  },

  /**
   * Validate if user can perform action on specific org
   */
  async validateOrgAccess(targetOrgId: string): Promise<boolean> {
    try {
      const user = await this.getCurrentUser()
      if (!user) return false

      // Fartech admins can access any org
      if (user.is_fartech_admin) return true

      // Other users can only access their own org
      return user.org_id === targetOrgId
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

      // Only log if explicitly enabled or for sensitive operations
      const sensitiveResources: Resource[] = ['organizations', 'users', 'billing']
      if (!sensitiveResources.includes(check.resource)) return

      await supabase.from('permission_audit_logs').insert({
        user_id: user.id,
        action: check.action,
        resource: check.resource,
        resource_id: metadata?.resource_id,
        org_id: user.org_id,
        success: result.allowed,
        reason: result.reason,
        metadata,
        // ip_address and user_agent would come from request headers
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
