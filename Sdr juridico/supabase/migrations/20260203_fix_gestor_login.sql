-- Fix Gestor Login Issue
-- Date: 2026-02-03
-- Purpose: Reativar gestores que foram desativados e estão impedindo login com mensagem "não vinculado a nenhuma organização"

BEGIN;

-- ================================================================================
-- DIAGNÓSTICO: Verificar gestores desativados
-- ================================================================================

DO $$
DECLARE
  inactive_gestores_count INTEGER;
  inactive_admins_count INTEGER;
BEGIN
  -- Contar gestores desativados
  SELECT COUNT(*) INTO inactive_gestores_count
  FROM org_members
  WHERE role = 'gestor' AND ativo = false;

  -- Contar admins desativados
  SELECT COUNT(*) INTO inactive_admins_count
  FROM org_members
  WHERE role = 'admin' AND ativo = false;

  RAISE NOTICE '================================================================';
  RAISE NOTICE 'DIAGNÓSTICO - Usuários administrativos desativados:';
  RAISE NOTICE '  - Gestores desativados: %', inactive_gestores_count;
  RAISE NOTICE '  - Admins desativados: %', inactive_admins_count;
  RAISE NOTICE '================================================================';

  IF inactive_gestores_count > 0 OR inactive_admins_count > 0 THEN
    RAISE NOTICE 'ATENÇÃO: Usuários administrativos encontrados como inativos!';
    RAISE NOTICE 'Isso impede login com mensagem "não vinculado a nenhuma organização"';
  ELSE
    RAISE NOTICE 'Nenhum usuário administrativo desativado encontrado.';
  END IF;
END $$;

-- ================================================================================
-- CORREÇÃO: Reativar gestores e admins
-- ================================================================================

-- Reativar todos os gestores e admins que foram desativados
-- JUSTIFICATIVA: Gestores e admins não deveriam ser "desativados" via flag ativo
-- Se precisam ser removidos, devem ser deletados da org_members completamente

DO $$
DECLARE
  reactivated_count INTEGER;
BEGIN
  -- UPDATE dentro do bloco para poder usar GET DIAGNOSTICS
  UPDATE org_members
  SET
    ativo = true,
    updated_at = NOW()
  WHERE role IN ('admin', 'gestor')
    AND ativo = false;

  GET DIAGNOSTICS reactivated_count = ROW_COUNT;

  RAISE NOTICE '================================================================';
  RAISE NOTICE 'CORREÇÃO APLICADA:';
  RAISE NOTICE '  - Usuários administrativos reativados: %', reactivated_count;
  RAISE NOTICE '================================================================';

  IF reactivated_count > 0 THEN
    RAISE NOTICE 'Login de gestores/admins deve funcionar agora!';
  END IF;
END $$;

-- ================================================================================
-- VERIFICAÇÃO: Confirmar que todos os gestores estão ativos
-- ================================================================================

DO $$
DECLARE
  total_gestores INTEGER;
  active_gestores INTEGER;
  total_admins INTEGER;
  active_admins INTEGER;
BEGIN
  -- Contar gestores
  SELECT COUNT(*) INTO total_gestores
  FROM org_members WHERE role = 'gestor';

  SELECT COUNT(*) INTO active_gestores
  FROM org_members WHERE role = 'gestor' AND ativo = true;

  -- Contar admins
  SELECT COUNT(*) INTO total_admins
  FROM org_members WHERE role = 'admin';

  SELECT COUNT(*) INTO active_admins
  FROM org_members WHERE role = 'admin' AND ativo = true;

  RAISE NOTICE '================================================================';
  RAISE NOTICE 'VERIFICAÇÃO FINAL:';
  RAISE NOTICE '  - Gestores: % total, % ativos', total_gestores, active_gestores;
  RAISE NOTICE '  - Admins: % total, % ativos', total_admins, active_admins;
  RAISE NOTICE '================================================================';

  IF total_gestores = active_gestores AND total_admins = active_admins THEN
    RAISE NOTICE '✅ SUCESSO: Todos os usuários administrativos estão ativos!';
  ELSE
    RAISE WARNING '⚠️ ATENÇÃO: Ainda existem usuários administrativos inativos!';
  END IF;
END $$;

-- ================================================================================
-- PREVENÇÃO: Adicionar constraint para evitar desativação de admins/gestores
-- ================================================================================

-- Criar constraint que impede marcar admin/gestor como inativo
-- Se precisar "remover" um admin/gestor, deve deletar o registro ao invés de inativar

ALTER TABLE org_members DROP CONSTRAINT IF EXISTS prevent_admin_deactivation;

ALTER TABLE org_members
ADD CONSTRAINT prevent_admin_deactivation
CHECK (
  -- Se é admin ou gestor, ativo DEVE ser true
  (role IN ('admin', 'gestor') AND ativo = true)
  OR
  -- Outros roles podem ser inativos
  (role NOT IN ('admin', 'gestor'))
);

COMMENT ON CONSTRAINT prevent_admin_deactivation ON org_members IS
  'Impede desativação de admins e gestores via flag ativo.
   Para remover um admin/gestor, DELETE o registro ao invés de UPDATE ativo=false.

   RAZÃO: Desativar admin/gestor causa erro "não vinculado a nenhuma organização" no login,
   pois todas as queries filtram por ativo=true e não encontram o usuário.';

COMMIT;

-- ================================================================================
-- INSTRUÇÕES PARA TESTES
-- ================================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================================';
  RAISE NOTICE 'TESTES RECOMENDADOS:';
  RAISE NOTICE '================================================================';
  RAISE NOTICE '';
  RAISE NOTICE '1. Login como gestor:';
  RAISE NOTICE '   - Acessar aplicação com credenciais de gestor';
  RAISE NOTICE '   - Verificar que NÃO aparece mensagem "não vinculado a nenhuma organização"';
  RAISE NOTICE '   - Verificar que gestor pode acessar dashboard normalmente';
  RAISE NOTICE '';
  RAISE NOTICE '2. Verificar permissões no banco:';
  RAISE NOTICE '   SELECT u.email, u.permissoes, om.role, om.ativo';
  RAISE NOTICE '   FROM usuarios u';
  RAISE NOTICE '   JOIN org_members om ON om.user_id = u.id';
  RAISE NOTICE '   WHERE om.role IN (''admin'', ''gestor'');';
  RAISE NOTICE '';
  RAISE NOTICE '3. Tentar desativar gestor (deve falhar):';
  RAISE NOTICE '   UPDATE org_members SET ativo = false';
  RAISE NOTICE '   WHERE role = ''gestor'';';
  RAISE NOTICE '   -- Deve retornar erro de constraint!';
  RAISE NOTICE '';
  RAISE NOTICE '4. Remover gestor corretamente (se necessário):';
  RAISE NOTICE '   DELETE FROM org_members WHERE user_id = ''<user-id>'' AND org_id = ''<org-id>'';';
  RAISE NOTICE '   -- Isso remove o vínculo sem causar problemas de login';
  RAISE NOTICE '';
  RAISE NOTICE '================================================================';
END $$;

-- Log na tabela de migração
INSERT INTO migration_log (migration_name, status, notes)
VALUES (
  '20260203_fix_gestor_login',
  'success',
  'Reativados gestores/admins desativados. Adicionada constraint para prevenir desativação futura. Login de gestores corrigido.'
)
ON CONFLICT (migration_name) DO UPDATE
SET executed_at = NOW(), status = 'success';
