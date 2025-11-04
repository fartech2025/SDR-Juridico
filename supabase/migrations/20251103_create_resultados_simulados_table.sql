-- ============================================================
-- Tabela de Resultados de Simulados
-- ============================================================

CREATE TABLE IF NOT EXISTS public.resultados_simulados (
  id_resultado BIGSERIAL PRIMARY KEY,
  id_usuario BIGINT NOT NULL REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
  id_simulado BIGINT NOT NULL,
  percentual_acertos NUMERIC(5,2) NOT NULL,
  total_questoes INTEGER NOT NULL,
  total_acertos INTEGER NOT NULL,
  tempo_total_ms BIGINT,
  data_conclusao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(id_usuario, id_simulado)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_resultados_simulados_usuario 
  ON public.resultados_simulados(id_usuario);
  
CREATE INDEX IF NOT EXISTS idx_resultados_simulados_simulado 
  ON public.resultados_simulados(id_simulado);

CREATE INDEX IF NOT EXISTS idx_resultados_simulados_data 
  ON public.resultados_simulados(data_conclusao DESC);

-- View para ranking de alunos
CREATE OR REPLACE VIEW public.vw_ranking_simulados AS
SELECT 
  u.id_usuario,
  u.nome,
  u.email,
  COUNT(DISTINCT rs.id_simulado) as total_simulados_respondidos,
  ROUND(AVG(rs.percentual_acertos), 2) as media_percentual,
  MAX(rs.percentual_acertos) as melhor_resultado,
  MIN(rs.percentual_acertos) as pior_resultado,
  ROUND(AVG(rs.tempo_total_ms::numeric / 1000), 1) as tempo_medio_segundos,
  MAX(rs.data_conclusao) as ultimo_simulado,
  ROW_NUMBER() OVER (ORDER BY AVG(rs.percentual_acertos) DESC) as posicao
FROM public.usuarios u
LEFT JOIN public.resultados_simulados rs ON rs.id_usuario = u.id_usuario
GROUP BY u.id_usuario, u.nome, u.email
ORDER BY media_percentual DESC, posicao;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.fn_update_resultados_simulados_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trg_update_resultados_simulados_timestamp ON public.resultados_simulados;
CREATE TRIGGER trg_update_resultados_simulados_timestamp
BEFORE UPDATE ON public.resultados_simulados
FOR EACH ROW
EXECUTE FUNCTION public.fn_update_resultados_simulados_timestamp();

RAISE NOTICE '✅ Tabela resultados_simulados criada com sucesso!';
