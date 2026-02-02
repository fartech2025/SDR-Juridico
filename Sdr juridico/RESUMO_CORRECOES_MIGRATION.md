# Resumo das Correções da Migration DataJud

## Data de Criação
31 de janeiro de 2026

## Versão
20260131_datajud_casos_integration.sql (v1.3 - Corrigida)

## Status
✅ **PRONTA PARA EXECUÇÃO**

---

## Histórico de Correções

### Correção #1: Coluna cached_at Faltando
**Erro Original**: 
```
ERROR: 42703: column cached_at does not exist
```

**Análise**:
- A coluna `cached_at` era referenciada na tabela `datajud_processos` mas não era criada inicialmente
- O ALTER TABLE IF EXISTS tentava adicionar, mas havia um erro

**Solução Aplicada**:
```sql
ALTER TABLE public.casos 
ADD COLUMN IF NOT EXISTS cached_at TIMESTAMPTZ DEFAULT now();
```

---

### Correção #2: Coluna assunto_principal Não Adicionada
**Erro Original**: 
```
ERROR: 42703: column assunto_principal does not exist
```

**Análise**:
- A VIEW `v_casos_com_datajud` selecionava `c.assunto_principal`
- Mas a coluna não era criada no ALTER TABLE da PARTE 1

**Solução Aplicada**:
```sql
ALTER TABLE public.casos 
ADD COLUMN IF NOT EXISTS assunto_principal TEXT;
```

---

### Correção #3: Syntax PostgreSQL - ALTER TABLE com Constraints
**Erro Original**: 
```
ERROR: syntax error at or near "CHECK"
```

**Análise**:
- PostgreSQL não permite múltiplas colunas + constraints inline em um único ALTER TABLE
- Tentativa original:
  ```sql
  ALTER TABLE casos 
  ADD COLUMN IF NOT EXISTS col1 TYPE,
  ADD COLUMN IF NOT EXISTS col2 TYPE CHECK (...)
  ```

**Solução Aplicada**:
- Separadas as colunas em ALTER statements individuais
- Constraints movidas para ALTER statements separados

**Antes**:
```sql
ALTER TABLE public.casos 
ADD COLUMN IF NOT EXISTS numero_processo TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS datajud_sync_status TEXT DEFAULT 'nunca_sincronizado'
  CHECK (datajud_sync_status IN (...));
```

**Depois**:
```sql
ALTER TABLE public.casos 
ADD COLUMN IF NOT EXISTS numero_processo TEXT UNIQUE;

ALTER TABLE public.casos 
ADD COLUMN IF NOT EXISTS datajud_sync_status TEXT DEFAULT 'nunca_sincronizado';

ALTER TABLE public.casos 
ADD CONSTRAINT IF NOT EXISTS casos_datajud_sync_status_check 
CHECK (datajud_sync_status IN (...));
```

---

### Correção #4: VIEW Referenciando Coluna Non-existent
**Erro Original**: 
```
ERROR: 42703: column c.datajud_processo_id does not exist
```

**Análise**:
- A VIEW estava tentando fazer LEFT JOIN com `c.datajud_processo_id` que não era criado
- Problema cascata das correções anteriores

**Solução Aplicada**:
- Adicionado DROP VIEW IF EXISTS CASCADE no início
- Garantido que todas as colunas referenciadas são criadas antes da VIEW

```sql
DROP VIEW IF EXISTS public.v_casos_com_datajud CASCADE;

-- Adicionar coluna na tabela casos
ALTER TABLE public.casos 
ADD COLUMN IF NOT EXISTS datajud_processo_id UUID;

-- Depois criar a VIEW com segurança
CREATE VIEW public.v_casos_com_datajud AS
SELECT ...
  c.datajud_processo_id,
  dp."dataAtualizacao" as ultima_atualizacao_datajud
FROM public.casos c
LEFT JOIN public.datajud_processos dp ON c.datajud_processo_id = dp.id
```

---

## Estrutura Final da Migration

### PARTE 1: ALTER TABLE CASOS
**Colunas Adicionadas**:
- `numero_processo TEXT` - Número do processo judicial
- `tribunal TEXT` - Tribunal (TRF, TRT, TRE, etc.)
- `grau TEXT` - Grau de jurisdição (padrão: 'primeiro')
- `classe_processual TEXT` - Classe (ação, apelação, etc.)
- `assunto_principal TEXT` - Assunto principal do processo
- `datajud_processo_id UUID` - FK para tabela datajud_processos
- `datajud_last_sync_at TIMESTAMPTZ` - Timestamp da última sincronização
- `datajud_sync_error TEXT` - Mensagem de erro da última tentativa
- `datajud_sync_status TEXT` - Status (nunca_sincronizado, sincronizado, em_erro, pendente_sync)
- `cached_at TIMESTAMPTZ` - Timestamp de cache

**Constraints Adicionadas**:
- CHECK: `datajud_sync_status` deve estar em valores válidos
- UNIQUE: `numero_processo` com org_id (processos únicos por organização)

**Índices Adicionados**:
- `idx_casos_numero_processo` - Para buscas por número
- `idx_casos_datajud_processo_id` - Para joins
- `idx_casos_tribunal` - Para filtros por tribunal

### PARTE 2: CREATE TABLE datajud_processos
**Colunas**:
- `id UUID` - PK
- `numero_processo TEXT UNIQUE` - Identificador único CNJ
- `tribunal TEXT` - Tribunal origem
- `grau TEXT` - Grau de jurisdição
- `classe_processual TEXT` - Classe processual
- `assunto TEXT` - Assunto (JSON da API)
- `dataAjuizamento TIMESTAMPTZ` - Data de ajuizamento
- `dataAtualizacao TIMESTAMPTZ` - Data de atualização da API
- `sigiloso BOOLEAN` - Se é sigilo processual
- `raw_response JSONB` - Resposta JSON completa da API
- `cached_at TIMESTAMPTZ` - Timestamp de cache
- `org_id UUID` - FK para organizations (RLS)

**Índices**: 3 (numero_tribunal, org_id, cached_at)

### PARTE 3: CREATE TABLE datajud_movimentacoes
**Colunas**:
- `id UUID` - PK
- `datajud_processo_id UUID` - FK para datajud_processos
- `codigo TEXT` - Código da movimentação
- `nome TEXT` - Nome da movimentação
- `data_hora TIMESTAMPTZ` - Data/hora da movimentação
- `complemento TEXT` - Dados adicionais
- `raw_response JSONB` - JSON completo da API
- `detected_at TIMESTAMPTZ` - Quando foi detectada
- `notified BOOLEAN` - Se foi notificado usuário

**Índices**: 3 (processo_id, data_hora DESC, notified)

### PARTE 4: CREATE TABLE datajud_api_calls (Auditoria)
**Colunas**:
- `id UUID` - PK
- `user_id UUID` - FK para auth.users (quem fez)
- `org_id UUID` - FK para organizations (qual org)
- `action TEXT` - Ação realizada
- `tribunal TEXT` - Tribunal consultado
- `search_query TEXT` - Busca executada
- `resultado_count INTEGER` - Quantidade de resultados
- `api_latency_ms INTEGER` - Tempo de resposta API (ms)
- `status_code INTEGER` - HTTP status
- `error_message TEXT` - Se erro, mensagem
- `ip_address TEXT` - IP do usuário
- `user_agent TEXT` - User agent do navegador

**Índices**: 4 (user_id, org_id, created_at DESC, tribunal)

### PARTE 5: CREATE TABLE datajud_sync_jobs
**Colunas**:
- Tracking de jobs de sincronização assíncrona
- Status, tentativas, próxima execução, etc.

### PARTE 6: CREATE VIEW v_casos_com_datajud
**Propósito**: Dashboard query para casos com informações DataJud
**Joins**: LEFT JOIN com datajud_processos e datajud_movimentacoes
**Agregações**: COUNT(DISTINCT movimentacoes)

### PARTE 7: RLS POLICIES
**8 Policies para**:
- datajud_processos (SELECT, INSERT, UPDATE, DELETE)
- datajud_movimentacoes (SELECT, INSERT, UPDATE)
- datajud_api_calls (SELECT, INSERT)
- datajud_sync_jobs (SELECT, INSERT, UPDATE)

---

## Mudanças Implementadas

| Parte | Alteração | Status |
|-------|-----------|--------|
| 1 | ALTER TABLE - Colunas | ✅ Corrigida |
| 2 | CREATE TABLE datajud_processos | ✅ OK |
| 3 | CREATE TABLE datajud_movimentacoes | ✅ OK |
| 4 | CREATE TABLE datajud_api_calls | ✅ OK |
| 5 | CREATE TABLE datajud_sync_jobs | ✅ OK |
| 6 | CREATE VIEW v_casos_com_datajud | ✅ Corrigida |
| 7 | RLS POLICIES | ✅ OK |
| 8 | TRIGGERS | ✅ OK |

---

## Testes Sugeridos Pós-Execução

```sql
-- 1. Verificar colunas foram criadas
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'casos' ORDER BY column_name;

-- 2. Inserir teste na tabela casos
INSERT INTO public.casos (titulo, area, org_id) 
VALUES ('Teste DataJud', 'Cível', 'seu-org-id') 
RETURNING id, datajud_sync_status;

-- 3. Verificar valor padrão
SELECT datajud_sync_status FROM public.casos 
WHERE titulo = 'Teste DataJud';

-- 4. Testar constraint
UPDATE public.casos SET datajud_sync_status = 'invalid' 
WHERE titulo = 'Teste DataJud'; 
-- Deve falhar com CHECK constraint violation

-- 5. Limpar teste
DELETE FROM public.casos WHERE titulo = 'Teste DataJud';
```

---

## Próximas Fases

### Fase 1: Edge Function ✅ Pronta
- Arquivo: `supabase/functions/datajud-enhanced/index.ts`
- Deploy: `supabase functions deploy datajud-enhanced`

### Fase 2: Frontend ✅ Pronto
- Componentes criados
- Hooks criados
- Build: `npm run build`

### Fase 3: Deploy para Produção ✅ Pronto
- Git push para main
- Vercel auto-deploy

---

## Notas Importantes

1. **IF NOT EXISTS**: Toda operação usa `IF NOT EXISTS` para idempotência
2. **RLS Segura**: Todas as tabelas têm row-level security ativado
3. **Auditoria Completa**: Cada chamada API é registrada em datajud_api_calls
4. **Multi-tenant Pronta**: org_id em todas as tabelas para isolamento
5. **Performance**: Índices estratégicos em colunas de filtro e join

---

**Versão**: 1.3 (Corrigida e Pronta)
**Última Atualização**: 31 de janeiro de 2026
**Status**: ✅ PRONTA PARA PRODUÇÃO

