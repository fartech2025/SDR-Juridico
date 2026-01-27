-- ============================================
-- CRIAR TABELA ORG_MEMBERS
-- Relacionamento usuarios x organizacoes
-- ============================================
-- Melhorias aplicadas:
-- 1) Coluna updated_at garantida para tabelas legadas.
-- 2) Helpers SECURITY DEFINER com row_security=off para evitar recursao em RLS.
-- 3) Policies de org_members atualizadas para usar os helpers.

-- Criar tabela org_members
CREATE TABLE IF NOT EXISTS org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraint: usuario nao pode estar duplicado na mesma org
  UNIQUE(org_id, user_id)
);

-- Garantir coluna updated_at caso a tabela ja exista sem a coluna
ALTER TABLE org_members
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON org_members(org_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_ativo ON org_members(ativo);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON org_members(role);

-- Comentarios
COMMENT ON TABLE org_members IS 'Relacionamento entre usuarios e organizacoes';
COMMENT ON COLUMN org_members.role IS 'Papel do usuario na organizacao: admin, gestor, advogado, secretaria, leitura';
COMMENT ON COLUMN org_members.ativo IS 'Se o membro esta ativo na organizacao';

-- Trigger para atualizar updated_at automaticamente
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

-- ============================================
-- RLS (Row Level Security) para org_members
-- ============================================

-- Helpers para evitar recursao em policies de org_members
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

ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;

-- Policy 1: Fartech Admins veem todos os membros
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

-- Policy 2: Org Admins veem e gerenciam membros da sua org
DROP POLICY IF EXISTS "org_admin_own_org_members" ON org_members;
CREATE POLICY "org_admin_own_org_members"
  ON org_members
  FOR ALL
  USING (
    public.is_org_admin_for_org(org_id)
  );

-- Policy 3: Usuarios veem membros da mesma org (somente leitura)
DROP POLICY IF EXISTS "users_same_org_members" ON org_members;
CREATE POLICY "users_same_org_members"
  ON org_members
  FOR SELECT
  USING (
    public.is_org_member(org_id)
  );

-- Policy 4: Usuarios podem ver seus proprios dados de membro
DROP POLICY IF EXISTS "users_own_member_record" ON org_members;
CREATE POLICY "users_own_member_record"
  ON org_members
  FOR ALL
  USING (user_id = auth.uid());

-- ============================================
-- VERIFICACAO
-- ============================================

-- Verificar se tabela foi criada
SELECT 
  'org_members table check' AS verification,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'org_members'
  ) AS table_exists;

-- Verificar colunas
SELECT 
  'org_members columns' AS verification,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'org_members'
ORDER BY ordinal_position;

-- Verificar RLS habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'org_members';

-- Verificar politicas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'org_members'
ORDER BY policyname;

