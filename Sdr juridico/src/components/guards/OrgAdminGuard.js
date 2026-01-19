import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate } from 'react-router-dom';
import { useIsOrgAdmin, useIsFartechAdmin } from '@/hooks/usePermissions';
import { usePermissions } from '@/hooks/usePermissions';
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
export function OrgAdminGuard({ children, redirectTo = '/app/dashboard', fallback, loadingComponent = _jsx("div", { children: "Verificando acesso..." }), allowFartechAdmin = true, }) {
    const isOrgAdmin = useIsOrgAdmin();
    const isFartechAdmin = useIsFartechAdmin();
    const { user, loading } = usePermissions();
    // Still loading user data
    if (loading) {
        return _jsx(_Fragment, { children: loadingComponent });
    }
    // Not authenticated: go to login
    if (!user) {
        return _jsx(Navigate, { to: "/login", replace: true });
    }
    // Check if user has required role
    const hasAccess = isOrgAdmin || (allowFartechAdmin && isFartechAdmin);
    // User doesn't have required role
    if (!hasAccess) {
        if (fallback) {
            return _jsx(_Fragment, { children: fallback });
        }
        return _jsx(Navigate, { to: redirectTo, replace: true });
    }
    // User has required role, render children
    return _jsx(_Fragment, { children: children });
}
