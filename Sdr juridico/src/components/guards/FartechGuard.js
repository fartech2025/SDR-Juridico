import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate } from 'react-router-dom';
import { useIsFartechAdmin } from '@/hooks/usePermissions';
import { usePermissions } from '@/hooks/usePermissions';
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
export function FartechGuard({ children, redirectTo = '/app/dashboard', fallback, loadingComponent = _jsx("div", { children: "Verificando acesso..." }), }) {
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
    // User is not Fartech admin
    if (!isFartechAdmin) {
        if (fallback) {
            return _jsx(_Fragment, { children: fallback });
        }
        return _jsx(Navigate, { to: redirectTo, replace: true });
    }
    // User is Fartech admin, render children
    return _jsx(_Fragment, { children: children });
}
