-- Migration: campos de onboarding na tabela orgs
-- onboarding_version: NULL = nunca completou o wizard; 'x.y.z' = última versão aceita
-- onboarding_step: passo salvo caso o usuário abandone no meio do wizard

ALTER TABLE public.orgs
  ADD COLUMN IF NOT EXISTS onboarding_version TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS onboarding_step    TEXT NOT NULL DEFAULT 'empresa';

COMMENT ON COLUMN public.orgs.onboarding_version IS
  'Última versão do produto em que o onboarding foi concluído. NULL = wizard nunca finalizado.';

COMMENT ON COLUMN public.orgs.onboarding_step IS
  'Último passo salvo do wizard (empresa | equipe | integracoes | pronto). Permite retomar de onde parou.';
