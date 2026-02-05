-- =====================================================
-- CONFIGURAÇÃO: Bucket de Storage para Documentos
-- =====================================================
-- Execute este SQL no Supabase SQL Editor para criar o bucket de storage
-- Nota: O bucket de storage precisa ser criado manualmente pelo dashboard do Supabase
-- ou via API, pois a tabela storage.buckets é interna do Supabase

-- Verificar se o bucket existe
SELECT * FROM storage.buckets WHERE id = 'documentos';

-- Se não existir, você pode criar pelo Dashboard do Supabase:
-- 1. Acesse: https://supabase.com/dashboard/project/xocqcoebreoiaqxoutar/storage/buckets
-- 2. Clique em "New bucket"
-- 3. Nome: documentos
-- 4. Marque "Public bucket" como FALSE (privado)
-- 5. Clique em "Create bucket"

-- Ou via SQL (se tiver permissão):
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documentos',
  'documentos',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- POLÍTICAS DE STORAGE (RLS)
-- =====================================================

-- Permitir upload para usuários autenticados
DROP POLICY IF EXISTS "Usuarios podem fazer upload" ON storage.objects;
CREATE POLICY "Usuarios podem fazer upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documentos');

-- Permitir leitura de seus próprios arquivos
DROP POLICY IF EXISTS "Usuarios podem ler seus arquivos" ON storage.objects;
CREATE POLICY "Usuarios podem ler seus arquivos" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'documentos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Permitir update de seus próprios arquivos
DROP POLICY IF EXISTS "Usuarios podem atualizar seus arquivos" ON storage.objects;
CREATE POLICY "Usuarios podem atualizar seus arquivos" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'documentos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Permitir delete de seus próprios arquivos
DROP POLICY IF EXISTS "Usuarios podem deletar seus arquivos" ON storage.objects;
CREATE POLICY "Usuarios podem deletar seus arquivos" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'documentos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'documentos') THEN
    RAISE NOTICE '✅ Bucket "documentos" existe!';
  ELSE
    RAISE NOTICE '❌ Bucket "documentos" NÃO existe. Crie pelo Dashboard do Supabase.';
  END IF;
END $$;
