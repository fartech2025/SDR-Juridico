-- ====================================================================
-- Migration: Garantir agregações de respostas e views materializadas
-- Descrição: Cria funções auxiliares, trigger de agregação e views
--            materializadas utilizadas na inteligência do aluno.
-- Data: 2025-11-05
-- ====================================================================

-- --------------------------------------------------------------------
-- Função utilitária: percentual de acertos
-- --------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.fn_percent(bigint, bigint);
CREATE OR REPLACE FUNCTION public.fn_percent(acertos BIGINT, total BIGINT)
RETURNS NUMERIC AS $$
BEGIN
  IF total IS NULL OR total <= 0 THEN
    RETURN 0;
  END IF;

  RETURN ROUND((acertos::NUMERIC / total::NUMERIC) * 100, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- --------------------------------------------------------------------
-- Função utilitária: peso da dificuldade
-- --------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.fn_peso_dificuldade(character varying);
CREATE OR REPLACE FUNCTION public.fn_peso_dificuldade(d VARCHAR)
RETURNS INT AS $$
BEGIN
  IF d = 'Fácil' THEN
    RETURN 1;
  ELSIF d = 'Médio' THEN
    RETURN 2;
  ELSIF d = 'Difícil' THEN
    RETURN 3;
  END IF;

  RETURN 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- --------------------------------------------------------------------
-- Trigger: agrega métricas após cada nova resposta
-- --------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.fn_on_new_resposta() CASCADE;
CREATE OR REPLACE FUNCTION public.fn_on_new_resposta()
RETURNS TRIGGER AS $$
DECLARE
  v_tema BIGINT;
  v_dificuldade VARCHAR(10);
  v_hora SMALLINT;
  v_xp_inc BIGINT := 0;
  v_data_resposta DATE := (NEW.data_resposta AT TIME ZONE 'UTC')::DATE;
BEGIN
  SELECT q.id_tema, q.dificuldade
    INTO v_tema, v_dificuldade
  FROM public.questoes q
  WHERE q.id_questao = NEW.id_questao;

  v_hora := EXTRACT(HOUR FROM NEW.data_resposta)::SMALLINT;

  INSERT INTO public.resultados_usuarios AS ru (
    id_usuario,
    total_questoes,
    total_acertos,
    total_erros,
    percentual_acertos,
    tempo_medio_resposta_ms,
    data_ultima_atualizacao
  )
  VALUES (
    NEW.id_usuario,
    1,
    CASE WHEN NEW.correta THEN 1 ELSE 0 END,
    CASE WHEN NEW.correta THEN 0 ELSE 1 END,
    public.fn_percent(CASE WHEN NEW.correta THEN 1 ELSE 0 END, 1),
    NEW.tempo_resposta_ms,
    NOW()
  )
  ON CONFLICT (id_usuario) DO UPDATE
  SET
    total_questoes = ru.total_questoes + 1,
    total_acertos = ru.total_acertos + (CASE WHEN EXCLUDED.total_acertos = 1 THEN 1 ELSE 0 END),
    total_erros = ru.total_erros + (CASE WHEN EXCLUDED.total_erros = 1 THEN 1 ELSE 0 END),
    percentual_acertos = public.fn_percent(
      ru.total_acertos + (CASE WHEN EXCLUDED.total_acertos = 1 THEN 1 ELSE 0 END),
      ru.total_questoes + 1
    ),
    tempo_medio_resposta_ms = COALESCE(
      (
        (ru.tempo_medio_resposta_ms::NUMERIC * ru.total_questoes)
        + COALESCE(NEW.tempo_resposta_ms, 0)
      )
      / NULLIF(ru.total_questoes + 1, 0),
      NEW.tempo_resposta_ms
    )::BIGINT,
    data_ultima_atualizacao = NOW();

  INSERT INTO public.resultados_por_tema AS rt (
    id_usuario,
    id_tema,
    total_respondidas,
    total_acertos,
    percentual,
    tempo_medio_ms,
    updated_at
  )
  VALUES (
    NEW.id_usuario,
    v_tema,
    1,
    CASE WHEN NEW.correta THEN 1 ELSE 0 END,
    public.fn_percent(CASE WHEN NEW.correta THEN 1 ELSE 0 END, 1),
    NEW.tempo_resposta_ms,
    NOW()
  )
  ON CONFLICT (id_usuario, id_tema) DO UPDATE
  SET
    total_respondidas = rt.total_respondidas + 1,
    total_acertos = rt.total_acertos + (CASE WHEN EXCLUDED.total_acertos = 1 THEN 1 ELSE 0 END),
    percentual = public.fn_percent(
      rt.total_acertos + (CASE WHEN EXCLUDED.total_acertos = 1 THEN 1 ELSE 0 END),
      rt.total_respondidas + 1
    ),
    tempo_medio_ms = COALESCE(
      (
        (rt.tempo_medio_ms::NUMERIC * rt.total_respondidas)
        + COALESCE(NEW.tempo_resposta_ms, 0)
      )
      / NULLIF(rt.total_respondidas + 1, 0),
      NEW.tempo_resposta_ms
    )::BIGINT,
    updated_at = NOW();

  INSERT INTO public.resultados_por_dificuldade AS rd (
    id_usuario,
    dificuldade,
    total_respondidas,
    total_acertos,
    percentual,
    tempo_medio_ms,
    updated_at
  )
  VALUES (
    NEW.id_usuario,
    v_dificuldade,
    1,
    CASE WHEN NEW.correta THEN 1 ELSE 0 END,
    public.fn_percent(CASE WHEN NEW.correta THEN 1 ELSE 0 END, 1),
    NEW.tempo_resposta_ms,
    NOW()
  )
  ON CONFLICT (id_usuario, dificuldade) DO UPDATE
  SET
    total_respondidas = rd.total_respondidas + 1,
    total_acertos = rd.total_acertos + (CASE WHEN EXCLUDED.total_acertos = 1 THEN 1 ELSE 0 END),
    percentual = public.fn_percent(
      rd.total_acertos + (CASE WHEN EXCLUDED.total_acertos = 1 THEN 1 ELSE 0 END),
      rd.total_respondidas + 1
    ),
    tempo_medio_ms = COALESCE(
      (
        (rd.tempo_medio_ms::NUMERIC * rd.total_respondidas)
        + COALESCE(NEW.tempo_resposta_ms, 0)
      )
      / NULLIF(rd.total_respondidas + 1, 0),
      NEW.tempo_resposta_ms
    )::BIGINT,
    updated_at = NOW();

  INSERT INTO public.resultados_por_hora AS rh (
    id_usuario,
    hora,
    total_respondidas,
    total_acertos,
    percentual,
    tempo_medio_ms,
    updated_at
  )
  VALUES (
    NEW.id_usuario,
    v_hora,
    1,
    CASE WHEN NEW.correta THEN 1 ELSE 0 END,
    public.fn_percent(CASE WHEN NEW.correta THEN 1 ELSE 0 END, 1),
    NEW.tempo_resposta_ms,
    NOW()
  )
  ON CONFLICT (id_usuario, hora) DO UPDATE
  SET
    total_respondidas = rh.total_respondidas + 1,
    total_acertos = rh.total_acertos + (CASE WHEN EXCLUDED.total_acertos = 1 THEN 1 ELSE 0 END),
    percentual = public.fn_percent(
      rh.total_acertos + (CASE WHEN EXCLUDED.total_acertos = 1 THEN 1 ELSE 0 END),
      rh.total_respondidas + 1
    ),
    tempo_medio_ms = COALESCE(
      (
        (rh.tempo_medio_ms::NUMERIC * rh.total_respondidas)
        + COALESCE(NEW.tempo_resposta_ms, 0)
      )
      / NULLIF(rh.total_respondidas + 1, 0),
      NEW.tempo_resposta_ms
    )::BIGINT,
    updated_at = NOW();

  v_xp_inc := CASE WHEN NEW.correta THEN 10 ELSE 2 END * public.fn_peso_dificuldade(v_dificuldade);

  UPDATE public.usuarios u
  SET
    xp_total = u.xp_total + v_xp_inc,
    streak_dias = CASE
      WHEN u.ultima_resposta_em IS NULL THEN 1
      WHEN u.ultima_resposta_em = v_data_resposta THEN u.streak_dias
      WHEN u.ultima_resposta_em = v_data_resposta - 1 THEN u.streak_dias + 1
      ELSE 1
    END,
    ultima_resposta_em = v_data_resposta
  WHERE u.id_usuario = NEW.id_usuario;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_on_new_resposta ON public.respostas_usuarios;
CREATE TRIGGER trg_on_new_resposta
AFTER INSERT ON public.respostas_usuarios
FOR EACH ROW EXECUTE FUNCTION public.fn_on_new_resposta();

-- --------------------------------------------------------------------
-- Views materializadas para dashboards
-- --------------------------------------------------------------------
DROP MATERIALIZED VIEW IF EXISTS public.vw_resultados_calculados;
CREATE MATERIALIZED VIEW public.vw_resultados_calculados AS
SELECT
  id_usuario,
  total_questoes AS total_respondidas,
  total_acertos,
  total_erros,
  percentual_acertos,
  tempo_medio_resposta_ms,
  data_ultima_atualizacao
FROM public.resultados_usuarios;

CREATE UNIQUE INDEX IF NOT EXISTS idx_vw_resultados_calculados_id_usuario
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

CREATE INDEX IF NOT EXISTS idx_vw_res_tema_user
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

CREATE INDEX IF NOT EXISTS idx_vw_res_dif_user
  ON public.vw_resultados_por_dificuldade (id_usuario, dificuldade);

DROP MATERIALIZED VIEW IF EXISTS public.vw_percentil_global;
CREATE MATERIALIZED VIEW public.vw_percentil_global AS
WITH base AS (
  SELECT id_usuario, COALESCE(percentual_acertos, 0)::NUMERIC AS pct
  FROM public.resultados_usuarios
)
SELECT
  b.id_usuario,
  b.pct,
  PERCENT_RANK() OVER (ORDER BY b.pct) AS percent_rank_0_1
FROM base b;

CREATE UNIQUE INDEX IF NOT EXISTS idx_vw_percentil_user
  ON public.vw_percentil_global (id_usuario);

-- --------------------------------------------------------------------
-- Função para atualizar as views materializadas
-- --------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.fn_refresh_all_materialized();
CREATE OR REPLACE FUNCTION public.fn_refresh_all_materialized()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.vw_resultados_calculados;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.vw_resultados_por_tema;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.vw_resultados_por_dificuldade;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.vw_percentil_global;
END;
$$ LANGUAGE plpgsql;
