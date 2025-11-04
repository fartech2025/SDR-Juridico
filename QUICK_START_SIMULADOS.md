# ⚡ QUICK START: Solucionar Erro 404 de Simulados em 2 Minutos

## 🎯 TL;DR (Resumo Executivo)

**Erro:** `404 Failed to load resource: simulados`
**Causa:** Tabela `simulados` não existe
**Solução:** Executar 1 comando

---

## 🚀 Solução (Passo 1)

### **Linux/macOS:**
```bash
cd /Users/fernandodias/Projeto-ENEM
bash run_migrations.sh
```

### **Windows:**
```cmd
cd C:\Users\fernandodias\Projeto-ENEM
run_migrations.bat
```

### **Qualquer OS:**
```bash
cd /Users/fernandodias/Projeto-ENEM
npx supabase db push
```

**Tempo:** ~30 segundos

---

## ✅ Verificação (Passo 2)

```bash
npm run dev  # na pasta /app
```

Abrir: `http://localhost:5173/painel-aluno`

**Resultado esperado:**
- ✅ Sidebar carrega lista de simulados
- ✅ Nenhum erro 404 no console (F12)
- ✅ Botões "Iniciar" visíveis

---

## 📊 O Que Foi Criado?

```
✨ 2 Tabelas SQL
✨ 1 View SQL
✨ 1 Trigger SQL
✨ 4 Índices SQL
✨ 4 Políticas RLS
✨ 5 Simulados de Teste
```

---

## 📚 Documentação Completa

- `GUIA_EXECUTAR_MIGRACAO_SIMULADOS.md` - Instruções detalhadas
- `RESUMO_FINAL_SOLUCAO_SIMULADOS.md` - Overview completo
- `supabase/migrations/20251103_create_simulados_table.sql` - Schema SQL

---

## 🎉 Pronto!

Agora o painel do aluno carrega simulados corretamente!

**Próximo:** Testar fluxo completo (Iniciar → Responder → Ver Resultado)

---

**Status:** ✅ Funcionando
**Tempo:** 2 minutos para resolver
**Impacto:** Crítico (resolve bloqueio)
