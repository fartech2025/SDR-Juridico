/**
 * Cliente Supabase para a aplicação
 * Configurado com autenticação e tabelas
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.placeholder'

const hasValidCredentials = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY

if (!hasValidCredentials) {
  console.warn('⚠️ Supabase não configurado. A app funcionará em modo offline/mock.')
}

// IMPORTANTE: Sempre persistir sessão e habilitar refresh de token
// para garantir que edge functions recebam o token JWT corretamente
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'sdr-juridico-auth',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
})

// Debug helper: expõe o cliente no console do navegador durante o dev
if (typeof window !== 'undefined') {
  ;(window as any).supabase = supabase
}

export const isSupabaseConfigured = hasValidCredentials

// Tipos para as tabelas
export type LeadStatus = 'novo' | 'em_contato' | 'qualificado' | 'proposta' | 'ganho' | 'perdido'

export type CaseStatus =
  | 'aberto'
  | 'em_andamento'
  | 'resolvido'
  | 'fechado'
  | 'ativo'
  | 'suspenso'
  | 'encerrado'

export type CasePriority = 'baixa' | 'media' | 'alta' | 'critica'
export type LeadHeat = 'quente' | 'morno' | 'frio'
export type CaseStage = 'triagem' | 'negociacao' | 'em_andamento' | 'conclusao'
export type SlaRisk = 'ok' | 'atencao' | 'critico'
export type UsuarioStatus = 'ativo' | 'inativo' | 'suspenso'
export type UserRole = 'fartech_admin' | 'org_admin' | 'user'
export type TaskPriority = 'baixa' | 'normal' | 'alta'
export type TaskDifficulty = 'baixa' | 'media' | 'alta'
export type TaskStatus = 'pendente' | 'em_andamento' | 'aguardando_validacao' | 'concluida' | 'cancelada' | 'devolvida'

export interface UsuarioRow {
  id: string
  nome_completo: string
  email: string
  permissoes: string[]
  created_at: string
  updated_at?: string
}

export interface LeadRow {
  id: string
  created_at: string
  updated_at?: string
  org_id?: string | null
  nome: string | null
  email: string | null
  telefone: string | null
  area?: string | null
  origem: string | null
  status: LeadStatus
  heat: LeadHeat | string | null
  last_contact_at: string | null // Corrigido: era ultimo_contato
  assigned_user_id: string | null // Corrigido: era responsavel
  observacoes?: string | null
  assunto?: string | null
  resumo?: string | null
  // Campos legado - mantidos para compatibilidade
  empresa?: string | null
  responsavel?: string | null
  ultimo_contato?: string | null
  // Soft delete fields
  deleted_at?: string | null
  deleted_by?: string | null
}

export interface ClienteRow {
  id: string
  created_at: string
  updated_at: string
  org_id?: string | null
  nome: string
  email: string
  telefone: string | null
  empresa: string | null
  cnpj: string | null
  cpf: string | null
  endereco: string | null
  cidade: string | null
  estado: string | null
  cep: string | null
  area_atuacao: string | null
  responsavel: string | null
  status: 'ativo' | 'em_risco' | 'inativo'
  health: 'ok' | 'atencao' | 'critico' | null
  observacoes: string | null
}

export interface CasoRow {
  id: string
  created_at: string
  updated_at?: string
  org_id?: string | null
  titulo: string
  descricao: string | null
  cliente_id: string | null
  lead_id: string | null
  area: string | null
  status: CaseStatus
  prioridade: number | CasePriority
  heat: LeadHeat | string | null
  stage?: CaseStage | string | null
  fase_atual?: string | null
  valor_estimado: number | null // Corrigido: era valor
  sla_risk: SlaRisk | string | null
  tags: string[] | null
  responsavel_user_id?: string | null // Adicionado campo correto
  encerrado_em: string | null // Corrigido: era data_encerramento
  // DataJud fields
  numero_processo?: string | null
  tribunal?: string | null
  grau?: string | null
  classe_processual?: string | null
  assunto_principal?: string | null
  datajud_processo_id?: string | null
  datajud_sync_status?: string | null
  datajud_last_sync_at?: string | null
  datajud_sync_error?: string | null
  // Legado - JOINs
  cliente?: {
    nome: string | null
  } | null
  // Campos legado para compatibilidade
  valor?: number | null
  data_encerramento?: string | null
  responsavel?: string | null
  data_abertura?: string | null
}

export interface DocumentoRow {
  id: string
  created_at: string
  updated_at: string
  org_id?: string | null
  titulo: string
  descricao: string | null
  caso_id: string | null
  cliente_id: string | null
  lead_id: string | null
  cliente_nome: string | null
  tipo: string
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'solicitado' | 'completo'
  url: string | null
  arquivo_nome: string | null
  arquivo_tamanho: number | null
  mime_type: string | null
  solicitado_por: string | null
  tags: string[] | null
  // Soft delete fields
  deleted_at?: string | null
  deleted_by?: string | null
  // Campos de JOIN (opcionais)
  caso?: { titulo: string } | null
  cliente?: { nome: string } | null
  lead?: { nome: string } | null
}

export interface AgendaRow {
  id: string
  created_at: string
  updated_at: string
  org_id?: string | null
  titulo: string
  descricao: string | null
  tipo: string
  data_inicio: string
  data_fim: string
  duracao_minutos: number | null
  cliente_nome: string | null
  cliente_id: string | null
  caso_id: string | null
  lead_id: string | null
  responsavel: string | null // Mapeado do meta.responsavel
  owner_user_id?: string | null // Campo real do banco
  local: string | null
  status: 'confirmado' | 'pendente' | 'cancelado' | 'concluido'
  observacoes: string | null
  // Campos de integração externa
  external_event_id?: string | null
  external_provider?: string | null
}

export interface TarefaRow {
  id: string
  created_at: string
  org_id?: string | null
  assigned_user_id: string
  entidade?: 'lead' | 'cliente' | 'caso' | null
  entidade_id?: string | null
  titulo: string
  descricao: string | null
  priority: number | null
  status: TaskStatus
  due_at: string | null
  completed_at: string | null
  submitted_at?: string | null
  confirmed_at?: string | null
  confirmed_by?: string | null
  rejected_reason?: string | null
  dificuldade?: TaskDifficulty | null
  assignee_ids?: string[] | null
  tarefas_assignees?: Array<{ user_id: string }> | null
  // Soft delete fields
  deleted_at?: string | null
  deleted_by?: string | null
}

export interface TarefaAssigneeRow {
  id: string
  created_at: string
  org_id?: string | null
  tarefa_id: string
  user_id: string
  created_by?: string | null
}

export interface TimelineEventRow {
  id: string
  caso_id: string
  titulo: string
  descricao: string | null
  categoria: 'docs' | 'agenda' | 'comercial' | 'juridico' | 'automacao' | 'humano'
  canal: string | null
  autor: string | null
  tags: string[] | null
  data_evento: string
  created_at: string
  org_id?: string | null
}

export interface DatajudProcessoRow {
  id: string
  created_at: string
  updated_at: string
  org_id: string
  numero_processo: string
  tribunal: string
  grau?: string | null
  classe_processual?: string | null
  assunto?: string | null
  raw_response?: Record<string, unknown> | null
  cached_at?: string | null
}

export interface DatajudMovimentacaoRow {
  id: string
  created_at: string
  datajud_processo_id: string
  codigo?: string | null
  nome: string
  data_hora: string
  complemento?: string | null
  raw_response?: Record<string, unknown> | null
  detected_at?: string | null
  notified?: boolean
}

// Histórico de Status de Tarefas
export interface TarefaStatusHistoryRow {
  id: string
  created_at: string
  tarefa_id: string
  org_id: string
  status_anterior: string | null
  status_novo: string
  changed_by: string | null
  changed_by_name?: string | null
  motivo: string | null
  metadata?: Record<string, unknown> | null
}

// Histórico de Status de Leads
export interface LeadStatusHistoryRow {
  id: string
  created_at: string
  lead_id: string
  org_id: string
  status_anterior: string | null
  status_novo: string
  heat_anterior: string | null
  heat_novo: string | null
  changed_by: string | null
  changed_by_name?: string | null
  motivo: string | null
  metadata?: Record<string, unknown> | null
}
