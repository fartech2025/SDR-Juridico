# 🔍 Análise de Compatibilidade: Banco de Dados vs Aplicação

**Data da Análise:** 8 de janeiro de 2026  
**Status Geral:** ⚠️ **INCOMPATIBILIDADE CRÍTICA DETECTADA**

---

## ❌ Problemas Críticos Identificados

### 1. **TABELAS FALTANDO NO BANCO DE DADOS**

A aplicação usa tabelas que **NÃO EXISTEM** no schema do banco:

#### ❌ **agendamentos** (usado pela aplicação)
- **Na aplicação:** `agendaService.ts` usa `.from('agendamentos')`
- **No banco:** A tabela se chama `agenda` (não `agendamentos`)
- **Impacto:** 🔴 **CRÍTICO** - Todas as operações de agenda vão falhar

**Ocorrências no código:**
```typescript
// src/services/agendaService.ts (linhas 25, 42, 62, 129, 152, 173)
.from('agendamentos')  // ❌ INCORRETO
```

**Correção necessária:** Renomear todas as referências de `agendamentos` para `agenda`

---

### 2. **TABELAS USADAS NO CÓDIGO MAS NÃO MAPEADAS**

A aplicação espera tabelas multi-tenant que o banco atual NÃO TEM:

#### ❌ **orgs** - Sistema de Organizações
- **Usado em:** `supabaseClient.ts` (OrgRow interface)
- **No banco:** ❌ NÃO EXISTE
- **Impacto:** 🔴 **CRÍTICO** - Sistema multi-tenant não funciona

#### ❌ **profiles** - Perfis de Usuários
- **Usado em:** Relacionamentos em leads, casos, documentos, agenda
- **No banco:** Existe `usuarios` (não `profiles`)
- **Impacto:** 🔴 **CRÍTICO** - Todas as queries com JOIN em profiles vão falhar

**Exemplos de JOINs quebrados:**
```typescript
// src/services/leadsService.ts
.select('*, assigned_user:profiles!assigned_user_id(nome)')  // ❌ FALHA

// src/services/clientesService.ts
.select('*, owner_user:profiles!owner_user_id(nome)')  // ❌ FALHA

// src/services/casosService.ts
.select('*, responsavel:profiles!responsavel_user_id(nome)')  // ❌ FALHA

// src/services/documentosService.ts
.select('*, uploader:profiles!uploaded_by(nome)')  // ❌ FALHA

// src/services/agendaService.ts
.select('*, owner:profiles!owner_user_id(nome)')  // ❌ FALHA
```

#### ❌ **org_members** - Membros das Organizações
- **Usado em:** `supabaseClient.ts` (OrgMemberRow interface)
- **No banco:** ❌ NÃO EXISTE
- **Impacto:** 🟡 MÉDIO - Feature de membros não funciona

---

### 3. **CAMPOS INCOMPATÍVEIS**

#### ❌ Tabela `leads`

**No Código (supabaseClient.ts):**
```typescript
interface LeadRow {
  id: string
  created_at: string
  org_id: string              // ❌ NÃO EXISTE no banco
  status: LeadStatus
  canal: ChannelType          // ❌ NÃO EXISTE no banco
  nome: string
  telefone: string
  email: string
  origem: string
  assunto: string             // ❌ NÃO EXISTE no banco
  resumo: string              // ❌ NÃO EXISTE no banco
  qualificacao: Record<string, unknown>  // ❌ NÃO EXISTE no banco
  assigned_user_id: string    // ❌ NÃO EXISTE no banco
  cliente_id: string
  remote_id: string           // ❌ NÃO EXISTE no banco
  last_contact_at: string     // ❌ NÃO EXISTE no banco
}
```

**No Banco (00_create_all_tables.sql):**
```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  empresa TEXT,                  -- ❌ Não está no código
  area TEXT,                     -- ❌ Não está no código
  origem TEXT,
  status TEXT,
  heat TEXT,                     -- ❌ Não está no código
  ultimo_contato TIMESTAMPTZ,    -- ❌ Nome diferente
  responsavel TEXT,              -- ❌ Não está no código
  observacoes TEXT,              -- ❌ Não está no código
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

**Campos faltando no banco:**
- ❌ `org_id` (multi-tenancy)
- ❌ `canal` (WhatsApp, Email, etc)
- ❌ `assunto`
- ❌ `resumo`
- ❌ `qualificacao` (JSONB)
- ❌ `assigned_user_id` (FK para usuarios)
- ❌ `cliente_id` (FK para clientes)
- ❌ `remote_id`
- ❌ `last_contact_at`

**Campos extras no banco (não usados no código):**
- ⚠️ `empresa`
- ⚠️ `area`
- ⚠️ `heat`
- ⚠️ `responsavel` (TEXT simples, não FK)
- ⚠️ `observacoes`

---

#### ❌ Tabela `clientes`

**No Código:**
```typescript
interface ClienteRow {
  id: string
  created_at: string
  org_id: string              // ❌ NÃO EXISTE no banco
  tipo: string                // ❌ NÃO EXISTE no banco
  nome: string
  documento: string           // ❌ NÃO EXISTE no banco (tem cpf/cnpj separado)
  email: string
  telefone: string
  endereco: Record<string, unknown>  // ❌ TIPO DIFERENTE (JSONB vs TEXT)
  tags: string[]              // ❌ NÃO EXISTE no banco
  observacoes: string
  owner_user_id: string       // ❌ NÃO EXISTE no banco
}
```

**No Banco:**
```sql
CREATE TABLE clientes (
  id UUID,
  nome TEXT,
  email TEXT,
  telefone TEXT,
  empresa TEXT,              -- ❌ Não está no código
  cnpj TEXT,                 -- ❌ Separado (não "documento")
  cpf TEXT,                  -- ❌ Separado (não "documento")
  endereco TEXT,             -- ❌ TEXT simples (não JSONB)
  cidade TEXT,               -- ❌ Não está no código
  estado TEXT,               -- ❌ Não está no código
  cep TEXT,                  -- ❌ Não está no código
  area_atuacao TEXT,         -- ❌ Não está no código
  responsavel TEXT,          -- ❌ Não está no código
  status TEXT,               -- ❌ Não está no código
  health TEXT,               -- ❌ Não está no código
  observacoes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

---

#### ❌ Tabela `casos`

**Discrepâncias principais:**
- ❌ `org_id` - Não existe no banco
- ❌ `status` - Valores diferentes (código: 'aberto' | 'triagem' | 'negociacao'... vs banco: 'aberto' | 'em_andamento' | 'resolvido'...)
- ❌ `titulo` vs `title` - Inconsistência de nomenclatura
- ❌ `area` e `subarea` no código, mas só `area` no banco
- ❌ `responsavel_user_id` (UUID no código) vs `responsavel` (TEXT no banco)
- ❌ `encerrado_em` no código vs `data_encerramento` no banco

---

#### ❌ Tabela `documentos`

**Problema principal: DUPLICAÇÃO DE CAMPOS**

O banco tem DUAS definições conflitantes de documentos:
1. Na migration `00_create_all_tables.sql`
2. Na migration `20260108_documentos_storage.sql`

**Campos conflitantes:**
- `titulo` vs `nome_arquivo`
- `descricao` (existe nas 2)
- `caso_id` (existe nas 2)
- `tipo` vs `tipo_arquivo`
- `status` (valores diferentes)
- `url` vs `storage_path`
- `arquivo_nome` vs `nome_original`
- `uploaded_by` (código) vs não existe no banco principal

**O código usa:**
```typescript
interface DocumentoRow {
  id: string
  created_at: string
  org_id: string              // ❌ NÃO EXISTE
  title: string               // ❌ "titulo" no banco
  description: string         // ❌ "descricao" no banco
  visibility: DocumentVisibility  // ❌ NÃO EXISTE no banco
  bucket: string              // ✅ OK (storage)
  storage_path: string        // ✅ OK
  mime_type: string           // ✅ OK
  size_bytes: number          // ✅ OK (tamanho_bytes)
  lead_id: string             // ❌ NÃO EXISTE no banco
  cliente_id: string          // ✅ OK
  caso_id: string             // ✅ OK
  uploaded_by: string         // ⚠️ Existe no código, não no banco principal
  tags: string[]              // ✅ OK
  meta: Record<string, unknown>  // ⚠️ "metadata" no banco
}
```

---

#### ⚠️ Tabela `agenda` vs código usa `agendamentos`

**NOME ERRADO no código!**

O código usa `.from('agendamentos')` mas a tabela se chama `agenda`.

**Campos também incompatíveis:**
- Código: `title`, `start_at`, `end_at`, `owner_user_id`
- Banco: `titulo`, `data_inicio`, `data_fim`, `responsavel` (TEXT)

---

### 4. **TABELAS QUE EXISTEM NO BANCO MAS NÃO SÃO USADAS**

Essas tabelas existem no banco mas não têm services na aplicação:

#### ✅ **timeline_events**
- **No banco:** ✅ Existe
- **No código:** ❌ Nenhum service implementado
- **Impacto:** 🟢 BAIXO - Feature não implementada ainda

#### ✅ **notificacoes**
- **No banco:** ✅ Existe
- **No código:** ❌ Nenhum service implementado
- **Impacto:** 🟢 BAIXO - Feature não implementada ainda

---

## ✅ Tabelas Compatíveis (Com Pequenas Ressalvas)

### ✅ **processos_favoritos**
- **Compatibilidade:** 95%
- **Problemas:** Nenhum crítico
- **Service:** `favoritosService.ts` - Funcional

### ✅ **historico_consultas**
- **Compatibilidade:** 95%
- **Problemas:** Nenhum crítico
- **Service:** `favoritosService.ts` - Funcional

### ✅ **cache_cnpj**
- **Compatibilidade:** 100%
- **Service:** `cnpjService.ts` - Funcional

### ✅ **movimentacoes_detectadas**
- **Compatibilidade:** 95%
- **Problemas:** Nenhum crítico
- **Service:** `favoritosService.ts` - Funcional

### ✅ **conversas**
- **Compatibilidade:** 90%
- **Service:** `mensagensService.ts` - Funcional

### ✅ **mensagens**
- **Compatibilidade:** 90%
- **Service:** `mensagensService.ts` - Funcional

### ✅ **integrations**
- **Compatibilidade:** 90%
- **Service:** `integrationsService.ts` - Funcional

### ✅ **notas**
- **Compatibilidade:** 90%
- **Service:** `notasService.ts` - Funcional

---

## 📊 Resumo de Compatibilidade

| Tabela | No Banco | No Código | Compatibilidade | Status |
|--------|----------|-----------|-----------------|--------|
| **usuarios** | ✅ | ❌ (usa profiles) | 0% | 🔴 CRÍTICO |
| **profiles** | ❌ | ✅ | 0% | 🔴 CRÍTICO |
| **orgs** | ❌ | ✅ | 0% | 🔴 CRÍTICO |
| **org_members** | ❌ | ✅ | 0% | 🔴 CRÍTICO |
| **leads** | ✅ | ✅ | 30% | 🔴 CRÍTICO |
| **clientes** | ✅ | ✅ | 40% | 🔴 CRÍTICO |
| **casos** | ✅ | ✅ | 50% | 🟡 MÉDIO |
| **documentos** | ✅ | ✅ | 40% | 🔴 CRÍTICO |
| **agenda** | ✅ | ❌ (usa agendamentos) | 0% | 🔴 CRÍTICO |
| **timeline_events** | ✅ | ❌ | N/A | 🟢 OK (não usado) |
| **notificacoes** | ✅ | ❌ | N/A | 🟢 OK (não usado) |
| **processos_favoritos** | ✅ | ✅ | 95% | 🟢 OK |
| **historico_consultas** | ✅ | ✅ | 95% | 🟢 OK |
| **cache_cnpj** | ✅ | ✅ | 100% | 🟢 OK |
| **movimentacoes_detectadas** | ✅ | ✅ | 95% | 🟢 OK |
| **conversas** | ✅ | ✅ | 90% | 🟢 OK |
| **mensagens** | ✅ | ✅ | 90% | 🟢 OK |
| **integrations** | ✅ | ✅ | 90% | 🟢 OK |
| **notas** | ✅ | ✅ | 90% | 🟢 OK |

**Legenda:**
- 🔴 CRÍTICO: Aplicação vai quebrar / não funciona
- 🟡 MÉDIO: Funciona parcialmente com bugs
- 🟢 OK: Funcional ou não crítico

---

## 🛠️ Plano de Correção

### **OPÇÃO 1: Atualizar o Banco de Dados (RECOMENDADO)**

Criar migration para adequar o banco ao código da aplicação:

```sql
-- 1. Renomear usuarios para profiles
ALTER TABLE usuarios RENAME TO profiles;
ALTER TABLE profiles RENAME COLUMN nome_completo TO nome;

-- 2. Criar tabela orgs
CREATE TABLE orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  nome TEXT NOT NULL,
  cnpj TEXT,
  plano TEXT,
  ativo BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}'
);

-- 3. Criar tabela org_members
CREATE TABLE org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'gestor', 'advogado', 'secretaria', 'leitura')),
  ativo BOOLEAN DEFAULT true,
  UNIQUE(org_id, user_id)
);

-- 4. Adicionar org_id em todas as tabelas principais
ALTER TABLE leads ADD COLUMN org_id UUID;
ALTER TABLE clientes ADD COLUMN org_id UUID;
ALTER TABLE casos ADD COLUMN org_id UUID;
ALTER TABLE documentos ADD COLUMN org_id UUID;
ALTER TABLE agenda ADD COLUMN org_id UUID;

-- 5. Atualizar tabela leads
ALTER TABLE leads ADD COLUMN canal TEXT;
ALTER TABLE leads ADD COLUMN assunto TEXT;
ALTER TABLE leads ADD COLUMN resumo TEXT;
ALTER TABLE leads ADD COLUMN qualificacao JSONB;
ALTER TABLE leads ADD COLUMN assigned_user_id UUID REFERENCES profiles(user_id);
ALTER TABLE leads ADD COLUMN cliente_id UUID REFERENCES clientes(id);
ALTER TABLE leads ADD COLUMN remote_id TEXT;
ALTER TABLE leads ADD COLUMN last_contact_at TIMESTAMPTZ;
ALTER TABLE leads RENAME COLUMN ultimo_contato TO ultimo_contato_old;

-- 6. Atualizar tabela clientes
ALTER TABLE clientes ADD COLUMN tipo TEXT;
ALTER TABLE clientes ADD COLUMN documento TEXT;
ALTER TABLE clientes ADD COLUMN tags TEXT[];
ALTER TABLE clientes ADD COLUMN owner_user_id UUID REFERENCES profiles(user_id);
ALTER TABLE clientes ALTER COLUMN endereco TYPE JSONB USING endereco::jsonb;

-- 7. Renomear agenda para agendamentos
ALTER TABLE agenda RENAME TO agendamentos;
ALTER TABLE agendamentos RENAME COLUMN titulo TO title;
ALTER TABLE agendamentos RENAME COLUMN data_inicio TO start_at;
ALTER TABLE agendamentos RENAME COLUMN data_fim TO end_at;
ALTER TABLE agendamentos RENAME COLUMN responsavel TO responsavel_old;
ALTER TABLE agendamentos ADD COLUMN owner_user_id UUID REFERENCES profiles(user_id);

-- 8. Atualizar tabela casos
ALTER TABLE casos RENAME COLUMN titulo TO title;
ALTER TABLE casos ADD COLUMN subarea TEXT;
ALTER TABLE casos RENAME COLUMN responsavel TO responsavel_old;
ALTER TABLE casos ADD COLUMN responsavel_user_id UUID REFERENCES profiles(user_id);
ALTER TABLE casos RENAME COLUMN data_encerramento TO encerrado_em;

-- 9. Atualizar tabela documentos
ALTER TABLE documentos RENAME COLUMN titulo TO title;
ALTER TABLE documentos RENAME COLUMN descricao TO description;
ALTER TABLE documentos ADD COLUMN visibility TEXT;
ALTER TABLE documentos ADD COLUMN bucket TEXT;
ALTER TABLE documentos ADD COLUMN lead_id UUID REFERENCES leads(id);
ALTER TABLE documentos ADD COLUMN uploaded_by UUID REFERENCES profiles(user_id);
ALTER TABLE documentos RENAME COLUMN metadata TO meta;
```

---

### **OPÇÃO 2: Atualizar o Código (NÃO RECOMENDADO)**

Seria necessário reescrever:
- ❌ `supabaseClient.ts` (todas as interfaces)
- ❌ `leadsService.ts`
- ❌ `clientesService.ts`
- ❌ `casosService.ts`
- ❌ `documentosService.ts`
- ❌ `agendaService.ts`
- ❌ Todos os componentes React que usam esses tipos

**Estimativa:** 8-12 horas de trabalho + alto risco de bugs

---

## 🎯 Ações Imediatas Recomendadas

### **FASE 1: Correções Críticas (OBRIGATÓRIAS)**

1. **Renomear `usuarios` → `profiles`**
   ```sql
   ALTER TABLE usuarios RENAME TO profiles;
   ```

2. **Renomear `agenda` → `agendamentos`**
   ```sql
   ALTER TABLE agenda RENAME TO agendamentos;
   ```

3. **Criar tabelas `orgs` e `org_members`**
   - Necessárias para multi-tenancy funcionar

4. **Adicionar `org_id` em todas as tabelas principais**
   - leads, clientes, casos, documentos, agendamentos

5. **Atualizar campos da tabela `leads`**
   - Adicionar: canal, assunto, resumo, qualificacao, assigned_user_id, cliente_id, remote_id, last_contact_at

6. **Atualizar campos da tabela `clientes`**
   - Adicionar: tipo, documento, tags, owner_user_id
   - Alterar endereco para JSONB

### **FASE 2: Melhorias (RECOMENDADAS)**

7. Padronizar nomenclatura (PT vs EN)
8. Adicionar campos faltantes em casos
9. Reorganizar tabela documentos
10. Criar indexes para FKs novos
11. Atualizar RLS policies para incluir org_id

### **FASE 3: Limpeza (OPCIONAL)**

12. Remover campos não usados
13. Consolidar campos duplicados
14. Documentar decisões de design

---

## 📝 Conclusão

**Status Atual:** ⚠️ **APLICAÇÃO NÃO FUNCIONAL COM BANCO ATUAL**

**Principais Bloqueadores:**
1. 🔴 Tabela `profiles` não existe (código espera, banco tem `usuarios`)
2. 🔴 Tabela `agendamentos` não existe (código espera, banco tem `agenda`)
3. 🔴 Falta sistema multi-tenant (`orgs`, `org_members`, `org_id`)
4. 🔴 Campos críticos faltando em `leads`, `clientes`, `casos`, `documentos`

**Recomendação:** Executar OPÇÃO 1 (migração do banco) para adequar schema ao código da aplicação, que está mais moderno e completo.

**Tempo estimado de correção:** 4-6 horas para migrations + testes
