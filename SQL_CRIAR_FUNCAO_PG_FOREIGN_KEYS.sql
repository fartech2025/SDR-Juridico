-- ============================================================
-- CREATE FUNCTION: pg_foreign_keys
-- ============================================================
--
-- Objetivo: Buscar todos os relacionamentos (foreign keys) 
--           entre tabelas em todos os schemas
--
-- Uso: SELECT * FROM public.pg_foreign_keys();
--
-- Retorna:
--   - table_schema: Schema da tabela origem
--   - table_name: Nome da tabela origem
--   - foreign_key_name: Nome da constraint
--   - column_name: Coluna que referencia
--   - foreign_table_schema: Schema da tabela destino
--   - foreign_table_name: Nome da tabela destino
--   - foreign_column_name: Coluna referenciada
--
-- ============================================================

create or replace function public.pg_foreign_keys()
returns table(
    table_schema text,
    table_name text,
    foreign_key_name text,
    column_name text,
    foreign_table_schema text,
    foreign_table_name text,
    foreign_column_name text
)
language sql
as $$
    select
        tc.table_schema,
        tc.table_name,
        tc.constraint_name as foreign_key_name,
        kcu.column_name,
        ccu.table_schema as foreign_table_schema,
        ccu.table_name as foreign_table_name,
        ccu.column_name as foreign_column_name
    from information_schema.table_constraints as tc
    join information_schema.key_column_usage as kcu
        on tc.constraint_name = kcu.constraint_name
        and tc.table_schema = kcu.table_schema
    join information_schema.constraint_column_usage as ccu
        on ccu.constraint_name = tc.constraint_name
        and ccu.table_schema = tc.table_schema
    where tc.constraint_type = 'FOREIGN KEY';
$$;-- ============================================================
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
