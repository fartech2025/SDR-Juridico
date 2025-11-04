# 🔍 Relação Detalhada: Questões, Simulados, Alternativas e Imagens

## 📋 Sumário de Tabelas

| Tabela | Campos Chave | Propósito |
|--------|--------------|----------|
| `questoes` | `id_questao`, `id_tema`, `id_prova` | Armazena enunciados de questões |
| `alternativas` | `id_alternativa`, `id_questao`, `letra` | Armazena opções A-E para cada questão |
| `simulados` | `id_simulado`, `nome`, `ativo` | Agrupa questões em simulados |
| `simulado_questoes` | `id_simulado`, `id_questao`, `ordem` | Relaciona questões ao simulado (M:N) |
| `imagens` (ou `questoes_imagens`) | `id_imagem`, `tipo_entidade`, `id_entidade` | Imagens de questões e alternativas |
| `alternativas_imagens` | (embutido em `imagens`) | Imagens de alternativas específicas |
| `questoes_imagens` | (embutido em `imagens`) | Imagens de questões/enunciado |

---

## 🔗 Relacionamento 1: QUESTOES ↔ SIMULADO_QUESTOES ↔ SIMULADOS

### Estrutura

```
┌─────────────────┐
│    QUESTOES     │
│                 │
│ id_questao (PK) │ ◄─────┐
│ id_tema         │       │
│ id_prova        │       │ (1:M)
│ enunciado       │       │
│ dificuldade     │       │
│ tem_imagem      │       │
│ peso_dificuldade│       │
│ nr_questao      │       │
└─────────────────┘       │
                          │
                    ┌─────┴─────────┐
                    │               │
                    │     (M:N)     │
                    │   via tabela  │
                    │               │
        ┌───────────▼──────┐
        │SIMULADO_QUESTOES │
        │                  │
        │id_simulado_questao
        │id_simulado (FK)  ├──────────────────┐
        │id_questao (FK)   ├────────┐         │
        │ordem (SMALLINT)  │        │         │
        │data_criacao      │        │         │
        └──────────────────┘        │         │
                                    │         │
                        ┌───────────▼──┐     │
                        │               │     │
                        │               │     │
                    ┌───▼────────┐     │     │
                    │ SIMULADOS  │◄────┘     │
                    │            │           │
                    │id_simulado ├───────────┘
                    │nome        │
                    │descricao   │
                    │data_criacao│
                    │ativo       │
                    └────────────┘
```

### Campos que Ligam

| De | Para | Campo | Tipo | Referência |
|----|------|-------|------|-----------|
| `simulado_questoes` | `questoes` | `id_questao` | BIGINT | `questoes.id_questao` |
| `simulado_questoes` | `simulados` | `id_simulado` | BIGINT | `simulados.id_simulado` |

### SQL de Consulta

```sql
-- Buscar todas as questões de um simulado específico
SELECT 
  sq.ordem,
  q.id_questao,
  q.enunciado,
  q.dificuldade,
  q.tem_imagem,
  q.peso_dificuldade,
  q.nr_questao
FROM simulado_questoes sq
INNER JOIN questoes q ON sq.id_questao = q.id_questao
WHERE sq.id_simulado = 1
ORDER BY sq.ordem ASC;

-- Buscar simulado com contagem de questões
SELECT 
  s.id_simulado,
  s.nome,
  s.descricao,
  COUNT(sq.id_simulado_questao) as total_questoes
FROM simulados s
LEFT JOIN simulado_questoes sq ON s.id_simulado = sq.id_simulado
WHERE s.ativo = true
GROUP BY s.id_simulado
ORDER BY s.data_criacao DESC;

-- Buscar qual simulado tem uma questão específica
SELECT 
  s.id_simulado,
  s.nome,
  sq.ordem
FROM simulado_questoes sq
INNER JOIN simulados s ON sq.id_simulado = s.id_simulado
WHERE sq.id_questao = 42 AND s.ativo = true
ORDER BY s.data_criacao DESC;
```

---

## 🔗 Relacionamento 2: QUESTOES ↔ ALTERNATIVAS

### Estrutura

```
┌─────────────────────────────────────────┐
│           QUESTOES                      │
│                                         │
│ id_questao (PK)                         │ ◄─────┐
│ id_tema                                 │       │
│ id_prova                                │       │
│ enunciado                               │       │
│ dificuldade                             │       │
│ tem_imagem                              │       │
│ peso_dificuldade                        │       │ (1:M)
│ nr_questao                              │       │ Uma questão
└─────────────────────────────────────────┘       │ tem 5 alternativas
                                                   │ (A, B, C, D, E)
                                    ┌──────────────┘
                                    │
        ┌───────────────────────────▼─────────────────────────┐
        │           ALTERNATIVAS                              │
        │                                                     │
        │ id_alternativa (PK)                                 │
        │ id_questao (FK) ──────────┐ referencia QUESTOES    │
        │ letra (VARCHAR) ┐         │                         │
        │ texto (TEXT)    ├─ A,B,C  │                         │
        │ correta (BOOL)  │ D ou E  │                         │
        │ tem_imagem      │         │                         │
        └─────────────────┴─────────┘                         │
                                                              │
       Exemplos de uma questão com id_questao = 100:          │
       ┌─ id_alternativa: 401 | letra: A | correta: false   │
       ├─ id_alternativa: 402 | letra: B | correta: true    │
       ├─ id_alternativa: 403 | letra: C | correta: false   │
       ├─ id_alternativa: 404 | letra: D | correta: false   │
       └─ id_alternativa: 405 | letra: E | correta: false   │
```

### Campos que Ligam

| De | Para | Campo | Tipo | Referência |
|----|------|-------|------|-----------|
| `alternativas` | `questoes` | `id_questao` | BIGINT | `questoes.id_questao` |

### SQL de Consulta

```sql
-- Buscar todas as alternativas de uma questão
SELECT 
  id_alternativa,
  letra,
  texto,
  correta,
  tem_imagem
FROM alternativas
WHERE id_questao = 100
ORDER BY letra ASC;

-- Buscar a alternativa correta de uma questão
SELECT 
  letra,
  texto
FROM alternativas
WHERE id_questao = 100 AND correta = true;

-- Questão com todas as alternativas formatadas
SELECT 
  q.id_questao,
  q.enunciado,
  q.dificuldade,
  json_agg(
    json_build_object(
      'letra', a.letra,
      'texto', a.texto,
      'correta', a.correta
    ) ORDER BY a.letra
  ) as alternativas
FROM questoes q
LEFT JOIN alternativas a ON q.id_questao = a.id_questao
WHERE q.id_questao = 100
GROUP BY q.id_questao;
```

---

## 🖼️ Relacionamento 3: QUESTOES ↔ IMAGENS (questoes_imagens)

### Estrutura

```
┌──────────────────────────────────┐
│        QUESTOES                  │
│                                  │
│ id_questao (PK)                  │ ◄─────┐
│ enunciado                        │       │ (1:M)
│ ...                              │       │
└──────────────────────────────────┘       │ Questão pode ter
                                           │ múltiplas imagens
                                           │ (gráficos, fórmulas)
                    ┌──────────────────────┘
                    │
    ┌───────────────▼──────────────────────────┐
    │      QUESTOES_IMAGENS (ou IMAGENS)       │
    │                                          │
    │ id_imagem (PK)                           │
    │ tipo_entidade = 'questao' (CONST)        │
    │ id_entidade (FK) ──┐ referencia          │
    │ caminho_arquivo    ├─ questoes.id_questao
    │ descricao          │                     │
    │ created_at         │                     │
    │ updated_at         │                     │
    └────────────────────┴─────────────────────┘

Exemplo: Questão de Matemática com gráfico
    id_questao: 100
    enunciado: "Analise o gráfico..."
    
    ├─ id_imagem: 1001
    │  tipo_entidade: 'questao'
    │  id_entidade: 100
    │  caminho_arquivo: '/uploads/questoes/grafico_funcao.png'
    │
    └─ id_imagem: 1002
       tipo_entidade: 'questao'
       id_entidade: 100
       caminho_arquivo: '/uploads/questoes/tabela_dados.png'
```

### Campos que Ligam

| De | Para | Campo | Tipo | Relação |
|----|------|-------|------|---------|
| `imagens` | `questoes` | `id_entidade` | BIGINT | Quando `tipo_entidade = 'questao'` |
| `imagens` | - | `tipo_entidade` | VARCHAR | Valor: `'questao'` |

### SQL de Consulta

```sql
-- Buscar todas as imagens de uma questão
SELECT 
  id_imagem,
  caminho_arquivo,
  descricao
FROM imagens
WHERE tipo_entidade = 'questao' AND id_entidade = 100
ORDER BY created_at ASC;

-- Questão com todas suas imagens (JSON)
SELECT 
  q.id_questao,
  q.enunciado,
  json_agg(
    json_build_object(
      'id_imagem', i.id_imagem,
      'caminho_arquivo', i.caminho_arquivo,
      'descricao', i.descricao
    )
  ) FILTER (WHERE i.id_imagem IS NOT NULL) as imagens
FROM questoes q
LEFT JOIN imagens i ON i.tipo_entidade = 'questao' 
  AND i.id_entidade = q.id_questao
WHERE q.id_questao = 100
GROUP BY q.id_questao;
```

---

## 🖼️ Relacionamento 4: ALTERNATIVAS ↔ IMAGENS (alternativas_imagens)

### Estrutura

```
┌─────────────────────────────────┐
│      ALTERNATIVAS               │
│                                 │
│ id_alternativa (PK)             │ ◄─────┐
│ id_questao (FK)                 │       │ (1:M)
│ letra (A-E)                     │       │ Alternativa pode ter
│ texto                           │       │ múltiplas imagens
│ correta (BOOL)                  │       │
│ tem_imagem                      │       │
└─────────────────────────────────┘       │
                                          │
                    ┌─────────────────────┘
                    │
    ┌───────────────▼──────────────────────────┐
    │      IMAGENS (questoes_imagens)          │
    │                                          │
    │ id_imagem (PK)                           │
    │ tipo_entidade = 'alternativa' (CONST)    │
    │ id_entidade (FK) ──┐ referencia          │
    │ caminho_arquivo    ├─ alternativas.id_alt
    │ descricao          │                     │
    │ created_at         │                     │
    │ updated_at         │                     │
    └────────────────────┴─────────────────────┘

Exemplo: Questão de Geografia com mapa nas alternativas
    Questão 50 - Localizar capital
    
    ├─ Alternativa A (id: 450)
    │  texto: "Brasil"
    │  ├─ id_imagem: 5001
    │  │  tipo_entidade: 'alternativa'
    │  │  id_entidade: 450
    │  │  caminho_arquivo: '/uploads/alternativas/mapa_brasil.png'
    │
    ├─ Alternativa B (id: 451)
    │  texto: "Argentina"
    │  ├─ id_imagem: 5002
    │     tipo_entidade: 'alternativa'
    │     id_entidade: 451
    │     caminho_arquivo: '/uploads/alternativas/mapa_argentina.png'
    │
    ├─ Alternativa C (id: 452) - SEM IMAGEM
    │  texto: "Peru"
    │
    └─ Alternativa D (id: 453) - COM IMAGEM
       texto: "Colômbia"
       ├─ id_imagem: 5003
          tipo_entidade: 'alternativa'
          id_entidade: 453
          caminho_arquivo: '/uploads/alternativas/mapa_colombia.png'
```

### Campos que Ligam

| De | Para | Campo | Tipo | Relação |
|----|------|-------|------|---------|
| `imagens` | `alternativas` | `id_entidade` | BIGINT | Quando `tipo_entidade = 'alternativa'` |
| `imagens` | - | `tipo_entidade` | VARCHAR | Valor: `'alternativa'` |

### SQL de Consulta

```sql
-- Buscar imagens de uma alternativa específica
SELECT 
  id_imagem,
  caminho_arquivo,
  descricao
FROM imagens
WHERE tipo_entidade = 'alternativa' AND id_entidade = 450;

-- Alternativa com todas suas imagens
SELECT 
  a.id_alternativa,
  a.letra,
  a.texto,
  a.correta,
  json_agg(
    json_build_object(
      'id_imagem', i.id_imagem,
      'caminho_arquivo', i.caminho_arquivo
    )
  ) FILTER (WHERE i.id_imagem IS NOT NULL) as imagens
FROM alternativas a
LEFT JOIN imagens i ON i.tipo_entidade = 'alternativa'
  AND i.id_entidade = a.id_alternativa
WHERE a.id_questao = 100
GROUP BY a.id_alternativa
ORDER BY a.letra;
```

---

## 🔄 Fluxo Completo: Buscar Simulado com Todas as Relações

### 1️⃣ Usuário seleciona um simulado

```
SELECT 
  id_simulado,
  nome,
  descricao,
  ativo
FROM simulados
WHERE id_simulado = 5 AND ativo = true;
```

**Resultado:**
```
id_simulado: 5
nome: "ENEM 2023 - Simulado Completo"
descricao: "Simulado com 180 questões"
ativo: true
```

---

### 2️⃣ Buscar as questões do simulado

```
SELECT 
  sq.ordem,
  q.id_questao,
  q.enunciado,
  q.dificuldade,
  q.nr_questao
FROM simulado_questoes sq
INNER JOIN questoes q ON sq.id_questao = q.id_questao
WHERE sq.id_simulado = 5
ORDER BY sq.ordem;
```

**Resultado:**
```
ordem: 1    | id_questao: 100 | enunciado: "Qual é...?" | dificuldade: "Fácil"
ordem: 2    | id_questao: 102 | enunciado: "Explique..." | dificuldade: "Médio"
ordem: 3    | id_questao: 105 | enunciado: "Analise..." | dificuldade: "Difícil"
...
```

---

### 3️⃣ Para cada questão, buscar alternativas

```
SELECT 
  id_alternativa,
  letra,
  texto,
  correta,
  tem_imagem
FROM alternativas
WHERE id_questao IN (100, 102, 105, ...)
ORDER BY id_questao, letra;
```

**Resultado (para questão 100):**
```
id_alternativa: 401 | letra: A | texto: "Opção A" | correta: false | tem_imagem: false
id_alternativa: 402 | letra: B | texto: "Opção B" | correta: true  | tem_imagem: false
id_alternativa: 403 | letra: C | texto: "Opção C" | correta: false | tem_imagem: false
id_alternativa: 404 | letra: D | texto: "Opção D" | correta: false | tem_imagem: true
id_alternativa: 405 | letra: E | texto: "Opção E" | correta: false | tem_imagem: false
```

---

### 4️⃣ Buscar imagens da questão

```
SELECT 
  id_imagem,
  tipo_entidade,
  id_entidade,
  caminho_arquivo,
  descricao
FROM imagens
WHERE (tipo_entidade = 'questao' AND id_entidade = 100)
   OR (tipo_entidade = 'alternativa' AND id_entidade IN (401, 402, 403, 404, 405));
```

**Resultado:**
```
id_imagem: 1001 | tipo_entidade: 'questao'      | id_entidade: 100 | caminho_arquivo: '/img/q100_grafico.png'
id_imagem: 5004 | tipo_entidade: 'alternativa'  | id_entidade: 404 | caminho_arquivo: '/img/alt404_imagem.jpg'
```

---

### 5️⃣ Estrutura Final (TypeScript/JSON)

```typescript
{
  simulado: {
    id_simulado: 5,
    nome: "ENEM 2023 - Simulado Completo",
    descricao: "Simulado com 180 questões",
    ativo: true,
    questoes: [
      {
        ordem: 1,
        id_questao: 100,
        enunciado: "Qual é...?",
        dificuldade: "Fácil",
        tem_imagem: true,
        imagens: [
          {
            id_imagem: 1001,
            caminho_arquivo: "/img/q100_grafico.png",
            descricao: "Gráfico da questão"
          }
        ],
        alternativas: [
          {
            id_alternativa: 401,
            letra: "A",
            texto: "Opção A",
            correta: false,
            tem_imagem: false,
            imagens: []
          },
          {
            id_alternativa: 402,
            letra: "B",
            texto: "Opção B",
            correta: true,
            tem_imagem: false,
            imagens: []
          },
          {
            id_alternativa: 404,
            letra: "D",
            texto: "Opção D",
            correta: false,
            tem_imagem: true,
            imagens: [
              {
                id_imagem: 5004,
                caminho_arquivo: "/img/alt404_imagem.jpg",
                descricao: "Imagem da alternativa D"
              }
            ]
          },
          // ... C e E
        ]
      },
      // ... outras questões
    ]
  }
}
```

---

## 📊 Tabela de Relacionamentos Resumida

```
┌─────────────────────────────────────────────────────────────────┐
│              RELACIONAMENTOS ENTRE TABELAS                      │
└─────────────────────────────────────────────────────────────────┘

SIMULADOS
├─ (1:M) ─────────────────────────────────────> SIMULADO_QUESTOES
│                                               ├─ id_simulado (FK)
│                                               ├─ id_questao (FK)
│                                               └─ ordem
│
└─ Sem ligação direta com QUESTOES
   (Ligação é via SIMULADO_QUESTOES)

QUESTOES
├─ (1:M) ─────────────────────────────────────> ALTERNATIVAS
│                                               ├─ id_questao (FK)
│                                               ├─ letra (A-E)
│                                               └─ correta
│
├─ (1:M) ─────────────────────────────────────> IMAGENS
│                                               ├─ tipo_entidade = 'questao'
│                                               ├─ id_entidade = id_questao
│                                               └─ caminho_arquivo
│
└─ (M:N) ─────────────────────────────────────> SIMULADOS
   (via SIMULADO_QUESTOES)

ALTERNATIVAS
├─ (1:M) ─────────────────────────────────────> IMAGENS
│                                               ├─ tipo_entidade = 'alternativa'
│                                               ├─ id_entidade = id_alternativa
│                                               └─ caminho_arquivo
│
└─ (M:1) ─────────────────────────────────────> QUESTOES
                                                (id_questao FK)

IMAGENS (tabela genérica)
├─ Armazena imagens de:
│  ├─ questoes (tipo_entidade = 'questao')
│  ├─ alternativas (tipo_entidade = 'alternativa')
│  └─ solucoes (tipo_entidade = 'solucao')
│
└─ Índices: (tipo_entidade, id_entidade)
```

---

## 🔐 Constrangimentos (Constraints)

### Foreign Keys

```sql
-- SIMULADO_QUESTOES → SIMULADOS
ALTER TABLE simulado_questoes
ADD CONSTRAINT fk_sq_simulado FOREIGN KEY (id_simulado)
REFERENCES simulados(id_simulado) ON DELETE CASCADE;

-- SIMULADO_QUESTOES → QUESTOES
ALTER TABLE simulado_questoes
ADD CONSTRAINT fk_sq_questao FOREIGN KEY (id_questao)
REFERENCES questoes(id_questao) ON DELETE CASCADE;

-- ALTERNATIVAS → QUESTOES
ALTER TABLE alternativas
ADD CONSTRAINT fk_alt_questao FOREIGN KEY (id_questao)
REFERENCES questoes(id_questao) ON DELETE CASCADE;

-- IMAGENS → (polimórfico, sem FK direto)
-- Usa CHECK constraint para validação
ALTER TABLE imagens
ADD CONSTRAINT check_tipo_entidade 
CHECK (tipo_entidade IN ('questao', 'alternativa', 'solucao'));
```

### Unique Constraints

```sql
-- Evita duplicata questão no mesmo simulado
ALTER TABLE simulado_questoes
ADD CONSTRAINT uq_simulado_questao UNIQUE (id_simulado, id_questao);

-- Evita nome duplicado de simulado
ALTER TABLE simulados
ADD CONSTRAINT uq_simulado_nome UNIQUE (nome);
```

---

## 🎯 Casos de Uso Comuns

### ✅ Caso 1: Exibir simulado com todas as questões

**TypeScript/Service:**
```typescript
async function buscarSimuladoCompleto(id_simulado: number) {
  // 1. Busca simulado
  const simulado = await supabase
    .from('simulados')
    .select('*')
    .eq('id_simulado', id_simulado)
    .single();

  // 2. Busca questões do simulado
  const questoes = await supabase
    .from('simulado_questoes')
    .select('ordem, id_questao')
    .eq('id_simulado', id_simulado)
    .order('ordem');

  const questaoIds = questoes.map(q => q.id_questao);

  // 3. Busca todas as alternativas
  const alternativas = await supabase
    .from('alternativas')
    .select('*')
    .in('id_questao', questaoIds);

  // 4. Busca todas as imagens
  const imagens = await supabase
    .from('imagens')
    .select('*')
    .in('id_entidade', [...questaoIds, ...alternativasIds]);

  // 5. Monta estrutura final
  return construirEstrutura(simulado, questoes, alternativas, imagens);
}
```

---

### ✅ Caso 2: Adicionar questão a um simulado

**SQL:**
```sql
-- Inserir questão no simulado (próxima ordem)
INSERT INTO simulado_questoes (id_simulado, id_questao, ordem)
SELECT 
  1 as id_simulado,
  100 as id_questao,
  COALESCE(MAX(ordem), 0) + 1 as ordem
FROM simulado_questoes
WHERE id_simulado = 1;

-- Resultado: Questão 100 adicionada com ordem = 180 (próxima disponível)
```

---

### ✅ Caso 3: Remover questão de um simulado

**SQL:**
```sql
-- Deletar relação (questão permanece no banco)
DELETE FROM simulado_questoes
WHERE id_simulado = 1 AND id_questao = 100;

-- Reordenar questões restantes
WITH reordenado AS (
  SELECT 
    id_simulado_questao,
    ROW_NUMBER() OVER (ORDER BY ordem) as nova_ordem
  FROM simulado_questoes
  WHERE id_simulado = 1
)
UPDATE simulado_questoes sq
SET ordem = r.nova_ordem
FROM reordenado r
WHERE sq.id_simulado_questao = r.id_simulado_questao;
```

---

### ✅ Caso 4: Adicionar imagem a uma questão

**SQL:**
```sql
INSERT INTO imagens (tipo_entidade, id_entidade, caminho_arquivo, descricao)
VALUES ('questao', 100, '/uploads/q100_novo_grafico.png', 'Novo gráfico');

-- Atualizar flag tem_imagem na questão
UPDATE questoes SET tem_imagem = true WHERE id_questao = 100;
```

---

### ✅ Caso 5: Adicionar imagem a uma alternativa

**SQL:**
```sql
INSERT INTO imagens (tipo_entidade, id_entidade, caminho_arquivo, descricao)
VALUES ('alternativa', 404, '/uploads/alt404_nova.jpg', 'Mapa alternativa D');

-- Atualizar flag tem_imagem na alternativa
UPDATE alternativas SET tem_imagem = true WHERE id_alternativa = 404;
```

---

## 📈 Performance - Índices Recomendados

```sql
-- Índices existentes
CREATE INDEX idx_simulado_questoes_simulado ON simulado_questoes(id_simulado);
CREATE INDEX idx_simulado_questoes_questao ON simulado_questoes(id_questao);
CREATE INDEX idx_alternativas_questao ON alternativas(id_questao);
CREATE INDEX idx_imagens_tipo_id ON imagens(tipo_entidade, id_entidade);

-- Índices adicionais recomendados
CREATE INDEX idx_simulados_ativo ON simulados(ativo);
CREATE INDEX idx_alternativas_correta ON alternativas(id_questao, correta);
CREATE INDEX idx_imagens_entidade ON imagens(tipo_entidade);
CREATE INDEX idx_simulados_data ON simulados(data_criacao DESC);
```

---

## 🎓 Resumo Final

**Tabelas Interligadas:**

1. **SIMULADOS** ↔ **SIMULADO_QUESTOES** ↔ **QUESTOES**
   - Relacionamento M:N via tabela de junção
   - Campo chave: `id_simulado`, `id_questao`

2. **QUESTOES** ↔ **ALTERNATIVAS**
   - Relacionamento 1:M
   - Campo chave: `id_questao`

3. **QUESTOES** ↔ **IMAGENS**
   - Relacionamento 1:M (polimórfico)
   - Campo chave: `tipo_entidade = 'questao'` + `id_entidade`

4. **ALTERNATIVAS** ↔ **IMAGENS**
   - Relacionamento 1:M (polimórfico)
   - Campo chave: `tipo_entidade = 'alternativa'` + `id_entidade`

**Estrutura de Dados:**
- Uma questão tem 1 enunciado + múltiplas imagens
- Uma questão tem 5 alternativas (A-E)
- Cada alternativa pode ter múltiplas imagens
- Um simulado tem múltiplas questões
- Uma questão pode estar em múltiplos simulados

**Fluxo de Carregamento:**
Simulado → Questões → Alternativas + Imagens (Questões) + Imagens (Alternativas)
