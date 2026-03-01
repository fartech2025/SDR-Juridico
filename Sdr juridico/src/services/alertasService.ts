/**
 * Servico de Alertas
 * CRUD para notificações persistentes do sistema
 */

import { supabase } from '@/lib/supabaseClient'
import { AppError } from '@/utils/errors'
import { resolveOrgScope } from '@/services/orgScope'

export interface AlertaRow {
  id: string
  org_id: string
  user_id: string | null
  tipo: string
  prioridade: 'P0' | 'P1' | 'P2'
  titulo: string
  descricao: string | null
  entidade: string | null
  entidade_id: string | null
  action_href: string | null
  lida: boolean
  created_at: string
}

export const alertasService = {
  /** Busca alertas da org (não lidos primeiro, depois por data) */
  async getAlertas(options?: { apenasNaoLidos?: boolean; limit?: number }): Promise<AlertaRow[]> {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) return []

      let query = supabase
        .from('alertas')
        .select('*')
        .order('lida', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(options?.limit ?? 50)

      if (!isFartechAdmin) query = query.eq('org_id', orgId)
      if (options?.apenasNaoLidos) query = query.eq('lida', false)

      const { data, error } = await query
      if (error) throw new AppError(error.message, 'database_error')
      return (data || []) as AlertaRow[]
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao buscar alertas',
        'database_error'
      )
    }
  },

  /** Conta alertas não lidos */
  async getContadorNaoLidas(): Promise<number> {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) return 0

      const query = supabase
        .from('alertas')
        .select('id', { count: 'exact', head: true })
        .eq('lida', false)

      const { count, error } = isFartechAdmin ? await query : await query.eq('org_id', orgId)
      if (error) throw new AppError(error.message, 'database_error')
      return count || 0
    } catch {
      return 0
    }
  },

  /** Marca um alerta como lido */
  async marcarComoLida(alertaId: string): Promise<void> {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) return

      const query = supabase
        .from('alertas')
        .update({ lida: true })
        .eq('id', alertaId)

      const { error } = isFartechAdmin ? await query : await query.eq('org_id', orgId)
      if (error) throw new AppError(error.message, 'database_error')
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao marcar alerta',
        'database_error'
      )
    }
  },

  /** Cria um novo alerta (notificação) para um usuário */
  async createAlerta(input: {
    userId?: string | null
    tipo: string
    prioridade?: 'P0' | 'P1' | 'P2'
    titulo: string
    descricao?: string | null
    entidade?: string | null
    entidadeId?: string | null
    actionHref?: string | null
  }): Promise<void> {
    try {
      const { orgId } = await resolveOrgScope()
      if (!orgId) return

      const { error } = await supabase.from('alertas').insert({
        org_id: orgId,
        user_id: input.userId ?? null,
        tipo: input.tipo,
        prioridade: input.prioridade ?? 'P2',
        titulo: input.titulo,
        descricao: input.descricao ?? null,
        entidade: input.entidade ?? null,
        entidade_id: input.entidadeId ?? null,
        action_href: input.actionHref ?? null,
        lida: false,
      })
      if (error) throw new AppError(error.message, 'database_error')
    } catch (error) {
      // Silencia — não bloquear a operação principal se o alerta falhar
      console.warn('[alertasService] createAlerta falhou silenciosamente:', error)
    }
  },

  /** Marca todos os alertas da org como lidos */
  async marcarTodasComoLidas(): Promise<void> {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) return

      const query = supabase
        .from('alertas')
        .update({ lida: true })
        .eq('lida', false)

      const { error } = isFartechAdmin ? await query : await query.eq('org_id', orgId)
      if (error) throw new AppError(error.message, 'database_error')
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao marcar alertas',
        'database_error'
      )
    }
  },
}
