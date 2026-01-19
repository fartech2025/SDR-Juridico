export const mensagensService = {
    async getMensagensByConversaIds(conversaIds) {
        if (conversaIds.length === 0)
            return [];
        return [];
    },
    async getConversasByLead(leadId) {
        return leadId ? [] : [];
    },
    async getMensagensByLead(leadId) {
        const conversas = await this.getConversasByLead(leadId);
        return this.getMensagensByConversaIds(conversas);
    },
};
