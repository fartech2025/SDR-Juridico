// OrgAdminGuard - Component to restrict access to org admins and above
// Date: 2026-01-13

import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useIsOrgAdmin, useIsFartechAdmin } from '@/hooks/usePermissions'
import { usePermissions } from '@/hooks/usePermissions'

interface OrgAdminGuardProps {
  children: ReactNode
  
  // Redirect path if not org admin (default: '/dashboard')
  redirectTo?: string
  
  // Fallback component to show instead of redirect
  fallback?: ReactNode
  
  // Loading component while checking role
  loadingComponent?: ReactNode
  
  // Allow Fartech admins as well? (default: true)
  allowFartechAdmin?: boolean
}

/**
 * Guard component to restrict access to org admins (and optionally Fartech admins)
 * 
 * Usage:
 * 
 * <OrgAdminGuard>
 *   <OrgSettings />
 * </OrgAdminGuard>
 * 
 * <OrgAdminGuard allowFartechAdmin={false}>
 *   <OrgOnlySettings />
 * </OrgAdminGuard>
 * 
 * <OrgAdminGuard fallback={<div>Apenas administradores</div>}>
 *   <UserManagement />
 * </OrgAdminGuard>
 */
export function OrgAdminGuard({
  children,
  redirectTo = '/dashboard',
  fallback,
  loadingComponent = <div>Verificando acesso...</div>,
  allowFartechAdmin = true,
}: OrgAdminGuardProps) {
  const isOrgAdmin = useIsOrgAdmin()
  const isFartechAdmin = useIsFartechAdmin()
  const { user, loading } = usePermissions()
  
  // Still loading user data
  if (loading) {
    return <>{loadingComponent}</>
  }
  
  // Not authenticated: go to login
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  // Check if user has required role
  const hasAccess = isOrgAdmin || (allowFartechAdmin && isFartechAdmin)
  
  // User doesn't have required role
  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>
    }
    return <Navigate to={redirectTo} replace />
  }
  
  // User has required role, render children
  return <>{children}</>
}
