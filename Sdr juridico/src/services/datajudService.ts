/**
 * Serviço de integração com a API Pública DataJud - CNJ
 * Base Nacional de Dados do Poder Judiciário
 * 
 * Usa Edge Function como proxy (sem autenticação JWT)
 */

import { supabase } from '@/lib/supabaseClient'

export interface ProcessoDataJud {
  numeroProcesso?: string
  classe?: any
  assunto?: string
  assuntos?: any[]
  tribunal?: string
  orgaoJulgador?: any
  dataAjuizamento?: string
  dataAtualizacao?: string
  dataHoraUltimaAtualizacao?: string
  grau?: string
  sistema?: any
  formato?: any
  nivelSigilo?: number
  id?: string
  valorCausa?: number
  '@timestamp'?: string
  dadosBasicos?: {
    numero?: string
    classeProcessual?: any
    assunto?: any
    orgaoJulgador?: any
    dataAjuizamento?: string
    procEl?: string
    grau?: string
    valorCausa?: number
    polo?: Array<{
      nome?: string
      tipo?: string
      polo?: string
    }>
  }
  movimentos?: Array<{
    codigo?: number
    codigoNacional?: number
    nome?: string
    dataHora?: string
    complemento?: string
  }>
}

export interface ResultadoBuscaDataJud {
  processos: ProcessoDataJud[]
  total: number
  tempo_resposta_ms?: number
}

// Mapas compartilhados de código CNJ → tribunal ID
const ESTADOS_PARA_TJ: Record<string, string> = {
  '01': 'tjac', '02': 'tjal', '03': 'tjap', '04': 'tjam', '05': 'tjba',
  '06': 'tjce', '07': 'tjdft', '08': 'tjes', '09': 'tjgo', '10': 'tjma',
  '11': 'tjmt', '12': 'tjms', '13': 'tjmg', '14': 'tjpa', '15': 'tjpb',
  '16': 'tjpe', '17': 'tjpi', '18': 'tjpr', '19': 'tjrj', '20': 'tjrn',
  '21': 'tjrs', '22': 'tjro', '23': 'tjrr', '24': 'tjsc', '25': 'tjsp',
  '26': 'tjse', '27': 'tjto',
}

const REGIOES_PARA_TRF: Record<string, string> = {
  '01': 'trf1', '02': 'trf2', '03': 'trf3', '04': 'trf4', '05': 'trf5', '06': 'trf6',
}

const REGIOES_PARA_TRT: Record<string, string> = {
  '01': 'trt1', '02': 'trt2', '03': 'trt3', '04': 'trt4', '05': 'trt5',
  '06': 'trt6', '07': 'trt7', '08': 'trt8', '09': 'trt9', '10': 'trt10',
  '11': 'trt11', '12': 'trt12', '13': 'trt13', '14': 'trt14', '15': 'trt15',
  '16': 'trt16', '17': 'trt17', '18': 'trt18', '19': 'trt19', '20': 'trt20',
  '21': 'trt21', '22': 'trt22', '23': 'trt23', '24': 'trt24',
}

const NOMES_TJ: Record<string, string> = {
  '01': 'TJAC - Tribunal de Justiça do Acre',
  '02': 'TJAL - Tribunal de Justiça de Alagoas',
  '03': 'TJAP - Tribunal de Justiça do Amapá',
  '04': 'TJAM - Tribunal de Justiça do Amazonas',
  '05': 'TJBA - Tribunal de Justiça da Bahia',
  '06': 'TJCE - Tribunal de Justiça do Ceará',
  '07': 'TJDFT - Tribunal de Justiça do DF',
  '08': 'TJES - Tribunal de Justiça do Espírito Santo',
  '09': 'TJGO - Tribunal de Justiça de Goiás',
  '10': 'TJMA - Tribunal de Justiça do Maranhão',
  '11': 'TJMT - Tribunal de Justiça de Mato Grosso',
  '12': 'TJMS - Tribunal de Justiça de Mato Grosso do Sul',
  '13': 'TJMG - Tribunal de Justiça de Minas Gerais',
  '14': 'TJPA - Tribunal de Justiça do Pará',
  '15': 'TJPB - Tribunal de Justiça da Paraíba',
  '16': 'TJPE - Tribunal de Justiça de Pernambuco',
  '17': 'TJPI - Tribunal de Justiça do Piauí',
  '18': 'TJPR - Tribunal de Justiça do Paraná',
  '19': 'TJRJ - Tribunal de Justiça do Rio de Janeiro',
  '20': 'TJRN - Tribunal de Justiça do Rio Grande do Norte',
  '21': 'TJRS - Tribunal de Justiça do Rio Grande do Sul',
  '22': 'TJRO - Tribunal de Justiça de Rondônia',
  '23': 'TJRR - Tribunal de Justiça de Roraima',
  '24': 'TJSC - Tribunal de Justiça de Santa Catarina',
  '25': 'TJSP - Tribunal de Justiça de São Paulo',
  '26': 'TJSE - Tribunal de Justiça de Sergipe',
  '27': 'TJTO - Tribunal de Justiça do Tocantins',
}

const NOMES_TRF: Record<string, string> = {
  '01': 'TRF1 - Tribunal Regional Federal 1ª Região',
  '02': 'TRF2 - Tribunal Regional Federal 2ª Região',
  '03': 'TRF3 - Tribunal Regional Federal 3ª Região',
  '04': 'TRF4 - Tribunal Regional Federal 4ª Região',
  '05': 'TRF5 - Tribunal Regional Federal 5ª Região',
  '06': 'TRF6 - Tribunal Regional Federal 6ª Região',
}

const NOMES_TRT: Record<string, string> = {
  '01': 'TRT1 - Tribunal Regional do Trabalho 1ª Região',
  '02': 'TRT2 - Tribunal Regional do Trabalho 2ª Região',
  '03': 'TRT3 - Tribunal Regional do Trabalho 3ª Região',
  '04': 'TRT4 - Tribunal Regional do Trabalho 4ª Região',
  '05': 'TRT5 - Tribunal Regional do Trabalho 5ª Região',
  '06': 'TRT6 - Tribunal Regional do Trabalho 6ª Região',
  '07': 'TRT7 - Tribunal Regional do Trabalho 7ª Região',
  '08': 'TRT8 - Tribunal Regional do Trabalho 8ª Região',
  '09': 'TRT9 - Tribunal Regional do Trabalho 9ª Região',
  '10': 'TRT10 - Tribunal Regional do Trabalho 10ª Região',
  '11': 'TRT11 - Tribunal Regional do Trabalho 11ª Região',
  '12': 'TRT12 - Tribunal Regional do Trabalho 12ª Região',
  '13': 'TRT13 - Tribunal Regional do Trabalho 13ª Região',
  '14': 'TRT14 - Tribunal Regional do Trabalho 14ª Região',
  '15': 'TRT15 - Tribunal Regional do Trabalho 15ª Região',
  '16': 'TRT16 - Tribunal Regional do Trabalho 16ª Região',
  '17': 'TRT17 - Tribunal Regional do Trabalho 17ª Região',
  '18': 'TRT18 - Tribunal Regional do Trabalho 18ª Região',
  '19': 'TRT19 - Tribunal Regional do Trabalho 19ª Região',
  '20': 'TRT20 - Tribunal Regional do Trabalho 20ª Região',
  '21': 'TRT21 - Tribunal Regional do Trabalho 21ª Região',
  '22': 'TRT22 - Tribunal Regional do Trabalho 22ª Região',
  '23': 'TRT23 - Tribunal Regional do Trabalho 23ª Região',
  '24': 'TRT24 - Tribunal Regional do Trabalho 24ª Região',
}

const SEGMENTOS: Record<string, string> = {
  '1': 'Supremo Tribunal Federal',
  '2': 'Conselho Nacional de Justiça',
  '3': 'Superior Tribunal de Justiça',
  '4': 'Justiça Federal',
  '5': 'Justiça do Trabalho',
  '6': 'Justiça Eleitoral',
  '7': 'Justiça Militar da União',
  '8': 'Justiça Estadual',
  '9': 'Justiça Militar Estadual',
}

/**
 * Detecta tribunal ID a partir do segmento de justiça e código TR do número CNJ
 */
function detectarTribunalId(justica: string, codigoTR: string): string | null {
  if (justica === '8') return ESTADOS_PARA_TJ[codigoTR] || null
  if (justica === '4') return REGIOES_PARA_TRF[codigoTR] || null
  if (justica === '5') return REGIOES_PARA_TRT[codigoTR] || null
  return null
}

// Lista de tribunais válidos
const TRIBUNAIS_VALIDOS = [
  'stf', 'stj', 'tst', 'tse', 'stm',
  'trf1', 'trf2', 'trf3', 'trf4', 'trf5', 'trf6',
  'trt1', 'trt2', 'trt3', 'trt4', 'trt5', 'trt6', 'trt7', 'trt8', 'trt9',
  'trt10', 'trt11', 'trt12', 'trt13', 'trt14', 'trt15', 'trt16', 'trt17',
  'trt18', 'trt19', 'trt20', 'trt21', 'trt22', 'trt23', 'trt24',
  'tjac', 'tjal', 'tjam', 'tjap', 'tjba', 'tjce', 'tjdft', 'tjes', 'tjgo',
  'tjma', 'tjmg', 'tjms', 'tjmt', 'tjpa', 'tjpb', 'tjpe', 'tjpi', 'tjpr',
  'tjrj', 'tjrn', 'tjro', 'tjrr', 'tjrs', 'tjsc', 'tjse', 'tjsp', 'tjto',
  'tre-ac', 'tre-al', 'tre-am', 'tre-ap', 'tre-ba', 'tre-ce', 'tre-df',
  'tre-es', 'tre-go', 'tre-ma', 'tre-mg', 'tre-ms', 'tre-mt', 'tre-pa',
  'tre-pb', 'tre-pe', 'tre-pi', 'tre-pr', 'tre-rj', 'tre-rn', 'tre-ro',
  'tre-rr', 'tre-rs', 'tre-sc', 'tre-se', 'tre-sp', 'tre-to',
  'tjmmg', 'tjmrs', 'tjmsp',
]

/**
 * Chama a Edge Function datajud-enhanced (proxy sem autenticação)
 */
async function callDataJud(
  tribunal: string, 
  searchType: string, 
  query: string, 
  size: number = 20
): Promise<any> {
  const tribunalNormalizado = tribunal.toLowerCase()
  
  if (!TRIBUNAIS_VALIDOS.includes(tribunalNormalizado)) {
    throw new Error(`Tribunal inválido: ${tribunal}`)
  }

  console.log(`📡 [DataJud] Buscando: ${searchType} "${query}" no ${tribunalNormalizado}`)

  // Usa fetch direto para passar query params
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const functionUrl = `${supabaseUrl}/functions/v1/datajud-proxy?tribunal=${tribunalNormalizado}&numeroProcesso=${encodeURIComponent(query)}`
  
  const response = await fetch(functionUrl, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  const data = await response.json()

  if (!response.ok) {
    console.error('❌ [DataJud] Erro na Edge Function:', data)
    throw new Error(data.error || `Erro ${response.status}`)
  }

  if (data?.error) {
    console.error('❌ [DataJud] Erro retornado:', data.error)
    throw new Error(data.error)
  }

  console.log(`✅ [DataJud] ${data?.total || 0} resultados`)
  
  // Adapta resposta para formato esperado
  return {
    hits: {
      total: { value: data?.total || 0 },
      hits: (data?.processos || []).map((p: any) => ({ _source: p }))
    }
  }
}

/**
 * Testa a conexão com a API DataJud
 */
export async function testarConexao(): Promise<{
  sucesso: boolean
  mensagem: string
  detalhes?: any
}> {
  try {
    console.log('🧪 [DataJud] Testando conexão...')
    
    const data = await callDataJud('trf1', 'avancada', '*', 1)
    const total = data?.hits?.total?.value || 0

    return {
      sucesso: true,
      mensagem: `✅ Conectado! ${total.toLocaleString()} processos disponíveis no TRF1`,
      detalhes: { total },
    }
  } catch (error) {
    console.error('❌ [DataJud] Erro no teste:', error)
    return {
      sucesso: false,
      mensagem: `❌ Erro: ${error instanceof Error ? error.message : 'Desconhecido'}`,
    }
  }
}

/**
 * Busca processo por número
 */
export async function buscarProcessoPorNumero(
  numeroProcesso: string,
  tribunal: string = 'trf1'
): Promise<ResultadoBuscaDataJud> {
  const numeroLimpo = numeroProcesso.replace(/\D/g, '')
  const data = await callDataJud(tribunal, 'numero', numeroLimpo, 10)
  
  return {
    processos: data?.hits?.hits?.map((h: any) => h._source) || [],
    total: data?.hits?.total?.value || 0,
  }
}

/**
 * Busca processos por nome da parte
 */
export async function buscarProcessosPorParte(
  nomeParte: string,
  tribunal: string = 'trf1',
  tamanho: number = 10
): Promise<ResultadoBuscaDataJud> {
  const data = await callDataJud(tribunal, 'parte', nomeParte, tamanho)
  
  return {
    processos: data?.hits?.hits?.map((h: any) => h._source) || [],
    total: data?.hits?.total?.value || 0,
  }
}

/**
 * Busca processos por classe processual
 */
export async function buscarProcessosPorClasse(
  classe: string,
  tribunal: string = 'trf1',
  tamanho: number = 10
): Promise<ResultadoBuscaDataJud> {
  const data = await callDataJud(tribunal, 'classe', classe, tamanho)
  
  return {
    processos: data?.hits?.hits?.map((h: any) => h._source) || [],
    total: data?.hits?.total?.value || 0,
  }
}

/**
 * Busca processos por CPF ou CNPJ da parte
 */
export async function buscarProcessosPorCpfCnpj(
  cpfCnpj: string,
  tribunal: string = 'tjsp',
  tamanho: number = 50
): Promise<ResultadoBuscaDataJud> {
  const cpfLimpo = cpfCnpj.replace(/\D/g, '')
  
  if (cpfLimpo.length < 11) {
    throw new Error('CPF/CNPJ deve ter pelo menos 11 dígitos')
  }

  console.log(`📡 [DataJud] Buscando por CPF/CNPJ: ${cpfLimpo} no ${tribunal}`)

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const functionUrl = `${supabaseUrl}/functions/v1/datajud-proxy?tribunal=${tribunal}&cpfCnpj=${encodeURIComponent(cpfLimpo)}`
  
  const response = await fetch(functionUrl, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  const data = await response.json()

  if (!response.ok) {
    console.error('❌ [DataJud] Erro na Edge Function:', data)
    throw new Error(data.error || `Erro ${response.status}`)
  }

  console.log(`✅ [DataJud] ${data?.total || 0} processos encontrados para CPF/CNPJ`)
  
  return {
    processos: data?.processos || [],
    total: data?.total || 0,
  }
}

/**
 * Busca processos por CPF em múltiplos tribunais estaduais
 */
export async function buscarProcessosPorCpfMultiTribunal(
  cpfCnpj: string,
  tribunais: string[] = ['tjsp', 'tjrj', 'tjmg', 'tjrs', 'tjpr', 'tjsc', 'tjba']
): Promise<{
  processos: ProcessoDataJud[]
  total: number
  tribunaisConsultados: string[]
  erros: { tribunal: string; erro: string }[]
}> {
  const cpfLimpo = cpfCnpj.replace(/\D/g, '')
  
  if (cpfLimpo.length < 11) {
    throw new Error('CPF/CNPJ deve ter pelo menos 11 dígitos')
  }

  console.log(`🔍 [DataJud] Buscando CPF/CNPJ ${cpfLimpo} em ${tribunais.length} tribunais...`)

  const resultados: ProcessoDataJud[] = []
  const erros: { tribunal: string; erro: string }[] = []
  const tribunaisConsultados: string[] = []

  for (const tribunal of tribunais) {
    try {
      const resultado = await buscarProcessosPorCpfCnpj(cpfLimpo, tribunal)
      if (resultado.processos.length > 0) {
        resultados.push(...resultado.processos)
        tribunaisConsultados.push(tribunal)
        console.log(`✅ [DataJud] ${tribunal.toUpperCase()}: ${resultado.processos.length} processos`)
      }
    } catch (error) {
      erros.push({ 
        tribunal, 
        erro: error instanceof Error ? error.message : 'Erro desconhecido' 
      })
    }
  }

  console.log(`📊 [DataJud] Total: ${resultados.length} processos em ${tribunaisConsultados.length} tribunais`)

  return {
    processos: resultados,
    total: resultados.length,
    tribunaisConsultados,
    erros,
  }
}

/**
 * Busca avançada com query livre
 */
export async function buscaAvancada(
  queryString: string,
  tribunal: string = 'trf1',
  tamanho: number = 10
): Promise<ResultadoBuscaDataJud> {
  const data = await callDataJud(tribunal, 'avancada', queryString, tamanho)
  
  return {
    processos: data?.hits?.hits?.map((h: any) => h._source) || [],
    total: data?.hits?.total?.value || 0,
  }
}

/**
 * Detecta o tribunal a partir do número do processo (formato CNJ)
 * Formato: NNNNNNN-DD.AAAA.J.TR.OOOO
 * J = Segmento da Justiça, TR = Tribunal/Estado
 */
export function detectarTribunalPorNumero(numeroProcesso: string): {
  tribunal: string | null
  nomeCompleto: string | null
  segmento: string | null
} {
  const numeroLimpo = numeroProcesso.replace(/\D/g, '')

  if (numeroLimpo.length < 16) {
    return { tribunal: null, nomeCompleto: null, segmento: null }
  }

  const justica = numeroLimpo[13]
  const codigoTR = numeroLimpo.substring(14, 16)

  const tribunalId = detectarTribunalId(justica, codigoTR)

  let nomeCompleto: string | null = null
  if (justica === '8') nomeCompleto = NOMES_TJ[codigoTR] || null
  else if (justica === '4') nomeCompleto = NOMES_TRF[codigoTR] || null
  else if (justica === '5') nomeCompleto = NOMES_TRT[codigoTR] || null

  return {
    tribunal: tribunalId,
    nomeCompleto,
    segmento: SEGMENTOS[justica] || null,
  }
}

/**
 * Busca processo automaticamente detectando o tribunal pelo número
 */
export async function buscarProcessoAutomatico(numeroProcesso: string): Promise<{
  sucesso: boolean
  processo?: ProcessoDataJud
  tribunal?: string
  erro?: string
}> {
  const numeroLimpo = numeroProcesso.replace(/\D/g, '')
  
  // Detectar tribunal pelo segmento do número (formato CNJ)
  // Formato: NNNNNNN-DD.AAAA.J.TR.OOOO
  // Posição 13 = J (Justiça): 8=Estadual, 4=Federal, 5=Trabalho, 6=Militar, 7=Eleitoral, 9=Militar Estadual
  // Posição 14-15 = TR (Tribunal/Estado)
  
  let tribunalDetectado: string | null = null

  if (numeroLimpo.length >= 16) {
    const justica = numeroLimpo[13]
    const codigoTR = numeroLimpo.substring(14, 16)

    console.log(`🔍 [DataJud] Detectando tribunal: Justiça=${justica}, TR=${codigoTR}`)

    tribunalDetectado = detectarTribunalId(justica, codigoTR)

    console.log(`🎯 [DataJud] Tribunal detectado: ${tribunalDetectado || 'não identificado'}`)
  }
  
  // Se detectou o tribunal, busca direto nele
  if (tribunalDetectado) {
    try {
      const resultado = await buscarProcessoPorNumero(numeroLimpo, tribunalDetectado)
      if (resultado.processos.length > 0) {
        return {
          sucesso: true,
          processo: resultado.processos[0],
          tribunal: tribunalDetectado,
        }
      }
    } catch (e) {
      console.warn(`⚠️ [DataJud] Erro ao buscar no ${tribunalDetectado}:`, e)
    }
  }
  
  // Fallback: tenta tribunais mais comuns se não encontrou
  const tribunaisFallback = ['tjsp', 'tjrj', 'tjmg', 'trf1', 'trf3', 'trt2', 'trt15']
  
  for (const tribunal of tribunaisFallback) {
    if (tribunal === tribunalDetectado) continue // Já tentou
    try {
      const resultado = await buscarProcessoPorNumero(numeroLimpo, tribunal)
      if (resultado.processos.length > 0) {
        return {
          sucesso: true,
          processo: resultado.processos[0],
          tribunal,
        }
      }
    } catch (e) {
      // Continua para próximo tribunal
    }
  }
  
  return {
    sucesso: false,
    erro: tribunalDetectado 
      ? `Processo não encontrado no ${tribunalDetectado.toUpperCase()}`
      : 'Processo não encontrado. Verifique o número ou selecione o tribunal manualmente.',
  }
}

/**
 * Extrai informações formatadas de um processo
 */
export function extrairInfoProcesso(processo: ProcessoDataJud): {
  numero: string
  classe: string
  assuntos: string[]
  partes: Array<{ nome: string; tipo: string }>
  dataAjuizamento: string
  tribunal: string
  orgaoJulgador: string
  ultimaAtualizacao: string
} {
  const dadosBasicos = processo.dadosBasicos || {}
  
  return {
    numero: processo.numeroProcesso || dadosBasicos.numero || '',
    classe: processo.classe?.nome || dadosBasicos.classeProcessual?.nome || '',
    assuntos: Array.isArray(dadosBasicos.assunto) 
      ? dadosBasicos.assunto.map((a: any) => a.nome || a).filter(Boolean)
      : [processo.assunto].filter(Boolean),
    partes: (dadosBasicos.polo || []).map((p: any) => ({
      nome: p.nome || '',
      tipo: p.polo || p.tipo || '',
    })),
    dataAjuizamento: processo.dataAjuizamento || dadosBasicos.dataAjuizamento || '',
    tribunal: processo.tribunal || '',
    orgaoJulgador: processo.orgaoJulgador?.nome || dadosBasicos.orgaoJulgador?.nome || '',
    ultimaAtualizacao: processo.dataHoraUltimaAtualizacao || processo.dataAtualizacao || '',
  }
}

/**
 * Formata número do processo no padrão CNJ
 */
export function formatarNumeroProcesso(numero: string): string {
  const limpo = numero.replace(/\D/g, '')
  if (limpo.length !== 20) return numero
  
  // Formato: NNNNNNN-DD.AAAA.J.TR.OOOO
  return `${limpo.slice(0, 7)}-${limpo.slice(7, 9)}.${limpo.slice(9, 13)}.${limpo.slice(13, 14)}.${limpo.slice(14, 16)}.${limpo.slice(16, 20)}`
}

/**
 * Verifica se a API DataJud está configurada
 */
export async function isDataJudConfigured(): Promise<boolean> {
  return true // Sempre disponível via Edge Function
}

/**
 * Debug: Verifica estado da autenticação (mantido para compatibilidade)
 */
export async function debugAuthState(): Promise<{
  hasSession: boolean
  user: any
  tokenPreview: string | null
  expiresAt: string | null
  error: string | null
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return {
        hasSession: false,
        user: null,
        tokenPreview: null,
        expiresAt: null,
        error: 'Nenhuma sessão ativa (não necessário para DataJud)',
      }
    }
    
    return {
      hasSession: true,
      user: { id: session.user.id, email: session.user.email },
      tokenPreview: session.access_token?.substring(0, 20) + '...',
      expiresAt: new Date(session.expires_at! * 1000).toLocaleString(),
      error: null,
    }
  } catch (e) {
    return {
      hasSession: false,
      user: null,
      tokenPreview: null,
      expiresAt: null,
      error: String(e),
    }
  }
}
