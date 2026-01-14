import { useOrganization } from '@/contexts/OrganizationContext'

/**
 * Hook to check if the current user is a Fartech Admin
 * Fartech Admins have is_fartech_admin = true in profiles table
 */
export function useIsFartechAdmin() {
  const { isFartechAdmin, isLoading } = useOrganization()
  
  // Return false while loading to prevent premature redirects
  if (isLoading) {
    return false
  }
  
  return isFartechAdmin
}
