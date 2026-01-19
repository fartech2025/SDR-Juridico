// useFartechAdmin - Hook for Fartech admin features
// Date: 2026-01-13
import { useState, useEffect, useCallback } from 'react';
import { useIsFartechAdmin, usePermissions } from './usePermissions';
import { useOrganization } from './useOrganization';
import { organizationsService } from '@/services/organizationsService';
/**
 * Hook for Fartech admin specific features
 * Only works for users with fartech_admin role
 */
export function useFartechAdmin() {
    const isFartechAdmin = useIsFartechAdmin();
    const { user } = usePermissions();
    const { allOrgs, loadAllOrgs, switchOrg, currentOrg } = useOrganization();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // Log warning if not Fartech admin (but don't throw)
    useEffect(() => {
        if (!isFartechAdmin && user) {
            console.warn('useFartechAdmin: User is not Fartech admin');
        }
    }, [isFartechAdmin, user]);
    /**
     * Load all organizations with stats
     */
    const loadOrgsWithStats = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            await loadAllOrgs();
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao carregar organizações';
            setError(message);
            throw err;
        }
        finally {
            setLoading(false);
        }
    }, [loadAllOrgs]);
    /**
     * Get global stats across all organizations
     */
    const getGlobalStats = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            if (!allOrgs || allOrgs.length === 0) {
                await loadAllOrgs();
            }
            const orgsData = allOrgs || [];
            // Calculate totals
            const totalOrgs = orgsData.length;
            const activeOrgs = orgsData.filter(o => o.status === 'active').length;
            const suspendedOrgs = orgsData.filter(o => o.status === 'suspended').length;
            const trialOrgs = orgsData.filter(o => o.plan === 'trial').length;
            // Get stats for each org
            const statsPromises = orgsData.map(org => organizationsService.getStats(org.id));
            const stats = await Promise.all(statsPromises);
            // Sum up totals
            const totalUsers = stats.reduce((sum, s) => sum + s.total_users, 0);
            const totalClients = stats.reduce((sum, s) => sum + s.total_clients, 0);
            const totalCases = stats.reduce((sum, s) => sum + s.total_cases, 0);
            const totalStorage = stats.reduce((sum, s) => sum + s.storage_used_gb, 0);
            return {
                organizations: {
                    total: totalOrgs,
                    active: activeOrgs,
                    suspended: suspendedOrgs,
                    trial: trialOrgs,
                },
                users: totalUsers,
                clients: totalClients,
                cases: totalCases,
                storage_gb: totalStorage,
            };
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao calcular estatísticas globais';
            setError(message);
            throw err;
        }
        finally {
            setLoading(false);
        }
    }, [allOrgs, loadAllOrgs]);
    /**
     * Get organizations by plan
     */
    const getOrgsByPlan = useCallback(() => {
        if (!allOrgs)
            return { starter: [], professional: [], enterprise: [] };
        return {
            trial: allOrgs.filter(o => o.plan === 'trial'),
            basic: allOrgs.filter(o => o.plan === 'basic'),
            professional: allOrgs.filter(o => o.plan === 'professional'),
            enterprise: allOrgs.filter(o => o.plan === 'enterprise'),
        };
    }, [allOrgs]);
    /**
     * Get organizations by status
     */
    const getOrgsByStatus = useCallback(() => {
        if (!allOrgs)
            return { active: [], trial: [], suspended: [], cancelled: [] };
        return {
            active: allOrgs.filter(o => o.status === 'active'),
            trial: allOrgs.filter(o => o.plan === 'trial'),
            suspended: allOrgs.filter(o => o.status === 'suspended'),
            cancelled: allOrgs.filter(o => o.status === 'cancelled'),
        };
    }, [allOrgs]);
    /**
     * Get organizations with usage alerts
     * Returns orgs that are near or over their limits
     */
    const getOrgsWithAlerts = useCallback(async () => {
        try {
            if (!allOrgs || allOrgs.length === 0) {
                await loadAllOrgs();
            }
            const orgsData = allOrgs || [];
            const alertOrgs = [];
            for (const org of orgsData) {
                const usage = await organizationsService.getUsage(org.id);
                const alerts = [];
                if (usage.users.percentage >= 90) {
                    alerts.push(`Usuários: ${usage.users.current}/${usage.users.limit} (${usage.users.percentage}%)`);
                }
                if (usage.storage.percentage >= 90) {
                    alerts.push(`Armazenamento: ${usage.storage.current_gb}/${usage.storage.limit_gb}GB (${usage.storage.percentage}%)`);
                }
                if (usage.cases.percentage && usage.cases.percentage >= 90) {
                    alerts.push(`Casos: ${usage.cases.current}/${usage.cases.limit} (${usage.cases.percentage}%)`);
                }
                if (alerts.length > 0) {
                    alertOrgs.push({ ...org, alerts });
                }
            }
            return alertOrgs;
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao buscar alertas';
            setError(message);
            throw err;
        }
    }, [allOrgs, loadAllOrgs]);
    /**
     * Switch to a specific organization view
     */
    const viewOrganization = useCallback(async (orgId) => {
        try {
            setLoading(true);
            setError(null);
            await switchOrg(orgId);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao trocar organização';
            setError(message);
            throw err;
        }
        finally {
            setLoading(false);
        }
    }, [switchOrg]);
    /**
     * Return to Fartech view (no specific org selected)
     */
    const viewFartechDashboard = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            // Note: Currently we don't have a way to clear org context
            // This would require updating OrganizationContext to accept null
            // For now, just clear the loading state
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao voltar para dashboard Fartech';
            setError(message);
            throw err;
        }
        finally {
            setLoading(false);
        }
    }, []);
    return {
        // State
        isFartechAdmin,
        user,
        allOrgs,
        currentOrg,
        loading,
        error,
        // Actions
        loadOrgsWithStats,
        viewOrganization,
        viewFartechDashboard,
        // Analytics
        getGlobalStats,
        getOrgsByPlan,
        getOrgsByStatus,
        getOrgsWithAlerts,
    };
}
/**
 * Hook to check if user is viewing a specific org
 * Useful for conditional rendering in Fartech admin views
 */
export function useIsViewingOrg() {
    const { currentOrg } = useOrganization();
    const isFartechAdmin = useIsFartechAdmin();
    return isFartechAdmin && currentOrg !== null;
}
/**
 * Hook to check if user is in Fartech dashboard view
 * (Fartech admin with no specific org selected)
 */
export function useIsFartechDashboardView() {
    const { currentOrg } = useOrganization();
    const isFartechAdmin = useIsFartechAdmin();
    return isFartechAdmin && currentOrg === null;
}
