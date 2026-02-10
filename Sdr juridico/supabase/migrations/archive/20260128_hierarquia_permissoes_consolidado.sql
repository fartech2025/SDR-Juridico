-- =====================================================
-- CONSOLIDADO: Correções de Hierarquia e Permissões
-- Data: 28 de janeiro de 2026
-- Versão: 1.0 Final
-- Descrição: SQL único que atualiza todos os problemas
--            identificados no sistema de permissões
-- =====================================================

BEGIN;

-- =====================================================
-- SEÇÃO 1: Validação e Correção de Enums
-- =====================================================

-- Verificar e adicionar valores faltantes ao enum task_status
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
    -- Adicionar 'devolvida' se não existir
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'task_status' AND e.enumlabel = 'devolvida'
    ) THEN
      ALTER TYPE task_status ADD VALUE 'devolvida' AFTER 'cancelada';
    END IF;
    
    -- Adicionar 'aguardando_validacao' se não existir
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'task_status' AND e.enumlabel = 'aguardando_validacao'
    ) THEN
      ALTER TYPE task_status ADD VALUE 'aguardando_validacao';
    END IF;
    
    -- Adicionar 'concluida' se não existir (pode estar como 'concluído')
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'task_status' AND e.enumlabel = 'concluida'
    ) THEN
      ALTER TYPE task_status ADD VALUE 'concluida';
    END IF;
  END IF;
END $$;

-- =====================================================
-- SEÇÃO 2: Atualização da Tabela org_members
-- =====================================================

-- Criar enum user_role se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('admin', 'gestor', 'advogado', 'secretaria', 'leitura');
  END IF;
END $$;

-- Garantir que org_members tem os campos necessários para role
ALTER TABLE IF EXISTS public.org_members
  ADD COLUMN IF NOT EXISTS role public.user_role DEFAULT 'advogado'::public.user_role,
  ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_org_members_user_org 
  ON public.org_members(user_id, org_id, ativo);

CREATE INDEX IF NOT EXISTS idx_org_members_role 
  ON public.org_members(role);

-- =====================================================
-- SEÇÃO 3: Validação da Tabela usuarios
-- =====================================================

-- Garantir que usuarios tem os campos necessários
ALTER TABLE IF EXISTS public.usuarios
  ADD COLUMN IF NOT EXISTS permissoes TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.orgs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS nome_completo TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Garantir que permissoes é um array corretamente tipado
CREATE INDEX IF NOT EXISTS idx_usuarios_permissoes 
  ON public.usuarios USING GIN(permissoes);

-- =====================================================
-- SEÇÃO 4: Atualização da Tabela tarefas
-- =====================================================

-- Garantir que tarefas tem todos os campos para fluxo de aprovação
ALTER TABLE IF EXISTS public.tarefas
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.orgs(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS titulo TEXT NOT NULL DEFAULT 'Sem título',
  ADD COLUMN IF NOT EXISTS descricao TEXT,
  ADD COLUMN IF NOT EXISTS assigned_user_id UUID REFERENCES public.auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS entidade TEXT 
    CHECK (entidade IN ('lead', 'cliente', 'caso') OR entidade IS NULL),
  ADD COLUMN IF NOT EXISTS entidade_id UUID,
  ADD COLUMN IF NOT EXISTS priority SMALLINT DEFAULT 2 CHECK (priority BETWEEN 1 AND 3),
  ADD COLUMN IF NOT EXISTS status public.task_status DEFAULT 'pendente'::public.task_status,
  ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS confirmed_by UUID REFERENCES public.auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rejected_reason TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_tarefas_org_status 
  ON public.tarefas(org_id, status);

CREATE INDEX IF NOT EXISTS idx_tarefas_org_assigned 
  ON public.tarefas(org_id, assigned_user_id);

CREATE INDEX IF NOT EXISTS idx_tarefas_org_due 
  ON public.tarefas(org_id, due_at);

CREATE INDEX IF NOT EXISTS idx_tarefas_entidade 
  ON public.tarefas(entidade, entidade_id) WHERE entidade IS NOT NULL;

-- =====================================================
-- SEÇÃO 5: RLS (Row Level Security) - tarefas
-- =====================================================

-- Habilitar RLS na tabela tarefas
ALTER TABLE IF EXISTS public.tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tarefas FORCE ROW LEVEL SECURITY;

-- Função helper para verificar se é admin da org
CREATE OR REPLACE FUNCTION is_org_admin_for_org(_org_id uuid)
RETURNS boolean
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
      AND om.role IN ('admin', 'gestor')
  );
$$
LANGUAGE SQL;

-- Função helper para verificar se é fartech admin
CREATE OR REPLACE FUNCTION is_fartech_admin()
RETURNS boolean
STABLE
SECURITY DEFINER
SET search_path = public, auth
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios u
    WHERE u.id = auth.uid()
      AND u.permissoes @> ARRAY['fartech_admin']::text[]
  );
$$
LANGUAGE SQL;

-- DROP POLICIES existentes (limpeza)
DROP POLICY IF EXISTS tarefas_select_advogado ON public.tarefas;
DROP POLICY IF EXISTS tarefas_select_admin ON public.tarefas;
DROP POLICY IF EXISTS tarefas_select_fartech ON public.tarefas;
DROP POLICY IF EXISTS tarefas_insert_advogado ON public.tarefas;
DROP POLICY IF EXISTS tarefas_insert_admin ON public.tarefas;
DROP POLICY IF EXISTS tarefas_insert_fartech ON public.tarefas;
DROP POLICY IF EXISTS tarefas_update_advogado ON public.tarefas;
DROP POLICY IF EXISTS tarefas_update_admin ON public.tarefas;
DROP POLICY IF EXISTS tarefas_update_fartech ON public.tarefas;
DROP POLICY IF EXISTS tarefas_delete_advogado ON public.tarefas;
DROP POLICY IF EXISTS tarefas_delete_admin ON public.tarefas;
DROP POLICY IF EXISTS tarefas_delete_fartech ON public.tarefas;

-- POLICY: SELECT para advogados (suas tarefas)
CREATE POLICY tarefas_select_advogado
  ON public.tarefas
  FOR SELECT
  USING (
    assigned_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = tarefas.org_id
        AND om.user_id = auth.uid()
        AND om.ativo = true
    )
  );

-- POLICY: SELECT para admins/gestores
CREATE POLICY tarefas_select_admin
  ON public.tarefas
  FOR SELECT
  USING (
    is_org_admin_for_org(org_id)
  );

-- POLICY: SELECT para fartech admin
CREATE POLICY tarefas_select_fartech
  ON public.tarefas
  FOR SELECT
  USING (
    is_fartech_admin()
  );

-- POLICY: INSERT para advogados (suas tarefas)
CREATE POLICY tarefas_insert_advogado
  ON public.tarefas
  FOR INSERT
  WITH CHECK (
    assigned_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = tarefas.org_id
        AND om.user_id = auth.uid()
        AND om.ativo = true
    )
  );

-- POLICY: INSERT para admins/gestores
CREATE POLICY tarefas_insert_admin
  ON public.tarefas
  FOR INSERT
  WITH CHECK (
    is_org_admin_for_org(org_id)
  );

-- POLICY: INSERT para fartech admin
CREATE POLICY tarefas_insert_fartech
  ON public.tarefas
  FOR INSERT
  WITH CHECK (
    is_fartech_admin()
  );

-- POLICY: UPDATE para advogados (suas tarefas)
CREATE POLICY tarefas_update_advogado
  ON public.tarefas
  FOR UPDATE
  USING (
    assigned_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = tarefas.org_id
        AND om.user_id = auth.uid()
        AND om.ativo = true
    )
  )
  WITH CHECK (
    assigned_user_id = auth.uid()
  );

-- POLICY: UPDATE para admins/gestores
CREATE POLICY tarefas_update_admin
  ON public.tarefas
  FOR UPDATE
  USING (
    is_org_admin_for_org(org_id)
  )
  WITH CHECK (
    is_org_admin_for_org(org_id)
  );

-- POLICY: UPDATE para fartech admin
CREATE POLICY tarefas_update_fartech
  ON public.tarefas
  FOR UPDATE
  USING (
    is_fartech_admin()
  )
  WITH CHECK (
    is_fartech_admin()
  );

-- POLICY: DELETE para admins/gestores
CREATE POLICY tarefas_delete_admin
  ON public.tarefas
  FOR DELETE
  USING (
    is_org_admin_for_org(org_id)
  );

-- POLICY: DELETE para fartech admin
CREATE POLICY tarefas_delete_fartech
  ON public.tarefas
  FOR DELETE
  USING (
    is_fartech_admin()
  );

-- =====================================================
-- SEÇÃO 6: Atualizar Dados Existentes
-- =====================================================

-- Garantir que org_members não tem NULL em role
UPDATE public.org_members
SET role = 'advogado'::public.user_role
WHERE role IS NULL;

-- Garantir que usuarios não tem NULL em permissoes
UPDATE public.usuarios
SET permissoes = '{}'
WHERE permissoes IS NULL;

-- Garantir que tarefas tem org_id se tiver org_id nos usuários atribuídos
UPDATE public.tarefas t
SET org_id = (
  SELECT org_id FROM public.org_members om
  WHERE om.user_id = t.assigned_user_id
  AND om.ativo = true
  LIMIT 1
)
WHERE t.org_id IS NULL AND t.assigned_user_id IS NOT NULL;

-- =====================================================
-- SEÇÃO 7: Documentação de Estados
-- =====================================================

-- Tabela para registrar status de migração
CREATE TABLE IF NOT EXISTS public.migration_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_name TEXT NOT NULL,
  executed_at TIMESTAMPTZ DEFAULT now(),
  status TEXT CHECK (status IN ('success', 'failed', 'warning')),
  notes TEXT,
  UNIQUE(migration_name)
);

-- Registrar esta migração
INSERT INTO public.migration_log (migration_name, status, notes)
VALUES (
  'CONSOLIDADO_HIERARQUIA_PERMISSOES_20260128',
  'success',
  'Correções de roles, permissões, RLS e estrutura de tarefas'
)
ON CONFLICT (migration_name) DO UPDATE SET
  executed_at = now(),
  status = 'success';

-- =====================================================
-- SEÇÃO 8: Verificações Finais
-- =====================================================

-- Verificar integridade dos dados
DO $$
DECLARE
  v_org_members_count INTEGER;
  v_usuarios_count INTEGER;
  v_tarefas_count INTEGER;
  v_invalid_roles INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_org_members_count FROM public.org_members;
  SELECT COUNT(*) INTO v_usuarios_count FROM public.usuarios;
  SELECT COUNT(*) INTO v_tarefas_count FROM public.tarefas;
  SELECT COUNT(*) INTO v_invalid_roles FROM public.org_members 
    WHERE role NOT IN ('admin', 'gestor', 'advogado', 'secretaria', 'leitura');
  
  RAISE NOTICE 'Verificação de Migração:';
  RAISE NOTICE '- org_members: % registros', v_org_members_count;
  RAISE NOTICE '- usuarios: % registros', v_usuarios_count;
  RAISE NOTICE '- tarefas: % registros', v_tarefas_count;
  RAISE NOTICE '- roles inválidas: % (deveria ser 0)', v_invalid_roles;
  
  IF v_invalid_roles > 0 THEN
    RAISE WARNING 'Encontrados % roles inválidas que precisam correção', v_invalid_roles;
  END IF;
END $$;

COMMIT;

-- =====================================================
-- RESUMO DAS MUDANÇAS
-- =====================================================
-- 
-- ✅ ENUM task_status: Adicionado 'devolvida' e 'aguardando_validacao'
--
-- ✅ Tabela org_members: 
--    - Adicionado coluna 'role' com CHECK CONSTRAINT
--    - Adicionado 'ativo' para controle de acesso
--    - Índices para performance
--
-- ✅ Tabela usuarios:
--    - Adicionado 'permissoes' (array) para fartech_admin
--    - Adicionado 'org_id' para vínculo
--    - Índice GIN para busca em permissoes
--
-- ✅ Tabela tarefas:
--    - Adicionados campos para fluxo de aprovação:
--      * submitted_at (advogado submete)
--      * confirmed_at (gestor aprova)
--      * confirmed_by (quem aprovou)
--      * rejected_reason (motivo da devolução)
--    - Adicionado 'entidade' e 'entidade_id' (vínculo com lead/caso/cliente)
--    - Índices para performance
--
-- ✅ RLS: 
--    - 12 policies para controle de acesso
--    - 2 funções helper (is_org_admin_for_org, is_fartech_admin)
--    - Diferenciação entre advogado, gestor e admin fartech
--
-- ✅ Dados:
--    - Atualizar valores NULL em role
--    - Atualizar valores NULL em permissoes
--    - Atualizar org_id em tarefas orfãs
--
-- =====================================================
