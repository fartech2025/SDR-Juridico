# 🔧 INSTRUÇÕES PARA APLICAR CORREÇÕES CRÍTICAS

**Data:** 14/01/2026  
**Arquivo SQL:** `CORRECOES_CRITICAS.sql`

---

## 📋 O QUE SERÁ CORRIGIDO

Este script resolve **4 problemas críticos** identificados na análise:

1. ✅ **Recursão Infinita em RLS** → Criar funções helper `SECURITY DEFINER`
2. ✅ **Missing CASCADE Rules** → Adicionar `ON DELETE CASCADE/SET NULL` nas FKs
3. ✅ **Missing UNIQUE Constraint** → Garantir `profiles.user_id` seja único
4. ✅ **RLS Desabilitado** → Re-habilitar com policies sem recursão

---

## 🚀 COMO EXECUTAR

### **Opção 1: Via Supabase Dashboard (Recomendado)**

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto: **SDR Jurídico**
3. Vá em: **SQL Editor** (ícone de banco de dados)
4. Clique em **+ New Query**
5. Copie e cole TODO o conteúdo de `CORRECOES_CRITICAS.sql`
6. Clique em **RUN** (ou pressione Cmd+Enter)
7. Aguarde a execução completa (~10 segundos)

✅ **Resultado Esperado:**
```
✅ Todas as funções foram criadas com sucesso!
✅ RLS habilitado em profiles!
✅ 3 policies criadas em profiles!

+---------------------+
| 🎯 CORREÇÕES APLICADAS |
+---------------------+
```

---

### **Opção 2: Via CLI do Supabase**

```bash
# 1. Certifique-se que Supabase está rodando
npx supabase status

# 2. Execute o script
npx supabase db reset --db-url "postgresql://postgres:postgres@localhost:54322/postgres" < CORRECOES_CRITICAS.sql

# OU execute direto via psql
psql "postgresql://postgres:postgres@localhost:54322/postgres" -f CORRECOES_CRITICAS.sql
```

---

### **Opção 3: Via Migration (Para Produção)**

```bash
# 1. Criar nova migration
npx supabase migration new correcoes_criticas

# 2. Copiar conteúdo de CORRECOES_CRITICAS.sql para o arquivo criado
# 3. Aplicar migration
npx supabase db push
```

---

## ✅ VALIDAÇÃO PÓS-EXECUÇÃO

Execute estas queries para confirmar que tudo funcionou:

### 1. Verificar Funções Criadas
```sql
SELECT proname, prosecdef
FROM pg_proc
WHERE proname IN ('is_fartech_admin', 'get_user_org_id', 'is_org_admin');
```

**Esperado:** 3 linhas com `prosecdef = true`

---

### 2. Verificar RLS Habilitado
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'profiles';
```

**Esperado:** `rowsecurity = true`

---

### 3. Verificar Policies Sem Recursão
```sql
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles';
```

**Esperado:** 3 policies
- `fartech_admin_all_profiles`
- `org_admin_own_org_profiles`
- `users_own_profile`

---

### 4. Verificar CASCADE Rules
```sql
SELECT
  tc.table_name,
  kcu.column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'org_id';
```

**Esperado:**
- `profiles.org_id` → `SET NULL`
- `leads.org_id` → `CASCADE`
- `clientes.org_id` → `CASCADE`
- `casos.org_id` → `CASCADE`
- `documentos.org_id` → `CASCADE`

---

## 🧪 TESTES FUNCIONAIS

Após executar, teste o sistema:

### Teste 1: Login como Fartech Admin
```sql
-- Criar usuário Fartech Admin de teste (se não existir)
INSERT INTO profiles (user_id, email, nome, is_fartech_admin, role)
VALUES (
  gen_random_uuid(),
  'admin@fartech.com.br',
  'Admin Fartech',
  true,
  'admin'
);
```

Faça login e verifique se consegue ver **todos os profiles**.

---

### Teste 2: Login como Org Admin
```sql
-- Criar usuário Org Admin de teste
INSERT INTO profiles (user_id, email, nome, org_id, role)
VALUES (
  gen_random_uuid(),
  'admin@escritorio1.com',
  'Admin Escritório 1',
  (SELECT id FROM orgs WHERE nome = 'Escritório Teste'),
  'org_admin'
);
```

Faça login e verifique se consegue ver **apenas profiles da sua org**.

---

### Teste 3: Login como Usuário Normal
```sql
-- Criar usuário normal de teste
INSERT INTO profiles (user_id, email, nome, org_id, role)
VALUES (
  gen_random_uuid(),
  'user@escritorio1.com',
  'Usuário Normal',
  (SELECT id FROM orgs WHERE nome = 'Escritório Teste'),
  'user'
);
```

Faça login e verifique se consegue ver **apenas seu próprio profile**.

---

### Teste 4: Deletar Organização
```sql
-- Criar org de teste
INSERT INTO orgs (id, nome, cnpj) 
VALUES (gen_random_uuid(), 'Org Teste Delete', '12345678000199');

-- Associar profile
INSERT INTO profiles (user_id, email, nome, org_id, role)
VALUES (
  gen_random_uuid(),
  'test@delete.com',
  'Teste Delete',
  (SELECT id FROM orgs WHERE nome = 'Org Teste Delete'),
  'user'
);

-- DELETAR A ORG
DELETE FROM orgs WHERE nome = 'Org Teste Delete';

-- VERIFICAR: profiles.org_id deve ser NULL (não erro!)
SELECT * FROM profiles WHERE email = 'test@delete.com';
```

**Esperado:** `org_id = NULL` (não deve dar erro de FK violation)

---

## ⚠️ TROUBLESHOOTING

### Erro: "Função já existe"
```sql
-- Solução: Forçar recriação
DROP FUNCTION IF EXISTS is_fartech_admin() CASCADE;
DROP FUNCTION IF EXISTS get_user_org_id() CASCADE;
DROP FUNCTION IF EXISTS is_org_admin() CASCADE;
-- Depois execute o script novamente
```

---

### Erro: "Constraint já existe"
```sql
-- Solução: Remover constraints antigas
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_org_id_fkey;
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_org_id_fkey;
-- Continue para cada tabela...
-- Depois execute o script novamente
```

---

### Erro: "RLS já está habilitado"
Isso é esperado! O script usa `ENABLE ROW LEVEL SECURITY` que é idempotente.

---

### Erro: "Policy já existe"
```sql
-- Solução: Remover policies antigas
DROP POLICY IF EXISTS "fartech_admin_all_profiles" ON profiles;
-- Depois execute o script novamente
```

---

## 📊 MONITORAMENTO

Após aplicar as correções, monitore:

1. **Performance de Queries**:
   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM profiles WHERE org_id = 'xxx';
   ```

2. **Uso de Funções**:
   ```sql
   SELECT * FROM pg_stat_user_functions
   WHERE funcname IN ('is_fartech_admin', 'get_user_org_id', 'is_org_admin');
   ```

3. **Logs de Erro**:
   - Supabase Dashboard → Logs → Postgres Logs
   - Procure por: "permission denied", "infinite recursion", "constraint violation"

---

## 🎯 PRÓXIMOS PASSOS

Após aplicar com sucesso:

1. ✅ **Commit das Alterações**
   ```bash
   git add CORRECOES_CRITICAS.sql INSTRUCOES_CORRECOES.md
   git commit -m "feat: resolve recursão RLS e adiciona CASCADE rules"
   git push
   ```

2. ✅ **Atualizar Documentação**
   - Marcar como resolvido em `ANALISE_BANCO_DADOS.md`
   - Atualizar `STATUS_FASE_2_COMPLETA.md`

3. ✅ **Testar Frontend**
   - Login como diferentes tipos de usuário
   - Verificar filtros de org_id
   - Testar CRUD de leads/clientes/casos

4. ⏳ **Aplicar Correções de Média Prioridade**
   - Consolidar policies em arquivo único
   - Remover migrations conflitantes
   - Padronizar nomenclatura

---

## 📞 SUPORTE

Em caso de dúvida:
- Revisar: `ANALISE_BANCO_DADOS.md`
- Consultar: Documentação Supabase RLS
- Testar em: Ambiente local primeiro

---

✅ **Status:** Pronto para execução  
🔗 **Repositório:** fartech2025/SDR-Juridico  
👤 **Responsável:** Equipe Fartech
