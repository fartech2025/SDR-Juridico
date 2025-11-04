-- ============================================================
-- CREATE FUNCTION: pg_foreign_keys
-- ============================================================
-- 
-- Objetivo: Buscar todos os relacionamentos (foreign keys) 
--           entre tabelas no schema public
--
-- Uso: SELECT * FROM public.pg_foreign_keys();
--
-- ============================================================

create or replace function public.pg_foreign_keys()
returns table(
  tabela_origem text,
  coluna_origem text,
  tabela_destino text,
  coluna_destino text
)
language sql
stable
as $$
  select
    tc.table_name as tabela_origem,
    kcu.column_name as coluna_origem,
    ccu.table_name as tabela_destino,
    ccu.column_name as coluna_destino
  from
    information_schema.table_constraints as tc
    join information_schema.key_column_usage as kcu
      on tc.constraint_name = kcu.constraint_name
      and tc.table_schema = kcu.table_schema
    join information_schema.constraint_column_usage as ccu
      on ccu.constraint_name = tc.constraint_name
      and ccu.table_schema = tc.table_schema
  where
    tc.constraint_type = 'FOREIGN KEY'
    and tc.table_schema = 'public'
  order by
    tc.table_name,
    kcu.column_name;
$$;

-- ============================================================
-- PERMISSIONS: Grant execute to anonymous and authenticated
-- ============================================================

grant execute on function public.pg_foreign_keys() to anon, authenticated;

-- ============================================================
-- DOCUMENTATION: Add helpful comment
-- ============================================================

comment on function public.pg_foreign_keys() is 
  'Returns all foreign key relationships in the public schema. 
   Used by the DatabaseRelations page to visualize table connections.
   Columns: tabela_origem, coluna_origem, tabela_destino, coluna_destino';

-- ============================================================
-- TEST QUERY (execute this to verify it works)
-- ============================================================
-- SELECT * FROM public.pg_foreign_keys();
-- Expected: Multiple rows showing foreign key relationships
