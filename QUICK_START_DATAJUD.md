# 🎯 DataJud Integration - Quick Start (5 min)

## ⚡ Começar em 5 Minutos

### 1️⃣ Obter API Key DataJud (5 min)
```bash
# Acessar
https://datajud-wiki.cnj.jus.br/api-publica/acesso/

# Seguir:
1. Cadastro junto CNJ
2. Receber API Key por email
3. Copiar chave
```

### 2️⃣ Configurar Secrets (2 min)
```bash
supabase secrets set DATAJUD_API_KEY=<sua-chave>
supabase secrets list  # Verificar
```

### 3️⃣ Deploy Migration (1 min)
```bash
supabase db push
# Ou no dashboard Supabase: SQL Editor → executar arquivo
```

### 4️⃣ Deploy Edge Function (1 min)
```bash
supabase functions deploy datajud-enhanced
```

### 5️⃣ Testar (1 min)
```bash
npm run dev

# Ir para caso
# Clicar "Buscar Processo DataJud"
# Buscar teste
# ✅ Pronto!
```

---

## 📋 Arquivos Principais

| Arquivo | Descrição | Status |
|---------|-----------|--------|
| `supabase/migrations/20260131_datajud_casos_integration.sql` | DB schema | ✅ |
| `supabase/functions/datajud-enhanced/index.ts` | API proxy | ✅ |
| `src/services/datajudCaseService.ts` | Lógica frontend | ✅ |
| `src/components/CasoDetail/CasoDataJudSearchModal.tsx` | Modal busca | ✅ |
| `src/components/CasoDetail/CasoDataJudSection.tsx` | Exibição processo | ✅ |
| `API_INTEGRATION_DATAJUD.md` | Documentação completa | ✅ |
| `DEPLOYMENT_DATAJUD_STEP_BY_STEP.md` | Deploy passo a passo | ✅ |

---

## 🎬 Como Usar

### Buscar Processo
```typescript
import { datajudCaseService } from '@/services/datajudCaseService'

const resultado = await datajudCaseService.searchProcessos({
  tribunal: 'trt',
  searchType: 'parte',
  query: 'João Silva'
})

console.log(`Encontrados: ${resultado.total} processos`)
```

### Vincular a Caso
```typescript
await datajudCaseService.linkProcessoToCaso(
  'caso-id',
  resultado.processos[0]
)
```

### Sincronizar Movimentações
```typescript
await datajudCaseService.syncProcessoMovimentos(
  'processo-id',
  '0000001-00.2025.5.15.0000',
  'trt'
)
```

---

## 🧪 Testes

```bash
npm run test src/services/__tests__/datajudCaseService.test.ts
```

---

## 📞 Dúvidas?

1. Ler: [API_INTEGRATION_DATAJUD.md](./API_INTEGRATION_DATAJUD.md)
2. Ver: [IMPLEMENTACAO_DATAJUD_RESUMO.md](./IMPLEMENTACAO_DATAJUD_RESUMO.md)
3. Deployment: [DEPLOYMENT_DATAJUD_STEP_BY_STEP.md](./DEPLOYMENT_DATAJUD_STEP_BY_STEP.md)

---

**Status:** ✅ Pronto para Produção
