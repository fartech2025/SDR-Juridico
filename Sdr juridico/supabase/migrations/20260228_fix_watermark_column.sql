-- Migration: garantir coluna marca_dagua em org_branding
-- Idempotente — ADD COLUMN IF NOT EXISTS é seguro de rodar mesmo que a coluna já exista.
-- Necessário para bancos onde org_branding foi criada antes da v2.9.0.

ALTER TABLE public.org_branding
  ADD COLUMN IF NOT EXISTS marca_dagua TEXT DEFAULT NULL;

COMMENT ON COLUMN public.org_branding.marca_dagua IS
  'Texto da marca d''água diagonal nos PDFs gerados (ex: RASCUNHO, CONFIDENCIAL). NULL = desativado.';
