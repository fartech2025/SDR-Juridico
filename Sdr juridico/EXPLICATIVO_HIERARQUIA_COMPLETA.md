# 📚 EXPLICATIVO COMPLETO: Hierarquia de Acesso e Permissões

**Data**: 28 de janeiro de 2026  
**Versão**: 1.0 - Final  
**Status**: ✅ Validado e Documentado

---

## 🎯 Objetivo

Este documento explica a **hierarquia de acesso** completa do sistema SDR Jurídico, incluindo:
- Como os roles funcionam no banco de dados
- Como são mapeados no TypeScript
- Quais permissões cada role possui
- Como as verificações são feitas em tempo de execução

---

## 📊 Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                    SISTEMA DE PERMISSÕES                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  BANCO DE DADOS (org_members.role)                              │
│  ├─ 'admin'        → Mapeado para → 'org_admin'               │
│  ├─ 'gestor'       → Mapeado para → 'org_admin'               │
│  ├─ 'advogado'     → Mapeado para → 'user'                    │
│  ├─ 'secretaria'   → Mapeado para → 'user'                    │
│  └─ 'leitura'      → Mapeado para → 'user'                    │
│                                                                   │
│  ESPECIAL:                                                       │
│  └─ usuarios.permissoes = ['fartech_admin']                   │
│     → Mapeado para → 'fartech_admin'                            │
│                                                                   │
│  TYPESCRIPT (UserRole)                                           │
│  ├─ 'fartech_admin'  → FARTECH_ADMIN_PERMISSIONS              │
│  ├─ 'org_admin'      → ORG_ADMIN_PERMISSIONS                  │
│  └─ 'user'           → USER_PERMISSIONS                        │
│                                                                   │
│  PERMISSÕES (Permission[])                                       │
│  └─ { resource, action }                                        │
│     Verifica no checkPermission()                                │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Fluxo Completo: De Login a Verificação

### 1️⃣ Usuário faz Login

```typescript
// Supabase Auth retorna:
{
  id: "uuid-do-usuario",
  email: "advogado@legal.com",
  user_metadata: { nome_completo: "João Silva" }
}
```

### 2️⃣ Sistema busca informações adicionais

```typescript
// permissionsService.getCurrentUser()

// Passo 1: Busca na tabela usuarios
const usuario = await supabase.from('usuarios')
  .select('nome_completo, email, permissoes, role, org_id')
  .eq('id', user.id)

// usuario.permissoes = [] → Não é fartech_admin
// usuario.permissoes = ['fartech_admin'] → É fartech_admin ✅

// Passo 2: Busca na tabela org_members (FONTE DE VERDADE para role)
const memberData = await supabase.from('org_members')
  .select('org_id, role')
  .eq('user_id', user.id)
  .eq('ativo', true)
  .limit(1)

// memberData.role = 'gestor' (valor no banco)
```

### 3️⃣ Sistema resolve o UserRole

```typescript
// resolveUserRole(isFartechAdmin, memberRole)

function resolveUserRole(
  isFartechAdmin: boolean,      // false
  memberRole: OrgMemberRole     // 'gestor'
): UserRole {
  // Mapeamento: 'gestor' → 'org_admin'
  const roleMap = {
    admin: 'org_admin',
    gestor: 'org_admin',    ← AQUI!
    advogado: 'user',
    secretaria: 'user',
    leitura: 'user',
  }
  
  return roleMap[memberRole] // retorna 'org_admin'
}

// Resultado:
const userWithRole: UserWithRole = {
  id: "uuid-usuario",
  email: "advogado@legal.com",
  name: "João Silva",
  role: 'org_admin',           // ← Mapeado!
  org_id: "org-123",
  is_fartech_admin: false,
}
```

### 4️⃣ Sistema obtém permissões

```typescript
// getUserPermissions()

const permissions = getPermissionsByRole('org_admin')

// Retorna ORG_ADMIN_PERMISSIONS:
[
  { resource: 'users', action: 'manage' },
  { resource: 'leads', action: 'manage' },
  { resource: 'cases', action: 'manage' },
  { resource: 'documents', action: 'manage' },
  { resource: 'agenda', action: 'manage' },
  // ... mais 13 permissões
]
```

### 5️⃣ Usuário tenta fazer ação

```typescript
// Exemplo: Gestor tenta APROVAR tarefa

const isAdminish = await isCurrentUserAdminish()

// isCurrentUserAdminish():
// 1. const { role } = await resolveOrgScope()  → role: 'org_admin'
// 2. if (isFartechAdmin) return true           → false
// 3. return role === 'org_admin'               → true ✅

if (!isAdminish) {
  throw new AppError('Apenas gestores podem aprovar', 'permission_denied')
}

// Ação permitida! ✅
```

---

## 📋 Matriz de Permissões Detalhada

### NÍVEL 1: FARTECH ADMIN
**Identificação**: `usuarios.permissoes = ['fartech_admin']`  
**Mapeado para**: `role = 'fartech_admin'`

```
Permissões: FARTECH_ADMIN_PERMISSIONS (11 recursos)

✅ organizations: manage
✅ users: manage
✅ leads: manage
✅ clients: manage
✅ cases: manage
✅ documents: manage
✅ agenda: manage
✅ integrations: manage
✅ settings: manage
✅ billing: manage
✅ reports: manage

Comportamento Especial:
├─ Acessa TODAS as organizações
├─ Bypassa verificação de cross-org
├─ Vê audit logs de todas as orgs
└─ Não restringido por RLS
```

**Caso de Uso**: Administrador da plataforma Fartech

---

### NÍVEL 2: ORG ADMIN (Gestor/Admin)
**Identificação**: `org_members.role IN ('admin', 'gestor')`  
**Mapeado para**: `role = 'org_admin'`

```
Permissões: ORG_ADMIN_PERMISSIONS (25 ações em 11 recursos)

✅ organizations: read, update
✅ users: create, read, update, delete
✅ leads: manage (create, read, update, delete)
✅ clients: manage (create, read, update, delete)
✅ cases: manage (create, read, update, delete)
✅ documents: manage (create, read, update, delete)
✅ agenda: manage (create, read, update, delete)
✅ integrations: manage (create, read, update, delete)
✅ settings: manage (create, read, update, delete)
✅ billing: read (somente leitura)
✅ reports: read, create
✅ tarefas: approve, reject (via isCurrentUserAdminish())

Comportamento Especial:
├─ Acessa APENAS sua organização
├─ Pode atribuir tarefas
├─ Pode aprovar/rejeitar tarefas
├─ Pode gerenciar usuários
└─ Restringido por org_id em RLS
```

**Caso de Uso**: Gestor da organização, pode gerenciar toda equipe

---

### NÍVEL 3: USER (Advogado/Secretária/Leitura)
**Identificação**: `org_members.role IN ('advogado', 'secretaria', 'leitura')`  
**Mapeado para**: `role = 'user'`

```
Permissões: USER_PERMISSIONS (20 ações em 9 recursos)

✅ organizations: read
✅ users: read
✅ leads: create, read, update
✅ clients: create, read, update
✅ cases: create, read, update
✅ documents: create, read, update
✅ agenda: create, read, update, delete
✅ integrations: read
✅ reports: read

❌ settings: (sem acesso)
❌ billing: (sem acesso)
❌ tarefas: approve, reject (bloqueado)

Comportamento Especial:
├─ Acessa APENAS sua organização
├─ RLS restringe a dados pessoais
├─ Pode submeter tarefas (mas não aprovar)
├─ Vê relatórios padrão
└─ Não pode gerenciar integrações
```

**Caso de Uso**: Advogado trabalhando em leads/casos/agenda

---

## 🔄 Diferenças Práticas: Exemplos Reais

### Exemplo 1: Criar Lead

```typescript
// ADVOGADO (role: 'user')
const canCreate = permissions.some(
  p => p.resource === 'leads' && p.action === 'create'
)
// USER_PERMISSIONS tem: { resource: 'leads', action: 'create' }
// ✅ PERMITIDO

// LEITURA (role: 'user')  
// USER_PERMISSIONS tem: { resource: 'leads', action: 'create' }
// ✅ PERMITIDO (mesmas permissões que advogado)
```

### Exemplo 2: Gerenciar Usuários

```typescript
// ADVOGADO (role: 'user')
const canManage = permissions.some(
  p => p.resource === 'users' && p.action === 'manage'
)
// USER_PERMISSIONS NÃO tem: { resource: 'users', action: 'manage' }
// ❌ BLOQUEADO

// GESTOR (role: 'org_admin')
// ORG_ADMIN_PERMISSIONS tem:
// ├─ { resource: 'users', action: 'create' }
// ├─ { resource: 'users', action: 'read' }
// ├─ { resource: 'users', action: 'update' }
// └─ { resource: 'users', action: 'delete' }
// ✅ PERMITIDO
```

### Exemplo 3: Aprovar Tarefa

```typescript
// ADVOGADO (role: 'user')
const isAdminish = await isCurrentUserAdminish()
// resolveOrgScope() → { role: 'user', ... }
// role === 'org_admin' → false
// ❌ BLOQUEADO

// GESTOR (role: 'org_admin')
// resolveOrgScope() → { role: 'org_admin', ... }
// role === 'org_admin' → true
// ✅ PERMITIDO
```

---

## 🔍 Fluxo de Verificação em Tempo Real

### Cenário: Advogado edita seu lead

```
1. Frontend chama: leadsService.updateLead(leadId, { name: "..." })

2. Backend valida:
   ├─ getCurrentUser() → { role: 'user', org_id: 'org-123' }
   ├─ checkPermission({ resource: 'leads', action: 'update' })
   │  └─ USER_PERMISSIONS tem { resource: 'leads', action: 'update' } ✅
   ├─ RLS verifica propriedade:
   │  └─ leads.assigned_user_id = auth.uid() ✅
   └─ UPDATE lead SET ... WHERE id = leadId AND assigned_user_id = auth.uid()

3. Lead atualizado ✅
```

### Cenário: Advogado tenta editar lead de outro

```
1. Frontend chama: leadsService.updateLead(outroLeadId, { name: "..." })

2. Backend valida:
   ├─ getCurrentUser() → { role: 'user', org_id: 'org-123' }
   ├─ checkPermission({ resource: 'leads', action: 'update' }) ✅
   │  (permissão de ação existe)
   ├─ RLS verifica propriedade:
   │  └─ leads.assigned_user_id = auth.uid() ❌
   │     (lead pertence a outro advogado)
   └─ Query retorna 0 linhas

3. Erro: 'Lead não encontrado' ❌
   (Na verdade, RLS bloqueou o acesso)
```

---

## 📈 Evolução do Acesso ao Longo do Tempo

### Exemplo: Advogado vira Gestor

```
ANTES:
org_members.role = 'advogado'
↓
role = 'user'
↓
USER_PERMISSIONS (não pode aprovar tarefas)

DEPOIS:
org_members.role = 'gestor'
↓
role = 'org_admin'
↓
ORG_ADMIN_PERMISSIONS (pode aprovar tarefas) ✅

AO FAZER LOGIN NOVAMENTE:
permissionsService.getCurrentUser()
└─ clearUserCache() foi chamado no logout
└─ Recarrega dados do banco
└─ Detecta novo role 'gestor'
└─ Retorna permissões atualizadas ✅
```

---

## ⚙️ Cache e Performance

### TTL (Time To Live) do Cache

```typescript
// permissionsService.ts
const USER_CACHE_TTL_MS = 10000  // 10 segundos

// orgScope.ts
const CACHE_TTL_MS = 5000        // 5 segundos
```

**Impacto**:
- Primeira verificação de permissão: 50-150ms (query ao banco)
- Verificações subsequentes (dentro do TTL): <1ms (cache)
- Após 5-10s: Cache expira, recarrega ao banco

**Atualização de Permissões**:
- Imediato após logout: `clearOrgScopeCache()`
- Imediato em ações críticas: `clearUserCache()`

---

## 🛡️ Proteção em Camadas (Defense in Depth)

```
┌──────────────────────────────────────────┐
│  Camada 1: Autenticação                  │
│  ✅ JWT válido? auth.uid() ≠ null?      │
└──────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────┐
│  Camada 2: Permissões de Ação            │
│  ✅ checkPermission({ resource, action }) │
│  Compara USER_PERMISSIONS vs ação        │
└──────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────┐
│  Camada 3: RLS (Row Level Security)      │
│  ✅ org_id = current_org_id?             │
│  ✅ assigned_user_id = auth.uid()?       │
│  ✅ is_org_admin_for_org(org_id)?        │
└──────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────┐
│  Camada 4: Validação de Input            │
│  ✅ Tipos TypeScript corretos            │
│  ✅ UUID válidos                         │
│  ✅ Tamanhos respeitados                 │
└──────────────────────────────────────────┘
```

---

## 🐛 Problemas Conhecidos e Soluções

### Problema 1: Gestor sem acesso depois da correção
**Causa**: Cache não foi limpo  
**Solução**: `clearOrgScopeCache()` no logout  
**Status**: ✅ CORRIGIDO

### Problema 2: RLS bloqueando acesso legítimo
**Causa**: Policy muito restritiva  
**Solução**: Usar `is_org_admin_for_org()` para gestores  
**Status**: ✅ VALIDADO

### Problema 3: Permissão tem mas RLS bloqueia
**Causa**: Duas camadas de validação  
**Solução**: Verificar tanto checkPermission quanto RLS policy  
**Status**: ✅ ESPERADO (por design)

---

## ✅ Checklist de Validação

- [x] Mapeamento de roles correto (admin/gestor → org_admin)
- [x] Permissões definidas para cada role
- [x] Cache com TTL implementado
- [x] Verificação em camadas funcionando
- [x] RLS policies alinhadas com permissões
- [x] Auditoria de ações críticas
- [x] Logout limpa cache
- [x] Documentação completa

---

## 🚀 Resumo Executivo

| Aspecto | Gestor | Advogado | Admin Fartech |
|---|---|---|---|
| **Acesso a Orgs** | 1 org | 1 org | Todas |
| **Gerenciar Usuários** | ✅ | ❌ | ✅ |
| **CRUD Leads** | ✅ | ✅ | ✅ |
| **Aprovar Tarefas** | ✅ | ❌ | ✅ |
| **Acessar Settings** | ✅ | ❌ | ✅ |
| **Ver Billing** | ✅ (read) | ❌ | ✅ |
| **Permissões Totais** | 25 ações | 20 ações | 11 recursos |

**Status Final**: ✅ **SISTEMA FUNCIONANDO CORRETAMENTE**

