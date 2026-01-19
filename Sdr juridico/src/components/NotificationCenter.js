import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BellRing, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/utils/cn';
import { formatDateTime } from '@/utils/format';
const priorityOrder = {
    P0: 0,
    P1: 1,
    P2: 2,
};
const priorityBadgeClass = {
    P0: 'border-danger-border bg-danger-bg text-danger',
    P1: 'border-warning-border bg-warning-bg text-warning',
    P2: 'border-success-border bg-success-bg text-success',
};
export const NotificationCenter = ({ notifications, className }) => {
    const navigate = useNavigate();
    const sorted = [...notifications].sort((a, b) => {
        const priority = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priority !== 0)
            return priority;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    const miniSlots = sorted.slice(0, 6).map((item) => {
        const date = new Date(item.date);
        return {
            id: item.id,
            day: `${date.getDate()}`.padStart(2, '0'),
            time: date.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
            }),
        };
    });
    const highlightSlot = miniSlots[1]?.id ?? miniSlots[0]?.id;
    return (_jsxs(Card, { className: cn('border-[#f0d9b8] bg-white/85 dark:border-slate-800 dark:bg-slate-900/70', className), children: [_jsxs(CardHeader, { className: "flex-row items-center justify-between space-y-0 px-6 pt-6 pb-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(BellRing, { className: "h-4 w-4 text-text-subtle" }), _jsx(CardTitle, { className: "text-sm", children: "Notificacoes" })] }), _jsxs("span", { className: "text-[11px] text-text-subtle", children: [sorted.length, " itens"] })] }), _jsxs(CardContent, { className: "space-y-3 px-6 pb-6", children: [sorted.length === 0 && (_jsx("div", { className: "rounded-2xl border border-[#f0d9b8] bg-white px-4 py-4 text-sm text-text-muted shadow-soft dark:border-slate-800 dark:bg-slate-900", children: "Sem notificacoes por enquanto." })), sorted.length > 0 && (_jsxs("div", { className: cn('flex items-center gap-2 rounded-2xl border px-3 py-2 text-[11px] shadow-[0_8px_20px_rgba(18,38,63,0.06)]', 'border-[#f0d9b8] bg-white text-[#7a4a1a]'), children: [_jsxs("div", { className: cn('flex min-w-[56px] flex-col items-start rounded-xl px-3 py-2 text-xs font-semibold', 'bg-[#fff3e0] text-[#2a1400]'), children: [_jsx("span", { className: "text-sm", children: sorted.length }), _jsx("span", { className: cn('text-[10px]', 'text-[#9a5b1e]'), children: "itens" })] }), _jsx("div", { className: "flex flex-1 items-center gap-2 overflow-hidden", children: miniSlots.map((slot) => (_jsxs("div", { className: cn('flex min-w-[52px] flex-col items-center rounded-xl border px-2 py-2 text-[10px] shadow-soft', slot.id === highlightSlot
                                        ? 'border-[#f0d9b8] bg-[#fff3e0] text-[#2a1400]'
                                        : 'border-[#f0d9b8] bg-white text-[#7a4a1a]'), children: [_jsx("span", { className: cn('text-[11px] font-semibold', 'text-text'), children: slot.day }), _jsx("span", { children: slot.time })] }, slot.id))) })] })), sorted.map((item) => (_jsxs("div", { className: cn('rounded-2xl border px-4 py-4 text-xs shadow-[0_8px_20px_rgba(18,38,63,0.06)]', 'border-[#f0d9b8] !bg-white !text-[#2a1400]'), children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Badge, { variant: item.priority === 'P0'
                                                            ? 'danger'
                                                            : item.priority === 'P1'
                                                                ? 'warning'
                                                                : 'success', className: priorityBadgeClass[item.priority], children: item.priority }), _jsx("span", { className: cn('text-sm font-semibold', 'text-text'), children: item.title })] }), _jsx("p", { className: cn('text-xs', 'text-text-muted'), children: item.description })] }), _jsx("div", { className: cn('text-[10px]', 'text-[#9a5b1e]'), children: formatDateTime(item.date) })] }), item.actionLabel && item.actionHref && (_jsx("div", { className: "mt-3 flex justify-end", children: _jsxs(Button, { variant: "ghost", size: "sm", onClick: () => navigate(item.actionHref), className: "px-0 text-primary hover:text-primary", children: [item.actionLabel, _jsx(ChevronRight, { className: "h-4 w-4" })] }) }))] }, item.id)))] })] }));
};
