import { supabase, type DatajudMovimentacaoRow, type DatajudProcessoRow } from '@/lib/supabaseClient'

export interface CasoProcessoInfo {
  numero_processo: string | null
  tribunal: string | null
  classe_processual: string | null
  grau: string | null
  assunto_principal: string | null
  datajud_processo_id: string | null
  datajud_last_sync_at: string | null
}

export const datajudTimelineService = {
  /**
   * Busca processos vinculados ao caso.
   * Estrategia:
   *   1. Tenta via casos.datajud_processo_id (link direto)
   *   2. Fallback: busca por numero_processo na tabela datajud_processos
   * Retorna tambem os metadados do caso para gerar evento sintetico se necessario.
   */
  async getProcessosByCaso(casoId: string): Promise<{
    processos: DatajudProcessoRow[]
    casoInfo: CasoProcessoInfo | null
  }> {
    const { data: casoData } = await supabase
      .from('casos')
      .select('datajud_processo_id, numero_processo, tribunal, classe_processual, grau, assunto_principal, datajud_last_sync_at')
      .eq('id', casoId)
      .single()

    if (!casoData) return { processos: [], casoInfo: null }

    const casoInfo: CasoProcessoInfo = {
      numero_processo: casoData.numero_processo || null,
      tribunal: casoData.tribunal || null,
      classe_processual: casoData.classe_processual || null,
      grau: casoData.grau || null,
      assunto_principal: casoData.assunto_principal || null,
      datajud_processo_id: casoData.datajud_processo_id || null,
      datajud_last_sync_at: casoData.datajud_last_sync_at || null,
    }

    // 1. Tenta via datajud_processo_id (link direto)
    if (casoData.datajud_processo_id) {
      const { data, error } = await supabase
        .from('datajud_processos')
        .select('*')
        .eq('id', casoData.datajud_processo_id)

      if (!error && data && data.length > 0) {
        return { processos: data as DatajudProcessoRow[], casoInfo }
      }
    }

    // 2. Fallback: busca por numero_processo
    if (casoData.numero_processo) {
      const { data, error } = await supabase
        .from('datajud_processos')
        .select('*')
        .eq('numero_processo', casoData.numero_processo)

      if (!error && data && data.length > 0) {
        // Atualizar o link no caso para futuras consultas
        const processoId = data[0].id
        await supabase
          .from('casos')
          .update({ datajud_processo_id: processoId })
          .eq('id', casoId)

        return { processos: data as DatajudProcessoRow[], casoInfo }
      }
    }

    // 3. Nenhum processo encontrado no banco
    return { processos: [], casoInfo }
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
