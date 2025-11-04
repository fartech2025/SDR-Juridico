<!-- ARQUIVO DE REFERÊNCIA RÁPIDA - EXEMPLOS DE CÓDIGO -->

# 🚀 Referência Rápida - Snippets de Código

## 1. Dashboard com Cards Premium

```tsx
// src/pages/Dashboard.tsx
import BasePage from '@/components/BasePage';

export default function Dashboard() {
  return (
    <BasePage>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-hero animate-fade-in-up">
            Bem-vindo ao seu Dashboard
          </h1>
          <p className="text-subtitle animate-slide-in-left mt-4">
            Acompanhe seu progresso nos estudos
          </p>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Questões Resolvidas', value: '1.250', badge: 'badge-success' },
            { label: 'Taxa de Acerto', value: '82%', badge: 'badge-success' },
            { label: 'Tempo de Estudo', value: '42h', badge: 'badge-warning' },
            { label: 'Ranking Geral', value: '#15', badge: 'badge-primary' },
          ].map((stat, i) => (
            <div
              key={i}
              className="card-premium animate-fade-in-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <p className="text-sm text-slate-400 mb-2">{stat.label}</p>
              <p className="text-3xl font-bold text-blue-400 mb-3">{stat.value}</p>
              <span className={`badge ${stat.badge}`}>
                {stat.badge === 'badge-success' ? '✓ Bom' : 'ℹ Info'}
              </span>
            </div>
          ))}
        </div>

        {/* Featured Section */}
        <div className="card-premium p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Simulado Completo</h2>
          <p className="text-slate-300 mb-6">
            Teste seus conhecimentos em uma prova simulada completa
          </p>
          <button className="btn-primary mr-4">Começar Simulado</button>
          <button className="btn-secondary">Ver Histórico</button>
        </div>
      </div>
    </BasePage>
  );
}
```

---

## 2. Card com Todos os Efeitos

```tsx
// Exemplo de card com múltiplos efeitos
<div className="card-premium hover:shadow-neon transition-all">
  <img src="/image.jpg" alt="Preview" className="img-hover-glow rounded-lg mb-4" />
  
  <h3 className="text-premium text-xl font-bold mb-2">
    Título Premium
  </h3>
  
  <p className="text-slate-300 mb-4">
    Descrição do conteúdo
  </p>
  
  <div className="flex gap-2">
    <button className="btn-primary flex-1">Ação Primária</button>
    <button className="btn-secondary flex-1">Ação Secundária</button>
  </div>
</div>
```

---

## 3. Formulário Moderno

```tsx
// src/components/ModernForm.tsx
export default function ModernForm() {
  return (
    <div className="card-premium max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-blue-400">
        Formulário Moderno
      </h2>
      
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Email
          </label>
          <input
            type="email"
            placeholder="seu@email.com"
            className="input-modern"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Senha
          </label>
          <input
            type="password"
            placeholder="••••••••"
            className="input-modern"
          />
        </div>
        
        <div className="pt-4">
          <button type="submit" className="btn-primary w-full">
            Entrar
          </button>
        </div>
      </form>
    </div>
  );
}
```

---

## 4. Header Customizado

```tsx
// src/components/CustomHeader.tsx
import BasePage from './BasePage';

export default function PageWithCustomHeader() {
  return (
    <BasePage>
      {/* Custom Section com Glass Effect */}
      <div className="glass-effect p-8 rounded-2xl mb-8 animate-fade-in-up">
        <h2 className="text-hero mb-4">Seção Especial</h2>
        <p className="text-slate-300">
          Esta seção usa o efeito glass com backdrop-filter
        </p>
      </div>

      {/* Conteúdo Normal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-modern">Card 1</div>
        <div className="card-accent">Card 2</div>
      </div>
    </BasePage>
  );
}
```

---

## 5. Modal/Dialog Moderno

```tsx
// src/components/ModernModal.tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function ModernModal({
  isOpen,
  onClose,
  title,
  children,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="card-premium max-w-md w-full mx-4 animate-fade-in-up">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-blue-400">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        <div className="mb-6">{children}</div>

        <div className="flex gap-4">
          <button className="btn-secondary flex-1">Cancelar</button>
          <button className="btn-primary flex-1">Confirmar</button>
        </div>
      </div>
    </div>
  );
}
```

---

## 6. Galeria de Imagens

```tsx
// src/components/ImageGallery.tsx
export default function ImageGallery() {
  const images = [
    '/img1.jpg',
    '/img2.jpg',
    '/img3.jpg',
    '/img4.jpg',
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {images.map((img, i) => (
        <div
          key={i}
          className="card-modern overflow-hidden cursor-pointer group"
        >
          <img
            src={img}
            alt={`Image ${i}`}
            className="img-hover-glow w-full h-40 object-cover transition-transform group-hover:scale-110"
          />
          <p className="p-3 text-sm text-slate-300">Imagem {i + 1}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## 7. Lista com Animações

```tsx
// src/components/AnimatedList.tsx
interface Item {
  id: string;
  title: string;
  status: 'success' | 'warning' | 'error' | 'primary';
}

interface AnimatedListProps {
  items: Item[];
}

export default function AnimatedList({ items }: AnimatedListProps) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={item.id}
          className="card-modern p-4 animate-fade-in-up"
          style={{ animationDelay: `${i * 0.05}s` }}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{item.title}</h3>
            <span className={`badge badge-${item.status}`}>
              {item.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 8. Tabs com Efeitos

```tsx
// src/components/ModernTabs.tsx
import { useState } from 'react';

const tabs = [
  { id: 'tab1', label: 'Questões', icon: '📝' },
  { id: 'tab2', label: 'Simulados', icon: '🎯' },
  { id: 'tab3', label: 'Estatísticas', icon: '📊' },
];

export default function ModernTabs() {
  const [activeTab, setActiveTab] = useState('tab1');

  return (
    <div className="card-premium">
      {/* Tab Buttons */}
      <div className="flex gap-2 mb-6 border-b border-slate-700 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-neon'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in-up">
        {activeTab === 'tab1' && <p>Conteúdo da Aba 1</p>}
        {activeTab === 'tab2' && <p>Conteúdo da Aba 2</p>}
        {activeTab === 'tab3' && <p>Conteúdo da Aba 3</p>}
      </div>
    </div>
  );
}
```

---

## 9. Progress Bar Moderna

```tsx
// src/components/ProgressBar.tsx
interface ProgressProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
}

export default function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = true,
}: ProgressProps) {
  const percentage = (value / max) * 100;

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-slate-300">{label}</span>
          {showPercentage && (
            <span className="text-sm text-blue-400">{Math.round(percentage)}%</span>
          )}
        </div>
      )}

      <div className="bg-slate-800 rounded-full h-3 overflow-hidden shadow-inset">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-neon transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
```

---

## 10. Notificação Toast

```tsx
// src/components/Toast.tsx
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: 'bg-green-500/20 border-green-500/50 text-green-300',
    error: 'bg-red-500/20 border-red-500/50 text-red-300',
    warning: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300',
    info: 'bg-blue-500/20 border-blue-500/50 text-blue-300',
  };

  return (
    <div
      className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg border ${colors[type]} 
                   glass-effect shadow-lg animate-fade-in-up`}
    >
      {message}
    </div>
  );
}
```

---

## 11. Badge Customizado

```tsx
// src/components/CustomBadge.tsx
interface BadgeProps {
  text: string;
  variant: 'success' | 'warning' | 'error' | 'primary' | 'accent';
  size?: 'sm' | 'md' | 'lg';
}

export default function CustomBadge({
  text,
  variant,
  size = 'md',
}: BadgeProps) {
  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span className={`badge badge-${variant} ${sizes[size]}`}>
      {text}
    </span>
  );
}
```

---

## 12. Grid Layout Responsivo

```tsx
// Exemplo de grid responsivo com cards
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {items.map((item, i) => (
    <div
      key={i}
      className="card-premium animate-fade-in-up hover:shadow-neon"
      style={{ animationDelay: `${i * 0.05}s` }}
    >
      <h3 className="font-bold mb-2">{item.title}</h3>
      <p className="text-sm text-slate-400">{item.description}</p>
    </div>
  ))}
</div>
```

---

## 13. Combo - Page Completa

```tsx
// src/pages/CompletePage.tsx
import BasePage from '@/components/BasePage';

export default function CompletePage() {
  return (
    <BasePage>
      {/* Hero Section */}
      <section className="mb-12 text-center">
        <h1 className="text-hero animate-fade-in-up mb-4">
          Página Completa com Efeitos
        </h1>
        <p className="text-subtitle animate-slide-in-left">
          Todos os efeitos modernos em ação
        </p>
      </section>

      {/* Cards Grid */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-blue-400">
          Cards Variados
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-modern">
            <h3 className="text-accent font-bold mb-3">Moderno</h3>
            <p>Card com efeito moderno</p>
          </div>
          <div className="card-premium">
            <h3 className="text-accent font-bold mb-3">Premium</h3>
            <p>Card com efeitos premium</p>
          </div>
          <div className="card-accent">
            <h3 className="text-accent font-bold mb-3">Accent</h3>
            <p>Card com cores accent</p>
          </div>
        </div>
      </section>

      {/* Buttons Section */}
      <section className="text-center">
        <h2 className="text-2xl font-bold mb-6 text-blue-400">
          Variações de Botões
        </h2>
        <div className="flex flex-wrap justify-center gap-4">
          <button className="btn-primary">Primary</button>
          <button className="btn-secondary">Secondary</button>
          <button className="btn-success">Success</button>
          <button className="btn-modern">Modern</button>
        </div>
      </section>
    </BasePage>
  );
}
```

---

## 🎨 Utility Classes Úteis

```tsx
// Combine estas classes para criar efeitos customizados

// Shadows
className="shadow-neon"           // Glow neon
className="shadow-deep"           // Sombra 3D profunda
className="shadow-color-primary"  // Sombra azul

// Glass
className="glass-effect"          // Vidro padrão
className="glass-effect-strong"   // Vidro forte
className="glass-effect-primary"  // Vidro azul

// Text
className="text-glow"            // Texto com glow
className="text-premium"         // Texto gradiente
className="text-accent"          // Texto com accent

// Animations
className="animate-fade-in-up"   // Fade subindo
className="animate-slide-in-left"  // Slide da esquerda
className="animate-pulse-glow"   // Pulsação com glow

// Responsive
className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
className="px-4 sm:px-6 lg:px-8"
className="text-lg sm:text-xl lg:text-2xl"
```

---

## 📋 Checklist de Implementação

- [ ] Importar `modern-effects.css` em `index.css` ✅
- [ ] Importar `components.css` em `index.css` ✅
- [ ] Usar `BasePage` como layout principal ✅
- [ ] Adicionar classes aos componentes ✅
- [ ] Testar responsividade em mobile ✅
- [ ] Validar performance com DevTools ✅
- [ ] Testar em diferentes navegadores ✅

---

**✨ Happy Styling! 🚀**
