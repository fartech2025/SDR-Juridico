# 🚀 Deploy SDR Jurídico - Vercel

## Configuração Rápida

### 1. Pré-requisitos
- ✅ Vercel CLI instalado (já instalado)
- ✅ Conta Vercel ativa
- ✅ Variáveis de ambiente configuradas

### 2. Deploy Manual

No terminal, execute:

```bash
cd "/Users/fernandodias/Desktop/SDR JURIDICO/Sdr juridico"
vercel --prod
```

Responda as perguntas:
1. **Set up and deploy?** → `Yes`
2. **Which scope?** → Selecione seu scope
3. **Link to existing project?** → `No` (primeira vez) ou `Yes` (deployments futuros)
4. **Project name?** → `sdr-juridico` (ou outro nome)
5. **Directory?** → `.` (enter)
6. **Override settings?** → `No` (já está no vercel.json)

### 3. Configurar Variáveis de Ambiente na Vercel

Após o primeiro deploy, acesse o painel da Vercel:

1. Vá em **Settings** → **Environment Variables**
2. Adicione as seguintes variáveis:

```
VITE_SUPABASE_URL=https://xocqcoebreoiaqxoutar.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvY3Fjb2VicmVvaWFxeG91dGFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODgzNTksImV4cCI6MjA4MzI2NDM1OX0.BHfigXbXIfBWMjLBUED2Pww_v57VKUT4yOOqLPWMQkc
```

3. Marque para aplicar em **Production**, **Preview** e **Development**
4. Clique em **Save**

### 4. Redeploy com Variáveis

Após configurar as variáveis, faça um redeploy:

```bash
vercel --prod --force
```

### 5. Deployments Futuros

Para deployments futuros (após o primeiro):

```bash
vercel --prod
```

Ou use o script automatizado:

```bash
chmod +x deploy.sh
./deploy.sh
```

## 📋 Configuração do Projeto

### vercel.json

O arquivo `vercel.json` já está configurado com:

- ✅ Framework: Vite
- ✅ Build Command: `npm run build`
- ✅ Output Directory: `dist`
- ✅ SPA Routing (todas rotas → index.html)
- ✅ Cache de assets otimizado
- ✅ Variáveis de ambiente

### package.json

Scripts disponíveis:

```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview"
}
```

## 🔧 Troubleshooting

### Erro: "Command failed"

**Solução:**
```bash
# Limpar cache e reinstalar
rm -rf node_modules dist
npm install
npm run build
```

### Erro: "Missing environment variables"

**Solução:**
1. Verifique o arquivo `.env` local
2. Configure as variáveis no painel da Vercel
3. Faça redeploy com `vercel --prod --force`

### Erro: "Build timeout"

**Solução:**
1. Verifique se não há imports circulares
2. Otimize dependências pesadas
3. Use `--force` para forçar rebuild

### Problema com Rotas (404 em subpáginas)

**Solução:** Já configurado no `vercel.json` com:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## 🌐 Domínio Customizado

### Adicionar Domínio

1. Acesse seu projeto na Vercel
2. Vá em **Settings** → **Domains**
3. Clique em **Add Domain**
4. Adicione seu domínio (ex: `sdrjuridico.com`)
5. Configure DNS conforme instruções da Vercel

### DNS Recomendado

**Opção 1 - Usar Nameservers da Vercel:**
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

**Opção 2 - Usar A Record:**
```
Type: A
Name: @
Value: 76.76.21.21
```

**Opção 3 - Usar CNAME:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

## 📊 Monitoramento

### Analytics

A Vercel fornece analytics automático:
- 📈 Pageviews
- ⚡ Performance (Web Vitals)
- 🌍 Geolocalização de usuários

Acesse em: **Analytics** no painel do projeto

### Logs

Ver logs de build e runtime:
```bash
vercel logs <deployment-url>
```

Ou acesse no painel: **Deployments** → Clique no deployment → **Logs**

## 🔄 CI/CD com Git

### Configurar Deploy Automático

1. No painel da Vercel, vá em **Settings** → **Git**
2. Conecte seu repositório GitHub
3. Configure:
   - **Production Branch:** `main`
   - **Auto-deploy:** Enabled

Agora, todo `git push` para `main` fará deploy automático!

### Comandos Git + Deploy

```bash
# Commit e push
git add .
git commit -m "feat: nova funcionalidade"
git push origin main

# Deploy automático será acionado
```

## 📱 Preview Deployments

Toda branch/PR cria um preview deployment:

```bash
# Criar branch e fazer push
git checkout -b feature/nova-funcionalidade
git push origin feature/nova-funcionalidade

# Vercel cria preview deployment automaticamente
```

## 🎯 Performance

### Otimizações Aplicadas

- ✅ Code splitting automático (Vite)
- ✅ Tree shaking
- ✅ Asset compression (Brotli + Gzip)
- ✅ CDN global da Vercel
- ✅ Cache agressivo de assets
- ✅ HTTP/3 habilitado

### Web Vitals Esperados

- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

## 📚 Recursos

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Documentation](https://vitejs.dev)
- [Supabase Documentation](https://supabase.com/docs)

## 🆘 Suporte

Problemas? Contate:
- Vercel Support: https://vercel.com/support
- GitHub Issues: (criar repositório de issues)

---

**Mantido por:** Equipe SDR Jurídico  
**Última atualização:** 28 de janeiro de 2026
