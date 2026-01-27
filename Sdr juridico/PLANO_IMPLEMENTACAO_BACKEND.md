# 🚀 PLANO DE IMPLEMENTAÇÃO - BACKEND E SEGURANÇA

**Data:** 27 de janeiro de 2026  
**Projeto:** SDR Jurídico  
**Objetivo:** Backend completo + Segurança + Multi-tenant + Gestão de Escritórios

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Arquitetura de Dados](#arquitetura-de-dados)
3. [Sistema de Permissões](#sistema-de-permissões)
4. [Fluxo de Cadastro](#fluxo-de-cadastro)
5. [Implementação em Fases](#implementação-em-fases)
6. [Checklist de Execução](#checklist-de-execução)

---

## 🎯 VISÃO GERAL

### Estrutura Hierárquica

```
┌─────────────────────────────────────────────────────────┐
│                    FARTECH (Admin)                       │
│              Gerencia múltiplos escritórios              │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ Escritório A  │  │ Escritório B  │  │ Escritório C  │
│ (Tenant)      │  │ (Tenant)      │  │ (Tenant)      │
└───────────────┘  └───────────────┘  └───────────────┘
        │
        ├─ 👤 Gestor (Owner)          → Controle total
        ├─ 👨‍⚖️ Advogados             → Gerenciar casos
        ├─ 👥 Associados             → Acesso limitado
        └─ 📊 Equipe Administrativa  → Operações
```

---

## 🗄️ ARQUITETURA DE DADOS

### 1. Tabela: `organizations` (Escritórios)

```sql
-- ============================================
-- TABELA: organizations (Escritórios/Tenants)
-- ============================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL, -- URL amigável
  legal_name VARCHAR(255), -- Razão social
  
  -- Documentação
  cnpj VARCHAR(18) UNIQUE,
  oab_number VARCHAR(50), -- OAB do escritório
  oab_state VARCHAR(2),
  
  -- Contato
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  website VARCHAR(255),
  
  -- Endereço
  address_street VARCHAR(255),
  address_number VARCHAR(10),
  address_complement VARCHAR(100),
  address_neighborhood VARCHAR(100),
  address_city VARCHAR(100),
  address_state VARCHAR(2),
  address_zip VARCHAR(10),
  
  -- Plano e Status
  plan_type VARCHAR(50) DEFAULT 'trial', -- trial, basic, professional, enterprise
  status VARCHAR(20) DEFAULT 'active', -- active, suspended, cancelled
  trial_ends_at TIMESTAMPTZ,
  subscription_ends_at TIMESTAMPTZ,
  
  -- Configurações
  settings JSONB DEFAULT '{}', -- Configurações customizadas
  features JSONB DEFAULT '{}', -- Features habilitadas
  
  -- Limites
  max_users INT DEFAULT 5,
  max_cases INT DEFAULT 100,
  max_storage_gb INT DEFAULT 10,
  
  -- Chave de Convite (IMPORTANTE!)
  invite_token VARCHAR(100) UNIQUE NOT NULL, -- Token para convidar usuários
  invite_token_expires_at TIMESTAMPTZ,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Soft Delete
  deleted_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_status ON organizations(status);
CREATE INDEX idx_organizations_invite_token ON organizations(invite_token);
CREATE INDEX idx_organizations_cnpj ON organizations(cnpj) WHERE deleted_at IS NULL;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Fartech admins podem ver todos
CREATE POLICY "Fartech admins can view all organizations"
  ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'fartech_admin'
    )
  );

-- Usuários podem ver sua própria organização
CREATE POLICY "Users can view own organization"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM users
      WHERE id = auth.uid()
    )
  );
```

---

### 2. Tabela: `users` (Usuários)

```sql
-- ============================================
-- TABELA: users (Usuários do Sistema)
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Organização (Multi-tenant)
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Dados Pessoais
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  cpf VARCHAR(14) UNIQUE,
  
  -- Profissional
  oab_number VARCHAR(50), -- OAB do advogado
  oab_state VARCHAR(2),
  specialties TEXT[], -- Áreas de atuação
  
  -- Hierarquia e Permissões
  role VARCHAR(50) NOT NULL DEFAULT 'associado',
  -- Roles:
  --   - fartech_admin: Admin da plataforma (acesso total)
  --   - org_owner: Dono do escritório (controle total do tenant)
  --   - org_admin: Administrador do escritório
  --   - advogado: Advogado (gerencia casos)
  --   - associado: Associado (acesso limitado)
  --   - administrativo: Equipe administrativa
  
  permissions JSONB DEFAULT '[]', -- Permissões específicas
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- active, inactive, suspended
  is_verified BOOLEAN DEFAULT false,
  last_login_at TIMESTAMPTZ,
  
  -- Avatar e Preferências
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  invited_by UUID REFERENCES users(id),
  
  -- Soft Delete
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT users_org_required CHECK (
    role = 'fartech_admin' OR organization_id IS NOT NULL
  )
);

-- Índices
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_cpf ON users(cpf) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_oab ON users(oab_number, oab_state) WHERE deleted_at IS NULL;

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Fartech admins podem ver todos
CREATE POLICY "Fartech admins can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'fartech_admin'
    )
  );

-- Usuários podem ver membros da mesma organização
CREATE POLICY "Users can view same organization members"
  ON users FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE id = auth.uid()
    )
  );

-- Owners e admins podem atualizar usuários da org
CREATE POLICY "Org admins can update users"
  ON users FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE id = auth.uid()
      AND role IN ('org_owner', 'org_admin')
    )
  );
```

---

### 3. Tabela: `invitations` (Convites)

```sql
-- ============================================
-- TABELA: invitations (Convites de Usuários)
-- ============================================
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Organização
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Convite
  email VARCHAR(255) NOT NULL,
  token VARCHAR(100) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'associado',
  
  -- Metadados
  invited_by UUID NOT NULL REFERENCES users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, expired, revoked
  
  CONSTRAINT unique_pending_invitation UNIQUE (organization_id, email, status)
    WHERE status = 'pending'
);

-- Índices
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_organization ON invitations(organization_id);
CREATE INDEX idx_invitations_status ON invitations(status);

-- RLS Policies
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can manage invitations"
  ON invitations FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE id = auth.uid()
      AND role IN ('org_owner', 'org_admin')
    )
  );
```

---

### 4. Tabela: `roles_permissions` (Permissões)

```sql
-- ============================================
-- TABELA: roles_permissions (Matriz de Permissões)
-- ============================================
CREATE TABLE roles_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role VARCHAR(50) NOT NULL,
  resource VARCHAR(100) NOT NULL, -- leads, cases, clients, documents, etc
  action VARCHAR(50) NOT NULL, -- create, read, update, delete, manage
  allowed BOOLEAN DEFAULT true,
  
  UNIQUE(role, resource, action)
);

-- Inserir permissões padrão
INSERT INTO roles_permissions (role, resource, action, allowed) VALUES
  -- FARTECH ADMIN (Acesso total)
  ('fartech_admin', '*', '*', true),
  
  -- ORG OWNER (Controle total do tenant)
  ('org_owner', 'users', 'manage', true),
  ('org_owner', 'leads', 'manage', true),
  ('org_owner', 'cases', 'manage', true),
  ('org_owner', 'clients', 'manage', true),
  ('org_owner', 'documents', 'manage', true),
  ('org_owner', 'settings', 'manage', true),
  ('org_owner', 'billing', 'manage', true),
  
  -- ORG ADMIN (Gerenciamento operacional)
  ('org_admin', 'users', 'manage', true),
  ('org_admin', 'leads', 'manage', true),
  ('org_admin', 'cases', 'manage', true),
  ('org_admin', 'clients', 'manage', true),
  ('org_admin', 'documents', 'manage', true),
  ('org_admin', 'settings', 'read', true),
  
  -- ADVOGADO (Gerenciar casos)
  ('advogado', 'leads', 'read', true),
  ('advogado', 'leads', 'update', true),
  ('advogado', 'cases', 'create', true),
  ('advogado', 'cases', 'read', true),
  ('advogado', 'cases', 'update', true),
  ('advogado', 'clients', 'read', true),
  ('advogado', 'clients', 'create', true),
  ('advogado', 'documents', 'manage', true),
  
  -- ASSOCIADO (Acesso limitado)
  ('associado', 'leads', 'read', true),
  ('associado', 'cases', 'read', true),
  ('associado', 'clients', 'read', true),
  ('associado', 'documents', 'read', true),
  
  -- ADMINISTRATIVO (Operações)
  ('administrativo', 'leads', 'manage', true),
  ('administrativo', 'clients', 'manage', true),
  ('administrativo', 'documents', 'read', true);

-- RLS
ALTER TABLE roles_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read permissions"
  ON roles_permissions FOR SELECT
  USING (true);
```

---

### 5. Tabela: `audit_logs` (Auditoria)

```sql
-- ============================================
-- TABELA: audit_logs (Logs de Auditoria)
-- ============================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Contexto
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  
  -- Ação
  action VARCHAR(100) NOT NULL, -- create_user, update_case, delete_client
  resource_type VARCHAR(50) NOT NULL, -- users, cases, clients
  resource_id UUID,
  
  -- Detalhes
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Índices
  CONSTRAINT audit_logs_org_required CHECK (
    user_id IS NOT NULL OR organization_id IS NOT NULL
  )
);

-- Índices
CREATE INDEX idx_audit_logs_organization ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Particionamento por mês (performance)
-- CREATE TABLE audit_logs_2026_01 PARTITION OF audit_logs
--   FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE id = auth.uid()
      AND role IN ('org_owner', 'org_admin', 'fartech_admin')
    )
  );
```

---

### 6. Atualizar Tabelas Existentes (Multi-tenant)

```sql
-- ============================================
-- ATUALIZAR: leads
-- ============================================
ALTER TABLE leads
  ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  ADD COLUMN created_by UUID REFERENCES users(id),
  ADD COLUMN assigned_to UUID REFERENCES users(id);

CREATE INDEX idx_leads_organization ON leads(organization_id);

-- ============================================
-- ATUALIZAR: clientes
-- ============================================
ALTER TABLE clientes
  ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  ADD COLUMN created_by UUID REFERENCES users(id),
  ADD COLUMN responsible_lawyer UUID REFERENCES users(id);

CREATE INDEX idx_clientes_organization ON clientes(organization_id);

-- ============================================
-- ATUALIZAR: casos
-- ============================================
ALTER TABLE casos
  ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  ADD COLUMN created_by UUID REFERENCES users(id),
  ADD COLUMN lawyer_id UUID REFERENCES users(id);

CREATE INDEX idx_casos_organization ON casos(organization_id);

-- ============================================
-- ATUALIZAR: documentos
-- ============================================
ALTER TABLE documentos
  ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  ADD COLUMN uploaded_by UUID REFERENCES users(id);

CREATE INDEX idx_documentos_organization ON documentos(organization_id);

-- ============================================
-- ATUALIZAR: tarefas
-- ============================================
ALTER TABLE tarefas
  ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  ADD COLUMN assigned_to UUID REFERENCES users(id),
  ADD COLUMN created_by UUID REFERENCES users(id);

CREATE INDEX idx_tarefas_organization ON tarefas(organization_id);
```

---

## 🔐 SISTEMA DE PERMISSÕES

### Matriz de Permissões

| Role | Usuários | Leads | Casos | Clientes | Docs | Config |
|------|----------|-------|-------|----------|------|--------|
| **fartech_admin** | ✅ Todos | ✅ Todos | ✅ Todos | ✅ Todos | ✅ Todos | ✅ Todos |
| **org_owner** | ✅ Org | ✅ Org | ✅ Org | ✅ Org | ✅ Org | ✅ Org |
| **org_admin** | ✅ Org | ✅ Org | ✅ Org | ✅ Org | ✅ Org | 👁️ Leitura |
| **advogado** | 👁️ Leitura | ✏️ Editar | ✅ Gerenciar | ✏️ Editar | ✅ Gerenciar | ❌ Não |
| **associado** | 👁️ Leitura | 👁️ Leitura | 👁️ Leitura | 👁️ Leitura | 👁️ Leitura | ❌ Não |
| **administrativo** | 👁️ Leitura | ✅ Gerenciar | 👁️ Leitura | ✅ Gerenciar | 👁️ Leitura | ❌ Não |

---

## 🔄 FLUXO DE CADASTRO

### 1. Cadastro de Escritório (Self-Service)

```typescript
// Fluxo: Novo escritório se cadastra

1. Usuário acessa /cadastro
2. Preenche dados do escritório:
   - Nome do escritório
   - CNPJ
   - Email
   - Dados do gestor (nome, email, OAB)
3. Sistema cria:
   ✅ Organization (com invite_token único)
   ✅ User (como org_owner)
   ✅ Email de boas-vindas com link de ativação
4. Usuário confirma email e define senha
5. Redireciona para dashboard
```

**Implementação:**

```typescript
// src/application/use-cases/organizations/CreateOrganizationUseCase.ts

export class CreateOrganizationUseCase {
  async execute(data: CreateOrganizationDto): Promise<Organization> {
    // 1. Validar dados
    await this.validateOrganizationData(data);
    
    // 2. Gerar slug único
    const slug = await this.generateUniqueSlug(data.name);
    
    // 3. Gerar token de convite
    const inviteToken = this.generateInviteToken();
    
    // 4. Criar organização
    const org = await this.orgRepository.create({
      ...data,
      slug,
      inviteToken,
      status: 'trial',
      trialEndsAt: addDays(new Date(), 14) // 14 dias trial
    });
    
    // 5. Criar usuário owner
    const owner = await this.userRepository.create({
      organizationId: org.id,
      email: data.ownerEmail,
      fullName: data.ownerName,
      role: 'org_owner',
      oabNumber: data.ownerOab
    });
    
    // 6. Enviar email de boas-vindas
    await this.emailService.sendWelcome(owner.email, org.name);
    
    // 7. Log de auditoria
    await this.auditLog({
      action: 'create_organization',
      resourceType: 'organizations',
      resourceId: org.id,
      userId: owner.id
    });
    
    return org;
  }
}
```

---

### 2. Convite de Usuários (Pelo Gestor)

```typescript
// Fluxo: Gestor convida advogados/associados

1. Gestor acessa /equipe/convidar
2. Preenche dados:
   - Email
   - Nome
   - Cargo (advogado, associado, admin)
   - OAB (se advogado)
3. Sistema:
   ✅ Cria registro em invitations
   ✅ Envia email com link único
   ✅ Link: /aceitar-convite/{token}
4. Convidado clica no link
5. Define senha e confirma dados
6. Usuário criado e vinculado à organização
```

**Implementação:**

```typescript
// src/application/use-cases/users/InviteUserUseCase.ts

export class InviteUserUseCase {
  async execute(data: InviteUserDto): Promise<Invitation> {
    // 1. Verificar permissão do convidador
    const inviter = await this.userRepository.findById(data.inviterId);
    if (!['org_owner', 'org_admin'].includes(inviter.role)) {
      throw new UnauthorizedError('Sem permissão para convidar');
    }
    
    // 2. Verificar limites da organização
    const org = await this.orgRepository.findById(inviter.organizationId);
    const userCount = await this.userRepository.countByOrg(org.id);
    if (userCount >= org.maxUsers) {
      throw new BusinessError('Limite de usuários atingido');
    }
    
    // 3. Verificar se email já existe
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser && existingUser.organizationId === org.id) {
      throw new BusinessError('Usuário já cadastrado');
    }
    
    // 4. Gerar token único
    const token = this.generateInviteToken();
    
    // 5. Criar convite
    const invitation = await this.invitationRepository.create({
      organizationId: org.id,
      email: data.email,
      role: data.role,
      token,
      invitedBy: inviter.id,
      expiresAt: addDays(new Date(), 7) // 7 dias para aceitar
    });
    
    // 6. Enviar email
    await this.emailService.sendInvitation({
      to: data.email,
      inviterName: inviter.fullName,
      organizationName: org.name,
      role: data.role,
      acceptUrl: `${config.appUrl}/aceitar-convite/${token}`
    });
    
    // 7. Log
    await this.auditLog({
      action: 'invite_user',
      resourceType: 'invitations',
      resourceId: invitation.id,
      userId: inviter.id,
      organizationId: org.id
    });
    
    return invitation;
  }
}
```

---

### 3. Link de Convite Mágico (Sem cadastro prévio)

```typescript
// Fluxo: Compartilhar link para qualquer pessoa entrar

1. Gestor acessa /equipe/link-convite
2. Gera link permanente do escritório
3. Link: /entrar/{organization.invite_token}
4. Qualquer pessoa com o link pode:
   - Ver nome do escritório
   - Solicitar acesso
   - Gestor aprova/rejeita
5. Após aprovação, usuário é criado
```

**Implementação:**

```typescript
// src/application/use-cases/organizations/JoinOrganizationUseCase.ts

export class JoinOrganizationUseCase {
  async execute(token: string, userData: JoinOrgDto): Promise<User> {
    // 1. Encontrar organização pelo token
    const org = await this.orgRepository.findByInviteToken(token);
    if (!org) {
      throw new NotFoundError('Link inválido ou expirado');
    }
    
    if (org.status !== 'active') {
      throw new BusinessError('Escritório inativo');
    }
    
    // 2. Verificar limites
    const userCount = await this.userRepository.countByOrg(org.id);
    if (userCount >= org.maxUsers) {
      throw new BusinessError('Escritório atingiu limite de usuários');
    }
    
    // 3. Criar solicitação de acesso (pending approval)
    const request = await this.accessRequestRepository.create({
      organizationId: org.id,
      email: userData.email,
      fullName: userData.fullName,
      requestedRole: 'associado',
      status: 'pending'
    });
    
    // 4. Notificar admins
    const admins = await this.userRepository.findOrgAdmins(org.id);
    for (const admin of admins) {
      await this.notificationService.send({
        userId: admin.id,
        type: 'access_request',
        title: 'Nova solicitação de acesso',
        message: `${userData.fullName} solicitou acesso ao escritório`,
        data: { requestId: request.id }
      });
    }
    
    return request;
  }
}
```

---

## 📊 PAINÉIS DE ACOMPANHAMENTO

### 1. Dashboard Fartech (Admin Geral)

**Rota:** `/fartech/dashboard`

**Métricas:**
```typescript
interface FartechDashboard {
  totalOrganizations: number;
  activeOrganizations: number;
  totalUsers: number;
  totalCases: number;
  totalRevenue: number;
  
  organizations: {
    id: string;
    name: string;
    plan: string;
    status: string;
    userCount: number;
    caseCount: number;
    storageUsed: number;
    lastActivity: Date;
  }[];
  
  recentActivities: AuditLog[];
  systemHealth: {
    database: 'healthy' | 'degraded' | 'down';
    storage: 'healthy' | 'degraded' | 'down';
    api: 'healthy' | 'degraded' | 'down';
  };
}
```

**Ações Disponíveis:**
- ✅ Ver todas as organizações
- ✅ Suspender/reativar escritórios
- ✅ Ver logs de auditoria
- ✅ Estatísticas de uso
- ✅ Gerenciar planos e billing

---

### 2. Dashboard Escritório (Gestor)

**Rota:** `/dashboard`

**Métricas:**
```typescript
interface OrganizationDashboard {
  // Equipe
  totalUsers: number;
  usersByRole: Record<string, number>;
  activeUsers: number;
  
  // Leads e Clientes
  totalLeads: number;
  leadsThisMonth: number;
  conversionRate: number;
  totalClients: number;
  
  // Casos
  totalCases: number;
  casesByStatus: Record<string, number>;
  casesThisMonth: number;
  
  // Produtividade
  taskCompletionRate: number;
  avgResponseTime: number;
  
  // Financeiro
  monthlyRevenue: number;
  pendingPayments: number;
  
  // Storage
  storageUsed: number;
  storageLimit: number;
  
  // Atividades recentes
  recentActivities: Activity[];
}
```

---

### 3. Painel de Usuários (Gestor)

**Rota:** `/equipe`

**Funcionalidades:**
```typescript
interface TeamManagement {
  // Listagem
  users: User[];
  
  // Filtros
  filterByRole: string;
  filterByStatus: string;
  searchQuery: string;
  
  // Ações
  actions: {
    inviteUser: () => void;
    editUser: (userId: string) => void;
    changeRole: (userId: string, newRole: string) => void;
    deactivateUser: (userId: string) => void;
    resendInvitation: (userId: string) => void;
  };
  
  // Convites pendentes
  pendingInvitations: Invitation[];
  
  // Solicitações de acesso
  accessRequests: AccessRequest[];
}
```

---

## 🚀 IMPLEMENTAÇÃO EM FASES

### 📅 FASE 1: Fundamentos (Semana 1-2)

#### ✅ Sprint 1.1: Banco de Dados

**Objetivo:** Criar todas as tabelas e relacionamentos

**Tarefas:**
- [ ] Criar migration `001_create_organizations.sql`
- [ ] Criar migration `002_create_users.sql`
- [ ] Criar migration `003_create_invitations.sql`
- [ ] Criar migration `004_create_roles_permissions.sql`
- [ ] Criar migration `005_create_audit_logs.sql`
- [ ] Criar migration `006_update_existing_tables.sql`
- [ ] Testar RLS policies
- [ ] Popular dados de permissões

**Arquivos:**
```
supabase/migrations/
├── 20260127000001_create_organizations.sql
├── 20260127000002_create_users.sql
├── 20260127000003_create_invitations.sql
├── 20260127000004_create_roles_permissions.sql
├── 20260127000005_create_audit_logs.sql
└── 20260127000006_update_existing_tables.sql
```

---

#### ✅ Sprint 1.2: Domain Layer

**Objetivo:** Criar entidades de domínio

**Tarefas:**
- [ ] Criar `domain/entities/Organization.ts`
- [ ] Criar `domain/entities/User.ts`
- [ ] Criar `domain/entities/Invitation.ts`
- [ ] Criar `domain/value-objects/Email.ts`
- [ ] Criar `domain/value-objects/CNPJ.ts`
- [ ] Criar `domain/value-objects/OAB.ts`
- [ ] Criar `domain/validators/`
- [ ] Testes unitários

**Estrutura:**
```
src/domain/
├── entities/
│   ├── Organization.ts
│   ├── User.ts
│   └── Invitation.ts
├── value-objects/
│   ├── Email.ts
│   ├── CNPJ.ts
│   ├── OAB.ts
│   └── Phone.ts
├── validators/
│   ├── organizationValidator.ts
│   └── userValidator.ts
└── repositories/
    ├── IOrganizationRepository.ts
    ├── IUserRepository.ts
    └── IInvitationRepository.ts
```

---

### 📅 FASE 2: Repositories e Use Cases (Semana 3-4)

#### ✅ Sprint 2.1: Repositories

**Objetivo:** Implementar padrão Repository

**Tarefas:**
- [ ] Criar `infrastructure/repositories/SupabaseOrganizationRepository.ts`
- [ ] Criar `infrastructure/repositories/SupabaseUserRepository.ts`
- [ ] Criar `infrastructure/repositories/SupabaseInvitationRepository.ts`
- [ ] Criar `infrastructure/repositories/SupabaseAuditLogRepository.ts`
- [ ] Testes de integração

---

#### ✅ Sprint 2.2: Use Cases - Organizations

**Objetivo:** Casos de uso de escritórios

**Tarefas:**
- [ ] `CreateOrganizationUseCase.ts`
- [ ] `UpdateOrganizationUseCase.ts`
- [ ] `GetOrganizationUseCase.ts`
- [ ] `ListOrganizationsUseCase.ts` (Fartech)
- [ ] `SuspendOrganizationUseCase.ts`
- [ ] `GenerateInviteLinkUseCase.ts`

---

#### ✅ Sprint 2.3: Use Cases - Users

**Objetivo:** Casos de uso de usuários

**Tarefas:**
- [ ] `InviteUserUseCase.ts`
- [ ] `AcceptInvitationUseCase.ts`
- [ ] `CreateUserUseCase.ts`
- [ ] `UpdateUserUseCase.ts`
- [ ] `ChangeUserRoleUseCase.ts`
- [ ] `DeactivateUserUseCase.ts`
- [ ] `JoinOrganizationUseCase.ts` (via link)

---

### 📅 FASE 3: Frontend e UI (Semana 5-6)

#### ✅ Sprint 3.1: Cadastro de Escritório

**Componentes:**
- [ ] `pages/CadastroEscritorioPage.tsx`
- [ ] `components/features/organizations/OrganizationForm.tsx`
- [ ] `components/features/organizations/PlanSelector.tsx`
- [ ] Validação de CNPJ
- [ ] Integração com use cases

---

#### ✅ Sprint 3.2: Gestão de Equipe

**Componentes:**
- [ ] `pages/EquipePage.tsx`
- [ ] `components/features/users/UsersList.tsx`
- [ ] `components/features/users/UserCard.tsx`
- [ ] `components/features/users/InviteUserModal.tsx`
- [ ] `components/features/users/EditUserModal.tsx`
- [ ] `components/features/users/PendingInvitations.tsx`
- [ ] `components/features/users/AccessRequests.tsx`

---

#### ✅ Sprint 3.3: Dashboard Fartech

**Componentes:**
- [ ] `pages/fartech/FartechDashboard.tsx`
- [ ] `components/features/fartech/OrganizationsList.tsx`
- [ ] `components/features/fartech/OrganizationCard.tsx`
- [ ] `components/features/fartech/SystemHealthWidget.tsx`
- [ ] `components/features/fartech/RevenueChart.tsx`

---

### 📅 FASE 4: Segurança e Auditoria (Semana 7)

#### ✅ Sprint 4.1: Sistema de Permissões

**Tarefas:**
- [ ] Hook `usePermissions.ts` (já existe, melhorar)
- [ ] HOC `withPermission.tsx`
- [ ] Guard `PermissionGuard.tsx`
- [ ] Service `permissionsService.ts` (já existe, expandir)
- [ ] Testes

---

#### ✅ Sprint 4.2: Auditoria

**Tarefas:**
- [ ] Middleware de auditoria
- [ ] `AuditLogService.ts`
- [ ] `pages/AuditoriaPage.tsx` (já existe, expandir)
- [ ] Filtros e busca avançada
- [ ] Export de logs

---

### 📅 FASE 5: Notificações e Email (Semana 8)

#### ✅ Sprint 5.1: Sistema de Notificações

**Tarefas:**
- [ ] Criar tabela `notifications`
- [ ] `NotificationService.ts`
- [ ] Componente `NotificationCenter.tsx`
- [ ] WebSocket para tempo real
- [ ] Push notifications

---

#### ✅ Sprint 5.2: Templates de Email

**Tarefas:**
- [ ] Template: Boas-vindas
- [ ] Template: Convite
- [ ] Template: Solicitação de acesso
- [ ] Template: Aprovação/rejeição
- [ ] Template: Lembrete de trial
- [ ] Supabase Edge Function para envio

---

## ✅ CHECKLIST DE EXECUÇÃO

### 🗄️ Backend (Supabase)

#### Banco de Dados
- [ ] Criar migration `organizations`
- [ ] Criar migration `users` (atualizar)
- [ ] Criar migration `invitations`
- [ ] Criar migration `roles_permissions`
- [ ] Criar migration `audit_logs`
- [ ] Atualizar tabelas existentes (multi-tenant)
- [ ] Popular `roles_permissions` com dados padrão
- [ ] Testar RLS policies
- [ ] Criar índices de performance
- [ ] Backup automático configurado

#### Edge Functions
- [ ] Function: `send-invitation-email`
- [ ] Function: `send-welcome-email`
- [ ] Function: `generate-invite-link`
- [ ] Function: `audit-logger`
- [ ] Configurar secrets (SMTP, etc)

#### Storage
- [ ] Bucket: `avatars` (público)
- [ ] Bucket: `documents` (privado)
- [ ] RLS policies nos buckets
- [ ] Quota por organização

---

### 💻 Frontend (React)

#### Domain Layer
- [ ] `domain/entities/Organization.ts`
- [ ] `domain/entities/User.ts`
- [ ] `domain/entities/Invitation.ts`
- [ ] `domain/value-objects/Email.ts`
- [ ] `domain/value-objects/CNPJ.ts`
- [ ] `domain/value-objects/OAB.ts`
- [ ] `domain/validators/`

#### Infrastructure Layer
- [ ] `infrastructure/repositories/SupabaseOrganizationRepository.ts`
- [ ] `infrastructure/repositories/SupabaseUserRepository.ts`
- [ ] `infrastructure/repositories/SupabaseInvitationRepository.ts`
- [ ] `infrastructure/repositories/SupabaseAuditLogRepository.ts`

#### Application Layer
- [ ] Use Case: `CreateOrganizationUseCase`
- [ ] Use Case: `InviteUserUseCase`
- [ ] Use Case: `AcceptInvitationUseCase`
- [ ] Use Case: `JoinOrganizationUseCase`
- [ ] Use Case: `ChangeUserRoleUseCase`
- [ ] DTOs e Mappers

#### Presentation Layer

**Pages:**
- [ ] `/cadastro` - Cadastro de escritório
- [ ] `/equipe` - Gestão de equipe
- [ ] `/equipe/convidar` - Convidar usuário
- [ ] `/aceitar-convite/:token` - Aceitar convite
- [ ] `/entrar/:inviteToken` - Entrar via link mágico
- [ ] `/fartech/dashboard` - Dashboard Fartech
- [ ] `/fartech/escritorios` - Lista de escritórios

**Components:**
- [ ] `OrganizationForm`
- [ ] `UsersList`
- [ ] `InviteUserModal`
- [ ] `UserCard`
- [ ] `RoleSelector`
- [ ] `PermissionMatrix`
- [ ] `AuditLogViewer`
- [ ] `AccessRequestCard`

**Hooks:**
- [ ] `useOrganization` (já existe, expandir)
- [ ] `useUsers`
- [ ] `useInvitations`
- [ ] `usePermissions` (já existe, expandir)
- [ ] `useAuditLogs`

---

### 🔐 Segurança

- [ ] RLS habilitado em todas as tabelas
- [ ] Policies testadas
- [ ] Validação de permissões no frontend
- [ ] Validação de permissões no backend
- [ ] Rate limiting (Edge Functions)
- [ ] CSRF protection
- [ ] XSS protection
- [ ] SQL injection protection (via Supabase)
- [ ] Secrets management
- [ ] Encryption at rest
- [ ] Encryption in transit (HTTPS)

---

### 📊 Monitoramento

- [ ] Logs estruturados
- [ ] Error tracking (Sentry/similar)
- [ ] Performance monitoring
- [ ] Audit logs
- [ ] Alertas de segurança
- [ ] Health checks
- [ ] Uptime monitoring

---

## 🎯 PRÓXIMOS PASSOS IMEDIATOS

### Hoje (Dia 1)

1. **Criar migrations do banco**
   ```bash
   cd supabase
   supabase migration new create_organizations
   supabase migration new create_users_enhanced
   supabase migration new create_invitations
   ```

2. **Criar estrutura de Domain Layer**
   ```bash
   mkdir -p src/domain/{entities,value-objects,validators,repositories}
   ```

3. **Implementar primeira entidade**
   - `Organization.ts`
   - Testes unitários

### Amanhã (Dia 2)

1. **Aplicar migrations no Supabase**
2. **Criar primeiro Repository**
3. **Criar primeiro Use Case**
4. **Testar fluxo completo**

---

## 📞 SUPORTE E DÚVIDAS

**Documentação:**
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Multi-tenancy Guide](https://supabase.com/docs/guides/auth/multi-tenancy)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

---

**Última atualização:** 27 de janeiro de 2026  
**Status:** 📋 Pronto para implementação  
**Próxima revisão:** Após Fase 1
