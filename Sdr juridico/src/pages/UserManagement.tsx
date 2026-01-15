// UserManagement - Manage organization users (Org Admin+)
// Date: 2026-01-13

import { useState, useEffect } from 'react'
import { Users, Plus, Edit, Trash2, Shield, Mail, Search, UserPlus } from 'lucide-react'
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
        .select('id, email, nome_completo, permissoes, created_at, ultimo_acesso')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      const mapped = (data || []).map((row) => {
        const permissoes = row.permissoes || []
        const role: UserRole = permissoes.includes('fartech_admin')
          ? 'fartech_admin'
          : permissoes.includes('org_admin')
            ? 'org_admin'
            : 'user'

        return {
          id: row.id,
          email: row.email,
          nome: row.nome_completo,
          role,
          created_at: row.created_at,
          last_sign_in_at: row.ultimo_acesso,
        } as OrgUser
      })
      setUsers(mapped)
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  return (
    <OrgAdminGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                  <Users className="w-8 h-8 mr-3" />
                  Gerenciar Usuários
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {currentOrg?.name} • {filteredUsers.length} usuários
                </p>
              </div>
              
              <button
                onClick={() => setShowInviteModal(true)}
                className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Convidar Usuário
              </button>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Usage Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Usuários: {users.length} / {currentOrg?.max_users}
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  {currentOrg && currentOrg.max_users - users.length} vagas disponíveis
                </p>
              </div>
              
              {users.length >= (currentOrg?.max_users || 0) && (
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  Limite atingido - entre em contato para aumentar
                </div>
              )}
            </div>
          </div>
          
          {/* Search */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          
          {/* Users Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Função
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Cadastrado em
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Último Acesso
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        Carregando usuários...
                      </td>
                    </tr>
                  ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mr-3">
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                {(user.nome || user.email)[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {user.nome || 'Sem nome'}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <RoleBadge role={user.role} />
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {new Date(user.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {user.last_sign_in_at 
                            ? new Date(user.last_sign_in_at).toLocaleDateString('pt-BR')
                            : 'Nunca'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        Nenhum usuário encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Invite Modal - Placeholder */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Convidar Usuário
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Funcionalidade em desenvolvimento
              </p>
              <button
                onClick={() => setShowInviteModal(false)}
                className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </OrgAdminGuard>
  )
}

function RoleBadge({ role }: { role: UserRole }) {
  const roleConfig = {
    fartech_admin: { 
      label: 'Fartech Admin', 
      class: 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300',
      icon: Shield 
    },
    org_admin: { 
      label: 'Administrador', 
      class: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300',
      icon: Shield 
    },
    user: { 
      label: 'Usuário', 
      class: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
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
