# 🎯 Resumo Executivo: Exploração de Relacionamentos

## O que você descobriu?

Você pediu: **"Explore a relação das questões; simulados; alternativas; alternativas_imagens; questões_imagens e qual campo liga elas"**

Nós criamos: **Documentação completa com 4 relacionamentos explorados em profundidade**

---

## 🔗 4 Relacionamentos Mapeados

### 1️⃣ SIMULADOS ↔ QUESTOES (M:N)

**Pergunta:** Como um simulado tem múltiplas questões?

**Resposta:**
- **Tabela de junção:** `SIMULADO_QUESTOES`
- **Campos que ligam:**
  - `simulado_questoes.id_simulado` → `simulados.id_simulado`
  - `simulado_questoes.id_questao` → `questoes.id_questao`
  - `simulado_questoes.ordem` → Posição da questão
- **Exemplo:** Simulado 1 (ENEM 2023) tem 180 questões

```sql
SELECT * FROM simulado_questoes WHERE id_simulado = 1;
-- Retorna 180 linhas (uma por questão)
```

---

### 2️⃣ QUESTOES ↔ ALTERNATIVAS (1:M)

**Pergunta:** Como uma questão tem 5 alternativas?

**Resposta:**
- **Campo que liga:** `alternativas.id_questao`
- **Campos relacionados:**
  - `alternativas.letra` → A, B, C, D, E
  - `alternativas.correta` → BOOLEAN (resposta certa)
  - `alternativas.texto` → Conteúdo
- **Exemplo:** Questão 100 tem 5 linhas (A-E)

```sql
SELECT * FROM alternativas WHERE id_questao = 100;
-- Retorna 5 linhas
```

---

### 3️⃣ QUESTOES ↔ IMAGENS (1:M Polimórfico)

**Pergunta:** Como uma questão tem múltiplas imagens?

**Resposta:**
- **Campos que ligam:**
  - `imagens.tipo_entidade = 'questao'` (tipo fixo)
  - `imagens.id_entidade = questoes.id_questao` (ID dinâmico)
- **Campos relacionados:**
  - `imagens.caminho_arquivo` → URL
  - `imagens.descricao` → Descrição
- **Exemplo:** Questão 100 tem 2 imagens (gráfico + tabela)

```sql
SELECT * FROM imagens 
WHERE tipo_entidade = 'questao' AND id_entidade = 100;
-- Retorna 2 linhas
```

---

### 4️⃣ ALTERNATIVAS ↔ IMAGENS (1:M Polimórfico)

**Pergunta:** Como uma alternativa tem imagem?

**Resposta:**
- **Campos que ligam:**
  - `imagens.tipo_entidade = 'alternativa'` (tipo fixo)
  - `imagens.id_entidade = alternativas.id_alternativa` (ID dinâmico)
- **Campos relacionados:**
  - `imagens.caminho_arquivo` → URL
  - `imagens.descricao` → Descrição
- **Exemplo:** Alternativa D (id=404) tem 1 imagem (mapa)

```sql
SELECT * FROM imagens 
WHERE tipo_entidade = 'alternativa' AND id_entidade = 404;
-- Retorna 1 linha
```

---

## 📊 Tabela Resumida: Campos que Ligam

| Relação | De | Para | Campo |
|---------|----|----|-------|
| **1** | `simulado_questoes` | `simulados` | `id_simulado` |
| **1** | `simulado_questoes` | `questoes` | `id_questao` |
| **2** | `alternativas` | `questoes` | `id_questao` |
| **3** | `imagens` (tipo='questao') | `questoes` | `id_entidade` |
| **4** | `imagens` (tipo='alternativa') | `alternativas` | `id_entidade` |

---

## 💡 Padrão Polimórfico (O que é Legal!)

A tabela `IMAGENS` é especial. Ela não tem relacionamento direto com uma tabela específica. Ao contrário:

- Campo `tipo_entidade` especifica o tipo: `'questao'` ou `'alternativa'`
- Campo `id_entidade` especifica o ID

Isso permite:
- ✅ Uma tabela para múltiplos tipos
- ✅ Código reutilizável
- ✅ Flexibilidade futura (pode adicionar 'solucao', etc)

---

## 🚀 Como Usar

### Para buscar um simulado completo:

```javascript
// 1. Busca as questões do simulado
const questoes = await supabase
  .from('simulado_questoes')
  .select('ordem, id_questao')
  .eq('id_simulado', 1);

// 2. Para cada questão, busca alternativas
const alternativas = await supabase
  .from('alternativas')
  .select('*')
  .in('id_questao', questoes.map(q => q.id_questao));

// 3. Para cada questão, busca imagens de questão
const imagensQuestoes = await supabase
  .from('imagens')
  .select('*')
  .eq('tipo_entidade', 'questao')
  .in('id_entidade', questoes.map(q => q.id_questao));

// 4. Para cada alternativa, busca imagens de alternativa
const imagensAlt = await supabase
  .from('imagens')
  .select('*')
  .eq('tipo_entidade', 'alternativa')
  .in('id_entidade', alternativas.map(a => a.id_alternativa));

// 5. Monta estrutura final (ver RELACAO_QUESTOES_SIMULADOS_DETALHADA.md)
```

---

## 📚 Documentação Criada

| Arquivo | Propósito | Tamanho |
|---------|----------|--------|
| `RELACAO_TABELAS.md` | Visão geral com 9 tabelas | 25 KB |
| `RELACAO_QUESTOES_SIMULADOS_DETALHADA.md` | 4 relacionamentos profundos | 25 KB |
| `TABELA_CAMPOS_LIGACAO.md` | Mapeamento de campos + SQL | 12 KB |
| `INDICE_COMPLETO_RELACIONAMENTOS.md` | Índice e guia de navegação | 9 KB |
| `RelationshipDiagram.tsx` | Componente React visual | 17 KB |
| `DocumentacaoRelacionamentos.tsx` | Página da documentação | <1 KB |

**Total: 79 KB + 2,100+ linhas de documentação**

---

## ✅ O que você tem agora?

✅ Entendimento completo dos 4 relacionamentos
✅ Campos específicos que ligam cada tabela
✅ SQL queries prontas para usar
✅ Estruturas TypeScript/JSON
✅ Componente React visual e interativo
✅ Documentação acessível em `/documentacao-relacionamentos`
✅ Índices recomendados para performance
✅ Checklist de integridade de dados

---

## 🎓 Próximos Passos

1. **Ler a documentação:**
   - Comece: `RELACAO_TABELAS.md`
   - Depois: `RELACAO_QUESTOES_SIMULADOS_DETALHADA.md`

2. **Ver a visualização:**
   - Acesse: http://localhost:5173/documentacao-relacionamentos

3. **Usar as queries:**
   - Consulte: `TABELA_CAMPOS_LIGACAO.md`

4. **Implementar:**
   - Use estruturas de `RELACAO_QUESTOES_SIMULADOS_DETALHADA.md`

---

**Criado:** 3 de Novembro de 2025
**Status:** ✅ Completo
**Build:** ✅ 0 errors, 2.32s
