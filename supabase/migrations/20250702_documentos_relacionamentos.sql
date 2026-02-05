-- =====================================================
-- MIGRAÇÃO: Relacionamentos de Documentos
-- Data: 2025-07-02
-- Descrição: Adiciona FKs cliente_id, lead_id e soft delete
-- =====================================================

-- 1. Adiciona coluna cliente_id como FK para clientes
ALTER TABLE documentos 
ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL;

-- 2. Adiciona coluna lead_id como FK para leads
ALTER TABLE documentos 
ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id) ON DELETE SET NULL;

-- 3. Adiciona colunas de soft delete
ALTER TABLE documentos 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE documentos 
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 4. Cria índices para performance
CREATE INDEX IF NOT EXISTS idx_documentos_cliente_id ON documentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_documentos_lead_id ON documentos(lead_id);
CREATE INDEX IF NOT EXISTS idx_documentos_deleted_at ON documentos(deleted_at);

-- 5. Índice parcial para documentos ativos (não arquivados)
CREATE INDEX IF NOT EXISTS idx_documentos_ativos ON documentos(caso_id, cliente_id) 
WHERE deleted_at IS NULL;

-- 6. Migra dados existentes: popula cliente_id baseado no caso_id
-- (Se o documento já tem caso_id, pega o cliente_id do caso)
UPDATE documentos d
SET cliente_id = c.cliente_id
FROM casos c
WHERE d.caso_id = c.id
AND d.cliente_id IS NULL
AND c.cliente_id IS NOT NULL;

-- 7. Comentários nas colunas para documentação
COMMENT ON COLUMN documentos.cliente_id IS 'FK para clientes - relacionamento direto com cliente';
COMMENT ON COLUMN documentos.lead_id IS 'FK para leads - documento relacionado a lead (pré-cliente)';
COMMENT ON COLUMN documentos.deleted_at IS 'Timestamp de soft delete (arquivamento)';
COMMENT ON COLUMN documentos.deleted_by IS 'Usuário que arquivou o documento';

-- 8. RLS Policy atualizada para filtrar documentos arquivados por padrão
-- (Mantenha as policies existentes, esta é uma sugestão de policy adicional)

-- Verifica se já existe a policy antes de criar
DO $$
BEGIN
  -- Drop policy se existir para recriar
  DROP POLICY IF EXISTS "Documentos: Filtrar arquivados" ON documentos;
  
  -- Cria nova policy que exclui arquivados da visualização normal
  -- Nota: Esta policy é opcional, já que o filtro está no service
  -- CREATE POLICY "Documentos: Filtrar arquivados" 
  -- ON documentos FOR SELECT
  -- USING (deleted_at IS NULL OR current_setting('app.show_archived', true) = 'true');
  
EXCEPTION
  WHEN undefined_object THEN
    -- Policy não existe, não faz nada
    NULL;
END $$;

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================
DO $$
DECLARE
  v_count INT;
BEGIN
  -- Verifica se as colunas foram criadas
  SELECT COUNT(*) INTO v_count
  FROM information_schema.columns
  WHERE table_name = 'documentos'
    AND column_name IN ('cliente_id', 'lead_id', 'deleted_at', 'deleted_by');
  
  IF v_count = 4 THEN
    RAISE NOTICE '✅ Migração concluída com sucesso! Todas as 4 colunas foram criadas.';
  ELSE
    RAISE NOTICE '⚠️ Migração parcial: % de 4 colunas criadas.', v_count;
  END IF;
  
  -- Mostra quantos documentos foram atualizados com cliente_id
  SELECT COUNT(*) INTO v_count FROM documentos WHERE cliente_id IS NOT NULL;
  RAISE NOTICE '📄 Documentos com cliente_id populado: %', v_count;
END $$;
