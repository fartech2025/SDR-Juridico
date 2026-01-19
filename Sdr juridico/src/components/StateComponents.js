import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Componentes de Loading, Error e Empty States
 * Padrão consistente em toda a aplicação
 */
import React from 'react';
import { AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
export const PageState = ({ state, error, onRetry, children }) => {
    if (state === 'loading') {
        return _jsx(LoadingState, {});
    }
    if (state === 'error') {
        return _jsx(ErrorState, { error: error, onRetry: onRetry });
    }
    if (state === 'empty') {
        return _jsx(EmptyState, {});
    }
    return _jsx(_Fragment, { children: children });
};
/**
 * Loading Spinner
 */
export const LoadingState = ({ message = 'Carregando...' }) => (_jsxs("div", { className: "flex flex-col items-center justify-center py-12", children: [_jsxs("div", { className: "relative h-12 w-12 mb-4", children: [_jsx("div", { className: "absolute inset-0 rounded-full border-4 border-gray-200" }), _jsx("div", { className: "absolute inset-0 rounded-full border-4 border-transparent border-t-brand-primary animate-spin" })] }), _jsx("p", { className: "text-sm text-text-muted", children: message })] }));
/**
 * Error State com Retry
 */
export const ErrorState = ({ error = 'Algo deu errado', onRetry, code, }) => (_jsxs("div", { className: "flex flex-col items-center justify-center py-12 px-4", children: [_jsx("div", { className: "rounded-full bg-danger-bg p-3 mb-4", children: _jsx(AlertCircle, { className: "h-6 w-6 text-danger" }) }), _jsx("h3", { className: "text-lg font-semibold text-text mb-2", children: "Erro ao carregar" }), _jsx("p", { className: "text-sm text-text-muted text-center mb-4 max-w-sm", children: error }), code && _jsxs("p", { className: "text-xs text-text-subtle mb-4", children: ["C\u00F3digo: ", code] }), onRetry && (_jsxs("button", { onClick: onRetry, className: "inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-text-inverse rounded-lg hover:bg-brand-primary-dark transition", children: [_jsx(RefreshCw, { className: "h-4 w-4" }), "Tentar novamente"] }))] }));
/**
 * Empty State
 */
export const EmptyState = ({ message = 'Nenhum dado disponível' }) => (_jsxs("div", { className: "flex flex-col items-center justify-center py-12", children: [_jsx("div", { className: "rounded-full bg-gray-100 p-3 mb-4", children: _jsx("svg", { className: "h-6 w-6 text-text-subtle", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" }) }) }), _jsx("h3", { className: "text-lg font-semibold text-text mb-2", children: "Sem dados" }), _jsx("p", { className: "text-sm text-text-muted", children: message })] }));
/**
 * Offline Notice
 */
export const OfflineNotice = () => (_jsx("div", { className: "fixed bottom-0 left-0 right-0 bg-orange-50 border-t-4 border-orange-400 p-4", children: _jsxs("div", { className: "flex items-center gap-3 max-w-7xl mx-auto", children: [_jsx(WifiOff, { className: "h-5 w-5 text-orange-600 shrink-0" }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-medium text-orange-900", children: "Voc\u00EA est\u00E1 offline" }), _jsx("p", { className: "text-sm text-orange-700", children: "Algumas funcionalidades podem estar limitadas" })] })] }) }));
/**
 * Connection Status
 */
export const ConnectionStatus = ({ isOnline, isConnected, }) => {
    if (isOnline && isConnected) {
        return null;
    }
    if (!isOnline) {
        return _jsx(OfflineNotice, {});
    }
    return (_jsx("div", { className: "fixed bottom-0 left-0 right-0 bg-yellow-50 border-t-4 border-yellow-400 p-4", children: _jsxs("div", { className: "flex items-center gap-3 max-w-7xl mx-auto", children: [_jsx(Wifi, { className: "h-5 w-5 text-yellow-600 animate-pulse shrink-0" }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-medium text-yellow-900", children: "Conectando..." }), _jsx("p", { className: "text-sm text-yellow-700", children: "Pode haver um atraso em sincroniza\u00E7\u00E3o" })] })] }) }));
};
/**
 * Skeleton Loading (Placeholder)
 */
export const SkeletonLoader = ({ count = 3 }) => (_jsxs("div", { className: "space-y-4", children: [Array.from({ length: count }).map((_, i) => (_jsx("div", { className: "h-12 bg-linear-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg animate-pulse", style: {
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s infinite',
            } }, i))), _jsx("style", { children: `
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    ` })] }));
export const Notification = ({ type, message, onClose, duration = 5000, }) => {
    React.useEffect(() => {
        if (duration && onClose) {
            const timer = setTimeout(() => {
                if (onClose) {
                    onClose();
                }
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);
    const bgColor = {
        success: 'bg-green-50',
        error: 'bg-red-50',
        warning: 'bg-yellow-50',
        info: 'bg-blue-50',
    }[type];
    const borderColor = {
        success: 'border-green-400',
        error: 'border-red-400',
        warning: 'border-yellow-400',
        info: 'border-blue-400',
    }[type];
    const textColor = {
        success: 'text-green-900',
        error: 'text-red-900',
        warning: 'text-yellow-900',
        info: 'text-blue-900',
    }[type];
    return (_jsx("div", { className: `${bgColor} border-l-4 ${borderColor} p-4 rounded`, children: _jsx("p", { className: `text-sm font-medium ${textColor}`, children: message }) }));
};
/**
 * Fallback Page
 */
export const FallbackPage = ({ title = 'Página não encontrada', message = 'A página que você está procurando não existe', children, }) => (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "max-w-md w-full text-center", children: [_jsx("h1", { className: "text-4xl font-bold text-gray-900 mb-4", children: "404" }), _jsx("h2", { className: "text-2xl font-semibold text-gray-900 mb-2", children: title }), _jsx("p", { className: "text-gray-600 mb-8", children: message }), children || (_jsx("button", { onClick: () => (window.location.href = '/'), className: "inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition", children: "Voltar para o in\u00EDcio" }))] }) }));
