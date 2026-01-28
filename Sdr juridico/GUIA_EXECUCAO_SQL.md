# 🚀 Guia de Execução: SQL de Hierarquia e Permissões

**Data**: 28 de janeiro de 2026  
**Arquivo SQL**: `20260128_hierarquia_permissoes_consolidado.sql`

---

## 📋 O que este SQL faz

Este é um **arquivo SQL único e consolidado** que corrige TODOS os problemas identificados na hierarquia de acesso:

### 1️⃣ Enums (Tipos de Dados)
- ✅ Adiciona `'devolvida'` ao enum `task_status`
- ✅ Adiciona `'aguardando_validacao'` ao enum `task_status`
- ✅ Valida valores existentes

### 2️⃣ Tabela org_members (Roles)
- ✅ Adiciona coluna `role` com valores: admin, gestor, advogado, secretaria, leitura
- ✅ Adiciona coluna `ativo` para controlar membros inativos
- ✅ Adiciona índices para performance
- ✅ Corrige dados existentes (NULL → advogado)

### 3️⃣ Tabela usuarios (Permissões)
- ✅ Adiciona coluna `permissoes` (array) para fartech_admin
- ✅ Adiciona coluna `org_id` para vínculo com organização
- ✅ Cria índice GIN para buscas rápidas
- ✅ Corrige dados existentes

### 4️⃣ Tabela tarefas (Fluxo de Aprovação)
- ✅ Adiciona campos para rastreamento de fluxo:
  - `submitted_at` - quando advogado submeteu
  - `confirmed_at` - quando gestor aprovou
  - `confirmed_by` - ID do gestor que aprovou
  - `rejected_reason` - motivo da devolução
- ✅ Adiciona `entidade` e `entidade_id` para vínculo
- ✅ Adiciona índices para performance
- ✅ Padroniza valores NULL

### 5️⃣ RLS (Row Level Security)
- ✅ Cria 12 políticas de acesso:
  - SELECT para advogado (suas tarefas)
  - SELECT para admin/gestor (todas da org)
  - SELECT para fartech admin (todas)
  - INSERT para cada nível
  - UPDATE para cada nível
  - DELETE para cada nível
- ✅ Cria funções helper:
  - `is_org_admin_for_org()` - verifica se é admin/gestor
  - `is_fartech_admin()` - verifica se é fartech admin

### 6️⃣ Verificação Final
- ✅ Registra migração no `migration_log`
- ✅ Valida integridade dos dados
- ✅ Gera relatório de execução

---

## ⚙️ Como Executar

### Opção 1: Via Supabase Studio

```bash
1. Abrir https://app.supabase.com
2. Selecionar projeto SDR Jurídico
3. Ir para "SQL Editor"
4. Clicar em "New Query"
5. Copiar conteúdo de:
   supabase/migrations/20260128_hierarquia_permissoes_consolidado.sql
6. Clicar "Run"
7. Aguardar conclusão
```

### Opção 2: Via CLI Local

```bash
cd "c:\Users\alanp\OneDrive\Documentos\SDR-Juridico"

# Opção 2a: Usar migration automática
supabase migration up

# Opção 2b: Executar manualmente
supabase db push

# Opção 2c: Para desenvolvimento local apenas
supabase start
# Depois:
psql -h localhost -p 54322 -U postgres < supabase/migrations/20260128_hierarquia_permissoes_consolidado.sql
```

### Opção 3: Via TypeScript/SDK

```typescript
import { supabase } from '@/lib/supabaseClient'

const migration = await import('./migrations/20260128_...sql?raw').default

const { error } = await supabase.rpc('exec_sql', { sql: migration })
if (error) console.error('Erro:', error)
else console.log('✅ Migração executada com sucesso!')
```

---

## ⏱️ Tempo de Execução

| Operação | Tempo Estimado |
|---|---|
| Verificação de enums | <1s |
| Alteração de tabelas | 2-5s |
| Criação de índices | 5-10s |
| Atualização de dados | 1-5s (depende do volume) |
| Criação de RLS policies | 2-3s |
| **TOTAL** | **10-25s** |

---

## 🔍 Como Verificar se Executou com Sucesso

### 1. Verificar Enum

```sql
SELECT enumlabel FROM pg_enum 
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
WHERE pg_type.typname = 'task_status'
ORDER BY enumsortorder;

-- Resultado esperado:
-- pendente
-- em_andamento
-- concluida
-- cancelada
-- devolvida
-- aguardando_validacao
```

### 2. Verificar Colunas

```sql
-- org_members
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'org_members'
AND column_name IN ('role', 'ativo')
ORDER BY ordinal_position;

-- usuarios
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'usuarios'
AND column_name IN ('permissoes', 'org_id')
ORDER BY ordinal_position;

-- tarefas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tarefas'
AND column_name IN ('submitted_at', 'confirmed_at', 'confirmed_by', 'rejected_reason', 'entidade', 'entidade_id')
ORDER BY ordinal_position;
```

### 3. Verificar Índices

```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('org_members', 'usuarios', 'tarefas')
AND indexname LIKE 'idx_%';

-- Resultado esperado: mínimo 10 índices
```

### 4. Verificar RLS

```sql
SELECT policyname, tablename, qual 
FROM pg_policies 
WHERE tablename = 'tarefas';

-- Resultado esperado: 12 policies (6 para cada operação)
```

### 5. Verificar Funções

```sql
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN ('is_org_admin_for_org', 'is_fartech_admin')
ORDER BY routine_name;

-- Resultado esperado: 2 funções
```

### 6. Verificar Migração Registrada

```sql
SELECT * FROM public.migration_log 
WHERE migration_name = 'CONSOLIDADO_HIERARQUIA_PERMISSOES_20260128';

-- Resultado esperado:
-- migration_name: CONSOLIDADO_HIERARQUIA_PERMISSOES_20260128
-- status: success
-- notes: Correções de roles, permissões, RLS e estrutura de tarefas
```

---

## ⚠️ Possíveis Erros e Soluções

### Erro: "Enum type task_status already has member..."
**Causa**: Já existe este valor no enum  
**Solução**: Normal, o SQL usa `DO $$` para verificar antes de adicionar  
**Ação**: Continuar, é esperado

### Erro: "Relation 'org_members' does not exist"
**Causa**: Tabela não existe no banco  
**Solução**: Criar tabela antes ou executar migrations base primeiro  
**Ação**: Executar `supabase db reset`

### Erro: "Permission denied for schema public"
**Causa**: Usuário não tem privilégios  
**Solução**: Usar usuário `postgres` ou admin do projeto  
**Ação**: Verificar credenciais no Supabase Studio

### Erro: "Column 'X' already exists"
**Causa**: Coluna já foi adicionada em execução anterior  
**Solução**: Normal, o SQL usa `ADD COLUMN IF NOT EXISTS`  
**Ação**: Continuar, é idempotente

---

## 🔄 Idempotência

Este SQL é **totalmente idempotente**, o que significa:

```
✅ Pode executar múltiplas vezes sem problema
✅ Verifica antes de adicionar (IF NOT EXISTS)
✅ Usa ON CONFLICT para atualizações
✅ Não deleta dados existentes
✅ Seguro para produção
```

**Recomendação**: Execute em desenvolvimento primeiro, depois em produção.

---

## 📊 O que Muda no Sistema

### Para Advogados
```
ANTES: Podiam criar/editar leads
DEPOIS: Mesma coisa + estrutura de tarefas validada
```

### Para Gestores
```
ANTES: Podiam gerenciar org (com bug de acesso)
DEPOIS: ✅ BUG CORRIGIDO + permissões completas + RLS protegendo
```

### Para Admin Fartech
```
ANTES: Acesso total
DEPOIS: Acesso total + RLS policies explícitas
```

---

## 🎯 Próximos Passos Após Execução

### 1. Verificar Frontend

```typescript
// Testar login como cada tipo de usuário
- Advogado: deve ter acesso a leads, casos, tarefas
- Gestor: deve ter acesso a tudo + buttons de aprovar/rejeitar
- Admin: deve ter acesso total

// Testar fluxo de tarefas
- Advogado submete tarefa
- Gestor aprova/rejeita
- Status muda corretamente
```

### 2. Verificar Logs

```bash
# Ver logs do Supabase
supabase logs --follow

# Procurar por erros de RLS
# Procurar por erros de permissão
# Procurar por warnings
```

### 3. Fazer Backup

```bash
# Backup antes de produção
supabase db pull

# Salvar em git
git add supabase/migrations/
git commit -m "Migration: Hierarquia e permissões corrigidas"
```

### 4. Comunicar Equipe

```
📢 Comunicado: Sistema de permissões atualizado
   - Gestores já podem aprovar/rejeitar tarefas
   - Estrutura de dados agora suporta fluxo completo
   - RLS policies protegendo acesso
```

---

## 📞 Suporte

Se encontrar problemas:

1. **Verificar logs**: `supabase logs --follow`
2. **Rodar script de validação**: Execute as queries de verificação
3. **Restaurar backup**: Se necessário, restaure versão anterior
4. **Contactar Supabase**: Support ticket no painel

---

## ✅ Checklist Final

- [ ] SQL executado com sucesso
- [ ] Enums verificados
- [ ] Colunas criadas
- [ ] Índices criados
- [ ] RLS policies criadas
- [ ] Dados atualizados
- [ ] Funções helper criadas
- [ ] Migração registrada
- [ ] Frontend testado
- [ ] Backup feito
- [ ] Equipe comunicada

---

**Status**: ✅ **PRONTO PARA PRODUÇÃO**

