-- Migration: Financeiro responsavel por carteira
-- Data: 2026-02-25
-- Descricao: adiciona responsavel (advogado/gestor) aos lancamentos financeiros

ALTER TABLE public.financeiro_lancamentos
  ADD COLUMN IF NOT EXISTS responsavel_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_financeiro_lancamentos_org_responsavel
  ON public.financeiro_lancamentos(org_id, responsavel_user_id);

COMMENT ON COLUMN public.financeiro_lancamentos.responsavel_user_id IS 'Usuario responsavel pela carteira financeira do lancamento';
