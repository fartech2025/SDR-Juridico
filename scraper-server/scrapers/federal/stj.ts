// STJ — Superior Tribunal de Justiça
// Consulta pública: https://processo.stj.jus.br/SCON/
import { load } from 'cheerio'
import {
  BROWSER_HEADERS,
  ScraperProcesso,
  ScraperTribunalResult,
  fetchComTimeout,
  limparDocumento,
} from '../../lib/utils'

const TRIBUNAL = 'STJ'

async function buscarViaApi(cpf: string): Promise<ScraperProcesso[]> {
  const cpfLimpo = limparDocumento(cpf)

  // STJ tem API pública para consulta de processos
  const urls = [
    `https://processo.stj.jus.br/SCON/pesquisar.jsp?tipo_visualizacao=&b=ACOR&livre=cpf%3D${cpfLimpo}`,
    `https://wws.stj.jus.br/processo/pesquisa/?src=1.1.3&aplicacao=processos.ea&tipoPesquisa=tipoPesquisaNumeroRegistro&termo=${cpfLimpo}`,
    `https://api.stj.jus.br/pje/rest/consulta/processo/cpf/${cpfLimpo}`,
  ]

  for (const url of urls) {
    try {
      const res = await fetchComTimeout(url, {
        headers: { ...BROWSER_HEADERS, Accept: 'application/json, text/html' },
        timeoutMs: 12_000,
      })

      if (!res.ok) continue

      const contentType = res.headers.get('content-type') ?? ''

      if (contentType.includes('json')) {
        const data = await res.json()
        const lista = data?.processos ?? data?.content ?? (Array.isArray(data) ? data : [])
        if (lista.length > 0) {
          return lista.map((p: any) => ({
            numero_processo: p.numero ?? p.numeroProcesso ?? '',
            tribunal: TRIBUNAL,
            classe: p.classe ?? p.classeProcessual ?? '',
            assunto: p.assunto ?? '',
            data_ajuizamento: p.dataAjuizamento ?? '',
            fonte: 'stj-api',
          }))
        }
      }

      if (contentType.includes('html')) {
        const html = await res.text()
        const $ = load(html)
        const processos: ScraperProcesso[] = []

        $('table.resultados tr, .processo-item').each((_, row) => {
          const numero = $(row).find('a, .numero').first().text().trim()
          if (!numero || numero.length < 5) return
          processos.push({
            numero_processo: numero,
            tribunal: TRIBUNAL,
            classe: $(row).find('td').eq(1).text().trim(),
            assunto: $(row).find('td').eq(2).text().trim(),
            fonte: 'stj-html',
          })
        })

        if (processos.length > 0) return processos
      }
    } catch {
      continue
    }
  }

  return []
}

export async function search(cpf: string): Promise<ScraperTribunalResult> {
  const inicio = Date.now()
  try {
    const processos = await buscarViaApi(cpf)
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
