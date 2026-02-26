-- Migration: Modulo Financeiro
-- Data: 2026-02-25
-- Descricao: Tabela de lancamentos financeiros (receitas/despesas) por organizacao

CREATE TABLE IF NOT EXISTS public.financeiro_lancamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  status TEXT NOT NULL DEFAULT 'previsto' CHECK (status IN ('previsto', 'pago', 'atrasado')),
  categoria TEXT NOT NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC(14,2) NOT NULL CHECK (valor >= 0),
  vencimento DATE NOT NULL,
  pago_em DATE,
  cliente TEXT,
  caso_id UUID REFERENCES public.casos(id) ON DELETE SET NULL,
  recorrente BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_financeiro_lancamentos_org_vencimento
  ON public.financeiro_lancamentos(org_id, vencimento DESC);

CREATE INDEX IF NOT EXISTS idx_financeiro_lancamentos_org_tipo_status
  ON public.financeiro_lancamentos(org_id, tipo, status);

ALTER TABLE public.financeiro_lancamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "financeiro_select_org_member" ON public.financeiro_lancamentos;
CREATE POLICY "financeiro_select_org_member"
  ON public.financeiro_lancamentos
  FOR SELECT
  USING (is_org_member(org_id));

DROP POLICY IF EXISTS "financeiro_insert_org_member" ON public.financeiro_lancamentos;
CREATE POLICY "financeiro_insert_org_member"
  ON public.financeiro_lancamentos
  FOR INSERT
  WITH CHECK (is_org_member(org_id));

DROP POLICY IF EXISTS "financeiro_update_org_member" ON public.financeiro_lancamentos;
CREATE POLICY "financeiro_update_org_member"
  ON public.financeiro_lancamentos
  FOR UPDATE
  USING (is_org_member(org_id))
  WITH CHECK (is_org_member(org_id));

DROP POLICY IF EXISTS "financeiro_delete_org_admin" ON public.financeiro_lancamentos;
CREATE POLICY "financeiro_delete_org_admin"
  ON public.financeiro_lancamentos
  FOR DELETE
  USING (is_org_admin_for_org(org_id));

CREATE OR REPLACE FUNCTION public.financeiro_lancamentos_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_financeiro_lancamentos_set_updated_at ON public.financeiro_lancamentos;
CREATE TRIGGER trg_financeiro_lancamentos_set_updated_at
BEFORE UPDATE ON public.financeiro_lancamentos
FOR EACH ROW
EXECUTE FUNCTION public.financeiro_lancamentos_set_updated_at();

COMMENT ON TABLE public.financeiro_lancamentos IS 'Lancamentos financeiros por organizacao para o modulo financeiro';
