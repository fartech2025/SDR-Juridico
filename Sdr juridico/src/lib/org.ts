import { supabase } from '@/lib/supabaseClient'
import { AppError } from '@/utils/errors'

export async function getActiveOrgId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Buscar org_id do profile do usuário
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id, is_fartech_admin')
    .eq('user_id', user.id)
    .single()

  // Fartech admins não têm org_id (retorna null para ver tudo)
  if (profile?.is_fartech_admin) {
    return null
  }

  // Retorna org_id do usuário
  return profile?.org_id || null
}

export async function requireOrgId(): Promise<string> {
  const orgId = await getActiveOrgId()
  if (!orgId) {
    throw new AppError('Organização não encontrada para o usuário atual', 'auth_error')
  }
  return orgId
}
