-- Migration: Create org_members table
-- Date: 2026-01-16
-- Description: Creates the org_members table to track organization memberships and roles

-- ============================================
-- TABLE: org_members
-- ============================================
CREATE TABLE IF NOT EXISTS public.org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Role and Status
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  ativo BOOLEAN DEFAULT true,
  
  -- Metadata
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ DEFAULT now(),
  joined_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_org_member_role CHECK (role IN ('admin', 'user', 'viewer')),
  CONSTRAINT unique_org_user UNIQUE (org_id, user_id)
);

-- Indexes for org_members
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON public.org_members(org_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON public.org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON public.org_members(role);
CREATE INDEX IF NOT EXISTS idx_org_members_ativo ON public.org_members(ativo);

-- Trigger for updated_at
CREATE TRIGGER update_org_members_updated_at
  BEFORE UPDATE ON public.org_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Enable RLS on org_members
-- ============================================

ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

-- Policy: Fartech admins see all org_members
DROP POLICY IF EXISTS "Fartech admins see all org members" ON public.org_members;
CREATE POLICY "Fartech admins see all org members"
  ON public.org_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_fartech_admin = TRUE
    )
  );

-- Policy: Users see members in their organization
DROP POLICY IF EXISTS "Users see their organization members" ON public.org_members;
CREATE POLICY "Users see their organization members"
  ON public.org_members FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
      AND ativo = true
    )
  );

-- Policy: Org admins can manage members in their org
DROP POLICY IF EXISTS "Org admins manage their org members" ON public.org_members;
CREATE POLICY "Org admins manage their org members"
  ON public.org_members FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND ativo = true
    )
  );

-- Policy: Fartech admins can manage all org_members
DROP POLICY IF EXISTS "Fartech admins manage all org members" ON public.org_members;
CREATE POLICY "Fartech admins manage all org members"
  ON public.org_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_fartech_admin = TRUE
    )
  );

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.org_members IS 'Organization members - tracks user memberships and roles within organizations';
COMMENT ON COLUMN public.org_members.role IS 'Member role: admin (can manage org and users), user (standard access), viewer (read-only)';
COMMENT ON COLUMN public.org_members.ativo IS 'Whether this membership is active';
COMMENT ON COLUMN public.org_members.invited_by IS 'User who invited this member';
COMMENT ON COLUMN public.org_members.joined_at IS 'When the user accepted the invitation and joined';

-- ============================================
-- Create alias view for backward compatibility
-- ============================================

-- Some functions reference organization_members, create a view for compatibility
CREATE OR REPLACE VIEW public.organization_members AS
SELECT * FROM public.org_members;

COMMENT ON VIEW public.organization_members IS 'View for backward compatibility - references org_members table';
