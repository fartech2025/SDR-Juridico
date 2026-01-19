import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { cn } from '@/utils/cn';
const variantClasses = {
    primary: 'border-transparent bg-primary text-white shadow-soft hover:brightness-95',
    secondary: 'border-border bg-white text-primary hover:bg-surface-2',
    outline: 'border-border bg-white text-text hover:bg-surface-2',
    ghost: 'border-transparent bg-transparent text-text-muted hover:bg-surface-2 hover:text-text',
    danger: 'border-transparent bg-danger text-white shadow-soft hover:brightness-95',
};
const sizeClasses = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-9 px-4 text-sm',
    lg: 'h-10 px-5 text-sm',
};
export const Button = React.forwardRef(({ className, variant = 'secondary', size = 'md', ...props }, ref) => (_jsx("button", { ref: ref, className: cn('inline-flex items-center justify-center gap-2 rounded-xl border text-[13px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 disabled:pointer-events-none disabled:opacity-50', variantClasses[variant], sizeClasses[size], className), ...props })));
Button.displayName = 'Button';
