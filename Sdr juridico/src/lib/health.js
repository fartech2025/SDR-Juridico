/**
 * Sistema de Health Check e Monitoramento
 * Monitora saúde da aplicação e conectividade
 */
export const ServiceStatusValues = {
    HEALTHY: 'healthy',
    DEGRADED: 'degraded',
    OFFLINE: 'offline',
};
class HealthMonitor {
    services = new Map();
    checkIntervals = new Map();
    startTime = new Date();
    /**
     * Registra um serviço para monitoramento
     */
    registerService(name, checkFn, interval = 30000) {
        // Fazer check inicial
        this.performCheck(name, checkFn);
        // Fazer checks periódicos
        const intervalId = setInterval(() => {
            this.performCheck(name, checkFn);
        }, interval);
        this.checkIntervals.set(name, intervalId);
    }
    /**
     * Remove monitoramento de um serviço
     */
    unregisterService(name) {
        const intervalId = this.checkIntervals.get(name);
        if (intervalId) {
            clearInterval(intervalId);
            this.checkIntervals.delete(name);
        }
        this.services.delete(name);
    }
    /**
     * Executa check de saúde de um serviço
     */
    async performCheck(name, checkFn) {
        const startTime = performance.now();
        try {
            const isHealthy = await Promise.race([
                checkFn(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Health check timeout')), 5000)),
            ]);
            const responseTime = performance.now() - startTime;
            this.services.set(name, {
                name,
                status: isHealthy ? ServiceStatusValues.HEALTHY : ServiceStatusValues.DEGRADED,
                lastCheck: new Date(),
                responseTime,
                message: isHealthy ? 'OK' : 'Serviço degradado',
            });
        }
        catch (error) {
            this.services.set(name, {
                name,
                status: ServiceStatusValues.OFFLINE,
                lastCheck: new Date(),
                responseTime: performance.now() - startTime,
                message: error instanceof Error ? error.message : 'Erro desconhecido',
            });
        }
    }
    /**
     * Obtém status geral da aplicação
     */
    getHealth() {
        const services = Object.fromEntries(this.services);
        const hasOffline = Array.from(this.services.values()).some((s) => s.status === ServiceStatusValues.OFFLINE);
        const hasDegraded = Array.from(this.services.values()).some((s) => s.status === ServiceStatusValues.DEGRADED);
        return {
            status: hasOffline ? ServiceStatusValues.OFFLINE : hasDegraded ? ServiceStatusValues.DEGRADED : ServiceStatusValues.HEALTHY,
            timestamp: new Date(),
            services,
            uptime: Date.now() - this.startTime.getTime(),
        };
    }
    /**
     * Obtém status de um serviço específico
     */
    getServiceStatus(name) {
        return this.services.get(name);
    }
    /**
     * Limpa todos os intervalos
     */
    destroy() {
        this.checkIntervals.forEach((intervalId) => clearInterval(intervalId));
        this.checkIntervals.clear();
        this.services.clear();
    }
}
export const healthMonitor = new HealthMonitor();
/**
 * Check de conectividade com internet
 */
export async function checkInternetConnectivity() {
    try {
        const response = await fetch('https://www.google.com/favicon.ico', {
            method: 'HEAD',
            mode: 'no-cors',
            cache: 'no-store',
        });
        return response.ok || response.status === 0; // status 0 significa sucesso em no-cors
    }
    catch {
        return false;
    }
}
/**
 * Check de disponibilidade da API
 */
export async function checkApiHealth(apiUrl) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(`${apiUrl}/health`, {
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response.ok;
    }
    catch {
        return false;
    }
}
/**
 * Check de localStorage
 */
export async function checkLocalStorage() {
    try {
        const testKey = '__storage_test__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Inicializa health checks automáticos
 */
export function initializeHealthChecks() {
    // Check internet connectivity a cada 30 segundos
    healthMonitor.registerService('internet', checkInternetConnectivity, 30000);
    // Check localStorage a cada 1 minuto
    healthMonitor.registerService('localStorage', checkLocalStorage, 60000);
    // Cleanup ao descarregar a página
    if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', () => {
            healthMonitor.destroy();
        });
    }
}
