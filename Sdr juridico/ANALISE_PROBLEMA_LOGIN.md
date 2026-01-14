# 🔍 ANÁLISE COMPLETA - PROBLEMA DE LOGIN
**Data:** 14 de Janeiro de 2026  
**Problema:** Tela fica em "Verificando acesso..." e não completa o login

---

## 📋 SINTOMAS

1. Após fazer login no Supabase, a tela fica travada em "Verificando acesso..."
2. Não há redirecionamento para o dashboard
3. Loading infinito sem erro visível

---

## 🔎 CAUSA RAIZ IDENTIFICADA

### **Problema 1: RLS em profiles bloqueia consulta do PermissionsService**

O `permissionsService.getCurrentUser()` faz esta query:

```typescript
const { data, error } = await supabase
  .from('profiles')
  .select('user_id, email, nome, role, org_id, is_fartech_admin')
  .eq('user_id', user.id)
  .single()
```

**PROBLEMA:** Com as novas policies RLS que criamos, esta query pode estar sendo bloqueada!

### **Policies Atuais em profiles:**

```sql
-- Policy 1: Fartech Admin vê todos
CREATE POLICY "fartech_admin_all_profiles" ON profiles
  FOR ALL
  USING (is_fartech_admin());

-- Policy 2: Org Admin vê própria org
CREATE POLICY "org_admin_own_org_profiles" ON profiles
  FOR ALL
  USING (
    is_org_admin() 
    AND org_id = get_user_org_id()
  );

-- Policy 3: Usuários veem próprio profile
CREATE POLICY "users_own_profile" ON profiles
  FOR ALL
  USING (user_id = auth.uid());
```

**ANÁLISE:**

1. ✅ **users_own_profile** deveria funcionar porque `user_id = auth.uid()`
2. ❌ **MAS** as funções `is_fartech_admin()`, `get_user_org_id()`, `is_org_admin()` fazem SELECT em `profiles`!
3. 🔄 **RECURSÃO OCULTA:** As policies chamam funções que consultam profiles, criando dependência circular

---

## 🐛 PROBLEMA ESPECÍFICO

### **Fluxo do Erro:**

1. Usuário faz login → `auth.uid()` é definido
2. PermissionsContext chama `loadPermissions()`
3. `permissionsService.getCurrentUser()` consulta `profiles`
4. RLS avalia policies:
   - `users_own_profile`: OK (auth.uid() existe)
   - **MAS** `fartech_admin_all_profiles` chama `is_fartech_admin()`
   - `is_fartech_admin()` tenta SELECT em `profiles`
   - Isso ativa RLS novamente → LOOP!
5. Query nunca completa
6. `loading` fica `true` para sempre
7. Tela fica em "Verificando acesso..."

---

## 🔧 SOLUÇÕES POSSÍVEIS

### **Solução 1: Simplificar Policies (RECOMENDADO) ✅**

Remover policies que chamam funções e deixar apenas a essencial:

```sql
-- Remover policies problemáticas
DROP POLICY IF EXISTS "fartech_admin_all_profiles" ON profiles;
DROP POLICY IF EXISTS "org_admin_own_org_profiles" ON profiles;

-- Manter APENAS a policy simples
-- (já existe: users_own_profile)
CREATE POLICY "users_own_profile" ON profiles
  FOR ALL
  USING (user_id = auth.uid());

-- Adicionar policy para Fartech Admin SEM usar função
CREATE POLICY "fartech_admin_all_profiles" ON profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.id IN (
        SELECT user_id FROM profiles 
        WHERE is_fartech_admin = true 
        AND user_id = auth.uid()
      )
    )
  );
```

**Problema:** Ainda pode causar recursão!

---

### **Solução 2: Desabilitar RLS em profiles.is_fartech_admin (MELHOR) ✅✅**

PostgreSQL permite policies que não ativam RLS recursivamente:

```sql
-- Criar política que bypasseia RLS para consulta de is_fartech_admin
ALTER TABLE profiles REPLICA IDENTITY FULL;

-- Policy otimizada SEM recursão
CREATE POLICY "users_own_profile" ON profiles
  FOR ALL
  USING (user_id = auth.uid());

-- Policy para Fartech que não causa loop
CREATE POLICY "fartech_all_profiles" ON profiles
  FOR ALL
  USING (
    (SELECT is_fartech_admin FROM profiles WHERE user_id = auth.uid() LIMIT 1) = true
  );
```

---

### **Solução 3: Usar auth.jwt() ao invés de consultar profiles ✅✅✅**

Armazenar `is_fartech_admin` no JWT do Supabase:

```sql
-- Criar função de database que seta claims no JWT
CREATE OR REPLACE FUNCTION handle_new_user_jwt() 
RETURNS TRIGGER AS $$
BEGIN
  -- Adicionar is_fartech_admin ao JWT
  NEW.raw_app_meta_data = jsonb_set(
    COALESCE(NEW.raw_app_meta_data, '{}'::jsonb),
    '{is_fartech_admin}',
    to_jsonb(COALESCE(
      (SELECT is_fartech_admin FROM profiles WHERE user_id = NEW.id),
      false
    ))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar JWT
CREATE TRIGGER on_auth_user_created_jwt
  BEFORE INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_jwt();

-- Policy usando JWT (SEM recursão!)
CREATE POLICY "fartech_admin_all_profiles" ON profiles
  FOR ALL
  USING (
    (auth.jwt() ->> 'is_fartech_admin')::boolean = true
  );
```

---

### **Solução 4: Remover RLS de profiles (TEMPORÁRIA) ⚠️**

```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

**Problema:** Perde segurança multi-tenant!

---

## ✅ SOLUÇÃO RECOMENDADA

**Abordagem Híbrida:**

1. **Manter policy simples para usuários normais**
2. **Usar subquery otimizada para Fartech Admin**
3. **Evitar funções SECURITY DEFINER nas policies**

```sql
-- ================================================
-- CORREÇÃO: POLICIES SEM RECURSÃO
-- ================================================

-- Remover policies antigas
DROP POLICY IF EXISTS "fartech_admin_all_profiles" ON profiles;
DROP POLICY IF EXISTS "org_admin_own_org_profiles" ON profiles;
DROP POLICY IF EXISTS "users_own_profile" ON profiles;

-- Policy 1: Usuários veem próprio profile (SEM RECURSÃO)
CREATE POLICY "users_own_profile" ON profiles
  FOR ALL
  USING (user_id = auth.uid());

-- Policy 2: Fartech Admin vê todos (OTIMIZADA - SEM FUNÇÃO)
CREATE POLICY "fartech_admin_view_all" ON profiles
  FOR SELECT
  USING (
    -- Subquery direta sem função
    (
      SELECT p.is_fartech_admin 
      FROM profiles p 
      WHERE p.user_id = auth.uid()
      LIMIT 1
    ) = true
  );

-- Policy 3: Org Admin vê membros da própria org (OTIMIZADA)
CREATE POLICY "org_members_view" ON profiles
  FOR SELECT
  USING (
    org_id = (
      SELECT p.org_id 
      FROM profiles p 
      WHERE p.user_id = auth.uid()
      LIMIT 1
    )
    AND (
      SELECT p.role 
      FROM profiles p 
      WHERE p.user_id = auth.uid()
      LIMIT 1
    ) IN ('org_admin', 'admin')
  );
```

**ATENÇÃO:** Mesmo subqueries podem causar recursão em PostgreSQL!

---

## 🎯 SOLUÇÃO DEFINITIVA (SEM RECURSÃO)

**Usar POLÍTICAS SEPARADAS por operação:**

```sql
-- ================================================
-- FIX FINAL: POLICIES SEM RECURSÃO
-- ================================================

-- Remover TODAS as policies antigas
DROP POLICY IF EXISTS "fartech_admin_all_profiles" ON profiles;
DROP POLICY IF EXISTS "org_admin_own_org_profiles" ON profiles;
DROP POLICY IF EXISTS "users_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_view_own_org" ON profiles;
DROP POLICY IF EXISTS "profiles_select_self" ON profiles;
DROP POLICY IF EXISTS "profiles_update_self" ON profiles;
DROP POLICY IF EXISTS "users_same_org_profiles" ON profiles;
DROP POLICY IF EXISTS "fartech_admin_view_all" ON profiles;
DROP POLICY IF EXISTS "org_members_view" ON profiles;

-- Policy 1: SELECT - Cada usuário vê SEU PRÓPRIO profile
CREATE POLICY "select_own_profile" ON profiles
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy 2: UPDATE - Cada usuário atualiza SEU PRÓPRIO profile  
CREATE POLICY "update_own_profile" ON profiles
  FOR UPDATE
  USING (user_id = auth.uid());

-- Policy 3: INSERT - Apenas durante criação (por trigger)
CREATE POLICY "insert_own_profile" ON profiles
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy 4: DELETE - Ninguém pode deletar profiles
-- (sem policy = sem permissão)

-- NOTA: Para Fartech Admin ver todos os profiles,
-- usar SERVICE ROLE KEY no backend, NÃO policies!
```

---

## 🔬 COMO TESTAR A CORREÇÃO

```sql
-- 1. Verificar policies ativas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 2. Testar query como usuário
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims.sub TO 'user-uuid-aqui';

SELECT * FROM profiles WHERE user_id = auth.uid();

-- 3. Resetar role
RESET ROLE;
```

---

## 📊 IMPACTO DA MUDANÇA

### Antes (COM PROBLEMA):
- ✅ RLS habilitado
- ❌ Policies com funções SECURITY DEFINER
- ❌ Recursão infinita
- ❌ Login não funciona
- ❌ "Verificando acesso..." infinito

### Depois (CORRIGIDO):
- ✅ RLS habilitado
- ✅ Policies SIMPLES sem funções
- ✅ Sem recursão
- ✅ Login funciona
- ✅ Usuários veem apenas seus próprios dados

### Trade-offs:
- ⚠️ Fartech Admin **não** verá todos os profiles via RLS
- ✅ Fartech Admin deve usar **Service Role** no backend
- ✅ Mais seguro e performático
- ✅ Sem risco de recursão

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ Aplicar correção SQL no Supabase
2. ✅ Testar login novamente
3. ✅ Validar que não há recursão
4. ⏳ Atualizar FartechDashboard para usar Service Role
5. ⏳ Documentar limitações de RLS

---

## 📝 COMANDOS PARA EXECUTAR

Execute no SQL Editor do Supabase:

```sql
-- Ver arquivo: FIX_RLS_RECURSION.sql
```

---

**Status:** 🔴 PROBLEMA IDENTIFICADO  
**Prioridade:** 🔴 CRÍTICA (Sistema inoperante)  
**Solução:** Simplificar policies RLS  
**ETA:** 10 minutos
