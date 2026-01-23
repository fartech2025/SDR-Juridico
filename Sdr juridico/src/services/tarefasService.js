import { supabase } from '@/lib/supabaseClient'
import { AppError } from '@/utils/errors'
import { resolveOrgScope } from '@/services/orgScope'
import { logAuditChange } from "@/services/auditLogService";

const resolveCreatedAt = (row) => row.created_at || row.criado_em || new Date().toISOString()

const resolvePriorityValue = (priority) => {
  if (priority === undefined) return undefined
  if (priority === null) return null
  if (typeof priority === 'number') return priority
  if (priority === 'baixa') return 1
  if (priority === 'alta') return 3
  return 2
}

const mapDbTarefaToRow = (row) => {
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
    status: row.status || 'pendente',
    priority: row.priority ?? 2,
    due_at: row.due_at || null,
    completed_at: row.completed_at || null,
  }
}

const buildTarefaPayload = (updates) => {
  const payload = {}

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

const resolveCurrentUserId = async (fallback) => {
  if (fallback) return fallback
  const { data, error } = await supabase.auth.getSession()
  if (error || !data?.session?.user) {
    throw new AppError('Usuario nao autenticado', 'auth_error')
  }
  return data.session.user.id
}

export const tarefasService = {
  async getTarefas() {
    try {
      const { orgId } = await resolveOrgScope()
      if (!orgId) return []
      const query = supabase
        .from('tarefas')
        .select('*')
        .eq('org_id', orgId)
        .order('due_at', { ascending: true })

      const { data, error } = await query

      if (error) throw new AppError(error.message, 'database_error')
      return (data || []).map((row) => mapDbTarefaToRow(row))
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar tarefas', 'database_error')
    }
  },

  async getTarefasByEntidade(entidade, entidadeId) {
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
      return (data || []).map((row) => mapDbTarefaToRow(row))
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar tarefas', 'database_error')
    }
  },

  async createTarefa(tarefa) {
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
        action: "create",
        entity: "tarefas",
        entityId: data.id,
        details: { fields: Object.keys(payload) }
      });

      return mapDbTarefaToRow(data)
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao criar tarefa', 'database_error')
    }
  },

  async updateTarefa(id, updates) {
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
        action: "update",
        entity: "tarefas",
        entityId: data.id,
        details: { fields: Object.keys(payload) }
      });

      return mapDbTarefaToRow(data)
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao atualizar tarefa', 'database_error')
    }
  },

  async deleteTarefa(id) {
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
        action: "delete",
        entity: "tarefas",
        entityId: id,
        details: {}
      });
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao deletar tarefa', 'database_error')
    }
  },
}
