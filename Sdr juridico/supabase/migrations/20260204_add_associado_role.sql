-- Migration: Adicionar role 'associado' conforme Arquitetura Canônica
-- Data: 2026-02-04
-- Prioridade: CRÍTICA
-- Descrição: Adiciona o role 'associado' que estava faltando na hierarquia de permissões
--
-- HIERARQUIA CANÔNICA:
--   fartech_admin → org_owner → org_admin → advogado → ASSOCIADO → secretaria → leitura
--
-- O role 'associado' é para advogados associados com acesso limitado aos casos atribuídos
--
-- NOTA: O PostgreSQL não permite usar novos valores de enum na mesma transação 
--       em que foram adicionados. Por isso este script é dividido em partes.

-- =====================================================
-- PARTE 1: Adicionar valor ao enum (COMMIT SEPARADO)
-- =====================================================

-- Adicionar 'associado' ao enum user_role se existir
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    -- Verificar se 'associado' já existe no enum
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'user_role' AND e.enumlabel = 'associado'
    ) THEN
      ALTER TYPE user_role ADD VALUE 'associado' AFTER 'advogado';
      RAISE NOTICE 'Valor "associado" adicionado ao enum user_role';
    ELSE
      RAISE NOTICE 'Valor "associado" já existe no enum user_role';
    END IF;
  ELSE
    RAISE NOTICE 'Enum user_role não existe - usando apenas constraint check';
  END IF;
END $$;

-- =====================================================
-- PARTE 2: Atualizar constraint (não depende do enum)
-- =====================================================

ALTER TABLE org_members 
  DROP CONSTRAINT IF EXISTS org_members_role_check;

-- Usar TEXT para a constraint, não depende do enum
ALTER TABLE org_members 
  ADD CONSTRAINT org_members_role_check 
  CHECK (role::text IN ('admin', 'gestor', 'advogado', 'associado', 'secretaria', 'leitura', 'viewer'));

-- =====================================================
-- PARTE 3: Criar função helper usando TEXT (não ENUM)
-- =====================================================

-- Função usa comparação com TEXT, não com o enum diretamente
CREATE OR REPLACE FUNCTION public.is_associado(_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.org_members om
    WHERE om.org_id = _org_id
      AND om.user_id = auth.uid()
      AND om.ativo = true
      AND om.role::text = 'associado'  -- Cast para TEXT evita problema do enum
  );
$$;

COMMENT ON FUNCTION public.is_associado IS
  'Verifica se o usuário atual é um associado na organização especificada.
   Associados têm acesso limitado aos casos que lhes foram atribuídos.';

-- =====================================================
-- PARTE 4: Documentar a mudança
-- =====================================================

COMMENT ON COLUMN org_members.role IS
  'Role do usuário na organização.
   
   HIERARQUIA DE PERMISSÕES:
   - admin: Administrador (full access, pode gerenciar membros)
   - gestor: Gestor (full access, similar a admin)
   - advogado: Advogado titular (criar/editar casos, clientes, docs)
   - associado: Advogado associado (acesso limitado a casos atribuídos)
   - secretaria: Secretária (agendamentos, tarefas básicas, não edita casos)
   - leitura: Somente leitura (read-only em toda a org)
   - viewer: Visualizador (alias para leitura)
   
   MAPEAMENTO PARA PERMISSÕES GLOBAIS:
   - admin/gestor → usuarios.permissoes = [''org_admin'']
   - advogado/associado/secretaria/leitura → usuarios.permissoes = [''user'']';

-- =====================================================
-- PARTE 5: Registrar no audit_log (opcional)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_log') THEN
    INSERT INTO audit_log (table_name, record_id, action, new_data, metadata)
    VALUES (
      'org_members',
      '00000000-0000-0000-0000-000000000000'::uuid,
      'SCHEMA_CHANGE',
      jsonb_build_object(
        'change', 'Added associado role',
        'constraint', 'org_members_role_check',
        'values', ARRAY['admin', 'gestor', 'advogado', 'associado', 'secretaria', 'leitura', 'viewer']
      ),
      jsonb_build_object(
        'migration', '20260204_add_associado_role',
        'reason', 'Arquitetura Canônica compliance'
      )
    );
    RAISE NOTICE 'Mudança registrada no audit_log';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Não foi possível registrar no audit_log: %', SQLERRM;
END $$;

-- Verificação final
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 20260204_add_associado_role executada com sucesso!';
  RAISE NOTICE 'Role "associado" agora disponível em org_members.role';
END $$;
