/**
 * Serviço Base para todas as requisições HTTP
 * Implementa retry, timeout, error handling centralizado
 */
import { AppError, AuthenticationError, AuthorizationError, NetworkError, NotFoundError, ServerError, TimeoutError, normalizeError, errorLogger, } from '@/lib/errors';
import { retryWithBackoff } from '@/lib/retry';
const DEFAULT_TIMEOUT = 30000; // 30 segundos
const DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
};
/**
 * Classe para gerenciar requisições HTTP com resiliência
 */
export class ApiClient {
    baseUrl;
    defaultHeaders;
    defaultRetryConfig;
    constructor(baseUrl = '', defaultHeaders = {}, retryConfig) {
        this.baseUrl = baseUrl;
        this.defaultHeaders = { ...DEFAULT_HEADERS, ...defaultHeaders };
        this.defaultRetryConfig = retryConfig || {};
    }
    /**
     * Faz requisição com tratamento automático de retry e timeout
     */
    async request(url, config = {}) {
        const finalUrl = `${this.baseUrl}${url}`;
        const timeout = config.timeout || DEFAULT_TIMEOUT;
        const method = config.method || 'GET';
        const makeRequest = async () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            try {
                const response = await fetch(finalUrl, {
                    method,
                    headers: {
                        ...this.defaultHeaders,
                        ...config.headers,
                    },
                    body: config.body ? JSON.stringify(config.body) : undefined,
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);
                // Tratamento de respostas
                if (!response.ok) {
                    this.handleErrorResponse(response);
                }
                const contentType = response.headers.get('content-type');
                const data = contentType?.includes('application/json')
                    ? await response.json()
                    : await response.text();
                return data;
            }
            catch (error) {
                clearTimeout(timeoutId);
                throw this.normalizeRequestError(error, method, finalUrl);
            }
        };
        try {
            return await retryWithBackoff(makeRequest, (error) => {
                const appError = normalizeError(error);
                return appError.isRetryable;
            }, { ...this.defaultRetryConfig, ...config.retry });
        }
        catch (error) {
            const appError = normalizeError(error);
            if (!config.skipErrorLog) {
                errorLogger.error(appError, {
                    url: finalUrl,
                    method,
                });
            }
            throw appError;
        }
    }
    /**
     * GET request
     */
    async get(url, config) {
        return this.request(url, { ...config, method: 'GET' });
    }
    /**
     * POST request
     */
    async post(url, body, config) {
        return this.request(url, { ...config, method: 'POST', body });
    }
    /**
     * PUT request
     */
    async put(url, body, config) {
        return this.request(url, { ...config, method: 'PUT', body });
    }
    /**
     * PATCH request
     */
    async patch(url, body, config) {
        return this.request(url, { ...config, method: 'PATCH', body });
    }
    /**
     * DELETE request
     */
    async delete(url, config) {
        return this.request(url, { ...config, method: 'DELETE' });
    }
    /**
     * Trata respostas de erro HTTP
     */
    handleErrorResponse(response) {
        switch (response.status) {
            case 400:
                throw new AppError(`Requisição inválida: ${response.statusText}`, 'VALIDATION', undefined, false);
            case 401:
                throw new AuthenticationError('Sessão expirada. Faça login novamente.');
            case 403:
                throw new AuthorizationError('Você não tem permissão para acessar este recurso.');
            case 404:
                throw new NotFoundError('Recurso não encontrado.');
            case 429:
                throw new AppError('Muitas requisições. Tente novamente mais tarde.', 'RATE_LIMIT', undefined, true);
            case 500:
            case 502:
            case 503:
            case 504:
                throw new ServerError(`Erro no servidor: ${response.statusText}`);
            default:
                throw new ServerError(`Erro na requisição: ${response.statusText}`);
        }
    }
    /**
     * Normaliza erros de requisição
     */
    normalizeRequestError(error, method, url) {
        if (error instanceof DOMException && error.name === 'AbortError') {
            return new TimeoutError(`Operação ${method} ${url} expirou`);
        }
        if (error instanceof TypeError && error.message.includes('fetch')) {
            return new NetworkError(`Erro de conexão ao acessar ${url}`, error);
        }
        return normalizeError(error);
    }
    /**
     * Health check de conectividade
     */
    async healthCheck() {
        try {
            await this.get('/health', {
                timeout: 5000,
                skipErrorLog: true,
            });
            return true;
        }
        catch {
            return false;
        }
    }
}
// Instância padrão (sem base URL)
export const apiClient = new ApiClient();
// Instância para Supabase (será configurada depois)
export let supabaseApiClient = null;
export function initializeSupabaseApiClient(url, apiKey) {
    supabaseApiClient = new ApiClient(url, {
        'Content-Type': 'application/json',
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
    });
}
