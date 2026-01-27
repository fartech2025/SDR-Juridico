# 🚀 Deploy do Projeto ENEM

## 📋 Opções de Deploy

### 1. 🎯 **GitHub Pages (Automático)**
- ✅ **Já configurado** no repositório
- 🔄 **Deploy automático** a cada push na branch `main`
- 🌐 **URL**: `https://alanmerlini.github.io/Projeto-ENEM/`

#### Como ativar:
1. Vá em `Settings` → `Pages` no GitHub
2. Selecione `GitHub Actions` como source
3. O deploy será automático com cada push

### 2. ⚡ **Vercel (Recomendado)**
- 🚀 **Mais rápido** e **confiável**
- 🔄 **Deploy automático** conectado ao GitHub
- 🌐 **URL customizada** disponível

#### Como configurar:
```bash
# 1. Instale a CLI do Vercel
npm i -g vercel

# 2. No diretório do projeto
cd /Users/fernandodias/Desktop/BancoEnem
vercel

# 3. Siga as instruções
# - Link to existing project? N
# - Project name: enem-app-ultra
# - Directory: app/
```

### 3. 🟢 **Netlify**
- 🎨 **Interface amigável**
- 🔄 **Deploy automático**
- 📊 **Analytics inclusos**

#### Como configurar:
1. Conecte conta no [Netlify](https://netlify.com)
2. "Import from Git" → Selecione repositório
3. Build settings:
   - **Base directory**: `app/`
   - **Build command**: `npm run build`
   - **Publish directory**: `app/dist/`

### 4. ☁️ **Railway**
- 🚂 **Deploy full-stack** (frontend + backend)
- 💾 **Banco de dados** incluído
- 🔄 **CI/CD automático**

#### Como configurar:
```bash
# 1. Instale a CLI
npm install -g @railway/cli

# 2. Login e deploy
railway login
railway deploy
```

## 🛠️ **Build Local**

```bash
# Navegue para o app
cd app/

# Instale dependências
npm install

# Build para produção
npm run build

# Preview do build
npm run preview
```

## 🔧 **Variáveis de Ambiente**

Para deploy em produção, configure:

```env
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_supabase
VITE_USER_ID=1
VITE_DEV_MODE=false
```

## 📊 **Status dos Deploys**

| Plataforma | Status | URL |
|------------|--------|-----|
| GitHub Pages | ✅ Configurado | [Link](https://alanmerlini.github.io/Projeto-ENEM/) |
| Vercel | ⏳ Pendente | - |
| Netlify | ⏳ Pendente | - |
| Railway | ⏳ Pendente | - |

## 🎯 **Recomendação**

**Para este projeto, recomendo:**
1. **GitHub Pages** para demo rápida
2. **Vercel** para produção (melhor performance)
3. **Railway** se precisar de backend integrado

## 🚀 **Deploy Imediato**

Execute este comando para deploy via Vercel:

```bash
cd /Users/fernandodias/Desktop/BancoEnem
npx vercel --prod
```