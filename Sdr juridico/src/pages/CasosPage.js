import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from 'react';
import { ChevronDown, ChevronLeft, Filter, Search, X, Plus, Pencil, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import heroLight from '@/assets/hero-light.svg';
import { PageState } from '@/components/PageState';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/utils/cn';
import { useCasos } from '@/hooks/useCasos';
import { useAdvogados } from '@/hooks/useAdvogados';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useOrganization } from '@/hooks/useOrganization';
import { useClientes } from '@/hooks/useClientes';
import { casosService } from '@/services/casosService';
const resolveStatus = (value) => {
    if (value === 'loading' || value === 'empty' || value === 'error') {
        return value;
    }
    return 'ready';
};
const statusLabel = (status) => {
    if (status === 'suspenso')
        return 'Suspenso';
    if (status === 'encerrado')
        return 'Encerrado';
    return 'Em andamento';
};
const slaTone = (sla) => {
    if (sla === 'critico')
        return 'bg-[#F26C6C]';
    if (sla === 'atencao')
        return 'bg-[#F5B361]';
    return 'bg-[#6BC5B3]';
};
const slaPercentByRisk = (sla) => {
    if (sla === 'critico')
        return 85;
    if (sla === 'atencao')
        return 55;
    return 25;
};
const areaPill = (area) => {
    if (area === 'Trabalhista') {
        return 'bg-[#E8F0FF] text-[#2F6BFF] border-[#D7E2FF]';
    }
    if (area === 'Previdenciario') {
        return 'bg-[#E6F3FF] text-[#3371D8] border-[#D6E8FF]';
    }
    if (area === 'Empresarial') {
        return 'bg-[#E8F7EF] text-[#2F7A5C] border-[#D2F0E2]';
    }
    return 'bg-[#F1F3F8] text-[#6B7280] border-[#E4E8F0]';
};
const heatPill = (heat) => {
    if (heat === 'quente') {
        return 'bg-[#FDE2E2] text-[#D14949] border-[#F7CFCF]';
    }
    if (heat === 'morno') {
        return 'bg-[#FFE9C2] text-[#B88220] border-[#F5D8A0]';
    }
    return 'bg-[#E5EEFF] text-[#4C6FFF] border-[#D6E2FF]';
};
export const CasosPage = () => {
    const { casos, loading, error, createCaso, updateCaso, deleteCaso, assignCasoAdvogado } = useCasos();
    const { clientes } = useClientes();
    const { displayName } = useCurrentUser();
    const { currentRole, isFartechAdmin, currentOrg } = useOrganization();
    const canManageCasos = isFartechAdmin || ['org_admin', 'gestor', 'admin'].includes(currentRole || '');
    const { advogados } = useAdvogados(currentOrg?.id || null, canManageCasos);
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const status = resolveStatus(params.get('state'));
    const [query, setQuery] = React.useState('');
    const [areaFilter, setAreaFilter] = React.useState('todos');
    const [heatFilter, setHeatFilter] = React.useState('todos');
    const [showForm, setShowForm] = React.useState(false);
    const [editingCasoId, setEditingCasoId] = React.useState(null);
    const [saving, setSaving] = React.useState(false);
    const [assigningCasoId, setAssigningCasoId] = React.useState(null);
    const [selectedCasoAdvogadoId, setSelectedCasoAdvogadoId] = React.useState('');
    const initialFormData = React.useMemo(() => ({
        titulo: '',
        descricao: '',
        clienteId: '',
        area: '',
        status: 'ativo',
        prioridade: 'media',
        stage: 'triagem',
        valor: '',
    }), []);
    const [formData, setFormData] = React.useState(initialFormData);
    const isEditing = Boolean(editingCasoId);
    const filtered = React.useMemo(() => {
        const term = query.trim().toLowerCase();
        return casos.filter((caso) => {
            const matchesQuery = !term ||
                caso.cliente.toLowerCase().includes(term) ||
                caso.area.toLowerCase().includes(term);
            const matchesArea = areaFilter === 'todos' || caso.area === areaFilter;
            const matchesHeat = heatFilter === 'todos' || caso.heat === heatFilter;
            return matchesQuery && matchesArea && matchesHeat;
        });
    }, [query, areaFilter, heatFilter, casos]);
    const chips = [
        { id: 'chip-1', label: 'Trabalhista', tone: 'bg-[#DFF1F0] text-[#2F7A5C]' },
        { id: 'chip-2', label: 'Quente', tone: 'bg-[#FDE2E2] text-[#D14949]' },
        { id: 'chip-3', label: 'Empresarial', tone: 'bg-[#FFE9C2] text-[#B88220]' },
        { id: 'chip-4', label: 'e-mails', tone: 'bg-[#E5EEFF] text-[#4C6FFF]' },
    ];
    const resetCasoForm = () => {
        setFormData(initialFormData);
        setEditingCasoId(null);
    };
    const handleEditCaso = async (casoId) => {
        if (!canManageCasos) {
            toast.error('Apenas gestores podem editar casos.');
            return;
        }
        setSaving(true);
        try {
            const caso = await casosService.getCaso(casoId);
            setFormData({
                titulo: caso.titulo,
                descricao: caso.descricao || '',
                clienteId: caso.cliente_id || '',
                area: caso.area || '',
                status: caso.status,
                prioridade: caso.prioridade,
                stage: caso.stage || 'triagem',
                valor: caso.valor ? String(caso.valor) : '',
            });
            setEditingCasoId(casoId);
            setShowForm(true);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao carregar caso';
            toast.error(message);
        }
        finally {
            setSaving(false);
        }
    };
    const handleDeleteCaso = async (casoId, titulo) => {
        if (!canManageCasos) {
            toast.error('Apenas gestores podem excluir casos.');
            return;
        }
        const confirmed = window.confirm(`Excluir o caso "${titulo}"? Essa ação não pode ser desfeita.`);
        if (!confirmed)
            return;
        try {
            await deleteCaso(casoId);
            toast.success(`Caso excluído: ${titulo}`);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao excluir caso';
            toast.error(message);
        }
    };
    const handleEncaminharCaso = async (casoId) => {
        if (!selectedCasoAdvogadoId) {
            toast.error('Selecione um advogado para encaminhar.');
            return;
        }
        const advogado = advogados.find((item) => item.id === selectedCasoAdvogadoId);
        if (!advogado) {
            toast.error('Advogado nao encontrado.');
            return;
        }
        try {
            await assignCasoAdvogado(casoId, advogado.id);
            toast.success(`Caso encaminhado para ${advogado.nome}`);
            setAssigningCasoId(null);
            setSelectedCasoAdvogadoId('');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao encaminhar caso';
            toast.error(message);
        }
    };
    const handleSaveCaso = async () => {
        if (!canManageCasos) {
            toast.error('Apenas gestores podem adicionar casos.');
            return;
        }
        if (!formData.titulo) {
            toast.error('Informe o titulo do caso.');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                titulo: formData.titulo,
                descricao: formData.descricao || null,
                cliente_id: formData.clienteId || null,
                lead_id: null,
                area: formData.area || 'Geral',
                status: formData.status,
                prioridade: formData.prioridade,
                heat: null,
                stage: formData.stage || null,
                valor: formData.valor ? Number(formData.valor) : null,
                sla_risk: null,
                tags: null,
                responsavel: null,
                data_abertura: null,
                data_encerramento: null,
            };
            if (editingCasoId) {
                await updateCaso(editingCasoId, payload);
                toast.success('Caso atualizado com sucesso.');
            }
            else {
                await createCaso(payload);
                toast.success('Caso criado com sucesso.');
            }
            resetCasoForm();
            setShowForm(false);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao salvar caso';
            toast.error(message);
        }
        finally {
            setSaving(false);
        }
    };
    const baseState = loading
        ? 'loading'
        : error
            ? 'error'
            : filtered.length
                ? 'ready'
                : 'empty';
    const pageState = status !== 'ready' ? status : baseState;
    if (showForm) {
        return (_jsx("div", { className: cn('min-h-screen pb-12', 'bg-[#fff6e9] text-[#1d1d1f]'), children: _jsxs("div", { className: "space-y-6", children: [_jsxs("header", { className: cn('relative overflow-hidden rounded-3xl border p-8 shadow-2xl', 'border-[#f3c988] bg-gradient-to-br from-[#ffedd5] via-[#fff3e0] to-[#ffe0b2]'), children: [_jsx("div", { className: cn('absolute inset-0 bg-no-repeat bg-right bg-[length:520px]', 'opacity-90'), style: { backgroundImage: `url(${heroLight})` } }), _jsx("div", { className: "relative z-10", children: _jsxs("div", { className: "flex flex-col items-start justify-between gap-4 md:flex-row md:items-center", children: [_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: cn('rounded-full p-2', 'bg-emerald-500/20'), children: _jsx(Plus, { className: cn('h-5 w-5', 'text-emerald-600') }) }), _jsx("p", { className: cn('text-xs font-bold uppercase tracking-[0.3em]', 'text-emerald-700'), children: isEditing ? 'Editar caso' : 'Novo caso' })] }), _jsx("h2", { className: cn('font-display text-4xl font-bold', 'text-text'), children: isEditing ? 'Atualizar caso' : 'Cadastrar caso' }), _jsx("p", { className: cn('text-base', 'text-[#7a4a1a]'), children: isEditing ? 'Atualize os dados e salve as alteracoes.' : 'Preencha os dados para criar um novo caso.' })] }), _jsx(Button, { onClick: () => {
                                                resetCasoForm();
                                                setShowForm(false);
                                            }, variant: "outline", className: cn('h-14 rounded-full px-8 font-bold shadow-lg transition-all hover:scale-105', 'border-[#f3c988] hover:bg-[#fff3e0]'), children: "Voltar" })] }) })] }), _jsx(Card, { className: cn('border', 'border-border bg-surface/90'), children: _jsxs(CardContent, { className: "p-8 space-y-6", children: [_jsxs("div", { className: "grid gap-6 md:grid-cols-2", children: [_jsxs("div", { className: "space-y-2 md:col-span-2", children: [_jsx("label", { className: cn('text-sm font-semibold', 'text-slate-700'), children: "Titulo *" }), _jsx("input", { value: formData.titulo, onChange: (event) => setFormData({ ...formData, titulo: event.target.value }), className: cn('h-12 w-full rounded-xl border-2 px-4 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-4', 'border-[#f0d9b8] bg-white text-[#2a1400] placeholder:text-[#9a5b1e] focus:border-emerald-500 focus:ring-emerald-200'), placeholder: "Titulo do caso" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: cn('text-sm font-semibold', 'text-slate-700'), children: "Cliente" }), _jsxs("select", { value: formData.clienteId, onChange: (event) => setFormData({ ...formData, clienteId: event.target.value }), className: cn('h-12 w-full rounded-xl border-2 px-4 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-4', 'border-[#f0d9b8] bg-white text-[#2a1400] focus:border-emerald-500 focus:ring-emerald-200'), children: [_jsx("option", { value: "", children: "Sem cliente" }), clientes.map((cliente) => (_jsx("option", { value: cliente.id, children: cliente.name }, cliente.id)))] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: cn('text-sm font-semibold', 'text-slate-700'), children: "Area" }), _jsx("input", { value: formData.area, onChange: (event) => setFormData({ ...formData, area: event.target.value }), className: cn('h-12 w-full rounded-xl border-2 px-4 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-4', 'border-[#f0d9b8] bg-white text-[#2a1400] placeholder:text-[#9a5b1e] focus:border-emerald-500 focus:ring-emerald-200'), placeholder: "Ex: Trabalhista" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: cn('text-sm font-semibold', 'text-slate-700'), children: "Status" }), _jsxs("select", { value: formData.status, onChange: (event) => setFormData({ ...formData, status: event.target.value }), className: cn('h-12 w-full rounded-xl border-2 px-4 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-4', 'border-[#f0d9b8] bg-white text-[#2a1400] focus:border-emerald-500 focus:ring-emerald-200'), children: [_jsx("option", { value: "ativo", children: "Ativo" }), _jsx("option", { value: "suspenso", children: "Suspenso" }), _jsx("option", { value: "encerrado", children: "Encerrado" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: cn('text-sm font-semibold', 'text-slate-700'), children: "Prioridade" }), _jsxs("select", { value: formData.prioridade, onChange: (event) => setFormData({ ...formData, prioridade: event.target.value }), className: cn('h-12 w-full rounded-xl border-2 px-4 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-4', 'border-[#f0d9b8] bg-white text-[#2a1400] focus:border-emerald-500 focus:ring-emerald-200'), children: [_jsx("option", { value: "baixa", children: "Baixa" }), _jsx("option", { value: "media", children: "Media" }), _jsx("option", { value: "alta", children: "Alta" }), _jsx("option", { value: "critica", children: "Critica" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: cn('text-sm font-semibold', 'text-slate-700'), children: "Etapa" }), _jsxs("select", { value: formData.stage || '', onChange: (event) => setFormData({ ...formData, stage: event.target.value }), className: cn('h-12 w-full rounded-xl border-2 px-4 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-4', 'border-[#f0d9b8] bg-white text-[#2a1400] focus:border-emerald-500 focus:ring-emerald-200'), children: [_jsx("option", { value: "triagem", children: "Triagem" }), _jsx("option", { value: "negociacao", children: "Negociacao" }), _jsx("option", { value: "em_andamento", children: "Em andamento" }), _jsx("option", { value: "conclusao", children: "Conclusao" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: cn('text-sm font-semibold', 'text-slate-700'), children: "Valor estimado" }), _jsx("input", { type: "number", value: formData.valor, onChange: (event) => setFormData({ ...formData, valor: event.target.value }), className: cn('h-12 w-full rounded-xl border-2 px-4 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-4', 'border-[#f0d9b8] bg-white text-[#2a1400] placeholder:text-[#9a5b1e] focus:border-emerald-500 focus:ring-emerald-200'), placeholder: "0" })] }), _jsxs("div", { className: "space-y-2 md:col-span-2", children: [_jsx("label", { className: cn('text-sm font-semibold', 'text-slate-700'), children: "Descricao" }), _jsx("textarea", { value: formData.descricao, onChange: (event) => setFormData({ ...formData, descricao: event.target.value }), className: cn('min-h-[120px] w-full rounded-xl border-2 px-4 py-3 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-4', 'border-[#f0d9b8] bg-white text-[#2a1400] placeholder:text-[#9a5b1e] focus:border-emerald-500 focus:ring-emerald-200'), placeholder: "Descricao do caso" })] })] }), _jsxs("div", { className: "flex flex-wrap items-center justify-end gap-3", children: [_jsx(Button, { variant: "outline", onClick: () => {
                                                resetCasoForm();
                                                setShowForm(false);
                                            }, className: cn('h-12 rounded-xl border-2 px-6 text-sm font-semibold', 'border-[#f0d9b8] hover:bg-[#fff3e0]'), children: "Cancelar" }), _jsx(Button, { onClick: handleSaveCaso, className: cn('h-12 rounded-xl px-8 text-sm font-semibold shadow-lg', 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600'), disabled: saving, children: saving ? 'Salvando...' : isEditing ? 'Salvar alteracoes' : 'Salvar caso' })] })] }) })] }) }));
    }
    return (_jsx("div", { className: cn('min-h-screen pb-12', 'bg-[#fff6e9] text-[#1d1d1f]'), children: _jsxs("div", { className: "space-y-6", children: [_jsxs("header", { className: cn('relative overflow-hidden rounded-3xl border p-6 shadow-[0_28px_60px_-48px_rgba(199,98,0,0.8)]', 'border-[#f3c988] bg-gradient-to-br from-[#ffedd5] via-[#fff3e0] to-[#f7caaa]'), children: [_jsx("div", { className: cn('absolute inset-0 bg-no-repeat bg-right bg-[length:520px]', 'opacity-90'), style: { backgroundImage: `url(${heroLight})` } }), _jsxs("div", { className: "relative z-10 space-y-2", children: [_jsxs("div", { className: cn('flex items-center gap-3 text-sm', 'text-text-muted'), children: [_jsx("span", { className: cn('flex h-8 w-8 items-center justify-center rounded-full border', 'border-border bg-white'), children: _jsx(ChevronLeft, { className: cn('h-4 w-4', 'text-[#9a5b1e]') }) }), _jsxs("span", { children: ["Bom dia, ", displayName] })] }), _jsx("h2", { className: cn('font-display text-2xl', 'text-text'), children: "Casos" })] })] }), _jsx(Card, { className: cn('border', 'border-border bg-surface/90'), children: _jsxs(CardContent, { className: "space-y-4", children: [_jsx("div", { className: "flex flex-wrap items-center justify-between gap-3", children: _jsxs("div", { className: "flex flex-1 flex-wrap items-center gap-3", children: [_jsxs("div", { className: "relative w-full max-w-sm", children: [_jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" }), _jsx("input", { value: query, onChange: (event) => setQuery(event.target.value), placeholder: "Buscar casos...", className: cn('h-11 w-full rounded-full border pl-10 pr-3 text-sm shadow-soft focus:outline-none focus:ring-2', 'border-[#f0d9b8] bg-white text-[#2a1400] focus:border-emerald-400 focus:ring-emerald-200') })] }), _jsxs(Button, { variant: "outline", size: "sm", className: "h-11 rounded-full px-4 text-sm", children: [_jsx(Filter, { className: "h-4 w-4" }), "Filtros"] })] }) }), _jsxs("div", { className: cn('flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 shadow-soft', 'border-border bg-white'), children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2 text-xs", children: [chips.map((chip) => (_jsxs("button", { type: "button", className: cn('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium', chip.tone), children: [chip.label, _jsx(X, { className: "h-3 w-3 text-current/70" })] }, chip.id))), _jsx("button", { type: "button", className: cn('ml-2 text-xs', 'text-[#7a4a1a] hover:text-[#2a1400]'), onClick: () => {
                                                    setQuery('');
                                                    setAreaFilter('todos');
                                                    setHeatFilter('todos');
                                                }, children: "Limpar filtros" })] }), _jsxs(Button, { variant: "primary", size: "sm", className: "h-11 rounded-full bg-[#1f8a4c] px-5 text-sm font-semibold text-white shadow-[0_12px_20px_-12px_rgba(31,138,76,0.8)] hover:brightness-95 dark:bg-emerald-500", onClick: () => {
                                            if (!canManageCasos) {
                                                toast.error('Apenas gestores podem adicionar casos.');
                                                return;
                                            }
                                            resetCasoForm();
                                            setShowForm(true);
                                        }, disabled: !canManageCasos, children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "Novo Caso"] })] }), _jsx("div", { className: "flex flex-wrap items-center gap-2 text-xs", children: _jsxs("div", { className: "ml-auto flex items-center gap-2 text-xs text-text-subtle", children: [_jsx("span", { children: "Area" }), _jsxs("select", { value: areaFilter, onChange: (event) => setAreaFilter(event.target.value), className: cn('h-8 rounded-full border px-3 text-xs shadow-soft', 'border-[#f0d9b8] bg-white text-[#2a1400]'), children: [_jsx("option", { value: "todos", children: "Todos" }), Array.from(new Set(casos.map((caso) => caso.area))).map((area) => (_jsx("option", { value: area, children: area }, area)))] }), _jsx("span", { children: "Calor" }), _jsxs("select", { value: heatFilter, onChange: (event) => setHeatFilter(event.target.value), className: cn('h-8 rounded-full border px-3 text-xs shadow-soft', 'border-[#f0d9b8] bg-white text-[#2a1400]'), children: [_jsx("option", { value: "todos", children: "Todos" }), Array.from(new Set(casos.map((caso) => caso.heat))).map((heat) => (_jsx("option", { value: heat, children: heat }, heat)))] })] }) }), _jsx(PageState, { status: pageState, emptyTitle: "Nenhum caso encontrado", emptyDescription: "Ajuste os filtros para localizar um caso.", children: _jsxs("div", { className: cn('overflow-hidden rounded-2xl border shadow-soft', 'border-border bg-white'), children: [_jsxs("table", { className: "w-full border-collapse text-left text-sm", children: [_jsx("thead", { className: cn('text-[11px] uppercase tracking-[0.22em]', 'bg-[#fff3e0] text-[#9a5b1e]'), children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3", children: "ID" }), _jsx("th", { className: "px-4 py-3", children: "Cliente" }), _jsx("th", { className: "px-4 py-3", children: "Area juridica" }), _jsx("th", { className: "px-4 py-3", children: "Status" }), _jsx("th", { className: "px-4 py-3", children: "Calor" }), _jsx("th", { className: "px-4 py-3", children: "SLA" }), _jsx("th", { className: "px-4 py-3 text-right", children: "Acoes Rapidas" })] }) }), _jsx("tbody", { children: filtered.map((caso) => {
                                                        const percent = slaPercentByRisk(caso.slaRisk);
                                                        const initials = caso.cliente
                                                            .split(' ')
                                                            .map((part) => part[0])
                                                            .slice(0, 2)
                                                            .join('');
                                                        return (_jsxs(React.Fragment, { children: [_jsxs("tr", { className: cn('border-t', 'border-[#f0d9b8] hover:bg-[#fff3e0]/60'), onClick: () => navigate(`/app/caso/${caso.id}`), children: [_jsxs("td", { className: "px-4 py-3 text-xs text-text-subtle", children: ["#", caso.id.replace('caso-', '')] }), _jsx("td", { className: "px-4 py-3", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary", children: initials }), _jsx("span", { className: "text-sm font-semibold text-text", children: caso.cliente })] }) }), _jsx("td", { className: "px-4 py-3", children: _jsxs("span", { className: cn('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium', areaPill(caso.area)), children: [_jsx("span", { className: "inline-flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-semibold", children: "1" }), caso.area] }) }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: cn('text-sm', caso.slaRisk === 'critico' && 'text-danger'), children: statusLabel(caso.status) }) }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: cn('inline-flex rounded-full border px-3 py-1 text-xs font-medium', heatPill(caso.heat)), children: caso.heat }) }), _jsx("td", { className: "px-4 py-3", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "h-2 w-28 overflow-hidden rounded-full bg-surface-2", children: _jsx("div", { className: cn('h-full', slaTone(caso.slaRisk)), style: { width: `${percent}%` } }) }), _jsxs("span", { className: "text-xs text-text-subtle", children: [percent, "%"] })] }) }), _jsx("td", { className: "px-4 py-3 text-right", children: _jsxs("div", { className: "flex items-center justify-end gap-2", children: [_jsx("button", { type: "button", onClick: (event) => {
                                                                                            event.stopPropagation();
                                                                                            navigate(`/app/caso/${caso.id}`);
                                                                                        }, className: cn('inline-flex h-8 w-8 items-center justify-center rounded-full border', 'border-[#f0d9b8] bg-white text-[#7a4a1a] hover:text-[#2a1400]'), children: _jsx(ChevronDown, { className: "h-4 w-4" }) }), canManageCasos && (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", title: "Encaminhar", onClick: (event) => {
                                                                                                    event.stopPropagation();
                                                                                                    setAssigningCasoId((current) => (current === caso.id ? null : caso.id));
                                                                                                    setSelectedCasoAdvogadoId('');
                                                                                                }, className: cn('inline-flex h-8 w-8 items-center justify-center rounded-full border', 'border-[#f0d9b8] bg-white text-[#7a4a1a] hover:text-emerald-600'), children: _jsx(UserPlus, { className: "h-4 w-4" }) }), _jsx("button", { type: "button", onClick: (event) => {
                                                                                                    event.stopPropagation();
                                                                                                    void handleEditCaso(caso.id);
                                                                                                }, className: cn('inline-flex h-8 w-8 items-center justify-center rounded-full border', 'border-[#f0d9b8] bg-white text-[#7a4a1a] hover:text-emerald-600'), children: _jsx(Pencil, { className: "h-4 w-4" }) }), _jsx("button", { type: "button", onClick: (event) => {
                                                                                                    event.stopPropagation();
                                                                                                    void handleDeleteCaso(caso.id, caso.title);
                                                                                                }, className: cn('inline-flex h-8 w-8 items-center justify-center rounded-full border', 'border-[#f0d9b8] bg-white text-[#7a4a1a] hover:text-red-600'), children: _jsx(Trash2, { className: "h-4 w-4" }) })] }))] }) })] }), canManageCasos && assigningCasoId === caso.id && (_jsx("tr", { className: cn('border-t', 'border-[#f0d9b8] bg-[#fff3e0]/60'), children: _jsx("td", { colSpan: 7, className: "px-4 py-3", children: _jsxs("div", { className: cn('flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 text-xs', 'border-[#f0d9b8] bg-white text-[#7a4a1a]'), children: [_jsx("span", { className: "text-xs font-semibold", children: "Encaminhar para" }), _jsxs("select", { className: cn('h-9 rounded-lg border px-3 text-xs', 'border-[#f0d9b8] bg-white text-[#2a1400]'), value: selectedCasoAdvogadoId, onChange: (event) => setSelectedCasoAdvogadoId(event.target.value), children: [_jsx("option", { value: "", children: "Selecione um advogado" }), advogados.map((advogado) => (_jsx("option", { value: advogado.id, children: advogado.nome }, advogado.id)))] }), _jsx(Button, { size: "sm", className: "h-9 px-4 text-xs", onClick: () => {
                                                                                        void handleEncaminharCaso(caso.id);
                                                                                    }, children: "Encaminhar" }), _jsx(Button, { variant: "ghost", size: "sm", className: cn('h-9 px-4 text-xs', 'text-[#7a4a1a] hover:text-[#2a1400]'), onClick: () => {
                                                                                        setAssigningCasoId(null);
                                                                                        setSelectedCasoAdvogadoId('');
                                                                                    }, children: "Cancelar" }), advogados.length === 0 && (_jsx("span", { className: "text-xs", children: "Nenhum advogado cadastrado" }))] }) }) }))] }, caso.id));
                                                    }) })] }), _jsxs("div", { className: cn('flex items-center justify-between border-t px-4 py-3 text-xs', 'border-[#f0d9b8] bg-[#fff3e0] text-[#9a5b1e]'), children: [_jsxs("span", { children: ["Mostrando ", filtered.length, " de ", casos.length, " casos"] }), _jsx("div", { className: "flex items-center gap-2", children: ['1', '2', '4', '5'].map((page) => (_jsx("button", { type: "button", className: cn('h-7 w-7 rounded-lg border text-xs', 'border-[#f0d9b8] bg-white text-[#7a4a1a] hover:text-[#2a1400]'), children: page }, page))) })] })] }) })] }) })] }) }));
};
