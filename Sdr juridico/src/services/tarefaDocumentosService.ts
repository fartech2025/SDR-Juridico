import { supabase } from '@/lib/supabaseClient'
import { AppError } from '@/utils/errors'
import { resolveOrgScope } from '@/services/orgScope'
import { logAuditChange } from '@/services/auditLogService'

export type TarefaDocumento = {
  id: string
  org_id: string
  tarefa_id: string
  documento_id: string | null
  label: string
  solicitado: boolean
  entregue: boolean
  created_at: string
  delivered_at: string | null
}

export const tarefaDocumentosService = {
  async listByTarefa(tarefaId: string): Promise<TarefaDocumento[]> {
    const { orgId } = await resolveOrgScope()
    if (!orgId) return []
    const { data, error } = await supabase
      .from('tarefa_documentos')
      .select('*')
      .eq('org_id', orgId)
      .eq('tarefa_id', tarefaId)
      .order('created_at', { ascending: true })

    if (error) throw new AppError(error.message, 'database_error')
    return (data || []) as TarefaDocumento[]
  },

  async createRequest(tarefaId: string, label: string): Promise<TarefaDocumento> {
    const { orgId } = await resolveOrgScope()
    if (!orgId) throw new AppError('Org não encontrada', 'validation_error')

    const { data: authData } = await supabase.auth.getUser()
    const userId = authData.user?.id ?? null

    const { data, error } = await supabase
      .from('tarefa_documentos')
      .insert({ org_id: orgId, tarefa_id: tarefaId, label, solicitado: true, entregue: false, requested_by: userId })
      .select('*')
      .single()

    if (error) throw new AppError(error.message, 'database_error')

    void logAuditChange({
      orgId,
      action: 'request_document',
      entity: 'tarefa_documentos',
      entityId: (data as any).id,
      details: { tarefaId, label },
    })

    return data as TarefaDocumento
  },

  async attachDocumento(requestId: string, documentoId: string): Promise<TarefaDocumento> {
    const { orgId } = await resolveOrgScope()
    if (!orgId) throw new AppError('Org não encontrada', 'validation_error')

    const now = new Date().toISOString()
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData.user?.id ?? null

    const { data, error } = await supabase
      .from('tarefa_documentos')
      .update({ documento_id: documentoId, entregue: true, delivered_at: now, uploaded_by: userId })
      .eq('id', requestId)
      .select('*')
      .single()

    if (error) throw new AppError(error.message, 'database_error')

    void logAuditChange({
      orgId,
      action: 'attach_document',
      entity: 'tarefa_documentos',
      entityId: requestId,
      details: { documentoId },
    })

    return data as TarefaDocumento
  },
}
