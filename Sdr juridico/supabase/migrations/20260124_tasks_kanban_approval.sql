-- Migration: Kanban de tarefas com aprovação do gestor + solicitações de documentos
-- Date: 2026-01-24
-- Notes:
-- 1) Esta migration é defensiva (IF EXISTS) pois o projeto pode ter variações de schema.
-- 2) Reutiliza helpers de org_members: is_org_member / is_org_admin_for_org (admin+gestor).

-- =========================
-- 0) Helpers (garantir)
-- =========================
CREATE OR REPLACE FUNCTION public.is_org_member(_org_id UUID)
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
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin_for_org(_org_id UUID)
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
      AND om.role IN ('admin', 'gestor')
  );
$$;

-- =========================
-- 1) Enum (task_status) - adicionar "devolvida"
-- =========================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'task_status' AND e.enumlabel = 'devolvida'
    ) THEN
      ALTER TYPE task_status ADD VALUE 'devolvida';
    END IF;
  END IF;
END $$;

-- =========================
-- 2) Evolução de public.tarefas
-- =========================
ALTER TABLE IF EXISTS public.tarefas
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmed_by uuid references auth.users(id),
  ADD COLUMN IF NOT EXISTS rejected_reason text;

CREATE INDEX IF NOT EXISTS tarefas_org_status_idx ON public.tarefas(org_id, status);
CREATE INDEX IF NOT EXISTS tarefas_org_assigned_idx ON public.tarefas(org_id, assigned_user_id);
CREATE INDEX IF NOT EXISTS tarefas_org_due_idx ON public.tarefas(org_id, due_at);

-- =========================
-- 3) Solicitações de documentos por tarefa
-- =========================
CREATE TABLE IF NOT EXISTS public.tarefa_documentos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  org_id uuid not null references public.orgs(id),
  tarefa_id uuid not null references public.tarefas(id) on delete cascade,
  documento_id uuid references public.documentos(id) on delete set null,
  label text not null,
  solicitado boolean not null default true,
  entregue boolean not null default false,
  delivered_at timestamptz,
  requested_by uuid references auth.users(id),
  uploaded_by uuid references auth.users(id)
);

CREATE INDEX IF NOT EXISTS tarefa_documentos_org_task_idx ON public.tarefa_documentos(org_id, tarefa_id);

-- =========================
-- 4) RLS - tarefas
-- =========================
ALTER TABLE IF EXISTS public.tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tarefas FORCE ROW LEVEL SECURITY;

-- SELECT
DROP POLICY IF EXISTS tarefas_select_advogado ON public.tarefas;
CREATE POLICY tarefas_select_advogado
ON public.tarefas
FOR SELECT
USING (
  assigned_user_id = auth.uid()
);

DROP POLICY IF EXISTS tarefas_select_admin ON public.tarefas;
CREATE POLICY tarefas_select_admin
ON public.tarefas
FOR SELECT
USING (
  is_org_admin_for_org(org_id)
);

-- INSERT
DROP POLICY IF EXISTS tarefas_insert_advogado ON public.tarefas;
CREATE POLICY tarefas_insert_advogado
ON public.tarefas
FOR INSERT
WITH CHECK (
  assigned_user_id = auth.uid()
);

DROP POLICY IF EXISTS tarefas_insert_admin ON public.tarefas;
CREATE POLICY tarefas_insert_admin
ON public.tarefas
FOR INSERT
WITH CHECK (
  is_org_admin_for_org(org_id)
);

-- UPDATE
DROP POLICY IF EXISTS tarefas_update_advogado ON public.tarefas;
CREATE POLICY tarefas_update_advogado
ON public.tarefas
FOR UPDATE
USING (
  assigned_user_id = auth.uid()
)
WITH CHECK (
  assigned_user_id = auth.uid()
);

DROP POLICY IF EXISTS tarefas_update_admin ON public.tarefas;
CREATE POLICY tarefas_update_admin
ON public.tarefas
FOR UPDATE
USING (
  is_org_admin_for_org(org_id)
)
WITH CHECK (
  is_org_admin_for_org(org_id)
);

-- DELETE
DROP POLICY IF EXISTS tarefas_delete_admin ON public.tarefas;
CREATE POLICY tarefas_delete_admin
ON public.tarefas
FOR DELETE
USING (
  is_org_admin_for_org(org_id)
);

-- =========================
-- 5) RLS - tarefa_documentos
-- =========================
ALTER TABLE IF EXISTS public.tarefa_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tarefa_documentos FORCE ROW LEVEL SECURITY;

-- SELECT
DROP POLICY IF EXISTS tarefa_documentos_select_advogado ON public.tarefa_documentos;
CREATE POLICY tarefa_documentos_select_advogado
ON public.tarefa_documentos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tarefas t
    WHERE t.id = tarefa_id
      AND t.assigned_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS tarefa_documentos_select_admin ON public.tarefa_documentos;
CREATE POLICY tarefa_documentos_select_admin
ON public.tarefa_documentos
FOR SELECT
USING (
  is_org_admin_for_org(org_id)
);

-- INSERT
DROP POLICY IF EXISTS tarefa_documentos_insert_admin ON public.tarefa_documentos;
CREATE POLICY tarefa_documentos_insert_admin
ON public.tarefa_documentos
FOR INSERT
WITH CHECK (
  is_org_admin_for_org(org_id)
);

-- UPDATE
DROP POLICY IF EXISTS tarefa_documentos_update_advogado ON public.tarefa_documentos;
CREATE POLICY tarefa_documentos_update_advogado
ON public.tarefa_documentos
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.tarefas t
    WHERE t.id = tarefa_id
      AND t.assigned_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tarefas t
    WHERE t.id = tarefa_id
      AND t.assigned_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS tarefa_documentos_update_admin ON public.tarefa_documentos;
CREATE POLICY tarefa_documentos_update_admin
ON public.tarefa_documentos
FOR UPDATE
USING (
  is_org_admin_for_org(org_id)
)
WITH CHECK (
  is_org_admin_for_org(org_id)
);

-- DELETE
DROP POLICY IF EXISTS tarefa_documentos_delete_admin ON public.tarefa_documentos;
CREATE POLICY tarefa_documentos_delete_admin
ON public.tarefa_documentos
FOR DELETE
USING (
  is_org_admin_for_org(org_id)
);
