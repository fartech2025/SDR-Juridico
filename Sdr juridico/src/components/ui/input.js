import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { cn } from '@/utils/cn';
export const Input = React.forwardRef(({ className, type, ...props }, ref) => (_jsx("input", { ref: ref, type: type, className: cn('h-10 w-full rounded-2xl border border-border bg-white px-3 text-sm text-text placeholder:text-text-subtle shadow-soft focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20', className), ...props })));
Input.displayName = 'Input';
