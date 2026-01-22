# SDR Juridico - DB/Code Alignment Map

This document maps current code usage to the Supabase schema in use.
Use it as the reference for standardizing services, types, and SQL.

## Canonical DB schema (from Supabase)

Tables observed in the current DB:
- advogado_carteira_clientes
- agendamentos
- audit_log
- caso_partes
- casos
- clientes
- conversas
- datajud_movimentacoes
- datajud_processos
- datajud_sync_jobs
- documentos
- integrations
- leads
- mensagens
- message_buffer
- notas
- org_members
- orgs
- USUARIOS
- tarefas
- templates
- usuarios

Note: the DB uses user-defined enum types (lead_status, case_status, channel_type,
doc_visibility, user_role, task_status). These are not defined in current migrations.

Enum values observed:
- lead_status: novo, em_triagem, qualificado, nao_qualificado, convertido, perdido
- user_role: admin, gestor, advogado, secretaria, leitura
- case_status: triagem, negociacao, contrato, andamento, encerrado, arquivado
- channel_type: whatsapp, email, telefone, webchat, outro
- doc_visibility: privado, interno, cliente

## Code usage summary (tables)

Supabase tables referenced in code:
- analytics_events
- audit_logs
- agenda
- timeline_events
- usuarios
- orgs
- org_members
- leads
- clientes
- casos
- documentos
- processos_favoritos
- historico_consultas
- movimentacoes_detectadas

## Mismatch matrix (code -> DB)

### audit_logs -> audit_log
Code inserts: org_id, user_id, action, entity_type, entity_id, metadata
DB table: org_id, actor_user_id, action, entity, entity_id, details
Action: update code to use audit_log and map columns.

### analytics_events -> (missing)
Code inserts into analytics_events. DB does not list this table.
Action: either create analytics_events table in DB or repoint to audit_log.

### agenda -> agendamentos
Code expects agenda fields: titulo, descricao, tipo, data_inicio, data_fim, status,
local, responsavel, cliente_nome, observacoes.
DB agendamentos fields: title, description, start_at, end_at, location, owner_user_id,
lead_id, cliente_id, caso_id, external_provider, external_event_id, meta.
Action: update services/mappers to use agendamentos and map fields via meta JSON.

### timeline_events -> notas
Code expects timeline_events: caso_id, titulo, descricao, categoria, canal, autor,
tags, data_evento.
DB notas: entidade, entidade_id, texto, created_by, tags, created_at.
Action: use notas with entidade='caso' and map fields; use tags/meta to keep category.

### leads -> leads (column mismatch)
Code LeadRow: nome, email, telefone, empresa, area, origem, status, heat,
ultimo_contato, responsavel, observacoes.
DB leads: nome, email, telefone, origem, canal, assunto, resumo, qualificacao (jsonb),
assigned_user_id, cliente_id, remote_id, last_contact_at.
Action: map legacy fields into qualificacao JSON (empresa, area, heat, responsavel,
observacoes). Map ultimo_contato <-> last_contact_at.

### clientes -> clientes (column mismatch)
Code ClienteRow: nome, email, telefone, empresa, cnpj, cpf, endereco (string),
cidade, estado, cep, area_atuacao, responsavel, status, health.
DB clientes: tipo, nome, documento, email, telefone, endereco (jsonb), tags,
observacoes, owner_user_id.
Action: map legacy fields into endereco JSON (street, city, state, zip),
documento (cnpj/cpf), and use tags/observacoes for extra info.

### casos -> casos (column mismatch)
Code CasoRow: titulo, area, status (string), prioridade (string), heat, stage,
valor, sla_risk, tags, responsavel, data_abertura, data_encerramento.
DB casos: status (case_status enum), titulo, area, subarea, descricao, cliente_id,
lead_id, responsavel_user_id, prioridade (integer), valor_estimado, fase_atual,
encerrado_em.
Action: map priority int <-> string; store heat/tags/sla_risk in JSON (not present)
or update schema to add these columns.

### documentos -> documentos (column mismatch)
Code DocumentoRow: titulo, descricao, tipo, status, url, arquivo_nome,
arquivo_tamanho, mime_type, solicitado_por, tags.
DB documentos: title, description, visibility, bucket, storage_path, mime_type,
size_bytes, lead_id, cliente_id, caso_id, uploaded_by, tags, meta.
Action: map old fields to new columns or store extras in meta JSON.

### org_members (role mismatch)
Code expects role values: admin/user/viewer and checks admin for access.
DB org_members uses user_role enum (ex: admin/gestor/advogado/secretaria/leitura).
Action: treat "admin" as Fartech admin (full org access). Map "gestor" to org_admin.

## Migrations mismatch (repo vs DB)

- 20260113_create_organizations.sql defines organizations table (not present in DB).
- 20260114_multi_tenant_complete.sql uses organizations and audit_logs/analytics_events.
- 20260116_create_org_members.sql expects org_members -> organizations (DB uses orgs).
- 00_create_all_tables.sql defines legacy schema not matching current DB.

Action: consolidate migrations to the canonical schema (orgs/org_members) and add
missing enum definitions + analytics/audit tables if needed.
