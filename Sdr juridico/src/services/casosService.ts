import { supabase } from '@/lib/supabaseClient'
import type { CasoRow } from '@/lib/supabaseClient'
import { AppError } from '@/utils/errors'

export const casosService = {
  /**
   * Busca todos os casos
   */
  async getCasos(): Promise<CasoRow[]> {
    try {
      const { data, error } = await supabase
        .from('casos')
        .select('*, cliente:clientes(nome)')
        .order('created_at', { ascending: false })

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
      const { data, error } = await supabase
        .from('casos')
        .select('*, cliente:clientes(nome)')
        .eq('id', id)
        .single()

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
      const { data, error } = await supabase
        .from('casos')
        .select('*, cliente:clientes(nome)')
        .eq('status', status)
        .order('created_at', { ascending: false })

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
      const { data, error } = await supabase
        .from('casos')
        .select('*, cliente:clientes(nome)')
        .in('prioridade', ['alta', 'critica'])
        .order('created_at', { ascending: true })

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
      const query = supabase
        .from('casos')
        .select('*, cliente:clientes(nome)')
        .eq('cliente_id', clienteId)
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
      const payload = {
        ...caso,
        status: caso.status || 'aberto',
        prioridade: caso.prioridade || 'media',
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
      const { data, error } = await supabase
        .from('casos')
        .update(updates)
        .eq('id', id)
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
      const { error } = await supabase
        .from('casos')
        .delete()
        .eq('id', id)

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
    andamento: number
    resolvidos: number
    fechados: number
    encerrados: number
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
        andamento: casos.filter((c) => c.status === 'em_andamento').length,
        resolvidos: casos.filter((c) => c.status === 'resolvido').length,
        fechados: casos.filter((c) => c.status === 'fechado').length,
        encerrados: casos.filter((c) => c.status === 'encerrado').length,
        criticos: casos.filter((c) => ['alta', 'critica'].includes(c.prioridade)).length,
      }
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar estatísticas', 'database_error')
    }
  },
}
