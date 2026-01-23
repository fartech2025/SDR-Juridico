-- Fix RLS for tarefas: remove global admin access and enforce org membership.
-- This keeps access limited to org members and assigned users.

BEGIN;

ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_all_tarefas ON public.tarefas;
DROP POLICY IF EXISTS tarefas_select ON public.tarefas;
DROP POLICY IF EXISTS tarefas_write ON public.tarefas;

CREATE POLICY tarefas_select
  ON public.tarefas
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.org_members m
      WHERE m.org_id = tarefas.org_id
        AND m.user_id = auth.uid()
        AND m.ativo = true
    )
    AND (
      EXISTS (
        SELECT 1
        FROM public.org_members m
        WHERE m.org_id = tarefas.org_id
          AND m.user_id = auth.uid()
          AND m.ativo = true
          AND m.role IN ('admin', 'gestor', 'advogado', 'secretaria')
      )
      OR tarefas.assigned_user_id = auth.uid()
    )
  );

CREATE POLICY tarefas_write
  ON public.tarefas
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.org_members m
      WHERE m.org_id = tarefas.org_id
        AND m.user_id = auth.uid()
        AND m.ativo = true
    )
    AND (
      EXISTS (
        SELECT 1
        FROM public.org_members m
        WHERE m.org_id = tarefas.org_id
          AND m.user_id = auth.uid()
          AND m.ativo = true
          AND m.role IN ('admin', 'gestor', 'advogado', 'secretaria')
      )
      OR tarefas.assigned_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.org_members m
      WHERE m.org_id = tarefas.org_id
        AND m.user_id = auth.uid()
        AND m.ativo = true
    )
    AND (
      EXISTS (
        SELECT 1
        FROM public.org_members m
        WHERE m.org_id = tarefas.org_id
          AND m.user_id = auth.uid()
          AND m.ativo = true
          AND m.role IN ('admin', 'gestor', 'advogado', 'secretaria')
      )
      OR tarefas.assigned_user_id = auth.uid()
    )
  );

COMMIT;
