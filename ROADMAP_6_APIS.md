# 🗺️ Roadmap: Integração de 6 APIs Governamentais

## 📊 Status Geral

| API | Status | Phase | Priority |
|-----|--------|-------|----------|
| **DataJud (CNJ)** | ✅ COMPLETO | Phase 1 | 🔴 Crítica |
| **CNPJ (Conecta Gov)** | 📝 Planejado | Phase 2 | 🔴 Crítica |
| **CPF Light (Gov.br)** | 📝 Planejado | Phase 2 | 🟡 Alta |
| **ViaCEP** | 📝 Planejado | Phase 1 | 🟢 Média |
| **Portal Transparência** | 📝 Planejado | Phase 3 | 🟢 Média |
| **OAB (SOAP)** | 📝 Planejado | Phase 3 | 🟡 Alta |

---

## 🎯 Phase 1: Core APIs (Atual)

### ✅ DataJud (Completo)
**Status:** Implementação Concluída

**Impacto no Projeto:**
- Sincroniza processos judiciais com casos
- Atualiza automaticamente movimentações
- Reduz entrada manual de dados de processos
- Melhora rastreabilidade jurídica

**Métricas:**
- 🎯 Objetivo: 100% dos casos com processo vinculado
- ⏱️ Tempo economizado: 30 min/caso (entrada manual)
- 📈 Valor: Conformidade + Automação

**Próximos:** Ir para CNPJ + ViaCEP

---

### 📝 ViaCEP (Planejado - Phase 1B)

**O que faz:** Valida CEP → Retorna: rua, bairro, cidade, UF

**Onde integrar:**
- ✅ Formulário Lead (auto-preenche endereço ao digitar CEP)
- ✅ Formulário Cliente (idem)
- ✅ Atualização de endereco (validação)

**Banco de Dados:**
```sql
ALTER TABLE leads ADD COLUMN endereco_validado_via_cep BOOLEAN DEFAULT FALSE;
ALTER TABLE clientes ADD COLUMN endereco_validado_via_cep BOOLEAN DEFAULT FALSE;

CREATE TABLE viaCep_cache (
  cep TEXT PRIMARY KEY,
  logradouro TEXT,
  complemento TEXT,
  bairro TEXT,
  localidade TEXT,
  uf TEXT,
  cached_at TIMESTAMPTZ DEFAULT now()
);
```

**Edge Function:** `viaCep-lookup`

**Serviço Frontend:** `viaCepService.ts`

**Componentes:**
- `CepInput.tsx` (componente inteligente com validação)

**Benefício:**
- ⚡ Validação em tempo real
- 🎯 Reduz erros de endereço
- 💾 Cache local (sem rate limit)

**Timeline:** 3-5 dias

---

## 🚀 Phase 2: Validação + Enriquecimento

### 📝 CNPJ Lookup (Planejado)

**O que faz:** Busca CNPJ → Retorna: razão social, natureza jurídica, atividade, capital

**Onde integrar:**
- ✅ Formulário Cliente (ao digitar CNPJ)
- ✅ Validação antes de criar cliente
- ✅ Dashboard cliente (card com dados CNPJ)

**Banco de Dados:**
```sql
ALTER TABLE clientes ADD COLUMN:
  - cnpj_validated_at TIMESTAMPTZ
  - razao_social_from_cnpj TEXT
  - natureza_juridica TEXT
  - atividade_principal TEXT
  - capital_social DECIMAL;

CREATE TABLE cnpj_cache (
  cnpj TEXT PRIMARY KEY,
  razao_social TEXT,
  natureza_juridica TEXT,
  atividade_principal TEXT,
  capital_social DECIMAL,
  raw_response JSONB,
  cached_at TIMESTAMPTZ
);
```

**Edge Function:** `cnpj-lookup`

**Serviço:** `cnpjService.ts`

**Auditoria:**
- Log cada lookup em `cnpj_api_calls` table

**Benefício:**
- ✅ Validação CNPJ em tempo real
- 💼 Enriquecimento automático de empresa
- 📊 Perfil cliente mais completo

**Timeline:** 5-7 dias

---

### 📝 CPF Light (Planejado)

**O que faz:** Valida CPF → Retorna: nome, situação, indicativos

**Onde integrar:**
- ✅ Validação de advogados (no registro)
- ✅ Validação de clientes (se PF)
- ✅ Compliance LGPD

**Banco de Dados:**
```sql
ALTER TABLE usuarios ADD COLUMN:
  - cpf_validated BOOLEAN
  - cpf_validated_at TIMESTAMPTZ;

CREATE TABLE cpf_validation_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  cpf_validated BOOLEAN,
  consentimento BOOLEAN,
  resultado JSONB,
  created_at TIMESTAMPTZ
);
```

**Compliance:**
- ✅ Consentimento antes de validar
- ✅ Log de todas as validações (LGPD)
- ✅ Retenção 30 dias máximo

**Edge Function:** `cpf-validate`

**Componente:** `CpfValidationConsent.tsx`

**Benefício:**
- 🔐 Garante usuários reais
- 📋 LGPD-compliant
- ✅ Reduz fraude

**Timeline:** 5-7 dias

---

## 💼 Phase 3: Analytics + Inteligência

### 📝 Portal Transparência (Planejado)

**O que faz:** Busca CNPJ → Retorna: dívidas públicas, licitações, CEIS, CNEP

**Onde integrar:**
- 📊 Dashboard Cliente (card "Risco Compliance")
- 🎯 Análise contraparte antes de contratar
- 📈 Score de risco automático

**Banco de Dados:**
```sql
ALTER TABLE clientes ADD COLUMN:
  - compliance_check_at TIMESTAMPTZ
  - em_ceis BOOLEAN
  - em_cnep BOOLEAN
  - divida_publica DECIMAL
  - risk_score INTEGER (0-100);

CREATE TABLE portal_transparencia_checks (
  id UUID PRIMARY KEY,
  cliente_id UUID,
  cnpj TEXT,
  em_ceis BOOLEAN,
  em_cnep BOOLEAN,
  divida_publica DECIMAL,
  resultado JSONB,
  created_at TIMESTAMPTZ
);
```

**Integração:**
```typescript
// Ao abrir cliente
const risco = await portalTransparenciaService.checkClientRisk(cliente.cnpj)

// Card no dashboard
<div className={risco.risk_score > 70 ? 'bg-red-100' : 'bg-green-100'}>
  Risco: {risco.risk_score}%
  {risco.em_ceis && '⚠️ Em CEIS'}
  {risco.em_cnep && '⚠️ Em CNEP'}
</div>
```

**Benefício:**
- 🚨 Alerta de risco automático
- 💰 Análise antes de contratar
- 📊 Rastreabilidade de decisões

**Timeline:** 7-10 dias

---

### 📝 OAB Lawyer Search (Planejado)

**O que faz:** Busca advogado por nome/CPF → Retorna: UF, registro, especialidades

**Onde integrar:**
- 👤 Página Colaboradores/Parceiros
- 🔍 Validação registro OAB
- 📋 Filtro por especialidade

**Banco de Dados:**
```sql
ALTER TABLE usuarios ADD COLUMN:
  - oab_registro TEXT
  - oab_uf TEXT
  - oab_especialidades TEXT[];

CREATE TABLE oab_registros (
  id UUID PRIMARY KEY,
  usuario_id UUID,
  oab_registro TEXT,
  oab_uf TEXT,
  oab_especialidades TEXT[],
  nome TEXT,
  raw_response JSONB,
  validated_at TIMESTAMPTZ
);
```

**Componente:**
```typescript
<AdvogadosGrid>
  {colaboradores.map(adv => (
    <AdvogadoCard
      nome={adv.nome}
      oab_registro={adv.oab_registro}
      especialidades={adv.oab_especialidades}
      onSelect={() => vincularCaso(adv)}
    />
  ))}
</AdvogadosGrid>
```

**Nota:** OAB é SOAP (não REST), requer:
```typescript
// Implementar converter SOAP → REST em Edge Function
const soapXml = `<?xml version="1.0"?>...`;
const response = await fetch('https://www5.oab.org.br/cnaws/service.asmx', {
  method: 'POST',
  body: soapXml
});
```

**Benefício:**
- ✅ Valida advogados reais
- 📊 Filtro por especialidade
- 🤝 Rede de parceiros

**Timeline:** 10-14 dias (SOAP é complexo)

---

## 📈 Estimativas

| API | Dias | Effort | Risk |
|-----|------|--------|------|
| DataJud | ✅ 4 | Medium | Low |
| ViaCEP | 3-5 | Small | Very Low |
| CNPJ | 5-7 | Medium | Low |
| CPF | 5-7 | Medium | Medium (LGPD) |
| Portal Transp. | 7-10 | Large | Low |
| OAB | 10-14 | Large | Medium (SOAP) |
| **TOTAL** | **34-47 dias** | - | - |

---

## 🎯 Priorização Recomendada

### Sprint 1 (Semana 1-2): ✅ Core
- ✅ DataJud (já feito!)
- 📝 ViaCEP (trivial, máximo impacto)
- 📝 CNPJ (crítico para validação)

### Sprint 2 (Semana 3-4): Compliance
- 📝 CPF Light (LGPD + validação)
- 📝 Portal Transparência (risco)

### Sprint 3 (Semana 5-6): Operacional
- 📝 OAB (parceiros)
- 📝 Melhorias + testes

---

## 💾 Dados Harmonizados (Schema Comum)

```typescript
interface ApiIntegration {
  api_name: string
  entity_type: 'cliente' | 'usuario' | 'caso'
  entity_id: UUID
  query_param: string
  resultado: Record<string, unknown>
  validated: boolean
  validated_at?: TIMESTAMPTZ
  consentimento?: boolean
  erro?: string
}

// Tabelas de auditoria por API:
CREATE TABLE api_integrations_logs (
  id UUID PRIMARY KEY,
  api_name TEXT,
  entity_type TEXT,
  entity_id UUID,
  org_id UUID,
  user_id UUID,
  query JSONB,
  resultado JSONB,
  status_code INTEGER,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ
);
```

---

## 🔐 Segurança Cross-API

```typescript
// middleware de autenticação
async function validateApiRequest(req, api_name) {
  // 1. JWT validation
  // 2. Org-scoped access
  // 3. Rate limit por org + API
  // 4. Log em api_integrations_logs
  // 5. LGPD consent check (se PII)
}

// Secrets por API
supabase secrets set DATAJUD_API_KEY=...
supabase secrets set CNPJ_API_KEY=...
supabase secrets set CPF_API_KEY=...
supabase secrets set OAB_SOAP_URL=...
```

---

## 📊 Métricas de Sucesso

### Phase 1
- [ ] 90%+ casos com processo DataJud vinculado
- [ ] <100ms latência média busca
- [ ] 99.5% uptime
- [ ] 0 erros de vinculação

### Phase 2
- [ ] 80%+ clientes com CNPJ validado
- [ ] <50ms latência ViaCEP
- [ ] 100% usuários com CPF validado
- [ ] <10% taxa erro validação

### Phase 3
- [ ] 100% clientes com risco score
- [ ] 95%+ advogados com OAB validado
- [ ] <5 min tempo de busca parceiro

---

## 🚀 Kickoff Checklist

- [x] ✅ DataJud implementado
- [ ] 📝 Roadmap aprovado
- [ ] 👥 Squad alocado
- [ ] 📅 Sprint planning
- [ ] 🎯 OKRs definidos
- [ ] 📊 Métricas baseline
- [ ] 🔐 Security review
- [ ] ✨ Comunicação stakeholders

---

## 📞 Contatos Úteis

- **DataJud Wiki:** https://datajud-wiki.cnj.jus.br/
- **Conecta Gov.br:** https://www.gov.br/conecta/
- **Portal Transparência:** https://portal.daTransparencia.gov.br/api-de-dados
- **OAB Web Services:** https://www5.oab.org.br/cnaws/

---

**Próximo:** Começar Phase 1B (ViaCEP + CNPJ) em paralelo com Phase 1 feedback
