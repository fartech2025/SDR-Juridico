import { supabase } from "@/lib/supabaseClient";
import { AppError } from "@/utils/errors";
import { resolveOrgScope } from "@/services/orgScope";
import { logAuditChange } from "@/services/auditLogService";
const mapNotaToTimeline = (row) => {
  const title = row.texto ? row.texto.split("\n")[0].trim() : "";
  return {
    id: row.id,
    caso_id: row.entidade_id,
    titulo: title || "Nota",
    descricao: row.texto || null,
    categoria: "juridico",
    canal: "Sistema",
    autor: row.created_by || null,
    tags: row.tags || [],
    data_evento: row.created_at,
    created_at: row.created_at,
    org_id: row.org_id || null
  };
};
const notasService = {
  async getNotas() {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope();
      if (!isFartechAdmin && !orgId) return [];
      const query = supabase.from("notas").select("*").order("created_at", { ascending: false }).limit(200);
      const { data, error } = isFartechAdmin ? await query : await query.eq("org_id", orgId);
      if (error) throw new AppError(error.message, "database_error");
      return (data || []).map((row) => mapNotaToTimeline(row));
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : "Erro ao buscar notas",
        "database_error"
      );
    }
  },
  async getNotasByEntidade(entidade, entidadeId) {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope();
      if (!isFartechAdmin && !orgId) return [];
      const query = supabase.from("notas").select("*").eq("entidade", entidade).eq("entidade_id", entidadeId).order("created_at", { ascending: false });
      const { data, error } = isFartechAdmin ? await query : await query.eq("org_id", orgId);
      if (error) throw new AppError(error.message, "database_error");
      return (data || []).map((row) => mapNotaToTimeline(row));
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : "Erro ao buscar notas",
        "database_error"
      );
    }
  },
  async createNota(payload) {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope();
      if (!isFartechAdmin && !orgId) {
        throw new AppError("Organizacao nao encontrada para o usuario atual", "auth_error");
      }
      const insertPayload = {
        entidade: payload.entidade,
        entidade_id: payload.entidade_id,
        texto: payload.texto,
        created_by: payload.created_by || null,
        tags: payload.tags || []
      };
      if (!isFartechAdmin) {
        insertPayload.org_id = orgId;
      }
      const { data, error } = await supabase.from("notas").insert([insertPayload]).select("*").single();
      if (error)
        throw new AppError(error.message, "database_error");
      if (!data)
        throw new AppError("Erro ao criar nota", "database_error");
      const auditOrgId = orgId || data.org_id || null;
      void logAuditChange({
        orgId: auditOrgId,
        action: "create",
        entity: "notas",
        entityId: data.id,
        details: { fields: Object.keys(insertPayload) }
      });
      return mapNotaToTimeline(data);
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : "Erro ao criar nota",
        "database_error"
      );
    }
  }
};
export {
  notasService
};
