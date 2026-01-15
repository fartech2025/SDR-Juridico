// FartechGuard - Component to restrict access to Fartech admins only
// Date: 2026-01-13

import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useIsFartechAdmin } from '@/hooks/usePermissions'
import { usePermissions } from '@/hooks/usePermissions'

interface FartechGuardProps {
  children: ReactNode
  
  // Redirect path if not Fartech admin (default: '/dashboard')
  redirectTo?: string
  
  // Fallback component to show instead of redirect
  fallback?: ReactNode
  
  // Loading component while checking role
  loadingComponent?: ReactNode
}

/**
 * Guard component to restrict access to Fartech admins only
 * 
 * Usage:
 * 
 * <FartechGuard>
 *   <FartechDashboard />
 * </FartechGuard>
 * 
 * <FartechGuard fallback={<div>Acesso negado</div>}>
 *   <OrganizationsList />
 * </FartechGuard>
 * 
 * <FartechGuard redirectTo="/home">
 *   <GlobalSettings />
 * </FartechGuard>
 */
export function FartechGuard({
  children,
  redirectTo = '/dashboard',
  fallback,
  loadingComponent = <div>Verificando acesso...</div>,
}: FartechGuardProps) {
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
  
  // User is not Fartech admin
  if (!isFartechAdmin) {
    if (fallback) {
      return <>{fallback}</>
    }
    return <Navigate to={redirectTo} replace />
  }
  
  // User is Fartech admin, render children
  return <>{children}</>
}
