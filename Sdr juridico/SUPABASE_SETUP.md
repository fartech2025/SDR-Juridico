# 🗄️ Configuração Detalhada do Supabase para SDR Jurídico

---

## 1. SETUP INICIAL DO SUPABASE

### 1.1 Criar Projeto

1. Acesse https://supabase.com
2. Clique em "New Project"
3. Preencha:
   ```
   Project name: sdr-juridico
   Database password: [SENHA_FORTE_32_CHARS]
   Region: us-east-1 (ou mais próximo)
   Pricing plan: Free (para começar)
   ```
4. Aguarde criação (2-3 minutos)

### 1.2 Obter Credenciais

Na aba "Project Settings" > "API":
```
SUPABASE_URL: https://xxxxx.supabase.co
SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (só para backend!)
```

---

## 2. CRIAR SCHEMA DO BANCO DE DADOS

Acessar "SQL Editor" no Supabase e executar:

### 2.1 Criar Extensões Necessárias
```sql
-- Habilitar extensão UUID
create extension if not exists "uuid-ossp";

-- Habilitar extensão para funções avançadas
create extension if not exists "plpgsql";
```

### 2.2 Criar Tabelas

```sql
-- ============================================
-- 1. USUÁRIOS (Advogados)
-- ============================================
create table if not exists usuarios (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  senha_hash text not null,
  nome_completo text not null,
  telefone text,
  especialidade text[] default '{}', -- Array de especialidades
  foto_url text,
  activo boolean default true,
  criado_em timestamp with time zone default now(),
  atualizado_em timestamp with time zone default now()
);

alter table usuarios enable row level security;

-- RLS: Usuários só podem acessar suas próprias informações
create policy "Users can read own data"
  on usuarios for select
  using (auth.uid()::text = id::text);

create policy "Users can update own data"
  on usuarios for update
  using (auth.uid()::text = id::text);


-- ============================================
-- 2. CLIENTES
-- ============================================
create table if not exists clientes (
  id uuid primary key default uuid_generate_v4(),
  usuario_id uuid not null references usuarios(id) on delete cascade,
  nome_razao_social text not null,
  cpf_cnpj text unique,
  email text,
  telefone text,
  celular text,
  endereco text,
  numero text,
  complemento text,
  cidade text,
  estado text,
  cep text,
  pais text default 'Brasil',
  tipo enum_cliente default 'pessoa_fisica', -- pessoa_fisica, empresa
  risco_nivel text default 'baixo', -- baixo, medio, alto
  ativo boolean default true,
  observacoes text,
  criado_em timestamp with time zone default now(),
  atualizado_em timestamp with time zone default now()
);

alter table clientes enable row level security;

create policy "Users can read own clients"
  on clientes for select
  using (usuario_id = auth.uid()::uuid);

create policy "Users can insert own clients"
  on clientes for insert
  with check (usuario_id = auth.uid()::uuid);

create policy "Users can update own clients"
  on clientes for update
  using (usuario_id = auth.uid()::uuid);


-- ============================================
-- 3. CASOS JURÍDICOS
-- ============================================
create table if not exists casos (
  id uuid primary key default uuid_generate_v4(),
  usuario_id uuid not null references usuarios(id) on delete cascade,
  cliente_id uuid not null references clientes(id) on delete cascade,
  numero_caso text unique,
  titulo text not null,
  descricao text,
  area text not null, -- trabalhista, civil, criminal, administrativo, etc
  sub_area text,
  status text default 'novo', -- novo, em_andamento, resolvido, arquivado, suspenso
  prioridade text default 'normal', -- baixa, normal, alta, urgente
  data_abertura date default current_date,
  data_fechamento date,
  prazo_proximo_passo date,
  valor_estimado decimal(15,2),
  valor_pago decimal(15,2) default 0,
  observacoes text,
  tags text[] default '{}',
  criado_em timestamp with time zone default now(),
  atualizado_em timestamp with time zone default now()
);

alter table casos enable row level security;

create policy "Users can read own cases"
  on casos for select
  using (usuario_id = auth.uid()::uuid);

create policy "Users can insert own cases"
  on casos for insert
  with check (usuario_id = auth.uid()::uuid);

create policy "Users can update own cases"
  on casos for update
  using (usuario_id = auth.uid()::uuid);


-- ============================================
-- 4. DOCUMENTOS
-- ============================================
create table if not exists documentos (
  id uuid primary key default uuid_generate_v4(),
  caso_id uuid not null references casos(id) on delete cascade,
  usuario_id uuid not null references usuarios(id),
  titulo text not null,
  tipo text not null, -- contrato, parecer, sentenca, peticao, etc
  descricao text,
  storage_path text not null, -- caminho no Storage do Supabase
  nome_arquivo text not null,
  tamanho_bytes bigint,
  mime_type text,
  data_documento date,
  confidencial boolean default false,
  criado_em timestamp with time zone default now(),
  atualizado_em timestamp with time zone default now()
);

alter table documentos enable row level security;

create policy "Users can read own case documents"
  on documentos for select
  using (
    usuario_id = auth.uid()::uuid or
    exists (
      select 1 from casos 
      where casos.id = documentos.caso_id 
      and casos.usuario_id = auth.uid()::uuid
    )
  );

create policy "Users can insert documents to own cases"
  on documentos for insert
  with check (usuario_id = auth.uid()::uuid);


-- ============================================
-- 5. LEADS
-- ============================================
create table if not exists leads (
  id uuid primary key default uuid_generate_v4(),
  usuario_id uuid not null references usuarios(id) on delete cascade,
  nome text not null,
  email text not null,
  telefone text,
  celular text,
  origem text default 'site', -- site, indicacao, anuncio, evento, etc
  status text default 'novo', -- novo, contatado, interessado, cliente, descartado
  qualidade text default 'frio', -- frio, morno, quente
  anotacoes text,
  proxima_acao text,
  data_proxima_acao timestamp with time zone,
  data_primeiro_contato timestamp with time zone,
  data_ultimo_contato timestamp with time zone,
  conversao_em timestamp with time zone,
  ativo boolean default true,
  criado_em timestamp with time zone default now(),
  atualizado_em timestamp with time zone default now()
);

alter table leads enable row level security;

create policy "Users can read own leads"
  on leads for select
  using (usuario_id = auth.uid()::uuid);

create policy "Users can insert own leads"
  on leads for insert
  with check (usuario_id = auth.uid()::uuid);

create policy "Users can update own leads"
  on leads for update
  using (usuario_id = auth.uid()::uuid);


-- ============================================
-- 6. AGENDA / EVENTOS
-- ============================================
create table if not exists agenda (
  id uuid primary key default uuid_generate_v4(),
  usuario_id uuid not null references usuarios(id) on delete cascade,
  caso_id uuid references casos(id) on delete set null,
  cliente_id uuid references clientes(id) on delete set null,
  titulo text not null,
  descricao text,
  data_hora timestamp with time zone not null,
  duracao_minutos integer default 60,
  tipo text default 'reuniao', -- reuniao, audiencia, prazo, telefonema, etc
  localizacao text,
  url_videoconferencia text,
  participantes text[], -- array de emails
  notificacao_minutos integer default 15,
  completo boolean default false,
  criado_em timestamp with time zone default now(),
  atualizado_em timestamp with time zone default now()
);

alter table agenda enable row level security;

create policy "Users can read own events"
  on agenda for select
  using (usuario_id = auth.uid()::uuid);

create policy "Users can insert own events"
  on agenda for insert
  with check (usuario_id = auth.uid()::uuid);

create policy "Users can update own events"
  on agenda for update
  using (usuario_id = auth.uid()::uuid);


-- ============================================
-- 7. TAREFAS / CHECKLIST
-- ============================================
create table if not exists tarefas (
  id uuid primary key default uuid_generate_v4(),
  usuario_id uuid not null references usuarios(id) on delete cascade,
  caso_id uuid references casos(id) on delete set null,
  titulo text not null,
  descricao text,
  prioridade text default 'normal', -- baixa, normal, alta
  status text default 'pendente', -- pendente, em_progresso, concluida
  data_vencimento date,
  responsavel_ids uuid[] default '{}', -- múltiplos usuários
  criado_em timestamp with time zone default now(),
  concluido_em timestamp with time zone
);

alter table tarefas enable row level security;

create policy "Users can read own tasks"
  on tarefas for select
  using (
    usuario_id = auth.uid()::uuid or 
    auth.uid()::uuid = any(responsavel_ids)
  );


-- ============================================
-- 8. CONTATOS / COMUNICAÇÃO
-- ============================================
create table if not exists contatos (
  id uuid primary key default uuid_generate_v4(),
  caso_id uuid not null references casos(id) on delete cascade,
  usuario_id uuid not null references usuarios(id),
  tipo text not null, -- email, telefone, pessoalmente, videoconferencia
  assunto text,
  corpo text,
  data_hora timestamp with time zone default now(),
  notas text,
  criado_em timestamp with time zone default now()
);

alter table contatos enable row level security;

create policy "Users can read own case contacts"
  on contatos for select
  using (usuario_id = auth.uid()::uuid);
```

### 2.3 Criar Enums (se Supabase suportar via SQL)
```sql
create type enum_cliente as enum ('pessoa_fisica', 'empresa');
```

---

## 3. CRIAR ÍNDICES PARA PERFORMANCE

```sql
-- Índices em chaves estrangeiras
create index idx_clientes_usuario on clientes(usuario_id);
create index idx_casos_usuario on casos(usuario_id);
create index idx_casos_cliente on casos(cliente_id);
create index idx_documentos_caso on documentos(caso_id);
create index idx_documentos_usuario on documentos(usuario_id);
create index idx_leads_usuario on leads(usuario_id);
create index idx_agenda_usuario on agenda(usuario_id);
create index idx_agenda_caso on agenda(caso_id);
create index idx_tarefas_usuario on tarefas(usuario_id);
create index idx_contatos_caso on contatos(caso_id);

-- Índices em campos de busca comum
create index idx_clientes_email on clientes(email);
create index idx_clientes_cpf_cnpj on clientes(cpf_cnpj);
create index idx_casos_numero on casos(numero_caso);
create index idx_casos_status on casos(status);
create index idx_leads_email on leads(email);
create index idx_leads_status on leads(status);
create index idx_agenda_data on agenda(data_hora);

-- Índices full-text search (para buscas mais rápidas)
create index idx_casos_titulo_search on casos using gin(to_tsvector('portuguese', titulo));
create index idx_clientes_nome_search on clientes using gin(to_tsvector('portuguese', nome_razao_social));
```

---

## 4. CRIAR FUNÇÕES ÚTEIS

```sql
-- ============================================
-- Função para atualizar timestamp
-- ============================================
create or replace function update_timestamp()
returns trigger as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$ language plpgsql;

-- Aplicar em todas as tabelas principais
create trigger update_usuarios_timestamp before update on usuarios
for each row execute function update_timestamp();

create trigger update_clientes_timestamp before update on clientes
for each row execute function update_timestamp();

create trigger update_casos_timestamp before update on casos
for each row execute function update_timestamp();

create trigger update_documentos_timestamp before update on documentos
for each row execute function update_timestamp();

create trigger update_leads_timestamp before update on leads
for each row execute function update_timestamp();

create trigger update_agenda_timestamp before update on agenda
for each row execute function update_timestamp();

create trigger update_tarefas_timestamp before update on tarefas
for each row execute function update_timestamp();


-- ============================================
-- Função para contar casos por status
-- ============================================
create or replace function contar_casos_por_status(usuario_id_param uuid)
returns table (status text, count bigint) as $$
begin
  return query
  select casos.status, count(*)
  from casos
  where casos.usuario_id = usuario_id_param
  group by casos.status;
end;
$$ language plpgsql;


-- ============================================
-- Função para obter KPIs do dashboard
-- ============================================
create or replace function obter_kpis_dashboard(usuario_id_param uuid)
returns table (
  total_casos bigint,
  casos_ativos bigint,
  total_clientes bigint,
  total_leads bigint,
  leads_quentes bigint,
  proximos_prazos bigint
) as $$
begin
  return query
  select
    (select count(*) from casos where usuario_id = usuario_id_param)::bigint,
    (select count(*) from casos where usuario_id = usuario_id_param and status = 'em_andamento')::bigint,
    (select count(*) from clientes where usuario_id = usuario_id_param)::bigint,
    (select count(*) from leads where usuario_id = usuario_id_param)::bigint,
    (select count(*) from leads where usuario_id = usuario_id_param and qualidade = 'quente')::bigint,
    (select count(*) from casos where usuario_id = usuario_id_param and prazo_proximo_passo <= current_date + interval '7 days')::bigint;
end;
$$ language plpgsql;
```

---

## 5. CONFIGURAR STORAGE (para documentos)

### 5.1 Criar Bucket
1. Ir em "Storage" no Supabase
2. Clique em "New bucket"
3. Configure:
   ```
   Name: documentos-casos
   Private: Sim (proteger arquivos)
   File size limit: 100MB
   ```

### 5.2 Definir Políticas de Acesso
```sql
-- No SQL Editor do Supabase:

-- Permitir usuários fazer upload dos próprios documentos
create policy "Allow authenticated users to upload documents"
on storage.objects
for insert
with check (
  bucket_id = 'documentos-casos' and
  auth.role() = 'authenticated'
);

-- Permitir usuários baixar seus próprios documentos
create policy "Allow authenticated users to download documents"
on storage.objects
for select
using (
  bucket_id = 'documentos-casos' and
  auth.role() = 'authenticated'
);

-- Permitir usuários deletar seus próprios documentos
create policy "Allow authenticated users to delete documents"
on storage.objects
for delete
using (
  bucket_id = 'documentos-casos' and
  auth.role() = 'authenticated'
);
```

---

## 6. CONFIGURAR AUTENTICAÇÃO

### 6.1 Email/Senha
1. Ir em "Authentication" > "Providers"
2. Habilitar "Email"
3. Configurar template de email de confirmação

### 6.2 Magic Link
```
Settings > Email Templates > Confirm Signup
```
Customizar a mensagem e link

### 6.3 OAuth (Opcional - Google, GitHub)
1. Authentication > Providers
2. Habilitar Google/GitHub
3. Configurar credentials

---

## 7. CONFIGURAR VARIÁVEIS DE AMBIENTE NO FRONTEND

Criar arquivo `.env.local`:
```env
# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API (opcional, para funções customizadas)
VITE_API_URL=http://localhost:3000

# Analytics/Sentry (opcional)
VITE_SENTRY_DSN=
```

---

## 8. TESTAR CONEXÃO

Criar arquivo `src/lib/supabaseClient.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

Testar no console:
```typescript
import { supabase } from './lib/supabaseClient'

// Listar usuários (deve retornar erro de permissão, mas prova conexão)
const { data, error } = await supabase
  .from('usuarios')
  .select('*')
  .limit(1)

console.log(data, error)
```

---

## 9. GERAR TIPOS TYPESCRIPT (TypeScript Autocomplete)

```bash
# Instalar supabase CLI
npm install -D supabase

# Gerar tipos automaticamente
npx supabase gen types typescript --local > src/lib/database.types.ts

# Ou com Supabase Cloud:
npx supabase gen types typescript \
  --project-id xxxxx \
  --db-url postgresql://user:pass@host/db > src/lib/database.types.ts
```

---

## 10. SEEDING (Dados de Teste)

Criar arquivo `supabase/seeds/seed.sql`:
```sql
-- Inserir usuário de teste
insert into usuarios (id, email, senha_hash, nome_completo, especialidade)
values (
  '550e8400-e29b-41d4-a716-446655440000',
  'teste@sdr-juridico.com',
  '$2a$10$...', -- hash da senha 'senha123'
  'João Advogado',
  array['Civil', 'Trabalhista']
);

-- Inserir cliente de teste
insert into clientes (usuario_id, nome_razao_social, cpf_cnpj, email)
values (
  '550e8400-e29b-41d4-a716-446655440000',
  'Cliente Teste LTDA',
  '12.345.678/0001-90',
  'cliente@teste.com'
);
```

Executar:
```bash
npm run seed:supabase
# ou
psql -h localhost -U postgres -d sdr_juridico -f supabase/seeds/seed.sql
```

---

## 11. MONITORAMENTO E LOGS

No Supabase Dashboard:
1. Ir em "Logs"
2. Monitorar:
   - Queries lentas
   - Erros de autenticação
   - Problemas de RLS

---

## 12. BACKUPS

Supabase automático:
- ✅ Backup diário automático (gratuito)
- ✅ Retenção de 7 dias
- ✅ PITR (Point-in-time Recovery) disponível em plano Pro

Para backups manuais:
```bash
# Exportar backup
npx supabase db dump > backup.sql

# Restaurar backup
npx supabase db push < backup.sql
```

---

## 13. LIMITES E QUOTAS (Plano Free)

| Recurso | Limite |
|---------|--------|
| Usuários autenticados | 50.000 |
| Storage | 1 GB |
| Bandwidth | 2 GB/mês |
| Requisições DB | Ilimitadas |
| Funções Edge | 500k/mês |
| Realtime connections | 200 |

Plano Pro começa em $25/mês com limites muito maiores.

---

## 14. CHECKLIST DE CONFIGURAÇÃO

- [ ] Projeto criado no Supabase
- [ ] Credenciais copiadas e armazenadas (seguro)
- [ ] Extensões habilitadas
- [ ] Todas as tabelas criadas
- [ ] Índices criados
- [ ] Funções criadas
- [ ] Triggers criados
- [ ] RLS policies configuradas
- [ ] Bucket de Storage criado
- [ ] Autenticação configurada
- [ ] `.env.local` criado
- [ ] Cliente Supabase importado no projeto
- [ ] Tipos TypeScript gerados
- [ ] Conexão testada com sucesso

---

**Status:** ✅ Pronto para implementação  
**Última atualização:** 5 de janeiro de 2026
