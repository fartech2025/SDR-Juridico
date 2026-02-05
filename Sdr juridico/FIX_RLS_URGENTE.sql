-- =================================================================
-- EXECUTE ESTE SQL NO SUPABASE DASHBOARD
-- URL: https://supabase.com/dashboard/project/xocqcoebreoiaqxoutar/sql/new
-- =================================================================

-- Policy: Users can always see their own membership records
-- This is CRITICAL - users need to know their org_id on login
DROP POLICY IF EXISTS "users_see_own_membership" ON public.org_members;
CREATE POLICY "users_see_own_membership"
  ON public.org_members
  FOR SELECT
  USING (user_id = auth.uid());

-- Verify the policy was created
SELECT policyname, tablename, cmd, permissive, qual 
FROM pg_policies 
WHERE tablename = 'org_members'
ORDER BY policyname;
