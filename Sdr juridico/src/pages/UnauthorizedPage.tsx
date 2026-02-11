// UnauthorizedPage - Page shown when user doesn't have permission
// Date: 2026-01-13

import { useNavigate } from 'react-router-dom'
import { ShieldAlert, ArrowLeft } from 'lucide-react'

export default function UnauthorizedPage() {
  const navigate = useNavigate()
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-alt px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
            <ShieldAlert className="w-12 h-12 text-red-600" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-text mb-4">
          Acesso Negado
        </h1>
        
        <p className="text-text-muted mb-8">
          Você não tem permissão para acessar este recurso. 
          Entre em contato com o administrador da sua organização se você acredita que deveria ter acesso.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center px-6 py-3 border border-border rounded-lg text-text-muted hover:bg-surface-hover transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </button>
          
          <button
            onClick={() => navigate('/app/dashboard')}
            className="inline-flex items-center justify-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Ir para Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
