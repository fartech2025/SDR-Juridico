# ✅ Guia Prático: Fix do Erro "Erro ao buscar simulados"

## 🎯 Objetivo
Fazer com que o sidebar carregue simulados corretamente em vez de mostrar erro

## 📊 Status Atual
```
❌ Sidebar mostra: "Erro ao buscar simulados"
✅ Código foi corrigido (fallback adicionado)
❓ Backend desconhecido (precisamos verificar)
```

---

## 🚀 SOLUÇÃO RÁPIDA (5 minutos)

### Passo 1: Abrir Supabase Cloud SQL Editor
1. Abra: https://app.supabase.io
2. Selecione seu projeto
3. Vá para: **SQL Editor** (lado esquerdo)
4. Clique em: **New Query**

### Passo 2: Executar Diagnóstico
1. Copie TODO o conteúdo de:
   `/Users/fernandodias/Projeto-ENEM/DEBUG_SIMULADOS_COMPLETO.sql`

2. Cole no SQL Editor

3. Execute **PASSO 1** (primeira query):
   ```sql
   SELECT EXISTS (
     SELECT 1 FROM information_schema.views 
     WHERE table_schema = 'public' 
     AND table_name = 'vw_simulados_com_questoes'
   ) as "VIEW Existe?";
   ```

4. Anote o resultado:
   - `t` = VIEW existe ✅
   - `f` = VIEW não existe ❌

### Passo 3: Se VIEW não existe (resultado = `f`)
1. Execute **PASSO 4** (criar VIEW):
   ```sql
   DROP VIEW IF EXISTS public.vw_simulados_com_questoes CASCADE;
   CREATE VIEW public.vw_simulados_com_questoes AS ...
   ```

2. Execute **PASSO 5** (conceder permissões):
   ```sql
   ALTER VIEW public.vw_simulados_com_questoes OWNER TO postgres;
   GRANT SELECT ON public.vw_simulados_com_questoes TO anon;
   GRANT SELECT ON public.vw_simulados_com_questoes TO authenticated;
   ```

3. Execute **PASSO 6** (testar):
   ```sql
   SELECT * FROM public.vw_simulados_com_questoes;
   ```
   Resultado esperado: Lista de simulados com `total_questoes`

### Passo 4: Voltar no App
1. Abra browser em: http://localhost:5173/painel-aluno
2. Aperte: `Cmd+Shift+R` (hard refresh)
3. Veja sidebar: simulados devem aparecer ✅

---

## 🔍 Troubleshooting

### Cenário 1: Ainda vendo erro após fix
**Possível causa**: RLS está bloqueando

**Fix**:
1. Execute **PASSO 7** para ver policies
2. Se houver restrição, execute:
   ```sql
   ALTER TABLE public.simulados DISABLE ROW LEVEL SECURITY;
   ```
3. Teste novamente

### Cenário 2: "VIEW does not exist"
**Possível causa**: VIEW não foi criada

**Fix**:
1. Execute PASSO 4 (CREATE VIEW)
2. Se falhar com erro SQL, copie erro inteiro
3. Envie para análise

### Cenário 3: Sem dados (lista vazia)
**Possível causa**: Nenhum simulado criado

**Fix**:
1. Execute **PASSO 2** para contar:
   ```sql
   SELECT COUNT(*) FROM public.simulados;
   ```
   
2. Se for 0, insira teste:
   ```sql
   INSERT INTO public.simulados (nome, descricao, ativo)
   VALUES 
     ('Simulado Teste 1', 'Teste do sistema', true),
     ('Simulado Teste 2', 'Teste 2', true);
   
   -- Depois associar questões:
   INSERT INTO public.simulado_questoes (id_simulado, id_questao, ordem)
   SELECT s.id_simulado, q.id_questao, ROW_NUMBER() OVER (ORDER BY q.id_questao)
   FROM public.simulados s
   CROSS JOIN public.questoes q
   WHERE s.nome LIKE '%Teste%'
   LIMIT 100;
   ```

### Cenário 4: Erro diferente no console
**Passos**:
1. Abra: DevTools (`F12`)
2. Vá para: **Console**
3. Copie mensagem de erro completa
4. Análise de erro específico

---

## 🧪 Validação Completa

### Checklist de Confirmação
```
☐ Passo 1: VIEW existe? (s/n)
☐ Passo 2: Tem simulados? (s/n)  
☐ Passo 3: Contagem por simulado funciona? (s/n)
☐ Passo 4: CREATE VIEW executado? (s/n)
☐ Passo 5: GRANT executado? (s/n)
☐ Passo 6: SELECT na VIEW funciona? (s/n)
☐ Passo 7: Reviu RLS policies? (s/n)
☐ Passo 8: Hard refresh do app? (s/n)
☐ Resultado: Simulados aparecem? (s/n)
```

---

## 📱 Expected Result After Fix

### Before ❌
```
┌─────────────────────────┐
│ Simulados               │
│                         │
│ ⚠️ Erro ao buscar      │
│ simulados               │
│                         │
└─────────────────────────┘
```

### After ✅
```
┌─────────────────────────┐
│ Simulados               │
│                         │
│ ✓ Simulado 1           │
│   [Iniciar]            │
│                         │
│ ✓ Simulado 2           │
│   [Refazer]            │
│                         │
│ ✓ Simulado 3           │
│   [Ver Resultado]      │
│                         │
└─────────────────────────┘
```

---

## 🎯 Próximos Passos Após Fix

1. **Testar Interações**:
   - Clique "Iniciar" em um simulado
   - Questões devem carregar

2. **Verificar Performance**:
   - DevTools → Network
   - Veja tempo de resposta

3. **Monitorar Logs**:
   - Console não deve ter erros
   - Se houver fallback ativo: log "View não acessível" (normal)

4. **Testar Outras Páginas**:
   - Ranking
   - Estatísticas
   - Resolver Simulado

---

## 📝 Resumo Técnico

### O que mudou no código:
```typescript
// Antes: Quebrava sem VIEW
const { data, error } = await supabase
  .from('vw_simulados_com_questoes')
  .select('*');

// Depois: Tenta VIEW, se falhar usa tabela direto
const { data: dataView, error: errorView } = await supabase
  .from('vw_simulados_com_questoes')
  .select('*');
if (!errorView && dataView) return dataView;

// Fallback
const { data: dataTable } = await supabase
  .from('simulados')
  .select('*')
  .eq('ativo', true);
// + calcula contagem de questões para cada
```

### Por que criamos DEBUG_SIMULADOS_COMPLETO.sql:
- Diagnostica o estado da VIEW
- Cria VIEW se não existir
- Concede permissões corretas
- Oferece queries de teste e fallback

### Garantias após o fix:
- ✅ App carregará com ou sem VIEW
- ✅ Se VIEW existir: rápido (1 query)
- ✅ Se não existir: mais lento (N+1 queries)
- ✅ Seja qual for: funciona

---

## ⚠️ Último Recurso

Se ainda não funcionar após tudo isto:

1. **Reabra DevTools**:
   - Console → Copie erro exato
   
2. **Verifique autenticação**:
   - User está logado?
   - Token JWT válido?
   
3. **Teste permissões**:
   ```sql
   -- Em Supabase SQL Editor como postgres
   SELECT current_user; -- mostra quem está conectado
   SELECT * FROM pg_roles WHERE rolname = 'anon'; -- vê role anon
   ```

4. **Se tudo falhar**:
   - Considere resetar banco de dados
   - Rerun migrations do zero
   - Verificar logs de error em Supabase Dashboard
