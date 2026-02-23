// DataJud direto — sem precisar do proxy Supabase
// Chave pública do CNJ — rotacionada periodicamente.
// Fonte atual: https://datajud-wiki.cnj.jus.br/api-publica/acesso/
import { BROWSER_HEADERS, ScraperProcesso, ScraperTribunalResult, limparDocumento } from '../lib/utils'

const DATAJUD_KEY = process.env.DATAJUD_API_KEY
  ?? 'cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw=='

const BASE = 'https://api-publica.datajud.cnj.jus.br'

// Tribunais consultados na busca por CPF
const TRIBUNAIS_CPF = [
  'tjmg', 'tjsp', 'tjrj', 'tjrs', 'tjpr', 'tjsc', 'tjba',
  'trf1', 'trf2', 'trf3', 'trf4', 'trf5', 'trf6',
  'trt3', 'trt2', 'trt4', 'trt15',
  'stj', 'tst',
]

// Tribunais consultados na busca por nome (subconjunto — evitar timeout)
const TRIBUNAIS_NOME = [
  'tjmg', 'trf6', 'tjsp', 'tjrj', 'tjrs', 'tjpr', 'tjsc',
  'trt3', 'trt2', 'trt15', 'stj', 'tst',
]


async function buscarEmTribunal(
  query: Record<string, any>,
  tribunal: string,
  fonte: string,
): Promise<ScraperProcesso[]> {
  const url = `${BASE}/api_publica_${tribunal}/_search`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      ...BROWSER_HEADERS,
      Authorization: `APIKey ${DATAJUD_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, size: 30 }),
    signal: AbortSignal.timeout(10_000),
  })

  if (!res.ok) return []

  const data = await res.json()
  const hits = data?.hits?.hits ?? []

  return hits.map((hit: any) => {
    const src = hit._source ?? {}
    return {
      numero_processo: src.numeroProcesso ?? src.numero ?? '',
      tribunal: tribunal.toUpperCase(),
      classe: src.classe?.nome ?? src.classeProcessual ?? '',
      assunto: src.assunto ?? src.assuntos?.[0]?.nome ?? '',
      data_ajuizamento: src.dataAjuizamento ?? '',
      ultima_atualizacao: src.dataHoraUltimaAtualizacao ?? src.dataAtualizacao ?? '',
      valor_causa: src.valorCausa ?? null,
      grau: src.grau ?? '',
      partes: (src.partes ?? []).map((p: any) => ({
        nome: p.nome ?? '',
        polo: p.polo === 'ATIVO' ? 'ativo' : p.polo === 'PASSIVO' ? 'passivo' : 'outro',
      })),
      movimentos: (src.movimentos ?? []).slice(0, 5).map((m: any) => ({
        data: m.dataHora ?? '',
        descricao: m.nome ?? m.complemento ?? '',
      })),
      fonte: `datajud-${fonte}-${tribunal}`,
    } as ScraperProcesso
  })
}

/** Busca por CPF nos principais tribunais */
export async function searchByCpf(cpf: string): Promise<ScraperTribunalResult> {
  const inicio = Date.now()
  const cpfLimpo = limparDocumento(cpf)
  const erros: string[] = []

  // NOTA: o campo `partes` NÃO é exposto na API pública do DataJud (LGPD/CNJ).
  // As queries abaixo ficam aqui para o caso de o CNJ liberar o campo futuramente.
  // Na prática, essa busca retorna 0 resultados para qualquer tribunal.
  const query = {
    bool: {
      should: [
        { match: { 'partes.cpf': cpfLimpo } },
        { match: { 'partes.documento': cpfLimpo } },
      ],
      minimum_should_match: 1,
    },
  }

  const settled = await Promise.allSettled(
    TRIBUNAIS_CPF.map((t) => buscarEmTribunal(query, t, 'cpf'))
  )

  const processos: ScraperProcesso[] = []
  settled.forEach((r, idx) => {
    if (r.status === 'fulfilled') processos.push(...r.value)
    else erros.push(`${TRIBUNAIS_CPF[idx]}: ${r.reason?.message ?? 'erro'}`)
  })

  return {
    tribunal: 'DataJud (CNJ)',
    processos,
    erro: erros.length > 0 ? erros.join('; ') : undefined,
    duracao_ms: Date.now() - inicio,
  }
}

/** Busca por nome da parte nos tribunais prioritários.
 * LIMITAÇÃO: o DataJud público não expõe o campo `partes` (LGPD/CNJ).
 * Mantido aqui para uso futuro com APIs alternativas (ex: Escavador).
 */
export async function searchByNome(nome: string): Promise<ScraperTribunalResult> {
  const inicio = Date.now()
  const erros: string[] = []

  const query = { match: { 'partes.nome': nome } }

  const settled = await Promise.allSettled(
    TRIBUNAIS_NOME.map((t) => buscarEmTribunal(query, t, 'nome'))
  )

  const processos: ScraperProcesso[] = []
  settled.forEach((r, idx) => {
    if (r.status === 'fulfilled') processos.push(...r.value)
    else erros.push(`${TRIBUNAIS_NOME[idx]}: ${r.reason?.message ?? 'erro'}`)
  })

  return {
    tribunal: 'DataJud por Nome',
    processos,
    erro: erros.length > 0 ? erros.join('; ') : undefined,
    duracao_ms: Date.now() - inicio,
  }
}

/**
 * Detecta o tribunal a partir do número CNJ e busca o processo.
 * Esta é a única busca que funciona de forma confiável no DataJud público.
 * Formato CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO
 */
export async function buscarPorNumero(
  numero: string,
): Promise<ScraperProcesso | null> {
  const limpo = numero.replace(/\D/g, '')
  if (limpo.length < 16) return null

  // Detectar tribunal pelo segmento e região
  const segmento = limpo[13]
  const codigoTR = limpo.substring(14, 16)

  const mapTJ: Record<string, string> = {
    '01': 'tjac', '02': 'tjal', '03': 'tjap', '04': 'tjam', '05': 'tjba',
    '06': 'tjce', '07': 'tjdft', '08': 'tjes', '09': 'tjgo', '10': 'tjma',
    '11': 'tjmt', '12': 'tjms', '13': 'tjmg', '14': 'tjpa', '15': 'tjpb',
    '16': 'tjpe', '17': 'tjpi', '18': 'tjpr', '19': 'tjrj', '20': 'tjrn',
    '21': 'tjrs', '22': 'tjro', '23': 'tjrr', '24': 'tjsc', '25': 'tjsp',
    '26': 'tjse', '27': 'tjto',
  }
  const mapTRF: Record<string, string> = {
    '01': 'trf1', '02': 'trf2', '03': 'trf3', '04': 'trf4', '05': 'trf5', '06': 'trf6',
  }
  const mapTRT: Record<string, string> = {
    '01': 'trt1', '02': 'trt2', '03': 'trt3', '04': 'trt4', '05': 'trt5',
    '06': 'trt6', '07': 'trt7', '08': 'trt8', '09': 'trt9', '10': 'trt10',
    '11': 'trt11', '12': 'trt12', '13': 'trt13', '14': 'trt14', '15': 'trt15',
    '16': 'trt16', '17': 'trt17', '18': 'trt18', '19': 'trt19', '20': 'trt20',
    '21': 'trt21', '22': 'trt22', '23': 'trt23', '24': 'trt24',
  }

  let tribunal: string | null = null
  if (segmento === '8') tribunal = mapTJ[codigoTR] ?? null
  else if (segmento === '4') tribunal = mapTRF[codigoTR] ?? null
  else if (segmento === '5') tribunal = mapTRT[codigoTR] ?? null
  else if (segmento === '3') tribunal = 'stj'
  else if (segmento === '1') tribunal = 'stf'

  const tribunaisParaTentar = tribunal
    ? [tribunal, 'tjmg', 'tjsp', 'trf6']
    : ['tjmg', 'tjsp', 'trf6', 'stj']

  const query = { match: { numeroProcesso: limpo } }

  for (const t of tribunaisParaTentar) {
    const resultados = await buscarEmTribunal(query, t, 'numero').catch(() => [])
    if (resultados.length > 0) return resultados[0]
  }

  return null
}

/**
 * Busca processos por número de OAB + UF.
 * Tenta múltiplos campos onde o DataJud pode ter indexado informações de advogados.
 * NOTA: o campo partes/advogados pode estar bloqueado por LGPD — retorna 0 se bloqueado.
 */
export async function buscarPorOAB(
  oab: string,
  uf: string,
  tribunais: string[] = TRIBUNAIS_CPF,
): Promise<ScraperProcesso[]> {
  const numero = oab.replace(/\D/g, '')
  const ufUp   = uf.toUpperCase()

  // Tenta campos conhecidos do DataJud onde OAB pode estar indexada
  const query = {
    bool: {
      should: [
        { match: { 'representanteAdvogado.inscricaoOAB': `${numero}/${ufUp}` } },
        { match: { 'advogados.inscricaoOAB': numero } },
        { match: { 'advogados.numeroOAB': numero } },
        {
          nested: {
            path: 'dadosBasicos.polo',
            query: {
              nested: {
                path: 'dadosBasicos.polo.parte',
                query: {
                  nested: {
                    path: 'dadosBasicos.polo.parte.representanteAdvogado',
                    query: {
                      term: { 'dadosBasicos.polo.parte.representanteAdvogado.numeroOAB': numero },
                    },
                  },
                },
              },
            },
          },
        },
      ],
      minimum_should_match: 1,
    },
  }

  const settled = await Promise.allSettled(
    tribunais.map((t) => buscarEmTribunal(query, t, 'oab'))
  )

  const processos: ScraperProcesso[] = []
  for (const r of settled) {
    if (r.status === 'fulfilled') processos.push(...r.value)
  }
  return processos
}

/**
 * Verificação rápida: CPF → nome da parte via DataJud.
 * LIMITAÇÃO ATUAL: o DataJud público não expõe `partes` (LGPD/CNJ) —
 * sempre retorna { nome: null, processos: [] }.
 * Mantido como ponto de integração futura (ex: Escavador API).
 */
export async function quickCpfCheck(
  _cpf: string,
): Promise<{ nome: string | null; processos: ScraperProcesso[] }> {
  // DataJud não expõe partes na API pública — busca seria sempre vazia.
  return { nome: null, processos: [] }
}
