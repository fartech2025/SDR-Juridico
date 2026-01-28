// src/services/orgScope.ts
// Cache com TTL para evitar race conditions

import { permissionsService } from '@/services/permissionsService'

export type OrgScope = {
  orgId: string | null
  userId: string | null
  isFartechAdmin: boolean
  role: string | null
}

// Cache com TTL
let cachedOrgScope: OrgScope | null = null
let cacheTimestamp = 0
const CACHE_TTL_MS = 5000 // 5 segundos

// Promise em andamento para evitar chamadas duplicadas
let pendingPromise: Promise<OrgScope> | null = null

/**
 * Resolve o escopo da organização do usuário atual.
 * Implementa cache com TTL para evitar múltiplas chamadas ao banco.
 */
export async function resolveOrgScope(): Promise<OrgScope> {
  const now = Date.now()

  // Retorna cache se ainda válido
  if (cachedOrgScope && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedOrgScope
  }

  // Se já tem uma promise em andamento, aguarda ela
  if (pendingPromise) {
    return pendingPromise
  }

  // Cria nova promise
  pendingPromise = (async () => {
    try {
      const user = await permissionsService.getCurrentUser()

      const scope: OrgScope = {
        orgId: user?.org_id ?? null,
        userId: user?.id ?? null,
        isFartechAdmin: user?.is_fartech_admin ?? false,
        role: user?.role ?? null,
      }

      // Atualiza cache
      cachedOrgScope = scope
      cacheTimestamp = Date.now()

      return scope
    } finally {
      pendingPromise = null
    }
  })()

  return pendingPromise
}

/**
 * Invalida o cache do orgScope.
 * Deve ser chamado no logout ou quando o usuário muda de organização.
 */
export function clearOrgScopeCache(): void {
  cachedOrgScope = null
  cacheTimestamp = 0
  pendingPromise = null
}

/**
 * Verifica se o usuário atual é staff (admin, gestor ou secretaria).
 * 
 * ⚠️ IMPORTANTE: O role retornado de resolveOrgScope() já está mapeado:
 * - 'gestor' no banco → retorna 'org_admin'
 * - 'admin' no banco → retorna 'org_admin'
 * - 'secretaria' no banco → retorna 'user'
 * 
 * Então este check compara com o valor após mapeamento ('org_admin', 'user')
 */
export async function isCurrentUserStaff(): Promise<boolean> {
  const { role } = await resolveOrgScope()
  // org_admin = gestor/admin, user = advogado/secretaria
  return role === 'org_admin' || role === 'user'
}

/**
 * Verifica se o usuário atual é gestor ou admin (org_admin).
 * 
 * ⚠️ IMPORTANTE: role aqui já está mapeado para 'org_admin' (não 'gestor')
 */
export async function isCurrentUserAdminish(): Promise<boolean> {
  const { role, isFartechAdmin } = await resolveOrgScope()
  if (isFartechAdmin) return true
  return role === 'org_admin' // Simples e correto após mapeamento
}
