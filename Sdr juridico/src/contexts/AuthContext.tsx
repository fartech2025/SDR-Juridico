import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'

interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: Error }>
  signInWithGoogle: () => Promise<{ error?: Error }>
  signUp: (email: string, password: string) => Promise<{ error?: Error }>
  signOut: () => Promise<{ error?: Error }>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // Se Supabase não está configurado, pula a inicialização
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    // Configuração de auth com tempo suficiente para processar tokens da URL
    const init = async () => {
      try {
        // Timeout maior (5s) para permitir processamento de tokens de convite/email
        const sessionPromise = supabase.auth.getSession().catch(() => ({ data: { session: null } }))
        const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
          setTimeout(() => resolve({ data: { session: null } }), 5000)
        )
        
        const result = await Promise.race([sessionPromise, timeoutPromise])
        
        if (mounted) {
          setSession(result.data.session)
          setUser(result.data.session?.user ?? null)
          setLoading(false)
        }
      } catch (error) {
        console.warn('Auth initialization skipped:', error)
        if (mounted) {
          setSession(null)
          setUser(null)
          setLoading(false)
        }
      }
    }

    // Listener de mudanças de auth
    const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (mounted) {
        setSession(newSession)
        setUser(newSession?.user ?? null)

        // NOTA: NÃO salvar provider_token do Supabase Auth no localStorage
        // O token do login social pertence ao projeto GCP do Supabase (450955346215)
        // e NÃO tem a Calendar API ativada. O token correto para Google Calendar
        // é obtido via OAuth customizado (Edge Function google-calendar-oauth)
        // e fica salvo na tabela integrations ou no user_metadata.
      }
    })

    init()

    return () => {
      mounted = false
      authListener?.subscription?.unsubscribe?.()
    }
  }, [])

  const value: AuthContextValue = useMemo(() => ({
    user,
    session,
    loading,
    async signIn(email: string, password: string) {
      if (!isSupabaseConfigured) {
        return { error: new Error('Supabase não configurado') }
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error: error ?? undefined }
    },
    async signInWithGoogle() {
      if (!isSupabaseConfigured) {
        return { error: new Error('Supabase não configurado') }
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })
      return { error: error ?? undefined }
    },
    async signUp(email: string, password: string) {
      if (!isSupabaseConfigured) {
        return { error: new Error('Supabase não configurado') }
      }
      const { error } = await supabase.auth.signUp({ email, password })
      return { error: error ?? undefined }
    },
    async signOut() {
      if (!isSupabaseConfigured) {
        return { error: undefined }
      }
      const { error } = await supabase.auth.signOut()
      return { error: error ?? undefined }
    },
  }), [user, session, loading])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
