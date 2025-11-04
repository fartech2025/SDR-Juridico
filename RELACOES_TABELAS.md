# 🗄️ Relações entre Tabelas - Banco de Dados ENEM

## 📊 Diagrama de Relações

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ESTRUTURA DO BANCO DE DADOS                     │
└─────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │  USUARIOS    │
                              │              │
                              │ - id_usuario │ (PK)
                              │ - nome       │
                              │ - email      │
                              │ - tipo       │
                              └──────┬───────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
        ┌──────────────────┐  ┌─────────────────┐   │
        │RESULTADOS_SIMUL. │  │RESULTADOS_QUES.│   │
        │                  │  │                 │   │
        │- id_resultado    │  │- id_resultado   │   │
        │- id_usuario (FK) │  │- id_usuario(FK) │   │
        │- id_simulado(FK) │  │- id_questao(FK) │   │
        │- data_inicio     │  │- alternativa    │   │
        │- data_fim        │  │- correta        │   │
        │- score           │  │- tempo_resposta │   │
        └────────┬─────────┘  └────────┬────────┘   │
                 │                     │             │
        ┌────────▼─────────────────────▼────┐       │
        │                                    │       │
        │                                    │       │
        ▼                                    ▼       │
    ┌──────────────┐              ┌──────────────┐  │
    │  SIMULADOS   │              │  QUESTOES    │◄─┘
    │              │              │              │
    │- id_simulado │ (PK)         │- id_questao  │ (PK)
    │- nome        │              │- enunciado   │
    │- descricao   │              │- disciplina  │
    │- data_criacao│              │- dificuldade │
    │- ativo       │              │- data_criacao│
    └──────┬───────┘              └──────┬───────┘
           │                             │
           │ (M:N)                       │
           │ via simulado_questoes       │ (1:M)
           │                             │
    ┌──────▼──────────────────────────────┘
    │
    │
    ▼
┌────────────────────┐
│SIMULADO_QUESTOES   │
│                    │
│- id_assoc. (PK)    │
│- id_simulado (FK)  │──────┐
│- id_questao  (FK)  │      │ Referencia
│- ordem             │      │
│- peso              │      │
└────────────────────┘      │
                            │
                    ┌───────┴─────────┐
                    │                 │
                    ▼                 ▼
        ┌──────────────────────┐  ┌─────────────┐
        │ QUESTOES_IMAGENS     │  │ ALTERNATIVAS│
        │                      │  │             │
        │- id_imagem       (PK)│  │- id_alt (PK)│
        │- id_questao (FK) ────┼─→│- id_quest(FK)
        │- url                 │  │- texto      │
        │- ordem               │  │- correta    │
        │- descricao           │  │- ordem      │
        └──────────────────────┘  └──────┬──────┘
                                         │
                                         ▼
                              ┌──────────────────────┐
                              │ALT_IMAGENS (opcional)│
                              │                      │
                              │- id_img          (PK)│
                              │- id_alternativa(FK)  │
                              │- url                 │
                              │- ordem               │
                              └──────────────────────┘
```

---

## 🔗 Relacionamentos Detalhados

### 1️⃣ **USUARIOS → RESULTADOS**
```
USUARIOS (1) ────M──── RESULTADOS_SIMULADOS
   └─ Um usuário pode ter múltiplos resultados de simulados

USUARIOS (1) ────M──── RESULTADOS_QUESTOES
   └─ Um usuário pode ter múltiplas respostas a questões
```

**Uso**: Rastrear quais usuários resolveram quais simulados

---

### 2️⃣ **SIMULADOS → QUESTOES (M:N)**
```
SIMULADOS (M) ────N──── QUESTOES
      └─ Via tabela: SIMULADO_QUESTOES

Um simulado tem múltiplas questões
Uma questão pode estar em múltiplos simulados
```

**Tabela de Junção**: `SIMULADO_QUESTOES`
- Armazena a relação M:N
- Mantém a ordem das questões
- Pode ter peso/pontuação por questão

---

### 3️⃣ **QUESTOES → IMAGENS**
```
QUESTOES (1) ────M──── QUESTOES_IMAGENS
   └─ Uma questão pode ter múltiplas imagens (enunciado, gráficos)
```

**Uso**: Armazenar fotos/gráficos de uma questão

---

### 4️⃣ **ALTERNATIVAS → IMAGENS**
```
ALTERNATIVAS (1) ────M──── ALT_IMAGENS
   └─ Uma alternativa pode ter múltiplas imagens
```

**Uso**: Armazenar fotos de alternativas (por exemplo, gráficos)

---

### 5️⃣ **QUESTOES → ALTERNATIVAS**
```
QUESTOES (1) ────M──── ALTERNATIVAS
   └─ Uma questão tem múltiplas alternativas (A, B, C, D, E)
```

**Uso**: Cada questão precisa de múltiplas opções de resposta

---

### 6️⃣ **RESULTADOS_QUESTOES → QUESTOES**
```
RESULTADOS_QUESTOES (M) ────1──── QUESTOES
   └─ Registra qual questão foi respondida
```

**Uso**: Rastrear respostas por questão

---

## 📈 Fluxo de Dados

### Cenário: Usuário Resolvendo um Simulado

```
1. Usuário clica "Iniciar Simulado"
   ↓
   Busca em: SIMULADOS (id=1)
   └─ Nome, descrição, data de criação

2. Sistema busca questões do simulado
   ↓
   Busca em: SIMULADO_QUESTOES (id_simulado=1)
   └─ Pega lista de id_questao e ordem

3. Para cada questão, busca dados
   ↓
   Busca em: QUESTOES (id_questao=X)
   └─ Enunciado, disciplina, dificuldade

4. Para cada questão, busca imagens
   ↓
   Busca em: QUESTOES_IMAGENS (id_questao=X)
   └─ URLs de imagens

5. Para cada questão, busca alternativas
   ↓
   Busca em: ALTERNATIVAS (id_questao=X)
   └─ Textos de alternativas A, B, C, D, E

6. Para cada alternativa, busca imagens (se houver)
   ↓
   Busca em: ALT_IMAGENS (id_alternativa=X)
   └─ URLs de imagens

7. Usuário responde uma questão
   ↓
   Insere em: RESULTADOS_QUESTOES
   └─ Registra: usuário, questão, resposta, tempo

8. Simulado finalizado
   ↓
   Insere em: RESULTADOS_SIMULADOS
   └─ Registra: usuário, simulado, score, tempo total

FIM ✅
```

---

## 🔑 Chaves Estrangeiras (Foreign Keys)

| De | Para | Campo |
|----|------|-------|
| RESULTADOS_SIMULADOS | USUARIOS | id_usuario |
| RESULTADOS_SIMULADOS | SIMULADOS | id_simulado |
| RESULTADOS_QUESTOES | USUARIOS | id_usuario |
| RESULTADOS_QUESTOES | QUESTOES | id_questao |
| SIMULADO_QUESTOES | SIMULADOS | id_simulado |
| SIMULADO_QUESTOES | QUESTOES | id_questao |
| QUESTOES_IMAGENS | QUESTOES | id_questao |
| ALTERNATIVAS | QUESTOES | id_questao |
| ALT_IMAGENS | ALTERNATIVAS | id_alternativa |

---

## 🎯 Padrões de Relacionamento

### 1️⃣ One-to-Many (1:M)
```
USUARIOS ────1────M──── RESULTADOS_SIMULADOS
   └─ Um usuário pode ter MUITOS resultados
```

### 2️⃣ Many-to-Many (M:N)
```
SIMULADOS ────M────N──── QUESTOES
              (via SIMULADO_QUESTOES)
   └─ Cada simulado tem MUITAS questões
   └─ Cada questão está em MUITOS simulados
```

### 3️⃣ One-to-One (1:1)
```
QUESTOES ────1────1──── ALT_IMAGENS (opcional)
   └─ Cada questão pode ter OPCIONALMENTE imagens
```

---

## 💾 Integridade Referencial

### Cascata de Deletação

```
Se deletar um SIMULADO:
└─ Automaticamente deleta SIMULADO_QUESTOES associadas
   └─ Mas NÃO deleta QUESTOES (podem estar em outros simulados)

Se deletar um USUARIO:
└─ Automaticamente deleta seus RESULTADOS_SIMULADOS
└─ Automaticamente deleta seus RESULTADOS_QUESTOES

Se deletar uma QUESTAO:
└─ Automaticamente deleta ALTERNATIVAS
└─ Automaticamente deleta QUESTOES_IMAGENS
└─ Automaticamente deleta SIMULADO_QUESTOES
└─ Automaticamente deleta RESULTADOS_QUESTOES
```

---

## 🔍 Queries Comuns

### Buscar todas as questões de um simulado

```sql
SELECT q.* FROM questoes q
INNER JOIN simulado_questoes sq ON q.id_questao = sq.id_questao
WHERE sq.id_simulado = 1
ORDER BY sq.ordem;
```

### Buscar todas as alternativas de uma questão

```sql
SELECT * FROM alternativas
WHERE id_questao = 5
ORDER BY ordem;
```

### Buscar resultados de um usuário

```sql
SELECT rs.*, s.nome as simulado_nome
FROM resultados_simulados rs
INNER JOIN simulados s ON rs.id_simulado = s.id_simulado
WHERE rs.id_usuario = 3
ORDER BY rs.data_inicio DESC;
```

### Buscar uma questão com todas suas imagens

```sql
SELECT q.*, array_agg(qi.url) as imagens
FROM questoes q
LEFT JOIN questoes_imagens qi ON q.id_questao = qi.id_questao
WHERE q.id_questao = 10
GROUP BY q.id_questao;
```

### Buscar simulado completo (com questões e alternativas)

```sql
SELECT 
  s.*,
  json_agg(json_build_object(
    'questao', q.*,
    'alternativas', (
      SELECT json_agg(a.*)
      FROM alternativas a
      WHERE a.id_questao = q.id_questao
    )
  )) as questoes
FROM simulados s
INNER JOIN simulado_questoes sq ON s.id_simulado = sq.id_simulado
INNER JOIN questoes q ON sq.id_questao = q.id_questao
WHERE s.id_simulado = 1
GROUP BY s.id_simulado;
```

---

## 📊 Estatísticas Possíveis

Com essas relações você pode:

✅ **Contar**
- Quantas questões tem um simulado
- Quantos simulados um usuário fez
- Qual a taxa de acerto por disciplina

✅ **Ranking**
- Usuários com melhor score
- Simulados mais resolvidos
- Questões mais acertadas

✅ **Análise**
- Tempo médio por questão
- Disciplinas mais difíceis
- Taxa de acerto por dificuldade

✅ **Rastreamento**
- Histórico de um usuário
- Evolução de performance
- Padrões de erro

---

## 🔐 RLS (Row Level Security)

Cada tabela tem políticas para:

```
USUARIOS:
├─ Usuário vê apenas seus dados
└─ Admin vê todos

SIMULADOS:
├─ Todos veem simulados ativos
└─ Admin vê todos

QUESTOES:
├─ Usuário vê questões de simulados que iniciou
└─ Admin vê todas

RESULTADOS_SIMULADOS:
├─ Usuário vê apenas seus resultados
└─ Admin vê todos

RESULTADOS_QUESTOES:
├─ Usuário vê apenas suas respostas
└─ Admin vê todas
```

---

## 🎯 Resumo de Interligações

| Tabela | Conecta com | Tipo | Descrição |
|--------|-------------|------|-----------|
| USUARIOS | RESULTADOS_SIMULADOS | 1:M | Usuário fez simulado |
| USUARIOS | RESULTADOS_QUESTOES | 1:M | Usuário respondeu questão |
| SIMULADOS | SIMULADO_QUESTOES | 1:M | Simulado tem questões |
| SIMULADOS | RESULTADOS_SIMULADOS | 1:M | Resultados de simulado |
| QUESTOES | SIMULADO_QUESTOES | 1:M | Questão em simulados |
| QUESTOES | ALTERNATIVAS | 1:M | Questão tem alternativas |
| QUESTOES | QUESTOES_IMAGENS | 1:M | Questão tem imagens |
| QUESTOES | RESULTADOS_QUESTOES | 1:M | Resultados de questão |
| ALTERNATIVAS | ALT_IMAGENS | 1:M | Alternativa tem imagens |

---

## 🚀 Caso de Uso Completo

### Criando um Simulado com Questões

```
1. Criar SIMULADO
   └─ INSERT INTO simulados VALUES (...)

2. Criar QUESTOES
   └─ INSERT INTO questoes VALUES (...)
   └─ INSERT INTO questoes VALUES (...)
   └─ INSERT INTO questoes VALUES (...)

3. Associar questões ao simulado
   └─ INSERT INTO simulado_questoes VALUES (1, 1, 1)
   └─ INSERT INTO simulado_questoes VALUES (1, 2, 2)
   └─ INSERT INTO simulado_questoes VALUES (1, 3, 3)

4. Criar ALTERNATIVAS para cada questão
   └─ INSERT INTO alternativas VALUES (1, 1, "alternativa A")
   └─ INSERT INTO alternativas VALUES (1, 2, "alternativa B")
   └─ ... (C, D, E)

5. Adicionar imagens (opcional)
   └─ INSERT INTO questoes_imagens VALUES (1, 1, "url_imagem")
   └─ INSERT INTO alt_imagens VALUES (1, 1, "url_imagem")

Simulado pronto! ✅
```

---

## 📞 Conclusão

O banco de dados ENEM tem uma estrutura bem organizada com:

✅ **9 tabelas** interligadas
✅ **Relacionamentos** 1:M e M:N
✅ **Integridade referencial** com cascata
✅ **RLS policies** para segurança
✅ **Suporte** a mídias (imagens)
✅ **Rastreamento** completo de atividades

Tudo conectado para criar uma **plataforma de aprendizado robusta**! 🚀
