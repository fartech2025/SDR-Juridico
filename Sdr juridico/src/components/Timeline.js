import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { CalendarClock, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/utils/cn';
import { formatDateTime } from '@/utils/format';
const filterOptions = [
    { label: 'Tudo', value: 'all' },
    { label: 'Docs', value: 'docs' },
    { label: 'Agenda', value: 'agenda' },
    { label: 'Comercial', value: 'comercial' },
    { label: 'Juridico', value: 'juridico' },
    { label: 'Automacao', value: 'automacao' },
    { label: 'Humano', value: 'humano' },
];
const categoryBadgeVariant = (category) => {
    if (category === 'docs')
        return 'info';
    if (category === 'agenda')
        return 'warning';
    if (category === 'comercial')
        return 'success';
    if (category === 'juridico')
        return 'danger';
    if (category === 'automacao')
        return 'info';
    return 'default';
};
export const Timeline = ({ events, onAddEvent }) => {
    const [activeFilter, setActiveFilter] = React.useState('all');
    const filteredEvents = React.useMemo(() => {
        if (activeFilter === 'all')
            return events;
        return events.filter((event) => event.category === activeFilter);
    }, [events, activeFilter]);
    return (_jsxs(Card, { children: [_jsxs(CardHeader, { className: "space-y-3", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(CalendarClock, { className: "h-4 w-4 text-accent" }), _jsx(CardTitle, { className: "text-base", children: "Linha do Tempo do Caso" })] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: onAddEvent, className: "h-10 rounded-full px-4", children: [_jsx(Plus, { className: "h-4 w-4" }), "Adicionar evento"] })] }), _jsx("div", { className: "flex flex-wrap gap-2", children: filterOptions.map((option) => (_jsx("button", { type: "button", onClick: () => setActiveFilter(option.value), className: cn('rounded-full border px-3 py-1.5 text-xs font-medium transition', activeFilter === option.value
                                ? 'border-primary/60 bg-primary/15 text-primary'
                                : 'border-border bg-white text-text-subtle hover:bg-[#F2F5FF] hover:text-text'), children: option.label }, option.value))) })] }), _jsxs(CardContent, { className: "space-y-3", children: [filteredEvents.length === 0 && (_jsx("div", { className: "rounded-2xl border border-border bg-white px-4 py-6 text-center text-sm text-text-muted shadow-[0_8px_20px_rgba(18,38,63,0.06)]", children: "Nenhum evento encontrado para este filtro." })), filteredEvents.map((event, index) => (_jsxs("div", { className: "relative flex gap-4 rounded-2xl border border-border bg-white px-4 py-4 text-sm text-text-muted shadow-[0_8px_20px_rgba(18,38,63,0.06)]", children: [_jsxs("div", { className: "flex flex-col items-center", children: [_jsx("span", { className: "h-3 w-3 rounded-full bg-primary/80" }), index !== filteredEvents.length - 1 && (_jsx("span", { className: "mt-2 h-full w-px bg-border-soft" }))] }), _jsxs("div", { className: "flex-1 space-y-2", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Badge, { variant: categoryBadgeVariant(event.category), children: event.category }), _jsx("span", { className: "text-sm font-semibold text-text", children: event.title })] }), _jsx("span", { className: "text-[10px] text-text-subtle", children: formatDateTime(event.date) })] }), _jsx("p", { className: "text-xs text-text-muted", children: event.description }), _jsxs("div", { className: "flex flex-wrap items-center gap-2 text-xs text-text-subtle", children: [_jsxs("span", { children: ["Canal: ", event.channel] }), _jsx("span", { children: "-" }), _jsxs("span", { children: ["Autor: ", event.author] })] }), event.tags.length > 0 && (_jsx("div", { className: "flex flex-wrap gap-2", children: event.tags.map((tag) => (_jsx(Badge, { children: tag }, tag))) }))] })] }, event.id)))] })] }));
};
