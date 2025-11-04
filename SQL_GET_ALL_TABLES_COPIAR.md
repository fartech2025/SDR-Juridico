# 📋 SQL PRONTO PARA COPIAR - get_all_tables()

**Data:** 04/11/2025  
**Função:** get_all_tables()  
**Ação:** CRIAR A ÚLTIMA FUNÇÃO  

---

## 🎯 Copie Este SQL Completo

```sql
-- ============================================================
-- CREATE FUNCTION: get_all_tables
-- ============================================================

create or replace function public.get_all_tables()
returns table(table_name text)
language sql
security definer
as $$
  select table_name::text
  from information_schema.tables
  where table_schema = 'public'
    and table_type = 'BASE TABLE'
  order by table_name;
$$;

-- ============================================================
-- PERMISSIONS
-- ============================================================

grant execute on function public.get_all_tables() to authenticated;
grant execute on function public.get_all_tables() to anon;

-- ============================================================
-- COMMENT
-- ============================================================

comment on function public.get_all_tables() is
  'Returns all public tables in the database.
   Used by the DatabaseInspetor page to list available tables.
   Returns a single column: table_name';

-- ============================================================
-- TEST (execute this after to verify)
-- ============================================================
-- SELECT * FROM public.get_all_tables();
-- Expected: List of all table names
```

---

## ✅ Onde Executar

1. Abra: https://supabase.com/dashboard
2. Vá para: **SQL Editor**
3. Clique em: **New Query**
4. Cole TODO o SQL acima
5. Clique em: **RUN**
6. Você verá: `✓ Success. No rows returned`

---

## 🧪 Como Testar

Após criar, ainda no SQL Editor:

```sql
SELECT * FROM public.get_all_tables();
```

Resultado esperado:
```
 table_name
────────────
 usuarios
 simulados
 questoes
 alternativas
 (... mais tabelas)
```

---

## ✨ Depois Que Funcionar

Recarregue a página:
```
http://localhost:5173/database-inspetor
```

Deverá listar todas as tabelas **SEM ERROS** ✅

---

**Status:** ⏳ PRONTA PARA EXECUTAR  
**Próximo:** Execute e recarregue a página  
