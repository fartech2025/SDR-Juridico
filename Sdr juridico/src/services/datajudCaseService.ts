// src/services/datajudCaseService.ts
import { supabase } from "@/lib/supabaseClient"
import type {
  DataJudProcesso,
  DataJudMovimento,
  DataJudSearchParams,
  DataJudSearchResponse,
} from "@/types/domain"

class DataJudCaseService {
  /**
   * Busca processos no DataJud
   */
  async searchProcessos(params: DataJudSearchParams): Promise<{
    processos: DataJudProcesso[]
    total: number
    latency_ms: number
  }> {
    try {
      const requestStart = Date.now()
      const { data, error } = await supabase.functions.invoke<{ data?: DataJudSearchResponse; success?: boolean; latency_ms?: number; error?: string }>('datajud-enhanced', {
        body: {
          tribunal: params.tribunal,
          searchType: params.searchType,
          query: params.query,
          clienteId: params.clienteId,
          pagina: params.pagina || 1,
        },
      })

      if (error) {
        console.error("Error searching DataJud:", error)
        throw new Error(
          error.message || `Edge function error: ${JSON.stringify(error, null, 2)}`
        )
      }

      if ((data as any)?.error) {
        console.error("datajud-enhanced returned error payload:", data)
        throw new Error(String((data as any).error))
      }

      const latency_ms = Date.now() - requestStart
      const payload: DataJudSearchResponse | undefined = (data as any)?.data ?? (data as any)

      if (!payload?.hits) {
        throw new Error("Malformed response from datajud-enhanced")
      }

      const hits = payload.hits?.hits ?? []
      const processos = hits.map((hit) => {
        const source = hit._source as Record<string, unknown>
        return {
          numero_processo: source.numeroProcesso as string,
          tribunal: params.tribunal,
          grau: source.grau as string | undefined,
          classe_processual: source.classe as string | undefined,
          assunto: source.assunto as string | undefined,
          dataAjuizamento: source.dataAjuizamento as string | undefined,
          dataAtualizacao: source.dataAtualizacao as string | undefined,
          sigiloso: (source.nivelSigilo as string) === "Sigiloso",
          raw_response: source,
        } as Partial<DataJudProcesso>
      })

      return {
        processos: processos as DataJudProcesso[],
        total: payload.hits?.total?.value ?? 0,
        latency_ms,
      }
    } catch (error) {
      console.error("Error searching DataJud:", error)
      throw error
    }
  }

  /**
   * Busca processos para um cliente específico pelo nome/CPF
   */
  async searchProcessosForCliente(clienteId: string, clienteName: string): Promise<{
    processos: DataJudProcesso[]
    total: number
  }> {
    try {
      const tribunals = ["stj", "tst", "trf", "trt", "tre"]
      const allProcessos: DataJudProcesso[] = []
      let totalCount = 0

      for (const tribunal of tribunals) {
        try {
          const result = await this.searchProcessos({
            tribunal,
            searchType: "parte",
            query: clienteName,
            clienteId,
          })

          allProcessos.push(...result.processos)
          totalCount += result.total
        } catch (error) {
          console.warn(`Error searching tribunal ${tribunal}:`, error)
        }
      }

      return {
        processos: allProcessos,
        total: totalCount,
      }
    } catch (error) {
      console.error("Error searching processos for cliente:", error)
      throw error
    }
  }

  /**
   * Vincula um processo a um caso
   */
  async linkProcessoToCaso(
    casoId: string,
    processo: DataJudProcesso
  ): Promise<{
    sucesso: boolean
    caso: Record<string, unknown>
  }> {
    try {
      const { data, error } = await supabase
        .from('casos')
        .update({
          numero_processo: processo.numero_processo,
          tribunal: processo.tribunal,
          grau: processo.grau,
          classe_processual: processo.classe_processual,
          assunto_principal: processo.assunto,
          datajud_sync_status: 'sincronizado',
          datajud_last_sync_at: new Date().toISOString(),
        })
        .eq('id', casoId)
        .select()
        .single()

      if (error) throw error

      return {
        sucesso: true,
        caso: data as Record<string, unknown>,
      }
    } catch (error) {
      console.error("Error linking processo to caso:", error)
      throw error
    }
  }

  /**
   * Desvincula um processo de um caso
   */
  async unlinkProcessoFromCaso(casoId: string): Promise<{
    sucesso: boolean
  }> {
    try {
      const { error } = await supabase
        .from('casos')
        .update({
          numero_processo: null,
          tribunal: null,
          grau: null,
          classe_processual: null,
          assunto_principal: null,
          datajud_processo_id: null,
          datajud_sync_status: 'nunca_sincronizado',
        })
        .eq('id', casoId)

      if (error) throw error

      return { sucesso: true }
    } catch (error) {
      console.error("Error unlinking processo from caso:", error)
      throw error
    }
  }

  /**
   * Sincroniza movimentações de um processo
   */
  async syncProcessoMovimentos(
    processId: string,
    numeroProcesso: string,
    tribunal: string
  ): Promise<{
    sucesso: boolean
    movimentos: DataJudMovimento[]
    novas_movimentacoes: number
  }> {
    try {
      // Buscar processo no DataJud
      const searchResult = await this.searchProcessos({
        tribunal,
        searchType: "numero",
        query: numeroProcesso,
      })

      if (searchResult.processos.length === 0) {
        throw new Error("Processo não encontrado no DataJud")
      }

      const processData = searchResult.processos[0]
      const movimentos = (processData.raw_response?.movimentos as unknown[]) || []

      // Buscar movimentações existentes via Supabase
      const { data: existingMovimentacoes } = await supabase
        .from('datajud_movimentacoes')
        .select('*')
        .eq('datajud_processo_id', processId)

      const existing = existingMovimentacoes || []

      const novasMovimentacoes = movimentos.filter(
        (mov: any) =>
          !existing.find(
            (e: any) =>
              e.codigo === mov.codigo && e.data_hora === mov.dataHora
          )
      )

      // Inserir novas movimentações
      if (novasMovimentacoes.length > 0) {
        const movimentacoesToInsert = novasMovimentacoes.map((mov: any) => ({
          datajud_processo_id: processId,
          codigo: mov.codigo,
          nome: mov.nome,
          data_hora: mov.dataHora,
          complemento: mov.complemento,
          raw_response: mov,
          detected_at: new Date().toISOString(),
          notified: false,
        }))

        const { error: insertError } = await supabase
          .from('datajud_movimentacoes')
          .insert(movimentacoesToInsert)

        if (insertError) {
          console.error("Error inserting movimentações:", insertError)
        }
      }

      // Atualizar timestamp de sync
      const { error: updateError } = await supabase
        .from('datajud_processos')
        .update({ cached_at: new Date().toISOString() })
        .eq('id', processId)

      if (updateError) {
        console.error("Error updating cached_at:", updateError)
      }

      return {
        sucesso: true,
        movimentos: movimentos.map((mov: any) => ({
          id: `${processId}-${mov.codigo}`,
          datajud_processo_id: processId,
          codigo: mov.codigo,
          nome: mov.nome,
          data_hora: mov.dataHora,
          complemento: mov.complemento,
          raw_response: mov,
          detected_at: new Date().toISOString(),
          notified: false,
          created_at: new Date().toISOString(),
        })),
        novas_movimentacoes: novasMovimentacoes.length,
      }
    } catch (error) {
      console.error("Error syncing movimentos:", error)
      throw error
    }
  }

  /**
   * Retorna detalhes de um processo + movimentos
   */
  async getProcessoDetails(
    numeroProcesso: string,
    tribunal: string
  ): Promise<{
    processo: DataJudProcesso
    movimentos: DataJudMovimento[]
  }> {
    try {
      const searchResult = await this.searchProcessos({
        tribunal,
        searchType: "numero",
        query: numeroProcesso,
      })

      if (searchResult.processos.length === 0) {
        throw new Error("Processo não encontrado")
      }

      const processo = searchResult.processos[0]

      const movimentos = (processo.raw_response?.movimentos as any[])?.map((mov, idx) => ({
        id: `${processo.id}-${idx}`,
        datajud_processo_id: processo.id,
        codigo: mov.codigo,
        nome: mov.nome,
        data_hora: mov.dataHora,
        complemento: mov.complemento,
        raw_response: mov,
        detected_at: new Date().toISOString(),
        notified: false,
        created_at: new Date().toISOString(),
      })) || []

      return {
        processo,
        movimentos,
      }
    } catch (error) {
      console.error("Error getting processo details:", error)
      throw error
    }
  }

  /**
   * Retorna o histórico de consultas do usuário
   */
  async getHistoricoConsultas(limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('datajud_api_calls')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error("Error getting histórico:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error getting histórico:", error)
      return []
    }
  }
}

export const datajudCaseService = new DataJudCaseService()
