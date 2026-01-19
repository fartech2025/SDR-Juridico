import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
const variants = {
    success: {
        bg: 'bg-success-bg',
        border: 'border-success-border',
        text: 'text-success-dark',
        icon: _jsx(CheckCircle2, { className: "h-5 w-5" }),
    },
    warning: {
        bg: 'bg-warning-bg',
        border: 'border-warning-border',
        text: 'text-warning-dark',
        icon: _jsx(AlertTriangle, { className: "h-5 w-5" }),
    },
    danger: {
        bg: 'bg-danger-bg',
        border: 'border-danger-border',
        text: 'text-danger-dark',
        icon: _jsx(AlertCircle, { className: "h-5 w-5" }),
    },
    info: {
        bg: 'bg-info-bg',
        border: 'border-info-border',
        text: 'text-info-dark',
        icon: _jsx(Info, { className: "h-5 w-5" }),
    },
};
export function Alert({ variant = 'info', title, children, onClose, className = '', ...props }) {
    const { bg, border, text, icon } = variants[variant];
    return (_jsxs("div", { className: `
        rounded-lg border p-4
        flex items-start gap-3
        ${bg} ${border} ${text}
        ${className}
      `, ...props, children: [_jsx("div", { className: "flex-shrink-0 mt-0.5", children: icon }), _jsxs("div", { className: "flex-1 min-w-0", children: [title && (_jsx("h4", { className: "font-semibold mb-1", children: title })), _jsx("div", { className: "text-sm", children: children })] }), onClose && (_jsx("button", { onClick: onClose, className: "flex-shrink-0 ml-auto hover:opacity-70 transition-opacity", "aria-label": "Fechar", children: _jsx(X, { className: "h-4 w-4" }) }))] }));
}
