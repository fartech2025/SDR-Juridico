// useOrganization - Hook for organization management
// Date: 2026-01-13

import { useOrganizationContext } from '@/contexts/OrganizationContext'

/**
 * Hook to access organization context
 * Provides current organization, stats, and management functions
 */
export function useOrganization() {
  return useOrganizationContext()
}

/**
 * Hook to get current organization ID
 */
export function useOrgId(): string | null {
  const { currentOrg } = useOrganization()
  return currentOrg?.id || null
}

/**
 * Hook to check if organization is active
 */
export function useIsOrgActive(): boolean {
  const { currentOrg } = useOrganization()
  return currentOrg?.status === 'active'
}

/**
 * Hook to get organization limits
 */
export function useOrgLimits() {
  const { currentOrg, usage } = useOrganization()
  
  return {
    users: {
      current: usage?.users.current || 0,
      limit: currentOrg?.max_users || 0,
      available: (currentOrg?.max_users || 0) - (usage?.users.current || 0),
      isAtLimit: (usage?.users.current || 0) >= (currentOrg?.max_users || 0),
    },
    storage: {
      current: usage?.storage.current_gb || 0,
      limit: currentOrg?.max_storage_gb || 0,
      available: (currentOrg?.max_storage_gb || 0) - (usage?.storage.current_gb || 0),
      isAtLimit: (usage?.storage.current_gb || 0) >= (currentOrg?.max_storage_gb || 0),
    },
    cases: {
      current: usage?.cases.current || 0,
      limit: currentOrg?.max_cases,
      available: currentOrg?.max_cases 
        ? currentOrg.max_cases - (usage?.cases.current || 0)
        : null,
      isAtLimit: currentOrg?.max_cases 
        ? (usage?.cases.current || 0) >= currentOrg.max_cases
        : false,
    },
  }
}

/**
 * Hook to get organization branding
 */
export function useOrgBranding() {
  const { currentOrg } = useOrganization()
  
  return {
    name: currentOrg?.name || 'Organização',
    logo: currentOrg?.logo_url,
    primaryColor: currentOrg?.primary_color || '#721011',
    secondaryColor: currentOrg?.secondary_color,
    customDomain: currentOrg?.custom_domain,
  }
}
