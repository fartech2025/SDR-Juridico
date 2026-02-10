-- Migration: Índice para link Lead → Caso
-- Data: 2026-02-10
-- Descrição: Melhora performance de queries que buscam casos por lead_id

CREATE INDEX IF NOT EXISTS idx_casos_lead_id
  ON public.casos(lead_id)
  WHERE lead_id IS NOT NULL;
