import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { telemetryService } from "@/services/telemetryService";
const resolveActorUserId = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id || null;
};
export async function logAuditChange(input) {
  if (!isSupabaseConfigured || !input.orgId)
    return false;
  try {
    const actorUserId = await resolveActorUserId();
    return await telemetryService.logAuditEvent({
      org_id: input.orgId,
      actor_user_id: actorUserId,
      action: input.action,
      entity: input.entity,
      entity_id: input.entityId,
      details: input.details ?? {}
    });
  } catch {
    return false;
  }
}
