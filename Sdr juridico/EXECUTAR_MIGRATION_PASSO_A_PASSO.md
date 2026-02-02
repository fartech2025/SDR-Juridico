# Como Executar a Migration DataJud

## Opção Mais Rápida: SQL Editor do Supabase Dashboard

1. **Abra o Supabase Dashboard**
   - URL: https://app.supabase.com
   - Selecione o projeto "SDR Juridico"

2. **Navegue até SQL Editor**
   - Clique em "SQL Editor" no painel esquerdo
   - Clique em "New Query" ou "Create a new query"

3. **Copie e Cole o Código**
   - Abra o arquivo: `supabase/migrations/20260131_datajud_casos_integration.sql`
   - Copie TODO o conteúdo
   - Cole no editor SQL do Supabase

4. **Execute**
   - Clique no botão azul "Run" (ou Ctrl+Enter)
   - Aguarde 30-60 segundos para conclusão

5. **Verifique o Sucesso**
   - Você verá "Query executed successfully" se passou
   - Execute este comando para confirmar:
   ```sql
   SELECT COUNT(*) as total_processos FROM public.datajud_processos;
   -- Resultado: 0 (tabela vazia, como esperado)
   ```

---

## Passo a Passo Visual

### Passo 1: Acessar Supabase
```
URL: https://app.supabase.com
├── Fazer login com seu email
├── Clicar em "SDR Juridico" (seu projeto)
└── Aguardar carregamento (20-30s)
```

### Passo 2: SQL Editor
```
Painel Esquerdo:
├── SQL Editor (ícone de { })
│   ├── New Query
│   └── Ou clicar em "+ New"
└── Selecionar "SQL Query"
```

### Passo 3: Copiar SQL
```
Arquivo local: Sdr juridico\supabase\migrations\20260131_datajud_casos_integration.sql
└── Abrir e copiar TODO o conteúdo
```

### Passo 4: Colar e Executar
```
Supabase SQL Editor:
├── Colar o SQL
├── Clique em "Run" (botão azul)
└── Ou pressione: Ctrl+Enter
```

### Passo 5: Verificar
```
Resultado esperado:
┌─────────────────────┐
│ Query executed successfully
│ All 63 queries completed (took ~30s)
└─────────────────────┘
```

---

## Se Receber Erro

### Erro: "relation \"...\" already exists"
**Causa**: Tabela já foi criada por execução anterior
**Solução**: É seguro executar novamente - o código usa `IF NOT EXISTS`
**Ação**: Execute novamente

### Erro: "column \"...\" does not exist"
**Causa**: Uma das migrations anteriores falhou
**Solução**: Contate seu admin para verificar migrations anteriores
**Ação**: 
```sql
-- Execute esta query para ver o status:
SELECT * FROM migrations_applied WHERE name LIKE '202601%';
```

### Erro: "permission denied for schema public"
**Causa**: Seu usuário não tem permissão
**Solução**: Use a conexão admin do Supabase (deve ser automático)
**Ação**: Tente novamente ou contate admin

### Erro: "insufficient_privilege"
**Causa**: Role do banco com permissões insuficientes
**Solução**: Ejecutar como postgres ou role com mais permissões
**Ação**: 
```bash
# No CLI:
supabase db reset  # ⚠️ CUIDADO: Apaga todas os dados!
supabase db push   # Depois refaz as migrations
```

---

## Verificação Completa Após Execução

Execute estes comandos no SQL Editor para confirmar:

```sql
-- 1. Verificar colunas na tabela casos
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'casos'
  AND (column_name LIKE 'datajud%' 
       OR column_name = 'numero_processo'
       OR column_name = 'tribunal'
       OR column_name = 'classe_processual'
       OR column_name = 'assunto_principal'
       OR column_name = 'cached_at');

-- Resultado esperado: 10 colunas
```

```sql
-- 2. Verificar tabela datajud_processos
\dt public.datajud_processos;
-- Ou:
SELECT * FROM information_schema.tables 
WHERE table_name = 'datajud_processos';

-- Resultado esperado: Table exists
```

```sql
-- 3. Verificar todas as tabelas DataJud
SELECT tablename FROM pg_tables 
WHERE tablename LIKE 'datajud%' OR tablename LIKE 'v_casos%'
ORDER BY tablename;

-- Resultado esperado:
-- datajud_api_calls
-- datajud_movimentacoes
-- datajud_processos
-- datajud_sync_jobs
-- v_casos_com_datajud
```

```sql
-- 4. Verificar RLS está habilitado
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename LIKE 'datajud%'
ORDER BY tablename;

-- Resultado esperado: rowsecurity = true para todas
```

```sql
-- 5. Verificar índices foram criados
SELECT indexname FROM pg_indexes
WHERE tablename LIKE 'datajud%' OR tablename = 'casos'
ORDER BY indexname;

-- Resultado esperado: ~15 índices
```

```sql
-- 6. Verificar view pode ser consultada
SELECT column_name FROM information_schema.columns
WHERE table_name = 'v_casos_com_datajud'
ORDER BY column_name;

-- Resultado esperado: 15+ colunas
```

---

## Próximas Etapas

Após migration ter sucesso ✅:

### 1. Deploy da Edge Function (5 min)
```bash
cd "C:\Users\alanp\OneDrive\Documentos\SDR-Juridico\Sdr juridico"
supabase functions deploy datajud-enhanced
```

### 2. Verificar Edge Function
```bash
supabase functions list | grep datajud
# Deve aparecer: datajud-enhanced (deployed)
```

### 3. Build Frontend (10 min)
```bash
npm run build
# Deve compilar sem erros (0 errors, 0 warnings)
```

### 4. Deploy para Produção (5 min)
```bash
git add .
git commit -m "feat: DataJud integration complete"
git push origin main
# Vercel fará deploy automático
```

---

## Tempo Total

| Etapa | Tempo |
|-------|-------|
| Executar Migration | 30-60s |
| Deploy Edge Function | 2-3 min |
| Build Frontend | 5-10 min |
| Deploy Vercel | 5-10 min |
| **TOTAL** | **13-26 min** |

---

## Suporte

**Erro?** Verifique:
1. ✅ Conectado à internet
2. ✅ Supabase está online (status.supabase.com)
3. ✅ Você é admin do projeto SDR Juridico
4. ✅ Migrations anteriores completaram (sem erros)

**Ainda com problema?** Envie:
- Erro completo (screenshot)
- Timestamp do erro
- Seu email do Supabase

