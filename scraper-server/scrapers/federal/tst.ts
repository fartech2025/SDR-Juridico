// TST — Tribunal Superior do Trabalho
// Sistema: PJe
// Consulta pública: https://pje.tst.jus.br/consultaprocessual/
import {
  BROWSER_HEADERS,
  ScraperProcesso,
  ScraperTribunalResult,
  fetchComTimeout,
  limparDocumento,
} from '../../lib/utils'

const TRIBUNAL = 'TST'

async function buscarViaPje(cpf: string): Promise<ScraperProcesso[]> {
  const cpfLimpo = limparDocumento(cpf)

  const endpoints = [
    `https://pje.tst.jus.br/pjekz/processo/lista-processos-por-cpf-cnpj?cpfCnpj=${cpfLimpo}&pagina=1&tamanhoPagina=30`,
    `https://pje.tst.jus.br/pje/rest/processo/pesquisar/v1?cpfCnpj=${cpfLimpo}`,
    `https://consultaprocessual.tst.jus.br/consultaProcessual/servlet/consultaProc?numInt=&anoProp=&anoPauta=&nomeParte=${cpfLimpo}&CodArea=8&submit=Consultar`,
  ]

  for (const url of endpoints) {
    try {
      const res = await fetchComTimeout(url, {
        headers: { ...BROWSER_HEADERS, Accept: 'application/json, text/html' },
        timeoutMs: 12_000,
      })

      if (!res.ok) continue

      const contentType = res.headers.get('content-type') ?? ''

      if (contentType.includes('json')) {
        const data = await res.json()
        const lista = data?.data ?? data?.processos ?? data?.content ?? (Array.isArray(data) ? data : [])
        if (lista.length > 0) {
          return lista.map((p: any) => ({
            numero_processo: p.numero ?? p.numeroProcesso ?? p.npu ?? '',
            tribunal: TRIBUNAL,
            classe: p.classeProcessual ?? p.classe ?? '',
            assunto: p.assunto ?? '',
            data_ajuizamento: p.dataAjuizamento ?? '',
            fonte: 'tst-pje',
          }))
        }
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
    const processos = await buscarViaPje(cpf)
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
