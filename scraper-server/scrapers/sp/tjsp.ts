// TJSP — Tribunal de Justiça de São Paulo
// Sistema: eSAJ
// Consulta pública: https://esaj.tjsp.jus.br/cpopg/open.do
import { load } from 'cheerio'
import {
  BROWSER_HEADERS,
  ScraperProcesso,
  ScraperTribunalResult,
  delay,
  fetchComTimeout,
  limparDocumento,
} from '../../lib/utils'

const TRIBUNAL = 'TJSP'
const ESAJ_BASE = 'https://esaj.tjsp.jus.br'

async function buscarProcessos(cpf: string): Promise<ScraperProcesso[]> {
  const cpfLimpo = limparDocumento(cpf)
  const processos: ScraperProcesso[] = []

  // eSAJ — busca por número de documento (CPF)
  const searchParams = new URLSearchParams({
    cbPesquisa: 'NUMDOC',
    numeroDigitoAnoUnificado: '',
    foroNumeroUnificado: '',
    'dadosConsulta.valorConsulta': cpfLimpo,
    'dadosConsulta.localPesquisa.cdLocal': '-1',
    'dadosConsulta.localPesquisa.descricaoOrgaoJuiz': 'Foro de Origem',
    cdForo: '-1',
  })

  try {
    // Primeiro: GET para obter cookies de sessão
    await fetchComTimeout(`${ESAJ_BASE}/cpopg/open.do`, {
      headers: BROWSER_HEADERS,
      timeoutMs: 10_000,
    })

    await delay(500)

    // Segundo: POST com dados de busca
    const res = await fetchComTimeout(`${ESAJ_BASE}/cpopg/search.do?${searchParams}`, {
      headers: {
        ...BROWSER_HEADERS,
        Referer: `${ESAJ_BASE}/cpopg/open.do`,
      },
      timeoutMs: 15_000,
    })

    if (!res.ok) return []

    const html = await res.text()
    const $ = load(html)

    // Resultados em tabela com ID "listagemDeProcessos"
    $('#listagemDeProcessos tr.fundobranco, #listagemDeProcessos tr.fundocinza').each((_, row) => {
      const link = $(row).find('a.linkProcesso')
      const numero = link.text().trim()
      if (!numero) return

      const cols = $(row).find('td')
      processos.push({
        numero_processo: numero,
        tribunal: TRIBUNAL,
        classe: $(cols[1]).text().trim(),
        assunto: $(cols[2]).text().trim(),
        data_ajuizamento: $(cols[5]).text().trim(),
        fonte: 'tjsp-esaj',
      })
    })

    // Se não achou com formato antigo, tentar formato novo
    if (processos.length === 0) {
      $('.lista-resultado .item-lista, .processo-resultado').each((_, el) => {
        const numero = $(el).find('.numero-processo, .linkProcesso').text().trim()
        if (!numero) return

        processos.push({
          numero_processo: numero,
          tribunal: TRIBUNAL,
          classe: $(el).find('.classe').text().trim(),
          assunto: $(el).find('.assunto').text().trim(),
          fonte: 'tjsp-esaj-novo',
        })
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
