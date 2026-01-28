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

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: hasValidCredentials,
    autoRefreshToken: hasValidCredentials,
    detectSessionInUrl: hasValidCredentials,
  },
})

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
export type TaskStatus = 'pendente' | 'em_progresso' | 'aguardando_validacao' | 'concluida' | 'devolvida'

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
  updated_at: string
  org_id?: string | null
  nome: string
  email: string
  telefone: string | null
  empresa: string | null
  area: string | null
  origem: string | null
  status: LeadStatus
  heat: LeadHeat
  ultimo_contato: string | null
  responsavel: string | null
  observacoes: string | null
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
  updated_at: string
  org_id?: string | null
  titulo: string
  descricao: string | null
  cliente_id: string | null
  lead_id: string | null
  area: string
  status: CaseStatus
  prioridade: CasePriority
  heat: LeadHeat | null
  stage: CaseStage | null
  valor: number | null
  sla_risk: SlaRisk | null
  tags: string[] | null
  responsavel: string | null
  data_abertura: string | null
  data_encerramento: string | null
  cliente?: {
    nome: string | null
  } | null
}

export interface DocumentoRow {
  id: string
  created_at: string
  updated_at: string
  org_id?: string | null
  titulo: string
  descricao: string | null
  caso_id: string | null
  cliente_nome: string | null
  tipo: string
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'solicitado' | 'completo'
  url: string | null
  arquivo_nome: string | null
  arquivo_tamanho: number | null
  mime_type: string | null
  solicitado_por: string | null
  tags: string[] | null
}

export interface AgendaRow {
  id: string
  created_at: string
  updated_at: string
  titulo: string
  descricao: string | null
  tipo: string
  data_inicio: string
  data_fim: string
  duracao_minutos: number | null
  cliente_nome: string | null
  cliente_id: string | null
  caso_id: string | null
  responsavel: string
  local: string | null
  status: 'confirmado' | 'pendente' | 'cancelado' | 'concluido'
  observacoes: string | null
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
  org_id?: string | null
  numero_processo: string
  tribunal: string | null
  classe: string | null
  area: string | null
  caso_id: string | null
  cliente_id: string | null
  last_sync_at: string | null
  payload: Record<string, unknown> | null
}

export interface DatajudMovimentacaoRow {
  id: string
  created_at: string
  org_id?: string | null
  processo_id: string
  data_movimentacao: string | null
  descricao: string | null
  codigo: string | null
  payload: Record<string, unknown> | null
}
