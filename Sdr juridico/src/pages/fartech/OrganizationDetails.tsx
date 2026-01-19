// OrganizationDetails - Detailed view of a single organization
// Date: 2026-01-13

import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { 
  ArrowLeft,
  Edit,
  Users,
  Briefcase,
  HardDrive,
  TrendingUp,
  Calendar,
  MapPin,
  Building2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Mail
} from 'lucide-react'
import { organizationsService } from '@/services/organizationsService'
import { useFartechAdmin } from '@/hooks/useFartechAdmin'
import { FartechGuard } from '@/components/guards'
import { supabase } from '@/lib/supabaseClient'
import type { Organization, OrganizationStats, OrganizationUsage } from '@/types/organization'

export default function OrganizationDetails() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { viewOrganization } = useFartechAdmin()
  
  const [loading, setLoading] = useState(true)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [stats, setStats] = useState<OrganizationStats | null>(null)
  const [usage, setUsage] = useState<OrganizationUsage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [inviteStatus, setInviteStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [inviteLoading, setInviteLoading] = useState(false)

  const settings = (organization?.settings || {}) as Record<string, any>
  const trialEndsAt = settings.trial_ends_at as string | undefined
  const enableApiAccess = Boolean(settings.enable_api_access)
  const enableWhiteLabel = Boolean(settings.enable_white_label)
  const enableCustomDomain = Boolean(settings.enable_custom_domain)
  const enableSso = Boolean(settings.enable_sso)
  const adminEmail = settings.admin_email as string | undefined
  const adminName = settings.admin_name as string | undefined
  const responsavelEmail = settings.responsavel_email as string | undefined
  
  useEffect(() => {
    if (id) {
      loadOrganizationData(id)
    }
  }, [id])
  
  const loadOrganizationData = async (orgId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const [org, orgStats, orgUsage] = await Promise.all([
        organizationsService.getById(orgId),
        organizationsService.getStats(orgId),
        organizationsService.getUsage(orgId),
      ])
      
      if (!org) {
        setError('Organização não encontrada')
        return
      }
      
      setOrganization(org)
      setStats(orgStats)
      setUsage(orgUsage)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar dados'
      setError(message)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
  
  const handleViewAsOrg = async () => {
    if (id) {
      await viewOrganization(id)
      navigate('/app/dashboard')
    }
  }

  const handleResendInvite = async () => {
    if (!id) return
    if (!adminEmail) {
      setInviteStatus({ type: 'error', message: 'Defina o e-mail do admin nas configurações da organização.' })
      return
    }

    setInviteLoading(true)
    setInviteStatus(null)

    try {
      console.log('📧 Criando acesso para:', adminEmail)
      
      // Gerar senha temporária aleatória (forte)
      const tempPassword = `Temp${crypto.randomUUID().substring(0, 8)}!`
      
      // Criar usuário com auto-confirmação (sem envio de email)
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: adminEmail,
        password: tempPassword,
        options: {
          data: {
            nome_completo: adminName || adminEmail,
            org_id: id,
            role: 'org_admin',
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signUpError) {
        // Se for erro de envio de email, ignorar e criar manualmente
        if (signUpError.message.includes('Error sending confirmation email') || 
            signUpError.message.includes('sending confirmation')) {
          console.log('⚠️ Email não configurado, criando usuário sem confirmação...')
          
          // Mostrar mensagem de sucesso com instrução manual
          setInviteStatus({ 
            type: 'success', 
            message: `✅ Tentativa de criar acesso realizada!\n\nEmail: ${adminEmail}\nSenha: ${tempPassword}\n\n⚠️ IMPORTANTE:\n1. O Supabase não está configurado para enviar emails\n2. Configure o SMTP em: Settings → Auth → SMTP Settings\n3. Ou envie essas credenciais manualmente ao administrador` 
          })
          return
        }
        
        // Se usuário já existe, isso é ok - apenas informamos
        if (signUpError.message.includes('already registered') || signUpError.message.includes('already been registered')) {
          console.log('⚠️ Usuário já existe, atualizando permissões...')
          
          // Buscar ID do usuário existente pelo email em auth.users
          const { data: authUser } = await (supabase.auth.admin as any).getUserByEmail(adminEmail)
          
          if (!authUser || !authUser.user) {
            setInviteStatus({ type: 'error', message: 'Usuário não encontrado no sistema.' })
            return
          }
          
          const userId = authUser.user.id
          
          // Atualizar/criar na tabela usuarios
          await supabase
            .from('usuarios')
            .upsert({
              id: userId,
              email: adminEmail,
              nome_completo: adminName || adminEmail,
              permissoes: ['org_admin'],
            }, { onConflict: 'id' })
          
          // Adicionar a org_members
          await supabase
            .from('org_members')
            .upsert({
              org_id: id,
              user_id: userId,
              role: 'admin',
              ativo: true,
            }, { onConflict: 'org_id,user_id' })
          
          // Atualizar settings da organização
          await supabase
            .from('orgs')
            .update({
              settings: {
                ...(organization?.settings || {}),
                admin_email: adminEmail,
                admin_name: adminName || adminEmail,
                responsavel_email: responsavelEmail || null,
                managed_by: userId,
              },
            })
            .eq('id', id)
          
          setInviteStatus({ 
            type: 'success', 
            message: `Usuário já existe. Permissões atualizadas.\n\nEmail: ${adminEmail}\nInstrua o usuário a fazer login ou redefinir a senha.` 
          })
          return
        }
        
        console.error('❌ Erro ao criar usuário:', signUpError)
        setInviteStatus({ type: 'error', message: `Erro: ${signUpError.message}` })
        return
      }

      const userId = signUpData.user?.id
      if (!userId) {
        setInviteStatus({ type: 'error', message: 'Não foi possível criar o usuário.' })
        return
      }

      console.log('✅ Usuário criado:', userId)

      // Adicionar à tabela usuarios
      await supabase
        .from('usuarios')
        .upsert({
          id: userId,
          email: adminEmail,
          nome_completo: adminName || adminEmail,
          permissoes: ['org_admin'],
        }, { onConflict: 'id' })

      // Adicionar à org_members
      await supabase
        .from('org_members')
        .upsert({
          org_id: id,
          user_id: userId,
          role: 'admin',
          ativo: true,
        }, { onConflict: 'org_id,user_id' })

      // Atualizar settings da organização
      await supabase
        .from('orgs')
        .update({
          settings: {
            ...(organization?.settings || {}),
            admin_email: adminEmail,
            admin_name: adminName || adminEmail,
            responsavel_email: responsavelEmail || null,
            managed_by: userId,
          },
        })
        .eq('id', id)

      console.log('✅ Acesso criado com sucesso!')
      setInviteStatus({ 
        type: 'success', 
        message: `✅ Acesso criado com sucesso!\n\nEmail: ${adminEmail}\nSenha temporária: ${tempPassword}\n\n⚠️ IMPORTANTE: Copie esta senha e envie ao administrador por canal seguro. Peça para alterar no primeiro acesso.` 
      })
    } catch (err) {
      console.error('❌ Erro não capturado:', err)
      const message = err instanceof Error ? err.message : 'Erro ao criar acesso'
      setInviteStatus({ type: 'error', message })
    } finally {
      setInviteLoading(false)
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Carregando...</div>
      </div>
    )
  }
  
  if (error || !organization) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error || 'Organização não encontrada'}</p>
          <button
            onClick={() => navigate('/admin/organizations')}
            className="mt-4 text-emerald-600 hover:underline"
          >
            Voltar para lista
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <FartechGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => navigate('/admin/organizations')}
                  className="mr-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                
                <div className="flex items-center">
                  <div 
                    className="w-16 h-16 rounded-lg flex items-center justify-center mr-4"
                    style={{ backgroundColor: organization.primary_color + '20' }}
                  >
                    {organization.logo_url ? (
                      <img src={organization.logo_url} alt={organization.name} className="w-12 h-12 rounded" />
                    ) : (
                      <Building2 className="w-8 h-8" style={{ color: organization.primary_color }} />
                    )}
                  </div>
                  
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {organization.name}
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                      {organization.slug} • <StatusBadge status={organization.status} />
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={handleViewAsOrg}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Visualizar como Org
                </button>

                <button
                  onClick={handleResendInvite}
                  disabled={inviteLoading}
                  className="inline-flex items-center px-4 py-2 border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-50:bg-emerald-900/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {inviteLoading ? 'Enviando...' : 'Reenviar convite'}
                </button>
                
                <Link
                  to={`/admin/organizations/${id}/edit`}
                  className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {inviteStatus && (
            <div
              className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
                inviteStatus.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {inviteStatus.message}
            </div>
          )}
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Usuários"
                value={stats.total_users}
                icon={Users}
                color="blue"
              />
              <StatCard
                title="Clientes"
                value={stats.total_clients}
                icon={Briefcase}
                color="purple"
              />
              <StatCard
                title="Casos"
                value={stats.total_cases}
                icon={TrendingUp}
                color="orange"
              />
              <StatCard
                title="Armazenamento"
                value={`${stats.storage_used_gb.toFixed(1)}GB`}
                icon={HardDrive}
                color="red"
              />
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Usage */}
              {usage && (
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Uso de Recursos
                    </h2>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    <UsageBar
                      label="Usuários"
                      current={usage.users.current}
                      limit={usage.users.limit}
                      percentage={usage.users.percentage}
                      unit="usuários"
                    />
                    
                    <UsageBar
                      label="Armazenamento"
                      current={usage.storage.current_gb}
                      limit={usage.storage.limit_gb}
                      percentage={usage.storage.percentage}
                      unit="GB"
                    />
                    
                    {organization.max_cases && (
                      <UsageBar
                        label="Casos"
                        current={usage.cases.current}
                        limit={usage.cases.limit ?? 0}
                        percentage={usage.cases.percentage ?? 0}
                        unit="casos"
                      />
                    )}
                  </div>
                </div>
              )}
              
              {/* Plan Details */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Detalhes do Plano
                  </h2>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Plano</p>
                      <p className="text-lg font-semibold text-gray-900 capitalize">
                        {organization.plan}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Ciclo de Cobrança</p>
                      <p className="text-lg font-semibold text-gray-900 capitalize">
                        {organization.billing_cycle || 'monthly'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Limite de Usuários</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {organization.max_users}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Armazenamento</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {organization.max_storage_gb}GB
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Limite de Casos</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {organization.max_cases || 'Ilimitado'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Address */}
              {organization.address_street && (
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                      <MapPin className="w-5 h-5 mr-2" />
                      Endereço
                    </h2>
                  </div>
                  
                  <div className="p-6">
                    <p className="text-gray-900">
                      {organization.address_street}, {organization.address_number}
                      {organization.address_complement && ` - ${organization.address_complement}`}
                    </p>
                    <p className="text-gray-600">
                      {organization.address_neighborhood}
                    </p>
                    <p className="text-gray-600">
                      {organization.address_city} - {organization.address_state}
                    </p>
                    <p className="text-gray-600">
                      CEP: {organization.address_postal_code}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Informações
                  </h2>
                </div>
                
                <div className="p-6 space-y-4">
                  {organization.cnpj && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">CNPJ</p>
                      <p className="text-gray-900">{organization.cnpj}</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Criado em</p>
                    <div className="flex items-center text-gray-900">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(organization.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                  
                  {trialEndsAt && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Trial termina em</p>
                      <div className="flex items-center text-gray-900">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(trialEndsAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Branding */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Identidade Visual
                  </h2>
                </div>
                
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Cor Primária</p>
                    <div className="flex items-center">
                      <div 
                        className="w-10 h-10 rounded border border-gray-300 mr-3"
                        style={{ backgroundColor: organization.primary_color }}
                      />
                      <span className="text-gray-900 font-mono">
                        {organization.primary_color}
                      </span>
                    </div>
                  </div>
                  
                  {organization.secondary_color && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Cor Secundária</p>
                      <div className="flex items-center">
                        <div 
                          className="w-10 h-10 rounded border border-gray-300 mr-3"
                          style={{ backgroundColor: organization.secondary_color }}
                        />
                        <span className="text-gray-900 font-mono">
                          {organization.secondary_color}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {organization.custom_domain && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Domínio Customizado</p>
                      <p className="text-gray-900">{organization.custom_domain}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Features */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Recursos Habilitados
                  </h2>
                </div>
                
                <div className="p-6 space-y-3">
                  <FeatureItem 
                    enabled={enableApiAccess} 
                    label="Acesso API" 
                  />
                  <FeatureItem 
                    enabled={enableWhiteLabel} 
                    label="White Label" 
                  />
                  <FeatureItem 
                    enabled={enableCustomDomain} 
                    label="Domínio Customizado" 
                  />
                  <FeatureItem 
                    enabled={enableSso} 
                    label="SSO" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FartechGuard>
  )
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    active: { label: 'Ativo', class: 'bg-green-100 text-green-800' },
    trial: { label: 'Trial', class: 'bg-blue-100 text-blue-800' },
    suspended: { label: 'Suspenso', class: 'bg-yellow-100 text-yellow-800' },
    cancelled: { label: 'Cancelado', class: 'bg-red-100 text-red-800' },
  }
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`}>
      {config.label}
    </span>
  )
}

interface StatCardProps {
  title: string
  value: number | string
  icon: any
  color: 'blue' | 'purple' | 'orange' | 'red'
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      
      <p className="text-2xl font-bold text-gray-900 mb-1">
        {value}
      </p>
      
      <p className="text-sm font-medium text-gray-600">
        {title}
      </p>
    </div>
  )
}

interface UsageBarProps {
  label: string
  current: number
  limit: number
  percentage: number
  unit: string
}

function UsageBar({ label, current, limit, percentage, unit }: UsageBarProps) {
  const getColor = () => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 75) return 'bg-yellow-500'
    return 'bg-emerald-500'
  }
  
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          {label}
        </span>
        <span className="text-sm text-gray-600">
          {current.toFixed(1)} / {limit} {unit} ({percentage.toFixed(0)}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full transition-all ${getColor()}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  )
}

function FeatureItem({ enabled, label }: { enabled: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-700">{label}</span>
      {enabled ? (
        <CheckCircle className="w-5 h-5 text-green-500" />
      ) : (
        <XCircle className="w-5 h-5 text-gray-400" />
      )}
    </div>
  )
}
