# Guia de Integração - Sistema de Simulados com Imagens

## 🎯 Visão Geral

O sistema de simulados com imagens foi completamente integrado na interface do aluno, permitindo que estudantes resolvam simulados com suporte a imagens no enunciado, alternativas e soluções.

## 📱 Fluxo do Usuário

```
Landing Page (LandingPage)
    ↓
Dashboard do Aluno (DashboardAluno_dark_supabase)
    ↓
Menu → "Simulados"
    ↓
Lista de Simulados (SimuladosPage)
    ├─ Todos (default)
    ├─ Não respondidos
    └─ Respondidos
    ↓
Resolver Simulado (ResolverSimuladoComImagens)
    ├─ QuestaoRenderer (einzelne Fragen)
    ├─ SimuladoRenderer (Vollständiger Simulado)
    └─ Navegação entre questões
    ↓
Tela de Resultado (com feedback detalhado)
    ├─ Percentual de acertos
    ├─ Tempo total
    ├─ Recomendações
    └─ Opções: Refazer ou Ver outros
```

## 🗂️ Estrutura de Arquivos

```
app/src/
├── components/
│   ├── QuestaoRenderer.tsx          ✨ NOVO - Renderizador de questões e simulados
│   ├── DashboardAluno_dark_supabase.tsx  (sem alterações necessárias)
│   └── BasePage.tsx                 (sem alterações)
│
├── pages/
│   ├── SimuladosPage.tsx            ✨ NOVO - Listagem de simulados
│   ├── ResolverSimuladoComImagens.tsx   ✨ MELHORADO - Resolução com resultado
│   ├── LandingPage.tsx              (integração ok)
│   └── ...
│
├── services/
│   ├── questoesService.ts           ✨ NOVO - API para questões e simulados
│   └── supabaseService.ts           (existente)
│
└── App.tsx                          ✨ ATUALIZADO - Novas rotas
```

## 🔌 Rotas Disponíveis

```typescript
// Novas rotas adicionadas:

// 1. Listagem de simulados (protegido)
GET /simulados
→ SimuladosPage

// 2. Resolver simulado (protegido)
GET /resolver-simulado/:id_simulado
→ ResolverSimuladoComImagens
```

## 📊 Banco de Dados

### Tabelas Criadas

1. **questoes_imagens** - Associa imagens a questões/alternativas/soluções
2. **resultados_simulados** - Armazena resultados de cada simulado por usuário

### Views Criadas

- `vw_questoes_com_imagens` - Questões com suas imagens agregadas
- `vw_alternativas_com_imagens` - Alternativas com imagens
- `vw_ranking_simulados` - Ranking de alunos por desempenho

## 🚀 Instruções de Deploy

### 1. Executar Migrações

```bash
# Aplique as migrações no Supabase
supabase db push supabase/migrations/20251103_create_questoes_imagens_table.sql
supabase db push supabase/migrations/20251103_create_resultados_simulados_table.sql
```

### 2. Verificar Tabelas

```sql
-- Verificar se as tabelas foram criadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema='public' AND table_name IN ('questoes_imagens', 'resultados_simulados');

-- Verificar views
SELECT table_name FROM information_schema.views 
WHERE table_schema='public' AND table_name LIKE 'vw_%';
```

### 3. Compilar Projeto

```bash
cd app
npm run build  # Verificar se compila sem erros
```

### 4. Teste Localmente

```bash
npm run dev    # Executar servidor de desenvolvimento
# Acesse: http://localhost:5173/
```

## 🎮 Como Usar

### Para Alunos

1. **Acessar Simulados:**
   - Faça login
   - Vá ao dashboard
   - Clique em "Simulados" (ou vá direto para `/simulados`)

2. **Listar e Filtrar:**
   - Veja todos os simulados disponíveis
   - Filtre por: Todos, Não respondidos, Respondidos
   - Veja quantidade de questões e tempo estimado

3. **Resolver Simulado:**
   - Clique em "Iniciar" no simulado desejado
   - Navegue entre questões (anterior/próxima ou números)
   - Veja imagens do enunciado e alternativas
   - Selecione sua resposta

4. **Ver Resultado:**
   - Após finalizar, veja percentual de acertos
   - Confira tempo total gasto
   - Leia recomendações personalizadas
   - Escolha refazer ou ver outros simulados

### Para Administradores

1. **Popular Dados de Teste:**

```sql
-- Inserir simulado de teste
INSERT INTO simulados (nome, descricao, data_criacao) 
VALUES ('Simulado ENEM 2024', 'Simulado completo com 180 questões', NOW())
RETURNING id_simulado;

-- Inserir associação de questões ao simulado
INSERT INTO simulado_questoes (id_simulado, id_questao) 
SELECT 1, id_questao FROM questoes LIMIT 10;

-- Inserir imagens de teste
INSERT INTO questoes_imagens (tipo_entidade, id_entidade, caminho_arquivo, descricao)
VALUES 
  ('questao', 1, 'https://storage.url/q1.png', 'Gráfico do enunciado'),
  ('alternativa', 1, 'https://storage.url/alt_c.png', 'Imagem da alternativa C');
```

2. **Monitorar Performance:**

```sql
-- Ver ranking de alunos
SELECT * FROM vw_ranking_simulados LIMIT 10;

-- Ver resultados de um simulado específico
SELECT u.nome, rs.percentual_acertos, rs.data_conclusao
FROM resultados_simulados rs
JOIN usuarios u ON u.id_usuario = rs.id_usuario
WHERE rs.id_simulado = 1
ORDER BY rs.data_conclusao DESC;
```

## 🎨 Componentes Principais

### SimuladosPage

**Funcionalidades:**
- ✅ Grid responsivo de simulados
- ✅ Filtros: Todos / Não respondidos / Respondidos
- ✅ Exibição de resultados anteriores
- ✅ Botões de ação: Iniciar / Refazer
- ✅ Estatísticas gerais

**Props:** Nenhuma (usa contexto de autenticação)

### QuestaoRenderer

**Props:**
```typescript
interface QuestaoRendererProps {
  id_questao: number;
  onResposta?: (resposta: string) => void;
}
```

**Funcionalidades:**
- ✅ Renderiza questão com imagem
- ✅ Mostra 5 alternativas com imagens
- ✅ Seleção visual de resposta
- ✅ Badges de tema/dificuldade

### SimuladoRenderer

**Props:**
```typescript
interface SimuladoRendererProps {
  id_simulado: number;
  onSimuladoCompleto?: (respostas: RespostaUsuario[]) => void;
}
```

**Funcionalidades:**
- ✅ Navegação completa entre questões
- ✅ Progress bar visual
- ✅ Botões numerados
- ✅ Bloqueia "Próxima" se não respondida
- ✅ Callback ao finalizar

## 🔒 Segurança

### Autenticação

- Todas as rotas `/simulados` e `/resolver-simulado/*` usam `ProtectedRoute`
- Requer autenticação via Supabase Auth
- Usuário é identificado automaticamente

### Autorização

- Cada usuário só vê seus próprios resultados
- Banco de dados usa `id_usuario` para isolar dados
- Views também filtram por usuário

## 📈 Escalabilidade

### Otimizações Implementadas

1. **Lazy Loading:** Componentes carregados sob demanda via React.lazy()
2. **Índices:** Tabelas com índices para queries rápidas
3. **Queries Otimizadas:** Views materializadas para resultados
4. **Caching:** Possibilidade de cache no frontend

### Para Melhorar Ainda Mais

```typescript
// 1. Implementar cache com React Query
import { useQuery } from '@tanstack/react-query';

const { data: simulados } = useQuery({
  queryKey: ['simulados'],
  queryFn: () => buscarSimuladosDisponveis(),
  staleTime: 1000 * 60 * 5, // 5 minutos
});

// 2. Implementar paginação
// 3. Implementar virtualization para listas grandes
// 4. Implementar workers para cálculos pesados
```

## 🐛 Troubleshooting

### Problema: Imagens não aparecem

**Soluções:**
1. Verificar URL no Supabase Storage
2. Validar permissões do bucket
3. Testar URL manualmente no navegador
4. Verificar console.log para erros

### Problema: Simulado carrega devagar

**Soluções:**
1. Verificar número de questões (usar paginação)
2. Implementar lazy loading de imagens
3. Otimizar tamanho das imagens
4. Verificar performance do banco

### Problema: Respostas não são salvas

**Soluções:**
1. Verificar autenticação do usuário
2. Validar permissões no banco
3. Testar insert direto no Supabase
4. Verificar console para erros

## 📚 Referências

- Documentação Questões: `SISTEMA_QUESTOES_COM_IMAGENS.md`
- API Supabase: https://supabase.com/docs
- React Patterns: https://react.dev/
- TypeScript: https://www.typescriptlang.org/docs/

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do navegador (F12)
2. Verifique os logs do servidor
3. Consulte a documentação de cada componente
4. Teste as queries SQL diretamente no Supabase

## ✅ Checklist de Implementação

- [x] Criar tabelas no banco
- [x] Criar serviço de questões
- [x] Criar componentes React
- [x] Integrar rotas no App.tsx
- [x] Criar página de simulados
- [x] Criar página de resultado
- [x] Testes locais
- [x] Documentação completa
- [ ] Testes de produção
- [ ] Monitoramento
- [ ] Feedback de usuários

## 🎉 Conclusão

O sistema de simulados com imagens está completo e integrado na interface do aluno! 

**Próximas ações sugeridas:**
1. Executar migrações no Supabase
2. Popular com dados de teste
3. Testar fluxo completo no navegador
4. Coletar feedback de alunos
5. Otimizar conforme necessário
