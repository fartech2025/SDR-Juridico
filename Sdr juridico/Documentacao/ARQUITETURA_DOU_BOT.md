# Arquitetura Tecnica - Bot DOU (Diario Oficial da Uniao)

## 1. Visao Geral da Arquitetura

O bot DOU segue uma arquitetura **event-driven com processamento batch**, integrada
ao stack existente do SDR Juridico (Supabase + React). A solucao e composta
por 3 camadas independentes que se comunicam via banco de dados (PostgreSQL):

```
                    ┌─────────────────────────────────────────┐
                    │            CAMADA DE INGESTAO            │
                    │         (Edge Function: CRON Job)        │
                    │                                          │
                    │  ┌──────────┐    ┌───────────────────┐  │
                    │  │ INLABS   │───>│ XML Parser        │  │
                    │  │ Auth +   │    │ (Secao 3)         │  │
                    │  │ Download │    │                    │  │
                    │  └──────────┘    └────────┬──────────┘  │
                    │                           │              │
                    │                  ┌────────▼──────────┐  │
                    │                  │ Matching Engine    │  │
                    │                  │ (termos x publi-   │  │
                    │                  │  cacoes)           │  │
                    │                  └────────┬──────────┘  │
                    └──────────────────────────┬──────────────┘
                                               │
                    ┌──────────────────────────▼──────────────┐
                    │         CAMADA DE PERSISTENCIA           │
                    │           (Supabase PostgreSQL)          │
                    │                                          │
                    │  ┌────────────────┐ ┌────────────────┐  │
                    │  │dou_publicacoes │ │dou_termos_     │  │
                    │  │               │ │monitorados     │  │
                    │  └───────┬────────┘ └────────────────┘  │
                    │          │                                │
                    │  ┌───────▼────────┐ ┌────────────────┐  │
                    │  │dou_sync_logs   │ │notificacoes    │  │
                    │  │               │ │(existente)     │  │
                    │  └────────────────┘ └────────────────┘  │
                    │                                          │
                    │  RLS: org_id scoped (multi-tenant)       │
                    └──────────────────────────┬──────────────┘
                                               │
                    ┌──────────────────────────▼──────────────┐
                    │          CAMADA DE APRESENTACAO           │
                    │          (React + Supabase Client)        │
                    │                                          │
                    │  ┌──────────┐  ┌──────────┐  ┌───────┐ │
                    │  │douService│  │useDOU    │  │ UI    │ │
                    │  │.ts       │──│hook      │──│Comps  │ │
                    │  └──────────┘  └──────────┘  └───────┘ │
                    │          │                                │
                    │  ┌───────▼────────┐                     │
                    │  │Edge Fn:        │                     │
                    │  │dou-search      │ (busca sob demanda) │
                    │  └────────────────┘                     │
                    └─────────────────────────────────────────┘
```

---

## 2. Detalhamento por Camada

### 2.1 Camada de Ingestao (dou-sync-cron)

**Runtime:** Supabase Edge Function (Deno)
**Trigger:** CRON schedule `0 9 * * 1-5` (9h, seg-sex, apos publicacao do DOU)
**Timeout:** 300s (5 minutos - limite Edge Functions)

```
┌─────────────────────────────────────────────────────────────┐
│                    dou-sync-cron                             │
│                                                              │
│  FASE 1: AUTENTICACAO INLABS                                │
│  ┌────────────────────────────────────────┐                 │
│  │ POST inlabs.in.gov.br/logar           │                 │
│  │ Body: { email, password }              │                 │
│  │ Response: Set-Cookie (session token)   │                 │
│  │                                         │                 │
│  │ Retry: 3x com backoff (1s, 2s, 4s)    │                 │
│  │ Fallback: abortar e logar erro         │                 │
│  └────────────────────────────────────────┘                 │
│                          │                                   │
│  FASE 2: DOWNLOAD XML                                       │
│  ┌────────────────────────────────────────┐                 │
│  │ GET inlabs.in.gov.br/download/...     │                 │
│  │ Params: secao=DO3, data=YYYY-MM-DD    │                 │
│  │ Response: ZIP (contendo XML)           │                 │
│  │                                         │                 │
│  │ Tamanho tipico: 2-15 MB (compactado)  │                 │
│  │ Descompressao em memoria (streaming)   │                 │
│  └────────────────────────────────────────┘                 │
│                          │                                   │
│  FASE 3: PARSING XML                                        │
│  ┌────────────────────────────────────────┐                 │
│  │ XML → Array<PublicacaoDOU>             │                 │
│  │                                         │                 │
│  │ Campos extraidos por publicacao:       │                 │
│  │  - artCategory (tipo do ato)           │                 │
│  │  - identifica  (identificador unico)   │                 │
│  │  - titulo      (titulo da publicacao)  │                 │
│  │  - texto       (conteudo completo)     │                 │
│  │  - name        (orgao publicador)      │                 │
│  │  - pubName     (nome do diario)        │                 │
│  │  - pubDate     (data publicacao)       │                 │
│  │  - numberPage  (pagina no DOU)         │                 │
│  │  - urlTitle    (slug para URL)         │                 │
│  │                                         │                 │
│  │ Secao 3 tipica: 500-3000 publicacoes  │                 │
│  └────────────────────────────────────────┘                 │
│                          │                                   │
│  FASE 4: MATCHING (por organizacao)                         │
│  ┌────────────────────────────────────────┐                 │
│  │ Para cada org com DOU habilitado:      │                 │
│  │                                         │                 │
│  │  1. Carregar termos de                 │                 │
│  │     dou_termos_monitorados             │                 │
│  │     WHERE ativo = true                 │                 │
│  │                                         │                 │
│  │  2. Fallback: gerar termos de          │                 │
│  │     casos WHERE numero_processo        │                 │
│  │     IS NOT NULL AND status = 'ativo'   │                 │
│  │                                         │                 │
│  │  3. Full-text search:                  │                 │
│  │     termo IN (pub.titulo + pub.texto)  │                 │
│  │                                         │                 │
│  │  4. Scoring de relevancia (0-1)        │                 │
│  │                                         │                 │
│  │  5. INSERT em dou_publicacoes          │                 │
│  │     (ON CONFLICT DO NOTHING)           │                 │
│  │                                         │                 │
│  │  6. INSERT em notificacoes (P1)        │                 │
│  │                                         │                 │
│  │  7. INSERT em timeline_events          │                 │
│  └────────────────────────────────────────┘                 │
│                          │                                   │
│  FASE 5: LOGGING                                            │
│  ┌────────────────────────────────────────┐                 │
│  │ INSERT em dou_sync_logs                │                 │
│  │ {                                       │                 │
│  │   status: 'sucesso' | 'erro',          │                 │
│  │   total_publicacoes_dou: N,            │                 │
│  │   termos_pesquisados: N,               │                 │
│  │   publicacoes_encontradas: N,          │                 │
│  │   duracao_ms: elapsed                  │                 │
│  │ }                                       │                 │
│  └────────────────────────────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Camada de Persistencia (PostgreSQL)

**Diagrama ER:**

```
┌──────────────────────┐       ┌──────────────────────┐
│       orgs           │       │       casos           │
│──────────────────────│       │──────────────────────│
│ id (PK)              │◄──┐   │ id (PK)              │
│ name                 │   │   │ org_id (FK → orgs)   │
│ ...                  │   │   │ numero_processo       │
└──────────────────────┘   │   │ tribunal              │
                           │   │ ...                   │
                           │   └───────────┬──────────┘
                           │               │
          ┌────────────────┼───────────────┼──────────────────┐
          │                │               │                   │
          ▼                ▼               ▼                   │
┌──────────────────┐ ┌──────────────────┐ ┌────────────────┐ │
│ dou_publicacoes  │ │dou_termos_       │ │dou_sync_logs   │ │
│──────────────────│ │monitorados       │ │────────────────│ │
│ id (PK, UUID)    │ │──────────────────│ │ id (PK, UUID)  │ │
│ org_id (FK)  ────┤ │ id (PK, UUID)    │ │ org_id (FK)    │ │
│ caso_id (FK) ────┤ │ org_id (FK)  ────┤ │ data_pesquisa  │ │
│                  │ │ caso_id (FK) ────┤ │ total_pub_dou  │ │
│ secao            │ │                  │ │ termos_pesq    │ │
│ data_publicacao  │ │ termo            │ │ pub_encontradas│ │
│ titulo           │ │ tipo             │ │ status         │ │
│ conteudo         │ │ ativo            │ │ erro_mensagem  │ │
│ orgao_publicador │ │                  │ │ duracao_ms     │ │
│ tipo_publicacao  │ │ created_at       │ │ created_at     │ │
│ url_publicacao   │ │ updated_at       │ └────────────────┘ │
│ identifica       │ └──────────────────┘                     │
│ pagina           │                                          │
│                  │   UNIQUE(org_id, caso_id, termo)         │
│ termo_encontrado │                                          │
│ match_type       │                                          │
│ relevancia       │                                          │
│                  │                                          │
│ lida             │                                          │
│ notificada       │                                          │
│ raw_xml (JSONB)  │                                          │
│                  │                                          │
│ created_at       │                                          │
│ updated_at       │                                          │
│                  │                                          │
│ UNIQUE(identifica│                                          │
│        caso_id)  │                                          │
└──────────────────┘                                          │
          │                                                    │
          │ Integracao com tabelas existentes:                 │
          ▼                                                    │
┌──────────────────┐  ┌──────────────────┐                    │
│ notificacoes     │  │ timeline_events  │                    │
│ (existente)      │  │ (existente)      │                    │
│──────────────────│  │──────────────────│                    │
│ tipo: 'dou'      │  │ categoria:       │                    │
│ prioridade: 'P1' │  │   'juridico'     │                    │
│ caso_id (FK)     │  │ canal: 'dou_bot' │                    │
│ org_id (FK)      │  │ caso_id (FK)     │                    │
└──────────────────┘  └──────────────────┘                    │
```

### 2.3 Camada de Apresentacao

```
┌──────────────────────────────────────────────────────────┐
│                   FRONTEND (React)                        │
│                                                           │
│  ┌─────────────────────────────────────────────────┐     │
│  │                  CasoPage.tsx                     │     │
│  │                                                   │     │
│  │  ┌───────────────────────────────────────────┐   │     │
│  │  │          CasoDouSection.tsx                │   │     │
│  │  │                                            │   │     │
│  │  │  ┌──────────────────────────────────────┐ │   │     │
│  │  │  │ Header: "Diario Oficial" + Badge [3] │ │   │     │
│  │  │  └──────────────────────────────────────┘ │   │     │
│  │  │                                            │   │     │
│  │  │  ┌──────────────────────────────────────┐ │   │     │
│  │  │  │ Lista de publicacoes encontradas     │ │   │     │
│  │  │  │  ┌────┬───────┬──────┬───────────┐  │ │   │     │
│  │  │  │  │Tipo│ Data  │Titulo│  Acoes    │  │ │   │     │
│  │  │  │  ├────┼───────┼──────┼───────────┤  │ │   │     │
│  │  │  │  │ 📋 │05/02  │Intim.│Lida | Link│  │ │   │     │
│  │  │  │  │ 📋 │04/02  │Cit.  │Lida | Link│  │ │   │     │
│  │  │  │  └────┴───────┴──────┴───────────┘  │ │   │     │
│  │  │  └──────────────────────────────────────┘ │   │     │
│  │  │                                            │   │     │
│  │  │  [Buscar no DOU]  [Config. Monitoramento] │   │     │
│  │  └───────────┬────────────────┬──────────────┘   │     │
│  └──────────────┼────────────────┼──────────────────┘     │
│                 │                │                          │
│    ┌────────────▼──┐   ┌────────▼─────────────┐           │
│    │DOUSearchModal │   │ DOUMonitorConfig      │           │
│    │               │   │                       │           │
│    │ Termo: [___]  │   │ Termos monitorados:   │           │
│    │ Periodo: [__] │   │ ✅ 0001234-56.2024... │           │
│    │               │   │ ✅ Joao Silva          │           │
│    │ [Buscar]      │   │ ☐  OAB/RJ 12345      │           │
│    │               │   │                       │           │
│    │ Resultados:   │   │ [+ Adicionar termo]   │           │
│    │ ┌───────────┐ │   └───────────────────────┘           │
│    │ │ ...       │ │                                       │
│    │ └───────────┘ │                                       │
│    └───────────────┘                                       │
│                                                           │
│  CAMADA DE SERVICOS:                                      │
│  ┌──────────────┐     ┌──────────────┐                    │
│  │ douService   │────>│ Supabase     │ (queries diretas)  │
│  │ .ts          │     │ Client       │                    │
│  │              │────>│ Edge Fn:     │ (busca sob demanda)│
│  │              │     │ dou-search   │                    │
│  └──────┬───────┘     └──────────────┘                    │
│         │                                                  │
│  ┌──────▼───────┐                                         │
│  │ useDOU.ts    │  (hook com state management)            │
│  │              │                                         │
│  │ publicacoes  │                                         │
│  │ termos       │                                         │
│  │ naoLidas     │                                         │
│  │ loading      │                                         │
│  │ error        │                                         │
│  └──────────────┘                                         │
└──────────────────────────────────────────────────────────┘
```

---

## 3. Fluxo de Dados Completo

### 3.1 Fluxo CRON (automatico, diario)

```
Tempo ──────────────────────────────────────────────────────────>

09:00  │ Supabase Scheduler dispara dou-sync-cron
       │
       ▼
09:00  │ Valida x-sync-secret header
       │
       ▼
09:01  │ POST inlabs.in.gov.br/logar
       │   ├── 200 OK → continua
       │   ├── 401    → retry (3x backoff)
       │   └── 5xx    → retry (3x backoff) → log erro → abort
       │
       ▼
09:02  │ GET inlabs.in.gov.br/download/secao3/2026-02-05.zip
       │   Response: ~5MB ZIP
       │   Descompacta em memoria → XML ~30MB
       │
       ▼
09:03  │ Parseia XML
       │   ~1500 publicacoes na Secao 3 (dia tipico)
       │   Extrai: titulo, texto, orgao, tipo, identifica
       │
       ▼
09:03  │ SELECT DISTINCT org_id FROM dou_termos_monitorados
       │   WHERE ativo = true
       │   → Lista de orgs com monitoramento ativo
       │
       ▼
09:03  │ Para cada org (processamento sequencial):
       │   │
       │   ├── SELECT termo, tipo, caso_id
       │   │   FROM dou_termos_monitorados
       │   │   WHERE org_id = $1 AND ativo = true
       │   │
       │   ├── Se 0 termos: SELECT numero_processo, id
       │   │   FROM casos WHERE org_id = $1
       │   │   AND status = 'ativo'
       │   │   AND numero_processo IS NOT NULL
       │   │
       │   ├── Para cada publicacao (1500x):
       │   │     Para cada termo (Nx):
       │   │       texto_completo = pub.titulo + pub.texto
       │   │       IF termo encontrado em texto_completo:
       │   │         score = calcularRelevancia(match_type)
       │   │         INSERT INTO dou_publicacoes (...)
       │   │           ON CONFLICT (identifica, caso_id) DO NOTHING
       │   │         INSERT INTO notificacoes (tipo: 'dou', P1)
       │   │         INSERT INTO timeline_events (canal: 'dou_bot')
       │   │
       │   └── INSERT INTO dou_sync_logs (sucesso, duracao_ms, ...)
       │
       ▼
09:04  │ Response 200 { processed: N, found: M }
```

### 3.2 Fluxo de Busca Manual (sob demanda)

```
Usuario                    Frontend                Edge Fn            INLABS/DB
   │                          │                      │                    │
   │  Clica "Buscar no DOU"   │                      │                    │
   │─────────────────────────>│                      │                    │
   │                          │                      │                    │
   │                          │  POST dou-search     │                    │
   │                          │  { termo, periodo }  │                    │
   │                          │─────────────────────>│                    │
   │                          │                      │                    │
   │                          │                      │  1. Valida JWT     │
   │                          │                      │  2. Check rate     │
   │                          │                      │     limit          │
   │                          │                      │                    │
   │                          │                      │  3. SELECT FROM    │
   │                          │                      │     dou_publicacoes│
   │                          │                      │────────────────────>
   │                          │                      │                    │
   │                          │                      │  Se periodo ja     │
   │                          │                      │  indexado:         │
   │                          │                      │<────────────────────
   │                          │                      │  retorna resultados│
   │                          │                      │                    │
   │                          │                      │  Se NAO indexado:  │
   │                          │                      │  4. Login INLABS   │
   │                          │                      │────────────────────>
   │                          │                      │  5. Download XML   │
   │                          │                      │<────────────────────
   │                          │                      │  6. Parse + match  │
   │                          │                      │  7. Cache results  │
   │                          │                      │────────────────────>
   │                          │                      │                    │
   │                          │  200 { publicacoes } │                    │
   │                          │<─────────────────────│                    │
   │                          │                      │                    │
   │  Renderiza resultados    │                      │                    │
   │<─────────────────────────│                      │                    │
```

---

## 4. Matching Engine - Detalhamento Tecnico

O motor de matching e o componente mais critico. Ele precisa ser rapido
(processar ~1500 publicacoes x N termos) e preciso (minimizar falsos positivos).

### 4.1 Algoritmo de Matching

```
function matchTermo(publicacao, termo):
    texto = normalizar(publicacao.titulo + " " + publicacao.texto)
    termoNorm = normalizar(termo.termo)

    switch (termo.tipo):
        case 'numero_processo':
            // Numero CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO
            // Busca com e sem formatacao
            termoLimpo = removerFormatacao(termoNorm) // so digitos
            IF texto.contains(termoNorm):
                return { match: true, score: 1.0 }
            IF texto.contains(termoLimpo):
                return { match: true, score: 0.8 }

        case 'nome_parte':
            // Busca case-insensitive, com normalizacao de acentos
            IF texto.contains(termoNorm):
                return { match: true, score: 0.7 }
            // Busca por sobrenomes (split por espaco)
            sobrenomes = termoNorm.split(" ").filter(s => s.length > 3)
            IF sobrenomes.every(s => texto.contains(s)):
                return { match: true, score: 0.5 }

        case 'oab':
            // Busca por "OAB" + numero
            IF texto.contains("OAB") AND texto.contains(termoNorm):
                return { match: true, score: 0.6 }

        case 'custom':
            IF texto.contains(termoNorm):
                return { match: true, score: 0.4 }

    return { match: false, score: 0 }

function normalizar(texto):
    return texto
        .toLowerCase()
        .normalize("NFD")                     // decompor acentos
        .replace(/[\u0300-\u036f]/g, "")      // remover diacriticos
        .replace(/\s+/g, " ")                 // normalizar espacos
        .trim()

function removerFormatacao(numero):
    return numero.replace(/[^0-9]/g, "")      // so digitos
```

### 4.2 Classificacao Automatica de Tipo

```
function classificarTipo(titulo, conteudo):
    texto = (titulo + " " + conteudo).toLowerCase()

    // Ordem importa: mais especifico primeiro
    patterns = [
        { tipo: 'intimacao',  keywords: ['intimação', 'intimar', 'intimado', 'fica intimado'] },
        { tipo: 'citacao',    keywords: ['citação', 'citar', 'citado', 'fica citado'] },
        { tipo: 'sentenca',   keywords: ['sentença', 'julgo procedente', 'julgo improcedente'] },
        { tipo: 'despacho',   keywords: ['despacho', 'despacha', 'determino'] },
        { tipo: 'edital',     keywords: ['edital', 'edita'] },
    ]

    for pattern in patterns:
        if any(keyword in texto for keyword in pattern.keywords):
            return pattern.tipo

    return 'outro'
```

### 4.3 Complexidade Computacional

```
Cenario tipico:
  - Publicacoes no DOU Secao 3: ~1500/dia
  - Termos por organizacao: ~20 (10 processos ativos)
  - Organizacoes ativas: ~50

Operacoes de matching:
  1500 publicacoes x 20 termos x 50 orgs = 1.500.000 comparacoes

Porem: o XML e baixado 1 vez e parseado 1 vez.
O matching e string search em memoria (O(n*m) por comparacao).

Com texto medio de 500 chars por publicacao:
  1.500.000 x 500 chars = ~750 MB de texto processado

OTIMIZACAO: Pre-processar publicacoes 1 vez, depois iterar termos.
Resultado real: ~2-5 segundos em Edge Function (V8 engine).
```

---

## 5. Estrategia de Escalabilidade

### 5.1 Cenarios de Crescimento

```
┌──────────────┬──────────┬───────────┬──────────────┬─────────────────┐
│ Metrica      │ Pequeno  │ Medio     │ Grande       │ Enterprise      │
│              │ (atual)  │ (6 meses) │ (1 ano)      │ (2+ anos)       │
├──────────────┼──────────┼───────────┼──────────────┼─────────────────┤
│ Organizacoes │ 5-10     │ 50-100    │ 500-1000     │ 5000+           │
│ Casos ativos │ 50       │ 500       │ 5000         │ 50000           │
│ Termos/org   │ 10       │ 20        │ 50           │ 100             │
│ Total termos │ 100      │ 2000      │ 50000        │ 500000          │
│ Pub DOU/dia  │ 1500     │ 1500      │ 1500         │ 1500            │
│ Matches/dia  │ ~5       │ ~50       │ ~500         │ ~5000           │
│ DB rows/mes  │ ~150     │ ~1500     │ ~15000       │ ~150000         │
└──────────────┴──────────┴───────────┴──────────────┴─────────────────┘
```

### 5.2 Gargalos e Solucoes por Fase

```
FASE 1: PEQUENO/MEDIO (ate 100 orgs, 2000 termos)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Arquitetura: Edge Function unica (como proposto)
  Processamento: Sequencial (org por org)
  Matching: String search em memoria
  Tempo estimado: ~10-30s por execucao

  ✅ Sem gargalos. Edge Function resolve tudo.


FASE 2: GRANDE (ate 1000 orgs, 50000 termos)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  GARGALO: 1500 pub x 50000 termos = 75M comparacoes
           Timeout de Edge Function (300s) pode nao bastar.

  SOLUCAO A: Pre-indexacao com busca invertida
  ┌─────────────────────────────────────────────────────┐
  │ Em vez de: para cada pub → para cada termo → match  │
  │                                                      │
  │ Fazer:                                               │
  │ 1. Concatenar TODOS os textos das 1500 publicacoes  │
  │    em um unico string (ou usar Set de tokens)       │
  │ 2. Para cada termo, fazer 1 busca no texto completo │
  │ 3. Se encontrou, identificar QUAL publicacao contem │
  │                                                      │
  │ Complexidade: O(T) em vez de O(P*T)                 │
  │ Onde T = total de termos, P = publicacoes           │
  └─────────────────────────────────────────────────────┘

  SOLUCAO B: Full-Text Search no PostgreSQL
  ┌─────────────────────────────────────────────────────┐
  │ 1. CRON baixa XML e insere TODAS as publicacoes     │
  │    do dia em tabela temporaria dou_publicacoes_raw  │
  │                                                      │
  │ 2. Criar indice GIN/tsvector no conteudo:           │
  │    ALTER TABLE dou_publicacoes_raw                   │
  │    ADD COLUMN tsv tsvector                           │
  │    GENERATED ALWAYS AS (                             │
  │      to_tsvector('portuguese', titulo||' '||texto)  │
  │    ) STORED;                                         │
  │    CREATE INDEX idx_tsv ON dou_publicacoes_raw       │
  │      USING GIN(tsv);                                │
  │                                                      │
  │ 3. Para cada termo:                                  │
  │    SELECT * FROM dou_publicacoes_raw                 │
  │    WHERE tsv @@ plainto_tsquery('portuguese', $1)   │
  │                                                      │
  │ Vantagem: PostgreSQL otimiza a busca internamente   │
  │ Desvantagem: precisa inserir 1500 rows no DB        │
  │              antes de buscar (overhead de ~5s)       │
  └─────────────────────────────────────────────────────┘

  SOLUCAO C: Processamento paralelo com fan-out
  ┌─────────────────────────────────────────────────────┐
  │ CRON principal (dou-sync-cron):                     │
  │   1. Baixa XML                                      │
  │   2. Salva em Supabase Storage (bucket temporario)  │
  │   3. Dispara N workers via fetch():                 │
  │      POST dou-sync-worker                           │
  │      { org_id, storage_path }                       │
  │                                                      │
  │ Worker (dou-sync-worker):                           │
  │   1. Baixa XML do Storage                           │
  │   2. Processa apenas SUA org                        │
  │   3. Salva resultados no DB                         │
  │                                                      │
  │ Paralelismo: ate 10 workers simultaneos             │
  │ Tempo: ~30s mesmo com 1000 orgs                     │
  └─────────────────────────────────────────────────────┘


FASE 3: ENTERPRISE (5000+ orgs, 500000 termos)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  GARGALO: Volume de dados, latencia de notificacoes,
           custo de storage, reprocessamento

  SOLUCAO: Migrar para arquitetura de mensageria
  ┌─────────────────────────────────────────────────────┐
  │                                                      │
  │  ┌─────────┐    ┌──────────┐    ┌──────────────┐   │
  │  │ CRON    │───>│ Message  │───>│ Workers      │   │
  │  │ Ingestor│    │ Queue    │    │ (Deno Deploy │   │
  │  │         │    │ (pgmq /  │    │  ou AWS      │   │
  │  │ Baixa   │    │  BullMQ) │    │  Lambda)     │   │
  │  │ XML     │    │          │    │              │   │
  │  │ Parseia │    │ 1 msg    │    │ Processa     │   │
  │  │ Publica │    │ por org  │    │ 1 org        │   │
  │  └─────────┘    └──────────┘    └──────┬───────┘   │
  │                                         │           │
  │                                  ┌──────▼───────┐   │
  │                                  │ PostgreSQL   │   │
  │                                  │ + Realtime   │   │
  │                                  │ Subscriptions│   │
  │                                  └──────────────┘   │
  │                                                      │
  │  Beneficios:                                         │
  │  - Processamento distribuido (horizontal scaling)   │
  │  - Retry por org (falha isolada)                    │
  │  - Backpressure automatico                          │
  │  - Observabilidade por org                          │
  └─────────────────────────────────────────────────────┘

  ALTERNATIVA: pgmq (PostgreSQL Message Queue)
  ┌─────────────────────────────────────────────────────┐
  │ Supabase suporta pgmq nativamente.                  │
  │                                                      │
  │ -- Criar fila                                        │
  │ SELECT pgmq.create('dou_processing');               │
  │                                                      │
  │ -- CRON enfileira 1 msg por org                     │
  │ SELECT pgmq.send('dou_processing',                  │
  │   json_build_object(                                 │
  │     'org_id', org.id,                               │
  │     'data', '2026-02-05',                           │
  │     'storage_path', 'dou/2026-02-05/secao3.xml'    │
  │   )                                                  │
  │ );                                                   │
  │                                                      │
  │ -- Workers consomem                                  │
  │ SELECT * FROM pgmq.read('dou_processing', 30, 1);  │
  │ -- processar...                                      │
  │ SELECT pgmq.delete('dou_processing', msg_id);       │
  │                                                      │
  │ Vantagem: zero infra adicional (tudo no PostgreSQL) │
  └─────────────────────────────────────────────────────┘
```

### 5.3 Tabela de Decisao de Escalabilidade

```
┌──────────────────────┬──────────────┬──────────────┬──────────────────┐
│ Condicao             │ Solucao      │ Complexidade │ Custo adicional  │
├──────────────────────┼──────────────┼──────────────┼──────────────────┤
│ < 100 orgs           │ Edge Fn unica│ Baixa        │ $0               │
│ 100-500 orgs         │ FTS Postgres │ Media        │ $0               │
│ 500-2000 orgs        │ Fan-out      │ Media        │ ~$10/mes         │
│ 2000-5000 orgs       │ pgmq + fan   │ Alta         │ ~$50/mes         │
│ 5000+ orgs           │ Message queue│ Alta         │ ~$200/mes        │
│                      │ + workers    │              │                  │
└──────────────────────┴──────────────┴──────────────┴──────────────────┘
```

---

## 6. Seguranca e Multi-Tenancy

### 6.1 Isolamento de Dados

```
PRINCIPIO: Nenhuma organizacao pode ver dados de outra.

┌──────────────────────────────────────────────────────────┐
│                    ROW LEVEL SECURITY                      │
│                                                           │
│  Cada tabela DOU tem coluna org_id (NOT NULL).           │
│                                                           │
│  Policy SELECT:                                           │
│    USING (is_org_member(org_id))                         │
│                                                           │
│  is_org_member() verifica:                               │
│    EXISTS (                                               │
│      SELECT 1 FROM org_members                           │
│      WHERE user_id = auth.uid()                          │
│      AND org_id = $1                                     │
│    )                                                      │
│                                                           │
│  Resultado:                                               │
│  - User da Org A consulta dou_publicacoes                │
│  - PostgreSQL automaticamente filtra WHERE org_id = A    │
│  - Mesmo com SQL injection, dados de Org B sao invisivel │
└──────────────────────────────────────────────────────────┘

CRON (service_role):
┌──────────────────────────────────────────────────────────┐
│  O CRON roda com SUPABASE_SERVICE_ROLE_KEY               │
│  (bypassa RLS).                                          │
│                                                           │
│  Protecao:                                               │
│  1. CRON autenticado via DOU_SYNC_SECRET (header)        │
│  2. CRON nunca expoe dados cross-org                     │
│  3. Cada INSERT inclui org_id explicitamente             │
│  4. Logs de auditoria por org                            │
└──────────────────────────────────────────────────────────┘
```

### 6.2 Protecao de Credenciais

```
┌──────────────────────────────────────────────────────────┐
│                FLUXO DE CREDENCIAIS                       │
│                                                           │
│  Browser (React)                                         │
│    │ NAO tem acesso a INLABS_EMAIL/PASSWORD              │
│    │ NAO tem acesso a DOU_SYNC_SECRET                    │
│    │ SO tem: SUPABASE_ANON_KEY + JWT do usuario          │
│    │                                                      │
│    ▼                                                      │
│  Edge Function (dou-search)                              │
│    │ Recebe JWT do usuario                               │
│    │ Valida via supabase.auth.getUser(token)             │
│    │ Resolve org_id via org_members                      │
│    │ TEM acesso a INLABS_EMAIL/PASSWORD (env vars)       │
│    │ Faz request ao INLABS em nome do sistema            │
│    │                                                      │
│    ▼                                                      │
│  INLABS                                                   │
│    │ Ve apenas 1 usuario: o email do sistema             │
│    │ Nao sabe qual org ou usuario originou o request     │
│                                                           │
│  Resultado: credenciais INLABS nunca saem do servidor    │
└──────────────────────────────────────────────────────────┘
```

---

## 7. Resiliencia e Tratamento de Erros

### 7.1 Pontos de Falha e Mitigacao

```
┌────────────────────┬────────────────────────┬─────────────────────────┐
│ Ponto de falha     │ Impacto                │ Mitigacao               │
├────────────────────┼────────────────────────┼─────────────────────────┤
│ INLABS offline     │ Sem dados do dia       │ Retry 3x com backoff.   │
│                    │                        │ Log erro. Tentar no     │
│                    │                        │ proximo CRON (10h).     │
│                    │                        │ Alerta para admin.      │
├────────────────────┼────────────────────────┼─────────────────────────┤
│ XML mal-formado    │ Parsing falha          │ Try/catch por publicacao│
│                    │                        │ Skip publicacao com erro│
│                    │                        │ Log warning.            │
├────────────────────┼────────────────────────┼─────────────────────────┤
│ PostgreSQL lento   │ Inserts demoram        │ Batch inserts (100 rows)│
│                    │                        │ ON CONFLICT DO NOTHING  │
│                    │                        │ Timeout por batch.      │
├────────────────────┼────────────────────────┼─────────────────────────┤
│ Edge Fn timeout    │ Processamento cortado  │ Checkpoint por org.     │
│ (300s)             │                        │ Registrar ultima org    │
│                    │                        │ processada. Continuar   │
│                    │                        │ no proximo CRON.        │
├────────────────────┼────────────────────────┼─────────────────────────┤
│ INLABS rate limit  │ Download bloqueado     │ 1 download/dia.         │
│                    │                        │ Cache XML no Supabase   │
│                    │                        │ Storage.                │
├────────────────────┼────────────────────────┼─────────────────────────┤
│ DOU nao publicado  │ XML nao disponivel     │ Verificar HTTP 404.     │
│ (feriado)          │                        │ Logar como "sem edicao" │
│                    │                        │ Nao gerar erro.         │
└────────────────────┴────────────────────────┴─────────────────────────┘
```

### 7.2 Padrao de Retry (reutiliza src/lib/retry.ts existente)

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  Tentativa 1 ──> FALHA (429 ou 5xx)                    │
│       │                                                  │
│       ▼  espera 1s + jitter (0-100ms)                   │
│                                                          │
│  Tentativa 2 ──> FALHA                                  │
│       │                                                  │
│       ▼  espera 2s + jitter                             │
│                                                          │
│  Tentativa 3 ──> FALHA                                  │
│       │                                                  │
│       ▼  Log erro definitivo em dou_sync_logs           │
│          Gerar notificacao P0 para admin da org          │
│                                                          │
│  Erros NAO retentaveis (abort imediato):                │
│  - 400 Bad Request (parametros errados)                 │
│  - 401 Unauthorized (credenciais invalidas)             │
│  - 403 Forbidden (acesso negado)                        │
│                                                          │
│  Erros retentaveis:                                     │
│  - 429 Too Many Requests                                │
│  - 500 Internal Server Error                            │
│  - 502 Bad Gateway                                      │
│  - 503 Service Unavailable                              │
│  - ECONNRESET, ETIMEDOUT (rede)                         │
└─────────────────────────────────────────────────────────┘
```

---

## 8. Observabilidade

### 8.1 Metricas Coletadas

```
dou_sync_logs (1 registro por org por execucao):
┌────────────────────────┬───────────────────────────────────┐
│ Campo                  │ O que mede                         │
├────────────────────────┼───────────────────────────────────┤
│ total_publicacoes_dou  │ Quantas publicacoes no DOU do dia │
│ termos_pesquisados     │ Quantos termos esta org monitora  │
│ publicacoes_encontradas│ Quantos matches (conversoes)      │
│ duracao_ms             │ Tempo de processamento desta org  │
│ status                 │ sucesso | erro                    │
│ erro_mensagem          │ Stacktrace ou mensagem de erro    │
└────────────────────────┴───────────────────────────────────┘

Metricas derivadas (para dashboard admin):
- Taxa de sucesso: COUNT(status='sucesso') / COUNT(*)
- Tempo medio: AVG(duracao_ms)
- Matches por dia: SUM(publicacoes_encontradas) GROUP BY data_pesquisa
- Orgs com erro: COUNT(DISTINCT org_id) WHERE status='erro'
```

### 8.2 Integracao com Health Monitor existente

```typescript
// Registrar check de saude do DOU no HealthMonitor existente
healthMonitor.registerCheck({
  name: 'dou-sync',
  interval: 60000, // 60s
  check: async () => {
    const { data } = await supabase
      .from('dou_sync_logs')
      .select('status, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!data) return { status: 'UNKNOWN', message: 'Nenhum sync registrado' }

    const lastSync = new Date(data.created_at)
    const hoursAgo = (Date.now() - lastSync.getTime()) / 3600000

    if (data.status === 'erro') return { status: 'DEGRADED', message: data.erro_mensagem }
    if (hoursAgo > 48) return { status: 'DEGRADED', message: 'Ultimo sync > 48h' }
    return { status: 'HEALTHY' }
  }
})
```

---

## 9. Performance Benchmarks Estimados

```
┌────────────────────────────────────┬────────────┬─────────────────┐
│ Operacao                           │ Tempo est. │ Notas           │
├────────────────────────────────────┼────────────┼─────────────────┤
│ Login INLABS                       │ ~500ms     │ 1x por execucao │
│ Download ZIP Secao 3 (~5MB)        │ ~2s        │ 1x por execucao │
│ Descompactar ZIP em memoria        │ ~200ms     │ ~30MB resultado │
│ Parsear XML (1500 publicacoes)     │ ~500ms     │ SAX parser      │
│ Matching (1500 pub x 20 termos)    │ ~100ms     │ String search   │
│ INSERT batch (10 matches)          │ ~50ms      │ ON CONFLICT     │
│ INSERT notificacoes                │ ~30ms      │ Batch           │
│                                    │            │                 │
│ TOTAL (1 org, 20 termos)           │ ~3.5s      │                 │
│ TOTAL (50 orgs, 1000 termos)       │ ~8s        │ XML cached      │
│ TOTAL (500 orgs, 10000 termos)     │ ~30s       │ Pre-indexacao   │
└────────────────────────────────────┴────────────┴─────────────────┘
```

---

## 10. Integracao com Arquitetura Existente

```
┌─────────────────────────────────────────────────────────────────────┐
│                      SDR JURIDICO - ARQUITETURA COMPLETA            │
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ DataJud  │  │ DOU Bot  │  │ Google   │  │ Teams    │           │
│  │ (CNJ)    │  │ (INLABS) │  │ Calendar │  │          │           │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘           │
│       │              │              │              │                 │
│       ▼              ▼              ▼              ▼                 │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │              EDGE FUNCTIONS (Deno Runtime)                │      │
│  │                                                           │      │
│  │  datajud-enhanced  dou-sync-cron    google-cal-sync      │      │
│  │  datajud-proxy     dou-search       google-cal-oauth     │      │
│  │                                     teams-create-event   │      │
│  │                                                           │      │
│  │  Padroes compartilhados:                                 │      │
│  │  - JWT validation     - Rate limiting                    │      │
│  │  - CORS headers       - Error logging                    │      │
│  │  - Retry com backoff  - Audit trail                      │      │
│  └─────────────────────────┬────────────────────────────────┘      │
│                             │                                       │
│  ┌─────────────────────────▼────────────────────────────────┐      │
│  │              POSTGRESQL (Supabase)                         │      │
│  │                                                           │      │
│  │  Tabelas de dominio:     Tabelas de integracao:          │      │
│  │  - casos                  - datajud_processos            │      │
│  │  - clientes               - datajud_movimentacoes        │      │
│  │  - leads                  - dou_publicacoes        ← NEW │      │
│  │  - documentos             - dou_termos_monitorados ← NEW │      │
│  │  - agendamentos           - dou_sync_logs          ← NEW │      │
│  │  - tarefas                - datajud_api_calls            │      │
│  │  - timeline_events        - datajud_sync_jobs            │      │
│  │  - notificacoes                                          │      │
│  │                                                           │      │
│  │  RLS: Tudo isolado por org_id                            │      │
│  │  Triggers: set_updated_at() em todas as tabelas          │      │
│  └─────────────────────────┬────────────────────────────────┘      │
│                             │                                       │
│  ┌─────────────────────────▼────────────────────────────────┐      │
│  │              FRONTEND (React 19 + TypeScript)             │      │
│  │                                                           │      │
│  │  Services:               Hooks:                          │      │
│  │  - datajudCaseService     - useDataJudSync               │      │
│  │  - douService       ← NEW - useDOU              ← NEW   │      │
│  │  - casosService           - useCasos                     │      │
│  │  - agendaService          - useAgenda                    │      │
│  │                                                           │      │
│  │  Shared infra:                                           │      │
│  │  - apiClient.ts (retry, timeout, error handling)         │      │
│  │  - supabaseClient.ts (auth, realtime)                    │      │
│  │  - errors.ts (AppError hierarchy)                        │      │
│  │  - retry.ts (backoff, jitter)                            │      │
│  │  - health.ts (service health monitoring)                 │      │
│  │  - orgScope.ts (multi-tenant cache)                      │      │
│  └──────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Fontes e Referencias

- INLABS (Imprensa Nacional): https://inlabs.in.gov.br/
- Repositorio INLABS: https://github.com/Imprensa-Nacional/inlabs
- Ro-DOU (ferramenta de clipping): https://gestaogovbr.github.io/Ro-dou/
- Base de dados abertos DOU: https://in.gov.br/acesso-a-informacao/dados-abertos/base-de-dados
- Consulta DOU: https://www.in.gov.br/consulta
