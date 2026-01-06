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
export interface Leads {
  id: string
  nome: string
  email: string
  telefone: string
  empresa: string
  status: 'novo' | 'em_contato' | 'qualificado' | 'proposta' | 'ganho' | 'perdido'
  heat: 'quente' | 'morno' | 'frio'
  created_at: string
  updated_at: string
}

export interface Clientes {
  id: string
  nome: string
  email: string
  telefone: string
  empresa: string
  cnpj: string
  responsavel: string
  created_at: string
  updated_at: string
}

export interface Casos {
  id: string
  titulo: string
  descricao: string
  cliente_id: string
  status: 'aberto' | 'em_andamento' | 'resolvido' | 'fechado'
  prioridade: 'baixa' | 'media' | 'alta' | 'critica'
  created_at: string
  updated_at: string
}

export interface Documentos {
  id: string
  titulo: string
  descricao: string
  caso_id: string
  url: string
  tipo: string
  status: 'pendente' | 'completo'
  created_at: string
  updated_at: string
}

export interface Agenda {
  id: string
  titulo: string
  descricao: string
  data_inicio: string
  data_fim: string
  tipo: 'reuniao' | 'ligacao' | 'visita'
  created_at: string
  updated_at: string
}
