import { supabase, type DatajudMovimentacaoRow, type DatajudProcessoRow } from '@/lib/supabaseClient'

export const datajudTimelineService = {
  async getProcessosByCaso(casoId: string): Promise<DatajudProcessoRow[]> {
    // O datajud_processos nao tem coluna caso_id.
    // O vinculo e feito via casos.datajud_processo_id -> datajud_processos.id
    const { data: casoData } = await supabase
      .from('casos')
      .select('datajud_processo_id')
      .eq('id', casoId)
      .single()

    if (!casoData?.datajud_processo_id) return []

    const { data, error } = await supabase
      .from('datajud_processos')
      .select('*')
      .eq('id', casoData.datajud_processo_id)

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
      .in('datajud_processo_id', processoIds)
      .order('data_hora', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return (data || []) as DatajudMovimentacaoRow[]
  },
}
