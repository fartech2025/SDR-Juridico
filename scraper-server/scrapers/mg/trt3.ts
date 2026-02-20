// TRT3 — Tribunal Regional do Trabalho da 3ª Região (Minas Gerais)
// Sistema: PJe (Processo Judicial Eletrônico)
// Consulta pública: https://pje.trt3.jus.br/consultaprocessual/
import { load } from 'cheerio'
import {
  BROWSER_HEADERS,
  ScraperProcesso,
  ScraperTribunalResult,
  delay,
  fetchComTimeout,
  limparDocumento,
} from '../../lib/utils'

const TRIBUNAL = 'TRT3'
const PJE_BASE = 'https://pje.trt3.jus.br'

async function buscarViaPjeRest(cpf: string): Promise<ScraperProcesso[]> {
  const cpfLimpo = limparDocumento(cpf)
  const processos: ScraperProcesso[] = []

  // PJe expõe API REST de consulta pública (não documentada oficialmente)
  const endpoints = [
    `${PJE_BASE}/pjekz/processo/lista-processos-por-cpf-cnpj?cpfCnpj=${cpfLimpo}&pagina=1&tamanhoPagina=50`,
    `${PJE_BASE}/pje/rest/processo/pesquisar/v1?cpfCnpj=${cpfLimpo}&pagina=1`,
    `${PJE_BASE}/consultaprocessual/api/processo/cpf/${cpfLimpo}`,
  ]

  for (const url of endpoints) {
    try {
      const res = await fetchComTimeout(url, {
        headers: { ...BROWSER_HEADERS, Accept: 'application/json' },
        timeoutMs: 12_000,
      })

      if (!res.ok) continue

      const contentType = res.headers.get('content-type') ?? ''
      if (!contentType.includes('json')) continue

      const data = await res.json()
      const lista = data?.data ?? data?.processos ?? data?.content ?? (Array.isArray(data) ? data : [])

      for (const proc of lista) {
        processos.push({
          numero_processo: proc.numero ?? proc.numeroProcesso ?? proc.npu ?? '',
          tribunal: TRIBUNAL,
          classe: proc.classeProcessual ?? proc.classe?.descricao ?? proc.classe ?? '',
          assunto: proc.assuntoProcessual ?? proc.assunto ?? '',
          data_ajuizamento: proc.dataAjuizamento ?? proc.dataDistribuicao ?? '',
          grau: proc.grau ?? '',
          fonte: 'trt3-pje-api',
        })
      }

      if (processos.length > 0) break
    } catch {
      continue
    }
    await delay(200)
  }

  return processos
}

async function buscarViaScraping(cpf: string): Promise<ScraperProcesso[]> {
  const cpfLimpo = limparDocumento(cpf)
  const processos: ScraperProcesso[] = []

  // Fallback: scraping da página de consulta pública
  try {
    const res = await fetchComTimeout(
      `${PJE_BASE}/consultaprocessual/pages/consulta/listView.seam?cpfCnpj=${cpfLimpo}`,
      {
        headers: BROWSER_HEADERS,
        timeoutMs: 15_000,
      }
    )

    if (!res.ok) return []

    const html = await res.text()
    const $ = load(html)

    $('tr.rich-table-row, .processo-row, tr[id*="processo"]').each((_, row) => {
      const cols = $(row).find('td')
      if (cols.length < 2) return

      const numero = $(cols[0]).text().trim()
      if (!numero || numero.length < 10) return

      processos.push({
        numero_processo: numero,
        tribunal: TRIBUNAL,
        classe: $(cols[1]).text().trim(),
        assunto: $(cols[2]).text().trim() ?? '',
        data_ajuizamento: $(cols[3]).text().trim() ?? '',
        fonte: 'trt3-scrape',
      })
    })
  } catch {
    // Silenciar
  }

  return processos
}

export async function search(cpf: string): Promise<ScraperTribunalResult> {
  const inicio = Date.now()
  try {
    let processos = await buscarViaPjeRest(cpf)
    if (processos.length === 0) {
      await delay(500)
      processos = await buscarViaScraping(cpf)
    }
    return { tribunal: TRIBUNAL, processos, duracao_ms: Date.now() - inicio }
  } catch (err: any) {
    return {
      tribunal: TRIBUNAL,
      processos: [],
      erro: err?.message ?? 'Erro desconhecido',
      duracao_ms: Date.now() - inicio,
    }
  }
}
