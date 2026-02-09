# 🎨 Design System - Sistema Jurídico SDR

**Data:** 14 de janeiro de 2026  
**Versão:** 1.0.0

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Cores](#cores)
3. [Tipografia](#tipografia)
4. [Espaçamento](#espaçamento)
5. [Componentes](#componentes)
6. [Como Usar](#como-usar)
7. [Boas Práticas](#boas-práticas)

---

## 🎯 Visão Geral

Este documento define o **Design System completo e centralizado** do Sistema Jurídico SDR. Todos os estilos, cores, componentes e tokens de design estão organizados em arquivos CSS modulares.

### 📁 Estrutura de Arquivos

```
src/styles/
├── design-tokens.css    # Tokens de design (cores, espaçamento, etc)
├── components.css       # Componentes reutilizáveis
└── dark-mode.css        # Estilos específicos do modo escuro

src/
└── index.css           # Importa todos os estilos + base styles
```

### ✅ Benefícios

- ✨ **Centralização**: Todos os estilos em um único lugar
- 🎨 **Consistência**: Tokens de design garantem uniformidade
- 🌙 **Dark Mode**: Suporte completo com transições suaves
- ♿ **Acessibilidade**: Cores com contraste adequado e escalas de fonte
- 🚀 **Performance**: CSS Variables com fallback automático
- 📱 **Responsivo**: Escalas de fonte e espaçamento adaptáveis

---

## 🎨 Cores

### Brand Colors (Cores da Marca)

Use **sempre** as variáveis CSS em vez de valores hardcoded:

```css
/* ✅ CORRETO */
.button {
  background-color: var(--brand-primary);
  color: white;
}

/* ❌ ERRADO */
.button {
  background-color: #721011;
  color: white;
}
```

#### Paleta Principal — Direito Jurídico

> **Regra de ouro**: As duas cores superiores (#721011 e #BF6F32) são para **botões e ações**.
> As duas inferiores (#6B5E58 e #000000) são para **textos**.

| Nome | Variável | Valor | Uso |
|------|----------|-------|-----|
| **Primary (Burgundy)** | `--brand-primary` | `#721011` | Botões primários, CTAs, ações principais |
| **Primary Dark** | `--brand-primary-dark` | `#4A0B0C` | Hover em botões primários |
| **Primary Light** | `--brand-primary-light` | `#A21617` | Backgrounds sutis, badges |
| **Accent (Amber)** | `--brand-accent` | `#BF6F32` | Botões secundários, destaques, ações alternativas |
| **Secondary (Warm Gray)** | `--brand-secondary` | `#6B5E58` | Texto secundário, labels, captions |
| **Text Primary** | `--color-text` | `#000000` | Títulos, texto principal, headings |

#### Escala Completa — Primary (Burgundy)

| Token | Valor | Uso |
|-------|-------|-----|
| `--brand-primary-900` | `#4A0B0C` | Hover escuro |
| `--brand-primary-800` | `#5C0D0E` | Pressed state |
| `--brand-primary-700` | `#721011` | **Cor principal (DEFAULT)** |
| `--brand-primary-600` | `#8A1314` | Variante média |
| `--brand-primary-500` | `#A21617` | Variante clara |
| `--brand-primary-100` | `#F5E6E6` | Background sutil |
| `--brand-primary-50` | `#FAF3F3` | Background extra sutil |

#### Escala Completa — Accent (Amber)

| Token | Valor | Uso |
|-------|-------|-----|
| `--brand-accent-700` | `#8F5225` | Hover escuro |
| `--brand-accent-600` | `#A66029` | Pressed state |
| `--brand-accent-500` | `#BF6F32` | **Cor principal (DEFAULT)** |
| `--brand-accent-400` | `#CC8652` | Variante média |
| `--brand-accent-300` | `#D99D72` | Variante clara |
| `--brand-accent-100` | `#F5E6DA` | Background sutil |

#### Classes Tailwind

```html
<!-- Background -->
<div class="bg-brand-primary">Primary (Burgundy)</div>
<div class="bg-brand-accent">Accent (Amber)</div>
<div class="bg-brand-secondary">Secondary (Warm Gray)</div>

<!-- Text -->
<p class="text-brand-primary">Texto burgundy</p>
<p class="text-brand-accent">Texto amber</p>
<p class="text-brand-secondary">Texto warm gray</p>

<!-- Border -->
<div class="border border-brand-primary">Com borda burgundy</div>
```

### Cores Semânticas

| Tipo | Variável | Cor | Uso |
|------|----------|-----|-----|
| **Success** | `--color-success` | 🟢 Verde | Confirmações, sucesso |
| **Warning** | `--color-warning` | 🟡 Amarelo | Avisos, atenção |
| **Danger** | `--color-danger` | 🔴 Vermelho | Erros, ações destrutivas |
| **Info** | `--color-info` | 🔵 Azul | Informações, dicas |

```html
<!-- Badges -->
<span class="badge badge-success">Ativo</span>
<span class="badge badge-warning">Pendente</span>
<span class="badge badge-danger">Cancelado</span>
<span class="badge badge-info">Informação</span>

<!-- Alerts -->
<div class="alert alert-success">Operação concluída!</div>
<div class="alert alert-danger">Erro ao processar</div>
```

### Cores de Superfície

| Nome | Variável | Dark Mode | Uso |
|------|----------|-----------|-----|
| **Base** | `--color-base` | `#0f172a` | Background principal |
| **Surface** | `--color-surface` | `#1e293b` | Cards, containers |
| **Surface Alt** | `--color-surface-alt` | `#334155` | Backgrounds alternativos |
| **Surface Hover** | `--color-surface-hover` | `#334155` | Estados de hover |

```html
<div class="bg-surface p-6 rounded-xl">
  <h2 class="text-text">Título</h2>
  <p class="text-text-muted">Descrição</p>
</div>
```

---

## 📝 Tipografia

### Famílias de Fonte

```css
--font-display: 'Space Grotesk'  /* Títulos e headings */
--font-body: 'Manrope'           /* Textos e conteúdo */
--font-mono: 'Fira Code'         /* Código e monospace */
```

```html
<h1 class="font-display">Título Principal</h1>
<p class="font-body">Conteúdo do texto</p>
<code class="font-mono">console.log('code')</code>
```

### Escalas de Tamanho

| Classe | Variável | Tamanho Base | Uso |
|--------|----------|--------------|-----|
| `text-xs` | `--font-xs` | 11px | Labels pequenos |
| `text-sm` | `--font-sm` | 13px | Texto secundário |
| `text-base` | `--font-base` | 15px | Texto padrão |
| `text-lg` | `--font-lg` | 17px | Texto destaque |
| `text-xl` | `--font-xl` | 21px | Subtítulos |
| `text-2xl` | `--font-2xl` | 26px | Títulos médios |
| `text-3xl` | `--font-3xl` | 34px | Títulos grandes |
| `text-4xl` | `--font-4xl` | 44px | Títulos hero |

**Nota:** Os tamanhos são **responsivos** e ajustados pela variável `--font-scale`.

### Pesos de Fonte

```html
<p class="font-light">Light (300)</p>
<p class="font-normal">Normal (400)</p>
<p class="font-medium">Medium (500)</p>
<p class="font-semibold">Semibold (600)</p>
<p class="font-bold">Bold (700)</p>
```

---

## 📏 Espaçamento

### Escala de Espaçamento

| Classe | Variável | Valor | Uso |
|--------|----------|-------|-----|
| `xs` | `--spacing-xs` | 4px | Espaçamentos mínimos |
| `sm` | `--spacing-sm` | 8px | Pequenos gaps |
| `md` | `--spacing-md` | 16px | Espaçamento padrão |
| `lg` | `--spacing-lg` | 24px | Seções |
| `xl` | `--spacing-xl` | 32px | Grandes seções |
| `2xl` | `--spacing-2xl` | 48px | Separadores |
| `3xl` | `--spacing-3xl` | 64px | Hero sections |

```html
<!-- Padding -->
<div class="p-md">Padding médio (16px)</div>
<div class="px-lg py-sm">Padding horizontal 24px, vertical 8px</div>

<!-- Margin -->
<div class="m-xl">Margin grande (32px)</div>
<div class="mb-2xl">Margin bottom 48px</div>

<!-- Gap (Flexbox/Grid) -->
<div class="flex gap-md">Gap de 16px entre itens</div>
```

### Border Radius

| Classe | Variável | Valor | Uso |
|--------|----------|-------|-----|
| `rounded-sm` | `--radius-sm` | 6px | Pequenos elementos |
| `rounded-md` | `--radius-md` | 8px | Padrão |
| `rounded-lg` | `--radius-lg` | 12px | Cards |
| `rounded-xl` | `--radius-xl` | 16px | Containers |
| `rounded-2xl` | `--radius-2xl` | 24px | Grandes cards |
| `rounded-3xl` | `--radius-3xl` | 32px | Hero elements |
| `rounded-pill` | `--radius-pill` | 9999px | Botões pill |

---

## 🧩 Componentes

### Buttons

```html
<!-- Primary Button -->
<button class="btn btn-primary">
  Salvar
</button>

<!-- Secondary Button -->
<button class="btn btn-secondary">
  Cancelar
</button>

<!-- Outline Button -->
<button class="btn btn-outline">
  Ver Mais
</button>

<!-- Ghost Button -->
<button class="btn btn-ghost">
  Fechar
</button>

<!-- Danger Button -->
<button class="btn btn-danger">
  Excluir
</button>

<!-- Tamanhos -->
<button class="btn btn-primary btn-sm">Pequeno</button>
<button class="btn btn-primary">Normal</button>
<button class="btn btn-primary btn-lg">Grande</button>
```

### Cards

```html
<!-- Card Básico -->
<div class="card">
  <h3 class="card-title">Título do Card</h3>
  <div class="card-body">
    <p>Conteúdo do card...</p>
  </div>
</div>

<!-- Card com Header e Footer -->
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Detalhes do Caso</h3>
  </div>
  
  <div class="card-body">
    <p>Informações detalhadas...</p>
  </div>
  
  <div class="card-footer">
    <button class="btn btn-primary">Ação</button>
  </div>
</div>

<!-- Card Interativo -->
<div class="card card-interactive">
  Clique em mim!
</div>

<!-- Card com Hover Effect -->
<div class="card card-hover">
  Passe o mouse aqui
</div>
```

### Forms

```html
<!-- Input Text -->
<div>
  <label class="label">Nome *</label>
  <input type="text" class="input" placeholder="Digite seu nome" />
</div>

<!-- Input com Erro -->
<div>
  <label class="label">Email *</label>
  <input type="email" class="input input-error" />
  <p class="text-danger text-sm mt-1">Email inválido</p>
</div>

<!-- Select -->
<div>
  <label class="label">Categoria</label>
  <select class="select">
    <option>Selecione...</option>
    <option>Trabalhista</option>
    <option>Cível</option>
  </select>
</div>

<!-- Textarea -->
<div>
  <label class="label">Observações</label>
  <textarea class="textarea" placeholder="Digite aqui..."></textarea>
</div>

<!-- Checkbox -->
<label class="flex items-center gap-2">
  <input type="checkbox" class="checkbox" />
  <span class="text-sm">Aceito os termos</span>
</label>

<!-- Radio -->
<label class="flex items-center gap-2">
  <input type="radio" name="tipo" class="radio" />
  <span class="text-sm">Opção 1</span>
</label>
```

### Badges

```html
<span class="badge badge-primary">Novo</span>
<span class="badge badge-success">Ativo</span>
<span class="badge badge-warning">Pendente</span>
<span class="badge badge-danger">Cancelado</span>
<span class="badge badge-info">Em análise</span>
<span class="badge badge-neutral">Neutro</span>
```

### Alerts

```html
<!-- Success Alert -->
<div class="alert alert-success">
  <svg><!-- ícone --></svg>
  <div>
    <h4 class="font-semibold">Sucesso!</h4>
    <p>Operação concluída com sucesso.</p>
  </div>
</div>

<!-- Danger Alert -->
<div class="alert alert-danger">
  <svg><!-- ícone --></svg>
  <div>
    <h4 class="font-semibold">Erro!</h4>
    <p>Ocorreu um erro ao processar.</p>
  </div>
</div>
```

### Loading States

```html
<!-- Spinner -->
<div class="spinner spinner-md text-brand-primary"></div>

<!-- Skeleton -->
<div class="space-y-3">
  <div class="skeleton-text"></div>
  <div class="skeleton-text w-3/4"></div>
  <div class="skeleton-text w-1/2"></div>
</div>

<!-- Skeleton Avatar + Text -->
<div class="flex items-center gap-3">
  <div class="skeleton-avatar"></div>
  <div class="flex-1 space-y-2">
    <div class="skeleton-text"></div>
    <div class="skeleton-text w-2/3"></div>
  </div>
</div>
```

---

## 🚀 Como Usar

### 1. Imports Já Configurados

Todos os estilos são importados automaticamente via `index.css`. **Não é necessário** importar manualmente.

### 2. Usar Classes Tailwind

```tsx
export default function MeuComponente() {
  return (
    <div className="bg-surface p-6 rounded-xl border border-border">
      <h2 className="text-2xl font-display font-semibold text-text mb-4">
        Título
      </h2>
      <p className="text-text-muted">
        Conteúdo do componente
      </p>
      <button className="btn btn-primary mt-4">
        Ação
      </button>
    </div>
  )
}
```

### 3. Usar Classes de Componentes

```tsx
export default function Card() {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Título</h3>
      </div>
      <div className="card-body">
        <p>Conteúdo</p>
      </div>
    </div>
  )
}
```

### 4. Usar Variáveis CSS Diretamente

```tsx
export default function CustomComponent() {
  return (
    <div style={{
      backgroundColor: 'var(--color-surface)',
      padding: 'var(--spacing-lg)',
      borderRadius: 'var(--radius-xl)',
    }}>
      Custom styled
    </div>
  )
}
```

---

## ✅ Boas Práticas

### ✨ DO (Faça)

```tsx
// ✅ Use variáveis CSS
<div className="bg-brand-primary text-white" />

// ✅ Use classes de componentes
<button className="btn btn-primary">Salvar</button>

// ✅ Use classes semânticas
<span className="badge badge-success">Ativo</span>

// ✅ Use classes de texto do design system
<p className="text-text-muted">Texto secundário</p>
```

### ❌ DON'T (Não faça)

```tsx
// ❌ Cores hardcoded
<div className="bg-[#10b981]" />

// ❌ Estilos inline sem necessidade
<div style={{ backgroundColor: '#10b981' }} />

// ❌ Classes Tailwind customizadas sem tokens
<div className="bg-gradient-to-br from-green-500" />

// ❌ Valores arbitrários quando há tokens
<div className="p-[23px]" /> // Use p-6 (24px) ou p-md
```

### 🎨 Substituições Recomendadas

| ❌ Antigo | ✅ Novo |
|----------|---------|
| `bg-white` | `bg-surface` |
| `bg-gray-100` | `bg-surface-alt` |
| `text-gray-900` | `text-text` |
| `text-gray-600` | `text-text-muted` |
| `text-gray-400` | `text-text-subtle` |
| `border-gray-300` | `border-border` |
| `bg-green-500` | `bg-brand-primary` |
| `bg-emerald-500` | `bg-brand-primary` |
| `bg-emerald-600` | `bg-brand-primary` |
| `bg-blue-600` | `bg-brand-primary` |
| `#10b981` | `var(--color-success)` |
| `#059669` | `var(--color-success-dark)` |
| `#0066cc` | `var(--brand-primary)` |
| `#721011` | `var(--brand-primary)` |
| `#BF6F32` | `var(--brand-accent)` |
| `#6B5E58` | `var(--brand-secondary)` |

---

## 🌙 Dark Mode

O dark mode é **automático** e funciona com a classe `html.dark`. Todas as variáveis CSS são atualizadas automaticamente.

### Como Funciona

```css
/* Light Mode */
:root {
  --color-surface: #ffffff;
  --color-text: #23263b;
}

/* Dark Mode */
html.dark {
  --color-surface: #1e293b;
  --color-text: #f1f5f9;
}
```

### Toggle Dark Mode

```tsx
// Já implementado no sistema
const { darkMode, toggleDarkMode } = useDarkMode()

<button onClick={toggleDarkMode}>
  {darkMode ? '🌙' : '☀️'}
</button>
```

---

## 📊 Estatísticas

- **Tokens de Design:** 150+
- **Componentes Prontos:** 20+
- **Variáveis CSS:** 100+
- **Tailwind Classes Customizadas:** 80+
- **Suporte Dark Mode:** 100%
- **Acessibilidade:** WCAG 2.1 AA

---

## 🔄 Migração

Para migrar código existente:

1. Substitua cores hardcoded por variáveis CSS
2. Use classes de componentes quando possível
3. Migre gradualmente, página por página
4. Teste em modo claro e escuro

---

## 📚 Referências

- [Tailwind CSS](https://tailwindcss.com)
- [CSS Variables](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [Design Tokens](https://www.designtokens.org)
- [Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Última Atualização:** 14 de janeiro de 2026  
**Mantido por:** Equipe Fartech
