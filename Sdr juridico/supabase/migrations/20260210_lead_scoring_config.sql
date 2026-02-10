-- Migration: Lead Scoring Configuration
-- Data: 2026-02-10
-- Descrição: Tabela para configuração de pesos do scoring de leads por organização

CREATE TABLE IF NOT EXISTS public.lead_scoring_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  config JSONB NOT NULL DEFAULT '{
    "recencyWeight": 30,
    "estimatedValueWeight": 20,
    "areaWeight": 15,
    "channelWeight": 10,
    "interactionWeight": 15,
    "completenessWeight": 10
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(org_id)
);

-- Índice
CREATE INDEX IF NOT EXISTS idx_lead_scoring_configs_org
  ON public.lead_scoring_configs(org_id);

-- RLS
ALTER TABLE public.lead_scoring_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_scoring_configs_select_org_member"
  ON public.lead_scoring_configs
  FOR SELECT USING (is_org_member(org_id));

CREATE POLICY "lead_scoring_configs_insert_org_admin"
  ON public.lead_scoring_configs
  FOR INSERT WITH CHECK (is_org_admin_for_org(org_id));

CREATE POLICY "lead_scoring_configs_update_org_admin"
  ON public.lead_scoring_configs
  FOR UPDATE USING (is_org_admin_for_org(org_id));

CREATE POLICY "lead_scoring_configs_delete_org_admin"
  ON public.lead_scoring_configs
  FOR DELETE USING (is_org_admin_for_org(org_id));

-- Trigger para atualizar updated_at
CREATE OR REPLACE TRIGGER update_lead_scoring_configs_updated_at
  BEFORE UPDATE ON public.lead_scoring_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.lead_scoring_configs IS 'Configuração de pesos do motor de scoring de leads por organização';
