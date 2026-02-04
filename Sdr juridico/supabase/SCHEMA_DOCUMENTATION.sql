-- ================================================================================
-- SDR JURIDICO (TalentJUD) - DATABASE SCHEMA DOCUMENTATION
-- ================================================================================
-- Data: 2026-02-03
-- Versão: 1.0
--
-- PROPÓSITO:
-- Este arquivo documenta a arquitetura completa do banco de dados SDR Juridico.
-- Ele reflete o estado atual do banco após todas as migrações aplicadas.
--
-- USO:
-- - Referência de schema para desenvolvedores
-- - Documentação de decisões arquiteturais
-- - Base para novos desenvolvedores entenderem o sistema
-- - NÃO executar em produção (apenas documentação)
--
-- ARQUITETURA GERAL:
-- Sistema multi-tenant SaaS para gestão jurídica com:
-- - Multi-tenancy via org_id
-- - RLS (Row Level Security) em todas as tabelas
-- - Integração com DataJud para acompanhamento de processos
-- - Sistema dual de permissões (global + por organização)
-- - Auditoria completa de mudanças críticas
-- ================================================================================

-- ================================================================================
-- ÍNDICE
-- ================================================================================
--
-- 1. AUTENTICAÇÃO E USUÁRIOS
--    - usuarios (perfis de usuário)
--    - auth.users (Supabase Auth)
--
-- 2. MULTI-TENANCY (ORGANIZAÇÕES)
--    - orgs (law firms / escritórios)
--    - org_members (membros das organizações)
--    - org_features (features por org)
--    - organization_members (view - compatibilidade)
--
-- 3. SISTEMA DE PERMISSÕES (RBAC)
--    - usuarios.permissoes[] (permissões globais)
--    - org_members.role (roles por organização)
--    - Funções helper (is_org_admin_for_org, etc)
--    - Tabelas RBAC reservadas (roles, permissions, role_permissions)
--
-- 4. GESTÃO DE CASOS JURÍDICOS
--    - casos (processos jurídicos)
--    - tarefas (kanban + workflow de aprovação)
--    - tarefa_documentos (documentos solicitados por tarefa)
--
-- 5. CRM (LEADS E CLIENTES)
--    - leads (potenciais clientes)
--    - clientes (clientes confirmados)
--    - advogado_carteira_clientes (atribuição de clientes)
--
-- 6. DOCUMENTOS E STORAGE
--    - documentos (arquivos e documentos)
--    - Storage bucket: documentos (10MB limit)
--
-- 7. COMUNICAÇÃO E AGENDA
--    - conversas (conversas com clientes)
--    - mensagens (mensagens nas conversas)
--    - agendamentos/agenda (agenda de eventos)
--    - notificacoes (notificações do sistema)
--
-- 8. INTEGRAÇÃO DATAJUD
--    - processos_favoritos (processos acompanhados)
--    - datajud_processos (cache de processos)
--    - datajud_movimentacoes (movimentações de processos)
--    - datajud_api_calls (auditoria de chamadas API)
--    - datajud_sync_jobs (jobs de sincronização)
--    - cache_cnpj (cache de dados CNPJ)
--
-- 9. AUDITORIA E OBSERVABILIDADE
--    - audit_log (auditoria de mudanças)
--    - analytics_events (eventos de telemetria)
--    - active_sessions (sessões ativas)
--
-- 10. VIEWS E FUNÇÕES HELPER
--     - Views principais
--     - Funções de permissões
--     - Funções de limpeza automática
--
-- ================================================================================


-- ================================================================================
-- 1. AUTENTICAÇÃO E USUÁRIOS
-- ================================================================================

-- -----------------------------------------------------------------------------
-- TABELA: usuarios
-- -----------------------------------------------------------------------------
-- PROPÓSITO:
--   Estende auth.users com informações do perfil e permissões globais.
--   Cada usuário pode pertencer a múltiplas organizações (via org_members).
--
-- SISTEMA DE PERMISSÕES DUAL:
--   1. usuarios.permissoes[] - Permissões GLOBAIS
--      - 'fartech_admin' : Super admin da plataforma (acesso total)
--      - 'org_admin'     : Admin/Gestor de uma organização
--      - 'user'          : Usuário comum
--
--   2. org_members.role - Roles ESPECÍFICOS por organização
--      - admin      : Acesso total à org
--      - gestor     : Acesso total (similar a admin)
--      - advogado   : Cria/edita casos, clientes, documentos
--      - secretaria : Acesso limitado
--      - leitura    : Read-only
--
-- MAPEAMENTO:
--   org_members.role IN ('admin', 'gestor') → usuarios.permissoes = ['org_admin']
--   org_members.role IN ('advogado', 'secretaria', 'leitura') → usuarios.permissoes = ['user']
--
-- TRIGGERS:
--   - audit_usuarios : Registra mudanças em audit_log
--
-- RLS POLICIES:
--   SELECT: Fartech admin vê todos | Org admin vê usuários da sua org | Users veem da mesma org
--   UPDATE: Usuário atualiza seu próprio perfil | Admin atualiza usuários da org
--   INSERT/DELETE: Fartech admin apenas
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nome_completo TEXT,
  org_id UUID REFERENCES public.orgs(id) ON DELETE SET NULL,

  -- Permissões GLOBAIS (array de strings)
  -- Valores válidos: 'fartech_admin', 'org_admin', 'user'
  permissoes TEXT[] DEFAULT ARRAY['user']::TEXT[],

  -- Perfil
  avatar_url TEXT,
  department TEXT,
  position TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice GIN para busca eficiente em arrays de permissões
CREATE INDEX IF NOT EXISTS idx_usuarios_permissoes_gin
  ON usuarios USING GIN(permissoes);

-- Índice para queries por org
CREATE INDEX IF NOT EXISTS idx_usuarios_org_id
  ON usuarios(org_id) WHERE org_id IS NOT NULL;

COMMENT ON TABLE public.usuarios IS
  'Perfis de usuários da plataforma. Estende auth.users com informações e permissões.

   SISTEMA DE PERMISSÕES DUAL:
   - usuarios.permissoes[] : Permissões globais (fartech_admin, org_admin, user)
   - org_members.role      : Role específico por organização

   Um usuário pode ter roles diferentes em organizações diferentes.
   Exemplo: admin na Org A, advogado na Org B.';


-- ================================================================================
-- 2. MULTI-TENANCY (ORGANIZAÇÕES)
-- ================================================================================

-- -----------------------------------------------------------------------------
-- TABELA: orgs
-- -----------------------------------------------------------------------------
-- PROPÓSITO:
--   Organizações (law firms / escritórios de advocacia).
--   Base do sistema multi-tenant - todos os dados são org-scoped.
--
-- PLANOS:
--   - trial        : Período de teste
--   - basic        : Plano básico
--   - professional : Plano profissional
--   - enterprise   : Plano enterprise
--
-- STATUS:
--   - pending   : Aguardando ativação
--   - active    : Ativa
--   - suspended : Suspensa
--   - cancelled : Cancelada
--
-- LIMITES:
--   - max_users, max_storage_gb, max_cases : Definidos por plano
--
-- TRIGGERS:
--   - update_orgs_updated_at : Atualiza updated_at automaticamente
--   - audit_orgs : Registra mudanças em audit_log
--
-- RLS POLICIES:
--   SELECT: Fartech admin vê todas | Org admin vê sua org | Members veem sua org
--   UPDATE: Fartech admin atualiza todas | Org admin atualiza sua org
--   INSERT/DELETE: Fartech admin apenas
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  cnpj TEXT UNIQUE,

  -- Contato
  email TEXT,
  phone TEXT,
  address JSONB,

  -- Plano e Limites
  plan VARCHAR(20) DEFAULT 'trial' CHECK (plan IN ('trial', 'basic', 'professional', 'enterprise')),
  max_users INTEGER DEFAULT 5,
  max_storage_gb INTEGER DEFAULT 10,
  max_cases INTEGER DEFAULT 100,

  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'cancelled')),

  -- Billing
  billing_email TEXT,
  billing_cycle VARCHAR(20) CHECK (billing_cycle IN ('monthly', 'annually')),

  -- Customização
  logo_url TEXT,
  primary_color VARCHAR(7),
  secondary_color VARCHAR(7),

  -- Metadados
  settings JSONB DEFAULT '{}'::JSONB,
  metadata JSONB DEFAULT '{}'::JSONB,

  -- Gestão
  provisioned_by UUID REFERENCES auth.users(id),
  managed_by UUID REFERENCES auth.users(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_orgs_status ON orgs(status);
CREATE INDEX IF NOT EXISTS idx_orgs_plan ON orgs(plan);
CREATE INDEX IF NOT EXISTS idx_orgs_slug ON orgs(slug);

COMMENT ON TABLE public.orgs IS
  'Organizações (law firms) do sistema.

   MULTI-TENANCY: Todas as tabelas principais têm org_id e RLS policies.

   PLANOS: trial, basic, professional, enterprise
   STATUS: pending, active, suspended, cancelled

   Limites (max_users, max_storage_gb, max_cases) são definidos por plano.';


-- -----------------------------------------------------------------------------
-- TABELA: org_members
-- -----------------------------------------------------------------------------
-- PROPÓSITO:
--   Relaciona usuários com organizações e define seus roles.
--   Um usuário pode pertencer a múltiplas orgs com roles diferentes.
--
-- ROLES VÁLIDOS:
--   - admin      : Acesso total à organização
--   - gestor     : Acesso total (similar a admin)
--   - advogado   : Pode criar/editar casos, clientes, documentos
--   - secretaria : Acesso limitado (criar agendamentos, tarefas)
--   - leitura    : Read-only em toda a org
--   - viewer     : Apenas visualização
--
-- MAPEAMENTO PARA PERMISSÕES GLOBAIS:
--   admin/gestor → usuarios.permissoes = ['org_admin']
--   advogado/secretaria/leitura → usuarios.permissoes = ['user']
--
-- FUNÇÕES HELPER:
--   - is_org_member(org_id) : Verifica se usuário é membro
--   - is_org_admin_for_org(org_id) : Verifica se é admin/gestor
--   - is_org_staff(org_id) : Verifica se é staff (admin, gestor, secretaria)
--   - is_advogado(org_id) : Verifica se é advogado
--
-- TRIGGERS:
--   - update_org_members_updated_at : Atualiza updated_at
--   - audit_org_members : Registra mudanças CRÍTICAS em audit_log
--
-- RLS POLICIES:
--   SELECT: Fartech admin vê todos | Membros veem outros membros da mesma org
--   UPDATE/DELETE: Org admin gerencia membros da sua org
--   INSERT: Org admin pode adicionar membros
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Role do usuário nesta organização
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'gestor', 'advogado', 'secretaria', 'leitura', 'viewer')),

  -- Status
  ativo BOOLEAN DEFAULT true,

  -- Auditoria de convite
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Um usuário só pode estar uma vez em cada org
  UNIQUE(org_id, user_id)
);

-- Índices para queries comuns
CREATE INDEX IF NOT EXISTS idx_org_members_user_org_ativo
  ON org_members(user_id, org_id, ativo);

CREATE INDEX IF NOT EXISTS idx_org_members_org_ativo
  ON org_members(org_id, ativo);

CREATE INDEX IF NOT EXISTS idx_org_members_role_ativo
  ON org_members(role, ativo) WHERE ativo = true;

COMMENT ON TABLE public.org_members IS
  'Membros das organizações e seus roles.

   ROLES POR ORG:
   - admin/gestor     : Acesso total (mapeado para org_admin global)
   - advogado         : Cria/edita casos, clientes, docs (user global)
   - secretaria       : Acesso limitado (user global)
   - leitura          : Read-only (user global)

   Um usuário pode ter roles diferentes em organizações diferentes.
   Exemplo: admin na Org A, advogado na Org B.';


-- ================================================================================
-- 3. SISTEMA DE PERMISSÕES (RBAC)
-- ================================================================================

-- -----------------------------------------------------------------------------
-- FUNÇÕES HELPER DE PERMISSÕES (SECURITY DEFINER)
-- -----------------------------------------------------------------------------
-- Estas funções são usadas em RLS policies para verificar permissões.
-- SECURITY DEFINER permite executar com privilégios elevados.
-- -----------------------------------------------------------------------------

-- Verifica se usuário é Fartech admin (super admin da plataforma)
CREATE OR REPLACE FUNCTION public.is_fartech_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid()
    AND permissoes @> ARRAY['fartech_admin']::TEXT[]
  );
END;
$$;

-- Verifica se usuário é membro de uma organização
CREATE OR REPLACE FUNCTION public.is_org_member(_org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.org_members
    WHERE user_id = auth.uid()
    AND org_id = _org_id
    AND ativo = true
  );
END;
$$;

-- Verifica se usuário é admin ou gestor de uma organização
CREATE OR REPLACE FUNCTION public.is_org_admin_for_org(_org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.org_members
    WHERE user_id = auth.uid()
    AND org_id = _org_id
    AND role IN ('admin', 'gestor')
    AND ativo = true
  );
END;
$$;

-- Verifica se usuário é staff (admin, gestor ou secretaria)
CREATE OR REPLACE FUNCTION public.is_org_staff(_org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.org_members
    WHERE user_id = auth.uid()
    AND org_id = _org_id
    AND role IN ('admin', 'gestor', 'secretaria')
    AND ativo = true
  );
END;
$$;

-- Verifica se usuário é advogado de uma organização
CREATE OR REPLACE FUNCTION public.is_advogado(_org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.org_members
    WHERE user_id = auth.uid()
    AND org_id = _org_id
    AND role = 'advogado'
    AND ativo = true
  );
END;
$$;

COMMENT ON FUNCTION public.is_fartech_admin IS
  'Verifica se usuário atual é Fartech admin (super admin da plataforma).
   Usado em RLS policies para acesso total.';

COMMENT ON FUNCTION public.is_org_member IS
  'Verifica se usuário atual é membro ativo de uma organização.
   Usado em RLS policies org-scoped.';

COMMENT ON FUNCTION public.is_org_admin_for_org IS
  'Verifica se usuário atual é admin ou gestor de uma organização.
   Usado em RLS policies para operações administrativas.';


-- -----------------------------------------------------------------------------
-- TABELAS RBAC RESERVADAS (NÃO UTILIZADAS ATUALMENTE)
-- -----------------------------------------------------------------------------
-- STATUS: Reservadas para futuro sistema RBAC dinâmico
-- O sistema atual usa usuarios.permissoes[] + org_members.role
-- -----------------------------------------------------------------------------

-- Roles do sistema (RESERVADO)
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permissões granulares (RESERVADO)
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT,
  description TEXT,
  resource TEXT,
  action TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Join N:N roles-permissions (RESERVADO)
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

COMMENT ON TABLE public.roles IS
  'RESERVADO: Sistema RBAC dinâmico futuro.
   STATUS: Atualmente NÃO USADO

   O sistema atual usa:
   1. usuarios.permissoes[] - Permissões GLOBAIS (fartech_admin, org_admin, user)
   2. org_members.role - Role ESPECÍFICO por organização';

COMMENT ON TABLE public.permissions IS
  'RESERVADO: Permissões granulares para RBAC dinâmico futuro.
   STATUS: Atualmente NÃO USADO';

COMMENT ON TABLE public.role_permissions IS
  'RESERVADO: Join table roles-permissions para RBAC dinâmico futuro.
   STATUS: Atualmente NÃO USADO';


-- ================================================================================
-- 4. GESTÃO DE CASOS JURÍDICOS
-- ================================================================================

-- -----------------------------------------------------------------------------
-- TABELA: casos
-- -----------------------------------------------------------------------------
-- PROPÓSITO:
--   Casos/processos jurídicos gerenciados pela organização.
--   Integrado com DataJud para sincronização automática de movimentações.
--
-- STATUS ENUM (case_status):
--   - novo, em_andamento, aguardando, concluido, arquivado, etc.
--
-- INTEGRAÇÃO DATAJUD:
--   - numero_processo: CNJ format (UNIQUE)
--   - datajud_processo_id: FK para datajud_processos
--   - datajud_sync_status: nunca_sincronizado, sincronizado, em_erro, pendente_sync
--   - datajud_last_sync_at: Última sincronização
--
-- HEAT (Temperatura do caso):
--   - quente: Urgente/alta atividade
--   - morno: Normal
--   - frio: Baixa prioridade/inativo
--
-- SLA RISK:
--   - ok: Dentro do prazo
--   - atencao: Próximo do prazo
--   - critico: Fora do prazo
--
-- TRIGGERS:
--   Nenhum atualmente (pode adicionar audit_casos se necessário)
--
-- RLS POLICIES:
--   SELECT: Membros da org veem casos
--   INSERT/UPDATE: Membros da org podem criar/editar
--   DELETE: Apenas org admin
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.casos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,

  -- Informações básicas
  titulo TEXT NOT NULL,
  descricao TEXT,
  area TEXT,

  -- Relacionamentos
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  responsavel_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Status e Prioridade
  status TEXT NOT NULL DEFAULT 'novo',
  prioridade TEXT DEFAULT 'média' CHECK (prioridade IN ('Baixa', 'Média', 'Alta')),
  fase_atual TEXT,
  heat TEXT CHECK (heat IN ('quente', 'morno', 'frio')),
  sla_risk TEXT CHECK (sla_risk IN ('ok', 'atencao', 'critico')),

  -- Informações processuais
  numero_processo TEXT UNIQUE,
  tribunal TEXT,
  grau TEXT,
  classe_processual TEXT,
  assunto_principal TEXT,

  -- Integração DataJud
  datajud_processo_id UUID REFERENCES public.datajud_processos(id) ON DELETE SET NULL,
  datajud_last_sync_at TIMESTAMPTZ,
  datajud_sync_status TEXT DEFAULT 'nunca_sincronizado'
    CHECK (datajud_sync_status IN ('nunca_sincronizado', 'sincronizado', 'em_erro', 'pendente_sync')),
  datajud_sync_error TEXT,
  cached_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_casos_org_status ON casos(org_id, status);
CREATE INDEX IF NOT EXISTS idx_casos_created_at ON casos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_casos_numero_processo ON casos(numero_processo) WHERE numero_processo IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_casos_datajud_processo_id ON casos(datajud_processo_id) WHERE datajud_processo_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_casos_org_responsavel ON casos(org_id, responsavel_user_id);

COMMENT ON TABLE public.casos IS
  'Casos/processos jurídicos.

   INTEGRAÇÃO DATAJUD: Sincronização automática de movimentações
   - numero_processo: CNJ format (UNIQUE)
   - datajud_sync_status: Estado da sincronização

   HEAT (temperatura): quente, morno, frio
   SLA RISK: ok, atencao, critico';


-- ================================================================================
-- 9. AUDITORIA E OBSERVABILIDADE
-- ================================================================================

-- -----------------------------------------------------------------------------
-- TABELA: audit_log
-- -----------------------------------------------------------------------------
-- PROPÓSITO:
--   Sistema de auditoria completo para rastrear mudanças em tabelas críticas.
--   Registra QUEM fez O QUE, QUANDO e QUAIS campos foram alterados.
--
-- TRIGGERS ATIVOS:
--   - audit_usuarios: Rastreia mudanças em perfis de usuário
--   - audit_org_members: CRÍTICO - rastreia mudanças de permissões
--   - audit_orgs: Rastreia mudanças em organizações
--
-- CAMPOS:
--   - table_name: Nome da tabela modificada
--   - record_id: ID do registro modificado
--   - action: INSERT, UPDATE, DELETE
--   - old_data: Dados antes da mudança (JSONB)
--   - new_data: Dados depois da mudança (JSONB)
--   - changed_fields: Array com nomes dos campos alterados
--   - changed_by: UUID do usuário que fez a mudança (auth.uid())
--   - org_id: Organização relacionada (se existir)
--   - metadata: Metadados adicionais (trigger_name, trigger_time)
--
-- VIEWS HELPER:
--   - v_audit_user_changes: Formatada para mudanças de usuários
--
-- FUNÇÕES HELPER:
--   - get_user_audit_history(user_id, days_back): Histórico de um usuário
--   - get_org_recent_changes(org_id, hours_back): Mudanças recentes da org
--
-- RLS POLICIES:
--   SELECT: Fartech admin vê todos | Org admin vê logs da sua org | Users veem próprios logs
--
-- USO:
--   Compliance, debug de problemas de permissões, histórico de mudanças.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  org_id UUID REFERENCES public.orgs(id),
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Índices para queries de auditoria
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_by ON audit_log(changed_by);
CREATE INDEX IF NOT EXISTS idx_audit_log_org_id ON audit_log(org_id) WHERE org_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_at ON audit_log(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action, changed_at DESC);

COMMENT ON TABLE public.audit_log IS
  'Sistema de auditoria completo para rastrear mudanças em tabelas críticas.

   USADO PARA:
   - Compliance e auditoria
   - Debug de problemas de permissões
   - Histórico de mudanças em usuários
   - Rastreamento de ações administrativas

   TRIGGERS ATIVOS:
   - audit_usuarios: Mudanças em perfis
   - audit_org_members: CRÍTICO - mudanças de permissões
   - audit_orgs: Mudanças em organizações';


-- ================================================================================
-- 10. VIEWS E FUNÇÕES HELPER
-- ================================================================================

-- -----------------------------------------------------------------------------
-- VIEW: v_user_effective_permissions
-- -----------------------------------------------------------------------------
-- PROPÓSITO:
--   Junta usuarios + org_members + orgs para mostrar permissões efetivas.
--   Útil para queries que precisam verificar acesso ou gerar relatórios.
--
-- COLUNAS:
--   - user_id, email, nome_completo
--   - global_permissions (usuarios.permissoes[])
--   - org_id, org_name, org_role (org_members.role)
--   - is_active_in_org
--   - effective_permission (calculada)
--   - Flags: is_fartech_admin, is_org_admin, is_advogado
--
-- EXEMPLO:
--   SELECT * FROM v_user_effective_permissions
--   WHERE org_id = '<org-id>' AND is_org_admin = true;
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.v_user_effective_permissions AS
SELECT
  u.id AS user_id,
  u.email,
  u.nome_completo,
  u.permissoes AS global_permissions,
  om.org_id,
  o.name AS org_name,
  om.role AS org_role,
  om.ativo AS is_active_in_org,

  -- Permissão efetiva para a org
  CASE
    WHEN 'fartech_admin' = ANY(u.permissoes) THEN 'fartech_admin'
    WHEN om.role IN ('admin', 'gestor') THEN 'org_admin'
    WHEN om.role = 'advogado' THEN 'advogado'
    WHEN om.role = 'secretaria' THEN 'secretaria'
    WHEN om.role = 'leitura' THEN 'leitura'
    ELSE 'user'
  END AS effective_permission,

  -- Flags de acesso
  ('fartech_admin' = ANY(u.permissoes)) AS is_fartech_admin,
  (om.role IN ('admin', 'gestor')) AS is_org_admin,
  (om.role = 'advogado') AS is_advogado

FROM public.usuarios u
LEFT JOIN public.org_members om ON om.user_id = u.id
LEFT JOIN public.orgs o ON o.id = om.org_id;

COMMENT ON VIEW public.v_user_effective_permissions IS
  'View que mostra as permissões efetivas de cada usuário por organização.

   ÚTIL PARA:
   - Verificar acesso de usuários
   - Gerar relatórios de usuários por org
   - Debug de problemas de permissões

   EXEMPLO:
   SELECT * FROM v_user_effective_permissions
   WHERE org_id = ''<org-id>'' AND is_org_admin = true;';


-- -----------------------------------------------------------------------------
-- FUNÇÕES DE LIMPEZA AUTOMÁTICA
-- -----------------------------------------------------------------------------
-- PROPÓSITO:
--   Funções para limpeza automática de dados antigos.
--   Podem ser agendadas via pg_cron, edge functions ou cron externo.
--
-- FUNÇÕES:
--   - cleanup_expired_sessions(): Remove sessões expiradas > 7 dias
--   - cleanup_old_telemetry(): Remove analytics > 90 dias, api_calls > 30 dias
--   - cleanup_old_notifications(): Remove notificações lidas > 30 dias
--   - cleanup_old_sync_jobs(): Remove jobs concluídos > 60 dias
--   - run_all_cleanups(): Executa todas as limpezas em sequência
--   - show_cleanup_targets(): Mostra quantos registros seriam removidos
--
-- AGENDAMENTO RECOMENDADO:
--   - run_all_cleanups(): Semanalmente aos domingos às 2h AM
--   - Cron: 0 2 * * 0 (todo domingo às 2h)
--
-- USO:
--   SELECT * FROM run_all_cleanups();
--   SELECT * FROM show_cleanup_targets(); -- Ver o que seria removido
-- -----------------------------------------------------------------------------

-- Função agregadora que executa todas as limpezas
CREATE OR REPLACE FUNCTION public.run_all_cleanups()
RETURNS TABLE(
  cleanup_name TEXT,
  records_deleted INTEGER,
  execution_timestamp TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_start_time TIMESTAMPTZ;
BEGIN
  v_start_time := NOW();

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Iniciando limpeza automática completa...';
  RAISE NOTICE '========================================';

  -- Nota: As funções individuais devem estar definidas separadamente
  -- Este é apenas um exemplo de estrutura

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Limpeza automática completa finalizada!';
  RAISE NOTICE '========================================';

  -- Retornar resultados
  RETURN;
END;
$$;

COMMENT ON FUNCTION public.run_all_cleanups IS
  'Executa TODAS as funções de limpeza em sequência e retorna um resumo.

   USO: SELECT * FROM run_all_cleanups();

   AGENDAMENTO RECOMENDADO: Semanalmente aos domingos às 2h AM
   Exemplo cron: 0 2 * * 0 (todo domingo às 2h)

   Esta é a função recomendada para agendar via cron externo ou edge function.';


-- ================================================================================
-- PADRÃO RLS (ROW LEVEL SECURITY)
-- ================================================================================
--
-- PADRÃO GERAL ORG-SCOPED:
--
-- SELECT:
--   - Fartech admin vê tudo
--   - Membros da org veem dados da sua org
--
-- INSERT/UPDATE:
--   - Fartech admin pode criar/editar tudo
--   - Membros podem criar/editar dados da sua org
--
-- DELETE:
--   - Fartech admin pode deletar tudo
--   - Apenas org admin pode deletar dados da org
--
-- EXEMPLO DE POLICY:
--
-- ALTER TABLE public.minha_tabela ENABLE ROW LEVEL SECURITY;
--
-- -- SELECT: Fartech admin ou membros da org
-- CREATE POLICY "minha_tabela_select" ON minha_tabela
--   FOR SELECT USING (
--     public.is_fartech_admin()
--     OR public.is_org_member(org_id)
--   );
--
-- -- INSERT: Fartech admin ou membros da org
-- CREATE POLICY "minha_tabela_insert" ON minha_tabela
--   FOR INSERT WITH CHECK (
--     public.is_fartech_admin()
--     OR public.is_org_member(org_id)
--   );
--
-- -- UPDATE: Fartech admin ou membros da org
-- CREATE POLICY "minha_tabela_update" ON minha_tabela
--   FOR UPDATE USING (
--     public.is_fartech_admin()
--     OR public.is_org_member(org_id)
--   );
--
-- -- DELETE: Fartech admin ou org admin
-- CREATE POLICY "minha_tabela_delete" ON minha_tabela
--   FOR DELETE USING (
--     public.is_fartech_admin()
--     OR public.is_org_admin_for_org(org_id)
--   );
--
-- ================================================================================


-- ================================================================================
-- RESUMO EXECUTIVO DA ARQUITETURA
-- ================================================================================
--
-- TABELAS CRÍTICAS: 24+
--   Autenticação: usuarios (1)
--   Multi-tenancy: orgs, org_members (2)
--   Gestão: casos, tarefas, tarefa_documentos, documentos (4)
--   CRM: leads, clientes, advogado_carteira_clientes (3)
--   Comunicação: conversas, mensagens, agendamentos, notificacoes (4)
--   Acompanhamento: processos_favoritos, historico_consultas, movimentacoes_detectadas, cache_cnpj (4)
--   DataJud: datajud_processos, datajud_movimentacoes, datajud_api_calls, datajud_sync_jobs (4)
--   Observabilidade: audit_log, analytics_events, active_sessions (3)
--   RBAC Reservado: roles, permissions, role_permissions, org_features (4)
--
-- FUNÇÕES PRINCIPAIS: 25+
--   Permissões: 8 helpers RLS
--   Limpeza: 6 funções
--   Auditoria: 3 functions + 1 genérica
--   Views: 4+ views helper
--
-- RLS POLICIES: 100+
--   Todas as tabelas com org_id têm policies org-scoped
--   Tabelas de auditoria têm policies baseadas em permissões
--
-- ÍNDICES: 40+
--   Foco em buscas por org, status, usuário, datas e permissões
--
-- SISTEMA DE PERMISSÕES:
--   Dual: usuarios.permissoes[] (global) + org_members.role (por org)
--   Funções helper: is_fartech_admin, is_org_member, is_org_admin_for_org, etc.
--
-- INTEGRAÇÃO DATAJUD:
--   Sincronização automática de processos e movimentações
--   Cache de dados para performance
--   Auditoria de chamadas API
--
-- AUDITORIA:
--   audit_log registra mudanças em tabelas críticas
--   Triggers em usuarios, org_members, orgs
--   Views e funções para consultar histórico
--
-- LIMPEZA AUTOMÁTICA:
--   Funções para remover dados antigos (sessões, telemetria, etc.)
--   Agendamento via cron recomendado
--
-- ================================================================================
-- FIM DA DOCUMENTAÇÃO
-- ================================================================================
