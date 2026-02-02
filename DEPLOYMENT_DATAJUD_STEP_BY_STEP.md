# 🚀 Deployment DataJud Integration - Instruções Passo a Passo

## 📋 Pré-requisitos

- [ ] Projeto clonado e dependências instaladas (`npm install`)
- [ ] Supabase CLI instalado (`npm install -g supabase`)
- [ ] Conta CNJ com API Key DataJud (solicitada via [wiki DataJud](https://datajud-wiki.cnj.jus.br/))
- [ ] Acesso ao dashboard Supabase (project owner ou admin)
- [ ] Git repository sincronizado

---

## 🔧 Passo 1: Configurar Variáveis de Ambiente

### 1.1 Arquivo `.env.local` (desenvolvimento)
```bash
# .env.local
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### 1.2 Supabase Secrets (Produção)

```bash
# No terminal local
supabase secrets set DATAJUD_API_KEY=<sua-api-key-cnj>
supabase secrets set DATAJUD_RATE_LIMIT_PER_HOUR=100

# Verificar
supabase secrets list
```

**Onde obter a API Key:**
1. Acessar [https://datajud-wiki.cnj.jus.br/api-publica/acesso/](https://datajud-wiki.cnj.jus.br/api-publica/acesso/)
2. Seguir processo de cadastro junto ao CNJ
3. Receber API Key por email
4. Adicionar em Supabase Secrets (não em .env!)

---

## 🗄️ Passo 2: Deploy da Migration do Banco

### 2.1 Verificar migration
```bash
# Listar migrations
ls supabase/migrations/

# Verificar arquivo
cat supabase/migrations/20260131_datajud_casos_integration.sql
```

### 2.2 Deploy no Supabase (ambiente local primeiro)
```bash
# Criar environment local para testar
supabase start

# Aplicar migration
supabase migration list    # Ver migrations
supabase db reset          # Reset e aplicar todas
```

### 2.3 Deploy em Produção
```bash
# Push para remote
supabase db push

# Ou via dashboard Supabase:
# 1. SQL Editor → New query
# 2. Copiar conteúdo de 20260131_datajud_casos_integration.sql
# 3. Executar
```

### 2.4 Verificar tabelas criadas
```sql
-- No Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'datajud%';

-- Deve retornar:
-- datajud_processos
-- datajud_movimentacoes
-- datajud_api_calls
-- datajud_sync_jobs
```

---

## ⚡ Passo 3: Deploy da Edge Function

### 3.1 Desenvolvimento Local
```bash
# Rodar Edge Function localmente
supabase functions serve datajud-enhanced

# Testar em outro terminal
curl -X POST http://localhost:54321/functions/v1/datajud-enhanced \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <SEU-JWT-TOKEN>" \
  -d '{
    "tribunal": "trt",
    "searchType": "parte",
    "query": "João Silva"
  }'
```

### 3.2 Deploy em Produção
```bash
# Deploy via CLI
supabase functions deploy datajud-enhanced

# Ou via dashboard:
# 1. SQL Editor → Edge Functions
# 2. Create new function
# 3. Upload arquivo supabase/functions/datajud-enhanced/index.ts
```

### 3.3 Verificar Deployment
```bash
# Listar functions
supabase functions list

# Descrever function
supabase functions describe datajud-enhanced

# Ver logs
supabase functions describe datajud-enhanced --output yaml
```

### 3.4 Testar no Production
```bash
# Obter ANON_KEY do Supabase
# Ir para: Project Settings → API → anon public

curl -X POST https://xxxxx.supabase.co/functions/v1/datajud-enhanced \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR-ANON-KEY-OR-JWT>" \
  -d '{
    "tribunal": "stj",
    "searchType": "numero",
    "query": "0000001-00.2025.5.15.0000"
  }'
```

---

## 📦 Passo 4: Build do Frontend

### 4.1 Build da aplicação
```bash
# Instalar dependências
npm install

# Build TypeScript
npm run build

# Testar build localmente
npm run preview
```

### 4.2 Verificar erros de compilação
```bash
# Rodar tipo checker
npx tsc --noEmit

# Rodar linter
npm run lint
```

---

## 🧪 Passo 5: Testes

### 5.1 Rodar Testes
```bash
# Todos os testes
npm run test

# Apenas DataJud
npm run test src/services/__tests__/datajudCaseService.test.ts

# Com coverage
npm run test -- --coverage
```

### 5.2 Teste de Integração Manual
```bash
# 1. Iniciar app em dev
npm run dev

# 2. Ir para: http://localhost:5173/app/casos

# 3. Abrir caso existente

# 4. Rolar até "DataJud - Processo Judicial"

# 5. Clicar "Buscar Processo no DataJud"

# 6. Buscar por nome ou número

# 7. Selecionar processo → deve vincular

# 8. Ver seção com dados do processo
```

### 5.3 Verificar Auditoria
```sql
-- No Supabase SQL Editor
SELECT 
  id, user_id, action, tribunal, search_query,
  resultado_count, api_latency_ms, status_code,
  created_at
FROM datajud_api_calls
ORDER BY created_at DESC
LIMIT 10;
```

---

## 📤 Passo 6: Deploy em Vercel

### 6.1 Configurar Vercel
```bash
# Login Vercel
npm i -g vercel
vercel login

# Link projeto (se primeira vez)
vercel link

# Adicionar variáveis de ambiente
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

### 6.2 Deploy Preview
```bash
# Deploy preview (cria URL temporária)
vercel --prod=false

# URL será: https://project-name-xxxxx.vercel.app
```

### 6.3 Deploy Produção
```bash
# Deploy para produção
vercel --prod

# Ou via git push (se configurado):
git push origin main
```

### 6.4 Verificar Deployment
```bash
# Listar deployments
vercel deployments list

# Logs em tempo real
vercel logs <deployment-url>
```

---

## ✅ Passo 7: Verificações Pós-Deploy

### 7.1 Checklist de Produção

- [ ] Migration foi aplicada (verificar tabelas em Supabase)
- [ ] Edge Function foi deployada (verificar em Supabase functions list)
- [ ] Secrets foram setadas (DATAJUD_API_KEY presente)
- [ ] Frontend está buildando sem erros
- [ ] Testes passando
- [ ] Vercel deployment sucesso
- [ ] URL funciona: https://seu-dominio.com

### 7.2 Teste em Produção
```bash
# 1. Acessar site em produção
# 2. Fazer login
# 3. Ir para caso existente
# 4. Testar busca DataJud
# 5. Testar vinculação de processo
# 6. Verificar auditoria em Supabase
```

### 7.3 Monitoramento
```bash
# Ver health checks
curl https://seu-dominio.com/api/health

# Verificar logs Edge Function
supabase functions describe datajud-enhanced --output json

# Monitorar auditoria
SELECT COUNT(*) FROM datajud_api_calls 
WHERE created_at > NOW() - INTERVAL '1 hour';
```

---

## 🔍 Passo 8: Troubleshooting Deploy

### Erro: "Migration failed"
```bash
# Verificar migração
supabase migration list

# Ver erro específico
supabase db pull

# Rollback se necessário
supabase migration repair --status reverted 20260131_datajud_casos_integration
```

### Erro: "Edge Function timeout"
```bash
# Aumentar timeout (máx 900s)
# No código: já configurado em index.ts

# Verificar logs
supabase functions describe datajud-enhanced --logs
```

### Erro: "Rate limit exceeded"
```bash
# Aumentar em Supabase Secrets
supabase secrets set DATAJUD_RATE_LIMIT_PER_HOUR=200
```

### Erro: "RLS policy violation"
```sql
-- Verificar policies
SELECT * FROM pg_policies WHERE tablename = 'datajud_processos';

-- Re-create policies se necessário
-- Executar migration novamente
```

---

## 📊 Passo 9: Monitoramento Pós-Deploy

### Métricas a Acompanhar
```sql
-- Queries/dia
SELECT DATE(created_at), COUNT(*) as queries
FROM datajud_api_calls
GROUP BY DATE(created_at)
ORDER BY DATE(created_at) DESC;

-- Taxa de sucesso
SELECT 
  status_code,
  COUNT(*) as count
FROM datajud_api_calls
GROUP BY status_code;

-- Latência média
SELECT 
  tribunal,
  AVG(api_latency_ms) as avg_latency_ms,
  MAX(api_latency_ms) as max_latency_ms
FROM datajud_api_calls
GROUP BY tribunal;

-- Processos vinculados
SELECT COUNT(*) as casos_com_datajud
FROM casos
WHERE numero_processo IS NOT NULL;
```

### Setup Alertas
1. Supabase Dashboard → Logs → Filters
2. Setup alert se: `api_latency_ms > 5000`
3. Setup alert se: `status_code != 200`
4. Setup alert se: `datajud_api_calls COUNT > 100 per hour`

---

## 🔐 Passo 10: Segurança

### Verificar Segurança
- [ ] API Key não está em `.env` público
- [ ] API Key não aparece em logs
- [ ] RLS policies estão habilitadas
- [ ] Só admins podem ver `datajud_api_calls`
- [ ] Rate limit está ativo

### Auditoria Periódica
```sql
-- Auditoria semanal
SELECT 
  user_id,
  DATE(created_at),
  COUNT(*) as searches
FROM datajud_api_calls
GROUP BY user_id, DATE(created_at)
ORDER BY searches DESC;

-- Limpar dados antigos (LGPD - 90 dias)
DELETE FROM datajud_api_calls
WHERE created_at < NOW() - INTERVAL '90 days';
```

---

## 📞 Rollback de Emergência

Se algo deu errado:

```bash
# 1. Reverter Edge Function
supabase functions delete datajud-enhanced

# 2. Reverter migration (se necessário)
supabase migration repair --status reverted 20260131_datajud_casos_integration

# 3. Re-deploy depois de fix
# Editar código
# Fazer commit
# Re-deploy
```

---

## ✨ Conclusão

Parabéns! DataJud está deployado em produção! 🎉

**Próximos passos:**
1. Monitorar métricas por 1 semana
2. Coletar feedback de usuários
3. Planejar Phase 2 (sincronização automática, notificações)
4. Integrar outras APIs (CNPJ, CPF, ViaCEP, etc.)

---

## 📚 Documentação Referência

- [API_INTEGRATION_DATAJUD.md](./API_INTEGRATION_DATAJUD.md)
- [IMPLEMENTACAO_DATAJUD_RESUMO.md](./IMPLEMENTACAO_DATAJUD_RESUMO.md)
- [Wiki DataJud](https://datajud-wiki.cnj.jus.br/)
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Supabase RLS Docs](https://supabase.com/docs/guides/auth/row-level-security)
