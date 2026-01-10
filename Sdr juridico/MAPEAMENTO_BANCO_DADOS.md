# 📊 Mapeamento Completo do Banco de Dados - SDR Jurídico

## 🗄️ Resumo Executivo

**Total de Tabelas:** 13 tabelas principais  
**Sistema de Autenticação:** Supabase Auth  
**Tipo de Segurança:** Row Level Security (RLS) habilitado em todas as tabelas  
**Banco de Dados:** PostgreSQL via Supabase

---

## 📋 Índice de Tabelas

1. [usuarios](#1-usuarios) - Perfis de usuários
2. [leads](#2-leads) - Gestão de leads
3. [clientes](#3-clientes) - Cadastro de clientes
4. [casos](#4-casos) - Casos jurídicos
5. [documentos](#5-documentos) - Gestão de documentos
6. [agenda](#6-agenda) - Calendário e compromissos
7. [timeline_events](#7-timeline_events) - Histórico de eventos
8. [notificacoes](#8-notificacoes) - Sistema de notificações
9. [processos_favoritos](#9-processos_favoritos) - Processos favoritos
10. [historico_consultas](#10-historico_consultas) - Histórico de consultas
11. [cache_cnpj](#11-cache_cnpj) - Cache de dados CNPJ
12. [movimentacoes_detectadas](#12-movimentacoes_detectadas) - Novas movimentações

---

## 1. 👤 usuarios

**Descrição:** Perfis de usuários do sistema (complementa auth.users do Supabase)

### Campos
| Campo | Tipo | Descrição | Constraints |
|-------|------|-----------|-------------|
| `id` | UUID | Identificador único (FK para auth.users) | PRIMARY KEY, REFERENCES auth.users(id) |
| `nome_completo` | TEXT | Nome completo do usuário | NOT NULL |
| `email` | TEXT | Email do usuário | NOT NULL, UNIQUE |
| `telefone` | TEXT | Telefone de contato | - |
| `cargo` | TEXT | Cargo na empresa | - |
| `departamento` | TEXT | Departamento | - |
| `foto_url` | TEXT | URL da foto de perfil | - |
| `permissoes` | TEXT[] | Array de permissões | DEFAULT ['user'] |
| `status` | TEXT | Status do usuário | CHECK IN ('ativo', 'inativo', 'suspenso'), DEFAULT 'ativo' |
| `ultimo_acesso` | TIMESTAMPTZ | Data do último acesso | - |
| `preferencias` | JSONB | Preferências do usuário | DEFAULT '{}' |
| `created_at` | TIMESTAMPTZ | Data de criação | NOT NULL, DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | Data de atualização | NOT NULL, DEFAULT NOW() |

### Índices
- `idx_usuarios_email` ON email
- `idx_usuarios_status` ON status
- `idx_usuarios_permissoes` ON permissoes (GIN index)

### RLS Policies
- ✅ Todos podem ver todos os perfis
- ✅ Usuários podem atualizar apenas seu próprio perfil
- ✅ Usuários podem inserir apenas seu próprio perfil

---

## 2. 🎯 leads

**Descrição:** Armazena leads de potenciais clientes do escritório

### Campos
| Campo | Tipo | Descrição | Constraints |
|-------|------|-----------|-------------|
| `id` | UUID | Identificador único | PRIMARY KEY, DEFAULT uuid_generate_v4() |
| `nome` | TEXT | Nome do lead | NOT NULL |
| `email` | TEXT | Email do lead | NOT NULL |
| `telefone` | TEXT | Telefone | - |
| `empresa` | TEXT | Empresa | - |
| `area` | TEXT | Área de atuação | - |
| `origem` | TEXT | Origem do lead | - |
| `status` | TEXT | Status do lead | CHECK IN ('novo', 'em_contato', 'qualificado', 'proposta', 'ganho', 'perdido'), DEFAULT 'novo' |
| `heat` | TEXT | Temperatura do lead | CHECK IN ('quente', 'morno', 'frio'), DEFAULT 'frio' |
| `ultimo_contato` | TIMESTAMPTZ | Data do último contato | - |
| `responsavel` | TEXT | Responsável pelo lead | - |
| `observacoes` | TEXT | Observações | - |
| `created_at` | TIMESTAMPTZ | Data de criação | NOT NULL, DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | Data de atualização | NOT NULL, DEFAULT NOW() |

### Índices
- `idx_leads_status` ON status
- `idx_leads_heat` ON heat
- `idx_leads_email` ON email
- `idx_leads_created_at` ON created_at DESC

### RLS Policies
- ✅ Usuários autenticados: SELECT, INSERT, UPDATE, DELETE (todos permitidos)

---

## 3. 👥 clientes

**Descrição:** Cadastro de clientes ativos do escritório jurídico

### Campos
| Campo | Tipo | Descrição | Constraints |
|-------|------|-----------|-------------|
| `id` | UUID | Identificador único | PRIMARY KEY, DEFAULT uuid_generate_v4() |
| `nome` | TEXT | Nome do cliente | NOT NULL |
| `email` | TEXT | Email | NOT NULL |
| `telefone` | TEXT | Telefone | - |
| `empresa` | TEXT | Nome da empresa | - |
| `cnpj` | TEXT | CNPJ (pessoa jurídica) | - |
| `cpf` | TEXT | CPF (pessoa física) | - |
| `endereco` | TEXT | Endereço completo | - |
| `cidade` | TEXT | Cidade | - |
| `estado` | TEXT | Estado (UF) | - |
| `cep` | TEXT | CEP | - |
| `area_atuacao` | TEXT | Área de atuação do cliente | - |
| `responsavel` | TEXT | Advogado responsável | - |
| `status` | TEXT | Status do cliente | CHECK IN ('ativo', 'em_risco', 'inativo'), DEFAULT 'ativo' |
| `health` | TEXT | Saúde do relacionamento | CHECK IN ('ok', 'atencao', 'critico'), DEFAULT 'ok' |
| `observacoes` | TEXT | Observações gerais | - |
| `created_at` | TIMESTAMPTZ | Data de criação | NOT NULL, DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | Data de atualização | NOT NULL, DEFAULT NOW() |

### Índices
- `idx_clientes_status` ON status
- `idx_clientes_email` ON email
- `idx_clientes_cnpj` ON cnpj (WHERE cnpj IS NOT NULL)
- `idx_clientes_cpf` ON cpf (WHERE cpf IS NOT NULL)

### RLS Policies
- ✅ Usuários autenticados: SELECT, INSERT, UPDATE, DELETE (todos permitidos)

---

## 4. ⚖️ casos

**Descrição:** Casos jurídicos em andamento ou concluídos

### Campos
| Campo | Tipo | Descrição | Constraints |
|-------|------|-----------|-------------|
| `id` | UUID | Identificador único | PRIMARY KEY, DEFAULT uuid_generate_v4() |
| `titulo` | TEXT | Título do caso | NOT NULL |
| `descricao` | TEXT | Descrição detalhada | - |
| `cliente_id` | UUID | ID do cliente | REFERENCES clientes(id) ON DELETE SET NULL |
| `lead_id` | UUID | ID do lead de origem | REFERENCES leads(id) ON DELETE SET NULL |
| `area` | TEXT | Área jurídica | NOT NULL |
| `status` | TEXT | Status do caso | CHECK IN ('aberto', 'em_andamento', 'resolvido', 'fechado', 'ativo', 'suspenso', 'encerrado'), DEFAULT 'aberto' |
| `prioridade` | TEXT | Prioridade | CHECK IN ('baixa', 'media', 'alta', 'critica'), DEFAULT 'media' |
| `heat` | TEXT | Temperatura | CHECK IN ('quente', 'morno', 'frio'), DEFAULT 'morno' |
| `stage` | TEXT | Fase do caso | CHECK IN ('triagem', 'negociacao', 'em_andamento', 'conclusao'), DEFAULT 'triagem' |
| `valor` | DECIMAL(12,2) | Valor do caso | - |
| `sla_risk` | TEXT | Risco de SLA | CHECK IN ('ok', 'atencao', 'critico'), DEFAULT 'ok' |
| `tags` | TEXT[] | Tags para categorização | - |
| `responsavel` | TEXT | Advogado responsável | - |
| `data_abertura` | TIMESTAMPTZ | Data de abertura | DEFAULT NOW() |
| `data_encerramento` | TIMESTAMPTZ | Data de encerramento | - |
| `created_at` | TIMESTAMPTZ | Data de criação | NOT NULL, DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | Data de atualização | NOT NULL, DEFAULT NOW() |

### Relacionamentos
- **→ clientes** (cliente_id): Um caso pertence a um cliente
- **→ leads** (lead_id): Um caso pode ter origem em um lead

### Índices
- `idx_casos_status` ON status
- `idx_casos_prioridade` ON prioridade
- `idx_casos_cliente_id` ON cliente_id
- `idx_casos_lead_id` ON lead_id
- `idx_casos_sla_risk` ON sla_risk
- `idx_casos_created_at` ON created_at DESC

### RLS Policies
- ✅ Usuários autenticados: SELECT, INSERT, UPDATE, DELETE (todos permitidos)

---

## 5. 📄 documentos

**Descrição:** Gestão de documentos relacionados aos casos e clientes

### Campos
| Campo | Tipo | Descrição | Constraints |
|-------|------|-----------|-------------|
| `id` | UUID | Identificador único | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `user_id` | UUID | ID do usuário que enviou | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE |
| `titulo` | TEXT | Título do documento | NOT NULL |
| `descricao` | TEXT | Descrição | - |
| `caso_id` | UUID | ID do caso relacionado | REFERENCES casos(id) ON DELETE CASCADE |
| `cliente_nome` | TEXT | Nome do cliente (denormalizado) | - |
| `nome_arquivo` | TEXT | Nome do arquivo salvo | NOT NULL |
| `nome_original` | TEXT | Nome original do arquivo | NOT NULL |
| `tipo` | TEXT | Tipo do documento | NOT NULL |
| `tipo_arquivo` | TEXT | Tipo MIME | NOT NULL |
| `status` | TEXT | Status do documento | CHECK IN ('pendente', 'aprovado', 'rejeitado', 'solicitado', 'completo'), DEFAULT 'pendente' |
| `url` | TEXT | URL do documento | - |
| `arquivo_nome` | TEXT | Nome do arquivo | - |
| `arquivo_tamanho` | INTEGER | Tamanho em bytes | - |
| `tamanho_bytes` | BIGINT | Tamanho em bytes | NOT NULL |
| `mime_type` | TEXT | Tipo MIME | - |
| `storage_path` | TEXT | Caminho no storage | NOT NULL |
| `categoria` | TEXT | Categoria do documento | DEFAULT 'geral' |
| `solicitado_por` | TEXT | Quem solicitou | - |
| `tags` | TEXT[] | Tags | - |
| `metadata` | JSONB | Metadados adicionais | DEFAULT '{}' |
| `created_at` | TIMESTAMPTZ | Data de criação | NOT NULL, DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | Data de atualização | NOT NULL, DEFAULT NOW() |

### Relacionamentos
- **→ casos** (caso_id): Um documento pode estar ligado a um caso
- **→ auth.users** (user_id): Quem enviou o documento

### Índices
- `idx_documentos_status` ON status
- `idx_documentos_caso_id` ON caso_id
- `idx_documentos_tipo` ON tipo
- `idx_documentos_user_id` ON user_id
- `idx_documentos_categoria` ON categoria
- `idx_documentos_created_at` ON created_at DESC

### RLS Policies
- ✅ Usuários veem apenas seus próprios documentos
- ✅ Usuários podem inserir, atualizar e deletar apenas seus documentos

### Storage Bucket
- **Bucket:** `documentos`
- **Público:** Não
- **Limite de tamanho:** 10MB
- **Tipos permitidos:** PDF, imagens (JPEG, PNG, WEBP, HEIC), Word, Excel

---

## 6. 📅 agenda

**Descrição:** Sistema de agendamento de compromissos e eventos

### Campos
| Campo | Tipo | Descrição | Constraints |
|-------|------|-----------|-------------|
| `id` | UUID | Identificador único | PRIMARY KEY, DEFAULT uuid_generate_v4() |
| `titulo` | TEXT | Título do evento | NOT NULL |
| `descricao` | TEXT | Descrição | - |
| `tipo` | TEXT | Tipo do evento | CHECK IN ('reuniao', 'ligacao', 'visita', 'audiencia', 'prazo', 'follow_up', 'interno', 'assinatura'), DEFAULT 'reuniao' |
| `data_inicio` | TIMESTAMPTZ | Data e hora de início | NOT NULL |
| `data_fim` | TIMESTAMPTZ | Data e hora de término | NOT NULL |
| `duracao_minutos` | INTEGER | Duração em minutos | - |
| `cliente_nome` | TEXT | Nome do cliente (denormalizado) | - |
| `cliente_id` | UUID | ID do cliente | REFERENCES clientes(id) ON DELETE SET NULL |
| `caso_id` | UUID | ID do caso | REFERENCES casos(id) ON DELETE SET NULL |
| `responsavel` | TEXT | Responsável pelo evento | NOT NULL |
| `local` | TEXT | Local do evento | - |
| `status` | TEXT | Status do evento | CHECK IN ('confirmado', 'pendente', 'cancelado', 'concluido'), DEFAULT 'pendente' |
| `observacoes` | TEXT | Observações | - |
| `created_at` | TIMESTAMPTZ | Data de criação | NOT NULL, DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | Data de atualização | NOT NULL, DEFAULT NOW() |

### Relacionamentos
- **→ clientes** (cliente_id): Evento relacionado a um cliente
- **→ casos** (caso_id): Evento relacionado a um caso

### Constraints
- `valid_date_range`: data_fim >= data_inicio

### Índices
- `idx_agenda_data_inicio` ON data_inicio
- `idx_agenda_status` ON status
- `idx_agenda_tipo` ON tipo
- `idx_agenda_cliente_id` ON cliente_id
- `idx_agenda_caso_id` ON caso_id
- `idx_agenda_responsavel` ON responsavel

### RLS Policies
- ✅ Usuários autenticados: SELECT, INSERT, UPDATE, DELETE (todos permitidos)

---

## 7. ⏱️ timeline_events

**Descrição:** Registro cronológico de eventos dos casos (audit trail)

### Campos
| Campo | Tipo | Descrição | Constraints |
|-------|------|-----------|-------------|
| `id` | UUID | Identificador único | PRIMARY KEY, DEFAULT uuid_generate_v4() |
| `caso_id` | UUID | ID do caso | NOT NULL, REFERENCES casos(id) ON DELETE CASCADE |
| `titulo` | TEXT | Título do evento | NOT NULL |
| `descricao` | TEXT | Descrição detalhada | - |
| `categoria` | TEXT | Categoria do evento | CHECK IN ('docs', 'agenda', 'comercial', 'juridico', 'automacao', 'humano'), NOT NULL |
| `canal` | TEXT | Canal de origem | - |
| `autor` | TEXT | Autor do evento | - |
| `tags` | TEXT[] | Tags para categorização | - |
| `data_evento` | TIMESTAMPTZ | Data do evento | NOT NULL, DEFAULT NOW() |
| `created_at` | TIMESTAMPTZ | Data de criação | NOT NULL, DEFAULT NOW() |

### Relacionamentos
- **→ casos** (caso_id): Timeline pertence a um caso específico

### Índices
- `idx_timeline_caso_id` ON caso_id
- `idx_timeline_categoria` ON categoria
- `idx_timeline_data_evento` ON data_evento DESC

### RLS Policies
- ✅ Usuários autenticados: SELECT, INSERT, UPDATE, DELETE (todos permitidos)

---

## 8. 🔔 notificacoes

**Descrição:** Sistema de notificações e alertas para usuários

### Campos
| Campo | Tipo | Descrição | Constraints |
|-------|------|-----------|-------------|
| `id` | UUID | Identificador único | PRIMARY KEY, DEFAULT uuid_generate_v4() |
| `titulo` | TEXT | Título da notificação | NOT NULL |
| `descricao` | TEXT | Descrição | - |
| `prioridade` | TEXT | Prioridade | CHECK IN ('P0', 'P1', 'P2'), DEFAULT 'P2' |
| `tipo` | TEXT | Tipo de notificação | - |
| `link_url` | TEXT | URL de link | - |
| `link_label` | TEXT | Label do link | - |
| `lida` | BOOLEAN | Se foi lida | NOT NULL, DEFAULT FALSE |
| `caso_id` | UUID | ID do caso relacionado | REFERENCES casos(id) ON DELETE CASCADE |
| `cliente_id` | UUID | ID do cliente relacionado | REFERENCES clientes(id) ON DELETE CASCADE |
| `usuario_responsavel` | TEXT | Usuário responsável | - |
| `data_notificacao` | TIMESTAMPTZ | Data da notificação | NOT NULL, DEFAULT NOW() |
| `created_at` | TIMESTAMPTZ | Data de criação | NOT NULL, DEFAULT NOW() |

### Relacionamentos
- **→ casos** (caso_id): Notificação relacionada a um caso
- **→ clientes** (cliente_id): Notificação relacionada a um cliente

### Índices
- `idx_notificacoes_lida` ON lida
- `idx_notificacoes_prioridade` ON prioridade
- `idx_notificacoes_data` ON data_notificacao DESC
- `idx_notificacoes_usuario` ON usuario_responsavel

### RLS Policies
- ✅ Usuários autenticados: SELECT, INSERT, UPDATE, DELETE (todos permitidos)

---

## 9. ⭐ processos_favoritos

**Descrição:** Processos marcados como favoritos pelos usuários para acompanhamento

### Campos
| Campo | Tipo | Descrição | Constraints |
|-------|------|-----------|-------------|
| `id` | UUID | Identificador único | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `user_id` | UUID | ID do usuário | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE |
| `numero_processo` | TEXT | Número do processo | NOT NULL |
| `tribunal` | TEXT | Tribunal | NOT NULL |
| `classe` | TEXT | Classe processual | - |
| `orgao_julgador` | TEXT | Órgão julgador | - |
| `data_ajuizamento` | DATE | Data de ajuizamento | - |
| `descricao` | TEXT | Nota pessoal do usuário | - |
| `tags` | TEXT[] | Tags personalizadas | - |
| `notificar` | BOOLEAN | Receber notificações | DEFAULT TRUE |
| `criado_em` | TIMESTAMPTZ | Data de criação | DEFAULT NOW() |
| `atualizado_em` | TIMESTAMPTZ | Data de atualização | DEFAULT NOW() |
| `ultima_movimentacao` | TIMESTAMPTZ | Data da última movimentação | - |

### Relacionamentos
- **→ auth.users** (user_id): Usuário dono do favorito

### Constraints
- `UNIQUE(user_id, numero_processo)`: Um usuário não pode favoritar o mesmo processo duas vezes

### Índices
- `idx_favoritos_user` ON user_id
- `idx_favoritos_processo` ON numero_processo

### RLS Policies
- ✅ Usuários veem apenas seus próprios favoritos
- ✅ Usuários podem inserir, atualizar e deletar apenas seus favoritos

---

## 10. 📜 historico_consultas

**Descrição:** Histórico de todas as consultas realizadas na API DataJud

### Campos
| Campo | Tipo | Descrição | Constraints |
|-------|------|-----------|-------------|
| `id` | UUID | Identificador único | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `user_id` | UUID | ID do usuário | REFERENCES auth.users(id) ON DELETE CASCADE |
| `numero_processo` | TEXT | Número do processo consultado | NOT NULL |
| `tribunal` | TEXT | Tribunal consultado | NOT NULL |
| `tipo_busca` | TEXT | Tipo de busca (numero, parte, classe) | - |
| `consultado_em` | TIMESTAMPTZ | Data da consulta | DEFAULT NOW() |
| `tempo_resposta` | INTEGER | Tempo de resposta em ms | - |
| `sucesso` | BOOLEAN | Se a consulta teve sucesso | DEFAULT TRUE |

### Relacionamentos
- **→ auth.users** (user_id): Usuário que realizou a consulta

### Índices
- `idx_historico_user` ON user_id
- `idx_historico_data` ON consultado_em DESC

### RLS Policies
- ✅ Usuários veem apenas seu próprio histórico (ou consultas sem user_id)
- ✅ Usuários podem inserir consultas

---

## 11. 🏢 cache_cnpj

**Descrição:** Cache de dados da Receita Federal (CNPJ) para evitar consultas repetidas

### Campos
| Campo | Tipo | Descrição | Constraints |
|-------|------|-----------|-------------|
| `cnpj` | TEXT | CNPJ | PRIMARY KEY |
| `razao_social` | TEXT | Razão social | - |
| `nome_fantasia` | TEXT | Nome fantasia | - |
| `porte` | TEXT | Porte da empresa | - |
| `situacao_cadastral` | TEXT | Situação cadastral | - |
| `data_situacao_cadastral` | DATE | Data da situação | - |
| `capital_social` | NUMERIC | Capital social | - |
| `natureza_juridica` | TEXT | Natureza jurídica | - |
| `atividade_principal` | TEXT | Atividade principal | - |
| `dados_completos` | JSONB | Dados completos da API | - |
| `consultado_em` | TIMESTAMPTZ | Data da primeira consulta | DEFAULT NOW() |
| `atualizado_em` | TIMESTAMPTZ | Data da última atualização | DEFAULT NOW() |

### RLS Policies
- ✅ Leitura pública (dados públicos da Receita)
- ✅ Usuários autenticados podem inserir/atualizar

---

## 12. 📍 movimentacoes_detectadas

**Descrição:** Novas movimentações detectadas em processos favoritos (sistema de notificações)

### Campos
| Campo | Tipo | Descrição | Constraints |
|-------|------|-----------|-------------|
| `id` | UUID | Identificador único | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `processo_favorito_id` | UUID | ID do processo favorito | REFERENCES processos_favoritos(id) ON DELETE CASCADE |
| `numero_processo` | TEXT | Número do processo | NOT NULL |
| `movimentacao_codigo` | INTEGER | Código da movimentação | - |
| `movimentacao_nome` | TEXT | Nome da movimentação | - |
| `movimentacao_data` | TIMESTAMPTZ | Data da movimentação | - |
| `movimentacao_complemento` | TEXT | Complemento | - |
| `detectado_em` | TIMESTAMPTZ | Quando foi detectada | DEFAULT NOW() |
| `notificado` | BOOLEAN | Se usuário foi notificado | DEFAULT FALSE |
| `lido` | BOOLEAN | Se usuário leu | DEFAULT FALSE |

### Relacionamentos
- **→ processos_favoritos** (processo_favorito_id): Movimentação pertence a um favorito

### Índices
- `idx_movimentacoes_favorito` ON processo_favorito_id
- `idx_movimentacoes_lido` ON lido WHERE lido = false

### RLS Policies
- ✅ Usuários veem apenas notificações de seus processos favoritos

---

## 📊 Views do Sistema

### 1. casos_completos
Casos com informações completas de clientes
```sql
SELECT 
  c.*,
  cl.nome AS cliente_nome,
  cl.email AS cliente_email,
  cl.telefone AS cliente_telefone,
  (SELECT COUNT(*) FROM documentos d WHERE d.caso_id = c.id) AS total_documentos,
  (SELECT COUNT(*) FROM timeline_events te WHERE te.caso_id = c.id) AS total_eventos
FROM casos c
LEFT JOIN clientes cl ON c.cliente_id = cl.id;
```

### 2. estatisticas_gerais
Estatísticas resumidas do sistema
```sql
SELECT
  (SELECT COUNT(*) FROM leads WHERE status != 'perdido') AS leads_ativos,
  (SELECT COUNT(*) FROM clientes WHERE status = 'ativo') AS clientes_ativos,
  (SELECT COUNT(*) FROM casos WHERE status IN ('aberto', 'em_andamento', 'ativo')) AS casos_ativos,
  (SELECT COUNT(*) FROM documentos WHERE status = 'pendente') AS documentos_pendentes,
  (SELECT COUNT(*) FROM agenda WHERE status = 'confirmado' AND data_inicio >= NOW()) AS proximos_eventos;
```

### 3. analytics_consultas
Analytics de consultas dos últimos 30 dias
```sql
SELECT 
  user_id,
  COUNT(*) as total_consultas,
  COUNT(DISTINCT numero_processo) as processos_unicos,
  COUNT(DISTINCT tribunal) as tribunais_consultados,
  AVG(tempo_resposta) as tempo_medio_resposta,
  SUM(CASE WHEN sucesso THEN 1 ELSE 0 END)::float / COUNT(*) as taxa_sucesso,
  DATE_TRUNC('day', consultado_em) as dia
FROM historico_consultas
WHERE consultado_em >= NOW() - INTERVAL '30 days'
GROUP BY user_id, DATE_TRUNC('day', consultado_em);
```

---

## 🔐 Segurança (RLS)

Todas as tabelas têm **Row Level Security (RLS)** habilitado. As políticas seguem dois padrões:

### Padrão 1: Acesso Total para Usuários Autenticados
Tabelas onde todos os usuários autenticados têm acesso total:
- `leads`
- `clientes`
- `casos`
- `agenda`
- `timeline_events`
- `notificacoes`

### Padrão 2: Acesso Restrito por Usuário
Tabelas onde usuários só acessam seus próprios dados:
- `usuarios` (pode ver todos, mas só edita o próprio)
- `documentos` (user_id)
- `processos_favoritos` (user_id)
- `historico_consultas` (user_id)
- `movimentacoes_detectadas` (via processo_favorito_id → user_id)

### Padrão 3: Público
- `cache_cnpj` (leitura pública, escrita autenticada)

---

## 🔄 Triggers Automáticos

Todas as tabelas têm trigger para atualizar automaticamente o campo `updated_at`:

```sql
CREATE TRIGGER update_<tabela>_updated_at 
  BEFORE UPDATE ON <tabela>
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

Tabelas com trigger `updated_at`:
- usuarios
- leads
- clientes
- casos
- documentos
- agenda
- processos_favoritos
- cache_cnpj

### Trigger Especial: Criar Perfil de Usuário
Quando um novo usuário se registra via Supabase Auth, automaticamente cria um perfil na tabela `usuarios`:

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();
```

---

## 📈 Diagrama de Relacionamentos

```
auth.users (Supabase Auth)
    ↓
usuarios (perfis)
    ↓
    ├─→ documentos (user_id)
    ├─→ processos_favoritos (user_id)
    └─→ historico_consultas (user_id)

leads
    ↓
    ├─→ casos (lead_id)
    └─→ (converte em) → clientes

clientes
    ↓
    ├─→ casos (cliente_id)
    ├─→ agenda (cliente_id)
    ├─→ documentos (cliente_id)
    └─→ notificacoes (cliente_id)

casos
    ↓
    ├─→ documentos (caso_id)
    ├─→ agenda (caso_id)
    ├─→ timeline_events (caso_id)
    └─→ notificacoes (caso_id)

processos_favoritos
    ↓
    └─→ movimentacoes_detectadas (processo_favorito_id)
```

---

## 🎯 Boas Práticas de Uso

### 1. Relacionamentos Cliente → Caso → Documentos
```typescript
// Criar cliente
const cliente = await supabase.from('clientes').insert({ nome: 'João Silva' });

// Criar caso para o cliente
const caso = await supabase.from('casos').insert({ 
  titulo: 'Processo Trabalhista',
  cliente_id: cliente.id 
});

// Adicionar documentos ao caso
await supabase.from('documentos').insert({ 
  titulo: 'Contrato',
  caso_id: caso.id,
  user_id: auth.user.id
});
```

### 2. Favoritar Processos
```typescript
await supabase.from('processos_favoritos').insert({
  user_id: auth.user.id,
  numero_processo: '0000000-00.0000.0.00.0000',
  tribunal: 'TJMG',
  notificar: true
});
```

### 3. Registrar Histórico de Consulta
```typescript
await supabase.from('historico_consultas').insert({
  user_id: auth.user.id,
  numero_processo: '0000000-00.0000.0.00.0000',
  tribunal: 'TJMG',
  tempo_resposta: 234,
  sucesso: true
});
```

---

## 📦 Storage

### Bucket: documentos
- **Visibilidade:** Privado
- **Limite de tamanho:** 10MB por arquivo
- **Tipos MIME permitidos:**
  - `application/pdf`
  - `image/jpeg`, `image/jpg`, `image/png`, `image/webp`, `image/heic`
  - `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
  - `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

### Estrutura de Pastas
```
documentos/
  └── {user_id}/
      ├── contratos/
      ├── processos/
      ├── comprovantes/
      └── outros/
```

---

## 🚀 Migração

### Ordem de Criação
1. `00_create_all_tables.sql` - Tabelas principais
2. `20260108_documentos_storage.sql` - Storage e tabela documentos melhorada
3. `20260108_processos_favoritos.sql` - Sistema de favoritos e histórico

### Como Aplicar Migrações
```bash
# Via Supabase CLI
supabase db push

# Via SQL Editor no Supabase Dashboard
# Copie e cole o conteúdo dos arquivos .sql
```

---

## 📝 Notas Importantes

1. **Multi-tenancy:** O sistema não usa `org_id` atualmente. Para implementar, adicione o campo em todas as tabelas principais
2. **Soft Delete:** Não há soft delete. Considere adicionar campo `deleted_at` se necessário
3. **Audit Log:** A tabela `timeline_events` funciona como audit trail para casos
4. **Cache:** `cache_cnpj` reduz consultas à API da Receita Federal
5. **Notificações:** Sistema de notificações em `movimentacoes_detectadas` + `notificacoes`

---

**Última atualização:** 8 de janeiro de 2026  
**Versão do Schema:** 2.0  
**Banco de Dados:** PostgreSQL 15+ (Supabase)
