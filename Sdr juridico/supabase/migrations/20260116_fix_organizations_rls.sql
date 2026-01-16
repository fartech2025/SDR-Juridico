-- Fix organizations RLS to use public.usuarios permissions
-- Date: 2026-01-16

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Fartech admins see all organizations" ON organizations;
DROP POLICY IF EXISTS "Org admins see their organization" ON organizations;
DROP POLICY IF EXISTS "Fartech admins manage all organizations" ON organizations;
DROP POLICY IF EXISTS "Org admins update their organization" ON organizations;

CREATE POLICY "Fartech admins see all organizations"
  ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.usuarios u
      WHERE u.id = auth.uid()
        AND u.permissoes @> ARRAY['fartech_admin']::text[]
    )
  );

CREATE POLICY "Org admins see their organization"
  ON organizations FOR SELECT
  USING (
    managed_by = auth.uid()
  );

CREATE POLICY "Fartech admins manage all organizations"
  ON organizations FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.usuarios u
      WHERE u.id = auth.uid()
        AND u.permissoes @> ARRAY['fartech_admin']::text[]
    )
  );

CREATE POLICY "Org admins update their organization"
  ON organizations FOR UPDATE
  USING (
    managed_by = auth.uid()
  );
