# 🔧 Solução: Erro pg_foreign_keys Function Not Found

**Erro:** `Could not find the function public.pg_foreign_keys without parameters in the schema cache`

**Local:** `DatabaseRelations.tsx` ao tentar buscar relações entre tabelas

---

## 🔍 O Que Causou o Erro

A página `DatabaseRelations.tsx` tenta chamar uma função RPC Supabase que não foi criada:

```typescript
const { data, error } = await supabase.rpc('pg_foreign_keys');
```

A função `pg_foreign_keys()` não existia no banco de dados Supabase.

---

## ✅ Solução

### Opção 1: Supabase Cloud (Recomendado)

1. Acesse o **Supabase Dashboard**
2. Vá para **SQL Editor**
3. Crie uma nova query
4. Cole este SQL:

```sql
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
```

5. Clique **Run** para executar

---

### Opção 2: Supabase Local

```bash
# Execute o script de migração
bash fix_pg_foreign_keys.sh
```

---

### Opção 3: Via CLI

```bash
# Deploy as migrations locais
npx supabase db push --local

# Ou force a sincronização
npx supabase db pull
```

---

## 📋 Arquivos Relacionados

| Arquivo | Propósito |
|---------|----------|
| `app/src/pages/DatabaseRelations.tsx` | Página que chama a função |
| `supabase/migrations/20251103_create_pg_foreign_keys_function.sql` | Migration SQL |
| `fix_pg_foreign_keys.sh` | Script helper |

---

## 🧪 Testar se Funcionou

Após executar o SQL, teste na aplicação:

```bash
cd app
npm run dev
```

Acesse: `http://localhost:5173/database-relations`

Você deve ver:
- ✅ Uma tabela com relacionamentos entre tabelas
- ✅ Sem mensagens de erro

---

## 🐛 Se o Erro Persistir

### Verificar se a função foi criada

No **Supabase SQL Editor**, execute:

```sql
-- Listar todas as functions no schema public
SELECT function_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%foreign%';
```

Resultado esperado: Uma linha com `pg_foreign_keys`

### Verificar permissões

```sql
-- Verificar grants da função
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_routine_grants
WHERE routine_schema = 'public'
AND routine_name = 'pg_foreign_keys';
```

Esperado: Linhas com `anon` e `authenticated` tendo `EXECUTE`

### Reset da função

Se precisar recriar, execute primeiro:

```sql
-- Dropar a função se ela existir com problema
DROP FUNCTION IF EXISTS public.pg_foreign_keys();
```

Depois execute novamente a criação acima.

---

## 📚 Referências

- [Supabase RPC Documentation](https://supabase.com/docs/guides/api/rpc)
- [PostgreSQL Functions](https://www.postgresql.org/docs/current/sql-createfunction.html)
- [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql)

---

**Status:** ✅ Resolvido  
**Data:** 03/11/2025  
**Prioridade:** Média (não afeta fluxo principal do app)
