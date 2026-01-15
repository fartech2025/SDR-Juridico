import * as React from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  BarChart3,
  Bell,
  CalendarClock,
  FileText,
  LayoutDashboard,
  LogOut,
  Power,
  Scale,
  Settings,
  SlidersHorizontal,
  Briefcase,
  Search,
  ChevronDown,
  UserRound,
  Users,
  Menu,
  X,
  Building2,
  Shield,
} from 'lucide-react'

import { useAuth } from '@/contexts/AuthContext'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useIsFartechAdmin } from '@/hooks/useIsFartechAdmin'
import { useIsOrgAdmin } from '@/hooks/useIsOrgAdmin'
import { usePageTracking } from '@/hooks/usePageTracking'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { FontSizeButton } from '@/components/FontSizeControl'
import { ThemeToggle } from '@/components/ThemeToggle'
import { cn } from '@/utils/cn'
import { auditService, sessionService } from '@/services/auditService'

const navItems = [
  { label: 'Dashboard', to: '/app/dashboard', icon: LayoutDashboard },
  { label: 'Leads', to: '/app/leads', icon: Users },
  { label: 'Clientes', to: '/app/clientes', icon: UserRound },
  { label: 'Casos', to: '/app/casos', icon: Briefcase },
  { label: 'Agenda', to: '/app/agenda', icon: CalendarClock },
  { label: 'Documentos', to: '/app/documentos', icon: FileText },
  { label: 'Indicadores', to: '/app/indicadores', icon: BarChart3 },
  { label: 'Configuracoes', to: '/app/config', icon: Settings },
]

const adminNavItems = [
  { label: 'Organizacoes', to: '/admin/organizations', icon: Building2 },
  { label: 'Usuarios', to: '/admin/users', icon: Shield },
]

const orgAdminNavItems = [
  { label: 'Configuracoes Org', to: '/org/settings', icon: Settings },
  { label: 'Usuarios da Org', to: '/org/users', icon: Users },
]

export const AppShell = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { signOut } = useAuth()
  const { displayName, shortName, initials, roleLabel, orgName } = useCurrentUser()
  const isFartechAdmin = useIsFartechAdmin()
  const isOrgAdmin = useIsOrgAdmin()
  const [logoutOpen, setLogoutOpen] = React.useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  // Track page views automaticamente
  usePageTracking()

  // Debug logs
  React.useEffect(() => {
    console.log('👤 AppShell User Info:', { 
      displayName, 
      isFartechAdmin, 
      isOrgAdmin, 
      location: location.pathname 
    })
  }, [displayName, isFartechAdmin, isOrgAdmin, location.pathname])

  // Redirect Fartech Admin to /admin if accessing /app
  React.useEffect(() => {
    // Only redirect if we're sure about the admin status (not loading)
    // Wait a bit to ensure OrganizationProvider has loaded
    const timer = setTimeout(() => {
      if (isFartechAdmin && location.pathname.startsWith('/app')) {
        console.log('🔄 Redirecting Fartech Admin from', location.pathname, 'to /admin/organizations')
        navigate('/admin/organizations', { replace: true })
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [isFartechAdmin, location.pathname, navigate])

  const handleLogout = async () => {
    setLogoutOpen(false)
    // Log de logout e encerrar sessão
    await auditService.logLogout()
    sessionService.end()
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] dark:bg-gray-900 text-text dark:text-gray-100">
      {/* Sidebar - Responsivo */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-60 flex-col border-r border-border dark:border-gray-700 bg-gradient-to-b from-[#f7f8fc] via-[#f7f8fc] to-[#eef2fb] dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 shadow-soft lg:flex">
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-[#ff6aa2] via-[#ff8fb1] to-[#6aa8ff] text-white shadow-soft">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-text-subtle dark:text-gray-400">
              SDR
            </p>
            <p className="text-sm font-semibold text-text dark:text-white">Juridico Online</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2 px-4">
          {/* Admin Menu for Fartech */}
          {isFartechAdmin && adminNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition',
                  isActive
                    ? 'bg-[#E9EEFF] text-primary'
                    : 'text-text-muted hover:bg-[#F2F5FF] hover:text-text',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      'h-4 w-4',
                      isActive
                        ? 'text-primary'
                        : 'text-text-subtle group-hover:text-primary',
                    )}
                  />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* Regular Menu */}
          {!isFartechAdmin && navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition',
                  isActive
                    ? 'bg-[#E9EEFF] text-primary'
                    : 'text-text-muted hover:bg-[#F2F5FF] hover:text-text',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      'h-4 w-4',
                      isActive
                        ? 'text-primary'
                        : 'text-text-subtle group-hover:text-primary',
                    )}
                  />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* Org Admin Menu */}
          {!isFartechAdmin && isOrgAdmin && (
            <>
              <div className="my-4 border-t border-border/50" />
              {orgAdminNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition',
                      isActive
                        ? 'bg-[#E9EEFF] text-primary'
                        : 'text-text-muted hover:bg-[#F2F5FF] hover:text-text',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className={cn(
                          'h-4 w-4',
                          isActive
                            ? 'text-primary'
                            : 'text-text-subtle group-hover:text-primary',
                        )}
                      />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* User Profile Section */}
        <div className="border-t border-border/50 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-semibold text-white">
              {initials}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-text dark:text-white">
                {shortName}
              </p>
              <p className="text-xs text-text-subtle dark:text-gray-400">{roleLabel}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-20 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-16 w-64 max-h-[calc(100vh-64px)] flex-col overflow-y-auto border-r border-border dark:border-gray-700 bg-white dark:bg-gray-800 shadow-soft">
            <nav className="space-y-2 p-4">
              {/* Admin Menu for Fartech (Mobile) */}
              {isFartechAdmin && adminNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition',
                      isActive
                        ? 'bg-[#E9EEFF] text-primary'
                        : 'text-text-muted hover:bg-[#F2F5FF] hover:text-text',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className={cn(
                          'h-4 w-4',
                          isActive
                            ? 'text-primary'
                            : 'text-text-subtle group-hover:text-primary',
                        )}
                      />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}

              {/* Regular Menu (Mobile) */}
              {!isFartechAdmin && navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition',
                      isActive
                        ? 'bg-[#E9EEFF] text-primary'
                        : 'text-text-muted hover:bg-[#F2F5FF] hover:text-text',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className={cn(
                          'h-4 w-4',
                          isActive
                            ? 'text-primary'
                            : 'text-text-subtle group-hover:text-primary',
                        )}
                      />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}

              {/* Org Admin Menu (Mobile) */}
              {!isFartechAdmin && isOrgAdmin && (
                <>
                  <div className="my-4 border-t border-border/50" />
                  {orgAdminNavItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition',
                          isActive
                            ? 'bg-[#E9EEFF] text-primary'
                            : 'text-text-muted hover:bg-[#F2F5FF] hover:text-text',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon
                            className={cn(
                              'h-4 w-4',
                              isActive
                                ? 'text-primary'
                                : 'text-text-subtle group-hover:text-primary',
                            )}
                          />
                          <span>{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* Header - Responsivo */}
      <header className="fixed left-0 right-0 top-0 z-20 flex h-16 items-center justify-between border-b border-border/70 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 px-4 shadow-soft backdrop-blur lg:left-60 lg:px-8">
        {/* Logo/Menu Mobile */}
        <div className="flex items-center gap-3 lg:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-full"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Desktop greeting */}
        <div className="hidden items-center gap-3 lg:flex">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {initials}
          </div>
          <div>
            <p className="text-xs text-text-subtle dark:text-gray-400">Bom dia</p>
            <p className="text-sm font-semibold text-text dark:text-white">{displayName}</p>
          </div>
        </div>

        {/* Right actions - Responsivo */}
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="relative hidden items-center gap-2 rounded-full border border-border dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-text-muted dark:text-gray-400 shadow-soft md:flex">
            <Search className="h-4 w-4 text-text-subtle dark:text-gray-500" />
            <input
              placeholder="Pesquisar..."
              className="w-44 bg-transparent text-sm text-text dark:text-gray-200 placeholder:text-text-subtle dark:placeholder:text-gray-500 focus:outline-none"
            />
            <span className="ml-1 flex h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-gray-700 text-xs font-semibold text-primary dark:text-blue-400 shadow-soft">
              3
            </span>
          </div>

          {/* Controle de Tamanho de Fonte */}
          <FontSizeButton />

          {/* Theme Toggle */}
          <ThemeToggle />

          <Button variant="ghost" size="sm" className="relative rounded-full">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-danger" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="rounded-full hidden sm:inline-flex"
            onClick={() => navigate('/app/config')}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden md:inline ml-1">Preferencias</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="rounded-full hidden sm:inline-flex"
            onClick={() => setLogoutOpen(true)}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden md:inline ml-1">Sair</span>
          </Button>

          <div className="hidden items-center gap-2 rounded-full border border-border dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-text dark:text-gray-200 shadow-soft sm:flex">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 dark:bg-blue-900/30 text-[10px] font-semibold text-primary dark:text-blue-300">
              {initials}
            </div>
            <span>{shortName}</span>
            <ChevronDown className="h-3 w-3 text-text-subtle dark:text-gray-400" />
          </div>
        </div>
      </header>

      <main className="relative min-h-screen bg-[#f7f8fc] dark:bg-gray-900 pt-16 lg:pl-60">
        <div className="px-4 py-6 md:px-8">
          <Outlet />
        </div>
        <div className="pointer-events-none absolute bottom-6 right-6 opacity-10 md:bottom-10 md:right-10">
          <img
            src="https://xocqcoebreoiaqxoutar.supabase.co/storage/v1/object/public/Imagens%20Page/Imagens%20pagina/TALENT%20SDR%20SEM%20FUNDO.png"
            alt="Talent SDR Juridico"
            className="w-48 max-w-[60vw] md:w-64 dark:brightness-125 dark:contrast-110"
            loading="lazy"
          />
        </div>
      </main>

      <Modal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        className="max-w-md text-center"
        footer={
          <>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setLogoutOpen(false)}
            >
              Cancelar
            </Button>
            <Button variant="danger" className="flex-1" onClick={handleLogout}>
              Sair
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger/15 text-danger">
            <Power className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold text-text">
            Deseja sair do sistema?
          </h3>
          <p className="text-xs text-text-muted">
            Sua sessao sera encerrada com seguranca.
          </p>
        </div>
      </Modal>
    </div>
  )
}
