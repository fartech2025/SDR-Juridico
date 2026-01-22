import { jsx as _jsx } from "react/jsx-runtime";
// Organization Context - Multi-tenant organization management
// Date: 2026-01-13
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { organizationsService } from '@/services/organizationsService';
import { permissionsService } from '@/services/permissionsService';
const OrganizationContext = createContext(undefined);
export function OrganizationProvider({ children }) {
    const [currentOrg, setCurrentOrg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState(null);
    const [usage, setUsage] = useState(null);
    const [allOrgs, setAllOrgs] = useState([]);
    const [isFartechAdmin, setIsFartechAdmin] = useState(false);
    const [currentRole, setCurrentRole] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    // Load current user's organization and permissions
    const loadCurrentOrg = useCallback(async () => {
        try {
            setLoading(true);
            setIsLoading(true);
            setError(null);
            const user = await permissionsService.getCurrentUser();
            // If no user, they're not logged in - just finish loading
            if (!user) {
                setIsFartechAdmin(false);
                setCurrentRole(null);
                setCurrentOrg(null);
                setLoading(false);
                setIsLoading(false);
                return;
            }
            const isFartech = user.is_fartech_admin;
            setIsFartechAdmin(isFartech);
            setCurrentRole(user.role || null);
            if (user.org_id) {
                const org = await organizationsService.getById(user.org_id);
                setCurrentOrg(org);
                if (org) {
                    await loadStats(org.id);
                }
            }
            else {
                setCurrentOrg(null);
            }
        }
        catch (err) {
            console.error('❌ Error loading organization:', err);
            setError(err instanceof Error ? err : new Error('Failed to load organization'));
            // Don't throw - let the app continue
        }
        finally {
            setLoading(false);
            setIsLoading(false);
        }
    }, []);
    // Load organization stats
    const loadStats = async (orgId) => {
        try {
            const [statsData, usageData] = await Promise.all([
                organizationsService.getStats(orgId),
                organizationsService.getUsage(orgId),
            ]);
            setStats(statsData);
            setUsage(usageData);
        }
        catch (err) {
            console.error('Error loading stats:', err);
        }
    };
    // Refresh current organization
    const refreshOrg = useCallback(async () => {
        if (currentOrg) {
            const updated = await organizationsService.getById(currentOrg.id);
            setCurrentOrg(updated);
        }
        else {
            await loadCurrentOrg();
        }
    }, [currentOrg, loadCurrentOrg]);
    // Refresh stats
    const refreshStats = useCallback(async () => {
        if (currentOrg) {
            await loadStats(currentOrg.id);
        }
    }, [currentOrg]);
    // Switch organization (Fartech admin only)
    const switchOrg = useCallback(async (orgId) => {
        try {
            const canSwitch = isFartechAdmin || await permissionsService.isFartechAdmin();
            if (!canSwitch) {
                throw new Error('Only Fartech admins can switch organizations');
            }
            setLoading(true);
            const org = await organizationsService.getById(orgId);
            setCurrentOrg(org);
            if (org) {
                await loadStats(org.id);
            }
        }
        catch (err) {
            console.error('Error switching organization:', err);
            setError(err instanceof Error ? err : new Error('Failed to switch organization'));
        }
        finally {
            setLoading(false);
        }
    }, [isFartechAdmin]);
    // Load all organizations (Fartech admin only)
    const loadAllOrgs = useCallback(async () => {
        try {
            const canLoad = isFartechAdmin || await permissionsService.isFartechAdmin();
            if (!canLoad)
                return;
            const orgs = await organizationsService.getAll();
            setAllOrgs(orgs);
        }
        catch (err) {
            console.error('Error loading all organizations:', err);
        }
    }, [isFartechAdmin]);
    // Load on mount
    useEffect(() => {
        loadCurrentOrg();
    }, [loadCurrentOrg]);
    const value = {
        currentOrg,
        loading,
        error,
        stats,
        usage,
        isFartechAdmin,
        currentRole,
        isLoading,
        refreshOrg,
        refreshStats,
        switchOrg,
        allOrgs,
        loadAllOrgs,
    };
    return (_jsx(OrganizationContext.Provider, { value: value, children: children }));
}
export function useOrganizationContext() {
    const context = useContext(OrganizationContext);
    if (context === undefined) {
        return {
            currentOrg: null,
            loading: false,
            error: null,
            stats: null,
            usage: null,
            isFartechAdmin: false,
            currentRole: null,
            isLoading: false,
            refreshOrg: async () => undefined,
            refreshStats: async () => undefined,
            switchOrg: async () => undefined,
            allOrgs: [],
            loadAllOrgs: async () => undefined,
        };
    }
    return context;
}
// Export also as useOrganization for convenience
export const useOrganization = useOrganizationContext;
