# 🚀 Projeto ENEM - Cloud Only

**Data:** 04/11/2025  
**Status:** ✅ Removido todos os resquícios de Docker  
**Stack:** Supabase Cloud + Vercel + React 19  

---

## 📌 O Que Mudou

Este projeto **NÃO usa mais Docker** ou **Supabase Local**. Tudo agora é **100% Cloud**.

### ❌ Removido

- Docker Desktop (não necessário)
- Supabase CLI local (`supabase start`, `supabase db reset`)
- docker-compose files
- Docker daemon checks
- Referências a `localhost:54323`

### ✅ Usado Agora

- **Supabase Cloud** (backend e banco de dados)
- **Vercel** (deployment frontend)
- **React 19** (frontend local em `npm run dev`)
- **Git + GitHub** (version control)

---

## 🎯 Como Desenvolver Localmente

### 1. Setup Inicial

```bash
# Clone o projeto
git clone https://github.com/AlanMerlini/Projeto-ENEM.git
cd Projeto-ENEM

# Instale dependências
cd app
npm install

# Configure variáveis de ambiente
# Crie .env.local com:
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon
```

### 2. Desenvolvimento

```bash
# Inicie o servidor local
npm run dev

# Acesse em http://localhost:5173
```

### 3. Criar Funções RPC (Se Necessário)

Acesse **https://supabase.com/dashboard**:

1. SQL Editor → New Query
2. Cole código SQL
3. RUN

Exemplos de funções já criadas:
- `get_all_tables()`
- `pg_foreign_keys()`

---

## 🔧 Stack Técnico

### Frontend (React)

```
Projeto-ENEM/app/
├── src/
│  ├── components/    # Componentes React
│  ├── pages/         # Páginas (React Router)
│  ├── lib/           # Utilitários e Supabase client
│  └── App.tsx        # Roteiro principal
├── package.json      # Dependências npm
├── vite.config.ts    # Configuração Vite
└── tsconfig.json     # Configuração TypeScript
```

### Backend (Supabase)

```
- PostgreSQL Database
- RPC Functions (pg_foreign_keys, get_all_tables, etc)
- Row Level Security (RLS)
- Realtime
- Vector Search (pgvector)
```

### Deploy

```
Frontend  → Vercel        (npm run build → vercel)
Backend   → Supabase Cloud (banco de dados + RPC)
```

---

## 📝 Variáveis de Ambiente

### .env.local (desenvolvimento)

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_publica
```

### Vercel (produção)

Mesmo setup, configurado no Vercel Dashboard.

---

## 🚀 Deployment

### Frontend (Vercel)

```bash
# Build local
npm run build

# Deploy automático ao fazer push para main
git push origin main
# Vercel detecta e faz deploy automaticamente
```

### Backend (Supabase Cloud)

Sem deploy necessário. Todas as mudanças são feitas via:

1. SQL Editor do Supabase Dashboard
2. Ou migrations (se usando CLI)

---

## ⚡ Troubleshooting

### Erro: Função RPC não encontrada

**Solução:**
1. Abra https://supabase.com/dashboard
2. SQL Editor → New Query
3. Cole SQL da função
4. RUN

### Erro: VITE_SUPABASE_URL não definida

**Solução:**
1. Crie arquivo `.env.local` na pasta `app/`
2. Adicione variáveis do Supabase
3. Reinicie `npm run dev`

### Erro: Página não carrega

**Solução:**
1. Verifique se `npm run dev` está rodando
2. Limpe cache (Ctrl+Shift+R)
3. Verifique console (F12) para erros

---

## 📚 Arquivos Importantes

| Arquivo | Descrição |
|---------|----------|
| `app/package.json` | Dependências npm |
| `app/.env.local` | Variáveis de ambiente |
| `app/src/main.tsx` | Entry point |
| `app/src/App.tsx` | Router principal |
| `supabase/migrations/` | SQL migrations |

---

## 🎓 Guias de Configuração

### Primeira Vez no Projeto

1. Leia este arquivo
2. Setup inicial (veja "Como Desenvolver")
3. Configure `.env.local`
4. Execute `npm run dev`
5. Pronto!

### Erros com Funções RPC

Veja: `INDICE_ERROS_FUNCOES_RPC.md`

### Documentação de Relacionamentos

Veja: `RELACAO_TABELAS.md`

---

## 🔐 Segurança

- Variáveis sensíveis em `.env.local` (gitignored)
- Chaves públicas (anon) apenas para desenvolvimento
- RLS habilitado no Supabase
- CORS configurado para Vercel

---

## 🤝 Workflow Git

```bash
# Feature branch
git checkout -b feature/sua-feature

# Faça commits
git add .
git commit -m "feat: sua feature"

# Push
git push origin feature/sua-feature

# Create Pull Request no GitHub
# Depois merge para main
```

---

## 📞 Suporte Rápido

| Problema | Solução |
|----------|---------|
| App não inicia | `npm install && npm run dev` |
| Variáveis não carregam | Edite `.env.local` e reinicie |
| Banco não conecta | Verifique `VITE_SUPABASE_URL` |
| Função RPC falta | Use SQL Editor no Supabase Dashboard |

---

## ✅ Checklist para Novo Desenvolvedor

- [ ] Clone o repositório
- [ ] Instale dependências (`npm install`)
- [ ] Configure `.env.local` com credenciais Supabase
- [ ] Execute `npm run dev`
- [ ] Acesse http://localhost:5173
- [ ] Teste algumas páginas
- [ ] Verifique console (F12) sem erros

---

**Projeto:** Projeto-ENEM  
**Stack:** React 19 + TypeScript + Vite + Supabase + Vercel  
**Versão:** Cloud-Only (sem Docker)  
**Atualizado:** 04/11/2025

