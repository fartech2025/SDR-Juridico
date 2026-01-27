# 🚀 Guia de Conexão com Supabase

## Passo 1: Criar/Acessar Projeto no Supabase

1. Acesse [https://supabase.com](https://supabase.com)
2. Faça login ou crie uma conta
3. Clique em **"New Project"** ou selecione um projeto existente
4. Preencha os dados:
   - **Name**: SDR Juridico (ou nome de sua preferência)
   - **Database Password**: Crie uma senha forte (guarde-a!)
   - **Region**: Escolha a mais próxima (ex: South America - São Paulo)
   - **Pricing Plan**: Free (suficiente para começar)
5. Clique em **"Create new project"**
6. Aguarde 1-2 minutos até o projeto estar pronto

## Passo 2: Obter as Credenciais

1. No painel do Supabase, clique em **⚙️ Settings** (menu lateral esquerdo)
2. Clique em **API** no submenu
3. Você verá duas informações importantes:

   **📋 Project URL**
   ```
   https://seu-projeto-id.supabase.co
   ```
   
   **🔑 anon/public key**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFz...
   ```

4. **COPIE ESSES DOIS VALORES** - você precisará deles!

## Passo 3: Executar o SQL no Supabase

1. No painel do Supabase, clique em **🗂️ SQL Editor** (menu lateral)
2. Clique em **"New query"**
3. Abra o arquivo `supabase/migrations/00_create_all_tables.sql`
4. **Copie TODO o conteúdo** do arquivo
5. **Cole no SQL Editor** do Supabase
6. Clique em **"Run"** (ou pressione Ctrl+Enter / Cmd+Enter)
7. Aguarde a execução (pode levar alguns segundos)
8. ✅ Você verá "Success. No rows returned" ou similar

### ⚠️ Se houver erro:

- Verifique se não há caracteres especiais corrompidos
- Execute novamente (o SQL usa `IF NOT EXISTS` então é seguro)
- Se persistir, copie e execute em blocos menores

## Passo 4: Verificar Tabelas Criadas

1. No menu lateral, clique em **📊 Table Editor**
2. Você deve ver 8 tabelas:
   - ✅ usuarios
   - ✅ leads
   - ✅ clientes
   - ✅ casos
   - ✅ documentos
   - ✅ agenda
   - ✅ timeline_events
   - ✅ notificacoes

## Passo 5: Configurar Variáveis de Ambiente

1. Na raiz do projeto **Sdr juridico**, crie o arquivo `.env`
2. Cole as credenciais que você copiou:

```env
VITE_SUPABASE_URL=https://seu-projeto-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFz...
```

3. **IMPORTANTE**: Substitua pelos valores reais do seu projeto!

## Passo 6: Testar a Conexão

1. No terminal, dentro da pasta `Sdr juridico`:
   ```bash
   npm run dev
   ```

2. Abra o navegador em `http://localhost:5174`

3. Abra o **DevTools Console** (F12)

4. Você NÃO deve mais ver:
   - ❌ "Supabase não configurado"
   - ❌ "Supabase credentials not configured"

5. Teste criar um novo usuário ou fazer login

## Passo 7: Criar Primeiro Usuário

### Opção A: Via Interface (Recomendado)
1. Acesse a página de login da aplicação
2. Clique em "Criar conta"
3. Preencha email e senha
4. O Supabase enviará um email de confirmação
5. Clique no link para confirmar

### Opção B: Via SQL (Para testes)
1. No SQL Editor do Supabase, execute:

```sql
-- Inserir usuário de teste
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'teste@exemplo.com',
  crypt('senha123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
);
```

## ✅ Checklist de Validação

- [ ] Projeto Supabase criado
- [ ] 8 tabelas criadas no banco
- [ ] Credenciais copiadas (URL + ANON_KEY)
- [ ] Arquivo `.env` criado com credenciais
- [ ] Servidor local rodando (`npm run dev`)
- [ ] Console sem erros de Supabase
- [ ] Consegui criar/fazer login com usuário

## 🔧 Solução de Problemas

### Erro: "Invalid API key"
- Verifique se copiou a **anon/public key** (não a service_role)
- Confirme que não há espaços extras no `.env`

### Erro: "Failed to fetch"
- Verifique a URL (deve terminar com `.supabase.co`)
- Confirme que o projeto está ativo no Supabase

### Tabelas não aparecem
- Execute o SQL novamente
- Verifique se está no schema **public** (não auth ou storage)

### Auth não funciona
- Confirme que RLS está habilitado nas tabelas
- Verifique se as policies foram criadas
- No Supabase Dashboard → Authentication → Settings:
  - **Enable email confirmation**: OFF (para testes)
  - **Enable phone confirmations**: OFF

## 📚 Próximos Passos

Após conectar com sucesso:

1. **Desabilitar proteção de rotas**: Já feito ✅
2. **Popular com dados de teste**: Inserir leads/clientes via interface
3. **Testar operações CRUD**: Criar, editar, deletar registros
4. **Habilitar autenticação**: Quando estiver pronto
5. **Configurar emails**: Supabase Auth com SMTP customizado

## 🆘 Precisa de Ajuda?

Me informe em qual passo você está e qual erro está encontrando!
