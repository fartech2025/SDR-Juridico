/**
 * Serviço de Favoritos e Histórico
 * Gerencia processos favoritos e histórico de consultas
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'

const STORAGE_KEY = 'sdr_juridico_favoritos'

type FavoritosStore = Record<
  string,
  {
    favoritos: ProcessoFavorito[]
    historico: HistoricoConsulta[]
    movimentacoes: MovimentacaoDetectada[]
  }
>

const loadStore = (): FavoritosStore => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as FavoritosStore
      if (parsed && typeof parsed === 'object') return parsed
    }
  } catch {
    // Ignorar erros de storage
  }
  return {}
}

const saveStore = (store: FavoritosStore) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // Ignorar erros de storage
  }
}

const getUserId = async (): Promise<string | null> => {
  if (!isSupabaseConfigured) return 'anon'
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) return null
    return data.user.id
  } catch {
    return null
  }
}

const useLocalStore = () => !isSupabaseConfigured

const ensureUserStore = (store: FavoritosStore, userId: string) => {
  if (!store[userId]) {
    store[userId] = { favoritos: [], historico: [], movimentacoes: [] }
  }
  return store[userId]
}

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
  if (useLocalStore()) {
    const userId = (await getUserId()) || 'anon'
    const store = loadStore()
    const userStore = ensureUserStore(store, userId)
    const now = new Date().toISOString()
    const favorito: ProcessoFavorito = {
      id: crypto.randomUUID(),
      user_id: userId,
      numero_processo: processo.numero_processo,
      tribunal: processo.tribunal,
      classe: processo.classe,
      orgao_julgador: processo.orgao_julgador,
      data_ajuizamento: processo.data_ajuizamento,
      descricao: processo.descricao,
      tags: processo.tags,
      notificar: processo.notificar ?? true,
      criado_em: now,
      atualizado_em: now,
      ultima_movimentacao: undefined,
    }
    userStore.favoritos.unshift(favorito)
    saveStore(store)
    return { data: favorito, error: null }
  }

  const userId = await getUserId()
  if (!userId) {
    return { data: null, error: new Error('Usuário não autenticado') }
  }

  const payload = {
    user_id: userId,
    numero_processo: processo.numero_processo,
    tribunal: processo.tribunal,
    classe: processo.classe ?? null,
    orgao_julgador: processo.orgao_julgador ?? null,
    data_ajuizamento: processo.data_ajuizamento ?? null,
    descricao: processo.descricao ?? null,
    tags: processo.tags ?? null,
    notificar: processo.notificar ?? true,
  }

  const { data, error } = await supabase
    .from('processos_favoritos')
    .upsert(payload, { onConflict: 'user_id,numero_processo' })
    .select()
    .single()

  return { data: (data as ProcessoFavorito) || null, error }
}

/**
 * Remove processo dos favoritos
 */
export async function removerFavorito(numero_processo: string): Promise<{ error: any }> {
  if (useLocalStore()) {
    const userId = (await getUserId()) || 'anon'
    const store = loadStore()
    const userStore = ensureUserStore(store, userId)
    userStore.favoritos = userStore.favoritos.filter((fav) => fav.numero_processo !== numero_processo)
    saveStore(store)
    return { error: null }
  }

  const userId = await getUserId()
  if (!userId) return { error: new Error('Usuário não autenticado') }

  const { error } = await supabase
    .from('processos_favoritos')
    .delete()
    .eq('user_id', userId)
    .eq('numero_processo', numero_processo)

  return { error }
}

/**
 * Verifica se processo está nos favoritos
 */
export async function isFavorito(numero_processo: string): Promise<boolean> {
  if (useLocalStore()) {
    const userId = (await getUserId()) || 'anon'
    const store = loadStore()
    const userStore = ensureUserStore(store, userId)
    return userStore.favoritos.some((fav) => fav.numero_processo === numero_processo)
  }

  const userId = await getUserId()
  if (!userId) return false

  const { data, error } = await supabase
    .from('processos_favoritos')
    .select('id')
    .eq('user_id', userId)
    .eq('numero_processo', numero_processo)
    .limit(1)

  if (error) return false
  return (data || []).length > 0
}

/**
 * Lista todos os favoritos do usuário
 */
export async function listarFavoritos(): Promise<{ data: ProcessoFavorito[] | null; error: any }> {
  if (useLocalStore()) {
    const userId = (await getUserId()) || 'anon'
    const store = loadStore()
    const userStore = ensureUserStore(store, userId)
    return { data: userStore.favoritos, error: null }
  }

  const userId = await getUserId()
  if (!userId) return { data: null, error: new Error('Usuário não autenticado') }

  const { data, error } = await supabase
    .from('processos_favoritos')
    .select('*')
    .eq('user_id', userId)
    .order('atualizado_em', { ascending: false })

  return { data: (data as ProcessoFavorito[]) || null, error }
}

/**
 * Atualiza favorito
 */
export async function atualizarFavorito(
  numero_processo: string,
  updates: Partial<ProcessoFavorito>
): Promise<{ data: ProcessoFavorito | null; error: any }> {
  if (useLocalStore()) {
    const userId = (await getUserId()) || 'anon'
    const store = loadStore()
    const userStore = ensureUserStore(store, userId)
    const index = userStore.favoritos.findIndex((fav) => fav.numero_processo === numero_processo)
    if (index === -1) {
      return { data: null, error: { message: 'Favorito não encontrado' } }
    }
    const updated = {
      ...userStore.favoritos[index],
      ...updates,
      atualizado_em: new Date().toISOString(),
    }
    userStore.favoritos[index] = updated
    saveStore(store)
    return { data: updated, error: null }
  }

  const userId = await getUserId()
  if (!userId) return { data: null, error: new Error('Usuário não autenticado') }

  const { data, error } = await supabase
    .from('processos_favoritos')
    .update({
      descricao: updates.descricao ?? null,
      tags: updates.tags ?? null,
      notificar: updates.notificar ?? true,
      ultima_movimentacao: updates.ultima_movimentacao ?? null,
    })
    .eq('user_id', userId)
    .eq('numero_processo', numero_processo)
    .select()
    .single()

  return { data: (data as ProcessoFavorito) || null, error }
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
  if (useLocalStore()) {
    const userId = (await getUserId()) || 'anon'
    const store = loadStore()
    const userStore = ensureUserStore(store, userId)
    userStore.historico.unshift({
      id: crypto.randomUUID(),
      user_id: userId,
      numero_processo: consulta.numero_processo,
      tribunal: consulta.tribunal,
      tipo_busca: consulta.tipo_busca,
      consultado_em: new Date().toISOString(),
      tempo_resposta: consulta.tempo_resposta,
      sucesso: consulta.sucesso ?? true,
    })
    saveStore(store)
    return
  }

  const userId = await getUserId()
  if (!userId) return

  await supabase.from('historico_consultas').insert({
    user_id: userId,
    numero_processo: consulta.numero_processo,
    tribunal: consulta.tribunal,
    tipo_busca: consulta.tipo_busca ?? null,
    consultado_em: new Date().toISOString(),
    tempo_resposta: consulta.tempo_resposta ?? null,
    sucesso: consulta.sucesso ?? true,
  })
}

/**
 * Lista histórico de consultas
 */
export async function listarHistorico(limite = 50): Promise<{ data: HistoricoConsulta[] | null; error: any }> {
  if (useLocalStore()) {
    const userId = (await getUserId()) || 'anon'
    const store = loadStore()
    const userStore = ensureUserStore(store, userId)
    return { data: userStore.historico.slice(0, limite), error: null }
  }

  const userId = await getUserId()
  if (!userId) return { data: null, error: new Error('Usuário não autenticado') }

  const { data, error } = await supabase
    .from('historico_consultas')
    .select('*')
    .eq('user_id', userId)
    .order('consultado_em', { ascending: false })
    .limit(limite)

  return { data: (data as HistoricoConsulta[]) || null, error }
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
  if (useLocalStore()) {
    const userId = (await getUserId()) || 'anon'
    const store = loadStore()
    const userStore = ensureUserStore(store, userId)

    const totalConsultas = userStore.historico.length
    const processosUnicos = new Set(userStore.historico.map((p) => p.numero_processo)).size
    const tribunaisCount: Record<string, number> = {}
    userStore.historico.forEach((item) => {
      tribunaisCount[item.tribunal] = (tribunaisCount[item.tribunal] || 0) + 1
    })

    const tribunaisMaisConsultados = Object.entries(tribunaisCount)
      .map(([tribunal, total]) => ({ tribunal, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    const seteDiasAtras = new Date()
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7)
    const consultasRecentes = userStore.historico.filter(
      (item) => new Date(item.consultado_em) >= seteDiasAtras
    ).length

    return {
      totalConsultas: totalConsultas || 0,
      processosUnicos,
      tribunaisMaisConsultados,
      consultasRecentes: consultasRecentes || 0
    }
  }

  const userId = await getUserId()
  if (!userId) {
    return {
      totalConsultas: 0,
      processosUnicos: 0,
      tribunaisMaisConsultados: [],
      consultasRecentes: 0,
    }
  }

  const { data, error, count } = await supabase
    .from('historico_consultas')
    .select('numero_processo, tribunal, consultado_em', { count: 'exact' })
    .eq('user_id', userId)

  if (error || !data) {
    return {
      totalConsultas: 0,
      processosUnicos: 0,
      tribunaisMaisConsultados: [],
      consultasRecentes: 0,
    }
  }

  const totalConsultas = count ?? data.length
  const processosUnicos = new Set(data.map((item) => item.numero_processo)).size
  const tribunaisCount: Record<string, number> = {}
  data.forEach((item) => {
    tribunaisCount[item.tribunal] = (tribunaisCount[item.tribunal] || 0) + 1
  })

  const tribunaisMaisConsultados = Object.entries(tribunaisCount)
    .map(([tribunal, total]) => ({ tribunal, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  const seteDiasAtras = new Date()
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 7)
  const consultasRecentes = data.filter(
    (item) => new Date(item.consultado_em) >= seteDiasAtras
  ).length

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
  if (useLocalStore()) {
    const userId = (await getUserId()) || 'anon'
    const store = loadStore()
    const userStore = ensureUserStore(store, userId)
    const data = userStore.movimentacoes.filter((mov) => !mov.lido)
    return { data, error: null }
  }

  const { data, error } = await supabase
    .from('movimentacoes_detectadas')
    .select('*')
    .eq('lido', false)
    .order('detectado_em', { ascending: false })

  return { data: (data as MovimentacaoDetectada[]) || null, error }
}

/**
 * Marca movimentação como lida
 */
export async function marcarMovimentacaoLida(id: string): Promise<{ error: any }> {
  if (useLocalStore()) {
    const userId = (await getUserId()) || 'anon'
    const store = loadStore()
    const userStore = ensureUserStore(store, userId)
    const index = userStore.movimentacoes.findIndex((mov) => mov.id === id)
    if (index !== -1) {
      userStore.movimentacoes[index].lido = true
      saveStore(store)
    }
    return { error: null }
  }

  const { error } = await supabase
    .from('movimentacoes_detectadas')
    .update({ lido: true })
    .eq('id', id)

  return { error }
}
