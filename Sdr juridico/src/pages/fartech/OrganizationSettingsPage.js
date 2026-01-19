import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// OrganizationSettingsPage - Complete organization settings with API/Integrations
// Date: 2026-01-13
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Building2, MapPin, Key, Globe, Database, Cloud, CheckCircle, XCircle, AlertCircle, Plus, Trash2, Eye, EyeOff, Activity, MousePointer, Users as UsersIcon, TrendingUp, BarChart3 } from 'lucide-react';
import { FartechGuard } from '@/components/guards';
import { organizationsService } from '@/services/organizationsService';
export default function OrganizationSettingsPage() {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [organization, setOrganization] = useState(null);
    const [message, setMessage] = useState(null);
    // Form sections
    const [activeTab, setActiveTab] = useState('basic');
    // Basic Info
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [cnpj, setCnpj] = useState('');
    const [primaryColor, setPrimaryColor] = useState('var(--brand-primary)');
    const [secondaryColor, setSecondaryColor] = useState('var(--brand-primary-dark)');
    // Address
    const [addressStreet, setAddressStreet] = useState('');
    const [addressNumber, setAddressNumber] = useState('');
    const [addressComplement, setAddressComplement] = useState('');
    const [addressNeighborhood, setAddressNeighborhood] = useState('');
    const [addressCity, setAddressCity] = useState('');
    const [addressState, setAddressState] = useState('');
    const [addressPostalCode, setAddressPostalCode] = useState('');
    // APIs & Integrations
    const [apis, setApis] = useState([]);
    const [integrations, setIntegrations] = useState([]);
    const [showApiKeys, setShowApiKeys] = useState({});
    // Monitoring - Mock data (em produção viria de analytics real)
    const [onlineUsers, setOnlineUsers] = useState(0);
    const [totalClicks24h, setTotalClicks24h] = useState(0);
    const [peakConcurrentUsers, setPeakConcurrentUsers] = useState(0);
    // Simular dados de monitoramento
    useEffect(() => {
        const updateMonitoringData = () => {
            // Simular usuários online (0-10)
            setOnlineUsers(Math.floor(Math.random() * 11));
            // Simular cliques nas últimas 24h (100-1000)
            setTotalClicks24h(Math.floor(Math.random() * 900) + 100);
            // Simular pico de usuários simultâneos
            setPeakConcurrentUsers(Math.floor(Math.random() * 15) + 5);
        };
        updateMonitoringData();
        const interval = setInterval(updateMonitoringData, 5000); // Atualiza a cada 5s
        return () => clearInterval(interval);
    }, []);
    useEffect(() => {
        if (id) {
            loadOrganization(id);
        }
    }, [id]);
    const loadOrganization = async (orgId) => {
        try {
            setLoading(true);
            const org = await organizationsService.getById(orgId);
            if (!org) {
                setMessage({ type: 'error', text: 'Organização não encontrada' });
                return;
            }
            setOrganization(org);
            // Basic info
            setName(org.name || '');
            setSlug(org.slug || '');
            setCnpj(org.cnpj || '');
            setPrimaryColor(org.primary_color || 'var(--brand-primary)');
            setSecondaryColor(org.secondary_color || 'var(--brand-primary-dark)');
            // Address
            setAddressStreet(org.address_street || '');
            setAddressNumber(org.address_number || '');
            setAddressComplement(org.address_complement || '');
            setAddressNeighborhood(org.address_neighborhood || '');
            setAddressCity(org.address_city || '');
            setAddressState(org.address_state || '');
            setAddressPostalCode(org.address_postal_code || '');
            // APIs & Integrations from settings JSON
            const settings = org.settings || {};
            const rawApis = Array.isArray(settings.apis) ? settings.apis : [];
            const rawIntegrations = Array.isArray(settings.integrations) ? settings.integrations : [];
            const nextApis = rawApis.map((api, idx) => ({
                id: api.id ?? `api-${idx}`,
                name: api.name ?? 'API',
                enabled: Boolean(api.enabled),
                apiKey: api.apiKey ?? '',
                apiUrl: api.apiUrl ?? '',
                additionalConfig: api.additionalConfig ?? api.additional_config ?? {},
            }));
            const nextIntegrations = rawIntegrations.map((integration, idx) => ({
                id: integration.id ?? `integration-${idx}`,
                name: integration.name ?? 'Integracao',
                type: integration.type ?? 'other',
                enabled: Boolean(integration.enabled),
                credentials: integration.credentials ?? {},
            }));
            setApis(nextApis);
            setIntegrations(nextIntegrations);
        }
        catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Erro ao carregar organização' });
        }
        finally {
            setLoading(false);
        }
    };
    const handleSave = async () => {
        if (!organization)
            return;
        try {
            setSaving(true);
            setMessage(null);
            // Build settings object with APIs and integrations
            const settings = {
                ...organization.settings,
                apis,
                integrations
            };
            await organizationsService.update(organization.id, {
                name,
                slug,
                cnpj,
                primary_color: primaryColor,
                secondary_color: secondaryColor,
                address_street: addressStreet,
                address_number: addressNumber,
                address_complement: addressComplement,
                address_neighborhood: addressNeighborhood,
                address_city: addressCity,
                address_state: addressState,
                address_postal_code: addressPostalCode,
                settings
            });
            setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
            // Reload to get updated data
            setTimeout(() => loadOrganization(organization.id), 1000);
        }
        catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Erro ao salvar configurações' });
        }
        finally {
            setSaving(false);
        }
    };
    const addAPI = () => {
        const newAPI = {
            id: `api-${Date.now()}`,
            name: 'Nova API',
            enabled: false,
            apiKey: '',
            apiUrl: ''
        };
        setApis([...apis, newAPI]);
    };
    const updateAPI = (id, updates) => {
        setApis(apis.map(api => api.id === id ? { ...api, ...updates } : api));
    };
    const removeAPI = (id) => {
        setApis(apis.filter(api => api.id !== id));
    };
    const addIntegration = () => {
        const newIntegration = {
            id: `integration-${Date.now()}`,
            name: 'Nova Integração',
            type: 'other',
            enabled: false,
            credentials: {}
        };
        setIntegrations([...integrations, newIntegration]);
    };
    const updateIntegration = (id, updates) => {
        setIntegrations(integrations.map(int => int.id === id ? { ...int, ...updates } : int));
    };
    const removeIntegration = (id) => {
        setIntegrations(integrations.filter(int => int.id !== id));
    };
    const toggleShowApiKey = (id) => {
        setShowApiKeys({ ...showApiKeys, [id]: !showApiKeys[id] });
    };
    if (loading) {
        return (_jsx(FartechGuard, { children: _jsx("div", { className: "min-h-screen bg-[#f7f8fc] dark:bg-gray-900 flex items-center justify-center", children: _jsx("div", { className: "text-gray-600 dark:text-gray-400", children: "Carregando..." }) }) }));
    }
    if (!organization) {
        return (_jsx(FartechGuard, { children: _jsx("div", { className: "min-h-screen bg-[#f7f8fc] dark:bg-gray-900 flex items-center justify-center", children: _jsx("div", { className: "text-red-600 dark:text-red-400", children: "Organiza\u00E7\u00E3o n\u00E3o encontrada" }) }) }));
    }
    return (_jsx(FartechGuard, { children: _jsxs("div", { className: "min-h-screen bg-[#f7f8fc] dark:bg-gray-900", children: [_jsx("div", { className: "bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Link, { to: "/admin/organizations", className: "mr-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200", children: _jsx(ArrowLeft, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsxs("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: ["Configura\u00E7\u00F5es - ", organization.name] }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-1", children: "APIs, Integra\u00E7\u00F5es e Configura\u00E7\u00F5es da Organiza\u00E7\u00E3o" })] })] }), _jsxs("button", { onClick: handleSave, disabled: saving, className: "flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50", children: [_jsx(Save, { className: "w-4 h-4" }), saving ? 'Salvando...' : 'Salvar'] })] }) }) }), message && (_jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6", children: _jsx("div", { className: `p-4 rounded-lg ${message.type === 'success'
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800'
                            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'}`, children: message.text }) })), _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow mb-6", children: [_jsx("div", { className: "border-b border-gray-200 dark:border-gray-700", children: _jsxs("nav", { className: "flex -mb-px", children: [_jsxs("button", { onClick: () => setActiveTab('basic'), className: `flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${activeTab === 'basic'
                                                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`, children: [_jsx(Building2, { className: "w-4 h-4" }), "Informa\u00E7\u00F5es B\u00E1sicas"] }), _jsxs("button", { onClick: () => setActiveTab('address'), className: `flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${activeTab === 'address'
                                                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`, children: [_jsx(MapPin, { className: "w-4 h-4" }), "Endere\u00E7o"] }), _jsxs("button", { onClick: () => setActiveTab('monitoring'), className: `flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${activeTab === 'monitoring'
                                                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`, children: [_jsx(Activity, { className: "w-4 h-4" }), "Monitoramento"] }), _jsxs("button", { onClick: () => setActiveTab('apis'), className: `flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${activeTab === 'apis'
                                                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`, children: [_jsx(Key, { className: "w-4 h-4" }), "APIs (", apis.length, ")"] }), _jsxs("button", { onClick: () => setActiveTab('integrations'), className: `flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${activeTab === 'integrations'
                                                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`, children: [_jsx(Globe, { className: "w-4 h-4" }), "Integra\u00E7\u00F5es (", integrations.length, ")"] })] }) }), _jsxs("div", { className: "p-6", children: [activeTab === 'basic' && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Nome da Organiza\u00E7\u00E3o *" }), _jsx("input", { type: "text", value: name, onChange: (e) => setName(e.target.value), className: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Slug (URL amig\u00E1vel)" }), _jsx("input", { type: "text", value: slug, onChange: (e) => setSlug(e.target.value), className: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "CNPJ" }), _jsx("input", { type: "text", value: cnpj, onChange: (e) => setCnpj(e.target.value), placeholder: "00.000.000/0000-00", className: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500" })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Cor Prim\u00E1ria" }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("input", { type: "color", value: primaryColor, onChange: (e) => setPrimaryColor(e.target.value), className: "h-10 w-20 rounded border border-gray-300 dark:border-gray-600" }), _jsx("input", { type: "text", value: primaryColor, onChange: (e) => setPrimaryColor(e.target.value), className: "flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Cor Secund\u00E1ria" }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("input", { type: "color", value: secondaryColor, onChange: (e) => setSecondaryColor(e.target.value), className: "h-10 w-20 rounded border border-gray-300 dark:border-gray-600" }), _jsx("input", { type: "text", value: secondaryColor, onChange: (e) => setSecondaryColor(e.target.value), className: "flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" })] })] })] })] })), activeTab === 'address' && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [_jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Logradouro" }), _jsx("input", { type: "text", value: addressStreet, onChange: (e) => setAddressStreet(e.target.value), className: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "N\u00FAmero" }), _jsx("input", { type: "text", value: addressNumber, onChange: (e) => setAddressNumber(e.target.value), className: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500" })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Complemento" }), _jsx("input", { type: "text", value: addressComplement, onChange: (e) => setAddressComplement(e.target.value), className: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Bairro" }), _jsx("input", { type: "text", value: addressNeighborhood, onChange: (e) => setAddressNeighborhood(e.target.value), className: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500" })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Cidade" }), _jsx("input", { type: "text", value: addressCity, onChange: (e) => setAddressCity(e.target.value), className: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Estado" }), _jsx("input", { type: "text", value: addressState, onChange: (e) => setAddressState(e.target.value), maxLength: 2, placeholder: "UF", className: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "CEP" }), _jsx("input", { type: "text", value: addressPostalCode, onChange: (e) => setAddressPostalCode(e.target.value), placeholder: "00000-000", className: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500" })] })] })] })), activeTab === 'apis' && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Configura\u00E7\u00E3o de APIs" }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-1", children: "Gerencie as APIs externas que esta organiza\u00E7\u00E3o utiliza" })] }), _jsxs("button", { onClick: addAPI, className: "flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors", children: [_jsx(Plus, { className: "w-4 h-4" }), "Nova API"] })] }), apis.length === 0 ? (_jsxs("div", { className: "text-center py-12 text-gray-500 dark:text-gray-400", children: [_jsx(Database, { className: "w-12 h-12 mx-auto mb-4 opacity-50" }), _jsx("p", { children: "Nenhuma API configurada" }), _jsx("p", { className: "text-sm mt-1", children: "Clique em \"Nova API\" para adicionar" })] })) : (_jsx("div", { className: "space-y-4", children: apis.map((api) => (_jsxs("div", { className: "p-4 border border-gray-200 dark:border-gray-700 rounded-lg", children: [_jsxs("div", { className: "flex items-start justify-between mb-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("input", { type: "checkbox", checked: api.enabled, onChange: (e) => updateAPI(api.id, { enabled: e.target.checked }), className: "w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500" }), _jsxs("div", { children: [_jsx("input", { type: "text", value: api.name, onChange: (e) => updateAPI(api.id, { name: e.target.value }), className: "text-lg font-medium bg-transparent border-b border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-emerald-500 outline-none text-gray-900 dark:text-white" }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: api.enabled ? 'Ativa' : 'Inativa' })] })] }), _jsx("button", { onClick: () => removeAPI(api.id), className: "p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors", children: _jsx(Trash2, { className: "w-4 h-4" }) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "API URL" }), _jsx("input", { type: "url", value: api.apiUrl || '', onChange: (e) => updateAPI(api.id, { apiUrl: e.target.value }), placeholder: "https://api.exemplo.com", className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "API Key" }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: showApiKeys[api.id] ? 'text' : 'password', value: api.apiKey || '', onChange: (e) => updateAPI(api.id, { apiKey: e.target.value }), placeholder: "sk_live_...", className: "w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" }), _jsx("button", { type: "button", onClick: () => toggleShowApiKey(api.id), className: "absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200", children: showApiKeys[api.id] ? _jsx(EyeOff, { className: "w-4 h-4" }) : _jsx(Eye, { className: "w-4 h-4" }) })] })] })] })] }, api.id))) }))] })), activeTab === 'integrations' && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Integra\u00E7\u00F5es" }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-1", children: "Gerencie integra\u00E7\u00F5es com servi\u00E7os externos (Google Calendar, Email, Storage, etc)" })] }), _jsxs("button", { onClick: addIntegration, className: "flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors", children: [_jsx(Plus, { className: "w-4 h-4" }), "Nova Integra\u00E7\u00E3o"] })] }), integrations.length === 0 ? (_jsxs("div", { className: "text-center py-12 text-gray-500 dark:text-gray-400", children: [_jsx(Cloud, { className: "w-12 h-12 mx-auto mb-4 opacity-50" }), _jsx("p", { children: "Nenhuma integra\u00E7\u00E3o configurada" }), _jsx("p", { className: "text-sm mt-1", children: "Clique em \"Nova Integra\u00E7\u00E3o\" para adicionar" })] })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: integrations.map((integration) => (_jsxs("div", { className: "p-4 border border-gray-200 dark:border-gray-700 rounded-lg", children: [_jsxs("div", { className: "flex items-start justify-between mb-4", children: [_jsxs("div", { className: "flex items-center gap-3 flex-1", children: [_jsx("input", { type: "checkbox", checked: integration.enabled, onChange: (e) => updateIntegration(integration.id, { enabled: e.target.checked }), className: "w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500" }), _jsxs("div", { className: "flex-1", children: [_jsx("input", { type: "text", value: integration.name, onChange: (e) => updateIntegration(integration.id, { name: e.target.value }), className: "font-medium bg-transparent border-b border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-emerald-500 outline-none text-gray-900 dark:text-white w-full" }), _jsxs("select", { value: integration.type, onChange: (e) => updateIntegration(integration.id, { type: e.target.value }), className: "text-xs text-gray-500 dark:text-gray-400 mt-1 bg-transparent border-none outline-none", children: [_jsx("option", { value: "calendar", children: "Calendar" }), _jsx("option", { value: "email", children: "Email" }), _jsx("option", { value: "storage", children: "Storage" }), _jsx("option", { value: "payment", children: "Payment" }), _jsx("option", { value: "crm", children: "CRM" }), _jsx("option", { value: "other", children: "Outro" })] })] })] }), _jsx("button", { onClick: () => removeIntegration(integration.id), className: "p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors", children: _jsx(Trash2, { className: "w-4 h-4" }) })] }), _jsx("div", { className: "flex items-center gap-2 text-sm", children: integration.enabled ? (_jsxs(_Fragment, { children: [_jsx(CheckCircle, { className: "w-4 h-4 text-green-500" }), _jsx("span", { className: "text-green-600 dark:text-green-400", children: "Ativa" })] })) : (_jsxs(_Fragment, { children: [_jsx(XCircle, { className: "w-4 h-4 text-gray-400" }), _jsx("span", { className: "text-gray-500 dark:text-gray-400", children: "Inativa" })] })) })] }, integration.id))) }))] })), activeTab === 'monitoring' && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "mb-4", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Monitor de Acessos e Atividade" }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-1", children: "Acompanhe em tempo real os acessos simult\u00E2neos e cliques dos usu\u00E1rios" })] }), _jsx("div", { className: "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4", children: _jsxs("div", { className: "flex gap-3", children: [_jsx(AlertCircle, { className: "w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm font-medium text-blue-900 dark:text-blue-300 mb-2", children: "\uD83C\uDF89 Dados de Demonstra\u00E7\u00E3o - Configura\u00E7\u00E3o Futura" }), _jsx("p", { className: "text-xs text-blue-700 dark:text-blue-400 mb-3", children: "Os dados exibidos s\u00E3o simulados. Em produ\u00E7\u00E3o, podem ser integrados com:" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-2", children: [_jsxs("div", { className: "bg-white dark:bg-gray-800 rounded px-3 py-2 text-xs", children: [_jsx("span", { className: "font-semibold text-blue-900 dark:text-blue-300", children: "\uD83D\uDCCA Google Analytics" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400 mt-0.5", children: "Tracking completo de acessos" })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded px-3 py-2 text-xs", children: [_jsx("span", { className: "font-semibold text-blue-900 dark:text-blue-300", children: "\uD83D\uDD25 Hotjar" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400 mt-0.5", children: "Heatmaps e grava\u00E7\u00F5es" })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded px-3 py-2 text-xs", children: [_jsx("span", { className: "font-semibold text-blue-900 dark:text-blue-300", children: "\u26A1 Sistema Pr\u00F3prio" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400 mt-0.5", children: "API customizada de tracking" })] })] })] })] }) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { className: "bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx(UsersIcon, { className: "w-8 h-8 opacity-80" }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("div", { className: "w-2 h-2 bg-green-300 rounded-full animate-pulse" }), _jsx("span", { className: "text-xs opacity-80", children: "LIVE" })] })] }), _jsx("p", { className: "text-3xl font-bold", children: onlineUsers }), _jsx("p", { className: "text-sm opacity-80 mt-1", children: "Usu\u00E1rios Online Agora" })] }), _jsxs("div", { className: "bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx(MousePointer, { className: "w-8 h-8 opacity-80" }), _jsx("span", { className: "text-xs opacity-80", children: "24h" })] }), _jsx("p", { className: "text-3xl font-bold", children: totalClicks24h.toLocaleString() }), _jsx("p", { className: "text-sm opacity-80 mt-1", children: "Cliques (\u00FAltimas 24h)" })] }), _jsxs("div", { className: "bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx(TrendingUp, { className: "w-8 h-8 opacity-80" }), _jsx("span", { className: "text-xs opacity-80", children: "PICO" })] }), _jsx("p", { className: "text-3xl font-bold", children: peakConcurrentUsers }), _jsx("p", { className: "text-sm opacity-80 mt-1", children: "Pico de Acessos Simult\u00E2neos" })] })] }), _jsxs("div", { className: "bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h4", { className: "font-semibold text-gray-900 dark:text-white", children: "Acessos Simult\u00E2neos (\u00FAltimas 24h)" }), _jsx(BarChart3, { className: "w-5 h-5 text-gray-400" })] }), _jsx("div", { className: "space-y-3", children: [
                                                            { time: '00:00', users: 2 },
                                                            { time: '04:00', users: 1 },
                                                            { time: '08:00', users: 8 },
                                                            { time: '12:00', users: 12 },
                                                            { time: '16:00', users: 15 },
                                                            { time: '20:00', users: 7 },
                                                            { time: 'Agora', users: onlineUsers }
                                                        ].map((data, idx) => (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-xs text-gray-500 dark:text-gray-400 w-12", children: data.time }), _jsx("div", { className: "flex-1 bg-gray-100 dark:bg-gray-600 rounded-full h-6 relative overflow-hidden", children: _jsx("div", { className: `h-full rounded-full transition-all duration-500 ${data.time === 'Agora'
                                                                            ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                                                                            : 'bg-gradient-to-r from-blue-400 to-blue-600'}`, style: { width: `${(data.users / 15) * 100}%` } }) }), _jsx("span", { className: "text-sm font-medium text-gray-900 dark:text-white w-8", children: data.users })] }, idx))) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600", children: [_jsx("h4", { className: "font-semibold text-gray-900 dark:text-white mb-4", children: "P\u00E1ginas Mais Acessadas" }), _jsx("div", { className: "space-y-3", children: [
                                                                    { page: 'Dashboard', visits: 156, color: 'blue' },
                                                                    { page: 'Casos', visits: 89, color: 'purple' },
                                                                    { page: 'Clientes', visits: 67, color: 'green' },
                                                                    { page: 'Agenda', visits: 45, color: 'orange' },
                                                                    { page: 'Documentos', visits: 23, color: 'red' }
                                                                ].map((item, idx) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3 flex-1", children: [_jsx("span", { className: `w-2 h-2 rounded-full bg-${item.color}-500` }), _jsx("span", { className: "text-sm text-gray-700 dark:text-gray-300", children: item.page })] }), _jsx("span", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: item.visits })] }, idx))) })] }), _jsxs("div", { className: "bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600", children: [_jsx("h4", { className: "font-semibold text-gray-900 dark:text-white mb-4", children: "A\u00E7\u00F5es Mais Realizadas" }), _jsx("div", { className: "space-y-3", children: [
                                                                    { action: 'Criar Novo Caso', clicks: 34, icon: '📋' },
                                                                    { action: 'Editar Cliente', clicks: 28, icon: '✏️' },
                                                                    { action: 'Upload Documento', clicks: 21, icon: '📤' },
                                                                    { action: 'Agendar Reunião', clicks: 18, icon: '📅' },
                                                                    { action: 'Exportar Relatório', clicks: 12, icon: '📊' }
                                                                ].map((item, idx) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3 flex-1", children: [_jsx("span", { className: "text-lg", children: item.icon }), _jsx("span", { className: "text-sm text-gray-700 dark:text-gray-300", children: item.action })] }), _jsx("span", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: item.clicks })] }, idx))) })] })] }), _jsxs("div", { className: "bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600", children: [_jsx("h4", { className: "font-semibold text-gray-900 dark:text-white mb-4", children: "Usu\u00E1rios Online Neste Momento" }), onlineUsers === 0 ? (_jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 text-center py-4", children: "Nenhum usu\u00E1rio online no momento" })) : (_jsx("div", { className: "space-y-2", children: Array.from({ length: onlineUsers }).map((_, idx) => (_jsxs("div", { className: "flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-600 rounded-lg", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-sm font-bold", children: String.fromCharCode(65 + idx) }), _jsxs("div", { children: [_jsxs("p", { className: "text-sm font-medium text-gray-900 dark:text-white", children: ["Usu\u00E1rio ", idx + 1] }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: ['Dashboard', 'Casos', 'Clientes', 'Agenda'][idx % 4] })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-2 h-2 bg-green-500 rounded-full animate-pulse" }), _jsxs("span", { className: "text-xs text-gray-500 dark:text-gray-400", children: [Math.floor(Math.random() * 30) + 1, "min"] })] })] }, idx))) }))] })] }))] })] }) })] }) }));
}
