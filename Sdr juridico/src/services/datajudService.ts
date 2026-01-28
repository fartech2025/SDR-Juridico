/**
 * Serviço de integração com a API Pública DataJud - CNJ
 * Base Nacional de Dados do Poder Judiciário
 * 
 * SEGURANÇA: Este serviço chama um proxy via Supabase Edge Function
 * que realiza a autenticação e validação do usuário antes de chamar DataJud.
 * Isso evita expor a API key do DataJud no frontend.
 */

import { supabase } from '@/lib/supabaseClient'

const DATAJUD_PROXY_FUNCTION = 'datajud-proxy'

export interface ProcessoDataJud {
  numeroProcesso?: string
  classe?: any
  assunto?: string
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
  '@timestamp'?: string
  // Estrutura real da API DataJud
  dadosBasicos?: {
    numero?: string
    classeProcessual?: any
    assunto?: any
    orgaoJulgador?: any
    dataAjuizamento?: string
    procEl?: string
    grau?: string
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
    complementosTabelados?: Array<{
      codigo?: number
      nome?: string
      descricao?: string
      valor?: number
    }>
  }>
  assuntos?: Array<{
    codigo?: number
    codigoNacional?: number
    nome?: string
  }>
}

export interface ResultadoBuscaDataJud {
  took: number
  timed_out: boolean
  hits: {
    total: {
      value: number
      relation: string
    }
    max_score: number | null
    hits: Array<{
      _index: string
      _id: string
      _score: number | null
      _source: ProcessoDataJud
    }>
  }
}

export interface ConfiguracaoDataJud {
  apiKey: string
  conectado: boolean
  ultimaVerificacao?: string
}

/**
 * Verifica se a API DataJud está configurada (via proxy)
 */
export async function isDataJudConfigured(): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession()
    return Boolean(data?.session?.user?.id)
  } catch {
    return false
  }
}

/**
 * Testa a conexão com a API DataJud via proxy
 */
export async function testarConexao(): Promise<{
  sucesso: boolean
  mensagem: string
  detalhes?: any
}> {
  try {
    // Teste simples: chamar o proxy com uma busca válida
    const { data, error } = await supabase.functions.invoke(DATAJUD_PROXY_FUNCTION, {
      body: {
        searchType: 'numero_processo',
        tribunal: 'trf1',
        query: '0000001', // Número fixo para teste
        size: 1,
      },
    })

    if (error) {
      return {
        sucesso: false,
        mensagem: `Erro: ${error.message}`,
      }
    }

    return {
      sucesso: true,
      mensagem: `Proxy conectado! ${data?.hits?.total?.value || 0} processos disponíveis`,
      detalhes: data,
    }
  } catch (error) {
    return {
      sucesso: false,
      mensagem: `Erro de conexão: ${error instanceof Error ? error.message : 'Desconhecido'}`,
    }
  }
}

/**
 * Busca processo por número via proxy seguro
 */
export async function buscarProcessoPorNumero(
  numeroProcesso: string,
  tribunal: string = 'trf1'
): Promise<ResultadoBuscaDataJud> {
  // Remove formatação do número do processo
  const numeroLimpo = numeroProcesso.replace(/\D/g, '')

  const { data, error } = await supabase.functions.invoke(DATAJUD_PROXY_FUNCTION, {
    body: {
      searchType: 'numero_processo',
      tribunal,
      query: numeroLimpo,
    },
  })

  if (error) {
    throw new Error(`Erro ao buscar processo: ${error.message}`)
  }

  return data
}

/**
 * Busca processos por nome da parte via proxy seguro
 */
export async function buscarProcessosPorParte(
  nomeParte: string,
  tribunal: string = 'trf1',
  tamanho: number = 10
): Promise<ResultadoBuscaDataJud> {
  const { data, error } = await supabase.functions.invoke(DATAJUD_PROXY_FUNCTION, {
    body: {
      searchType: 'parte',
      tribunal,
      query: nomeParte,
      size: tamanho,
    },
  })

  if (error) {
    throw new Error(`Erro ao buscar processos: ${error.message}`)
  }

  return data
}

/**
 * Busca processos por órgão julgador via proxy seguro
 */
export async function buscarProcessosPorOrgao(
  orgao: string,
  tribunal: string = 'trf1',
  tamanho: number = 10
): Promise<ResultadoBuscaDataJud> {
  const { data, error } = await supabase.functions.invoke(DATAJUD_PROXY_FUNCTION, {
    body: {
      searchType: 'parte', // DataJud não tem busca por órgão direto, usar busca de parte
      tribunal,
      query: orgao,
      size: tamanho,
    },
  })

  if (error) {
    throw new Error(`Erro ao buscar processos: ${error.message}`)
  }

  return data
}

/**
 * Busca processos por classe processual via proxy seguro
 */
export async function buscarProcessosPorClasse(
  classe: string,
  tribunal: string = 'trf1',
  tamanho: number = 10
): Promise<ResultadoBuscaDataJud> {
  const { data, error } = await supabase.functions.invoke(DATAJUD_PROXY_FUNCTION, {
    body: {
      searchType: 'parte', // DataJud busca por parte como fallback
      tribunal,
      query: classe,
      size: tamanho,
    },
  })

  if (error) {
    throw new Error(`Erro ao buscar processos: ${error.message}`)
  }

  return data
}

/**
 * Busca avançada com múltiplos filtros via proxy seguro
 */
export async function buscaAvancada(
  filtros: {
    numeroProcesso?: string
    nomeParte?: string
    classe?: string
    orgao?: string
    dataInicio?: string
    dataFim?: string
  },
  tribunal: string = 'trf1',
  tamanho: number = 10
): Promise<ResultadoBuscaDataJud> {
  // Use número de processo se fornecido, senão use nome da parte
  const searchType = filtros.numeroProcesso ? 'numero_processo' : 'parte'
  const query = filtros.numeroProcesso || filtros.nomeParte || ''

  if (!query) {
    throw new Error('Informe número do processo ou nome da parte')
  }

  const { data, error } = await supabase.functions.invoke(DATAJUD_PROXY_FUNCTION, {
    body: {
      searchType,
      tribunal,
      query,
      size: tamanho,
    },
  })

  if (error) {
    throw new Error(`Erro ao buscar processos: ${error.message}`)
  }

  return data
}

/**
 * Formata número do processo para exibição
 */
export function formatarNumeroProcesso(numero: string): string {
  const limpo = numero.replace(/\D/g, '')
  if (limpo.length !== 20) return numero

  // Formato: NNNNNNN-DD.AAAA.J.TR.OOOO
  return `${limpo.slice(0, 7)}-${limpo.slice(7, 9)}.${limpo.slice(9, 13)}.${limpo.slice(13, 14)}.${limpo.slice(14, 16)}.${limpo.slice(16, 20)}`
}
/**
 * Detecta o tribunal pelo número do processo (segmento TR)
 */
export function detectarTribunal(numeroProcesso: string): string | null {
  const limpo = numeroProcesso.replace(/\D/g, '')
  if (limpo.length !== 20) return null

  const segmentoTR = limpo.slice(13, 16) // JTR
  const justica = segmentoTR[0]
  const tribunal = segmentoTR.slice(1)

  // Justiça Federal (4)
  if (justica === '4') {
    return `trf${tribunal}`
  }

  // Justiça do Trabalho (5)
  if (justica === '5') {
    return `trt${tribunal}`
  }

  // Justiça Eleitoral (6)
  if (justica === '6') {
    const estadoCodigo = limpo.slice(14, 16)
    const mapa: Record<string, string> = {
      '01': 'ac', '02': 'al', '03': 'ap', '04': 'am', '05': 'ba',
      '06': 'ce', '07': 'df', '08': 'es', '09': 'go', '10': 'ma',
      '11': 'mt', '12': 'ms', '13': 'mg', '14': 'pa', '15': 'pb',
      '16': 'pr', '17': 'pe', '18': 'pi', '19': 'rj', '20': 'rn',
      '21': 'rs', '22': 'ro', '23': 'rr', '24': 'sc', '25': 'se',
      '26': 'sp', '27': 'to', '53': 'dft'
    }
    return mapa[estadoCodigo] ? `tre-${mapa[estadoCodigo]}` : null
  }

  // Justiça Militar Estadual (7)
  if (justica === '7') {
    const estadoCodigo = limpo.slice(14, 16)
    if (estadoCodigo === '13') return 'tjmmg'
    if (estadoCodigo === '21') return 'tjmrs'
    if (estadoCodigo === '26') return 'tjmsp'
    return null
  }

  // Justiça Estadual (8)
  if (justica === '8') {
    const estadoCodigo = limpo.slice(14, 16)
    const mapa: Record<string, string> = {
      '01': 'tjac', '02': 'tjal', '03': 'tjap', '04': 'tjam', '05': 'tjba',
      '06': 'tjce', '07': 'tjdft', '08': 'tjes', '09': 'tjgo', '10': 'tjma',
      '11': 'tjmt', '12': 'tjms', '13': 'tjmg', '14': 'tjpa', '15': 'tjpb',
      '16': 'tjpr', '17': 'tjpe', '18': 'tjpi', '19': 'tjrj', '20': 'tjrn',
      '21': 'tjrs', '22': 'tjro', '23': 'tjrr', '24': 'tjsc', '25': 'tjse',
      '26': 'tjsp', '27': 'tjto', '53': 'tjdft'
    }
    return mapa[estadoCodigo] || null
  }

  // Tribunais Superiores (3)
  if (justica === '3') {
    if (tribunal === '00') return 'stj'
    if (tribunal === '01') return 'tst'
    if (tribunal === '02') return 'tse'
    if (tribunal === '03') return 'stm'
  }

  return null
}

/**
 * Busca processo automaticamente detectando o tribunal pelo número
 */
export async function buscarProcessoAutomatico(
  numeroProcesso: string
): Promise<{
  sucesso: boolean
  tribunal?: string
  processo?: ProcessoDataJud
  erro?: string
}> {
  const tribunalDetectado = detectarTribunal(numeroProcesso)

  if (!tribunalDetectado) {
    return {
      sucesso: false,
      erro: 'Não foi possível detectar o tribunal pelo número do processo',
    }
  }

  try {
    const resultado = await buscarProcessoPorNumero(numeroProcesso, tribunalDetectado)
    
    if (resultado.hits.total.value > 0) {
      return {
        sucesso: true,
        tribunal: tribunalDetectado,
        processo: resultado.hits.hits[0]._source,
      }
    }

    return {
      sucesso: false,
      tribunal: tribunalDetectado,
      erro: 'Processo não encontrado na base DataJud',
    }
  } catch (error) {
    return {
      sucesso: false,
      tribunal: tribunalDetectado,
      erro: error instanceof Error ? error.message : 'Erro ao buscar processo',
    }
  }
}
/**
 * Extrai informações básicas do processo
 */
export function extrairInfoProcesso(processo: ProcessoDataJud) {
  // Converter data do formato YYYYMMDDHHmmss para Date
  const parseDataAjuizamento = (data: string | undefined): string => {
    if (!data) return 'Não informada'
    // Formato: YYYYMMDDHHmmss (ex: 20251111042431)
    if (data.length === 14) {
      const ano = data.substring(0, 4)
      const mes = data.substring(4, 6)
      const dia = data.substring(6, 8)
      return `${dia}/${mes}/${ano}`
    }
    // Tenta parsear como ISO date
    try {
      return new Date(data).toLocaleDateString('pt-BR')
    } catch {
      return data
    }
  }
  
  return {
    numero: processo.numeroProcesso || '',
    tribunal: processo.tribunal || 'Não informado',
    classe: processo.classe || 'Não informada',
    assunto: processo.assuntos?.[0] || processo.assunto || 'Não informado',
    orgao: processo.orgaoJulgador || 'Não informado',
    dataAjuizamento: parseDataAjuizamento(processo.dataAjuizamento),
    partes: processo.dadosBasicos?.polo || [],
    totalMovimentacoes: processo.movimentos?.length || 0,
  }
}
