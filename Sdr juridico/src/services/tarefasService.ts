// src/services/tarefasService.ts
// Correção: Validação de input e consistência de tipos

import { supabase, type TarefaRow } from '@/lib/supabaseClient'
import { AppError } from '@/utils/errors'
import { resolveOrgScope, isCurrentUserAdminish } from '@/services/orgScope'
import { logAuditChange } from '@/services/auditLogService'

// ============================================================
// TIPOS
// ============================================================

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
  submitted_at?: string | null
  confirmed_at?: string | null
  confirmed_by?: string | null
  rejected_reason?: string | null
}

type TarefaInsert = Partial<DbTarefaRow> & {
  org_id: string
  assigned_user_id: string
  titulo: string
}

type TaskPriorityInput = 'baixa' | 'normal' | 'alta' | number

// Input para criar tarefa
export interface CreateTarefaInput {
  titulo: string
  descricao?: string | null
  priority?: TaskPriorityInput
  assigned_user_id?: string
  entidade?: 'lead' | 'cliente' | 'caso' | null
  entidade_id?: string | null
  due_at?: string | null
}

// Input para atualizar tarefa
export interface UpdateTarefaInput {
  titulo?: string
  descricao?: string | null
  priority?: TaskPriorityInput
  status?: string
  assigned_user_id?: string
  due_at?: string | null
}

// ============================================================
// VALIDAÇÃO
// ============================================================

const VALID_ENTIDADES = ['lead', 'cliente', 'caso'] as const

function validateTitulo(titulo: unknown): string {
  if (typeof titulo !== 'string' || !titulo.trim()) {
    throw new AppError('Titulo e obrigatorio', 'validation_error')
  }
  const trimmed = titulo.trim()
  if (trimmed.length > 500) {
    throw new AppError('Titulo deve ter no maximo 500 caracteres', 'validation_error')
  }
  return trimmed
}

function validateEntidade(
  entidade: unknown,
  entidadeId: unknown
): { entidade: 'lead' | 'cliente' | 'caso' | null; entidade_id: string | null } {
  if (!entidade && !entidadeId) {
    return { entidade: null, entidade_id: null }
  }

  if (!entidade || !entidadeId) {
    throw new AppError(
      'Entidade e entidade_id devem ser fornecidos juntos',
      'validation_error'
    )
  }

  if (!VALID_ENTIDADES.includes(entidade as typeof VALID_ENTIDADES[number])) {
    throw new AppError(
      `Tipo de entidade invalido. Use: ${VALID_ENTIDADES.join(', ')}`,
      'validation_error'
    )
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (typeof entidadeId !== 'string' || !uuidRegex.test(entidadeId)) {
    throw new AppError('entidade_id deve ser um UUID valido', 'validation_error')
  }

  return {
    entidade: entidade as 'lead' | 'cliente' | 'caso',
    entidade_id: entidadeId,
  }
}

function validatePriority(priority: TaskPriorityInput | undefined | null): number {
  if (priority === undefined || priority === null) return 2 // default: normal

  if (typeof priority === 'number') {
    return Math.min(Math.max(Math.round(priority), 1), 3) // Clamp 1-3
  }

  const priorityMap: Record<string, number> = {
    baixa: 1,
    normal: 2,
    alta: 3,
  }

  return priorityMap[priority] ?? 2
}

// ============================================================
// MAPEAMENTO
// ============================================================

const resolveCreatedAt = (row: DbTarefaRow): string =>
  row.created_at || row.criado_em || new Date().toISOString()

const mapDbTarefaToRow = (row: DbTarefaRow): TarefaRow => {
  return {
    id: row.id,
    created_at: resolveCreatedAt(row),
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

// ============================================================
// HELPERS
// ============================================================

async function resolveCurrentUserId(fallback?: string | null): Promise<string> {
  if (fallback) return fallback

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error || !session?.user) {
    throw new AppError('Usuario nao autenticado', 'auth_error')
  }

  return session.user.id
}

// ============================================================
// SERVICE
// ============================================================

export const tarefasService = {
  /**
   * Busca tarefas - filtrada por role:
   * - Gestor/Admin: vê todas as tarefas da org
   * - Advogado: vê apenas suas tarefas atribuídas
   */
  async getTarefas(options?: {
    userId?: string
    isGestor?: boolean
  }): Promise<TarefaRow[]> {
    const { orgId, isFartechAdmin } = await resolveOrgScope()
    if (!isFartechAdmin && !orgId) return []

    let query = supabase
      .from('tarefas')
      .select('*')
      .order('due_at', { ascending: true, nullsFirst: false })

    if (!isFartechAdmin) {
      query = query.eq('org_id', orgId)
    }

    if (options?.userId && !options?.isGestor && !isFartechAdmin) {
      query = query.eq('assigned_user_id', options.userId)
    }

    const { data, error } = await query

    if (error) {
      throw new AppError(`Erro ao buscar tarefas: ${error.message}`, 'database_error')
    }

    return (data || []).map((row: DbTarefaRow) => mapDbTarefaToRow(row))
  },

  /**
   * Busca tarefas por entidade (lead, cliente ou caso).
   */
  async getTarefasByEntidade(
    entidade: 'lead' | 'cliente' | 'caso',
    entidadeId: string
  ): Promise<TarefaRow[]> {
    const { orgId } = await resolveOrgScope()
    if (!orgId) return []

    if (!VALID_ENTIDADES.includes(entidade)) {
      throw new AppError('Tipo de entidade invalido', 'validation_error')
    }

    const { data, error } = await supabase
      .from('tarefas')
      .select('*')
      .eq('entidade', entidade)
      .eq('entidade_id', entidadeId)
      .eq('org_id', orgId)
      .order('due_at', { ascending: true, nullsFirst: false })

    if (error) {
      throw new AppError(`Erro ao buscar tarefas: ${error.message}`, 'database_error')
    }

    return (data || []).map((row: DbTarefaRow) => mapDbTarefaToRow(row))
  },

  /**
   * Cria uma nova tarefa com validação completa.
   */
  async createTarefa(input: CreateTarefaInput): Promise<TarefaRow> {
    const { orgId, userId } = await resolveOrgScope()
    if (!orgId) {
      throw new AppError('Organizacao nao encontrada', 'auth_error')
    }

    const titulo = validateTitulo(input.titulo)
    const { entidade, entidade_id } = validateEntidade(input.entidade, input.entidade_id)
    const priority = validatePriority(input.priority)
    const assignedUserId = await resolveCurrentUserId(input.assigned_user_id || userId)

    const payload: TarefaInsert = {
      org_id: orgId,
      titulo,
      descricao: input.descricao?.trim() || null,
      priority,
      status: 'pendente',
      assigned_user_id: assignedUserId,
      entidade,
      entidade_id,
      due_at: input.due_at || null,
    }

    const { data, error } = await supabase
      .from('tarefas')
      .insert([payload])
      .select('*')
      .single()

    if (error) {
      throw new AppError(`Erro ao criar tarefa: ${error.message}`, 'database_error')
    }

    if (!data) {
      throw new AppError('Erro ao criar tarefa: dados nao retornados', 'database_error')
    }

    void logAuditChange({
      orgId,
      action: 'create',
      entity: 'tarefas',
      entityId: data.id,
      details: { titulo, entidade, entidade_id },
    })

    return mapDbTarefaToRow(data as DbTarefaRow)
  },

  /**
   * Atualiza uma tarefa existente.
   */
  async updateTarefa(id: string, input: UpdateTarefaInput): Promise<TarefaRow> {
    const { orgId } = await resolveOrgScope()
    if (!orgId) {
      throw new AppError('Organizacao nao encontrada', 'auth_error')
    }

    const payload: Partial<DbTarefaRow> = {}

    if (input.titulo !== undefined) {
      payload.titulo = validateTitulo(input.titulo)
    }

    if (input.descricao !== undefined) {
      payload.descricao = input.descricao?.trim() || null
    }

    if (input.priority !== undefined) {
      payload.priority = validatePriority(input.priority)
    }

    if (input.status !== undefined) {
      payload.status = input.status

      if (input.status === 'concluida') {
        payload.completed_at = new Date().toISOString()
      } else if (payload.completed_at === undefined) {
        payload.completed_at = null
      }
    }

    if (input.assigned_user_id !== undefined) {
      payload.assigned_user_id = input.assigned_user_id
    }

    if (input.due_at !== undefined) {
      payload.due_at = input.due_at
    }

    const { data, error } = await supabase
      .from('tarefas')
      .update(payload)
      .eq('id', id)
      .eq('org_id', orgId)
      .select('*')
      .single()

    if (error) {
      throw new AppError(`Erro ao atualizar tarefa: ${error.message}`, 'database_error')
    }

    if (!data) {
      throw new AppError('Tarefa nao encontrada', 'not_found')
    }

    void logAuditChange({
      orgId,
      action: 'update',
      entity: 'tarefas',
      entityId: id,
      details: { fields: Object.keys(payload) },
    })

    return mapDbTarefaToRow(data as DbTarefaRow)
  },

  /**
   * Deleta uma tarefa.
   */
  async deleteTarefa(id: string): Promise<void> {
    const { orgId } = await resolveOrgScope()
    if (!orgId) {
      throw new AppError('Organizacao nao encontrada', 'auth_error')
    }

    const { error } = await supabase
      .from('tarefas')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId)

    if (error) {
      throw new AppError(`Erro ao deletar tarefa: ${error.message}`, 'database_error')
    }

    void logAuditChange({
      orgId,
      action: 'delete',
      entity: 'tarefas',
      entityId: id,
      details: {},
    })
  },

  /**
   * Submete tarefa para validação (advogado -> gestor).
   */
  async submitForValidation(id: string): Promise<TarefaRow> {
    const { orgId } = await resolveOrgScope()
    if (!orgId) {
      throw new AppError('Organizacao nao encontrada', 'validation_error')
    }

    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('tarefas')
      .update({
        status: 'aguardando_validacao',
        submitted_at: now,
      })
      .eq('id', id)
      .eq('org_id', orgId)
      .select('*')
      .single()

    if (error) {
      throw new AppError(`Erro ao submeter tarefa: ${error.message}`, 'database_error')
    }

    void logAuditChange({
      orgId,
      action: 'submit_for_validation',
      entity: 'tarefas',
      entityId: id,
      details: { status: 'aguardando_validacao' },
    })

    return mapDbTarefaToRow(data as DbTarefaRow)
  },

  /**
   * Aprova uma tarefa (gestor).
   * Requer permissão de admin/gestor.
   */
  async approveTask(id: string): Promise<TarefaRow> {
    const { orgId, userId } = await resolveOrgScope()
    if (!orgId) {
      throw new AppError('Organizacao nao encontrada', 'validation_error')
    }

    // Verifica se é gestor/admin
    const isAdminish = await isCurrentUserAdminish()
    if (!isAdminish) {
      throw new AppError(
        'Apenas gestores podem aprovar tarefas',
        'permission_denied'
      )
    }

    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('tarefas')
      .update({
        status: 'concluida',
        confirmed_at: now,
        confirmed_by: userId,
        completed_at: now,
      })
      .eq('id', id)
      .eq('org_id', orgId)
      .select('*')
      .single()

    if (error) {
      throw new AppError(`Erro ao aprovar tarefa: ${error.message}`, 'database_error')
    }

    void logAuditChange({
      orgId,
      action: 'approve',
      entity: 'tarefas',
      entityId: id,
      details: { status: 'concluida', confirmed_by: userId },
    })

    return mapDbTarefaToRow(data as DbTarefaRow)
  },

  /**
   * Rejeita/devolve uma tarefa (gestor).
   * Requer permissão de admin/gestor.
   */
  async rejectTask(id: string, reason: string): Promise<TarefaRow> {
    const { orgId } = await resolveOrgScope()
    if (!orgId) {
      throw new AppError('Organizacao nao encontrada', 'validation_error')
    }

    // Verifica se é gestor/admin
    const isAdminish = await isCurrentUserAdminish()
    if (!isAdminish) {
      throw new AppError(
        'Apenas gestores podem devolver tarefas',
        'permission_denied'
      )
    }

    // Valida motivo
    if (!reason?.trim()) {
      throw new AppError(
        'Motivo da devolucao e obrigatorio',
        'validation_error'
      )
    }

    const { data, error } = await supabase
      .from('tarefas')
      .update({
        status: 'devolvida',
        rejected_reason: reason.trim(),
      })
      .eq('id', id)
      .eq('org_id', orgId)
      .select('*')
      .single()

    if (error) {
      throw new AppError(`Erro ao devolver tarefa: ${error.message}`, 'database_error')
    }

    void logAuditChange({
      orgId,
      action: 'reject',
      entity: 'tarefas',
      entityId: id,
      details: { status: 'devolvida', reason: reason.trim() },
    })

    return mapDbTarefaToRow(data as DbTarefaRow)
  },

  /**
   * Obtém estatísticas de tarefas.
   */
  async getEstatisticas(): Promise<{
    total: number
    pendentes: number
    em_progresso: number
    aguardando: number
    concluidas: number
    devolvidas: number
  }> {
    const tarefas = await this.getTarefas()

    return {
      total: tarefas.length,
      pendentes: tarefas.filter((t) => t.status === 'pendente').length,
      em_progresso: tarefas.filter((t) =>
        ['em_progresso', 'em_andamento'].includes(t.status || '')
      ).length,
      aguardando: tarefas.filter((t) =>
        ['aguardando_validacao', 'submetida'].includes(t.status || '')
      ).length,
      concluidas: tarefas.filter((t) => t.status === 'concluida').length,
      devolvidas: tarefas.filter((t) => t.status === 'devolvida').length,
    }
  },
}
