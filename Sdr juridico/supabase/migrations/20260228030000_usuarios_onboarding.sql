-- Rastreia se o usuário já viu o onboarding (por usuário, não por org)
-- NULL = nunca viu; 'x.y.z' = última versão aceita pelo usuário
ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS onboarding_version TEXT DEFAULT NULL;
