# 🗄️ Limpeza de Tabelas Não Utilizadas no Supabase

## 📋 Problema Identificado

Foram detectadas tabelas no banco de dados Supabase que não fazem parte do projeto ENEM:
- ❌ `messages` - Tabela não utilizada
- ❌ `objects` - Tabela não utilizada

## ✅ Tabelas Oficiais do Projeto

O projeto ENEM utiliza apenas estas tabelas:

### Tabelas Principais
1. **`questoes`** - Questões do ENEM (texto, alternativas, gabarito)
2. **`questoes_imagens`** - Imagens associadas às questões
3. **`usuarios`** - Usuários do sistema (sincronizado com auth.users)

### Tabelas de Simulados
4. **`simulados`** - Simulados criados pelos usuários
5. **`simulado_questoes`** - Questões incluídas em cada simulado
6. **`resultados_simulados`** - Resultados dos simulados realizados

### Tabelas de Análise
7. **`resultados_por_tema`** - Performance por tema/matéria
8. **`resultados_por_dificuldade`** - Performance por nível de dificuldade
9. **`resultados_por_hora`** - Performance por horário do dia

---

## 🔍 Passo 1: Verificar Tabelas Existentes

### Opção A: Via SQL Editor do Supabase
1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Navegue até **SQL Editor**
3. Execute o script de verificação:

```bash
supabase/verify_database_objects.sql
```

Este script irá mostrar:
- ✅ Todas as tabelas com indicação de uso
- 📊 Tamanho de cada tabela
- 🔗 Relacionamentos (Foreign Keys)
- 📈 Contagem de registros
- 🎯 Views, Functions e Triggers

### Opção B: Via Supabase CLI
```bash
# Listar todas as tabelas
npx supabase db dump --data-only --schema public

# Ver estrutura específica
npx supabase db dump --schema public --table messages
npx supabase db dump --schema public --table objects
```

---

## 🧹 Passo 2: Limpar Tabelas Não Utilizadas

### ⚠️ ATENÇÃO - Backup Antes de Executar!

Faça backup do banco antes de remover tabelas:

```bash
# Backup completo
npx supabase db dump -f backup_antes_cleanup.sql

# Backup apenas de estrutura
npx supabase db dump --schema-only -f backup_schema.sql
```

### Executar Limpeza

**Via SQL Editor (Recomendado):**
1. Abra o SQL Editor no Supabase Dashboard
2. Copie e cole o conteúdo de: `supabase/migrations/20251104_cleanup_unused_tables.sql`
3. Revise o script antes de executar
4. Clique em **Run**

**Via CLI:**
```bash
# Aplicar a migration de cleanup
npx supabase db push

# Ou executar diretamente
npx supabase db execute -f supabase/migrations/20251104_cleanup_unused_tables.sql
```

---

## 📝 O que o Script de Cleanup Faz

```sql
-- Remove table messages (se existir)
DROP TABLE IF EXISTS public.messages CASCADE;

-- Remove table objects (se existir)
DROP TABLE IF EXISTS public.objects CASCADE;
```

**Explicação:**
- `IF EXISTS` - Não dá erro se a tabela já foi removida
- `CASCADE` - Remove automaticamente dependências (views, constraints, triggers)

---

## ✅ Passo 3: Verificar Após Limpeza

Execute novamente o script de verificação para confirmar:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**Resultado esperado (9 tabelas):**
```
✅ questoes
✅ questoes_imagens
✅ resultados_por_dificuldade
✅ resultados_por_hora
✅ resultados_por_tema
✅ resultados_simulados
✅ simulado_questoes
✅ simulados
✅ usuarios
```

---

## 🔧 Troubleshooting

### Erro: "cannot drop table because other objects depend on it"

**Causa:** Existem views, triggers ou foreign keys dependendo da tabela.

**Solução:** Use `CASCADE` para remover dependências automaticamente:
```sql
DROP TABLE public.messages CASCADE;
```

### Erro: "permission denied"

**Causa:** Usuário não tem permissões de DROP TABLE.

**Solução:** 
1. Use a `service_role key` no SQL Editor
2. Ou execute via CLI com credenciais de admin

### Tabela não aparece na lista

**Causa:** Pode estar em outro schema (não `public`).

**Verificar todos schemas:**
```sql
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_type = 'BASE TABLE'
ORDER BY table_schema, table_name;
```

---

## 📊 Monitoramento Contínuo

### Script de Verificação Periódica

Crie uma rotina para verificar tabelas não utilizadas:

```sql
-- Salvar como: verify_unused_tables.sql
WITH project_tables AS (
  SELECT unnest(ARRAY[
    'questoes', 'questoes_imagens', 'usuarios',
    'simulados', 'simulado_questoes', 'resultados_simulados',
    'resultados_por_tema', 'resultados_por_dificuldade', 'resultados_por_hora'
  ]) as table_name
)
SELECT 
  t.table_name,
  CASE WHEN pt.table_name IS NULL THEN '❌ NÃO USADA' ELSE '✅ USADA' END as status,
  pg_size_pretty(pg_total_relation_size('public.'||t.table_name)) as size
FROM information_schema.tables t
LEFT JOIN project_tables pt ON t.table_name = pt.table_name
WHERE t.table_schema = 'public' 
  AND t.table_type = 'BASE TABLE'
ORDER BY status DESC, t.table_name;
```

---

## 🎯 Próximos Passos

Após limpar as tabelas não utilizadas:

1. **Atualizar Types TypeScript**
   ```bash
   cd app
   npx supabase gen types typescript --local > src/lib/database.types.ts
   ```

2. **Testar Aplicação**
   ```bash
   npm run dev
   # Verificar se não há erros no console
   ```

3. **Commit das Mudanças**
   ```bash
   git add supabase/migrations/20251104_cleanup_unused_tables.sql
   git commit -m "chore: remove unused tables (messages, objects) from database"
   git push origin main
   ```

---

## 📚 Referências

- [Supabase Database Management](https://supabase.com/docs/guides/database)
- [PostgreSQL DROP TABLE](https://www.postgresql.org/docs/current/sql-droptable.html)
- [Supabase CLI Commands](https://supabase.com/docs/reference/cli/introduction)

---

## 🚨 Importante

- ⚠️ Sempre faça backup antes de remover tabelas
- 🔒 Use `CASCADE` com cuidado em produção
- ✅ Teste em ambiente local antes de aplicar em produção
- 📝 Documente todas as alterações no banco de dados
