# 📖 Guia de Uso - Sistema de Estilos Modernos

## 🎯 Introdução Rápida

O sistema de estilos modernos foi implementado com classes CSS prontas para uso em qualquer componente React. Basta adicionar as classes aos elementos HTML para aplicar efeitos incríveis!

---

## 1️⃣ Efeitos de Hover e Transformação

### Cards que Sobem
```tsx
import BasePage from '@/components/BasePage';

export default function MinhaPage() {
  return (
    <BasePage>
      <div className="card-premium">
        <h2>Meu Card Premium</h2>
        <p>Este card sobe quando você passa o mouse</p>
      </div>
    </BasePage>
  );
}
```

**Resultado**: Card sobe 6px e escala 2% ao passar o mouse

### Imagens com Glow
```tsx
<img 
  src="/minha-imagem.jpg" 
  alt="Descrição"
  className="img-hover-glow rounded-lg"
/>
```

**Resultado**: Imagem fica mais brilhante e com glow ao passar o mouse

---

## 2️⃣ Animações de Entrada

### Animar ao Carregar
```tsx
export default function MeuComponente() {
  return (
    <div>
      <h1 className="text-hero animate-fade-in-up">
        Bem-vindo!
      </h1>
      <p className="text-subtitle animate-slide-in-left">
        Descrição que entra da esquerda
      </p>
      <p className="animate-slide-in-right">
        Descrição que entra da direita
      </p>
    </div>
  );
}
```

**Resultado**:
- Título aparece subindo
- Descrição da esquerda aparece deslizando
- Descrição da direita aparece deslizando

---

## 3️⃣ Texto com Efeitos

### Texto com Glow
```tsx
<h2 className="text-glow">
  Sistema de Estudos ENEM
</h2>
```

### Texto Premium (Gradiente)
```tsx
<h1 className="text-premium">
  Preparação para o Sucesso
</h1>
```

### Texto 3D
```tsx
<p className="text-3d">
  Efeito 3D incível
</p>
```

### Texto com Sombra Neon
```tsx
<span className="text-shadow-neon">
  Neon Text
</span>
```

---

## 4️⃣ Cards Modernos

### Card Premium (Melhor)
```tsx
<div className="card-premium">
  <h3>Conteúdo Premium</h3>
  <p>Usa vidro fosco com glow e efeito hover</p>
</div>
```

**Efeitos**: Vidro, sombra neon, hover lift

### Card Moderno
```tsx
<div className="card-modern">
  <h3>Conteúdo Moderno</h3>
  <p>Usa vidro simples com hover lift</p>
</div>
```

**Efeitos**: Vidro, hover lift

### Card com Accent (Roxo)
```tsx
<div className="card-accent">
  <h3>Conteúdo Accent</h3>
  <p>Usa gradiente roxo com hover lift</p>
</div>
```

**Efeitos**: Gradiente roxo, hover lift

---

## 5️⃣ Botões Estilizados

### Botão Primário (Azul)
```tsx
<button className="btn-primary">
  Clique Aqui
</button>
```

**Efeitos**: Gradiente azul, glow ao hover, scale

### Botão Secundário (Roxo)
```tsx
<button className="btn-secondary">
  Opção Secundária
</button>
```

**Efeitos**: Roxo, vidro, glow ao hover

### Botão Sucesso (Verde)
```tsx
<button className="btn-success">
  Confirmar
</button>
```

**Efeitos**: Gradiente verde, glow ao hover

### Botão Moderno (Vidro)
```tsx
<button className="btn-modern">
  Ação
</button>
```

**Efeitos**: Vidro, glow ao hover

---

## 6️⃣ Badges e Rótulos

### Badge Primário
```tsx
<span className="badge-primary">Em Andamento</span>
```

### Badge Sucesso
```tsx
<span className="badge-success">Concluído</span>
```

### Badge Aviso
```tsx
<span className="badge-warning">Atenção</span>
```

### Badge Erro
```tsx
<span className="badge-error">Erro</span>
```

---

## 7️⃣ Inputs e Formulários

### Input Moderno
```tsx
<input 
  type="text" 
  placeholder="Digite aqui..."
  className="input-modern"
/>
```

**Efeitos**: Vidro, glow ao focar

---

## 8️⃣ Efeitos de Vidro (Glassmorphism)

### Glass Effect Padrão
```tsx
<div className="glass-effect p-6 rounded-lg">
  Conteúdo com vidro
</div>
```

### Glass Effect Forte
```tsx
<div className="glass-effect-strong p-6 rounded-lg">
  Vidro mais opaco
</div>
```

### Glass Effect Azul
```tsx
<div className="glass-effect-primary p-6 rounded-lg">
  Vidro com tint azul
</div>
```

### Glass Effect Roxo
```tsx
<div className="glass-effect-accent p-6 rounded-lg">
  Vidro com tint roxo
</div>
```

---

## 9️⃣ Sombras e Glow

### Sombra Neon
```tsx
<div className="shadow-neon p-6 rounded-lg">
  Com sombra neon
</div>
```

### Sombra Profunda
```tsx
<div className="shadow-deep p-6 rounded-lg">
  Com sombra 3D profunda
</div>
```

### Sombra Colorida (Azul)
```tsx
<div className="shadow-color-primary p-6 rounded-lg">
  Sombra azul
</div>
```

### Sombra Colorida (Roxo)
```tsx
<div className="shadow-color-accent p-6 rounded-lg">
  Sombra roxo
</div>
```

---

## 🔟 Recortes Criativos (Clip-Path)

### Diamante
```tsx
<div className="clip-diamond w-40 h-40 bg-blue-600">
  Forma Diamante
</div>
```

### Círculo
```tsx
<div className="clip-circle w-40 h-40 bg-blue-600">
  Forma Círculo
</div>
```

### Hexágono
```tsx
<div className="clip-hexagon w-40 h-40 bg-blue-600">
  Forma Hexágono
</div>
```

### Onda
```tsx
<div className="clip-wave w-full h-24 bg-blue-600">
  Forma Onda
</div>
```

---

## 1️⃣1️⃣ Arredondamentos

### Suave (16px)
```tsx
<div className="rounded-soft p-6">
  Cantos arredondados 16px
</div>
```

### Médio (24px)
```tsx
<div className="rounded-medium p-6">
  Cantos arredondados 24px
</div>
```

### Agressivo (32px)
```tsx
<div className="rounded-aggressive p-6">
  Cantos arredondados 32px
</div>
```

---

## 1️⃣2️⃣ Combinações Úteis

### Card Premium + Animation
```tsx
<div className="card-premium animate-fade-in-up">
  <h3>Título Animado</h3>
  <p>Aparece com animação linda</p>
</div>
```

### Botão + Hover Transform
```tsx
<button className="btn-primary transform hover:scale-110">
  Botão com Transform Extra
</button>
```

### Texto Hero + Glow
```tsx
<h1 className="text-premium text-glow text-center">
  Título Épico
</h1>
```

### Grid com Cards
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <div className="card-premium">Card 1</div>
  <div className="card-premium">Card 2</div>
  <div className="card-premium">Card 3</div>
</div>
```

---

## 1️⃣3️⃣ Exemplo Completo - Dashboard

```tsx
import BasePage from '@/components/BasePage';

export default function Dashboard() {
  return (
    <BasePage>
      {/* Header com Animação */}
      <div className="mb-12">
        <h1 className="text-hero animate-fade-in-up">
          Bem-vindo ao Dashboard
        </h1>
        <p className="text-subtitle animate-slide-in-left mt-2">
          Preparação Inteligente para o ENEM
        </p>
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <div className="card-premium animate-fade-in-up">
          <h3 className="text-accent text-xl font-bold mb-2">
            Questões Resolvidas
          </h3>
          <p className="text-4xl font-bold mb-4">1,250</p>
          <span className="badge-success">+15% este mês</span>
        </div>

        <div className="card-premium animate-fade-in-up">
          <h3 className="text-accent text-xl font-bold mb-2">
            Taxa de Acerto
          </h3>
          <p className="text-4xl font-bold mb-4">82%</p>
          <span className="badge-success">Excelente</span>
        </div>

        <div className="card-accent animate-fade-in-up">
          <h3 className="text-accent text-xl font-bold mb-2">
            Tempo de Estudo
          </h3>
          <p className="text-4xl font-bold mb-4">42h</p>
          <span className="badge-warning">Continue estudando</span>
        </div>
      </div>

      {/* Seção com Botões */}
      <div className="card-premium p-8 text-center">
        <h2 className="text-2xl font-bold mb-6">Próximas Ações</h2>
        <div className="flex flex-wrap gap-4 justify-center">
          <button className="btn-primary">
            Resolver Questões
          </button>
          <button className="btn-secondary">
            Ver Estatísticas
          </button>
          <button className="btn-success">
            Completar Simulado
          </button>
        </div>
      </div>
    </BasePage>
  );
}
```

---

## 1️⃣4️⃣ Dicas de Performance

### Evitar Muitos Efeitos Simultâneos
```tsx
// ❌ Evite muitos efeitos
<div className="shadow-neon blur-lg rotate-3d animate-pulse card-premium">

// ✅ Melhor - Selecione efeitos apropriados
<div className="card-premium animate-fade-in-up">
```

### Usar Lazy Loading para Imagens
```tsx
<img 
  src="/imagem.jpg" 
  alt="Descrição"
  loading="lazy"
  className="img-hover-glow"
/>
```

### Limitadas a Páginas Importantes
```tsx
// ✅ Use animações em landing pages
// ✅ Use cards premium em dashboards
// ⚠️ Minimize animações em mobile
```

---

## 1️⃣5️⃣ Troubleshooting

### Efeito não aparece
- Verifique se a classe está no HTML correto
- Abra DevTools (F12) e procure pela classe
- Verifique se o CSS está importado em index.css

### Animação muito rápida
- Aumente a duração em `components.css`
- Exemplo: `animation: slideInLeft 1s ease-out;` (era 0.6s)

### Glassmorphism não funciona
- Verifique suporte do browser
- Use fallback: `background: rgba(15, 23, 42, 0.8);`

### Performance ruim
- Reduza número de elementos animados
- Use `will-change` com moderação
- Minimize efeitos de `filter` pesados

---

## 🎓 Aprenda Mais

**Arquivos de Referência**:
- `/app/src/styles/modern-effects.css` - Todos os efeitos
- `/app/src/styles/components.css` - Componentes
- `/app/src/components/BasePage.tsx` - Exemplo de uso
- `RELATORIO_DESIGN_MODERNO.md` - Documentação técnica completa

---

## ✨ Boa Sorte! 

Agora você tem um sistema profissional de estilos modernos para criar interfaces incríveis! 🚀
