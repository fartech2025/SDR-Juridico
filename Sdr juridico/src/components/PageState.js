import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';
export const PageState = ({ status, children, emptyTitle = 'Nada por aqui...', emptyDescription = 'Conteudos serao exibidos assim que estiverem disponiveis.', emptyAction, errorTitle = 'Nao foi possivel carregar', errorDescription = 'Tente novamente em alguns segundos.', onRetry, }) => {
    if (status === 'ready') {
        return _jsx(_Fragment, { children: children });
    }
    if (status === 'loading') {
        return (_jsxs("div", { className: "space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-soft", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm text-text-muted", children: [_jsx(Loader2, { className: "h-4 w-4 animate-spin" }), "Carregando..."] }), _jsxs("div", { className: "grid gap-3 md:grid-cols-2", children: [_jsx(Skeleton, { className: "h-20" }), _jsx(Skeleton, { className: "h-20" }), _jsx(Skeleton, { className: "h-20" }), _jsx(Skeleton, { className: "h-20" })] })] }));
    }
    if (status === 'empty') {
        return (_jsxs("div", { className: "space-y-3 rounded-2xl border border-border bg-surface p-6 shadow-soft", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm font-semibold text-text", children: [_jsx(Inbox, { className: "h-4 w-4 text-text-subtle" }), emptyTitle] }), _jsx("p", { className: "text-sm text-text-muted", children: emptyDescription }), emptyAction && _jsx("div", { children: emptyAction })] }));
    }
    return (_jsxs("div", { className: "space-y-3 rounded-2xl border border-danger/30 bg-danger/10 p-6 shadow-soft", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm font-semibold text-danger", children: [_jsx(AlertTriangle, { className: "h-4 w-4" }), errorTitle] }), _jsx("p", { className: "text-sm text-text-muted", children: errorDescription }), onRetry && (_jsx(Button, { variant: "ghost", size: "sm", onClick: onRetry, className: cn('border border-border'), children: "Tentar novamente" }))] }));
};
