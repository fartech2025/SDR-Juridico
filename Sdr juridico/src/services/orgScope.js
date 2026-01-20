import { permissionsService } from "@/services/permissionsService";
async function resolveOrgScope() {
  const user = await permissionsService.getCurrentUser();
  return {
    orgId: user?.org_id ?? null,
    isFartechAdmin: user?.is_fartech_admin ?? false
  };
}
export {
  resolveOrgScope
};
