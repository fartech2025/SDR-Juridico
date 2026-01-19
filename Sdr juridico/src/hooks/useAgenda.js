import { useCallback, useEffect, useState } from 'react';
import { agendaService } from '@/services/agendaService';
import { mapAgendamentoRowToAgendaItem } from '@/lib/mappers';
export function useAgenda() {
    const [state, setState] = useState({
        eventos: [],
        loading: true,
        error: null,
    });
    /**
     * Busca todos os eventos
     */
    const fetchEventos = useCallback(async () => {
        try {
            setState((prev) => ({ ...prev, loading: true, error: null }));
            const eventos = await agendaService.getEventos();
            setState((prev) => ({
                ...prev,
                eventos: eventos.map(mapAgendamentoRowToAgendaItem),
                loading: false,
            }));
        }
        catch (error) {
            setState((prev) => ({
                ...prev,
                error: error instanceof Error ? error : new Error('Erro desconhecido'),
                loading: false,
            }));
        }
    }, []);
    /**
     * Busca um evento específico
     */
    const fetchEvento = useCallback(async (id) => {
        try {
            setState((prev) => ({ ...prev, loading: true, error: null }));
            const evento = await agendaService.getEvento(id);
            return mapAgendamentoRowToAgendaItem(evento);
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error('Erro desconhecido');
            setState((prev) => ({ ...prev, error: err, loading: false }));
            throw err;
        }
    }, []);
    /**
     * Busca eventos de um período
     */
    const fetchPorPeriodo = useCallback(async (dataInicio, dataFim) => {
        try {
            setState((prev) => ({ ...prev, loading: true, error: null }));
            const eventos = await agendaService.getEventosPorPeriodo(dataInicio, dataFim);
            const mapped = eventos.map(mapAgendamentoRowToAgendaItem);
            setState((prev) => ({ ...prev, eventos: mapped, loading: false }));
            return mapped;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error('Erro desconhecido');
            setState((prev) => ({ ...prev, error: err, loading: false }));
            throw err;
        }
    }, []);
    /**
     * Busca eventos de hoje
     */
    const fetchHoje = useCallback(async () => {
        try {
            setState((prev) => ({ ...prev, loading: true, error: null }));
            const eventos = await agendaService.getEventosHoje();
            const mapped = eventos.map(mapAgendamentoRowToAgendaItem);
            setState((prev) => ({ ...prev, eventos: mapped, loading: false }));
            return mapped;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error('Erro desconhecido');
            setState((prev) => ({ ...prev, error: err, loading: false }));
            throw err;
        }
    }, []);
    /**
     * Busca eventos da semana
     */
    const fetchSemana = useCallback(async () => {
        try {
            setState((prev) => ({ ...prev, loading: true, error: null }));
            const eventos = await agendaService.getEventosDaSemana();
            const mapped = eventos.map(mapAgendamentoRowToAgendaItem);
            setState((prev) => ({ ...prev, eventos: mapped, loading: false }));
            return mapped;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error('Erro desconhecido');
            setState((prev) => ({ ...prev, error: err, loading: false }));
            throw err;
        }
    }, []);
    /**
     * Busca eventos por tipo
     */
    const fetchByTipo = useCallback(async (tipo) => {
        try {
            setState((prev) => ({ ...prev, loading: true, error: null }));
            const eventos = await agendaService.getEventosByTipo(tipo);
            const mapped = eventos.map(mapAgendamentoRowToAgendaItem);
            setState((prev) => ({ ...prev, eventos: mapped, loading: false }));
            return mapped;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error('Erro desconhecido');
            setState((prev) => ({ ...prev, error: err, loading: false }));
            throw err;
        }
    }, []);
    /**
     * Busca próximos eventos
     */
    const fetchProximos = useCallback(async (dias = 7) => {
        try {
            setState((prev) => ({ ...prev, loading: true, error: null }));
            const eventos = await agendaService.getProximosEventos(dias);
            const mapped = eventos.map(mapAgendamentoRowToAgendaItem);
            setState((prev) => ({ ...prev, eventos: mapped, loading: false }));
            return mapped;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error('Erro desconhecido');
            setState((prev) => ({ ...prev, error: err, loading: false }));
            throw err;
        }
    }, []);
    /**
     * Busca eventos passados
     */
    const fetchPassados = useCallback(async (dias = 7) => {
        try {
            setState((prev) => ({ ...prev, loading: true, error: null }));
            const eventos = await agendaService.getEventosPassados(dias);
            const mapped = eventos.map(mapAgendamentoRowToAgendaItem);
            setState((prev) => ({ ...prev, eventos: mapped, loading: false }));
            return mapped;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error('Erro desconhecido');
            setState((prev) => ({ ...prev, error: err, loading: false }));
            throw err;
        }
    }, []);
    /**
     * Cria um novo evento (com atualização otimista)
     */
    const createEvento = useCallback(async (evento) => {
        try {
            setState((prev) => ({ ...prev, error: null }));
            const novoEvento = await agendaService.createEvento(evento);
            const mapped = mapAgendamentoRowToAgendaItem(novoEvento);
            setState((prev) => ({ ...prev, eventos: [mapped, ...prev.eventos] }));
            return mapped;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error('Erro desconhecido');
            setState((prev) => ({ ...prev, error: err }));
            throw err;
        }
    }, []);
    /**
     * Atualiza um evento (com atualização otimista)
     */
    const updateEvento = useCallback(async (id, updates) => {
        try {
            setState((prev) => ({ ...prev, error: null }));
            const eventoAtualizado = await agendaService.updateEvento(id, updates);
            const mapped = mapAgendamentoRowToAgendaItem(eventoAtualizado);
            setState((prev) => ({
                ...prev,
                eventos: prev.eventos.map((e) => (e.id === id ? mapped : e)),
            }));
            return mapped;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error('Erro desconhecido');
            setState((prev) => ({ ...prev, error: err }));
            throw err;
        }
    }, []);
    /**
     * Deleta um evento (com atualização otimista)
     */
    const deleteEvento = useCallback(async (id) => {
        try {
            setState((prev) => ({ ...prev, error: null }));
            await agendaService.deleteEvento(id);
            setState((prev) => ({
                ...prev,
                eventos: prev.eventos.filter((e) => e.id !== id),
            }));
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error('Erro desconhecido');
            setState((prev) => ({ ...prev, error: err }));
            throw err;
        }
    }, []);
    /**
     * Busca estatísticas
     */
    const fetchEstatisticas = useCallback(async () => {
        try {
            return await agendaService.getEstatisticas();
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error('Erro desconhecido');
            setState((prev) => ({ ...prev, error: err }));
            throw err;
        }
    }, []);
    /**
     * Carrega eventos ao montar componente
     */
    useEffect(() => {
        fetchEventos();
    }, [fetchEventos]);
    return {
        ...state,
        fetchEventos,
        fetchEvento,
        fetchPorPeriodo,
        fetchHoje,
        fetchSemana,
        fetchByTipo,
        fetchProximos,
        fetchPassados,
        createEvento,
        updateEvento,
        deleteEvento,
        fetchEstatisticas,
    };
}
