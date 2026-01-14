-- ================================================
-- FIX: RLS RECURSION - Problema de Login Infinito
-- Data: 14/01/2026
-- Problema: Policies com funções SECURITY DEFINER causam recursão
-- Solução: Policies simples sem funções
-- ================================================

-- PARTE 1: REMOVER TODAS AS POLICIES PROBLEMÁTICAS
-- ================================================

DROP POLICY IF EXISTS "fartech_admin_all_profiles" ON profiles;
DROP POLICY IF EXISTS "org_admin_own_org_profiles" ON profiles;
DROP POLICY IF EXISTS "users_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_view_own_org" ON profiles;
DROP POLICY IF EXISTS "profiles_select_self" ON profiles;
DROP POLICY IF EXISTS "profiles_update_self" ON profiles;
DROP POLICY IF EXISTS "users_same_org_profiles" ON profiles;
DROP POLICY IF EXISTS "fartech_admin_view_all" ON profiles;
DROP POLICY IF EXISTS "org_members_view" ON profiles;

-- PARTE 2: CRIAR POLICIES SIMPLES SEM RECURSÃO
-- ================================================

-- Policy 1: SELECT - Usuário vê SEU PRÓPRIO profile
CREATE POLICY "select_own_profile" ON profiles
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy 2: UPDATE - Usuário atualiza SEU PRÓPRIO profile
CREATE POLICY "update_own_profile" ON profiles
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy 3: INSERT - Criar profile durante cadastro
CREATE POLICY "insert_own_profile" ON profiles
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy 4: DELETE - Apenas service role pode deletar
-- (não criar policy = negar acesso)

-- ================================================
-- PARTE 3: GARANTIR QUE RLS ESTÁ HABILITADO
-- ================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ================================================
-- PARTE 4: VERIFICAÇÕES
-- ================================================

-- Verificar policies criadas
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'profiles';

  RAISE NOTICE '✅ % policies criadas em profiles', policy_count;
  
  IF policy_count < 3 THEN
    RAISE WARNING 'Esperado 3 policies, encontrado %', policy_count;
  END IF;
END $$;

-- Verificar RLS habilitado
DO $$
DECLARE
  rls_enabled BOOLEAN;
BEGIN
  SELECT rowsecurity INTO rls_enabled
  FROM pg_tables
  WHERE schemaname = 'public' AND tablename = 'profiles';

  IF rls_enabled THEN
    RAISE NOTICE '✅ RLS habilitado em profiles';
  ELSE
    RAISE EXCEPTION 'RLS NÃO está habilitado em profiles!';
  END IF;
END $$;

-- ================================================
-- PARTE 5: EXIBIR RESULTADO
-- ================================================

SELECT 
  '🎯 FIX APLICADO' AS status,
  'Policies simplificadas (sem funções)' AS correcao_1,
  'Sem recursão' AS correcao_2,
  'RLS habilitado' AS correcao_3;

-- Listar policies ativas
SELECT 
  'Policies em profiles:' AS info,
  policyname,
  cmd AS comando,
  CASE 
    WHEN cmd = 'SELECT' THEN '👁️ Leitura'
    WHEN cmd = 'UPDATE' THEN '✏️ Atualização'
    WHEN cmd = 'INSERT' THEN '➕ Criação'
    WHEN cmd = 'DELETE' THEN '🗑️ Deleção'
    ELSE cmd
  END AS tipo
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY cmd, policyname;

-- ================================================
-- IMPORTANTE: LIMITAÇÕES DESTA SOLUÇÃO
-- ================================================

-- ⚠️ FARTECH ADMIN NÃO VERÁ TODOS OS PROFILES VIA RLS
-- Para Fartech Admin acessar todos os dados, deve-se:
-- 1. Usar Service Role Key no backend
-- 2. OU criar endpoint API específico
-- 3. OU usar função SECURITY DEFINER em stored procedure

-- ✅ USUÁRIOS NORMAIS: Veem apenas seus próprios dados
-- ✅ ORG MEMBERS: Precisam de lógica no backend para compartilhamento
-- ✅ SEM RECURSÃO: Login funcionará normalmente

-- ================================================
-- TESTE RÁPIDO
-- ================================================

-- Executar como usuário autenticado:
-- SELECT * FROM profiles WHERE user_id = auth.uid();
-- Deve retornar APENAS o profile do usuário logado

-- ================================================
-- ROLLBACK (se necessário)
-- ================================================

-- Para voltar atrás:
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
-- Depois executar CORRECOES_CRITICAS.sql novamente
