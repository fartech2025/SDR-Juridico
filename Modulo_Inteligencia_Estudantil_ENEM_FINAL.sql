
-- ============================================================
-- 0) DESATIVAR RLS NAS TABELAS SENSÍVEIS (evita bloqueios)
-- ============================================================
DO $$
DECLARE
  t text;
  tbls text[] := ARRAY[
    'usuarios',
    'respostas_usuarios',
    'resultados_usuarios',
    'resultados_por_tema',
    'resultados_por_dificuldade',
    'resultados_por_hora'
  ];
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    IF to_regclass(format('public.%I', t)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY;', t);
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- 1) PATCHES INCREMENTAIS NAS TABELAS BASE
-- ============================================================

-- 1.1) USUÁRIOS: campos para gamificação/analytics
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema='public' AND table_name='usuarios' AND column_name='nivel') THEN
    ALTER TABLE public.usuarios ADD COLUMN nivel SMALLINT DEFAULT 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema='public' AND table_name='usuarios' AND column_name='xp_total') THEN
    ALTER TABLE public.usuarios ADD COLUMN xp_total BIGINT DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema='public' AND table_name='usuarios' AND column_name='streak_dias') THEN
    ALTER TABLE public.usuarios ADD COLUMN streak_dias INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema='public' AND table_name='usuarios' AND column_name='ultima_resposta_em') THEN
    ALTER TABLE public.usuarios ADD COLUMN ultima_resposta_em DATE;
  END IF;
END $$;

-- 1.2) QUESTÕES: peso/TRI derivado da dificuldade
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema='public' AND table_name='questoes' AND column_name='peso_dificuldade') THEN
    ALTER TABLE public.questoes ADD COLUMN peso_dificuldade SMALLINT 
      GENERATED ALWAYS AS (CASE dificuldade
                             WHEN 'Fácil'  THEN 1
                             WHEN 'Médio'  THEN 2
                             WHEN 'Difícil' THEN 3
                           END) STORED;
  END IF;
END $$;

-- 1.3) RESPOSTAS: garantir colunas e índice temporal
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema='public' AND table_name='respostas_usuarios' AND column_name='tempo_resposta_ms') THEN
    ALTER TABLE public.respostas_usuarios ADD COLUMN tempo_resposta_ms BIGINT;
  END IF;
  CREATE INDEX IF NOT EXISTS idx_respostas_data ON public.respostas_usuarios (data_resposta);
END $$;

-- 1.4) RESULTADOS_USUÁRIOS: garantir colunas usadas nas views
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema='public' AND table_name='resultados_usuarios' AND column_name='tempo_medio_resposta_ms') THEN
    ALTER TABLE public.resultados_usuarios ADD COLUMN tempo_medio_resposta_ms BIGINT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema='public' AND table_name='resultados_usuarios' AND column_name='data_ultima_atualizacao') THEN
    ALTER TABLE public.resultados_usuarios ADD COLUMN data_ultima_atualizacao TIMESTAMPTZ DEFAULT NOW();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema='public' AND table_name='resultados_usuarios' AND column_name='total_erros') THEN
    ALTER TABLE public.resultados_usuarios ADD COLUMN total_erros INTEGER DEFAULT 0;
  END IF;
END $$;

-- ============================================================
-- 2) TABELAS DE AGREGADOS (cache analítico)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.resultados_por_tema (
  id_usuario BIGINT NOT NULL REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
  id_tema    BIGINT NOT NULL REFERENCES public.temas(id_tema) ON DELETE CASCADE,
  total_respondidas BIGINT NOT NULL DEFAULT 0,
  total_acertos     BIGINT NOT NULL DEFAULT 0,
  percentual        NUMERIC(5,2),
  tempo_medio_ms    BIGINT,
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id_usuario, id_tema)
);

CREATE TABLE IF NOT EXISTS public.resultados_por_dificuldade (
  id_usuario BIGINT NOT NULL REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
  dificuldade VARCHAR(10) NOT NULL CHECK (dificuldade IN ('Fácil','Médio','Difícil')),
  total_respondidas BIGINT NOT NULL DEFAULT 0,
  total_acertos     BIGINT NOT NULL DEFAULT 0,
  percentual        NUMERIC(5,2),
  tempo_medio_ms    BIGINT,
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id_usuario, dificuldade)
);

CREATE TABLE IF NOT EXISTS public.resultados_por_hora (
  id_usuario BIGINT NOT NULL REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
  hora       SMALLINT NOT NULL CHECK (hora BETWEEN 0 AND 23),
  total_respondidas BIGINT NOT NULL DEFAULT 0,
  total_acertos     BIGINT NOT NULL DEFAULT 0,
  percentual        NUMERIC(5,2),
  tempo_medio_ms    BIGINT,
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id_usuario, hora)
);

CREATE INDEX IF NOT EXISTS idx_res_tema_user ON public.resultados_por_tema (id_usuario, id_tema);
CREATE INDEX IF NOT EXISTS idx_res_dif_user  ON public.resultados_por_dificuldade (id_usuario, dificuldade);
CREATE INDEX IF NOT EXISTS idx_res_hora_user ON public.resultados_por_hora (id_usuario, hora);

-- ============================================================
-- 3) FUNÇÕES AUXILIARES
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_percent(acertos BIGINT, total BIGINT)
RETURNS NUMERIC AS $$
BEGIN
  IF total IS NULL OR total = 0 THEN
    RETURN NULL;
  END IF;
  RETURN ROUND((acertos::NUMERIC * 100.0) / total::NUMERIC, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.fn_peso_dificuldade(d VARCHAR)
RETURNS INT AS $$
BEGIN
  IF d = 'Fácil' THEN RETURN 1;
  ELSIF d = 'Médio' THEN RETURN 2;
  ELSIF d = 'Difícil' THEN RETURN 3;
  END IF;
  RETURN 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- 4) TRIGGER: ATUALIZA AGREGADOS EM TEMPO REAL APÓS NOVA RESPOSTA
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_on_new_resposta()
RETURNS TRIGGER AS $$
DECLARE
  v_tema BIGINT;
  v_dif  VARCHAR(10);
  v_hora SMALLINT;
  v_xp_inc BIGINT := 0;
  v_hoje DATE := (NEW.data_resposta AT TIME ZONE 'UTC')::DATE;
BEGIN
  -- Obter tema e dificuldade da questão
  SELECT q.id_tema, q.dificuldade INTO v_tema, v_dif
  FROM public.questoes q
  WHERE q.id_questao = NEW.id_questao;

  v_hora := EXTRACT(HOUR FROM NEW.data_resposta)::SMALLINT;

  -- (4.1) resultados_usuarios
  INSERT INTO public.resultados_usuarios AS ru
    (id_usuario, total_questoes, total_acertos, total_erros,
     percentual_acertos, tempo_medio_resposta_ms, data_ultima_atualizacao)
  SELECT
    NEW.id_usuario,
    1,
    CASE WHEN NEW.correta THEN 1 ELSE 0 END,
    CASE WHEN NEW.correta THEN 0 ELSE 1 END,
    public.fn_percent(CASE WHEN NEW.correta THEN 1 ELSE 0 END, 1),
    NEW.tempo_resposta_ms,
    NOW()
  ON CONFLICT (id_usuario) DO UPDATE
    SET total_questoes = ru.total_questoes + 1,
        total_acertos  = ru.total_acertos + (CASE WHEN EXCLUDED.total_acertos=1 THEN 1 ELSE 0 END),
        total_erros    = ru.total_erros   + (CASE WHEN EXCLUDED.total_erros=1 THEN 1 ELSE 0 END),
        percentual_acertos = public.fn_percent(
          ru.total_acertos + (CASE WHEN EXCLUDED.total_acertos=1 THEN 1 ELSE 0 END),
          ru.total_questoes + 1
        ),
        tempo_medio_resposta_ms = COALESCE(
          ((ru.tempo_medio_resposta_ms::NUMERIC * ru.total_questoes) + COALESCE(NEW.tempo_resposta_ms,0))
          / NULLIF((ru.total_questoes + 1),0), NEW.tempo_resposta_ms
        )::BIGINT,
        data_ultima_atualizacao = NOW();

  -- (4.2) resultados_por_tema
  INSERT INTO public.resultados_por_tema AS rt
    (id_usuario, id_tema, total_respondidas, total_acertos, percentual, tempo_medio_ms, updated_at)
  VALUES
    (NEW.id_usuario, v_tema, 1, CASE WHEN NEW.correta THEN 1 ELSE 0 END,
     public.fn_percent(CASE WHEN NEW.correta THEN 1 ELSE 0 END, 1),
     NEW.tempo_resposta_ms, NOW())
  ON CONFLICT (id_usuario, id_tema) DO UPDATE
    SET total_respondidas = rt.total_respondidas + 1,
        total_acertos     = rt.total_acertos     + (CASE WHEN EXCLUDED.total_acertos=1 THEN 1 ELSE 0 END),
        percentual        = public.fn_percent(
                              rt.total_acertos + (CASE WHEN EXCLUDED.total_acertos=1 THEN 1 ELSE 0 END),
                              rt.total_respondidas + 1
                            ),
        tempo_medio_ms    = COALESCE((
                              ((rt.tempo_medio_ms::NUMERIC * rt.total_respondidas) + COALESCE(NEW.tempo_resposta_ms,0))
                              / NULLIF((rt.total_respondidas+1),0)
                            )::BIGINT, NEW.tempo_resposta_ms),
        updated_at        = NOW();

  -- (4.3) resultados_por_dificuldade
  INSERT INTO public.resultados_por_dificuldade AS rd
    (id_usuario, dificuldade, total_respondidas, total_acertos, percentual, tempo_medio_ms, updated_at)
  VALUES
    (NEW.id_usuario, v_dif, 1, CASE WHEN NEW.correta THEN 1 ELSE 0 END,
     public.fn_percent(CASE WHEN NEW.correta THEN 1 ELSE 0 END, 1),
     NEW.tempo_resposta_ms, NOW())
  ON CONFLICT (id_usuario, dificuldade) DO UPDATE
    SET total_respondidas = rd.total_respondidas + 1,
        total_acertos     = rd.total_acertos     + (CASE WHEN EXCLUDED.total_acertos=1 THEN 1 ELSE 0 END),
        percentual        = public.fn_percent(
                              rd.total_acertos + (CASE WHEN EXCLUDED.total_acertos=1 THEN 1 ELSE 0 END),
                              rd.total_respondidas + 1
                            ),
        tempo_medio_ms    = COALESCE((
                              ((rd.tempo_medio_ms::NUMERIC * rd.total_respondidas) + COALESCE(NEW.tempo_resposta_ms,0))
                              / NULLIF((rd.total_respondidas+1),0)
                            )::BIGINT, NEW.tempo_resposta_ms),
        updated_at        = NOW();

  -- (4.4) resultados_por_hora
  INSERT INTO public.resultados_por_hora AS rh
    (id_usuario, hora, total_respondidas, total_acertos, percentual, tempo_medio_ms, updated_at)
  VALUES
    (NEW.id_usuario, v_hora, 1, CASE WHEN NEW.correta THEN 1 ELSE 0 END,
     public.fn_percent(CASE WHEN NEW.correta THEN 1 ELSE 0 END, 1),
     NEW.tempo_resposta_ms, NOW())
  ON CONFLICT (id_usuario, hora) DO UPDATE
    SET total_respondidas = rh.total_respondidas + 1,
        total_acertos     = rh.total_acertos     + (CASE WHEN EXCLUDED.total_acertos=1 THEN 1 ELSE 0 END),
        percentual        = public.fn_percent(
                              rh.total_acertos + (CASE WHEN EXCLUDED.total_acertos=1 THEN 1 ELSE 0 END),
                              rh.total_respondidas + 1
                            ),
        tempo_medio_ms    = COALESCE((
                              ((rh.tempo_medio_ms::NUMERIC * rh.total_respondidas) + COALESCE(NEW.tempo_resposta_ms,0))
                              / NULLIF((rh.total_respondidas+1),0)
                            )::BIGINT, NEW.tempo_resposta_ms),
        updated_at        = NOW();

  -- (4.5) gamificação simples (XP e streak)
  v_xp_inc := CASE WHEN NEW.correta THEN 10 ELSE 2 END * public.fn_peso_dificuldade(v_dif);
  UPDATE public.usuarios u
  SET xp_total = u.xp_total + v_xp_inc,
      streak_dias = CASE
        WHEN u.ultima_resposta_em IS NULL THEN 1
        WHEN u.ultima_resposta_em = v_hoje      THEN u.streak_dias
        WHEN u.ultima_resposta_em = v_hoje - 1  THEN u.streak_dias + 1
        ELSE 1
      END,
      ultima_resposta_em = v_hoje
  WHERE u.id_usuario = NEW.id_usuario;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_on_new_resposta ON public.respostas_usuarios;
CREATE TRIGGER trg_on_new_resposta
AFTER INSERT ON public.respostas_usuarios
FOR EACH ROW EXECUTE FUNCTION public.fn_on_new_resposta();

-- ============================================================
-- 5) VIEWS MATERIALIZADAS + FUNÇÃO DE REFRESH
-- ============================================================

DROP MATERIALIZED VIEW IF EXISTS public.vw_resultados_calculados;
CREATE MATERIALIZED VIEW public.vw_resultados_calculados AS
SELECT
  id_usuario,
  total_questoes  AS total_respondidas,
  total_acertos,
  total_erros,
  percentual_acertos,
  tempo_medio_resposta_ms,
  data_ultima_atualizacao
FROM public.resultados_usuarios;

CREATE UNIQUE INDEX idx_vw_resultados_calculados_id_usuario
  ON public.vw_resultados_calculados (id_usuario);

DROP MATERIALIZED VIEW IF EXISTS public.vw_resultados_por_tema;
CREATE MATERIALIZED VIEW public.vw_resultados_por_tema AS
SELECT
  rt.id_usuario,
  rt.id_tema,
  t.nome_tema,
  rt.total_respondidas,
  rt.total_acertos,
  rt.percentual,
  rt.tempo_medio_ms
FROM public.resultados_por_tema rt
JOIN public.temas t ON t.id_tema = rt.id_tema;

CREATE INDEX idx_vw_res_tema_user
  ON public.vw_resultados_por_tema (id_usuario, id_tema);

DROP MATERIALIZED VIEW IF EXISTS public.vw_resultados_por_dificuldade;
CREATE MATERIALIZED VIEW public.vw_resultados_por_dificuldade AS
SELECT
  rd.id_usuario,
  rd.dificuldade,
  rd.total_respondidas,
  rd.total_acertos,
  rd.percentual,
  rd.tempo_medio_ms
FROM public.resultados_por_dificuldade rd;

CREATE INDEX idx_vw_res_dif_user
  ON public.vw_resultados_por_dificuldade (id_usuario, dificuldade);

DROP MATERIALIZED VIEW IF EXISTS public.vw_percentil_global;
CREATE MATERIALIZED VIEW public.vw_percentil_global AS
WITH base AS (
  SELECT id_usuario, COALESCE(percentual_acertos,0)::NUMERIC AS pct
  FROM public.resultados_usuarios
)
SELECT
  b.id_usuario,
  b.pct,
  PERCENT_RANK() OVER (ORDER BY b.pct) AS percent_rank_0_1
FROM base b;

CREATE UNIQUE INDEX idx_vw_percentil_user
  ON public.vw_percentil_global (id_usuario);

CREATE OR REPLACE FUNCTION public.fn_refresh_all_materialized()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.vw_resultados_calculados;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.vw_resultados_por_tema;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.vw_resultados_por_dificuldade;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.vw_percentil_global;
END;
$$ LANGUAGE plpgsql;

-- ======================================================================
-- 🔒 OPCIONAL (DESCOMENTAR PARA ATIVAR): REATIVAR RLS + POLICIES PADRÃO
-- ======================================================================
--
-- -- Habilitar RLS apenas nas tabelas sensíveis
-- ALTER TABLE public.usuarios                   ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.respostas_usuarios         ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.resultados_usuarios        ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.resultados_por_tema        ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.resultados_por_dificuldade ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.resultados_por_hora        ENABLE ROW LEVEL SECURITY;
--
-- -- POLICIES (modelo baseado em e-mail do Supabase Auth: auth.email())
-- -- 🔹 USUÁRIO só vê o próprio registro
-- DROP POLICY IF EXISTS "usuario_ver_seu_registro" ON public.usuarios;
-- CREATE POLICY "usuario_ver_seu_registro"
-- ON public.usuarios FOR SELECT
-- USING (email = auth.email());
--
-- -- 🔹 RESPOSTAS: SELECT/INSERT apenas do próprio usuário
-- DROP POLICY IF EXISTS "usuario_ver_respostas" ON public.respostas_usuarios;
-- CREATE POLICY "usuario_ver_respostas"
-- ON public.respostas_usuarios FOR SELECT
-- USING (
--   id_usuario = (SELECT u.id_usuario FROM public.usuarios u WHERE u.email = auth.email())
-- );
--
-- DROP POLICY IF EXISTS "usuario_inserir_respostas" ON public.respostas_usuarios;
-- CREATE POLICY "usuario_inserir_respostas"
-- ON public.respostas_usuarios FOR INSERT
-- WITH CHECK (
--   id_usuario = (SELECT u.id_usuario FROM public.usuarios u WHERE u.email = auth.email())
-- );
--
-- -- 🔹 RESULTADOS (todas as agregações): SELECT do próprio usuário
-- DROP POLICY IF EXISTS "usuario_ver_resultados" ON public.resultados_usuarios;
-- CREATE POLICY "usuario_ver_resultados"
-- ON public.resultados_usuarios FOR SELECT
-- USING (
--   id_usuario = (SELECT u.id_usuario FROM public.usuarios u WHERE u.email = auth.email())
-- );
--
-- DROP POLICY IF EXISTS "usuario_ver_resultados_tema" ON public.resultados_por_tema;
-- CREATE POLICY "usuario_ver_resultados_tema"
-- ON public.resultados_por_tema FOR SELECT
-- USING (
--   id_usuario = (SELECT u.id_usuario FROM public.usuarios u WHERE u.email = auth.email())
-- );
--
-- DROP POLICY IF EXISTS "usuario_ver_resultados_dif" ON public.resultados_por_dificuldade;
-- CREATE POLICY "usuario_ver_resultados_dif"
-- ON public.resultados_por_dificuldade FOR SELECT
-- USING (
--   id_usuario = (SELECT u.id_usuario FROM public.usuarios u WHERE u.email = auth.email())
-- );
--
-- DROP POLICY IF EXISTS "usuario_ver_resultados_hora" ON public.resultados_por_hora;
-- CREATE POLICY "usuario_ver_resultados_hora"
-- ON public.resultados_por_hora FOR SELECT
-- USING (
--   id_usuario = (SELECT u.id_usuario FROM public.usuarios u WHERE u.email = auth.email())
-- );
--
-- -- OBS: Se preferir modelo com UUID do Supabase Auth (auth.uid()):
-- -- 1) ALTER TABLE public.usuarios ADD COLUMN uuid_auth UUID UNIQUE;
-- -- 2) Popule uuid_auth na criação do usuário (signup).
-- -- 3) Troque nas policies:  "USING (uuid_auth = auth.uid())"
--
-- -- FIM DO BLOCO OPCIONAL DE RLS
-- ======================================================================

RAISE NOTICE '✅ Script final aplicado com sucesso (RLS desativado por padrão; bloco opcional incluído no final).';
