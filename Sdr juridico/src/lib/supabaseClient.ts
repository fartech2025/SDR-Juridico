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

export interface UsuarioRow {
  id: string
  nome_completo: string
  email: string
  telefone?: string | null
  cargo?: string | null
  departamento?: string | null
  foto_url?: string | null
  permissoes: string[]
  status?: UsuarioStatus
  ultimo_acesso?: string | null
  preferencias?: Record<string, unknown> | null
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
