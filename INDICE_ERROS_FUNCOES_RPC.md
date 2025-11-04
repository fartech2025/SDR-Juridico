# 🔴 ERROS DE FUNÇÕES RPC - GUIA RÁPIDO

**Data:** 04/11/2025  
**Total de Funções:** 2 faltando  

---

## 📍 Erros Encontrados

### 1️⃣ Erro: `pg_foreign_keys` não encontrada

**Página Afetada:**
- http://localhost:5173/documentacao-relacionamentos

**Mensagem:**
```
Função pg_foreign_keys não encontrada. 
Veja SOLUCAO_PG_FOREIGN_KEYS.md para corrigir, 
ou acesse o SQL Editor do Supabase para criar a função manualmente.
```

**Solução Rápida:**
```
→ Arquivo: SQL_CRIAR_FUNCAO_PG_FOREIGN_KEYS.sql
→ Copie → Cole no SQL Editor → RUN → F5
```

**Documentação:**
- `SQL_CRIAR_FUNCAO_PG_FOREIGN_KEYS.sql` (SQL pronto)
- `INSTRUCOES_CRIAR_FUNCAO_PG_FOREIGN_KEYS.md` (Guia completo)
- `STATUS_ERRO_PG_FOREIGN_KEYS_RESOLVIDO.md` (Troubleshooting)
- `INDICE_ERRO_PG_FOREIGN_KEYS.md` (Índice de navegação)

---

### 2️⃣ Erro: `get_all_tables` não encontrada

**Página Afetada:**
- http://localhost:5173/database-inspetor

**Mensagem:**
```
Erro ao buscar tabelas: Could not find the function public.get_all_tables 
without parameters in the schema cache
```

**Solução Rápida:**
```
→ Arquivo: SQL_CRIAR_FUNCAO_GET_ALL_TABLES.sql
→ Copie → Cole no SQL Editor → RUN → F5
```

**Documentação:**
- `SQL_CRIAR_FUNCAO_GET_ALL_TABLES.sql` (SQL pronto)
- `INSTRUCOES_CRIAR_FUNCAO_GET_ALL_TABLES.md` (Guia completo)
- `STATUS_ERRO_GET_ALL_TABLES_RESOLVIDO.md` (Troubleshooting)

---

## ⏱️ RESOLUÇÃO POR TEMPO DISPONÍVEL

### ⚡ 2-5 MINUTOS (Super Rápido)

Faça isso para CADA erro:

```
1. SQL Editor do Supabase (Cloud: supabase.com, Local: http://localhost:54323)
2. New Query
3. Copie conteúdo do SQL file correspondente
4. RUN
5. Recarregue a página (F5)
```

**Arquivos SQL:**
- `SQL_CRIAR_FUNCAO_PG_FOREIGN_KEYS.sql`
- `SQL_CRIAR_FUNCAO_GET_ALL_TABLES.sql`

---

### 📖 10-15 MINUTOS (Entender Tudo)

Para cada erro, siga o guia passo-a-passo:

**Para pg_foreign_keys:**
1. Leia: `INSTRUCOES_CRIAR_FUNCAO_PG_FOREIGN_KEYS.md`
2. Execute a solução
3. Teste conforme instruído

**Para get_all_tables:**
1. Leia: `INSTRUCOES_CRIAR_FUNCAO_GET_ALL_TABLES.md`
2. Execute a solução
3. Teste conforme instruído

---

### 🐛 COM PROBLEMAS (Troubleshooting)

Para cada erro, abra o arquivo de status:

**Para pg_foreign_keys:**
1. Leia: `STATUS_ERRO_PG_FOREIGN_KEYS_RESOLVIDO.md`
2. Vá à seção "Se Ainda Não Funcionar"
3. Siga as instruções de diagnóstico

**Para get_all_tables:**
1. Leia: `STATUS_ERRO_GET_ALL_TABLES_RESOLVIDO.md`
2. Vá à seção "Se Ainda Não Funcionar"
3. Siga as instruções de diagnóstico

---

## 📊 TABELA DE REFERÊNCIA

| Erro | Função | Página | SQL | Guia | Status |
|---|---|---|---|---|---|
| `pg_foreign_keys` | Buscar relacionamentos | `/documentacao-relacionamentos` | `SQL_CRIAR_FUNCAO_PG_FOREIGN_KEYS.sql` | `INSTRUCOES_CRIAR_FUNCAO_PG_FOREIGN_KEYS.md` | `STATUS_ERRO_PG_FOREIGN_KEYS_RESOLVIDO.md` |
| `get_all_tables` | Listar tabelas | `/database-inspetor` | `SQL_CRIAR_FUNCAO_GET_ALL_TABLES.sql` | `INSTRUCOES_CRIAR_FUNCAO_GET_ALL_TABLES.md` | `STATUS_ERRO_GET_ALL_TABLES_RESOLVIDO.md` |

---

## 🎯 PASSO-A-PASSO RECOMENDADO

### Ordem de Resolução (da mais importante para menos)

1. **`get_all_tables`** (Afeta: Database Inspetor)
   - Necessária para qualquer inspeção de banco
   - Resolva PRIMEIRO

2. **`pg_foreign_keys`** (Afeta: Documentação de Relacionamentos)
   - Necessária para visualizar relacionamentos
   - Resolva SEGUNDO

---

## ✅ APÓS RESOLVER AMBAS

Você terá acesso a:
- ✅ Database Inspetor (listar e inspecionar todas as tabelas)
- ✅ Documentação de Relacionamentos (visualizar todas as conexões entre tabelas)
- ✅ Botão "📚 Relações BD" na Home (acesso direto)

---

## 🚀 COMEÇAR AGORA

Escolha UMA das opções:

**OPÇÃO A - RESOLVER AMBAS (super rápido, ~5 minutos)**
```
1. Abra SQL_CRIAR_FUNCAO_GET_ALL_TABLES.sql
2. Execute no SQL Editor (RUN)
3. Abra SQL_CRIAR_FUNCAO_PG_FOREIGN_KEYS.sql
4. Execute no SQL Editor (RUN)
5. Recarregue as páginas (F5)
```

**OPÇÃO B - RESOLVER UMA DE CADA VEZ**
```
1. Resolva get_all_tables (mais importante)
   → SQL_CRIAR_FUNCAO_GET_ALL_TABLES.sql
2. Resolva pg_foreign_keys
   → SQL_CRIAR_FUNCAO_PG_FOREIGN_KEYS.sql
```

**OPÇÃO C - USAR CLI (automático)**
```bash
cd /Users/fernandodias/Projeto-ENEM
npx supabase db reset
# Executa ambas as migrations automaticamente
```

---

## 📁 TODOS OS ARQUIVOS CRIADOS

### Para `pg_foreign_keys`:
- `SQL_CRIAR_FUNCAO_PG_FOREIGN_KEYS.sql`
- `INSTRUCOES_CRIAR_FUNCAO_PG_FOREIGN_KEYS.md`
- `STATUS_ERRO_PG_FOREIGN_KEYS_RESOLVIDO.md`
- `INDICE_ERRO_PG_FOREIGN_KEYS.md`
- `COMECE_AQUI_ERRO_PG_FOREIGN_KEYS.txt`

### Para `get_all_tables`:
- `SQL_CRIAR_FUNCAO_GET_ALL_TABLES.sql`
- `INSTRUCOES_CRIAR_FUNCAO_GET_ALL_TABLES.md`
- `STATUS_ERRO_GET_ALL_TABLES_RESOLVIDO.md`

---

## 📞 SUPORTE RÁPIDO

**Se receber erro ao tentar executar SQL:**
1. Verifique permissões de banco
2. Limpe cache do navegador (Ctrl+Shift+R)
3. Recarregue a página (F5)
4. Tente novamente

**Se a página ainda mostrar erro após criar a função:**
1. Verifique se a função foi realmente criada:
   ```sql
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_schema = 'public';
   ```
2. Veja se as permissões foram concedidas
3. Limpe cache do navegador completamente

---

**Status:** ✅ Todas as soluções prontas  
**Commits:** 5 total  
**Arquivos:** 8 novos documentos (~30 KB)  
**Tempo de Resolução:** 2-15 minutos (sua escolha)
