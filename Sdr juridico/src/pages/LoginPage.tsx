import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Logo } from '@/components/ui/Logo'
import { useAuth } from '@/contexts/AuthContext'
import { permissionsService } from '@/services/permissionsService'
import { usePermissions } from '@/hooks/usePermissions'

export const LoginPage = () => {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const { refreshPermissions } = usePermissions()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)

    if (!email.trim() || !password.trim()) {
      setIsLoading(false)
      toast.error('Credenciais obrigatorias.')
      return
    }

    const { error } = await signIn(email.trim(), password.trim())
    if (error) {
      setIsLoading(false)
      toast.error('Falha no login: ' + (error.message || 'verifique seus dados'))
      return
    }

    toast.success('Acesso liberado.')

    const resolveUserProfile = async () => {
      let lastUser = null as Awaited<ReturnType<typeof permissionsService.getCurrentUser>>
      for (let attempt = 0; attempt < 5; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 150))
        lastUser = await permissionsService.getCurrentUser()
        if (lastUser) return lastUser
      }
      return lastUser
    }

    await refreshPermissions()
    const currentUser = await resolveUserProfile()

    if (currentUser?.is_fartech_admin === true) {
      toast.info(`Bem-vindo, Admin Fartech!`)
      navigate('/admin/organizations', { replace: true })
    } else {
      toast.info(`Bem-vindo, ${currentUser?.name || currentUser?.email}!`)
      navigate('/app/dashboard', { replace: true })
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Left Side - Branding */}
      <div
        className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #721011 0%, #4A0B0C 50%, #2D0707 100%)' }}
      >
        {/* Decorative Elements */}
        <div className="absolute inset-0">
          {/* Grid Pattern */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
            }}
          />

          {/* Shield Shape Background - Large */}
          <svg
            className="absolute right-0 top-1/2 -translate-y-1/2 opacity-5"
            width="600"
            height="700"
            viewBox="0 0 200 240"
          >
            <path
              d="M100 0 L200 40 L200 140 C200 200 100 240 100 240 C100 240 0 200 0 140 L0 40 Z"
              fill="white"
            />
          </svg>

          {/* Subtle glow effects */}
          <div
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
              filter: 'blur(80px)',
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-20 w-full h-full">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              {/* Logo SVG - Same colors as Logo component */}
              <svg width="56" height="64" viewBox="0 0 56 64" fill="none">
                <path
                  d="M0 8 L0 0 L28 0 L28 8 L8 8 L8 48 C8 52 12 56 20 56 L20 64 C4 64 0 56 0 48 Z"
                  fill="#721011"
                />
                <path
                  d="M56 8 L56 0 L28 0 L28 8 L48 8 L48 48 C48 52 44 56 36 56 L36 64 C52 64 56 56 56 48 Z"
                  fill="#6B5E58"
                />
              </svg>
              <div className="ml-3">
                <span className="text-3xl font-bold text-white tracking-tight">Talent</span>
                <span className="text-3xl font-bold tracking-tight" style={{ color: '#A89A94' }}>
                  JUD
                </span>
              </div>
            </div>
          </div>

          {/* Central Illustration - Premium Legal Software Image */}
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="relative w-full max-w-lg">
              {/* Abstract Legal/Shield Illustration */}
              <svg
                viewBox="0 0 400 350"
                fill="none"
                className="w-full h-auto drop-shadow-2xl"
              >
                {/* Main Shield */}
                <path
                  d="M200 20 L350 70 L350 180 C350 260 200 320 200 320 C200 320 50 260 50 180 L50 70 Z"
                  fill="url(#shieldGradient)"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="2"
                />

                {/* Inner Shield Glow */}
                <path
                  d="M200 50 L320 90 L320 175 C320 235 200 285 200 285 C200 285 80 235 80 175 L80 90 Z"
                  fill="url(#innerGlow)"
                  opacity="0.6"
                />

                {/* Scale of Justice Icon */}
                <g transform="translate(140, 100)">
                  {/* Central Pillar */}
                  <rect x="55" y="40" width="10" height="120" fill="rgba(255,255,255,0.9)" rx="2"/>

                  {/* Top Bar */}
                  <rect x="20" y="35" width="80" height="8" fill="rgba(255,255,255,0.9)" rx="2"/>

                  {/* Left Scale */}
                  <circle cx="30" cy="90" r="25" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="3"/>
                  <line x1="30" y1="43" x2="30" y2="65" stroke="rgba(255,255,255,0.8)" strokeWidth="2"/>

                  {/* Right Scale */}
                  <circle cx="90" cy="90" r="25" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="3"/>
                  <line x1="90" y1="43" x2="90" y2="65" stroke="rgba(255,255,255,0.8)" strokeWidth="2"/>

                  {/* Base */}
                  <rect x="35" y="160" width="50" height="10" fill="rgba(255,255,255,0.9)" rx="2"/>
                  <rect x="45" y="155" width="30" height="8" fill="rgba(255,255,255,0.7)" rx="2"/>
                </g>

                {/* Lock Icon (Security) */}
                <g transform="translate(175, 240)">
                  <rect x="10" y="15" width="30" height="25" fill="rgba(255,255,255,0.9)" rx="3"/>
                  <path d="M15 15 L15 8 C15 2 20 0 25 0 C30 0 35 2 35 8 L35 15" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="4" strokeLinecap="round"/>
                  <circle cx="25" cy="27" r="4" fill="#721011"/>
                </g>

                {/* Decorative Elements */}
                <circle cx="80" cy="60" r="8" fill="rgba(255,255,255,0.2)"/>
                <circle cx="320" cy="60" r="8" fill="rgba(255,255,255,0.2)"/>
                <circle cx="60" cy="200" r="5" fill="rgba(255,255,255,0.15)"/>
                <circle cx="340" cy="200" r="5" fill="rgba(255,255,255,0.15)"/>

                {/* Gradients */}
                <defs>
                  <linearGradient id="shieldGradient" x1="50" y1="20" x2="350" y2="320">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.25)"/>
                    <stop offset="50%" stopColor="rgba(255,255,255,0.15)"/>
                    <stop offset="100%" stopColor="rgba(255,255,255,0.05)"/>
                  </linearGradient>
                  <radialGradient id="innerGlow" cx="50%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.3)"/>
                    <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
                  </radialGradient>
                </defs>
              </svg>

              {/* Floating badges */}
              <div className="absolute -left-4 top-1/4 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="text-white text-sm font-medium">Seguro</span>
                </div>
              </div>

              <div className="absolute -right-4 top-1/3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-white text-sm font-medium">Eficiente</span>
                </div>
              </div>

              <div className="absolute left-1/4 -bottom-4 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="text-white text-sm font-medium">Organizado</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Text */}
          <div className="text-center">
            <p className="text-white/60 text-sm">
              Plataforma completa para gestao juridica
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-12">
            <Logo size="md" />
          </div>

          {/* Header */}
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Bem-vindo de volta</h2>
            <p className="text-gray-500">Acesse sua conta para continuar</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  style={
                    {
                      '--tw-ring-color': 'rgba(114, 16, 17, 0.3)',
                    } as React.CSSProperties
                  }
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  style={
                    {
                      '--tw-ring-color': 'rgba(114, 16, 17, 0.3)',
                    } as React.CSSProperties
                  }
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5 text-gray-400 hover:text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 text-gray-400 hover:text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-red-800 focus:ring-red-800"
                  style={{ accentColor: '#721011' }}
                />
                <span className="text-sm text-gray-600">Lembrar-me</span>
              </label>
              <a href="#" className="text-sm font-medium hover:underline" style={{ color: '#721011' }}>
                Esqueceu a senha?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 rounded-xl text-white font-semibold text-base transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-70"
              style={{
                backgroundColor: '#721011',
                boxShadow: '0 4px 14px 0 rgba(114, 16, 17, 0.3)',
              }}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Entrando...</span>
                </>
              ) : (
                <>
                  <span>Entrar</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-gray-400">ou continue com</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 py-3 px-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-sm font-medium text-gray-700">Google</span>
            </button>
            <button className="flex items-center justify-center gap-2 py-3 px-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Facebook</span>
            </button>
          </div>

          {/* Sign Up Link */}
          <p className="mt-10 text-center text-gray-500">
            Nao tem uma conta?{' '}
            <a href="#" className="font-semibold hover:underline" style={{ color: '#721011' }}>
              Solicitar acesso
            </a>
          </p>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-gray-400">
            © 2026 TalentJUD. Todos os direitos reservados.
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

        input:focus {
          --tw-ring-color: rgba(114, 16, 17, 0.3);
          box-shadow: 0 0 0 2px var(--tw-ring-color);
          border-color: #721011;
        }
      `}</style>
    </div>
  )
}
