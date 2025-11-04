# 🔧 INSTRUÇÕES: Executar Migrações para Tabela de Simulados

## ⚠️ Problema Identificado

Erro **404** ao carregar simulados:
```
Failed to load resource: the server responded with a status of 404
GET mskvucuaarutehslvhsp.supabase.co/rest/v1/simulados?...
```

**Causa:** Tabela `simulados` não existe no banco de dados.

---

## ✅ Solução: Executar Migrações

### 📋 Migrações Criadas

1. **`20251103_create_simulados_table.sql`** - Cria as tabelas
   - `simulados` - Armazena provas/exames
   - `simulado_questoes` - Relacionamento com questões
   - Índices, triggers, RLS, view

2. **`20251103_seed_simulados_teste.sql`** - Popula com dados de teste
   - 5 simulados de exemplo
   - Associação automática com questões

---

## 🚀 Como Executar

### **Opção 1: Usar Supabase CLI (Recomendado)**

```bash
# 1. Navegar até o diretório do projeto
cd /Users/fernandodias/Projeto-ENEM

# 2. Executar as migrações
npx supabase db push

# 3. Verificar se foi bem-sucedido
npx supabase db list

# 4. Verificar tabelas criadas
npx supabase db tables
```

**Resultado esperado:**
```
✅ Migrações aplicadas com sucesso
✅ Tabela 'simulados' criada
✅ Tabela 'simulado_questoes' criada
✅ View 'vw_simulados_com_questoes' criada
```

### **Opção 2: Executar manualmente no Supabase Console**

1. Abrir [Supabase Console](https://supabase.com/dashboard)
2. Selecionar projeto `Projeto-ENEM`
3. Ir para **SQL Editor**
4. Criar nova query e copiar conteúdo de:
   ```
   /Users/fernandodias/Projeto-ENEM/supabase/migrations/20251103_create_simulados_table.sql
   ```
5. Executar (Ctrl+Enter ou ⌘+Enter)
6. Repetir para `20251103_seed_simulados_teste.sql`

### **Opção 3: Executar via Supabase API (Python)**

```python
import subprocess

migrations = [
    "20251103_create_simulados_table.sql",
    "20251103_seed_simulados_teste.sql"
]

for migration in migrations:
    path = f"supabase/migrations/{migration}"
    result = subprocess.run(
        ["npx", "supabase", "db", "push", path],
        cwd="/Users/fernandodias/Projeto-ENEM",
        capture_output=True,
        text=True
    )
    print(f"✅ {migration}: {result.returncode == 0}")
```

---

## ✅ Verificação Pós-Migração

### 1. Verificar Tabelas Criadas

```sql
-- Verificar estrutura da tabela simulados
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('simulados', 'simulado_questoes');

-- Resultado esperado: 2 linhas
```

### 2. Verificar Dados Inseridos

```sql
-- Contar simulados
SELECT COUNT(*) as total_simulados FROM public.simulados;

-- Contar relacionamentos
SELECT COUNT(*) as total_questoes FROM public.simulado_questoes;

-- Listar simulados
SELECT * FROM public.simulados;

-- Resultado esperado: 5 simulados
```

### 3. Verificar View

```sql
-- Listar com contagem de questões
SELECT * FROM public.vw_simulados_com_questoes;

-- Resultado esperado: simulados com coluna total_questoes
```

### 4. Testar via API Supabase

```bash
# Testar se a API responde
curl -X GET "https://mskvucuaarutehslvhsp.supabase.co/rest/v1/simulados" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"

# Resultado esperado: 200 OK com lista de simulados (em JSON)
```

---

## 🌐 Testar no Navegador

### 1. Garantir que o servidor está rodando

```bash
npm run dev  # na pasta /app
```

### 2. Acessar a página

```
http://localhost:5173/painel-aluno
```

### 3. Verificar Console

Abrir DevTools (F12) e verificar:

✅ **Esperado:**
```
✓ Simulados carregados: 5
✓ Array com objetos: [{id_simulado: 1, nome: "ENEM 2023...", ...}]
✓ Sem erros 404
```

❌ **Se ainda houver erro:**
```
✗ Erro ao buscar simulados: 404
✗ Tabela ainda não existe
```

---

## 📊 Estrutura das Tabelas

### Tabela `simulados`

```sql
CREATE TABLE public.simulados (
  id_simulado BIGSERIAL PRIMARY KEY,           -- ID único
  nome TEXT NOT NULL UNIQUE,                   -- Nome do simulado
  descricao TEXT,                              -- Descrição
  data_criacao TIMESTAMP,                      -- Data de criação (auto)
  data_atualizacao TIMESTAMP,                  -- Data de atualização (auto)
  ativo BOOLEAN DEFAULT true                   -- Indica se está ativo
);
```

### Tabela `simulado_questoes`

```sql
CREATE TABLE public.simulado_questoes (
  id_simulado_questao BIGSERIAL PRIMARY KEY,   -- ID único
  id_simulado BIGINT,                          -- FK para simulados
  id_questao BIGINT,                           -- FK para questoes
  ordem SMALLINT,                              -- Ordem de aparição
  data_criacao TIMESTAMP,                      -- Data de criação (auto)
  UNIQUE(id_simulado, id_questao)              -- Evita duplicatas
);
```

### View `vw_simulados_com_questoes`

```sql
CREATE VIEW public.vw_simulados_com_questoes AS
SELECT 
  s.id_simulado,
  s.nome,
  s.descricao,
  COUNT(sq.id_simulado_questao) as total_questoes  -- ← Contagem
FROM simulados s
LEFT JOIN simulado_questoes sq
GROUP BY s.id_simulado, s.nome, s.descricao;
```

---

## 🔐 Row Level Security (RLS)

### Políticas Configuradas

```sql
-- Qualquer pessoa pode LER simulados ativos
CREATE POLICY "Leitura pública de simulados"
ON simulados FOR SELECT USING (ativo = true);

-- Apenas ADMIN pode ESCREVER
CREATE POLICY "Admin gerencia simulados"
ON simulados FOR ALL 
USING (papel = 'admin');
```

### Implicações

- ✅ Usuários podem ver simulados (SELECT)
- ✅ Usuários podem ver questões dos simulados (SELECT)
- ❌ Usuários não podem criar/editar simulados (INSERT/UPDATE)
- ✅ Admin pode fazer tudo (INSERT, UPDATE, DELETE)

---

## 🛠️ Troubleshooting

### Erro: "Table doesn't exist"

```
✗ Erro: "relation 'public.simulados' does not exist"
```

**Solução:**
- Verificar se migration foi executada
- Executar `npx supabase db push` novamente
- Verificar logs no Supabase Console

### Erro: "Permission denied"

```
✗ Erro: "new row violates row-level security policy"
```

**Solução:**
- Verificar RLS policies
- Garantir que usuário está autenticado
- Verificar se usuário tem role 'admin' para escrever

### Erro: "Foreign key violation"

```
✗ Erro: "insert or update on table 'simulado_questoes' violates foreign key"
```

**Solução:**
- Verificar se id_questao existe em tabela questoes
- Listar questões disponíveis: `SELECT COUNT(*) FROM questoes`
- Verificar migration seed

---

## ✅ Checklist de Implementação

- [ ] Executar `npx supabase db push`
- [ ] Verificar tabelas criadas no Supabase Console
- [ ] Verificar dados inseridos (5 simulados)
- [ ] Acessar `/painel-aluno` no navegador
- [ ] Verificar console (sem erros 404)
- [ ] Clicar em "Iniciar" em um simulado
- [ ] Verificar se funciona corretamente

---

## 📝 Próximos Passos

1. ✅ Executar migrações
2. ✅ Verificar dados no console SQL
3. ✅ Testar no navegador
4. ✅ Validar fluxo completo
5. 📤 Deploy em produção
6. 🔄 Monitorar erros

---

**Arquivo de Referência:**
- `supabase/migrations/20251103_create_simulados_table.sql`
- `supabase/migrations/20251103_seed_simulados_teste.sql`

**Status:** ✅ PRONTO PARA EXECUTAR MIGRAÇÕES
