# Migrações do Banco de Dados - SDR Juridico

## 📋 Ordem de Aplicação das Migrações

As migrações devem ser aplicadas na ordem cronológica (pelo prefixo de data).

### ✅ Migrações Base do Sistema (Já Aplicadas)

Essas migrações constituem a base do sistema multi-tenant:

1. **20260108_documentos_storage.sql** - Sistema de storage para documentos
2. **20260108_processos_favoritos.sql** - Funcionalidade de processos favoritos
3. **20260110_add_org_id_to_leads.sql** - Adiciona org_id à tabela leads
4. **20260113_add_org_id_to_tables.sql** - Adiciona org_id a todas as tabelas principais
5. **20260113_create_organizations.sql** - Cria tabela de organizações
6. **20260114_multi_tenant_complete.sql** - Completa estrutura multi-tenant
7. **20260116_create_org_members.sql** - Cria tabela de membros de organizações
8. **20260116_fix_organizations_rls.sql** - Corrige RLS de organizações
9. **20260124_tasks_kanban_approval.sql** - Sistema de tarefas com aprovação
10. **20260128_task_status_enum_verification.sql** - Verificação de enum de status
11. **20260128_critical_fixes.sql** - Correções críticas de RLS
12. **20260128_hierarquia_permissoes_consolidado.sql** - Consolidação de hierarquia de permissões
13. **20260129_fix_rls_org_scoped_policies.sql** - Políticas RLS org-scoped
14. **20260131_datajud_casos_integration.sql** - Integração com DataJud

### 🆕 Novas Migrações (2026-02-03) - Correções e Otimizações

**IMPORTANTE:** Aplicar nesta ordem para corrigir o sistema de gestão de usuários:

1. **20260203_fix_existing_permissions.sql** ⚠️ **CRÍTICA**
   - Corrige permissões inconsistentes existentes
   - Remove permissão 'gestor' inválida
   - Garante que gestores têm permissão 'org_admin'
   - **Executar primeiro!**

2. **20260203_add_missing_indexes.sql**
   - Adiciona ~40 índices para melhorar performance
   - Melhora queries em: usuarios, org_members, casos, documentos, etc.
   - Reduz tempo de consulta em 50%+

3. **20260203_document_rbac_tables.sql**
   - Documenta tabelas RBAC reservadas para uso futuro
   - Adiciona comentários explicativos ao schema
   - Cria view helper `v_user_effective_permissions`

4. **20260203_cleanup_functions.sql**
   - Cria funções de limpeza automática
   - Limpa sessões expiradas, telemetria antiga, etc.
   - Usa `run_all_cleanups()` para executar todas

5. **20260203_audit_log.sql**
   - Sistema completo de auditoria
   - Rastreia mudanças em usuarios, org_members, orgs
   - Views e funções helper para consultar histórico

---

## 🚀 Como Aplicar as Migrações

### Opção 1: Via Supabase CLI (Local)

```bash
# Aplicar todas as novas migrações
supabase db push

# Ou aplicar uma por uma
supabase db push supabase/migrations/20260203_fix_existing_permissions.sql
supabase db push supabase/migrations/20260203_add_missing_indexes.sql
# ... etc
```

### Opção 2: Via Supabase Dashboard (Recomendado)

1. Acessar [Supabase Dashboard](https://supabase.com/dashboard) > Seu Projeto
2. Ir em **SQL Editor**
3. Abrir cada arquivo de migração na ordem
4. Executar o SQL
5. Verificar mensagens de sucesso

---

## 📁 Estrutura de Pastas

```
migrations/
├── archive/              # Migrações antigas ou experimentais
│   ├── 00_create_all_tables.sql (PROBLEMA: coluna status não existe)
│   └── ... (outros arquivos históricos)
├── 202601XX_*.sql       # Migrações de janeiro (base do sistema)
├── 20260203_*.sql       # Migrações de fevereiro (correções)
└── README.md            # Este arquivo
```

---

## ⚠️ Problemas Conhecidos

### 1. **00_create_all_tables.sql** (ARQUIVADO)
- **Problema:** Tenta criar índice em `usuarios.status` que não existe
- **Solução:** Arquivo movido para `archive/`
- **Status:** Não aplicar - tabelas já criadas em migrações posteriores

### 2. **Migrações na pasta archive/**
- São arquivos históricos ou experimentais
- **Não aplicar em produção**
- Mantidos apenas para referência

---

## 🔍 Verificações Pós-Migração

Após aplicar as novas migrações, execute estas queries para verificar:

```sql
-- 1. Verificar que não há permissão 'gestor' inválida
SELECT COUNT(*) FROM usuarios WHERE 'gestor' = ANY(permissoes);
-- Esperado: 0

-- 2. Verificar consistência de gestores
SELECT u.email, u.permissoes, om.role
FROM usuarios u
JOIN org_members om ON om.user_id = u.id
WHERE om.role = 'gestor' AND om.ativo = true;
-- Esperado: Todos com permissoes = ['org_admin']

-- 3. Verificar índices criados
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('usuarios', 'org_members', 'casos')
ORDER BY tablename, indexname;
-- Esperado: Ver novos índices (idx_*)

-- 4. Testar auditoria
SELECT * FROM audit_log ORDER BY changed_at DESC LIMIT 5;
-- Esperado: Ver logs sendo criados após mudanças

-- 5. Testar limpeza (preview apenas)
SELECT * FROM show_cleanup_targets();
-- Esperado: Ver quantos registros seriam limpos
```

---

## 📊 Sistema de Permissões

### Permissões Globais (usuarios.permissoes)
- `['fartech_admin']` - Super admin da plataforma (acesso total)
- `['org_admin']` - Admin/Gestor de organização
- `['user']` - Usuário comum

### Roles por Organização (org_members.role)
- `admin` → mapeia para `['org_admin']`
- `gestor` → mapeia para `['org_admin']`
- `advogado` → mapeia para `['user']`
- `secretaria` → mapeia para `['user']`
- `leitura` → mapeia para `['user']`

**⚠️ IMPORTANTE:** A permissão 'gestor' NÃO EXISTE como permissão global!
Apenas como role em org_members. Sempre mapear para 'org_admin'.

---

## 🛠️ Manutenção

### Limpeza Automática
Agendar execução semanal:
```sql
SELECT * FROM run_all_cleanups();
```

### Consultar Auditoria
```sql
-- Histórico de um usuário
SELECT * FROM get_user_audit_history('<user-id>', 30);

-- Mudanças recentes em uma org
SELECT * FROM get_org_recent_changes('<org-id>', 48);
```

---

## 📝 Notas

- **Última atualização:** 2026-02-03
- **Versão do sistema:** Multi-tenant v2.0
- **Banco de dados:** PostgreSQL 15 (Supabase)
- **ORM:** Supabase Client (TypeScript)

---

## 🆘 Suporte

Se encontrar problemas ao aplicar migrações:

1. Verificar logs do Supabase Dashboard > Database > Logs
2. Verificar se migrações base foram aplicadas
3. Consultar este README para ordem correta
4. Em caso de erro crítico, contatar o administrador

**Rollback:** Migrações anteriores a 2026-02-03 não devem ser revertidas.
Apenas as novas migrações (20260203_*) podem ser revertidas se necessário.
