# 🎯 Projeto ENEM - Sistema Completo

[![React](https://img.shields.io/badge/React-19.1.1-blue.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7.1.12-purple.svg)](https://vitejs.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue.svg)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Cloud-green.svg)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black.svg)](https://vercel.com)
[![Status](https://img.shields.io/badge/Status-Produção-green.svg)]()

---

## 📋 Descrição

**Sistema completo** de estudos para ENEM com banco de questões, simulados personalizados e interface moderna para estudantes.

### ✨ Principais Funcionalidades

- ✅ **Banco de Questões**: Base completa de questões do ENEM
- ✅ **Simulados Personalizados**: Criar e resolver provas customizadas
- ✅ **Análise de Desempenho**: Tracking de progresso com estatísticas
- ✅ **Interface Moderna**: React 19 + TypeScript + Tailwind CSS
- ✅ **Banco de Dados Cloud**: Supabase PostgreSQL + RLS
- ✅ **Autenticação Segura**: Supabase Auth + Email
- ✅ **Deploy Automático**: Vercel + GitHub Actions

---

## 🚀 Início Rápido

### 1. Pré-requisitos
```bash
# Verificar versões
node --version  # Node.js 18+
npm --version   # npm 9+
```

### 2. Configuração Local
```bash
# Clonar projeto
git clone https://github.com/AlanMerlini/Projeto-ENEM.git
cd Projeto-ENEM/app

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com suas credenciais Supabase

# Iniciar desenvolvimento
npm run dev
```

### 3. Configuração Supabase Cloud

1. Crie uma conta em [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Configure o arquivo `.env.local` em `app/`:

```bash
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
# Opcional: sobrescreve o endpoint do corretor (padrão usa LanguageTool público)
VITE_TEXT_CORRECTOR_API_URL=https://api.languagetool.org/v2/check
```
Se precisar copiar comandos de backup pelo Database Inspetor, preencha também `VITE_LOCAL_DB_HOST`, `VITE_LOCAL_DB_PORT`, `VITE_LOCAL_DB_NAME` e `VITE_LOCAL_DB_USER` com as credenciais reais do banco (ex.: Supabase).

### 4. Acessar Aplicação
```
http://localhost:5173
```
Somente disponível quando o servidor Vite está ativo no seu ambiente local; em produção use o domínio do deploy.

---

## 📁 Estrutura do Projeto

```
Projeto-ENEM/
├── app/                              # Aplicação React
│   ├── src/
│   │   ├── components/               # Componentes React
│   │   │   ├── SimuladosSidebar.tsx    ← Sidebar de simulados
│   │   │   ├── UserLandingPage.tsx     ← Central do estudante (lista de simulados)
│   │   │   ├── QuestaoRenderer.tsx     ← Renderiza questões
│   │   │   └── ResolverSimuladoComImagens.tsx ← Resolve prova
│   │   ├── pages/                    # Páginas da aplicação
│   │   │   ├── PainelAluno.tsx        ← Dashboard do aluno
│   │   │   ├── LandingPage.tsx        ← Página inicial
│   │   │   └── ...
│   │   ├── lib/
│   │   │   ├── supabaseClient.ts      # Cliente Supabase
│   │   │   ├── questoesService.ts     # API do banco
│   │   │   └── database.types.ts      # Types auto-gerados
│   │   ├── hooks/                    # React Hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useSimulados.ts
│   │   │   └── ...
│   │   ├── App.tsx                   # Rotas principais
│   │   └── main.tsx
│   ├── __tests__/                    # Testes automatizados
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── tailwind.config.js
│
├── documentação/                     # Documentação técnica
├── main.py                          # Utilitário Python (opcional)
├── production_tests.py              # Testes de produção
├── requirements.txt                 # Dependências Python
├── vercel.json                      # Configuração Vercel
└── README.md                        ← Você está aqui
```

---

## 🛠️ Desenvolvimento

### Scripts Disponíveis

```bash
# No diretório app/
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build
npm run lint         # Linting do código
npm test            # Executar testes
```

### Estrutura de Arquivos Principais

- **`app/src/components/`** - Componentes React reutilizáveis
- **`app/src/pages/`** - Páginas da aplicação
- **`app/src/lib/`** - Utilitários e configurações
- **`app/src/hooks/`** - React Hooks customizados
---

## 🌐 Deploy e Produção

### Deploy Automático (Vercel)

Este projeto está configurado para deploy automático:

1. **Fork** este repositório
2. **Conecte** no [Vercel](https://vercel.com)
3. **Configure** as variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. **Deploy** automático a cada push

### URLs de Acesso

- **Produção**: [Link do Deploy](https://seu-projeto.vercel.app)
- **Desenvolvimento**: http://localhost:5173 *(apenas no ambiente local durante `npm run dev`)*

---

## 🏆 Funcionalidades

### ✅ Implementado
- [x] Sistema de autenticação (Supabase Auth)
- [x] Banco de questões do ENEM
- [x] Criação de simulados personalizados
- [x] Resolução de questões com imagens
- [x] Dashboard do estudante
- [x] Análise de desempenho
- [x] Interface responsiva
- [x] Deploy automático
- [x] Corretor ortográfico/gramatical em português integrado (LanguageTool)

### � Em Desenvolvimento
- [ ] Sistema de ranking
- [ ] Relatórios detalhados
- [ ] Integração com redes sociais
- [ ] App mobile

---

## 🤝 Contribuição

Para contribuir com o projeto:

1. **Fork** o repositório
2. **Crie** uma branch: `git checkout -b feature/nova-funcionalidade`
3. **Commit** suas mudanças: `git commit -m "feat: adiciona nova funcionalidade"`
4. **Push** para a branch: `git push origin feature/nova-funcionalidade`
5. **Abra** um Pull Request

---

## 📞 Suporte

### Troubleshooting

**Problema**: Erro de conexão com Supabase
**Solução**: Verifique as variáveis de ambiente em `.env.local`

**Problema**: Build falha
**Solução**: Execute `npm run lint` e corrija os erros

**Problema**: Aplicação não carrega
**Solução**: Verifique se o servidor local (`npm run dev`) está rodando em `localhost:5173` — esse endereço não fica acessível em produção

---

## 📝 Corretor de Português Global

- Disponível em todas as páginas pelo botão circular no canto inferior direito.
- Baseado no [LanguageTool](https://languagetool.org/) configurado para `pt-BR`.
- Permite colar qualquer texto, visualizar as sugestões e aplicá-las automaticamente.
- Para usar outro endpoint (self-host ou proxy), configure `VITE_TEXT_CORRECTOR_API_URL` no `.env.local`/variáveis do deploy.

---

**🎯 Projeto FARTECH**  
📅 Última atualização: 4 Nov 2025  
🏆 Status: PRONTO PARA PRODUÇÃO  
🔗 [GitHub](https://github.com/AlanMerlini/Projeto-ENEM)
