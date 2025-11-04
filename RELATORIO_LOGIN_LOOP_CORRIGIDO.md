# Correção: Loop de Login → Landing Page — Diagnóstico e Solução (03/11/2025)

## Problema Identificado
Ao fazer login, o usuário era redirecionado para a **landing page** (`/`) em vez de ir para o **dashboard** (`/home`), causando um loop infinito de redirecionamentos.

### Causas Raiz

1. **`Login.tsx` estava FAKE**
   - O componente `handleLogin` simulava um login mas **não autenticava** contra o Supabase.
   - Após o timeout de 800ms, simplesmente redirecionava para `/` (landing page).
   - Não criava sessão real no Supabase Auth.

2. **`ProtectedRoute` estava desabilitado**
   - A verificação `if (!user) { return <Navigate to="/login" replace /> }` estava comentada.
   - Isso permitia acesso a rotas protegidas mesmo sem autenticação.
   - Loop: sem session → tenta acessar `/home` → ProtectedRoute deixa passar → mas sem dados → redireciona para `/` → tenta de novo.

3. **Fluxo incoerente**
   - Se o login não criava sessão, `useAuth()` sempre retornava `user = null`.
   - `ProtectedRoute` não forcava redirect para `/login`.
   - Usuário ficava preso no loop.

## Soluções Aplicadas

### 1) Implementar Login Real em `Login.tsx`
```tsx
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setErro("");
  setLoading(true);

  try {
    // ✅ Autenticar de verdade contra Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });

    if (error) {
      // ✅ Mostrar erros específicos
      setErro(error.message || "Email ou senha incorretos");
      setLoading(false);
      return;
    }

    if (data?.session?.user) {
      // ✅ Redirecionar para /home após criar sessão
      setTimeout(() => {
        navigate("/home", { replace: true });
      }, 300);
    }
  } catch (err: any) {
    setErro("Erro desconhecido ao fazer login.");
    setLoading(false);
  }
};
```

**O que mudou:**
- Usa `supabase.auth.signInWithPassword()` (real).
- Redireciona para `/home` em vez de `/`.
- Aguarda 300ms para a sessão se estabelecer antes de redirecionar.
- Mostra erros específicos (email não confirmado, credenciais inválidas, etc.).

### 2) Habilitar Proteção em `ProtectedRoute.tsx`
```tsx
if (loading || preparandoPerfil) {
  return <div>Carregando...</div>;
}

// ✅ Ativar: se não há usuário, redireciona para /login
if (!user) {
  return <Navigate to="/login" replace />;
}

return <>{children}</>;
```

**O que mudou:**
- Descomentar a verificação `if (!user)`.
- Agora, qualquer tentativa de acessar rota protegida sem autenticação redireciona para `/login`.

### 3) Detecção de Usuário Autenticado no `Login.tsx`
```tsx
useEffect(() => {
  async function verificarAutenticacao() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      // ✅ Se já está logado, redirecionar para /home
      navigate("/home", { replace: true });
    }
  }
  verificarAutenticacao();
}, [navigate]);
```

**O que mudou:**
- Se você já está autenticado e acessa `/login`, é redirecionado para `/home`.

### 4) Adicionar Rota Debug em `App.tsx`
```tsx
<Route path="/debug-auth" element={<DebugAuth />} />
```

**Para quê:**
- Visualizar em `/debug-auth` se a autenticação está funcionando.
- Ver estado de `useAuth()`, sessão ativa e configuração do Supabase.

## Fluxo Correto Agora

```
1. Usuário acessa /login
   ↓
2. Verifica se já está autenticado (useEffect no Login)
   ├─ Se sim → redireciona para /home
   └─ Se não → mostra formulário
   ↓
3. Preenche email/senha e clica "Entrar"
   ↓
4. handleLogin chama supabase.auth.signInWithPassword()
   ├─ Se erro → mostra mensagem
   └─ Se sucesso → aguarda 300ms e redireciona para /home
   ↓
5. Chega em /home (rota protegida)
   ↓
6. ProtectedRoute valida:
   ├─ useAuth() → user é preenchido ✅
   ├─ preparandoPerfil → ensureUsuarioRegistro() cria/atualiza registro
   └─ Renderiza DashboardHome
```

## Como Testar

### Teste 1: Login Correto
1. Acesse `http://localhost:5173/login`
2. Digite um email e senha de um usuário registrado no Supabase
3. Clique "Entrar"
4. **Esperado:** Redireciona para `/home` (Dashboard)

### Teste 2: Credenciais Inválidas
1. Digite email/senha errados
2. **Esperado:** Mostra erro "Email ou senha incorretos"

### Teste 3: Usuário Já Autenticado
1. Faça login uma vez
2. Abra abas/janelas novas em `http://localhost:5173/login`
3. **Esperado:** Redireciona diretamente para `/home`

### Teste 4: Acesso a Rota Protegida Sem Autenticação
1. Abra `http://localhost:5173/home` em modo anônimo (sem estar logado)
2. **Esperado:** Redireciona para `/login`

### Teste 5: Debug
1. Acesse `http://localhost:5173/debug-auth`
2. Você verá:
   - Configuração do Supabase (URL, mock mode)
   - Status do `useAuth()` (user, loading)
   - Session ativa
   - Dicas para troubleshoot

## Requisitos para Funcionar

✅ Supabase conectado e funcional (você já confirmou isso).
✅ Variáveis `.env` corretas:
```env
VITE_SUPABASE_URL=https://seu_projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```
✅ Usuários registrados no `auth` do Supabase com email/senha confirmados.

## Próximos Passos

- [ ] Testar login com credenciais reais.
- [ ] Verificar se novo usuário consegue se cadastrar em `/cadastro`.
- [ ] Confirmar que `useAuth()` e `ProtectedRoute` funcionam corretamente.
- [ ] Se preferir, adicionar autenticação social (Google, GitHub, etc.).
- [ ] Considerar adicionar "Lembrar de mim" (persistência de sessão).

## Arquivos Modificados

- ✅ `app/src/pages/Login.tsx` — Implementar autenticação real com Supabase.
- ✅ `app/src/components/layout/ProtectedRoute.tsx` — Ativar redirecionamento de usuários não autenticados.
- ✅ `app/src/pages/DebugAuth.tsx` — Nova página de diagnóstico.
- ✅ `app/src/App.tsx` — Adicionar rota `/debug-auth`.

## Debug

Se ainda tiver problemas, verifique:
1. Console do navegador (F12 → Console) — procure por erros do Supabase.
2. Abra `/debug-auth` e verifique configuração e status de sessão.
3. Verifique se credenciais no `.env` estão corretas.
4. Verifique se o usuário realmente existe e tem email confirmado no Supabase Auth.
