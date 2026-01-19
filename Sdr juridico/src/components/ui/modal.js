import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils/cn';
export const Modal = ({ open, title, description, onClose, children, footer, className, }) => {
    React.useEffect(() => {
        if (!open)
            return;
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose]);
    if (!open)
        return null;
    return createPortal(_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center", children: [_jsx("div", { className: "absolute inset-0 bg-slate-900/45 backdrop-blur-[6px]", onClick: onClose }), _jsxs("div", { className: cn('relative z-10 w-full max-w-lg rounded-2xl border border-border bg-white px-6 py-5 shadow-soft', className), children: [(title || description) && (_jsxs("div", { className: "space-y-1", children: [title && (_jsx("h3", { className: "font-display text-lg text-text", children: title })), description && (_jsx("p", { className: "text-sm text-text-muted", children: description }))] })), _jsx("div", { className: "mt-4 text-sm text-text-muted", children: children }), footer && _jsx("div", { className: "mt-5 flex items-center gap-3", children: footer })] })] }), document.body);
};
