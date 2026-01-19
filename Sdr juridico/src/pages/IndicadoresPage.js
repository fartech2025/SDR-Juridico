import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { TrendingUp } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, } from 'recharts';
import { PageState } from '@/components/PageState';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import heroLight from '@/assets/hero-light.svg';
import { cn } from '@/utils/cn';
import { useLeads } from '@/hooks/useLeads';
import { useCasos } from '@/hooks/useCasos';
const resolveStatus = (value) => {
    if (value === 'loading' || value === 'empty' || value === 'error') {
        return value;
    }
    return 'ready';
};
const trendVariant = (trend) => {
    if (trend === 'up')
        return 'success';
    if (trend === 'down')
        return 'danger';
    return 'info';
};
const monthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const toMonthKey = (value) => `${value.getFullYear()}-${value.getMonth()}`;
const buildMonthlyMetrics = (dates) => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, index) => {
        const date = new Date(now);
        date.setMonth(date.getMonth() - (5 - index));
        return date;
    });
    const counts = new Map();
    dates.forEach((item) => {
        const date = new Date(item);
        const key = toMonthKey(date);
        counts.set(key, (counts.get(key) || 0) + 1);
    });
    return months.map((date) => {
        const key = toMonthKey(date);
        return {
            month: monthLabels[date.getMonth()],
            leads: counts.get(key) || 0,
            closed: 0,
        };
    });
};
export const IndicadoresPage = () => {
    const [params] = useSearchParams();
    const state = resolveStatus(params.get('state'));
    const { leads, loading: leadsLoading, error: leadsError } = useLeads();
    const { casos, loading: casosLoading, error: casosError } = useCasos();
    const monthlyMetrics = React.useMemo(() => {
        const createdDates = leads.map((lead) => lead.createdAt);
        const metrics = buildMonthlyMetrics(createdDates);
        const closedCounts = new Map();
        leads
            .filter((lead) => lead.status === 'ganho')
            .forEach((lead) => {
            const date = new Date(lead.createdAt);
            const key = toMonthKey(date);
            closedCounts.set(key, (closedCounts.get(key) || 0) + 1);
        });
        return metrics.map((metric, index) => {
            const monthDate = new Date();
            monthDate.setMonth(monthDate.getMonth() - (5 - index));
            const key = toMonthKey(monthDate);
            return { ...metric, closed: closedCounts.get(key) || 0 };
        });
    }, [leads]);
    const funnelStages = React.useMemo(() => {
        const stages = [
            { label: 'Captacao', status: 'novo' },
            { label: 'Triagem', status: 'em_contato' },
            { label: 'Qualificacao', status: 'qualificado' },
            { label: 'Proposta', status: 'proposta' },
            { label: 'Fechamento', status: 'ganho' },
        ];
        return stages.map((stage, index) => ({
            id: `fn-${index + 1}`,
            label: stage.label,
            value: leads.filter((lead) => lead.status === stage.status).length,
        }));
    }, [leads]);
    const insights = React.useMemo(() => {
        const totalLeads = leads.length;
        const qualificados = leads.filter((lead) => lead.status === 'qualificado').length;
        const convertidos = leads.filter((lead) => lead.status === 'ganho').length;
        const conversao = totalLeads ? Math.round((convertidos / totalLeads) * 100) : 0;
        const casosAtivos = casos.filter((caso) => caso.status === 'ativo').length;
        return [
            {
                id: 'ins-1',
                title: 'Leads qualificados',
                description: `${qualificados} leads em fase de qualificacao.`,
                trend: qualificados > 0 ? 'up' : 'flat',
                value: `${qualificados}`,
            },
            {
                id: 'ins-2',
                title: 'Taxa de conversao',
                description: `Conversao atual em ${conversao}%.`,
                trend: conversao >= 30 ? 'up' : 'down',
                value: `${conversao}%`,
            },
            {
                id: 'ins-3',
                title: 'Casos ativos',
                description: `${casosAtivos} casos em andamento na operacao.`,
                trend: casosAtivos > 0 ? 'up' : 'flat',
                value: `${casosAtivos}`,
            },
        ];
    }, [casos, leads]);
    const goals = React.useMemo(() => {
        const leadQualificados = leads.filter((lead) => lead.status === 'qualificado').length;
        const contratos = leads.filter((lead) => lead.status === 'ganho').length;
        const casosEmDia = casos.filter((caso) => caso.slaRisk !== 'critico').length;
        const casosTotal = casos.length || 1;
        const slaPercent = Math.round((casosEmDia / casosTotal) * 100);
        return [
            { id: 'goal-1', label: 'Leads qualificados', progress: leadQualificados, target: 60 },
            { id: 'goal-2', label: 'Contratos assinados', progress: contratos, target: 25 },
            { id: 'goal-3', label: 'SLA em dia', progress: slaPercent, target: 95, unit: '%' },
        ];
    }, [casos, leads]);
    const baseState = leadsLoading || casosLoading
        ? 'loading'
        : leadsError || casosError
            ? 'error'
            : leads.length === 0
                ? 'empty'
                : 'ready';
    const pageState = state !== 'ready' ? state : baseState;
    return (_jsx("div", { className: cn('min-h-screen pb-12', 'bg-[#fff6e9] text-[#1d1d1f]'), children: _jsxs("div", { className: "space-y-5", children: [_jsxs("header", { className: cn('relative overflow-hidden rounded-3xl border p-6 shadow-[0_28px_60px_-48px_rgba(199,98,0,0.8)]', 'border-[#f3c988] bg-gradient-to-br from-[#ffedd5] via-[#fff3e0] to-[#f7caaa]'), children: [_jsx("div", { className: cn('absolute inset-0 bg-no-repeat bg-right bg-[length:520px]', 'opacity-90'), style: { backgroundImage: `url(${heroLight})` } }), _jsxs("div", { className: "relative z-10 space-y-2", children: [_jsx("p", { className: cn('text-[11px] uppercase tracking-[0.32em]', 'text-text-muted'), children: "Indicadores" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(TrendingUp, { className: "h-5 w-5 text-accent" }), _jsx("h2", { className: cn('font-display text-2xl', 'text-text'), children: "Gestao central" })] }), _jsx("p", { className: cn('text-sm', 'text-text-muted'), children: "Leitura consolidada do funil juridico e metas." })] })] }), _jsxs(PageState, { status: pageState, emptyTitle: "Sem indicadores disponiveis", children: [_jsxs("div", { className: "grid gap-4 xl:grid-cols-[2fr_1fr]", children: [_jsxs(Card, { className: cn('border', 'border-border bg-surface/90'), children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-base", children: "Leads x Fechamentos (mes)" }) }), _jsx(CardContent, { className: "h-[320px] pt-0", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: monthlyMetrics, children: [_jsx(CartesianGrid, { stroke: "var(--color-border-soft)", strokeDasharray: "4 6" }), _jsx(XAxis, { dataKey: "month", stroke: "var(--color-text-subtle)", tickLine: false, axisLine: false }), _jsx(YAxis, { stroke: "var(--color-text-subtle)", tickLine: false, axisLine: false }), _jsx(Tooltip, { contentStyle: {
                                                                background: '#ffffff',
                                                                border: '1px solid #e9ecf5',
                                                                color: '#23263b',
                                                                borderRadius: '12px',
                                                                boxShadow: '0 10px 30px rgba(18, 38, 63, 0.08)',
                                                                fontSize: '12px',
                                                            } }), _jsx(Legend, { iconType: "circle", wrapperStyle: { fontSize: '12px', color: '#6b7280' } }), _jsx(Line, { type: "monotone", dataKey: "leads", stroke: "var(--color-primary)", strokeWidth: 2 }), _jsx(Line, { type: "monotone", dataKey: "closed", stroke: "var(--color-accent)", strokeWidth: 2 })] }) }) })] }), _jsxs(Card, { className: cn('border', 'border-border bg-surface/90'), children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-base", children: "Funil de etapas" }) }), _jsx(CardContent, { className: "h-[320px] pt-0", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: funnelStages, layout: "vertical", margin: { left: 20 }, children: [_jsx(CartesianGrid, { stroke: "var(--color-border-soft)", strokeDasharray: "4 6" }), _jsx(XAxis, { type: "number", stroke: "var(--color-text-subtle)", tickLine: false, axisLine: false }), _jsx(YAxis, { dataKey: "label", type: "category", stroke: "var(--color-text-subtle)", width: 90, tickLine: false, axisLine: false }), _jsx(Tooltip, { contentStyle: {
                                                                background: '#ffffff',
                                                                border: '1px solid #e9ecf5',
                                                                color: '#23263b',
                                                                borderRadius: '12px',
                                                                boxShadow: '0 10px 30px rgba(18, 38, 63, 0.08)',
                                                                fontSize: '12px',
                                                            } }), _jsx(Bar, { dataKey: "value", fill: "var(--color-primary)", radius: [8, 8, 8, 8] })] }) }) })] })] }), _jsx("div", { className: "grid gap-4 lg:grid-cols-3", children: insights.map((insight) => (_jsxs(Card, { className: cn('border', 'border-border bg-surface/90'), children: [_jsxs(CardHeader, { className: "flex items-center justify-between gap-3", children: [_jsx(CardTitle, { className: "text-base", children: insight.title }), _jsx(Badge, { variant: trendVariant(insight.trend), children: insight.value })] }), _jsx(CardContent, { className: "pt-0 text-sm text-text-muted", children: insight.description })] }, insight.id))) }), _jsxs(Card, { className: cn('border', 'border-border bg-surface/90'), children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-base", children: "Metas da operacao" }) }), _jsx(CardContent, { className: "space-y-4 text-sm text-text-muted", children: goals.map((goal) => {
                                        const progressValue = goal.progress / goal.target;
                                        return (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between text-xs text-text-subtle", children: [_jsx("span", { children: goal.label }), _jsxs("span", { children: [goal.progress, goal.unit ?? '', " / ", goal.target, goal.unit ?? ''] })] }), _jsx("div", { className: "h-2 rounded-full bg-surface-2", children: _jsx("div", { className: cn('h-full rounded-full bg-primary'), style: { width: `${Math.min(progressValue * 100, 100)}%` } }) })] }, goal.id));
                                    }) })] })] })] }) }));
};
