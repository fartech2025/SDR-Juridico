import { describe, it, expect } from 'vitest'
import {
  AppError,
  NetworkError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  NotFoundError,
  ServerError,
  TimeoutError,
  RateLimitError,
  normalizeError,
  ErrorTypeValues,
} from '@/lib/errors'

// ─── AppError ─────────────────────────────────────────────────

describe('AppError', () => {
  it('cria erro com valores default', () => {
    const error = new AppError('Erro genérico')
    expect(error.message).toBe('Erro genérico')
    expect(error.type).toBe('UNKNOWN_ERROR')
    expect(error.isRetryable).toBe(false)
    expect(error.name).toBe('AppError')
  })

  it('cria erro com tipo especifico', () => {
    const error = new AppError('Erro de rede', ErrorTypeValues.NETWORK, undefined, true)
    expect(error.type).toBe('NETWORK_ERROR')
    expect(error.isRetryable).toBe(true)
  })

  it('inclui contexto com timestamp', () => {
    const error = new AppError('Teste')
    expect(error.context.timestamp).toBeDefined()
    expect(new Date(error.context.timestamp).getTime()).not.toBeNaN()
  })

  it('preserva erro original', () => {
    const original = new Error('Causa raiz')
    const error = new AppError('Wrapper', 'UNKNOWN_ERROR', original)
    expect(error.originalError).toBe(original)
  })

  it('serializa para JSON', () => {
    const error = new AppError('Teste JSON', ErrorTypeValues.SERVER)
    const json = error.toJSON()
    expect(json.name).toBe('AppError')
    expect(json.message).toBe('Teste JSON')
    expect(json.type).toBe('SERVER_ERROR')
    expect(json.isRetryable).toBe(false)
    expect(json.context).toBeDefined()
  })

  it('e instancia de Error', () => {
    const error = new AppError('Teste')
    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(AppError)
  })
})

// ─── Subclasses de Erro ───────────────────────────────────────

describe('NetworkError', () => {
  it('é retentável por padrão', () => {
    const error = new NetworkError('Falha de conexão')
    expect(error.type).toBe(ErrorTypeValues.NETWORK)
    expect(error.isRetryable).toBe(true)
    expect(error).toBeInstanceOf(AppError)
    expect(error).toBeInstanceOf(NetworkError)
  })

  it('usa mensagem default quando vazia', () => {
    const error = new NetworkError('')
    expect(error.message).toBe('Erro de conexão com servidor')
  })
})

describe('AuthenticationError', () => {
  it('não é retentável', () => {
    const error = new AuthenticationError()
    expect(error.type).toBe(ErrorTypeValues.AUTHENTICATION)
    expect(error.isRetryable).toBe(false)
    expect(error.message).toBe('Falha na autenticação')
  })
})

describe('AuthorizationError', () => {
  it('não é retentável', () => {
    const error = new AuthorizationError()
    expect(error.type).toBe(ErrorTypeValues.AUTHORIZATION)
    expect(error.isRetryable).toBe(false)
    expect(error.message).toBe('Acesso negado')
  })
})

describe('ValidationError', () => {
  it('inclui campo do erro', () => {
    const error = new ValidationError('Email inválido', 'email')
    expect(error.type).toBe(ErrorTypeValues.VALIDATION)
    expect(error.field).toBe('email')
    expect(error.isRetryable).toBe(false)
  })
})

describe('NotFoundError', () => {
  it('não é retentável', () => {
    const error = new NotFoundError()
    expect(error.type).toBe(ErrorTypeValues.NOT_FOUND)
    expect(error.isRetryable).toBe(false)
    expect(error.message).toBe('Recurso não encontrado')
  })
})

describe('ServerError', () => {
  it('é retentável', () => {
    const error = new ServerError()
    expect(error.type).toBe(ErrorTypeValues.SERVER)
    expect(error.isRetryable).toBe(true)
    expect(error.message).toBe('Erro no servidor')
  })
})

describe('TimeoutError', () => {
  it('é retentável', () => {
    const error = new TimeoutError()
    expect(error.type).toBe(ErrorTypeValues.TIMEOUT)
    expect(error.isRetryable).toBe(true)
    expect(error.message).toBe('Operação expirou')
  })
})

describe('RateLimitError', () => {
  it('é retentável e tem retryAfter', () => {
    const error = new RateLimitError('Limite excedido', 30)
    expect(error.type).toBe(ErrorTypeValues.RATE_LIMIT)
    expect(error.isRetryable).toBe(true)
    expect(error.retryAfter).toBe(30)
  })
})

// ─── normalizeError ───────────────────────────────────────────

describe('normalizeError', () => {
  it('retorna AppError inalterado', () => {
    const original = new AppError('Já é AppError')
    const normalized = normalizeError(original)
    expect(normalized).toBe(original)
  })

  it('converte erro de network', () => {
    const error = normalizeError(new Error('network error occurred'))
    expect(error).toBeInstanceOf(NetworkError)
    expect(error.type).toBe(ErrorTypeValues.NETWORK)
  })

  it('converte erro de fetch', () => {
    const error = normalizeError(new Error('fetch failed'))
    expect(error).toBeInstanceOf(NetworkError)
  })

  it('converte erro 401/unauthorized', () => {
    const error = normalizeError(new Error('unauthorized access'))
    expect(error).toBeInstanceOf(AuthenticationError)
    expect(error.type).toBe(ErrorTypeValues.AUTHENTICATION)
  })

  it('converte erro 403/forbidden', () => {
    const error = normalizeError(new Error('forbidden resource'))
    expect(error).toBeInstanceOf(AuthorizationError)
  })

  it('converte erro 404/not found', () => {
    const error = normalizeError(new Error('resource not found'))
    expect(error).toBeInstanceOf(NotFoundError)
  })

  it('converte erro de timeout', () => {
    const error = normalizeError(new Error('request timeout'))
    expect(error).toBeInstanceOf(TimeoutError)
  })

  it('converte erro generico para ServerError', () => {
    const error = normalizeError(new Error('algo deu errado'))
    expect(error).toBeInstanceOf(ServerError)
  })

  it('converte string para AppError', () => {
    const error = normalizeError('erro como string')
    expect(error).toBeInstanceOf(AppError)
    expect(error.message).toBe('erro como string')
    expect(error.type).toBe('UNKNOWN_ERROR')
  })

  it('converte null/undefined', () => {
    const error = normalizeError(null)
    expect(error).toBeInstanceOf(AppError)
  })
})
