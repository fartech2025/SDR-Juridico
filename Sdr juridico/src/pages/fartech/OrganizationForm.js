import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// OrganizationForm - Create/Edit organization form
// Date: 2026-01-13
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import { organizationsService } from '@/services/organizationsService';
import { supabase } from '@/lib/supabaseClient';
import { FartechGuard } from '@/components/guards';
export default function OrganizationForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        cnpj: '',
        email: '',
        responsavel_email: '',
        admin_email: '',
        admin_name: '',
        plan: 'trial',
        max_users: 5,
        max_storage_gb: 10,
        max_cases: null,
        primary_color: 'var(--brand-primary-dark)',
        secondary_color: null,
        address_street: '',
        address_number: '',
        address_complement: '',
        address_neighborhood: '',
        address_city: '',
        address_state: '',
        address_postal_code: '',
    });
    useEffect(() => {
        if (isEditMode && id) {
            loadOrganization(id);
        }
    }, [id, isEditMode]);
    const loadOrganization = async (orgId) => {
        try {
            setLoading(true);
            const org = await organizationsService.getById(orgId);
            if (org) {
                setFormData({
                    name: org.name,
                    slug: org.slug,
                    cnpj: org.cnpj || '',
                    email: org.email,
                    phone: org.phone || '',
                    responsavel_email: (org.settings && org.settings.responsavel_email) ||
                        '',
                    admin_email: (org.settings && org.settings.admin_email) || '',
                    admin_name: (org.settings && org.settings.admin_name) || '',
                    plan: org.plan,
                    max_users: org.max_users,
                    max_storage_gb: org.max_storage_gb,
                    max_cases: org.max_cases,
                    primary_color: org.primary_color,
                    secondary_color: org.secondary_color,
                    address: org.address || undefined,
                    address_street: org.address?.street || '',
                    address_number: org.address?.number || '',
                    address_complement: org.address?.complement || '',
                    address_neighborhood: org.address?.neighborhood || '',
                    address_city: org.address?.city || '',
                    address_state: org.address?.state || '',
                    address_postal_code: org.address?.zip_code || '',
                });
            }
        }
        catch (err) {
            setError('Erro ao carregar organização');
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    };
    const handlePlanChange = (plan) => {
        // Set default limits based on plan
        const limits = {
            trial: { max_users: 3, max_storage_gb: 5 },
            basic: { max_users: 5, max_storage_gb: 10 },
            professional: { max_users: 20, max_storage_gb: 50 },
            enterprise: { max_users: 100, max_storage_gb: 500 },
        };
        setFormData(prev => ({
            ...prev,
            plan,
            ...limits[plan],
        }));
    };
    const generateSlug = (name) => {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };
    const handleNameChange = (name) => {
        setFormData(prev => ({
            ...prev,
            name,
            slug: isEditMode ? prev.slug : generateSlug(name),
        }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setError(null);
            if (isEditMode && id) {
                await organizationsService.update(id, formData);
                navigate('/admin/organizations', { state: { refresh: true } });
                return;
            }
            const created = await organizationsService.create(formData);
            if (formData.admin_email) {
                const { data: sessionData } = await supabase.auth.getSession();
                let accessToken = sessionData.session?.access_token;
                if (!accessToken) {
                    const { data: refreshed } = await supabase.auth.refreshSession();
                    accessToken = refreshed.session?.access_token;
                }
                if (!accessToken) {
                    setError('Sessão expirada. Faça login novamente para convidar o admin.');
                    return;
                }
                const { error: inviteError } = await supabase.functions.invoke('invite-org-admin', {
                    body: {
                        orgId: created.id,
                        adminEmail: formData.admin_email,
                        adminName: formData.admin_name,
                        responsavelEmail: formData.responsavel_email,
                    },
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
                    },
                });
                if (inviteError) {
                    setError(`Organização criada, mas falhou ao convidar o admin: ${inviteError.message}`);
                    return;
                }
            }
            navigate('/admin/organizations', { state: { refresh: true } });
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao salvar organização';
            setError(message);
            console.error(err);
        }
        finally {
            setSaving(false);
        }
    };
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center", children: _jsx("div", { className: "text-gray-600 dark:text-gray-400", children: "Carregando..." }) }));
    }
    return (_jsx(FartechGuard, { children: _jsxs("div", { className: "min-h-screen bg-gray-50 dark:bg-gray-900", children: [_jsx("div", { className: "bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700", children: _jsx("div", { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6", children: _jsx("div", { className: "flex items-center justify-between", children: _jsxs("div", { className: "flex items-center", children: [_jsx("button", { onClick: () => navigate('/admin/organizations'), className: "mr-4 p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors", children: _jsx(ArrowLeft, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: isEditMode ? 'Editar Organização' : 'Nova Organização' }), _jsx("p", { className: "mt-1 text-sm text-gray-500 dark:text-gray-400", children: isEditMode ? 'Atualize as informações da organização' : 'Crie uma nova organização no sistema' })] })] }) }) }) }), _jsxs("div", { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [error && (_jsx("div", { className: "mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4", children: _jsx("p", { className: "text-red-800 dark:text-red-300", children: error }) })), _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow mb-6", children: [_jsx("div", { className: "p-6 border-b border-gray-200 dark:border-gray-700", children: _jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Informa\u00E7\u00F5es B\u00E1sicas" }) }), _jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Nome da Organiza\u00E7\u00E3o *" }), _jsx("input", { type: "text", required: true, value: formData.name, onChange: (e) => handleNameChange(e.target.value), className: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500", placeholder: "Ex: Silva & Associados" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Slug (URL) *" }), _jsx("input", { type: "text", required: true, value: formData.slug, onChange: (e) => setFormData(prev => ({ ...prev, slug: e.target.value })), className: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500", placeholder: "silva-associados" }), _jsxs("p", { className: "mt-1 text-xs text-gray-500 dark:text-gray-400", children: ["Usado na URL: ", formData.slug || 'slug', ".fartech.com.br"] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "CNPJ" }), _jsx("input", { type: "text", value: formData.cnpj, onChange: (e) => setFormData(prev => ({ ...prev, cnpj: e.target.value })), className: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500", placeholder: "00.000.000/0000-00" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Email do Respons\u00E1vel" }), _jsx("input", { type: "email", value: formData.responsavel_email, onChange: (e) => setFormData(prev => ({ ...prev, responsavel_email: e.target.value })), className: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500", placeholder: "responsavel@escritorio.com.br" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Email do Admin da Organiza\u00E7\u00E3o" }), _jsx("input", { type: "email", required: !isEditMode, value: formData.admin_email, onChange: (e) => setFormData(prev => ({ ...prev, admin_email: e.target.value })), className: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500", placeholder: "admin@escritorio.com.br" }), _jsx("p", { className: "mt-1 text-xs text-gray-500 dark:text-gray-400", children: "Esse admin receber\u00E1 o email para cadastrar usu\u00E1rios do escrit\u00F3rio." })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Nome do Admin (opcional)" }), _jsx("input", { type: "text", value: formData.admin_name, onChange: (e) => setFormData(prev => ({ ...prev, admin_name: e.target.value })), className: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500", placeholder: "Nome completo" })] })] })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow mb-6", children: [_jsx("div", { className: "p-6 border-b border-gray-200 dark:border-gray-700", children: _jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Plano e Limites" }) }), _jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Plano *" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: ['starter', 'professional', 'enterprise'].map((plan) => (_jsx("button", { type: "button", onClick: () => handlePlanChange(plan), className: `p-4 border-2 rounded-lg text-left transition-all ${formData.plan === plan
                                                                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                                                                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'}`, children: _jsx("p", { className: "font-semibold text-gray-900 dark:text-white capitalize", children: plan }) }, plan))) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "M\u00E1ximo de Usu\u00E1rios *" }), _jsx("input", { type: "number", required: true, min: "1", value: formData.max_users, onChange: (e) => setFormData(prev => ({ ...prev, max_users: parseInt(e.target.value) })), className: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Armazenamento (GB) *" }), _jsx("input", { type: "number", required: true, min: "1", value: formData.max_storage_gb, onChange: (e) => setFormData(prev => ({ ...prev, max_storage_gb: parseInt(e.target.value) })), className: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "M\u00E1ximo de Casos" }), _jsx("input", { type: "number", min: "1", value: formData.max_cases || '', onChange: (e) => setFormData(prev => ({ ...prev, max_cases: e.target.value ? parseInt(e.target.value) : null })), className: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500", placeholder: "Ilimitado" })] })] })] })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow mb-6", children: [_jsx("div", { className: "p-6 border-b border-gray-200 dark:border-gray-700", children: _jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Identidade Visual" }) }), _jsx("div", { className: "p-6 space-y-6", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Cor Prim\u00E1ria *" }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("input", { type: "color", value: formData.primary_color, onChange: (e) => setFormData(prev => ({ ...prev, primary_color: e.target.value })), className: "w-20 h-10 rounded cursor-pointer" }), _jsx("input", { type: "text", value: formData.primary_color, onChange: (e) => setFormData(prev => ({ ...prev, primary_color: e.target.value })), className: "flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Cor Secund\u00E1ria" }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("input", { type: "color", value: formData.secondary_color || 'var(--brand-primary)', onChange: (e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value })), className: "w-20 h-10 rounded cursor-pointer" }), _jsx("input", { type: "text", value: formData.secondary_color || '', onChange: (e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value })), className: "flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-primary", placeholder: "var(--brand-primary)" })] })] })] }) })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow mb-6", children: [_jsx("div", { className: "p-6 border-b border-gray-200 dark:border-gray-700", children: _jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Endere\u00E7o" }) }), _jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6", children: [_jsxs("div", { className: "md:col-span-3", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Logradouro" }), _jsx("input", { type: "text", value: formData.address_street, onChange: (e) => setFormData(prev => ({ ...prev, address_street: e.target.value })), className: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500", placeholder: "Rua, Avenida, etc." })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "N\u00FAmero" }), _jsx("input", { type: "text", value: formData.address_number, onChange: (e) => setFormData(prev => ({ ...prev, address_number: e.target.value })), className: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500" })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Complemento" }), _jsx("input", { type: "text", value: formData.address_complement, onChange: (e) => setFormData(prev => ({ ...prev, address_complement: e.target.value })), className: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Bairro" }), _jsx("input", { type: "text", value: formData.address_neighborhood, onChange: (e) => setFormData(prev => ({ ...prev, address_neighborhood: e.target.value })), className: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500" })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Cidade" }), _jsx("input", { type: "text", value: formData.address_city, onChange: (e) => setFormData(prev => ({ ...prev, address_city: e.target.value })), className: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Estado" }), _jsx("input", { type: "text", value: formData.address_state, onChange: (e) => setFormData(prev => ({ ...prev, address_state: e.target.value })), className: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500", maxLength: 2, placeholder: "SP" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "CEP" }), _jsx("input", { type: "text", value: formData.address_postal_code, onChange: (e) => setFormData(prev => ({ ...prev, address_postal_code: e.target.value })), className: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500", placeholder: "00000-000" })] })] })] })] }), _jsxs("div", { className: "flex items-center justify-end gap-4", children: [_jsx("button", { type: "button", onClick: () => navigate('/admin/organizations'), className: "px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors", children: "Cancelar" }), _jsxs("button", { type: "submit", disabled: saving, className: "inline-flex items-center px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed", children: [_jsx(Save, { className: "w-4 h-4 mr-2" }), saving ? 'Salvando...' : isEditMode ? 'Atualizar' : 'Criar Organização'] })] })] })] })] }) }));
}
