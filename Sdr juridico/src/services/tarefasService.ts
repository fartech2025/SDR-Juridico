import { supabase, type TarefaRow } from '@/lib/supabaseClient'
import { AppError } from '@/utils/errors'
import { resolveOrgScope } from '@/services/orgScope'
import { logAuditChange } from '@/services/auditLogService'

type DbTarefaRow = {
  id: string
  created_at?: string | null
  criado_em?: string | null
  org_id?: string | null
  assigned_user_id: string
  entidade?: 'lead' | 'cliente' | 'caso' | null
  entidade_id?: string | null
  titulo: string
  descricao?: string | null
  status?: string | null
  priority?: number | null
  due_at?: string | null
  completed_at?: string | null
}

type TarefaInsert = {
  org_id?: string | null
  assigned_user_id: string
  entidade?: 'lead' | 'cliente' | 'caso' | null
  entidade_id?: string | null
  titulo: string
  descricao?: string | null
  status?: string | null
  priority?: number | null
  due_at?: string | null
  completed_at?: string | null
}

type TaskPriorityInput = 'baixa' | 'normal' | 'alta'

type TarefaInput = {
  assigned_user_id?: string
  entidade?: 'lead' | 'cliente' | 'caso' | null
  entidade_id?: string | null
  titulo?: string
  descricao?: string | null
  priority?: TaskPriorityInput | number | null
  status?: string | null
  due_at?: string | null
  completed_at?: string | null
}

const resolveCreatedAt = (row: DbTarefaRow) =>
  row.created_at || row.criado_em || new Date().toISOString()

const resolvePriorityValue = (priority: TarefaInput['priority']) => {
  if (priority === undefined) return undefined
  if (priority === null) return null
  if (typeof priority === 'number') return priority
  if (priority === 'baixa') return 1
  if (priority === 'alta') return 3
  return 2
}

const mapDbTarefaToRow = (row: DbTarefaRow): TarefaRow => {
  const createdAt = resolveCreatedAt(row)
  return {
    id: row.id,
    created_at: createdAt,
    org_id: row.org_id ?? null,
    assigned_user_id: row.assigned_user_id,
    entidade: row.entidade ?? null,
    entidade_id: row.entidade_id ?? null,
    titulo: row.titulo,
    descricao: row.descricao || null,
    status: (row.status as TarefaRow['status']) || 'pendente',
    priority: row.priority ?? 2,
    due_at: row.due_at || null,
    completed_at: row.completed_at || null,
  }
}

const buildTarefaPayload = (updates: Partial<TarefaInput>): Partial<TarefaInsert> => {
  const payload: Partial<TarefaInsert> = {}

  if (updates.assigned_user_id !== undefined) payload.assigned_user_id = updates.assigned_user_id
  if (updates.entidade !== undefined) payload.entidade = updates.entidade
  if (updates.entidade_id !== undefined) payload.entidade_id = updates.entidade_id
  if (updates.titulo !== undefined) payload.titulo = updates.titulo
  if (updates.descricao !== undefined) payload.descricao = updates.descricao
  if (updates.status !== undefined) payload.status = updates.status
  if (updates.priority !== undefined) payload.priority = resolvePriorityValue(updates.priority)
  if (updates.due_at !== undefined) payload.due_at = updates.due_at
  if (updates.completed_at !== undefined) payload.completed_at = updates.completed_at

  return payload
}

const resolveCurrentUserId = async (fallback?: string | null) => {
  if (fallback) return fallback
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error || !session?.user) {
    throw new AppError('Usuario nao autenticado', 'auth_error')
  }
  return session.user.id
}

export const tarefasService = {
  /**
   * Busca tarefas - filtrada por role:
   * - Gestor/Admin: vê todas as tarefas da org
   * - Advogado: vê apenas suas tarefas atribuídas
   */
  async getTarefas(options?: { userId?: string; isGestor?: boolean }): Promise<TarefaRow[]> {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) return []

      let query = supabase
        .from('tarefas')
        .select('*')
        .order('due_at', { ascending: true })

      // Aplica filtro de org
      if (!isFartechAdmin) {
        query = query.eq('org_id', orgId)
      }

      // Advogado só vê suas próprias tarefas
      if (options?.userId && !options?.isGestor && !isFartechAdmin) {
        query = query.eq('assigned_user_id', options.userId)
      }

      const { data, error } = await query

      if (error) throw new AppError(error.message, 'database_error')
      return (data || []).map((row: DbTarefaRow) => mapDbTarefaToRow(row))
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar tarefas', 'database_error')
    }
  },

  async getTarefasByEntidade(entidade: 'lead' | 'cliente' | 'caso', entidadeId: string): Promise<TarefaRow[]> {
    try {
      const { orgId } = await resolveOrgScope()
      if (!orgId) return []
      const query = supabase
        .from('tarefas')
        .select('*')
        .eq('entidade', entidade)
        .eq('entidade_id', entidadeId)
        .eq('org_id', orgId)
        .order('due_at', { ascending: true })

      const { data, error } = await query

      if (error) throw new AppError(error.message, 'database_error')
      return (data || []).map((row: DbTarefaRow) => mapDbTarefaToRow(row))
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar tarefas', 'database_error')
    }
  },

  async createTarefa(
    tarefa: TarefaInput & { assigned_user_id: string; titulo: string }
  ): Promise<TarefaRow> {
    try {
      const { orgId } = await resolveOrgScope()
      if (!orgId) {
        throw new AppError('Organizacao nao encontrada para o usuario atual', 'auth_error')
      }
      const assignedUserId = await resolveCurrentUserId(tarefa.assigned_user_id)

      const payload = buildTarefaPayload({
        ...tarefa,
        assigned_user_id: assignedUserId,
      })

      if (tarefa.status === 'concluida' && !payload.completed_at) {
        payload.completed_at = new Date().toISOString()
      }

      payload.org_id = orgId

      const { data, error } = await supabase
        .from('tarefas')
        .insert([payload])
        .select('*')
        .single()

      if (error) throw new AppError(error.message, 'database_error')
      if (!data) throw new AppError('Erro ao criar tarefa', 'database_error')

      void logAuditChange({
        orgId,
        action: 'create',
        entity: 'tarefas',
        entityId: data.id,
        details: { fields: Object.keys(payload) },
      })

      return mapDbTarefaToRow(data as DbTarefaRow)
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao criar tarefa', 'database_error')
    }
  },

  async updateTarefa(
    id: string,
    updates: Partial<TarefaInput>
  ): Promise<TarefaRow> {
    try {
      const { orgId } = await resolveOrgScope()
      if (!orgId) {
        throw new AppError('Organizacao nao encontrada para o usuario atual', 'auth_error')
      }
      const payload = buildTarefaPayload(updates)

      if (updates.status === 'concluida' && !payload.completed_at) {
        payload.completed_at = new Date().toISOString()
      }
      if (updates.status && updates.status !== 'concluida' && updates.completed_at === undefined) {
        payload.completed_at = null
      }

      const query = supabase
        .from('tarefas')
        .update(payload)
        .eq('id', id)
        .eq('org_id', orgId)
        .select('*')

      const { data, error } = await query.single()

      if (error) throw new AppError(error.message, 'database_error')
      if (!data) throw new AppError('Tarefa nao encontrada', 'not_found')

      void logAuditChange({
        orgId,
        action: 'update',
        entity: 'tarefas',
        entityId: data.id,
        details: { fields: Object.keys(payload) },
      })

      return mapDbTarefaToRow(data as DbTarefaRow)
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao atualizar tarefa', 'database_error')
    }
  },

  async deleteTarefa(id: string): Promise<void> {
    try {
      const { orgId } = await resolveOrgScope()
      if (!orgId) {
        throw new AppError('Organizacao nao encontrada para o usuario atual', 'auth_error')
      }
      const query = supabase
        .from('tarefas')
        .delete()
        .eq('id', id)
        .eq('org_id', orgId)

      const { error } = await query

      if (error) throw new AppError(error.message, 'database_error')

      void logAuditChange({
        orgId,
        action: 'delete',
        entity: 'tarefas',
        entityId: id,
        details: {},
      })
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao deletar tarefa', 'database_error')
    }
  },
async submitForValidation(id: string): Promise<TarefaRow> {
  try {
    const { orgId } = await resolveOrgScope()
    if (!orgId) throw new AppError('Org não encontrada', 'validation_error')

    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('tarefas')
      .update({ status: 'aguardando_validacao', submitted_at: now })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw new AppError(error.message, 'database_error')

    void logAuditChange({
      orgId,
      action: 'submit_for_validation',
      entity: 'tarefas',
      entityId: id,
      details: { status: 'aguardando_validacao' },
    })

    return mapDbTarefaToRow(data as DbTarefaRow)
  } catch (error) {
    throw error instanceof AppError ? error : new AppError('Erro ao enviar tarefa para confirmação', 'database_error')
  }
},

async approveTask(id: string): Promise<TarefaRow> {
  try {
    const { orgId } = await resolveOrgScope()
    if (!orgId) throw new AppError('Org não encontrada', 'validation_error')

    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('tarefas')
      .update({ status: 'concluida', confirmed_at: now, confirmed_by: (await supabase.auth.getUser()).data.user?.id ?? null, completed_at: now })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw new AppError(error.message, 'database_error')

    void logAuditChange({
      orgId,
      action: 'approve',
      entity: 'tarefas',
      entityId: id,
      details: { status: 'concluida' },
    })

    return mapDbTarefaToRow(data as DbTarefaRow)
  } catch (error) {
    throw error instanceof AppError ? error : new AppError('Erro ao aprovar tarefa', 'database_error')
  }
},

async rejectTask(id: string, reason: string): Promise<TarefaRow> {
  try {
    const { orgId } = await resolveOrgScope()
    if (!orgId) throw new AppError('Org não encontrada', 'validation_error')

    const { data, error } = await supabase
      .from('tarefas')
      .update({ status: 'devolvida', rejected_reason: reason })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw new AppError(error.message, 'database_error')

    void logAuditChange({
      orgId,
      action: 'reject',
      entity: 'tarefas',
      entityId: id,
      details: { status: 'devolvida', reason },
    })

    return mapDbTarefaToRow(data as DbTarefaRow)
  } catch (error) {
    throw error instanceof AppError ? error : new AppError('Erro ao devolver tarefa', 'database_error')
  }
},
}
