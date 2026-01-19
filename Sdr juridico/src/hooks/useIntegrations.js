import { useCallback, useEffect, useState } from 'react';
import { integrationsService } from '@/services/integrationsService';
const descriptionByProvider = {
    datajud: 'Base Nacional de Dados do Poder Judiciario.',
    avisa: 'Alertas e notificacoes juridicas.',
    evolution: 'Conector de mensagens e automacoes.',
    twilio: 'Mensagens e ligacoes via API.',
    google_calendar: 'Sincronize agenda juridica.',
    google_meet: 'Videoconferencias com clientes.',
    teams: 'Reunioes via Microsoft Teams.',
    whatsapp: 'Mensagens e alertas em tempo real.',
};
export function useIntegrations() {
    const [state, setState] = useState({
        integrations: [],
        loading: true,
        error: null,
    });
    const fetchIntegrations = useCallback(async () => {
        try {
            setState((prev) => ({ ...prev, loading: true, error: null }));
            try {
                await integrationsService.cleanupDuplicates();
            }
            catch {
                // Ignorar falhas de limpeza para não bloquear a tela
            }
            const rows = await integrationsService.getIntegrations();
            const mapped = rows.map((row) => ({
                id: row.id,
                name: row.name || row.provider,
                description: (row.settings && row.settings.description) ||
                    descriptionByProvider[row.provider] ||
                    'Integracao configurada.',
                status: (row.enabled ? 'connected' : 'disconnected'),
                settings: row.settings || null,
            }));
            setState((prev) => ({ ...prev, integrations: mapped, loading: false }));
        }
        catch (error) {
            setState((prev) => ({
                ...prev,
                error: error instanceof Error ? error : new Error('Erro desconhecido'),
                loading: false,
            }));
        }
    }, []);
    const createDefaultIntegrations = useCallback(async () => {
        await integrationsService.ensureDefaultIntegrations();
        await fetchIntegrations();
    }, [fetchIntegrations]);
    const updateIntegration = useCallback(async (id, updates) => {
        await integrationsService.updateIntegration(id, updates);
        await fetchIntegrations();
    }, [fetchIntegrations]);
    useEffect(() => {
        fetchIntegrations();
    }, [fetchIntegrations]);
    return {
        ...state,
        fetchIntegrations,
        createDefaultIntegrations,
        updateIntegration,
    };
}
