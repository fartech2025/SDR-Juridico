# 🏗️ ARQUITETURA CANÔNICA — SDR JURÍDICO

**Versão:** 3.0.1
**Data:** 3 de março de 2026
**Status:** ✅ Produção

---

## 📋 CHANGELOG RECENTE

### v3.0.1 (3 de março de 2026)
- ✅ **`AgendaPage` — botão "Gerar Google Meet" restaurado**: condição `formState.title &&` removida — botão sempre visível na seção Local. Fallback `formState.title || 'Reunião'` garante título válido mesmo sem título preenchido.
- ✅ **`AgendaPage` — auto-sync Google Calendar removido do `handleSave`**: a sincronização automática causava `alert()` bloqueante em todo save. Google Calendar agora é acionado apenas pelo botão manual "Gerar Google Meet".
- ✅ **`AgendaPage` — `alert()`/`window.confirm()` eliminados**: padrão proibido pela arquitetura canônica. Substituídos por:
  - `lunchFeedback` state: banner success/error inline auto-dismiss (3-4s) após "Bloquear Almoço"
  - `confirmingDelete` state: footer do modal muda para confirmação inline com "Cancelar" / "Confirmar exclusão"
- ✅ **`AgendaPage` — descrição do modal dinâmica**: `description` agora é `'Preencha os detalhes do novo compromisso.'` (create) ou `'Atualize os detalhes do compromisso.'` (edit).
- ✅ **`AgendaPage` — botão Excluir estilizado**: substituído `bg-red-600 text-white` por `border-red-200 bg-red-50 text-red-700` — botão destrutivo discreto, sem ação imediata. Ação real no footer de confirmação.
- ✅ **`AgendaPage` — emojis removidos**: erro Google Meet usava `⚠️ / 🚀 / ✨` → substituídos por ícone `AlertCircle` da Lucide.
- ✅ **Pipeline CI corrigido**: workflows antigos que apontavam para `app/` foram removidos e scripts atualizados para trabalhar com a pasta raiz `Sdr juridico/`. Apenas `ci.yml` e `deploy-vercel.yml` permanecem.
- ✅ **Dependências TipTap pré-instalação**: build falhava em Vite quando pacotes TipTap e html2pdf.js não estavam em `node_modules`; instrução adicionada para rodar `npm install` após pull.
- ✅ **Limpeza de tokens git**: instrução para remover credenciais erradas no Keychain (usuário `frpdias`) para evitar 403s durante push.

### v3.0.0 (3 de março de 2026)
- ✅ **Sidebar com cadeado (`AppShell.tsx`)**: tipo `NavItem` estendido com `locked?: boolean` e `minPlan?: string`. Itens bloqueados renderizam como `<button>` com `opacity-50`, ícone `<Lock>` no canto inferior direito do ícone principal, e clique redireciona para `/app/plano` (nunca navega para a rota bloqueada). Itens desbloqueados continuam como `<NavLink>`. Aplicado para Timesheet, Templates, Diário Oficial, Auditoria, Analytics e Financeiro. Menu mobile também trata itens locked com branch separado.
- ✅ **Grupo Governança sempre visível para `org_admin`**: removida condição `if (governancaItems.length > 0)`. Grupo sempre aparece com itens individualmente locked quando plano insuficiente.
- ✅ **Sidebar compactado**: itens reduzidos de `py-2.5` para `py-2`; labels de grupos de `py-2` para `py-1`; separadores de `my-4` para `my-2`. Total ~248px economizados — grupo Administração visível sem scroll em telas de 900px+.
- ✅ **`PlanPage` (`src/pages/PlanPage.tsx`)**: página nova em `/app/plano`. Layout canônico: header `rounded-3xl border-border bg-linear-to-br shadow-soft` (= UserProfilePage), Card do plano com descrição e CTA WhatsApp, Card de módulos com `divide-border` e badges coloridos por tier (Trial=cinza, Básico=azul, Profissional=roxo, Enterprise=vermelho). Não requer role especial — visível para todos.
- ✅ **Rota `/app/plano`**: adicionada em `router.tsx`. Entrada "Meu Plano" (ícone `CreditCard`) no grupo Administração do sidebar, sempre visível (sem feature gate).
- ✅ **Rotas faltantes adicionadas em `router.tsx`**: `/app/perfil` (`UserProfilePage`), `/app/org-settings` (`OrgSettings`), `/app/membros` (`UserManagement`), `/app/dou-logs` (`DOUSyncLogsPage`), `/admin/perfil` (`UserProfilePage`).
- ✅ **`orgAdminNavItems` corrigido**: links ajustados de `/org/settings` → `/app/org-settings` e `/org/users` → `/app/membros`.
- ✅ **Header offset dinâmico (`AppShell.tsx`)**: header usa `sidebarCollapsed ? 'lg:left-20' : 'lg:left-64'` em vez de `lg:left-64` hardcoded. Agora acompanha o estado do sidebar.

### v2.9.3 (3 de março de 2026)
- ✅ **Filtros persistentes via URL (`useSearchParams`) — `LeadsPage`**: substituídos 4 `useState` (`query`, `statusFilter`, `heatFilter`, `activeTab`) por `useSearchParams` com params `q`, `status`, `heat`, `tab`. Setters usam padrão funcional `setParams(p => { p.set(...); return p })` para preservar outros params. `resetFilters` usa `p.delete()`.
- ✅ **Filtros persistentes via URL — `CasosPage`**: params `q`, `area`, `status`. Adicionado `resetFilters` (ausente antes) e botão "Limpar filtros" visível quando algum filtro está ativo.
- ✅ **Filtros persistentes via URL — `ClientesPage`**: params `q`, `status`, `health`, `area`, `owner`. `resetFilters` atualizado para `p.delete()`.
- **Padrão de implementação**: `params.get('key') ?? 'valor_default'` para leitura; `setParams(p => { v ? p.set('k', v) : p.delete('k'); return p })` para escrita; nunca usar `setParams({})` puro pois apaga o param `?state` usado pelo `PageState`.

### v2.9.2 (3 de março de 2026)
- ✅ **`RolePicker` em `UserManagement.tsx`**: componente de seleção de papel substituiu o `<select>` em `InviteUserModal` e `EditUserModal`. Cards clicáveis (radio-style): nome + ícone Lucide + descrição curta. Card selecionado: `border: 2px solid #721011` + `background: rgba(114,16,17,0.06)`. Constantes `ORG_ROLE_DESCRIPTIONS` e `ORG_ROLE_ICONS` definidas localmente no arquivo (não em `enums.ts` — os 5 `OrgMemberRole` são diferentes dos `UserRole` canônicos).
- ✅ **Banner Timesheet → Financeiro (`TimesheetPage.tsx`)**: banner âmbar dismissível via `sessionStorage` (key `sdr_timesheet_fin_banner_dismissed`). Visível somente quando `!canUseFinanceiro`. Informa que "Faturar Período" requer o módulo Financeiro com link para Configurações.
- ✅ **Hint DOU (`DiarioOficialPage.tsx`)**: card informativo azul (`bg-blue-50 border-blue-100`) quando busca está vazia (`!publicacoes && !textoBusca && !cnpj && !numeroProcesso`). Cor azul é exceção ao padrão brand-red por ser dica neutra, não ação de marca.
- ✅ **Hint `TemplateGerarModal`**: aviso inline quando template tem variáveis de caso (`responsavel`, `advogado`, `nome_cliente`, `numero_processo`, `tribunal`) mas nenhum caso foi selecionado. Usa ícone `Info` da Lucide.

### v2.9.1 (1 de março de 2026)
- ✅ **`LeadDrawer` → Modal canônico**: convertido de `createPortal+<aside>` para `<Modal noPadding maxWidth="36rem">`. Layout interno: flex-column `(borderRadius:16, overflow:hidden, maxHeight:82vh)` com header/footer `flexShrink:0` e conteúdo `flex:1, minHeight:0, overflowY:auto`. Tabs com `borderBottom: '2px solid var(--brand-primary)'` inline. Footer: WhatsApp outline + Converter/Dossiê brand-primary inline style. Fix de cores: `frio` badge `text-blue-700` → `bg-sky-100 text-sky-700`; `em_andamento` task badge → `bg-amber-100 text-amber-700`.
- ✅ **`ClienteDrawer` → Modal canônico**: mesma conversão — `<Modal noPadding maxWidth="34rem">`. Removidos: `createPortal`, `Button` import, gradiente/SVG no header. Card style → `rounded-xl border border-gray-100 shadow-sm` (padrão canônico).
- ✅ **`OrgActiveGuard` — fix loop redirect**: removida dependência `useCurrentUser` (`onboardingVersion` não existe em `usuarios`). Guard agora lê `currentOrg.onboarding_version` (OrganizationContext). Adicionado check `isOrgAdmin` antes do redirect para `/app/onboarding` — não-admins entram direto. `!currentOrg` redireciona para `/login` (não `/no-organization`, rota inexistente).
- ✅ **Correções visuais — `Button` variant**: adicionado `variant="primary"` em todos os botões de ação principal que estavam omitindo o variant (AnalyticsPage: "Voltar para o dashboard", "Abrir módulo financeiro"; FinanceiroPage: "Novo Lançamento", "Adicionar", botão PDF).
- ✅ **Correções visuais — sem emojis**: removidos 📈/📉 da seção carteira por responsável em `FinanceiroPage` → substituídos por `Rec.` / `Desp.` em texto.
- ✅ **Correções visuais — sem blue**: `CATEGORIA_COLORS.contrato` em `DocumentoTemplatesPage` era `bg-blue-50 text-blue-700` → corrigido para `bg-violet-50 text-violet-700`.

### v2.9.0 (28 de fevereiro de 2026)
- ✅ **Onboarding Wizard** (`OnboardingPage.tsx`): 4 steps — Empresa → Equipe → Integrações → Pronto! Full-screen sem sidebar, animações de slide direcional, `Voltar` em todos os passos, OAuth inline no step 3; sem emojis — ícones Lucide com `style={{ color: '#721011' }}`
- ✅ **"O que há de novo" (`WhatsNewModal.tsx`)**: Modal canônico exibido no AppShell para orgs com `onboarding_version` desatualizada; somente `org_admin` persiste a versão no banco
- ✅ **`onboardingService.ts`**: `updateStep(orgId, step)`, `complete(orgId, version)` (tabela `orgs`), `completeUser(userId, version)` (tabela `usuarios`) — `completeUser` é o registro crítico que desbloqueia o guard
- ✅ **Rastreamento por usuário** (`usuarios.onboarding_version`): wizard é liberado por usuário (não só por org); `usuariosService` SELECT corrigido para incluir `onboarding_version` em ambas as queries
- ✅ **`useCurrentUser.reloadProfile()`**: incrementa `reloadKey` → dispara re-fetch do `useEffect` → evita loop de redirect após completar wizard; chamado antes de `navigate()`
- ✅ **`OrgActiveGuard` dentro do `AppShell`**: guard não vive mais no router; `AppShell` tem early return para `/app/onboarding` (full-screen sem sidebar) e envolve o layout principal com `<OrgActiveGuard>`
- ✅ **`TourModal.tsx`** — Central de Ajuda Contextual: ativado por `?tour=1` na URL; cobre 14 páginas; exporta `hasTour(pathname)` e `getTourForPath(pathname)`; fecha com ESC ou botão Entendido
- ✅ **Botão de ajuda no header** (`HelpCircle`): visível somente em páginas com tour disponível (`hasTour(pathname)`); adiciona `?tour=1` à URL sem reload
- ✅ **`src/lib/version.ts`**: `APP_VERSION = '2.9.0'` + `VERSION_HIGHLIGHTS` para o modal de novidades
- ✅ **Guard interno no `OnboardingPage`**: `if (!isOrgAdmin) return <Navigate to="/app/dashboard" replace />` — impede acesso direto por não-admins
- ✅ **Step 1 — Empresa**: `nome`, `cnpj` (mask), `oab`, `telefone`, `email`, `áreas de atuação` (chips — 8 opções)
- ✅ **Step 2 — Equipe**: `nome` + `email` + role (gestor/advogado/secretaria/leitura); convites reais via `supabase.functions.invoke('invite-org-member')`; `Promise.allSettled` para envio em paralelo com status por item
- ✅ **Step 3 — Integrações**: Google Calendar via OAuth real (`return_to=/app/onboarding`), Teams marcado "Em breve", detecta `?google_calendar=connected` ao retornar
- ✅ **Step 4 — Pronto!**: próximos passos como botões que chamam `completeUser()` + `reloadProfile()` + navegam com `?tour=1`
- ✅ **Fix UserManagement** (`roleToPermissoes`): `gestor` não recebe mais `['org_admin']` — apenas `admin` recebe; todos os outros roles → `['user']`
- ✅ **Migration `20260228010000_onboarding.sql`**: `ALTER TABLE orgs ADD COLUMN onboarding_version TEXT DEFAULT NULL, onboarding_step TEXT DEFAULT 'empresa'`
- ✅ **Migration `20260228030000_usuarios_onboarding.sql`**: `ALTER TABLE usuarios ADD COLUMN onboarding_version TEXT DEFAULT NULL`
- ✅ **Migration `20260228020000_org_branding.sql`**: `CREATE TABLE org_branding` com todas as colunas de branding
- ✅ **Migration `20260228_fix_watermark_column.sql`**: idempotente para bancos criados antes da v2.9.0
- ✅ **TipTap extras**: `@tiptap/extension-color`, `text-style`, `highlight`, `image`, `table` (Row/Header/Cell), `font-family`; `FontSize` como Extension custom com `addGlobalAttributes`
- ✅ **Branding — marca d'água**: `buildHtmlWithBranding()` injeta watermark diagonal com `opacity: 0.07`; `orgBrandingService` mapeia `marca_dagua ↔ marcaDagua`
- ✅ **`TemplateGerarModal` — tipos avançados**: `VariavelTipo` inclui `select`; `resolveDefault()` resolve tokens `$hoje/$org/$advogado`; validação com `Set<string>` + toast

### v2.8.0 (27 de fevereiro de 2026)
- ✅ **Templates de Documentos** (`DocumentoTemplatesPage` + `TemplateEditorModal` + `TemplateGerarModal`): editor TipTap A4, variáveis dinâmicas `{nome_var}`, PDF client-side via `html2pdf.js`, Drive como storage primário
- ✅ **`documentoTemplateService`**: CRUD + `interpolateTemplate` + `extractVariables` + `buildHtmlWithBranding` + `downloadPdf` + `generateFromTemplate`
- ✅ **Drive Integration** (`driveService` + `driveImportService` + `DrivePickerModal`): Google Drive + OneDrive; reutiliza tokens de `integrationsService`
- ✅ **Branding** (`orgBrandingService` + `useOrgBranding` + `BrandingConfigCard`): logo, cores, OAB, endereço, telefone, rodapé, marca d'água — `buildHtmlWithBranding()` injeta header/footer em PDFs
- ✅ **Timesheet** (`timesheetService` + `useTimesheet` + `TimesheetPage`): controle de horas por caso; `faturarPeriodo` cria lançamento em `financeiro_lancamentos`
- ✅ **`usePlan` — novos gates**: `canUseTemplates`, `canUseTimesheet` (professional+), `canUseBranding` (basic+)
- ✅ **4 migrations**: `20260227_documento_templates.sql`, `_timesheet_entries.sql`, `_org_branding.sql`, `_drive_integration.sql`

### v2.7.0 (26 de fevereiro de 2026)
- ✅ **Views por role de acesso**: Dashboard, sidebar e labels adaptativos por `memberRole`
- ✅ **`useCurrentUser` — `memberRole`**: expõe role real do `org_members` (admin, gestor, advogado, secretaria, leitura)
- ✅ **`usePlan` (hook novo)**: feature gates por plano (`trial | basic | professional | enterprise`) — `canUseFinanceiro`, `canUseAnalytics`, `canUseDOU`, `canUsePJe`, `canUseIA`, `canUseAuditoria`
- ✅ **`UpgradeWall`**: componente de bloqueio reutilizável em `src/components/UpgradeWall.tsx`
- ✅ **AppShell — sidebar dinâmico**: `appNavGroups` como `useMemo`; Governança somente para `org_admin`; itens condicionais ao plano
- ✅ **DashboardPage — por perfil**: título, badge e KPIs adaptativos; banner âmbar para `leitura`; mini-card financeiro para `org_admin`

### v2.6.0 (26 de fevereiro de 2026)
- ✅ **Módulo Financeiro** (`FinanceiroPage` + `financeiroService` + `useFinanceiro`): snapshot, fluxo de caixa, contas a receber/pagar, carteira por responsável
- ✅ **`FinanceSnapshot`**: campos receita, despesa, resultado, margem, inadimplência, receitasAtrasadas
- ✅ **Modal "Novo Lançamento"** usando `<Modal>` canônico

### v2.5.0 (23 de fevereiro de 2026)
- ✅ **Edge Function `delete-organization`**: exclusão em cascata respeitando FKs
- ✅ **Edge Function `reset-member-password`**: reset para senha padrão `Mudar@123` via Admin API
- ✅ **audit_log FK circular resolvida**

### v2.4.0 (13 de fevereiro de 2026)
- ✅ **Edge Function `invite-org-member` reescrita**: `inviteUserByEmail` como método primário; limpa usuários órfãos; verifica duplicidade em `org_members`
- ✅ **CORS padronizado** em todas edge functions: `Access-Control-Allow-Origin: *`

### v2.3.0 (11 de fevereiro de 2026)
- ✅ **Sistema de Alertas persistente** (`alertas` table + `alertasService` + `useAlertas`)
- ✅ **Lead Scoring Engine** + `lead_scoring_configs`
- ✅ **Microsoft Teams** (edge functions `teams-oauth` + `teams-create-event`)
- ✅ **AnalyticsPage** — painel executivo com funil de leads, saúde operacional, ranking de equipe
- ✅ **AppShell — sino de notificações** com dropdown de alertas (P0/P1/P2, marcar lido)

### v2.1.0 (10 de fevereiro de 2026)
- ✅ **Google Calendar Integration**: OAuth completo por org, 5 edge functions, sync cron

---

## 📊 VISÃO GERAL

Sistema de gestão jurídica SaaS multi-tenant com planos (trial → basic → professional → enterprise). Construído com React 19 + TypeScript + Vite + Tailwind CSS 4 + Supabase.

**Stack:**
- Frontend: React 19, TypeScript, Vite 7, Tailwind CSS 4, React Router 7
- Backend: Supabase (PostgreSQL + RLS + Edge Functions Deno + Realtime + Storage)
- Libs principais: Recharts, TipTap 3, html2pdf.js, DnD-kit, Lucide, Sonner (toasts)

---

## 🚨 LEI FUNDAMENTAL — NON-NEGOTIABLE

> **Toda ação de código DEVE seguir estes padrões. Sem exceções.**

### Checklist antes de implementar

| # | Regra |
|---|-------|
| 1 | **Cores** via CSS variables (`--brand-primary`, etc.) — NUNCA hex hardcoded, NUNCA `text-blue-*` |
| 2 | **Modais** usam `<Modal>` de `@/components/ui/modal.tsx` — NUNCA `createPortal` inline |
| 3 | **Fluxo**: Component → Hook → Service → Supabase — NUNCA chamada direta ao Supabase no componente |
| 4 | **Multi-tenancy**: toda query Supabase filtra `.eq('org_id', orgId)` explicitamente |
| 5 | **Supabase client**: sempre de `src/lib/supabaseClient.ts` |
| 6 | **Soft delete**: `UPDATE SET deleted_at = now()` — NUNCA `DELETE` em tabelas com `deleted_at` |
| 7 | **Nomenclatura**: colunas DB em `snake_case` português; types TS em `camelCase` inglês; mappers convertem |
| 8 | **Card padrão**: `bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm` |
| 9 | **Guards**: seguir SEMPRE a ordem obrigatória de verificações (ver seção GUARDS) |
| 10 | **Onboarding**: guard vive dentro do `AppShell` (não no router); redireciona para wizard somente se `currentOrg.onboarding_version === null && isOrgAdmin` (lê da tabela `orgs`); não-admins entram direto; sem dependência de `useCurrentUser` no guard |

---

## 🎨 PALETA DE CORES OFICIAL

> **Fonte da verdade: `src/styles/design-tokens.css`**

### Regra de Ouro
- **Botões e ações** → `--brand-primary` (Burgundy) ou `--brand-accent` (Amber)
- **Textos e labels** → `--brand-secondary` (Warm Gray) ou `--color-text` (Preto)

### Paleta Canônica

| Cor | Hex | Variável CSS | Uso |
|-----|-----|-------------|-----|
| 🔴 Burgundy | `#721011` | `--brand-primary` | Botões primários, CTAs, links ativos, ícones de ação |
| 🟠 Amber | `#BF6F32` | `--brand-accent` | Botões secundários, destaques, badges |
| 🟤 Warm Gray | `#6B5E58` | `--brand-secondary` | Texto secundário, labels, ícones inativos |
| ⚫ Preto | `#000000` | `--color-text` | Títulos, headings, texto principal |

### Escala Burgundy
```
--brand-primary-900: #4A0B0C   hover escuro
--brand-primary-700: #721011 ← DEFAULT
--brand-primary-500: #A21617   variante clara
--brand-primary-100: #F5E6E6   bg sutil
--brand-primary-50:  #FAF3F3   bg extra sutil
```

### Cores Semânticas (estados — NÃO são cores de marca)

| Estado | Hex | Uso |
|--------|-----|-----|
| ✅ Success | `#10b981` | Confirmações, status ativo |
| ⚠️ Warning | `#f59e0b` | Avisos, pendências |
| ❌ Danger | `#f43f5e` | Erros, destrutivos |
| ℹ️ Info | `#06b6d4` | Informações |

### Regras de Implementação
1. `var(--brand-primary)` em vez de `#721011`
2. NUNCA `emerald-*`, `green-*`, `blue-*` para ações de marca
3. `style={{ color: '#721011' }}` para ícones (Tailwind não tem classe para esse hex exato)

---

## 📁 ESTRUTURA REAL DE DIRETÓRIOS

```
Sdr juridico/
├── src/
│   ├── app/
│   │   └── router.tsx                    # Todas as rotas (lazy + Suspense)
│   │
│   ├── layouts/
│   │   └── AppShell.tsx                  # Layout principal: sidebar + header + outlet
│   │                                     # Sidebar dinâmico por role/plano (useMemo)
│   │                                     # Sino de notificações + WhatsNewModal + TourModal
│   │                                     # OrgActiveGuard envolve todo o layout
│   │                                     # Early return para /app/onboarding (full-screen sem sidebar)
│   │                                     # Botão HelpCircle no header (visível quando hasTour())
│   │
│   ├── contexts/
│   │   ├── AuthContext.tsx               # useAuth() — user, session, loading
│   │   ├── OrganizationContext.tsx       # useOrganizationContext() — currentOrg, reloadOrg
│   │   └── PermissionsContext.tsx        # usePermissionsContext()
│   │
│   ├── pages/
│   │   ├── OnboardingPage.tsx            # Wizard 4 steps — somente org_admin
│   │   ├── DashboardPage.tsx             # Adaptativo por memberRole
│   │   ├── LeadsPage.tsx                 # Lista + métricas
│   │   ├── LeadsKanbanPage.tsx           # Kanban DnD + Funil de Conversão
│   │   ├── CasosPage.tsx / CasoPage.tsx
│   │   ├── ClientesPage.tsx
│   │   ├── AgendaPage.tsx
│   │   ├── TarefasRootPage.tsx           # Router Kanban/Lista
│   │   ├── TarefasKanbanPage.tsx
│   │   ├── TarefasArquivadasPage.tsx
│   │   ├── DocumentosPage.tsx
│   │   ├── DocumentoTemplatesPage.tsx    # Grid de templates + ações
│   │   ├── TimesheetPage.tsx             # Controle de horas (professional+)
│   │   ├── DataJudPage.tsx               # Busca processual CNJ
│   │   ├── DiarioOficialPage.tsx         # DOU (professional+)
│   │   ├── FinanceiroPage.tsx            # Módulo financeiro (professional+)
│   │   ├── AnalyticsPage.tsx             # Painel executivo KPIs (professional+)
│   │   ├── AuditoriaPage.tsx             # Logs de auditoria (professional+)
│   │   ├── IndicadoresPage.tsx
│   │   ├── DOUSyncLogsPage.tsx
│   │   ├── ConfigPage.tsx                # Configurações org (abas)
│   │   ├── UserManagement.tsx            # Gestão de membros
│   │   ├── UserProfilePage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── ForgotPasswordPage.tsx / ResetPasswordPage.tsx
│   │   ├── NoOrganizationPage.tsx / OrgSuspendedPage.tsx
│   │   ├── NotFoundPage.tsx / UnauthorizedPage.tsx
│   │   ├── auth/AuthCallback.tsx
│   │   └── fartech/
│   │       ├── FartechDashboard.tsx
│   │       ├── OrganizationsList.tsx
│   │       ├── OrganizationDetails.tsx
│   │       ├── OrganizationForm.tsx
│   │       ├── OrganizationSettingsPage.tsx
│   │       ├── SecurityMonitoring.tsx
│   │       └── SecurityReportPage.tsx
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── modal.tsx                 # ← CANÔNICO para TODA modal
│   │   │   ├── Logo.tsx
│   │   │   └── ...
│   │   ├── guards/
│   │   │   ├── OrgActiveGuard.tsx        # Guard principal (ver seção GUARDS)
│   │   │   ├── OrgAdminGuard.tsx
│   │   │   ├── FartechGuard.tsx
│   │   │   └── PermissionGuard.tsx
│   │   ├── documentos/
│   │   │   ├── TemplateEditorModal.tsx   # TipTap A4 + toolbar
│   │   │   ├── TemplateGerarModal.tsx    # Formulário de variáveis + PDF
│   │   │   └── DrivePickerModal.tsx      # Seletor Drive/OneDrive
│   │   ├── config/
│   │   │   └── BrandingConfigCard.tsx    # Logo + cores + rodapé + marca d'água
│   │   ├── WhatsNewModal.tsx             # Modal "O que há de novo" (AppShell)
│   │   ├── TourModal.tsx                 # Central de ajuda contextual — ativado por ?tour=1
│   │   │                                 # Cobre 14 páginas; exports: hasTour(), getTourForPath()
│   │   ├── UpgradeWall.tsx               # Bloqueio de feature por plano
│   │   └── CaseIntelligence/
│   │       └── CaseIntelligencePanel.tsx # Waze Jurídico
│   │
│   ├── hooks/
│   │   ├── useCurrentUser.ts             # user, role, memberRole, roleLabel, reloadProfile()
│   │   ├── usePermissions.ts             # useIsOrgAdmin, useIsFartechAdmin, useIsOrgActive
│   │   ├── usePlan.ts                    # Feature gates por plano
│   │   ├── useOrganization.ts            # useOrganization, useIsOrgActive
│   │   ├── useOrgBranding.ts
│   │   ├── useIntegrations.ts            # Status Google Calendar, Teams
│   │   ├── useLeads.ts / useCasos.ts / useClientes.ts
│   │   ├── useDocumentos.ts / useDocumentoTemplates.ts
│   │   ├── useFinanceiro.ts / useTimesheet.ts
│   │   ├── useAgenda.ts / useTarefas.ts
│   │   ├── useAlertas.ts                 # Alertas persistentes
│   │   ├── useGoogleCalendarCreate.ts / useGoogleCalendarSync.ts
│   │   ├── useTeamsMeetingCreate.ts / useTeamsSync.ts
│   │   ├── useDataJudSync.ts / useDOU.ts
│   │   └── usePageTracking.ts
│   │
│   ├── services/
│   │   ├── onboardingService.ts          # updateStep, complete (orgs), completeUser (usuarios)
│   │   ├── organizationsService.ts       # CRUD orgs + mapDbToOrg
│   │   ├── leadsService.ts / casosService.ts / clientesService.ts
│   │   ├── tarefasService.ts / tarefaDocumentosService.ts
│   │   ├── agendaService.ts / documentosService.ts
│   │   ├── documentoTemplateService.ts   # + buildHtmlWithBranding + generateFromTemplate
│   │   ├── driveService.ts               # Google Drive + OneDrive unificado
│   │   ├── driveImportService.ts
│   │   ├── orgBrandingService.ts
│   │   ├── timesheetService.ts
│   │   ├── financeiroService.ts
│   │   ├── alertasService.ts
│   │   ├── leadScoringService.ts
│   │   ├── datajudService.ts             # Proxy direto Elasticsearch
│   │   ├── datajudCaseService.ts         # Wrapper edge function
│   │   ├── douService.ts / queridoDiarioService.ts
│   │   ├── cnpjService.ts
│   │   ├── auditLogService.ts
│   │   ├── integrationsService.ts
│   │   ├── permissionsService.ts / usuariosService.ts
│   │   ├── pjeImportService.ts
│   │   ├── caseIntelligenceService.ts    # Waze Jurídico — Claude proxy
│   │   ├── localScraperService.ts        # /scraper-api proxy
│   │   └── telemetryService.ts
│   │
│   ├── lib/
│   │   ├── supabaseClient.ts             # Cliente Supabase + Row type exports
│   │   ├── mappers.ts                    # DB Row → Domain object
│   │   ├── version.ts                    # APP_VERSION + VERSION_HIGHLIGHTS
│   │   ├── errors.ts / health.ts / org.ts / retry.ts
│   │
│   ├── types/
│   │   ├── domain.ts                     # Lead, Caso, Cliente, ... (camelCase EN)
│   │   ├── organization.ts               # Organization (inclui onboarding_version/step)
│   │   ├── financeiro.ts
│   │   ├── timesheet.ts
│   │   ├── documentoTemplate.ts          # + VariavelTipo, OrgBranding
│   │   └── database.types.ts             # Auto-gerado do Supabase — NÃO editar
│   │
│   └── styles/
│       ├── design-tokens.css             # Fonte da verdade de CSS variables
│       └── force-light.css              # Forçar tema claro
│
├── supabase/
│   ├── functions/                        # Edge Functions Deno
│   │   ├── invite-org-member/
│   │   ├── delete-org-member/
│   │   ├── reset-member-password/
│   │   ├── delete-organization/
│   │   ├── google-calendar-oauth/
│   │   ├── google-calendar-sync/
│   │   ├── google-calendar-sync-cron/
│   │   ├── google-calendar-create-event/
│   │   ├── store-google-tokens/
│   │   ├── google-drive-token/
│   │   ├── teams-oauth/
│   │   ├── teams-create-event/
│   │   ├── datajud-proxy/
│   │   ├── dou-search/
│   │   ├── querido-diario-proxy/
│   │   └── _shared/
│   └── migrations/                       # SQL source of truth (consultar antes de qualquer query)
│       ├── 20260210_add_proposta_status.sql
│       ├── 20260223_fix_audit_log_fk.sql
│       ├── 20260225_financeiro_lancamentos.sql
│       ├── 20260227_documento_templates.sql
│       ├── 20260228_fix_watermark_column.sql  ← idempotente; sem timestamp único
│       ├── 20260228010000_onboarding.sql       ← orgs.onboarding_version + onboarding_step
│       ├── 20260228020000_org_branding.sql     ← CREATE TABLE org_branding
│       └── 20260228030000_usuarios_onboarding.sql ← usuarios.onboarding_version
│
└── scraper-server/                       # Node.js — iniciado automaticamente pelo Vite plugin
    ├── index.ts                          # Express + endpoints /scraper-api/*
    └── scrapers/
        ├── pje-painel.ts / pje-playwright.ts
        └── eproc.ts
```

---

## 🔄 FLUXO DE DADOS

```
Componente
    │
    ▼
Hook (useLeads, useCasos...)   ← gerencia loading/error/state
    │
    ▼
Service (leadsService...)      ← funções async puras
    │
    ▼
Supabase Client                ← sempre de lib/supabaseClient.ts
    │
    ▼
Mapper (mapDbToOrg, ...)       ← snake_case → camelCase
    │
    ▼
Type de domínio (Lead, Caso..) ← camelCase inglês
```

**Regra**: nunca pular camadas. Um componente NUNCA importa `supabase` diretamente.

---

## 🏗️ MULTI-TENANT

### Hierarquia de Roles

```
fartech_admin         — Admin da plataforma (FarTech)
    └── org_admin     — Admin do escritório (controle total)
            ├── gestor       — Acesso operacional + pode ver financeiro
            ├── advogado     — Gerenciar seus casos e leads
            ├── secretaria   — Painel administrativo
            └── leitura      — Somente leitura
```

### Dois Níveis de Role (v2.7.0)

| Nível | Onde fica | Valores | Uso |
|-------|-----------|---------|-----|
| `UserRole` | `usuarios.permissoes[]` | `fartech_admin`, `org_admin`, `user` | Guards de rota, permissões RLS |
| `memberRole` | `org_members.role` | `admin`, `gestor`, `advogado`, `secretaria`, `leitura` | Personalização de UI/UX apenas |

**IMPORTANTE**: `roleToPermissoes` em `UserManagement.tsx`:
```typescript
const roleToPermissoes = (role: OrgMemberRole) => {
  if (role === 'admin') return ['org_admin']   // ← somente 'admin', não 'gestor'
  return ['user']
}
```

### Matriz de Acesso por Plano (`usePlan`)

| Gate | Plano mínimo | Módulo |
|------|-------------|--------|
| `canUseFinanceiro` | professional | Financeiro |
| `canUseAnalytics` | professional | Analytics |
| `canUseDOU` | professional | Diário Oficial |
| `canUsePJe` | professional | PJe/MNI |
| `canUseIA` | enterprise | Waze Jurídico |
| `canUseAuditoria` | professional | Auditoria |
| `canUseTemplates` | professional | Templates TipTap |
| `canUseTimesheet` | professional | Timesheet |
| `canUseBranding` | basic | Branding |

---

## 👥 CONTROLE DE ACESSO POR PERFIL (v2.7.0)

### Comportamento por role no sidebar

| Grupo | fartech_admin | org_admin | gestor | advogado | secretaria | leitura |
|-------|:---:|:---:|:---:|:---:|:---:|:---:|
| Operação (Dashboard, Agenda, Tarefas) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Relacionamento (Leads, Clientes, Casos) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Conteúdo (Docs, DataJud, DOU*) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Governança (Financeiro, Analytics, Auditoria) | ✅ | ✅ (se plano) | ❌ | ❌ | ❌ | ❌ |
| Administração | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

\* DOU aparece somente se `canUseDOU`

### DashboardPage — adapta por memberRole

- `leitura` → banner âmbar "Perfil somente leitura"
- `advogado` → KPIs filtrados por responsável (sem nova query — memo sobre arrays existentes)
- `gestor / org_admin com equipe` → mini-card financeiro + link analytics
- Solo (`isGestorDash && total_users <= 1`) → título "seu escritório", badge "Solo"

### AnalyticsPage — guards em ordem
1. `!isOrgAdmin && !isFartechAdmin` → card "Acesso restrito"
2. `!canUseAnalytics` → `<UpgradeWall feature="Analytics Executivo" minPlan="Profissional" />`
3. `isSolo` (total_users ≤ 1) → oculta seções de equipe

---

## 🚀 SISTEMA DE ONBOARDING (v2.9.0)

### Rastreamento de Onboarding

| Tabela | Coluna | Controlado por | Usado para |
|--------|--------|----------------|------------|
| `orgs` | `onboarding_version TEXT DEFAULT NULL` | `onboardingService.complete(orgId, version)` | Guard de redirect **e** WhatsNewModal |
| `orgs` | `onboarding_step TEXT DEFAULT 'empresa'` | `onboardingService.updateStep(orgId, step)` | Retomada do wizard |
| `usuarios` | `onboarding_version TEXT DEFAULT NULL` | `onboardingService.completeUser(userId, version)` | Registro auxiliar por usuário (não é lido pelo guard) |

**Regra crítica**: o `OrgActiveGuard` verifica **`currentOrg.onboarding_version`** (tabela `orgs`, via `OrganizationContext`). **Não** lê `usuarios.onboarding_version`. `completeUser()` pode ser chamado para fins de auditoria/analytics, mas não desbloqueia o guard.

### Fluxo de decisão

```
Usuário acessa /app/*
    │
    ▼
AppShell — early return para /app/onboarding:
    └─ renderiza full-screen (sem sidebar) envolvido em <OrgActiveGuard>

AppShell — layout principal envolvido em <OrgActiveGuard>:
    │
    ▼
OrgActiveGuard — passo 7:
    ├─ isOrgAdmin && !currentOrg.onboarding_version && path ≠ /app/onboarding
    │       └──→ Navigate to /app/onboarding
    │
    └─ orgs.onboarding_version !== null && !== APP_VERSION && !isFartechAdmin
            └──→ AppShell mostra WhatsNewModal (estado local, não redirect)

OnboardingPage — guard interno:
    if (!isOrgAdmin) return <Navigate to="/app/dashboard" replace />

WhatsNewModal — handleAcknowledge:
    if (!isOrgAdmin) { setDismissed(true); return }  ← não salva no banco
    await onboardingService.complete(orgId, APP_VERSION)  ← só org_admin persiste
```

### `onboardingService` (`src/services/onboardingService.ts`)

```typescript
onboardingService.updateStep(orgId, step)           // salva passo atual em orgs — não bloqueia
onboardingService.complete(orgId, version)          // seta orgs.onboarding_version (para WhatsNew)
onboardingService.completeUser(userId, version)     // seta usuarios.onboarding_version (auditoria — NÃO lido pelo guard)
```

### Padrão obrigatório na conclusão do wizard

```typescript
// OnboardingPage — handleConcluirEIr
const handleConcluirEIr = async (to: string) => {
  setSaving(true)
  // 1. Registrar na org (crítico — é o que o OrgActiveGuard verifica)
  await onboardingService.complete(currentOrg.id, APP_VERSION)
  // 2. Forçar re-fetch do OrganizationContext para destravar o guard
  await reloadOrg()
  // 3. Registrar por usuário (auxiliar — auditoria/analytics)
  try {
    if (user) await onboardingService.completeUser(user.id, APP_VERSION)
  } catch { /* não bloqueia navegação */ }
  setSaving(false)
  navigate(to, { replace: true })
}
```

**Por que `reloadOrg()` é obrigatório?** Sem ele, `currentOrg.onboarding_version` permanece `null` em memória após `complete()`, e o `OrgActiveGuard` redireciona de volta para `/app/onboarding`, criando um loop infinito.

### Steps do Wizard

| Step | Campos | Obrigatório | Ação principal |
|------|--------|-------------|----------------|
| empresa | nome, cnpj, oab, telefone, email, áreas de atuação | ✅ (nome) | `organizationsService.update()` |
| equipe | nome, email, role por convite | ❌ | `supabase.functions.invoke('invite-org-member')` |
| integracoes | Google Calendar OAuth, Teams | ❌ | OAuth com `return_to=/app/onboarding` |
| pronto | próximos passos clicáveis | — | `complete(orgId)` + `reloadOrg()` → navigate com `?tour=1` |

### `WhatsNewModal` — exibição no AppShell

```typescript
// AppShell.tsx
const showWhatsNew = !!currentOrg
  && currentOrg.onboarding_version !== null   // ← lê de orgs (não usuarios)
  && currentOrg.onboarding_version !== APP_VERSION
  && !isFartechAdmin
  && !whatsNewDismissed
```

### `src/lib/version.ts`

```typescript
export const APP_VERSION = '3.0.0'

export const VERSION_HIGHLIGHTS: Record<string, { title: string; items: string[] }> = {
  '2.9.0': { title: 'Templates de Documentos + Branding', items: [...] },
  '2.8.0': { title: 'Financeiro & Analytics Executivo', items: [...] },
}
```

---

## ❓ CENTRAL DE AJUDA — TourModal (v2.9.0)

### Conceito

`TourModal.tsx` é um modal contextual de ajuda ativado por parâmetro de URL (`?tour=1`). Cada página do app pode ter um tour próprio com título, descrição e lista de dicas. O modal fecha removendo o parâmetro da URL (sem reload).

### Ativação

Dois pontos de entrada:
1. **Botão `HelpCircle` no header** (`AppShell.tsx`) — visível somente se `hasTour(pathname)` retornar `true`; adiciona `?tour=1` via `navigate(..., { replace: true })`
2. **Links no Step 4 do onboarding** — `PROXIMOS_PASSOS` inclui `?tour=1` nas URLs dos botões de ação

### API do TourModal

```typescript
// src/components/TourModal.tsx

export interface PageTour {
  title: string
  description: string
  tips: { icon: LucideIcon; label: string; detail: string }[]
}

export const PAGE_TOURS: Record<string, PageTour>  // 14 páginas mapeadas

// Busca tour pela pathname exata; fallback por prefixo mais longo
export function getTourForPath(pathname: string): PageTour | null

// Verdadeiro se existir algum tour para a pathname
export function hasTour(pathname: string): boolean

// Componente — lê ?tour=1 da URL, fecha sem reload
export function TourModal(): JSX.Element | null
```

### Páginas com Tour

`/app/dashboard`, `/app/leads`, `/app/clientes`, `/app/casos`, `/app/agenda`, `/app/tarefas`, `/app/documentos`, `/app/documentos/templates`, `/app/datajud`, `/app/diario-oficial`, `/app/financeiro`, `/app/timesheet`, `/app/analytics`, `/app/config`

### Padrão de implementação

```typescript
// AppShell.tsx — botão de ajuda no header
{hasTour(location.pathname) && (
  <button
    onClick={() => navigate({ pathname: location.pathname, search: '?tour=1' }, { replace: true })}
    title="Ajuda desta página"
  >
    <HelpCircle className="h-5 w-5 text-gray-500" />
  </button>
)}

// AppShell.tsx — renderização
<TourModal />
<WhatsNewModal />
```

### Regras de design

- Header do modal: `background: #721011`, texto branco
- Ícones de dica: caixa `background: #fef2f2`, ícone com `style={{ color: '#721011' }}`
- Fecha com ESC, clique no backdrop ou botão "Entendido"
- Fechar remove `?tour=1` da URL com `navigate(..., { replace: true })` — não cria entrada no histórico

---

## 🎨 DESIGN SYSTEM

### Modal Canônico (`@/components/ui/modal.tsx`)

**TODA modal nova DEVE usar este componente.** Nunca `createPortal` diretamente.

```tsx
import { Modal } from '@/components/ui/modal'

<Modal
  open={showModal}
  onClose={() => setShowModal(false)}
  title="Título"
  description="Subtítulo opcional"
  maxWidth="520px"
  footer={<>botões</>}
>
  {/* conteúdo */}
</Modal>
```

**Props:** `open`, `onClose`, `title`, `description`, `footer`, `maxWidth`, `noPadding`, `className`
**Implementação:** `createPortal` para `document.body`, z-index 9999, ESC para fechar, backdrop blur, body scroll lock.

#### `noPadding` — layout de drawer dentro de modal

Use `noPadding` para drawers de detalhe (LeadDrawer, ClienteDrawer) com layout totalmente customizado:

```tsx
<Modal noPadding open={open && !!item} onClose={onClose} maxWidth="36rem">
  <div style={{ display: 'flex', flexDirection: 'column', borderRadius: 16, overflow: 'hidden', maxHeight: '82vh' }}>
    {/* Header — flexShrink: 0 */}
    <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>...</div>

    {/* Content — scrollável */}
    <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '20px 24px' }}>...</div>

    {/* Footer — flexShrink: 0 */}
    <div style={{ borderTop: '1px solid #e5e7eb', padding: '16px 24px', flexShrink: 0 }}>...</div>
  </div>
</Modal>
```

> `LeadDrawer` usa `maxWidth="36rem"`, `ClienteDrawer` usa `maxWidth="34rem"`. Ambos usam este padrão. **Nunca** `createPortal+<aside>` para drawers.

#### `Button` — variant obrigatória para ações de marca

```tsx
// CORRETO — botão brand-primary (vermelho)
<Button variant="primary">Novo Lançamento</Button>

// ERRADO — renderiza como secondary (branco/cinza)
<Button>Novo Lançamento</Button>
```

O `variant` padrão do `Button` é `'secondary'` (fundo branco). Toda ação principal DEVE especificar `variant="primary"` explicitamente.

### Card Padrão

```
bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm
```

### Label Padrão

```
text-xs uppercase tracking-wide text-gray-500
```

### Input Focus Ring

```
rgba(114, 16, 17, 0.2)
```

### UpgradeWall (`@/components/UpgradeWall.tsx`)

```tsx
if (!canUseAnalytics) return <UpgradeWall feature="Analytics Executivo" minPlan="Profissional" />
```

Mostra cadeado + feature + plano mínimo + botão que navega para `/app/plano`.

---

## 🔌 PADRÕES DE INTEGRAÇÃO

### Hook (padrão canônico)

```typescript
// hooks/useLeads.ts
export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { currentOrg } = useOrganizationContext()

  const fetchLeads = useCallback(async () => {
    if (!currentOrg) return
    setLoading(true)
    try {
      const data = await leadsService.getAll(currentOrg.id)
      setLeads(data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [currentOrg])

  return { leads, loading, error, fetchLeads }
}
```

### Service (padrão canônico)

```typescript
// services/leadsService.ts
import { supabase } from '@/lib/supabaseClient'
import { mapLead } from '@/lib/mappers'

export const leadsService = {
  async getAll(orgId: string): Promise<Lead[]> {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('org_id', orgId)           // ← obrigatório
      .is('deleted_at', null)         // ← soft delete
      .order('created_at', { ascending: false })

    if (error) throw error
    return data.map(mapLead)
  },
}
```

---

## 🔐 SEGURANÇA

### 🛡️ Guards de Rotas

#### `OrgActiveGuard` — Ordem CRÍTICA e OBRIGATÓRIA

```typescript
// components/guards/OrgActiveGuard.tsx

// 1. Auth ainda carregando → aguarda
if (authLoading) return <>{loadingComponent}</>

// 2. Não autenticado → /login
if (!user) return <Navigate to="/login" replace />

// 3. Org ainda carregando → aguarda
if (loading || isLoading) return <>{loadingComponent}</>

// 4. Fartech admin → bypassa tudo
if (allowFartechAdmin && isFartechAdmin) return <>{children}</>

// 5. Sem org → /login (usuário não tem org atribuída; re-autenticar ou contatar admin)
if (!currentOrg) return <Navigate to="/login" replace />

// 6. Org inativa → /org-suspended
if (!isOrgActive) {
  if (fallback) return <>{fallback}</>
  return <Navigate to={redirectTo} replace />
}

// 7. Onboarding pendente → /app/onboarding (SOMENTE org_admin)
// Lê currentOrg.onboarding_version (tabela orgs) — NÃO useCurrentUser/usuarios
// Não-admins entram direto sem redirect
if (
  isOrgAdmin &&
  !currentOrg.onboarding_version &&   // ← orgs.onboarding_version (OrganizationContext)
  !pathname.startsWith('/app/onboarding')
) {
  return <Navigate to="/app/onboarding" replace />
}

// 8. ✅ Renderiza
return <>{children}</>
```

**Fluxo:**
```
authLoading?  → Loading
user?         → /login
orgLoading?   → Loading
fartech?      → ✅ children
currentOrg?   → /login
isOrgActive?  → /org-suspended ou fallback
orgs.onboarding_version===null && isOrgAdmin? → /app/onboarding
✅ children
```

**IMPORTANTE**: `OrgActiveGuard` vive dentro de `AppShell`, não no router. O `AppShell` tem um early return para `/app/onboarding` que renderiza full-screen sem sidebar, também envolvido em `<OrgActiveGuard>` para garantir as verificações 1-6. O guard **não importa `useCurrentUser`** — toda verificação de onboarding usa `currentOrg` (OrganizationContext).

### Auditoria

Todas as ações críticas devem chamar `auditLogService.logAuditChange({ orgId, action, entity, entityId, details })`.

### Row Level Security

- `is_org_member(org_id)` — SELECT em tabelas de negócio
- `is_org_admin_for_org(org_id)` — INSERT/UPDATE em tabelas admin
- Toda query no frontend DEVE ter `.eq('org_id', orgId)` — RLS é backup, não substituto

---

## 💰 MÓDULO FINANCEIRO (v2.6.0)

### Schema `financeiro_lancamentos`

```
id, org_id, tipo ('receita'|'despesa'), categoria, descricao,
valor, data_competencia, data_vencimento, data_pagamento,
status ('pendente'|'pago'|'atrasado'|'cancelado'),
caso_id (FK nullable), cliente_id (FK nullable),
responsavel_user_id (FK nullable), recorrencia,
lancamento_id (FK → financeiro_lancamentos — para recorrências),
created_at, updated_at
```

### `FinanceSnapshot` (hook `useFinanceiro`)

```typescript
interface FinanceSnapshot {
  receitaRealizada: number
  receitaPrevista: number
  despesaRealizada: number
  despesaPrevista: number
  resultado: number
  margem: number
  inadimplencia: number
  receitasAtrasadas: number
}
```

### Fluxo Timesheet → Financeiro

```
timesheetService.faturarPeriodo(orgId, entries, hourlyRate)
    → financeiroService.createTransaction({ tipo: 'receita', categoria: 'honorarios', ... })
    → UPDATE timesheet_entries SET lancamento_id = X, status = 'faturado'
```

---

## 📄 MÓDULO TEMPLATES & BRANDING (v2.8.0)

### TipTap — imports corretos

```typescript
import { TextStyle } from '@tiptap/extension-text-style'        // named, não default
import { Color } from '@tiptap/extension-color'
import { Highlight } from '@tiptap/extension-highlight'
import { Image } from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
```

`FontSize` é um `Extension.create()` customizado com `addGlobalAttributes()` no tipo `textStyle`.

### `buildHtmlWithBranding(html, branding)`

Injeta:
1. `<header>` com logo + nome do escritório + número OAB
2. `<footer>` com endereço + telefone + texto personalizado
3. Watermark diagonal (texto repetido, `opacity: 0.07`, `position: fixed`, `transform: rotate(-45deg)`)

### `generateFromTemplate` — ordem de armazenamento

1. Gera PDF blob client-side (`html2pdf.js`)
2. Tenta upload para pasta `SDR Jurídico/Caso-X` no Google Drive
3. Fallback: upload para Supabase Storage
4. `INSERT` em `documentos` com `drive_file_id / drive_url`

### Drive — reutilização de tokens

`driveService` reutiliza tokens já armazenados em `integrationsService`:
- Google Drive → provider `'google_calendar'` (mesmo token do Calendar)
- OneDrive → provider `'teams'`

---

## 🗄️ MODELO DE DADOS (tabelas principais)

### Tabela `orgs`

```
id UUID PK
name, slug UK, cnpj UK, email, phone
plan 'trial|basic|professional|enterprise'
status 'pending|active|suspended|cancelled'
max_users INT, max_storage_gb INT
settings JSONB
onboarding_version TEXT DEFAULT NULL   ← NULL = wizard nunca feito
onboarding_step TEXT DEFAULT 'empresa' ← passo atual do wizard
created_at, updated_at
```

### Tabela `org_members`

```
id UUID PK
org_id FK, user_id FK
role 'admin|gestor|advogado|secretaria|leitura'
ativo BOOL, invited_by FK, created_at
```

### Tabela `usuarios`

```
id UUID PK (= auth.uid())
nome_completo, email UK, telefone
permissoes TEXT[] 'fartech_admin|org_admin|user'
status 'ativo|inativo|suspenso'
preferencias JSONB, ultimo_acesso TIMESTAMP
onboarding_version TEXT DEFAULT NULL  ← registro auxiliar por usuário (não lido pelo guard)
```

> O guard usa `orgs.onboarding_version`, não este campo. `completeUser()` pode ser chamado para auditoria, mas não é crítico para o fluxo de redirect.

### Tabela `org_branding`

```
id UUID PK
org_id FK UK (ON CONFLICT DO UPDATE)
nome_display, oab_registro, endereco, telefone, rodape_texto
cor_primaria, cor_secundaria, cor_texto
logo_url (Supabase Storage bucket 'org-logos')
marca_dagua TEXT DEFAULT NULL
created_at, updated_at
```

### Tabela `documento_templates`

```
id UUID PK, org_id FK
nome, categoria, descricao
conteudo_html TEXT (TipTap output)
variaveis JSONB (TemplateVariavel[])
ativo BOOL, uso_count INT
created_by FK, created_at, updated_at
```

### Tabela `timesheet_entries`

```
id UUID PK, org_id FK
caso_id FK, user_id FK
descricao, horas DECIMAL, valor_hora DECIMAL, valor_total DECIMAL
data DATE, status 'rascunho|pendente|aprovado|faturado'
aprovado_por FK, aprovado_at
lancamento_id FK → financeiro_lancamentos (nullable)
created_at, updated_at
```

### Tabela `financeiro_lancamentos`

```
id UUID PK, org_id FK
tipo 'receita|despesa', categoria, descricao
valor DECIMAL, data_competencia DATE, data_vencimento DATE, data_pagamento DATE
status 'pendente|pago|atrasado|cancelado'
caso_id FK nullable, cliente_id FK nullable
responsavel_user_id FK nullable
recorrencia TEXT, lancamento_id FK nullable (auto-referência)
created_at, updated_at
```

### Tabela `alertas`

```
id UUID PK, org_id FK
user_id FK nullable (NULL = org-wide)
tipo 'datajud_movimento|dou_publicacao|tarefa_vencida|caso_critico|lead_esfriando'
prioridade 'P0|P1|P2'
titulo, descricao, entidade, entidade_id UUID, action_href
lida BOOL DEFAULT false, created_at
```

### DataJud (colunas CRÍTICAS — não inventar)

```
datajud_processos:
  id, numero_processo, tribunal, grau, classe_processual,
  assunto, raw_response, cached_at, org_id
  (SEM: caso_id, cliente_id, payload, last_sync_at)

datajud_movimentacoes:
  id, datajud_processo_id (NÃO processo_id), nome (NÃO descricao),
  data_hora (NÃO data_movimentacao), raw_response (NÃO payload)
  (SEM org_id)

Link caso → processo: casos.datajud_processo_id → datajud_processos.id
```

---

## 🚀 DEPLOY — PROCESSO COMPLETO

> **⚠️ NUNCA use `vercel deploy` sem `--prebuilt`** — o build remoto falha com exit code 2.

### Pré-requisitos

| Item | Valor |
|------|-------|
| Git user.email | `contato@fartech.app.br` (obrigatório pelo Vercel) |
| Repositório | `fartech2025/SDR-Juridico`, branch `main` |
| URL produção | `https://sdr-juridico.vercel.app` |

### Fluxo completo (copy-paste)

```bash
cd "C:\Users\alanp\OneDrive\Documentos\SDR-Juridico\Sdr juridico"

# 1. Garantir email correto
git config user.email "contato@fartech.app.br"

# 2. Sync
git pull origin main

# 3. Commitar mudanças pendentes
# git add . && git commit -m "feat: descrição" && git push origin main

# 4. Build local
npm run build

# 5. Preparar artefato prebuilt
rm -rf .vercel/output/static && mkdir -p .vercel/output/static && cp -r dist/. .vercel/output/static/

# 6. Deploy
vercel deploy --prebuilt --prod --yes

# 7. Apontar alias (substituir URL gerada)
# vercel alias set sdr-juridico-XXXX-fartechs-projects.vercel.app sdr-juridico.vercel.app
```

### Troubleshooting

| Sintoma | Causa | Solução |
|---------|-------|---------|
| `not authorized to deploy` | Email git errado | `git config user.email "contato@fartech.app.br"` |
| `Build failed exit code 2` | Erros TypeScript no Vercel | Usar `--prebuilt` (nunca sem ele) |
| Tela branca após deploy | Rota não registrada em `router.tsx` | Verificar se é filho do AppShell |
| `non-fast-forward` no push | Remoto tem commits locais não têm | `git pull --rebase origin main` |

---

## 🔄 VERSIONAMENTO

**SemVer:** `MAJOR.MINOR.PATCH`
**Conventional Commits:** `feat:`, `fix:`, `chore:`, `refactor:`, `style:`, `docs:`

`APP_VERSION` em `src/lib/version.ts` é a fonte da verdade da versão em produção.
Incrementar `APP_VERSION` → usuários existentes verão o `WhatsNewModal` na próxima sessão.

---

## 🤖 PLANO MCP (Waze Jurídico)

O `caseIntelligenceService` orquestra:
1. DataJud (busca processual)
2. Scraper MNI/eProc (via `localScraperService` → `localhost:3001`)
3. Querido Diário (publicações DOU por nome/CNPJ)
4. Portal Transparência (CEIS/CEAF)
5. Casos internos do banco

Chamadas ao Claude via `POST /scraper-api/claude` → `localhost:3001/claude` → `api.anthropic.com`.
**API key**: somente em `scraper-server/.env`, nunca no bundle frontend.
Resultados: cache em `localStorage` com TTL 24h.

---

## 🔧 SCRAPER SERVER

Iniciado **automaticamente** pelo plugin `scraperServerPlugin` em `vite.config.ts` ao rodar `npm run dev`. **NÃO iniciar manualmente.**

### Endpoints (v1.3.0)

| Endpoint | Descrição |
|----------|-----------|
| `GET /status` | Status + `eproc_configurado` |
| `POST /configurar/mni` | Configura PJe; pode retornar `aguardando_otp` |
| `POST /configurar/mni/otp` | Completa login 2FA com código TOTP |
| `POST /configurar/eproc` | Credenciais eProc separadas |
| `POST /advogado/processos` | Lista PJe + eProc + DataJud (deduplicados) |
| `POST /mni/processo` | Busca processo individual via MNI |
| `POST /cpf` | Busca por CPF |
| `POST /claude` | Proxy Anthropic API |

### Vite Proxy (dev)

```
/scraper-api  →  http://localhost:3001
/api-datajud  →  https://api-publica.datajud.cnj.jus.br
```
