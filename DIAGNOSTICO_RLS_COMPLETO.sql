-- =====================================================
-- DIAGNÓSTICO: Verificar RLS em TODAS as tabelas
-- Data: 28 de janeiro de 2026
-- =====================================================

-- 1️⃣ Quais tabelas têm RLS ativado?
SELECT 
  schemaname,
  tablename,
  (SELECT array_agg(policyname) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as policies
FROM pg_tables
WHERE schemaname = 'public'
  AND EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE pg_policies.tablename = pg_tables.tablename
  )
ORDER BY tablename;

-- 2️⃣ Todas as policies em TODAS as tabelas
SELECT 
  tablename,
  policyname,
  cmd::TEXT as operacao,
  qual::TEXT as condicao
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3️⃣ Verificar quais tabelas têm RLS FORCE
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_ativo,
  forcerowsecurity as rls_force
FROM pg_tables
WHERE schemaname = 'public'
  AND (rowsecurity = true OR forcerowsecurity = true)
ORDER BY tablename;

-- 4️⃣ Tabelas críticas que NÃO devem ter RLS
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_ativo
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('usuarios', 'org_members', 'orgs', 'auth.users')
ORDER BY tablename;
