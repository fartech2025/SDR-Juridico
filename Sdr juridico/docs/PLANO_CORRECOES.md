# Plano de Correções - SDR Jurídico

**Data:** 28 de janeiro de 2026
**Versão:** 1.0.0

---

## Resumo Executivo

Este documento consolida todas as correções necessárias identificadas na análise do banco de dados e código fonte do SDR Jurídico.

### Arquivos Gerados

| Arquivo | Descrição |
|---------|-----------|
| `supabase/migrations/20260128_critical_fixes.sql` | Migration SQL completa |
| `docs/CORRECOES_TYPESCRIPT.md` | Correções nos services TypeScript |
| `docs/PLANO_CORRECOES.md` | Este documento |

---

## Problemas Identificados

### 🔴 Críticos (5)

| # | Problema | Arquivo/Tabela | Impacto |
|---|----------|----------------|---------|
| 1 | Funções RLS helper faltantes | Banco de dados | Policies não funcionam |
| 2 | Tabelas sem RLS | `atendimento_estado`, `conversa_buffer` | Dados expostos |
| 3 | `conversa_buffer.org` é TEXT, não UUID | Schema do banco | Inconsistência |
| 4 | Race conditions em `resolveOrgScope` | `orgScope.ts` | Comportamento inconsistente |
| 5 | Mistura de permissões em dois modelos | `permissionsService.ts` | Confusão de roles |

### 🟠 Altos (12)

| # | Problema | Arquivo/Tabela |
|---|----------|----------------|
| 1 | Políticas redundantes em `tarefas` | RLS policies |
| 2 | Falta de índices compostos | Todas as tabelas |
| 3 | Campos em JSONB ao invés de colunas | `clientes`, `leads`, `documentos`, `agendamentos` |
| 4 | Falta de validação de input | `tarefasService.ts` |
| 5 | Verificação de permissão faltante | `approveTask`, `rejectTask` |
| 6 | Cache não funcional | `permissionsService.ts` |
| 7 | Tipos TypeScript inconsistentes | `TaskStatus` enum |
| 8 | Queries sem tratamento de erro adequado | Todos os services |
| 9 | Constraint de unicidade faltante | `org_members`, `advogado_carteira` |
| 10 | Falta de validação de entidade | `tarefas` |
| 11 | Logs excessivos em produção | `permissionsService.ts` |
| 12 | Policy de documentos via tarefa faltante | `documentos` |

---

## Ordem de Execução

### Fase 1: SQL (Executar Primeiro)

```bash
# 1. Backup do banco (IMPORTANTE!)
pg_dump -h <host> -U postgres -d postgres > backup_20260128.sql

# 2. Executar migration
psql -h <host> -U postgres -d postgres -f supabase/migrations/20260128_critical_fixes.sql

# 3. Verificar se funcionou
psql -h <host> -U postgres -d postgres -c "SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name LIKE 'is_%';"
```

**Ou via Supabase Dashboard:**
1. Ir em SQL Editor
2. Colar o conteúdo de `20260128_critical_fixes.sql`
3. Executar

### Fase 2: TypeScript (Após SQL)

1. **Backup dos arquivos atuais:**
```bash
cp src/services/orgScope.ts src/services/orgScope.ts.bak
cp src/services/permissionsService.ts src/services/permissionsService.ts.bak
cp src/services/tarefasService.ts src/services/tarefasService.ts.bak
```

2. **Aplicar correções** do arquivo `docs/CORRECOES_TYPESCRIPT.md`

3. **Verificar tipos:**
```bash
npm run typecheck
```

4. **Testar:**
```bash
npm run test
npm run dev
```

---

## Checklist de Verificação

### Banco de Dados

- [ ] Funções helper criadas (12 funções)
- [ ] RLS habilitado em `atendimento_estado`
- [ ] RLS habilitado em `conversa_buffer`
- [ ] Colunas `status` e `health` em `clientes`
- [ ] Coluna `heat` em `leads`
- [ ] Colunas `heat` e `sla_risk` em `casos`
- [ ] Colunas `status` e `tipo` em `documentos`
- [ ] Colunas `tipo` e `status` em `agendamentos`
- [ ] Dados migrados de JSONB para colunas
- [ ] Índices compostos criados (25+ índices)
- [ ] Constraints de unicidade
- [ ] Policies redundantes removidas
- [ ] Policy de documentos via tarefa

### Código TypeScript

- [ ] `orgScope.ts` com cache
- [ ] `permissionsService.ts` simplificado
- [ ] `tarefasService.ts` com validação
- [ ] `types/validation.ts` criado
- [ ] TypeCheck passa sem erros
- [ ] Testes passam

---

## Queries de Verificação

Execute após a migration para validar:

```sql
-- 1. Verificar funções criadas
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
  AND (routine_name LIKE 'is_%' OR routine_name LIKE 'can_%')
ORDER BY routine_name;

-- Esperado: 12 funções

-- 2. Verificar RLS habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('atendimento_estado', 'conversa_buffer')
ORDER BY tablename;

-- Esperado: ambas com rowsecurity = true

-- 3. Verificar novas colunas
SELECT column_name, table_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name IN ('status', 'health', 'heat', 'sla_risk', 'tipo')
  AND table_name IN ('clientes', 'leads', 'casos', 'documentos', 'agendamentos')
ORDER BY table_name, column_name;

-- 4. Verificar índices
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- 5. Contar policies por tabela
SELECT tablename, COUNT(*) as qtd_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 6. Testar função is_fartech_admin
SELECT public.is_fartech_admin();
-- Esperado: false (se não for fartech admin)

-- 7. Testar função is_org_member
SELECT public.is_org_member('00000000-0000-0000-0000-000000000000'::uuid);
-- Esperado: false (org inexistente)
```

---

## Rollback (Se Necessário)

### SQL

```sql
-- Remover funções
DROP FUNCTION IF EXISTS public.is_fartech_admin();
DROP FUNCTION IF EXISTS public.is_global_admin();
DROP FUNCTION IF EXISTS public.is_org_member(UUID);
DROP FUNCTION IF EXISTS public.is_member(UUID);
DROP FUNCTION IF EXISTS public.is_org_staff(UUID);
DROP FUNCTION IF EXISTS public.is_staff(UUID);
DROP FUNCTION IF EXISTS public.is_org_adminish(UUID);
DROP FUNCTION IF EXISTS public.is_adminish(UUID);
DROP FUNCTION IF EXISTS public.is_advogado(UUID);
DROP FUNCTION IF EXISTS public.can_read_cliente(UUID, UUID);
DROP FUNCTION IF EXISTS public.can_read_caso(UUID, UUID);
DROP FUNCTION IF EXISTS public.can_read_conversa(UUID, UUID);

-- Desabilitar RLS (CUIDADO - expõe dados!)
ALTER TABLE atendimento_estado DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversa_buffer DISABLE ROW LEVEL SECURITY;

-- Remover constraints (se necessário)
ALTER TABLE org_members DROP CONSTRAINT IF EXISTS org_members_unique_user_org;
ALTER TABLE advogado_carteira_clientes DROP CONSTRAINT IF EXISTS advogado_carteira_unique;
ALTER TABLE tarefas DROP CONSTRAINT IF EXISTS tarefas_entidade_check;
ALTER TABLE tarefas DROP CONSTRAINT IF EXISTS tarefas_entidade_type_check;

-- Restaurar backup
psql -h <host> -U postgres -d postgres < backup_20260128.sql
```

### TypeScript

```bash
# Restaurar backups
cp src/services/orgScope.ts.bak src/services/orgScope.ts
cp src/services/permissionsService.ts.bak src/services/permissionsService.ts
cp src/services/tarefasService.ts.bak src/services/tarefasService.ts
```

---

## Próximos Passos (Pós-Correção)

1. **Monitorar logs** por 24-48h para erros
2. **Testar fluxos críticos:**
   - Login/Logout
   - Criar/Editar tarefa
   - Aprovar/Rejeitar tarefa
   - Listar casos, clientes, leads
3. **Migrar `conversa_buffer.org`** de TEXT para UUID (migration separada)
4. **Implementar soft delete** em tabelas críticas
5. **Criar views materializadas** para dashboards

---

## Contato

Em caso de problemas durante a aplicação:
- Verificar logs do Supabase
- Verificar console do navegador
- Rollback imediato se houver perda de dados

---

*Gerado automaticamente em 28/01/2026*
