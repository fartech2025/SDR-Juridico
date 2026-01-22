/**
 * Hooks para Operações Assíncronas com Tratamento de Erro
 * Fornece states: loading, error, data
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppError, normalizeError } from '@/lib/errors';
import { retryWithBackoff } from '@/lib/retry';
/**
 * Hook para operações assíncronas com suporte a retry
 */
export function useAsync(asyncFn, options = {}) {
    const { retryConfig, onError, onSuccess, immediate = true } = options;
    const [state, setState] = useState({
        data: null,
        loading: immediate,
        error: null,
        isRetryable: false,
    });
    const isMountedRef = useRef(true);
    const execute = useCallback(async () => {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        try {
            const result = await retryWithBackoff(asyncFn, (error) => {
                const appError = normalizeError(error);
                return appError.isRetryable;
            }, retryConfig);
            if (isMountedRef.current) {
                setState({ data: result, loading: false, error: null, isRetryable: false });
                onSuccess?.(result);
            }
        }
        catch (error) {
            const appError = normalizeError(error);
            if (isMountedRef.current) {
                setState({
                    data: null,
                    loading: false,
                    error: appError,
                    isRetryable: appError.isRetryable,
                });
                onError?.(appError);
            }
        }
    }, [asyncFn, retryConfig, onError, onSuccess]);
    useEffect(() => {
        if (immediate) {
            const timeoutId = setTimeout(() => {
                void execute();
            }, 0);
            return () => {
                clearTimeout(timeoutId);
                isMountedRef.current = false;
            };
        }
        return () => {
            isMountedRef.current = false;
        };
    }, [execute, immediate]);
    return { ...state, execute };
}
export function useCrud(fetchFn, options = {}) {
    const { onSuccess, onError, immediate = true } = options;
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(immediate);
    const [error, setError] = useState(null);
    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const result = await fetchFn();
            setData(result);
            setError(null);
            onSuccess?.(result);
        }
        catch (err) {
            const appError = normalizeError(err);
            setError(appError);
            onError?.(appError);
        }
        finally {
            setLoading(false);
        }
    }, [fetchFn, onError, onSuccess]);
    useEffect(() => {
        if (immediate) {
            const timeoutId = setTimeout(() => {
                void refresh();
            }, 0);
            return () => clearTimeout(timeoutId);
        }
        return undefined;
    }, [refresh, immediate]);
    const create = useCallback(async (_item) => {
        void _item;
        // Implementar no serviço específico
        throw new Error('Create não implementado');
    }, []);
    const update = useCallback(async (_id, _item) => {
        void _id;
        void _item;
        // Implementar no serviço específico
        throw new Error('Update não implementado');
    }, []);
    const deleteItem = useCallback(async (_id) => {
        void _id;
        // Implementar no serviço específico
        throw new Error('Delete não implementado');
    }, []);
    return {
        data: data || [],
        loading,
        error,
        isRetryable: error?.isRetryable || false,
        create,
        update,
        delete: deleteItem,
        refresh,
    };
}
export function useForm(initialValues, _onSubmit) {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    void _onSubmit;
    const setValue = useCallback((field, value) => {
        setValues((prev) => ({ ...prev, [field]: value }));
        // Limpar erro quando usuário mudar valor
        setErrors((prev) => ({ ...prev, [field]: '' }));
    }, []);
    const setError = useCallback((field, error) => {
        setErrors((prev) => ({ ...prev, [field]: error }));
    }, []);
    const setFieldTouched = useCallback((field, isTouched) => {
        setTouched((prev) => ({ ...prev, [field]: isTouched }));
    }, []);
    const isValid = Object.values(errors).every((err) => !err);
    const handleSubmit = useCallback((submitFn) => async (e) => {
        e.preventDefault();
        if (!isValid)
            return;
        setIsSubmitting(true);
        try {
            await submitFn(values);
        }
        catch (error) {
            const appError = normalizeError(error);
            setErrors({ form: appError.message });
        }
        finally {
            setIsSubmitting(false);
        }
    }, [values, isValid]);
    const reset = useCallback(() => {
        setValues(initialValues);
        setErrors({});
        setTouched({});
    }, [initialValues]);
    return {
        values,
        errors: errors,
        touched: touched,
        isSubmitting,
        isValid,
        setValue,
        setError,
        setTouched: setFieldTouched,
        handleSubmit,
        reset,
    };
}
/**
 * Hook para dados com cache local
 */
export function useLocalStorage(key, initialValue) {
    const [value, setValue] = useState(() => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        }
        catch {
            return initialValue;
        }
    });
    const setStoredValue = (newValue) => {
        try {
            const valueToStore = typeof newValue === 'function' ? newValue(value) : newValue;
            setValue(valueToStore);
            localStorage.setItem(key, JSON.stringify(valueToStore));
        }
        catch (error) {
            console.error(`Erro salvando em localStorage: ${key}`, error);
        }
    };
    return [value, setStoredValue];
}
/**
 * Hook para debounce
 */
export function useDebounce(value, delayMs = 500) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delayMs);
        return () => clearTimeout(handler);
    }, [value, delayMs]);
    return debouncedValue;
}
/**
 * Hook para online/offline status
 */
export function useOnlineStatus() {
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);
    return isOnline;
}



