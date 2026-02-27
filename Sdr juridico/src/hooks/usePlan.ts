import { useOrganizationContext } from '@/contexts/OrganizationContext'

type Plan = 'trial' | 'basic' | 'professional' | 'enterprise'

const PLAN_RANK: Record<Plan, number> = {
  trial: 0,
  basic: 1,
  professional: 2,
  enterprise: 3,
}

export function usePlan() {
  const { currentOrg } = useOrganizationContext()
  const plan = ((currentOrg?.plan as Plan | null | undefined) ?? 'trial') as Plan

  const hasFeature = (minPlan: Plan) => PLAN_RANK[plan] >= PLAN_RANK[minPlan]

  return {
    plan,
    isTrial:        plan === 'trial',
    isBasic:        plan === 'basic',
    isProfissional: plan === 'professional',
    isEnterprise:   plan === 'enterprise',
    canUseFinanceiro:  hasFeature('professional'),
    canUseAnalytics:   hasFeature('professional'),
    canUseDOU:         hasFeature('professional'),
    canUsePJe:         hasFeature('professional'),
    canUseIA:          hasFeature('enterprise'),
    canUseAuditoria:   hasFeature('professional'),
    // v2.8.0 — novos módulos
    canUseTimesheet:   hasFeature('professional'),
    canUseTemplates:   hasFeature('professional'),
    canUseBranding:    hasFeature('basic'),
    maxUsers:          currentOrg?.max_users ?? 1,
    hasFeature,
  }
}
