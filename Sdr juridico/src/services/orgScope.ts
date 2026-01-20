import { permissionsService } from '@/services/permissionsService'

export type OrgScope = {
  orgId: string | null
  isFartechAdmin: boolean
}

export async function resolveOrgScope(): Promise<OrgScope> {
  const user = await permissionsService.getCurrentUser()
  return {
    orgId: user?.org_id ?? null,
    isFartechAdmin: user?.is_fartech_admin ?? false,
  }
}
