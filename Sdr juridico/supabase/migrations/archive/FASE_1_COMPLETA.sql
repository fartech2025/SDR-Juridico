-- ============================================
-- FASE 1 COMPLETA: MULTI-TENANT (usuarios + org_members)
-- ============================================
-- Melhorias aplicadas:
-- 1) Coluna updated_at garantida para tabelas legadas.
-- 2) Helpers SECURITY DEFINER com row_security=off para evitar recursao em RLS.
-- 3) Policies de org_members atualizadas para usar os helpers.

-- Parte 1: Adicionar org_id nas tabelas principais
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'leads'
    AND column_name = 'org_id'
  ) THEN
    ALTER TABLE leads ADD COLUMN org_id UUID REFERENCES orgs(id);
    CREATE INDEX idx_leads_org_id ON leads(org_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'clientes'
    AND column_name = 'org_id'
  ) THEN
    ALTER TABLE clientes ADD COLUMN org_id UUID REFERENCES orgs(id);
    CREATE INDEX idx_clientes_org_id ON clientes(org_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'casos'
    AND column_name = 'org_id'
  ) THEN
    ALTER TABLE casos ADD COLUMN org_id UUID REFERENCES orgs(id);
    CREATE INDEX idx_casos_org_id ON casos(org_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'documentos'
    AND column_name = 'org_id'
  ) THEN
    ALTER TABLE documentos ADD COLUMN org_id UUID REFERENCES orgs(id);
    CREATE INDEX idx_documentos_org_id ON documentos(org_id);
  END IF;
END $$;

-- Parte 2: Criar org_members
CREATE TABLE IF NOT EXISTS org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

ALTER TABLE org_members
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON org_members(org_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_ativo ON org_members(ativo);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON org_members(role);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_org_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_org_members_updated_at ON org_members;
CREATE TRIGGER trigger_update_org_members_updated_at
  BEFORE UPDATE ON org_members
  FOR EACH ROW
  EXECUTE FUNCTION update_org_members_updated_at();

-- Parte 3: Funcoes auxiliares
CREATE OR REPLACE FUNCTION public.is_fartech_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios u
    WHERE u.id = auth.uid()
      AND u.permissoes @> ARRAY['fartech_admin']::text[]
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT org_id
  FROM public.org_members
  WHERE user_id = auth.uid()
    AND ativo = true
  ORDER BY created_at ASC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.org_members
    WHERE user_id = auth.uid()
      AND ativo = true
      AND role IN ('admin', 'gestor')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_member(_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.org_members om
    WHERE om.org_id = _org_id
      AND om.user_id = auth.uid()
      AND om.ativo = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin_for_org(_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.org_members om
    WHERE om.org_id = _org_id
      AND om.user_id = auth.uid()
      AND om.ativo = true
      AND om.role IN ('admin', 'gestor')
  );
$$;

-- Parte 4: RLS org_members
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fartech_admin_all_members" ON org_members;
CREATE POLICY "fartech_admin_all_members"
  ON org_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
      AND u.permissoes @> ARRAY['fartech_admin']::text[]
    )
  );

DROP POLICY IF EXISTS "org_admin_own_org_members" ON org_members;
CREATE POLICY "org_admin_own_org_members"
  ON org_members
  FOR ALL
  USING (
    public.is_org_admin_for_org(org_id)
  );

DROP POLICY IF EXISTS "users_same_org_members" ON org_members;
CREATE POLICY "users_same_org_members"
  ON org_members
  FOR SELECT
  USING (
    public.is_org_member(org_id)
  );

DROP POLICY IF EXISTS "users_own_member_record" ON org_members;
CREATE POLICY "users_own_member_record"
  ON org_members
  FOR ALL
  USING (user_id = auth.uid());

-- Parte 5: RLS orgs
ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fartech_admin_all_orgs" ON orgs;
CREATE POLICY "fartech_admin_all_orgs"
  ON orgs
  FOR ALL
  USING (public.is_fartech_admin());

DROP POLICY IF EXISTS "org_admin_own_org" ON orgs;
CREATE POLICY "org_admin_own_org"
  ON orgs
  FOR ALL
  USING (
    id = public.get_user_org_id()
    AND public.is_org_admin()
  );

DROP POLICY IF EXISTS "users_own_org_readonly" ON orgs;
CREATE POLICY "users_own_org_readonly"
  ON orgs
  FOR SELECT
  USING (id = public.get_user_org_id());

-- Parte 6: RLS leads/clientes/casos/documentos
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE casos ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fartech_admin_all_leads" ON leads;
CREATE POLICY "fartech_admin_all_leads" ON leads FOR ALL USING (public.is_fartech_admin());
DROP POLICY IF EXISTS "users_own_org_leads" ON leads;
CREATE POLICY "users_own_org_leads" ON leads FOR ALL USING (org_id = public.get_user_org_id());

DROP POLICY IF EXISTS "fartech_admin_all_clientes" ON clientes;
CREATE POLICY "fartech_admin_all_clientes" ON clientes FOR ALL USING (public.is_fartech_admin());
DROP POLICY IF EXISTS "users_own_org_clientes" ON clientes;
CREATE POLICY "users_own_org_clientes" ON clientes FOR ALL USING (org_id = public.get_user_org_id());

DROP POLICY IF EXISTS "fartech_admin_all_casos" ON casos;
CREATE POLICY "fartech_admin_all_casos" ON casos FOR ALL USING (public.is_fartech_admin());
DROP POLICY IF EXISTS "users_own_org_casos" ON casos;
CREATE POLICY "users_own_org_casos" ON casos FOR ALL USING (org_id = public.get_user_org_id());

DROP POLICY IF EXISTS "fartech_admin_all_documentos" ON documentos;
CREATE POLICY "fartech_admin_all_documentos" ON documentos FOR ALL USING (public.is_fartech_admin());
DROP POLICY IF EXISTS "users_own_org_documentos" ON documentos;
CREATE POLICY "users_own_org_documentos" ON documentos FOR ALL USING (org_id = public.get_user_org_id());

-- Parte 7: Criar organizacao de teste
INSERT INTO orgs (id, nome, slug, created_at)
VALUES (
  'c1e7b3a0-0000-0000-0000-000000000001'::uuid,
  'Demo Organization',
  'demo',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

