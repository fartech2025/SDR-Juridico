import { supabase } from '@/lib/supabaseClient'
import type { Casos } from '@/lib/supabaseClient'
import { AppError } from '@/utils/errors'

export const casosService = {
  /**
   * Busca todos os casos
   */
  async getCasos(): Promise<Casos[]> {
    try {
      const { data, error } = await supabase
        .from('casos')
        .select()
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
  async getCaso(id: string): Promise<Casos> {
    try {
      const { data, error } = await supabase
        .from('casos')
        .select()
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
  async getCasosByStatus(status: 'aberto' | 'em_andamento' | 'resolvido' | 'fechado'): Promise<Casos[]> {
    try {
      const { data, error } = await supabase
        .from('casos')
        .select()
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
  async getCasosCriticos(): Promise<Casos[]> {
    try {
      const { data, error } = await supabase
        .from('casos')
        .select()
        .eq('prioridade', 'critica')
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
  async getCasosByCliente(clienteId: string): Promise<Casos[]> {
    try {
      const { data, error } = await supabase
        .from('casos')
        .select()
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false })

      if (error) throw new AppError(error.message, 'database_error')
      return data || []
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar casos do cliente', 'database_error')
    }
  },

  /**
   * Cria um novo caso
   */
  async createCaso(caso: Omit<Casos, 'id' | 'created_at' | 'updated_at'>): Promise<Casos> {
    try {
      const { data, error } = await supabase
        .from('casos')
        .insert([
          {
            ...caso,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
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
  async updateCaso(id: string, updates: Partial<Omit<Casos, 'id' | 'created_at' | 'updated_at'>>): Promise<Casos> {
    try {
      const { data, error } = await supabase
        .from('casos')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
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
  async mudarStatus(id: string, novoStatus: 'aberto' | 'em_andamento' | 'resolvido' | 'fechado'): Promise<Casos> {
    return this.updateCaso(id, { status: novoStatus })
  },

  /**
   * Muda prioridade de um caso
   */
  async mudarPrioridade(id: string, novaPrioridade: 'baixa' | 'media' | 'alta' | 'critica'): Promise<Casos> {
    return this.updateCaso(id, { prioridade: novaPrioridade })
  },

  /**
   * Busca estatísticas de casos
   */
  async getEstatisticas(): Promise<{
    total: number
    abertos: number
    em_andamento: number
    resolvidos: number
    fechados: number
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
        em_andamento: casos.filter((c) => c.status === 'em_andamento').length,
        resolvidos: casos.filter((c) => c.status === 'resolvido').length,
        fechados: casos.filter((c) => c.status === 'fechado').length,
        criticos: casos.filter((c) => c.prioridade === 'critica').length,
      }
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar estatísticas', 'database_error')
    }
  },
}
