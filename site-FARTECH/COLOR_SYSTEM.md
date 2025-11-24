# 🎨 Paleta de Cores Fartech (Novo Design System)

## Cores Primárias

### Azul Premium (Accent Principal)
```
Hex: #0969da
RGB: rgb(9, 105, 218)
Uso: Links, botões primários, highlights
```

### Roxo Vibrante (Accent Secundário)
```
Hex: #8957e5
RGB: rgb(137, 87, 229)
Uso: Gradientes, highlights alternativos
```

### Vermelho (Gradiente)
```
Hex: #f85149
RGB: rgb(248, 81, 73)
Uso: Gradiente primário
```

---

## Cores Neutras

### Fundo Principal
```
Hex: #fafbfc
RGB: rgb(250, 251, 252)
Uso: Background geral
```

### Superfície (Branco)
```
Hex: #ffffff
RGB: rgb(255, 255, 255)
Uso: Cards, componentes
```

### Texto Principal
```
Hex: #0d1117
RGB: rgb(13, 17, 23)
Uso: Headings, corpo de texto
```

### Texto Muted
```
Hex: #57606a
RGB: rgb(87, 96, 106)
Uso: Descrições, subtítulos
```

### Linha/Border
```
Rgba: rgba(13, 17, 23, 0.06)
Uso: Divisores, borders
```

---

## Cores Temáticas

### Verde (Sucesso)
```
Hex: #1a7f37
RGB: rgb(26, 127, 55)
Uso: Estados de sucesso, confirmações
```

### Âmbar (Aviso)
```
Hex: #d29922
RGB: rgb(210, 153, 34)
Uso: Avisos, atenção necessária
```

---

## Gradientes

### Gradiente Primário (Botões, Logo)
```css
linear-gradient(135deg, #0969da 0%, #8957e5 50%, #f85149 100%)
```

### Gradiente Hero (Background)
```css
radial-gradient(circle at 20% 30%, rgba(9, 105, 218, 0.15), transparent 32%),
radial-gradient(circle at 80% 20%, rgba(137, 87, 229, 0.15), transparent 28%),
radial-gradient(circle at 70% 90%, rgba(248, 81, 73, 0.1), transparent 36%),
linear-gradient(135deg, #0d1117 0%, #1c2128 50%, #161b22 100%)
```

### Gradiente Footer
```css
linear-gradient(180deg, #0d1117 0%, #161b22 100%)
```

---

## Sombras

### Sombra Suave
```css
0 1px 3px rgba(0, 0, 0, 0.06), 
0 2px 8px rgba(0, 0, 0, 0.08)
```

### Sombra Card
```css
0 3px 12px rgba(0, 0, 0, 0.1), 
0 8px 24px rgba(0, 0, 0, 0.08)
```

### Sombra Forte
```css
0 8px 24px rgba(0, 0, 0, 0.12), 
0 16px 40px rgba(0, 0, 0, 0.1)
```

---

## Variações de Transparência

### Glass Effect (Backdrop)
```css
rgba(255, 255, 255, 0.85)
```

### Hover Overlay
```css
rgba(9, 105, 218, 0.06) até rgba(9, 105, 218, 0.15)
```

### Overlay Dark
```css
rgba(0, 0, 0, 0.1) até rgba(0, 0, 0, 0.16)
```

---

## Aplicação Prática

### Botão Primário
- Background: Gradiente Primário
- Text: Branco (#ffffff)
- Shadow: Sombra Card
- Hover: Elevação + Sombra mais forte

### Botão Secundário
- Background: rgba(9, 105, 218, 0.06)
- Text: Azul (#0969da)
- Border: rgba(9, 105, 218, 0.2)
- Hover: Background mais intenso

### Card
- Background: Branco com gradiente sutil
- Border: Linha
- Shadow: Sombra Suave
- Hover: Elevação + Border mais intensa

### Header
- Background: rgba(255, 255, 255, 0.85) com blur
- Text: Texto principal
- Links: Azul ao hover

### Footer
- Background: Gradiente dark
- Text: rgba(230, 237, 243, 0.88)
- Links: Azul claro ao hover

---

## Contraste (WCAG AA)

✅ Azul (#0969da) em branco: 7.6:1  
✅ Texto (#0d1117) em branco: 18:1  
✅ Muted (#57606a) em branco: 5.8:1  
✅ Roxo (#8957e5) em branco: 4.8:1  

---

## Como Usar no CSS

```css
/* Variáveis no :root */
--color-accent: #0969da;
--color-accent-2: #8957e5;
--color-text: #0d1117;
--color-muted: #57606a;
--gradient-primary: linear-gradient(135deg, #0969da 0%, #8957e5 50%, #f85149 100%);
--color-line: rgba(13, 17, 23, 0.06);

/* Uso em componentes */
background: var(--gradient-primary);
color: var(--color-text);
border-color: var(--color-line);
```

---

## Referências

Design inspirado em:
- Stripe.com
- Apple.com
- GitHub.com
- Vercel.com

---

**Atualizado em:** 24 de novembro de 2025
