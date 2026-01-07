/**
 * Serviço de integração com a API Pública DataJud - CNJ
 * Base Nacional de Dados do Poder Judiciário
 */

// Em desenvolvimento, usa o proxy do Vite para evitar CORS
// Em produção, deve usar um backend proxy ou configurar CORS
const DATAJUD_API_URL = import.meta.env.DEV 
  ? '/api-datajud'
  : 'https://api-publica.datajud.cnj.jus.br'
const DATAJUD_API_KEY = import.meta.env.VITE_DATAJUD_API_KEY || ''

export interface ProcessoDataJud {
  numeroProcesso: string
  classe?: string
  assunto?: string
  tribunal: string
  orgaoJulgador?: string
  dataAjuizamento?: string
  dataAtualizacao?: string
  grau?: string
  sistema?: string
  formato?: string
  nivelSigilo?: number
  partes?: Array<{
    nome: string
    tipo: string
    polo?: string
  }>
  movimentacoes?: Array<{
    codigo?: number
    nome?: string
    dataHora?: string
    complemento?: string
  }>
  assuntos?: Array<{
    codigo?: number
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
 * Verifica se a API DataJud está configurada
 */
export function isDataJudConfigured(): boolean {
  return Boolean(DATAJUD_API_KEY && DATAJUD_API_KEY.length > 0)
}

/**
 * Testa a conexão com a API DataJud
 */
export async function testarConexao(): Promise<{
  sucesso: boolean
  mensagem: string
  detalhes?: any
}> {
  if (!isDataJudConfigured()) {
    return {
      sucesso: false,
      mensagem: 'API Key não configurada. Configure em .env',
    }
  }

  try {
    const response = await fetch(`${DATAJUD_API_URL}/api_publica_trf1/_search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `APIKey ${DATAJUD_API_KEY}`,
      },
      body: JSON.stringify({
        size: 1,
        query: {
          match_all: {},
        },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return {
        sucesso: false,
        mensagem: `Erro ${response.status}: ${error.error?.reason || 'Falha na conexão'}`,
        detalhes: error,
      }
    }

    const data = await response.json()
    return {
      sucesso: true,
      mensagem: `Conectado! ${data.hits?.total?.value || 0} processos disponíveis`,
      detalhes: data,
    }
  } catch (error) {
    return {
      sucesso: false,
      mensagem: `Erro de rede: ${error instanceof Error ? error.message : 'Desconhecido'}`,
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
  if (!isDataJudConfigured()) {
    throw new Error('API DataJud não configurada')
  }

  // Remove formatação do número do processo
  const numeroLimpo = numeroProcesso.replace(/\D/g, '')

  const response = await fetch(`${DATAJUD_API_URL}/api_publica_${tribunal}/_search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `APIKey ${DATAJUD_API_KEY}`,
    },
    body: JSON.stringify({
      query: {
        term: {
          numeroProcesso: numeroLimpo,
        },
      },
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.reason || 'Erro ao buscar processo')
  }

  return await response.json()
}

/**
 * Busca processos por nome da parte
 */
export async function buscarProcessosPorParte(
  nomeParte: string,
  tribunal: string = 'trf1',
  tamanho: number = 10
): Promise<ResultadoBuscaDataJud> {
  if (!isDataJudConfigured()) {
    throw new Error('API DataJud não configurada')
  }

  const response = await fetch(`${DATAJUD_API_URL}/api_publica_${tribunal}/_search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `APIKey ${DATAJUD_API_KEY}`,
    },
    body: JSON.stringify({
      size: tamanho,
      query: {
        nested: {
          path: 'dadosBasicos.polo',
          query: {
            match: {
              'dadosBasicos.polo.nome': nomeParte,
            },
          },
        },
      },
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.reason || 'Erro ao buscar processos')
  }

  return await response.json()
}

/**
 * Busca processos por órgão julgador
 */
export async function buscarProcessosPorOrgao(
  orgao: string,
  tribunal: string = 'trf1',
  tamanho: number = 10
): Promise<ResultadoBuscaDataJud> {
  if (!isDataJudConfigured()) {
    throw new Error('API DataJud não configurada')
  }

  const response = await fetch(`${DATAJUD_API_URL}/api_publica_${tribunal}/_search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `APIKey ${DATAJUD_API_KEY}`,
    },
    body: JSON.stringify({
      size: tamanho,
      query: {
        match: {
          'dadosBasicos.orgaoJulgador': orgao,
        },
      },
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.reason || 'Erro ao buscar processos')
  }

  return await response.json()
}

/**
 * Busca processos por classe processual
 */
export async function buscarProcessosPorClasse(
  classe: string,
  tribunal: string = 'trf1',
  tamanho: number = 10
): Promise<ResultadoBuscaDataJud> {
  if (!isDataJudConfigured()) {
    throw new Error('API DataJud não configurada')
  }

  const response = await fetch(`${DATAJUD_API_URL}/api_publica_${tribunal}/_search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `APIKey ${DATAJUD_API_KEY}`,
    },
    body: JSON.stringify({
      size: tamanho,
      query: {
        match: {
          'dadosBasicos.classeProcessual': classe,
        },
      },
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.reason || 'Erro ao buscar processos')
  }

  return await response.json()
}

/**
 * Busca avançada com múltiplos filtros
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
  if (!isDataJudConfigured()) {
    throw new Error('API DataJud não configurada')
  }

  const must: any[] = []

  if (filtros.numeroProcesso) {
    must.push({
      term: {
        numeroProcesso: filtros.numeroProcesso.replace(/\D/g, ''),
      },
    })
  }

  if (filtros.nomeParte) {
    must.push({
      nested: {
        path: 'dadosBasicos.polo',
        query: {
          match: {
            'dadosBasicos.polo.nome': filtros.nomeParte,
          },
        },
      },
    })
  }

  if (filtros.classe) {
    must.push({
      match: {
        'dadosBasicos.classeProcessual': filtros.classe,
      },
    })
  }

  if (filtros.orgao) {
    must.push({
      match: {
        'dadosBasicos.orgaoJulgador': filtros.orgao,
      },
    })
  }

  if (filtros.dataInicio || filtros.dataFim) {
    const range: any = {}
    if (filtros.dataInicio) range.gte = filtros.dataInicio
    if (filtros.dataFim) range.lte = filtros.dataFim

    must.push({
      range: {
        dataAjuizamento: range,
      },
    })
  }

  const response = await fetch(`${DATAJUD_API_URL}/api_publica_${tribunal}/_search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `APIKey ${DATAJUD_API_KEY}`,
    },
    body: JSON.stringify({
      size: tamanho,
      query: {
        bool: {
          must: must.length > 0 ? must : [{ match_all: {} }],
        },
      },
      sort: [{ dataAjuizamento: { order: 'desc' } }],
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.reason || 'Erro ao buscar processos')
  }

  return await response.json()
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
 * Extrai informações básicas do processo
 */
export function extrairInfoProcesso(processo: ProcessoDataJud) {
  return {
    numero: formatarNumeroProcesso(processo.numeroProcesso),
    tribunal: processo.tribunal,
    classe: processo.classe || 'Não informada',
    assunto: processo.assunto || 'Não informado',
    orgao: processo.orgaoJulgador || 'Não informado',
    dataAjuizamento: processo.dataAjuizamento
      ? new Date(processo.dataAjuizamento).toLocaleDateString('pt-BR')
      : 'Não informada',
    partes: processo.partes || [],
    totalMovimentacoes: processo.movimentacoes?.length || 0,
  }
}
