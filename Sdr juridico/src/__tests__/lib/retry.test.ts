import { describe, it, expect, vi } from 'vitest'
import {
  retryWithBackoff,
  withRetry,
  getBackoffDelay,
  DEFAULT_RETRY_CONFIG,
} from '@/lib/retry'

// ─── getBackoffDelay ──────────────────────────────────────────

describe('getBackoffDelay', () => {
  it('retorna baseDelay na primeira tentativa', () => {
    expect(getBackoffDelay(1, 1000)).toBe(1000)
  })

  it('dobra o delay a cada tentativa', () => {
    expect(getBackoffDelay(2, 1000)).toBe(2000)
    expect(getBackoffDelay(3, 1000)).toBe(4000)
    expect(getBackoffDelay(4, 1000)).toBe(8000)
  })

  it('respeita maxDelay', () => {
    expect(getBackoffDelay(10, 1000, 5000)).toBe(5000)
  })

  it('usa valores default', () => {
    expect(getBackoffDelay(1)).toBe(1000)
    expect(getBackoffDelay(6)).toBe(32000)
    expect(getBackoffDelay(7)).toBe(32000) // capped at maxDelay default 32000
  })
})

// ─── DEFAULT_RETRY_CONFIG ─────────────────────────────────────

describe('DEFAULT_RETRY_CONFIG', () => {
  it('tem valores sensatos', () => {
    expect(DEFAULT_RETRY_CONFIG.maxAttempts).toBe(3)
    expect(DEFAULT_RETRY_CONFIG.initialDelayMs).toBe(1000)
    expect(DEFAULT_RETRY_CONFIG.maxDelayMs).toBe(10000)
    expect(DEFAULT_RETRY_CONFIG.backoffMultiplier).toBe(2)
    expect(DEFAULT_RETRY_CONFIG.jitterFactor).toBe(0.1)
  })
})

// ─── retryWithBackoff ─────────────────────────────────────────

describe('retryWithBackoff', () => {
  it('retorna resultado na primeira tentativa quando sucesso', async () => {
    const fn = vi.fn().mockResolvedValue('sucesso')
    const result = await retryWithBackoff(fn, () => true, { maxAttempts: 3, initialDelayMs: 1 })
    expect(result).toBe('sucesso')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retenta quando falha e sucede depois', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('falha 1'))
      .mockResolvedValue('sucesso')

    const result = await retryWithBackoff(fn, () => true, {
      maxAttempts: 3,
      initialDelayMs: 1,
      maxDelayMs: 10,
    })

    expect(result).toBe('sucesso')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('lança erro apos esgotar tentativas', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('falha persistente'))

    await expect(
      retryWithBackoff(fn, () => true, {
        maxAttempts: 3,
        initialDelayMs: 1,
        maxDelayMs: 10,
      })
    ).rejects.toThrow('falha persistente')

    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('nao retenta quando isRetryable retorna false', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('erro nao retentavel'))
    const isRetryable = vi.fn().mockReturnValue(false)

    await expect(
      retryWithBackoff(fn, isRetryable, { maxAttempts: 3, initialDelayMs: 1 })
    ).rejects.toThrow('erro nao retentavel')

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('usa config parcial mesclada com default', async () => {
    const fn = vi.fn().mockResolvedValue('ok')
    await retryWithBackoff(fn, () => true, { maxAttempts: 1 })
    expect(fn).toHaveBeenCalledTimes(1)
  })
})

// ─── withRetry ────────────────────────────────────────────────

describe('withRetry', () => {
  it('cria wrapper que retenta automaticamente', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('falha'))
      .mockResolvedValue('sucesso')

    const retryFn = withRetry(fn, { maxAttempts: 3, initialDelayMs: 1, maxDelayMs: 10 })
    const result = await retryFn()

    expect(result).toBe('sucesso')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('passa argumentos para a funcao original', async () => {
    const fn = vi.fn().mockResolvedValue('ok')
    const retryFn = withRetry(fn, { maxAttempts: 1 })

    await retryFn('arg1', 'arg2')
    expect(fn).toHaveBeenCalledWith('arg1', 'arg2')
  })
})
