# 📋 Plano de Implantação em Produção - SDR Jurídico

**Data:** 5 de janeiro de 2026  
**Projeto:** SDR Jurídico (Interface 2 - Web)  
**Stack:** React 19 + TypeScript + Vite + Tailwind CSS  
**Backend:** Supabase (PostgreSQL)

---

## 1️⃣ ANÁLISE DO PROJETO ATUAL

### 1.1 Stack Tecnológico
```
Frontend:
├── React 19.2.0 (biblioteca UI)
├── TypeScript 5.9.3 (tipagem)
├── Vite 7.2.4 (build tool)
├── Tailwind CSS 4.1.18 (estilização)
├── React Router DOM 7.11.0 (roteamento)
├── Recharts 3.6.0 (gráficos)
├── Lucide React 0.562.0 (ícones)
└── Sonner 2.0.7 (notificações)

Build:
├── ESLint 9.39.1 (linting)
├── PostCSS 8.5.6 (pós-processamento CSS)
└── @Tailwind CSS/Vite 4.1.18 (integração)
```

### 1.2 Estrutura do Projeto
```
src/
├── App.tsx                    # Componente raiz com Router
├── main.tsx                   # Entry point
├── index.css                  # Estilos globais
├── app/
│   └── router.tsx            # Configuração de rotas
├── pages/                     # Páginas principais (13 pages)
│   ├── DashboardPage.tsx      # Dashboard principal
│   ├── CasosPage.tsx          # Gerenciamento de casos
│   ├── ClientesPage.tsx       # Gerenciamento de clientes
│   ├── DocumentosPage.tsx     # Gerenciamento de documentos
│   ├── LeadsPage.tsx          # Gerenciamento de leads
│   ├── AgendaPage.tsx         # Agenda/calendário
│   ├── IndicadoresPage.tsx    # KPIs e indicadores
│   ├── ConfigPage.tsx         # Configurações e integrações
│   ├── LoginPage.tsx          # Autenticação
│   ├── ForgotPasswordPage.tsx # Reset de senha
│   ├── ResetPasswordPage.tsx  # Confirmar reset
│   ├── CasoPage.tsx           # Detalhes de caso
│   └── NotFoundPage.tsx       # Página 404
├── components/                # Componentes reutilizáveis
│   ├── DataTable.tsx          # Tabelas de dados
│   ├── ActionCard.tsx         # Cards de ações
│   ├── StatCard.tsx           # Cards de estatísticas
│   ├── Timeline.tsx           # Timeline de eventos
│   ├── LeadDrawer.tsx         # Drawer de leads
│   ├── NotificationCenter.tsx # Central de notificações
│   ├── PageState.tsx          # Estados de página
│   └── ui/                    # Componentes base UI
├── layouts/                   # Layouts (AuthLayout, etc)
├── types/                     # Definições TypeScript
├── data/                      # Mock data
├── theme/                     # Sistema de tema
├── utils/                     # Funções utilitárias
└── assets/                    # Imagens e SVGs
```

### 1.3 Funcionalidades Principais
- ✅ Autenticação com email/senha
- ✅ Dashboard com indicadores e gráficos
- ✅ Gerenciamento de casos jurídicos
- ✅ Gerenciamento de clientes
- ✅ Gerenciamento de documentos
- ✅ Sistema de leads
- ✅ Agenda/calendário
- ✅ Configurações de integrações
- ✅ Notificações em tempo real
- ✅ Sistema de temas (light/dark)

### 1.4 Status Atual de Integração
- ⚠️ Login mockado (sem integração real)
- ⚠️ Dados em mock (sem conexão com BD)
- ⚠️ Sem autenticação Supabase
- ⚠️ Sem persistência de dados
- ⚠️ Sem API backend

---

## 2️⃣ ETAPAS DE IMPLANTAÇÃO

### Fase 1: Preparação e Configuração Supabase (2-3 dias)

#### 1.1 - Setup Supabase Cloud
- [ ] Criar projeto no Supabase
- [ ] Gerar API Keys (anon + service_role)
- [ ] Configurar RLS (Row Level Security)
- [ ] Habilitar autenticação por email
- [ ] Configurar políticas de segurança

#### 1.2 - Criar Schema do Banco de Dados
```sql
-- Tabelas principais necessárias:
usuarios
├── id (UUID)
├── email (único)
├── senha_hash
├── nome_completo
├── telefone
├── especialidade
├── criado_em
└── atualizado_em

clientes
├── id (UUID)
├── usuario_id (FK)
├── nome_razao_social
├── cpf_cnpj
├── email
├── telefone
├── endereco
├── cidade
├── estado
├── criado_em
└── atualizado_em

casos
├── id (UUID)
├── usuario_id (FK) - advogado responsável
├── cliente_id (FK)
├── titulo
├── descricao
├── area (enum: trabalhista, civil, criminal, etc)
├── status (enum: novo, em andamento, resolvido, arquivado)
├── data_abertura
├── prazo_proximo_passo
├── valor_estimado
├── criado_em
└── atualizado_em

documentos
├── id (UUID)
├── caso_id (FK)
├── titulo
├── tipo (enum: contrato, parecer, sentenca, etc)
├── url_arquivo (Supabase Storage)
├── tamanho_bytes
├── upload_em
└── criado_por (FK usuarios)

leads
├── id (UUID)
├── usuario_id (FK)
├── nome
├── email
├── telefone
├── origem (enum: site, indicacao, anuncio, etc)
├── status (enum: novo, contatado, interessado, descartado)
├── qualidade (enum: frio, morno, quente)
├── proxima_acao
├── data_contato
├── criado_em
└── atualizado_em

agenda
├── id (UUID)
├── usuario_id (FK)
├── titulo
├── descricao
├── data_hora
├── duracao_minutos
├── tipo (enum: reuniao, audiencia, prazo, etc)
├── localizacao
├── criado_em
└── atualizado_em
```

#### 1.3 - Configurar Storage (para documentos)
- [ ] Criar bucket: `documentos-casos`
- [ ] Configurar políticas de acesso (authenticated users)
- [ ] Limitar tipos de arquivo permitidos
- [ ] Estabelecer limite de tamanho

---

### Fase 2: Integração Frontend com Supabase (3-4 dias)

#### 2.1 - Instalar e Configurar Cliente Supabase
```bash
npm install @supabase/supabase-js
```

#### 2.2 - Criar Arquivo de Configuração
```typescript
// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)
```

#### 2.3 - Implementar Autenticação Real
**Atualizações necessárias:**
- [ ] Integrar `LoginPage.tsx` com Supabase Auth
- [ ] Integrar `ForgotPasswordPage.tsx`
- [ ] Integrar `ResetPasswordPage.tsx`
- [ ] Criar hook personalizado `useAuth()`
- [ ] Implementar Protected Routes
- [ ] Armazenar token em localStorage
- [ ] Implementar refresh token automático

#### 2.4 - Criar Serviços de API
```typescript
// src/services/
├── authService.ts         # Autenticação
├── casosService.ts        # CRUD de casos
├── clientesService.ts     # CRUD de clientes
├── documentosService.ts   # CRUD de documentos + upload
├── leadsService.ts        # CRUD de leads
├── agendaService.ts       # CRUD de agenda
├── usuariosService.ts     # Perfil do usuário
└── dashboardService.ts    # Dados de indicadores
```

#### 2.5 - Atualizar Componentes de Páginas
- [ ] `DashboardPage.tsx` - Buscar dados reais
- [ ] `CasosPage.tsx` - Integrar CRUD de casos
- [ ] `ClientesPage.tsx` - Integrar CRUD de clientes
- [ ] `DocumentosPage.tsx` - Upload + visualização
- [ ] `LeadsPage.tsx` - Integrar gerenciamento de leads
- [ ] `AgendaPage.tsx` - Sincronizar com calendário real
- [ ] `IndicadoresPage.tsx` - Calcular KPIs em tempo real
- [ ] `ConfigPage.tsx` - Atualizar credenciais Supabase

---

### Fase 3: Testes e Validação (2-3 dias)

#### 3.1 - Testes Unitários
```bash
npm run test
```
- [ ] Testar serviços de API
- [ ] Testar hooks customizados
- [ ] Testar componentes principais

#### 3.2 - Testes de Integração
- [ ] Fluxo de login/logout
- [ ] CRUD de casos
- [ ] Upload de documentos
- [ ] Sincronização em tempo real
- [ ] Tratamento de erros

#### 3.3 - Testes de Performance
- [ ] Lighthouse
- [ ] Bundle size
- [ ] Carregamento de páginas

#### 3.4 - Testes de Segurança
- [ ] RLS policies do Supabase
- [ ] HTTPS obrigatório
- [ ] Validação de input
- [ ] Proteção contra CSRF/XSS

---

### Fase 4: Deploy em Produção (1-2 dias)

#### 4.1 - Preparar Build
```bash
npm run build
```
- [ ] Verificar otimizações
- [ ] Gerar bundle analysis
- [ ] Minificar assets

#### 4.2 - Opções de Hosting

**Opção A: Vercel (Recomendado)**
```bash
npm i -g vercel
vercel login
vercel
```
- ✅ Integração com Git
- ✅ CI/CD automático
- ✅ Edge Functions (para API routes opcionais)
- ✅ Serverless
- ✅ Free tier disponível

**Opção B: Netlify**
```bash
npm i -g netlify-cli
netlify login
netlify deploy
```
- ✅ Integração com Git
- ✅ Serverless functions
- ✅ Free tier

**Opção C: CloudFlare Pages**
- ✅ CDN global
- ✅ Workers (serverless)
- ✅ Muito rápido

#### 4.3 - Configurar Variáveis de Ambiente
```bash
# .env.production
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_publica
VITE_API_URL=https://seu-projeto.supabase.co
```

#### 4.4 - Configurar Domínio Customizado
- [ ] Comprar/configurar domínio
- [ ] Apontar DNS para hosting
- [ ] Gerar certificado SSL (automático na maioria)

---

### Fase 5: Monitoramento e Manutenção (Contínuo)

#### 5.1 - Monitoramento
- [ ] Configurar error tracking (Sentry)
- [ ] Analytics (Google Analytics ou Mixpanel)
- [ ] Uptime monitoring
- [ ] Log aggregation

#### 5.2 - Backup e Recuperação
- [ ] Configurar backups automáticos do Supabase
- [ ] Plano de recuperação de desastres
- [ ] Documentar procedimentos

#### 5.3 - Escalabilidade
- [ ] Monitorar uso de recursos
- [ ] Otimizar queries do banco
- [ ] Implementar caching se necessário
- [ ] Considerar edge functions para lógica pesada

---

## 3️⃣ ARQUITETURA PROPOSTA EM PRODUÇÃO

```
┌─────────────────────────────────────────────────────────────┐
│                    Cliente Web (Vercel/Netlify)             │
│  React 19 + TypeScript + Vite (SPA - Single Page App)       │
│  - Autenticação com Supabase Auth                           │
│  - Requisições REST/RPC para Supabase                       │
│  - Storage de arquivos (Supabase)                           │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTPS
┌────────────────▼────────────────────────────────────────────┐
│                   Supabase Cloud (Backend)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ PostgreSQL Database (com PostGIS opcional)           │   │
│  │ - Tabelas: usuarios, clientes, casos, docs, leads    │   │
│  │ - RLS (Row Level Security) para proteção             │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Autenticação (Auth)                                  │   │
│  │ - Email/Senha (JWT tokens)                           │   │
│  │ - OAuth (opcional: Google, GitHub)                   │   │
│  │ - MFA support                                         │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Storage (para documentos)                            │   │
│  │ - bucket: documentos-casos                           │   │
│  │ - Políticas de acesso baseadas em RLS               │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Realtime (opcional)                                  │   │
│  │ - Notificações em tempo real                         │   │
│  │ - Sincronização de dados                             │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          │                             │
     ┌────▼─────┐              ┌───────▼───┐
     │   Email  │              │  Storage  │
     │ (Convite)│              │  Externo  │
     └──────────┘              │  (S3/GCS) │
                               └───────────┘
```

---

## 4️⃣ CHECKLIST DE SEGURANÇA

### Autenticação & Autorização
- [ ] JWT tokens com expiração apropriada
- [ ] Refresh token rotation
- [ ] RLS policies configuradas no Supabase
- [ ] Hash de senhas (Supabase faz automaticamente)
- [ ] Rate limiting em endpoints sensíveis
- [ ] 2FA/MFA implementado

### Dados
- [ ] Criptografia em trânsito (HTTPS)
- [ ] Criptografia em repouso (Supabase)
- [ ] Backup automático configurado
- [ ] GDPR compliance (se necessário)
- [ ] Logs de auditoria para ações críticas

### Frontend
- [ ] Validação de entrada
- [ ] Proteção contra XSS
- [ ] Proteção contra CSRF
- [ ] Content Security Policy (CSP)
- [ ] CORS configurado corretamente

### Infrastructure
- [ ] Certificado SSL/TLS
- [ ] WAF (Web Application Firewall) opcional
- [ ] DDoS protection
- [ ] Rate limiting global

---

## 5️⃣ VARIÁVEIS DE AMBIENTE

### Desenvolvimento (.env.local)
```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=local_anon_key
```

### Staging (.env.staging)
```env
VITE_SUPABASE_URL=https://staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=staging_anon_key
```

### Produção (.env.production)
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=producao_anon_key
```

---

## 6️⃣ TIMELINE ESTIMADA

| Fase | Duração | Status |
|------|---------|--------|
| 1. Setup Supabase | 2-3 dias | ⏳ Não iniciado |
| 2. Integração Frontend | 3-4 dias | ⏳ Não iniciado |
| 3. Testes | 2-3 dias | ⏳ Não iniciado |
| 4. Deploy | 1-2 dias | ⏳ Não iniciado |
| **Total** | **8-12 dias** | **EM PLANEJAMENTO** |

---

## 7️⃣ RECURSOS NECESSÁRIOS

### Contas/Serviços
- ✅ Supabase Cloud (free tier suficiente para iniciar)
- ✅ Vercel/Netlify (free tier disponível)
- ✅ Domínio customizado (opcional)
- ✅ Email provider (para transacionais)

### Ferramentas
- ✅ Git/GitHub
- ✅ VS Code ou editor similar
- ✅ Postman/Insomnia (para testar API)
- ✅ pgAdmin (gerenciar PostgreSQL)

### Conhecimentos
- ✅ React/TypeScript
- ✅ SQL básico
- ✅ REST APIs
- ✅ Git
- ✅ Docker (opcional)

---

## 8️⃣ PRÓXIMOS PASSOS

### Imediatos (Esta semana)
1. [ ] Criar projeto no Supabase
2. [ ] Documentar credenciais de forma segura
3. [ ] Criar schema do banco de dados
4. [ ] Fazer backup desta documentação

### Curto Prazo (Próximas 2 semanas)
1. [ ] Integrar Supabase com frontend
2. [ ] Implementar autenticação real
3. [ ] Conectar páginas principais com BD
4. [ ] Testar fluxos críticos

### Médio Prazo (1 mês)
1. [ ] Cobertura completa de testes
2. [ ] Otimizações de performance
3. [ ] Documentação de API
4. [ ] Plano de segurança final

### Longo Prazo (2-3 meses)
1. [ ] Deploy em produção
2. [ ] Monitoramento ativo
3. [ ] Feedback de usuários
4. [ ] Iterações de melhorias

---

## 9️⃣ CONTATOS E SUPORTE

| Recurso | Link |
|---------|------|
| Documentação Supabase | https://supabase.com/docs |
| Comunidade Supabase | https://discord.supabase.io |
| React Router Docs | https://reactrouter.com |
| Vite Docs | https://vitejs.dev |
| Vercel Docs | https://vercel.com/docs |

---

## 🔟 NOTAS IMPORTANTES

> ⚠️ **Segurança**: Nunca commitar credenciais. Use variáveis de ambiente!

> 💡 **Performance**: Implementar lazy loading e code splitting desde o início.

> 📱 **Mobile**: Testar responsividade em diferentes dispositivos.

> 🔄 **Versionamento**: Manter histórico de migrations do banco de dados.

> 📝 **Documentação**: Manter docs atualizadas conforme implementação.

---

**Última atualização:** 5 de janeiro de 2026  
**Status:** Em Planejamento ✋
