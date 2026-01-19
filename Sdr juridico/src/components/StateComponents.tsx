/**
 * Componentes de Loading, Error e Empty States
 * Padrão consistente em toda a aplicação
 */

import React from 'react'
import { AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react'

export interface PageStateProps {
  state: 'idle' | 'loading' | 'error' | 'empty'
  error?: string
  onRetry?: () => void
  children?: React.ReactNode
}

export const PageState = ({ state, error, onRetry, children }: PageStateProps) => {
  if (state === 'loading') {
    return <LoadingState />
  }

  if (state === 'error') {
    return <ErrorState error={error} onRetry={onRetry} />
  }

  if (state === 'empty') {
    return <EmptyState />
  }

  return <>{children}</>
}

/**
 * Loading Spinner
 */
export const LoadingState = ({ message = 'Carregando...' }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="relative h-12 w-12 mb-4">
      <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-primary animate-spin"></div>
    </div>
    <p className="text-sm text-text-muted">{message}</p>
  </div>
)

/**
 * Error State com Retry
 */
export const ErrorState = ({
  error = 'Algo deu errado',
  onRetry,
  code,
}: {
  error?: string
  onRetry?: () => void
  code?: string
}) => (
  <div className="flex flex-col items-center justify-center py-12 px-4">
    <div className="rounded-full bg-danger-bg p-3 mb-4">
      <AlertCircle className="h-6 w-6 text-danger" />
    </div>
    <h3 className="text-lg font-semibold text-text mb-2">Erro ao carregar</h3>
    <p className="text-sm text-text-muted text-center mb-4 max-w-sm">{error}</p>
    {code && <p className="text-xs text-text-subtle mb-4">Código: {code}</p>}
    {onRetry && (
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-text-inverse rounded-lg hover:bg-brand-primary-dark transition"
      >
        <RefreshCw className="h-4 w-4" />
        Tentar novamente
      </button>
    )}
  </div>
)

/**
 * Empty State
 */
export const EmptyState = ({ message = 'Nenhum dado disponível' }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="rounded-full bg-gray-100 p-3 mb-4">
      <svg
        className="h-6 w-6 text-text-subtle"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
        />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-text mb-2">Sem dados</h3>
    <p className="text-sm text-text-muted">{message}</p>
  </div>
)

/**
 * Offline Notice
 */
export const OfflineNotice = () => (
  <div className="fixed bottom-0 left-0 right-0 bg-orange-50 border-t-4 border-orange-400 p-4">
    <div className="flex items-center gap-3 max-w-7xl mx-auto">
      <WifiOff className="h-5 w-5 text-orange-600 shrink-0" />
      <div className="flex-1">
        <p className="font-medium text-orange-900">Você está offline</p>
        <p className="text-sm text-orange-700">
          Algumas funcionalidades podem estar limitadas
        </p>
      </div>
    </div>
  </div>
)

/**
 * Connection Status
 */
export const ConnectionStatus = ({
  isOnline,
  isConnected,
}: {
  isOnline: boolean
  isConnected: boolean
}) => {
  if (isOnline && isConnected) {
    return null
  }

  if (!isOnline) {
    return <OfflineNotice />
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-yellow-50 border-t-4 border-yellow-400 p-4">
      <div className="flex items-center gap-3 max-w-7xl mx-auto">
        <Wifi className="h-5 w-5 text-yellow-600 animate-pulse shrink-0" />
        <div className="flex-1">
          <p className="font-medium text-yellow-900">Conectando...</p>
          <p className="text-sm text-yellow-700">
            Pode haver um atraso em sincronização
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton Loading (Placeholder)
 */
export const SkeletonLoader = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="h-12 bg-linear-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg animate-pulse"
        style={{
          backgroundSize: '200% 100%',
          animation: 'shimmer 2s infinite',
        }}
      />
    ))}
    <style>{`
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `}</style>
  </div>
)

/**
 * Toast/Notification
 */
export interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  onClose?: () => void
  duration?: number
}

export const Notification = ({
  type,
  message,
  onClose,
  duration = 5000,
}: NotificationProps) => {
  React.useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(() => {
        if (onClose) {
          onClose()
        }
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const bgColor = {
    success: 'bg-green-50',
    error: 'bg-red-50',
    warning: 'bg-yellow-50',
    info: 'bg-blue-50',
  }[type]

  const borderColor = {
    success: 'border-green-400',
    error: 'border-red-400',
    warning: 'border-yellow-400',
    info: 'border-blue-400',
  }[type]

  const textColor = {
    success: 'text-green-900',
    error: 'text-red-900',
    warning: 'text-yellow-900',
    info: 'text-blue-900',
  }[type]

  return (
    <div className={`${bgColor} border-l-4 ${borderColor} p-4 rounded`}>
      <p className={`text-sm font-medium ${textColor}`}>{message}</p>
    </div>
  )
}

/**
 * Fallback Page
 */
export const FallbackPage = ({
  title = 'Página não encontrada',
  message = 'A página que você está procurando não existe',
  children,
}: {
  title?: string
  message?: string
  children?: React.ReactNode
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
    <div className="max-w-md w-full text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600 mb-8">{message}</p>
      {children || (
        <button
          onClick={() => (window.location.href = '/')}
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Voltar para o início
        </button>
      )}
    </div>
  </div>
)
