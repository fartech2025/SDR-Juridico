-- =====================================================
-- Migration: Multi-tenant Complete Architecture
-- Data: 2026-01-14
-- Descrição: Implementação completa de arquitetura multi-tenant
--            com observabilidade, RBAC dinâmico e org_features
-- =====================================================

-- =====================================================
-- 1. TABELAS DE OBSERVABILIDADE
-- =====================================================

-- Audit Logs: registra todas as ações importantes
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.orgs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'login', 'logout', 'error'
  entity_type TEXT NOT NULL, -- 'leads', 'casos', 'clientes', etc
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_logs_org_id ON public.audit_logs(org_id);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Analytics Events: tracking de eventos e comportamento
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.orgs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id UUID,
  event_name TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'page_view', 'button_click', 'feature_used', 'error', 'integration'
  properties JSONB DEFAULT '{}'::jsonb,
  device_info JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_analytics_events_org_id ON public.analytics_events(org_id);
CREATE INDEX idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX idx_analytics_events_session_id ON public.analytics_events(session_id);
CREATE INDEX idx_analytics_events_event_name ON public.analytics_events(event_name);
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at DESC);

-- Active Sessions: gerenciamento de sessões ativas
CREATE TABLE IF NOT EXISTS public.active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.orgs(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE,
  device_info JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  last_activity TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX idx_active_sessions_user_id ON public.active_sessions(user_id);
CREATE INDEX idx_active_sessions_org_id ON public.active_sessions(org_id);
CREATE INDEX idx_active_sessions_last_activity ON public.active_sessions(last_activity DESC);

-- =====================================================
-- 2. RBAC DINÂMICO
-- =====================================================

-- Roles: papéis do sistema
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false, -- roles do sistema não podem ser deletadas
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Permissions: permissões granulares
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  resource TEXT NOT NULL, -- 'leads', 'casos', 'clientes', etc
  action TEXT NOT NULL, -- 'create', 'read', 'update', 'delete', 'manage'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Role Permissions: relação N:N entre roles e permissions
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON public.role_permissions(permission_id);

-- =====================================================
-- 3. ORG FEATURES
-- =====================================================

-- Org Features: controle de features habilitadas por organização
CREATE TABLE IF NOT EXISTS public.org_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, feature_key)
);

CREATE INDEX idx_org_features_org_id ON public.org_features(org_id);
CREATE INDEX idx_org_features_feature_key ON public.org_features(feature_key);

-- =====================================================
-- 4. ADICIONAR ORG_ID ÀS TABELAS EXISTENTES (se necessário)
-- =====================================================

-- Clientes
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clientes' AND column_name = 'org_id'
  ) THEN
    ALTER TABLE public.clientes ADD COLUMN org_id UUID REFERENCES public.orgs(id) ON DELETE CASCADE;
    CREATE INDEX idx_clientes_org_id ON public.clientes(org_id);
  END IF;
END $$;

-- Casos
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'casos' AND column_name = 'org_id'
  ) THEN
    ALTER TABLE public.casos ADD COLUMN org_id UUID REFERENCES public.orgs(id) ON DELETE CASCADE;
    CREATE INDEX idx_casos_org_id ON public.casos(org_id);
  END IF;
END $$;

-- Documentos
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documentos' AND column_name = 'org_id'
  ) THEN
    ALTER TABLE public.documentos ADD COLUMN org_id UUID REFERENCES public.orgs(id) ON DELETE CASCADE;
    CREATE INDEX idx_documentos_org_id ON public.documentos(org_id);
  END IF;
END $$;

-- Agendamentos (agenda)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agendamentos' AND column_name = 'org_id'
  ) THEN
    ALTER TABLE public.agendamentos ADD COLUMN org_id UUID REFERENCES public.orgs(id) ON DELETE CASCADE;
    CREATE INDEX idx_agendamentos_org_id ON public.agendamentos(org_id);
  END IF;
END $$;

-- Notificações
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notificacoes' AND column_name = 'org_id'
  ) THEN
    ALTER TABLE public.notificacoes ADD COLUMN org_id UUID REFERENCES public.orgs(id) ON DELETE CASCADE;
    CREATE INDEX idx_notificacoes_org_id ON public.notificacoes(org_id);
  END IF;
END $$;

-- Timeline Events
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'timeline_events' AND column_name = 'org_id'
  ) THEN
    ALTER TABLE public.timeline_events ADD COLUMN org_id UUID REFERENCES public.orgs(id) ON DELETE CASCADE;
    CREATE INDEX idx_timeline_events_org_id ON public.timeline_events(org_id);
  END IF;
END $$;

-- =====================================================
-- 5. HELPER FUNCTIONS
-- =====================================================

-- Função para obter org_id do usuário atual
CREATE OR REPLACE FUNCTION public.get_current_user_org_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_org_id UUID;
BEGIN
  SELECT org_id INTO user_org_id
  FROM public.organization_members
  WHERE user_id = auth.uid()
  AND ativo = true
  LIMIT 1;
  
  RETURN user_org_id;
END;
$$;

-- Função para verificar se usuário é Fartech Admin
CREATE OR REPLACE FUNCTION public.is_fartech_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  SELECT (u.permissoes @> ARRAY['fartech_admin']::text[]) INTO is_admin
  FROM public.usuarios u
  WHERE u.id = auth.uid();
  
  RETURN COALESCE(is_admin, false);
END;
$$;

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Audit Logs RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Fartech admins can view all audit logs" ON public.audit_logs;
CREATE POLICY "Fartech admins can view all audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.is_fartech_admin());

DROP POLICY IF EXISTS "Users can view own org audit logs" ON public.audit_logs;
CREATE POLICY "Users can view own org audit logs"
  ON public.audit_logs FOR SELECT
  USING (org_id = public.get_current_user_org_id());

DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

-- Analytics Events RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Fartech admins can view all analytics" ON public.analytics_events;
CREATE POLICY "Fartech admins can view all analytics"
  ON public.analytics_events FOR SELECT
  USING (public.is_fartech_admin());

DROP POLICY IF EXISTS "Users can view own org analytics" ON public.analytics_events;
CREATE POLICY "Users can view own org analytics"
  ON public.analytics_events FOR SELECT
  USING (org_id = public.get_current_user_org_id());

DROP POLICY IF EXISTS "System can insert analytics" ON public.analytics_events;
CREATE POLICY "System can insert analytics"
  ON public.analytics_events FOR INSERT
  WITH CHECK (true);

-- Active Sessions RLS
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own sessions" ON public.active_sessions;
CREATE POLICY "Users can view own sessions"
  ON public.active_sessions FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own sessions" ON public.active_sessions;
CREATE POLICY "Users can insert own sessions"
  ON public.active_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own sessions" ON public.active_sessions;
CREATE POLICY "Users can update own sessions"
  ON public.active_sessions FOR UPDATE
  USING (user_id = auth.uid());

-- Roles RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view roles" ON public.roles;
CREATE POLICY "Anyone can view roles"
  ON public.roles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Only Fartech admins can manage roles" ON public.roles;
CREATE POLICY "Only Fartech admins can manage roles"
  ON public.roles FOR ALL
  USING (public.is_fartech_admin());

-- Permissions RLS
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view permissions" ON public.permissions;
CREATE POLICY "Anyone can view permissions"
  ON public.permissions FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Only Fartech admins can manage permissions" ON public.permissions;
CREATE POLICY "Only Fartech admins can manage permissions"
  ON public.permissions FOR ALL
  USING (public.is_fartech_admin());

-- Role Permissions RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view role permissions" ON public.role_permissions;
CREATE POLICY "Anyone can view role permissions"
  ON public.role_permissions FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Only Fartech admins can manage role permissions" ON public.role_permissions;
CREATE POLICY "Only Fartech admins can manage role permissions"
  ON public.role_permissions FOR ALL
  USING (public.is_fartech_admin());

-- Org Features RLS
ALTER TABLE public.org_features ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own org features" ON public.org_features;
CREATE POLICY "Users can view own org features"
  ON public.org_features FOR SELECT
  USING (org_id = public.get_current_user_org_id() OR public.is_fartech_admin());

DROP POLICY IF EXISTS "Only Fartech admins can manage org features" ON public.org_features;
CREATE POLICY "Only Fartech admins can manage org features"
  ON public.org_features FOR ALL
  USING (public.is_fartech_admin());

-- =====================================================
-- 7. REFINAR RLS DAS TABELAS EXISTENTES
-- =====================================================

-- Clientes RLS
DROP POLICY IF EXISTS "Users can view own org clientes" ON public.clientes;
CREATE POLICY "Users can view own org clientes"
  ON public.clientes FOR SELECT
  USING (org_id = public.get_current_user_org_id() OR public.is_fartech_admin());

DROP POLICY IF EXISTS "Users can insert own org clientes" ON public.clientes;
CREATE POLICY "Users can insert own org clientes"
  ON public.clientes FOR INSERT
  WITH CHECK (org_id = public.get_current_user_org_id());

DROP POLICY IF EXISTS "Users can update own org clientes" ON public.clientes;
CREATE POLICY "Users can update own org clientes"
  ON public.clientes FOR UPDATE
  USING (org_id = public.get_current_user_org_id());

DROP POLICY IF EXISTS "Users can delete own org clientes" ON public.clientes;
CREATE POLICY "Users can delete own org clientes"
  ON public.clientes FOR DELETE
  USING (org_id = public.get_current_user_org_id());

-- Casos RLS
DROP POLICY IF EXISTS "Users can view own org casos" ON public.casos;
CREATE POLICY "Users can view own org casos"
  ON public.casos FOR SELECT
  USING (org_id = public.get_current_user_org_id() OR public.is_fartech_admin());

DROP POLICY IF EXISTS "Users can insert own org casos" ON public.casos;
CREATE POLICY "Users can insert own org casos"
  ON public.casos FOR INSERT
  WITH CHECK (org_id = public.get_current_user_org_id());

DROP POLICY IF EXISTS "Users can update own org casos" ON public.casos;
CREATE POLICY "Users can update own org casos"
  ON public.casos FOR UPDATE
  USING (org_id = public.get_current_user_org_id());

DROP POLICY IF EXISTS "Users can delete own org casos" ON public.casos;
CREATE POLICY "Users can delete own org casos"
  ON public.casos FOR DELETE
  USING (org_id = public.get_current_user_org_id());

-- Documentos RLS
DROP POLICY IF EXISTS "Users can view own org documentos" ON public.documentos;
CREATE POLICY "Users can view own org documentos"
  ON public.documentos FOR SELECT
  USING (org_id = public.get_current_user_org_id() OR public.is_fartech_admin());

DROP POLICY IF EXISTS "Users can insert own org documentos" ON public.documentos;
CREATE POLICY "Users can insert own org documentos"
  ON public.documentos FOR INSERT
  WITH CHECK (org_id = public.get_current_user_org_id());

DROP POLICY IF EXISTS "Users can update own org documentos" ON public.documentos;
CREATE POLICY "Users can update own org documentos"
  ON public.documentos FOR UPDATE
  USING (org_id = public.get_current_user_org_id());

DROP POLICY IF EXISTS "Users can delete own org documentos" ON public.documentos;
CREATE POLICY "Users can delete own org documentos"
  ON public.documentos FOR DELETE
  USING (org_id = public.get_current_user_org_id());

-- Agendamentos RLS
DROP POLICY IF EXISTS "Users can view own org agendamentos" ON public.agendamentos;
CREATE POLICY "Users can view own org agendamentos"
  ON public.agendamentos FOR SELECT
  USING (org_id = public.get_current_user_org_id() OR public.is_fartech_admin());

DROP POLICY IF EXISTS "Users can insert own org agendamentos" ON public.agendamentos;
CREATE POLICY "Users can insert own org agendamentos"
  ON public.agendamentos FOR INSERT
  WITH CHECK (org_id = public.get_current_user_org_id());

DROP POLICY IF EXISTS "Users can update own org agendamentos" ON public.agendamentos;
CREATE POLICY "Users can update own org agendamentos"
  ON public.agendamentos FOR UPDATE
  USING (org_id = public.get_current_user_org_id());

DROP POLICY IF EXISTS "Users can delete own org agendamentos" ON public.agendamentos;
CREATE POLICY "Users can delete own org agendamentos"
  ON public.agendamentos FOR DELETE
  USING (org_id = public.get_current_user_org_id());

-- Notificações RLS
DROP POLICY IF EXISTS "Users can view own org notificacoes" ON public.notificacoes;
CREATE POLICY "Users can view own org notificacoes"
  ON public.notificacoes FOR SELECT
  USING (org_id = public.get_current_user_org_id() OR public.is_fartech_admin());

DROP POLICY IF EXISTS "Users can insert own org notificacoes" ON public.notificacoes;
CREATE POLICY "Users can insert own org notificacoes"
  ON public.notificacoes FOR INSERT
  WITH CHECK (org_id = public.get_current_user_org_id());

DROP POLICY IF EXISTS "Users can update own org notificacoes" ON public.notificacoes;
CREATE POLICY "Users can update own org notificacoes"
  ON public.notificacoes FOR UPDATE
  USING (org_id = public.get_current_user_org_id());

DROP POLICY IF EXISTS "Users can delete own org notificacoes" ON public.notificacoes;
CREATE POLICY "Users can delete own org notificacoes"
  ON public.notificacoes FOR DELETE
  USING (org_id = public.get_current_user_org_id());

-- Timeline Events RLS
DROP POLICY IF EXISTS "Users can view own org timeline_events" ON public.timeline_events;
CREATE POLICY "Users can view own org timeline_events"
  ON public.timeline_events FOR SELECT
  USING (org_id = public.get_current_user_org_id() OR public.is_fartech_admin());

DROP POLICY IF EXISTS "Users can insert own org timeline_events" ON public.timeline_events;
CREATE POLICY "Users can insert own org timeline_events"
  ON public.timeline_events FOR INSERT
  WITH CHECK (org_id = public.get_current_user_org_id());

DROP POLICY IF EXISTS "Users can update own org timeline_events" ON public.timeline_events;
CREATE POLICY "Users can update own org timeline_events"
  ON public.timeline_events FOR UPDATE
  USING (org_id = public.get_current_user_org_id());

DROP POLICY IF EXISTS "Users can delete own org timeline_events" ON public.timeline_events;
CREATE POLICY "Users can delete own org timeline_events"
  ON public.timeline_events FOR DELETE
  USING (org_id = public.get_current_user_org_id());

-- =====================================================
-- 8. SEEDS INICIAIS
-- =====================================================

-- Roles do sistema
INSERT INTO public.roles (name, display_name, description, is_system)
VALUES 
  ('fartech_admin', 'Fartech Admin', 'Administrador da plataforma Fartech', true),
  ('org_admin', 'Administrador', 'Administrador da organização', true),
  ('user', 'Usuário', 'Usuário padrão', true)
ON CONFLICT (name) DO NOTHING;

-- Permissions
INSERT INTO public.permissions (name, resource, action, description)
VALUES 
  -- Leads
  ('leads.create', 'leads', 'create', 'Criar leads'),
  ('leads.read', 'leads', 'read', 'Visualizar leads'),
  ('leads.update', 'leads', 'update', 'Atualizar leads'),
  ('leads.delete', 'leads', 'delete', 'Deletar leads'),
  ('leads.manage', 'leads', 'manage', 'Gerenciar todos leads'),
  
  -- Clientes
  ('clientes.create', 'clientes', 'create', 'Criar clientes'),
  ('clientes.read', 'clientes', 'read', 'Visualizar clientes'),
  ('clientes.update', 'clientes', 'update', 'Atualizar clientes'),
  ('clientes.delete', 'clientes', 'delete', 'Deletar clientes'),
  ('clientes.manage', 'clientes', 'manage', 'Gerenciar todos clientes'),
  
  -- Casos
  ('casos.create', 'casos', 'create', 'Criar casos'),
  ('casos.read', 'casos', 'read', 'Visualizar casos'),
  ('casos.update', 'casos', 'update', 'Atualizar casos'),
  ('casos.delete', 'casos', 'delete', 'Deletar casos'),
  ('casos.manage', 'casos', 'manage', 'Gerenciar todos casos'),
  
  -- Documentos
  ('documentos.create', 'documentos', 'create', 'Criar documentos'),
  ('documentos.read', 'documentos', 'read', 'Visualizar documentos'),
  ('documentos.update', 'documentos', 'update', 'Atualizar documentos'),
  ('documentos.delete', 'documentos', 'delete', 'Deletar documentos'),
  ('documentos.manage', 'documentos', 'manage', 'Gerenciar todos documentos'),
  
  -- Agenda
  ('agenda.create', 'agenda', 'create', 'Criar eventos'),
  ('agenda.read', 'agenda', 'read', 'Visualizar agenda'),
  ('agenda.update', 'agenda', 'update', 'Atualizar eventos'),
  ('agenda.delete', 'agenda', 'delete', 'Deletar eventos'),
  ('agenda.manage', 'agenda', 'manage', 'Gerenciar toda agenda'),
  
  -- Usuários
  ('users.create', 'users', 'create', 'Criar usuários'),
  ('users.read', 'users', 'read', 'Visualizar usuários'),
  ('users.update', 'users', 'update', 'Atualizar usuários'),
  ('users.delete', 'users', 'delete', 'Deletar usuários'),
  ('users.manage', 'users', 'manage', 'Gerenciar todos usuários'),
  
  -- Organizações (apenas Fartech Admin)
  ('orgs.create', 'orgs', 'create', 'Criar organizações'),
  ('orgs.read', 'orgs', 'read', 'Visualizar organizações'),
  ('orgs.update', 'orgs', 'update', 'Atualizar organizações'),
  ('orgs.delete', 'orgs', 'delete', 'Deletar organizações'),
  ('orgs.manage', 'orgs', 'manage', 'Gerenciar todas organizações'),
  
  -- Analytics
  ('analytics.read', 'analytics', 'read', 'Visualizar analytics'),
  ('analytics.manage', 'analytics', 'manage', 'Gerenciar analytics'),
  
  -- Settings
  ('settings.read', 'settings', 'read', 'Visualizar configurações'),
  ('settings.update', 'settings', 'update', 'Atualizar configurações')
ON CONFLICT (name) DO NOTHING;

-- Associar permissões aos roles
DO $$
DECLARE
  fartech_admin_id UUID;
  org_admin_id UUID;
  user_id UUID;
BEGIN
  SELECT id INTO fartech_admin_id FROM public.roles WHERE name = 'fartech_admin';
  SELECT id INTO org_admin_id FROM public.roles WHERE name = 'org_admin';
  SELECT id INTO user_id FROM public.roles WHERE name = 'user';
  
  -- Fartech Admin: todas as permissões
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT fartech_admin_id, id FROM public.permissions
  ON CONFLICT DO NOTHING;
  
  -- Org Admin: todas exceto org management
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT org_admin_id, id FROM public.permissions
  WHERE resource != 'orgs'
  ON CONFLICT DO NOTHING;
  
  -- User: apenas read/create básico
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT user_id, id FROM public.permissions
  WHERE action IN ('read', 'create', 'update')
  AND resource NOT IN ('orgs', 'users', 'analytics', 'settings')
  ON CONFLICT DO NOTHING;
END $$;

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
