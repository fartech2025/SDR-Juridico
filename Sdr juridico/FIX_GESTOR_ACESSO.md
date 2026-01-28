# 🔓 FIX: Gestor sem Acesso - Diagnóstico e Solução

**Data**: 28 de janeiro de 2026  
**Status**: Crítico

---

## 🚨 Problema Identificado

O gestor está sem acesso a nenhuma funcionalidade. A hierarquia de acesso esperada é:

```
fartech_admin (acesso total)
    ↓
org_admin/gestor (gerenciamento da organização)
    ↓
user/advogado (usuário regular)
```

Mas o gestor está retornando como `org_admin` mas sem permissões correspondentes em algumas partes do código.

---

## 🔍 Causa Raiz

### 1. **Inconsistência em `resolveUserRole()`**

**Arquivo**: `src/services/permissionsService.ts` (linhas 57-78)

O mapeamento está correto:
```typescript
const roleMap: Record<OrgMemberRole, UserRole> = {
  admin: 'org_admin',        ✅ Correto
  gestor: 'org_admin',       ✅ Correto
  advogado: 'user',          ✅ Correto
  secretaria: 'user',        ✅ Correto
  leitura: 'user',           ✅ Correto
}
```

### 2. **Problema em `isCurrentUserAdminish()`**

**Arquivo**: `src/services/orgScope.ts` (linhas 73-80)

```typescript
export async function isCurrentUserAdminish(): Promise<boolean> {
  const { role, isFartechAdmin } = await resolveOrgScope()
  if (isFartechAdmin) return true
  return role ? ['admin', 'gestor', 'secretaria', 'org_admin'].includes(role) : false
                 ^^^^^^ BUG! role é 'org_admin' depois do mapeamento
                        não será 'gestor' aqui
}
```

**A falha**: `resolveOrgScope()` retorna `role` já mapeado como `'org_admin'`, não como `'gestor'`.  
Então o check fica ineficaz.

---

## ✅ Soluções

### Solução 1: Corrigir `isCurrentUserAdminish()` em orgScope.ts

```typescript
// ANTES (BUGADO):
export async function isCurrentUserAdminish(): Promise<boolean> {
  const { role, isFartechAdmin } = await resolveOrgScope()
  if (isFartechAdmin) return true
  return role ? ['admin', 'gestor', 'secretaria', 'org_admin'].includes(role) : false
              // ✗ role nunca é 'admin' ou 'gestor', sempre é 'org_admin'
}

// DEPOIS (CORRETO):
export async function isCurrentUserAdminish(): Promise<boolean> {
  const { role, isFartechAdmin } = await resolveOrgScope()
  if (isFartechAdmin) return true
  return role === 'org_admin' // ✅ Simples e correto
}
```

### Solução 2: Garantir que `resolveOrgScope()` retorna o role correto

Verificar que em `permissionsService.ts`, a função `resolveUserRole()` está sendo usada corretamente.

**Status**: ✅ Já está correto

---

## 📋 Checklist de Verificação

- [ ] Confirmar que `org_members.role` contém `'gestor'`, não `'org_admin'`
- [ ] Verificar que `resolveUserRole()` mapeia `'gestor' → 'org_admin'`
- [ ] Confirmar que `getPermissionsByRole('org_admin')` retorna permissões esperadas
- [ ] Testar acesso do gestor a tarefas, leads, casos, etc

---

## 🧪 Como Testar

### 1. Login como Gestor
```
role no banco: 'gestor'
role retornado: 'org_admin' (após mapeamento)
permissões: ORG_ADMIN_PERMISSIONS (linhas 100-130 em permissions.ts)
```

### 2. Verificar Permissões
```typescript
const user = await permissionsService.getCurrentUser()
console.log('Role:', user.role)  // Deve ser 'org_admin'
console.log('Permissões:', await permissionsService.getUserPermissions())
```

### 3. Testar Operações
- ✅ Criar usuário
- ✅ Gerenciar leads
- ✅ Gerenciar casos
- ✅ Gerenciar documentos
- ✅ Gerenciar agenda
- ✅ Gerenciar integrações
- ✅ Gerenciar settings
- ❌ NÃO acesso a billing (read-only)

---

## 📊 Matriz de Acesso Esperada (CORRIGIDA)

| Funcionalidade | fartech_admin | org_admin (gestor) | user (advogado) |
|---|---|---|---|
| Usuários | ✅ Manage | ✅ Manage | ❌ Read |
| Leads | ✅ Manage | ✅ Manage | ✅ CRUD |
| Casos | ✅ Manage | ✅ Manage | ✅ CRUD |
| Clientes | ✅ Manage | ✅ Manage | ✅ CRUD |
| Documentos | ✅ Manage | ✅ Manage | ✅ CRUD |
| Agenda | ✅ Manage | ✅ Manage | ✅ CRUD |
| Integrações | ✅ Manage | ✅ Manage | ❌ Read |
| Settings | ✅ Manage | ✅ Manage | ❌ No |
| Billing | ✅ Manage | ❌ Read | ❌ No |
| Tarefas (approve/reject) | ✅ Manage | ✅ Approve | ❌ No |

---

## 🔧 Próximos Passos

1. Aplicar correção em `orgScope.ts`
2. Validar permissões em `tarefasService.ts` (approve/reject)
3. Testar com usuário gestor real
4. Documentar hierarquia final

