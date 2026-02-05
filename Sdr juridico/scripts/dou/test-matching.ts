#!/usr/bin/env npx tsx
/**
 * DOU Test Matching - Testa critérios de busca e relevância
 *
 * Uso:
 *   npx tsx scripts/dou/test-matching.ts --processo="1234567-89.2024.8.26.0100"
 *   npx tsx scripts/dou/test-matching.ts --nome="João da Silva"
 *   npx tsx scripts/dou/test-matching.ts --oab="SP123456"
 *   npx tsx scripts/dou/test-matching.ts --termo="intimação"
 *   npx tsx scripts/dou/test-matching.ts --all               # Testa todos os tipos
 *   npx tsx scripts/dou/test-matching.ts --config=config.json # Carrega critérios de arquivo
 *
 * Opções:
 *   --data=DD-MM-YYYY   Data específica (default: hoje)
 *   --limit=N           Limite de resultados
 *   --output=nome       Salva resultado em arquivo JSON
 *   --min-score=0.5     Score mínimo de relevância (0-1)
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs'
import { matchTermo, classificarTipo, type MatchResult } from './matching-engine'
import { validateLeiturajornalItems } from './validation'
import { DOU_CONFIG } from './config'
import type { DOUHit } from './types'

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
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

// Scoring de relevância por tipo de match
const SCORE_MAP: Record<string, number> = {
  'numero_processo_exato': 1.0,
  'numero_processo_parcial': 0.8,
  'nome_parte_exato': 0.7,
  'nome_parte_parcial': 0.5,
  'oab': 0.6,
  'custom': 0.4,
}

// Parse argumentos
const args = process.argv.slice(2)
const processoArg = args.find(a => a.startsWith('--processo='))?.split('=')[1]
const nomeArg = args.find(a => a.startsWith('--nome='))?.split('=')[1]
const oabArg = args.find(a => a.startsWith('--oab='))?.split('=')[1]
const termoArg = args.find(a => a.startsWith('--termo='))?.split('=')[1]
const dataArg = args.find(a => a.startsWith('--data='))?.split('=')[1]
const limitArg = args.find(a => a.startsWith('--limit='))?.split('=')[1]
const outputArg = args.find(a => a.startsWith('--output='))?.split('=')[1]
const minScoreArg = args.find(a => a.startsWith('--min-score='))?.split('=')[1]
const configArg = args.find(a => a.startsWith('--config='))?.split('=')[1]
const testAll = args.includes('--all')

const limit = limitArg ? parseInt(limitArg, 10) : undefined
const minScore = minScoreArg ? parseFloat(minScoreArg) : 0

const OUTPUT_DIR = './logs/dou'

interface Criterio {
  termo: string
  tipo: 'numero_processo' | 'nome_parte' | 'oab' | 'custom'
  descricao?: string
}

interface MatchComScore extends MatchResult {
  score: number
  criterio: Criterio
}

interface PublicacaoComScore {
  hit: DOUHit
  matches: MatchComScore[]
  scoreTotal: number
  scoreMedio: number
  scoreMaximo: number
}

// Buscar publicações do dia
async function fetchPublicacoes(data: string): Promise<DOUHit[]> {
  log(`\nBuscando publicações de ${data}...`, colors.dim)

  const url = `${DOU_CONFIG.leiturajornalUrl}?data=${data}&secao=${DOU_CONFIG.secao}`
  const response = await fetch(url)
  const html = await response.text()

  const scriptMatch = html.match(/<script\s+id="params"[^>]*>([\s\S]*?)<\/script>/)
  if (!scriptMatch) {
    throw new Error('Formato de resposta não reconhecido')
  }

  const rawData = JSON.parse(scriptMatch[1])
  const rawItems = rawData.jsonArray || []
  const publicacoes = validateLeiturajornalItems(rawItems)

  log(`Encontradas ${publicacoes.length} publicações`, colors.green)
  return publicacoes
}

// Aplicar matching com score
function aplicarMatching(publicacoes: DOUHit[], criterios: Criterio[]): PublicacaoComScore[] {
  const resultados: PublicacaoComScore[] = []

  for (const hit of publicacoes) {
    const matches: MatchComScore[] = []

    for (const criterio of criterios) {
      const result = matchTermo(
        { titulo: hit.title, conteudo: hit.content || '' },
        criterio
      )

      if (result.matched) {
        // Calcular score baseado no tipo de match
        let score = SCORE_MAP[criterio.tipo] || 0.4

        // Bonus se match exato
        if (result.matchType === 'exato') {
          score = Math.min(1.0, score + 0.2)
        }

        matches.push({
          ...result,
          score,
          criterio,
        })
      }
    }

    if (matches.length > 0) {
      const scores = matches.map(m => m.score)
      resultados.push({
        hit,
        matches,
        scoreTotal: scores.reduce((a, b) => a + b, 0),
        scoreMedio: scores.reduce((a, b) => a + b, 0) / scores.length,
        scoreMaximo: Math.max(...scores),
      })
    }
  }

  // Ordenar por score máximo (mais relevante primeiro)
  return resultados.sort((a, b) => b.scoreMaximo - a.scoreMaximo)
}

// Exibir resultados
function exibirResultados(resultados: PublicacaoComScore[], criterios: Criterio[]) {
  log(`\n${'='.repeat(70)}`, colors.cyan)
  log(`RESULTADOS DO MATCHING`, colors.cyan)
  log(`${'='.repeat(70)}`, colors.cyan)

  log(`\nCritérios testados:`, colors.yellow)
  for (const c of criterios) {
    const scoreBase = SCORE_MAP[c.tipo] || 0.4
    log(`  [${c.tipo}] "${c.termo}" (score base: ${scoreBase})`)
  }

  log(`\nPublicações com match: ${resultados.length}`, colors.green)

  if (resultados.length === 0) {
    log(`\nNenhuma publicação encontrada com os critérios especificados.`, colors.yellow)
    return
  }

  // Distribuição por score
  const porScore = {
    alto: resultados.filter(r => r.scoreMaximo >= 0.7).length,
    medio: resultados.filter(r => r.scoreMaximo >= 0.4 && r.scoreMaximo < 0.7).length,
    baixo: resultados.filter(r => r.scoreMaximo < 0.4).length,
  }

  log(`\nDistribuição por relevância:`)
  log(`  ${colors.green}Alto (≥0.7):${colors.reset} ${porScore.alto}`)
  log(`  ${colors.yellow}Médio (0.4-0.7):${colors.reset} ${porScore.medio}`)
  log(`  ${colors.dim}Baixo (<0.4):${colors.reset} ${porScore.baixo}`)

  // Exibir top resultados
  const maxShow = limit || 10
  log(`\n--- Top ${Math.min(maxShow, resultados.length)} Resultados ---`, colors.bold)

  for (let i = 0; i < Math.min(maxShow, resultados.length); i++) {
    const r = resultados[i]
    const scoreColor = r.scoreMaximo >= 0.7 ? colors.green : r.scoreMaximo >= 0.4 ? colors.yellow : colors.dim

    log(`\n[${i + 1}] ${r.hit.title}`, colors.cyan)
    log(`    ${scoreColor}Score: ${r.scoreMaximo.toFixed(2)}${colors.reset} (max) | ${r.scoreMedio.toFixed(2)} (médio)`)
    log(`    Data: ${r.hit.pubDate} | Página: ${r.hit.numberPage}`)
    log(`    Tipo: ${classificarTipo(r.hit.title, r.hit.content || '')}`)
    log(`    URL: https://www.in.gov.br/web/dou/-/${r.hit.urlTitle}`, colors.dim)

    log(`    Matches:`, colors.yellow)
    for (const m of r.matches) {
      log(`      - [${m.criterio.tipo}] "${m.criterio.termo}" → score ${m.score.toFixed(2)}`)
      if (m.context) {
        log(`        Contexto: "...${m.context.substring(0, 80)}..."`, colors.dim)
      }
    }
  }

  if (resultados.length > maxShow) {
    log(`\n... e mais ${resultados.length - maxShow} resultados`, colors.dim)
  }
}

// Salvar resultados em arquivo
function salvarResultados(
  resultados: PublicacaoComScore[],
  criterios: Criterio[],
  data: string,
  filename: string
) {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  const output = {
    metadata: {
      data_busca: data,
      timestamp: new Date().toISOString(),
      total_publicacoes_analisadas: resultados.length,
      min_score_aplicado: minScore,
    },
    criterios: criterios.map(c => ({
      ...c,
      score_base: SCORE_MAP[c.tipo] || 0.4,
    })),
    estatisticas: {
      total_matches: resultados.length,
      score_alto: resultados.filter(r => r.scoreMaximo >= 0.7).length,
      score_medio: resultados.filter(r => r.scoreMaximo >= 0.4 && r.scoreMaximo < 0.7).length,
      score_baixo: resultados.filter(r => r.scoreMaximo < 0.4).length,
      por_tipo: {} as Record<string, number>,
    },
    resultados: resultados.map(r => ({
      titulo: r.hit.title,
      data: r.hit.pubDate,
      tipo: r.hit.artType,
      tipo_classificado: classificarTipo(r.hit.title, r.hit.content || ''),
      pagina: r.hit.numberPage,
      url: `https://www.in.gov.br/web/dou/-/${r.hit.urlTitle}`,
      score_maximo: r.scoreMaximo,
      score_medio: r.scoreMedio,
      matches: r.matches.map(m => ({
        criterio_termo: m.criterio.termo,
        criterio_tipo: m.criterio.tipo,
        score: m.score,
        match_type: m.matchType,
        contexto: m.context,
      })),
      conteudo: r.hit.content,
    })),
  }

  // Calcular estatísticas por tipo
  for (const r of resultados) {
    const tipo = classificarTipo(r.hit.title, r.hit.content || '')
    output.estatisticas.por_tipo[tipo] = (output.estatisticas.por_tipo[tipo] || 0) + 1
  }

  const filepath = `${OUTPUT_DIR}/${filename}.json`
  writeFileSync(filepath, JSON.stringify(output, null, 2), 'utf-8')
  log(`\nArquivo salvo: ${filepath}`, colors.green)
}

// Carregar critérios de arquivo de configuração
function carregarConfig(filepath: string): Criterio[] {
  const content = readFileSync(filepath, 'utf-8')
  const config = JSON.parse(content)
  return config.criterios || []
}

async function main() {
  log(`${'='.repeat(70)}`, colors.cyan)
  log(`DOU TEST MATCHING - Teste de Critérios e Relevância`, colors.cyan)
  log(`${'='.repeat(70)}`, colors.cyan)

  // Montar lista de critérios
  let criterios: Criterio[] = []

  if (configArg) {
    criterios = carregarConfig(configArg)
    log(`\nCarregados ${criterios.length} critérios do arquivo: ${configArg}`)
  } else {
    if (processoArg) {
      criterios.push({ termo: processoArg, tipo: 'numero_processo', descricao: 'Número de processo' })
    }
    if (nomeArg) {
      criterios.push({ termo: nomeArg, tipo: 'nome_parte', descricao: 'Nome da parte' })
    }
    if (oabArg) {
      criterios.push({ termo: oabArg, tipo: 'oab', descricao: 'Número OAB' })
    }
    if (termoArg) {
      criterios.push({ termo: termoArg, tipo: 'custom', descricao: 'Termo customizado' })
    }

    // Se --all, adiciona exemplos de cada tipo
    if (testAll || criterios.length === 0) {
      log(`\nModo demonstração: testando exemplos de cada tipo de critério`, colors.yellow)
      criterios = [
        { termo: '0001234-56.2024.8.26.0100', tipo: 'numero_processo', descricao: 'Exemplo processo SP' },
        { termo: '1234567', tipo: 'numero_processo', descricao: 'Número parcial' },
        { termo: 'TRIBUNAL REGIONAL', tipo: 'nome_parte', descricao: 'Nome órgão' },
        { termo: 'SP123456', tipo: 'oab', descricao: 'Exemplo OAB' },
        { termo: 'intimação', tipo: 'custom', descricao: 'Termo intimação' },
        { termo: 'citação', tipo: 'custom', descricao: 'Termo citação' },
        { termo: 'edital', tipo: 'custom', descricao: 'Termo edital' },
      ]
    }
  }

  // Tabela de scoring
  log(`\n${'─'.repeat(50)}`)
  log(`TABELA DE SCORING`, colors.bold)
  log(`${'─'.repeat(50)}`)
  log(`  Tipo                    | Score Base`)
  log(`  ------------------------|----------`)
  log(`  numero_processo (exato) | ${colors.green}1.0${colors.reset}`)
  log(`  numero_processo (parcial)| ${colors.green}0.8${colors.reset}`)
  log(`  nome_parte (exato)      | ${colors.yellow}0.7${colors.reset}`)
  log(`  oab                     | ${colors.yellow}0.6${colors.reset}`)
  log(`  nome_parte (parcial)    | ${colors.dim}0.5${colors.reset}`)
  log(`  custom                  | ${colors.dim}0.4${colors.reset}`)
  log(`${'─'.repeat(50)}`)

  // Buscar publicações
  const data = dataArg || formatDate(new Date())
  const publicacoes = await fetchPublicacoes(data)

  // Aplicar matching
  log(`\nAplicando matching com ${criterios.length} critérios...`, colors.dim)
  let resultados = aplicarMatching(publicacoes, criterios)

  // Filtrar por score mínimo
  if (minScore > 0) {
    const antes = resultados.length
    resultados = resultados.filter(r => r.scoreMaximo >= minScore)
    log(`Filtrado por score mínimo ${minScore}: ${antes} → ${resultados.length}`, colors.yellow)
  }

  // Aplicar limite
  if (limit && limit > 0) {
    resultados = resultados.slice(0, limit)
  }

  // Exibir resultados
  exibirResultados(resultados, criterios)

  // Salvar se solicitado
  if (outputArg) {
    salvarResultados(resultados, criterios, data, outputArg)
  }

  // Resumo final
  log(`\n${'='.repeat(70)}`, colors.green)
  log(`RESUMO`, colors.green)
  log(`${'='.repeat(70)}`, colors.green)
  log(`Data analisada: ${data}`)
  log(`Publicações totais: ${publicacoes.length}`)
  log(`Matches encontrados: ${resultados.length}`)
  log(`Critérios utilizados: ${criterios.length}`)
  if (minScore > 0) log(`Score mínimo: ${minScore}`)
}

main().catch(console.error)
