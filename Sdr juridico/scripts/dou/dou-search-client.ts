// scripts/dou/dou-search-client.ts
// Busca na API pública do DOU (sem autenticação)
import * as https from 'https'
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
 * Fetch usando módulo https nativo (mais estável que fetch do Node.js)
 */
async function httpsGet(urlStr: string): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr)
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      },
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        resolve({ status: res.statusCode || 0, text: data })
      })
    })

    req.on('error', reject)
    req.setTimeout(30000, () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })
    req.end()
  })
}

/**
 * Fetch com retry e exponential backoff
 */
async function fetchWithRetry(
  url: string,
  attempt: number = 1
): Promise<{ ok: boolean; status: number; text: () => Promise<string> }> {
  try {
    const response = await httpsGet(url)

    if (response.status === 429 && attempt < DOU_CONFIG.retryAttempts) {
      const delay = DOU_CONFIG.retryDelayMs * Math.pow(2, attempt - 1)
      logger.warn(`Rate limited (429), retry em ${delay}ms (tentativa ${attempt})`)
      await sleep(delay)
      return fetchWithRetry(url, attempt + 1)
    }

    if (response.status >= 400 && attempt < DOU_CONFIG.retryAttempts) {
      const delay = DOU_CONFIG.retryDelayMs * Math.pow(2, attempt - 1)
      logger.warn(`HTTP ${response.status}, retry em ${delay}ms (tentativa ${attempt})`)
      await sleep(delay)
      return fetchWithRetry(url, attempt + 1)
    }

    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      text: async () => response.text,
    }
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
