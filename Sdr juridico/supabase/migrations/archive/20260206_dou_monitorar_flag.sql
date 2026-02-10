-- ============================================================
-- MIGRATION: 20260206_dou_monitorar_flag.sql
-- Descricao: Adiciona flag monitorar_dou na tabela casos
-- Data: 06 de fevereiro de 2026
--
-- IMPORTANTE: Executar DEPOIS de 20260205_dou_integration.sql
-- Se as tabelas DOU não existem, execute apenas a PARTE 1.
-- ============================================================

-- ============================================================
-- PARTE 1: ADICIONAR COLUNA monitorar_dou EM casos
-- (Pode ser executada independentemente)
-- ============================================================

-- Adicionar coluna (default TRUE para casos existentes continuarem monitorados)
ALTER TABLE public.casos
ADD COLUMN IF NOT EXISTS monitorar_dou BOOLEAN DEFAULT TRUE;

-- Comentário explicativo
COMMENT ON COLUMN public.casos.monitorar_dou IS
  'Flag para ativar/desativar monitoramento automático no DOU para este caso.
   TRUE = bot inclui este caso na busca diária.
   FALSE = caso ignorado pelo bot (publicações existentes permanecem).';

-- Índice para queries do bot (filtrar casos com monitoramento ativo)
CREATE INDEX IF NOT EXISTS idx_casos_monitorar_dou
  ON public.casos(monitorar_dou)
  WHERE monitorar_dou = TRUE;

-- ============================================================
-- PARE AQUI se as tabelas DOU não existem ainda!
-- Execute 20260205_dou_integration.sql primeiro.
-- ============================================================

-- ============================================================
-- PARTE 2: VIEW PARA ESTATÍSTICAS DOU POR ORG
-- (Requer: dou_termos_monitorados, dou_publicacoes, dou_sync_logs)
-- ============================================================

-- Só cria se as tabelas existem
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dou_termos_monitorados') THEN
    EXECUTE $view$
      CREATE OR REPLACE VIEW public.dou_stats_por_org AS
      SELECT
        o.id AS org_id,
        o.name AS org_name,
        o.plan AS org_plan,

        -- Contagem de casos monitorados (status ativos no enum case_status)
        (SELECT COUNT(*) FROM casos c
         WHERE c.org_id = o.id
         AND c.status IN ('aberto', 'triagem', 'negociacao', 'contrato', 'andamento')
         AND c.monitorar_dou = TRUE
         AND c.numero_processo IS NOT NULL) AS casos_monitorados,

        -- Total de termos ativos
        (SELECT COUNT(*) FROM dou_termos_monitorados t
         WHERE t.org_id = o.id
         AND t.ativo = TRUE) AS termos_ativos,

        -- Publicações encontradas (últimos 30 dias)
        (SELECT COUNT(*) FROM dou_publicacoes p
         WHERE p.org_id = o.id
         AND p.created_at > NOW() - INTERVAL '30 days') AS publicacoes_30d,

        -- Publicações não lidas
        (SELECT COUNT(*) FROM dou_publicacoes p
         WHERE p.org_id = o.id
         AND p.lida = FALSE) AS publicacoes_nao_lidas,

        -- Último sync
        (SELECT MAX(created_at) FROM dou_sync_logs s
         WHERE s.org_id = o.id
         AND s.status = 'sucesso') AS ultimo_sync_sucesso,

        -- Syncs com erro (últimos 7 dias)
        (SELECT COUNT(*) FROM dou_sync_logs s
         WHERE s.org_id = o.id
         AND s.status = 'erro'
         AND s.created_at > NOW() - INTERVAL '7 days') AS syncs_erro_7d

      FROM public.orgs o
      WHERE o.status = 'active'
    $view$;

    COMMENT ON VIEW public.dou_stats_por_org IS
      'Estatísticas de monitoramento DOU por organização. Usado pelo dashboard Fartech.';

    RAISE NOTICE 'View dou_stats_por_org criada com sucesso';
  ELSE
    RAISE NOTICE 'Tabelas DOU não existem, pulando criação da view. Execute 20260205_dou_integration.sql primeiro.';
  END IF;
END$$;

-- ============================================================
-- PARTE 3: FUNÇÃO PARA LIMITES DE TERMOS POR PLANO
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_dou_termo_limit(org_plan TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN CASE org_plan
    WHEN 'trial' THEN 5
    WHEN 'basic' THEN 20
    WHEN 'professional' THEN 100
    WHEN 'enterprise' THEN 1000
    ELSE 10
  END;
END;
$$;

COMMENT ON FUNCTION public.get_dou_termo_limit IS
  'Retorna o limite de termos monitorados no DOU baseado no plano da organização.';

-- ============================================================
-- PARTE 4: TRIGGER PARA VALIDAR LIMITE DE TERMOS
-- (Só cria se a tabela existe)
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dou_termos_monitorados') THEN
    -- Criar função do trigger
    CREATE OR REPLACE FUNCTION public.check_dou_termo_limit()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    AS $func$
    DECLARE
      org_plan TEXT;
      current_count INTEGER;
      max_allowed INTEGER;
    BEGIN
      -- Buscar plano da org
      SELECT plan INTO org_plan FROM public.orgs WHERE id = NEW.org_id;

      -- Contar termos ativos atuais
      SELECT COUNT(*) INTO current_count
      FROM public.dou_termos_monitorados
      WHERE org_id = NEW.org_id AND ativo = TRUE;

      -- Obter limite
      max_allowed := get_dou_termo_limit(org_plan);

      -- Validar (só bloqueia se estiver inserindo novo termo ativo)
      IF NEW.ativo = TRUE AND current_count >= max_allowed THEN
        RAISE EXCEPTION 'Limite de termos DOU atingido para este plano (% de %). Faça upgrade para monitorar mais termos.',
          current_count, max_allowed;
      END IF;

      RETURN NEW;
    END;
    $func$;

    -- Criar trigger
    DROP TRIGGER IF EXISTS check_dou_termo_limit_trigger ON public.dou_termos_monitorados;
    CREATE TRIGGER check_dou_termo_limit_trigger
    BEFORE INSERT ON public.dou_termos_monitorados
    FOR EACH ROW
    EXECUTE FUNCTION check_dou_termo_limit();

    RAISE NOTICE 'Trigger check_dou_termo_limit criado com sucesso';
  ELSE
    RAISE NOTICE 'Tabela dou_termos_monitorados não existe, pulando criação do trigger.';
  END IF;
END$$;
