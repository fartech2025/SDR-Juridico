import { useOrganizationContext } from '@/contexts/OrganizationContext'

export type TaskUiRole = 'ADVOGADO' | 'GESTOR' | 'ADMIN'

export function useTaskUiRole(): TaskUiRole {
  const { currentRole, isFartechAdmin } = useOrganizationContext()

  if (isFartechAdmin) return 'ADMIN'

  const role = (currentRole || '').toLowerCase()
  if (role.includes('admin')) return 'ADMIN'
  if (role.includes('gestor') || role.includes('manager') || role.includes('org_admin')) return 'GESTOR'

  return 'ADVOGADO'
}
