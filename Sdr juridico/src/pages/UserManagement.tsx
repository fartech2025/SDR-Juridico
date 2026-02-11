// UserManagement - Manage organization users (Org Admin+)
// Date: 2026-01-13

import { useState, useEffect } from 'react'
import {
  Users,
  Edit,
  Trash2,
  Shield,
  Search,
  UserPlus,
  X,
  Mail,
  User as UserIcon,
  Building2,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { OrgAdminGuard } from '@/components/guards'
import { useOrganization } from '@/hooks/useOrganization'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { supabase } from '@/lib/supabaseClient'
interface OrgUser {
  id: string
  email: string
  nome: string | null
  role: OrgMemberRole
  ativo: boolean
  created_at: string
  last_sign_in_at: string | null
  org_id?: string | null
}

type OrgMemberRole = 'admin' | 'gestor' | 'advogado' | 'secretaria' | 'leitura'

const ORG_ROLE_LABELS: Record<OrgMemberRole, string> = {
  admin: 'Administrador',
  gestor: 'Gestor',
  advogado: 'Advogado',
  secretaria: 'Secretaria',
  leitura: 'Somente Leitura',
}

export default function UserManagement() {
  const { currentOrg } = useOrganization()
  const { role: userRole, user: authUser } = useCurrentUser()
  const isFartechAdmin = userRole === 'fartech_admin'

  const [users, setUsers] = useState<OrgUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [selectedOrgId, setSelectedOrgId] = useState<string>('all')
  const [allOrgs, setAllOrgs] = useState<{ id: string; name: string; max_users: number }[]>([])
  const [editingUser, setEditingUser] = useState<OrgUser | null>(null)
  const [removingUser, setRemovingUser] = useState<OrgUser | null>(null)

  const actionOrgId = isFartechAdmin
    ? (selectedOrgId === 'all' ? null : selectedOrgId)
    : currentOrg?.id || null

  const roleToPermissoes = (role: OrgMemberRole) => {
    // Admin e gestor ambos recebem apenas 'org_admin' (não existe permissão 'gestor' separada)
    if (role === 'admin' || role === 'gestor') return ['org_admin']
    return ['user']
  }

  // Load all orgs for fartech admin selector
  useEffect(() => {
    if (!isFartechAdmin) return
    const loadOrgs = async () => {
      const { data } = await supabase
        .from('orgs')
        .select('id, name, max_users')
        .order('name')
      setAllOrgs(data || [])
    }
    loadOrgs()
  }, [isFartechAdmin])

  useEffect(() => {
    loadUsers()
  }, [currentOrg, selectedOrgId, isFartechAdmin])

  const loadUsers = async () => {
    // Determine target org
    const targetOrgId = isFartechAdmin
      ? (selectedOrgId === 'all' ? null : selectedOrgId)
      : currentOrg?.id || null

    if (!isFartechAdmin && !currentOrg) {
      setUsers([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      if (targetOrgId) {
        // Query org_members for specific org
        const { data: members, error: membersError } = await supabase
          .from('org_members')
          .select('user_id, role, ativo, created_at, org_id')
          .eq('org_id', targetOrgId)
          .order('created_at', { ascending: false })

        const hasOrgMembers = !membersError && members && members.length > 0

        if (hasOrgMembers) {
          const userIds = members.map(m => m.user_id)
          const { data: usuarios, error: usersError } = await supabase
            .from('usuarios')
            .select('id, email, nome_completo, updated_at')
            .in('id', userIds)

          if (usersError) throw usersError

          const userMap = new Map((usuarios || []).map(u => [u.id, u]))
          const mapped: OrgUser[] = members
            .filter(m => userMap.has(m.user_id))
            .map(m => {
              const u = userMap.get(m.user_id)!
              return {
                id: m.user_id,
                email: u.email,
                nome: u.nome_completo,
                role: (m.role || 'leitura') as OrgMemberRole,
                ativo: m.ativo !== false,
                created_at: m.created_at,
                last_sign_in_at: u.updated_at,
                org_id: m.org_id || targetOrgId,
              }
            })
          setUsers(mapped)
        } else {
          // org_members empty for this org — fallback to all usuarios
          const mapped = await loadAllUsuarios()
          setUsers(mapped)
        }
      } else {
        // All orgs (fartech admin "Todas")
        const mapped = await loadAllUsuarios()
        setUsers(mapped)
      }
    } catch (error) {
      console.error('Erro ao carregar usuarios:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAllUsuarios = async (): Promise<OrgUser[]> => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, email, nome_completo, permissoes, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []).map((row) => {
      const permissoes: string[] = row.permissoes || []
      let role: OrgMemberRole = 'leitura'
      if (permissoes.includes('gestor') || permissoes.includes('org_admin') || permissoes.includes('admin')) {
        role = 'admin'
      } else if (permissoes.includes('advogado')) {
        role = 'advogado'
      } else if (permissoes.includes('secretaria')) {
        role = 'secretaria'
      }
      return {
        id: row.id,
        email: row.email,
        nome: row.nome_completo,
        role,
        ativo: true,
        created_at: row.created_at,
        last_sign_in_at: row.updated_at,
        org_id: null,
      }
    })
  }

  const updateUserData = async ({
    userId,
    orgId,
    nome,
    role,
    ativo,
  }: {
    userId: string
    orgId: string
    nome: string
    role: OrgMemberRole
    ativo: boolean
  }) => {
    const trimmedName = nome.trim() || 'Usuario'
    const permissoes = roleToPermissoes(role)

    const { error: userError } = await supabase
      .from('usuarios')
      .update({
        nome_completo: trimmedName,
        permissoes,
      })
      .eq('id', userId)

    if (userError) {
      throw new Error('Erro ao atualizar perfil: ' + userError.message)
    }

    const { error: memberError } = await supabase
      .from('org_members')
      .upsert(
        {
          org_id: orgId,
          user_id: userId,
          role,
          ativo,
        },
        { onConflict: 'org_id,user_id' },
      )

    if (memberError) {
      throw new Error('Erro ao atualizar papel do usuario: ' + memberError.message)
    }
  }

  const deactivateUser = async (user: OrgUser, orgId: string) => {
    const { error: memberError } = await supabase
      .from('org_members')
      .update({ ativo: false })
      .eq('org_id', orgId)
      .eq('user_id', user.id)

    if (memberError) {
      throw new Error('Erro ao inativar membro: ' + memberError.message)
    }

    const { error: userError } = await supabase
      .from('usuarios')
      .update({ permissoes: ['user'] })
      .eq('id', user.id)

    if (userError) {
      throw new Error('Erro ao atualizar perfil: ' + userError.message)
    }
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activeUserCount = users.filter(u => u.ativo).length

  // Resolve effective org info for display
  const effectiveOrg = isFartechAdmin
    ? (selectedOrgId === 'all' ? null : allOrgs.find(o => o.id === selectedOrgId) || null)
    : currentOrg

  const effectiveOrgName = isFartechAdmin
    ? (selectedOrgId === 'all' ? 'Todas as Organizacoes' : effectiveOrg?.name || '')
    : currentOrg?.name || ''

  const effectiveMaxUsers = effectiveOrg?.max_users ?? null
  const actionsBlockedReason = actionOrgId ? null : 'Selecione uma organizacao para gerenciar usuarios.'
  const currentUserId = authUser?.id || null

  const handleInviteSuccess = () => {
    setShowInviteModal(false)
    loadUsers()
  }

  return (
    <OrgAdminGuard>
      <div className="min-h-screen bg-surface-alt">
        {/* Header */}
        <div className="bg-white border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-text flex items-center">
                  <Users className="w-8 h-8 mr-3" />
                  Gerenciar Usuarios
                </h1>
                <p className="mt-1 text-sm text-text-muted">
                  {effectiveOrgName} — {activeUserCount}{effectiveMaxUsers !== null ? ` / ${effectiveMaxUsers}` : ''} usuarios
                </p>
              </div>

              <button
                onClick={() => setShowInviteModal(true)}
                disabled={!effectiveOrg || activeUserCount >= (effectiveMaxUsers || Infinity)}
                className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Convidar Usuario
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Org Selector (fartech admin only) */}
          {isFartechAdmin && (
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-text-muted" />
                <label className="text-sm font-medium text-text">Organizacao:</label>
                <select
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="flex-1 max-w-sm px-4 py-2 border border-border-strong rounded-lg bg-white text-text focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="all">Todas as organizacoes</option>
                  {allOrgs.map(org => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({org.max_users} usuarios)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Usage Info */}
          {effectiveMaxUsers !== null && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Usuarios ativos: {activeUserCount} / {effectiveMaxUsers}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    {effectiveMaxUsers - activeUserCount > 0
                      ? `${effectiveMaxUsers - activeUserCount} vagas disponiveis`
                      : 'Nenhuma vaga disponivel'}
                  </p>
                </div>

                {activeUserCount >= effectiveMaxUsers && (
                  <div className="text-sm text-blue-700">
                    Limite atingido - entre em contato para aumentar
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Search */}
          <div className="bg-white rounded-lg shadow mb-6 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-subtle" />
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border-strong rounded-lg bg-white text-text placeholder-gray-400 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-alt">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                      Funcao
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                      Cadastrado em
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                      Ultimo Acesso
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">
                      Acoes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-text-muted">
                        Carregando usuarios...
                      </td>
                    </tr>
                  ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => {
                      const isSelf = currentUserId === user.id
                      const disableActions = Boolean(actionsBlockedReason)

                      return (
                        <tr key={user.id} className={`hover:bg-surface-alt ${!user.ativo ? 'opacity-60' : ''}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
                                <span className="text-emerald-600 font-semibold">
                                  {(user.nome || user.email)[0].toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-text">
                                  {user.nome || 'Sem nome'}
                                </p>
                                <p className="text-sm text-text-muted">
                                  {user.email}
                                  {!user.ativo && (
                                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                                      Inativo
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <RoleBadge role={user.role} />
                          </td>
                          <td className="px-6 py-4 text-sm text-text-muted">
                            {new Date(user.created_at).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4 text-sm text-text-muted">
                            {user.last_sign_in_at
                              ? new Date(user.last_sign_in_at).toLocaleDateString('pt-BR')
                              : 'Nunca'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setEditingUser(user)}
                                disabled={disableActions}
                                className="p-2 text-text-muted hover:text-blue-600 hover:bg-surface-alt rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title={actionsBlockedReason || 'Editar'}
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setRemovingUser(user)}
                                disabled={disableActions || isSelf}
                                className="p-2 text-text-muted hover:text-red-600 hover:bg-surface-alt rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title={
                                  isSelf
                                    ? 'Voce nao pode remover a si mesmo'
                                    : actionsBlockedReason || 'Remover'
                                }
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-text-muted">
                        Nenhum usuario encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {showInviteModal && effectiveOrg && (
          <InviteUserModal
            orgId={effectiveOrg.id}
            orgName={effectiveOrg.name}
            onClose={() => setShowInviteModal(false)}
            onSuccess={handleInviteSuccess}
          />
        )}

        {editingUser && actionOrgId && (
          <EditUserModal
            user={editingUser}
            orgId={actionOrgId}
            onClose={() => setEditingUser(null)}
            onSaved={async ({ nome, role, ativo }) => {
              try {
                await updateUserData({
                  userId: editingUser.id,
                  orgId: actionOrgId,
                  nome,
                  role,
                  ativo,
                })
                toast.success('Usuario atualizado com sucesso.')
                setEditingUser(null)
                loadUsers()
              } catch (err) {
                const message = err instanceof Error ? err.message : 'Erro ao salvar usuario'
                toast.error(message)
              }
            }}
          />
        )}

        {removingUser && actionOrgId && (
          <RemoveUserModal
            user={removingUser}
            onClose={() => setRemovingUser(null)}
            onInactivate={async () => {
              try {
                await deactivateUser(removingUser, actionOrgId)
                toast.success('Usuario inativado (permanece no Auth).')
                setRemovingUser(null)
                loadUsers()
              } catch (err) {
                const message = err instanceof Error ? err.message : 'Erro ao inativar usuario'
                toast.error(message)
              }
            }}
            onDelete={async () => {
              try {
                const { data: sessionData } = await supabase.auth.getSession()
                const accessToken = sessionData.session?.access_token

                const { data, error } = await supabase.functions.invoke('delete-org-member', {
                  body: {
                    orgId: actionOrgId,
                    userId: removingUser.id,
                  },
                  headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
                })

                if (error) {
                  throw error
                }

                if (data?.error) {
                  throw new Error(String(data.error))
                }

                if (data?.warning) {
                  toast.warning(String(data.warning))
                } else {
                  toast.success('Usuario removido (Auth + banco).')
                }
                setRemovingUser(null)
                loadUsers()
              } catch (err) {
                const message = err instanceof Error ? err.message : 'Erro ao remover usuario'
                toast.error(message)
              }
            }}
            disableDelete={currentUserId === removingUser.id}
          />
        )}
      </div>
    </OrgAdminGuard>
  )
}

function InviteUserModal({
  orgId,
  orgName,
  onClose,
  onSuccess,
}: {
  orgId: string
  orgName: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [email, setEmail] = useState('')
  const [nome, setNome] = useState('')
  const [role, setRole] = useState<OrgMemberRole>('advogado')
  const [submitting, setSubmitting] = useState(false)

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedEmail = email.trim()
    const trimmedNome = nome.trim()

    if (!trimmedEmail) {
      toast.error('Informe o email do usuario.')
      return
    }

    if (!trimmedNome) {
      toast.error('Informe o nome do usuario.')
      return
    }

    setSubmitting(true)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token

      const { data: fnData, error: fnError } = await supabase.functions.invoke('invite-org-member', {
        body: {
          orgId,
          email: trimmedEmail,
          nome: trimmedNome,
          role,
        },
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      })

      if (fnError) {
        const detail = (fnError as any)?.context?.response?.text || fnError.message
        toast.error(`Erro ao convidar usuario: ${detail}`)
        setSubmitting(false)
        return
      }

      if (fnData?.error) {
        toast.error(String(fnData.error))
        setSubmitting(false)
        return
      }

      toast.success((fnData?.message as string) || `Usuario ${trimmedNome} convidado para ${orgName}.`)
      onSuccess()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro inesperado'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text">
            Convidar Usuario
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-text-subtle hover:text-text-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleInvite} className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@email.com"
                className="w-full pl-10 pr-4 py-2.5 border border-border-strong rounded-lg bg-white text-text placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text">
              Nome completo
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle" />
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome do usuario"
                className="w-full pl-10 pr-4 py-2.5 border border-border-strong rounded-lg bg-white text-text placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text">
              Funcao
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as OrgMemberRole)}
              className="w-full px-4 py-2.5 border border-border-strong rounded-lg bg-white text-text focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              {(Object.entries(ORG_ROLE_LABELS) as [OrgMemberRole, string][]).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2.5 border border-border-strong text-text rounded-lg hover:bg-surface-alt transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Enviando...' : 'Convidar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditUserModal({
  user,
  orgId,
  onClose,
  onSaved,
}: {
  user: OrgUser
  orgId: string
  onClose: () => void
  onSaved: (data: { nome: string; role: OrgMemberRole; ativo: boolean }) => Promise<void>
}) {
  const [nome, setNome] = useState(user.nome || '')
  const [role, setRole] = useState<OrgMemberRole>(user.role)
  const [ativo, setAtivo] = useState<boolean>(user.ativo)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) {
      toast.error('Informe o nome do usuario.')
      return
    }
    try {
      setSaving(true)
      await onSaved({ nome, role, ativo })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar usuario'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <p className="text-xs text-text-muted">Org: {orgId}</p>
            <h2 className="text-lg font-semibold text-text">Editar Usuario</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-text-subtle hover:text-text-muted rounded-lg transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text">Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-surface-alt text-text-muted"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text">Nome completo</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do usuario"
              className="w-full px-4 py-2.5 border border-border-strong rounded-lg bg-white text-text focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text">Funcao</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as OrgMemberRole)}
              className="w-full px-4 py-2.5 border border-border-strong rounded-lg bg-white text-text focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              {(Object.entries(ORG_ROLE_LABELS) as [OrgMemberRole, string][]).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-3 text-sm font-medium text-text">
            <input
              type="checkbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              className="h-4 w-4 text-emerald-600 border-border-strong rounded focus:ring-emerald-500"
            />
            Manter usuario ativo nesta organizacao
          </label>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-2.5 border border-border-strong text-text rounded-lg hover:bg-surface-alt transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function RemoveUserModal({
  user,
  onClose,
  onInactivate,
  onDelete,
  disableDelete,
}: {
  user: OrgUser
  onClose: () => void
  onInactivate: () => Promise<void>
  onDelete: () => Promise<void>
  disableDelete?: boolean
}) {
  const [confirming, setConfirming] = useState<'inactive' | 'delete' | null>(null)

  const handle = async (type: 'inactive' | 'delete') => {
    try {
      setConfirming(type)
      if (type === 'inactive') {
        await onInactivate()
      } else {
        await onDelete()
      }
    } finally {
      setConfirming(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text">Gerenciar usuario</h2>
          <button
            onClick={onClose}
            className="p-1 text-text-subtle hover:text-text-muted rounded-lg transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-text">
            <span className="font-semibold">{user.nome || user.email}</span>
          </p>
          <div className="space-y-2 text-sm text-text-muted">
            <p><strong>Inativar:</strong> remove acesso à organização (org_members.ativo=false, permissões reset), mas mantém o usuário no Auth.</p>
            <p><strong>Remover:</strong> apaga o usuário da organização, da tabela usuarios e do Auth.</p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              type="button"
              onClick={() => handle('inactive')}
              disabled={confirming !== null}
              className="w-full px-4 py-2.5 border border-border-strong text-text rounded-lg hover:bg-surface-alt transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {confirming === 'inactive' && <Loader2 className="w-4 h-4 animate-spin" />}
              {confirming === 'inactive' ? 'Inativando...' : 'Inativar (reversível)'}
            </button>
            <button
              type="button"
              onClick={() => handle('delete')}
              disabled={confirming !== null || disableDelete}
              className="w-full px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              title={disableDelete ? 'Voce nao pode remover a si mesmo' : 'Remover definitivamente'}
            >
              {confirming === 'delete' && <Loader2 className="w-4 h-4 animate-spin" />}
              {disableDelete ? 'Nao pode remover a si mesmo' : confirming === 'delete' ? 'Removendo...' : 'Remover definitivamente'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={confirming !== null}
              className="w-full px-4 py-2.5 border border-border text-text-muted rounded-lg hover:bg-surface-alt transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function RoleBadge({ role }: { role: OrgMemberRole }) {
  const roleConfig: Record<string, { label: string; class: string; icon: typeof Shield }> = {
    admin: {
      label: 'Administrador',
      class: 'bg-purple-100 text-purple-800',
      icon: Shield,
    },
    gestor: {
      label: 'Gestor',
      class: 'bg-blue-100 text-blue-800',
      icon: Shield,
    },
    advogado: {
      label: 'Advogado',
      class: 'bg-emerald-100 text-emerald-800',
      icon: Users,
    },
    secretaria: {
      label: 'Secretária',
      class: 'bg-amber-100 text-amber-800',
      icon: Users,
    },
    leitura: {
      label: 'Somente Leitura',
      class: 'bg-surface-alt text-text',
      icon: Users,
    },
  }

  const config = roleConfig[role] || roleConfig.leitura
  const Icon = config.icon

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </span>
  )
}
