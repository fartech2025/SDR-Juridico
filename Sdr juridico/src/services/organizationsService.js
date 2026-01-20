import { supabase } from "@/lib/supabaseClient";
import { AppError } from "@/utils/errors";
const slugify = (value) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const normalizePlan = (value) => {
  if (!value) return "trial";
  const lowered = value.toLowerCase();
  if (lowered === "starter") return "basic";
  if (lowered === "pro") return "professional";
  if (lowered === "enterprise") return "enterprise";
  if (lowered === "basic") return "basic";
  if (lowered === "professional") return "professional";
  return "trial";
};
const normalizeStatus = (value, ativo) => {
  if (!value) {
    if (ativo === null || ativo === void 0) return "pending";
    return ativo ? "active" : "suspended";
  }
  const lowered = value.toLowerCase();
  if (lowered === "active" || lowered === "ativo") return "active";
  if (lowered === "suspended" || lowered === "suspenso") return "suspended";
  if (lowered === "cancelled" || lowered === "cancelado" || lowered === "canceled") return "cancelled";
  if (lowered === "pending" || lowered === "pendente") return "pending";
  if (lowered === "trial") return "active";
  return "pending";
};
const resolveStatus = (ativo, settings, rawStatus) => {
  const statusValue = rawStatus || settings?.status;
  return normalizeStatus(statusValue, ativo);
};
const buildAddressFromSettings = (settings) => {
  const address = settings?.address;
  if (!address || typeof address !== "object") return null;
  return address;
};
const resolveAddress = (dbAddress, settings) => {
  if (dbAddress && typeof dbAddress === "object") {
    return dbAddress;
  }
  return buildAddressFromSettings(settings);
};
const buildSettingsFromInput = (input, existing = {}) => {
  const incomingSettings = input.settings && typeof input.settings === "object" ? input.settings : {};
  const next = { ...existing, ...incomingSettings };
  if (input.plan) next.plan = input.plan;
  if (input.slug) next.slug = input.slug;
  if (input.email) next.email = input.email;
  if (input.phone) next.phone = input.phone;
  if (input.billing_email) next.billing_email = input.billing_email;
  if (input.billing_cycle) next.billing_cycle = input.billing_cycle;
  if (input.logo_url) next.logo_url = input.logo_url;
  if (input.primary_color) next.primary_color = input.primary_color;
  if (input.secondary_color) next.secondary_color = input.secondary_color;
  if (input.custom_domain) next.custom_domain = input.custom_domain;
  if (input.admin_email) next.admin_email = input.admin_email;
  if (input.admin_name) next.admin_name = input.admin_name;
  if (input.responsavel_email) next.responsavel_email = input.responsavel_email;
  if (input.max_users !== void 0) next.max_users = input.max_users;
  if (input.max_storage_gb !== void 0) next.max_storage_gb = input.max_storage_gb;
  if (input.max_cases !== void 0) next.max_cases = input.max_cases;
  if (input.address) {
    next.address = input.address;
  } else {
    const address = {
      street: input.address_street,
      number: input.address_number,
      complement: input.address_complement,
      neighborhood: input.address_neighborhood,
      city: input.address_city,
      state: input.address_state,
      zip_code: input.address_postal_code,
      country: input.address_country
    };
    const hasAnyAddress = Object.values(address).some((value) => value);
    if (hasAnyAddress) {
      next.address = { ...next.address, ...address };
    }
  }
  if (input.status) next.status = input.status;
  return next;
};
function mapDbToOrg(dbOrg) {
  const settings = dbOrg.settings || {};
  const name = dbOrg.nome || dbOrg.name || "Sem nome";
  const slug = dbOrg.slug || settings.slug || slugify(name) || "sem-slug";
  const rawStatus = typeof dbOrg.status === "string" && dbOrg.status || typeof settings.status === "string" && settings.status || null;
  const rawPlan = typeof dbOrg.plano === "string" && dbOrg.plano || typeof dbOrg.plan === "string" && dbOrg.plan || typeof settings.plan === "string" && settings.plan || (rawStatus === "trial" ? "trial" : void 0);
  const plan = normalizePlan(rawPlan);
  const status = resolveStatus(dbOrg.ativo ?? dbOrg.active ?? null, settings, rawStatus);
  const address = resolveAddress(dbOrg.address, settings);
  const email = dbOrg.email || settings.email || settings.billing_email || "";
  const phone = dbOrg.phone || settings.phone || null;
  return {
    id: dbOrg.id,
    name,
    slug,
    cnpj: dbOrg.cnpj || null,
    email,
    phone,
    address,
    address_street: address?.street || "",
    address_number: address?.number || "",
    address_complement: address?.complement || "",
    address_neighborhood: address?.neighborhood || "",
    address_city: address?.city || "",
    address_state: address?.state || "",
    address_postal_code: address?.zip_code || "",
    address_country: address?.country || "",
    plan,
    max_users: settings.max_users || 5,
    max_storage_gb: settings.max_storage_gb || 10,
    max_cases: settings.max_cases ?? null,
    status,
    billing_email: settings.billing_email || null,
    billing_cycle: settings.billing_cycle || "monthly",
    next_billing_date: settings.next_billing_date || null,
    logo_url: settings.logo_url || null,
    primary_color: settings.primary_color || "#059669",
    secondary_color: settings.secondary_color || null,
    custom_domain: settings.custom_domain || null,
    settings,
    metadata: settings.metadata || {},
    created_at: dbOrg.created_at,
    updated_at: dbOrg.updated_at || dbOrg.created_at,
    activated_at: settings.activated_at || null,
    suspended_at: settings.suspended_at || null,
    cancelled_at: settings.cancelled_at || null,
    provisioned_by: settings.provisioned_by || null,
    managed_by: settings.managed_by || null
  };
}
const organizationsService = {
  /**
   * Get all organizations (Fartech admin only)
   */
  async getAll() {
    try {
      const { data, error } = await supabase.from("orgs").select("*").order("created_at", { ascending: false });
      if (error) throw new AppError(error.message, "database_error");
      return (data || []).map(mapDbToOrg);
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : "Erro ao buscar organiza\xE7\xF5es",
        "database_error"
      );
    }
  },
  /**
   * Get organization by ID
   */
  async getById(id) {
    try {
      const { data, error } = await supabase.from("orgs").select("*").eq("id", id).single();
      if (error) {
        if (error.code === "PGRST116") return null;
        throw new AppError(error.message, "database_error");
      }
      return data ? mapDbToOrg(data) : null;
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : "Erro ao buscar organiza\xE7\xE3o",
        "database_error"
      );
    }
  },
  /**
   * Get organization by slug
   */
  async getBySlug(slug) {
    try {
      const { data: byColumn, error: columnError } = await supabase.from("orgs").select("*").eq("slug", slug).maybeSingle();
      if (columnError) throw new AppError(columnError.message, "database_error");
      if (byColumn) return mapDbToOrg(byColumn);
      const { data, error } = await supabase.from("orgs").select("*").filter("settings->>slug", "eq", slug).maybeSingle();
      if (error) throw new AppError(error.message, "database_error");
      return data ? mapDbToOrg(data) : null;
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : "Erro ao buscar organiza\xE7\xE3o",
        "database_error"
      );
    }
  },
  /**
   * Create new organization (Fartech admin only)
   */
  async create(input) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new AppError("Usu\xE1rio n\xE3o autenticado", "auth_error");
      const settings = buildSettingsFromInput(input, {
        status: "active",
        provisioned_by: user.id
      });
      const orgName = input.name;
      const orgSlug = input.slug || settings.slug || slugify(orgName);
      const orgPlan = input.plan || settings.plan || "trial";
      const orgStatus = settings.status || "active";
      const orgAddress = input.address || settings.address || null;
      const { data, error } = await supabase.from("orgs").insert({
        nome: orgName,
        name: orgName,
        cnpj: input.cnpj || null,
        slug: orgSlug,
        email: input.email,
        phone: input.phone || null,
        address: orgAddress,
        plano: orgPlan,
        plan: orgPlan,
        ativo: true,
        status: orgStatus,
        max_users: input.max_users ?? settings.max_users,
        max_storage_gb: input.max_storage_gb ?? settings.max_storage_gb,
        max_cases: input.max_cases ?? settings.max_cases ?? null,
        billing_email: input.billing_email ?? settings.billing_email ?? null,
        billing_cycle: input.billing_cycle ?? settings.billing_cycle ?? "monthly",
        settings
      }).select().single();
      if (error) throw new AppError(error.message, "database_error");
      return mapDbToOrg(data);
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : "Erro ao criar organiza\xE7\xE3o",
        "database_error"
      );
    }
  },
  /**
   * Update organization
   */
  async update(id, input) {
    try {
      const existing = await this.getById(id);
      const settings = buildSettingsFromInput(input, existing?.settings || {});
      const nextName = input.name ?? existing?.name;
      const nextSlug = input.slug ?? existing?.slug;
      const nextEmail = input.email ?? existing?.email;
      const nextPhone = input.phone ?? existing?.phone;
      const nextAddress = input.address || settings.address || existing?.address || null;
      const nextPlan = input.plan ?? existing?.plan;
      const nextStatus = settings.status || existing?.status || "active";
      const { data, error } = await supabase.from("orgs").update({
        nome: nextName,
        name: nextName,
        slug: nextSlug,
        email: nextEmail,
        phone: nextPhone,
        address: nextAddress,
        cnpj: input.cnpj ?? existing?.cnpj,
        plano: nextPlan,
        plan: nextPlan,
        status: nextStatus,
        settings
      }).eq("id", id).select().single();
      if (error) throw new AppError(error.message, "database_error");
      return mapDbToOrg(data);
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : "Erro ao atualizar organiza\xE7\xE3o",
        "database_error"
      );
    }
  },
  /**
   * Update organization plan
   */
  async updatePlan(id, input) {
    try {
      const existing = await this.getById(id);
      const settings = buildSettingsFromInput(input, existing?.settings || {});
      const { data, error } = await supabase.from("orgs").update({
        plano: input.plan,
        plan: input.plan,
        settings: {
          ...settings,
          max_users: input.max_users ?? settings.max_users,
          max_storage_gb: input.max_storage_gb ?? settings.max_storage_gb,
          max_cases: input.max_cases ?? settings.max_cases,
          plan: input.plan,
          status: settings.status || (existing?.status ?? "active")
        }
      }).eq("id", id).select().single();
      if (error) throw new AppError(error.message, "database_error");
      return mapDbToOrg(data);
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : "Erro ao atualizar plano",
        "database_error"
      );
    }
  },
  /**
   * Update organization status
   */
  async updateStatus(id, input) {
    try {
      const existing = await this.getById(id);
      const nextSettings = {
        ...existing?.settings || {},
        status: input.status
      };
      if (input.status === "active") {
        nextSettings.activated_at = (/* @__PURE__ */ new Date()).toISOString();
      } else if (input.status === "suspended") {
        nextSettings.suspended_at = (/* @__PURE__ */ new Date()).toISOString();
      } else if (input.status === "cancelled") {
        nextSettings.cancelled_at = (/* @__PURE__ */ new Date()).toISOString();
      }
      const { data, error } = await supabase.from("orgs").update({
        ativo: input.status === "active",
        status: input.status,
        settings: nextSettings
      }).eq("id", id).select().single();
      if (error) throw new AppError(error.message, "database_error");
      return mapDbToOrg(data);
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : "Erro ao atualizar status",
        "database_error"
      );
    }
  },
  /**
   * Delete organization (soft delete by setting status to cancelled)
   */
  async delete(id) {
    try {
      const existing = await this.getById(id);
      const { error } = await supabase.from("orgs").update({
        ativo: false,
        status: "cancelled",
        settings: {
          ...existing?.settings || {},
          status: "cancelled",
          cancelled_at: (/* @__PURE__ */ new Date()).toISOString()
        }
      }).eq("id", id);
      if (error) throw new AppError(error.message, "database_error");
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : "Erro ao deletar organiza\xE7\xE3o",
        "database_error"
      );
    }
  },
  /**
   * Get organization statistics
   */
  async getStats(orgId) {
    try {
      const { count: totalUsers, error: usersError } = await supabase.from("org_members").select("*", { count: "exact", head: true }).eq("org_id", orgId);
      const { count: activeUsers, error: activeUsersError } = await supabase.from("org_members").select("*", { count: "exact", head: true }).eq("org_id", orgId).eq("ativo", true);
      const { count: adminUsers, error: adminUsersError } = await supabase.from("org_members").select("*", { count: "exact", head: true }).eq("org_id", orgId).eq("role", "admin");
      const { count: totalClients } = await supabase.from("clientes").select("*", { count: "exact", head: true }).eq("org_id", orgId);
      const { count: totalCases } = await supabase.from("casos").select("*", { count: "exact", head: true }).eq("org_id", orgId);
      const { count: activeCases } = await supabase.from("casos").select("*", { count: "exact", head: true }).eq("org_id", orgId).in("status", ["triagem", "negociacao", "contrato", "andamento"]);
      const org = await this.getById(orgId);
      const storageUsedGb = org?.settings && org.settings.storage_used_gb || 0;
      const maxStorageGb = org?.max_storage_gb || 0;
      const storageUsedPercentage = maxStorageGb > 0 ? Math.min(100, Math.round(storageUsedGb / maxStorageGb * 100)) : 0;
      if (usersError || activeUsersError || adminUsersError) {
        console.warn("Erro ao carregar membros da org:", usersError || activeUsersError || adminUsersError);
      }
      return {
        total_users: totalUsers || 0,
        active_users: activeUsers || 0,
        admin_users: adminUsers || 0,
        total_clients: totalClients || 0,
        total_cases: totalCases || 0,
        active_cases: activeCases || 0,
        storage_used_gb: storageUsedGb,
        storage_used_percentage: storageUsedPercentage
      };
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : "Erro ao buscar estat\xEDsticas",
        "database_error"
      );
    }
  },
  /**
   * Get organization usage metrics
   */
  async getUsage(orgId) {
    try {
      const org = await this.getById(orgId);
      if (!org) throw new AppError("Organiza\xE7\xE3o n\xE3o encontrada", "not_found");
      const stats = await this.getStats(orgId);
      return {
        users: {
          current: stats.total_users,
          limit: org.max_users,
          percentage: stats.total_users / org.max_users * 100
        },
        storage: {
          current_gb: stats.storage_used_gb,
          limit_gb: org.max_storage_gb,
          percentage: stats.storage_used_gb / org.max_storage_gb * 100
        },
        cases: {
          current: stats.total_cases,
          limit: org.max_cases,
          percentage: org.max_cases ? stats.total_cases / org.max_cases * 100 : null
        }
      };
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : "Erro ao calcular uso",
        "database_error"
      );
    }
  },
  /**
   * Check if slug is available
   */
  async isSlugAvailable(slug, excludeId) {
    try {
      let query = supabase.from("orgs").select("id").filter("settings->>slug", "eq", slug);
      if (excludeId) {
        query = query.neq("id", excludeId);
      }
      const { data, error } = await query;
      if (error) throw new AppError(error.message, "database_error");
      return !data || data.length === 0;
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : "Erro ao verificar slug",
        "database_error"
      );
    }
  },
  /**
   * Activate organization (when admin completes setup)
   */
  async activate(orgId, adminUserId) {
    try {
      const existing = await this.getById(orgId);
      const settings = {
        ...existing?.settings || {},
        status: "active",
        activated_at: (/* @__PURE__ */ new Date()).toISOString(),
        managed_by: adminUserId
      };
      const { data, error } = await supabase.from("orgs").update({
        ativo: true,
        settings
      }).eq("id", orgId).select().single();
      if (error) throw new AppError(error.message, "database_error");
      return mapDbToOrg(data);
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : "Erro ao ativar organiza\xE7\xE3o",
        "database_error"
      );
    }
  }
};
export {
  organizationsService
};
