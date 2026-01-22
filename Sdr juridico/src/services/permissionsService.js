import { supabase } from "@/lib/supabaseClient";
import { AppError } from "@/utils/errors";
import {
  getPermissionsByRole,
  FARTECH_ADMIN_PERMISSIONS
} from "@/types/permissions";
import { ensureUsuario } from "@/services/usuariosService";
import { telemetryService } from "@/services/telemetryService";
const resolveRoleFromPermissoes = (permissoes, memberRole) => {
  if (permissoes.includes("fartech_admin")) {
    return "fartech_admin";
  }
  if (memberRole && ["admin", "gestor", "org_admin"].includes(memberRole)) {
    return "org_admin";
  }
  if (permissoes.includes("gestor") || permissoes.includes("org_admin")) {
    return "org_admin";
  }
  return "user";
};
let currentUserPromise = null;
const permissionsService = {
  /**
   * Get current user with role information
   */
  async getCurrentUser() {
    if (currentUserPromise) {
      return currentUserPromise;
    }
    currentUserPromise = (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        const { usuario, missingUsuariosTable, seed } = await ensureUsuario(user);
        const fallbackName = user.user_metadata && user.user_metadata.nome_completo || user.email || "Usuario";
        const baseName = usuario?.nome_completo || seed?.nome_completo || fallbackName;
        const baseEmail = usuario?.email || seed?.email || user.email || "";
        const permissoes = usuario?.permissoes || seed?.permissoes || [];
        const isFartechAdmin = permissoes.includes("fartech_admin") || seed?.is_fartech_admin === true;
        console.log("[PermissionsService] Dados do usuario:", { usuario, seed });
        console.log("[PermissionsService] Permissoes do usuario:", permissoes);
        console.log("[PermissionsService] isFartechAdmin:", isFartechAdmin);
        if (missingUsuariosTable) {
          console.log("[PermissionsService] usuarios table missing, using fallback");
        }
        const { data: memberData } = await supabase.from("org_members").select("org_id, role").eq("user_id", user.id).eq("ativo", true).order("created_at", { ascending: true }).limit(1).maybeSingle();
        const membershipRole = memberData?.role || seed?.role || null;
        const role = resolveRoleFromPermissoes(permissoes, membershipRole);
        console.log("[PermissionsService] Role final:", role, "membershipRole:", membershipRole);
        return {
          id: user.id,
          email: baseEmail,
          name: baseName,
          role,
          org_id: memberData?.org_id || seed?.org_id || null,
          is_fartech_admin: isFartechAdmin
        };
      } catch (error) {
        console.error("Error getting current user:", error);
        return null;
      }
    })();
    try {
      return await currentUserPromise;
    } finally {
      currentUserPromise = null;
    }
  },
  /**
   * Check if user has permission
   */
  async checkPermission(check) {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return { allowed: false, reason: "Usu\xE1rio n\xE3o autenticado" };
      }
      if (user.is_fartech_admin) {
        return { allowed: true };
      }
      const permissions = getPermissionsByRole(user.role);
      const hasPermission = permissions.some(
        (p) => p.resource === check.resource && (p.action === check.action || p.action === "manage")
      );
      if (!hasPermission) {
        return {
          allowed: false,
          reason: `Usu\xE1rio n\xE3o tem permiss\xE3o para ${check.action} em ${check.resource}`
        };
      }
      if (check.target_org_id && !user.is_fartech_admin) {
        return {
          allowed: false,
          reason: "Opera\xE7\xE3o n\xE3o permitida em outra organiza\xE7\xE3o"
        };
      }
      return { allowed: true };
    } catch (error) {
      console.error("Error checking permission:", error);
      return {
        allowed: false,
        reason: "Erro ao verificar permiss\xE3o"
      };
    }
  },
  /**
   * Check multiple permissions at once
   */
  async checkPermissions(checks) {
    const results = {};
    for (const check of checks) {
      const key = `${check.resource}:${check.action}`;
      results[key] = await this.checkPermission(check);
    }
    return results;
  },
  /**
   * Get all permissions for current user
   */
  async getUserPermissions() {
    try {
      const user = await this.getCurrentUser();
      if (!user) return [];
      if (user.is_fartech_admin) {
        return FARTECH_ADMIN_PERMISSIONS;
      }
      return getPermissionsByRole(user.role);
    } catch (error) {
      console.error("Error getting user permissions:", error);
      return [];
    }
  },
  /**
   * Check if user can access resource
   */
  async canAccess(resource, action = "read") {
    const result = await this.checkPermission({ resource, action });
    return result.allowed;
  },
  /**
   * Check if user is Fartech admin
   */
  async isFartechAdmin() {
    try {
      const user = await this.getCurrentUser();
      return user?.is_fartech_admin || false;
    } catch (error) {
      return false;
    }
  },
  /**
   * Check if user is org admin
   */
  async isOrgAdmin() {
    try {
      const user = await this.getCurrentUser();
      return user?.role === "org_admin" || user?.is_fartech_admin || false;
    } catch (error) {
      return false;
    }
  },
  /**
   * Check if user can manage users in their org
   */
  async canManageUsers() {
    return this.canAccess("users", "manage");
  },
  /**
   * Check if user can manage organization settings
   */
  async canManageOrg() {
    return this.canAccess("organizations", "manage");
  },
  /**
   * Check if user can access billing
   */
  async canAccessBilling() {
    return this.canAccess("billing", "read");
  },
  /**
   * Get user's organization ID
   */
  async getUserOrgId() {
    try {
      const user = await this.getCurrentUser();
      return user?.org_id || null;
    } catch (error) {
      return null;
    }
  },
  /**
   * Get user's organization membership with role
   */
  async getUserOrgMembership(_orgId) {
    try {
      void _orgId;
      return null;
    } catch (error) {
      console.error("Error getting user org membership:", error);
      return null;
    }
  },
  /**
   * Validate if user can perform action on specific org
   */
  async validateOrgAccess(_targetOrgId) {
    try {
      void _targetOrgId;
      const user = await this.getCurrentUser();
      if (!user) return false;
      if (user.is_fartech_admin) return true;
      return false;
    } catch (error) {
      return false;
    }
  },
  /**
   * Check if user can perform action on resource within their org
   */
  async canAccessInOrg(resource, action, targetOrgId) {
    const permissionResult = await this.checkPermission({ resource, action });
    if (!permissionResult.allowed) return permissionResult;
    const hasOrgAccess = await this.validateOrgAccess(targetOrgId);
    if (!hasOrgAccess) {
      return {
        allowed: false,
        reason: "Acesso negado para esta organiza\xE7\xE3o"
      };
    }
    return { allowed: true };
  },
  /**
   * Log permission check for audit
   */
  async logPermissionCheck(check, result, metadata) {
    try {
      const user = await this.getCurrentUser();
      if (!user) return;
      if (!user.org_id) return;
      const sensitiveResources = ["organizations", "users", "billing"];
      if (!sensitiveResources.includes(check.resource)) return;
      await telemetryService.logAuditEvent({
        org_id: user.org_id,
        actor_user_id: user.id,
        action: check.action,
        entity: check.resource,
        entity_id: metadata?.resource_id || null,
        details: {
          ...metadata,
          success: result.allowed,
          reason: result.reason
        }
      });
    } catch (error) {
      console.error("Error logging permission check:", error);
    }
  },
  /**
   * Require permission (throws if not allowed)
   */
  async requirePermission(check) {
    const result = await this.checkPermission(check);
    if (!result.allowed) {
      throw new AppError(
        result.reason || "Permiss\xE3o negada",
        "permission_denied"
      );
    }
  },
  /**
   * Require Fartech admin role (throws if not)
   */
  async requireFartechAdmin() {
    const isFartech = await this.isFartechAdmin();
    if (!isFartech) {
      throw new AppError(
        "Esta opera\xE7\xE3o requer permiss\xF5es de administrador Fartech",
        "permission_denied"
      );
    }
  },
  /**
   * Require org admin role (throws if not)
   */
  async requireOrgAdmin() {
    const isAdmin = await this.isOrgAdmin();
    if (!isAdmin) {
      throw new AppError(
        "Esta opera\xE7\xE3o requer permiss\xF5es de administrador da organiza\xE7\xE3o",
        "permission_denied"
      );
    }
  }
};
export {
  permissionsService
};
