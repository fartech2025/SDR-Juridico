-- =====================================================
-- ANÁLISE DE POLICIES DUPLICADAS
-- Data: 2026-02-04
-- Execute este script para verificar policies duplicadas
-- =====================================================

-- 1. Listar TODAS as policies por tabela
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual IS NOT NULL as has_using,
  with_check IS NOT NULL as has_with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;

-- 2. Contar policies por tabela e operação
SELECT 
  tablename,
  cmd,
  COUNT(*) as policy_count,
  STRING_AGG(policyname, ', ' ORDER BY policyname) as policy_names
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename, cmd
HAVING COUNT(*) > 1
ORDER BY tablename, cmd;

-- 3. Identificar possíveis duplicatas (mesmo prefixo de nome)
SELECT 
  tablename,
  cmd,
  SUBSTRING(policyname FROM '^[a-z_]+') as policy_prefix,
  COUNT(*) as count,
  STRING_AGG(policyname, ', ') as policies
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename, cmd, SUBSTRING(policyname FROM '^[a-z_]+')
HAVING COUNT(*) > 1
ORDER BY tablename;

-- 4. Listar policies que podem estar em conflito
-- (múltiplas policies de SELECT na mesma tabela podem causar lentidão)
SELECT 
  tablename,
  COUNT(*) FILTER (WHERE cmd = 'SELECT') as select_policies,
  COUNT(*) FILTER (WHERE cmd = 'INSERT') as insert_policies,
  COUNT(*) FILTER (WHERE cmd = 'UPDATE') as update_policies,
  COUNT(*) FILTER (WHERE cmd = 'DELETE') as delete_policies,
  COUNT(*) FILTER (WHERE cmd = 'ALL') as all_policies
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
HAVING COUNT(*) > 4  -- Tabelas com muitas policies
ORDER BY COUNT(*) DESC;

-- 5. Ver detalhes das policies mais complexas
SELECT 
  tablename,
  policyname,
  cmd,
  LEFT(qual::text, 100) as using_clause_preview,
  LEFT(with_check::text, 100) as with_check_preview
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('leads', 'casos', 'clientes', 'documentos', 'tarefas', 'org_members', 'usuarios')
ORDER BY tablename, cmd, policyname;
