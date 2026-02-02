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
export type DataJudSyncStatus = 'nunca_sincronizado' | 'sincronizado' | 'em_erro' | 'pendente_sync'

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
  // DataJud fields
  numero_processo?: string
  tribunal?: string
  grau?: string
  classe_processual?: string
  assunto_principal?: string
  datajud_processo_id?: string
  datajud_sync_status?: DataJudSyncStatus
  datajud_last_sync_at?: string
  datajud_sync_error?: string
}

export type DocumentoStatus = 'pendente' | 'aprovado' | 'rejeitado' | 'solicitado' | 'completo'

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

export type AgendaStatus = 'confirmado' | 'pendente' | 'cancelado' | 'concluido'

export interface AgendaItem {
  id: string
  title: string
  type: string
  tipo?: string
  date: string
  time: string
  durationMinutes: number
  cliente: string
  casoId?: string
  owner: string
  location: string
  status: AgendaStatus
}

export type TaskPriority = 'baixa' | 'normal' | 'alta'
export type TaskStatus = 'pendente' | 'em_andamento' | 'aguardando_validacao' | 'concluida' | 'cancelada' | 'devolvida'

export interface Tarefa {
  id: string
  title: string
  description?: string | null
  priority: TaskPriority
  status: TaskStatus
  dueDate?: string | null
  createdAt: string
  completedAt?: string | null
  ownerId: string
  submittedAt?: string | null
  confirmedAt?: string | null
  confirmedBy?: string | null
  rejectedReason?: string | null
  leadId?: string | null
  clienteId?: string | null
  casoId?: string | null
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

// ========================================
// DataJud Related Types
// ========================================

export type Tribunal = 'trf' | 'trt' | 'tre' | 'stj' | 'tst' | 'stf' | 'oab'

export interface DataJudProcesso {
  id: string
  numero_processo: string
  tribunal: Tribunal | string
  grau?: string
  classe_processual?: string
  assunto?: string
  dataAjuizamento?: string
  dataAtualizacao?: string
  sigiloso?: boolean
  raw_response?: Record<string, unknown>
  cached_at: string
  org_id: string
  created_at: string
  updated_at: string
}

export interface DataJudMovimento {
  id: string
  datajud_processo_id: string
  codigo?: string
  nome: string
  data_hora: string
  complemento?: string
  raw_response?: Record<string, unknown>
  detected_at: string
  notified: boolean
  created_at: string
}

export interface DataJudApiCall {
  id: string
  user_id: string
  org_id: string
  action: 'search' | 'link' | 'unlink' | 'sync'
  tribunal?: string
  search_query?: string
  resultado_count?: number
  api_latency_ms?: number
  status_code?: number
  error_message?: string
  ip_address?: string
  user_agent?: string
  created_at: string
}

export interface DataJudSyncJob {
  id: string
  caso_id: string
  org_id: string
  status: 'pendente' | 'em_progresso' | 'sucesso' | 'erro'
  tentativas: number
  proximo_retry?: string
  erro_mensagem?: string
  resultado?: Record<string, unknown>
  started_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface DataJudSearchResponse {
  hits: {
    total: { value: number }
    hits: Array<{
      _source: {
        numeroProcesso: string
        classe: string
        assunto: string
        tribunal: string
        orgaoJulgador: string
        dataAjuizamento?: string
        dataAtualizacao?: string
        grau?: string
        nivelSigilo?: string
        dadosBasicos?: Record<string, unknown>
        movimentos?: Array<{
          codigo: string
          nome: string
          dataHora: string
          complemento?: string
        }>
      }
    }>
  }
}

export interface DataJudSearchParams {
  tribunal: Tribunal | string
  searchType: 'numero' | 'parte' | 'classe' | 'avancada'
  query: string
  clienteId?: string
  casosId?: string
  pagina?: number
}

