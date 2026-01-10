import { supabase, type MensagemRow } from '@/lib/supabaseClient'
import { getActiveOrgId } from '@/lib/org'
import { AppError } from '@/utils/errors'

export const mensagensService = {
  async getMensagensByConversaIds(conversaIds: string[]): Promise<MensagemRow[]> {
    if (conversaIds.length === 0) return []
    try {
      const orgId = await getActiveOrgId()
      let query = supabase
        .from('mensagens')
        .select('*')
        .in('conversa_id', conversaIds)
      if (orgId) query = query.eq('org_id', orgId)
      const { data, error } = await query.order('created_at', { ascending: false }).limit(30)

      if (error) throw new AppError(error.message, 'database_error')
      return data || []
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao buscar mensagens',
        'database_error'
      )
    }
  },

  async getConversasByLead(leadId: string): Promise<string[]> {
    try {
      const orgId = await getActiveOrgId()
      let query = supabase.from('conversas').select('id').eq('lead_id', leadId)
      if (orgId) query = query.eq('org_id', orgId)
      const { data, error } = await query

      if (error) throw new AppError(error.message, 'database_error')
      return (data || []).map((row) => row.id)
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao buscar conversas',
        'database_error'
      )
    }
  },

  async getMensagensByLead(leadId: string): Promise<MensagemRow[]> {
    const conversas = await this.getConversasByLead(leadId)
    return this.getMensagensByConversaIds(conversas)
  },
}
