import { supabase } from '@/lib/supabaseClient'
import type { DocumentoRow } from '@/lib/supabaseClient'
import { AppError } from '@/utils/errors'

export const documentosService = {
  /**
   * Resolve meta padrão para documentos
   */
  resolveMetaDefaults(documento: Omit<DocumentoRow, 'id' | 'created_at'>) {
    const existingMeta =
      documento.meta && typeof documento.meta === 'object'
        ? (documento.meta as Record<string, unknown>)
        : {}
    const tipoFromMime =
      documento.mime_type && documento.mime_type.includes('/')
        ? documento.mime_type.split('/')[1]?.toUpperCase()
        : undefined
    const tipo =
      (existingMeta.tipo as string | undefined) ||
      (existingMeta.type as string | undefined) ||
      tipoFromMime ||
      'Documento'
    const status = (existingMeta.status as string | undefined) || 'pendente'
    return {
      ...existingMeta,
      tipo,
      status,
    }
  },
  /**
   * Busca todos os documentos
   */
  async getDocumentos(): Promise<DocumentoRow[]> {
    try {
      const { data, error } = await supabase
        .from('documentos')
        .select('*, cliente:clientes(nome)')
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
  async getDocumento(id: string): Promise<DocumentoRow> {
    try {
      const { data, error } = await supabase
        .from('documentos')
        .select('*, cliente:clientes(nome)')
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
  async getDocumentosByCaso(casoId: string): Promise<DocumentoRow[]> {
    try {
      const { data, error } = await supabase
        .from('documentos')
        .select('*, cliente:clientes(nome)')
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
  async getDocumentosByStatus(status: string): Promise<DocumentoRow[]> {
    try {
      const documentos = await this.getDocumentos()
      return documentos.filter((doc) => {
        if (!doc.meta || typeof doc.meta !== 'object') return false
        return (doc.meta as { status?: string }).status === status
      })
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar documentos', 'database_error')
    }
  },

  /**
   * Busca documentos por tipo
   */
  async getDocumentosByTipo(tipo: string): Promise<DocumentoRow[]> {
    try {
      const documentos = await this.getDocumentos()
      return documentos.filter((doc) => {
        if (!doc.meta || typeof doc.meta !== 'object') return false
        const meta = doc.meta as { tipo?: string; type?: string }
        return meta.tipo === tipo || meta.type === tipo
      })
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar documentos', 'database_error')
    }
  },

  /**
   * Cria um novo documento
   */
  async createDocumento(
    documento: Omit<DocumentoRow, 'id' | 'created_at'>
  ): Promise<DocumentoRow> {
    try {
      const meta = this.resolveMetaDefaults(documento)
      const { data, error } = await supabase
        .from('documentos')
        .insert([{ ...documento, meta }])
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
  async updateDocumento(
    id: string,
    updates: Partial<Omit<DocumentoRow, 'id' | 'created_at' | 'org_id'>>
  ): Promise<DocumentoRow> {
    try {
      const { data, error } = await supabase
        .from('documentos')
        .update(updates)
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
  async marcarCompleto(id: string): Promise<DocumentoRow> {
    const meta = { status: 'aprovado' }
    return this.updateDocumento(id, { meta })
  },

  /**
   * Marca documento como pendente
   */
  async marcarPendente(id: string): Promise<DocumentoRow> {
    const meta = { status: 'pendente' }
    return this.updateDocumento(id, { meta })
  },

  /**
   * Busca documentos pendentes
   */
  async getDocumentosPendentes(): Promise<DocumentoRow[]> {
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
      const documentos = await this.getDocumentos()

      return {
        total: documentos.length,
        pendentes: documentos.filter((doc) => {
          const status = doc.meta && typeof doc.meta === 'object'
            ? (doc.meta as { status?: string }).status
            : null
          return status === 'pendente'
        }).length,
        completos: documentos.filter((doc) => {
          const status = doc.meta && typeof doc.meta === 'object'
            ? (doc.meta as { status?: string }).status
            : null
          return status === 'aprovado'
        }).length,
      }
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar estatísticas', 'database_error')
    }
  },
}
