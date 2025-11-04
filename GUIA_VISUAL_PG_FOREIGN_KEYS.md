# 🖱️ GUIA VISUAL: Como Criar pg_foreign_keys no Supabase

**Tempo:** ⏱️ 3 minutos  
**Dificuldade:** 🟢 Super fácil

---

## 🎯 OBJETIVO

Criar uma função no Supabase para corrigir o erro:
```
"Função pg_foreign_keys não encontrada"
```

---

## 📸 PASSO 1: Abrir Supabase

**URL:** https://app.supabase.io

Você verá a dashboard com seus projetos:

```
┌─────────────────────────────────────────┐
│   Supabase Dashboard                    │
│                                         │
│   Seus Projetos:                        │
│   ├─ projeto-enem    [Clique aqui]     │
│   └─ outro-projeto                      │
│                                         │
└─────────────────────────────────────────┘
```

**Clique** no seu projeto (projeto-enem).

---

## 📸 PASSO 2: Ir para SQL Editor

Na barra lateral esquerda, você verá:

```
┌──────────────────────┐
│ DESENVOLVIMENTO      │
│ ├─ SQL Editor ← ⭐   │
│ ├─ Table Editor      │
│ ├─ Database          │
│ └─ Backups           │
└──────────────────────┘
```

**Clique** em **SQL Editor**.

---

## 📸 PASSO 3: Nova Query

Ao abrir SQL Editor, você vê:

```
┌───────────────────────────────────────┐
│  SQL Editor          [+ New Query] ← ⭐│
├───────────────────────────────────────┤
│                                       │
│  [Editor vazio com cursor aqui]       │
│                                       │
│  SELECT * FROM ...                    │
│                                       │
│                        [RUN] [Save]   │
│                          ↑ Azul       │
└───────────────────────────────────────┘
```

**Clique** em **+ New Query** (canto superior direito azul).

---

## 📸 PASSO 4: Colar o SQL

Você terá um editor vazio. **Cole este SQL:**

```sql
create or replace function public.pg_foreign_keys()
returns table(
  tabela_origem text,
  coluna_origem text,
  tabela_destino text,
  coluna_destino text
)
language sql
stable
as $$
  select
    tc.table_name as tabela_origem,
    kcu.column_name as coluna_origem,
    ccu.table_name as tabela_destino,
    ccu.column_name as coluna_destino
  from
    information_schema.table_constraints as tc
    join information_schema.key_column_usage as kcu
      on tc.constraint_name = kcu.constraint_name
      and tc.table_schema = kcu.table_schema
    join information_schema.constraint_column_usage as ccu
      on ccu.constraint_name = tc.constraint_name
      and ccu.table_schema = tc.table_schema
  where
    tc.constraint_type = 'FOREIGN KEY'
    and tc.table_schema = 'public'
  order by
    tc.table_name,
    kcu.column_name;
$$;

grant execute on function public.pg_foreign_keys() to anon, authenticated;
comment on function public.pg_foreign_keys() is 'Returns all foreign key relationships in the public schema';
```

Depois do CTRL+V, você verá:

```
┌───────────────────────────────────────┐
│  create or replace function public... │
│  returns table(                       │
│    tabela_origem text,                │
│  ...                                  │
│  grant execute on function...         │
│                        [RUN] [Save]   │
│                         ↑ Azul        │
└───────────────────────────────────────┘
```

---

## 📸 PASSO 5: EXECUTAR

**Clique** no botão **RUN** (azul, canto inferior direito).

```
┌───────────────────────────────────────┐
│  [SQL aqui]                           │
│                        [RUN] ← ⭐ Click!
│                                       │
│  Aguarde...                           │
│                                       │
│  ✓ Success!                           │
│  Query executed in 234ms              │
└───────────────────────────────────────┘
```

---

## ✅ PRONTO!

Se você vir **✓ Success**, a função foi criada com sucesso! 🎉

---

## 🧪 TESTAR

### No Terminal

```bash
cd /Users/fernandodias/Projeto-ENEM/app
npm run dev
```

### No Navegador

```
http://localhost:5173/database-relations
```

Você deve ver uma tabela com as relações entre tabelas.

---

## ⚠️ ERROS COMUNS

### Erro: "Syntax error"

✅ **Solução:** Copie novamente o SQL completo, linha por linha.

### Erro: "Permission denied"

✅ **Solução:** Certifique que está logado com Admin Role no Supabase.

### Botão RUN não aparece

✅ **Solução:** Role para baixo, o botão fica no final da query.

### Nada aconteceu depois de clicar RUN

✅ **Solução:** Aguarde 5 segundos, a query está processando.

---

## 📚 DOCUMENTAÇÃO

Para mais detalhes, consulte:
- `SOLUCAO_PG_FOREIGN_KEYS.md` - Explicação técnica
- `GUIA_RAPIDO_PG_FOREIGN_KEYS.md` - Guia rápido alternativo

---

## 🎓 O Que Você Fez

Você criou uma **função PostgreSQL** que:
- Retorna todas as relações (foreign keys) do banco
- É chamada pela página `/database-relations`
- Ajuda a visualizar como as tabelas se conectam

---

**Status:** ✅ Pronto!  
**Tempo gasto:** ⏱️ ~3 minutos  
**Resultado:** 🎉 Função criada com sucesso
