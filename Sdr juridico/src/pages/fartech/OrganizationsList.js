import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// OrganizationsList - Complete list of all organizations for Fartech admins
// Date: 2026-01-13
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Building2, Search, Plus, Eye, Edit, Download, Users, ShieldCheck, Briefcase, Database, TrendingUp, AlertCircle } from 'lucide-react';
import { useFartechAdmin } from '@/hooks/useFartechAdmin';
import { FartechGuard } from '@/components/guards';
import { organizationsService } from '@/services/organizationsService';
export default function OrganizationsList() {
    const { allOrgs, loadOrgsWithStats, loading } = useFartechAdmin();
    const location = useLocation();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [planFilter, setPlanFilter] = useState('all');
    const [sortField] = useState('created_at');
    const [sortOrder] = useState('desc');
    const [orgsWithStats, setOrgsWithStats] = useState([]);
    useEffect(() => {
        loadOrgsWithStats();
    }, [loadOrgsWithStats, location.state]);
    // Load stats for each org (clientes, casos, armazenamento)
    useEffect(() => {
        const loadStats = async () => {
            if (!allOrgs)
                return;
            try {
                const stats = await Promise.all(allOrgs.map(async (org) => {
                    const orgStats = await organizationsService.getStats(org.id);
                    const userCount = orgStats.total_users || 0;
                    const caseCount = orgStats.total_cases || 0;
                    const storageUsed = Math.round(orgStats.storage_used_percentage || 0);
                    const adminCount = orgStats.admin_users || 0;
                    return {
                        ...org,
                        userCount,
                        adminCount,
                        caseCount,
                        storageUsed,
                    };
                }));
                setOrgsWithStats(stats);
            }
            catch (error) {
                console.error('Erro ao carregar estatísticas das organizações:', error);
                setOrgsWithStats(allOrgs);
            }
        };
        loadStats();
    }, [allOrgs]);
    // Filter and sort organizations
    const filteredOrgs = (orgsWithStats || [])
        .filter(org => {
        const matchesSearch = org.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            org.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            org.cnpj?.includes(searchTerm) || false;
        const matchesStatus = statusFilter === 'all' || org.status === statusFilter;
        const matchesPlan = planFilter === 'all' || org.plan === planFilter;
        return matchesSearch && matchesStatus && matchesPlan;
    })
        .sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
            case 'name':
                comparison = a.name.localeCompare(b.name);
                break;
            case 'created_at':
                comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                break;
            case 'plan':
                comparison = a.plan.localeCompare(b.plan);
                break;
            case 'status':
                comparison = a.status.localeCompare(b.status);
                break;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
    });
    // Calculate totals
    const totalUsers = filteredOrgs.reduce((sum, org) => sum + (org.userCount || 0), 0);
    const totalOrgs = filteredOrgs.length;
    const activeOrgs = filteredOrgs.filter(org => org.status === 'active').length;
    const exportToCSV = () => {
        if (!filteredOrgs || filteredOrgs.length === 0)
            return;
        const csv = [
            ['Nome', 'Slug', 'CNPJ', 'Plano', 'Status', 'Criado em'].join(','),
            ...filteredOrgs.map(org => [
                org.name,
                org.slug,
                org.cnpj || '',
                org.plan,
                org.status,
                new Date(org.created_at).toLocaleDateString('pt-BR')
            ].join(','))
        ].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `organizacoes-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };
    return (_jsx(FartechGuard, { children: _jsxs("div", { className: "min-h-screen bg-gray-50 dark:bg-gray-900", children: [_jsx("div", { className: "bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: "Gest\u00E3o de Organiza\u00E7\u00F5es" }), _jsx("p", { className: "mt-1 text-sm text-gray-500 dark:text-gray-400", children: "Painel de controle Fartech - Vis\u00E3o geral de todas as organiza\u00E7\u00F5es" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("button", { onClick: exportToCSV, className: "inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors", children: [_jsx(Download, { className: "w-4 h-4 mr-2" }), "Exportar"] }), _jsxs(Link, { to: "/admin/organizations/new", className: "inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors", children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Nova Organiza\u00E7\u00E3o"] })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4 mt-6", children: [_jsxs("div", { className: "bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-blue-100", children: "Total de Organiza\u00E7\u00F5es" }), _jsx("p", { className: "text-3xl font-bold mt-1", children: totalOrgs })] }), _jsx(Building2, { className: "w-10 h-10 text-blue-200" })] }), _jsxs("p", { className: "text-xs text-blue-100 mt-2", children: [activeOrgs, " ativas"] })] }), _jsxs("div", { className: "bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg p-4 text-white", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-emerald-100", children: "Total de Usu\u00E1rios" }), _jsx("p", { className: "text-3xl font-bold mt-1", children: totalUsers })] }), _jsx(Users, { className: "w-10 h-10 text-emerald-200" })] }), _jsx("p", { className: "text-xs text-emerald-100 mt-2", children: "Across all orgs" })] }), _jsxs("div", { className: "bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-purple-100", children: "Planos Enterprise" }), _jsx("p", { className: "text-3xl font-bold mt-1", children: filteredOrgs.filter(o => o.plan === 'enterprise').length })] }), _jsx(TrendingUp, { className: "w-10 h-10 text-purple-200" })] }), _jsx("p", { className: "text-xs text-purple-100 mt-2", children: "Premium clients" })] }), _jsxs("div", { className: "bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 text-white", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-orange-100", children: "Aten\u00E7\u00E3o Requerida" }), _jsx("p", { className: "text-3xl font-bold mt-1", children: filteredOrgs.filter(o => o.status === 'suspended').length })] }), _jsx(AlertCircle, { className: "w-10 h-10 text-orange-200" })] }), _jsx("p", { className: "text-xs text-orange-100 mt-2", children: "Orgs suspensas" })] })] })] }) }), _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [_jsx("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-6", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Buscar" }), _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Nome, slug ou CNPJ...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Status" }), _jsxs("select", { value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), className: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500", children: [_jsx("option", { value: "all", children: "Todos" }), _jsx("option", { value: "active", children: "Ativo" }), _jsx("option", { value: "trial", children: "Trial" }), _jsx("option", { value: "suspended", children: "Suspenso" }), _jsx("option", { value: "cancelled", children: "Cancelado" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Plano" }), _jsxs("select", { value: planFilter, onChange: (e) => setPlanFilter(e.target.value), className: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500", children: [_jsx("option", { value: "all", children: "Todos" }), _jsx("option", { value: "starter", children: "Starter" }), _jsx("option", { value: "professional", children: "Professional" }), _jsx("option", { value: "enterprise", children: "Enterprise" })] })] })] }) }), loading ? (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx("div", { className: "text-gray-500 dark:text-gray-400", children: "Carregando organiza\u00E7\u00F5es..." }) })) : filteredOrgs.length > 0 ? (_jsx("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: filteredOrgs.map((org) => (_jsx(OrgCard, { org: org }, org.id))) })) : (_jsx("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow p-12", children: _jsxs("div", { className: "text-center", children: [_jsx(Building2, { className: "mx-auto h-12 w-12 text-gray-400" }), _jsx("h3", { className: "mt-2 text-sm font-medium text-gray-900 dark:text-white", children: "Nenhuma organiza\u00E7\u00E3o encontrada" }), _jsx("p", { className: "mt-1 text-sm text-gray-500 dark:text-gray-400", children: searchTerm || statusFilter !== 'all' || planFilter !== 'all'
                                            ? 'Tente ajustar os filtros de busca'
                                            : 'Comece criando sua primeira organização' }), !searchTerm && statusFilter === 'all' && planFilter === 'all' && (_jsx("div", { className: "mt-6", children: _jsxs(Link, { to: "/admin/organizations/new", className: "inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors", children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Nova Organiza\u00E7\u00E3o"] }) }))] }) }))] })] }) }));
}
// Organization Card Component
function OrgCard({ org }) {
    return (_jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700", children: [_jsx("div", { className: "p-6 border-b border-gray-200 dark:border-gray-700", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: "w-14 h-14 rounded-lg flex items-center justify-center", style: { backgroundColor: (org.primary_color || 'var(--brand-primary)') + '20' }, children: org.logo_url ? (_jsx("img", { src: org.logo_url, alt: org.name, className: "w-12 h-12 rounded" })) : (_jsx(Building2, { className: "w-7 h-7", style: { color: org.primary_color || 'var(--brand-primary)' } })) }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: _jsx(Link, { to: `/admin/organizations/${org.id}/settings`, className: "hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors", children: org.name || 'Sem nome' }) }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: org.slug || '-' }), _jsx("p", { className: "text-xs text-gray-400 dark:text-gray-500 mt-1", children: org.cnpj || 'CNPJ não cadastrado' })] })] }), _jsxs("div", { className: "flex flex-col items-end space-y-2", children: [org.status && _jsx(StatusBadge, { status: org.status }), org.plan && _jsx(PlanBadge, { plan: org.plan })] })] }) }), _jsxs("div", { className: "p-6 grid grid-cols-2 md:grid-cols-4 gap-4", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "flex items-center justify-center w-10 h-10 mx-auto rounded-full bg-blue-100 dark:bg-blue-900/20 mb-2", children: _jsx(Users, { className: "w-5 h-5 text-blue-600 dark:text-blue-400" }) }), _jsx("p", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: org.userCount || 0 }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: "Usu\u00E1rios" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "flex items-center justify-center w-10 h-10 mx-auto rounded-full bg-purple-100 dark:bg-purple-900/20 mb-2", children: _jsx(ShieldCheck, { className: "w-5 h-5 text-purple-600 dark:text-purple-400" }) }), _jsx("p", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: org.adminCount || 0 }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: "Admins" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "flex items-center justify-center w-10 h-10 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/20 mb-2", children: _jsx(Briefcase, { className: "w-5 h-5 text-emerald-600 dark:text-emerald-400" }) }), _jsx("p", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: org.caseCount || 0 }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: "Casos" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "flex items-center justify-center w-10 h-10 mx-auto rounded-full bg-orange-100 dark:bg-orange-900/20 mb-2", children: _jsx(Database, { className: "w-5 h-5 text-orange-600 dark:text-orange-400" }) }), _jsxs("p", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: [org.storageUsed || 0, "%"] }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: "Storage" })] })] }), _jsxs("div", { className: "px-6 py-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between", children: [_jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400", children: ["Criado em ", new Date(org.created_at).toLocaleDateString('pt-BR')] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs(Link, { to: `/admin/organizations/${org.id}`, className: "inline-flex items-center px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors", children: [_jsx(Eye, { className: "w-4 h-4 mr-1.5" }), "Ver Detalhes"] }), _jsxs(Link, { to: `/admin/organizations/${org.id}/edit`, className: "inline-flex items-center px-3 py-1.5 text-sm text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors", children: [_jsx(Edit, { className: "w-4 h-4 mr-1.5" }), "Editar"] })] })] })] }));
}
function StatusBadge({ status }) {
    const statusConfig = {
        active: { label: 'Ativo', class: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' },
        trial: { label: 'Trial', class: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300' },
        suspended: { label: 'Suspenso', class: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300' },
        cancelled: { label: 'Cancelado', class: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300' },
        pending: { label: 'Pendente', class: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (_jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`, children: config.label }));
}
function PlanBadge({ plan }) {
    const planConfig = {
        trial: { label: 'Trial', class: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300' },
        basic: { label: 'Básico', class: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300' },
        professional: { label: 'Professional', class: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300' },
        enterprise: { label: 'Enterprise', class: 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300' },
    };
    const config = planConfig[plan] || planConfig.trial;
    return (_jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`, children: config.label }));
}
