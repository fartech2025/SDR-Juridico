export type LeadStatus =
  | 'novo'
  | 'em_contato'
  | 'qualificado'
  | 'proposta'
  | 'ganho'
  | 'perdido'

export type LeadHeat = 'frio' | 'morno' | 'quente'

export interface Lead {
  id: string
  name: string
  email: string
  phone: string
  area: string
  origin: string
  status: LeadStatus
  heat: LeadHeat
  createdAt: string
  lastContactAt?: string
  owner: string
}

export type CasoStatus = 'ativo' | 'suspenso' | 'encerrado'
export type CasoStage = 'triagem' | 'negociacao' | 'em_andamento' | 'conclusao'

export interface Caso {
  id: string
  title: string
  cliente: string
  area: string
  status: CasoStatus
  heat: LeadHeat
  stage: CasoStage
  value: number
  createdAt: string
  updatedAt: string
  leadId?: string
  tags: string[]
  slaRisk: 'ok' | 'atencao' | 'critico'
}

export type DocumentoStatus = 'pendente' | 'aprovado' | 'rejeitado' | 'solicitado'

export interface Documento {
  id: string
  title: string
  cliente: string
  casoId?: string
  type: string
  status: DocumentoStatus
  createdAt: string
  updatedAt: string
  requestedBy: string
  tags: string[]
}

export type AgendaStatus = 'confirmado' | 'pendente' | 'cancelado'

export interface AgendaItem {
  id: string
  title: string
  type: string
  date: string
  time: string
  durationMinutes: number
  cliente: string
  casoId?: string
  owner: string
  location: string
  status: AgendaStatus
}

export type TimelineCategory =
  | 'docs'
  | 'agenda'
  | 'comercial'
  | 'juridico'
  | 'automacao'
  | 'humano'

export interface TimelineEvent {
  id: string
  casoId: string
  title: string
  category: TimelineCategory
  channel: string
  date: string
  description: string
  tags: string[]
  author: string
}

export type NotificationPriority = 'P0' | 'P1' | 'P2'

export interface Notification {
  id: string
  title: string
  description: string
  priority: NotificationPriority
  date: string
  actionLabel?: string
  actionHref?: string
  read: boolean
}

export interface KPI {
  id: string
  label: string
  value: number
  delta: number
  trend: 'up' | 'down' | 'flat'
  period: string
}

export interface MonthlyMetric {
  month: string
  leads: number
  closed: number
}

export interface FunnelStage {
  id: string
  label: string
  value: number
}

export type IntegrationStatus = 'mock' | 'connected' | 'disconnected'

export interface Integration {
  id: string
  name: string
  description: string
  status: IntegrationStatus
  settings?: Record<string, unknown> | null
}

export interface Insight {
  id: string
  title: string
  description: string
  trend: 'up' | 'down' | 'flat'
  value: string
}

export interface Goal {
  id: string
  label: string
  progress: number
  target: number
  unit?: string
}

export type ClienteStatus = 'ativo' | 'em_risco' | 'inativo'
export type ClienteHealth = 'ok' | 'atencao' | 'critico'

export interface Cliente {
  id: string
  name: string
  area: string
  status: ClienteStatus
  health: ClienteHealth
  caseCount: number
  owner: string
  lastUpdate: string
}
