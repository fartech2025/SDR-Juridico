/**
 * Servico de Leads
 * CRUD operations para gerenciar leads
 */
import { supabase } from '@/lib/supabaseClient';
import { AppError } from '@/utils/errors';
const mapDbLeadStatusToUiStatus = (status) => {
    if (status === 'novo')
        return 'novo';
    if (status === 'em_triagem')
        return 'em_contato';
    if (status === 'qualificado')
        return 'qualificado';
    if (status === 'nao_qualificado')
        return 'perdido';
    if (status === 'convertido')
        return 'ganho';
    if (status === 'perdido')
        return 'perdido';
    return 'novo';
};
const mapUiStatusToDbStatus = (status) => {
    if (status === 'em_contato')
        return 'em_triagem';
    if (status === 'qualificado')
        return 'qualificado';
    if (status === 'proposta')
        return 'qualificado';
    if (status === 'ganho')
        return 'convertido';
    if (status === 'perdido')
        return 'perdido';
    return 'novo';
};
const mapUiStatusToDbFilter = (status) => {
    if (status === 'em_contato')
        return ['em_triagem'];
    if (status === 'qualificado')
        return ['qualificado'];
    if (status === 'proposta')
        return ['qualificado'];
    if (status === 'ganho')
        return ['convertido'];
    if (status === 'perdido')
        return ['perdido', 'nao_qualificado'];
    return ['novo'];
};
const mapDbLeadToLeadRow = (row) => {
    const qualificacao = row.qualificacao || {};
    return {
        id: row.id,
        created_at: row.created_at,
        updated_at: row.created_at,
        org_id: row.org_id ?? null,
        nome: row.nome || '',
        email: row.email || '',
        telefone: row.telefone || null,
        empresa: qualificacao.empresa ?? null,
        area: qualificacao.area ?? null,
        origem: row.origem || null,
        status: mapDbLeadStatusToUiStatus(row.status),
        heat: qualificacao.heat || 'frio',
        ultimo_contato: row.last_contact_at || null,
        responsavel: qualificacao.responsavel ?? null,
        observacoes: row.resumo || qualificacao.observacoes || null,
    };
};
const buildLeadPayload = (lead, applyDefaults) => {
    const payload = {};
    if (lead.nome !== undefined)
        payload.nome = lead.nome;
    if (lead.email !== undefined)
        payload.email = lead.email;
    if (lead.telefone !== undefined)
        payload.telefone = lead.telefone;
    if (lead.origem !== undefined)
        payload.origem = lead.origem;
    if (lead.status !== undefined)
        payload.status = mapUiStatusToDbStatus(lead.status);
    if (lead.ultimo_contato !== undefined)
        payload.last_contact_at = lead.ultimo_contato;
    if (lead.observacoes !== undefined)
        payload.resumo = lead.observacoes;
    if (lead.area !== undefined && lead.area)
        payload.assunto = lead.area;
    const qualificacao = {};
    if (lead.empresa !== undefined)
        qualificacao.empresa = lead.empresa;
    if (lead.area !== undefined)
        qualificacao.area = lead.area;
    if (lead.heat !== undefined)
        qualificacao.heat = lead.heat;
    if (lead.responsavel !== undefined)
        qualificacao.responsavel = lead.responsavel;
    if (lead.observacoes !== undefined)
        qualificacao.observacoes = lead.observacoes;
    if (Object.keys(qualificacao).length > 0)
        payload.qualificacao = qualificacao;
    if (applyDefaults) {
        if (!payload.status)
            payload.status = 'novo';
        if (!payload.canal)
            payload.canal = 'whatsapp';
    }
    return payload;
};
export const leadsService = {
    async assignLeadAdvogado(leadId, advogadoId, advogadoNome) {
        try {
            const { data: current, error: currentError } = await supabase
                .from('leads')
                .select('qualificacao')
                .eq('id', leadId)
                .single();
            if (currentError)
                throw new AppError(currentError.message, 'database_error');
            const qualificacao = {
                ...(current?.qualificacao || {}),
                responsavel: advogadoNome,
                responsavel_id: advogadoId,
            };
            const { data, error } = await supabase
                .from('leads')
                .update({ assigned_user_id: advogadoId, qualificacao })
                .eq('id', leadId)
                .select('id, created_at, org_id, status, canal, nome, telefone, email, origem, assunto, resumo, qualificacao, assigned_user_id, cliente_id, remote_id, last_contact_at')
                .single();
            if (error)
                throw new AppError(error.message, 'database_error');
            return mapDbLeadToLeadRow(data);
        }
        catch (error) {
            throw new AppError(error instanceof Error ? error.message : 'Erro ao encaminhar lead', 'database_error');
        }
    },
    // Buscar todos os leads
    async getLeads() {
        try {
            const { data, error } = await supabase
                .from('leads')
                .select('id, created_at, org_id, status, canal, nome, telefone, email, origem, assunto, resumo, qualificacao, assigned_user_id, cliente_id, remote_id, last_contact_at')
                .order('created_at', { ascending: false });
            if (error)
                throw new AppError(error.message, 'database_error');
            return (data || []).map((row) => mapDbLeadToLeadRow(row));
        }
        catch (error) {
            throw new AppError(error instanceof Error ? error.message : 'Erro ao buscar leads', 'database_error');
        }
    },
    // Buscar lead por ID
    async getLead(id) {
        try {
            const { data, error } = await supabase
                .from('leads')
                .select('id, created_at, org_id, status, canal, nome, telefone, email, origem, assunto, resumo, qualificacao, assigned_user_id, cliente_id, remote_id, last_contact_at')
                .eq('id', id)
                .single();
            if (error)
                throw new AppError(error.message, 'database_error');
            return mapDbLeadToLeadRow(data);
        }
        catch (error) {
            throw new AppError(error instanceof Error ? error.message : 'Erro ao buscar lead', 'database_error');
        }
    },
    // Buscar leads por status
    async getLeadsByStatus(status) {
        try {
            const statusFilter = mapUiStatusToDbFilter(status);
            const { data, error } = await supabase
                .from('leads')
                .select('id, created_at, org_id, status, canal, nome, telefone, email, origem, assunto, resumo, qualificacao, assigned_user_id, cliente_id, remote_id, last_contact_at')
                .in('status', statusFilter)
                .order('created_at', { ascending: false });
            if (error)
                throw new AppError(error.message, 'database_error');
            return (data || []).map((row) => mapDbLeadToLeadRow(row));
        }
        catch (error) {
            throw new AppError(error instanceof Error ? error.message : 'Erro ao buscar leads', 'database_error');
        }
    },
    // Buscar leads quentes
    async getHotLeads() {
        try {
            const leads = await this.getLeads();
            const now = Date.now();
            return leads.filter((lead) => {
                const base = lead.ultimo_contato || lead.created_at;
                if (!base)
                    return false;
                const diffDays = (now - new Date(base).getTime()) / (1000 * 60 * 60 * 24);
                return diffDays <= 2;
            });
        }
        catch (error) {
            throw new AppError(error instanceof Error ? error.message : 'Erro ao buscar leads quentes', 'database_error');
        }
    },
    // Criar novo lead
    async createLead(lead) {
        try {
            const payload = buildLeadPayload(lead, true);
            const { data, error } = await supabase
                .from('leads')
                .insert(payload)
                .select('id, created_at, org_id, status, canal, nome, telefone, email, origem, assunto, resumo, qualificacao, assigned_user_id, cliente_id, remote_id, last_contact_at')
                .single();
            if (error)
                throw new AppError(error.message, 'database_error');
            return mapDbLeadToLeadRow(data);
        }
        catch (error) {
            throw new AppError(error instanceof Error ? error.message : 'Erro ao criar lead', 'database_error');
        }
    },
    // Atualizar lead
    async updateLead(id, updates) {
        try {
            const payload = buildLeadPayload(updates, false);
            const { data, error } = await supabase
                .from('leads')
                .update(payload)
                .eq('id', id)
                .select('id, created_at, org_id, status, canal, nome, telefone, email, origem, assunto, resumo, qualificacao, assigned_user_id, cliente_id, remote_id, last_contact_at')
                .single();
            if (error)
                throw new AppError(error.message, 'database_error');
            return mapDbLeadToLeadRow(data);
        }
        catch (error) {
            throw new AppError(error instanceof Error ? error.message : 'Erro ao atualizar lead', 'database_error');
        }
    },
    // Deletar lead
    async deleteLead(id) {
        try {
            const { error } = await supabase.from('leads').delete().eq('id', id);
            if (error)
                throw new AppError(error.message, 'database_error');
        }
        catch (error) {
            throw new AppError(error instanceof Error ? error.message : 'Erro ao deletar lead', 'database_error');
        }
    },
};
