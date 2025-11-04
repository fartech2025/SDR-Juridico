# 📋 STATUS: Erro pg_foreign_keys Resolvido

**Data:** 03/11/2025  
**Status:** ✅ Documentação Completa  
**Prioridade:** Alta  

---

## 🔴 O Problema

Ao acessar a página de documentação de relacionamentos em:
- `http://localhost:5173/database-relations` ou
- `http://localhost:5173/documentacao-relacionamentos`

Você recebe uma mensagem de erro:

```
❌ Função pg_foreign_keys não encontrada. 
Veja SOLUCAO_PG_FOREIGN_KEYS.md para corrigir, 
ou acesse o SQL Editor do Supabase para criar a função manualmente.
```

### Causa

A função RPC `pg_foreign_keys()` não foi criada no banco de dados Supabase (cloud ou local).

O código TypeScript tenta chamar:
```typescript
const { data, error } = await supabase.rpc('pg_foreign_keys');
```

Mas a função não existe.

---

## ✅ A Solução

Criamos **3 recursos** para resolver:

### 1. 📄 SQL_CRIAR_FUNCAO_PG_FOREIGN_KEYS.sql

**Arquivo:** `/Users/fernandodias/Projeto-ENEM/SQL_CRIAR_FUNCAO_PG_FOREIGN_KEYS.sql`

Contém **todo** o SQL pronto para executar:
- Cria a função `pg_foreign_keys()`
- Concede permissões para `anon` e `authenticated`
- Adiciona documentação à função
- Inclui query de teste comentada

**Como usar:**
1. Abra o SQL Editor do Supabase
2. Clique "New Query"
3. **Copie todo o conteúdo** deste arquivo
4. **Cole** no editor
5. Clique **RUN** (ou Ctrl+Enter)
6. Aguarde: `✅ Success. No rows returned.`

---

### 2. 📖 INSTRUCOES_CRIAR_FUNCAO_PG_FOREIGN_KEYS.md

**Arquivo:** `/Users/fernandodias/Projeto-ENEM/INSTRUCOES_CRIAR_FUNCAO_PG_FOREIGN_KEYS.md`

Guia **passo-a-passo completo** com:
- 3 passos principais
- Screenshots/localizações do Supabase
- Query de verificação
- Troubleshooting
- Checklist de validação
- Comandos CLI alternativos

**Como usar:**
1. Leia o arquivo de forma sequencial
2. Siga os 3 passos
3. Se houver problemas, vá à seção "Se Ainda Não Funcionar"

---

### 3. 🗄️ Migration Automática (Backup)

**Arquivo:** `/Users/fernandodias/Projeto-ENEM/supabase/migrations/20251103_create_pg_foreign_keys_function.sql`

Se você usar `npx supabase db reset`, esta migration é **executada automaticamente**.

---

## 🚀 Passo-a-Passo Rápido

### Para Supabase Cloud

```
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em: SQL Editor → New Query
4. Copie tudo de: SQL_CRIAR_FUNCAO_PG_FOREIGN_KEYS.sql
5. Cole no editor
6. Clique: RUN
7. Recarregue a página da app (F5)
```

### Alternativa: Usar CLI

```bash
# Reset do banco (se preferir automático)
cd /Users/fernandodias/Projeto-ENEM
npx supabase db reset

# Gerar tipos TypeScript
npx supabase gen types typescript --local > app/src/lib/database.types.ts

# Recarregar app
cd app && npm run dev
```

---

## 🧪 Como Verificar se Funcionou

Após executar o SQL, abra o SQL Editor novamente e execute:

```sql
SELECT * FROM public.pg_foreign_keys();
```

**Resultado esperado:** Uma tabela com múltiplas linhas mostrando relacionamentos como:

| tabela_origem | coluna_origem | tabela_destino | coluna_destino |
|---|---|---|---|
| alternativas | id_questao | questoes | id |
| comentarios | id_usuario | usuarios | id |
| desempenho | id_usuario | usuarios | id |
| desempenho | id_simulado | simulados | id |
| ... | ... | ... | ... |

Se vê **0 rows**, significa:
- ✅ Função foi criada com sucesso
- ✅ Mas não existem Foreign Keys no banco
- ℹ️ Execute `SEED` ou `RESET` do banco

Se recebe **erro de função não encontrada**:
- ❌ Execute o SQL de criação novamente
- ❌ Verifique permissões (veja seção "Se Ainda Não Funcionar" no guia)

---

## 🌐 Após Criar a Função

1. **Recarregue a página:**
   ```
   http://localhost:5173/documentacao-relacionamentos
   ou
   http://localhost:5173/database-relations
   ```
   Pressione: `F5` ou `Cmd+R`

2. **Você deve ver:**
   ✅ Sem mensagens de erro  
   ✅ Página carregando normalmente  
   ✅ 7 seções com conteúdo  
   ✅ Diagramas e tabelas preenchidos  

3. **Navegue pelas seções:**
   - 🔗 Relacionamentos Principais
   - 📊 Visualização de Campos
   - 💾 Exemplos SQL
   - E mais...

---

## 📚 Documentação Relacionada

| Arquivo | Descrição |
|---------|-----------|
| **SQL_CRIAR_FUNCAO_PG_FOREIGN_KEYS.sql** | SQL pronto para executar |
| **INSTRUCOES_CRIAR_FUNCAO_PG_FOREIGN_KEYS.md** | Guia passo-a-passo |
| **SOLUCAO_PG_FOREIGN_KEYS.md** | Documentação técnica detalhada |
| **supabase/migrations/20251103_create_pg_foreign_keys_function.sql** | Migration automática |
| **INTEGRACAO_BOTAO_HOME.md** | Integração do botão na Home |
| **RELACAO_TABELAS.md** | Explicação dos relacionamentos |

---

## 🐛 Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| "Function not found" após executar SQL | Verifique se clicou RUN corretamente |
| Permissões negadas | Execute também o `GRANT EXECUTE` |
| 0 rows retornadas | Função criada, mas sem dados; execute SEED |
| Página ainda com erro | Limpe cache (Ctrl+Shift+R) e recarregue |
| Docker não está rodando | Configure Supabase Cloud - não usar Docker |

---

## 🎯 Próximos Passos

- [ ] Criar a função no Supabase (via SQL Editor)
- [ ] Testar com `SELECT * FROM public.pg_foreign_keys();`
- [ ] Recarregar a página da aplicação
- [ ] Explorar a documentação de relacionamentos
- [ ] (Opcional) Integrar com seu CI/CD

---

## 📞 Notas Importantes

1. **Supabase Cloud vs Local:**
   - Ambos usam a mesma SQL
   - URLs são diferentes (veja instruções)
   - Permissões funcionam igualmente

2. **Migrations:**
   - Se usar `db reset`, roda automaticamente
   - Não precisa fazer manualmente
   - Útil para ambientes de desenvolvimento

3. **Performance:**
   - Função usa `information_schema` (custo zero)
   - Rápida mesmo com muitas tabelas
   - Cacheable pelo Supabase

4. **Segurança:**
   - Permissões concedidas apenas a `anon` e `authenticated`
   - Query é read-only (sem permissão de modificar dados)
   - Seguro para produção

---

**Criado:** 03/11/2025  
**Commit:** f6ee798  
**Arquivos:** 3 (SQL + 2 MD)  
**Status:** ✅ Pronto para usar

