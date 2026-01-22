/**
 * Hooks para Operações Assíncronas com Tratamento de Erro
 * Fornece states: loading, error, data
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { AppError, normalizeError } from '@/lib/errors'
import { retryWithBackoff } from '@/lib/retry'
import type { RetryConfig } from '@/lib/retry'

export interface UseAsyncState<T> {
  data: T | null
  loading: boolean
  error: AppError | null
  isRetryable: boolean
}

interface UseAsyncOptions<T> {
  retryConfig?: Partial<RetryConfig>
  onError?: (error: AppError) => void
  onSuccess?: (data: T) => void
  immediate?: boolean
}

/**
 * Hook para operações assíncronas com suporte a retry
 */
export function useAsync<T>(
  asyncFn: () => Promise<T>,
  options: UseAsyncOptions<T> = {}
) {
  const {
    retryConfig,
    onError,
    onSuccess,
    immediate = true,
  } = options
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
    isRetryable: false,
  })

  const isMountedRef = useRef(true)

  const execute = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const result = await retryWithBackoff(
        asyncFn,
        (error: unknown) => {
          const appError = normalizeError(error)
          return appError.isRetryable
        },
        retryConfig
      )

      if (isMountedRef.current) {
        setState({ data: result, loading: false, error: null, isRetryable: false })
        onSuccess?.(result)
      }
    } catch (error) {
      const appError = normalizeError(error)

      if (isMountedRef.current) {
        setState({
          data: null,
          loading: false,
          error: appError,
          isRetryable: appError.isRetryable,
        })
        onError?.(appError)
      }
    }
  }, [asyncFn, retryConfig, onError, onSuccess])

  useEffect(() => {
    if (immediate) {
      const timeoutId = setTimeout(() => {
        void execute()
      }, 0)
      return () => {
        clearTimeout(timeoutId)
        isMountedRef.current = false
      }
    }

    return () => {
      isMountedRef.current = false
    }
  }, [execute, immediate])

  return { ...state, execute }
}

/**
 * Hook para operações CRUD com cache
 */
export interface UseCrudState<T> extends UseAsyncState<T[]> {
  create: (item: Omit<T, 'id'>) => Promise<T>
  update: (id: string, item: Partial<T>) => Promise<T>
  delete: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useCrud<T extends { id: string }>(
  fetchFn: () => Promise<T[]>,
  options: UseAsyncOptions<T[]> = {}
): UseCrudState<T> {
  const { onSuccess, onError, immediate = true } = options
  const [data, setData] = useState<T[] | null>(null)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState<AppError | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchFn()
      setData(result)
      setError(null)
      onSuccess?.(result)
    } catch (err) {
      const appError = normalizeError(err)
      setError(appError)
      onError?.(appError)
    } finally {
      setLoading(false)
    }
  }, [fetchFn, onError, onSuccess])

  useEffect(() => {
    if (immediate) {
      const timeoutId = setTimeout(() => {
        void refresh()
      }, 0)
      return () => clearTimeout(timeoutId)
    }
    return undefined
  }, [refresh, immediate])

  const create = useCallback(
    async (_item: Omit<T, 'id'>) => {
      void _item
      // Implementar no serviço específico
      throw new Error('Create não implementado')
    },
    []
  )

  const update = useCallback(
    async (_id: string, _item: Partial<T>) => {
      void _id
      void _item
      // Implementar no serviço específico
      throw new Error('Update não implementado')
    },
    []
  )

  const deleteItem = useCallback(
    async (_id: string) => {
      void _id
      // Implementar no serviço específico
      throw new Error('Delete não implementado')
    },
    []
  )

  return {
    data: data || [],
    loading,
    error,
    isRetryable: error?.isRetryable || false,
    create,
    update,
    delete: deleteItem,
    refresh,
  }
}

/**
 * Hook para form com validação e erro
 */
export interface UseFormState<T> {
  values: T
  errors: Record<keyof T, string>
  touched: Record<keyof T, boolean>
  isSubmitting: boolean
  isValid: boolean
  setValue: <K extends keyof T>(field: K, value: T[K]) => void
  setError: <K extends keyof T>(field: K, error: string) => void
  setTouched: <K extends keyof T>(field: K, touched: boolean) => void
  handleSubmit: (onSubmit: (values: T) => Promise<void>) => (e: React.FormEvent) => Promise<void>
  reset: () => void
}

export function useForm<T extends Record<string, unknown>>(
  initialValues: T,
  _onSubmit?: (values: T) => Promise<void>
): UseFormState<T> {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  void _onSubmit

  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    // Limpar erro quando usuário mudar valor
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }, [])

  const setError = useCallback(<K extends keyof T>(field: K, error: string) => {
    setErrors((prev) => ({ ...prev, [field]: error }))
  }, [])

  const setFieldTouched = useCallback(<K extends keyof T>(field: K, isTouched: boolean) => {
    setTouched((prev) => ({ ...prev, [field]: isTouched }))
  }, [])

  const isValid = Object.values(errors).every((err) => !err)

  const handleSubmit = useCallback(
    (submitFn: (values: T) => Promise<void>) => async (e: React.FormEvent) => {
      e.preventDefault()
      if (!isValid) return

      setIsSubmitting(true)
      try {
        await submitFn(values)
      } catch (error) {
        const appError = normalizeError(error)
        setErrors({ form: appError.message })
      } finally {
        setIsSubmitting(false)
      }
    },
    [values, isValid]
  )

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }, [initialValues])

  return {
    values,
    errors: errors as Record<keyof T, string>,
    touched: touched as Record<keyof T, boolean>,
    isSubmitting,
    isValid,
    setValue,
    setError,
    setTouched: setFieldTouched,
    handleSubmit,
    reset,
  }
}

/**
 * Hook para dados com cache local
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const setStoredValue = (newValue: T | ((prev: T) => T)) => {
    try {
      const valueToStore = typeof newValue === 'function' ? (newValue as (prev: T) => T)(value) : newValue
      setValue(valueToStore)
      localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(`Erro salvando em localStorage: ${key}`, error)
    }
  }

  return [value, setStoredValue] as const
}

/**
 * Hook para debounce
 */
export function useDebounce<T>(value: T, delayMs: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delayMs)

    return () => clearTimeout(handler)
  }, [value, delayMs])

  return debouncedValue
}

/**
 * Hook para online/offline status
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

