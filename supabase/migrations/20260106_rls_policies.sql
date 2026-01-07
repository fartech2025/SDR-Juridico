-- RLS Policies for Sdr Juridico app (Leads, Clientes, Casos, Documentos, Agenda)
-- Date: 2026-01-06

-- Helper: enable RLS on all tables
alter table if exists public.leads enable row level security;
alter table if exists public.clientes enable row level security;
alter table if exists public.casos enable row level security;
alter table if exists public.documentos enable row level security;
alter table if exists public.agenda enable row level security;

-- Drop existing generic policies to avoid duplicates
-- Leads
drop policy if exists "leads_select_authenticated" on public.leads;
drop policy if exists "leads_insert_authenticated" on public.leads;
drop policy if exists "leads_update_authenticated" on public.leads;
drop policy if exists "leads_delete_authenticated" on public.leads;

-- Clientes
drop policy if exists "clientes_select_authenticated" on public.clientes;
drop policy if exists "clientes_insert_authenticated" on public.clientes;
drop policy if exists "clientes_update_authenticated" on public.clientes;
drop policy if exists "clientes_delete_authenticated" on public.clientes;

-- Casos
drop policy if exists "casos_select_authenticated" on public.casos;
drop policy if exists "casos_insert_authenticated" on public.casos;
drop policy if exists "casos_update_authenticated" on public.casos;
drop policy if exists "casos_delete_authenticated" on public.casos;

-- Documentos
drop policy if exists "documentos_select_authenticated" on public.documentos;
drop policy if exists "documentos_insert_authenticated" on public.documentos;
drop policy if exists "documentos_update_authenticated" on public.documentos;
drop policy if exists "documentos_delete_authenticated" on public.documentos;

-- Agenda
drop policy if exists "agenda_select_authenticated" on public.agenda;
drop policy if exists "agenda_insert_authenticated" on public.agenda;
drop policy if exists "agenda_update_authenticated" on public.agenda;
drop policy if exists "agenda_delete_authenticated" on public.agenda;

-- Leads policies
create policy "leads_select_authenticated" on public.leads
  for select using ( auth.role() = 'authenticated' );
create policy "leads_insert_authenticated" on public.leads
  for insert with check ( auth.role() = 'authenticated' );
create policy "leads_update_authenticated" on public.leads
  for update using ( auth.role() = 'authenticated' );
create policy "leads_delete_authenticated" on public.leads
  for delete using ( auth.role() = 'authenticated' );

-- Clientes policies
create policy "clientes_select_authenticated" on public.clientes
  for select using ( auth.role() = 'authenticated' );
create policy "clientes_insert_authenticated" on public.clientes
  for insert with check ( auth.role() = 'authenticated' );
create policy "clientes_update_authenticated" on public.clientes
  for update using ( auth.role() = 'authenticated' );
create policy "clientes_delete_authenticated" on public.clientes
  for delete using ( auth.role() = 'authenticated' );

-- Casos policies
create policy "casos_select_authenticated" on public.casos
  for select using ( auth.role() = 'authenticated' );
create policy "casos_insert_authenticated" on public.casos
  for insert with check ( auth.role() = 'authenticated' );
create policy "casos_update_authenticated" on public.casos
  for update using ( auth.role() = 'authenticated' );
create policy "casos_delete_authenticated" on public.casos
  for delete using ( auth.role() = 'authenticated' );

-- Documentos policies
create policy "documentos_select_authenticated" on public.documentos
  for select using ( auth.role() = 'authenticated' );
create policy "documentos_insert_authenticated" on public.documentos
  for insert with check ( auth.role() = 'authenticated' );
create policy "documentos_update_authenticated" on public.documentos
  for update using ( auth.role() = 'authenticated' );
create policy "documentos_delete_authenticated" on public.documentos
  for delete using ( auth.role() = 'authenticated' );

-- Agenda policies
create policy "agenda_select_authenticated" on public.agenda
  for select using ( auth.role() = 'authenticated' );
create policy "agenda_insert_authenticated" on public.agenda
  for insert with check ( auth.role() = 'authenticated' );
create policy "agenda_update_authenticated" on public.agenda
  for update using ( auth.role() = 'authenticated' );
create policy "agenda_delete_authenticated" on public.agenda
  for delete using ( auth.role() = 'authenticated' );
