/**
 * Sistema de Health Check e Monitoramento
 * Monitora saúde da aplicação e conectividade
 * 
 * IMPORTANTE: Health checks que requerem autenticação só são executados
 * quando o usuário tem sessão válida. Isso evita erros 401 desnecessários.
 */

import { supabase } from '@/lib/supabaseClient'

// Flag para controlar se o usuário está autenticado
let isAuthenticated = false
let hasValidOrg = false

/**
 * Atualiza o estado de autenticação para controlar health checks
 * Deve ser chamado quando o estado de auth/org mudar
 */
export function setHealthCheckAuthState(authenticated: boolean, validOrg: boolean = false) {
  isAuthenticated = authenticated
  hasValidOrg = validOrg
}

export const ServiceStatusValues = {
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  OFFLINE: 'offline',
} as const

export type ServiceStatus = typeof ServiceStatusValues[keyof typeof ServiceStatusValues]

export interface ServiceHealth {
  name: string
  status: ServiceStatus
  lastCheck: Date
  message?: string
  responseTime?: number
}

export interface AppHealth {
  status: ServiceStatus
  timestamp: Date
  services: Record<string, ServiceHealth>
  uptime: number
}

class HealthMonitor {
  private services: Map<string, ServiceHealth> = new Map()
  private checkIntervals: Map<string, ReturnType<typeof setInterval>> = new Map()
  private startTime: Date = new Date()

  /**
   * Registra um serviço para monitoramento
   */
  registerService(name: string, checkFn: () => Promise<boolean>, interval: number = 30000) {
    // Fazer check inicial
    this.performCheck(name, checkFn)

    // Fazer checks periódicos
    const intervalId = setInterval(() => {
      this.performCheck(name, checkFn)
    }, interval)

    this.checkIntervals.set(name, intervalId)
  }

  /**
   * Remove monitoramento de um serviço
   */
  unregisterService(name: string) {
    const intervalId = this.checkIntervals.get(name)
    if (intervalId) {
      clearInterval(intervalId)
      this.checkIntervals.delete(name)
    }
    this.services.delete(name)
  }

  /**
   * Executa check de saúde de um serviço
   */
  private async performCheck(name: string, checkFn: () => Promise<boolean>) {
    const startTime = performance.now()
    try {
      const isHealthy = await Promise.race([
        checkFn(),
        new Promise<false>((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout')), 5000)
        ),
      ])

      const responseTime = performance.now() - startTime

      this.services.set(name, {
        name,
        status: isHealthy ? ServiceStatusValues.HEALTHY : ServiceStatusValues.DEGRADED,
        lastCheck: new Date(),
        responseTime,
        message: isHealthy ? 'OK' : 'Serviço degradado',
      })
    } catch (error) {
      this.services.set(name, {
        name,
        status: ServiceStatusValues.OFFLINE,
        lastCheck: new Date(),
        responseTime: performance.now() - startTime,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      })
    }
  }

  /**
   * Obtém status geral da aplicação
   */
  getHealth(): AppHealth {
    const services = Object.fromEntries(this.services)
    const hasOffline = Array.from(this.services.values()).some(
      (s) => s.status === ServiceStatusValues.OFFLINE
    )
    const hasDegraded = Array.from(this.services.values()).some(
      (s) => s.status === ServiceStatusValues.DEGRADED
    )

    return {
      status: hasOffline ? ServiceStatusValues.OFFLINE : hasDegraded ? ServiceStatusValues.DEGRADED : ServiceStatusValues.HEALTHY,
      timestamp: new Date(),
      services,
      uptime: Date.now() - this.startTime.getTime(),
    }
  }

  /**
   * Obtém status de um serviço específico
   */
  getServiceStatus(name: string): ServiceHealth | undefined {
    return this.services.get(name)
  }

  /**
   * Limpa todos os intervalos
   */
  destroy() {
    this.checkIntervals.forEach((intervalId) => clearInterval(intervalId))
    this.checkIntervals.clear()
    this.services.clear()
  }
}

export const healthMonitor = new HealthMonitor()

/**
 * Check de conectividade com internet
 */
export async function checkInternetConnectivity(): Promise<boolean> {
  try {
    const response = await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
    })
    return response.ok || response.status === 0 // status 0 significa sucesso em no-cors
  } catch {
    return false
  }
}

/**
 * Check de disponibilidade da API
 */
export async function checkApiHealth(apiUrl: string): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(`${apiUrl}/health`, {
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    return response.ok
  } catch {
    return false
  }
}

/**
 * Check de localStorage
 */
export async function checkLocalStorage(): Promise<boolean> {
  try {
    const testKey = '__storage_test__'
    localStorage.setItem(testKey, 'test')
    localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

/**
 * Check de DataJud API connectivity
 * 
 * DESABILITADO: Este check foi desabilitado porque a Edge Function
 * datajud-enhanced pode não estar deployada ou requer configuração
 * especial. O DataJud será verificado sob demanda quando o usuário
 * acessar a funcionalidade específica.
 * 
 * Para reativar, descomente o código abaixo.
 */
export async function checkDataJudConnectivity(): Promise<boolean> {
  // Health check do DataJud desabilitado - sempre retorna true
  // A conectividade será verificada quando o usuário usar a funcionalidade
  return true
  
  /* CÓDIGO ORIGINAL - DESCOMENTE PARA REATIVAR
  // Só verificar DataJud se usuário autenticado com organização válida
  if (!isAuthenticated || !hasValidOrg) {
    return true // Retorna true para não marcar como "offline" - simplesmente skip
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await supabase.functions.invoke('datajud-enhanced', {
      body: {
        tribunal: 'trf1',
        searchType: 'parte',
        query: 'teste-conexao',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    return Boolean(response.data)
  } catch (error) {
    // Silencia erros 401/403 quando não há autenticação adequada
    if (error instanceof Error && error.message.includes('401')) {
      return true // Skip check sem marcar como erro
    }
    console.warn('DataJud connectivity check failed:', error)
    return false
  }
  */
}

/**
 * Check de Supabase connectivity
 * Usa um endpoint público que não requer autenticação
 */
export async function checkSupabaseConnectivity(): Promise<boolean> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    if (!supabaseUrl) {
      return false
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    // Usar endpoint REST público em vez de /health que requer auth
    // O endpoint /rest/v1/ retorna 200 mesmo sem auth (apenas mostra schema)
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      },
    })

    clearTimeout(timeoutId)
    // Qualquer resposta que não seja network error indica que Supabase está acessível
    return response.status !== 0 && response.status < 500
  } catch (error) {
    console.warn('Supabase connectivity check failed:', error)
    return false
  }
}


/**
 * Inicializa health checks automáticos
 * 
 * IMPORTANTE: Checks que requerem autenticação (DataJud) só executam
 * efetivamente quando setHealthCheckAuthState(true, true) é chamado.
 * Isso evita erros 401 quando o usuário não está logado ou não tem org.
 */
export function initializeHealthChecks() {
  // Check internet connectivity a cada 30 segundos
  healthMonitor.registerService('internet', checkInternetConnectivity, 30000)

  // Check localStorage a cada 1 minuto
  healthMonitor.registerService('localStorage', checkLocalStorage, 60000)

  // Check DataJud connectivity a cada 60 segundos
  // NOTA: Só executa de verdade se isAuthenticated && hasValidOrg
  healthMonitor.registerService('datajud', checkDataJudConnectivity, 60000)

  // Check Supabase connectivity a cada 30 segundos
  // Usa endpoint público, não requer auth
  healthMonitor.registerService('supabase', checkSupabaseConnectivity, 30000)

  // Cleanup ao descarregar a página
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      healthMonitor.destroy()
    })
  }
}

