## Usando Supabase na Nuvem

Este guia orienta a migrar do ambiente local do Supabase CLI para um projeto hospedado em supabase.co.

### 1. Criar/identificar o projeto na nuvem
1. Acesse https://app.supabase.com e crie um novo projeto (ou use um existente).
2. Anote:
   - `Project URL` (termina com `.supabase.co`).
   - `anon public key` e `service_role key` (Settings → API).
   - Habilite o provider de e-mail em Authentication, se for usar login por senha/OTP.

### 2. Provisionar o schema na nuvem
Existem duas abordagens. Escolha uma:

**Opção A – Executar o script seed completo pelo SQL Editor**
1. Abra Settings → Database → SQL Editor.
2. Copie o conteúdo de `supabase/seed.sql` e execute.
   - O script cria tabelas, funções, triggers, views e dados de exemplo.
   - Se o build falhar por causa de partes opcionais, comente as seções correspondentes e reexecute.

**Opção B – Migrar com Supabase CLI (migrations)**
1. No terminal, na raiz do projeto, vincule o projeto remoto:
   ```
   supabase link --project-ref <seu-project-ref>
   ```
2. Gere uma migração contendo o schema (`supabase db diff -f init`) e ajuste o arquivo gerado.
3. Envie a migração:
   ```
   supabase db push --linked
   ```
4. (Opcional) Rode o seed na nuvem caso tenha separado os dados iniciais:
   ```
   supabase db seed --linked
   ```

### 3. Criar usuários no Auth hospedado
1. No Supabase Studio (Authentication → Users), clique em **Add user**.
2. Informe e-mail e senha, marque **Confirm user** (para pular e-mail de confirmação) ou configure o SMTP para reset.
3. Se desejar, sincronize o usuário com a tabela `public.usuarios` executando no SQL Editor:
   ```sql
   insert into public.usuarios (email, nome)
   values ('aluno@enem.com', 'Aluno ENEM')
   on conflict (email) do update set nome = excluded.nome;
   ```

### 4. Atualizar variáveis do frontend
1. Abra `app/.env.local` (desenvolvimento) e `app/.env.production` (build) e preencha com os dados do projeto remoto:
   ```env
   VITE_SUPABASE_URL=https://seu-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon key>
   ```
2. Reinicie o servidor Vite (`npm run dev`) para carregar variáveis novas.

### 5. Ajustar scripts locais
- Scripts como `start_enem_services.bat`, `reset_enem_db.bat` e `teste_supabase_cli.bat` são específicos para o Supabase local. Quando usar a nuvem, eles não são necessários.
- Você pode mantê-los para desenvolvimento offline ou removê-los da rotina diária.

### 6. Login e testes
1. Com o backend na nuvem e `.env` atualizado, rode o app (`npm run dev`).
2. Faça login com o usuário criado em Authentication → Users.
3. Se encontrar erro `Invalid login credentials`, verifique se o usuário está confirmado e se a senha confere.

### 7. Deploy do frontend
- Para build apontando para a nuvem: ajuste `app/.env.production` → `npm run build` → hospede o conteúdo de `dist/`.
- Se for usar Vercel/Netlify, configure variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no painel da plataforma.

### 8. Segurança
- Nunca exponha a `service_role key` no frontend. Use-a apenas em servidores seguros, scripts administrativos ou pipelines protegidos.
- Revise as políticas de RLS antes de publicar; o seed desativa RLS por padrão. Ative e configure conforme a necessidade em produção.

Com isso, o aplicativo React passa a consumir diretamente o Supabase na nuvem, sem depender dos containers locais.

