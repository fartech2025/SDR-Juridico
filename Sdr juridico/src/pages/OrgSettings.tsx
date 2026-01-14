// OrgSettings - Organization settings (Org Admin+)
// Date: 2026-01-13

import { useState, useEffect } from 'react'
import { Save, Building2, Palette, MapPin, Settings } from 'lucide-react'
import { OrgAdminGuard } from '@/components/guards'
import { useOrganization } from '@/hooks/useOrganization'
import { organizationsService } from '@/services/organizationsService'
import type { UpdateOrganizationInput } from '@/types/organization'

export default function OrgSettings() {
  const { currentOrg, refreshOrg } = useOrganization()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const [formData, setFormData] = useState<UpdateOrganizationInput>({
    name: '',
    primary_color: 'var(--brand-primary-dark)',
    address_street: '',
    address_number: '',
    address_complement: '',
    address_neighborhood: '',
    address_city: '',
    address_state: '',
    address_postal_code: '',
  })
  
  useEffect(() => {
    if (currentOrg) {
      setFormData({
        name: currentOrg.name,
        primary_color: currentOrg.primary_color,
        secondary_color: currentOrg.secondary_color,
        address_street: currentOrg.address_street || '',
        address_number: currentOrg.address_number || '',
        address_complement: currentOrg.address_complement || '',
        address_neighborhood: currentOrg.address_neighborhood || '',
        address_city: currentOrg.address_city || '',
        address_state: currentOrg.address_state || '',
        address_postal_code: currentOrg.address_postal_code || '',
      })
    }
  }, [currentOrg])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentOrg) return
    
    try {
      setSaving(true)
      setMessage(null)
      
      await organizationsService.update(currentOrg.id, formData)
      await refreshOrg()
      
      setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar configurações'
      setMessage({ type: 'error', text: errorMessage })
      console.error(error)
    } finally {
      setSaving(false)
    }
  }
  
  if (!currentOrg) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Carregando...</div>
      </div>
    )
  }
  
  return (
    <OrgAdminGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center">
              <Settings className="w-8 h-8 mr-3 text-gray-600 dark:text-gray-400" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Configurações da Organização
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Gerencie as informações da sua organização
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {message && (
            <div className={`mb-6 rounded-lg p-4 ${
              message.type === 'success' 
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
            }`}>
              {message.text}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            {/* Plan Info (Read-only) */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  Informações do Plano
                </h2>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Plano Atual</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                      {currentOrg.plan}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Status</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                      {currentOrg.status === 'active' ? 'Ativo' : currentOrg.status}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Limite de Usuários</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {currentOrg.max_users}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    Para alterar seu plano ou limites, entre em contato com o suporte Fartech.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Basic Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  Informações Básicas
                </h2>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome da Organização *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Slug (URL)
                  </label>
                  <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400">
                    {currentOrg.slug}.fartech.com.br
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Entre em contato com o suporte para alterar o slug
                  </p>
                </div>
              </div>
            </div>
            
            {/* Branding */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Palette className="w-5 h-5 mr-2" />
                  Identidade Visual
                </h2>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cor Primária *
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.primary_color}
                        onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                        className="w-20 h-10 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.primary_color}
                        onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cor Secundária
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.secondary_color || 'var(--brand-primary)'}
                        onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
                        className="w-20 h-10 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.secondary_color || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-primary"
                        placeholder="var(--brand-primary)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Address */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Endereço
                </h2>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Logradouro
                    </label>
                    <input
                      type="text"
                      value={formData.address_street}
                      onChange={(e) => setFormData(prev => ({ ...prev, address_street: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                      placeholder="Rua, Avenida, etc."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Número
                    </label>
                    <input
                      type="text"
                      value={formData.address_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, address_number: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Complemento
                    </label>
                    <input
                      type="text"
                      value={formData.address_complement}
                      onChange={(e) => setFormData(prev => ({ ...prev, address_complement: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Bairro
                    </label>
                    <input
                      type="text"
                      value={formData.address_neighborhood}
                      onChange={(e) => setFormData(prev => ({ ...prev, address_neighborhood: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cidade
                    </label>
                    <input
                      type="text"
                      value={formData.address_city}
                      onChange={(e) => setFormData(prev => ({ ...prev, address_city: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Estado
                    </label>
                    <input
                      type="text"
                      value={formData.address_state}
                      onChange={(e) => setFormData(prev => ({ ...prev, address_state: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                      maxLength={2}
                      placeholder="SP"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      CEP
                    </label>
                    <input
                      type="text"
                      value={formData.address_postal_code}
                      onChange={(e) => setFormData(prev => ({ ...prev, address_postal_code: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                      placeholder="00000-000"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Configurações'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </OrgAdminGuard>
  )
}
