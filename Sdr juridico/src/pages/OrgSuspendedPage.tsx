// OrgSuspendedPage - Page shown when organization is suspended
// Date: 2026-01-13

import { Building2, Mail } from 'lucide-react'
import { useOrganization } from '@/hooks/useOrganization'

export default function OrgSuspendedPage() {
  const { currentOrg } = useOrganization()
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="mx-auto w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center">
            <Building2 className="w-12 h-12 text-yellow-600" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Organização Suspensa
        </h1>
        
        <p className="text-gray-600 mb-2">
          A organização <strong>{currentOrg?.name}</strong> está atualmente suspensa.
        </p>
        
        <p className="text-gray-600 mb-8">
          Entre em contato com o suporte para resolver esta situação e reativar sua conta.
        </p>
        
        <div className="bg-gray-100 rounded-lg p-6 mb-8">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Informações de Contato
          </h2>
          
          <div className="space-y-3 text-left">
            <div className="flex items-center text-gray-600">
              <Mail className="w-4 h-4 mr-3" />
              <span>suporte@fartech.com.br</span>
            </div>
          </div>
        </div>
        
        {currentOrg?.plan === 'trial' && (
          <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
            Sua organização está em período de teste. Entre em contato para ativar um plano.
          </div>
        )}
      </div>
    </div>
  )
}
