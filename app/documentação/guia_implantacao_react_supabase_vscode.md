## Guia Completo de Implantação — ENEM React + Supabase + VS Code

Este documento concentra tudo o que foi configurado e testado aqui para que você (ou outra pessoa) replique o ambiente em qualquer máquina Windows.

### 1. Requisitos de ambiente
- **Windows 10/11** com acesso de administrador.
- **Node.js LTS** (inclui npm). Verifique com `node -v` e `npm -v`.
- **Docker Desktop** instalado **e executando** (ícone da “baleia” na bandeja → “Running”).
- **Git** opcional (para clonar versões futuras).
- **VS Code** + extensões recomendadas:
  - ESLint, Prettier, Error Lens, EditorConfig
  - Docker, GitLens, DotENV
  - Tailwind CSS IntelliSense
  - Debugger for Edge/Chrome (incluso nas versões atuais do VS Code)

### 2. Estrutura do projeto
```
Projeto ENEM/
├─ app/                     ← Frontend React (Vite + Tailwind + Supabase SDK)
├─ supabase/                ← Projeto local do Supabase (seed, config)
├─ documentação/            ← Guias de apoio
├─ setup_enem_workspace.bat ← Provisionamento completo (frontend + supabase)
├─ start_enem_services.bat  ← Inicia Supabase + Vite
├─ reset_enem_db.bat        ← Reseta banco local e aplica seed
├─ gen_types_enem.bat       ← Gera tipos TypeScript do schema
├─ teste_supabase_cli.bat   ← Health check automatizado Supabase local
└─ cadastro_de_usuarios.md  ← Guia para criar usuários no Supabase
```

### 3. Provisionamento inicial (uma vez)
1. **Garantir requisitos** (Docker aberto, Node disponível).
2. **Executar** `setup_enem_workspace.bat` (duplo-clique ou via CMD). Ele fará:
   - Criação/instalação do app React (`app/`).
   - Instalação de `@supabase/supabase-js`, `react-router-dom`, `recharts`, Tailwind.
   - Inicialização do Supabase local (`supabase/` + `.vscode/*`).
   - Copiar o seed customizado em `supabase/seed.sql`.
   - Criar configs de VS Code (`tasks.json`, `launch.json`).
   - Gerar `app/.env.local` e `app/src/lib/supabaseClient.ts`.

### 4. Scripts disponíveis
- `start_enem_services.bat` — inicia Supabase local e abre o Vite (frontend). Use quando vai trabalhar.
- `reset_enem_db.bat` — roda `npx supabase@latest db reset` aplicando `supabase/seed.sql` (schema + dados demo).
- `gen_types_enem.bat` — gera `app/src/lib/database.types.ts` via Supabase CLI (útil após alterar schema).
- `teste_supabase_cli.bat` — teste automatizado: sobe Supabase, aguarda, executa health check no REST e exibe resultado.

### 5. Configuração de produção
O projeto está configurado para usar apenas o Supabase Cloud remoto:
- URL do projeto: `https://mskvucuaarutehslvhsp.supabase.co`
- As variáveis estão no arquivo `.env` da aplicação

### 6. Seed: dados de exemplo
- O banco remoto já possui dados de teste carregados
  - Tabelas base (`usuarios`, `temas`, `questoes`, `respostas_usuarios`, `resultados_*`, `solucoes_questoes`).
  - Funções/trigger para manter agregados.
  - Views materializadas (`vw_resultados_calculados`, etc.).
  - Seeds de temas/questões/soluções para testes.
  - RLS desabilitado (facilita dev). Ative manualmente se necessário.
- Para reaplicar do zero, use `reset_enem_db.bat`.

### 7. Variáveis de ambiente do frontend
- `app/.env.local` agora vem com placeholders para o Supabase hospedado. Preencha com seu `Project URL` e a `anon key` do dashboard.
  ```env
  VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
  VITE_SUPABASE_ANON_KEY=<anon key>
  ```
- Para build remoto (`npm run build`), use valores equivalentes em `app/.env.production`.
- Configure sempre as variáveis de ambiente do arquivo `.env` para apontar para o projeto remoto no Supabase Cloud.

### 8. Rodando a aplicação

1. Certifique-se de que as variáveis de ambiente estão corretas no arquivo `.env`.
2. Na pasta `app/`:
   ```cmd
   npm run dev
   ```
   A aplicação será iniciada automaticamente e você verá a URL de acesso no terminal.
3. Build de produção:
   ```cmd
   npm run build
   npm run preview
   ```
   Os arquivos de produção serão gerados na pasta `dist/` para deploy.

### 9. Funcionalidades do app
- Tela de Login:
  - Utiliza `supabase.auth.signInWithPassword`. O usuário precisa existir em `Authentication > Users` com senha definida.
  - Botão “Esqueci minha senha” chama `supabase.auth.resetPasswordForEmail`; configure SMTP ou marque “Confirm user”.
  - Botão “Mostrar/Ocultar” para visualizar senha.
- Rotas (`react-router-dom`) protegidas por `ProtectedRoute` (só acessa se logado).
- Páginas:
  - `/questoes`: lista 5 questões, envia respostas para `respostas_usuarios` (trigger atualiza agregados).
  - `/resultado`: exibe gráfico (Recharts) baseado em `vw_resultados_calculados`.
  - `/solucionario`: consulta `solucoes_questoes`.
- Navbar inclui botão “Sair” (`supabase.auth.signOut`).

### 10. Usuarios / autenticação
- Leia `cadastro_de_usuarios.md` na raiz para opções de cadastro (Studio, CLI, Admin API, SMTP).
- Em dev, recomendo: Studio → Authentication → Users → add user → marcar “Confirm user” e definir senha.
- O login usa e-mail + senha; após login, todas as rotas são liberadas.

### 11. VS Code (tarefas e debug)
### 11. VS Code (tarefas úteis)
- Configure as tarefas do VS Code para comandos npm:
  - `Web: Dev` - inicia servidor de desenvolvimento  
  - `Types: Generate` - gera tipos TypeScript do Supabase
- `.vscode/launch.json`:
  - `Web: Debug (Edge)` (F5 inicia o Vite e abre o Edge conectado ao debugger).

### 12. Scripts auxiliares
### 12. Scripts auxiliares
- **gen_types_enem.bat** – atualiza as tipagens TypeScript a partir do schema do Supabase
- Use comandos npm para desenvolvimento (dev, build, test)

> **Nota:** O projeto está configurado para usar apenas o Supabase Cloud. Para mais informações, consulte `documentação/usando_supabase_cloud.md`.

### 13. Customizações comuns
- Alterar cor/tema (Tailwind): edite `tailwind.config.js` e `src/index.css`.
- Ajustar layout ou adicionar componentes: modifique `src/App.tsx` e demais arquivos em `src/`.
- Acrescentar novas tabelas/migrações:
  1. Atualize `supabase/seed.sql` ou crie migrações em `supabase/migrations/` (pasta pode ser criada).
  2. Rode `reset_enem_db.bat` para aplicar.
  3. Gere tipos com `gen_types_enem.bat` se usar o SDK com tipagem.

### 14. Solução de problemas
- **`Cannot resolve module` ou erros de import** → Verifique se o npm install foi executado.
- **Erro de autenticação** → Confirme se as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão corretas no .env.
- **Dados não carregam** → Verifique a conexão com o Supabase Cloud e se o usuário tem as permissões necessárias.

### 15. Replicando em outra máquina
1. Copie toda a pasta `Projeto ENEM/` para a nova máquina.
2. Instale os pré-requisitos (Node, Docker, VS Code).
3. Execute `setup_enem_workspace.bat` (revalida dependências).
4. Faça login no Docker Desktop e abra.
5. Rode `start_enem_services.bat` (ou CLI).
6. Ajuste usuários (Studio ou script) e utilize o app normalmente.

### 16. Usando a Supabase na nuvem
- O projeto está pronto para apontar para supabase.co. Consulte `documentação/usando_supabase_cloud.md` para:
  - Executar o script `supabase/seed.sql` no SQL Editor ou via CLI (`supabase link/db push`).
  - Criar usuários no Auth hospedado.
  - Configurar `.env.local` / `.env.production` com as chaves do dashboard.
- Após atualizar as variáveis, rode `npm run dev` e o app consumirá o backend remoto diretamente.

Com isso, qualquer máquina Windows consegue subir todo o ambiente ENEM (frontend + Supabase) totalmente integrado ao VS Code, com scripts para provisionar, testar e rodar o sistema.
