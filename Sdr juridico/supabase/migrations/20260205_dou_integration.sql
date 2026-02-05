-- ============================================================
-- MIGRATION: 20260205_dou_integration.sql
-- Descricao: Integração com Diário Oficial da União (DOU)
-- Tabelas para publicações, termos monitorados e logs de sync
-- Data: 05 de fevereiro de 2026
-- ============================================================

BEGIN;

-- ============================================================
-- PARTE 1: TABELA DOU_PUBLICACOES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.dou_publicacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  caso_id UUID REFERENCES public.casos(id) ON DELETE SET NULL,

  -- Dados da publicação
  secao TEXT NOT NULL DEFAULT 'DO3',
  data_publicacao DATE NOT NULL,
  titulo TEXT NOT NULL,
  conteudo TEXT,
  orgao_publicador TEXT,
  tipo_publicacao TEXT,
  url_publicacao TEXT,
  identifica TEXT,
  pagina TEXT,

  -- Matching
  termo_encontrado TEXT,
  match_type TEXT,
  relevancia REAL DEFAULT 0,

  -- Controle
  lida BOOLEAN DEFAULT FALSE,
  notificada BOOLEAN DEFAULT FALSE,
  raw_xml JSONB,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Constraint de unicidade para evitar duplicatas
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.dou_publicacoes
    ADD CONSTRAINT dou_publicacoes_identifica_caso_unique
    UNIQUE(identifica, caso_id);
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END$$;

-- Constraint de tipo_publicacao
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.dou_publicacoes
    ADD CONSTRAINT dou_publicacoes_tipo_check
    CHECK (tipo_publicacao IN ('intimacao','citacao','edital','despacho','sentenca','outro'));
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END$$;

-- Constraint de match_type
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.dou_publicacoes
    ADD CONSTRAINT dou_publicacoes_match_type_check
    CHECK (match_type IN ('numero_processo','nome_parte','oab','custom'));
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END$$;

-- Índices para dou_publicacoes
CREATE INDEX IF NOT EXISTS idx_dou_publicacoes_org_id
  ON public.dou_publicacoes(org_id);
CREATE INDEX IF NOT EXISTS idx_dou_publicacoes_caso_id
  ON public.dou_publicacoes(caso_id) WHERE caso_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dou_publicacoes_data
  ON public.dou_publicacoes(data_publicacao DESC);
CREATE INDEX IF NOT EXISTS idx_dou_publicacoes_tipo
  ON public.dou_publicacoes(tipo_publicacao);
CREATE INDEX IF NOT EXISTS idx_dou_publicacoes_lida
  ON public.dou_publicacoes(lida) WHERE lida = FALSE;
CREATE INDEX IF NOT EXISTS idx_dou_publicacoes_notificada
  ON public.dou_publicacoes(notificada) WHERE notificada = FALSE;

-- ============================================================
-- PARTE 2: TABELA DOU_TERMOS_MONITORADOS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.dou_termos_monitorados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  caso_id UUID REFERENCES public.casos(id) ON DELETE CASCADE,

  termo TEXT NOT NULL,
  tipo TEXT NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Constraint de tipo
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.dou_termos_monitorados
    ADD CONSTRAINT dou_termos_tipo_check
    CHECK (tipo IN ('numero_processo','nome_parte','oab','custom'));
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END$$;

-- Constraint de unicidade
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.dou_termos_monitorados
    ADD CONSTRAINT dou_termos_org_caso_termo_unique
    UNIQUE(org_id, caso_id, termo);
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END$$;

-- Índices para dou_termos_monitorados
CREATE INDEX IF NOT EXISTS idx_dou_termos_org_id
  ON public.dou_termos_monitorados(org_id);
CREATE INDEX IF NOT EXISTS idx_dou_termos_caso_id
  ON public.dou_termos_monitorados(caso_id);
CREATE INDEX IF NOT EXISTS idx_dou_termos_ativo
  ON public.dou_termos_monitorados(ativo) WHERE ativo = TRUE;

-- ============================================================
-- PARTE 3: TABELA DOU_SYNC_LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.dou_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.orgs(id) ON DELETE CASCADE,
  data_pesquisa DATE NOT NULL,
  total_publicacoes_dou INTEGER DEFAULT 0,
  termos_pesquisados INTEGER DEFAULT 0,
  publicacoes_encontradas INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pendente',
  erro_mensagem TEXT,
  duracao_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Constraint de status
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.dou_sync_logs
    ADD CONSTRAINT dou_sync_logs_status_check
    CHECK (status IN ('pendente','em_progresso','sucesso','erro'));
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END$$;

-- Índices para dou_sync_logs
CREATE INDEX IF NOT EXISTS idx_dou_sync_logs_data
  ON public.dou_sync_logs(data_pesquisa DESC);
CREATE INDEX IF NOT EXISTS idx_dou_sync_logs_org
  ON public.dou_sync_logs(org_id);

-- ============================================================
-- PARTE 4: RLS POLICIES
-- ============================================================

-- Habilitar RLS
ALTER TABLE public.dou_publicacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dou_termos_monitorados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dou_sync_logs ENABLE ROW LEVEL SECURITY;

-- DOU_PUBLICACOES - SELECT
DROP POLICY IF EXISTS "dou_publicacoes_select_org_member" ON public.dou_publicacoes;
CREATE POLICY "dou_publicacoes_select_org_member"
ON public.dou_publicacoes FOR SELECT
USING (
  is_org_member(org_id)
);

-- DOU_PUBLICACOES - INSERT (service role para sync + org_member)
DROP POLICY IF EXISTS "dou_publicacoes_insert_org_member" ON public.dou_publicacoes;
CREATE POLICY "dou_publicacoes_insert_org_member"
ON public.dou_publicacoes FOR INSERT
WITH CHECK (
  is_org_member(org_id)
);

-- DOU_PUBLICACOES - UPDATE (marcar lida, etc.)
DROP POLICY IF EXISTS "dou_publicacoes_update_org_member" ON public.dou_publicacoes;
CREATE POLICY "dou_publicacoes_update_org_member"
ON public.dou_publicacoes FOR UPDATE
USING (
  is_org_member(org_id)
)
WITH CHECK (
  is_org_member(org_id)
);

-- DOU_TERMOS_MONITORADOS - SELECT
DROP POLICY IF EXISTS "dou_termos_select_org_member" ON public.dou_termos_monitorados;
CREATE POLICY "dou_termos_select_org_member"
ON public.dou_termos_monitorados FOR SELECT
USING (
  is_org_member(org_id)
);

-- DOU_TERMOS_MONITORADOS - INSERT
DROP POLICY IF EXISTS "dou_termos_insert_org_member" ON public.dou_termos_monitorados;
CREATE POLICY "dou_termos_insert_org_member"
ON public.dou_termos_monitorados FOR INSERT
WITH CHECK (
  is_org_member(org_id)
);

-- DOU_TERMOS_MONITORADOS - UPDATE
DROP POLICY IF EXISTS "dou_termos_update_org_member" ON public.dou_termos_monitorados;
CREATE POLICY "dou_termos_update_org_member"
ON public.dou_termos_monitorados FOR UPDATE
USING (
  is_org_member(org_id)
)
WITH CHECK (
  is_org_member(org_id)
);

-- DOU_TERMOS_MONITORADOS - DELETE (apenas admin)
DROP POLICY IF EXISTS "dou_termos_delete_org_admin" ON public.dou_termos_monitorados;
CREATE POLICY "dou_termos_delete_org_admin"
ON public.dou_termos_monitorados FOR DELETE
USING (
  is_org_admin_for_org(org_id)
);

-- DOU_SYNC_LOGS - SELECT
DROP POLICY IF EXISTS "dou_sync_logs_select_org_member" ON public.dou_sync_logs;
CREATE POLICY "dou_sync_logs_select_org_member"
ON public.dou_sync_logs FOR SELECT
USING (
  is_org_member(org_id)
);

-- DOU_SYNC_LOGS - INSERT
DROP POLICY IF EXISTS "dou_sync_logs_insert_org_member" ON public.dou_sync_logs;
CREATE POLICY "dou_sync_logs_insert_org_member"
ON public.dou_sync_logs FOR INSERT
WITH CHECK (
  is_org_member(org_id)
);

-- ============================================================
-- PARTE 5: TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS set_dou_publicacoes_updated_at ON public.dou_publicacoes;
CREATE TRIGGER set_dou_publicacoes_updated_at
BEFORE UPDATE ON public.dou_publicacoes
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_dou_termos_updated_at ON public.dou_termos_monitorados;
CREATE TRIGGER set_dou_termos_updated_at
BEFORE UPDATE ON public.dou_termos_monitorados
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

COMMIT;
