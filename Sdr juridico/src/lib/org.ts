import { supabase } from '@/lib/supabaseClient'
import { AppError } from '@/utils/errors'

export async function getActiveOrgId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .eq('ativo', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new AppError(error.message, 'database_error')
  }

  return data?.org_id ?? null
}

export async function requireOrgId(): Promise<string> {
  const orgId = await getActiveOrgId()
  if (!orgId) {
    throw new AppError('Organização não encontrada para o usuário atual', 'auth_error')
  }
  return orgId
}
