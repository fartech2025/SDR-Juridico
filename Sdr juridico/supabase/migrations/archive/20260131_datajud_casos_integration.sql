-- ============================================================
-- MIGRATION: 20260131_datajud_casos_integration.sql
-- Descricao: Integração completa DataJud com tabela casos
-- Adiciona campos de processo judicial, sync status, e auditoria
-- Data: 31 de janeiro de 2026
-- ============================================================

BEGIN;

-- ============================================================
-- PARTE 1: ESTENDER TABELA CASOS
-- ============================================================

-- Adicionar campos para sincronização DataJud
ALTER TABLE public.casos 
ADD COLUMN IF NOT EXISTS numero_processo TEXT UNIQUE;

ALTER TABLE public.casos 
ADD COLUMN IF NOT EXISTS tribunal TEXT;

ALTER TABLE public.casos 
ADD COLUMN IF NOT EXISTS grau TEXT;

ALTER TABLE public.casos 
ADD COLUMN IF NOT EXISTS classe_processual TEXT;

ALTER TABLE public.casos 
ADD COLUMN IF NOT EXISTS assunto_principal TEXT;

ALTER TABLE public.casos 
ADD COLUMN IF NOT EXISTS datajud_processo_id UUID;

ALTER TABLE public.casos 
ADD COLUMN IF NOT EXISTS datajud_last_sync_at TIMESTAMPTZ;

ALTER TABLE public.casos 
ADD COLUMN IF NOT EXISTS datajud_sync_error TEXT;

-- Adicionar coluna de status com valor padrão
ALTER TABLE public.casos 
ADD COLUMN IF NOT EXISTS datajud_sync_status TEXT DEFAULT 'nunca_sincronizado';

-- Adicionar coluna de cache
ALTER TABLE public.casos 
ADD COLUMN IF NOT EXISTS cached_at TIMESTAMPTZ DEFAULT now();

-- Adicionar constraint de check separadamente
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.casos 
    ADD CONSTRAINT casos_datajud_sync_status_check 
    CHECK (datajud_sync_status IN ('nunca_sincronizado', 'sincronizado', 'em_erro', 'pendente_sync'));
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END$$;

-- Verificar que coluna datajud_processo_id foi criada (crucial para a view depois)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'casos' AND column_name = 'datajud_processo_id'
  ) THEN
    ALTER TABLE public.casos ADD COLUMN datajud_processo_id UUID;
  END IF;
END$$;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_casos_numero_processo 
  ON public.casos(numero_processo) WHERE numero_processo IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_casos_datajud_processo_id 
  ON public.casos(datajud_processo_id) WHERE datajud_processo_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_casos_tribunal 
  ON public.casos(tribunal) WHERE tribunal IS NOT NULL;

-- ============================================================
-- PARTE 2: TABELA DATAJUD_PROCESSOS (se não existir)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.datajud_processos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_processo TEXT NOT NULL UNIQUE,
  tribunal TEXT NOT NULL,
  grau TEXT,
  classe_processual TEXT,
  assunto TEXT,
  dataAjuizamento TIMESTAMPTZ,
  dataAtualizacao TIMESTAMPTZ,
  sigiloso BOOLEAN DEFAULT FALSE,
  raw_response JSONB,
  cached_at TIMESTAMPTZ DEFAULT now(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Adicionar colunas faltantes se tabela já existir (uma por uma para evitar erros)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'datajud_processos') THEN
    BEGIN
      ALTER TABLE public.datajud_processos ADD COLUMN IF NOT EXISTS cached_at TIMESTAMPTZ DEFAULT now();
      ALTER TABLE public.datajud_processos ADD COLUMN IF NOT EXISTS raw_response JSONB;
      ALTER TABLE public.datajud_processos ADD COLUMN IF NOT EXISTS sigiloso BOOLEAN DEFAULT FALSE;
      ALTER TABLE public.datajud_processos ADD COLUMN IF NOT EXISTS dataAtualizacao TIMESTAMPTZ;
      ALTER TABLE public.datajud_processos ADD COLUMN IF NOT EXISTS dataAjuizamento TIMESTAMPTZ;
      ALTER TABLE public.datajud_processos ADD COLUMN IF NOT EXISTS assunto TEXT;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
END$$;

-- Índices para datajud_processos
CREATE INDEX IF NOT EXISTS idx_datajud_processos_numero_tribunal 
  ON public.datajud_processos(numero_processo, tribunal);
CREATE INDEX IF NOT EXISTS idx_datajud_processos_org_id 
  ON public.datajud_processos(org_id);
CREATE INDEX IF NOT EXISTS idx_datajud_processos_cached_at 
  ON public.datajud_processos(cached_at);

-- ============================================================
-- PARTE 3: TABELA DATAJUD_MOVIMENTACOES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.datajud_movimentacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  datajud_processo_id UUID NOT NULL REFERENCES public.datajud_processos(id) ON DELETE CASCADE,
  codigo TEXT,
  nome TEXT NOT NULL,
  data_hora TIMESTAMPTZ NOT NULL,
  complemento TEXT,
  raw_response JSONB,
  detected_at TIMESTAMPTZ DEFAULT now(),
  notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Garantir coluna atualizada (renomeia antiga <processo_id>)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'datajud_movimentacoes'
      AND column_name = 'processo_id'
  ) THEN
    ALTER TABLE public.datajud_movimentacoes
    RENAME COLUMN processo_id TO datajud_processo_id;
  END IF;
END$$;

-- Criar coluna data_hora caso tabela antiga ainda use data_movimentacao
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'datajud_movimentacoes'
      AND column_name = 'data_hora'
  ) THEN
    ALTER TABLE public.datajud_movimentacoes
    ADD COLUMN data_hora TIMESTAMPTZ;

    UPDATE public.datajud_movimentacoes
    SET data_hora = data_movimentacao::timestamptz
    WHERE data_hora IS NULL AND data_movimentacao IS NOT NULL;
  END IF;
END$$;

-- Garantir demais colunas novas existem antes dos índices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'datajud_movimentacoes'
      AND column_name = 'nome'
  ) THEN
    ALTER TABLE public.datajud_movimentacoes
    ADD COLUMN nome TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'datajud_movimentacoes'
      AND column_name = 'complemento'
  ) THEN
    ALTER TABLE public.datajud_movimentacoes
    ADD COLUMN complemento TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'datajud_movimentacoes'
      AND column_name = 'raw_response'
  ) THEN
    ALTER TABLE public.datajud_movimentacoes
    ADD COLUMN raw_response JSONB;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'datajud_movimentacoes'
      AND column_name = 'detected_at'
  ) THEN
    ALTER TABLE public.datajud_movimentacoes
    ADD COLUMN detected_at TIMESTAMPTZ DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'datajud_movimentacoes'
      AND column_name = 'notified'
  ) THEN
    ALTER TABLE public.datajud_movimentacoes
    ADD COLUMN notified BOOLEAN DEFAULT FALSE;
  END IF;
END$$;

-- Índices para datajud_movimentacoes
CREATE INDEX IF NOT EXISTS idx_datajud_movimentacoes_processo_id 
  ON public.datajud_movimentacoes(datajud_processo_id);
CREATE INDEX IF NOT EXISTS idx_datajud_movimentacoes_data_hora 
  ON public.datajud_movimentacoes(data_hora DESC);
CREATE INDEX IF NOT EXISTS idx_datajud_movimentacoes_notified 
  ON public.datajud_movimentacoes(notified);

-- ============================================================
-- PARTE 4: TABELA DATAJUD_API_CALLS (Auditoria)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.datajud_api_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  tribunal TEXT,
  search_query TEXT,
  resultado_count INTEGER,
  api_latency_ms INTEGER,
  status_code INTEGER,
  error_message TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para datajud_api_calls (auditoria)
CREATE INDEX IF NOT EXISTS idx_datajud_api_calls_user_id 
  ON public.datajud_api_calls(user_id);
CREATE INDEX IF NOT EXISTS idx_datajud_api_calls_org_id 
  ON public.datajud_api_calls(org_id);
CREATE INDEX IF NOT EXISTS idx_datajud_api_calls_created_at 
  ON public.datajud_api_calls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_datajud_api_calls_tribunal 
  ON public.datajud_api_calls(tribunal);

-- ============================================================
-- PARTE 5: TABELA DATAJUD_SYNC_JOBS (Rastreamento de jobs de sync)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.datajud_sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id UUID NOT NULL REFERENCES public.casos(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'em_progresso', 'sucesso', 'erro')),
  tentativas INTEGER DEFAULT 0,
  proximo_retry TIMESTAMPTZ,
  erro_mensagem TEXT,
  resultado JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Garantir colunas extras existentes (compatibilidade com schema legado)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'datajud_sync_jobs'
      AND column_name = 'caso_id'
  ) THEN
    ALTER TABLE public.datajud_sync_jobs
    ADD COLUMN caso_id UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'datajud_sync_jobs'
      AND column_name = 'tentativas'
  ) THEN
    ALTER TABLE public.datajud_sync_jobs
    ADD COLUMN tentativas INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'datajud_sync_jobs'
      AND column_name = 'proximo_retry'
  ) THEN
    ALTER TABLE public.datajud_sync_jobs
    ADD COLUMN proximo_retry TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'datajud_sync_jobs'
      AND column_name = 'erro_mensagem'
  ) THEN
    ALTER TABLE public.datajud_sync_jobs
    ADD COLUMN erro_mensagem TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'datajud_sync_jobs'
      AND column_name = 'resultado'
  ) THEN
    ALTER TABLE public.datajud_sync_jobs
    ADD COLUMN resultado JSONB;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'datajud_sync_jobs'
      AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE public.datajud_sync_jobs
    ADD COLUMN completed_at TIMESTAMPTZ;
  END IF;
END$$;

-- Garantir constraint de FK em casos (apenas se coluna existir)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'datajud_sync_jobs'
      AND column_name = 'caso_id'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'datajud_sync_jobs'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'caso_id'
    ) THEN
      ALTER TABLE public.datajud_sync_jobs
      ADD CONSTRAINT datajud_sync_jobs_caso_id_fkey FOREIGN KEY (caso_id) REFERENCES public.casos(id);
    END IF;
  END IF;
END$$;

-- Índices para datajud_sync_jobs
CREATE INDEX IF NOT EXISTS idx_datajud_sync_jobs_caso_id 
  ON public.datajud_sync_jobs(caso_id);
CREATE INDEX IF NOT EXISTS idx_datajud_sync_jobs_status 
  ON public.datajud_sync_jobs(status);
CREATE INDEX IF NOT EXISTS idx_datajud_sync_jobs_proximo_retry 
  ON public.datajud_sync_jobs(proximo_retry) WHERE status = 'pendente';

-- ============================================================
-- PARTE 6: VERIFICAR COLUNA ANTES DE CRIAR VIEW
-- ============================================================

-- Garantir absolutamente que a coluna datajud_processo_id existe
DO $$
BEGIN
  -- Se a coluna não existir, criar
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'casos' AND column_name = 'datajud_processo_id'
  ) THEN
    ALTER TABLE public.casos ADD COLUMN datajud_processo_id UUID;
  END IF;
END$$;

-- ============================================================
-- PARTE 7: VIEW PARA CASOS COM DATAJUD
-- ============================================================

-- Remover view se existir (com segurança)
DROP VIEW IF EXISTS public.v_casos_com_datajud CASCADE;

-- Criar view após garantir que todas as colunas existem
CREATE VIEW public.v_casos_com_datajud AS
SELECT 
  c.id,
  c.titulo,
  c.area,
  c.status,
  c.fase_atual AS stage,
  c.numero_processo,
  c.tribunal,
  c.grau,
  c.classe_processual,
  c.assunto_principal,
  c.datajud_sync_status,
  c.datajud_last_sync_at,
  dp.id as datajud_processo_id,
  dp."dataAtualizacao" as ultima_atualizacao_datajud,
  COUNT(DISTINCT dm.id) as total_movimentacoes
FROM public.casos c
LEFT JOIN public.datajud_processos dp ON c.datajud_processo_id = dp.id
LEFT JOIN public.datajud_movimentacoes dm ON dp.id = dm.datajud_processo_id
GROUP BY 
  c.id, c.titulo, c.area, c.status, c.fase_atual, 
  c.numero_processo, c.tribunal, c.grau, c.classe_processual, 
  c.assunto_principal, c.datajud_sync_status, c.datajud_last_sync_at,
  dp.id, dp."dataAtualizacao";

-- ============================================================
-- PARTE 8: RLS POLICIES PARA TABELAS DATAJUD
-- ============================================================

-- Habilitar RLS
ALTER TABLE public.datajud_processos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.datajud_movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.datajud_api_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.datajud_sync_jobs ENABLE ROW LEVEL SECURITY;

-- DATAJUD_PROCESSOS - SELECT
DROP POLICY IF EXISTS "datajud_processos_select_org_member" ON public.datajud_processos;
CREATE POLICY "datajud_processos_select_org_member"
ON public.datajud_processos FOR SELECT
USING (
  is_org_member(org_id)
);

-- DATAJUD_PROCESSOS - INSERT (apenas org_admin/gestor)
DROP POLICY IF EXISTS "datajud_processos_insert_org_admin" ON public.datajud_processos;
CREATE POLICY "datajud_processos_insert_org_admin"
ON public.datajud_processos FOR INSERT
WITH CHECK (
  is_org_admin_for_org(org_id)
);

-- DATAJUD_PROCESSOS - UPDATE (apenas org_admin/gestor)
DROP POLICY IF EXISTS "datajud_processos_update_org_admin" ON public.datajud_processos;
CREATE POLICY "datajud_processos_update_org_admin"
ON public.datajud_processos FOR UPDATE
USING (
  is_org_admin_for_org(org_id)
)
WITH CHECK (
  is_org_admin_for_org(org_id)
);

-- DATAJUD_MOVIMENTACOES - SELECT
DROP POLICY IF EXISTS "datajud_movimentacoes_select_org_member" ON public.datajud_movimentacoes;
CREATE POLICY "datajud_movimentacoes_select_org_member"
ON public.datajud_movimentacoes FOR SELECT
USING (
  is_org_member(
    (SELECT org_id FROM public.datajud_processos WHERE id = datajud_processo_id)
  )
);

-- DATAJUD_API_CALLS - SELECT (próprios registros ou org_admin)
DROP POLICY IF EXISTS "datajud_api_calls_select" ON public.datajud_api_calls;
CREATE POLICY "datajud_api_calls_select"
ON public.datajud_api_calls FOR SELECT
USING (
  user_id = auth.uid() OR is_org_admin_for_org(org_id)
);

-- DATAJUD_API_CALLS - INSERT
DROP POLICY IF EXISTS "datajud_api_calls_insert" ON public.datajud_api_calls;
CREATE POLICY "datajud_api_calls_insert"
ON public.datajud_api_calls FOR INSERT
WITH CHECK (
  is_org_member(org_id) AND user_id = auth.uid()
);

-- DATAJUD_SYNC_JOBS - SELECT
DROP POLICY IF EXISTS "datajud_sync_jobs_select_org_member" ON public.datajud_sync_jobs;
CREATE POLICY "datajud_sync_jobs_select_org_member"
ON public.datajud_sync_jobs FOR SELECT
USING (
  is_org_member(org_id)
);

-- DATAJUD_SYNC_JOBS - INSERT
DROP POLICY IF EXISTS "datajud_sync_jobs_insert_org_member" ON public.datajud_sync_jobs;
CREATE POLICY "datajud_sync_jobs_insert_org_member"
ON public.datajud_sync_jobs FOR INSERT
WITH CHECK (
  is_org_member(org_id)
);

-- ============================================================
-- PARTE 8: TRIGGER PARA ATUALIZAR UPDATED_AT (se função existir)
-- ============================================================

-- Criar função set_updated_at se não existir
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_datajud_processos_updated_at ON public.datajud_processos;
CREATE TRIGGER set_datajud_processos_updated_at
BEFORE UPDATE ON public.datajud_processos
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_datajud_sync_jobs_updated_at ON public.datajud_sync_jobs;
CREATE TRIGGER set_datajud_sync_jobs_updated_at
BEFORE UPDATE ON public.datajud_sync_jobs
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

COMMIT;
