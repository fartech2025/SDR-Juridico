-- Seed: Simulados de Teste
-- Este script adiciona simulados de teste para demonstração

-- Limpar simulados existentes (comentado - descomente se necessário)
-- DELETE FROM public.simulados WHERE nome LIKE '%Teste%' OR nome LIKE '%Demo%';

-- Inserir simulados de teste
INSERT INTO public.simulados (nome, descricao, data_criacao) VALUES
  (
    'ENEM 2023 - Dia 1',
    'Simulado com questões de Linguagens, Códigos e Suas Tecnologias',
    NOW()
  ),
  (
    'ENEM 2023 - Dia 2',
    'Simulado com questões de Matemática, Ciências Humanas e Natureza',
    NOW()
  ),
  (
    'ENEM 2022 - Dia 1',
    'Prova de Linguagens do ENEM 2022',
    NOW()
  ),
  (
    'Simulado Completo - Mini ENEM',
    'Simulado com 20 questões variadas para praticar',
    NOW()
  ),
  (
    'Desafio Matemática',
    'Simulado focado em questões de Matemática - Nível Avançado',
    NOW()
  )
ON CONFLICT (nome) DO NOTHING;

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Simulados de teste inseridos com sucesso!';
  RAISE NOTICE 'Total de simulados: %', (SELECT COUNT(*) FROM public.simulados);
END $$;
