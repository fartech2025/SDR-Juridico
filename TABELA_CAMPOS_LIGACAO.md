# 📌 Tabela de Campos que Ligam as Relações

## 🎯 Mapeamento Rápido de Foreign Keys

```
╔════════════════════════════════════════════════════════════════════════════╗
║                    CAMPOS QUE LIGAM AS TABELAS                            ║
╚════════════════════════════════════════════════════════════════════════════╝
```

## 1️⃣ SIMULADO_QUESTOES (Tabela de Junção M:N)

| De | Para | Campo | Tipo | Descrição |
|----|----|-------|------|-----------|
| `simulado_questoes.id_simulado` (FK) | `simulados.id_simulado` (PK) | `id_simulado` | `BIGINT` | Qual simulado? |
| `simulado_questoes.id_questao` (FK) | `questoes.id_questao` (PK) | `id_questao` | `BIGINT` | Qual questão? |
| `simulado_questoes.ordem` | - | `ordem` | `SMALLINT` | Ordem da questão no simulado |

**Constraint Unique:** `(id_simulado, id_questao)` - Evita questão duplicada

---

## 2️⃣ ALTERNATIVAS

| De | Para | Campo | Tipo | Descrição |
|----|----|-------|------|-----------|
| `alternativas.id_questao` (FK) | `questoes.id_questao` (PK) | `id_questao` | `BIGINT` | Qual questão? |
| `alternativas.letra` | - | `letra` | `VARCHAR(1)` | Qual letra (A-E)? |
| `alternativas.correta` | - | `correta` | `BOOLEAN` | É a resposta correta? |

**Campos adicionais:** `texto`, `tem_imagem`

---

## 3️⃣ IMAGENS (Polimórfica)

### Para Questões:

| Campo | Tipo | Valor | Descrição |
|-------|------|-------|-----------|
| `tipo_entidade` | `VARCHAR(50)` | `'questao'` | Tipo fixo para questões |
| `id_entidade` | `BIGINT` | `= questoes.id_questao` | ID da questão |
| `caminho_arquivo` | `TEXT` | URL/path | Caminho da imagem |
| `descricao` | `TEXT` | texto | Descrição da imagem |

### Para Alternativas:

| Campo | Tipo | Valor | Descrição |
|-------|------|-------|-----------|
| `tipo_entidade` | `VARCHAR(50)` | `'alternativa'` | Tipo fixo para alternativas |
| `id_entidade` | `BIGINT` | `= alternativas.id_alternativa` | ID da alternativa |
| `caminho_arquivo` | `TEXT` | URL/path | Caminho da imagem |
| `descricao` | `TEXT` | texto | Descrição da imagem |

---

## 🔍 Queries de Exemplo por Tipo de Relação

### 🔗 Relação 1: Buscar Questões de um Simulado

```sql
-- SQL básico
SELECT q.*
FROM questoes q
INNER JOIN simulado_questoes sq ON q.id_questao = sq.id_questao
WHERE sq.id_simulado = 1
ORDER BY sq.ordem ASC;

-- Campos que ligam: 
--   • sq.id_simulado = 1 (filtro)
--   • sq.id_questao = q.id_questao (join)
```

---

### 🔗 Relação 2: Buscar Alternativas de uma Questão

```sql
-- SQL básico
SELECT a.*
FROM alternativas a
WHERE a.id_questao = 100
ORDER BY a.letra ASC;

-- Campo que liga:
--   • a.id_questao = 100 (filtro)
```

---

### 🔗 Relação 3: Buscar Imagens de uma Questão

```sql
-- SQL básico
SELECT i.*
FROM imagens i
WHERE i.tipo_entidade = 'questao' 
  AND i.id_entidade = 100;

-- Campos que ligam:
--   • i.tipo_entidade = 'questao' (filtro tipo)
--   • i.id_entidade = 100 (filtro id)
```

---

### 🔗 Relação 4: Buscar Imagens de uma Alternativa

```sql
-- SQL básico
SELECT i.*
FROM imagens i
WHERE i.tipo_entidade = 'alternativa' 
  AND i.id_entidade = 404;

-- Campos que ligam:
--   • i.tipo_entidade = 'alternativa' (filtro tipo)
--   • i.id_entidade = 404 (filtro id)
```

---

## 🎯 Fluxo Completo: Questão com Tudo

```sql
-- Buscar questão 100 com todas as alternativas e imagens

SELECT 
  -- Dados da questão
  q.id_questao,
  q.enunciado,
  q.dificuldade,
  
  -- Alternativas como JSON array
  json_agg(
    json_build_object(
      'id_alternativa', a.id_alternativa,
      'letra', a.letra,
      'texto', a.texto,
      'correta', a.correta,
      'imagens', (
        SELECT json_agg(
          json_build_object(
            'id_imagem', i.id_imagem,
            'caminho_arquivo', i.caminho_arquivo
          )
        )
        FROM imagens i
        WHERE i.tipo_entidade = 'alternativa'
          AND i.id_entidade = a.id_alternativa
      )
    )
  ) as alternativas,
  
  -- Imagens da questão como JSON array
  json_agg(
    json_build_object(
      'id_imagem', qi.id_imagem,
      'caminho_arquivo', qi.caminho_arquivo
    )
  ) FILTER (WHERE qi.id_imagem IS NOT NULL) as imagens_questao

FROM questoes q
LEFT JOIN alternativas a ON a.id_questao = q.id_questao
LEFT JOIN imagens qi ON qi.tipo_entidade = 'questao' 
                    AND qi.id_entidade = q.id_questao
WHERE q.id_questao = 100
GROUP BY q.id_questao, q.enunciado, q.dificuldade;

-- Campos que ligam:
--   1. a.id_questao = q.id_questao (alternativas para questão)
--   2. i.id_entidade = a.id_alternativa (imagens para alternativa)
--   3. qi.id_entidade = q.id_questao (imagens para questão)
--   4. qi.tipo_entidade = 'alternativa' (filtra tipo)
--   5. qi.tipo_entidade = 'questao' (filtra tipo)
```

---

## 📋 Resumo: Campos por Tipo de Ligação

### Foreign Keys Diretas (1:M)

| Tabela Filha | Campo FK | Tabela Pai | Campo PK |
|---|---|---|---|
| `alternativas` | `id_questao` | `questoes` | `id_questao` |
| `simulado_questoes` | `id_simulado` | `simulados` | `id_simulado` |
| `simulado_questoes` | `id_questao` | `questoes` | `id_questao` |

**Como usar:**
```sql
WHERE tabela_filha.id_questao = tabela_pai.id_questao
```

---

### Tabela Genérica (Polimórfica)

| Tipo | ID Campo | ID Valor | Exemplo |
|---|---|---|---|
| Questões | `tipo_entidade` | `'questao'` | `WHERE tipo_entidade = 'questao' AND id_entidade = 100` |
| Alternativas | `tipo_entidade` | `'alternativa'` | `WHERE tipo_entidade = 'alternativa' AND id_entidade = 404` |
| Soluções | `tipo_entidade` | `'solucao'` | `WHERE tipo_entidade = 'solucao' AND id_entidade = 999` |

**Como usar:**
```sql
WHERE tipo_entidade = 'alternativa' AND id_entidade = [id_alternativa]
```

---

## 🎓 Padrões de Ligação

### Padrão 1: Foreign Key Simples (1:M)

**Estrutura:**
```
Tabela Pai (PK)
      ↑
      │ (FK)
      │
Tabela Filha
```

**SQL:**
```sql
WHERE tabela_filha.fk_campo = tabela_pai.pk_campo
```

**Exemplo:**
```sql
SELECT * FROM alternativas 
WHERE id_questao = 100;
```

---

### Padrão 2: Tabela de Junção (M:N)

**Estrutura:**
```
Tabela A (PK)          Tabela B (PK)
      ↑                      ↑
      │ (FK1)         (FK2) │
      └──────────┬──────────┘
         Tabela Junção
```

**SQL:**
```sql
SELECT * FROM tabela_a a
INNER JOIN tabela_junção tj ON a.pk = tj.fk1
INNER JOIN tabela_b b ON b.pk = tj.fk2
WHERE a.pk = 1;
```

**Exemplo:**
```sql
SELECT * FROM questoes q
INNER JOIN simulado_questoes sq ON q.id_questao = sq.id_questao
WHERE sq.id_simulado = 1;
```

---

### Padrão 3: Tabela Genérica (Polimórfica)

**Estrutura:**
```
Tabela A
      │ (tipo = 'tipo_a', id = id_a)
      ↓
    Genérica ← (id_entidade, tipo_entidade)
      ↑
      │ (tipo = 'tipo_b', id = id_b)
Tabela B
```

**SQL:**
```sql
WHERE tipo_entidade = 'tipo_a' AND id_entidade = [id_a]
```

**Exemplo:**
```sql
SELECT * FROM imagens 
WHERE tipo_entidade = 'questao' AND id_entidade = 100;
```

---

## ⚡ Performance: Índices Essenciais

```sql
-- Para Relação 1: Simulado → Questões
CREATE INDEX idx_simulado_questoes_simulado 
  ON simulado_questoes(id_simulado);
CREATE INDEX idx_simulado_questoes_questao 
  ON simulado_questoes(id_questao);

-- Para Relação 2: Questão → Alternativas
CREATE INDEX idx_alternativas_questao 
  ON alternativas(id_questao);

-- Para Relação 3 e 4: Imagens Genérica
CREATE INDEX idx_imagens_tipo_id 
  ON imagens(tipo_entidade, id_entidade);
CREATE INDEX idx_imagens_tipo 
  ON imagens(tipo_entidade);
CREATE INDEX idx_imagens_id 
  ON imagens(id_entidade);
```

---

## ✅ Checklist: Verificar Integridade Referencial

```sql
-- 1. Verificar simulado_questoes órfãs (questão deletada)
SELECT * FROM simulado_questoes sq
WHERE NOT EXISTS (SELECT 1 FROM questoes q WHERE q.id_questao = sq.id_questao);

-- 2. Verificar alternativas órfãs (questão deletada)
SELECT * FROM alternativas a
WHERE NOT EXISTS (SELECT 1 FROM questoes q WHERE q.id_questao = a.id_questao);

-- 3. Verificar imagens órfãs (entidade deletada)
SELECT * FROM imagens i
WHERE tipo_entidade = 'questao' 
  AND NOT EXISTS (SELECT 1 FROM questoes q WHERE q.id_questao = i.id_entidade);

SELECT * FROM imagens i
WHERE tipo_entidade = 'alternativa' 
  AND NOT EXISTS (SELECT 1 FROM alternativas a WHERE a.id_alternativa = i.id_entidade);

-- 4. Verificar simulado_questoes órfãs (simulado deletado)
SELECT * FROM simulado_questoes sq
WHERE NOT EXISTS (SELECT 1 FROM simulados s WHERE s.id_simulado = sq.id_simulado);
```

---

## 🎯 Resumo Final

**4 Tipos de Ligação:**

| # | Nome | Tipo | Exemplo | Campo |
|---|------|------|---------|-------|
| 1 | Simulado → Questões | M:N | 1 simulado, 180 questões | `id_simulado`, `id_questao` |
| 2 | Questão → Alternativas | 1:M | 1 questão, 5 alternativas | `id_questao` |
| 3 | Questão → Imagens | 1:M | 1 questão, 2 imagens | `tipo='questao'`, `id_entidade` |
| 4 | Alternativa → Imagens | 1:M | 1 alternativa, 1 imagem | `tipo='alternativa'`, `id_entidade` |

**Principais Campos:**
- `id_simulado` - Liga simulado à questão
- `id_questao` - Liga questão às alternativas
- `id_alternativa` - Identifica a alternativa
- `tipo_entidade` + `id_entidade` - Liga imagens genericamente
