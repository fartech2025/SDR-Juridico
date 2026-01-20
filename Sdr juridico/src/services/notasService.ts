import { supabase, type TimelineEventRow } from '@/lib/supabaseClient'
import { AppError } from '@/utils/errors'
import { resolveOrgScope } from '@/services/orgScope'

type DbNotaRow = {
  id: string
  created_at: string
  org_id?: string | null
  entidade: string
  entidade_id: string
  texto: string
  created_by?: string | null
  tags?: string[] | null
}

const mapNotaToTimeline = (row: DbNotaRow): TimelineEventRow => {
  const title = row.texto ? row.texto.split('\n')[0].trim() : ''
  return {
    id: row.id,
    caso_id: row.entidade_id,
    titulo: title || 'Nota',
    descricao: row.texto || null,
    categoria: 'juridico',
    canal: 'Sistema',
    autor: row.created_by || null,
    tags: row.tags || [],
    data_evento: row.created_at,
    created_at: row.created_at,
    org_id: row.org_id || null,
  }
}

export const notasService = {
  async getNotas(): Promise<TimelineEventRow[]> {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) return []

      const query = supabase
        .from('notas')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)
      const { data, error } = isFartechAdmin ? await query : await query.eq('org_id', orgId)

      if (error) throw new AppError(error.message, 'database_error')
      return (data || []).map((row: DbNotaRow) => mapNotaToTimeline(row))
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao buscar notas',
        'database_error'
      )
    }
  },

  async getNotasByEntidade(entidade: string, entidadeId: string): Promise<TimelineEventRow[]> {
    try {
      if (entidade !== 'caso') {
        return []
      }

      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) return []

      const query = supabase
        .from('notas')
        .select('*')
        .eq('entidade', entidade)
        .eq('entidade_id', entidadeId)
        .order('created_at', { ascending: false })
      const { data, error } = isFartechAdmin ? await query : await query.eq('org_id', orgId)

      if (error) throw new AppError(error.message, 'database_error')
      return (data || []).map((row: DbNotaRow) => mapNotaToTimeline(row))
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao buscar notas',
        'database_error'
      )
    }
  },
}
