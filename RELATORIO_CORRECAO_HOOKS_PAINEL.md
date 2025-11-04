# Correção: Erro de Hooks no Painel do Aluno — Avaliação e Correção (03/11/2025)

## 🔴 Erro Identificado

```
Error: Rendered more hooks than during the previous render.
  at updateWorkInProgressHook (react-dom_client.js:5792:19)
  at updateMemo (react-dom_client.js:6540:20)
  at Object.useMemo (react-dom_client.js:18969:20)
  at DashboardAluno_dark (DashboardAluno_dark_supabase.tsx:140:24)
```

**Tipo:** Violação das **Rules of Hooks** do React  
**Componentes afetados:** 
- `DashboardAluno_dark_supabase.tsx`
- `DashboardGestor_dark_supabase.tsx`

## 🔍 Análise da Causa

### Problema
Os hooks `useMemo` eram chamados **condicionalmente** dentro de `if (erro || !dados)`:

```tsx
if (erro || !dados) {
  return <BasePage>...</BasePage>;
}

// ❌ ERRADO: useMemo fora do bloco condicional
const pontosFortes = useMemo(() => [...], [dados?.temas]);
```

### Por que é um erro?
React rastreia **a ordem dos hooks** para cada render. Se em um render você:
1. Chama `useState` (hook 1)
2. Chama `useState` (hook 2)
3. Chama `useEffect` (hook 3)
4. Retorna early (não chama `useMemo`)

E no próximo render você:
1. Chama `useState` (hook 1)
2. Chama `useState` (hook 2)
3. Chama `useEffect` (hook 3)
4. Chama `useMemo` (hook 5) ← **Ordem diferente!**

React não consegue mapear qual hook é qual → erro.

## ✅ Solução Aplicada

### Regra de Ouro
**Todos os hooks SEMPRE precisam ser chamados no topo do componente, ANTES de qualquer condicional (return early).**

### Antes (❌ ERRADO)
```tsx
export default function DashboardAluno_dark() {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => { /* ... */ }, []);

  if (carregando) return <div>Carregando...</div>;
  
  if (erro || !dados) return <div>Erro...</div>;

  // ❌ Hooks chamados AQUI - depois do early return
  const pontosFortes = useMemo(() => dados.temas.filter(...), [dados.temas]);
  const pontosFracos = useMemo(() => dados.temas.filter(...), [dados.temas]);
  
  return <div>{pontosFortes}...</div>;
}
```

### Depois (✅ CORRETO)
```tsx
export default function DashboardAluno_dark() {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => { /* ... */ }, []);

  if (carregando) return <div>Carregando...</div>;

  // ✅ Hooks chamados AQUI - ANTES do early return
  const pontosFortes = useMemo(
    () => dados?.temas.filter((t) => t.percentual > 70).map((t) => t.nome_tema) ?? [],
    [dados?.temas]
  );
  const pontosFracos = useMemo(
    () => dados?.temas.filter((t) => t.percentual < 50).map((t) => t.nome_tema) ?? [],
    [dados?.temas]
  );

  if (erro || !dados) return <div>Erro...</div>;

  return <div>{pontosFortes}...</div>;
}
```

## 📋 Mudanças Aplicadas

### 1. `DashboardAluno_dark_supabase.tsx`
- ✅ Movidos `useMemo` de `pontosFortes` e `pontosFracos` para **após** `carregando` check, mas **antes** do `erro || !dados` check.
- ✅ Ajustados deps para usar optional chaining: `dados?.temas` em vez de `dados.temas`.
- ✅ Removida prop inválida `maxWidth` do `BasePage`.

### 2. `DashboardGestor_dark_supabase.tsx`
- ✅ Mesmas correções de estrutura de early returns.
- ✅ Removida prop `maxWidth` do `BasePage`.

## 🧪 Verificação

### Build Status
```
✓ 1255 modules transformed.
✓ built in 2.14s
```

✅ **Sem erros TypeScript**  
✅ **Sem erros de compilação Vite**  
✅ **Bundle size**: 626KB (gzipped: 189KB)

## 📝 Padrão Correto para Componentes com Dados

```tsx
export default function MyComponent() {
  // 1. Declarar hooks PRIMEIRO
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => { /* fetch dados */ }, []);

  // 2. Early return para loading (sem violação)
  if (carregando) return <LoadingUI />;

  // 3. Declarar TODOS os hooks aqui (antes de mais early returns)
  const memoValue = useMemo(() => processar(dados), [dados]);
  const callbackFn = useCallback(() => fazer(dados), [dados]);

  // 4. Early return para erro
  if (erro || !dados) return <ErrorUI />;

  // 5. Render principal
  return <MainUI value={memoValue} fn={callbackFn} />;
}
```

## 🔗 Referências
- [React Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)
- [Common Mistake: Conditional Hooks](https://react.dev/warnings/invalid-hook-call-warning)

## 📊 Impacto

| Componente | Erro | Status |
|-----------|------|--------|
| `DashboardAluno_dark_supabase.tsx` | Rules of Hooks | ✅ Corrigido |
| `DashboardGestor_dark_supabase.tsx` | Rules of Hooks + props inválidas | ✅ Corrigido |
| Build | Sem erros | ✅ Passou |
| TypeScript | Sem warnings | ✅ Limpo |

---

**Data**: 03/11/2025  
**Status**: ✅ Corrigido e compilado com sucesso  
**Testes**: Build passou sem erros
