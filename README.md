# 🎯 Projeto ENEM - Sistema Completo

[![React](https://img.shields.io/badge/React-19.1.1-blue.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7.1.12-purple.svg)](https://vitejs.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue.svg)](https://typescriptlang.org)
[![Status](https://img.shields.io/badge/Status-Produção-green.svg)]()
[![Tests](https://img.shields.io/badge/Tests-8/8 Passing-brightgreen.svg)]()
[![Build](https://img.shields.io/badge/Build-0 Errors-brightgreen.svg)]()

---

## 📋 Descrição

**Sistema completo** de estudos para ENEM com extração de questões, processamento de imagens e interface moderna para alunos resolverem simulados.

### ✨ Principais Funcionalidades

- ✅ **Banco de Questões**: 95+ questões do ENEM processadas
- ✅ **Simulados Personalizados**: Criar e resolver provas customizadas
- ✅ **Análise de Desempenho**: Tracking de progresso com estatísticas
- ✅ **Interface Moderna**: React + Tailwind CSS + Vite
- ✅ **Banco de Dados Real-time**: Supabase PostgreSQL + RLS
- ✅ **Autenticação Segura**: Supabase Auth + Email
- ✅ **Testes Automatizados**: Jest + TypeScript (8/8 ✅)

---

## 🚀 Início Rápido

### 1. Requisitos
```bash
Node.js 18+ (verificar com: node --version)
npm 9+ (verificar com: npm --version)
```

### 2. Instalação
```bash
# Clonar projeto
git clone https://github.com/AlanMerlini/Projeto-ENEM.git
cd Projeto-ENEM/app

# Instalar dependências
npm install

# Iniciar servidor dev
npm run dev
```

### 3. Deploy Database (Uma única vez)
```bash
# Na raiz do projeto
bash run_migrations.sh          # Linux/macOS
# ou
run_migrations.bat              # Windows
```

### 4. Acessar
```
http://localhost:5173
```

---

## 📁 Estrutura do Projeto

```
Projeto-ENEM/
├── app/                              # Aplicação React
│   ├── src/
│   │   ├── components/               # Componentes React
│   │   │   ├── SimuladosSidebar.tsx    ← Sidebar de simulados
│   │   │   ├── SimuladosPage.tsx       ← Lista de simulados
│   │   │   ├── QuestaoRenderer.tsx     ← Renderiza questões
│   │   │   └── ResolverSimuladoComImagens.tsx ← Resolve prova
│   │   ├── pages/                    # Páginas da aplicação
│   │   │   ├── PainelAluno.tsx        ← Dashboard do aluno
│   │   │   ├── LandingPage.tsx        ← Página inicial
│   │   │   └── ...
│   │   ├── lib/
│   │   │   ├── supabaseClient.ts      # Cliente Supabase
│   │   │   ├── questoesService.ts     # 15 funções de API
│   │   │   └── database.types.ts      # Types auto-gerados
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useSimulados.ts
│   │   │   └── ...
│   │   ├── App.tsx                   # Rotas principais
│   │   └── main.tsx
│   ├── __tests__/
│   │   └── build.test.ts              # 8 testes de validação
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── tailwind.config.js
│
├── supabase/                         # Banco de dados
│   ├── migrations/
│   │   ├── 20251103_create_simulados_table.sql
│   │   ├── 20251103_seed_simulados_teste.sql
│   │   └── ...
│   └── config.toml
│
├── run_migrations.sh                 # Deploy script (Linux/macOS)
├── run_migrations.bat                # Deploy script (Windows)
├── main.py                           # Python utility
├── production_tests.py               # Production tests
├── requirements.txt                  # Python deps
├── README.md                         ← Você está aqui
└── ENTREGA_FINAL_SIMULADOS.md       # Documentação técnica completa
```

### **Frontend/Interface:**
- React/Next.js
- TypeScript
- Tailwind CSS
- Supabase Client

## 🚀 Setup Rápido

### **1. Backend/Extração (BancoEnem)**
```bash
# Instalar dependências Python
pip install -r requirements.txt

# Executar extração
python3 main.py

# Ou processo completo
python3 main_extended.py --full
```

### **2. Frontend/Interface Web**
```bash
# Instalar dependências do frontend
cd app
npm install

# Configurar .env.local (veja app/README.md)
cp .env.example .env.local

# Rodar frontend
npm run dev
```

### **3. Testes e Validação**
```bash
# Testes básicos
python3 test_project.py

# Testes de produção completos
python3 production_tests.py

# Resumo do sistema
python3 system_summary.py
```

## 📁 Estrutura do Projeto

```
Projeto-ENEM/
├── 🐍 **Extração e Processamento**
│   ├── main.py                    # Extrator principal
│   ├── supabase_integration.py    # Integração BD
│   ├── production_tests.py        # Testes completos
│   ├── system_summary.py         # Diagnóstico
│   └── output/                    # Dados extraídos
│
├── 🌐 **Frontend Web**
│   ├── app/                       # Aplicação React/Next.js
│   ├── package.json              # Dependências Node
│   └── node_modules/             # Pacotes instalados
│
├── 🧠 **Inteligência Estudantil**
│   ├── Modulo_Inteligencia_Estudantil_ENEM.docx
│   ├── Modulo_Inteligencia_Estudantil_ENEM_FINAL.sql
│   └── documentação/             # Docs do módulo
│
├── 📊 **Dados e Banco**
│   ├── enem.db                   # SQLite local
│   ├── supabase/                 # Config Supabase
│   └── output/                   # Arquivos gerados
│
├── 🔧 **Configuração**
│   ├── requirements.txt          # Python deps
│   ├── .github/workflows/        # CI/CD
│   └── scripts/                  # Utilitários
│
└── 📝 **Documentação**
    ├── README.md                 # Este arquivo
    ├── GITHUB_PAGES.md          # Deploy Pages
    └── documentação/            # Docs completas
```

## 📋 Scripts Úteis

### **Python (Extração)**
```bash
python3 main.py                    # Extração básica
python3 main_extended.py --full    # Processo completo  
python3 test_project.py            # Validação básica
python3 production_tests.py        # Testes produção
python3 system_summary.py          # Diagnóstico
```

### **Node.js (Frontend)**
```bash
cd app
npm run dev          # Desenvolvimento
npm run build        # Build produção
npm run preview      # Preview build
npm run lint         # Validação código
```

### **Supabase (Banco)**
```bash
npx supabase@latest start         # Iniciar local
npx supabase@latest db reset      # Reset/seed banco
npx supabase@latest status        # Status serviços
npx supabase@latest stop          # Parar serviços
```

## 🌐 URLs de Acesso

### **Produção:**
- **Interface Web**: https://alanmerlini.github.io/Projeto-ENEM/
- **Repositório**: https://github.com/AlanMerlini/Projeto-ENEM

### **Local:**
- **Frontend**: http://localhost:3000
- **Supabase Studio**: http://localhost:54323
- **API Local**: http://localhost:54321

## 🏆 Status do Sistema

### ✅ **Componentes Validados:**
- [x] Extração de PDF (95 questões)
- [x] Classificação temática (12 temas)
- [x] Processamento de imagens (13 imagens)
- [x] Interface web moderna
- [x] Integração Supabase
- [x] Sistema de testes (100% sucesso)
- [x] Módulo inteligência estudantil
- [x] Deploy automático

### 📊 **Métricas de Qualidade:**
- **Taxa de sucesso dos testes**: 100%
- **Performance**: 31,525 ops/segundo
- **Questões extraídas**: 95/95 (100%)
- **Temas identificados**: 12
- **Imagens processadas**: 13

## 🤝 Contribuição

Este é um **projeto colaborativo**. Para contribuir:

1. **Fork** o repositório
2. **Crie branch** para sua feature: `git checkout -b feature/nova-funcionalidade`
3. **Commit** suas mudanças: `git commit -m "Adiciona nova funcionalidade"`
4. **Push** para branch: `git push origin feature/nova-funcionalidade`
5. **Abra Pull Request**

## 📞 Suporte

### **Diagnóstico:**
```bash
python3 system_summary.py  # Relatório completo
```

### **Logs:**
- Relatórios de teste: `*_test_report_*.json`
- Status Supabase: `npx supabase status`
- Build frontend: `npm run build`

---

**🎯 Projeto ENEM - Sistema Colaborativo Completo**  
📅 Última atualização: 28/10/2025  
🏆 Status: PRONTO PARA PRODUÇÃO