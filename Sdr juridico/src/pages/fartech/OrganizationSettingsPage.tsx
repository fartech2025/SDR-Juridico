// OrganizationSettingsPage - Complete organization settings with API/Integrations
// Date: 2026-01-13

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  ArrowLeft,
  Save,
  Building2,
  MapPin,
  Key,
  Globe,
  Database,
  Cloud,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Activity,
  MousePointer,
  Users as UsersIcon,
  TrendingUp,
  BarChart3
} from 'lucide-react'
import { FartechGuard } from '@/components/guards'
import { organizationsService } from '@/services/organizationsService'
import type { Organization } from '@/types/organization'

interface APIConfig {
  id: string
  name: string
  enabled: boolean
  apiKey?: string
  apiUrl?: string
  additionalConfig?: Record<string, any>
}

interface IntegrationConfig {
  id: string
  name: string
  type: 'calendar' | 'email' | 'storage' | 'payment' | 'crm' | 'other'
  enabled: boolean
  credentials?: Record<string, any>
}

export default function OrganizationSettingsPage() {
  const { id } = useParams<{ id: string }>()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // Form sections
  const [activeTab, setActiveTab] = useState<'basic' | 'address' | 'apis' | 'integrations' | 'monitoring'>('basic')
  
  // Basic Info
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [primaryColor, setPrimaryColor] = useState('var(--brand-primary)')
  const [secondaryColor, setSecondaryColor] = useState('var(--brand-primary-dark)')
  
  // Address
  const [addressStreet, setAddressStreet] = useState('')
  const [addressNumber, setAddressNumber] = useState('')
  const [addressComplement, setAddressComplement] = useState('')
  const [addressNeighborhood, setAddressNeighborhood] = useState('')
  const [addressCity, setAddressCity] = useState('')
  const [addressState, setAddressState] = useState('')
  const [addressPostalCode, setAddressPostalCode] = useState('')
  
  // APIs & Integrations
  const [apis, setApis] = useState<APIConfig[]>([])
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([])
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({})
  
  // Monitoring - Mock data (em produção viria de analytics real)
  const [onlineUsers, setOnlineUsers] = useState(0)
  const [totalClicks24h, setTotalClicks24h] = useState(0)
  const [peakConcurrentUsers, setPeakConcurrentUsers] = useState(0)
  
  // Simular dados de monitoramento
  useEffect(() => {
    const updateMonitoringData = () => {
      // Simular usuários online (0-10)
      setOnlineUsers(Math.floor(Math.random() * 11))
      // Simular cliques nas últimas 24h (100-1000)
      setTotalClicks24h(Math.floor(Math.random() * 900) + 100)
      // Simular pico de usuários simultâneos
      setPeakConcurrentUsers(Math.floor(Math.random() * 15) + 5)
    }
    
    updateMonitoringData()
    const interval = setInterval(updateMonitoringData, 5000) // Atualiza a cada 5s
    
    return () => clearInterval(interval)
  }, [])
  
  useEffect(() => {
    if (id) {
      loadOrganization(id)
    }
  }, [id])
  
  const loadOrganization = async (orgId: string) => {
    try {
      setLoading(true)
      const org = await organizationsService.getById(orgId)
      
      if (!org) {
        setMessage({ type: 'error', text: 'Organização não encontrada' })
        return
      }
      
      setOrganization(org)
      
      // Basic info
      setName(org.name || '')
      setSlug(org.slug || '')
      setCnpj(org.cnpj || '')
      setPrimaryColor(org.primary_color || 'var(--brand-primary)')
      setSecondaryColor(org.secondary_color || 'var(--brand-primary-dark)')
      
      // Address
      setAddressStreet(org.address_street || '')
      setAddressNumber(org.address_number || '')
      setAddressComplement(org.address_complement || '')
      setAddressNeighborhood(org.address_neighborhood || '')
      setAddressCity(org.address_city || '')
      setAddressState(org.address_state || '')
      setAddressPostalCode(org.address_postal_code || '')
      
      // APIs & Integrations from settings JSON
      const settings = org.settings || {}
      const rawApis = Array.isArray(settings.apis) ? settings.apis : []
      const rawIntegrations = Array.isArray(settings.integrations) ? settings.integrations : []

      const nextApis: APIConfig[] = rawApis.map((api, idx) => ({
        id: api.id ?? `api-${idx}`,
        name: api.name ?? 'API',
        enabled: Boolean(api.enabled),
        apiKey: api.apiKey ?? '',
        apiUrl: api.apiUrl ?? '',
        additionalConfig: api.additionalConfig ?? api.additional_config ?? {},
      }))

      const nextIntegrations: IntegrationConfig[] = rawIntegrations.map((integration, idx) => ({
        id: integration.id ?? `integration-${idx}`,
        name: integration.name ?? 'Integracao',
        type: integration.type ?? 'other',
        enabled: Boolean(integration.enabled),
        credentials: integration.credentials ?? {},
      }))

      setApis(nextApis)
      setIntegrations(nextIntegrations)
      
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: 'Erro ao carregar organização' })
    } finally {
      setLoading(false)
    }
  }
  
  const handleSave = async () => {
    if (!organization) return
    
    try {
      setSaving(true)
      setMessage(null)
      
      // Build settings object with APIs and integrations
      const settings = {
        ...organization.settings,
        apis,
        integrations
      }
      
      await organizationsService.update(organization.id, {
        name,
        slug,
        cnpj,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        address_street: addressStreet,
        address_number: addressNumber,
        address_complement: addressComplement,
        address_neighborhood: addressNeighborhood,
        address_city: addressCity,
        address_state: addressState,
        address_postal_code: addressPostalCode,
        settings
      })
      
      setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' })
      
      // Reload to get updated data
      setTimeout(() => loadOrganization(organization.id), 1000)
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: 'Erro ao salvar configurações' })
    } finally {
      setSaving(false)
    }
  }
  
  const addAPI = () => {
    const newAPI: APIConfig = {
      id: `api-${Date.now()}`,
      name: 'Nova API',
      enabled: false,
      apiKey: '',
      apiUrl: ''
    }
    setApis([...apis, newAPI])
  }
  
  const updateAPI = (id: string, updates: Partial<APIConfig>) => {
    setApis(apis.map(api => api.id === id ? { ...api, ...updates } : api))
  }
  
  const removeAPI = (id: string) => {
    setApis(apis.filter(api => api.id !== id))
  }
  
  const addIntegration = () => {
    const newIntegration: IntegrationConfig = {
      id: `integration-${Date.now()}`,
      name: 'Nova Integração',
      type: 'other',
      enabled: false,
      credentials: {}
    }
    setIntegrations([...integrations, newIntegration])
  }
  
  const updateIntegration = (id: string, updates: Partial<IntegrationConfig>) => {
    setIntegrations(integrations.map(int => int.id === id ? { ...int, ...updates } : int))
  }
  
  const removeIntegration = (id: string) => {
    setIntegrations(integrations.filter(int => int.id !== id))
  }
  
  const toggleShowApiKey = (id: string) => {
    setShowApiKeys({ ...showApiKeys, [id]: !showApiKeys[id] })
  }
  
  if (loading) {
    return (
      <FartechGuard>
        <div className="min-h-screen bg-[#f7f8fc] dark:bg-gray-900 flex items-center justify-center">
          <div className="text-gray-600 dark:text-gray-400">Carregando...</div>
        </div>
      </FartechGuard>
    )
  }
  
  if (!organization) {
    return (
      <FartechGuard>
        <div className="min-h-screen bg-[#f7f8fc] dark:bg-gray-900 flex items-center justify-center">
          <div className="text-red-600 dark:text-red-400">Organização não encontrada</div>
        </div>
      </FartechGuard>
    )
  }
  
  return (
    <FartechGuard>
      <div className="min-h-screen bg-[#f7f8fc] dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Link
                  to="/admin/organizations"
                  className="mr-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Configurações - {organization.name}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    APIs, Integrações e Configurações da Organização
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Message */}
        {message && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
            <div className={`p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
            }`}>
              {message.text}
            </div>
          </div>
        )}
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('basic')}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'basic'
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  Informações Básicas
                </button>
                <button
                  onClick={() => setActiveTab('address')}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'address'
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  Endereço
                </button>
                <button
                  onClick={() => setActiveTab('monitoring')}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'monitoring'
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  Monitoramento
                </button>
                <button
                  onClick={() => setActiveTab('apis')}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'apis'
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Key className="w-4 h-4" />
                  APIs ({apis.length})
                </button>
                <button
                  onClick={() => setActiveTab('integrations')}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'integrations'
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  Integrações ({integrations.length})
                </button>
              </nav>
            </div>
            
            <div className="p-6">
              {/* Basic Info Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nome da Organização *
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Slug (URL amigável)
                      </label>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        CNPJ
                      </label>
                      <input
                        type="text"
                        value={cnpj}
                        onChange={(e) => setCnpj(e.target.value)}
                        placeholder="00.000.000/0000-00"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Cor Primária
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600"
                        />
                        <input
                          type="text"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600"
                        />
                        <input
                          type="text"
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Address Tab */}
              {activeTab === 'address' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Logradouro
                      </label>
                      <input
                        type="text"
                        value={addressStreet}
                        onChange={(e) => setAddressStreet(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Número
                      </label>
                      <input
                        type="text"
                        value={addressNumber}
                        onChange={(e) => setAddressNumber(e.target.value)}
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
                        value={addressComplement}
                        onChange={(e) => setAddressComplement(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Bairro
                      </label>
                      <input
                        type="text"
                        value={addressNeighborhood}
                        onChange={(e) => setAddressNeighborhood(e.target.value)}
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
                        value={addressCity}
                        onChange={(e) => setAddressCity(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Estado
                      </label>
                      <input
                        type="text"
                        value={addressState}
                        onChange={(e) => setAddressState(e.target.value)}
                        maxLength={2}
                        placeholder="UF"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        CEP
                      </label>
                      <input
                        type="text"
                        value={addressPostalCode}
                        onChange={(e) => setAddressPostalCode(e.target.value)}
                        placeholder="00000-000"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* APIs Tab */}
              {activeTab === 'apis' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Configuração de APIs
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Gerencie as APIs externas que esta organização utiliza
                      </p>
                    </div>
                    <button
                      onClick={addAPI}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Nova API
                    </button>
                  </div>
                  
                  {apis.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma API configurada</p>
                      <p className="text-sm mt-1">Clique em "Nova API" para adicionar</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {apis.map((api) => (
                        <div key={api.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={api.enabled}
                                onChange={(e) => updateAPI(api.id, { enabled: e.target.checked })}
                                className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                              />
                              <div>
                                <input
                                  type="text"
                                  value={api.name}
                                  onChange={(e) => updateAPI(api.id, { name: e.target.value })}
                                  className="text-lg font-medium bg-transparent border-b border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-emerald-500 outline-none text-gray-900 dark:text-white"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {api.enabled ? 'Ativa' : 'Inativa'}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => removeAPI(api.id)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                API URL
                              </label>
                              <input
                                type="url"
                                value={api.apiUrl || ''}
                                onChange={(e) => updateAPI(api.id, { apiUrl: e.target.value })}
                                placeholder="https://api.exemplo.com"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                API Key
                              </label>
                              <div className="relative">
                                <input
                                  type={showApiKeys[api.id] ? 'text' : 'password'}
                                  value={api.apiKey || ''}
                                  onChange={(e) => updateAPI(api.id, { apiKey: e.target.value })}
                                  placeholder="sk_live_..."
                                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                />
                                <button
                                  type="button"
                                  onClick={() => toggleShowApiKey(api.id)}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                  {showApiKeys[api.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Integrations Tab */}
              {activeTab === 'integrations' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Integrações
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Gerencie integrações com serviços externos (Google Calendar, Email, Storage, etc)
                      </p>
                    </div>
                    <button
                      onClick={addIntegration}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Nova Integração
                    </button>
                  </div>
                  
                  {integrations.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <Cloud className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma integração configurada</p>
                      <p className="text-sm mt-1">Clique em "Nova Integração" para adicionar</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {integrations.map((integration) => (
                        <div key={integration.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3 flex-1">
                              <input
                                type="checkbox"
                                checked={integration.enabled}
                                onChange={(e) => updateIntegration(integration.id, { enabled: e.target.checked })}
                                className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                              />
                              <div className="flex-1">
                                <input
                                  type="text"
                                  value={integration.name}
                                  onChange={(e) => updateIntegration(integration.id, { name: e.target.value })}
                                  className="font-medium bg-transparent border-b border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-emerald-500 outline-none text-gray-900 dark:text-white w-full"
                                />
                                <select
                                  value={integration.type}
                                  onChange={(e) => updateIntegration(integration.id, { type: e.target.value as any })}
                                  className="text-xs text-gray-500 dark:text-gray-400 mt-1 bg-transparent border-none outline-none"
                                >
                                  <option value="calendar">Calendar</option>
                                  <option value="email">Email</option>
                                  <option value="storage">Storage</option>
                                  <option value="payment">Payment</option>
                                  <option value="crm">CRM</option>
                                  <option value="other">Outro</option>
                                </select>
                              </div>
                            </div>
                            <button
                              onClick={() => removeIntegration(integration.id)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            {integration.enabled ? (
                              <>
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-green-600 dark:text-green-400">Ativa</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-500 dark:text-gray-400">Inativa</span>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Monitoring Tab */}
              {activeTab === 'monitoring' && (
                <div className="space-y-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Monitor de Acessos e Atividade
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Acompanhe em tempo real os acessos simultâneos e cliques dos usuários
                    </p>
                  </div>
                  
                  {/* Info Banner */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                          🎉 Dados de Demonstração - Configuração Futura
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-400 mb-3">
                          Os dados exibidos são simulados. Em produção, podem ser integrados com:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <div className="bg-white dark:bg-gray-800 rounded px-3 py-2 text-xs">
                            <span className="font-semibold text-blue-900 dark:text-blue-300">📊 Google Analytics</span>
                            <p className="text-gray-600 dark:text-gray-400 mt-0.5">Tracking completo de acessos</p>
                          </div>
                          <div className="bg-white dark:bg-gray-800 rounded px-3 py-2 text-xs">
                            <span className="font-semibold text-blue-900 dark:text-blue-300">🔥 Hotjar</span>
                            <p className="text-gray-600 dark:text-gray-400 mt-0.5">Heatmaps e gravações</p>
                          </div>
                          <div className="bg-white dark:bg-gray-800 rounded px-3 py-2 text-xs">
                            <span className="font-semibold text-blue-900 dark:text-blue-300">⚡ Sistema Próprio</span>
                            <p className="text-gray-600 dark:text-gray-400 mt-0.5">API customizada de tracking</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Real-time Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                      <div className="flex items-center justify-between mb-2">
                        <UsersIcon className="w-8 h-8 opacity-80" />
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                          <span className="text-xs opacity-80">LIVE</span>
                        </div>
                      </div>
                      <p className="text-3xl font-bold">{onlineUsers}</p>
                      <p className="text-sm opacity-80 mt-1">Usuários Online Agora</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                      <div className="flex items-center justify-between mb-2">
                        <MousePointer className="w-8 h-8 opacity-80" />
                        <span className="text-xs opacity-80">24h</span>
                      </div>
                      <p className="text-3xl font-bold">{totalClicks24h.toLocaleString()}</p>
                      <p className="text-sm opacity-80 mt-1">Cliques (últimas 24h)</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                      <div className="flex items-center justify-between mb-2">
                        <TrendingUp className="w-8 h-8 opacity-80" />
                        <span className="text-xs opacity-80">PICO</span>
                      </div>
                      <p className="text-3xl font-bold">{peakConcurrentUsers}</p>
                      <p className="text-sm opacity-80 mt-1">Pico de Acessos Simultâneos</p>
                    </div>
                  </div>
                  
                  {/* Concurrent Users Timeline */}
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Acessos Simultâneos (últimas 24h)
                      </h4>
                      <BarChart3 className="w-5 h-5 text-gray-400" />
                    </div>
                    
                    {/* Simple bar chart */}
                    <div className="space-y-3">
                      {[
                        { time: '00:00', users: 2 },
                        { time: '04:00', users: 1 },
                        { time: '08:00', users: 8 },
                        { time: '12:00', users: 12 },
                        { time: '16:00', users: 15 },
                        { time: '20:00', users: 7 },
                        { time: 'Agora', users: onlineUsers }
                      ].map((data, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 dark:text-gray-400 w-12">
                            {data.time}
                          </span>
                          <div className="flex-1 bg-gray-100 dark:bg-gray-600 rounded-full h-6 relative overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                data.time === 'Agora' 
                                  ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' 
                                  : 'bg-gradient-to-r from-blue-400 to-blue-600'
                              }`}
                              style={{ width: `${(data.users / 15) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white w-8">
                            {data.users}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Click Heatmap & Top Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Top Pages */}
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                        Páginas Mais Acessadas
                      </h4>
                      <div className="space-y-3">
                        {[
                          { page: 'Dashboard', visits: 156, color: 'blue' },
                          { page: 'Casos', visits: 89, color: 'purple' },
                          { page: 'Clientes', visits: 67, color: 'green' },
                          { page: 'Agenda', visits: 45, color: 'orange' },
                          { page: 'Documentos', visits: 23, color: 'red' }
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <span className={`w-2 h-2 rounded-full bg-${item.color}-500`}></span>
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {item.page}
                              </span>
                            </div>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {item.visits}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Top Actions */}
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                        Ações Mais Realizadas
                      </h4>
                      <div className="space-y-3">
                        {[
                          { action: 'Criar Novo Caso', clicks: 34, icon: '📋' },
                          { action: 'Editar Cliente', clicks: 28, icon: '✏️' },
                          { action: 'Upload Documento', clicks: 21, icon: '📤' },
                          { action: 'Agendar Reunião', clicks: 18, icon: '📅' },
                          { action: 'Exportar Relatório', clicks: 12, icon: '📊' }
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <span className="text-lg">{item.icon}</span>
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {item.action}
                              </span>
                            </div>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {item.clicks}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Session Details */}
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                      Usuários Online Neste Momento
                    </h4>
                    {onlineUsers === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                        Nenhum usuário online no momento
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {Array.from({ length: onlineUsers }).map((_, idx) => (
                          <div 
                            key={idx} 
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-600 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-sm font-bold">
                                {String.fromCharCode(65 + idx)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  Usuário {idx + 1}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {['Dashboard', 'Casos', 'Clientes', 'Agenda'][idx % 4]}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {Math.floor(Math.random() * 30) + 1}min
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </FartechGuard>
  )
}
