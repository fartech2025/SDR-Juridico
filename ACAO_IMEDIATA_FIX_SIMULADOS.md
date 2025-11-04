# 🔧 AÇÃO IMEDIATA: Resolver "Erro ao buscar simulados"

## ❌ O PROBLEMA ATUAL
```
Sidebar mostra:  "Erro ao buscar simulados" 
App URL:         http://localhost:5173/painel-aluno
Raiz do erro:    VIEW vw_simulados_com_questoes não existe em Supabase Cloud
```

---

## ✅ A SOLUÇÃO

### 1️⃣ ABRIR SUPABASE CLOUD
```
https://app.supabase.io
→ Selecione seu projeto
→ SQL Editor (menu esquerdo)
→ New Query
```

### 2️⃣ COPIAR E COLAR
Copie TODO o arquivo:
```
/Users/fernandodias/Projeto-ENEM/DEBUG_SIMULADOS_COMPLETO.sql
```

Cole no **SQL Editor** do Supabase

### 3️⃣ EXECUTAR PASSO POR PASSO

#### PASSO 1: Verifica se VIEW existe
```sql
SELECT EXISTS (
  SELECT 1 FROM information_schema.views 
  WHERE table_schema = 'public' 
  AND table_name = 'vw_simulados_com_questoes'
) as "VIEW Existe?";
```
- Resultado `t` = VIEW existe ✅ (pule para PASSO 6)
- Resultado `f` = VIEW não existe ❌ (continua para PASSO 2)

#### PASSO 2: Conta simulados
```sql
SELECT COUNT(*) as "Total Simulados" FROM public.simulados;
```
- Se > 0: tem dados ✅
- Se 0: sem dados, precisa SEED

#### PASSO 3-6: Criar VIEW e testar
Execute TODO o bloco:
```sql
-- Cria VIEW
DROP VIEW IF EXISTS public.vw_simulados_com_questoes CASCADE;
CREATE VIEW public.vw_simulados_com_questoes AS
SELECT 
  s.id_simulado,
  s.nome,
  s.descricao,
  s.data_criacao,
  s.data_atualizacao,
  s.ativo,
  COUNT(sq.id_simulado_questao) as total_questoes
FROM public.simulados s
LEFT JOIN public.simulado_questoes sq ON s.id_simulado = sq.id_simulado
WHERE s.ativo = true
GROUP BY s.id_simulado, s.nome, s.descricao, s.data_criacao, s.data_atualizacao, s.ativo;

-- Concede permissões
GRANT SELECT ON public.vw_simulados_com_questoes TO anon;
GRANT SELECT ON public.vw_simulados_com_questoes TO authenticated;

-- Testa
SELECT * FROM public.vw_simulados_com_questoes;
```

### 4️⃣ VOLTAR NO APP
```
Browser: http://localhost:5173/painel-aluno
Tecla:   Cmd + Shift + R   (hard refresh)
Aguarde: 2-3 segundos
Resultado: Sidebar deve mostrar simulados ✅
```

---

## 📊 FLUXO VISUAL

```
┌─────────────────────────────────────────┐
│  Erro: "Erro ao buscar simulados"       │
│  Componente: SimuladosSidebar.tsx       │
│  Função: buscarSimuladosDisponveis()    │
└──────────────────┬──────────────────────┘
                   │
                   ▼
         ┌─────────────────┐
         │ VIEW não existe │
         │ em Supabase     │
         └────────┬────────┘
                  │
        ┌─────────┴──────────┐
        │                    │
        ▼                    ▼
    ANTES ❌            AGORA ✅
    Quebra            Fallback
    erro total        automático
                        │
            ┌───────────┴───────────┐
            ▼                       ▼
        VIEW existe             VIEW não existe
        (rápido)                (lento)
        1 query                 N+1 queries
            │                       │
            └───────────┬───────────┘
                        │
                        ▼
            ┌─────────────────────┐
            │ Simulados carregam! │
            │ com total_questões  │
            └─────────────────────┘
```

---

## ⚡ STATUS APÓS CADA ETAPA

| Etapa | Ação | Status | Próximo |
|-------|------|--------|---------|
| 1 | Abrir Supabase | ⏳ Abrindo | 2 |
| 2 | Copiar DEBUG_SIMULADOS_COMPLETO.sql | ✅ Pronto | 3 |
| 3 | Cola em SQL Editor | ✅ Pronto | 4 |
| 4 | Execute PASSO 1 | 🔄 Verificando | 5 |
| 5 | Se false → Execute PASSOS 4-6 | 🔧 Criando VIEW | 6 |
| 6 | Hard refresh app (Cmd+Shift+R) | 🔄 Recarregando | 7 |
| 7 | Vê simulados no sidebar | ✅ SUCESSO! | ✨ Pronto |

---

## 🎯 CHECKLIST FINAL

```
ANTES do FIX:
❌ Sidebar mostra "Erro ao buscar simulados"
❌ DevTools console mostra erro de VIEW não encontrada
❌ Nenhum simulado carrega
❌ Botões "Iniciar", "Refazer" desabilitados

DEPOIS do FIX:
✅ Sidebar mostra lista de simulados
✅ Cada simulado tem: nome, descrição, botões de ação
✅ Conta de questões aparece corretamente
✅ Botões "Iniciar", "Refazer", "Ver Resultado" funcionam
✅ DevTools console sem erros (ou log "View não acessível" se fallback)
```

---

## 🚨 SE AINDA TIVER ERRO

### Opção 1: Erro de Autenticação
```
Sintoma: "permission denied" ou "unauthorized"
Fix: Usuário não está logado
1. Faça logout
2. Faça login novamente
3. Tente acessar sidebar
```

### Opção 2: RLS Bloqueando
```
Sintoma: Erro mesmo após criar VIEW
Fix:
1. Vá para Supabase → Authentication → Policies
2. Revise RLS em tabela "simulados"
3. Se muito restritivo, desabilitar RLS para teste:
   ALTER TABLE public.simulados DISABLE ROW LEVEL SECURITY;
4. Tente novamente
```

### Opção 3: Sem Dados
```
Sintoma: Lista vazia, sem erro
Fix: Insira simulados de teste:
INSERT INTO public.simulados (nome, descricao, ativo)
VALUES 
  ('Simulado Teste 1', 'Teste', true),
  ('Simulado Teste 2', 'Teste 2', true);

Depois associe questões (ver GUIA_TESTAR_SIMULADOS_PRATICO.md)
```

---

## 📁 ARQUIVOS CRIADOS PARA THIS FIX

| Arquivo | Propósito |
|---------|-----------|
| `DEBUG_SIMULADOS_COMPLETO.sql` | Queries diagnósticas passo a passo |
| `GUIA_FALLBACK_SIMULADOS.md` | Explicação da estratégia de fallback |
| `GUIA_TESTAR_SIMULADOS_PRATICO.md` | Guia prático completo com troubleshooting |
| `ACAO_IMEDIATA_FIX_SIMULADOS.md` | Este arquivo |

---

## 🔄 COMO O FIX FUNCIONA

```typescript
// ANTES: Quebrava sem VIEW
const { data, error } = await supabase
  .from('vw_simulados_com_questoes')  // ❌ Se não existe, erro
  .select('*');

// DEPOIS: Estratégia de fallback resiliente
try {
  // 1. Tenta VIEW (rápido)
  const { data, error } = await supabase
    .from('vw_simulados_com_questoes')
    .select('*');
  
  if (!error && data) return data;  // ✅ Sucesso
  
  // 2. Se VIEW falhar, usa tabela direto (fallback)
  const { data: table } = await supabase
    .from('simulados')
    .select('*');
  
  // 3. Calcula contagem para cada simulado
  const withCount = await Promise.all(
    table.map(sim => 
      countQuestions(sim.id_simulado)
        .then(count => ({ ...sim, total_questoes: count }))
    )
  );
  
  return withCount;  // ✅ Sucesso mesmo sem VIEW
}
```

---

## ✨ RESULTADO FINAL

Após completar todos os passos:

```
🎉 PAINEL DO ALUNO
┌─────────────────────────────────────┐
│  Simulados                      🔄  │ (sem erro)
├─────────────────────────────────────┤
│                                     │
│  📝 Simulado ENEM 2024             │
│  Descrição: Simulado completo       │
│  Questões: 180                      │
│  [Iniciar]  [Refazer]              │
│                                     │
│  📝 Simulado Matemática            │
│  Descrição: Foco em matemática      │
│  Questões: 45                       │
│  [Ver Resultado]                    │
│                                     │
│  📝 Simulado Português             │
│  Descrição: Foco em português       │
│  Questões: 35                       │
│  [Iniciar]                          │
│                                     │
└─────────────────────────────────────┘
```

---

## 📞 SUPORTE

Se tudo isto não funcionar:
1. Copie mensagem de erro exato do DevTools Console
2. Anote resultado de cada SQL query
3. Verifique se simulados realmente existem: `SELECT COUNT(*) FROM public.simulados;`
4. Envie detalhes para análise

**Próximo passo**: Após confirmar que VIEW funciona, testar clique em "Iniciar" para verificar se questões carregam.
