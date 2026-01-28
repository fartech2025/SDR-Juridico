-- =====================================================
-- LIMPEZA: Remove RLS Policies Antigas
-- Data: 28 de janeiro de 2026
-- =====================================================

BEGIN;

-- ❌ Deletar policies antigas que estão em conflito
DROP POLICY IF EXISTS tarefas_select ON public.tarefas;
DROP POLICY IF EXISTS tarefas_write ON public.tarefas;

-- ✅ Confirmar que apenas as novas policies existem
SELECT 
  policyname,
  cmd as operacao
FROM pg_policies
WHERE tablename = 'tarefas'
ORDER BY policyname;

COMMIT;

-- =====================================================
-- RESUMO:
-- ✅ Removed: tarefas_select (OLD)
-- ✅ Removed: tarefas_write (OLD)
-- ✅ Kept: tarefas_select_admin
-- ✅ Kept: tarefas_select_advogado
-- ✅ Kept: tarefas_select_fartech
-- ✅ Kept: tarefas_insert_admin
-- ✅ Kept: tarefas_insert_advogado
-- ✅ Kept: tarefas_insert_fartech
-- ✅ Kept: tarefas_update_admin
-- ✅ Kept: tarefas_update_advogado
-- ✅ Kept: tarefas_update_fartech
-- ✅ Kept: tarefas_delete_admin
-- ✅ Kept: tarefas_delete_fartech
-- =====================================================
