import * as React from 'react'
import { CheckCircle2, Lock, CreditCard, MessageCircle } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { usePlan } from '@/hooks/usePlan'
import { useOrganizationContext } from '@/contexts/OrganizationContext'

const PLAN_LABELS: Record<string, string> = {
  trial:        'Trial',
  basic:        'Básico',
  professional: 'Profissional',
  enterprise:   'Enterprise',
}

const PLAN_DESCRIPTIONS: Record<string, string> = {
  trial:        'Acesso gratuito com módulos essenciais para experimentar o sistema.',
  basic:        'Módulos essenciais + branding de documentos para escritórios em crescimento.',
  professional: 'Todos os módulos operacionais: financeiro, analytics, timesheet, DOU e templates.',
  enterprise:   'Plano completo com Waze Jurídico (IA) e suporte prioritário.',
}

const TIER_CONFIG: Record<string, { color: string; bg: string }> = {
  'Trial':        { color: '#6b7280', bg: '#f3f4f6' },
  'Básico':       { color: '#2563eb', bg: '#eff6ff' },
  'Profissional': { color: '#7c3aed', bg: '#f5f3ff' },
  'Enterprise':   { color: '#721011', bg: 'rgba(114,16,17,0.08)' },
}

export default function PlanPage() {
  const {
    plan,
    canUseBranding,
    canUseTimesheet,
    canUseTemplates,
    canUseDOU,
    canUseFinanceiro,
    canUseAnalytics,
    canUseAuditoria,
    canUseIA,
  } = usePlan()
  const { currentOrg } = useOrganizationContext()

  const planLabel = PLAN_LABELS[plan] ?? plan

  const features: { name: string; minPlan: string; available: boolean }[] = [
    { name: 'Dashboard, Agenda e Tarefas', minPlan: 'Trial',         available: true },
    { name: 'Leads, Clientes e Casos',     minPlan: 'Trial',         available: true },
    { name: 'Documentos',                  minPlan: 'Trial',         available: true },
    { name: 'DataJud',                     minPlan: 'Trial',         available: true },
    { name: 'Branding (PDF)',              minPlan: 'Básico',        available: canUseBranding },
    { name: 'Timesheet',                   minPlan: 'Profissional',  available: canUseTimesheet },
    { name: 'Templates de Documentos',     minPlan: 'Profissional',  available: canUseTemplates },
    { name: 'Diário Oficial',              minPlan: 'Profissional',  available: canUseDOU },
    { name: 'Financeiro',                  minPlan: 'Profissional',  available: canUseFinanceiro },
    { name: 'Analytics Executivo',         minPlan: 'Profissional',  available: canUseAnalytics },
    { name: 'Auditoria',                   minPlan: 'Profissional',  available: canUseAuditoria },
    { name: 'Waze Jurídico (IA)',          minPlan: 'Enterprise',    available: canUseIA },
  ]

  const availableCount = features.filter((f) => f.available).length
  const lockedCount = features.length - availableCount

  return (
    <div className="space-y-6">

      {/* Header — mesmo padrão do UserProfilePage */}
      <div className="rounded-3xl border border-border bg-linear-to-br from-white via-white to-[#f3f6ff] p-6 shadow-soft">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <CreditCard className="h-6 w-6 text-brand-primary" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-text-subtle">
                Conta
              </p>
              <h1 className="text-2xl font-semibold text-text">Meu Plano</h1>
              <p className="text-sm text-text-muted">
                Visão geral do seu plano e módulos disponíveis
              </p>
            </div>
          </div>

          {/* Plano atual + contagem */}
          <div className="flex items-center gap-4 self-start">
            <div className="text-right">
              <p className="text-xs text-text-muted">Módulos ativos</p>
              <p className="text-3xl font-bold text-text leading-none mt-0.5">
                {availableCount}
                <span className="text-sm font-normal text-text-muted">
                  /{features.length}
                </span>
              </p>
            </div>
            <span
              className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider"
              style={{ backgroundColor: 'rgba(114,16,17,0.09)', color: '#721011' }}
            >
              {planLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Card do plano */}
      <Card>
        <CardHeader>
          <CardTitle>Plano atual</CardTitle>
          {currentOrg?.name && (
            <CardDescription>{currentOrg.name}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-text-muted leading-relaxed">
            {PLAN_DESCRIPTIONS[plan] ?? ''}
          </p>

          {lockedCount > 0 && (
            <p className="text-xs text-text-muted">
              <span className="font-semibold text-text">{lockedCount}</span>{' '}
              módulo{lockedCount !== 1 ? 's' : ''} não incluído
              {lockedCount !== 1 ? 's' : ''} no seu plano atual.
            </p>
          )}

          <div className="flex items-center justify-between gap-3 flex-wrap border-t border-border pt-4">
            <p className="text-xs text-text-muted">
              Para fazer upgrade, entre em contato com o suporte.
            </p>
            <a
              href="https://wa.me/5531999999999?text=Olá,%20gostaria%20de%20fazer%20upgrade%20do%20meu%20plano%20SDR%20Jurídico."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 shrink-0"
              style={{ backgroundColor: '#721011' }}
            >
              <MessageCircle className="h-4 w-4" />
              Falar com suporte
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Módulos */}
      <Card>
        <CardHeader>
          <CardTitle>Módulos do sistema</CardTitle>
          <CardDescription>
            Todos os recursos disponíveis por plano
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {features.map((f) => {
              const tier = TIER_CONFIG[f.minPlan] ?? TIER_CONFIG['Trial']
              return (
                <div
                  key={f.name}
                  className="flex items-center justify-between px-4 py-3 gap-3"
                  style={{ opacity: f.available ? 1 : 0.5 }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {f.available ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                    ) : (
                      <Lock className="h-4 w-4 shrink-0 text-text-subtle" />
                    )}
                    <span className="text-sm font-medium text-text truncate">
                      {f.name}
                    </span>
                  </div>
                  <span
                    className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ color: tier.color, backgroundColor: tier.bg }}
                  >
                    {f.minPlan}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
