import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// UserManagement - Manage organization users (Org Admin+)
// Date: 2026-01-13
import { useState, useEffect } from 'react';
import { Users, Edit, Trash2, Shield, Search, UserPlus } from 'lucide-react';
import { OrgAdminGuard } from '@/components/guards';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/lib/supabaseClient';
export default function UserManagement() {
    const { currentOrg } = useOrganization();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showInviteModal, setShowInviteModal] = useState(false);
    useEffect(() => {
        loadUsers();
    }, [currentOrg]);
    const loadUsers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('usuarios')
                .select('id, email, nome_completo, permissoes, created_at, updated_at')
                .order('created_at', { ascending: false });
            if (error)
                throw error;
            const mapped = (data || []).map((row) => {
                const permissoes = row.permissoes || [];
                const role = permissoes.includes('fartech_admin')
                    ? 'fartech_admin'
                    : permissoes.includes('gestor') || permissoes.includes('org_admin')
                        ? 'org_admin'
                        : 'user';
                return {
                    id: row.id,
                    email: row.email,
                    nome: row.nome_completo,
                    role,
                    created_at: row.created_at,
                    last_sign_in_at: row.updated_at,
                };
            });
            setUsers(mapped);
        }
        catch (error) {
            console.error('Erro ao carregar usuários:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const filteredUsers = users.filter(user => user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.nome?.toLowerCase().includes(searchTerm.toLowerCase()));
    return (_jsx(OrgAdminGuard, { children: _jsxs("div", { className: "min-h-screen bg-gray-50 dark:bg-gray-900", children: [_jsx("div", { className: "bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-3xl font-bold text-gray-900 dark:text-white flex items-center", children: [_jsx(Users, { className: "w-8 h-8 mr-3" }), "Gerenciar Usu\u00E1rios"] }), _jsxs("p", { className: "mt-1 text-sm text-gray-500 dark:text-gray-400", children: [currentOrg?.name, " \u2022 ", filteredUsers.length, " usu\u00E1rios"] })] }), _jsxs("button", { onClick: () => setShowInviteModal(true), className: "inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors", children: [_jsx(UserPlus, { className: "w-4 h-4 mr-2" }), "Convidar Usu\u00E1rio"] })] }) }) }), _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [_jsx("div", { className: "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("p", { className: "text-sm font-medium text-blue-900 dark:text-blue-100", children: ["Usu\u00E1rios: ", users.length, " / ", currentOrg?.max_users] }), _jsxs("p", { className: "text-xs text-blue-700 dark:text-blue-300 mt-1", children: [currentOrg && currentOrg.max_users - users.length, " vagas dispon\u00EDveis"] })] }), users.length >= (currentOrg?.max_users || 0) && (_jsx("div", { className: "text-sm text-blue-700 dark:text-blue-300", children: "Limite atingido - entre em contato para aumentar" }))] }) }), _jsx("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-4", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Buscar por nome ou email...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500" })] }) }), _jsx("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-gray-50 dark:bg-gray-700/50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: "Usu\u00E1rio" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: "Fun\u00E7\u00E3o" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: "Cadastrado em" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: "\u00DAltimo Acesso" }), _jsx("th", { className: "px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: "A\u00E7\u00F5es" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-200 dark:divide-gray-700", children: loading ? (_jsx("tr", { children: _jsx("td", { colSpan: 5, className: "px-6 py-8 text-center text-gray-500 dark:text-gray-400", children: "Carregando usu\u00E1rios..." }) })) : filteredUsers.length > 0 ? (filteredUsers.map((user) => (_jsxs("tr", { className: "hover:bg-gray-50 dark:hover:bg-gray-700/50", children: [_jsx("td", { className: "px-6 py-4", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-10 h-10 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mr-3", children: _jsx("span", { className: "text-emerald-600 dark:text-emerald-400 font-semibold", children: (user.nome || user.email)[0].toUpperCase() }) }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: user.nome || 'Sem nome' }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: user.email })] })] }) }), _jsx("td", { className: "px-6 py-4", children: _jsx(RoleBadge, { role: user.role }) }), _jsx("td", { className: "px-6 py-4 text-sm text-gray-500 dark:text-gray-400", children: new Date(user.created_at).toLocaleDateString('pt-BR') }), _jsx("td", { className: "px-6 py-4 text-sm text-gray-500 dark:text-gray-400", children: user.last_sign_in_at
                                                            ? new Date(user.last_sign_in_at).toLocaleDateString('pt-BR')
                                                            : 'Nunca' }), _jsx("td", { className: "px-6 py-4", children: _jsxs("div", { className: "flex items-center justify-end gap-2", children: [_jsx("button", { className: "p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors", title: "Editar", children: _jsx(Edit, { className: "w-4 h-4" }) }), _jsx("button", { className: "p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors", title: "Remover", children: _jsx(Trash2, { className: "w-4 h-4" }) })] }) })] }, user.id)))) : (_jsx("tr", { children: _jsx("td", { colSpan: 5, className: "px-6 py-8 text-center text-gray-500 dark:text-gray-400", children: "Nenhum usu\u00E1rio encontrado" }) })) })] }) }) })] }), showInviteModal && (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900 dark:text-white mb-4", children: "Convidar Usu\u00E1rio" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400 mb-4", children: "Funcionalidade em desenvolvimento" }), _jsx("button", { onClick: () => setShowInviteModal(false), className: "w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors", children: "Fechar" })] }) }))] }) }));
}
function RoleBadge({ role }) {
    const roleConfig = {
        fartech_admin: {
            label: 'Fartech Admin',
            class: 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300',
            icon: Shield
        },
        org_admin: {
            label: 'Administrador',
            class: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300',
            icon: Shield
        },
        user: {
            label: 'Usuário',
            class: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
            icon: Users
        },
    };
    const config = roleConfig[role];
    const Icon = config.icon;
    return (_jsxs("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`, children: [_jsx(Icon, { className: "w-3 h-3 mr-1" }), config.label] }));
}
