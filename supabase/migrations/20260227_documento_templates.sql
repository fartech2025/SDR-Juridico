-- =====================================================================
-- MIGRATION: documento_templates
-- Tabela de templates reutilizáveis para geração de documentos
-- via editor rich-text TipTap. Conteúdo armazenado como HTML puro (TEXT)
-- para custo zero de Storage.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.documento_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  titulo      TEXT NOT NULL,
  -- 'contrato' | 'peticao' | 'procuracao' | 'declaracao' | 'notificacao' | 'outro'
  categoria   TEXT NOT NULL CHECK (categoria IN ('contrato', 'peticao', 'procuracao', 'declaracao', 'notificacao', 'outro')),
  -- HTML gerado pelo TipTap — zero custo de Storage
  conteudo    TEXT NOT NULL DEFAULT '',
  -- [{ key: 'nome_cliente', label: 'Nome do Cliente', required: true, placeholder?: '...', hint?: '...' }]
  variaveis   JSONB NOT NULL DEFAULT '[]'::jsonb,
  criado_por  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Soft delete: templates são patrimônio da organização
  deleted_at  TIMESTAMPTZ,
  deleted_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Índice principal: busca de templates ativos da org
CREATE INDEX IF NOT EXISTS idx_doc_templates_org
  ON public.documento_templates(org_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Índice por categoria
CREATE INDEX IF NOT EXISTS idx_doc_templates_categoria
  ON public.documento_templates(org_id, categoria)
  WHERE deleted_at IS NULL;

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_documento_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_documento_templates_updated_at ON public.documento_templates;
CREATE TRIGGER trg_documento_templates_updated_at
  BEFORE UPDATE ON public.documento_templates
  FOR EACH ROW EXECUTE FUNCTION update_documento_templates_updated_at();

-- RLS
ALTER TABLE public.documento_templates ENABLE ROW LEVEL SECURITY;

-- Qualquer membro da org pode ver templates ativos
CREATE POLICY "doc_templates_select"
  ON public.documento_templates FOR SELECT
  USING (is_org_member(org_id) AND deleted_at IS NULL);

-- Qualquer membro pode criar templates
CREATE POLICY "doc_templates_insert"
  ON public.documento_templates FOR INSERT
  WITH CHECK (is_org_member(org_id));

-- Apenas org_admin atualiza (inclui soft delete)
CREATE POLICY "doc_templates_update"
  ON public.documento_templates FOR UPDATE
  USING (is_org_admin_for_org(org_id));

-- Hard delete não permitido via RLS (soft delete via UPDATE)
-- (sem policy DELETE = nenhuma role pode hard-deletar via API)
