// scripts/dou/html-parser.ts
// Parseia respostas HTML do in.gov.br para extrair dados estruturados
import type { DOUHit } from './types'
import { validateDOUHits, validateLeiturajornalItems } from './validation'

/**
 * Extrai hits da resposta HTML da busca pública do DOU
 * Endpoint: https://www.in.gov.br/consulta/-/buscar/dou
 *
 * A resposta contém um objeto JS `var request = {...}` com os dados
 */
export function parseSearchHTML(html: string): {
  hits: DOUHit[]
  totalPages: number
  currentPage: number
} {
  try {
    // Estrategia 1: Extrair o objeto searchData do script
    const searchDataMatch = html.match(/var\s+searchData\s*=\s*(\{[\s\S]*?\});?\s*(?:var|\n|$)/)

    // Estrategia 2: Buscar hits diretamente no HTML
    const hitsMatch = html.match(/"hits"\s*:\s*(\[[\s\S]*?\])\s*,\s*"/)

    // Estrategia 3: Buscar jsonArray (formato leiturajornal dentro do search)
    const jsonArrayMatch = html.match(/"jsonArray"\s*:\s*(\[[\s\S]*?\])\s*[,}]/)

    let hits: DOUHit[] = []
    let totalPages = 0
    let currentPage = 1

    if (hitsMatch) {
      try {
        // Limpar JSON de possiveis problemas
        const jsonStr = hitsMatch[1]
          .replace(/,\s*]/g, ']')    // trailing commas em arrays
          .replace(/,\s*}/g, '}')    // trailing commas em objetos
          .replace(/'/g, '"')        // aspas simples para duplas

        const rawHits = JSON.parse(jsonStr)
        hits = validateDOUHits(rawHits)

        // Tentar extrair paginacao
        const totalPagesMatch = html.match(/"totalPages"\s*:\s*(\d+)/)
        const currentPageMatch = html.match(/"currentPage"\s*:\s*(\d+)/)
        totalPages = totalPagesMatch ? Number(totalPagesMatch[1]) : 1
        currentPage = currentPageMatch ? Number(currentPageMatch[1]) : 1
      } catch {
        // Ignora erro de parse do hits
      }
    }

    if (hits.length === 0 && jsonArrayMatch) {
      try {
        const jsonStr = jsonArrayMatch[1]
          .replace(/,\s*]/g, ']')
          .replace(/,\s*}/g, '}')

        const rawItems = JSON.parse(jsonStr)
        hits = validateLeiturajornalItems(rawItems)
      } catch {
        // Ignora erro de parse do jsonArray
      }
    }

    if (hits.length === 0 && searchDataMatch) {
      try {
        const jsonStr = searchDataMatch[1]
          .replace(/,\s*}/g, '}')
          .replace(/,\s*]/g, ']')
          .replace(/'/g, '"')

        const data = JSON.parse(jsonStr)
        if (data.hits) {
          hits = validateDOUHits(data.hits)
          totalPages = Number(data.totalPages) || 0
          currentPage = Number(data.currentPage) || 1
        }
      } catch {
        // Ignora erro de parse do searchData
      }
    }

    return { hits, totalPages, currentPage }
  } catch (error) {
    console.error('Erro ao parsear HTML de busca DOU:', error)
    return { hits: [], totalPages: 0, currentPage: 0 }
  }
}

/**
 * Extrai publicações do endpoint leiturajornal
 * Endpoint: https://www.in.gov.br/leiturajornal?data=DD-MM-YYYY&secao=do3
 *
 * Retorna HTML com <script id="params"> contendo JSON com jsonArray
 */
export function parseLeiturajornalHTML(html: string): DOUHit[] {
  try {
    // Extrair JSON do <script id="params">
    const scriptMatch = html.match(/<script\s+id="params"[^>]*>([\s\S]*?)<\/script>/)
    if (!scriptMatch) {
      return []
    }

    const data = JSON.parse(scriptMatch[1])
    const jsonArray = data.jsonArray || []

    // Validar cada item com Zod antes de retornar
    return validateLeiturajornalItems(jsonArray)
  } catch (error) {
    console.error('Erro ao parsear leiturajornal HTML:', error)
    return []
  }
}
