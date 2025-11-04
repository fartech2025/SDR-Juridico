#!/bin/bash

# Script to create pg_foreign_keys function in Supabase
# This handles the error: "Could not find the function public.pg_foreign_keys"
# NOTE: Este projeto usa Supabase Cloud, não Docker

echo "🔧 Para criar função pg_foreign_keys no Supabase..."
echo ""
echo "📋 INSTRUÇÕES:"
echo ""
echo "1️⃣  Abra: https://supabase.com/dashboard"
echo "2️⃣  Selecione seu projeto"
echo "3️⃣  Vá em: SQL Editor → New Query"
echo "4️⃣  Cole o conteúdo de: SQL_CRIAR_FUNCAO_PG_FOREIGN_KEYS.sql"
echo "5️⃣  Clique: RUN"
echo "6️⃣  Recarregue a página da aplicação (F5)"
echo ""
echo "✅ Pronto! Função criada com sucesso!"
echo ""
echo "🎯 NÃO USE DOCKER - Estamos usando Supabase Cloud e Vercel"
echo ""
exit 0
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
