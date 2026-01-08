import { supabase, type IntegrationRow } from '@/lib/supabaseClient'
import { AppError } from '@/utils/errors'

const defaultIntegrations = [
  { provider: 'whatsapp', name: 'WhatsApp', enabled: false },
  { provider: 'google_calendar', name: 'Google Calendar', enabled: false },
  { provider: 'datajud', name: 'DataJud', enabled: false },
  { provider: 'twilio', name: 'Twilio', enabled: false },
  { provider: 'evolution', name: 'Evolution', enabled: false },
  { provider: 'avisa', name: 'Avisa', enabled: false },
]

export const integrationsService = {
  async getIntegrations(): Promise<IntegrationRow[]> {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw new AppError(error.message, 'database_error')
      return data || []
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao buscar integracoes',
        'database_error'
      )
    }
  },

  async ensureDefaultIntegrations(orgId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('provider')
        .eq('org_id', orgId)

      if (error) throw new AppError(error.message, 'database_error')

      const existing = new Set((data || []).map((row) => row.provider))
      const payload = defaultIntegrations
        .filter((item) => !existing.has(item.provider))
        .map((item) => ({
          org_id: orgId,
          provider: item.provider,
          name: item.name,
          enabled: item.enabled,
          secrets: {},
          settings: {},
        }))

      if (payload.length === 0) return

      const { error: insertError } = await supabase.from('integrations').insert(payload)
      if (insertError) throw new AppError(insertError.message, 'database_error')
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao criar integracoes padrao',
        'database_error'
      )
    }
  },
}
