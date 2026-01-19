import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate } from 'react-router-dom';
import { useIsOrgActive } from '@/hooks/useOrganization';
import { useIsFartechAdmin } from '@/hooks/usePermissions';
import { useOrganization } from '@/hooks/useOrganization';
import { useAuth } from '@/contexts/AuthContext';
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
export function OrgActiveGuard({ children, redirectTo = '/org-suspended', fallback, loadingComponent = _jsx("div", { children: "Verificando organiza\u00E7\u00E3o..." }), allowFartechAdmin = true, }) {
    const { user } = useAuth();
    const isOrgActive = useIsOrgActive();
    const isFartechAdmin = useIsFartechAdmin();
    const { currentOrg, loading, isLoading } = useOrganization();
    // Still loading org data
    if (loading || isLoading) {
        return _jsx(_Fragment, { children: loadingComponent });
    }
    // Not authenticated - redirect to login
    if (!user) {
        return _jsx(Navigate, { to: "/login", replace: true });
    }
    // Fartech admins can bypass org status check
    if (allowFartechAdmin && isFartechAdmin) {
        return _jsx(_Fragment, { children: children });
    }
    // No org assigned - should not happen if user is authenticated
    if (!currentOrg) {
        return _jsx(_Fragment, { children: children });
    }
    // Org is not active
    if (!isOrgActive) {
        if (fallback) {
            return _jsx(_Fragment, { children: fallback });
        }
        return _jsx(Navigate, { to: redirectTo, replace: true });
    }
    // Org is active, render children
    return _jsx(_Fragment, { children: children });
}
