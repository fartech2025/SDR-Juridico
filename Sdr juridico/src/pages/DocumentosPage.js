import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from 'react';
import { Check, Plus, X, Upload as UploadIcon, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import { PageState } from '@/components/PageState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadDocumentos } from '@/components/UploadDocumentos';
import heroLight from '@/assets/hero-light.svg';
import { formatDateTime } from '@/utils/format';
import { useDocumentos } from '@/hooks/useDocumentos';
import { useCasos } from '@/hooks/useCasos';
import { useOrganization } from '@/hooks/useOrganization';
import { cn } from '@/utils/cn';
const resolveStatus = (value) => {
    if (value === 'loading' || value === 'empty' || value === 'error') {
        return value;
    }
    return 'ready';
};
const statusPill = (status) => {
    if (status === 'aprovado')
        return 'border-[#CFEBD8] bg-[#E8F7EE] text-[#167A3D]';
    if (status === 'completo')
        return 'border-[#CFEBD8] bg-[#E8F7EE] text-[#167A3D]';
    if (status === 'solicitado')
        return 'border-[#D6E4FF] bg-[#E6F0FF] text-[#1D4ED8]';
    if (status === 'rejeitado')
        return 'border-[#F5C2C2] bg-[#FFE1E1] text-[#B42318]';
    return 'border-[#F1D28A] bg-[#FFF1CC] text-[#8A5A00]';
};
export const DocumentosPage = () => {
    const { documentos, loading, error, updateDocumento, deleteDocumento, marcarCompleto, marcarRejeitado, solicitarNovamente, } = useDocumentos();
    const { casos } = useCasos();
    const { currentRole, isFartechAdmin, currentOrg } = useOrganization();
    const canManageDocs = isFartechAdmin || ['org_admin', 'gestor', 'admin'].includes(currentRole || '');
    const [params] = useSearchParams();
    const [statusFilter, setStatusFilter] = React.useState('todos');
    const [typeFilter, setTypeFilter] = React.useState('todos');
    const [clienteFilter, setClienteFilter] = React.useState('todos');
    const [activeTab, setActiveTab] = React.useState('Tudo');
    const [mostrarUpload, setMostrarUpload] = React.useState(false);
    const [editingDoc, setEditingDoc] = React.useState(null);
    const [docForm, setDocForm] = React.useState({ title: '', type: '' });
    const [savingDoc, setSavingDoc] = React.useState(false);
    const tabs = ['Tudo', 'Docs', 'Agenda', 'Comercial', 'Juridico', 'Automacao'];
    const filters = React.useMemo(() => ({
        status: Array.from(new Set(documentos.map((doc) => doc.status))),
        type: Array.from(new Set(documentos.map((doc) => doc.type))),
        cliente: Array.from(new Set(documentos.map((doc) => doc.cliente))),
    }), [documentos]);
    const filteredDocs = React.useMemo(() => {
        return documentos.filter((doc) => {
            const matchesStatus = statusFilter === 'todos' || doc.status === statusFilter;
            const matchesType = typeFilter === 'todos' || doc.type === typeFilter;
            const matchesCliente = clienteFilter === 'todos' || doc.cliente === clienteFilter;
            return matchesStatus && matchesType && matchesCliente;
        });
    }, [statusFilter, typeFilter, clienteFilter, documentos]);
    const forcedState = resolveStatus(params.get('state'));
    const baseState = loading
        ? 'loading'
        : error
            ? 'error'
            : filteredDocs.length === 0
                ? 'empty'
                : 'ready';
    const pageState = forcedState !== 'ready' ? forcedState : baseState;
    const selectedCase = clienteFilter !== 'todos'
        ? casos.find((caso) => caso.cliente === clienteFilter)
        : undefined;
    const checklistItems = selectedCase
        ? documentos.filter((doc) => doc.casoId === selectedCase.id)
        : [];
    const resetFilters = () => {
        setStatusFilter('todos');
        setTypeFilter('todos');
        setClienteFilter('todos');
    };
    const handleUploadComplete = () => {
        toast.success('Documento enviado com sucesso!');
        // Aqui você pode recarregar a lista de documentos
        // Por enquanto, apenas fechamos o modal
        setTimeout(() => {
            setMostrarUpload(false);
        }, 1500);
    };
    const handleAprovar = async (docId, titulo) => {
        try {
            await marcarCompleto(docId);
            toast.success(`Documento aprovado: ${titulo}`);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao aprovar documento';
            toast.error(message);
        }
    };
    const handleRejeitar = async (docId, titulo) => {
        try {
            await marcarRejeitado(docId);
            toast.success(`Documento rejeitado: ${titulo}`);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao rejeitar documento';
            toast.error(message);
        }
    };
    const handleSolicitar = async (docId, titulo) => {
        try {
            await solicitarNovamente(docId);
            toast.success(`Solicitado novamente: ${titulo}`);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao solicitar documento';
            toast.error(message);
        }
    };
    const resetEditForm = () => {
        setEditingDoc(null);
        setDocForm({ title: '', type: '' });
    };
    const handleEditarDocumento = (doc) => {
        if (!canManageDocs) {
            toast.error('Apenas gestores podem editar documentos.');
            return;
        }
        setEditingDoc(doc);
        setDocForm({ title: doc.title, type: doc.type });
        setMostrarUpload(false);
    };
    const handleSalvarEdicao = async () => {
        if (!editingDoc)
            return;
        setSavingDoc(true);
        try {
            await updateDocumento(editingDoc.id, {
                titulo: docForm.title || editingDoc.title,
                tipo: docForm.type || editingDoc.type,
            });
            toast.success(`Documento atualizado: ${editingDoc.title}`);
            resetEditForm();
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao atualizar documento';
            toast.error(message);
        }
        finally {
            setSavingDoc(false);
        }
    };
    const handleExcluirDocumento = async (docId, titulo) => {
        if (!canManageDocs) {
            toast.error('Apenas gestores podem excluir documentos.');
            return;
        }
        const confirmed = window.confirm(`Excluir o documento "${titulo}"? Essa ação não pode ser desfeita.`);
        if (!confirmed)
            return;
        try {
            await deleteDocumento(docId);
            toast.success(`Documento excluído: ${titulo}`);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao excluir documento';
            toast.error(message);
        }
    };
    return (_jsx("div", { className: cn('min-h-screen pb-12', 'bg-[#fff6e9] text-[#1d1d1f]'), children: _jsxs("div", { className: "space-y-5", children: [_jsxs("header", { className: cn('relative overflow-hidden rounded-3xl border p-6 shadow-[0_28px_60px_-48px_rgba(199,98,0,0.8)]', 'border-[#f3c988] bg-gradient-to-br from-[#ffedd5] via-[#fff3e0] to-[#f7caaa]'), children: [_jsx("div", { className: cn('absolute inset-0 bg-no-repeat bg-right bg-[length:520px]', 'opacity-90'), style: { backgroundImage: `url(${heroLight})` } }), _jsxs("div", { className: "relative z-10 space-y-2", children: [_jsx("p", { className: cn('text-xs uppercase tracking-[0.3em]', 'text-text-muted'), children: "Documentos" }), _jsx("h2", { className: cn('font-display text-2xl', 'text-text'), children: "Gestao central" }), _jsx("p", { className: cn('text-sm', 'text-text-muted'), children: "Filtre por status, tipo e cliente para validar pendencias." })] })] }), _jsx(PageState, { status: pageState, emptyTitle: "Nenhum documento encontrado", emptyDescription: "Ajuste os filtros para localizar os documentos.", children: _jsxs("div", { className: "grid gap-4 xl:grid-cols-[2fr_1fr]", children: [mostrarUpload && (_jsxs(Card, { className: cn('xl:col-span-2 border', 'border-border bg-surface/90'), children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [_jsx(CardTitle, { className: "text-base", children: "Upload de Documentos" }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => setMostrarUpload(false), children: _jsx(X, { className: "h-4 w-4" }) })] }), _jsx(CardContent, { children: _jsx(UploadDocumentos, { casoId: clienteFilter !== 'todos' ? selectedCase?.id : undefined, orgId: currentOrg?.id, onUploadComplete: handleUploadComplete, disabled: !canManageDocs }) })] })), editingDoc && (_jsxs(Card, { className: cn('xl:col-span-2 border', 'border-border bg-surface/90'), children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [_jsx(CardTitle, { className: "text-base", children: "Editar documento" }), _jsx(Button, { variant: "ghost", size: "sm", onClick: resetEditForm, children: _jsx(X, { className: "h-4 w-4" }) })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: cn('text-xs font-semibold', 'text-slate-700'), children: "Titulo" }), _jsx("input", { value: docForm.title, onChange: (event) => setDocForm((prev) => ({ ...prev, title: event.target.value })), className: cn('h-11 w-full rounded-xl border px-4 text-sm shadow-soft focus:outline-none focus:ring-2', 'border-[#f0d9b8] bg-white text-[#2a1400] focus:border-emerald-400 focus:ring-emerald-200'), placeholder: "Nome do documento" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: cn('text-xs font-semibold', 'text-slate-700'), children: "Tipo" }), _jsx("input", { value: docForm.type, onChange: (event) => setDocForm((prev) => ({ ...prev, type: event.target.value })), className: cn('h-11 w-full rounded-xl border px-4 text-sm shadow-soft focus:outline-none focus:ring-2', 'border-[#f0d9b8] bg-white text-[#2a1400] focus:border-emerald-400 focus:ring-emerald-200'), placeholder: "Ex: contrato, procura\u00E7\u00E3o" })] })] }), _jsxs("div", { className: "flex flex-wrap gap-3", children: [_jsx(Button, { variant: "outline", size: "sm", className: "h-10 rounded-full px-5", onClick: resetEditForm, children: "Cancelar" }), _jsx(Button, { variant: "primary", size: "sm", className: "h-10 rounded-full px-5", onClick: handleSalvarEdicao, disabled: savingDoc, children: savingDoc ? 'Salvando...' : 'Salvar alterações' })] })] })] })), _jsxs(Card, { className: cn('border', 'border-border bg-surface/90'), children: [_jsxs(CardHeader, { className: "flex flex-wrap items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsx(CardTitle, { className: "text-base", children: "Documentos pendentes" }), _jsxs("div", { className: "mt-2 flex flex-wrap gap-3 text-xs text-text-subtle", children: [_jsxs("span", { children: ["Total: ", documentos.length] }), _jsxs("span", { children: ["Exibindo: ", filteredDocs.length] })] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { variant: "primary", size: "sm", className: "h-10 rounded-full px-4", onClick: () => {
                                                            if (!canManageDocs) {
                                                                toast.error('Apenas gestores podem enviar documentos.');
                                                                return;
                                                            }
                                                            setMostrarUpload(!mostrarUpload);
                                                        }, disabled: !canManageDocs, children: [_jsx(UploadIcon, { className: "h-4 w-4 mr-2" }), mostrarUpload ? 'Ocultar Upload' : 'Upload Documento'] }), _jsx(Button, { variant: "outline", size: "sm", className: "h-10 rounded-full px-4", disabled: !canManageDocs, children: "Nova solicitacao" })] })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsx("div", { className: cn('flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-3 py-2 shadow-soft', 'border-border bg-white'), children: _jsx("div", { className: "flex flex-wrap gap-2", children: tabs.map((tab) => (_jsx("button", { type: "button", onClick: () => setActiveTab(tab), className: `rounded-full border px-4 py-1.5 text-xs font-medium transition ${activeTab === tab
                                                            ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-600'
                                                            : 'border-[#f0d9b8] bg-white text-[#7a4a1a] hover:bg-[#fff3e0] hover:text-[#2a1400]'}`, children: tab }, tab))) }) }), _jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [_jsxs("div", { className: "flex flex-wrap gap-3", children: [_jsxs("select", { className: cn('h-11 rounded-full border px-4 text-sm shadow-soft focus:outline-none focus:ring-2', 'border-[#f0d9b8] bg-white text-[#2a1400] focus:border-emerald-400 focus:ring-emerald-200'), value: statusFilter, onChange: (event) => setStatusFilter(event.target.value), children: [_jsx("option", { value: "todos", children: "Status" }), filters.status.map((status) => (_jsx("option", { value: status, children: status }, status)))] }), _jsxs("select", { className: cn('h-11 rounded-full border px-4 text-sm shadow-soft focus:outline-none focus:ring-2', 'border-[#f0d9b8] bg-white text-[#2a1400] focus:border-emerald-400 focus:ring-emerald-200'), value: typeFilter, onChange: (event) => setTypeFilter(event.target.value), children: [_jsx("option", { value: "todos", children: "Tipo" }), filters.type.map((type) => (_jsx("option", { value: type, children: type }, type)))] }), _jsxs("select", { className: cn('h-11 rounded-full border px-4 text-sm shadow-soft focus:outline-none focus:ring-2', 'border-[#f0d9b8] bg-white text-[#2a1400] focus:border-emerald-400 focus:ring-emerald-200'), value: clienteFilter, onChange: (event) => setClienteFilter(event.target.value), children: [_jsx("option", { value: "todos", children: "Cliente" }), filters.cliente.map((cliente) => (_jsx("option", { value: cliente, children: cliente }, cliente)))] })] }), _jsx("button", { type: "button", className: cn('text-xs', 'text-[#7a4a1a] hover:text-[#2a1400]'), onClick: resetFilters, children: "Limpar filtros" })] }), _jsx("div", { className: cn('overflow-hidden rounded-2xl border shadow-soft', 'border-border bg-white'), children: _jsxs("table", { className: "w-full border-collapse text-left text-sm", children: [_jsx("thead", { className: cn('text-[11px] uppercase tracking-[0.22em]', 'bg-[#fff3e0] text-[#9a5b1e]'), children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3" }), _jsx("th", { className: "px-4 py-3", children: "Documento" }), _jsx("th", { className: "px-4 py-3", children: "Cliente" }), _jsx("th", { className: "px-4 py-3", children: "Status" }), _jsx("th", { className: "px-4 py-3", children: "Atualizado" }), _jsx("th", { className: "px-4 py-3", children: "Acoes" })] }) }), _jsx("tbody", { children: filteredDocs.map((doc) => (_jsxs("tr", { className: cn('border-t text-text', 'border-[#f0d9b8] hover:bg-[#fff3e0]/60'), children: [_jsx("td", { className: "px-4 py-3", children: _jsx("input", { type: "checkbox", className: "h-4 w-4 rounded border border-border bg-white text-primary" }) }), _jsxs("td", { className: "px-4 py-3", children: [_jsx("div", { className: "text-sm font-semibold text-text", children: doc.title }), _jsx("div", { className: "text-xs text-text-subtle", children: doc.type })] }), _jsx("td", { className: "px-4 py-3 text-sm text-text", children: doc.cliente }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: `inline-flex rounded-full border px-3 py-1 text-xs font-medium capitalize ${statusPill(doc.status)}`, children: doc.status }) }), _jsx("td", { className: "px-4 py-3 text-xs text-text-subtle", children: formatDateTime(doc.updatedAt) }), _jsx("td", { className: "px-4 py-3", children: canManageDocs ? (_jsxs("div", { className: "flex flex-wrap items-center gap-3 text-xs", children: [_jsxs("button", { type: "button", className: cn('inline-flex items-center gap-1', 'text-[#7a4a1a] hover:text-success'), onClick: (event) => {
                                                                                        event.stopPropagation();
                                                                                        void handleAprovar(doc.id, doc.title);
                                                                                    }, children: [_jsx(Check, { className: "h-3.5 w-3.5" }), "Validar"] }), _jsxs("button", { type: "button", className: cn('inline-flex items-center gap-1', 'text-[#7a4a1a] hover:text-danger'), onClick: (event) => {
                                                                                        event.stopPropagation();
                                                                                        void handleRejeitar(doc.id, doc.title);
                                                                                    }, children: [_jsx(X, { className: "h-3.5 w-3.5" }), "Rejeitar"] }), _jsxs("button", { type: "button", className: cn('inline-flex items-center gap-1', 'text-[#7a4a1a] hover:text-primary'), onClick: (event) => {
                                                                                        event.stopPropagation();
                                                                                        void handleSolicitar(doc.id, doc.title);
                                                                                    }, children: [_jsx(Plus, { className: "h-3.5 w-3.5" }), "Solicitar"] }), _jsxs("button", { type: "button", className: cn('inline-flex items-center gap-1', 'text-[#7a4a1a] hover:text-emerald-600'), onClick: (event) => {
                                                                                        event.stopPropagation();
                                                                                        handleEditarDocumento(doc);
                                                                                    }, children: [_jsx(Pencil, { className: "h-3.5 w-3.5" }), "Editar"] }), _jsxs("button", { type: "button", className: cn('inline-flex items-center gap-1', 'text-[#7a4a1a] hover:text-danger'), onClick: (event) => {
                                                                                        event.stopPropagation();
                                                                                        void handleExcluirDocumento(doc.id, doc.title);
                                                                                    }, children: [_jsx(Trash2, { className: "h-3.5 w-3.5" }), "Excluir"] })] })) : (_jsx("span", { className: "text-xs text-text-subtle", children: "Sem permissao" })) })] }, doc.id))) })] }) })] })] }), _jsxs(Card, { className: cn('border', 'border-border bg-surface/90'), children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-base", children: "Checklist do caso" }) }), _jsx(CardContent, { className: "space-y-3 text-sm text-text-muted", children: selectedCase ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: cn('rounded-2xl border px-3 py-3 shadow-soft', 'border-border bg-white'), children: [_jsx("p", { className: "text-sm font-semibold text-text", children: selectedCase.title }), _jsxs("p", { className: "text-xs text-text-subtle", children: ["Cliente: ", selectedCase.cliente] })] }), checklistItems.length === 0 && (_jsx("div", { className: cn('rounded-2xl border px-3 py-3 shadow-soft', 'border-border bg-white'), children: "Nenhum documento vinculado ao caso." })), checklistItems.map((doc) => (_jsxs("div", { className: cn('flex items-center justify-between rounded-2xl border px-3 py-2 text-xs shadow-soft', 'border-border bg-white'), children: [_jsx("span", { className: "text-text", children: doc.title }), _jsx("span", { className: `inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold capitalize ${statusPill(doc.status)}`, children: doc.status })] }, doc.id)))] })) : (_jsx("div", { className: cn('rounded-2xl border px-3 py-4 text-sm text-text-muted shadow-soft', 'border-border bg-white'), children: "Selecione um cliente para visualizar o checklist do caso." })) })] })] }) })] }) }));
};
