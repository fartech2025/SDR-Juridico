import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Error Boundary - Captura erros em componentes React
 * Previne que um erro componente quebre toda a aplicação
 */
import React from 'react';
import { errorLogger } from '@/lib/errors';
export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        // Log do erro
        errorLogger.error({
            name: error.name,
            message: error.message,
            type: 'ERROR_BOUNDARY',
            isRetryable: false,
            context: {
                timestamp: new Date().toISOString(),
                url: window.location.href,
            },
            stack: error.stack,
        }, {
            componentStack: errorInfo.componentStack,
        });
        // Callback customizado
        this.props.onError?.(error, errorInfo);
    }
    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };
    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (_jsx("div", { style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    flexDirection: 'column',
                    padding: '20px',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    backgroundColor: '#f5f5f5',
                }, children: _jsxs("div", { style: {
                        maxWidth: '600px',
                        backgroundColor: 'white',
                        padding: '40px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }, children: [_jsx("h1", { style: { margin: '0 0 16px', color: '#d32f2f' }, children: "Algo deu errado" }), _jsx("p", { style: { margin: '0 0 16px', color: '#666' }, children: "Desculpe, a aplica\u00E7\u00E3o encontrou um erro. Por favor, tente recarregar a p\u00E1gina." }), import.meta.env.DEV && this.state.error && (_jsxs("details", { style: {
                                marginBottom: '20px',
                                padding: '10px',
                                backgroundColor: '#f5f5f5',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontFamily: 'monospace',
                            }, children: [_jsx("summary", { style: { cursor: 'pointer', marginBottom: '8px' }, children: "Detalhes do erro (desenvolvimento)" }), _jsxs("pre", { style: {
                                        margin: '0',
                                        overflow: 'auto',
                                        color: '#d32f2f',
                                    }, children: [this.state.error.message, '\n\n', this.state.error.stack, this.state.errorInfo?.componentStack && (_jsxs(_Fragment, { children: ['\n\nComponent Stack:', this.state.errorInfo.componentStack] }))] })] })), _jsx("button", { onClick: this.handleReset, style: {
                                padding: '10px 20px',
                                marginRight: '10px',
                                backgroundColor: '#1976d2',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '14px',
                            }, children: "Tentar novamente" }), _jsx("button", { onClick: () => {
                                window.location.href = '/';
                            }, style: {
                                padding: '10px 20px',
                                backgroundColor: '#757575',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '14px',
                            }, children: "Voltar para in\u00EDcio" })] }) }));
        }
        return this.props.children;
    }
}
export class AsyncErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
        };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error) {
        this.props.onError?.(error);
        errorLogger.error({
            name: error.name,
            message: error.message,
            type: 'ASYNC_ERROR',
            isRetryable: true,
            context: {
                timestamp: new Date().toISOString(),
            },
        });
    }
    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };
    render() {
        if (this.state.hasError && this.state.error) {
            if (this.props.fallback) {
                return this.props.fallback(this.state.error, this.handleRetry);
            }
            return (_jsxs("div", { style: {
                    padding: '20px',
                    backgroundColor: '#fff3cd',
                    border: '1px solid #ffc107',
                    borderRadius: '4px',
                    color: '#856404',
                }, children: [_jsx("strong", { children: "Erro carregando conte\u00FAdo" }), _jsx("p", { children: this.state.error.message }), _jsx("button", { onClick: this.handleRetry, style: {
                            padding: '8px 16px',
                            backgroundColor: '#ffc107',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }, children: "Tentar novamente" })] }));
        }
        return this.props.children;
    }
}
