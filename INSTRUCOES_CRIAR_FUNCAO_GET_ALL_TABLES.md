# 🔧 Instruções: Criar Função get_all_tables no Supabase

## ⚠️ Erro Encontrado

Ao acessar `http://localhost:5173/database-inspetor`, você recebe:

```
Erro ao buscar tabelas: Could not find the function public.get_all_tables 
without parameters in the schema cache
```

---

## ✅ Solução Rápida (3 passos)

### Passo 1: Abrir SQL Editor do Supabase

Se você está usando **Supabase Cloud**:
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** (lado esquerdo)
4. Clique em **New Query**

Se você está usando **Supabase Local**:
1. Abra: http://localhost:54323 (ou a porta configurada)
2. Clique em **SQL Editor**
3. Clique em **New Query**

---

### Passo 2: Colar o SQL

Cole **exatamente** este código no editor:

```sql
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

GRANT EXECUTE ON FUNCTION public.get_all_tables() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_tables() TO anon;

COMMENT ON FUNCTION public.get_all_tables() IS
  'Returns all public tables in the database.
   Used by the DatabaseInspetor page to list available tables.
   Returns a single column: table_name';
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
SELECT * FROM public.get_all_tables();
```

2. Clique **RUN**

Você deve ver uma tabela com os nomes das tabelas, tipo:

| table_name |
|---|
| alternativas |
| comentarios |
| desempenho |
| questoes |
| respostas |
| simulados |
| usuarios |
| ... |

---

## 🌐 Recarregar a Aplicação

Depois de executar o SQL, volte para a aplicação e **recarregue a página**:

1. Abra: http://localhost:5173/database-inspetor
2. Pressione `F5` ou `Cmd+R`
3. Aguarde carregar

Você deve ver agora:
- ✅ **Sem mensagens de erro**
- ✅ Uma lista de todas as tabelas públicas
- ✅ Possibilidade de selecionar tabelas para inspecionar

---

## 🐛 Se Ainda Não Funcionar

### Verificar se a função foi criada

Cole no SQL Editor:

```sql
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name = 'get_all_tables';
```

**Esperado:** Uma linha com `get_all_tables` e `FUNCTION`

Se não aparecer nada, execute novamente o SQL de criação da função.

---

### Verificar permissões

```sql
SELECT * FROM information_schema.role_routine_grants
WHERE routine_schema = 'public'
AND routine_name = 'get_all_tables';
```

Você deve ver linhas com `authenticated` e `anon` com `EXECUTE = YES`

---

### Dropar e recriar

Se houver algum problema, execute primeiro:

```sql
DROP FUNCTION IF EXISTS public.get_all_tables();
```

Depois execute novamente **todo** o código de criação acima.

---

## 📁 Arquivos Relacionados

| Arquivo | Descrição |
|---------|----------|
| `app/src/pages/DatabaseInspetor.tsx` | Página que chama a função RPC |
| `supabase/migrations/20251103_add_get_all_tables_function.sql` | Migration oficial (automática) |
| `SQL_CRIAR_FUNCAO_GET_ALL_TABLES.sql` | SQL ready-to-use (este arquivo) |
| `INSTRUCOES_CRIAR_FUNCAO_GET_ALL_TABLES.md` | **Estas instruções** |

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
4. Verifique em `/database-inspetor` se já traz dados

---

**Status:** ✅ Função criada  
**Data:** 04/11/2025  
**Prioridade:** Alta (necessário para funcionar a página Database Inspetor)
