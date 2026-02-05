-- ============================================================
-- Migration: Fix org_members RLS - Allow users to see own records
-- Date: 2026-02-05
-- Issue: Users cannot query their own org_members record due to RLS
-- Solution: Add policy that allows user_id = auth.uid()
-- ============================================================

-- Enable RLS (should already be enabled, but just in case)
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

-- Policy: Users can always see their own membership records
-- This is CRITICAL for the app to work - users need to know their org_id
DROP POLICY IF EXISTS "users_see_own_membership" ON public.org_members;
CREATE POLICY "users_see_own_membership"
  ON public.org_members
  FOR SELECT
  USING (user_id = auth.uid());

-- Also ensure the SECURITY DEFINER functions exist for other policies
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

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION public.is_org_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_admin_for_org(UUID) TO authenticated;

-- ============================================================
-- VERIFICACAO
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed: users_see_own_membership policy added';
END $$;
