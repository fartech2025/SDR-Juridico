// OrgActiveGuard - Component to restrict access to users with active organizations
// Date: 2026-01-13

import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useIsOrgActive } from '@/hooks/useOrganization'
import { useIsFartechAdmin } from '@/hooks/usePermissions'
import { useOrganization } from '@/hooks/useOrganization'
import { useAuth } from '@/contexts/AuthContext'

interface OrgActiveGuardProps {
  children: ReactNode
  
  // Redirect path if org not active (default: '/org-suspended')
  redirectTo?: string
  
  // Fallback component to show instead of redirect
  fallback?: ReactNode
  
  // Loading component while checking org status
  loadingComponent?: ReactNode
  
  // Allow Fartech admins to bypass check? (default: true)
  allowFartechAdmin?: boolean
}

/**
 * Guard component to restrict access based on organization status
 * Only allows access if organization is active
 * 
 * Usage:
 * 
 * <OrgActiveGuard>
 *   <ClientsList />
 * </OrgActiveGuard>
 * 
 * <OrgActiveGuard fallback={<SuspendedMessage />}>
 *   <CasesPage />
 * </OrgActiveGuard>
 * 
 * <OrgActiveGuard redirectTo="/contact-admin">
 *   <PremiumFeature />
 * </OrgActiveGuard>
 */
export function OrgActiveGuard({
  children,
  redirectTo = '/org-suspended',
  fallback,
  loadingComponent = <div>Verificando organização...</div>,
  allowFartechAdmin = true,
}: OrgActiveGuardProps) {
  const { user, loading: authLoading } = useAuth()
  const isOrgActive = useIsOrgActive()
  const isFartechAdmin = useIsFartechAdmin()
  const { currentOrg, loading, isLoading, error } = useOrganization()
  
  // Auth ainda carregando - aguardar
  if (authLoading) {
    return <>{loadingComponent}</>
  }
  
  // Not authenticated - redirect to login ANTES de checar org
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  // Still loading org data (com usuário autenticado)
  if (loading || isLoading) {
    return <>{loadingComponent}</>
  }
  
  // Fartech admins can bypass org status check
  if (allowFartechAdmin && isFartechAdmin) {
    return <>{children}</>
  }
  
  // Se houve erro ao carregar org (mas usuário está logado), 
  // não redirecionar imediatamente - pode ser erro temporário
  if (error) {
    console.error('Erro ao carregar organização:', error)
    // Se o erro persistir, podemos tentar novamente ou mostrar mensagem
  }
  
  // No org assigned - redirect to no-organization page
  if (!currentOrg) {
    return <Navigate to="/no-organization" replace />
  }
  
  // Org is not active
  if (!isOrgActive) {
    if (fallback) {
      return <>{fallback}</>
    }
    return <Navigate to={redirectTo} replace />
  }
  
  // Org is active, render children
  return <>{children}</>
}
