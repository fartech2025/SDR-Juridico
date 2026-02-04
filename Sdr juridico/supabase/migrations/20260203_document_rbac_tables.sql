-- Document RBAC Tables for Future Use
-- Date: 2026-02-03
-- Purpose: Documentar tabelas roles, permissions e role_permissions que foram criadas mas não estão em uso

BEGIN;

-- ================================================================================
-- DOCUMENTAR TABELAS RBAC NÃO USADAS (SE EXISTIREM)
-- ================================================================================

DO $$
BEGIN
  -- Documentar tabela roles se existir
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'roles') THEN
    COMMENT ON TABLE public.roles IS
      'RESERVADO: Sistema RBAC dinâmico futuro.

       STATUS: Atualmente NÃO USADO

       O sistema atual usa uma abordagem de dois níveis:
       1. usuarios.permissoes[] - Permissões GLOBAIS (fartech_admin, org_admin, user)
       2. org_members.role - Role ESPECÍFICO por organização (admin, gestor, advogado, secretaria, leitura)

       Esta tabela está reservada para futuro sistema de permissões dinâmicas personalizáveis por organização.';
    RAISE NOTICE 'Tabela roles documentada';
  ELSE
    RAISE NOTICE 'Tabela roles não existe - pulando documentação';
  END IF;

  -- Documentar tabela permissions se existir
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'permissions') THEN
    COMMENT ON TABLE public.permissions IS
      'RESERVADO: Permissões granulares para RBAC dinâmico futuro.

       STATUS: Atualmente NÃO USADO

       Esta tabela está reservada para sistema de permissões granulares que permitirá
       controle fino de acesso a recursos específicos (ex: "casos:create", "documentos:delete", etc).';
    RAISE NOTICE 'Tabela permissions documentada';
  ELSE
    RAISE NOTICE 'Tabela permissions não existe - pulando documentação';
  END IF;

  -- Documentar tabela role_permissions se existir
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'role_permissions') THEN
    COMMENT ON TABLE public.role_permissions IS
      'RESERVADO: Join table roles-permissions para RBAC dinâmico futuro.

       STATUS: Atualmente NÃO USADO

       Esta tabela fará a relação N:N entre roles e permissions quando o sistema RBAC dinâmico for implementado.';
    RAISE NOTICE 'Tabela role_permissions documentada';
  ELSE
    RAISE NOTICE 'Tabela role_permissions não existe - pulando documentação';
  END IF;
END $$;

-- ================================================================================
-- DOCUMENTAR SISTEMA ATUAL DE PERMISSÕES
-- ================================================================================

COMMENT ON COLUMN usuarios.permissoes IS
  'Permissões GLOBAIS do usuário (array de strings).

   VALORES VÁLIDOS:
   - [''fartech_admin''] - Super admin da plataforma Fartech (acesso total a todas as orgs)
   - [''org_admin''] - Admin/Gestor de uma organização (acesso total à sua org)
   - [''user''] - Usuário comum (acesso limitado baseado em org_members.role)

   ATENÇÃO: Não adicionar permissões customizadas aqui - use org_members.role para roles específicos.

   MAPEAMENTO COM ORG_MEMBERS.ROLE:
   - org_members.role IN (''admin'', ''gestor'') → usuarios.permissoes = [''org_admin'']
   - org_members.role IN (''advogado'', ''secretaria'', ''leitura'') → usuarios.permissoes = [''user'']
   - fartech_admin nunca tem org_members (acesso global)';

COMMENT ON COLUMN org_members.role IS
  'Role ESPECÍFICO do usuário dentro de uma organização.

   VALORES VÁLIDOS:
   - admin - Administrador da org (full access)
   - gestor - Gestor da org (full access, similar a admin)
   - advogado - Advogado (pode criar/editar casos, clientes, documentos)
   - secretaria - Secretária (acesso limitado, pode criar agendamentos e tarefas)
   - leitura - Somente leitura (read-only em toda a org)

   MAPEAMENTO PARA PERMISSÕES GLOBAIS:
   - admin/gestor → usuarios.permissoes = [''org_admin'']
   - advogado/secretaria/leitura → usuarios.permissoes = [''user'']

   NOTA: Um usuário pode ter roles diferentes em organizações diferentes.
   Exemplo: admin em Org A, advogado em Org B.';

-- ================================================================================
-- ADICIONAR ÍNDICES PARA BUSCAS COMUNS (caso não existam)
-- ================================================================================

-- Índice GIN em usuarios.permissoes para busca eficiente
CREATE INDEX IF NOT EXISTS idx_usuarios_permissoes_gin
  ON usuarios USING GIN(permissoes);

-- Índice em org_members.role para filtros
CREATE INDEX IF NOT EXISTS idx_org_members_role
  ON org_members(role);

-- ================================================================================
-- CRIAR VIEW PARA FACILITAR QUERIES DE PERMISSÕES
-- ================================================================================

-- View que junta usuarios + org_members mostrando permissões efetivas
CREATE OR REPLACE VIEW v_user_effective_permissions AS
SELECT
  u.id AS user_id,
  u.email,
  u.nome_completo,
  u.permissoes AS global_permissions,
  om.org_id,
  o.name AS org_name,
  om.role AS org_role,
  om.ativo AS is_active_in_org,

  -- Permissão efetiva para a org
  CASE
    WHEN 'fartech_admin' = ANY(u.permissoes) THEN 'fartech_admin'
    WHEN om.role IN ('admin', 'gestor') THEN 'org_admin'
    WHEN om.role = 'advogado' THEN 'advogado'
    WHEN om.role = 'secretaria' THEN 'secretaria'
    WHEN om.role = 'leitura' THEN 'leitura'
    ELSE 'user'
  END AS effective_permission,

  -- Flags de acesso
  ('fartech_admin' = ANY(u.permissoes)) AS is_fartech_admin,
  (om.role IN ('admin', 'gestor')) AS is_org_admin,
  (om.role = 'advogado') AS is_advogado

FROM usuarios u
LEFT JOIN org_members om ON om.user_id = u.id
LEFT JOIN orgs o ON o.id = om.org_id;

COMMENT ON VIEW v_user_effective_permissions IS
  'View helper que mostra as permissões efetivas de cada usuário por organização.

   Útil para queries que precisam verificar acesso, gerar relatórios de usuários, etc.

   Exemplo de uso:
   SELECT * FROM v_user_effective_permissions
   WHERE org_id = ''<org-id>'' AND is_org_admin = true;';

COMMIT;

-- ================================================================================
-- VERIFICAÇÃO E RECOMENDAÇÕES
-- ================================================================================

DO $$
DECLARE
  roles_exists BOOLEAN;
  permissions_exists BOOLEAN;
  role_perms_exists BOOLEAN;
  roles_count INTEGER := 0;
  permissions_count INTEGER := 0;
  role_perms_count INTEGER := 0;
BEGIN
  -- Verificar se as tabelas existem
  roles_exists := EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'roles');
  permissions_exists := EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'permissions');
  role_perms_exists := EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'role_permissions');

  -- Contar registros apenas se as tabelas existirem
  IF roles_exists THEN
    SELECT COUNT(*) INTO roles_count FROM roles;
  END IF;

  IF permissions_exists THEN
    SELECT COUNT(*) INTO permissions_count FROM permissions;
  END IF;

  IF role_perms_exists THEN
    SELECT COUNT(*) INTO role_perms_count FROM role_permissions;
  END IF;

  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'RBAC Tables Status:';

  IF roles_exists THEN
    RAISE NOTICE '  - roles: % registros', roles_count;
  ELSE
    RAISE NOTICE '  - roles: NÃO EXISTE';
  END IF;

  IF permissions_exists THEN
    RAISE NOTICE '  - permissions: % registros', permissions_count;
  ELSE
    RAISE NOTICE '  - permissions: NÃO EXISTE';
  END IF;

  IF role_perms_exists THEN
    RAISE NOTICE '  - role_permissions: % registros', role_perms_count;
  ELSE
    RAISE NOTICE '  - role_permissions: NÃO EXISTE';
  END IF;

  RAISE NOTICE '';

  IF NOT roles_exists AND NOT permissions_exists AND NOT role_perms_exists THEN
    RAISE NOTICE 'Tabelas RBAC NÃO EXISTEM no banco.';
    RAISE NOTICE 'Sistema atual usa usuarios.permissoes[] + org_members.role';
  ELSIF roles_count = 0 AND permissions_count = 0 AND role_perms_count = 0 THEN
    RAISE NOTICE 'Tabelas RBAC existem mas estão vazias (como esperado).';
    RAISE NOTICE 'Sistema atual usa usuarios.permissoes[] + org_members.role';
  ELSE
    RAISE WARNING 'Tabelas RBAC têm dados! Verificar se estão sendo usadas.';
  END IF;

  RAISE NOTICE '=================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Sistema de Permissões Atual:';
  RAISE NOTICE '  - usuarios.permissoes[] → Permissões globais (fartech_admin, org_admin, user)';
  RAISE NOTICE '  - org_members.role → Roles por org (admin, gestor, advogado, secretaria, leitura)';
  RAISE NOTICE '=================================================================';
END $$;

-- Log na tabela de migração
INSERT INTO migration_log (migration_name, status, notes)
VALUES (
  '20260203_document_rbac_tables',
  'success',
  'Tabelas RBAC documentadas. View v_user_effective_permissions criada para facilitar queries de permissões.'
)
ON CONFLICT (migration_name) DO UPDATE
SET executed_at = NOW(), status = 'success';
