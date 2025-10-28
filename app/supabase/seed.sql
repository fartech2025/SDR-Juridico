-- =====================================================================
-- ENEM Student Intelligence Module - Local Supabase Bootstrap
-- =====================================================================
-- This script creates the base schema used by the React application,
-- sets up analytic helpers (functions, triggers, materialized views)
-- and loads a small development dataset. It is safe to re-run.
-- =====================================================================

-- ---------------------------------------------------
-- 0) BASE TABLES
-- ---------------------------------------------------

CREATE TABLE IF NOT EXISTS public.usuarios (
  id_usuario           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email                TEXT    NOT NULL UNIQUE,
  nome                 TEXT,
  auth_user_id         UUID    UNIQUE,
  nivel                SMALLINT        DEFAULT 1,
  xp_total             BIGINT          DEFAULT 0,
  streak_dias          INTEGER         DEFAULT 0,
  ultima_resposta_em   DATE,
  created_at           TIMESTAMPTZ     DEFAULT NOW(),
  updated_at           TIMESTAMPTZ     DEFAULT NOW()
);

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_auth_user ON public.usuarios(auth_user_id);


CREATE TABLE IF NOT EXISTS public.temas (
  id_tema     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome_tema   TEXT    NOT NULL UNIQUE,
  descricao   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.questoes (
  id_questao          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_tema             BIGINT      NOT NULL REFERENCES public.temas(id_tema) ON DELETE CASCADE,
  enunciado           TEXT        NOT NULL,
  alternativa_a       TEXT        NOT NULL,
  alternativa_b       TEXT        NOT NULL,
  alternativa_c       TEXT        NOT NULL,
  alternativa_d       TEXT        NOT NULL,
  alternativa_e       TEXT        NOT NULL,
  alternativa_correta CHAR(1)     NOT NULL,
  dificuldade         TEXT        NOT NULL CHECK (dificuldade IN ('FACIL','MEDIO','DIFICIL')),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (enunciado)
);

ALTER TABLE public.questoes
  ADD COLUMN IF NOT EXISTS peso_dificuldade SMALLINT GENERATED ALWAYS AS (
    CASE dificuldade
      WHEN 'FACIL'  THEN 1
      WHEN 'MEDIO'  THEN 2
      WHEN 'DIFICIL' THEN 3
      ELSE 1
    END
  ) STORED;

CREATE TABLE IF NOT EXISTS public.solucoes_questoes (
  id_solucao    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_questao    BIGINT NOT NULL REFERENCES public.questoes(id_questao) ON DELETE CASCADE,
  texto_solucao TEXT   NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.respostas_usuarios (
  id_resposta        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_usuario         BIGINT NOT NULL REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
  id_questao         BIGINT NOT NULL REFERENCES public.questoes(id_questao) ON DELETE CASCADE,
  alternativa_marcada CHAR(1) NOT NULL,
  correta            BOOLEAN NOT NULL DEFAULT FALSE,
  data_resposta      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tempo_resposta_ms  BIGINT,
  UNIQUE (id_usuario, id_questao, data_resposta)
);

CREATE INDEX IF NOT EXISTS idx_respostas_usuario ON public.respostas_usuarios (id_usuario);
CREATE INDEX IF NOT EXISTS idx_respostas_questao  ON public.respostas_usuarios (id_questao);
CREATE INDEX IF NOT EXISTS idx_respostas_data     ON public.respostas_usuarios (data_resposta);

CREATE TABLE IF NOT EXISTS public.resultados_usuarios (
  id_usuario               BIGINT PRIMARY KEY REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
  total_questoes           BIGINT          NOT NULL DEFAULT 0,
  total_acertos            BIGINT          NOT NULL DEFAULT 0,
  total_erros              BIGINT          NOT NULL DEFAULT 0,
  percentual_acertos       NUMERIC(5,2),
  tempo_medio_resposta_ms  BIGINT,
  data_ultima_atualizacao  TIMESTAMPTZ     DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.resultados_por_tema (
  id_usuario        BIGINT NOT NULL REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
  id_tema           BIGINT NOT NULL REFERENCES public.temas(id_tema) ON DELETE CASCADE,
  total_respondidas BIGINT NOT NULL DEFAULT 0,
  total_acertos     BIGINT NOT NULL DEFAULT 0,
  percentual        NUMERIC(5,2),
  tempo_medio_ms    BIGINT,
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id_usuario, id_tema)
);

CREATE TABLE IF NOT EXISTS public.resultados_por_dificuldade (
  id_usuario        BIGINT NOT NULL REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
  dificuldade       TEXT   NOT NULL CHECK (dificuldade IN ('FACIL','MEDIO','DIFICIL')),
  total_respondidas BIGINT NOT NULL DEFAULT 0,
  total_acertos     BIGINT NOT NULL DEFAULT 0,
  percentual        NUMERIC(5,2),
  tempo_medio_ms    BIGINT,
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id_usuario, dificuldade)
);

CREATE TABLE IF NOT EXISTS public.resultados_por_hora (
  id_usuario        BIGINT NOT NULL REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
  hora              SMALLINT NOT NULL CHECK (hora BETWEEN 0 AND 23),
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

-- ---------------------------------------------------
-- 1) ANALYTIC HELPERS (FUNCTIONS + TRIGGER)
-- ---------------------------------------------------

CREATE OR REPLACE FUNCTION public.fn_percent(acertos BIGINT, total BIGINT)
RETURNS NUMERIC AS $$
BEGIN
  IF total IS NULL OR total = 0 THEN
    RETURN NULL;
  END IF;
  RETURN ROUND((acertos::NUMERIC * 100.0) / total::NUMERIC, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.fn_peso_dificuldade(d TEXT)
RETURNS INT AS $$
BEGIN
  IF d = 'FACIL' THEN RETURN 1; END IF;
  IF d = 'MEDIO' THEN RETURN 2; END IF;
  IF d = 'DIFICIL' THEN RETURN 3; END IF;
  RETURN 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.fn_on_new_resposta()
RETURNS TRIGGER AS $$
DECLARE
  v_tema   BIGINT;
  v_dif    TEXT;
  v_hora   SMALLINT;
  v_xp_inc BIGINT := 0;
  v_hoje   DATE := (NEW.data_resposta AT TIME ZONE 'UTC')::DATE;
BEGIN
  SELECT q.id_tema, q.dificuldade INTO v_tema, v_dif
  FROM public.questoes q
  WHERE q.id_questao = NEW.id_questao;

  v_hora := EXTRACT(HOUR FROM NEW.data_resposta)::SMALLINT;

  INSERT INTO public.resultados_usuarios AS ru
    (id_usuario, total_questoes, total_acertos, total_erros,
     percentual_acertos, tempo_medio_resposta_ms, data_ultima_atualizacao)
  VALUES
    (NEW.id_usuario,
     1,
     CASE WHEN NEW.correta THEN 1 ELSE 0 END,
     CASE WHEN NEW.correta THEN 0 ELSE 1 END,
     public.fn_percent(CASE WHEN NEW.correta THEN 1 ELSE 0 END, 1),
     NEW.tempo_resposta_ms,
     NOW())
  ON CONFLICT (id_usuario) DO UPDATE
    SET total_questoes = ru.total_questoes + 1,
        total_acertos  = ru.total_acertos + (CASE WHEN EXCLUDED.total_acertos = 1 THEN 1 ELSE 0 END),
        total_erros    = ru.total_erros   + (CASE WHEN EXCLUDED.total_erros   = 1 THEN 1 ELSE 0 END),
        percentual_acertos = public.fn_percent(
          ru.total_acertos + (CASE WHEN EXCLUDED.total_acertos = 1 THEN 1 ELSE 0 END),
          ru.total_questoes + 1
        ),
        tempo_medio_resposta_ms = COALESCE(
          ((ru.tempo_medio_resposta_ms::NUMERIC * ru.total_questoes) + COALESCE(NEW.tempo_resposta_ms, 0))
          / NULLIF((ru.total_questoes + 1), 0), NEW.tempo_resposta_ms
        )::BIGINT,
        data_ultima_atualizacao = NOW();

  INSERT INTO public.resultados_por_tema AS rt
    (id_usuario, id_tema, total_respondidas, total_acertos, percentual, tempo_medio_ms, updated_at)
  VALUES
    (NEW.id_usuario, v_tema, 1,
     CASE WHEN NEW.correta THEN 1 ELSE 0 END,
     public.fn_percent(CASE WHEN NEW.correta THEN 1 ELSE 0 END, 1),
     NEW.tempo_resposta_ms,
     NOW())
  ON CONFLICT (id_usuario, id_tema) DO UPDATE
    SET total_respondidas = rt.total_respondidas + 1,
        total_acertos     = rt.total_acertos + (CASE WHEN EXCLUDED.total_acertos = 1 THEN 1 ELSE 0 END),
        percentual        = public.fn_percent(
                              rt.total_acertos + (CASE WHEN EXCLUDED.total_acertos = 1 THEN 1 ELSE 0 END),
                              rt.total_respondidas + 1
                            ),
        tempo_medio_ms    = COALESCE(
                              ((rt.tempo_medio_ms::NUMERIC * rt.total_respondidas) + COALESCE(NEW.tempo_resposta_ms, 0))
                              / NULLIF((rt.total_respondidas + 1), 0), NEW.tempo_resposta_ms
                            )::BIGINT,
        updated_at        = NOW();

  INSERT INTO public.resultados_por_dificuldade AS rd
    (id_usuario, dificuldade, total_respondidas, total_acertos, percentual, tempo_medio_ms, updated_at)
  VALUES
    (NEW.id_usuario, v_dif, 1,
     CASE WHEN NEW.correta THEN 1 ELSE 0 END,
     public.fn_percent(CASE WHEN NEW.correta THEN 1 ELSE 0 END, 1),
     NEW.tempo_resposta_ms,
     NOW())
  ON CONFLICT (id_usuario, dificuldade) DO UPDATE
    SET total_respondidas = rd.total_respondidas + 1,
        total_acertos     = rd.total_acertos + (CASE WHEN EXCLUDED.total_acertos = 1 THEN 1 ELSE 0 END),
        percentual        = public.fn_percent(
                              rd.total_acertos + (CASE WHEN EXCLUDED.total_acertos = 1 THEN 1 ELSE 0 END),
                              rd.total_respondidas + 1
                            ),
        tempo_medio_ms    = COALESCE(
                              ((rd.tempo_medio_ms::NUMERIC * rd.total_respondidas) + COALESCE(NEW.tempo_resposta_ms, 0))
                              / NULLIF((rd.total_respondidas + 1), 0), NEW.tempo_resposta_ms
                            )::BIGINT,
        updated_at        = NOW();

  INSERT INTO public.resultados_por_hora AS rh
    (id_usuario, hora, total_respondidas, total_acertos, percentual, tempo_medio_ms, updated_at)
  VALUES
    (NEW.id_usuario, v_hora, 1,
     CASE WHEN NEW.correta THEN 1 ELSE 0 END,
     public.fn_percent(CASE WHEN NEW.correta THEN 1 ELSE 0 END, 1),
     NEW.tempo_resposta_ms,
     NOW())
  ON CONFLICT (id_usuario, hora) DO UPDATE
    SET total_respondidas = rh.total_respondidas + 1,
        total_acertos     = rh.total_acertos + (CASE WHEN EXCLUDED.total_acertos = 1 THEN 1 ELSE 0 END),
        percentual        = public.fn_percent(
                              rh.total_acertos + (CASE WHEN EXCLUDED.total_acertos = 1 THEN 1 ELSE 0 END),
                              rh.total_respondidas + 1
                            ),
        tempo_medio_ms    = COALESCE(
                              ((rh.tempo_medio_ms::NUMERIC * rh.total_respondidas) + COALESCE(NEW.tempo_resposta_ms, 0))
                              / NULLIF((rh.total_respondidas + 1), 0), NEW.tempo_resposta_ms
                            )::BIGINT,
        updated_at        = NOW();

  v_xp_inc := CASE WHEN NEW.correta THEN 10 ELSE 2 END * public.fn_peso_dificuldade(v_dif);
  UPDATE public.usuarios u
  SET xp_total = u.xp_total + v_xp_inc,
      streak_dias = CASE
        WHEN u.ultima_resposta_em IS NULL THEN 1
        WHEN u.ultima_resposta_em = v_hoje     THEN u.streak_dias
        WHEN u.ultima_resposta_em = v_hoje - 1 THEN u.streak_dias + 1
        ELSE 1
      END,
      ultima_resposta_em = v_hoje,
      updated_at = NOW()
  WHERE u.id_usuario = NEW.id_usuario;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_on_new_resposta ON public.respostas_usuarios;
CREATE TRIGGER trg_on_new_resposta
AFTER INSERT ON public.respostas_usuarios
FOR EACH ROW EXECUTE FUNCTION public.fn_on_new_resposta();

-- ---------------------------------------------------
-- 2) MATERIALIZED VIEWS + REFRESH ROUTINE
-- ---------------------------------------------------

DROP MATERIALIZED VIEW IF EXISTS public.vw_resultados_calculados;
CREATE MATERIALIZED VIEW public.vw_resultados_calculados AS
SELECT
  id_usuario,
  total_questoes       AS total_respondidas,
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
  SELECT id_usuario, COALESCE(percentual_acertos, 0)::NUMERIC AS pct
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

-- ---------------------------------------------------
-- 3) DEVELOPMENT SEED DATA
-- ---------------------------------------------------

INSERT INTO public.temas (nome_tema, descricao)
VALUES
  ('Matematica Basica', 'Operacoes fundamentais e raciocinio logico'),
  ('Interpretacao de Texto', 'Compreensao e analise de textos diversos'),
  ('Ciencias da Natureza', 'Fisica, quimica e biologia basicas')
ON CONFLICT (nome_tema) DO UPDATE SET descricao = EXCLUDED.descricao;

INSERT INTO public.questoes
  (id_tema, enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e,
   alternativa_correta, dificuldade)
VALUES
  ((SELECT id_tema FROM public.temas WHERE nome_tema = 'Matematica Basica'),
   'Qual e o valor de 3 + 5?', '6', '7', '8', '9', '10', 'C', 'FACIL'),
  ((SELECT id_tema FROM public.temas WHERE nome_tema = 'Matematica Basica'),
   'Resolva: 2x = 14. Qual e o valor de x?', '5', '6', '7', '8', '9', 'C', 'MEDIO'),
  ((SELECT id_tema FROM public.temas WHERE nome_tema = 'Interpretacao de Texto'),
   'O que melhor resume a ideia principal de um texto argumentativo?',
   'Apresentar dados sem opiniao',
   'Convencer o leitor por meio de argumentos',
   'Narrar eventos em ordem cronologica',
   'Descrever detalhadamente um objeto',
   'Expressar sentimentos do autor',
   'B', 'MEDIO'),
  ((SELECT id_tema FROM public.temas WHERE nome_tema = 'Ciencias da Natureza'),
   'Qual particula possui carga negativa?', 'Proton', 'Neutron', 'Eletron', 'Positron', 'Ion', 'C', 'FACIL'),
  ((SELECT id_tema FROM public.temas WHERE nome_tema = 'Ciencias da Natureza'),
   'A fotossintese ocorre principalmente em qual estrutura vegetal?',
   'Raiz', 'Caule', 'Flor', 'Folha', 'Fruto', 'D', 'DIFICIL')
ON CONFLICT (enunciado) DO NOTHING;

INSERT INTO public.solucoes_questoes (id_questao, texto_solucao)
SELECT q.id_questao,
  CASE q.enunciado
    WHEN 'Qual e o valor de 3 + 5?' THEN 'Somar 3 e 5 resulta em 8. Logo, alternativa C.'
    WHEN 'Resolva: 2x = 14. Qual e o valor de x?' THEN 'Divida ambos os lados por 2 e obtemos x = 7 (alternativa C).'
    WHEN 'O que melhor resume a ideia principal de um texto argumentativo?' THEN 'A proposta e defender um ponto de vista. Alternativa B.'
    WHEN 'Qual particula possui carga negativa?' THEN 'O eletron possui carga negativa. Alternativa C.'
    WHEN 'A fotossintese ocorre principalmente em qual estrutura vegetal?' THEN 'O processo ocorre nas folhas. Alternativa D.'
  END
FROM public.questoes q
ON CONFLICT (id_questao) DO NOTHING;

-- ---------------------------------------------------
-- 4) HOUSEKEEPING
-- ---------------------------------------------------

ALTER TABLE public.usuarios                    DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.respostas_usuarios          DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.resultados_usuarios         DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.resultados_por_tema         DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.resultados_por_dificuldade  DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.resultados_por_hora         DISABLE ROW LEVEL SECURITY;

RAISE NOTICE 'Seed executado com sucesso - Supabase local pronto para uso.';

