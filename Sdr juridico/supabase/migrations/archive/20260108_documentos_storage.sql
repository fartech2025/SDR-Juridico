-- Criar bucket para documentos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documentos',
  'documentos',
  false,
  10485760, -- 10MB
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Criar tabela de documentos
CREATE TABLE IF NOT EXISTS documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_arquivo TEXT NOT NULL,
  nome_original TEXT NOT NULL,
  tipo_arquivo TEXT NOT NULL,
  tamanho_bytes BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  caso_id UUID,
  categoria TEXT DEFAULT 'geral', -- geral, contrato, processo, comprovante, etc
  tags TEXT[],
  descricao TEXT,
  status TEXT DEFAULT 'pendente', -- pendente, aprovado, rejeitado
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index para melhor performance
CREATE INDEX IF NOT EXISTS idx_documentos_user_id ON documentos(user_id);
CREATE INDEX IF NOT EXISTS idx_documentos_caso_id ON documentos(caso_id);
CREATE INDEX IF NOT EXISTS idx_documentos_categoria ON documentos(categoria);
CREATE INDEX IF NOT EXISTS idx_documentos_status ON documentos(status);
CREATE INDEX IF NOT EXISTS idx_documentos_created_at ON documentos(created_at DESC);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_documentos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_documentos_updated_at
  BEFORE UPDATE ON documentos
  FOR EACH ROW
  EXECUTE FUNCTION update_documentos_updated_at();

-- RLS Policies
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas seus próprios documentos
CREATE POLICY "Usuários veem apenas seus documentos"
  ON documentos FOR SELECT
  USING (auth.uid() = user_id);

-- Usuários podem inserir seus próprios documentos
CREATE POLICY "Usuários podem inserir documentos"
  ON documentos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar seus próprios documentos
CREATE POLICY "Usuários podem atualizar seus documentos"
  ON documentos FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem deletar seus próprios documentos
CREATE POLICY "Usuários podem deletar seus documentos"
  ON documentos FOR DELETE
  USING (auth.uid() = user_id);

-- Storage Policies para o bucket documentos
-- Usuários podem fazer upload de arquivos
CREATE POLICY "Usuários podem fazer upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documentos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Usuários podem ver seus próprios arquivos
CREATE POLICY "Usuários veem seus arquivos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documentos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Usuários podem deletar seus próprios arquivos
CREATE POLICY "Usuários podem deletar seus arquivos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documentos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Usuários podem atualizar seus próprios arquivos
CREATE POLICY "Usuários podem atualizar seus arquivos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'documentos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'documentos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
