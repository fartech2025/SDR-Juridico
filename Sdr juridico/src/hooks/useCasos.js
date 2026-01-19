import { useCallback, useEffect, useState } from 'react';
import { casosService } from '@/services/casosService';
import { mapCasoRowToCaso } from '@/lib/mappers';
export function useCasos() {
    const [state, setState] = useState({
        casos: [],
        loading: true,
        error: null,
    });
    /**
     * Busca todos os casos
     */
    const fetchCasos = useCallback(async () => {
        try {
            setState((prev) => ({ ...prev, loading: true, error: null }));
            const casos = await casosService.getCasos();
            setState((prev) => ({
                ...prev,
                casos: casos.map(mapCasoRowToCaso),
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
     * Busca um caso específico
     */
    const fetchCaso = useCallback(async (id) => {
        try {
            setState((prev) => ({ ...prev, loading: true, error: null }));
            const caso = await casosService.getCaso(id);
            return mapCasoRowToCaso(caso);
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error('Erro desconhecido');
            setState((prev) => ({ ...prev, error: err, loading: false }));
            throw err;
        }
    }, []);
    /**
     * Busca casos por status
     */
    const fetchByStatus = useCallback(async (status) => {
        try {
            setState((prev) => ({ ...prev, loading: true, error: null }));
            const casos = await casosService.getCasosByStatus(status);
            const mapped = casos.map(mapCasoRowToCaso);
            setState((prev) => ({ ...prev, casos: mapped, loading: false }));
            return mapped;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error('Erro desconhecido');
            setState((prev) => ({ ...prev, error: err, loading: false }));
            throw err;
        }
    }, []);
    /**
     * Busca casos críticos
     */
    const fetchCriticos = useCallback(async () => {
        try {
            setState((prev) => ({ ...prev, loading: true, error: null }));
            const casos = await casosService.getCasosCriticos();
            const mapped = casos.map(mapCasoRowToCaso);
            setState((prev) => ({ ...prev, casos: mapped, loading: false }));
            return mapped;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error('Erro desconhecido');
            setState((prev) => ({ ...prev, error: err, loading: false }));
            throw err;
        }
    }, []);
    /**
     * Busca casos de um cliente
     */
    const fetchByCliente = useCallback(async (clienteId) => {
        try {
            setState((prev) => ({ ...prev, loading: true, error: null }));
            const casos = await casosService.getCasosByCliente(clienteId);
            const mapped = casos.map(mapCasoRowToCaso);
            setState((prev) => ({ ...prev, casos: mapped, loading: false }));
            return mapped;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error('Erro desconhecido');
            setState((prev) => ({ ...prev, error: err, loading: false }));
            throw err;
        }
    }, []);
    /**
     * Cria um novo caso (com atualização otimista)
     */
    const createCaso = useCallback(async (caso) => {
        try {
            setState((prev) => ({ ...prev, error: null }));
            const novoCaso = await casosService.createCaso(caso);
            const mapped = mapCasoRowToCaso(novoCaso);
            setState((prev) => ({ ...prev, casos: [mapped, ...prev.casos] }));
            return mapped;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error('Erro desconhecido');
            setState((prev) => ({ ...prev, error: err }));
            throw err;
        }
    }, []);
    /**
     * Atualiza um caso (com atualização otimista)
     */
    const updateCaso = useCallback(async (id, updates) => {
        try {
            setState((prev) => ({ ...prev, error: null }));
            const casoAtualizado = await casosService.updateCaso(id, updates);
            const mapped = mapCasoRowToCaso(casoAtualizado);
            setState((prev) => ({
                ...prev,
                casos: prev.casos.map((c) => (c.id === id ? mapped : c)),
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
     * Deleta um caso (com atualização otimista)
     */
    const deleteCaso = useCallback(async (id) => {
        try {
            setState((prev) => ({ ...prev, error: null }));
            await casosService.deleteCaso(id);
            setState((prev) => ({
                ...prev,
                casos: prev.casos.filter((c) => c.id !== id),
            }));
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error('Erro desconhecido');
            setState((prev) => ({ ...prev, error: err }));
            throw err;
        }
    }, []);
    const assignCasoAdvogado = useCallback(async (id, advogadoId) => {
        try {
            setState((prev) => ({ ...prev, error: null }));
            await casosService.assignCasoAdvogado(id, advogadoId);
            await fetchCasos();
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error('Erro desconhecido');
            setState((prev) => ({ ...prev, error: err }));
            throw err;
        }
    }, [fetchCasos]);
    /**
     * Muda status de um caso
     */
    const mudarStatus = useCallback(async (id, novoStatus) => {
        return updateCaso(id, { status: novoStatus });
    }, [updateCaso]);
    /**
     * Muda prioridade de um caso
     */
    const mudarPrioridade = useCallback(async (id, novaPrioridade) => {
        return updateCaso(id, { prioridade: novaPrioridade });
    }, [updateCaso]);
    /**
     * Busca estatísticas
     */
    const fetchEstatisticas = useCallback(async () => {
        try {
            return await casosService.getEstatisticas();
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error('Erro desconhecido');
            setState((prev) => ({ ...prev, error: err }));
            throw err;
        }
    }, []);
    /**
     * Carrega casos ao montar componente
     */
    useEffect(() => {
        fetchCasos();
    }, [fetchCasos]);
    return {
        ...state,
        fetchCasos,
        fetchCaso,
        fetchByStatus,
        fetchCriticos,
        fetchByCliente,
        createCaso,
        updateCaso,
        deleteCaso,
        assignCasoAdvogado,
        mudarStatus,
        mudarPrioridade,
        fetchEstatisticas,
    };
}
