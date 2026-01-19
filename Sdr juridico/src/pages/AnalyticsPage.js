import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, History, TrendingUp, BarChart3, Clock, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { listarFavoritos, listarHistorico, obterEstatisticas } from '@/services/favoritosService';
export default function AnalyticsPage() {
    const navigate = useNavigate();
    const [favoritos, setFavoritos] = React.useState([]);
    const [historico, setHistorico] = React.useState([]);
    const [estatisticas, setEstatisticas] = React.useState({
        totalConsultas: 0,
        processosUnicos: 0,
        tribunaisMaisConsultados: [],
        consultasRecentes: 0
    });
    const [carregando, setCarregando] = React.useState(true);
    React.useEffect(() => {
        carregarDados();
    }, []);
    async function carregarDados() {
        setCarregando(true);
        try {
            const [favResult, histResult, stats] = await Promise.all([
                listarFavoritos(),
                listarHistorico(10),
                obterEstatisticas()
            ]);
            if (favResult.data)
                setFavoritos(favResult.data);
            if (histResult.data)
                setHistorico(histResult.data);
            setEstatisticas(stats);
        }
        catch (error) {
            console.error('Erro ao carregar analytics:', error);
        }
        finally {
            setCarregando(false);
        }
    }
    if (carregando) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" }), _jsx("p", { className: "mt-4 text-text-muted", children: "Carregando..." })] }) }));
    }
    return (_jsxs("div", { className: "container mx-auto p-6 space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-text", children: "Analytics" }), _jsx("p", { className: "text-text-muted mt-1", children: "Acompanhe suas consultas e processos favoritos" })] }), _jsx(Button, { onClick: () => navigate('/datajud'), children: "Voltar para Consultas" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Total de Consultas" }), _jsx(BarChart3, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: estatisticas.totalConsultas }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Todas as consultas realizadas" })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Processos \u00DAnicos" }), _jsx(TrendingUp, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: estatisticas.processosUnicos }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Processos diferentes consultados" })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "\u00DAltimos 7 Dias" }), _jsx(Clock, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: estatisticas.consultasRecentes }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Consultas recentes" })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Favoritos" }), _jsx(Star, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: favoritos.length }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Processos acompanhados" })] })] })] }), estatisticas.tribunaisMaisConsultados.length > 0 && (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Award, { className: "h-5 w-5" }), "Tribunais Mais Consultados"] }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-2", children: estatisticas.tribunaisMaisConsultados.map(({ tribunal, total }) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm font-medium", children: tribunal }), _jsxs(Badge, { variant: "info", children: [total, " consultas"] })] }, tribunal))) }) })] })), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Star, { className: "h-5 w-5" }), "Processos Favoritos (", favoritos.length, ")"] }) }), _jsx(CardContent, { children: favoritos.length === 0 ? (_jsxs("div", { className: "text-center py-8 text-text-muted", children: [_jsx(Star, { className: "h-12 w-12 mx-auto mb-2 opacity-50" }), _jsx("p", { children: "Nenhum processo favorito" }), _jsx("p", { className: "text-sm mt-1", children: "Marque processos como favoritos para acompanh\u00E1-los aqui" })] })) : (_jsx("div", { className: "space-y-3 max-h-96 overflow-y-auto", children: favoritos.map((fav) => (_jsxs("div", { className: "p-3 border border-border rounded-lg hover:bg-surface-2 transition-colors cursor-pointer", onClick: () => {
                                            navigate(`/datajud?processo=${fav.numero_processo}`);
                                        }, children: [_jsx("div", { className: "flex items-start justify-between", children: _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-medium text-sm", children: fav.numero_processo }), _jsx("p", { className: "text-xs text-text-muted mt-1", children: fav.tribunal }), fav.classe && (_jsx(Badge, { variant: "default", className: "mt-2 text-xs", children: fav.classe })), fav.tags && fav.tags.length > 0 && (_jsx("div", { className: "flex flex-wrap gap-1 mt-2", children: fav.tags.map((tag, idx) => (_jsx(Badge, { variant: "info", className: "text-xs", children: tag }, idx))) }))] }) }), fav.descricao && (_jsx("p", { className: "text-xs text-text-muted mt-2 italic", children: fav.descricao }))] }, fav.id))) })) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(History, { className: "h-5 w-5" }), "Hist\u00F3rico Recente"] }) }), _jsx(CardContent, { children: historico.length === 0 ? (_jsxs("div", { className: "text-center py-8 text-text-muted", children: [_jsx(History, { className: "h-12 w-12 mx-auto mb-2 opacity-50" }), _jsx("p", { children: "Nenhuma consulta realizada" })] })) : (_jsx("div", { className: "space-y-2 max-h-96 overflow-y-auto", children: historico.map((item) => (_jsx("div", { className: "p-2 border border-border rounded hover:bg-surface-2 transition-colors cursor-pointer", onClick: () => {
                                            navigate(`/datajud?processo=${item.numero_processo}`);
                                        }, children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium truncate", children: item.numero_processo }), _jsx("p", { className: "text-xs text-text-muted", children: item.tribunal })] }), _jsx("div", { className: "text-xs text-text-muted ml-2", children: new Date(item.consultado_em).toLocaleDateString('pt-BR', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    }) })] }) }, item.id))) })) })] })] })] }));
}
