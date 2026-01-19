import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Database, CheckCircle2, XCircle, Activity, Users, FileText, Calendar, Briefcase, UserCheck, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
export function DatabasePage() {
    const [connection, setConnection] = useState({
        status: 'disconnected',
        latency: null,
        timestamp: new Date()
    });
    const [tableStats, setTableStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [apiStatuses, setApiStatuses] = useState([]);
    const [checkingAPIs, setCheckingAPIs] = useState(false);
    const checkConnection = async () => {
        const start = Date.now();
        try {
            const { error } = await supabase.from('leads').select('id').limit(1);
            const latency = Date.now() - start;
            if (error)
                throw error;
            setConnection({
                status: 'connected',
                latency,
                timestamp: new Date()
            });
        }
        catch (error) {
            setConnection({
                status: 'disconnected',
                latency: null,
                timestamp: new Date()
            });
        }
    };
    const loadTableStats = async () => {
        const tables = [
            { name: 'leads', icon: Users },
            { name: 'clientes', icon: UserCheck },
            { name: 'casos', icon: Briefcase },
            { name: 'documentos', icon: FileText },
            { name: 'agenda', icon: Calendar },
            { name: 'usuarios', icon: Users },
            { name: 'orgs', icon: Users },
            { name: 'timeline_events', icon: Activity },
            { name: 'notificacoes', icon: AlertCircle }
        ];
        const stats = [];
        for (const table of tables) {
            try {
                const { count, error } = await supabase
                    .from(table.name)
                    .select('*', { count: 'exact', head: true });
                if (!error && count !== null) {
                    stats.push({
                        name: table.name,
                        count,
                        icon: table.icon
                    });
                }
            }
            catch (error) {
                console.error(`Erro ao carregar ${table.name}:`, error);
            }
        }
        setTableStats(stats);
    };
    const checkAPIStatuses = async () => {
        setCheckingAPIs(true);
        const statuses = [];
        // Verifica Supabase
        try {
            const { error } = await supabase.from('leads').select('id').limit(1);
            statuses.push({
                name: 'Supabase Database',
                status: error ? 'disconnected' : 'connected',
                message: error ? error.message : 'Conexão ativa',
                icon: Database
            });
        }
        catch (error) {
            statuses.push({
                name: 'Supabase Database',
                status: 'disconnected',
                message: error?.message || 'Erro de conexão',
                icon: Database
            });
        }
        // Verifica Supabase Auth
        try {
            const { data: { user } } = await supabase.auth.getUser();
            statuses.push({
                name: 'Supabase Auth',
                status: user ? 'connected' : 'not-configured',
                message: user ? `Usuário: ${user.email}` : 'Não autenticado',
                icon: UserCheck
            });
        }
        catch (error) {
            statuses.push({
                name: 'Supabase Auth',
                status: 'disconnected',
                message: error?.message || 'Erro de autenticação',
                icon: UserCheck
            });
        }
        // Verifica Supabase Storage
        try {
            const { data, error } = await supabase.storage.listBuckets();
            statuses.push({
                name: 'Supabase Storage',
                status: error ? 'disconnected' : 'connected',
                message: error ? error.message : `${data?.length || 0} buckets disponíveis`,
                icon: FileText
            });
        }
        catch (error) {
            statuses.push({
                name: 'Supabase Storage',
                status: 'disconnected',
                message: error?.message || 'Erro ao acessar storage',
                icon: FileText
            });
        }
        // Verifica Google Calendar (integrações locais)
        try {
            statuses.push({
                name: 'Google Calendar',
                status: 'not-configured',
                message: 'Integração não disponível no schema atual',
                icon: Calendar
            });
        }
        catch (error) {
            statuses.push({
                name: 'Google Calendar',
                status: 'not-configured',
                message: 'Não configurado',
                icon: Calendar
            });
        }
        // Verifica Microsoft Teams (integrações locais)
        try {
            statuses.push({
                name: 'Microsoft Teams',
                status: 'not-configured',
                message: 'Integração não disponível no schema atual',
                icon: Activity
            });
        }
        catch (error) {
            statuses.push({
                name: 'Microsoft Teams',
                status: 'not-configured',
                message: 'Não configurado',
                icon: Activity
            });
        }
        // Verifica DataJud API (verifica variável de ambiente)
        const hasDataJudKey = import.meta.env.VITE_DATAJUD_API_KEY;
        statuses.push({
            name: 'DataJud API',
            status: hasDataJudKey ? 'connected' : 'not-configured',
            message: hasDataJudKey ? 'API Key configurada' : 'API Key não configurada',
            icon: Briefcase
        });
        setApiStatuses(statuses);
        setCheckingAPIs(false);
    };
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([
                checkConnection(),
                loadTableStats(),
                checkAPIStatuses()
            ]);
            setLoading(false);
        };
        init();
        // Atualiza a cada 30 segundos
        const interval = setInterval(() => {
            checkConnection();
            loadTableStats();
        }, 30000);
        return () => clearInterval(interval);
    }, []);
    const getStatusColor = (status) => {
        switch (status) {
            case 'connected':
                return 'text-green-600';
            case 'disconnected':
                return 'text-red-600';
            case 'not-configured':
                return 'text-orange-600';
            default:
                return 'text-gray-600';
        }
    };
    const getStatusIcon = (status) => {
        switch (status) {
            case 'connected':
                return _jsx(CheckCircle2, { className: "h-5 w-5 text-green-600" });
            case 'disconnected':
                return _jsx(XCircle, { className: "h-5 w-5 text-red-600" });
            case 'not-configured':
                return _jsx(AlertCircle, { className: "h-5 w-5 text-orange-600" });
            default:
                return _jsx(AlertCircle, { className: "h-5 w-5 text-gray-600" });
        }
    };
    const getStatusBadge = (status) => {
        switch (status) {
            case 'connected':
                return 'bg-green-100 text-green-700';
            case 'disconnected':
                return 'bg-red-100 text-red-700';
            case 'not-configured':
                return 'bg-orange-100 text-orange-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };
    const getStatusText = (status) => {
        switch (status) {
            case 'connected':
                return 'Conectado';
            case 'disconnected':
                return 'Desconectado';
            case 'not-configured':
                return 'Não Configurado';
            default:
                return 'Desconhecido';
        }
    };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center h-96", children: _jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-text", children: "Monitor de Banco de Dados" }), _jsx("p", { className: "text-text-subtle mt-1", children: "Monitoramento de conex\u00F5es, estat\u00EDsticas e status de APIs" })] }), _jsxs("button", { onClick: () => {
                            checkConnection();
                            loadTableStats();
                            checkAPIStatuses();
                        }, className: "flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors", children: [_jsx(RefreshCw, { className: "h-4 w-4" }), "Atualizar"] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [_jsxs("div", { className: "rounded-xl border border-border bg-surface p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("p", { className: "text-sm text-text-subtle", children: "Status da Conex\u00E3o" }), connection.status === 'connected' ? (_jsx(CheckCircle2, { className: "h-5 w-5 text-green-600" })) : (_jsx(XCircle, { className: "h-5 w-5 text-red-600" }))] }), _jsx("p", { className: `text-2xl font-bold ${connection.status === 'connected' ? 'text-green-600' : 'text-red-600'}`, children: connection.status === 'connected' ? 'Conectado' : 'Desconectado' }), _jsxs("p", { className: "text-xs text-text-subtle mt-2", children: ["\u00DAltima verifica\u00E7\u00E3o: ", connection.timestamp.toLocaleTimeString('pt-BR')] })] }), _jsxs("div", { className: "rounded-xl border border-border bg-surface p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("p", { className: "text-sm text-text-subtle", children: "Lat\u00EAncia" }), _jsx(Activity, { className: "h-5 w-5 text-primary" })] }), _jsx("p", { className: "text-2xl font-bold text-text", children: connection.latency !== null ? `${connection.latency}ms` : '--' }), _jsxs("p", { className: "text-xs text-text-subtle mt-2", children: [connection.latency !== null && connection.latency < 100 && 'Excelente', connection.latency !== null && connection.latency >= 100 && connection.latency < 300 && 'Bom', connection.latency !== null && connection.latency >= 300 && 'Lento'] })] }), _jsxs("div", { className: "rounded-xl border border-border bg-gradient-to-br from-primary/10 to-primary/5 p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("p", { className: "text-sm text-text-subtle", children: "Total de Registros" }), _jsx(Database, { className: "h-5 w-5 text-primary" })] }), _jsx("p", { className: "text-2xl font-bold text-text", children: tableStats.reduce((acc, t) => acc + t.count, 0).toLocaleString('pt-BR') })] })] }), _jsxs("div", { className: "rounded-xl border border-border bg-surface p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h2", { className: "text-lg font-semibold text-text", children: "Status das APIs" }), _jsxs("button", { onClick: checkAPIStatuses, disabled: checkingAPIs, className: "flex items-center gap-2 px-3 py-1 text-sm bg-background border border-border rounded-lg hover:bg-surface transition-colors disabled:opacity-50", children: [checkingAPIs ? (_jsx(Loader2, { className: "h-4 w-4 animate-spin" })) : (_jsx(RefreshCw, { className: "h-4 w-4" })), "Verificar"] })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: apiStatuses.map((api) => {
                            const Icon = api.icon;
                            return (_jsx("div", { className: "rounded-lg border border-border bg-background p-4", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(Icon, { className: `h-5 w-5 mt-0.5 ${getStatusColor(api.status)}` }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("p", { className: "font-medium text-text truncate", children: api.name }), getStatusIcon(api.status)] }), _jsx("p", { className: "text-sm text-text-subtle mb-2", children: api.message }), _jsx("span", { className: `px-2 py-1 text-xs rounded ${getStatusBadge(api.status)}`, children: getStatusText(api.status) })] })] }) }, api.name));
                        }) })] }), _jsxs("div", { className: "rounded-xl border border-border bg-surface p-6", children: [_jsx("h2", { className: "text-lg font-semibold text-text mb-4", children: "Estat\u00EDsticas das Tabelas" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: tableStats.map((table) => {
                            const Icon = table.icon;
                            return (_jsx("div", { className: "rounded-lg border border-border bg-background p-4", children: _jsx("div", { className: "flex items-center justify-between", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Icon, { className: "h-5 w-5 text-primary" }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-text capitalize", children: table.name.replace('_', ' ') }), _jsx("p", { className: "text-2xl font-bold text-primary mt-1", children: table.count.toLocaleString('pt-BR') })] })] }) }) }, table.name));
                        }) })] }), _jsxs("div", { className: "rounded-xl border border-border bg-surface p-6", children: [_jsx("h2", { className: "mb-4 text-lg font-semibold text-text", children: "Opera\u00E7\u00F5es que Requerem Credenciais" }), _jsxs("div", { className: "space-y-3", children: [_jsx("div", { className: "rounded-lg border border-border bg-background p-4", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(Database, { className: "h-5 w-5 text-primary mt-0.5" }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-medium text-text", children: "Supabase Database" }), _jsx("p", { className: "text-sm text-text-subtle mt-1", children: "Todas as opera\u00E7\u00F5es CRUD (leads, clientes, casos, documentos, agenda)" }), _jsxs("div", { className: "mt-2 flex gap-2 flex-wrap", children: [_jsx("span", { className: "px-2 py-1 bg-primary/10 text-primary text-xs rounded", children: "VITE_SUPABASE_URL" }), _jsx("span", { className: "px-2 py-1 bg-primary/10 text-primary text-xs rounded", children: "VITE_SUPABASE_ANON_KEY" })] })] })] }) }), _jsx("div", { className: "rounded-lg border border-border bg-background p-4", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(Calendar, { className: "h-5 w-5 text-primary mt-0.5" }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-medium text-text", children: "Google Calendar" }), _jsx("p", { className: "text-sm text-text-subtle mt-1", children: "Integra\u00E7\u00E3o com Google Calendar para sincroniza\u00E7\u00E3o de eventos" }), _jsxs("div", { className: "mt-2 flex gap-2 flex-wrap", children: [_jsx("span", { className: "px-2 py-1 bg-primary/10 text-primary text-xs rounded", children: "Google OAuth2" }), _jsx("span", { className: "px-2 py-1 bg-primary/10 text-primary text-xs rounded", children: "Calendar API" })] })] })] }) }), _jsx("div", { className: "rounded-lg border border-border bg-background p-4", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(Users, { className: "h-5 w-5 text-primary mt-0.5" }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-medium text-text", children: "Autentica\u00E7\u00E3o de Usu\u00E1rios" }), _jsx("p", { className: "text-sm text-text-subtle mt-1", children: "Login, registro e gerenciamento de sess\u00F5es via Supabase Auth" }), _jsx("div", { className: "mt-2 flex gap-2 flex-wrap", children: _jsx("span", { className: "px-2 py-1 bg-primary/10 text-primary text-xs rounded", children: "Supabase Auth" }) })] })] }) }), _jsx("div", { className: "rounded-lg border border-border bg-background p-4", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(FileText, { className: "h-5 w-5 text-primary mt-0.5" }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-medium text-text", children: "Storage de Documentos" }), _jsx("p", { className: "text-sm text-text-subtle mt-1", children: "Upload e download de arquivos via Supabase Storage" }), _jsx("div", { className: "mt-2 flex gap-2 flex-wrap", children: _jsx("span", { className: "px-2 py-1 bg-primary/10 text-primary text-xs rounded", children: "Supabase Storage" }) })] })] }) }), _jsx("div", { className: "rounded-lg border border-border bg-background p-4", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(Briefcase, { className: "h-5 w-5 text-primary mt-0.5" }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-medium text-text", children: "DataJud API" }), _jsx("p", { className: "text-sm text-text-subtle mt-1", children: "Consulta de processos judiciais no CNJ (quando configurado)" }), _jsx("div", { className: "mt-2 flex gap-2 flex-wrap", children: _jsx("span", { className: "px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded", children: "VITE_DATAJUD_API_KEY (Opcional)" }) })] })] }) }), _jsx("div", { className: "rounded-lg border border-border bg-background p-4", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(Activity, { className: "h-5 w-5 text-primary mt-0.5" }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-medium text-text", children: "Microsoft Teams" }), _jsx("p", { className: "text-sm text-text-subtle mt-1", children: "Integra\u00E7\u00E3o com Microsoft Teams para videoconfer\u00EAncias" }), _jsxs("div", { className: "mt-2 flex gap-2 flex-wrap", children: [_jsx("span", { className: "px-2 py-1 bg-primary/10 text-primary text-xs rounded", children: "Microsoft OAuth2" }), _jsx("span", { className: "px-2 py-1 bg-primary/10 text-primary text-xs rounded", children: "Graph API" })] })] })] }) })] }), _jsx("div", { className: "mt-6 rounded-lg bg-blue-50 border border-blue-200 p-4", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(AlertCircle, { className: "h-5 w-5 text-blue-600 mt-0.5" }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-medium text-blue-900", children: "Nota de Seguran\u00E7a" }), _jsxs("p", { className: "text-sm text-blue-700 mt-1", children: ["As credenciais devem ser configuradas no arquivo ", _jsx("code", { className: "bg-blue-100 px-1 rounded", children: ".env" }), " na raiz do projeto. Nunca commite o arquivo .env no Git. Use .env.example como refer\u00EAncia."] })] })] }) })] })] }));
}
