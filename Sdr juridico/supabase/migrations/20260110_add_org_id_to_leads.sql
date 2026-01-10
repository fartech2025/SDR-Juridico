-- Add org_id column to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_org_id ON leads(org_id);

-- Update existing rows to use the first organization (if any)
UPDATE leads 
SET org_id = (SELECT id FROM organizations LIMIT 1)
WHERE org_id IS NULL;
