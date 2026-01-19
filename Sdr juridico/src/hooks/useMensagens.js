import { useCallback, useEffect, useState } from 'react';
import { mensagensService } from '@/services/mensagensService';
const mapToLeadMessage = (row) => ({
    id: row.id,
    author: row.direction === 'out' ? 'SDR' : 'Cliente',
    content: row.body || '',
    date: row.created_at,
});
export function useMensagens(leadId) {
    const [state, setState] = useState({
        mensagens: [],
        loading: false,
        error: null,
    });
    const fetchMensagens = useCallback(async () => {
        if (!leadId)
            return;
        try {
            setState((prev) => ({ ...prev, loading: true, error: null }));
            const mensagens = await mensagensService.getMensagensByLead(leadId);
            const ordered = [...mensagens].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            setState((prev) => ({
                ...prev,
                mensagens: ordered.map(mapToLeadMessage),
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
    }, [leadId]);
    useEffect(() => {
        if (!leadId)
            return;
        fetchMensagens();
    }, [fetchMensagens, leadId]);
    return {
        ...state,
        fetchMensagens,
    };
}
