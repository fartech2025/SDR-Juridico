// UserManagement - Manage organization users (Org Admin+)
// Date: 2026-01-13

import { useState, useEffect } from 'react'
import { Users, Edit, Trash2, Shield, Search, UserPlus, X, Mail, User as UserIcon } from 'lucide-react'
import { toast } from 'sonner'
import { OrgAdminGuard } from '@/components/guards'
import { useOrganization } from '@/hooks/useOrganization'
import { supabase } from '@/lib/supabaseClient'
import type { UserRole } from '@/types/permissions'

interface OrgUser {
  id: string
  email: string
  nome: string | null
  role: UserRole
  created_at: string
  last_sign_in_at: string | null
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
  const [users, setUsers] = useState<OrgUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [currentOrg])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, email, nome_completo, permissoes, created_at, updated_at')
        .order('created_at', { ascending: false })

      if (error) throw error
      const mapped = (data || []).map((row) => {
        const permissoes = row.permissoes || []
        const role: UserRole = permissoes.includes('fartech_admin')
          ? 'fartech_admin'
          : permissoes.includes('gestor') || permissoes.includes('org_admin')
            ? 'org_admin'
            : 'user'

        return {
          id: row.id,
          email: row.email,
          nome: row.nome_completo,
          role,
          created_at: row.created_at,
          last_sign_in_at: row.updated_at,
        } as OrgUser
      })
      setUsers(mapped)
    } catch (error) {
      console.error('Erro ao carregar usuarios:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleInviteSuccess = () => {
    setShowInviteModal(false)
    loadUsers()
  }

  return (
    <OrgAdminGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <Users className="w-8 h-8 mr-3" />
                  Gerenciar Usuarios
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  {currentOrg?.name} - {filteredUsers.length} usuarios
                </p>
              </div>

              <button
                onClick={() => setShowInviteModal(true)}
                disabled={users.length >= (currentOrg?.max_users || Infinity)}
                className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Convidar Usuario
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Usage Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Usuarios: {users.length} / {currentOrg?.max_users}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  {currentOrg && currentOrg.max_users - users.length} vagas disponiveis
                </p>
              </div>

              {users.length >= (currentOrg?.max_users || 0) && (
                <div className="text-sm text-blue-700">
                  Limite atingido - entre em contato para aumentar
                </div>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="bg-white rounded-lg shadow mb-6 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Funcao
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cadastrado em
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ultimo Acesso
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acoes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        Carregando usuarios...
                      </td>
                    </tr>
                  ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-emerald-600 font-semibold">
                                {(user.nome || user.email)[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {user.nome || 'Sem nome'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <RoleBadge role={user.role} />
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {user.last_sign_in_at
                            ? new Date(user.last_sign_in_at).toLocaleDateString('pt-BR')
                            : 'Nunca'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Remover"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        Nenhum usuario encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {showInviteModal && currentOrg && (
          <InviteUserModal
            orgId={currentOrg.id}
            orgName={currentOrg.name}
            onClose={() => setShowInviteModal(false)}
            onSuccess={handleInviteSuccess}
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
      const { data, error: fnError } = await supabase.functions.invoke('invite-org-member', {
        body: {
          orgId,
          email: trimmedEmail,
          nome: trimmedNome,
          role,
        },
      })

      if (fnError) {
        toast.error('Erro ao convidar usuario: ' + fnError.message)
        setSubmitting(false)
        return
      }

      if (data?.error) {
        toast.error(data.error)
        setSubmitting(false)
        return
      }

      toast.success(data?.message || `Usuario ${trimmedNome} convidado para ${orgName}.`)
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Convidar Usuario
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleInvite} className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@email.com"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Nome completo
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome do usuario"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Funcao
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as OrgMemberRole)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
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

function RoleBadge({ role }: { role: UserRole }) {
  const roleConfig = {
    fartech_admin: {
      label: 'Fartech Admin',
      class: 'bg-purple-100 text-purple-800',
      icon: Shield
    },
    org_admin: {
      label: 'Administrador',
      class: 'bg-blue-100 text-blue-800',
      icon: Shield
    },
    user: {
      label: 'Usuario',
      class: 'bg-gray-100 text-gray-800',
      icon: Users
    },
  }

  const config = roleConfig[role]
  const Icon = config.icon

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </span>
  )
}
