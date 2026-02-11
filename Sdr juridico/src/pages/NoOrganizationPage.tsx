import { Building2, LogOut, Mail } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function NoOrganizationPage() {
  const { signOut } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-alt px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="mx-auto w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center">
            <Building2 className="w-12 h-12 text-orange-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-text mb-4">
          Sem Organizacao Vinculada
        </h1>

        <p className="text-text-muted mb-2">
          Sua conta nao esta vinculada a nenhuma organizacao.
        </p>

        <p className="text-text-muted mb-8">
          Entre em contato com o administrador da sua organizacao para que ele envie um convite de acesso.
        </p>

        <div className="bg-surface-alt rounded-lg p-6 mb-8">
          <h2 className="text-sm font-semibold text-text mb-4">
            O que fazer?
          </h2>

          <ul className="space-y-3 text-left text-sm text-text-muted">
            <li className="flex items-start gap-2">
              <Mail className="w-4 h-4 mt-0.5 text-text-subtle shrink-0" />
              <span>Solicite ao administrador da organizacao que envie um convite para o seu email.</span>
            </li>
            <li className="flex items-start gap-2">
              <Building2 className="w-4 h-4 mt-0.5 text-text-subtle shrink-0" />
              <span>Apos o convite, faca login novamente para acessar o sistema.</span>
            </li>
          </ul>
        </div>

        <button
          onClick={() => signOut()}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sair da conta
        </button>
      </div>
    </div>
  )
}
