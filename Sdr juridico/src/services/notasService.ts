import { supabase, type NotaRow } from '@/lib/supabaseClient'
import { getActiveOrgId } from '@/lib/org'
import { AppError } from '@/utils/errors'

export const notasService = {
  async getNotas(): Promise<NotaRow[]> {
    try {
      const orgId = await getActiveOrgId()
      let query = supabase.from('notas').select('*')
      if (orgId) query = query.eq('org_id', orgId)
      const { data, error } = await query.order('created_at', { ascending: false }).limit(200)

      if (error) throw new AppError(error.message, 'database_error')
      return data || []
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao buscar notas',
        'database_error'
      )
    }
  },

  async getNotasByEntidade(entidade: string, entidadeId: string): Promise<NotaRow[]> {
    try {
      const orgId = await getActiveOrgId()
      let query = supabase
        .from('notas')
        .select('*')
        .eq('entidade', entidade)
        .eq('entidade_id', entidadeId)
      if (orgId) query = query.eq('org_id', orgId)
      const { data, error } = await query.order('created_at', { ascending: false })

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
