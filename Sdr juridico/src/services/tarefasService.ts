import { supabase, type TarefaRow } from '@/lib/supabaseClient'
import { AppError } from '@/utils/errors'
import { resolveOrgScope } from '@/services/orgScope'

type DbTarefaRow = {
  id: string
  created_at?: string | null
  criado_em?: string | null
  updated_at?: string | null
  org_id?: string | null
  usuario_id: string
  lead_id?: string | null
  cliente_id?: string | null
  caso_id?: string | null
  titulo: string
  descricao?: string | null
  prioridade?: string | null
  status?: string | null
  data_vencimento?: string | null
  responsavel_ids?: string[] | null
  concluido_em?: string | null
}

type TarefaInsert = {
  org_id?: string | null
  usuario_id: string
  lead_id?: string | null
  cliente_id?: string | null
  caso_id?: string | null
  titulo: string
  descricao?: string | null
  prioridade?: string | null
  status?: string | null
  data_vencimento?: string | null
  responsavel_ids?: string[] | null
  concluido_em?: string | null
}

const resolveCreatedAt = (row: DbTarefaRow) =>
  row.created_at || row.criado_em || new Date().toISOString()

const mapDbTarefaToRow = (row: DbTarefaRow): TarefaRow => {
  const createdAt = resolveCreatedAt(row)
  return {
    id: row.id,
    created_at: createdAt,
    updated_at: row.updated_at || createdAt,
    org_id: row.org_id ?? null,
    usuario_id: row.usuario_id,
    lead_id: row.lead_id ?? null,
    cliente_id: row.cliente_id ?? null,
    caso_id: row.caso_id ?? null,
    titulo: row.titulo,
    descricao: row.descricao || null,
    prioridade: (row.prioridade as TarefaRow['prioridade']) || 'normal',
    status: (row.status as TarefaRow['status']) || 'pendente',
    data_vencimento: row.data_vencimento || null,
    responsavel_ids: row.responsavel_ids || [],
    concluido_em: row.concluido_em || null,
  }
}

const buildTarefaPayload = (
  updates: Partial<Omit<TarefaRow, 'id' | 'created_at' | 'updated_at'>>
): Partial<TarefaInsert> => {
  const payload: Partial<TarefaInsert> = {}

  if (updates.usuario_id !== undefined) payload.usuario_id = updates.usuario_id
  if (updates.lead_id !== undefined) payload.lead_id = updates.lead_id
  if (updates.cliente_id !== undefined) payload.cliente_id = updates.cliente_id
  if (updates.caso_id !== undefined) payload.caso_id = updates.caso_id
  if (updates.titulo !== undefined) payload.titulo = updates.titulo
  if (updates.descricao !== undefined) payload.descricao = updates.descricao
  if (updates.prioridade !== undefined) payload.prioridade = updates.prioridade
  if (updates.status !== undefined) payload.status = updates.status
  if (updates.data_vencimento !== undefined) payload.data_vencimento = updates.data_vencimento
  if (updates.responsavel_ids !== undefined) payload.responsavel_ids = updates.responsavel_ids
  if (updates.concluido_em !== undefined) payload.concluido_em = updates.concluido_em

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
  async getTarefas(): Promise<TarefaRow[]> {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      const query = supabase
        .from('tarefas')
        .select('*')
        .order('data_vencimento', { ascending: true })

      const { data, error } = isFartechAdmin || !orgId
        ? await query
        : await query.eq('org_id', orgId)

      if (error) throw new AppError(error.message, 'database_error')
      return (data || []).map((row: DbTarefaRow) => mapDbTarefaToRow(row))
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar tarefas', 'database_error')
    }
  },

  async getTarefasByEntidade(entidade: 'lead' | 'cliente' | 'caso', entidadeId: string): Promise<TarefaRow[]> {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      const coluna =
        entidade === 'lead' ? 'lead_id' : entidade === 'cliente' ? 'cliente_id' : 'caso_id'
      const query = supabase
        .from('tarefas')
        .select('*')
        .eq(coluna, entidadeId)
        .order('data_vencimento', { ascending: true })

      const { data, error } = isFartechAdmin || !orgId
        ? await query
        : await query.eq('org_id', orgId)

      if (error) throw new AppError(error.message, 'database_error')
      return (data || []).map((row: DbTarefaRow) => mapDbTarefaToRow(row))
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar tarefas', 'database_error')
    }
  },

  async createTarefa(
    tarefa: Omit<TarefaRow, 'id' | 'created_at' | 'updated_at'>
  ): Promise<TarefaRow> {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      const usuarioId = await resolveCurrentUserId(tarefa.usuario_id)

      const payload = buildTarefaPayload({
        ...tarefa,
        usuario_id: usuarioId,
      })

      if (tarefa.status === 'concluida' && !payload.concluido_em) {
        payload.concluido_em = new Date().toISOString()
      }

      if (!isFartechAdmin && orgId) {
        payload.org_id = orgId
      }

      const { data, error } = await supabase
        .from('tarefas')
        .insert([payload])
        .select('*')
        .single()

      if (error) throw new AppError(error.message, 'database_error')
      if (!data) throw new AppError('Erro ao criar tarefa', 'database_error')

      return mapDbTarefaToRow(data as DbTarefaRow)
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao criar tarefa', 'database_error')
    }
  },

  async updateTarefa(
    id: string,
    updates: Partial<Omit<TarefaRow, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<TarefaRow> {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      const payload = buildTarefaPayload(updates)

      if (updates.status === 'concluida' && !payload.concluido_em) {
        payload.concluido_em = new Date().toISOString()
      }
      if (updates.status && updates.status !== 'concluida' && updates.concluido_em === undefined) {
        payload.concluido_em = null
      }

      const query = supabase
        .from('tarefas')
        .update(payload)
        .eq('id', id)
        .select('*')

      const { data, error } = isFartechAdmin || !orgId
        ? await query.single()
        : await query.eq('org_id', orgId).single()

      if (error) throw new AppError(error.message, 'database_error')
      if (!data) throw new AppError('Tarefa nao encontrada', 'not_found')

      return mapDbTarefaToRow(data as DbTarefaRow)
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao atualizar tarefa', 'database_error')
    }
  },

  async deleteTarefa(id: string): Promise<void> {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      const query = supabase
        .from('tarefas')
        .delete()
        .eq('id', id)

      const { error } = isFartechAdmin || !orgId ? await query : await query.eq('org_id', orgId)

      if (error) throw new AppError(error.message, 'database_error')
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao deletar tarefa', 'database_error')
    }
  },
}
