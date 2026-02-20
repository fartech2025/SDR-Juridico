// TJRJ — Tribunal de Justiça do Rio de Janeiro
// Sistema: PROJUDI / consulta pública própria
// Consulta pública: https://www3.tjrj.jus.br/consultaprocessual/
import { load } from 'cheerio'
import {
  BROWSER_HEADERS,
  ScraperProcesso,
  ScraperTribunalResult,
  delay,
  fetchComTimeout,
  limparDocumento,
} from '../../lib/utils'

const TRIBUNAL = 'TJRJ'

async function buscarProcessos(cpf: string): Promise<ScraperProcesso[]> {
  const cpfLimpo = limparDocumento(cpf)
  const processos: ScraperProcesso[] = []

  const urls = [
    `https://www3.tjrj.jus.br/consultaprocessual/pages/consultaProcesso/consultaProcesso.jsf?cpfCnpj=${cpfLimpo}`,
    `https://www4.tjrj.jus.br/numeracaoUnica/faces/index.jsp?numeracao=${cpfLimpo}`,
  ]

  for (const url of urls) {
    try {
      const res = await fetchComTimeout(url, {
        headers: { ...BROWSER_HEADERS, Referer: 'https://www3.tjrj.jus.br/' },
        timeoutMs: 15_000,
      })

      if (!res.ok) continue

      const html = await res.text()
      const $ = load(html)

      $('table.rich-table tbody tr, tr.resultadoBusca').each((_, row) => {
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
          fonte: 'tjrj',
        })
      })

      if (processos.length > 0) break
    } catch {
      continue
    }
    await delay(300)
  }

  return processos
}

export async function search(cpf: string): Promise<ScraperTribunalResult> {
  const inicio = Date.now()
  try {
    const processos = await buscarProcessos(cpf)
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
