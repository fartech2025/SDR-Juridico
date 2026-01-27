# 🔗 Guia de Integração - Frontend com Supabase

---

## 1. INSTALAÇÃO

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-react
```

---

## 2. ESTRUTURA DE DIRETÓRIOS

```
src/
├── lib/
│   ├── supabaseClient.ts       # Cliente Supabase
│   └── database.types.ts       # Types gerados automaticamente
├── hooks/
│   ├── useAuth.ts              # Hook de autenticação
│   ├── useCasos.ts             # Hook de casos
│   ├── useClientes.ts          # Hook de clientes
│   ├── useLeads.ts             # Hook de leads
│   └── useAsync.ts             # Hook para async operations
├── services/
│   ├── authService.ts          # Login/logout/signup
│   ├── casosService.ts         # CRUD casos
│   ├── clientesService.ts      # CRUD clientes
│   ├── documentosService.ts    # Upload/download docs
│   ├── leadsService.ts         # CRUD leads
│   ├── agendaService.ts        # CRUD agenda
│   └── dashboardService.ts     # KPIs e indicadores
├── types/
│   ├── domain.ts               # Types de domínio
│   └── api.ts                  # Types de API
└── contexts/
    └── AuthContext.tsx         # Context de autenticação
```

---

## 3. CLIENTE SUPABASE

### Arquivo: `src/lib/supabaseClient.ts`
```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    db: {
      schema: 'public',
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
)

// Função helper para tratamento de erros
export const handleSupabaseError = (error: any) => {
  if (!error) return null
  
  const message = error.message || error.error_description || 'Erro desconhecido'
  console.error('Supabase Error:', message)
  
  return message
}
```

---

## 4. CONTEXT DE AUTENTICAÇÃO

### Arquivo: `src/contexts/AuthContext.tsx`
```typescript
import { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, fullName: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restaurar sessão ao carregar
    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        setSession(session)
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('Erro ao restaurar sessão:', error)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw new Error(error.message)
  }

  const signup = async (email: string, password: string, fullName: string) => {
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
    if (error) throw new Error(error.message)
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(error.message)
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw new Error(error.message)
  }

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    if (error) throw new Error(error.message)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        login,
        signup,
        logout,
        resetPassword,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}
```

---

## 5. HOOK DE AUTENTICAÇÃO

### Arquivo: `src/hooks/useAuth.ts`
```typescript
import { useContext } from 'react'
import { AuthContext } from '@/contexts/AuthContext'

export const useAuthHook = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthHook deve ser usado dentro de AuthProvider')
  }
  return context
}
```

---

## 6. SERVIÇOS DE API

### Arquivo: `src/services/casosService.ts`
```typescript
import { supabase, handleSupabaseError } from '@/lib/supabaseClient'
import type { Database } from '@/lib/database.types'

type Caso = Database['public']['Tables']['casos']['Row']
type InsertCaso = Database['public']['Tables']['casos']['Insert']
type UpdateCaso = Database['public']['Tables']['casos']['Update']

export const casosService = {
  // Listar casos do usuário
  async listar(userId: string) {
    const { data, error } = await supabase
      .from('casos')
      .select('*')
      .eq('usuario_id', userId)
      .order('criado_em', { ascending: false })

    if (error) throw new Error(handleSupabaseError(error))
    return data as Caso[]
  },

  // Obter caso por ID
  async obter(casoId: string) {
    const { data, error } = await supabase
      .from('casos')
      .select('*')
      .eq('id', casoId)
      .single()

    if (error) throw new Error(handleSupabaseError(error))
    return data as Caso
  },

  // Criar novo caso
  async criar(usuarioId: string, caso: InsertCaso) {
    const { data, error } = await supabase
      .from('casos')
      .insert([{ ...caso, usuario_id: usuarioId }])
      .select()
      .single()

    if (error) throw new Error(handleSupabaseError(error))
    return data as Caso
  },

  // Atualizar caso
  async atualizar(casoId: string, updates: UpdateCaso) {
    const { data, error } = await supabase
      .from('casos')
      .update(updates)
      .eq('id', casoId)
      .select()
      .single()

    if (error) throw new Error(handleSupabaseError(error))
    return data as Caso
  },

  // Deletar caso
  async deletar(casoId: string) {
    const { error } = await supabase
      .from('casos')
      .delete()
      .eq('id', casoId)

    if (error) throw new Error(handleSupabaseError(error))
  },

  // Listar casos por status
  async listarPorStatus(userId: string, status: string) {
    const { data, error } = await supabase
      .from('casos')
      .select('*')
      .eq('usuario_id', userId)
      .eq('status', status)
      .order('criado_em', { ascending: false })

    if (error) throw new Error(handleSupabaseError(error))
    return data as Caso[]
  },

  // Contar casos por status
  async contarPorStatus(userId: string) {
    const { data, error } = await supabase
      .rpc('contar_casos_por_status', { usuario_id_param: userId })

    if (error) throw new Error(handleSupabaseError(error))
    return data
  },
}
```

### Arquivo: `src/services/documentosService.ts`
```typescript
import { supabase, handleSupabaseError } from '@/lib/supabaseClient'
import type { Database } from '@/lib/database.types'

type Documento = Database['public']['Tables']['documentos']['Row']

export const documentosService = {
  // Upload de documento
  async upload(
    casoId: string,
    usuarioId: string,
    file: File,
    titulo: string,
    tipo: string
  ) {
    // 1. Upload do arquivo para Storage
    const fileName = `${usuarioId}/${casoId}/${Date.now()}-${file.name}`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documentos-casos')
      .upload(fileName, file)

    if (uploadError) throw new Error(handleSupabaseError(uploadError))

    // 2. Registrar documento no banco
    const { data, error } = await supabase
      .from('documentos')
      .insert([
        {
          caso_id: casoId,
          usuario_id: usuarioId,
          titulo,
          tipo,
          storage_path: uploadData.path,
          nome_arquivo: file.name,
          tamanho_bytes: file.size,
          mime_type: file.type,
        },
      ])
      .select()
      .single()

    if (error) throw new Error(handleSupabaseError(error))
    return data as Documento
  },

  // Listar documentos de um caso
  async listarPorCaso(casoId: string) {
    const { data, error } = await supabase
      .from('documentos')
      .select('*')
      .eq('caso_id', casoId)
      .order('criado_em', { ascending: false })

    if (error) throw new Error(handleSupabaseError(error))
    return data as Documento[]
  },

  // Gerar URL de download
  async obterUrlDownload(storagePath: string) {
    const { data } = supabase.storage
      .from('documentos-casos')
      .getPublicUrl(storagePath)

    return data.publicUrl
  },

  // Deletar documento
  async deletar(documentoId: string, storagePath: string) {
    // 1. Deletar arquivo do Storage
    const { error: deleteStorageError } = await supabase.storage
      .from('documentos-casos')
      .remove([storagePath])

    if (deleteStorageError) throw new Error(handleSupabaseError(deleteStorageError))

    // 2. Deletar registro do banco
    const { error } = await supabase
      .from('documentos')
      .delete()
      .eq('id', documentoId)

    if (error) throw new Error(handleSupabaseError(error))
  },
}
```

### Arquivo: `src/services/dashboardService.ts`
```typescript
import { supabase, handleSupabaseError } from '@/lib/supabaseClient'

export const dashboardService = {
  // Obter KPIs
  async obterKPIs(userId: string) {
    const { data, error } = await supabase
      .rpc('obter_kpis_dashboard', { usuario_id_param: userId })
      .single()

    if (error) throw new Error(handleSupabaseError(error))
    return data
  },

  // Obter casos próximos ao prazo
  async obterProximosPrazos(userId: string, dias: number = 7) {
    const { data, error } = await supabase
      .from('casos')
      .select('*')
      .eq('usuario_id', userId)
      .gte('prazo_proximo_passo', new Date().toISOString().split('T')[0])
      .lte('prazo_proximo_passo', new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('prazo_proximo_passo', { ascending: true })

    if (error) throw new Error(handleSupabaseError(error))
    return data
  },

  // Obter atividades recentes
  async obterAtividadesRecentes(userId: string) {
    const { data, error } = await supabase
      .from('contatos')
      .select('*, casos(titulo)')
      .eq('usuario_id', userId)
      .order('data_hora', { ascending: false })
      .limit(10)

    if (error) throw new Error(handleSupabaseError(error))
    return data
  },
}
```

---

## 7. HOOKS CUSTOMIZADOS

### Arquivo: `src/hooks/useAsync.ts`
```typescript
import { useEffect, useState } from 'react'

interface UseAsyncState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate: boolean = true
) {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  })

  const execute = async () => {
    setState({ data: null, loading: true, error: null })
    try {
      const response = await asyncFunction()
      setState({ data: response, loading: false, error: null })
      return response
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      })
      throw error
    }
  }

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [immediate])

  return { ...state, execute }
}

// Hook para casos
export function useCasos(userId: string | null) {
  const { casosService } = await import('@/services/casosService')
  
  return useAsync(
    () => (userId ? casosService.listar(userId) : Promise.resolve([])),
    !!userId
  )
}
```

---

## 8. PROTECTED ROUTE

### Arquivo: `src/components/ProtectedRoute.tsx`
```typescript
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <div>Carregando...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
```

---

## 9. INTEGRAÇÃO NA APLICAÇÃO

### Arquivo: `src/main.tsx` (Atualizado)
```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from '@/App'
import { AuthProvider } from '@/contexts/AuthContext'
import { applyThemeTokens } from '@/theme/applyTokens'
import '@/index.css'

applyThemeTokens()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
```

### Arquivo: `src/app/router.tsx` (Exemplo com Protected Routes)
```typescript
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AuthLayout } from '@/layouts/AuthLayout'
import { AppLayout } from '@/layouts/AppLayout'

// Pages
import { LoginPage } from '@/pages/LoginPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { CasosPage } from '@/pages/CasosPage'
import { ClientesPage } from '@/pages/ClientesPage'
import { DocumentosPage } from '@/pages/DocumentosPage'
import { LeadsPage } from '@/pages/LeadsPage'
import { AgendaPage } from '@/pages/AgendaPage'
import { IndicadoresPage } from '@/pages/IndicadoresPage'
import { ConfigPage } from '@/pages/ConfigPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/app/dashboard" replace />,
  },
  {
    path: '/login',
    element: <AuthLayout><LoginPage /></AuthLayout>,
  },
  {
    path: '/forgot-password',
    element: <AuthLayout><ForgotPasswordPage /></AuthLayout>,
  },
  {
    path: '/reset-password',
    element: <AuthLayout><ResetPasswordPage /></AuthLayout>,
  },
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'casos',
        element: <CasosPage />,
      },
      {
        path: 'clientes',
        element: <ClientesPage />,
      },
      {
        path: 'documentos',
        element: <DocumentosPage />,
      },
      {
        path: 'leads',
        element: <LeadsPage />,
      },
      {
        path: 'agenda',
        element: <AgendaPage />,
      },
      {
        path: 'indicadores',
        element: <IndicadoresPage />,
      },
      {
        path: 'config',
        element: <ConfigPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
```

---

## 10. EXEMPLO: ATUALIZAR LoginPage.tsx

```typescript
import * as React from 'react'
import { CheckCircle2, Lock, Mail } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import logoMark from '@/assets/logo-mark.svg'
import { AuthLayout } from '@/layouts/AuthLayout'

export const LoginPage = () => {
  const navigate = useNavigate()
  const { login, loading } = useAuth() // 👈 Usar hook real
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'error'>(
    'idle',
  )

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('loading')

    try {
      // Validação básica
      if (!email.trim() || !password.trim()) {
        setStatus('error')
        toast.error('Credenciais obrigatórias.')
        return
      }

      // Chamar serviço real de autenticação
      await login(email, password) // 👈 Autenticação real com Supabase
      
      setStatus('idle')
      toast.success('Acesso liberado.')
      navigate('/app/dashboard')
    } catch (error) {
      setStatus('error')
      const message = error instanceof Error ? error.message : 'Erro ao fazer login'
      toast.error(message)
    }
  }

  return (
    <AuthLayout title="LOGIN" sideTitle="Não é membro ainda?" sideSubtitle="">
      <div className="flex items-center gap-3">
        <img src={logoMark} alt="Logo" className="h-10 w-10" />
      </div>

      <h2 className="mt-6 text-2xl font-semibold text-(--auth-text)">
        10.000 advogados ajudam <span className="font-bold">15 mil</span> usuários
        por mês no SDR Jurídico
      </h2>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-(--auth-text-muted)">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-(--auth-text-muted)" />
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white pl-10 pr-4 py-2 text-sm rounded-lg border border-border"
              disabled={status === 'loading'}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-(--auth-text-muted)">
            Senha
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-(--auth-text-muted)" />
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white pl-10 pr-4 py-2 text-sm rounded-lg border border-border"
              disabled={status === 'loading'}
            />
          </div>
        </div>

        {status === 'error' && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            Falha ao fazer login. Verifique suas credenciais.
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full bg-primary text-white py-2 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {status === 'loading' ? 'Entrando...' : 'Entrar'}
        </button>

        {status === 'idle' && (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle2 className="h-4 w-4" />
            Conectado com Supabase
          </div>
        )}
      </form>

      <div className="mt-6 flex gap-3">
        <a
          href="/forgot-password"
          className="text-xs text-primary hover:underline"
        >
          Esqueceu a senha?
        </a>
      </div>
    </AuthLayout>
  )
}
```

---

## 11. REALTIME SUBSCRIPTIONS (Opcional)

```typescript
// Exemplo: Escutar mudanças em casos em tempo real
const setupRealtimeListener = (userId: string) => {
  const subscription = supabase
    .channel(`casos:usuario_id=eq.${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'casos',
        filter: `usuario_id=eq.${userId}`,
      },
      (payload) => {
        console.log('Mudança detectada:', payload)
        // Atualizar estado local
        // Re-buscar dados
        // Notificar usuário
      }
    )
    .subscribe()

  return subscription
}
```

---

## 12. CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Instalar `@supabase/supabase-js`
- [ ] Criar `supabaseClient.ts`
- [ ] Criar `AuthContext.tsx`
- [ ] Criar serviços (casosService, etc)
- [ ] Atualizar main.tsx com AuthProvider
- [ ] Atualizar router com ProtectedRoute
- [ ] Integrar LoginPage com autenticação real
- [ ] Testar login/logout
- [ ] Gerar tipos TypeScript
- [ ] Conectar CasosPage com BD
- [ ] Conectar ClientesPage com BD
- [ ] Integrar upload de documentos
- [ ] Testar fluxos completos
- [ ] Implementar error handling
- [ ] Adicionar loading states

---

**Status:** 🚀 Pronto para começar  
**Última atualização:** 5 de janeiro de 2026
