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
    primary_color: 'var(--brand-primary)',
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

      // 1. Criar a organização
      let created
      try {
        created = await organizationsService.create(formData)
      } catch (createErr) {
        const msg = createErr instanceof Error ? createErr.message : 'Erro desconhecido'
        setError(`Erro ao criar organização: ${msg}`)
        console.error('Falha ao criar org:', createErr)
        return
      }

      if (!created?.id) {
        setError('Organização criada mas sem ID retornado. Verifique no painel.')
        return
      }

      // 2. Convidar o admin (responsável)
      const adminEmail = formData.admin_email || formData.responsavel_email
      if (adminEmail) {
        const { data: sessionData } = await supabase.auth.getSession()
        let accessToken = sessionData.session?.access_token

        if (!accessToken) {
          const { data: refreshed } = await supabase.auth.refreshSession()
          accessToken = refreshed.session?.access_token
        }

        if (!accessToken) {
          setError(`Organização "${created.name}" criada com sucesso! Porém a sessão expirou antes de enviar o convite ao admin. Faça login novamente e reenvie.`)
          return
        }

        try {
          const response = await supabase.functions.invoke('invite-org-admin', {
            body: {
              orgId: created.id,
              adminEmail: adminEmail,
              adminName: formData.admin_name || adminEmail,
              responsavelEmail: formData.responsavel_email,
            },
            headers: {
              Authorization: `Bearer ${accessToken}`,
              apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
          })

          const inviteData = response.data
          const inviteError = response.error

          if (inviteError) {
            // Try to extract the real error message from the response body
            let detail = inviteError.message
            try {
              if (inviteError.context && typeof inviteError.context.json === 'function') {
                const body = await inviteError.context.json()
                detail = body?.error || detail
              }
            } catch { /* ignore parse error */ }
            console.error('Erro no convite:', detail)
            setError(`Organização "${created.name}" criada! Mas falhou ao convidar o admin (${adminEmail}): ${detail}. Você pode reenviar o convite depois.`)
            return
          }

          if (inviteData && inviteData.error) {
            console.error('Edge function retornou erro:', inviteData.error)
            setError(`Organização "${created.name}" criada! Mas o convite falhou: ${inviteData.error}. Verifique se a edge function está deployada.`)
            return
          }
        } catch (fnErr) {
          console.error('Exceção ao chamar edge function:', fnErr)
          // Org was created successfully — don't block navigation
          console.warn('Convite falhou mas org foi criada. Prosseguindo...')
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
      <div className="min-h-screen bg-surface-alt flex items-center justify-center">
        <div className="text-text-muted">Carregando...</div>
      </div>
    )
  }
  
  return (
    <FartechGuard>
      <div className="min-h-screen bg-surface-alt">
        {/* Header */}
        <div className="bg-white border-b border-border">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => navigate('/admin/organizations')}
                  className="mr-4 p-2 text-text-muted hover:bg-surface-alt rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-text">
                    {isEditMode ? 'Editar Organização' : 'Nova Organização'}
                  </h1>
                  <p className="mt-1 text-sm text-text-muted">
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
              <div className="p-6 border-b border-border">
                <h2 className="text-lg font-semibold text-text">
                  Informações Básicas
                </h2>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Nome da Organização *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full px-4 py-2 border border-border-strong rounded-lg bg-white text-text focus:ring-2 focus:ring-brand-primary"
                      placeholder="Ex: Silva & Associados"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Slug (URL) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      className="w-full px-4 py-2 border border-border-strong rounded-lg bg-white text-text focus:ring-2 focus:ring-brand-primary"
                      placeholder="silva-associados"
                    />
                    <p className="mt-1 text-xs text-text-muted">
                      Usado na URL: {formData.slug || 'slug'}.fartech.com.br
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    value={formData.cnpj}
                    onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
                    className="w-full px-4 py-2 border border-border-strong rounded-lg bg-white text-text focus:ring-2 focus:ring-brand-primary"
                    placeholder="00.000.000/0000-00"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Email do Responsável *
                    </label>
                    <input
                      type="email"
                      required={!isEditMode}
                      value={formData.responsavel_email}
                      onChange={(e) => {
                        const email = e.target.value
                        setFormData(prev => ({
                          ...prev,
                          responsavel_email: email,
                          admin_email: email,
                        }))
                      }}
                      className="w-full px-4 py-2 border border-border-strong rounded-lg bg-white text-text focus:ring-2 focus:ring-brand-primary"
                      placeholder="responsavel@escritorio.com.br"
                    />
                    <p className="mt-1 text-xs text-brand-primary font-medium">
                      Este e-mail se tornará o administrador da organização e receberá o convite de acesso.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Email do Admin (auto-preenchido)
                    </label>
                    <input
                      type="email"
                      required={!isEditMode}
                      value={formData.admin_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, admin_email: e.target.value }))}
                      className="w-full px-4 py-2 border border-border-strong rounded-lg bg-surface-alt text-text focus:ring-2 focus:ring-brand-primary"
                      placeholder="admin@escritorio.com.br"
                    />
                    <p className="mt-1 text-xs text-text-muted">
                      Preenchido automaticamente. Altere apenas se o admin for diferente do responsável.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Nome do Admin (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.admin_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, admin_name: e.target.value }))}
                    className="w-full px-4 py-2 border border-border-strong rounded-lg bg-white text-text focus:ring-2 focus:ring-brand-primary"
                    placeholder="Nome completo"
                  />
                </div>
              </div>
            </div>
            
            {/* Plan and Limits */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-6 border-b border-border">
                <h2 className="text-lg font-semibold text-text">
                  Plano e Limites
                </h2>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
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
                            ? 'border-brand-primary bg-brand-primary-subtle'
                            : 'border-border-strong hover:border-border-strong'
                        }`}
                      >
                        <p className="font-semibold text-text capitalize">
                          {plan.label}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Máximo de Usuários *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.max_users}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_users: parseInt(e.target.value) }))}
                      className="w-full px-4 py-2 border border-border-strong rounded-lg bg-white text-text focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Armazenamento (GB) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.max_storage_gb}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_storage_gb: parseInt(e.target.value) }))}
                      className="w-full px-4 py-2 border border-border-strong rounded-lg bg-white text-text focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Máximo de Casos
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.max_cases || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_cases: e.target.value ? parseInt(e.target.value) : null }))}
                      className="w-full px-4 py-2 border border-border-strong rounded-lg bg-white text-text focus:ring-2 focus:ring-brand-primary"
                      placeholder="Ilimitado"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Branding */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-6 border-b border-border">
                <h2 className="text-lg font-semibold text-text">
                  Identidade Visual
                </h2>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
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
                        className="flex-1 px-4 py-2 border border-border-strong rounded-lg bg-white text-text focus:ring-2 focus:ring-brand-primary"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
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
                        className="flex-1 px-4 py-2 border border-border-strong rounded-lg bg-white text-text focus:ring-2 focus:ring-brand-primary"
                        placeholder="var(--brand-primary)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Address */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-6 border-b border-border">
                <h2 className="text-lg font-semibold text-text">
                  Endereço
                </h2>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-text mb-2">
                      Logradouro
                    </label>
                    <input
                      type="text"
                      value={formData.address_street}
                      onChange={(e) => setFormData(prev => ({ ...prev, address_street: e.target.value }))}
                      className="w-full px-4 py-2 border border-border-strong rounded-lg bg-white text-text focus:ring-2 focus:ring-brand-primary"
                      placeholder="Rua, Avenida, etc."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Número
                    </label>
                    <input
                      type="text"
                      value={formData.address_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, address_number: e.target.value }))}
                      className="w-full px-4 py-2 border border-border-strong rounded-lg bg-white text-text focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Complemento
                    </label>
                    <input
                      type="text"
                      value={formData.address_complement}
                      onChange={(e) => setFormData(prev => ({ ...prev, address_complement: e.target.value }))}
                      className="w-full px-4 py-2 border border-border-strong rounded-lg bg-white text-text focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Bairro
                    </label>
                    <input
                      type="text"
                      value={formData.address_neighborhood}
                      onChange={(e) => setFormData(prev => ({ ...prev, address_neighborhood: e.target.value }))}
                      className="w-full px-4 py-2 border border-border-strong rounded-lg bg-white text-text focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Cidade
                    </label>
                    <input
                      type="text"
                      value={formData.address_city}
                      onChange={(e) => setFormData(prev => ({ ...prev, address_city: e.target.value }))}
                      className="w-full px-4 py-2 border border-border-strong rounded-lg bg-white text-text focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Estado
                    </label>
                    <input
                      type="text"
                      value={formData.address_state}
                      onChange={(e) => setFormData(prev => ({ ...prev, address_state: e.target.value }))}
                      className="w-full px-4 py-2 border border-border-strong rounded-lg bg-white text-text focus:ring-2 focus:ring-brand-primary"
                      maxLength={2}
                      placeholder="SP"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      CEP
                    </label>
                    <input
                      type="text"
                      value={formData.address_postal_code}
                      onChange={(e) => setFormData(prev => ({ ...prev, address_postal_code: e.target.value }))}
                      className="w-full px-4 py-2 border border-border-strong rounded-lg bg-white text-text focus:ring-2 focus:ring-brand-primary"
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
                className="px-6 py-2 border border-border-strong text-text rounded-lg hover:bg-surface-alt transition-colors"
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
