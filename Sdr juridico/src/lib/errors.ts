/**
 * Sistema de Tratamento de Erros Centralizado
 * Fornece classes de erro customizadas para toda a aplicação
 */

export const ErrorTypeValues = {
  NETWORK: 'NETWORK_ERROR',
  AUTHENTICATION: 'AUTH_ERROR',
  AUTHORIZATION: 'AUTHZ_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  SERVER: 'SERVER_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  RATE_LIMIT: 'RATE_LIMIT_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR',
} as const

export type ErrorType = typeof ErrorTypeValues[keyof typeof ErrorTypeValues]

export interface ErrorContext {
  timestamp: string
  userAgent?: string
  url?: string
  method?: string
  statusCode?: number
  requestId?: string
}

export class AppError extends Error {
  public readonly type: ErrorType
  public readonly context: ErrorContext
  public readonly originalError?: Error
  public readonly isRetryable: boolean

  constructor(
    message: string,
    type: ErrorType = 'UNKNOWN_ERROR',
    originalError?: Error,
    isRetryable: boolean = false
  ) {
    super(message)
    this.name = 'AppError'
    this.type = type
    this.originalError = originalError
    this.isRetryable = isRetryable
    this.context = {
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    }

    Object.setPrototypeOf(this, AppError.prototype)
  }

  public toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      isRetryable: this.isRetryable,
      context: this.context,
      stack: this.stack,
    }
  }
}

export class NetworkError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(
      message || 'Erro de conexão com servidor',
      ErrorTypeValues.NETWORK,
      originalError,
      true // É retentável
    )
    Object.setPrototypeOf(this, NetworkError.prototype)
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Falha na autenticação', originalError?: Error) {
    super(message, ErrorTypeValues.AUTHENTICATION, originalError, false)
    Object.setPrototypeOf(this, AuthenticationError.prototype)
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Acesso negado', originalError?: Error) {
    super(message, ErrorTypeValues.AUTHORIZATION, originalError, false)
    Object.setPrototypeOf(this, AuthorizationError.prototype)
  }
}

export class ValidationError extends AppError {
  public readonly field?: string

  constructor(message: string, field?: string, originalError?: Error) {
    super(message, ErrorTypeValues.VALIDATION, originalError, false)
    this.field = field
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Recurso não encontrado', originalError?: Error) {
    super(message, ErrorTypeValues.NOT_FOUND, originalError, false)
    Object.setPrototypeOf(this, NotFoundError.prototype)
  }
}

export class ServerError extends AppError {
  constructor(message: string = 'Erro no servidor', originalError?: Error) {
    super(message, ErrorTypeValues.SERVER, originalError, true)
    Object.setPrototypeOf(this, ServerError.prototype)
  }
}

export class TimeoutError extends AppError {
  constructor(message: string = 'Operação expirou', originalError?: Error) {
    super(message, ErrorTypeValues.TIMEOUT, originalError, true)
    Object.setPrototypeOf(this, TimeoutError.prototype)
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfter?: number

  constructor(message: string = 'Limite de requisições excedido', retryAfter?: number) {
    super(message, ErrorTypeValues.RATE_LIMIT, undefined, true)
    this.retryAfter = retryAfter
    Object.setPrototypeOf(this, RateLimitError.prototype)
  }
}

/**
 * Mapeia erros genéricos para AppError
 */
export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error
  }

  if (error instanceof Error) {
    // Detectar tipo de erro baseado na mensagem
    const message = error.message.toLowerCase()

    if (message.includes('network') || message.includes('fetch')) {
      return new NetworkError(error.message, error)
    }

    if (message.includes('unauthorized') || message.includes('401')) {
      return new AuthenticationError(error.message, error)
    }

    if (message.includes('forbidden') || message.includes('403')) {
      return new AuthorizationError(error.message, error)
    }

    if (message.includes('not found') || message.includes('404')) {
      return new NotFoundError(error.message, error)
    }

    if (message.includes('timeout')) {
      return new TimeoutError(error.message, error)
    }

    return new ServerError(error.message, error)
  }

  return new AppError(
    String(error) || 'Erro desconhecido',
    'UNKNOWN_ERROR'
  )
}

/**
 * Logger de erros (pode ser integrado com Sentry, etc)
 */
export interface ErrorLogger {
  error(error: AppError, context?: Record<string, any>): void
  warn(message: string, context?: Record<string, any>): void
  info(message: string, context?: Record<string, any>): void
}

class ConsoleErrorLogger implements ErrorLogger {
  error(error: AppError, context?: Record<string, any>) {
    console.error(
      `[${error.type}] ${error.message}`,
      { error: error.toJSON(), context }
    )
  }

  warn(message: string, context?: Record<string, any>) {
    console.warn(`[WARN] ${message}`, context)
  }

  info(message: string, context?: Record<string, any>) {
    console.info(`[INFO] ${message}`, context)
  }
}

export const errorLogger: ErrorLogger = new ConsoleErrorLogger()
