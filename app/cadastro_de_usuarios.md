## Cadastro de Usuários

Passo a passo para registrar contas que podem usar o ENEM App (login por e-mail / OTP do Supabase).

### 1. Pré‑requisitos comuns
- Projeto Supabase já criado (local ou hospedado).
- `anon key` configurada no frontend (`app/.env.local` ou `.env.production`).
- Para login por link mágico (OTP), um servidor SMTP funcionando; caso contrário, use criação manual + senha.

### 2. Ambiente hospedado (supabase.co)
1. Acesse o Supabase Studio → **Authentication** → **Providers**.
2. Em **Email**, habilite "Magic Link"/"Email OTP" e informe os dados do SMTP (ex.: SendGrid, Mailtrap, Gmail com app password).
3. Vá em **Authentication** → **Users** → **Add user**.
   - Preencha o e-mail do aluno.
   - Marque **Confirm user** se quiser dispensar o clique no link de confirmação.
   - Opcional: defina uma senha para usar com `signInWithPassword`.
4. Salve. O usuário recebe o e-mail com link de acesso (caso o SMTP esteja ativo) ou já aparece como confirmado se você marcou "Confirm user".

### 3. Configuração Remota no Supabase Cloud
Utilize sempre o ambiente remoto para desenvolvimento e produção:

**Para criar usuários via Studio**
1. Acesse o Supabase Studio no painel do projeto em [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. Vá para **Authentication** → **Users** → **Add user**.
3. Informe o e-mail.
4. Marque **Confirm user** para evitar dependência de e-mail.
5. Se quiser login por senha, preencha "Password" e depois ajuste o frontend para usar `signInWithPassword`.

**Para criar via API**
1. Crie um script Node/TS com `@supabase/supabase-js`.
2. Instancie o cliente com a `service_role key` (somente em backend seguro) e rode:
   ```ts
   supabase.auth.admin.createUser({
     email: 'aluno@exemplo.com',
     email_confirm: true,
     password: 'senhaOpcional'
   })
   ```
3. Execute o script sempre que precisar cadastrar novos e-mails.

### 4. Configuração SMTP no Supabase Cloud
Para funcionalidade completa de e-mail:
- Configure SMTP nas configurações do projeto no Supabase Dashboard
- Defina o provedor de e-mail (SendGrid, Resend, etc.)
- Configure as credenciais de envio apropriadas
- Teste o envio de e-mails de autenticação

### 5. Ajustes no frontend
- Tela de login (`src/App.tsx`) usa `signInWithOtp` (link mágico) por padrão.
- Para autenticação com senha:
  ```ts
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  ```
- Garanta que as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estejam corretas no arquivo `.env`.

### 5. Testando
1. Rode o app: `npm run dev` (ou `npm run preview` após build).
2. Digite o e-mail cadastrado.
3. Se estiver com link mágico, verifique a caixa de entrada; caso tenha confirmado manualmente, o login deve funcionar imediatamente.
4. Consulte o painel Supabase em **Users** para ver status das sessões e tokens.

### 6. Segurança
- Nunca exponha a `service_role key` no frontend.
- Se o app for público, mantenha RLS ativo e políticas bem definidas nas tabelas (`questoes`, `respostas_usuarios`, `vw_resultados_calculados`, `solucoes_questoes`).
- Para turmas grandes, automatize a criação de usuários via script ou automação (API Admin + planilha CSV).

