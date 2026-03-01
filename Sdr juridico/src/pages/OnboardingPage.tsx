// OnboardingPage — Wizard de configuração inicial para orgs novas
// v2 — animações de slide, botão Voltar, OAuth inline, convites reais

import * as React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Building2, Users, Plug, CheckCircle2,
  ChevronRight, ChevronLeft, Loader2, Plus, X, Check, AlertCircle,
  ArrowRight, Scale, FolderKanban, ClipboardList, Eye,
  Zap, FileText, Bell, CalendarDays, MessageSquare,
} from 'lucide-react'
import { toast } from 'sonner'
import { useOrganizationContext } from '@/contexts/OrganizationContext'
import { organizationsService } from '@/services/organizationsService'
import { onboardingService } from '@/services/onboardingService'
import { useIntegrations } from '@/hooks/useIntegrations'
import { useIsOrgAdmin } from '@/hooks/usePermissions'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { APP_VERSION } from '@/lib/version'
import { Logo } from '@/components/ui/Logo'
import { supabase } from '@/lib/supabaseClient'

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

type Step = 'empresa' | 'equipe' | 'integracoes' | 'pronto'
const STEP_ORDER: Step[] = ['empresa', 'equipe', 'integracoes', 'pronto']

const STEPS: { id: Step; label: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }[] = [
  { id: 'empresa',     label: 'Empresa',     icon: Building2 },
  { id: 'equipe',      label: 'Equipe',      icon: Users },
  { id: 'integracoes', label: 'Integrações', icon: Plug },
  { id: 'pronto',      label: 'Pronto!',     icon: CheckCircle2 },
]

const AREAS_ATUACAO = [
  { id: 'civel',          label: 'Cível' },
  { id: 'trabalhista',    label: 'Trabalhista' },
  { id: 'criminal',       label: 'Criminal' },
  { id: 'tributario',     label: 'Tributário' },
  { id: 'familia',        label: 'Família' },
  { id: 'previdenciario', label: 'Previdenciário' },
  { id: 'empresarial',    label: 'Empresarial' },
  { id: 'ambiental',      label: 'Ambiental' },
]

type ConviteStatus = 'pending' | 'sending' | 'sent' | 'error'
type ConviteItem = {
  email: string
  nome:  string
  role:  'gestor' | 'advogado' | 'secretaria' | 'leitura'
  status: ConviteStatus
  errorMsg?: string
}

const ROLE_LABELS: Record<ConviteItem['role'], string> = {
  gestor:     'Gestor',
  advogado:   'Advogado',
  secretaria: 'Secretaria',
  leitura:    'Somente leitura',
}

const PROXIMOS_PASSOS: { icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; text: string; to: string }[] = [
  { icon: Zap,      text: 'Cadastre seu primeiro lead no CRM',           to: '/app/leads?tour=1' },
  { icon: Scale,    text: 'Importe seus processos via DataJud (CNJ)',     to: '/app/datajud?tour=1' },
  { icon: FileText, text: 'Crie um template de documento personalizado',  to: '/app/documentos/templates?tour=1' },
  { icon: Bell,     text: 'Configure alertas do Diário Oficial',          to: '/app/diario-oficial?tour=1' },
]

// ---------------------------------------------------------------------------
// StepBoasVindas — tela de boas-vindas para perfis não-admin
// ---------------------------------------------------------------------------

type RoleWelcome = { icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; desc: string; items: string[] }
const ROLE_WELCOME: Record<string, RoleWelcome> = {
  gestor: {
    icon: FolderKanban,
    desc: 'Você tem acesso operacional completo ao escritório.',
    items: [
      'Gerencie leads e acompanhe o funil de conversão',
      'Visualize e distribua casos entre a equipe',
      'Aprove tarefas e registros de horas (Timesheet)',
      'Acesse relatórios e a agenda do escritório',
    ],
  },
  advogado: {
    icon: Scale,
    desc: 'Seu espaço para gerenciar seus casos e clientes.',
    items: [
      'Veja os casos atribuídos diretamente a você',
      'Registre movimentações, documentos e prazos',
      'Consulte processos em tempo real via DataJud',
      'Acompanhe tarefas e sua agenda pessoal',
    ],
  },
  secretaria: {
    icon: ClipboardList,
    desc: 'Painel administrativo para sua rotina diária.',
    items: [
      'Gerencie a agenda e os agendamentos do escritório',
      'Cadastre e acompanhe leads e clientes',
      'Organize documentos e controle tarefas',
      'Monitore prazos e distribuição de demandas',
    ],
  },
  leitura: {
    icon: Eye,
    desc: 'Você tem acesso de visualização a todos os módulos.',
    items: [
      'Visualize casos, leads e clientes em tempo real',
      'Acompanhe a agenda e os documentos do escritório',
      'Consulte processos e publicações do Diário Oficial',
      'Monitore o andamento geral sem alterar dados',
    ],
  },
}

function StepBoasVindas({
  displayName,
  memberRole,
  saving,
  onComecar,
}: {
  displayName: string
  memberRole: string | null
  saving: boolean
  onComecar: () => void
}) {
  const role = memberRole ?? 'leitura'
  const content = ROLE_WELCOME[role] ?? ROLE_WELCOME['leitura']
  const firstName = displayName.split(' ')[0]

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'DM Sans', system-ui, sans-serif",
      padding: '24px 16px',
    }}>
      <div style={{
        width: '100%', maxWidth: 480,
        backgroundColor: '#fff',
        borderRadius: 20,
        boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
        padding: '40px 36px',
        display: 'flex', flexDirection: 'column', gap: 28,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ height: 32, display: 'flex', alignItems: 'center' }}>
            <Logo />
          </div>
        </div>

        {/* Ícone + saudação */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, marginBottom: 16, margin: '0 auto 16px',
            backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <content.icon style={{ color: '#721011', width: 32, height: 32 }} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>
            Olá, {firstName}!
          </h1>
          <p style={{ fontSize: 15, color: '#6b7280', margin: 0, lineHeight: 1.6 }}>
            {content.desc}
          </p>
        </div>

        {/* O que você pode fazer */}
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
            O que você pode fazer
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {content.items.map(item => (
              <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <CheckCircle2
                  style={{ color: '#721011', flexShrink: 0, marginTop: 2 }}
                  className="h-4 w-4"
                />
                <span style={{ fontSize: 14, color: '#374151', lineHeight: 1.5 }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Botão Começar */}
        <button
          onClick={onComecar}
          disabled={saving}
          style={{
            width: '100%',
            padding: '13px 0',
            fontSize: 15,
            fontWeight: 600,
            color: '#fff',
            backgroundColor: '#721011',
            border: 'none',
            borderRadius: 10,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontFamily: 'inherit',
          }}
        >
          {saving
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <ArrowRight className="h-4 w-4" />
          }
          Entrar no painel
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function OnboardingPage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const isOrgAdmin = useIsOrgAdmin()
  const { user, memberRole, displayName, reloadProfile } = useCurrentUser()
  const { currentOrg, reloadOrg }                   = useOrganizationContext()
  const { integrations, loading: intLoading,
          createDefaultIntegrations }               = useIntegrations()

  // Google Calendar OAuth callback query param
  const gcQueryStatus = new URLSearchParams(location.search).get('google_calendar')

  const savedStep = (currentOrg?.onboarding_step ?? 'empresa') as Step
  const [step,    setStep]    = React.useState<Step>(savedStep)
  const [animDir, setAnimDir] = React.useState<'forward' | 'backward'>('forward')
  const [animKey, setAnimKey] = React.useState(0)
  const [saving,  setSaving]  = React.useState(false)

  // Step 1 — Empresa
  const [nome,            setNome]            = React.useState(currentOrg?.name  ?? '')
  const [cnpj,            setCnpj]            = React.useState(currentOrg?.cnpj  ?? '')
  const [oab,             setOab]             = React.useState('')
  const [telefone,        setTelefone]        = React.useState(currentOrg?.phone ?? '')
  const [emailEscritorio, setEmailEscritorio] = React.useState(currentOrg?.email ?? '')
  const [areas,           setAreas]           = React.useState<string[]>([])

  // Step 2 — Equipe
  const [convites,     setConvites]     = React.useState<ConviteItem[]>([])
  const [conviteEmail, setConviteEmail] = React.useState('')
  const [conviteNome,  setConviteNome]  = React.useState('')
  const [conviteRole,  setConviteRole]  = React.useState<ConviteItem['role']>('advogado')
  const [inviting,     setInviting]     = React.useState(false)

  // Step 3 — Integrações
  const [gcConnected, setGcConnected] = React.useState(false)

  // Ensure default integrations exist on mount
  React.useEffect(() => {
    if (!intLoading && integrations.length === 0 && currentOrg) {
      createDefaultIntegrations().catch(() => {})
    }
  }, [intLoading, integrations.length, currentOrg, createDefaultIntegrations])

  // Detect Google Calendar connection status from hook or from OAuth callback
  React.useEffect(() => {
    const gcInt = integrations.find(i => i.name?.toLowerCase().includes('calendar'))
    if (gcInt?.status === 'connected') setGcConnected(true)
  }, [integrations])

  React.useEffect(() => {
    if (gcQueryStatus === 'connected') {
      setGcConnected(true)
      toast.success('Google Calendar conectado com sucesso!')
      // Clear query param from URL without re-render
      window.history.replaceState({}, '', '/app/onboarding')
      // Navigate back to integracoes step if returning from OAuth mid-wizard
      if (step !== 'integracoes') {
        setAnimDir('forward')
        setAnimKey(k => k + 1)
        setStep('integracoes')
      }
    }
    if (gcQueryStatus === 'error') {
      toast.error('Falha ao conectar o Google Calendar. Tente novamente.')
      window.history.replaceState({}, '', '/app/onboarding')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gcQueryStatus])

  // ── Navigation helpers ───────────────────────────────────────────────────

  const goToStep = React.useCallback(async (next: Step, dir: 'forward' | 'backward' = 'forward') => {
    if (currentOrg) await onboardingService.updateStep(currentOrg.id, next)
    setAnimDir(dir)
    setAnimKey(k => k + 1)
    setStep(next)
  }, [currentOrg])

  const goBack = React.useCallback(() => {
    const idx = STEP_ORDER.indexOf(step)
    if (idx > 0) goToStep(STEP_ORDER[idx - 1], 'backward')
  }, [step, goToStep])

  // ── CNPJ mask ────────────────────────────────────────────────────────────

  const handleCnpj = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 14)
    let m = d
    if (d.length >  2) m = `${d.slice(0,2)}.${d.slice(2)}`
    if (d.length >  5) m = `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`
    if (d.length >  8) m = `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8)}`
    if (d.length > 12) m = `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`
    setCnpj(m)
  }

  const toggleArea = (id: string) =>
    setAreas(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id])

  // ── Step 1 — salvar empresa ──────────────────────────────────────────────

  const handleSaveEmpresa = async () => {
    if (!nome.trim()) { toast.error('Nome do escritório é obrigatório'); return }
    if (!currentOrg) return
    setSaving(true)
    try {
      await organizationsService.update(currentOrg.id, {
        name:  nome.trim(),
        cnpj:  cnpj   || undefined,
        phone: telefone || undefined,
        email: emailEscritorio || undefined,
        settings: {
          ...currentOrg.settings,
          oab_registro:  oab,
          areas_atuacao: areas,
        } as typeof currentOrg.settings,
      })
      await goToStep('equipe')
    } catch {
      toast.error('Erro ao salvar dados da empresa. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  // ── Step 2 — convites ────────────────────────────────────────────────────

  const handleAddConvite = () => {
    const email = conviteEmail.trim().toLowerCase()
    const nome  = conviteNome.trim()
    if (!email.includes('@'))               { toast.error('E-mail inválido');          return }
    if (!nome)                              { toast.error('Nome é obrigatório');        return }
    if (convites.find(c => c.email===email)){ toast.error('E-mail já adicionado');      return }
    setConvites(prev => [...prev, { email, nome, role: conviteRole, status: 'pending' }])
    setConviteEmail('')
    setConviteNome('')
  }

  const handleRemoveConvite = (email: string) => {
    if (!inviting) setConvites(prev => prev.filter(c => c.email !== email))
  }

  const handleConvidarEquipe = async () => {
    if (!currentOrg || convites.length === 0) { await goToStep('integracoes'); return }

    setInviting(true)
    setConvites(prev => prev.map(c => ({ ...c, status: 'sending' as ConviteStatus })))

    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token

    const results = await Promise.allSettled(
      convites.map(c =>
        supabase.functions.invoke('invite-org-member', {
          body: { orgId: currentOrg.id, email: c.email, nome: c.nome, role: c.role },
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
        })
      )
    )

    const updated = convites.map((c, i) => {
      const r = results[i]
      if (r.status === 'rejected') return { ...c, status: 'error' as ConviteStatus, errorMsg: 'Erro de rede' }
      const { data, error } = r.value
      if (error || data?.error) return { ...c, status: 'error' as ConviteStatus, errorMsg: String(data?.error || error?.message || 'Erro') }
      return { ...c, status: 'sent' as ConviteStatus }
    })

    setConvites(updated)
    setInviting(false)

    const errors = updated.filter(c => c.status === 'error')
    if (errors.length === 0) {
      toast.success(`${updated.length} convite${updated.length > 1 ? 's' : ''} enviado${updated.length > 1 ? 's' : ''}!`)
      setTimeout(() => goToStep('integracoes'), 1200)
    }
  }

  // ── Step 3 — Google Calendar OAuth ──────────────────────────────────────

  const handleGoogleCalendarConnect = async () => {
    if (!currentOrg) return
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    if (!supabaseUrl) { toast.error('Configuração incompleta.'); return }

    const gcInt = integrations.find(i => i.name?.toLowerCase().includes('calendar'))
    const returnTo = `${window.location.origin}/app/onboarding`

    const oauthUrl = new URL(`${supabaseUrl.replace(/\/$/, '')}/functions/v1/google-calendar-oauth`)
    if (gcInt) oauthUrl.searchParams.set('integration_id', gcInt.id)
    oauthUrl.searchParams.set('org_id',    currentOrg.id)
    oauthUrl.searchParams.set('return_to', returnTo)

    window.location.href = oauthUrl.toString()
  }

  // ── Step 4 — concluir ───────────────────────────────────────────────────

  const handleConcluir = async () => {
    if (!currentOrg) return
    setSaving(true)
    // 1. Salva no usuário (crítico — é o que o guard verifica)
    if (user) await onboardingService.completeUser(user.id, APP_VERSION)
    // 2. Força re-fetch do perfil para que OrgActiveGuard não redirecione de volta
    reloadProfile()
    // 3. Salva no org em best-effort
    try {
      await onboardingService.complete(currentOrg.id, APP_VERSION)
      await reloadOrg()
    } catch {
      // Falha no nível org não impede a navegação
    }
    setSaving(false)
    navigate('/app/dashboard', { replace: true })
  }

  const handleConcluirEIr = async (to: string) => {
    if (!currentOrg) return
    setSaving(true)
    // 1. Salva no usuário (crítico — é o que o guard verifica)
    if (user) await onboardingService.completeUser(user.id, APP_VERSION)
    // 2. Força re-fetch do perfil para que OrgActiveGuard não redirecione de volta
    reloadProfile()
    // 3. Salva no org em best-effort
    try {
      await onboardingService.complete(currentOrg.id, APP_VERSION)
      await reloadOrg()
    } catch {
      // Falha no nível org não impede a navegação
    }
    setSaving(false)
    navigate(to, { replace: true })
  }

  // ── Welcome screen para perfis não-admin ────────────────────────────────
  // org_admin: wizard completo (4 steps); outros: tela de boas-vindas por role
  if (!isOrgAdmin) {
    return (
      <StepBoasVindas
        displayName={displayName}
        memberRole={memberRole}
        saving={saving}
        onComecar={async () => {
          if (!user) return
          setSaving(true)
          await onboardingService.completeUser(user.id, APP_VERSION)
          reloadProfile()
          navigate('/app/dashboard', { replace: true })
          setSaving(false)
        }}
      />
    )
  }

  // ── Render wizard completo (org_admin) ───────────────────────────────────

  const stepIndex = STEP_ORDER.indexOf(step)
  const orgName   = nome || currentOrg?.name || 'Seu escritório'

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>

      {/* ── Header ── */}
      <header style={{
        width: '100%', backgroundColor: '#fff',
        borderBottom: '1px solid #e5e7eb',
        padding: '14px 24px',
        display: 'flex', justifyContent: 'center',
      }}>
        <Logo size="md" />
      </header>

      {/* ── Stepper ── */}
      <div style={{ width: '100%', maxWidth: 600, padding: '28px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {STEPS.map((s, i) => {
            const done   = i < stepIndex
            const active = i === stepIndex
            const Icon   = s.icon
            return (
              <React.Fragment key={s.id}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: done || active ? '#721011' : '#e5e7eb',
                    color: done || active ? '#fff' : '#9ca3af',
                    boxShadow: active ? '0 0 0 4px rgba(114,16,17,0.15)' : 'none',
                    transition: 'all 0.25s',
                  }}>
                    {done
                      ? <CheckCircle2 className="h-[18px] w-[18px]" />
                      : <Icon className="h-[18px] w-[18px]" />
                    }
                  </div>
                  <span style={{
                    fontSize: 11, marginTop: 5, whiteSpace: 'nowrap',
                    color: active ? '#721011' : done ? '#374151' : '#9ca3af',
                    fontWeight: active ? 700 : 400,
                  }}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{
                    flex: 2, height: 2, marginBottom: 22,
                    backgroundColor: i < stepIndex ? '#721011' : '#e5e7eb',
                    transition: 'background-color 0.3s',
                  }} />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* ── Card ── */}
      <div style={{
        width: '100%', maxWidth: 600, margin: '20px 20px 48px',
        backgroundColor: '#fff', borderRadius: 16,
        border: '1px solid #e5e7eb',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}>
        <div
          key={animKey}
          style={{ animation: `${animDir === 'forward' ? 'obSlideInRight' : 'obSlideInLeft'} 0.22s cubic-bezier(0.25,0.46,0.45,0.94)` }}
        >
          {step === 'empresa' && (
            <StepEmpresa
              nome={nome}             setNome={setNome}
              cnpj={cnpj}             handleCnpj={handleCnpj}
              oab={oab}               setOab={setOab}
              telefone={telefone}     setTelefone={setTelefone}
              email={emailEscritorio} setEmail={setEmailEscritorio}
              areas={areas}           toggleArea={toggleArea}
              saving={saving}
              onContinue={handleSaveEmpresa}
            />
          )}

          {step === 'equipe' && (
            <StepEquipe
              convites={convites}
              conviteEmail={conviteEmail} setConviteEmail={setConviteEmail}
              conviteNome={conviteNome}   setConviteNome={setConviteNome}
              conviteRole={conviteRole}   setConviteRole={setConviteRole}
              onAddConvite={handleAddConvite}
              onRemoveConvite={handleRemoveConvite}
              inviting={inviting}
              onConvidar={handleConvidarEquipe}
              onSkip={() => goToStep('integracoes')}
              onBack={goBack}
            />
          )}

          {step === 'integracoes' && (
            <StepIntegracoes
              gcConnected={gcConnected}
              onGoogleConnect={handleGoogleCalendarConnect}
              onContinue={() => goToStep('pronto')}
              onSkip={() => goToStep('pronto')}
              onBack={goBack}
            />
          )}

          {step === 'pronto' && (
            <StepPronto
              orgName={orgName}
              saving={saving}
              onConcluir={handleConcluir}
              onConcluirEIr={handleConcluirEIr}
              onBack={goBack}
            />
          )}
        </div>
      </div>

      <style>{`
        @keyframes obSlideInRight {
          from { opacity: 0; transform: translateX(36px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes obSlideInLeft {
          from { opacity: 0; transform: translateX(-36px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 1 — Empresa
// ---------------------------------------------------------------------------

function StepEmpresa({
  nome, setNome, cnpj, handleCnpj, oab, setOab,
  telefone, setTelefone, email, setEmail,
  areas, toggleArea, saving, onContinue,
}: {
  nome: string;            setNome: (v: string) => void
  cnpj: string;            handleCnpj: (v: string) => void
  oab: string;             setOab: (v: string) => void
  telefone: string;        setTelefone: (v: string) => void
  email: string;           setEmail: (v: string) => void
  areas: string[];         toggleArea: (id: string) => void
  saving: boolean;         onContinue: () => void
}) {
  const firstRef = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => { firstRef.current?.focus() }, [])

  return (
    <div style={{ padding: '28px 36px' }}>
      <StepHeader icon={<Building2 className="h-5 w-5" style={{ color: '#721011' }} />} bg="#fff3f3"
        title="Dados do seu escritório"
        sub="Essas informações aparecem nos documentos gerados pelo sistema."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Nome do escritório *">
          <input ref={firstRef} value={nome} onChange={e => setNome(e.target.value)}
            placeholder="Ex: Silva & Associados Advogados" style={inputStyle}
            onKeyDown={e => e.key === 'Enter' && onContinue()}
          />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="CNPJ">
            <input value={cnpj} onChange={e => handleCnpj(e.target.value)} placeholder="00.000.000/0001-00" style={inputStyle} />
          </Field>
          <Field label="Registro OAB">
            <input value={oab} onChange={e => setOab(e.target.value)} placeholder="SP 123.456" style={inputStyle} />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Telefone">
            <input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(11) 99999-9999" style={inputStyle} />
          </Field>
          <Field label="E-mail do escritório">
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="contato@escritorio.com" type="email" style={inputStyle} />
          </Field>
        </div>

        <Field label="Áreas de atuação">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 4 }}>
            {AREAS_ATUACAO.map(a => {
              const sel = areas.includes(a.id)
              return (
                <button key={a.id} onClick={() => toggleArea(a.id)} style={{
                  padding: '5px 13px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                  backgroundColor: sel ? '#721011' : '#f3f4f6',
                  color: sel ? '#fff' : '#374151',
                  border: sel ? '1px solid #721011' : '1px solid #e5e7eb',
                }}>
                  {a.label}
                </button>
              )
            })}
          </div>
        </Field>
      </div>

      <div style={{ marginTop: 28, display: 'flex', justifyContent: 'flex-end' }}>
        <PrimaryBtn onClick={onContinue} loading={saving}>
          Continuar <ChevronRight className="h-4 w-4 ml-1" />
        </PrimaryBtn>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 2 — Equipe
// ---------------------------------------------------------------------------

function StepEquipe({
  convites, conviteEmail, setConviteEmail, conviteNome, setConviteNome,
  conviteRole, setConviteRole, onAddConvite, onRemoveConvite,
  inviting, onConvidar, onSkip, onBack,
}: {
  convites: ConviteItem[]
  conviteEmail: string; setConviteEmail: (v: string) => void
  conviteNome: string;  setConviteNome: (v: string) => void
  conviteRole: ConviteItem['role']; setConviteRole: (v: ConviteItem['role']) => void
  onAddConvite: () => void
  onRemoveConvite: (email: string) => void
  inviting: boolean
  onConvidar: () => void
  onSkip: () => void
  onBack: () => void
}) {
  const hasErrors = convites.some(c => c.status === 'error')
  const allSent   = convites.length > 0 && convites.every(c => c.status === 'sent')

  return (
    <div style={{ padding: '28px 36px' }}>
      <StepHeader icon={<Users className="h-5 w-5" style={{ color: '#16a34a' }} />} bg="#f0fdf4"
        title="Convide sua equipe"
        sub="Você pode adicionar mais membros depois em Configurações → Usuários."
      />

      {/* Form de adição */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Nome completo *">
            <input value={conviteNome} onChange={e => setConviteNome(e.target.value)}
              placeholder="Ana Silva" style={inputStyle} disabled={inviting}
              onKeyDown={e => e.key === 'Enter' && onAddConvite()}
            />
          </Field>
          <Field label="E-mail *">
            <input value={conviteEmail} onChange={e => setConviteEmail(e.target.value)}
              placeholder="ana@escritorio.com" type="email" style={inputStyle} disabled={inviting}
              onKeyDown={e => e.key === 'Enter' && onAddConvite()}
            />
          </Field>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <Field label="Perfil" style={{ flex: 1 }}>
            <select value={conviteRole} onChange={e => setConviteRole(e.target.value as ConviteItem['role'])}
              style={inputStyle} disabled={inviting}>
              <option value="gestor">Gestor</option>
              <option value="advogado">Advogado</option>
              <option value="secretaria">Secretaria</option>
              <option value="leitura">Somente leitura</option>
            </select>
          </Field>
          <button onClick={onAddConvite} disabled={inviting} style={{ ...primaryBtnStyle, padding: '10px 18px', marginBottom: 1, flexShrink: 0 }}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </button>
        </div>
      </div>

      {/* Lista de convidados */}
      {convites.length > 0 && (
        <div style={{ marginTop: 14, border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
          {convites.map(c => (
            <div key={c.email} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', borderBottom: '1px solid #f3f4f6',
              backgroundColor: c.status === 'error' ? '#fef2f2' : c.status === 'sent' ? '#f0fdf4' : '#fff',
              transition: 'background-color 0.2s',
            }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>{c.nome}</p>
                <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>{c.email} · {ROLE_LABELS[c.role]}</p>
                {c.status === 'error' && c.errorMsg && (
                  <p style={{ fontSize: 11, color: '#dc2626', margin: '2px 0 0' }}>{c.errorMsg}</p>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 8 }}>
                {c.status === 'sending' && <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />}
                {c.status === 'sent'    && <Check className="h-4 w-4" style={{ color: '#16a34a' }} />}
                {c.status === 'error'   && <AlertCircle className="h-4 w-4" style={{ color: '#dc2626' }} />}
                {c.status === 'pending' && !inviting && (
                  <button onClick={() => onRemoveConvite(c.email)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2 }}>
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Banner de erro */}
      {hasErrors && !inviting && (
        <div style={{ marginTop: 10, padding: '10px 14px', backgroundColor: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca' }}>
          <p style={{ fontSize: 13, color: '#dc2626', margin: 0 }}>
            Alguns convites falharam. Você pode tentar novamente ou continuar assim mesmo.
          </p>
        </div>
      )}

      {/* Rodapé */}
      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <GhostBtn onClick={onBack} disabled={inviting}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
          </GhostBtn>
          {(!inviting || hasErrors) && (
            <GhostBtn onClick={onSkip} disabled={inviting}>Pular</GhostBtn>
          )}
        </div>
        <PrimaryBtn
          onClick={onConvidar}
          loading={inviting}
          disabled={inviting || convites.length === 0 || allSent}
        >
          {allSent
            ? <><Check className="h-4 w-4 mr-1" /> Enviado</>
            : convites.length > 0
              ? <>Convidar e continuar <ChevronRight className="h-4 w-4 ml-1" /></>
              : <>Continuar <ChevronRight className="h-4 w-4 ml-1" /></>
          }
        </PrimaryBtn>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 3 — Integrações
// ---------------------------------------------------------------------------

function StepIntegracoes({
  gcConnected, onGoogleConnect, onContinue, onSkip, onBack,
}: {
  gcConnected: boolean
  onGoogleConnect: () => void
  onContinue: () => void
  onSkip: () => void
  onBack: () => void
}) {
  return (
    <div style={{ padding: '28px 36px' }}>
      <StepHeader icon={<Plug className="h-5 w-5" style={{ color: '#ca8a04' }} />} bg="#fefce8"
        title="Conecte suas ferramentas"
        sub="Você pode configurar mais integrações depois em Configurações → Integrações."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Google Calendar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px',
          border: `1px solid ${gcConnected ? '#bbf7d0' : '#e5e7eb'}`,
          borderRadius: 12,
          backgroundColor: gcConnected ? '#f0fdf4' : '#fff',
          transition: 'all 0.25s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 10, flexShrink: 0,
              backgroundColor: '#fff', border: '1px solid #e5e7eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><CalendarDays className="h-5 w-5" style={{ color: '#721011' }} /></div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0 }}>Google Calendar</p>
              <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
                {gcConnected
                  ? 'Conectado — agenda sincronizando automaticamente'
                  : 'Sincronize audiências e compromissos com sua agenda'}
              </p>
            </div>
          </div>
          {gcConnected ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: '#16a34a', flexShrink: 0 }}>
              <CheckCircle2 className="h-4 w-4" /> Conectado
            </span>
          ) : (
            <button onClick={onGoogleConnect} style={secondaryBtnStyle}>Conectar</button>
          )}
        </div>

        {/* Microsoft Teams — sem OAuth próprio ainda */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', border: '1px solid #e5e7eb', borderRadius: 12, backgroundColor: '#fafafa',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 10, flexShrink: 0,
              backgroundColor: '#fff', border: '1px solid #e5e7eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><MessageSquare className="h-5 w-5 text-gray-400" /></div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#6b7280', margin: 0 }}>Microsoft Teams</p>
              <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Disponível em Configurações → Integrações</p>
            </div>
          </div>
          <span style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic', flexShrink: 0 }}>Em breve</span>
        </div>

        {/* Aviso pós-OAuth: se já conectado, mostrar CTA de continuar */}
        {gcConnected && (
          <div style={{ padding: '12px 16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10 }}>
            <p style={{ fontSize: 13, color: '#166534', margin: 0 }}>
              <CheckCircle2 className="h-4 w-4 inline-block mr-1" style={{ color: '#16a34a', verticalAlign: 'text-bottom' }} />
              Google Calendar conectado. Seus compromissos serão sincronizados automaticamente.
            </p>
          </div>
        )}
      </div>

      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <GhostBtn onClick={onBack}><ChevronLeft className="h-4 w-4 mr-1" /> Voltar</GhostBtn>
          {!gcConnected && <GhostBtn onClick={onSkip}>Pular</GhostBtn>}
        </div>
        <PrimaryBtn onClick={onContinue}>
          Continuar <ChevronRight className="h-4 w-4 ml-1" />
        </PrimaryBtn>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 4 — Pronto!
// ---------------------------------------------------------------------------

function StepPronto({
  orgName, saving, onConcluir, onConcluirEIr, onBack,
}: {
  orgName: string
  saving: boolean
  onConcluir: () => void
  onConcluirEIr: (to: string) => void
  onBack: () => void
}) {
  return (
    <div style={{ padding: '32px 36px', textAlign: 'center' }}>
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        backgroundColor: '#fef2f2',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px',
      }}>
        <CheckCircle2 style={{ color: '#721011', width: 36, height: 36 }} />
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 6, margin: '0 0 6px' }}>
        {orgName} está pronto!
      </h2>
      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 28 }}>
        Tudo configurado. Por onde você quer começar?
      </p>

      {/* Próximos passos — clicáveis */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left', maxWidth: 380, margin: '0 auto 28px' }}>
        {PROXIMOS_PASSOS.map(item => (
          <button
            key={item.to}
            onClick={() => onConcluirEIr(item.to)}
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px',
              backgroundColor: '#f9fafb', border: '1px solid #e5e7eb',
              borderRadius: 10, cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', textAlign: 'left',
              opacity: saving ? 0.6 : 1, transition: 'all 0.15s',
            }}
            onMouseEnter={e => !saving && (e.currentTarget.style.backgroundColor = '#f0f0f0')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#f9fafb')}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              backgroundColor: '#fef2f2',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <item.icon style={{ color: '#721011', width: 16, height: 16 }} />
            </div>
            <span style={{ fontSize: 14, color: '#374151', flex: 1 }}>{item.text}</span>
            <ChevronRight className="h-4 w-4 text-gray-300" style={{ flexShrink: 0 }} />
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 380, margin: '0 auto' }}>
        <GhostBtn onClick={onBack} disabled={saving}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
        </GhostBtn>
        <PrimaryBtn onClick={onConcluir} loading={saving} style={{ padding: '12px 32px', fontSize: 15 }}>
          Abrir o painel
        </PrimaryBtn>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared micro-components
// ---------------------------------------------------------------------------

function StepHeader({ icon, bg, title, sub }: { icon: React.ReactNode; bg: string; title: string; sub: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
      <div style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <h2 style={{ fontSize: 19, fontWeight: 700, color: '#111827', margin: 0 }}>{title}</h2>
        <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>{sub}</p>
      </div>
    </div>
  )
}

function Field({ label, children, style: extraStyle }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={extraStyle}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

function PrimaryBtn({
  children, onClick, loading = false, disabled = false, style: extra,
}: {
  children: React.ReactNode; onClick?: () => void
  loading?: boolean; disabled?: boolean; style?: React.CSSProperties
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{ ...primaryBtnStyle, opacity: disabled || loading ? 0.65 : 1, cursor: disabled || loading ? 'not-allowed' : 'pointer', ...extra }}
    >
      {loading && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
      {children}
    </button>
  )
}

function GhostBtn({
  children, onClick, disabled = false,
}: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...ghostBtnStyle, opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const inputStyle: React.CSSProperties = {
  display: 'block', width: '100%',
  padding: '10px 12px', fontSize: 14, color: '#111827',
  backgroundColor: '#fff', border: '1px solid #d1d5db',
  borderRadius: 8, outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280',
  marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em',
}

const primaryBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center',
  padding: '10px 20px', fontSize: 14, fontWeight: 600,
  color: '#fff', backgroundColor: '#721011',
  border: 'none', borderRadius: 8,
  cursor: 'pointer', fontFamily: 'inherit',
}

const secondaryBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center',
  padding: '8px 16px', fontSize: 13, fontWeight: 500,
  color: '#721011', backgroundColor: '#fff',
  border: '1px solid #721011', borderRadius: 8,
  cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
}

const ghostBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center',
  padding: '10px 14px', fontSize: 14, fontWeight: 500,
  color: '#6b7280', backgroundColor: 'transparent',
  border: '1px solid #e5e7eb', borderRadius: 8,
  cursor: 'pointer', fontFamily: 'inherit',
}
