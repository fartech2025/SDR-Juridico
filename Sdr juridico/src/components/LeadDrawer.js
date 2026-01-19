import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { createPortal } from 'react-dom';
import { Mail, MessageSquare, Phone, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import heroLight from '@/assets/hero-light.svg';
import { Button } from '@/components/ui/button';
import { formatDateTime, formatPhone } from '@/utils/format';
import { useMensagens } from '@/hooks/useMensagens';
export const LeadDrawer = ({ open, lead, relatedCase, onClose }) => {
    const navigate = useNavigate();
    const { mensagens, loading } = useMensagens(lead?.id);
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
    if (!open || !lead)
        return null;
    return createPortal(_jsxs("div", { className: "fixed inset-0 z-50", children: [_jsx("div", { className: "absolute inset-0 bg-[rgba(17,24,39,0.35)]", style: { backdropFilter: 'blur(6px)' }, onClick: onClose }), _jsxs("aside", { className: "absolute right-0 top-0 flex h-full w-full max-w-[460px] flex-col rounded-l-2xl border-l border-border bg-white shadow-[0_18px_50px_rgba(18,38,63,0.18)]", children: [_jsx("div", { className: "relative overflow-hidden border-b border-border px-6 py-6", style: {
                            backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.96) 70%, rgba(255,216,232,0.22) 100%), url(${heroLight})`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right top',
                            backgroundSize: '320px',
                        }, children: _jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-[11px] uppercase tracking-[0.32em] text-text-subtle", children: "Lead" }), _jsx("h3", { className: "font-display text-2xl text-text", children: lead.name }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx("span", { className: "inline-flex rounded-full border border-[#D6E4FF] bg-[#E6F0FF] px-3 py-1 text-xs font-semibold text-[#1D4ED8]", children: lead.status }), _jsx("span", { className: "inline-flex rounded-full border border-[#F5C2C2] bg-[#FFE1E1] px-3 py-1 text-xs font-semibold text-[#B42318]", children: lead.heat }), _jsx("span", { className: "inline-flex rounded-full border border-[#D6E4FF] bg-[#EEF4FF] px-3 py-1 text-xs font-semibold text-[#2F6BFF]", children: lead.area })] })] }), _jsx("button", { type: "button", className: "text-sm text-text-subtle hover:text-text", onClick: onClose, "aria-label": "Fechar", children: "Fechar" })] }) }), _jsxs("div", { className: "flex-1 space-y-6 overflow-y-auto px-6 py-5 text-sm text-text-muted", children: [_jsxs("section", { className: "space-y-3", children: [_jsx("p", { className: "text-xs uppercase tracking-[0.2em] text-text-subtle", children: "Resumo" }), _jsxs("div", { className: "rounded-2xl border border-border bg-white px-4 py-4 shadow-soft", children: ["Lead originado via ", lead.origin, ". Atendimento conduzido por ", lead.owner, ". Proxima acao: confirmar documentacao e proposta final."] })] }), _jsxs("section", { className: "space-y-3", children: [_jsx("p", { className: "text-xs uppercase tracking-[0.2em] text-text-subtle", children: "Contato" }), _jsxs("div", { className: "rounded-2xl border border-border bg-white px-4 py-4 shadow-soft", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Mail, { className: "h-4 w-4 text-text-subtle" }), _jsx("span", { children: lead.email })] }), _jsxs("div", { className: "mt-3 flex items-center gap-2", children: [_jsx(Phone, { className: "h-4 w-4 text-text-subtle" }), _jsx("span", { children: formatPhone(lead.phone) })] }), _jsxs("div", { className: "mt-3 flex items-center gap-2", children: [_jsx(UserRound, { className: "h-4 w-4 text-text-subtle" }), _jsx("span", { children: lead.owner })] })] })] }), _jsxs("section", { className: "space-y-3", children: [_jsx("p", { className: "text-xs uppercase tracking-[0.2em] text-text-subtle", children: "Ultimas mensagens" }), _jsxs("div", { className: "space-y-2", children: [loading && (_jsx("div", { className: "rounded-2xl border border-border bg-white px-4 py-3 text-xs text-text-subtle shadow-soft", children: "Carregando mensagens..." })), !loading && mensagens.length === 0 && (_jsx("div", { className: "rounded-2xl border border-border bg-white px-4 py-3 text-xs text-text-subtle shadow-soft", children: "Nenhuma mensagem registrada ainda." })), mensagens.map((message) => (_jsxs("div", { className: "rounded-2xl border border-border bg-white px-4 py-3 shadow-soft transition hover:bg-surface-2", children: [_jsxs("div", { className: "flex items-center justify-between text-xs text-text-subtle", children: [_jsx("span", { className: message.author === 'SDR'
                                                                    ? 'inline-flex rounded-full border border-[#D6E4FF] bg-[#E6F0FF] px-2.5 py-0.5 text-[11px] font-semibold text-[#1D4ED8]'
                                                                    : 'inline-flex rounded-full border border-[#F5D6B2] bg-[#FFF1E3] px-2.5 py-0.5 text-[11px] font-semibold text-[#B45309]', children: message.author }), _jsx("span", { children: formatDateTime(message.date) })] }), _jsx("p", { className: "mt-2 text-sm text-text", children: message.content })] }, message.id)))] })] })] }), _jsxs("div", { className: "border-t border-border bg-white/95 px-6 py-4", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: () => navigate('/app/leads'), className: "rounded-full", children: [_jsx(MessageSquare, { className: "h-4 w-4" }), "Enviar mensagem"] }), _jsx(Button, { variant: "primary", size: "sm", onClick: () => relatedCase && navigate(`/app/caso/${relatedCase.id}`), disabled: !relatedCase, className: "flex-1 rounded-full justify-center", children: "Abrir dossie" }), _jsx(Button, { variant: "ghost", size: "sm", onClick: onClose, children: "Fechar" })] }), !relatedCase && (_jsx("p", { className: "mt-2 text-xs text-text-subtle", children: "Nenhum dossie vinculado a este lead." }))] })] })] }), document.body);
};
