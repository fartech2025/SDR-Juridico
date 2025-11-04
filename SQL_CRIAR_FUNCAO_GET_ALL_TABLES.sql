-- ============================================================
-- CREATE FUNCTION: get_all_tables
-- ============================================================
--
-- Objetivo: Listar todas as tabelas públicas do banco
--
-- Uso: SELECT * FROM public.get_all_tables();
--
-- ============================================================

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

-- ============================================================
-- PERMISSIONS: Grant execute to authenticated and anonymous
-- ============================================================

GRANT EXECUTE ON FUNCTION public.get_all_tables() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_tables() TO anon;

-- ============================================================
-- DOCUMENTATION: Add helpful comment
-- ============================================================

COMMENT ON FUNCTION public.get_all_tables() IS
  'Returns all public tables in the database.
   Used by the DatabaseInspetor page to list available tables.
   Returns a single column: table_name';

-- ============================================================
-- TEST QUERY (execute this to verify it works)
-- ============================================================
-- SELECT * FROM public.get_all_tables();
-- Expected: List of all table names in public schema
