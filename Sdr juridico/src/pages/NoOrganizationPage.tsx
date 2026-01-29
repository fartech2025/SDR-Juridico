import { Building2, LogOut, Mail } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function NoOrganizationPage() {
  const { signOut } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="mx-auto w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center">
            <Building2 className="w-12 h-12 text-orange-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Sem Organizacao Vinculada
        </h1>

        <p className="text-gray-600 mb-2">
          Sua conta nao esta vinculada a nenhuma organizacao.
        </p>

        <p className="text-gray-600 mb-8">
          Entre em contato com o administrador da sua organizacao para que ele envie um convite de acesso.
        </p>

        <div className="bg-gray-100 rounded-lg p-6 mb-8">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            O que fazer?
          </h2>

          <ul className="space-y-3 text-left text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <Mail className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
              <span>Solicite ao administrador da organizacao que envie um convite para o seu email.</span>
            </li>
            <li className="flex items-start gap-2">
              <Building2 className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
              <span>Apos o convite, faca login novamente para acessar o sistema.</span>
            </li>
          </ul>
        </div>

        <button
          onClick={() => signOut()}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sair da conta
        </button>
      </div>
    </div>
  )
}
