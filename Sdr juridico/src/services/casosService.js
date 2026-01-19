import { supabase } from '@/lib/supabaseClient';
import { AppError } from '@/utils/errors';
const prioridadeToNumber = (prioridade) => {
    if (!prioridade)
        return null;
    if (prioridade === 'baixa')
        return 1;
    if (prioridade === 'media')
        return 2;
    if (prioridade === 'alta')
        return 3;
    if (prioridade === 'critica')
        return 4;
    return 2;
};
const numberToPrioridade = (value) => {
    if (value === 1)
        return 'baixa';
    if (value === 2)
        return 'media';
    if (value === 3)
        return 'alta';
    if (value === 4)
        return 'critica';
    return 'media';
};
const mapDbStatusToUiStatus = (status) => {
    if (status === 'encerrado')
        return 'encerrado';
    if (status === 'arquivado')
        return 'suspenso';
    if (status === 'triagem' || status === 'negociacao' || status === 'contrato' || status === 'andamento') {
        return 'ativo';
    }
    return 'ativo';
};
const mapDbStatusToStage = (status) => {
    if (status === 'triagem')
        return 'triagem';
    if (status === 'negociacao')
        return 'negociacao';
    if (status === 'andamento')
        return 'em_andamento';
    if (status === 'contrato' || status === 'encerrado' || status === 'arquivado')
        return 'conclusao';
    return null;
};
const normalizeStage = (value) => {
    if (!value)
        return null;
    if (value === 'triagem')
        return 'triagem';
    if (value === 'negociacao')
        return 'negociacao';
    if (value === 'em_andamento')
        return 'em_andamento';
    if (value === 'andamento')
        return 'em_andamento';
    if (value === 'conclusao')
        return 'conclusao';
    if (value === 'contrato')
        return 'conclusao';
    return null;
};
const mapUiStageToDbStage = (stage) => {
    if (!stage)
        return null;
    if (stage === 'em_andamento')
        return 'andamento';
    if (stage === 'conclusao')
        return 'contrato';
    return stage;
};
const mapUiStatusToDbStatus = (status) => {
    if (status === 'encerrado')
        return 'encerrado';
    if (status === 'suspenso')
        return 'arquivado';
    if (status === 'ativo')
        return 'andamento';
    if (status === 'em_andamento')
        return 'andamento';
    if (status === 'aberto')
        return 'triagem';
    if (status === 'fechado')
        return 'arquivado';
    if (status === 'resolvido')
        return 'contrato';
    return 'andamento';
};
const mapUiStatusToDbFilter = (status) => {
    if (status === 'ativo')
        return ['triagem', 'negociacao', 'contrato', 'andamento'];
    if (status === 'suspenso')
        return ['arquivado'];
    if (status === 'encerrado')
        return ['encerrado'];
    if (status === 'aberto')
        return ['triagem'];
    if (status === 'em_andamento')
        return ['andamento'];
    if (status === 'resolvido')
        return ['contrato'];
    if (status === 'fechado')
        return ['arquivado'];
    return ['andamento'];
};
const mapDbCasoToCasoRow = (row) => ({
    id: row.id,
    created_at: row.created_at,
    updated_at: row.encerrado_em || row.created_at,
    org_id: row.org_id ?? null,
    titulo: row.titulo,
    descricao: row.descricao || null,
    cliente_id: row.cliente_id || null,
    lead_id: row.lead_id || null,
    area: row.area || '',
    status: mapDbStatusToUiStatus(row.status),
    prioridade: numberToPrioridade(row.prioridade),
    heat: null,
    stage: normalizeStage(row.fase_atual) || mapDbStatusToStage(row.status),
    valor: row.valor_estimado || null,
    sla_risk: null,
    tags: null,
    responsavel: null,
    data_abertura: row.created_at,
    data_encerramento: row.encerrado_em || null,
    cliente: row.cliente || null,
});
const buildCasoPayload = (caso, applyDefaults) => {
    const payload = {};
    if (caso.titulo !== undefined)
        payload.titulo = caso.titulo;
    if (caso.descricao !== undefined)
        payload.descricao = caso.descricao;
    if (caso.area !== undefined)
        payload.area = caso.area;
    if (caso.status !== undefined)
        payload.status = mapUiStatusToDbStatus(caso.status);
    if (caso.stage !== undefined)
        payload.fase_atual = mapUiStageToDbStage(caso.stage);
    if (caso.cliente_id !== undefined)
        payload.cliente_id = caso.cliente_id;
    if (caso.lead_id !== undefined)
        payload.lead_id = caso.lead_id;
    if (caso.stage !== undefined)
        payload.fase_atual = caso.stage;
    if (caso.valor !== undefined)
        payload.valor_estimado = caso.valor;
    if (caso.data_encerramento !== undefined)
        payload.encerrado_em = caso.data_encerramento;
    if (caso.prioridade !== undefined) {
        payload.prioridade = prioridadeToNumber(caso.prioridade);
    }
    else if (applyDefaults) {
        payload.prioridade = prioridadeToNumber('media');
    }
    if (applyDefaults && !payload.status) {
        payload.status = 'triagem';
    }
    return payload;
};
export const casosService = {
    async assignCasoAdvogado(casoId, advogadoId) {
        try {
            const { data, error } = await supabase
                .from('casos')
                .update({ responsavel_user_id: advogadoId })
                .eq('id', casoId)
                .select('*, cliente:clientes(nome)')
                .single();
            if (error)
                throw new AppError(error.message, 'database_error');
            if (!data)
                throw new AppError('Caso nao encontrado', 'not_found');
            return mapDbCasoToCasoRow(data);
        }
        catch (error) {
            throw error instanceof AppError ? error : new AppError('Erro ao encaminhar caso', 'database_error');
        }
    },
    /**
     * Busca todos os casos
     */
    async getCasos() {
        try {
            const { data, error } = await supabase
                .from('casos')
                .select('*, cliente:clientes(nome)')
                .order('created_at', { ascending: false });
            if (error)
                throw new AppError(error.message, 'database_error');
            return (data || []).map((row) => mapDbCasoToCasoRow(row));
        }
        catch (error) {
            throw error instanceof AppError ? error : new AppError('Erro ao buscar casos', 'database_error');
        }
    },
    /**
     * Busca um caso especifico
     */
    async getCaso(id) {
        try {
            const { data, error } = await supabase
                .from('casos')
                .select('*, cliente:clientes(nome)')
                .eq('id', id)
                .single();
            if (error)
                throw new AppError(error.message, 'database_error');
            if (!data)
                throw new AppError('Caso nao encontrado', 'not_found');
            return mapDbCasoToCasoRow(data);
        }
        catch (error) {
            throw error instanceof AppError ? error : new AppError('Erro ao buscar caso', 'database_error');
        }
    },
    /**
     * Busca casos por status
     */
    async getCasosByStatus(status) {
        try {
            const statusFilter = mapUiStatusToDbFilter(status);
            const { data, error } = await supabase
                .from('casos')
                .select('*, cliente:clientes(nome)')
                .in('status', statusFilter)
                .order('created_at', { ascending: false });
            if (error)
                throw new AppError(error.message, 'database_error');
            return (data || []).map((row) => mapDbCasoToCasoRow(row));
        }
        catch (error) {
            throw error instanceof AppError ? error : new AppError('Erro ao buscar casos', 'database_error');
        }
    },
    /**
     * Busca casos criticos (alta prioridade)
     */
    async getCasosCriticos() {
        try {
            const { data, error } = await supabase
                .from('casos')
                .select('*, cliente:clientes(nome)')
                .in('prioridade', [3, 4])
                .order('created_at', { ascending: true });
            if (error)
                throw new AppError(error.message, 'database_error');
            return (data || []).map((row) => mapDbCasoToCasoRow(row));
        }
        catch (error) {
            throw error instanceof AppError ? error : new AppError('Erro ao buscar casos criticos', 'database_error');
        }
    },
    /**
     * Busca casos de um cliente especifico
     */
    async getCasosByCliente(clienteId) {
        try {
            const query = supabase
                .from('casos')
                .select('*, cliente:clientes(nome)')
                .eq('cliente_id', clienteId);
            const { data, error } = await query.order('created_at', { ascending: false });
            if (error)
                throw new AppError(error.message, 'database_error');
            return (data || []).map((row) => mapDbCasoToCasoRow(row));
        }
        catch (error) {
            throw error instanceof AppError ? error : new AppError('Erro ao buscar casos do cliente', 'database_error');
        }
    },
    /**
     * Cria um novo caso
     */
    async createCaso(caso) {
        try {
            const payload = buildCasoPayload(caso, true);
            const { data, error } = await supabase
                .from('casos')
                .insert([payload])
                .select()
                .single();
            if (error)
                throw new AppError(error.message, 'database_error');
            if (!data)
                throw new AppError('Erro ao criar caso', 'database_error');
            return mapDbCasoToCasoRow(data);
        }
        catch (error) {
            throw error instanceof AppError ? error : new AppError('Erro ao criar caso', 'database_error');
        }
    },
    /**
     * Atualiza um caso existente
     */
    async updateCaso(id, updates) {
        try {
            const payload = buildCasoPayload(updates, false);
            const { data, error } = await supabase
                .from('casos')
                .update(payload)
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw new AppError(error.message, 'database_error');
            if (!data)
                throw new AppError('Caso nao encontrado', 'not_found');
            return mapDbCasoToCasoRow(data);
        }
        catch (error) {
            throw error instanceof AppError ? error : new AppError('Erro ao atualizar caso', 'database_error');
        }
    },
    /**
     * Deleta um caso
     */
    async deleteCaso(id) {
        try {
            const { error } = await supabase
                .from('casos')
                .delete()
                .eq('id', id);
            if (error)
                throw new AppError(error.message, 'database_error');
        }
        catch (error) {
            throw error instanceof AppError ? error : new AppError('Erro ao deletar caso', 'database_error');
        }
    },
    /**
     * Muda status de um caso
     */
    async mudarStatus(id, novoStatus) {
        return this.updateCaso(id, { status: novoStatus });
    },
    /**
     * Muda prioridade de um caso
     */
    async mudarPrioridade(id, novaPrioridade) {
        return this.updateCaso(id, { prioridade: novaPrioridade });
    },
    /**
     * Busca estatisticas de casos
     */
    async getEstatisticas() {
        try {
            const { data, error } = await supabase
                .from('casos')
                .select('status, prioridade');
            if (error)
                throw new AppError(error.message, 'database_error');
            const casos = data || [];
            return {
                total: casos.length,
                abertos: casos.filter((c) => c.status === 'triagem').length,
                andamento: casos.filter((c) => ['andamento', 'negociacao'].includes(c.status)).length,
                resolvidos: casos.filter((c) => c.status === 'contrato').length,
                fechados: casos.filter((c) => c.status === 'arquivado').length,
                encerrados: casos.filter((c) => c.status === 'encerrado').length,
                criticos: casos.filter((c) => [3, 4].includes(c.prioridade)).length,
            };
        }
        catch (error) {
            throw error instanceof AppError ? error : new AppError('Erro ao buscar estatisticas', 'database_error');
        }
    },
};
