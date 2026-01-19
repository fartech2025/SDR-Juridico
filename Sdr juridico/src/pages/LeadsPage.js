import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from 'react';
import { Search, TrendingUp, DollarSign, Clock, Zap, Phone, Mail, MessageSquare, ArrowUpRight, Filter, ArrowLeft, Save, User, MapPin, Briefcase, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import { LeadDrawer } from '@/components/LeadDrawer';
import { PageState } from '@/components/PageState';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import heroLight from '@/assets/hero-light.svg';
import { formatDateTime, formatPhone } from '@/utils/format';
import { useLeads } from '@/hooks/useLeads';
import { useCasos } from '@/hooks/useCasos';
import { useOrganization } from '@/hooks/useOrganization';
import { useAdvogados } from '@/hooks/useAdvogados';
import { cn } from '@/utils/cn';
import { leadsService } from '@/services/leadsService';
const resolveStatus = (value) => {
    if (value === 'loading' || value === 'empty' || value === 'error') {
        return value;
    }
    return 'ready';
};
const statusPill = (status) => {
    if (status === 'ganho')
        return 'border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400';
    if (status === 'perdido')
        return 'border-red-500/30 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400';
    if (status === 'proposta')
        return 'border-amber-500/30 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400';
    if (status === 'qualificado')
        return 'border-blue-500/30 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400';
    if (status === 'em_contato')
        return 'border-purple-500/30 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400';
    return 'border-slate-300 bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
};
const heatPill = (heat) => {
    if (heat === 'quente')
        return 'border-red-500/50 bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/20';
    if (heat === 'morno')
        return 'border-yellow-500/50 bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-lg shadow-yellow-500/20';
    return 'border-blue-500/50 bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/20';
};
export const LeadsPage = () => {
    const { leads, loading, error, createLead, updateLead, deleteLead, assignLeadAdvogado } = useLeads();
    const { casos } = useCasos();
    const { currentRole, isFartechAdmin, currentOrg } = useOrganization();
    const canManageLeads = isFartechAdmin || ['org_admin', 'gestor', 'admin'].includes(currentRole || '');
    const { advogados } = useAdvogados(currentOrg?.id || null, canManageLeads);
    const [params] = useSearchParams();
    const [query, setQuery] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('todos');
    const [heatFilter, setHeatFilter] = React.useState('todos');
    const [selectedLead, setSelectedLead] = React.useState(null);
    const [activeTab, setActiveTab] = React.useState('Todos');
    const [showNewLeadForm, setShowNewLeadForm] = React.useState(false);
    const [editingLeadId, setEditingLeadId] = React.useState(null);
    const [saving, setSaving] = React.useState(false);
    const [assigningLeadId, setAssigningLeadId] = React.useState(null);
    const [selectedAdvogadoId, setSelectedAdvogadoId] = React.useState('');
    const initialFormData = React.useMemo(() => ({
        nome: '',
        email: '',
        telefone: '',
        empresa: '',
        area: '',
        origem: '',
        status: 'novo',
        heat: 'frio',
        observacoes: '',
    }), []);
    // Estado do formulário de novo lead
    const [formData, setFormData] = React.useState(initialFormData);
    const isEditing = Boolean(editingLeadId);
    const tabs = ['Todos', 'Quentes 🔥', 'Em Negociação 💰', 'Fechados ✅'];
    // Métricas do pipeline de vendas
    const metrics = React.useMemo(() => {
        const total = leads.length;
        const quentes = leads.filter(l => l.heat === 'quente').length;
        const emNegociacao = leads.filter(l => ['proposta', 'qualificado'].includes(l.status)).length;
        const ganhos = leads.filter(l => l.status === 'ganho').length;
        const taxaConversao = total > 0 ? ((ganhos / total) * 100).toFixed(1) : '0';
        return { total, quentes, emNegociacao, ganhos, taxaConversao };
    }, [leads]);
    const filters = React.useMemo(() => ({
        status: Array.from(new Set(leads.map((lead) => lead.status))),
        heat: Array.from(new Set(leads.map((lead) => lead.heat))),
    }), [leads]);
    const filteredLeads = React.useMemo(() => {
        const term = query.trim().toLowerCase();
        return leads.filter((lead) => {
            const matchesQuery = !term ||
                lead.name.toLowerCase().includes(term) ||
                lead.area.toLowerCase().includes(term) ||
                lead.phone.replace(/\D/g, '').includes(term.replace(/\D/g, ''));
            const matchesStatus = statusFilter === 'todos' || lead.status === statusFilter;
            const matchesHeat = heatFilter === 'todos' || lead.heat === heatFilter;
            // Filtro por aba
            if (activeTab === 'Quentes 🔥')
                return matchesQuery && matchesStatus && lead.heat === 'quente';
            if (activeTab === 'Em Negociação 💰')
                return matchesQuery && matchesHeat && ['proposta', 'qualificado'].includes(lead.status);
            if (activeTab === 'Fechados ✅')
                return matchesQuery && matchesHeat && ['ganho', 'perdido'].includes(lead.status);
            return matchesQuery && matchesStatus && matchesHeat;
        });
    }, [query, statusFilter, heatFilter, activeTab, leads]);
    const forcedState = resolveStatus(params.get('state'));
    const baseState = loading
        ? 'loading'
        : error
            ? 'error'
            : filteredLeads.length === 0
                ? 'empty'
                : 'ready';
    const pageState = forcedState !== 'ready' ? forcedState : baseState;
    const relatedCase = selectedLead
        ? casos.find((caso) => caso.leadId === selectedLead.id)
        : undefined;
    const resetFilters = () => {
        setQuery('');
        setStatusFilter('todos');
        setHeatFilter('todos');
    };
    const resetLeadForm = () => {
        setFormData(initialFormData);
        setEditingLeadId(null);
    };
    const handleEditLead = async (leadId) => {
        if (!canManageLeads) {
            toast.error('Apenas gestores podem editar leads.');
            return;
        }
        setSaving(true);
        try {
            const lead = await leadsService.getLead(leadId);
            setFormData({
                nome: lead.nome || '',
                email: lead.email || '',
                telefone: lead.telefone || '',
                empresa: lead.empresa || '',
                area: lead.area || '',
                origem: lead.origem || '',
                status: lead.status,
                heat: lead.heat,
                observacoes: lead.observacoes || '',
            });
            setEditingLeadId(leadId);
            setShowNewLeadForm(true);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao carregar lead para edicao';
            toast.error(message);
        }
        finally {
            setSaving(false);
        }
    };
    const handleDeleteLead = async (leadId, leadName) => {
        if (!canManageLeads) {
            toast.error('Apenas gestores podem excluir leads.');
            return;
        }
        const confirmed = window.confirm(`Excluir o lead "${leadName}"? Essa acao nao pode ser desfeita.`);
        if (!confirmed)
            return;
        try {
            await deleteLead(leadId);
            toast.success(`Lead excluido: ${leadName}`);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao excluir lead';
            toast.error(message);
        }
    };
    const handleEncaminharLead = async (leadId) => {
        if (!selectedAdvogadoId) {
            toast.error('Selecione um advogado para encaminhar.');
            return;
        }
        const advogado = advogados.find((item) => item.id === selectedAdvogadoId);
        if (!advogado) {
            toast.error('Advogado nao encontrado.');
            return;
        }
        try {
            await assignLeadAdvogado(leadId, advogado.id, advogado.nome);
            toast.success(`Lead encaminhado para ${advogado.nome}`);
            setAssigningLeadId(null);
            setSelectedAdvogadoId('');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao encaminhar lead';
            toast.error(message);
        }
    };
    const handleSaveLead = async () => {
        if (!canManageLeads) {
            toast.error('Apenas gestores podem adicionar leads.');
            return;
        }
        if (!formData.nome || !formData.email || !formData.telefone) {
            alert('Por favor, preencha os campos obrigatorios: Nome, Email e Telefone');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                nome: formData.nome,
                email: formData.email,
                telefone: formData.telefone,
                empresa: formData.empresa || null,
                area: formData.area || null,
                origem: formData.origem || null,
                status: formData.status,
                heat: formData.heat,
                observacoes: formData.observacoes || null,
            };
            if (editingLeadId) {
                await updateLead(editingLeadId, payload);
                toast.success('Lead atualizado com sucesso.');
            }
            else {
                await createLead({
                    ...payload,
                    ultimo_contato: null,
                    responsavel: null,
                });
                toast.success('Lead criado com sucesso.');
            }
            resetLeadForm();
            setShowNewLeadForm(false);
        }
        catch (error) {
            alert('Erro ao salvar lead. Tente novamente.');
            console.error(error);
        }
        finally {
            setSaving(false);
        }
    };
    // Se está mostrando formulário de novo lead
    if (showNewLeadForm) {
        return (_jsx("div", { className: cn('min-h-screen pb-12', 'bg-[#fff6e9] text-[#1d1d1f]'), children: _jsxs("div", { className: "space-y-6", children: [_jsxs("header", { className: cn('relative overflow-hidden rounded-3xl border p-8 shadow-2xl', 'border-[#f3c988] bg-gradient-to-br from-[#ffedd5] via-[#fff3e0] to-[#ffe0b2]'), children: [_jsx("div", { className: cn('absolute inset-0 bg-no-repeat bg-right bg-[length:520px]', 'opacity-90'), style: { backgroundImage: `url(${heroLight})` } }), _jsx("div", { className: "relative z-10", children: _jsxs("div", { className: "flex flex-col items-start justify-between gap-4 md:flex-row md:items-center", children: [_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: cn('rounded-full p-2', 'bg-emerald-500/20'), children: _jsx(Zap, { className: cn('h-5 w-5', 'text-emerald-600') }) }), _jsx("p", { className: cn('text-xs font-bold uppercase tracking-[0.3em]', 'text-emerald-700'), children: isEditing ? 'Editar Lead' : 'Novo Lead' })] }), _jsx("h2", { className: cn('font-display text-4xl font-bold', 'text-text'), children: isEditing ? 'Atualizar Oportunidade' : 'Adicionar Oportunidade' }), _jsx("p", { className: cn('text-base', 'text-[#7a4a1a]'), children: isEditing ? 'Ajuste os dados do lead e salve as alterações' : 'Preencha os dados do novo lead para adicionar ao pipeline' })] }), _jsxs(Button, { onClick: () => {
                                                resetLeadForm();
                                                setShowNewLeadForm(false);
                                            }, variant: "outline", className: cn('h-14 rounded-full px-8 font-bold shadow-lg transition-all hover:scale-105', 'border-[#f3c988] hover:bg-[#fff3e0]'), children: [_jsx(ArrowLeft, { className: "mr-2 h-5 w-5" }), "Voltar"] })] }) })] }), _jsx(Card, { className: cn('border', 'border-border bg-surface/90'), children: _jsx(CardContent, { className: "p-8", children: _jsxs("form", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h3", { className: cn('mb-4 text-lg font-bold', 'text-text'), children: "Informa\u00E7\u00F5es do Lead" }), _jsxs("div", { className: "grid gap-6 md:grid-cols-2", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: cn('text-sm font-semibold', 'text-slate-700'), children: "Nome Completo *" }), _jsxs("div", { className: "relative", children: [_jsx(User, { className: cn('absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2', 'text-slate-400') }), _jsx("input", { type: "text", required: true, value: formData.nome, onChange: (e) => setFormData({ ...formData, nome: e.target.value }), className: cn('h-12 w-full rounded-xl border-2 pl-12 pr-4 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-4', 'border-[#f0d9b8] bg-white text-[#2a1400] placeholder:text-[#9a5b1e] focus:border-emerald-500 focus:ring-emerald-200'), placeholder: "Digite o nome completo" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: cn('text-sm font-semibold', 'text-slate-700'), children: "Email *" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: cn('absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2', 'text-slate-400') }), _jsx("input", { type: "email", required: true, value: formData.email, onChange: (e) => setFormData({ ...formData, email: e.target.value }), className: cn('h-12 w-full rounded-xl border-2 pl-12 pr-4 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-4', 'border-[#f0d9b8] bg-white text-[#2a1400] placeholder:text-[#9a5b1e] focus:border-emerald-500 focus:ring-emerald-200'), placeholder: "email@exemplo.com" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: cn('text-sm font-semibold', 'text-slate-700'), children: "Telefone *" }), _jsxs("div", { className: "relative", children: [_jsx(Phone, { className: cn('absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2', 'text-slate-400') }), _jsx("input", { type: "tel", required: true, value: formData.telefone, onChange: (e) => setFormData({ ...formData, telefone: e.target.value }), className: cn('h-12 w-full rounded-xl border-2 pl-12 pr-4 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-4', 'border-[#f0d9b8] bg-white text-[#2a1400] placeholder:text-[#9a5b1e] focus:border-emerald-500 focus:ring-emerald-200'), placeholder: "(00) 00000-0000" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: cn('text-sm font-semibold', 'text-slate-700'), children: "Empresa" }), _jsxs("div", { className: "relative", children: [_jsx(Briefcase, { className: cn('absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2', 'text-slate-400') }), _jsx("input", { type: "text", value: formData.empresa, onChange: (e) => setFormData({ ...formData, empresa: e.target.value }), className: cn('h-12 w-full rounded-xl border-2 pl-12 pr-4 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-4', 'border-[#f0d9b8] bg-white text-[#2a1400] placeholder:text-[#9a5b1e] focus:border-emerald-500 focus:ring-emerald-200'), placeholder: "Nome da empresa" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: cn('text-sm font-semibold', 'text-slate-700'), children: "Origem" }), _jsxs("div", { className: "relative", children: [_jsx(MapPin, { className: cn('absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2', 'text-slate-400') }), _jsx("input", { type: "text", value: formData.origem, onChange: (e) => setFormData({ ...formData, origem: e.target.value }), className: cn('h-12 w-full rounded-xl border-2 pl-12 pr-4 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-4', 'border-[#f0d9b8] bg-white text-[#2a1400] placeholder:text-[#9a5b1e] focus:border-emerald-500 focus:ring-emerald-200'), placeholder: "Ex: Website, Indica\u00E7\u00E3o, Redes Sociais" })] })] })] })] }), _jsxs("div", { children: [_jsx("h3", { className: cn('mb-4 text-lg font-bold', 'text-text'), children: "Detalhes da Oportunidade" }), _jsxs("div", { className: "grid gap-6 md:grid-cols-2", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: cn('text-sm font-semibold', 'text-slate-700'), children: "Status" }), _jsxs("select", { value: formData.status, onChange: (e) => setFormData({ ...formData, status: e.target.value }), className: cn('h-12 w-full rounded-xl border-2 px-4 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-4', 'border-[#f0d9b8] bg-white text-[#2a1400] focus:border-emerald-500 focus:ring-emerald-200'), children: [_jsx("option", { value: "novo", children: "Novo" }), _jsx("option", { value: "em_contato", children: "Em Contato" }), _jsx("option", { value: "qualificado", children: "Qualificado" }), _jsx("option", { value: "proposta", children: "Proposta" }), _jsx("option", { value: "ganho", children: "Ganho" }), _jsx("option", { value: "perdido", children: "Perdido" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: cn('text-sm font-semibold', 'text-slate-700'), children: "Temperatura" }), _jsxs("select", { value: formData.heat, onChange: (e) => setFormData({ ...formData, heat: e.target.value }), className: cn('h-12 w-full rounded-xl border-2 px-4 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-4', 'border-[#f0d9b8] bg-white text-[#2a1400] focus:border-emerald-500 focus:ring-emerald-200'), children: [_jsx("option", { value: "frio", children: "Frio" }), _jsx("option", { value: "morno", children: "Morno" }), _jsx("option", { value: "quente", children: "Quente" })] })] }), _jsxs("div", { className: "space-y-2 md:col-span-2", children: [_jsx("label", { className: cn('text-sm font-semibold', 'text-slate-700'), children: "Area de Interesse" }), _jsxs("div", { className: "relative", children: [_jsx(Briefcase, { className: cn('absolute left-4 top-4 h-5 w-5', 'text-slate-400') }), _jsx("input", { type: "text", value: formData.area, onChange: (e) => setFormData({ ...formData, area: e.target.value }), className: cn('h-12 w-full rounded-xl border-2 pl-12 pr-4 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-4', 'border-[#f0d9b8] bg-white text-[#2a1400] placeholder:text-[#9a5b1e] focus:border-emerald-500 focus:ring-emerald-200'), placeholder: "Ex: Consultoria jur\u00EDdica, Contrato empresarial" })] })] }), _jsxs("div", { className: "space-y-2 md:col-span-2", children: [_jsx("label", { className: cn('text-sm font-semibold', 'text-slate-700'), children: "Resumo / Observa\u00E7\u00F5es" }), _jsx("textarea", { value: formData.observacoes, onChange: (e) => setFormData({ ...formData, observacoes: e.target.value }), rows: 4, className: cn('w-full rounded-xl border-2 p-4 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-4', 'border-[#f0d9b8] bg-white text-[#2a1400] placeholder:text-[#9a5b1e] focus:border-emerald-500 focus:ring-emerald-200'), placeholder: "Descreva informa\u00E7\u00F5es adicionais sobre o lead..." })] })] })] }), _jsxs("div", { className: "flex flex-wrap gap-4 pt-4", children: [_jsxs(Button, { type: "button", onClick: handleSaveLead, disabled: saving, className: cn('h-14 flex-1 rounded-xl px-8 font-bold shadow-xl transition-all hover:scale-105 disabled:opacity-50', 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600'), children: [_jsx(Save, { className: "mr-2 h-5 w-5" }), saving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Salvar Lead'] }), _jsx(Button, { type: "button", onClick: () => {
                                                    resetLeadForm();
                                                    setShowNewLeadForm(false);
                                                }, variant: "outline", className: cn('h-14 rounded-xl border-2 px-8 font-bold transition-all hover:scale-105', 'border-[#f0d9b8] hover:bg-[#fff3e0]'), children: "Cancelar" })] })] }) }) })] }) }));
    }
    return (_jsxs("div", { className: cn('min-h-screen pb-12', 'bg-[#fff6e9] text-[#1d1d1f]'), children: [_jsxs("div", { className: "space-y-6", children: [_jsxs("header", { className: cn('relative overflow-hidden rounded-3xl border p-8 shadow-2xl', 'border-[#f3c988] bg-gradient-to-br from-[#ffedd5] via-[#fff3e0] to-[#ffe0b2]'), children: [_jsx("div", { className: cn('absolute inset-0 bg-no-repeat bg-right bg-[length:520px]', 'opacity-90'), style: { backgroundImage: `url(${heroLight})` } }), _jsx("div", { className: "relative z-10", children: _jsxs("div", { className: "flex flex-col items-start justify-between gap-4 md:flex-row md:items-center", children: [_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: cn('rounded-full p-2', 'bg-emerald-500/20'), children: _jsx(TrendingUp, { className: cn('h-5 w-5', 'text-emerald-600') }) }), _jsx("p", { className: cn('text-xs font-bold uppercase tracking-[0.3em]', 'text-emerald-700'), children: "Pipeline de Vendas" })] }), _jsx("h2", { className: cn('font-display text-4xl font-bold', 'text-text'), children: "Gest\u00E3o de Leads" }), _jsx("p", { className: cn('text-base', 'text-[#7a4a1a]'), children: "Acompanhe oportunidades e impulsione suas vendas" })] }), _jsxs(Button, { onClick: () => {
                                                if (!canManageLeads) {
                                                    toast.error('Apenas gestores podem adicionar leads.');
                                                    return;
                                                }
                                                resetLeadForm();
                                                setShowNewLeadForm(true);
                                            }, className: cn('group h-14 rounded-full px-8 font-bold shadow-xl transition-all hover:scale-105 hover:shadow-2xl', 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600'), disabled: !canManageLeads, children: [_jsx(Zap, { className: "mr-2 h-5 w-5 transition-transform group-hover:rotate-12" }), "Novo Lead", _jsx(ArrowUpRight, { className: "ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" })] })] }) })] }), _jsxs("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4", children: [_jsx(Card, { className: cn('group border transition-all duration-300 hover:scale-105 hover:shadow-xl', 'border-[#f0d9b8] bg-white hover:border-blue-500/30'), children: _jsx(CardContent, { className: "p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: cn('text-sm font-semibold', 'text-slate-600'), children: "Total Pipeline" }), _jsx("p", { className: "text-4xl font-bold tracking-tight", children: metrics.total }), _jsx("p", { className: cn('text-xs font-medium', 'text-slate-500'), children: "oportunidades ativas" })] }), _jsx("div", { className: cn('rounded-2xl p-4 transition-colors', 'bg-blue-50 group-hover:bg-blue-100'), children: _jsx(TrendingUp, { className: cn('h-8 w-8', 'text-blue-600') }) })] }) }) }), _jsx(Card, { className: cn('group border transition-all duration-300 hover:scale-105 hover:shadow-xl', 'border-[#f0d9b8] bg-white hover:border-red-500/30'), children: _jsx(CardContent, { className: "p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: cn('text-sm font-semibold', 'text-slate-600'), children: "Leads Quentes" }), _jsx("p", { className: "text-4xl font-bold tracking-tight text-red-500", children: metrics.quentes }), _jsx("p", { className: cn('text-xs font-medium uppercase', 'text-red-600'), children: "\uD83D\uDD25 A\u00E7\u00E3o Imediata" })] }), _jsx("div", { className: "rounded-2xl bg-gradient-to-br from-red-500/10 to-orange-500/10 p-4 group-hover:from-red-500/20 group-hover:to-orange-500/20", children: _jsx(Zap, { className: "h-8 w-8 text-red-500" }) })] }) }) }), _jsx(Card, { className: cn('group border transition-all duration-300 hover:scale-105 hover:shadow-xl', 'border-[#f0d9b8] bg-white hover:border-amber-500/30'), children: _jsx(CardContent, { className: "p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: cn('text-sm font-semibold', 'text-slate-600'), children: "Em Negocia\u00E7\u00E3o" }), _jsx("p", { className: "text-4xl font-bold tracking-tight text-amber-500", children: metrics.emNegociacao }), _jsx("p", { className: cn('text-xs font-medium', 'text-amber-600'), children: "\uD83D\uDCB0 propostas ativas" })] }), _jsx("div", { className: cn('rounded-2xl p-4 transition-colors', 'bg-amber-500/10 group-hover:bg-amber-500/20'), children: _jsx(Clock, { className: cn('h-8 w-8', 'text-amber-600') }) })] }) }) }), _jsx(Card, { className: cn('group border transition-all duration-300 hover:scale-105 hover:shadow-xl', 'border-[#f0d9b8] bg-white hover:border-emerald-500/30'), children: _jsx(CardContent, { className: "p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: cn('text-sm font-semibold', 'text-slate-600'), children: "Taxa de Convers\u00E3o" }), _jsxs("p", { className: "text-4xl font-bold tracking-tight text-emerald-500", children: [metrics.taxaConversao, "%"] }), _jsxs("p", { className: cn('text-xs font-medium', 'text-emerald-600'), children: ["\u2705 ", metrics.ganhos, " fechamentos"] })] }), _jsx("div", { className: cn('rounded-2xl p-4 transition-colors', 'bg-emerald-500/10 group-hover:bg-emerald-500/20'), children: _jsx(DollarSign, { className: cn('h-8 w-8', 'text-emerald-600') }) })] }) }) })] }), _jsx(Card, { className: cn('border', 'border-border bg-surface/90'), children: _jsxs(CardContent, { className: "p-6 space-y-5", children: [_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "flex flex-wrap items-center gap-3", children: tabs.map((tab) => (_jsx("button", { type: "button", onClick: () => setActiveTab(tab), className: cn('rounded-full border-2 px-6 py-2.5 text-sm font-bold transition-all', activeTab === tab
                                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-lg shadow-emerald-500/10'
                                                    : 'border-[#f0d9b8] bg-white text-[#7a4a1a] hover:border-emerald-400 hover:bg-[#fff3e0]'), children: tab }, tab))) }), _jsxs("div", { className: "flex flex-wrap gap-3", children: [_jsxs("div", { className: "relative flex-1 min-w-[300px]", children: [_jsx(Search, { className: cn('absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2', 'text-slate-500') }), _jsx("input", { className: cn('h-12 w-full rounded-xl border-2 pl-12 pr-4 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-4', 'border-[#f0d9b8] bg-white text-[#2a1400] placeholder:text-[#9a5b1e] focus:border-emerald-500 focus:ring-emerald-200'), placeholder: "Buscar por nome, telefone ou \u00E1rea...", value: query, onChange: (event) => setQuery(event.target.value) })] }), _jsxs("select", { className: cn('h-12 rounded-xl border-2 px-4 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-4', 'border-[#f0d9b8] bg-white text-[#2a1400] focus:border-emerald-500 focus:ring-emerald-200'), value: statusFilter, onChange: (event) => setStatusFilter(event.target.value), children: [_jsx("option", { value: "todos", children: "\uD83D\uDCCA Todos Status" }), filters.status.map((status) => (_jsx("option", { value: status, children: status }, status)))] }), _jsxs("select", { className: cn('h-12 rounded-xl border-2 px-4 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-4', 'border-[#f0d9b8] bg-white text-[#2a1400] focus:border-emerald-500 focus:ring-emerald-200'), value: heatFilter, onChange: (event) => setHeatFilter(event.target.value), children: [_jsx("option", { value: "todos", children: "\uD83C\uDF21\uFE0F Temperatura" }), filters.heat.map((heat) => (_jsx("option", { value: heat, children: heat }, heat)))] }), _jsxs(Button, { variant: "outline", onClick: resetFilters, className: cn('h-12 rounded-xl border-2 px-6 font-semibold', 'border-[#f0d9b8] hover:bg-[#fff3e0]'), children: [_jsx(Filter, { className: "mr-2 h-4 w-4" }), "Limpar"] })] })] }), _jsx(PageState, { status: pageState, emptyTitle: "Nenhum lead encontrado", emptyDescription: "Ajuste os filtros ou adicione novos leads ao pipeline.", children: _jsx("div", { className: "space-y-3", children: filteredLeads.map((lead) => {
                                            const initials = lead.name
                                                .split(' ')
                                                .map((part) => part[0])
                                                .slice(0, 2)
                                                .join('');
                                            return (_jsxs("div", { onClick: () => setSelectedLead(lead), className: cn('group cursor-pointer rounded-2xl border-2 p-5 transition-all hover:scale-[1.01] hover:shadow-xl', 'border-[#f0d9b8] bg-white hover:border-emerald-400 hover:bg-emerald-50/30'), children: [_jsxs("div", { className: "flex flex-wrap items-center gap-4", children: [_jsx("div", { className: cn('flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-bold shadow-lg transition-transform group-hover:scale-110', 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white'), children: initials }), _jsxs("div", { className: "flex-1 min-w-[200px]", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h3", { className: cn('text-lg font-bold', 'text-text'), children: lead.name }), _jsxs("span", { className: cn('inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-bold', heatPill(lead.heat)), children: [lead.heat === 'quente' ? '🔥' : lead.heat === 'morno' ? '⚡' : '❄️', lead.heat] })] }), _jsxs("div", { className: "mt-1 flex flex-wrap items-center gap-3 text-sm", children: [_jsxs("span", { className: cn('flex items-center gap-1', 'text-slate-600'), children: [_jsx(Mail, { className: "h-4 w-4" }), lead.email] }), _jsxs("span", { className: cn('flex items-center gap-1', 'text-slate-600'), children: [_jsx(Phone, { className: "h-4 w-4" }), formatPhone(lead.phone)] })] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "text-right", children: [_jsx("span", { className: cn('inline-flex rounded-xl border-2 px-4 py-1.5 text-sm font-bold capitalize', statusPill(lead.status)), children: lead.status }), _jsx("p", { className: cn('mt-1 text-xs font-medium', 'text-slate-500'), children: lead.area })] }), _jsxs("div", { className: "flex flex-col gap-2", children: [_jsx(Button, { size: "sm", className: cn('h-9 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 font-semibold shadow-md hover:from-emerald-500 hover:to-teal-500'), onClick: (e) => {
                                                                                    e.stopPropagation();
                                                                                    // Ação de contato
                                                                                }, children: _jsx(MessageSquare, { className: "h-4 w-4" }) }), canManageLeads && (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", title: "Encaminhar", className: cn('inline-flex h-9 w-9 items-center justify-center rounded-lg border text-xs font-semibold transition', 'border-[#f0d9b8] bg-white text-[#7a4a1a] hover:border-emerald-400 hover:text-emerald-600'), onClick: (e) => {
                                                                                            e.stopPropagation();
                                                                                            setAssigningLeadId((current) => (current === lead.id ? null : lead.id));
                                                                                            setSelectedAdvogadoId('');
                                                                                        }, children: _jsx(User, { className: "h-4 w-4" }) }), _jsx("button", { type: "button", className: cn('inline-flex h-9 w-9 items-center justify-center rounded-lg border text-xs font-semibold transition', 'border-[#f0d9b8] bg-white text-[#7a4a1a] hover:border-emerald-400 hover:text-emerald-600'), onClick: (e) => {
                                                                                            e.stopPropagation();
                                                                                            void handleEditLead(lead.id);
                                                                                        }, children: _jsx(Pencil, { className: "h-4 w-4" }) }), _jsx("button", { type: "button", className: cn('inline-flex h-9 w-9 items-center justify-center rounded-lg border text-xs font-semibold transition', 'border-[#f0d9b8] bg-white text-[#7a4a1a] hover:border-red-400 hover:text-red-600'), onClick: (e) => {
                                                                                            e.stopPropagation();
                                                                                            void handleDeleteLead(lead.id, lead.name);
                                                                                        }, children: _jsx(Trash2, { className: "h-4 w-4" }) })] }))] })] })] }), canManageLeads && assigningLeadId === lead.id && (_jsxs("div", { className: cn('mt-3 flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 text-xs', 'border-[#f0d9b8] bg-[#fff3e0]/70 text-[#7a4a1a]'), onClick: (event) => event.stopPropagation(), children: [_jsx("span", { className: "text-xs font-semibold", children: "Encaminhar para" }), _jsxs("select", { className: cn('h-9 rounded-lg border px-3 text-xs', 'border-[#f0d9b8] bg-white text-[#2a1400]'), value: selectedAdvogadoId, onChange: (event) => setSelectedAdvogadoId(event.target.value), children: [_jsx("option", { value: "", children: "Selecione um advogado" }), advogados.map((advogado) => (_jsx("option", { value: advogado.id, children: advogado.nome }, advogado.id)))] }), _jsx(Button, { size: "sm", className: "h-9 px-4 text-xs", onClick: (event) => {
                                                                    event.stopPropagation();
                                                                    void handleEncaminharLead(lead.id);
                                                                }, children: "Encaminhar" }), _jsx(Button, { variant: "ghost", size: "sm", className: cn('h-9 px-4 text-xs', 'text-[#7a4a1a] hover:text-[#2a1400]'), onClick: (event) => {
                                                                    event.stopPropagation();
                                                                    setAssigningLeadId(null);
                                                                    setSelectedAdvogadoId('');
                                                                }, children: "Cancelar" }), advogados.length === 0 && (_jsx("span", { className: "text-xs", children: "Nenhum advogado cadastrado" }))] })), lead.lastContactAt && (_jsxs("div", { className: cn('mt-3 flex items-center gap-2 border-t pt-3 text-xs font-medium', 'border-slate-200 text-slate-500'), children: [_jsx(Clock, { className: "h-3.5 w-3.5" }), "\u00DAltimo contato: ", formatDateTime(lead.lastContactAt), lead.owner && (_jsxs(_Fragment, { children: [_jsx("span", { className: "mx-2", children: "\u2022" }), "Respons\u00E1vel: ", lead.owner] }))] }))] }, lead.id));
                                        }) }) })] }) })] }), _jsx(LeadDrawer, { open: Boolean(selectedLead), lead: selectedLead, relatedCase: relatedCase, onClose: () => setSelectedLead(null) })] }));
};
