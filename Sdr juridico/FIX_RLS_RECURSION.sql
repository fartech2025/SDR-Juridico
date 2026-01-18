-- =====================================================
-- DEPRECATED: Este script usa profiles. Padrao atual: usuarios + org_members.
-- Use SETUP_MULTITENANT_INCREMENTAL.sql para o fluxo atualizado.
-- =====================================================

-- ================================================
-- FIX: RLS RECURSION - Problema de Login Infinito
-- Data: 14/01/2026
-- Problema: Policies com funÃ§Ãµes SECURITY DEFINER causam recursÃ£o
-- SoluÃ§Ã£o: Policies simples sem funÃ§Ãµes
-- ================================================

-- PARTE 1: REMOVER TODAS AS POLICIES PROBLEMÃTICAS
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

-- PARTE 2: CRIAR POLICIES SIMPLES SEM RECURSÃƒO
-- ================================================

-- Policy 1: SELECT - UsuÃ¡rio vÃª SEU PRÃ“PRIO profile
CREATE POLICY "select_own_profile" ON profiles
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy 2: UPDATE - UsuÃ¡rio atualiza SEU PRÃ“PRIO profile
CREATE POLICY "update_own_profile" ON profiles
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy 3: INSERT - Criar profile durante cadastro
CREATE POLICY "insert_own_profile" ON profiles
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy 4: DELETE - Apenas service role pode deletar
-- (nÃ£o criar policy = negar acesso)

-- ================================================
-- PARTE 3: GARANTIR QUE RLS ESTÃ HABILITADO
-- ================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ================================================
-- PARTE 4: VERIFICAÃ‡Ã•ES
-- ================================================

-- Verificar policies criadas
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'profiles';

  RAISE NOTICE 'âœ… % policies criadas em profiles', policy_count;
  
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
    RAISE NOTICE 'âœ… RLS habilitado em profiles';
  ELSE
    RAISE EXCEPTION 'RLS NÃƒO estÃ¡ habilitado em profiles!';
  END IF;
END $$;

-- ================================================
-- PARTE 5: EXIBIR RESULTADO
-- ================================================

SELECT 
  'ðŸŽ¯ FIX APLICADO' AS status,
  'Policies simplificadas (sem funÃ§Ãµes)' AS correcao_1,
  'Sem recursÃ£o' AS correcao_2,
  'RLS habilitado' AS correcao_3;

-- Listar policies ativas
SELECT 
  'Policies em profiles:' AS info,
  policyname,
  cmd AS comando,
  CASE 
    WHEN cmd = 'SELECT' THEN 'ðŸ‘ï¸ Leitura'
    WHEN cmd = 'UPDATE' THEN 'âœï¸ AtualizaÃ§Ã£o'
    WHEN cmd = 'INSERT' THEN 'âž• CriaÃ§Ã£o'
    WHEN cmd = 'DELETE' THEN 'ðŸ—‘ï¸ DeleÃ§Ã£o'
    ELSE cmd
  END AS tipo
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY cmd, policyname;

-- ================================================
-- IMPORTANTE: LIMITAÃ‡Ã•ES DESTA SOLUÃ‡ÃƒO
-- ================================================

-- âš ï¸ FARTECH ADMIN NÃƒO VERÃ TODOS OS PROFILES VIA RLS
-- Para Fartech Admin acessar todos os dados, deve-se:
-- 1. Usar Service Role Key no backend
-- 2. OU criar endpoint API especÃ­fico
-- 3. OU usar funÃ§Ã£o SECURITY DEFINER em stored procedure

-- âœ… USUÃRIOS NORMAIS: Veem apenas seus prÃ³prios dados
-- âœ… ORG MEMBERS: Precisam de lÃ³gica no backend para compartilhamento
-- âœ… SEM RECURSÃƒO: Login funcionarÃ¡ normalmente

-- ================================================
-- TESTE RÃPIDO
-- ================================================

-- Executar como usuÃ¡rio autenticado:
-- SELECT * FROM profiles WHERE user_id = auth.uid();
-- Deve retornar APENAS o profile do usuÃ¡rio logado

-- ================================================
-- ROLLBACK (se necessÃ¡rio)
-- ================================================

-- Para voltar atrÃ¡s:
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
-- Depois executar CORRECOES_CRITICAS.sql novamente
