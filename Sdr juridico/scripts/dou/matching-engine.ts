// scripts/dou/matching-engine.ts
import type { DOUHit, DOUMatchResult, DOUTermo, DOUTipoPublicacao } from './types'

/**
 * Verifica se uma publicação contém o termo buscado
 */
export function matchTermo(
  publicacao: { titulo?: string; conteudo?: string; title?: string; content?: string },
  termo: DOUTermo
): DOUMatchResult {
  const titulo = (publicacao.titulo || publicacao.title || '').toLowerCase()
  const conteudo = (publicacao.conteudo || publicacao.content || '').toLowerCase()
  const textoCompleto = `${titulo} ${conteudo}`
  const termoBusca = termo.termo.toLowerCase().trim()

  switch (termo.tipo) {
    case 'numero_processo':
      return matchNumeroProcesso(textoCompleto, termoBusca)
    case 'nome_parte':
      return matchNomeParte(textoCompleto, termoBusca)
    case 'oab':
      return matchOAB(textoCompleto, termoBusca)
    case 'custom':
    default:
      return matchCustom(textoCompleto, termoBusca)
  }
}

function matchNumeroProcesso(texto: string, termo: string): DOUMatchResult {
  // Busca exata com formatação (ex: 1234567-89.2024.8.26.0100)
  if (texto.includes(termo)) {
    return { matched: true, score: 1.0, matchType: 'numero_processo' }
  }

  // Busca apenas dígitos (sem pontos e traços)
  const soDigitos = termo.replace(/\D/g, '')
  if (soDigitos.length >= 10) {
    const textoDigitos = texto.replace(/\D/g, '')
    if (textoDigitos.includes(soDigitos)) {
      return { matched: true, score: 0.8, matchType: 'numero_processo' }
    }
  }

  return { matched: false, score: 0, matchType: 'numero_processo' }
}

function matchNomeParte(texto: string, termo: string): DOUMatchResult {
  // Busca nome completo
  if (texto.includes(termo)) {
    return { matched: true, score: 0.7, matchType: 'nome_parte' }
  }

  // Busca parcial: pelo menos 60% das palavras com mais de 2 chars
  const palavras = termo.split(/\s+/).filter(p => p.length > 2)
  if (palavras.length >= 2) {
    const encontradas = palavras.filter(p => texto.includes(p))
    if (encontradas.length >= 2 && encontradas.length >= palavras.length * 0.6) {
      return { matched: true, score: 0.5, matchType: 'nome_parte' }
    }
  }

  return { matched: false, score: 0, matchType: 'nome_parte' }
}

function matchOAB(texto: string, termo: string): DOUMatchResult {
  // Regex para OAB com UF e número
  const oabRegex = /oab[\s/]*[a-z]{2}[\s]*\d+/i
  if (oabRegex.test(texto) && texto.includes(termo)) {
    return { matched: true, score: 0.6, matchType: 'oab' }
  }

  // Busca direta do termo
  if (texto.includes(termo)) {
    return { matched: true, score: 0.6, matchType: 'oab' }
  }

  return { matched: false, score: 0, matchType: 'oab' }
}

function matchCustom(texto: string, termo: string): DOUMatchResult {
  if (texto.includes(termo)) {
    return { matched: true, score: 0.4, matchType: 'custom' }
  }
  return { matched: false, score: 0, matchType: 'custom' }
}

/**
 * Classifica o tipo de publicação com base no conteúdo
 */
export function classificarTipo(titulo: string, conteudo: string): DOUTipoPublicacao {
  const texto = `${titulo} ${conteudo}`.toLowerCase()
  if (texto.includes('intimação') || texto.includes('intimar') || texto.includes('intimacao')) return 'intimacao'
  if (texto.includes('citação') || texto.includes('citar') || texto.includes('citacao')) return 'citacao'
  if (texto.includes('edital')) return 'edital'
  if (texto.includes('despacho')) return 'despacho'
  if (texto.includes('sentença') || texto.includes('sentenca')) return 'sentenca'
  return 'outro'
}
