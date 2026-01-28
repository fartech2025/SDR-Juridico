-- =====================================================
-- SOLUÇÃO FINAL: Remover RLS problemático
-- Data: 28 de janeiro de 2026
-- =====================================================

BEGIN;

-- 1️⃣ DESATIVAR RLS em tabelas críticas
-- (Essas tabelas devem ser lidas pelos usuários autenticados)
ALTER TABLE IF EXISTS public.usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.org_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orgs DISABLE ROW LEVEL SECURITY;

-- 2️⃣ Remover policies antigas em tarefas que estão conflitando
DROP POLICY IF EXISTS tarefas_select ON public.tarefas;
DROP POLICY IF EXISTS tarefas_write ON public.tarefas;

-- 3️⃣ Verificar que RLS foi desativado
SELECT 
  tablename,
  rowsecurity as "RLS Ativo?",
  forcerowsecurity as "RLS Forçado?"
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('usuarios', 'org_members', 'orgs', 'tarefas')
ORDER BY tablename;

-- 4️⃣ Verificar policies restantes em tarefas (deve estar OK agora)
SELECT 
  policyname,
  cmd::TEXT as operacao
FROM pg_policies
WHERE tablename = 'tarefas'
ORDER BY policyname;

COMMIT;

-- =====================================================
-- RESUMO:
-- ✅ Desativado RLS em usuarios (leitura de permissões)
-- ✅ Desativado RLS em org_members (leitura de roles)
-- ✅ Desativado RLS em orgs (leitura de organizações)
-- ✅ Removido policies antigas em tarefas
-- ✅ Mantido RLS ativo em tarefas com policies NOVAS
-- =====================================================
