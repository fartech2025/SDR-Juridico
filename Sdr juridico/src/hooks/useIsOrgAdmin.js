import { useOrganization } from '@/contexts/OrganizationContext';
/**
 * Hook to check if the current user is an Org Admin
 * Org Admins have role = 'admin' in org_members table
 */
export function useIsOrgAdmin() {
    const { currentRole, isLoading } = useOrganization();
    // Return false while loading
    if (isLoading) {
        return false;
    }
    return currentRole === 'org_admin';
}
