import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from 'react';
import { ChevronLeft, ChevronRight, Calendar, Phone, Video, Users, Gavel, Clock, CheckCircle2, XCircle, AlertCircle, TrendingUp, BarChart3, Filter } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import heroLight from '@/assets/hero-light.svg';
import { PageState } from '@/components/PageState';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { cn } from '@/utils/cn';
import { useAgenda } from '@/hooks/useAgenda';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useGoogleCalendarCreate } from '@/hooks/useGoogleCalendarCreate';
const resolveStatus = (value) => {
    if (value === 'loading' || value === 'empty' || value === 'error') {
        return value;
    }
    return 'ready';
};
const weekDayLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
const monthDayLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const timeSlots = Array.from({ length: 9 }, (_, index) => {
    const hour = String(9 + index).padStart(2, '0');
    return `${hour}:00`;
});
const toIsoDate = (value) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
const addDays = (value, amount) => {
    const next = new Date(value);
    next.setDate(next.getDate() + amount);
    return next;
};
const startOfWeek = (value) => {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - date.getDay());
    return date;
};
const startOfMonth = (value) => new Date(value.getFullYear(), value.getMonth(), 1);
const endOfMonth = (value) => new Date(value.getFullYear(), value.getMonth() + 1, 0);
const toMinutes = (time) => {
    const [hour, minutes] = time.split(':').map((value) => Number(value) || 0);
    return hour * 60 + minutes;
};
const formatMonthLabel = (value) => new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(value);
const formatShortDate = (value) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(value);
// Ícones por tipo de evento
const tipoIcons = {
    reuniao: _jsx(Users, { className: "h-3.5 w-3.5" }),
    ligacao: _jsx(Phone, { className: "h-3.5 w-3.5" }),
    videochamada: _jsx(Video, { className: "h-3.5 w-3.5" }),
    audiencia: _jsx(Gavel, { className: "h-3.5 w-3.5" }),
    prazo: _jsx(Clock, { className: "h-3.5 w-3.5" }),
    default: _jsx(Calendar, { className: "h-3.5 w-3.5" }),
};
// Ícones por status
const statusIcons = {
    confirmado: _jsx(CheckCircle2, { className: "h-3.5 w-3.5" }),
    pendente: _jsx(AlertCircle, { className: "h-3.5 w-3.5" }),
    cancelado: _jsx(XCircle, { className: "h-3.5 w-3.5" }),
    concluido: _jsx(CheckCircle2, { className: "h-3.5 w-3.5" }),
};
const statusLabels = {
    confirmado: 'Confirmada',
    pendente: 'Pendente',
    cancelado: 'Cancelada',
    concluido: 'Concluida',
};
const statusStyles = {
    confirmado: {
        container: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/30 border-blue-300 dark:border-blue-700/50 text-blue-900 dark:text-blue-100',
        badge: 'bg-blue-100 dark:bg-blue-900/60 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-200',
        button: 'bg-blue-50 dark:bg-blue-800/50 text-blue-700 dark:text-blue-100 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800',
    },
    pendente: {
        container: 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/30 border-amber-300 dark:border-amber-700/50 text-amber-900 dark:text-amber-100',
        badge: 'bg-amber-100 dark:bg-amber-900/60 border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-200',
        button: 'bg-amber-50 dark:bg-amber-800/50 text-amber-700 dark:text-amber-100 border-amber-200 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-800',
    },
    cancelado: {
        container: 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/40 dark:to-red-900/30 border-red-300 dark:border-red-700/50 text-red-900 dark:text-red-100',
        badge: 'bg-red-100 dark:bg-red-900/60 border-red-200 dark:border-red-700 text-red-700 dark:text-red-200',
        button: 'bg-red-50 dark:bg-red-800/50 text-red-700 dark:text-red-100 border-red-200 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-800',
    },
    concluido: {
        container: 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/40 dark:to-emerald-900/30 border-emerald-300 dark:border-emerald-700/50 text-emerald-900 dark:text-emerald-100',
        badge: 'bg-emerald-100 dark:bg-emerald-900/60 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-200',
        button: 'bg-emerald-50 dark:bg-emerald-800/50 text-emerald-700 dark:text-emerald-100 border-emerald-200 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-800',
    },
};
const buildFormState = (overrides = {}) => {
    const now = new Date();
    return {
        title: overrides.title ?? '',
        date: overrides.date ?? toIsoDate(now),
        time: overrides.time ?? '09:00',
        durationMinutes: overrides.durationMinutes ?? 30,
        location: overrides.location ?? '',
        status: overrides.status ?? 'pendente',
    };
};
export const AgendaPage = () => {
    const { eventos: agendaItems, loading, error, createEvento, updateEvento, deleteEvento, } = useAgenda();
    const { displayName, user } = useCurrentUser();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const [viewMode, setViewMode] = React.useState('week');
    const [currentDate, setCurrentDate] = React.useState(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    });
    const [editorOpen, setEditorOpen] = React.useState(false);
    const [editorMode, setEditorMode] = React.useState('create');
    const [editingItem, setEditingItem] = React.useState(null);
    const [editorBusy, setEditorBusy] = React.useState(false);
    const [editorError, setEditorError] = React.useState(null);
    const [activeFilter, setActiveFilter] = React.useState('all');
    const [agendaAberta, setAgendaAberta] = React.useState(true);
    const [horariosAlmoco, setHorariosAlmoco] = React.useState({
        inicio: '12:00',
        fim: '13:00'
    });
    const [formState, setFormState] = React.useState(() => buildFormState());
    const { createMeeting, error: meetError } = useGoogleCalendarCreate();
    const [isCreatingGoogleMeet, setIsCreatingGoogleMeet] = React.useState(false);
    const state = resolveStatus(params.get('state'));
    const baseState = loading ? 'loading' : error ? 'error' : 'ready';
    const pageState = state !== 'ready' ? state : baseState;
    const todayIso = toIsoDate(new Date());
    const selectedIso = toIsoDate(currentDate);
    const weekStart = React.useMemo(() => startOfWeek(currentDate), [currentDate]);
    const weekEnd = React.useMemo(() => addDays(weekStart, 6), [weekStart]);
    const weekLabel = React.useMemo(() => `${formatShortDate(weekStart)} - ${formatShortDate(weekEnd)}`, [weekStart, weekEnd]);
    const monthLabel = React.useMemo(() => formatMonthLabel(currentDate), [currentDate]);
    const weekDays = React.useMemo(() => {
        return Array.from({ length: 5 }, (_, index) => {
            // Começar na segunda-feira (dia 1 da semana)
            const date = addDays(weekStart, index + 1);
            const iso = toIsoDate(date);
            return {
                label: weekDayLabels[index],
                date: date.getDate(),
                iso,
                isToday: iso === todayIso,
                isSelected: iso === selectedIso,
            };
        });
    }, [selectedIso, todayIso, weekStart]);
    const monthMatrix = React.useMemo(() => {
        const start = startOfMonth(currentDate);
        const end = endOfMonth(currentDate);
        const startWeekday = start.getDay();
        const totalDays = end.getDate();
        const totalCells = Math.ceil((startWeekday + totalDays) / 7) * 7;
        return Array.from({ length: totalCells }, (_, index) => {
            const dayNumber = index - startWeekday + 1;
            if (dayNumber < 1 || dayNumber > totalDays)
                return null;
            const date = new Date(start.getFullYear(), start.getMonth(), dayNumber);
            return {
                date,
                iso: toIsoDate(date),
                number: dayNumber,
            };
        });
    }, [currentDate]);
    const eventsByDate = React.useMemo(() => {
        const map = new Map();
        const filteredItems = activeFilter === 'all'
            ? agendaItems
            : agendaItems.filter(item => item.tipo === activeFilter);
        filteredItems.forEach((item) => {
            const list = map.get(item.date) ?? [];
            list.push(item);
            map.set(item.date, list);
        });
        map.forEach((list) => list.sort((a, b) => toMinutes(a.time) - toMinutes(b.time)));
        return map;
    }, [agendaItems, activeFilter]);
    const calendarEvents = React.useMemo(() => {
        const weekDates = new Set(weekDays.map((day) => day.iso));
        const filteredItems = activeFilter === 'all'
            ? agendaItems
            : agendaItems.filter(item => item.tipo === activeFilter);
        return filteredItems
            .filter((item) => weekDates.has(item.date))
            .map((item) => {
            const dayIndex = weekDays.findIndex((day) => day.iso === item.date);
            const slotIndex = timeSlots.findIndex((slot) => slot.split(':')[0] === item.time.split(':')[0]);
            if (dayIndex === -1 || slotIndex === -1)
                return null;
            const span = Math.max(1, Math.ceil(item.durationMinutes / 60));
            return {
                id: item.id,
                dayIndex,
                slotIndex,
                span,
                item,
            };
        })
            .filter(Boolean);
    }, [agendaItems, weekDays, activeFilter]);
    const upcomingItems = React.useMemo(() => {
        const now = new Date();
        return agendaItems
            .map((item) => ({
            item,
            at: new Date(`${item.date}T${item.time}:00`),
        }))
            .filter(({ at }) => !Number.isNaN(at.getTime()) && at >= now)
            .sort((a, b) => a.at.getTime() - b.at.getTime())
            .map(({ item }) => item);
    }, [agendaItems]);
    // Métricas
    const metrics = React.useMemo(() => {
        const now = new Date();
        const weekStart = startOfWeek(now);
        const weekEnd = addDays(weekStart, 7);
        const thisWeekEvents = agendaItems.filter(item => {
            const eventDate = new Date(item.date);
            return eventDate >= weekStart && eventDate < weekEnd;
        });
        const totalMinutes = thisWeekEvents.reduce((sum, item) => sum + (item.durationMinutes || 30), 0);
        const hoursScheduled = Math.round(totalMinutes / 60 * 10) / 10;
        const confirmed = agendaItems.filter(e => e.status === 'confirmado').length;
        const total = agendaItems.length;
        const confirmationRate = total > 0 ? Math.round((confirmed / total) * 100) : 0;
        return {
            hoursScheduled,
            eventsThisWeek: thisWeekEvents.length,
            confirmationRate
        };
    }, [agendaItems]);
    const openEditor = (mode, item) => {
        if (mode === 'edit' && item) {
            setEditorMode('edit');
            setEditingItem(item);
            setFormState(buildFormState({
                title: item.title,
                date: item.date,
                time: item.time,
                durationMinutes: item.durationMinutes || 30,
                location: item.location === 'Indefinido' ? '' : item.location,
                status: item.status,
            }));
        }
        else {
            setEditorMode('create');
            setEditingItem(null);
            setFormState(buildFormState({
                date: selectedIso,
            }));
        }
        setEditorError(null);
        setEditorOpen(true);
    };
    const closeEditor = () => {
        if (editorBusy)
            return;
        setEditorOpen(false);
        setEditingItem(null);
    };
    const handleSlotCreate = (date, time) => {
        if (!agendaAberta) {
            alert('A agenda está fechada para novos agendamentos.');
            return;
        }
        setEditorMode('create');
        setEditingItem(null);
        setFormState(buildFormState({
            date,
            time: time ?? '09:00',
        }));
        setEditorError(null);
        setEditorOpen(true);
    };
    const handleCreateLunchBreak = async () => {
        if (!user)
            return;
        const today = toIsoDate(new Date());
        const startAt = new Date(`${today}T${horariosAlmoco.inicio}:00`);
        const endAt = new Date(startAt);
        endAt.setMinutes(endAt.getMinutes() + 60);
        try {
            await createEvento({
                titulo: 'Horario de Almoco',
                data_inicio: startAt.toISOString(),
                data_fim: endAt.toISOString(),
                local: 'Escritorio',
                descricao: null,
                cliente_id: null,
                caso_id: null,
                responsavel: displayName || 'Sistema',
                tipo: 'interno',
                status: 'confirmado',
                cliente_nome: null,
                duracao_minutos: 60,
                observacoes: null,
            });
            alert('Horário de almoço bloqueado com sucesso!');
        }
        catch (err) {
            alert('Erro ao bloquear horário de almoço.');
        }
    };
    const handleSave = async () => {
        setEditorBusy(true);
        setEditorError(null);
        try {
            const title = formState.title.trim() || 'Compromisso';
            const duration = Math.max(15, Number(formState.durationMinutes) || 30);
            const startAt = new Date(`${formState.date}T${formState.time}:00`);
            const endAt = new Date(startAt);
            endAt.setMinutes(endAt.getMinutes() + duration);
            if (editorMode === 'edit' && editingItem) {
                await updateEvento(editingItem.id, {
                    titulo: title,
                    data_inicio: startAt.toISOString(),
                    data_fim: endAt.toISOString(),
                    local: formState.location.trim() || null,
                    tipo: editingItem.type || 'reuniao',
                    status: formState.status,
                    duracao_minutos: duration,
                });
            }
            else {
                await createEvento({
                    titulo: title,
                    data_inicio: startAt.toISOString(),
                    data_fim: endAt.toISOString(),
                    local: formState.location.trim() || null,
                    descricao: null,
                    cliente_id: null,
                    caso_id: null,
                    responsavel: displayName || 'Sistema',
                    tipo: editingItem?.type || 'reuniao',
                    status: formState.status,
                    cliente_nome: null,
                    duracao_minutos: duration,
                    observacoes: null,
                });
            }
            setEditorOpen(false);
            setEditingItem(null);
        }
        catch (err) {
            setEditorError(err instanceof Error ? err.message : 'Erro ao salvar evento');
        }
        finally {
            setEditorBusy(false);
        }
    };
    const handleDelete = async () => {
        if (!editingItem)
            return;
        if (!window.confirm('Deseja excluir este compromisso?'))
            return;
        setEditorBusy(true);
        setEditorError(null);
        try {
            await deleteEvento(editingItem.id);
            setEditorOpen(false);
            setEditingItem(null);
        }
        catch (err) {
            setEditorError(err instanceof Error ? err.message : 'Erro ao excluir evento');
        }
        finally {
            setEditorBusy(false);
        }
    };
    const handleNavigate = (direction) => {
        if (viewMode === 'week') {
            setCurrentDate(addDays(currentDate, direction === 'prev' ? -7 : 7));
            return;
        }
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + (direction === 'prev' ? -1 : 1), 1));
    };
    return (_jsx("div", { className: cn('min-h-screen pb-12', 'bg-[#fff6e9] text-[#1d1d1f]'), children: _jsxs("div", { className: "space-y-6", children: [_jsxs("header", { className: cn('relative overflow-hidden rounded-3xl border p-6 shadow-[0_28px_60px_-48px_rgba(199,98,0,0.8)]', 'border-[#f3c988] bg-gradient-to-br from-[#ffedd5] via-[#fff3e0] to-[#f7caaa]'), children: [_jsx("div", { className: cn('absolute inset-0 bg-no-repeat bg-right bg-[length:420px]', 'opacity-90'), style: { backgroundImage: `url(${heroLight})` } }), _jsxs("div", { className: "relative z-10 space-y-2", children: [_jsx("p", { className: cn('text-[11px] uppercase tracking-[0.32em]', 'text-text-muted'), children: "Agenda juridica" }), _jsx("h2", { className: cn('font-display text-3xl', 'text-text'), children: "Agenda juridica" }), _jsxs("p", { className: cn('text-sm', 'text-slate-700'), children: ["Bom dia, ", displayName] })] })] }), _jsx(PageState, { status: pageState, emptyTitle: "Nenhum compromisso encontrado", children: _jsx(Card, { className: cn('border', 'border-[#f0d9b8] bg-white/95'), style: {
                            backgroundColor: 'var(--agenda-card)',
                            borderColor: 'var(--agenda-border)',
                            boxShadow: 'var(--agenda-shadow)',
                        }, children: _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "grid gap-3 sm:grid-cols-3", children: [_jsxs("div", { className: "flex items-center gap-3 rounded-2xl border border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 p-4 shadow-sm", children: [_jsx("div", { className: "rounded-xl bg-blue-500 dark:bg-blue-600 p-2", children: _jsx(Clock, { className: "h-5 w-5 text-white" }) }), _jsxs("div", { children: [_jsxs("p", { className: "text-2xl font-bold text-blue-700 dark:text-blue-200", children: [metrics.hoursScheduled, "h"] }), _jsx("p", { className: "text-xs text-blue-600 dark:text-blue-300", children: "Esta semana" })] })] }), _jsxs("div", { className: "flex items-center gap-3 rounded-2xl border border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 p-4 shadow-sm", children: [_jsx("div", { className: "rounded-xl bg-green-500 dark:bg-green-600 p-2", children: _jsx(BarChart3, { className: "h-5 w-5 text-white" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold text-green-700 dark:text-green-200", children: metrics.eventsThisWeek }), _jsx("p", { className: "text-xs text-green-600 dark:text-green-300", children: "Eventos" })] })] }), _jsxs("div", { className: "flex items-center gap-3 rounded-2xl border border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 p-4 shadow-sm", children: [_jsx("div", { className: "rounded-xl bg-purple-500 dark:bg-purple-600 p-2", children: _jsx(TrendingUp, { className: "h-5 w-5 text-white" }) }), _jsxs("div", { children: [_jsxs("p", { className: "text-2xl font-bold text-purple-700 dark:text-purple-200", children: [metrics.confirmationRate, "%"] }), _jsx("p", { className: "text-xs text-purple-600 dark:text-purple-300", children: "Taxa confirma\u00E7\u00E3o" })] })] })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx(Filter, { className: "h-4 w-4 text-slate-600 dark:text-slate-300" }), _jsx("button", { onClick: () => setActiveFilter('all'), className: cn('rounded-full border px-3 py-1 text-xs font-medium transition-all', activeFilter === 'all'
                                                ? 'border-emerald-600 bg-emerald-600 text-white shadow-md hover:bg-emerald-700'
                                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-emerald-600/30 dark:hover:border-emerald-600/50'), children: "Todos" }), _jsxs("button", { onClick: () => setActiveFilter('reuniao'), className: cn('flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-all', activeFilter === 'reuniao'
                                                ? 'border-primary bg-primary text-white shadow-md hover:bg-primary/90'
                                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-primary/30 dark:hover:border-primary/50'), children: [_jsx(Users, { className: "h-3 w-3" }), "Reuni\u00E3o"] }), _jsxs("button", { onClick: () => setActiveFilter('ligacao'), className: cn('flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-all', activeFilter === 'ligacao'
                                                ? 'border-primary bg-primary text-white shadow-md hover:bg-primary/90'
                                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-primary/30 dark:hover:border-primary/50'), children: [_jsx(Phone, { className: "h-3 w-3" }), "Liga\u00E7\u00E3o"] }), _jsxs("button", { onClick: () => setActiveFilter('audiencia'), className: cn('flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-all', activeFilter === 'audiencia'
                                                ? 'border-primary bg-primary text-white shadow-md hover:bg-primary/90'
                                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-primary/30 dark:hover:border-primary/50'), children: [_jsx(Gavel, { className: "h-3 w-3" }), "Audi\u00EAncia"] })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 p-3", children: [_jsx("div", { className: "flex items-center gap-2", children: _jsxs("button", { onClick: () => setAgendaAberta(!agendaAberta), className: cn('flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all', agendaAberta
                                                    ? 'border-green-300 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                                    : 'border-red-300 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'), children: [agendaAberta ? _jsx(CheckCircle2, { className: "h-4 w-4" }) : _jsx(XCircle, { className: "h-4 w-4" }), agendaAberta ? 'Agenda Aberta' : 'Agenda Fechada'] }) }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Clock, { className: "h-4 w-4 text-slate-600 dark:text-slate-300" }), _jsx("span", { className: "text-xs text-slate-700 dark:text-slate-200", children: "Almo\u00E7o:" }), _jsxs("select", { value: horariosAlmoco.inicio, onChange: (e) => setHorariosAlmoco(prev => ({ ...prev, inicio: e.target.value })), className: "rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-slate-100 text-slate-700 px-2 py-1 text-xs", children: [_jsx("option", { value: "12:00", children: "12:00" }), _jsx("option", { value: "12:30", children: "12:30" }), _jsx("option", { value: "13:00", children: "13:00" })] }), _jsx("span", { className: "text-xs text-slate-700 dark:text-slate-200", children: "at\u00E9" }), _jsxs("select", { value: horariosAlmoco.fim, onChange: (e) => setHorariosAlmoco(prev => ({ ...prev, fim: e.target.value })), className: "rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-slate-100 text-slate-700 px-2 py-1 text-xs", children: [_jsx("option", { value: "13:00", children: "13:00" }), _jsx("option", { value: "13:30", children: "13:30" }), _jsx("option", { value: "14:00", children: "14:00" })] }), _jsxs("button", { onClick: handleCreateLunchBreak, className: "flex items-center gap-1 rounded-lg border border-amber-500 dark:border-amber-600 bg-amber-500 dark:bg-amber-600 px-3 py-1 text-xs font-semibold text-white transition-all hover:bg-amber-600 dark:hover:bg-amber-700 shadow-sm", children: [_jsx(Clock, { className: "h-3 w-3" }), "Bloquear Almo\u00E7o"] })] })] }), _jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm text-text dark:text-slate-200", children: [_jsx(Button, { variant: "outline", size: "sm", className: cn('border', 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-white'), onClick: () => handleNavigate('prev'), children: _jsx(ChevronLeft, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "outline", size: "sm", className: cn('border', 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-white'), onClick: () => handleNavigate('next'), children: _jsx(ChevronRight, { className: "h-4 w-4" }) }), _jsx("span", { className: "text-sm font-semibold", children: viewMode === 'week' ? weekLabel : monthLabel })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("div", { className: "inline-flex rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-1 text-xs", children: [_jsx("button", { type: "button", className: cn('rounded-lg px-3 py-1.5 font-medium transition-all', viewMode === 'week'
                                                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 shadow-sm border border-slate-200 dark:border-slate-600'
                                                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'), onClick: () => setViewMode('week'), children: "Semana" }), _jsx("button", { type: "button", className: cn('rounded-lg px-3 py-1.5 font-medium transition-all', viewMode === 'month'
                                                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 shadow-sm border border-slate-200 dark:border-slate-600'
                                                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'), onClick: () => setViewMode('month'), children: "Mes" })] }), _jsx(Button, { variant: "primary", size: "sm", onClick: () => openEditor('create'), children: "+ Novo Evento" })] })] }), _jsxs("div", { className: "grid gap-4 xl:grid-cols-[2.3fr_1fr]", children: [_jsx("div", { className: "rounded-3xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/50 p-4", children: viewMode === 'week' ? (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "grid grid-cols-[60px_repeat(5,1fr)] gap-2", children: [_jsx("div", { className: "text-xs font-medium text-slate-500 dark:text-slate-400" }), weekDays.map((day) => (_jsxs("div", { className: cn('rounded-xl py-2 text-center text-sm font-semibold', day.isToday
                                                                    ? 'bg-emerald-500 text-white'
                                                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'), children: [_jsx("div", { className: "text-xs opacity-80", children: day.label }), _jsx("div", { className: "text-base", children: day.date })] }, day.iso)))] }), _jsx("div", { className: "space-y-1", children: timeSlots.map((slot) => (_jsxs("div", { className: "grid grid-cols-[60px_repeat(5,1fr)] gap-2", children: [_jsx("div", { className: "text-right pr-3 pt-2 text-sm font-bold text-slate-800 dark:text-slate-100", style: { height: '6rem' }, children: slot }), weekDays.map((day) => {
                                                                    // Encontrar eventos para este dia e horário
                                                                    const slotEvents = calendarEvents.filter(e => e.dayIndex === weekDays.findIndex(d => d.iso === day.iso) &&
                                                                        timeSlots[e.slotIndex] === slot);
                                                                    return (_jsxs("div", { className: "relative", style: { height: '6rem' }, children: [_jsx("button", { type: "button", className: "absolute inset-0 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-700/20 transition hover:bg-slate-100 dark:hover:bg-slate-700/40 hover:shadow-sm group", onClick: () => handleSlotCreate(day.iso, slot), children: _jsx("span", { className: "absolute inset-0 flex items-center justify-center text-2xl font-light text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity", children: "+" }) }), slotEvents.map((event) => {
                                                                                const styles = statusStyles[event.item.status] ?? statusStyles.pendente;
                                                                                const tipoIcon = tipoIcons[event.item.tipo || 'default'] || tipoIcons.default;
                                                                                const statusIcon = statusIcons[event.item.status];
                                                                                return (_jsxs("div", { role: "button", tabIndex: 0, className: cn('absolute inset-1 z-10 cursor-pointer rounded-xl border px-2 py-2 text-left shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl overflow-hidden', styles.container), style: {
                                                                                        height: event.span > 1 ? `calc(${event.span * 6}rem + ${(event.span - 1) * 0.25}rem - 0.5rem)` : 'calc(100% - 0.5rem)'
                                                                                    }, onClick: () => openEditor('edit', event.item), onKeyDown: (eventKey) => {
                                                                                        if (eventKey.key === 'Enter' || eventKey.key === ' ') {
                                                                                            openEditor('edit', event.item);
                                                                                        }
                                                                                    }, children: [_jsxs("div", { className: "flex items-center justify-between text-[0.625rem] font-semibold mb-1", children: [_jsxs("div", { className: "flex items-center gap-1", children: [tipoIcon, _jsx("span", { children: event.item.time })] }), _jsxs("span", { className: "rounded-full bg-white/50 dark:bg-slate-900/50 px-1.5 py-0.5 text-[0.5625rem]", children: [event.item.durationMinutes || 30, "min"] })] }), _jsx("div", { className: "text-[0.75rem] font-bold leading-tight truncate", children: event.item.title }), _jsx("div", { className: "text-[0.625rem] mt-0.5 opacity-90 truncate", children: event.item.cliente }), _jsx("div", { className: "mt-1 flex items-center gap-1 flex-wrap", children: _jsxs("span", { className: cn('inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[0.5625rem] font-semibold', styles.badge), children: [statusIcon, _jsx("span", { className: "hidden sm:inline", children: statusLabels[event.item.status] })] }) })] }, event.id));
                                                                            })] }, `${day.iso}-${slot}`));
                                                                })] }, slot))) })] })) : (_jsxs("div", { className: "space-y-3", children: [_jsx("div", { className: "grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-600 dark:text-slate-300", children: monthDayLabels.map((label, index) => (_jsx("span", { children: label }, `${label}-${index}`))) }), _jsx("div", { className: "grid grid-cols-7 gap-2 text-xs", children: monthMatrix.map((day, index) => {
                                                            if (!day) {
                                                                return (_jsx("div", { className: "min-h-[110px] rounded-2xl border border-transparent" }, `empty-${index}`));
                                                            }
                                                            const dayEvents = eventsByDate.get(day.iso) ?? [];
                                                            const isToday = day.iso === todayIso;
                                                            const isSelected = day.iso === selectedIso;
                                                            return (_jsxs("div", { className: cn('min-h-[110px] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/30 p-2 transition hover:bg-white dark:hover:bg-slate-800/60', isSelected && 'border-primary/40 dark:border-blue-600'), onClick: () => handleSlotCreate(day.iso), role: "button", tabIndex: 0, onKeyDown: (eventKey) => {
                                                                    if (eventKey.key === 'Enter' || eventKey.key === ' ') {
                                                                        handleSlotCreate(day.iso);
                                                                    }
                                                                }, children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', isToday && 'bg-primary/15 dark:bg-blue-900/40 text-primary dark:text-blue-200', isSelected && 'bg-primary dark:bg-blue-600 text-white'), children: day.number }), dayEvents.length > 0 && (_jsxs("span", { className: "text-[10px] font-medium text-slate-600 dark:text-slate-300", children: [dayEvents.length, " eventos"] }))] }), _jsxs("div", { className: "mt-2 space-y-1", children: [dayEvents.slice(0, 3).map((event) => (_jsxs("button", { type: "button", className: "w-full rounded-xl border border-slate-200 dark:border-slate-600/50 bg-slate-50 dark:bg-slate-700/40 px-2 py-1 text-left text-[11px] text-slate-700 dark:text-slate-100 shadow-sm dark:shadow-slate-900/20 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition", onClick: (eventClick) => {
                                                                                    eventClick.stopPropagation();
                                                                                    openEditor('edit', event);
                                                                                }, children: [_jsx("div", { className: "truncate font-semibold", children: event.title }), _jsx("div", { className: "text-[10px] text-slate-600 dark:text-slate-300 font-medium", children: event.time })] }, event.id))), dayEvents.length > 3 && (_jsxs("div", { className: "text-[10px] font-medium text-slate-600 dark:text-slate-300", children: ["+", dayEvents.length - 3, " compromissos"] }))] })] }, day.iso));
                                                        }) })] })) }), _jsxs("div", { className: "space-y-4", children: [_jsx(Card, { className: "border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50", children: _jsxs(CardContent, { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between text-sm text-slate-900 dark:text-slate-100", children: [_jsx("span", { className: "font-semibold", children: "Calendario" }), _jsx("span", { className: "text-xs text-slate-600 dark:text-slate-300 font-medium", children: monthLabel })] }), _jsxs("div", { className: "grid grid-cols-7 gap-2 text-center text-xs text-slate-600 dark:text-slate-300 font-medium", children: [monthDayLabels.map((label, index) => (_jsx("span", { children: label }, `${label}-${index}`))), monthMatrix.map((day, index) => {
                                                                        if (!day) {
                                                                            return (_jsx("span", { className: "py-1 text-transparent", children: "0" }, `empty-mini-${index}`));
                                                                        }
                                                                        const hasEvents = eventsByDate.has(day.iso);
                                                                        const isSelected = day.iso === selectedIso;
                                                                        const isToday = day.iso === todayIso;
                                                                        return (_jsxs("button", { type: "button", className: cn('relative rounded-full py-1 text-xs font-medium transition hover:bg-emerald-50 dark:hover:bg-emerald-900/30', isSelected && 'bg-emerald-600 dark:bg-emerald-600 text-white font-bold', !isSelected && isToday && 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-200 font-bold ring-2 ring-emerald-300 dark:ring-emerald-600', hasEvents && !isSelected && !isToday && 'font-semibold text-slate-700 dark:text-slate-100', !hasEvents && !isSelected && !isToday && 'text-slate-600 dark:text-slate-300'), onClick: () => setCurrentDate(day.date), children: [day.number, hasEvents && (_jsx("span", { className: cn("absolute -bottom-0.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full", isSelected ? "bg-white" : "bg-emerald-600 dark:bg-emerald-400") }))] }, day.iso));
                                                                    })] }), _jsxs("div", { className: "space-y-2 text-xs", children: [_jsxs("div", { className: "flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium", children: [_jsx("div", { className: "flex h-3 w-3 items-center justify-center rounded-full bg-blue-500", children: _jsx(CheckCircle2, { className: "h-2 w-2 text-white" }) }), _jsx("span", { children: "Confirmada" })] }), _jsxs("div", { className: "flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium", children: [_jsx("div", { className: "flex h-3 w-3 items-center justify-center rounded-full bg-amber-500", children: _jsx(AlertCircle, { className: "h-2 w-2 text-white" }) }), _jsx("span", { children: "Pendente" })] }), _jsxs("div", { className: "flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium", children: [_jsx("div", { className: "flex h-3 w-3 items-center justify-center rounded-full bg-red-500", children: _jsx(XCircle, { className: "h-2 w-2 text-white" }) }), _jsx("span", { children: "Cancelada" })] })] })] }) }), _jsx(Card, { className: "border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/50", children: _jsxs(CardContent, { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between text-sm text-slate-900 dark:text-slate-100", children: [_jsx("span", { className: "font-semibold", children: "Proximas reunioes" }), _jsx("button", { type: "button", className: "text-xs font-medium text-emerald-600 dark:text-emerald-300 hover:underline", onClick: () => navigate('/app/agenda'), children: "Ver todos" })] }), upcomingItems.length === 0 ? (_jsx("p", { className: "text-xs text-slate-700 dark:text-slate-300 font-medium", children: "Nenhum compromisso agendado." })) : (upcomingItems.slice(0, 4).map((item) => {
                                                                const itemDate = new Date(`${item.date}T${item.time}:00`);
                                                                const now = new Date();
                                                                const diff = itemDate.getTime() - now.getTime();
                                                                const hours = Math.floor(diff / (1000 * 60 * 60));
                                                                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                                                                const timeUntil = hours > 24
                                                                    ? `em ${Math.floor(hours / 24)} dias`
                                                                    : hours > 0
                                                                        ? `em ${hours}h ${minutes}min`
                                                                        : `em ${minutes}min`;
                                                                const tipoIcon = tipoIcons[item.tipo || 'default'] || tipoIcons.default;
                                                                const styles = statusStyles[item.status] || statusStyles.pendente;
                                                                return (_jsx("button", { type: "button", className: cn("w-full rounded-2xl border p-3 text-left transition-all hover:scale-[1.02] hover:shadow-lg", styles.container), onClick: () => openEditor('edit', item), children: _jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-1.5 mb-1", children: [tipoIcon, _jsx("p", { className: "font-semibold text-sm leading-tight text-slate-900 dark:text-slate-50", children: item.title })] }), _jsxs("p", { className: "text-xs opacity-90 text-slate-700 dark:text-slate-200", children: [item.time, " \u2022 ", item.cliente || 'Sem cliente'] }), diff < 2 * 60 * 60 * 1000 && diff > 0 && (_jsxs("p", { className: "text-xs font-semibold mt-1 opacity-90", children: ["\u23F0 ", timeUntil] }))] }), statusIcons[item.status]] }) }, item.id));
                                                            }))] }) })] })] })] }) }) }), _jsx(Modal, { open: editorOpen, onClose: closeEditor, title: editorMode === 'edit' ? 'Editar compromisso' : 'Novo compromisso', description: "Atualize os detalhes do compromisso.", footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "ghost", onClick: closeEditor, disabled: editorBusy, children: "Fechar" }), editorMode === 'edit' && (_jsx(Button, { variant: "danger", onClick: handleDelete, disabled: editorBusy, children: "Excluir" })), _jsx(Button, { variant: "primary", onClick: handleSave, disabled: editorBusy, children: editorMode === 'edit' ? 'Salvar' : 'Criar' })] }), children: _jsxs("div", { className: "space-y-4", children: [editorError && (_jsx("div", { className: "rounded-2xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger", children: editorError })), _jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [_jsxs("div", { className: "space-y-1 sm:col-span-2", children: [_jsx("span", { className: "text-xs uppercase tracking-wide font-semibold text-slate-600 dark:text-slate-300", children: "Titulo" }), _jsx(Input, { value: formState.title, onChange: (event) => setFormState((prev) => ({
                                                    ...prev,
                                                    title: event.target.value,
                                                })) })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("span", { className: "text-xs uppercase tracking-wide font-semibold text-slate-600 dark:text-slate-300", children: "Data" }), _jsx(Input, { type: "date", value: formState.date, onChange: (event) => setFormState((prev) => ({
                                                    ...prev,
                                                    date: event.target.value,
                                                })) })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("span", { className: "text-xs uppercase tracking-wide font-semibold text-slate-600 dark:text-slate-300", children: "Hora" }), _jsx(Input, { type: "time", value: formState.time, onChange: (event) => setFormState((prev) => ({
                                                    ...prev,
                                                    time: event.target.value,
                                                })) })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("span", { className: "text-xs uppercase tracking-wide font-semibold text-slate-600 dark:text-slate-300", children: "Duracao (min)" }), _jsx(Input, { type: "number", min: 15, step: 15, value: formState.durationMinutes, onChange: (event) => setFormState((prev) => ({
                                                    ...prev,
                                                    durationMinutes: Number(event.target.value) || 0,
                                                })) })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("span", { className: "text-xs uppercase tracking-wide font-semibold text-slate-600 dark:text-slate-300", children: "Status" }), _jsxs("select", { className: "h-10 w-full rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-slate-100 shadow-soft focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20", value: formState.status, onChange: (event) => setFormState((prev) => ({
                                                    ...prev,
                                                    status: event.target.value,
                                                })), children: [_jsx("option", { value: "confirmado", children: "Confirmada" }), _jsx("option", { value: "pendente", children: "Pendente" }), _jsx("option", { value: "cancelado", children: "Cancelada" })] })] }), _jsxs("div", { className: "space-y-1 sm:col-span-2", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-xs uppercase tracking-wide font-semibold text-slate-600 dark:text-slate-300", children: "Local" }), formState.title && formState.date && formState.time && (_jsx(Button, { variant: "outline", size: "sm", onClick: async () => {
                                                            setIsCreatingGoogleMeet(true);
                                                            try {
                                                                const startTime = new Date(`${formState.date}T${formState.time}`);
                                                                const endTime = new Date(startTime.getTime() + formState.durationMinutes * 60 * 1000);
                                                                const result = await createMeeting({
                                                                    title: formState.title,
                                                                    startTime,
                                                                    endTime,
                                                                    videoConference: true,
                                                                });
                                                                // Extrair link do Google Meet
                                                                const meetLink = result.conferenceData?.entryPoints?.find((ep) => ep.entryPointType === 'video')?.uri || '';
                                                                if (meetLink) {
                                                                    setFormState((prev) => ({
                                                                        ...prev,
                                                                        location: meetLink,
                                                                    }));
                                                                    // Copiar para clipboard
                                                                    navigator.clipboard.writeText(meetLink).catch(() => { });
                                                                }
                                                            }
                                                            catch (err) {
                                                                console.error('Erro ao criar Google Meet:', err);
                                                            }
                                                            finally {
                                                                setIsCreatingGoogleMeet(false);
                                                            }
                                                        }, disabled: isCreatingGoogleMeet, className: "gap-1.5", children: isCreatingGoogleMeet ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent" }), _jsx("span", { className: "text-xs", children: "Gerando..." })] })) : (_jsxs(_Fragment, { children: [_jsx(Video, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "text-xs", children: "Gerar Google Meet" })] })) }))] }), _jsx(Input, { value: formState.location, onChange: (event) => setFormState((prev) => ({
                                                    ...prev,
                                                    location: event.target.value,
                                                })), placeholder: "Clique em 'Gerar Google Meet' ou digite um local" }), meetError && (_jsxs("div", { className: "mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs space-y-2", children: [_jsx("p", { className: "font-semibold", children: "\u26A0\uFE0F Erro ao gerar Google Meet" }), _jsx("p", { children: meetError.message }), meetError.message.includes('não está conectado') && (_jsxs("div", { className: "bg-red-100 p-2 rounded mt-2 space-y-2", children: [_jsx("p", { className: "font-medium", children: "\uD83D\uDE80 Conectar Google Calendar:" }), _jsx("p", { className: "text-xs text-red-600", children: "Execute no terminal:" }), _jsx("code", { className: "block bg-red-900/20 p-1 rounded font-mono text-red-900 break-all", children: "npm run connect:google" }), _jsx("p", { className: "text-xs text-red-600 mt-1", children: "Depois autorize no Google e est\u00E1 pronto! \u2728" })] }))] }))] })] })] }) })] }) }));
};
