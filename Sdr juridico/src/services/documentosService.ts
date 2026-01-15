import { supabase } from '@/lib/supabaseClient'
import type { DocumentoRow } from '@/lib/supabaseClient'
import { AppError } from '@/utils/errors'

export const documentosService = {
  /**
   * Busca todos os documentos
   */
  async getDocumentos(): Promise<DocumentoRow[]> {
    try {
      const { data, error } = await supabase
        .from('documentos')
        .select('*')
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
        .select('*')
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
        .select('*')
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
      return documentos.filter((doc) => doc.status === status)
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
      return documentos.filter((doc) => doc.tipo === tipo)
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar documentos', 'database_error')
    }
  },

  /**
   * Cria um novo documento
   */
  async createDocumento(
    documento: Omit<DocumentoRow, 'id' | 'created_at' | 'updated_at' | 'org_id'>
  ): Promise<DocumentoRow> {
    try {
      const { data, error } = await supabase
        .from('documentos')
        .insert([documento])
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
    updates: Partial<Omit<DocumentoRow, 'id' | 'created_at' | 'updated_at' | 'org_id'>>
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
    return this.updateDocumento(id, { status: 'aprovado' })
  },

  /**
   * Marca documento como pendente
   */
  async marcarPendente(id: string): Promise<DocumentoRow> {
    return this.updateDocumento(id, { status: 'pendente' })
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
        pendentes: documentos.filter((doc) => doc.status === 'pendente').length,
        completos: documentos.filter((doc) => doc.status === 'aprovado').length,
      }
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar estatísticas', 'database_error')
    }
  },

  /**
   * Faz upload de um documento para o Supabase Storage
   */
  async uploadDocumento(params: {
    arquivo: File
    categoria?: string
    casoId?: string
    tags?: string[]
    descricao?: string
  }): Promise<DocumentoRow> {
    try {
      const { arquivo, categoria = 'geral', casoId, tags, descricao } = params

      // Validar arquivo
      if (!arquivo) {
        throw new AppError('Arquivo é obrigatório', 'validation_error')
      }

      // Validar tamanho (10MB)
      const MAX_SIZE = 10 * 1024 * 1024
      if (arquivo.size > MAX_SIZE) {
        throw new AppError('Arquivo muito grande. Tamanho máximo: 10MB', 'validation_error')
      }

      // Validar tipo de arquivo
      const tiposPermitidos = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/heic',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ]

      if (!tiposPermitidos.includes(arquivo.type)) {
        throw new AppError('Tipo de arquivo não permitido. Use PDF, imagens ou documentos Office', 'validation_error')
      }

      // Obter usuário autenticado
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (authError || !session?.user) {
        throw new AppError('Usuário não autenticado. Faça login para fazer upload de documentos.', 'auth_error')
      }

      const user = session.user
      // Gerar nome único para o arquivo
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(2, 9)
      const extensao = arquivo.name.split('.').pop()
      const nomeArquivo = `${timestamp}_${randomStr}.${extensao}`
      
      // Path no storage: user_id/nome_arquivo
      const storagePath = `${user.id}/${nomeArquivo}`

      // Upload para o Storage
      const { error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(storagePath, arquivo, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        throw new AppError(uploadError.message, 'storage_error')
      }

      // Registrar no banco de dados
      const { data: documento, error: dbError } = await supabase
        .from('documentos')
        .insert({
          titulo: arquivo.name,
          descricao: descricao || null,
          tipo: categoria || 'geral',
          status: 'pendente',
          url: storagePath,
          arquivo_nome: arquivo.name,
          arquivo_tamanho: arquivo.size,
          mime_type: arquivo.type,
          solicitado_por: user.id,
          tags: tags || [],
          caso_id: casoId || null,
        })
        .select()
        .single()

      if (dbError) {
        // Se falhar ao registrar no banco, tentar deletar do storage
        await supabase.storage.from('documentos').remove([storagePath])
        throw new AppError(dbError.message, 'database_error')
      }

      return documento
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao fazer upload do documento', 'unknown_error')
    }
  },

  /**
   * Obtém URL pública temporária para visualizar/baixar documento
   */
  async obterUrlDocumento(storagePath: string): Promise<string> {
    try {
      if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
        return storagePath
      }
      const { data, error } = await supabase.storage
        .from('documentos')
        .createSignedUrl(storagePath, 3600) // 1 hora

      if (error) throw new AppError(error.message, 'storage_error')
      if (!data.signedUrl) throw new AppError('Erro ao gerar URL', 'storage_error')

      return data.signedUrl
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao obter URL do documento', 'unknown_error')
    }
  },

  /**
   * Faz download de um documento
   */
  async downloadDocumento(storagePath: string, nomeOriginal: string): Promise<void> {
    try {
      let fileData: Blob
      if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
        const response = await fetch(storagePath)
        if (!response.ok) {
          throw new AppError(`Erro ao baixar documento (${response.status})`, 'storage_error')
        }
        fileData = await response.blob()
      } else {
        const { data, error } = await supabase.storage
          .from('documentos')
          .download(storagePath)

        if (error) throw new AppError(error.message, 'storage_error')
        fileData = data
      }

      // Criar link de download
      const url = URL.createObjectURL(fileData)
      const a = document.createElement('a')
      a.href = url
      a.download = nomeOriginal
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao fazer download do documento', 'unknown_error')
    }
  },
}

/**
 * Formata tamanho de arquivo em formato legível
 */
export function formatarTamanhoArquivo(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Obtém ícone baseado no tipo de arquivo
 */
export function obterIconeArquivo(tipoArquivo: string): string {
  if (tipoArquivo.includes('pdf')) return '📄'
  if (tipoArquivo.includes('image')) return '🖼️'
  if (tipoArquivo.includes('word') || tipoArquivo.includes('document')) return '📝'
  if (tipoArquivo.includes('excel') || tipoArquivo.includes('sheet')) return '📊'
  return '📎'
}
