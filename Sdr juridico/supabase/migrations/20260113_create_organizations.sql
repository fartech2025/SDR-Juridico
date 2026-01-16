-- Migration: Create orgs table and multi-tenancy structure
-- Date: 2026-01-13
-- Description: Adds multi-tenant support with organizations

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABLE: orgs
-- ============================================
CREATE TABLE IF NOT EXISTS orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  cnpj VARCHAR(18) UNIQUE,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address JSONB DEFAULT '{}',
  
  -- Plan and Limits
  plan VARCHAR(50) DEFAULT 'trial', -- trial, basic, professional, enterprise
  max_users INTEGER DEFAULT 5,
  max_storage_gb INTEGER DEFAULT 10,
  max_cases INTEGER,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, active, suspended, cancelled
  
  -- Billing
  billing_email VARCHAR(255),
  billing_cycle VARCHAR(20) DEFAULT 'monthly', -- monthly, yearly
  next_billing_date TIMESTAMP,
  
  -- Branding/Customization
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#059669', -- emerald-600
  secondary_color VARCHAR(7),
  custom_domain VARCHAR(255),
  
  -- Metadata
  settings JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  activated_at TIMESTAMP,
  suspended_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  
  -- Management
  provisioned_by UUID, -- Fartech admin who created
  managed_by UUID, -- Current org admin
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('pending', 'active', 'suspended', 'cancelled')),
  CONSTRAINT valid_plan CHECK (plan IN ('trial', 'basic', 'professional', 'enterprise')),
  CONSTRAINT valid_billing_cycle CHECK (billing_cycle IN ('monthly', 'yearly'))
);

-- Indexes for orgs
CREATE INDEX idx_orgs_slug ON orgs(slug);
CREATE INDEX idx_orgs_status ON orgs(status);
CREATE INDEX idx_orgs_cnpj ON orgs(cnpj);
CREATE INDEX idx_orgs_plan ON orgs(plan);
CREATE INDEX idx_orgs_created_at ON orgs(created_at);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orgs_updated_at
  BEFORE UPDATE ON orgs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: users - Add multi-tenancy columns
-- ============================================

-- Add org_id and role columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user',
ADD COLUMN IF NOT EXISTS is_fartech_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS department VARCHAR(100),
ADD COLUMN IF NOT EXISTS position VARCHAR(100),
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add constraint for role
ALTER TABLE users
ADD CONSTRAINT valid_user_role CHECK (role IN ('fartech_admin', 'org_admin', 'user'));

-- Indexes for users
CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_fartech_admin ON users(is_fartech_admin);

-- Update foreign keys
ALTER TABLE orgs
ADD CONSTRAINT fk_orgs_provisioned_by 
  FOREIGN KEY (provisioned_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE orgs
ADD CONSTRAINT fk_orgs_managed_by 
  FOREIGN KEY (managed_by) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================
-- Enable RLS on orgs
-- ============================================

ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;

-- Policy: Fartech admins see all orgs
CREATE POLICY "Fartech admins see all orgs"
  ON orgs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_fartech_admin = TRUE
    )
  );

-- Policy: Org admins see their own organization
CREATE POLICY "Org admins see their organization"
  ON orgs FOR SELECT
  USING (
    id = (
      SELECT org_id FROM users
      WHERE users.id = auth.uid()
    )
  );

-- Policy: Fartech admins can manage all organizations
CREATE POLICY "Fartech admins manage all organizations"
  ON orgs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_fartech_admin = TRUE
    )
  );

-- Policy: Org admins can update their organization
CREATE POLICY "Org admins update their organization"
  ON orgs FOR UPDATE
  USING (
    id = (
      SELECT org_id FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'org_admin'
    )
  );

-- ============================================
-- Enable RLS on users
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Fartech admins see all users
CREATE POLICY "Fartech admins see all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.is_fartech_admin = TRUE
    )
  );

-- Policy: Org admins see users in their organization
CREATE POLICY "Org admins see their organization users"
  ON users FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM users
      WHERE id = auth.uid()
      AND role IN ('org_admin', 'fartech_admin')
    )
  );

-- Policy: Users see users in their organization
CREATE POLICY "Users see their organization members"
  ON users FOR SELECT
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

-- Policy: Users can update their own profile
CREATE POLICY "Users update their own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- Policy: Org admins manage users in their org
CREATE POLICY "Org admins manage their org users"
  ON users FOR ALL
  USING (
    org_id = (
      SELECT org_id FROM users
      WHERE id = auth.uid()
      AND role IN ('org_admin', 'fartech_admin')
    )
  );

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE orgs IS 'Multi-tenant organizations (law firms)';
COMMENT ON COLUMN orgs.slug IS 'URL-friendly identifier for the organization';
COMMENT ON COLUMN orgs.status IS 'pending: awaiting activation, active: operational, suspended: temporarily disabled, cancelled: permanently closed';
COMMENT ON COLUMN orgs.plan IS 'Subscription plan level';
COMMENT ON COLUMN orgs.provisioned_by IS 'Fartech admin who created this organization';
COMMENT ON COLUMN orgs.managed_by IS 'Current organization administrator';

COMMENT ON COLUMN users.org_id IS 'Organization this user belongs to';
COMMENT ON COLUMN users.role IS 'User role: fartech_admin (Fartech super admin), org_admin (organization manager), user (regular user)';
COMMENT ON COLUMN users.is_fartech_admin IS 'Quick flag to identify Fartech super admins';
