import { createClient, SupabaseClient } from '@supabase/supabase-js'

const fallbackUrl = 'https://mskvucuaarutehslvhsp.supabase.co'
const fallbackAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1za3Z1Y3VhYXJ1dGVoc2x2aHNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MzQzNDEsImV4cCI6MjA3NTMxMDM0MX0.ZTIrEq9tqpaBUsdgDrg9vwYyvCtXMu_IWyx_EMbMQHQ'

const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

const url = envUrl || fallbackUrl
const key = envKey || fallbackAnonKey

export const hasSupabase = Boolean(url && key)

// Singleton pattern mais robusto para evitar múltiplas instâncias
let supabaseInstance: SupabaseClient | null = null

const createSupabaseClient = (): SupabaseClient | null => {
  // Verificar se já existe uma instância global
  if (typeof window !== 'undefined' && (window as any).__supabase_client) {
    return (window as any).__supabase_client
  }
  
  if (!supabaseInstance && hasSupabase) {
    supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: false, // Desabilitar persistência para evitar conflitos
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storage: undefined // Usar storage em memória
      }
    })
    
    // Salvar instância globalmente para evitar duplicação
    if (typeof window !== 'undefined') {
      (window as any).__supabase_client = supabaseInstance
    }
  }
  return supabaseInstance
}

export const supabase = createSupabaseClient()

export const CURRENT_USER_ID = Number(import.meta.env.VITE_USER_ID ?? 1)

export const provaDurationSeconds = 5.5 * 60 * 60; // 5h30
