# 🏗️ ARQUITETURA CANÔNICA - SDR JURÍDICO

**Versão:** 2.8.0
**Data:** 27 de fevereiro de 2026
**Status:** ✅ Produção

---

## 📋 CHANGELOG RECENTE

### v2.8.0 (27 de fevereiro de 2026)
- ✅ **Módulo Templates de Documentos**: Nova página `/app/documentos/templates` com grid de cards, filtro por categoria e ações de criar/editar/excluir/usar templates
- ✅ **TipTap Rich-Text Editor**: `TemplateEditorModal` com toolbar completa (negrito, itálico, sublinhado, alinhamento, listas, H1/H2/H3), detecção automática de variáveis `{nome_var}` e painel lateral de edição de labels
- ✅ **`TemplateGerarModal`**: Formulário dinâmico por variável, preview HTML em tempo real, botões "Baixar PDF" e "Salvar como Documento"
- ✅ **`documentoTemplateService`**: CRUD completo (`listTemplates`, `getTemplate`, `createTemplate`, `updateTemplate`, `deleteTemplate`), `interpolateTemplate()`, `extractVariables()`, `buildHtmlWithBranding()`, `downloadPdf()`, `generatePdfBlob()`, `generateFromTemplate()`
- ✅ **`useDocumentoTemplates`**: Hook de estado com todas as actions do service; `fetchTemplates`, `createTemplate`, `updateTemplate`, `deleteTemplate`
- ✅ **`html2pdf.js`**: Geração de PDF client-side a partir do HTML renderizado do TipTap; wrapper `htmlToPdfBlob()` com lazy import
- ✅ **Módulo Drive Integration**: `driveService.ts` — wrapper unificado Google Drive + OneDrive (`isConnected`, `listFiles`, `exportAsHtml`, `uploadPdf`, `ensureFolder`); reutiliza tokens do `integrationsService` (`google_calendar` → Drive, `teams` → OneDrive)
- ✅ **`driveImportService.ts`**: `importFileAsHtml()` — exporta arquivo do Drive como HTML e sanitiza (remove `<style>`, class/style attrs, tags meta/link/script, IDs)
- ✅ **`DrivePickerModal`**: Modal de seleção de arquivos do Drive (Google Drive + OneDrive) com lista de provedores, busca de arquivos e importação para o TipTap
- ✅ **"Importar do Drive" em TemplateEditorModal**: Botão no cabeçalho do editor abre `DrivePickerModal`; HTML importado é carregado diretamente no TipTap
- ✅ **`generateFromTemplate` — Drive como storage primário**: PDF gerado client-side → upload para pasta "SDR Jurídico/Caso-X" no Drive → fallback para Supabase Storage → `INSERT` em `documentos` com `drive_file_id/drive_url`
- ✅ **Branding por Escritório**: `orgBrandingService.ts` — `getBranding()`, `upsertBranding()`, `uploadLogo()` (bucket `org-logos`); single record por org via ON CONFLICT
- ✅ **`useOrgBranding`**: Hook de estado com `saveBranding`, `uploadLogo`, `fetchBranding`
- ✅ **`BrandingConfigCard`**: UI completa em `ConfigPage` (aba Essencial) — upload de logo (drag&drop, max 2MB), color pickers hex, campos nomeDisplay/oabRegistro/endereco/telefone/rodapeTexto, preview ao vivo do cabeçalho do documento
- ✅ **`buildHtmlWithBranding()`**: Injeta `<header>` (logo + nome + OAB) e `<footer>` (endereço + telefone + texto) ao redor do conteúdo antes de gerar PDF
- ✅ **Timesheet + Honorários**: `types/timesheet.ts`, `services/timesheetService.ts`, `hooks/useTimesheet.ts`, `pages/TimesheetPage.tsx` — controle de horas por caso, aprovação e faturamento integrado ao Financeiro
- ✅ **`timesheetService`**: `listEntries`, `createEntry`, `updateEntry`, `deleteEntry`, `aprovarEntradas`, `faturarPeriodo` (cria lançamentos em `financeiro_lancamentos` e atualiza status para `'faturado'`)
- ✅ **`TimesheetPage`**: KPIs (horas/mês, valor billable, horas a faturar, entradas pendentes), painel do gestor com checkboxes + botões "Aprovar" e "Faturar", tabela pessoal por usuário, modal "Registrar Horas"
- ✅ **`usePlan` — novos gates**: `canUseTemplates` (professional+), `canUseTimesheet` (professional+), `canUseBranding` (basic+)
- ✅ **AppShell — novos itens de sidebar**: "Templates" (grupo Conteúdo, ícone `LayoutTemplate`, gate `canUseTemplates`) e "Timesheet" (grupo Operação, ícone `Clock`, gate `canUseTimesheet`)
- ✅ **4 migrations criadas**: `20260227_documento_templates.sql`, `20260227_timesheet_entries.sql`, `20260227_org_branding.sql`, `20260227_drive_integration.sql`
- ✅ **Fix `logAuditChange`**: Corrigidas 3 chamadas em `documentoTemplateService` que passavam 4 args posicionais — convertidas para objeto único `{ orgId, action, entity, entityId, details }`
- ✅ **Fix `AnalyticsPage` TS2451**: `orgStats` local renomeado para `teamStats` (evita conflito com `orgStats` do `useOrganizationContext`)
- ✅ **Fix `vite.config.ts` TS1185**: Conflict markers de merge resolvidos, versão HEAD do `scraperServerPlugin` preservada

### v2.7.0 (26 de fevereiro de 2026)
- ✅ **Views por Role de Acesso**: Dashboard e sidebar agora respondem ao perfil real do usuário (`memberRole` do `org_members`)
- ✅ **`useCurrentUser` — `memberRole`**: Hook expõe `memberRole: string | null` com o role real (`admin`, `gestor`, `advogado`, `secretaria`, `leitura`) além do `UserRole` resolvido; `roleLabel` usa mapa de labels reais
- ✅ **`usePlan` (novo hook)**: Feature gates por plano (`trial | basic | professional | enterprise`) — `canUseFinanceiro`, `canUseAnalytics`, `canUseDOU`, `canUsePJe`, `canUseIA`, `canUseAuditoria`; lê `currentOrg.plan` via `useOrganizationContext`
- ✅ **`UpgradeWall` (novo componente)**: Tela de bloqueio reutilizável para módulos pagos com botão de upgrade para `/app/config`
- ✅ **AppShell — sidebar condicional**: `appNavGroups` convertido de constante para `useMemo` dinâmico; grupo **Governança** visível somente para `org_admin`; itens condicionais ao plano (`canUseDOU`, `canUseAuditoria`, `canUseAnalytics`, `canUseFinanceiro`)
- ✅ **DashboardPage — header por perfil**: Título e badge adaptativos por role; banner âmbar para `leitura`; mini-card financeiro (receita + resultado + link analytics) para `org_admin`
- ✅ **DashboardPage — KPIs filtrados para advogado**: `meusCasos` e `meusLeads` filtrados por responsável; `criticalCasesCount` e `hotLeadsCount` derivados do subset filtrado
- ✅ **Perfil Solo (advogado solo)**: Detectado por `isGestorDash && total_users <= 1`; header "seu escritório" + badge "Solo"; sem filtro de KPIs (é o único usuário)
- ✅ **AnalyticsPage — guard de plano**: Retorna `<UpgradeWall>` se `!canUseAnalytics` (antes do conteúdo)
- ✅ **AnalyticsPage — sem seção de equipe para solo**: Seções "Desempenho por colaborador" e "Ranking do time" ocultas quando `total_users <= 1`

### v2.6.0 (26 de fevereiro de 2026)
- ✅ **Módulo Financeiro**: Nova seção `## 💰 MÓDULO FINANCEIRO` documentando schema, tipos, hooks, service, fluxo de dados e exceção de soft delete
- ✅ **`FinanceSnapshot` completo**: Adicionado campo `receitasAtrasadas: number` ao tipo e ao `useMemo` do `useFinanceiro` — estava calculado mas não tipado
- ✅ **Fix Recharts yAxisId**: `ComposedChart` em `FinanceiroPage` agora tem dois `<YAxis>` (`yAxisId="left"` para barras, `yAxisId="right"` para linha de saldo) — eliminado warning no console
- ✅ **Cor saldo do gráfico**: `#1f3c88` (azul violação) substituído por `#5B4FCF` (roxo neutro) na linha de saldo do fluxo de caixa
- ✅ **Modal "Novo Lançamento"**: Formulário movido de card inline para `<Modal>` canônico (`@/components/ui/modal.tsx`) com botão no header da página
- ✅ **Dead code removido**: `expandedPeriod` state e import `LineChart` removidos de `FinanceiroPage`

### v2.5.0 (23 de fevereiro de 2026)
- ✅ **Edge Function `delete-organization`**: Nova Edge Function com service_role para exclusão completa de organização — remove dependências em cascata (agendamentos, tarefas, casos, leads, clientes, documentos, org_members, audit_log, integrations) respeitando ordem de FKs, depois remove a org
- ✅ **Edge Function `reset-member-password`**: Nova Edge Function com service_role para resetar senha de membros para senha padrão (`Mudar@123`). Suporta `action: 'list'` para listar membros da org via service_role (bypassa RLS) e `action: 'reset'` para alterar senha via Admin API
- ✅ **audit_log FK Circular Resolvida**: Removida FK `audit_log.org_id → organizations.id` via Management API para permitir exclusão de orgs. Trigger de audit_log atualizado para setar `org_id=NULL` em registros quando a org é deletada
- ✅ **Modais OrganizationDetails Refatorados**: Modais de reset de senha e exclusão de organização migrados de `createPortal` inline para componente `<Modal>` do design system (`@/components/ui/modal.tsx`), com props `open`, `onClose`, `title`, `description`, `footer`, `maxWidth`
- ✅ **Botão Copiar Slug**: Adicionado botão de copiar slug no modal de exclusão de organização para facilitar confirmação
- ✅ **OrganizationDetails.tsx Reestruturado**: Página de detalhes da organização (Fartech admin) com ações de Resetar Senha e Excluir Organização usando Edge Functions

### v2.4.0 (13 de fevereiro de 2026)
- ✅ **Edge Function `invite-org-member` Reescrita**: Fluxo completo de convite — usa `inviteUserByEmail` como método primário (cria user + envia email em uma só chamada). Limpa usuários órfãos do auth antes de re-convidar. Verifica duplicidade em `org_members` antes de adicionar
- ✅ **Edge Function `delete-org-member` Corrigida**: CORS aberto (`*`) e supabase-js atualizado (2.39.0 → 2.49.0)
- ✅ **CORS Padronizado em Edge Functions**: Todas as edge functions de gestão de membros agora usam `Access-Control-Allow-Origin: *` em vez de `APP_URL` hardcoded
- ✅ **supabase-js Atualizado nas Edge Functions**: Migrado de `@supabase/supabase-js@2.39.0` para `@2.49.0` — corrige `getUserByEmail is not a function`
- ✅ **Tratamento de Erro Frontend (UserManagement)**: Corrigida extração de erro da edge function — `fnError.context.json()` em vez de `fnError.context.response.text` (incompatível com supabase-js v2)
- ✅ **Restart Supabase Project**: Resolvido timeout de serviços backend (Auth, PostgREST) que travavam após deploy de edge function no plano NANO

### v2.3.2 (11 de fevereiro de 2026)
- ✅ **Fix Google Calendar 500**: Corrigido erro 500 ao criar eventos — Edge Function `google-calendar-create-event` agora usa **exclusivamente** tokens da integração da org (tabela `integrations`), obtidos via OAuth customizado (projeto GCP 410413435637). Removidos paths `directToken` (localStorage) e `user_metadata` que usavam tokens do projeto GCP do Supabase (450955346215) onde Calendar API não está habilitada
- ✅ **Frontend Token Cleanup**: Removido uso de `provider_token` do Supabase Auth em `useGoogleCalendarCreate.ts`, `AuthContext.tsx` e `AuthCallback.tsx` — esses tokens pertencem ao projeto GCP do Supabase, não ao projeto do cliente
- ✅ **Limpeza do Projeto**: 100+ arquivos redundantes (docs, SQL, scripts) movidos para `_archive/` e adicionados ao `.gitignore`
- ✅ **vercel.json Corrigido**: Config de deploy apontava para `app/` em vez de `Sdr juridico/` — corrigido para build e output corretos

### v2.3.1 (11 de fevereiro de 2026)
- ✅ **Header Independente do Sidebar**: Header agora permanece fixo em `lg:left-64` e não acompanha o colapso do sidebar (antes mudava para `lg:left-20`)
- ✅ **ENUM lead_status Validado**: Confirmado que o banco usa ENUM (não constraint CHECK) com todos os valores: `novo`, `em_triagem`, `em_contato`, `qualificado`, `proposta`, `nao_qualificado`, `convertido`, `ganho`, `perdido`
- ✅ **Kanban Leads com Proposta**: Status "Proposta" funcional no Kanban — o ENUM já continha o valor, não era necessária migration adicional

### v2.3.0 (11 de fevereiro de 2026)
- ✅ **Header Fixo (AppShell)**: Navbar agora é `fixed` em vez de `sticky`, permanece visível ao rolar o conteúdo
- ✅ **Modal TarefasKanbanPage**: Refatorado para usar componente `Modal` com `createPortal` (z-index 9999), corrigindo sobreposição
- ✅ **Sistema de Alertas Persistente**: Nova tabela `alertas` com tipos (datajud_movimento, dou_publicacao, tarefa_vencida, caso_critico, lead_esfriando) e prioridades (P0, P1, P2)
- ✅ **alertasService + useAlertas**: Serviço completo e hook para CRUD de alertas com suporte a org-wide e user-specific
- ✅ **Lead Scoring Engine**: Motor de pontuação configurável (0-100) mapeado para heat (frio/morno/quente) com 6 fatores ponderados
- ✅ **lead_scoring_configs Table**: Tabela para configuração de pesos do scoring por organização
- ✅ **Status "Proposta" em Leads**: Novo status válido na constraint CHECK (antes era mapeado para 'qualificado')
- ✅ **Microsoft Teams Integration**: Edge Functions `teams-oauth` e `teams-create-event` para OAuth e criação de reuniões
- ✅ **TeamsQuickCreate Component**: Componente para criação rápida de reuniões Teams integrado à agenda
- ✅ **MeetingCreatorForm Component**: Formulário unificado para criação de reuniões Google Meet e Teams
- ✅ **AnalyticsPage**: Nova página de analytics com favoritos, histórico e estatísticas de consultas DataJud
- ✅ **IndicadoresPage**: Dashboard completo com gráficos de Funil de Conversão, Metas e Insights gerados
- ✅ **AuditoriaPage**: Página dedicada para visualização de logs de auditoria do sistema
- ✅ **DOUSyncLogsPage**: Página para monitoramento de sincronização com Diário Oficial da União
- ✅ **Security Monitoring (Fartech)**: Páginas `SecurityMonitoring` e `SecurityReportPage` para admins da plataforma
- ✅ **telemetryService**: Serviço para tracking de uso e métricas de navegação (usePageTracking hook)
- ✅ **useTeamsMeetingCreate + useTeamsSync**: Hooks para integração Microsoft Teams
- ✅ **useGoogleCalendarCreate**: Hook separado para criação de eventos no Google Calendar
- ✅ **useDOU + useDataJudSync**: Hooks para consultas DOU e sincronização DataJud

### v2.2.0 (10 de fevereiro de 2026)
- ✅ **Funil de Conversão (LeadsKanbanPage)**: Gráfico visual de funil abaixo do Kanban com 6 etapas (Novo → Em Contato → Qualificado → Proposta → Ganho → Perdido)
- ✅ **Funil com Design Tokens**: Cores mapeadas para CSS variables (--brand-primary, --color-info, --brand-accent, --color-warning, --color-success, --color-danger)
- ✅ **Funil Responsivo**: Barras com largura proporcional ao total + formato de funil (estreitamento progressivo), percentuais e totais
- ✅ **Design Tokens Migration**: Migração massiva de 38 arquivos — cores raw Tailwind (text-gray-*, bg-gray-*, border-gray-*, #721011) substituídas por tokens CSS
- ✅ **Fix Trigger Lead Status**: Corrigido trigger `trigger_log_lead_status_change` que impedia salvar leads (NEW.responsavel → NEW.assigned_user_id, NEW.heat → NEW.qualificacao->>'heat')
- ✅ **Espaçamento Padronizado 20px**: Padding de 20px (0.5cm) aplicado em LeadsPage (lista + formulário Novo Lead) e margem lateral de 20px no funil do Kanban
- ✅ **LeadsKanbanPage Realtime**: Canal Supabase Realtime para atualizar Kanban automaticamente quando leads mudam

### v2.1.0 (10 de fevereiro de 2026)
- ✅ **Google Calendar Integration**: Fluxo OAuth completo para vincular Google Calendar por organização
- ✅ **Edge Functions Google Calendar**: 5 funções deployadas — oauth, sync, sync-cron, create-event, store-google-tokens
- ✅ **UPSERT por org_id+provider**: Edge Function de OAuth cria/atualiza registro na tabela `integrations` automaticamente
- ✅ **CORS Dinâmico**: Edge Functions usam `req.headers.get('origin')` em vez de APP_URL hardcoded
- ✅ **Deploy --no-verify-jwt**: Todas as Edge Functions de Google Calendar deployadas sem verificação JWT
- ✅ **Sync localStorage↔DB**: ConfigPage sincroniza localStorage após OAuth bem-sucedido
- ✅ **Role Check Corrigido**: Sync aceita role `admin` além de `org_admin` e `gestor`

### v2.0.0 (5 de fevereiro de 2026)
- ✅ **Diário Oficial Page**: Nova página dedicada para busca em diários oficiais via Querido Diário API
- ✅ **Querido Diário Service**: Serviço completo para busca de publicações, processos e dados de empresas (CNPJ)
- ✅ **Querido Diário Proxy**: Edge Function `querido-diario-proxy` para comunicação segura com API Querido Diário
- ✅ **Enriquecimento CNPJ**: Auto-preenchimento de dados de empresas ao cadastrar clientes PJ
- ✅ **Validação CPF/CNPJ**: Validação em tempo real com algoritmo de dígitos verificadores
- ✅ **Formatação Automática**: CPF (000.000.000-00) e CNPJ (00.000.000/0000-00) formatados ao digitar
- ✅ **Detecção Automática PF/PJ**: Sistema detecta automaticamente tipo pelo número de dígitos
- ✅ **ClientesPage Aprimorada**: Indicadores visuais de validação e status de enriquecimento

### v1.9.0 (5 de fevereiro de 2026)
- ✅ **DataJud Auto-Detecção de Tribunal**: Implementada detecção automática do tribunal pelo formato CNJ (J.TR)
- ✅ **DataJud UI Completa**: Exibição completa de todas as informações retornadas pela API DataJud
- ✅ **Fix RLS org_members**: Nova policy `users_see_own_membership` permite usuários verem seus próprios registros
- ✅ **DataJud Proxy Final**: Edge Function `datajud-proxy` com `--no-verify-jwt` funcionando em produção
- ✅ **Partes Processuais**: Renderização completa com polo ativo/passivo, advogados, OAB, documentos
- ✅ **Movimentações Timeline**: Visualização cronológica com complementos tabelados e órgão julgador
- ✅ **Metadados Técnicos**: Exibição de ID DataJud, timestamp, sistema, formato, grau e sigilo

### v1.8.1 (5 de fevereiro de 2026)
- ✅ **OrganizationContext**: Adicionado listener de `onAuthStateChange` para recarregar org automaticamente
- ✅ **Fix Race Condition**: Corrigido problema onde org não era carregada após mudança de porta do servidor
- ✅ **DataJud Proxy**: Nova Edge Function minimalista sem verificação JWT funcionando

### v1.8.0 (5 de fevereiro de 2026)
- ✅ **OrgActiveGuard**: Corrigida ordem de verificações para evitar redirecionamento incorreto
- ✅ **Fluxo de Autenticação**: Usuários não logados agora vão para `/login` (antes iam para `/no-organization`)
- ✅ **DataJud Service**: Reescrito para chamar API DataJud diretamente (sem Edge Function)
- ✅ **API Key DataJud**: Configurada inline no service para simplicidade de uso

### v1.7.0 (5 de fevereiro de 2026)
- ✅ **DocumentoViewer**: Novo componente modal para visualização de documentos (PDF, imagens) inline
- ✅ **Ações no Viewer**: Botões de Aprovar, Rejeitar e Solicitar Novamente direto no modal de visualização
- ✅ **Controles de Visualização**: Zoom, rotação e download para imagens; iframe para PDFs
- ✅ **Geração automática de ID**: Documentos recebem número interno automático no formato `PREFIX-YYYYMMDD-XXXXX`
- ✅ **Prefixos por Tipo**: PI (Petição Inicial), CONT (Contestação), REC (Recurso), PROC (Procuração), CTR (Contrato), etc.
- ✅ **Marcar como Visualizado**: Função para registrar que documento foi visualizado com timestamp e usuário
- ✅ **Download de Documentos**: Função para baixar arquivos via signed URL do Supabase Storage

### v1.6.0 (2 de julho de 2025)
- ✅ **Relacionamentos de Documentos**: Adicionados campos `cliente_id` e `lead_id` na tabela `documentos` como FKs
- ✅ **Soft Delete para Documentos**: Adicionados campos `deleted_at` e `deleted_by` na tabela `documentos`
- ✅ **Novos métodos no Service**: `getDocumentosByCliente()`, `getDocumentosByLead()`, `getDocumentosArquivados()`, `arquivarDocumento()`, `restaurarDocumento()`
- ✅ **Hook useDocumentos expandido**: Novos métodos `fetchByCliente`, `fetchByLead`, `fetchArquivados`, `arquivarDocumento`, `restaurarDocumento`
- ✅ **JOINs otimizados**: Queries agora trazem dados de `casos`, `clientes` e `leads` via JOIN

### v1.5.0 (5 de fevereiro de 2026)
- ✅ **Soft Delete para Leads**: Adicionados campos `deleted_at` e `deleted_by` na tabela `leads`
- ✅ **Soft Delete para Tarefas**: Adicionados campos `deleted_at` e `deleted_by` na tabela `tarefas`
- ✅ **Histórico de Status de Leads**: Nova tabela `lead_status_history` para rastrear mudanças de status e temperatura (heat)
- ✅ **Histórico de Status de Tarefas**: Nova tabela `tarefa_status_history` para rastrear mudanças de status
- ✅ **Página de Tarefas Arquivadas**: Nova página `/app/tarefas/arquivadas` para gerenciar tarefas deletadas
- ✅ **LeadDrawer com Histórico**: Drawer de leads agora exibe timeline de mudanças de status/heat

---

## 📊 VISÃO GERAL

Sistema de gestão jurídica construído com arquitetura modular, escalável e baseada em princípios de Clean Architecture e Domain-Driven Design.

---

## 🚨 LEI FUNDAMENTAL — COMPLIANCE OBRIGATÓRIO

> **Esta seção é NON-NEGOTIABLE. Toda ação de código — seja do time humano ou do assistente de IA — DEVE obrigatoriamente seguir os padrões aqui definidos. Sem exceções.**

### Checklist de Conformidade (verificar antes de cada implementação)

| # | Regra | Onde está documentado |
|---|-------|-----------------------|
| 1 | Cores via CSS variables, nunca hex hardcoded | Seção `PALETA DE CORES OFICIAL` |
| 2 | Modais usam `<Modal>` de `@/components/ui/modal.tsx` | Seção `DESIGN SYSTEM` |
| 3 | Fluxo: Component → Hook → Service → Supabase → Mapper | Seção `PADRÕES DE INTEGRAÇÃO` |
| 4 | Toda query Supabase filtra por `org_id` explicitamente | Seção `MULTI-TENANT ISOLATION` |
| 5 | Supabase client importado SEMPRE de `src/lib/supabaseClient.ts` | CLAUDE.md |
| 6 | Soft delete: `UPDATE SET deleted_at`, nunca `DELETE` | Seção `MODELO DE DADOS` |
| 7 | Colunas DB snake_case PT, types TS camelCase EN | Seção `CONVENÇÕES` |
| 8 | Card padrão: `bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm` | CLAUDE.md |
| 9 | Guards de rota seguem ordem obrigatória de verificações | Seção `GUARDS DE ROTAS` |
| 10 | Integrações IA seguem plano MCP | Seção `PLANO MCP` |

### Quando há dúvida
1. Consultar a seção relevante desta arquitetura
2. Buscar um componente existente que faz algo similar e replicar o padrão
3. Nunca inventar um padrão novo sem documentar aqui primeiro

---

## 🎯 PRINCÍPIOS ARQUITETURAIS

### 1. Separação de Responsabilidades
- **Apresentação** (UI Components)
- **Lógica de Negócio** (Services/Hooks)
- **Dados** (API/Supabase)
- **Estado** (Contexts/State Management)

### 2. Inversão de Dependências
- Camadas externas dependem de camadas internas
- Abstrações não dependem de implementações

### 3. Single Source of Truth
- Estado centralizado via Contexts
- Cache gerenciado pelo Supabase Client

### 4. Composição sobre Herança
- Componentes reutilizáveis via composição
- Hooks customizados para lógica compartilhada

---

## 🎨 PALETA DE CORES OFICIAL (NON-NEGOTIABLE)

> **Esta é a paleta oficial do SDR Jurídico. Toda nova feature, componente ou página DEVE usar estas cores via CSS variables. Nunca use valores hex hardcoded.**

### Regra de Ouro
- **As 2 cores SUPERIORES** → para **botões e ações** (CTAs, hover, links ativos)
- **As 2 cores INFERIORES** → para **textos** (títulos, body, labels, captions)

### Paleta Canônica

| Cor | Hex | Variável CSS | Uso |
|-----|-----|-------------|-----|
| 🔴 **Burgundy** | `#721011` | `--brand-primary` | Botões primários, CTAs, links ativos, ícones de ação |
| 🟠 **Amber** | `#BF6F32` | `--brand-accent` | Botões secundários, destaques, badges, hover alternativo |
| 🟤 **Warm Gray** | `#6B5E58` | `--brand-secondary` | Texto secundário, labels, captions, ícones inativos |
| ⚫ **Preto** | `#000000` | `--color-text` | Títulos, headings, texto principal |

### Escala Primary (Burgundy)

```
--brand-primary-900: #4A0B0C  (hover escuro)
--brand-primary-800: #5C0D0E  (pressed)
--brand-primary-700: #721011  ← DEFAULT
--brand-primary-600: #8A1314  (variante média)
--brand-primary-500: #A21617  (variante clara)
--brand-primary-100: #F5E6E6  (bg sutil)
--brand-primary-50:  #FAF3F3  (bg extra sutil)
```

### Escala Accent (Amber)

```
--brand-accent-700: #8F5225  (hover escuro)
--brand-accent-600: #A66029  (pressed)
--brand-accent-500: #BF6F32  ← DEFAULT
--brand-accent-400: #CC8652  (variante média)
--brand-accent-300: #D99D72  (variante clara)
--brand-accent-100: #F5E6DA  (bg sutil)
```

### Escala Neutral (Warm Gray)

```
--color-gray-900: #000000    (texto principal)
--color-gray-800: #2A2522    (títulos fortes)
--color-gray-700: #3D3632    (subtítulos)
--color-gray-600: #6B5E58    ← SECONDARY DEFAULT  
--color-gray-500: #8A7E78    (texto sutil)
--color-gray-400: #A39D98    (disabled)
--color-gray-300: #C3BFB9    (bordas)
--color-gray-200: #E2E0DC    (divisores)
--color-gray-100: #F1F0EE    (bg secundário)
--color-gray-50:  #F8F7F6    (bg base)
```

### Cores Semânticas (estados — NÃO são cores de marca)

| Estado | Cor | Hex | Uso |
|--------|-----|-----|-----|
| ✅ Success | Verde | `#10b981` | Confirmações, status ativo |
| ⚠️ Warning | Amarelo | `#f59e0b` | Avisos, pendências |
| ❌ Danger | Rosa | `#f43f5e` | Erros, ações destrutivas |
| ℹ️ Info | Ciano | `#06b6d4` | Informações, dicas |

### Regras de Implementação

1. **SEMPRE** use `var(--brand-primary)` em vez de `#721011`
2. **SEMPRE** use `var(--brand-accent)` em vez de `#BF6F32`
3. **NUNCA** use `emerald-*`, `green-*` ou `blue-*` do Tailwind para ações de marca
4. Cores semânticas (`green`, `red`, `yellow`) são APENAS para estados (success, danger, warning)
5. O arquivo `src/styles/design-tokens.css` é a **fonte da verdade** para tokens CSS
6. O arquivo `src/styles/force-light.css` NÃO deve sobrescrever cores de marca

---

## 📁 ESTRUTURA DE DIRETÓRIOS CANÔNICA

```
src/
├── 📱 app/                          # Configuração da aplicação
│   ├── routes/                      # Definição de rotas
│   └── providers/                   # Providers globais
│
├── �️ domain/                       # ⭐ CAMADA DE DOMÍNIO
│   ├── entities/                    # Entidades de negócio
│   │   ├── Organization.ts          # Escritório/Tenant
│   │   ├── User.ts                  # Usuário do sistema
│   │   ├── Invitation.ts            # Convite
│   │   ├── Lead.ts
│   │   ├── Case.ts
│   │   ├── Client.ts
│   │   └── ...
│   ├── value-objects/               # Value Objects
│   │   ├── Email.ts
│   │   ├── CNPJ.ts
│   │   ├── OAB.ts
│   │   ├── Phone.ts
│   │   └── Password.ts
│   ├── repositories/                # Contratos de repositórios (Interfaces)
│   │   ├── IOrganizationRepository.ts
│   │   ├── IUserRepository.ts
│   │   ├── IInvitationRepository.ts
│   │   ├── ILeadRepository.ts
│   │   ├── ICaseRepository.ts
│   │   └── ...
│   ├── validators/                  # Validadores de domínio
│   │   ├── organizationValidator.ts
│   │   ├── userValidator.ts
│   │   ├── leadValidator.ts
│   │   └── ...
│   └── errors/                      # Erros de domínio
│       ├── DomainError.ts
│       ├── ValidationError.ts
│       └── BusinessRuleError.ts
│
├── 🎯 application/                  # ⭐ CAMADA DE APLICAÇÃO
│   ├── use-cases/                   # Casos de uso
│   │   ├── organizations/
│   │   │   ├── CreateOrganizationUseCase.ts
│   │   │   ├── UpdateOrganizationUseCase.ts
│   │   │   ├── GenerateInviteLinkUseCase.ts
│   │   │   └── SuspendOrganizationUseCase.ts
│   │   ├── users/
│   │   │   ├── InviteUserUseCase.ts
│   │   │   ├── AcceptInvitationUseCase.ts
│   │   │   ├── ChangeUserRoleUseCase.ts
│   │   │   ├── JoinOrganizationUseCase.ts
│   │   │   └── DeactivateUserUseCase.ts
│   │   ├── auth/
│   │   │   ├── LoginUseCase.ts
│   │   │   ├── LogoutUseCase.ts
│   │   │   └── RefreshTokenUseCase.ts
│   │   ├── leads/
│   │   │   ├── CreateLeadUseCase.ts
│   │   │   ├── ConvertLeadToClientUseCase.ts
│   │   │   └── AssignLeadUseCase.ts
│   │   ├── cases/
│   │   │   ├── CreateCaseUseCase.ts
│   │   │   ├── AssignLawyerUseCase.ts
│   │   │   └── UpdateCaseStatusUseCase.ts
│   │   └── ...
│   ├── dtos/                        # Data Transfer Objects
│   │   ├── CreateOrganizationDto.ts
│   │   ├── InviteUserDto.ts
│   │   ├── CreateLeadDto.ts
│   │   ├── UpdateUserDto.ts
│   │   └── ...
│   ├── mappers/                     # Mapeadores
│   │   ├── OrganizationMapper.ts
│   │   ├── UserMapper.ts
│   │   ├── LeadMapper.ts
│   │   └── ...
│   └── ports/                       # Portas (interfaces de serviços)
│       ├── IEmailService.ts
│       ├── IStorageService.ts
│       ├── INotificationService.ts
│       └── IAuditLogService.ts
│
├── 🏗️ infrastructure/               # ⭐ CAMADA DE INFRAESTRUTURA
│   ├── repositories/                # Implementações de repositórios
│   │   ├── SupabaseOrganizationRepository.ts
│   │   ├── SupabaseUserRepository.ts
│   │   ├── SupabaseInvitationRepository.ts
│   │   ├── SupabaseLeadRepository.ts
│   │   ├── SupabaseCaseRepository.ts
│   │   └── ...
│   ├── services/                    # Implementações de services
│   │   ├── EmailService.ts
│   │   ├── StorageService.ts
│   │   ├── NotificationService.ts
│   │   ├── AuditLogService.ts
│   │   ├── alertasService.ts          # 🆕 Sistema de alertas persistente
│   │   ├── leadScoringService.ts      # 🆕 Motor de scoring para leads
│   │   ├── telemetryService.ts        # 🆕 Telemetria e tracking de uso
│   │   └── favoritosService.ts        # 🆕 Favoritos e histórico DataJud
│   ├── http/                        # Configuração HTTP
│   │   ├── api-client.ts
│   │   ├── interceptors.ts
│   │   └── error-handler.ts
│   └── cache/                       # Cache layer
│       ├── CacheService.ts
│       └── cache-config.ts
│
├── 🎨 presentation/                 # ⭐ CAMADA DE APRESENTAÇÃO
│   ├── components/
│   │   ├── ui/                      # Design System
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Button.test.tsx
│   │   │   │   ├── Button.stories.tsx
│   │   │   │   └── Button.module.css
│   │   │   ├── Input/
│   │   │   ├── Card/
│   │   │   ├── Modal/
│   │   │   └── ...
│   │   ├── features/                # Componentes por feature
│   │   │   ├── organizations/
│   │   │   │   ├── OrganizationForm.tsx
│   │   │   │   ├── OrganizationCard.tsx
│   │   │   │   └── PlanSelector.tsx
│   │   │   ├── users/
│   │   │   │   ├── UsersList.tsx
│   │   │   │   ├── UserCard.tsx
│   │   │   │   ├── InviteUserModal.tsx
│   │   │   │   ├── RoleSelector.tsx
│   │   │   │   └── PermissionMatrix.tsx
│   │   │   ├── leads/
│   │   │   │   ├── LeadCard.tsx
│   │   │   │   ├── LeadForm.tsx
│   │   │   │   └── LeadDrawer.tsx
│   │   │   ├── cases/
│   │   │   │   ├── CaseCard.tsx
│   │   │   │   ├── CaseForm.tsx
│   │   │   │   └── CaseTimeline.tsx
│   │   │   ├── clients/
│   │   │   ├── documentos/
│   │   │   │   ├── UploadDocumentos.tsx     # Upload com geração de ID interno
│   │   │   │   └── DocumentoViewer.tsx      # Modal de visualização inline
│   │   │   ├── meetings/                # 🆕 Componentes de reuniões
│   │   │   │   ├── TeamsQuickCreate.tsx     # Criação rápida Teams
│   │   │   │   ├── GoogleMeetQuickCreate.tsx # Criação rápida Google Meet
│   │   │   │   ├── MeetingCreatorForm.tsx   # Form unificado Meet/Teams
│   │   │   │   └── GoogleMeetAgendaIntegration.tsx # Integração agenda
│   │   │   └── ...
│   │   └── layout/                  # Layouts
│   │       ├── AppShell.tsx
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       └── Footer.tsx
│   ├── pages/                       # Páginas
│   │   ├── organizations/
│   │   │   ├── CadastroEscritorioPage.tsx
│   │   │   └── ConfigOrganizationPage.tsx
│   │   ├── users/
│   │   │   ├── EquipePage.tsx
│   │   │   ├── InviteUserPage.tsx
│   │   │   └── AcceptInvitationPage.tsx
│   │   ├── fartech/
│   │   │   ├── FartechDashboard.tsx
│   │   │   ├── OrganizationsList.tsx
│   │   │   ├── SecurityMonitoring.tsx       # 🆕 Monitoramento de segurança
│   │   │   └── SecurityReportPage.tsx       # 🆕 Relatórios de segurança
│   │   ├── DashboardPage.tsx
│   │   ├── LeadsPage.tsx              # Lista de leads + métricas
│   │   ├── LeadsKanbanPage.tsx        # Kanban DnD + Funil de Conversão
│   │   ├── TarefasKanbanPage.tsx      # Kanban de tarefas
│   │   ├── TarefasRootPage.tsx        # Router Kanban/Lista de tarefas
│   │   ├── CasesPage.tsx
│   │   ├── AnalyticsPage.tsx          # 🆕 Favoritos, histórico e estatísticas DataJud
│   │   ├── AuditoriaPage.tsx          # 🆕 Logs de auditoria do sistema
│   │   ├── IndicadoresPage.tsx        # 🆕 Dashboard com funil, metas e insights
│   │   ├── DOUSyncLogsPage.tsx        # 🆕 Monitoramento sync DOU
│   │   └── ...
│   ├── hooks/                       # Custom hooks
│   │   ├── useOrganization.ts
│   │   ├── useUsers.ts
│   │   ├── useInvitations.ts
│   │   ├── usePermissions.ts
│   │   ├── useAuth.ts
│   │   ├── useAlertas.ts              # 🆕 Sistema de alertas persistente
│   │   ├── useTeamsMeetingCreate.ts   # 🆕 Criação reuniões Microsoft Teams
│   │   ├── useTeamsSync.ts            # 🆕 Sincronização Teams
│   │   ├── useGoogleCalendarCreate.ts # 🆕 Criação eventos Google Calendar
│   │   ├── useGoogleCalendarSync.ts   # Sincronização Google Calendar
│   │   ├── useDOU.ts                  # 🆕 Consultas Diário Oficial  
│   │   ├── useDataJudSync.ts          # 🆕 Sincronização DataJud
│   │   ├── usePageTracking.ts         # 🆕 Telemetria de navegação
│   │   └── ...
│   └── view-models/                 # ViewModels (lógica de apresentação)
│       ├── DashboardViewModel.ts
│       └── UserManagementViewModel.ts
│
├── 🔧 shared/                       # ⭐ CÓDIGO COMPARTILHADO
│   ├── constants/
│   │   ├── roles.ts                 # Roles do sistema
│   │   ├── permissions.ts           # Permissões
│   │   ├── plans.ts                 # Planos
│   │   └── routes.ts
│   ├── enums/
│   │   ├── UserRole.ts
│   │   ├── OrganizationStatus.ts
│   │   ├── CaseStatus.ts
│   │   └── LeadStatus.ts
│   ├── types/
│   │   ├── models/
│   │   ├── api/
│   │   └── ui/
│   ├── utils/
│   │   ├── formatters/
│   │   ├── validators/
│   │   └── helpers/
│   └── errors/
│       ├── AppError.ts
│       ├── NotFoundError.ts
│       ├── UnauthorizedError.ts
│       └── BusinessError.ts
│
├── ⚙️ config/                       # ⭐ CONFIGURAÇÕES
│   ├── environment.ts               # Variáveis de ambiente
│   ├── routes.ts                    # Configuração de rotas
│   ├── permissions.ts               # Matriz de permissões
│   └── supabase.ts                  # Config Supabase
│
├── 🧪 tests/                        # ⭐ TESTES
│   ├── unit/
│   │   ├── domain/
│   │   ├── use-cases/
│   │   └── services/
│   ├── integration/
│   │   └── repositories/
│   ├── e2e/
│   │   └── flows/
│   ├── fixtures/
│   └── mocks/
│
├── 📚 lib/                          # Bibliotecas e configurações
│   ├── supabase.ts                  # Cliente Supabase
│   ├── errors.ts                    # Error handling
│   ├── health.ts                    # Health check
│   └── retry.ts                     # Retry logic
│
├── 🎨 styles/                       # Estilos globais
│   ├── globals.css
│   ├── themes/
│   └── variables/
│
├── 🎭 theme/                        # Sistema de design
│   ├── colors.ts
│   ├── typography.ts
│   └── spacing.ts
│
└── 🖼️ assets/                       # Assets estáticos
    ├── images/
    ├── icons/
    └── fonts/
```

---

## 🏗️ ARQUITETURA MULTI-TENANT

### Hierarquia do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    FARTECH (Admin Global)                    │
│            Gerencia múltiplos escritórios/tenants            │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ Escritório A  │  │ Escritório B  │  │ Escritório C  │
│ (Tenant)      │  │ (Tenant)      │  │ (Tenant)      │
└───────────────┘  └───────────────┘  └───────────────┘
        │
        ├─ 👤 Gestor (Owner)          → Controle total
        ├─ 👨‍⚖️ Advogados             → Gerenciar casos
        ├─ 👥 Associados             → Acesso limitado
        └─ 📊 Equipe Administrativa  → Operações
```

### Roles e Hierarquia

```typescript
enum UserRole {
  FARTECH_ADMIN = 'fartech_admin',    // Admin da plataforma
  ORG_OWNER = 'org_owner',            // Dono do escritório
  ORG_ADMIN = 'org_admin',            // Admin do escritório
  ADVOGADO = 'advogado',              // Advogado
  ASSOCIADO = 'associado',            // Associado
  ADMINISTRATIVO = 'administrativo'    // Equipe administrativa
}
```

---

## 🔄 FLUXO DE DADOS (Clean Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│                        USUÁRIO                               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              CAMADA DE APRESENTAÇÃO (UI)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Pages      │  │  Components  │  │    Hooks     │      │
│  │  (React)     │  │    (UI)      │  │  (State)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              CAMADA DE APLICAÇÃO (Use Cases)                 │
│  ┌────────────────────────────────────────────────────┐     │
│  │  CreateOrganizationUseCase                         │     │
│  │  InviteUserUseCase                                 │     │
│  │  ConvertLeadToClientUseCase                        │     │
│  │  AssignCaseToLawyerUseCase                         │     │
│  └────────────────────────────────────────────────────┘     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              CAMADA DE DOMÍNIO (Business Logic)              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Entities    │  │ Value Objects│  │  Validators  │      │
│  │ Organization │  │    Email     │  │   Business   │      │
│  │    User      │  │    CNPJ      │  │    Rules     │      │
│  │    Lead      │  │    OAB       │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │        Repositories (Interfaces)                   │     │
│  │  IOrganizationRepository, IUserRepository          │     │
│  └────────────────────────────────────────────────────┘     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│           CAMADA DE INFRAESTRUTURA (Data Access)             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Repositories │  │   Services   │  │     API      │      │
│  │  (Supabase)  │  │    Email     │  │   Cliente    │      │
│  │              │  │  Notification│  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  BANCO DE DADOS (Supabase)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │organizations │  │    users     │  │    leads     │      │
│  │  invitations │  │    cases     │  │   clients    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 CAMADAS E RESPONSABILIDADES

### 📱 CAMADA 1: Apresentação (UI)

**Responsabilidades:**
- Renderizar interface do usuário
- Capturar interações do usuário
- Exibir dados formatados
- Navegação entre telas

**Componentes:**
- `pages/` - Páginas completas
- `components/ui/` - Componentes de design system
- `components/layout/` - Estrutura de layout
- `components/features/` - Componentes específicos de features

**Regras:**
- ❌ NÃO deve conter lógica de negócio
- ❌ NÃO deve fazer chamadas diretas à API
- ✅ DEVE usar hooks para acessar dados e lógica
- ✅ DEVE ser stateless quando possível
- ✅ DEVE ser testável isoladamente

---

### 🎣 CAMADA 2: Lógica de Aplicação

**Responsabilidades:**
- Gerenciar estado da aplicação
- Orquestrar fluxos de dados
- Implementar regras de negócio
- Cache e otimizações

**Componentes:**
- `hooks/` - Custom hooks (useLeads, useCases, etc.)
- `contexts/` - Gerenciamento de estado global
- `services/` - Lógica de negócio isolada

**Regras:**
- ✅ DEVE encapsular lógica complexa
- ✅ DEVE ser reutilizável
- ✅ DEVE ter testes unitários
- ❌ NÃO deve conhecer detalhes de UI
- ❌ NÃO deve acessar DOM diretamente

---

### 🌐 CAMADA 3: Dados e Integrações

**Responsabilidades:**
- Comunicação com backend (Supabase)
- Persistência de dados
- Sincronização
- Cache de dados

**Componentes:**
- `lib/supabase.ts` - Cliente Supabase configurado
- `services/api/` - Serviços de API
- `types/models/` - Modelos de domínio

**Regras:**
- ✅ DEVE usar TypeScript types
- ✅ DEVE ter tratamento de erros
- ✅ DEVE implementar retry logic
- ✅ DEVE validar dados de entrada/saída
- ❌ NÃO deve expor detalhes de implementação

---

## 🔌 PADRÕES DE INTEGRAÇÃO

### 1. Hooks Customizados (Padrão Recomendado)

```typescript
// hooks/useLeads.ts
export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const data = await leadsService.getAll();
      setLeads(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const createLead = async (data: CreateLeadDto) => {
    return leadsService.create(data);
  };

  return { leads, loading, error, fetchLeads, createLead };
}
```

### 2. Services (Camada de Dados)

```typescript
// services/api/leads.service.ts
export const leadsService = {
  async getAll(): Promise<Lead[]> {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async create(lead: CreateLeadDto): Promise<Lead> {
    const { data, error } = await supabase
      .from('leads')
      .insert(lead)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};
```

### 3. Uso em Componentes

```typescript
// pages/Leads/LeadsPage.tsx
export function LeadsPage() {
  const { leads, loading, fetchLeads } = useLeads();

  useEffect(() => {
    fetchLeads();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <LeadsList leads={leads} />
    </div>
  );
}
```

---

## 🎨 DESIGN SYSTEM

### Componentes Base (ui/)

```
ui/
├── Button/
│   ├── Button.tsx
│   ├── Button.test.tsx
│   └── Button.stories.tsx
├── Input/
├── Card/
├── Modal/         ← Componente canônico para modais
└── ...
```

**Regras:**
- ✅ Componentes puros e reutilizáveis
- ✅ Suporte a variantes (primary, secondary, etc.)
- ✅ Acessibilidade (ARIA)
- ✅ Responsivo por padrão
- ✅ Documentado com Storybook (quando disponível)

### Modal Canônico (`@/components/ui/modal.tsx`)

**TODA modal nova DEVE usar este componente.** Não usar `createPortal` diretamente.

```tsx
import { Modal } from '@/components/ui/modal'

<Modal
  open={showModal}
  onClose={() => setShowModal(false)}
  title="Título da Modal"
  description="Descrição opcional"
  maxWidth="520px"
  footer={<>botões</>}
>
  {/* conteúdo */}
</Modal>
```

**Props disponíveis:**
| Prop | Tipo | Descrição |
|------|------|-----------|
| `open` | `boolean` | Controla visibilidade |
| `onClose` | `() => void` | Callback ao fechar (ESC, backdrop, X) |
| `title` | `string` | Título no header |
| `description` | `string` | Subtítulo opcional |
| `footer` | `ReactNode` | Área de botões de ação |
| `maxWidth` | `string` | Largura máxima (ex: `"520px"`) |
| `noPadding` | `boolean` | Remove padding do body |
| `className` | `string` | Classes extras |

**Implementação interna:** `createPortal` para `document.body`, z-index 9999, animação de entrada/saída 300ms, backdrop blur, ESC para fechar, body scroll lock.

---

## 🔐 SEGURANÇA

### Multi-Tenant Isolation

**Todas as operações devem respeitar o tenant (organization_id):**

```typescript
// ✅ CORRETO - Filtra por organização
const leads = await supabase
  .from('leads')
  .select('*')
  .eq('organization_id', currentUser.organizationId);

// ❌ ERRADO - Sem filtro de organização
const leads = await supabase
  .from('leads')
  .select('*');
```

### Row Level Security (RLS)

Todas as tabelas devem implementar RLS:

```sql
-- Exemplo: Leads por tenant
CREATE POLICY "Users can view own tenant leads"
  ON leads FOR SELECT
  USING (organization_id = (
    SELECT organization_id FROM users
    WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert own tenant leads"
  ON leads FOR INSERT
  WITH CHECK (organization_id = (
    SELECT organization_id FROM users
    WHERE id = auth.uid()
  ));

-- Exemplo: Fartech admins podem ver tudo
CREATE POLICY "Fartech admins can view all"
  ON leads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'fartech_admin'
    )
  );
```

### Sistema de Permissões

**Matriz de Permissões por Role:**

| Role | Usuários | Leads | Casos | Clientes | Docs | Config | Billing |
|------|----------|-------|-------|----------|------|--------|---------|
| **fartech_admin** | ✅ Todos | ✅ Todos | ✅ Todos | ✅ Todos | ✅ Todos | ✅ Todos | ✅ Todos |
| **org_owner** | ✅ Org | ✅ Org | ✅ Org | ✅ Org | ✅ Org | ✅ Org | ✅ Org |
| **org_admin** | ✅ Org | ✅ Org | ✅ Org | ✅ Org | ✅ Org | 👁️ Leitura | ❌ Não |
| **advogado** | 👁️ Leitura | ✏️ Editar | ✅ Gerenciar | ✏️ Editar | ✅ Gerenciar | ❌ Não | ❌ Não |
| **associado** | 👁️ Leitura | 👁️ Leitura | 👁️ Leitura | 👁️ Leitura | 👁️ Leitura | ❌ Não | ❌ Não |
| **administrativo** | 👁️ Leitura | ✅ Gerenciar | 👁️ Leitura | ✅ Gerenciar | 👁️ Leitura | ❌ Não | ❌ Não |

**Implementação com Hook:**

```typescript
// hooks/usePermissions.ts
export function usePermissions() {
  const { user } = useAuth();
  
  const can = (action: string, resource: string): boolean => {
    if (user.role === 'fartech_admin') return true;
    
    const permission = permissionsMatrix.find(
      p => p.role === user.role 
        && p.resource === resource 
        && p.action === action
    );
    
    return permission?.allowed || false;
  };
  
  return { can };
}

// Uso em componentes
function LeadsPage() {
  const { can } = usePermissions();
  
  return (
    <div>
      {can('create', 'leads') && (
        <Button onClick={handleCreate}>Novo Lead</Button>
      )}
    </div>
  );
}
```

### Autenticação

```typescript
// contexts/AuthContext.tsx
- useAuth() hook para acesso ao usuário
- Login/Logout centralizado
- Refresh token automático
- Protected routes
- Session management
```

### 🛡️ Guards de Rotas (v1.8.0)

**Ordem CRÍTICA de verificações nos Guards:**

```typescript
// components/guards/OrgActiveGuard.tsx

// ⚠️ ORDEM OBRIGATÓRIA DE VERIFICAÇÕES:
// 1. Loading de auth → aguarda
// 2. Usuário autenticado? → se não, vai para /login
// 3. Loading de org → aguarda  
// 4. Tem organização? → se não, vai para /no-organization
// 5. Org está ativa? → se não, vai para /org-suspended

export function OrgActiveGuard({ children }) {
  const { user, loading: authLoading } = useAuth()
  const { currentOrg, loading, isLoading } = useOrganization()
  const isFartechAdmin = useIsFartechAdmin()
  const isOrgActive = useIsOrgActive()

  // 1. Aguarda auth carregar
  if (authLoading) {
    return <LoadingSpinner />
  }

  // 2. Não autenticado → login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // 3. Aguarda org carregar
  if (loading || isLoading) {
    return <LoadingSpinner />
  }

  // 4. Fartech admin bypassa verificação de org
  if (isFartechAdmin) {
    return <>{children}</>
  }

  // 5. Sem organização → página de erro
  if (!currentOrg) {
    return <Navigate to="/no-organization" replace />
  }

  // 6. Org suspensa/cancelada → página de suspensão
  if (!isOrgActive) {
    return <Navigate to="/org-suspended" replace />
  }

  return <>{children}</>
}
```

**Fluxo de Redirecionamento:**
```
Usuário acessa /app/dashboard
         │
         ▼
   authLoading?  ──YES──→ Loading spinner
         │
        NO
         ▼
     user?  ────NO────→ /login
         │
        YES
         ▼
   orgLoading?  ──YES──→ Loading spinner
         │
        NO
         ▼
  isFartechAdmin? ─YES─→ ✅ Renderiza children
         │
        NO
         ▼
   currentOrg?  ──NO───→ /no-organization
         │
        YES
         ▼
   isOrgActive? ──NO───→ /org-suspended
         │
        YES
         ▼
   ✅ Renderiza children
```

### Auditoria (Audit Logs)

**Todas as ações críticas devem ser registradas:**

```typescript
// infrastructure/services/AuditLogService.ts
export class AuditLogService {
  async log(params: {
    action: string;
    resourceType: string;
    resourceId: string;
    userId: string;
    organizationId: string;
    oldValues?: any;
    newValues?: any;
  }) {
    await supabase.from('audit_logs').insert({
      ...params,
      ip_address: getUserIP(),
      user_agent: getUserAgent(),
      created_at: new Date()
    });
  }
}

// Uso em Use Cases
class CreateLeadUseCase {
  async execute(data: CreateLeadDto) {
    const lead = await this.leadRepo.create(data);
    
    // ✅ Log de auditoria
    await this.auditLog.log({
      action: 'create_lead',
      resourceType: 'leads',
      resourceId: lead.id,
      userId: currentUser.id,
      organizationId: currentUser.organizationId,
      newValues: lead
    });
    
    return lead;
  }
}
```

### Proteção de Rotas

```typescript
// components/ProtectedRoute.tsx
<Route path="/fartech/*" element={
  <RequireRole role="fartech_admin">
    <FartechRoutes />
  </RequireRole>
} />

<Route path="/equipe/*" element={
  <RequirePermission resource="users" action="manage">
    <TeamRoutes />
  </RequirePermission>
} />
```

---

## 🧪 TESTES

### Estrutura de Testes

```
tests/
├── unit/                    # Testes unitários
│   ├── components/
│   ├── hooks/
│   └── services/
├── integration/             # Testes de integração
│   └── flows/
└── e2e/                     # Testes end-to-end
    └── scenarios/
```

### Cobertura Mínima
- Components: 80%
- Hooks: 90%
- Services: 90%
- Utils: 95%

---

## 📊 MONITORAMENTO

### Métricas Essenciais
- Performance (Core Web Vitals)
- Erros e exceções
- Uso de recursos
- Tempo de resposta API

### Ferramentas
- Console de erros (Sentry/similar)
- Analytics (Posthog/similar)
- Logs do Supabase

---

## 🚀 DEPLOY — PROCESSO COMPLETO

> **⚠️ LEIA ANTES DE FAZER QUALQUER DEPLOY**
> O build remoto do Vercel (`npm run build`) **falha** com erros TypeScript (exit code 2).
> O processo correto usa **`--prebuilt`**: build local + envio do artefato pronto para o Vercel.
> NUNCA use `vercel deploy` sem `--prebuilt` — o deploy irá falhar.

---

### Pré-requisitos

| Item | Valor |
|---|---|
| Diretório do projeto | `/Users/fernandodias/Desktop/SDR JURIDICO/Sdr juridico` |
| Node | v20+ (via nvm) |
| Vercel CLI | v50.22.1+ (`npx vercel --version`) |
| Git user.email | **`contato@fartech.app.br`** (obrigatório — outro email é rejeitado pelo Vercel) |
| Repositório | `fartech2025/SDR-Juridico`, branch `main` |
| URL de produção | `https://sdr-juridico.vercel.app` |

---

### Passo 1 — Verificar configuração do Git

Antes de qualquer commit, confirmar que o email do autor está correto:

```bash
git config user.email
# deve retornar: contato@fartech.app.br

# Se retornar outro email, corrigir com:
git config user.email "contato@fartech.app.br"
git config user.name "FarTech"
```

> **Por quê?** O Vercel vincula deploys ao autor do commit. Commits com `frpdias@icloud.com`
> ou qualquer outro email fora do `fartech2025` serão bloqueados pelo Vercel Linked Account.

---

### Passo 2 — Pull + Sync com o repositório remoto

```bash
cd "/Users/fernandodias/Desktop/SDR JURIDICO/Sdr juridico"

# 1. Verificar estado local antes de qualquer coisa
git status

# 2. Fazer pull para trazer possíveis commits do remoto
git pull origin main

# Resultado esperado quando não há novidades:
# Already up to date.

# Resultado quando há novidades:
# Fast-forward
#  src/algum-arquivo.tsx | 10 ++++---
#  1 file changed, 7 insertions(+), 3 deletions(-)
```

> **Se houver conflitos após o pull:**
> ```bash
> git status                    # ver arquivos em conflito
> # Editar cada arquivo, resolver os conflitos marcados com <<< === >>>
> git add .
> git commit -m "fix: resolve merger conflict em X"
> ```

---

### Passo 3 — Desenvolver e commitar as mudanças

```bash
# Após fazer as alterações no código, commitar seguindo Conventional Commits:
git add .
git commit -m "feat: descrição da nova feature"
# ou
git commit -m "fix: descrição do bug corrigido"
# ou
git commit -m "chore: ajuste de configuração"

# Enviar para o remoto
git push origin main
```

**Prefixos Conventional Commits usados no projeto:**

| Prefixo | Uso |
|---|---|
| `feat:` | Nova funcionalidade |
| `fix:` | Correção de bug |
| `chore:` | Scripts, configs, deps — sem mudança no código |
| `refactor:` | Refatoração sem alterar comportamento |
| `style:` | CSS/Tailwind — sem lógica |
| `docs:` | Só documentação |

> **Se o push for rejeitado (remote has diverged):**
> ```bash
> git pull --rebase origin main   # rebasa local em cima do remoto
> git push origin main            # empurra normalmente
> ```

---

### Passo 4 — Build local

```bash
cd "/Users/fernandodias/Desktop/SDR JURIDICO/Sdr juridico"

node_modules/.bin/vite build
```

**Saída esperada em caso de sucesso:**
```
vite v7.x.x building for production...
✓ 1234 modules transformed.
dist/index.html                  0.50 kB
dist/assets/index-[hash].js    856.23 kB
dist/assets/index-[hash].css    98.12 kB
✓ built in 5.20s
```

> **Se o build falhar:**
> - Erros de TypeScript — corrigir o erro indicado
> - Erros de import — verificar se o arquivo existe e o caminho está correto
> - Nunca ignorar erros de build — o deploy publicaria código quebrado

---

### Passo 5 — Preparar artefato para deploy (`--prebuilt`)

O Vercel `--prebuilt` exige que os arquivos estejam em `.vercel/output/static/`:

```bash
cd "/Users/fernandodias/Desktop/SDR JURIDICO/Sdr juridico"

# Limpar saída anterior e copiar dist/ para o diretório esperado pelo Vercel
rm -rf .vercel/output/static
mkdir -p .vercel/output/static
cp -r dist/. .vercel/output/static/
```

> **Por quê `.vercel/output/static/`?**
> O Vercel CLI, ao receber `--prebuilt`, procura os artefatos de build em `.vercel/output/`.
> O subdiretório `static/` corresponde a um site estático (SPA). O `vercel.json` na raiz
> define as rewrites para `index.html`, garantindo que o React Router funcione.

---

### Passo 6 — Deploy para produção

```bash
cd "/Users/fernandodias/Desktop/SDR JURIDICO/Sdr juridico"

vercel deploy --prebuilt --prod --yes
```

**Saída esperada:**
```
Vercel CLI 50.x.x
🔍  Inspect: https://vercel.com/fartechs-projects-c64e0af4/sdr-juridico/HASH [2s]
✅  Production: https://sdr-juridico-HASH-fartechs-projects-c64e0af4.vercel.app [10s]
```

> Anote a URL de deployment gerada (ex: `sdr-juridico-dobvq4hlc-fartechs-projects-c64e0af4.vercel.app`).
> Ela será usada no próximo passo.

---

### Passo 7 — Apontar o alias de produção

O Vercel gera uma URL única por deployment. É necessário apontar o alias fixo para essa URL:

```bash
vercel alias set <URL-DO-DEPLOYMENT-ACIMA> sdr-juridico.vercel.app

# Exemplo real:
vercel alias set sdr-juridico-dobvq4hlc-fartechs-projects-c64e0af4.vercel.app sdr-juridico.vercel.app
```

**Saída esperada:**
```
> Success! https://sdr-juridico.vercel.app now points to https://sdr-juridico-HASH-fartechs-projects-c64e0af4.vercel.app [2s]
```

> **Por quê é necessário?**
> Cada deploy cria uma URL única imutável. O alias `sdr-juridico.vercel.app` precisa ser
> redirecionado manualmente para o deployment mais recente. Sem isso, a URL de produção
> continuaria apontando para o deploy anterior.

---

### Fluxo completo em um bloco (copy-paste)

```bash
# === DEPLOY COMPLETO SDR JURÍDICO ===
# Copiar e colar este bloco inteiro no terminal

cd "/Users/fernandodias/Desktop/SDR JURIDICO/Sdr juridico"

# 1. Garantir email correto
git config user.email "contato@fartech.app.br"

# 2. Sync com remoto
git pull origin main

# 3. (Opcional) Commitar mudanças locais pendentes
# git add . && git commit -m "feat: descrição" && git push origin main

# 4. Build
node_modules/.bin/vite build

# 5. Preparar artefato prebuilt
rm -rf .vercel/output/static && mkdir -p .vercel/output/static && cp -r dist/. .vercel/output/static/

# 6. Deploy
vercel deploy --prebuilt --prod --yes
# --> Anote a URL de deployment gerada (sdr-juridico-XXXX.vercel.app)

# 7. Apontar alias (substituir XXXX pela URL gerada acima)
# vercel alias set sdr-juridico-XXXX-fartechs-projects-c64e0af4.vercel.app sdr-juridico.vercel.app
```

---

### Troubleshooting de Deploy

| Sintoma | Causa provável | Solução |
|---|---|---|
| `Error: Your account is not authorized to deploy` | Email do git errado | `git config user.email "contato@fartech.app.br"` |
| `Build failed with exit code 2` | Erros TypeScript no Vercel | Usar `--prebuilt` (nunca deploy sem ele) |
| `Error: No Output Directory named "dist"` não encontrado | Build não foi rodado | Executar `node_modules/.bin/vite build` antes |
| Alias aponta para deploy antigo | Esqueceu o Passo 7 | Rodar `vercel alias set <nova-url> sdr-juridico.vercel.app` |
| `ENOENT: .vercel/output/static` | Diretório não criado | `mkdir -p .vercel/output/static` antes do `cp` |
| `git push` rejeitado — `non-fast-forward` | Remoto tem commits que local não tem | `git pull --rebase origin main` e depois `git push` |
| Tela branca após deploy | Rota não registrada em `router.tsx` | Verificar se a rota existe como filho do AppShell |

---

### Verificação pós-deploy

Após o alias ser configurado, validar:

1. Acessar https://sdr-juridico.vercel.app
2. Fazer login com uma conta ativa
3. Navegar para `/app/dashboard` — confirmar que carrega sem tela branca
4. Se for admin Fartech, navegar para `/admin/organizations` — confirmar sidebar

---

## �📈 PERFORMANCE

### Otimizações
- ✅ Code splitting por rota
- ✅ Lazy loading de componentes
- ✅ Memoização (useMemo, useCallback)
- ✅ Virtualização de listas longas
- ✅ Cache de dados (React Query/SWR)
- ✅ Compressão de assets
- ✅ CDN para assets estáticos

---

## 🔄 VERSIONAMENTO

### Semantic Versioning (SemVer)

```
MAJOR.MINOR.PATCH
1.0.0

MAJOR: Breaking changes
MINOR: New features (backwards compatible)
PATCH: Bug fixes
```

---

## 📚 DOCUMENTAÇÃO

### Docs Obrigatórias
- ✅ README.md - Overview do projeto
- ✅ ARQUITETURA_CANONICA.md - Este documento
- ✅ CONTRIBUTING.md - Guia de contribuição
- ✅ CHANGELOG.md - Histórico de mudanças
- ✅ API.md - Documentação da API

---

## 🎯 PRÓXIMOS PASSOS

### Fase 1: Estruturação (Atual)
- [ ] Validar estrutura de diretórios
- [ ] Documentar componentes existentes
- [ ] Criar guia de estilo de código

### Fase 2: Refatoração
- [ ] Migrar componentes para estrutura canônica
- [ ] Implementar hooks customizados
- [ ] Separar services da camada de apresentação

### Fase 3: Qualidade
- [ ] Implementar testes unitários
- [ ] Implementar testes de integração
- [ ] Setup de CI/CD

### Fase 4: Otimização
- [ ] Performance audit
- [ ] Acessibilidade (a11y) audit
- [ ] SEO optimization

---

## 🗄️ MODELO DE DADOS (Multi-Tenant)

### 📐 Diagrama ER Completo

```mermaid
erDiagram
    %% CORE MULTI-TENANT
    orgs ||--o{ org_members : "tem membros"
    orgs ||--o{ leads : "possui"
    orgs ||--o{ clientes : "possui"
    orgs ||--o{ casos : "possui"
    orgs ||--o{ documentos : "possui"
    orgs ||--o{ agenda : "possui"
    orgs ||--o{ tarefas : "possui"
    orgs ||--o{ audit_logs : "registra"
    orgs ||--o{ org_features : "habilita"
    
    %% USUÁRIOS E PERMISSÕES
    usuarios ||--o{ org_members : "participa"
    usuarios ||--o{ active_sessions : "tem sessões"
    usuarios ||--o{ audit_logs : "executa ações"
    usuarios ||--o{ analytics_events : "gera eventos"
    roles ||--o{ org_members : "define papel"
    roles ||--o{ role_permissions : "possui"
    permissions ||--o{ role_permissions : "pertence a"
    
    %% RELAÇÕES DE NEGÓCIO
    leads }o--|| usuarios : "responsavel"
    leads ||--o{ casos : "converte em"
    clientes ||--o{ casos : "possui"
    clientes ||--o{ agenda : "agendado com"
    casos ||--o{ documentos : "contém"
    casos ||--o{ timeline_events : "registra eventos"
    casos ||--o{ agenda : "agenda"
    casos ||--o{ notificacoes : "gera"
    casos ||--o{ tarefas : "possui"
    
    %% TAREFAS E DOCUMENTOS
    tarefas ||--o{ tarefa_documentos : "solicita"
    tarefa_documentos }o--|| documentos : "vincula"
    
    %% PROCESSOS JURÍDICOS
    casos ||--o{ processos_favoritos : "monitora"
    processos_favoritos ||--o{ historico_consultas : "histórico"
    processos_favoritos ||--o{ movimentacoes_detectadas : "detecta"
    
    orgs {
        uuid id PK
        varchar name
        varchar slug UK
        varchar cnpj UK
        varchar email
        varchar plan "trial,basic,pro,enterprise"
        varchar status "pending,active,suspended,cancelled"
        integer max_users
        integer max_storage_gb
        jsonb settings
        timestamp created_at
    }
    
    org_members {
        uuid id PK
        uuid org_id FK
        uuid user_id FK
        varchar role "admin,gestor,advogado,secretaria,leitura"
        boolean ativo
        uuid invited_by FK
        timestamp created_at
    }
    
    usuarios {
        uuid id PK
        varchar nome_completo
        varchar email UK
        varchar telefone
        text[] permissoes "fartech_admin,org_admin,user"
        varchar status "ativo,inativo,suspenso"
        jsonb preferencias
        timestamp ultimo_acesso
    }
    
    leads {
        uuid id PK
        uuid org_id FK
        varchar nome
        varchar email
        varchar telefone
        varchar status "novo,em_contato,qualificado,proposta,ganho,perdido"
        varchar heat "quente,morno,frio"
        varchar origem
        uuid assigned_user_id FK
        text observacoes
        timestamp last_contact_at
        timestamp deleted_at "SOFT DELETE"
        uuid deleted_by FK "SOFT DELETE"
        timestamp created_at
        timestamp updated_at
    }
    
    lead_status_history {
        uuid id PK
        timestamp created_at
        uuid lead_id FK
        uuid org_id FK
        text status_anterior
        text status_novo
        text heat_anterior
        text heat_novo
        uuid changed_by FK
        text changed_by_name
        text motivo
        jsonb metadata
    }
    
    leads ||--o{ lead_status_history : "histórico"
    
    clientes {
        uuid id PK
        uuid org_id FK
        varchar nome
        varchar email
        varchar cnpj
        varchar cpf
        varchar endereco
        varchar status "ativo,em_risco,inativo"
        timestamp created_at
    }
    
    casos {
        uuid id PK
        uuid org_id FK
        uuid cliente_id FK
        uuid lead_id FK
        varchar titulo
        text descricao
        varchar area
        varchar status "aberto,em_andamento,resolvido,fechado"
        varchar prioridade "baixa,media,alta,critica"
        decimal valor
        text[] tags
        text responsavel
        timestamp data_abertura
    }
    
    documentos {
        uuid id PK
        uuid org_id FK
        uuid caso_id FK
        uuid cliente_id FK "NOVO v1.6"
        uuid lead_id FK "NOVO v1.6"
        varchar titulo
        varchar tipo
        varchar status "pendente,aprovado,rejeitado,solicitado,completo"
        text url
        varchar arquivo_nome
        integer arquivo_tamanho
        varchar numero_id "NOVO v1.7 - ID interno gerado"
        jsonb meta "NOVO v1.7 - visualizado, visualizado_at, etc"
        text[] tags
        timestamp created_at
        timestamp deleted_at "SOFT DELETE v1.6"
        uuid deleted_by FK "SOFT DELETE v1.6"
    }
    
    tarefas {
        uuid id PK
        uuid org_id FK
        uuid caso_id FK
        uuid assigned_user_id FK
        varchar titulo
        text descricao
        varchar status "pendente,em_andamento,aguardando_validacao,concluida,cancelada,devolvida"
        varchar prioridade "baixa,normal,alta"
        timestamp due_at
        timestamp submitted_at
        timestamp confirmed_at
        uuid confirmed_by FK
        text rejected_reason
        timestamp deleted_at "SOFT DELETE"
        uuid deleted_by FK "SOFT DELETE"
    }
    
    tarefa_status_history {
        uuid id PK
        timestamp created_at
        uuid tarefa_id FK
        uuid org_id FK
        text status_anterior
        text status_novo
        uuid changed_by FK
        text motivo
        jsonb metadata
    }
    
    tarefas ||--o{ tarefa_status_history : "histórico"
    
    tarefa_documentos {
        uuid id PK
        uuid org_id FK
        uuid tarefa_id FK
        uuid documento_id FK
        text label
        boolean solicitado
        boolean entregue
        timestamp delivered_at
    }
    
    agenda {
        uuid id PK
        uuid org_id FK
        uuid cliente_id FK
        uuid caso_id FK
        varchar titulo
        varchar tipo "reuniao,ligacao,audiencia,prazo"
        timestamp data_inicio
        timestamp data_fim
        varchar status "confirmado,pendente,cancelado"
        text responsavel
    }
    
    timeline_events {
        uuid id PK
        uuid org_id FK
        uuid caso_id FK
        varchar titulo
        text descricao
        varchar categoria "docs,agenda,comercial,juridico"
        timestamp data_evento
    }
    
    notificacoes {
        uuid id PK
        uuid org_id FK
        uuid caso_id FK
        uuid cliente_id FK
        varchar titulo
        varchar prioridade "P0,P1,P2"
        boolean lida
        text usuario_responsavel
        timestamp data_notificacao
    }
    
    audit_logs {
        uuid id PK
        uuid org_id FK
        uuid user_id FK
        varchar action "create,update,delete,login"
        varchar entity_type
        uuid entity_id
        jsonb old_data
        jsonb new_data
        inet ip_address
        timestamp created_at
    }
    
    alertas {
        uuid id PK
        uuid org_id FK
        uuid user_id FK "NULL = org-wide"
        varchar tipo "datajud_movimento,dou_publicacao,tarefa_vencida,caso_critico,lead_esfriando"
        varchar prioridade "P0,P1,P2"
        varchar titulo
        text descricao
        varchar entidade "lead,caso,tarefa,documento"
        uuid entidade_id
        text action_href
        boolean lida
        timestamp created_at
    }
    
    lead_scoring_configs {
        uuid id PK
        uuid org_id FK UK
        jsonb config "pesos: recency, value, area, channel, interaction, completeness"
        timestamp created_at
        timestamp updated_at
    }
    
    roles {
        uuid id PK
        varchar name UK
        varchar display_name
        boolean is_system
    }
    
    permissions {
        uuid id PK
        varchar name UK
        varchar resource "leads,casos,clientes"
        varchar action "create,read,update,delete"
    }
    
    role_permissions {
        uuid role_id FK
        uuid permission_id FK
    }
    
    org_features {
        uuid id PK
        uuid org_id FK
        varchar feature_key
        boolean enabled
        jsonb metadata
    }
    
    active_sessions {
        uuid id PK
        uuid user_id FK
        uuid org_id FK
        varchar session_token
        inet ip_address
        timestamp last_activity
        timestamp expires_at
    }
    
    analytics_events {
        uuid id PK
        uuid org_id FK
        uuid user_id FK
        uuid session_id
        varchar event_name
        varchar event_type "page_view,button_click,feature_used"
        jsonb properties
        timestamp created_at
    }
    
    processos_favoritos {
        uuid id PK
        uuid caso_id FK
        varchar numero_processo
        varchar tipo_processo
        boolean notificacoes_ativas
        timestamp created_at
    }
    
    historico_consultas {
        uuid id PK
        uuid processo_id FK
        jsonb dados_consulta
        timestamp created_at
    }
    
    movimentacoes_detectadas {
        uuid id PK
        uuid processo_id FK
        text descricao
        boolean lida
        timestamp data_movimentacao
    }
    
    cache_cnpj {
        varchar cnpj PK
        jsonb dados
        timestamp expires_at
    }
```

### 🎯 Análise de Engenharia da Estrutura

#### ✅ Pontos Fortes da Arquitetura Atual

1. **Multi-tenancy Robusto**
   - Isolamento completo por `org_id` em todas as tabelas de negócio
   - Sistema de membros (`org_members`) com roles granulares
   - RLS (Row Level Security) implementado consistentemente

2. **Auditoria e Observabilidade**
   - `audit_logs`: Rastreamento completo de ações
   - `analytics_events`: Tracking de comportamento
   - `active_sessions`: Gerenciamento de sessões ativas

3. **RBAC Dinâmico**
   - Tabelas `roles`, `permissions`, `role_permissions`
   - Permite configuração flexível de permissões
   - Roles do sistema protegidas (`is_system`)

4. **Gestão de Features**
   - `org_features`: Feature flags por organização
   - Permite habilitar/desabilitar funcionalidades por plano

5. **Workflow de Tarefas**
   - Sistema de aprovação com estados (pendente → submetida → confirmada/devolvida)
   - Solicitação de documentos por tarefa
   - Rastreamento de quem confirmou e quando

#### ⚠️ Pontos de Atenção e Melhorias Sugeridas

1. **Inconsistências de Nomenclatura**
   ```sql
   -- PROBLEMA: Mistura de português e inglês
   ❌ leads.heat (inglês) vs casos.prioridade (português)
   ❌ agenda (português) vs active_sessions (inglês)
   ❌ clientes (português) vs users (inglês)
   
   -- SOLUÇÃO: Padronizar para inglês
   ✅ leads, clients, cases, schedules, users
   OU manter português completo
   ✅ leads, clientes, casos, agendamentos, usuarios
   ```

2. **Campos Faltando em Algumas Tabelas**
   ```sql
   -- usuarios: Falta org_id (está em org_members)
   -- Recomendação: Manter como está, pois um usuário pode
   -- pertencer a múltiplas orgs via org_members
   
   -- clientes: Faltam campos de saúde/status conforme schema
   ALTER TABLE clientes ADD COLUMN IF NOT EXISTS health VARCHAR(20) 
     CHECK (health IN ('ok', 'atencao', 'critico'));
   ```

3. **Índices de Performance**
   ```sql
   -- ADICIONAR índices compostos para queries comuns:
   CREATE INDEX idx_casos_org_status_priority 
     ON casos(org_id, status, prioridade);
   
   CREATE INDEX idx_leads_org_status_created 
     ON leads(org_id, status, created_at DESC);
   
   CREATE INDEX idx_agenda_org_responsavel_data 
     ON agenda(org_id, responsavel, data_inicio);
   
   -- Índices para full-text search:
   CREATE INDEX idx_casos_titulo_fts 
     ON casos USING GIN (to_tsvector('portuguese', titulo));
   ```

4. **Soft Delete Pattern**
   ```sql
   -- Implementar soft delete em tabelas críticas
   ALTER TABLE clientes ADD COLUMN deleted_at TIMESTAMPTZ;
   ALTER TABLE casos ADD COLUMN deleted_at TIMESTAMPTZ;
   ALTER TABLE leads ADD COLUMN deleted_at TIMESTAMPTZ;
   
   -- Views para dados ativos
   CREATE VIEW clientes_ativos AS 
     SELECT * FROM clientes WHERE deleted_at IS NULL;
   ```

5. **Versionamento de Documentos**
   ```sql
   -- Adicionar versionamento a documentos
   ALTER TABLE documentos ADD COLUMN version INTEGER DEFAULT 1;
   ALTER TABLE documentos ADD COLUMN parent_id UUID 
     REFERENCES documentos(id);
   
   CREATE INDEX idx_documentos_parent_version 
     ON documentos(parent_id, version DESC);
   ```

6. **Notificações em Tempo Real**
   ```sql
   -- Adicionar suporte a WebSocket/Realtime
   CREATE TABLE notification_subscriptions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES usuarios(id),
     org_id UUID REFERENCES orgs(id),
     channel TEXT NOT NULL,
     subscription_data JSONB,
     created_at TIMESTAMPTZ DEFAULT now()
   );
   ```

7. **Cache de Relacionamentos**
   ```sql
   -- Desnormalização estratégica para performance
   ALTER TABLE casos ADD COLUMN cliente_nome TEXT;
   ALTER TABLE casos ADD COLUMN advogado_nome TEXT;
   
   -- Trigger para manter sincronizado
   CREATE TRIGGER update_caso_cliente_nome
     AFTER UPDATE ON clientes
     FOR EACH ROW
     EXECUTE FUNCTION sync_caso_cliente_nome();
   ```

8. **Limites e Quotas**
   ```sql
   -- Tabela para rastrear uso de quotas
   CREATE TABLE org_quotas_usage (
     org_id UUID PRIMARY KEY REFERENCES orgs(id),
     cases_count INTEGER DEFAULT 0,
     users_count INTEGER DEFAULT 0,
     storage_used_mb BIGINT DEFAULT 0,
     updated_at TIMESTAMPTZ DEFAULT now()
   );
   
   -- Função para validar limites
   CREATE FUNCTION check_org_limits()
   RETURNS TRIGGER AS $$
   BEGIN
     -- Validar se org não excedeu limites do plano
     -- Retornar erro se excedeu
   END;
   $$ LANGUAGE plpgsql;
   ```

#### 🚀 Recomendações de Implementação

**FASE 1: Normalização (1 semana)**
- [ ] Padronizar nomenclatura de tabelas e colunas
- [ ] Adicionar campos faltantes conforme schema
- [ ] Criar migration de correção

**FASE 2: Performance (1 semana)**
- [ ] Adicionar índices compostos
- [ ] Implementar full-text search
- [ ] Criar views materializadas para dashboards

**FASE 3: Features Avançadas (2 semanas)**
- [ ] Implementar soft delete
- [ ] Versionamento de documentos
- [ ] Sistema de quotas e limites
- [ ] Notificações em tempo real

**FASE 4: Segurança e Auditoria (1 semana)**
- [ ] Review completo de RLS policies
- [ ] Implementar rate limiting no DB
- [ ] Adicionar logs de acesso sensível
- [ ] Criptografia de campos sensíveis

### 🔐 Row Level Security (RLS) - Status Atual

Todas as tabelas principais implementam RLS:
- ✅ `orgs`, `org_members`, `usuarios`
- ✅ `leads`, `clientes`, `casos`
- ✅ `documentos`, `agenda`, `tarefas`
- ✅ `audit_logs`, `analytics_events`
- ✅ `roles`, `permissions`, `role_permissions`

**Policy Crítica para org_members:**
```sql
-- Usuários podem ver seus próprios registros de membership
-- IMPORTANTE: Sem isso, usuários não conseguem ver a qual org pertencem
CREATE POLICY "users_see_own_membership" ON org_members
  FOR SELECT USING (user_id = auth.uid());
```

**Padrão de Policies:**
```sql
-- 1. Fartech admins veem tudo
CREATE POLICY "fartech_admin_all" ON [tabela]
  FOR ALL USING (
    EXISTS (SELECT 1 FROM usuarios 
      WHERE id = auth.uid() 
      AND 'fartech_admin' = ANY(permissoes))
  );

-- 2. Membros da org veem dados da org
CREATE POLICY "org_members_own_data" ON [tabela]
  FOR SELECT USING (
    is_org_member(org_id)
  );

-- 3. Admins da org fazem tudo na org
CREATE POLICY "org_admin_manage" ON [tabela]
  FOR ALL USING (
    is_org_admin_for_org(org_id)
  );
```

---

## 📅 INTEGRAÇÃO GOOGLE CALENDAR (v2.1.0)

### 1. Arquitetura da Integração

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  ConfigPage.tsx                                     │    │
│  │  - Botão "Vincular Google Calendar"                 │    │
│  │  - Redireciona para Edge Function OAuth             │    │
│  │  - Recebe callback ?google_calendar=connected       │    │
│  └──────────────────────┬──────────────────────────────┘    │
│                         │                                    │
│  ┌──────────────────────▼──────────────────────────────┐    │
│  │  useGoogleCalendarCreate.ts                          │    │
│  │  - Hook para criar eventos no Google Calendar        │    │
│  │  - Envia user_id e org_id para Edge Function         │    │
│  │  - Tokens resolvidos server-side (tabela integrations)│    │
│  └──────────────────────┬──────────────────────────────┘    │
└─────────────────────────┼───────────────────────────────────┘
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────┐
│         SUPABASE EDGE FUNCTIONS (Google Calendar)           │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  google-calendar-oauth/index.ts                     │    │
│  │  - Fase 1: Redireciona para Google OAuth            │    │
│  │  - Fase 2: Troca code por tokens                    │    │
│  │  - UPSERT: Cria/atualiza registro em `integrations` │    │
│  │  - Busca por org_id + provider (NÃO por ID)         │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  google-calendar-sync/index.ts                      │    │
│  │  - Sync manual de eventos (POST com auth)           │    │
│  │  - Verifica role: admin, org_admin, gestor           │    │
│  │  - Busca tokens da tabela `integrations`            │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  google-calendar-create-event/index.ts              │    │
│  │  - Cria evento no Google Calendar                   │    │
│  │  - Token: APENAS tabela integrations (org OAuth)    │    │
│  │  - Refresh automático se token expirado             │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  google-calendar-sync-cron/index.ts                 │    │
│  │  - Sync automático periódico (cron)                 │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  store-google-tokens/index.ts                       │    │
│  │  - Salva tokens OAuth no user_metadata (backup)     │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Google Calendar API (googleapis.com)            │
│  - OAuth 2.0 com refresh_token (access_type=offline)        │
│  - Scopes: calendar, calendar.events                        │
└─────────────────────────────────────────────────────────────┘
```

### 2. Fluxo OAuth Completo

```
1. Usuário clica "Vincular Google Calendar" em /app/config

2. Frontend redireciona para Edge Function:
   GET /functions/v1/google-calendar-oauth
     ?integration_id=<localStorage_id>  (opcional, compatibilidade)
     &org_id=<uuid>                     (OBRIGATÓRIO)
     &return_to=https://sdr-juridico.vercel.app/app/config

3. Edge Function redireciona para Google OAuth:
   → accounts.google.com/o/oauth2/v2/auth
   → Scopes: calendar + calendar.events
   → access_type=offline (refresh_token)
   → state={org_id, return_to} (base64)

4. Usuário autoriza no Google → callback com code

5. Edge Function troca code por tokens:
   POST https://oauth2.googleapis.com/token

6. Edge Function faz UPSERT no banco:
   - SELECT FROM integrations WHERE org_id=? AND provider='google_calendar'
   - Se existe → UPDATE (secrets, enabled=true)
   - Se não existe → INSERT (cria registro novo)

7. Redireciona de volta:
   → https://sdr-juridico.vercel.app/app/config?google_calendar=connected

8. ConfigPage detecta ?google_calendar=connected:
   - Exibe toast de sucesso
   - Marca integração no localStorage como enabled=true
```

### 3. Armazenamento de Tokens (Fonte Única — v2.3.2)

> **IMPORTANTE**: Desde v2.3.2, a Edge Function `google-calendar-create-event` usa
> **exclusivamente** tokens da tabela `integrations`. Os paths `directToken` (localStorage)
> e `user_metadata` foram removidos porque esses tokens pertencem ao projeto GCP do Supabase
> (450955346215) onde a Google Calendar API não está habilitada. Apenas tokens obtidos via
> nosso OAuth customizado (projeto GCP 410413435637) funcionam.

```
┌─────────────────────────────────────────────────────────┐
│  FONTE ÚNICA: Tabela `integrations`                     │
│  - org_id + provider='google_calendar'                  │
│  - secrets: {access_token, refresh_token, expires_at}   │
│  - Tokens obtidos via OAuth customizado (google-calendar│
│    -oauth Edge Function) com NOSSO Client ID/Secret     │
│  - Projeto GCP: 410413435637 (Calendar API habilitada)  │
│  - Usada por: Edge Functions (sync, create-event)       │
│  - RLS: membros da org podem ler, admins podem escrever │
│  - Refresh automático via getOrgToken() se expirado     │
└─────────────────────────────────────────────────────────┘

⚠️  DESCONTINUADOS (v2.3.2):
┌─────────────────────────────────────────────────────────┐
│  ❌ user_metadata (tokens do Supabase Auth)             │
│  - Pertencem ao projeto GCP do Supabase (450955346215)  │
│  - Calendar API NÃO habilitada nesse projeto            │
│  - store-google-tokens Edge Function ainda existe mas   │
│    tokens salvos NÃO são usados para criar eventos      │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│  ❌ localStorage (removido do frontend)                 │
│  - google_calendar_token: REMOVIDO em v2.3.2            │
│  - useGoogleCalendarCreate NÃO lê mais do localStorage  │
│  - Tokens ficam apenas server-side (tabela integrations) │
└─────────────────────────────────────────────────────────┘
```

### 4. Configuração Google Cloud Console

```
Google Cloud Project:
  - Client ID: <GOOGLE_CLIENT_ID> (ver Supabase Secrets)
  - Authorized Redirect URIs:
    • https://xocqcoebreoiaqxoutar.supabase.co/functions/v1/google-calendar-oauth
  - Authorized JavaScript Origins:
    • https://sdr-juridico.vercel.app
    • http://localhost:5173
  - OAuth Consent Screen: External (em verificação)
  - Test Users: configurados no Google Cloud Console
```

### 5. Edge Functions Deploy

```bash
# Todas deployadas com --no-verify-jwt (auth manual dentro das funções)
npx supabase functions deploy google-calendar-oauth --project-ref xocqcoebreoiaqxoutar --no-verify-jwt
npx supabase functions deploy google-calendar-sync --project-ref xocqcoebreoiaqxoutar --no-verify-jwt
npx supabase functions deploy google-calendar-sync-cron --project-ref xocqcoebreoiaqxoutar --no-verify-jwt
npx supabase functions deploy google-calendar-create-event --project-ref xocqcoebreoiaqxoutar --no-verify-jwt
npx supabase functions deploy store-google-tokens --project-ref xocqcoebreoiaqxoutar --no-verify-jwt

# Edge Functions de Gestão de Organizações (v2.5.0)
npx supabase functions deploy delete-organization --project-ref xocqcoebreoiaqxoutar --no-verify-jwt
npx supabase functions deploy reset-member-password --project-ref xocqcoebreoiaqxoutar --no-verify-jwt
```

### 6. Secrets Configurados no Supabase

```bash
npx supabase secrets set \
  GOOGLE_CLIENT_ID="<valor do Google Cloud Console>" \
  GOOGLE_CLIENT_SECRET="<valor do Google Cloud Console>" \
  GOOGLE_REDIRECT_URI="https://xocqcoebreoiaqxoutar.supabase.co/functions/v1/google-calendar-oauth" \
  APP_URL="https://sdr-juridico.vercel.app" \
  --project-ref xocqcoebreoiaqxoutar
```

### 7. Decisão Arquitetural: localStorage vs DB

> **Contexto**: O `integrationsService.ts` armazena integrações em **localStorage** (não no banco).
> Os Edge Functions leem/escrevem na tabela **`integrations`** do Supabase.
>
> **Solução adotada**: O fluxo OAuth cria/atualiza o registro diretamente no banco via UPSERT
> (org_id + provider), independente do ID gerado pelo localStorage. Após o OAuth bem-sucedido,
> o frontend sincroniza o estado do localStorage para manter a UI consistente.
>
> **Futuro**: Migrar `integrationsService.ts` para usar Supabase em vez de localStorage,
> seguindo o padrão da Camada 3 (Dados e Integrações) da arquitetura canônica.

---

## � INTEGRAÇÃO MICROSOFT TEAMS (v2.3.0)

### 1. Arquitetura da Integração

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  TeamsQuickCreate.tsx / MeetingCreatorForm.tsx      │    │
│  │  - Criação rápida de reuniões Teams                 │    │
│  │  - Integrado à AgendaPage para agendamentos         │    │
│  └──────────────────────┬──────────────────────────────┘    │
│                         │                                    │
│  ┌──────────────────────▼──────────────────────────────┐    │
│  │  useTeamsMeetingCreate.ts                           │    │
│  │  - createMeeting(): Cria reunião via Edge Function  │    │
│  │  - Gerencia loading/error states                    │    │
│  └──────────────────────┬──────────────────────────────┘    │
│                         │                                    │
│  ┌──────────────────────▼──────────────────────────────┐    │
│  │  useTeamsSync.ts                                    │    │
│  │  - Sincronização de eventos com calendário Teams    │    │
│  └──────────────────────┬──────────────────────────────┘    │
└─────────────────────────┼───────────────────────────────────┘
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────┐
│         SUPABASE EDGE FUNCTIONS (Microsoft Teams)           │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  teams-oauth/index.ts                               │    │
│  │  - Fase 1: Redireciona para Microsoft OAuth         │    │
│  │  - Fase 2: Troca code por tokens                    │    │
│  │  - UPSERT: Cria/atualiza registro em `integrations` │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  teams-create-event/index.ts                        │    │
│  │  - Cria reunião online no Microsoft Teams           │    │
│  │  - Retorna link da reunião para inclusão no evento  │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────────┬──────────────────────────────────┘
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Microsoft Graph API (graph.microsoft.com)       │
│  - OAuth 2.0 com refresh_token                              │
│  - Scopes: OnlineMeetings.ReadWrite, Calendars.ReadWrite    │
└─────────────────────────────────────────────────────────────┘
```

### 2. Edge Functions Deploy

```bash
# Deploy com --no-verify-jwt
npx supabase functions deploy teams-oauth --project-ref xocqcoebreoiaqxoutar --no-verify-jwt
npx supabase functions deploy teams-create-event --project-ref xocqcoebreoiaqxoutar --no-verify-jwt
```

### 3. Componentes Frontend

| Componente | Descrição |
|------------|-----------|
| `TeamsQuickCreate.tsx` | Botão/form para criação rápida de reunião Teams |
| `MeetingCreatorForm.tsx` | Formulário unificado Google Meet + Teams |
| `useTeamsMeetingCreate.ts` | Hook para chamadas à Edge Function |
| `useTeamsSync.ts` | Hook para sincronização de calendário |

---

## �🔍 INTEGRAÇÃO DATAJUD (v1.9.0)

### 1. Arquitetura da Integração

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  DataJudPage.tsx                                    │    │
│  │  - Formulário de busca (número CNJ)                 │    │
│  │  - Auto-detecção de tribunal pelo número            │    │
│  │  - Exibição completa dos resultados                 │    │
│  └──────────────────────┬──────────────────────────────┘    │
│                         │                                    │
│  ┌──────────────────────▼──────────────────────────────┐    │
│  │  datajudService.ts                                   │    │
│  │  - buscarProcessoAutomatico()                        │    │
│  │  - detectarTribunalPorNumero()                       │    │
│  │  - Mapeamento CNJ → Tribunal                        │    │
│  └──────────────────────┬──────────────────────────────┘    │
└─────────────────────────┼───────────────────────────────────┘
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────┐
│            SUPABASE EDGE FUNCTION (datajud-proxy)           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  supabase/functions/datajud-proxy/index.ts          │    │
│  │  - Proxy minimalista (sem verificação JWT)          │    │
│  │  - Adiciona API Key do CNJ aos headers              │    │
│  │  - Repassa request para API DataJud                 │    │
│  └──────────────────────┬──────────────────────────────┘    │
└─────────────────────────┼───────────────────────────────────┘
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────┐
│             CNJ DataJud API (api-publica.datajud.cnj.jus.br)│
│  - Endpoint: /{tribunal}/_search                            │
│  - Retorna: Capa processual, movimentações, partes, etc.    │
└─────────────────────────────────────────────────────────────┘
```

### 2. Formato do Número CNJ

```
Formato: NNNNNNN-DD.AAAA.J.TR.OOOO

Onde:
- NNNNNNN = Número sequencial (7 dígitos)
- DD = Dígito verificador (2 dígitos)
- AAAA = Ano de ajuizamento (4 dígitos)
- J = Segmento da Justiça (1 dígito)
- TR = Tribunal/Estado (2 dígitos)
- OOOO = Código da unidade de origem (4 dígitos)

Exemplo: 5007197-20.2024.8.13.0105
         └──────┘ └┘ └──┘ │ └┘ └──┘
         Número  DV Ano   J TR Origem
```

### 3. Mapeamento J (Segmento da Justiça)

```typescript
const SEGMENTOS_JUSTICA = {
  '1': 'STF',     // Supremo Tribunal Federal
  '2': 'CNJ',     // Conselho Nacional de Justiça
  '3': 'STJ',     // Superior Tribunal de Justiça
  '4': 'TRF',     // Justiça Federal (Tribunais Regionais Federais)
  '5': 'TRT',     // Justiça do Trabalho (Tribunais Regionais do Trabalho)
  '6': 'TRE',     // Justiça Eleitoral (Tribunais Regionais Eleitorais)
  '7': 'STM',     // Justiça Militar da União
  '8': 'TJ',      // Justiça dos Estados (Tribunais de Justiça)
  '9': 'TJMMG',   // Justiça Militar Estadual
}
```

### 4. Mapeamento TR (Estado/Região)

```typescript
// Para J=8 (Justiça Estadual) - Código TR = Estado
const ESTADOS_PARA_TJ = {
  '01': 'tjac', '02': 'tjal', '03': 'tjap', '04': 'tjam', '05': 'tjba',
  '06': 'tjce', '07': 'tjdft', '08': 'tjes', '09': 'tjgo', '10': 'tjma',
  '11': 'tjmt', '12': 'tjms', '13': 'tjmg', '14': 'tjpa', '15': 'tjpb',
  '16': 'tjpr', '17': 'tjpe', '18': 'tjpi', '19': 'tjrj', '20': 'tjrn',
  '21': 'tjrs', '22': 'tjro', '23': 'tjrr', '24': 'tjsc', '25': 'tjsp',
  '26': 'tjse', '27': 'tjto'
}

// Para J=4 (Justiça Federal) - Código TR = Região
const REGIOES_PARA_TRF = {
  '01': 'trf1',  // 1ª Região (DF, GO, MG, etc.)
  '02': 'trf2',  // 2ª Região (RJ, ES)
  '03': 'trf3',  // 3ª Região (SP, MS)
  '04': 'trf4',  // 4ª Região (RS, PR, SC)
  '05': 'trf5',  // 5ª Região (NE)
  '06': 'trf6'   // 6ª Região (MG)
}

// Para J=5 (Justiça do Trabalho) - Código TR = Região
const REGIOES_PARA_TRT = {
  '01': 'trt1',  '02': 'trt2',  '03': 'trt3',  '04': 'trt4',  '05': 'trt5',
  '06': 'trt6',  '07': 'trt7',  '08': 'trt8',  '09': 'trt9',  '10': 'trt10',
  '11': 'trt11', '12': 'trt12', '13': 'trt13', '14': 'trt14', '15': 'trt15',
  '16': 'trt16', '17': 'trt17', '18': 'trt18', '19': 'trt19', '20': 'trt20',
  '21': 'trt21', '22': 'trt22', '23': 'trt23', '24': 'trt24'
}
```

### 5. Função de Auto-Detecção de Tribunal

```typescript
function detectarTribunalPorNumero(numero: string): string | null {
  const cleanNumber = numero.replace(/[^\d]/g, '')
  
  if (cleanNumber.length < 14) return null
  
  // Extrair J e TR do número limpo
  const justica = cleanNumber.charAt(9)   // Posição 10 (índice 9)
  const tribunal = cleanNumber.slice(10, 12) // Posições 11-12 (índices 10-11)
  
  switch (justica) {
    case '8': return estadosParaTJ[tribunal]   // Justiça Estadual
    case '4': return regioesParaTRF[tribunal]  // Justiça Federal
    case '5': return regioesParaTRT[tribunal]  // Justiça do Trabalho
    case '6': return `tre${tribunal}`          // Justiça Eleitoral
    default: return null
  }
}
```

### 6. Dados Retornados pela API DataJud

```typescript
interface ProcessoDataJud {
  // Identificação
  id: string                           // ID único no DataJud
  numeroProcesso: string               // Número CNJ
  tribunal: string                     // Sigla do tribunal
  grau: 'G1' | 'G2' | 'SUP'           // 1º Grau, 2º Grau ou Superior
  
  // Metadados
  formato: 'Eletrônico' | 'Físico'
  sistema: string                      // Ex: PJe, PROJUDI, SAJ
  nivelSigilo: number                  // 0 = Público, >0 = Sigiloso
  '@timestamp': string                 // Timestamp da indexação
  dataHoraUltimaAtualizacao: string
  
  // Capa Processual
  classe: { codigo: number, nome: string }
  orgaoJulgador: {
    codigo: number,
    nome: string,
    codigoMunicipioIBGE: string
  }
  dataAjuizamento: string              // Formato: YYYYMMDDHHMMSS
  valorCausa?: number
  
  // Assuntos
  assuntos: Array<{
    codigo: number,
    nome: string
  }>
  
  // Partes
  poloAtivo: Array<{
    nome: string,
    tipoPessoa: 'fisica' | 'juridica',
    numeroDocumentoPrincipal?: string,  // CPF/CNPJ
    advogados?: Array<{
      nome: string,
      numeroOAB?: string
    }>
  }>
  poloPassivo: Array<{ /* mesma estrutura */ }>
  
  // Movimentações
  movimentos: Array<{
    codigo: number,
    nome: string,
    dataHora: string,                   // ISO 8601
    codigoNacional?: number,
    complemento?: string,               // Texto livre
    complementosTabelados?: Array<{
      codigo: number,
      nome: string,
      descricao: string,
      valor?: string
    }>,
    orgaoJulgador?: { nome: string }
  }>
}
```

### 7. Edge Function (datajud-proxy)

**Localização:** `supabase/functions/datajud-proxy/index.ts`

```typescript
// Deploy: npx supabase functions deploy datajud-proxy --no-verify-jwt
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const DATAJUD_API_KEY = Deno.env.get('DATAJUD_API_KEY')

serve(async (req) => {
  const url = new URL(req.url)
  const tribunal = url.searchParams.get('tribunal')
  const numeroProcesso = url.searchParams.get('numeroProcesso')

  const response = await fetch(
    `https://api-publica.datajud.cnj.jus.br/api_publica_${tribunal}/_search`,
    {
      method: 'POST',
      headers: {
        'Authorization': `APIKey ${DATAJUD_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: {
          match: { numeroProcesso: numeroProcesso.replace(/[^\d]/g, '') }
        }
      }),
    }
  )

  return new Response(await response.text(), {
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  })
})
```

**Deploy com flag importante:**
```bash
npx supabase functions deploy datajud-proxy --project-ref xocqcoebreoiaqxoutar --no-verify-jwt
```

### 8. Configuração da API Key

```bash
# Configurar secret no Supabase
npx supabase secrets set DATAJUD_API_KEY="cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==" --project-ref xocqcoebreoiaqxoutar
```

### 9. Fluxo Completo de Busca

```
1. Usuário digita número CNJ: "5007197-20.2024.8.13.0105"

2. Frontend detecta tribunal automaticamente:
   - Extrai J=8 (Justiça Estadual)
   - Extrai TR=13 (Minas Gerais)
   - Retorna: "tjmg"

3. Chama Edge Function:
   GET /functions/v1/datajud-proxy?tribunal=tjmg&numeroProcesso=5007197-20.2024.8.13.0105

4. Edge Function:
   - Adiciona API Key aos headers
   - Faz POST para CNJ DataJud
   - Retorna JSON com hits

5. Frontend renderiza:
   - Capa processual (tribunal, classe, órgão)
   - Datas (ajuizamento, atualização)
   - Valor da causa
   - Partes (polo ativo/passivo com advogados)
   - Assuntos
   - Timeline de movimentações
```

---

## �🔄 FLUXOS DE CADASTRO

### 1. Cadastro de Escritório
```
Usuário → Formulário → CreateOrganizationUseCase 
  → Cria Organization + Owner → Email boas-vindas
```

### 2. Convite de Usuário
```
Gestor → InviteUserModal (UserManagement.tsx)
  → supabase.functions.invoke('invite-org-member')
  → Edge Function verifica permissões (admin/gestor/fartech_admin)
  → Verifica limite max_users da org
  → Se usuário já existe em 'usuarios': adiciona ao org_members
  → Se usuário novo:
    → Limpa registros órfãos do auth (tentativas anteriores)
    → inviteUserByEmail (cria auth user + envia email convite)
    → Upsert em 'usuarios' e 'org_members'
  → Usuário recebe email → clica link → /auth/callback → entra na org
```

### 2b. Remoção de Usuário
```
Gestor → RemoveUserModal (UserManagement.tsx)
  → Inativar (reversível): org_members.ativo = false
  → Remover definitivamente:
    → supabase.functions.invoke('delete-org-member')
    → Remove de org_members, usuarios e Auth
```

### 2c. Reset de Senha de Membro
```
Fartech Admin → OrganizationDetails.tsx → Botão "Resetar Senha"
  → Modal lista membros da org via Edge Function (action: 'list')
    → Edge Function usa service_role para bypassa RLS
  → Admin seleciona membro → Confirma reset
  → supabase.functions.invoke('reset-member-password', { action: 'reset', user_id })
  → Edge Function usa Admin API (updateUserById) para setar senha 'Mudar@123'
```

### 2d. Exclusão de Organização
```
Fartech Admin → OrganizationDetails.tsx → Botão "Excluir Organização"
  → Modal exige confirmação digitando o slug da org
  → supabase.functions.invoke('delete-organization', { org_id, confirm_slug })
  → Edge Function (service_role) executa exclusão em cascata:
    1. audit_log (SET org_id = NULL)
    2. agendamentos, tarefas, documentos, casos
    3. leads, clientes
    4. integrations, org_members
    5. organizations (registro principal)
  → Redireciona para lista de organizações
```

### 3. Link Mágico
```
Gestor → Gera invite_token → Compartilha link 
  → Usuário solicita → Gestor aprova
```

---

## 📄 FLUXO DE DOCUMENTOS (v1.7.0)

### 1. Upload de Documento
```
Usuário → UploadDocumentos.tsx
  → Seleciona tipo de documento
  → Sistema gera número ID automático (PREFIX-YYYYMMDD-XXXXX)
  → Upload para Supabase Storage (bucket: documentos)
  → Cria registro na tabela documentos
  → Status inicial: pendente
```

### 2. Prefixos de Documentos por Tipo
```typescript
PREFIXOS_DOCUMENTO = {
  peticao_inicial: 'PI',
  contestacao: 'CONT', 
  recurso: 'REC',
  procuracao: 'PROC',
  contrato: 'CTR',
  acordo: 'ACR',
  certidao: 'CERT',
  alvara: 'ALV',
  sentenca: 'SENT',
  declaracao: 'DECL',
  parecer: 'PAR',
  notificacao: 'NOT',
  citacao: 'CIT',
  intimacao: 'INT',
  oficio: 'OFI',
  outros: 'DOC'
}
// Formato: PREFIX-YYYYMMDD-XXXXX (ex: PI-20260205-84721)
```

### 3. Visualização de Documento
```
Usuário → Clica "Abrir Documento" → DocumentoViewer.tsx
  → Busca signed URL via documentosService.obterUrlDocumento()
  → Renderiza PDF (iframe) ou Imagem (img com zoom/rotação)
  → Marca automaticamente como visualizado (meta.visualizado = true)
```

### 4. Validação de Documento
```
Advogado → Abre documento no modal → Lê conteúdo
  → Pode: Aprovar | Rejeitar | Solicitar Novamente
  → Status atualiza em tempo real no modal
  → Lista de documentos atualiza no fechamento
```

### 5. Ciclo de Status do Documento
```
pendente → aprovado (validado pelo advogado)
pendente → rejeitado (documento incorreto)
pendente → solicitado (pediu nova versão)
rejeitado → pendente (cliente reenviou)
solicitado → pendente (cliente reenviou)
aprovado → completo (processo finalizado)
```

### 6. Estrutura do Campo `meta` (JSONB)
```json
{
  "visualizado": true,
  "visualizado_at": "2026-02-05T10:30:00Z",
  "visualizado_por": "uuid-do-usuario",
  "observacoes": "Documento ok, assinaturas conferidas",
  "versao": 2
}
```

---

## 📋 PLANO DE IMPLEMENTAÇÃO

Veja o plano completo de implementação em:
- **[PLANO_IMPLEMENTACAO_BACKEND.md](./PLANO_IMPLEMENTACAO_BACKEND.md)** - Backend completo, segurança e multi-tenant
- **[COMPARACAO_ARQUITETURA.md](./COMPARACAO_ARQUITETURA.md)** - Gaps arquiteturais vs Talent Forge

### Fases de Implementação (Histórico)

**FASE 1: Fundamentos (2 semanas)** ✅ CONCLUÍDA
- ✅ Criar migrations do banco
- ✅ Domain Layer (entities, value-objects)
- ✅ Repository Pattern

**FASE 2: Use Cases (2 semanas)** ✅ CONCLUÍDA
- ✅ Organizations use cases
- ✅ Users/Invitations use cases
- ✅ Leads/Cases use cases

**FASE 3: Frontend (2 semanas)** ✅ CONCLUÍDA
- ✅ Cadastro de escritório
- ✅ Gestão de equipe
- ✅ Dashboard Fartech

**FASE 4: Segurança (1 semana)** ✅ CONCLUÍDA
- ✅ Sistema de permissões
- ✅ Auditoria completa
- ✅ Testes

**FASE 5: Notificações (1 semana)** ⏳ PARCIAL
- ✅ Email templates
- ⏳ Notificações em tempo real
- ⏳ Push notifications

---

## 📊 ANÁLISE COMPARATIVA: CANÔNICO vs IMPLEMENTADO
**Data da Análise:** 4 de fevereiro de 2026  
**Última Atualização:** 4 de fevereiro de 2026 (Todos os Gaps Críticos Resolvidos)

### Score de Conformidade Geral: **95%** ✅ (era 82%)

| Área | Score | Status |
|------|-------|--------|
| Multi-tenancy | **95%** | ✅ Excelente |
| Segurança (RLS) | **90%** | ✅ Muito Bom |
| Modelo de Dados | **95%** | ✅ Excelente |
| Sistema de Permissões | **95%** | ✅ Corrigido |
| Performance (Índices) | **95%** | ✅ Otimizado |
| Soft Delete | **95%** | ✅ Implementado |
| Enums Documentados | **95%** | ✅ Padronizado |
| Arquitetura de Código | **60%** | ⚠️ Melhorar |

---

## 🔴 GAPS IDENTIFICADOS E PLANO DE CORREÇÃO

### ✅ GAP 1: Role `associado` Não Existe - **RESOLVIDO**
**Prioridade:** 🔴 CRÍTICO  
**Status:** ✅ **IMPLEMENTADO em 04/02/2026**  
**Migration:** `20260204_add_associado_role.sql`

**O que foi feito:**
- ✅ Adicionado valor `associado` ao enum `user_role`
- ✅ Atualizado constraint `org_members_role_check`
- ✅ Adicionadas policies RLS para role associado
- ✅ Documentação de colunas atualizada

---

### GAP 2: Inconsistência de Enums (DB vs Frontend)
**Prioridade:** 🟡 IMPORTANTE  
**Esforço:** 2-3 horas

**Problema:** Mapeamentos complexos entre DB e UI

| Campo | DB | Frontend | Issue |
|-------|-----|----------|-------|
| `leads.status` | `em_triagem` | `em_contato` | Nomes diferentes |
| `casos.status` | `triagem, negociacao, andamento...` | `ativo, suspenso, encerrado` | Muitos → poucos |
| `casos.prioridade` | `INTEGER (1-4)` | `STRING (baixa, media, alta, critica)` | Tipo diferente |

**Ação Necessária:**
1. Criar enums PostgreSQL consistentes
2. Migrar dados existentes
3. Atualizar services para usar tipos corretos

```sql
-- Migration: 20260205_standardize_enums.sql

-- Criar enum para lead_status
CREATE TYPE lead_status_enum AS ENUM (
  'novo', 'em_contato', 'qualificado', 'proposta', 'ganho', 'perdido'
);

-- Criar enum para caso_status
CREATE TYPE caso_status_enum AS ENUM (
  'ativo', 'suspenso', 'encerrado'
);

-- Criar enum para prioridade
CREATE TYPE priority_enum AS ENUM (
  'baixa', 'media', 'alta', 'critica'
);
```

---

### ✅ GAP 3: Índices de Performance Faltando - **RESOLVIDO**
**Prioridade:** 🟡 IMPORTANTE  
**Status:** ✅ **IMPLEMENTADO em 04/02/2026**  
**Migration:** `20260204_add_performance_indexes.sql`

**O que foi feito:**
- ✅ 13 índices compostos criados para queries de dashboard
- ✅ 3 índices GIN para full-text search (português)
- ✅ Índices parciais para dados ativos
- ✅ Índices para Kanban de tarefas

**Índices Criados:**
| Tabela | Índice | Tipo | Uso |
|--------|--------|------|-----|
| casos | `idx_casos_org_status_priority` | B-tree | Dashboard |
| casos | `idx_casos_org_responsavel` | B-tree | Meus Casos |
| casos | `idx_casos_titulo_fts` | GIN | Full-text |
| leads | `idx_leads_org_status_created` | B-tree | Listagem |
| leads | `idx_leads_nome_fts` | GIN | Full-text |
| clientes | `idx_clientes_org_status_nome` | B-tree | Listagem |
| clientes | `idx_clientes_nome_fts` | GIN | Full-text |
| tarefas | `idx_tarefas_org_status_due` | B-tree | Kanban |
| tarefas | `idx_tarefas_org_assigned_status` | B-tree | Minhas Tarefas |
| documentos | `idx_documentos_caso_status` | B-tree | Por caso |
| documentos | `idx_documentos_org_created` | B-tree | Listagem |
| audit_log | `idx_audit_log_date_action` | B-tree | Relatórios |

---

### ✅ GAP 4: Soft Delete Não Implementado - **RESOLVIDO**
**Prioridade:** 🟢 DESEJÁVEL  
**Status:** ✅ **IMPLEMENTADO em 04/02/2026**  
**Migration:** `20260204_soft_delete.sql`

**O que foi feito:**
- ✅ Coluna `deleted_at` e `deleted_by` adicionadas em: clientes, casos, leads, documentos, tarefas
- ✅ Índices parciais para dados ativos (WHERE deleted_at IS NULL)
- ✅ Views de compatibilidade: v_clientes_ativos, v_casos_ativos, etc.
- ✅ Funções helper: `soft_delete()`, `restore_deleted()`, `hard_delete_old()`
- ✅ Audit log integrado às operações de delete/restore

---

### GAP 5: RBAC Dinâmico Não Ativado
**Prioridade:** 🟢 DESEJÁVEL (Futuro)  
**Esforço:** 1-2 semanas

**Status Atual:**
- Tabelas `roles`, `permissions`, `role_permissions` existem mas estão **RESERVADAS**
- Sistema atual usa abordagem simplificada: `usuarios.permissoes[]` + `org_members.role`

**Decisão Arquitetural:**
> O sistema atual é **SUFICIENTE** para a maioria dos casos de uso.  
> RBAC dinâmico será implementado apenas se houver demanda por:
> - Permissões granulares customizáveis por organização
> - Roles personalizados além dos 6 existentes
> - Matriz de permissões editável pelo admin

**Ação:** Manter como está. Documentar que está reservado para futuro.

---

### GAP 6: Clean Architecture Incompleta
**Prioridade:** 🟢 DESEJÁVEL (Refatoração)  
**Esforço:** 2-4 semanas

**Estado Atual:**
```
src/
├── services/    → Infra + App misturados (acesso DB + lógica)
├── hooks/       → App + Presentation misturados
├── types/       → Domain parcial (apenas types)
└── components/  → Presentation OK
```

**Canônica Define:**
```
src/
├── domain/         → Entities, Value Objects, Interfaces
├── application/    → Use Cases, DTOs, Mappers
├── infrastructure/ → Repositories (Supabase)
└── presentation/   → Components, Pages, Hooks
```

**Plano de Refatoração (Incremental):**

1. **Fase A - Domain Layer** (3 dias)
   - Criar `src/domain/entities/` com classes de entidade
   - Criar `src/domain/value-objects/` (Email, CNPJ, OAB)
   - Criar `src/domain/repositories/` (interfaces)

2. **Fase B - Use Cases** (1 semana)
   - Extrair lógica de negócio dos services para use cases
   - Criar `src/application/use-cases/`
   - Criar DTOs para input/output

3. **Fase C - Infrastructure** (3 dias)
   - Renomear `services/` para `infrastructure/repositories/`
   - Implementar interfaces do domain

**Ação:** Criar issue no backlog. Fazer refatoração incremental quando tocar nos arquivos.

---

## 📅 PLANO DE AÇÃO PRIORIZADO

### ✅ Sprint 1 (Concluída) - Correções Críticas
| # | Task | Prioridade | Esforço | Status |
|---|------|------------|---------|--------|
| 1 | Adicionar role `associado` | 🔴 Crítico | 1h | ✅ **Concluído** |
| 2 | Criar índices compostos | 🟡 Importante | 30min | ✅ **Concluído** |
| 3 | Documentar enums existentes | 🟡 Importante | 1h | ✅ **Concluído** |

### ✅ Sprint 2 (Concluída) - Melhorias
| # | Task | Prioridade | Esforço | Status |
|---|------|------------|---------|--------|
| 4 | Padronizar enums DB/Frontend | 🟡 Importante | 3h | ✅ **Concluído** |
| 5 | Implementar soft delete | 🟢 Desejável | 3h | ✅ **Concluído** |
| 6 | Adicionar versionamento docs | 🟢 Desejável | 2h | ⬜ Pendente |

### ✅ Sprint 3 (Concluída) - Kanban e Histórico
| # | Task | Prioridade | Esforço | Status |
|---|------|------------|---------|--------|
| 7 | Tabela `tarefa_status_history` | 🔴 Crítico | 2h | ✅ **Concluído** |
| 8 | Trigger automático de histórico | 🔴 Crítico | 1h | ✅ **Concluído** |
| 9 | Soft delete em tarefas | 🟡 Importante | 1h | ✅ **Concluído** |
| 10 | Drawer completo de tarefas | 🟡 Importante | 3h | ✅ **Concluído** |
| 11 | Ações rápidas no Kanban | 🟡 Importante | 2h | ✅ **Concluído** |
| 12 | Badges de prioridade/status | 🟢 Desejável | 1h | ✅ **Concluído** |

### Backlog (Quando Possível)
| # | Task | Prioridade | Esforço | Status |
|---|------|------------|---------|--------|
| 7 | Refatorar para Clean Architecture | 🟢 Desejável | 2-4 sem | ⬜ Backlog |
| 8 | Ativar RBAC Dinâmico | 🟢 Futuro | 1-2 sem | ⬜ Backlog |
| 9 | Notificações Realtime | 🟢 Desejável | 1 sem | ⬜ Backlog |
| 10 | **Migrar scraper-server para MCP Server** | 🔴 Importante | 4-5 dias | 📅 **Agendado: 01/03/2026 (domingo)** |

---

## 🤖 PLANO MCP — Model Context Protocol (Agendado: 01/03/2026)

> **Insight registrado em:** 25/02/2026  
> **Objetivo:** Transformar o Waze Jurídico de um proxy passivo em um agente jurídico autônomo

### Problema Atual

O `caseIntelligenceService.ts` usa Claude de forma **passiva**:
1. Frontend agrega manualmente DataJud + DOU + PJe + eProc
2. Monta um prompt enorme (~5000 tokens de contexto)
3. Claude responde uma vez, sem capacidade de follow-up ou decisão própria

### O Que Muda com MCP

```
HOJE (proxy manual):
  Frontend → caseIntelligenceService → POST /scraper-api/claude → Claude
  (contexto montado pelo humano, Claude só responde)

COM MCP (agentic loop):
  Claude ← tool: consultar_datajud()         ← decide o que buscar
  Claude ← tool: buscar_dou()                ← busca quando precisa
  Claude ← tool: listar_processos_pje()      ← orquestra sozinho
  Claude → análise completa com rastreabilidade
```

### Plano de Implementação (4-5 dias)

#### Fase 1 — Setup (30min)
```bash
cd scraper-server && npm install @modelcontextprotocol/sdk zod
```

#### Fase 2 — Migrar endpoints para MCP tools (2 dias)
Transformar os endpoints REST existentes em tools declarativas:

```typescript
// scraper-server/mcp-server.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

const server = new McpServer({ name: "sdr-juridico", version: "1.0.0" })

// Tool 1: DataJud
server.tool("consultar_datajud", {
  numero_processo: z.string().describe("Número CNJ do processo")
}, async ({ numero_processo }) => {
  return await datajudService.buscarProcessoAutomatico(numero_processo)
})

// Tool 2: DOU
server.tool("buscar_dou", {
  termo: z.string(),
  cnpj: z.string().optional(),
  cpf: z.string().optional()
}, async (args) => {
  return await douService.buscar(args)
})

// Tool 3: PJe + eProc (já existe em POST /advogado/processos)
server.tool("listar_processos_advogado", {
  cpf: z.string().describe("CPF do advogado")
}, async ({ cpf }) => {
  return await listarProcessosPJeEEproc(cpf)
})

// Tool 4: Busca por CPF (Portal Transparência + Querido Diário)
server.tool("buscar_por_cpf", {
  cpf: z.string()
}, async ({ cpf }) => {
  return await scraperOrchestrator.buscarPorCPF(cpf)
})
```

#### Fase 3 — Resources multi-tenant para dados do Supabase (1 dia)
```typescript
// Resources: dados da org acessíveis via URI
server.resource(
  "caso",
  new ResourceTemplate("caso://{org_id}/{caso_id}", { list: undefined }),
  async (uri, { org_id, caso_id }) => {
    const caso = await supabase.from('casos')
      .select('*, clientes(*), tarefas(*), documentos(*)')
      .eq('id', caso_id).eq('org_id', org_id).single()
    return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(caso.data) }] }
  }
)
```

#### Fase 4 — Autenticação JWT multi-tenant (1 dia)
```typescript
// Middleware: valida JWT do Supabase e injeta org_id no contexto
app.use('/mcp', async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })
  req.orgId = await getOrgIdFromUser(user.id)
  next()
})
```

#### Fase 5 — Refatorar `caseIntelligenceService.ts` (1 dia)
- Substituir chamada direta `POST /claude` pelo MCP client
- Claude passa a decidir quais tools chamar baseado na pergunta do usuário
- Manter compatibilidade com `DataJudPage` e `ClienteDrawer` como entry points

#### Fase 6 — Prompt templates para análise jurídica (2h)
```typescript
server.prompt("analise_completa_caso", { caso_id: z.string() }, async ({ caso_id }) => ({
  messages: [{
    role: "user",
    content: `Faça análise completa do caso ${caso_id}. Use as tools disponíveis para consultar
    DataJud, DOU, processos PJe/eProc e histórico interno. Formate como relatório executivo.`
  }]
}))
```

### Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `scraper-server/mcp-server.ts` | CRIAR — novo MCP server |
| `scraper-server/index.ts` | MODIFICAR — adicionar transport HTTP/MCP |
| `scraper-server/package.json` | MODIFICAR — adicionar `@modelcontextprotocol/sdk` |
| `src/services/caseIntelligenceService.ts` | MODIFICAR — usar MCP client em vez de fetch direto |

### Ganho Esperado

- Claude busca dados **quando precisa**, não recebe dump completo
- Rastreabilidade: sabe quais fontes foram consultadas
- Waze Jurídico evolui de componente de análise para **agente jurídico autônomo**
- Base para integração com Claude Desktop / VS Code (interoperabilidade MCP)

---

## 🛠️ SCRIPTS SQL PRONTOS PARA EXECUÇÃO

### Script 1: Adicionar Role Associado
```sql
-- Executar no Supabase SQL Editor
-- Arquivo: supabase/migrations/20260204_add_associado_role.sql

BEGIN;

-- Atualizar constraint
ALTER TABLE org_members 
  DROP CONSTRAINT IF EXISTS org_members_role_check;

ALTER TABLE org_members 
  ADD CONSTRAINT org_members_role_check 
  CHECK (role IN ('admin', 'gestor', 'advogado', 'associado', 'secretaria', 'leitura', 'viewer'));

-- Atualizar enum se existir
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    BEGIN
      ALTER TYPE user_role ADD VALUE 'associado' AFTER 'advogado';
    EXCEPTION WHEN duplicate_object THEN
      NULL; -- já existe
    END;
  END IF;
END $$;

-- Documentar
COMMENT ON COLUMN org_members.role IS
  'Role do usuário na organização.
   
   VALORES:
   - admin: Administrador (full access)
   - gestor: Gestor (full access)
   - advogado: Advogado (criar/editar casos, clientes, docs)
   - associado: Advogado associado (acesso limitado a casos atribuídos)
   - secretaria: Secretária (agendamentos, tarefas básicas)
   - leitura: Somente leitura
   - viewer: Visualizador (alias para leitura)';

COMMIT;
```

### Script 2: Índices de Performance
```sql
-- Executar no Supabase SQL Editor
-- Arquivo: supabase/migrations/20260204_add_performance_indexes.sql

BEGIN;

-- Índices compostos para queries comuns
CREATE INDEX IF NOT EXISTS idx_casos_org_status_priority 
  ON casos(org_id, status, prioridade) WHERE status != 'arquivado';

CREATE INDEX IF NOT EXISTS idx_leads_org_status_created 
  ON leads(org_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tarefas_org_status_due 
  ON tarefas(org_id, status, due_at) WHERE status NOT IN ('concluida', 'cancelada');

CREATE INDEX IF NOT EXISTS idx_agendamentos_org_date 
  ON agendamentos(org_id, data_inicio, status);

-- Full-text search
CREATE INDEX IF NOT EXISTS idx_casos_titulo_fts 
  ON casos USING GIN (to_tsvector('portuguese', coalesce(titulo, '')));

CREATE INDEX IF NOT EXISTS idx_clientes_nome_fts 
  ON clientes USING GIN (to_tsvector('portuguese', coalesce(nome, '')));

COMMIT;
```

---

## 💰 MÓDULO FINANCEIRO

> **Introduzido em:** v2.6.0 (26/02/2026)
> **Rota:** `/app/financeiro`
> **Arquivos:** `src/types/financeiro.ts` · `src/hooks/useFinanceiro.ts` · `src/services/financeiroService.ts` · `src/pages/FinanceiroPage.tsx`

---

### Schema da Tabela

**`financeiro_lancamentos`** — migration: `supabase/migrations/20260225_financeiro_lancamentos.sql`

| Coluna | Tipo | Observação |
|--------|------|------------|
| `id` | UUID PK | `gen_random_uuid()` |
| `org_id` | UUID FK → `orgs.id` | multi-tenancy obrigatório |
| `tipo` | TEXT | `'receita' \| 'despesa'` |
| `status` | TEXT | `'previsto' \| 'pago' \| 'atrasado'` |
| `categoria` | TEXT | texto livre (sem FK) |
| `descricao` | TEXT | |
| `valor` | NUMERIC(14,2) | ≥ 0 |
| `vencimento` | DATE | |
| `pago_em` | DATE | nullable |
| `cliente` | TEXT | nullable, texto livre |
| `caso_id` | UUID FK → `casos.id` | nullable, ON DELETE SET NULL |
| `responsavel_user_id` | UUID FK → `auth.users` | nullable, ON DELETE SET NULL |
| `recorrente` | BOOLEAN | default `false` |
| `created_by` | UUID FK → `auth.users` | nullable |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | atualizado via trigger |

> ⚠️ **Exceção de soft delete documentada:** `financeiro_lancamentos` usa **hard delete** (`DELETE` real). A tabela não possui `deleted_at` por decisão de design — lançamentos deletados não precisam ser auditados individualmente (dados agregados são suficientes). A RLS policy `financeiro_delete_org_admin` restringe exclusão a `org_admin`. Não adicionar `deleted_at` sem revistar esta decisão.

---

### RLS Policies

| Policy | Operação | Condição |
|--------|----------|----------|
| `financeiro_select_org_member` | SELECT | `is_org_member(org_id)` |
| `financeiro_insert_org_member` | INSERT | `is_org_member(org_id)` |
| `financeiro_update_org_member` | UPDATE | `is_org_member(org_id)` |
| `financeiro_delete_org_admin` | DELETE | `is_org_admin_for_org(org_id)` |

---

### Tipos TypeScript

**`src/types/financeiro.ts`** — fonte canônica dos tipos do módulo

```typescript
// Tipos primitivos
type FinanceTransactionType   = 'receita' | 'despesa'
type FinanceTransactionStatus = 'previsto' | 'pago' | 'atrasado'

// Domínio (camelCase EN) ← mapper converte de snake_case PT
interface FinanceTransaction {
  id, type, status, category, description, amount
  dueDate, paidDate?, cliente?, casoId?
  responsavelUserId?, responsavelNome?, responsavelRole?
  recurring?, createdAt, updatedAt
}

// Snapshot do mês atual
interface FinanceSnapshot {
  receitaRealizadaMes, despesaRealizadaMes, resultadoMes
  margemOperacional, contasReceber, contasPagar
  inadimplencia, receitasAtrasadas   // ← todos obrigatórios
}

// Ponto do gráfico de fluxo de caixa
interface CashflowPoint { month, receita, despesa, saldo }
```

---

### Mapper (DB → Domínio)

Em `financeiroService.ts`, a função `mapDbToFinance` converte:

| DB (snake_case PT) | Domínio (camelCase EN) |
|--------------------|------------------------|
| `tipo` | `type` |
| `categoria` | `category` |
| `descricao` | `description` |
| `valor` | `amount` |
| `vencimento` | `dueDate` |
| `pago_em` | `paidDate` |
| `caso_id` | `casoId` |
| `responsavel_user_id` | `responsavelUserId` |
| `recorrente` | `recurring` |
| `created_at` | `createdAt` |
| `updated_at` | `updatedAt` |

O nome e role do responsável são resolvidos via `resolveResponsavelInfo()` — JOIN separado em `usuarios` + `org_members`.

---

### Hook: `useFinanceiro(leads, caso)`

```typescript
// src/hooks/useFinanceiro.ts
export function useFinanceiro(leads: Lead[] = [], casos: Caso[] = []) {
  // Retorna:
  return {
    loading, error,
    transactions,          // FinanceTransaction[] — todos, sem filtro
    responsaveis,          // FinanceResponsavel[] — advogados/gestores da org
    snapshot,              // FinanceSnapshot — calculado do mês atual, sem filtro
    cashflowSeries,        // CashflowPoint[6] — últimos 6 meses, sem filtro
    carteiraMetrics,       // { carteiraAtiva, pipeline, ticketMedio, contratosFechados }
    contasReceber,         // FinanceTransaction[] — receitas não pagas, sem filtro
    contasPagar,           // FinanceTransaction[] — despesas não pagas, sem filtro
    carteiraPorResponsavel,// Saldo por advogado/gestor, sem filtro
    fetchTransactions,
    createTransaction,     // suporta recorrência (recurrenceCount × lançamentos)
    updateTransaction,
    deleteTransaction,     // hard delete — veja exceção de soft delete acima
  }
}
```

**Padrão de filtros na página:**
O hook fornece dados **sem filtros de UI** (roleFilter, responsavelFilter). A `FinanceiroPage` aplica estes filtros localmente via `filteredTransactions = useMemo(...)` e recalcula snapshot/contas derivadas. Este padrão é **intencional** — não mover filtros de UI para o hook.

**`normalizeStatus`** — executado no carregamento e após cada mutação: se `paidDate` existe → `'pago'`; se `dueDate < hoje` → `'atrasado'`; senão → `'previsto'`. O status no banco pode ficar desatualizado entre sessões; a normalização no frontend é a fonte de verdade para exibição.

---

### Service: `financeiroService`

```typescript
// src/services/financeiroService.ts
export const financeiroService = {
  listResponsaveis(),     // org_members WHERE role IN ('advogado','gestor','admin')
  listTransactions(),     // financeiro_lancamentos WHERE org_id = ? ORDER BY vencimento DESC
  createTransaction(),    // INSERT (n lançamentos para recorrência)
  updateTransaction(),    // UPDATE + re-resolve responsavelInfo
  deleteTransaction(),    // DELETE — hard delete (exceção documentada)
}
```

`resolveOrgScope()` é chamado em cada método para obter `orgId` e `isFartechAdmin`. Toda query inclui `.eq('org_id', orgId)` explicitamente (além da RLS).

Recorrência no `createTransaction`: gera `recurrenceCount` linhas com `vencimento` incrementado `recurrenceIntervalMonths` meses, sufixando " - Parcela N/Total" na descrição.

---

### Estrutura da Página

```
FinanceiroPage
├── <header>
│   ├── Título + subtítulo
│   └── <Button onClick={() => setShowForm(true)}>Novo Lançamento</Button>
├── Grid 4 col — KPI Mês (Resultado | Receita | Despesa | Inadimplência)
├── Card — Índices Financeiros (Margem Bruta | Dias de Caixa | ROIC | Lucratividade | Inadimplência)
├── Card — Fluxo de Caixa ComposedChart (Bar receita/despesa yAxisId="left", Line saldo yAxisId="right")
├── Grid 2 col — Pie charts (Receitas por Categoria | Despesas por Categoria)
├── Card — Projeção de Fluxo de Caixa (BarChart 6 meses)
├── Grid 2 col — Contas a Receber | Contas a Pagar
├── Card — Carteira por Advogado/Gestor (filtros roleFilter + responsavelFilter)
├── Card — Demonstrativo Mensal (seletor de mês + exportar CSV/PDF)
└── <Modal open={showForm}>
    └── Formulário de novo lançamento (tipo, categoria, descrição, valor, vencimento,
        cliente, responsável, recorrência)
```

---

### Recharts: Padrão ComposedChart com Dual YAxis

O gráfico de fluxo de caixa usa `<ComposedChart>` com dois eixos Y. Padrão **obrigatório** para evitar warning no console:

```tsx
<ComposedChart data={...}>
  <YAxis yAxisId="left"  tickLine={false} axisLine={false} />
  <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} />
  <Bar  yAxisId="left"  dataKey="receita" ... />
  <Bar  yAxisId="left"  dataKey="despesa" ... />
  <Line yAxisId="right" dataKey="saldo"   stroke="#5B4FCF" dot={false} />
</ComposedChart>
```

> ⚠️ Toda `<Line>` ou `<Bar>` em `ComposedChart` com múltiplos YAxis DEVE declarar `yAxisId`. Omitir causa warning "No YAxisId found" no console.

---

### Cores nos Gráficos Financeiros

| Elemento | Cor | Justificativa |
|----------|-----|---------------|
| Barra receita | `#2E7D32` | verde semântico (sucesso financeiro) |
| Barra despesa | `#721011` | brand-primary (custo da operação) |
| Linha saldo | `#5B4FCF` | roxo neutro — não é azul, não conflita com marca |
| Barra saldo (projeção) | `#5B4FCF` | consistência com linha de saldo |

> ❌ `#1f3c88` (azul marinho) é PROIBIDO — viola a regra de zero azul em contexto de marca.

---

## 👥 CONTROLE DE ACESSO POR PERFIL (v2.7.0)

> **Introduzido em:** v2.7.0 (26/02/2026)
> **Arquivos:** `src/hooks/useCurrentUser.ts` · `src/hooks/usePlan.ts` · `src/components/UpgradeWall.tsx` · `src/layouts/AppShell.tsx` · `src/pages/DashboardPage.tsx` · `src/pages/AnalyticsPage.tsx`

---

### Modelo de papéis

O sistema tem dois níveis de role que coexistem e têm responsabilidades distintas:

| Campo | Tipo | Valores | Onde fica |
|-------|------|---------|-----------|
| `UserRole` (resolvido) | `'fartech_admin' \| 'org_admin' \| 'user'` | Usado para guards de rota e permissões canônicas | `useCurrentUser().role` |
| `memberRole` (real) | `string \| null` | `admin`, `gestor`, `advogado`, `secretaria`, `leitura` | `useCurrentUser().memberRole` · DB: `org_members.role` |

**Mapeamento `memberRole` → `UserRole`:**

| memberRole | UserRole resolvido |
|------------|--------------------|
| `admin` | `org_admin` |
| `gestor` | `org_admin` |
| `advogado` | `user` |
| `secretaria` | `user` |
| `leitura` | `user` |

---

### `useCurrentUser` — campos adicionados

```ts
// Retorno do hook — campos novos em v2.7.0
memberRole: string | null   // role real do org_members (advogado, secretaria, leitura…)
roleLabel:  string          // agora usa mapa real: "Advogado", "Secretaria", "Leitura"…
```

O `roleLabel` usa `roleLabelMap` (mapa interno) com prioridade sobre `roleLabels[role]`. Se `memberRole` for `null` (fartech_admin sem membership), cai de volta para o mapa de `UserRole`.

---

### `usePlan` — feature gates por plano

**Arquivo:** `src/hooks/usePlan.ts`

Lê `currentOrg.plan` via `useOrganizationContext`. A coluna `plan` já existe na tabela `orgs` com valores `trial | basic | professional | enterprise`.

```ts
const {
  plan,                // 'trial' | 'basic' | 'professional' | 'enterprise'
  canUseFinanceiro,   // professional+
  canUseAnalytics,    // professional+
  canUseDOU,          // professional+
  canUsePJe,          // professional+
  canUseIA,           // enterprise only
  canUseAuditoria,    // professional+
  maxUsers,           // currentOrg.max_users ?? 1
  hasFeature,         // (minPlan: Plan) => boolean
} = usePlan()
```

**Faixas de plano:**

| Plano | Rank | Módulos liberados |
|-------|------|-------------------|
| `trial` | 0 | Dashboard, Leads (20), Casos (10), Agenda, Tarefas, Clientes, Documentos, DataJud |
| `basic` | 1 | trial + limites maiores (Leads 100, Casos 50), Relatórios básicos |
| `professional` | 2 | basic + Financeiro, Analytics, DOU, PJe/eProc, Auditoria |
| `enterprise` | 3 | professional + Waze Jurídico (IA), SLA de suporte |

---

### `UpgradeWall` — componente de bloqueio

**Arquivo:** `src/components/UpgradeWall.tsx`

Reutilizável para qualquer módulo bloqueado por plano. Uso padrão:

```tsx
const { canUseAnalytics } = usePlan()
if (!canUseAnalytics) return <UpgradeWall feature="Analytics Executivo" minPlan="Profissional" />
```

---

### AppShell — sidebar condicional

`appNavGroups` é calculado via `useMemo` dinâmico dentro do componente (não mais constante estática):

```
Operacao       → sempre visível (Dashboard, Agenda, Tarefas)
Relacionamento → sempre visível (Leads, Clientes, Casos)
Conteudo       → Documentos + DataJud sempre; Diário Oficial somente se canUseDOU
Governanca     → somente se isOrgAdmin; itens individuais condicionais ao plano:
                   Auditoria  → canUseAuditoria
                   Analytics  → canUseAnalytics
                   Financeiro → canUseFinanceiro
Administracao  → sempre visível (Configurações + itens de org_admin)
```

---

### Dashboard — comportamento por perfil

| Perfil | Detecção | Título | Badge | KPIs | Mini-card financeiro | Banner |
|--------|----------|--------|-------|------|----------------------|--------|
| **Gestor/Admin** (equipe) | `role === 'org_admin'` + `total_users > 1` | "[nome], visão gerencial" | Vermelho marca | Org-wide | ✅ (se canUseFinanceiro) | — |
| **Advogado Solo** | `role === 'org_admin'` + `total_users <= 1` | "[nome], seu escritório" | "Solo" vermelho | Org-wide (= seus) | ✅ | — |
| **Advogado** | `memberRole === 'advogado'` | "[nome], seu dia" | Cinza | Filtrado (meusCasos + meusLeads) | ❌ | — |
| **Secretaria** | `memberRole === 'secretaria'` | "[nome], painel administrativo" | Cinza | Org-wide | ❌ | — |
| **Leitura** | `memberRole === 'leitura'` | "[nome], visão geral" | Cinza | Org-wide | ❌ | Âmbar "modo leitura" |

**Filtros para advogado:**
- `meusCasos`: filtra `casos` onde `caso.responsavel === shortName || caso.responsavel === user.id`
- `meusLeads`: filtra `leads` onde `lead.owner === user.id || lead.owner === shortName`
- `criticalCasesCount` e `hotLeadsCount` derivados dos arrays filtrados (sem nova query ao banco)

**Detecção de solo:** `isGestorDash && (orgStats?.total_users ?? 2) <= 1` — usa `stats.total_users` do `OrganizationContext` que conta `org_members` ativos.

---

### AnalyticsPage — guards e filtros

```
1. canViewExecutive (!isOrgAdmin && !isFartechAdmin) → Card "Acesso restrito"
2. !canUseAnalytics                                  → <UpgradeWall>
3. isSolo (total_users <= 1)                        → oculta seções de equipe
```

Seções ocultadas para solo:
- "Desempenho por colaborador" (BarChart por membro)
- "Ranking do time" (tabela com leads convertidos, taxa, casos, saldo)

---

### Regras de implementação (NON-NEGOTIABLE)

1. **Nunca usar `memberRole` para guards de rota** — apenas `role` (`UserRole`) para isso. `memberRole` é exclusivamente para personalização de UI/UX.
2. **Nunca fazer nova query ao banco para filtrar KPIs do advogado** — filtrar no array já carregado pelo hook.
3. **`usePlan` deve ser usado somente para feature gates de módulos** — não para lógica de negócio ou queries.
4. **`UpgradeWall` sempre redireciona para `/app/config`** — não abrir modal inline de upgrade.
5. **Sidebar do solo é igual ao org_admin** — acesso completo (ele é admin da própria org).

---

## 📞 REFERÊNCIAS

- [React Best Practices](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Docs](https://supabase.com/docs)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

---

**Mantido por:** Equipe SDR Jurídico
**Última atualização:** 26 de fevereiro de 2026
**Versão:** 2.7.0 (Controle de Acesso por Perfil)

---

## 📝 CHANGELOG COMPLETO

### v1.5.0 (05/02/2026)
**🎯 Soft Delete e Histórico de Leads**

#### Banco de Dados
- ✅ **Soft Delete para Leads**: Campos `deleted_at` e `deleted_by` na tabela `leads`
- ✅ **`lead_status_history`**: Nova tabela para rastrear mudanças de status e temperatura (heat)
- ✅ **Campos expandidos em `leads`**: `heat`, `last_contact_at`, `assigned_user_id`, `updated_at`

#### Frontend
- ✅ **TarefasArquivadasPage**: Nova página `/app/tarefas/arquivadas`
  - Lista tarefas soft-deleted
  - Botão "Restaurar" para recuperar tarefa
  - Botão "Excluir permanentemente" com confirmação
  - Busca por título/descrição
- ✅ **LeadDrawer com Histórico**: Timeline de mudanças de status e heat
- ✅ **Cards discretos na LeadsPage**: Cores suaves (orange/blue/emerald pastéis)

#### TypeScript (supabaseClient.ts)
- ✅ **LeadRow atualizado**: Campos `deleted_at`, `deleted_by`, `heat`, `assigned_user_id`
- ✅ **TarefaStatusHistoryRow**: Interface para histórico de tarefas
- ✅ **LeadStatusHistoryRow**: Interface para histórico de leads

---

### v1.4.0 (05/02/2026)
**🎯 Kanban Avançado e Auditoria de Tarefas**

#### Banco de Dados
- ✅ **`tarefa_status_history`**: Nova tabela para rastrear todas as mudanças de status
- ✅ **Trigger `trg_tarefa_status_history`**: Registra automaticamente mudanças
- ✅ **Função `get_tarefa_history()`**: Retorna timeline completa com tempo em cada status
- ✅ **View `v_tarefa_timeline`**: Timeline com nome do usuário que fez a mudança
- ✅ **Soft Delete**: Campos `deleted_at` e `deleted_by` na tabela `tarefas`
- ✅ **Filtro automático**: Queries excluem tarefas deletadas (`deleted_at IS NULL`)

#### Frontend (TarefasKanbanPage)
- ✅ **Drawer centralizado**: Modal completo para gerenciamento de tarefa
- ✅ **Ações rápidas contextuais**: Botões baseados no status atual
  - Pendente → "Iniciar Tarefa"
  - Em Andamento → "Enviar p/ Validação" / "Marcar Concluída"
  - Aguardando Validação → "Aprovar" / "Devolver"
  - Concluída/Devolvida → "Reabrir Tarefa"
- ✅ **Badges melhorados**: Prioridade com ícones (🔥 Alta, ➖ Normal, 🔽 Baixa)
- ✅ **Badge animado**: "Atrasada" com pulse vermelho
- ✅ **Seção de devolução**: Input para motivo + confirmação
- ✅ **Histórico de rejeição**: Box amarelo mostrando último motivo

#### Frontend (LeadsPage)
- ✅ **Cards de métricas redesenhados**: Layout 2x2 com gradientes e animações
  - Total Pipeline com ícone de usuários
  - Leads Quentes com badge animado "PRIORIDADE"
  - Em Negociação com indicador de propostas
  - Taxa de Conversão com ícone de sucesso
- ✅ **Cards de lead modernizados**: Hover com elevação, botões com transição
- ✅ **Badges com gradientes**: Status e temperatura com ícones semânticos
  - Status: ✨ Novo, 📞 Em Contato, ⭐ Qualificado, 📋 Proposta, 🎉 Ganho, ❌ Perdido
  - Heat: 🔥 Quente, ☀️ Morno, ❄️ Frio
- ✅ **Tabs redesenhadas**: Container com background, ícones contextuais
- ✅ **Filtros melhorados**: Inputs com ícones, seletores com emojis
- ✅ **Informações de contato**: Email/telefone em chips destacados
- ✅ **Área de interesse**: Badge azul com ícone de pasta
- ✅ **Espaçamento padronizado**: padding 20px (0.5cm) na lista e formulário Novo Lead

#### Frontend (LeadsKanbanPage) - NOVO!
- ✅ **Funil de Conversão visual**: Gráfico de funil abaixo do Kanban board
  - 6 etapas: Novo → Em Contato → Qualificado → Proposta → Ganho → Perdido
  - Barras com largura proporcional (formato funil — estreitamento progressivo)
  - Cores via design tokens CSS: --brand-primary, --color-info, --brand-accent, --color-warning, --color-success, --color-danger
  - Exibe quantidade absoluta dentro de cada barra + percentual ao lado
  - Rodapé com total no pipeline e taxa de conversão
  - Atualiza automaticamente com filtros e dados em tempo real
- ✅ **Margem lateral padronizada**: 20px (0.5cm) entre sidebar e margem direita
- ✅ **Supabase Realtime**: Canal `leads-kanban-realtime` para atualização automática
- ✅ **DnD (drag-and-drop)**: @dnd-kit/core para mover leads entre colunas de status

#### Services (tarefasService.ts)
- ✅ **`deleteTarefa()`**: Soft delete com UPDATE em vez de DELETE
- ✅ **`restoreTarefa()`**: Restaura tarefa deletada
- ✅ **`getDeletedTarefas()`**: Lista tarefas na lixeira
- ✅ **Todos os métodos**: Filtram `deleted_at IS NULL`

#### Hooks (useTarefas.ts)
- ✅ **`restoreTarefa`**: Callback para restaurar tarefa
- ✅ **`fetchDeletedTarefas`**: Busca tarefas deletadas

### v1.3.0 (04/02/2026)
- Padronização de enums DB/Frontend
- Índices de performance
- Role `associado` adicionada

### v1.2.0 (03/02/2026)
- Setup inicial multi-tenant
- RLS em todas as tabelas
- Sistema de permissões base

---

## 📄 MÓDULO TEMPLATES DE DOCUMENTOS (v2.8.0)

### Visão Geral
Permite criar, editar e reutilizar modelos jurídicos (contratos, petições, procurações, declarações, notificações) com editor rich-text, variáveis dinâmicas e geração de PDF client-side.

### Stack Técnica
- **Editor**: TipTap (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-text-align`, `@tiptap/extension-underline`) — headless, React
- **PDF**: `html2pdf.js` — converte HTML renderizado em PDF via Canvas (jsPDF) no browser; lazy import para não inflar o bundle principal
- **Variáveis**: sintaxe `{nome_var}` detectada por regex `/\{(\w+)\}/g`; substituídas antes de gerar PDF ou salvar documento
- **Storage**: Drive como primário (zero Supabase Storage); fallback para bucket `documentos`

### Estrutura de Arquivos
```
src/
├── types/documentoTemplate.ts               ← tipos domínio
├── services/documentoTemplateService.ts      ← CRUD + geração de PDF + Drive upload
├── hooks/useDocumentoTemplates.ts            ← estado + actions
├── pages/DocumentoTemplatesPage.tsx          ← lista com grid, filtro, ações
└── components/documentos/
    ├── TemplateEditorModal.tsx               ← TipTap + DetecçãoVariáveis + Drive import
    └── TemplateGerarModal.tsx                ← formulário de variáveis + preview + PDF
```

### Schema DB — `documento_templates`
```sql
CREATE TABLE public.documento_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  titulo      TEXT NOT NULL,
  categoria   TEXT NOT NULL,  -- 'contrato'|'peticao'|'procuracao'|'declaracao'|'notificacao'|'outro'
  conteudo    TEXT NOT NULL,  -- HTML gerado pelo TipTap
  variaveis   JSONB NOT NULL DEFAULT '[]',  -- [{ key, label, required, placeholder?, hint? }]
  criado_por  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ,   -- soft delete (templates são patrimônio da org)
  deleted_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
```
RLS: `templates_select` (is_org_member), `templates_insert` (is_org_member), `templates_update/delete` (is_org_admin_for_org — soft delete via UPDATE).

### Tipos Principais
```typescript
export type TemplateCategoria = 'contrato'|'peticao'|'procuracao'|'declaracao'|'notificacao'|'outro'

export interface TemplateVariavel {
  key: string; label: string; required: boolean; placeholder?: string; hint?: string
}

export interface DocumentoTemplate {
  id, orgId, titulo, categoria: TemplateCategoria, conteudo: string,
  variaveis: TemplateVariavel[], criadoPor?, createdAt, updatedAt, deletedAt?
}
```

### Fluxo de Geração (`generateFromTemplate`)
1. `generatePdfBlob()` → html2pdf.js → `Blob`
2. `driveService.isConnected()` → se sim, `ensureFolder("SDR Jurídico")` + subpasta por caso → `uploadPdf()` → `driveFileId + webViewLink`
3. Se Drive falhar ou não estiver conectado → `supabase.storage.from('documentos').upload()` → `storagePath`
4. `supabase.from('documentos').insert({ drive_file_id?, drive_url?, storage_path? })` → retorna `{ documentoId, url }`

### Gate de Plano
`canUseTemplates` (professional+) — `UpgradeWall` retornado antes do conteúdo em Trial e Basic.

---

## ⏱️ MÓDULO TIMESHEET + HONORÁRIOS (v2.8.0)

### Visão Geral
Controle de horas trabalhadas por advogado/caso, com aprovação pelo gestor e faturamento direto para o Módulo Financeiro (`financeiro_lancamentos`).

### Estrutura de Arquivos
```
src/
├── types/timesheet.ts
├── services/timesheetService.ts
├── hooks/useTimesheet.ts
└── pages/TimesheetPage.tsx
```

### Schema DB — `timesheet_entries`
```sql
CREATE TABLE public.timesheet_entries (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  responsavel_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  caso_id             UUID REFERENCES public.casos(id) ON DELETE SET NULL,
  data                DATE NOT NULL,
  horas               NUMERIC(5,2) NOT NULL CHECK (horas > 0 AND horas <= 24),
  descricao           TEXT NOT NULL,
  taxa_horaria        NUMERIC(10,2) NOT NULL CHECK (taxa_horaria >= 0),
  valor_total         NUMERIC(14,2) GENERATED ALWAYS AS (horas * taxa_horaria) STORED,
  tipo                TEXT NOT NULL DEFAULT 'billable' CHECK (tipo IN ('billable','non_billable')),
  status              TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','aprovado','faturado')),
  lancamento_id       UUID REFERENCES public.financeiro_lancamentos(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
```
RLS: SELECT (is_org_member), INSERT (is_org_member), UPDATE (dono OU is_org_admin), DELETE (is_org_admin — somente rascunhos).

### Tipos Principais
```typescript
export type TimesheetTipo   = 'billable' | 'non_billable'
export type TimesheetStatus = 'rascunho' | 'aprovado' | 'faturado'

export interface TimesheetEntry {
  id, orgId, responsavelUserId, responsavelNome?, casoId?, casoTitulo?,
  data, horas, descricao, taxaHoraria, valorTotal,
  tipo: TimesheetTipo, status: TimesheetStatus, lancamentoId?
}
```

### Fluxo de Faturamento (`faturarPeriodo`)
1. Recebe lista de entradas com `status='aprovado'`
2. Agrupa por `caso_id` (ou "Geral" se sem caso)
3. Para cada grupo: `financeiroService.createTransaction({ type:'receita', category:'Honorários', ... })`
4. `UPDATE timesheet_entries SET status='faturado', lancamento_id=<novo_id>`
5. As receitas aparecem imediatamente em `FinanceiroPage`

### Layout da Página (`TimesheetPage`)
- **Seção 1 — Header + 4 KPIs**: Horas no Mês · Valor Billable · Horas a Faturar · Entradas Pendentes
- **Seção 2 — Painel do Gestor** (só `isOrgAdmin`): tabela com checkboxes, filtros, botões "Aprovar Selecionados" e "Faturar Aprovados" (com modal de confirmação)
- **Seção 3 — Minhas Horas**: tabela pessoal filtrada por `user.id`; editar/excluir somente em rascunhos próprios
- **Modal "Registrar Horas"**: Data · Caso (select) · Horas · Taxa Horária · Descrição · Tipo; preview calculado `= R$ XXX`

### Gate de Plano
`canUseTimesheet` (professional+) — `UpgradeWall` retornado antes do conteúdo em Trial e Basic.

---

## ☁️ MÓDULO DRIVE INTEGRATION (v2.8.0)

### Visão Geral
Drive (Google Drive ou OneDrive) como backend primário de armazenamento de documentos gerados. **Zero bytes em Supabase Storage** para escritórios com Drive conectado.

### Premissa de Custo
| Armazenado no Supabase | Custo |
|---|---|
| `documento_templates.conteudo` (HTML TEXT, ~30KB/template) | ~R$0 |
| `documentos` (metadados: IDs, URLs, status, ~1KB/registro) | ~R$0 |
| Arquivos binários | **Nenhum** — ficam no Drive |

### Estrutura de Arquivos
```
src/
├── services/driveService.ts          ← wrapper Google Drive + OneDrive
└── services/driveImportService.ts    ← HTML sanitization + importação
src/components/documentos/
└── DrivePickerModal.tsx              ← seletor de arquivos do Drive
```

### `driveService.ts` — API
```typescript
export type DriveProvider = 'google_drive' | 'onedrive'

export const driveService = {
  isConnected(provider: DriveProvider): Promise<boolean>,
  listFiles(provider, query?): Promise<DriveFile[]>,
  exportAsHtml(provider, fileId): Promise<string>,
  uploadPdf(provider, blob, fileName, folderId?): Promise<{ fileId, webViewLink }>,
  ensureFolder(provider, folderName, parentId?): Promise<string>,
}
```

### Reutilização de Tokens
Os tokens OAuth já existentes são reutilizados — **sem novo fluxo OAuth**:
| Provedor | Chave no `integrationsService` | Escopos necessários |
|---|---|---|
| Google Drive | `google_calendar` → campo `access_token` | `drive.readonly` + `drive.file` |
| OneDrive | `teams` → campo `access_token` | `Files.ReadWrite` |

### `driveImportService.ts` — Sanitização HTML
- Importa arquivo do Drive via `driveService.exportAsHtml()`
- Remove: `<style>`, atributos `class`/`style`/`id`, tags `<meta>/<link>/<script>`, tags vazias
- Mantém: `<h1-h6>`, `<p>`, `<strong>`, `<em>`, `<ul>`, `<ol>`, `<li>`, `<table>`, `<br>`
- Resultado é injetado diretamente no TipTap via `editor.commands.setContent(html)`

### Campos Drive em `documentos`
```sql
ALTER TABLE public.documentos
  ADD COLUMN IF NOT EXISTS drive_file_id   TEXT,
  ADD COLUMN IF NOT EXISTS drive_provider  TEXT CHECK (drive_provider IN ('google_drive','onedrive')),
  ADD COLUMN IF NOT EXISTS drive_url       TEXT;
```
Quando `drive_file_id IS NOT NULL`, `obterUrlDocumento()` retorna `drive_url` diretamente (já suportado na `documentosService`).

### Estrutura de Pastas no Drive
```
Drive do escritório/
└── SDR Jurídico/
    ├── Caso - João Silva x Empresa X/
    │   └── Contrato de Honorários - 27-02-2026.pdf
    └── Caso - Maria Souza - Trabalhista/
        └── Contestação - 01-03-2026.pdf
```

---

## 🎨 MÓDULO BRANDING DE DOCUMENTOS (v2.8.0)

### Visão Geral
Cada organização personaliza o layout dos PDFs gerados: logo, cores, nome do escritório, OAB, endereço, telefone e rodapé. Configurado em `ConfigPage → aba Essencial`.

### Estrutura de Arquivos
```
src/
├── types/documentoTemplate.ts           ← OrgBranding + DEFAULT_BRANDING
├── services/orgBrandingService.ts        ← getBranding, upsertBranding, uploadLogo
├── hooks/useOrgBranding.ts               ← estado + actions
└── components/config/BrandingConfigCard.tsx  ← UI completa com preview ao vivo
```

### Schema DB — `org_branding`
```sql
CREATE TABLE public.org_branding (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL UNIQUE REFERENCES public.orgs(id) ON DELETE CASCADE,
  logo_url        TEXT,
  cor_primaria    TEXT NOT NULL DEFAULT '#721011',
  cor_secundaria  TEXT NOT NULL DEFAULT '#BF6F32',
  nome_display    TEXT,       -- nome no cabeçalho do documento
  oab_registro    TEXT,       -- "OAB/MG 123.456"
  endereco        TEXT,
  telefone        TEXT,
  rodape_texto    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```
RLS: SELECT (is_org_member), ALL (is_org_admin_for_org). UPSERT via `ON CONFLICT (org_id) DO UPDATE`.

Storage bucket: `org-logos` — path `{orgId}/logo.{ext}`, max 2MB, tipos PNG/JPG/WebP/SVG.

### Tipos
```typescript
export interface OrgBranding {
  id: string; orgId: string; logoUrl?: string
  corPrimaria: string; corSecundaria: string
  nomeDisplay?: string; oabRegistro?: string
  endereco?: string; telefone?: string; rodapeTexto?: string
}

export const DEFAULT_BRANDING: OrgBranding = {
  id: '', orgId: '', corPrimaria: '#721011', corSecundaria: '#BF6F32'
}
```

### `buildHtmlWithBranding(content, branding)` — Template HTML
Injeta cabeçalho e rodapé ao redor do conteúdo do template antes de gerar o PDF:
```
┌────────────────────────────────────────────────────────┐
│  [Logo]                          Nome do Escritório    │
│                                  OAB/MG 123.456        │
│  ── borda corPrimaria ──────────────────────────────── │
│                                                        │
│  [Conteúdo do Template com variáveis substituídas]     │
│                                                        │
│  ── borda cinza ──────────────────────────────────── ─ │
│  Endereço · Telefone           Texto do rodapé         │
└────────────────────────────────────────────────────────┘
```

### Gate de Plano
`canUseBranding` (basic+) — `UpgradeWall` retornado em Trial.

---

## 📊 TABELA DE FEATURE GATES (estado v2.8.0)

| Feature | Trial | Basic | Professional | Enterprise |
|---------|:-----:|:-----:|:------------:|:----------:|
| Templates de documentos | UpgradeWall | UpgradeWall | ✅ | ✅ |
| Timesheet + Honorários | UpgradeWall | UpgradeWall | ✅ | ✅ |
| Branding do escritório | UpgradeWall | ✅ | ✅ | ✅ |
| Financeiro | UpgradeWall | ✅ | ✅ | ✅ |
| PJe/MNI + eProc | ❌ | ❌ | ✅ | ✅ |
| Diário Oficial (DOU) | ❌ | ❌ | ✅ | ✅ |
| Analytics Executivo | ❌ | ❌ | ✅ | ✅ |
| Waze Jurídico (IA) | ❌ | ❌ | ❌ | ✅ |
