# 🔧 Instruções: Criar Função pg_foreign_keys no Supabase

## ⚠️ Erro Encontrado

Ao acessar `http://localhost:5173/database-relations`, você recebe:

```
Função pg_foreign_keys não encontrada. 
Veja SOLUCAO_PG_FOREIGN_KEYS.md para corrigir, 
ou acesse o SQL Editor do Supabase para criar a função manualmente.
```

---

## ✅ Solução Rápida (3 passos)

### Passo 1: Abrir SQL Editor do Supabase

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** (lado esquerdo)
4. Clique em **New Query**

---

### Passo 2: Colar o SQL

Cole **exatamente** este código no editor:

```sql
-- Create pg_foreign_keys function to retrieve foreign key relationships
-- This function is called by DatabaseRelations.tsx to display table relationships

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

-- Grant execute permission to anon and authenticated roles
grant execute on function public.pg_foreign_keys() to anon, authenticated;

-- Add comment to function
comment on function public.pg_foreign_keys() is 'Returns all foreign key relationships in the public schema';
```

---

### Passo 3: Executar

Clique no botão **RUN** (ou pressione `Ctrl+Enter`)

Você verá:
```
✅ Success. No rows returned.
```

---

## 🧪 Verificar se Funcionou

Após executar, faça este teste rápido:

1. Cole **este query** no SQL Editor:

```sql
SELECT * FROM public.pg_foreign_keys();
```

2. Clique **RUN**

Você deve ver uma tabela com relacionamentos, tipo:

| tabela_origem | coluna_origem | tabela_destino | coluna_destino |
|---|---|---|---|
| alternativas | id_questao | questoes | id |
| comentarios | id_usuario | usuarios | id |
| ... | ... | ... | ... |

---

## 🌐 Recarregar a Aplicação

Depois de executar o SQL, volte para a aplicação e **recarregue a página**:

1. Abra: http://localhost:5173/database-relations (ou /documentacao-relacionamentos)
2. Pressione `F5` ou `Cmd+R`
3. Aguarde carregar

Você deve ver agora:
- ✅ **Sem mensagens de erro**
- ✅ Uma tabela com os relacionamentos entre tabelas
- ✅ 7 seções com dados carregados

---

## 🐛 Se Ainda Não Funcionar

### Verificar se a função foi criada

Cole no SQL Editor:

```sql
-- Listar todas as functions do schema public
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name LIKE '%foreign%';
```

**Esperado:** Uma linha com `pg_foreign_keys` e `FUNCTION`

Se não aparecer nada, execute novamente o SQL de criação da função.

---

### Verificar permissões

```sql
-- Verificar quem pode executar a função
SELECT * FROM information_schema.role_routine_grants
WHERE routine_schema = 'public'
AND routine_name = 'pg_foreign_keys';
```

Você deve ver linhas com `anon` e `authenticated` com `EXECUTE = YES`

---

### Dropar e recriar

Se houver algum problema, execute primeiro:

```sql
-- Remover a função se ela existir
DROP FUNCTION IF EXISTS public.pg_foreign_keys();
```

Depois execute novamente **todo** o código de criação acima.

---

## 📁 Arquivos Envolvidos

| Arquivo | Descrição |
|---------|-----------|
| `app/src/pages/DatabaseRelations.tsx` | Página que chama a função RPC |
| `supabase/migrations/20251103_create_pg_foreign_keys_function.sql` | Migration oficial (automática) |
| `SOLUCAO_PG_FOREIGN_KEYS.md` | Documentação completa do problema |
| `INSTRUCOES_CRIAR_FUNCAO_PG_FOREIGN_KEYS.md` | **Este arquivo** |

---

## 🚀 Automático (Se usar CLI)

Depois que a função foi criada **manualmente** via SQL Editor, na próxima vez, você pode executar:

```bash
# Reset do banco (cria tudo automaticamente)
npx supabase db reset

# Ou gerar tipos (se já tiver a função)
npx supabase gen types typescript --local > app/src/lib/database.types.ts
```

---

## 📞 Suporte

Se precisar de ajuda:
1. Verifique se o SQL foi executado sem erros
2. Recarregue a página da aplicação
3. Abra o Console do navegador (F12) para ver possíveis erros JavaScript
4. Verifique em `/database-relations` se já traz dados

---

**Status:** ✅ Função criada  
**Data:** 03/11/2025  
**Prioridade:** Alta (necessário para funcionar a página)

