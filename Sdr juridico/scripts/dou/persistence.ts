// scripts/dou/persistence.ts
// Camada de persistência: grava dados no Supabase usando SERVICE_ROLE_KEY
import { createClient } from '@supabase/supabase-js'
import { DOU_CONFIG } from './config'
import { classificarTipo } from './matching-engine'
import { logger } from './logger'
import { validateBeforePersist } from './validation'
import type { DOUHit, DOUMatchResult, DOUTermo } from './types'

const supabase = createClient(DOU_CONFIG.supabaseUrl, DOU_CONFIG.supabaseServiceKey)

export { supabase }

/**
 * Salva publicação encontrada no banco
 */
export async function salvarPublicacao(
  orgId: string,
  casoId: string | undefined,
  pub: DOUHit,
  termo: DOUTermo,
  matchResult: DOUMatchResult
): Promise<boolean> {
  const tipo = classificarTipo(pub.title || '', pub.content || '')
  const identifica = pub.identifica || pub.title || pub.urlTitle

  // Validar dados antes de persistir
  const check = validateBeforePersist({
    orgId,
    titulo: pub.title,
    dataPub: pub.pubDate,
    conteudo: pub.content,
  })
  if (!check.valid) {
    logger.warn(`Publicacao ignorada (validacao): ${check.errors.join(', ')}`)
    return false
  }

  const { error } = await supabase
    .from('dou_publicacoes')
    .upsert({
      org_id: orgId,
      caso_id: casoId || null,
      secao: pub.pubName || 'DO3',
      data_publicacao: parsePubDate(pub.pubDate),
      titulo: pub.title,
      conteudo: pub.content ? pub.content.slice(0, 10000) : null,
      orgao_publicador: pub.artCategory || (pub.hierarchyList || []).join(' > '),
      tipo_publicacao: tipo,
      url_publicacao: pub.urlTitle ? `https://www.in.gov.br/en/web/dou/-/${pub.urlTitle}` : null,
      identifica,
      pagina: pub.numberPage,
      termo_encontrado: termo.termo,
      match_type: matchResult.matchType,
      relevancia: matchResult.score,
      lida: false,
      notificada: false,
      raw_xml: {
        artType: pub.artType,
        artCategory: pub.artCategory,
        editionNumber: pub.editionNumber,
        urlTitle: pub.urlTitle,
      },
    }, {
      onConflict: 'identifica,caso_id',
      ignoreDuplicates: true,
    })

  if (error) {
    // Duplicata é esperada, não logar como erro
    if (error.code === '23505') return false
    logger.error('Erro ao salvar publicação:', error)
    return false
  }

  return true
}

/**
 * Cria notificação P1 para a org
 */
export async function criarNotificacao(
  orgId: string,
  casoId: string | undefined,
  pub: DOUHit,
  termo: DOUTermo
): Promise<void> {
  const tipo = classificarTipo(pub.title || '', pub.content || '')
  const tipoLabel: Record<string, string> = {
    intimacao: 'Intimação',
    citacao: 'Citação',
    edital: 'Edital',
    despacho: 'Despacho',
    sentenca: 'Sentença',
    outro: 'Publicação',
  }

  const { error } = await supabase.from('notificacoes').insert({
    org_id: orgId,
    titulo: `Nova publicação no DOU`,
    descricao: `${tipoLabel[tipo] || 'Publicação'}: "${pub.title?.slice(0, 100)}" - encontrado por "${termo.termo}"`,
    prioridade: 'P1',
    tipo: 'dou',
    link_url: casoId ? `/casos/${casoId}` : undefined,
    link_label: casoId ? 'Ver caso' : undefined,
    caso_id: casoId || undefined,
  })

  if (error) {
    logger.error('Erro ao criar notificação:', error)
  }
}

/**
 * Insere evento na timeline do caso
 */
export async function inserirTimeline(
  casoId: string,
  pub: DOUHit
): Promise<void> {
  const tipo = classificarTipo(pub.title || '', pub.content || '')

  const { error } = await supabase.from('timeline_events').insert({
    caso_id: casoId,
    titulo: `Publicação DOU: ${pub.title?.slice(0, 100)}`,
    descricao: `${tipo} encontrada no DOU Seção 3 de ${pub.pubDate}`,
    categoria: 'juridico',
    canal: 'dou_bot',
    data_evento: parsePubDate(pub.pubDate),
  })

  if (error) {
    logger.error('Erro ao inserir timeline:', error)
  }
}

/**
 * Registra log de sincronização
 */
export async function logSync(
  orgId: string,
  dataPesquisa: string,
  termosPesquisados: number,
  publicacoesEncontradas: number,
  duracaoMs: number,
  erroMensagem?: string
): Promise<void> {
  const { error } = await supabase.from('dou_sync_logs').insert({
    org_id: orgId,
    data_pesquisa: dataPesquisa,
    termos_pesquisados: termosPesquisados,
    publicacoes_encontradas: publicacoesEncontradas,
    status: erroMensagem ? 'erro' : 'sucesso',
    erro_mensagem: erroMensagem || null,
    duracao_ms: duracaoMs,
  })

  if (error) {
    logger.error('Erro ao salvar sync log:', error)
  }
}

/**
 * Carrega termos monitorados de uma org
 */
export async function getTermosMonitorados(orgId: string): Promise<DOUTermo[]> {
  const { data, error } = await supabase
    .from('dou_termos_monitorados')
    .select('termo, tipo, caso_id')
    .eq('org_id', orgId)
    .eq('ativo', true)

  if (error) {
    logger.error('Erro ao carregar termos:', error)
    return []
  }

  return (data || []).map(t => ({
    termo: t.termo,
    tipo: t.tipo as DOUTermo['tipo'],
    caso_id: t.caso_id,
    org_id: orgId,
  }))
}

/**
 * Carrega casos ativos com número de processo
 */
export async function getCasosAtivosComProcesso(orgId: string): Promise<Array<{
  id: string
  numero_processo: string
  titulo: string
}>> {
  const { data, error } = await supabase
    .from('casos')
    .select('id, numero_processo, titulo')
    .eq('org_id', orgId)
    .eq('status', 'ativo')
    .not('numero_processo', 'is', null)

  if (error) {
    logger.error('Erro ao carregar casos:', error)
    return []
  }

  return (data || []).filter(c => c.numero_processo)
}

/**
 * Converte data do DOU (DD/MM/YYYY) para formato ISO (YYYY-MM-DD)
 */
function parsePubDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().slice(0, 10)

  // Formato DD/MM/YYYY
  const parts = dateStr.split('/')
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`
  }

  // Formato DD-MM-YYYY
  const parts2 = dateStr.split('-')
  if (parts2.length === 3 && parts2[0].length <= 2) {
    return `${parts2[2]}-${parts2[1]}-${parts2[0]}`
  }

  // Já está em YYYY-MM-DD ou outro formato
  return dateStr
}
