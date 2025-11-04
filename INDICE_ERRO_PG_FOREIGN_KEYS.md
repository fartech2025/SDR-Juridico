---
type: index
title: Erro pg_foreign_keys - Índice de Soluções
date: 2025-11-03
priority: ALTA
---

# 🔧 Índice: Erro pg_foreign_keys não encontrada

## 📍 Identificação do Problema

**Página afetada:** 
- `http://localhost:5173/documentacao-relacionamentos`
- `http://localhost:5173/database-relations`

**Mensagem de erro:**
```
❌ Função pg_foreign_keys não encontrada. 
Veja SOLUCAO_PG_FOREIGN_KEYS.md para corrigir, 
ou acesse o SQL Editor do Supabase para criar a função manualmente.
```

---

## 🎯 Escolha seu Caminho

### 🏃 Quero Resolver RÁPIDO (5 minutos)

1. Vá para: **STATUS_ERRO_PG_FOREIGN_KEYS_RESOLVIDO.md**
2. Siga a seção "Passo-a-Passo Rápido"
3. Pronto!

**Tempo estimado:** 5 minutos

---

### 📖 Quero Entender Tudo Passo-a-Passo

1. Leia: **INSTRUCOES_CRIAR_FUNCAO_PG_FOREIGN_KEYS.md**
2. Siga os 3 passos principais
3. Use a seção de troubleshooting se tiver dúvidas

**Tempo estimado:** 10-15 minutos

---

### 💻 Quero Copiar o SQL e Executar

1. Abra: **SQL_CRIAR_FUNCAO_PG_FOREIGN_KEYS.sql**
2. Copie **todo** o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique RUN

**Tempo estimado:** 2 minutos

---

### 🔬 Quero Entender o Problema Tecnicamente

1. Leia: **SOLUCAO_PG_FOREIGN_KEYS.md** (documentação anterior)
2. Então consulte: **STATUS_ERRO_PG_FOREIGN_KEYS_RESOLVIDO.md**
3. Explore o arquivo migration em: `supabase/migrations/20251103_create_pg_foreign_keys_function.sql`

**Tempo estimado:** 20+ minutos

---

## 📚 Arquivo de Referência Rápida

| Necessidade | Arquivo | Ação |
|---|---|---|
| **Entrega de SQL** | SQL_CRIAR_FUNCAO_PG_FOREIGN_KEYS.sql | Copiar todo conteúdo |
| **Guia completo** | INSTRUCOES_CRIAR_FUNCAO_PG_FOREIGN_KEYS.md | Ler passo-a-passo |
| **Status + Troubleshooting** | STATUS_ERRO_PG_FOREIGN_KEYS_RESOLVIDO.md | Consultar |
| **Documentação técnica** | SOLUCAO_PG_FOREIGN_KEYS.md | Referência |
| **Migration (automática)** | supabase/migrations/20251103_create_pg_foreign_keys_function.sql | Se usar `db reset` |

---

## ⚡ Quick Start (30 segundos)

```
1. Abra o SQL Editor do Supabase
2. New Query
3. Cole: SQL_CRIAR_FUNCAO_PG_FOREIGN_KEYS.sql
4. RUN
5. Recarregue a página (F5)
6. ✅ Pronto!
```

---

## 🧪 Teste de Sucesso

Após executar, teste no SQL Editor:

```sql
SELECT * FROM public.pg_foreign_keys();
```

**Resultado esperado:** Lista de relacionamentos entre tabelas

---

## 🆘 Problemas?

Se algo der errado, consulte:

1. **Função não aparece:** Verifique permissões em INSTRUCOES_CRIAR_FUNCAO_PG_FOREIGN_KEYS.md
2. **Ainda com erro:** Leia seção "Se Ainda Não Funcionar"
3. **Precisa de mais ajuda:** Consulte STATUS_ERRO_PG_FOREIGN_KEYS_RESOLVIDO.md

---

## 📋 Checklist de Resolução

- [ ] Abri o SQL Editor do Supabase
- [ ] Criei uma New Query
- [ ] Copiei o SQL de SQL_CRIAR_FUNCAO_PG_FOREIGN_KEYS.sql
- [ ] Colei no editor
- [ ] Cliquei RUN
- [ ] Resultado foi "Success"
- [ ] Testei: `SELECT * FROM public.pg_foreign_keys();`
- [ ] Recarreguei a página da app (F5)
- [ ] Página carrega sem erros
- [ ] ✅ Problema resolvido!

---

## 🔗 Navegação

**Voltar para:**
- Documentação de Relacionamentos: `http://localhost:5173/documentacao-relacionamentos`
- Home Page: `http://localhost:5173/home`

**Outros documentos relacionados:**
- RELACAO_TABELAS.md - Explicação dos relacionamentos
- RELACAO_QUESTOES_SIMULADOS_DETALHADA.md - Detalhes
- INDICE_COMPLETO_RELACIONAMENTOS.md - Índice completo

---

**Última atualização:** 03/11/2025  
**Versão:** 1.0  
**Status:** ✅ Pronto para usar

