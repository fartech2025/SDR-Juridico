import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
let auditTable = "audit_log";
let analyticsEnabled = true;
const isMissingTable = (error) => {
  const message = error?.message || "";
  return error?.code === "42P01" || message.includes("schema cache") || message.includes("does not exist") || message.includes("relation") || message.includes("table");
};
const insertAuditEvent = async (table, payload) => {
  return supabase.from(table).insert({
    ...payload,
    details: payload.details ?? {}
  });
};
const telemetryService = {
  async logAuditEvent(payload) {
    if (!isSupabaseConfigured || !auditTable) return false;
    const { error } = await insertAuditEvent(auditTable, payload);
    if (!error) return true;
    if (!isMissingTable(error)) {
      console.warn("[telemetry] audit insert failed:", error);
      return false;
    }
    if (auditTable === "audit_log") {
      auditTable = "audit_logs";
      const fallback = await insertAuditEvent("audit_logs", payload);
      if (!fallback.error) return true;
      if (isMissingTable(fallback.error)) {
        auditTable = null;
      } else {
        console.warn("[telemetry] audit insert failed:", fallback.error);
      }
      return false;
    }
    auditTable = null;
    return false;
  },
  async logAnalyticsEvent(payload) {
    if (!isSupabaseConfigured || !analyticsEnabled) return false;
    const { error } = await supabase.from("analytics_events").insert({
      ...payload,
      properties: payload.properties ?? {},
      device_info: payload.device_info ?? {}
    });
    if (!error) return true;
    if (isMissingTable(error)) {
      analyticsEnabled = false;
      return false;
    }
    console.warn("[telemetry] analytics insert failed:", error);
    return false;
  }
};
export {
  telemetryService
};
