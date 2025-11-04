# 🎯 COMECE AQUI - RESOLVA SEU ERRO EM 5 MINUTOS

## ❌ Seu Problema
```
Sidebar mostra: "Erro ao buscar simulados"
URL:            http://localhost:5173/painel-aluno
```

## ✅ Sua Solução
```
→ 7 passos simples em ~5 minutos
→ Criar 1 VIEW em Supabase
→ Pronto!
```

---

## 🚀 OS 7 PASSOS

### 1️⃣ Abra Supabase
```
https://app.supabase.io
→ Seu projeto
→ SQL Editor
→ New Query
```

### 2️⃣ Copie o SQL
Arquivo: `/Users/fernandodias/Projeto-ENEM/DEBUG_SIMULADOS_COMPLETO.sql`
```
Ação: Abra arquivo, Cmd+A (selecionar tudo), Cmd+C (copiar)
```

### 3️⃣ Execute PASSO 1 (diagnosticar)
Cole no SQL Editor:
```sql
SELECT EXISTS (
  SELECT 1 FROM information_schema.views 
  WHERE table_schema = 'public' 
  AND table_name = 'vw_simulados_com_questoes'
) as "VIEW Existe?";
```

**Resultado:**
- `t` = VIEW existe ✅ Pule para PASSO 6
- `f` = não existe ❌ Continue para PASSO 4

### 4️⃣ Crie a VIEW (se PASSO 3 = `f`)
Execute este SQL no Supabase:
```sql
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
```

### 5️⃣ Dê permissões
Execute no Supabase:
```sql
GRANT SELECT ON public.vw_simulados_com_questoes TO anon;
GRANT SELECT ON public.vw_simulados_com_questoes TO authenticated;
```

### 6️⃣ Teste
Execute no Supabase:
```sql
SELECT * FROM public.vw_simulados_com_questoes;
```

Deve retornar lista de simulados ✅

### 7️⃣ Refresh no app
```
Browser: http://localhost:5173/painel-aluno
Tecla:   Cmd + Shift + R  (limpa cache)
Aguarde: 3 segundos
Pronto!  Simulados devem aparecer no sidebar ✅
```

---

## ✨ Resultado Final
```
Antes:  ❌ "Erro ao buscar simulados"
Depois: ✅ Lista de simulados no sidebar
```

---

## 📚 Precisa de Mais Ajuda?

| Situação | Arquivo |
|----------|---------|
| "Não entendo o fluxo" | `VISUAL_PASSO_A_PASSO.txt` |
| "Quero um checklist" | `ACAO_IMEDIATA_FIX_SIMULADOS.md` |
| "Deu erro" | `GUIA_TESTAR_SIMULADOS_PRATICO.md` |
| "Quero diagramas" | `ARVORE_DECISAO_FIX.txt` |
| "Quero saber tudo" | `PLANO_COMPLETO_FIX.md` |
| "Qual arquivo usar?" | `INDICE_GUIAS_FIX_SIMULADOS.md` |

---

## ⏱️ Cronômetro
- **Passo 1-3**: 1 min (copiar/colar)
- **Passo 4-5**: 2 min (executar SQL)
- **Passo 6-7**: 2 min (teste/refresh)
- **TOTAL**: ~5 minutos ✅

---

**BOA SORTE! 💪**
