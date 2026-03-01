// onboardingService — Persiste o progresso e a conclusão do wizard de onboarding.
// complete()     → salva na tabela orgs (nível org, usado pelo org_admin)
// completeUser() → salva na tabela usuarios (nível usuário, todos os perfis)

import { supabase } from '@/lib/supabaseClient'

export const onboardingService = {
  /**
   * Salva o passo atual do wizard (permite retomar de onde parou).
   * step: 'empresa' | 'equipe' | 'integracoes' | 'pronto'
   */
  async updateStep(orgId: string, step: string): Promise<void> {
    const { error } = await supabase
      .from('orgs')
      .update({ onboarding_step: step })
      .eq('id', orgId)

    if (error) {
      console.error('[onboardingService] updateStep error:', error)
      // Não bloqueia o fluxo — continua mesmo se falhar
    }
  },

  /**
   * Marca o onboarding como concluído para a versão informada (nível org).
   * Usado pelo org_admin ao finalizar o wizard completo.
   */
  async complete(orgId: string, version: string): Promise<void> {
    const { error } = await supabase
      .from('orgs')
      .update({ onboarding_version: version, onboarding_step: 'pronto' })
      .eq('id', orgId)

    if (error) {
      console.error('[onboardingService] complete error:', error)
      throw new Error('Não foi possível salvar o onboarding. Tente novamente.')
    }
  },

  /**
   * Marca que o usuário já viu o onboarding (nível usuário — todos os perfis).
   * Não bloqueia o fluxo se falhar.
   */
  async completeUser(userId: string, version: string): Promise<void> {
    const { error } = await supabase
      .from('usuarios')
      .update({ onboarding_version: version })
      .eq('id', userId)

    if (error) {
      console.error('[onboardingService] completeUser error:', error)
      // Não lança — a tela de boas-vindas já foi exibida; não bloquear o acesso
    }
  },
}
