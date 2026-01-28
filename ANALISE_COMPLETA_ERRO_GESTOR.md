# 🔴 ANÁLISE COMPLETA: Por que o Gestor não consegue acessar

## 📊 ORDEM DE CARREGAMENTO ATUAL (App.tsx)

```
1. FontProvider
2. AuthProvider
3. OrganizationProvider       ← Chama permissionsService.getCurrentUser()
4. PermissionsProvider         ← Também chama permissionsService.getCurrentUser()
5. Router
```

## 🔴 PROBLEMA IDENTIFICADO

**DOIS CONTEXTOS CARREGAM O MESMO USUÁRIO**:

1. **OrganizationContext.tsx:L48** 
   ```typescript
   const user = await permissionsService.getCurrentUser()
   setCurrentRole(user.role || null)
   ```

2. **PermissionsContext.tsx:L50**
   ```typescript
   const currentUser = await permissionsService.getCurrentUser()
   setUser(currentUser)
   ```

### ⚠️ O PROBLEMA:

- OrganizationContext carrega PRIMEIRO
- Chama `getCurrentUser()` e seta `currentRole`
- PermissionsContext carrega SEGUNDO
- Chama `getCurrentUser()` NOVAMENTE (cache expirado entre as duas chamadas? ou race condition?)

**Resultado**: Há uma **RACE CONDITION** onde os dois contextos competem para carregar os dados!

---

## 🔍 FLUXO REAL QUE ESTÁ ACONTECENDO

### SEM ERROS VISÍVEIS:

```
Login → AuthProvider ativado
  ↓
OrganizationProvider carrega
  ├─ Chama permissionsService.getCurrentUser()
  ├─ Busca usuarios + org_members no banco
  ├─ Seta currentRole = 'org_admin' ✅
  └─ Carregamento termina
  ↓
PermissionsProvider carrega
  ├─ Chama permissionsService.getCurrentUser() NOVAMENTE
  ├─ PROBLEMA: Cache pode estar sujo?
  ├─ Ou há um erro que não aparece no console?
  └─ Carregamento trava?
  ↓
Router tenta renderizar
  ├─ useIsOrgAdmin() busca de OrganizationContext
  ├─ currentRole = 'org_admin' ✅
  ├─ OrgAdminGuard retorna true ✅
  └─ Mas... página vazia?
```

---

## 🎯 POSSÍVEIS CAUSAS

### 1️⃣ **Cache expirado entre chamadas** ❌
- Primeira chamada em OrganizationContext seta cache (valid por 10s)
- Segunda chamada em PermissionsContext chega e cache já expirou?
- Retorna null?

### 2️⃣ **Erro silencioso em permissionsService.getCurrentUser()** ❌
```typescript
} catch (error) {
  console.error('Erro ao obter usuario atual:', error)
  clearUserCache()
  return null  // ← Retorna null sem avisar!
}
```

Se houver qualquer erro, retorna null silenciosamente!

### 3️⃣ **RLS bloqueando query em org_members** ❌
```typescript
const { data: memberData } = await supabase
  .from('org_members')
  .select('org_id, role')
  .eq('user_id', user.id)
  .eq('ativo', true)
```

Se `org_members` tiver RLS ativado SEM policies corretas, retorna 0 linhas = `memberRole = null` = `role = 'user'`!

### 4️⃣ **RLS bloqueando query em usuarios** ❌
Se `usuarios` tiver RLS, não consegue ler `permissoes`!

---

## ✅ SOLUÇÃO PROPOSTA

### Opção A: REMOVER DUPLICAÇÃO (Recomendado)

Deixar **APENAS PermissionsContext** carregar os dados, e OrganizationContext buscar de lá:

```typescript
// App.tsx - NOVA ORDEM
<AuthProvider>
  <PermissionsProvider>
    <OrganizationProvider>  {/* Agora depende de PermissionsProvider */}
      <PermissionGuard>
        <Router />
      </PermissionGuard>
    </OrganizationProvider>
  </PermissionsProvider>
</AuthProvider>
```

### Opção B: VERIFICAR RLS

Certifique-se que `usuarios` e `org_members` **NÃO têm RLS**:

```sql
-- Verificar
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('usuarios', 'org_members') AND schemaname = 'public';

-- Desativar se tiver (CUIDADO - isso é perigoso em produção!)
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members DISABLE ROW LEVEL SECURITY;
```

### Opção C: DEBUG - Adicionar logs

No `permissionsService.getCurrentUser()`:

```typescript
async getCurrentUser(): Promise<UserWithRole | null> {
  console.log('[PermissionsService] Iniciando getCurrentUser...')
  
  // ... código ...
  
  const { data: memberData } = await supabase
    .from('org_members')
    .select('org_id, role')
    .eq('user_id', user.id)
    .eq('ativo', true)
  
  console.log('[PermissionsService] memberData:', memberData)
  console.log('[PermissionsService] memberRole:', memberRole)
  
  // ... resto do código ...
}
```

---

## 🔴 TESTE IMEDIATO

Execute isso no Supabase para verificar se RLS está bloqueando:

```sql
-- Verificar RLS em tabelas críticas
SELECT tablename, rowsecurity, forcerowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('usuarios', 'org_members', 'orgs', 'tarefas');

-- Se alguma tiver rowsecurity = true, isso pode ser o problema!
```

---

## 📋 CHECKLIST DE DIAGNÓSTICO

Faça essas verificações em ordem:

1. **[ ] RLS Check**
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables 
   WHERE tablename IN ('usuarios', 'org_members');
   ```
   ✅ Se ambos forem `false` → OK
   ❌ Se algum for `true` → PROBLEMA

2. **[ ] Query manual no Supabase**
   ```sql
   SELECT o.user_id, o.role, u.permissoes 
   FROM public.org_members o
   LEFT JOIN public.usuarios u ON o.user_id = u.id
   WHERE o.role = 'gestor' LIMIT 1;
   ```
   ✅ Se retornar dados → OK
   ❌ Se retornar vazio → RLS bloqueando

3. **[ ] Console do navegador (F12)**
   - Abra DevTools → Console
   - Faça login como gestor
   - Procure por erros com "permissionsService", "org_members", "usuarios"
   - Screenshot de qualquer erro vermelho

4. **[ ] Cache check**
   - Limpe cookies/localStorage (Ctrl+Shift+Delete)
   - Faça reload F5
   - Faça login novamente

---

## 🚀 AÇÃO IMEDIATA

**EXECUTE AGORA:**

```sql
-- 1. Verificar RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('usuarios', 'org_members');

-- 2. Se algum for TRUE, desativar:
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members DISABLE ROW LEVEL SECURITY;

-- 3. Depois:
-- - Reload F5 no navegador
-- - Logout + Login como gestor
-- - Verificar se aparece algo
```

---

## 📸 PRÓXIMOS PASSOS

1. Execute as queries acima
2. Screenshot dos resultados
3. Abra F12 → Console
4. Faça login como gestor
5. Me mostre:
   - ✅ Resultado das queries
   - ✅ Screenshots do console
   - ✅ Se aparecer algo ou continua branco

Isso vai nos dizer exatamente onde está o bloqueio!
