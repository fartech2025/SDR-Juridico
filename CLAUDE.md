# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All frontend commands run from inside `Sdr juridico/`:

```bash
npm run dev          # Start Vite dev server (localhost:5173)
npm run build        # Type-check + bundle (tsc -b && vite build)
npm run lint         # ESLint
npm run test         # Vitest (watch mode)
npm run test:run     # Vitest (single run)
```

Scraper server (iniciado automaticamente pelo Vite dev server — NÃO iniciar manualmente):

```bash
# O plugin scraperServerPlugin em vite.config.ts spawna o processo automaticamente
# ao rodar npm run dev. Primeira vez: instalar deps antes:
cd scraper-server && npm install
```

DOU scripts (run from `Sdr juridico/`):

```bash
npm run dou:sync     # Sync today's DOU publications
npm run dou:history  # Backfill historical DOU
```

Deploy edge functions:

```bash
npm run deploy:functions   # Runs PowerShell script
```

## Architecture

### Directory layout (app code lives in `Sdr juridico/src/`)

```
src/
├── app/router.tsx          # All routes — lazy-loaded pages with React.lazy + Suspense
├── contexts/               # AuthContext, OrganizationContext, PermissionsContext
├── features/dou/           # DOU feature module — import from barrel index.ts
├── components/             # Shared UI; CaseIntelligence/ for Waze Jurídico panel
├── pages/                  # One file per route; fartech/ = super-admin pages
├── services/               # API clients and business logic
├── hooks/                  # useAuth, useLeads, useCasos, useClientes, etc.
├── lib/
│   ├── supabaseClient.ts   # Supabase client + all Row type exports (source of truth)
│   └── mappers.ts          # DB Row → Domain object converters
└── types/
    ├── domain.ts           # Application-facing types (Lead, Caso, Cliente, …)
    └── database.types.ts   # Auto-generated from Supabase schema — do not edit
```

### Data flow

Component → hook (e.g. `useLeads`) → service (e.g. `leadsService.getAll`) → Supabase → mapper → typed domain object back to component. Hooks own loading/error state; services are plain async functions.

### Multi-tenancy

Every table has `org_id`. RLS policies enforce org-level isolation using `is_org_member()` and `is_org_admin_for_org()` Postgres functions. Every Supabase query must scope by `org_id` — RLS blocks anything without a valid org claim.

Roles: `fartech_admin` (super-admin) > `org_admin` > `user`. Stored in Supabase Auth user metadata; checked in `PermissionsContext` and route guards (`FartechGuard`, `OrgAdminGuard`, `OrgActiveGuard`).

### Supabase

- Client initialized in `src/lib/supabaseClient.ts` — always import from here, not from a `services/supabaseClient.ts` duplicate.
- Typed with `Database` from `types/database.types.ts`.
- Row types (`ClienteRow`, `CasoRow`, etc.) are exported from `lib/supabaseClient.ts`.
- Edge functions live in `supabase/functions/` (Deno runtime). Deployed with `supabase functions deploy`.
- DB schema source of truth: SQL migration files in `supabase/migrations/`. TypeScript types may lag behind — always verify column names against migrations before writing queries.

### DataJud (two services — do not mix them)

| Service | Used by | Returns |
|---|---|---|
| `datajudService.ts` (direct Elasticsearch) | `DataJudPage` | `ProcessoDataJud` |
| `datajudCaseService.ts` (edge function wrapper) | Case detail, sync hooks | `DataJudProcesso` |

DB schema for `datajud_processos`: `id, numero_processo, tribunal, grau, classe_processual, assunto, raw_response, cached_at, org_id` — no `caso_id` or `payload` columns.
DB schema for `datajud_movimentacoes`: `datajud_processo_id` (not `processo_id`), `nome` (not `descricao`), `data_hora` (not `data_movimentacao`).
Link between case and process: `casos.datajud_processo_id → datajud_processos.id`.

### DOU feature

Import from `src/features/dou/index.ts` barrel only. Old components in `src/components/CasoDetail/` re-export from there — do not add new duplicates.

### Waze Jurídico / Case Intelligence

- Scraper server on `localhost:3001` — iniciado automaticamente pelo plugin `scraperServerPlugin` em `vite.config.ts` quando `npm run dev` é executado. `localScraperService.ts` calls `/scraper-api` (proxied by Vite).
- `caseIntelligenceService.ts` orchestrates all sources (DataJud, scraper, Querido Diário, Portal Transparência, internal cases) and calls Claude via the scraper-server proxy (`POST /scraper-api/claude` → `localhost:3001/claude` → `api.anthropic.com`). API key lives in `scraper-server/.env`, never in the frontend bundle.
- Results cached in `localStorage` with 24h TTL.
- Entry points: `DataJudPage` (after CPF search) and `ClienteDrawer` (PF clients with `cpf` field).

### PJe Import (Sincronizar processos)

- Entry point: **Configurações → Avançado → PJe / MNI** — botão "Sincronizar processos" aparece quando `statusMNI === 'ativo'`.
- `PjeConfigCard.tsx` abre `ImportarProcessosPJeModal` (4 estados: `carregando → selecao → importando → concluido`).
- `ImportarProcessosPJeModal.tsx` chama `listarProcessosAdvogado()` (até 2 min, 28 tribunais), pré-marca os não-existentes, exibe tabela com checkboxes + filtro por tribunal.
- `pjeImportService.ts` — `importarProcessosSelecionados(processos, orgId)`:
  1. Lê `casos.numero_processo` existentes para filtrar duplicatas
  2. Upsert em `datajud_processos` (ON CONFLICT `numero_processo`)
  3. Bulk insert em `casos` com `status='triagem'`, `prioridade='media'`
  4. `derivarArea(classe)` mapeia classe processual → área jurídica (`trabalhista | criminal | tributario | previdenciario | familia | civel`)

### PJe 2FA / OTP relay

- Fluxo: `POST /configurar/mni` detecta página Keycloak de TOTP (HTML contém `name="totp"`) → retorna `{ aguardando_otp: true, session_id }`.
- Sessão pendente armazenada em Map na memória do scraper-server com TTL de 5 min (`PendingOtpSession` em `index.ts`).
- `POST /configurar/mni/otp` recebe `{ session_id, codigo }` → chama `completarLoginComOtp()` em `pje-painel.ts` → finaliza o fluxo OAuth2 com `totp + credentialId` hidden field → salva credenciais em `.env`.
- `credentialId`: campo hidden obrigatório do formulário Keycloak TOTP; extraído via regex da página OTP antes de armazenar a sessão.
- Frontend (`PjeConfigCard.tsx`): detecta `aguardando_otp` na resposta, muda `etapa` para `'otp'`, exibe input de 6 dígitos, chama `submeterOTP(sessionId, codigo)`.

### eProc scraper

- Scraper: `scraper-server/scrapers/eproc.ts`
- Auth: PHP form (`frmUsuario` + `frmSenha`) — independente do PJe/Keycloak. Credenciais separadas `EPROC_CPF`/`EPROC_SENHA` em `scraper-server/.env`; fallback para `MNI_CPF`/`MNI_SENHA`.
- Instâncias cobertas: TJMG 1G (`eproc1g.tjmg.jus.br`), TJMG 2G (`eproc2g.tjmg.jus.br`), TRF4 (`eproc.trf4.jus.br`), TRF5 (`eproc.trf5.jus.br`).
- `buscarProcessosEproc(cpf, senha)`: roda todas as instâncias em paralelo, deduplica por número CNJ.
- Endpoint de configuração: `POST /configurar/eproc` — testa login no TJMG 1G antes de salvar.
- UI: `EprocConfigCard.tsx` (mesma estrutura do `PjeConfigCard`, sem etapa 2FA).

### Scraper server endpoints (v1.3.0)

| Endpoint | Descrição |
|---|---|
| `GET /status` | Status + `eproc_configurado`, `eproc_instancias` |
| `POST /configurar/mni` | Configura PJe; pode retornar `aguardando_otp` |
| `POST /configurar/mni/otp` | Completa login 2FA com código TOTP |
| `POST /configurar/eproc` | Configura credenciais eProc separadas |
| `POST /advogado/processos` | Lista processos PJe + eProc + DataJud (deduplicados) |
| `POST /mni/processo` | Busca processo individual via MNI |
| `POST /cpf` | Busca processos por CPF |
| `POST /claude` | Proxy para Anthropic API |

### Vite proxy (dev)

```
/scraper-api  → http://localhost:3001
/api-datajud  → https://api-publica.datajud.cnj.jus.br
```

## Key conventions

- **Brand color**: `#721011` (dark red). Never use blue (`text-blue-*`, `bg-blue-*`). For icons use `style={{ color: '#721011' }}` — no Tailwind class maps to this exact value.
- **Standard card**: `bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm`
- **Standard label**: `text-xs uppercase tracking-wide text-gray-500`
- **Standard input focus ring**: `rgba(114, 16, 17, 0.2)`
- DB columns: snake_case Portuguese (`nome_completo`, `data_inicio`). Domain types: camelCase English. Mappers convert between them.
- Soft delete: `deleted_at` + `deleted_by` columns — never hard-delete records.
- Supabase JOINs (e.g. `responsavel:usuarios(nome_completo)`) require an actual FK in the schema.

## Environment variables

Defined in `Sdr juridico/.env` (not committed). Key vars:

Defined in `Sdr juridico/.env` (not committed). Key vars:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_DATAJUD_API_KEY=
VITE_PORTAL_TRANSPARENCIA_KEY= # Optional; activates CEIS/CEAF source
SUPABASE_SERVICE_ROLE_KEY=     # Local DOU scripts only — never expose in frontend
```

`scraper-server/.env` (not committed):

```env
ANTHROPIC_API_KEY=   # Proxy para api.anthropic.com — nunca exposto no frontend
MNI_CPF=             # CPF do advogado para autenticação PJe/MNI
MNI_SENHA=           # Senha PJe (Keycloak) — usada também como fallback para eProc
EPROC_CPF=           # CPF eProc — opcional; se vazio usa MNI_CPF
EPROC_SENHA=         # Senha eProc — opcional; se vazio usa MNI_SENHA
```
