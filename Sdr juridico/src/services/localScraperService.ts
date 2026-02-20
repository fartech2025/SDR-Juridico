// Chama o Bun/Node scraper server local (porta 3001)
import type { ScraperProcesso } from '@/types/caseIntelligence'

const SCRAPER_URL = '/scraper-api'

export interface ScraperStatus {
  online: boolean
  porta: number
  versao: string
  cache: { size: number }
  timestamp: string
}

/** Verifica se o scraper server está rodando */
export async function verificarStatus(): Promise<ScraperStatus | null> {
  try {
    const res = await fetch(`${SCRAPER_URL}/status`, {
      signal: AbortSignal.timeout(3_000),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

/** Busca processos por CPF em todos os tribunais via scraper local */
export async function buscarPorCpf(cpf: string): Promise<{
  processos: ScraperProcesso[]
  total: number
  gerado_em: string
  erro?: string
}> {
  try {
    const res = await fetch(`${SCRAPER_URL}/cpf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpf }),
      signal: AbortSignal.timeout(60_000), // scrapers podem ser lentos
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return { processos: [], total: 0, gerado_em: new Date().toISOString(), erro: err?.erro ?? 'Erro no scraper' }
    }

    return res.json()
  } catch (err: any) {
    // Scraper offline — não bloquear a análise
    return {
      processos: [],
      total: 0,
      gerado_em: new Date().toISOString(),
      erro: err?.name === 'TimeoutError' ? 'Scraper offline (timeout)' : 'Scraper offline',
    }
  }
}
