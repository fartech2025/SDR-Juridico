-- Seed: Simulados de Teste com Questões
-- Este script adiciona simulados de teste para demonstração

-- Limpar simulados existentes (comentado - descomente se necessário)
-- DELETE FROM public.simulado_questoes;
-- DELETE FROM public.simulados WHERE id_simulado > 0;

-- Inserir simulados
INSERT INTO public.simulados (nome, descricao) VALUES
  (
    'ENEM 2023 - Dia 1',
    'Simulado com questões de Linguagens, Códigos e Suas Tecnologias'
  ),
  (
    'ENEM 2023 - Dia 2',
    'Simulado com questões de Matemática, Ciências Humanas e Natureza'
  ),
  (
    'ENEM 2022 - Dia 1',
    'Prova de Linguagens do ENEM 2022'
  ),
  (
    'Simulado Completo - Mini ENEM',
    'Simulado com questões variadas para praticar'
  ),
  (
    'Desafio Matemática',
    'Simulado focado em questões de Matemática - Nível Avançado'
  )
ON CONFLICT (nome) DO NOTHING;

-- Inserir questões nos simulados (ajustar id_questao conforme disponível no banco)
-- Exemplo: associar primeiras 5 questões ao simulado 1
DO $$
DECLARE
  v_id_simulado BIGINT;
  v_questoes BIGINT[];
  v_order SMALLINT := 1;
  v_questao BIGINT;
BEGIN
  -- Obter simulados inseridos
  SELECT ARRAY_AGG(id_simulado ORDER BY id_simulado) 
  INTO v_questoes
  FROM (SELECT DISTINCT id_simulado FROM public.simulados LIMIT 5) q;

  -- Obter as primeiras 50 questões disponíveis
  FOR v_questao IN SELECT id_questao FROM public.questoes LIMIT 50
  LOOP
    -- Inserir no primeiro simulado (pode ser expandido para outros)
    IF v_questoes[1] IS NOT NULL THEN
      INSERT INTO public.simulado_questoes (id_simulado, id_questao, ordem)
      VALUES (v_questoes[1], v_questao, v_order)
      ON CONFLICT DO NOTHING;
      
      v_order := v_order + 1;
    END IF;
  END LOOP;
  
  RAISE NOTICE '✅ Questões associadas aos simulados!';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️ Aviso ao associar questões: %', SQLERRM;
END $$;

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Simulados de teste inseridos com sucesso!';
  RAISE NOTICE 'Total de simulados: %', (SELECT COUNT(*) FROM public.simulados);
  RAISE NOTICE 'Total de associações: %', (SELECT COUNT(*) FROM public.simulado_questoes);
END $$;

