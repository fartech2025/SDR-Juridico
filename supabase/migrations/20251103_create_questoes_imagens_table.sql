-- ============================================================
-- Tabela de Imagens para Questões, Alternativas e Soluções
-- ============================================================

-- Criar tabela de imagens associadas a questões/alternativas/soluções
CREATE TABLE IF NOT EXISTS public.questoes_imagens (
  id_imagem BIGSERIAL PRIMARY KEY,
  tipo_entidade VARCHAR(50) NOT NULL CHECK (tipo_entidade IN ('questao', 'alternativa', 'solucao')),
  id_entidade BIGINT NOT NULL,
  caminho_arquivo TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_questoes_imagens_tipo_entidade 
  ON public.questoes_imagens(tipo_entidade);
  
CREATE INDEX IF NOT EXISTS idx_questoes_imagens_id_entidade 
  ON public.questoes_imagens(id_entidade);
  
CREATE INDEX IF NOT EXISTS idx_questoes_imagens_tipo_id 
  ON public.questoes_imagens(tipo_entidade, id_entidade);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.fn_update_questoes_imagens_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trg_update_questoes_imagens_timestamp ON public.questoes_imagens;
CREATE TRIGGER trg_update_questoes_imagens_timestamp
BEFORE UPDATE ON public.questoes_imagens
FOR EACH ROW
EXECUTE FUNCTION public.fn_update_questoes_imagens_timestamp();

-- Views úteis para busca
CREATE OR REPLACE VIEW public.vw_questoes_com_imagens AS
SELECT 
  q.id_questao,
  q.enunciado,
  q.alternativa_a,
  q.alternativa_b,
  q.alternativa_c,
  q.alternativa_d,
  q.alternativa_e,
  q.resposta_correta,
  q.tema,
  q.dificuldade,
  q.ano,
  q.conteudo,
  q.ano_enem,
  json_agg(
    json_build_object(
      'id_imagem', qi.id_imagem,
      'tipo_entidade', qi.tipo_entidade,
      'caminho_arquivo', qi.caminho_arquivo,
      'descricao', qi.descricao
    )
  ) FILTER (WHERE qi.id_imagem IS NOT NULL) AS imagens
FROM public.questoes q
LEFT JOIN public.questoes_imagens qi ON qi.tipo_entidade = 'questao' AND qi.id_entidade = q.id_questao
GROUP BY q.id_questao;

-- View para alternativas com imagens
CREATE OR REPLACE VIEW public.vw_alternativas_com_imagens AS
SELECT 
  q.id_questao,
  CASE 
    WHEN q.resposta_correta = 'A' THEN q.alternativa_a
    WHEN q.resposta_correta = 'B' THEN q.alternativa_b
    WHEN q.resposta_correta = 'C' THEN q.alternativa_c
    WHEN q.resposta_correta = 'D' THEN q.alternativa_d
    WHEN q.resposta_correta = 'E' THEN q.alternativa_e
  END AS alternativa,
  q.resposta_correta AS letra,
  json_agg(
    json_build_object(
      'id_imagem', qi.id_imagem,
      'tipo_entidade', qi.tipo_entidade,
      'caminho_arquivo', qi.caminho_arquivo,
      'descricao', qi.descricao
    ) ORDER BY qi.id_imagem
  ) FILTER (WHERE qi.id_imagem IS NOT NULL) AS imagens
FROM public.questoes q
LEFT JOIN public.questoes_imagens qi ON qi.tipo_entidade = 'alternativa' AND qi.id_entidade = q.id_questao
GROUP BY q.id_questao;

RAISE NOTICE '✅ Tabela questoes_imagens criada com sucesso!';
