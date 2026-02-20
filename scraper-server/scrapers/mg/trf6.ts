// TRF6 — Tribunal Regional Federal da 6ª Região (Minas Gerais)
// Sistema: e-Proc (EJEF)
// Consulta pública: https://eproc.trf6.jus.br/eprocV2/
import { load } from 'cheerio'
import {
  BROWSER_HEADERS,
  ScraperProcesso,
  ScraperTribunalResult,
  delay,
  fetchComTimeout,
  limparDocumento,
} from '../../lib/utils'

const TRIBUNAL = 'TRF6'
const EPROC_BASE = 'https://eproc.trf6.jus.br'

async function buscarViaEproc(cpf: string): Promise<ScraperProcesso[]> {
  const cpfLimpo = limparDocumento(cpf)
  const processos: ScraperProcesso[] = []

  // e-Proc consulta pública — formulário de pesquisa
  const urls = [
    `${EPROC_BASE}/eprocV2/controlador.php?acao=processo_consulta_publica&cpfCnpj=${cpfLimpo}`,
    `${EPROC_BASE}/eprocV2/controlador.php?acao=consulta_parte_publica&cpfCnpj=${cpfLimpo}`,
  ]

  for (const url of urls) {
    try {
      const res = await fetchComTimeout(url, {
        headers: { ...BROWSER_HEADERS, Referer: `${EPROC_BASE}/eprocV2/` },
        timeoutMs: 15_000,
      })

      if (!res.ok) continue

      const contentType = res.headers.get('content-type') ?? ''

      // Resposta JSON (algumas versões do e-Proc retornam JSON)
      if (contentType.includes('json')) {
        const data = await res.json()
        const lista = data?.processos ?? data?.data ?? []
        for (const p of lista) {
          processos.push({
            numero_processo: p.numero ?? p.numeroProcesso ?? '',
            tribunal: TRIBUNAL,
            classe: p.classe ?? '',
            assunto: p.assunto ?? '',
            data_ajuizamento: p.dataAjuizamento ?? '',
            fonte: 'trf6-eproc-api',
          })
        }
        if (processos.length > 0) return processos
      }

      // Resposta HTML — scraping
      if (contentType.includes('html')) {
        const html = await res.text()
        const $ = load(html)

        // e-Proc lista processos em tabela
        $('table.infraTable tbody tr, tr.infraTrClaro, tr.infraTrEscuro').each((_, row) => {
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
            fonte: 'trf6-eproc-html',
          })
        })

        if (processos.length > 0) return processos
      }
    } catch {
      continue
    }
    await delay(300)
  }

  return processos
}

async function buscarViaJef(cpf: string): Promise<ScraperProcesso[]> {
  // JEF — Juizado Especial Federal (também no TRF6)
  const cpfLimpo = limparDocumento(cpf)

  try {
    const res = await fetchComTimeout(
      `https://jef.trf6.jus.br/consultaprocessual/api/v1/processos?cpf=${cpfLimpo}`,
      {
        headers: { ...BROWSER_HEADERS, Accept: 'application/json' },
        timeoutMs: 10_000,
      }
    )
    if (!res.ok) return []

    const data = await res.json()
    const lista = data?.processos ?? data?.content ?? []
    return lista.map((p: any) => ({
      numero_processo: p.numero ?? '',
      tribunal: TRIBUNAL,
      classe: p.classe ?? 'JEF',
      assunto: p.assunto ?? '',
      data_ajuizamento: p.dataAjuizamento ?? '',
      fonte: 'trf6-jef',
    }))
  } catch {
    return []
  }
}

export async function search(cpf: string): Promise<ScraperTribunalResult> {
  const inicio = Date.now()
  try {
    const [eprocResult, jefResult] = await Promise.allSettled([
      buscarViaEproc(cpf),
      buscarViaJef(cpf),
    ])

    const processos = [
      ...(eprocResult.status === 'fulfilled' ? eprocResult.value : []),
      ...(jefResult.status === 'fulfilled' ? jefResult.value : []),
    ]

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
