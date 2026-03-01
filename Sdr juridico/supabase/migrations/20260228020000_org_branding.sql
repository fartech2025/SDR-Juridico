-- =====================================================================
-- Migration: org_branding
-- Configurações de aparência e branding por organização
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.org_branding (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         UUID NOT NULL UNIQUE REFERENCES public.orgs(id) ON DELETE CASCADE,
  logo_url       TEXT,
  cor_primaria   TEXT NOT NULL DEFAULT '#721011',
  cor_secundaria TEXT NOT NULL DEFAULT '#BF6F32',
  nome_display   TEXT,
  oab_registro   TEXT,
  endereco       TEXT,
  telefone       TEXT,
  rodape_texto   TEXT,
  marca_dagua    TEXT DEFAULT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_org_branding_updated_at ON public.org_branding;
CREATE TRIGGER trg_org_branding_updated_at
  BEFORE UPDATE ON public.org_branding
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.org_branding ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "branding_select" ON public.org_branding;
CREATE POLICY "branding_select" ON public.org_branding
  FOR SELECT USING (is_org_member(org_id));

DROP POLICY IF EXISTS "branding_all" ON public.org_branding;
CREATE POLICY "branding_all" ON public.org_branding
  FOR ALL USING (is_org_admin_for_org(org_id));
