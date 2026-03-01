# 📊 PLANEJAMENTO COMERCIAL — SDR JURÍDICO
**Versão:** 1.1
**Data:** Fevereiro de 2026
**Status:** Estratégico / Confidencial

---

## 1. VISÃO GERAL DO PRODUTO

O **SDR Jurídico** é um sistema SaaS de gestão jurídica multi-tenant voltado para escritórios de advocacia (pequenos e médios) e advogados autônomos, com foco em:

- Gestão completa do ciclo de vida do caso (Lead → Cliente → Caso → Documento → Financeiro)
- Integração nativa com tribunais (PJe/MNI, eProc, DataJud/CNJ)
- Monitoramento automático de DOU (Diário Oficial da União)
- IA aplicada à inteligência processual ("Waze Jurídico")
- CRM jurídico com funil, scoring de leads e Kanban

---

## 2. ANÁLISE DE MERCADO

### 2.1 Tamanho do Mercado (Brasil)

| Indicador | Dado |
|-----------|------|
| Advogados ativos (OAB) | ~1.350.000 |
| Escritórios registrados | ~330.000 |
| Penetração atual de software jurídico | ~18-22% |
| TAM estimado (SaaS jurídico BR) | R$ 1,2 bi/ano |
| SAM (pequenos e médios escritórios) | R$ 380 mi/ano |
| SOM realista (3-5 anos) | R$ 15-40 mi/ano |

### 2.2 Segmentos-Alvo

| Segmento | Perfil | Tamanho | Prioridade |
|----------|--------|---------|------------|
| **Solo / Autônomo** | 1 advogado, escritório home office | ~600k | Alta |
| **Boutique** | 2-10 advogados, 1 área de atuação | ~180k | Alta |
| **Médio porte** | 11-50 advogados, multi-área | ~40k | Média |
| **Corporativo** | 50+ advogados, departamento jurídico | ~5k | Baixa (futuro) |

---

## 3. ANÁLISE COMPETITIVA

### 3.1 Mapa dos Concorrentes

```
PREÇO/MÊS POR USUÁRIO
R$300+ ┤                              Projuris Enterprise
       │                           Themis ●
R$200  ┤              ADVBOX ●
       │
R$150  ┤        Astrea ●
       │
R$100  ┤   SAJ ADV ●
       │                     ← SDR JURÍDICO (posicionamento ideal: R$90-160/user)
 R$80  ┤ Juridiq ●
       └──────────────────────────────────────────────────→
         BÁSICO                                       COMPLETO
         (só processos)                          (CRM + IA + Tribunal)
```

### 3.2 Comparativo de Funcionalidades

| Funcionalidade | SDR Jurídico | ADVBOX | Astrea | Projuris | SAJ ADV | Juridiq |
|----------------|:---:|:---:|:---:|:---:|:---:|:---:|
| **Gestão de Processos** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Agenda** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Gestão de Tarefas** | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| **Gestão Financeira** | ✅ | ✅ | ✅ | ✅ | ⚠️ | ❌ |
| **CRM / Funil de Leads** | ✅ | ⚠️ | ❌ | ⚠️ | ❌ | ❌ |
| **Kanban de Leads** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Lead Scoring Engine** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **DataJud (CNJ)** | ✅ | ✅ | ⚠️ | ✅ | ✅ | ❌ |
| **PJe / MNI Nativo** | 🔜 | ✅ | ❌ | ✅ | ✅ | ❌ |
| **eProc (TJMG, TRF4, TRF5)** | 🔜 | ⚠️ | ❌ | ⚠️ | ❌ | ❌ |
| **Diário Oficial (DOU)** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **IA / Análise de Casos** | ✅ | ⚠️ | ❌ | ❌ | ❌ | ❌ |
| **Google Calendar Sync** | ✅ | ⚠️ | ❌ | ⚠️ | ❌ | ❌ |
| **Microsoft Teams** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Roles Granulares (5 níveis)** | ✅ | ⚠️ | ⚠️ | ✅ | ❌ | ❌ |
| **Auditoria Completa** | ✅ | ⚠️ | ❌ | ✅ | ❌ | ❌ |
| **Multi-tenant Robusto** | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| **API Pública** | 🔜 | ⚠️ | ❌ | ✅ | ⚠️ | ❌ |
| **App Mobile** | ❌ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| **Geração de Documentos** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Timesheets / Honorários** | ✅ | ✅ | ✅ | ✅ | ⚠️ | ❌ |
| **Onboarding Guiado** | ✅ | ⚠️ | ⚠️ | ✅ | ❌ | ❌ |
| **NFS-e / Nota Fiscal** | ❌ | ✅ | ⚠️ | ✅ | ❌ | ❌ |

> ✅ Implementado | ⚠️ Parcial | ❌ Ausente | 🔜 Roadmap

### 3.3 Comparativo de Preços (referência fev/2026)

| Produto | Entrada | Médio | Top |
|---------|---------|-------|-----|
| **Juridiq** | R$ 80/user | R$ 120/user | — |
| **SAJ ADV** | R$ 100/user | R$ 150/user | R$ 200/user |
| **Astrea** | R$ 100/user | R$ 150/user | R$ 200/user |
| **ADVBOX** | R$ 220/escritório | R$ 450/escritório | R$ 1.800/escritório |
| **Projuris ADV** | R$ 197/escritório | R$ 400+/escritório | Enterprise |
| **Themis** | Customizado | Customizado | Customizado |

---

## 4. ANÁLISE SWOT — SDR JURÍDICO

### 4.1 Pontos Fortes (Strengths)

| # | Ponto Forte | Impacto |
|---|-------------|---------|
| 1 | **CRM Jurídico Nativo** — único com funil de leads + Kanban + Lead Scoring configurável | Alto |
| 2 | **"Waze Jurídico"** — IA (Claude API) para análise processual cruzando DataJud, DOU, Portal Transparência | Alto |
| 3 | **Monitoramento DOU automático** — alertas por nome/CPF/CNPJ no Diário Oficial | Alto |
| 4 | **Templates de Documentos com branding** — editor TipTap + PDF com logo/cabeçalho/rodapé/marca d'água do escritório | Alto |
| 5 | **Onboarding guiado** — wizard de setup inicial + modal "O que há de novo" a cada versão | Médio |
| 6 | **Roles granulares** — 5 perfis reais dentro da org (admin, gestor, advogado, secretaria, leitura) | Médio |
| 7 | **Views personalizadas por perfil** — dashboard, sidebar e KPIs adaptados ao role real | Médio |
| 8 | **Feature gates por plano** — trial → basic → professional → enterprise com UpgradeWall nativo | Médio |
| 9 | **Stack moderna** — React 19 + Supabase Realtime + Vite; sem legacy code | Médio |
| 10 | **Auditoria completa** — log imutável de toda ação (soft delete everywhere) | Médio |
| 11 | **Google Calendar + Microsoft Teams** — reuniões direto da agenda do sistema | Médio |

### 4.2 Pontos Fracos (Weaknesses)

| # | Ponto Fraco | Risco | Ação Necessária |
|---|-------------|-------|-----------------|
| 1 | **Sem app mobile** — concorrentes têm iOS/Android; advogados são móveis | Alto | PWA ou app nativo (roadmap) |
| 2 | **Sem geração de documentos** — sem templates, sem editor de peças | Alto | Integrar editor (TipTap/Quill) |
| 3 | **Sem timesheet / controle de horas** — honorários por tempo não controlados | Médio | Módulo de timesheet |
| 4 | **Sem NFS-e** — emissão de nota fiscal de serviço ausente | Médio | Integração NFSe API |
| 5 | **Sem API pública** — impossibilita integrações com contabilidade, ERPs | Médio | Publicar API REST com chaves |
| 6 | **Poucos tribunais eProc** — cobre TJMG + TRF4 + TRF5; faltam TJSP, TJRJ, TJRS | Médio | Expandir scraper |
| 7 | **PJe/MNI e eProc em desenvolvimento** — importação de processos ainda não disponível em produção | Médio | Concluir integração (roadmap Fase 2) |
| 8 | **Sem integração contábil** — não exporta para Conta Azul, QuickBooks, etc. | Baixo | Futuro |

### 4.3 Oportunidades (Opportunities)

| # | Oportunidade | Tamanho |
|---|--------------|---------|
| 1 | **IA generativa no direito** — mercado ainda sem solução consolidada com IA real | Enorme |
| 2 | **DOU como diferencial único** — nenhum concorrente direto tem monitoramento DOU nativo | Grande |
| 3 | **CRM jurídico** — captação de clientes é dor real; nenhum concorrente entrega CRM completo | Grande |
| 4 | **Advogados autônomos digitais** — geração Y/Z da OAB quer software moderno, não legado | Grande |
| 5 | **Integração com CNJ** — DataJud é API pública; primeiro a integrá-la bem tem vantagem | Médio |
| 6 | **Plano "Solo"** — preço acessível para advogado individual que hoje usa planilha | Médio |
| 7 | **Parceiros OAB** — seccionais estaduais buscam software para recomendar a membros | Médio |
| 8 | **White-label** — revenda para escritórios maiores com marca própria | Futuro |

### 4.4 Ameaças (Threats)

| # | Ameaça | Probabilidade |
|---|--------|---------------|
| 1 | **ADVBOX + IA** — já anunciou funcionalidades de IA; pode lançar DOU antes | Alta |
| 2 | **Astrea (Aurum)** — marca consolidada, 110k usuários; pode adicionar CRM a qualquer momento | Alta |
| 3 | **Jusbrasil Business** — enorme base de dados processual; poderia lançar SaaS completo | Média |
| 4 | **ChatGPT / Claude direto** — advogados tentando usar LLMs brutos sem sistema | Média |
| 5 | **Churn por falta de mobile** — advogados em audiência precisam de celular | Alta |

---

## 5. POSICIONAMENTO DE MARCA

### 5.1 Declaração de Posicionamento

> **"O único sistema jurídico com CRM nativo, IA processual e monitoramento do Diário Oficial — para escritórios que querem crescer, não só organizar."**

### 5.2 Proposta de Valor por Segmento

| Segmento | Proposta Principal | Mensagem-chave |
|----------|--------------------|----------------|
| **Solo** | Organização + captação em um só lugar | "Seu escritório inteiro no browser" |
| **Boutique (2-10)** | CRM + gestão de equipe + IA | "Trabalhe com estratégia, não com papel" |
| **Médio porte** | Analytics + financeiro + controle de equipe | "Visão gerencial do seu escritório" |

### 5.3 Contra o Concorrente

| Vs. | Argumento de Venda |
|-----|-------------------|
| **Astrea** | Astrea organiza processos. SDR vende serviços: tem CRM, funil de leads e análise IA que o Astrea não tem. |
| **ADVBOX** | ADVBOX é caro e complexo. SDR entrega 80% do que a maioria precisa com interface moderna e preço justo. |
| **Projuris** | Projuris é enterprise. SDR é ágil, sem contrato longo e com funcionalidades únicas como DOU e Waze Jurídico. |
| **Planilha/manual** | Controle em Excel não avisa de publicações do Diário Oficial, não importa processos do PJe e não pontua leads. |

---

## 6. ESTRUTURA DE PREÇOS RECOMENDADA

### 6.1 Planos Propostos

| Plano | Público | Preço | Limites |
|-------|---------|-------|---------|
| **Trial** | Todos | Grátis 14 dias | Todas as features, 1 usuário |
| **Solo** | Advogado autônomo | R$ 89/mês | 1 usuário, 500 processos, sem IA |
| **Basic** | Boutique pequena | R$ 179/mês | até 5 usuários, sem IA, sem DOU |
| **Professional** | Boutique média | R$ 349/mês | até 15 usuários, DOU + Analytics + Templates |
| **Enterprise** | Médio porte | R$ 699/mês | usuários ilimitados + IA (Waze Jurídico) + API |

> Desconto de 20% no plano anual.

### 6.2 Mapeamento Features → Planos

| Feature | Solo | Basic | Professional | Enterprise |
|---------|:---:|:---:|:---:|:---:|
| Gestão de Casos e Clientes | ✅ | ✅ | ✅ | ✅ |
| Agenda + Tarefas | ✅ | ✅ | ✅ | ✅ |
| CRM / Funil de Leads | ✅ | ✅ | ✅ | ✅ |
| DataJud (CNJ) | ✅ | ✅ | ✅ | ✅ |
| Módulo Financeiro | ❌ | ✅ | ✅ | ✅ |
| PJe/MNI + eProc | ❌ | ❌ | 🔜 | 🔜 |
| Diário Oficial (DOU) | ❌ | ❌ | ✅ | ✅ |
| Analytics Executivo | ❌ | ❌ | ✅ | ✅ |
| Auditoria | ❌ | ❌ | ✅ | ✅ |
| Waze Jurídico (IA) | ❌ | ❌ | ❌ | ✅ |
| API Pública | ❌ | ❌ | ❌ | ✅ |
| Usuários ilimitados | ❌ | ❌ | ❌ | ✅ |

### 6.3 Benchmark de Preços

```
Solo R$89    vs  Juridiq R$80    → Preço equivalente, mas SDR tem CRM + DataJud + Templates
Basic R$179  vs  SAJ R$100/user  → Competitivo para até 5 usuários
Prof R$349   vs  ADVBOX R$450    → 22% mais barato com features exclusivas (DOU, Analytics, Templates)
Ent R$699    vs  Projuris R$800+ → Mais barato com IA real incluída
```

---

## 7. ROADMAP COMERCIAL (12 MESES)

### Fase 1 — Fundação do Produto (0-3 meses) ✅ Concluída

**Objetivo:** Fechar lacunas críticas antes de vender ativamente

| Prioridade | Entrega | Status |
|-----------|---------|--------|
| 🔴 Crítica | App mobile (PWA responsivo) | 🔜 Em progresso |
| 🔴 Crítica | Geração de documentos (templates de peças + TipTap) | ✅ Entregue v2.8.0 |
| 🟠 Alta | Timesheet / controle de horas | ✅ Entregue v2.8.0 |
| 🟠 Alta | Wizard de onboarding + modal "O que há de novo" | ✅ Entregue v2.9.0 |
| 🟡 Média | Exportação financeira (CSV/Excel) | 🔜 Fase 2 |

### Fase 2 — Go-to-Market (3-6 meses)

**Objetivo:** Adquirir primeiros 100 escritórios pagantes

| Ação | Detalhamento |
|------|--------------|
| **Site de marketing** | Landing page com comparativo vs concorrentes, calculadora de ROI, depoimentos |
| **Trial de 14 dias** | Self-service, sem cartão de crédito, com dados de demonstração pré-carregados |
| **Canal OAB** | Apresentação para seccionais estaduais como software recomendado |
| **Content marketing** | Blog jurídico: "DOU: como monitorar publicações", "Controle de horas no escritório" |
| **Parceria com contadores** | Escritórios de contabilidade que atendem advogados como canal de indicação |
| **Programa de referência** | Desconto de 1 mês para cada indicação que se tornar cliente |
| **Integração PJe/MNI + eProc** | Importação em lote de processos dos tribunais — *em desenvolvimento, disponível em versão futura* |
| **Ampliar cobertura eProc** | Cobrir TJSP, TJRJ além de TJMG + TRF4 + TRF5 |

### Fase 3 — Crescimento (6-12 meses)

**Objetivo:** Atingir R$ 50k MRR

| Ação | Meta |
|------|------|
| **Expansão eProc** | Cobrir 90% dos tribunais nacionais |
| **API Pública** | Abrir para integrações com contabilidade e ERP |
| **Marketplace de Templates** | Templates de petições e contratos vendidos por terceiros |
| **White-label** | Oferecer SDK para grandes escritórios usarem com marca própria |
| **IA multimodal** | Análise de documentos PDF, extração de cláusulas, geração de minutas |

---

## 8. MÉTRICAS-ALVO

| Métrica | 3 meses | 6 meses | 12 meses |
|---------|---------|---------|---------|
| Escritórios ativos | 20 | 100 | 400 |
| MRR | R$ 5k | R$ 25k | R$ 100k |
| ARR | R$ 60k | R$ 300k | R$ 1,2M |
| Churn mensal | <5% | <4% | <3% |
| NPS | >30 | >40 | >50 |
| CAC (Custo de Aquisição) | — | R$ 800 | R$ 600 |
| LTV médio (Basic+) | — | R$ 4.500 | R$ 6.000 |
| LTV/CAC | — | 5,6x | 10x |

---

## 9. DIFERENCIAIS ÚNICOS — "OUR MOAT"

Esses são os diferenciais que são difíceis de copiar rapidamente:

### 🏆 Diferencial 1 — CRM Jurídico Completo
Nenhum concorrente tem funil de leads + Kanban + Lead Scoring configurável + histórico de temperatura. O mercado de captação de clientes para advogados é uma lacuna real e não atendida.

### 🏆 Diferencial 2 — Waze Jurídico (IA Processual)
A integração com Claude via proxy seguro, cruzando DataJud + DOU + Portal Transparência + casos internos, gera uma análise que nenhum software jurídico brasileiro entrega hoje. É o ChatGPT integrado ao processo judicial.

### 🏆 Diferencial 3 — Monitoramento DOU Automático
Alertas quando o nome do cliente, CPF ou CNPJ aparecem no Diário Oficial. Recurso técnico complexo e com API proprietária (Querido Diário). Cria alto valor percebido com baixo custo marginal.

### 🏆 Diferencial 4 — Onboarding Guiado + Changelog Visual
Wizard de setup inicial (empresa, equipe, integrações) com estado salvo no banco — o escritório começa a usar em minutos. A cada nova versão, um modal "O que há de novo" exibe as funcionalidades entregues. Aumenta ativação e reduz churn nas primeiras semanas.

> ⚠️ **Nota:** Integração PJe/MNI + eProc está em desenvolvimento e será disponibilizada em versão futura. Não anunciar como feature disponível até conclusão.

### 🏆 Diferencial 5 — Feature Gates por Plano (UpgradeWall nativo)
A arquitetura de planos já está construída no produto. Upgrade é um botão — não um contrato com o comercial. Isso habilita crescimento de receita self-service (PLG — Product-Led Growth).

---

## 10. RISCOS E MITIGAÇÕES

| Risco | Probabilidade | Impacto | Mitigação |
|-------|:---:|:---:|-----------|
| Concorrente copia CRM | Alta | Médio | Velocidade de execução; ser o padrão de referência antes |
| Mudança na API DataJud/CNJ | Média | Alto | Monitorar changelog CNJ; ter fallback manual |
| Regulação de IA pelo OAB | Baixa | Alto | Posicionar IA como "assistência", não "advocacia autônoma" |
| Churn alto por falta de mobile | Alta | Alto | Priorizar PWA no roadmap imediato |
| Scraper PJe bloqueado por TJXXX | Média | Médio | MNI é canal oficial; manter como principal |
| Dependência do Claude (Anthropic) | Baixa | Médio | Arquitetura de proxy permite trocar modelo no futuro |

---

## 11. PRÓXIMAS AÇÕES IMEDIATAS

### Esta Semana
- [ ] Criar landing page de captura (waitlist/trial)
- [ ] Definir preços finais e configurar planos no sistema
- [ ] Gravar demo de 3 minutos focado nos 3 diferenciais únicos

### Este Mês
- [ ] Implementar PWA (manifesto + service worker) para acesso mobile básico
- [ ] Criar módulo de templates de documentos (mínimo 10 templates de petições)
- [ ] Definir público piloto: 5 escritórios para beta pago

### Este Trimestre
- [ ] Site de marketing completo com calculadora de ROI
- [ ] Programa de referência ativo
- [ ] 20 escritórios pagantes (meta mínima de validação)

---

*Documento atualizado para v2.9.0 em fevereiro de 2026. Integração PJe/MNI movida para Fase 2 — em desenvolvimento.*
