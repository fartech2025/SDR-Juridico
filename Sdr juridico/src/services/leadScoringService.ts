/**
 * Lead Scoring Engine
 * Motor de pontuação para leads jurídicos com fatores ponderados.
 * Score 0-100 mapeado para heat: frio (0-33), morno (34-66), quente (67-100)
 */

import type { LeadHeat } from '@/types/domain'

// ============================================================================
// Types
// ============================================================================

export interface ScoreFactor {
  name: string
  label: string
  rawValue: number
  weight: number
  contribution: number
}

export interface LeadScoreResult {
  score: number
  heat: LeadHeat
  factors: ScoreFactor[]
  scoredAt: string
}

export interface LeadScoreConfig {
  recencyWeight: number
  estimatedValueWeight: number
  areaWeight: number
  channelWeight: number
  interactionWeight: number
  completenessWeight: number
}

/** Data shape the scoring engine needs — no dependency on DB row types */
export interface LeadScoringInput {
  lastContactAt?: string | null
  createdAt: string
  estimatedValue?: number | null
  area?: string | null
  origin?: string | null
  email?: string | null
  phone?: string | null
  company?: string | null
  notes?: string | null
  interactionCount?: number
}

// ============================================================================
// Defaults
// ============================================================================

export const DEFAULT_SCORE_CONFIG: LeadScoreConfig = {
  recencyWeight: 30,
  estimatedValueWeight: 20,
  areaWeight: 15,
  channelWeight: 10,
  interactionWeight: 15,
  completenessWeight: 10,
}

/** High-value legal areas for an SDR jurídico */
const HIGH_VALUE_AREAS = [
  'tributario', 'tributária', 'tributaria',
  'empresarial', 'societario', 'societária',
  'trabalhista',
  'imobiliario', 'imobiliária',
  'civil',
  'consumidor',
]

/** Channel quality ranking (higher = better qualified) */
const CHANNEL_QUALITY: Record<string, number> = {
  indicacao: 100,
  referral: 100,
  email: 80,
  telefone: 70,
  whatsapp: 60,
  webchat: 50,
  outro: 30,
  organico: 40,
}

// ============================================================================
// Factor calculators
// ============================================================================

function scoreRecency(input: LeadScoringInput): number {
  const base = input.lastContactAt || input.createdAt
  if (!base) return 0
  const diffMs = Date.now() - new Date(base).getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  if (diffDays <= 1) return 100
  if (diffDays <= 3) return 80
  if (diffDays <= 7) return 60
  if (diffDays <= 14) return 40
  if (diffDays <= 30) return 20
  return 5
}

function scoreEstimatedValue(input: LeadScoringInput): number {
  const value = input.estimatedValue
  if (!value || value <= 0) return 0
  if (value >= 100000) return 100
  if (value >= 50000) return 80
  if (value >= 20000) return 60
  if (value >= 10000) return 40
  if (value >= 5000) return 20
  return 10
}

function scoreArea(input: LeadScoringInput): number {
  const area = (input.area || '').toLowerCase().trim()
  if (!area) return 30
  const isHighValue = HIGH_VALUE_AREAS.some(
    (hv) => area.includes(hv)
  )
  return isHighValue ? 80 : 40
}

function scoreChannel(input: LeadScoringInput): number {
  const origin = (input.origin || 'outro').toLowerCase().trim()
  return CHANNEL_QUALITY[origin] ?? 30
}

function scoreInteractions(input: LeadScoringInput): number {
  const count = input.interactionCount ?? 0
  if (count >= 5) return 100
  if (count >= 3) return 70
  if (count >= 1) return 40
  return 0
}

function scoreCompleteness(input: LeadScoringInput): number {
  let filled = 0
  const total = 5
  if (input.email) filled++
  if (input.phone) filled++
  if (input.company) filled++
  if (input.area) filled++
  if (input.notes) filled++
  return Math.round((filled / total) * 100)
}

// ============================================================================
// Main scoring function
// ============================================================================

export function calculateLeadScore(
  input: LeadScoringInput,
  config: LeadScoreConfig = DEFAULT_SCORE_CONFIG
): LeadScoreResult {
  const totalWeight =
    config.recencyWeight +
    config.estimatedValueWeight +
    config.areaWeight +
    config.channelWeight +
    config.interactionWeight +
    config.completenessWeight

  if (totalWeight === 0) {
    return { score: 0, heat: 'frio', factors: [], scoredAt: new Date().toISOString() }
  }

  const rawRecency = scoreRecency(input)
  const rawValue = scoreEstimatedValue(input)
  const rawArea = scoreArea(input)
  const rawChannel = scoreChannel(input)
  const rawInteraction = scoreInteractions(input)
  const rawCompleteness = scoreCompleteness(input)

  const factors: ScoreFactor[] = [
    {
      name: 'recency',
      label: 'Recência de contato',
      rawValue: rawRecency,
      weight: config.recencyWeight,
      contribution: (rawRecency * config.recencyWeight) / totalWeight,
    },
    {
      name: 'estimatedValue',
      label: 'Valor estimado',
      rawValue: rawValue,
      weight: config.estimatedValueWeight,
      contribution: (rawValue * config.estimatedValueWeight) / totalWeight,
    },
    {
      name: 'area',
      label: 'Área jurídica',
      rawValue: rawArea,
      weight: config.areaWeight,
      contribution: (rawArea * config.areaWeight) / totalWeight,
    },
    {
      name: 'channel',
      label: 'Canal de origem',
      rawValue: rawChannel,
      weight: config.channelWeight,
      contribution: (rawChannel * config.channelWeight) / totalWeight,
    },
    {
      name: 'interactions',
      label: 'Interações',
      rawValue: rawInteraction,
      weight: config.interactionWeight,
      contribution: (rawInteraction * config.interactionWeight) / totalWeight,
    },
    {
      name: 'completeness',
      label: 'Completude do cadastro',
      rawValue: rawCompleteness,
      weight: config.completenessWeight,
      contribution: (rawCompleteness * config.completenessWeight) / totalWeight,
    },
  ]

  const score = Math.round(factors.reduce((sum, f) => sum + f.contribution, 0))

  let heat: LeadHeat
  if (score >= 67) heat = 'quente'
  else if (score >= 34) heat = 'morno'
  else heat = 'frio'

  return {
    score,
    heat,
    factors,
    scoredAt: new Date().toISOString(),
  }
}

/** Convert a LeadRow (from service layer) to a LeadScoringInput */
export function leadRowToScoringInput(row: {
  last_contact_at?: string | null
  ultimo_contato?: string | null
  created_at: string
  qualificacao?: Record<string, any> | null
  email?: string | null
  telefone?: string | null
  empresa?: string | null
  area?: string | null
  origem?: string | null
  observacoes?: string | null
}, interactionCount?: number): LeadScoringInput {
  const q = row.qualificacao || {}
  return {
    lastContactAt: row.last_contact_at || row.ultimo_contato || null,
    createdAt: row.created_at,
    estimatedValue: q.estimatedValue ?? q.valor_estimado ?? null,
    area: row.area || q.area || null,
    origin: row.origem || null,
    email: row.email || null,
    phone: row.telefone || null,
    company: row.empresa || q.empresa || null,
    notes: row.observacoes || q.observacoes || null,
    interactionCount: interactionCount ?? 0,
  }
}
