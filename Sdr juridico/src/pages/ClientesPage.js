import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { Search, Plus, Pencil, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import { PageState } from '@/components/PageState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import heroLight from '@/assets/hero-light.svg';
import { cn } from '@/utils/cn';
import { formatDateTime } from '@/utils/format';
import { useClientes } from '@/hooks/useClientes';
import { useAdvogados } from '@/hooks/useAdvogados';
import { useOrganization } from '@/hooks/useOrganization';
import { clientesService } from '@/services/clientesService';
const resolveStatus = (value) => {
    if (value === 'loading' || value === 'empty' || value === 'error') {
        return value;
    }
    return 'ready';
};
const statusPill = (status) => {
    if (status === 'inativo') {
        return 'border-[#E2E8F0] bg-[#EEF2F7] text-[#475569]';
    }
    if (status === 'em_risco') {
        return 'border-[#F5C2C2] bg-[#FFE1E1] text-[#B42318]';
    }
    return 'border-[#CFEBD8] bg-[#E8F7EE] text-[#167A3D]';
};
const healthPill = (health) => {
    if (health === 'critico') {
        return 'border-[#F5C2C2] bg-[#FFE1E1] text-[#B42318]';
    }
    if (health === 'atencao') {
        return 'border-[#F1D28A] bg-[#FFF1CC] text-[#8A5A00]';
    }
    return 'border-[#CFEBD8] bg-[#E8F7EE] text-[#167A3D]';
};
export const ClientesPage = () => {
    const { clientes, loading, error, createCliente, updateCliente, deleteCliente, assignClienteAdvogado } = useClientes();
    const { currentRole, isFartechAdmin, currentOrg } = useOrganization();
    const canManageClientes = isFartechAdmin || ['org_admin', 'gestor', 'admin'].includes(currentRole || '');
    const { advogados } = useAdvogados(currentOrg?.id || null, canManageClientes);
    const [params] = useSearchParams();
    const [query, setQuery] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('todos');
    const [healthFilter, setHealthFilter] = React.useState('todos');
    const [areaFilter, setAreaFilter] = React.useState('todos');
    const [ownerFilter, setOwnerFilter] = React.useState('todos');
    const [activeTab, setActiveTab] = React.useState('Todos');
    const [showForm, setShowForm] = React.useState(false);
    const [editingClienteId, setEditingClienteId] = React.useState(null);
    const [saving, setSaving] = React.useState(false);
    const [assigningClienteId, setAssigningClienteId] = React.useState(null);
    const [selectedClienteAdvogadoId, setSelectedClienteAdvogadoId] = React.useState('');
    const initialFormData = React.useMemo(() => ({
        nome: '',
        email: '',
        telefone: '',
        tipo: 'pf',
        documento: '',
        area_atuacao: '',
        status: 'ativo',
        health: 'ok',
        observacoes: '',
        endereco: '',
        cidade: '',
        estado: '',
        cep: '',
    }), []);
    const [formData, setFormData] = React.useState(initialFormData);
    const isEditing = Boolean(editingClienteId);
    const tabs = [
        'Todos',
        'Docs',
        'Agenda',
        'Comercial',
        'Juridico',
        'Automacao',
    ];
    const filters = React.useMemo(() => ({
        status: Array.from(new Set(clientes.map((cliente) => cliente.status))),
        health: Array.from(new Set(clientes.map((cliente) => cliente.health))),
        area: Array.from(new Set(clientes.map((cliente) => cliente.area))),
        owner: Array.from(new Set(clientes.map((cliente) => cliente.owner))),
    }), [clientes]);
    const filteredClientes = React.useMemo(() => {
        const term = query.trim().toLowerCase();
        return clientes.filter((cliente) => {
            const matchesQuery = !term || cliente.name.toLowerCase().includes(term);
            const matchesStatus = statusFilter === 'todos' || cliente.status === statusFilter;
            const matchesHealth = healthFilter === 'todos' || cliente.health === healthFilter;
            const matchesArea = areaFilter === 'todos' || cliente.area === areaFilter;
            const matchesOwner = ownerFilter === 'todos' || cliente.owner === ownerFilter;
            return (matchesQuery && matchesStatus && matchesHealth && matchesArea && matchesOwner);
        });
    }, [query, statusFilter, healthFilter, areaFilter, ownerFilter, clientes]);
    const forcedState = resolveStatus(params.get('state'));
    const baseState = loading
        ? 'loading'
        : error
            ? 'error'
            : filteredClientes.length === 0
                ? 'empty'
                : 'ready';
    const pageState = forcedState !== 'ready' ? forcedState : baseState;
    const resetFilters = () => {
        setQuery('');
        setStatusFilter('todos');
        setHealthFilter('todos');
        setAreaFilter('todos');
        setOwnerFilter('todos');
    };
    const resetClienteForm = () => {
        setFormData(initialFormData);
        setEditingClienteId(null);
    };
    const handleEditCliente = async (clienteId) => {
        if (!canManageClientes) {
            toast.error('Apenas gestores podem editar clientes.');
            return;
        }
        setSaving(true);
        try {
            const cliente = await clientesService.getCliente(clienteId);
            const tipo = cliente.cnpj ? 'pj' : 'pf';
            const documento = cliente.cnpj || cliente.cpf || '';
            setFormData({
                nome: cliente.nome,
                email: cliente.email || '',
                telefone: cliente.telefone || '',
                tipo,
                documento,
                area_atuacao: cliente.area_atuacao || '',
                status: cliente.status,
                health: cliente.health || 'ok',
                observacoes: cliente.observacoes || '',
                endereco: cliente.endereco || '',
                cidade: cliente.cidade || '',
                estado: cliente.estado || '',
                cep: cliente.cep || '',
            });
            setEditingClienteId(clienteId);
            setShowForm(true);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao carregar cliente';
            toast.error(message);
        }
        finally {
            setSaving(false);
        }
    };
    const handleDeleteCliente = async (clienteId, nome) => {
        if (!canManageClientes) {
            toast.error('Apenas gestores podem excluir clientes.');
            return;
        }
        const confirmed = window.confirm(`Excluir o cliente "${nome}"? Essa ação não pode ser desfeita.`);
        if (!confirmed)
            return;
        try {
            await deleteCliente(clienteId);
            toast.success(`Cliente excluído: ${nome}`);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao excluir cliente';
            toast.error(message);
        }
    };
    const handleEncaminharCliente = async (clienteId) => {
        if (!selectedClienteAdvogadoId) {
            toast.error('Selecione um advogado para encaminhar.');
            return;
        }
        const advogado = advogados.find((item) => item.id === selectedClienteAdvogadoId);
        if (!advogado) {
            toast.error('Advogado nao encontrado.');
            return;
        }
        try {
            await assignClienteAdvogado(clienteId, advogado.id);
            toast.success(`Cliente encaminhado para ${advogado.nome}`);
            setAssigningClienteId(null);
            setSelectedClienteAdvogadoId('');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao encaminhar cliente';
            toast.error(message);
        }
    };
    const handleSaveCliente = async () => {
        if (!canManageClientes) {
            toast.error('Apenas gestores podem adicionar clientes.');
            return;
        }
        if (!formData.nome) {
            toast.error('Informe o nome do cliente.');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                nome: formData.nome,
                email: formData.email || '',
                telefone: formData.telefone || null,
                empresa: null,
                cnpj: formData.tipo === 'pj' ? (formData.documento || null) : null,
                cpf: formData.tipo === 'pf' ? (formData.documento || null) : null,
                endereco: formData.endereco || null,
                cidade: formData.cidade || null,
                estado: formData.estado || null,
                cep: formData.cep || null,
                area_atuacao: formData.area_atuacao || null,
                responsavel: null,
                status: formData.status,
                health: formData.health || 'ok',
                observacoes: formData.observacoes || null,
            };
            if (editingClienteId) {
                await updateCliente(editingClienteId, payload);
                toast.success('Cliente atualizado com sucesso.');
            }
            else {
                await createCliente(payload);
                toast.success('Cliente criado com sucesso.');
            }
            resetClienteForm();
            setShowForm(false);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao salvar cliente';
            toast.error(message);
        }
        finally {
            setSaving(false);
        }
    };
    if (showForm) {
        return (_jsx("div", { className: cn('min-h-screen pb-12', 'bg-[#fff6e9] text-[#1d1d1f]'), children: _jsxs("div", { className: "space-y-6", children: [_jsxs("header", { className: cn('relative overflow-hidden rounded-3xl border p-8 shadow-2xl', 'border-[#f3c988] bg-gradient-to-br from-[#ffedd5] via-[#fff3e0] to-[#ffe0b2]'), children: [_jsx("div", { className: cn('absolute inset-0 bg-no-repeat bg-right bg-[length:520px]', 'opacity-90'), style: { backgroundImage: `url(${heroLight})` } }), _jsx("div", { className: "relative z-10", children: _jsxs("div", { className: "flex flex-col items-start justify-between gap-4 md:flex-row md:items-center", children: [_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: cn('rounded-full p-2', 'bg-emerald-500/20'), children: _jsx(Plus, { className: cn('h-5 w-5', 'text-emerald-600') }) }), _jsx("p", { className: cn('text-xs font-bold uppercase tracking-[0.3em]', 'text-emerald-700'), children: isEditing ? 'Editar cliente' : 'Novo cliente' })] }), _jsx("h2", { className: cn('font-display text-4xl font-bold', 'text-text'), children: isEditing ? 'Atualizar cadastro' : 'Cadastrar cliente' }), _jsx("p", { className: cn('text-base', 'text-[#7a4a1a]'), children: isEditing ? 'Atualize os dados e salve as alteracoes.' : 'Preencha os dados para criar um novo cliente.' })] }), _jsx(Button, { onClick: () => {
                                                resetClienteForm();
                                                setShowForm(false);
                                            }, variant: "outline", className: cn('h-14 rounded-full px-8 font-bold shadow-lg transition-all hover:scale-105', 'border-[#f3c988] hover:bg-[#fff3e0]'), children: "Voltar" })] }) })] }), _jsx(Card, { className: cn('border', 'border-border bg-surface/90'), children: _jsxs(CardContent, { className: "p-8 space-y-6", children: [_jsxs("div", { className: "grid gap-6 md:grid-cols-2", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: cn('text-sm font-semibold', 'text-slate-700'), children: "Nome *" }), _jsx("input", { value: formData.nome, onChange: (event) => setFormData({ ...formData, nome: event.target.value }), className: cn('h-12 w-full rounded-xl border-2 px-4 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-4', 'border-[#f0d9b8] bg-white text-[#2a1400] placeholder:text-[#9a5b1e] focus:border-emerald-500 focus:ring-emerald-200'), placeholder: "Nome do cliente" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: cn('text-sm font-semibold', 'text-slate-700'), children: "Email" }), _jsx("input", { type: "email", value: formData.email, onChange: (event) => setFormData({ ...formData, email: event.target.value }), className: cn('h-12 w-full rounded-xl border-2 px-4 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-4', 'border-[#f0d9b8] bg-white text-[#2a1400] placeholder:text-[#9a5b1e] focus:border-emerald-500 focus:ring-emerald-200'), placeholder: "email@exemplo.com" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: cn('text-sm font-semibold', 'text-slate-700'), children: "Telefone" }), _jsx("input", { value: formData.telefone, onChange: (event) => setFormData({ ...formData, telefone: event.target.value }), className: cn('h-12 w-full rounded-xl border-2 px-4 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-4', 'border-[#f0d9b8] bg-white text-[#2a1400] placeholder:text-[#9a5b1e] focus:border-emerald-500 focus:ring-emerald-200'), placeholder: "(00) 00000-0000" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: cn('text-sm font-semibold', 'text-slate-700'), children: "Tipo" }), _jsxs("select", { value: formData.tipo, onChange: (event) => setFormData({ ...formData, tipo: event.target.value }), className: cn('h-12 w-full rounded-xl border-2 px-4 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-4', 'border-[#f0d9b8] bg-white text-[#2a1400] focus:border-emerald-500 focus:ring-emerald-200'), children: [_jsx("option", { value: "pf", children: "Pessoa fisica" }), _jsx("option", { value: "pj", children: "Pessoa juridica" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: cn('text-sm font-semibold', 'text-slate-700'), children: formData.tipo === 'pj' ? 'CNPJ' : 'CPF' }), _jsx("input", { value: formData.documento, onChange: (event) => setFormData({ ...formData, documento: event.target.value }), className: cn('h-12 w-full rounded-xl border-2 px-4 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-4', 'border-[#f0d9b8] bg-white text-[#2a1400] placeholder:text-[#9a5b1e] focus:border-emerald-500 focus:ring-emerald-200'), placeholder: formData.tipo === 'pj' ? '00.000.000/0000-00' : '000.000.000-00' })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: cn('text-sm font-semibold', 'text-slate-700'), children: "Area de atuacao" }), _jsx("input", { value: formData.area_atuacao, onChange: (event) => setFormData({ ...formData, area_atuacao: event.target.value }), className: cn('h-12 w-full rounded-xl border-2 px-4 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-4', 'border-[#f0d9b8] bg-white text-[#2a1400] placeholder:text-[#9a5b1e] focus:border-emerald-500 focus:ring-emerald-200'), placeholder: "Ex: Empresarial, Trabalhista" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: cn('text-sm font-semibold', 'text-slate-700'), children: "Status" }), _jsxs("select", { value: formData.status, onChange: (event) => setFormData({ ...formData, status: event.target.value }), className: cn('h-12 w-full rounded-xl border-2 px-4 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-4', 'border-[#f0d9b8] bg-white text-[#2a1400] focus:border-emerald-500 focus:ring-emerald-200'), children: [_jsx("option", { value: "ativo", children: "Ativo" }), _jsx("option", { value: "em_risco", children: "Em risco" }), _jsx("option", { value: "inativo", children: "Inativo" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: cn('text-sm font-semibold', 'text-slate-700'), children: "Saude" }), _jsxs("select", { value: formData.health || 'ok', onChange: (event) => setFormData({ ...formData, health: event.target.value }), className: cn('h-12 w-full rounded-xl border-2 px-4 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-4', 'border-[#f0d9b8] bg-white text-[#2a1400] focus:border-emerald-500 focus:ring-emerald-200'), children: [_jsx("option", { value: "ok", children: "Ok" }), _jsx("option", { value: "atencao", children: "Atencao" }), _jsx("option", { value: "critico", children: "Critico" })] })] }), _jsxs("div", { className: "space-y-2 md:col-span-2", children: [_jsx("label", { className: cn('text-sm font-semibold', 'text-slate-700'), children: "Endereco" }), _jsx("input", { value: formData.endereco, onChange: (event) => setFormData({ ...formData, endereco: event.target.value }), className: cn('h-12 w-full rounded-xl border-2 px-4 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-4', 'border-[#f0d9b8] bg-white text-[#2a1400] placeholder:text-[#9a5b1e] focus:border-emerald-500 focus:ring-emerald-200'), placeholder: "Rua, numero, bairro" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: cn('text-sm font-semibold', 'text-slate-700'), children: "Cidade" }), _jsx("input", { value: formData.cidade, onChange: (event) => setFormData({ ...formData, cidade: event.target.value }), className: cn('h-12 w-full rounded-xl border-2 px-4 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-4', 'border-[#f0d9b8] bg-white text-[#2a1400] placeholder:text-[#9a5b1e] focus:border-emerald-500 focus:ring-emerald-200'), placeholder: "Cidade" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: cn('text-sm font-semibold', 'text-slate-700'), children: "Estado" }), _jsx("input", { value: formData.estado, onChange: (event) => setFormData({ ...formData, estado: event.target.value }), className: cn('h-12 w-full rounded-xl border-2 px-4 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-4', 'border-[#f0d9b8] bg-white text-[#2a1400] placeholder:text-[#9a5b1e] focus:border-emerald-500 focus:ring-emerald-200'), placeholder: "UF" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: cn('text-sm font-semibold', 'text-slate-700'), children: "CEP" }), _jsx("input", { value: formData.cep, onChange: (event) => setFormData({ ...formData, cep: event.target.value }), className: cn('h-12 w-full rounded-xl border-2 px-4 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-4', 'border-[#f0d9b8] bg-white text-[#2a1400] placeholder:text-[#9a5b1e] focus:border-emerald-500 focus:ring-emerald-200'), placeholder: "00000-000" })] }), _jsxs("div", { className: "space-y-2 md:col-span-2", children: [_jsx("label", { className: cn('text-sm font-semibold', 'text-slate-700'), children: "Observacoes" }), _jsx("textarea", { value: formData.observacoes, onChange: (event) => setFormData({ ...formData, observacoes: event.target.value }), className: cn('min-h-[120px] w-full rounded-xl border-2 px-4 py-3 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-4', 'border-[#f0d9b8] bg-white text-[#2a1400] placeholder:text-[#9a5b1e] focus:border-emerald-500 focus:ring-emerald-200'), placeholder: "Observacoes adicionais" })] })] }), _jsxs("div", { className: "flex flex-wrap items-center justify-end gap-3", children: [_jsx(Button, { variant: "outline", onClick: () => {
                                                resetClienteForm();
                                                setShowForm(false);
                                            }, className: cn('h-12 rounded-xl border-2 px-6 text-sm font-semibold', 'border-[#f0d9b8] hover:bg-[#fff3e0]'), children: "Cancelar" }), _jsx(Button, { onClick: handleSaveCliente, className: cn('h-12 rounded-xl px-8 text-sm font-semibold shadow-lg', 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600'), disabled: saving, children: saving ? 'Salvando...' : isEditing ? 'Salvar alteracoes' : 'Salvar cliente' })] })] }) })] }) }));
    }
    return (_jsx("div", { className: cn('min-h-screen pb-12', 'bg-[#fff6e9] text-[#1d1d1f]'), children: _jsxs("div", { className: "space-y-5", children: [_jsxs("header", { className: cn('relative overflow-hidden rounded-3xl border p-6 shadow-[0_28px_60px_-48px_rgba(199,98,0,0.8)]', 'border-[#f3c988] bg-gradient-to-br from-[#ffedd5] via-[#fff3e0] to-[#f7caaa]'), children: [_jsx("div", { className: cn('absolute inset-0 bg-no-repeat bg-right bg-[length:520px]', 'opacity-90'), style: { backgroundImage: `url(${heroLight})` } }), _jsxs("div", { className: "relative z-10 space-y-2", children: [_jsx("p", { className: cn('text-xs uppercase tracking-[0.3em]', 'text-text-muted'), children: "Clientes" }), _jsx("h2", { className: cn('font-display text-2xl', 'text-text'), children: "Carteira ativa" }), _jsx("p", { className: cn('text-sm', 'text-text-muted'), children: "Carteira ativa com indicadores de risco e status." })] })] }), _jsxs(Card, { className: cn('border', 'border-border bg-surface/90'), children: [_jsx(CardHeader, { className: "space-y-2", children: _jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsx(CardTitle, { children: "Registros ativos" }), _jsxs("div", { className: "mt-2 flex flex-wrap gap-3 text-xs text-text-subtle", children: [_jsxs("span", { children: ["Total: ", clientes.length] }), _jsxs("span", { children: ["Exibindo: ", filteredClientes.length] })] })] }), _jsxs(Button, { variant: "outline", size: "sm", className: "h-10 rounded-full px-4", onClick: () => {
                                            if (!canManageClientes) {
                                                toast.error('Apenas gestores podem adicionar clientes.');
                                                return;
                                            }
                                            resetClienteForm();
                                            setShowForm(true);
                                        }, disabled: !canManageClientes, children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "Novo cliente"] })] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsx("div", { className: "flex flex-wrap gap-2", children: tabs.map((tab) => (_jsx("button", { type: "button", onClick: () => setActiveTab(tab), className: cn('rounded-full border px-4 py-1.5 text-xs font-medium transition', activeTab === tab
                                            ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-600'
                                            : 'border-[#f0d9b8] bg-white text-[#7a4a1a] hover:bg-[#fff3e0] hover:text-[#2a1400]'), children: tab }, tab))) }), _jsxs("div", { className: "grid gap-3 lg:grid-cols-[2fr_repeat(4,1fr)_auto]", children: [_jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" }), _jsx("input", { className: cn('h-11 w-full rounded-full border pl-11 pr-4 text-sm shadow-soft focus:outline-none focus:ring-2', 'border-[#f0d9b8] bg-[#fff3e0] text-[#2a1400] placeholder:text-[#9a5b1e] focus:border-emerald-400 focus:ring-emerald-200'), placeholder: "Buscar cliente", value: query, onChange: (event) => setQuery(event.target.value) })] }), _jsxs("select", { className: cn('h-11 rounded-full border px-3 text-sm shadow-soft focus:outline-none focus:ring-2', 'border-[#f0d9b8] bg-white text-[#2a1400] focus:border-emerald-400 focus:ring-emerald-200'), value: statusFilter, onChange: (event) => setStatusFilter(event.target.value), children: [_jsx("option", { value: "todos", children: "Status" }), filters.status.map((status) => (_jsx("option", { value: status, children: status }, status)))] }), _jsxs("select", { className: cn('h-11 rounded-full border px-3 text-sm shadow-soft focus:outline-none focus:ring-2', 'border-[#f0d9b8] bg-white text-[#2a1400] focus:border-emerald-400 focus:ring-emerald-200'), value: healthFilter, onChange: (event) => setHealthFilter(event.target.value), children: [_jsx("option", { value: "todos", children: "Saude" }), filters.health.map((health) => (_jsx("option", { value: health, children: health }, health)))] }), _jsxs("select", { className: cn('h-11 rounded-full border px-3 text-sm shadow-soft focus:outline-none focus:ring-2', 'border-[#f0d9b8] bg-white text-[#2a1400] focus:border-emerald-400 focus:ring-emerald-200'), value: areaFilter, onChange: (event) => setAreaFilter(event.target.value), children: [_jsx("option", { value: "todos", children: "Area" }), filters.area.map((area) => (_jsx("option", { value: area, children: area }, area)))] }), _jsxs("select", { className: cn('h-11 rounded-full border px-3 text-sm shadow-soft focus:outline-none focus:ring-2', 'border-[#f0d9b8] bg-white text-[#2a1400] focus:border-emerald-400 focus:ring-emerald-200'), value: ownerFilter, onChange: (event) => setOwnerFilter(event.target.value), children: [_jsx("option", { value: "todos", children: "Responsavel" }), filters.owner.map((owner) => (_jsx("option", { value: owner, children: owner }, owner)))] }), _jsx("button", { type: "button", className: cn('h-11 text-xs', 'text-[#7a4a1a] hover:text-[#2a1400]'), onClick: resetFilters, children: "Limpar filtros" })] }), _jsx(PageState, { status: pageState, emptyTitle: "Nenhum cliente encontrado", emptyDescription: "Ajuste os filtros para localizar a carteira.", children: _jsx("div", { className: cn('overflow-hidden rounded-2xl border shadow-soft', 'border-border bg-white'), children: _jsxs("table", { className: "w-full border-collapse text-left text-sm", children: [_jsx("thead", { className: cn('text-[11px] uppercase tracking-[0.22em]', 'bg-[#fff3e0] text-[#9a5b1e]'), children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3" }), _jsx("th", { className: "px-4 py-3", children: "Cliente" }), _jsx("th", { className: "px-4 py-3", children: "Status" }), _jsx("th", { className: "px-4 py-3", children: "Saude" }), _jsx("th", { className: "px-4 py-3", children: "Casos" }), _jsx("th", { className: "px-4 py-3", children: "Responsavel" }), _jsx("th", { className: "px-4 py-3 text-right", children: "Atualizacao" }), _jsx("th", { className: "px-4 py-3 text-right", children: "Acoes" })] }) }), _jsx("tbody", { children: filteredClientes.map((cliente) => {
                                                        const initials = cliente.name
                                                            .split(' ')
                                                            .map((part) => part[0])
                                                            .slice(0, 2)
                                                            .join('');
                                                        return (_jsxs(React.Fragment, { children: [_jsxs("tr", { className: cn('border-t', 'border-[#f0d9b8] hover:bg-[#fff3e0]/60'), children: [_jsx("td", { className: "px-4 py-3", children: _jsx("input", { type: "checkbox", className: "h-4 w-4 rounded border border-border bg-white text-primary" }) }), _jsx("td", { className: "px-4 py-3", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary", children: initials }), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-semibold text-text", children: cliente.name }), _jsx("div", { className: "text-xs text-text-subtle", children: cliente.area })] })] }) }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: cn('inline-flex rounded-full border px-3 py-1 text-xs font-medium capitalize', statusPill(cliente.status)), children: cliente.status }) }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: cn('inline-flex rounded-full border px-3 py-1 text-xs font-medium capitalize', healthPill(cliente.health)), children: cliente.health }) }), _jsx("td", { className: "px-4 py-3 text-sm text-text", children: cliente.caseCount }), _jsx("td", { className: "px-4 py-3 text-sm text-text", children: cliente.owner }), _jsx("td", { className: "px-4 py-3 text-right text-xs text-text-subtle", children: formatDateTime(cliente.lastUpdate) }), _jsx("td", { className: "px-4 py-3 text-right", children: canManageClientes ? (_jsxs("div", { className: "flex items-center justify-end gap-2", children: [_jsx("button", { type: "button", title: "Encaminhar", className: cn('inline-flex h-8 w-8 items-center justify-center rounded-full border', 'border-[#f0d9b8] bg-white text-[#7a4a1a] hover:text-emerald-600'), onClick: () => {
                                                                                            setAssigningClienteId((current) => (current === cliente.id ? null : cliente.id));
                                                                                            setSelectedClienteAdvogadoId('');
                                                                                        }, children: _jsx(UserPlus, { className: "h-4 w-4" }) }), _jsx("button", { type: "button", className: cn('inline-flex h-8 w-8 items-center justify-center rounded-full border', 'border-[#f0d9b8] bg-white text-[#7a4a1a] hover:text-emerald-600'), onClick: () => handleEditCliente(cliente.id), children: _jsx(Pencil, { className: "h-4 w-4" }) }), _jsx("button", { type: "button", className: cn('inline-flex h-8 w-8 items-center justify-center rounded-full border', 'border-[#f0d9b8] bg-white text-[#7a4a1a] hover:text-red-600'), onClick: () => handleDeleteCliente(cliente.id, cliente.name), children: _jsx(Trash2, { className: "h-4 w-4" }) })] })) : (_jsx("span", { className: "text-xs text-text-subtle", children: "Sem permissao" })) })] }), canManageClientes && assigningClienteId === cliente.id && (_jsx("tr", { className: cn('border-t', 'border-[#f0d9b8] bg-[#fff3e0]/60'), children: _jsx("td", { colSpan: 8, className: "px-4 py-3", children: _jsxs("div", { className: cn('flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 text-xs', 'border-[#f0d9b8] bg-white text-[#7a4a1a]'), children: [_jsx("span", { className: "text-xs font-semibold", children: "Encaminhar para" }), _jsxs("select", { className: cn('h-9 rounded-lg border px-3 text-xs', 'border-[#f0d9b8] bg-white text-[#2a1400]'), value: selectedClienteAdvogadoId, onChange: (event) => setSelectedClienteAdvogadoId(event.target.value), children: [_jsx("option", { value: "", children: "Selecione um advogado" }), advogados.map((advogado) => (_jsx("option", { value: advogado.id, children: advogado.nome }, advogado.id)))] }), _jsx(Button, { size: "sm", className: "h-9 px-4 text-xs", onClick: () => {
                                                                                        void handleEncaminharCliente(cliente.id);
                                                                                    }, children: "Encaminhar" }), _jsx(Button, { variant: "ghost", size: "sm", className: cn('h-9 px-4 text-xs', 'text-[#7a4a1a] hover:text-[#2a1400]'), onClick: () => {
                                                                                        setAssigningClienteId(null);
                                                                                        setSelectedClienteAdvogadoId('');
                                                                                    }, children: "Cancelar" }), advogados.length === 0 && (_jsx("span", { className: "text-xs", children: "Nenhum advogado cadastrado" }))] }) }) }))] }, cliente.id));
                                                    }) })] }) }) })] })] })] }) }));
};
