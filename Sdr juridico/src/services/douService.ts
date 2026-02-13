// src/services/douService.ts
import { supabase } from "@/lib/supabaseClient"
import type {
  DOUPublicacao,
  DOUTermoMonitorado,
  DOUSearchParams,
  DOUSyncLog,
} from "@/types/domain"

class DOUService {
  /**
   * Busca publicações no DOU via Edge Function (proxy para API pública)
   */
  async searchPublicacoes(params: DOUSearchParams): Promise<{
    publicacoes: DOUPublicacao[] | Record<string, unknown>[]
    source: string
    latency_ms: number
  }> {
    // Busca o token JWT da sessão atual
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    const { data, error } = await supabase.functions.invoke('dou-search', {
      body: {
        termo: params.termo,
        dataInicio: params.dataInicio,
        dataFim: params.dataFim,
      },
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    });

    if (error) {
      console.error("Error searching DOU:", error);
      throw new Error(error.message || "Erro ao buscar no DOU");
    }

    if ((data as Record<string, unknown>)?.error) {
      throw new Error(String((data as Record<string, unknown>).error));
    }

    return {
      publicacoes: (data as Record<string, unknown>)?.data as DOUPublicacao[] || [],
      source: String((data as Record<string, unknown>)?.source || 'unknown'),
      latency_ms: Number((data as Record<string, unknown>)?.latency_ms || 0),
    };
  }

  /**
   * Lista publicações de um caso (query direta ao Supabase)
   */
  async getPublicacoesByCaso(casoId: string): Promise<DOUPublicacao[]> {
    const { data, error } = await supabase
      .from('dou_publicacoes')
      .select('*')
      .eq('caso_id', casoId)
      .order('data_publicacao', { ascending: false })

    if (error) {
      console.error("Error getting publicações:", error)
      return []
    }

    return (data || []) as DOUPublicacao[]
  }

  /**
   * Lista publicações não lidas da org
   */
  async getPublicacoesNaoLidas(): Promise<DOUPublicacao[]> {
    const { data, error } = await supabase
      .from('dou_publicacoes')
      .select('*')
      .eq('lida', false)
      .order('data_publicacao', { ascending: false })
      .limit(50)

    if (error) {
      console.error("Error getting publicações não lidas:", error)
      return []
    }

    return (data || []) as DOUPublicacao[]
  }

  /**
   * Marca publicação como lida
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
        throw new Error("Termo já cadastrado para este caso")
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
   * Retorna logs de sincronização
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
}

export const douService = new DOUService()
