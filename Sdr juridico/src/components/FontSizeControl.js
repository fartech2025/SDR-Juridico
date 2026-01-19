import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Componente para controlar tamanho de fonte
 * Botão flutuante ou integrado na navbar
 */
import { useFont } from '@/contexts/FontContext';
import { Type, RotateCcw } from 'lucide-react';
export function FontSizeControl({ variant = 'button', showLabel = true, className = '', }) {
    const { fontSize, increaseFontSize, decreaseFontSize, resetFontSize } = useFont();
    const fontLabels = {
        xs: 'A−−',
        sm: 'A−',
        md: 'A',
        lg: 'A+',
        normal: 'A',
        xl: 'A++',
        xxl: 'A+++',
        xxxl: 'A++++',
        huge: 'A+++++',
        mega: 'A++++++',
    };
    // Variante: Botão principal
    if (variant === 'button') {
        return (_jsxs("div", { className: `flex items-center gap-2 rounded-lg border border-border bg-surface p-2 ${className}`, children: [_jsxs("button", { onClick: decreaseFontSize, disabled: fontSize === 'xs', title: "Diminuir fonte", className: "flex items-center justify-center rounded-md p-1.5 transition-all hover:bg-primary-soft disabled:opacity-50 disabled:cursor-not-allowed", "aria-label": "Diminuir tamanho da fonte", children: [_jsx(Type, { className: "h-4 w-4 text-text" }), _jsx("span", { className: "ml-0.5 text-xs font-semibold text-text-muted", children: "\u2212" })] }), showLabel && (_jsx("div", { className: "flex min-w-8 flex-col items-center justify-center", children: _jsx("span", { className: "text-xs font-medium text-text-muted", children: fontLabels[fontSize] }) })), _jsxs("button", { onClick: increaseFontSize, disabled: fontSize === 'mega', title: "Aumentar fonte", className: "flex items-center justify-center rounded-md p-1.5 transition-all hover:bg-primary-soft disabled:opacity-50 disabled:cursor-not-allowed", "aria-label": "Aumentar tamanho da fonte", children: [_jsx(Type, { className: "h-4 w-4 text-text" }), _jsx("span", { className: "ml-0.5 text-xs font-semibold text-text-muted", children: "+" })] }), fontSize !== 'normal' && (_jsx("button", { onClick: resetFontSize, title: "Resetar fonte", className: "ml-1 rounded-md p-1.5 transition-all hover:bg-border-soft", "aria-label": "Resetar tamanho da fonte para padr\u00E3o", children: _jsx(RotateCcw, { className: "h-3.5 w-3.5 text-text-muted" }) }))] }));
    }
    // Variante: Compacta (apenas botões)
    if (variant === 'compact') {
        return (_jsxs("div", { className: `flex items-center gap-1 ${className}`, children: [_jsx("button", { onClick: decreaseFontSize, disabled: fontSize === 'xs', title: "Diminuir fonte", className: "rounded p-1.5 transition-all hover:bg-surface-alt disabled:opacity-50 disabled:cursor-not-allowed", "aria-label": "Diminuir tamanho da fonte", children: _jsx(Type, { className: "h-3.5 w-3.5 text-text-muted" }) }), _jsx("button", { onClick: increaseFontSize, disabled: fontSize === 'mega', title: "Aumentar fonte", className: "rounded p-1.5 transition-all hover:bg-surface-alt disabled:opacity-50 disabled:cursor-not-allowed", "aria-label": "Aumentar tamanho da fonte", children: _jsx(Type, { className: "h-3.5 w-3.5 text-text-muted" }) }), fontSize !== 'normal' && (_jsx("button", { onClick: resetFontSize, title: "Resetar fonte", className: "rounded p-1.5 transition-all hover:bg-surface-alt", "aria-label": "Resetar tamanho da fonte para padr\u00E3o", children: _jsx(RotateCcw, { className: "h-3.5 w-3.5 text-text-muted" }) }))] }));
    }
    // Variante: Menu (para dropdown/settings)
    if (variant === 'menu') {
        return (_jsxs("div", { className: `space-y-2 ${className}`, children: [_jsx("div", { className: "text-xs font-semibold uppercase tracking-wider text-text-subtle", children: "Tamanho da Fonte" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: decreaseFontSize, disabled: fontSize === 'xs', className: "flex-1 rounded-md border border-border-soft py-2 px-3 text-xs font-medium transition-all hover:bg-surface-alt disabled:opacity-50 disabled:cursor-not-allowed", children: "A\u2212" }), _jsx("div", { className: "w-12 rounded-md bg-surface-alt py-2 px-3 text-center text-xs font-medium", children: fontLabels[fontSize] }), _jsx("button", { onClick: increaseFontSize, disabled: fontSize === 'mega', className: "flex-1 rounded-md border border-border-soft py-2 px-3 text-xs font-medium transition-all hover:bg-surface-alt disabled:opacity-50 disabled:cursor-not-allowed", children: "A+" })] }), fontSize !== 'normal' && (_jsx("button", { onClick: resetFontSize, className: "w-full rounded-md border border-border-soft py-2 px-3 text-xs font-medium transition-all hover:bg-surface-alt", children: "Resetar Padr\u00E3o" }))] }));
    }
    return null;
}
/**
 * Botão flutuante para controle de fonte
 * Pode ser usado na barra de navegação ou rodapé
 */
export function FontSizeButton() {
    const { fontSize, increaseFontSize, decreaseFontSize } = useFont();
    const fontLabels = {
        xs: '−−',
        sm: '−',
        md: 'A',
        lg: '+',
        normal: 'A',
        xl: '++',
        xxl: '+++',
        xxxl: '++++',
        huge: '+++++',
        mega: '++++++',
    };
    return (_jsxs("div", { className: "flex items-center gap-1 rounded-lg border border-border bg-surface px-2 py-1 shadow-soft", children: [_jsx("button", { onClick: decreaseFontSize, disabled: fontSize === 'xs', className: "rounded p-1 transition-colors hover:bg-surface-alt disabled:opacity-50", title: "Diminuir", "aria-label": "Diminuir tamanho da fonte", children: _jsx("span", { className: "text-xs font-bold text-text-muted", children: "A" }) }), _jsx("span", { className: "text-xs font-semibold text-text-muted", children: fontLabels[fontSize] }), _jsx("button", { onClick: increaseFontSize, disabled: fontSize === 'mega', className: "rounded p-1 transition-colors hover:bg-surface-alt disabled:opacity-50", title: "Aumentar", "aria-label": "Aumentar tamanho da fonte", children: _jsx("span", { className: "text-xs font-bold text-text-muted", children: "A" }) })] }));
}
