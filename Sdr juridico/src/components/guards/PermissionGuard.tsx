// PermissionGuard - Component to restrict access based on permissions
// Date: 2026-01-13

import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { usePermissions } from '@/hooks/usePermissions'
import type { Permission, Resource, PermissionAction } from '@/types/permissions'

interface PermissionGuardProps {
  children: ReactNode
  
  // Option 1: Direct permission object
  permission?: Permission
  
  // Option 2: Resource + Action
  resource?: Resource
  action?: PermissionAction
  
  // Option 3: Multiple permissions (requires ALL)
  permissions?: Permission[]
  
  // Option 4: Multiple permissions (requires ANY)
  anyPermissions?: Permission[]
  
  // Redirect path if no permission (default: '/unauthorized')
  redirectTo?: string
  
  // Fallback component to show instead of redirect
  fallback?: ReactNode
  
  // Loading component while checking permissions
  loadingComponent?: ReactNode
}

/**
 * Guard component to restrict access based on permissions
 * 
 * Usage examples:
 * 
 * // Direct permission
 * <PermissionGuard permission={{ resource: 'organizations', action: 'create' }}>
 *   <CreateOrgButton />
 * </PermissionGuard>
 * 
 * // Resource + Action
 * <PermissionGuard resource="users" action="delete">
 *   <DeleteUserButton />
 * </PermissionGuard>
 * 
 * // Multiple permissions (ALL required)
 * <PermissionGuard permissions={[
 *   { resource: 'clients', action: 'read' },
 *   { resource: 'clients', action: 'update' }
 * ]}>
 *   <ClientEditor />
 * </PermissionGuard>
 * 
 * // Multiple permissions (ANY required)
 * <PermissionGuard anyPermissions={[
 *   { resource: 'organizations', action: 'create' },
 *   { resource: 'organizations', action: 'update' }
 * ]}>
 *   <OrgForm />
 * </PermissionGuard>
 * 
 * // With custom fallback
 * <PermissionGuard 
 *   resource="reports" 
 *   action="read"
 *   fallback={<div>Você não tem permissão para ver relatórios</div>}
 * >
 *   <ReportsPage />
 * </PermissionGuard>
 */
export function PermissionGuard({
  children,
  permission,
  resource,
  action,
  permissions,
  anyPermissions,
  redirectTo = '/unauthorized',
  fallback,
  loadingComponent = <div>Verificando permissões...</div>,
}: PermissionGuardProps) {
  const { canSync, user } = usePermissions()
  
  // Still loading user data
  if (!user) {
    return <>{loadingComponent}</>
  }
  
  let hasPermission = false
  
  // Check based on props provided
  if (permission) {
    hasPermission = canSync(permission)
  } else if (resource && action) {
    hasPermission = canSync({ resource, action })
  } else if (permissions && permissions.length > 0) {
    // Requires ALL permissions
    hasPermission = permissions.every(p => canSync(p))
  } else if (anyPermissions && anyPermissions.length > 0) {
    // Requires ANY permission
    hasPermission = anyPermissions.some(p => canSync(p))
  } else {
    console.warn('PermissionGuard: No permission criteria provided')
    hasPermission = false
  }
  
  // User doesn't have permission
  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>
    }
    return <Navigate to={redirectTo} replace />
  }
  
  // User has permission, render children
  return <>{children}</>
}
