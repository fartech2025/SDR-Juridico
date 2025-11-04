-- Execute este script no Supabase SQL Editor
-- https://supabase.com/dashboard/project/mskvucuaarutehslvhsp/sql/new

-- Create a function to list all public tables
CREATE OR REPLACE FUNCTION public.get_all_tables()
RETURNS TABLE (table_name TEXT)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT table_name::TEXT
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  ORDER BY table_name;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_all_tables() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_tables() TO anon;

-- Test the function
SELECT * FROM public.get_all_tables();
