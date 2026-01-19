import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// FartechDashboard - Main dashboard for Fartech admins
// Date: 2026-01-13
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, Briefcase, HardDrive, TrendingUp, AlertTriangle, Plus, Search } from 'lucide-react';
import { useFartechAdmin } from '@/hooks/useFartechAdmin';
import { FartechGuard } from '@/components/guards';
export default function FartechDashboard() {
    const { getGlobalStats, getOrgsWithAlerts, allOrgs, loadOrgsWithStats, loading } = useFartechAdmin();
    const [stats, setStats] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    useEffect(() => {
        loadData();
    }, []);
    const loadData = async () => {
        try {
            await loadOrgsWithStats();
            const globalStats = await getGlobalStats();
            setStats(globalStats);
            const orgsWithAlerts = await getOrgsWithAlerts();
            setAlerts(orgsWithAlerts);
        }
        catch (error) {
            console.error('Erro ao carregar dados:', error);
        }
    };
    const filteredOrgs = allOrgs?.filter(org => org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.slug.toLowerCase().includes(searchTerm.toLowerCase()));
    return (_jsx(FartechGuard, { children: _jsxs("div", { className: "min-h-screen bg-gray-50 dark:bg-gray-900", children: [_jsx("div", { className: "bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: "Fartech Dashboard" }), _jsx("p", { className: "mt-1 text-sm text-gray-500 dark:text-gray-400", children: "Vis\u00E3o geral de todas as organiza\u00E7\u00F5es" })] }), _jsxs(Link, { to: "/admin/organizations/new", className: "inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors", children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Nova Organiza\u00E7\u00E3o"] })] }) }) }), _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [stats && (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8", children: [_jsx(StatCard, { title: "Organiza\u00E7\u00F5es", value: stats.organizations.total, subtitle: `${stats.organizations.active} ativas`, icon: Building2, color: "emerald" }), _jsx(StatCard, { title: "Usu\u00E1rios", value: stats.users, subtitle: "Total de usu\u00E1rios", icon: Users, color: "blue" }), _jsx(StatCard, { title: "Clientes", value: stats.clients, subtitle: "Cadastrados", icon: Briefcase, color: "purple" }), _jsx(StatCard, { title: "Casos", value: stats.cases, subtitle: "Em andamento", icon: TrendingUp, color: "orange" }), _jsx(StatCard, { title: "Armazenamento", value: `${stats.storage_gb.toFixed(1)}GB`, subtitle: "Total usado", icon: HardDrive, color: "red" })] })), alerts.length > 0 && (_jsxs("div", { className: "mb-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6", children: [_jsxs("div", { className: "flex items-center mb-4", children: [_jsx(AlertTriangle, { className: "w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" }), _jsxs("h2", { className: "text-lg font-semibold text-yellow-900 dark:text-yellow-100", children: ["Alertas de Limites (", alerts.length, ")"] })] }), _jsx("div", { className: "space-y-3", children: alerts.slice(0, 5).map((org) => (_jsxs("div", { className: "flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: org.name }), _jsx("div", { className: "mt-1 space-y-1", children: org.alerts.map((alert, idx) => (_jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: alert }, idx))) })] }), _jsx(Link, { to: `/admin/organizations/${org.id}`, className: "text-sm text-emerald-600 dark:text-emerald-400 hover:underline", children: "Ver detalhes" })] }, org.id))) })] })), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow", children: [_jsxs("div", { className: "p-6 border-b border-gray-200 dark:border-gray-700", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900 dark:text-white", children: "Organiza\u00E7\u00F5es" }), _jsx(Link, { to: "/admin/organizations", className: "text-sm text-emerald-600 dark:text-emerald-400 hover:underline", children: "Ver todas" })] }), _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Buscar organiza\u00E7\u00F5es...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500" })] })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-gray-50 dark:bg-gray-700/50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: "Organiza\u00E7\u00E3o" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: "Plano" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: "Usu\u00E1rios" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: "Criado em" }), _jsx("th", { className: "px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: "A\u00E7\u00F5es" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-200 dark:divide-gray-700", children: loading ? (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "px-6 py-8 text-center text-gray-500 dark:text-gray-400", children: "Carregando..." }) })) : filteredOrgs && filteredOrgs.length > 0 ? (filteredOrgs.slice(0, 10).map((org) => (_jsxs("tr", { className: "hover:bg-gray-50 dark:hover:bg-gray-700/50", children: [_jsx("td", { className: "px-6 py-4", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-10 h-10 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center mr-3", children: _jsx(Building2, { className: "w-5 h-5 text-emerald-600 dark:text-emerald-400" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: org.name }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: org.slug })] })] }) }), _jsx("td", { className: "px-6 py-4", children: _jsx("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 capitalize", children: org.plan }) }), _jsx("td", { className: "px-6 py-4", children: _jsx(StatusBadge, { status: org.status }) }), _jsx("td", { className: "px-6 py-4 text-gray-900 dark:text-white", children: "-" }), _jsx("td", { className: "px-6 py-4 text-sm text-gray-500 dark:text-gray-400", children: new Date(org.created_at).toLocaleDateString('pt-BR') }), _jsx("td", { className: "px-6 py-4 text-right", children: _jsx(Link, { to: `/admin/organizations/${org.id}`, className: "text-emerald-600 dark:text-emerald-400 hover:underline text-sm", children: "Ver detalhes" }) })] }, org.id)))) : (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "px-6 py-8 text-center text-gray-500 dark:text-gray-400", children: "Nenhuma organiza\u00E7\u00E3o encontrada" }) })) })] }) })] })] })] }) }));
}
function StatCard({ title, value, subtitle, icon: Icon, color }) {
    const colorClasses = {
        emerald: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
        blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
        purple: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
        orange: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
        red: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    };
    return (_jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow p-6", children: [_jsx("div", { className: "flex items-center justify-between mb-4", children: _jsx("div", { className: `w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`, children: _jsx(Icon, { className: "w-6 h-6" }) }) }), _jsx("p", { className: "text-2xl font-bold text-gray-900 dark:text-white mb-1", children: value }), _jsx("p", { className: "text-sm font-medium text-gray-600 dark:text-gray-400 mb-1", children: title }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-500", children: subtitle })] }));
}
function StatusBadge({ status }) {
    const statusConfig = {
        active: { label: 'Ativo', class: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' },
        trial: { label: 'Trial', class: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300' },
        suspended: { label: 'Suspenso', class: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300' },
        cancelled: { label: 'Cancelado', class: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300' },
    };
    const config = statusConfig[status] || statusConfig.active;
    return (_jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`, children: config.label }));
}
