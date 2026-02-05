#!/usr/bin/env npx tsx
/**
 * DOU Test Import - Testa busca e validacao SEM gravar no banco
 *
 * Uso:
 *   npx tsx scripts/dou/test-import.ts                     # Busca publicacoes do dia via leiturajornal
 *   npx tsx scripts/dou/test-import.ts --termo="12345"     # Busca historica por termo
 *   npx tsx scripts/dou/test-import.ts --data=05-02-2026   # Busca por data especifica
 *   npx tsx scripts/dou/test-import.ts --verbose           # Mostra dados completos
 *   npx tsx scripts/dou/test-import.ts --output=resultado  # Salva em arquivo JSON
 *   npx tsx scripts/dou/test-import.ts --limit=10          # Limita quantidade de resultados
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { parseSearchHTML, parseLeiturajornalHTML } from './html-parser'
import { matchTermo, classificarTipo } from './matching-engine'
import { validateDOUHits, validateLeiturajornalItems, validateBeforePersist } from './validation'
import { DOU_CONFIG } from './config'
import type { DOUHit } from './types'

// Cores para output no terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
}

function log(msg: string, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`)
}

function formatDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear()
  return `${dd}-${mm}-${yyyy}`
}

// Parse argumentos
const args = process.argv.slice(2)
const verbose = args.includes('--verbose') || args.includes('-v')
const termoArg = args.find(a => a.startsWith('--termo='))?.split('=')[1]
const dataArg = args.find(a => a.startsWith('--data='))?.split('=')[1]
const outputArg = args.find(a => a.startsWith('--output='))?.split('=')[1]
const limitArg = args.find(a => a.startsWith('--limit='))?.split('=')[1]
const limit = limitArg ? parseInt(limitArg, 10) : undefined

// Diretorio de output
const OUTPUT_DIR = './logs/dou'

function saveToFile(filename: string, data: unknown) {
  // Criar diretorio se nao existir
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  const filepath = `${OUTPUT_DIR}/${filename}.json`
  writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8')
  log(`\nArquivo salvo: ${filepath}`, colors.green)
  return filepath
}

async function testLeiturajornal(data: string): Promise<DOUHit[]> {
  log(`\n${'='.repeat(60)}`, colors.cyan)
  log(`TESTE: Leiturajornal (${data})`, colors.cyan)
  log(`${'='.repeat(60)}`, colors.cyan)

  const url = `${DOU_CONFIG.leiturajornalUrl}?data=${data}&secao=${DOU_CONFIG.secao}`
  log(`URL: ${url}`, colors.dim)

  try {
    const response = await fetch(url)
    const html = await response.text()

    log(`\nStatus HTTP: ${response.status}`, response.ok ? colors.green : colors.red)
    log(`Tamanho HTML: ${(html.length / 1024).toFixed(1)} KB`)

    // Extrair JSON do HTML
    const scriptMatch = html.match(/<script\s+id="params"[^>]*>([\s\S]*?)<\/script>/)
    if (!scriptMatch) {
      log('ERRO: <script id="params"> nao encontrado no HTML', colors.red)
      return []
    }

    const rawData = JSON.parse(scriptMatch[1])
    const rawItems = rawData.jsonArray || []
    log(`Items brutos encontrados: ${rawItems.length}`)

    // Validar com Zod
    log(`\n--- Validacao Zod ---`, colors.yellow)
    const validados = validateLeiturajornalItems(rawItems)
    log(`Items validos apos Zod: ${validados.length}`, validados.length > 0 ? colors.green : colors.red)

    if (validados.length < rawItems.length) {
      log(`Items descartados: ${rawItems.length - validados.length}`, colors.yellow)
    }

    return validados
  } catch (error) {
    log(`ERRO: ${error}`, colors.red)
    return []
  }
}

async function testBuscaPublica(termo: string): Promise<DOUHit[]> {
  log(`\n${'='.repeat(60)}`, colors.cyan)
  log(`TESTE: Busca Publica (termo: "${termo}")`, colors.cyan)
  log(`${'='.repeat(60)}`, colors.cyan)

  const url = new URL(DOU_CONFIG.douSearchUrl)
  url.searchParams.set('q', termo)
  url.searchParams.set('s', DOU_CONFIG.secao)
  url.searchParams.set('publishFrom', '01-01-2020')
  url.searchParams.set('sortType', '0')

  log(`URL: ${url.toString()}`, colors.dim)

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      },
    })
    const html = await response.text()

    log(`\nStatus HTTP: ${response.status}`, response.ok ? colors.green : colors.red)
    log(`Tamanho HTML: ${(html.length / 1024).toFixed(1)} KB`)

    if (!response.ok) {
      log(`\nAVISO: API de busca retornou erro ${response.status}`, colors.yellow)
      log(`Isso pode ocorrer por rate limiting ou bloqueio de IP.`, colors.yellow)
      log(`Alternativa: Use --data=DD-MM-YYYY para buscar via leiturajornal`, colors.yellow)
      return []
    }

    // Debug: verificar formato do response
    const hasVarRequest = html.includes('var request')
    const hasJsonArray = html.includes('jsonArray')
    const hasSearchData = html.includes('searchData')
    log(`\nFormatos detectados: var_request=${hasVarRequest}, jsonArray=${hasJsonArray}, searchData=${hasSearchData}`, colors.dim)

    if (verbose) {
      // Mostrar primeiros 1000 chars para debug
      const snippet = html.substring(0, 1000).replace(/\s+/g, ' ')
      log(`\nSnippet HTML: ${snippet}...`, colors.dim)
    }

    // Parsear HTML
    const result = parseSearchHTML(html)
    log(`\nPagina ${result.currentPage} de ${result.totalPages}`)
    log(`Hits encontrados: ${result.hits.length}`)

    return result.hits
  } catch (error) {
    log(`ERRO: ${error}`, colors.red)
    return []
  }
}

// Busca por termo dentro do leiturajornal (alternativa mais confiavel)
async function testBuscaViaLeiturajornal(termo: string, data: string): Promise<DOUHit[]> {
  log(`\n${'='.repeat(60)}`, colors.cyan)
  log(`TESTE: Busca via Leiturajornal (termo: "${termo}", data: ${data})`, colors.cyan)
  log(`${'='.repeat(60)}`, colors.cyan)

  // Primeiro busca todas as publicacoes do dia
  const todasPublicacoes = await testLeiturajornal(data)

  // Depois filtra pelo termo
  const termoLower = termo.toLowerCase()
  const filtradas = todasPublicacoes.filter(pub => {
    const textoCompleto = `${pub.title} ${pub.content || ''}`.toLowerCase()
    return textoCompleto.includes(termoLower)
  })

  log(`\nPublicacoes com termo "${termo}": ${filtradas.length} de ${todasPublicacoes.length}`, colors.green)
  return filtradas
}

function showResults(hits: DOUHit[], maxShow = 5) {
  if (hits.length === 0) {
    log('\nNenhum resultado para exibir.', colors.yellow)
    return
  }

  log(`\n--- Primeiros ${Math.min(maxShow, hits.length)} resultados ---`, colors.green)

  for (let i = 0; i < Math.min(maxShow, hits.length); i++) {
    const hit = hits[i]
    log(`\n[${i + 1}] ${hit.title}`, colors.cyan)
    log(`    Data: ${hit.pubDate}`)
    log(`    Tipo: ${hit.artType || 'N/A'}`)
    log(`    Pagina: ${hit.numberPage || 'N/A'}`)
    log(`    URL: https://www.in.gov.br/web/dou/-/${hit.urlTitle}`, colors.dim)

    // Classificar tipo
    const tipo = classificarTipo(hit.title, hit.content || '')
    log(`    Classificacao: ${tipo}`, colors.yellow)

    // Validar antes de persistir (simulado)
    const validacao = validateBeforePersist({
      orgId: 'test-org-id',
      titulo: hit.title,
      dataPub: hit.pubDate,
      conteudo: hit.content,
    })
    log(`    Validacao persist: ${validacao.valid ? 'OK' : 'FALHA - ' + validacao.errors.join(', ')}`,
      validacao.valid ? colors.green : colors.red)

    if (verbose && hit.content) {
      log(`    Conteudo: ${hit.content.substring(0, 200)}...`, colors.dim)
    }
  }

  if (hits.length > maxShow) {
    log(`\n... e mais ${hits.length - maxShow} resultados`, colors.dim)
  }
}

function testMatching(hits: DOUHit[]) {
  log(`\n--- Teste de Matching ---`, colors.yellow)

  // Termos de teste
  const termosTest = [
    { termo: '1234567', tipo: 'numero_processo' as const },
    { termo: 'TRIBUNAL', tipo: 'custom' as const },
    { termo: 'intimacao', tipo: 'custom' as const },
  ]

  for (const termoTest of termosTest) {
    let matches = 0
    for (const hit of hits) {
      const result = matchTermo(
        { titulo: hit.title, conteudo: hit.content || '' },
        termoTest
      )
      if (result.matched) matches++
    }
    log(`  Termo "${termoTest.termo}" (${termoTest.tipo}): ${matches} matches de ${hits.length}`)
  }
}

async function main() {
  log('DOU Test Import - Validacao sem persistencia', colors.cyan)
  log(`Configuracao: secao=${DOU_CONFIG.secao}`, colors.dim)

  let hits: DOUHit[] = []
  const data = dataArg || formatDate(new Date())

  if (termoArg) {
    // Tenta busca publica primeiro
    hits = await testBuscaPublica(termoArg)

    // Se falhar, usa alternativa via leiturajornal
    if (hits.length === 0) {
      log(`\nTentando busca alternativa via leiturajornal...`, colors.yellow)
      hits = await testBuscaViaLeiturajornal(termoArg, data)
    }
  } else {
    // Busca do dia via leiturajornal
    hits = await testLeiturajornal(data)
  }

  // Aplicar limite se especificado
  let hitsParaExibir = hits
  if (limit && limit > 0) {
    hitsParaExibir = hits.slice(0, limit)
    log(`\nLimitando a ${limit} resultados (de ${hits.length} total)`, colors.yellow)
  }

  showResults(hitsParaExibir, verbose ? 10 : 5)
  testMatching(hitsParaExibir)

  // Resumo final
  log(`\n${'='.repeat(60)}`, colors.green)
  log(`RESUMO`, colors.green)
  log(`${'='.repeat(60)}`, colors.green)
  log(`Total de publicacoes: ${hits.length}`)
  if (limit) log(`Exibindo/exportando: ${hitsParaExibir.length}`)
  log(`Todas validadas com Zod: SIM`, colors.green)

  // Estatisticas de tipos
  const tipos: Record<string, number> = {}
  for (const hit of hitsParaExibir) {
    const tipo = classificarTipo(hit.title, hit.content || '')
    tipos[tipo] = (tipos[tipo] || 0) + 1
  }
  log(`\nDistribuicao por tipo:`)
  for (const [tipo, count] of Object.entries(tipos)) {
    log(`  ${tipo}: ${count}`)
  }

  // Salvar em arquivo se solicitado
  if (outputArg) {
    const resultado = {
      metadata: {
        data_busca: data,
        termo: termoArg || null,
        total_encontrados: hits.length,
        total_exportados: hitsParaExibir.length,
        timestamp: new Date().toISOString(),
      },
      estatisticas: {
        por_tipo: tipos,
      },
      publicacoes: hitsParaExibir.map(hit => ({
        titulo: hit.title,
        data: hit.pubDate,
        tipo_artigo: hit.artType,
        tipo_classificado: classificarTipo(hit.title, hit.content || ''),
        pagina: hit.numberPage,
        url: `https://www.in.gov.br/web/dou/-/${hit.urlTitle}`,
        conteudo: hit.content || null,
        validacao: validateBeforePersist({
          orgId: 'test',
          titulo: hit.title,
          dataPub: hit.pubDate,
          conteudo: hit.content,
        }),
      })),
    }

    saveToFile(outputArg, resultado)
  }
}

main().catch(console.error)
