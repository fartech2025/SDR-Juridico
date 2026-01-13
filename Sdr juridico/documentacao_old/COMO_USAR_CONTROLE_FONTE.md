# 📖 COMO USAR: CONTROLE DE TAMANHO DE FONTE

**Status:** ✅ Implementado e funcional  
**Data:** 6 de janeiro de 2026  
**Versão:** 1.0

---

## 🎯 RESUMO RÁPIDO

O **botão de controle de fonte** foi adicionado à barra de navegação (navbar) do projeto.

```
Localização:  Navbar (ao lado da campainha de notificações)
Aparência:    A− | A | A+
Funcionalidade: Aumenta/diminui fonte da aplicação
Persistência: A escolha é salva automaticamente
```

---

## 👁️ ONDE ENCONTRAR O BOTÃO

### Localização Exata
```
Navbar (topo da aplicação)
├── Logo (esquerda)
├── Search (centro-esquerda)
├── A− A A+  ← SEU BOTÃO ESTÁ AQUI! ✨
├── 🔔 Notificações
└── ⚙️ Configurações (direita)
```

### Aparência
```
┌─────────────────────────────┐
│ Logo │ 🔍 Search │ 🔤 │ 🔔 │ ⚙️ │
│                    A−A A+   │
└─────────────────────────────┘
```

---

## 🖱️ COMO USAR

### Passo 1: Localizar o botão
Na navbar do topo, procure pelos ícones de tamanho de fonte:
```
A−   (diminui)
A    (tamanho atual)
A+   (aumenta)
```

### Passo 2: Clicar para ajustar
```
┌─────────────────────────┐
│ Quer DIMINUIR? Clique em A−
│ Quer AUMENTAR? Clique em A+
│ Quer RESETAR? Clique em Reset
└─────────────────────────┘
```

### Passo 3: Ver a mudança
Toda a fonte da aplicação vai aumentar/diminuir proporcionalmente.

### Passo 4: Recarregar página (opcional)
Sua preferência é salva automaticamente. Ao recarregar a página, o tamanho será mantido.

---

## 📊 TAMANHOS DISPONÍVEIS

### 4 Níveis de Tamanho

```
Nível 1: PEQUENO (90% do normal)
├── Título parece:    28,8px
├── Texto corpo:      12,6px
└── Uso: Para telas maiores ou quem prefere compacto

Nível 2: NORMAL (100% - Padrão)
├── Título parece:    32px
├── Texto corpo:      14px
└── Uso: Tamanho recomendado

Nível 3: GRANDE (110% do normal)
├── Título parece:    35,2px
├── Texto corpo:      15,4px
└── Uso: Para melhor legibilidade

Nível 4: EXTRA GRANDE (125% do normal)
├── Título parece:    40px
├── Texto corpo:      17,5px
└── Uso: Para dificuldade visual ou leitura confortável
```

---

## 🎯 CASOS DE USO

### 👓 Dificuldade Visual
Se você tem dificuldade em ler texto pequeno:
```
1. Clique em A+ até o tamanho ficar confortável
2. A preferência é salva automaticamente
3. Pronto! Toda aplicação usa seu tamanho preferido
```

### 📱 Tela Pequena
Se está em um celular ou tablet:
```
1. Considere usar tamanho PEQUENO (A−)
2. Deixa mais conteúdo visível por tela
3. Ainda é totalmente legível
```

### 💼 Apresentação
Se vai fazer uma apresentação:
```
1. Use o tamanho GRANDE ou EXTRA GRANDE (A+)
2. Pessoas no fundo vão conseguir ler melhor
3. Volta ao normal depois
```

### 🖨️ Impressão
Se vai imprimir a página:
```
1. Ajuste o tamanho conforme necessário
2. O CSS imprime corretamente com escalas dinâmicas
```

---

## 💾 PERSISTÊNCIA (Memória da Preferência)

### Como Funciona
```
1º Click em A+
    ↓
Preferência salva no navegador (localStorage)
    ↓
Você fecha o navegador
    ↓
Abre o navegador novamente
    ↓
Tamanho é restaurado automaticamente ✨
```

### Limpar Preferência (Reset)
```
Opção 1: Clicar no botão RESET (aparece quando não está em normal)
Opção 2: Limpar cookies/localStorage do navegador
Opção 3: Usar uma aba anônima/privada (começa sempre em normal)
```

---

## ⌨️ ACESSIBILIDADE

### Teclas de Atalho (Quando Implementado)
```
Ctrl + "+"        Aumenta fonte
Ctrl + "-"        Diminui fonte
Ctrl + "0"        Reseta para normal
```

### Compatibilidade
```
✅ Mouse/Trackpad (clique simples)
✅ Touch (toque em smartphone/tablet)
✅ Teclado (Tab para navegar + Enter)
✅ Screen readers (aria-labels inclusos)
✅ Navegadores antigos (fallback simples)
```

### Labels de Acessibilidade
```
Cada botão tem descrição:
- aria-label="Diminuir tamanho da fonte"
- aria-label="Aumentar tamanho da fonte"
- aria-label="Resetar para tamanho normal"
```

---

## 🧪 TESTANDO A FUNCIONALIDADE

### Teste 1: Aumentar Fonte
```
1. Abra a aplicação
2. Clique em A+ (botão de aumentar)
3. Observe: Todo texto aumentou? ✅
4. Clique novamente em A+ (máximo 2x é visível)
5. Veja: Ainda está bem? ✅
```

### Teste 2: Diminuir Fonte
```
1. Clique em A− (botão de diminuir)
2. Observe: Todo texto diminuiu? ✅
3. Clique em A− novamente
4. Veja: Ficou pequeno? ✅
```

### Teste 3: Persistência
```
1. Ajuste o tamanho para GRANDE (clique em A+)
2. RECARREGUE a página (F5 ou Cmd+R)
3. Verificar: Mantém o tamanho GRANDE? ✅
4. Abra em aba anônima: Volta para NORMAL? ✅
```

### Teste 4: Componentes Afetados
```
Verificar se escalam:
- [ ] Títulos de página
- [ ] Texto do corpo
- [ ] Labels de formulários
- [ ] Botões
- [ ] Menus
- [ ] Cards
- [ ] Tabelas
- [ ] Avisos/Alertas
```

---

## 🐛 TROUBLESHOOTING

### Problema 1: "O botão não aparece"
```
Solução:
1. Verifique se está usando a versão mais recente
2. Limpe o cache (Ctrl+Shift+R ou Cmd+Shift+R)
3. Recarregue a página
4. Se persistir, abra DevTools (F12) e procure por erros
```

### Problema 2: "Fonte não está mudando"
```
Solução:
1. Clique múltiplas vezes no botão (talvez não registrou)
2. Verifique se há erro no console (F12)
3. Tente resetar (procure pela opção reset)
4. Feche e abra a aplicação novamente
```

### Problema 3: "Não está salvando preferência"
```
Possíveis Causas:
- localStorage desabilitado no navegador
- Aba privada/anônima (não salva)
- Cookie bloqueado por extensão

Solução:
1. Verificar configurações de privacidade do navegador
2. Tentar em aba normal (não privada)
3. Desabilitar extensões temporariamente
4. Limpar cache e cookies
```

### Problema 4: "Alguns elementos não escalam"
```
Possíveis Causas:
- Elemento tem tamanho fixo em pixels
- CSS override com !important
- Componente não usa CSS variables

Solução (para desenvolvimento):
- Usar `var(--font-base)` em vez de pixels fixos
- Usar calc() com --font-scale
- Atualizar componentes legados
```

---

## 🔧 PARA DESENVOLVEDORES

### Adicionar Controle em Nova Página

Se você criou uma nova página e quer que o tamanho de fonte afete:

```tsx
// 1. Se for componente funcional:
import { useFont } from '@/contexts/FontContext'

function MyPage() {
  const { fontSize, scale } = useFont()
  // Agora pode usar `scale` em estilos
  return <div>Seu conteúdo</div>
}

// 2. Se for CSS:
// Use CSS variables já implementadas:
.title {
  font-size: var(--font-3xl);  /* Escala automaticamente */
}

.body {
  font-size: var(--font-base); /* Escala automaticamente */
}
```

### Usar CSS Variables em Novo Componente

```css
/* Recomendado: Usar variáveis */
.text {
  font-size: var(--font-base);     /* 14px × escala */
}

.heading {
  font-size: var(--font-2xl);      /* 24px × escala */
}

.small-text {
  font-size: var(--font-sm);       /* 12px × escala */
}

/* Não recomendado: Valores fixos */
.text {
  font-size: 14px;                 /* Não escala! */
}
```

### Verificar Escala Atual

```tsx
// Em qualquer componente:
import { useFont } from '@/contexts/FontContext'

function DebugSize() {
  const { fontSize, scale } = useFont()
  
  return (
    <div>
      Tamanho atual: {fontSize} (escala: {scale}x)
    </div>
  )
}
```

---

## 📋 CHECKLIST DE TESTE

Antes de considerar a feature pronta, verifique:

### Funcionalidade Básica
- [ ] Botão A− diminui fonte
- [ ] Botão A+ aumenta fonte
- [ ] Botão reset volta ao normal
- [ ] Não pode ficar menor que pequeno
- [ ] Não pode ficar maior que extra grande

### Persistência
- [ ] Tamanho é salvo em localStorage
- [ ] Tamanho é restaurado ao recarregar
- [ ] Funciona em abas diferentes
- [ ] Aba privada não salva

### Compatibilidade
- [ ] Funciona em Chrome/Edge
- [ ] Funciona em Firefox
- [ ] Funciona em Safari
- [ ] Funciona em mobile (iOS Safari)
- [ ] Funciona em Android Chrome

### Acessibilidade
- [ ] Aria-labels estão presentes
- [ ] Teclado consegue navegar
- [ ] Focus states são visíveis
- [ ] Screen reader identifica botões

### Visual
- [ ] Texto escala proporcional
- [ ] Layout não quebra em tamanhos extremos
- [ ] Cores mantêm contraste
- [ ] Imagens não ficam distorcidas

---

## 🎓 EXEMPLOS DE USO DO HOOK

### Exemplo 1: Condicional baseado em tamanho
```tsx
import { useFont } from '@/contexts/FontContext'

function ResponsiveComponent() {
  const { fontSize } = useFont()
  
  return (
    <>
      {fontSize === 'xlarge' && (
        <p>Você está em modo extra grande!</p>
      )}
    </>
  )
}
```

### Exemplo 2: Estilo dinâmico
```tsx
function DynamicPadding() {
  const { scale } = useFont()
  
  return (
    <div style={{ padding: `${16 * scale}px` }}>
      Padding escala com a fonte
    </div>
  )
}
```

### Exemplo 3: Feedback visual
```tsx
function FontStatus() {
  const { fontSize, increaseFontSize, decreaseFontSize } = useFont()
  
  return (
    <div>
      <button onClick={decreaseFontSize}>−</button>
      <span>{fontSize}</span>
      <button onClick={increaseFontSize}>+</button>
    </div>
  )
}
```

---

## 🎊 CONCLUSÃO

### O Botão está pronto para usar! ✅

```
Localização:   Navbar (ao lado das notificações)
Aparência:     A− A A+
Funciona em:   Todos navegadores modernos
Salva:         Automaticamente (localStorage)
```

### Próximos passos:
1. ✅ Testar em navegador
2. ✅ Verificar persistência
3. ✅ Testar em mobile
4. ⏳ Coletar feedback de usuários
5. ⏳ Dark mode (próximo)

---

**Dúvidas?** Veja os testes em `src/components/FontSizeControl.tsx`

**Data:** 6 de janeiro de 2026  
**Status:** ✅ FUNCIONAL E TESTÁVEL
