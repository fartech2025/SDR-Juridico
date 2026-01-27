-- RLS admin global access and role helpers
-- Uses public.usuarios.permissoes with value: fartech_admin
-- Uses public.org_members.role with values: admin, gestor, advogado, secretaria, leitura

begin;

create or replace function public.is_global_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.usuarios u
    where u.id = auth.uid()
      and u.permissoes @> array['fartech_admin']::text[]
  );
$$;

create or replace function public.is_member(_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.is_global_admin()
  or exists (
    select 1
    from public.org_members m
    where m.org_id = _org
      and m.user_id = auth.uid()
      and m.ativo = true
  );
$$;

create or replace function public.is_adminish(_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.is_global_admin()
  or exists (
    select 1
    from public.org_members m
    where m.org_id = _org
      and m.user_id = auth.uid()
      and m.ativo = true
      and m.role in ('admin', 'gestor')
  );
$$;

create or replace function public.is_staff(_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.is_global_admin()
  or exists (
    select 1
    from public.org_members m
    where m.org_id = _org
      and m.user_id = auth.uid()
      and m.ativo = true
      and m.role in ('admin', 'gestor', 'advogado', 'secretaria')
  );
$$;

create or replace function public.is_advogado(_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.is_global_admin()
  or exists (
    select 1
    from public.org_members m
    where m.org_id = _org
      and m.user_id = auth.uid()
      and m.ativo = true
      and m.role = 'advogado'
  );
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'orgs',
    'org_members',
    'leads',
    'clientes',
    'casos',
    'documentos',
    'agendamentos',
    'notas',
    'integrations',
    'datajud_processos',
    'datajud_movimentacoes',
    'datajud_sync_jobs',
    'templates',
    'conversas',
    'mensagens',
    'message_buffer',
    'advogado_carteira_clientes',
    'audit_log',
    'analytics_events'
  ]
  loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I enable row level security', t);
      execute format('drop policy if exists admin_all_%s on public.%I', t, t);
      execute format($sql$
        create policy admin_all_%s
        on public.%I
        for all
        using (public.is_global_admin())
        with check (public.is_global_admin())
      $sql$, t, t);
    end if;
  end loop;
end $$;

-- Allow authenticated users to insert audit logs (keeps select restricted)
do $$
begin
  if to_regclass('public.audit_log') is not null then
    execute 'drop policy if exists audit_insert_none on public.audit_log';
    execute 'drop policy if exists audit_insert_authenticated on public.audit_log';
    execute $sql$
      create policy audit_insert_authenticated
      on public.audit_log
      for insert
      with check (auth.role() = 'authenticated')
    $sql$;
  end if;
end $$;

-- Ensure org members can read/write core data without relying on USUARIOS
do $$
begin
  if to_regclass('public.leads') is not null then
    execute 'drop policy if exists fartech_admin_all_leads on public.leads';
    execute 'drop policy if exists users_own_org_leads on public.leads';
    execute 'drop policy if exists leads_member_select on public.leads';
    execute 'drop policy if exists leads_staff_write on public.leads';
    execute 'drop policy if exists leads_adminish_write on public.leads';
    execute $sql$
      create policy leads_member_select
      on public.leads
      for select
      using (public.is_member(org_id))
    $sql$;
    execute $sql$
      create policy leads_adminish_write
      on public.leads
      for all
      using (public.is_adminish(org_id))
      with check (public.is_adminish(org_id))
    $sql$;
  end if;

  if to_regclass('public.clientes') is not null then
    execute 'drop policy if exists fartech_admin_all_clientes on public.clientes';
    execute 'drop policy if exists users_own_org_clientes on public.clientes';
    execute 'drop policy if exists clientes_member_select on public.clientes';
    execute 'drop policy if exists clientes_staff_write on public.clientes';
    execute 'drop policy if exists clientes_adminish_write on public.clientes';
    execute $sql$
      create policy clientes_member_select
      on public.clientes
      for select
      using (public.is_member(org_id))
    $sql$;
    execute $sql$
      create policy clientes_adminish_write
      on public.clientes
      for all
      using (public.is_adminish(org_id))
      with check (public.is_adminish(org_id))
    $sql$;
  end if;

  if to_regclass('public.casos') is not null then
    execute 'drop policy if exists fartech_admin_all_casos on public.casos';
    execute 'drop policy if exists users_own_org_casos on public.casos';
    execute 'drop policy if exists casos_member_select on public.casos';
    execute 'drop policy if exists casos_staff_write on public.casos';
    execute 'drop policy if exists casos_adminish_write on public.casos';
    execute $sql$
      create policy casos_member_select
      on public.casos
      for select
      using (public.is_member(org_id))
    $sql$;
    execute $sql$
      create policy casos_adminish_write
      on public.casos
      for all
      using (public.is_adminish(org_id))
      with check (public.is_adminish(org_id))
    $sql$;
  end if;
end $$;

-- Restrict documentos write access to admin/gestor and above
do $$
begin
  if to_regclass('public.documentos') is not null then
    execute 'drop policy if exists documentos_insert_scoped on public.documentos';
    execute 'drop policy if exists documentos_update_scoped on public.documentos';
    execute 'drop policy if exists documentos_delete_scoped on public.documentos';
    execute 'drop policy if exists users_own_org_documentos on public.documentos';
    execute 'drop policy if exists fartech_admin_all_documentos on public.documentos';
    execute 'drop policy if exists documentos_adminish_write on public.documentos';
    execute $sql$
      create policy documentos_adminish_write
      on public.documentos
      for all
      using (public.is_adminish(org_id))
      with check (public.is_adminish(org_id))
    $sql$;
  end if;
end $$;

commit;
