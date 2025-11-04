# Sistema de Questões com Imagens - ENEM

## 📋 Visão Geral

Este sistema permite associar imagens a questões, alternativas e soluções do ENEM, criando uma experiência mais rica e visual para os alunos.

## 🏗️ Estrutura do Banco de Dados

### Tabela: `questoes_imagens`

```sql
CREATE TABLE public.questoes_imagens (
  id_imagem BIGSERIAL PRIMARY KEY,
  tipo_entidade VARCHAR(50) NOT NULL,  -- 'questao', 'alternativa', 'solucao'
  id_entidade BIGINT NOT NULL,         -- ID da questão, alternativa ou solução
  caminho_arquivo TEXT NOT NULL,       -- URL/caminho da imagem no Storage
  descricao TEXT,                      -- Campo livre: "imagem do enunciado", etc
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tipos de Entidade

- **questao**: Imagem do enunciado da questão
- **alternativa**: Imagem de uma alternativa específica
- **solucao**: Imagem da solução/passo-a-passo

## 🔍 Serviço: `questoesService.ts`

### Funções Disponíveis

#### Buscar Questões

```typescript
// Buscar todas as questões com imagens
const questoes = await buscarQuestoesComImagens();

// Buscar uma questão específica com imagens
const questao = await buscarQuestaoComImagens(id_questao);

// Buscar questões por tema
const questoesTema = await buscarQuestoesPorTemaPlusImagens('Matemática', 10);

// Buscar questões por dificuldade
const questoesDif = await buscarQuestoesPorDificuldadePlusImagens('Difícil', 5);
```

#### Gerenciar Imagens

```typescript
// Buscar imagens de uma entidade
const imagens = await buscarImagensPorEntidade('questao', 123);

// Inserir nova imagem
const novaImagem = await inserirImagemQuestao(
  'questao',
  123,
  'https://storage.url/imagem.png',
  'Imagem do enunciado'
);

// Atualizar imagem
const atualizada = await atualizarImagemQuestao(
  id_imagem,
  'https://novo.url/imagem.png',
  'Nova descrição'
);

// Deletar imagem
await deletarImagemQuestao(id_imagem);
```

#### Simulados

```typescript
// Buscar simulado com todas as questões e imagens
const simulado = await buscarSimuladoComQuestoes(id_simulado);

// Buscar todos os simulados disponíveis
const simulados = await buscarSimuladosDisponveis();
```

## 🎨 Componentes React

### `QuestaoRenderer`

Componente para exibir uma questão individual com suas imagens.

```typescript
import { QuestaoRenderer } from '../components/QuestaoRenderer';

function MinhaQuestao() {
  const handleResposta = (resposta: string) => {
    console.log(`Resposta selecionada: ${resposta}`);
  };

  return (
    <QuestaoRenderer 
      id_questao={123}
      onResposta={handleResposta}
    />
  );
}
```

**Props:**
- `id_questao: number` - ID da questão a exibir
- `onResposta?: (resposta: string) => void` - Callback quando resposta é selecionada

**Recursos:**
- ✅ Exibe enunciado com imagens
- ✅ Exibe alternativas com imagens
- ✅ Seleção visual de resposta
- ✅ Badges de tema, dificuldade e ano

### `SimuladoRenderer`

Componente para exibir um simulado completo com navegação.

```typescript
import { SimuladoRenderer } from '../components/QuestaoRenderer';

function MeuSimulado() {
  const handleCompleto = (respostas: RespostaUsuario[]) => {
    console.log('Simulado completo:', respostas);
  };

  return (
    <SimuladoRenderer 
      id_simulado={456}
      onSimuladoCompleto={handleCompleto}
    />
  );
}
```

**Props:**
- `id_simulado: number` - ID do simulado
- `onSimuladoCompleto?: (respostas: RespostaUsuario[]) => void` - Callback ao finalizar

**Recursos:**
- ✅ Navegação entre questões
- ✅ Botões numerados para ir direto
- ✅ Progress bar visual
- ✅ Contador de respondidas
- ✅ Botão "Finalizar" apenas quando respondida

## 📄 Página Exemplo: `ResolverSimuladoComImagens.tsx`

Página completa para resolver um simulado, incluindo:
- Integração com autenticação
- Cálculo de acertos
- Salvamento no banco de dados
- Feedback visual do resultado

```typescript
import ResolverSimulado from '../pages/ResolverSimuladoComImagens';

// Use em rotas
<Route path="/simulado/:id_simulado" element={<ResolverSimulado />} />
```

## 📊 Fluxo de Dados

```
┌─────────────────────┐
│   Página React      │
│  (ResolverSimulado) │
└──────────┬──────────┘
           │
           ├─► SimuladoRenderer
           │   └─► QuestaoRenderer × N
           │
           ├─► buscarSimuladoComQuestoes()
           │   └─► buscarQuestaoComImagens() × N
           │
           └─► Banco de Dados
               ├─► questoes
               ├─► questoes_imagens
               └─► respostas_usuarios

Resultado: Todas as imagens renderizadas inline
```

## 🚀 Deployment

### Passo 1: Executar Migração

```bash
# Execute a migração no Supabase
supabase db push supabase/migrations/20251103_create_questoes_imagens_table.sql
```

### Passo 2: Verificar Views

```sql
-- Verificar se as views foram criadas
SELECT * FROM information_schema.tables 
WHERE table_schema='public' AND table_name LIKE 'vw_questoes%';
```

### Passo 3: Popular Dados de Teste

```sql
-- Inserir imagens de teste
INSERT INTO questoes_imagens (tipo_entidade, id_entidade, caminho_arquivo, descricao)
VALUES 
  ('questao', 1, 'https://storage.url/questao1.png', 'Gráfico da questão 1'),
  ('alternativa', 1, 'https://storage.url/alt_a.png', 'Imagem alternativa A'),
  ('solucao', 1, 'https://storage.url/solucao1.png', 'Passo 1 da solução');
```

## 📝 SQL Útil

### Contar imagens por tipo

```sql
SELECT tipo_entidade, COUNT(*) 
FROM questoes_imagens 
GROUP BY tipo_entidade;
```

### Questões que têm imagens

```sql
SELECT DISTINCT q.id_questao, q.enunciado
FROM questoes q
INNER JOIN questoes_imagens qi ON qi.id_entidade = q.id_questao
WHERE qi.tipo_entidade = 'questao';
```

### Inserir imagens em massa

```sql
INSERT INTO questoes_imagens (tipo_entidade, id_entidade, caminho_arquivo, descricao)
SELECT 
  'questao',
  id_questao,
  'https://storage.url/' || id_questao || '.png',
  'Imagem renderizada da questão'
FROM questoes
WHERE id_questao > 0
AND id_questao NOT IN (
  SELECT id_entidade FROM questoes_imagens WHERE tipo_entidade = 'questao'
);
```

## 🔗 Integrações com Supabase Storage

### Upload de Imagens

```typescript
const uploadImagemQuestao = async (file: File, questaoId: number) => {
  const { data, error } = await supabase.storage
    .from('rendered-questions')
    .upload(`questoes/${questaoId}.png`, file);
  
  if (!error && data) {
    const { data: url } = supabase.storage
      .from('rendered-questions')
      .getPublicUrl(`questoes/${questaoId}.png`);
    
    await inserirImagemQuestao(
      'questao',
      questaoId,
      url.publicUrl,
      'Imagem renderizada'
    );
  }
};
```

## ⚠️ Considerações Importantes

1. **Performance**: Use índices nas buscas frequentes
2. **Cache**: Considere caching de questões/simulados populares
3. **Storage**: Otimize imagens antes de upload
4. **RLS**: Configure políticas de segurança apropriadas
5. **Validação**: Sempre valide URLs antes de renderizar

## 🐛 Troubleshooting

### Imagens não aparecem
- Verificar URL no Storage
- Validar permissões de acesso
- Usar console.error para debug

### Questões carregam devagar
- Implementar paginação
- Usar lazy loading para imagens
- Considerar materializar views

### Erros ao inserir imagens
- Verificar limites de tamanho
- Validar tipo de arquivo
- Conferir permissions do bucket

## 📚 Referências

- Documentação Supabase Storage: https://supabase.com/docs/guides/storage
- Views PostgreSQL: https://www.postgresql.org/docs/current/sql-createview.html
- React Lazy Loading: https://react.dev/reference/react/lazy
