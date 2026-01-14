// usePermissions - Hook for permission checking
// Date: 2026-01-13

import { usePermissionsContext } from '@/contexts/PermissionsContext'
import type { Permission, Resource, PermissionAction } from '@/types/permissions'

/**
 * Hook to access permissions context
 * Provides permission checking functions and role flags
 */
export function usePermissions() {
  return usePermissionsContext()
}

/**
 * Hook to check if user has a specific permission
 * @param resource - Resource type to check
 * @param action - Action to check
 * @returns Boolean indicating if user has permission
 */
export function useHasPermission(resource: Resource, action: PermissionAction): boolean {
  const { canSync } = usePermissions()
  return canSync({ resource, action })
}

/**
 * Hook to check if user has ALL specified permissions
 * @param permissions - Array of permissions to check
 * @returns Boolean indicating if user has all permissions
 */
export function useHasAllPermissions(permissions: Permission[]): boolean {
  const { canSync } = usePermissions()
  return permissions.every(p => canSync(p))
}

/**
 * Hook to check if user has ANY of the specified permissions
 * @param permissions - Array of permissions to check
 * @returns Boolean indicating if user has at least one permission
 */
export function useHasAnyPermission(permissions: Permission[]): boolean {
  const { canSync } = usePermissions()
  return permissions.some(p => canSync(p))
}

/**
 * Hook to get user role
 */
export function useUserRole() {
  const { user } = usePermissions()
  return user?.role || 'user'
}

/**
 * Hook to check if user is Fartech admin
 */
export function useIsFartechAdmin(): boolean {
  const { isFartechAdmin } = usePermissions()
  return isFartechAdmin
}

/**
 * Hook to check if user is org admin
 */
export function useIsOrgAdmin(): boolean {
  const { isOrgAdmin } = usePermissions()
  return isOrgAdmin
}

/**
 * Hook to check if user is regular user
 */
export function useIsRegularUser(): boolean {
  const { isRegularUser } = usePermissions()
  return isRegularUser
}

/**
 * Hook to check if user can manage resource
 * @param resource - Resource type to check
 */
export function useCanManage(resource: Resource): boolean {
  const { canSync } = usePermissions()
  return canSync({ resource, action: 'create' }) &&
         canSync({ resource, action: 'update' }) &&
         canSync({ resource, action: 'delete' })
}

/**
 * Hook to check if user can view resource
 * @param resource - Resource type to check
 */
export function useCanView(resource: Resource): boolean {
  const { canSync } = usePermissions()
  return canSync({ resource, action: 'read' })
}

/**
 * Hook to get permission checker with org validation
 * Useful for components that need to check org-specific permissions
 */
export function useOrgPermission(orgId: string) {
  const { can, user } = usePermissions()
  
  return {
    async check(permission: Permission): Promise<boolean> {
      // Fartech admins can access any org
      if (user?.is_fartech_admin) return can(permission)
      
      // Others can only access their own org
      if (user?.org_id !== orgId) return false
      
      return can(permission)
    },
    
    canAccessOrg: user?.is_fartech_admin || user?.org_id === orgId,
  }
}
