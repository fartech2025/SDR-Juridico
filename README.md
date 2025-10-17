# Projeto ENEM

## Setup rápido

1. Instale as dependências do frontend:
   ```sh
   cd app
   npm install
   ```
2. Configure o arquivo `.env.local` em `app/` (veja exemplo em `app/README.md`).
3. Inicie o Supabase local (requer Docker):
   ```sh
   npx supabase@latest start
   ```
4. Rode o seed/reset do banco:
   ```sh
   npx supabase@latest db reset
   ```
5. Rode o frontend:
   ```sh
   cd app
   npm run dev
   ```

## Scripts úteis

- `npm run build` (em `app/`): build de produção
- `npm run preview` (em `app/`): preview local do build
- `npx supabase@latest db reset`: reseta e popula o banco local

Veja mais detalhes e dicas de deploy em `app/README.md`.
