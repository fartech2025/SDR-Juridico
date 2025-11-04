# 🗄️ Monitor de Conexão com Banco de Dados

## 📍 Localização
```
URL: http://localhost:5173/monitor
Componente: DatabaseConnectionStatus.tsx
Integrado em: Monitor.tsx (página de monitoramento)
```

---

## ✨ O que foi adicionado

### Novo Componente: `DatabaseConnectionStatus`
Um monitor em tempo real que verifica a conexão com cada tabela do banco de dados.

**Tabelas monitoradas:**
1. `usuarios` - Dados dos usuários
2. `simulados` - Simulados disponíveis
3. `questoes` - Questões dos simulados
4. `simulado_questoes` - Associações entre simulados e questões
5. `questoes_imagens` - Imagens nas questões
6. `alternativas` - Alternativas das questões
7. `alternativas_imagens` - Imagens nas alternativas
8. `resultados_simulados` - Resultados dos simulados
9. `resultados_questoes` - Resultados por questão

---

## 📊 O que você verá no Monitor

### 1. **Header com Resumo**
```
✅ X tabelas conectadas
❌ Y tabelas com erro
Última atualização: 14:35:22
```

### 2. **Barra de Progresso Visual**
- Cada segmento representa uma tabela
- Verde = conectado ✅
- Vermelho = erro ❌
- Amarelo = verificando ⏳

### 3. **Grid de Tabelas**
Para cada tabela você vê:
- **✅ ou ❌** Status (conectada ou erro)
- **Nome da tabela** ex: `usuarios`
- **Registros** Número total de linhas (se conectado)
- **Tempo** Tempo de resposta em ms

Exemplo:
```
✅ simulados
Registros: 5
Tempo: 45ms
```

### 4. **Botão Atualizar**
- Verificação manual imediata
- Desabilitado durante verificação
- Mostra "⏳ Atualizando..."

### 5. **Info Box**
Explica como o monitor funciona:
- Atualização automática a cada 30 segundos
- Como interpretar os resultados
- O que significam erros comuns

---

## 🔄 Como funciona

### Verificação Automática
```typescript
// A cada 30 segundos, o componente:
1. Faz SELECT * em cada tabela
2. Conta quantos registros existem
3. Mede o tempo de resposta
4. Registra qualquer erro
5. Atualiza a interface
```

### Status Possíveis
- **✅ Conectado**: Tabela está acessível, mostra contagem de registros e tempo
- **❌ Erro**: Tabela inacessível, mostra mensagem de erro
- **⏳ Verificando**: Verificação em progresso

---

## 🎯 Casos de Uso

### Cenário 1: Tudo conectado ✅
```
Resultado esperado:
- Todas as tabelas mostram ✅
- Contagem de registros aparece
- Tempos de resposta < 100ms
→ Banco de dados funciona perfeitamente!
```

### Cenário 2: VIEW não existe
```
Se vw_simulados_com_questoes não existe:
- Simulados podem mostrar ✅ (tabela base existe)
- Componente buscarSimuladosDisponveis tenta VIEW
- Fallback automático usa tabela direta
→ App continua funcionando mesmo assim!
```

### Cenário 3: Permissão negada
```
Se RLS está bloqueando:
- Tabela mostra ❌ "permission denied"
- Tempo de resposta ainda é registrado
- Frontend vê o erro no console
→ Pode ser necessário ajustar RLS
```

### Cenário 4: Tabela não existe
```
Se tabela foi deletada:
- Mostra ❌ "Relation ... does not exist"
- App pode quebrar se depender desta tabela
→ Precisa recriar a tabela
```

---

## 🔍 Interpretando Tempos de Resposta

| Tempo | Interpretação |
|-------|--------------|
| < 50ms | Excelente ✅ |
| 50-100ms | Bom ✅ |
| 100-500ms | Aceitável ⚠️ |
| > 500ms | Lento ❌ |

---

## 📱 Interface em Diferentes Tamanhos

### Desktop (3 colunas)
```
┌─────────────────┬─────────────────┬─────────────────┐
│ usuarios        │ simulados       │ questoes        │
│ ✅ 25 registros │ ✅ 5 registros  │ ✅ 450 registros│
│ 45ms            │ 52ms            │ 38ms            │
└─────────────────┴─────────────────┴─────────────────┘
```

### Tablet (2 colunas)
```
┌─────────────────┬─────────────────┐
│ usuarios        │ simulados       │
│ ✅ 25 registros │ ✅ 5 registros  │
└─────────────────┴─────────────────┘
```

### Mobile (1 coluna)
```
┌─────────────────┐
│ usuarios        │
│ ✅ 25 registros │
│ 45ms            │
└─────────────────┘
```

---

## 🛠️ Como Testar

### Teste 1: Verificar Status Atual
1. Abra http://localhost:5173/monitor
2. Role até encontrar o monitor de banco de dados
3. Veja o status de cada tabela

### Teste 2: Atualização Automática
1. Deixe a página aberta por 1 minuto
2. Veja se "Última atualização" muda automaticamente
3. Ou clique "🔄 Atualizar Agora" para verificação imediata

### Teste 3: Simular Erro de Conexão
1. Desligue sua conexão com internet
2. Clique "🔄 Atualizar Agora"
3. Todas as tabelas devem mostrar ❌

### Teste 4: Verificar Contagem Real
1. No monitor, veja "Registros: X"
2. No Supabase SQL Editor, execute:
   ```sql
   SELECT COUNT(*) FROM usuarios;
   SELECT COUNT(*) FROM simulados;
   -- ... para cada tabela
   ```
3. Compare os números

---

## 💾 Dados Exibidos

O monitor **não altera** nada no banco de dados. Ele apenas:
- ✅ **Lê** o status de cada tabela
- ✅ **Conta** quantos registros existem
- ✅ **Mede** tempo de resposta
- ✅ **Captura** mensagens de erro

Nenhum dado é deletado, modificado ou enviado externamente.

---

## 🔐 Segurança

### RLS (Row Level Security)
- Se RLS está ativada, o monitor respeita as políticas
- Usuário autenticado vê apenas dados permitidos
- Usuário não autenticado vê apenas dados públicos

### Informações Sensíveis
- Nenhuma senha é exibida
- Chaves de API não aparecem
- Dados sensíveis não são logados

---

## 🐛 Troubleshooting

### Problema: Todas as tabelas mostram ❌
**Causa**: Conexão com Supabase desconectada
**Solução**: 
1. Verifique sua conexão com internet
2. Verifique se VITE_SUPABASE_URL está configurada
3. Verifique se o projeto Supabase está ativo

### Problema: Algumas tabelas mostram ❌
**Causa**: Tabela não existe ou permissão negada
**Solução**:
1. Verifique se tabela existe em Supabase
2. Verifique RLS policies
3. Verifique se user tem permissão SELECT

### Problema: Tempos de resposta muito altos (> 1s)
**Causa**: Banco de dados lento ou muitos registros
**Solução**:
1. Verifique carga do servidor Supabase
2. Adicione índices nas tabelas
3. Implemente paginação se tabelas são muito grandes

### Problema: "permission denied"
**Causa**: RLS bloqueando acesso
**Solução**:
```sql
-- Verificar policies em Supabase
SELECT * FROM pg_policies WHERE tablename = 'usuarios';

-- Se muito restritivo, considere:
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
```

---

## 📈 Como Usar para Monitoramento

### Daily Check
```
Todo dia pela manhã:
1. Abra /monitor
2. Veja se todas as tabelas estão ✅
3. Se houver ❌, investigar imediatamente
```

### Performance Tracking
```
Registre tempos de resposta:
- Hoje: simulados = 45ms
- Amanhã: simulados = 150ms ⚠️
- Investigar aumento
```

### Health Dashboard
```
Deixe a página aberta em um monitor:
- Identifique padrões de erro
- Veja picos de latência
- Detecte problemas antes do usuário relatar
```

---

## 🔧 Técnica: Como Funciona por Trás

```typescript
// Para cada tabela:
const { data, error, status } = await supabase
  .from('usuarios')
  .select('*', { 
    count: 'exact',  // Retorna contagem
    head: true       // Só header, sem dados
  });

// Resultado:
// - data: undefined (porque head: true)
// - error: mensagem se houver erro
// - status: número de registros
// - tempo: medido pelo performance.now()
```

---

## 🚀 Integração com Alertas (Futuro)

Possíveis melhorias:
```
- 📧 Email quando tabela ❌
- 🔔 Notificação no browser
- 📊 Gráfico de histórico
- 🎯 Alertas por tempo de resposta
- 📱 Mobile notification se erro crítico
```

---

## 📞 Resumo

| Aspecto | Descrição |
|--------|-----------|
| **O que é** | Monitor em tempo real de conexão com BD |
| **Onde fica** | /monitor (integrado na página de monitoramento) |
| **Atualiza** | A cada 30 segundos (automático) |
| **Mostra** | Status, contagem, tempo de resposta |
| **Não modifica** | Nenhum dado (read-only) |
| **Útil para** | Diagnosticar problemas de conectividade |

Acesse agora: **http://localhost:5173/monitor**
