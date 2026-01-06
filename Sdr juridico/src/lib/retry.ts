/**
 * Sistema de Retry com Backoff Exponencial
 * Tenta novamente automaticamente em caso de falhas retentáveis
 */

export interface RetryConfig {
  maxAttempts: number
  initialDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
  jitterFactor: number
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  jitterFactor: 0.1,
}

/**
 * Calcula delay com backoff exponencial e jitter
 */
function calculateDelay(
  attempt: number,
  config: RetryConfig
): number {
  const exponentialDelay = Math.min(
    config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1),
    config.maxDelayMs
  )

  const jitter = exponentialDelay * config.jitterFactor * Math.random()
  return exponentialDelay + jitter
}

/**
 * Função genérica para retry com backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  isRetryable: (error: unknown) => boolean = () => true,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
  let lastError: unknown

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      if (attempt === finalConfig.maxAttempts || !isRetryable(error)) {
        throw error
      }

      const delay = calculateDelay(attempt, finalConfig)
      console.warn(
        `Tentativa ${attempt}/${finalConfig.maxAttempts} falhou. Retry em ${Math.round(delay)}ms`,
        error
      )

      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * Decorator para retry automático
 */
export function withRetry<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  config?: Partial<RetryConfig>
) {
  return async (...args: T): Promise<R> => {
    return retryWithBackoff(() => fn(...args), () => true, config)
  }
}

/**
 * Exponential backoff simples (sem jitter)
 */
export function getBackoffDelay(
  attempt: number,
  baseDelay: number = 1000,
  maxDelay: number = 32000
): number {
  return Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay)
}
