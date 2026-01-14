# Plano de Implementação Multi-Tenant - SDR Jurídico

## 📋 Índice
1. [Contexto Atual](#contexto-atual)
2. [Objetivo](#objetivo)
3. [Arquitetura Multi-Tenant](#arquitetura-multi-tenant)
4. [Fase 1: Banco de Dados](#fase-1-banco-de-dados)
5. [Fase 2: Código Backend (Services)](#fase-2-código-backend-services)
6. [Fase 3: Código Frontend (UI/Contexts)](#fase-3-código-frontend-uicontexts)
7. [Fase 4: Testes e Validação](#fase-4-testes-e-validação)
8. [Checklist de Implementação](#checklist-de-implementação)

---

## Contexto Atual

### ✅ O que JÁ está pronto:
- **25 arquivos TypeScript** criados (~4200 linhas de código)
  - Contexts: `OrganizationProvider`, `PermissionsProvider`
  - Hooks: `useOrganization`, `usePermissions`, `useIsFartechAdmin`, `useIsOrgAdmin`
  - Guards: `PermissionGuard`, `FartechGuard`, `OrgAdminGuard`, `OrgActiveGuard`
  - Services: `organizationsService`, `membersService`, `permissionsService`
  - Pages: `UserManagement`, `OrgSettings`, `OrgSuspendedPage`, `OrganizationsList`, etc.

- **Estrutura do banco existente:**
  - Tabelas: `profiles`, `orgs`, `leads`, `clientes`, `casos`, `documentos`, etc. (20 tabelas)
  - Algumas tabelas JÁ têm coluna `org_id` parcialmente implementada

### ❌ O que foi DESABILITADO temporariamente:
- Filtros por `org_id` nos services (para o sistema rodar sem multi-tenant)
- Providers multi-tenant no App.tsx (removidos)
- Rotas multi-tenant no router.tsx (removidas)
- Seções admin no AppShell.tsx (removidas)
- Queries que acessavam `org_members` (tabela não existe ainda)

### 📁 Arquivos já criados:
- `SETUP_MULTITENANT_INCREMENTAL.sql` - Script SQL para adicionar multi-tenant ao banco
- `ROLLBACK_COMPLETO.sql` - Script para reverter mudanças se necessário

---

## Objetivo

Implementar sistema multi-tenant completo com **3 níveis de acesso**:

```
┌─────────────────────────────────────────┐
│  FARTECH ADMIN (Super Admin)           │
│  - Gerencia todas as organizações      │
│  - Cria novas organizações             │
│  - Visualiza estatísticas globais      │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  ORG ADMIN (Administrador da Org)       │
│  - Gerencia usuários da sua org        │
│  - Configura a organização             │
│  - Acessa todos os dados da org        │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  USER (Usuário Regular)                 │
│  - Acessa apenas dados da sua org      │
│  - Permissões limitadas por role       │
└─────────────────────────────────────────┘
```

---

## Arquitetura Multi-Tenant

### Modelo de Dados

```
profiles (usuários)
├── id (PK)
├── email
├── nome
├── org_id (FK → orgs) ⚠️ ADICIONAR
├── role (admin, gestor, advogado, etc.) ⚠️ ADICIONAR
└── is_fartech_admin (boolean) ⚠️ ADICIONAR

orgs (organizações)
├── id (PK)
├── nome
├── slug
├── cnpj
├── status (pending, active, suspended, cancelled)
└── plan (trial, basic, professional, enterprise)

org_members (membros das organizações) ⚠️ CRIAR
├── id (PK)
├── org_id (FK → orgs)
├── user_id (FK → profiles)
├── role (admin, gestor, advogado, etc.)
└── ativo (boolean)

Todas as tabelas de dados (leads, clientes, casos, etc.)
└── org_id (FK → orgs) ⚠️ ADICIONAR em algumas
```

### Row Level Security (RLS)

Cada tabela terá políticas RLS:
1. **Fartech Admins** → veem TUDO
2. **Org Admins** → veem tudo da SUA organização
3. **Users** → veem apenas dados da SUA organização

---

## Fase 1: Banco de Dados

### 1.1 Executar SQL de Setup Multi-Tenant

**Responsável:** Backend/DBA  
**Arquivo:** `SETUP_MULTITENANT_INCREMENTAL.sql`  
**Tempo estimado:** 30 minutos

**Passos:**
1. Abrir Supabase Dashboard → SQL Editor
2. Colar conteúdo do arquivo `SETUP_MULTITENANT_INCREMENTAL.sql`
3. Executar SQL
4. Verificar logs de execução

**O que o SQL faz:**

```sql
-- Parte 1: Adiciona colunas em profiles
ALTER TABLE profiles ADD COLUMN org_id UUID;
ALTER TABLE profiles ADD COLUMN role VARCHAR(50);
ALTER TABLE profiles ADD COLUMN is_fartech_admin BOOLEAN;

-- Parte 2: Adiciona org_id em outras tabelas
ALTER TABLE leads ADD COLUMN org_id UUID;
ALTER TABLE clientes ADD COLUMN org_id UUID;
ALTER TABLE casos ADD COLUMN org_id UUID;
ALTER TABLE documentos ADD COLUMN org_id UUID;

-- Partes 3-8: Configura RLS em todas as tabelas
-- 18 políticas RLS no total

-- Parte 9: Cria organização de teste
INSERT INTO orgs (id, nome, slug) 
VALUES ('c1e7b3a0-0000-0000-0000-000000000001', 'Demo Organization', 'demo');
```

**Verificação:**
```sql
-- Verificar colunas adicionadas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('org_id', 'role', 'is_fartech_admin');

-- Verificar RLS habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'orgs', 'leads', 'clientes', 'casos', 'documentos');
```

### 1.2 Criar Tabela org_members

**Responsável:** Backend/DBA  
**Tempo estimado:** 15 minutos

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(org_id, user_id)
);

CREATE INDEX idx_org_members_org_id ON org_members(org_id);
CREATE INDEX idx_org_members_user_id ON org_members(user_id);
CREATE INDEX idx_org_members_ativo ON org_members(ativo);

-- RLS para org_members
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;

-- Fartech admins veem todos os membros
CREATE POLICY "fartech_admin_all_members"
  ON org_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_fartech_admin = true
    )
  );

-- Org admins veem membros da sua org
CREATE POLICY "org_admin_own_org_members"
  ON org_members FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Usuários veem membros da mesma org (somente leitura)
CREATE POLICY "users_same_org_members"
  ON org_members FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM profiles
      WHERE id = auth.uid()
    )
  );
```

### 1.3 Criar Usuários de Teste

**Responsável:** Backend/DBA  
**Tempo estimado:** 15 minutos

**Passos:**

1. **Criar usuário Fartech Admin:**
```
Supabase Dashboard → Authentication → Users → Create User
Email: admin@fartech.com.br
Password: Fartech@2024
```

Depois executar:
```sql
UPDATE profiles 
SET is_fartech_admin = true, role = 'admin'
WHERE email = 'admin@fartech.com.br';
```

2. **Criar usuário Org Admin:**
```
Email: gestor@demo.local
Password: Demo@2024
```

Depois executar:
```sql
UPDATE profiles 
SET 
  org_id = 'c1e7b3a0-0000-0000-0000-000000000001',
  role = 'admin',
  is_fartech_admin = false
WHERE email = 'gestor@demo.local';

-- Adicionar em org_members
INSERT INTO org_members (org_id, user_id, role, ativo)
SELECT 
  'c1e7b3a0-0000-0000-0000-000000000001'::uuid,
  id,
  'admin',
  true
FROM profiles
WHERE email = 'gestor@demo.local';
```

3. **Criar usuário regular:**
```
Email: user@demo.local
Password: Demo@2024
```

Depois executar:
```sql
UPDATE profiles 
SET 
  org_id = 'c1e7b3a0-0000-0000-0000-000000000001',
  role = 'advogado',
  is_fartech_admin = false
WHERE email = 'user@demo.local';

INSERT INTO org_members (org_id, user_id, role, ativo)
SELECT 
  'c1e7b3a0-0000-0000-0000-000000000001'::uuid,
  id,
  'advogado',
  true
FROM profiles
WHERE email = 'user@demo.local';
```

---

## Fase 2: Código Backend (Services)

### 2.1 Restaurar org.ts

**Responsável:** Backend Developer  
**Arquivo:** `src/lib/org.ts`  
**Tempo estimado:** 15 minutos

**Mudar de:**
```typescript
export async function getActiveOrgId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return null // ❌ Temporário
}
```

**Para:**
```typescript
export async function getActiveOrgId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Verificar se é Fartech Admin (não tem org específica)
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_fartech_admin, org_id')
    .eq('id', user.id)
    .single()
  
  if (profile?.is_fartech_admin) return null // Fartech admins não têm org_id
  if (profile?.org_id) return profile.org_id

  // Fallback: buscar em org_members
  const { data, error } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .eq('ativo', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) throw new AppError(error.message, 'database_error')
  return data?.org_id ?? null
}
```

### 2.2 Restaurar Filtros por org_id nos Services

**Responsável:** Backend Developer  
**Arquivos:** 
- `src/services/integrationsService.ts`
- `src/services/leadsService.ts`
- `src/services/clientesService.ts`
- `src/services/casosService.ts`
- etc.

**Tempo estimado:** 1-2 horas

**Padrão a seguir:**

```typescript
// ANTES (atual - sem filtro)
async getLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
  
  if (error) throw error
  return data || []
}

// DEPOIS (com filtro multi-tenant)
async getLeads(): Promise<Lead[]> {
  const orgId = await getActiveOrgId()
  
  let query = supabase.from('leads').select('*')
  
  // Se não é Fartech Admin, filtrar por org_id
  if (orgId) {
    query = query.eq('org_id', orgId)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  return data || []
}

// Para CREATE
async createLead(input: CreateLeadInput): Promise<Lead> {
  const orgId = await requireOrgId() // Obrigatório para criar
  
  const { data, error } = await supabase
    .from('leads')
    .insert({
      ...input,
      org_id: orgId // ✅ Sempre incluir org_id
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}
```

**Lista de services a atualizar:**
- [ ] `integrationsService.ts` (8 funções)
- [ ] `leadsService.ts` (5 funções)
- [ ] `clientesService.ts` (6 funções)
- [ ] `casosService.ts` (8 funções)
- [ ] `documentosService.ts` (7 funções)
- [ ] `agendaService.ts` (6 funções)
- [ ] `notasService.ts` (4 funções)

### 2.3 Restaurar useCurrentUser Hook

**Responsável:** Backend Developer  
**Arquivo:** `src/hooks/useCurrentUser.ts`  
**Tempo estimado:** 30 minutos

**Mudar de:**
```typescript
const load = async () => {
  const profileResult = await supabase
    .from('profiles')
    .select('user_id, created_at, nome, email, telefone, avatar_url, metadata')
    .eq('user_id', user.id)
    .limit(1)

  setProfile((profileResult.data?.[0] as ProfileRow) || null)
  setMember(null) // ❌ Temporário
  setLoading(false)
}
```

**Para:**
```typescript
const load = async () => {
  const [profileResult, memberResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, user_id, nome, email, telefone, avatar_url, metadata, org_id, role, is_fartech_admin')
      .eq('user_id', user.id)
      .limit(1),
    supabase
      .from('org_members')
      .select('id, created_at, org_id, user_id, role, ativo, org:orgs(nome)')
      .eq('user_id', user.id)
      .eq('ativo', true)
      .order('created_at', { ascending: true })
      .limit(1)
  ])

  if (!active) return

  if (profileResult.error || memberResult.error) {
    const message =
      profileResult.error?.message ||
      memberResult.error?.message ||
      'Erro ao carregar dados do usuario'
    setError(new Error(message))
  }

  const profile = profileResult.data?.[0] as ProfileRow | undefined
  setProfile(profile || null)

  const memberData = memberResult.data?.[0]
  if (memberData) {
    if (Array.isArray(memberData.org) && memberData.org.length > 0) {
      setMember({ ...memberData, org: memberData.org[0] } as MemberWithOrg)
    } else {
      setMember({ ...memberData, org: null } as MemberWithOrg)
    }
  } else {
    setMember(null)
  }

  setLoading(false)
}
```

---

## Fase 3: Código Frontend (UI/Contexts)

### 3.1 Reintegrar Providers no App.tsx

**Responsável:** Frontend Developer  
**Arquivo:** `src/App.tsx`  
**Tempo estimado:** 15 minutos

**Adicionar:**
```typescript
import { OrganizationProvider } from '@/contexts/OrganizationContext'
import { PermissionsProvider } from '@/contexts/PermissionsContext'

function App() {
  return (
    <AuthProvider>
      <OrganizationProvider>
        <PermissionsProvider>
          <ThemeProvider>
            {/* resto da aplicação */}
          </ThemeProvider>
        </PermissionsProvider>
      </OrganizationProvider>
    </AuthProvider>
  )
}
```

### 3.2 Adicionar Rotas Multi-Tenant no Router

**Responsável:** Frontend Developer  
**Arquivo:** `src/app/router.tsx`  
**Tempo estimado:** 30 minutos

**Adicionar rotas:**
```typescript
{
  path: '/app',
  element: (
    <ProtectedRoute>
      <OrgActiveGuard> {/* ✅ Guard para org ativa */}
        <AppShell />
      </OrgActiveGuard>
    </ProtectedRoute>
  ),
  children: [
    // ... rotas existentes ...
    
    // ✅ Rotas de administração da organização
    {
      path: 'users',
      element: (
        <OrgAdminGuard>
          <UserManagement />
        </OrgAdminGuard>
      ),
    },
    {
      path: 'settings',
      element: (
        <OrgAdminGuard>
          <OrgSettings />
        </OrgAdminGuard>
      ),
    },
  ],
},

// ✅ Rotas Fartech Admin
{
  path: '/fartech',
  element: (
    <ProtectedRoute>
      <FartechGuard>
        <AppShell />
      </FartechGuard>
    </ProtectedRoute>
  ),
  children: [
    {
      index: true,
      element: <Navigate to="organizations" replace />,
    },
    {
      path: 'organizations',
      element: <OrganizationsList />,
    },
    {
      path: 'organizations/new',
      element: <OrganizationForm />,
    },
    {
      path: 'organizations/:id',
      element: <OrganizationDetails />,
    },
    {
      path: 'organizations/:id/edit',
      element: <OrganizationForm />,
    },
  ],
},

// ✅ Página de organização suspensa
{
  path: '/org-suspended',
  element: (
    <ProtectedRoute>
      <OrgSuspendedPage />
    </ProtectedRoute>
  ),
},
```

### 3.3 Adicionar Seções Admin no AppShell

**Responsável:** Frontend Developer  
**Arquivo:** `src/layouts/AppShell.tsx`  
**Tempo estimado:** 45 minutos

**No início do componente, adicionar:**
```typescript
const location = useLocation()
const { currentOrg } = useOrganization()
const { isFartechAdmin, isOrgAdmin } = usePermissions()

const isFartechRoute = location.pathname.startsWith('/fartech')
```

**No navItems, adicionar condicionalmente:**
```typescript
const navItems = [
  { label: 'Dashboard', to: '/app/dashboard', icon: LayoutDashboard },
  { label: 'Leads', to: '/app/leads', icon: Users },
  // ... outros itens ...
]

// ✅ Adicionar itens de admin se for Org Admin
const orgAdminItems = isOrgAdmin && !isFartechRoute ? [
  { label: 'Usuários', to: '/app/users', icon: Users },
  { label: 'Configurações Org', to: '/app/settings', icon: Settings },
] : []

// ✅ Adicionar itens Fartech se for Fartech Admin
const fartechItems = isFartechAdmin && isFartechRoute ? [
  { label: 'Organizações', to: '/fartech/organizations', icon: Building2 },
  { label: 'Estatísticas', to: '/fartech/stats', icon: BarChart3 },
] : []

const allNavItems = [...navItems, ...orgAdminItems, ...fartechItems]
```

**No header, mostrar org name:**
```typescript
<div>
  <p className="text-xs text-text-subtle">Bom dia</p>
  <p className="text-sm font-semibold text-text">
    {currentOrg?.nome || displayName}
  </p>
</div>
```

**Adicionar badge Fartech Admin:**
```typescript
{isFartechAdmin && (
  <Badge variant="primary" className="ml-2">
    Fartech Admin
  </Badge>
)}
```

### 3.4 Atualizar Types/Interfaces

**Responsável:** Frontend Developer  
**Arquivos:** `src/types/organization.ts`, `src/lib/supabaseClient.ts`  
**Tempo estimado:** 30 minutos

**Verificar/adicionar tipos:**
```typescript
// src/types/organization.ts
export type OrganizationStatus = 'pending' | 'active' | 'suspended' | 'cancelled'
export type OrganizationPlan = 'trial' | 'basic' | 'professional' | 'enterprise'
export type UserRole = 'admin' | 'gestor' | 'advogado' | 'secretaria' | 'leitura'

export interface Organization {
  id: string
  nome: string
  slug: string
  cnpj?: string | null
  email: string
  phone?: string | null
  status: OrganizationStatus
  plan: OrganizationPlan
  max_users: number
  max_storage_gb: number
  max_cases?: number | null
  logo_url?: string | null
  created_at: string
  updated_at: string
}

export interface OrgMember {
  id: string
  org_id: string
  user_id: string
  role: UserRole
  ativo: boolean
  created_at: string
}
```

---

## Fase 4: Testes e Validação

### 4.1 Testes de Banco de Dados

**Responsável:** QA/Backend  
**Tempo estimado:** 1 hora

**Checklist:**
- [ ] RLS habilitado em todas as tabelas
- [ ] Fartech Admin consegue ver dados de todas as orgs
- [ ] Org Admin vê apenas dados da sua org
- [ ] User vê apenas dados da sua org
- [ ] Não consegue acessar dados de outra org via SQL direto

**Queries de teste:**
```sql
-- Logar como user@demo.local
SET request.jwt.claim.sub = '(user_id do user@demo.local)';

-- Tentar acessar leads de outra org (deve retornar vazio)
SELECT * FROM leads WHERE org_id != 'c1e7b3a0-0000-0000-0000-000000000001';

-- Ver apenas leads da própria org (deve retornar dados)
SELECT * FROM leads WHERE org_id = 'c1e7b3a0-0000-0000-0000-000000000001';
```

### 4.2 Testes de Funcionalidade

**Responsável:** QA/Frontend  
**Tempo estimado:** 2-3 horas

**Cenários de teste:**

**1. Login como Fartech Admin (admin@fartech.com.br)**
- [ ] Vê menu "Fartech" no sidebar
- [ ] Acessa /fartech/organizations
- [ ] Vê lista de TODAS as organizações
- [ ] Consegue criar nova organização
- [ ] Consegue editar qualquer organização
- [ ] Consegue suspender/ativar organizações
- [ ] Vê estatísticas globais

**2. Login como Org Admin (gestor@demo.local)**
- [ ] Vê menu "Usuários" e "Configurações Org"
- [ ] Não vê menu "Fartech"
- [ ] Acessa /app/users
- [ ] Vê apenas usuários da sua org
- [ ] Consegue convidar novos usuários
- [ ] Consegue editar roles dos usuários
- [ ] Acessa /app/settings
- [ ] Consegue editar dados da organização
- [ ] Dashboard mostra apenas dados da sua org

**3. Login como User (user@demo.local)**
- [ ] Não vê menu "Usuários" nem "Fartech"
- [ ] Tenta acessar /app/users → redireciona ou mostra "Sem permissão"
- [ ] Dashboard mostra apenas dados da sua org
- [ ] Consegue criar leads/clientes/casos da sua org
- [ ] Não vê dados de outras organizações

**4. Isolamento de Dados**
- [ ] Criar 2ª organização
- [ ] Criar usuário na 2ª org
- [ ] Logar com usuário da 2ª org
- [ ] Verificar que não vê dados da 1ª org
- [ ] Criar lead na 2ª org
- [ ] Logar com usuário da 1ª org
- [ ] Verificar que não vê o lead da 2ª org

### 4.3 Testes de Performance

**Responsável:** QA/Backend  
**Tempo estimado:** 1 hora

**Checklist:**
- [ ] Queries com filtro org_id são rápidas (< 100ms)
- [ ] Índices criados corretamente (verificar EXPLAIN)
- [ ] RLS não causa lentidão significativa
- [ ] Login e troca de contexto são rápidos

---

## Checklist de Implementação

### 🗄️ Banco de Dados
- [ ] Executar `SETUP_MULTITENANT_INCREMENTAL.sql`
- [ ] Criar tabela `org_members` com RLS
- [ ] Criar 3 usuários de teste (Fartech Admin, Org Admin, User)
- [ ] Verificar todas as colunas `org_id` adicionadas
- [ ] Verificar todos os índices criados
- [ ] Testar políticas RLS manualmente

### 🔧 Backend (Services)
- [ ] Restaurar `org.ts` com lógica completa
- [ ] Atualizar `integrationsService.ts` com filtros org_id
- [ ] Atualizar `leadsService.ts` com filtros org_id
- [ ] Atualizar `clientesService.ts` com filtros org_id
- [ ] Atualizar `casosService.ts` com filtros org_id
- [ ] Atualizar `documentosService.ts` com filtros org_id
- [ ] Atualizar `agendaService.ts` com filtros org_id
- [ ] Atualizar `notasService.ts` com filtros org_id
- [ ] Restaurar `useCurrentUser` com query org_members
- [ ] Testar todos os services isoladamente

### 🎨 Frontend (UI)
- [ ] Adicionar providers no `App.tsx`
- [ ] Adicionar rotas multi-tenant no `router.tsx`
- [ ] Atualizar `AppShell.tsx` com menus admin
- [ ] Adicionar Guards nas rotas
- [ ] Mostrar nome da org no header
- [ ] Adicionar badge "Fartech Admin"
- [ ] Testar navegação entre rotas
- [ ] Testar guards (acessar rota sem permissão)

### 📄 Pages/Components
- [ ] Testar `UserManagement` page
- [ ] Testar `OrgSettings` page
- [ ] Testar `OrganizationsList` page (Fartech)
- [ ] Testar `OrganizationForm` page (Fartech)
- [ ] Testar `OrganizationDetails` page (Fartech)
- [ ] Testar `OrgSuspendedPage`
- [ ] Verificar todos os Guards funcionando

### ✅ Testes Finais
- [ ] Teste completo como Fartech Admin
- [ ] Teste completo como Org Admin
- [ ] Teste completo como User
- [ ] Teste de isolamento de dados
- [ ] Teste de performance
- [ ] Teste de segurança (tentar acessar dados de outra org)
- [ ] Deploy em ambiente de staging
- [ ] Validação final com equipe

---

## 📝 Notas Importantes

### ⚠️ Atenção ao Implementar

1. **SEMPRE adicionar org_id ao criar registros:**
   ```typescript
   const orgId = await requireOrgId()
   await supabase.from('leads').insert({ ...data, org_id: orgId })
   ```

2. **Fartech Admins não têm org_id:**
   ```typescript
   const orgId = await getActiveOrgId()
   if (orgId) {
     query = query.eq('org_id', orgId) // Filtra por org
   }
   // Se null (Fartech Admin), vê tudo
   ```

3. **Testar RLS SEMPRE após mudanças no banco:**
   ```sql
   SET request.jwt.claim.sub = '(user_id)';
   SELECT * FROM leads; -- Deve retornar apenas da org do usuário
   ```

4. **Migração de dados existentes:**
   ```sql
   -- Se já existem dados sem org_id, associar a uma org padrão:
   UPDATE leads SET org_id = 'c1e7b3a0-0000-0000-0000-000000000001' 
   WHERE org_id IS NULL;
   ```

### 🚀 Ordem de Implementação Recomendada

1. **Dia 1:** Banco de Dados (Fase 1)
2. **Dia 2:** Backend Services (Fase 2)
3. **Dia 3:** Frontend UI (Fase 3)
4. **Dia 4:** Testes e Ajustes (Fase 4)
5. **Dia 5:** Deploy e Monitoramento

### 📞 Contatos da Equipe

- **Backend Lead:** _____________
- **Frontend Lead:** _____________
- **QA Lead:** _____________
- **DevOps:** _____________

---

## 🎯 Meta Final

Sistema SDR Jurídico funcionando com:
- ✅ Multi-tenancy completo
- ✅ 3 níveis de acesso
- ✅ Isolamento total de dados
- ✅ RLS configurado
- ✅ Interface admin Fartech
- ✅ Gestão de usuários por org
- ✅ Tudo testado e validado

**Bom trabalho, equipe! 🚀**
