import { supabase } from '@/lib/supabaseClient'
import type { Documentos } from '@/lib/supabaseClient'
import { AppError } from '@/utils/errors'

export const documentosService = {
  /**
   * Busca todos os documentos
   */
  async getDocumentos(): Promise<Documentos[]> {
    try {
      const { data, error } = await supabase
        .from('documentos')
        .select()
        .order('created_at', { ascending: false })

      if (error) throw new AppError(error.message, 'database_error')
      return data || []
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar documentos', 'database_error')
    }
  },

  /**
   * Busca um documento específico
   */
  async getDocumento(id: string): Promise<Documentos> {
    try {
      const { data, error } = await supabase
        .from('documentos')
        .select()
        .eq('id', id)
        .single()

      if (error) throw new AppError(error.message, 'database_error')
      if (!data) throw new AppError('Documento não encontrado', 'not_found')

      return data
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar documento', 'database_error')
    }
  },

  /**
   * Busca documentos de um caso específico
   */
  async getDocumentosByCaso(casoId: string): Promise<Documentos[]> {
    try {
      const { data, error } = await supabase
        .from('documentos')
        .select()
        .eq('caso_id', casoId)
        .order('created_at', { ascending: false })

      if (error) throw new AppError(error.message, 'database_error')
      return data || []
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar documentos do caso', 'database_error')
    }
  },

  /**
   * Busca documentos por status
   */
  async getDocumentosByStatus(status: 'pendente' | 'completo'): Promise<Documentos[]> {
    try {
      const { data, error } = await supabase
        .from('documentos')
        .select()
        .eq('status', status)
        .order('created_at', { ascending: false })

      if (error) throw new AppError(error.message, 'database_error')
      return data || []
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar documentos', 'database_error')
    }
  },

  /**
   * Busca documentos por tipo
   */
  async getDocumentosByTipo(tipo: string): Promise<Documentos[]> {
    try {
      const { data, error } = await supabase
        .from('documentos')
        .select()
        .eq('tipo', tipo)
        .order('created_at', { ascending: false })

      if (error) throw new AppError(error.message, 'database_error')
      return data || []
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar documentos', 'database_error')
    }
  },

  /**
   * Cria um novo documento
   */
  async createDocumento(documento: Omit<Documentos, 'id' | 'created_at' | 'updated_at'>): Promise<Documentos> {
    try {
      const { data, error } = await supabase
        .from('documentos')
        .insert([
          {
            ...documento,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (error) throw new AppError(error.message, 'database_error')
      if (!data) throw new AppError('Erro ao criar documento', 'database_error')

      return data
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao criar documento', 'database_error')
    }
  },

  /**
   * Atualiza um documento existente
   */
  async updateDocumento(id: string, updates: Partial<Omit<Documentos, 'id' | 'created_at' | 'updated_at'>>): Promise<Documentos> {
    try {
      const { data, error } = await supabase
        .from('documentos')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw new AppError(error.message, 'database_error')
      if (!data) throw new AppError('Documento não encontrado', 'not_found')

      return data
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao atualizar documento', 'database_error')
    }
  },

  /**
   * Deleta um documento
   */
  async deleteDocumento(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('documentos')
        .delete()
        .eq('id', id)

      if (error) throw new AppError(error.message, 'database_error')
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao deletar documento', 'database_error')
    }
  },

  /**
   * Marca documento como completo
   */
  async marcarCompleto(id: string): Promise<Documentos> {
    return this.updateDocumento(id, { status: 'completo' })
  },

  /**
   * Marca documento como pendente
   */
  async marcarPendente(id: string): Promise<Documentos> {
    return this.updateDocumento(id, { status: 'pendente' })
  },

  /**
   * Busca documentos pendentes
   */
  async getDocumentosPendentes(): Promise<Documentos[]> {
    return this.getDocumentosByStatus('pendente')
  },

  /**
   * Busca estatísticas de documentos
   */
  async getEstatisticas(): Promise<{
    total: number
    pendentes: number
    completos: number
  }> {
    try {
      const { data, error } = await supabase
        .from('documentos')
        .select()

      if (error) throw new AppError(error.message, 'database_error')

      const documentos = data || []

      return {
        total: documentos.length,
        pendentes: documentos.filter((d) => d.status === 'pendente').length,
        completos: documentos.filter((d) => d.status === 'completo').length,
      }
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar estatísticas', 'database_error')
    }
  },
}
