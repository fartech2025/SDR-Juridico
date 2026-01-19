import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
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
export function PermissionGuard({ children, permission, resource, action, permissions, anyPermissions, redirectTo = '/unauthorized', fallback, loadingComponent = _jsx("div", { children: "Verificando permiss\u00F5es..." }), }) {
    const { canSync, user } = usePermissions();
    // Still loading user data
    if (!user) {
        return _jsx(_Fragment, { children: loadingComponent });
    }
    let hasPermission = false;
    // Check based on props provided
    if (permission) {
        hasPermission = canSync(permission.resource, permission.action);
    }
    else if (resource && action) {
        hasPermission = canSync(resource, action);
    }
    else if (permissions && permissions.length > 0) {
        // Requires ALL permissions
        hasPermission = permissions.every(p => canSync(p.resource, p.action));
    }
    else if (anyPermissions && anyPermissions.length > 0) {
        // Requires ANY permission
        hasPermission = anyPermissions.some(p => canSync(p.resource, p.action));
    }
    else {
        console.warn('PermissionGuard: No permission criteria provided');
        hasPermission = false;
    }
    // User doesn't have permission
    if (!hasPermission) {
        if (fallback) {
            return _jsx(_Fragment, { children: fallback });
        }
        return _jsx(Navigate, { to: redirectTo, replace: true });
    }
    // User has permission, render children
    return _jsx(_Fragment, { children: children });
}
