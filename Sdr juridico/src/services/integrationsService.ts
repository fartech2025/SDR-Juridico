import { supabase, type IntegrationRow } from '@/lib/supabaseClient'
import { getActiveOrgId, requireOrgId } from '@/lib/org'
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
      const orgId = await getActiveOrgId()
      let query = supabase.from('integrations').select('*')
      if (orgId) query = query.eq('org_id', orgId)
      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw new AppError(error.message, 'database_error')
      return data || []
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao buscar integracoes',
        'database_error'
      )
    }
  },

  async cleanupDuplicates(): Promise<number> {
    const orgId = await requireOrgId()
    const { data, error } = await supabase
      .from('integrations')
      .select('id, provider, enabled, created_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })

    if (error) throw new AppError(error.message, 'database_error')
    const rows = data || []
    const idsToDelete: string[] = []
    const grouped = new Map<string, typeof rows>()

    rows.forEach((row) => {
      const key = row.provider
      const list = grouped.get(key) || []
      list.push(row)
      grouped.set(key, list)
    })

    grouped.forEach((list) => {
      if (list.length <= 1) return
      const connected = list.filter((row) => row.enabled)
      if (connected.length > 0) {
        list
          .filter((row) => !row.enabled)
          .forEach((row) => idsToDelete.push(row.id))
        return
      }
      const [, ...rest] = list
      rest.forEach((row) => idsToDelete.push(row.id))
    })

    if (idsToDelete.length === 0) return 0
    const { error: deleteError } = await supabase
      .from('integrations')
      .delete()
      .in('id', idsToDelete)

    if (deleteError) throw new AppError(deleteError.message, 'database_error')
    return idsToDelete.length
  },

  async updateIntegration(
    id: string,
    updates: Partial<Pick<IntegrationRow, 'enabled' | 'settings' | 'secrets' | 'name'>>
  ): Promise<IntegrationRow> {
    try {
      const orgId = await requireOrgId()
      const { data, error } = await supabase
        .from('integrations')
        .update(updates)
        .eq('id', id)
        .eq('org_id', orgId)
        .select()
        .single()

      if (error) throw new AppError(error.message, 'database_error')
      if (!data) throw new AppError('Integracao nao encontrada', 'not_found')
      return data
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao atualizar integracao',
        'database_error'
      )
    }
  },

  async ensureDefaultIntegrations(): Promise<void> {
    try {
      const orgId = await requireOrgId()
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
