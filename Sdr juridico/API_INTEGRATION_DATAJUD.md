# API Integration: DataJud - Documentação Completa

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Fluxos de Dados](#fluxos-de-dados)
4. [Configuração](#configuração)
5. [Uso](#uso)
6. [Segurança & Compliance](#segurança--compliance)
7. [Troubleshooting](#troubleshooting)
8. [Exemplos](#exemplos)

---

## Visão Geral

Integração com a **API Pública DataJud (CNJ)** para sincronização de processos judiciais e movimentações com a tabela de `casos` do sistema.

### Funcionalidades
- ✅ Busca de processos por tribunal, número, parte, classe
- ✅ Sincronização automática de movimentações
- ✅ Vinculação/desvinculação de processos a casos
- ✅ Auditoria completa de consultas (LGPD-ready)
- ✅ Rate limiting e retry automático com backoff exponencial
- ✅ Cache de resultados (24h TTL)
- ✅ RLS policies org-scoped para multi-tenant

### Limitações Conhecidas
- Taxa de limite: 100 requisições/hora por organização
- DataJud API requer API Key (obtida junto ao CNJ)
- Alguns tribunais podem ter respostas inconsistentes
- Dados são públicos apenas; dados sigilosos requerem permissões especiais

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│ FRONTEND (React)                                         │
│ ├─ CasoDataJudSearchModal.tsx    (busca)               │
│ ├─ CasoDataJudSection.tsx         (gerenciamento)      │
│ ├─ useDataJudSync hook            (polling automático) │
│ └─ datajudCaseService.ts          (camada de serviço)  │
└─────────────────────────────────────────────────────────┘
                        │
                        ↓ (HTTP POST)
┌─────────────────────────────────────────────────────────┐
│ SUPABASE EDGE FUNCTION                                  │
│ supabase/functions/datajud-enhanced/index.ts           │
│ ├─ Autenticação JWT                                    │
│ ├─ Rate limiting (in-memory ou Redis)                 │
│ ├─ Retry automático com backoff                       │
│ ├─ Logging em datajud_api_calls                       │
│ └─ Proxy para DataJud API                              │
└─────────────────────────────────────────────────────────┘
                        │
                        ↓ (HTTPS REST)
┌─────────────────────────────────────────────────────────┐
│ DATAJUD API (CNJ - PÚBLICA)                            │
│ https://api-publica.datajud.cnj.jus.br/               │
│ ├─ /api_publica_trt/_search        (Trabalho)         │
│ ├─ /api_publica_stj/_search        (Justiça)          │
│ ├─ /api_publica_trf/_search        (Federal)          │
│ └─ ... (outros tribunais)                              │
└─────────────────────────────────────────────────────────┘
                        │
                        ↓ (Resultado)
┌─────────────────────────────────────────────────────────┐
│ SUPABASE DATABASE                                       │
│ ├─ casos                  (linkage)                    │
│ ├─ datajud_processos      (cache)                      │
│ ├─ datajud_movimentacoes  (timeline)                   │
│ ├─ datajud_api_calls      (auditoria)                  │
│ └─ datajud_sync_jobs      (tracking de jobs)          │
└─────────────────────────────────────────────────────────┘
```

---

## Fluxos de Dados

### 1. Fluxo: Buscar Processos
```
Usuário clica "Buscar Processo"
    ↓
CasoDataJudSearchModal abre
Usuário preenche: tribunal, tipo de busca, query
Clica "Buscar"
    ↓
datajudCaseService.searchProcessos() é chamado
    ↓
Edge Function: datajud-enhanced
  ├─ Valida JWT + org_id
  ├─ Valida rate limit
  ├─ Chama DataJud API
  ├─ Log em datajud_api_calls
  └─ Retorna resultados
    ↓
Frontend exibe lista de processos
Usuário clica em processo para vincular
```

### 2. Fluxo: Vincular Processo a Caso
```
Usuário seleciona processo na modal
    ↓
handleSelectProcesso() é chamado
    ↓
datajudCaseService.linkProcessoToCaso()
    ↓
PATCH /casos/{caso_id}
  ├─ numero_processo
  ├─ tribunal
  ├─ grau
  ├─ classe_processual
  ├─ assunto_principal
  ├─ datajud_sync_status = "sincronizado"
  └─ datajud_last_sync_at = now()
    ↓
RLS Policy: user.org_id deve == casos.org_id
    ↓
Caso atualizado com processo
Frontend exibe seção DataJud com info do processo
```

### 3. Fluxo: Sincronizar Movimentações
```
Usuário clica "Sincronizar Agora"
    ↓
datajudCaseService.syncProcessoMovimentos()
    ↓
Edge Function busca processo no DataJud
Compara movimentos com datajud_movimentacoes
Insere apenas novas movimentações
    ↓
INSERT INTO datajud_movimentacoes
  ├─ codigo
  ├─ nome
  ├─ data_hora
  ├─ complemento
  ├─ detected_at
  └─ notified = false
    ↓
Atualiza casos.datajud_last_sync_at
    ↓
Toast: "X novas movimentações sincronizadas"
```

---

## Configuração

### 1. Variáveis de Ambiente

`.env.production` (MUST HAVE):
```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

`Supabase Secrets` (production):
```bash
DATAJUD_API_KEY=<obtida junto CNJ>
DATAJUD_RATE_LIMIT_PER_HOUR=100
```

### 2. Deployment da Edge Function

```bash
# 1. Fazer build do projeto
npm run build

# 2. Deploy da Edge Function
supabase functions deploy datajud-enhanced

# 3. Verificar deployment
supabase functions list
supabase functions describe datajud-enhanced
```

### 3. Criar Índices no Banco

Já feito em migration `20260131_datajud_casos_integration.sql`:

```sql
CREATE INDEX idx_casos_numero_processo ON casos(numero_processo);
CREATE INDEX idx_datajud_processos_numero_tribunal 
  ON datajud_processos(numero_processo, tribunal);
CREATE INDEX idx_datajud_api_calls_created_at 
  ON datajud_api_calls(created_at DESC);
```

---

## Uso

### Frontend - Buscar Processos

```typescript
import { datajudCaseService } from "@/services/datajudCaseService"

// Buscar por parte (nome/CPF/CNPJ)
const resultado = await datajudCaseService.searchProcessos({
  tribunal: "trt",
  searchType: "parte",
  query: "João Silva",
  clienteId: "cliente-123"
})

console.log(`Encontrados ${resultado.total} processos`)
console.log(`Latência: ${resultado.latency_ms}ms`)
```

### Frontend - Vincular Processo

```typescript
const processo = resultado.processos[0]

await datajudCaseService.linkProcessoToCaso("caso-123", processo)
// Caso agora contém: numero_processo, tribunal, grau, etc.
```

### Frontend - Sincronizar Movimentações

```typescript
const resultado = await datajudCaseService.syncProcessoMovimentos(
  "processo-id",
  "0000001-00.2025.5.15.0001",
  "trt"
)

console.log(`${resultado.novas_movimentacoes} novas movimentações`)
```

### Frontend - Hook com Auto-polling

```typescript
import { useDataJudSync } from "@/hooks/useDataJudSync"

function MeuComponente() {
  const { processos, movimentos, loading, error, searchProcessos, syncMovimentos } =
    useDataJudSync({
      autoSync: true,
      syncInterval: 5 * 60 * 1000, // 5 minutos
      enablePolling: true,
    })

  useEffect(() => {
    searchProcessos("João Silva", "cliente-123")
  }, [])

  if (loading) return <div>Carregando...</div>
  if (error) return <div>Erro: {error}</div>

  return <div>Encontrados {processos.length} processos</div>
}
```

### Backend - Consultar Histórico (Auditoria)

```typescript
// Todos os searches de uma organização
const { data: historico } = await supabase
  .from("datajud_api_calls")
  .select("*")
  .eq("org_id", org_id)
  .eq("action", "search")
  .order("created_at", { ascending: false })
  .limit(100)
```

---

## Segurança & Compliance

### 1. Autenticação & Autorização

✅ **JWT Validation**: Toda requisição é autenticada
```typescript
const token = authHeader.replace("Bearer ", "")
const { data: { user }, error: authError } = await supabase.auth.getUser(token)
```

✅ **Org-Scoped**: Usuário pode buscar apenas dentro da sua organização
```sql
-- RLS Policy
is_org_member(org_id)  -- user belongs to this org
```

✅ **Rate Limiting**: 100 requisições/hora por org
```typescript
if (!checkRateLimit(orgId, 100, 3600000)) {
  return new Response(429, "Rate limit exceeded")
}
```

### 2. Auditoria (LGPD)

Toda consulta é registrada em `datajud_api_calls`:
```sql
INSERT INTO datajud_api_calls (
  user_id, org_id, action, tribunal, search_query,
  resultado_count, api_latency_ms, status_code, error_message,
  created_at
) VALUES (...)
```

**Retenção**: 90 dias (depois arquivar/deletar para LGPD compliance)

### 3. Dados Sensíveis

- ✅ API Key em Supabase Secrets (nunca expor ao frontend)
- ✅ RLS policies garantem isolamento por org
- ✅ Dados sigilosos respeitam `nivelSigilo` da API
- ✅ PII (nomes, CPF, CNPJ) apenas consultados, não armazenados

### 4. Consentimento

Considerar implementar consentimento antes de consultar:
```typescript
// TODO: Implementar checkbox de consentimento
// "Confirmar busca de dados públicos no DataJud"
// Registrar consentimento em audit_logs
```

---

## Troubleshooting

### Erro: "Rate limit exceeded"
**Causa**: Organização atingiu 100 requisições/hora
**Solução**: 
- Aguardar 1 hora
- Implementar fila de requisições
- Aumentar limite em `DATAJUD_RATE_LIMIT_PER_HOUR`

### Erro: "DATAJUD_API_KEY not configured"
**Causa**: Env var não setada em Supabase
**Solução**:
```bash
# No dashboard Supabase: Project Settings → Edge Functions → Secrets
supabase secrets set DATAJUD_API_KEY=<sua-chave>
```

### Erro: "DataJud API returned 429"
**Causa**: DataJud API também tem rate limit
**Solução**: Edge Function automaticamente faz retry com backoff
- 1s, 2s, 4s, 8s, 10s (máximo)
- Máximo 3 tentativas

### Erro: "User not part of any organization"
**Causa**: User não foi adicionado a nenhuma organização
**Solução**: Verificar tabela `org_members`
```sql
SELECT * FROM org_members WHERE user_id = '<uuid>'
```

### Nenhum processo encontrado
**Causas possíveis**:
1. Tribunal incorreto (verif icação de opções)
2. Query muito genérico (usar nome completo)
3. Processo ainda não sincronizado no DataJud (TT pode levar dias)
4. Processo sigiloso (não visível publicamente)

**Solução**: Tentar outros tribunais, variar query, verificar processo diretamente no portal DataJud

### Movimentações não sincronizam
**Causa**: Processo pode estar com símbolo de sigiloso
**Solução**: 
- Verificar `sigiloso` field na resposta
- Solicitar acesso especial ao CNJ se necessário

---

## Exemplos

### Exemplo 1: Integração em CasoForm

```typescript
import { CasoDataJudSearchModal } from "@/components/CasoDetail/CasoDataJudSearchModal"
import { datajudCaseService } from "@/services/datajudCaseService"

export function CasoForm() {
  const [numeroProcesso, setNumeroProcesso] = useState("")
  const [tribunal, setTribunal] = useState("")

  const handleAddProcesso = async (processo) => {
    setNumeroProcesso(processo.numero_processo)
    setTribunal(processo.tribunal)
    // Salvar formulário...
  }

  return (
    <form>
      {/* ... outros campos ... */}
      
      <div>
        <label>Processo Judicial</label>
        {numeroProcesso ? (
          <div>
            <span>{numeroProcesso} ({tribunal})</span>
            <button onClick={() => {
              setNumeroProcesso("")
              setTribunal("")
            }}>
              Remover
            </button>
          </div>
        ) : (
          <CasoDataJudSearchModal
            isOpen={true}
            onClose={() => {}}
            onSelectProcesso={handleAddProcesso}
            clienteName={formValues.clienteName}
          />
        )}
      </div>
    </form>
  )
}
```

### Exemplo 2: Dashboard com Sync Status

```typescript
export function CasosDataJudDashboard() {
  const [casos, setCasos] = useState([])

  useEffect(() => {
    // Buscar casos com DataJud vinculado
    supabase
      .from("v_casos_com_datajud")
      .select("*")
      .eq("org_id", currentOrg.id)
      .then(({ data }) => setCasos(data || []))
  }, [])

  return (
    <table>
      <thead>
        <tr>
          <th>Caso</th>
          <th>Processo</th>
          <th>Status Sync</th>
          <th>Última Sincronização</th>
          <th>Movimentações</th>
        </tr>
      </thead>
      <tbody>
        {casos.map(caso => (
          <tr key={caso.id}>
            <td>{caso.titulo}</td>
            <td>{caso.numero_processo}</td>
            <td>
              <span className={caso.datajud_sync_status === 'sincronizado' ? 'text-green-600' : 'text-yellow-600'}>
                {caso.datajud_sync_status}
              </span>
            </td>
            <td>{new Date(caso.datajud_last_sync_at).toLocaleDateString()}</td>
            <td>{caso.total_movimentacoes}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

---

## Links Úteis

- 📍 [Wiki DataJud Oficial](https://datajud-wiki.cnj.jus.br/api-publica/)
- 📍 [Documentação Acesso & Auth](https://datajud-wiki.cnj.jus.br/api-publica/acesso/)
- 📍 [Endpoints por Tribunal](https://datajud-wiki.cnj.jus.br/api-publica/endpoints/)
- 📍 [Tutorial PDF](https://www.cnj.jus.br/wp-content/uploads/2023/05/tutorial-api-publica-datajud-beta.pdf)

---

## Suporte & Feedback

Para issues, feature requests, ou melhorias:
1. Abrir issue no repositório
2. Descrever problema com: screenshots, queries, logs
3. Incluir: versão, endpoint usado, tribunal
