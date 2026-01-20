// OrganizationForm - Create/Edit organization form
// Date: 2026-01-13

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, ArrowLeft } from 'lucide-react'
import { organizationsService } from '@/services/organizationsService'
import { supabase } from '@/lib/supabaseClient'
import { FartechGuard } from '@/components/guards'
import type { CreateOrganizationInput, OrganizationPlan } from '@/types/organization'

// Extended form data with optional branding fields
interface OrganizationFormData extends CreateOrganizationInput {
  max_cases?: number | null
  primary_color?: string
  secondary_color?: string | null
  address_street?: string
  address_number?: string
  address_complement?: string
  address_neighborhood?: string
  address_city?: string
  address_state?: string
  address_postal_code?: string
}

export default function OrganizationForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditMode = !!id
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<OrganizationFormData>({
    name: '',
    slug: '',
    cnpj: '',
    email: '',
    responsavel_email: '',
    admin_email: '',
    admin_name: '',
    plan: 'trial',
    max_users: 5,
    max_storage_gb: 10,
    max_cases: null,
    primary_color: 'var(--brand-primary-dark)',
    secondary_color: null,
    address_street: '',
    address_number: '',
    address_complement: '',
    address_neighborhood: '',
    address_city: '',
    address_state: '',
    address_postal_code: '',
  })
  
  useEffect(() => {
    if (isEditMode && id) {
      loadOrganization(id)
    }
  }, [id, isEditMode])
  
  const loadOrganization = async (orgId: string) => {
    try {
      setLoading(true)
      const org = await organizationsService.getById(orgId)
      if (org) {
        setFormData({
          name: org.name,
          slug: org.slug,
          cnpj: org.cnpj || '',
          email: org.email,
          phone: org.phone || '',
          responsavel_email:
            (org.settings && (org.settings as { responsavel_email?: string }).responsavel_email) ||
            '',
          admin_email:
            (org.settings && (org.settings as { admin_email?: string }).admin_email) || '',
          admin_name:
            (org.settings && (org.settings as { admin_name?: string }).admin_name) || '',
          plan: org.plan,
          max_users: org.max_users,
          max_storage_gb: org.max_storage_gb,
          max_cases: org.max_cases,
          primary_color: org.primary_color,
          secondary_color: org.secondary_color,
          address: org.address || undefined,
          address_street: org.address?.street || '',
          address_number: org.address?.number || '',
          address_complement: org.address?.complement || '',
          address_neighborhood: org.address?.neighborhood || '',
          address_city: org.address?.city || '',
          address_state: org.address?.state || '',
          address_postal_code: org.address?.zip_code || '',
        })
      }
    } catch (err) {
      setError('Erro ao carregar organização')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
  
  const handlePlanChange = (plan: OrganizationPlan) => {
    // Set default limits based on plan
    const limits = {
      trial: { max_users: 3, max_storage_gb: 5 },
      basic: { max_users: 5, max_storage_gb: 10 },
      professional: { max_users: 20, max_storage_gb: 50 },
      enterprise: { max_users: 100, max_storage_gb: 500 },
    }
    
    setFormData(prev => ({
      ...prev,
      plan,
      ...limits[plan],
    }))
  }

  const planOptions: Array<{ value: OrganizationPlan; label: string }> = [
    { value: 'trial', label: 'Trial' },
    { value: 'basic', label: 'Basico' },
    { value: 'professional', label: 'Professional' },
    { value: 'enterprise', label: 'Enterprise' },
  ]
  
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
  
  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: isEditMode ? prev.slug : generateSlug(name),
    }))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      setError(null)
      
      if (isEditMode && id) {
        await organizationsService.update(id, formData)
        navigate('/admin/organizations', { state: { refresh: true } })
        return
      }

      const created = await organizationsService.create(formData)

      if (formData.admin_email) {
        const { data: sessionData } = await supabase.auth.getSession()
        let accessToken = sessionData.session?.access_token

        if (!accessToken) {
          const { data: refreshed } = await supabase.auth.refreshSession()
          accessToken = refreshed.session?.access_token
        }

        if (!accessToken) {
          setError('Sessão expirada. Faça login novamente para convidar o admin.')
          return
        }

        const { error: inviteError } = await supabase.functions.invoke('invite-org-admin', {
          body: {
            orgId: created.id,
            adminEmail: formData.admin_email,
            adminName: formData.admin_name,
            responsavelEmail: formData.responsavel_email,
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        })

        if (inviteError) {
          setError(`Organização criada, mas falhou ao convidar o admin: ${inviteError.message}`)
          return
        }
      }

      navigate('/admin/organizations', { state: { refresh: true } })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar organização'
      setError(message)
      console.error(err)
    } finally {
      setSaving(false)
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Carregando...</div>
      </div>
    )
  }
  
  return (
    <FartechGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => navigate('/admin/organizations')}
                  className="mr-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {isEditMode ? 'Editar Organização' : 'Nova Organização'}
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    {isEditMode ? 'Atualize as informações da organização' : 'Crie uma nova organização no sistema'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Informações Básicas
                </h2>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome da Organização *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500"
                      placeholder="Ex: Silva & Associados"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Slug (URL) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500"
                      placeholder="silva-associados"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Usado na URL: {formData.slug || 'slug'}.fartech.com.br
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    value={formData.cnpj}
                    onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500"
                    placeholder="00.000.000/0000-00"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email do Responsável
                    </label>
                    <input
                      type="email"
                      value={formData.responsavel_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, responsavel_email: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500"
                      placeholder="responsavel@escritorio.com.br"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email do Admin da Organização
                    </label>
                    <input
                      type="email"
                      required={!isEditMode}
                      value={formData.admin_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, admin_email: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500"
                      placeholder="admin@escritorio.com.br"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Esse admin receberá o email para cadastrar usuários do escritório.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Admin (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.admin_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, admin_name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500"
                    placeholder="Nome completo"
                  />
                </div>
              </div>
            </div>
            
            {/* Plan and Limits */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Plano e Limites
                </h2>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plano *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {planOptions.map((plan) => (
                      <button
                        key={plan.value}
                        type="button"
                        onClick={() => handlePlanChange(plan.value)}
                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                          formData.plan === plan.value
                            ? 'border-emerald-600 bg-emerald-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <p className="font-semibold text-gray-900 capitalize">
                          {plan.label}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Máximo de Usuários *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.max_users}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_users: parseInt(e.target.value) }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Armazenamento (GB) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.max_storage_gb}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_storage_gb: parseInt(e.target.value) }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Máximo de Casos
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.max_cases || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_cases: e.target.value ? parseInt(e.target.value) : null }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500"
                      placeholder="Ilimitado"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Branding */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Identidade Visual
                </h2>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-brand-primary"
                        placeholder="var(--brand-primary)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Address */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Endereço
                </h2>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Logradouro
                    </label>
                    <input
                      type="text"
                      value={formData.address_street}
                      onChange={(e) => setFormData(prev => ({ ...prev, address_street: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500"
                      placeholder="Rua, Avenida, etc."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número
                    </label>
                    <input
                      type="text"
                      value={formData.address_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, address_number: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Complemento
                    </label>
                    <input
                      type="text"
                      value={formData.address_complement}
                      onChange={(e) => setFormData(prev => ({ ...prev, address_complement: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bairro
                    </label>
                    <input
                      type="text"
                      value={formData.address_neighborhood}
                      onChange={(e) => setFormData(prev => ({ ...prev, address_neighborhood: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cidade
                    </label>
                    <input
                      type="text"
                      value={formData.address_city}
                      onChange={(e) => setFormData(prev => ({ ...prev, address_city: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado
                    </label>
                    <input
                      type="text"
                      value={formData.address_state}
                      onChange={(e) => setFormData(prev => ({ ...prev, address_state: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500"
                      maxLength={2}
                      placeholder="SP"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CEP
                    </label>
                    <input
                      type="text"
                      value={formData.address_postal_code}
                      onChange={(e) => setFormData(prev => ({ ...prev, address_postal_code: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500"
                      placeholder="00000-000"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate('/admin/organizations')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Salvando...' : isEditMode ? 'Atualizar' : 'Criar Organização'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </FartechGuard>
  )
}
