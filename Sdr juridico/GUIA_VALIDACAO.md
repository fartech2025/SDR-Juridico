# 🧪 GUIA DE VALIDAÇÃO - ARQUITETURA RESILIENTE

**Objetivo:** Validar que a arquitetura resiliente está funcionando corretamente

---

## 1️⃣ VERIFICAÇÃO INICIAL

### 1.1 Compilação TypeScript
```bash
cd /Users/fernandodias/Projeto-ENEM/Sdr\ juridico
npm run build
```

**Esperado:**
- ✅ Build completa sem erros
- ✅ Sem warnings de TypeScript
- ✅ Arquivo `dist/` criado

---

### 1.2 Server em Desenvolvimento
```bash
# Terminal 1 - Supabase (opcional)
npm run dev:supabase

# Terminal 2 - App
npm run dev
```

**Esperado:**
- ✅ Server inicia em http://localhost:5173/
- ✅ Sem erros no terminal
- ✅ Console do navegador sem erros

---

## 2️⃣ TESTES DE FUNCIONALIDADE

### 2.1 Carregar Página Principal
1. Abra http://localhost:5173/
2. Abra DevTools (F12 ou Cmd+Opt+I)
3. Vá para aba "Console"

**Esperado:**
- ✅ Página carrega sem erros
- ✅ Sem erros vermelhos no console
- ✅ Componente ConnectionStatus visível (no rodapé se online, na parte inferior se offline)
- ✅ Sem warnings críticos

**Indicadores de Sucesso:**
```
✓ App mounted
✓ Health checks initialized
✓ Router configured
```

---

### 2.2 Testar ErrorBoundary
1. Abra Console do DevTools
2. Execute:
```javascript
// Simula um erro de componente
throw new Error('Teste de ErrorBoundary')
```

**Esperado:**
- ⚠️ Erro capturado por ErrorBoundary
- ✅ UI mostra fallback "Algo deu errado"
- ✅ Botão "Recarregar" visível
- ✅ Em desenvolvimento: Stack trace visível

---

### 2.3 Testar Offline Mode
1. Abra DevTools > Network
2. Clique em "Throttling" dropdown
3. Selecione "Offline"

**Esperado:**
- ✅ Componente ConnectionStatus muda para laranja
- ✅ Mensagem "Você está offline" aparece
- ✅ App continua funcional (sem tentar requisições)
- ✅ Dados em cache funcionam

---

### 2.4 Testar Connection Status
1. Deixe Network como "Offline"
2. Clique em "Slow 3G"

**Esperado:**
- ✅ Componente muda para amarelo
- ✅ Mensagem "Conectando..." aparece
- ✅ Ícone WiFi animado (pulsante)

---

### 2.5 Testar Retry Logic
1. Abra DevTools > Network
2. Clique em "Online"
3. Execute no Console:
```javascript
import { apiClient } from '@/services/apiClient'
// Simula falha de timeout
await apiClient.get('/nonexistent-endpoint')
```

**Esperado:**
- ✅ ApiClient tenta 4 vezes
- ✅ Espera aumenta: 1s → 2s → 4s → 8s
- ✅ Finalmente falha com timeout

---

## 3️⃣ TESTES DE COMPONENTES INDIVIDUAIS

### 3.1 Testar useOnlineStatus Hook
```javascript
// No console
import { useOnlineStatus } from '@/hooks/useAsync'
// Crie um componente e teste
```

**Esperado:**
- ✅ `isOnline` true quando navegador online
- ✅ `isOnline` false quando navegador offline
- ✅ Muda em tempo real

---

### 3.2 Testar useAsync Hook
```javascript
// Simule uma operação assíncrona
async function testAsync() {
  const { data, loading, error } = useAsync(
    () => new Promise(resolve => setTimeout(() => resolve('OK'), 1000))
  )
  
  console.log('Loading:', loading) // true → false
  console.log('Data:', data) // undefined → 'OK'
}
```

**Esperado:**
- ✅ Loading state muda corretamente
- ✅ Data é carregado
- ✅ Sem memory leaks (isMounted check)

---

### 3.3 Testar useLocalStorage Hook
```javascript
// No console
const key = 'test_key'
const value = 'test_value'
localStorage.setItem(key, JSON.stringify(value))

// Em componente
const [stored, setStored] = useLocalStorage(key, 'default')
console.log(stored) // 'test_value'

setStored('new_value')
console.log(localStorage.getItem(key)) // '"new_value"'
```

**Esperado:**
- ✅ Lê de localStorage
- ✅ Escreve em localStorage
- ✅ Sincroniza automaticamente

---

## 4️⃣ TESTES DE ERRO

### 4.1 Testar AppError
```javascript
import { AppError, ValidationError } from '@/lib/errors'

const error = new ValidationError('Email inválido', 'email')
console.log(error.isRetryable) // false
console.log(error.type) // 'VALIDATION_ERROR'
console.log(error.field) // 'email'
```

**Esperado:**
- ✅ Error type correto
- ✅ isRetryable flag correto
- ✅ Contexto com metadata

---

### 4.2 Testar normalizeError
```javascript
import { normalizeError } from '@/lib/errors'

const genericError = new Error('Teste')
const appError = normalizeError(genericError)
console.log(appError instanceof AppError) // true
console.log(appError.context) // { timestamp, userAgent, url }
```

**Esperado:**
- ✅ Erro genérico convertido para AppError
- ✅ Context preenchido
- ✅ Sem perder informações

---

### 4.3 Testar Error Logger
```javascript
import { errorLogger } from '@/lib/errors'

errorLogger.log(new Error('Teste'), 'teste')
// Deve aparecer no console
```

**Esperado:**
- ✅ Erro logado no console
- ✅ Com timestamp
- ✅ Com contexto

---

## 5️⃣ TESTES DE HEALTH MONITOR

### 5.1 Verificar Health Status
```javascript
import { healthMonitor } from '@/lib/health'

const health = healthMonitor.getHealth()
console.log(health)
// {
//   status: 'healthy' | 'degraded' | 'offline',
//   timestamp: Date,
//   services: {...},
//   uptime: number
// }
```

**Esperado:**
- ✅ Status atualizado
- ✅ Serviços monitorados
- ✅ Uptime aumentando

---

### 5.2 Registrar Serviço Customizado
```javascript
import { healthMonitor } from '@/lib/health'

healthMonitor.registerService(
  'myService',
  async () => {
    // Simula check
    return Math.random() > 0.5
  },
  5000 // 5s interval
)

const health = healthMonitor.getHealth()
console.log(health.services.myService)
```

**Esperado:**
- ✅ Serviço registrado
- ✅ Check executado periodicamente
- ✅ Status atualizado

---

## 6️⃣ TESTES DE STATE COMPONENTS

### 6.1 Testar LoadingState
```tsx
<LoadingState message="Carregando usuários..." />
```

**Esperado:**
- ✅ Spinner animado
- ✅ Mensagem visível
- ✅ Sem quebra de layout

---

### 6.2 Testar ErrorState
```tsx
<ErrorState 
  error="Erro ao buscar dados" 
  onRetry={() => console.log('Retry')}
/>
```

**Esperado:**
- ✅ Erro exibido
- ✅ Botão Retry funciona
- ✅ Ícone de erro visível

---

### 6.3 Testar OfflineNotice
```tsx
<OfflineNotice />
```

**Esperado:**
- ✅ Barra laranja no rodapé
- ✅ Ícone WiFi desligado
- ✅ Mensagem clara

---

### 6.4 Testar SkeletonLoader
```tsx
<SkeletonLoader count={3} />
```

**Esperado:**
- ✅ 3 placeholders animados
- ✅ Shimmer effect
- ✅ Responsive

---

## 7️⃣ TESTES DE API CLIENT

### 7.1 GET Request
```javascript
import { apiClient } from '@/services/apiClient'

const data = await apiClient.get('/api/test')
// Deve retry automaticamente se falhar
```

**Esperado:**
- ✅ Request com timeout
- ✅ Retry automático se timeout
- ✅ Error normalizado se falhar

---

### 7.2 Testar Timeout
```javascript
// Modifique temporariamente timeout para 100ms
const client = new ApiClient()
client.timeout = 100

try {
  await client.get('/slow-endpoint')
} catch (error) {
  console.log(error.type) // 'TIMEOUT_ERROR'
}
```

**Esperado:**
- ✅ TimeoutError lançado
- ✅ Request abortado
- ✅ Retry automático

---

### 7.3 Testar Error Handling
```javascript
// Simule erro 404
try {
  await apiClient.get('/not-found')
} catch (error) {
  console.log(error instanceof NotFoundError) // true
  console.log(error.isRetryable) // false
}
```

**Esperado:**
- ✅ NotFoundError lançado
- ✅ isRetryable = false
- ✅ Sem retry automático

---

## ✅ CHECKLIST DE VALIDAÇÃO

- [ ] Build sem erros
- [ ] App carrega sem erros
- [ ] Console sem warnings críticos
- [ ] ErrorBoundary captura erros
- [ ] Offline mode funciona
- [ ] ConnectionStatus atualiza
- [ ] useOnlineStatus retorna boolean
- [ ] useAsync retorna data/loading/error
- [ ] useLocalStorage sincroniza
- [ ] AppError criado corretamente
- [ ] healthMonitor funcionando
- [ ] LoadingState renderiza
- [ ] ErrorState com retry
- [ ] OfflineNotice aparece
- [ ] SkeletonLoader anima
- [ ] ApiClient faz requisições
- [ ] Retry automático funciona
- [ ] Timeout automático funciona
- [ ] Error normalization funciona
- [ ] Logging centralizado funciona

---

## 🎯 RESULTADO ESPERADO

Após passar em todos os testes:

✅ **A arquitetura está 100% funcional**
✅ **App é resiliente a falhas**
✅ **Pronto para Supabase**
✅ **Pronto para produção**

---

## 📞 PRÓXIMOS PASSOS

1. ✅ Validar arquitetura (este guia)
2. 📋 Criar serviços Supabase
3. 🔗 Integrar com componentes
4. 🧪 Testar end-to-end
5. 🚀 Deploy em produção

---

**Guia criado:** 6 de janeiro de 2026  
**Última atualização:** 6 de janeiro de 2026  
**Status:** Pronto para validação
