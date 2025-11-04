#!/bin/bash

# Script to create pg_foreign_keys function in Supabase
# This handles the error: "Could not find the function public.pg_foreign_keys"

echo "🔧 Criando função pg_foreign_keys no Supabase..."
echo ""

# Check if user has provided Supabase project info
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "⚠️  Variáveis de ambiente não encontradas."
    echo "   SUPABASE_URL e SUPABASE_ANON_KEY precisam estar definidas."
    echo ""
    echo "📋 OPÇÕES:"
    echo ""
    echo "1️⃣  MANUAL (Recomendado para Supabase Cloud):"
    echo "   • Abra: https://app.supabase.io/project/_/sql"
    echo "   • Cole o SQL abaixo"
    echo "   • Clique RUN"
    echo ""
    echo "2️⃣  AUTOMÁTICO (Para Supabase Local):"
    echo "   • Certifique que Docker está rodando"
    echo "   • Execute: npx supabase db push"
    echo ""
    exit 1
fi

# Create the function using psql or supabase CLI
echo "📝 Executando SQL..."

cat << 'SQL' | psql "$SUPABASE_URL" -U postgres
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

if [ $? -eq 0 ]; then
    echo "✅ Função criada com sucesso!"
else
    echo "❌ Erro ao criar função"
    exit 1
fi
