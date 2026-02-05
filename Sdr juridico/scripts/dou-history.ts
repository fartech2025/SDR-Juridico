#!/usr/bin/env npx tsx
/**
 * DOU History - Busca publicações históricas de um processo no DOU
 *
 * Usa a API pública de busca (sem autenticação) que pesquisa em todo o histórico.
 *
 * Uso:
 *   npx tsx scripts/dou-history.ts "1234567-89.2024.8.26.0100"
 *   npx tsx scripts/dou-history.ts "1234567-89.2024.8.26.0100" --caso-id=UUID --org-id=UUID
 *   npx tsx scripts/dou-history.ts "João da Silva" --tipo=nome_parte
 */

import {
  DOU_CONFIG,
  logger,
  searchDOUPublico,
  salvarPublicacao,
  inserirTimeline,
} from './dou/index'
import type { DOUHit } from './dou/types'

function parseArgs() {
  const args = process.argv.slice(2)

  if (args.length === 0 || args[0].startsWith('--')) {
    console.log(`
DOU History - Busca publicações históricas no Diário Oficial da União

Uso:
  npx tsx scripts/dou-history.ts "TERMO_DE_BUSCA" [opções]

Opções:
  --caso-id=UUID      ID do caso para vincular publicações
  --org-id=UUID       ID da organização
  --tipo=TIPO         Tipo do termo: numero_processo (default), nome_parte, oab, custom
  --desde=DD-MM-YYYY  Data início (default: 01-01-2020)
  --ate=DD-MM-YYYY    Data fim (default: hoje)
  --salvar            Salvar resultados no banco (requer --caso-id e --org-id)

Exemplos:
  npx tsx scripts/dou-history.ts "1234567-89.2024.8.26.0100"
  npx tsx scripts/dou-history.ts "João Silva" --tipo=nome_parte --desde=01-01-2024
  npx tsx scripts/dou-history.ts "1234567-89.2024.8.26.0100" --caso-id=abc --org-id=xyz --salvar
`)
    process.exit(0)
  }

  const termo = args[0]
  const getArg = (prefix: string) => args.find(a => a.startsWith(`--${prefix}=`))?.split('=')[1]
  const hasFlag = (flag: string) => args.includes(`--${flag}`)

  return {
    termo,
    casoId: getArg('caso-id'),
    orgId: getArg('org-id'),
    tipo: (getArg('tipo') || 'numero_processo') as 'numero_processo' | 'nome_parte' | 'oab' | 'custom',
    desde: getArg('desde') || '01-01-2020',
    ate: getArg('ate'),
    salvar: hasFlag('salvar'),
  }
}

async function main() {
  const params = parseArgs()

  logger.info(`Buscando histórico DOU para: "${params.termo}" (tipo: ${params.tipo})`)
  logger.info(`Período: ${params.desde} até ${params.ate || 'hoje'}`)

  const allHits: DOUHit[] = []
  let page = 1

  // Paginar resultados
  while (page <= DOU_CONFIG.maxPaginasBuscaHistorica) {
    const result = await searchDOUPublico({
      termo: params.termo,
      dataInicio: params.desde,
      dataFim: params.ate,
      pagina: page,
    })

    allHits.push(...result.hits)
    logger.info(`Página ${page}/${result.totalPages}: ${result.hits.length} resultados`)

    if (page >= result.totalPages || result.hits.length === 0) break
    page++

    // Rate limit: esperar 1s entre páginas
    await new Promise(r => setTimeout(r, 1000))
  }

  logger.info(`\nTotal: ${allHits.length} publicações encontradas`)

  if (allHits.length === 0) {
    console.log('\nNenhuma publicação encontrada para o termo buscado.')
    return
  }

  // Exibir resultados no console
  console.log('\n' + '='.repeat(80))
  for (const hit of allHits) {
    console.log(`\n[${hit.pubDate}] ${hit.artType || 'Publicação'}`)
    console.log(`  Título: ${hit.title}`)
    if (hit.artCategory) console.log(`  Órgão: ${hit.artCategory}`)
    if (hit.numberPage) console.log(`  Página: ${hit.numberPage}`)
    console.log(`  URL: https://www.in.gov.br/en/web/dou/-/${hit.urlTitle}`)
    if (hit.content) {
      const resumo = hit.content.replace(/<[^>]+>/g, '').slice(0, 200)
      console.log(`  Resumo: ${resumo}...`)
    }
  }
  console.log('\n' + '='.repeat(80))

  // Salvar no banco se solicitado
  if (params.salvar) {
    if (!params.casoId || !params.orgId) {
      console.log('\nPara salvar, informe --caso-id e --org-id')
      return
    }

    logger.info(`Salvando ${allHits.length} publicações no banco...`)
    let salvos = 0

    for (const hit of allHits) {
      const saved = await salvarPublicacao(
        params.orgId,
        params.casoId,
        hit,
        { termo: params.termo, tipo: params.tipo },
        { matched: true, score: 1.0, matchType: params.tipo }
      )
      if (saved) {
        await inserirTimeline(params.casoId, hit)
        salvos++
      }
    }

    logger.info(`${salvos} publicações salvas (${allHits.length - salvos} duplicatas ignoradas)`)
  }
}

main().catch(err => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
