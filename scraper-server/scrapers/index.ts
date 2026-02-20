// Orquestrador: chama todos os scrapers em paralelo e agrega resultados
import { ScraperProcesso, ScraperResult, ScraperTribunalResult, deduplicar, limparDocumento } from '../lib/utils'
import { get, set } from '../lib/cache'

// Importar todos os scrapers
import { search as searchTjmg } from './mg/tjmg'
import { search as searchTrt3 } from './mg/trt3'
import { search as searchTrf6 } from './mg/trf6'
import { search as searchTjsp } from './sp/tjsp'
import { search as searchTjrj } from './rj/tjrj'
import { search as searchStj } from './federal/stj'
import { search as searchTst } from './federal/tst'
import { searchByCpf as searchDataJud } from './datajud'

// Lista de scrapers — MG primeiro (maior prioridade)
const SCRAPERS: Array<{ nome: string; fn: (cpf: string) => Promise<ScraperTribunalResult> }> = [
  { nome: 'TJMG', fn: searchTjmg },
  { nome: 'TRT3', fn: searchTrt3 },
  { nome: 'TRF6', fn: searchTrf6 },
  { nome: 'TJSP', fn: searchTjsp },
  { nome: 'TJRJ', fn: searchTjrj },
  { nome: 'STJ', fn: searchStj },
  { nome: 'TST', fn: searchTst },
  { nome: 'DataJud', fn: searchDataJud },
]

export async function searchByCpf(cpf: string): Promise<ScraperResult> {
  const cpfLimpo = limparDocumento(cpf)
  const cacheKey = `cpf_${cpfLimpo}`

  // Verificar cache (TTL 6h)
  const cached = get<ScraperResult>(cacheKey)
  if (cached) {
    return { ...cached, gerado_em: cached.gerado_em + ' (cache)' }
  }

  // Executar todos os scrapers em paralelo
  const resultadosBrutos = await Promise.allSettled(
    SCRAPERS.map(({ fn }) => fn(cpfLimpo))
  )

  const tribunaisResult: ScraperTribunalResult[] = []
  const todosProcessos: ScraperProcesso[] = []

  resultadosBrutos.forEach((resultado, idx) => {
    if (resultado.status === 'fulfilled') {
      tribunaisResult.push(resultado.value)
      todosProcessos.push(...resultado.value.processos)
    } else {
      tribunaisResult.push({
        tribunal: SCRAPERS[idx].nome,
        processos: [],
        erro: resultado.reason?.message ?? 'Erro desconhecido',
        duracao_ms: 0,
      })
    }
  })

  // Deduplicar por número de processo
  const processosUnicos = deduplicar(todosProcessos)

  const resultado: ScraperResult = {
    cpf: cpfLimpo,
    processos: processosUnicos,
    tribunais: tribunaisResult,
    total: processosUnicos.length,
    gerado_em: new Date().toISOString(),
  }

  // Salvar no cache
  set(cacheKey, resultado)

  return resultado
}
