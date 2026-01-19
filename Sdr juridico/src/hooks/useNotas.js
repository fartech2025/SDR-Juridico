import { useCallback, useEffect, useState } from 'react';
import { notasService } from '@/services/notasService';
import { mapTimelineRowToTimelineEvent } from '@/lib/mappers';
export function useNotas() {
    const [state, setState] = useState({
        notas: [],
        loading: true,
        error: null,
    });
    const fetchNotas = useCallback(async () => {
        try {
            setState((prev) => ({ ...prev, loading: true, error: null }));
            const notas = await notasService.getNotas();
            setState((prev) => ({
                ...prev,
                notas: notas.map(mapTimelineRowToTimelineEvent),
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
    const fetchNotasByEntidade = useCallback(async (entidade, entidadeId) => {
        try {
            setState((prev) => ({ ...prev, loading: true, error: null }));
            const notas = await notasService.getNotasByEntidade(entidade, entidadeId);
            const mapped = notas.map(mapTimelineRowToTimelineEvent);
            setState((prev) => ({ ...prev, notas: mapped, loading: false }));
            return mapped;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error('Erro desconhecido');
            setState((prev) => ({ ...prev, error: err, loading: false }));
            throw err;
        }
    }, []);
    useEffect(() => {
        fetchNotas();
    }, [fetchNotas]);
    return {
        ...state,
        fetchNotas,
        fetchNotasByEntidade,
    };
}
