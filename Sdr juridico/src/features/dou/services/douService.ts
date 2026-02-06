// src/features/dou/services/douService.ts
import { supabase } from "@/lib/supabaseClient"
import type {
  DOUPublicacao,
  DOUTermoMonitorado,
  DOUSearchParams,
  DOUSyncLog,
} from "@/types/domain"
import { validateSearchResponse, validatePublicacoes } from "../validation"

class DOUService {
  /**
   * Busca publicacoes no DOU via Edge Function (proxy para API publica)
   */
  async searchPublicacoes(params: DOUSearchParams): Promise<{
    publicacoes: DOUPublicacao[] | Record<string, unknown>[]
    source: string
    latency_ms: number
  }> {
    const { data, error } = await supabase.functions.invoke('dou-search', {
      body: {
        termo: params.termo,
        dataInicio: params.dataInicio,
        dataFim: params.dataFim,
      },
    })

    if (error) {
      console.error("Error searching DOU:", error)
      throw new Error(error.message || "Erro ao buscar no DOU")
    }

    if ((data as Record<string, unknown>)?.error) {
      throw new Error(String((data as Record<string, unknown>).error))
    }

    // Validar resposta da Edge Function
    const validated = validateSearchResponse(data)

    return {
      publicacoes: validated.data,
      source: validated.source,
      latency_ms: validated.latency_ms,
    }
  }

  /**
   * Lista publicacoes de um caso (query direta ao Supabase)
   */
  async getPublicacoesByCaso(casoId: string): Promise<DOUPublicacao[]> {
    const { data, error } = await supabase
      .from('dou_publicacoes')
      .select('*')
      .eq('caso_id', casoId)
      .order('data_publicacao', { ascending: false })

    if (error) {
      console.error("Error getting publicacoes:", error)
      return []
    }

    return validatePublicacoes(data || [])
  }

  /**
   * Lista publicacoes nao lidas da org
   */
  async getPublicacoesNaoLidas(): Promise<DOUPublicacao[]> {
    const { data, error } = await supabase
      .from('dou_publicacoes')
      .select('*')
      .eq('lida', false)
      .order('data_publicacao', { ascending: false })
      .limit(50)

    if (error) {
      console.error("Error getting publicacoes nao lidas:", error)
      return []
    }

    return validatePublicacoes(data || [])
  }

  /**
   * Marca publicacao como lida
   */
  async marcarComoLida(publicacaoId: string): Promise<void> {
    const { error } = await supabase
      .from('dou_publicacoes')
      .update({ lida: true })
      .eq('id', publicacaoId)

    if (error) {
      console.error("Error marking as read:", error)
      throw new Error("Erro ao marcar como lida")
    }
  }

  /**
   * Lista termos monitorados (opcionalmente filtrado por caso)
   */
  async getTermosMonitorados(casoId?: string): Promise<DOUTermoMonitorado[]> {
    let query = supabase
      .from('dou_termos_monitorados')
      .select('*')
      .order('created_at', { ascending: false })

    if (casoId) {
      query = query.eq('caso_id', casoId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error getting termos:", error)
      return []
    }

    return (data || []) as DOUTermoMonitorado[]
  }

  /**
   * Adiciona termo monitorado
   */
  async addTermoMonitorado(params: {
    casoId: string
    termo: string
    tipo: string
    orgId: string
  }): Promise<void> {
    const { error } = await supabase
      .from('dou_termos_monitorados')
      .insert({
        org_id: params.orgId,
        caso_id: params.casoId,
        termo: params.termo,
        tipo: params.tipo,
        ativo: true,
      })

    if (error) {
      if (error.code === '23505') {
        throw new Error("Termo ja cadastrado para este caso")
      }
      console.error("Error adding termo:", error)
      throw new Error("Erro ao adicionar termo")
    }
  }

  /**
   * Remove termo monitorado
   */
  async removeTermoMonitorado(termoId: string): Promise<void> {
    const { error } = await supabase
      .from('dou_termos_monitorados')
      .delete()
      .eq('id', termoId)

    if (error) {
      console.error("Error removing termo:", error)
      throw new Error("Erro ao remover termo")
    }
  }

  /**
   * Ativa/desativa termo monitorado
   */
  async toggleTermoAtivo(termoId: string, ativo: boolean): Promise<void> {
    const { error } = await supabase
      .from('dou_termos_monitorados')
      .update({ ativo })
      .eq('id', termoId)

    if (error) {
      console.error("Error toggling termo:", error)
      throw new Error("Erro ao atualizar termo")
    }
  }

  /**
   * Retorna logs de sincronizacao
   */
  async getSyncLogs(limit: number = 20): Promise<DOUSyncLog[]> {
    const { data, error } = await supabase
      .from('dou_sync_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error getting sync logs:", error)
      return []
    }

    return (data || []) as DOUSyncLog[]
  }

  /**
   * Atualiza flag monitorar_dou de um caso
   */
  async toggleMonitorarDOU(casoId: string, monitorar: boolean): Promise<void> {
    const { error } = await supabase
      .from('casos')
      .update({ monitorar_dou: monitorar })
      .eq('id', casoId)

    if (error) {
      console.error("Error toggling monitorar_dou:", error)
      throw new Error("Erro ao atualizar monitoramento DOU")
    }
  }

  /**
   * Busca status de monitoramento de um caso
   */
  async getMonitorarDOU(casoId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('casos')
      .select('monitorar_dou')
      .eq('id', casoId)
      .single()

    if (error) {
      console.error("Error getting monitorar_dou:", error)
      return true // default true
    }

    return data?.monitorar_dou ?? true
  }

  /**
   * Retorna estatísticas DOU da organização
   */
  async getOrgDOUStats(): Promise<{
    casosMonitorados: number
    termosAtivos: number
    publicacoes30d: number
    naoLidas: number
    ultimoSync: string | null
  }> {
    const { data, error } = await supabase
      .from('dou_stats_por_org')
      .select('*')
      .single()

    if (error) {
      console.error("Error getting DOU stats:", error)
      return {
        casosMonitorados: 0,
        termosAtivos: 0,
        publicacoes30d: 0,
        naoLidas: 0,
        ultimoSync: null,
      }
    }

    return {
      casosMonitorados: data?.casos_monitorados || 0,
      termosAtivos: data?.termos_ativos || 0,
      publicacoes30d: data?.publicacoes_30d || 0,
      naoLidas: data?.publicacoes_nao_lidas || 0,
      ultimoSync: data?.ultimo_sync_sucesso || null,
    }
  }
}

export const douService = new DOUService()
