#!/bin/bash

# Script to fix pg_foreign_keys function error
# This creates the missing function in Supabase if it doesn't exist

echo "🔧 CORRIGINDO ERRO: pg_foreign_keys function missing"
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI não encontrado. Instale com:"
    echo "   npm install -g supabase"
    exit 1
fi

echo "📝 Aplicando migration..."
npx supabase db push --local

echo ""
echo "✅ Migration aplicada com sucesso!"
echo ""
echo "Se você está usando Supabase Cloud, execute manualmente no SQL Editor:"
echo ""
echo "---"
cat << 'SQL'
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

grant execute on function public.pg_foreign_keys() to anon, authenticated;
comment on function public.pg_foreign_keys() is 'Returns all foreign key relationships in the public schema';
SQL
echo "---"
