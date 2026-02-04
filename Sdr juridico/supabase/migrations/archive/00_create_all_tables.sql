-- =====================================================
-- SDR Jurídico - Schema Completo do Banco de Dados
-- =====================================================
-- Este arquivo cria todas as tabelas necessárias para
-- o sistema SDR Jurídico com suas constraints e indexes
-- =====================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TABELA: usuarios
-- Perfis de usuários do sistema (complementa auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telefone TEXT,
  cargo TEXT,
  departamento TEXT,
  foto_url TEXT,
  permissoes TEXT[] DEFAULT ARRAY['user']::TEXT[],
  status TEXT NOT NULL DEFAULT 'ativo'
    CHECK (status IN ('ativo', 'inativo', 'suspenso')),
  ultimo_acesso TIMESTAMPTZ,
  preferencias JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes para usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios(status);
CREATE INDEX IF NOT EXISTS idx_usuarios_permissoes ON usuarios USING GIN(permissoes);

-- Trigger para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (id, nome_completo, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- =====================================================
-- TABELA: leads
-- Armazena leads de potenciais clientes
-- =====================================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  empresa TEXT,
  area TEXT,
  origem TEXT,
  status TEXT NOT NULL DEFAULT 'novo'
    CHECK (status IN ('novo', 'em_contato', 'qualificado', 'proposta', 'ganho', 'perdido')),
  heat TEXT NOT NULL DEFAULT 'frio'
    CHECK (heat IN ('quente', 'morno', 'frio')),
  ultimo_contato TIMESTAMPTZ,
  responsavel TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes para leads
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
-- CREATE INDEX IF NOT EXISTS idx_leads_heat ON leads(heat); -- Coluna heat não existe no banco
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- =====================================================
-- TABELA: clientes
-- Armazena clientes ativos do escritório
-- =====================================================
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  empresa TEXT,
  cnpj TEXT,
  cpf TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  area_atuacao TEXT,
  responsavel TEXT,
  status TEXT NOT NULL DEFAULT 'ativo'
    CHECK (status IN ('ativo', 'em_risco', 'inativo')),
  health TEXT DEFAULT 'ok'
    CHECK (health IN ('ok', 'atencao', 'critico')),
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes para clientes
-- CREATE INDEX IF NOT EXISTS idx_clientes_status ON clientes(status); -- Coluna status não existe no banco
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
-- CREATE INDEX IF NOT EXISTS idx_clientes_cnpj ON clientes(cnpj) WHERE cnpj IS NOT NULL; -- Coluna cnpj não existe
-- CREATE INDEX IF NOT EXISTS idx_clientes_cpf ON clientes(cpf) WHERE cpf IS NOT NULL; -- Coluna cpf não existe

-- =====================================================
-- TABELA: casos
-- Armazena casos jurídicos em andamento
-- =====================================================
CREATE TABLE IF NOT EXISTS casos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  area TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'aberto'
    CHECK (status IN ('aberto', 'em_andamento', 'resolvido', 'fechado', 'ativo', 'suspenso', 'encerrado')),
  prioridade TEXT NOT NULL DEFAULT 'media'
    CHECK (prioridade IN ('baixa', 'media', 'alta', 'critica')),
  heat TEXT DEFAULT 'morno'
    CHECK (heat IN ('quente', 'morno', 'frio')),
  stage TEXT DEFAULT 'triagem'
    CHECK (stage IN ('triagem', 'negociacao', 'em_andamento', 'conclusao')),
  valor DECIMAL(12, 2),
  sla_risk TEXT DEFAULT 'ok'
    CHECK (sla_risk IN ('ok', 'atencao', 'critico')),
  tags TEXT[],
  responsavel TEXT,
  data_abertura TIMESTAMPTZ DEFAULT NOW(),
  data_encerramento TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes para casos
CREATE INDEX IF NOT EXISTS idx_casos_status ON casos(status);
CREATE INDEX IF NOT EXISTS idx_casos_prioridade ON casos(prioridade);
CREATE INDEX IF NOT EXISTS idx_casos_cliente_id ON casos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_casos_lead_id ON casos(lead_id);
-- CREATE INDEX IF NOT EXISTS idx_casos_sla_risk ON casos(sla_risk); -- Coluna sla_risk não existe no banco
CREATE INDEX IF NOT EXISTS idx_casos_created_at ON casos(created_at DESC);

-- =====================================================
-- TABELA: documentos
-- Armazena documentos relacionados aos casos
-- =====================================================
CREATE TABLE IF NOT EXISTS documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  caso_id UUID REFERENCES casos(id) ON DELETE CASCADE,
  cliente_nome TEXT,
  tipo TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'solicitado', 'completo')),
  url TEXT,
  arquivo_nome TEXT,
  arquivo_tamanho INTEGER,
  mime_type TEXT,
  solicitado_por TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes para documentos
-- CREATE INDEX IF NOT EXISTS idx_documentos_status ON documentos(status); -- Coluna status não existe no banco atual
CREATE INDEX IF NOT EXISTS idx_documentos_caso_id ON documentos(caso_id);
-- CREATE INDEX IF NOT EXISTS idx_documentos_tipo ON documentos(tipo); -- Coluna tipo não existe no banco atual
CREATE INDEX IF NOT EXISTS idx_documentos_created_at ON documentos(created_at DESC);

-- =====================================================
-- TABELA: agenda
-- Armazena compromissos e eventos
-- =====================================================
CREATE TABLE IF NOT EXISTS agenda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL DEFAULT 'reuniao'
    CHECK (tipo IN ('reuniao', 'ligacao', 'visita', 'audiencia', 'prazo', 'follow_up', 'interno', 'assinatura')),
  data_inicio TIMESTAMPTZ NOT NULL,
  data_fim TIMESTAMPTZ NOT NULL,
  duracao_minutos INTEGER,
  cliente_nome TEXT,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  caso_id UUID REFERENCES casos(id) ON DELETE SET NULL,
  responsavel TEXT NOT NULL,
  local TEXT,
  status TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('confirmado', 'pendente', 'cancelado', 'concluido')),
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (data_fim >= data_inicio)
);

-- Indexes para agenda
CREATE INDEX IF NOT EXISTS idx_agenda_data_inicio ON agenda(data_inicio);
CREATE INDEX IF NOT EXISTS idx_agenda_status ON agenda(status);
CREATE INDEX IF NOT EXISTS idx_agenda_tipo ON agenda(tipo);
CREATE INDEX IF NOT EXISTS idx_agenda_cliente_id ON agenda(cliente_id);
CREATE INDEX IF NOT EXISTS idx_agenda_caso_id ON agenda(caso_id);
CREATE INDEX IF NOT EXISTS idx_agenda_responsavel ON agenda(responsavel);

-- =====================================================
-- TABELA: timeline_events
-- Registro cronológico de eventos dos casos
-- =====================================================
CREATE TABLE IF NOT EXISTS timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id UUID NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT NOT NULL
    CHECK (categoria IN ('docs', 'agenda', 'comercial', 'juridico', 'automacao', 'humano')),
  canal TEXT,
  autor TEXT,
  tags TEXT[],
  data_evento TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes para timeline_events
CREATE INDEX IF NOT EXISTS idx_timeline_caso_id ON timeline_events(caso_id);
CREATE INDEX IF NOT EXISTS idx_timeline_categoria ON timeline_events(categoria);
CREATE INDEX IF NOT EXISTS idx_timeline_data_evento ON timeline_events(data_evento DESC);

-- =====================================================
-- TABELA: notificacoes
-- Sistema de notificações e alertas
-- =====================================================
CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  prioridade TEXT NOT NULL DEFAULT 'P2'
    CHECK (prioridade IN ('P0', 'P1', 'P2')),
  tipo TEXT,
  link_url TEXT,
  link_label TEXT,
  lida BOOLEAN NOT NULL DEFAULT FALSE,
  caso_id UUID REFERENCES casos(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  usuario_responsavel TEXT,
  data_notificacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes para notificacoes
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida);
CREATE INDEX IF NOT EXISTS idx_notificacoes_prioridade ON notificacoes(prioridade);
CREATE INDEX IF NOT EXISTS idx_notificacoes_data ON notificacoes(data_notificacao DESC);
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario ON notificacoes(usuario_responsavel);

-- =====================================================
-- FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de updated_at em todas as tabelas relevantes
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_casos_updated_at BEFORE UPDATE ON casos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documentos_updated_at BEFORE UPDATE ON documentos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agenda_updated_at BEFORE UPDATE ON agenda
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- NOTE: Legacy RLS policies removed. Use multi-tenant scripts for RLS.
-- =====================================================
-- =====================================================
-- VIEWS ÚTEIS
-- =====================================================

-- View: casos_completos (casos com informações de clientes)
CREATE OR REPLACE VIEW casos_completos AS
SELECT 
  c.*,
  cl.nome AS cliente_nome,
  cl.email AS cliusuarios IS 'Perfis de usuários do sistema (complementa auth.users)';
COMMENT ON TABLE ente_email,
  cl.telefone AS cliente_telefone,
  (SELECT COUNT(*) FROM documentos d WHERE d.caso_id = c.id) AS total_documentos,
  (SELECT COUNT(*) FROM timeline_events te WHERE te.caso_id = c.id) AS total_eventos
FROM casos c
LEFT JOIN clientes cl ON c.cliente_id = cl.id;

-- View: estatisticas_gerais
CREATE OR REPLACE VIEW estatisticas_gerais AS
SELECT
  (SELECT COUNT(*) FROM leads WHERE status != 'perdido') AS leads_ativos,
  (SELECT COUNT(*) FROM clientes WHERE status = 'ativo') AS clientes_ativos,
  (SELECT COUNT(*) FROM casos WHERE status IN ('aberto', 'em_andamento', 'ativo')) AS casos_ativos,
  (SELECT COUNT(*) FROM documentos WHERE status = 'pendente') AS documentos_pendentes,
  (SELECT COUNT(*) FROM agenda WHERE status = 'confirmado' AND data_inicio >= NOW()) AS proximos_eventos;

-- =====================================================
-- COMENTÁRIOS NAS TABELAS
-- =====================================================

COMMENT ON TABLE leads IS 'Armazena leads de potenciais clientes do escritório';
COMMENT ON TABLE clientes IS 'Cadastro de clientes ativos do escritório';
COMMENT ON TABLE casos IS 'Casos jurídicos em andamento ou concluídos';
COMMENT ON TABLE documentos IS 'Documentos relacionados aos casos';
COMMENT ON TABLE agenda IS 'Compromissos, reuniões e eventos';
COMMENT ON TABLE timeline_events IS 'Histórico cronológico de eventos dos casos';
COMMENT ON TABLE notificacoes IS 'Sistema de notificações e alertas para usuários';

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
