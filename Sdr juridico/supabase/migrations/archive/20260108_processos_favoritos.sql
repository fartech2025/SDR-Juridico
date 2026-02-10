-- Migration: Sistema de Favoritos e Histórico de Consultas
-- Data: 2026-01-08
-- Descrição: Tabelas para favoritos, histórico e analytics

-- Tabela de processos favoritos/acompanhados
CREATE TABLE IF NOT EXISTS processos_favoritos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numero_processo TEXT NOT NULL,
  tribunal TEXT NOT NULL,
  classe TEXT,
  orgao_julgador TEXT,
  data_ajuizamento DATE,
  descricao TEXT, -- Nota pessoal do usuário
  tags TEXT[], -- Tags personalizadas
  notificar BOOLEAN DEFAULT true, -- Receber notificações
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  ultima_movimentacao TIMESTAMPTZ,
  
  UNIQUE(user_id, numero_processo)
);

-- Tabela de histórico de consultas
CREATE TABLE IF NOT EXISTS historico_consultas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  numero_processo TEXT NOT NULL,
  tribunal TEXT NOT NULL,
  tipo_busca TEXT, -- 'numero', 'parte', 'classe', etc
  consultado_em TIMESTAMPTZ DEFAULT NOW(),
  tempo_resposta INTEGER, -- ms
  sucesso BOOLEAN DEFAULT true
);

-- Tabela de cache de dados CNPJ
CREATE TABLE IF NOT EXISTS cache_cnpj (
  cnpj TEXT PRIMARY KEY,
  razao_social TEXT,
  nome_fantasia TEXT,
  porte TEXT,
  situacao_cadastral TEXT,
  data_situacao_cadastral DATE,
  capital_social NUMERIC,
  natureza_juridica TEXT,
  atividade_principal TEXT,
  dados_completos JSONB,
  consultado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de movimentações detectadas (para notificações)
CREATE TABLE IF NOT EXISTS movimentacoes_detectadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_favorito_id UUID REFERENCES processos_favoritos(id) ON DELETE CASCADE,
  numero_processo TEXT NOT NULL,
  movimentacao_codigo INTEGER,
  movimentacao_nome TEXT,
  movimentacao_data TIMESTAMPTZ,
  movimentacao_complemento TEXT,
  detectado_em TIMESTAMPTZ DEFAULT NOW(),
  notificado BOOLEAN DEFAULT false,
  lido BOOLEAN DEFAULT false
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_favoritos_user ON processos_favoritos(user_id);
CREATE INDEX IF NOT EXISTS idx_favoritos_processo ON processos_favoritos(numero_processo);
CREATE INDEX IF NOT EXISTS idx_historico_user ON historico_consultas(user_id);
CREATE INDEX IF NOT EXISTS idx_historico_data ON historico_consultas(consultado_em DESC);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_favorito ON movimentacoes_detectadas(processo_favorito_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_lido ON movimentacoes_detectadas(lido) WHERE lido = false;

-- RLS Policies
ALTER TABLE processos_favoritos ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_consultas ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes_detectadas ENABLE ROW LEVEL SECURITY;

-- Policies: usuários só veem seus próprios dados
CREATE POLICY "Users can view own favorites" ON processos_favoritos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" ON processos_favoritos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own favorites" ON processos_favoritos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" ON processos_favoritos
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own history" ON historico_consultas
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own history" ON historico_consultas
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view own notifications" ON movimentacoes_detectadas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM processos_favoritos
      WHERE processos_favoritos.id = movimentacoes_detectadas.processo_favorito_id
      AND processos_favoritos.user_id = auth.uid()
    )
  );

-- Cache CNPJ é público (dados públicos da Receita)
ALTER TABLE cache_cnpj ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CNPJ cache is public read" ON cache_cnpj
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can update CNPJ cache" ON cache_cnpj
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_favoritos_updated_at
  BEFORE UPDATE ON processos_favoritos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cnpj_updated_at
  BEFORE UPDATE ON cache_cnpj
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- View para analytics
CREATE OR REPLACE VIEW analytics_consultas AS
SELECT 
  user_id,
  COUNT(*) as total_consultas,
  COUNT(DISTINCT numero_processo) as processos_unicos,
  COUNT(DISTINCT tribunal) as tribunais_consultados,
  AVG(tempo_resposta) as tempo_medio_resposta,
  SUM(CASE WHEN sucesso THEN 1 ELSE 0 END)::float / COUNT(*) as taxa_sucesso,
  DATE_TRUNC('day', consultado_em) as dia
FROM historico_consultas
WHERE consultado_em >= NOW() - INTERVAL '30 days'
GROUP BY user_id, DATE_TRUNC('day', consultado_em);

COMMENT ON TABLE processos_favoritos IS 'Processos marcados como favoritos pelos usuários';
COMMENT ON TABLE historico_consultas IS 'Histórico de todas as consultas realizadas';
COMMENT ON TABLE cache_cnpj IS 'Cache de dados da Receita Federal (CNPJ)';
COMMENT ON TABLE movimentacoes_detectadas IS 'Novas movimentações detectadas em processos favoritos';
