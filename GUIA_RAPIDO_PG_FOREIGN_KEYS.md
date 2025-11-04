# ✅ Passo-a-Passo: Corrigir Erro pg_foreign_keys

**Versão Rápida:** 3 minutos

---

## 📋 O Erro

```
Função pg_foreign_keys não encontrada
```

Esta mensagem aparece quando tenta acessar: `/database-relations`

---

## ✅ SOLUÇÃO RÁPIDA (Copiar & Colar)

### Passo 1: Abrir Supabase Dashboard

1. Vá para: https://app.supabase.io
2. Entre no seu projeto
3. Clique em **SQL Editor** (lado esquerdo)
4. Clique em **New Query**

### Passo 2: Copiar Este SQL

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

### Passo 3: Executar

1. Cole o SQL na query
2. Clique no botão **RUN** (azul, canto superior direito)
3. Aguarde "✓ Success"

---

## 🧪 Testar se Funcionou

### Local

```bash
cd /Users/fernandodias/Projeto-ENEM/app
npm run dev
```

Acesse: http://localhost:5173/database-relations

Você deve ver uma tabela com as relações entre tabelas.

---

## 🐛 Se Não Funcionar

### Verificar se Função Existe

No SQL Editor, execute:

```sql
-- Listar todas as functions
SELECT function_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'pg_foreign_keys';
```

**Resultado esperado:** Uma linha com `pg_foreign_keys`

### Verificar Permissões

```sql
-- Verificar grants
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_routine_grants
WHERE routine_schema = 'public'
AND routine_name = 'pg_foreign_keys';
```

**Resultado esperado:** Linhas com `anon` e `authenticated` tendo `EXECUTE`

### Recriar do Zero

```sql
-- Deletar função existente (se houver erro)
DROP FUNCTION IF EXISTS public.pg_foreign_keys() CASCADE;

-- Depois colar o SQL novamente acima
```

---

## 🎯 Dicas

| Dica | Descrição |
|------|-----------|
| 🔍 Não vejo a query? | Clique em "New Query" para criar uma |
| ⏱️ Está demorando? | Aguarde, queries grandes levam tempo |
| 📋 Preciso copiar melhor? | Clique no ícone de copy (lado direito) |
| 🔄 Preciso reexecutar? | Clique RUN novamente |

---

## 📚 Próximas Ações

Após executar com sucesso:

1. ✅ Ir para: http://localhost:5173/database-relations
2. ✅ Verificar tabela com relações
3. ✅ Pronto! Erro resolvido

---

## 💬 Suporte

Se tiver problemas, consulte:
- `SOLUCAO_PG_FOREIGN_KEYS.md` - Guia completo
- `RELATORIO_CORRECAO_PG_FOREIGN_KEYS.md` - Detalhes técnicos
- `fix_pg_foreign_keys.sh` - Script automático

---

**Tempo esperado:** ⏱️ 3-5 minutos  
**Dificuldade:** 🟢 Fácil  
**Status:** ✅ Pronto para começar
