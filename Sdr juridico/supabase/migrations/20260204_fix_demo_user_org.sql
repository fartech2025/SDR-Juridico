-- =============================================================================
-- CORREÇÃO: Vincular usuário gestor@demo.local a uma organização
-- =============================================================================

-- 1. Verificar situação atual
DO $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT := 'gestor@demo.local';
  v_org_id UUID;
  v_org_member_exists BOOLEAN;
BEGIN
  -- Buscar ID do usuário no auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_user_email;

  IF v_user_id IS NULL THEN
    RAISE NOTICE '❌ Usuário % não encontrado em auth.users', v_user_email;
    RETURN;
  END IF;

  RAISE NOTICE '✅ Usuário encontrado: % (ID: %)', v_user_email, v_user_id;

  -- Verificar se existe em usuarios
  IF NOT EXISTS (SELECT 1 FROM usuarios WHERE id = v_user_id) THEN
    RAISE NOTICE '⚠️  Usuário não existe na tabela usuarios. Criando...';
    INSERT INTO usuarios (id, email, nome_completo, permissoes, status)
    VALUES (v_user_id, v_user_email, 'Gestor Demo', ARRAY['org_admin']::text[], 'ativo');
    RAISE NOTICE '✅ Usuário criado na tabela usuarios';
  ELSE
    RAISE NOTICE '✅ Usuário existe na tabela usuarios';
  END IF;

  -- Buscar uma organização existente
  SELECT id INTO v_org_id FROM organizations LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE NOTICE '⚠️  Nenhuma organização encontrada. Criando organização demo...';
    INSERT INTO organizations (nome, slug, plano, ativo)
    VALUES ('Organização Demo', 'org-demo', 'trial', true)
    RETURNING id INTO v_org_id;
    RAISE NOTICE '✅ Organização criada: %', v_org_id;
  ELSE
    RAISE NOTICE '✅ Organização encontrada: %', v_org_id;
  END IF;

  -- Verificar se existe vínculo em org_members
  SELECT EXISTS (
    SELECT 1 FROM org_members WHERE user_id = v_user_id
  ) INTO v_org_member_exists;

  IF v_org_member_exists THEN
    RAISE NOTICE '⚠️  Usuário já tem registro em org_members. Atualizando para ativo...';
    UPDATE org_members
    SET ativo = true, org_id = v_org_id, role = 'gestor', updated_at = NOW()
    WHERE user_id = v_user_id;
    RAISE NOTICE '✅ Registro atualizado';
  ELSE
    RAISE NOTICE '⚠️  Usuário não tem registro em org_members. Criando...';
    INSERT INTO org_members (user_id, org_id, role, ativo)
    VALUES (v_user_id, v_org_id, 'gestor', true);
    RAISE NOTICE '✅ Vínculo criado';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '================================================================';
  RAISE NOTICE 'CORREÇÃO APLICADA COM SUCESSO!';
  RAISE NOTICE 'Usuário: %', v_user_email;
  RAISE NOTICE 'Org ID: %', v_org_id;
  RAISE NOTICE 'Role: gestor';
  RAISE NOTICE 'Ativo: true';
  RAISE NOTICE '================================================================';
END $$;

-- 2. Mostrar resultado final
SELECT
  u.email,
  u.nome_completo,
  u.permissoes,
  om.org_id,
  om.role,
  om.ativo,
  o.nome as org_nome
FROM usuarios u
LEFT JOIN org_members om ON u.id = om.user_id
LEFT JOIN organizations o ON om.org_id = o.id
WHERE u.email = 'gestor@demo.local';
