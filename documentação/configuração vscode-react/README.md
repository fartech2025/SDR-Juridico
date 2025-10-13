# Integração VS Code: React (Vite) + Supabase — ENEM

Este guia explica como o workspace foi configurado para editar, rodar e depurar o frontend React e o backend local do Supabase no VS Code, e como usar o script `setup_enem_workspace.bat` para automatizar tudo.

## Pré‑requisitos
- Node.js LTS instalado e no PATH.
- Docker Desktop (para `supabase start`).
- VS Code instalado.

Observação: O script usa `npx supabase@latest` (não exige instalação global do CLI). Em ambientes restritos de rede, garanta acesso à internet para baixar dependências.

## O que o script faz
Arquivo: `setup_enem_workspace.bat`
- Cria o app React (Vite + TypeScript) em `app/` se não existir.
- Instala dependências do frontend e `@supabase/supabase-js`.
- Inicializa o projeto Supabase local em `supabase/` (via `npx supabase init`).
- Copia o seu SQL de seed se encontrado:
  - Preferência: `%USERPROFILE%\Downloads\Modulo_Inteligencia_Estudantil_ENEM_FINAL.sql`.
  - Alternativa: arquivo com o mesmo nome na raiz do workspace.
- Cria/atualiza as configurações do VS Code:
  - `.vscode/tasks.json`: tarefas para iniciar/encerrar o Supabase, resetar o DB, gerar tipos e rodar o Vite.
  - `.vscode/launch.json`: depuração no Edge apontando para `http://localhost:5173` com `preLaunchTask` para iniciar o Vite.
- Cria `app/.env.local` (com URL local do Supabase) e `app/src/lib/supabaseClient.ts`.
- Suporta flags opcionais:
  - `--start`     Inicia Supabase e Vite.
  - `--reset-db`  Executa `supabase db reset` (recria banco local e aplica `supabase/seed.sql`).
  - `--types`     Gera `app/src/lib/database.types.ts` a partir do schema local.

## Como usar
1) Dê um duplo‑clique em `setup_enem_workspace.bat` (CMD puro). Ele prepara tudo.
2) Para iniciar serviços e utilitários, use os scripts CMD puros incluídos:
   - `start_enem_services.bat` – inicia Supabase e o Vite.
   - `reset_enem_db.bat` – reseta o banco local e aplica `supabase/seed.sql`.
   - `gen_types_enem.bat` – gera `app/src/lib/database.types.ts` do schema local.
3) Abra o workspace no VS Code (Arquivo > Abrir Pasta...).
4) Tarefas disponíveis (Terminal > Executar Tarefa...):
   - `Supabase: Start` e `Supabase: Stop`
   - `DB: Reset + Seed`
   - `Types: Generate`
   - `Web: Dev`
5) Depuração: pressione F5 com a configuração "Web: Debug (Edge)".

## Variáveis do frontend
Arquivo: `app/.env.local`
- `VITE_SUPABASE_URL=http://localhost:54321`
- `VITE_SUPABASE_ANON_KEY=` (preencha após `supabase start`; a chave anon é exibida no terminal do CLI)

## Estrutura criada
- `app/` – Aplicação React (Vite + TS)
- `supabase/` – Projeto local do Supabase (config, migrações/seed)
- `.vscode/` – Tarefas (`tasks.json`) e depuração (`launch.json`)
- `setup_enem_workspace.bat` – Script de automação

## Comandos úteis (manual)
- Iniciar Supabase local: `npx supabase@latest start`
- Resetar banco e aplicar seed: `npx supabase@latest db reset`
- Gerar tipos TS: `npx supabase@latest gen types typescript --local > app/src/lib/database.types.ts`
- Rodar frontend: `cd app && npm run dev`

## Dicas e problemas comuns
- Docker desligado: `supabase start` falha; abra o Docker Desktop.
- Chaves incorretas no `.env.local`: confirme `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` após `supabase start`.
- OneDrive pode atrasar hot reload: se notar lentidão, considere mover o projeto fora do OneDrive ou ajustar exclusões.
