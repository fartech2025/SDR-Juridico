import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Database } from 'lucide-react';
import { toast } from 'sonner';
import heroLight from '@/assets/hero-light.svg';
import { DatabasePage } from '@/pages/DatabasePage';
import { PageState } from '@/components/PageState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { cn } from '@/utils/cn';
import { useIntegrations } from '@/hooks/useIntegrations';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { supabase } from '@/lib/supabaseClient';
const tabs = ['Essencial', 'Avancado', 'Database'];
const resolveStatus = (value) => {
    if (value === 'loading' || value === 'empty' || value === 'error') {
        return value;
    }
    return 'ready';
};
const statusVariant = (status) => {
    if (status === 'connected')
        return 'success';
    if (status === 'disconnected')
        return 'warning';
    return 'info';
};
const matchesKey = (value, key) => {
    const lower = value.toLowerCase();
    if (lower.includes(key))
        return true;
    return lower.replace(/\s+/g, '_').includes(key);
};
export const ConfigPage = () => {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const state = resolveStatus(params.get('state'));
    const [activeTab, setActiveTab] = React.useState('Essencial');
    const [selectedIntegration, setSelectedIntegration] = React.useState(null);
    const [integrationBusy, setIntegrationBusy] = React.useState(false);
    const [calendarId, setCalendarId] = React.useState('');
    const { orgId } = useCurrentUser();
    const { integrations, loading, error, createDefaultIntegrations, updateIntegration, } = useIntegrations();
    const dedupedIntegrations = React.useMemo(() => {
        const byKey = new Map();
        integrations.forEach((integration) => {
            const key = integration.name.toLowerCase().trim();
            const existing = byKey.get(key);
            if (!existing) {
                byKey.set(key, integration);
                return;
            }
            if (existing.status !== 'connected' && integration.status === 'connected') {
                byKey.set(key, integration);
            }
        });
        return Array.from(byKey.values());
    }, [integrations]);
    const filteredIntegrations = React.useMemo(() => {
        if (activeTab === 'Database') {
            return [];
        }
        if (activeTab === 'Essencial') {
            return dedupedIntegrations.filter((integration) => ['whatsapp', 'google_calendar', 'email'].some((key) => matchesKey(integration.name, key)));
        }
        // Aba Avançado: mostra todas exceto whatsapp
        return dedupedIntegrations.filter((integration) => !integration.name.toLowerCase().includes('whatsapp'));
    }, [activeTab, dedupedIntegrations]);
    const baseState = loading
        ? 'loading'
        : error
            ? 'error'
            : filteredIntegrations.length === 0
                ? 'empty'
                : 'ready';
    const pageState = state !== 'ready' ? state : baseState;
    const canSeed = !loading && integrations.length === 0;
    const selectedIsGoogleCalendar = selectedIntegration
        ? matchesKey(selectedIntegration.name, 'google_calendar')
        : false;
    const googleCalendarStatus = params.get('google_calendar');
    const resolveCalendarId = (integration) => {
        const settings = integration?.settings;
        if (settings && typeof settings === 'object' && 'calendar_id' in settings) {
            const value = settings.calendar_id;
            return typeof value === 'string' ? value : '';
        }
        return '';
    };
    const buildGoogleCalendarSettings = (overrides = {}) => {
        const baseSettings = selectedIntegration?.settings && typeof selectedIntegration.settings === 'object'
            ? selectedIntegration.settings
            : {};
        const next = { ...baseSettings, ...overrides };
        const trimmedCalendarId = calendarId.trim();
        if (trimmedCalendarId) {
            next.calendar_id = trimmedCalendarId;
        }
        else if ('calendar_id' in next) {
            delete next.calendar_id;
        }
        return next;
    };
    const handleGoogleCalendarConnect = async () => {
        if (!selectedIntegration)
            return;
        setIntegrationBusy(true);
        try {
            const settings = buildGoogleCalendarSettings({
                linked_at: new Date().toISOString(),
            });
            await updateIntegration(selectedIntegration.id, { settings });
            setSelectedIntegration((prev) => (prev ? { ...prev, settings } : prev));
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            if (!supabaseUrl) {
                throw new Error('Supabase nao configurado.');
            }
            if (!orgId) {
                throw new Error('Organizacao nao encontrada.');
            }
            const returnTo = `${window.location.origin}/app/config`;
            const oauthUrl = new URL(`${supabaseUrl.replace(/\/$/, '')}/functions/v1/google-calendar-oauth`);
            oauthUrl.searchParams.set('integration_id', selectedIntegration.id);
            oauthUrl.searchParams.set('org_id', orgId);
            oauthUrl.searchParams.set('return_to', returnTo);
            window.location.href = oauthUrl.toString();
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao atualizar integracao';
            toast.error(message);
            setIntegrationBusy(false);
        }
        finally {
            if (!document.hidden) {
                setIntegrationBusy(false);
            }
        }
    };
    const handleGoogleCalendarDisconnect = async () => {
        if (!selectedIntegration)
            return;
        setIntegrationBusy(true);
        try {
            const settings = buildGoogleCalendarSettings({
                unlinked_at: new Date().toISOString(),
            });
            await updateIntegration(selectedIntegration.id, {
                enabled: false,
                settings,
            });
            setSelectedIntegration((prev) => prev ? { ...prev, status: 'disconnected', settings } : prev);
            toast.success('Google Calendar desvinculado.');
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao atualizar integracao';
            toast.error(message);
        }
        finally {
            setIntegrationBusy(false);
        }
    };
    const handleGoogleCalendarSave = async () => {
        if (!selectedIntegration)
            return;
        setIntegrationBusy(true);
        try {
            const settings = buildGoogleCalendarSettings({
                updated_at: new Date().toISOString(),
            });
            await updateIntegration(selectedIntegration.id, { settings });
            setSelectedIntegration((prev) => (prev ? { ...prev, settings } : prev));
            toast.success('Configuracao do Google Calendar salva.');
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao salvar configuracao';
            toast.error(message);
        }
        finally {
            setIntegrationBusy(false);
        }
    };
    const handleGoogleCalendarSync = async () => {
        if (!orgId) {
            toast.error('Organizacao nao encontrada.');
            return;
        }
        setIntegrationBusy(true);
        try {
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            const accessToken = sessionData?.session?.access_token;
            if (sessionError || !accessToken) {
                throw new Error('Sessao expirada. Faca login novamente.');
            }
            const { data, error: syncError } = await supabase.functions.invoke('google-calendar-sync', {
                body: { org_id: orgId },
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (syncError) {
                throw syncError;
            }
            toast.success('Sincronizacao concluida.');
            if (data?.created || data?.updated || data?.pushed) {
                toast.success(`Sync: +${data.created || 0} novos, ${data.updated || 0} atualizados, ${data.pushed || 0} enviados.`);
            }
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao sincronizar agenda';
            toast.error(message);
        }
        finally {
            setIntegrationBusy(false);
        }
    };
    React.useEffect(() => {
        if (!selectedIntegration || !selectedIsGoogleCalendar) {
            setCalendarId('');
            return;
        }
        setCalendarId(resolveCalendarId(selectedIntegration));
    }, [selectedIntegration, selectedIsGoogleCalendar]);
    React.useEffect(() => {
        if (!googleCalendarStatus)
            return;
        if (googleCalendarStatus === 'connected') {
            toast.success('Google Calendar conectado.');
        }
        else if (googleCalendarStatus === 'error') {
            toast.error('Falha ao conectar Google Calendar.');
        }
    }, [googleCalendarStatus]);
    return (_jsx("div", { className: cn('min-h-screen pb-12', 'bg-[#fff6e9] text-[#1d1d1f]'), children: _jsxs("div", { className: "space-y-5", children: [_jsxs("header", { className: cn('relative overflow-hidden rounded-3xl border p-6 shadow-[0_28px_60px_-48px_rgba(199,98,0,0.8)]', 'border-[#f3c988] bg-gradient-to-br from-[#ffedd5] via-[#fff3e0] to-[#f7caaa]'), children: [_jsx("div", { className: cn('absolute inset-0 bg-no-repeat bg-right bg-[length:520px]', 'opacity-90'), style: { backgroundImage: `url(${heroLight})` } }), _jsxs("div", { className: "relative z-10 space-y-2", children: [_jsx("p", { className: cn('text-xs uppercase tracking-[0.3em]', 'text-text-muted'), children: "Configuracoes" }), _jsx("h2", { className: cn('font-display text-2xl', 'text-text'), children: "Preferencias" }), _jsx("p", { className: cn('text-sm', 'text-text-muted'), children: "Controle integracoes e ajustes operacionais." })] })] }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [tabs.map((tab) => (_jsx("button", { type: "button", onClick: () => setActiveTab(tab), className: cn('rounded-full border px-4 py-1.5 text-xs uppercase tracking-wide transition', activeTab === tab
                                ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-600'
                                : 'border-[#f0d9b8] bg-white text-[#7a4a1a] hover:text-[#2a1400]'), children: tab }, tab))), canSeed && (_jsx(Button, { variant: "primary", size: "sm", onClick: async () => {
                                try {
                                    await createDefaultIntegrations();
                                    toast.success('Integracoes padrao criadas.');
                                }
                                catch (err) {
                                    const message = err instanceof Error ? err.message : 'Erro ao criar integracoes';
                                    toast.error(message);
                                }
                            }, className: "rounded-full", children: "Criar integracoes padrao" }))] }), activeTab === 'Database' ? (_jsx(DatabasePage, {})) : (_jsx(PageState, { status: pageState, emptyTitle: "Nenhuma integracao cadastrada", children: _jsxs("div", { className: "grid gap-4 xl:grid-cols-[2fr_1fr]", children: [_jsx("div", { className: "grid gap-4 lg:grid-cols-2", children: filteredIntegrations.map((integration) => {
                                    const isGoogleCalendar = matchesKey(integration.name, 'google_calendar');
                                    const actionLabel = isGoogleCalendar
                                        ? integration.status === 'connected'
                                            ? 'Gerenciar'
                                            : 'Vincular'
                                        : 'Configurar';
                                    return (_jsxs(Card, { className: cn('border', 'border-[#f0d9b8] bg-white/95'), children: [_jsxs(CardHeader, { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsx(CardTitle, { className: "text-sm", children: integration.name }), _jsx(Badge, { variant: statusVariant(integration.status), children: integration.status })] }), _jsx("p", { className: "text-xs text-text-muted", children: integration.description })] }), _jsx(CardContent, { className: "flex gap-2", children: integration.name.toLowerCase().includes('datajud') ? (_jsxs(Button, { variant: "primary", size: "sm", onClick: () => navigate('/app/datajud'), className: "!bg-emerald-600 !text-white hover:!bg-emerald-500 !border-0", children: [_jsx(Database, { className: "h-4 w-4 mr-2" }), "Acessar API"] })) : (_jsx(Button, { variant: "outline", size: "sm", onClick: () => setSelectedIntegration(integration), className: "!bg-emerald-600 !text-white hover:!bg-emerald-500 !border-0", children: actionLabel })) })] }, integration.id));
                                }) }), _jsxs(Card, { className: cn('border', 'border-border bg-surface/90'), children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-sm", children: "Pendencias operacionais" }) }), _jsx(CardContent, { className: "space-y-3 text-xs text-text-muted", children: [
                                            'Revisar conexao do WhatsApp.',
                                            'Atualizar credenciais do Supabase.',
                                            'Validar webhook do CRM.',
                                        ].map((item) => (_jsxs("div", { className: cn('flex items-center justify-between rounded-2xl border px-3 py-2 shadow-soft', 'border-border bg-white'), children: [_jsx("span", { children: item }), _jsx(Button, { variant: "ghost", size: "sm", children: "Revisar" })] }, item))) })] })] }) })), _jsx(Modal, { open: Boolean(selectedIntegration), onClose: () => setSelectedIntegration(null), title: selectedIntegration?.name, description: "Configuracao da integracao.", footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "ghost", onClick: () => setSelectedIntegration(null), disabled: integrationBusy, children: "Fechar" }), selectedIsGoogleCalendar ? (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "outline", onClick: handleGoogleCalendarSave, disabled: integrationBusy, children: "Salvar ajustes" }), _jsx(Button, { variant: "secondary", onClick: handleGoogleCalendarSync, disabled: integrationBusy, children: "Sincronizar agora" }), selectedIntegration?.status === 'connected' ? (_jsx(Button, { variant: "danger", onClick: handleGoogleCalendarDisconnect, disabled: integrationBusy, children: "Desvincular" })) : (_jsx(Button, { variant: "primary", onClick: handleGoogleCalendarConnect, disabled: integrationBusy, children: "Vincular Google Calendar" }))] })) : (_jsx(Button, { variant: "primary", onClick: () => setSelectedIntegration(null), disabled: integrationBusy, children: "Salvar" }))] }), children: selectedIntegration && (_jsxs("div", { className: "space-y-3 text-sm text-text-muted", children: [selectedIsGoogleCalendar && (_jsx("div", { className: cn('rounded-2xl border px-3 py-3 text-xs shadow-soft', 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700'), children: "Use o botao abaixo para vincular ou desvincular sua conta do Google Calendar." })), selectedIsGoogleCalendar && (_jsxs("div", { className: "space-y-2", children: [_jsx("span", { className: "text-xs uppercase tracking-wide text-text-subtle", children: "ID do Calendario (opcional)" }), _jsx(Input, { value: calendarId, onChange: (event) => setCalendarId(event.target.value), placeholder: "primary@group.calendar.google.com", disabled: integrationBusy }), _jsx("p", { className: "text-[11px] text-text-muted", children: "Use o ID do calendario compartilhado se nao for o principal." })] })), _jsxs("div", { className: cn('rounded-2xl border px-3 py-3 shadow-soft', 'border-border bg-white'), children: ["Status atual:", ' ', _jsx("span", { className: "text-text", children: selectedIntegration.status })] }), _jsx("div", { className: cn('rounded-2xl border px-3 py-3 shadow-soft', 'border-border bg-white'), children: "Ultima sincronizacao: 2 dias atras." }), _jsx("div", { className: cn('rounded-2xl border px-3 py-3 shadow-soft', 'border-border bg-white'), children: "Ajustes disponiveis: webhooks, notificacoes e canais." })] })) })] }) }));
};
