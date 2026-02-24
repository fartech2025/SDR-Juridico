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
  Mail,
  Trash2,
  KeyRound,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react'
import { organizationsService } from '@/services/organizationsService'
import { useFartechAdmin } from '@/hooks/useFartechAdmin'
import { FartechGuard } from '@/components/guards'
import { supabase } from '@/lib/supabaseClient'
import { Modal } from '@/components/ui/modal'
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
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmSlug, setDeleteConfirmSlug] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const [showResetModal, setShowResetModal] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetResult, setResetResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [orgMembers, setOrgMembers] = useState<Array<{ user_id: string; email: string; nome: string; role: string; ativo: boolean }>>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [showGeneratedPassword, setShowGeneratedPassword] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const DEFAULT_PASSWORD = 'Mudar@123'

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

  const handleDeleteOrganization = async () => {
    if (!id || !organization) return
    if (deleteConfirmSlug.trim() !== organization.slug.trim()) {
      setDeleteError('O slug digitado não corresponde. Digite exatamente: ' + organization.slug.trim())
      return
    }

    setDeleteLoading(true)
    setDeleteError(null)

    try {
      const { data, error: fnError } = await supabase.functions.invoke('delete-organization', {
        body: { orgId: id, confirmSlug: deleteConfirmSlug.trim() },
      })

      if (fnError) {
        console.error('❌ Edge Function error:', fnError)
        // supabase-js v2: quando status não é 2xx, o body vem em fnError.context
        let errorMsg = fnError.message || 'Erro desconhecido'
        try {
          // Tentar extrair o JSON da resposta
          if (fnError.context && typeof fnError.context.json === 'function') {
            const body = await fnError.context.json()
            errorMsg = body?.error || body?.message || errorMsg
          }
        } catch { /* fallback para mensagem padrão */ }
        setDeleteError('Erro ao excluir: ' + errorMsg)
        return
      }

      // A resposta pode vir como string (quando a function não existe) ou objeto
      const result = typeof data === 'string' ? (() => { try { return JSON.parse(data) } catch { return { error: data } } })() : data

      if (!result || result.error) {
        console.error('❌ Delete result error:', result)
        setDeleteError(result?.error || 'Erro desconhecido ao excluir a organização')
        return
      }

      // Sucesso — voltar para a lista
      navigate('/admin/organizations', {
        state: { refresh: true, message: `Organização "${organization.name}" excluída com sucesso.` },
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      setDeleteError(message)
    } finally {
      setDeleteLoading(false)
    }
  }

  const loadMembers = async () => {
    if (!id) return
    setMembersLoading(true)
    try {
      const { data, error: fnError } = await supabase.functions.invoke('reset-member-password', {
        body: { orgId: id, action: 'list' },
      })

      if (fnError) {
        let errorMsg = fnError.message || 'Erro desconhecido'
        try {
          if (fnError.context && typeof fnError.context.json === 'function') {
            const body = await fnError.context.json()
            errorMsg = body?.error || body?.message || errorMsg
          }
        } catch { /* fallback */ }
        console.error('Erro ao carregar membros:', errorMsg)
        setOrgMembers([])
        return
      }

      const result = typeof data === 'string' ? (() => { try { return JSON.parse(data) } catch { return null } })() : data
      setOrgMembers(result?.members || [])
    } catch (err) {
      console.error('Erro ao carregar membros:', err)
      setOrgMembers([])
    } finally {
      setMembersLoading(false)
    }
  }

  const handleResetPassword = async (userId: string, useDefault: boolean) => {
    if (!id) return
    setResetLoading(true)
    setResetResult(null)
    setSelectedUserId(userId)

    const password = useDefault ? DEFAULT_PASSWORD : `Temp${crypto.randomUUID().substring(0, 8)}!`

    try {
      const { data, error: fnError } = await supabase.functions.invoke('reset-member-password', {
        body: { orgId: id, userId, password },
      })

      if (fnError) {
        let errorMsg = fnError.message || 'Erro desconhecido'
        try {
          if (fnError.context && typeof fnError.context.json === 'function') {
            const body = await fnError.context.json()
            errorMsg = body?.error || body?.message || errorMsg
          }
        } catch { /* fallback */ }
        setResetResult({ type: 'error', message: errorMsg })
        return
      }

      const result = typeof data === 'string' ? (() => { try { return JSON.parse(data) } catch { return { error: data } } })() : data

      if (!result || result.error) {
        setResetResult({ type: 'error', message: result?.error || 'Erro desconhecido' })
        return
      }

      setGeneratedPassword(password)
      setShowGeneratedPassword(true)
      setResetResult({
        type: 'success',
        message: useDefault
          ? `Senha resetada para a senha padrão (${DEFAULT_PASSWORD})`
          : `Senha resetada para senha temporária`,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      setResetResult({ type: 'error', message })
    } finally {
      setResetLoading(false)
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
          
          // Mostrar mensagem sem expor senha
          setInviteStatus({
            type: 'success',
            message: `Acesso criado para ${adminEmail}.\n\nO Supabase nao esta configurado para enviar emails.\nConfigure o SMTP em: Settings > Auth > SMTP Settings para que o usuario receba o link de acesso por email.\n\nApos configurar, reenvie o convite.`
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
      <div className="min-h-screen bg-surface-alt flex items-center justify-center">
        <div className="text-text-muted">Carregando...</div>
      </div>
    )
  }
  
  if (error || !organization) {
    return (
      <div className="min-h-screen bg-surface-alt flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-text-muted">{error || 'Organização não encontrada'}</p>
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
      <div className="min-h-screen bg-surface-alt">
        {/* Header */}
        <div className="bg-white border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => navigate('/admin/organizations')}
                  className="mr-4 p-2 text-text-muted hover:bg-surface-alt rounded-lg transition-colors"
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
                    <h1 className="text-3xl font-bold text-text">
                      {organization.name}
                    </h1>
                    <p className="mt-1 text-sm text-text-muted">
                      {organization.slug} • <StatusBadge status={organization.status} />
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={handleViewAsOrg}
                  className="inline-flex items-center px-4 py-2 border border-border-strong text-text rounded-lg hover:bg-surface-alt transition-colors"
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

                <button
                  onClick={() => { setShowResetModal(true); setResetResult(null); setSelectedUserId(null); setShowGeneratedPassword(false); loadMembers() }}
                  className="inline-flex items-center px-4 py-2 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors"
                >
                  <KeyRound className="w-4 h-4 mr-2" />
                  Resetar Senha
                </button>

                <button
                  onClick={() => { setShowDeleteModal(true); setDeleteConfirmSlug(''); setDeleteError(null) }}
                  className="inline-flex items-center px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Modal de reset de senha */}
        <Modal
          open={showResetModal && !!organization}
          onClose={() => setShowResetModal(false)}
          title="Resetar Senha de Membro"
          description={organization ? `Selecione um membro de ${organization.name} para resetar a senha.` : ''}
          maxWidth="520px"
          footer={
            <button
              onClick={() => setShowResetModal(false)}
              style={{
                padding: '8px 20px', borderRadius: '8px', border: '1px solid #D1D5DB',
                backgroundColor: 'white', color: '#374151', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
              }}
            >
              Fechar
            </button>
          }
        >
          {membersLoading ? (
            <p style={{ textAlign: 'center', color: '#9CA3AF', padding: '20px' }}>Carregando membros...</p>
          ) : orgMembers.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9CA3AF', padding: '20px' }}>Nenhum membro encontrado.</p>
          ) : (
            <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F9FAFB' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Nome</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Email</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Papel</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: '#374151' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {orgMembers.map((m) => (
                    <tr key={m.user_id} style={{ borderTop: '1px solid #E5E7EB' }}>
                      <td style={{ padding: '8px 12px', color: '#111827' }}>{m.nome}</td>
                      <td style={{ padding: '8px 12px', color: '#6B7280', fontFamily: 'monospace', fontSize: '12px' }}>{m.email}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{
                          display: 'inline-block', padding: '2px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600,
                          backgroundColor: m.role === 'admin' ? '#DBEAFE' : '#F3F4F6',
                          color: m.role === 'admin' ? '#1E40AF' : '#6B7280',
                        }}>
                          {m.role}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleResetPassword(m.user_id, true)}
                          disabled={resetLoading}
                          title={`Resetar para ${DEFAULT_PASSWORD}`}
                          style={{
                            background: 'none', border: '1px solid #D97706', borderRadius: '6px',
                            padding: '4px 10px', cursor: 'pointer', color: '#D97706', fontSize: '12px',
                            fontWeight: 500, opacity: resetLoading && selectedUserId === m.user_id ? 0.5 : 1,
                          }}
                        >
                          {resetLoading && selectedUserId === m.user_id ? 'Resetando...' : 'Resetar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {resetResult && (
            <div style={{
              marginBottom: '12px', fontSize: '13px', borderRadius: '8px', padding: '10px 12px',
              backgroundColor: resetResult.type === 'success' ? '#ECFDF5' : '#FEF2F2',
              border: `1px solid ${resetResult.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
              color: resetResult.type === 'success' ? '#065F46' : '#DC2626',
            }}>
              {resetResult.message}
              {resetResult.type === 'success' && (
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontFamily: 'monospace', backgroundColor: '#D1FAE5', padding: '4px 8px', borderRadius: '4px', fontSize: '14px', fontWeight: 600 }}>
                    {showGeneratedPassword ? generatedPassword : '••••••••'}
                  </span>
                  <button
                    onClick={() => setShowGeneratedPassword(!showGeneratedPassword)}
                    title={showGeneratedPassword ? 'Ocultar' : 'Mostrar'}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065F46', padding: '2px' }}
                  >
                    {showGeneratedPassword ? <EyeOff style={{ width: '14px', height: '14px' }} /> : <Eye style={{ width: '14px', height: '14px' }} />}
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(generatedPassword)}
                    title="Copiar senha"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065F46', padding: '2px' }}
                  >
                    <Copy style={{ width: '14px', height: '14px' }} />
                  </button>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* Modal de exclusão */}
        <Modal
          open={showDeleteModal && !!organization}
          onClose={() => { if (!deleteLoading) setShowDeleteModal(false) }}
          title="Excluir Organização"
          maxWidth="480px"
          footer={
            <>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
                style={{ padding: '10px 16px', fontSize: '14px', color: '#4B5563', backgroundColor: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteOrganization}
                disabled={deleteLoading || deleteConfirmSlug.trim() !== (organization?.slug?.trim() ?? '')}
                style={{
                  padding: '10px 16px',
                  fontSize: '14px',
                  backgroundColor: deleteLoading || deleteConfirmSlug.trim() !== (organization?.slug?.trim() ?? '') ? '#F87171' : '#DC2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: deleteLoading || deleteConfirmSlug.trim() !== (organization?.slug?.trim() ?? '') ? 'not-allowed' : 'pointer',
                  opacity: deleteLoading || deleteConfirmSlug.trim() !== (organization?.slug?.trim() ?? '') ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                {deleteLoading ? 'Excluindo...' : (
                  <>
                    <Trash2 style={{ width: '16px', height: '16px' }} />
                    Excluir permanentemente
                  </>
                )}
              </button>
            </>
          }
        >
          <p style={{ fontSize: '14px', color: '#4B5563', marginBottom: '8px' }}>
            Esta ação é <strong style={{ color: '#DC2626' }}>irreversível</strong>. Todos os dados serão excluídos permanentemente:
          </p>
          <ul style={{ fontSize: '12px', color: '#6B7280', marginBottom: '16px', paddingLeft: '20px' }}>
            <li>Membros, leads, clientes e casos</li>
            <li>Documentos, tarefas e agenda</li>
            <li>Logs, alertas e analytics</li>
            <li>Usuários que pertencem apenas a esta org</li>
          </ul>

          <p style={{ fontSize: '14px', color: '#374151', marginBottom: '8px' }}>
            Para confirmar, digite o slug: <code style={{ backgroundColor: '#F3F4F6', padding: '2px 6px', borderRadius: '4px', color: '#B91C1C', fontFamily: 'monospace', fontSize: '12px' }}>{organization?.slug}</code>
            <button
              type="button"
              title="Copiar slug"
              onClick={() => {
                navigator.clipboard.writeText(organization?.slug?.trim() || '')
                setDeleteError('')
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', marginLeft: '4px', verticalAlign: 'middle', color: '#6B7280', fontSize: '14px' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#111827')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#6B7280')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </button>
          </p>

          <input
            type="text"
            value={deleteConfirmSlug}
            onChange={(e) => setDeleteConfirmSlug(e.target.value)}
            placeholder={organization?.slug}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              marginBottom: '12px',
              boxSizing: 'border-box',
            }}
            autoFocus
          />

          {deleteError && (
            <div style={{ marginBottom: '12px', fontSize: '13px', color: '#DC2626', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '8px 12px', whiteSpace: 'pre-wrap' }}>
              {deleteError}
            </div>
          )}
        </Modal>

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
                  <div className="p-6 border-b border-border">
                    <h2 className="text-lg font-semibold text-text">
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
                <div className="p-6 border-b border-border">
                  <h2 className="text-lg font-semibold text-text">
                    Detalhes do Plano
                  </h2>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-text-muted mb-1">Plano</p>
                      <p className="text-lg font-semibold text-text capitalize">
                        {organization.plan}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-text-muted mb-1">Ciclo de Cobrança</p>
                      <p className="text-lg font-semibold text-text capitalize">
                        {organization.billing_cycle || 'monthly'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-text-muted mb-1">Limite de Usuários</p>
                      <p className="text-lg font-semibold text-text">
                        {organization.max_users}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-text-muted mb-1">Armazenamento</p>
                      <p className="text-lg font-semibold text-text">
                        {organization.max_storage_gb}GB
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-text-muted mb-1">Limite de Casos</p>
                      <p className="text-lg font-semibold text-text">
                        {organization.max_cases || 'Ilimitado'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Address */}
              {organization.address_street && (
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6 border-b border-border">
                    <h2 className="text-lg font-semibold text-text flex items-center">
                      <MapPin className="w-5 h-5 mr-2" />
                      Endereço
                    </h2>
                  </div>
                  
                  <div className="p-6">
                    <p className="text-text">
                      {organization.address_street}, {organization.address_number}
                      {organization.address_complement && ` - ${organization.address_complement}`}
                    </p>
                    <p className="text-text-muted">
                      {organization.address_neighborhood}
                    </p>
                    <p className="text-text-muted">
                      {organization.address_city} - {organization.address_state}
                    </p>
                    <p className="text-text-muted">
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
                <div className="p-6 border-b border-border">
                  <h2 className="text-lg font-semibold text-text">
                    Informações
                  </h2>
                </div>
                
                <div className="p-6 space-y-4">
                  {organization.cnpj && (
                    <div>
                      <p className="text-sm text-text-muted mb-1">CNPJ</p>
                      <p className="text-text">{organization.cnpj}</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm text-text-muted mb-1">Criado em</p>
                    <div className="flex items-center text-text">
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
                      <p className="text-sm text-text-muted mb-1">Trial termina em</p>
                      <div className="flex items-center text-text">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(trialEndsAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Branding */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-border">
                  <h2 className="text-lg font-semibold text-text">
                    Identidade Visual
                  </h2>
                </div>
                
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-sm text-text-muted mb-2">Cor Primária</p>
                    <div className="flex items-center">
                      <div 
                        className="w-10 h-10 rounded border border-border-strong mr-3"
                        style={{ backgroundColor: organization.primary_color }}
                      />
                      <span className="text-text font-mono">
                        {organization.primary_color}
                      </span>
                    </div>
                  </div>
                  
                  {organization.secondary_color && (
                    <div>
                      <p className="text-sm text-text-muted mb-2">Cor Secundária</p>
                      <div className="flex items-center">
                        <div 
                          className="w-10 h-10 rounded border border-border-strong mr-3"
                          style={{ backgroundColor: organization.secondary_color }}
                        />
                        <span className="text-text font-mono">
                          {organization.secondary_color}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {organization.custom_domain && (
                    <div>
                      <p className="text-sm text-text-muted mb-1">Domínio Customizado</p>
                      <p className="text-text">{organization.custom_domain}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Features */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-border">
                  <h2 className="text-lg font-semibold text-text">
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
    suspended: { label: 'Suspenso', class: 'bg-yellow-100 text-yellow-800' },
    cancelled: { label: 'Cancelado', class: 'bg-red-100 text-red-800' },
    pending: { label: 'Pendente', class: 'bg-surface-alt text-text' },
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
      
      <p className="text-2xl font-bold text-text mb-1">
        {value}
      </p>
      
      <p className="text-sm font-medium text-text-muted">
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
        <span className="text-sm font-medium text-text">
          {label}
        </span>
        <span className="text-sm text-text-muted">
          {current.toFixed(1)} / {limit} {unit} ({percentage.toFixed(0)}%)
        </span>
      </div>
      <div className="w-full bg-surface-alt rounded-full h-2.5">
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
      <span className="text-sm text-text">{label}</span>
      {enabled ? (
        <CheckCircle className="w-5 h-5 text-green-500" />
      ) : (
        <XCircle className="w-5 h-5 text-text-subtle" />
      )}
    </div>
  )
}
