#!/usr/bin/env npx tsx
/**
 * DOU Sync - Monitoramento diário do Diário Oficial da União
 *
 * Uso:
 *   npx tsx scripts/dou-sync.ts              ← sync do dia
 *   npx tsx scripts/dou-sync.ts 2026-02-04   ← sync de data específica
 *
 * Task Scheduler (Windows):
 *   Programa: cmd
 *   Argumentos: /c "cd /d C:\...\Sdr juridico && npx tsx scripts/dou-sync.ts"
 *   Schedule: 9h seg-sex
 */

import {
  logger,
  downloadViaLeiturajornal,
  matchTermo,
  salvarPublicacao,
  criarNotificacao,
  inserirTimeline,
  logSync,
  getTermosMonitorados,
  getCasosAtivosComProcesso,
  supabase,
} from './dou/index'

async function main() {
  const dataArg = process.argv[2]
  const dataAlvo = dataArg || new Date().toISOString().slice(0, 10)

  // Converter YYYY-MM-DD para Date
  const dataDate = new Date(dataAlvo + 'T12:00:00')

  // Verificar se é final de semana
  const diaSemana = dataDate.getDay()
  if (diaSemana === 0 || diaSemana === 6) {
    logger.info(`${dataAlvo} é final de semana, pulando sync`)
    return
  }

  logger.info(`=== DOU Sync iniciado para ${dataAlvo} ===`)
  const startTime = Date.now()

  try {
    // 1. Baixar publicações do dia via leiturajornal (sem auth)
    logger.info('Baixando publicações do DOU via leiturajornal...')
    const publicacoes = await downloadViaLeiturajornal(dataDate)

    if (publicacoes.length === 0) {
      logger.warn('Nenhuma publicação encontrada (feriado ou edição vazia)')
      return
    }

    logger.info(`${publicacoes.length} publicações encontradas no DOU Seção 3`)

    // 2. Carregar todas as organizações
    const { data: orgs, error: orgsError } = await supabase
      .from('orgs')
      .select('id')

    if (orgsError || !orgs?.length) {
      logger.error('Erro ao carregar orgs:', orgsError)
      return
    }

    logger.info(`Processando ${orgs.length} organização(ões)...`)

    let totalMatches = 0

    // 3. Para cada org
    for (const org of orgs) {
      const orgStart = Date.now()
      try {
        // Carregar termos monitorados
        let termos = await getTermosMonitorados(org.id)

        // Se não há termos, gerar a partir de casos ativos
        if (termos.length === 0) {
          const casos = await getCasosAtivosComProcesso(org.id)
          termos = casos.map(c => ({
            termo: c.numero_processo,
            tipo: 'numero_processo' as const,
            caso_id: c.id,
            org_id: org.id,
          }))
        }

        if (termos.length === 0) {
          logger.info(`Org ${org.id}: sem termos, pulando`)
          continue
        }

        let encontrados = 0

        // 4. Matching: publicações × termos
        for (const pub of publicacoes) {
          for (const termo of termos) {
            const result = matchTermo(pub, termo)
            if (result.matched) {
              const salvo = await salvarPublicacao(org.id, termo.caso_id, pub, termo, result)
              if (salvo) {
                await criarNotificacao(org.id, termo.caso_id, pub, termo)
                if (termo.caso_id) {
                  await inserirTimeline(termo.caso_id, pub)
                }
                encontrados++
              }
            }
          }
        }

        totalMatches += encontrados
        const orgDuracao = Date.now() - orgStart

        // 5. Log de sync
        await logSync(org.id, dataAlvo, termos.length, encontrados, orgDuracao)
        logger.info(`Org ${org.id}: ${encontrados} matches de ${termos.length} termos (${orgDuracao}ms)`)

      } catch (err) {
        const orgDuracao = Date.now() - orgStart
        logger.error(`Erro org ${org.id}:`, err)
        await logSync(org.id, dataAlvo, 0, 0, orgDuracao, String(err))
      }
    }

    const duracaoTotal = Date.now() - startTime
    logger.info(`=== DOU Sync concluído: ${totalMatches} matches em ${duracaoTotal}ms ===`)

  } catch (err) {
    logger.error('DOU Sync falhou:', err)
    process.exit(1)
  }
}

main().catch(err => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
