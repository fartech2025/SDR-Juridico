# 📊 Hierarquia de Acesso Completa - Advogados, Gestores e Admin

**Data**: 28 de janeiro de 2026  
**Status**: ANÁLISE COMPLETA

---

## 🎯 Mapeamento de Roles

O sistema tem **5 roles no banco** que são mapeados para **3 roles no TypeScript**:

```
┌─ Banco (org_members.role)          TypeScript (UserRole)
│
├─ 'admin'                        →  'org_admin'
├─ 'gestor'                       →  'org_admin'
├─ 'advogado'                     →  'user'
├─ 'secretaria'                   →  'user'
└─ 'leitura'                      →  'user'

ESPECIAL:
└─ usuarios.permissoes = ['fartech_admin']  →  'fartech_admin'
```

---

## 🔐 Matriz de Permissões Completa

### FARTECH ADMIN
```typescript
// FARTECH_ADMIN_PERMISSIONS
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
```
**Acesso**: Acesso total ao sistema, todas as organizações

---

### ORG_ADMIN (Gestor / Admin)
```typescript
// ORG_ADMIN_PERMISSIONS
✅ organizations: read, update
✅ users: create, read, update, delete
✅ leads: manage (create, read, update, delete)
✅ clients: manage (create, read, update, delete)
✅ cases: manage (create, read, update, delete)
✅ documents: manage (create, read, update, delete)
✅ agenda: manage (create, read, update, delete)
✅ integrations: manage (create, read, update, delete)
✅ settings: manage (create, read, update, delete)
✅ billing: read
✅ reports: read, create
✅ tarefas: approve, reject
```
**Quem é**: Usuários com `role = 'admin'` ou `role = 'gestor'`  
**Acesso**: Gerenciamento completo da organização

---

### USER (Advogado / Secretária / Leitura)
```typescript
// USER_PERMISSIONS
✅ organizations: read
✅ users: read
✅ leads: create, read, update
✅ clients: create, read, update
✅ cases: create, read, update
✅ documents: create, read, update
✅ agenda: create, read, update, delete
✅ integrations: read
❌ settings: (sem acesso)
❌ billing: (sem acesso)
✅ reports: read
❌ tarefas: approve, reject (SEM ACESSO!)
```
**Quem é**: Usuários com `role = 'advogado'`, `'secretaria'` ou `'leitura'`  
**Acesso**: CRUD básico em dados de trabalho

---

## 📋 Diferenças Práticas

| Ação | Advogado | Gestor | Admin Fartech |
|---|---|---|---|
| **Ver dashboard** | ✅ | ✅ | ✅ |
| **Criar lead** | ✅ | ✅ | ✅ |
| **Editar seu lead** | ✅ | ✅ | ✅ |
| **Editar lead de outro** | ❌ | ✅ | ✅ |
| **Gerenciar usuários** | ❌ | ✅ | ✅ |
| **Aprovar tarefas** | ❌ | ✅ | ✅ |
| **Rejeitar tarefas** | ❌ | ✅ | ✅ |
| **Acessar settings** | ❌ | ✅ | ✅ |
| **Ver billing** | ❌ | ✅ (read) | ✅ |
| **Gerenciar integrações** | ❌ | ✅ | ✅ |
| **Acessar outras orgs** | ❌ | ❌ | ✅ |

---

## 🔍 Análise: Acesso do Advogado

### ✅ O que o advogado PODE fazer

**Leads**:
- ✅ Criar novo lead
- ✅ Ver seus leads
- ✅ Editar seus leads
- ✅ Ser atribuído a leads
- ✅ Gerenciar documentos dos leads

**Casos**:
- ✅ Criar caso vinculado ao lead
- ✅ Ver seus casos
- ✅ Editar seus casos
- ✅ Adicionar documentos

**Documentos**:
- ✅ Fazer upload
- ✅ Organizar
- ✅ Compartilhar dentro da org

**Agenda**:
- ✅ Criar eventos
- ✅ Editar seus eventos
- ✅ Deletar seus eventos
- ✅ Ver agenda da org

**Tarefas**:
- ✅ Ver suas tarefas atribuídas
- ✅ Submeter tarefas para validação
- ✅ Completar tarefas
- ❌ **NÃO pode aprovar** (ver abaixo)
- ❌ **NÃO pode rejeitar** (ver abaixo)

**Relatórios**:
- ✅ Ver relatórios padrão

### ❌ O que o advogado NÃO pode fazer

| Ação | Motivo |
|---|---|
| Editar leads de outros | Sem permissão `update` em `leads` para recursos de outros |
| Gerenciar usuários | Sem permissão de `users:manage` |
| Aprovar tarefas | Não é `org_admin` - requer `isCurrentUserAdminish()` |
| Rejeitar tarefas | Não é `org_admin` - requer `isCurrentUserAdminish()` |
| Acessar settings | Sem permissão em `settings` |
| Ver billing | Sem permissão em `billing` |
| Gerenciar integrações | Sem permissão em `integrations:manage` |

---

## 🔧 Fluxo de Tarefas (Advogado vs Gestor)

### Cenário: Advogado completa tarefa

```
1. Advogado tem tarefa atribuída
   status: 'pendente'
   assigned_to: advogado_id

2. Advogado trabalha na tarefa
   (implementação, pesquisa, etc)

3. Advogado submete para validação
   tarefasService.submitForValidation(id)
   ✅ PERMITIDO (sem verificação de role)
   status muda para: 'aguardando_validacao'

4. Gestor recebe notificação
   Vê tarefa em "Aguardando Validação"

5. Gestor aprova ou rejeita
   isCurrentUserAdminish() → true
   ✅ PERMITIDO
   
   SE APROVAR:
   tarefasService.approveTask(id)
   → status: 'concluida'
   → confirmed_by: gestor_id
   
   SE REJEITAR:
   tarefasService.rejectTask(id, reason)
   → status: 'devolvida'
   → rejected_reason: motivo
```

---

## ⚠️ Possíveis Problemas de Acesso

### 1. **Advogado não consegue ver seus leads**
**Causa**: Filtro RLS em `leads` filtra por `assigned_user_id`  
**Solução**: Verificar RLS policies em `leads`

### 2. **Advogado não consegue editar caso**
**Causa**: Sem permissão ou RLS bloqueando  
**Solução**: Validar `cases:update` em `USER_PERMISSIONS`

### 3. **Advogado vê botão de "Aprovar" mas erro ao clicar**
**Causa**: Frontend não verifica `isCurrentUserAdminish()`  
**Solução**: Adicionar validação no componente

### 4. **Gestor não consegue rejeitar tarefa**
**Causa**: Mesmo depois da correção, `isCurrentUserAdminish()` pode estar com cache  
**Solução**: Limpar cache com `clearOrgScopeCache()`

---

## ✅ Validação Técnica

### Mapeamento está correto em `permissionsService.ts`

```typescript
const roleMap: Record<OrgMemberRole, UserRole> = {
  admin: 'org_admin',        ✅
  gestor: 'org_admin',       ✅
  advogado: 'user',          ✅
  secretaria: 'user',        ✅
  leitura: 'user',           ✅
}
```

### Permissões estão definidas corretamente

```typescript
// USER_PERMISSIONS tem: create, read, update para CRUD
// Não tem: delete para leads/clients/cases (preserva histórico)
// Não tem: manage para integrations/settings
```

### Verificação de permissão em tarefas

```typescript
// Em tarefasService.ts - approveTask()
const isAdminish = await isCurrentUserAdminish()  ✅
if (!isAdminish) {
  throw new AppError('Apenas gestores podem aprovar', 'permission_denied')
}
```

---

## 📌 Checklist: O que Funciona

### Advogado

- [x] Ver dashboard
- [x] Criar/editar seus leads
- [x] Criar/editar seus casos
- [x] Ver documentos
- [x] Submeter tarefas para validação
- [x] Ver sua lista de tarefas
- [x] Gerenciar agenda
- [ ] Gerenciar usuários (bloqueado ✅)
- [ ] Aprovar/rejeitar tarefas (bloqueado ✅)
- [ ] Acessar settings (bloqueado ✅)

### Gestor

- [x] Ver dashboard
- [x] Gerenciar todos os leads da org
- [x] Gerenciar todos os casos
- [x] Gerenciar documentos
- [x] Gerenciar usuários
- [x] Aprovar/rejeitar tarefas
- [x] Acessar settings
- [x] Ver billing (read-only)
- [x] Gerenciar integrações
- [x] Criar relatórios

### Admin Fartech

- [x] Tudo acima
- [x] Acessar todas as organizações
- [x] Editar organizações
- [x] Gerenciar billing (full)
- [x] Ver logs de auditoria

---

## 🎯 Conclusão

### Status: ✅ HIERARQUIA CORRIGIDA

| Role | Banco | TypeScript | Status |
|---|---|---|---|
| Admin Fartech | N/A | `fartech_admin` | ✅ Funcionando |
| Admin/Gestor | `admin`, `gestor` | `org_admin` | ✅ **CORRIGIDO** |
| Advogado | `advogado` | `user` | ✅ Funcionando |
| Secretária | `secretaria` | `user` | ✅ Funcionando |
| Leitura | `leitura` | `user` | ✅ Funcionando |

**Nenhum problema adicional identificado além do bug do gestor já corrigido.**

A hierarquia está **funcionando corretamente** com permissões apropriadas para cada nível!

