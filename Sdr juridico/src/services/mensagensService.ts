import { supabase, type MensagemRow } from '@/lib/supabaseClient'
import { AppError } from '@/utils/errors'

export const mensagensService = {
  async getMensagensByConversaIds(conversaIds: string[]): Promise<MensagemRow[]> {
    if (conversaIds.length === 0) return []
    try {
      const { data, error } = await supabase
        .from('mensagens')
        .select('*')
        .in('conversa_id', conversaIds)
        .order('created_at', { ascending: false })
        .limit(30)

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
      const { data, error } = await supabase
        .from('conversas')
        .select('id')
        .eq('lead_id', leadId)

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
