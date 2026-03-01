-- =====================================================================
-- Migration: documento_templates
-- Tabela de templates de documentos jurídicos com variáveis
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.documento_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  titulo      TEXT NOT NULL,
  categoria   TEXT NOT NULL DEFAULT 'outro',
  conteudo    TEXT NOT NULL DEFAULT '',
  variaveis   JSONB NOT NULL DEFAULT '[]',
  criado_por  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ,
  deleted_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_doc_templates_org
  ON public.documento_templates(org_id)
  WHERE deleted_at IS NULL;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_documento_templates_updated_at ON public.documento_templates;
CREATE TRIGGER trg_documento_templates_updated_at
  BEFORE UPDATE ON public.documento_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.documento_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "templates_select" ON public.documento_templates;
CREATE POLICY "templates_select" ON public.documento_templates
  FOR SELECT USING (is_org_member(org_id) AND deleted_at IS NULL);

DROP POLICY IF EXISTS "templates_insert" ON public.documento_templates;
CREATE POLICY "templates_insert" ON public.documento_templates
  FOR INSERT WITH CHECK (is_org_member(org_id));

DROP POLICY IF EXISTS "templates_update" ON public.documento_templates;
CREATE POLICY "templates_update" ON public.documento_templates
  FOR UPDATE USING (is_org_admin_for_org(org_id));
