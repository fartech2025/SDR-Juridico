## Configurando Acesso Supabase

Guia rápido para apontar o frontend React (Vite) ao seu banco Supabase (local ou remoto).

### 1) Onde achar URL e anon key
- Supabase remoto (dashboard):
  - Acesse seu projeto → Settings → API.
  - Copie “Project URL” e “anon public key”.
- Supabase local (CLI):
  - Inicie com `start_enem_services.bat` (ou `npx supabase@latest start`).
  - O terminal mostra “API URL” e “anon key”.
  - Alternativa: `npx supabase@latest status --output env` para imprimir valores.

### 2) Definir variáveis no Vite (React)
- Desenvolvimento local: arquivo `app/.env.local`
```
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<cole_a_sua_anon_key>
```
*(Somente para ambiente local quando a instância Supabase CLI estiver rodando. Não use esse host em produção.)*
- Produção (build apontando para projeto remoto): arquivo `app/.env.production`
```
VITE_SUPABASE_URL=https://<SEU-PROJECT-REF>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key_do_dashboard>
```
Observação: variáveis do Vite precisam começar com `VITE_` para serem expostas ao frontend.

> **Dica:** defina também `VITE_LOCAL_DB_HOST`, `VITE_LOCAL_DB_PORT`, `VITE_LOCAL_DB_NAME` e `VITE_LOCAL_DB_USER` para sincronizar os comandos de backup/diagnóstico do Database Inspetor com o seu ambiente local.

### 3) Reiniciar o servidor de desenvolvimento
- Após alterar `.env.local`, reinicie o Vite:
  - `cd app && npm run dev`, ou use `start_enem_services.bat`.

### 4) Cliente Supabase no código
- O cliente já está configurado em `app/src/lib/supabaseClient.ts` e lê as variáveis:
```ts
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL as string
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY as string
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```
- Uso típico:
```ts
const { data, error } = await supabase.from('sua_tabela').select('*')
```

### 5) Banco local pronto para uso
- Aplique seu schema/dados locais antes de testar:
  - `reset_enem_db.bat` (ou `npx supabase@latest db reset`) usa `supabase/seed.sql`.
- Garanta que suas políticas RLS permitem as operações desejadas (ou teste com RLS desabilitado em dev).

### 6) Scripts e tarefas úteis
- Scripts CMD:
  - `start_enem_services.bat` → inicia Vite.
  - `gen_types_enem.bat` → gera `app/src/lib/database.types.ts`.
- VS Code (Terminal > Executar Tarefa…):
  - `Types: Generate`, `Web: Dev`.

### 7) Problemas comuns
- Chaves erradas: 401/403 nas requisições → confira `.env.local`/`.env.production`.
- OneDrive pode atrasar hot reload; se necessário, mova o projeto para fora do OneDrive.
