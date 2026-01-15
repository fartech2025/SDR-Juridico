export interface MensagemRow {
  id: string
  created_at: string
  direction: 'in' | 'out'
  body: string | null
}

export const mensagensService = {
  async getMensagensByConversaIds(conversaIds: string[]): Promise<MensagemRow[]> {
    if (conversaIds.length === 0) return []
    return []
  },

  async getConversasByLead(leadId: string): Promise<string[]> {
    return leadId ? [] : []
  },

  async getMensagensByLead(leadId: string): Promise<MensagemRow[]> {
    const conversas = await this.getConversasByLead(leadId)
    return this.getMensagensByConversaIds(conversas)
  },
}
