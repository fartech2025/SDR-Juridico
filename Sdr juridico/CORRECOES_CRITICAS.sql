-- ========================================
-- CORREÇÕES CRÍTICAS - BANCO DE DADOS
-- Data: 14/01/2026
-- Projeto: SDR Jurídico - Multi-Tenant
-- ========================================

-- Este script resolve os problemas críticos identificados na análise:
-- 1. Recursão infinita em RLS policies
-- 2. Missing CASCADE rules em Foreign Keys
-- 3. Missing UNIQUE constraint em profiles.user_id
-- 4. Re-habilitação segura de RLS em profiles

-- ========================================
-- PARTE 1: CRIAR FUNÇÕES HELPER (Resolver Recursão)
-- ========================================

-- Função para verificar se usuário é Fartech Admin
-- SECURITY DEFINER permite acesso direto sem recursão RLS
CREATE OR REPLACE FUNCTION is_fartech_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid() 
    AND is_fartech_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter org_id do usuário atual
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT org_id FROM profiles
    WHERE user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário é admin da org
CREATE OR REPLACE FUNCTION is_org_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'org_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- PARTE 2: ADICIONAR UNIQUE CONSTRAINT
-- ========================================

-- Garantir que user_id seja único em profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_user_id_unique'
  ) THEN
    ALTER TABLE profiles 
    ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- ========================================
-- PARTE 3: CORRIGIR CASCADE RULES EM FOREIGN KEYS
-- ========================================

-- Corrigir FK de profiles.org_id -> orgs(id)
-- Se uma org for deletada, setar org_id como NULL
ALTER TABLE profiles 
  DROP CONSTRAINT IF EXISTS profiles_org_id_fkey;

ALTER TABLE profiles 
  ADD CONSTRAINT profiles_org_id_fkey
  FOREIGN KEY (org_id) 
  REFERENCES orgs(id) 
  ON DELETE SET NULL;

-- Corrigir FK de leads.org_id -> orgs(id)
ALTER TABLE leads 
  DROP CONSTRAINT IF EXISTS leads_org_id_fkey;

ALTER TABLE leads 
  ADD CONSTRAINT leads_org_id_fkey
  FOREIGN KEY (org_id) 
  REFERENCES orgs(id) 
  ON DELETE CASCADE;

-- Corrigir FK de clientes.org_id -> orgs(id)
ALTER TABLE clientes 
  DROP CONSTRAINT IF EXISTS clientes_org_id_fkey;

ALTER TABLE clientes 
  ADD CONSTRAINT clientes_org_id_fkey
  FOREIGN KEY (org_id) 
  REFERENCES orgs(id) 
  ON DELETE CASCADE;

-- Corrigir FK de casos.org_id -> orgs(id)
ALTER TABLE casos 
  DROP CONSTRAINT IF EXISTS casos_org_id_fkey;

ALTER TABLE casos 
  ADD CONSTRAINT casos_org_id_fkey
  FOREIGN KEY (org_id) 
  REFERENCES orgs(id) 
  ON DELETE CASCADE;

-- Corrigir FK de documentos.org_id -> orgs(id)
ALTER TABLE documentos 
  DROP CONSTRAINT IF EXISTS documentos_org_id_fkey;

ALTER TABLE documentos 
  ADD CONSTRAINT documentos_org_id_fkey
  FOREIGN KEY (org_id) 
  REFERENCES orgs(id) 
  ON DELETE CASCADE;

-- ========================================
-- PARTE 4: REMOVER POLICIES ANTIGAS (Evitar Duplicatas)
-- ========================================

-- Remover todas as policies antigas de profiles
DROP POLICY IF EXISTS "fartech_admin_all_profiles" ON profiles;
DROP POLICY IF EXISTS "org_admin_own_org_profiles" ON profiles;
DROP POLICY IF EXISTS "users_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_view_own_org" ON profiles;

-- ========================================
-- PARTE 5: CRIAR NOVAS POLICIES SEM RECURSÃO
-- ========================================

-- Policy 1: Fartech Admin vê todos os profiles
CREATE POLICY "fartech_admin_all_profiles" ON profiles
  FOR ALL
  USING (is_fartech_admin());

-- Policy 2: Org Admin vê profiles da própria org
CREATE POLICY "org_admin_own_org_profiles" ON profiles
  FOR ALL
  USING (
    is_org_admin() 
    AND org_id = get_user_org_id()
  );

-- Policy 3: Usuários veem apenas seu próprio profile
CREATE POLICY "users_own_profile" ON profiles
  FOR ALL
  USING (user_id = auth.uid());

-- ========================================
-- PARTE 6: RE-HABILITAR RLS EM PROFILES
-- ========================================

-- Habilitar RLS em profiles (agora sem recursão!)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ========================================
-- PARTE 7: VERIFICAÇÕES DE INTEGRIDADE
-- ========================================

-- Verificar se funções foram criadas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'is_fartech_admin'
  ) THEN
    RAISE EXCEPTION 'Função is_fartech_admin() não foi criada!';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'get_user_org_id'
  ) THEN
    RAISE EXCEPTION 'Função get_user_org_id() não foi criada!';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'is_org_admin'
  ) THEN
    RAISE EXCEPTION 'Função is_org_admin() não foi criada!';
  END IF;

  RAISE NOTICE '✅ Todas as funções foram criadas com sucesso!';
END $$;

-- Verificar se RLS está habilitado
DO $$
DECLARE
  rls_enabled BOOLEAN;
BEGIN
  SELECT rowsecurity INTO rls_enabled
  FROM pg_tables
  WHERE schemaname = 'public' AND tablename = 'profiles';

  IF NOT rls_enabled THEN
    RAISE EXCEPTION 'RLS não está habilitado em profiles!';
  END IF;

  RAISE NOTICE '✅ RLS habilitado em profiles!';
END $$;

-- Verificar se policies foram criadas
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'profiles';

  IF policy_count < 3 THEN
    RAISE EXCEPTION 'Policies de profiles não foram criadas corretamente!';
  END IF;

  RAISE NOTICE '✅ % policies criadas em profiles!', policy_count;
END $$;

-- ========================================
-- RESULTADO ESPERADO
-- ========================================

-- Exibir resumo das correções
SELECT 
  '🎯 CORREÇÕES APLICADAS' AS status,
  'Funções helper criadas (sem recursão)' AS correcao_1,
  'CASCADE rules adicionadas em FKs' AS correcao_2,
  'UNIQUE constraint em profiles.user_id' AS correcao_3,
  'RLS re-habilitado em profiles' AS correcao_4;

-- Exibir policies ativas
SELECT 
  'Policies Ativas em profiles:' AS info,
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN '✅ Com USING'
    ELSE '⚠️ Sem USING'
  END AS status
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY policyname;

-- Exibir Foreign Keys com CASCADE
SELECT
  tc.table_name AS tabela,
  kcu.column_name AS coluna,
  ccu.table_name AS referencia,
  rc.delete_rule AS regra_delete,
  CASE 
    WHEN rc.delete_rule IN ('CASCADE', 'SET NULL') THEN '✅'
    ELSE '⚠️'
  END AS status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'org_id'
  AND tc.table_name IN ('profiles', 'leads', 'clientes', 'casos', 'documentos')
ORDER BY tc.table_name;
