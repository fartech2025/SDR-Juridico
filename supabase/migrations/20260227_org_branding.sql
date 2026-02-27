-- =====================================================================
-- MIGRATION: org_branding + org_logos storage bucket
-- Configurações visuais por escritório para personalização de PDFs:
-- logo, cores, nome, OAB, endereço, rodapé.
-- Registro único por organização (UNIQUE org_id).
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.org_branding (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL UNIQUE REFERENCES public.orgs(id) ON DELETE CASCADE,
  -- URL pública da logo (armazenada no bucket org-logos ou no Drive da org)
  logo_url          TEXT,
  -- Cores do escritório para cabeçalho dos documentos
  cor_primaria      TEXT NOT NULL DEFAULT '#721011',
  cor_secundaria    TEXT NOT NULL DEFAULT '#BF6F32',
  -- Dados do cabeçalho
  nome_display      TEXT,          -- Ex: "Silva & Associados Advogados"
  oab_registro      TEXT,          -- Ex: "OAB/MG 123.456" ou "OAB/SP 98.765"
  -- Dados do rodapé
  endereco          TEXT,          -- Ex: "Av. Afonso Pena, 1234 - Belo Horizonte/MG"
  telefone          TEXT,          -- Ex: "(31) 99999-0000"
  rodape_texto      TEXT,          -- Texto livre para rodapé customizado
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_org_branding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_org_branding_updated_at ON public.org_branding;
CREATE TRIGGER trg_org_branding_updated_at
  BEFORE UPDATE ON public.org_branding
  FOR EACH ROW EXECUTE FUNCTION update_org_branding_updated_at();

-- RLS
ALTER TABLE public.org_branding ENABLE ROW LEVEL SECURITY;

-- Qualquer membro pode ver o branding da sua org
CREATE POLICY "org_branding_select"
  ON public.org_branding FOR SELECT
  USING (is_org_member(org_id));

-- Apenas org_admin pode criar/atualizar/deletar
CREATE POLICY "org_branding_insert"
  ON public.org_branding FOR INSERT
  WITH CHECK (is_org_admin_for_org(org_id));

CREATE POLICY "org_branding_update"
  ON public.org_branding FOR UPDATE
  USING (is_org_admin_for_org(org_id));

CREATE POLICY "org_branding_delete"
  ON public.org_branding FOR DELETE
  USING (is_org_admin_for_org(org_id));

-- =====================================================================
-- STORAGE BUCKET: org-logos
-- Bucket público para logos dos escritórios.
-- Path padrão: {orgId}/logo.{ext}
-- =====================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'org-logos',
  'org-logos',
  true,   -- público: logos são exibidas no cabeçalho de PDFs enviados ao cliente
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Qualquer usuário autenticado pode fazer upload na pasta da sua org
CREATE POLICY "org_logos_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'org-logos'
    AND auth.role() = 'authenticated'
  );

-- Leitura pública (logos são exibidas em PDFs)
CREATE POLICY "org_logos_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'org-logos');

-- Apenas quem fez upload pode atualizar/deletar
CREATE POLICY "org_logos_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'org-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "org_logos_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'org-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
