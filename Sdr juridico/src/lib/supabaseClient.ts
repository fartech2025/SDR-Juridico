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
export type LeadStatus =
  | 'novo'
  | 'em_triagem'
  | 'qualificado'
  | 'nao_qualificado'
  | 'convertido'
  | 'perdido'

export type CaseStatus =
  | 'aberto'
  | 'triagem'
  | 'negociacao'
  | 'contrato'
  | 'andamento'
  | 'encerrado'
  | 'arquivado'

export type TaskStatus = 'pendente' | 'em_andamento' | 'concluida' | 'cancelada'
export type ChannelType = 'whatsapp' | 'email' | 'telefone' | 'webchat' | 'outro'
export type DocumentVisibility = 'privado' | 'interno' | 'cliente'
export type UserRole = 'admin' | 'gestor' | 'advogado' | 'secretaria' | 'leitura'

export interface OrgRow {
  id: string
  created_at: string
  nome: string
  cnpj: string | null
  plano: string | null
  ativo: boolean
  settings: Record<string, unknown>
}

export interface ProfileRow {
  user_id: string
  created_at: string
  nome: string | null
  email: string | null
  telefone: string | null
  avatar_url: string | null
  metadata: Record<string, unknown>
}

export interface OrgMemberRow {
  id: string
  created_at: string
  org_id: string
  user_id: string
  role: UserRole
  ativo: boolean
}

export interface LeadRow {
  id: string
  created_at: string
  org_id?: string
  status: LeadStatus
  canal: ChannelType
  nome: string | null
  telefone: string | null
  email: string | null
  origem: string | null
  assunto: string | null
  resumo: string | null
  qualificacao: Record<string, unknown>
  assigned_user_id: string | null
  cliente_id: string | null
  remote_id: string | null
  last_contact_at: string | null
}

export interface ClienteRow {
  id: string
  created_at: string
  org_id: string
  tipo: string
  nome: string
  telefone: string | null
  documento: string | null
  email: string | null
  endereco: Record<string, unknown>
  tags: string[]
  observacoes: string | null
  owner_user_id: string | null
}

export interface CasoRow {
  id: string
  created_at: string
  org_id: string
  status: CaseStatus
  titulo: string
  area: string | null
  subarea: string | null
  descricao: string | null
  cliente_id: string | null
  lead_id: string | null
  responsavel_user_id: string | null
  prioridade: number
  valor_estimado: number | null
  fase_atual: string | null
  encerrado_em: string | null
  cliente?: {
    nome: string | null
  } | null
}

export interface DocumentoRow {
  id: string
  created_at: string
  org_id: string
  title: string
  description: string | null
  visibility: DocumentVisibility
  bucket: string
  storage_path: string
  mime_type: string | null
  size_bytes: number | null
  lead_id: string | null
  cliente_id: string | null
  caso_id: string | null
  uploaded_by: string | null
  tags: string[]
  meta: Record<string, unknown>
}

export interface AgendaRow {
  id: string
  created_at: string
  org_id: string
  title: string
  start_at: string
  end_at: string
  location: string | null
  description: string | null
  owner_user_id: string | null
  lead_id: string | null
  cliente_id: string | null
  caso_id: string | null
  external_provider: string | null
  external_event_id: string | null
  meta: Record<string, unknown>
}

export interface IntegrationRow {
  id: string
  created_at: string
  org_id: string
  provider: string
  name: string | null
  enabled: boolean
  secrets: Record<string, unknown> | null
  settings: Record<string, unknown> | null
}

export interface NotaRow {
  id: string
  created_at: string
  org_id: string
  entidade: string
  entidade_id: string
  texto: string
  created_by: string | null
  tags: string[] | null
}

export interface ConversaRow {
  id: string
  created_at: string
  org_id: string
  canal: ChannelType
  remote_id: string
  lead_id: string | null
  cliente_id: string | null
  caso_id: string | null
  aberto: boolean
  ultimo_evento_em: string | null
  humano_na_conversa: boolean
  bloqueado: boolean
  expirar_bloqueado: string | null
}

export interface MensagemRow {
  id: string
  created_at: string
  org_id: string
  conversa_id: string
  direction: string
  from_remote: string | null
  to_remote: string | null
  body: string | null
  payload: Record<string, unknown> | null
  provider_msg_id: string | null
  delivered_at: string | null
  read_at: string | null
}
