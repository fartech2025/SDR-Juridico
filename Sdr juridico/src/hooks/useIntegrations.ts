import { useCallback, useEffect, useState } from 'react'
import { integrationsService } from '@/services/integrationsService'
import type { Integration } from '@/types/domain'

interface UseIntegrationsState {
  integrations: Integration[]
  loading: boolean
  error: Error | null
}

const descriptionByProvider: Record<string, string> = {
  datajud: 'Base Nacional de Dados do Poder Judiciario.',
  avisa: 'Alertas e notificacoes juridicas.',
  evolution: 'Conector de mensagens e automacoes.',
  twilio: 'Mensagens e ligacoes via API.',
  google_calendar: 'Sincronize agenda juridica.',
  whatsapp: 'Mensagens e alertas em tempo real.',
}

export function useIntegrations() {
  const [state, setState] = useState<UseIntegrationsState>({
    integrations: [],
    loading: true,
    error: null,
  })

  const fetchIntegrations = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      try {
        await integrationsService.cleanupDuplicates()
      } catch {
        // Ignorar falhas de limpeza para não bloquear a tela
      }
      const rows = await integrationsService.getIntegrations()
      const mapped: Integration[] = rows.map((row) => ({
        id: row.id,
        name: row.name || row.provider,
        description:
          (row.settings && (row.settings as { description?: string }).description) ||
          descriptionByProvider[row.provider] ||
          'Integracao configurada.',
        status: (row.enabled ? 'connected' : 'disconnected') as 'connected' | 'disconnected',
        settings: row.settings || null,
      }))
      setState((prev) => ({ ...prev, integrations: mapped, loading: false }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Erro desconhecido'),
        loading: false,
      }))
    }
  }, [])

  const createDefaultIntegrations = useCallback(
    async () => {
      await integrationsService.ensureDefaultIntegrations()
      await fetchIntegrations()
    },
    [fetchIntegrations]
  )

  const updateIntegration = useCallback(
    async (
      id: string,
      updates: Parameters<typeof integrationsService.updateIntegration>[1]
    ) => {
      await integrationsService.updateIntegration(id, updates)
      await fetchIntegrations()
    },
    [fetchIntegrations]
  )

  useEffect(() => {
    fetchIntegrations()
  }, [fetchIntegrations])

  return {
    ...state,
    fetchIntegrations,
    createDefaultIntegrations,
    updateIntegration,
  }
}
