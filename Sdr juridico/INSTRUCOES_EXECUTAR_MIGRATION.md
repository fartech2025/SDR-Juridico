# Instruções para Executar a Migration DataJud

## Status Atual
✅ Migration SQL foi corrigida com todas as colunas necessárias
✅ Syntax PostgreSQL validado
⏳ Pronto para execução no Supabase

## Passos para Executar

### Opção 1: Supabase Dashboard (Recomendado para Teste)

1. Abra [https://app.supabase.com](https://app.supabase.com)
2. Selecione seu projeto SDR Jurídico
3. Navegue até **SQL Editor** (painel esquerdo)
4. Clique em **New Query** ou **+ New**
5. Cole o conteúdo do arquivo:
   ```
   supabase/migrations/20260131_datajud_casos_integration.sql
   ```
6. Clique em **Run** (botão azul inferior direito)
7. Aguarde a conclusão

### Opção 2: Supabase CLI (Recomendado para Produção)

```bash
# 1. Faça login no Supabase
supabase login

# 2. Execute a migration
supabase db push

# 3. Verifique se foi criado
supabase db tables list | grep datajud
```

### Opção 3: PgAdmin (Se tiver acesso direto ao banco)

1. Abra o PgAdmin
2. Conecte ao banco PostgreSQL do Supabase
3. Abra uma nova Query Tool
4. Cole o conteúdo do arquivo SQL
5. Execute (F5)

## Verificação Pós-Execução

Execute estes comandos no SQL Editor do Supabase para verificar:

```sql
-- 1. Verificar que as colunas foram adicionadas à tabela casos
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'casos' 
  AND column_name LIKE 'datajud%' OR column_name = 'numero_processo';

-- 2. Verificar tabela datajud_processos
SELECT COUNT(*) FROM public.datajud_processos;

-- 3. Verificar tabela datajud_movimentacoes
SELECT COUNT(*) FROM public.datajud_movimentacoes;

-- 4. Verificar tabela datajud_api_calls
SELECT COUNT(*) FROM public.datajud_api_calls;

-- 5. Verificar tabela datajud_sync_jobs
SELECT COUNT(*) FROM public.datajud_sync_jobs;

-- 6. Verificar view
SELECT * FROM public.v_casos_com_datajud LIMIT 1;

-- 7. Verificar RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, qual
FROM pg_policies
WHERE tablename IN ('datajud_processos', 'datajud_movimentacoes', 'datajud_api_calls');
```

## Correções Aplicadas na Migration

### Problema #1: Coluna cached_at faltando
- **Causa**: Não foi adicionada na PARTE 1 ALTER TABLE
- **Solução**: Adicionada coluna `cached_at TIMESTAMPTZ`

### Problema #2: Coluna assunto_principal faltando
- **Causa**: Referenciada na VIEW mas não criada
- **Solução**: Adicionada coluna `assunto_principal TEXT`

### Problema #3: Syntax PostgreSQL
- **Causa**: Constraint inline em ALTER TABLE com múltiplas colunas
- **Solução**: Separadas em ALTER statements individuais

## Próximas Etapas

Após a migration executar com sucesso (sem erros):

1. **Configurar Secrets do Supabase**
   ```bash
   supabase secrets set DATAJUD_API_KEY=<sua-chave-de-api>
   supabase secrets set DATAJUD_RATE_LIMIT_PER_HOUR=100
   ```

2. **Deploy da Edge Function**
   ```bash
   supabase functions deploy datajud-enhanced
   ```

3. **Build do Frontend**
   ```bash
   npm run build
   ```

4. **Deploy para Vercel**
   ```bash
   git add .
   git commit -m "feat: DataJud integration complete"
   git push origin main
   ```

## Troubleshooting

### Erro: "relation datajud_processos already exists"
- **Causa**: Tabela já existe de execução anterior
- **Solução**: Código usa `IF NOT EXISTS`, então é seguro executar novamente

### Erro: "column datajud_xxx does not exist"
- **Causa**: Migration foi interrompida no meio
- **Solução**: Execute novamente - as colunas serão adicionadas pelas cláusulas `IF NOT EXISTS`

### Erro: "ERROR 42703: column xxx does not exist"
- **Causa**: Ordem de execução errada
- **Solução**: O arquivo foi reestruturado para adicionar colunas antes de usar

### Erro de RLS policies
- **Causa**: Funções `is_org_member()` ou `is_org_admin_for_org()` não existem
- **Solução**: Estas funções devem estar em outro arquivo de migration anterior

## Tempo Estimado
⏱️ **5-10 minutos** para execução completa

## Suporte
Se encontrar problemas, verifique:
1. Supabase está online (status.supabase.com)
2. Você tem permissão de admin no projeto
3. Database está ativa e acessível
4. Todas as migrations anteriores foram executadas

