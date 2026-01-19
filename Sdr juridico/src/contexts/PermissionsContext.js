import { jsx as _jsx } from "react/jsx-runtime";
// Permissions Context - RBAC management
// Date: 2026-01-13
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { permissionsService } from '@/services/permissionsService';
const PermissionsContext = createContext(undefined);
export function PermissionsProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [permissions, setPermissions] = useState([]);
    const [isFartechAdmin, setIsFartechAdmin] = useState(false);
    const [isOrgAdmin, setIsOrgAdmin] = useState(false);
    // Load user and permissions
    const loadPermissions = useCallback(async () => {
        try {
            setLoading(true);
            const [currentUser, userPermissions, isFartech, isAdmin] = await Promise.all([
                permissionsService.getCurrentUser(),
                permissionsService.getUserPermissions(),
                permissionsService.isFartechAdmin(),
                permissionsService.isOrgAdmin(),
            ]);
            setUser(currentUser);
            setPermissions(userPermissions);
            setIsFartechAdmin(isFartech);
            setIsOrgAdmin(isAdmin);
        }
        catch (error) {
            console.error('Error loading permissions:', error);
        }
        finally {
            setLoading(false);
        }
    }, []);
    // Check permission async
    const can = useCallback(async (resource, action) => {
        return await permissionsService.canAccess(resource, action);
    }, []);
    // Check permission sync (using cached permissions)
    const canSync = useCallback((resource, action) => {
        if (isFartechAdmin)
            return true;
        return permissions.some((p) => p.resource === resource &&
            (p.action === action || p.action === 'manage'));
    }, [permissions, isFartechAdmin]);
    // Full permission check with result
    const check = useCallback(async (resource, action) => {
        return await permissionsService.checkPermission({ resource, action });
    }, []);
    // Refresh permissions
    const refreshPermissions = useCallback(async () => {
        await loadPermissions();
    }, [loadPermissions]);
    // Load on mount
    useEffect(() => {
        loadPermissions();
    }, [loadPermissions]);
    const value = {
        user,
        loading,
        permissions,
        isFartechAdmin,
        isOrgAdmin,
        isRegularUser: !isFartechAdmin && !isOrgAdmin,
        can,
        canSync,
        check,
        refreshPermissions,
    };
    return (_jsx(PermissionsContext.Provider, { value: value, children: children }));
}
export function usePermissionsContext() {
    const context = useContext(PermissionsContext);
    if (context === undefined) {
        throw new Error('usePermissionsContext must be used within PermissionsProvider');
    }
    return context;
}
