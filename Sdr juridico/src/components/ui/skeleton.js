import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { cn } from '@/utils/cn';
export const Skeleton = React.forwardRef(({ className, ...props }, ref) => (_jsx("div", { ref: ref, className: cn('animate-pulse rounded-md bg-surface-raised/80', className), ...props })));
Skeleton.displayName = 'Skeleton';
