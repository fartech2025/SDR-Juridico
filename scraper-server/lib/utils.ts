// Utilitários compartilhados entre scrapers

/** Remove tudo que não é dígito do CPF/CNPJ */
export function limparDocumento(doc: string): string {
  return doc.replace(/\D/g, '')
}

/** Formata CPF: 000.000.000-00 */
export function formatarCpf(cpf: string): string {
  const d = limparDocumento(cpf)
  if (d.length !== 11) return cpf
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

/** Delay em ms — para rate limiting respeitoso */
export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

/** Headers padrão para simular browser */
export const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'application/json, text/html, */*',
  'Accept-Language': 'pt-BR,pt;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  Connection: 'keep-alive',
}

/** Resultado padronizado de um scraper */
export interface ScraperProcesso {
  numero_processo: string
  tribunal: string
  classe?: string
  assunto?: string
  data_ajuizamento?: string
  ultima_atualizacao?: string
  valor_causa?: number
  partes?: Array<{ nome: string; polo: 'ativo' | 'passivo' | 'outro' }>
  movimentos?: Array<{ data: string; descricao: string }>
  grau?: string
  fonte: string
}

export interface ScraperTribunalResult {
  tribunal: string
  processos: ScraperProcesso[]
  erro?: string
  duracao_ms: number
}

export interface ScraperResult {
  cpf: string
  processos: ScraperProcesso[]
  tribunais: ScraperTribunalResult[]
  total: number
  gerado_em: string
}

/** Deduplicar processos por número */
export function deduplicar(processos: ScraperProcesso[]): ScraperProcesso[] {
  const seen = new Set<string>()
  return processos.filter((p) => {
    const key = p.numero_processo.replace(/\D/g, '')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/** Fetch com timeout */
export async function fetchComTimeout(
  url: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs = 15_000, ...fetchOptions } = options
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...fetchOptions, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}
