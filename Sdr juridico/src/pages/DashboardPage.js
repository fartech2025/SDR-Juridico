import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { CalendarDays, ChevronRight, Flag, Sparkles } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import heroLight from '@/assets/hero-light.svg';
import { ActionCard } from '@/components/ActionCard';
import { NotificationCenter } from '@/components/NotificationCenter';
import { PageState } from '@/components/PageState';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime } from '@/utils/format';
import { cn } from '@/utils/cn';
import { useAgenda } from '@/hooks/useAgenda';
import { useCasos } from '@/hooks/useCasos';
import { useDocumentos } from '@/hooks/useDocumentos';
import { useLeads } from '@/hooks/useLeads';
import { useNotas } from '@/hooks/useNotas';
const resolveStatus = (value) => {
    if (value === 'loading' || value === 'empty' || value === 'error') {
        return value;
    }
    return 'ready';
};
const slaBadgeClass = (value) => {
    if (value === 'critico')
        return 'border-danger-bg bg-danger-bg text-danger';
    if (value === 'atencao')
        return 'border-warning-bg bg-warning-bg text-warning';
    return 'border-success-bg bg-success-bg text-success';
};
const stageBadgeClass = (value) => {
    if (value === 'em_andamento') {
        return 'border-info-bg bg-info-bg text-info';
    }
    if (value === 'negociacao') {
        return 'border-brand-primary-subtle bg-brand-primary-subtle text-brand-primary';
    }
    return 'border-gray-200 bg-gray-100 text-gray-600';
};
const categoryBadgeClass = (value) => {
    const label = value.toLowerCase();
    if (label === 'juridico') {
        return 'border-brand-secondary-subtle bg-brand-secondary-subtle text-brand-secondary';
    }
    if (label === 'comercial') {
        return 'border-brand-primary-subtle bg-brand-primary-subtle text-brand-primary';
    }
    if (label === 'agenda') {
        return 'border-success-bg bg-success-bg text-success';
    }
    return 'border-gray-200 bg-gray-100 text-gray-600';
};
const toIsoDate = (value) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
const countInRange = (items, getDate, start, end) => items.filter((item) => {
    const value = getDate(item);
    if (!value)
        return false;
    const date = new Date(value);
    return date >= start && date < end;
}).length;
const buildKpi = (id, label, value, delta, period) => ({
    id,
    label,
    value,
    delta,
    trend: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat',
    period,
});
const buildNotifications = (leadsCount, pendingDocs, criticalCases, nextAgendaCount) => [
    {
        id: 'nt-001',
        title: 'Documentos pendentes',
        description: `${pendingDocs} documentos aguardando validacao.`,
        priority: pendingDocs > 3 ? 'P0' : 'P1',
        date: new Date().toISOString(),
        actionLabel: 'Abrir documentos',
        actionHref: '/app/documentos',
        read: false,
    },
    {
        id: 'nt-002',
        title: 'Casos em risco',
        description: `${criticalCases} casos com prioridade alta.`,
        priority: criticalCases > 0 ? 'P0' : 'P2',
        date: new Date().toISOString(),
        actionLabel: 'Ver casos',
        actionHref: '/app/casos',
        read: false,
    },
    {
        id: 'nt-003',
        title: 'Leads ativos',
        description: `${leadsCount} leads em acompanhamento.`,
        priority: 'P2',
        date: new Date().toISOString(),
        actionLabel: 'Abrir leads',
        actionHref: '/app/leads',
        read: false,
    },
    {
        id: 'nt-004',
        title: 'Agenda do dia',
        description: `${nextAgendaCount} compromissos para hoje.`,
        priority: nextAgendaCount > 5 ? 'P1' : 'P2',
        date: new Date().toISOString(),
        actionLabel: 'Ver agenda',
        actionHref: '/app/agenda',
        read: true,
    },
];
export const DashboardPage = () => {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    // Light-only app - no dark mode
    const status = resolveStatus(params.get('state'));
    const { leads, loading: leadsLoading, error: leadsError } = useLeads();
    const { casos, loading: casosLoading, error: casosError } = useCasos();
    const { documentos, loading: docsLoading, error: docsError } = useDocumentos();
    const { eventos: agendaItems, loading: agendaLoading, error: agendaError } = useAgenda();
    const { notas, loading: notasLoading, error: notasError } = useNotas();
    const baseState = leadsLoading || casosLoading || docsLoading || agendaLoading || notasLoading
        ? 'loading'
        : leadsError || casosError || docsError || agendaError || notasError
            ? 'error'
            : leads.length || casos.length || documentos.length || agendaItems.length
                ? 'ready'
                : 'empty';
    const pageState = status !== 'ready' ? status : baseState;
    const leadHot = leads.find((lead) => lead.heat === 'quente' && lead.status !== 'ganho') ??
        leads[0];
    const docPending = documentos.find((doc) => doc.status === 'pendente') ?? documentos[0];
    const criticalEvents = React.useMemo(() => {
        const caseIds = new Set(casos.map((caso) => caso.id));
        return [...notas]
            .filter((event) => caseIds.has(event.casoId))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 4);
    }, [casos, notas]);
    const todayIso = toIsoDate(new Date());
    const agendaToday = React.useMemo(() => agendaItems.filter((item) => item.date === todayIso).slice(0, 3), [agendaItems, todayIso]);
    const nextCase = casos[0];
    const kpis = React.useMemo(() => {
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - 7);
        const prevWeekStart = new Date(now);
        prevWeekStart.setDate(prevWeekStart.getDate() - 14);
        const leadsActive = leads.filter((lead) => lead.status !== 'perdido' && lead.status !== 'ganho');
        const currentLeads = countInRange(leadsActive, (lead) => lead.createdAt, weekStart, now);
        const prevLeads = countInRange(leadsActive, (lead) => lead.createdAt, prevWeekStart, weekStart);
        const totalLeads = leads.length;
        const convertedLeads = leads.filter((lead) => lead.status === 'ganho').length;
        const conversionRate = totalLeads ? Math.round((convertedLeads / totalLeads) * 100) : 0;
        const casesActive = casos.filter((caso) => caso.status === 'ativo').length;
        const pendingDocs = documentos.filter((doc) => doc.status === 'pendente').length;
        const avgResponseHours = (() => {
            const valid = leads.filter((lead) => lead.lastContactAt);
            if (valid.length === 0)
                return 0;
            const total = valid.reduce((acc, lead) => {
                const start = new Date(lead.createdAt).getTime();
                const end = new Date(lead.lastContactAt).getTime();
                const diff = Math.max(0, end - start);
                return acc + diff;
            }, 0);
            return Math.round(total / valid.length / (1000 * 60 * 60));
        })();
        const receita = Math.round(casos.reduce((acc, caso) => acc + (Number.isFinite(caso.value) ? caso.value : 0), 0));
        return [
            buildKpi('kpi-001', 'Leads ativos', leadsActive.length, currentLeads - prevLeads, 'vs semana anterior'),
            buildKpi('kpi-002', 'Taxa de conversao', conversionRate, 0, 'ultimos 30 dias'),
            buildKpi('kpi-003', 'Casos em andamento', casesActive, 0, 'mes atual'),
            buildKpi('kpi-004', 'Pendencias criticas', pendingDocs, 0, 'ultimas 24h'),
            buildKpi('kpi-005', 'Tempo medio de resposta (h)', avgResponseHours, 0, 'ultimos 7 dias'),
            buildKpi('kpi-006', 'Receita potencial', receita, 0, 'pipeline atual'),
        ];
    }, [casos, documentos, leads]);
    const notifications = React.useMemo(() => {
        const pendingDocs = documentos.filter((doc) => doc.status === 'pendente').length;
        const criticalCases = casos.filter((caso) => caso.slaRisk === 'critico').length;
        const leadActiveCount = leads.filter((lead) => lead.status !== 'perdido' && lead.status !== 'ganho').length;
        const agendaCount = agendaItems.filter((item) => item.date === todayIso).length;
        return buildNotifications(leadActiveCount, pendingDocs, criticalCases, agendaCount);
    }, [agendaItems, casos, documentos, leads, todayIso]);
    return (_jsx("div", { className: "min-h-screen pb-12 bg-base text-text", children: _jsxs("div", { className: "space-y-6", children: [_jsxs("header", { className: "relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-brand-primary-subtle via-surface to-surface p-8 shadow-lg", children: [_jsxs("div", { className: "absolute inset-0", children: [_jsx("div", { className: "absolute -right-10 -top-10 h-52 w-52 rounded-full bg-brand-primary/8 blur-3xl" }), _jsx("div", { className: "absolute -bottom-16 left-12 h-64 w-64 rounded-full bg-brand-secondary/8 blur-3xl" })] }), _jsx("div", { className: "absolute inset-0 bg-no-repeat bg-right bg-[length:520px] opacity-90", style: { backgroundImage: `url(${heroLight})` } }), _jsxs("div", { className: "relative z-10 space-y-3", children: [_jsx("p", { className: "text-[11px] uppercase tracking-[0.32em] text-text-muted", children: "Dashboard" }), _jsx("h2", { className: "font-display text-3xl text-text", children: "Resumo executivo" }), _jsx("p", { className: "max-w-2xl text-sm text-text-muted", children: "Foco em caso critico, produtividade e agenda juridica com uma vis\u00E3o clara do funil." })] })] }), _jsxs(PageState, { status: pageState, children: [_jsx("div", { className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-4", children: kpis.slice(0, 4).map((item) => (_jsx(StatCard, { label: item.label, value: item.value, delta: item.delta, trend: item.trend, period: item.period, className: "border border-border bg-surface/90" }, item.id))) }), _jsxs("div", { className: "grid gap-4 xl:grid-cols-[2.2fr_1fr]", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsx(ActionCard, { title: "Lead quente aguardando retorno", description: leadHot
                                                        ? `Contato pendente: ${leadHot.name} (${leadHot.area}).`
                                                        : 'Nenhum lead quente identificado.', priority: "P0", actionLabel: "Acelerar lead", href: "/app/leads", className: "border border-border bg-surface/95 from-surface via-surface to-surface-alt text-text" }), _jsx(ActionCard, { title: "Documento pendente de validacao", description: docPending
                                                        ? `${docPending.title} para ${docPending.cliente}.`
                                                        : 'Nenhum documento pendente.', priority: "P1", actionLabel: "Validar agora", href: "/app/documentos", secondaryActionLabel: "Abrir dossie", secondaryHref: `/app/caso/${docPending?.casoId ?? 'caso-sem-dados'}`, className: "border border-border bg-surface/95 text-text" })] }), _jsxs(Card, { className: "border border-border bg-surface/90", children: [_jsxs(CardHeader, { className: "flex-row items-center justify-between space-y-0 px-6 pt-6 pb-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Flag, { className: "h-4 w-4 text-warning" }), _jsx(CardTitle, { className: "text-sm", children: "Eventos criticos hoje" })] }), criticalEvents[0]?.casoId && (_jsxs(Button, { variant: "ghost", size: "sm", onClick: () => navigate(`/app/caso/${criticalEvents[0].casoId}`), className: "px-0 text-primary hover:text-primary", children: ["Ver caso", _jsx(ChevronRight, { className: "h-4 w-4" })] }))] }), _jsxs(CardContent, { className: "space-y-3 px-6 pb-6", children: [criticalEvents.length === 0 && (_jsx("div", { className: "rounded-2xl border border-border bg-white px-4 py-6 text-center text-xs text-text-muted shadow-[0_8px_20px_rgba(18,38,63,0.06)]", children: "Nenhum evento critico registrado hoje." })), criticalEvents.map((event) => (_jsx("div", { className: "rounded-2xl border border-border bg-white px-4 py-4 text-xs text-text-muted shadow-[0_8px_20px_rgba(18,38,63,0.06)]", children: _jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("span", { className: "text-sm font-semibold text-text", children: event.title }), _jsx("p", { className: "text-xs text-text-muted", children: event.description }), _jsxs("div", { className: "flex items-center gap-2 text-xs text-text-subtle", children: [_jsx(Badge, { className: cn('uppercase', categoryBadgeClass(event.category)), children: event.category }), _jsxs(Link, { to: `/app/caso/${event.casoId}`, className: "inline-flex items-center gap-1 text-primary hover:underline", children: ["Abrir dossie", _jsx(ChevronRight, { className: "h-3 w-3" })] })] })] }), _jsx("span", { className: "text-[10px] text-text-subtle", children: formatDateTime(event.date) })] }) }, event.id)))] })] }), _jsxs(Card, { className: "border border-border bg-surface/90", children: [_jsxs(CardHeader, { className: "flex-row items-center justify-between space-y-0 px-6 pt-6 pb-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(CalendarDays, { className: "h-4 w-4 text-accent" }), _jsx(CardTitle, { className: "text-sm", children: "Agenda do dia" })] }), _jsx(Link, { to: "/app/agenda", className: "text-xs text-primary hover:underline", children: "Ver todos" })] }), _jsx(CardContent, { className: "space-y-3 px-6 pb-6", children: agendaToday.map((item) => (_jsxs("div", { className: "flex items-center justify-between gap-3 rounded-2xl border border-border bg-white px-4 py-4 text-sm text-text-muted shadow-[0_8px_20px_rgba(18,38,63,0.06)]", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-text", children: item.title }), _jsxs("p", { className: "text-xs text-text-subtle", children: [item.cliente, " - ", item.location] })] }), _jsxs("div", { className: "text-right text-xs text-text-subtle", children: [_jsx("div", { children: item.time }), _jsxs("div", { children: [item.durationMinutes, " min"] })] })] }, item.id))) })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs(Card, { className: "border border-border bg-surface/90", children: [_jsx(CardHeader, { className: "flex-row items-center justify-between space-y-0 px-6 pt-6 pb-2", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Sparkles, { className: "h-4 w-4 text-primary" }), _jsx(CardTitle, { className: "text-sm", children: "Proxima melhor acao" })] }) }), _jsxs(CardContent, { className: "space-y-3 px-6 pb-6 text-sm text-text-muted", children: [nextCase ? (_jsxs("div", { className: "rounded-2xl border border-border bg-white px-4 py-4 shadow-[0_8px_20px_rgba(18,38,63,0.06)]", children: [_jsx("p", { className: "text-sm font-semibold text-text", children: nextCase.title }), _jsxs("p", { className: "text-xs text-text-subtle", children: ["Cliente: ", nextCase.cliente, " - Area ", nextCase.area] }), _jsxs("div", { className: "mt-2 flex items-center gap-2", children: [_jsx(Badge, { className: cn('uppercase', slaBadgeClass(nextCase.slaRisk)), children: nextCase.slaRisk }), _jsx(Badge, { className: cn('uppercase', stageBadgeClass(nextCase.stage)), children: nextCase.stage })] })] })) : (_jsx("div", { className: "rounded-2xl border border-border bg-white px-4 py-4 text-xs text-text-muted shadow-[0_8px_20px_rgba(18,38,63,0.06)]", children: "Nenhum caso ativo encontrado." })), _jsx("p", { className: "text-xs text-text-muted", children: "Atualize o dossie e registre as pendencias prioritarias." }), _jsx("div", { className: "flex justify-end", children: _jsxs(Button, { variant: "secondary", size: "sm", onClick: () => nextCase && navigate(`/app/caso/${nextCase.id}`), className: "rounded-full px-4", disabled: !nextCase, children: ["Abrir dossie", _jsx(ChevronRight, { className: "h-4 w-4" })] }) })] })] }), _jsx(NotificationCenter, { notifications: notifications.slice(0, 6), className: "border border-border bg-surface/95 text-text" })] })] })] })] }) }));
};
