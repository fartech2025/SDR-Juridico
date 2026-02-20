// TJMG — Tribunal de Justiça de Minas Gerais
// Sistema: SISCOM (SAJ5)
// Consulta pública: https://www.tjmg.jus.br/portal-tjmg/processos/
import { load } from 'cheerio'
import {
  BROWSER_HEADERS,
  ScraperProcesso,
  ScraperTribunalResult,
  delay,
  fetchComTimeout,
  limparDocumento,
} from '../../lib/utils'

const TRIBUNAL = 'TJMG'

// TJMG usa o SAJ5 — endpoint de consulta pública por CPF
const BASE_URL = 'https://www5.tjmg.jus.br'

async function buscarProcessosByCpf(cpf: string): Promise<ScraperProcesso[]> {
  const cpfFormatado = limparDocumento(cpf)
  const processos: ScraperProcesso[] = []

  // Endpoint 1: consulta por CPF/CNPJ na interface SAJ
  const searchUrl = `${BASE_URL}/jurisprudencia/pesquisarProcesso.do`
  const params = new URLSearchParams({
    cbPesquisa: 'NUMDOC',
    dadosConsulta: cpfFormatado,
    tipoConsulta: 'NUMDOC',
  })

  try {
    const res = await fetchComTimeout(`${searchUrl}?${params}`, {
      headers: { ...BROWSER_HEADERS, Referer: 'https://www5.tjmg.jus.br/' },
      timeoutMs: 15_000,
    })

    if (!res.ok) return []

    const html = await res.text()
    const $ = load(html)

    // Processos listados em tabela
    $('table.resultTable tr, table tr.resultadoPesquisa').each((_, row) => {
      const cols = $(row).find('td')
      if (cols.length < 3) return

      const numero = $(cols[0]).text().trim()
      if (!numero || numero.length < 5) return

      processos.push({
        numero_processo: numero,
        tribunal: TRIBUNAL,
        classe: $(cols[1]).text().trim(),
        assunto: $(cols[2]).text().trim(),
        data_ajuizamento: $(cols[3]).text().trim(),
        fonte: 'tjmg-saj',
      })
    })
  } catch {
    // Silenciar — retornar vazio se offline
  }

  await delay(300)

  // Endpoint 2: Consulta via portal moderno do TJMG
  try {
    const portalUrl = 'https://www.tjmg.jus.br/portal-tjmg/processos/pesquisar-processo-civel-e-criminal.htm'
    const formData = new URLSearchParams({
      'comarcaTJMG': '',
      'numeroProcesso': '',
      'cpfCnpj': cpfFormatado,
      'pesquisarPor': 'cpfCnpj',
    })

    const res2 = await fetchComTimeout(portalUrl, {
      method: 'POST',
      headers: {
        ...BROWSER_HEADERS,
        'Content-Type': 'application/x-www-form-urlencoded',
        Referer: 'https://www.tjmg.jus.br/',
      },
      body: formData.toString(),
      timeoutMs: 15_000,
    })

    if (res2.ok) {
      const html2 = await res2.text()
      const $2 = load(html2)

      $2('.processo-item, .resultado-processo, tr[data-numero]').each((_, el) => {
        const numero = $2(el).attr('data-numero') ?? $2(el).find('.numero-processo').text().trim()
        if (!numero || numero.length < 5) return

        const existing = processos.find((p) => p.numero_processo === numero)
        if (!existing) {
          processos.push({
            numero_processo: numero,
            tribunal: TRIBUNAL,
            classe: $2(el).find('.classe').text().trim(),
            assunto: $2(el).find('.assunto').text().trim(),
            data_ajuizamento: $2(el).find('.data').text().trim(),
            fonte: 'tjmg-portal',
          })
        }
      })
    }
  } catch {
    // Silenciar
  }

  return processos
}

export async function search(cpf: string): Promise<ScraperTribunalResult> {
  const inicio = Date.now()
  try {
    const processos = await buscarProcessosByCpf(cpf)
    return {
      tribunal: TRIBUNAL,
      processos,
      duracao_ms: Date.now() - inicio,
    }
  } catch (err: any) {
    return {
      tribunal: TRIBUNAL,
      processos: [],
      erro: err?.message ?? 'Erro desconhecido',
      duracao_ms: Date.now() - inicio,
    }
  }
}
