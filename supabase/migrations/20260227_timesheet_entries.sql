-- =====================================================================
-- MIGRATION: timesheet_entries
-- Controle de horas trabalhadas por advogado/caso.
-- Integração com financeiro_lancamentos: ao "faturar período",
-- o sistema cria lançamentos de honorários automaticamente.
-- Sem soft delete — segue padrão do módulo Financeiro.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.timesheet_entries (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  responsavel_user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  caso_id               UUID REFERENCES public.casos(id) ON DELETE SET NULL,
  data                  DATE NOT NULL,
  horas                 NUMERIC(5,2) NOT NULL CHECK (horas > 0 AND horas <= 24),
  descricao             TEXT NOT NULL,
  taxa_horaria          NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (taxa_horaria >= 0),
  -- Coluna calculada: horas × taxa_horaria — sem custo de manutenção
  valor_total           NUMERIC(14,2) GENERATED ALWAYS AS (horas * taxa_horaria) STORED,
  -- 'billable' = horas faturáveis ao cliente | 'non_billable' = horas internas
  tipo                  TEXT NOT NULL DEFAULT 'billable'
                          CHECK (tipo IN ('billable', 'non_billable')),
  -- rascunho → aprovado → faturado
  status                TEXT NOT NULL DEFAULT 'rascunho'
                          CHECK (status IN ('rascunho', 'aprovado', 'faturado')),
  -- Preenchido após faturamento: referência ao lançamento criado em financeiro_lancamentos
  lancamento_id         UUID REFERENCES public.financeiro_lancamentos(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
  -- SEM deleted_at: segue padrão do módulo Financeiro (hard delete permitido apenas para rascunhos)
);

-- Índices para queries comuns
CREATE INDEX IF NOT EXISTS idx_timesheet_org_data
  ON public.timesheet_entries(org_id, data DESC);

CREATE INDEX IF NOT EXISTS idx_timesheet_org_responsavel
  ON public.timesheet_entries(org_id, responsavel_user_id, data DESC);

CREATE INDEX IF NOT EXISTS idx_timesheet_org_caso
  ON public.timesheet_entries(org_id, caso_id)
  WHERE caso_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_timesheet_org_status
  ON public.timesheet_entries(org_id, status);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_timesheet_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_timesheet_entries_updated_at ON public.timesheet_entries;
CREATE TRIGGER trg_timesheet_entries_updated_at
  BEFORE UPDATE ON public.timesheet_entries
  FOR EACH ROW EXECUTE FUNCTION update_timesheet_entries_updated_at();

-- RLS
ALTER TABLE public.timesheet_entries ENABLE ROW LEVEL SECURITY;

-- Qualquer membro da org vê todas as entradas
CREATE POLICY "timesheet_select"
  ON public.timesheet_entries FOR SELECT
  USING (is_org_member(org_id));

-- Qualquer membro pode registrar horas
CREATE POLICY "timesheet_insert"
  ON public.timesheet_entries FOR INSERT
  WITH CHECK (is_org_member(org_id));

-- Dono da entrada ou org_admin pode editar
-- (regra de negócio: apenas rascunhos editáveis — aplicada no service)
CREATE POLICY "timesheet_update"
  ON public.timesheet_entries FOR UPDATE
  USING (
    responsavel_user_id = auth.uid()
    OR is_org_admin_for_org(org_id)
  );

-- Apenas org_admin deleta (service garante que só rascunhos são deletáveis)
CREATE POLICY "timesheet_delete"
  ON public.timesheet_entries FOR DELETE
  USING (is_org_admin_for_org(org_id));
