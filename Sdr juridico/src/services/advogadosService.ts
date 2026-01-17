import { supabase } from '@/lib/supabaseClient'
import { AppError } from '@/utils/errors'

export type Advogado = {
  id: string
  nome: string
  email: string | null
}

export const advogadosService = {
  async getAdvogadosByOrg(orgId: string): Promise<Advogado[]> {
    try {
      const { data: members, error } = await supabase
        .from('org_members')
        .select('user_id')
        .eq('org_id', orgId)
        .eq('role', 'advogado')
        .eq('ativo', true)

      if (error) throw new AppError(error.message, 'database_error')
      const userIds = (members || []).map((member) => member.user_id).filter(Boolean)
      if (userIds.length === 0) return []

      const { data: usuarios, error: usuariosError } = await supabase
        .from('usuarios')
        .select('id, nome_completo, email')
        .in('id', userIds)

      if (usuariosError) throw new AppError(usuariosError.message, 'database_error')

      return (usuarios || []).map((usuario) => ({
        id: usuario.id,
        nome: usuario.nome_completo,
        email: usuario.email ?? null,
      }))
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar advogados', 'database_error')
    }
  },
}
