-- =====================================================
-- Migration: Adicionar 'proposta' como status válido de leads
-- Data: 2026-02-10
-- Descrição: O status 'proposta' estava sendo mapeado para 'qualificado'
--            no service layer, impedindo leads de ficarem nessa etapa.
--            Esta migration garante que o banco aceita 'proposta' diretamente.
-- =====================================================

-- Remove a constraint antiga de status (se existir)
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;

-- Adiciona nova constraint incluindo 'proposta'
ALTER TABLE leads ADD CONSTRAINT leads_status_check
  CHECK (status IN ('novo', 'em_contato', 'em_triagem', 'qualificado', 'proposta', 'nao_qualificado', 'convertido', 'ganho', 'perdido'));
