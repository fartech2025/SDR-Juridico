import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { createPortal } from 'react-dom';
import { Briefcase, ShieldCheck, UserRound } from 'lucide-react';
import heroLight from '@/assets/hero-light.svg';
import { Button } from '@/components/ui/button';
import { formatDate, formatDateTime } from '@/utils/format';
import { useTarefas } from '@/hooks/useTarefas';
const statusPill = (status) => {
    if (status === 'inativo')
        return 'border-border bg-surface-2 text-text-muted';
    if (status === 'em_risco')
        return 'border-danger-border bg-danger-bg text-danger';
    return 'border-success-border bg-success-bg text-success';
};
const healthPill = (health) => {
    if (health === 'critico')
        return 'border-danger-border bg-danger-bg text-danger';
    if (health === 'atencao')
        return 'border-warning-border bg-warning-bg text-warning';
    return 'border-success-border bg-success-bg text-success';
};
export const ClienteDrawer = ({ open, cliente, onClose }) => {
    const { tarefas, loading: tarefasLoading, fetchTarefasByEntidade } = useTarefas();
    React.useEffect(() => {
        if (!open)
            return;
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose]);
    React.useEffect(() => {
        if (!open || !cliente?.id)
            return;
        fetchTarefasByEntidade('cliente', cliente.id).catch(() => null);
    }, [open, cliente?.id, fetchTarefasByEntidade]);
    if (!open || !cliente)
        return null;
    return createPortal(_jsxs("div", { className: "fixed inset-0 z-50", children: [_jsx("div", { className: "absolute inset-0 bg-[rgba(17,24,39,0.35)]", style: { backdropFilter: 'blur(6px)' }, onClick: onClose }), _jsxs("aside", { className: "absolute right-0 top-0 flex h-full w-full max-w-[480px] flex-col rounded-l-2xl border-l border-border bg-white shadow-[0_18px_50px_rgba(18,38,63,0.18)]", children: [_jsx("div", { className: "relative overflow-hidden border-b border-border px-6 py-6", style: {
                        backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.96) 70%, rgba(215,236,255,0.3) 100%), url(${heroLight})`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right top',
                        backgroundSize: '320px',
                    }, children: _jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-[11px] uppercase tracking-[0.32em] text-text-subtle", children: "Cliente" }), _jsx("h3", { className: "font-display text-2xl text-text", children: cliente.name }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx("span", { className: `inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusPill(cliente.status)}`, children: cliente.status }), _jsx("span", { className: `inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${healthPill(cliente.health)}`, children: cliente.health })] })] }), _jsx("button", { type: "button", className: "text-sm text-text-subtle hover:text-text", onClick: onClose, "aria-label": "Fechar", children: "Fechar" })] }) }), _jsxs("div", { className: "flex-1 space-y-6 overflow-y-auto px-6 py-5 text-sm text-text-muted", children: [_jsxs("section", { className: "space-y-3", children: [_jsx("p", { className: "text-xs uppercase tracking-[0.2em] text-text-subtle", children: "Resumo" }), _jsxs("div", { className: "rounded-2xl border border-border bg-white px-4 py-4 shadow-soft", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Briefcase, { className: "h-4 w-4 text-text-subtle" }), _jsx("span", { children: cliente.area })] }), _jsxs("div", { className: "mt-3 flex items-center gap-2", children: [_jsx(UserRound, { className: "h-4 w-4 text-text-subtle" }), _jsx("span", { children: cliente.owner })] }), _jsxs("div", { className: "mt-3 flex items-center gap-2", children: [_jsx(ShieldCheck, { className: "h-4 w-4 text-text-subtle" }), _jsxs("span", { children: [cliente.caseCount, " casos vinculados"] })] })] }), _jsxs("p", { className: "text-xs text-text-subtle", children: ["Atualizado em ", formatDateTime(cliente.lastUpdate)] })] }), _jsxs("section", { className: "space-y-3", children: [_jsx("p", { className: "text-xs uppercase tracking-[0.2em] text-text-subtle", children: "Tarefas" }), _jsxs("div", { className: "space-y-2", children: [tarefasLoading && (_jsx("div", { className: "rounded-2xl border border-border bg-white px-4 py-3 text-xs text-text-subtle shadow-soft", children: "Carregando tarefas..." })), !tarefasLoading && tarefas.length === 0 && (_jsx("div", { className: "rounded-2xl border border-border bg-white px-4 py-3 text-xs text-text-subtle shadow-soft", children: "Nenhuma tarefa vinculada a este cliente." })), tarefas.map((tarefa) => (_jsxs("div", { className: "rounded-2xl border border-border bg-white px-4 py-3 shadow-soft transition hover:bg-surface-2", children: [_jsxs("div", { className: "flex items-center justify-between text-xs text-text-subtle", children: [_jsx("span", { className: "inline-flex rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-[11px] font-semibold uppercase text-text-muted", children: tarefa.status.replace('_', ' ') }), tarefa.dueDate && _jsxs("span", { children: ["Vence em ", formatDate(tarefa.dueDate)] })] }), _jsx("p", { className: "mt-2 text-sm text-text", children: tarefa.title })] }, tarefa.id)))] })] })] }), _jsx("div", { className: "border-t border-border bg-white/95 px-6 py-4", children: _jsx(Button, { variant: "outline", size: "sm", onClick: onClose, className: "rounded-full", children: "Fechar" }) })] })] }), document.body);
};
