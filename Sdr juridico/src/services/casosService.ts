import { supabase } from '@/lib/supabaseClient'
import { getActiveOrgId, requireOrgId } from '@/lib/org'
import type { CasoRow } from '@/lib/supabaseClient'
import { AppError } from '@/utils/errors'

export const casosService = {
  /**
   * Busca todos os casos
   */
  async getCasos(): Promise<CasoRow[]> {
    try {
      const orgId = await getActiveOrgId()
      let query = supabase.from('casos').select('*, cliente:clientes(nome)')
      if (orgId) query = query.eq('org_id', orgId)
      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw new AppError(error.message, 'database_error')
      return data || []
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar casos', 'database_error')
    }
  },

  /**
   * Busca um caso específico
   */
  async getCaso(id: string): Promise<CasoRow> {
    try {
      const orgId = await getActiveOrgId()
      let query = supabase.from('casos').select('*, cliente:clientes(nome)').eq('id', id)
      if (orgId) query = query.eq('org_id', orgId)
      const { data, error } = await query.single()

      if (error) throw new AppError(error.message, 'database_error')
      if (!data) throw new AppError('Caso não encontrado', 'not_found')

      return data
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar caso', 'database_error')
    }
  },

  /**
   * Busca casos por status
   */
  async getCasosByStatus(status: CasoRow['status']): Promise<CasoRow[]> {
    try {
      const orgId = await getActiveOrgId()
      let query = supabase.from('casos').select('*, cliente:clientes(nome)').eq('status', status)
      if (orgId) query = query.eq('org_id', orgId)
      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw new AppError(error.message, 'database_error')
      return data || []
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar casos', 'database_error')
    }
  },

  /**
   * Busca casos críticos (alta prioridade)
   */
  async getCasosCriticos(): Promise<CasoRow[]> {
    try {
      const orgId = await getActiveOrgId()
      let query = supabase.from('casos').select('*, cliente:clientes(nome)').gte('prioridade', 3)
      if (orgId) query = query.eq('org_id', orgId)
      const { data, error } = await query.order('created_at', { ascending: true })

      if (error) throw new AppError(error.message, 'database_error')
      return data || []
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar casos críticos', 'database_error')
    }
  },

  /**
   * Busca casos de um cliente específico
   */
  async getCasosByCliente(clienteId: string): Promise<CasoRow[]> {
    try {
      const orgId = await getActiveOrgId()
      let query = supabase
        .from('casos')
        .select('*, cliente:clientes(nome)')
        .eq('cliente_id', clienteId)
      if (orgId) query = query.eq('org_id', orgId)
      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw new AppError(error.message, 'database_error')
      return data || []
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar casos do cliente', 'database_error')
    }
  },

  /**
   * Cria um novo caso
   */
  async createCaso(caso: Omit<CasoRow, 'id' | 'created_at' | 'org_id'>): Promise<CasoRow> {
    try {
      const orgId = await requireOrgId()
      const payload = {
        ...caso,
        org_id: orgId,
        status: caso.status || 'triagem',
        prioridade: typeof caso.prioridade === 'number' ? caso.prioridade : 2,
      }
      const { data, error } = await supabase
        .from('casos')
        .insert([payload])
        .select()
        .single()

      if (error) throw new AppError(error.message, 'database_error')
      if (!data) throw new AppError('Erro ao criar caso', 'database_error')

      return data
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao criar caso', 'database_error')
    }
  },

  /**
   * Atualiza um caso existente
   */
  async updateCaso(
    id: string,
    updates: Partial<Omit<CasoRow, 'id' | 'created_at' | 'org_id'>>
  ): Promise<CasoRow> {
    try {
      const orgId = await requireOrgId()
      const { data, error } = await supabase
        .from('casos')
        .update(updates)
        .eq('id', id)
        .eq('org_id', orgId)
        .select()
        .single()

      if (error) throw new AppError(error.message, 'database_error')
      if (!data) throw new AppError('Caso não encontrado', 'not_found')

      return data
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao atualizar caso', 'database_error')
    }
  },

  /**
   * Deleta um caso
   */
  async deleteCaso(id: string): Promise<void> {
    try {
      const orgId = await requireOrgId()
      const { error } = await supabase
        .from('casos')
        .delete()
        .eq('id', id)
        .eq('org_id', orgId)

      if (error) throw new AppError(error.message, 'database_error')
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao deletar caso', 'database_error')
    }
  },

  /**
   * Muda status de um caso
   */
  async mudarStatus(id: string, novoStatus: CasoRow['status']): Promise<CasoRow> {
    return this.updateCaso(id, { status: novoStatus })
  },

  /**
   * Muda prioridade de um caso
   */
  async mudarPrioridade(id: string, novaPrioridade: CasoRow['prioridade']): Promise<CasoRow> {
    return this.updateCaso(id, { prioridade: novaPrioridade })
  },

  /**
   * Busca estatísticas de casos
   */
  async getEstatisticas(): Promise<{
    total: number
    abertos: number
    triagem: number
    negociacao: number
    contrato: number
    andamento: number
    encerrados: number
    arquivados: number
    criticos: number
  }> {
    try {
      const { data, error } = await supabase
        .from('casos')
        .select()

      if (error) throw new AppError(error.message, 'database_error')

      const casos = data || []

      return {
        total: casos.length,
        abertos: casos.filter((c) => c.status === 'aberto').length,
        triagem: casos.filter((c) => c.status === 'triagem').length,
        negociacao: casos.filter((c) => c.status === 'negociacao').length,
        contrato: casos.filter((c) => c.status === 'contrato').length,
        andamento: casos.filter((c) => c.status === 'andamento').length,
        encerrados: casos.filter((c) => c.status === 'encerrado').length,
        arquivados: casos.filter((c) => c.status === 'arquivado').length,
        criticos: casos.filter((c) => c.prioridade >= 3).length,
      }
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar estatísticas', 'database_error')
    }
  },
}
