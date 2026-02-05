import { supabase } from '@/lib/supabaseClient'
import type { DocumentoRow } from '@/lib/supabaseClient'
import { AppError } from '@/utils/errors'
import { resolveOrgScope } from '@/services/orgScope'
import { logAuditChange } from '@/services/auditLogService'

type DbDocumentoRow = {
  id: string
  created_at: string
  org_id?: string | null
  title: string
  description?: string | null
  visibility?: string | null
  bucket?: string | null
  storage_path: string
  mime_type?: string | null
  size_bytes?: number | null
  lead_id?: string | null
  cliente_id?: string | null
  caso_id?: string | null
  uploaded_by?: string | null
  tags?: string[] | null
  meta?: Record<string, any> | null
}

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

const mapDbDocumentoToDocumentoRow = (row: DbDocumentoRow): DocumentoRow => {
  const meta = row.meta || {}
  return {
    id: row.id,
    created_at: row.created_at,
    updated_at: row.created_at,
    org_id: row.org_id ?? null,
    titulo: row.title,
    descricao: row.description || null,
    caso_id: row.caso_id || null,
    cliente_id: meta.cliente_id || null,
    lead_id: meta.lead_id || null,
    cliente_nome: meta.cliente_nome || null,
    tipo: meta.tipo || row.bucket || 'docs',
    status: meta.status || 'pendente',
    url: row.storage_path,
    arquivo_nome: meta.arquivo_nome || row.title,
    arquivo_tamanho: row.size_bytes || null,
    mime_type: row.mime_type || null,
    solicitado_por: row.uploaded_by || null,
    tags: row.tags || [],
  }
}

const buildDocumentoPayload = (doc: Partial<DocumentoRow>, applyDefaults: boolean) => {
  const payload: Partial<DbDocumentoRow> = {}

  if (doc.titulo !== undefined) payload.title = doc.titulo
  if (doc.descricao !== undefined) payload.description = doc.descricao
  if (doc.caso_id !== undefined) payload.caso_id = doc.caso_id
  if (doc.mime_type !== undefined) payload.mime_type = doc.mime_type
  if (doc.arquivo_tamanho !== undefined) payload.size_bytes = doc.arquivo_tamanho
  if (doc.tags !== undefined) payload.tags = doc.tags
  if (doc.url !== undefined) payload.storage_path = doc.url ?? undefined

  const meta: Record<string, any> = {}
  if (doc.tipo !== undefined) meta.tipo = doc.tipo
  if (doc.status !== undefined) meta.status = doc.status
  if (doc.arquivo_nome !== undefined) meta.arquivo_nome = doc.arquivo_nome
  if (doc.cliente_nome !== undefined) meta.cliente_nome = doc.cliente_nome
  if (Object.keys(meta).length > 0) payload.meta = meta

  if (applyDefaults) {
    if (!payload.bucket) payload.bucket = 'docs'
  }

  return payload
}

const resolveOrgId = async (userId: string, casoId?: string) => {
  if (casoId) {
    const { data, error } = await supabase
      .from('casos')
      .select('org_id')
      .eq('id', casoId)
      .single()

    if (!error && data?.org_id) {
      return data.org_id as string
    }
  }

  const { data } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', userId)
    .eq('ativo', true)
    .limit(1)
    .maybeSingle()

  return data?.org_id || null
}

export const documentosService = {
  /**
   * Busca todos os documentos (excluindo soft deleted)
   */
  async getDocumentos(): Promise<DocumentoRow[]> {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) return []

      const query = supabase
        .from('documentos')
        .select('*, casos:caso_id(titulo), clientes:cliente_id(nome), leads:lead_id(nome)')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      const { data, error } = isFartechAdmin ? await query : await query.eq('org_id', orgId)

      if (error) throw new AppError(error.message, 'database_error')
      return (data || []).map((row: any) => ({
        ...mapDbDocumentoToDocumentoRow(row),
        caso: row.casos ? { titulo: row.casos.titulo } : null,
        cliente: row.clientes ? { nome: row.clientes.nome } : null,
        lead: row.leads ? { nome: row.leads.nome } : null,
      }))
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar documentos', 'database_error')
    }
  },

  /**
   * Busca um documento especifico
   */
  async getDocumento(id: string): Promise<DocumentoRow> {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) {
        throw new AppError('Organizacao nao encontrada para o usuario atual', 'auth_error')
      }

      const query = supabase
        .from('documentos')
        .select('*, casos:caso_id(titulo), clientes:cliente_id(nome), leads:lead_id(nome)')
        .eq('id', id)
        .is('deleted_at', null)
      const { data, error } = isFartechAdmin ? await query.single() : await query.eq('org_id', orgId).single()

      if (error) throw new AppError(error.message, 'database_error')
      if (!data) throw new AppError('Documento nao encontrado', 'not_found')

      return {
        ...mapDbDocumentoToDocumentoRow(data as DbDocumentoRow),
        caso: (data as any).casos ? { titulo: (data as any).casos.titulo } : null,
        cliente: (data as any).clientes ? { nome: (data as any).clientes.nome } : null,
        lead: (data as any).leads ? { nome: (data as any).leads.nome } : null,
      }
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar documento', 'database_error')
    }
  },

  /**
   * Busca documentos de um caso especifico
   */
  async getDocumentosByCaso(casoId: string): Promise<DocumentoRow[]> {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) return []

      const query = supabase
        .from('documentos')
        .select('*, casos:caso_id(titulo), clientes:cliente_id(nome)')
        .eq('caso_id', casoId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      const { data, error } = isFartechAdmin ? await query : await query.eq('org_id', orgId)

      if (error) throw new AppError(error.message, 'database_error')
      return (data || []).map((row: any) => ({
        ...mapDbDocumentoToDocumentoRow(row),
        caso: row.casos ? { titulo: row.casos.titulo } : null,
        cliente: row.clientes ? { nome: row.clientes.nome } : null,
      }))
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar documentos do caso', 'database_error')
    }
  },

  /**
   * Busca documentos de um cliente especifico
   */
  async getDocumentosByCliente(clienteId: string): Promise<DocumentoRow[]> {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) return []

      const query = supabase
        .from('documentos')
        .select('*, casos:caso_id(titulo), clientes:cliente_id(nome)')
        .eq('cliente_id', clienteId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      const { data, error } = isFartechAdmin ? await query : await query.eq('org_id', orgId)

      if (error) throw new AppError(error.message, 'database_error')
      return (data || []).map((row: any) => ({
        ...mapDbDocumentoToDocumentoRow(row),
        caso: row.casos ? { titulo: row.casos.titulo } : null,
        cliente: row.clientes ? { nome: row.clientes.nome } : null,
      }))
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar documentos do cliente', 'database_error')
    }
  },

  /**
   * Busca documentos de um lead especifico
   */
  async getDocumentosByLead(leadId: string): Promise<DocumentoRow[]> {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) return []

      const query = supabase
        .from('documentos')
        .select('*, leads:lead_id(nome)')
        .eq('lead_id', leadId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      const { data, error } = isFartechAdmin ? await query : await query.eq('org_id', orgId)

      if (error) throw new AppError(error.message, 'database_error')
      return (data || []).map((row: any) => ({
        ...mapDbDocumentoToDocumentoRow(row),
        lead: row.leads ? { nome: row.leads.nome } : null,
      }))
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar documentos do lead', 'database_error')
    }
  },

  /**
   * Busca documentos por status
   */
  async getDocumentosByStatus(status: string): Promise<DocumentoRow[]> {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) return []

      const query = supabase
        .from('documentos')
        .select('*, casos:caso_id(titulo), clientes:cliente_id(nome)')
        .filter('meta->>status', 'eq', status)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      const { data, error } = isFartechAdmin ? await query : await query.eq('org_id', orgId)

      if (error) throw new AppError(error.message, 'database_error')
      return (data || []).map((row: any) => ({
        ...mapDbDocumentoToDocumentoRow(row),
        caso: row.casos ? { titulo: row.casos.titulo } : null,
        cliente: row.clientes ? { nome: row.clientes.nome } : null,
      }))
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar documentos', 'database_error')
    }
  },

  /**
   * Busca documentos por tipo
   */
  async getDocumentosByTipo(tipo: string): Promise<DocumentoRow[]> {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) return []

      const query = supabase
        .from('documentos')
        .select('*, casos:caso_id(titulo), clientes:cliente_id(nome)')
        .filter('meta->>tipo', 'eq', tipo)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      const { data, error } = isFartechAdmin ? await query : await query.eq('org_id', orgId)

      if (error) throw new AppError(error.message, 'database_error')
      return (data || []).map((row: any) => ({
        ...mapDbDocumentoToDocumentoRow(row),
        caso: row.casos ? { titulo: row.casos.titulo } : null,
        cliente: row.clientes ? { nome: row.clientes.nome } : null,
      }))
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar documentos', 'database_error')
    }
  },

  /**
   * Busca documentos arquivados (soft deleted)
   */
  async getDocumentosArquivados(): Promise<DocumentoRow[]> {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) return []

      const query = supabase
        .from('documentos')
        .select('*, casos:caso_id(titulo), clientes:cliente_id(nome)')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })
      const { data, error } = isFartechAdmin ? await query : await query.eq('org_id', orgId)

      if (error) throw new AppError(error.message, 'database_error')
      return (data || []).map((row: any) => ({
        ...mapDbDocumentoToDocumentoRow(row),
        caso: row.casos ? { titulo: row.casos.titulo } : null,
        cliente: row.clientes ? { nome: row.clientes.nome } : null,
      }))
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar documentos arquivados', 'database_error')
    }
  },

  /**
   * Cria um novo documento
   */
  async createDocumento(
    documento: Omit<DocumentoRow, 'id' | 'created_at' | 'updated_at' | 'org_id'>
  ): Promise<DocumentoRow> {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) {
        throw new AppError('Organizacao nao encontrada para o usuario atual', 'auth_error')
      }

      const payload = buildDocumentoPayload(documento, true)
      if (!isFartechAdmin) {
        payload.org_id = orgId
      }
      // Adicionar cliente_id e lead_id se fornecidos
      if ((documento as any).cliente_id) payload.cliente_id = (documento as any).cliente_id
      if ((documento as any).lead_id) payload.lead_id = (documento as any).lead_id
      
      const { data, error } = await supabase
        .from('documentos')
        .insert([payload])
        .select('*')
        .single()

      if (error) throw new AppError(error.message, 'database_error')
      if (!data) throw new AppError('Erro ao criar documento', 'database_error')

      const auditOrgId = orgId || (data as DbDocumentoRow).org_id || null
      void logAuditChange({
        orgId: auditOrgId,
        action: 'create',
        entity: 'documentos',
        entityId: data.id,
        details: { fields: Object.keys(payload) },
      })

      return mapDbDocumentoToDocumentoRow(data as DbDocumentoRow)
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
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) {
        throw new AppError('Organizacao nao encontrada para o usuario atual', 'auth_error')
      }

      const payload = buildDocumentoPayload(updates, false)
      const query = supabase
        .from('documentos')
        .update(payload)
        .eq('id', id)
        .select('*')
      const { data, error } = isFartechAdmin ? await query.single() : await query.eq('org_id', orgId).single()

      if (error) throw new AppError(error.message, 'database_error')
      if (!data) throw new AppError('Documento nao encontrado', 'not_found')

      const auditOrgId = orgId || (data as DbDocumentoRow).org_id || null
      void logAuditChange({
        orgId: auditOrgId,
        action: 'update',
        entity: 'documentos',
        entityId: data.id,
        details: { fields: Object.keys(payload) },
      })

      return mapDbDocumentoToDocumentoRow(data as DbDocumentoRow)
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao atualizar documento', 'database_error')
    }
  },

  /**
   * Deleta um documento (hard delete)
   */
  async deleteDocumento(id: string): Promise<void> {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) {
        throw new AppError('Organizacao nao encontrada para o usuario atual', 'auth_error')
      }

      const query = supabase
        .from('documentos')
        .delete()
        .eq('id', id)
      const { error } = isFartechAdmin ? await query : await query.eq('org_id', orgId)

      if (error) throw new AppError(error.message, 'database_error')

      void logAuditChange({
        orgId,
        action: 'delete',
        entity: 'documentos',
        entityId: id,
        details: {},
      })
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao deletar documento', 'database_error')
    }
  },

  /**
   * Arquiva um documento (soft delete)
   */
  async arquivarDocumento(id: string): Promise<DocumentoRow> {
    try {
      const { orgId, isFartechAdmin, userId } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) {
        throw new AppError('Organizacao nao encontrada para o usuario atual', 'auth_error')
      }

      const query = supabase
        .from('documentos')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: userId || null,
        })
        .eq('id', id)
        .select('*')
      const { data, error } = isFartechAdmin ? await query.single() : await query.eq('org_id', orgId).single()

      if (error) throw new AppError(error.message, 'database_error')
      if (!data) throw new AppError('Documento nao encontrado', 'not_found')

      const auditOrgId = orgId || (data as DbDocumentoRow).org_id || null
      void logAuditChange({
        orgId: auditOrgId,
        action: 'archive',
        entity: 'documentos',
        entityId: id,
        details: { archived_by: userId },
      })

      return mapDbDocumentoToDocumentoRow(data as DbDocumentoRow)
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao arquivar documento', 'database_error')
    }
  },

  /**
   * Restaura um documento arquivado
   */
  async restaurarDocumento(id: string): Promise<DocumentoRow> {
    try {
      const { orgId, isFartechAdmin, userId } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) {
        throw new AppError('Organizacao nao encontrada para o usuario atual', 'auth_error')
      }

      const query = supabase
        .from('documentos')
        .update({
          deleted_at: null,
          deleted_by: null,
        })
        .eq('id', id)
        .select('*')
      const { data, error } = isFartechAdmin ? await query.single() : await query.eq('org_id', orgId).single()

      if (error) throw new AppError(error.message, 'database_error')
      if (!data) throw new AppError('Documento nao encontrado', 'not_found')

      const auditOrgId = orgId || (data as DbDocumentoRow).org_id || null
      void logAuditChange({
        orgId: auditOrgId,
        action: 'restore',
        entity: 'documentos',
        entityId: id,
        details: { restored_by: userId },
      })

      return mapDbDocumentoToDocumentoRow(data as DbDocumentoRow)
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao restaurar documento', 'database_error')
    }
  },

  /**
   * Marca documento como completo
   */
  async marcarCompleto(id: string): Promise<DocumentoRow> {
    return this.updateDocumento(id, { status: 'aprovado' })
  },

  /**
   * Marca documento como rejeitado
   */
  async marcarRejeitado(id: string): Promise<DocumentoRow> {
    return this.updateDocumento(id, { status: 'rejeitado' })
  },

  /**
   * Solicita documento novamente
   */
  async solicitarNovamente(id: string): Promise<DocumentoRow> {
    return this.updateDocumento(id, { status: 'solicitado' })
  },

  /**
   * Marca documento como pendente
   */
  async marcarPendente(id: string): Promise<DocumentoRow> {
    return this.updateDocumento(id, { status: 'pendente' })
  },

  /**
   * Marca documento como visualizado
   */
  async marcarVisualizado(id: string): Promise<DocumentoRow> {
    try {
      const { orgId, isFartechAdmin, userId } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) {
        throw new AppError('Organizacao nao encontrada para o usuario atual', 'auth_error')
      }

      // Primeiro, buscar o documento atual para obter o meta existente
      const docAtual = await this.getDocumento(id)
      const metaAtual = (docAtual as any).meta || {}
      
      // Atualizar meta com informações de visualização
      const novoMeta = {
        ...metaAtual,
        visualizado: true,
        visualizado_at: new Date().toISOString(),
        visualizado_por: userId,
      }

      const query = supabase
        .from('documentos')
        .update({ meta: novoMeta })
        .eq('id', id)
        .select('*')
      const { data, error } = isFartechAdmin ? await query.single() : await query.eq('org_id', orgId).single()

      if (error) throw new AppError(error.message, 'database_error')
      if (!data) throw new AppError('Documento nao encontrado', 'not_found')

      void logAuditChange({
        orgId,
        action: 'view',
        entity: 'documentos',
        entityId: id,
        details: { viewed_by: userId },
      })

      return mapDbDocumentoToDocumentoRow(data as any)
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao marcar documento como visualizado', 'database_error')
    }
  },

  /**
   * Busca documentos pendentes
   */
  async getDocumentosPendentes(): Promise<DocumentoRow[]> {
    return this.getDocumentosByStatus('pendente')
  },

  /**
   * Busca estatisticas de documentos
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
      throw error instanceof AppError ? error : new AppError('Erro ao buscar estatisticas', 'database_error')
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
    orgId?: string
  }): Promise<DocumentoRow> {
    try {
      const { arquivo, categoria = 'geral', casoId, tags, descricao, orgId } = params

      // Validar arquivo
      if (!arquivo) {
        throw new AppError('Arquivo e obrigatorio', 'validation_error')
      }

      // Validar tamanho (10MB)
      const maxSize = 10 * 1024 * 1024
      if (arquivo.size > maxSize) {
        throw new AppError('Arquivo muito grande. Tamanho maximo: 10MB', 'validation_error')
      }

      // Validar tipo de arquivo
      if (!ALLOWED_MIME_TYPES.includes(arquivo.type)) {
        throw new AppError('Tipo de arquivo nao permitido. Use PDF, imagens ou documentos Office', 'validation_error')
      }

      // Obter usuario autenticado
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (authError || !session?.user) {
        throw new AppError('Usuario nao autenticado. Faca login para fazer upload de documentos.', 'auth_error')
      }

      const user = session.user
      const resolvedOrgId = orgId || await resolveOrgId(user.id, casoId)
      if (!resolvedOrgId) {
        throw new AppError('Nao foi possivel identificar a organizacao do usuario.', 'validation_error')
      }
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(2, 9)
      const extensao = arquivo.name.split('.').pop()
      const nomeArquivo = `${timestamp}_${randomStr}.${extensao}`
      const storagePath = `${user.id}/${resolvedOrgId}/${nomeArquivo}`

      const { error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(storagePath, arquivo, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        throw new AppError(uploadError.message, 'storage_error')
      }

      const payload: Partial<DbDocumentoRow> = {
        title: arquivo.name,
        description: descricao || null,
        bucket: 'docs',
        storage_path: storagePath,
        mime_type: arquivo.type,
        size_bytes: arquivo.size,
        caso_id: casoId || null,
        uploaded_by: user.id,
        tags: tags || [],
        org_id: resolvedOrgId,
        meta: {
          status: 'pendente',
          tipo: categoria || 'geral',
          arquivo_nome: arquivo.name,
        },
      }

      const { data: documento, error: dbError } = await supabase
        .from('documentos')
        .insert(payload)
        .select('*')
        .single()

      if (dbError) {
        await supabase.storage.from('documentos').remove([storagePath])
        throw new AppError(dbError.message, 'database_error')
      }

      return mapDbDocumentoToDocumentoRow(documento as DbDocumentoRow)
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao fazer upload do documento', 'unknown_error')
    }
  },

  /**
   * Obtem URL publica temporaria para visualizar/baixar documento
   */
  async obterUrlDocumento(storagePath: string): Promise<string> {
    try {
      if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
        return storagePath
      }
      const { data, error } = await supabase.storage
        .from('documentos')
        .createSignedUrl(storagePath, 3600)

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
 * Formata tamanho de arquivo em formato legivel
 */
export function formatarTamanhoArquivo(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Obtem icone baseado no tipo de arquivo
 */
export function obterIconeArquivo(tipoArquivo: string): string {
  if (tipoArquivo.includes('pdf')) return '[PDF]'
  if (tipoArquivo.includes('image')) return '[IMG]'
  if (tipoArquivo.includes('word') || tipoArquivo.includes('document')) return '[DOC]'
  if (tipoArquivo.includes('excel') || tipoArquivo.includes('sheet')) return '[XLS]'
  return '[FILE]'
}
