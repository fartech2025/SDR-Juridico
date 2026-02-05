// scripts/dou/dou-search-client.ts
// Busca na API pública do DOU (sem autenticação)
import { DOU_CONFIG } from './config'
import { parseSearchHTML, parseLeiturajornalHTML } from './html-parser'
import { logger } from './logger'
import type { DOUHit } from './types'

/**
 * Busca publicações na API pública do DOU
 * Pesquisa em todo o histórico (desde 2018+)
 */
export async function searchDOUPublico(params: {
  termo: string
  secao?: string
  dataInicio?: string  // DD-MM-YYYY
  dataFim?: string     // DD-MM-YYYY
  pagina?: number
}): Promise<{
  hits: DOUHit[]
  totalPages: number
  currentPage: number
}> {
  const url = new URL(DOU_CONFIG.douSearchUrl)
  url.searchParams.set('q', params.termo)
  url.searchParams.set('s', params.secao || DOU_CONFIG.secao)
  if (params.dataInicio) url.searchParams.set('publishFrom', params.dataInicio)
  if (params.dataFim) url.searchParams.set('publishTo', params.dataFim)
  url.searchParams.set('sortType', '0')

  logger.info(`Buscando DOU público: ${url.toString()}`)

  const response = await fetchWithRetry(url.toString())
  const html = await response.text()
  return parseSearchHTML(html)
}

/**
 * Baixa publicações de um dia específico via leiturajornal (sem auth)
 */
export async function downloadViaLeiturajornal(data: Date): Promise<DOUHit[]> {
  const dd = String(data.getDate()).padStart(2, '0')
  const mm = String(data.getMonth() + 1).padStart(2, '0')
  const yyyy = data.getFullYear()
  const dataStr = `${dd}-${mm}-${yyyy}`

  const url = `${DOU_CONFIG.leiturajornalUrl}?data=${dataStr}&secao=${DOU_CONFIG.secao}`
  logger.info(`Baixando leiturajornal: ${url}`)

  const response = await fetchWithRetry(url)
  const html = await response.text()
  const hits = parseLeiturajornalHTML(html)

  logger.info(`leiturajornal ${dataStr}: ${hits.length} publicações`)
  return hits
}

/**
 * Fetch com retry e exponential backoff
 */
async function fetchWithRetry(
  url: string,
  attempt: number = 1
): Promise<Response> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SDR-Juridico-DOU-Bot/1.0',
        'Accept': 'text/html,application/xhtml+xml',
      },
    })

    if (response.status === 429 && attempt < DOU_CONFIG.retryAttempts) {
      const delay = DOU_CONFIG.retryDelayMs * Math.pow(2, attempt - 1)
      logger.warn(`Rate limited (429), retry em ${delay}ms (tentativa ${attempt})`)
      await sleep(delay)
      return fetchWithRetry(url, attempt + 1)
    }

    if (!response.ok && attempt < DOU_CONFIG.retryAttempts) {
      const delay = DOU_CONFIG.retryDelayMs * Math.pow(2, attempt - 1)
      logger.warn(`HTTP ${response.status}, retry em ${delay}ms (tentativa ${attempt})`)
      await sleep(delay)
      return fetchWithRetry(url, attempt + 1)
    }

    return response
  } catch (error) {
    if (attempt < DOU_CONFIG.retryAttempts) {
      const delay = DOU_CONFIG.retryDelayMs * Math.pow(2, attempt - 1)
      logger.warn(`Erro de rede, retry em ${delay}ms (tentativa ${attempt})`, error)
      await sleep(delay)
      return fetchWithRetry(url, attempt + 1)
    }
    throw error
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
