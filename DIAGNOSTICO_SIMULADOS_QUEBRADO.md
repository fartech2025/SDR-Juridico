# 🔍 DIAGNÓSTICO: Por Que Não Consegue Puxar Simulados/Questões

**Data:** 03/11/2025  
**Severidade:** 🔴 CRÍTICA - Funcionalidade quebrada

---

## ❌ PROBLEMA IDENTIFICADO

A função `buscarSimuladosDisponveis()` está usando sintaxe incorreta para contar questões.

### Código Atual (ERRADO)
```typescript
export async function buscarSimuladosDisponveis() {
  try {
    const { data, error } = await supabase
      .from('simulados')
      .select(`
        id_simulado,
        nome,
        descricao,
        data_criacao,
        simulado_questoes (count)  ❌ SINTAXE ERRADA
      `);
```

**Por que está errado:**
- `.select('simulado_questoes (count)')` não existe no PostgREST
- A sintaxe correta é usar `.select('*').count('exact')` ou usar uma VIEW
- Está tentando usar um recurso que não existe

---

## 🔧 SOLUÇÕES

### Solução 1: Usar a VIEW Existente (RECOMENDADO)
```typescript
export async function buscarSimuladosDisponveis() {
  try {
    const { data, error } = await supabase
      .from('vw_simulados_com_questoes')  // ← Use a VIEW!
      .select('*');
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao buscar simulados:', error);
    throw error;
  }
}
```

**Vantagens:**
- ✅ Já existe no banco (criada em 20251103_create_simulados_table.sql)
- ✅ Retorna total_questoes automaticamente
- ✅ Filtra apenas simulados ativos
- ✅ Otimizada com índices

### Solução 2: Fazer Join Manual
```typescript
export async function buscarSimuladosDisponveis() {
  try {
    const { data, error } = await supabase
      .from('simulados')
      .select(`
        id_simulado,
        nome,
        descricao,
        data_criacao,
        simulado_questoes(id_simulado_questao)
      `)
      .eq('ativo', true);
    
    if (error) throw error;
    
    // Contar questões no client
    return data?.map(s => ({
      ...s,
      total_questoes: s.simulado_questoes?.length || 0
    })) || [];
  } catch (error) {
    console.error('Erro ao buscar simulados:', error);
    throw error;
  }
}
```

**Desvantagens:**
- ⚠️ Mais complexo
- ⚠️ Processa no client
- ⚠️ Menos eficiente

---

## 📊 Estrutura do Banco

### Tabelas Existentes
```
simulados
├─ id_simulado (PK)
├─ nome
├─ descricao
├─ data_criacao
├─ data_atualizacao
└─ ativo

simulado_questoes
├─ id_simulado_questao (PK)
├─ id_simulado (FK → simulados)
├─ id_questao (FK → questoes)
├─ ordem
└─ data_criacao

questoes
├─ id_questao (PK)
├─ texto
├─ alternativas
├─ resposta_correta
└─ ...
```

### View Disponível
```
vw_simulados_com_questoes
├─ id_simulado
├─ nome
├─ descricao
├─ data_criacao
├─ data_atualizacao
├─ ativo
└─ total_questoes ← Automaticamente calculado!
```

---

## 🔧 Como Corrigir

### Passo 1: Substituir a Função
Em `app/src/services/questoesService.ts`, linha ~270:

**De:**
```typescript
export async function buscarSimuladosDisponveis() {
  try {
    const { data, error } = await supabase
      .from('simulados')
      .select(`
        id_simulado,
        nome,
        descricao,
        data_criacao,
        simulado_questoes (count)
      `);
```

**Para:**
```typescript
export async function buscarSimuladosDisponveis() {
  try {
    const { data, error } = await supabase
      .from('vw_simulados_com_questoes')
      .select('*');
```

### Passo 2: Testar

```bash
cd app
npm run dev
```

Acesse: http://localhost:5173/painel-aluno

**Resultado esperado:**
- ✅ Simulados carregam na sidebar
- ✅ Cada simulado mostra total de questões
- ✅ Botões "Iniciar", "Refazer", "Ver Resultado" funcionam
- ✅ Sem erros no console

---

## 🐛 Outras Possíveis Issues

### 1. RLS Bloqueando Acesso
```
Erro: "relation 'simulados' does not exist"
```

**Solução:** Verificar RLS policies
```sql
-- Verificar policies
SELECT * FROM pg_policies WHERE tablename = 'simulados';
```

### 2. Dados Não Inseridos
```
Erro: "relation 'simulados' does not exist"
```

**Solução:** Verificar se seed foi executado
```sql
-- Verificar dados
SELECT COUNT(*) FROM public.simulados;
```

Esperado: 5 simulados de teste

### 3. Permissões de Usuário
```
Erro: "new row violates row-level security policy"
```

**Solução:** Garantir que usuário tem permissões corretas

---

## ✅ CHECKLIST DE DIAGNÓSTICO

- [ ] Banco criado (migrations rodadas)
- [ ] Tabela `simulados` existe
- [ ] Tabela `simulado_questoes` existe
- [ ] View `vw_simulados_com_questoes` existe
- [ ] 5 simulados de teste inseridos
- [ ] RLS policies criadas
- [ ] Usuário logado tem permissões
- [ ] React não tem erros de sintaxe
- [ ] PostgREST está respondendo

---

## 📞 VERIFICAÇÃO RÁPIDA

### No SQL Editor do Supabase

```sql
-- 1. Verificar se tabelas existem
SELECT COUNT(*) FROM public.simulados;
-- Esperado: 5

-- 2. Verificar view
SELECT COUNT(*) FROM public.vw_simulados_com_questoes;
-- Esperado: 5

-- 3. Verificar relacionamento
SELECT s.nome, COUNT(sq.id_simulado_questao) as questoes
FROM public.simulados s
LEFT JOIN public.simulado_questoes sq ON s.id_simulado = sq.id_simulado
GROUP BY s.id_simulado, s.nome;
-- Esperado: 5 linhas com contas de questões
```

---

## 🎯 PRÓXIMOS PASSOS

1. **Corrigir** a função `buscarSimuladosDisponveis()`
2. **Testar** carregamento de simulados
3. **Validar** que questões aparecem
4. **Confirmar** fluxo funciona
5. **Commit** das mudanças

---

**Status:** 🔴 QUEBRADO (mas fácil de corrigir)  
**Tempo para corrigir:** ⏱️ 2 minutos  
**Impacto:** 🔴 CRÍTICO (funcionalidade principal)
