-- Migration: add marca_dagua column to org_branding
-- Allows each org to configure a diagonal watermark text on generated PDFs.

ALTER TABLE public.org_branding
  ADD COLUMN IF NOT EXISTS marca_dagua TEXT DEFAULT NULL;

COMMENT ON COLUMN public.org_branding.marca_dagua IS
  'Texto da marca d''água diagonal nos PDFs gerados (ex: RASCUNHO, CONFIDENCIAL). NULL = desativado.';
