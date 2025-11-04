-- Tabela de Simulados (Provas)
-- Criada para suportar o sistema de simulados com questões

CREATE TABLE IF NOT EXISTS public.simulados (
  id_simulado BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ativo BOOLEAN DEFAULT true
);

-- Tabela de Relacionamento Simulado-Questões
CREATE TABLE IF NOT EXISTS public.simulado_questoes (
  id_simulado_questao BIGSERIAL PRIMARY KEY,
  id_simulado BIGINT NOT NULL REFERENCES public.simulados(id_simulado) ON DELETE CASCADE,
  id_questao BIGINT NOT NULL REFERENCES public.questoes(id_questao) ON DELETE CASCADE,
  ordem SMALLINT NOT NULL,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(id_simulado, id_questao)
);

-- Índices para Performance
CREATE INDEX IF NOT EXISTS idx_simulados_ativo ON public.simulados(ativo);
CREATE INDEX IF NOT EXISTS idx_simulados_data ON public.simulados(data_criacao DESC);
CREATE INDEX IF NOT EXISTS idx_simulado_questoes_simulado ON public.simulado_questoes(id_simulado);
CREATE INDEX IF NOT EXISTS idx_simulado_questoes_questao ON public.simulado_questoes(id_questao);

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION public.fn_update_simulados_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.data_atualizacao = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar timestamp
DROP TRIGGER IF EXISTS trg_update_simulados_timestamp ON public.simulados;
CREATE TRIGGER trg_update_simulados_timestamp
BEFORE UPDATE ON public.simulados
FOR EACH ROW
EXECUTE FUNCTION public.fn_update_simulados_timestamp();

-- View para contar questões por simulado
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

-- RLS: Ativar segurança (leitura pública, escrita restrita)
ALTER TABLE public.simulados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulado_questoes ENABLE ROW LEVEL SECURITY;

-- Policy: Leitura pública de simulados ativos
CREATE POLICY "Leitura pública de simulados"
ON public.simulados
FOR SELECT
USING (ativo = true);

-- Policy: Admin pode fazer tudo
CREATE POLICY "Admin gerencia simulados"
ON public.simulados
FOR ALL
USING (auth.uid() IN (SELECT auth_user_id FROM public.usuarios WHERE papel = 'admin'));

-- Policy: Leitura pública de relacionamento
CREATE POLICY "Leitura pública de simulado_questoes"
ON public.simulado_questoes
FOR SELECT
USING (true);

-- Policy: Admin gerencia relacionamento
CREATE POLICY "Admin gerencia simulado_questoes"
ON public.simulado_questoes
FOR ALL
USING (auth.uid() IN (SELECT auth_user_id FROM public.usuarios WHERE papel = 'admin'));

DO $$
BEGIN
  RAISE NOTICE '✅ Tabelas simulados e simulado_questoes criadas com sucesso!';
  RAISE NOTICE '✅ Índices e triggers configurados';
  RAISE NOTICE '✅ RLS ativado com políticas de acesso';
  RAISE NOTICE '✅ View vw_simulados_com_questoes criada';
END $$;
