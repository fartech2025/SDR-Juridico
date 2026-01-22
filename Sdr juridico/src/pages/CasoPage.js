import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from 'react';
import { ChevronDown, ChevronLeft, Filter, FileText, KeyRound, Search, ShieldCheck, } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import heroLight from '@/assets/hero-light.svg';
import { PageState } from '@/components/PageState';
import { Timeline } from '@/components/Timeline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { cn } from '@/utils/cn';
import { formatDateTime } from '@/utils/format';
import { useCasos } from '@/hooks/useCasos';
import { useLeads } from '@/hooks/useLeads';
import { useDocumentos } from '@/hooks/useDocumentos';
import { useNotas } from '@/hooks/useNotas';
import { useAgenda } from '@/hooks/useAgenda';
import { useCurrentUser } from '@/hooks/useCurrentUser';
const resolveStatus = (value) => {
    if (value === 'loading' || value === 'empty' || value === 'error') {
        return value;
    }
    return 'ready';
};
const tabs = [
    'Tudo',
    'Documentos',
    'Agenda',
    'Comercial',
    'Juridico',
    'Automacao',
    'Humano',
];
const categoryMap = {
    Tudo: null,
    Documentos: 'docs',
    Agenda: 'agenda',
    Comercial: 'comercial',
    Juridico: 'juridico',
    Automacao: 'automacao',
    Humano: 'humano',
};
const eventCategoryOptions = [
    { label: 'Docs', value: 'docs' },
    { label: 'Agenda', value: 'agenda' },
    { label: 'Comercial', value: 'comercial' },
    { label: 'Juridico', value: 'juridico' },
    { label: 'Automacao', value: 'automacao' },
    { label: 'Humano', value: 'humano' },
];
const statusBadge = (status) => {
    if (status === 'encerrado')
        return 'danger';
    if (status === 'suspenso')
        return 'warning';
    return 'success';
};
export const CasoPage = () => {
    const { id } = useParams();
    const [params] = useSearchParams();
    const { casos, loading: casosLoading, error: casosError } = useCasos();
    const { leads, loading: leadsLoading, error: leadsError } = useLeads();
    const { documentos, loading: docsLoading, error: docsError, fetchByCaso } = useDocumentos();
    const { eventos: agendaItems, loading: agendaLoading, error: agendaError } = useAgenda();
    const { notas, loading: notasLoading, error: notasError, fetchNotasByEntidade, createNota, } = useNotas();
    const { displayName, user } = useCurrentUser();
    const status = resolveStatus(params.get('state'));
    const [activeTab, setActiveTab] = React.useState('Tudo');
    const [modalOpen, setModalOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [filtersOpen, setFiltersOpen] = React.useState(false);
    const [dateRange, setDateRange] = React.useState('all');
    const [sortOrder, setSortOrder] = React.useState('recent');
    const [eventForm, setEventForm] = React.useState({
        title: '',
        category: 'juridico',
        description: '',
    });
    const [eventError, setEventError] = React.useState(null);
    const [eventSaving, setEventSaving] = React.useState(false);
    const timelineRef = React.useRef(null);
    const fallbackCaso = {
        id: 'caso-sem-dados',
        title: 'Sem caso',
        cliente: 'Sem cliente',
        area: 'Geral',
        status: 'ativo',
        heat: 'morno',
        stage: 'triagem',
        value: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: [],
        slaRisk: 'ok',
    };
    const caso = casos.find((item) => item.id === id) ?? casos[0] ?? fallbackCaso;
    const lead = leads.find((item) => item.id === caso?.leadId);
    const caseDocs = React.useMemo(() => documentos.filter((doc) => doc.casoId === caso?.id), [documentos, caso?.id]);
    const caseAgenda = React.useMemo(() => agendaItems.filter((event) => event.casoId === caso?.id), [agendaItems, caso?.id]);
    const caseNotas = React.useMemo(() => notas.filter((event) => event.casoId === caso?.id), [notas, caso?.id]);
    const docEvents = React.useMemo(() => caseDocs.map((doc) => ({
        id: `doc-${doc.id}`,
        casoId: doc.casoId || caso.id,
        title: doc.title,
        category: 'docs',
        channel: 'Documentos',
        date: doc.updatedAt || doc.createdAt,
        description: `${doc.type} - ${doc.status}`,
        tags: doc.tags || [],
        author: doc.requestedBy || 'Sistema',
    })), [caseDocs, caso.id]);
    const agendaEvents = React.useMemo(() => caseAgenda.map((event) => ({
        id: `agenda-${event.id}`,
        casoId: event.casoId || caso.id,
        title: event.title,
        category: 'agenda',
        channel: event.type || 'Agenda',
        date: new Date(`${event.date}T${event.time}:00`).toISOString(),
        description: `${event.time} - ${event.location || 'Sem local'}`,
        tags: [],
        author: event.owner || 'Sistema',
    })), [caseAgenda, caso.id]);
    const caseEvents = React.useMemo(() => {
        const combined = [...caseNotas, ...docEvents, ...agendaEvents];
        if (user?.id && displayName) {
            return combined.map((event) => event.author === user.id ? { ...event, author: displayName } : event);
        }
        return combined;
    }, [caseNotas, docEvents, agendaEvents, user?.id, displayName]);
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const timelineEvents = React.useMemo(() => {
        let events = caseEvents;
        if (normalizedSearch) {
            events = events.filter((event) => {
                const haystack = [
                    event.title,
                    event.description,
                    event.author,
                    event.channel,
                    event.category,
                    ...(event.tags || []),
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();
                return haystack.includes(normalizedSearch);
            });
        }
        if (dateRange !== 'all') {
            const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 0;
            if (days > 0) {
                const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
                events = events.filter((event) => {
                    const eventTime = new Date(event.date).getTime();
                    return Number.isNaN(eventTime) ? false : eventTime >= cutoff;
                });
            }
        }
        const sorted = [...events].sort((a, b) => {
            const aTime = new Date(a.date).getTime();
            const bTime = new Date(b.date).getTime();
            if (Number.isNaN(aTime) && Number.isNaN(bTime))
                return 0;
            if (Number.isNaN(aTime))
                return 1;
            if (Number.isNaN(bTime))
                return -1;
            return sortOrder === 'recent' ? bTime - aTime : aTime - bTime;
        });
        return sorted;
    }, [caseEvents, normalizedSearch, dateRange, sortOrder]);
    const filteredEvents = React.useMemo(() => {
        const category = categoryMap[activeTab];
        if (!category)
            return timelineEvents;
        return timelineEvents.filter((event) => event.category === category);
    }, [timelineEvents, activeTab]);
    React.useEffect(() => {
        const targetCaseId = id || caso.id;
        if (!targetCaseId)
            return;
        fetchNotasByEntidade('caso', targetCaseId).catch(() => null);
    }, [id, caso.id, fetchNotasByEntidade]);
    React.useEffect(() => {
        const targetCaseId = id || caso.id;
        if (!targetCaseId)
            return;
        fetchByCaso(targetCaseId).catch(() => null);
    }, [id, caso.id, fetchByCaso]);
    const baseState = casosLoading || leadsLoading || docsLoading || agendaLoading || notasLoading
        ? 'loading'
        : casosError || leadsError || docsError || agendaError || notasError
            ? 'error'
            : casos.length
                ? 'ready'
                : 'empty';
    const pageState = status !== 'ready' ? status : baseState;
    const highlights = [
        {
            id: 'high-1',
            label: 'Resumo gerado por IA',
            content: 'Carlos Martins, ex-empregado da ACME Ltda, solicitou revisao de horas extras e verbas rescisorias.',
        },
        {
            id: 'high-2',
            label: 'Pontos relevantes',
            content: 'Testemunha chave Joao Silva mencionada na ultima conversa; pagamento de horas extras em aberto.',
        },
    ];
    const checklist = [
        { id: 'ck-1', label: 'Contagem de horas extras', status: 'ok' },
        { id: 'ck-2', label: 'Contrato de trabalho', status: 'pendente' },
        { id: 'ck-3', label: 'Comprovacoes de jornada', status: 'pendente' },
        { id: 'ck-4', label: 'Holerites do periodo', status: 'ok' },
    ];
    const resetFilters = () => {
        setDateRange('all');
        setSortOrder('recent');
    };
    const resetEventForm = () => {
        setEventForm({
            title: '',
            category: 'juridico',
            description: '',
        });
        setEventError(null);
    };
    const openModal = () => {
        resetEventForm();
        setModalOpen(true);
    };
    const closeModal = () => {
        if (eventSaving)
            return;
        setModalOpen(false);
        resetEventForm();
    };
    const handleScrollToTimeline = () => {
        timelineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    const handleSaveEvent = async () => {
        if (!caso?.id) {
            setEventError('Caso nao encontrado.');
            return;
        }
        const title = eventForm.title.trim();
        if (!title) {
            setEventError('Informe um titulo para o evento.');
            return;
        }
        setEventSaving(true);
        setEventError(null);
        try {
            const description = eventForm.description.trim();
            const texto = description ? `${title}\n\n${description}` : title;
            await createNota({
                entidade: 'caso',
                entidadeId: caso.id,
                texto,
                createdBy: user?.id || null,
                tags: [eventForm.category],
            });
            setModalOpen(false);
            resetEventForm();
        }
        catch (error) {
            setEventError(error instanceof Error ? error.message : 'Erro ao salvar evento');
        }
        finally {
            setEventSaving(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-[#fff6e9] pb-12 text-[#1d1d1f] dark:bg-[#0e1116] dark:text-slate-100", children: _jsxs("div", { className: "space-y-6", children: [_jsxs("header", { className: "relative overflow-hidden rounded-3xl border border-[#f3c988] bg-gradient-to-br from-[#ffedd5] via-[#fff3e0] to-[#f7caaa] p-6 shadow-[0_28px_60px_-48px_rgba(199,98,0,0.8)] dark:border-slate-800 dark:from-[#141820] dark:via-[#10141b] dark:to-[#0b0f14]", children: [_jsx("div", { className: "absolute inset-0 bg-no-repeat bg-right bg-[length:520px] opacity-80 dark:opacity-20", style: { backgroundImage: `url(${heroLight})` } }), _jsxs("div", { className: "relative z-10 space-y-3", children: [_jsxs("button", { type: "button", className: "inline-flex items-center gap-2 rounded-full border border-[#f0d9b8] bg-white px-3 py-1 text-xs text-[#7a4a1a] shadow-soft dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300", children: [_jsx(ChevronLeft, { className: "h-4 w-4" }), "#", caso.id.replace('caso-', '')] }), _jsxs("h2", { className: "font-display text-2xl text-[#2a1400] dark:text-slate-100", children: [caso.id.replace('caso-', '#'), " - ", caso.cliente] }), _jsxs("div", { className: "flex flex-wrap items-center gap-2 text-xs text-[#7a4a1a] dark:text-slate-300", children: [_jsx(Badge, { variant: statusBadge(caso.status), className: "capitalize", children: caso.status }), _jsx(Badge, { variant: "info", children: caso.area }), _jsx(Badge, { variant: "default", children: caso.stage })] })] })] }), _jsx(PageState, { status: pageState, children: _jsxs("div", { className: "grid gap-6 xl:grid-cols-[2.4fr_1fr]", children: [_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "flex flex-wrap items-center gap-2", children: tabs.map((tab) => (_jsx("button", { type: "button", onClick: () => setActiveTab(tab), className: cn('rounded-full border px-4 py-1.5 text-xs font-medium transition', activeTab === tab
                                                ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                                                : 'border-[#f0d9b8] bg-white text-[#7a4a1a] hover:bg-[#fff3e0] hover:text-[#2a1400] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'), children: tab }, tab))) }), _jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsxs("div", { className: "relative w-full max-w-md", children: [_jsx(Search, { className: "absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" }), _jsx(Input, { placeholder: "Buscar eventos...", className: "h-11 rounded-full border border-[#f0d9b8] bg-[#fff3e0] pl-11 text-[#2a1400] placeholder:text-[#9a5b1e] focus:border-emerald-400 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-emerald-500/20", value: searchTerm, onChange: (event) => setSearchTerm(event.target.value) })] }), _jsxs(Button, { variant: "outline", size: "sm", className: "h-11 rounded-full px-4", onClick: () => setFiltersOpen((prev) => !prev), children: [_jsx(Filter, { className: "h-4 w-4" }), "Filtros"] })] }), filtersOpen && (_jsxs("div", { className: "flex flex-wrap items-center gap-3 rounded-2xl border border-[#f0d9b8] bg-white px-4 py-3 text-xs text-[#7a4a1a] shadow-soft dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-text-subtle", children: "Periodo" }), _jsxs("select", { className: "h-9 rounded-full border border-[#f0d9b8] bg-[#fff3e0] px-3 text-xs text-[#2a1400] shadow-soft focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100", value: dateRange, onChange: (event) => setDateRange(event.target.value), children: [_jsx("option", { value: "all", children: "Todos" }), _jsx("option", { value: "7d", children: "Ultimos 7 dias" }), _jsx("option", { value: "30d", children: "Ultimos 30 dias" }), _jsx("option", { value: "90d", children: "Ultimos 90 dias" })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-text-subtle", children: "Ordenacao" }), _jsxs("select", { className: "h-9 rounded-full border border-[#f0d9b8] bg-[#fff3e0] px-3 text-xs text-[#2a1400] shadow-soft focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100", value: sortOrder, onChange: (event) => setSortOrder(event.target.value), children: [_jsx("option", { value: "recent", children: "Mais recentes" }), _jsx("option", { value: "oldest", children: "Mais antigos" })] })] }), _jsx("button", { type: "button", className: "ml-auto text-xs text-text-muted hover:text-text", onClick: resetFilters, children: "Limpar filtros" })] })), activeTab === 'Tudo' && (_jsxs("div", { className: "space-y-4", children: [_jsxs(Card, { className: "border-border bg-white/90 shadow-soft", children: [_jsx(CardHeader, { className: "flex-row items-center justify-between space-y-0 border-b border-border/60 pb-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary", children: _jsx(ShieldCheck, { className: "h-5 w-5" }) }), _jsxs("div", { children: [_jsx(CardTitle, { children: "Dossie Juridico" }), _jsx("p", { className: "text-xs text-text-subtle", children: "Resumo gerado e pontos relevantes." })] })] }) }), _jsxs(CardContent, { className: "space-y-4 pt-4 text-sm text-text", children: [_jsxs("div", { className: "grid gap-4 lg:grid-cols-2", children: [_jsxs("div", { className: "flex h-full flex-col rounded-2xl border border-border bg-surface p-4 shadow-soft", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm font-semibold text-text", children: [_jsx(FileText, { className: "h-4 w-4 text-[#D36D8C]" }), "Resumo gerado por IA"] }), _jsx("p", { className: "mt-2 text-sm leading-relaxed text-text", children: highlights[0]?.content })] }), _jsxs("div", { className: "flex h-full flex-col rounded-2xl border border-border bg-surface p-4 shadow-soft", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm font-semibold text-text", children: [_jsx(KeyRound, { className: "h-4 w-4 text-[#6BB9A8]" }), "Pontos relevantes"] }), _jsx("p", { className: "mt-2 text-sm leading-relaxed text-text", children: highlights[1]?.content })] })] }), _jsxs(Button, { variant: "outline", size: "sm", className: "w-full justify-center gap-2 rounded-full border-border bg-white text-text hover:bg-surface-2", onClick: handleScrollToTimeline, children: ["Ver linha do tempo completa", _jsx(ChevronDown, { className: "h-4 w-4" })] })] })] }), _jsx("div", { ref: timelineRef, children: _jsx(Timeline, { events: timelineEvents, onAddEvent: openModal }) })] })), activeTab !== 'Tudo' && (_jsxs(Card, { className: "border-[#f0d9b8] bg-white/85 dark:border-slate-800 dark:bg-slate-900/70", children: [_jsxs(CardHeader, { className: "flex-row items-center justify-between space-y-0", children: [_jsx(CardTitle, { children: activeTab }), _jsx(Button, { variant: "outline", size: "sm", onClick: openModal, children: "Adicionar evento" })] }), _jsx(CardContent, { className: "space-y-3 text-sm text-text-muted", children: filteredEvents.length ? (filteredEvents.map((event) => (_jsxs("div", { className: "rounded-2xl border border-[#f0d9b8] bg-white p-3 shadow-[0_8px_20px_rgba(18,38,63,0.06)] dark:border-slate-800 dark:bg-slate-900", children: [_jsx("p", { className: "text-sm font-semibold text-text", children: event.title }), _jsx("p", { className: "text-xs text-text-subtle", children: event.description }), _jsx("p", { className: "mt-2 text-[11px] text-text-subtle", children: formatDateTime(event.date) })] }, event.id)))) : (_jsx("div", { className: "rounded-2xl border border-[#f0d9b8] bg-white p-4 text-sm text-text-muted shadow-[0_8px_20px_rgba(18,38,63,0.06)] dark:border-slate-800 dark:bg-slate-900", children: "Sem eventos para esta categoria." })) })] }))] }), _jsxs("aside", { className: "space-y-4", children: [_jsx(Card, { className: "border-[#f0d9b8] bg-white/85 dark:border-slate-800 dark:bg-slate-900/70", children: _jsxs(CardContent, { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary", children: caso.cliente
                                                                .split(' ')
                                                                .map((part) => part[0])
                                                                .slice(0, 2)
                                                                .join('') }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-text", children: caso.cliente }), _jsx("p", { className: "text-xs text-text-subtle", children: lead?.email ?? 'cliente@email.com' })] })] }), _jsx("div", { className: "rounded-2xl border border-[#f0d9b8] bg-white px-3 py-2 text-xs text-text shadow-[0_8px_20px_rgba(18,38,63,0.06)] dark:border-slate-800 dark:bg-slate-900", children: lead?.phone ?? '(11) 99999-0000' })] }) }), _jsxs(Card, { className: "border-[#f0d9b8] bg-white/85 dark:border-slate-800 dark:bg-slate-900/70", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Checklist Processual" }) }), _jsx(CardContent, { className: "space-y-2 text-sm text-text-muted", children: checklist.map((item) => (_jsxs("div", { className: "flex items-center justify-between rounded-2xl border border-[#f0d9b8] bg-white px-3 py-2 shadow-[0_8px_20px_rgba(18,38,63,0.06)] dark:border-slate-800 dark:bg-slate-900", children: [_jsx("span", { children: item.label }), _jsx("span", { className: cn('rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase', item.status === 'ok'
                                                                ? 'border-[#CFEBD8] bg-[#E8F7EE] text-[#167A3D]'
                                                                : 'border-[#F1D28A] bg-[#FFF1CC] text-[#8A5A00]'), children: item.status === 'ok' ? 'ok' : 'pendente' })] }, item.id))) })] }), _jsxs(Card, { className: "border-[#f0d9b8] bg-white/85 dark:border-slate-800 dark:bg-slate-900/70", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Documentos recentes" }) }), _jsxs(CardContent, { className: "space-y-2 text-sm text-text-muted", children: [caseDocs.slice(0, 3).map((doc) => (_jsxs("div", { className: "rounded-2xl border border-[#f0d9b8] bg-white px-3 py-2 shadow-[0_8px_20px_rgba(18,38,63,0.06)] dark:border-slate-800 dark:bg-slate-900", children: [_jsx("div", { className: "text-sm font-semibold text-text", children: doc.title }), _jsx("div", { className: "text-xs text-text-subtle", children: doc.status })] }, doc.id))), _jsx(Link, { to: "/app/documentos", className: "text-xs text-primary hover:underline", children: "Ver documentos" })] })] })] })] }) }), _jsx(Modal, { open: modalOpen, onClose: closeModal, title: "Adicionar evento", description: "Registre um novo evento juridico.", footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "ghost", onClick: closeModal, disabled: eventSaving, children: "Cancelar" }), _jsx(Button, { variant: "primary", onClick: handleSaveEvent, disabled: eventSaving, children: eventSaving ? "Salvando..." : "Salvar evento" })] }), children: _jsxs("div", { className: "space-y-4", children: [eventError && (_jsx("div", { className: "rounded-2xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger", children: eventError })),_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-xs uppercase tracking-wide text-text-subtle", children: "Titulo" }), _jsx(Input, { placeholder: "Descreva o evento", value: eventForm.title, onChange: (event) => setEventForm((prev) => ({ ...prev, title: event.target.value })) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-xs uppercase tracking-wide text-text-subtle", children: "Categoria" }), _jsxs("select", { className: "h-10 w-full rounded-2xl border border-[#f0d9b8] bg-white px-3 text-sm text-[#2a1400] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100", value: eventForm.category, onChange: (event) => setEventForm((prev) => ({ ...prev, category: event.target.value })), children: eventCategoryOptions.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-xs uppercase tracking-wide text-text-subtle", children: "Descricao" }), _jsx("textarea", { className: "min-h-[120px] w-full rounded-2xl border border-[#f0d9b8] bg-white px-3 py-2 text-sm text-[#2a1400] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100", placeholder: "Detalhes do evento", value: eventForm.description, onChange: (event) => setEventForm((prev) => ({ ...prev, description: event.target.value })) })] })] }) })] }) }));
};

















