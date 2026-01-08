/**
 * Serviço de Favoritos e Histórico
 * Gerencia processos favoritos e histórico de consultas
 */

import { supabase } from '@/lib/supabaseClient'

export interface ProcessoFavorito {
  id: string
  user_id: string
  numero_processo: string
  tribunal: string
  classe?: string
  orgao_julgador?: string
  data_ajuizamento?: string
  descricao?: string
  tags?: string[]
  notificar: boolean
  criado_em: string
  atualizado_em: string
  ultima_movimentacao?: string
}

export interface HistoricoConsulta {
  id: string
  user_id?: string
  numero_processo: string
  tribunal: string
  tipo_busca?: string
  consultado_em: string
  tempo_resposta?: number
  sucesso: boolean
}

export interface MovimentacaoDetectada {
  id: string
  processo_favorito_id: string
  numero_processo: string
  movimentacao_codigo?: number
  movimentacao_nome?: string
  movimentacao_data?: string
  movimentacao_complemento?: string
  detectado_em: string
  notificado: boolean
  lido: boolean
}

/**
 * Adiciona processo aos favoritos
 */
export async function adicionarFavorito(processo: {
  numero_processo: string
  tribunal: string
  classe?: string
  orgao_julgador?: string
  data_ajuizamento?: string
  descricao?: string
  tags?: string[]
  notificar?: boolean
}): Promise<{ data: ProcessoFavorito | null; error: any }> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'Usuário não autenticado' } }
  }

  const { data, error } = await supabase
    .from('processos_favoritos')
    .insert({
      user_id: user.id,
      ...processo,
      notificar: processo.notificar ?? true
    })
    .select()
    .single()

  return { data, error }
}

/**
 * Remove processo dos favoritos
 */
export async function removerFavorito(numero_processo: string): Promise<{ error: any }> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: { message: 'Usuário não autenticado' } }
  }

  const { error } = await supabase
    .from('processos_favoritos')
    .delete()
    .eq('user_id', user.id)
    .eq('numero_processo', numero_processo)

  return { error }
}

/**
 * Verifica se processo está nos favoritos
 */
export async function isFavorito(numero_processo: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false

  const { data, error } = await supabase
    .from('processos_favoritos')
    .select('id')
    .eq('user_id', user.id)
    .eq('numero_processo', numero_processo)
    .single()

  return !error && !!data
}

/**
 * Lista todos os favoritos do usuário
 */
export async function listarFavoritos(): Promise<{ data: ProcessoFavorito[] | null; error: any }> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'Usuário não autenticado' } }
  }

  const { data, error } = await supabase
    .from('processos_favoritos')
    .select('*')
    .eq('user_id', user.id)
    .order('criado_em', { ascending: false })

  return { data, error }
}

/**
 * Atualiza favorito
 */
export async function atualizarFavorito(
  numero_processo: string,
  updates: Partial<ProcessoFavorito>
): Promise<{ data: ProcessoFavorito | null; error: any }> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'Usuário não autenticado' } }
  }

  const { data, error } = await supabase
    .from('processos_favoritos')
    .update(updates)
    .eq('user_id', user.id)
    .eq('numero_processo', numero_processo)
    .select()
    .single()

  return { data, error }
}

/**
 * Registra consulta no histórico
 */
export async function registrarConsulta(consulta: {
  numero_processo: string
  tribunal: string
  tipo_busca?: string
  tempo_resposta?: number
  sucesso?: boolean
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()

  await supabase
    .from('historico_consultas')
    .insert({
      user_id: user?.id || null,
      ...consulta,
      sucesso: consulta.sucesso ?? true
    })
}

/**
 * Lista histórico de consultas
 */
export async function listarHistorico(limite = 50): Promise<{ data: HistoricoConsulta[] | null; error: any }> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'Usuário não autenticado' } }
  }

  const { data, error } = await supabase
    .from('historico_consultas')
    .select('*')
    .eq('user_id', user.id)
    .order('consultado_em', { ascending: false })
    .limit(limite)

  return { data, error }
}

/**
 * Obtém estatísticas do usuário
 */
export async function obterEstatisticas(): Promise<{
  totalConsultas: number
  processosUnicos: number
  tribunaisMaisConsultados: Array<{ tribunal: string; total: number }>
  consultasRecentes: number
}> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return {
      totalConsultas: 0,
      processosUnicos: 0,
      tribunaisMaisConsultados: [],
      consultasRecentes: 0
    }
  }

  // Total de consultas
  const { count: totalConsultas } = await supabase
    .from('historico_consultas')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Processos únicos
  const { data: processos } = await supabase
    .from('historico_consultas')
    .select('numero_processo')
    .eq('user_id', user.id)

  const processosUnicos = new Set(processos?.map((p: { numero_processo: string }) => p.numero_processo)).size

  // Tribunais mais consultados
  const { data: tribunaisData } = await supabase
    .from('historico_consultas')
    .select('tribunal')
    .eq('user_id', user.id)

  const tribunaisCount: Record<string, number> = {}
  tribunaisData?.forEach(({ tribunal }: { tribunal: string }) => {
    tribunaisCount[tribunal] = (tribunaisCount[tribunal] || 0) + 1
  })

  const tribunaisMaisConsultados = Object.entries(tribunaisCount)
    .map(([tribunal, total]) => ({ tribunal, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  // Consultas últimos 7 dias
  const seteDiasAtras = new Date()
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 7)

  const { count: consultasRecentes } = await supabase
    .from('historico_consultas')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('consultado_em', seteDiasAtras.toISOString())

  return {
    totalConsultas: totalConsultas || 0,
    processosUnicos,
    tribunaisMaisConsultados,
    consultasRecentes: consultasRecentes || 0
  }
}

/**
 * Lista movimentações não lidas
 */
export async function listarMovimentacoesNaoLidas(): Promise<{ data: MovimentacaoDetectada[] | null; error: any }> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'Usuário não autenticado' } }
  }

  const { data, error } = await supabase
    .from('movimentacoes_detectadas')
    .select(`
      *,
      processo_favorito:processos_favoritos(numero_processo, tribunal)
    `)
    .eq('lido', false)
    .order('detectado_em', { ascending: false })

  return { data, error }
}

/**
 * Marca movimentação como lida
 */
export async function marcarMovimentacaoLida(id: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from('movimentacoes_detectadas')
    .update({ lido: true })
    .eq('id', id)

  return { error }
}
