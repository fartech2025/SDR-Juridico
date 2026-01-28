// Permissions Service - RBAC management
// Correção: Modelo de permissões unificado e cache funcional

import { supabase } from '@/lib/supabaseClient'
import { AppError } from '@/utils/errors'
import type {
  Permission,
  PermissionCheck,
  PermissionResult,
  UserWithRole,
  Resource,
  PermissionAction,
  UserRole,
} from '@/types/permissions'
import {
  getPermissionsByRole,
  FARTECH_ADMIN_PERMISSIONS,
} from '@/types/permissions'
import { ensureUsuario } from '@/services/usuariosService'

// ============================================================
// TIPOS
// ============================================================

type OrgMemberRole = 'admin' | 'gestor' | 'advogado' | 'secretaria' | 'leitura'

interface CachedUser extends UserWithRole {
  cachedAt: number
}

// ============================================================
// CONSTANTES
// ============================================================

const USER_CACHE_TTL_MS = 10000 // 10 segundos
const IS_DEV = import.meta.env.DEV

// ============================================================
// CACHE
// ============================================================

let cachedUser: CachedUser | null = null

function isCacheValid(): boolean {
  if (!cachedUser) return false
  return (Date.now() - cachedUser.cachedAt) < USER_CACHE_TTL_MS
}

function clearUserCache(): void {
  cachedUser = null
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Resolve o papel do usuário baseado APENAS em org_members.role.
 * usuarios.permissoes é usado APENAS para verificar fartech_admin.
 */
function resolveUserRole(
  isFartechAdmin: boolean,
  memberRole: OrgMemberRole | null
): UserRole {
  if (isFartechAdmin) {
    return 'fartech_admin'
  }

  if (!memberRole) {
    return 'user'
  }

  const roleMap: Record<OrgMemberRole, UserRole> = {
    admin: 'org_admin',
    gestor: 'org_admin',
    advogado: 'user',
    secretaria: 'user',
    leitura: 'user',
  }

  return roleMap[memberRole] || 'user'
}

function logDebug(message: string, data?: unknown): void {
  if (IS_DEV) {
    console.log(`[PermissionsService] ${message}`, data ?? '')
  }
}

// ============================================================
// SERVICE
// ============================================================

export const permissionsService = {
  /**
   * Obtém o usuário atual com informações de role.
   * Implementa cache para evitar múltiplas chamadas.
   */
  async getCurrentUser(): Promise<UserWithRole | null> {
    // Retorna cache se válido
    if (isCacheValid() && cachedUser) {
      return cachedUser
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        clearUserCache()
        return null
      }

      // Busca dados do usuário
      const { usuario, seed } = await ensureUsuario(user)

      // Resolve nome e email
      const fallbackName =
        (user.user_metadata as { nome_completo?: string })?.nome_completo ||
        user.email ||
        'Usuario'
      const name = usuario?.nome_completo || seed?.nome_completo || fallbackName
      const email = usuario?.email || seed?.email || user.email || ''

      // Verifica se é fartech_admin (APENAS via usuarios.permissoes)
      const permissoes = usuario?.permissoes || seed?.permissoes || []
      const isFartechAdmin = permissoes.includes('fartech_admin')

      logDebug('Dados do usuario:', { id: user.id, isFartechAdmin })

      // Busca membership (FONTE DE VERDADE para role na org)
      const { data: memberData } = await supabase
        .from('org_members')
        .select('org_id, role')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      const memberRole = (memberData?.role || seed?.role || null) as OrgMemberRole | null
      const role = resolveUserRole(isFartechAdmin, memberRole)

      logDebug('Role resolvido:', { role, memberRole })

      const userWithRole: UserWithRole = {
        id: user.id,
        email,
        name,
        role,
        org_id: memberData?.org_id || seed?.org_id || null,
        is_fartech_admin: isFartechAdmin,
      }

      // Atualiza cache
      cachedUser = {
        ...userWithRole,
        cachedAt: Date.now(),
      }

      return userWithRole
    } catch (error) {
      console.error('Erro ao obter usuario atual:', error)
      clearUserCache()
      return null
    }
  },

  /**
   * Verifica se o usuário tem uma permissão específica.
   */
  async checkPermission(check: PermissionCheck): Promise<PermissionResult> {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        return { allowed: false, reason: 'Usuario nao autenticado' }
      }

      // Fartech admins têm todas as permissões
      if (user.is_fartech_admin) {
        return { allowed: true }
      }

      // Obtém permissões do role
      const permissions = getPermissionsByRole(user.role)

      // Verifica se tem a permissão
      const hasPermission = permissions.some(
        (p) =>
          p.resource === check.resource &&
          (p.action === check.action || p.action === 'manage')
      )

      if (!hasPermission) {
        return {
          allowed: false,
          reason: `Usuario nao tem permissao para ${check.action} em ${check.resource}`,
        }
      }

      // Verifica acesso cross-org
      if (check.target_org_id && check.target_org_id !== user.org_id) {
        return {
          allowed: false,
          reason: 'Operacao nao permitida em outra organizacao',
        }
      }

      return { allowed: true }
    } catch (error) {
      console.error('Erro ao verificar permissao:', error)
      return {
        allowed: false,
        reason: 'Erro ao verificar permissao',
      }
    }
  },

  /**
   * Verifica múltiplas permissões de uma vez.
   */
  async checkPermissions(
    checks: PermissionCheck[]
  ): Promise<Record<string, PermissionResult>> {
    const results: Record<string, PermissionResult> = {}

    const promises = checks.map(async (check) => {
      const key = `${check.resource}:${check.action}`
      results[key] = await this.checkPermission(check)
    })

    await Promise.all(promises)
    return results
  },

  /**
   * Obtém todas as permissões do usuário atual.
   */
  async getUserPermissions(): Promise<Permission[]> {
    try {
      const user = await this.getCurrentUser()
      if (!user) return []

      if (user.is_fartech_admin) {
        return FARTECH_ADMIN_PERMISSIONS
      }

      return getPermissionsByRole(user.role)
    } catch (error) {
      console.error('Erro ao obter permissoes:', error)
      return []
    }
  },

  /**
   * Verifica se o usuário pode acessar um recurso.
   */
  async canAccess(
    resource: Resource,
    action: PermissionAction = 'read'
  ): Promise<boolean> {
    const result = await this.checkPermission({ resource, action })
    return result.allowed
  },

  /**
   * Verifica se o usuário é Fartech admin.
   */
  async isFartechAdmin(): Promise<boolean> {
    const user = await this.getCurrentUser()
    return user?.is_fartech_admin ?? false
  },

  /**
   * Verifica se o usuário é admin da organização.
   */
  async isOrgAdmin(): Promise<boolean> {
    const user = await this.getCurrentUser()
    return user?.role === 'org_admin' || user?.is_fartech_admin || false
  },

  /**
   * Obtém o ID da organização do usuário.
   */
  async getUserOrgId(): Promise<string | null> {
    const user = await this.getCurrentUser()
    return user?.org_id ?? null
  },

  /**
   * Requer uma permissão (lança erro se não permitido).
   */
  async requirePermission(check: PermissionCheck): Promise<void> {
    const result = await this.checkPermission(check)
    if (!result.allowed) {
      throw new AppError(result.reason || 'Permissao negada', 'permission_denied')
    }
  },

  /**
   * Requer role de Fartech admin.
   */
  async requireFartechAdmin(): Promise<void> {
    const isFartech = await this.isFartechAdmin()
    if (!isFartech) {
      throw new AppError(
        'Esta operacao requer permissoes de administrador Fartech',
        'permission_denied'
      )
    }
  },

  /**
   * Requer role de admin da organização.
   */
  async requireOrgAdmin(): Promise<void> {
    const isAdmin = await this.isOrgAdmin()
    if (!isAdmin) {
      throw new AppError(
        'Esta operacao requer permissoes de administrador',
        'permission_denied'
      )
    }
  },

  /**
   * Limpa o cache do usuário.
   * Deve ser chamado no logout.
   */
  clearCache(): void {
    clearUserCache()
  },
}
