import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-3',
};
export function Spinner({ size = 'md', label, className = '', ...props }) {
    return (_jsxs("div", { className: `inline-flex items-center gap-3 ${className}`, ...props, children: [_jsx("div", { className: `
          animate-spin rounded-full 
          border-current border-t-transparent
          ${sizes[size]}
        `, role: "status", "aria-label": label || 'Carregando...' }), label && _jsx("span", { className: "text-sm text-text-muted", children: label })] }));
}
