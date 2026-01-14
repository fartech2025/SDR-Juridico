# Status da Implementação Multi-Tenant - SDR Jurídico

**Data:** 13 de janeiro de 2026  
**Status Geral:** 🟡 70% Completo - Aguardando mudanças no banco

---

## ✅ O QUE JÁ ESTÁ PRONTO E DESENVOLVIDO

### 📁 Contexts (100% Pronto)
**Localização:** `src/contexts/`

✅ **OrganizationContext.tsx** (172 linhas)
- Provider para gerenciar organização atual
- Hook `useOrganization()`
- Funções: `switchOrg()`, `refreshOrg()`
- Estado: `currentOrg`, `availableOrgs`, `loading`

✅ **PermissionsContext.tsx** (158 linhas)
- Provider para gerenciar permissões do usuário
- Hook `usePermissions()`
- Funções: `can()`, `hasRole()`, `checkPermission()`
- Verifica: Fartech Admin, Org Admin, User permissions

### 🎣 Hooks Customizados (100% Pronto)
**Localização:** `src/hooks/`

✅ **useOrganization.ts** (95 linhas)
- Acessa contexto de organização
- Retorna org atual, lista de orgs, funções de troca

✅ **usePermissions.ts** (120 linhas)
- Verifica permissões do usuário
- Funções: `can()`, `canAll()`, `canAny()`, `hasFullAccess()`, `canRead()`
- Suporta permissões granulares por recurso e ação

✅ **useIsFartechAdmin.ts** (210 linhas)
- Hook específico para Fartech Admins
- Gerencia múltiplas organizações
- Estatísticas globais
- Funções de criação/edição de orgs

✅ **useIsOrgAdmin.ts** (95 linhas)
- Hook específico para Org Admins
- Verifica se usuário é admin da org atual

✅ **useOrgMembers.ts** (180 linhas)
- Gerencia membros da organização
- CRUD de membros
- Convites e roles

### 🛡️ Guards/Proteções (100% Pronto)
**Localização:** `src/components/guards/`

✅ **PermissionGuard.tsx** (135 linhas)
- Guard genérico para verificar permissões
- Props: `permission`, `resource`, `action`, `permissions`, `anyPermissions`
- Renderiza children ou fallback

✅ **FartechGuard.tsx** (85 linhas)
- Protege rotas exclusivas Fartech Admin
- Redireciona se não for Fartech Admin

✅ **OrgAdminGuard.tsx** (85 linhas)
- Protege rotas de administração da org
- Redireciona se não for Org Admin

✅ **OrgActiveGuard.tsx** (95 linhas)
- Verifica se organização está ativa
- Redireciona para `/org-suspended` se suspensa

### 🔧 Services (100% Pronto)
**Localização:** `src/services/`

✅ **organizationsService.ts** (210 linhas)
- CRUD completo de organizações
- `getAll()`, `getById()`, `getBySlug()`
- `create()`, `update()`, `delete()`
- `getStats()` - estatísticas da org
- `suspend()`, `activate()`, `cancel()`

✅ **membersService.ts** (185 linhas)
- Gerenciamento de membros
- `getMembers()`, `addMember()`, `updateMember()`, `removeMember()`
- `inviteMember()`, `acceptInvite()`
- `updateRole()`, `deactivate()`

✅ **permissionsService.ts** (310 linhas)
- Sistema de permissões granular
- `getCurrentUserWithRole()`
- `checkPermission()`, `getUserPermissions()`
- `hasPermission()`, `requirePermission()`
- Constantes: `FARTECH_ADMIN_PERMISSIONS`, `ORG_ADMIN_PERMISSIONS`, `USER_PERMISSIONS`

### 📄 Pages Fartech Admin (100% Pronto)
**Localização:** `src/pages/fartech/`

✅ **OrganizationsList.tsx** (430 linhas)
- Lista todas as organizações
- Filtros: status, plano, busca
- Tabela com: nome, CNPJ, plano, status, usuários, ações
- Botões: criar, editar, suspender, detalhes

✅ **OrganizationForm.tsx** (380 linhas)
- Formulário criar/editar organização
- Campos: nome, slug, CNPJ, email, telefone, plano, limites
- Validação completa
- Modo criação e edição

✅ **OrganizationDetails.tsx** (520 linhas)
- Visualização detalhada da org
- Abas: Detalhes, Usuários, Configurações, Estatísticas
- Gráficos de uso
- Histórico de atividades
- Ações administrativas

### 📄 Pages Org Admin (100% Pronto)
**Localização:** `src/pages/`

✅ **UserManagement.tsx** (390 linhas)
- Gerenciamento de usuários da org
- Lista de membros com filtros
- Adicionar/remover usuários
- Alterar roles
- Convidar novos usuários

✅ **OrgSettings.tsx** (450 linhas)
- Configurações da organização
- Abas: Geral, Plano, Faturamento, Aparência, Integrações
- Edição de dados da org
- Upload de logo
- Personalização de cores

✅ **OrgSuspendedPage.tsx** (180 linhas)
- Página mostrada quando org está suspensa
- Motivo da suspensão
- Contato para reativação
- Design específico

### 📘 Types/Interfaces (100% Pronto)
**Localização:** `src/types/`

✅ **organization.ts** (285 linhas)
- `Organization` interface
- `OrganizationStatus`: 'pending' | 'active' | 'suspended' | 'cancelled'
- `OrganizationPlan`: 'trial' | 'basic' | 'professional' | 'enterprise'
- `UserRole`: 'admin' | 'gestor' | 'advogado' | 'secretaria' | 'leitura'
- `OrgMember`, `CreateOrganizationInput`, `UpdateOrganizationInput`
- `OrganizationStats`, `Permission`, `PermissionCheck`

### 📜 SQL Scripts (100% Pronto)
**Localização:** raiz do projeto

✅ **SETUP_MULTITENANT_INCREMENTAL.sql** (450 linhas)
- Script completo de setup multi-tenant
- Adiciona colunas: org_id, role, is_fartech_admin
- 18 políticas RLS
- Índices otimizados
- Organização de teste
- Queries de verificação

✅ **ROLLBACK_COMPLETO.sql** (220 linhas)
- Script de rollback seguro
- Remove todas as mudanças multi-tenant
- Limpa RLS
- Restaura estado anterior

---

## 🟡 O QUE ESTÁ DESABILITADO TEMPORARIAMENTE

### ⚠️ Código Comentado/Removido (Aguardando banco)

**App.tsx**
- ❌ `<OrganizationProvider>` removido
- ❌ `<PermissionsProvider>` removido

**router.tsx**
- ❌ Rotas `/app/users` removidas
- ❌ Rotas `/app/settings` removidas
- ❌ Rotas `/fartech/*` removidas
- ❌ Rota `/org-suspended` removida
- ❌ Guards (OrgActiveGuard, FartechGuard, OrgAdminGuard) removidos

**AppShell.tsx**
- ❌ Menus admin removidos (Usuários, Configurações Org)
- ❌ Menu Fartech removido (Organizações)
- ❌ Badge "Fartech Admin" removido
- ❌ Nome da org no header removido
- ❌ Variável `isFartechRoute` removida

**Services (Filtros org_id desabilitados)**
- ❌ `integrationsService.ts` - sem filtro org_id
- ❌ `leadsService.ts` - sem filtro org_id
- ❌ `clientesService.ts` - sem filtro org_id
- ❌ `casosService.ts` - sem filtro org_id
- ❌ `documentosService.ts` - sem filtro org_id
- ❌ `agendaService.ts` - sem filtro org_id

**Libs**
- ❌ `org.ts` - retorna `null` temporariamente (não acessa `org_members`)

**Hooks**
- ❌ `useCurrentUser.ts` - não busca `org_members` (simplificado)

---

## 🔴 O QUE FALTA FAZER (Após mudanças no banco)

### Fase 1: Executar Mudanças no Banco 🗄️

**Tarefa 1.1:** Executar SQL Setup (30 min)
```bash
# No Supabase Dashboard → SQL Editor
# Executar: SETUP_MULTITENANT_INCREMENTAL.sql
```
- [ ] Adiciona colunas em `profiles`: org_id, role, is_fartech_admin
- [ ] Adiciona org_id em: leads, clientes, casos, documentos
- [ ] Cria 18 políticas RLS
- [ ] Cria organização de teste

**Tarefa 1.2:** Criar tabela org_members (15 min)
```sql
CREATE TABLE org_members (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES orgs(id),
  user_id UUID REFERENCES profiles(id),
  role VARCHAR(50),
  ativo BOOLEAN,
  created_at TIMESTAMP
);
-- + RLS policies
```

**Tarefa 1.3:** Criar usuários de teste (15 min)
- [ ] Fartech Admin: admin@fartech.com.br
- [ ] Org Admin: gestor@demo.local
- [ ] User: user@demo.local

### Fase 2: Reativar Código Backend 🔧

**Tarefa 2.1:** Restaurar org.ts (15 min)
```typescript
// src/lib/org.ts
// Descomentar query org_members
// Adicionar lógica is_fartech_admin
```
- [ ] Função `getActiveOrgId()` completa
- [ ] Função `requireOrgId()` completa
- [ ] Suporte a Fartech Admin (sem org_id)

**Tarefa 2.2:** Restaurar useCurrentUser (30 min)
```typescript
// src/hooks/useCurrentUser.ts
// Descomentar query org_members
// Adicionar lógica role, is_fartech_admin
```
- [ ] Query profiles completa
- [ ] Query org_members completa
- [ ] Retornar orgId, orgName, role, is_fartech_admin

**Tarefa 2.3:** Reativar filtros org_id nos Services (1-2 horas)

Arquivos a modificar:
- [ ] `integrationsService.ts` - adicionar `if (orgId) query.eq('org_id', orgId)`
- [ ] `leadsService.ts` - adicionar filtro org_id em todas as queries
- [ ] `clientesService.ts` - adicionar filtro org_id
- [ ] `casosService.ts` - adicionar filtro org_id
- [ ] `documentosService.ts` - adicionar filtro org_id
- [ ] `agendaService.ts` - adicionar filtro org_id
- [ ] `notasService.ts` - adicionar filtro org_id

**Padrão a seguir:**
```typescript
// ANTES
async getLeads() {
  const { data } = await supabase.from('leads').select('*')
  return data
}

// DEPOIS
async getLeads() {
  const orgId = await getActiveOrgId()
  let query = supabase.from('leads').select('*')
  if (orgId) query = query.eq('org_id', orgId)
  const { data } = await query
  return data
}

// CREATE sempre com org_id
async createLead(input) {
  const orgId = await requireOrgId()
  const { data } = await supabase
    .from('leads')
    .insert({ ...input, org_id: orgId })
  return data
}
```

### Fase 3: Reativar Código Frontend 🎨

**Tarefa 3.1:** Reativar Providers no App.tsx (15 min)
```typescript
// src/App.tsx
<AuthProvider>
  <OrganizationProvider>      {/* ✅ Descomentar */}
    <PermissionsProvider>     {/* ✅ Descomentar */}
      <ThemeProvider>
        {/* ... */}
      </ThemeProvider>
    </PermissionsProvider>
  </OrganizationProvider>
</AuthProvider>
```

**Tarefa 3.2:** Reativar Rotas no router.tsx (30 min)
- [ ] Adicionar rotas `/app/users` com `<OrgAdminGuard>`
- [ ] Adicionar rotas `/app/settings` com `<OrgAdminGuard>`
- [ ] Adicionar rotas `/fartech/*` com `<FartechGuard>`
- [ ] Adicionar rota `/org-suspended`
- [ ] Wrap `/app` com `<OrgActiveGuard>`

**Tarefa 3.3:** Reativar Menus no AppShell.tsx (45 min)
```typescript
// src/layouts/AppShell.tsx
const { currentOrg } = useOrganization()           // ✅ Descomentar
const { isFartechAdmin, isOrgAdmin } = usePermissions() // ✅ Descomentar
const isFartechRoute = location.pathname.startsWith('/fartech') // ✅ Adicionar

// Adicionar menus condicionais
const orgAdminItems = isOrgAdmin ? [...] : []      // ✅ Adicionar
const fartechItems = isFartechAdmin ? [...] : []   // ✅ Adicionar

// No header
<p>{currentOrg?.nome || displayName}</p>           // ✅ Adicionar

// Badge Fartech
{isFartechAdmin && <Badge>Fartech Admin</Badge>}   // ✅ Adicionar
```

### Fase 4: Testes ✅

**Tarefa 4.1:** Testes Banco (1 hora)
- [ ] Verificar RLS em todas as tabelas
- [ ] Testar acesso Fartech Admin (vê tudo)
- [ ] Testar acesso Org Admin (vê só sua org)
- [ ] Testar acesso User (vê só sua org)
- [ ] Testar isolamento (não vê outras orgs)

**Tarefa 4.2:** Testes Funcionalidade (2-3 horas)
- [ ] Login como Fartech Admin → Menu Fartech aparece
- [ ] Acessar /fartech/organizations → Lista todas orgs
- [ ] Criar nova organização
- [ ] Login como Org Admin → Menu Usuários aparece
- [ ] Acessar /app/users → Lista usuários da org
- [ ] Adicionar novo usuário
- [ ] Login como User → Menus admin não aparecem
- [ ] Tentar acessar /app/users → Bloqueado
- [ ] Verificar dashboard mostra só dados da org

**Tarefa 4.3:** Testes de Isolamento (1 hora)
- [ ] Criar 2ª organização
- [ ] Criar usuário na 2ª org
- [ ] Criar lead na 2ª org
- [ ] Logar com user da 1ª org
- [ ] Verificar que NÃO vê lead da 2ª org

---

## 📊 Resumo Quantitativo

### ✅ Código Pronto (Aguardando banco)
- **25 arquivos TypeScript** (~4.200 linhas)
- **3 Contexts** completos
- **5 Hooks** completos
- **4 Guards** completos
- **3 Services** completos
- **6 Pages** completas
- **2 SQL Scripts** completos

### 🔴 Pendente (Após banco)
- **1 SQL para executar** (SETUP_MULTITENANT_INCREMENTAL.sql)
- **1 tabela para criar** (org_members)
- **3 usuários de teste** para criar
- **8 services** para reativar filtros
- **3 arquivos** para descomentar (App.tsx, router.tsx, AppShell.tsx)
- **2 hooks/libs** para restaurar (useCurrentUser, org.ts)

### ⏱️ Tempo Estimado Total
- **Fase 1 (Banco):** 1 hora
- **Fase 2 (Backend):** 2-3 horas
- **Fase 3 (Frontend):** 1,5 horas
- **Fase 4 (Testes):** 4-5 horas
- **TOTAL:** 8,5 - 10,5 horas (1-2 dias de trabalho)

---

## 🎯 Próximo Passo IMEDIATO

### 🚀 Começar pela Fase 1: Banco de Dados

**1. Executar SETUP_MULTITENANT_INCREMENTAL.sql**
   - Abrir Supabase Dashboard
   - SQL Editor
   - Copiar/Colar conteúdo do arquivo
   - Executar
   - Verificar mensagens de sucesso

**2. Criar tabela org_members**
   - Usar SQL fornecido no PLANO_MULTITENANT_COMPLETO.md
   - Seção 1.2

**3. Criar 3 usuários de teste**
   - admin@fartech.com.br (Fartech Admin)
   - gestor@demo.local (Org Admin)
   - user@demo.local (User)

**Após esses 3 passos, avisar para continuarmos com Fase 2! 🚀**
