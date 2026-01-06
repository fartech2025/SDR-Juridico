/**
 * Error Boundary - Captura erros em componentes React
 * Previne que um erro componente quebre toda a aplicação
 */

import React from 'react'
import type { ReactNode, ReactElement } from 'react'
import { errorLogger } from '@/lib/errors'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactElement
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo })

    // Log do erro
    errorLogger.error(
      {
        name: error.name,
        message: error.message,
        type: 'ERROR_BOUNDARY',
        isRetryable: false,
        context: {
          timestamp: new Date().toISOString(),
          url: window.location.href,
        },
        stack: error.stack,
      } as any,
      {
        componentStack: errorInfo.componentStack,
      }
    )

    // Callback customizado
    this.props.onError?.(error, errorInfo)
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            flexDirection: 'column',
            padding: '20px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            backgroundColor: '#f5f5f5',
          }}
        >
          <div
            style={{
              maxWidth: '600px',
              backgroundColor: 'white',
              padding: '40px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <h1 style={{ margin: '0 0 16px', color: '#d32f2f' }}>
              Algo deu errado
            </h1>
            <p style={{ margin: '0 0 16px', color: '#666' }}>
              Desculpe, a aplicação encontrou um erro. Por favor, tente recarregar a página.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <details
                style={{
                  marginBottom: '20px',
                  padding: '10px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                }}
              >
                <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>
                  Detalhes do erro (desenvolvimento)
                </summary>
                <pre
                  style={{
                    margin: '0',
                    overflow: 'auto',
                    color: '#d32f2f',
                  }}
                >
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                  {this.state.errorInfo?.componentStack && (
                    <>
                      {'\n\nComponent Stack:'}
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </details>
            )}

            <button
              onClick={this.handleReset}
              style={{
                padding: '10px 20px',
                marginRight: '10px',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Tentar novamente
            </button>

            <button
              onClick={() => {
                window.location.href = '/'
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#757575',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Voltar para início
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Wrapper para componentes específicos com tratamento de erro
 */
interface AsyncErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, retry: () => void) => ReactElement
  onError?: (error: Error) => void
}

interface AsyncErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class AsyncErrorBoundary extends React.Component<
  AsyncErrorBoundaryProps,
  AsyncErrorBoundaryState
> {
  constructor(props: AsyncErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<AsyncErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error)
    errorLogger.error({
      name: error.name,
      message: error.message,
      type: 'ASYNC_ERROR',
      isRetryable: true,
      context: {
        timestamp: new Date().toISOString(),
      },
    } as any)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry)
      }

      return (
        <div
          style={{
            padding: '20px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '4px',
            color: '#856404',
          }}
        >
          <strong>Erro carregando conteúdo</strong>
          <p>{this.state.error.message}</p>
          <button
            onClick={this.handleRetry}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ffc107',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Tentar novamente
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
