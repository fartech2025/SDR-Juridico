# 🏢 Plano de Transformação Multi-Tenant - SDR Jurídico

**Data:** 13 de Janeiro de 2026  
**Status:** 🚧 Em Desenvolvimento Local (NÃO fazer push ainda)

---

## 🎯 Objetivo

Transformar a aplicação de **single-tenant** para **multi-tenant SaaS** gerenciado pela **Fartech**.

---

## 📐 Arquitetura Proposta

### Hierarquia de Usuários

```
┌─────────────────────────────────────────┐
│  FARTECH (Super Admin)                  │
│  Role: fartech_admin                    │
│  - Cadastra organizações                │
│  - Provisiona ambientes                 │
│  - Gerencia billing/licenças            │
│  - Acesso total ao sistema              │
└────────────┬────────────────────────────┘
             │
    ┌────────┴─────────┐
    │                  │
┌───▼─────────────┐ ┌──▼──────────────┐
│ Organização A   │ │ Organização B   │
│ org_id: uuid-1  │ │ org_id: uuid-2  │
└────┬────────────┘ └────┬────────────┘
     │                   │
     │                   │
┌────▼──────────┐   ┌────▼──────────┐
│ Gestor (Org)  │   │ Gestor (Org)  │
│ Role: org_admin│   │ Role: org_admin│
│ - Gerencia    │   │ - Gerencia    │
│   usuários    │   │   usuários    │
│ - Configs org │   │ - Configs org │
└───┬───────────┘   └───┬───────────┘
    │                   │
    │                   │
┌───▼────────┐      ┌───▼────────┐
│ Usuários   │      │ Usuários   │
│ Role: user │      │ Role: user │
│ - Advogados│      │ - Advogados│
│ - Paralegal│      │ - Paralegal│
└────────────┘      └────────────┘
```

---

## 🗄️ Modificações no Banco de Dados

### 1. Nova Tabela: `organizations`

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL, -- escritorio-silva
  cnpj VARCHAR(18) UNIQUE,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address JSONB,
  
  -- Plano e limites
  plan VARCHAR(50) DEFAULT 'trial', -- trial, basic, professional, enterprise
  max_users INTEGER DEFAULT 5,
  max_storage_gb INTEGER DEFAULT 10,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, active, suspended, cancelled
  
  -- Billing
  billing_email VARCHAR(255),
  billing_cycle VARCHAR(20) DEFAULT 'monthly', -- monthly, yearly
  next_billing_date TIMESTAMP,
  
  -- Branding/Customização
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#059669', -- emerald-600
  secondary_color VARCHAR(7),
  
  -- Metadata
  settings JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  activated_at TIMESTAMP,
  
  -- Provisionamento
  provisioned_by UUID REFERENCES users(id), -- Fartech admin que criou
  managed_by UUID REFERENCES users(id) -- Gestor atual
);

-- Índices
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_status ON organizations(status);
CREATE INDEX idx_organizations_cnpj ON organizations(cnpj);
```

### 2. Modificação: Tabela `users`

```sql
-- Adicionar colunas
ALTER TABLE users
ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN role VARCHAR(20) DEFAULT 'user', -- fartech_admin, org_admin, user
ADD COLUMN is_fartech_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN department VARCHAR(100),
ADD COLUMN position VARCHAR(100);

-- Índices
CREATE INDEX idx_users_org_id ON users(org_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_fartech_admin ON users(is_fartech_admin);

-- RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Fartech admins veem tudo
CREATE POLICY "Fartech admins see all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.is_fartech_admin = TRUE
    )
  );

-- Policy: Org admins veem apenas sua org
CREATE POLICY "Org admins see their organization users"
  ON users FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM users
      WHERE id = auth.uid()
      AND role IN ('org_admin', 'fartech_admin')
    )
  );

-- Policy: Users veem apenas usuários da própria org
CREATE POLICY "Users see their organization members"
  ON users FOR SELECT
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );
```

### 3. Adicionar `org_id` em Todas as Tabelas

**Tabelas a modificar:**
- `leads` → org_id
- `clientes` → org_id
- `casos` → org_id
- `documentos` → org_id
- `agenda_eventos` → org_id
- `integrations` → org_id
- `tags` → org_id
- `comentarios` → org_id
- `historico_alteracoes` → org_id

**Template SQL:**
```sql
-- Exemplo para leads
ALTER TABLE leads
ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX idx_leads_org_id ON leads(org_id);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access only their org data"
  ON leads FOR ALL
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Fartech admins access all data"
  ON leads FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND is_fartech_admin = TRUE
    )
  );
```

---

## 🔐 Sistema de Permissões

### Roles e Capacidades

| Role | Capacidade |
|------|------------|
| **fartech_admin** | Acesso total ao sistema, todas organizações, provisionar novos clientes |
| **org_admin** | Gerencia sua organização, adiciona usuários, configura integrações |
| **user** | Acesso aos recursos da sua organização (leads, casos, agenda) |

### Matriz de Permissões

| Ação | fartech_admin | org_admin | user |
|------|---------------|-----------|------|
| Criar organizações | ✅ | ❌ | ❌ |
| Ver todas orgs | ✅ | ❌ | ❌ |
| Gerenciar usuários da org | ✅ | ✅ | ❌ |
| Configurar integrações | ✅ | ✅ | ❌ |
| Ver billing | ✅ | ✅ | ❌ |
| CRUD leads/casos | ✅ | ✅ | ✅ |
| Ver documentos | ✅ | ✅ | ✅ |
| Agendar eventos | ✅ | ✅ | ✅ |

---

## 📱 Novas Páginas/Componentes

### 1. Portal SuperAdmin (Fartech)

**Rota:** `/fartech/admin`

**Páginas:**
- `/fartech/admin/dashboard` - Overview de todas organizações
- `/fartech/admin/organizations` - Lista e gerencia organizações
- `/fartech/admin/organizations/new` - Cadastrar nova organização
- `/fartech/admin/organizations/:id` - Detalhes da organização
- `/fartech/admin/billing` - Gestão de faturamento
- `/fartech/admin/users` - Ver todos usuários do sistema

### 2. Onboarding de Organizações

**Fluxo:**
1. Fartech preenche formulário de cadastro
2. Sistema cria organização (status: pending)
3. Sistema envia email para gestor com link de ativação
4. Gestor acessa link, define senha
5. Status muda para active
6. Gestor é redirecionado para seu dashboard

### 3. Dashboard Organizacional

**Adaptações:**
- Header mostra logo e nome da organização
- Métricas filtradas por org_id automaticamente
- Config page permite org_admin customizar branding

---

## 🔧 Implementação - Ordem de Execução

### Fase 1: Fundação (Banco + Tipos)
1. ✅ Criar migration para tabela `organizations`
2. ✅ Adicionar org_id em todas as tabelas
3. ✅ Implementar RLS policies
4. ✅ Criar tipos TypeScript para multi-tenancy
5. ✅ Atualizar database.types.ts

### Fase 2: Contexto e Serviços
6. ✅ Criar OrganizationContext (React Context)
7. ✅ Adaptar supabaseClient para incluir org_id automaticamente
8. ✅ Criar organizationsService
9. ✅ Atualizar todos os services existentes (leadsService, etc.)
10. ✅ Criar useOrganization hook

### Fase 3: Autenticação e Permissões
11. ✅ Criar PermissionGuard component
12. ✅ Atualizar AuthContext para incluir role/org
13. ✅ Criar hook usePermissions
14. ✅ Proteger rotas por permissão

### Fase 4: Interface SuperAdmin
15. ✅ Criar layout FartechAdminLayout
16. ✅ Criar FartechDashboard
17. ✅ Criar OrganizationsListPage
18. ✅ Criar OrganizationFormPage (new/edit)
19. ✅ Criar OrganizationDetailsPage
20. ✅ Adicionar rotas /fartech/admin/*

### Fase 5: Onboarding
21. ✅ Criar fluxo de cadastro de organização
22. ✅ Sistema de envio de email de ativação
23. ✅ Página de ativação de gestor
24. ✅ First-time setup wizard

### Fase 6: Adaptação UI
25. ✅ Adaptar header para mostrar org atual
26. ✅ Adicionar seletor de organização (fartech_admin)
27. ✅ Página de configurações da organização
28. ✅ Upload de logo personalizado
29. ✅ Customização de cores

### Fase 7: Testes e Refinamento
30. ✅ Testar isolamento de dados entre orgs
31. ✅ Validar RLS policies
32. ✅ Testar todos os fluxos de usuário
33. ✅ Performance e otimizações

---

## 📂 Estrutura de Arquivos Nova

```
src/
├── contexts/
│   ├── OrganizationContext.tsx     [NOVO]
│   └── PermissionsContext.tsx      [NOVO]
│
├── hooks/
│   ├── useOrganization.ts          [NOVO]
│   ├── usePermissions.ts           [NOVO]
│   └── useFartechAdmin.ts          [NOVO]
│
├── services/
│   ├── organizationsService.ts     [NOVO]
│   ├── permissionsService.ts       [NOVO]
│   ├── leadsService.ts             [MODIFICAR - adicionar org_id]
│   ├── clientesService.ts          [MODIFICAR]
│   ├── casosService.ts             [MODIFICAR]
│   └── ... (todos os services)
│
├── pages/
│   ├── fartech/
│   │   └── admin/
│   │       ├── FartechDashboard.tsx
│   │       ├── OrganizationsList.tsx
│   │       ├── OrganizationForm.tsx
│   │       ├── OrganizationDetails.tsx
│   │       └── BillingPage.tsx
│   │
│   └── organization/
│       ├── SettingsPage.tsx        [NOVO]
│       └── BrandingPage.tsx        [NOVO]
│
├── components/
│   ├── guards/
│   │   ├── PermissionGuard.tsx     [NOVO]
│   │   └── FartechGuard.tsx        [NOVO]
│   │
│   └── organization/
│       ├── OrgSelector.tsx         [NOVO]
│       ├── OrgHeader.tsx           [NOVO]
│       └── BrandingPreview.tsx     [NOVO]
│
├── types/
│   ├── organization.ts             [NOVO]
│   ├── permissions.ts              [NOVO]
│   └── roles.ts                    [NOVO]
│
└── lib/
    ├── organizationHelpers.ts      [NOVO]
    └── permissionsHelpers.ts       [NOVO]
```

---

## 🔄 Fluxo de Dados Multi-Tenant

### Request Flow

```
User Request
    ↓
Auth Middleware (verifica token)
    ↓
Extract org_id from user token
    ↓
Set org_id context
    ↓
Query Supabase with org_id filter
    ↓
RLS Policy validates org_id
    ↓
Return filtered data
```

### Exemplo de Query

**Antes (single-tenant):**
```typescript
const { data } = await supabase
  .from('leads')
  .select('*')
```

**Depois (multi-tenant):**
```typescript
const { data } = await supabase
  .from('leads')
  .select('*')
// org_id é automaticamente filtrado pela RLS Policy
// baseado no user.org_id do token JWT
```

---

## 🎨 UI/UX Multi-Tenant

### Header Adaptativo

```
┌────────────────────────────────────────┐
│ [Logo Fartech] SDR Jurídico            │
│                                        │
│ [Se fartech_admin:]                    │
│   Organização: [Dropdown Selector ▼]  │
│                                        │
│ [Se org_admin/user:]                   │
│   [Logo da Org] Nome da Organização   │
└────────────────────────────────────────┘
```

### Configurações da Organização

**Tab: Geral**
- Nome da organização
- CNPJ
- Email/Telefone
- Endereço

**Tab: Branding**
- Upload logo
- Cor primária
- Cor secundária
- Preview em tempo real

**Tab: Plano e Limites**
- Plano atual
- Usuários: 3/10
- Storage: 2.5GB/10GB
- Botão "Solicitar upgrade"

**Tab: Usuários**
- Lista de usuários da org
- Convidar novo usuário
- Gerenciar permissões

**Tab: Integrações**
- (Página atual de integrações)

---

## 🔒 Segurança

### RLS (Row Level Security)

- ✅ Todas as tabelas com RLS enabled
- ✅ Policies para fartech_admin (acesso total)
- ✅ Policies para org_admin (acesso à sua org)
- ✅ Policies para user (acesso à sua org)

### Validações

- JWT token contém org_id
- Todas as queries validam org_id
- Frontend valida permissões antes de renderizar
- Backend (Supabase) valida novamente via RLS

### Auditoria

- Logs de acesso de fartech_admin a outras orgs
- Registro de mudanças de plano/status
- Histórico de alterações por org

---

## 📊 Métricas e Monitoramento

### Dashboard Fartech

- Total de organizações
- Organizações ativas/suspensas
- Total de usuários no sistema
- Storage total utilizado
- Receita mensal recorrente (MRR)

### Dashboard Organizacional

- (Mantém métricas atuais, filtradas por org)

---

## 🚀 Migration Strategy

### Dados Existentes

**Opção 1: Migração Completa**
1. Criar organização padrão "Legacy Org"
2. Associar todos os dados existentes a essa org
3. Todos os usuários atuais vão para "Legacy Org"

**Opção 2: Multi-org desde o início**
1. Prompt no primeiro acesso: "Criar sua organização"
2. Usuário existente se torna org_admin
3. Dados migram para nova org

---

## ✅ Checklist de Implementação

### Database
- [ ] Migration: criar tabela organizations
- [ ] Migration: adicionar org_id em todas as tabelas
- [ ] Migration: criar RLS policies
- [ ] Atualizar database.types.ts

### Backend/Services
- [ ] organizationsService (CRUD)
- [ ] Adaptar leadsService
- [ ] Adaptar clientesService
- [ ] Adaptar casosService
- [ ] Adaptar documentosService
- [ ] Adaptar agendaService
- [ ] Adaptar integrationsService

### Contexts & Hooks
- [ ] OrganizationContext
- [ ] PermissionsContext
- [ ] useOrganization
- [ ] usePermissions
- [ ] useFartechAdmin

### Components
- [ ] PermissionGuard
- [ ] FartechGuard
- [ ] OrgSelector
- [ ] OrgHeader

### Pages - Fartech Admin
- [ ] FartechDashboard
- [ ] OrganizationsList
- [ ] OrganizationForm
- [ ] OrganizationDetails
- [ ] BillingPage

### Pages - Organization
- [ ] OrganizationSettingsPage
- [ ] BrandingPage
- [ ] UsersManagementPage

### Routes
- [ ] /fartech/admin/*
- [ ] /organization/settings
- [ ] Proteger rotas com guards

### UI Adaptations
- [ ] Header com logo da org
- [ ] Seletor de org (fartech_admin)
- [ ] Temas personalizados por org

### Testing
- [ ] Testar isolamento de dados
- [ ] Testar RLS policies
- [ ] Testar fluxo de cadastro
- [ ] Testar permissões

---

## 📝 Notas Importantes

⚠️ **DESENVOLVIMENTO LOCAL - NÃO FAZER PUSH AINDA**

- Todas as mudanças serão testadas localmente primeiro
- Após validação completa, faremos commit
- Planejar estratégia de deploy (staging → production)

---

## 🎯 Próximos Passos

1. ✅ Criar migrations do banco
2. ✅ Atualizar tipos TypeScript
3. ✅ Implementar contextos e hooks
4. ✅ Criar serviços
5. ✅ Construir UI Fartech Admin
6. ✅ Adaptar UI existente
7. ✅ Testes completos

---

**Status Atual:** 📝 Plano Completo - Pronto para iniciar implementação

**Última Atualização:** 13 de Janeiro de 2026
