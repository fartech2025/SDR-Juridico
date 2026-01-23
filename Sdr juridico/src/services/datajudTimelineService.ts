import { supabase, type DatajudMovimentacaoRow, type DatajudProcessoRow } from '@/lib/supabaseClient'

export const datajudTimelineService = {
  async getProcessosByCaso(casoId: string): Promise<DatajudProcessoRow[]> {
    const { data, error } = await supabase
      .from('datajud_processos')
      .select('*')
      .eq('caso_id', casoId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return (data || []) as DatajudProcessoRow[]
  },

  async getMovimentacoesByProcessos(
    processoIds: string[]
  ): Promise<DatajudMovimentacaoRow[]> {
    if (!processoIds.length) return []

    const { data, error } = await supabase
      .from('datajud_movimentacoes')
      .select('*')
      .in('processo_id', processoIds)
      .order('data_movimentacao', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return (data || []) as DatajudMovimentacaoRow[]
  },
}
