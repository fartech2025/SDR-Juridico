import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { telemetryService } from "@/services/telemetryService";
function usePageTracking() {
  const location = useLocation();
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    const track = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!active || !user) return;
        const { data: member } = await supabase.from("org_members").select("org_id").eq("user_id", user.id).eq("ativo", true).limit(1).maybeSingle();
        if (!member?.org_id) return;
        const tracked = await telemetryService.logAnalyticsEvent({
          org_id: member.org_id,
          user_id: user.id,
          event_name: "page_view",
          event_type: "navigation",
          properties: {
            path: location.pathname,
            search: location.search
          }
        });
        if (!tracked) {
          await telemetryService.logAuditEvent({
            org_id: member.org_id,
            actor_user_id: user.id,
            action: "page_view",
            entity: "navigation",
            entity_id: null,
            details: {
              path: location.pathname,
              search: location.search
            }
          });
        }
      } catch {
      }
    };
    track();
    return () => {
      active = false;
    };
  }, [location.pathname, location.search]);
}
export {
  usePageTracking
};
