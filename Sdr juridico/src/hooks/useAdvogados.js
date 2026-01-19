import { useCallback, useEffect, useState } from 'react';
import { advogadosService } from '@/services/advogadosService';
export function useAdvogados(orgId, enabled = true) {
    const [state, setState] = useState({
        advogados: [],
        loading: false,
        error: null,
    });
    const fetchAdvogados = useCallback(async () => {
        if (!orgId || !enabled)
            return;
        try {
            setState((prev) => ({ ...prev, loading: true, error: null }));
            const advogados = await advogadosService.getAdvogadosByOrg(orgId);
            setState((prev) => ({ ...prev, advogados, loading: false }));
        }
        catch (error) {
            setState((prev) => ({
                ...prev,
                error: error instanceof Error ? error : new Error('Erro desconhecido'),
                loading: false,
            }));
        }
    }, [orgId, enabled]);
    useEffect(() => {
        void fetchAdvogados();
    }, [fetchAdvogados]);
    return {
        ...state,
        fetchAdvogados,
    };
}
