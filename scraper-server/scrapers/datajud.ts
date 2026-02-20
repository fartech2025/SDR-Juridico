// DataJud direto — sem precisar do proxy Supabase
// Chave pública do CNJ (rotacionada periodicamente no datajud-wiki.cnj.jus.br)
import { BROWSER_HEADERS, ScraperProcesso, ScraperTribunalResult, limparDocumento } from '../lib/utils'

const DATAJUD_KEY = 'cDZHYzlZa0JadVREZDJCendFbGFscU03NnJoaVNDVi0'
const BASE = 'https://api-publica.datajud.cnj.jus.br'

// Tribunais a consultar por CPF via DataJud
const TRIBUNAIS_CPF = [
  'tjmg', 'tjsp', 'tjrj', 'tjrs', 'tjpr', 'tjsc', 'tjba',
  'trf1', 'trf2', 'trf3', 'trf4', 'trf5', 'trf6',
  'trt3', 'trt2', 'trt4', 'trt15',
  'stj', 'tst',
]

async function buscarEmTribunal(cpf: string, tribunal: string): Promise<ScraperProcesso[]> {
  const cpfLimpo = limparDocumento(cpf)
  const url = `${BASE}/api_publica_${tribunal}/_search`

  const body = {
    query: {
      bool: {
        should: [
          { match: { 'partes.documento': cpfLimpo } },
          { match: { 'documento': cpfLimpo } },
        ],
        minimum_should_match: 1,
      },
    },
    size: 30,
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      ...BROWSER_HEADERS,
      Authorization: `APIKey ${DATAJUD_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
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
      fonte: `datajud-${tribunal}`,
    } as ScraperProcesso
  })
}

export async function searchByCpf(cpf: string): Promise<ScraperTribunalResult> {
  const inicio = Date.now()
  const resultados: ScraperProcesso[] = []
  const erros: string[] = []

  // Buscar em paralelo com Promise.allSettled
  const resultsPorTribunal = await Promise.allSettled(
    TRIBUNAIS_CPF.map((t) => buscarEmTribunal(cpf, t))
  )

  resultsPorTribunal.forEach((result, idx) => {
    if (result.status === 'fulfilled') {
      resultados.push(...result.value)
    } else {
      erros.push(`${TRIBUNAIS_CPF[idx]}: ${result.reason?.message ?? 'erro'}`)
    }
  })

  return {
    tribunal: 'DataJud (CNJ)',
    processos: resultados,
    erro: erros.length > 0 ? erros.join('; ') : undefined,
    duracao_ms: Date.now() - inicio,
  }
}
