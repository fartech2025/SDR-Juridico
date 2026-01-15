import { supabase, type TimelineEventRow } from '@/lib/supabaseClient'
import { AppError } from '@/utils/errors'

export const notasService = {
  async getNotas(): Promise<TimelineEventRow[]> {
    try {
      const { data, error } = await supabase
        .from('timeline_events')
        .select('*')
        .order('data_evento', { ascending: false })
        .limit(200)

      if (error) throw new AppError(error.message, 'database_error')
      return data || []
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

      const { data, error } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('caso_id', entidadeId)
        .order('data_evento', { ascending: false })

      if (error) throw new AppError(error.message, 'database_error')
      return data || []
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao buscar notas',
        'database_error'
      )
    }
  },
}
