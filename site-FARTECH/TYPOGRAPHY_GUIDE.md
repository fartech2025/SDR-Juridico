# 📝 Sistema de Tipografia Fartech

## Fontes Utilizadas

### Display (Headings)
**Sora** - Modern, Geometric, Professional
```
Weights: 600, 700
Usage: H1, H2, H3, H4, Buttons, Logo
Link: https://fonts.googleapis.com/css2?family=Sora:wght@600;700
```

### Body (Texto)
**Inter** - Clean, Legible, Versatile
```
Weights: 400, 500, 600, 700, 800
Usage: Parágrafos, listas, descrições
Link: https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800
```

---

## Escala Tipográfica

### Headings

#### H1 (Hero, Titles Principales)
```css
font-size: clamp(52px, 6.8vw, 84px)
line-height: 1.08
letter-spacing: -0.02em
font-weight: 700
font-family: Sora
color: var(--color-text)
```
**Uso:** Títulos principales de páginas, hero section

#### H2 (Section Titles)
```css
font-size: clamp(36px, 4vw, 56px)
line-height: 1.15
letter-spacing: -0.02em
font-weight: 700
font-family: Sora
color: var(--color-text)
```
**Uso:** Títulos de seções (Serviços, Cases, etc)

#### H3 (Card Titles)
```css
font-size: 1.15rem
line-height: 1.3
font-weight: 600
font-family: Sora
color: var(--color-text)
```
**Uso:** Títulos de cards, componentes

#### H4 (Footer, Small Titles)
```css
font-size: 0.95rem
line-height: 1.3
font-weight: 600
letter-spacing: 0.1em
text-transform: uppercase
font-family: Sora
color: var(--color-text)
```
**Uso:** Títulos de seções footer, labels

---

## Body Text

### Paragraph (Regular)
```css
font-size: 1rem
line-height: 1.6
letter-spacing: 0.01em
font-weight: 400
font-family: Inter
color: var(--color-text)
```
**Uso:** Texto comum, descrições

### Subtitle/Description
```css
font-size: 1.05rem
line-height: 1.6
font-weight: 400
font-family: Inter
color: var(--color-muted)
```
**Uso:** Subtítulos, descrições longas

### Small Text / Muted
```css
font-size: 0.93rem
line-height: 1.5
font-weight: 400
font-family: Inter
color: var(--color-muted)
```
**Uso:** Descrições de cards, textos secundários

### Extra Small
```css
font-size: 0.85rem
line-height: 1.4
font-weight: 500
font-family: Inter
color: var(--color-muted)
```
**Uso:** Labels, timestamps, informações auxiliares

---

## Button Text

### Primary / Secondary Button
```css
font-size: 0.93rem
line-height: 1.5
font-weight: 600
letter-spacing: 0.01em
font-family: Inter
color: #ffffff (primary) ou var(--color-accent) (secondary)
```
**Uso:** CTAs, buttons

---

## Eyebrow / Label

### Eyebrow Text
```css
font-size: 0.8rem
line-height: 1.4
letter-spacing: 0.18em
text-transform: uppercase
font-weight: 600
font-family: Inter
color: rgba(13, 17, 23, 0.55)
```
**Uso:** Labels acima de títulos, seções

### Eyebrow em Hero
```css
font-size: 0.8rem
letter-spacing: 0.24em
text-transform: uppercase
color: rgba(240, 246, 252, 0.75)
```

---

## Hierarquia Visual

```
H1 (52-84px)    ← Maior importância
    ↓
H2 (36-56px)
    ↓
H3 (1.15rem)
    ↓
Body (1rem)     ← Normal
    ↓
Small (0.93rem)
    ↓
XSmall (0.85rem) ← Menor importância
```

---

## Line Heights (Recomendado)

| Tipo | Line Height |
|------|-------------|
| Headings | 1.05 - 1.15 |
| Subtitles | 1.3 - 1.4 |
| Body Text | 1.6 |
| Labels | 1.4 |

---

## Letter Spacing

| Tipo | Letter Spacing |
|------|-----------------|
| Headings | -0.02em |
| Body | 0.01em |
| Labels/Eyebrow | 0.18em - 0.24em |
| Buttons | 0.01em |

---

## Combinações Comuns

### Hero Section
```
H1 (52-84px, -0.02em) + Eyebrow (0.8rem, 0.24em)
Subtitle (1.05rem, 1.6) + Button (0.93rem, 0.01em)
```

### Card
```
H3 (1.15rem, 600) + Description (0.95rem)
CTA Link (0.93rem, 600)
```

### Footer
```
H4 (0.95rem, uppercase, 0.1em) + Links (0.93rem)
Small (0.85rem) + Muted color
```

---

## Responsive Behavior

### Font Sizes usam `clamp()`
```css
/* H1 */
clamp(52px, 6.8vw, 84px)

/* H2 */
clamp(36px, 4vw, 56px)

/* Isso garante fluidez em qualquer tamanho de tela */
```

---

## Importação no HTML

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Sora:wght@600;700&display=swap" rel="stylesheet">
```

---

## Best Practices

✅ Use Sora apenas para headings (impacto visual)  
✅ Use Inter para body (legibilidade)  
✅ Mantenha contraste mínimo 4.5:1 para acessibilidade  
✅ Use line-height > 1.5 para textos longos  
✅ Limite font-weight a 400, 600, 700 em body  
✅ Use letter-spacing com cuidado (máximo 0.2em)  
✅ Respeite a hierarquia visual  

---

## Testing

Para validar tipografia:
1. Aumentar zoom do navegador a 200%
2. Usar ferramentas de contraste: WebAIM, WAVE
3. Testar em diferentes dispositivos
4. Validar com extensão lighthouse

---

**Última atualização:** 24 de novembro de 2025
