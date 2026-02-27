-- =====================================================================
-- MIGRATION: drive_integration
-- Adiciona suporte a Google Drive / OneDrive como backend de storage
-- para documentos gerados. Quando drive_file_id IS NOT NULL, o documento
-- está no Drive — sem custo de Supabase Storage.
-- =====================================================================

-- Campos drive na tabela documentos
ALTER TABLE public.documentos
  ADD COLUMN IF NOT EXISTS drive_file_id  TEXT,
  ADD COLUMN IF NOT EXISTS drive_provider TEXT
    CHECK (drive_provider IN ('google_drive', 'onedrive')),
  ADD COLUMN IF NOT EXISTS drive_url      TEXT;

-- Índice para localizar documentos por Drive file (útil para sync/dedup)
CREATE INDEX IF NOT EXISTS idx_documentos_drive_file
  ON public.documentos(drive_file_id)
  WHERE drive_file_id IS NOT NULL;

-- =====================================================================
-- Coluna drive_folder_id em casos
-- Armazena o ID da pasta "SDR Jurídico / Caso - X" no Drive.
-- Criada na primeira geração de documento para o caso — evita
-- re-criar a pasta a cada geração.
-- =====================================================================

ALTER TABLE public.casos
  ADD COLUMN IF NOT EXISTS drive_folder_id TEXT;

-- Índice para busca rápida de casos com pasta Drive associada
CREATE INDEX IF NOT EXISTS idx_casos_drive_folder
  ON public.casos(org_id, drive_folder_id)
  WHERE drive_folder_id IS NOT NULL;
