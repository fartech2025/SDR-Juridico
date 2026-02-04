-- Fix Existing Permissions
-- Date: 2026-02-03
-- Purpose: Corrigir permissões inconsistentes de usuários com permissão 'gestor' inválida

-- Problema: A função roleToPermissoes() em UserManagement.tsx estava gerando ['org_admin', 'gestor']
-- mas a permissão 'gestor' não existe no sistema. Apenas 'fartech_admin', 'org_admin' e 'user' são válidas.

BEGIN;

-- 1. Corrigir usuários que têm 'gestor' mas não têm 'org_admin'
UPDATE usuarios
SET permissoes = ARRAY['org_admin']::text[]
WHERE permissoes @> ARRAY['gestor']::text[]
  AND NOT (permissoes @> ARRAY['org_admin']::text[]);

-- 2. Remover permissão 'gestor' duplicada de todos os registros
UPDATE usuarios
SET permissoes = ARRAY_REMOVE(permissoes, 'gestor')
WHERE 'gestor' = ANY(permissoes);

-- 3. Garantir que todos os gestores em org_members têm permissão org_admin
UPDATE usuarios u
SET permissoes = ARRAY['org_admin']::text[]
FROM org_members om
WHERE om.user_id = u.id
  AND om.role = 'gestor'
  AND om.ativo = true
  AND NOT (u.permissoes @> ARRAY['org_admin']::text[]);

-- 4. Verificação: Esta query deve retornar 0 linhas após a migração
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM usuarios
  WHERE 'gestor' = ANY(permissoes);

  IF invalid_count > 0 THEN
    RAISE WARNING 'Ainda existem % usuários com permissão "gestor" inválida!', invalid_count;
  ELSE
    RAISE NOTICE 'Sucesso: Nenhum usuário com permissão "gestor" inválida encontrado.';
  END IF;
END $$;

COMMIT;

-- Log na tabela de migração (se existir)
INSERT INTO migration_log (migration_name, status, notes)
VALUES (
  '20260203_fix_existing_permissions',
  'success',
  'Corrigidas permissões inconsistentes: removida permissão "gestor" inválida e garantido que gestores têm "org_admin".'
)
ON CONFLICT (migration_name) DO UPDATE
SET executed_at = NOW(), status = 'success';
