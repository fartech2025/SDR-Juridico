-- Seed demo data for SDR Juridico (uses auth.users).
-- This script avoids duplicate inserts by checking natural keys.

begin;

do $$
declare
  v_org uuid;

  u_admin uuid;
  u_gestor uuid;
  u_adv1 uuid;
  u_adv2 uuid;
  u_sec uuid;

  c1 uuid; c2 uuid; c3 uuid; c4 uuid; c5 uuid;
  l1 uuid; l2 uuid; l3 uuid;
  ca1 uuid; ca2 uuid; ca3 uuid;
  cv1 uuid;
  p1 uuid; p2 uuid;
begin
  -- 0) Resolve users from Auth (mandatory)
  select id into u_admin from auth.users where email = 'admin@demo.local' limit 1;
  select id into u_gestor from auth.users where email = 'gestor@demo.local' limit 1;
  select id into u_adv1 from auth.users where email = 'adv1@demo.local' limit 1;
  select id into u_adv2 from auth.users where email = 'adv2@demo.local' limit 1;
  select id into u_sec from auth.users where email = 'secretaria@demo.local' limit 1;

  if u_admin is null or u_gestor is null or u_adv1 is null or u_adv2 is null or u_sec is null then
    raise exception
      'Faltam usuarios no Auth. Crie em Authentication > Users: admin@demo.local, gestor@demo.local, adv1@demo.local, adv2@demo.local, secretaria@demo.local';
  end if;

  -- 1) ORG (create or reuse)
  select id into v_org
  from public.orgs
  where nome = 'Demo Advocacia & Associados'
  limit 1;

  if v_org is null then
    insert into public.orgs (nome, cnpj, plano, settings, ativo)
    values (
      'Demo Advocacia & Associados',
      '12.345.678/0001-90',
      'pro',
      jsonb_build_object('timezone','America/Sao_Paulo','theme','premium_dark'),
      true
    )
    returning id into v_org;
  else
    update public.orgs
    set cnpj = '12.345.678/0001-90',
        plano = 'pro',
        settings = jsonb_build_object('timezone','America/Sao_Paulo','theme','premium_dark'),
        ativo = true
    where id = v_org;
  end if;

  -- 2) USERS / PROFILES / MEMBERSHIP
  create temporary table _seed_users (
    user_id uuid,
    email text,
    nome text,
    permissoes text[],
    role text
  ) on commit drop;

  insert into _seed_users (user_id, email, nome, permissoes, role)
  values
    (u_admin,  'admin@demo.local',      'Admin Demo',  array['gestor'],               'admin'),
    (u_gestor, 'gestor@demo.local',     'Gestor',      array['user'],                 'gestor'),
    (u_adv1,   'adv1@demo.local',       'Advogado 1',  array['user'],                 'advogado'),
    (u_adv2,   'adv2@demo.local',       'Advogado 2',  array['user'],                 'advogado'),
    (u_sec,    'secretaria@demo.local', 'Secretaria',  array['user'],                 'secretaria');

  insert into public.usuarios (id, nome_completo, email, permissoes)
  select user_id, nome, email, permissoes
  from _seed_users
  on conflict (id)
  do update set
    nome_completo = excluded.nome_completo,
    email = excluded.email,
    permissoes = excluded.permissoes;

  insert into public.org_members (org_id, user_id, role, ativo)
  select v_org, su.user_id, su.role, true
  from _seed_users su
  where not exists (
    select 1
    from public.org_members om
    where om.org_id = v_org
      and om.user_id = su.user_id
  );

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'org_members'
      and column_name = 'updated_at'
  ) then
    update public.org_members om
    set role = su.role,
        ativo = true
    from _seed_users su
    where om.org_id = v_org
      and om.user_id = su.user_id;
  end if;

  -- 3) CLIENTES
  insert into public.clientes
    (org_id, tipo, nome, documento, email, telefone, endereco, tags, observacoes, owner_user_id, created_at)
  select v_org, 'pf', 'Joao Pereira', '123.456.789-10', 'joao@cliente.teste', '+55 11 98888-0001',
         jsonb_build_object('cidade','Sao Paulo','uf','SP','bairro','Centro'),
         array['trabalhista','prioridade'], 'Cliente recorrente.', u_adv1, now() - interval '50 days'
  where not exists (
    select 1 from public.clientes where org_id = v_org and documento = '123.456.789-10'
  );

  insert into public.clientes
    (org_id, tipo, nome, documento, email, telefone, endereco, tags, observacoes, owner_user_id, created_at)
  select v_org, 'pf', 'Maria Souza', '987.654.321-00', 'maria@cliente.teste', '+55 11 98888-0002',
         jsonb_build_object('cidade','Belo Horizonte','uf','MG','bairro','Savassi'),
         array['civel'], 'Precisa acompanhamento semanal.', u_adv1, now() - interval '35 days'
  where not exists (
    select 1 from public.clientes where org_id = v_org and documento = '987.654.321-00'
  );

  insert into public.clientes
    (org_id, tipo, nome, documento, email, telefone, endereco, tags, observacoes, owner_user_id, created_at)
  select v_org, 'pj', 'ACME Comercio LTDA', '12.345.678/0001-90', 'juridico@acme.teste', '+55 31 98888-0003',
         jsonb_build_object('cidade','Belo Horizonte','uf','MG'),
         array['empresarial','contratos'], 'PJ com volume de documentos.', u_adv2, now() - interval '40 days'
  where not exists (
    select 1 from public.clientes where org_id = v_org and documento = '12.345.678/0001-90'
  );

  insert into public.clientes
    (org_id, tipo, nome, documento, email, telefone, endereco, tags, observacoes, owner_user_id, created_at)
  select v_org, 'pf', 'Carlos Almeida', '321.654.987-11', 'carlos@cliente.teste', '+55 21 98888-0004',
         jsonb_build_object('cidade','Rio de Janeiro','uf','RJ'),
         array['familia'], 'Em fase de negociacao.', u_adv2, now() - interval '20 days'
  where not exists (
    select 1 from public.clientes where org_id = v_org and documento = '321.654.987-11'
  );

  insert into public.clientes
    (org_id, tipo, nome, documento, email, telefone, endereco, tags, observacoes, owner_user_id, created_at)
  select v_org, 'pf', 'Fernanda Costa', '111.222.333-44', 'fernanda@cliente.teste', '+55 11 98888-0005',
         jsonb_build_object('cidade','Sao Paulo','uf','SP'),
         array['previdenciario'], 'Aguardando documentos.', u_adv1, now() - interval '10 days'
  where not exists (
    select 1 from public.clientes where org_id = v_org and documento = '111.222.333-44'
  );

  select id into c1 from public.clientes where org_id = v_org and documento = '123.456.789-10' limit 1;
  select id into c2 from public.clientes where org_id = v_org and documento = '987.654.321-00' limit 1;
  select id into c3 from public.clientes where org_id = v_org and documento = '12.345.678/0001-90' limit 1;
  select id into c4 from public.clientes where org_id = v_org and documento = '321.654.987-11' limit 1;
  select id into c5 from public.clientes where org_id = v_org and documento = '111.222.333-44' limit 1;

  -- 4) CARTEIRA (shared clients)
  insert into public.advogado_carteira_clientes (org_id, cliente_id, advogado_user_id, ativo)
  select v_org, c3, u_adv1, true
  where not exists (
    select 1 from public.advogado_carteira_clientes
    where org_id = v_org and cliente_id = c3 and advogado_user_id = u_adv1
  );

  insert into public.advogado_carteira_clientes (org_id, cliente_id, advogado_user_id, ativo)
  select v_org, c2, u_adv2, true
  where not exists (
    select 1 from public.advogado_carteira_clientes
    where org_id = v_org and cliente_id = c2 and advogado_user_id = u_adv2
  );

  -- 5) LEADS
  insert into public.leads
    (org_id, status, canal, nome, telefone, email, origem, assunto, resumo, qualificacao,
     assigned_user_id, cliente_id, remote_id, last_contact_at, created_at)
  select v_org, 'novo', 'whatsapp', 'Lead: Pedro', '+55 11 97777-0101', null, 'ads', 'Rescisao indireta',
         'Relata atraso salarial e horas extras.', jsonb_build_object('area','trabalhista','urgencia','alta'),
         u_adv1, null, 'wa:5511977770101', now() - interval '1 day', now() - interval '2 days'
  where not exists (
    select 1 from public.leads where org_id = v_org and remote_id = 'wa:5511977770101'
  );

  insert into public.leads
    (org_id, status, canal, nome, telefone, email, origem, assunto, resumo, qualificacao,
     assigned_user_id, cliente_id, remote_id, last_contact_at, created_at)
  select v_org, 'em_triagem', 'whatsapp', 'Lead: Bruna', '+55 31 97777-0202', 'bruna@lead.teste', 'indicacao', 'Divorcio',
         'Deseja orientacao sobre guarda.', jsonb_build_object('area','familia','filhos',2),
         u_adv2, null, 'wa:5531977770202', now() - interval '6 hours', now() - interval '1 day'
  where not exists (
    select 1 from public.leads where org_id = v_org and remote_id = 'wa:5531977770202'
  );

  insert into public.leads
    (org_id, status, canal, nome, telefone, email, origem, assunto, resumo, qualificacao,
     assigned_user_id, cliente_id, remote_id, last_contact_at, created_at)
  select v_org, 'qualificado', 'email', 'Lead: Rafael', null, 'rafael@lead.teste', 'site', 'Contrato PJ',
         'Quer revisar contrato de prestacao.', jsonb_build_object('area','empresarial','prazo','7d'),
         u_adv2, null, 'email:rafael@lead.teste', now() - interval '3 days', now() - interval '5 days'
  where not exists (
    select 1 from public.leads where org_id = v_org and remote_id = 'email:rafael@lead.teste'
  );

  insert into public.leads
    (org_id, status, canal, nome, telefone, email, origem, assunto, resumo, qualificacao,
     assigned_user_id, cliente_id, remote_id, last_contact_at, created_at)
  select v_org, 'convertido', 'telefone', 'Lead: Luana', '+55 11 97777-0303', 'luana@lead.teste', 'organico', 'INSS',
         'Aposentadoria; precisa analise.', jsonb_build_object('area','previdenciario','idade',58),
         u_adv1, c5, 'tel:5511977770303', now() - interval '2 days', now() - interval '9 days'
  where not exists (
    select 1 from public.leads where org_id = v_org and remote_id = 'tel:5511977770303'
  );

  insert into public.leads
    (org_id, status, canal, nome, telefone, email, origem, assunto, resumo, qualificacao,
     assigned_user_id, cliente_id, remote_id, last_contact_at, created_at)
  select v_org, 'perdido', 'webchat', 'Lead: Diego', null, null, 'site', 'Cobranca indevida',
         'Sem retorno apos proposta.', jsonb_build_object('area','civel'),
         u_adv1, null, 'web:diego-0001', now() - interval '20 days', now() - interval '25 days'
  where not exists (
    select 1 from public.leads where org_id = v_org and remote_id = 'web:diego-0001'
  );

  select id into l1 from public.leads where org_id = v_org and remote_id = 'wa:5511977770101' limit 1;
  select id into l2 from public.leads where org_id = v_org and remote_id = 'wa:5531977770202' limit 1;
  select id into l3 from public.leads where org_id = v_org and remote_id = 'email:rafael@lead.teste' limit 1;

  -- 6) CASOS
  insert into public.casos
    (org_id, status, titulo, area, subarea, descricao, cliente_id, lead_id, responsavel_user_id,
     prioridade, valor_estimado, fase_atual, created_at)
  select v_org, 'triagem', 'Rescisao indireta - Joao Pereira', 'Trabalhista', 'Rescisao',
         'Analisar verbas e provas.', c1, null, u_adv1, 3, 15000.00, 'triagem', now() - interval '15 days'
  where not exists (
    select 1 from public.casos where org_id = v_org and titulo = 'Rescisao indireta - Joao Pereira'
  );

  insert into public.casos
    (org_id, status, titulo, area, subarea, descricao, cliente_id, lead_id, responsavel_user_id,
     prioridade, valor_estimado, fase_atual, created_at)
  select v_org, 'negociacao', 'Divorcio consensual - Carlos Almeida', 'Familia', 'Divorcio',
         'Minuta de acordo e guarda.', c4, l2, u_adv2, 2, 8000.00, 'negociacao', now() - interval '7 days'
  where not exists (
    select 1 from public.casos where org_id = v_org and titulo = 'Divorcio consensual - Carlos Almeida'
  );

  insert into public.casos
    (org_id, status, titulo, area, subarea, descricao, cliente_id, lead_id, responsavel_user_id,
     prioridade, valor_estimado, fase_atual, created_at)
  select v_org, 'andamento', 'Revisao contratual - ACME', 'Empresarial', 'Contratos',
         'Revisao e aditivos.', c3, l3, u_adv2, 2, 12000.00, 'andamento', now() - interval '12 days'
  where not exists (
    select 1 from public.casos where org_id = v_org and titulo = 'Revisao contratual - ACME'
  );

  select id into ca1 from public.casos where org_id = v_org and titulo = 'Rescisao indireta - Joao Pereira' limit 1;
  select id into ca2 from public.casos where org_id = v_org and titulo = 'Divorcio consensual - Carlos Almeida' limit 1;
  select id into ca3 from public.casos where org_id = v_org and titulo = 'Revisao contratual - ACME' limit 1;

  -- 7) CASO_PARTES
  insert into public.caso_partes
    (org_id, caso_id, tipo, nome, documento, user_id, cliente_id, extra)
  select v_org, ca1, 'cliente', 'Joao Pereira', '123.456.789-10', null, c1, jsonb_build_object('papel','Reclamante')
  where not exists (
    select 1 from public.caso_partes where org_id = v_org and caso_id = ca1 and tipo = 'cliente' and nome = 'Joao Pereira'
  );

  insert into public.caso_partes
    (org_id, caso_id, tipo, nome, documento, user_id, cliente_id, extra)
  select v_org, ca1, 'advogado', 'Dra. Marina Silva', null, u_adv1, null, jsonb_build_object('oab','SP123456')
  where not exists (
    select 1 from public.caso_partes where org_id = v_org and caso_id = ca1 and tipo = 'advogado' and nome = 'Dra. Marina Silva'
  );

  insert into public.caso_partes
    (org_id, caso_id, tipo, nome, documento, user_id, cliente_id, extra)
  select v_org, ca2, 'cliente', 'Carlos Almeida', '321.654.987-11', null, c4, jsonb_build_object('papel','Requerente')
  where not exists (
    select 1 from public.caso_partes where org_id = v_org and caso_id = ca2 and tipo = 'cliente' and nome = 'Carlos Almeida'
  );

  insert into public.caso_partes
    (org_id, caso_id, tipo, nome, documento, user_id, cliente_id, extra)
  select v_org, ca2, 'advogado', 'Dr. Paulo Lima', null, u_adv2, null, jsonb_build_object('oab','MG654321')
  where not exists (
    select 1 from public.caso_partes where org_id = v_org and caso_id = ca2 and tipo = 'advogado' and nome = 'Dr. Paulo Lima'
  );

  insert into public.caso_partes
    (org_id, caso_id, tipo, nome, documento, user_id, cliente_id, extra)
  select v_org, ca3, 'cliente', 'ACME Comercio LTDA', '12.345.678/0001-90', null, c3, jsonb_build_object('papel','Contratante')
  where not exists (
    select 1 from public.caso_partes where org_id = v_org and caso_id = ca3 and tipo = 'cliente' and nome = 'ACME Comercio LTDA'
  );

  insert into public.caso_partes
    (org_id, caso_id, tipo, nome, documento, user_id, cliente_id, extra)
  select v_org, ca3, 'advogado', 'Dr. Paulo Lima', null, u_adv2, null, jsonb_build_object('oab','MG654321')
  where not exists (
    select 1 from public.caso_partes where org_id = v_org and caso_id = ca3 and tipo = 'advogado' and nome = 'Dr. Paulo Lima'
  );

  -- 8) CONVERSAS
  insert into public.conversas
    (org_id, canal, remote_id, lead_id, cliente_id, caso_id, aberto, ultimo_evento_em, humano_na_conversa, bloqueado)
  select v_org, 'whatsapp', 'wa:5511977770101', l1, null, null, true, now() - interval '2 hours', false, false
  where not exists (
    select 1 from public.conversas where org_id = v_org and remote_id = 'wa:5511977770101'
  );

  insert into public.conversas
    (org_id, canal, remote_id, lead_id, cliente_id, caso_id, aberto, ultimo_evento_em, humano_na_conversa, bloqueado)
  select v_org, 'whatsapp', 'wa:5531977770202', l2, null, ca2, true, now() - interval '1 hour', true, false
  where not exists (
    select 1 from public.conversas where org_id = v_org and remote_id = 'wa:5531977770202'
  );

  insert into public.conversas
    (org_id, canal, remote_id, lead_id, cliente_id, caso_id, aberto, ultimo_evento_em, humano_na_conversa, bloqueado)
  select v_org, 'whatsapp', 'wa:5511988880001', null, c1, ca1, true, now() - interval '10 minutes', false, false
  where not exists (
    select 1 from public.conversas where org_id = v_org and remote_id = 'wa:5511988880001'
  );

  select id into cv1 from public.conversas where org_id = v_org and remote_id = 'wa:5511977770101' limit 1;

  -- 9) MENSAGENS + BUFFER
  insert into public.mensagens (org_id, conversa_id, direction, from_remote, to_remote, body, payload, provider_msg_id, created_at)
  select v_org, cv1, 'in', 'wa:5511977770101', 'wa:office',
         'Boa noite, quero saber sobre rescisao indireta.', '{}'::jsonb, 'm1', now() - interval '2 hours'
  where not exists (
    select 1 from public.mensagens where org_id = v_org and provider_msg_id = 'm1'
  );

  insert into public.mensagens (org_id, conversa_id, direction, from_remote, to_remote, body, payload, provider_msg_id, created_at)
  select v_org, cv1, 'in', 'wa:5511977770101', 'wa:office',
         'Atrasam meu salario ha 3 meses.', '{}'::jsonb, 'm2', now() - interval '1 hour 59 minutes'
  where not exists (
    select 1 from public.mensagens where org_id = v_org and provider_msg_id = 'm2'
  );

  insert into public.mensagens (org_id, conversa_id, direction, from_remote, to_remote, body, payload, provider_msg_id, created_at)
  select v_org, cv1, 'out', 'wa:office', 'wa:5511977770101',
         'Entendi. Voce tem holerites/comprovantes?', '{}'::jsonb, 'm3', now() - interval '1 hour 58 minutes'
  where not exists (
    select 1 from public.mensagens where org_id = v_org and provider_msg_id = 'm3'
  );

  insert into public.message_buffer
    (org_id, conversa_id, open, window_started_at, last_message_at, buffered_text, meta, created_at)
  select v_org, cv1, true, now() - interval '2 hours', now() - interval '1 hour 59 minutes',
         'Boa noite, quero saber sobre rescisao indireta. Atrasam meu salario ha 3 meses.',
         jsonb_build_object('window_seconds',15,'source','seed'), now() - interval '1 hour 59 minutes'
  where not exists (
    select 1 from public.message_buffer where org_id = v_org and conversa_id = cv1
  );

  -- 10) DATAJUD
  insert into public.datajud_processos
    (org_id, numero_processo, tribunal, classe, area, caso_id, cliente_id, last_sync_at, payload, created_at)
  select v_org, '0001234-56.2024.8.26.0100', 'TJSP', 'Procedimento Comum', 'Civel', null, c2,
         now() - interval '2 days', jsonb_build_object('fonte','seed','status','ativo'), now() - interval '30 days'
  where not exists (
    select 1 from public.datajud_processos where org_id = v_org and numero_processo = '0001234-56.2024.8.26.0100'
  );

  insert into public.datajud_processos
    (org_id, numero_processo, tribunal, classe, area, caso_id, cliente_id, last_sync_at, payload, created_at)
  select v_org, '5009876-12.2023.4.01.3400', 'TRF1', 'Mandado de Seguranca', 'Previdenciario', null, c5,
         now() - interval '1 day', jsonb_build_object('fonte','seed','status','ativo'), now() - interval '45 days'
  where not exists (
    select 1 from public.datajud_processos where org_id = v_org and numero_processo = '5009876-12.2023.4.01.3400'
  );

  select id into p1 from public.datajud_processos where org_id = v_org and numero_processo = '0001234-56.2024.8.26.0100' limit 1;
  select id into p2 from public.datajud_processos where org_id = v_org and numero_processo = '5009876-12.2023.4.01.3400' limit 1;

  insert into public.datajud_movimentacoes
    (org_id, processo_id, data_movimentacao, descricao, codigo, payload, created_at)
  select v_org, p1, current_date - 10, 'Juntada de peticao', 'JUNTADA', jsonb_build_object('seed',true), now() - interval '10 days'
  where not exists (
    select 1 from public.datajud_movimentacoes
    where org_id = v_org and processo_id = p1 and data_movimentacao = current_date - 10 and codigo = 'JUNTADA'
  );

  insert into public.datajud_movimentacoes
    (org_id, processo_id, data_movimentacao, descricao, codigo, payload, created_at)
  select v_org, p2, current_date - 2, 'Intimacao expedida', 'INTIM', jsonb_build_object('seed',true), now() - interval '2 days'
  where not exists (
    select 1 from public.datajud_movimentacoes
    where org_id = v_org and processo_id = p2 and data_movimentacao = current_date - 2 and codigo = 'INTIM'
  );

  raise notice 'SEED concluido. org_id=%', v_org;
end $$;

commit;
