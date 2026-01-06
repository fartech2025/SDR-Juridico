# 🏛️ SDR Jurídico - Sistema de Gestão Jurídica

Sistema completo de gestão para escritórios de advocacia com foco em eficiência e experiência do usuário.

## ✨ Características Principais

- 🎨 **Interface Moderna**: Design system completo com dark mode nativo
- 📊 **Dashboard Inteligente**: KPIs, métricas e insights em tempo real
- 👥 **Gestão de Leads**: Funil de vendas e acompanhamento de prospecção
- ⚖️ **Gestão de Casos**: Controle completo de processos jurídicos
- 📄 **Gestão de Documentos**: Sistema integrado de arquivos
- 📅 **Agenda Integrada**: Calendário com eventos e compromissos
- 🔔 **Sistema de Notificações**: Alertas inteligentes com prioridades
- 🌙 **Dark Mode Otimizado**: Tema escuro com transições suaves
- 📱 **Totalmente Responsivo**: Mobile, tablet e desktop

## 🚀 Stack Tecnológico

- **Frontend**: React 19.2 + TypeScript 5.9
- **Build**: Vite 7.3
- **Styling**: Tailwind CSS 4.1
- **Backend**: Supabase
- **Routing**: React Router 7.11

## 🔧 Instalação

```bash
npm install
```

## 🗄️ Configurar Banco de Dados

1. Crie conta no [Supabase](https://supabase.com)
2. Crie arquivo `.env`:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-aqui
```
3. Execute migrations: `supabase/migrations/00_create_all_tables.sql`

Veja [GUIA_CONEXAO_SUPABASE.md](./GUIA_CONEXAO_SUPABASE.md) para detalhes.

## 🚀 Desenvolvimento

```bash
npm run dev
```

## 📦 Build

```bash
npm run build
```

## 📚 Documentação

- [Guia Conexão Supabase](./GUIA_CONEXAO_SUPABASE.md)
- [Guia Identidade Visual](./GUIA_IDENTIDADE_VISUAL.md)
- [Deploy Produção](./DEPLOY_PRODUCAO.md)

---

Desenvolvido com ❤️ para modernizar a gestão jurídica
