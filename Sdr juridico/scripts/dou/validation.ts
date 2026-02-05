// scripts/dou/validation.ts
// Validacao dos dados externos recebidos do DOU (HTML parsing)
import { z } from 'zod'
import { logger } from './logger'
import type { DOUHit } from './types'

/**
 * Schema para hit da busca publica (in.gov.br/consulta/-/buscar/dou)
 * Dados extraidos do HTML via regex - podem vir incompletos
 */
const douHitSchema = z.object({
  title: z.string().min(1, 'Hit sem titulo'),
  urlTitle: z.string().default(''),
  content: z.string().default(''),
  pubDate: z.string().min(1, 'Hit sem data de publicacao'),
  pubName: z.string().default('DO3'),
  artType: z.string().default(''),
  artCategory: z.string().default(''),
  numberPage: z.string().default(''),
  editionNumber: z.string().default(''),
  hierarchyList: z.array(z.string()).optional(),
  classPK: z.string().optional(),
  identifica: z.string().optional(),
})

/**
 * Schema para item do leiturajornal (in.gov.br/leiturajornal)
 * JSON embutido no HTML - mais estruturado que a busca publica
 */
const leiturajornalItemSchema = z.object({
  urlTitle: z.string().default(''),
  title: z.string().default(''),
  content: z.string().default(''),
  pubDate: z.string().default(''),
  pubName: z.string().default('DO3'),
  artType: z.string().default(''),
  artCategory: z.string().default(''),
  numberPage: z.string().default(''),
  editionNumber: z.string().default(''),
}).passthrough()

/**
 * Schema para resposta parseada da busca publica
 */
const searchResultSchema = z.object({
  hits: z.array(z.unknown()).default([]),
  totalPages: z.number().default(0),
  currentPage: z.number().default(1),
})

/**
 * Valida array de hits da busca publica do DOU.
 * Retorna apenas os hits validos (com titulo e data), descartando os invalidos.
 */
export function validateDOUHits(rawHits: unknown[]): DOUHit[] {
  const valid: DOUHit[] = []
  let discarded = 0

  for (const hit of rawHits) {
    const result = douHitSchema.safeParse(hit)
    if (result.success) {
      valid.push(result.data as DOUHit)
    } else {
      discarded++
    }
  }

  if (discarded > 0) {
    logger.warn(`[Validation] ${discarded} hit(s) descartado(s) por dados invalidos`)
  }

  return valid
}

/**
 * Valida items do leiturajornal e converte para DOUHit.
 */
export function validateLeiturajornalItems(rawItems: unknown[]): DOUHit[] {
  const valid: DOUHit[] = []
  let discarded = 0

  for (const item of rawItems) {
    const result = leiturajornalItemSchema.safeParse(item)
    if (result.success) {
      const d = result.data
      // Requer ao menos titulo ou content para ser util
      if (!d.title && !d.content) {
        discarded++
        continue
      }
      valid.push({
        title: d.title || 'Sem titulo',
        urlTitle: d.urlTitle,
        content: d.content,
        pubDate: d.pubDate,
        pubName: d.pubName,
        artType: d.artType,
        artCategory: d.artCategory,
        numberPage: d.numberPage,
        editionNumber: d.editionNumber,
      })
    } else {
      discarded++
    }
  }

  if (discarded > 0) {
    logger.warn(`[Validation] ${discarded} item(ns) leiturajornal descartado(s)`)
  }

  return valid
}

/**
 * Valida a resposta parseada do HTML de busca publica.
 */
export function validateSearchResult(raw: unknown): {
  hits: unknown[]
  totalPages: number
  currentPage: number
} {
  const result = searchResultSchema.safeParse(raw)
  if (!result.success) {
    logger.warn('[Validation] Resposta de busca invalida:', result.error.message)
    return { hits: [], totalPages: 0, currentPage: 1 }
  }
  return result.data
}

/**
 * Valida dados antes de persistir no Supabase.
 * Verifica campos obrigatorios e sanitiza strings.
 */
export function validateBeforePersist(data: {
  orgId: string
  titulo: string
  dataPub: string
  conteudo?: string
}): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data.orgId || data.orgId.length < 10) {
    errors.push('org_id invalido')
  }

  if (!data.titulo || data.titulo.trim().length === 0) {
    errors.push('titulo vazio')
  }

  if (!data.dataPub) {
    errors.push('data de publicacao ausente')
  } else {
    // Verificar se e uma data valida (ISO ou DD/MM/YYYY)
    const isoMatch = /^\d{4}-\d{2}-\d{2}$/.test(data.dataPub)
    const brMatch = /^\d{2}\/\d{2}\/\d{4}$/.test(data.dataPub)
    const brDashMatch = /^\d{2}-\d{2}-\d{4}$/.test(data.dataPub)
    if (!isoMatch && !brMatch && !brDashMatch) {
      errors.push(`formato de data invalido: ${data.dataPub}`)
    }
  }

  if (data.conteudo && data.conteudo.length > 100000) {
    errors.push('conteudo excede 100KB - sera truncado')
  }

  if (errors.length > 0) {
    logger.warn(`[Validation] Dados para persistencia: ${errors.join(', ')}`)
  }

  return { valid: errors.length === 0, errors }
}
