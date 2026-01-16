-- Seed base data for SDR Juridico (org, users from auth, membership, and samples).
-- Update the org name/admin email if needed before running.

begin;

do $$
declare
  v_org_name text := 'SDR Juridico';
  v_seed_admin_email text := 'admin@fartech.com.br';
  v_org_id uuid;
  v_admin_id uuid;
  v_lead_id uuid;
  v_cliente_id uuid;
  v_caso_id uuid;
begin
  -- Create or reuse org
  select id into v_org_id
  from public.orgs
  where nome = v_org_name
  limit 1;

  if v_org_id is null then
    insert into public.orgs (nome, ativo, settings)
    values (v_org_name, true, '{}'::jsonb)
    returning id into v_org_id;
  end if;

  -- Seed users based on auth.users data
  create temporary table _seed_users (
    user_id uuid,
    email text,
    nome text,
    permissoes text[],
    role text,
    is_fartech_admin boolean
  ) on commit drop;

  insert into _seed_users (user_id, email, nome, permissoes, role, is_fartech_admin)
  values
    ('83438053-85e9-4a41-9365-f405f99bbff5', 'admin@demo.local', 'Admin Demo', array['admin','fartech_admin'], 'admin', true),
    ('bad883f0-53f9-4025-9795-a62f7343c9af', 'admin@fartech.com.br', 'Admin Fartech', array['admin','fartech_admin'], 'admin', true),
    ('5d1e10f1-6e3c-4f87-a212-056addf6e37b', 'adv1@demo.local', 'Advogado 1', array['user'], 'advogado', false),
    ('8a5b3338-86fc-4d1f-a798-4a9935d6108b', 'adv2@demo.local', 'Advogado 2', array['user'], 'advogado', false),
    ('1930fef4-ed7f-4c3b-8bfa-f7d956966a9b', 'frpdias@hotmail.com', 'Usuario Externo', array['user'], 'leitura', false),
    ('063c0b94-1d86-4e01-9430-1e5947d7d7e3', 'gestor@demo.local', 'Gestor', array['user'], 'gestor', false),
    ('f62c73a9-f19f-48c9-9b05-ae27ba7a8ef0', 'secretaria@demo.local', 'Secretaria', array['user'], 'secretaria', false);

  -- Validate auth users exist
  if exists (
    select 1
    from _seed_users su
    left join auth.users au on au.id = su.user_id
    where au.id is null
  ) then
    raise exception 'Um ou mais usuarios nao existem em auth.users. Verifique os IDs.';
  end if;

  -- Upsert usuarios
  insert into public.usuarios (id, nome_completo, email, permissoes)
  select user_id, nome, email, permissoes
  from _seed_users
  on conflict (id)
  do update set
    nome_completo = excluded.nome_completo,
    email = excluded.email,
    permissoes = excluded.permissoes;

  -- Keep profiles in sync
  insert into public.profiles (user_id, org_id, role, is_fartech_admin)
  select user_id, v_org_id, role, is_fartech_admin
  from _seed_users
  on conflict (user_id)
  do update set
    org_id = excluded.org_id,
    role = excluded.role,
    is_fartech_admin = excluded.is_fartech_admin;

  -- Ensure org members
  insert into public.org_members (id, org_id, user_id, role, ativo)
  select gen_random_uuid(), v_org_id, su.user_id, su.role, true
  from _seed_users su
  where not exists (
    select 1
    from public.org_members om
    where om.org_id = v_org_id
      and om.user_id = su.user_id
  );

  update public.org_members om
  set role = su.role,
      ativo = true
  from _seed_users su
  where om.org_id = v_org_id
    and om.user_id = su.user_id;

  -- Pick admin user for seeded records
  select user_id into v_admin_id
  from _seed_users
  where email = v_seed_admin_email
  limit 1;

  if v_admin_id is null then
    select user_id into v_admin_id
    from _seed_users
    where role = 'admin'
    limit 1;
  end if;

  -- Seed cliente
  insert into public.clientes (
    org_id, tipo, nome, documento, email, telefone, endereco, tags, observacoes, owner_user_id
  )
  values (
    v_org_id, 'pf', 'Cliente Exemplo', null, 'cliente@exemplo.com', '11999999999',
    '{}'::jsonb, array[]::text[], 'Seed', v_admin_id
  )
  returning id into v_cliente_id;

  -- Seed lead
  insert into public.leads (
    org_id, status, canal, nome, telefone, email, origem, assunto, resumo,
    qualificacao, assigned_user_id, cliente_id, last_contact_at
  )
  values (
    v_org_id, 'novo', 'whatsapp', 'Lead Exemplo', '11988888888', 'lead@exemplo.com',
    'Indicacao', 'Geral', 'Seed',
    jsonb_build_object('heat','frio'), v_admin_id, v_cliente_id, now()
  )
  returning id into v_lead_id;

  -- Seed caso
  insert into public.casos (
    org_id, status, titulo, area, descricao, cliente_id, lead_id,
    responsavel_user_id, prioridade, valor_estimado, fase_atual
  )
  values (
    v_org_id, 'triagem', 'Caso Exemplo', 'Geral', 'Seed', v_cliente_id, v_lead_id,
    v_admin_id, 2, 0, 'triagem'
  )
  returning id into v_caso_id;

  -- Seed documento
  insert into public.documentos (
    org_id, title, description, visibility, bucket, storage_path, mime_type,
    size_bytes, lead_id, cliente_id, caso_id, uploaded_by, tags, meta
  )
  values (
    v_org_id, 'Documento Exemplo', 'Seed', 'interno', 'docs', 'seed/arquivo.pdf',
    'application/pdf', 12345, v_lead_id, v_cliente_id, v_caso_id, v_admin_id,
    array[]::text[], '{}'::jsonb
  );

  -- Seed agendamento
  insert into public.agendamentos (
    org_id, title, start_at, end_at, location, description, owner_user_id,
    lead_id, cliente_id, caso_id, meta
  )
  values (
    v_org_id, 'Reuniao Inicial', now() + interval '1 day',
    now() + interval '1 day' + interval '1 hour', 'Online', 'Seed',
    v_admin_id, v_lead_id, v_cliente_id, v_caso_id,
    jsonb_build_object('tipo','reuniao','status','pendente')
  );

  -- Seed nota
  insert into public.notas (org_id, entidade, entidade_id, texto, created_by, tags)
  values (v_org_id, 'caso', v_caso_id, 'Nota inicial do caso', v_admin_id, array['juridico']);
end $$;

commit;
