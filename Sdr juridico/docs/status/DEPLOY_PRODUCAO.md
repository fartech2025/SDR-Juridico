# 🚀 Guia de Deploy em Produção

**Data:** 5 de janeiro de 2026  
**Projeto:** SDR Jurídico

---

## 1. PRÉ-REQUISITOS

### Contas Necessárias
- [ ] Conta Supabase (https://supabase.com)
- [ ] Conta Vercel (https://vercel.com) ou Netlify (https://netlify.com)
- [ ] Domínio customizado (opcional, mas recomendado)
- [ ] Gmail/outro email para notificações

### Variáveis de Ambiente
```env
# Obter do Supabase Dashboard > Settings > API
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

---

## 2. DEPLOY COM VERCEL (Recomendado)

### 2.1 Instalação e Configuração
```bash
# Instalar CLI do Vercel
npm i -g vercel

# Fazer login
vercel login

# Entrar no diretório do projeto
cd /Users/fernandodias/Projeto-ENEM/Sdr\ juridico
```

### 2.2 Primeira Deploy (Interactive)
```bash
vercel

# Responder perguntas:
# ? Set up and deploy "~/Projeto-ENEM/Sdr juridico"? [Y/n] → Y
# ? Which scope? → Seu usuário/organização
# ? Link to existing project? [y/N] → N (primeira vez)
# ? Project name → sdr-juridico
# ? Directory → .
# ? Command to override → npm run build
# ? Install dependencies? [Y/n] → Y
```

### 2.3 Configurar Variáveis de Ambiente

**Opção A: Via CLI**
```bash
vercel env add VITE_SUPABASE_URL
# Cole: https://xxxxx.supabase.co
# Selecione: Production, Preview, Development

vercel env add VITE_SUPABASE_ANON_KEY
# Cole: eyJhbGc...
# Selecione: Production, Preview, Development
```

**Opção B: Via Dashboard**
1. Acesse https://vercel.com/dashboard
2. Selecione projeto "sdr-juridico"
3. Settings > Environment Variables
4. Adicione:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### 2.4 Deploy em Produção
```bash
# Deploy para staging (preview)
vercel preview

# Deploy para produção
vercel --prod
```

### 2.5 Configurar Domínio Customizado

**No Dashboard Vercel:**
1. Projeto > Settings > Domains
2. Clique "Add Domain"
3. Digite seu domínio (ex: sdr-juridico.com.br)
4. Configure DNS apontando para Vercel

**No Registrador de Domínio (ex: Registro.br):**
```
Tipo: CNAME
Nome: www
Valor: cname.vercel-dns.com

OU (para root domain):
Tipo: A
Nome: @
Valor: 76.76.19.124 (verificar em Vercel)
```

---

## 3. DEPLOY COM NETLIFY (Alternativa)

### 3.1 Instalação
```bash
# Instalar CLI do Netlify
npm i -g netlify-cli

# Fazer login
netlify login
```

### 3.2 Deploy
```bash
cd /Users/fernandodias/Projeto-ENEM/Sdr\ juridico

# Primeira deploy (interativo)
netlify deploy

# Responder perguntas e configurar site
```

### 3.3 Configurar Variáveis de Ambiente
```bash
# Via CLI
netlify env:set VITE_SUPABASE_URL https://xxxxx.supabase.co
netlify env:set VITE_SUPABASE_ANON_KEY eyJhbGc...
```

### 3.4 Deploy em Produção
```bash
netlify deploy --prod
```

---

## 4. CI/CD COM GITHUB ACTIONS (Automático)

### 4.1 Preparar Repositório
```bash
# Ir ao diretório do projeto
cd /Users/fernandodias/Projeto-ENEM/Sdr\ juridico

# Inicializar git (se não existir)
git init
git add .
git commit -m "Initial commit - SDR Juridico"

# Adicionar remote (criar repo no GitHub primeiro)
git remote add origin https://github.com/seu-usuario/sdr-juridico.git
git branch -M main
git push -u origin main
```

### 4.2 Criar Workflow do GitHub Actions

Criar arquivo `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run lint
        run: npm run lint
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 4.3 Configurar Secrets no GitHub

1. Ir para repositório GitHub
2. Settings > Secrets and variables > Actions
3. Adicionar:
   - `VERCEL_TOKEN`: Obter em https://vercel.com/account/tokens
   - `VERCEL_ORG_ID`: ID da organização
   - `VERCEL_PROJECT_ID`: ID do projeto

---

## 5. BUILD OTIMIZADO

### 5.1 Verificar Build
```bash
npm run build

# Output esperado:
# ✓ 1234 modules transformed
# dist/index.html              0.45 kB
# dist/assets/index-xxx.js     145.23 kB
# dist/assets/index-xxx.css    25.14 kB
```

### 5.2 Analisar Bundle Size
```bash
npm install -D webpack-bundle-analyzer

# Adicionar ao vite.config.ts:
# import { visualizer } from 'rollup-plugin-visualizer'
# plugins: [visualizer()]

npm run build
# Abrir dist/stats.html
```

### 5.3 Otimizações
- [ ] Lazy load de rotas com React.lazy()
- [ ] Code splitting automático via Vite
- [ ] Tree-shaking de dependências não usadas
- [ ] Minificação de CSS e JS
- [ ] Compressão gzip (automático em Vercel/Netlify)

---

## 6. MONITORAMENTO EM PRODUÇÃO

### 6.1 Error Tracking com Sentry
```bash
npm install @sentry/react @sentry/tracing
```

Adicionar em `src/main.tsx`:
```typescript
import * as Sentry from "@sentry/react"

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
})
```

### 6.2 Logs de Aplicação
```typescript
// src/utils/logger.ts
export const logger = {
  error: (message: string, error?: any) => {
    console.error(message, error)
    // Enviar para serviço de logs
  },
  info: (message: string, data?: any) => {
    console.log(message, data)
  },
  warn: (message: string, data?: any) => {
    console.warn(message, data)
  }
}
```

### 6.3 Analytics
```bash
npm install gtag.js
```

Ou usar Google Analytics 4 via Supabase integrado.

---

## 7. HEALTH CHECK

### 7.1 Criar Endpoint de Health
```typescript
// public/health.json
{
  "status": "ok",
  "timestamp": "2026-01-05T10:00:00Z",
  "version": "1.0.0"
}
```

### 7.2 Configurar Monitoring
- Uptime Robot (https://uptimerobot.com)
- Pingdom (https://www.pingdom.com)
- StatusPage (https://www.statuspage.io)

---

## 8. BACKUP E RECUPERAÇÃO

### 8.1 Backup Automático Supabase
- ✅ Habilitado por padrão
- ✅ Retenção: 7 dias (free) / 30 dias (pro)
- ✅ PITR: Point-in-time recovery

### 8.2 Backup Manual
```bash
# Fazer dump do banco
pg_dump -h xxxxx.supabase.co -U postgres -d postgres > backup.sql

# Restaurar (quando necessário)
psql -h xxxxx.supabase.co -U postgres -d postgres < backup.sql
```

### 8.3 Plano de Recuperação
1. Se BD cair: Restaurar do backup mais recente
2. Se app der erro: Rollback via Vercel/Netlify
3. Se dados corrompidos: PITR do Supabase

---

## 9. PERFORMANCE CHECKLIST

Antes de ir para produção:

- [ ] Lighthouse score > 90
- [ ] Bundle size < 200KB (gzip)
- [ ] CLS (Cumulative Layout Shift) < 0.1
- [ ] FCP (First Contentful Paint) < 2s
- [ ] LCP (Largest Contentful Paint) < 2.5s
- [ ] TTFB (Time to First Byte) < 600ms
- [ ] Sem console errors
- [ ] Responsivo em mobile
- [ ] Testes passando 100%

### Executar Auditoria
```bash
# Instalar Lighthouse CLI
npm install -g lighthouse

# Auditar
lighthouse https://seu-site.com --view

# Ou usar PageSpeed Insights
https://pagespeed.web.dev/
```

---

## 10. SEGURANÇA PRÉ-DEPLOY

Checklist final:

### Código
- [ ] Sem console.log em produção
- [ ] Sem credenciais hardcoded
- [ ] Sem TODO/FIXME deixados
- [ ] Dependências auditadas (npm audit)

### Configuração
- [ ] CSP (Content Security Policy) headers
- [ ] CORS configurado corretamente
- [ ] HTTPS forçado
- [ ] Cookies com secure flag

### Dados
- [ ] Senhas hasheadas (Supabase faz)
- [ ] PII não logged
- [ ] Backup testado
- [ ] RLS policies testadas

### Acesso
- [ ] Variáveis de env. não expõas
- [ ] Service key guardada (backend only)
- [ ] 2FA ativado em contas
- [ ] Acesso de BD limitado

---

## 11. PÓS-DEPLOY CHECKLIST

Depois de ir para produção:

- [ ] Testar fluxo de login
- [ ] Testar CRUD de casos
- [ ] Testar upload de documentos
- [ ] Verificar emails transacionais
- [ ] Monitorar erros em Sentry
- [ ] Verificar logs do banco
- [ ] Testar em diferentes navegadores/dispositivos
- [ ] Compartilhar com beta users
- [ ] Documentar issues encontradas
- [ ] Planejar melhorias

---

## 12. ROLLBACK PROCEDURE

Se algo der errado:

### Via Vercel
```bash
vercel rollback

# Ou via dashboard:
# Project > Deployments > Clique na deploy anterior > Promote
```

### Via Netlify
```bash
netlify deploy --prod --dir=dist

# Usar commit anterior como base
```

### Restore do Banco
```bash
# Se dados foram corrompidos:
# Supabase Dashboard > Backups > Restore to point-in-time
```

---

## 13. LOGS E DEBUGGING

### Ver Logs do Vercel
```bash
vercel logs https://seu-site.com
```

### Ver Logs do Netlify
```bash
netlify logs
```

### Ver Logs do Supabase
No dashboard:
- Logs > Database > Query performance
- Logs > Edge Functions
- Logs > Auth

---

## 14. SCALING PARA ALTA CARGA

Se tiver muitos usuários:

### Frontend
- [ ] CDN global (Vercel/Netlify fazem)
- [ ] Image optimization (Next.js Image)
- [ ] Service Worker (PWA)
- [ ] Caching estratégico

### Backend (Supabase)
- [ ] Upgrade para plano Pro ($25/mês)
- [ ] Connection pooling
- [ ] Database replication (multi-region)
- [ ] Read replicas
- [ ] Caching com Redis

### Monitoramento
- [ ] New Relic ou DataDog
- [ ] Alerts configurados
- [ ] SLA definido (99.9% uptime)

---

## 15. DOCUMENTAÇÃO FINAL

Manter documentado:

```
PRODUCAO_DOCS/
├── README.md               # Overview
├── DEPLOYMENT.md           # Este arquivo
├── RUNBOOKS.md            # Procedimentos operacionais
├── INCIDENT_RESPONSE.md   # O que fazer se cair
├── MONITORING.md          # Métricas e alertas
└── MAINTENANCE.md         # Backup, updates, patches
```

---

## 📞 TROUBLESHOOTING

### Build falha
```bash
# Limpar cache
rm -rf node_modules dist .vercel
npm install
npm run build
```

### App não carrega
```bash
# Verificar .env
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Testar conexão Supabase
curl https://xxxxx.supabase.co/rest/v1/usuarios?limit=1 \
  -H "apikey: xxxxx"
```

### Banco lento
```sql
-- Analisar queries lentas
SELECT * FROM pg_stat_statements 
WHERE mean_exec_time > 100 
ORDER BY mean_exec_time DESC;

-- Criar índices
CREATE INDEX idx_cases_status ON casos(status);
```

---

## ✅ CHECKLIST FINAL DE DEPLOY

- [ ] Código revisado (code review)
- [ ] Testes passando (100% cobertura crítica)
- [ ] Build otimizado
- [ ] Variáveis de env. configuradas
- [ ] Domínio apontando
- [ ] SSL/TLS ativado
- [ ] Backup testado
- [ ] Monitoramento configurado
- [ ] Time notificado
- [ ] Plano de rollback pronto
- [ ] Documentação atualizada
- [ ] 🚀 DEPLOY!

---

**Status:** 🟢 Pronto para deploy  
**Última atualização:** 5 de janeiro de 2026  
**Versão:** 1.0
