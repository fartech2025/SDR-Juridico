// src/features/dou/validation.ts
// Validacao dos dados recebidos da Edge Function e do Supabase
import { z } from 'zod'
import type { DOUPublicacao } from '@/types/domain'

/**
 * Schema para resposta da Edge Function dou-search
 */
const searchResponseSchema = z.object({
  success: z.boolean().optional(),
  data: z.array(z.record(z.string(), z.unknown())).default([]),
  source: z.string().default('unknown'),
  latency_ms: z.number().default(0),
  total_pages: z.number().optional(),
  error: z.string().optional(),
})

/**
 * Schema para publicacao do Supabase (validacao loose - aceita campos extras)
 */
const publicacaoSchema = z.object({
  id: z.string(),
  org_id: z.string(),
  caso_id: z.string().nullable().optional(),
  secao: z.string().default('DO3'),
  data_publicacao: z.string(),
  titulo: z.string(),
  conteudo: z.string().nullable().optional(),
  orgao_publicador: z.string().nullable().optional(),
  tipo_publicacao: z.string().nullable().optional(),
  url_publicacao: z.string().nullable().optional(),
  identifica: z.string().nullable().optional(),
  pagina: z.string().nullable().optional(),
  termo_encontrado: z.string().nullable().optional(),
  match_type: z.string().nullable().optional(),
  relevancia: z.number().nullable().default(0),
  lida: z.boolean().default(false),
  notificada: z.boolean().default(false),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
}).passthrough()

/**
 * Valida resposta da Edge Function dou-search.
 * Retorna dados normalizados; em caso de erro de validacao, retorna array vazio com log.
 */
export function validateSearchResponse(data: unknown): {
  data: Record<string, unknown>[]
  source: string
  latency_ms: number
} {
  const result = searchResponseSchema.safeParse(data)

  if (!result.success) {
    console.warn('[DOU Validation] Resposta da Edge Function invalida:', result.error.message)
    return { data: [], source: 'unknown', latency_ms: 0 }
  }

  if (result.data.error) {
    throw new Error(result.data.error)
  }

  return {
    data: result.data.data,
    source: result.data.source,
    latency_ms: result.data.latency_ms,
  }
}

/**
 * Valida array de publicacoes do Supabase.
 * Filtra publicacoes invalidas (sem id/titulo) e retorna as validas.
 */
export function validatePublicacoes(data: unknown[]): DOUPublicacao[] {
  const valid: DOUPublicacao[] = []

  for (const item of data) {
    const result = publicacaoSchema.safeParse(item)
    if (result.success) {
      valid.push(result.data as unknown as DOUPublicacao)
    } else {
      console.warn('[DOU Validation] Publicacao descartada:', result.error.message)
    }
  }

  return valid
}
