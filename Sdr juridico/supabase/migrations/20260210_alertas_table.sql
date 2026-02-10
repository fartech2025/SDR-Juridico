-- Migration: Sistema de Alertas Persistente
-- Data: 2026-02-10
-- Descrição: Tabela de alertas/notificações persistentes alimentada por crons e eventos do sistema

CREATE TABLE IF NOT EXISTS public.alertas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL = alerta org-wide
  tipo TEXT NOT NULL, -- 'datajud_movimento', 'dou_publicacao', 'tarefa_vencida', 'caso_critico', 'lead_esfriando'
  prioridade TEXT NOT NULL DEFAULT 'P2', -- P0, P1, P2
  titulo TEXT NOT NULL,
  descricao TEXT,
  entidade TEXT, -- 'lead', 'caso', 'tarefa', 'documento', etc.
  entidade_id UUID,
  action_href TEXT,
  lida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para queries rápidas
CREATE INDEX IF NOT EXISTS idx_alertas_org_lida_created
  ON public.alertas(org_id, lida, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alertas_user
  ON public.alertas(user_id)
  WHERE user_id IS NOT NULL;

-- RLS
ALTER TABLE public.alertas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alertas_select_org_member"
  ON public.alertas
  FOR SELECT USING (is_org_member(org_id));

CREATE POLICY "alertas_insert_org_member"
  ON public.alertas
  FOR INSERT WITH CHECK (is_org_member(org_id));

CREATE POLICY "alertas_update_org_member"
  ON public.alertas
  FOR UPDATE USING (is_org_member(org_id));

CREATE POLICY "alertas_delete_org_admin"
  ON public.alertas
  FOR DELETE USING (is_org_admin_for_org(org_id));

COMMENT ON TABLE public.alertas IS 'Notificações persistentes do sistema, alimentadas por crons e eventos';
