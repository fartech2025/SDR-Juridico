-- Verificar e Corrigir Acesso a Simulados

-- 1. Verificar se VIEW existe
SELECT EXISTS (
  SELECT 1 FROM information_schema.views 
  WHERE table_schema = 'public' 
  AND table_name = 'vw_simulados_com_questoes'
) as view_exists;

-- 2. Verificar dados em simulados
SELECT COUNT(*) FROM public.simulados;

-- 3. Se a view não existir, criá-la:
CREATE OR REPLACE VIEW public.vw_simulados_com_questoes AS
SELECT 
  s.id_simulado,
  s.nome,
  s.descricao,
  s.data_criacao,
  s.data_atualizacao,
  s.ativo,
  COUNT(sq.id_simulado_questao) as total_questoes
FROM public.simulados s
LEFT JOIN public.simulado_questoes sq ON s.id_simulado = sq.id_simulado
WHERE s.ativo = true
GROUP BY s.id_simulado, s.nome, s.descricao, s.data_criacao, s.data_atualizacao, s.ativo
ORDER BY s.data_criacao DESC;

-- 4. Dar permissão de leitura anon e authenticated
GRANT SELECT ON public.vw_simulados_com_questoes TO anon;
GRANT SELECT ON public.vw_simulados_com_questoes TO authenticated;

-- 5. Testar acesso
SELECT * FROM public.vw_simulados_com_questoes;

-- 6. Se precisar, remover RLS temporariamente da view (não é possível, é view)
-- Mas garantir que simulados permite SELECT
ALTER TABLE public.simulados ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas se existirem
DROP POLICY IF EXISTS "Leitura pública de simulados" ON public.simulados;

-- Criar nova policy sem restrição para teste
CREATE POLICY "Simulados - Leitura pública" 
ON public.simulados 
FOR SELECT 
USING (ativo = true);

-- Testar se consegue ler
SELECT * FROM public.simulados WHERE ativo = true LIMIT 5;
