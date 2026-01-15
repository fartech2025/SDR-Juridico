import { supabase } from '@/lib/supabaseClient'
import { AppError } from '@/utils/errors'

export async function getActiveOrgId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Schema atual não possui tabela de memberships; sem org ativa definida.
  return null
}

export async function requireOrgId(): Promise<string> {
  const orgId = await getActiveOrgId()
  if (!orgId) {
    throw new AppError('Organização não encontrada para o usuário atual', 'auth_error')
  }
  return orgId
}
