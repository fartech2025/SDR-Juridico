-- ==================================================
-- DEBUG SQL para verificar simulados em Supabase Cloud
-- VERSÃO COMPLETA COM PASSOS SEQUENCIAIS
-- ==================================================
-- Siga os passos na ordem abaixo para diagnosticar

-- 📋 RESUMO VISUAL:
-- ├─ Passo 1: Verifica se VIEW existe
-- ├─ Passo 2: Conta simulados disponíveis  
-- ├─ Passo 3: Verifica contagem por simulado
-- ├─ Passo 4: Cria/Recria VIEW (se necessário)
-- ├─ Passo 5: Concede permissões
-- ├─ Passo 6: Testa SELECT na VIEW
-- ├─ Passo 7: Verifica RLS policies
-- └─ Passo 8: Testa fallback (SELECT direto)

-- ==================================================
-- ⏸️ PASSO 1: Verifica se a VIEW existe
-- ==================================================
-- Execute ISTO PRIMEIRO para diagnosticar
SELECT 
  EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name = 'vw_simulados_com_questoes'
  ) as "VIEW Existe?";

-- Resultado esperado:
-- t = SIM ✅ (ir para PASSO 6)
-- f = NÃO ❌ (ir para PASSO 2)

-- ==================================================
-- ⏸️ PASSO 2: Conta quantos simulados existem
-- ==================================================
-- Se VIEW não existe, execute isto
SELECT COUNT(*) as "Total Simulados" FROM public.simulados;

-- Resultado esperado:
-- > 0 = Tem dados ✅
-- 0 = Sem dados ❌ (need SEED)

-- ==================================================
-- ⏸️ PASSO 3: Lista simulados com contagem manual
-- ==================================================
-- Isto funciona sem VIEW (fallback)
SELECT 
  s.id_simulado,
  s.nome,
  COUNT(sq.id_simulado_questao) as "Total Questões",
  s.ativo
FROM public.simulados s
LEFT JOIN public.simulado_questoes sq ON s.id_simulado = sq.id_simulado
WHERE s.ativo = true
GROUP BY s.id_simulado, s.nome, s.ativo
ORDER BY s.id_simulado;

-- Resultado esperado: Lista de simulados com contagem

-- ==================================================
-- ⏸️ PASSO 4: Cria/Recria VIEW (RUN ISTO)
-- ==================================================
-- Execute se PASSO 1 = false

DROP VIEW IF EXISTS public.vw_simulados_com_questoes CASCADE;

CREATE VIEW public.vw_simulados_com_questoes AS
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
GROUP BY 
  s.id_simulado, 
  s.nome, 
  s.descricao, 
  s.data_criacao, 
  s.data_atualizacao, 
  s.ativo;

-- ==================================================
-- ⏸️ PASSO 5: Concede permissões de leitura
-- ==================================================
-- Execute ISTO após PASSO 4

ALTER VIEW public.vw_simulados_com_questoes OWNER TO postgres;

GRANT SELECT ON public.vw_simulados_com_questoes TO anon;
GRANT SELECT ON public.vw_simulados_com_questoes TO authenticated;
GRANT SELECT ON public.vw_simulados_com_questoes TO service_role;

-- ==================================================
-- ⏸️ PASSO 6: Testa SELECT na VIEW
-- ==================================================
-- Execute ISTO para validar que funciona

SELECT * FROM public.vw_simulados_com_questoes
ORDER BY data_criacao DESC;

-- Resultado esperado: 
-- ✅ Lista de simulados com total_questoes
-- ❌ Erro de permissão = RLS está bloqueando
-- ❌ "VIEW does not exist" = PASSO 4 falhou

-- ==================================================
-- ⏸️ PASSO 7: Verifica RLS policies em simulados
-- ==================================================
-- Para diagnosticar bloqueios de acesso

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'simulados'
ORDER BY policyname;

-- Resultado esperado:
-- ✅ "Simulados - Leitura pública" ou similar com USING (ativo = true)
-- ❌ Sem policies = RLS está desativada
-- ❌ Policy muito restritiva = Bloqueando acesso

-- ==================================================
-- ⏸️ PASSO 8: Testa SELECT direto (sem VIEW)
-- ==================================================
-- Este é o FALLBACK se VIEW falhar

SELECT 
  id_simulado,
  nome,
  descricao,
  data_criacao,
  data_atualizacao,
  ativo
FROM public.simulados
WHERE ativo = true
ORDER BY data_criacao DESC
LIMIT 10;

-- Resultado esperado:
-- ✅ Funciona = Tabela está acessível, app vai usar fallback
-- ❌ Erro = RLS está bloqueando a tabela também

-- ==================================================
-- 📊 CHECKLIST DE FIX COMPLETO
-- ==================================================
-- Rode isto tudo na ordem:

-- 1. View não existe? (PASSO 1 = false)
--    → Execute PASSO 4 (DROP + CREATE)
--    → Execute PASSO 5 (GRANT)
--    → Execute PASSO 6 (verificar)

-- 2. Sem dados? (PASSO 2 = 0)
--    → Insira simulados de teste
--    → Ver SEED_SIMULADOS.sql

-- 3. Erro de permissão? (PASSO 6 = erro)
--    → Revise RLS policies (PASSO 7)
--    → Pode desabilitar RLS se for teste:
--       ALTER TABLE public.simulados DISABLE ROW LEVEL SECURITY;

-- 4. Ainda com erro?
--    → Verifique autenticação do usuário
--    → Confira se user_id está sendo passado
--    → Check browser console para detalhes

-- ==================================================
-- 🔧 LIMPEZA (APENAS SE NECESSÁRIO)
-- ==================================================
-- Resetar tudo para recomeçar

-- DROP VIEW IF EXISTS public.vw_simulados_com_questoes CASCADE;
-- DELETE FROM public.simulado_questoes;
-- DELETE FROM public.simulados;
-- ALTER TABLE public.simulados DISABLE ROW LEVEL SECURITY;

-- ==================================================
-- ✅ PRÓXIMOS PASSOS NO APP
-- ==================================================
-- Após confirmar que tudo funciona:
-- 1. Hard refresh do browser: Cmd+Shift+R
-- 2. Abra DevTools → Console
-- 3. Acesse página de simulados
-- 4. Veja se "Erro ao buscar simulados" sumiu
-- 5. Se ainda tiver erro: cole a mensagem do console aqui
